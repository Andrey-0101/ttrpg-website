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
  gameMasterFallback: string;
  playerFallback: string;
};

type LoadCampaignParticipantDirectoryOptions = {
  supabase: SupabaseServerClient;
  campaignId: string;
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
  const profilesResult =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, username")
          .in("id", profileIds)
      : { data: [], error: null };
  const profiles = profilesResult.data ?? [];
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
      displayName: gameMasterName,
      role: "game_master",
      playerPosition: null,
      isCurrentUser: gameMasterId === currentUserId,
    },
    ...members.map((member) => ({
      providerIdentity: deriveCampaignVideoParticipantIdentity(
        campaignId,
        member.userId,
      ),
      displayName:
        member.userId === currentUserId
          ? labels.you
          : member.displayName || member.username || labels.playerFallback,
      role: "player" as const,
      playerPosition: member.displayOrder,
      isCurrentUser: member.userId === currentUserId,
    })),
  ];

  return {
    ready: !membersResult.error && !profilesResult.error,
    members,
    profiles,
    gameMasterName,
    participantDirectory,
  };
}
