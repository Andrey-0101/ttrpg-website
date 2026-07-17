import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateVtmV5Dice,
  type VtmV5DiceEvaluationInput,
  type VtmV5DiceResult,
  type VtmV5DiceValidationError,
} from "../../lib/game-systems/vtm-v5/dice-engine";

type ExpectedResult = Pick<
  VtmV5DiceResult,
  | "nonTenSuccessCount"
  | "tenCount"
  | "criticalPairCount"
  | "totalSuccesses"
  | "isSuccess"
  | "isOrdinaryCritical"
  | "isMessyCritical"
  | "isTotalFailure"
  | "isBestialFailure"
  | "difficultyResult"
  | "margin"
  | "summaryKey"
>;

type ValidExample = {
  name: string;
  input: VtmV5DiceEvaluationInput;
  expected: ExpectedResult;
  expectedDetailFlags?: Partial<VtmV5DiceResult["detailFlags"]>;
};

function getResult(input: unknown): VtmV5DiceResult {
  const evaluation = evaluateVtmV5Dice(input);

  assert.equal(
    evaluation.ok,
    true,
    evaluation.ok
      ? undefined
      : JSON.stringify(evaluation.errors),
  );

  return evaluation.result;
}

function getErrors(
  input: unknown,
): readonly VtmV5DiceValidationError[] {
  const evaluation = evaluateVtmV5Dice(input);

  assert.equal(evaluation.ok, false);

  if (evaluation.ok) {
    assert.fail("Expected validation errors.");
  }

  return evaluation.errors;
}

const validExamples: readonly ValidExample[] = [
  {
    name: "ordinary success",
    input: {
      request: { pool: 3, hungerDice: 1, difficulty: 1 },
      normalDice: [6, 4],
      hungerDiceResults: [7],
    },
    expected: {
      nonTenSuccessCount: 2,
      tenCount: 0,
      criticalPairCount: 0,
      totalSuccesses: 2,
      isSuccess: true,
      isOrdinaryCritical: false,
      isMessyCritical: false,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "success",
      margin: 1,
      summaryKey: "success",
    },
  },
  {
    name: "exact Difficulty",
    input: {
      request: { pool: 2, hungerDice: 0, difficulty: 1 },
      normalDice: [6, 2],
      hungerDiceResults: [],
    },
    expected: {
      nonTenSuccessCount: 1,
      tenCount: 0,
      criticalPairCount: 0,
      totalSuccesses: 1,
      isSuccess: true,
      isOrdinaryCritical: false,
      isMessyCritical: false,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "success",
      margin: 0,
      summaryKey: "success",
    },
  },
  {
    name: "failure below Difficulty",
    input: {
      request: { pool: 3, hungerDice: 1, difficulty: 3 },
      normalDice: [6, 2],
      hungerDiceResults: [7],
    },
    expected: {
      nonTenSuccessCount: 2,
      tenCount: 0,
      criticalPairCount: 0,
      totalSuccesses: 2,
      isSuccess: false,
      isOrdinaryCritical: false,
      isMessyCritical: false,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "failure",
      margin: -1,
      summaryKey: "failure",
    },
  },
  {
    name: "zero-success total failure",
    input: {
      request: { pool: 3, hungerDice: 0, difficulty: 1 },
      normalDice: [2, 3, 5],
      hungerDiceResults: [],
    },
    expected: {
      nonTenSuccessCount: 0,
      tenCount: 0,
      criticalPairCount: 0,
      totalSuccesses: 0,
      isSuccess: false,
      isOrdinaryCritical: false,
      isMessyCritical: false,
      isTotalFailure: true,
      isBestialFailure: false,
      difficultyResult: "failure",
      margin: -1,
      summaryKey: "total-failure",
    },
    expectedDetailFlags: { hasZeroSuccesses: true },
  },
  {
    name: "ordinary critical",
    input: {
      request: { pool: 4, hungerDice: 1, difficulty: 4 },
      normalDice: [10, 10, 2],
      hungerDiceResults: [6],
    },
    expected: {
      nonTenSuccessCount: 1,
      tenCount: 2,
      criticalPairCount: 1,
      totalSuccesses: 5,
      isSuccess: true,
      isOrdinaryCritical: true,
      isMessyCritical: false,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "success",
      margin: 1,
      summaryKey: "ordinary-critical",
    },
  },
  {
    name: "messy critical",
    input: {
      request: { pool: 4, hungerDice: 1, difficulty: 4 },
      normalDice: [10, 2, 3],
      hungerDiceResults: [10],
    },
    expected: {
      nonTenSuccessCount: 0,
      tenCount: 2,
      criticalPairCount: 1,
      totalSuccesses: 4,
      isSuccess: true,
      isOrdinaryCritical: false,
      isMessyCritical: true,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "success",
      margin: 0,
      summaryKey: "messy-critical",
    },
    expectedDetailFlags: { hasHungerTen: true },
  },
  {
    name: "multiple critical pairs",
    input: {
      request: { pool: 5, hungerDice: 1, difficulty: 8 },
      normalDice: [10, 10, 10, 2],
      hungerDiceResults: [10],
    },
    expected: {
      nonTenSuccessCount: 0,
      tenCount: 4,
      criticalPairCount: 2,
      totalSuccesses: 8,
      isSuccess: true,
      isOrdinaryCritical: false,
      isMessyCritical: true,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "success",
      margin: 0,
      summaryKey: "messy-critical",
    },
  },
  {
    name: "unpaired extra ten",
    input: {
      request: { pool: 4, hungerDice: 0, difficulty: 5 },
      normalDice: [10, 10, 10, 2],
      hungerDiceResults: [],
    },
    expected: {
      nonTenSuccessCount: 0,
      tenCount: 3,
      criticalPairCount: 1,
      totalSuccesses: 5,
      isSuccess: true,
      isOrdinaryCritical: true,
      isMessyCritical: false,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "success",
      margin: 0,
      summaryKey: "ordinary-critical",
    },
    expectedDetailFlags: { hasUnpairedTen: true },
  },
  {
    name: "bestial failure with ordinary successes",
    input: {
      request: { pool: 4, hungerDice: 1, difficulty: 3 },
      normalDice: [6, 7, 2],
      hungerDiceResults: [1],
    },
    expected: {
      nonTenSuccessCount: 2,
      tenCount: 0,
      criticalPairCount: 0,
      totalSuccesses: 2,
      isSuccess: false,
      isOrdinaryCritical: false,
      isMessyCritical: false,
      isTotalFailure: false,
      isBestialFailure: true,
      difficultyResult: "failure",
      margin: -1,
      summaryKey: "bestial-failure",
    },
  },
  {
    name: "combined total and bestial failure",
    input: {
      request: { pool: 3, hungerDice: 1, difficulty: 1 },
      normalDice: [2, 3],
      hungerDiceResults: [1],
    },
    expected: {
      nonTenSuccessCount: 0,
      tenCount: 0,
      criticalPairCount: 0,
      totalSuccesses: 0,
      isSuccess: false,
      isOrdinaryCritical: false,
      isMessyCritical: false,
      isTotalFailure: true,
      isBestialFailure: true,
      difficultyResult: "failure",
      margin: -1,
      summaryKey: "bestial-failure",
    },
  },
  {
    name: "Hunger 1 on a successful test",
    input: {
      request: { pool: 3, hungerDice: 1, difficulty: 1 },
      normalDice: [6, 2],
      hungerDiceResults: [1],
    },
    expected: {
      nonTenSuccessCount: 1,
      tenCount: 0,
      criticalPairCount: 0,
      totalSuccesses: 1,
      isSuccess: true,
      isOrdinaryCritical: false,
      isMessyCritical: false,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "success",
      margin: 0,
      summaryKey: "success",
    },
    expectedDetailFlags: { hasHungerOne: true },
  },
  {
    name: "pair of tens below Difficulty",
    input: {
      request: { pool: 3, hungerDice: 1, difficulty: 5 },
      normalDice: [10, 10],
      hungerDiceResults: [2],
    },
    expected: {
      nonTenSuccessCount: 0,
      tenCount: 2,
      criticalPairCount: 1,
      totalSuccesses: 4,
      isSuccess: false,
      isOrdinaryCritical: false,
      isMessyCritical: false,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "failure",
      margin: -1,
      summaryKey: "failure",
    },
    expectedDetailFlags: {
      criticalPairBelowDifficulty: true,
    },
  },
  {
    name: "omitted Difficulty",
    input: {
      request: { pool: 3, hungerDice: 1 },
      normalDice: [10, 6],
      hungerDiceResults: [10],
    },
    expected: {
      nonTenSuccessCount: 1,
      tenCount: 2,
      criticalPairCount: 1,
      totalSuccesses: 5,
      isSuccess: null,
      isOrdinaryCritical: false,
      isMessyCritical: false,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "not-set",
      margin: null,
      summaryKey: "critical-pair-unresolved",
    },
    expectedDetailFlags: { difficultyOmitted: true },
  },
  {
    name: "zero Hunger dice",
    input: {
      request: { pool: 2, hungerDice: 0, difficulty: 1 },
      normalDice: [6, 2],
      hungerDiceResults: [],
    },
    expected: {
      nonTenSuccessCount: 1,
      tenCount: 0,
      criticalPairCount: 0,
      totalSuccesses: 1,
      isSuccess: true,
      isOrdinaryCritical: false,
      isMessyCritical: false,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "success",
      margin: 0,
      summaryKey: "success",
    },
  },
  {
    name: "Hunger equal to the full pool",
    input: {
      request: { pool: 3, hungerDice: 3, difficulty: 2 },
      normalDice: [],
      hungerDiceResults: [10, 10, 1],
    },
    expected: {
      nonTenSuccessCount: 0,
      tenCount: 2,
      criticalPairCount: 1,
      totalSuccesses: 4,
      isSuccess: true,
      isOrdinaryCritical: false,
      isMessyCritical: true,
      isTotalFailure: false,
      isBestialFailure: false,
      difficultyResult: "success",
      margin: 2,
      summaryKey: "messy-critical",
    },
    expectedDetailFlags: {
      hasHungerOne: true,
      hasHungerTen: true,
    },
  },
];

for (const example of validExamples) {
  test(example.name, () => {
    const result = getResult(example.input);

    assert.equal(result.gameSystem, "vtm-v5");
    assert.deepEqual(result.request, {
      pool: example.input.request.pool,
      hungerDice: example.input.request.hungerDice,
      difficulty: example.input.request.difficulty ?? null,
      label: example.input.request.label ?? null,
    });
    assert.equal(
      result.hasCriticalPair,
      example.expected.criticalPairCount > 0,
    );
    assert.equal(
      result.detailFlags.hasNonTenSuccess,
      example.expected.nonTenSuccessCount > 0,
    );

    assert.deepEqual(
      {
        nonTenSuccessCount: result.nonTenSuccessCount,
        tenCount: result.tenCount,
        criticalPairCount: result.criticalPairCount,
        totalSuccesses: result.totalSuccesses,
        isSuccess: result.isSuccess,
        isOrdinaryCritical: result.isOrdinaryCritical,
        isMessyCritical: result.isMessyCritical,
        isTotalFailure: result.isTotalFailure,
        isBestialFailure: result.isBestialFailure,
        difficultyResult: result.difficultyResult,
        margin: result.margin,
        summaryKey: result.summaryKey,
      },
      example.expected,
    );

    for (const [flag, expectedValue] of Object.entries(
      example.expectedDetailFlags ?? {},
    )) {
      assert.equal(
        result.detailFlags[
          flag as keyof VtmV5DiceResult["detailFlags"]
        ],
        expectedValue,
      );
    }
  });
}

test("invalid pool", () => {
  assert.deepEqual(
    getErrors({
      request: { pool: 0, hungerDice: 0, difficulty: 1 },
      normalDice: [],
      hungerDiceResults: [],
    })[0],
    {
      code: "out-of-range",
      path: "request.pool",
      details: { minimum: 1, maximum: 50 },
    },
  );
});

test("invalid Hunger count above pool", () => {
  assert.deepEqual(
    getErrors({
      request: { pool: 2, hungerDice: 3, difficulty: 1 },
      normalDice: [],
      hungerDiceResults: [1, 2, 3],
    })[0],
    {
      code: "hunger-exceeds-pool",
      path: "request.hungerDice",
      details: { pool: 2 },
    },
  );
});

test("invalid Hunger count above range", () => {
  assert.equal(
    getErrors({
      request: { pool: 6, hungerDice: 6, difficulty: 1 },
      normalDice: [],
      hungerDiceResults: [1, 2, 3, 4, 5, 6],
    })[0]?.code,
    "out-of-range",
  );
});

test("invalid die value", () => {
  assert.deepEqual(
    getErrors({
      request: { pool: 2, hungerDice: 1, difficulty: 1 },
      normalDice: [11],
      hungerDiceResults: [6],
    })[0],
    {
      code: "invalid-die-value",
      path: "normalDice[0]",
      details: { minimum: 1, maximum: 10 },
    },
  );
});

test("incorrect normal dice-array length", () => {
  assert.deepEqual(
    getErrors({
      request: { pool: 3, hungerDice: 1, difficulty: 1 },
      normalDice: [6],
      hungerDiceResults: [7],
    })[0],
    {
      code: "wrong-array-length",
      path: "normalDice",
      details: { expected: 2, actual: 1 },
    },
  );
});

test("extra Hunger die", () => {
  assert.deepEqual(
    getErrors({
      request: { pool: 2, hungerDice: 1, difficulty: 1 },
      normalDice: [6],
      hungerDiceResults: [7, 8],
    })[0],
    {
      code: "wrong-array-length",
      path: "hungerDiceResults",
      details: { expected: 1, actual: 2 },
    },
  );
});

test("NaN is rejected", () => {
  assert.equal(
    getErrors({
      request: { pool: Number.NaN, hungerDice: 0 },
      normalDice: [],
      hungerDiceResults: [],
    })[0]?.code,
    "not-finite",
  );
});

test("positive Infinity is rejected", () => {
  assert.deepEqual(
    getErrors({
      request: { pool: 1, hungerDice: 0 },
      normalDice: [Number.POSITIVE_INFINITY],
      hungerDiceResults: [],
    })[0],
    { code: "not-finite", path: "normalDice[0]" },
  );
});

test("negative Infinity is rejected", () => {
  assert.deepEqual(
    getErrors({
      request: { pool: 1, hungerDice: 0 },
      normalDice: [Number.NEGATIVE_INFINITY],
      hungerDiceResults: [],
    })[0],
    { code: "not-finite", path: "normalDice[0]" },
  );
});

test("non-integer pool is rejected", () => {
  assert.equal(
    getErrors({
      request: { pool: 2.5, hungerDice: 0 },
      normalDice: [],
      hungerDiceResults: [],
    })[0]?.code,
    "not-integer",
  );
});

test("non-integer die value is rejected", () => {
  assert.deepEqual(
    getErrors({
      request: { pool: 1, hungerDice: 0 },
      normalDice: [6.5],
      hungerDiceResults: [],
    })[0],
    { code: "not-integer", path: "normalDice[0]" },
  );
});

test("numeric strings are rejected without coercion", () => {
  const errors = getErrors({
    request: { pool: "2", hungerDice: 0 },
    normalDice: ["6", 7],
    hungerDiceResults: [],
  });

  assert.deepEqual(
    errors.map(({ code, path }) => ({ code, path })),
    [
      { code: "invalid-type", path: "request.pool" },
      { code: "invalid-type", path: "normalDice[0]" },
    ],
  );
});

test("unexpected top-level and request fields are rejected", () => {
  const errors = getErrors({
    request: {
      pool: 1,
      hungerDice: 0,
      modifier: 1,
    },
    normalDice: [6],
    hungerDiceResults: [],
    actorId: "not-accepted",
  });

  assert.deepEqual(
    errors.map(({ code, path }) => ({ code, path })),
    [
      {
        code: "unexpected-field",
        path: "request.modifier",
      },
      { code: "unexpected-field", path: "$.actorId" },
    ],
  );
});

test("empty normalized label becomes null", () => {
  const result = getResult({
    request: {
      pool: 1,
      hungerDice: 0,
      label: " \t\n ",
    },
    normalDice: [6],
    hungerDiceResults: [],
  });

  assert.equal(result.request.label, null);
});

test("label whitespace is trimmed and collapsed", () => {
  const result = getResult({
    request: {
      pool: 1,
      hungerDice: 0,
      label: "  Resolve\t+\nComposure  ",
    },
    normalDice: [6],
    hungerDiceResults: [],
  });

  assert.equal(result.request.label, "Resolve + Composure");
});

test("121-code-point label is rejected", () => {
  const errors = getErrors({
    request: {
      pool: 1,
      hungerDice: 0,
      label: "😀".repeat(121),
    },
    normalDice: [6],
    hungerDiceResults: [],
  });

  assert.deepEqual(errors[0], {
    code: "label-too-long",
    path: "request.label",
    details: { maximum: 120, actual: 121 },
  });
});

test("multiple validation errors have stable ordering", () => {
  const input = {
    request: {
      pool: 2.5,
      hungerDice: 6,
      difficulty: "2",
      label: "x".repeat(121),
      zeta: true,
      alpha: true,
    },
    normalDice: [Number.NaN, 5.5, 11, "6"],
    hungerDiceResults: "not-an-array",
    zeta: true,
    alpha: true,
  };

  const expected = [
    ["not-integer", "request.pool"],
    ["out-of-range", "request.hungerDice"],
    ["invalid-type", "request.difficulty"],
    ["label-too-long", "request.label"],
    ["unexpected-field", "request.alpha"],
    ["unexpected-field", "request.zeta"],
    ["not-finite", "normalDice[0]"],
    ["not-integer", "normalDice[1]"],
    ["invalid-die-value", "normalDice[2]"],
    ["invalid-type", "normalDice[3]"],
    ["invalid-type", "hungerDiceResults"],
    ["unexpected-field", "$.alpha"],
    ["unexpected-field", "$.zeta"],
  ];

  for (let index = 0; index < 2; index += 1) {
    assert.deepEqual(
      getErrors(input).map(({ code, path }) => [code, path]),
      expected,
    );
  }
});

test("missing required fields are reported without dependent length errors", () => {
  assert.deepEqual(
    getErrors({
      request: {},
      normalDice: [],
      hungerDiceResults: [],
    }).map(({ code, path }) => ({ code, path })),
    [
      { code: "required", path: "request.pool" },
      { code: "required", path: "request.hungerDice" },
    ],
  );

  assert.deepEqual(
    getErrors({
      request: { pool: 1, hungerDice: 0 },
    }).map(({ code, path }) => ({ code, path })),
    [
      { code: "required", path: "normalDice" },
      { code: "required", path: "hungerDiceResults" },
    ],
  );
});

test("inherited fields do not satisfy the input contract", () => {
  const inheritedInput = Object.create({
    request: { pool: 1, hungerDice: 0 },
    normalDice: [6],
    hungerDiceResults: [],
  });

  assert.deepEqual(
    getErrors(inheritedInput).map(({ code, path }) => ({
      code,
      path,
    })),
    [
      { code: "required", path: "request" },
      { code: "required", path: "normalDice" },
      { code: "required", path: "hungerDiceResults" },
    ],
  );

  const inheritedRequest = Object.create({
    pool: 1,
    hungerDice: 0,
  });

  assert.deepEqual(
    getErrors({
      request: inheritedRequest,
      normalDice: [],
      hungerDiceResults: [],
    }).map(({ code, path }) => ({ code, path })),
    [
      { code: "required", path: "request.pool" },
      { code: "required", path: "request.hungerDice" },
    ],
  );
});

test("input mutation cannot change the normalized request or result arrays", () => {
  const request = {
    pool: 3,
    hungerDice: 1,
    label: "  Original label  ",
  };
  const normalDice = [6, 10];
  const hungerDiceResults = [10];
  const originalNormalDice = [...normalDice];
  const originalHungerDiceResults = [...hungerDiceResults];
  const result = getResult({
    request,
    normalDice,
    hungerDiceResults,
  });

  assert.deepEqual(normalDice, originalNormalDice);
  assert.deepEqual(
    hungerDiceResults,
    originalHungerDiceResults,
  );
  assert.notStrictEqual(result.normalDice, normalDice);
  assert.notStrictEqual(
    result.hungerDiceResults,
    hungerDiceResults,
  );

  request.pool = 1;
  request.hungerDice = 0;
  request.label = "Changed label";
  normalDice[0] = 1;
  hungerDiceResults[0] = 1;

  assert.deepEqual(result.request, {
    pool: 3,
    hungerDice: 1,
    difficulty: null,
    label: "Original label",
  });
  assert.deepEqual(result.normalDice, originalNormalDice);
  assert.deepEqual(
    result.hungerDiceResults,
    originalHungerDiceResults,
  );
});

test("non-object input returns a typed validation result", () => {
  assert.deepEqual(getErrors(null), [
    { code: "invalid-type", path: "$" },
  ]);
});
