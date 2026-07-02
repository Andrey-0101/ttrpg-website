"use client";

import type { VtmV5DamageTrack } from "@/lib/characters/vtm-v5/schema";

type DamageState = "empty" | "superficial" | "aggravated";

type DamageTrackProps = {
  label: string;
  maximum: number;
  value: VtmV5DamageTrack;
  isEditing: boolean;
  onChange: (value: VtmV5DamageTrack) => void;
  bonusLabel: string;
  getBoxLabel: (box: number, state: DamageState) => string;
};

function getDamageState(
  index: number,
  value: VtmV5DamageTrack,
): DamageState {
  if (index < value.aggravated) {
    return "aggravated";
  }

  if (index < value.aggravated + value.superficial) {
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
  const totalDamage = value.superficial + value.aggravated;
  const displayedMaximum = Math.max(1, maximum, totalDamage);

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
        superficial: Math.max(0, value.superficial - 1),
        aggravated: value.aggravated + 1,
      });
      return;
    }

    onChange({
      ...value,
      aggravated: Math.max(0, value.aggravated - 1),
    });
  }

  return (
    <div className="min-w-0 px-2 py-1.5 sm:px-3">
      <div className="flex min-h-6 items-center justify-center gap-2">
        <h3 className="text-sm font-bold italic leading-none">{label}</h3>

        {isEditing ? (
          <label className="flex items-center gap-1 text-[10px] text-neutral-600">
            <span>{bonusLabel}</span>
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
                    Math.max(0, Number(event.target.value)),
                  ),
                })
              }
              className="w-9 border-b border-neutral-500 bg-transparent px-0.5 text-center text-[11px] text-neutral-950 outline-none"
            />
          </label>
        ) : value.bonus > 0 ? (
          <span className="text-[10px] text-neutral-600">+{value.bonus}</span>
        ) : null}
      </div>

      <div className="mt-1 flex flex-wrap justify-center gap-1">
        {Array.from({ length: displayedMaximum }, (_, index) => {
          const state = getDamageState(index, value);

          return (
            <button
              key={index}
              type="button"
              onClick={() => cycleBox(state)}
              disabled={!isEditing}
              aria-label={getBoxLabel(index + 1, state)}
              className={[
                "flex h-8 w-8 items-center justify-center border text-base font-bold leading-none lg:h-5 lg:w-5 lg:text-xs",
                "disabled:cursor-default",
                state === "aggravated"
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : state === "superficial"
                    ? "border-neutral-950 bg-white text-neutral-950"
                    : "border-neutral-500 bg-white text-transparent",
              ].join(" ")}
            >
              {state === "aggravated"
                ? "×"
                : state === "superficial"
                  ? "/"
                  : "·"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
