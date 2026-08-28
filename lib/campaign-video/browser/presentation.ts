import type {
  CampaignVideoParticipantDirectoryEntry,
  CampaignVideoParticipantView,
} from "./contracts";

export const CAMPAIGN_VIDEO_PARTICIPANT_SLOTS = [
  { key: "gm", role: "game_master", playerPosition: null },
  { key: "player-1", role: "player", playerPosition: 1 },
  { key: "player-2", role: "player", playerPosition: 2 },
  { key: "player-3", role: "player", playerPosition: 3 },
  { key: "player-4", role: "player", playerPosition: 4 },
  { key: "player-5", role: "player", playerPosition: 5 },
  { key: "player-6", role: "player", playerPosition: 6 },
] as const;

export type CampaignVideoParticipantSlot =
  (typeof CAMPAIGN_VIDEO_PARTICIPANT_SLOTS)[number] & {
    directoryEntry: CampaignVideoParticipantDirectoryEntry | null;
    participant: CampaignVideoParticipantView | null;
    isCurrentUser: boolean;
  };

function slotKey(
  entry: Pick<
    CampaignVideoParticipantDirectoryEntry,
    "role" | "playerPosition"
  >,
) {
  return entry.role === "game_master"
    ? "gm"
    : `player-${entry.playerPosition ?? "unknown"}`;
}

export function getCampaignVideoParticipantSlots(
  directory: CampaignVideoParticipantDirectoryEntry[],
  participants: CampaignVideoParticipantView[],
): CampaignVideoParticipantSlot[] {
  const directoryBySlot = new Map(
    directory.map((entry) => [slotKey(entry), entry]),
  );
  const participantsByIdentity = new Map(
    participants.map((participant) => [
      participant.providerIdentity,
      participant,
    ]),
  );

  return CAMPAIGN_VIDEO_PARTICIPANT_SLOTS.map((definition) => {
    const directoryEntry = directoryBySlot.get(definition.key) ?? null;
    const participant = directoryEntry
      ? participantsByIdentity.get(directoryEntry.providerIdentity) ?? null
      : null;

    return {
      ...definition,
      directoryEntry,
      participant,
      isCurrentUser:
        directoryEntry?.isCurrentUser === true || participant?.isLocal === true,
    };
  });
}
