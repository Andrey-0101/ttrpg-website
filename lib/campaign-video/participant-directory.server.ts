import "server-only";

import { deriveCampaignVideoParticipantIdentity } from "./mapping";
import { resolveCampaignVideoParticipantLabel } from "./participant-label";
import type { CampaignVideoParticipantDirectoryEntry } from "./browser/contracts";
import { createClient } from "../../utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type CampaignParticipant = {
  userId: string;
  displayName: string | null;
  username: string | null;
  joinedAt: string;
  displayOrder: number;
};

type ParticipantProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
};

type ParticipantDirectoryLabels = {
  you: string;
  gameMasterRole: string;
  gameMasterFallback: string;
  playerFallback: string;
};

type LoadCampaignParticipantDirectoryOptions = {
  supabase: SupabaseServerClient;
  campaignId: string;
  campaignGameSystem: string;
  gameMasterId: string;
  currentUserId: string;
  labels: ParticipantDirectoryLabels;
};

export type CampaignParticipantDirectoryResult = {
  ready: boolean;
  members: CampaignParticipant[];
  profiles: ParticipantProfile[];
  gameMasterName: string;
  participantDirectory: CampaignVideoParticipantDirectoryEntry[];
};

export async function loadCampaignParticipantDirectory({
  supabase,
  campaignId,
  campaignGameSystem,
  gameMasterId,
  currentUserId,
  labels,
}: LoadCampaignParticipantDirectoryOptions): Promise<CampaignParticipantDirectoryResult> {
  const membersResult = await supabase
    .from("campaign_members")
    .select("user_id, joined_at, display_order")
    .eq("campaign_id", campaignId)
    .order("display_order", { ascending: true });

  const membershipRows = membersResult.data ?? [];
  const profileIds = Array.from(
    new Set([gameMasterId, ...membershipRows.map((member) => member.user_id)]),
  );
  const [profilesResult, assignmentsResult] = await Promise.all([
    profileIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, display_name, username")
          .in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("campaign_characters")
      .select("character_id, linked_by, linked_at")
      .eq("campaign_id", campaignId)
      .is("unlinked_at", null)
      .order("linked_at", { ascending: true }),
  ]);
  const profiles = profilesResult.data ?? [];
  const assignmentRows = assignmentsResult.data ?? [];
  const characterIds = assignmentRows.map(
    (assignment) => assignment.character_id,
  );
  const charactersResult =
    characterIds.length > 0
      ? await supabase
          .from("characters")
          .select("id, name, game_system")
          .in("id", characterIds)
      : { data: [], error: null };
  const charactersById = new Map(
    (charactersResult.data ?? []).map((character) => [character.id, character]),
  );
  const linkedCharactersByUserId = new Map<
    string,
    Array<{ name: string; gameSystem: string }>
  >();

  for (const assignment of assignmentRows) {
    const character = charactersById.get(assignment.character_id);
    if (!character) continue;
    const linkedCharacters =
      linkedCharactersByUserId.get(assignment.linked_by) ?? [];
    linkedCharacters.push({
      name: character.name,
      gameSystem: character.game_system,
    });
    linkedCharactersByUserId.set(assignment.linked_by, linkedCharacters);
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const gameMasterProfile = profileById.get(gameMasterId);
  const gameMasterName =
    gameMasterId === currentUserId
      ? labels.you
      : gameMasterProfile?.display_name ||
        gameMasterProfile?.username ||
        labels.gameMasterFallback;
  const members = membershipRows.map((member) => {
    const profile = profileById.get(member.user_id);
    return {
      userId: member.user_id,
      displayName: profile?.display_name ?? null,
      username: profile?.username ?? null,
      joinedAt: member.joined_at,
      displayOrder: member.display_order,
    };
  });
  const participantDirectory: CampaignVideoParticipantDirectoryEntry[] = [
    {
      providerIdentity: deriveCampaignVideoParticipantIdentity(
        campaignId,
        gameMasterId,
      ),
      displayName: resolveCampaignVideoParticipantLabel({
        role: "game_master",
        campaignGameSystem,
        linkedCharacters: [],
        siteNickname: null,
        gameMasterLabel: labels.gameMasterRole,
        playerFallback: labels.playerFallback,
      }),
      role: "game_master",
      playerPosition: null,
      isCurrentUser: gameMasterId === currentUserId,
    },
    ...members.map((member) => ({
      providerIdentity: deriveCampaignVideoParticipantIdentity(
        campaignId,
        member.userId,
      ),
      displayName: resolveCampaignVideoParticipantLabel({
        role: "player",
        campaignGameSystem,
        linkedCharacters:
          linkedCharactersByUserId.get(member.userId) ?? [],
        siteNickname: member.displayName || member.username,
        gameMasterLabel: labels.gameMasterRole,
        playerFallback: labels.playerFallback,
      }),
      role: "player" as const,
      playerPosition: member.displayOrder,
      isCurrentUser: member.userId === currentUserId,
    })),
  ];

  return {
    ready:
      !membersResult.error &&
      !profilesResult.error &&
      !assignmentsResult.error &&
      !charactersResult.error,
    members,
    profiles,
    gameMasterName,
    participantDirectory,
  };
}
