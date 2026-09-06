import {
  isRecord,
  validateAllowedValue,
  validateIntegerInRange,
} from "../../dice/validation";

export const COC_7E_DICE_GAME_SYSTEM = "call-of-cthulhu-7e" as const;

export const COC_7E_BONUS_PENALTY_VALUES = [
  -3,
  -2,
  -1,
  0,
  1,
  2,
  3,
] as const;

export const COC_7E_TENS_VALUES = [
  0,
  10,
  20,
  30,
  40,
  50,
  60,
  70,
  80,
  90,
] as const;

export const COC_7E_OTHER_DIE_SIDES = [
  2,
  3,
  4,
  6,
  8,
  10,
  20,
  100,
] as const;

export type Coc7eBonusPenalty =
  (typeof COC_7E_BONUS_PENALTY_VALUES)[number];
export type Coc7eTensValue = (typeof COC_7E_TENS_VALUES)[number];
export type Coc7eOtherDieSides =
  (typeof COC_7E_OTHER_DIE_SIDES)[number];

export type Coc7ePercentileTestRequest = {
  target?: number | null;
  bonusPenalty: Coc7eBonusPenalty;
};

export type Coc7ePercentileTestInput = {
  request: Coc7ePercentileTestRequest;
  units: number;
  tensDice: readonly Coc7eTensValue[];
};

export type NormalizedCoc7ePercentileTestRequest = {
  target: number | null;
  bonusPenalty: Coc7eBonusPenalty;
};

export type Coc7ePercentileOutcome =
  | "critical"
  | "extreme"
  | "hard"
  | "regular"
  | "failure"
  | "fumble";

export type Coc7ePercentileTestResult = {
  gameSystem: typeof COC_7E_DICE_GAME_SYSTEM;
  request: NormalizedCoc7ePercentileTestRequest;
  units: number;
  tensDice: readonly Coc7eTensValue[];
  candidates: readonly number[];
  selectedTensIndex: number;
  percentileResult: number;
  hardThreshold: number | null;
  extremeThreshold: number | null;
  outcome: Coc7ePercentileOutcome | null;
};

export type Coc7ePercentileValidationErrorCode =
  | "required"
  | "unexpected-field"
  | "invalid-type"
  | "not-finite"
  | "not-integer"
  | "out-of-range"
  | "wrong-array-length"
  | "invalid-tens-value";

export type Coc7ePercentileValidationError = {
  code: Coc7ePercentileValidationErrorCode;
  path: string;
  details?: Readonly<Record<string, string | number>>;
};

export type Coc7ePercentileTestEvaluation =
  | { ok: true; result: Coc7ePercentileTestResult }
  | { ok: false; errors: readonly Coc7ePercentileValidationError[] };

export type Coc7ePercentileRequestValidation =
  | { ok: true; request: NormalizedCoc7ePercentileTestRequest }
  | { ok: false; errors: readonly Coc7ePercentileValidationError[] };

export type Coc7eOtherDiceRequest = {
  sides: Coc7eOtherDieSides;
  quantity: number;
  modifier: number;
};

export type Coc7eOtherDiceInput = {
  request: Coc7eOtherDiceRequest;
  results: readonly number[];
};

export type Coc7eOtherDiceResult = {
  gameSystem: typeof COC_7E_DICE_GAME_SYSTEM;
  request: Coc7eOtherDiceRequest;
  results: readonly number[];
  formula: string;
  subtotal: number;
  total: number;
};

export type Coc7eOtherDiceValidationErrorCode =
  | "required"
  | "unexpected-field"
  | "invalid-type"
  | "not-finite"
  | "not-integer"
  | "out-of-range"
  | "unsupported-sides"
  | "wrong-array-length"
  | "invalid-die-value";

export type Coc7eOtherDiceValidationError = {
  code: Coc7eOtherDiceValidationErrorCode;
  path: string;
  details?: Readonly<Record<string, string | number>>;
};

export type Coc7eOtherDiceEvaluation =
  | { ok: true; result: Coc7eOtherDiceResult }
  | { ok: false; errors: readonly Coc7eOtherDiceValidationError[] };

export type Coc7eOtherDiceRequestValidation =
  | { ok: true; request: Coc7eOtherDiceRequest }
  | { ok: false; errors: readonly Coc7eOtherDiceValidationError[] };

type ValidatedNumber = {
  isValid: boolean;
  value: number | null;
};

const INPUT_FIELDS = new Set(["request", "units", "tensDice"]);
const REQUEST_FIELDS = new Set(["target", "bonusPenalty"]);
const OTHER_DICE_INPUT_FIELDS = new Set(["request", "results"]);
const OTHER_DICE_REQUEST_FIELDS = new Set([
  "sides",
  "quantity",
  "modifier",
]);

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function getUnexpectedFieldErrors(
  value: Record<string, unknown>,
  allowedFields: ReadonlySet<string>,
  path: string,
): Array<{ code: "unexpected-field"; path: string }> {
  return Object.keys(value)
    .filter((field) => !allowedFields.has(field))
    .sort()
    .map((field) => ({
      code: "unexpected-field",
      path: `${path}.${field}`,
    }));
}

function validateBoundedInteger(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
  errors: Coc7ePercentileValidationError[],
): ValidatedNumber {
  const validation = validateIntegerInRange(value, minimum, maximum);

  if (!validation.ok) {
    errors.push(
      validation.reason === "out-of-range"
        ? {
            code: validation.reason,
            path,
            details: { minimum, maximum },
          }
        : { code: validation.reason, path },
    );
    return { isValid: false, value: null };
  }

  return { isValid: true, value: validation.value };
}

export function validateCoc7ePercentileRequest(
  value: unknown,
): Coc7ePercentileRequestValidation {
  if (!isRecord(value)) {
    return {
      ok: false,
      errors: [{ code: "invalid-type", path: "request" }],
    };
  }

  const errors: Coc7ePercentileValidationError[] = [];
  let target: ValidatedNumber = { isValid: true, value: null };
  let bonusPenalty: ValidatedNumber = { isValid: false, value: null };

  if (hasOwn(value, "target") && value.target !== null) {
    target = validateBoundedInteger(
      value.target,
      "request.target",
      1,
      100,
      errors,
    );
  }

  if (!hasOwn(value, "bonusPenalty")) {
    errors.push({ code: "required", path: "request.bonusPenalty" });
  } else {
    bonusPenalty = validateBoundedInteger(
      value.bonusPenalty,
      "request.bonusPenalty",
      -3,
      3,
      errors,
    );
  }

  errors.push(
    ...getUnexpectedFieldErrors(value, REQUEST_FIELDS, "request"),
  );

  if (errors.length > 0 || !target.isValid || !bonusPenalty.isValid) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    request: {
      target: target.value,
      bonusPenalty: bonusPenalty.value! as Coc7eBonusPenalty,
    },
  };
}

function validateTensDice(
  value: unknown,
  isPresent: boolean,
  expectedLength: number | null,
  errors: Coc7ePercentileValidationError[],
): Coc7eTensValue[] | null {
  if (!isPresent) {
    errors.push({ code: "required", path: "tensDice" });
    return null;
  }

  if (!Array.isArray(value)) {
    errors.push({ code: "invalid-type", path: "tensDice" });
    return null;
  }

  if (expectedLength !== null && value.length !== expectedLength) {
    errors.push({
      code: "wrong-array-length",
      path: "tensDice",
      details: { expected: expectedLength, actual: value.length },
    });
  }

  const tensDice: Coc7eTensValue[] = [];
  let allTensValid = true;

  for (const [index, tens] of value.entries()) {
    const path = `tensDice[${index}]`;
    const integerValidation = validateIntegerInRange(tens, 0, 90);

    if (!integerValidation.ok) {
      errors.push({
        code:
          integerValidation.reason === "out-of-range"
            ? "invalid-tens-value"
            : integerValidation.reason,
        path,
      });
      allTensValid = false;
      continue;
    }

    const allowedValidation = validateAllowedValue(
      integerValidation.value,
      COC_7E_TENS_VALUES,
    );

    if (!allowedValidation.ok) {
      errors.push({ code: "invalid-tens-value", path });
      allTensValid = false;
      continue;
    }

    tensDice.push(allowedValidation.value);
  }

  return allTensValid ? tensDice : null;
}

function composePercentile(tens: Coc7eTensValue, units: number): number {
  return tens === 0 && units === 0 ? 100 : tens + units;
}

function determineOutcome(
  percentileResult: number,
  target: number,
  hardThreshold: number,
  extremeThreshold: number,
): Coc7ePercentileOutcome {
  if (percentileResult === 1) {
    return "critical";
  }

  const isFumble =
    target < 50
      ? percentileResult >= 96
      : percentileResult === 100;

  if (isFumble) {
    return "fumble";
  }

  if (percentileResult <= extremeThreshold) {
    return "extreme";
  }

  if (percentileResult <= hardThreshold) {
    return "hard";
  }

  if (percentileResult <= target) {
    return "regular";
  }

  return "failure";
}

export function evaluateCoc7ePercentileTest(
  input: unknown,
): Coc7ePercentileTestEvaluation {
  const errors: Coc7ePercentileValidationError[] = [];

  if (!isRecord(input)) {
    return {
      ok: false,
      errors: [{ code: "invalid-type", path: "$" }],
    };
  }

  let normalizedRequest: NormalizedCoc7ePercentileTestRequest | null = null;
  const requestValue = input.request;

  if (!hasOwn(input, "request")) {
    errors.push({ code: "required", path: "request" });
  } else {
    const requestValidation = validateCoc7ePercentileRequest(requestValue);

    if (requestValidation.ok) {
      normalizedRequest = requestValidation.request;
    } else {
      errors.push(...requestValidation.errors);
    }
  }

  let units: ValidatedNumber = { isValid: false, value: null };

  if (!hasOwn(input, "units")) {
    errors.push({ code: "required", path: "units" });
  } else {
    units = validateBoundedInteger(input.units, "units", 0, 9, errors);
  }

  const expectedTensLength = normalizedRequest
    ? Math.abs(normalizedRequest.bonusPenalty) + 1
    : null;
  const tensDice = validateTensDice(
    input.tensDice,
    hasOwn(input, "tensDice"),
    expectedTensLength,
    errors,
  );

  errors.push(...getUnexpectedFieldErrors(input, INPUT_FIELDS, "$"));

  if (
    errors.length > 0 ||
    normalizedRequest === null ||
    !units.isValid ||
    tensDice === null
  ) {
    return { ok: false, errors };
  }

  const candidates = tensDice.map((tens) =>
    composePercentile(tens, units.value!),
  );
  const percentileResult =
    normalizedRequest.bonusPenalty > 0
      ? Math.min(...candidates)
      : normalizedRequest.bonusPenalty < 0
        ? Math.max(...candidates)
        : candidates[0];
  const selectedTensIndex = candidates.indexOf(percentileResult);
  const hardThreshold =
    normalizedRequest.target === null
      ? null
      : Math.floor(normalizedRequest.target / 2);
  const extremeThreshold =
    normalizedRequest.target === null
      ? null
      : Math.floor(normalizedRequest.target / 5);
  const outcome =
    normalizedRequest.target === null
      ? null
      : determineOutcome(
          percentileResult,
          normalizedRequest.target,
          hardThreshold!,
          extremeThreshold!,
        );

  return {
    ok: true,
    result: {
      gameSystem: COC_7E_DICE_GAME_SYSTEM,
      request: { ...normalizedRequest },
      units: units.value!,
      tensDice: [...tensDice],
      candidates: [...candidates],
      selectedTensIndex,
      percentileResult,
      hardThreshold,
      extremeThreshold,
      outcome,
    },
  };
}

function validateOtherDiceSides(
  value: unknown,
  errors: Coc7eOtherDiceValidationError[],
): Coc7eOtherDieSides | null {
  const integerValidation = validateIntegerInRange(
    value,
    Number.MIN_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER,
  );

  if (!integerValidation.ok) {
    errors.push({
      code:
        integerValidation.reason === "out-of-range"
          ? "unsupported-sides"
          : integerValidation.reason,
      path: "request.sides",
    });
    return null;
  }

  const allowedValidation = validateAllowedValue(
    integerValidation.value,
    COC_7E_OTHER_DIE_SIDES,
  );

  if (!allowedValidation.ok) {
    errors.push({ code: "unsupported-sides", path: "request.sides" });
    return null;
  }

  return allowedValidation.value;
}

function validateOtherDiceBoundedInteger(
  value: unknown,
  path: "request.quantity" | "request.modifier",
  minimum: number,
  maximum: number,
  errors: Coc7eOtherDiceValidationError[],
): ValidatedNumber {
  const validation = validateIntegerInRange(value, minimum, maximum);

  if (!validation.ok) {
    errors.push(
      validation.reason === "out-of-range"
        ? {
            code: validation.reason,
            path,
            details: { minimum, maximum },
          }
        : { code: validation.reason, path },
    );
    return { isValid: false, value: null };
  }

  return { isValid: true, value: validation.value };
}

export function validateCoc7eOtherDiceRequest(
  value: unknown,
): Coc7eOtherDiceRequestValidation {
  if (!isRecord(value)) {
    return {
      ok: false,
      errors: [{ code: "invalid-type", path: "request" }],
    };
  }

  const errors: Coc7eOtherDiceValidationError[] = [];
  let sides: Coc7eOtherDieSides | null = null;
  let quantity: ValidatedNumber = { isValid: false, value: null };
  let modifier: ValidatedNumber = { isValid: false, value: null };

  if (!hasOwn(value, "sides")) {
    errors.push({ code: "required", path: "request.sides" });
  } else {
    sides = validateOtherDiceSides(value.sides, errors);
  }

  if (!hasOwn(value, "quantity")) {
    errors.push({ code: "required", path: "request.quantity" });
  } else {
    quantity = validateOtherDiceBoundedInteger(
      value.quantity,
      "request.quantity",
      1,
      10,
      errors,
    );
  }

  if (!hasOwn(value, "modifier")) {
    errors.push({ code: "required", path: "request.modifier" });
  } else {
    modifier = validateOtherDiceBoundedInteger(
      value.modifier,
      "request.modifier",
      -10,
      10,
      errors,
    );
  }

  errors.push(
    ...getUnexpectedFieldErrors(
      value,
      OTHER_DICE_REQUEST_FIELDS,
      "request",
    ),
  );

  if (
    errors.length > 0 ||
    sides === null ||
    !quantity.isValid ||
    !modifier.isValid
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    request: {
      sides,
      quantity: quantity.value!,
      modifier: modifier.value!,
    },
  };
}

function validateOtherDiceResults(
  value: unknown,
  isPresent: boolean,
  expectedLength: number | null,
  sides: Coc7eOtherDieSides | null,
  errors: Coc7eOtherDiceValidationError[],
): number[] | null {
  if (!isPresent) {
    errors.push({ code: "required", path: "results" });
    return null;
  }

  if (!Array.isArray(value)) {
    errors.push({ code: "invalid-type", path: "results" });
    return null;
  }

  if (expectedLength !== null && value.length !== expectedLength) {
    errors.push({
      code: "wrong-array-length",
      path: "results",
      details: { expected: expectedLength, actual: value.length },
    });
  }

  const results: number[] = [];
  let allResultsValid = true;

  for (const [index, die] of value.entries()) {
    const path = `results[${index}]`;
    const validation = validateIntegerInRange(
      die,
      1,
      sides ?? Number.MAX_SAFE_INTEGER,
    );

    if (!validation.ok) {
      errors.push(
        validation.reason === "out-of-range"
          ? {
              code: "invalid-die-value",
              path,
              ...(sides === null
                ? {}
                : { details: { minimum: 1, maximum: sides } }),
            }
          : { code: validation.reason, path },
      );
      allResultsValid = false;
      continue;
    }

    results.push(validation.value);
  }

  return allResultsValid ? results : null;
}

function getOtherDiceFormula(
  quantity: number,
  sides: Coc7eOtherDieSides,
  modifier: number,
): string {
  const dice = `${quantity}D${sides}`;

  if (modifier > 0) {
    return `${dice} + ${modifier}`;
  }

  if (modifier < 0) {
    return `${dice} - ${Math.abs(modifier)}`;
  }

  return dice;
}

export function evaluateCoc7eOtherDice(
  input: unknown,
): Coc7eOtherDiceEvaluation {
  const errors: Coc7eOtherDiceValidationError[] = [];

  if (!isRecord(input)) {
    return {
      ok: false,
      errors: [{ code: "invalid-type", path: "$" }],
    };
  }

  const requestValue = input.request;
  let normalizedRequest: Coc7eOtherDiceRequest | null = null;

  if (!hasOwn(input, "request")) {
    errors.push({ code: "required", path: "request" });
  } else {
    const requestValidation = validateCoc7eOtherDiceRequest(requestValue);

    if (requestValidation.ok) {
      normalizedRequest = requestValidation.request;
    } else {
      errors.push(...requestValidation.errors);
    }
  }

  const results = validateOtherDiceResults(
    input.results,
    hasOwn(input, "results"),
    normalizedRequest?.quantity ?? null,
    normalizedRequest?.sides ?? null,
    errors,
  );

  errors.push(
    ...getUnexpectedFieldErrors(input, OTHER_DICE_INPUT_FIELDS, "$"),
  );

  if (
    errors.length > 0 ||
    normalizedRequest === null ||
    results === null
  ) {
    return { ok: false, errors };
  }

  const subtotal = results.reduce((total, die) => total + die, 0);

  return {
    ok: true,
    result: {
      gameSystem: COC_7E_DICE_GAME_SYSTEM,
      request: { ...normalizedRequest },
      results: [...results],
      formula: getOtherDiceFormula(
        normalizedRequest.quantity,
        normalizedRequest.sides,
        normalizedRequest.modifier,
      ),
      subtotal,
      total: subtotal + normalizedRequest.modifier,
    },
  };
}
