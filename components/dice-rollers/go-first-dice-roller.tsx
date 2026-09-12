"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import {
  GO_FIRST_DIE_IDS,
  GO_FIRST_PLAYER_LIMITS,
  rollGoFirstDice,
  type GoFirstRollResult,
} from "@/lib/dice/go-first-dice";

const PLAYER_NAME_MAX_LENGTH = 80;

export default function GoFirstDiceRoller() {
  const translations = useTranslations("GoFirstDice");
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(() =>
    Array.from({ length: GO_FIRST_PLAYER_LIMITS.maximum }, () => ""),
  );
  const [result, setResult] = useState<GoFirstRollResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fallbackNames = Array.from(
    { length: GO_FIRST_PLAYER_LIMITS.maximum },
    (_, index) => translations("fallbackPlayer", { number: index + 1 }),
  );

  function handlePlayerCountChange(value: string) {
    const nextCount = Number(value);
    if (
      Number.isInteger(nextCount) &&
      nextCount >= GO_FIRST_PLAYER_LIMITS.minimum &&
      nextCount <= GO_FIRST_PLAYER_LIMITS.maximum
    ) {
      setPlayerCount(nextCount);
      setResult(null);
      setError(null);
    }
  }

  function handleNameChange(index: number, value: string) {
    setPlayerNames((currentNames) =>
      currentNames.map((name, nameIndex) =>
        nameIndex === index ? value : name,
      ),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const evaluation = rollGoFirstDice(
        { playerCount, playerNames },
        fallbackNames,
      );

      if (!evaluation.ok) {
        setError(translations("errors.invalidConfiguration"));
        return;
      }

      setResult(evaluation.result);
    } catch {
      setError(translations("errors.randomUnavailable"));
    }
  }

  return (
    <div
      className={`mt-10 grid gap-6 ${
        result
          ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          : "max-w-2xl"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        className="min-w-0 rounded-xl border border-white/25 bg-black/20 p-5 sm:p-6"
      >
        <h2 className="text-2xl font-bold">{translations("setupTitle")}</h2>

        <label className="mt-5 block font-semibold" htmlFor="player-count">
          {translations("players")}
        </label>
        <select
          id="player-count"
          value={playerCount}
          onChange={(event) => handlePlayerCountChange(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-lg border border-white/30 bg-neutral-950 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-red-300 sm:w-40"
        >
          {Array.from(
            {
              length:
                GO_FIRST_PLAYER_LIMITS.maximum -
                GO_FIRST_PLAYER_LIMITS.minimum +
                1,
            },
            (_, index) => GO_FIRST_PLAYER_LIMITS.minimum + index,
          ).map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>

        <fieldset className="mt-6">
          <legend className="font-semibold">{translations("namesTitle")}</legend>
          <p className="mt-1 text-sm text-white/70">
            {translations("namesHelp")}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {playerNames.slice(0, playerCount).map((name, index) => (
              <label
                key={GO_FIRST_DIE_IDS[index]}
                className="block min-w-0"
              >
                <span className="font-medium">
                  {translations("playerLabel", {
                    number: index + 1,
                    die: GO_FIRST_DIE_IDS[index],
                  })}
                </span>
                <input
                  type="text"
                  value={name}
                  maxLength={PLAYER_NAME_MAX_LENGTH}
                  placeholder={fallbackNames[index]}
                  onChange={(event) =>
                    handleNameChange(index, event.target.value)
                  }
                  className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/30 bg-neutral-950 px-3 text-white outline-none placeholder:text-white/45 focus-visible:ring-2 focus-visible:ring-red-300"
                />
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="mt-5 text-sm font-semibold text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 min-h-11 w-full rounded-lg bg-white px-6 py-3 font-bold text-neutral-950 outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
        >
          {translations("roll")}
        </button>
      </form>

      {result && (
        <section
          aria-labelledby="go-first-result-title"
          aria-live="polite"
          className="min-w-0 rounded-xl border border-white/25 bg-black/20 p-5 sm:p-6"
        >
          <h2 id="go-first-result-title" className="text-2xl font-bold">
            {translations("turnOrder")}
          </h2>

          <ol className="mt-5 space-y-3">
            {result.turnOrder.map((entry, index) => (
              <li
                key={entry.playerIndex}
                className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-white/15 bg-white/5 p-3"
              >
                <span className="text-lg font-bold text-red-200">
                  {index + 1}.
                </span>
                <span className="min-w-0 break-words font-semibold">
                  {entry.name}
                  <span className="ml-2 text-sm font-normal text-white/55">
                    {translations("die", { die: entry.dieId })}
                  </span>
                </span>
                <span className="text-xl font-bold tabular-nums">
                  {entry.value}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
