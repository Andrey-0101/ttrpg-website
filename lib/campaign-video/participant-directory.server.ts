import "server-only";

import { deriveCampaignVideoParticipantIdentity } from "./mapping";
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
    supabase.rpc("get_campaign_video_character_names", {
      target_campaign_id: campaignId,
    }),
  ]);
  const profiles = profilesResult.data ?? [];
  const characterNamesByUserId = new Map(
    (assignmentsResult.data ?? []).map((entry) => [entry.participant_id, entry.character_name]),
  );

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
      profileName: gameMasterProfile?.display_name ?? null,
      characterName: null,
      role: "game_master",
      playerPosition: null,
      isCurrentUser: gameMasterId === currentUserId,
    },
    ...members.map((member) => ({
      providerIdentity: deriveCampaignVideoParticipantIdentity(
        campaignId,
        member.userId,
      ),
      profileName: member.displayName,
      characterName: characterNamesByUserId.get(member.userId) ?? null,
      role: "player" as const,
      playerPosition: member.displayOrder,
      isCurrentUser: member.userId === currentUserId,
    })),
  ];

  return {
    ready:
      !membersResult.error &&
      !profilesResult.error &&
      !assignmentsResult.error,
    members,
    profiles,
    gameMasterName,
    participantDirectory,
  };
}
