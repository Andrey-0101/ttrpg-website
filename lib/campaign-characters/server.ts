import "server-only";

import { loadCampaignParticipantDirectory } from "../campaign-video/participant-directory.server";
import { getCharacterPortraitSignedUrl } from "../characters/portrait";
import { normalizeGameSystemId } from "../characters/game-systems";
import { createClient } from "../../utils/supabase/server";
import { buildGameRoomCharacterRows } from "./contracts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "private, no-store" };
const failure = (status: number) => Response.json({ ok: false }, { status, headers });

export async function getGameRoomCharacters(campaignId: string, playerId?: string): Promise<Response> {
  if (!UUID.test(campaignId) || (playerId && !UUID.test(playerId))) return failure(400);
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const currentUserId = claims?.claims?.sub;
  if (authError || !currentUserId) return failure(401);
  const { data: campaign, error: campaignError } = await supabase.from("campaigns")
    .select("id, game_master_id, game_system, status").eq("id", campaignId).maybeSingle();
  if (campaignError || !campaign) return failure(404);
  const directory = await loadCampaignParticipantDirectory({
    supabase, campaignId, campaignGameSystem: campaign.game_system,
    gameMasterId: campaign.game_master_id, currentUserId,
    labels: { you: "", gameMasterRole: "", gameMasterFallback: "", playerFallback: "" },
  });
  if (!directory.ready) return failure(503);
  const isGameMaster = campaign.game_master_id === currentUserId;
  if (!isGameMaster && !directory.members.some((member) => member.userId === currentUserId)) return failure(404);
  const { data: assignments, error: assignmentError } = await supabase.from("campaign_characters")
    .select("campaign_id, character_id, linked_by, unlinked_at")
    .eq("campaign_id", campaignId).is("unlinked_at", null);
  if (assignmentError) return failure(503);
  const ids = (assignments ?? []).map((assignment) => assignment.character_id);
  const characterResult = ids.length ? await supabase.from("characters")
    .select("id, name, owner_id, visibility, game_system").in("id", ids)
    : { data: [], error: null };
  if (characterResult.error) return failure(503);
  const rows = buildGameRoomCharacterRows({
    campaignId, gameSystem: campaign.game_system, gameMasterId: campaign.game_master_id,
    currentUserId, members: directory.members, assignments: assignments ?? [], characters: characterResult.data ?? [],
  });
  if (!playerId) return Response.json({ ok: true, rows }, { headers });
  const row = rows.find((entry) => entry.playerId === playerId);
  if (!row?.canOpen || !row.characterId || campaign.status !== "active") return failure(404);
  // Resolve through the player's CURRENT campaign assignment, never an arbitrary character ID.
  const { data: character, error: sheetError } = await supabase.from("characters")
    .select("id, name, owner_id, game_system, visibility, sheet_data, portrait_url")
    .eq("id", row.characterId).eq("owner_id", playerId)
    .eq("visibility", "campaign").eq("game_system", campaign.game_system).maybeSingle();
  if (sheetError || !character || !["vtm-v5", "call-of-cthulhu-7e"].includes(normalizeGameSystemId(character.game_system) ?? "")) return failure(404);
  // Recheck after reading the sheet in case the assignment closed between requests.
  const { data: currentAssignment, error: currentError } = await supabase.from("campaign_characters")
    .select("id").eq("campaign_id", campaignId).eq("linked_by", playerId)
    .eq("character_id", character.id).is("unlinked_at", null).maybeSingle();
  if (currentError || !currentAssignment) return failure(404);
  const portraitSignedUrl = await getCharacterPortraitSignedUrl(supabase, character.portrait_url);
  const assignmentSessionLocked = await isCharacterAssignmentSessionLocked(supabase, character.id);
  return Response.json({ ok: true, character: { ...character, portraitSignedUrl }, readOnly: character.owner_id !== currentUserId, assignmentSessionLocked }, { headers });
}

export async function isCharacterAssignmentSessionLocked(
  supabase: Awaited<ReturnType<typeof createClient>>, characterId: string,
): Promise<boolean> {
  const { data: assignments, error } = await supabase.from("campaign_characters")
    .select("campaign_id").eq("character_id", characterId).is("unlinked_at", null);
  if (error) return true;
  if (!assignments?.length) return false;
  const result = await supabase.from("game_sessions").select("id")
    .in("campaign_id", assignments.map((assignment) => assignment.campaign_id))
    .is("ended_at", null).gt("presence_expires_at", new Date().toISOString()).limit(1);
  return Boolean(result.error || result.data?.length);
}
