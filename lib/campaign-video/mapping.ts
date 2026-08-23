import { createHash } from "node:crypto";

const ROOM_NAMESPACE = "ttrpg.fans/campaign-video/room/v1";
const PARTICIPANT_NAMESPACE = "ttrpg.fans/campaign-video/participant/v1";

function digest(parts: string[]): string {
  return createHash("sha256").update(parts.join("\u0000")).digest("hex");
}

export function deriveCampaignVideoRoomName(campaignId: string): string {
  return `campaign-${digest([ROOM_NAMESPACE, campaignId]).slice(0, 48)}`;
}

export function deriveCampaignVideoParticipantIdentity(
  campaignId: string,
  userId: string,
): string {
  return `participant-${digest([
    PARTICIPANT_NAMESPACE,
    campaignId,
    userId,
  ]).slice(0, 48)}`;
}
