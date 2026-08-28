"use client";

import { useTranslations } from "next-intl";

import { CampaignVideoRoomLayout } from "@/components/campaigns/campaign-video-room";
import type {
  CampaignVideoParticipantDirectoryEntry,
  CampaignVideoRoomSnapshot,
  CampaignVideoTrackAttachment,
} from "@/lib/campaign-video/browser/contracts";

const fixtureCamera: CampaignVideoTrackAttachment = {
  id: "fixture-camera",
  kind: "camera",
  attach(element) {
    element.setAttribute("poster", "/game-room-card-fixture.png");
  },
  detach(element) {
    element.removeAttribute("poster");
  },
};

const participantDirectory: CampaignVideoParticipantDirectoryEntry[] = [
  {
    providerIdentity: "fixture-game-master",
    displayName: "Hidden fixture account name",
    role: "game_master",
    playerPosition: null,
    isCurrentUser: true,
  },
  ...Array.from({ length: 6 }, (_, index) => ({
    providerIdentity: `fixture-player-${index + 1}`,
    displayName:
      index === 0
        ? "Dr. Eleanor Armitage — a deliberately long investigator name"
        : `Fixture player ${index + 1}`,
    role: "player" as const,
    playerPosition: index + 1,
    isCurrentUser: false,
  })),
];

const snapshot: CampaignVideoRoomSnapshot = {
  phase: "connected",
  participants: [
    {
      ...participantDirectory[0],
      isLocal: true,
      camera: fixtureCamera,
      microphone: null,
    },
    {
      ...participantDirectory[1],
      isLocal: false,
      camera: null,
      microphone: null,
    },
  ],
  publication: { audio: true, video: true },
  cameraEnabled: true,
  microphoneEnabled: false,
  audioBlocked: false,
  restored: false,
  error: null,
};

export default function CampaignVideoRoomVisualFixture() {
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
      seenParticipantIdentities={new Set()}
      onJoin={() => undefined}
      onLeave={() => undefined}
      onCameraChange={() => undefined}
      onMicrophoneChange={() => undefined}
      onEnableSound={() => undefined}
    />
  );
}
