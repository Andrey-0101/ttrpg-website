import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  createCampaignVideoRoomController,
  orderCampaignVideoParticipants,
} from "../../lib/campaign-video/browser/controller";
import type {
  CampaignVideoRoomSession,
  CampaignVideoRoomSessionCallbacks,
} from "../../lib/campaign-video/browser/contracts";
import { classifyCampaignVideoMediaError } from "../../lib/campaign-video/browser/errors";
import { attachCampaignVideoTrack } from "../../lib/campaign-video/browser/media";
import { getCampaignVideoParticipantSlots } from "../../lib/campaign-video/browser/presentation";
import {
  CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
  createCampaignVideoPresentationPacket,
  parseCampaignVideoPresentationPacket,
  type CampaignVideoPresentationCommand,
} from "../../lib/campaign-video/presentation";

const CAMPAIGN_ID = "a1000000-0000-4000-8000-000000000001";
const IMAGE_ID = "a1000000-0000-4000-8000-000000000004";
const PRESENTATION_URL =
  "https://storage.test.invalid/storage/v1/object/sign/campaign-images/" +
  `${CAMPAIGN_ID}/${IMAGE_ID}/image.webp?token=temporary`;
const DIRECTORY = [
  {
    providerIdentity: "gm-safe",
    displayName: "GM",
    role: "game_master" as const,
    playerPosition: null,
    isCurrentUser: false,
  },
  {
    providerIdentity: "player-1-safe",
    displayName: "Player 1",
    role: "player" as const,
    playerPosition: 1,
    isCurrentUser: true,
  },
  {
    providerIdentity: "player-2-safe",
    displayName: "Player 2",
    role: "player" as const,
    playerPosition: 2,
    isCurrentUser: false,
  },
];

function joinResponse(
  publication = { audio: true, video: true },
  token = "temporary-token",
) {
  return new Response(
    JSON.stringify({
      ok: true,
      connection: {
        url: "wss://video.test.invalid",
        token,
        expiresAt: "2030-01-01T00:00:00.000Z",
      },
      participant: {
        role: "player",
        playerPosition: 1,
        publication,
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function presentationResponse(command: CampaignVideoPresentationCommand) {
  return new Response(
    JSON.stringify({
      ok: true,
      action: command.action,
      revision: command.revision,
      ...(command.action === "show"
        ? {
            expanded: command.expanded,
          }
        : {}),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function createSessionHarness() {
  let callbacks: CampaignVideoRoomSessionCallbacks | null = null;
  let credentials: { token: string } | null = null;
  let disconnects = 0;
  let cameraCalls = 0;
  let microphoneCalls = 0;
  let audioStarts = 0;
  const session: CampaignVideoRoomSession = {
    async setCameraEnabled() {
      cameraCalls += 1;
    },
    async setMicrophoneEnabled() {
      microphoneCalls += 1;
    },
    async startAudio() {
      audioStarts += 1;
    },
    async disconnect() {
      disconnects += 1;
    },
  };
  return {
    factory: async (
      value: { token: string },
      nextCallbacks: CampaignVideoRoomSessionCallbacks,
    ) => {
      credentials = value;
      callbacks = nextCallbacks;
      return session;
    },
    callbacks: () => callbacks as CampaignVideoRoomSessionCallbacks,
    credentialToken: () => credentials?.token,
    disconnects: () => disconnects,
    cameraCalls: () => cameraCalls,
    microphoneCalls: () => microphoneCalls,
    audioStarts: () => audioStarts,
  };
}

test("presentation packets reject unsupported fields", () => {
  const packet = new TextEncoder().encode(
    JSON.stringify({
      version: 1,
      action: "show",
      signedUrl: PRESENTATION_URL,
      unsupported: true,
      expanded: false,
      revision: 1,
    }),
  );

  assert.equal(parseCampaignVideoPresentationPacket(packet), null);
});

test("join requests fresh scoped credentials with the exact empty JSON contract", async () => {
  const session = createSessionHarness();
  const requests: Array<{ input: string; init?: RequestInit }> = [];
  const snapshots: string[] = [];
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    participantDirectory: DIRECTORY,
    createSession: session.factory,
    fetcher: async (input, init) => {
      requests.push({ input: String(input), init });
      return joinResponse();
    },
    onChange: (snapshot) => snapshots.push(snapshot.phase),
  });

  await Promise.all([controller.join(), controller.join()]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.input, `/api/campaigns/${CAMPAIGN_ID}/video/join`);
  assert.equal(requests[0]?.init?.method, "POST");
  assert.deepEqual(requests[0]?.init?.headers, {
    "Content-Type": "application/json",
  });
  assert.equal(requests[0]?.init?.credentials, "same-origin");
  assert.equal(requests[0]?.init?.body, "{}");
  assert.equal(session.credentialToken(), "temporary-token");
  assert.deepEqual(snapshots, [
    "requesting_credentials",
    "connecting",
    "connected",
  ]);
  assert.equal(JSON.stringify(controller.getSnapshot()).includes("temporary-token"), false);
  await controller.dispose();
  assert.equal(session.disconnects(), 1);
});

test("denied join fails safely before browser provider construction", async () => {
  let factoryCalls = 0;
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    participantDirectory: DIRECTORY,
    createSession: async () => {
      factoryCalls += 1;
      throw new Error("must not run");
    },
    fetcher: async () =>
      new Response(
        JSON.stringify({
          ok: false,
          error: { code: "membership_required" },
        }),
        { status: 403 },
      ),
    onChange: () => undefined,
  });
  await controller.join();
  assert.equal(factoryCalls, 0);
  assert.equal(controller.getSnapshot().phase, "terminal_error");
  assert.equal(controller.getSnapshot().error, "campaign_unavailable");
});

test("participant presentation is directory-owned, deduplicated, and role ordered", () => {
  const ordered = orderCampaignVideoParticipants(
    [
      { identity: "player-2-safe", isLocal: false, camera: null, microphone: null },
      { identity: "unknown", isLocal: false, camera: null, microphone: null },
      { identity: "gm-safe", isLocal: true, camera: null, microphone: null },
      { identity: "player-2-safe", isLocal: false, camera: null, microphone: null },
      { identity: "player-1-safe", isLocal: false, camera: null, microphone: null },
    ],
    DIRECTORY,
  );
  assert.deepEqual(
    ordered.map(({ providerIdentity, displayName, playerPosition }) => ({
      providerIdentity,
      displayName,
      playerPosition,
    })),
    [
      { providerIdentity: "gm-safe", displayName: "GM", playerPosition: null },
      { providerIdentity: "player-1-safe", displayName: "Player 1", playerPosition: 1 },
      { providerIdentity: "player-2-safe", displayName: "Player 2", playerPosition: 2 },
    ],
  );
});

test("seven campaign slots remain stable across camera-off and disconnect states", () => {
  const connected = orderCampaignVideoParticipants(
    [
      { identity: "player-2-safe", isLocal: false, camera: null, microphone: null },
      { identity: "gm-safe", isLocal: false, camera: null, microphone: null },
      { identity: "player-1-safe", isLocal: true, camera: null, microphone: null },
    ],
    DIRECTORY,
  );
  const connectedSlots = getCampaignVideoParticipantSlots(DIRECTORY, connected);
  const disconnectedSlots = getCampaignVideoParticipantSlots(
    DIRECTORY,
    connected.filter((participant) => participant.providerIdentity !== "player-2-safe"),
  );

  assert.deepEqual(
    connectedSlots.map((slot) => slot.key),
    ["gm", "player-1", "player-2", "player-3", "player-4", "player-5", "player-6"],
  );
  assert.deepEqual(
    disconnectedSlots.map((slot) => slot.key),
    connectedSlots.map((slot) => slot.key),
  );
  assert.equal(connectedSlots[2]?.participant?.camera, null);
  assert.equal(disconnectedSlots[2]?.participant, null);
  assert.equal(connectedSlots[1]?.isCurrentUser, true);
  assert.equal(connectedSlots[0]?.isCurrentUser, false);
});

test("camera and microphone controls serialize device operations", async () => {
  const session = createSessionHarness();
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    participantDirectory: DIRECTORY,
    createSession: session.factory,
    fetcher: async () => joinResponse({ audio: true, video: true }),
    onChange: () => undefined,
  });
  await controller.join();
  await Promise.all([
    controller.setCameraEnabled(true),
    controller.setCameraEnabled(true),
  ]);
  await controller.setMicrophoneEnabled(true);
  assert.equal(session.cameraCalls(), 1);
  assert.equal(session.microphoneCalls(), 1);
  assert.equal(controller.getSnapshot().cameraEnabled, true);
  assert.equal(controller.getSnapshot().microphoneEnabled, true);
});

test("permission-disabled media sources never reach the room session", async () => {
  const session = createSessionHarness();
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    participantDirectory: DIRECTORY,
    createSession: session.factory,
    fetcher: async () => joinResponse({ audio: false, video: false }),
    onChange: () => undefined,
  });
  await controller.join();
  await controller.setCameraEnabled(true);
  await controller.setMicrophoneEnabled(true);
  assert.equal(session.cameraCalls(), 0);
  assert.equal(session.microphoneCalls(), 0);
  assert.deepEqual(controller.getSnapshot().publication, {
    audio: false,
    video: false,
  });
});

test("reconnect state restores and terminal disconnect requires a fresh join token", async () => {
  const session = createSessionHarness();
  let requestCount = 0;
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    participantDirectory: DIRECTORY,
    createSession: session.factory,
    fetcher: async () => {
      requestCount += 1;
      return joinResponse(undefined, `token-${requestCount}`);
    },
    onChange: () => undefined,
  });
  await controller.join();
  session.callbacks().onReconnecting();
  assert.equal(controller.getSnapshot().phase, "reconnecting");
  session.callbacks().onReconnected();
  assert.equal(controller.getSnapshot().phase, "connected");
  assert.equal(controller.getSnapshot().restored, true);
  session.callbacks().onTerminalDisconnect();
  assert.equal(controller.getSnapshot().phase, "terminal_error");
  await controller.join();
  assert.equal(requestCount, 2);
  assert.equal(session.credentialToken(), "token-2");
});

test("sound unlock and leave dispose only the current temporary session", async () => {
  const session = createSessionHarness();
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    participantDirectory: DIRECTORY,
    createSession: session.factory,
    fetcher: async () => joinResponse(),
    onChange: () => undefined,
  });
  await controller.join();
  session.callbacks().onParticipants([
    { identity: "gm-safe", isLocal: true, camera: null, microphone: null },
    { identity: "player-1-safe", isLocal: false, camera: null, microphone: null },
  ]);
  assert.equal(controller.getSnapshot().participants.length, 2);
  session.callbacks().onParticipants([
    { identity: "gm-safe", isLocal: true, camera: null, microphone: null },
  ]);
  assert.equal(controller.getSnapshot().participants.length, 1);
  session.callbacks().onAudioBlocked(true);
  await controller.enableSound();
  assert.equal(session.audioStarts(), 1);
  assert.equal(controller.getSnapshot().audioBlocked, false);
  await controller.leave();
  assert.equal(session.disconnects(), 1);
  assert.equal(controller.getSnapshot().phase, "disconnected");
  assert.deepEqual(controller.getSnapshot().participants, []);
});

test("only the GM can share and Stop Share clears Players without closing the GM image state", async () => {
  const session = createSessionHarness();
  const commands: unknown[] = [];
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    isGameMaster: true,
    participantDirectory: DIRECTORY,
    createSession: session.factory,
    fetcher: async (input, init) => {
      if (String(input).endsWith("/video/join")) return joinResponse();
      const command = JSON.parse(
        String(init?.body),
      ) as CampaignVideoPresentationCommand;
      commands.push(command);
      return presentationResponse(command);
    },
    onChange: () => undefined,
  });
  await controller.join();
  assert.equal(await controller.shareImage(IMAGE_ID), true);
  assert.equal(controller.getSnapshot().isPresenting, true);
  assert.deepEqual(commands, [
    {
      action: "show",
      imageId: IMAGE_ID,
      expanded: false,
      revision: 1,
    },
  ]);
  assert.equal(JSON.stringify(commands).includes(PRESENTATION_URL), false);

  assert.equal(await controller.stopPresentation(), true);
  assert.equal(controller.getSnapshot().isPresenting, false);
  assert.equal(controller.getSnapshot().sharedPresentation, null);
  assert.deepEqual(commands, [
    {
      action: "show",
      imageId: IMAGE_ID,
      expanded: false,
      revision: 1,
    },
    { action: "clear", revision: 2 },
  ]);

  const playerController = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    isGameMaster: false,
    participantDirectory: DIRECTORY,
    createSession: createSessionHarness().factory,
    fetcher: async () => joinResponse(),
    onChange: () => undefined,
  });
  await playerController.join();
  assert.equal(await playerController.shareImage(IMAGE_ID), false);
  assert.equal(await playerController.setPresentationExpanded(true), false);
  assert.equal(await playerController.stopPresentation(), false);
});

test("Expand and Collapse synchronize as ordered states while Share remains active", async () => {
  const session = createSessionHarness();
  const commands: CampaignVideoPresentationCommand[] = [];
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    isGameMaster: true,
    participantDirectory: DIRECTORY,
    createSession: session.factory,
    fetcher: async (input, init) => {
      if (String(input).endsWith("/video/join")) return joinResponse();
      const command = JSON.parse(
        String(init?.body),
      ) as CampaignVideoPresentationCommand;
      commands.push(command);
      return presentationResponse(command);
    },
    onChange: () => undefined,
  });

  await controller.join();
  assert.equal(await controller.shareImage(IMAGE_ID), true);
  assert.equal(controller.getSnapshot().presentationExpanded, false);
  assert.equal(await controller.setPresentationExpanded(true), true);
  assert.equal(controller.getSnapshot().presentationExpanded, true);
  assert.equal(controller.getSnapshot().isPresenting, true);
  assert.equal(await controller.setPresentationExpanded(false), true);
  assert.equal(controller.getSnapshot().presentationExpanded, false);
  assert.equal(controller.getSnapshot().isPresenting, true);
  assert.deepEqual(commands, [
    {
      action: "show",
      imageId: IMAGE_ID,
      expanded: false,
      revision: 1,
    },
    {
      action: "show",
      imageId: IMAGE_ID,
      expanded: true,
      revision: 2,
    },
    {
      action: "show",
      imageId: IMAGE_ID,
      expanded: false,
      revision: 3,
    },
  ]);

  await controller.setPresentationExpanded(true);
  assert.equal(await controller.stopPresentation(), true);
  assert.equal(controller.getSnapshot().isPresenting, false);
  assert.equal(controller.getSnapshot().presentationExpanded, false);
});

test("presentation failures leave the GM image workflow retryable without rejoining", async () => {
  const session = createSessionHarness();
  let failNextExpand = true;
  let failNextStop = true;
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    isGameMaster: true,
    participantDirectory: DIRECTORY,
    createSession: session.factory,
    fetcher: async (input, init) => {
      if (String(input).endsWith("/video/join")) return joinResponse();
      const command = JSON.parse(
        String(init?.body),
      ) as CampaignVideoPresentationCommand;
      if (command.action === "show" && command.expanded && failNextExpand) {
        failNextExpand = false;
        return new Response(
          JSON.stringify({
            ok: false,
            error: { code: "presentation_unavailable" },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }
      if (command.action === "clear" && failNextStop) {
        failNextStop = false;
        return new Response(
          JSON.stringify({
            ok: false,
            error: { code: "presentation_unavailable" },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }
      return presentationResponse(command);
    },
    onChange: () => undefined,
  });
  await controller.join();
  assert.equal(await controller.shareImage(IMAGE_ID), true);
  assert.equal(await controller.setPresentationExpanded(true), false);
  assert.equal(controller.getSnapshot().isPresenting, true);
  assert.equal(controller.getSnapshot().presentationExpanded, false);
  assert.equal(await controller.setPresentationExpanded(true), true);
  assert.equal(controller.getSnapshot().presentationExpanded, true);
  assert.equal(await controller.stopPresentation(), false);
  assert.equal(controller.getSnapshot().isPresenting, true);
  assert.equal(controller.getSnapshot().presentationExpanded, true);
  assert.equal(controller.getSnapshot().presentationBusy, false);
  assert.equal(
    controller.getSnapshot().presentationError,
    "presentation_unavailable",
  );
  assert.equal(await controller.stopPresentation(), true);
  assert.equal(controller.getSnapshot().isPresenting, false);
});

test("an active GM sends a fresh targeted presentation when a Player joins or rejoins", async () => {
  const session = createSessionHarness();
  const destinationIdentity = `participant-${"a".repeat(48)}`;
  const commands: Array<Record<string, unknown>> = [];
  let resolveLateRequest!: () => void;
  const lateRequest = new Promise<void>((resolve) => {
    resolveLateRequest = resolve;
  });
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    isGameMaster: true,
    participantDirectory: DIRECTORY.map((participant) =>
      participant.providerIdentity === "player-2-safe"
        ? { ...participant, providerIdentity: destinationIdentity }
        : participant,
    ),
    createSession: session.factory,
    fetcher: async (input, init) => {
      if (String(input).endsWith("/video/join")) return joinResponse();
      const command = JSON.parse(String(init?.body)) as Record<string, unknown>;
      commands.push(command);
      if (command.destinationIdentity) resolveLateRequest();
      return presentationResponse(
        command as CampaignVideoPresentationCommand,
      );
    },
    onChange: () => undefined,
  });
  await controller.join();
  await controller.shareImage(IMAGE_ID);
  await controller.setPresentationExpanded(true);
  session.callbacks().onParticipantConnected(destinationIdentity);
  await lateRequest;
  assert.deepEqual(commands[2], {
    action: "show",
    imageId: IMAGE_ID,
    expanded: true,
    revision: 2,
    destinationIdentity,
  });
});

test("a Player joining while Share completes receives the pending presentation", async () => {
  const session = createSessionHarness();
  const destinationIdentity = `participant-${"b".repeat(48)}`;
  const commands: CampaignVideoPresentationCommand[] = [];
  let markBroadcastSent!: () => void;
  let releaseBroadcastResponse!: () => void;
  let markTargetedSent!: () => void;
  const broadcastSent = new Promise<void>((resolve) => {
    markBroadcastSent = resolve;
  });
  const broadcastResponse = new Promise<void>((resolve) => {
    releaseBroadcastResponse = resolve;
  });
  const targetedSent = new Promise<void>((resolve) => {
    markTargetedSent = resolve;
  });
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    isGameMaster: true,
    participantDirectory: DIRECTORY.map((participant) =>
      participant.providerIdentity === "player-2-safe"
        ? { ...participant, providerIdentity: destinationIdentity }
        : participant,
    ),
    createSession: session.factory,
    fetcher: async (input, init) => {
      if (String(input).endsWith("/video/join")) return joinResponse();
      const command = JSON.parse(
        String(init?.body),
      ) as CampaignVideoPresentationCommand;
      commands.push(command);
      if (command.action === "show" && !command.destinationIdentity) {
        markBroadcastSent();
        await broadcastResponse;
      } else if (command.action === "show") {
        markTargetedSent();
      }
      return presentationResponse(command);
    },
    onChange: () => undefined,
  });

  await controller.join();
  const share = controller.shareImage(IMAGE_ID);
  await broadcastSent;
  session.callbacks().onParticipantConnected(destinationIdentity);
  releaseBroadcastResponse();
  assert.equal(await share, true);
  await targetedSent;
  assert.deepEqual(commands, [
    {
      action: "show",
      imageId: IMAGE_ID,
      expanded: false,
      revision: 1,
    },
    {
      action: "show",
      imageId: IMAGE_ID,
      expanded: false,
      revision: 1,
      destinationIdentity,
    },
  ]);
});

test("Players accept only valid server presentation packets and clear immediately when the GM departs", async () => {
  const session = createSessionHarness();
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    isGameMaster: false,
    participantDirectory: DIRECTORY,
    createSession: session.factory,
    fetcher: async () => joinResponse(),
    onChange: () => undefined,
  });
  await controller.join();
  const show = createCampaignVideoPresentationPacket({
    version: 1,
    action: "show",
    signedUrl: PRESENTATION_URL,
    expanded: true,
    revision: 2,
  });
  const clear = createCampaignVideoPresentationPacket({
    version: 1,
    action: "clear",
    revision: 3,
  });
  const staleClear = createCampaignVideoPresentationPacket({
    version: 1,
    action: "clear",
    revision: 1,
  });

  session.callbacks().onPresentationPacket(
    show,
    null,
    CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
  );
  assert.equal(controller.getSnapshot().sharedPresentation?.signedUrl, PRESENTATION_URL);
  assert.equal(controller.getSnapshot().presentationExpanded, true);

  session.callbacks().onPresentationPacket(
    staleClear,
    null,
    CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
  );
  assert.equal(controller.getSnapshot().isPresenting, true);
  assert.equal(controller.getSnapshot().presentationExpanded, true);

  session.callbacks().onPresentationPacket(
    clear,
    "player-2-safe",
    CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
  );
  session.callbacks().onPresentationPacket(clear, null, "untrusted-topic");
  session.callbacks().onParticipantDisconnected("player-2-safe");
  assert.equal(controller.getSnapshot().isPresenting, true);

  session.callbacks().onPresentationPacket(
    clear,
    null,
    CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
  );
  assert.equal(controller.getSnapshot().isPresenting, false);
  assert.equal(controller.getSnapshot().presentationExpanded, false);

  const reshared = createCampaignVideoPresentationPacket({
    version: 1,
    action: "show",
    signedUrl: PRESENTATION_URL,
    expanded: true,
    revision: 4,
  });
  session.callbacks().onPresentationPacket(
    reshared,
    null,
    CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
  );
  assert.equal(controller.getSnapshot().presentationExpanded, true);

  session.callbacks().onParticipantDisconnected("gm-safe");
  assert.equal(controller.getSnapshot().isPresenting, false);
  assert.equal(controller.getSnapshot().presentationExpanded, false);
  assert.equal(controller.getSnapshot().sharedPresentation, null);

  session.callbacks().onPresentationPacket(
    show,
    null,
    CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
  );
  session.callbacks().onPresentationPacket(
    new TextEncoder().encode(
      '{"version":1,"action":"show","expanded":true,"revision":3,"signedUrl":"https://untrusted.invalid"}',
    ),
    null,
    CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
  );
  assert.equal(controller.getSnapshot().sharedPresentation, null);
  assert.equal(
    controller.getSnapshot().presentationError,
    "presentation_unavailable",
  );
});

test("track attachment has symmetric cleanup and no-op empty behavior", () => {
  const calls: string[] = [];
  const element = {} as HTMLMediaElement;
  const cleanup = attachCampaignVideoTrack(
    {
      id: "safe-track",
      kind: "camera",
      attach(received) {
        assert.equal(received, element);
        calls.push("attach");
      },
      detach(received) {
        assert.equal(received, element);
        calls.push("detach");
      },
    },
    element,
  );
  cleanup();
  attachCampaignVideoTrack(null, element)();
  assert.deepEqual(calls, ["attach", "detach"]);
});

test("device failures map to sanitized permission and availability errors", () => {
  const permission = new Error("sensitive browser details");
  permission.name = "NotAllowedError";
  const unavailable = new Error("sensitive device label");
  unavailable.name = "NotFoundError";
  assert.equal(
    classifyCampaignVideoMediaError(permission),
    "permission_denied",
  );
  assert.equal(
    classifyCampaignVideoMediaError(unavailable),
    "device_unavailable",
  );
  assert.equal(
    classifyCampaignVideoMediaError(new Error("provider internals")),
    "media_unavailable",
  );
});

test("unmount aborts an unfinished credential request before room construction", async () => {
  let aborted = false;
  let factoryCalls = 0;
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    participantDirectory: DIRECTORY,
    createSession: async () => {
      factoryCalls += 1;
      throw new Error("must not run");
    },
    fetcher: async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => {
            aborted = true;
            reject(new DOMException("aborted", "AbortError"));
          },
          { once: true },
        );
      }),
    onChange: () => undefined,
  });
  const join = controller.join();
  await controller.dispose();
  await join;
  assert.equal(aborted, true);
  assert.equal(factoryCalls, 0);
});

test("late media completion cannot restore stale state after leave", async () => {
  let finishCamera!: () => void;
  const cameraOperation = new Promise<void>((resolve) => {
    finishCamera = resolve;
  });
  const controller = createCampaignVideoRoomController({
    campaignId: CAMPAIGN_ID,
    campaignActive: true,
    directoryReady: true,
    participantDirectory: DIRECTORY,
    createSession: async () => ({
      setCameraEnabled: async () => cameraOperation,
      setMicrophoneEnabled: async () => undefined,
      startAudio: async () => undefined,
      disconnect: async () => undefined,
    }),
    fetcher: async () => joinResponse(),
    onChange: () => undefined,
  });
  await controller.join();
  const media = controller.setCameraEnabled(true);
  await controller.leave();
  finishCamera();
  await media;
  assert.equal(controller.getSnapshot().phase, "disconnected");
  assert.equal(controller.getSnapshot().cameraEnabled, false);
});

test("campaign room UI and localization retain the accessible fail-closed controls", () => {
  const component = readFileSync(
    path.join(
      process.cwd(),
      "components",
      "campaigns",
      "campaign-video-room.tsx",
    ),
    "utf8",
  );
  const english = JSON.parse(
    readFileSync(path.join(process.cwd(), "messages", "en.json"), "utf8"),
  ) as { CampaignVideoRoom: Record<string, unknown> };
  const russian = JSON.parse(
    readFileSync(path.join(process.cwd(), "messages", "ru.json"), "utf8"),
  ) as { CampaignVideoRoom: Record<string, unknown> };
  const messageKeys = (
    value: Record<string, unknown>,
    prefix = "",
  ): string[] =>
    Object.entries(value).flatMap(([key, entry]) => {
      const next = prefix ? `${prefix}.${key}` : key;
      return entry && typeof entry === "object" && !Array.isArray(entry)
        ? messageKeys(entry as Record<string, unknown>, next)
        : [next];
    });
  for (const required of [
    'translations("join")',
    'translations("leave")',
    'translations("camera.enable")',
    'translations("microphone.enable")',
    'translations("enableSound")',
    'translations("cameraOff")',
    'translations("connectedParticipant")',
    'translations("leaveCompact")',
    'aria-live="polite"',
    'aria-pressed={snapshot.cameraEnabled}',
    'aria-pressed={snapshot.microphoneEnabled}',
  ]) {
    assert.equal(component.includes(required), true, required);
  }
  assert.equal(component.includes("bg-gradient-to-b"), false);
  assert.equal(component.includes("bg-gradient-to-t"), false);
  assert.equal(component.includes("youSuffix"), false);
  assert.deepEqual(
    messageKeys(english.CampaignVideoRoom).sort(),
    messageKeys(russian.CampaignVideoRoom).sort(),
  );
  for (const forbidden of [
    "localStorage",
    "sessionStorage",
    "document.cookie",
    "console.",
    "setScreenShareEnabled",
    "publishData",
  ]) {
    assert.equal(component.includes(forbidden), false, forbidden);
  }
});
