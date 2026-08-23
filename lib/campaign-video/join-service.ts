import {
  CAMPAIGN_VIDEO_MAX_PARTICIPANTS,
  CAMPAIGN_VIDEO_TOKEN_TTL_SECONDS,
  type AuthorizedCampaignVideoParticipant,
  type CampaignVideoJoinResult,
} from "./contracts";
import {
  deriveCampaignVideoParticipantIdentity,
  deriveCampaignVideoRoomName,
} from "./mapping";
import type { CampaignVideoProvider } from "./provider";
import { CampaignVideoProviderError } from "./provider";

export async function issueCampaignVideoCredentials(
  participant: AuthorizedCampaignVideoParticipant,
  provider: CampaignVideoProvider,
): Promise<CampaignVideoJoinResult> {
  const roomName = deriveCampaignVideoRoomName(participant.campaignId);
  const participantIdentity = deriveCampaignVideoParticipantIdentity(
    participant.campaignId,
    participant.userId,
  );

  try {
    await provider.ensureRoom({
      roomName,
      maxParticipants: CAMPAIGN_VIDEO_MAX_PARTICIPANTS,
    });
    const connection = await provider.mintConnectionCredentials({
      roomName,
      participantIdentity,
      role: participant.role,
      publication: participant.publication,
      ttlSeconds: CAMPAIGN_VIDEO_TOKEN_TTL_SECONDS,
    });
    return {
      ok: true,
      connection,
      participant: {
        role: participant.role,
        playerPosition: participant.playerPosition,
      },
    };
  } catch (error) {
    if (error instanceof CampaignVideoProviderError) {
      return { ok: false, error: { code: error.safeCode } };
    }
    return { ok: false, error: { code: "unexpected_error" } };
  }
}
