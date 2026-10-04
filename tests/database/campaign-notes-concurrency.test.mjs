import assert from "node:assert/strict";
import { spawn } from "node:child_process";

// Local Docker only: these IDs never belong to Production.
const campaign = "97000000-0000-4000-8000-000000000010";
const gm = "97000000-0000-4000-8000-000000000001";
const player = "97000000-0000-4000-8000-000000000002";
function sql(query, onOutput = () => {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "exec",
        "-i",
        "supabase_db_ttrpg-website",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-X",
        "-qAt",
        "-v",
        "ON_ERROR_STOP=1",
      ],
      { windowsHide: true },
    );
    let output = "";
    let error = "";
    const timer = setTimeout(() => child.kill(), 30000);
    child.stdout.on("data", (chunk) => {
      output += chunk;
      onOutput(output);
    });
    child.stderr.on("data", (chunk) => {
      error += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output, error });
    });
    child.stdin.end(`set statement_timeout='25s';\n${query}`);
  });
}
async function success(query) {
  const result = await sql(query);
  assert.ok(result.ok, result.error);
  return result;
}
const auth = (id) =>
  `set local role authenticated; set local request.jwt.claim.sub='${id}';`;
try {
  await success(`insert into auth.users(id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
    values ('${gm}','authenticated','authenticated','notes-race-gm@example.test','','{}','{}',now(),now()),
    ('${player}','authenticated','authenticated','notes-race-player@example.test','','{}','{}',now(),now());
    insert into public.campaigns(id,game_master_id,game_system,name) values ('${campaign}','${gm}','vtm-v5','Notes race');
    insert into public.campaign_members(campaign_id,user_id,display_order) values ('${campaign}','${player}',1);`);
  let signal;
  const locked = new Promise((resolve) => {
    signal = resolve;
  });
  const completion = sql(
    `begin; ${auth(gm)}
    update public.campaigns set status='completed' where id='${campaign}';
    select 'COMPLETION_LOCK_HELD'; select pg_sleep(2); commit;`,
    (output) => {
      if (output.includes("COMPLETION_LOCK_HELD")) signal();
    },
  );
  await Promise.race([
    locked,
    completion.then((result) => {
      throw new Error(`Completion did not acquire lock: ${result.error}`);
    }),
  ]);
  const write = sql(
    `begin; ${auth(player)} select public.mutate_campaign_note('${campaign}','create',null,'Must not save','UTC'); commit;`,
  );
  const [completed, note] = await Promise.all([completion, write]);
  assert.ok(completed.ok, completed.error);
  assert.equal(note.ok, false);
  assert.match(note.error, /campaign_notes_read_only/);
  assert.equal(
    (
      await success(
        `select count(*) from public.campaign_note_entries where campaign_id='${campaign}';`,
      )
    ).output.trim(),
    "0",
  );
  console.log(
    "PASS: completion lock race denies Notes write after campaign completion",
  );
} finally {
  await success(
    `delete from public.campaigns where id='${campaign}'; delete from auth.users where id in ('${gm}','${player}');`,
  );
}
