"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import CampaignGameRoomPlannedTools from "@/components/campaigns/campaign-game-room-planned-tools";
import {
  createCampaignVideoRoomController,
  createInitialCampaignVideoRoomSnapshot,
} from "@/lib/campaign-video/browser/controller";
import type {
  CampaignVideoParticipantDirectoryEntry,
  CampaignVideoRoomSnapshot,
} from "@/lib/campaign-video/browser/contracts";
import { createLiveKitCampaignVideoSession } from "@/lib/campaign-video/browser/livekit";
import { attachCampaignVideoTrack } from "@/lib/campaign-video/browser/media";
import {
  getCampaignVideoParticipantSlots,
  type CampaignVideoParticipantSlot,
} from "@/lib/campaign-video/browser/presentation";

type CampaignVideoRoomController = ReturnType<
  typeof createCampaignVideoRoomController
>;

type PlannedWorkspaceLabels = {
  displayHeading: string;
  toolsHeading: string;
  status: string;
};

type CampaignVideoRoomProps = {
  campaignId: string;
  campaignStatus: string;
  directoryReady: boolean;
  participantDirectory: CampaignVideoParticipantDirectoryEntry[];
  plannedWorkspace: PlannedWorkspaceLabels;
};

type CampaignVideoRoomLayoutProps = Omit<
  CampaignVideoRoomProps,
  "campaignId"
> & {
  snapshot: CampaignVideoRoomSnapshot;
  seenParticipantIdentities: ReadonlySet<string>;
  onJoin(): void;
  onLeave(): void;
  onCameraChange(enabled: boolean): void;
  onMicrophoneChange(enabled: boolean): void;
  onEnableSound(): void;
};

function CameraIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M4 7.75A1.75 1.75 0 0 1 5.75 6h8.5A1.75 1.75 0 0 1 16 7.75v8.5A1.75 1.75 0 0 1 14.25 18h-8.5A1.75 1.75 0 0 1 4 16.25v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m16 10 3.05-1.75A.65.65 0 0 1 20 8.82v6.36a.65.65 0 0 1-.95.57L16 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {!enabled && (
        <path d="m3 3 18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function MicrophoneIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      {!enabled && (
        <path d="m3 3 18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function MediaIndicator({
  kind,
  enabled,
  label,
}: {
  kind: "camera" | "microphone";
  enabled: boolean;
  label: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full border bg-black/65 ${
        enabled ? "border-emerald-200/55 text-emerald-100" : "border-white/25 text-white/55"
      }`}
    >
      {kind === "camera" ? <CameraIcon enabled={enabled} /> : <MicrophoneIcon enabled={enabled} />}
    </span>
  );
}

function ParticipantCard({
  slot,
  snapshot,
  statusMessage,
  hasBeenSeen,
  canJoin,
  onJoin,
  onLeave,
  onCameraChange,
  onMicrophoneChange,
  onEnableSound,
}: {
  slot: CampaignVideoParticipantSlot;
  snapshot: CampaignVideoRoomSnapshot;
  statusMessage: string;
  hasBeenSeen: boolean;
  canJoin: boolean;
  onJoin(): void;
  onLeave(): void;
  onCameraChange(enabled: boolean): void;
  onMicrophoneChange(enabled: boolean): void;
  onEnableSound(): void;
}) {
  const translations = useTranslations("CampaignVideoRoom");
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const participant = slot.participant;

  useEffect(
    () => attachCampaignVideoTrack(participant?.camera ?? null, videoRef.current),
    [participant?.camera],
  );
  useEffect(
    () => attachCampaignVideoTrack(participant?.microphone ?? null, audioRef.current),
    [participant?.microphone],
  );

  const role =
    slot.role === "game_master"
      ? translations("roles.gameMaster")
      : translations("roles.player", { number: slot.playerPosition });
  const displayName = slot.directoryEntry?.displayName ?? role;
  const connected = snapshot.phase === "connected";
  const busy =
    snapshot.phase === "requesting_credentials" ||
    snapshot.phase === "connecting" ||
    snapshot.phase === "reconnecting";
  const cameraEnabled = slot.isCurrentUser
    ? snapshot.cameraEnabled
    : participant?.camera !== null && participant?.camera !== undefined;
  const microphoneEnabled = slot.isCurrentUser
    ? snapshot.microphoneEnabled
    : participant?.microphone !== null && participant?.microphone !== undefined;
  const emptyState = hasBeenSeen
    ? translations("disconnectedParticipant")
    : translations("waitingParticipant");
  const mediaState = participant
    ? participant.camera
      ? null
      : translations("cameraOff")
    : emptyState;
  const cameraLabel = cameraEnabled
    ? translations("camera.disable")
    : translations("camera.enable");
  const microphoneLabel = microphoneEnabled
    ? translations("microphone.disable")
    : translations("microphone.enable");

  return (
    <article
      className="game-room-participant relative aspect-video min-w-0 overflow-hidden rounded-xl border border-white/20 bg-neutral-950 shadow-lg"
      data-participant-slot={slot.key}
      data-local-participant={slot.isCurrentUser ? "true" : "false"}
    >
      {participant?.camera ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={slot.isCurrentUser}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,_#262626,_#090909_70%)]" />
      )}
      {!slot.isCurrentUser && participant?.microphone && (
        <audio ref={audioRef} autoPlay />
      )}

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/90 to-transparent px-3 pb-8 pt-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-base">
            {displayName}
            {slot.isCurrentUser ? ` ${translations("youSuffix")}` : ""}
          </p>
          <p className="truncate text-xs text-white/65">{role}</p>
        </div>
        {slot.isCurrentUser && (
          <span className="max-w-[48%] truncate rounded-full border border-white/20 bg-black/65 px-2 py-1 text-[0.65rem] font-medium text-white/75" title={statusMessage}>
            {statusMessage}
          </span>
        )}
      </div>

      <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 text-center">
        {mediaState && (
          <p className="rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white/70 sm:text-sm">
            {mediaState}
          </p>
        )}
        {slot.isCurrentUser && !connected && (
          <button
            type="button"
            onClick={onJoin}
            disabled={!canJoin}
            className="min-h-11 rounded-full border border-emerald-300/80 bg-emerald-950/65 px-5 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {busy
              ? translations("joining")
              : snapshot.phase === "terminal_error"
                ? translations("retry")
                : translations("join")}
          </button>
        )}
        {slot.isCurrentUser && connected && (
          <div className="flex flex-wrap justify-center gap-2">
            {snapshot.audioBlocked && (
              <button
                type="button"
                onClick={onEnableSound}
                className="min-h-11 rounded-full border border-amber-300/80 bg-black/70 px-3 py-2 text-xs font-semibold text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
              >
                {translations("enableSound")}
              </button>
            )}
            <button
              type="button"
              onClick={onLeave}
              className="min-h-11 rounded-full border border-red-300/80 bg-black/70 px-4 py-2 text-xs font-semibold text-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200"
            >
              {translations("leave")}
            </button>
          </div>
        )}
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black via-black/90 to-transparent px-3 pb-3 pt-8"
        aria-label={slot.isCurrentUser ? translations("mediaControls") : translations("mediaIndicators")}
      >
        {slot.isCurrentUser ? (
          <>
            <button
              type="button"
              onClick={() => onCameraChange(!snapshot.cameraEnabled)}
              disabled={!connected || !snapshot.publication.video}
              aria-label={cameraLabel}
              aria-pressed={snapshot.cameraEnabled}
              title={cameraLabel}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/70 text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <CameraIcon enabled={snapshot.cameraEnabled} />
            </button>
            <button
              type="button"
              onClick={() => onMicrophoneChange(!snapshot.microphoneEnabled)}
              disabled={!connected || !snapshot.publication.audio}
              aria-label={microphoneLabel}
              aria-pressed={snapshot.microphoneEnabled}
              title={microphoneLabel}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/70 text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <MicrophoneIcon enabled={snapshot.microphoneEnabled} />
            </button>
          </>
        ) : (
          <>
            <MediaIndicator kind="camera" enabled={cameraEnabled} label={cameraLabel} />
            <MediaIndicator kind="microphone" enabled={microphoneEnabled} label={microphoneLabel} />
          </>
        )}
      </div>
    </article>
  );
}

function phaseMessage(
  translations: ReturnType<typeof useTranslations<"CampaignVideoRoom">>,
  snapshot: CampaignVideoRoomSnapshot,
) {
  if (snapshot.error) return translations(`errors.${snapshot.error}`);
  switch (snapshot.phase) {
    case "requesting_credentials":
      return translations("status.requestingCredentials");
    case "connecting":
      return translations("status.connecting");
    case "connected":
      return snapshot.restored
        ? translations("status.restored")
        : translations("status.connected");
    case "reconnecting":
      return translations("status.reconnecting");
    case "disconnected":
      return translations("status.disconnected");
    case "terminal_error":
      return translations("errors.unexpected_error");
    case "idle":
      return translations("status.idle");
  }
}

export function CampaignVideoRoomLayout({
  campaignStatus,
  directoryReady,
  participantDirectory,
  plannedWorkspace,
  snapshot,
  seenParticipantIdentities,
  onJoin,
  onLeave,
  onCameraChange,
  onMicrophoneChange,
  onEnableSound,
}: CampaignVideoRoomLayoutProps) {
  const translations = useTranslations("CampaignVideoRoom");
  const statusMessage =
    campaignStatus !== "active"
      ? translations("completedHelp")
      : !directoryReady
        ? translations("directoryUnavailable")
        : phaseMessage(translations, snapshot);
  const busy =
    snapshot.phase === "requesting_credentials" ||
    snapshot.phase === "connecting" ||
    snapshot.phase === "reconnecting";
  const connected = snapshot.phase === "connected";
  const canJoin =
    campaignStatus === "active" && directoryReady && !busy && !connected;
  const slots = getCampaignVideoParticipantSlots(
    participantDirectory,
    snapshot.participants,
  );

  return (
    <section className="game-room-grid" aria-label={translations("title")}>
      <p
        className="sr-only"
        role={snapshot.error || !directoryReady ? "alert" : "status"}
        aria-live="polite"
      >
        {statusMessage}
      </p>
      {slots.map((slot) => (
        <div
          key={slot.key}
          className={`game-room-slot game-room-slot-${slot.key}`}
        >
          <ParticipantCard
            slot={slot}
            snapshot={snapshot}
            statusMessage={statusMessage}
            hasBeenSeen={
              slot.directoryEntry
                ? seenParticipantIdentities.has(slot.directoryEntry.providerIdentity)
                : false
            }
            canJoin={canJoin}
            onJoin={onJoin}
            onLeave={onLeave}
            onCameraChange={onCameraChange}
            onMicrophoneChange={onMicrophoneChange}
            onEnableSound={onEnableSound}
          />
        </div>
      ))}
      <CampaignGameRoomPlannedTools {...plannedWorkspace} />
    </section>
  );
}

function CampaignVideoRoomInstance({
  campaignId,
  campaignStatus,
  directoryReady,
  participantDirectory,
  plannedWorkspace,
}: CampaignVideoRoomProps) {
  const controllerRef = useRef<CampaignVideoRoomController | null>(null);
  const participantDirectoryJson = JSON.stringify(participantDirectory);
  const [snapshot, setSnapshot] = useState(createInitialCampaignVideoRoomSnapshot);
  const [seenParticipantIdentities, setSeenParticipantIdentities] = useState(
    () => new Set<string>(),
  );

  useEffect(() => {
    const controller = createCampaignVideoRoomController({
      campaignId,
      campaignActive: campaignStatus === "active",
      directoryReady,
      participantDirectory: JSON.parse(
        participantDirectoryJson,
      ) as CampaignVideoParticipantDirectoryEntry[],
      createSession: createLiveKitCampaignVideoSession,
      onChange(nextSnapshot) {
        setSeenParticipantIdentities((previousIdentities) => {
          const newIdentities = nextSnapshot.participants
            .map((participant) => participant.providerIdentity)
            .filter((identity) => !previousIdentities.has(identity));
          if (newIdentities.length === 0) return previousIdentities;
          return new Set([...previousIdentities, ...newIdentities]);
        });
        setSnapshot(nextSnapshot);
      },
    });
    controllerRef.current = controller;
    return () => {
      controllerRef.current = null;
      void controller.dispose();
    };
  }, [campaignId, campaignStatus, directoryReady, participantDirectoryJson]);

  return (
    <CampaignVideoRoomLayout
      campaignStatus={campaignStatus}
      directoryReady={directoryReady}
      participantDirectory={participantDirectory}
      plannedWorkspace={plannedWorkspace}
      snapshot={snapshot}
      seenParticipantIdentities={seenParticipantIdentities}
      onJoin={() => void controllerRef.current?.join()}
      onLeave={() => void controllerRef.current?.leave()}
      onCameraChange={(enabled) =>
        void controllerRef.current?.setCameraEnabled(enabled)
      }
      onMicrophoneChange={(enabled) =>
        void controllerRef.current?.setMicrophoneEnabled(enabled)
      }
      onEnableSound={() => void controllerRef.current?.enableSound()}
    />
  );
}

export default function CampaignVideoRoom(props: CampaignVideoRoomProps) {
  const instanceKey = JSON.stringify([
    props.campaignId,
    props.campaignStatus,
    props.directoryReady,
    props.participantDirectory,
  ]);
  return <CampaignVideoRoomInstance key={instanceKey} {...props} />;
}
