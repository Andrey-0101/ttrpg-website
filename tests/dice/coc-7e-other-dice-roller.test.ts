import assert from "node:assert/strict";
import test from "node:test";

import type { Uint32RandomSource } from "../../lib/dice/secure-random";
import { COC_7E_OTHER_DIE_SIDES } from "../../lib/game-systems/call-of-cthulhu-7e/dice-engine";
import { rollCoc7eOtherDice } from "../../lib/game-systems/call-of-cthulhu-7e/dice-roller";

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

function successfulRoll(request: unknown, values: readonly number[]) {
  const { source, calls } = createSequenceSource(values);
  const evaluation = rollCoc7eOtherDice(request, source);

  assert.equal(
    evaluation.ok,
    true,
    evaluation.ok ? undefined : JSON.stringify(evaluation.errors),
  );

  return { result: evaluation.result, calls };
}

test("invalid Other Dice requests consume no random samples", () => {
  const invalidRequests = [
    { sides: 12, quantity: 1, modifier: 0 },
    { sides: 5, quantity: 1, modifier: 0 },
    { sides: "6", quantity: 1, modifier: 0 },
    { sides: 6, quantity: 0, modifier: 0 },
    { sides: 6, quantity: 11, modifier: 0 },
    { sides: 6, quantity: "1", modifier: 0 },
    { sides: 6, quantity: 1, modifier: -11 },
    { sides: 6, quantity: 1, modifier: 11 },
    { sides: 6, quantity: 1, modifier: "0" },
  ];
  const { source, calls } = createSequenceSource([0]);

  for (const request of invalidRequests) {
    assert.equal(rollCoc7eOtherDice(request, source).ok, false);
  }

  assert.equal(calls(), 0);
});

test("every supported die maps deterministic lower and upper samples", () => {
  for (const sides of COC_7E_OTHER_DIE_SIDES) {
    const { result, calls } = successfulRoll(
      { sides, quantity: 2, modifier: 0 },
      [0, sides - 1],
    );

    assert.deepEqual(result.results, [1, sides]);
    assert.equal(calls(), 2);
  }
});

test("quantity one and ten consume exactly one sample per semantic die", () => {
  const one = successfulRoll(
    { sides: 6, quantity: 1, modifier: 0 },
    [3],
  );
  const tenSamples = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3];
  const ten = successfulRoll(
    { sides: 6, quantity: 10, modifier: 0 },
    tenSamples,
  );

  assert.deepEqual(one.result.results, [4]);
  assert.equal(one.calls(), 1);
  assert.deepEqual(ten.result.results, [1, 2, 3, 4, 5, 6, 1, 2, 3, 4]);
  assert.equal(ten.calls(), 10);
});

test("fixed injected sequences reproduce ordered physical results", () => {
  const request = { sides: 6, quantity: 4, modifier: 0 };
  const sequence = [3, 0, 5, 1];
  const first = successfulRoll(request, sequence).result;
  const second = successfulRoll(request, sequence).result;

  assert.deepEqual(first.results, [4, 1, 6, 2]);
  assert.deepEqual(second.results, first.results);
});

test("D2 generates direct values 1 and 2 without coin semantics", () => {
  const result = successfulRoll(
    { sides: 2, quantity: 2, modifier: 0 },
    [0, 1],
  ).result;

  assert.deepEqual(result.results, [1, 2]);
  assert.equal(result.formula, "2D2");
  assert.equal(result.total, 3);
});

test("D100 generates simple values 1 through 100", () => {
  const result = successfulRoll(
    { sides: 100, quantity: 2, modifier: 0 },
    [0, 99],
  ).result;

  assert.deepEqual(result.results, [1, 100]);
  assert.equal(result.formula, "2D100");
  assert.equal(result.subtotal, 101);
});

test("generator delegates formula, subtotal, and total to the evaluator", () => {
  const d4 = successfulRoll(
    { sides: 4, quantity: 3, modifier: 2 },
    [0, 1, 3],
  ).result;
  const d10 = successfulRoll(
    { sides: 10, quantity: 2, modifier: -3 },
    [6, 3],
  ).result;

  assert.deepEqual(d4.results, [1, 2, 4]);
  assert.equal(d4.formula, "3D4 + 2");
  assert.equal(d4.subtotal, 7);
  assert.equal(d4.total, 9);
  assert.deepEqual(d10.results, [7, 4]);
  assert.equal(d10.formula, "2D10 - 3");
  assert.equal(d10.subtotal, 11);
  assert.equal(d10.total, 8);
});

test("negative totals from the evaluator are not clamped", () => {
  const result = successfulRoll(
    { sides: 2, quantity: 1, modifier: -10 },
    [0],
  ).result;

  assert.deepEqual(result.results, [1]);
  assert.equal(result.subtotal, 1);
  assert.equal(result.total, -9);
});

test("shared rejection sampling completes one die before starting the next", () => {
  const { result, calls } = successfulRoll(
    { sides: 3, quantity: 2, modifier: 0 },
    [0xffff_ffff, 2, 0],
  );

  assert.deepEqual(result.results, [3, 1]);
  assert.equal(calls(), 3);
});

test("request and evaluator-returned results remain defensively isolated", () => {
  const request = { sides: 4, quantity: 3, modifier: 2 };
  const result = successfulRoll(request, [0, 1, 3]).result;

  request.sides = 6;
  request.quantity = 1;
  request.modifier = 0;

  assert.deepEqual(result.request, { sides: 4, quantity: 3, modifier: 2 });
  assert.deepEqual(result.results, [1, 2, 4]);
});

test("injected generation does not depend on Math.random", () => {
  const originalMathRandom = Math.random;
  Math.random = () => {
    throw new Error("Math.random must not be used for Other Dice generation.");
  };

  try {
    const result = successfulRoll(
      { sides: 6, quantity: 1, modifier: 0 },
      [5],
    ).result;
    assert.deepEqual(result.results, [6]);
  } finally {
    Math.random = originalMathRandom;
  }
});
