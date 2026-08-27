import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const DATABASE_CONTAINER = "supabase_db_ttrpg-website";
const PROCESS_TIMEOUT_MS = 30_000;
const CAMPAIGN_ID = "81000000-0000-4000-8000-000000000001";
const GM_ID = "81000000-0000-4000-8000-000000000002";
const EXISTING_PLAYER_IDS = [
  "81000000-0000-4000-8000-000000000003",
  "81000000-0000-4000-8000-000000000004",
  "81000000-0000-4000-8000-000000000005",
  "81000000-0000-4000-8000-000000000006",
  "81000000-0000-4000-8000-000000000007",
] as const;
const CANDIDATE_A_ID = "81000000-0000-4000-8000-000000000008";
const CANDIDATE_B_ID = "81000000-0000-4000-8000-000000000009";
const TOKEN_A = "a".repeat(64);
const TOKEN_B = "b".repeat(64);

type PsqlResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  sqlState: string | null;
  message: string | null;
  resultLines: string[];
};

function findExecutableOnPath(fileNames: string[]): string | null {
  for (const rawDirectory of (process.env.PATH ?? "").split(path.delimiter)) {
    const directory = rawDirectory.replace(/^"(.*)"$/, "$1");
    if (!directory) continue;
    for (const fileName of fileNames) {
      const candidate = path.join(directory, fileName);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function resolveDockerExecutable(): string | null {
  const fromPath = findExecutableOnPath(
    process.platform === "win32" ? ["docker.exe", "docker"] : ["docker"],
  );
  if (fromPath) return fromPath;
  if (process.platform !== "win32") return null;
  const candidates = [
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
  ];
  return (
    candidates.find(
      (candidate): candidate is string =>
        candidate !== null && existsSync(candidate),
    ) ?? null
  );
}

const DOCKER_EXECUTABLE = resolveDockerExecutable();

function requireDockerExecutable(): string {
  if (!DOCKER_EXECUTABLE) {
    throw new Error("Docker CLI unavailable for database concurrency test.");
  }
  return DOCKER_EXECUTABLE;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function parsePostgresError(stderr: string) {
  const verbose = stderr.match(/ERROR:\s+([0-9A-Z]{5}):\s+([^\r\n]+)/);
  if (verbose) {
    return {
      sqlState: verbose[1] ?? null,
      message: verbose[2]?.trim() ?? null,
    };
  }
  const ordinary = stderr.match(/ERROR:\s+([^\r\n]+)/);
  return { sqlState: null, message: ordinary?.[1]?.trim() ?? null };
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
      { stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
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
          stderr,
          exitCode: null,
          sqlState: null,
          message: "process_timeout",
          resultLines: [],
        });
      }
    }, PROCESS_TIMEOUT_MS);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => (stdout += chunk));
    child.stderr.on("data", (chunk: string) => (stderr += chunk));
    child.on("error", (error) => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        resolve({
          ok: false,
          stdout,
          stderr,
          exitCode: null,
          sqlState: null,
          message: error.message,
          resultLines: [],
        });
      }
    });
    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      const resultLines = stdout
        .split(/\r?\n/)
        .filter((line) => line.startsWith("RESULT|"))
        .map((line) => line.slice("RESULT|".length));
      if (exitCode === 0) {
        resolve({
          ok: true,
          stdout,
          stderr,
          exitCode,
          sqlState: null,
          message: null,
          resultLines,
        });
        return;
      }
      resolve({
        ok: false,
        stdout,
        stderr,
        exitCode,
        ...parsePostgresError(stderr),
        resultLines,
      });
    });
    child.stdin.end(`set statement_timeout = '25s';\n${sql}`);
  });
}

async function requireSuccess(sql: string, description: string) {
  const result = await runPsql(sql);
  assert.equal(
    result.ok,
    true,
    `${description}: ${result.sqlState ?? "no SQLSTATE"} ${
      result.message ?? result.stderr
    }`,
  );
  return result;
}

function authenticatedSql(userId: string, body: string): string {
  const claims = JSON.stringify({ sub: userId, role: "authenticated" });
  return `
begin;
set local role authenticated;
set local request.jwt.claim.sub = ${quoteLiteral(userId)};
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = ${quoteLiteral(claims)};
${body}
commit;
`;
}

async function setup(): Promise<void> {
  const allIds = [
    GM_ID,
    ...EXISTING_PLAYER_IDS,
    CANDIDATE_A_ID,
    CANDIDATE_B_ID,
  ];
  const values = allIds
    .map(
      (id, index) => `(
        ${quoteLiteral(id)}::uuid,
        'authenticated', 'authenticated',
        ${quoteLiteral(`m4e-concurrency-${index + 1}@example.test`)},
        '', '{}'::jsonb, '{}'::jsonb,
        pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
      )`,
    )
    .join(",\n");
  const memberValues = EXISTING_PLAYER_IDS.map(
    (id, index) =>
      `(${quoteLiteral(CAMPAIGN_ID)}::uuid, ${quoteLiteral(
        id,
      )}::uuid, ${index + 1}::smallint)`,
  ).join(",\n");

  await requireSuccess(
    `
delete from auth.users where id = any(array[${allIds
      .map((id) => `${quoteLiteral(id)}::uuid`)
      .join(",")}]);
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values ${values};
insert into public.campaigns (id, game_master_id, game_system, name)
values (${quoteLiteral(CAMPAIGN_ID)}::uuid, ${quoteLiteral(
      GM_ID,
    )}::uuid, 'vtm_v5', 'M4E concurrency');
insert into public.campaign_members (campaign_id, user_id, display_order)
values ${memberValues};
insert into public.campaign_invitations (
  campaign_id, created_by, token_hash, expires_at
) values
  (${quoteLiteral(CAMPAIGN_ID)}::uuid, ${quoteLiteral(
      GM_ID,
    )}::uuid,
   encode(extensions.digest(convert_to(${quoteLiteral(
     TOKEN_A,
   )}, 'UTF8'), 'sha256'), 'hex'), now() + interval '1 day'),
  (${quoteLiteral(CAMPAIGN_ID)}::uuid, ${quoteLiteral(
      GM_ID,
    )}::uuid,
   encode(extensions.digest(convert_to(${quoteLiteral(
     TOKEN_B,
   )}, 'UTF8'), 'sha256'), 'hex'), now() + interval '1 day');
`,
    "set up the final-slot race",
  );
}

async function cleanup(): Promise<void> {
  await requireSuccess(
    `delete from auth.users where id = ${quoteLiteral(GM_ID)}::uuid;`,
    "clean up concurrency fixture",
  );
}

async function main(): Promise<void> {
  let setupComplete = false;
  try {
    await setup();
    setupComplete = true;

    const [resultA, resultB] = await Promise.all([
      runPsql(
        authenticatedSql(
          CANDIDATE_A_ID,
          `select 'RESULT|' || public.accept_campaign_invitation(${quoteLiteral(
            TOKEN_A,
          )})::text;`,
        ),
      ),
      runPsql(
        authenticatedSql(
          CANDIDATE_B_ID,
          `select 'RESULT|' || public.accept_campaign_invitation(${quoteLiteral(
            TOKEN_B,
          )})::text;`,
        ),
      ),
    ]);

    const successes = [resultA, resultB].filter((result) => result.ok);
    const failures = [resultA, resultB].filter((result) => !result.ok);
    assert.equal(successes.length, 1, "exactly one final-slot acceptance succeeds");
    assert.equal(failures.length, 1, "exactly one final-slot acceptance fails");
    assert.equal(failures[0]?.sqlState, "P0001");
    assert.equal(failures[0]?.message, "campaign_player_capacity_reached");

    const summaryResult = await requireSuccess(
      `
select 'RESULT|' || pg_catalog.json_build_object(
  'memberCount', (select count(*) from public.campaign_members
    where campaign_id = ${quoteLiteral(CAMPAIGN_ID)}::uuid),
  'distinctOrderCount', (select count(distinct display_order)
    from public.campaign_members
    where campaign_id = ${quoteLiteral(CAMPAIGN_ID)}::uuid),
  'slotSixCount', (select count(*) from public.campaign_members
    where campaign_id = ${quoteLiteral(CAMPAIGN_ID)}::uuid and display_order = 6),
  'acceptedInvitationCount', (select count(*) from public.campaign_invitations
    where campaign_id = ${quoteLiteral(CAMPAIGN_ID)}::uuid and accepted_at is not null),
  'openInvitationCount', (select count(*) from public.campaign_invitations
    where campaign_id = ${quoteLiteral(
      CAMPAIGN_ID,
    )}::uuid and accepted_at is null and revoked_at is null)
)::text;
`,
      "read final-slot race summary",
    );
    assert.equal(summaryResult.resultLines.length, 1);
    const summary = JSON.parse(summaryResult.resultLines[0] ?? "null") as {
      memberCount: number;
      distinctOrderCount: number;
      slotSixCount: number;
      acceptedInvitationCount: number;
      openInvitationCount: number;
    };
    assert.deepEqual(summary, {
      memberCount: 6,
      distinctOrderCount: 6,
      slotSixCount: 1,
      acceptedInvitationCount: 1,
      openInvitationCount: 1,
    });

    console.log(
      JSON.stringify({
        successfulAcceptances: successes.length,
        capacityRejections: failures.length,
        memberCount: summary.memberCount,
        distinctOrderCount: summary.distinctOrderCount,
        acceptedInvitationCount: summary.acceptedInvitationCount,
        unconsumedInvitationCount: summary.openInvitationCount,
        result: "PASS",
      }),
    );
  } finally {
    if (setupComplete) await cleanup();
  }
}

void main().catch((error: unknown) => {
  console.error(
    `campaign video concurrency test failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
});
