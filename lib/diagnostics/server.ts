import "server-only";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Database, Json } from "@/types/database.types";
import { deriveCampaignVideoParticipantIdentity } from "@/lib/campaign-video/mapping";
import {
  DIAGNOSTICS,
  UUID,
  diagnosticStatus,
  type BuildStamp,
  type DiagnosticRun,
  type DiagnosticState,
} from "./contracts";
import { object, validateChunk, freshProgress, boundedJson } from "./validation";
import { cleanupBatch, registeredPath } from "./cleanup";

export class DiagnosticError extends Error {
  constructor(
    public code: string,
    public status = 403,
  ) {
    super(code);
  }
}
const ERRORS = new Set([
  "authentication_required",
  "developer_required",
  "developer_gm_required",
  "campaign_unavailable",
  "run_unavailable",
  "run_conflict",
  "collection_closed",
  "segment_fenced",
  "sequence_conflict",
  "chunk_conflict",
  "chunk_unavailable",
  "export_unavailable",
  "run_limit",
  "upload_rate",
  "final_incomplete",
  "segment_limit",
]);
export function serverBuild(): BuildStamp {
  return {
    sha: /^[0-9a-f]{40}$/i.test(process.env.VERCEL_GIT_COMMIT_SHA ?? "")
      ? process.env.VERCEL_GIT_COMMIT_SHA!
      : null,
    deployment: /^dpl_[A-Za-z0-9]+$/.test(process.env.VERCEL_DEPLOYMENT_ID ?? "")
      ? process.env.VERCEL_DEPLOYMENT_ID!
      : null,
    environment:
      process.env.VERCEL_ENV === "production"
        ? "production"
        : process.env.VERCEL_ENV === "preview"
          ? "preview"
          : "development",
  };
}
export async function developerCapability(): Promise<boolean> {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return false;
  const result = await client
    .from("system_user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .is("revoked_at", null)
    .maybeSingle();
  return !result.error && result.data?.role === "developer";
}
export async function actor() {
  const client = await createClient();
  const [user, claims] = await Promise.all([client.auth.getUser(), client.auth.getClaims()]);
  const session = claims.data?.claims.session_id;
  if (
    user.error ||
    !user.data.user ||
    claims.error ||
    claims.data?.claims.sub !== user.data.user.id ||
    typeof session !== "string" ||
    !UUID.test(session)
  )
    throw new DiagnosticError("authentication_required", 401);
  return { id: user.data.user.id, session, client };
}
export type Actor = Awaited<ReturnType<typeof actor>>;
type RunRow = Database["public"]["Tables"]["game_room_diagnostic_runs"]["Row"];
export async function dispatch(
  who: Actor,
  operation: string,
  campaign: string | null,
  run: string | null,
  input: Json = {},
) {
  const result = await createAdminClient(5_000).rpc("diagnostic_dispatch", {
    actor_id: who.id,
    auth_session_id: who.session,
    operation,
    target_campaign: campaign ?? undefined,
    target_run: run ?? undefined,
    input,
  });
  if (result.error)
    throw new DiagnosticError(
      ERRORS.has(result.error.message) ? result.error.message : "diagnostics_unavailable",
      result.error.message === "run_conflict" ? 409 : 403,
    );
  if (object(result.data) && result.data.error === "run_limit")
    throw new DiagnosticError("run_limit");
  return result.data;
}
export function publicRun(row: RunRow): DiagnosticRun {
  const {
    id,
    campaign_id,
    campaign_name,
    state,
    started_at,
    stopped_at,
    stop_deadline,
    completed_at,
    expires_at,
    partial,
    revision,
    stop_reason,
  } = row;
  return {
    id,
    campaign_id: campaign_id ?? "",
    campaign_name,
    state: state as DiagnosticRun["state"],
    started_at,
    stopped_at,
    stop_deadline,
    completed_at,
    expires_at,
    partial,
    revision,
    stop_reason,
  };
}
export async function state(
  who: Actor,
  campaignId: string | null,
  runId: string | null,
  owner = false,
): Promise<DiagnosticState> {
  const capability = await dispatch(who, "capability", null, null);
  const developer = object(capability) && capability.developer === true;
  const raw = await dispatch(who, owner ? "owner" : "state", campaignId, runId);
  const row = object(raw) ? (raw as unknown as RunRow) : null;
  const contextId = row?.campaign_id ?? campaignId;
  if (!contextId)
    return {
      run: null,
      serverNow: Date.now(),
      developer,
      owner: false,
      canStart: false,
      active: false,
      campaignName: "",
      roster: [],
    };
  const result = await who.client
    .from("campaigns")
    .select("name,game_master_id,status")
    .eq("id", contextId)
    .maybeSingle();
  if (result.error || !result.data) throw new DiagnosticError("campaign_unavailable");
  const campaign = result.data;
  const members = await who.client
    .from("campaign_members")
    .select("user_id,display_order")
    .eq("campaign_id", contextId)
    .order("display_order");
  if (members.error) throw new DiagnosticError("diagnostics_unavailable");
  const entries = [
    { user_id: campaign.game_master_id, display_order: null },
    ...(members.data ?? []).filter((m) => m.user_id !== campaign.game_master_id),
  ];
  const profiles = await who.client
    .from("profiles")
    .select("id,display_name,username")
    .in(
      "id",
      entries.map((m) => m.user_id),
    );
  if (profiles.error) throw new DiagnosticError("diagnostics_unavailable");
  const clients = row
    ? await createAdminClient(5_000)
        .from("game_room_diagnostic_clients")
        .select(
          "id,instance_id,lease_until,user_id,alias,state,joined_at,heartbeat_at,visibility,valid_progress_at,checkpoint_at,error,epoch",
        )
        .eq("run_id", row.id)
        .in(
          "user_id",
          entries.map((m) => m.user_id),
        )
        .order("epoch", { ascending: false })
        .limit(1000)
    : null;
  if (clients?.error) throw new DiagnosticError("diagnostics_unavailable");
  const now = Date.now();
  const own = clients?.data?.find((c) => c.user_id === who.id);
  return {
    run: row ? publicRun(row) : null,
    serverNow: now,
    developer,
    owner: !!row && row.owner_id === who.id && developer,
    self: own
      ? {
          id: own.id,
          instance: own.instance_id,
          epoch: own.epoch,
          state: own.state,
          lease_until: own.lease_until,
        }
      : null,
    canStart: developer && campaign.game_master_id === who.id && campaign.status === "active",
    active: campaign.status === "active",
    campaignName: campaign.name,
    roster: entries.map((m) => {
      const profile = profiles.data?.find((p) => p.id === m.user_id);
      const segment = clients?.data?.find((c) => c.user_id === m.user_id);
      return {
        identity: deriveCampaignVideoParticipantIdentity(contextId, m.user_id),
        name: profile?.display_name || profile?.username || null,
        role: m.user_id === campaign.game_master_id ? "game_master" : "player",
        slot: m.display_order,
        alias: segment?.alias ?? null,
        status: diagnosticStatus(segment ?? null, now),
      };
    }),
  };
}
export async function limitedBody(request: Request, limit: number): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > limit || !request.body)
    throw new DiagnosticError("malformed_request", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > limit) throw new DiagnosticError("malformed_request", 413);
      chunks.push(next.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export function sameOrigin(request: Request) {
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new DiagnosticError("forbidden", 403);
}
export function responseError(error: unknown) {
  const known = error instanceof DiagnosticError;
  return Response.json(
    { error: known ? error.code : "diagnostics_unavailable" },
    { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } },
  );
}
export async function cleanup(onlyRun: string | null = null) {
  const admin = createAdminClient(5_000);
  const claimed = await admin.rpc("diagnostic_cleanup_claim", { only_run: onlyRun ?? undefined });
  if (claimed.error) throw new DiagnosticError("cleanup_unavailable", 503);
  const result = await cleanupBatch(claimed.data ?? [], {
    async remove(path) {
      const r = await admin.storage.from("game-room-diagnostics").remove([path]);
      return !r.error;
    },
    async acknowledge(id, token) {
      const r = await admin.rpc("diagnostic_cleanup_ack", { chunk_id: id, claim_token: token });
      return !r.error && r.data;
    },
  });
  const sweep = await admin.rpc("diagnostic_cleanup_sweep");
  return {
    ...result,
    registryRemoved: sweep.error ? 0 : sweep.data,
    pending:
      result.failed > 0 ||
      !!sweep.error ||
      (claimed.data?.length ?? 0) === DIAGNOSTICS.cleanupBatch,
  };
}
export async function upload(
  who: Actor,
  run: string,
  segment: string,
  epoch: number,
  bytes: Uint8Array,
) {
  let expanded: Buffer;
  try {
    expanded = gunzipSync(bytes, { maxOutputLength: DIAGNOSTICS.expandedChunkBytes });
  } catch {
    throw new DiagnosticError("malformed_chunk", 400);
  }
  let parsed: unknown;
  try {
    parsed = boundedJson(expanded.toString("utf8"));
  } catch {
    throw new DiagnosticError("malformed_chunk", 400);
  }
  const chunk = validateChunk(parsed, Date.now());
  if (!chunk || chunk.segment !== segment) throw new DiagnosticError("malformed_chunk", 400);
  const progress = freshProgress(chunk);
  const reserved = await dispatch(who, "reserve", null, run, {
    segment,
    epoch,
    sequence: chunk.sequence,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    compressed_bytes: bytes.length,
    expanded_bytes: expanded.length,
    record_count: chunk.records.length,
    first_record_sequence: chunk.records[0].seq,
    last_record_sequence: chunk.records.at(-1)!.seq,
    progress_at: progress === null ? null : new Date(progress).toISOString(),
  });
  if (
    !object(reserved) ||
    typeof reserved.id !== "string" ||
    typeof reserved.storage_path !== "string" ||
    !registeredPath(run, segment, reserved.id, reserved.storage_path)
  )
    throw new DiagnosticError("chunk_unavailable");
  if (reserved.state !== "accepted") {
    const saved = await createAdminClient(5_000)
      .storage.from("game-room-diagnostics")
      .upload(reserved.storage_path, bytes, { contentType: "application/gzip", upsert: false });
    // Same immutable path+hash reservation makes a duplicate upload safe to acknowledge.
    if (saved.error && String(saved.error.statusCode) !== "409")
      throw new DiagnosticError("upload_failed", 503);
  }
  return dispatch(who, "accept", null, run, { segment, epoch, chunk: reserved.id });
}
