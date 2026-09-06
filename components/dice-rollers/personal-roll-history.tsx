"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  clearPersonalRollHistoryAction,
  deletePersonalRollAction,
} from "@/app/[locale]/dice-rollers/actions";
import type { PersonalRollHistoryEntry } from "@/lib/dice/personal-dice-persistence-service";

function RollSummary({ entry }: { entry: PersonalRollHistoryEntry }) {
  const translations = useTranslations("PersonalRollHistory");
  const cocTranslations = useTranslations("Coc7eDiceRoller");

  switch (entry.rollerKind) {
    case "vtm_v5":
      return (
        <p className="mt-2 text-sm text-white/80">
          {translations("vtm.successes", {
            count: entry.resultData.totalSuccesses,
          })}
        </p>
      );
    case "custom_dice_pool": {
      const groups = entry.resultData.groups.map(
        (group) => `D${group.sides}: ${group.results.join(", ")}`,
      );
      const coins = entry.resultData.coinResults.map((outcome) =>
        translations(`custom.${outcome}`),
      );

      return (
        <div className="mt-2 space-y-1 text-sm text-white/80">
          <p>
            {translations("custom.total", {
              total: entry.resultData.numericDiceTotal,
            })}
          </p>
          {[...coins, ...groups].length > 0 ? (
            <p className="break-words">{[...coins, ...groups].join(" · ")}</p>
          ) : null}
        </div>
      );
    }
    case "coc_7e_percentile": {
      const { bonusPenalty, target } = entry.resultData.request;
      return (
        <div className="mt-2 space-y-1 text-sm text-white/80">
          <p className="text-lg font-bold tabular-nums text-white">
            {entry.resultData.percentileResult}
          </p>
          <p>
            {translations("coc.percentile.inputs", {
              target: target ?? translations("coc.percentile.noTarget"),
              bonusPenalty:
                bonusPenalty === 0
                  ? "−"
                  : bonusPenalty > 0
                    ? `+${bonusPenalty}`
                    : bonusPenalty,
            })}
          </p>
          {entry.resultData.outcome ? (
            <p>{cocTranslations(`outcomes.${entry.resultData.outcome}`)}</p>
          ) : null}
        </div>
      );
    }
    case "coc_7e_other_dice":
      return (
        <div className="mt-2 space-y-1 text-sm text-white/80">
          <p>
            {entry.resultData.formula} · {translations("coc.other.total", {
              total: entry.resultData.total,
            })}
          </p>
          <p className="break-words tabular-nums">
            {entry.resultData.results.join(", ")}
          </p>
        </div>
      );
  }
}

export default function PersonalRollHistory({
  initialEntries,
}: {
  initialEntries: PersonalRollHistoryEntry[];
}) {
  const translations = useTranslations("PersonalRollHistory");
  const locale = useLocale();
  const [entries, setEntries] = useState(initialEntries);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function deleteRoll(entry: PersonalRollHistoryEntry) {
    setError(null);
    startTransition(async () => {
      const result = await deletePersonalRollAction({ rollId: entry.id });
      if (!result.ok) {
        setError(translations("error"));
        return;
      }
      setEntries((current) =>
        current.filter((candidate) => candidate.id !== entry.id),
      );
    });
  }

  function clearHistory() {
    if (!window.confirm(translations("confirmClear"))) return;

    setError(null);
    startTransition(async () => {
      const result = await clearPersonalRollHistoryAction();
      if (!result.ok) {
        setError(translations("error"));
        return;
      }
      setEntries([]);
    });
  }

  return (
    <section className="mt-10" aria-labelledby="personal-history-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="personal-history-title" className="text-2xl font-bold">
            {translations("title")}
          </h2>
          <p className="mt-2 max-w-3xl text-white/75">
            {translations("description")}
          </p>
        </div>
        {entries.length > 0 ? (
          <button
            type="button"
            disabled={isPending}
            onClick={clearHistory}
            className="min-h-11 rounded-lg border border-red-300/50 px-4 py-2 text-sm font-semibold text-red-100 outline-none hover:bg-red-950/40 focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-wait disabled:opacity-60"
          >
            {translations("clear")}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="mt-5 rounded-xl border border-white/20 bg-black/20 p-5 text-white/70">
          {translations("empty")}
        </p>
      ) : (
        <ol className="mt-5 grid gap-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-white/20 bg-black/20 p-4"
            >
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold">
                    {translations(`kinds.${entry.rollerKind}`)}
                  </p>
                  <time
                    dateTime={entry.createdAt}
                    className="mt-1 block text-xs text-white/55"
                  >
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(entry.createdAt))}
                  </time>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => deleteRoll(entry)}
                  className="min-h-11 shrink-0 rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-wait disabled:opacity-60"
                >
                  {translations("delete")}
                </button>
              </div>
              <RollSummary entry={entry} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
