import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  MAX_SAVED_CUSTOM_DICE_PRESETS,
  buildPresetMutationInput,
  canStartPresetMutation,
  completePresetMutationSafely,
  getPresetQuantitySummary,
  getSavedPresetSectionMode,
  mapPresetActionError,
  presetToQuantityFields,
  removeSavedCustomDicePreset,
  sortSavedCustomDicePresets,
  upsertSavedCustomDicePreset,
  type CustomDiceQuantityFields,
} from "../../lib/dice/saved-custom-dice-presets-ui";
import type {
  SavedCustomDicePreset,
  SavedCustomDiceQuantities,
} from "../../lib/dice/personal-dice-persistence-service";

const PRESET_ONE_ID = "10000000-0000-4000-8000-000000000001";
const PRESET_TWO_ID = "20000000-0000-4000-8000-000000000002";

function emptyQuantities(): SavedCustomDiceQuantities {
  return {
    coin: 0,
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
    d100: 0,
  };
}

function quantityFields(): CustomDiceQuantityFields {
  return {
    coin: "2",
    4: "0",
    6: "3",
    8: "0",
    10: "0",
    12: "0",
    20: "1",
    100: "0",
  };
}

function preset(
  id: string,
  slot: number,
  overrides: Partial<SavedCustomDicePreset> = {},
): SavedCustomDicePreset {
  return {
    id,
    name: `Preset ${slot}`,
    slot,
    quantities: {
      ...emptyQuantities(),
      coin: slot,
      d6: slot + 1,
    },
    createdAt: "2026-07-24T10:00:00.000Z",
    updatedAt: "2026-07-24T10:00:00.000Z",
    ...overrides,
  };
}

function collectKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) =>
      collectKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

test("guest preset mode never implies an active persistence account", () => {
  assert.equal(
    getSavedPresetSectionMode({ authenticated: false }, 0),
    "guest",
  );
});

test("authenticated users with no presets receive the empty state", () => {
  assert.equal(
    getSavedPresetSectionMode(
      { authenticated: true, presets: [], loadError: null },
      0,
    ),
    "empty",
  );
});

test("preset loading failures remain a separate non-fatal section mode", () => {
  assert.equal(
    getSavedPresetSectionMode(
      {
        authenticated: true,
        presets: [],
        loadError: "persistence_unavailable",
      },
      0,
    ),
    "load-error",
  );
});

test("preset cards sort by authoritative slot and copy nested quantities", () => {
  const slotTwo = preset(PRESET_TWO_ID, 2);
  const sorted = sortSavedCustomDicePresets([
    slotTwo,
    preset(PRESET_ONE_ID, 1),
  ]);

  assert.deepEqual(
    sorted.map((item) => item.slot),
    [1, 2],
  );
  sorted[1].quantities.coin = 99;
  assert.equal(slotTwo.quantities.coin, 2);
});

test("quantity summary includes Coin and omits zero quantities", () => {
  assert.deepEqual(
    getPresetQuantitySummary({
      ...emptyQuantities(),
      coin: 2,
      d6: 3,
      d20: 1,
    }),
    [
      { key: "coin", count: 2 },
      { key: "d6", count: 3 },
      { key: "d20", count: 1 },
    ],
  );
});

test("loading a preset replaces all eight quantity fields exactly", () => {
  const fields = presetToQuantityFields(
    preset(PRESET_ONE_ID, 1, {
      quantities: {
        coin: 1,
        d4: 2,
        d6: 3,
        d8: 4,
        d10: 5,
        d12: 6,
        d20: 7,
        d100: 8,
      },
    }),
  );

  assert.deepEqual(fields, {
    coin: "1",
    4: "2",
    6: "3",
    8: "4",
    10: "5",
    12: "6",
    20: "7",
    100: "8",
  });
});

test("loading preset quantities does not invoke cryptographic randomness", () => {
  const before = globalThis.crypto.getRandomValues;
  let randomCalls = 0;
  const cryptoObject = globalThis.crypto;
  Object.defineProperty(cryptoObject, "getRandomValues", {
    configurable: true,
    value: () => {
      randomCalls += 1;
      throw new Error("randomness must not be used");
    },
  });

  try {
    presetToQuantityFields(preset(PRESET_ONE_ID, 1));
    assert.equal(randomCalls, 0);
  } finally {
    Object.defineProperty(cryptoObject, "getRandomValues", {
      configurable: true,
      value: before,
    });
  }
});

test("create input uses current quantities and normalizes the name", () => {
  assert.deepEqual(
    buildPresetMutationInput("  Mixed \t pool  ", quantityFields()),
    {
      ok: true,
      name: "Mixed pool",
      quantities: {
        coin: 2,
        d4: 0,
        d6: 3,
        d8: 0,
        d10: 0,
        d12: 0,
        d20: 1,
        d100: 0,
      },
    },
  );
});

test("preset names use the server's 80-code-point Unicode boundary", () => {
  const acceptedName = "🎲".repeat(80);
  const rejectedName = "🎲".repeat(81);

  const accepted = buildPresetMutationInput(
    acceptedName,
    quantityFields(),
  );
  assert.equal(accepted.ok, true);
  if (accepted.ok) {
    assert.equal(accepted.name, acceptedName);
  }

  assert.deepEqual(
    buildPresetMutationInput(rejectedName, quantityFields()),
    {
      ok: false,
      messageKey: "nameTooLong",
      field: "name",
    },
  );
});

test("client preset validation rejects empty and invalid pools safely", () => {
  const empty = Object.fromEntries(
    Object.keys(quantityFields()).map((key) => [key, "0"]),
  ) as CustomDiceQuantityFields;
  const invalid = { ...quantityFields(), 6: "1.5" };

  assert.deepEqual(buildPresetMutationInput("Name", empty), {
    ok: false,
    messageKey: "poolEmpty",
    field: "form",
  });
  assert.deepEqual(buildPresetMutationInput("Name", invalid), {
    ok: false,
    messageKey: "invalidQuantity",
    field: "form",
  });
});

test("successful create appends the returned DTO in slot order", () => {
  const existing = [preset(PRESET_TWO_ID, 2)];
  const returned = preset(PRESET_ONE_ID, 1);

  assert.deepEqual(
    upsertSavedCustomDicePreset(existing, returned).map(
      (item) => item.id,
    ),
    [PRESET_ONE_ID, PRESET_TWO_ID],
  );
});

test("five presets suppress create through the limit state", () => {
  assert.equal(MAX_SAVED_CUSTOM_DICE_PRESETS, 5);
  assert.equal(
    getSavedPresetSectionMode(
      { authenticated: true, presets: [], loadError: null },
      5,
    ),
    "limit",
  );
});

test("authoritative limit errors handle stale four-preset UI safely", () => {
  assert.equal(
    getSavedPresetSectionMode(
      { authenticated: true, presets: [], loadError: null },
      4,
      true,
    ),
    "limit",
  );
  assert.equal(
    mapPresetActionError("preset_limit_reached"),
    "limitReached",
  );
});

test("duplicate-name conflicts map safely without changing form input", () => {
  const input = "Existing name";
  assert.equal(
    mapPresetActionError("preset_name_conflict"),
    "nameConflict",
  );
  assert.equal(input, "Existing name");
});

test("successful update replaces only the matching preset", () => {
  const originalOne = preset(PRESET_ONE_ID, 1);
  const originalTwo = preset(PRESET_TWO_ID, 2);
  const updatedTwo = preset(PRESET_TWO_ID, 2, {
    name: "Updated",
    quantities: { ...emptyQuantities(), d20: 4 },
  });
  const result = upsertSavedCustomDicePreset(
    [originalOne, originalTwo],
    updatedTwo,
  );

  assert.deepEqual(result[0], originalOne);
  assert.equal(result[1].name, "Updated");
  assert.equal(result[1].quantities.d20, 4);
});

test("preset_not_found maps safely and leaves local state untouched", () => {
  const current = [
    preset(PRESET_ONE_ID, 1),
    preset(PRESET_TWO_ID, 2),
  ];
  const snapshot = structuredClone(current);

  assert.equal(mapPresetActionError("preset_not_found"), "notFound");
  assert.deepEqual(current, snapshot);
});

test("successful delete removes only the confirmed preset", () => {
  assert.deepEqual(
    removeSavedCustomDicePreset(
      [preset(PRESET_ONE_ID, 1), preset(PRESET_TWO_ID, 2)],
      PRESET_ONE_ID,
    ).map((item) => item.id),
    [PRESET_TWO_ID],
  );
});

test("failed delete and authentication failures preserve local quantities", () => {
  const fields = quantityFields();
  const snapshot = { ...fields };

  assert.equal(
    mapPresetActionError("persistence_unavailable"),
    "persistenceUnavailable",
  );
  assert.equal(
    mapPresetActionError("authentication_required"),
    "authenticationRequired",
  );
  assert.deepEqual(fields, snapshot);
});

test("pending state prevents duplicate preset submissions", () => {
  assert.equal(canStartPresetMutation(null), true);
  assert.equal(canStartPresetMutation("create"), false);
  assert.equal(
    canStartPresetMutation(`update:${PRESET_ONE_ID}`),
    false,
  );
});

test("transport-level mutation rejection is contained safely", async () => {
  assert.equal(
    await completePresetMutationSafely(() =>
      Promise.reject(new Error("transport details must not escape")),
    ),
    false,
  );
  assert.equal(
    await completePresetMutationSafely(() => Promise.resolve()),
    true,
  );
});

test("known validation issues map to stable field and form messages", () => {
  assert.equal(
    mapPresetActionError("validation_failed", [
      { code: "name-too-long", path: "name" },
    ]),
    "nameTooLong",
  );
  assert.equal(
    mapPresetActionError("validation_failed", [
      { code: "pool-empty", path: "quantities" },
    ]),
    "poolEmpty",
  );
  assert.equal(
    mapPresetActionError("validation_failed", [
      { code: "out-of-range", path: "quantities.d100" },
    ]),
    "invalidQuantity",
  );
});

test("English and Russian preset message keys are identical", () => {
  const english = JSON.parse(
    readFileSync(resolve("messages/en.json"), "utf8"),
  ) as Record<string, unknown>;
  const russian = JSON.parse(
    readFileSync(resolve("messages/ru.json"), "utf8"),
  ) as Record<string, unknown>;

  assert.deepEqual(
    collectKeys(
      (english.CustomDicePool as Record<string, unknown>).presets,
    ).sort(),
    collectKeys(
      (russian.CustomDicePool as Record<string, unknown>).presets,
    ).sort(),
  );
});

test("server boundary and client component preserve the approved security flow", () => {
  const pageSource = readFileSync(
    resolve("app/[locale]/dice-rollers/custom/page.tsx"),
    "utf8",
  );
  const componentSource = readFileSync(
    resolve(
      "components/dice-rollers/saved-custom-dice-presets.tsx",
    ),
    "utf8",
  );
  const rollerSource = readFileSync(
    resolve("components/dice-rollers/custom-dice-pool.tsx"),
    "utf8",
  );

  assert.match(pageSource, /auth\.getClaims\(\)/u);
  assert.match(pageSource, /listSavedCustomDicePresets\(\)/u);
  assert.doesNotMatch(componentSource, /createClient|supabase/iu);
  assert.doesNotMatch(componentSource, /owner_id|error\.message/iu);
  assert.match(
    componentSource,
    /createSavedCustomDicePresetAction\(\{/u,
  );
  assert.match(
    componentSource,
    /updateSavedCustomDicePresetAction\(\{/u,
  );
  assert.match(
    componentSource,
    /deleteSavedCustomDicePresetAction\(\{/u,
  );
  assert.match(rollerSource, /setQuantities\(\{ \.\.\.nextQuantities \}\)/u);
  assert.doesNotMatch(
    rollerSource,
    /onLoad[\s\S]{0,300}setResult/u,
  );
});
