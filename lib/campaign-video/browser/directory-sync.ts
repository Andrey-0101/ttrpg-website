import type { CampaignVideoParticipantDirectoryEntry } from "./contracts";

type DirectorySyncOptions = {
  campaignId: string;
  locale: string;
  fetcher?: typeof fetch;
  onDirectory(directory: CampaignVideoParticipantDirectoryEntry[]): void;
  onError?(): void;
};

function isDirectory(
  value: unknown,
): value is CampaignVideoParticipantDirectoryEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry &&
        typeof entry.providerIdentity === "string" &&
        typeof entry.displayName === "string" &&
        typeof entry.isCurrentUser === "boolean" &&
        (entry.role === "game_master"
          ? entry.playerPosition === null
          : entry.role === "player" &&
            Number.isInteger(entry.playerPosition) &&
            entry.playerPosition >= 1 &&
            entry.playerPosition <= 6),
    )
  );
}

// Coalesce invalidations, but fetch again if membership changed during a read.
// Bounded retries are recovery from a failed signal, not continuous polling.
export function createCampaignParticipantDirectorySync(
  options: DirectorySyncOptions,
) {
  let disposed = false;
  let pending = false;
  let inFlight: Promise<void> | null = null;
  let request: AbortController | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let failures = 0;

  async function drain() {
    do {
      pending = false;
      request = new AbortController();
      try {
        const response = await (options.fetcher ?? fetch)(
          `/api/campaigns/${encodeURIComponent(options.campaignId)}/participant-directory?locale=${encodeURIComponent(options.locale)}`,
          {
            cache: "no-store",
            credentials: "same-origin",
            signal: request.signal,
          },
        );
        const result = await response.json();
        if (
          !response.ok ||
          result?.ok !== true ||
          !isDirectory(result.participantDirectory)
        ) {
          throw new Error("directory_unavailable");
        }
        if (!disposed) {
          failures = 0;
          options.onDirectory(result.participantDirectory);
        }
      } catch {
        if (!disposed) {
          if (options.onError) options.onError();
          else
            console.error(
              "Failed to refresh campaign video participant directory.",
            );
          failures += 1;
          if (!pending && failures <= 3) {
            retryTimer = setTimeout(() => {
              retryTimer = null;
              void refresh();
            }, failures * 1000);
          }
        }
      } finally {
        request = null;
      }
    } while (pending && !disposed);
  }

  function refresh(): Promise<void> {
    if (disposed) return Promise.resolve();
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (inFlight) {
      pending = true;
      return inFlight;
    }
    inFlight = drain().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  return {
    refresh,
    dispose() {
      disposed = true;
      request?.abort();
      if (retryTimer !== null) clearTimeout(retryTimer);
    },
  };
}
