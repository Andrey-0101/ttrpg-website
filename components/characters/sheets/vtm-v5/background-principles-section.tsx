"use client";

import { useTranslations } from "next-intl";

import type { VtmV5SheetData } from "@/lib/characters/vtm-v5/schema";

type BackgroundPrinciplesSectionProps = {
  isEditing: boolean;
  sheetData: VtmV5SheetData;
  onChange: (value: VtmV5SheetData) => void;
};

function toMultiline(values: string[]): string {
  return values.join("\n");
}

function fromMultiline(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function BackgroundPrinciplesSection({
  isEditing,
  sheetData,
  onChange,
}: BackgroundPrinciplesSectionProps) {
  const translations =
    useTranslations("VtmCharacterSheet");
  const fieldStyle =
    "mt-1 min-h-24 w-full rounded border px-2 py-1.5 text-xs disabled:bg-gray-100 disabled:text-gray-900";

  return (
    <section className="px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-wide">
        {translations("principlesTitle")}
      </h2>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <label>
          {translations("chronicleTenets")}
          <textarea
            value={toMultiline(
              sheetData.chronicleTenets,
            )}
            onChange={(event) =>
              onChange({
                ...sheetData,
                chronicleTenets: fromMultiline(
                  event.target.value,
                ),
              })
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "onePerLinePlaceholder",
            )}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label>
            {translations("touchstones")}
            <textarea
              value={toMultiline(
                sheetData.touchstones,
              )}
              onChange={(event) =>
                onChange({
                  ...sheetData,
                  touchstones: fromMultiline(
                    event.target.value,
                  ),
                })
              }
              disabled={!isEditing}
              className={fieldStyle}
              placeholder={translations(
                "onePerLinePlaceholder",
              )}
            />
          </label>

          <label>
            {translations("convictions")}
            <textarea
              value={toMultiline(
                sheetData.convictions,
              )}
              onChange={(event) =>
                onChange({
                  ...sheetData,
                  convictions: fromMultiline(
                    event.target.value,
                  ),
                })
              }
              disabled={!isEditing}
              className={fieldStyle}
              placeholder={translations(
                "onePerLinePlaceholder",
              )}
            />
          </label>
        </div>

        <label>
          {translations("clanBane")}
          <textarea
            value={sheetData.clanBane}
            onChange={(event) =>
              onChange({
                ...sheetData,
                clanBane: event.target.value,
              })
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "clanBanePlaceholder",
            )}
          />
        </label>
      </div>
    </section>
  );
}
