"use client";

import { useTranslations } from "next-intl";

import type { VtmV5SheetData } from "@/lib/characters/vtm-v5/schema";

type ExperienceNotesSectionProps = {
  isEditing: boolean;
  sheetData: VtmV5SheetData;
  onChange: (value: VtmV5SheetData) => void;
  className?: string;
};

export function ExperienceSection({
  isEditing,
  sheetData,
  onChange,
  className = "",
}: ExperienceNotesSectionProps) {
  const translations = useTranslations("VtmCharacterSheet");
  const inputStyle =
    "min-w-0 flex-1 border-0 bg-transparent px-2 py-1 text-right text-xs text-neutral-950 outline-none focus:bg-neutral-50";

  return (
    <section className={className}>
      <label className="flex min-h-9 items-center border-b border-neutral-400 px-2">
        <span className="text-xs font-bold italic">
          {translations("totalExperience")}
        </span>
        {isEditing ? (
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
                  total: Number(event.target.value),
                },
              })
            }
            className={inputStyle}
          />
        ) : (
          <span className="ml-auto px-2 text-xs">
            {sheetData.experience.total}
          </span>
        )}
      </label>

      <label className="flex min-h-9 items-center border-b border-neutral-400 px-2">
        <span className="text-xs font-bold italic">
          {translations("spentExperience")}
        </span>
        {isEditing ? (
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
                  spent: Number(event.target.value),
                },
              })
            }
            className={inputStyle}
          />
        ) : (
          <span className="ml-auto px-2 text-xs">
            {sheetData.experience.spent}
          </span>
        )}
      </label>
    </section>
  );
}

export function NotesSection({
  isEditing,
  sheetData,
  onChange,
  className = "",
}: ExperienceNotesSectionProps) {
  const translations = useTranslations("VtmCharacterSheet");

  return (
    <section className={`flex min-h-0 flex-col ${className}`}>
      <h2 className="px-2 pt-1.5 text-xs font-medium">
        {translations("notes")}
      </h2>

      {isEditing ? (
        <label className="flex min-h-0 flex-1 flex-col">
          <span className="sr-only">{translations("notes")}</span>
          <textarea
            value={sheetData.notes}
            onChange={(event) =>
              onChange({
                ...sheetData,
                notes: event.target.value,
              })
            }
            className="min-h-32 flex-1 resize-y border-0 bg-transparent px-2 py-1.5 text-xs leading-relaxed text-neutral-950 outline-none focus:bg-neutral-50"
          />
        </label>
      ) : (
        <p className="min-h-32 flex-1 whitespace-pre-wrap px-2 py-1.5 text-xs leading-relaxed">
          {sheetData.notes.trim() || "—"}
        </p>
      )}
    </section>
  );
}

export default function ExperienceNotesSection(
  props: ExperienceNotesSectionProps,
) {
  return (
    <div className={props.className}>
      <ExperienceSection {...props} className="" />
      <NotesSection {...props} className="min-h-40" />
    </div>
  );
}
