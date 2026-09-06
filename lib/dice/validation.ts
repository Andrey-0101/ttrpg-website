export const DICE_ROLL_LABEL_MAX_CODE_POINTS = 120 as const;

export type IntegerRangeValidation =
  | { ok: true; value: number }
  | {
      ok: false;
      reason:
        | "invalid-type"
        | "not-finite"
        | "not-integer"
        | "out-of-range";
    };

export type AllowedValueValidation<Value> =
  | { ok: true; value: Value }
  | { ok: false };

export type OptionalDiceRollLabelValidation =
  | { ok: true; value: string | null }
  | {
      ok: false;
      reason: "invalid-type";
    }
  | {
      ok: false;
      reason: "too-long";
      actualCodePoints: number;
    };

export function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function validateIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): IntegerRangeValidation {
  if (typeof value !== "number") {
    return { ok: false, reason: "invalid-type" };
  }

  if (!Number.isFinite(value)) {
    return { ok: false, reason: "not-finite" };
  }

  if (!Number.isInteger(value)) {
    return { ok: false, reason: "not-integer" };
  }

  if (value < minimum || value > maximum) {
    return { ok: false, reason: "out-of-range" };
  }

  return { ok: true, value };
}

export function validateAllowedValue<Value>(
  value: unknown,
  allowedValues: readonly Value[],
): AllowedValueValidation<Value> {
  if (!allowedValues.includes(value as Value)) {
    return { ok: false };
  }

  return { ok: true, value: value as Value };
}

export function validateOptionalDiceRollLabel(
  value: unknown,
  isPresent: boolean,
): OptionalDiceRollLabelValidation {
  if (!isPresent) {
    return { ok: true, value: null };
  }

  if (typeof value !== "string") {
    return { ok: false, reason: "invalid-type" };
  }

  const normalized = value.trim().replace(/\s+/gu, " ");

  if (!normalized) {
    return { ok: true, value: null };
  }

  const actualCodePoints = [...normalized].length;

  if (actualCodePoints > DICE_ROLL_LABEL_MAX_CODE_POINTS) {
    return {
      ok: false,
      reason: "too-long",
      actualCodePoints,
    };
  }

  return { ok: true, value: normalized };
}
