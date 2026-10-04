import { createClient } from "@/utils/supabase/server";
import type { CampaignNote, NoteMutation, NotesResult } from "./contracts";

export function notesResponse(result: NotesResult, status = 200): Response {
  return Response.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function readCampaignNotes(campaignId: string): Promise<Response> {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const ownerId = claims?.claims?.sub;
  if (authError || !ownerId)
    return notesResponse({ ok: false, error: "authentication_required" }, 401);
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError || !campaign)
    return notesResponse({ ok: false, error: "campaign_inaccessible" }, 404);
  const entries: CampaignNote[] = [];
  // Load the entire journal, including beyond PostgREST's per-request row cap.
  // This is transport batching only: no pagination or partial journal in the UI.
  const batchSize = 500;
  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await supabase
      .from("campaign_note_entries")
      .select(
        "id, body, campaign_name_snapshot, created_at, created_timezone, edited_at, edited_timezone, game_session_id, game_sessions(session_number, title)",
      )
      .eq("campaign_id", campaignId)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + batchSize - 1);
    if (error) {
      console.error("Failed to read personal campaign Notes.");
      return notesResponse({ ok: false, error: "unexpected_error" }, 500);
    }
    entries.push(...(data ?? []));
    if (!data || data.length < batchSize) break;
  }
  return notesResponse({
    ok: true,
    entries,
    canWrite: campaign.status === "active",
  });
}
export async function mutateCampaignNotes(
  campaignId: string,
  mutation: NoteMutation,
): Promise<Response> {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims?.sub)
    return notesResponse({ ok: false, error: "authentication_required" }, 401);
  const { error } = await supabase.rpc("mutate_campaign_note", {
    target_campaign_id: campaignId,
    action: mutation.action,
    target_entry_id: mutation.action === "create" ? undefined : mutation.id,
    entry_body: mutation.action === "delete" ? undefined : mutation.body,
    entry_timezone:
      mutation.action === "delete" ? undefined : mutation.timezone,
  });
  if (error) {
    const known = [
      "authentication_required",
      "campaign_notes_read_only",
      "campaign_note_unavailable",
      "malformed_request",
    ];
    const code = known.includes(error.message)
      ? error.message
      : "unexpected_error";
    if (code === "unexpected_error")
      console.error("Personal campaign Notes mutation failed safely.");
    return notesResponse(
      { ok: false, error: code },
      code === "authentication_required"
        ? 401
        : code === "campaign_notes_read_only"
          ? 403
          : code === "campaign_note_unavailable"
            ? 404
            : code === "malformed_request"
              ? 400
              : 500,
    );
  }
  return readCampaignNotes(campaignId);
}
