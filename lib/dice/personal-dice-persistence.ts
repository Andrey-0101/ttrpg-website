import {
  CUSTOM_DICE_POOL_LIMITS,
  CUSTOM_DIE_SIDES,
  CUSTOM_POOL_ITEM_KEYS,
  type CustomCoinOutcome,
  type CustomDiceQuantities,
  type CustomDieSides,
} from "./custom-dice-pool";
import {
  evaluateVtmV5Dice,
  type NormalizedVtmV5DiceRequest,
  type VtmV5DiceRequest,
  type VtmV5DiceDetailFlags,
  type VtmV5DiceResult,
  type VtmV5DiceValidationError,
} from "../game-systems/vtm-v5/dice-engine";
import {
  evaluateCoc7eOtherDice,
  evaluateCoc7ePercentileTest,
  type Coc7eOtherDiceInput,
  type Coc7eOtherDiceResult,
  type Coc7ePercentileTestInput,
  type Coc7ePercentileTestResult,
  type Coc7ePercentileValidationError,
  type Coc7eOtherDiceValidationError,
} from "../game-systems/call-of-cthulhu-7e/dice-engine";
import type { Database } from "../../types/database.types";

export const PERSONAL_ROLL_SCHEMA_VERSION = 1 as const;

type PersonalRollSnapshotValidator = (
  envelope: ValidatedEnvelope,
  issues: PersonalRollPersistenceIssue[],
) => PersonalRollPersistencePayload | null;

export const PERSONAL_ROLLER_REGISTRY = {
  vtm_v5: {
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    validate: validateVtmSnapshot,
  },
  custom_dice_pool: {
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    validate: validateCustomSnapshot,
  },
  coc_7e_percentile: {
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    validate: validateCoc7ePercentileSnapshot,
  },
  coc_7e_other_dice: {
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    validate: validateCoc7eOtherDiceSnapshot,
  },
} as const satisfies Record<
  string,
  {
    schemaVersion: number;
    validate: PersonalRollSnapshotValidator;
  }
>;

export type PersonalRollerKind = keyof typeof PERSONAL_ROLLER_REGISTRY;
export const PERSONAL_ROLLER_KINDS = Object.freeze(
  Object.keys(PERSONAL_ROLLER_REGISTRY) as PersonalRollerKind[],
);

export type PersonalRollPersistenceIssueCode =
  | "required"
  | "unexpected-field"
  | "invalid-type"
  | "not-finite"
  | "not-integer"
  | "out-of-range"
  | "invalid-uuid"
  | "unsupported-roller-kind"
  | "unsupported-schema-version"
  | "hunger-exceeds-pool"
  | "label-too-long"
  | "wrong-array-length"
  | "invalid-die-value"
  | "unsupported-coin-outcome"
  | "unsupported-die"
  | "duplicate-die-group"
  | "pool-empty"
  | "pool-too-large";

export type PersonalRollPersistenceIssue = {
  code: PersonalRollPersistenceIssueCode;
  path: string;
  details?: Readonly<Record<string, string | number>>;
};

export type VtmV5PersonalRollRequestData = {
  request: VtmV5DiceRequest;
  normalDice: number[];
  hungerDiceResults: number[];
};

export type VtmV5PersonalRollResultData = {
  gameSystem: VtmV5DiceResult["gameSystem"];
  request: NormalizedVtmV5DiceRequest;
  normalDice: number[];
  hungerDiceResults: number[];
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
  difficultyResult: VtmV5DiceResult["difficultyResult"];
  margin: number | null;
  summaryKey: VtmV5DiceResult["summaryKey"];
  detailFlags: VtmV5DiceDetailFlags;
};

export type CustomPersonalRollRequestData = {
  quantities: CustomDiceQuantities;
};

export type CustomPersonalRollResultData = {
  coinResults: CustomCoinOutcome[];
  groups: Array<{
    sides: CustomDieSides;
    results: number[];
  }>;
  totalItems: number;
  numericDiceTotal: number;
  headsCount: number;
  tailsCount: number;
};

export type Coc7ePercentilePersonalRollRequestData = {
  request: Coc7ePercentileTestInput["request"];
  units: number;
  tensDice: number[];
};

export type Coc7ePercentilePersonalRollResultData = Omit<
  Coc7ePercentileTestResult,
  "tensDice" | "candidates"
> & {
  tensDice: number[];
  candidates: number[];
};

export type Coc7eOtherDicePersonalRollRequestData = {
  request: Coc7eOtherDiceInput["request"];
  results: number[];
};

export type Coc7eOtherDicePersonalRollResultData = Omit<
  Coc7eOtherDiceResult,
  "results"
> & {
  results: number[];
};

type RecordPersonalRollArgs =
  Database["public"]["Functions"]["record_personal_roll"]["Args"];

type DatabaseReadyPersonalRollPayload<
  Kind extends PersonalRollerKind,
  RequestData,
  ResultData,
> = Omit<
  RecordPersonalRollArgs,
  | "p_roller_kind"
  | "p_schema_version"
  | "p_request_data"
  | "p_result_data"
> & {
  p_roller_kind: Kind;
  p_schema_version: typeof PERSONAL_ROLL_SCHEMA_VERSION;
  p_request_data: RequestData;
  p_result_data: ResultData;
};

export type VtmV5PersonalRollPersistencePayload =
  DatabaseReadyPersonalRollPayload<
    "vtm_v5",
    VtmV5PersonalRollRequestData,
    VtmV5PersonalRollResultData
  >;

export type CustomPersonalRollPersistencePayload =
  DatabaseReadyPersonalRollPayload<
    "custom_dice_pool",
    CustomPersonalRollRequestData,
    CustomPersonalRollResultData
  >;

export type Coc7ePercentilePersonalRollPersistencePayload =
  DatabaseReadyPersonalRollPayload<
    "coc_7e_percentile",
    Coc7ePercentilePersonalRollRequestData,
    Coc7ePercentilePersonalRollResultData
  >;

export type Coc7eOtherDicePersonalRollPersistencePayload =
  DatabaseReadyPersonalRollPayload<
    "coc_7e_other_dice",
    Coc7eOtherDicePersonalRollRequestData,
    Coc7eOtherDicePersonalRollResultData
  >;

export type PersonalRollPersistencePayload =
  | VtmV5PersonalRollPersistencePayload
  | CustomPersonalRollPersistencePayload
  | Coc7ePercentilePersonalRollPersistencePayload
  | Coc7eOtherDicePersonalRollPersistencePayload;

export type PersonalRollPersistenceValidation =
  | {
      ok: true;
      payload: PersonalRollPersistencePayload;
    }
  | {
      ok: false;
      issues: readonly PersonalRollPersistenceIssue[];
    };

type UnknownRecord = Record<string, unknown>;

type ValidatedEnvelope = {
  clientRollId: string | null;
  rollerKind: PersonalRollerKind | null;
  schemaVersionValid: boolean;
  requestData: UnknownRecord | null;
  resultData: UnknownRecord | null;
};

type ValidatedInteger = {
  valid: boolean;
  value: number | null;
};

const ENVELOPE_FIELDS = new Set([
  "clientRollId",
  "rollerKind",
  "schemaVersion",
  "requestData",
  "resultData",
]);

const VTM_RESULT_FIELDS = new Set([
  "gameSystem",
  "request",
  "normalDice",
  "hungerDiceResults",
  "nonTenSuccessCount",
  "tenCount",
  "criticalPairCount",
  "totalSuccesses",
  "hasCriticalPair",
  "isSuccess",
  "isOrdinaryCritical",
  "isMessyCritical",
  "isTotalFailure",
  "isBestialFailure",
  "difficultyResult",
  "margin",
  "summaryKey",
  "detailFlags",
]);

const CUSTOM_REQUEST_FIELDS = new Set(["quantities"]);
const CUSTOM_RESULT_FIELDS = new Set([
  "quantities",
  "coinResults",
  "groups",
  "totalItems",
  "numericDiceTotal",
  "headsCount",
  "tailsCount",
]);
const CUSTOM_GROUP_FIELDS = new Set(["sides", "results"]);
const COC_PERCENTILE_RESULT_FIELDS = new Set([
  "gameSystem",
  "request",
  "units",
  "tensDice",
  "candidates",
  "selectedTensIndex",
  "percentileResult",
  "hardThreshold",
  "extremeThreshold",
  "outcome",
]);
const COC_OTHER_DICE_RESULT_FIELDS = new Set([
  "gameSystem",
  "request",
  "results",
  "formula",
  "subtotal",
  "total",
]);
const CUSTOM_QUANTITY_FIELDS = new Set(
  CUSTOM_POOL_ITEM_KEYS.map(String),
);
const SUPPORTED_CUSTOM_DIE_SIDES = new Set<number>(CUSTOM_DIE_SIDES);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasOwn(value: UnknownRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function addUnexpectedFieldIssues(
  value: UnknownRecord,
  allowedFields: ReadonlySet<string>,
  path: string,
  issues: PersonalRollPersistenceIssue[],
): void {
  const fields = Object.keys(value)
    .filter((field) => !allowedFields.has(field))
    .sort();

  for (const field of fields) {
    issues.push({
      code: "unexpected-field",
      path: `${path}.${field}`,
    });
  }
}

function validateRequiredRecord(
  value: UnknownRecord,
  key: string,
  path: string,
  issues: PersonalRollPersistenceIssue[],
): UnknownRecord | null {
  if (!hasOwn(value, key)) {
    issues.push({ code: "required", path });
    return null;
  }

  const candidate = value[key];
  if (!isRecord(candidate)) {
    issues.push({ code: "invalid-type", path });
    return null;
  }

  return candidate;
}

function validateInteger(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
  issues: PersonalRollPersistenceIssue[],
): ValidatedInteger {
  if (typeof value !== "number") {
    issues.push({ code: "invalid-type", path });
    return { valid: false, value: null };
  }

  if (!Number.isFinite(value)) {
    issues.push({ code: "not-finite", path });
    return { valid: false, value: null };
  }

  if (!Number.isInteger(value)) {
    issues.push({ code: "not-integer", path });
    return { valid: false, value: null };
  }

  if (value < minimum || value > maximum) {
    issues.push({
      code: "out-of-range",
      path,
      details: { minimum, maximum },
    });
    return { valid: false, value: null };
  }

  return { valid: true, value };
}

function validateEnvelope(
  input: UnknownRecord,
  issues: PersonalRollPersistenceIssue[],
): ValidatedEnvelope {
  let clientRollId: string | null = null;
  let rollerKind: PersonalRollerKind | null = null;
  let schemaVersionValid = false;

  if (!hasOwn(input, "clientRollId")) {
    issues.push({ code: "required", path: "clientRollId" });
  } else if (typeof input.clientRollId !== "string") {
    issues.push({ code: "invalid-type", path: "clientRollId" });
  } else if (!UUID_PATTERN.test(input.clientRollId)) {
    issues.push({ code: "invalid-uuid", path: "clientRollId" });
  } else {
    clientRollId = input.clientRollId.toLowerCase();
  }

  if (!hasOwn(input, "rollerKind")) {
    issues.push({ code: "required", path: "rollerKind" });
  } else if (typeof input.rollerKind !== "string") {
    issues.push({ code: "invalid-type", path: "rollerKind" });
  } else if (!hasOwn(PERSONAL_ROLLER_REGISTRY, input.rollerKind)) {
    issues.push({
      code: "unsupported-roller-kind",
      path: "rollerKind",
    });
  } else {
    rollerKind = input.rollerKind as PersonalRollerKind;
  }

  if (!hasOwn(input, "schemaVersion")) {
    issues.push({ code: "required", path: "schemaVersion" });
  } else {
    const schemaVersion = validateInteger(
      input.schemaVersion,
      "schemaVersion",
      1,
      Number.MAX_SAFE_INTEGER,
      issues,
    );
    const supportedVersion = rollerKind
      ? PERSONAL_ROLLER_REGISTRY[rollerKind].schemaVersion
      : PERSONAL_ROLL_SCHEMA_VERSION;
    if (
      schemaVersion.valid &&
      schemaVersion.value === supportedVersion
    ) {
      schemaVersionValid = true;
    } else if (
      schemaVersion.valid &&
      schemaVersion.value !== supportedVersion
    ) {
      issues.push({
        code: "unsupported-schema-version",
        path: "schemaVersion",
        details: { supported: supportedVersion },
      });
    } else if (
      typeof input.schemaVersion === "number" &&
      Number.isFinite(input.schemaVersion) &&
      Number.isInteger(input.schemaVersion)
    ) {
      const outOfRangeIndex = issues.findIndex(
        (issue) =>
          issue.path === "schemaVersion" &&
          issue.code === "out-of-range",
      );
      if (outOfRangeIndex >= 0) {
        issues.splice(outOfRangeIndex, 1, {
          code: "unsupported-schema-version",
          path: "schemaVersion",
          details: {
            supported: supportedVersion,
          },
        });
      }
    }
  }

  const requestData = validateRequiredRecord(
    input,
    "requestData",
    "requestData",
    issues,
  );
  const resultData = validateRequiredRecord(
    input,
    "resultData",
    "resultData",
    issues,
  );

  addUnexpectedFieldIssues(
    input,
    ENVELOPE_FIELDS,
    "$",
    issues,
  );

  return {
    clientRollId,
    rollerKind,
    schemaVersionValid,
    requestData,
    resultData,
  };
}

function mapVtmIssue(
  error: VtmV5DiceValidationError,
): PersonalRollPersistenceIssue {
  const path =
    error.path === "$"
      ? "requestData"
      : error.path.startsWith("$.")
        ? `requestData${error.path.slice(1)}`
        : `requestData.${error.path}`;

  return {
    code: error.code,
    path,
    ...(error.details ? { details: { ...error.details } } : {}),
  };
}

function copyVtmResult(
  result: VtmV5DiceResult,
): VtmV5PersonalRollResultData {
  return {
    gameSystem: result.gameSystem,
    request: { ...result.request },
    normalDice: [...result.normalDice],
    hungerDiceResults: [...result.hungerDiceResults],
    nonTenSuccessCount: result.nonTenSuccessCount,
    tenCount: result.tenCount,
    criticalPairCount: result.criticalPairCount,
    totalSuccesses: result.totalSuccesses,
    hasCriticalPair: result.hasCriticalPair,
    isSuccess: result.isSuccess,
    isOrdinaryCritical: result.isOrdinaryCritical,
    isMessyCritical: result.isMessyCritical,
    isTotalFailure: result.isTotalFailure,
    isBestialFailure: result.isBestialFailure,
    difficultyResult: result.difficultyResult,
    margin: result.margin,
    summaryKey: result.summaryKey,
    detailFlags: { ...result.detailFlags },
  };
}

function copyVtmRequestForPersistence(
  request: NormalizedVtmV5DiceRequest,
): VtmV5DiceRequest {
  return {
    pool: request.pool,
    hungerDice: request.hungerDice,
    ...(request.difficulty === null
      ? {}
      : { difficulty: request.difficulty }),
    ...(request.label === null ? {} : { label: request.label }),
  };
}

function validateVtmSnapshot(
  envelope: ValidatedEnvelope,
  issues: PersonalRollPersistenceIssue[],
): VtmV5PersonalRollPersistencePayload | null {
  if (envelope.resultData) {
    addUnexpectedFieldIssues(
      envelope.resultData,
      VTM_RESULT_FIELDS,
      "resultData",
      issues,
    );
  }

  if (!envelope.requestData) {
    return null;
  }

  const evaluation = evaluateVtmV5Dice(envelope.requestData);
  if (!evaluation.ok) {
    issues.push(...evaluation.errors.map(mapVtmIssue));
    return null;
  }

  if (
    issues.length > 0 ||
    !envelope.clientRollId ||
    !envelope.schemaVersionValid
  ) {
    return null;
  }

  const canonicalResult = copyVtmResult(evaluation.result);
  const payload: VtmV5PersonalRollPersistencePayload = {
    p_client_roll_id: envelope.clientRollId,
    p_roller_kind: "vtm_v5",
    p_schema_version: PERSONAL_ROLL_SCHEMA_VERSION,
    p_request_data: {
      request: copyVtmRequestForPersistence(canonicalResult.request),
      normalDice: [...canonicalResult.normalDice],
      hungerDiceResults: [...canonicalResult.hungerDiceResults],
    },
    p_result_data: canonicalResult,
  };

  payload satisfies RecordPersonalRollArgs;
  return payload;
}

function validateCustomQuantities(
  requestData: UnknownRecord,
  issues: PersonalRollPersistenceIssue[],
): {
  quantities: CustomDiceQuantities | null;
  totalItems: number | null;
} {
  addUnexpectedFieldIssues(
    requestData,
    CUSTOM_REQUEST_FIELDS,
    "requestData",
    issues,
  );

  if (!hasOwn(requestData, "quantities")) {
    issues.push({
      code: "required",
      path: "requestData.quantities",
    });
    return { quantities: null, totalItems: null };
  }

  if (!isRecord(requestData.quantities)) {
    issues.push({
      code: "invalid-type",
      path: "requestData.quantities",
    });
    return { quantities: null, totalItems: null };
  }

  const quantityInput = requestData.quantities;
  const quantities = {} as CustomDiceQuantities;
  let allValid = true;
  let totalItems = 0;

  for (const item of CUSTOM_POOL_ITEM_KEYS) {
    const key = String(item);
    const path = `requestData.quantities.${key}`;

    if (!hasOwn(quantityInput, key)) {
      issues.push({ code: "required", path });
      allValid = false;
      continue;
    }

    const quantity = validateInteger(
      quantityInput[key],
      path,
      0,
      CUSTOM_DICE_POOL_LIMITS.quantityPerType,
      issues,
    );
    if (!quantity.valid) {
      allValid = false;
      continue;
    }

    quantities[item] = quantity.value!;
    totalItems += quantity.value!;
  }

  addUnexpectedFieldIssues(
    quantityInput,
    CUSTOM_QUANTITY_FIELDS,
    "requestData.quantities",
    issues,
  );

  if (!allValid) {
    return { quantities: null, totalItems: null };
  }

  if (totalItems === 0) {
    issues.push({
      code: "pool-empty",
      path: "requestData.quantities",
    });
    return { quantities: null, totalItems: null };
  }

  if (totalItems > CUSTOM_DICE_POOL_LIMITS.totalDice) {
    issues.push({
      code: "pool-too-large",
      path: "requestData.quantities",
      details: { maximum: CUSTOM_DICE_POOL_LIMITS.totalDice },
    });
    return { quantities: null, totalItems: null };
  }

  return {
    quantities: { ...quantities },
    totalItems,
  };
}

function validateCoinResults(
  resultData: UnknownRecord,
  expectedLength: number | null,
  issues: PersonalRollPersistenceIssue[],
): CustomCoinOutcome[] | null {
  if (!hasOwn(resultData, "coinResults")) {
    issues.push({
      code: "required",
      path: "resultData.coinResults",
    });
    return null;
  }

  if (!Array.isArray(resultData.coinResults)) {
    issues.push({
      code: "invalid-type",
      path: "resultData.coinResults",
    });
    return null;
  }

  const values = resultData.coinResults;
  let allValid = true;

  if (
    expectedLength !== null &&
    values.length !== expectedLength
  ) {
    issues.push({
      code: "wrong-array-length",
      path: "resultData.coinResults",
      details: {
        expected: expectedLength,
        actual: values.length,
      },
    });
    allValid = false;
  }

  for (const [index, outcome] of values.entries()) {
    if (outcome !== "heads" && outcome !== "tails") {
      issues.push({
        code: "unsupported-coin-outcome",
        path: `resultData.coinResults[${index}]`,
      });
      allValid = false;
    }
  }

  return allValid ? [...values] as CustomCoinOutcome[] : null;
}

function validateNumericResults(
  value: unknown,
  sides: CustomDieSides,
  expectedLength: number,
  path: string,
  issues: PersonalRollPersistenceIssue[],
): number[] | null {
  if (!Array.isArray(value)) {
    issues.push({ code: "invalid-type", path });
    return null;
  }

  let allValid = true;
  if (value.length !== expectedLength) {
    issues.push({
      code: "wrong-array-length",
      path,
      details: {
        expected: expectedLength,
        actual: value.length,
      },
    });
    allValid = false;
  }

  for (const [index, die] of value.entries()) {
    const diePath = `${path}[${index}]`;
    const validation = validateInteger(
      die,
      diePath,
      1,
      sides,
      issues,
    );
    if (!validation.valid) {
      allValid = false;
    }
  }

  return allValid ? [...value] as number[] : null;
}

function validateCustomGroups(
  resultData: UnknownRecord,
  quantities: CustomDiceQuantities | null,
  issues: PersonalRollPersistenceIssue[],
): CustomPersonalRollResultData["groups"] | null {
  if (!hasOwn(resultData, "groups")) {
    issues.push({ code: "required", path: "resultData.groups" });
    return null;
  }

  if (!Array.isArray(resultData.groups)) {
    issues.push({
      code: "invalid-type",
      path: "resultData.groups",
    });
    return null;
  }

  const groupInputs = resultData.groups;
  const groupsBySides = new Map<CustomDieSides, number[]>();
  let allValid = true;

  for (const [index, groupValue] of groupInputs.entries()) {
    const groupPath = `resultData.groups[${index}]`;
    if (!isRecord(groupValue)) {
      issues.push({ code: "invalid-type", path: groupPath });
      allValid = false;
      continue;
    }

    addUnexpectedFieldIssues(
      groupValue,
      CUSTOM_GROUP_FIELDS,
      groupPath,
      issues,
    );

    if (!hasOwn(groupValue, "sides")) {
      issues.push({
        code: "required",
        path: `${groupPath}.sides`,
      });
      allValid = false;
      continue;
    }

    const sidesValue = groupValue.sides;
    if (typeof sidesValue !== "number") {
      issues.push({
        code: "invalid-type",
        path: `${groupPath}.sides`,
      });
      allValid = false;
      continue;
    }
    if (!Number.isFinite(sidesValue)) {
      issues.push({
        code: "not-finite",
        path: `${groupPath}.sides`,
      });
      allValid = false;
      continue;
    }
    if (!Number.isInteger(sidesValue)) {
      issues.push({
        code: "not-integer",
        path: `${groupPath}.sides`,
      });
      allValid = false;
      continue;
    }
    if (!SUPPORTED_CUSTOM_DIE_SIDES.has(sidesValue)) {
      issues.push({
        code: "unsupported-die",
        path: `${groupPath}.sides`,
      });
      allValid = false;
      continue;
    }

    const sides = sidesValue as CustomDieSides;
    if (groupsBySides.has(sides)) {
      issues.push({
        code: "duplicate-die-group",
        path: `${groupPath}.sides`,
      });
      allValid = false;
      continue;
    }

    if (!hasOwn(groupValue, "results")) {
      issues.push({
        code: "required",
        path: `${groupPath}.results`,
      });
      allValid = false;
    } else if (quantities) {
      const results = validateNumericResults(
        groupValue.results,
        sides,
        quantities[sides],
        `${groupPath}.results`,
        issues,
      );
      if (results) {
        groupsBySides.set(sides, results);
      } else {
        allValid = false;
      }
    } else if (!Array.isArray(groupValue.results)) {
      issues.push({
        code: "invalid-type",
        path: `${groupPath}.results`,
      });
      allValid = false;
    }

  }

  if (!quantities) {
    return null;
  }

  for (const sides of CUSTOM_DIE_SIDES) {
    const expectedLength = quantities[sides];
    if (expectedLength > 0 && !groupsBySides.has(sides)) {
      issues.push({
        code: "required",
        path: `resultData.groups.${sides}`,
      });
      allValid = false;
    }
  }

  if (!allValid) {
    return null;
  }

  return CUSTOM_DIE_SIDES.flatMap((sides) => {
    const results = groupsBySides.get(sides);
    return results && results.length > 0
      ? [{ sides, results: [...results] }]
      : [];
  });
}

function validateCustomSnapshot(
  envelope: ValidatedEnvelope,
  issues: PersonalRollPersistenceIssue[],
): CustomPersonalRollPersistencePayload | null {
  const quantityValidation = envelope.requestData
    ? validateCustomQuantities(envelope.requestData, issues)
    : { quantities: null, totalItems: null };

  if (!envelope.resultData) {
    return null;
  }

  addUnexpectedFieldIssues(
    envelope.resultData,
    CUSTOM_RESULT_FIELDS,
    "resultData",
    issues,
  );

  const coinResults = validateCoinResults(
    envelope.resultData,
    quantityValidation.quantities?.coin ?? null,
    issues,
  );
  const groups = validateCustomGroups(
    envelope.resultData,
    quantityValidation.quantities,
    issues,
  );

  if (
    issues.length > 0 ||
    !envelope.clientRollId ||
    !envelope.schemaVersionValid ||
    !quantityValidation.quantities ||
    quantityValidation.totalItems === null ||
    !coinResults ||
    !groups
  ) {
    return null;
  }

  const numericDiceTotal = groups.reduce(
    (total, group) =>
      total +
      group.results.reduce(
        (groupTotal, die) => groupTotal + die,
        0,
      ),
    0,
  );
  const headsCount = coinResults.filter(
    (outcome) => outcome === "heads",
  ).length;
  const tailsCount = coinResults.length - headsCount;

  const payload: CustomPersonalRollPersistencePayload = {
    p_client_roll_id: envelope.clientRollId,
    p_roller_kind: "custom_dice_pool",
    p_schema_version: PERSONAL_ROLL_SCHEMA_VERSION,
    p_request_data: {
      quantities: { ...quantityValidation.quantities },
    },
    p_result_data: {
      coinResults: [...coinResults],
      groups: groups.map((group) => ({
        sides: group.sides,
        results: [...group.results],
      })),
      totalItems: quantityValidation.totalItems,
      numericDiceTotal,
      headsCount,
      tailsCount,
    },
  };

  payload satisfies RecordPersonalRollArgs;
  return payload;
}

function mapCocIssue(
  error:
    | Coc7ePercentileValidationError
    | Coc7eOtherDiceValidationError,
): PersonalRollPersistenceIssue {
  const path =
    error.path === "$"
      ? "requestData"
      : `requestData.${error.path}`;

  return {
    code:
      error.code === "invalid-tens-value"
        ? "invalid-die-value"
        : error.code === "unsupported-sides"
          ? "unsupported-die"
          : error.code,
    path,
    ...(error.details ? { details: { ...error.details } } : {}),
  };
}

function copyCoc7ePercentileResult(
  result: Coc7ePercentileTestResult,
): Coc7ePercentilePersonalRollResultData {
  return {
    ...result,
    request: { ...result.request },
    tensDice: [...result.tensDice],
    candidates: [...result.candidates],
  };
}

function validateCoc7ePercentileSnapshot(
  envelope: ValidatedEnvelope,
  issues: PersonalRollPersistenceIssue[],
): Coc7ePercentilePersonalRollPersistencePayload | null {
  if (envelope.resultData) {
    addUnexpectedFieldIssues(
      envelope.resultData,
      COC_PERCENTILE_RESULT_FIELDS,
      "resultData",
      issues,
    );
  }

  if (!envelope.requestData) {
    return null;
  }

  const evaluation = evaluateCoc7ePercentileTest(
    envelope.requestData,
  );
  if (!evaluation.ok) {
    issues.push(...evaluation.errors.map(mapCocIssue));
    return null;
  }

  if (
    issues.length > 0 ||
    !envelope.clientRollId ||
    !envelope.schemaVersionValid
  ) {
    return null;
  }

  const canonicalResult = copyCoc7ePercentileResult(
    evaluation.result,
  );
  const payload: Coc7ePercentilePersonalRollPersistencePayload = {
    p_client_roll_id: envelope.clientRollId,
    p_roller_kind: "coc_7e_percentile",
    p_schema_version: PERSONAL_ROLL_SCHEMA_VERSION,
    p_request_data: {
      request: { ...canonicalResult.request },
      units: canonicalResult.units,
      tensDice: [...canonicalResult.tensDice],
    },
    p_result_data: canonicalResult,
  };

  payload satisfies RecordPersonalRollArgs;
  return payload;
}

function copyCoc7eOtherDiceResult(
  result: Coc7eOtherDiceResult,
): Coc7eOtherDicePersonalRollResultData {
  return {
    ...result,
    request: { ...result.request },
    results: [...result.results],
  };
}

function validateCoc7eOtherDiceSnapshot(
  envelope: ValidatedEnvelope,
  issues: PersonalRollPersistenceIssue[],
): Coc7eOtherDicePersonalRollPersistencePayload | null {
  if (envelope.resultData) {
    addUnexpectedFieldIssues(
      envelope.resultData,
      COC_OTHER_DICE_RESULT_FIELDS,
      "resultData",
      issues,
    );
  }

  if (!envelope.requestData) {
    return null;
  }

  const evaluation = evaluateCoc7eOtherDice(envelope.requestData);
  if (!evaluation.ok) {
    issues.push(...evaluation.errors.map(mapCocIssue));
    return null;
  }

  if (
    issues.length > 0 ||
    !envelope.clientRollId ||
    !envelope.schemaVersionValid
  ) {
    return null;
  }

  const canonicalResult = copyCoc7eOtherDiceResult(
    evaluation.result,
  );
  const payload: Coc7eOtherDicePersonalRollPersistencePayload = {
    p_client_roll_id: envelope.clientRollId,
    p_roller_kind: "coc_7e_other_dice",
    p_schema_version: PERSONAL_ROLL_SCHEMA_VERSION,
    p_request_data: {
      request: { ...canonicalResult.request },
      results: [...canonicalResult.results],
    },
    p_result_data: canonicalResult,
  };

  payload satisfies RecordPersonalRollArgs;
  return payload;
}

/**
 * Personal history is non-authoritative. This pure boundary validates semantic
 * coherence before a later caller invokes the owner-scoped database RPC.
 * Campaign rolls require a separate server-authoritative design.
 */
export function validatePersonalRollForPersistence(
  input: unknown,
): PersonalRollPersistenceValidation {
  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [{ code: "invalid-type", path: "$" }],
    };
  }

  const issues: PersonalRollPersistenceIssue[] = [];
  const envelope = validateEnvelope(input, issues);
  const payload = envelope.rollerKind
    ? PERSONAL_ROLLER_REGISTRY[envelope.rollerKind].validate(
        envelope,
        issues,
      )
    : null;

  if (!payload || issues.length > 0) {
    return {
      ok: false,
      issues: issues.map((issue) => ({
        ...issue,
        ...(issue.details ? { details: { ...issue.details } } : {}),
      })),
    };
  }

  return { ok: true, payload };
}

// Compile-time proof that both payload variants remain RPC-compatible.
type PayloadIsDatabaseReady =
  PersonalRollPersistencePayload extends RecordPersonalRollArgs
    ? true
    : false;
const PAYLOAD_IS_DATABASE_READY: PayloadIsDatabaseReady = true;
void PAYLOAD_IS_DATABASE_READY;
