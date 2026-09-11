"use client";

import { useTranslations } from "next-intl";

import type { GameSessionJournalEvent } from "@/lib/game-sessions/contracts";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function numbers(value: unknown): number[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "number")
    ? value
    : null;
}

export default function CampaignDiceJournalEvent({
  event,
}: {
  event: GameSessionJournalEvent;
}) {
  const translations = useTranslations("CampaignGameRoom.journal");
  const vtmTranslations = useTranslations("VtmDiceRoller");
  const cocTranslations = useTranslations("Coc7eDiceRoller");
  const data = record(event.eventData);
  const request = record(data?.request);
  const result = record(data?.result);
  const actorName =
    typeof data?.actorDisplayName === "string" && data.actorDisplayName.trim()
      ? data.actorDisplayName
      : translations("participantFallback");
  const label =
    typeof request?.label === "string" && request.label.trim()
      ? request.label
      : null;

  if (!data || !request || !result || event.eventKind !== "campaign_dice_roll") {
    return null;
  }

  if (data.rollType === "vtm_v5") {
    const normalDice = numbers(result.normalDice);
    const hungerDice = numbers(result.hungerDiceResults);
    const difficulty =
      typeof request.difficulty === "number" ? request.difficulty : null;
    const summaryKey =
      typeof result.summaryKey === "string" ? result.summaryKey : null;
    if (!normalDice || !hungerDice) return null;

    return (
      <li className="rounded-lg border border-white/15 bg-white/5 p-3 text-sm" data-journal-vtm-roll>
        <p className="font-bold">{actorName}</p>
        <p>{label ?? translations("unlabelled")}</p>
        <p>{translations("difficulty", { value: difficulty ?? "-" })}</p>
        <p className="mt-1 flex flex-wrap gap-x-2 tabular-nums">
          <span>{normalDice.join("  ") || "-"}</span>
          <span aria-hidden="true">|</span>
          <span className="text-red-300" data-journal-hunger-dice>
            {hungerDice.join("  ") || "-"}
          </span>
        </p>
        {summaryKey ? (
          <p className="mt-1 font-semibold">
            {vtmTranslations(`outcomes.${summaryKey}.title`)}
          </p>
        ) : null}
      </li>
    );
  }

  if (data.rollType === "coc_7e_percentile") {
    const target = typeof request.target === "number" ? request.target : null;
    const rolled =
      typeof result.percentileResult === "number"
        ? result.percentileResult
        : null;
    const outcome = typeof result.outcome === "string" ? result.outcome : null;
    if (rolled === null) return null;

    return (
      <li className="rounded-lg border border-white/15 bg-white/5 p-3 text-sm" data-journal-coc-percentile-roll>
        <p className="font-bold">{actorName}</p>
        <p>{label ?? translations("unlabelledPercentile")}</p>
        <p>{translations("target", { value: target ?? "-" })}</p>
        <p className="mt-1 font-semibold tabular-nums">
          {rolled}
          {outcome ? ` — ${cocTranslations(`outcomes.${outcome}`)}` : ""}
        </p>
      </li>
    );
  }

  if (data.rollType === "coc_7e_other_dice") {
    const dice = numbers(result.results);
    const formula = typeof result.formula === "string" ? result.formula : null;
    const modifier = typeof request.modifier === "number" ? request.modifier : null;
    const total = typeof result.total === "number" ? result.total : null;
    if (!dice || !formula || modifier === null || total === null) return null;
    const modifierText = modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : `${modifier}`;

    return (
      <li className="rounded-lg border border-white/15 bg-white/5 p-3 text-sm" data-journal-coc-other-roll>
        <p className="font-bold">{actorName}</p>
        <p>{label ? `${label} ${formula}` : `${translations("unlabelled")} ${formula}`}</p>
        <p className="mt-1 font-semibold tabular-nums">
          {dice.join(", ")}{modifierText}={total}
        </p>
      </li>
    );
  }

  return null;
}
