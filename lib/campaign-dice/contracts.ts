import type { Json } from "@/types/database.types";
import type { GameSessionJournalEvent } from "@/lib/game-sessions/contracts";
import type {
  Coc7eOtherDiceRequest,
  Coc7eOtherDiceResult,
  Coc7ePercentileTestRequest,
  Coc7ePercentileTestResult,
} from "@/lib/game-systems/call-of-cthulhu-7e/dice-engine";
import type {
  VtmV5DiceRequest,
  VtmV5DiceResult,
} from "@/lib/game-systems/vtm-v5/dice-engine";

export const CAMPAIGN_DICE_ROLL_TYPES = [
  "vtm_v5",
  "coc_7e_percentile",
  "coc_7e_other_dice",
] as const;

export type CampaignDiceRollType =
  (typeof CAMPAIGN_DICE_ROLL_TYPES)[number];

export type CampaignDiceRequest =
  | { rollType: "vtm_v5"; request: VtmV5DiceRequest }
  | {
      rollType: "coc_7e_percentile";
      request: Coc7ePercentileTestRequest;
      label: string | null;
    }
  | {
      rollType: "coc_7e_other_dice";
      request: Coc7eOtherDiceRequest;
      label: string | null;
    };

export type CampaignDiceSuccess =
  | {
      ok: true;
      rollType: "vtm_v5";
      result: VtmV5DiceResult;
      journalEvent: GameSessionJournalEvent | null;
    }
  | {
      ok: true;
      rollType: "coc_7e_percentile";
      result: Coc7ePercentileTestResult;
      journalEvent: GameSessionJournalEvent | null;
    }
  | {
      ok: true;
      rollType: "coc_7e_other_dice";
      result: Coc7eOtherDiceResult;
      journalEvent: GameSessionJournalEvent | null;
    };

export type CampaignDiceApiResult =
  | CampaignDiceSuccess
  | {
      ok: false;
      error: {
        code:
          | "malformed_request"
          | "authentication_required"
          | "campaign_inaccessible"
          | "campaign_inactive"
          | "dice_system_unavailable"
          | "dice_system_mismatch"
          | "roll_invalid"
          | "persistence_unavailable"
          | "unexpected_error";
      };
    };

export type CampaignDiceJournalData = {
  campaignId: string;
  gameSystem: "vtm-v5" | "call-of-cthulhu-7e";
  rollType: CampaignDiceRollType;
  characterId: string | null;
  actorDisplayName: string | null;
  request: Record<string, unknown>;
  result: Record<string, unknown>;
};

export function toJson(value: unknown): Json {
  return value as Json;
}

export function mapJournalRow(row: {
  id: string;
  event_kind: string;
  schema_version: number;
  event_data: Json;
  created_at: string;
}): GameSessionJournalEvent {
  return {
    id: row.id,
    eventKind: row.event_kind,
    schemaVersion: row.schema_version,
    eventData: row.event_data as Record<string, unknown>,
    createdAt: row.created_at,
  };
}
