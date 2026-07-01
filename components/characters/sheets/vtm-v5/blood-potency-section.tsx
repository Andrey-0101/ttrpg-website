"use client";

import { useTranslations } from "next-intl";

import type {
  VtmV5BloodPotencyDetails,
  VtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";

type BloodPotencySectionProps = {
  isEditing: boolean;
  sheetData: VtmV5SheetData;
  onChange: (value: VtmV5SheetData) => void;
};

export default function BloodPotencySection({
  isEditing,
  sheetData,
  onChange,
}: BloodPotencySectionProps) {
  const translations =
    useTranslations("VtmCharacterSheet");
  const fieldStyle =
    "mt-1 w-full rounded border px-2 py-1.5 text-xs disabled:bg-gray-100 disabled:text-gray-900";

  function updateDetails<
    Key extends keyof VtmV5BloodPotencyDetails,
  >(
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
    <section className="px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-wide">
        {translations("bloodPotencyTitle")}
      </h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          {translations("bloodPotencyLevel")}
          <select
            value={sheetData.trackers.bloodPotency}
            onChange={(event) =>
              onChange({
                ...sheetData,
                trackers: {
                  ...sheetData.trackers,
                  bloodPotency: Number(
                    event.target.value,
                  ),
                },
              })
            }
            disabled={!isEditing}
            className={fieldStyle}
          >
            {Array.from(
              { length: 11 },
              (_, index) => index,
            ).map((value) => (
              <option
                key={value}
                value={value}
              >
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          {translations("bloodSurge")}
          <input
            type="number"
            min={0}
            max={10}
            value={
              sheetData.bloodPotencyDetails
                .bloodSurge
            }
            onChange={(event) =>
              updateDetails(
                "bloodSurge",
                Number(event.target.value),
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label>
          {translations("mendAmount")}
          <input
            value={
              sheetData.bloodPotencyDetails
                .mendAmount
            }
            onChange={(event) =>
              updateDetails(
                "mendAmount",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label>
          {translations("powerBonus")}
          <input
            type="number"
            min={0}
            max={10}
            value={
              sheetData.bloodPotencyDetails
                .powerBonus
            }
            onChange={(event) =>
              updateDetails(
                "powerBonus",
                Number(event.target.value),
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label>
          {translations("rouseReRoll")}
          <input
            type="number"
            min={0}
            max={10}
            value={
              sheetData.bloodPotencyDetails
                .rouseReRoll
            }
            onChange={(event) =>
              updateDetails(
                "rouseReRoll",
                Number(event.target.value),
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label>
          {translations("feedingPenalty")}
          <input
            value={
              sheetData.bloodPotencyDetails
                .feedingPenalty
            }
            onChange={(event) =>
              updateDetails(
                "feedingPenalty",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label>
          {translations("baneSeverity")}
          <input
            type="number"
            min={0}
            max={10}
            value={
              sheetData.bloodPotencyDetails
                .baneSeverity
            }
            onChange={(event) =>
              updateDetails(
                "baneSeverity",
                Number(event.target.value),
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>
      </div>
    </section>
  );
}
