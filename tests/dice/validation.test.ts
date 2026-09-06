import assert from "node:assert/strict";
import test from "node:test";

import {
  DICE_ROLL_LABEL_MAX_CODE_POINTS,
  isRecord,
  validateAllowedValue,
  validateIntegerInRange,
  validateOptionalDiceRollLabel,
} from "../../lib/dice/validation";

test("integer validation accepts values within inclusive boundaries", () => {
  assert.deepEqual(validateIntegerInRange(3, 1, 5), {
    ok: true,
    value: 3,
  });
  assert.deepEqual(validateIntegerInRange(1, 1, 5), {
    ok: true,
    value: 1,
  });
  assert.deepEqual(validateIntegerInRange(5, 1, 5), {
    ok: true,
    value: 5,
  });
});

test("integer validation distinguishes strict rejection reasons", () => {
  assert.deepEqual(validateIntegerInRange(0, 1, 5), {
    ok: false,
    reason: "out-of-range",
  });
  assert.deepEqual(validateIntegerInRange(6, 1, 5), {
    ok: false,
    reason: "out-of-range",
  });
  assert.deepEqual(validateIntegerInRange(1.5, 1, 5), {
    ok: false,
    reason: "not-integer",
  });
  assert.deepEqual(validateIntegerInRange("1", 1, 5), {
    ok: false,
    reason: "invalid-type",
  });
  assert.deepEqual(validateIntegerInRange(Number.NaN, 1, 5), {
    ok: false,
    reason: "not-finite",
  });
  assert.deepEqual(validateIntegerInRange(Number.POSITIVE_INFINITY, 1, 5), {
    ok: false,
    reason: "not-finite",
  });
  assert.deepEqual(validateIntegerInRange(Number.NEGATIVE_INFINITY, 1, 5), {
    ok: false,
    reason: "not-finite",
  });
});

test("allowed-value validation returns only exact allowed values", () => {
  const allowedValues = ["penalty", "normal", "bonus"] as const;

  assert.deepEqual(validateAllowedValue("normal", allowedValues), {
    ok: true,
    value: "normal",
  });
  assert.deepEqual(validateAllowedValue("other", allowedValues), {
    ok: false,
  });
  assert.deepEqual(validateAllowedValue(0, allowedValues), {
    ok: false,
  });
});

test("record validation preserves the existing non-array object contract", () => {
  assert.equal(isRecord({}), true);
  assert.equal(isRecord(Object.create({ inherited: true })), true);
  assert.equal(isRecord([]), false);
  assert.equal(isRecord(null), false);
  assert.equal(isRecord("record"), false);
});

test("optional dice labels normalize whitespace and omission", () => {
  assert.deepEqual(validateOptionalDiceRollLabel(undefined, false), {
    ok: true,
    value: null,
  });
  assert.deepEqual(validateOptionalDiceRollLabel(" \t\n ", true), {
    ok: true,
    value: null,
  });
  assert.deepEqual(
    validateOptionalDiceRollLabel("  Resolve\t+\nComposure  ", true),
    { ok: true, value: "Resolve + Composure" },
  );
  assert.deepEqual(validateOptionalDiceRollLabel(undefined, true), {
    ok: false,
    reason: "invalid-type",
  });
});

test("optional dice labels enforce the 120 Unicode code-point limit", () => {
  assert.equal(DICE_ROLL_LABEL_MAX_CODE_POINTS, 120);
  const exactLimit = "😀".repeat(DICE_ROLL_LABEL_MAX_CODE_POINTS);
  const aboveLimit = `${exactLimit}😀`;

  assert.deepEqual(validateOptionalDiceRollLabel(exactLimit, true), {
    ok: true,
    value: exactLimit,
  });
  assert.deepEqual(validateOptionalDiceRollLabel(aboveLimit, true), {
    ok: false,
    reason: "too-long",
    actualCodePoints: 121,
  });
});
