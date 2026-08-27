import {
  AccessToken,
  RoomServiceClient,
  ServerError,
  TrackSource,
} from "livekit-server-sdk";

import type { LiveKitServerConfiguration } from "../config";
import type {
  CampaignVideoConnectionCredentials,
  CampaignVideoCredentialRequest,
  CampaignVideoProvider,
  CampaignVideoRoomRequest,
} from "../provider";
import { CampaignVideoProviderError } from "../provider";

type LiveKitRoom = {
  name: string;
  maxParticipants: number;
};

export interface LiveKitRoomService {
  listRooms(names?: string[]): Promise<LiveKitRoom[]>;
  createRoom(options: {
    name: string;
    maxParticipants: number;
  }): Promise<LiveKitRoom>;
}

function isAlreadyExists(error: unknown): boolean {
  return error instanceof ServerError && error.code === "already_exists";
}

function requireCompatibleRoom(
  rooms: LiveKitRoom[],
  request: CampaignVideoRoomRequest,
): boolean {
  if (rooms.length === 0) return false;
  if (
    rooms.length !== 1 ||
    rooms[0]?.name !== request.roomName ||
    rooms[0].maxParticipants !== request.maxParticipants
  ) {
    throw new CampaignVideoProviderError("capacity_unavailable");
  }
  return true;
}

function readTokenExpiration(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    return typeof decoded.exp === "number" && Number.isInteger(decoded.exp)
      ? decoded.exp
      : null;
  } catch {
    return null;
  }
}

function publicationSources(
  request: CampaignVideoCredentialRequest,
): TrackSource[] {
  const sources: TrackSource[] = [];
  if (request.publication.video) sources.push(TrackSource.CAMERA);
  if (request.publication.audio) sources.push(TrackSource.MICROPHONE);
  return sources;
}

export class LiveKitCampaignVideoProvider implements CampaignVideoProvider {
  private readonly roomService: LiveKitRoomService;

  constructor(
    private readonly configuration: LiveKitServerConfiguration,
    roomService?: LiveKitRoomService,
  ) {
    this.roomService =
      roomService ??
      new RoomServiceClient(
        configuration.url,
        configuration.apiKey,
        configuration.apiSecret,
        { requestTimeout: 8 },
      );
  }

  async ensureRoom(request: CampaignVideoRoomRequest): Promise<void> {
    try {
      const existing = await this.roomService.listRooms([request.roomName]);
      if (requireCompatibleRoom(existing, request)) return;

      try {
        const created = await this.roomService.createRoom({
          name: request.roomName,
          maxParticipants: request.maxParticipants,
        });
        requireCompatibleRoom([created], request);
      } catch (error) {
        if (!isAlreadyExists(error)) throw error;
        const raced = await this.roomService.listRooms([request.roomName]);
        if (!requireCompatibleRoom(raced, request)) {
          throw new CampaignVideoProviderError("provider_unavailable");
        }
      }
    } catch (error) {
      if (error instanceof CampaignVideoProviderError) throw error;
      throw new CampaignVideoProviderError("provider_unavailable");
    }
  }

  async mintConnectionCredentials(
    request: CampaignVideoCredentialRequest,
  ): Promise<CampaignVideoConnectionCredentials> {
    try {
      const sources = publicationSources(request);
      const accessToken = new AccessToken(
        this.configuration.apiKey,
        this.configuration.apiSecret,
        {
          identity: request.participantIdentity,
          ttl: request.ttlSeconds,
        },
      );
      accessToken.addGrant({
        roomJoin: true,
        room: request.roomName,
        canSubscribe: true,
        canPublish: sources.length > 0,
        canPublishSources: sources,
        canPublishData: false,
        canUpdateOwnMetadata: false,
        roomCreate: false,
        roomList: false,
        roomRecord: false,
        roomAdmin: false,
        ingressAdmin: false,
        recorder: false,
        agent: false,
        canSubscribeMetrics: false,
        canManageAgentSession: false,
      });

      const token = await accessToken.toJwt();
      const expiration = readTokenExpiration(token);
      if (expiration === null) {
        throw new CampaignVideoProviderError("provider_unavailable");
      }
      return {
        url: this.configuration.url,
        token,
        expiresAt: new Date(expiration * 1_000).toISOString(),
      };
    } catch (error) {
      if (error instanceof CampaignVideoProviderError) throw error;
      throw new CampaignVideoProviderError("provider_unavailable");
    }
  }
}
