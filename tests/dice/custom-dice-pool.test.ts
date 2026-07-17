import assert from "node:assert/strict";
import test from "node:test";

import {
  CUSTOM_COIN_OUTCOME_SPLIT,
  CUSTOM_DICE_POOL_LIMITS,
  CUSTOM_DIE_SIDES,
  rollCustomDicePool,
  type CustomDiceQuantities,
  type CustomDiceRandomSource,
} from "../../lib/dice/custom-dice-pool";

function emptyQuantities(): CustomDiceQuantities {
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

function createSequenceSource(values: readonly number[]): {
  source: CustomDiceRandomSource;
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

function successfulResult(
  quantities: CustomDiceQuantities,
  source: CustomDiceRandomSource,
) {
  const evaluation = rollCustomDicePool({ quantities }, source);

  assert.equal(
    evaluation.ok,
    true,
    evaluation.ok ? undefined : JSON.stringify(evaluation.errors),
  );

  return evaluation.result;
}

test("every supported die result remains within its correct range", () => {
  const quantities = emptyQuantities();
  for (const sides of CUSTOM_DIE_SIDES) quantities[sides] = 2;
  const values = CUSTOM_DIE_SIDES.flatMap((sides) => [0, sides - 1]);
  const { source } = createSequenceSource(values);
  const result = successfulResult(quantities, source);

  for (const group of result.groups) {
    assert.equal(group.results.length, 2);
    for (const value of group.results) {
      assert.equal(Number.isInteger(value), true);
      assert.equal(value >= 1 && value <= group.sides, true);
    }
  }
});

test("exact requested quantities are generated and zero quantities are omitted", () => {
  const quantities = { ...emptyQuantities(), 4: 2, 10: 3, 100: 1 };
  const { source } = createSequenceSource([0, 1, 2, 3, 4, 99]);
  const result = successfulResult(quantities, source);

  assert.deepEqual(
    result.groups.map(({ sides, results }) => ({ sides, count: results.length })),
    [
      { sides: 4, count: 2 },
      { sides: 10, count: 3 },
      { sides: 100, count: 1 },
    ],
  );
  assert.equal(result.totalItems, 6);
});

test("an injectable source produces deterministic grouped results", () => {
  const quantities = { ...emptyQuantities(), 6: 2, 20: 2 };
  const { source } = createSequenceSource([0, 5, 19, 20]);
  const result = successfulResult(quantities, source);

  assert.deepEqual(result.groups, [
    { sides: 6, results: [1, 6] },
    { sides: 20, results: [20, 1] },
  ]);
  assert.equal(result.numericDiceTotal, 28);
});

test("rejection sampling discards the biased uint32 remainder", () => {
  const quantities = { ...emptyQuantities(), 100: 1 };
  const { source, calls } = createSequenceSource([4_294_967_200, 99]);
  const result = successfulResult(quantities, source);

  assert.deepEqual(result.groups[0].results, [100]);
  assert.equal(calls(), 2);
});

test("invalid requests are rejected without consuming randomness", () => {
  const invalidRequests = [
    null,
    {},
    { quantities: emptyQuantities() },
    { quantities: { ...emptyQuantities(), 6: -1 } },
    {
      quantities: {
        ...emptyQuantities(),
        4: CUSTOM_DICE_POOL_LIMITS.totalDice,
        6: 1,
      },
    },
  ];
  const { source, calls } = createSequenceSource([0]);

  for (const request of invalidRequests) {
    assert.equal(rollCustomDicePool(request, source).ok, false);
  }
  assert.equal(calls(), 0);
});

test("later request changes cannot mutate a generated result", () => {
  const quantities = { ...emptyQuantities(), 8: 2 };
  const { source } = createSequenceSource([0, 7]);
  const result = successfulResult(quantities, source);

  quantities[8] = 0;
  quantities[20] = 10;

  assert.equal(result.quantities[8], 2);
  assert.equal(result.quantities[20], 0);
  assert.deepEqual(result.groups, [{ sides: 8, results: [1, 8] }]);
});

test("coin samples map to exactly two equally sized deterministic outcomes", () => {
  assert.equal(CUSTOM_COIN_OUTCOME_SPLIT, 0x8000_0000);
  const quantities = { ...emptyQuantities(), coin: 4 };
  const { source } = createSequenceSource([
    0,
    CUSTOM_COIN_OUTCOME_SPLIT - 1,
    CUSTOM_COIN_OUTCOME_SPLIT,
    0xffff_ffff,
  ]);
  const result = successfulResult(quantities, source);

  assert.deepEqual(result.coinResults, ["heads", "heads", "tails", "tails"]);
  assert.equal(result.coinResults.length, quantities.coin);
});

test("coin results remain immutable after the configured pool changes", () => {
  const quantities = { ...emptyQuantities(), coin: 2 };
  const { source } = createSequenceSource([0, CUSTOM_COIN_OUTCOME_SPLIT]);
  const result = successfulResult(quantities, source);

  quantities.coin = 0;
  quantities[6] = 3;

  assert.equal(result.quantities.coin, 2);
  assert.equal(result.quantities[6], 0);
  assert.deepEqual(result.coinResults, ["heads", "tails"]);
});

test("a coin-only pool counts items and has no numeric dice value", () => {
  const quantities = { ...emptyQuantities(), coin: 3 };
  const { source } = createSequenceSource([
    0,
    CUSTOM_COIN_OUTCOME_SPLIT,
    1,
  ]);
  const result = successfulResult(quantities, source);

  assert.equal(result.totalItems, 3);
  assert.equal(result.numericDiceTotal, 0);
  assert.deepEqual(result.groups, []);
  assert.deepEqual(result.coinResults, ["heads", "tails", "heads"]);
});

test("a dice-only pool keeps numeric totals and has no coin outcomes", () => {
  const quantities = { ...emptyQuantities(), 4: 1, 12: 1 };
  const { source } = createSequenceSource([3, 11]);
  const result = successfulResult(quantities, source);

  assert.equal(result.totalItems, 2);
  assert.equal(result.numericDiceTotal, 16);
  assert.deepEqual(result.coinResults, []);
});

test("a mixed pool includes coins in item count but excludes them from numeric total", () => {
  const quantities = { ...emptyQuantities(), coin: 2, 6: 2 };
  const { source } = createSequenceSource([
    0,
    CUSTOM_COIN_OUTCOME_SPLIT,
    0,
    5,
  ]);
  const result = successfulResult(quantities, source);

  assert.equal(result.totalItems, 4);
  assert.equal(result.numericDiceTotal, 7);
  assert.deepEqual(result.coinResults, ["heads", "tails"]);
  assert.deepEqual(result.groups, [{ sides: 6, results: [1, 6] }]);
});
