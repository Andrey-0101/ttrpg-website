export const CAMPAIGN_VIDEO_MAX_PARTICIPANTS = 7;
export const CAMPAIGN_VIDEO_MAX_PLAYERS = 6;
export const CAMPAIGN_VIDEO_TOKEN_TTL_SECONDS = 600;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CampaignVideoRole = "game_master" | "player";

export type CampaignVideoPublicationPermissions = {
  audio: boolean;
  video: boolean;
};

export type AuthorizedCampaignVideoParticipant = {
  campaignId: string;
  userId: string;
  role: CampaignVideoRole;
  playerPosition: number | null;
  publication: CampaignVideoPublicationPermissions;
};

export type CampaignVideoSafeErrorCode =
  | "malformed_request"
  | "authentication_required"
  | "campaign_inaccessible"
  | "campaign_inactive"
  | "membership_required"
  | "invalid_player_state"
  | "capacity_unavailable"
  | "configuration_unavailable"
  | "provider_unavailable"
  | "unexpected_error";

export type CampaignVideoSafeError = {
  code: CampaignVideoSafeErrorCode;
};

export type CampaignVideoJoinSuccess = {
  ok: true;
  connection: {
    url: string;
    token: string;
    expiresAt: string;
  };
  participant: {
    role: CampaignVideoRole;
    playerPosition: number | null;
    publication: CampaignVideoPublicationPermissions;
  };
};

export type CampaignVideoJoinResult =
  | CampaignVideoJoinSuccess
  | {
      ok: false;
      error: CampaignVideoSafeError;
    };

export function parseCampaignId(value: unknown): string | null {
  return typeof value === "string" && UUID_PATTERN.test(value)
    ? value.toLowerCase()
    : null;
}

export function parseCampaignVideoJoinBody(value: unknown): true | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return Object.keys(value).length === 0 ? true : null;
}
