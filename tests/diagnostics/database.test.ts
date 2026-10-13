import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
// This runner can ONLY address the repository's local Docker container, never a URL.
const CONTAINER = "supabase_db_ttrpg-website";
const campaign = "9d000000-0000-4000-8000-000000000001",
  otherCampaign = "9d000000-0000-4000-8000-000000000002";
const gm = "9d000000-0000-4000-8000-000000000003",
  player = "9d000000-0000-4000-8000-000000000004",
  outsider = "9d000000-0000-4000-8000-000000000005";
const gmSession = "9d000000-0000-4000-8000-000000000006",
  playerSession = "9d000000-0000-4000-8000-000000000007",
  outsiderSession = "9d000000-0000-4000-8000-000000000008";
let assertions = 0;
async function localStorageClients() {
  const status = await new Promise<string>((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "cmd.exe" : "npx",
      process.platform === "win32"
        ? ["/d", "/s", "/c", "npx --yes supabase@latest status --output json"]
        : ["--yes", "supabase@latest", "status", "--output", "json"],
      { stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
    );
    let output = "";
    const timer = setTimeout(() => child.kill(), 30000);
    child.stdout.on("data", (chunk) => (output += String(chunk)));
    child.on("error", () => {
      clearTimeout(timer);
      reject(new Error("Local status unavailable"));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else reject(new Error("Local status unavailable"));
    });
  });
  const config = JSON.parse(status) as Record<string, string>;
  assert.ok(
    config.API_URL === "http://127.0.0.1:55321" || config.API_URL === "http://localhost:55321",
    "Refuse non-local Storage API",
  );
  assert.ok(config.SERVICE_ROLE_KEY && config.ANON_KEY);
  return {
    admin: createClient(config.API_URL, config.SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    anon: createClient(config.API_URL, config.ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}
async function sql(query: string) {
  return new Promise<{ ok: boolean; output: string; error: string }>((resolve) => {
    const child = spawn(
      "docker",
      [
        "exec",
        "-i",
        CONTAINER,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-X",
        "-q",
        "-t",
        "-A",
        "-v",
        "ON_ERROR_STOP=1",
      ],
      { stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
    );
    let output = "",
      error = "";
    const timer = setTimeout(() => child.kill(), 30000);
    child.stdout.on("data", (chunk) => (output += String(chunk)));
    child.stderr.on("data", (chunk) => (error += String(chunk)));
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ ok: false, output, error: e.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output: output.trim(), error });
    });
    child.stdin.end(`set statement_timeout='25s';\n${query}`);
  });
}
async function yes(query: string, label: string) {
  const r = await sql(query);
  assert.equal(r.ok, true, `${label}: ${r.error}`);
  assertions++;
  return r.output;
}
async function no(query: string, code: string) {
  const r = await sql(query);
  assert.equal(r.ok, false);
  assert.match(r.error, new RegExp(code));
  assertions++;
}
function rpc(
  actor: string,
  session: string,
  operation: string,
  run: string | null = null,
  input: Record<string, unknown> = {},
  context = campaign,
) {
  return `select public.diagnostic_dispatch('${actor}','${session}','${operation}','${context}',${run ? `'${run}'` : "null"},'${JSON.stringify(input)}'::jsonb);`;
}
async function call(
  actor: string,
  session: string,
  operation: string,
  run: string | null = null,
  input: Record<string, unknown> = {},
  context = campaign,
) {
  return JSON.parse(await yes(rpc(actor, session, operation, run, input, context), operation));
}
async function fixtures(remove = false) {
  await yes(
    `delete from public.game_room_diagnostic_runs where campaign_id in ('${campaign}','${otherCampaign}') or owner_id in ('${gm}','${player}','${outsider}');
    delete from public.campaigns where id in ('${campaign}','${otherCampaign}');delete from auth.users where id in ('${gm}','${player}','${outsider}');`,
    "local fixture cleanup",
  );
  if (remove) return;
  await yes(
    `insert into auth.users(id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
    ('${gm}','authenticated','authenticated','diagnostic-gm@example.test','','{}','{}',now(),now()),
    ('${player}','authenticated','authenticated','diagnostic-player@example.test','','{}','{}',now(),now()),
    ('${outsider}','authenticated','authenticated','diagnostic-outsider@example.test','','{}','{}',now(),now());
    insert into auth.sessions(id,user_id,created_at,updated_at,aal) values('${gmSession}','${gm}',now(),now(),'aal1'),('${playerSession}','${player}',now(),now(),'aal1'),('${outsiderSession}','${outsider}',now(),now(),'aal1');
    insert into public.campaigns(id,game_master_id,game_system,name) values('${campaign}','${gm}','coc-7e','LOCAL diagnostics test'),('${otherCampaign}','${gm}','coc-7e','LOCAL diagnostics second');
    insert into public.campaign_members(campaign_id,user_id,display_order) values('${campaign}','${player}',1);`,
    "local fixture setup",
  );
}
async function main() {
  const storage = await localStorageClients();
  const paths: string[] = [];
  await fixtures();
  try {
    assert.equal((await call(gm, gmSession, "capability")).developer, false);
    await no(rpc(gm, gmSession, "start"), "developer_gm_required");
    await no(
      `begin;set local role authenticated;set local request.jwt.claim.sub='${gm}';insert into public.system_user_roles(user_id,role) values('${gm}','developer');commit;`,
      "permission denied",
    );
    await no(
      `begin;set local role authenticated;${rpc(gm, gmSession, "capability")}commit;`,
      "permission denied",
    );
    await yes(
      `insert into public.system_user_roles(user_id,role) values('${gm}','developer');`,
      "local role grant",
    );
    await no(rpc(player, playerSession, "start"), "developer_gm_required");
    await no(rpc(outsider, outsiderSession, "state"), "campaign_unavailable");
    await no(rpc(gm, outsiderSession, "capability"), "authentication_required");
    const starts = await Promise.all(Array.from({ length: 4 }, () => call(gm, gmSession, "start")));
    const run = starts[0].id as string;
    assert.ok(starts.every((r) => r.id === run));
    assert.equal(starts[0].owner_session_hash, undefined);
    assertions++;
    assert.equal(
      await yes(
        `begin;set local role authenticated;set local request.jwt.claim.sub='${player}';select count(id) from public.game_room_diagnostic_runs where id='${run}';commit;`,
        "participant control fields readable through RLS",
      ),
      "1",
    );
    assert.equal(
      await yes(
        `begin;set local role authenticated;set local request.jwt.claim.sub='${outsider}';select count(id) from public.game_room_diagnostic_runs where id='${run}';commit;`,
        "outsider control fields hidden through RLS",
      ),
      "0",
    );
    await no(
      `begin;set local role authenticated;select owner_session_hash from public.game_room_diagnostic_runs;commit;`,
      "permission denied",
    );
    await no(
      `begin;set local role authenticated;select * from public.game_room_diagnostic_runs;commit;`,
      "permission denied",
    );
    await no(rpc(gm, gmSession, "start", null, {}, otherCampaign), "run_conflict");
    const instance = "9d000000-0000-4000-8000-000000000009";
    const segment = await call(player, playerSession, "join", run, { instance });
    assert.equal((await call(player, playerSession, "join", run, { instance })).id, segment.id);
    const raw = Buffer.from(
      JSON.stringify({
        schema: 1,
        segment: segment.id,
        sequence: 0,
        records: [
          {
            kind: "connection",
            seq: 0,
            mono_ms: 1,
            wall_ms: Date.now(),
            server_ms: Date.now(),
            uncertainty_ms: 1,
            state: "connected",
            candidate_type: null,
            protocol: null,
            candidate_state: null,
            metrics: {},
          },
        ],
      }),
    );
    const compressed = gzipSync(raw);
    const input = {
      segment: segment.id,
      epoch: segment.epoch,
      sequence: 0,
      sha256: createHash("sha256").update(compressed).digest("hex"),
      compressed_bytes: compressed.length,
      expanded_bytes: raw.length,
      record_count: 1,
      first_record_sequence: 0,
      last_record_sequence: 0,
      progress_at: new Date().toISOString(),
    };
    await call(player, playerSession, "heartbeat", run, {
      segment: segment.id,
      epoch: segment.epoch,
    });
    assert.equal(
      await yes(
        `select valid_progress_at is null from public.game_room_diagnostic_clients where id='${segment.id}';`,
        "ACK not progress",
      ),
      "t",
    );
    await no(
      rpc(player, playerSession, "reserve", run, { ...input, first_record_sequence: 1 }),
      "sequence_conflict",
    );
    const reserved = await call(player, playerSession, "reserve", run, input);
    paths.push(reserved.storage_path);
    const uploaded = await storage.admin.storage
      .from("game-room-diagnostics")
      .upload(reserved.storage_path, compressed, {
        contentType: "application/gzip",
        upsert: false,
      });
    assert.equal(uploaded.error, null, "local Storage upload");
    assertions++;
    assert.ok(
      (await storage.anon.storage.from("game-room-diagnostics").download(reserved.storage_path))
        .error,
      "private bucket denies anonymous download",
    );
    assertions++;
    const downloaded = await storage.admin.storage
      .from("game-room-diagnostics")
      .download(reserved.storage_path);
    assert.equal(downloaded.error, null);
    assert.equal(
      createHash("sha256")
        .update(Buffer.from(await downloaded.data!.arrayBuffer()))
        .digest("hex"),
      input.sha256,
    );
    assertions++;
    assert.equal((await call(player, playerSession, "reserve", run, input)).id, reserved.id);
    await no(
      rpc(player, playerSession, "reserve", run, { ...input, sha256: "b".repeat(64) }),
      "chunk_conflict",
    );
    await call(player, playerSession, "accept", run, {
      segment: segment.id,
      epoch: segment.epoch,
      chunk: reserved.id,
    });
    await call(player, playerSession, "accept", run, {
      segment: segment.id,
      epoch: segment.epoch,
      chunk: reserved.id,
    });
    assert.equal(
      await yes(
        `select next_sequence=1 and valid_progress_at is not null from public.game_room_diagnostic_clients where id='${segment.id}';`,
        "accepted cursor",
      ),
      "t",
    );
    const newer = await call(player, playerSession, "join", run, {
      instance: "9d000000-0000-4000-8000-000000000010",
    });
    assert.equal(newer.alias, segment.alias);
    assert.equal(newer.epoch, 2);
    await no(
      rpc(player, playerSession, "heartbeat", run, { segment: segment.id, epoch: 1 }),
      "segment_fenced",
    );
    const stopped = await call(gm, gmSession, "stop", run);
    const stoppedAgain = await call(gm, gmSession, "stop", run);
    assert.equal(stopped.stop_deadline, stoppedAgain.stop_deadline);
    assert.equal(Date.parse(stopped.stop_deadline) - Date.parse(stopped.stopped_at), 30000);
    await no(
      rpc(player, playerSession, "join", run, { instance: "9d000000-0000-4000-8000-000000000011" }),
      "collection_closed",
    );
    await call(player, playerSession, "final", run, {
      segment: newer.id,
      epoch: 2,
      next_sequence: 0,
    });
    await call(player, playerSession, "final", run, {
      segment: newer.id,
      epoch: 2,
      next_sequence: 0,
    });
    const ready = await call(gm, gmSession, "export", run);
    assert.equal(ready.state, "ready");
    assert.equal(ready.partial, true);
    assert.equal(Date.parse(ready.expires_at) - Date.parse(ready.completed_at), 43_200_000);
    assert.equal((await call(gm, gmSession, "export", run)).expires_at, ready.expires_at);
    await no(rpc(player, playerSession, "export", run), "developer_gm_required");
    await call(gm, gmSession, "request_cleanup", run);
    await no(rpc(gm, gmSession, "export", run), "export_unavailable");
    const claims = JSON.parse(
      await yes(
        `select coalesce(jsonb_agg(ch),'[]') from public.diagnostic_cleanup_claim('${run}') ch;`,
        "claim registered",
      ),
    );
    assert.equal(claims.length, 1);
    await yes(
      `update public.game_room_diagnostic_chunks set cleanup_lease_until=now()-interval '1 second' where run_id='${run}';`,
      "retry failed Storage pass",
    );
    const retry = JSON.parse(
      await yes(
        `select jsonb_agg(ch) from public.diagnostic_cleanup_claim('${run}') ch;`,
        "retry claim",
      ),
    );
    assert.equal(
      await yes(
        `select public.diagnostic_cleanup_ack('${reserved.id}','${claims[0].cleanup_token}');`,
        "stale ACK",
      ),
      "f",
    );
    assert.equal(
      (await storage.admin.storage.from("game-room-diagnostics").remove([reserved.storage_path]))
        .error,
      null,
      "Storage deletion before registry ACK",
    );
    assertions++;
    assert.equal(
      (await storage.admin.storage.from("game-room-diagnostics").remove([reserved.storage_path]))
        .error,
      null,
      "idempotent missing-object deletion",
    );
    assertions++;
    assert.ok(
      (await storage.admin.storage.from("game-room-diagnostics").download(reserved.storage_path))
        .error,
      "object actually absent",
    );
    assertions++;
    assert.equal(
      await yes(
        `select public.diagnostic_cleanup_ack('${reserved.id}','${retry[0].cleanup_token}');`,
        "successful Storage ACK",
      ),
      "t",
    );
    await yes("select public.diagnostic_cleanup_sweep();", "registry convergence");
    assert.equal(
      await yes(
        `select count(*) from public.game_room_diagnostic_runs where id='${run}';`,
        "metadata removed",
      ),
      "0",
    );
    const quota = await call(gm, gmSession, "start");
    const qSegment = await call(player, playerSession, "join", quota.id, { instance });
    const gmSegment = await call(gm, gmSession, "join", quota.id, { instance });
    await yes(
      `update public.game_room_diagnostic_runs set reserved_bytes=268435456-${compressed.length} where id='${quota.id}';`,
      "local quota edge",
    );
    const race = await Promise.all([
      call(player, playerSession, "reserve", quota.id, {
        ...input,
        segment: qSegment.id,
        epoch: qSegment.epoch,
      }),
      call(gm, gmSession, "reserve", quota.id, {
        ...input,
        segment: gmSegment.id,
        epoch: gmSegment.epoch,
      }),
    ]);
    assert.equal(race.filter((result) => result.error === "run_limit").length, 1);
    assert.equal(race.filter((result) => result.id).length, 1);
    assert.equal(
      await yes(
        `select reserved_bytes from public.game_room_diagnostic_runs where id='${quota.id}';`,
        "atomic quota ceiling",
      ),
      "268435456",
    );
    assert.equal((await call(gm, gmSession, "state", quota.id)).stop_reason, "quota");
    await yes(
      `update public.game_room_diagnostic_runs set stop_deadline=now()-interval '1 second' where id='${quota.id}';`,
      "advance local deadline",
    );
    const complete = await call(gm, gmSession, "state", quota.id);
    assert.equal(complete.state, "ready");
    await no(
      rpc(player, playerSession, "reserve", quota.id, { ...input, segment: qSegment.id }),
      "collection_closed",
    );
    await yes(
      `update public.game_room_diagnostic_runs set completed_at=now()-interval '13 hours',expires_at=now()-interval '1 hour' where id='${quota.id}';`,
      "advance local TTL",
    );
    await no(rpc(gm, gmSession, "export", quota.id), "export_unavailable");
    const expired = JSON.parse(
      await yes(
        `select jsonb_agg(ch) from public.diagnostic_cleanup_claim('${quota.id}') ch;`,
        "expired reservation cleanup",
      ),
    );
    for (const ch of expired) {
      assert.equal(
        (await storage.admin.storage.from("game-room-diagnostics").remove([ch.storage_path])).error,
        null,
      );
      await yes(
        `select public.diagnostic_cleanup_ack('${ch.id}','${ch.cleanup_token}');`,
        "missing reserved object ACK",
      );
    }
    await yes("select public.diagnostic_cleanup_sweep();", "expired registry cleanup");
    const revoke = await call(gm, gmSession, "start");
    await yes(
      `update public.system_user_roles set revoked_at=now() where user_id='${gm}';`,
      "revoke developer",
    );
    await no(rpc(gm, gmSession, "stop", revoke.id), "developer_gm_required");
    assert.equal(
      await yes(
        `select state from public.game_room_diagnostic_runs where id='${revoke.id}';`,
        "revocation stops run",
      ),
      "stopping",
    );
    await yes(
      `do $$ begin if not exists(select 1 from pg_extension where extname='pg_net') then raise exception 'pg_net missing';end if;
    if not exists(select 1 from cron.job where jobname='cleanup-diagnostic-artifacts' and schedule='*/5 * * * *' and command='select private.enqueue_diagnostic_cleanup();') then raise exception 'cleanup cron missing';end if;
    if has_function_privilege('authenticated','public.diagnostic_cleanup_claim(uuid)','execute') then raise exception 'cleanup exposed';end if;
    if has_table_privilege('authenticated','public.game_room_diagnostic_clients','select') then raise exception 'registry exposed';end if;
    if has_column_privilege('authenticated','public.game_room_diagnostic_runs','owner_session_hash','select') then raise exception 'session provenance exposed';end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='game_room_diagnostic_runs' and attnames=array['id','campaign_id','state','revision']::name[]) then raise exception 'bounded control Realtime missing';end if;end $$;`,
      "local schema/security/cron",
    );
    console.log(
      `PASS: diagnostics local DB integration (${assertions} assertions/checks). No remote database accessed.`,
    );
  } finally {
    if (paths.length) {
      const removed = await storage.admin.storage.from("game-room-diagnostics").remove(paths);
      assert.equal(removed.error, null, "local fixture Storage cleanup");
    }
    await fixtures(true);
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "diagnostic test failure");
  process.exitCode = 1;
});
