import {
  evaluateVtmV5Dice,
  VTM_V5_DICE_LIMITS,
  type VtmV5DiceEvaluation,
} from "./dice-engine";

export type VtmV5RandomSource = (target: Uint32Array) => void;

const UINT32_RANGE = 0x1_0000_0000;
const D10_ACCEPTANCE_LIMIT =
  UINT32_RANGE - (UINT32_RANGE % VTM_V5_DICE_LIMITS.die.maximum);

export const cryptoVtmV5RandomSource: VtmV5RandomSource = (target) => {
  globalThis.crypto.getRandomValues(target);
};

function getGenerationCounts(
  request: unknown,
): { normalDice: number; hungerDice: number } | null {
  if (
    typeof request !== "object" ||
    request === null ||
    Array.isArray(request)
  ) {
    return null;
  }

  const value = request as Record<string, unknown>;
  const pool = value.pool;
  const hungerDice = value.hungerDice;

  // These guards only make array allocation safe. The evaluator remains the
  // authoritative validator for the public request contract.
  if (
    typeof pool !== "number" ||
    !Number.isInteger(pool) ||
    pool < VTM_V5_DICE_LIMITS.pool.minimum ||
    pool > VTM_V5_DICE_LIMITS.pool.maximum ||
    typeof hungerDice !== "number" ||
    !Number.isInteger(hungerDice) ||
    hungerDice < VTM_V5_DICE_LIMITS.hungerDice.minimum ||
    hungerDice > VTM_V5_DICE_LIMITS.hungerDice.maximum ||
    hungerDice > pool
  ) {
    return null;
  }

  return {
    normalDice: pool - hungerDice,
    hungerDice,
  };
}

function generateD10(randomSource: VtmV5RandomSource): number {
  const sample = new Uint32Array(1);

  while (true) {
    randomSource(sample);

    if (sample[0] < D10_ACCEPTANCE_LIMIT) {
      return (
        (sample[0] % VTM_V5_DICE_LIMITS.die.maximum) +
        VTM_V5_DICE_LIMITS.die.minimum
      );
    }
  }
}

function generateDice(
  count: number,
  randomSource: VtmV5RandomSource,
): number[] {
  return Array.from({ length: count }, () => generateD10(randomSource));
}

export function rollVtmV5Dice(
  request: unknown,
  randomSource: VtmV5RandomSource = cryptoVtmV5RandomSource,
): VtmV5DiceEvaluation {
  const counts = getGenerationCounts(request);

  if (!counts) {
    return evaluateVtmV5Dice({
      request,
      normalDice: [],
      hungerDiceResults: [],
    });
  }

  const requestValidation = evaluateVtmV5Dice({
    request,
    normalDice: new Array<number>(counts.normalDice).fill(1),
    hungerDiceResults: new Array<number>(counts.hungerDice).fill(1),
  });

  if (!requestValidation.ok) {
    return requestValidation;
  }

  const normalDice = generateDice(counts.normalDice, randomSource);
  const hungerDiceResults = generateDice(counts.hungerDice, randomSource);

  return evaluateVtmV5Dice({
    request,
    normalDice,
    hungerDiceResults,
  });
}
