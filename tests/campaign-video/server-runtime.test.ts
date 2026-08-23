import assert from "node:assert/strict";
import test from "node:test";

import { ServerError, TokenVerifier } from "livekit-server-sdk";

import {
  authorizeCampaignVideoJoin,
  type CampaignVideoAuthorizationDataSource,
  type CampaignVideoCampaignRecord,
  type CampaignVideoPlayerRecord,
  type CampaignVideoPublicationRecord,
} from "../../lib/campaign-video/authorization";
import {
  parseLiveKitServerConfiguration,
  type LiveKitServerConfiguration,
} from "../../lib/campaign-video/config";
import {
  CAMPAIGN_VIDEO_MAX_PARTICIPANTS,
  CAMPAIGN_VIDEO_TOKEN_TTL_SECONDS,
} from "../../lib/campaign-video/contracts";
import { createCampaignVideoJoinHandler } from "../../lib/campaign-video/join-handler";
import {
  deriveCampaignVideoParticipantIdentity,
  deriveCampaignVideoRoomName,
} from "../../lib/campaign-video/mapping";
import {
  CampaignVideoProviderError,
  InMemoryCampaignVideoProvider,
} from "../../lib/campaign-video/provider";
import {
  LiveKitCampaignVideoProvider,
  type LiveKitRoomService,
} from "../../lib/campaign-video/providers/livekit";

const CAMPAIGN_ID = "a1000000-0000-4000-8000-000000000001";
const OTHER_CAMPAIGN_ID = "a1000000-0000-4000-8000-000000000002";
const GM_ID = "a1000000-0000-4000-8000-000000000003";
const PLAYER_IDS = Array.from(
  { length: 6 },
  (_, index) => `a1000000-0000-4000-8000-00000000000${index + 4}`,
);
const OUTSIDER_ID = "a1000000-0000-4000-8000-000000000010";
const TEST_API_KEY = "synthetic-livekit-api-key";
const TEST_API_SECRET = "synthetic-livekit-api-secret-at-least-32-chars";
const TEST_CONFIGURATION: LiveKitServerConfiguration = {
  url: "wss://campaign-video.test.invalid/",
  apiKey: TEST_API_KEY,
  apiSecret: TEST_API_SECRET,
};

type FakeData = {
  userId: string | null;
  campaign: CampaignVideoCampaignRecord | null;
  player: CampaignVideoPlayerRecord | null;
  publication: CampaignVideoPublicationRecord | null;
};

class FakeDataSource implements CampaignVideoAuthorizationDataSource {
  readonly calls: string[] = [];

  constructor(readonly data: FakeData) {}

  async getAuthenticatedUserId(): Promise<string | null> {
    this.calls.push("auth");
    return this.data.userId;
  }

  async findCampaign(): Promise<CampaignVideoCampaignRecord | null> {
    this.calls.push("campaign");
    return this.data.campaign;
  }

  async findPlayer(): Promise<CampaignVideoPlayerRecord | null> {
    this.calls.push("player");
    return this.data.player;
  }

  async findPlayerPublication(): Promise<CampaignVideoPublicationRecord | null> {
    this.calls.push("publication");
    return this.data.publication;
  }
}

function activeCampaign(): CampaignVideoCampaignRecord {
  return { id: CAMPAIGN_ID, status: "active", gameMasterId: GM_ID };
}

function createRequest(body: string, contentType = "application/json") {
  return new Request(
    `https://application.test/api/campaigns/${CAMPAIGN_ID}/video/join`,
    { method: "POST", headers: { "Content-Type": contentType }, body },
  );
}

function createHarness(
  data: FakeData,
  provider = new InMemoryCampaignVideoProvider(),
  configurationAvailable = true,
) {
  const dataSource = new FakeDataSource(data);
  let providerFactoryCalls = 0;
  const handler = createCampaignVideoJoinHandler({
    createDataSource: async () => dataSource,
    getConfiguration: () =>
      configurationAvailable
        ? { ok: true, configuration: TEST_CONFIGURATION }
        : { ok: false },
    createProvider: () => {
      providerFactoryCalls += 1;
      return provider;
    },
  });
  return {
    dataSource,
    provider,
    handler,
    providerFactoryCalls: () => providerFactoryCalls,
  };
}

async function invoke(
  harness: ReturnType<typeof createHarness>,
  body = "{}",
  campaignId = CAMPAIGN_ID,
  contentType = "application/json",
) {
  const response = await harness.handler(createRequest(body, contentType), {
    params: Promise.resolve({ campaignId }),
  });
  return {
    response,
    json: (await response.json()) as Record<string, unknown>,
  };
}

function providerOperationCount(provider: InMemoryCampaignVideoProvider) {
  return provider.roomRequests.length + provider.credentialRequests.length;
}

test("server-only configuration accepts exactly complete conventional LiveKit values", () => {
  assert.deepEqual(
    parseLiveKitServerConfiguration({
      LIVEKIT_URL: "wss://campaign-video.test.invalid",
      LIVEKIT_API_KEY: TEST_API_KEY,
      LIVEKIT_API_SECRET: TEST_API_SECRET,
    }),
    { ok: true, configuration: TEST_CONFIGURATION },
  );
  for (const environment of [
    {},
    { LIVEKIT_URL: "wss://campaign-video.test.invalid" },
    {
      LIVEKIT_URL: "https://campaign-video.test.invalid",
      LIVEKIT_API_KEY: TEST_API_KEY,
      LIVEKIT_API_SECRET: TEST_API_SECRET,
    },
    {
      LIVEKIT_URL: "wss://campaign-video.test.invalid/path",
      LIVEKIT_API_KEY: TEST_API_KEY,
      LIVEKIT_API_SECRET: TEST_API_SECRET,
    },
    {
      LIVEKIT_URL: "wss://campaign-video.test.invalid",
      LIVEKIT_API_KEY: `${TEST_API_KEY}\n`,
      LIVEKIT_API_SECRET: TEST_API_SECRET,
    },
  ]) {
    assert.deepEqual(parseLiveKitServerConfiguration(environment), {
      ok: false,
    });
  }
});

test("malformed JSON and unexpected fields return 400 before authorization or provider dispatch", async () => {
  for (const body of [
    "{",
    "null",
    "[]",
    JSON.stringify({ room: "client-room" }),
    JSON.stringify({ identity: "client-identity" }),
    JSON.stringify({ role: "game_master" }),
    JSON.stringify({ playerPosition: 1 }),
    JSON.stringify({ grants: { roomAdmin: true } }),
    JSON.stringify({ ttl: 86_400 }),
  ]) {
    const harness = createHarness({
      userId: GM_ID,
      campaign: activeCampaign(),
      player: null,
      publication: null,
    });
    const { response, json } = await invoke(harness, body);
    assert.equal(response.status, 400);
    assert.deepEqual(json, {
      ok: false,
      error: { code: "malformed_request" },
    });
    assert.deepEqual(harness.dataSource.calls, []);
    assert.equal(providerOperationCount(harness.provider), 0);
  }
});

test("invalid campaign path and non-JSON content fail before provider dispatch", async () => {
  const harness = createHarness({
    userId: GM_ID,
    campaign: activeCampaign(),
    player: null,
    publication: null,
  });
  const invalidPath = await invoke(harness, "{}", "not-a-uuid");
  assert.equal(invalidPath.response.status, 400);
  for (const contentType of [
    "text/plain",
    "application/jsonp",
    "application/json-patch+json",
  ]) {
    const invalidType = await invoke(harness, "{}", CAMPAIGN_ID, contentType);
    assert.equal(invalidType.response.status, 400);
  }
  assert.equal(providerOperationCount(harness.provider), 0);
});

test("JSON media type parameters preserve the exact empty-object contract", async () => {
  const harness = createHarness({
    userId: GM_ID,
    campaign: activeCampaign(),
    player: null,
    publication: null,
  });
  const result = await invoke(
    harness,
    "{}",
    CAMPAIGN_ID,
    "Application/JSON; charset=utf-8",
  );
  assert.equal(result.response.status, 200);
  assert.equal(providerOperationCount(harness.provider), 2);
});

test("unauthenticated, outsider, removed Player, and completed campaign requests dispatch no provider operation", async () => {
  const cases: Array<{ data: FakeData; status: number; code: string }> = [
    {
      data: { userId: null, campaign: null, player: null, publication: null },
      status: 401,
      code: "authentication_required",
    },
    {
      data: {
        userId: OUTSIDER_ID,
        campaign: null,
        player: null,
        publication: null,
      },
      status: 404,
      code: "campaign_inaccessible",
    },
    {
      data: {
        userId: PLAYER_IDS[0]!,
        campaign: activeCampaign(),
        player: null,
        publication: null,
      },
      status: 403,
      code: "membership_required",
    },
    {
      data: {
        userId: PLAYER_IDS[0]!,
        campaign: { ...activeCampaign(), status: "completed" },
        player: { displayOrder: 1 },
        publication: null,
      },
      status: 409,
      code: "campaign_inactive",
    },
  ];
  for (const entry of cases) {
    const harness = createHarness(entry.data);
    const { response, json } = await invoke(harness);
    assert.equal(response.status, entry.status);
    assert.deepEqual(json, { ok: false, error: { code: entry.code } });
    assert.equal(providerOperationCount(harness.provider), 0);
    assert.equal(harness.providerFactoryCalls(), 0);
  }
});

test("active GM and all six valid Player positions receive credentials", async () => {
  const gmHarness = createHarness({
    userId: GM_ID,
    campaign: activeCampaign(),
    player: null,
    publication: null,
  });
  const gmResult = await invoke(gmHarness);
  assert.equal(gmResult.response.status, 200);
  assert.deepEqual(gmResult.json.participant, {
    role: "game_master",
    playerPosition: null,
    publication: { audio: true, video: true },
  });
  assert.equal(providerOperationCount(gmHarness.provider), 2);

  for (let position = 1; position <= 6; position += 1) {
    const harness = createHarness({
      userId: PLAYER_IDS[position - 1]!,
      campaign: activeCampaign(),
      player: { displayOrder: position },
      publication: null,
    });
    const result = await invoke(harness);
    assert.equal(result.response.status, 200);
    assert.deepEqual(result.json.participant, {
      role: "player",
      playerPosition: position,
      publication: { audio: true, video: true },
    });
    assert.equal(providerOperationCount(harness.provider), 2);
  }
});

test("invalid or missing Player positions fail closed", async () => {
  for (const displayOrder of [null, 0, 7, 1.5]) {
    const result = await authorizeCampaignVideoJoin(
      CAMPAIGN_ID,
      new FakeDataSource({
        userId: PLAYER_IDS[0]!,
        campaign: activeCampaign(),
        player: { displayOrder },
        publication: null,
      }),
    );
    assert.deepEqual(result, {
      ok: false,
      error: { code: "invalid_player_state" },
    });
  }
});

test("room and participant mappings are stable, campaign-scoped, distinct, and contain no raw identifiers", () => {
  const room = deriveCampaignVideoRoomName(CAMPAIGN_ID);
  assert.equal(room, deriveCampaignVideoRoomName(CAMPAIGN_ID));
  assert.notEqual(room, deriveCampaignVideoRoomName(OTHER_CAMPAIGN_ID));
  assert.equal(room.includes(CAMPAIGN_ID), false);

  const identities = [GM_ID, ...PLAYER_IDS].map((userId) =>
    deriveCampaignVideoParticipantIdentity(CAMPAIGN_ID, userId),
  );
  assert.equal(new Set(identities).size, 7);
  assert.equal(
    identities[1],
    deriveCampaignVideoParticipantIdentity(CAMPAIGN_ID, PLAYER_IDS[0]!),
  );
  for (const [index, identity] of identities.entries()) {
    const rawId = [GM_ID, ...PLAYER_IDS][index]!;
    assert.equal(identity.includes(rawId), false);
    assert.equal(identity.includes("@"), false);
  }
});

test("same account receives the same logical identity across device representations", async () => {
  const provider = new InMemoryCampaignVideoProvider();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const harness = createHarness(
      {
        userId: PLAYER_IDS[0]!,
        campaign: activeCampaign(),
        player: { displayOrder: 1 },
        publication: null,
      },
      provider,
    );
    assert.equal((await invoke(harness)).response.status, 200);
  }
  assert.equal(provider.credentialRequests.length, 3);
  assert.equal(
    new Set(provider.credentialRequests.map((request) => request.participantIdentity))
      .size,
    1,
  );
  assert.equal(provider.rooms.size, 1);
});

test("room requests always enforce the one-GM plus six-Player provider limit", async () => {
  const harness = createHarness({
    userId: GM_ID,
    campaign: activeCampaign(),
    player: null,
    publication: null,
  });
  await invoke(harness);
  assert.deepEqual(harness.provider.roomRequests, [
    {
      roomName: deriveCampaignVideoRoomName(CAMPAIGN_ID),
      maxParticipants: CAMPAIGN_VIDEO_MAX_PARTICIPANTS,
    },
  ]);
});

class CompatibleRoomService implements LiveKitRoomService {
  readonly room = {
    name: deriveCampaignVideoRoomName(CAMPAIGN_ID),
    maxParticipants: CAMPAIGN_VIDEO_MAX_PARTICIPANTS,
  };
  createCalls = 0;

  async listRooms(): Promise<(typeof this.room)[]> {
    return [this.room];
  }

  async createRoom(): Promise<typeof this.room> {
    this.createCalls += 1;
    return this.room;
  }
}

function decodePayload(token: string): Record<string, unknown> {
  return JSON.parse(
    Buffer.from(token.split(".")[1]!, "base64url").toString("utf8"),
  ) as Record<string, unknown>;
}

test("real LiveKit token path binds a short-lived token to one room with no administrative grants", async () => {
  const roomService = new CompatibleRoomService();
  const provider = new LiveKitCampaignVideoProvider(
    TEST_CONFIGURATION,
    roomService,
  );
  const roomName = roomService.room.name;
  const identity = deriveCampaignVideoParticipantIdentity(CAMPAIGN_ID, GM_ID);
  await provider.ensureRoom({
    roomName,
    maxParticipants: CAMPAIGN_VIDEO_MAX_PARTICIPANTS,
  });
  const connection = await provider.mintConnectionCredentials({
    roomName,
    participantIdentity: identity,
    role: "game_master",
    publication: { audio: true, video: true },
    ttlSeconds: CAMPAIGN_VIDEO_TOKEN_TTL_SECONDS,
  });
  const verified = await new TokenVerifier(
    TEST_API_KEY,
    TEST_API_SECRET,
  ).verify(connection.token);
  const payload = decodePayload(connection.token);
  const video = verified.video as unknown as Record<string, unknown>;

  assert.equal(verified.sub, identity);
  assert.equal(video.room, roomName);
  assert.equal(video.roomJoin, true);
  assert.equal(video.canSubscribe, true);
  assert.equal(video.canPublish, true);
  assert.deepEqual(video.canPublishSources, ["camera", "microphone"]);
  assert.equal(video.canPublishData, false);
  assert.equal(video.canUpdateOwnMetadata, false);
  for (const grant of [
    "roomCreate",
    "roomList",
    "roomRecord",
    "roomAdmin",
    "ingressAdmin",
    "recorder",
    "agent",
    "canSubscribeMetrics",
    "canManageAgentSession",
  ]) {
    assert.equal(video[grant], false);
  }
  assert.equal(payload.sip, undefined);
  assert.equal(payload.inference, undefined);
  assert.equal(payload.observability, undefined);
  assert.equal(payload.name, undefined);
  assert.equal(payload.metadata, undefined);
  assert.equal(payload.attributes, undefined);
  assert.equal(
    (payload.exp as number) - (payload.nbf as number),
    CAMPAIGN_VIDEO_TOKEN_TTL_SECONDS,
  );
  assert.equal(connection.url, TEST_CONFIGURATION.url);
  assert.equal(roomService.createCalls, 0);
});

test("publication restrictions become source-specific fail-closed LiveKit grants", async () => {
  const provider = new LiveKitCampaignVideoProvider(
    TEST_CONFIGURATION,
    new CompatibleRoomService(),
  );
  const cases = [
    { publication: { audio: true, video: true }, canPublish: true, sources: ["camera", "microphone"] },
    { publication: { audio: false, video: true }, canPublish: true, sources: ["camera"] },
    { publication: { audio: true, video: false }, canPublish: true, sources: ["microphone"] },
    { publication: { audio: false, video: false }, canPublish: false, sources: [] },
  ];
  for (const entry of cases) {
    const connection = await provider.mintConnectionCredentials({
      roomName: deriveCampaignVideoRoomName(CAMPAIGN_ID),
      participantIdentity: deriveCampaignVideoParticipantIdentity(
        CAMPAIGN_ID,
        PLAYER_IDS[0]!,
      ),
      role: "player",
      publication: entry.publication,
      ttlSeconds: CAMPAIGN_VIDEO_TOKEN_TTL_SECONDS,
    });
    const claims = await new TokenVerifier(
      TEST_API_KEY,
      TEST_API_SECRET,
    ).verify(connection.token);
    const video = claims.video as unknown as Record<string, unknown>;
    assert.equal(video.canPublish, entry.canPublish);
    assert.deepEqual(video.canPublishSources, entry.sources);
    assert.equal(video.canPublishData, false);
  }
});

test("missing configuration fails after authorization and before provider creation", async () => {
  const harness = createHarness(
    {
      userId: GM_ID,
      campaign: activeCampaign(),
      player: null,
      publication: null,
    },
    new InMemoryCampaignVideoProvider(),
    false,
  );
  const { response, json } = await invoke(harness);
  assert.equal(response.status, 503);
  assert.deepEqual(json, {
    ok: false,
    error: { code: "configuration_unavailable" },
  });
  assert.equal(harness.providerFactoryCalls(), 0);
  assert.equal(providerOperationCount(harness.provider), 0);
});

test("provider and unexpected failures return sanitized 5xx responses without secrets", async () => {
  const unavailable = new InMemoryCampaignVideoProvider();
  unavailable.failWith = new CampaignVideoProviderError("provider_unavailable");
  const harness = createHarness(
    {
      userId: GM_ID,
      campaign: activeCampaign(),
      player: null,
      publication: null,
    },
    unavailable,
  );
  const { response, json } = await invoke(harness);
  assert.equal(response.status, 503);
  assert.deepEqual(json, {
    ok: false,
    error: { code: "provider_unavailable" },
  });
  const serialized = JSON.stringify(json);
  assert.equal(serialized.includes(TEST_API_KEY), false);
  assert.equal(serialized.includes(TEST_API_SECRET), false);
  assert.equal(serialized.includes(GM_ID), false);

  const throwingDataSource = new FakeDataSource({
    userId: GM_ID,
    campaign: activeCampaign(),
    player: null,
    publication: null,
  });
  throwingDataSource.getAuthenticatedUserId = async () => {
    throw new Error(`must stay hidden: ${TEST_API_SECRET}`);
  };
  const handler = createCampaignVideoJoinHandler({
    createDataSource: async () => throwingDataSource,
    getConfiguration: () => ({ ok: true, configuration: TEST_CONFIGURATION }),
    createProvider: () => new InMemoryCampaignVideoProvider(),
  });
  const unexpected = await handler(createRequest("{}"), {
    params: Promise.resolve({ campaignId: CAMPAIGN_ID }),
  });
  assert.equal(unexpected.status, 500);
  assert.deepEqual(await unexpected.json(), {
    ok: false,
    error: { code: "unexpected_error" },
  });
});

test("concurrent first-room ensures converge on one compatible current room", async () => {
  const roomName = deriveCampaignVideoRoomName(CAMPAIGN_ID);
  let currentRoom: { name: string; maxParticipants: number } | null = null;
  let initialReads = 0;
  let releaseInitialReads!: () => void;
  const bothRead = new Promise<void>((resolve) => {
    releaseInitialReads = resolve;
  });
  let createAttempts = 0;
  let successfulCreates = 0;
  const service: LiveKitRoomService = {
    async listRooms() {
      if (currentRoom) return [currentRoom];
      initialReads += 1;
      if (initialReads === 2) releaseInitialReads();
      await bothRead;
      return [];
    },
    async createRoom(options) {
      createAttempts += 1;
      if (currentRoom) {
        throw new ServerError(
          "Conflict",
          "synthetic conflict",
          409,
          "already_exists",
        );
      }
      currentRoom = { ...options };
      successfulCreates += 1;
      return currentRoom;
    },
  };
  const provider = new LiveKitCampaignVideoProvider(TEST_CONFIGURATION, service);
  const request = {
    roomName,
    maxParticipants: CAMPAIGN_VIDEO_MAX_PARTICIPANTS,
  };
  await Promise.all([provider.ensureRoom(request), provider.ensureRoom(request)]);
  assert.equal(initialReads, 2);
  assert.equal(createAttempts, 2);
  assert.equal(successfulCreates, 1);
  assert.deepEqual(currentRoom, {
    name: request.roomName,
    maxParticipants: request.maxParticipants,
  });
});

test("an incompatible existing LiveKit room fails the capacity layer", async () => {
  const roomName = deriveCampaignVideoRoomName(CAMPAIGN_ID);
  const service: LiveKitRoomService = {
    async listRooms() {
      return [{ name: roomName, maxParticipants: 8 }];
    },
    async createRoom() {
      throw new Error("must not create");
    },
  };
  const provider = new LiveKitCampaignVideoProvider(TEST_CONFIGURATION, service);
  await assert.rejects(
    provider.ensureRoom({
      roomName,
      maxParticipants: CAMPAIGN_VIDEO_MAX_PARTICIPANTS,
    }),
    (error: unknown) =>
      error instanceof CampaignVideoProviderError &&
      error.safeCode === "capacity_unavailable",
  );
});
