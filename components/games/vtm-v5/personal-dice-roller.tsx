"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import {
  VTM_V5_DICE_LIMITS,
  type VtmV5DiceResult,
} from "@/lib/game-systems/vtm-v5/dice-engine";
import { rollVtmV5Dice } from "@/lib/game-systems/vtm-v5/dice-roller";
import {
  getVtmV5DiePresentation,
  type VtmV5DiceDisplayMode,
  type VtmV5DieKind,
} from "@/lib/game-systems/vtm-v5/dice-symbols";

type FieldName = "pool" | "hungerDice" | "difficulty" | "label";

type FieldErrors = Partial<Record<FieldName | "general", string>>;

type IntegerValidation =
  | { ok: true; value: number }
  | { ok: false; reason: "required" | "integer" | "range" };

function validateInteger(
  input: string,
  minimum: number,
  maximum: number,
): IntegerValidation {
  if (!input.trim()) {
    return { ok: false, reason: "required" };
  }

  const value = Number(input);

  if (!Number.isInteger(value)) {
    return { ok: false, reason: "integer" };
  }

  if (value < minimum || value > maximum) {
    return { ok: false, reason: "range" };
  }

  return { ok: true, value };
}

function formatMargin(margin: number): string {
  return margin > 0 ? `+${margin}` : String(margin);
}

function DisplayModeControl({
  mode,
  onChange,
}: {
  mode: VtmV5DiceDisplayMode;
  onChange: (mode: VtmV5DiceDisplayMode) => void;
}) {
  const translations = useTranslations("VtmDiceRoller");

  return (
    <div className="mt-8 min-w-0">
      <p id="dice-display-mode-label" className="font-semibold">
        {translations("displayMode.label")}
      </p>
      <p id="dice-display-mode-help" className="mt-1 text-sm text-white/70">
        {translations("displayMode.help")}
      </p>
      <div
        className="mt-3 inline-flex max-w-full rounded-lg border border-white/25 bg-black/20 p-1"
        role="group"
        aria-labelledby="dice-display-mode-label"
        aria-describedby="dice-display-mode-help"
      >
        {(["symbols", "numbers"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => onChange(option)}
            className={`min-w-0 rounded-md px-4 py-2 text-center font-semibold outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
              mode === option
                ? "bg-white text-neutral-950"
                : "text-white/75"
            }`}
          >
            {translations(`displayMode.${option}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

function DieFace({
  kind,
  value,
  index,
  displayMode,
}: {
  kind: VtmV5DieKind;
  value: number;
  index: number;
  displayMode: VtmV5DiceDisplayMode;
}) {
  const translations = useTranslations("VtmDiceRoller");
  const presentation = getVtmV5DiePresentation(kind, value, displayMode);
  const kindLabel = translations(
    kind === "normal" ? "normalDieKind" : "hungerDieKind",
  );

  if (presentation.symbol) {
    return (
      <li
        aria-label={translations("dieSymbolAria", {
          kind: kindLabel,
          number: index + 1,
          value,
          category: translations(
            `symbolCategories.${presentation.symbol.category}`,
          ),
        })}
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/20"
      >
        <Image
          src={presentation.symbol.src}
          alt=""
          aria-hidden="true"
          width={309}
          height={339}
          className="h-12 w-auto object-contain"
        />
      </li>
    );
  }

  return (
    <li
      aria-label={translations("dieAria", {
        kind: kindLabel,
        number: index + 1,
        value,
      })}
      className={
        kind === "normal"
          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-neutral-300 bg-white text-lg font-bold text-neutral-950 shadow-sm"
          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-red-200 bg-red-800 text-lg font-bold text-white shadow-sm"
      }
    >
      {value}
    </li>
  );
}

function DiceResult({
  result,
  displayMode,
}: {
  result: VtmV5DiceResult;
  displayMode: VtmV5DiceDisplayMode;
}) {
  const translations = useTranslations("VtmDiceRoller");
  const outcomeTitle = translations(`outcomes.${result.summaryKey}.title`);
  const outcomeDescription = translations(
    `outcomes.${result.summaryKey}.description`,
  );

  return (
    <section
      className="mt-4 min-w-0 rounded-xl border border-white/25 bg-black/25 p-4 shadow-lg sm:p-6"
      aria-labelledby="dice-result-title"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 border-b border-white/20 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-200">
            {translations("resultEyebrow")}
          </p>
          <h2
            id="dice-result-title"
            className="mt-1 break-words text-2xl font-bold sm:text-3xl"
          >
            {result.request.label ?? translations("unlabelledRoll")}
          </h2>
          <p className="mt-2 text-sm text-white/75">
            {translations("rolledPool", {
              pool: result.request.pool,
              hunger: result.request.hungerDice,
            })}
          </p>
        </div>

        <div className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-left sm:text-right">
          <p className="text-sm text-white/75">
            {translations("totalSuccesses")}
          </p>
          <p className="text-3xl font-bold">{result.totalSuccesses}</p>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-white/20 bg-white/5 p-4">
          <h3 className="font-semibold">{translations("normalDice")}</h3>
          {result.normalDice.length > 0 ? (
            <ol className="mt-3 flex min-w-0 flex-wrap gap-2">
              {result.normalDice.map((die, index) => (
                <DieFace
                  key={`normal-${index}`}
                  kind="normal"
                  value={die}
                  index={index}
                  displayMode={displayMode}
                />
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-white/70">
              {translations("noNormalDice")}
            </p>
          )}
        </div>

        <div className="min-w-0 rounded-lg border border-red-300/40 bg-red-950/35 p-4">
          <h3 className="font-semibold text-red-100">
            {translations("hungerDice")}
          </h3>
          {result.hungerDiceResults.length > 0 ? (
            <ol className="mt-3 flex min-w-0 flex-wrap gap-2">
              {result.hungerDiceResults.map((die, index) => (
                <DieFace
                  key={`hunger-${index}`}
                  kind="hunger"
                  value={die}
                  index={index}
                  displayMode={displayMode}
                />
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-red-100/75">
              {translations("noHungerDice")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 md:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-white/20 p-4">
          <h3 className="text-xl font-bold">{outcomeTitle}</h3>
          <p className="mt-2 break-words text-white/80">
            {outcomeDescription}
          </p>

          {result.detailFlags.criticalPairBelowDifficulty && (
            <p className="mt-3 text-sm text-white/75">
              {translations("criticalPairBelowDifficulty")}
            </p>
          )}

          {result.detailFlags.hasUnpairedTen && (
            <p className="mt-2 text-sm text-white/75">
              {translations("unpairedTen")}
            </p>
          )}
        </div>

        <div className="min-w-0 rounded-lg border border-white/20 p-4">
          <h3 className="font-semibold">{translations("difficultyTitle")}</h3>
          {result.request.difficulty === null ? (
            <p className="mt-2 break-words text-white/80">
              {translations("difficultyOmitted")}
            </p>
          ) : (
            <dl className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-sm">
              <dt className="text-white/70">{translations("difficulty")}</dt>
              <dd className="font-semibold">{result.request.difficulty}</dd>
              <dt className="text-white/70">
                {translations("difficultyResult")}
              </dt>
              <dd className="font-semibold">
                {translations(`difficultyResults.${result.difficultyResult}`)}
              </dd>
              <dt className="text-white/70">{translations("margin")}</dt>
              <dd className="font-semibold">
                {formatMargin(result.margin ?? 0)}
              </dd>
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

export default function PersonalDiceRoller() {
  const translations = useTranslations("VtmDiceRoller");
  const [pool, setPool] = useState("1");
  const [hungerDice, setHungerDice] = useState("0");
  const [difficulty, setDifficulty] = useState("");
  const [label, setLabel] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<VtmV5DiceResult | null>(null);
  const [displayMode, setDisplayMode] =
    useState<VtmV5DiceDisplayMode>("symbols");

  function clearFieldError(field: FieldName) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      general: undefined,
    }));
  }

  function getIntegerError(
    validation: Exclude<IntegerValidation, { ok: true }>,
    field: "pool" | "hungerDice" | "difficulty",
    minimum: number,
    maximum: number,
  ): string {
    if (validation.reason === "required") {
      return translations(`validation.${field}Required`);
    }

    if (validation.reason === "integer") {
      return translations(`validation.${field}Integer`);
    }

    return translations(`validation.${field}Range`, {
      minimum,
      maximum,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    const poolValidation = validateInteger(
      pool,
      VTM_V5_DICE_LIMITS.pool.minimum,
      VTM_V5_DICE_LIMITS.pool.maximum,
    );
    const hungerValidation = validateInteger(
      hungerDice,
      VTM_V5_DICE_LIMITS.hungerDice.minimum,
      VTM_V5_DICE_LIMITS.hungerDice.maximum,
    );
    const difficultyValidation = difficulty.trim()
      ? validateInteger(
          difficulty,
          VTM_V5_DICE_LIMITS.difficulty.minimum,
          VTM_V5_DICE_LIMITS.difficulty.maximum,
        )
      : null;

    if (!poolValidation.ok) {
      nextErrors.pool = getIntegerError(
        poolValidation,
        "pool",
        VTM_V5_DICE_LIMITS.pool.minimum,
        VTM_V5_DICE_LIMITS.pool.maximum,
      );
    }

    if (!hungerValidation.ok) {
      nextErrors.hungerDice = getIntegerError(
        hungerValidation,
        "hungerDice",
        VTM_V5_DICE_LIMITS.hungerDice.minimum,
        VTM_V5_DICE_LIMITS.hungerDice.maximum,
      );
    }

    if (difficultyValidation && !difficultyValidation.ok) {
      nextErrors.difficulty = getIntegerError(
        difficultyValidation,
        "difficulty",
        VTM_V5_DICE_LIMITS.difficulty.minimum,
        VTM_V5_DICE_LIMITS.difficulty.maximum,
      );
    }

    if (
      poolValidation.ok &&
      hungerValidation.ok &&
      hungerValidation.value > poolValidation.value
    ) {
      nextErrors.hungerDice = translations("validation.hungerExceedsPool");
    }

    if ([...label.trim()].length > VTM_V5_DICE_LIMITS.labelCodePoints) {
      nextErrors.label = translations("validation.labelTooLong", {
        maximum: VTM_V5_DICE_LIMITS.labelCodePoints,
      });
    }

    if (
      !poolValidation.ok ||
      !hungerValidation.ok ||
      (difficultyValidation !== null && !difficultyValidation.ok) ||
      Object.keys(nextErrors).length > 0
    ) {
      setErrors(nextErrors);
      return;
    }

    try {
      const evaluation = rollVtmV5Dice({
        pool: poolValidation.value,
        hungerDice: hungerValidation.value,
        ...(difficultyValidation
          ? { difficulty: difficultyValidation.value }
          : {}),
        ...(label.trim() ? { label } : {}),
      });

      if (!evaluation.ok) {
        setErrors({ general: translations("validation.unexpected") });
        return;
      }

      setErrors({});
      setResult(evaluation.result);
    } catch {
      setErrors({ general: translations("validation.randomUnavailable") });
    }
  }

  const inputClassName =
    "mt-2 w-full rounded-lg border border-neutral-400 bg-white px-3 py-2.5 text-neutral-950 outline-none focus-visible:border-red-700 focus-visible:ring-2 focus-visible:ring-red-300";

  return (
    <>
      <form
        className="mt-8 rounded-xl border border-white/25 bg-black/20 p-4 sm:p-6"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="dice-pool" className="font-semibold">
              {translations("pool")}
            </label>
            <input
              id="dice-pool"
              type="number"
              inputMode="numeric"
              min={VTM_V5_DICE_LIMITS.pool.minimum}
              max={VTM_V5_DICE_LIMITS.pool.maximum}
              step="1"
              value={pool}
              onChange={(event) => {
                setPool(event.target.value);
                clearFieldError("pool");
              }}
              aria-invalid={Boolean(errors.pool)}
              aria-describedby={errors.pool ? "dice-pool-error" : undefined}
              className={inputClassName}
            />
            {errors.pool && (
              <p id="dice-pool-error" className="mt-2 text-sm text-red-200">
                {errors.pool}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="hunger-dice" className="font-semibold">
              {translations("hungerDice")}
            </label>
            <input
              id="hunger-dice"
              type="number"
              inputMode="numeric"
              min={VTM_V5_DICE_LIMITS.hungerDice.minimum}
              max={VTM_V5_DICE_LIMITS.hungerDice.maximum}
              step="1"
              value={hungerDice}
              onChange={(event) => {
                setHungerDice(event.target.value);
                clearFieldError("hungerDice");
              }}
              aria-invalid={Boolean(errors.hungerDice)}
              aria-describedby={
                errors.hungerDice ? "hunger-dice-error" : undefined
              }
              className={inputClassName}
            />
            {errors.hungerDice && (
              <p id="hunger-dice-error" className="mt-2 text-sm text-red-200">
                {errors.hungerDice}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="difficulty" className="font-semibold">
              {translations("difficultyOptional")}
            </label>
            <input
              id="difficulty"
              type="number"
              inputMode="numeric"
              min={VTM_V5_DICE_LIMITS.difficulty.minimum}
              max={VTM_V5_DICE_LIMITS.difficulty.maximum}
              step="1"
              value={difficulty}
              onChange={(event) => {
                setDifficulty(event.target.value);
                clearFieldError("difficulty");
              }}
              aria-invalid={Boolean(errors.difficulty)}
              aria-describedby={
                errors.difficulty
                  ? "difficulty-help difficulty-error"
                  : "difficulty-help"
              }
              className={inputClassName}
            />
            <p id="difficulty-help" className="mt-2 text-sm text-white/65">
              {translations("difficultyHelp")}
            </p>
            {errors.difficulty && (
              <p id="difficulty-error" className="mt-2 text-sm text-red-200">
                {errors.difficulty}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="roll-label" className="font-semibold">
              {translations("labelOptional")}
            </label>
            <input
              id="roll-label"
              type="text"
              value={label}
              onChange={(event) => {
                setLabel(event.target.value);
                clearFieldError("label");
              }}
              aria-invalid={Boolean(errors.label)}
              aria-describedby={errors.label ? "roll-label-error" : undefined}
              className={inputClassName}
              placeholder={translations("labelPlaceholder")}
            />
            {errors.label && (
              <p id="roll-label-error" className="mt-2 text-sm text-red-200">
                {errors.label}
              </p>
            )}
          </div>
        </div>

        {errors.general && (
          <p className="mt-5 text-sm text-red-200" role="alert">
            {errors.general}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-white px-5 py-3 font-bold text-neutral-950 outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-red-950 sm:w-auto"
        >
          {translations("roll")}
        </button>
      </form>

      {result && (
        <>
          <DisplayModeControl mode={displayMode} onChange={setDisplayMode} />
          <DiceResult result={result} displayMode={displayMode} />
        </>
      )}
    </>
  );
}
