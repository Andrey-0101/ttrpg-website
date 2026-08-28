import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  CAMPAIGN_DESCRIPTION_MAX_LENGTH,
  CAMPAIGN_NAME_MAX_LENGTH,
  validateCampaignCreationInput,
} from "../../lib/campaigns/creation";

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
  assert.match(creatorSource, /if \(createLockRef\.current\)/u);
  assert.match(creatorSource, /await createCampaignAction\(/u);
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
