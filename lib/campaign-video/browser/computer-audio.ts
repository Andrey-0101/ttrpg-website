import type { TrackPublishOptions } from "livekit-client";
import type { ComputerAudioError, ComputerAudioQuality, ComputerAudioState } from "./contracts";

// DOM typings lag the Chromium screen-capture extensions. Keep them local.
export type ComputerAudioCaptureOptions = DisplayMediaStreamOptions & {
  windowAudio: "window";
  systemAudio: "include";
  selfBrowserSurface: "exclude";
  audio: MediaTrackConstraints & { restrictOwnAudio: true; voiceIsolation: false };
};

export function computerAudioPublishOptions(quality: ComputerAudioQuality): TrackPublishOptions {
  if (quality !== 128 && quality !== 192) throw new Error("Invalid computer audio quality");
  return {
    source: "screen_share_audio" as TrackPublishOptions["source"],
    audioPreset: { maxBitrate: quality * 1000 },
    forceStereo: true,
    dtx: false,
    red: false,
  };
}

export function supportsComputerAudioCapture(userAgent: string, available: boolean): boolean {
  const chromium = /(?:Chrome|Edg)\/(\d+)/.exec(userAgent);
  return available && /Windows NT/.test(userAgent) && Number(chromium?.[1]) >= 141;
}

export function createComputerAudioSharing(options: {
  supported(): boolean;
  capture(constraints: ComputerAudioCaptureOptions): Promise<MediaStream>;
  publish(track: MediaStreamTrack, settings: TrackPublishOptions): Promise<unknown>;
  unpublish(track: MediaStreamTrack): Promise<unknown>;
  onChange(state: ComputerAudioState): void;
}) {
  let state: ComputerAudioState = { phase: "idle", error: null };
  let generation = 0;
  let disposed = false;
  let startOperation: Promise<void> | null = null;
  let stopOperation: Promise<void> | null = null;
  let owned: { tracks: MediaStreamTrack[]; audio: MediaStreamTrack; ended: () => void; released: boolean } | null = null;
  const update = (phase: ComputerAudioState["phase"], error: ComputerAudioError | null = null) => {
    state = { phase, error };
    if (!disposed) options.onChange(state);
  };
  const current = (value: number) => !disposed && generation === value;
  const stopTracks = (tracks: MediaStreamTrack[]) => tracks.forEach((track) => track.stop());

  async function release(resource: NonNullable<typeof owned>) {
    if (!resource.released) {
      resource.released = true;
      resource.audio.removeEventListener("ended", resource.ended);
      stopTracks(resource.tracks);
    }
    await options.unpublish(resource.audio).catch(() => undefined);
  }

  function stop(): Promise<void> {
    if (stopOperation) return stopOperation;
    generation += 1;
    const resource = owned;
    owned = null;
    if (!resource) {
      update("idle");
      return Promise.resolve();
    }
    update("stopping");
    const operation = release(resource).finally(() => {
      if (stopOperation === operation) {
        stopOperation = null;
        update("idle");
      }
    });
    stopOperation = operation;
    return operation;
  }

  async function performStart(quality: ComputerAudioQuality) {
    const publishOptions = computerAudioPublishOptions(quality);
    const operationGeneration = ++generation;
    update("starting");
    if (!options.supported()) {
      update("idle", "unsupported_browser");
      return;
    }
    let stream: MediaStream;
    try {
      // No await before capture: preserve the Start button's user activation.
      stream = await options.capture({
        video: true,
        audio: {
          restrictOwnAudio: true,
          channelCount: 2,
          sampleRate: 48000,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          voiceIsolation: false,
        },
        windowAudio: "window",
        systemAudio: "include",
        selfBrowserSurface: "exclude",
      });
    } catch (error) {
      if (current(operationGeneration)) {
        update("idle", error instanceof Error && error.name === "NotAllowedError"
          ? "capture_cancelled" : "unsupported_browser");
      }
      return;
    }
    const tracks = stream.getTracks();
    if (!current(operationGeneration)) { stopTracks(tracks); return; }
    const audio = stream.getAudioTracks();
    const track = audio[0];
    const usable = () => track?.readyState === "live" && track.enabled && !track.muted;
    if (audio.length !== 1 || !usable()) {
      stopTracks(tracks);
      update("idle", "no_audio_track");
      return;
    }
    const video = stream.getVideoTracks();
    let displaySurface: string | undefined;
    try {
      if (video.length === 1 && video[0].readyState === "live" && video[0].enabled) {
        displaySurface = video[0].getSettings().displaySurface;
      }
    } catch {
      // Unreadable or unknown surfaces must not bypass the system-audio gate.
    }
    if (displaySurface !== "window" && displaySurface !== "monitor") {
      stopTracks(tracks);
      update("idle", "unsupported_surface");
      return;
    }
    const safe = () => {
      // Window audio follows the native picker's windowAudio hint; it does not
      // require the own-audio setting used to protect whole-system capture.
      if (displaySurface === "window") return true;
      try {
        return (track.getSettings() as MediaTrackSettings & { restrictOwnAudio?: boolean }).restrictOwnAudio === true;
      } catch {
        return false;
      }
    };
    if (!safe()) {
      stopTracks(tracks);
      update("idle", "unsafe_audio_capture");
      return;
    }
    // Watch before stopping video, including engines that end audio with it.
    let endedBeforePublish = false;
    const ended = () => {
      if (state.phase === "starting") endedBeforePublish = true;
      else void stop();
    };
    const resource = { tracks, audio: track, ended, released: false };
    owned = resource;
    track.addEventListener("ended", ended);
    video.forEach((track) => track.stop());
    // Let capture-source termination propagate before making any publication.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (!current(operationGeneration)) return;
    if (endedBeforePublish || !usable()) {
      owned = null;
      await release(resource);
      if (current(operationGeneration)) update("idle", "video_stop_ended_audio");
      return;
    }
    if (!safe()) {
      owned = null;
      await release(resource);
      if (current(operationGeneration)) update("idle", "unsafe_audio_capture");
      return;
    }
    try {
      await options.publish(track, publishOptions);
      if (!current(operationGeneration)) {
        // Publication may have finished after Stop/Leave/terminal disconnect.
        await release(resource);
        return;
      }
      if (endedBeforePublish || !usable()) {
        owned = null;
        await release(resource);
        if (current(operationGeneration)) update("idle", "publish_failed");
        return;
      }
      update("sharing");
    } catch {
      if (owned === resource) owned = null;
      await release(resource);
      if (current(operationGeneration)) update("idle", "publish_failed");
    }
  }

  function start(quality: ComputerAudioQuality): Promise<void> {
    if (disposed || stopOperation || state.phase !== "idle") return startOperation ?? Promise.resolve();
    if (startOperation) return startOperation;
    const operation = performStart(quality).finally(() => {
      if (startOperation === operation) startOperation = null;
    });
    startOperation = operation;
    return operation;
  }

  return {
    start, stop,
    async dispose() { disposed = true; await stop(); },
  };
}
