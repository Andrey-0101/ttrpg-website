export const GAME_SESSION_PRESENCE_RENEWAL_MS = 30 * 60 * 1000;
export const GAME_SESSION_STATE_REFRESH_MS = 30 * 1000;

export type GameSessionJournalEvent = {
  id: string;
  eventKind: string;
  schemaVersion: number;
  eventData: Record<string, unknown>;
  createdAt: string;
};

export type ActiveGameSession = {
  id: string;
  campaignId: string;
  startedAt: string;
  presenceExpiresAt: string;
};

export type GameSessionState = {
  session: ActiveGameSession | null;
  journal: GameSessionJournalEvent[];
};

export type GameSessionAction = "start" | "end" | "renew";

export type GameSessionApiResult =
  | ({ ok: true } & GameSessionState)
  | {
      ok: false;
      error: {
        code:
          | "malformed_request"
          | "authentication_required"
          | "campaign_inaccessible"
          | "game_session_not_available"
          | "game_session_not_active"
          | "game_session_conflict"
          | "unexpected_error";
      };
    };

export function parseGameSessionAction(value: unknown): GameSessionAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (entries.length !== 1 || entries[0]?.[0] !== "action") return null;
  const action = entries[0][1];
  return action === "start" || action === "end" || action === "renew"
    ? action
    : null;
}
