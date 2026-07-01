"use client";

import { useTranslations } from "next-intl";

import type {
  VtmV5SheetData,
  VtmV5Trackers,
} from "@/lib/characters/vtm-v5/schema";

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
  const translations =
    useTranslations("VtmCharacterSheet");
  const fieldStyle =
    "mt-1 w-full rounded border px-2 py-1.5 text-xs disabled:bg-gray-100 disabled:text-gray-900";

  function updateField<
    Key extends
      | "resonance"
      | "hunger"
      | "humanity",
  >(
    key: Key,
    value: VtmV5Trackers[Key],
  ) {
    onChange({
      ...trackers,
      [key]: value,
    });
  }

  return (
    <section className="px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-wide">
        {translations("trackersTitle")}
      </h2>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label>
          {translations("resonance")}
          <input
            value={trackers.resonance}
            onChange={(event) =>
              updateField(
                "resonance",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "resonancePlaceholder",
            )}
          />
        </label>

        <label>
          {translations("hunger")}
          <select
            value={trackers.hunger}
            onChange={(event) =>
              updateField(
                "hunger",
                Number(event.target.value),
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          >
            {[0, 1, 2, 3, 4, 5].map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          {translations("humanity")}
          <select
            value={trackers.humanity}
            onChange={(event) =>
              updateField(
                "humanity",
                Number(event.target.value),
              )
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
      </div>
    </section>
  );
}
