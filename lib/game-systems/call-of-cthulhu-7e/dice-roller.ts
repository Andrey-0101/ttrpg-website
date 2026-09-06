import {
  cryptoUint32RandomSource,
  generateUnbiasedInteger,
  type Uint32RandomSource,
} from "../../dice/secure-random";
import {
  evaluateCoc7eOtherDice,
  evaluateCoc7ePercentileTest,
  validateCoc7eOtherDiceRequest,
  validateCoc7ePercentileRequest,
  type Coc7eOtherDiceEvaluation,
  type Coc7ePercentileTestEvaluation,
  type Coc7eTensValue,
} from "./dice-engine";

export function rollCoc7ePercentileTest(
  request: unknown,
  randomSource: Uint32RandomSource = cryptoUint32RandomSource,
): Coc7ePercentileTestEvaluation {
  const requestValidation = validateCoc7ePercentileRequest(request);

  if (!requestValidation.ok) {
    return requestValidation;
  }

  const units = generateUnbiasedInteger(0, 10, randomSource);
  const tensCount =
    1 + Math.abs(requestValidation.request.bonusPenalty);
  const tensDice = Array.from({ length: tensCount }, () =>
    (generateUnbiasedInteger(0, 10, randomSource) * 10) as Coc7eTensValue,
  );

  return evaluateCoc7ePercentileTest({
    request: requestValidation.request,
    units,
    tensDice,
  });
}

export function rollCoc7eOtherDice(
  request: unknown,
  randomSource: Uint32RandomSource = cryptoUint32RandomSource,
): Coc7eOtherDiceEvaluation {
  const requestValidation = validateCoc7eOtherDiceRequest(request);

  if (!requestValidation.ok) {
    return requestValidation;
  }

  const results = Array.from(
    { length: requestValidation.request.quantity },
    () =>
      generateUnbiasedInteger(
        1,
        requestValidation.request.sides + 1,
        randomSource,
      ),
  );

  return evaluateCoc7eOtherDice({
    request: requestValidation.request,
    results,
  });
}
