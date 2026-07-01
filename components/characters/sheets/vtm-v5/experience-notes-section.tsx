"use client";

import { useTranslations } from "next-intl";

import type { VtmV5SheetData } from "@/lib/characters/vtm-v5/schema";

type ExperienceNotesSectionProps = {
  isEditing: boolean;
  sheetData: VtmV5SheetData;
  onChange: (value: VtmV5SheetData) => void;
};

export default function ExperienceNotesSection({
  isEditing,
  sheetData,
  onChange,
}: ExperienceNotesSectionProps) {
  const translations =
    useTranslations("VtmCharacterSheet");
  const fieldStyle =
    "mt-1 w-full rounded border px-2 py-1.5 text-xs disabled:bg-gray-100 disabled:text-gray-900";

  return (
    <section className="px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-wide">
        {translations("experienceNotesTitle")}
      </h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          {translations("totalExperience")}
          <input
            type="number"
            min={0}
            max={9999}
            value={sheetData.experience.total}
            onChange={(event) =>
              onChange({
                ...sheetData,
                experience: {
                  ...sheetData.experience,
                  total: Number(
                    event.target.value,
                  ),
                },
              })
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label>
          {translations("spentExperience")}
          <input
            type="number"
            min={0}
            max={9999}
            value={sheetData.experience.spent}
            onChange={(event) =>
              onChange({
                ...sheetData,
                experience: {
                  ...sheetData.experience,
                  spent: Number(
                    event.target.value,
                  ),
                },
              })
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label className="sm:col-span-2">
          {translations("notes")}
          <textarea
            value={sheetData.notes}
            onChange={(event) =>
              onChange({
                ...sheetData,
                notes: event.target.value,
              })
            }
            disabled={!isEditing}
            className={`${fieldStyle} min-h-32`}
          />
        </label>
      </div>
    </section>
  );
}
