"use client";

import { useTranslations } from "next-intl";

import type {
  VtmV5DamageTrack,
  VtmV5SheetData,
  VtmV5Trackers,
} from "@/lib/characters/vtm-v5/schema";
import DamageTrack from "./damage-track";

type HealthWillpowerSectionProps = {
  isEditing: boolean;
  attributes: VtmV5SheetData["attributes"];
  trackers: VtmV5SheetData["trackers"];
  onChange: (trackers: VtmV5Trackers) => void;
};

type TrackKey = "health" | "willpower";

export default function HealthWillpowerSection({
  isEditing,
  attributes,
  trackers,
  onChange,
}: HealthWillpowerSectionProps) {
  const translations =
    useTranslations("VtmCharacterSheet");

  const healthMaximum =
    attributes.stamina + 3 + trackers.health.bonus;
  const willpowerMaximum =
    attributes.composure +
    attributes.resolve +
    trackers.willpower.bonus;

  function updateTrack(
    key: TrackKey,
    value: VtmV5DamageTrack,
  ) {
    onChange({
      ...trackers,
      [key]: value,
    });
  }

  return (
    <section className="px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-wide">
        {translations("healthWillpowerTitle")}
      </h2>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <DamageTrack
          label={translations("health")}
          maximum={healthMaximum}
          value={trackers.health}
          isEditing={isEditing}
          onChange={(value) =>
            updateTrack("health", value)
          }
          bonusLabel={translations("bonusBoxes")}
          getBoxLabel={(box, state) =>
            translations("damageBoxLabel", {
              track: translations("health"),
              box,
              state: translations(
                `damageStates.${state}`,
              ),
            })
          }
        />

        <DamageTrack
          label={translations("willpower")}
          maximum={willpowerMaximum}
          value={trackers.willpower}
          isEditing={isEditing}
          onChange={(value) =>
            updateTrack("willpower", value)
          }
          bonusLabel={translations("bonusBoxes")}
          getBoxLabel={(box, state) =>
            translations("damageBoxLabel", {
              track: translations("willpower"),
              box,
              state: translations(
                `damageStates.${state}`,
              ),
            })
          }
        />
      </div>

      <p className="mt-3 text-[11px] text-gray-500">
        {translations("damageTrackHelp")}
      </p>
    </section>
  );
}
