import assert from "node:assert/strict";
import test from "node:test";

import { evaluateVtmV5Dice } from "../../lib/game-systems/vtm-v5/dice-engine";
import {
  rollVtmV5Dice,
  type VtmV5RandomSource,
} from "../../lib/game-systems/vtm-v5/dice-roller";

function createSequenceSource(values: readonly number[]): {
  source: VtmV5RandomSource;
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

function getSuccessfulResult(
  request: unknown,
  source: VtmV5RandomSource,
) {
  const evaluation = rollVtmV5Dice(request, source);

  assert.equal(
    evaluation.ok,
    true,
    evaluation.ok ? undefined : JSON.stringify(evaluation.errors),
  );

  return evaluation.result;
}

test("generated values are integer d10 results", () => {
  const values = Array.from({ length: 50 }, (_, index) => index % 10);
  const { source } = createSequenceSource(values);
  const result = getSuccessfulResult(
    { pool: 50, hungerDice: 5 },
    source,
  );

  for (const die of [...result.normalDice, ...result.hungerDiceResults]) {
    assert.equal(Number.isInteger(die), true);
    assert.equal(die >= 1 && die <= 10, true);
  }
});

test("rejection sampling discards the biased uint32 remainder", () => {
  const { source, calls } = createSequenceSource([4_294_967_290, 9]);
  const result = getSuccessfulResult(
    { pool: 1, hungerDice: 0 },
    source,
  );

  assert.deepEqual(result.normalDice, [10]);
  assert.equal(calls(), 2);
});

test("normal and Hunger arrays have exact requested lengths", () => {
  const { source } = createSequenceSource([0, 1, 2, 3, 4, 5, 6]);
  const result = getSuccessfulResult(
    { pool: 7, hungerDice: 3 },
    source,
  );

  assert.equal(result.normalDice.length, 4);
  assert.equal(result.hungerDiceResults.length, 3);
});

test("an injectable source produces deterministic separated dice", () => {
  const { source } = createSequenceSource([0, 1, 2, 9, 10]);
  const result = getSuccessfulResult(
    { pool: 5, hungerDice: 2, difficulty: 2, label: "Test" },
    source,
  );

  assert.deepEqual(result.normalDice, [1, 2, 3]);
  assert.deepEqual(result.hungerDiceResults, [10, 1]);
});

test("invalid requests return evaluator errors without consuming randomness", () => {
  const { source, calls } = createSequenceSource([0]);
  const evaluation = rollVtmV5Dice(
    { pool: 2, hungerDice: 3 },
    source,
  );

  assert.equal(evaluation.ok, false);
  assert.equal(calls(), 0);

  if (evaluation.ok) {
    assert.fail("Expected request validation errors.");
  }

  assert.deepEqual(
    evaluation.errors.map(({ code, path }) => ({ code, path })),
    [{ code: "hunger-exceeds-pool", path: "request.hungerDice" }],
  );
});

test("generated arrays are passed unchanged to the existing evaluator", () => {
  const request = {
    pool: 4,
    hungerDice: 1,
    difficulty: 3,
    label: "Unchanged dice",
  };
  const { source } = createSequenceSource([9, 5, 0, 9]);
  const generatedEvaluation = rollVtmV5Dice(request, source);

  assert.equal(generatedEvaluation.ok, true);

  if (!generatedEvaluation.ok) {
    assert.fail("Expected a generated dice result.");
  }

  assert.deepEqual(generatedEvaluation.result.normalDice, [10, 6, 1]);
  assert.deepEqual(generatedEvaluation.result.hungerDiceResults, [10]);

  const directEvaluation = evaluateVtmV5Dice({
    request,
    normalDice: generatedEvaluation.result.normalDice,
    hungerDiceResults: generatedEvaluation.result.hungerDiceResults,
  });

  assert.deepEqual(generatedEvaluation, directEvaluation);
});
