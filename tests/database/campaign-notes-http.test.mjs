import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";

// Explicitly local-only. Requires the app running against this local Supabase.
const command = process.platform === "win32" ? "cmd.exe" : "sh";
const flag = process.platform === "win32" ? "/c" : "-c";
const local = JSON.parse(
  execFileSync(command, [flag, "npx --yes supabase@latest status -o json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
assert.equal(local.API_URL, "http://127.0.0.1:55321");
const app = "http://127.0.0.1:3002";
const users = [];
const password = "LocalNotes-Http-2026!";
async function user(label) {
  const email = `notes-http-${label}-${randomUUID()}@example.test`;
  const response = await fetch(local.API_URL + "/auth/v1/admin/users", {
    method: "POST",
    headers: {
      apikey: local.ANON_KEY,
      Authorization: `Bearer ${local.SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  assert.equal(response.status, 200);
  const created = await response.json();
  users.push(created.id);
  let cookies = [];
  const client = createServerClient(local.API_URL, local.ANON_KEY, {
    cookies: {
      getAll: () => [],
      setAll: (items) => {
        cookies = items;
      },
    },
  });
  const auth = await client.auth.signInWithPassword({ email, password });
  assert.equal(auth.error, null);
  return {
    id: created.id,
    token: auth.data.session.access_token,
    cookie: cookies.map((item) => `${item.name}=${item.value}`).join("; "),
  };
}
async function rest(path, actor, method = "GET", body) {
  return fetch(local.API_URL + "/rest/v1/" + path, {
    method,
    headers: {
      apikey: local.ANON_KEY,
      Authorization: `Bearer ${actor.token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function request(path, actor, body) {
  return fetch(app + path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(actor ? { Cookie: actor.cookie } : {}),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
try {
  const gm = await user("gm");
  const player = await user("player");
  const outsider = await user("outsider");
  const campaignResponse = await rest("campaigns", gm, "POST", {
    name: "Local HTTP Notes",
    game_system: "vtm-v5",
    game_master_id: gm.id,
  });
  assert.equal(campaignResponse.status, 201);
  const campaign = (await campaignResponse.json())[0].id;
  const sql = spawnSync(
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
      "-q",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    {
      input: `insert into public.campaign_members(campaign_id,user_id,display_order) values ('${campaign}','${player.id}',1);`,
      encoding: "utf8",
      windowsHide: true,
    },
  );
  assert.equal(sql.status, 0, sql.stderr);
  const path = `/api/campaigns/${campaign}/notes`;
  for (const actor of [gm, player]) {
    const created = await request(path, actor, {
      action: "create",
      body: `Private ${actor.id}`,
      timezone: "UTC",
    });
    assert.equal(created.status, 200);
    const state = await created.json();
    assert.equal(state.entries.length, 1);
    assert.match(state.entries[0].body, new RegExp(actor.id));
  }
  const playerRows = await (await request(path, player)).json();
  const noteId = playerRows.entries[0].id;
  assert.equal(
    (
      await request(path, gm, {
        action: "edit",
        id: noteId,
        body: "Forged",
        timezone: "UTC",
      })
    ).status,
    404,
  );
  assert.equal(
    (await request(path, gm, { action: "delete", id: noteId })).status,
    404,
  );
  for (const key of [
    "owner_id",
    "game_session_id",
    "created_at",
    "campaign_name_snapshot",
  ]) {
    assert.equal(
      (
        await request(path, player, {
          action: "create",
          body: "Forged",
          timezone: "UTC",
          [key]: gm.id,
        })
      ).status,
      400,
    );
  }
  const gmRead = await rest("campaign_note_entries?select=owner_id", gm);
  assert.equal(gmRead.status, 200);
  assert.deepEqual(await gmRead.json(), [{ owner_id: gm.id }]);
  const otherRead = await rest("campaign_note_entries?select=id", outsider);
  assert.deepEqual(await otherRead.json(), []);
  assert.equal(
    (
      await rest("campaign_note_entries?id=eq." + noteId, player, "PATCH", {
        body: "Direct forge",
      })
    ).status,
    403,
  );
  assert.equal((await request(path, outsider)).status, 404);
  assert.equal((await request(path)).status, 401);
  assert.equal(
    (
      await request(path, null, {
        action: "create",
        body: "No",
        timezone: "UTC",
      })
    ).status,
    401,
  );
  console.log(
    "PASS: Notes API/REST owner isolation, foreign-ID/metadata forgery, direct-write and anonymous denial",
  );
} finally {
  for (const id of users) {
    const response = await fetch(local.API_URL + "/auth/v1/admin/users/" + id, {
      method: "DELETE",
      headers: {
        apikey: local.ANON_KEY,
        Authorization: `Bearer ${local.SERVICE_ROLE_KEY}`,
      },
    });
    assert.equal(response.status, 200, "local fixture cleanup");
  }
}
