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

export default function TrackersSection({
  isEditing,
  trackers,
  onChange,
}: TrackersSectionProps) {
  const translations = useTranslations("VtmCharacterSheet");

  function updateField<
    Key extends "resonance" | "hunger" | "humanity",
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

      <div className="flex min-w-0 flex-col items-center justify-center px-2 py-2 sm:px-3">
        <h3 className="text-sm font-bold italic leading-none">
          {translations("humanity")}
        </h3>
        <div className="mt-1 max-w-full overflow-x-auto">
          <RatingDots
            label={translations("humanity")}
            value={trackers.humanity}
            minimum={0}
            maximum={10}
            isEditing={isEditing}
            onChange={(value) => updateField("humanity", value)}
            getButtonLabel={(value) =>
              translations("setRating", {
                name: translations("humanity"),
                value,
              })
            }
          />
        </div>
      </div>
    </section>
  );
}
