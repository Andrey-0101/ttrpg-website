"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import {
  CUSTOM_DICE_POOL_LIMITS,
  CUSTOM_POOL_ITEM_KEYS,
  rollCustomDicePool,
  type CustomCoinOutcome,
  type CustomDicePoolResult,
  type CustomDiceQuantities,
  type CustomDieSides,
  type CustomPoolItemKey,
} from "@/lib/dice/custom-dice-pool";

type QuantityFields = Record<CustomPoolItemKey, string>;
type FieldErrors = Partial<Record<CustomPoolItemKey, string>>;

const INITIAL_QUANTITIES: QuantityFields = {
  coin: "0",
  4: "0",
  6: "0",
  8: "0",
  10: "0",
  12: "0",
  20: "0",
  100: "0",
};

const DIE_CLIP_PATHS: Record<CustomDieSides, string> = {
  4: "polygon(50% 4%, 96% 92%, 4% 92%)",
  6: "polygon(8% 8%, 92% 8%, 92% 92%, 8% 92%)",
  8: "polygon(50% 2%, 96% 50%, 50% 98%, 4% 50%)",
  10: "polygon(50% 2%, 94% 34%, 79% 88%, 50% 100%, 21% 88%, 6% 34%)",
  12: "polygon(25% 4%, 75% 4%, 98% 50%, 75% 96%, 25% 96%, 2% 50%)",
  20: "polygon(50% 2%, 88% 18%, 98% 58%, 72% 96%, 28% 96%, 2% 58%, 12% 18%)",
  100: "circle(48% at 50% 50%)",
};

const DIE_COLORS: Record<CustomDieSides, string> = {
  4: "bg-amber-800",
  6: "bg-slate-800",
  8: "bg-emerald-800",
  10: "bg-blue-900",
  12: "bg-violet-900",
  20: "bg-rose-900",
  100: "bg-neutral-900",
};

function parseQuantities(fields: QuantityFields): CustomDiceQuantities {
  return Object.fromEntries(
    CUSTOM_POOL_ITEM_KEYS.map((item) => {
      const value = fields[item].trim();
      return [item, value === "" ? Number.NaN : Number(value)];
    }),
  ) as CustomDiceQuantities;
}

function CoinFace({
  outcome,
  index,
}: {
  outcome: CustomCoinOutcome;
  index: number;
}) {
  const translations = useTranslations("CustomDicePool");
  const outcomeLabel = translations(`coinOutcomes.${outcome}`);

  return (
    <li
      aria-label={translations("coinResultAria", {
        item: translations("coinLabel"),
        number: index + 1,
        outcome: outcomeLabel,
      })}
      className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-amber-200/80 bg-amber-800 shadow-[inset_0_0_0_3px_rgb(69_26_3_/_0.45)]"
    >
      <span className="max-w-14 px-1 text-center text-xs font-black leading-tight text-amber-50">
        {outcomeLabel}
      </span>
    </li>
  );
}

function DiceFace({
  sides,
  value,
  index,
}: {
  sides: CustomDieSides;
  value: number;
  index: number;
}) {
  const translations = useTranslations("CustomDicePool");
  const clipPath = DIE_CLIP_PATHS[sides];

  return (
    <li
      aria-label={translations("resultDieAria", {
        die: `d${sides}`,
        number: index + 1,
        value,
      })}
      className="relative flex h-16 w-16 shrink-0 items-center justify-center"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-white/65"
        style={{ clipPath }}
      />
      <span
        aria-hidden="true"
        className={`absolute inset-[2px] ${DIE_COLORS[sides]}`}
        style={{ clipPath }}
      />
      <span className="relative z-10 flex flex-col items-center justify-center text-white drop-shadow-sm">
        <span className="text-[10px] font-semibold uppercase leading-none text-white/75">
          d{sides}
        </span>
        <span className="mt-0.5 text-xl font-black leading-none tabular-nums">
          {value}
        </span>
      </span>
    </li>
  );
}

function RollResult({ result }: { result: CustomDicePoolResult }) {
  const translations = useTranslations("CustomDicePool");

  return (
    <section
      className="mt-8 min-w-0 rounded-xl border border-white/25 bg-black/25 p-4 shadow-lg sm:p-6"
      aria-labelledby="custom-dice-result-title"
      aria-live="polite"
    >
      <h2 id="custom-dice-result-title" className="text-2xl font-bold">
        {translations("resultTitle")}
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/15 bg-black/20 p-3">
          <dt className="text-sm text-white/70">{translations("totalItems")}</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums">
            {result.totalItems}
          </dd>
        </div>
        {result.groups.length > 0 && (
          <div className="rounded-lg border border-white/15 bg-black/20 p-3">
            <dt className="text-sm text-white/70">
              {translations("numericDiceTotal")}
            </dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">
              {result.numericDiceTotal}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-6 space-y-6">
        {result.coinResults.length > 0 && (
          <section aria-labelledby="coin-results-title">
            <h3 id="coin-results-title" className="text-lg font-bold">
              {translations("coinGroupTitle", {
                item: translations("coinLabel"),
                count: result.coinResults.length,
              })}
            </h3>
            <dl className="mt-3 flex flex-wrap gap-3 text-sm">
              <div className="rounded-lg border border-white/15 bg-black/20 px-3 py-2">
                <dt className="inline text-white/70">
                  {translations("coinOutcomes.heads")}: {" "}
                </dt>
                <dd className="inline font-bold tabular-nums">
                  {result.coinResults.filter((outcome) => outcome === "heads").length}
                </dd>
              </div>
              <div className="rounded-lg border border-white/15 bg-black/20 px-3 py-2">
                <dt className="inline text-white/70">
                  {translations("coinOutcomes.tails")}: {" "}
                </dt>
                <dd className="inline font-bold tabular-nums">
                  {result.coinResults.filter((outcome) => outcome === "tails").length}
                </dd>
              </div>
            </dl>
            <ol className="mt-3 flex min-w-0 flex-wrap gap-2">
              {result.coinResults.map((outcome, index) => (
                <CoinFace key={`coin-${index}`} outcome={outcome} index={index} />
              ))}
            </ol>
          </section>
        )}
        {result.groups.map((group) => (
          <section key={group.sides} aria-labelledby={`result-d${group.sides}`}>
            <h3 id={`result-d${group.sides}`} className="text-lg font-bold">
              {translations("groupTitle", {
                die: `d${group.sides}`,
                count: group.results.length,
              })}
            </h3>
            <ol className="mt-3 flex min-w-0 flex-wrap gap-2">
              {group.results.map((value, index) => (
                <DiceFace
                  key={`${group.sides}-${index}`}
                  sides={group.sides}
                  value={value}
                  index={index}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}

export default function CustomDicePool() {
  const translations = useTranslations("CustomDicePool");
  const [quantities, setQuantities] =
    useState<QuantityFields>(INITIAL_QUANTITIES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<CustomDicePoolResult | null>(null);
  const configuredTotal = useMemo(
    () =>
      CUSTOM_POOL_ITEM_KEYS.reduce((total, item) => {
        const value = Number(quantities[item]);
        return total + (Number.isInteger(value) && value > 0 ? value : 0);
      }, 0),
    [quantities],
  );

  function updateQuantity(item: CustomPoolItemKey, value: string) {
    setQuantities((current) => ({ ...current, [item]: value }));
    setFieldErrors((current) => ({ ...current, [item]: undefined }));
    setFormError(null);
  }

  function stepQuantity(item: CustomPoolItemKey, change: -1 | 1) {
    const current = Number(quantities[item]);
    const safeCurrent = Number.isInteger(current) ? current : 0;
    const next = Math.min(
      CUSTOM_DICE_POOL_LIMITS.quantityPerType,
      Math.max(0, safeCurrent + change),
    );
    updateQuantity(item, String(next));
  }

  function handleRoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const evaluationRequest = { quantities: parseQuantities(quantities) };

    try {
      const evaluation = rollCustomDicePool(evaluationRequest);

      if (!evaluation.ok) {
        const nextFieldErrors: FieldErrors = {};
        let nextFormError: string | null = null;

        for (const error of evaluation.errors) {
          if (error.code === "invalid-quantity") {
            const itemPath = error.path.split(".").at(-1);
            const item = CUSTOM_POOL_ITEM_KEYS.find(
              (candidate) => String(candidate) === itemPath,
            );
            if (item !== undefined) {
              nextFieldErrors[item] = translations(
                "errors.invalidQuantity",
                { maximum: CUSTOM_DICE_POOL_LIMITS.quantityPerType },
              );
            }
          } else if (error.code === "pool-empty") {
            nextFormError = translations("errors.emptyPool");
          } else if (error.code === "pool-too-large") {
            nextFormError = translations("errors.poolTooLarge", {
              maximum: CUSTOM_DICE_POOL_LIMITS.totalDice,
            });
          } else {
            nextFormError = translations("errors.invalidRequest");
          }
        }

        setFieldErrors(nextFieldErrors);
        setFormError(nextFormError);
        return;
      }

      setFieldErrors({});
      setFormError(null);
      setResult(evaluation.result);
    } catch {
      setFieldErrors({});
      setFormError(translations("errors.randomUnavailable"));
    }
  }

  function handleClear() {
    setQuantities({ ...INITIAL_QUANTITIES });
    setFieldErrors({});
    setFormError(null);
    setResult(null);
  }

  return (
    <>
      <form
        className="mt-8 min-w-0 rounded-xl border border-white/25 bg-black/20 p-4 shadow-lg sm:p-6"
        onSubmit={handleRoll}
        noValidate
      >
        <fieldset>
          <legend className="text-2xl font-bold">{translations("poolTitle")}</legend>
          <p className="mt-2 max-w-3xl text-white/75">
            {translations("poolHelp", {
              maximum: CUSTOM_DICE_POOL_LIMITS.totalDice,
            })}
          </p>

          <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CUSTOM_POOL_ITEM_KEYS.map((item) => {
              const itemLabel =
                item === "coin" ? translations("coinLabel") : `d${item}`;
              const inputId = `quantity-${item}`;
              const errorId = `${inputId}-error`;
              const error = fieldErrors[item];

              return (
                <div
                  key={item}
                  className="min-w-0 rounded-lg border border-white/15 bg-black/20 p-4"
                >
                  <label htmlFor={inputId} className="text-lg font-bold">
                    {itemLabel}
                  </label>
                  <div className="mt-3 grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] gap-2">
                    <button
                      type="button"
                      onClick={() => stepQuantity(item, -1)}
                      aria-label={translations("decrease", { item: itemLabel })}
                      className="flex min-h-11 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-xl font-bold outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                      <span aria-hidden="true">−</span>
                    </button>
                    <input
                      id={inputId}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={CUSTOM_DICE_POOL_LIMITS.quantityPerType}
                      step={1}
                      value={quantities[item]}
                      onChange={(event) => updateQuantity(item, event.target.value)}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? errorId : undefined}
                      className="min-h-11 min-w-0 rounded-lg border border-white/30 bg-neutral-950 px-2 text-center text-lg font-bold tabular-nums text-white outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    />
                    <button
                      type="button"
                      onClick={() => stepQuantity(item, 1)}
                      aria-label={translations("increase", { item: itemLabel })}
                      className="flex min-h-11 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-xl font-bold outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                      <span aria-hidden="true">+</span>
                    </button>
                  </div>
                  {error && (
                    <p id={errorId} className="mt-2 text-sm text-red-200">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>

        <p className="mt-5 text-sm text-white/75" aria-live="polite">
          {translations("configuredTotal", {
            count: configuredTotal,
            maximum: CUSTOM_DICE_POOL_LIMITS.totalDice,
          })}
        </p>

        {formError && (
          <p
            className="mt-4 rounded-lg border border-red-300/40 bg-red-950/40 p-3 text-red-100"
            role="alert"
          >
            {formError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-white px-6 py-3 font-bold text-neutral-950 outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {translations("roll")}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="min-h-11 rounded-lg border border-white/30 px-6 py-3 font-bold text-white outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {translations("clear")}
          </button>
        </div>
      </form>

      {result && <RollResult result={result} />}
    </>
  );
}
