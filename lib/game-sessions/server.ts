import { createClient } from "@/utils/supabase/server";

import type {
  ActiveGameSession,
  GameSessionAction,
  GameSessionApiResult,
  GameSessionJournalEvent,
} from "./contracts";

const HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
} as const;

const ERROR_STATUS = {
  malformed_request: 400,
  authentication_required: 401,
  campaign_inaccessible: 404,
  game_session_not_available: 403,
  game_session_not_active: 409,
  game_session_conflict: 409,
  unexpected_error: 500,
} as const;

function json(result: GameSessionApiResult): Response {
  return Response.json(result, {
    status: result.ok ? 200 : ERROR_STATUS[result.error.code],
    headers: HEADERS,
  });
}

function failure(
  code: Extract<GameSessionApiResult, { ok: false }>["error"]["code"],
): Response {
  return json({ ok: false, error: { code } });
}

function safeRpcError(error: { code?: string; message?: string }): Response {
  if (error.code === "23505") return failure("game_session_conflict");
  if (error.message === "game_session_not_available") {
    return failure("game_session_not_available");
  }
  if (error.message === "game_session_not_active") {
    return failure("game_session_not_active");
  }
  if (error.message === "authentication_required") {
    return failure("authentication_required");
  }
  return failure("unexpected_error");
}

async function readState(
  campaignId: string,
): Promise<GameSessionApiResult> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    return { ok: false, error: { code: "authentication_required" } };
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError || !campaign) {
    return { ok: false, error: { code: "campaign_inaccessible" } };
  }

  const { data: row, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, campaign_id, started_at, presence_expires_at")
    .eq("campaign_id", campaignId)
    .is("ended_at", null)
    .gt("presence_expires_at", new Date().toISOString())
    .maybeSingle();
  if (sessionError) {
    console.error("Failed to read the active campaign game session.");
    return { ok: false, error: { code: "unexpected_error" } };
  }

  const session: ActiveGameSession | null = row
    ? {
        id: row.id,
        campaignId: row.campaign_id,
        startedAt: row.started_at,
        presenceExpiresAt: row.presence_expires_at,
      }
    : null;
  if (!session) return { ok: true, session: null, journal: [] };

  const { data: eventRows, error: journalError } = await supabase
    .from("game_session_journal_events")
    .select("id, event_kind, schema_version, event_data, created_at")
    .eq("game_session_id", session.id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (journalError) {
    console.error("Failed to read the active game session Journal.");
    return { ok: false, error: { code: "unexpected_error" } };
  }

  const journal: GameSessionJournalEvent[] = (eventRows ?? []).map((event) => ({
    id: event.id,
    eventKind: event.event_kind,
    schemaVersion: event.schema_version,
    eventData: event.event_data as Record<string, unknown>,
    createdAt: event.created_at,
  }));
  return { ok: true, session, journal };
}

export async function getGameSessionState(campaignId: string): Promise<Response> {
  return json(await readState(campaignId));
}

export async function mutateGameSession(
  campaignId: string,
  action: GameSessionAction,
): Promise<Response> {
  const supabase = await createClient();
  const functionName = {
    start: "start_game_session",
    end: "end_game_session",
    renew: "renew_game_session_presence",
  } as const;
  const { error } = await supabase.rpc(functionName[action], {
    target_campaign_id: campaignId,
  });
  if (error) {
    console.error(`Game session ${action} request failed safely.`);
    return safeRpcError(error);
  }
  return json(await readState(campaignId));
}
