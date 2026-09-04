"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useTranslations } from "next-intl";

import CampaignGameRoomWorkspace, {
  type CampaignGameRoomGalleryItem,
} from "@/components/campaigns/campaign-game-room-workspace";
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

type CampaignVideoRoomProps = {
  campaignId: string;
  campaignStatus: string;
  directoryReady: boolean;
  isGameMaster: boolean;
  galleryItems: CampaignGameRoomGalleryItem[];
  participantDirectory: CampaignVideoParticipantDirectoryEntry[];
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
  onShareImage(imageId: string): Promise<boolean>;
  onSetPresentationExpanded(expanded: boolean): Promise<boolean>;
  onStopShare(): Promise<boolean>;
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

function LeaveIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M10 5H6.75A1.75 1.75 0 0 0 5 6.75v10.5A1.75 1.75 0 0 0 6.75 19H10M14 8l4 4-4 4M9 12h9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CampaignGameRoomHeaderAction({
  visible,
  label,
  compactLabel,
  onLeave,
}: {
  visible: boolean;
  label: string;
  compactLabel: string;
  onLeave(): void;
}) {
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPortalHost(
        document.querySelector<HTMLElement>("[data-game-room-header-actions]"),
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!visible || !portalHost) return null;

  return createPortal(
    <button
      type="button"
      onClick={onLeave}
      aria-label={label}
      title={label}
      data-game-room-leave
      className="flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded border border-white/45 px-2 text-xs font-medium text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
    >
      <LeaveIcon />
      <span className="hidden sm:inline">{compactLabel}</span>
    </button>,
    portalHost,
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
      className={`flex h-9 w-9 items-center justify-center rounded-full border bg-black/65 ${
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
  hasBeenSeen,
  canJoin,
  onJoin,
  onCameraChange,
  onMicrophoneChange,
  onEnableSound,
}: {
  slot: CampaignVideoParticipantSlot;
  snapshot: CampaignVideoRoomSnapshot;
  hasBeenSeen: boolean;
  canJoin: boolean;
  onJoin(): void;
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
  const displayName =
    slot.role === "game_master"
      ? translations("roles.gameMaster")
      : slot.directoryEntry?.displayName ?? role;
  const connected = snapshot.phase === "connected";
  const participantConnected = connected && participant !== null;
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

      <div
        className="absolute right-2 top-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white"
        title={displayName}
        data-participant-label
      >
        {participantConnected && (
          <span className="shrink-0" data-participant-connected>
            <span className="block h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="sr-only">{translations("connectedParticipant")}</span>
          </span>
        )}
        <span className="min-w-0 truncate" aria-label={displayName}>
          {displayName}
        </span>
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
        {slot.isCurrentUser && connected && snapshot.audioBlocked && (
          <button
            type="button"
            onClick={onEnableSound}
            className="min-h-11 rounded-full border border-amber-300/80 bg-black/70 px-3 py-2 text-xs font-semibold text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            {translations("enableSound")}
          </button>
        )}
      </div>

      <div
        className="absolute bottom-2 left-2 flex items-center gap-1"
        aria-label={slot.isCurrentUser ? translations("mediaControls") : translations("mediaIndicators")}
        data-media-toolbar
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
              className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/70 hover:bg-white/15" data-control-circle>
                <CameraIcon enabled={snapshot.cameraEnabled} />
              </span>
            </button>
            <button
              type="button"
              onClick={() => onMicrophoneChange(!snapshot.microphoneEnabled)}
              disabled={!connected || !snapshot.publication.audio}
              aria-label={microphoneLabel}
              aria-pressed={snapshot.microphoneEnabled}
              title={microphoneLabel}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/70 hover:bg-white/15" data-control-circle>
                <MicrophoneIcon enabled={snapshot.microphoneEnabled} />
              </span>
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
  isGameMaster,
  galleryItems,
  participantDirectory,
  snapshot,
  seenParticipantIdentities,
  onJoin,
  onLeave,
  onCameraChange,
  onMicrophoneChange,
  onEnableSound,
  onShareImage,
  onSetPresentationExpanded,
  onStopShare,
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
    <>
      <CampaignGameRoomHeaderAction
        visible={connected}
        label={translations("leave")}
        compactLabel={translations("leaveCompact")}
        onLeave={onLeave}
      />
      <section
        className="game-room-grid"
        aria-label={translations("title")}
        data-presentation-expanded={
          snapshot.presentationExpanded ? "true" : "false"
        }
      >
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
              hasBeenSeen={
                slot.directoryEntry
                  ? seenParticipantIdentities.has(
                      slot.directoryEntry.providerIdentity,
                    )
                  : false
              }
              canJoin={canJoin}
              onJoin={onJoin}
              onCameraChange={onCameraChange}
              onMicrophoneChange={onMicrophoneChange}
              onEnableSound={onEnableSound}
            />
          </div>
        ))}
        <CampaignGameRoomWorkspace
          isGameMaster={isGameMaster}
          galleryItems={galleryItems}
          connected={connected}
          isPresenting={snapshot.isPresenting}
          presentationExpanded={snapshot.presentationExpanded}
          sharedPresentationUrl={snapshot.sharedPresentation?.signedUrl ?? null}
          presentationBusy={snapshot.presentationBusy}
          presentationError={snapshot.presentationError !== null}
          onShareImage={onShareImage}
          onSetPresentationExpanded={onSetPresentationExpanded}
          onStopShare={onStopShare}
        />
      </section>
    </>
  );
}

function CampaignVideoRoomInstance({
  campaignId,
  campaignStatus,
  directoryReady,
  isGameMaster,
  galleryItems,
  participantDirectory,
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
      isGameMaster,
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
  }, [
    campaignId,
    campaignStatus,
    directoryReady,
    isGameMaster,
    participantDirectoryJson,
  ]);

  return (
    <CampaignVideoRoomLayout
      campaignStatus={campaignStatus}
      directoryReady={directoryReady}
      isGameMaster={isGameMaster}
      galleryItems={galleryItems}
      participantDirectory={participantDirectory}
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
      onShareImage={(imageId) =>
        controllerRef.current?.shareImage(imageId) ?? Promise.resolve(false)
      }
      onSetPresentationExpanded={(expanded) =>
        controllerRef.current?.setPresentationExpanded(expanded) ??
        Promise.resolve(false)
      }
      onStopShare={() =>
        controllerRef.current?.stopPresentation() ?? Promise.resolve(false)
      }
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
