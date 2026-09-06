import assert from "node:assert/strict";
import test from "node:test";

import type { Uint32RandomSource } from "../../lib/dice/secure-random";
import {
  evaluateCoc7ePercentileTest,
  type Coc7eBonusPenalty,
  type Coc7eTensValue,
} from "../../lib/game-systems/call-of-cthulhu-7e/dice-engine";
import { rollCoc7ePercentileTest } from "../../lib/game-systems/call-of-cthulhu-7e/dice-roller";

function createSequenceSource(values: readonly number[]): {
  source: Uint32RandomSource;
  calls: () => number;
} {
  let index = 0;

  return {
    source(target) {
      if (index >= values.length) {
        throw new Error("The deterministic random sequence was exhausted.");
      }

      target[0] = values[index];
      index += 1;
    },
    calls: () => index,
  };
}

function successfulRoll(
  request: unknown,
  values: readonly number[],
) {
  const { source, calls } = createSequenceSource(values);
  const evaluation = rollCoc7ePercentileTest(request, source);

  assert.equal(
    evaluation.ok,
    true,
    evaluation.ok ? undefined : JSON.stringify(evaluation.errors),
  );

  return { result: evaluation.result, calls };
}

test("invalid Target and Bonus or Penalty values consume no samples", () => {
  const invalidRequests = [
    { target: 0, bonusPenalty: 0 },
    { target: 101, bonusPenalty: 0 },
    { target: "60", bonusPenalty: 0 },
    { target: 60, bonusPenalty: -4 },
    { target: 60, bonusPenalty: 4 },
    { target: 60, bonusPenalty: "1" },
  ];
  const { source, calls } = createSequenceSource([0]);

  for (const request of invalidRequests) {
    assert.equal(rollCoc7ePercentileTest(request, source).ok, false);
  }

  assert.equal(calls(), 0);
});

test("every Bonus or Penalty value generates one Units and the exact Tens count", () => {
  for (const bonusPenalty of [-3, -2, -1, 0, 1, 2, 3] as const) {
    const tensCount = 1 + Math.abs(bonusPenalty);
    const samples = new Array(tensCount + 1).fill(0);
    const { result, calls } = successfulRoll({ bonusPenalty }, samples);

    assert.equal(result.units, 0);
    assert.equal(result.tensDice.length, tensCount);
    assert.equal(calls(), tensCount + 1);
  }
});

test("sample order is Units, base Tens, then additional Tens in order", () => {
  const cases: ReadonlyArray<{
    bonusPenalty: Coc7eBonusPenalty;
    samples: readonly number[];
    tensDice: readonly Coc7eTensValue[];
  }> = [
    { bonusPenalty: 1, samples: [4, 7, 2], tensDice: [70, 20] },
    { bonusPenalty: 3, samples: [4, 3, 8, 5, 9], tensDice: [30, 80, 50, 90] },
    { bonusPenalty: -1, samples: [4, 3, 8], tensDice: [30, 80] },
    { bonusPenalty: -3, samples: [4, 3, 8, 5, 9], tensDice: [30, 80, 50, 90] },
  ];

  for (const { bonusPenalty, samples, tensDice } of cases) {
    const { result, calls } = successfulRoll(
      { target: 60, bonusPenalty },
      samples,
    );

    assert.equal(result.units, 4);
    assert.deepEqual(result.tensDice, tensDice);
    assert.equal(calls(), samples.length);
  }
});

test("generator returns the evaluator's canonical result without reinterpreting it", () => {
  const request = { target: 60, bonusPenalty: 1 } as const;
  const generated = successfulRoll(request, [4, 7, 2]).result;
  const evaluated = evaluateCoc7ePercentileTest({
    request,
    units: 4,
    tensDice: [70, 20],
  });

  assert.equal(evaluated.ok, true);
  assert.deepEqual({ ok: true, result: generated }, evaluated);
  assert.equal(generated.percentileResult, 24);
  assert.equal(generated.outcome, "hard");
  assert.equal(generated.selectedTensIndex, 1);
});

test("physical zero candidates are interpreted only by the evaluator", () => {
  const bonus = successfulRoll(
    { target: 60, bonusPenalty: 1 },
    [0, 0, 4],
  ).result;
  const penalty = successfulRoll(
    { target: 60, bonusPenalty: -1 },
    [0, 0, 4],
  ).result;

  assert.deepEqual(bonus.candidates, [100, 40]);
  assert.equal(bonus.percentileResult, 40);
  assert.equal(bonus.selectedTensIndex, 1);
  assert.equal(penalty.percentileResult, 100);
  assert.equal(penalty.selectedTensIndex, 0);
});

test("Target omission preserves raw 1 and 100 with null outcomes", () => {
  const one = successfulRoll({ bonusPenalty: 0 }, [1, 0]).result;
  const hundred = successfulRoll({ bonusPenalty: 0 }, [0, 0]).result;

  assert.equal(one.percentileResult, 1);
  assert.equal(one.outcome, null);
  assert.equal(hundred.percentileResult, 100);
  assert.equal(hundred.outcome, null);
});

test("injected generation does not depend on Math.random", () => {
  const originalMathRandom = Math.random;
  Math.random = () => {
    throw new Error("Math.random must not be used for percentile generation.");
  };

  try {
    const result = successfulRoll({ bonusPenalty: 0 }, [4, 7]).result;
    assert.equal(result.percentileResult, 74);
  } finally {
    Math.random = originalMathRandom;
  }
});

test("request and returned evaluator arrays remain defensively isolated", () => {
  const request = { target: 60, bonusPenalty: 1 };
  const { result } = successfulRoll(request, [4, 7, 2]);

  request.target = 10;
  request.bonusPenalty = 0;

  assert.deepEqual(result.request, { target: 60, bonusPenalty: 1 });
  assert.deepEqual(result.tensDice, [70, 20]);
  assert.deepEqual(result.candidates, [74, 24]);
});
