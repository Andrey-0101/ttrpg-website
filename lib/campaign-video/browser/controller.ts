import type { CampaignVideoJoinResult } from "../contracts";
import type {
  CampaignVideoClientErrorCode,
  CampaignVideoConnectionCredentials,
  CampaignVideoParticipantDirectoryEntry,
  CampaignVideoProviderParticipant,
  CampaignVideoRoomSession,
  CampaignVideoRoomSessionFactory,
  CampaignVideoRoomSnapshot,
} from "./contracts";

type CampaignVideoFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type CampaignVideoRoomControllerOptions = {
  campaignId: string;
  campaignActive: boolean;
  directoryReady: boolean;
  participantDirectory: CampaignVideoParticipantDirectoryEntry[];
  createSession: CampaignVideoRoomSessionFactory;
  fetcher?: CampaignVideoFetch;
  onChange(snapshot: CampaignVideoRoomSnapshot): void;
};

const NO_PUBLICATION = { audio: false, video: false } as const;

export function createInitialCampaignVideoRoomSnapshot(): CampaignVideoRoomSnapshot {
  return {
    phase: "idle",
    participants: [],
    publication: NO_PUBLICATION,
    cameraEnabled: false,
    microphoneEnabled: false,
    audioBlocked: false,
    restored: false,
    error: null,
  };
}

function safeJoinError(result: CampaignVideoJoinResult): CampaignVideoClientErrorCode {
  if (result.ok) return "unexpected_error";
  switch (result.error.code) {
    case "authentication_required":
      return "authentication_required";
    case "campaign_inactive":
      return "campaign_inactive";
    case "capacity_unavailable":
      return "capacity_unavailable";
    case "configuration_unavailable":
      return "configuration_unavailable";
    case "provider_unavailable":
      return "provider_unavailable";
    case "campaign_inaccessible":
    case "membership_required":
    case "invalid_player_state":
      return "campaign_unavailable";
    case "malformed_request":
    case "unexpected_error":
      return "unexpected_error";
  }
}

function isJoinResult(value: unknown): value is CampaignVideoJoinResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CampaignVideoJoinResult>;
  return candidate.ok === true || candidate.ok === false;
}

function participantOrder(entry: CampaignVideoParticipantDirectoryEntry): number {
  return entry.role === "game_master" ? 0 : entry.playerPosition ?? 99;
}

export function orderCampaignVideoParticipants(
  participants: CampaignVideoProviderParticipant[],
  directory: CampaignVideoParticipantDirectoryEntry[],
) {
  const directoryByIdentity = new Map(
    directory.map((entry) => [entry.providerIdentity, entry]),
  );
  const unique = new Map<string, CampaignVideoProviderParticipant>();
  for (const participant of participants) {
    if (directoryByIdentity.has(participant.identity)) {
      unique.set(participant.identity, participant);
    }
  }
  return Array.from(unique.values())
    .map((participant) => ({
      ...directoryByIdentity.get(participant.identity)!,
      isLocal: participant.isLocal,
      camera: participant.camera,
      microphone: participant.microphone,
    }))
    .sort((left, right) => participantOrder(left) - participantOrder(right));
}

export function createCampaignVideoRoomController(
  options: CampaignVideoRoomControllerOptions,
) {
  let snapshot = createInitialCampaignVideoRoomSnapshot();
  let session: CampaignVideoRoomSession | null = null;
  let credentialRequest: AbortController | null = null;
  let joinOperation: Promise<void> | null = null;
  let mediaOperation: Promise<void> | null = null;
  let generation = 0;
  let disposed = false;

  const publish = (change: Partial<CampaignVideoRoomSnapshot>) => {
    snapshot = { ...snapshot, ...change };
    options.onChange(snapshot);
  };
  const isCurrent = (value: number) => !disposed && value === generation;

  async function requestCredentials(signal: AbortSignal) {
    const response = await (options.fetcher ?? fetch)(
      `/api/campaigns/${encodeURIComponent(options.campaignId)}/video/join`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: "{}",
        signal,
      },
    );
    const body = (await response.json().catch(() => null)) as unknown;
    if (!isJoinResult(body)) throw new Error("unexpected_error");
    if (!response.ok || !body.ok) throw new Error(safeJoinError(body));
    const { connection, participant } = body;
    if (
      typeof connection.url !== "string" ||
      typeof connection.token !== "string" ||
      typeof connection.expiresAt !== "string" ||
      typeof participant.publication?.audio !== "boolean" ||
      typeof participant.publication?.video !== "boolean"
    ) {
      throw new Error("unexpected_error");
    }
    return {
      url: connection.url,
      token: connection.token,
      expiresAt: connection.expiresAt,
      publication: participant.publication,
    } satisfies CampaignVideoConnectionCredentials;
  }

  function clientError(error: unknown): CampaignVideoClientErrorCode {
    if (error instanceof Error) {
      const allowed: CampaignVideoClientErrorCode[] = [
        "authentication_required",
        "campaign_unavailable",
        "campaign_inactive",
        "capacity_unavailable",
        "configuration_unavailable",
        "provider_unavailable",
        "permission_denied",
        "device_unavailable",
        "media_unavailable",
        "connection_failed",
        "unexpected_error",
      ];
      if (allowed.includes(error.message as CampaignVideoClientErrorCode)) {
        return error.message as CampaignVideoClientErrorCode;
      }
    }
    return "connection_failed";
  }

  async function performJoin() {
    if (!options.campaignActive) {
      publish({ phase: "terminal_error", error: "campaign_inactive" });
      return;
    }
    if (!options.directoryReady) {
      publish({ phase: "terminal_error", error: "campaign_unavailable" });
      return;
    }
    generation += 1;
    const currentGeneration = generation;
    credentialRequest = new AbortController();
    publish({
      phase: "requesting_credentials",
      participants: [],
      publication: NO_PUBLICATION,
      cameraEnabled: false,
      microphoneEnabled: false,
      audioBlocked: false,
      restored: false,
      error: null,
    });
    try {
      const credentials = await requestCredentials(credentialRequest.signal);
      if (!isCurrent(currentGeneration)) return;
      publish({ phase: "connecting", publication: credentials.publication });
      const created = await options.createSession(
        credentials,
        {
          onParticipants(participants) {
            if (isCurrent(currentGeneration)) {
              publish({
                participants: orderCampaignVideoParticipants(
                  participants,
                  options.participantDirectory,
                ),
              });
            }
          },
          onReconnecting() {
            if (isCurrent(currentGeneration)) {
              publish({ phase: "reconnecting", restored: false, error: null });
            }
          },
          onReconnected() {
            if (isCurrent(currentGeneration)) {
              publish({ phase: "connected", restored: true, error: null });
            }
          },
          onTerminalDisconnect() {
            if (!isCurrent(currentGeneration)) return;
            session = null;
            publish({
              phase: "terminal_error",
              participants: [],
              cameraEnabled: false,
              microphoneEnabled: false,
              audioBlocked: false,
              restored: false,
              error: "connection_failed",
            });
          },
          onAudioBlocked(blocked) {
            if (isCurrent(currentGeneration)) publish({ audioBlocked: blocked });
          },
          onMediaError(error) {
            if (isCurrent(currentGeneration)) publish({ error });
          },
        },
        credentialRequest.signal,
      );
      if (!isCurrent(currentGeneration)) {
        await created.disconnect();
        return;
      }
      session = created;
      publish({ phase: "connected", restored: false, error: null });
    } catch (error) {
      if (!isCurrent(currentGeneration)) return;
      publish({
        phase: "terminal_error",
        participants: [],
        cameraEnabled: false,
        microphoneEnabled: false,
        audioBlocked: false,
        restored: false,
        error: clientError(error),
      });
    } finally {
      if (isCurrent(currentGeneration)) credentialRequest = null;
    }
  }

  function join() {
    if (disposed || session) return Promise.resolve();
    if (joinOperation) return joinOperation;
    const operation = performJoin();
    const wrapped = operation.finally(() => {
      if (joinOperation === wrapped) joinOperation = null;
    });
    joinOperation = wrapped;
    return wrapped;
  }

  async function leave() {
    generation += 1;
    credentialRequest?.abort();
    credentialRequest = null;
    const currentSession = session;
    session = null;
    if (currentSession) await currentSession.disconnect();
    if (!disposed) {
      publish({
        phase: "disconnected",
        participants: [],
        publication: NO_PUBLICATION,
        cameraEnabled: false,
        microphoneEnabled: false,
        audioBlocked: false,
        restored: false,
        error: null,
      });
    }
  }

  function runMediaOperation(kind: "camera" | "microphone", enabled: boolean) {
    if (mediaOperation || !session || snapshot.phase !== "connected") {
      return mediaOperation ?? Promise.resolve();
    }
    if (!snapshot.publication[kind === "camera" ? "video" : "audio"]) {
      return Promise.resolve();
    }
    const currentSession = session;
    const operation = (
      kind === "camera"
        ? currentSession.setCameraEnabled(enabled)
        : currentSession.setMicrophoneEnabled(enabled)
    )
      .then(() =>
        publish(
          kind === "camera"
            ? { cameraEnabled: enabled, error: null }
            : { microphoneEnabled: enabled, error: null },
        ),
      )
      .catch((error) => publish({ error: clientError(error) }));
    const wrapped = operation.finally(() => {
      if (mediaOperation === wrapped) mediaOperation = null;
    });
    mediaOperation = wrapped;
    return wrapped;
  }

  async function enableSound() {
    if (!session || !snapshot.audioBlocked) return;
    try {
      await session.startAudio();
      publish({ audioBlocked: false, error: null });
    } catch {
      publish({ error: "media_unavailable" });
    }
  }

  async function dispose() {
    if (disposed) return;
    disposed = true;
    generation += 1;
    credentialRequest?.abort();
    const currentSession = session;
    session = null;
    if (currentSession) await currentSession.disconnect();
  }

  return {
    getSnapshot: () => snapshot,
    join,
    leave,
    setCameraEnabled: (enabled: boolean) => runMediaOperation("camera", enabled),
    setMicrophoneEnabled: (enabled: boolean) =>
      runMediaOperation("microphone", enabled),
    enableSound,
    dispose,
  };
}
