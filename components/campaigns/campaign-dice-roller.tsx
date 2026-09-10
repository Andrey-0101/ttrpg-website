"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

import CallOfCthulhu7eDiceRoller from "@/components/games/call-of-cthulhu-7e/dice-roller";
import PersonalDiceRoller from "@/components/games/vtm-v5/personal-dice-roller";
import type {
  CampaignDiceApiResult,
  CampaignDiceRequest,
} from "@/lib/campaign-dice/contracts";
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

type CampaignDiceSystem = "vtm-v5" | "call-of-cthulhu-7e";

export default function CampaignDiceRoller({
  campaignId,
  gameSystem,
  sessionActive,
  onJournalEvent,
}: {
  campaignId: string;
  gameSystem: string;
  sessionActive: boolean;
  onJournalEvent(event: GameSessionJournalEvent): void;
}) {
  const translations = useTranslations("CampaignGameRoom");

  const execute = useCallback(
    async (body: CampaignDiceRequest): Promise<CampaignDiceApiResult> => {
      const response = await fetch(
        `/api/campaigns/${encodeURIComponent(campaignId)}/dice`,
        {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json()) as CampaignDiceApiResult;
      if (!response.ok || !result.ok) throw new Error("Campaign roll failed.");
      if (result.journalEvent) onJournalEvent(result.journalEvent);
      return result;
    },
    [campaignId, onJournalEvent],
  );

  const executeVtm = useCallback(
    async (request: VtmV5DiceRequest): Promise<VtmV5DiceResult> => {
      const result = await execute({ rollType: "vtm_v5", request });
      if (!result.ok || result.rollType !== "vtm_v5") {
        throw new Error("Unexpected campaign roll response.");
      }
      return result.result;
    },
    [execute],
  );

  const executePercentile = useCallback(
    async (
      request: Coc7ePercentileTestRequest,
      label: string | null,
    ): Promise<Coc7ePercentileTestResult> => {
      const result = await execute({
        rollType: "coc_7e_percentile",
        request,
        label,
      });
      if (!result.ok || result.rollType !== "coc_7e_percentile") {
        throw new Error("Unexpected campaign roll response.");
      }
      return result.result;
    },
    [execute],
  );

  const executeOther = useCallback(
    async (
      request: Coc7eOtherDiceRequest,
      label: string | null,
    ): Promise<Coc7eOtherDiceResult> => {
      const result = await execute({
        rollType: "coc_7e_other_dice",
        request,
        label,
      });
      if (!result.ok || result.rollType !== "coc_7e_other_dice") {
        throw new Error("Unexpected campaign roll response.");
      }
      return result.result;
    },
    [execute],
  );

  const supportedSystem: CampaignDiceSystem | null =
    gameSystem === "vtm-v5" || gameSystem === "call-of-cthulhu-7e"
      ? gameSystem
      : null;

  return (
    <div className="min-h-0 w-full overflow-y-auto p-3 text-white" data-campaign-dice>
      <p className="mb-3 text-sm text-white/70">
        {translations(sessionActive ? "dice.sessionPublic" : "dice.localOnly")}
      </p>
      {supportedSystem === "vtm-v5" ? (
        <PersonalDiceRoller
          authenticated
          initialHistoryEntries={null}
          executeRoll={executeVtm}
          compact
          executionErrorMessage={translations("dice.error")}
        />
      ) : supportedSystem === "call-of-cthulhu-7e" ? (
        <CallOfCthulhu7eDiceRoller
          authenticated
          initialHistoryEntries={null}
          executePercentileRoll={executePercentile}
          executeOtherDiceRoll={executeOther}
          compact
          executionErrorMessage={translations("dice.error")}
        />
      ) : (
        <p className="flex min-h-32 items-center justify-center text-center text-sm text-white/70">
          {translations("dice.unavailable")}
        </p>
      )}
    </div>
  );
}
