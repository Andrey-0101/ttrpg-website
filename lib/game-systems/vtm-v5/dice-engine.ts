export const VTM_V5_DICE_GAME_SYSTEM = "vtm-v5" as const;

export const VTM_V5_DICE_LIMITS = {
  pool: { minimum: 1, maximum: 50 },
  hungerDice: { minimum: 0, maximum: 5 },
  difficulty: { minimum: 1, maximum: 20 },
  labelCodePoints: 120,
  die: { minimum: 1, maximum: 10 },
} as const;

export type VtmV5DiceRequest = {
  pool: number;
  hungerDice: number;
  difficulty?: number;
  label?: string;
};

export type VtmV5DiceEvaluationInput = {
  request: VtmV5DiceRequest;
  normalDice: readonly number[];
  hungerDiceResults: readonly number[];
};

export type NormalizedVtmV5DiceRequest = {
  pool: number;
  hungerDice: number;
  difficulty: number | null;
  label: string | null;
};

export type VtmV5DifficultyResult =
  | "not-set"
  | "success"
  | "failure";

export type VtmV5DiceSummaryKey =
  | "success"
  | "failure"
  | "total-failure"
  | "bestial-failure"
  | "ordinary-critical"
  | "messy-critical"
  | "successes-counted"
  | "critical-pair-unresolved"
  | "no-successes-unresolved";

export type VtmV5DiceDetailFlags = {
  hasNonTenSuccess: boolean;
  hasHungerOne: boolean;
  hasHungerTen: boolean;
  hasUnpairedTen: boolean;
  hasZeroSuccesses: boolean;
  criticalPairBelowDifficulty: boolean;
  difficultyOmitted: boolean;
};

export type VtmV5DiceResult = {
  gameSystem: typeof VTM_V5_DICE_GAME_SYSTEM;
  request: NormalizedVtmV5DiceRequest;
  normalDice: readonly number[];
  hungerDiceResults: readonly number[];
  nonTenSuccessCount: number;
  tenCount: number;
  criticalPairCount: number;
  totalSuccesses: number;
  hasCriticalPair: boolean;
  isSuccess: boolean | null;
  isOrdinaryCritical: boolean;
  isMessyCritical: boolean;
  isTotalFailure: boolean;
  isBestialFailure: boolean;
  difficultyResult: VtmV5DifficultyResult;
  margin: number | null;
  summaryKey: VtmV5DiceSummaryKey;
  detailFlags: VtmV5DiceDetailFlags;
};

export type VtmV5DiceValidationErrorCode =
  | "required"
  | "unexpected-field"
  | "invalid-type"
  | "not-finite"
  | "not-integer"
  | "out-of-range"
  | "hunger-exceeds-pool"
  | "label-too-long"
  | "wrong-array-length"
  | "invalid-die-value";

export type VtmV5DiceValidationError = {
  code: VtmV5DiceValidationErrorCode;
  path: string;
  details?: Readonly<Record<string, string | number>>;
};

export type VtmV5DiceEvaluation =
  | {
      ok: true;
      result: VtmV5DiceResult;
    }
  | {
      ok: false;
      errors: readonly VtmV5DiceValidationError[];
    };

type UnknownRecord = Record<string, unknown>;

type ValidatedNumber = {
  isValid: boolean;
  value: number | null;
};

const INPUT_FIELDS = new Set([
  "request",
  "normalDice",
  "hungerDiceResults",
]);

const REQUEST_FIELDS = new Set([
  "pool",
  "hungerDice",
  "difficulty",
  "label",
]);

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasOwn(
  value: UnknownRecord,
  key: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function addUnexpectedFieldErrors(
  value: UnknownRecord,
  allowedFields: ReadonlySet<string>,
  path: string,
  errors: VtmV5DiceValidationError[],
): void {
  const unexpectedFields = Object.keys(value)
    .filter((field) => !allowedFields.has(field))
    .sort();

  for (const field of unexpectedFields) {
    errors.push({
      code: "unexpected-field",
      path: `${path}.${field}`,
    });
  }
}

function validateBoundedInteger(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
  errors: VtmV5DiceValidationError[],
): ValidatedNumber {
  if (typeof value !== "number") {
    errors.push({ code: "invalid-type", path });
    return { isValid: false, value: null };
  }

  if (!Number.isFinite(value)) {
    errors.push({ code: "not-finite", path });
    return { isValid: false, value: null };
  }

  if (!Number.isInteger(value)) {
    errors.push({ code: "not-integer", path });
    return { isValid: false, value: null };
  }

  if (value < minimum || value > maximum) {
    errors.push({
      code: "out-of-range",
      path,
      details: { minimum, maximum },
    });
    return { isValid: false, value: null };
  }

  return { isValid: true, value };
}

function normalizeLabel(
  value: unknown,
  errors: VtmV5DiceValidationError[],
): string | null {
  if (typeof value !== "string") {
    errors.push({
      code: "invalid-type",
      path: "request.label",
    });
    return null;
  }

  const normalized = value.trim().replace(/\s+/gu, " ");

  if (!normalized) {
    return null;
  }

  const codePointCount = [...normalized].length;

  if (codePointCount > VTM_V5_DICE_LIMITS.labelCodePoints) {
    errors.push({
      code: "label-too-long",
      path: "request.label",
      details: {
        maximum: VTM_V5_DICE_LIMITS.labelCodePoints,
        actual: codePointCount,
      },
    });
    return null;
  }

  return normalized;
}

function validateDiceArray(
  value: unknown,
  path: "normalDice" | "hungerDiceResults",
  isPresent: boolean,
  expectedLength: number | null,
  errors: VtmV5DiceValidationError[],
): number[] | null {
  if (!isPresent) {
    errors.push({ code: "required", path });
    return null;
  }

  if (!Array.isArray(value)) {
    errors.push({ code: "invalid-type", path });
    return null;
  }

  if (
    expectedLength !== null &&
    value.length !== expectedLength
  ) {
    errors.push({
      code: "wrong-array-length",
      path,
      details: {
        expected: expectedLength,
        actual: value.length,
      },
    });
  }

  let allDiceValid = true;

  for (const [index, die] of value.entries()) {
    const diePath = `${path}[${index}]`;

    if (typeof die !== "number") {
      errors.push({
        code: "invalid-type",
        path: diePath,
      });
      allDiceValid = false;
      continue;
    }

    if (!Number.isFinite(die)) {
      errors.push({
        code: "not-finite",
        path: diePath,
      });
      allDiceValid = false;
      continue;
    }

    if (!Number.isInteger(die)) {
      errors.push({
        code: "not-integer",
        path: diePath,
      });
      allDiceValid = false;
      continue;
    }

    if (
      die < VTM_V5_DICE_LIMITS.die.minimum ||
      die > VTM_V5_DICE_LIMITS.die.maximum
    ) {
      errors.push({
        code: "invalid-die-value",
        path: diePath,
        details: {
          minimum: VTM_V5_DICE_LIMITS.die.minimum,
          maximum: VTM_V5_DICE_LIMITS.die.maximum,
        },
      });
      allDiceValid = false;
    }
  }

  return allDiceValid ? [...value] : null;
}

function getSummaryKey(
  isSuccess: boolean | null,
  isBestialFailure: boolean,
  isMessyCritical: boolean,
  isOrdinaryCritical: boolean,
  isTotalFailure: boolean,
  hasCriticalPair: boolean,
  totalSuccesses: number,
): VtmV5DiceSummaryKey {
  if (isSuccess === null) {
    if (totalSuccesses === 0) {
      return "no-successes-unresolved";
    }

    return hasCriticalPair
      ? "critical-pair-unresolved"
      : "successes-counted";
  }

  if (isBestialFailure) {
    return "bestial-failure";
  }

  if (isMessyCritical) {
    return "messy-critical";
  }

  if (isOrdinaryCritical) {
    return "ordinary-critical";
  }

  if (isTotalFailure) {
    return "total-failure";
  }

  return isSuccess ? "success" : "failure";
}

export function evaluateVtmV5Dice(
  input: unknown,
): VtmV5DiceEvaluation {
  const errors: VtmV5DiceValidationError[] = [];

  if (!isRecord(input)) {
    return {
      ok: false,
      errors: [{ code: "invalid-type", path: "$" }],
    };
  }

  const requestValue = input.request;
  let pool: ValidatedNumber = {
    isValid: false,
    value: null,
  };
  let hungerDice: ValidatedNumber = {
    isValid: false,
    value: null,
  };
  let difficulty: ValidatedNumber = {
    isValid: true,
    value: null,
  };
  let label: string | null = null;

  if (!hasOwn(input, "request")) {
    errors.push({ code: "required", path: "request" });
  } else if (!isRecord(requestValue)) {
    errors.push({ code: "invalid-type", path: "request" });
  } else {
    if (!hasOwn(requestValue, "pool")) {
      errors.push({
        code: "required",
        path: "request.pool",
      });
    } else {
      pool = validateBoundedInteger(
        requestValue.pool,
        "request.pool",
        VTM_V5_DICE_LIMITS.pool.minimum,
        VTM_V5_DICE_LIMITS.pool.maximum,
        errors,
      );
    }

    if (!hasOwn(requestValue, "hungerDice")) {
      errors.push({
        code: "required",
        path: "request.hungerDice",
      });
    } else {
      hungerDice = validateBoundedInteger(
        requestValue.hungerDice,
        "request.hungerDice",
        VTM_V5_DICE_LIMITS.hungerDice.minimum,
        VTM_V5_DICE_LIMITS.hungerDice.maximum,
        errors,
      );
    }

    if (hasOwn(requestValue, "difficulty")) {
      difficulty = validateBoundedInteger(
        requestValue.difficulty,
        "request.difficulty",
        VTM_V5_DICE_LIMITS.difficulty.minimum,
        VTM_V5_DICE_LIMITS.difficulty.maximum,
        errors,
      );
    }

    if (hasOwn(requestValue, "label")) {
      label = normalizeLabel(requestValue.label, errors);
    }

    if (
      pool.isValid &&
      hungerDice.isValid &&
      hungerDice.value! > pool.value!
    ) {
      errors.push({
        code: "hunger-exceeds-pool",
        path: "request.hungerDice",
        details: { pool: pool.value! },
      });
    }

    addUnexpectedFieldErrors(
      requestValue,
      REQUEST_FIELDS,
      "request",
      errors,
    );
  }

  const hasValidDiceCounts =
    pool.isValid &&
    hungerDice.isValid &&
    hungerDice.value! <= pool.value!;

  const normalDice = validateDiceArray(
    input.normalDice,
    "normalDice",
    hasOwn(input, "normalDice"),
    hasValidDiceCounts
      ? pool.value! - hungerDice.value!
      : null,
    errors,
  );
  const hungerDiceResults = validateDiceArray(
    input.hungerDiceResults,
    "hungerDiceResults",
    hasOwn(input, "hungerDiceResults"),
    hasValidDiceCounts ? hungerDice.value! : null,
    errors,
  );

  addUnexpectedFieldErrors(
    input,
    INPUT_FIELDS,
    "$",
    errors,
  );

  if (
    errors.length > 0 ||
    !pool.isValid ||
    !hungerDice.isValid ||
    !difficulty.isValid ||
    normalDice === null ||
    hungerDiceResults === null
  ) {
    return { ok: false, errors };
  }

  const allDice = [...normalDice, ...hungerDiceResults];
  const nonTenSuccessCount = allDice.filter(
    (die) => die >= 6 && die <= 9,
  ).length;
  const tenCount = allDice.filter((die) => die === 10).length;
  const criticalPairCount = Math.floor(tenCount / 2);
  const totalSuccesses =
    nonTenSuccessCount +
    tenCount +
    2 * criticalPairCount;
  const hasCriticalPair = criticalPairCount > 0;
  const hasHungerOne = hungerDiceResults.includes(1);
  const hasHungerTen = hungerDiceResults.includes(10);
  const normalizedDifficulty = difficulty.value;
  const isSuccess = normalizedDifficulty === null
    ? null
    : totalSuccesses >= normalizedDifficulty;
  const margin = normalizedDifficulty === null
    ? null
    : totalSuccesses - normalizedDifficulty;
  const difficultyResult: VtmV5DifficultyResult =
    isSuccess === null
      ? "not-set"
      : isSuccess
        ? "success"
        : "failure";
  const isOrdinaryCritical =
    isSuccess === true &&
    hasCriticalPair &&
    !hasHungerTen;
  const isMessyCritical =
    isSuccess === true &&
    hasCriticalPair &&
    hasHungerTen;
  const isTotalFailure =
    isSuccess === false && totalSuccesses === 0;
  const isBestialFailure =
    isSuccess === false && hasHungerOne;
  const hasUnpairedTen = tenCount % 2 === 1;
  const criticalPairBelowDifficulty =
    isSuccess === false && hasCriticalPair;

  return {
    ok: true,
    result: {
      gameSystem: VTM_V5_DICE_GAME_SYSTEM,
      request: {
        pool: pool.value!,
        hungerDice: hungerDice.value!,
        difficulty: normalizedDifficulty,
        label,
      },
      normalDice,
      hungerDiceResults,
      nonTenSuccessCount,
      tenCount,
      criticalPairCount,
      totalSuccesses,
      hasCriticalPair,
      isSuccess,
      isOrdinaryCritical,
      isMessyCritical,
      isTotalFailure,
      isBestialFailure,
      difficultyResult,
      margin,
      summaryKey: getSummaryKey(
        isSuccess,
        isBestialFailure,
        isMessyCritical,
        isOrdinaryCritical,
        isTotalFailure,
        hasCriticalPair,
        totalSuccesses,
      ),
      detailFlags: {
        hasNonTenSuccess: nonTenSuccessCount > 0,
        hasHungerOne,
        hasHungerTen,
        hasUnpairedTen,
        hasZeroSuccesses: totalSuccesses === 0,
        criticalPairBelowDifficulty,
        difficultyOmitted: normalizedDifficulty === null,
      },
    },
  };
}
