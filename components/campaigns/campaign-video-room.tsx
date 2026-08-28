"use client";

import { useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import {
  createCampaignVideoRoomController,
  createInitialCampaignVideoRoomSnapshot,
} from "@/lib/campaign-video/browser/controller";
import type {
  CampaignVideoParticipantDirectoryEntry,
  CampaignVideoParticipantView,
  CampaignVideoRoomSnapshot,
} from "@/lib/campaign-video/browser/contracts";
import { createLiveKitCampaignVideoSession } from "@/lib/campaign-video/browser/livekit";
import { attachCampaignVideoTrack } from "@/lib/campaign-video/browser/media";
import { getCampaignVideoGridClass } from "@/lib/campaign-video/browser/presentation";

type CampaignVideoRoomController = ReturnType<
  typeof createCampaignVideoRoomController
>;

type CampaignVideoRoomProps = {
  campaignId: string;
  campaignStatus: string;
  directoryReady: boolean;
  participantDirectory: CampaignVideoParticipantDirectoryEntry[];
};

function ParticipantCard({
  participant,
}: {
  participant: CampaignVideoParticipantView;
}) {
  const translations = useTranslations("CampaignVideoRoom");
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(
    () => attachCampaignVideoTrack(participant.camera, videoRef.current),
    [participant.camera],
  );
  useEffect(
    () => attachCampaignVideoTrack(participant.microphone, audioRef.current),
    [participant.microphone],
  );

  const role =
    participant.role === "game_master"
      ? translations("roles.gameMaster")
      : translations("roles.player", {
          number: participant.playerPosition ?? "–",
        });

  return (
    <li className="relative aspect-video min-w-0 overflow-hidden rounded-xl border border-white/20 bg-neutral-950 shadow-lg">
      {participant.camera ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-neutral-900 px-4 text-center text-sm text-white/60">
          {translations("cameraOff")}
        </div>
      )}
      {!participant.isLocal && participant.microphone && (
        <audio ref={audioRef} autoPlay />
      )}
      {participant.isLocal && participant.camera && (
        <span className="absolute right-2 top-2 rounded bg-black/75 px-2 py-1 text-xs font-semibold">
          {translations("localCamera")}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-3 pb-3 pt-8">
        <p className="truncate text-sm font-semibold">
          {participant.displayName}
          {participant.isLocal ? ` ${translations("youSuffix")}` : ""}
        </p>
        <p className="text-xs text-white/70">{role}</p>
      </div>
    </li>
  );
}

function phaseMessage(
  translations: ReturnType<typeof useTranslations<"CampaignVideoRoom">>,
  snapshot: CampaignVideoRoomSnapshot,
) {
  if (snapshot.error) {
    return translations(`errors.${snapshot.error}`);
  }
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

function CampaignVideoRoomInstance({
  campaignId,
  campaignStatus,
  directoryReady,
  participantDirectory,
}: CampaignVideoRoomProps) {
  const translations = useTranslations("CampaignVideoRoom");
  const controllerRef = useRef<CampaignVideoRoomController | null>(null);
  const participantDirectoryJson = JSON.stringify(participantDirectory);
  const [snapshot, setSnapshot] = useState(
    createInitialCampaignVideoRoomSnapshot,
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
      onChange: setSnapshot,
    });
    controllerRef.current = controller;
    return () => {
      controllerRef.current = null;
      void controller.dispose();
    };
  }, [campaignId, campaignStatus, directoryReady, participantDirectoryJson]);

  const busy =
    snapshot.phase === "requesting_credentials" ||
    snapshot.phase === "connecting" ||
    snapshot.phase === "reconnecting";
  const connected = snapshot.phase === "connected";
  const canJoin =
    campaignStatus === "active" &&
    directoryReady &&
    !busy &&
    !connected;
  const participantGridClass = getCampaignVideoGridClass(
    snapshot.participants.length,
  );

  return (
    <section
      className="overflow-hidden rounded-xl border border-white/25 bg-black/25"
      aria-labelledby="campaign-video-room-title"
    >
      <div className="flex flex-col gap-4 border-b border-white/15 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <h2 id="campaign-video-room-title" className="text-2xl font-bold">
            {translations("title")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-white/80 sm:text-base">
            {translations("description")}
          </p>
        </div>
        {!connected ? (
          <button
            type="button"
            onClick={() => void controllerRef.current?.join()}
            disabled={!canJoin}
            className="min-h-11 shrink-0 rounded-lg border border-emerald-300 px-5 py-2.5 font-semibold text-emerald-100 hover:bg-emerald-950/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? translations("joining")
              : snapshot.phase === "terminal_error"
                ? translations("retry")
                : translations("join")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void controllerRef.current?.leave()}
            className="min-h-11 shrink-0 rounded-lg border border-red-300 px-5 py-2.5 font-semibold text-red-100 hover:bg-red-950/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200"
          >
            {translations("leave")}
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        <p
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            snapshot.error
              ? "border-red-300/40 bg-red-950/30 text-red-100"
              : "border-white/15 bg-white/5 text-white/75"
          }`}
          role={snapshot.error ? "alert" : "status"}
          aria-live="polite"
        >
          {phaseMessage(translations, snapshot)}
        </p>

        {connected ? (
          <>
            <ul
              className={`mt-5 grid w-full gap-3 lg:gap-4 ${participantGridClass}`}
              data-participant-count={snapshot.participants.length}
            >
              {snapshot.participants.map((participant) => (
                <ParticipantCard
                  key={participant.providerIdentity}
                  participant={participant}
                />
              ))}
            </ul>
            {snapshot.participants.length === 0 && (
              <p className="mt-5 flex min-h-52 items-center justify-center rounded-xl border border-dashed border-white/25 bg-black/20 p-5 text-center text-sm text-white/70 sm:min-h-64">
                {translations("waitingForParticipants")}
              </p>
            )}

            <div
              className="sticky bottom-3 z-10 mx-auto mt-5 flex w-fit max-w-full flex-wrap justify-center gap-2 rounded-xl border border-white/20 bg-neutral-950/90 p-2 shadow-xl backdrop-blur sm:gap-3 sm:p-3"
              aria-label={translations("mediaControls")}
            >
              <button
                type="button"
                onClick={() =>
                  void controllerRef.current?.setCameraEnabled(
                    !snapshot.cameraEnabled,
                  )
                }
                disabled={!snapshot.publication.video}
                aria-pressed={snapshot.cameraEnabled}
                className="min-h-11 rounded-lg border border-white/35 px-4 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {snapshot.cameraEnabled
                  ? translations("camera.disable")
                  : translations("camera.enable")}
              </button>
              <button
                type="button"
                onClick={() =>
                  void controllerRef.current?.setMicrophoneEnabled(
                    !snapshot.microphoneEnabled,
                  )
                }
                disabled={!snapshot.publication.audio}
                aria-pressed={snapshot.microphoneEnabled}
                className="min-h-11 rounded-lg border border-white/35 px-4 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {snapshot.microphoneEnabled
                  ? translations("microphone.disable")
                  : translations("microphone.enable")}
              </button>
              {snapshot.audioBlocked && (
                <button
                  type="button"
                  onClick={() => void controllerRef.current?.enableSound()}
                  className="min-h-11 rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-950/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
                >
                  {translations("enableSound")}
                </button>
              )}
            </div>
            {(!snapshot.publication.audio || !snapshot.publication.video) && (
              <p className="mt-3 text-sm text-white/70">
                {translations("publicationRestricted")}
              </p>
            )}
          </>
        ) : (
          <div className="mt-5 flex min-h-56 items-center justify-center rounded-xl border border-dashed border-white/25 bg-neutral-950/45 p-6 text-center text-sm text-white/60 sm:min-h-72">
            {translations("videoIdle")}
          </div>
        )}

        {campaignStatus !== "active" && (
          <p className="mt-4 text-sm text-white/70">
            {translations("completedHelp")}
          </p>
        )}
        {!directoryReady && (
          <p className="mt-4 text-sm text-red-200" role="alert">
            {translations("directoryUnavailable")}
          </p>
        )}
      </div>
    </section>
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
