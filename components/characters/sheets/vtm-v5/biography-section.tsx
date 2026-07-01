"use client";

import { useTranslations } from "next-intl";

import type {
  VtmV5Biography,
  VtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";

type BiographySectionProps = {
  isEditing: boolean;
  biography: VtmV5SheetData["biography"];
  onChange: (biography: VtmV5Biography) => void;
};

export default function BiographySection({
  isEditing,
  biography,
  onChange,
}: BiographySectionProps) {
  const translations =
    useTranslations("VtmCharacterSheet");
  const fieldStyle =
    "mt-1 w-full rounded border px-2 py-1.5 text-xs disabled:bg-gray-100 disabled:text-gray-900";

  function updateField<
    Key extends keyof VtmV5Biography,
  >(
    key: Key,
    value: VtmV5Biography[Key],
  ) {
    onChange({
      ...biography,
      [key]: value,
    });
  }

  return (
    <section className="px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-wide">
        {translations("biographyTitle")}
      </h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          {translations("trueAge")}
          <input
            value={biography.trueAge}
            onChange={(event) =>
              updateField(
                "trueAge",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label>
          {translations("apparentAge")}
          <input
            value={biography.apparentAge}
            onChange={(event) =>
              updateField(
                "apparentAge",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label>
          {translations("dateOfBirth")}
          <input
            value={biography.dateOfBirth}
            onChange={(event) =>
              updateField(
                "dateOfBirth",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label>
          {translations("dateOfDeath")}
          <input
            value={biography.dateOfDeath}
            onChange={(event) =>
              updateField(
                "dateOfDeath",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          />
        </label>

        <label className="sm:col-span-2">
          {translations("appearance")}
          <textarea
            value={biography.appearance}
            onChange={(event) =>
              updateField(
                "appearance",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={`${fieldStyle} min-h-20`}
          />
        </label>

        <label className="sm:col-span-2">
          {translations(
            "distinguishingFeatures",
          )}
          <textarea
            value={
              biography.distinguishingFeatures
            }
            onChange={(event) =>
              updateField(
                "distinguishingFeatures",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={`${fieldStyle} min-h-20`}
          />
        </label>

        <label className="sm:col-span-2">
          {translations("history")}
          <textarea
            value={biography.history}
            onChange={(event) =>
              updateField(
                "history",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={`${fieldStyle} min-h-32`}
          />
        </label>
      </div>
    </section>
  );
}
