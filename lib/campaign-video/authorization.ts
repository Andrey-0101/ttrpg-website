import {
  CAMPAIGN_VIDEO_MAX_PLAYERS,
  type AuthorizedCampaignVideoParticipant,
  type CampaignVideoJoinResult,
} from "./contracts";

export type CampaignVideoCampaignRecord = {
  id: string;
  status: string;
  gameMasterId: string;
};

export type CampaignVideoPlayerRecord = {
  displayOrder: number | null;
};

export type CampaignVideoPublicationRecord = {
  audioAllowed: boolean;
  videoAllowed: boolean;
};

export interface CampaignVideoAuthorizationDataSource {
  getAuthenticatedUserId(): Promise<string | null>;
  findCampaign(campaignId: string): Promise<CampaignVideoCampaignRecord | null>;
  findPlayer(
    campaignId: string,
    userId: string,
  ): Promise<CampaignVideoPlayerRecord | null>;
  findPlayerPublication(
    campaignId: string,
    userId: string,
  ): Promise<CampaignVideoPublicationRecord | null>;
}

export type CampaignVideoAuthorizationResult =
  | { ok: true; participant: AuthorizedCampaignVideoParticipant }
  | Extract<CampaignVideoJoinResult, { ok: false }>;

function denial(
  code: Extract<CampaignVideoJoinResult, { ok: false }>["error"]["code"],
): CampaignVideoAuthorizationResult {
  return { ok: false, error: { code } };
}

export async function authorizeCampaignVideoJoin(
  campaignId: string,
  dataSource: CampaignVideoAuthorizationDataSource,
): Promise<CampaignVideoAuthorizationResult> {
  const userId = await dataSource.getAuthenticatedUserId();
  if (!userId) {
    return denial("authentication_required");
  }

  const campaign = await dataSource.findCampaign(campaignId);
  if (!campaign || campaign.id !== campaignId) {
    return denial("campaign_inaccessible");
  }
  if (campaign.status !== "active") {
    return denial("campaign_inactive");
  }

  if (campaign.gameMasterId === userId) {
    return {
      ok: true,
      participant: {
        campaignId,
        userId,
        role: "game_master",
        playerPosition: null,
        publication: { audio: true, video: true },
      },
    };
  }

  const player = await dataSource.findPlayer(campaignId, userId);
  if (!player) {
    return denial("membership_required");
  }
  if (
    !Number.isInteger(player.displayOrder) ||
    player.displayOrder === null ||
    player.displayOrder < 1 ||
    player.displayOrder > CAMPAIGN_VIDEO_MAX_PLAYERS
  ) {
    return denial("invalid_player_state");
  }

  const publication = await dataSource.findPlayerPublication(campaignId, userId);
  if (
    publication &&
    (typeof publication.audioAllowed !== "boolean" ||
      typeof publication.videoAllowed !== "boolean")
  ) {
    return denial("invalid_player_state");
  }

  return {
    ok: true,
    participant: {
      campaignId,
      userId,
      role: "player",
      playerPosition: player.displayOrder,
      publication: {
        audio: publication?.audioAllowed ?? true,
        video: publication?.videoAllowed ?? true,
      },
    },
  };
}
