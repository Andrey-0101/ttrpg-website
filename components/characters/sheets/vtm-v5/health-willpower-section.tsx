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
  const translations = useTranslations("VtmCharacterSheet");

  const healthMaximum =
    attributes.stamina + 3 + trackers.health.bonus;
  const willpowerMaximum =
    attributes.composure +
    attributes.resolve +
    trackers.willpower.bonus;

  function updateTrack(key: TrackKey, value: VtmV5DamageTrack) {
    onChange({
      ...trackers,
      [key]: value,
    });
  }

  return (
    <section className="grid lg:grid-cols-2">
      <div className="border-b border-neutral-400 lg:border-r lg:border-b-0 lg:border-neutral-400">
        <DamageTrack
          label={translations("health")}
          maximum={healthMaximum}
          value={trackers.health}
          isEditing={isEditing}
          onChange={(value) => updateTrack("health", value)}
          bonusLabel={translations("bonusBoxes")}
          getBoxLabel={(box, state) =>
            translations("damageBoxLabel", {
              track: translations("health"),
              box,
              state: translations(`damageStates.${state}`),
            })
          }
        />
      </div>

      <DamageTrack
        label={translations("willpower")}
        maximum={willpowerMaximum}
        value={trackers.willpower}
        isEditing={isEditing}
        onChange={(value) => updateTrack("willpower", value)}
        bonusLabel={translations("bonusBoxes")}
        getBoxLabel={(box, state) =>
          translations("damageBoxLabel", {
            track: translations("willpower"),
            box,
            state: translations(`damageStates.${state}`),
          })
        }
      />
    </section>
  );
}
