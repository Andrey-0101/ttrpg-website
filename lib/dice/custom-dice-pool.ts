import {
  isRecord,
  validateIntegerInRange,
} from "./validation";
import {
  cryptoUint32RandomSource,
  generateUnbiasedInteger,
  type Uint32RandomSource,
} from "./secure-random";

export const CUSTOM_DIE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export const CUSTOM_POOL_ITEM_KEYS = ["coin", ...CUSTOM_DIE_SIDES] as const;

export type CustomDieSides = (typeof CUSTOM_DIE_SIDES)[number];
export type CustomPoolItemKey = (typeof CUSTOM_POOL_ITEM_KEYS)[number];
export type CustomCoinOutcome = "heads" | "tails";
export type CustomDiceRandomSource = Uint32RandomSource;
export type CustomDiceQuantities = Record<CustomPoolItemKey, number>;

export const CUSTOM_DICE_POOL_LIMITS = {
  quantityPerType: 100,
  totalDice: 100,
} as const;

export type CustomDicePoolErrorCode =
  | "invalid-request"
  | "invalid-quantities"
  | "invalid-quantity"
  | "pool-empty"
  | "pool-too-large";

export type CustomDicePoolError = {
  code: CustomDicePoolErrorCode;
  path: string;
};

export type CustomDicePoolGroup = {
  sides: CustomDieSides;
  results: number[];
};

export type CustomDicePoolResult = {
  quantities: CustomDiceQuantities;
  coinResults: CustomCoinOutcome[];
  groups: CustomDicePoolGroup[];
  totalItems: number;
  numericDiceTotal: number;
};

export type CustomDicePoolEvaluation =
  | { ok: true; result: CustomDicePoolResult }
  | { ok: false; errors: CustomDicePoolError[] };

export const CUSTOM_COIN_OUTCOME_SPLIT = 0x8000_0000;

export const cryptoCustomDiceRandomSource: CustomDiceRandomSource =
  cryptoUint32RandomSource;

function validateRequest(input: unknown):
  | { ok: true; quantities: CustomDiceQuantities; totalDice: number }
  | { ok: false; errors: CustomDicePoolError[] } {
  if (!isRecord(input)) {
    return { ok: false, errors: [{ code: "invalid-request", path: "request" }] };
  }

  if (!isRecord(input.quantities)) {
    return {
      ok: false,
      errors: [{ code: "invalid-quantities", path: "request.quantities" }],
    };
  }

  const errors: CustomDicePoolError[] = [];
  const quantities = {} as CustomDiceQuantities;
  let totalDice = 0;

  for (const item of CUSTOM_POOL_ITEM_KEYS) {
    const quantity = input.quantities[String(item)];
    const validation = validateIntegerInRange(
      quantity,
      0,
      CUSTOM_DICE_POOL_LIMITS.quantityPerType,
    );

    if (!validation.ok) {
      errors.push({
        code: "invalid-quantity",
        path: `request.quantities.${item}`,
      });
      continue;
    }

    quantities[item] = validation.value;
    totalDice += validation.value;
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (totalDice === 0) {
    return {
      ok: false,
      errors: [{ code: "pool-empty", path: "request.quantities" }],
    };
  }

  if (totalDice > CUSTOM_DICE_POOL_LIMITS.totalDice) {
    return {
      ok: false,
      errors: [{ code: "pool-too-large", path: "request.quantities" }],
    };
  }

  return { ok: true, quantities, totalDice };
}

function generateCoin(randomSource: CustomDiceRandomSource): CustomCoinOutcome {
  const sample = new Uint32Array(1);
  randomSource(sample);

  return sample[0] < CUSTOM_COIN_OUTCOME_SPLIT ? "heads" : "tails";
}

export function rollCustomDicePool(
  input: unknown,
  randomSource: CustomDiceRandomSource = cryptoCustomDiceRandomSource,
): CustomDicePoolEvaluation {
  const validation = validateRequest(input);

  if (!validation.ok) {
    return validation;
  }

  const coinResults = Array.from(
    { length: validation.quantities.coin },
    () => generateCoin(randomSource),
  );
  const groups = CUSTOM_DIE_SIDES.flatMap((sides) => {
    const quantity = validation.quantities[sides];

    if (quantity === 0) {
      return [];
    }

    return [
      {
        sides,
        results: Array.from({ length: quantity }, () =>
          generateUnbiasedInteger(1, sides + 1, randomSource),
        ),
      },
    ];
  });
  const numericDiceTotal = groups.reduce(
    (poolTotal, group) =>
      poolTotal + group.results.reduce((groupTotal, die) => groupTotal + die, 0),
    0,
  );

  return {
    ok: true,
    result: {
      quantities: { ...validation.quantities },
      coinResults: [...coinResults],
      groups: groups.map((group) => ({
        ...group,
        results: [...group.results],
      })),
      totalItems: validation.totalDice,
      numericDiceTotal,
    },
  };
}
