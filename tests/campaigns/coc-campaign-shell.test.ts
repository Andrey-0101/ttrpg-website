import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  CAMPAIGN_DESCRIPTION_MAX_LENGTH,
  CAMPAIGN_NAME_MAX_LENGTH,
  validateCampaignCreationInput,
} from "../../lib/campaigns/creation";
import {
  createCampaignCreationSubmissionState,
  getCampaignHref,
  submitCampaignCreation,
  type CampaignCreationActionResult,
} from "../../lib/campaigns/creation-navigation";

type TestCampaignInput = {
  name: string;
  description: string;
  gameSystem: "vtm-v5" | "call-of-cthulhu-7e";
};

function createSubmissionHarness({
  result,
  navigate = () => undefined,
}: {
  result: CampaignCreationActionResult;
  navigate?: (href: string) => void;
}) {
  const state = createCampaignCreationSubmissionState();
  const actionInputs: TestCampaignInput[] = [];
  const navigationPaths: string[] = [];
  const creatingStates: boolean[] = [];
  const failures: string[] = [];
  const createdIds: string[] = [];
  let authenticationRequired = 0;
  let navigationFailures = 0;

  return {
    state,
    actionInputs,
    navigationPaths,
    creatingStates,
    failures,
    createdIds,
    get authenticationRequired() {
      return authenticationRequired;
    },
    get navigationFailures() {
      return navigationFailures;
    },
    dependencies: {
      createCampaign: async (input: TestCampaignInput) => {
        actionInputs.push(input);
        return result;
      },
      requestLoginNavigation: () => true,
      allowCampaignNavigation: () => undefined,
      navigate: (href: string) => {
        navigationPaths.push(href);
        navigate(href);
      },
      setCreating: (creating: boolean) => creatingStates.push(creating),
      onFailure: (error: string) => failures.push(error),
      onAuthenticationRequired: () => {
        authenticationRequired += 1;
      },
      onCreated: (campaignId: string) => createdIds.push(campaignId),
      onNavigationFailure: () => {
        navigationFailures += 1;
      },
    },
  };
}

test("campaign creation validation accepts VtM and Call of Cthulhu 7e", () => {
  for (const gameSystem of ["vtm-v5", "call-of-cthulhu-7e"] as const) {
    assert.deepEqual(
      validateCampaignCreationInput({
        name: "  The campaign  ",
        description: "  A safe description  ",
        gameSystem,
      }),
      {
        ok: true,
        value: {
          name: "The campaign",
          description: "A safe description",
          gameSystem,
        },
      },
    );
  }
});

test("campaign creation requests one localized transition for both systems", async () => {
  const campaignId = "11111111-2222-4333-8444-555555555555";

  for (const locale of ["en", "ru"] as const) {
    for (const gameSystem of [
      "vtm-v5",
      "call-of-cthulhu-7e",
    ] as const) {
      const input: TestCampaignInput = {
        name: `${locale} campaign`,
        description: "Safe description",
        gameSystem,
      };
      const harness = createSubmissionHarness({
        result: { ok: true, campaignId },
      });

      const outcome = await submitCampaignCreation({
        input,
        state: harness.state,
        dependencies: harness.dependencies,
      });

      assert.deepEqual(outcome, { kind: "created", campaignId });
      assert.deepEqual(harness.actionInputs, [input]);
      assert.deepEqual(harness.navigationPaths, [getCampaignHref(campaignId)]);
      assert.deepEqual(harness.creatingStates, [true, false]);
      assert.deepEqual(harness.createdIds, [campaignId]);
      assert.equal(harness.state.inFlight, false);
      assert.equal(harness.state.createdCampaignId, campaignId);
    }
  }

  const creatorSource = readFileSync(
    resolve("components/campaigns/campaign-creator.tsx"),
    "utf8",
  );
  const routingSource = readFileSync(resolve("i18n/routing.ts"), "utf8");

  assert.match(creatorSource, /useRouter.*@\/i18n\/navigation/u);
  assert.doesNotMatch(creatorSource, /router\.refresh\(/u);
  assert.match(routingSource, /locales: \["en", "ru"\]/u);
  assert.match(routingSource, /localePrefix: "always"/u);
});

test("campaign creation blocks duplicate submissions while the action is pending", async () => {
  const campaignId = "11111111-2222-4333-8444-555555555555";
  const state = createCampaignCreationSubmissionState();
  const input: TestCampaignInput = {
    name: "Pending campaign",
    description: "",
    gameSystem: "vtm-v5",
  };
  const navigationPaths: string[] = [];
  const creatingStates: boolean[] = [];
  let actionCalls = 0;
  let resolveAction!: (result: CampaignCreationActionResult) => void;
  const actionResult = new Promise<CampaignCreationActionResult>((resolve) => {
    resolveAction = resolve;
  });
  const dependencies = {
    createCampaign: async () => {
      actionCalls += 1;
      return actionResult;
    },
    requestLoginNavigation: () => true,
    allowCampaignNavigation: () => undefined,
    navigate: (href: string) => navigationPaths.push(href),
    setCreating: (creating: boolean) => creatingStates.push(creating),
    onFailure: () => undefined,
    onAuthenticationRequired: () => undefined,
    onCreated: () => undefined,
    onNavigationFailure: () => undefined,
  };

  const firstSubmission = submitCampaignCreation({
    input,
    state,
    dependencies,
  });
  const duplicateOutcome = await submitCampaignCreation({
    input,
    state,
    dependencies,
  });

  assert.deepEqual(duplicateOutcome, { kind: "duplicate_blocked" });
  assert.equal(actionCalls, 1);

  resolveAction({ ok: true, campaignId });
  await firstSubmission;

  assert.equal(actionCalls, 1);
  assert.deepEqual(navigationPaths, [getCampaignHref(campaignId)]);
  assert.deepEqual(creatingStates, [true, false]);
  assert.equal(state.inFlight, false);
});

test("campaign creation failures and login transitions always release the lock", async () => {
  const input: TestCampaignInput = {
    name: "Recovery campaign",
    description: "",
    gameSystem: "call-of-cthulhu-7e",
  };

  for (const result of [
    { ok: false, error: "create_failed" },
    { ok: false, error: "unauthenticated" },
  ] as const) {
    const harness = createSubmissionHarness({ result });

    await submitCampaignCreation({
      input,
      state: harness.state,
      dependencies: harness.dependencies,
    });

    assert.deepEqual(harness.creatingStates, [true, false]);
    assert.equal(harness.state.inFlight, false);

    if (result.error === "unauthenticated") {
      assert.deepEqual(harness.navigationPaths, ["/login"]);
      assert.equal(harness.authenticationRequired, 1);
    } else {
      assert.deepEqual(harness.failures, ["create_failed"]);
    }
  }
});

test("a failed navigation keeps the returned campaign id for insert-free recovery", async () => {
  const campaignId = "11111111-2222-4333-8444-555555555555";
  const input: TestCampaignInput = {
    name: "Created campaign",
    description: "",
    gameSystem: "call-of-cthulhu-7e",
  };
  let navigationAttempts = 0;
  const harness = createSubmissionHarness({
    result: { ok: true, campaignId },
    navigate: () => {
      navigationAttempts += 1;
      if (navigationAttempts === 1) {
        throw new Error("Synthetic navigation failure");
      }
    },
  });

  const firstOutcome = await submitCampaignCreation({
    input,
    state: harness.state,
    dependencies: harness.dependencies,
  });
  const recoveryOutcome = await submitCampaignCreation({
    input,
    state: harness.state,
    dependencies: harness.dependencies,
  });

  assert.deepEqual(firstOutcome, { kind: "navigation_failed", campaignId });
  assert.deepEqual(recoveryOutcome, {
    kind: "recovery_navigation_requested",
    campaignId,
  });
  assert.equal(harness.actionInputs.length, 1);
  assert.deepEqual(harness.navigationPaths, [
    getCampaignHref(campaignId),
    getCampaignHref(campaignId),
  ]);
  assert.equal(harness.navigationFailures, 1);
  assert.equal(harness.state.inFlight, false);
  assert.equal(harness.state.createdCampaignId, campaignId);
});

test("campaign creation validation rejects planned and malformed values", () => {
  assert.deepEqual(
    validateCampaignCreationInput({
      name: "Planned system",
      description: "",
      gameSystem: "alien",
    }),
    { ok: false, error: "game_system_unavailable" },
  );
  assert.deepEqual(
    validateCampaignCreationInput({
      name: "Unknown system",
      description: "",
      gameSystem: "unknown-system",
    }),
    { ok: false, error: "game_system_unavailable" },
  );
  assert.deepEqual(
    validateCampaignCreationInput({
      name: " ",
      description: "",
      gameSystem: "call-of-cthulhu-7e",
    }),
    { ok: false, error: "invalid_input" },
  );
  assert.deepEqual(
    validateCampaignCreationInput({
      name: "x".repeat(CAMPAIGN_NAME_MAX_LENGTH + 1),
      description: "",
      gameSystem: "call-of-cthulhu-7e",
    }),
    { ok: false, error: "invalid_input" },
  );
  assert.deepEqual(
    validateCampaignCreationInput({
      name: "Valid",
      description: "x".repeat(CAMPAIGN_DESCRIPTION_MAX_LENGTH + 1),
      gameSystem: "call-of-cthulhu-7e",
    }),
    { ok: false, error: "invalid_input" },
  );
});

test("campaign display keeps CoC character creation planned in both locales", () => {
  const english = JSON.parse(
    readFileSync(resolve("messages/en.json"), "utf8"),
  ) as Record<string, Record<string, unknown>>;
  const russian = JSON.parse(
    readFileSync(resolve("messages/ru.json"), "utf8"),
  ) as typeof english;

  assert.equal(
    (english.GameSystemCatalogue.systems as Record<string, { name: string }>)[
      "callOfCthulhu"
    ]?.name,
    "Call of Cthulhu 7th Edition",
  );
  assert.equal(
    (russian.GameSystemCatalogue.systems as Record<string, { name: string }>)[
      "callOfCthulhu"
    ]?.name,
    "Call of Cthulhu 7-я редакция",
  );
  assert.deepEqual(
    Object.keys(english.CampaignCharacters).sort(),
    Object.keys(russian.CampaignCharacters).sort(),
  );
  assert.ok(String(english.CampaignCharacters.plannedDescription).trim());
  assert.ok(String(russian.CampaignCharacters.plannedDescription).trim());

  for (const sourcePath of [
    "components/campaigns/campaign-summary-card.tsx",
    "app/[locale]/campaigns/[id]/page.tsx",
  ]) {
    const source = readFileSync(resolve(sourcePath), "utf8");
    assert.match(source, /getGameSystemTranslationKey/u);
    assert.match(source, /systems\.\$\{gameSystemTranslationKey\}\.name/u);
  }
});

test("campaign creation crosses a validated authenticated server boundary", () => {
  const actionSource = readFileSync(
    resolve("app/[locale]/campaigns/new/actions.ts"),
    "utf8",
  );
  const serverSource = readFileSync(
    resolve("lib/campaigns/creation.server.ts"),
    "utf8",
  );
  const creatorSource = readFileSync(
    resolve("components/campaigns/campaign-creator.tsx"),
    "utf8",
  );

  assert.match(actionSource, /^"use server";/u);
  assert.match(serverSource, /import "server-only"/u);
  assert.ok(
    serverSource.indexOf("validateCampaignCreationInput(input)") <
      serverSource.indexOf("supabase.auth.getUser()"),
  );
  assert.ok(
    serverSource.indexOf("supabase.auth.getUser()") <
      serverSource.indexOf('.from("campaigns")'),
  );
  assert.match(creatorSource, /creationSubmissionRef/u);
  assert.match(creatorSource, /createCampaign: createCampaignAction/u);
  assert.match(
    creatorSource,
    /enabled: hasUnsavedChanges && !createdCampaignId/u,
  );
  assert.doesNotMatch(creatorSource, /router\.refresh\(/u);
  assert.doesNotMatch(creatorSource, /\.from\("campaigns"\)/u);
});

test("campaign character filtering and database trigger enforce system compatibility", () => {
  const campaignPage = readFileSync(
    resolve("app/[locale]/campaigns/[id]/page.tsx"),
    "utf8",
  );
  const campaignPanel = readFileSync(
    resolve("components/campaigns/campaign-characters-panel.tsx"),
    "utf8",
  );
  const campaignMigration = readFileSync(
    resolve("supabase/migrations/20260709150000_campaign_foundation.sql"),
    "utf8",
  );

  assert.match(
    campaignPage,
    /\.eq\("game_system", campaign\.game_system\)/u,
  );
  assert.match(
    campaignPage,
    /characterCreationCapability\?\.status === "planned"/u,
  );
  assert.match(campaignPanel, /translations\("plannedDescription"/u);
  assert.match(
    campaignMigration,
    /character_game_system <> campaign_game_system/u,
  );
  assert.match(
    campaignMigration,
    /Character and campaign game systems must match/u,
  );
  assert.match(
    campaignMigration,
    /create trigger campaign_characters_enforce_rules[\s\S]*execute function public\.enforce_campaign_character_rules\(\)/u,
  );
});
