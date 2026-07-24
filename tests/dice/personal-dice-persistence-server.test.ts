import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  createPersonalDicePersistenceService,
  mapPersonalDiceDatabaseError,
  mapPersonalRollHistoryRow,
  mapSavedCustomDicePresetRow,
  runPersonalDicePersistenceOperation,
  validateCreateSavedCustomDicePresetInput,
  validateDeletePersonalRollInput,
  validateDeleteSavedCustomDicePresetInput,
  validateUpdateSavedCustomDicePresetInput,
  type PersonalDiceActionResult,
  type PersonalDiceDiagnostic,
  type PersonalDicePersistenceDataSource,
  type SavedCustomDiceQuantities,
} from "../../lib/dice/personal-dice-persistence-service";
import {
  validatePersonalRollForPersistence,
  type PersonalRollPersistencePayload,
} from "../../lib/dice/personal-dice-persistence";

const OWNER_ID = "10000000-0000-4000-8000-000000000001";
const PRESET_ID = "20000000-0000-4000-8000-000000000001";
const ROLL_ID = "30000000-0000-4000-8000-000000000001";
const CLIENT_ROLL_ID = "40000000-0000-4000-8000-000000000001";
const CREATED_AT = "2026-07-24T10:00:00.000Z";
const UPDATED_AT = "2026-07-24T10:05:00.000Z";

type FakeCall = {
  method: string;
  value?: unknown;
};

function emptySavedQuantities(): SavedCustomDiceQuantities {
  return {
    coin: 0,
    d4: 0,
    d6: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
    d100: 0,
  };
}

function validPresetInput() {
  return {
    name: "  Mixed \t Pool  ",
    quantities: {
      ...emptySavedQuantities(),
      coin: 2,
      d6: 3,
      d100: 1,
    },
  };
}

function presetRow() {
  return {
    id: PRESET_ID,
    owner_id: OWNER_ID,
    name: "Mixed Pool",
    slot: 2,
    coin_quantity: 2,
    d4_quantity: 0,
    d6_quantity: 3,
    d8_quantity: 0,
    d10_quantity: 0,
    d12_quantity: 0,
    d20_quantity: 0,
    d100_quantity: 1,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  };
}

function validVtmCandidate() {
  return {
    clientRollId: CLIENT_ROLL_ID,
    rollerKind: "vtm_v5",
    schemaVersion: 1,
    requestData: {
      request: {
        pool: 4,
        hungerDice: 2,
        difficulty: 3,
        label: "Test roll",
      },
      normalDice: [10, 6],
      hungerDiceResults: [10, 1],
    },
    resultData: {
      totalSuccesses: 999,
      margin: -999,
      isSuccess: false,
      isMessyCritical: false,
      isBestialFailure: true,
    },
  };
}

function validCustomCandidate() {
  return {
    clientRollId: CLIENT_ROLL_ID,
    rollerKind: "custom_dice_pool",
    schemaVersion: 1,
    requestData: {
      quantities: {
        coin: 2,
        4: 0,
        6: 2,
        8: 0,
        10: 0,
        12: 0,
        20: 0,
        100: 0,
      },
    },
    resultData: {
      quantities: { coin: 99 },
      coinResults: ["heads", "tails"],
      groups: [{ sides: 6, results: [1, 6] }],
      totalItems: 999,
      numericDiceTotal: 999,
      headsCount: 999,
      tailsCount: 0,
    },
  };
}

function canonicalPayload(
  candidate: unknown,
): PersonalRollPersistencePayload {
  const validation = validatePersonalRollForPersistence(candidate);
  assert.equal(
    validation.ok,
    true,
    validation.ok ? undefined : JSON.stringify(validation.issues),
  );
  return validation.payload;
}

function historyRow(
  candidate: unknown = validVtmCandidate(),
) {
  const payload = canonicalPayload(candidate);
  return {
    id: ROLL_ID,
    owner_id: OWNER_ID,
    client_roll_id: payload.p_client_roll_id,
    roller_kind: payload.p_roller_kind,
    schema_version: payload.p_schema_version,
    request_data: payload.p_request_data,
    result_data: payload.p_result_data,
    sequence_number: 42,
    created_at: CREATED_AT,
  };
}

function createFakeDataSource(
  overrides: Partial<PersonalDicePersistenceDataSource> = {},
) {
  const calls: FakeCall[] = [];
  const source: PersonalDicePersistenceDataSource = {
    async getAuthenticatedUser() {
      calls.push({ method: "getAuthenticatedUser" });
      return {
        data: { authenticated: true },
        error: null,
      };
    },
    async listPresetRows(options) {
      calls.push({ method: "listPresetRows", value: options });
      const row = presetRow();
      return { data: [row], error: null };
    },
    async createPreset(args) {
      calls.push({ method: "createPreset", value: args });
      return { data: presetRow(), error: null };
    },
    async updatePreset(args) {
      calls.push({ method: "updatePreset", value: args });
      return { data: presetRow(), error: null };
    },
    async deletePreset(args) {
      calls.push({ method: "deletePreset", value: args });
      return { data: true, error: null };
    },
    async listHistoryRows(options) {
      calls.push({ method: "listHistoryRows", value: options });
      return { data: [historyRow()], error: null };
    },
    async recordRoll(args) {
      calls.push({ method: "recordRoll", value: args });
      return { data: historyRow(), error: null };
    },
    async deleteRoll(args) {
      calls.push({ method: "deleteRoll", value: args });
      return { data: true, error: null };
    },
    async clearHistory() {
      calls.push({ method: "clearHistory" });
      return { data: 3, error: null };
    },
    ...overrides,
  };

  return { source, calls };
}

function requireSuccess<T>(
  result: PersonalDiceActionResult<T>,
): T {
  assert.equal(
    result.ok,
    true,
    result.ok ? undefined : JSON.stringify(result.error),
  );
  return result.data;
}

function requireFailure<T>(
  result: PersonalDiceActionResult<T>,
) {
  assert.equal(result.ok, false);
  return result.error;
}

test("create preset validation normalizes the complete contract", () => {
  const input = validPresetInput();
  const validation =
    validateCreateSavedCustomDicePresetInput(input);

  assert.equal(validation.ok, true);
  assert.deepEqual(validation.value, {
    name: "Mixed Pool",
    quantities: {
      coin: 2,
      d4: 0,
      d6: 3,
      d8: 0,
      d10: 0,
      d12: 0,
      d20: 0,
      d100: 1,
    },
  });

  input.quantities.coin = 0;
  assert.equal(validation.value.quantities.coin, 2);
});

test("preset validation rejects malformed and inherited-only input", () => {
  for (const input of [null, [], "preset", 1, true]) {
    const validation =
      validateCreateSavedCustomDicePresetInput(input);
    assert.equal(validation.ok, false);
    assert.deepEqual(validation.issues, [
      { code: "invalid-type", path: "$" },
    ]);
  }

  const inherited = Object.create(validPresetInput());
  const validation =
    validateCreateSavedCustomDicePresetInput(inherited);
  assert.equal(validation.ok, false);
  assert.deepEqual(
    validation.issues.map(({ code, path }) => ({ code, path })),
    [
      { code: "required", path: "name" },
      { code: "required", path: "quantities" },
    ],
  );
});

test("preset validation rejects missing and extra fields stably", () => {
  const input = validPresetInput() as ReturnType<
    typeof validPresetInput
  > & {
    zExtra: boolean;
    aExtra: boolean;
  };
  const quantities = input.quantities as Record<string, number>;
  delete quantities.d8;
  quantities.d2 = 1;
  input.zExtra = true;
  input.aExtra = true;

  const validation =
    validateCreateSavedCustomDicePresetInput(input);
  assert.equal(validation.ok, false);
  assert.deepEqual(
    validation.issues.map(({ code, path }) => ({ code, path })),
    [
      { code: "required", path: "quantities.d8" },
      { code: "unexpected-field", path: "quantities.d2" },
      { code: "unexpected-field", path: "$.aExtra" },
      { code: "unexpected-field", path: "$.zExtra" },
    ],
  );
});

test("preset quantities reject coercion and invalid numbers", () => {
  const input = validPresetInput();
  const quantities = input.quantities as Record<string, unknown>;
  quantities.coin = "2";
  quantities.d4 = Number.NaN;
  quantities.d6 = Number.POSITIVE_INFINITY;
  quantities.d8 = -1;
  quantities.d10 = 1.5;
  quantities.d12 = 101;

  const validation =
    validateCreateSavedCustomDicePresetInput(input);
  assert.equal(validation.ok, false);
  assert.deepEqual(
    validation.issues.map(({ code, path }) => ({ code, path })),
    [
      { code: "invalid-type", path: "quantities.coin" },
      { code: "not-finite", path: "quantities.d4" },
      { code: "not-finite", path: "quantities.d6" },
      { code: "out-of-range", path: "quantities.d8" },
      { code: "not-integer", path: "quantities.d10" },
      { code: "out-of-range", path: "quantities.d12" },
    ],
  );
});

test("preset validation enforces name and combined pool limits", () => {
  const empty = validPresetInput();
  empty.quantities = emptySavedQuantities();
  const emptyValidation =
    validateCreateSavedCustomDicePresetInput(empty);
  assert.equal(emptyValidation.ok, false);
  assert.deepEqual(emptyValidation.issues, [
    { code: "pool-empty", path: "quantities" },
  ]);

  const over = validPresetInput();
  over.quantities = {
    ...emptySavedQuantities(),
    coin: 100,
    d4: 1,
  };
  const overValidation =
    validateCreateSavedCustomDicePresetInput(over);
  assert.equal(overValidation.ok, false);
  assert.deepEqual(
    overValidation.issues.map(({ code, path }) => ({
      code,
      path,
    })),
    [{ code: "pool-too-large", path: "quantities" }],
  );

  const emptyName = validPresetInput();
  emptyName.name = " \t\n ";
  assert.equal(
    validateCreateSavedCustomDicePresetInput(emptyName).ok,
    false,
  );

  const longName = validPresetInput();
  longName.name = "😀".repeat(81);
  const longValidation =
    validateCreateSavedCustomDicePresetInput(longName);
  assert.equal(longValidation.ok, false);
  assert.deepEqual(
    longValidation.issues.map(({ code, path }) => ({
      code,
      path,
    })),
    [{ code: "name-too-long", path: "name" }],
  );

  const exactUnicodeName = validPresetInput();
  exactUnicodeName.name = "😀".repeat(80);
  const exactUnicodeValidation =
    validateCreateSavedCustomDicePresetInput(exactUnicodeName);
  assert.equal(exactUnicodeValidation.ok, true);
  assert.equal(
    [...exactUnicodeValidation.value.name].length,
    80,
  );
});

test("update and delete validators require canonical UUID input", () => {
  const update = validateUpdateSavedCustomDicePresetInput({
    presetId: PRESET_ID.toUpperCase(),
    ...validPresetInput(),
  });
  assert.equal(update.ok, true);
  assert.equal(update.value.presetId, PRESET_ID);

  const invalidUpdate =
    validateUpdateSavedCustomDicePresetInput({
      presetId: "not-a-uuid",
      ...validPresetInput(),
    });
  assert.equal(invalidUpdate.ok, false);
  assert.deepEqual(
    invalidUpdate.issues.map(({ code, path }) => ({
      code,
      path,
    })),
    [{ code: "invalid-uuid", path: "presetId" }],
  );

  assert.equal(
    validateDeleteSavedCustomDicePresetInput({
      presetId: PRESET_ID,
    }).ok,
    true,
  );
  assert.equal(
    validateDeletePersonalRollInput({ rollId: ROLL_ID }).ok,
    true,
  );
});

test("preset row mapping strips owner identity and copies values", () => {
  const row = presetRow();
  const mapped = mapSavedCustomDicePresetRow(row);
  assert.ok(mapped);
  assert.equal("owner_id" in mapped, false);
  assert.deepEqual(mapped, {
    id: PRESET_ID,
    name: "Mixed Pool",
    slot: 2,
    quantities: {
      coin: 2,
      d4: 0,
      d6: 3,
      d8: 0,
      d10: 0,
      d12: 0,
      d20: 0,
      d100: 1,
    },
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  });

  row.coin_quantity = 0;
  mapped.quantities.coin = 99;
  assert.equal(mapped.quantities.coin, 99);
  assert.equal(row.coin_quantity, 0);
});

test("preset row mapping rejects non-canonical persisted data", () => {
  assert.equal(
    mapSavedCustomDicePresetRow({
      ...presetRow(),
      name: "  Mixed Pool ",
    }),
    null,
  );
  assert.equal(
    mapSavedCustomDicePresetRow({
      ...presetRow(),
      d6_quantity: 101,
    }),
    null,
  );
});

test("history row mapping strips owner identity and is serializable", () => {
  const row = historyRow();
  const mapped = mapPersonalRollHistoryRow(row);
  assert.ok(mapped);
  assert.equal("owner_id" in mapped, false);
  assert.equal(mapped.rollerKind, "vtm_v5");
  assert.equal(mapped.schemaVersion, 1);
  assert.doesNotThrow(() => JSON.stringify(mapped));

  const originalNormalDice = (
    row.request_data as {
      normalDice: number[];
    }
  ).normalDice;
  (
    mapped.requestData as {
      normalDice: number[];
    }
  ).normalDice[0] = 2;
  assert.deepEqual(originalNormalDice, [10, 6]);
});

test("history row mapping rejects stored data that needs repair", () => {
  const row = historyRow();
  row.result_data = {
    ...(row.result_data as Record<string, unknown>),
    totalSuccesses: 999,
  } as typeof row.result_data;
  assert.equal(mapPersonalRollHistoryRow(row), null);

  const unnormalized = historyRow();
  unnormalized.request_data = {
    ...(unnormalized.request_data as Record<string, unknown>),
    request: {
      ...(
        unnormalized.request_data as {
          request: Record<string, unknown>;
        }
      ).request,
      label: "  Test   roll ",
    },
  } as typeof unnormalized.request_data;
  assert.equal(mapPersonalRollHistoryRow(unnormalized), null);

  assert.equal(
    mapPersonalRollHistoryRow({
      ...historyRow(),
      sequence_number: Number.MAX_SAFE_INTEGER + 1,
    }),
    null,
  );
});

test("client initialization failure returns only a safe result", async () => {
  const diagnostics: PersonalDiceDiagnostic[] = [];
  const rawMessage = "cookie, token, and environment details";
  const result = await runPersonalDicePersistenceOperation(
    "list_history",
    async () => {
      throw new Error(rawMessage);
    },
    (service) => service.listPersonalRollHistory(),
    (diagnostic) => diagnostics.push(diagnostic),
  );

  assert.deepEqual(result, {
    ok: false,
    error: { code: "persistence_unavailable" },
  });
  assert.equal(JSON.stringify(result).includes(rawMessage), false);
  assert.deepEqual(diagnostics, [
    {
      operation: "list_history",
      errorCode: "persistence_unavailable",
    },
  ]);
});

test("server adapter RPC names and action delegation remain exact", () => {
  const serverSource = readFileSync(
    resolve(
      process.cwd(),
      "lib/dice/personal-dice-persistence.server.ts",
    ),
    "utf8",
  );
  const actionSource = readFileSync(
    resolve(
      process.cwd(),
      "app/[locale]/dice-rollers/actions.ts",
    ),
    "utf8",
  );

  assert.deepEqual(
    [
      ...serverSource.matchAll(
        /client\.rpc\(\s*"([^"]+)"/gu,
      ),
    ].map((match) => match[1]),
    [
      "create_custom_dice_preset",
      "update_custom_dice_preset",
      "delete_custom_dice_preset",
      "record_personal_roll",
      "delete_personal_roll",
      "clear_personal_roll_history",
    ],
  );
  assert.equal(actionSource.startsWith('"use server";'), true);
  assert.deepEqual(
    [
      ...actionSource.matchAll(
        /export async function (\w+)/gu,
      ),
    ].map((match) => match[1]),
    [
      "createSavedCustomDicePresetAction",
      "updateSavedCustomDicePresetAction",
      "deleteSavedCustomDicePresetAction",
      "recordPersonalRollAction",
      "deletePersonalRollAction",
      "clearPersonalRollHistoryAction",
    ],
  );
  assert.equal(actionSource.includes("redirect("), false);
  assert.equal(actionSource.includes("revalidatePath"), false);
  assert.equal(actionSource.includes("owner_id"), false);
});

test("known database messages map exactly and SQLSTATE alone does not", () => {
  const known = [
    "authentication_required",
    "preset_limit_reached",
    "preset_not_found",
    "preset_name_conflict",
    "personal_roll_idempotency_conflict",
  ] as const;

  for (const message of known) {
    assert.equal(
      mapPersonalDiceDatabaseError({
        code: "23505",
        message,
      }),
      message,
    );
  }

  assert.equal(
    mapPersonalDiceDatabaseError({
      code: "23505",
      message: "some_other_unique_constraint",
    }),
    "unexpected_error",
  );
});

test("connection errors map unavailable and unknown errors stay generic", () => {
  assert.equal(
    mapPersonalDiceDatabaseError({
      code: "PGRST001",
      message: "database unavailable with sensitive details",
    }),
    "persistence_unavailable",
  );
  assert.equal(
    mapPersonalDiceDatabaseError({
      code: "XX000",
      message: "secret raw database failure",
    }),
    "unexpected_error",
  );
  assert.equal(
    mapPersonalDiceDatabaseError("raw failure"),
    "unexpected_error",
  );
});

test("every unauthenticated operation stops before data access", async () => {
  const { source, calls } = createFakeDataSource({
    async getAuthenticatedUser() {
      calls.push({ method: "getAuthenticatedUser" });
      return {
        data: { authenticated: false },
        error: null,
      };
    },
  });
  const diagnostics: PersonalDiceDiagnostic[] = [];
  const service = createPersonalDicePersistenceService(
    source,
    (diagnostic) => diagnostics.push(diagnostic),
  );

  const results = await Promise.all([
    service.listSavedCustomDicePresets(),
    service.createSavedCustomDicePreset(validPresetInput()),
    service.updateSavedCustomDicePreset({
      presetId: PRESET_ID,
      ...validPresetInput(),
    }),
    service.deleteSavedCustomDicePreset({
      presetId: PRESET_ID,
    }),
    service.listPersonalRollHistory(),
    service.recordPersonalRoll(validVtmCandidate()),
    service.deletePersonalRoll({ rollId: ROLL_ID }),
    service.clearPersonalRollHistory(),
  ]);

  for (const result of results) {
    assert.deepEqual(result, {
      ok: false,
      error: { code: "authentication_required" },
    });
  }
  assert.equal(calls.length, 8);
  assert.equal(
    calls.every(
      ({ method }) => method === "getAuthenticatedUser",
    ),
    true,
  );
  assert.equal(diagnostics.length, 8);
});

test("auth.getUser errors cannot reach a table query or RPC", async () => {
  const { source, calls } = createFakeDataSource({
    async getAuthenticatedUser() {
      calls.push({ method: "getAuthenticatedUser" });
      return {
        data: { authenticated: false },
        error: { code: "401", message: "invalid token details" },
      };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );

  assert.deepEqual(await service.listPersonalRollHistory(), {
    ok: false,
    error: { code: "authentication_required" },
  });
  assert.deepEqual(calls, [
    { method: "getAuthenticatedUser" },
  ]);
});

test("valid preset create uses exact normalized RPC arguments", async () => {
  const { source, calls } = createFakeDataSource();
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );
  const preset = requireSuccess(
    await service.createSavedCustomDicePreset(validPresetInput()),
  );

  assert.equal("owner_id" in preset, false);
  assert.deepEqual(calls[1], {
    method: "createPreset",
    value: {
      p_name: "Mixed Pool",
      p_coin_quantity: 2,
      p_d4_quantity: 0,
      p_d6_quantity: 3,
      p_d8_quantity: 0,
      p_d10_quantity: 0,
      p_d12_quantity: 0,
      p_d20_quantity: 0,
      p_d100_quantity: 1,
    },
  });
  assert.equal(
    "owner_id" in (calls[1].value as Record<string, unknown>),
    false,
  );
});

test("valid preset update uses exact RPC arguments", async () => {
  const { source, calls } = createFakeDataSource();
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );
  requireSuccess(
    await service.updateSavedCustomDicePreset({
      presetId: PRESET_ID.toUpperCase(),
      ...validPresetInput(),
    }),
  );

  assert.deepEqual(calls[1], {
    method: "updatePreset",
    value: {
      p_preset_id: PRESET_ID,
      p_name: "Mixed Pool",
      p_coin_quantity: 2,
      p_d4_quantity: 0,
      p_d6_quantity: 3,
      p_d8_quantity: 0,
      p_d10_quantity: 0,
      p_d12_quantity: 0,
      p_d20_quantity: 0,
      p_d100_quantity: 1,
    },
  });
});

test("valid preset delete is owner-opaque and uses exact arguments", async () => {
  const { source, calls } = createFakeDataSource({
    async deletePreset(args) {
      calls.push({ method: "deletePreset", value: args });
      return { data: false, error: null };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );

  assert.deepEqual(
    await service.deleteSavedCustomDicePreset({
      presetId: PRESET_ID,
    }),
    { ok: true, data: { deleted: true } },
  );
  assert.deepEqual(calls[1], {
    method: "deletePreset",
    value: { p_preset_id: PRESET_ID },
  });
});

test("invalid preset input reaches no mutation RPC", async () => {
  const { source, calls } = createFakeDataSource();
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );

  const error = requireFailure(
    await service.createSavedCustomDicePreset({
      name: "",
      quantities: emptySavedQuantities(),
    }),
  );
  assert.equal(error.code, "validation_failed");
  assert.ok(error.issues);
  assert.deepEqual(calls, [
    { method: "getAuthenticatedUser" },
  ]);
});

test("preset list requests slot order and strips owner data", async () => {
  const { source, calls } = createFakeDataSource();
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );
  const presets = requireSuccess(
    await service.listSavedCustomDicePresets(),
  );

  assert.deepEqual(calls[1], {
    method: "listPresetRows",
    value: { orderBy: "slot", ascending: true },
  });
  assert.equal("owner_id" in presets[0], false);
});

test("invalid preset rows fail safely with limited diagnostics", async () => {
  const diagnostics: PersonalDiceDiagnostic[] = [];
  const invalidRow = { ...presetRow(), d20_quantity: -1 };
  const { source } = createFakeDataSource({
    async listPresetRows() {
      return { data: [invalidRow], error: null };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    (diagnostic) => diagnostics.push(diagnostic),
  );

  assert.deepEqual(await service.listSavedCustomDicePresets(), {
    ok: false,
    error: { code: "invalid_persisted_data" },
  });
  assert.deepEqual(diagnostics, [
    {
      operation: "list_presets",
      errorCode: "invalid_persisted_data",
      recordId: PRESET_ID,
    },
  ]);
});

test("preset duplicate and limit failures map to stable safe codes", async () => {
  for (const message of [
    "preset_name_conflict",
    "preset_limit_reached",
  ] as const) {
    const { source } = createFakeDataSource({
      async createPreset() {
        return {
          data: null,
          error: { code: "23505", message },
        };
      },
    });
    const service = createPersonalDicePersistenceService(
      source,
      () => undefined,
    );

    assert.deepEqual(
      await service.createSavedCustomDicePreset(
        validPresetInput(),
      ),
      { ok: false, error: { code: message } },
    );
  }
});

test("unknown database failures expose no raw message", async () => {
  const diagnostics: PersonalDiceDiagnostic[] = [];
  const rawMessage = "secret preset name and database details";
  const { source } = createFakeDataSource({
    async createPreset() {
      return {
        data: null,
        error: { code: "XX000", message: rawMessage },
      };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    (diagnostic) => diagnostics.push(diagnostic),
  );

  const result = await service.createSavedCustomDicePreset(
    validPresetInput(),
  );
  assert.deepEqual(result, {
    ok: false,
    error: { code: "unexpected_error" },
  });
  assert.equal(JSON.stringify(result).includes(rawMessage), false);
  assert.deepEqual(diagnostics, [
    {
      operation: "create_preset",
      errorCode: "unexpected_error",
      databaseCode: "XX000",
    },
  ]);
});

test("invalid personal rolls reach no recording RPC", async () => {
  const { source, calls } = createFakeDataSource();
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );
  const error = requireFailure(
    await service.recordPersonalRoll({
      rollerKind: "vtm_v5",
    }),
  );

  assert.equal(error.code, "validation_failed");
  assert.ok(error.issues);
  assert.deepEqual(calls, [
    { method: "getAuthenticatedUser" },
  ]);
});

test("VtM recording canonicalizes every forged calculation", async () => {
  const candidate = validVtmCandidate();
  const expected = canonicalPayload(candidate);
  const { source, calls } = createFakeDataSource({
    async recordRoll(args) {
      calls.push({ method: "recordRoll", value: args });
      return { data: historyRow(candidate), error: null };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );
  requireSuccess(await service.recordPersonalRoll(candidate));

  assert.deepEqual(calls[1], {
    method: "recordRoll",
    value: {
      p_client_roll_id: expected.p_client_roll_id,
      p_roller_kind: expected.p_roller_kind,
      p_schema_version: expected.p_schema_version,
      p_request_data: expected.p_request_data,
      p_result_data: expected.p_result_data,
    },
  });
  const args = calls[1].value as Record<string, unknown>;
  assert.equal("owner_id" in args, false);
  assert.equal(
    (
      args.p_result_data as {
        totalSuccesses: number;
        margin: number;
        isMessyCritical: boolean;
      }
    ).totalSuccesses,
    5,
  );
});

test("Custom recording rebuilds forged totals before RPC", async () => {
  const candidate = validCustomCandidate();
  const { source, calls } = createFakeDataSource({
    async recordRoll(args) {
      calls.push({ method: "recordRoll", value: args });
      return { data: historyRow(candidate), error: null };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );
  requireSuccess(await service.recordPersonalRoll(candidate));

  const args = calls[1].value as {
    p_result_data: {
      totalItems: number;
      numericDiceTotal: number;
      headsCount: number;
      tailsCount: number;
    };
  };
  assert.deepEqual(args.p_result_data, {
    coinResults: ["heads", "tails"],
    groups: [{ sides: 6, results: [1, 6] }],
    totalItems: 4,
    numericDiceTotal: 7,
    headsCount: 1,
    tailsCount: 1,
  });
});

test("idempotent record responses map to sanitized history", async () => {
  const row = historyRow();
  const { source } = createFakeDataSource({
    async recordRoll() {
      return { data: row, error: null };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );
  const entry = requireSuccess(
    await service.recordPersonalRoll(validVtmCandidate()),
  );

  assert.equal(entry.id, ROLL_ID);
  assert.equal("owner_id" in entry, false);
  assert.doesNotThrow(() => JSON.stringify(entry));
});

test("history list requests newest eleven rows and sanitizes models", async () => {
  const { source, calls } = createFakeDataSource();
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );
  const entries = requireSuccess(
    await service.listPersonalRollHistory(),
  );

  assert.deepEqual(calls[1], {
    method: "listHistoryRows",
    value: {
      orderBy: "sequence_number",
      ascending: false,
      limit: 11,
    },
  });
  assert.equal(entries.length, 1);
  assert.equal("owner_id" in entries[0], false);
});

test("malformed stored history returns invalid_persisted_data", async () => {
  const row = historyRow();
  row.result_data = {
    ...(row.result_data as Record<string, unknown>),
    margin: 9000,
  } as typeof row.result_data;
  const diagnostics: PersonalDiceDiagnostic[] = [];
  const { source } = createFakeDataSource({
    async listHistoryRows() {
      return { data: [row], error: null };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    (diagnostic) => diagnostics.push(diagnostic),
  );

  assert.deepEqual(await service.listPersonalRollHistory(), {
    ok: false,
    error: { code: "invalid_persisted_data" },
  });
  assert.deepEqual(diagnostics, [
    {
      operation: "list_history",
      errorCode: "invalid_persisted_data",
      recordId: ROLL_ID,
    },
  ]);
  assert.equal(
    JSON.stringify(diagnostics).includes("request_data"),
    false,
  );
});

test("history query failures return safe mapped errors", async () => {
  const rawMessage = "sensitive query details";
  const { source } = createFakeDataSource({
    async listHistoryRows() {
      return {
        data: null,
        error: { code: "PGRST001", message: rawMessage },
      };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );
  const result = await service.listPersonalRollHistory();

  assert.deepEqual(result, {
    ok: false,
    error: { code: "persistence_unavailable" },
  });
  assert.equal(JSON.stringify(result).includes(rawMessage), false);
});

test("personal roll idempotency conflicts map exactly", async () => {
  const { source } = createFakeDataSource({
    async recordRoll() {
      return {
        data: null,
        error: {
          code: "23505",
          message: "personal_roll_idempotency_conflict",
        },
      };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );

  assert.deepEqual(
    await service.recordPersonalRoll(validVtmCandidate()),
    {
      ok: false,
      error: { code: "personal_roll_idempotency_conflict" },
    },
  );
});

test("delete personal roll validates and uses exact opaque RPC shape", async () => {
  const { source, calls } = createFakeDataSource({
    async deleteRoll(args) {
      calls.push({ method: "deleteRoll", value: args });
      return { data: false, error: null };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );

  assert.deepEqual(
    await service.deletePersonalRoll({
      rollId: ROLL_ID.toUpperCase(),
    }),
    { ok: true, data: { deleted: true } },
  );
  assert.deepEqual(calls[1], {
    method: "deleteRoll",
    value: { p_roll_id: ROLL_ID },
  });

  const invalid = await service.deletePersonalRoll({
    rollId: "invalid",
  });
  assert.equal(invalid.ok, false);
  assert.equal(calls.length, 3);
});

test("clear history invokes the no-argument RPC and returns count", async () => {
  const { source, calls } = createFakeDataSource();
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );

  assert.deepEqual(await service.clearPersonalRollHistory(), {
    ok: true,
    data: { deletedCount: 3 },
  });
  assert.deepEqual(calls[1], { method: "clearHistory" });
});

test("thrown data-source failures become persistence_unavailable", async () => {
  const diagnostics: PersonalDiceDiagnostic[] = [];
  const { source } = createFakeDataSource({
    async listPresetRows() {
      throw new TypeError("network request with secret details");
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    (diagnostic) => diagnostics.push(diagnostic),
  );

  assert.deepEqual(await service.listSavedCustomDicePresets(), {
    ok: false,
    error: { code: "persistence_unavailable" },
  });
  assert.deepEqual(diagnostics, [
    {
      operation: "list_presets",
      errorCode: "persistence_unavailable",
    },
  ]);
});

test("returned history is copy-isolated from database response rows", async () => {
  const row = historyRow();
  const { source } = createFakeDataSource({
    async listHistoryRows() {
      return { data: [row], error: null };
    },
  });
  const service = createPersonalDicePersistenceService(
    source,
    () => undefined,
  );
  const [entry] = requireSuccess(
    await service.listPersonalRollHistory(),
  );

  (
    row.request_data as {
      normalDice: number[];
    }
  ).normalDice[0] = 1;
  assert.deepEqual(
    (
      entry.requestData as {
        normalDice: number[];
      }
    ).normalDice,
    [10, 6],
  );

  (
    entry.resultData as {
      normalDice: number[];
    }
  ).normalDice[0] = 2;
  assert.deepEqual(
    (
      row.result_data as {
        normalDice: number[];
      }
    ).normalDice,
    [10, 6],
  );
});
