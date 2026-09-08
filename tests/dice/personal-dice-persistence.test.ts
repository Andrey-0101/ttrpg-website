import assert from "node:assert/strict";
import test from "node:test";

import {
  PERSONAL_ROLLER_KINDS,
  PERSONAL_ROLLER_REGISTRY,
  validatePersonalRollForPersistence,
  type PersonalRollPersistencePayload,
} from "../../lib/dice/personal-dice-persistence";

const CLIENT_ROLL_ID = "A4A96F10-EB5B-4A48-9CE6-1F807D54D08A";

function emptyQuantities() {
  return {
    coin: 0,
    4: 0,
    6: 0,
    8: 0,
    10: 0,
    12: 0,
    20: 0,
    100: 0,
  };
}

function validVtmInput() {
  return {
    clientRollId: CLIENT_ROLL_ID,
    rollerKind: "vtm_v5",
    schemaVersion: 1,
    requestData: {
      request: {
        pool: 4,
        hungerDice: 2,
        difficulty: 3,
        label: "  Hunt   prey  ",
      },
      normalDice: [10, 6],
      hungerDiceResults: [10, 1],
    },
    resultData: {
      gameSystem: "forged",
      request: { pool: 99 },
      normalDice: [1],
      hungerDiceResults: [1],
      nonTenSuccessCount: 99,
      tenCount: 99,
      criticalPairCount: 99,
      totalSuccesses: 99,
      hasCriticalPair: false,
      isSuccess: false,
      isOrdinaryCritical: true,
      isMessyCritical: false,
      isTotalFailure: true,
      isBestialFailure: true,
      difficultyResult: "failure",
      margin: -99,
      summaryKey: "failure",
      detailFlags: {},
    },
  };
}

function validCustomInput() {
  return {
    clientRollId: CLIENT_ROLL_ID,
    rollerKind: "custom_dice_pool",
    schemaVersion: 1,
    requestData: {
      quantities: {
        ...emptyQuantities(),
        coin: 3,
        4: 2,
        20: 1,
      },
    },
    resultData: {
      quantities: { coin: 99 },
      coinResults: ["heads", "tails", "heads"],
      groups: [
        { sides: 20, results: [20] },
        { sides: 4, results: [1, 4] },
      ],
      totalItems: 999,
      numericDiceTotal: 999,
      headsCount: 0,
      tailsCount: 999,
    },
  };
}

function validCocPercentileInput(
  overrides: {
    target?: number | null;
    bonusPenalty?: number;
    units?: number;
    tensDice?: readonly number[];
  } = {},
) {
  return {
    clientRollId: CLIENT_ROLL_ID,
    rollerKind: "coc_7e_percentile",
    schemaVersion: 1,
    requestData: {
      request: {
        target: overrides.target ?? null,
        bonusPenalty: overrides.bonusPenalty ?? 0,
      },
      units: overrides.units ?? 7,
      tensDice: overrides.tensDice ? [...overrides.tensDice] : [20],
    },
    resultData: {},
  };
}

function validCocOtherDiceInput(
  overrides: {
    sides?: number;
    quantity?: number;
    modifier?: number;
    results?: number[];
  } = {},
) {
  return {
    clientRollId: CLIENT_ROLL_ID,
    rollerKind: "coc_7e_other_dice",
    schemaVersion: 1,
    requestData: {
      request: {
        sides: overrides.sides ?? 6,
        quantity: overrides.quantity ?? 2,
        modifier: overrides.modifier ?? 0,
      },
      results: overrides.results ?? [2, 5],
    },
    resultData: {},
  };
}

function requirePayload(
  input: unknown,
): PersonalRollPersistencePayload {
  const validation = validatePersonalRollForPersistence(input);
  assert.equal(
    validation.ok,
    true,
    validation.ok ? undefined : JSON.stringify(validation.issues),
  );
  return validation.payload;
}

function requireIssuePairs(input: unknown) {
  const validation = validatePersonalRollForPersistence(input);
  assert.equal(validation.ok, false);
  return validation.issues.map(({ code, path }) => ({ code, path }));
}

test("a VtM snapshot becomes canonical database-ready RPC arguments", () => {
  const payload = requirePayload(validVtmInput());

  assert.equal(payload.p_client_roll_id, CLIENT_ROLL_ID.toLowerCase());
  assert.equal(payload.p_roller_kind, "vtm_v5");
  assert.equal(payload.p_schema_version, 1);
  assert.deepEqual(payload.p_request_data, {
    request: {
      pool: 4,
      hungerDice: 2,
      difficulty: 3,
      label: "Hunt prey",
    },
    normalDice: [10, 6],
    hungerDiceResults: [10, 1],
  });
  assert.deepEqual(payload.p_result_data, {
    gameSystem: "vtm-v5",
    request: {
      pool: 4,
      hungerDice: 2,
      difficulty: 3,
      label: "Hunt prey",
    },
    normalDice: [10, 6],
    hungerDiceResults: [10, 1],
    nonTenSuccessCount: 1,
    tenCount: 2,
    criticalPairCount: 1,
    totalSuccesses: 5,
    hasCriticalPair: true,
    isSuccess: true,
    isOrdinaryCritical: false,
    isMessyCritical: true,
    isTotalFailure: false,
    isBestialFailure: false,
    difficultyResult: "success",
    margin: 2,
    summaryKey: "messy-critical",
    detailFlags: {
      hasNonTenSuccess: true,
      hasHungerOne: true,
      hasHungerTen: true,
      hasUnpairedTen: false,
      hasZeroSuccesses: false,
      criticalPairBelowDifficulty: false,
      difficultyOmitted: false,
    },
  });
});

test("VtM interpretation always comes from the deterministic evaluator", () => {
  const input = validVtmInput();
  input.resultData.totalSuccesses = -1;
  input.resultData.summaryKey = "success";
  input.resultData.isMessyCritical = false;

  const payload = requirePayload(input);
  assert.equal(payload.p_roller_kind, "vtm_v5");
  assert.equal(payload.p_result_data.totalSuccesses, 5);
  assert.equal(payload.p_result_data.summaryKey, "messy-critical");
  assert.equal(payload.p_result_data.isMessyCritical, true);
});

test("VtM count-only and failure outcomes remain canonical", () => {
  const countOnly = validVtmInput();
  delete (
    countOnly.requestData.request as {
      difficulty?: number;
    }
  ).difficulty;
  delete (
    countOnly.requestData.request as {
      label?: string;
    }
  ).label;
  countOnly.requestData.normalDice = [6, 2];
  countOnly.requestData.hungerDiceResults = [5, 3];

  const countPayload = requirePayload(countOnly);
  assert.equal(countPayload.p_roller_kind, "vtm_v5");
  assert.equal(countPayload.p_result_data.isSuccess, null);
  assert.equal(countPayload.p_result_data.difficultyResult, "not-set");
  assert.equal(countPayload.p_result_data.summaryKey, "successes-counted");
  assert.deepEqual(countPayload.p_request_data.request, {
    pool: 4,
    hungerDice: 2,
  });

  const bestial = validVtmInput();
  bestial.requestData.request.pool = 2;
  bestial.requestData.request.hungerDice = 1;
  bestial.requestData.request.difficulty = 1;
  bestial.requestData.normalDice = [2];
  bestial.requestData.hungerDiceResults = [1];

  const bestialPayload = requirePayload(bestial);
  assert.equal(bestialPayload.p_roller_kind, "vtm_v5");
  assert.equal(bestialPayload.p_result_data.isBestialFailure, true);
  assert.equal(bestialPayload.p_result_data.summaryKey, "bestial-failure");
});

test("VtM malformed dice arrays return typed evaluator issues", () => {
  const input = validVtmInput();
  input.requestData.normalDice = [0, 11];
  input.requestData.hungerDiceResults = [1];

  assert.deepEqual(requireIssuePairs(input), [
    {
      code: "invalid-die-value",
      path: "requestData.normalDice[0]",
    },
    {
      code: "invalid-die-value",
      path: "requestData.normalDice[1]",
    },
    {
      code: "wrong-array-length",
      path: "requestData.hungerDiceResults",
    },
  ]);
});

test("VtM persistence rejects presentation and unexpected fields", () => {
  const input = validVtmInput() as ReturnType<typeof validVtmInput> & {
    requestData: ReturnType<typeof validVtmInput>["requestData"] & {
      localizedSummary: string;
    };
    resultData: ReturnType<typeof validVtmInput>["resultData"] & {
      displayMode: string;
    };
  };
  input.requestData.localizedSummary = "Успех";
  input.resultData.displayMode = "symbols";

  assert.deepEqual(requireIssuePairs(input), [
    {
      code: "unexpected-field",
      path: "resultData.displayMode",
    },
    {
      code: "unexpected-field",
      path: "requestData.localizedSummary",
    },
  ]);
});

test("a custom snapshot is reordered and recomputed canonically", () => {
  const payload = requirePayload(validCustomInput());

  assert.equal(payload.p_roller_kind, "custom_dice_pool");
  assert.deepEqual(payload.p_request_data.quantities, {
    coin: 3,
    4: 2,
    6: 0,
    8: 0,
    10: 0,
    12: 0,
    20: 1,
    100: 0,
  });
  assert.deepEqual(payload.p_result_data, {
    coinResults: ["heads", "tails", "heads"],
    groups: [
      { sides: 4, results: [1, 4] },
      { sides: 20, results: [20] },
    ],
    totalItems: 6,
    numericDiceTotal: 25,
    headsCount: 2,
    tailsCount: 1,
  });
});

test("Custom and CoC labels use the shared optional normalization contract", () => {
  const custom = validCustomInput();
  custom.requestData = {
    ...custom.requestData,
    label: "  Climbing\n  check  ",
  } as typeof custom.requestData;
  const customPayload = requirePayload(custom);
  assert.equal(customPayload.p_roller_kind, "custom_dice_pool");
  assert.equal(customPayload.p_request_data.label, "Climbing check");

  const percentile = validCocPercentileInput();
  percentile.requestData = {
    ...percentile.requestData,
    label: "  Library\tUse ",
  } as typeof percentile.requestData;
  const percentilePayload = requirePayload(percentile);
  assert.equal(percentilePayload.p_roller_kind, "coc_7e_percentile");
  assert.equal(percentilePayload.p_request_data.label, "Library Use");

  const other = validCocOtherDiceInput();
  other.requestData = {
    ...other.requestData,
    label: "   ",
  } as typeof other.requestData;
  const otherPayload = requirePayload(other);
  assert.equal(otherPayload.p_roller_kind, "coc_7e_other_dice");
  assert.equal("label" in otherPayload.p_request_data, false);

  const tooLong = validCustomInput();
  tooLong.requestData = {
    ...tooLong.requestData,
    label: "🎲".repeat(121),
  } as typeof tooLong.requestData;
  assert.deepEqual(requireIssuePairs(tooLong), [
    { code: "label-too-long", path: "requestData.label" },
  ]);
});

test("custom forged totals and result quantities are never trusted", () => {
  const input = validCustomInput();
  input.resultData.totalItems = -20;
  input.resultData.numericDiceTotal = -20;
  input.resultData.headsCount = -20;
  input.resultData.tailsCount = -20;
  input.resultData.quantities = { coin: 100 };

  const payload = requirePayload(input);
  assert.equal(payload.p_roller_kind, "custom_dice_pool");
  assert.equal(payload.p_result_data.totalItems, 6);
  assert.equal(payload.p_result_data.numericDiceTotal, 25);
  assert.equal(payload.p_result_data.headsCount, 2);
  assert.equal(payload.p_result_data.tailsCount, 1);
});

test("custom coin-only and dice-only snapshots have coherent totals", () => {
  const coinOnly = validCustomInput();
  coinOnly.requestData.quantities = {
    ...emptyQuantities(),
    coin: 2,
  };
  coinOnly.resultData.coinResults = ["tails", "tails"];
  coinOnly.resultData.groups = [];

  const coinPayload = requirePayload(coinOnly);
  assert.equal(coinPayload.p_roller_kind, "custom_dice_pool");
  assert.deepEqual(coinPayload.p_result_data, {
    coinResults: ["tails", "tails"],
    groups: [],
    totalItems: 2,
    numericDiceTotal: 0,
    headsCount: 0,
    tailsCount: 2,
  });

  const diceOnly = validCustomInput();
  diceOnly.requestData.quantities = {
    ...emptyQuantities(),
    100: 1,
  };
  diceOnly.resultData.coinResults = [];
  diceOnly.resultData.groups = [{ sides: 100, results: [100] }];

  const dicePayload = requirePayload(diceOnly);
  assert.equal(dicePayload.p_roller_kind, "custom_dice_pool");
  assert.equal(dicePayload.p_result_data.totalItems, 1);
  assert.equal(dicePayload.p_result_data.numericDiceTotal, 100);
});

test("custom quantities require every key and reject extra keys", () => {
  const input = validCustomInput();
  const quantities = input.requestData.quantities as Record<
    string,
    number
  >;
  delete quantities["8"];
  quantities["2"] = 1;

  assert.deepEqual(requireIssuePairs(input), [
    {
      code: "required",
      path: "requestData.quantities.8",
    },
    {
      code: "unexpected-field",
      path: "requestData.quantities.2",
    },
  ]);
});

test("custom numeric validation distinguishes strings, non-finite, and fractions", () => {
  const input = validCustomInput();
  const quantities = input.requestData.quantities as Record<
    string,
    unknown
  >;
  quantities["4"] = "2";
  quantities["6"] = Number.NaN;
  quantities["8"] = Number.POSITIVE_INFINITY;
  quantities["10"] = 1.5;

  assert.deepEqual(requireIssuePairs(input), [
    {
      code: "invalid-type",
      path: "requestData.quantities.4",
    },
    {
      code: "not-finite",
      path: "requestData.quantities.6",
    },
    {
      code: "not-finite",
      path: "requestData.quantities.8",
    },
    {
      code: "not-integer",
      path: "requestData.quantities.10",
    },
  ]);
});

test("custom empty, per-item overflow, and total overflow pools are rejected", () => {
  const empty = validCustomInput();
  empty.requestData.quantities = emptyQuantities();
  assert.deepEqual(requireIssuePairs(empty), [
    {
      code: "pool-empty",
      path: "requestData.quantities",
    },
  ]);

  const perItem = validCustomInput();
  perItem.requestData.quantities = {
    ...emptyQuantities(),
    coin: 101,
  };
  assert.deepEqual(requireIssuePairs(perItem), [
    {
      code: "out-of-range",
      path: "requestData.quantities.coin",
    },
  ]);

  const total = validCustomInput();
  total.requestData.quantities = {
    ...emptyQuantities(),
    coin: 100,
    4: 1,
  };
  assert.deepEqual(requireIssuePairs(total), [
    {
      code: "pool-too-large",
      path: "requestData.quantities",
    },
  ]);
});

test("custom result lengths, ranges, and coin outcomes are validated", () => {
  const input = validCustomInput();
  input.resultData.coinResults = ["edge", "heads"];
  input.resultData.groups = [
    { sides: 4, results: [0, 5, 2] },
    { sides: 20, results: [] },
  ];

  assert.deepEqual(requireIssuePairs(input), [
    {
      code: "wrong-array-length",
      path: "resultData.coinResults",
    },
    {
      code: "unsupported-coin-outcome",
      path: "resultData.coinResults[0]",
    },
    {
      code: "wrong-array-length",
      path: "resultData.groups[0].results",
    },
    {
      code: "out-of-range",
      path: "resultData.groups[0].results[0]",
    },
    {
      code: "out-of-range",
      path: "resultData.groups[0].results[1]",
    },
    {
      code: "wrong-array-length",
      path: "resultData.groups[1].results",
    },
    {
      code: "required",
      path: "resultData.groups.4",
    },
    {
      code: "required",
      path: "resultData.groups.20",
    },
  ]);
});

test("custom groups reject unsupported, duplicate, and unexpected fields", () => {
  const input = validCustomInput();
  input.requestData.quantities = {
    ...emptyQuantities(),
    4: 2,
  };
  input.resultData.coinResults = [];
  input.resultData.groups = [
    { sides: 4, results: [1, 2], label: "d4" },
    { sides: 4, results: [3, 4] },
    { sides: 5, results: [] },
  ] as typeof input.resultData.groups;

  assert.deepEqual(requireIssuePairs(input), [
    {
      code: "unexpected-field",
      path: "resultData.groups[0].label",
    },
    {
      code: "duplicate-die-group",
      path: "resultData.groups[1].sides",
    },
    {
      code: "unsupported-die",
      path: "resultData.groups[2].sides",
    },
  ]);
});

test("invalid envelopes return stable ordered issues and no payload", () => {
  const validation = validatePersonalRollForPersistence({
    clientRollId: "not-a-uuid",
    rollerKind: "unknown",
    schemaVersion: 2,
    requestData: null,
    extraB: true,
    extraA: true,
  });

  assert.equal(validation.ok, false);
  assert.deepEqual(
    validation.issues.map(({ code, path }) => ({ code, path })),
    [
      { code: "invalid-uuid", path: "clientRollId" },
      { code: "unsupported-roller-kind", path: "rollerKind" },
      {
        code: "unsupported-schema-version",
        path: "schemaVersion",
      },
      { code: "invalid-type", path: "requestData" },
      { code: "required", path: "resultData" },
      { code: "unexpected-field", path: "$.extraA" },
      { code: "unexpected-field", path: "$.extraB" },
    ],
  );
  assert.equal("payload" in validation, false);
});

test("null, arrays, primitives, and inherited-only envelopes are rejected", () => {
  for (const input of [null, [], "roll", 1, true]) {
    assert.deepEqual(requireIssuePairs(input), [
      { code: "invalid-type", path: "$" },
    ]);
  }

  const inherited = Object.create(validVtmInput()) as unknown;
  assert.deepEqual(requireIssuePairs(inherited), [
    { code: "required", path: "clientRollId" },
    { code: "required", path: "rollerKind" },
    { code: "required", path: "schemaVersion" },
    { code: "required", path: "requestData" },
    { code: "required", path: "resultData" },
  ]);
});

test("custom extra fields are rejected in stable lexical order", () => {
  const input = validCustomInput() as ReturnType<
    typeof validCustomInput
  > & {
    resultData: ReturnType<typeof validCustomInput>["resultData"] & {
      zDisplay: string;
      aLocalized: string;
    };
  };
  input.resultData.zDisplay = "polygon";
  input.resultData.aLocalized = "Heads";

  assert.deepEqual(requireIssuePairs(input), [
    {
      code: "unexpected-field",
      path: "resultData.aLocalized",
    },
    {
      code: "unexpected-field",
      path: "resultData.zDisplay",
    },
  ]);
});

test("VtM validation isolates source and returned nested data", () => {
  const input = validVtmInput();
  const payload = requirePayload(input);
  assert.equal(payload.p_roller_kind, "vtm_v5");

  input.requestData.request.label = "changed";
  input.requestData.normalDice[0] = 1;
  input.requestData.hungerDiceResults[0] = 1;
  assert.equal(payload.p_request_data.request.label, "Hunt prey");
  assert.deepEqual(payload.p_request_data.normalDice, [10, 6]);
  assert.deepEqual(payload.p_result_data.hungerDiceResults, [10, 1]);

  payload.p_result_data.normalDice[0] = 2;
  payload.p_result_data.request.label = "returned changed";
  assert.deepEqual(payload.p_request_data.normalDice, [10, 6]);
  assert.equal(payload.p_request_data.request.label, "Hunt prey");
  assert.deepEqual(input.requestData.normalDice, [1, 6]);
});

test("custom validation isolates source and returned nested data", () => {
  const input = validCustomInput();
  const payload = requirePayload(input);
  assert.equal(payload.p_roller_kind, "custom_dice_pool");

  input.requestData.quantities.coin = 0;
  input.resultData.coinResults[0] = "tails";
  input.resultData.groups[1].results[0] = 3;
  assert.equal(payload.p_request_data.quantities.coin, 3);
  assert.deepEqual(
    payload.p_result_data.coinResults,
    ["heads", "tails", "heads"],
  );
  assert.deepEqual(payload.p_result_data.groups[0].results, [1, 4]);

  payload.p_result_data.coinResults[0] = "tails";
  payload.p_result_data.groups[0].results[0] = 2;
  assert.deepEqual(input.resultData.coinResults, [
    "tails",
    "tails",
    "heads",
  ]);
  assert.deepEqual(input.resultData.groups[1].results, [3, 4]);
});

test("the personal roller registry is the single four-kind version authority", () => {
  assert.deepEqual(PERSONAL_ROLLER_KINDS, [
    "vtm_v5",
    "custom_dice_pool",
    "coc_7e_percentile",
    "coc_7e_other_dice",
  ]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(PERSONAL_ROLLER_REGISTRY).map(([kind, entry]) => [
        kind,
        entry.schemaVersion,
      ]),
    ),
    {
      vtm_v5: 1,
      custom_dice_pool: 1,
      coc_7e_percentile: 1,
      coc_7e_other_dice: 1,
    },
  );
});

test("CoC percentile persistence preserves physical dice and canonical outcomes", () => {
  const cases = [
    { target: null, bonusPenalty: 0, units: 7, tensDice: [20], result: 27, outcome: null, selected: 0 },
    { target: 1, bonusPenalty: 0, units: 1, tensDice: [0], result: 1, outcome: "critical", selected: 0 },
    { target: 40, bonusPenalty: 0, units: 8, tensDice: [0], result: 8, outcome: "extreme", selected: 0 },
    { target: 40, bonusPenalty: 0, units: 5, tensDice: [10], result: 15, outcome: "hard", selected: 0 },
    { target: 65, bonusPenalty: 0, units: 0, tensDice: [40], result: 40, outcome: "regular", selected: 0 },
    { target: 40, bonusPenalty: 0, units: 0, tensDice: [50], result: 50, outcome: "failure", selected: 0 },
    { target: 40, bonusPenalty: 0, units: 6, tensDice: [90], result: 96, outcome: "fumble", selected: 0 },
    { target: 65, bonusPenalty: 0, units: 9, tensDice: [90], result: 99, outcome: "failure", selected: 0 },
    { target: 65, bonusPenalty: 0, units: 0, tensDice: [0], result: 100, outcome: "fumble", selected: 0 },
    { target: 100, bonusPenalty: 0, units: 0, tensDice: [0], result: 100, outcome: "fumble", selected: 0 },
    { target: 40, bonusPenalty: 1, units: 0, tensDice: [0, 50], result: 50, outcome: "failure", selected: 1 },
    { target: 40, bonusPenalty: 3, units: 2, tensDice: [50, 20, 20, 80], result: 22, outcome: "regular", selected: 1 },
    { target: 65, bonusPenalty: -1, units: 4, tensDice: [10, 70], result: 74, outcome: "failure", selected: 1 },
    { target: 65, bonusPenalty: -3, units: 3, tensDice: [20, 80, 80, 40], result: 83, outcome: "failure", selected: 1 },
  ] as const;

  for (const expected of cases) {
    const payload = requirePayload(validCocPercentileInput(expected));
    assert.equal(payload.p_roller_kind, "coc_7e_percentile");
    assert.deepEqual(payload.p_request_data.tensDice, expected.tensDice);
    assert.equal(payload.p_result_data.percentileResult, expected.result);
    assert.equal(payload.p_result_data.outcome, expected.outcome);
    assert.equal(payload.p_result_data.selectedTensIndex, expected.selected);
  }
});

test("CoC percentile persistence canonicalizes result data and rejects invalid snapshots", () => {
  const input = validCocPercentileInput({
    target: 40,
    bonusPenalty: 1,
    units: 0,
    tensDice: [0, 20],
  });
  input.resultData = {
    percentileResult: 99,
    selectedTensIndex: 0,
  };
  const payload = requirePayload(input);
  assert.equal(payload.p_roller_kind, "coc_7e_percentile");
  assert.equal(payload.p_result_data.percentileResult, 20);
  assert.equal(payload.p_result_data.selectedTensIndex, 1);

  for (const invalid of [
    validCocPercentileInput({ target: 0 }),
    validCocPercentileInput({ bonusPenalty: 4 }),
    validCocPercentileInput({ units: 10 }),
    validCocPercentileInput({ bonusPenalty: 1, tensDice: [10] }),
    validCocPercentileInput({ tensDice: [15] }),
  ]) {
    assert.equal(validatePersonalRollForPersistence(invalid).ok, false);
  }

  const unexpected = validCocPercentileInput() as ReturnType<
    typeof validCocPercentileInput
  > & { requestData: { debug?: boolean } };
  unexpected.requestData.debug = true;
  assert.equal(validatePersonalRollForPersistence(unexpected).ok, false);
});

test("CoC Other Dice persistence supports every die and canonical formulas", () => {
  for (const sides of [2, 3, 4, 6, 8, 10, 20, 100]) {
    const payload = requirePayload(
      validCocOtherDiceInput({ sides, quantity: 1, results: [sides] }),
    );
    assert.equal(payload.p_roller_kind, "coc_7e_other_dice");
    assert.equal(payload.p_result_data.formula, `1D${sides}`);
    assert.equal(payload.p_result_data.total, sides);
  }

  const positive = requirePayload(
    validCocOtherDiceInput({
      sides: 6,
      quantity: 10,
      modifier: 10,
      results: [1, 2, 3, 4, 5, 6, 1, 2, 3, 4],
    }),
  );
  assert.equal(positive.p_roller_kind, "coc_7e_other_dice");
  assert.equal(positive.p_result_data.formula, "10D6 + 10");
  assert.deepEqual(positive.p_result_data.results, [1, 2, 3, 4, 5, 6, 1, 2, 3, 4]);

  const negative = requirePayload(
    validCocOtherDiceInput({ sides: 2, quantity: 1, modifier: -10, results: [1] }),
  );
  assert.equal(negative.p_roller_kind, "coc_7e_other_dice");
  assert.equal(negative.p_result_data.formula, "1D2 - 10");
  assert.equal(negative.p_result_data.total, -9);
});

test("CoC Other Dice persistence canonicalizes totals and rejects invalid snapshots", () => {
  const input = validCocOtherDiceInput({ modifier: 3 });
  input.resultData = { formula: "forged", subtotal: 99, total: 102 };
  const payload = requirePayload(input);
  assert.equal(payload.p_roller_kind, "coc_7e_other_dice");
  assert.equal(payload.p_result_data.formula, "2D6 + 3");
  assert.equal(payload.p_result_data.subtotal, 7);
  assert.equal(payload.p_result_data.total, 10);

  for (const invalid of [
    validCocOtherDiceInput({ sides: 5 }),
    validCocOtherDiceInput({ quantity: 0, results: [] }),
    validCocOtherDiceInput({ modifier: 11 }),
    validCocOtherDiceInput({ quantity: 2, results: [1] }),
    validCocOtherDiceInput({ sides: 6, results: [0, 7] }),
  ]) {
    assert.equal(validatePersonalRollForPersistence(invalid).ok, false);
  }
});

test("every supported kind rejects unsupported application schema versions", () => {
  for (const input of [
    validVtmInput(),
    validCustomInput(),
    validCocPercentileInput(),
    validCocOtherDiceInput(),
  ]) {
    input.schemaVersion = 2;
    assert.deepEqual(requireIssuePairs(input).filter((issue) => issue.path === "schemaVersion"), [
      { code: "unsupported-schema-version", path: "schemaVersion" },
    ]);
  }
});

test("validation never invokes cryptographic randomness", () => {
  const cryptoObject = globalThis.crypto;
  const ownDescriptor = Object.getOwnPropertyDescriptor(
    cryptoObject,
    "getRandomValues",
  );
  let calls = 0;

  Object.defineProperty(cryptoObject, "getRandomValues", {
    configurable: true,
    value() {
      calls += 1;
      throw new Error("randomness must not be used");
    },
  });

  try {
    requirePayload(validVtmInput());
    requirePayload(validCustomInput());
    requirePayload(validCocPercentileInput());
    requirePayload(validCocOtherDiceInput());
  } finally {
    if (ownDescriptor) {
      Object.defineProperty(
        cryptoObject,
        "getRandomValues",
        ownDescriptor,
      );
    } else {
      delete (cryptoObject as { getRandomValues?: unknown })
        .getRandomValues;
    }
  }

  assert.equal(calls, 0);
});
