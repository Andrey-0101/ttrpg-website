"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type {
  VtmV5BloodPotencyDetails,
  VtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";
import RatingDots from "./rating-dots";

type BloodPotencySectionProps = {
  isEditing: boolean;
  sheetData: VtmV5SheetData;
  onChange: (value: VtmV5SheetData) => void;
};

type DetailCellProps = {
  label: string;
  isEditing: boolean;
  children: ReactNode;
  className?: string;
};

function DetailCell({
  label,
  isEditing,
  children,
  className = "",
}: DetailCellProps) {
  return (
    <div className={`min-h-16 px-2 py-1.5 ${className}`}>
      <p className="text-xs italic">{label}</p>
      <div className={isEditing ? "mt-1" : "mt-1 text-xs"}>{children}</div>
    </div>
  );
}

export default function BloodPotencySection({
  isEditing,
  sheetData,
  onChange,
}: BloodPotencySectionProps) {
  const translations = useTranslations("VtmCharacterSheet");
  const fieldStyle =
    "w-full border-0 border-b border-neutral-400 bg-transparent px-1 py-0.5 text-xs text-neutral-950 outline-none focus:border-neutral-900";

  function updateDetails<Key extends keyof VtmV5BloodPotencyDetails>(
    key: Key,
    value: VtmV5BloodPotencyDetails[Key],
  ) {
    onChange({
      ...sheetData,
      bloodPotencyDetails: {
        ...sheetData.bloodPotencyDetails,
        [key]: value,
      },
    });
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 py-2">
        <h2 className="text-sm font-bold italic">
          {translations("bloodPotencyTitle")}
        </h2>

        <RatingDots
          label={translations("bloodPotencyLevel")}
          value={sheetData.trackers.bloodPotency}
          minimum={0}
          maximum={10}
          isEditing={isEditing}
          onChange={(bloodPotency) =>
            onChange({
              ...sheetData,
              trackers: {
                ...sheetData.trackers,
                bloodPotency,
              },
            })
          }
          getButtonLabel={(value) =>
            `${translations("bloodPotencyLevel")}: ${value}`
          }
        />
      </div>

      <div aria-hidden="true" className="h-2 w-full bg-[#b00000]" />

      <div className="grid grid-cols-2">
        <DetailCell
          label={translations("bloodSurge")}
          isEditing={isEditing}
          className="border-r border-b border-neutral-300"
        >
          {isEditing ? (
            <input
              type="number"
              min={0}
              max={10}
              value={sheetData.bloodPotencyDetails.bloodSurge}
              onChange={(event) =>
                updateDetails("bloodSurge", Number(event.target.value))
              }
              className={fieldStyle}
            />
          ) : (
            sheetData.bloodPotencyDetails.bloodSurge
          )}
        </DetailCell>

        <DetailCell
          label={translations("mendAmount")}
          isEditing={isEditing}
          className="border-b border-neutral-300"
        >
          {isEditing ? (
            <input
              value={sheetData.bloodPotencyDetails.mendAmount}
              onChange={(event) =>
                updateDetails("mendAmount", event.target.value)
              }
              className={fieldStyle}
            />
          ) : (
            sheetData.bloodPotencyDetails.mendAmount || "—"
          )}
        </DetailCell>

        <DetailCell
          label={translations("powerBonus")}
          isEditing={isEditing}
          className="border-r border-b border-neutral-300"
        >
          {isEditing ? (
            <input
              type="number"
              min={0}
              max={10}
              value={sheetData.bloodPotencyDetails.powerBonus}
              onChange={(event) =>
                updateDetails("powerBonus", Number(event.target.value))
              }
              className={fieldStyle}
            />
          ) : (
            sheetData.bloodPotencyDetails.powerBonus
          )}
        </DetailCell>

        <DetailCell
          label={translations("rouseReRoll")}
          isEditing={isEditing}
          className="border-b border-neutral-300"
        >
          {isEditing ? (
            <input
              type="number"
              min={0}
              max={10}
              value={sheetData.bloodPotencyDetails.rouseReRoll}
              onChange={(event) =>
                updateDetails("rouseReRoll", Number(event.target.value))
              }
              className={fieldStyle}
            />
          ) : (
            sheetData.bloodPotencyDetails.rouseReRoll
          )}
        </DetailCell>

        <DetailCell
          label={translations("feedingPenalty")}
          isEditing={isEditing}
          className="border-r border-neutral-300"
        >
          {isEditing ? (
            <input
              value={sheetData.bloodPotencyDetails.feedingPenalty}
              onChange={(event) =>
                updateDetails("feedingPenalty", event.target.value)
              }
              className={fieldStyle}
            />
          ) : (
            sheetData.bloodPotencyDetails.feedingPenalty || "—"
          )}
        </DetailCell>

        <DetailCell
          label={translations("baneSeverity")}
          isEditing={isEditing}
        >
          {isEditing ? (
            <input
              type="number"
              min={0}
              max={10}
              value={sheetData.bloodPotencyDetails.baneSeverity}
              onChange={(event) =>
                updateDetails("baneSeverity", Number(event.target.value))
              }
              className={fieldStyle}
            />
          ) : (
            sheetData.bloodPotencyDetails.baneSeverity
          )}
        </DetailCell>
      </div>
    </section>
  );
}
