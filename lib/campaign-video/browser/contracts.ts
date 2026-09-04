import type {
  CampaignVideoPublicationPermissions,
  CampaignVideoRole,
} from "../contracts";

export type CampaignVideoParticipantDirectoryEntry = {
  providerIdentity: string;
  displayName: string;
  role: CampaignVideoRole;
  playerPosition: number | null;
  isCurrentUser: boolean;
};

export type CampaignVideoTrackKind = "camera" | "microphone";

export type CampaignVideoTrackAttachment = {
  id: string;
  kind: CampaignVideoTrackKind;
  attach(element: HTMLMediaElement): void;
  detach(element: HTMLMediaElement): void;
};

export type CampaignVideoProviderParticipant = {
  identity: string;
  isLocal: boolean;
  camera: CampaignVideoTrackAttachment | null;
  microphone: CampaignVideoTrackAttachment | null;
};

export type CampaignVideoParticipantView =
  CampaignVideoParticipantDirectoryEntry & {
    isLocal: boolean;
    camera: CampaignVideoTrackAttachment | null;
    microphone: CampaignVideoTrackAttachment | null;
  };

export type CampaignVideoRoomPhase =
  | "idle"
  | "requesting_credentials"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "terminal_error";

export type CampaignVideoClientErrorCode =
  | "authentication_required"
  | "campaign_unavailable"
  | "campaign_inactive"
  | "capacity_unavailable"
  | "configuration_unavailable"
  | "provider_unavailable"
  | "permission_denied"
  | "device_unavailable"
  | "media_unavailable"
  | "connection_failed"
  | "unexpected_error";

export type CampaignVideoRoomSnapshot = {
  phase: CampaignVideoRoomPhase;
  participants: CampaignVideoParticipantView[];
  publication: CampaignVideoPublicationPermissions;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  audioBlocked: boolean;
  restored: boolean;
  error: CampaignVideoClientErrorCode | null;
  isPresenting: boolean;
  presentationExpanded: boolean;
  sharedPresentation: {
    signedUrl: string;
  } | null;
  presentationBusy: boolean;
  presentationError: "presentation_unavailable" | null;
};

export type CampaignVideoConnectionCredentials = {
  url: string;
  token: string;
  expiresAt: string;
  publication: CampaignVideoPublicationPermissions;
};

export type CampaignVideoRoomSessionCallbacks = {
  onParticipants(participants: CampaignVideoProviderParticipant[]): void;
  onParticipantConnected(identity: string): void;
  onParticipantDisconnected(identity: string): void;
  onPresentationPacket(
    payload: Uint8Array,
    senderIdentity: string | null,
    topic: string | null,
  ): void;
  onReconnecting(): void;
  onReconnected(): void;
  onTerminalDisconnect(): void;
  onAudioBlocked(blocked: boolean): void;
  onMediaError(error: CampaignVideoClientErrorCode): void;
};

export interface CampaignVideoRoomSession {
  setCameraEnabled(enabled: boolean): Promise<void>;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;
  startAudio(): Promise<void>;
  disconnect(): Promise<void>;
}

export type CampaignVideoRoomSessionFactory = (
  credentials: CampaignVideoConnectionCredentials,
  callbacks: CampaignVideoRoomSessionCallbacks,
  signal: AbortSignal,
) => Promise<CampaignVideoRoomSession>;
