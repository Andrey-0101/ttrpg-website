import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import type { TrackPublishOptions } from "livekit-client";
import * as captureModule from "../../lib/campaign-video/browser/computer-audio";
import * as diagnosticRegistry from "../../lib/diagnostics/media-registry";
import { createCampaignVideoRoomController } from "../../lib/campaign-video/browser/controller";
import * as controllerModule from "../../lib/campaign-video/browser/controller";
import * as presentationModule from "../../lib/campaign-video/browser/presentation";
import type { CampaignVideoRoomSessionFactory, ComputerAudioState } from "../../lib/campaign-video/browser/contracts";
import { attachCampaignVideoTrack } from "../../lib/campaign-video/browser/media";

const { createComputerAudioSharing, computerAudioPublishOptions, supportsComputerAudioCapture } = captureModule;
const source = (file: string) => readFileSync(file, "utf8");
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 5));

class CaptureTrack extends EventTarget {
  readyState = "live";
  enabled = true;
  muted = false;
  stops = 0;
  listeners = 0;
  settings: { restrictOwnAudio?: boolean; displaySurface?: string } = { restrictOwnAudio: true };
  onStop?: () => void;
  getSettings() { return this.settings; }
  stop() { this.stops += 1; this.readyState = "ended"; this.onStop?.(); }
  end() { this.readyState = "ended"; this.dispatchEvent(new Event("ended")); }
  override addEventListener(...args: Parameters<EventTarget["addEventListener"]>) {
    this.listeners += 1; super.addEventListener(...args);
  }
  override removeEventListener(...args: Parameters<EventTarget["removeEventListener"]>) {
    this.listeners -= 1; super.removeEventListener(...args);
  }
}

function captured(audio = [new CaptureTrack()], displaySurface = "monitor") {
  const video = new CaptureTrack();
  video.settings = { displaySurface };
  const stream = {
    getTracks: () => [...audio, video],
    getAudioTracks: () => audio,
    getVideoTracks: () => [video],
  } as unknown as MediaStream;
  return { audio, video, stream };
}

function sharingHarness(value = captured(), changes: {
  supported?: boolean;
  capture?: () => Promise<MediaStream>;
  publish?: () => Promise<unknown>;
  unpublish?: () => Promise<unknown>;
} = {}) {
  const states: ComputerAudioState[] = [];
  const published: { track: MediaStreamTrack; settings: TrackPublishOptions }[] = [];
  let captures = 0;
  let unpublished = 0;
  let constraints: captureModule.ComputerAudioCaptureOptions | null = null;
  const sharing = createComputerAudioSharing({
    supported: () => changes.supported ?? true,
    capture: async (request) => {
      captures += 1; constraints = request;
      return changes.capture ? changes.capture() : value.stream;
    },
    publish: async (track, settings) => {
      assert.equal(value.video.readyState, "ended");
      assert.equal(track, value.audio[0]);
      assert.equal(track.readyState, "live");
      assert.equal(track.enabled, true);
      assert.equal(track.muted, false);
      published.push({ track, settings });
      return changes.publish?.();
    },
    unpublish: async () => { unpublished += 1; return changes.unpublish?.(); },
    onChange: (state) => states.push(state),
  });
  return { sharing, states, published, captures: () => captures, constraints: () => constraints,
    unpublished: () => unpublished, state: () => states.at(-1), ...value };
}

for (const displaySurface of ["window", "monitor"]) {
for (const quality of [128, 192] as const) {
  test(`${displaySurface} capture publishes only audio at ${quality}, with stereo and no speech processing`, async () => {
    const value = captured(undefined, displaySurface);
    let surfaceRead = false;
    value.video.getSettings = () => {
      assert.equal(value.video.readyState, "live");
      surfaceRead = true;
      return { displaySurface };
    };
    value.video.onStop = () => assert.equal(surfaceRead, true);
    const h = sharingHarness(value);
    const start = h.sharing.start(quality);
    await Promise.all([start, h.sharing.start(quality)]);
    assert.equal(h.captures(), 1);
    assert.deepEqual(h.constraints(), {
      video: true, windowAudio: "window", systemAudio: "include", selfBrowserSurface: "exclude",
      audio: { restrictOwnAudio: true, channelCount: 2, sampleRate: 48000,
        echoCancellation: false, noiseSuppression: false, autoGainControl: false, voiceIsolation: false },
    });
    assert.deepEqual(h.published[0]?.settings, {
      source: "screen_share_audio", audioPreset: { maxBitrate: quality * 1000 },
      forceStereo: true, dtx: false, red: false,
    });
    assert.equal(h.state()?.phase, "sharing");
    await h.sharing.stop();
    await h.sharing.stop();
    assert.equal(h.state()?.phase, "idle");
    assert.equal(h.unpublished(), 1);
    assert.equal(h.audio[0]?.listeners, 0);
    assert.ok(h.audio.every((track) => track.readyState === "ended"));
    assert.deepEqual(h.states.map((state) => state.phase), ["starting", "sharing", "stopping", "idle", "idle"]);
  });
}
}

for (const safety of [undefined, false, true]) {
  test(`window audio succeeds with restrictOwnAudio=${safety}`, async () => {
    const value = captured(undefined, "window");
    value.audio[0]!.settings = safety === undefined ? {} : { restrictOwnAudio: safety };
    const h = sharingHarness(value);
    await h.sharing.start(192);
    assert.equal(h.state()?.phase, "sharing");
    assert.equal(h.published.length, 1);
    await h.sharing.stop();
  });
}

for (const displaySurface of ["browser", undefined, "unexpected"]) {
  test(`unsupported displaySurface=${displaySurface} stops all capture without publication`, async () => {
    const value = captured();
    value.video.settings = { displaySurface };
    const h = sharingHarness(value);
    await h.sharing.start(192);
    assert.equal(h.state()?.error, "unsupported_surface");
    assert.equal(h.published.length, 0);
    assert.ok([...h.audio, h.video].every((track) => track.readyState === "ended"));
  });
}

test("unreadable displaySurface cannot enter unrestricted window mode", async () => {
  const value = captured();
  value.video.getSettings = () => { throw new Error("Unavailable surface"); };
  const h = sharingHarness(value);
  await h.sharing.start(192);
  assert.equal(h.state()?.error, "unsupported_surface");
  assert.equal(h.published.length, 0);
  assert.ok([...h.audio, h.video].every((track) => track.readyState === "ended"));
});

for (const invalid of ["missing", "multiple", "ended", "disabled"] as const) {
  test(`${invalid} display video cannot authorize window audio`, async () => {
    const value = captured(undefined, "window");
    const extra = new CaptureTrack();
    const videos = invalid === "missing" ? [] : invalid === "multiple" ? [value.video, extra] : [value.video];
    if (invalid === "ended") value.video.readyState = "ended";
    if (invalid === "disabled") value.video.enabled = false;
    value.stream.getVideoTracks = () => videos as unknown as MediaStreamTrack[];
    value.stream.getTracks = () => [...value.audio, ...videos] as unknown as MediaStreamTrack[];
    const h = sharingHarness(value);
    await h.sharing.start(192);
    assert.equal(h.state()?.error, "unsupported_surface");
    assert.equal(h.published.length, 0);
    assert.ok([...value.audio, ...videos].every((track) => track.readyState === "ended"));
  });
}

test("quality is a closed union; browser support is narrow and not proof of capture safety", () => {
  assert.throws(() => computerAudioPublishOptions(160 as 128), /Invalid/);
  for (const ua of ["Windows NT 10.0 Chrome/141.0", "Windows NT 10.0 Chrome/150.0 Edg/150.0"]) {
    assert.equal(supportsComputerAudioCapture(ua, true), true);
  }
  for (const ua of ["Windows NT 10.0 Chrome/140.0", "Macintosh Chrome/150.0", "Windows NT 10.0 Firefox/150.0", "Android Chrome/150.0", "Linux Chrome/150.0"]) {
    assert.equal(supportsComputerAudioCapture(ua, true), false);
  }
  assert.equal(supportsComputerAudioCapture("Windows NT 10.0 Chrome/150.0", false), false);
});

for (const safety of [false, undefined]) {
  test(`monitor audio with restrictOwnAudio=${safety} fails closed`, async () => {
    const value = captured();
    value.audio[0]!.settings = { restrictOwnAudio: safety };
    const h = sharingHarness(value);
    await h.sharing.start(192);
    assert.equal(h.state()?.error, "unsafe_audio_capture");
    assert.equal(h.published.length, 0);
    assert.ok([...h.audio, h.video].every((track) => track.readyState === "ended"));
  });
}

test("unsupported capture and cancellation are separate nonfatal states", async () => {
  const unsupported = sharingHarness(undefined, { supported: false });
  await unsupported.sharing.start(192);
  assert.equal(unsupported.captures(), 0);
  assert.equal(unsupported.state()?.error, "unsupported_browser");
  const cancelled = sharingHarness(undefined, { capture: async () => { throw new DOMException("Cancelled", "NotAllowedError"); } });
  await cancelled.sharing.start(192);
  assert.equal(cancelled.state()?.error, "capture_cancelled");
  assert.equal(cancelled.published.length, 0);
});

for (const invalid of ["none", "multiple", "ended", "muted"] as const) {
  test(`${invalid} audio capture cleans every returned track without publication`, async () => {
    const value = captured(invalid === "none" ? [] : invalid === "multiple" ? [new CaptureTrack(), new CaptureTrack()] : undefined);
    if (invalid === "ended") value.audio[0]!.readyState = "ended";
    if (invalid === "muted") value.audio[0]!.muted = true;
    const h = sharingHarness(value);
    await h.sharing.start(192);
    assert.equal(h.state()?.error, "no_audio_track");
    assert.equal(h.published.length, 0);
    assert.ok([...h.audio, h.video].every((track) => track.readyState === "ended"));
  });
}

for (const displaySurface of ["window", "monitor"]) {
test(`${displaySurface} video stop ending audio aborts; hidden video is never retained`, async () => {
  const value = captured(undefined, displaySurface);
  value.video.onStop = () => value.audio[0]!.end();
  const h = sharingHarness(value);
  await h.sharing.start(192);
  assert.equal(h.state()?.error, "video_stop_ended_audio");
  assert.equal(h.published.length, 0);
  assert.equal(h.audio[0]?.listeners, 0);
  assert.ok([...h.audio, h.video].every((track) => track.readyState === "ended"));
});
}

test("monitor own-audio safety must still hold after video stops", async () => {
  const value = captured();
  value.video.onStop = () => { value.audio[0]!.settings = { restrictOwnAudio: false }; };
  const h = sharingHarness(value);
  await h.sharing.start(192);
  assert.equal(h.state()?.error, "unsafe_audio_capture");
  assert.equal(h.published.length, 0);
  assert.equal(h.audio[0]?.listeners, 0);
  assert.ok([...h.audio, h.video].every((track) => track.readyState === "ended"));
});

test("publish failure cleans tracks/listeners and returns to idle", async () => {
  const h = sharingHarness(undefined, { publish: async () => { throw new Error("publish failed"); } });
  await h.sharing.start(192);
  assert.equal(h.state()?.error, "publish_failed");
  assert.equal(h.audio[0]?.readyState, "ended");
  assert.equal(h.audio[0]?.listeners, 0);
  assert.equal(h.unpublished(), 1);
});

test("unreadable safety settings fail closed and stop every capture track", async () => {
  const value = captured();
  value.audio[0]!.getSettings = () => { throw new Error("Unavailable settings"); };
  const h = sharingHarness(value);
  await h.sharing.start(192);
  assert.equal(h.state()?.error, "unsafe_audio_capture");
  assert.equal(h.published.length, 0);
  assert.ok([...h.audio, h.video].every((track) => track.readyState === "ended"));
});

test("duplicate Stop while unpublishing is coalesced and cannot start a new capture", async () => {
  let finish!: () => void;
  const h = sharingHarness(undefined, { unpublish: () => new Promise<void>((resolve) => { finish = resolve; }) });
  await h.sharing.start(192);
  const stop = h.sharing.stop();
  assert.equal(h.sharing.stop(), stop);
  await h.sharing.start(128);
  assert.equal(h.state()?.phase, "stopping");
  assert.equal(h.captures(), 1);
  assert.equal(h.unpublished(), 1);
  finish();
  await stop;
  assert.equal(h.state()?.phase, "idle");
});

test("native Stop ends sharing idempotently without touching other tracks", async () => {
  const h = sharingHarness();
  await h.sharing.start(192);
  h.audio[0]!.end();
  await tick();
  assert.equal(h.state()?.phase, "idle");
  assert.equal(h.unpublished(), 1);
  assert.equal(h.audio[0]?.listeners, 0);
});

for (const action of ["stop", "dispose"] as const) {
  test(`late picker resolution after ${action} stops every track and never publishes`, async () => {
    const value = captured();
    let resolve!: (stream: MediaStream) => void;
    const h = sharingHarness(value, { capture: () => new Promise((done) => { resolve = done; }) });
    const pending = h.sharing.start(192);
    await h.sharing[action]();
    resolve(value.stream);
    await pending;
    assert.equal(h.published.length, 0);
    assert.ok([...h.audio, h.video].every((track) => track.readyState === "ended"));
  });
}

test("late publication after Stop is unpublished again and cannot resurrect sharing", async () => {
  let finish!: () => void;
  const h = sharingHarness(undefined, { publish: () => new Promise<void>((resolve) => { finish = resolve; }) });
  const pending = h.sharing.start(192);
  await tick();
  await h.sharing.stop();
  finish();
  await pending;
  assert.equal(h.state()?.phase, "idle");
  assert.equal(h.audio[0]?.readyState, "ended");
  assert.equal(h.audio[0]?.listeners, 0);
});

type FakePublication = { trackSid: string; source: string; isMuted: boolean; track: { attach(element: unknown): void; detach(element: unknown): void } };
function adapterHarness(capture: () => Promise<MediaStream>, localIdentity = "gm") {
  const events = { TrackPublished: "published", TrackSubscribed: "subscribed", TrackUnpublished: "unpublished", TrackUnsubscribed: "unsubscribed", TrackMuted: "muted", TrackUnmuted: "unmuted", LocalTrackPublished: "localPublished", LocalTrackUnpublished: "localUnpublished", ParticipantConnected: "participantConnected", ParticipantDisconnected: "participantDisconnected", DataReceived: "data", Reconnecting: "reconnecting", Reconnected: "reconnected", Disconnected: "disconnected", AudioPlaybackStatusChanged: "audioPlayback", MediaDevicesError: "mediaError", SignalReconnecting:"signalReconnecting", TrackStreamStateChanged:"streamState", ConnectionQualityChanged:"quality" };
  let captures = 0;
  class FakeRoom {
    static latest: FakeRoom;
    handlers = new Map<string, Set<(...args: unknown[]) => void>>();
    remoteParticipants = new Map<string, { identity: string; isLocal: boolean; trackPublications: Map<string, FakePublication> }>();
    canPlaybackAudio = false;
    publishes: { track: MediaStreamTrack; settings: TrackPublishOptions }[] = [];
    microphoneCalls: boolean[] = [];
    cameraCalls: boolean[] = [];
    connections = 0;
    disconnects = 0;
    audioStarts = 0;
    localParticipant = {
      identity: localIdentity, isLocal: true, trackPublications: new Map<string, FakePublication>(),
      setCameraEnabled: async (value: boolean) => { this.cameraCalls.push(value); },
      setMicrophoneEnabled: async (value: boolean) => { this.microphoneCalls.push(value); },
      publishTrack: async (track: MediaStreamTrack, settings: TrackPublishOptions) => { this.publishes.push({ track, settings }); },
      unpublishTrack: async () => undefined,
    };
    constructor() { FakeRoom.latest = this; }
    on(event: string, handler: (...args: unknown[]) => void) {
      if (!this.handlers.has(event)) this.handlers.set(event, new Set());
      this.handlers.get(event)!.add(handler);
    }
    off(event: string, handler: (...args: unknown[]) => void) { this.handlers.get(event)?.delete(handler); }
    emit(event: string, ...args: unknown[]) { this.handlers.get(event)?.forEach((handler) => handler(...args)); }
    async connect() { this.connections += 1; }
    async disconnect() { this.disconnects += 1; this.emit(events.Disconnected); }
    async startAudio() { this.audioStarts += 1; this.canPlaybackAudio = true; this.emit(events.AudioPlaybackStatusChanged); }
  }
  const exports: { createLiveKitCampaignVideoSession?: CampaignVideoRoomSessionFactory } = {};
  const code = transpileModule(source("lib/campaign-video/browser/livekit.ts"), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2020 },
  }).outputText;
  runInNewContext(code, {
    exports, AbortController, DOMException, console,
    navigator: { userAgent: "Windows NT 10.0 Chrome/150.0", mediaDevices: { getDisplayMedia: () => { captures += 1; return capture(); } } },
    require(name: string) {
      if (name === "livekit-client") return { Room: FakeRoom, RoomEvent: events, Track: { Source: { Camera: "camera", Microphone: "microphone", ScreenShareAudio: "screen_share_audio" } } };
      if (name === "./computer-audio") return captureModule;
      if (name === "../../diagnostics/media-registry") return diagnosticRegistry;
      if (name === "./errors") return { classifyCampaignVideoMediaError: () => "media_unavailable" };
      assert.fail(`Unexpected adapter dependency: ${name}`);
    },
  });
  return { factory: exports.createLiveKitCampaignVideoSession!, room: () => FakeRoom.latest, captures: () => captures, events };
}

const directory = [
  { providerIdentity: "gm", displayName: "GM", role: "game_master" as const, playerPosition: null, isCurrentUser: true },
  { providerIdentity: "player", displayName: "Player", role: "player" as const, playerPosition: 1, isCurrentUser: false },
];

function controllerHarness(capture: () => Promise<MediaStream>, gm = true) {
  const adapter = adapterHarness(capture, gm ? "gm" : "player");
  let credentials = 0;
  const controller = createCampaignVideoRoomController({
    campaignId: "a1000000-0000-4000-8000-000000000001", campaignActive: true, directoryReady: true,
    isGameMaster: gm, participantDirectory: directory.map((entry) => ({ ...entry,
      isCurrentUser: entry.providerIdentity === (gm ? "gm" : "player") })), createSession: adapter.factory,
    fetcher: async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      if (body.action) return new Response(JSON.stringify({ ok: true, action: body.action,
        revision: body.revision, ...(body.action === "show" ? { expanded: body.expanded } : {}) }));
      credentials += 1;
      return new Response(JSON.stringify({ ok: true,
        connection: { url: "wss://test.invalid", token: "fake", expiresAt: "2030-01-01" },
        participant: { role: gm ? "game_master" : "player", publication: { audio: true, video: true, computerAudio: gm } },
      }));
    }, onChange: () => undefined,
  });
  return { ...adapter, controller, credentials: () => credentials };
}

test("controller default/quality locks, reconnect, mic/camera and image presentation remain independent", async () => {
  const value = captured();
  const h = controllerHarness(async () => value.stream);
  await h.controller.join();
  assert.equal(h.controller.getSnapshot().computerAudioQuality, 192);
  h.controller.setComputerAudioQuality(160 as 128);
  assert.equal(h.controller.getSnapshot().computerAudioQuality, 192);
  h.controller.setComputerAudioQuality(128);
  await h.controller.startComputerAudio();
  h.controller.setComputerAudioQuality(192);
  assert.equal(h.controller.getSnapshot().computerAudioQuality, 128);
  assert.equal(h.room().publishes[0]?.settings.audioPreset?.maxBitrate, 128000);
  for (const microphone of [true, false]) {
    for (const camera of [true, false]) {
      await h.controller.setMicrophoneEnabled(microphone);
      await h.controller.setCameraEnabled(camera);
      assert.equal(h.controller.getSnapshot().microphoneEnabled, microphone);
      assert.equal(h.controller.getSnapshot().cameraEnabled, camera);
      assert.equal(h.controller.getSnapshot().computerAudio.phase, "sharing");
    }
  }
  assert.equal(await h.controller.shareImage("a1000000-0000-4000-8000-000000000004"), true);
  assert.equal(await h.controller.setPresentationExpanded(true), true);
  await h.controller.stopComputerAudio();
  assert.equal(h.controller.getSnapshot().isPresenting, true);
  assert.equal(await h.controller.stopPresentation(), true);
  // The adapter retains its capture function, as in an ordinary new Start.
  value.audio[0]!.readyState = "live"; value.video.readyState = "live";
  await h.controller.startComputerAudio();
  assert.equal(h.controller.getSnapshot().computerAudioQuality, 128);
  assert.equal(await h.controller.shareImage("a1000000-0000-4000-8000-000000000004"), true);
  await h.controller.stopPresentation();
  assert.equal(h.controller.getSnapshot().computerAudio.phase, "sharing");
  h.room().emit(h.events.Reconnecting);
  h.room().emit(h.events.Reconnected);
  await h.controller.startComputerAudio();
  assert.equal(h.captures(), 2);
  assert.equal(h.room().publishes.length, 2);
  assert.equal(h.credentials(), 1);
  assert.equal(h.room().connections, 1);
  await h.controller.enableSound();
  assert.equal(h.room().audioStarts, 1);
  await h.controller.leave();
  assert.equal(h.controller.getSnapshot().computerAudio.phase, "idle");
  assert.equal(value.audio[0]?.readyState, "ended");
});

test("Players cannot invoke computer audio through the controller", async () => {
  const h = controllerHarness(async () => captured().stream, false);
  await h.controller.join();
  await h.controller.startComputerAudio();
  assert.equal(h.captures(), 0);
  await h.controller.dispose();
});

test("native Stop removes only computer audio; mic/camera/presentation and call remain active", async () => {
  const value = captured();
  const h = controllerHarness(async () => value.stream);
  await h.controller.join();
  await h.controller.setMicrophoneEnabled(true);
  await h.controller.setCameraEnabled(true);
  await h.controller.startComputerAudio();
  await h.controller.shareImage("a1000000-0000-4000-8000-000000000004");
  value.audio[0]!.end();
  await tick();
  const snapshot = h.controller.getSnapshot();
  assert.equal(snapshot.phase, "connected");
  assert.equal(snapshot.computerAudio.phase, "idle");
  assert.equal(snapshot.microphoneEnabled, true);
  assert.equal(snapshot.cameraEnabled, true);
  assert.equal(snapshot.isPresenting, true);
  assert.equal(snapshot.error, null);
  assert.equal(h.room().disconnects, 0);
  await h.controller.setMicrophoneEnabled(false);
  await h.controller.setCameraEnabled(false);
  assert.equal(h.controller.getSnapshot().computerAudio.phase, "idle");
  await h.controller.dispose();
});

test("a Player receives GM computer audio independently of microphone/camera and rejects Player audio source", async () => {
  const h = controllerHarness(async () => captured().stream, false);
  await h.controller.join();
  const attached: unknown[] = [];
  const detached: unknown[] = [];
  const publication = (source: string): FakePublication => ({ source, trackSid: `gm-${source}`, isMuted: false,
    track: { attach: (element) => attached.push(element), detach: (element) => detached.push(element) } });
  const pubs = new Map(["camera", "microphone", "screen_share_audio"].map((kind) => [kind, publication(kind)]));
  h.room().remoteParticipants.set("gm", { identity: "gm", isLocal: false, trackPublications: pubs });
  h.room().localParticipant.trackPublications.set("screen_share_audio", publication("screen_share_audio"));
  h.room().emit(h.events.TrackSubscribed);
  const snapshot = h.controller.getSnapshot();
  const gm = snapshot.participants.find((entry) => entry.role === "game_master")!;
  assert.equal(gm.isCurrentUser, false);
  assert.equal(gm.isLocal, false);
  assert.ok(gm.camera && gm.microphone && gm.computerAudio);
  assert.equal(snapshot.participants.find((entry) => entry.role === "player")?.computerAudio, null);
  const micElement = {} as HTMLAudioElement;
  const computerElement = {} as HTMLAudioElement;
  const detachMic = attachCampaignVideoTrack(gm.microphone, micElement);
  const detachComputer = attachCampaignVideoTrack(gm.computerAudio, computerElement);
  assert.deepEqual(attached, [micElement, computerElement]);
  pubs.delete("microphone");
  h.room().emit(h.events.TrackUnsubscribed);
  assert.equal(h.controller.getSnapshot().participants.find((entry) => entry.role === "game_master")?.computerAudio, gm.computerAudio);
  detachMic();
  assert.deepEqual(detached, [micElement]);
  pubs.delete("screen_share_audio");
  h.room().emit(h.events.TrackUnsubscribed);
  detachComputer();
  assert.deepEqual(detached, [micElement, computerElement]);
  assert.ok(h.controller.getSnapshot().participants.find((entry) => entry.role === "game_master")?.camera);
  assert.equal(h.captures(), 0);
  await h.controller.dispose();
});

for (const action of ["leave", "dispose", "terminal"] as const) {
  test(`adapter/controller late picker after ${action} is discarded without camera/mic disruption`, async () => {
    const value = captured();
    let resolve!: (stream: MediaStream) => void;
    const h = controllerHarness(() => new Promise((done) => { resolve = done; }));
    await h.controller.join();
    const pending = h.controller.startComputerAudio();
    if (action === "terminal") h.room().emit(h.events.Disconnected);
    else await h.controller[action]();
    resolve(value.stream);
    await pending;
    assert.equal(h.room().publishes.length, 0);
    assert.ok([...value.audio, value.video].every((track) => track.readyState === "ended"));
    assert.deepEqual(h.room().microphoneCalls, []);
    assert.deepEqual(h.room().cameraCalls, []);
    assert.equal(h.controller.getSnapshot().computerAudio.phase, action === "dispose" ? "starting" : "idle");
  });
}

for (const providerFirst of [true, false]) {
  test(`three-track authorized mapping and late membership (${providerFirst ? "LiveKit first" : "membership first"}) retain sharing`, async () => {
    const h = controllerHarness(async () => captured().stream);
    await h.controller.join();
    await h.controller.startComputerAudio();
    const calls: string[] = [];
    const publication = (kind: string): FakePublication => ({ trackSid: kind, source: kind, isMuted: false,
      track: { attach: () => calls.push(`attach-${kind}`), detach: () => calls.push(`detach-${kind}`) },
    });
    const gm = { identity: "gm", isLocal: false, trackPublications: new Map(["camera", "microphone", "screen_share_audio"].map((kind) => [kind, publication(kind)])) };
    const player = { identity: "late", isLocal: false, trackPublications: new Map([["screen_share_audio", publication("screen_share_audio")]]) };
    const newDirectory = [...directory, { providerIdentity: "late", displayName: "Late player", role: "player" as const, playerPosition: 2, isCurrentUser: false }];
    if (!providerFirst) h.controller.updateParticipantDirectory(newDirectory);
    h.room().localParticipant.trackPublications = gm.trackPublications;
    h.room().remoteParticipants.set("late", player);
    h.room().emit(h.events.TrackSubscribed);
    if (providerFirst) h.controller.updateParticipantDirectory(newDirectory);
    const mapped = h.controller.getSnapshot().participants;
    const view = mapped.find((entry) => entry.providerIdentity === "gm")!;
    assert.ok(view.camera && view.microphone && view.computerAudio, JSON.stringify(mapped));
    assert.equal(mapped.find((entry) => entry.providerIdentity === "late")?.computerAudio, null);
    const detachMic = attachCampaignVideoTrack(view.microphone, {} as HTMLAudioElement);
    const detachComputer = attachCampaignVideoTrack(view.computerAudio, {} as HTMLAudioElement);
    gm.trackPublications.delete("screen_share_audio");
    h.room().emit(h.events.TrackUnsubscribed);
    assert.equal(h.controller.getSnapshot().participants.find((entry) => entry.providerIdentity === "gm")?.microphone, view.microphone);
    detachComputer();
    assert.deepEqual(calls, ["attach-microphone", "attach-screen_share_audio", "detach-screen_share_audio"]);
    detachMic();
    h.controller.updateParticipantDirectory([]);
    assert.deepEqual(h.controller.getSnapshot().participants, []);
    assert.equal(h.captures(), 1);
    assert.equal(h.credentials(), 1);
    assert.equal(h.room().connections, 1);
    assert.equal(h.room().publishes.length, 1);
    assert.equal(h.controller.getSnapshot().computerAudio.phase, "sharing");
    await h.controller.dispose();
  });
}

test("component wiring: separate remote-GM audio, GM-only controls, existing audio unlock, EN/RU parity", () => {
  const ui = source("components/campaigns/campaign-video-room.tsx");
  assert.match(ui, /!slot\.isCurrentUser && slot\.role === "game_master" && participant\?\.computerAudio/);
  assert.match(ui, /<audio ref=\{computerAudioRef\} autoPlay/);
  assert.match(ui, /attachCampaignVideoTrack\(participant\?\.computerAudio \?\? null, computerAudioRef\.current\)/);
  assert.match(ui, /isGameMaster && connected && snapshot\.publication\.computerAudio/);
  assert.match(ui, /disabled=\{phase !== "idle"\}/);
  assert.match(ui, /aria-busy=\{busy\}/);
  assert.match(ui, /onEnableSound=\{\(\) => void controllerRef\.current\?\.enableSound\(\)\}/);
  const adapter = source("lib/campaign-video/browser/livekit.ts");
  assert.match(adapter, /source: Track\.Source\.ScreenShareAudio/);
  assert.doesNotMatch(adapter, /setScreenShareEnabled|createScreenTracks/);
  const keys = (object: Record<string, unknown>, prefix = ""): string[] => Object.entries(object).flatMap(([key, value]) =>
    typeof value === "object" && value !== null ? keys(value as Record<string, unknown>, `${prefix}${key}.`) : [`${prefix}${key}`]);
  const en = JSON.parse(source("messages/en.json")).CampaignVideoRoom.computerAudio;
  const ru = JSON.parse(source("messages/ru.json")).CampaignVideoRoom.computerAudio;
  assert.deepEqual(keys(en), keys(ru));
});

test("rendered Game Room authorizes the GM control and has two remote audio elements, never local loopback", () => {
  const exports: { CampaignVideoRoomLayout?: (props: Record<string, unknown>) => ReactNode } = {};
  const code = transpileModule(source("components/campaigns/campaign-video-room.tsx"), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2020, jsx: JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, {
    exports,
    require(name: string) {
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "react") return {
        useEffect: () => undefined,
        useRef: () => ({ current: null }),
        // A present portal host lets this isolated render exercise header controls.
        useState: (initial: unknown) => [initial === null ? {} : initial, () => undefined],
      };
      if (name === "react-dom") return { createPortal: (child: ReactNode) => child };
      if (name === "next-intl") return { useLocale: () => "en", useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}` };
      if (name === "@/components/campaigns/campaign-game-room-workspace") return { default: () => null };
      if (name === "@/lib/campaign-video/browser/controller") return controllerModule;
      if (name === "@/lib/campaign-video/browser/presentation") return presentationModule;
      if (name === "@/lib/campaign-video/browser/media") return { attachCampaignVideoTrack };
      if (["@/lib/campaign-video/browser/livekit", "@/lib/campaign-video/browser/directory-sync", "@/utils/supabase/client"].includes(name)) return {};
      assert.fail(`Unexpected component dependency: ${name}`);
    },
  });
  const track = (kind: "camera" | "microphone" | "computerAudio") => ({ id: kind, kind, attach: () => undefined, detach: () => undefined });
  function render(gm: boolean, allowed = gm, connected = true, computerAudio = true) {
    const entries = directory.map((entry) => ({ ...entry, isCurrentUser: entry.role === (gm ? "game_master" : "player") }));
    return renderToStaticMarkup(exports.CampaignVideoRoomLayout!({
      campaignId: "a1000000-0000-4000-8000-000000000001", campaignGameSystem: "coc_7e", campaignStatus: "active",
      directoryReady: true, isGameMaster: gm, galleryItems: [], participantDirectory: entries,
      snapshot: { ...controllerModule.createInitialCampaignVideoRoomSnapshot(), phase: connected ? "connected" : "idle",
        publication: { audio: true, video: true, computerAudio: allowed },
        participants: entries.map((entry) => ({ ...entry, isLocal: entry.isCurrentUser,
          camera: entry.role === "game_master" ? track("camera") : null,
          microphone: entry.role === "game_master" ? track("microphone") : null,
          computerAudio: entry.role === "game_master" && computerAudio ? track("computerAudio") : null })),
      },
      seenParticipantIdentities: new Set(), gameSession: null,
      onJoin: () => undefined, onLeave: () => undefined, onCameraChange: () => undefined,
      onMicrophoneChange: () => undefined, onEnableSound: () => undefined,
      onComputerAudioQuality: () => undefined, onStartComputerAudio: () => undefined, onStopComputerAudio: () => undefined,
    }));
  }
  const gm = render(true);
  assert.match(gm, /data-computer-audio-controls/);
  assert.equal((gm.match(/<audio/g) ?? []).length, 0);
  assert.doesNotMatch(render(true, false), /data-computer-audio-controls/);
  assert.doesNotMatch(render(true, true, false), /data-computer-audio-controls/);
  const player = render(false);
  assert.doesNotMatch(player, /data-computer-audio-controls/);
  assert.match(player, /data-computer-audio-playback/);
  assert.equal((player.match(/<audio/g) ?? []).length, 2);
  assert.equal((render(false, false, true, false).match(/<audio/g) ?? []).length, 1);
});
