import assert from "node:assert/strict";
import test from "node:test";

import {
  COC_7E_OTHER_DIE_SIDES,
  evaluateCoc7eOtherDice,
  type Coc7eOtherDieSides,
} from "../../lib/game-systems/call-of-cthulhu-7e/dice-engine";

function successfulResult(
  request: {
    sides: Coc7eOtherDieSides;
    quantity: number;
    modifier: number;
  },
  results: readonly number[],
) {
  const evaluation = evaluateCoc7eOtherDice({ request, results });

  assert.equal(
    evaluation.ok,
    true,
    evaluation.ok ? undefined : JSON.stringify(evaluation.errors),
  );

  return evaluation.result;
}

function errorsFor(input: unknown) {
  const evaluation = evaluateCoc7eOtherDice(input);
  assert.equal(evaluation.ok, false);

  if (evaluation.ok) {
    assert.fail("Expected Other Dice validation errors.");
  }

  return evaluation.errors;
}

test("exactly D2, D3, D4, D6, D8, D10, D20, and D100 are supported", () => {
  assert.deepEqual(COC_7E_OTHER_DIE_SIDES, [2, 3, 4, 6, 8, 10, 20, 100]);

  for (const sides of COC_7E_OTHER_DIE_SIDES) {
    const result = successfulResult(
      { sides, quantity: 2, modifier: 0 },
      [1, sides],
    );
    assert.equal(result.request.sides, sides);
    assert.deepEqual(result.results, [1, sides]);
  }
});

test("unsupported sides and strict invalid number forms are rejected", () => {
  const cases = [
    { value: 1, code: "unsupported-sides" },
    { value: 5, code: "unsupported-sides" },
    { value: 7, code: "unsupported-sides" },
    { value: 12, code: "unsupported-sides" },
    { value: 30, code: "unsupported-sides" },
    { value: 4.5, code: "not-integer" },
    { value: "4", code: "invalid-type" },
    { value: Number.NaN, code: "not-finite" },
    { value: Number.POSITIVE_INFINITY, code: "not-finite" },
  ];

  for (const { value, code } of cases) {
    assert.deepEqual(
      errorsFor({
        request: { sides: value, quantity: 1, modifier: 0 },
        results: [1],
      }).map(({ code: errorCode, path }) => ({ code: errorCode, path })),
      [{ code, path: "request.sides" }],
    );
  }
});

test("quantity accepts 1 and 10 and rejects strict invalid forms", () => {
  assert.equal(
    successfulResult({ sides: 6, quantity: 1, modifier: 0 }, [1]).request
      .quantity,
    1,
  );
  assert.equal(
    successfulResult(
      { sides: 6, quantity: 10, modifier: 0 },
      new Array(10).fill(1),
    ).request.quantity,
    10,
  );

  const cases = [
    { value: 0, code: "out-of-range" },
    { value: 11, code: "out-of-range" },
    { value: 1.5, code: "not-integer" },
    { value: "2", code: "invalid-type" },
    { value: Number.NaN, code: "not-finite" },
    { value: Number.POSITIVE_INFINITY, code: "not-finite" },
  ];

  for (const { value, code } of cases) {
    assert.deepEqual(
      errorsFor({
        request: { sides: 6, quantity: value, modifier: 0 },
        results: [1],
      }).map(({ code: errorCode, path }) => ({ code: errorCode, path })),
      [{ code, path: "request.quantity" }],
    );
  }
});

test("modifier accepts -10, 0, and 10 and rejects strict invalid forms", () => {
  for (const modifier of [-10, 0, 10]) {
    assert.equal(
      successfulResult({ sides: 6, quantity: 1, modifier }, [1]).request
        .modifier,
      modifier,
    );
  }

  const cases = [
    { value: -11, code: "out-of-range" },
    { value: 11, code: "out-of-range" },
    { value: 0.5, code: "not-integer" },
    { value: "0", code: "invalid-type" },
    { value: Number.NaN, code: "not-finite" },
    { value: Number.POSITIVE_INFINITY, code: "not-finite" },
  ];

  for (const { value, code } of cases) {
    assert.deepEqual(
      errorsFor({
        request: { sides: 6, quantity: 1, modifier: value },
        results: [1],
      }).map(({ code: errorCode, path }) => ({ code: errorCode, path })),
      [{ code, path: "request.modifier" }],
    );
  }
});

test("results require an array whose exact length equals quantity", () => {
  assert.deepEqual(
    errorsFor({
      request: { sides: 10, quantity: 2, modifier: 0 },
      results: [7],
    }),
    [
      {
        code: "wrong-array-length",
        path: "results",
        details: { expected: 2, actual: 1 },
      },
    ],
  );
  assert.deepEqual(
    errorsFor({
      request: { sides: 10, quantity: 2, modifier: 0 },
      results: [7, 4, 3],
    }),
    [
      {
        code: "wrong-array-length",
        path: "results",
        details: { expected: 2, actual: 3 },
      },
    ],
  );
  assert.deepEqual(
    errorsFor({
      request: { sides: 10, quantity: 2, modifier: 0 },
      results: "7,4",
    }),
    [{ code: "invalid-type", path: "results" }],
  );
});

test("result values reject fractions, strings, and non-finite numbers", () => {
  const cases = [
    { value: 1.5, code: "not-integer" },
    { value: "1", code: "invalid-type" },
    { value: Number.NaN, code: "not-finite" },
    { value: Number.POSITIVE_INFINITY, code: "not-finite" },
    { value: Number.NEGATIVE_INFINITY, code: "not-finite" },
  ];

  for (const { value, code } of cases) {
    assert.deepEqual(
      errorsFor({
        request: { sides: 6, quantity: 1, modifier: 0 },
        results: [value],
      }).map(({ code: errorCode, path }) => ({ code: errorCode, path })),
      [{ code, path: "results[0]" }],
    );
  }
});

test("every supported die enforces inclusive physical boundaries", () => {
  for (const sides of COC_7E_OTHER_DIE_SIDES) {
    assert.deepEqual(
      successfulResult(
        { sides, quantity: 2, modifier: 0 },
        [1, sides],
      ).results,
      [1, sides],
    );

    for (const value of [0, sides + 1]) {
      assert.deepEqual(
        errorsFor({
          request: { sides, quantity: 1, modifier: 0 },
          results: [value],
        }),
        [
          {
            code: "invalid-die-value",
            path: "results[0]",
            details: { minimum: 1, maximum: sides },
          },
        ],
      );
    }
  }
});

test("canonical formulas and arithmetic preserve modifier signs", () => {
  const cases = [
    {
      request: { sides: 4, quantity: 3, modifier: 2 } as const,
      results: [1, 2, 4],
      formula: "3D4 + 2",
      subtotal: 7,
      total: 9,
    },
    {
      request: { sides: 10, quantity: 2, modifier: -3 } as const,
      results: [7, 4],
      formula: "2D10 - 3",
      subtotal: 11,
      total: 8,
    },
    {
      request: { sides: 6, quantity: 4, modifier: 0 } as const,
      results: [1, 2, 3, 4],
      formula: "4D6",
      subtotal: 10,
      total: 10,
    },
    {
      request: { sides: 100, quantity: 1, modifier: 10 } as const,
      results: [73],
      formula: "1D100 + 10",
      subtotal: 73,
      total: 83,
    },
    {
      request: { sides: 2, quantity: 1, modifier: -10 } as const,
      results: [1],
      formula: "1D2 - 10",
      subtotal: 1,
      total: -9,
    },
  ];

  for (const { request, results, formula, subtotal, total } of cases) {
    const result = successfulResult(request, results);
    assert.equal(result.formula, formula);
    assert.equal(result.subtotal, subtotal);
    assert.equal(result.total, total);
  }
});

test("D100 is a simple 1-100 die without percentile composition", () => {
  const result = successfulResult(
    { sides: 100, quantity: 2, modifier: 3 },
    [73, 18],
  );

  assert.equal(result.formula, "2D100 + 3");
  assert.deepEqual(result.results, [73, 18]);
  assert.equal(result.subtotal, 91);
  assert.equal(result.total, 94);
});

test("D2 uses direct mathematical results rather than coin outcomes", () => {
  const result = successfulResult(
    { sides: 2, quantity: 2, modifier: 0 },
    [1, 2],
  );

  assert.deepEqual(result.results, [1, 2]);
  assert.equal(result.subtotal, 3);
  assert.equal(result.total, 3);
});

test("malformed inputs and unexpected fields fail in stable order", () => {
  assert.deepEqual(errorsFor(null), [
    { code: "invalid-type", path: "$" },
  ]);
  assert.deepEqual(
    errorsFor({
      request: {
        sides: 4,
        quantity: 1,
        modifier: 0,
        expression: "1D4",
      },
      results: [2],
      label: "No label",
    }).map(({ code, path }) => ({ code, path })),
    [
      { code: "unexpected-field", path: "request.expression" },
      { code: "unexpected-field", path: "$.label" },
    ],
  );
});

test("input and returned result arrays are defensively isolated", () => {
  const inputResults = [1, 2, 4];
  const result = successfulResult(
    { sides: 4, quantity: 3, modifier: 2 },
    inputResults,
  );

  assert.notEqual(result.results, inputResults);
  assert.deepEqual(inputResults, [1, 2, 4]);

  (result.results as number[])[0] = 4;

  assert.deepEqual(inputResults, [1, 2, 4]);
  assert.deepEqual(
    successfulResult(
      { sides: 4, quantity: 3, modifier: 2 },
      inputResults,
    ).results,
    [1, 2, 4],
  );
});
