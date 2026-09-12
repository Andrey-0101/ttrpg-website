import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  getGameSystem,
  getGameSystemName,
  getGameSystemTranslationKey,
  normalizeGameSystemId,
} from "../../lib/characters/game-systems";
import {
  GAME_SYSTEM_CAPABILITIES,
  GAME_SYSTEM_CATALOGUE,
  getGameSystemCatalogueEntry,
  type GameSystemCapabilityState,
} from "../../lib/game-systems/catalogue";

const EXPECTED_SYSTEM_IDS = [
  "vtm-v5",
  "alien",
  "black-powder-and-brimstone",
  "call-of-cthulhu-7e",
  "coriolis",
  "cyberpunk-red",
  "delta-green",
  "forbidden-lands",
  "ironsworn",
  "mothership",
  "paranoia",
  "traveller-mongoose",
] as const;

const EXPECTED_ACTION_KEYS = [
  "openGameArea",
  "createCharacter",
  "selectForCampaign",
  "openDiceRoller",
] as const;

const PROTOTYPE_DERIVED_SYSTEM_IDS = [
  "toString",
  "constructor",
  "hasOwnProperty",
  "__proto__",
  "**proto**",
] as const;

test("game-system catalogue uses the approved canonical order", () => {
  assert.deepEqual(
    GAME_SYSTEM_CATALOGUE.map((system) => system.id),
    EXPECTED_SYSTEM_IDS,
  );
});

test("game-system IDs and translation keys are unique", () => {
  const ids = GAME_SYSTEM_CATALOGUE.map((system) => system.id);
  const translationKeys = GAME_SYSTEM_CATALOGUE.map(
    (system) => system.translationKey,
  );

  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(translationKeys).size, translationKeys.length);
});

test("catalogue lookup rejects inherited prototype keys", () => {
  for (const systemId of PROTOTYPE_DERIVED_SYSTEM_IDS) {
    assert.equal(getGameSystemCatalogueEntry(systemId), null);
    assert.equal(normalizeGameSystemId(systemId), null);
  }

  assert.equal(getGameSystemCatalogueEntry("vtm-v5")?.id, "vtm-v5");
  assert.equal(normalizeGameSystemId("vtm-v5"), "vtm-v5");
});

test("English and Russian catalogue metadata is complete and aligned", () => {
  const englishMessages = JSON.parse(
    readFileSync(resolve(process.cwd(), "messages/en.json"), "utf8"),
  ) as {
    GameSystemCatalogue: {
      available: string;
      planned: string;
      actions: Record<string, string>;
      systems: Record<string, { name: string; description: string }>;
    };
  };
  const russianMessages = JSON.parse(
    readFileSync(resolve(process.cwd(), "messages/ru.json"), "utf8"),
  ) as typeof englishMessages;
  const expectedKeys = GAME_SYSTEM_CATALOGUE.map(
    (system) => system.translationKey,
  );

  assert.deepEqual(
    Object.keys(englishMessages.GameSystemCatalogue.systems),
    expectedKeys,
  );
  assert.deepEqual(
    Object.keys(russianMessages.GameSystemCatalogue.systems),
    expectedKeys,
  );
  assert.equal(englishMessages.GameSystemCatalogue.available, "Available");
  assert.equal(englishMessages.GameSystemCatalogue.planned, "Planned");
  assert.equal(russianMessages.GameSystemCatalogue.available, "Доступно");
  assert.equal(russianMessages.GameSystemCatalogue.planned, "Запланировано");
  assert.deepEqual(
    Object.keys(englishMessages.GameSystemCatalogue.actions),
    EXPECTED_ACTION_KEYS,
  );
  assert.deepEqual(
    Object.keys(russianMessages.GameSystemCatalogue.actions),
    EXPECTED_ACTION_KEYS,
  );

  for (const actionKey of EXPECTED_ACTION_KEYS) {
    assert.ok(
      englishMessages.GameSystemCatalogue.actions[actionKey].trim(),
    );
    assert.ok(
      russianMessages.GameSystemCatalogue.actions[actionKey].trim(),
    );
  }

  for (const translationKey of expectedKeys) {
    for (const messages of [englishMessages, russianMessages]) {
      const metadata = messages.GameSystemCatalogue.systems[translationKey];

      assert.ok(metadata.name.trim());
      assert.ok(metadata.description.trim());
    }
  }
});

test("VtM V5 is available for every implemented capability", () => {
  const vtm = getGameSystem("vtm-v5");

  assert.ok(vtm);

  for (const capabilityName of GAME_SYSTEM_CAPABILITIES) {
    const capability: GameSystemCapabilityState =
      vtm.capabilities[capabilityName];

    assert.equal(capability.status, "available");
    if (capability.status !== "available") {
      assert.fail(`${capabilityName} should be available`);
    }
    assert.equal(typeof capability.route, "string");
    assert.ok(capability.route.length > 0);
  }
});

test("systems without implemented features expose only planned capabilities", () => {
  for (const system of GAME_SYSTEM_CATALOGUE.filter(
    (entry) =>
      entry.id !== "vtm-v5" && entry.id !== "call-of-cthulhu-7e",
  )) {
    for (const capabilityName of GAME_SYSTEM_CAPABILITIES) {
      const capability: GameSystemCapabilityState =
        system.capabilities[capabilityName];

      assert.equal(capability.status, "planned");
      assert.equal(Object.hasOwn(capability, "route"), false);
    }
  }
});

test("Call of Cthulhu 7e exposes only its implemented capabilities", () => {
  const callOfCthulhu = getGameSystem("call-of-cthulhu-7e");

  assert.ok(callOfCthulhu);
  assert.deepEqual(callOfCthulhu.capabilities.campaignCreation, {
    status: "available",
    route: "/campaigns/new",
  });
  assert.deepEqual(callOfCthulhu.capabilities.diceRoller, {
    status: "available",
    route: "/games/call-of-cthulhu/tools/dice",
  });

  for (const capabilityName of [
    "gameArea",
    "characterCreation",
  ] as const) {
    assert.deepEqual(callOfCthulhu.capabilities[capabilityName], {
      status: "planned",
    });
  }
});

test("only VtM V5 and Call of Cthulhu 7e expose dice rollers", () => {
  assert.deepEqual(
    GAME_SYSTEM_CATALOGUE.filter(
      (system) => system.capabilities.diceRoller.status === "available",
    ).map((system) => system.id),
    ["vtm-v5", "call-of-cthulhu-7e"],
  );
});

test("CoC dice route renders the authenticated persistence-enabled reusable roller", () => {
  const routePath = resolve(
    "app/[locale]/games/call-of-cthulhu/tools/dice/page.tsx",
  );
  const routeSource = readFileSync(routePath, "utf8");

  assert.match(
    routeSource,
    /import CallOfCthulhu7eDiceRoller from "@\/components\/games\/call-of-cthulhu-7e\/dice-roller"/u,
  );
  assert.match(
    routeSource,
    /<CallOfCthulhu7eDiceRoller[\s\S]*authenticated=\{authenticated\}[\s\S]*initialHistoryEntries=\{historyEntries\}/u,
  );
  assert.match(routeSource, /namespace: "Coc7eDiceRoller"/u);
  assert.match(routeSource, /auth\.getClaims\(\)/u);
  assert.doesNotMatch(routeSource, /GameRoom|campaign_id|Realtime/u);
  assert.equal(
    existsSync("app/[locale]/games/call-of-cthulhu/page.tsx"),
    false,
  );
});

test("Dice Rollers catalogue uses the shared localized capability link", () => {
  const pageSource = readFileSync(
    resolve("app/[locale]/dice-rollers/page.tsx"),
    "utf8",
  );
  const cardSource = readFileSync(
    resolve("components/game-systems/system-card.tsx"),
    "utf8",
  );

  assert.match(pageSource, /system\.capabilities\.diceRoller/u);
  assert.match(pageSource, /withDiceRollerReturnTo\([\s\S]*capability\.route/u);
  assert.doesNotMatch(pageSource, /call-of-cthulhu/iu);
  assert.match(cardSource, /import \{ Link \} from "@\/i18n\/navigation"/u);
  assert.match(cardSource, /href=\{action\.href\}/u);
});

test("Dice Rollers hub exposes localized standalone Go First Dice", () => {
  const pageSource = readFileSync(
    resolve("app/[locale]/dice-rollers/page.tsx"),
    "utf8",
  );
  const routeSource = readFileSync(
    resolve("app/[locale]/dice-rollers/go-first/page.tsx"),
    "utf8",
  );
  const englishMessages = JSON.parse(
    readFileSync(resolve("messages/en.json"), "utf8"),
  ) as Record<string, unknown>;
  const russianMessages = JSON.parse(
    readFileSync(resolve("messages/ru.json"), "utf8"),
  ) as Record<string, unknown>;

  assert.match(pageSource, /"\/dice-rollers\/go-first"/u);
  assert.match(pageSource, /withDiceRollerReturnTo/u);
  assert.match(routeSource, /<GoFirstDiceRoller \/>/u);
  assert.match(routeSource, /resolveDiceRollerReturnTo/u);
  assert.deepEqual(
    Object.keys(englishMessages.GoFirstDice as Record<string, unknown>),
    Object.keys(russianMessages.GoFirstDice as Record<string, unknown>),
  );
  assert.deepEqual(
    Object.keys(
      (englishMessages.GoFirstDice as { errors: Record<string, unknown> })
        .errors,
    ),
    Object.keys(
      (russianMessages.GoFirstDice as { errors: Record<string, unknown> })
        .errors,
    ),
  );
});

test("only VtM V5 and Call of Cthulhu 7e allow campaign creation", () => {
  assert.deepEqual(
    GAME_SYSTEM_CATALOGUE.filter(
      (system) =>
        system.capabilities.campaignCreation.status === "available",
    ).map((system) => system.id),
    ["vtm-v5", "call-of-cthulhu-7e"],
  );
});

test("only VtM V5 is available for character creation", () => {
  assert.deepEqual(
    GAME_SYSTEM_CATALOGUE.filter(
      (system) =>
        system.capabilities.characterCreation.status === "available",
    ).map((system) => system.id),
    ["vtm-v5"],
  );
});

test("Custom Dice Pool is not a game-system catalogue entry", () => {
  assert.equal(
    GAME_SYSTEM_CATALOGUE.some(
      (system) => system.id === ("custom-dice-pool" as string),
    ),
    false,
  );
});

test("legacy VtM and Call of Cthulhu identifiers still normalize", () => {
  assert.equal(normalizeGameSystemId("vtm-v5"), "vtm-v5");
  assert.equal(
    normalizeGameSystemId("Vampire: The Masquerade V5"),
    "vtm-v5",
  );
  assert.equal(
    normalizeGameSystemId("Vampire: The Masquerade (v5)"),
    "vtm-v5",
  );
  assert.equal(
    normalizeGameSystemId("call-of-cthulhu-7e"),
    "call-of-cthulhu-7e",
  );
  assert.equal(
    normalizeGameSystemId("Call of Cthulhu"),
    "call-of-cthulhu-7e",
  );
  assert.equal(normalizeGameSystemId("unknown-system"), null);
  assert.equal(
    getGameSystemName("call-of-cthulhu-7e"),
    "Call of Cthulhu 7th Edition",
  );
});

test("unknown historical system values remain visible without translation", () => {
  const historicalValue = "Historical Homebrew System";

  assert.equal(getGameSystemTranslationKey(historicalValue), null);
  assert.equal(getGameSystemName(historicalValue), historicalValue);
});
