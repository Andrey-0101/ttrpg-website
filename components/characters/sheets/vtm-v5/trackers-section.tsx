"use client";

import { useTranslations } from "next-intl";

import type {
  VtmV5SheetData,
  VtmV5Trackers,
} from "@/lib/characters/vtm-v5/schema";
import RatingDots from "./rating-dots";

type TrackersSectionProps = {
  isEditing: boolean;
  trackers: VtmV5SheetData["trackers"];
  onChange: (trackers: VtmV5Trackers) => void;
};

type TrackerStepperProps = {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  isEditing: boolean;
  onChange: (value: number) => void;
};

function TrackerStepper({
  label,
  value,
  minimum,
  maximum,
  isEditing,
  onChange,
}: TrackerStepperProps) {
  const translations = useTranslations("VtmCharacterSheet");

  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="text-[11px] font-semibold text-neutral-700">
        {label}: {value}
      </span>

      {isEditing && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(Math.max(minimum, value - 1))}
            disabled={value <= minimum}
            aria-label={translations("decreaseTracker", { name: label })}
            className="flex h-5 w-5 items-center justify-center rounded border border-neutral-500 text-xs leading-none disabled:cursor-not-allowed disabled:opacity-35"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.min(maximum, value + 1))}
            disabled={value >= maximum}
            aria-label={translations("increaseTracker", { name: label })}
            className="flex h-5 w-5 items-center justify-center rounded border border-neutral-500 text-xs leading-none disabled:cursor-not-allowed disabled:opacity-35"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

function HumanityStainsTrack({
  humanity,
  stains,
}: {
  humanity: number;
  stains: number;
}) {
  const openPositions = Math.max(0, 10 - humanity);
  const visibleStains = Math.min(stains, openPositions);
  const overflowStains = Math.max(0, stains - visibleStains);

  return (
    <div
      className="flex shrink-0 items-center gap-1"
      aria-hidden="true"
    >
      {Array.from({ length: 10 }, (_, index) => {
        const position = index + 1;
        const isHumanity = position <= humanity;
        const isStain =
          !isHumanity && position > 10 - visibleStains;

        return (
          <span
            key={position}
            className={[
              "relative flex h-4 w-4 items-center justify-center rounded-full border text-[11px] font-bold leading-none",
              isHumanity
                ? "border-neutral-950 bg-neutral-950 text-white"
                : isStain
                  ? "border-red-700 bg-white text-red-700"
                  : "border-neutral-500 bg-white text-transparent",
            ].join(" ")}
          >
            {isStain ? "/" : "•"}
          </span>
        );
      })}

      {overflowStains > 0 && (
        <span className="ml-0.5 text-[10px] font-semibold text-red-700">
          +{overflowStains}
        </span>
      )}
    </div>
  );
}

export default function TrackersSection({
  isEditing,
  trackers,
  onChange,
}: TrackersSectionProps) {
  const translations = useTranslations("VtmCharacterSheet");

  function updateField<
    Key extends "resonance" | "hunger" | "humanity" | "stains",
  >(key: Key, value: VtmV5Trackers[Key]) {
    onChange({
      ...trackers,
      [key]: value,
    });
  }

  return (
    <section className="grid md:grid-cols-[2fr_1fr_2fr]">
      <label className="min-w-0 px-2 py-2 sm:px-3">
        <span className="block text-sm font-bold italic leading-none">
          {translations("resonance")}
        </span>
        <input
          value={trackers.resonance}
          onChange={(event) =>
            updateField("resonance", event.target.value)
          }
          disabled={!isEditing}
          className="mt-1 w-full border-0 border-b border-neutral-500 bg-transparent px-0 py-0.5 text-xs text-neutral-950 outline-none placeholder:text-neutral-400 disabled:cursor-default disabled:opacity-100"
          placeholder={translations("resonancePlaceholder")}
        />
      </label>

      <div className="flex min-w-0 flex-col items-center justify-center border-y border-neutral-400 px-2 py-2 md:border-x md:border-y-0">
        <h3 className="text-sm font-bold italic leading-none">
          {translations("hunger")}
        </h3>
        <div className="mt-1">
          <RatingDots
            label={translations("hunger")}
            value={trackers.hunger}
            minimum={0}
            maximum={5}
            isEditing={isEditing}
            onChange={(value) => updateField("hunger", value)}
            getButtonLabel={(value) =>
              translations("setRating", {
                name: translations("hunger"),
                value,
              })
            }
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center gap-1 px-2 py-2 sm:px-3">
        <h3 className="text-sm font-bold italic leading-none">
          {translations("humanity")}
        </h3>

        <div
          className="max-w-full overflow-x-auto"
          role="img"
          aria-label={translations("humanityStainsSummary", {
            humanity: trackers.humanity,
            stains: trackers.stains,
          })}
        >
          <HumanityStainsTrack
            humanity={trackers.humanity}
            stains={trackers.stains}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          <TrackerStepper
            label={translations("humanity")}
            value={trackers.humanity}
            minimum={0}
            maximum={10}
            isEditing={isEditing}
            onChange={(value) => updateField("humanity", value)}
          />
          <TrackerStepper
            label={translations("stains")}
            value={trackers.stains}
            minimum={0}
            maximum={10}
            isEditing={isEditing}
            onChange={(value) => updateField("stains", value)}
          />
        </div>
      </div>
    </section>
  );
}
