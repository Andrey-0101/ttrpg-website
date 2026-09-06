"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { recordPersonalRollAction } from "@/app/[locale]/dice-rollers/actions";
import {
  recordCoc7eOtherDiceRollBestEffort,
  recordCoc7ePercentileRollBestEffort,
} from "@/lib/dice/personal-roll-recording";
import {
  COC_7E_BONUS_PENALTY_VALUES,
  COC_7E_OTHER_DIE_SIDES,
  type Coc7eBonusPenalty,
  type Coc7eOtherDiceResult,
  type Coc7eOtherDieSides,
  type Coc7ePercentileTestResult,
} from "@/lib/game-systems/call-of-cthulhu-7e/dice-engine";
import {
  rollCoc7eOtherDice,
  rollCoc7ePercentileTest,
} from "@/lib/game-systems/call-of-cthulhu-7e/dice-roller";

const TARGET_PATTERN = /^\d+$/u;
const QUANTITY_MINIMUM = 1;
const QUANTITY_MAXIMUM = 10;
const MODIFIER_MINIMUM = -10;
const MODIFIER_MAXIMUM = 10;

const panelClassName =
  "min-w-0 rounded-xl border border-white/25 bg-black/20 p-4 shadow-lg sm:p-6";
const labelClassName = "block text-sm font-semibold text-white/85";
const selectClassName =
  "mt-2 min-h-11 rounded-lg border border-white/30 bg-neutral-950 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-red-300";
const rollButtonClassName =
  "min-h-11 rounded-lg bg-white px-5 py-2.5 font-bold text-neutral-950 outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";
const stepButtonClassName =
  "flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-xl font-bold outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/10";

type StepperProps = {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (value: number) => void;
};

function Stepper({
  label,
  value,
  minimum,
  maximum,
  decreaseLabel,
  increaseLabel,
  onChange,
}: StepperProps) {
  const labelId = useId();

  return (
    <div className="min-w-0">
      <span id={labelId} className={labelClassName}>
        {label}
      </span>
      <div
        className="mt-2 grid grid-cols-[2.75rem_3.25rem_2.75rem] gap-2"
        role="group"
        aria-labelledby={labelId}
      >
        <button
          type="button"
          disabled={value <= minimum}
          onClick={() => onChange(Math.max(minimum, value - 1))}
          aria-label={decreaseLabel}
          className={stepButtonClassName}
        >
          <span aria-hidden="true">−</span>
        </button>
        <output className="flex min-h-11 items-center justify-center rounded-lg border border-white/30 bg-neutral-950 px-2 font-bold tabular-nums text-white">
          {value}
        </output>
        <button
          type="button"
          disabled={value >= maximum}
          onClick={() => onChange(Math.min(maximum, value + 1))}
          aria-label={increaseLabel}
          className={stepButtonClassName}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}

function TensDie({
  value,
  index,
  result,
}: {
  value: number;
  index: number;
  result: Coc7ePercentileTestResult;
}) {
  const translations = useTranslations("Coc7eDiceRoller");
  const isBase = index === 0;
  const isSelected = index === result.selectedTensIndex;
  const textColor = isBase
    ? "text-white"
    : result.request.bonusPenalty > 0
      ? "text-emerald-300"
      : "text-red-300";
  const visibleValue = value === 0 ? "00" : String(value);
  const roleLabel = isBase
    ? translations("accessibility.baseTens", { value: visibleValue })
    : result.request.bonusPenalty > 0
      ? translations("accessibility.bonusTens", {
          number: index,
          value: visibleValue,
        })
      : translations("accessibility.penaltyTens", {
          number: index,
          value: visibleValue,
        });
  const accessibleLabel = isSelected
    ? `${roleLabel}. ${translations("accessibility.selectedTens")}`
    : roleLabel;

  return (
    <li
      className="relative flex h-14 w-14 shrink-0 items-center justify-center"
      aria-label={accessibleLabel}
      data-tens-role={
        isBase
          ? "base"
          : result.request.bonusPenalty > 0
            ? "bonus"
            : "penalty"
      }
      data-selected={isSelected ? "true" : undefined}
    >
      {isSelected ? (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-white/75 [clip-path:polygon(50%_2%,94%_34%,79%_88%,50%_100%,21%_88%,6%_34%)]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-[2px] bg-neutral-950 [clip-path:polygon(50%_2%,94%_34%,79%_88%,50%_100%,21%_88%,6%_34%)]"
          />
        </>
      ) : null}
      <span
        aria-hidden="true"
        className={`relative z-10 text-xl font-black tabular-nums ${textColor}`}
      >
        {visibleValue}
      </span>
    </li>
  );
}

function PercentileResult({
  result,
}: {
  result: Coc7ePercentileTestResult;
}) {
  const translations = useTranslations("Coc7eDiceRoller");
  const target = result.request.target;
  const hardThreshold = result.hardThreshold;
  const extremeThreshold = result.extremeThreshold;
  const outcome = result.outcome;
  const interpretation =
    target !== null &&
    hardThreshold !== null &&
    extremeThreshold !== null &&
    outcome !== null
      ? { target, hardThreshold, extremeThreshold, outcome }
      : null;

  return (
    <section className="mt-6 border-t border-white/20 pt-5" aria-live="polite">
      <div
        className="flex min-w-0 flex-wrap items-center gap-2"
        role="group"
        aria-label={translations("accessibility.percentileDice")}
      >
        <ol className="flex min-w-0 flex-wrap gap-1.5">
          {result.tensDice.map((value, index) => (
            <TensDie
              key={`tens-${index}`}
              value={value}
              index={index}
              result={result}
            />
          ))}
        </ol>
        <div className="ml-1 border-l border-white/20 pl-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/25 bg-white/5 text-xl font-black tabular-nums text-white"
            aria-label={translations("accessibility.units", {
              value: result.units,
            })}
          >
            {result.units}
          </span>
        </div>
      </div>

      {interpretation ? (
        <p className="mt-5 text-sm font-medium text-white/75">
          {translations("percentile.thresholds", {
            target: interpretation.target,
            hard: interpretation.hardThreshold,
            extreme: interpretation.extremeThreshold,
          })}
        </p>
      ) : null}

      <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-5xl font-black tabular-nums sm:text-6xl">
          {result.percentileResult}
        </span>
        {interpretation ? (
          <span className="text-lg font-bold text-white sm:text-xl">
            {translations(`outcomes.${interpretation.outcome}`)}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function parseTarget(value: string): number | null | "invalid" {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (!TARGET_PATTERN.test(normalized)) {
    return "invalid";
  }

  const target = Number(normalized);
  return target >= 1 && target <= 100 ? target : "invalid";
}

function PercentilePanel({ authenticated }: { authenticated: boolean }) {
  const translations = useTranslations("Coc7eDiceRoller");
  const id = useId();
  const targetId = `${id}-target`;
  const targetErrorId = `${id}-target-error`;
  const [target, setTarget] = useState("");
  const [bonusPenalty, setBonusPenalty] =
    useState<Coc7eBonusPenalty>(0);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] =
    useState<Coc7ePercentileTestResult | null>(null);

  function handleRoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedTarget = parseTarget(target);

    if (parsedTarget === "invalid") {
      setTargetError(translations("errors.target"));
      setFormError(null);
      return;
    }

    try {
      const evaluation = rollCoc7ePercentileTest({
        target: parsedTarget,
        bonusPenalty,
      });

      if (!evaluation.ok) {
        const hasTargetError = evaluation.errors.some(
          (error) => error.path === "request.target",
        );
        setTargetError(
          hasTargetError ? translations("errors.target") : null,
        );
        setFormError(
          hasTargetError ? null : translations("errors.percentileRequest"),
        );
        return;
      }

      setTargetError(null);
      setFormError(null);
      setResult(evaluation.result);
      void recordCoc7ePercentileRollBestEffort({
        authenticated,
        snapshot: evaluation.result,
        recordAction: recordPersonalRollAction,
      });
    } catch {
      setFormError(translations("errors.randomUnavailable"));
    }
  }

  return (
    <form className={panelClassName} onSubmit={handleRoll} noValidate>
      <fieldset className="min-w-0">
        <legend className="text-2xl font-bold">
          {translations("percentile.title")}
        </legend>

        <div className="mt-5 flex min-w-0 flex-wrap items-end gap-4">
          <div className="min-w-0">
            <label htmlFor={targetId} className={labelClassName}>
              {translations("percentile.target")}
            </label>
            <input
              id={targetId}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              step={1}
              value={target}
              onChange={(event) => {
                setTarget(event.target.value);
                setTargetError(null);
              }}
              aria-invalid={Boolean(targetError)}
              aria-describedby={targetError ? targetErrorId : undefined}
              className="mt-2 block min-h-11 w-28 rounded-lg border border-white/30 bg-neutral-950 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            />
            {targetError ? (
              <p
                id={targetErrorId}
                className="mt-2 max-w-64 text-sm text-red-200"
                role="alert"
              >
                {targetError}
              </p>
            ) : null}
          </div>

          <div className="min-w-0">
            <label htmlFor={`${id}-bonus-penalty`} className={labelClassName}>
              {translations("percentile.bonusPenalty")}
            </label>
            <select
              id={`${id}-bonus-penalty`}
              value={bonusPenalty}
              onChange={(event) => {
                setBonusPenalty(
                  Number(event.target.value) as Coc7eBonusPenalty,
                );
                setFormError(null);
              }}
              className={`${selectClassName} w-full`}
            >
              {COC_7E_BONUS_PENALTY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value === 0
                    ? "-"
                    : translations(
                        value < 0
                          ? `percentile.options.penalty${Math.abs(value)}`
                          : `percentile.options.bonus${value}`,
                      )}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className={rollButtonClassName}>
            {translations("roll")}
          </button>
        </div>

        {formError ? (
          <p className="mt-3 text-sm text-red-200" role="alert">
            {formError}
          </p>
        ) : null}
      </fieldset>

      {result ? <PercentileResult result={result} /> : null}
    </form>
  );
}

function OtherDiceResult({ result }: { result: Coc7eOtherDiceResult }) {
  const translations = useTranslations("Coc7eDiceRoller");
  const modifier = result.request.modifier;

  return (
    <section className="mt-6 border-t border-white/20 pt-5" aria-live="polite">
      <p className="text-lg font-bold tabular-nums">{result.formula}</p>
      <div
        className="mt-4 flex min-w-0 flex-wrap items-center gap-2"
        role="group"
        aria-label={translations("accessibility.otherDiceResults")}
      >
        {result.results.map((value, index) => (
          <span
            key={`die-${index}`}
            className="flex h-11 min-w-11 items-center justify-center rounded-lg border border-white/25 bg-white/5 px-2 font-bold tabular-nums"
            aria-label={translations("accessibility.otherDie", {
              number: index + 1,
              value,
            })}
          >
            {value}
          </span>
        ))}
        {modifier !== 0 ? (
          <span
            className="ml-1 font-bold tabular-nums text-white/85"
            aria-label={translations("accessibility.resultModifier", {
              value: modifier,
            })}
          >
            {modifier > 0 ? `+${modifier}` : modifier}
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-3xl font-black tabular-nums">
        {translations("other.total", { total: result.total })}
      </p>
    </section>
  );
}

function OtherDicePanel({ authenticated }: { authenticated: boolean }) {
  const translations = useTranslations("Coc7eDiceRoller");
  const id = useId();
  const [sides, setSides] = useState<Coc7eOtherDieSides>(6);
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<Coc7eOtherDiceResult | null>(null);

  function handleRoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const evaluation = rollCoc7eOtherDice({
        sides,
        quantity,
        modifier,
      });

      if (!evaluation.ok) {
        setFormError(translations("errors.otherRequest"));
        return;
      }

      setFormError(null);
      setResult(evaluation.result);
      void recordCoc7eOtherDiceRollBestEffort({
        authenticated,
        snapshot: evaluation.result,
        recordAction: recordPersonalRollAction,
      });
    } catch {
      setFormError(translations("errors.randomUnavailable"));
    }
  }

  return (
    <form className={panelClassName} onSubmit={handleRoll} noValidate>
      <fieldset className="min-w-0">
        <legend className="text-2xl font-bold">
          {translations("other.title")}
        </legend>

        <div className="mt-5 flex min-w-0 flex-wrap items-end gap-4">
          <div className="min-w-0">
            <label htmlFor={`${id}-die-type`} className={labelClassName}>
              {translations("other.dieType")}
            </label>
            <select
              id={`${id}-die-type`}
              value={sides}
              onChange={(event) => {
                setSides(Number(event.target.value) as Coc7eOtherDieSides);
                setFormError(null);
              }}
              className={selectClassName}
            >
              {COC_7E_OTHER_DIE_SIDES.map((value) => (
                <option key={value} value={value}>
                  D{value}
                </option>
              ))}
            </select>
          </div>

          <Stepper
            label={translations("other.quantity")}
            value={quantity}
            minimum={QUANTITY_MINIMUM}
            maximum={QUANTITY_MAXIMUM}
            decreaseLabel={translations("accessibility.decreaseQuantity")}
            increaseLabel={translations("accessibility.increaseQuantity")}
            onChange={(value) => {
              setQuantity(value);
              setFormError(null);
            }}
          />

          <Stepper
            label={translations("other.modifier")}
            value={modifier}
            minimum={MODIFIER_MINIMUM}
            maximum={MODIFIER_MAXIMUM}
            decreaseLabel={translations("accessibility.decreaseModifier")}
            increaseLabel={translations("accessibility.increaseModifier")}
            onChange={(value) => {
              setModifier(value);
              setFormError(null);
            }}
          />

          <button type="submit" className={rollButtonClassName}>
            {translations("roll")}
          </button>
        </div>

        {formError ? (
          <p className="mt-3 text-sm text-red-200" role="alert">
            {formError}
          </p>
        ) : null}
      </fieldset>

      {result ? <OtherDiceResult result={result} /> : null}
    </form>
  );
}

export default function CallOfCthulhu7eDiceRoller({
  authenticated,
}: {
  authenticated: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,3fr)_minmax(16rem,2fr)]">
      <PercentilePanel authenticated={authenticated} />
      <OtherDicePanel authenticated={authenticated} />
    </div>
  );
}
