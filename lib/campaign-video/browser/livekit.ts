"use client";

import type {
  CampaignVideoProviderParticipant,
  CampaignVideoRoomSessionFactory,
  CampaignVideoTrackAttachment,
  CampaignVideoTrackKind,
} from "./contracts";
import { classifyCampaignVideoMediaError } from "./errors";

type AttachableTrack = {
  attach(element: HTMLMediaElement): unknown;
  detach(element: HTMLMediaElement): unknown;
};

type TrackPublication = {
  trackSid: string;
  source: string;
  isMuted: boolean;
  track?: AttachableTrack;
};

type Participant = {
  identity: string;
  isLocal: boolean;
  trackPublications: Map<string, TrackPublication>;
};

export const createLiveKitCampaignVideoSession: CampaignVideoRoomSessionFactory =
  async (credentials, callbacks, signal) => {
    const { Room, RoomEvent, Track } = await import("livekit-client");
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      disconnectOnPageLeave: true,
      stopLocalTrackOnUnpublish: true,
      videoCaptureDefaults: {
        resolution: { width: 1280, height: 720 },
        frameRate: 30,
      },
    });
    const attachments = new Map<string, CampaignVideoTrackAttachment>();
    let disposed = false;
    let requestedDisconnect = false;

    function attachment(
      publication: TrackPublication,
      kind: CampaignVideoTrackKind,
    ): CampaignVideoTrackAttachment | null {
      if (!publication.track || publication.isMuted) return null;
      const key = `${kind}:${publication.trackSid}`;
      const existing = attachments.get(key);
      if (existing) return existing;
      const providerTrack = publication.track;
      const created: CampaignVideoTrackAttachment = {
        id: publication.trackSid,
        kind,
        attach(element) {
          providerTrack.attach(element);
        },
        detach(element) {
          providerTrack.detach(element);
        },
      };
      attachments.set(key, created);
      return created;
    }

    function participantView(participant: Participant) {
      let camera: CampaignVideoTrackAttachment | null = null;
      let microphone: CampaignVideoTrackAttachment | null = null;
      for (const publication of participant.trackPublications.values()) {
        if (publication.source === Track.Source.Camera) {
          camera = attachment(publication, "camera");
        } else if (publication.source === Track.Source.Microphone) {
          microphone = attachment(publication, "microphone");
        }
      }
      return {
        identity: participant.identity,
        isLocal: participant.isLocal,
        camera,
        microphone,
      } satisfies CampaignVideoProviderParticipant;
    }

    function emitParticipants() {
      if (disposed) return;
      callbacks.onParticipants([
        participantView(room.localParticipant as unknown as Participant),
        ...Array.from(room.remoteParticipants.values()).map((participant) =>
          participantView(participant as unknown as Participant),
        ),
      ]);
    }

    const onReconnecting = () => callbacks.onReconnecting();
    const onReconnected = () => callbacks.onReconnected();
    const onDisconnected = () => {
      if (requestedDisconnect || disposed) return;
      disposed = true;
      signal.removeEventListener("abort", abort);
      removeListeners();
      attachments.clear();
      callbacks.onTerminalDisconnect();
    };
    const onAudioPlaybackChanged = () =>
      callbacks.onAudioBlocked(!room.canPlaybackAudio);
    const onMediaDevicesError = (error: Error) =>
      callbacks.onMediaError(classifyCampaignVideoMediaError(error));

    const participantEvents = [
      RoomEvent.ParticipantConnected,
      RoomEvent.ParticipantDisconnected,
      RoomEvent.TrackPublished,
      RoomEvent.TrackSubscribed,
      RoomEvent.TrackUnpublished,
      RoomEvent.TrackUnsubscribed,
      RoomEvent.TrackMuted,
      RoomEvent.TrackUnmuted,
      RoomEvent.LocalTrackPublished,
      RoomEvent.LocalTrackUnpublished,
    ] as const;
    for (const event of participantEvents) room.on(event, emitParticipants);
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.AudioPlaybackStatusChanged, onAudioPlaybackChanged);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);

    function removeListeners() {
      for (const event of participantEvents) room.off(event, emitParticipants);
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.AudioPlaybackStatusChanged, onAudioPlaybackChanged);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    }

    async function disconnect() {
      if (disposed) return;
      disposed = true;
      requestedDisconnect = true;
      signal.removeEventListener("abort", abort);
      removeListeners();
      attachments.clear();
      await room.disconnect(true);
    }

    function abort() {
      void disconnect();
    }
    signal.addEventListener("abort", abort, { once: true });

    try {
      await room.connect(credentials.url, credentials.token, {
        autoSubscribe: true,
      });
      if (signal.aborted) {
        await disconnect();
        throw new DOMException("Connection aborted", "AbortError");
      }
      emitParticipants();
      callbacks.onAudioBlocked(!room.canPlaybackAudio);
    } catch (error) {
      await disconnect();
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new Error("connection_failed");
    }

    return {
      async setCameraEnabled(enabled) {
        try {
          await room.localParticipant.setCameraEnabled(enabled, {
            resolution: { width: 1280, height: 720 },
            frameRate: 30,
          });
          emitParticipants();
        } catch (error) {
          throw new Error(classifyCampaignVideoMediaError(error));
        }
      },
      async setMicrophoneEnabled(enabled) {
        try {
          await room.localParticipant.setMicrophoneEnabled(enabled);
          emitParticipants();
        } catch (error) {
          throw new Error(classifyCampaignVideoMediaError(error));
        }
      },
      async startAudio() {
        await room.startAudio();
      },
      disconnect,
    };
  };
