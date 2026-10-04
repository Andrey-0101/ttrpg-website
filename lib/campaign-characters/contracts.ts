import type { Database } from "../../types/database.types";

export type EditorCharacterData = Pick<
  Database["public"]["Tables"]["characters"]["Row"],
  "id" | "name" | "game_system" | "sheet_data" | "portrait_url"
> & { portraitSignedUrl: string | null };

export type GameRoomCharacterRow = {
  playerId: string;
  playerName: string | null;
  characterId: string | null;
  characterName: string | null;
  canOpen: boolean;
};

export type OpenGameRoomCharacter = {
  character: EditorCharacterData;
  readOnly: boolean;
  assignmentSessionLocked: boolean;
};

type Member = { userId: string; displayName: string | null; username: string | null };
type Assignment = { campaign_id: string; character_id: string; linked_by: string; unlinked_at: string | null };
type Character = { id: string; name: string; owner_id: string; game_system: string };

// Preserve the directory's ordering (the same display_order used by player slots).
export function buildGameRoomCharacterRows({
  campaignId, gameSystem, gameMasterId, currentUserId, members, assignments, characters,
}: {
  campaignId: string; gameSystem: string; gameMasterId: string; currentUserId: string;
  members: Member[]; assignments: Assignment[]; characters: Character[];
}): GameRoomCharacterRow[] {
  const byId = new Map(characters.map((character) => [character.id, character]));
  return members.filter((member) => member.userId !== gameMasterId).map((member) => {
    const active = assignments.filter((assignment) =>
      assignment.campaign_id === campaignId && assignment.linked_by === member.userId && assignment.unlinked_at === null,
    );
    // Fail closed on an invalid legacy relationship; never choose a winner.
    const candidate = active.length === 1 ? byId.get(active[0].character_id) : undefined;
    const character = candidate?.owner_id === member.userId && candidate.game_system === gameSystem
      ? candidate : null;
    return {
      playerId: member.userId,
      playerName: member.displayName || member.username || null,
      characterId: character?.id ?? null,
      characterName: character?.name ?? null,
      canOpen: Boolean(character && (currentUserId === gameMasterId || currentUserId === member.userId)),
    };
  });
}

export function campaignCharacterErrorKey(error: { message?: string } | null):
  "activeSession" | "oneCharacter" | "gameMasterForbidden" | null {
  const message = error?.message ?? "";
  if (message.includes("campaign_character_active_session")) return "activeSession";
  if (message.includes("campaign_characters_one_active_player_idx")) return "oneCharacter";
  if (message.includes("campaign_character_game_master")) return "gameMasterForbidden";
  return null;
}
