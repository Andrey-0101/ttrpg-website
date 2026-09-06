import assert from "node:assert/strict";
import test from "node:test";

import {
  cryptoUint32RandomSource,
  generateUnbiasedInteger,
  type Uint32RandomSource,
} from "../../lib/dice/secure-random";

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

test("injected samples map into a minimum-inclusive maximum-exclusive range", () => {
  const minimum = createSequenceSource([0]);
  const maximum = createSequenceSource([9]);

  assert.equal(generateUnbiasedInteger(1, 11, minimum.source), 1);
  assert.equal(generateUnbiasedInteger(1, 11, maximum.source), 10);
  assert.equal(minimum.calls(), 1);
  assert.equal(maximum.calls(), 1);
});

test("rejection sampling discards the biased boundary and consumes again", () => {
  const { source, calls } = createSequenceSource([0xffff_ffff, 2]);

  assert.equal(generateUnbiasedInteger(0, 3, source), 2);
  assert.equal(calls(), 2);
});

test("accepted samples map exactly for common non-power-of-two dice", () => {
  const cases = [
    { sides: 3, sample: 2 },
    { sides: 6, sample: 5 },
    { sides: 10, sample: 9 },
    { sides: 100, sample: 99 },
  ] as const;

  for (const { sides, sample } of cases) {
    const { source, calls } = createSequenceSource([sample]);

    assert.equal(generateUnbiasedInteger(1, sides + 1, source), sides);
    assert.equal(calls(), 1);
  }
});

test("each non-power-of-two range rejects its exact acceptance boundary", () => {
  const uint32RangeSize = 0x1_0000_0000;

  for (const rangeSize of [3, 6, 10, 100]) {
    const acceptanceLimit =
      uint32RangeSize - (uint32RangeSize % rangeSize);
    const { source, calls } = createSequenceSource([
      acceptanceLimit,
      rangeSize - 1,
    ]);

    assert.equal(generateUnbiasedInteger(1, rangeSize + 1, source), rangeSize);
    assert.equal(calls(), 2);
  }
});

test("invalid bounds are rejected without consuming randomness", () => {
  const invalidBounds: ReadonlyArray<readonly [number, number]> = [
    [1, 1],
    [2, 1],
    [0.5, 2],
    [0, 2.5],
    [Number.NaN, 2],
    [0, Number.POSITIVE_INFINITY],
    [0, 0x1_0000_0001],
  ];
  const { source, calls } = createSequenceSource([0]);

  for (const [minimumInclusive, maximumExclusive] of invalidBounds) {
    assert.throws(
      () =>
        generateUnbiasedInteger(
          minimumInclusive,
          maximumExclusive,
          source,
        ),
      RangeError,
    );
  }

  assert.equal(calls(), 0);
});

test("secure default and injected generation do not depend on Math.random", () => {
  const originalMathRandom = Math.random;
  Math.random = () => {
    throw new Error("Math.random must not be used for secure dice generation.");
  };

  try {
    const target = new Uint32Array(1);
    cryptoUint32RandomSource(target);
    const { source } = createSequenceSource([0]);
    assert.equal(generateUnbiasedInteger(1, 7, source), 1);
  } finally {
    Math.random = originalMathRandom;
  }
});
