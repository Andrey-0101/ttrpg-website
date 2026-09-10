import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const DATABASE_CONTAINER = "supabase_db_ttrpg-website";
const CAMPAIGN_ID = "94000000-0000-4000-8000-000000000001";
const GM_ID = "94000000-0000-4000-8000-000000000002";
const PLAYER_ID = "94000000-0000-4000-8000-000000000003";
const CHARACTER_ID = "94000000-0000-4000-8000-000000000004";

type Result = { ok: boolean; sqlState: string | null; stderr: string };

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

async function requireSuccess(sql: string, label: string) {
  const result = await runPsql(sql);
  assert.equal(result.ok, true, `${label}: ${result.stderr}`);
}

function authenticatedSql(actorId: string, sql: string) {
  return `begin;
set local role authenticated;
set local request.jwt.claim.sub = '${actorId}';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"${actorId}","role":"authenticated"}';
${sql}
commit;`;
}

function recordSql(actorId: string, label: string) {
  return `begin;
set local role service_role;
select public.record_campaign_dice_roll(
  '${CAMPAIGN_ID}'::uuid,
  '${actorId}'::uuid,
  'vtm_v5',
  '{"pool":1,"hungerDice":0,"difficulty":null,"label":"${label}"}'::jsonb,
  '{"gameSystem":"vtm-v5","request":{"pool":1,"hungerDice":0,"difficulty":null,"label":"${label}"},"normalDice":[7],"hungerDiceResults":[],"summaryKey":"successes-counted"}'::jsonb
);
commit;`;
}

async function main() {
  await requireSuccess(
    `delete from public.characters where id = '${CHARACTER_ID}'::uuid;
delete from public.campaigns where id = '${CAMPAIGN_ID}'::uuid;
delete from auth.users where id in ('${GM_ID}'::uuid, '${PLAYER_ID}'::uuid);
insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('${GM_ID}', 'authenticated', 'authenticated', 'dice-gm@example.test', '', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('${PLAYER_ID}', 'authenticated', 'authenticated', 'dice-player@example.test', '', '{}'::jsonb, '{}'::jsonb, now(), now());
update public.profiles set display_name = 'Game Master Profile' where id = '${GM_ID}'::uuid;
update public.profiles set display_name = 'Player Profile' where id = '${PLAYER_ID}'::uuid;
insert into public.characters (id, owner_id, game_system, name)
values ('${CHARACTER_ID}', '${PLAYER_ID}', 'vtm-v5', 'Player Character');
insert into public.campaigns (id, game_master_id, game_system, name)
values ('${CAMPAIGN_ID}', '${GM_ID}', 'vtm-v5', 'Campaign Dice session');
insert into public.campaign_members (campaign_id, user_id)
values ('${CAMPAIGN_ID}', '${PLAYER_ID}');
insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('${CAMPAIGN_ID}', '${CHARACTER_ID}', '${PLAYER_ID}');`,
    "fixture setup",
  );

  try {
    await requireSuccess(
      `do $$ begin
        if (select count(*) from public.record_campaign_dice_roll(
          '${CAMPAIGN_ID}', '${GM_ID}', 'vtm_v5', '{}'::jsonb, '{}'::jsonb
        )) <> 0 then raise exception 'roll persisted without active session'; end if;
      end $$;`,
      "no-session roll is not persisted",
    );

    await requireSuccess(
      authenticatedSql(GM_ID, `select public.start_game_session('${CAMPAIGN_ID}'::uuid);`),
      "start session",
    );
    await requireSuccess(recordSql(GM_ID, "GM Roll"), "GM roll");
    await requireSuccess(recordSql(PLAYER_ID, "Player Roll"), "Player roll");

    await requireSuccess(
      `do $$ declare active_id uuid; begin
        select id into active_id from public.game_sessions
        where campaign_id = '${CAMPAIGN_ID}' and ended_at is null;
        if (select count(*) from public.game_session_journal_events where game_session_id = active_id) <> 2 then
          raise exception 'wrong Journal event count';
        end if;
        if not exists (
          select 1 from public.game_session_journal_events
          where game_session_id = active_id
            and event_data->>'actorDisplayName' = 'Game Master Profile'
            and event_data->>'characterId' is null
        ) then raise exception 'GM profile fallback missing'; end if;
        if not exists (
          select 1 from public.game_session_journal_events
          where game_session_id = active_id
            and event_data->>'actorDisplayName' = 'Player Character'
            and event_data->>'characterId' = '${CHARACTER_ID}'
        ) then raise exception 'player character identity missing'; end if;
      end $$;`,
      "session and identity associations",
    );

    const directForge = await runPsql(
      authenticatedSql(PLAYER_ID, `select public.record_campaign_dice_roll('${CAMPAIGN_ID}', '${PLAYER_ID}', 'vtm_v5', '{}'::jsonb, '{}'::jsonb);`),
    );
    assert.equal(directForge.ok, false, "authenticated client cannot call Journal writer");
    assert.equal(directForge.sqlState, "42501");

    await requireSuccess(
      authenticatedSql(GM_ID, `select public.end_game_session('${CAMPAIGN_ID}'::uuid);`),
      "end session",
    );
    await requireSuccess(
      `do $$ begin
        if (select count(*) from public.record_campaign_dice_roll(
          '${CAMPAIGN_ID}', '${GM_ID}', 'vtm_v5', '{}'::jsonb, '{}'::jsonb
        )) <> 0 then raise exception 'roll persisted after session end'; end if;
      end $$;`,
      "ended session rejects persistence",
    );

    console.log(JSON.stringify({ gmRolls: 1, playerRolls: 1, directForge: "blocked", result: "PASS" }));
  } finally {
    await requireSuccess(
      `delete from public.campaigns where id = '${CAMPAIGN_ID}'::uuid;
delete from public.characters where id = '${CHARACTER_ID}'::uuid;
delete from auth.users where id in ('${GM_ID}'::uuid, '${PLAYER_ID}'::uuid);`,
      "fixture cleanup",
    );
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
