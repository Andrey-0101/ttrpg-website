import {
  PERSONAL_ROLL_SCHEMA_VERSION,
  validatePersonalRollForPersistence,
  type PersonalRollPersistenceIssue,
  type PersonalRollPersistencePayload,
  type PersonalRollerKind,
} from "./personal-dice-persistence";
import type { Database, Json } from "../../types/database.types";

export const SAVED_CUSTOM_DICE_PRESET_LIMITS = {
  nameCodePoints: 80,
  quantityPerType: 100,
  totalItems: 100,
} as const;

export const SAVED_CUSTOM_DICE_QUANTITY_KEYS = [
  "coin",
  "d4",
  "d6",
  "d8",
  "d10",
  "d12",
  "d20",
  "d100",
] as const;

export type SavedCustomDiceQuantityKey =
  (typeof SAVED_CUSTOM_DICE_QUANTITY_KEYS)[number];

export type SavedCustomDiceQuantities = Record<
  SavedCustomDiceQuantityKey,
  number
>;

export type SavedCustomDicePreset = {
  id: string;
  name: string;
  slot: number;
  quantities: SavedCustomDiceQuantities;
  createdAt: string;
  updatedAt: string;
};

export type PersonalRollHistoryEntry = {
  id: string;
  clientRollId: string;
  rollerKind: PersonalRollerKind;
  schemaVersion: typeof PERSONAL_ROLL_SCHEMA_VERSION;
  requestData: Json;
  resultData: Json;
  sequenceNumber: number;
  createdAt: string;
};

export type PersonalDiceActionErrorCode =
  | "authentication_required"
  | "validation_failed"
  | "preset_limit_reached"
  | "preset_not_found"
  | "preset_name_conflict"
  | "personal_roll_idempotency_conflict"
  | "invalid_persisted_data"
  | "persistence_unavailable"
  | "unexpected_error";

export type PresetValidationIssueCode =
  | "required"
  | "unexpected-field"
  | "invalid-type"
  | "invalid-uuid"
  | "not-finite"
  | "not-integer"
  | "out-of-range"
  | "name-empty"
  | "name-too-long"
  | "pool-empty"
  | "pool-too-large";

export type PresetValidationIssue = {
  code: PresetValidationIssueCode;
  path: string;
  details?: Readonly<Record<string, string | number>>;
};

export type PersonalDiceValidationIssue =
  | PresetValidationIssue
  | PersonalRollPersistenceIssue;

export type PersonalDiceActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        code: PersonalDiceActionErrorCode;
        issues?: readonly PersonalDiceValidationIssue[];
      };
    };

export type CreateSavedCustomDicePresetInput = {
  name: string;
  quantities: SavedCustomDiceQuantities;
};

export type UpdateSavedCustomDicePresetInput =
  CreateSavedCustomDicePresetInput & {
    presetId: string;
  };

export type DeleteSavedCustomDicePresetInput = {
  presetId: string;
};

export type DeletePersonalRollInput = {
  rollId: string;
};

export type PresetInputValidation<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      issues: readonly PresetValidationIssue[];
    };

export type PersonalDiceDatabaseError = {
  code?: unknown;
  message?: unknown;
};

export type PersonalDiceDiagnostic = {
  operation: PersonalDiceOperation;
  errorCode: PersonalDiceActionErrorCode;
  databaseCode?: string;
  recordId?: string;
};

export type PersonalDiceDiagnosticLogger = (
  diagnostic: PersonalDiceDiagnostic,
) => void;

export type PersonalDiceOperation =
  | "list_presets"
  | "create_preset"
  | "update_preset"
  | "delete_preset"
  | "list_history"
  | "record_roll"
  | "delete_roll"
  | "clear_history";

type CustomDicePresetTableRow =
  Database["public"]["Tables"]["custom_dice_presets"]["Row"];
type CustomDicePresetRow = Omit<
  CustomDicePresetTableRow,
  "owner_id"
>;
type PersonalRollHistoryTableRow =
  Database["public"]["Tables"]["personal_roll_history"]["Row"];
type PersonalRollHistoryRow = Omit<
  PersonalRollHistoryTableRow,
  "owner_id"
>;
type CreatePresetArgs =
  Database["public"]["Functions"]["create_custom_dice_preset"]["Args"];
type CreatePresetRow =
  Database["public"]["Functions"]["create_custom_dice_preset"]["Returns"];
type UpdatePresetArgs =
  Database["public"]["Functions"]["update_custom_dice_preset"]["Args"];
type UpdatePresetRow =
  Database["public"]["Functions"]["update_custom_dice_preset"]["Returns"];
type DeletePresetArgs =
  Database["public"]["Functions"]["delete_custom_dice_preset"]["Args"];
type RecordRollArgs =
  Database["public"]["Functions"]["record_personal_roll"]["Args"];
type RecordedRollRow =
  Database["public"]["Functions"]["record_personal_roll"]["Returns"];
type DeleteRollArgs =
  Database["public"]["Functions"]["delete_personal_roll"]["Args"];
type ClearHistoryArgs =
  Database["public"]["Functions"]["clear_personal_roll_history"]["Args"];

export type PersonalDiceDataResponse<T> = {
  data: T | null;
  error: PersonalDiceDatabaseError | null;
};

export type PersonalDicePersistenceDataSource = {
  getAuthenticatedUser(): Promise<
    PersonalDiceDataResponse<{ authenticated: boolean }>
  >;
  listPresetRows(options: {
    orderBy: "slot";
    ascending: true;
  }): Promise<PersonalDiceDataResponse<CustomDicePresetRow[]>>;
  createPreset(
    args: CreatePresetArgs,
  ): Promise<PersonalDiceDataResponse<CreatePresetRow>>;
  updatePreset(
    args: UpdatePresetArgs,
  ): Promise<PersonalDiceDataResponse<UpdatePresetRow>>;
  deletePreset(
    args: DeletePresetArgs,
  ): Promise<PersonalDiceDataResponse<boolean>>;
  listHistoryRows(options: {
    orderBy: "sequence_number";
    ascending: false;
    limit: 11;
  }): Promise<PersonalDiceDataResponse<PersonalRollHistoryRow[]>>;
  recordRoll(
    args: RecordRollArgs,
  ): Promise<PersonalDiceDataResponse<RecordedRollRow>>;
  deleteRoll(
    args: DeleteRollArgs,
  ): Promise<PersonalDiceDataResponse<boolean>>;
  clearHistory(): Promise<PersonalDiceDataResponse<number>>;
};

type UnknownRecord = Record<string, unknown>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const CREATE_PRESET_FIELDS = new Set(["name", "quantities"]);
const UPDATE_PRESET_FIELDS = new Set([
  "presetId",
  "name",
  "quantities",
]);
const DELETE_PRESET_FIELDS = new Set(["presetId"]);
const DELETE_ROLL_FIELDS = new Set(["rollId"]);
const QUANTITY_FIELDS = new Set(SAVED_CUSTOM_DICE_QUANTITY_KEYS);
const DATABASE_ERROR_CODES = new Set<PersonalDiceActionErrorCode>([
  "authentication_required",
  "preset_limit_reached",
  "preset_not_found",
  "preset_name_conflict",
  "personal_roll_idempotency_conflict",
]);

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
  issues: PresetValidationIssue[],
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

function validateUuidField(
  value: UnknownRecord,
  key: string,
  path: string,
  issues: PresetValidationIssue[],
): string | null {
  if (!hasOwn(value, key)) {
    issues.push({ code: "required", path });
    return null;
  }

  const candidate = value[key];
  if (typeof candidate !== "string") {
    issues.push({ code: "invalid-type", path });
    return null;
  }

  if (!UUID_PATTERN.test(candidate)) {
    issues.push({ code: "invalid-uuid", path });
    return null;
  }

  return candidate.toLowerCase();
}

function normalizePresetName(
  value: UnknownRecord,
  issues: PresetValidationIssue[],
): string | null {
  if (!hasOwn(value, "name")) {
    issues.push({ code: "required", path: "name" });
    return null;
  }

  if (typeof value.name !== "string") {
    issues.push({ code: "invalid-type", path: "name" });
    return null;
  }

  const normalized = value.name.trim().replace(/\s+/gu, " ");
  const codePointLength = [...normalized].length;

  if (codePointLength === 0) {
    issues.push({ code: "name-empty", path: "name" });
    return null;
  }

  if (codePointLength > SAVED_CUSTOM_DICE_PRESET_LIMITS.nameCodePoints) {
    issues.push({
      code: "name-too-long",
      path: "name",
      details: {
        maximum: SAVED_CUSTOM_DICE_PRESET_LIMITS.nameCodePoints,
      },
    });
    return null;
  }

  return normalized;
}

function validatePresetQuantities(
  value: UnknownRecord,
  issues: PresetValidationIssue[],
): SavedCustomDiceQuantities | null {
  if (!hasOwn(value, "quantities")) {
    issues.push({ code: "required", path: "quantities" });
    return null;
  }

  if (!isRecord(value.quantities)) {
    issues.push({ code: "invalid-type", path: "quantities" });
    return null;
  }

  const quantityInput = value.quantities;
  const quantities = {} as SavedCustomDiceQuantities;
  let allValid = true;
  let totalItems = 0;

  for (const key of SAVED_CUSTOM_DICE_QUANTITY_KEYS) {
    const path = `quantities.${key}`;
    if (!hasOwn(quantityInput, key)) {
      issues.push({ code: "required", path });
      allValid = false;
      continue;
    }

    const quantity = quantityInput[key];
    if (typeof quantity !== "number") {
      issues.push({ code: "invalid-type", path });
      allValid = false;
      continue;
    }

    if (!Number.isFinite(quantity)) {
      issues.push({ code: "not-finite", path });
      allValid = false;
      continue;
    }

    if (!Number.isInteger(quantity)) {
      issues.push({ code: "not-integer", path });
      allValid = false;
      continue;
    }

    if (
      quantity < 0 ||
      quantity > SAVED_CUSTOM_DICE_PRESET_LIMITS.quantityPerType
    ) {
      issues.push({
        code: "out-of-range",
        path,
        details: {
          minimum: 0,
          maximum:
            SAVED_CUSTOM_DICE_PRESET_LIMITS.quantityPerType,
        },
      });
      allValid = false;
      continue;
    }

    quantities[key] = quantity;
    totalItems += quantity;
  }

  addUnexpectedFieldIssues(
    quantityInput,
    QUANTITY_FIELDS,
    "quantities",
    issues,
  );

  if (!allValid) {
    return null;
  }

  if (totalItems === 0) {
    issues.push({ code: "pool-empty", path: "quantities" });
    return null;
  }

  if (totalItems > SAVED_CUSTOM_DICE_PRESET_LIMITS.totalItems) {
    issues.push({
      code: "pool-too-large",
      path: "quantities",
      details: {
        maximum: SAVED_CUSTOM_DICE_PRESET_LIMITS.totalItems,
      },
    });
    return null;
  }

  return { ...quantities };
}

function validatePresetInput(
  input: unknown,
  allowedFields: ReadonlySet<string>,
  includePresetId: boolean,
): PresetInputValidation<
  CreateSavedCustomDicePresetInput | UpdateSavedCustomDicePresetInput
> {
  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [{ code: "invalid-type", path: "$" }],
    };
  }

  const issues: PresetValidationIssue[] = [];
  const presetId = includePresetId
    ? validateUuidField(
        input,
        "presetId",
        "presetId",
        issues,
      )
    : null;
  const name = normalizePresetName(input, issues);
  const quantities = validatePresetQuantities(input, issues);
  addUnexpectedFieldIssues(input, allowedFields, "$", issues);

  if (
    issues.length > 0 ||
    !name ||
    !quantities ||
    (includePresetId && !presetId)
  ) {
    return {
      ok: false,
      issues: issues.map(copyValidationIssue),
    };
  }

  const base = {
    name,
    quantities: { ...quantities },
  };

  return includePresetId
    ? {
        ok: true,
        value: {
          presetId: presetId!,
          ...base,
        },
      }
    : { ok: true, value: base };
}

function copyValidationIssue<
  T extends PersonalDiceValidationIssue,
>(issue: T): T {
  return {
    ...issue,
    ...(issue.details ? { details: { ...issue.details } } : {}),
  };
}

export function validateCreateSavedCustomDicePresetInput(
  input: unknown,
): PresetInputValidation<CreateSavedCustomDicePresetInput> {
  return validatePresetInput(
    input,
    CREATE_PRESET_FIELDS,
    false,
  ) as PresetInputValidation<CreateSavedCustomDicePresetInput>;
}

export function validateUpdateSavedCustomDicePresetInput(
  input: unknown,
): PresetInputValidation<UpdateSavedCustomDicePresetInput> {
  return validatePresetInput(
    input,
    UPDATE_PRESET_FIELDS,
    true,
  ) as PresetInputValidation<UpdateSavedCustomDicePresetInput>;
}

function validateDeleteInput<Key extends "presetId" | "rollId">(
  input: unknown,
  key: Key,
  allowedFields: ReadonlySet<string>,
): PresetInputValidation<Record<Key, string>> {
  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [{ code: "invalid-type", path: "$" }],
    };
  }

  const issues: PresetValidationIssue[] = [];
  const id = validateUuidField(input, key, key, issues);
  addUnexpectedFieldIssues(input, allowedFields, "$", issues);

  if (!id || issues.length > 0) {
    return {
      ok: false,
      issues: issues.map(copyValidationIssue),
    };
  }

  return {
    ok: true,
    value: { [key]: id } as Record<Key, string>,
  };
}

export function validateDeleteSavedCustomDicePresetInput(
  input: unknown,
): PresetInputValidation<DeleteSavedCustomDicePresetInput> {
  return validateDeleteInput(
    input,
    "presetId",
    DELETE_PRESET_FIELDS,
  );
}

export function validateDeletePersonalRollInput(
  input: unknown,
): PresetInputValidation<DeletePersonalRollInput> {
  return validateDeleteInput(
    input,
    "rollId",
    DELETE_ROLL_FIELDS,
  );
}

function readOwnString(
  value: UnknownRecord,
  key: string,
): string | null {
  return hasOwn(value, key) && typeof value[key] === "string"
    ? value[key]
    : null;
}

function readOwnInteger(
  value: UnknownRecord,
  key: string,
): number | null {
  const candidate = value[key];
  return (
    hasOwn(value, key) &&
    typeof candidate === "number" &&
    Number.isFinite(candidate) &&
    Number.isSafeInteger(candidate)
  )
    ? candidate
    : null;
}

export function mapSavedCustomDicePresetRow(
  input: unknown,
): SavedCustomDicePreset | null {
  if (!isRecord(input)) {
    return null;
  }

  const id = readOwnString(input, "id");
  const name = readOwnString(input, "name");
  const slot = readOwnInteger(input, "slot");
  const createdAt = readOwnString(input, "created_at");
  const updatedAt = readOwnString(input, "updated_at");
  const quantityInput = {
    coin: readOwnInteger(input, "coin_quantity"),
    d4: readOwnInteger(input, "d4_quantity"),
    d6: readOwnInteger(input, "d6_quantity"),
    d8: readOwnInteger(input, "d8_quantity"),
    d10: readOwnInteger(input, "d10_quantity"),
    d12: readOwnInteger(input, "d12_quantity"),
    d20: readOwnInteger(input, "d20_quantity"),
    d100: readOwnInteger(input, "d100_quantity"),
  };

  if (
    !id ||
    !UUID_PATTERN.test(id) ||
    !name ||
    slot === null ||
    slot < 1 ||
    slot > 5 ||
    !createdAt ||
    !updatedAt ||
    Object.values(quantityInput).some((quantity) => quantity === null)
  ) {
    return null;
  }

  const presetValidation =
    validateCreateSavedCustomDicePresetInput({
      name,
      quantities: quantityInput,
    });

  if (
    !presetValidation.ok ||
    presetValidation.value.name !== name
  ) {
    return null;
  }

  return {
    id: id.toLowerCase(),
    name,
    slot,
    quantities: { ...presetValidation.value.quantities },
    createdAt,
    updatedAt,
  };
}

function isJsonDeepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) =>
        isJsonDeepEqual(value, right[index]),
      )
    );
  }

  if (!isRecord(left) || !isRecord(right)) {
    return false;
  }

  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] &&
        hasOwn(right, key) &&
        isJsonDeepEqual(left[key], right[key]),
    )
  );
}

export function mapPersonalRollHistoryRow(
  input: unknown,
): PersonalRollHistoryEntry | null {
  if (!isRecord(input)) {
    return null;
  }

  const id = readOwnString(input, "id");
  const clientRollId = readOwnString(input, "client_roll_id");
  const rollerKind = readOwnString(input, "roller_kind");
  const schemaVersion = readOwnInteger(input, "schema_version");
  const sequenceNumber = readOwnInteger(input, "sequence_number");
  const createdAt = readOwnString(input, "created_at");

  if (
    !id ||
    !UUID_PATTERN.test(id) ||
    !clientRollId ||
    !isRecord(input.request_data) ||
    !isRecord(input.result_data) ||
    sequenceNumber === null ||
    sequenceNumber < 1 ||
    !createdAt
  ) {
    return null;
  }

  const validation = validatePersonalRollForPersistence({
    clientRollId,
    rollerKind,
    schemaVersion,
    requestData: input.request_data,
    resultData: input.result_data,
  });

  if (
    !validation.ok ||
    validation.payload.p_client_roll_id !==
      clientRollId.toLowerCase() ||
    !isJsonDeepEqual(
      input.request_data,
      validation.payload.p_request_data,
    ) ||
    !isJsonDeepEqual(
      input.result_data,
      validation.payload.p_result_data,
    )
  ) {
    return null;
  }

  return {
    id: id.toLowerCase(),
    clientRollId: validation.payload.p_client_roll_id,
    rollerKind: validation.payload.p_roller_kind,
    schemaVersion: validation.payload.p_schema_version,
    requestData: validation.payload.p_request_data as Json,
    resultData: validation.payload.p_result_data as Json,
    sequenceNumber,
    createdAt,
  };
}

function safeDatabaseCode(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  const code = readOwnString(error, "code");
  return code && code.length <= 40 ? code : undefined;
}

function safeDatabaseMessage(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  const message = readOwnString(error, "message");
  return message && message.length <= 80 ? message : undefined;
}

export function mapPersonalDiceDatabaseError(
  error: unknown,
): PersonalDiceActionErrorCode {
  const message = safeDatabaseMessage(error);
  if (
    message &&
    DATABASE_ERROR_CODES.has(
      message as PersonalDiceActionErrorCode,
    )
  ) {
    return message as PersonalDiceActionErrorCode;
  }

  const code = safeDatabaseCode(error);
  if (
    code === "PGRST000" ||
    code === "PGRST001" ||
    code === "PGRST002" ||
    code === "PGRST003"
  ) {
    return "persistence_unavailable";
  }

  return "unexpected_error";
}

function defaultDiagnosticLogger(
  diagnostic: PersonalDiceDiagnostic,
): void {
  console.error("Personal dice persistence operation failed", {
    operation: diagnostic.operation,
    errorCode: diagnostic.errorCode,
    ...(diagnostic.databaseCode
      ? { databaseCode: diagnostic.databaseCode }
      : {}),
    ...(diagnostic.recordId
      ? { recordId: diagnostic.recordId }
      : {}),
  });
}

function failure(
  code: PersonalDiceActionErrorCode,
  issues?: readonly PersonalDiceValidationIssue[],
): PersonalDiceActionResult<never> {
  return {
    ok: false,
    error: {
      code,
      ...(issues
        ? { issues: issues.map(copyValidationIssue) }
        : {}),
    },
  };
}

function dataFailure(
  operation: PersonalDiceOperation,
  error: unknown,
  logger: PersonalDiceDiagnosticLogger,
): PersonalDiceActionResult<never> {
  const errorCode = mapPersonalDiceDatabaseError(error);
  logger({
    operation,
    errorCode,
    ...(safeDatabaseCode(error)
      ? { databaseCode: safeDatabaseCode(error) }
      : {}),
  });
  return failure(errorCode);
}

function unavailableFailure(
  operation: PersonalDiceOperation,
  logger: PersonalDiceDiagnosticLogger,
): PersonalDiceActionResult<never> {
  logger({ operation, errorCode: "persistence_unavailable" });
  return failure("persistence_unavailable");
}

function invalidPersistedDataFailure(
  operation: PersonalDiceOperation,
  logger: PersonalDiceDiagnosticLogger,
  recordId?: string,
): PersonalDiceActionResult<never> {
  logger({
    operation,
    errorCode: "invalid_persisted_data",
    ...(recordId && UUID_PATTERN.test(recordId)
      ? { recordId: recordId.toLowerCase() }
      : {}),
  });
  return failure("invalid_persisted_data");
}

async function authenticate(
  source: PersonalDicePersistenceDataSource,
  operation: PersonalDiceOperation,
  logger: PersonalDiceDiagnosticLogger,
): Promise<PersonalDiceActionResult<true>> {
  try {
    const response = await source.getAuthenticatedUser();
    if (response.error || !response.data?.authenticated) {
      logger({
        operation,
        errorCode: "authentication_required",
        ...(safeDatabaseCode(response.error)
          ? { databaseCode: safeDatabaseCode(response.error) }
          : {}),
      });
      return failure("authentication_required");
    }

    return { ok: true, data: true };
  } catch {
    logger({
      operation,
      errorCode: "authentication_required",
    });
    return failure("authentication_required");
  }
}

function createPresetArgs(
  input: CreateSavedCustomDicePresetInput,
): CreatePresetArgs {
  return {
    p_name: input.name,
    p_coin_quantity: input.quantities.coin,
    p_d4_quantity: input.quantities.d4,
    p_d6_quantity: input.quantities.d6,
    p_d8_quantity: input.quantities.d8,
    p_d10_quantity: input.quantities.d10,
    p_d12_quantity: input.quantities.d12,
    p_d20_quantity: input.quantities.d20,
    p_d100_quantity: input.quantities.d100,
  } satisfies CreatePresetArgs;
}

function updatePresetArgs(
  input: UpdateSavedCustomDicePresetInput,
): UpdatePresetArgs {
  return {
    p_preset_id: input.presetId,
    ...createPresetArgs(input),
  } satisfies UpdatePresetArgs;
}

export type PersonalDicePersistenceService = ReturnType<
  typeof createPersonalDicePersistenceService
>;

export async function runPersonalDicePersistenceOperation<T>(
  operation: PersonalDiceOperation,
  createService: () => Promise<PersonalDicePersistenceService>,
  run: (
    service: PersonalDicePersistenceService,
  ) => Promise<PersonalDiceActionResult<T>>,
  logger: PersonalDiceDiagnosticLogger = defaultDiagnosticLogger,
): Promise<PersonalDiceActionResult<T>> {
  try {
    const service = await createService();
    return await run(service);
  } catch {
    logger({
      operation,
      errorCode: "persistence_unavailable",
    });
    return failure("persistence_unavailable");
  }
}

export function createPersonalDicePersistenceService(
  source: PersonalDicePersistenceDataSource,
  logger: PersonalDiceDiagnosticLogger = defaultDiagnosticLogger,
) {
  return {
    async listSavedCustomDicePresets(): Promise<
      PersonalDiceActionResult<SavedCustomDicePreset[]>
    > {
      const operation = "list_presets" as const;
      const authentication = await authenticate(
        source,
        operation,
        logger,
      );
      if (!authentication.ok) return authentication;

      try {
        const response = await source.listPresetRows({
          orderBy: "slot",
          ascending: true,
        });
        if (response.error) {
          return dataFailure(operation, response.error, logger);
        }
        if (!response.data) {
          return unavailableFailure(operation, logger);
        }

        const presets: SavedCustomDicePreset[] = [];
        for (const row of response.data) {
          const preset = mapSavedCustomDicePresetRow(row);
          if (!preset) {
            return invalidPersistedDataFailure(
              operation,
              logger,
              isRecord(row) ? readOwnString(row, "id") ?? undefined : undefined,
            );
          }
          presets.push(preset);
        }

        return { ok: true, data: presets };
      } catch {
        return unavailableFailure(operation, logger);
      }
    },

    async createSavedCustomDicePreset(
      input: unknown,
    ): Promise<PersonalDiceActionResult<SavedCustomDicePreset>> {
      const operation = "create_preset" as const;
      const authentication = await authenticate(
        source,
        operation,
        logger,
      );
      if (!authentication.ok) return authentication;

      const validation =
        validateCreateSavedCustomDicePresetInput(input);
      if (!validation.ok) {
        return failure("validation_failed", validation.issues);
      }

      try {
        const response = await source.createPreset(
          createPresetArgs(validation.value),
        );
        if (response.error) {
          return dataFailure(operation, response.error, logger);
        }

        const preset = mapSavedCustomDicePresetRow(response.data);
        return preset
          ? { ok: true, data: preset }
          : invalidPersistedDataFailure(operation, logger);
      } catch {
        return unavailableFailure(operation, logger);
      }
    },

    async updateSavedCustomDicePreset(
      input: unknown,
    ): Promise<PersonalDiceActionResult<SavedCustomDicePreset>> {
      const operation = "update_preset" as const;
      const authentication = await authenticate(
        source,
        operation,
        logger,
      );
      if (!authentication.ok) return authentication;

      const validation =
        validateUpdateSavedCustomDicePresetInput(input);
      if (!validation.ok) {
        return failure("validation_failed", validation.issues);
      }

      try {
        const response = await source.updatePreset(
          updatePresetArgs(validation.value),
        );
        if (response.error) {
          return dataFailure(operation, response.error, logger);
        }

        const preset = mapSavedCustomDicePresetRow(response.data);
        return preset
          ? { ok: true, data: preset }
          : invalidPersistedDataFailure(operation, logger);
      } catch {
        return unavailableFailure(operation, logger);
      }
    },

    async deleteSavedCustomDicePreset(
      input: unknown,
    ): Promise<PersonalDiceActionResult<{ deleted: true }>> {
      const operation = "delete_preset" as const;
      const authentication = await authenticate(
        source,
        operation,
        logger,
      );
      if (!authentication.ok) return authentication;

      const validation =
        validateDeleteSavedCustomDicePresetInput(input);
      if (!validation.ok) {
        return failure("validation_failed", validation.issues);
      }

      const args = {
        p_preset_id: validation.value.presetId,
      } satisfies DeletePresetArgs;

      try {
        const response = await source.deletePreset(args);
        if (response.error) {
          return dataFailure(operation, response.error, logger);
        }
        if (typeof response.data !== "boolean") {
          return invalidPersistedDataFailure(operation, logger);
        }

        return { ok: true, data: { deleted: true } };
      } catch {
        return unavailableFailure(operation, logger);
      }
    },

    async listPersonalRollHistory(): Promise<
      PersonalDiceActionResult<PersonalRollHistoryEntry[]>
    > {
      const operation = "list_history" as const;
      const authentication = await authenticate(
        source,
        operation,
        logger,
      );
      if (!authentication.ok) return authentication;

      try {
        const response = await source.listHistoryRows({
          orderBy: "sequence_number",
          ascending: false,
          limit: 11,
        });
        if (response.error) {
          return dataFailure(operation, response.error, logger);
        }
        if (!response.data) {
          return unavailableFailure(operation, logger);
        }

        const history: PersonalRollHistoryEntry[] = [];
        for (const row of response.data) {
          const entry = mapPersonalRollHistoryRow(row);
          if (!entry) {
            return invalidPersistedDataFailure(
              operation,
              logger,
              isRecord(row) ? readOwnString(row, "id") ?? undefined : undefined,
            );
          }
          history.push(entry);
        }

        return { ok: true, data: history };
      } catch {
        return unavailableFailure(operation, logger);
      }
    },

    async recordPersonalRoll(
      input: unknown,
    ): Promise<PersonalDiceActionResult<PersonalRollHistoryEntry>> {
      const operation = "record_roll" as const;
      const authentication = await authenticate(
        source,
        operation,
        logger,
      );
      if (!authentication.ok) return authentication;

      const validation =
        validatePersonalRollForPersistence(input);
      if (!validation.ok) {
        return failure("validation_failed", validation.issues);
      }

      const payload: PersonalRollPersistencePayload =
        validation.payload;
      const args = {
        p_client_roll_id: payload.p_client_roll_id,
        p_roller_kind: payload.p_roller_kind,
        p_schema_version: payload.p_schema_version,
        p_request_data: payload.p_request_data,
        p_result_data: payload.p_result_data,
      } satisfies RecordRollArgs;

      try {
        const response = await source.recordRoll(args);
        if (response.error) {
          return dataFailure(operation, response.error, logger);
        }

        const entry = mapPersonalRollHistoryRow(response.data);
        return entry
          ? { ok: true, data: entry }
          : invalidPersistedDataFailure(operation, logger);
      } catch {
        return unavailableFailure(operation, logger);
      }
    },

    async deletePersonalRoll(
      input: unknown,
    ): Promise<PersonalDiceActionResult<{ deleted: true }>> {
      const operation = "delete_roll" as const;
      const authentication = await authenticate(
        source,
        operation,
        logger,
      );
      if (!authentication.ok) return authentication;

      const validation = validateDeletePersonalRollInput(input);
      if (!validation.ok) {
        return failure("validation_failed", validation.issues);
      }

      const args = {
        p_roll_id: validation.value.rollId,
      } satisfies DeleteRollArgs;

      try {
        const response = await source.deleteRoll(args);
        if (response.error) {
          return dataFailure(operation, response.error, logger);
        }
        if (typeof response.data !== "boolean") {
          return invalidPersistedDataFailure(operation, logger);
        }

        return { ok: true, data: { deleted: true } };
      } catch {
        return unavailableFailure(operation, logger);
      }
    },

    async clearPersonalRollHistory(): Promise<
      PersonalDiceActionResult<{ deletedCount: number }>
    > {
      const operation = "clear_history" as const;
      const authentication = await authenticate(
        source,
        operation,
        logger,
      );
      if (!authentication.ok) return authentication;

      try {
        const response = await source.clearHistory();
        if (response.error) {
          return dataFailure(operation, response.error, logger);
        }
        if (
          typeof response.data !== "number" ||
          !Number.isSafeInteger(response.data) ||
          response.data < 0
        ) {
          return invalidPersistedDataFailure(operation, logger);
        }

        return {
          ok: true,
          data: { deletedCount: response.data },
        };
      } catch {
        return unavailableFailure(operation, logger);
      }
    },
  };
}

// Generated types express a no-argument RPC as `Args: never`.
type ClearHistoryHasNoArguments =
  [ClearHistoryArgs] extends [never] ? true : false;
const CLEAR_HISTORY_HAS_NO_ARGUMENTS: ClearHistoryHasNoArguments =
  true;
void CLEAR_HISTORY_HAS_NO_ARGUMENTS;
