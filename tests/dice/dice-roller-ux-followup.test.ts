import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  resolveDiceRollerReturnTo,
  withDiceRollerReturnTo,
} from "../../lib/dice/dice-roller-navigation";
import type { PersonalRollerKind } from "../../lib/dice/personal-dice-persistence";
import {
  getPersonalRollHistoryLabel,
  getVisiblePreviousRolls,
  mergePersonalRollHistoryEntry,
} from "../../lib/dice/personal-roll-history";
import type { PersonalRollHistoryEntry } from "../../lib/dice/personal-dice-persistence-service";

function historyEntry(
  rollerKind: PersonalRollerKind,
  sequenceNumber: number,
): PersonalRollHistoryEntry {
  return {
    id: `30000000-0000-4000-8000-${String(sequenceNumber).padStart(12, "0")}`,
    clientRollId: `40000000-0000-4000-8000-${String(sequenceNumber).padStart(12, "0")}`,
    rollerKind,
    schemaVersion: 1,
    requestData: {},
    resultData: {},
    sequenceNumber,
    createdAt: "2026-09-07T00:00:00.000Z",
  } as PersonalRollHistoryEntry;
}

test("dice roller links persist an explicit internal source route", () => {
  assert.equal(
    withDiceRollerReturnTo(
      "/games/vampire-the-masquerade/tools/dice",
      "/dice-rollers",
    ),
    "/games/vampire-the-masquerade/tools/dice?returnTo=%2Fdice-rollers",
  );
  assert.equal(
    withDiceRollerReturnTo(
      "/games/vampire-the-masquerade/tools/dice",
      "/games/vampire-the-masquerade",
    ),
    "/games/vampire-the-masquerade/tools/dice?returnTo=%2Fgames%2Fvampire-the-masquerade",
  );
});

test("returnTo accepts safe locale-neutral and same-locale routes", () => {
  assert.equal(
    resolveDiceRollerReturnTo("en", "/dice-rollers"),
    "/dice-rollers",
  );
  assert.equal(
    resolveDiceRollerReturnTo(
      "ru",
      "/ru/games/vampire-the-masquerade?tab=dice#tools",
    ),
    "/games/vampire-the-masquerade?tab=dice#tools",
  );
  assert.equal(
    resolveDiceRollerReturnTo("ru", "/games/vampire-the-masquerade"),
    "/games/vampire-the-masquerade",
  );
});

test("returnTo rejects external, conflicting, malformed, and ambiguous values", () => {
  const rejected: Array<string | string[] | undefined> = [
    undefined,
    ["/dice-rollers", "/games"],
    "https://evil.example/path",
    "//evil.example/path",
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "/ru/dice-rollers",
    " /dice-rollers",
    "/dice-rollers\\unsafe",
    "/%2f%2fevil.example",
    "/dice-rollers%0aunsafe",
  ];

  for (const value of rejected) {
    assert.equal(
      resolveDiceRollerReturnTo("en", value),
      "/dice-rollers",
    );
  }
});

test("returnTo resolution is stable across direct server renders", () => {
  const persisted = "/en/games/vampire-the-masquerade";
  assert.equal(
    resolveDiceRollerReturnTo("en", persisted),
    resolveDiceRollerReturnTo("en", persisted),
  );
  assert.equal(
    resolveDiceRollerReturnTo("ru", undefined),
    "/dice-rollers",
  );
});

test("history shows five previous per page scope without duplicating current rolls", () => {
  const vtm = Array.from({ length: 7 }, (_, index) =>
    historyEntry("vtm_v5", 7 - index),
  );
  const custom = historyEntry("custom_dice_pool", 20);

  assert.deepEqual(
    getVisiblePreviousRolls(
      [...vtm, custom],
      ["vtm_v5"],
      [vtm[0].clientRollId],
    ).map((entry) => entry.sequenceNumber),
    [6, 5, 4, 3, 2],
  );
  assert.deepEqual(
    getVisiblePreviousRolls(vtm, ["vtm_v5"], []).map(
      (entry) => entry.sequenceNumber,
    ),
    [7, 6, 5, 4, 3],
  );
});

test("CoC history mixes its two kinds and limits the combined scope to five", () => {
  const percentile = Array.from({ length: 7 }, (_, index) =>
    historyEntry("coc_7e_percentile", 30 - index * 2),
  );
  const other = Array.from({ length: 7 }, (_, index) =>
    historyEntry("coc_7e_other_dice", 29 - index * 2),
  );
  const visible = getVisiblePreviousRolls(
    [...percentile, ...other, historyEntry("vtm_v5", 100)].sort(
      (left, right) => right.sequenceNumber - left.sequenceNumber,
    ),
    ["coc_7e_percentile", "coc_7e_other_dice"],
    [percentile[0].clientRollId, other[0].clientRollId],
  );

  assert.deepEqual(
    visible.map((entry) => entry.sequenceNumber),
    [28, 27, 26, 25, 24],
  );
  assert.equal(visible.some((entry) => entry.rollerKind === "vtm_v5"), false);
});

test("recorded history merges newest-first and keeps six rows per scope", () => {
  const existing = Array.from({ length: 6 }, (_, index) =>
    historyEntry("vtm_v5", 6 - index),
  );
  const recorded = historyEntry("vtm_v5", 7);
  const merged = mergePersonalRollHistoryEntry(existing, recorded);

  assert.deepEqual(
    merged.map((entry) => entry.sequenceNumber),
    [7, 6, 5, 4, 3, 2],
  );
});

test("recorded CoC history keeps six rows total across alternating kinds", () => {
  const existing = Array.from({ length: 12 }, (_, index) =>
    historyEntry(
      index % 2 === 0 ? "coc_7e_percentile" : "coc_7e_other_dice",
      12 - index,
    ),
  );
  const recorded = historyEntry("coc_7e_other_dice", 13);
  const merged = mergePersonalRollHistoryEntry(existing, recorded);

  assert.deepEqual(
    merged.map((entry) => entry.sequenceNumber),
    [13, 12, 11, 10, 9, 8],
  );
});

test("history labels read VtM and additive Custom/CoC metadata safely", () => {
  const vtm = {
    ...historyEntry("vtm_v5", 1),
    resultData: { request: { label: "Stealth check" } },
  } as PersonalRollHistoryEntry;
  const custom = {
    ...historyEntry("custom_dice_pool", 2),
    requestData: { label: "Damage" },
  } as PersonalRollHistoryEntry;
  const coc = historyEntry("coc_7e_percentile", 3);

  assert.equal(getPersonalRollHistoryLabel(vtm), "Stealth check");
  assert.equal(getPersonalRollHistoryLabel(custom), "Damage");
  assert.equal(getPersonalRollHistoryLabel(coc), null);
});

test("current routes use server-resolved Back links and the catalogue has no history", () => {
  const catalogue = readFileSync(
    resolve("app/[locale]/dice-rollers/page.tsx"),
    "utf8",
  );
  const vtmGame = readFileSync(
    resolve("app/[locale]/games/vampire-the-masquerade/page.tsx"),
    "utf8",
  );
  const rollerRoutes = [
    "app/[locale]/dice-rollers/custom/page.tsx",
    "app/[locale]/games/vampire-the-masquerade/tools/dice/page.tsx",
    "app/[locale]/games/call-of-cthulhu/tools/dice/page.tsx",
  ].map((path) => readFileSync(resolve(path), "utf8"));

  assert.match(catalogue, /withDiceRollerReturnTo/u);
  assert.match(vtmGame, /withDiceRollerReturnTo/u);
  assert.doesNotMatch(catalogue, /PersonalRollHistory|listPersonalRollHistory/u);
  for (const route of rollerRoutes) {
    assert.match(route, /searchParams: Promise/u);
    assert.match(route, /resolveDiceRollerReturnTo/u);
    assert.match(route, /href=\{backHref\}/u);
  }
});

test("VtM and Custom place Roll Label before dice-specific controls", () => {
  const vtm = readFileSync(
    resolve("components/games/vtm-v5/personal-dice-roller.tsx"),
    "utf8",
  );
  const custom = readFileSync(
    resolve("components/dice-rollers/custom-dice-pool.tsx"),
    "utf8",
  );

  assert.ok(vtm.indexOf('htmlFor="roll-label"') < vtm.indexOf('htmlFor="dice-pool"'));
  assert.ok(
    custom.indexOf('htmlFor="custom-roll-label"') <
      custom.indexOf("CUSTOM_POOL_ITEM_KEYS.map"),
  );
  assert.match(vtm, /validateOptionalDiceRollLabel/u);
  assert.match(custom, /validateOptionalDiceRollLabel/u);
});
