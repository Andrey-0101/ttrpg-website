import assert from "node:assert/strict";
import test from "node:test";

import {
  COC_7E_TENS_VALUES,
  evaluateCoc7ePercentileTest,
  type Coc7eBonusPenalty,
  type Coc7ePercentileOutcome,
  type Coc7eTensValue,
} from "../../lib/game-systems/call-of-cthulhu-7e/dice-engine";

function successfulResult(options: {
  target?: number | null;
  bonusPenalty?: Coc7eBonusPenalty;
  units: number;
  tensDice: readonly Coc7eTensValue[];
}) {
  const { bonusPenalty = 0, units, tensDice } = options;
  const target = Object.prototype.hasOwnProperty.call(options, "target")
    ? options.target
    : 65;
  const evaluation = evaluateCoc7ePercentileTest({
    request: {
      bonusPenalty,
      ...(target === undefined ? {} : { target }),
    },
    units,
    tensDice,
  });

  assert.equal(
    evaluation.ok,
    true,
    evaluation.ok ? undefined : JSON.stringify(evaluation.errors),
  );

  return evaluation.result;
}

function errorsFor(input: unknown) {
  const evaluation = evaluateCoc7ePercentileTest(input);
  assert.equal(evaluation.ok, false);

  if (evaluation.ok) {
    assert.fail("Expected validation errors.");
  }

  return evaluation.errors;
}

function physicalDiceFor(percentileResult: number): {
  units: number;
  tensDice: readonly Coc7eTensValue[];
} {
  if (percentileResult === 100) {
    return { units: 0, tensDice: [0] };
  }

  return {
    units: percentileResult % 10,
    tensDice: [Math.floor(percentileResult / 10) * 10 as Coc7eTensValue],
  };
}

function outcomeFor(
  target: number,
  percentileResult: number,
): Coc7ePercentileOutcome {
  return successfulResult({
    target,
    ...physicalDiceFor(percentileResult),
  }).outcome!;
}

test("Target may be omitted or null and accepts inclusive boundaries", () => {
  for (const target of [undefined, null, 1, 100]) {
    const result = successfulResult({ target, units: 7, tensDice: [40] });
    assert.equal(result.request.target, target ?? null);
  }
});

test("Target rejects out-of-range and strict invalid number forms", () => {
  const cases = [
    { value: 0, code: "out-of-range" },
    { value: 101, code: "out-of-range" },
    { value: 1.5, code: "not-integer" },
    { value: "65", code: "invalid-type" },
    { value: Number.NaN, code: "not-finite" },
    { value: Number.POSITIVE_INFINITY, code: "not-finite" },
    { value: Number.NEGATIVE_INFINITY, code: "not-finite" },
  ];

  for (const { value, code } of cases) {
    assert.deepEqual(
      errorsFor({
        request: { target: value, bonusPenalty: 0 },
        units: 7,
        tensDice: [40],
      }).map(({ code: errorCode, path }) => ({ code: errorCode, path })),
      [{ code, path: "request.target" }],
    );
  }
});

test("Bonus and Penalty accept exactly every integer from -3 through 3", () => {
  for (const bonusPenalty of [-3, -2, -1, 0, 1, 2, 3] as const) {
    const result = successfulResult({
      bonusPenalty,
      units: 4,
      tensDice: new Array<Coc7eTensValue>(Math.abs(bonusPenalty) + 1).fill(20),
    });
    assert.equal(result.request.bonusPenalty, bonusPenalty);
  }
});

test("Bonus and Penalty reject out-of-range and strict invalid forms", () => {
  const cases = [
    { value: -4, code: "out-of-range" },
    { value: 4, code: "out-of-range" },
    { value: 0.5, code: "not-integer" },
    { value: "1", code: "invalid-type" },
    { value: Number.NaN, code: "not-finite" },
    { value: Number.POSITIVE_INFINITY, code: "not-finite" },
    { value: Number.NEGATIVE_INFINITY, code: "not-finite" },
  ];

  for (const { value, code } of cases) {
    assert.deepEqual(
      errorsFor({
        request: { target: 65, bonusPenalty: value },
        units: 4,
        tensDice: [20],
      }).map(({ code: errorCode, path }) => ({ code: errorCode, path })),
      [{ code, path: "request.bonusPenalty" }],
    );
  }
});

test("Units accept 0 and 9 and reject strict invalid forms", () => {
  for (const units of [0, 9]) {
    assert.equal(successfulResult({ units, tensDice: [40] }).units, units);
  }

  const cases = [
    { value: -1, code: "out-of-range" },
    { value: 10, code: "out-of-range" },
    { value: 1.5, code: "not-integer" },
    { value: "7", code: "invalid-type" },
    { value: Number.NaN, code: "not-finite" },
    { value: Number.POSITIVE_INFINITY, code: "not-finite" },
    { value: Number.NEGATIVE_INFINITY, code: "not-finite" },
  ];

  for (const { value, code } of cases) {
    assert.deepEqual(
      errorsFor({
        request: { target: 65, bonusPenalty: 0 },
        units: value,
        tensDice: [40],
      }).map(({ code: errorCode, path }) => ({ code: errorCode, path })),
      [{ code, path: "units" }],
    );
  }
});

test("Tens dice accept only the exact physical tens-face values", () => {
  for (const tens of COC_7E_TENS_VALUES) {
    assert.deepEqual(
      successfulResult({ units: 0, tensDice: [tens] }).tensDice,
      [tens],
    );
  }

  const cases = [
    { value: 1, code: "invalid-tens-value" },
    { value: 15, code: "invalid-tens-value" },
    { value: 100, code: "invalid-tens-value" },
    { value: 10.5, code: "not-integer" },
    { value: "10", code: "invalid-type" },
    { value: Number.NaN, code: "not-finite" },
    { value: Number.POSITIVE_INFINITY, code: "not-finite" },
  ];

  for (const { value, code } of cases) {
    assert.deepEqual(
      errorsFor({
        request: { target: 65, bonusPenalty: 0 },
        units: 0,
        tensDice: [value],
      }).map(({ code: errorCode, path }) => ({ code: errorCode, path })),
      [{ code, path: "tensDice[0]" }],
    );
  }
});

test("Tens count is exactly one plus the absolute Bonus or Penalty value", () => {
  for (const bonusPenalty of [-3, -2, -1, 0, 1, 2, 3] as const) {
    const expected = Math.abs(bonusPenalty) + 1;

    for (let actual = 0; actual <= 5; actual += 1) {
      const input = {
        request: { target: 65, bonusPenalty },
        units: 4,
        tensDice: new Array(actual).fill(20),
      };
      const evaluation = evaluateCoc7ePercentileTest(input);

      if (actual === expected) {
        assert.equal(evaluation.ok, true);
      } else {
        assert.deepEqual(errorsFor(input)[0], {
          code: "wrong-array-length",
          path: "tensDice",
          details: { expected, actual },
        });
      }
    }
  }
});

test("malformed structures and unexpected fields fail deterministically", () => {
  assert.deepEqual(errorsFor(null), [
    { code: "invalid-type", path: "$" },
  ]);
  assert.deepEqual(errorsFor([]), [
    { code: "invalid-type", path: "$" },
  ]);
  assert.deepEqual(
    errorsFor({
      request: { target: 65, bonusPenalty: 0, label: "No label" },
      units: 7,
      tensDice: [40],
      randomSeed: 1,
    }).map(({ code, path }) => ({ code, path })),
    [
      { code: "unexpected-field", path: "request.label" },
      { code: "unexpected-field", path: "$.randomSeed" },
    ],
  );
});

test("physical tens and units compose every percentile edge correctly", () => {
  const cases = [
    { tens: 0, units: 0, expected: 100 },
    { tens: 0, units: 7, expected: 7 },
    { tens: 40, units: 0, expected: 40 },
    { tens: 40, units: 7, expected: 47 },
    { tens: 90, units: 9, expected: 99 },
  ] as const;

  for (const { tens, units, expected } of cases) {
    const result = successfulResult({ units, tensDice: [tens] });
    assert.deepEqual(result.candidates, [expected]);
    assert.equal(result.percentileResult, expected);
    assert.equal(result.selectedTensIndex, 0);
  }
});

test("Normal, one through three Bonus, and one through three Penalty select complete candidates", () => {
  const cases = [
    { bonusPenalty: 0, tensDice: [40], expected: 47, index: 0 },
    { bonusPenalty: 1, tensDice: [80, 40], expected: 47, index: 1 },
    { bonusPenalty: 2, tensDice: [80, 40, 10], expected: 17, index: 2 },
    { bonusPenalty: 3, tensDice: [80, 40, 10, 0], expected: 7, index: 3 },
    { bonusPenalty: -1, tensDice: [10, 80], expected: 87, index: 1 },
    { bonusPenalty: -2, tensDice: [10, 80, 40], expected: 87, index: 1 },
    { bonusPenalty: -3, tensDice: [10, 80, 40, 90], expected: 97, index: 3 },
  ] as const;

  for (const { bonusPenalty, tensDice, expected, index } of cases) {
    const result = successfulResult({ bonusPenalty, units: 7, tensDice });
    assert.equal(result.percentileResult, expected);
    assert.equal(result.selectedTensIndex, index);
  }
});

test("units zero selection compares complete candidates where 00 means 100", () => {
  const bonus = successfulResult({
    bonusPenalty: 1,
    units: 0,
    tensDice: [0, 40],
  });
  const penalty = successfulResult({
    bonusPenalty: -1,
    units: 0,
    tensDice: [0, 40],
  });

  assert.deepEqual(bonus.candidates, [100, 40]);
  assert.equal(bonus.percentileResult, 40);
  assert.equal(bonus.selectedTensIndex, 1);
  assert.equal(penalty.percentileResult, 100);
  assert.equal(penalty.selectedTensIndex, 0);
});

test("duplicate winning candidates select the first ordered tens die", () => {
  const result = successfulResult({
    bonusPenalty: 2,
    units: 4,
    tensDice: [20, 40, 20],
  });

  assert.deepEqual(result.candidates, [24, 44, 24]);
  assert.equal(result.percentileResult, 24);
  assert.equal(result.selectedTensIndex, 0);
});

test("Target thresholds use floor division including odd and edge values", () => {
  for (const [target, hardThreshold, extremeThreshold] of [
    [65, 32, 13],
    [1, 0, 0],
    [100, 50, 20],
  ] as const) {
    const result = successfulResult({ target, units: 4, tensDice: [20] });
    assert.equal(result.hardThreshold, hardThreshold);
    assert.equal(result.extremeThreshold, extremeThreshold);
  }
});

test("Target 65 outcome boundaries follow critical-to-fumble precedence", () => {
  for (const [result, outcome] of [
    [1, "critical"],
    [2, "extreme"],
    [13, "extreme"],
    [14, "hard"],
    [32, "hard"],
    [33, "regular"],
    [65, "regular"],
    [66, "failure"],
    [99, "failure"],
    [100, "fumble"],
  ] as const) {
    assert.equal(outcomeFor(65, result), outcome);
  }
});

test("Target 40 outcome boundaries use the lower-target fumble range", () => {
  for (const [result, outcome] of [
    [1, "critical"],
    [2, "extreme"],
    [8, "extreme"],
    [9, "hard"],
    [20, "hard"],
    [21, "regular"],
    [40, "regular"],
    [41, "failure"],
    [95, "failure"],
    [96, "fumble"],
    [100, "fumble"],
  ] as const) {
    assert.equal(outcomeFor(40, result), outcome);
  }
});

test("Target 1 keeps zero Hard and Extreme thresholds", () => {
  assert.equal(outcomeFor(1, 1), "critical");
  assert.equal(outcomeFor(1, 2), "failure");
  assert.equal(outcomeFor(1, 95), "failure");
  assert.equal(outcomeFor(1, 96), "fumble");
  assert.equal(outcomeFor(1, 100), "fumble");
});

test("Target 100 treats 100 as Fumble rather than Regular", () => {
  for (const [result, outcome] of [
    [1, "critical"],
    [20, "extreme"],
    [21, "hard"],
    [50, "hard"],
    [51, "regular"],
    [99, "regular"],
    [100, "fumble"],
  ] as const) {
    assert.equal(outcomeFor(100, result), outcome);
  }
});

test("no Target leaves interpretation null while selection still works", () => {
  for (const percentileResult of [1, 100]) {
    const result = successfulResult({
      target: undefined,
      ...physicalDiceFor(percentileResult),
    });
    assert.equal(result.request.target, null);
    assert.equal(result.outcome, null);
    assert.equal(result.hardThreshold, null);
    assert.equal(result.extremeThreshold, null);
  }

  const bonus = successfulResult({
    target: undefined,
    bonusPenalty: 1,
    units: 0,
    tensDice: [0, 40],
  });
  assert.equal(bonus.percentileResult, 40);
  assert.equal(bonus.selectedTensIndex, 1);
  assert.equal(bonus.outcome, null);
});

test("input and returned arrays are defensively isolated", () => {
  const tensDice: Coc7eTensValue[] = [80, 40];
  const result = successfulResult({
    bonusPenalty: 1,
    units: 7,
    tensDice,
  });

  assert.notEqual(result.tensDice, tensDice);
  assert.deepEqual(tensDice, [80, 40]);

  (result.tensDice as Coc7eTensValue[])[0] = 0;
  (result.candidates as number[])[0] = 100;

  assert.deepEqual(tensDice, [80, 40]);
  assert.deepEqual(
    successfulResult({ bonusPenalty: 1, units: 7, tensDice }).candidates,
    [87, 47],
  );
});
