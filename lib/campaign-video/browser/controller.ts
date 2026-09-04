import {
  parseCampaignId,
  type CampaignVideoJoinResult,
} from "../contracts";
import {
  CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
  isCampaignVideoPresentationResult,
  parseCampaignVideoPresentationPacket,
  type CampaignVideoPresentationCommand,
} from "../presentation";
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
  isGameMaster?: boolean;
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
    isPresenting: false,
    presentationExpanded: false,
    sharedPresentation: null,
    presentationBusy: false,
    presentationError: null,
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
  let presentationQueue = Promise.resolve();
  let activePresentationImageId: string | null = null;
  let activePresentationRevision = 0;
  let lastReceivedPresentationRevision = 0;
  const presentationRequests = new Set<AbortController>();
  let generation = 0;
  let disposed = false;
  const gameMasterIdentity = options.participantDirectory.find(
    (participant) => participant.role === "game_master",
  )?.providerIdentity;
  const playerIdentities = new Set(
    options.participantDirectory
      .filter((participant) => participant.role === "player")
      .map((participant) => participant.providerIdentity),
  );

  const publish = (change: Partial<CampaignVideoRoomSnapshot>) => {
    snapshot = { ...snapshot, ...change };
    options.onChange(snapshot);
  };
  const isCurrent = (value: number) => !disposed && value === generation;

  const clearPresentation = () => {
    activePresentationImageId = null;
    publish({
      isPresenting: false,
      presentationExpanded: false,
      sharedPresentation: null,
      presentationBusy: false,
    });
  };

  function enqueuePresentation<T>(operation: () => Promise<T>): Promise<T> {
    const queued = presentationQueue.then(operation, operation);
    presentationQueue = queued.then(
      () => undefined,
      () => undefined,
    );
    return queued;
  }

  async function requestPresentation(
    command: CampaignVideoPresentationCommand,
  ) {
    const request = new AbortController();
    presentationRequests.add(request);
    try {
      const response = await (options.fetcher ?? fetch)(
        `/api/campaigns/${encodeURIComponent(options.campaignId)}/video/presentation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(command),
          signal: request.signal,
        },
      );
      const body = (await response.json().catch(() => null)) as unknown;
      if (!response.ok || !isCampaignVideoPresentationResult(body) || !body.ok) {
        throw new Error("presentation_unavailable");
      }
      if (
        body.action !== command.action ||
        body.revision !== command.revision
      ) {
        throw new Error("presentation_unavailable");
      }
      if (
        command.action === "show" &&
        (body.action !== "show" ||
          body.expanded !== command.expanded)
      ) {
        throw new Error("presentation_unavailable");
      }
      return body;
    } finally {
      presentationRequests.delete(request);
    }
  }

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
      isPresenting: false,
      presentationExpanded: false,
      sharedPresentation: null,
      presentationBusy: false,
      presentationError: null,
    });
    activePresentationImageId = null;
    activePresentationRevision = 0;
    lastReceivedPresentationRevision = 0;
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
          onParticipantConnected(identity) {
            if (
              !isCurrent(currentGeneration) ||
              !options.isGameMaster ||
              !playerIdentities.has(identity) ||
              !activePresentationImageId
            ) {
              return;
            }
            const imageId = activePresentationImageId;
            void enqueuePresentation(async () => {
              if (
                !isCurrent(currentGeneration) ||
                !session ||
                snapshot.phase !== "connected" ||
                activePresentationImageId !== imageId
              ) {
                return;
              }
              try {
                await requestPresentation({
                  action: "show",
                  imageId,
                  expanded: snapshot.presentationExpanded,
                  revision: activePresentationRevision,
                  destinationIdentity: identity,
                });
                if (isCurrent(currentGeneration)) {
                  publish({ presentationError: null });
                }
              } catch {
                if (isCurrent(currentGeneration)) {
                  publish({ presentationError: "presentation_unavailable" });
                }
              }
            });
          },
          onParticipantDisconnected(identity) {
            if (
              isCurrent(currentGeneration) &&
              !options.isGameMaster &&
              identity === gameMasterIdentity
            ) {
              lastReceivedPresentationRevision = 0;
              clearPresentation();
              publish({ presentationError: null });
            }
          },
          onPresentationPacket(payload, senderIdentity, topic) {
            if (!isCurrent(currentGeneration) || options.isGameMaster) return;
            if (
              senderIdentity !== null ||
              topic !== CAMPAIGN_VIDEO_PRESENTATION_TOPIC
            ) {
              return;
            }
            const message = parseCampaignVideoPresentationPacket(payload);
            if (!message) {
              clearPresentation();
              publish({ presentationError: "presentation_unavailable" });
              return;
            }
            if (message.revision <= lastReceivedPresentationRevision) return;
            lastReceivedPresentationRevision = message.revision;
            if (message.action === "clear") {
              clearPresentation();
              publish({ presentationError: null });
              return;
            }
            publish({
              isPresenting: true,
              presentationExpanded: message.expanded,
              sharedPresentation: {
                signedUrl: message.signedUrl,
              },
              presentationError: null,
            });
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
              isPresenting: false,
              presentationExpanded: false,
              sharedPresentation: null,
              presentationBusy: false,
              presentationError: null,
            });
            activePresentationImageId = null;
            activePresentationRevision = 0;
            lastReceivedPresentationRevision = 0;
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
        isPresenting: false,
        presentationExpanded: false,
        sharedPresentation: null,
        presentationBusy: false,
        presentationError: null,
      });
      activePresentationImageId = null;
      activePresentationRevision = 0;
      lastReceivedPresentationRevision = 0;
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
    for (const request of presentationRequests) request.abort();
    activePresentationImageId = null;
    activePresentationRevision = 0;
    lastReceivedPresentationRevision = 0;
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
        isPresenting: false,
        presentationExpanded: false,
        sharedPresentation: null,
        presentationBusy: false,
        presentationError: null,
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
    const currentGeneration = generation;
    const operation = (
      kind === "camera"
        ? currentSession.setCameraEnabled(enabled)
        : currentSession.setMicrophoneEnabled(enabled)
    )
      .then(() => {
        if (!isCurrent(currentGeneration) || session !== currentSession) return;
        publish(
          kind === "camera"
            ? { cameraEnabled: enabled, error: null }
            : { microphoneEnabled: enabled, error: null },
        );
      })
      .catch((error) => {
        if (isCurrent(currentGeneration) && session === currentSession) {
          publish({ error: clientError(error) });
        }
      });
    const wrapped = operation.finally(() => {
      if (mediaOperation === wrapped) mediaOperation = null;
    });
    mediaOperation = wrapped;
    return wrapped;
  }

  async function shareImage(imageId: string): Promise<boolean> {
    if (
      !options.isGameMaster ||
      !session ||
      snapshot.phase !== "connected" ||
      snapshot.isPresenting ||
      snapshot.presentationBusy ||
      !parseCampaignId(imageId)
    ) {
      return false;
    }
    const currentGeneration = generation;
    const revision = activePresentationRevision + 1;
    activePresentationRevision = revision;
    activePresentationImageId = imageId;
    publish({ presentationBusy: true, presentationError: null });
    try {
      await enqueuePresentation(async () => {
        if (
          !isCurrent(currentGeneration) ||
          !session ||
          snapshot.phase !== "connected"
        ) {
          throw new Error("presentation_unavailable");
        }
        try {
          await requestPresentation({
            action: "show",
            imageId,
            expanded: false,
            revision,
          });
        } catch (error) {
          if (isCurrent(currentGeneration) && session) {
            const recoveryRevision = activePresentationRevision + 1;
            activePresentationRevision = recoveryRevision;
            await requestPresentation({
              action: "clear",
              revision: recoveryRevision,
            }).catch(() => undefined);
          }
          throw error;
        }
      });
      if (!isCurrent(currentGeneration) || !session) return false;
      publish({
        isPresenting: true,
        presentationExpanded: false,
        sharedPresentation: null,
        presentationBusy: false,
        presentationError: null,
      });
      return true;
    } catch {
      if (isCurrent(currentGeneration)) {
        activePresentationImageId = null;
        publish({
          isPresenting: false,
          presentationExpanded: false,
          sharedPresentation: null,
          presentationBusy: false,
          presentationError: "presentation_unavailable",
        });
      }
      return false;
    }
  }

  async function setPresentationExpanded(expanded: boolean): Promise<boolean> {
    if (
      !options.isGameMaster ||
      !session ||
      snapshot.phase !== "connected" ||
      !snapshot.isPresenting ||
      !activePresentationImageId ||
      snapshot.presentationBusy
    ) {
      return false;
    }
    if (snapshot.presentationExpanded === expanded) return true;

    const currentGeneration = generation;
    const imageId = activePresentationImageId;
    const revision = activePresentationRevision + 1;
    activePresentationRevision = revision;
    publish({ presentationBusy: true, presentationError: null });
    try {
      await enqueuePresentation(async () => {
        if (
          !isCurrent(currentGeneration) ||
          !session ||
          snapshot.phase !== "connected" ||
          activePresentationImageId !== imageId
        ) {
          throw new Error("presentation_unavailable");
        }
        await requestPresentation({
          action: "show",
          imageId,
          expanded,
          revision,
        });
      });
      if (!isCurrent(currentGeneration) || !session) return false;
      publish({
        presentationExpanded: expanded,
        presentationBusy: false,
        presentationError: null,
      });
      return true;
    } catch {
      if (isCurrent(currentGeneration)) {
        publish({
          presentationBusy: false,
          presentationError: "presentation_unavailable",
        });
      }
      return false;
    }
  }

  async function stopPresentation(): Promise<boolean> {
    if (!options.isGameMaster) return false;
    if (!snapshot.isPresenting) return true;
    if (
      !session ||
      snapshot.phase !== "connected" ||
      snapshot.presentationBusy
    ) {
      return false;
    }
    const currentGeneration = generation;
    const revision = activePresentationRevision + 1;
    activePresentationRevision = revision;
    publish({ presentationBusy: true, presentationError: null });
    try {
      await enqueuePresentation(async () => {
        if (
          !isCurrent(currentGeneration) ||
          !session ||
          snapshot.phase !== "connected"
        ) {
          throw new Error("presentation_unavailable");
        }
        await requestPresentation({ action: "clear", revision });
      });
      if (!isCurrent(currentGeneration) || !session) return false;
      clearPresentation();
      publish({ presentationError: null });
      return true;
    } catch {
      if (isCurrent(currentGeneration)) {
        publish({
          presentationBusy: false,
          presentationError: "presentation_unavailable",
        });
      }
      return false;
    }
  }

  async function enableSound() {
    if (!session || !snapshot.audioBlocked) return;
    const currentSession = session;
    const currentGeneration = generation;
    try {
      await currentSession.startAudio();
      if (isCurrent(currentGeneration) && session === currentSession) {
        publish({ audioBlocked: false, error: null });
      }
    } catch {
      if (isCurrent(currentGeneration) && session === currentSession) {
        publish({ error: "media_unavailable" });
      }
    }
  }

  async function dispose() {
    if (disposed) return;
    disposed = true;
    generation += 1;
    credentialRequest?.abort();
    for (const request of presentationRequests) request.abort();
    activePresentationImageId = null;
    activePresentationRevision = 0;
    lastReceivedPresentationRevision = 0;
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
    shareImage,
    setPresentationExpanded,
    stopPresentation,
    enableSound,
    dispose,
  };
}
