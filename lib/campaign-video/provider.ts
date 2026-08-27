import type {
  CampaignVideoPublicationPermissions,
  CampaignVideoRole,
  CampaignVideoSafeErrorCode,
} from "./contracts";

export type CampaignVideoRoomRequest = {
  roomName: string;
  maxParticipants: number;
};

export type CampaignVideoCredentialRequest = {
  roomName: string;
  participantIdentity: string;
  role: CampaignVideoRole;
  publication: CampaignVideoPublicationPermissions;
  ttlSeconds: number;
};

export type CampaignVideoConnectionCredentials = {
  url: string;
  token: string;
  expiresAt: string;
};

export interface CampaignVideoProvider {
  ensureRoom(request: CampaignVideoRoomRequest): Promise<void>;
  mintConnectionCredentials(
    request: CampaignVideoCredentialRequest,
  ): Promise<CampaignVideoConnectionCredentials>;
}

export class CampaignVideoProviderError extends Error {
  constructor(
    readonly safeCode: Extract<
      CampaignVideoSafeErrorCode,
      "capacity_unavailable" | "provider_unavailable"
    >,
  ) {
    super("campaign_video_provider_error");
    this.name = "CampaignVideoProviderError";
  }
}

export class InMemoryCampaignVideoProvider implements CampaignVideoProvider {
  readonly rooms = new Map<string, number>();
  readonly roomRequests: CampaignVideoRoomRequest[] = [];
  readonly credentialRequests: CampaignVideoCredentialRequest[] = [];
  failWith: CampaignVideoProviderError | null = null;

  async ensureRoom(request: CampaignVideoRoomRequest): Promise<void> {
    this.roomRequests.push({ ...request });
    if (this.failWith) throw this.failWith;
    const existing = this.rooms.get(request.roomName);
    if (existing !== undefined && existing !== request.maxParticipants) {
      throw new CampaignVideoProviderError("capacity_unavailable");
    }
    this.rooms.set(request.roomName, request.maxParticipants);
  }

  async mintConnectionCredentials(
    request: CampaignVideoCredentialRequest,
  ): Promise<CampaignVideoConnectionCredentials> {
    this.credentialRequests.push({
      ...request,
      publication: { ...request.publication },
    });
    if (this.failWith) throw this.failWith;
    return {
      url: "wss://test.invalid/",
      token: `test-token-${request.participantIdentity}`,
      expiresAt: new Date(1_900_000_000_000).toISOString(),
    };
  }
}
