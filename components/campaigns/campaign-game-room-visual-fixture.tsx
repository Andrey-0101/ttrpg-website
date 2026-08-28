"use client";

import { useTranslations } from "next-intl";

import { CampaignVideoRoomLayout } from "@/components/campaigns/campaign-video-room";
import type {
  CampaignVideoParticipantDirectoryEntry,
  CampaignVideoParticipantView,
  CampaignVideoRoomSnapshot,
} from "@/lib/campaign-video/browser/contracts";

const participantDirectory: CampaignVideoParticipantDirectoryEntry[] = [
  {
    providerIdentity: "fixture-gm",
    displayName: "Morgan",
    role: "game_master",
    playerPosition: null,
    isCurrentUser: false,
  },
  ...Array.from({ length: 6 }, (_, index) => ({
    providerIdentity: `fixture-player-${index + 1}`,
    displayName: `Player ${index + 1}`,
    role: "player" as const,
    playerPosition: index + 1,
    isCurrentUser: index === 0,
  })),
];

const participants: CampaignVideoParticipantView[] = participantDirectory
  .slice(0, 5)
  .map((participant) => ({
    ...participant,
    isLocal: participant.isCurrentUser,
    camera: null,
    microphone: null,
  }));

const snapshot: CampaignVideoRoomSnapshot = {
  phase: "connected",
  participants,
  publication: { audio: true, video: true },
  cameraEnabled: false,
  microphoneEnabled: false,
  audioBlocked: false,
  restored: false,
  error: null,
};

const seenParticipantIdentities = new Set(["fixture-player-6"]);

function noOp() {}

export default function CampaignGameRoomVisualFixture() {
  const translations = useTranslations("CampaignGameRoom");

  return (
    <CampaignVideoRoomLayout
      campaignStatus="active"
      directoryReady
      participantDirectory={participantDirectory}
      plannedWorkspace={{
        displayHeading: translations("workspace.display"),
        toolsHeading: translations("workspace.tools"),
        status: translations("planned.status"),
      }}
      snapshot={snapshot}
      seenParticipantIdentities={seenParticipantIdentities}
      onJoin={noOp}
      onLeave={noOp}
      onCameraChange={noOp}
      onMicrophoneChange={noOp}
      onEnableSound={noOp}
    />
  );
}
