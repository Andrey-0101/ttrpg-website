import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

// supabase/config.toml fixes this repository's project_id to "ttrpg-website".
const DATABASE_CONTAINER = "supabase_db_ttrpg-website";
const USER_A = "c0a00000-0000-4000-8000-000000000001";
const USER_B = "c0b00000-0000-4000-8000-000000000002";
const USER_A_EMAIL = "personal-dice-concurrency-a@example.invalid";
const USER_B_EMAIL = "personal-dice-concurrency-b@example.invalid";
const PROCESS_TIMEOUT_MS = 30_000;

type PsqlSuccess = {
  ok: true;
  stdout: string;
  stderr: string;
  resultLines: string[];
};

type PsqlFailure = {
  ok: false;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  sqlState: string | null;
  message: string | null;
};

type PsqlResult = PsqlSuccess | PsqlFailure;

type PresetSummary = {
  total: number;
  slots: number[];
  owners: string[];
  names: string[];
};

type HistorySummary = {
  total: number;
  sequenceNumbers: string[];
  kinds: string[];
  owners: string[];
};

function findExecutableOnPath(fileNames: string[]): string | null {
  for (const rawDirectory of (process.env.PATH ?? "").split(path.delimiter)) {
    const directory = rawDirectory.replace(/^"(.*)"$/, "$1");
    if (!directory) {
      continue;
    }

    for (const fileName of fileNames) {
      const candidate = path.join(directory, fileName);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function resolveDockerExecutable(): string | null {
  const pathExecutable = findExecutableOnPath(
    process.platform === "win32" ? ["docker.exe", "docker"] : ["docker"],
  );
  if (pathExecutable) {
    return pathExecutable;
  }

  if (process.platform !== "win32") {
    return null;
  }

  const fallbackCandidates = [
    process.env.ProgramFiles
      ? path.join(
          process.env.ProgramFiles,
          "Docker",
          "Docker",
          "resources",
          "bin",
          "docker.exe",
        )
      : null,
    process.env.LOCALAPPDATA
      ? path.join(
          process.env.LOCALAPPDATA,
          "Programs",
          "DockerDesktop",
          "resources",
          "bin",
          "docker.exe",
        )
      : null,
    process.env.ProgramData
      ? path.join(
          process.env.ProgramData,
          "DockerDesktop",
          "version-bin",
          "docker.exe",
        )
      : null,
  ];

  return (
    fallbackCandidates.find(
      (candidate): candidate is string =>
        candidate !== null && existsSync(candidate),
    ) ?? null
  );
}

const DOCKER_EXECUTABLE = resolveDockerExecutable();

function requireDockerExecutable(): string {
  if (!DOCKER_EXECUTABLE) {
    throw new Error(
      "Docker CLI unavailable: add docker to PATH or install Docker Desktop.",
    );
  }

  return DOCKER_EXECUTABLE;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function parsePostgresError(stderr: string): {
  sqlState: string | null;
  message: string | null;
} {
  const verboseMatch = stderr.match(
    /ERROR:\s+([0-9A-Z]{5}):\s+([^\r\n]+)/,
  );
  if (verboseMatch) {
    return {
      sqlState: verboseMatch[1] ?? null,
      message: verboseMatch[2]?.trim() ?? null,
    };
  }

  const ordinaryMatch = stderr.match(/ERROR:\s+([^\r\n]+)/);
  return {
    sqlState: null,
    message: ordinaryMatch?.[1]?.trim() ?? null,
  };
}

function runPsql(sql: string): Promise<PsqlResult> {
  return new Promise((resolve) => {
    const child = spawn(
      requireDockerExecutable(),
      [
        "exec",
        "-i",
        DATABASE_CONTAINER,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-X",
        "-A",
        "-t",
        "-q",
        "-v",
        "ON_ERROR_STOP=1",
        "--set",
        "VERBOSITY=verbose",
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      },
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      child.kill();
      if (!settled) {
        settled = true;
        resolve({
          ok: false,
          stdout,
          stderr: `${stderr}\nprocess_timeout`,
          exitCode: null,
          sqlState: null,
          message: "process_timeout",
        });
      }
    }, PROCESS_TIMEOUT_MS);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        resolve({
          ok: false,
          stdout,
          stderr: `${stderr}\n${error.message}`,
          exitCode: null,
          sqlState: null,
          message: error.message,
        });
      }
    });
    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      if (settled) {
        return;
      }
      settled = true;

      if (exitCode === 0) {
        resolve({
          ok: true,
          stdout,
          stderr,
          resultLines: stdout
            .split(/\r?\n/)
            .filter((line) => line.startsWith("RESULT|"))
            .map((line) => line.slice("RESULT|".length)),
        });
        return;
      }

      const parsedError = parsePostgresError(stderr);
      resolve({
        ok: false,
        stdout,
        stderr,
        exitCode,
        ...parsedError,
      });
    });

    child.stdin.end(`set statement_timeout = '25s';\n${sql}`);
  });
}

async function runRequiredSql(sql: string, description: string) {
  const result = await runPsql(sql);
  assert.equal(
    result.ok,
    true,
    `${description} failed: ${
      result.ok
        ? "unknown error"
        : `${result.sqlState ?? "no SQLSTATE"} ${result.message ?? result.stderr}`
    }`,
  );
  return result as PsqlSuccess;
}

function authenticatedSql(ownerId: string, body: string): string {
  const claims = JSON.stringify({
    sub: ownerId,
    role: "authenticated",
  });

  return `
begin;
set local role authenticated;
set local request.jwt.claim.sub = ${quoteLiteral(ownerId)};
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = ${quoteLiteral(claims)};
${body}
commit;
`;
}

function createPreset(
  ownerId: string,
  name: string,
  d6Quantity = 1,
): Promise<PsqlResult> {
  return runPsql(
    authenticatedSql(
      ownerId,
      `
select 'RESULT|' || pg_catalog.row_to_json(preset)::text
from public.create_custom_dice_preset(
  ${quoteLiteral(name)},
  0::smallint,
  0::smallint,
  ${d6Quantity}::smallint,
  0::smallint,
  0::smallint,
  0::smallint,
  0::smallint,
  0::smallint
) as preset;
`,
    ),
  );
}

function deletePreset(ownerId: string, presetId: string): Promise<PsqlResult> {
  return runPsql(
    authenticatedSql(
      ownerId,
      `
select 'RESULT|' || public.delete_custom_dice_preset(
  ${quoteLiteral(presetId)}::uuid
)::text;
`,
    ),
  );
}

function recordRoll(
  ownerId: string,
  clientRollId: string,
  rollerKind: "vtm_v5" | "custom_dice_pool",
  requestData: Record<string, unknown>,
  resultData: Record<string, unknown>,
): Promise<PsqlResult> {
  return runPsql(
    authenticatedSql(
      ownerId,
      `
select 'RESULT|' || pg_catalog.row_to_json(history)::text
from public.record_personal_roll(
  ${quoteLiteral(clientRollId)}::uuid,
  ${quoteLiteral(rollerKind)},
  1::smallint,
  ${quoteLiteral(JSON.stringify(requestData))}::jsonb,
  ${quoteLiteral(JSON.stringify(resultData))}::jsonb
) as history;
`,
    ),
  );
}

function expectSuccess(result: PsqlResult, description: string): PsqlSuccess {
  assert.equal(
    result.ok,
    true,
    `${description}: ${
      result.ok
        ? "unknown error"
        : `${result.sqlState ?? "no SQLSTATE"} ${result.message ?? result.stderr}`
    }`,
  );
  return result as PsqlSuccess;
}

function expectError(
  result: PsqlResult,
  sqlState: string,
  message: string,
  description: string,
): PsqlFailure {
  assert.equal(result.ok, false, `${description}: unexpectedly succeeded`);
  const failure = result as PsqlFailure;
  assert.equal(failure.sqlState, sqlState, `${description}: wrong SQLSTATE`);
  assert.equal(failure.message, message, `${description}: wrong message`);
  return failure;
}

function parseSingleJson<T>(result: PsqlSuccess, description: string): T {
  assert.equal(
    result.resultLines.length,
    1,
    `${description}: expected exactly one result row`,
  );
  return JSON.parse(result.resultLines[0] ?? "null") as T;
}

async function getPresetSummary(ownerId: string): Promise<PresetSummary> {
  const result = await runRequiredSql(
    `
select 'RESULT|' || pg_catalog.json_build_object(
  'total', pg_catalog.count(*),
  'slots', coalesce(
    pg_catalog.array_agg(slot order by slot),
    array[]::smallint[]
  ),
  'owners', coalesce(
    pg_catalog.array_agg(distinct owner_id::text),
    array[]::text[]
  ),
  'names', coalesce(
    pg_catalog.array_agg(name order by slot),
    array[]::text[]
  )
)::text
from public.custom_dice_presets
where owner_id = ${quoteLiteral(ownerId)}::uuid;
`,
    `read preset summary for ${ownerId}`,
  );
  return parseSingleJson<PresetSummary>(result, "preset summary");
}

async function getHistorySummary(ownerId: string): Promise<HistorySummary> {
  const result = await runRequiredSql(
    `
select 'RESULT|' || pg_catalog.json_build_object(
  'total', pg_catalog.count(*),
  'sequenceNumbers', coalesce(
    pg_catalog.array_agg(sequence_number::text order by sequence_number),
    array[]::text[]
  ),
  'kinds', coalesce(
    pg_catalog.array_agg(distinct roller_kind order by roller_kind),
    array[]::text[]
  ),
  'owners', coalesce(
    pg_catalog.array_agg(distinct owner_id::text),
    array[]::text[]
  )
)::text
from public.personal_roll_history
where owner_id = ${quoteLiteral(ownerId)}::uuid;
`,
    `read history summary for ${ownerId}`,
  );
  return parseSingleJson<HistorySummary>(result, "history summary");
}

async function clearOwnerData(ownerId: string): Promise<void> {
  await runRequiredSql(
    `
delete from public.custom_dice_presets
where owner_id = ${quoteLiteral(ownerId)}::uuid;
delete from public.personal_roll_history
where owner_id = ${quoteLiteral(ownerId)}::uuid;
`,
    `clear test data for ${ownerId}`,
  );
}

async function setupUsers(): Promise<void> {
  await runRequiredSql(
    `
delete from auth.users
where id in (
  ${quoteLiteral(USER_A)}::uuid,
  ${quoteLiteral(USER_B)}::uuid
);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    ${quoteLiteral(USER_A)}::uuid,
    'authenticated',
    'authenticated',
    ${quoteLiteral(USER_A_EMAIL)},
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp()
  ),
  (
    ${quoteLiteral(USER_B)}::uuid,
    'authenticated',
    'authenticated',
    ${quoteLiteral(USER_B_EMAIL)},
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp()
  );
`,
    "create deterministic Auth users",
  );
}

async function cleanupUsers(): Promise<void> {
  await runRequiredSql(
    `
delete from auth.users
where id in (
  ${quoteLiteral(USER_A)}::uuid,
  ${quoteLiteral(USER_B)}::uuid
);
`,
    "delete deterministic Auth users",
  );
}

async function testConcurrentPresetCreation() {
  await clearOwnerData(USER_A);

  const results = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      createPreset(USER_A, `Concurrency preset ${index + 1}`),
    ),
  );

  const successful = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);
  assert.equal(successful.length, 5, "exactly five preset creates succeed");
  assert.equal(failed.length, 5, "exactly five preset creates reach the limit");
  successful.forEach((result, index) => {
    const record = parseSingleJson<{ owner_id: string }>(
      result as PsqlSuccess,
      `preset create ${index + 1}`,
    );
    assert.equal(record.owner_id, USER_A, "created preset belongs to user A");
  });
  failed.forEach((result, index) => {
    expectError(
      result,
      "P0001",
      "preset_limit_reached",
      `limited preset create ${index + 1}`,
    );
  });

  const summary = await getPresetSummary(USER_A);
  assert.equal(summary.total, 5);
  assert.deepEqual(summary.slots, [1, 2, 3, 4, 5]);
  assert.deepEqual(summary.owners, [USER_A]);

  return {
    successful: successful.length,
    presetLimitReached: failed.length,
    summary,
  };
}

async function testConcurrentSlotReuse() {
  const before = await getPresetSummary(USER_A);
  assert.equal(before.total, 5, "slot reuse starts with five presets");

  const knownPresetResult = await runRequiredSql(
    `
select 'RESULT|' || pg_catalog.json_build_object(
  'id', id,
  'name', name
)::text
from public.custom_dice_presets
where owner_id = ${quoteLiteral(USER_A)}::uuid
  and slot = 3;
`,
    "read known slot-three preset",
  );
  const knownPreset = parseSingleJson<{ id: string; name: string }>(
    knownPresetResult,
    "known preset",
  );

  const [deleteResult, initialCreateResult] = await Promise.all([
    deletePreset(USER_A, knownPreset.id),
    createPreset(USER_A, "Concurrent replacement"),
  ]);
  const deleted = expectSuccess(deleteResult, "concurrent preset delete");
  assert.deepEqual(deleted.resultLines, ["true"]);

  let createResult = initialCreateResult;
  let retriedAfterLimit = false;
  if (!createResult.ok) {
    expectError(
      createResult,
      "P0001",
      "preset_limit_reached",
      "create serialized before delete",
    );
    retriedAfterLimit = true;
    createResult = await createPreset(USER_A, "Concurrent replacement");
  }
  expectSuccess(createResult, "replacement preset create");

  const after = await getPresetSummary(USER_A);
  assert.equal(after.total, 5);
  assert.deepEqual(after.slots, [1, 2, 3, 4, 5]);
  assert.equal(after.names.includes(knownPreset.name), false);
  assert.equal(after.names.includes("Concurrent replacement"), true);
  assert.equal(new Set(after.slots).size, 5);

  return { retriedAfterLimit, summary: after };
}

async function testConcurrentIdempotency() {
  await runRequiredSql(
    `
delete from public.personal_roll_history
where owner_id = ${quoteLiteral(USER_A)}::uuid;
`,
    "clear user A history before idempotency",
  );

  const clientRollId = "c0a10000-0000-4000-8000-000000000001";
  const identicalResults = await Promise.all(
    Array.from({ length: 10 }, () =>
      recordRoll(
        USER_A,
        clientRollId,
        "vtm_v5",
        { hungerDice: 1, pool: 3 },
        { totalSuccesses: 2 },
      ),
    ),
  );
  const records = identicalResults.map((result, index) =>
    parseSingleJson<{ id: string; sequence_number: number }>(
      expectSuccess(result, `idempotent call ${index + 1}`),
      `idempotent call ${index + 1}`,
    ),
  );
  assert.equal(new Set(records.map((record) => record.id)).size, 1);
  assert.equal(
    new Set(records.map((record) => String(record.sequence_number))).size,
    1,
  );

  const summary = await getHistorySummary(USER_A);
  assert.equal(summary.total, 1);

  const conflictResults = await Promise.all(
    Array.from({ length: 10 }, () =>
      recordRoll(
        USER_A,
        clientRollId,
        "vtm_v5",
        { hungerDice: 1, pool: 4 },
        { totalSuccesses: 2 },
      ),
    ),
  );
  conflictResults.forEach((result, index) => {
    expectError(
      result,
      "23505",
      "personal_roll_idempotency_conflict",
      `idempotency conflict ${index + 1}`,
    );
  });

  const unchangedResult = await runRequiredSql(
    `
select 'RESULT|' || pg_catalog.row_to_json(history)::text
from public.personal_roll_history as history
where owner_id = ${quoteLiteral(USER_A)}::uuid
  and client_roll_id = ${quoteLiteral(clientRollId)}::uuid;
`,
    "read original idempotent row",
  );
  const unchanged = parseSingleJson<{
    id: string;
    sequence_number: number;
    request_data: Record<string, unknown>;
  }>(unchangedResult, "unchanged idempotent row");
  assert.equal(unchanged.id, records[0]?.id);
  assert.equal(
    String(unchanged.sequence_number),
    String(records[0]?.sequence_number),
  );
  assert.deepEqual(unchanged.request_data, { hungerDice: 1, pool: 3 });

  return {
    successfulRetries: records.length,
    sharedId: records[0]?.id,
    sharedSequenceNumber: String(records[0]?.sequence_number),
    conflicts: conflictResults.length,
  };
}

async function testConcurrentRetention() {
  await runRequiredSql(
    `
delete from public.personal_roll_history
where owner_id = ${quoteLiteral(USER_A)}::uuid;
`,
    "clear user A history before retention",
  );

  const results = await Promise.all(
    Array.from({ length: 20 }, (_, index) => {
      const ordinal = index + 1;
      const clientRollId = `c0a20000-0000-4000-8000-${String(ordinal).padStart(
        12,
        "0",
      )}`;
      const kind = ordinal % 2 === 0 ? "custom_dice_pool" : "vtm_v5";
      return recordRoll(
        USER_A,
        clientRollId,
        kind,
        { ordinal },
        { shown: ordinal },
      );
    }),
  );
  const records = results.map((result, index) =>
    parseSingleJson<{ sequence_number: number }>(
      expectSuccess(result, `retention call ${index + 1}`),
      `retention call ${index + 1}`,
    ),
  );
  const createdSequenceNumbers = records
    .map((record) => BigInt(record.sequence_number))
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  const expectedRetained = createdSequenceNumbers
    .slice(-11)
    .map((value) => value.toString());

  const summary = await getHistorySummary(USER_A);
  assert.equal(summary.total, 11);
  assert.deepEqual(summary.sequenceNumbers, expectedRetained);
  assert.deepEqual(summary.kinds, ["custom_dice_pool", "vtm_v5"]);
  assert.deepEqual(summary.owners, [USER_A]);

  return {
    successful: records.length,
    retained: summary.total,
    retainedSequenceNumbers: summary.sequenceNumbers,
    kinds: summary.kinds,
  };
}

async function getAuthenticatedVisibility(
  viewerId: string,
  otherOwnerId: string,
) {
  const result = await runPsql(
    authenticatedSql(
      viewerId,
      `
select 'RESULT|' || pg_catalog.json_build_object(
  'otherPresets', (
    select pg_catalog.count(*)
    from public.custom_dice_presets
    where owner_id = ${quoteLiteral(otherOwnerId)}::uuid
  ),
  'otherHistory', (
    select pg_catalog.count(*)
    from public.personal_roll_history
    where owner_id = ${quoteLiteral(otherOwnerId)}::uuid
  )
)::text;
`,
    ),
  );
  return parseSingleJson<{ otherPresets: number; otherHistory: number }>(
    expectSuccess(result, `RLS visibility for ${viewerId}`),
    `RLS visibility for ${viewerId}`,
  );
}

async function testPerUserIsolation() {
  await Promise.all([clearOwnerData(USER_A), clearOwnerData(USER_B)]);

  const userOperations = (ownerId: string, ownerLabel: "A" | "B") => [
    ...Array.from({ length: 5 }, (_, index) =>
      createPreset(ownerId, `Isolation ${ownerLabel} preset ${index + 1}`),
    ),
    ...Array.from({ length: 12 }, (_, index) => {
      const ordinal = index + 1;
      const prefix = ownerLabel === "A" ? "c0a30000" : "c0b30000";
      const clientRollId = `${prefix}-0000-4000-8000-${String(
        ordinal,
      ).padStart(12, "0")}`;
      return recordRoll(
        ownerId,
        clientRollId,
        ordinal % 2 === 0 ? "custom_dice_pool" : "vtm_v5",
        { ownerLabel, ordinal },
        { ownerLabel, shown: ordinal },
      );
    }),
  ];

  const [userAResults, userBResults] = await Promise.all([
    Promise.all(userOperations(USER_A, "A")),
    Promise.all(userOperations(USER_B, "B")),
  ]);
  [...userAResults, ...userBResults].forEach((result, index) => {
    expectSuccess(result, `cross-user concurrent operation ${index + 1}`);
  });

  const [presetsA, presetsB, historyA, historyB, visibilityA, visibilityB] =
    await Promise.all([
      getPresetSummary(USER_A),
      getPresetSummary(USER_B),
      getHistorySummary(USER_A),
      getHistorySummary(USER_B),
      getAuthenticatedVisibility(USER_A, USER_B),
      getAuthenticatedVisibility(USER_B, USER_A),
    ]);

  assert.equal(presetsA.total, 5);
  assert.equal(presetsB.total, 5);
  assert.deepEqual(presetsA.slots, [1, 2, 3, 4, 5]);
  assert.deepEqual(presetsB.slots, [1, 2, 3, 4, 5]);
  assert.deepEqual(presetsA.owners, [USER_A]);
  assert.deepEqual(presetsB.owners, [USER_B]);
  assert.equal(historyA.total, 11);
  assert.equal(historyB.total, 11);
  assert.deepEqual(historyA.owners, [USER_A]);
  assert.deepEqual(historyB.owners, [USER_B]);
  assert.deepEqual(visibilityA, { otherPresets: 0, otherHistory: 0 });
  assert.deepEqual(visibilityB, { otherPresets: 0, otherHistory: 0 });

  return {
    userA: { presets: presetsA.total, history: historyA.total },
    userB: { presets: presetsB.total, history: historyB.total },
    visibilityA,
    visibilityB,
  };
}

async function main(): Promise<void> {
  let setupCompleted = false;
  try {
    await setupUsers();
    setupCompleted = true;

    const presetCreation = await testConcurrentPresetCreation();
    const slotReuse = await testConcurrentSlotReuse();
    const idempotency = await testConcurrentIdempotency();
    const retention = await testConcurrentRetention();
    const isolation = await testPerUserIsolation();

    console.log(
      JSON.stringify(
        {
          presetCreation,
          slotReuse,
          idempotency,
          retention,
          isolation,
          result: "PASS",
        },
        null,
        2,
      ),
    );
  } finally {
    if (setupCompleted) {
      await cleanupUsers();
    }
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`personal dice concurrency test failed: ${message}`);
  process.exitCode = 1;
});
