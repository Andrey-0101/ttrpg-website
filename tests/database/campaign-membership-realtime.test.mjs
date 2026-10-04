import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Explicitly local-only: never use environment-provided remote credentials.
const status = JSON.parse(
  execFileSync(
    "cmd.exe",
    ["/d", "/s", "/c", "npx --yes supabase@latest status --output json"],
    { encoding: "utf8", windowsHide: true },
  ),
);
assert.equal(status.API_URL, "http://127.0.0.1:55321");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
const gm = createClient(status.API_URL, status.ANON_KEY, options);
const outsider = createClient(status.API_URL, status.ANON_KEY, options);
const campaignId = randomUUID();
const users = [];
const password = `${randomUUID()}Aa!7`;
const gmEvents = [];
const outsiderEvents = [];

function requireResult(result) {
  assert.equal(result.error, null, result.error?.message);
  return result.data;
}
async function subscribe(client, events) {
  const channel = client
    .channel(`membership-regression-${randomUUID()}`)
    .on("system", {}, (payload) => {
      if (payload.status === "error")
        console.error("Local Realtime system:", payload.message);
    })
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "campaign_membership_signals",
        filter: `campaign_id=eq.${campaignId}`,
      },
      (payload) => events.push(payload),
    );
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Realtime subscription timeout")),
      10_000,
    );
    channel.subscribe((state) => {
      if (state === "SUBSCRIBED") {
        clearTimeout(timeout);
        resolve();
      } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
        clearTimeout(timeout);
        reject(new Error(state));
      }
    });
  });
}
async function waitForRevision(revision) {
  const deadline = Date.now() + 10_000;
  while (!gmEvents.some((event) => event.new?.revision === revision)) {
    assert.ok(Date.now() < deadline, `Missing Realtime revision ${revision}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

try {
  for (const role of ["gm", "player", "outsider"]) {
    const email = `membership-${role}-${randomUUID()}@example.test`;
    const data = requireResult(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      }),
    );
    users.push(data.user.id);
    if (role !== "player")
      requireResult(
        await (role === "gm" ? gm : outsider).auth.signInWithPassword({
          email,
          password,
        }),
      );
  }
  requireResult(
    await admin
      .from("campaigns")
      .insert({
        id: campaignId,
        game_master_id: users[0],
        game_system: "coc_7e",
        name: "Local Realtime regression",
      }),
  );
  await Promise.all([
    subscribe(gm, gmEvents),
    subscribe(outsider, outsiderEvents),
  ]);
  const session = requireResult(await gm.auth.getSession()).session;
  assert.ok(session?.user.id === users[0]);
  requireResult(
    await admin
      .from("campaign_members")
      .insert({ campaign_id: campaignId, user_id: users[1], display_order: 6 }),
  );
  await waitForRevision(1);
  requireResult(
    await admin
      .from("campaign_members")
      .update({ display_order: 5 })
      .eq("campaign_id", campaignId)
      .eq("user_id", users[1]),
  );
  await waitForRevision(2);
  requireResult(
    await admin
      .from("campaign_members")
      .delete()
      .eq("campaign_id", campaignId)
      .eq("user_id", users[1]),
  );
  await waitForRevision(3);
  assert.deepEqual(
    gmEvents.map((event) => event.eventType),
    ["INSERT", "UPDATE", "UPDATE"],
  );
  for (const event of gmEvents)
    assert.deepEqual(Object.keys(event.new).sort(), [
      "campaign_id",
      "revision",
    ]);
  assert.equal(
    outsiderEvents.length,
    0,
    "outsider must not receive membership metadata",
  );
  console.log(
    "PASS: actual local Realtime delivered join/order/remove signals; outsider received none; payload contains no member IDs.",
  );
} finally {
  await Promise.all([gm.removeAllChannels(), outsider.removeAllChannels()]);
  requireResult(await admin.from("campaigns").delete().eq("id", campaignId));
  for (const userId of users)
    requireResult(await admin.auth.admin.deleteUser(userId));
  console.log("Local Realtime fixtures removed.");
}
