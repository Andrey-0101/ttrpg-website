import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const DATABASE_CONTAINER = "supabase_db_ttrpg-website";
const CAMPAIGN_ID = "93000000-0000-4000-8000-000000000001";
const GM_ID = "93000000-0000-4000-8000-000000000002";

type Result = {
  ok: boolean;
  sqlState: string | null;
  stderr: string;
};

function runPsql(sql: string): Promise<Result> {
  return new Promise((resolve) => {
    const child = spawn(
      "docker",
      [
        "exec", "-i", DATABASE_CONTAINER, "psql", "-U", "postgres",
        "-d", "postgres", "-X", "-q", "-v", "ON_ERROR_STOP=1",
        "--set", "VERBOSITY=verbose",
      ],
      { stdio: ["pipe", "ignore", "pipe"], windowsHide: true },
    );
    let stderr = "";
    const timeout = setTimeout(() => child.kill(), 30_000);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => (stderr += chunk));
    child.on("error", (error) => {
      clearTimeout(timeout);
      resolve({ ok: false, sqlState: null, stderr: error.message });
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({
        ok: code === 0,
        sqlState: stderr.match(/ERROR:\s+([0-9A-Z]{5}):/)?.[1] ?? null,
        stderr,
      });
    });
    child.stdin.end(`set statement_timeout = '25s';\n${sql}`);
  });
}

function authenticatedStartSql() {
  return `
begin;
set local role authenticated;
set local request.jwt.claim.sub = '${GM_ID}';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"${GM_ID}","role":"authenticated"}';
select public.start_game_session('${CAMPAIGN_ID}'::uuid);
commit;
`;
}

async function requireSuccess(sql: string, label: string) {
  const result = await runPsql(sql);
  assert.equal(result.ok, true, `${label}: ${result.stderr}`);
}

async function main() {
  await requireSuccess(
    `
delete from public.campaigns where id = '${CAMPAIGN_ID}'::uuid;
delete from auth.users where id = '${GM_ID}'::uuid;
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '${GM_ID}', 'authenticated', 'authenticated',
  'game-session-concurrency@example.test', '', '{}'::jsonb, '{}'::jsonb,
  now(), now()
);
insert into public.campaigns (id, game_master_id, game_system, name)
values ('${CAMPAIGN_ID}', '${GM_ID}', 'vtm_v5', 'Session concurrency');
`,
    "fixture setup",
  );

  try {
    const results = await Promise.all([
      runPsql(authenticatedStartSql()),
      runPsql(authenticatedStartSql()),
    ]);
    const successes = results.filter((result) => result.ok);
    const conflicts = results.filter((result) => !result.ok);
    assert.equal(successes.length, 1, "exactly one concurrent start succeeds");
    assert.equal(conflicts.length, 1, "exactly one concurrent start conflicts");
    assert.equal(conflicts[0]?.sqlState, "23505");

    await requireSuccess(
      `do $$ begin
        if (select count(*) from public.game_sessions
            where campaign_id = '${CAMPAIGN_ID}' and ended_at is null) <> 1 then
          raise exception 'wrong active session count';
        end if;
      end $$;`,
      "active session invariant",
    );
    console.log(JSON.stringify({ successfulStarts: 1, conflicts: 1, result: "PASS" }));
  } finally {
    await requireSuccess(
      `delete from public.campaigns where id = '${CAMPAIGN_ID}'::uuid;
       delete from auth.users where id = '${GM_ID}'::uuid;`,
      "fixture cleanup",
    );
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
