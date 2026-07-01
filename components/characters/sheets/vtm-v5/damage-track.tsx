"use client";

import type { VtmV5DamageTrack } from "@/lib/characters/vtm-v5/schema";

type DamageState =
  | "empty"
  | "superficial"
  | "aggravated";

type DamageTrackProps = {
  label: string;
  maximum: number;
  value: VtmV5DamageTrack;
  isEditing: boolean;
  onChange: (value: VtmV5DamageTrack) => void;
  bonusLabel: string;
  getBoxLabel: (
    box: number,
    state: DamageState,
  ) => string;
};

function getDamageState(
  index: number,
  value: VtmV5DamageTrack,
): DamageState {
  if (index < value.aggravated) {
    return "aggravated";
  }

  if (
    index <
    value.aggravated + value.superficial
  ) {
    return "superficial";
  }

  return "empty";
}

export default function DamageTrack({
  label,
  maximum,
  value,
  isEditing,
  onChange,
  bonusLabel,
  getBoxLabel,
}: DamageTrackProps) {
  const totalDamage =
    value.superficial + value.aggravated;
  const displayedMaximum = Math.max(
    1,
    maximum,
    totalDamage,
  );

  function cycleBox(state: DamageState) {
    if (!isEditing) {
      return;
    }

    if (state === "empty") {
      if (totalDamage >= displayedMaximum) {
        return;
      }

      onChange({
        ...value,
        superficial: value.superficial + 1,
      });
      return;
    }

    if (state === "superficial") {
      onChange({
        ...value,
        superficial: Math.max(
          0,
          value.superficial - 1,
        ),
        aggravated: value.aggravated + 1,
      });
      return;
    }

    onChange({
      ...value,
      aggravated: Math.max(
        0,
        value.aggravated - 1,
      ),
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </h3>

        <label className="flex items-center gap-2 text-[11px] text-gray-500">
          {bonusLabel}
          <input
            type="number"
            min={0}
            max={10}
            value={value.bonus}
            onChange={(event) =>
              onChange({
                ...value,
                bonus: Math.min(
                  10,
                  Math.max(
                    0,
                    Number(event.target.value),
                  ),
                ),
              })
            }
            disabled={!isEditing}
            className="w-14 rounded border px-1.5 py-1 text-center text-xs disabled:bg-gray-100 disabled:text-gray-900"
          />
        </label>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {Array.from(
          { length: displayedMaximum },
          (_, index) => {
            const state = getDamageState(
              index,
              value,
            );

            return (
              <button
                key={index}
                type="button"
                onClick={() => cycleBox(state)}
                disabled={!isEditing}
                aria-label={getBoxLabel(
                  index + 1,
                  state,
                )}
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-sm border text-sm font-bold leading-none",
                  "disabled:cursor-default",
                  state === "aggravated"
                    ? "border-black bg-black text-white"
                    : state === "superficial"
                      ? "border-black bg-white text-black"
                      : "border-gray-400 bg-white text-transparent",
                ].join(" ")}
              >
                {state === "aggravated"
                  ? "×"
                  : state === "superficial"
                    ? "/"
                    : "·"}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
