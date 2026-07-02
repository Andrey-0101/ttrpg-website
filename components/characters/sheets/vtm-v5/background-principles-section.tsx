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

function combineTouchstonesAndConvictions(
  touchstones: string[],
  convictions: string[],
): string[] {
  return [...touchstones, ...convictions];
}

function DisplayText({ value }: { value: string }) {
  return (
    <p className="min-h-24 whitespace-pre-wrap px-3 py-2 text-xs leading-relaxed">
      {value.trim() || "—"}
    </p>
  );
}

export default function BackgroundPrinciplesSection({
  isEditing,
  sheetData,
  onChange,
}: BackgroundPrinciplesSectionProps) {
  const translations = useTranslations("VtmCharacterSheet");
  const editorStyle =
    "min-h-32 w-full resize-y border-0 bg-transparent px-3 py-2 text-xs leading-relaxed text-neutral-950 outline-none focus:bg-neutral-50";
  const combinedTouchstonesAndConvictions = toMultiline(
    combineTouchstonesAndConvictions(
      sheetData.touchstones,
      sheetData.convictions,
    ),
  );

  return (
    <section className="grid min-h-[13rem] md:grid-cols-3">
      <div className="flex min-h-48 flex-col border-b border-neutral-300 md:border-r md:border-b-0">
        <h2 className="px-3 pt-2 text-center text-sm font-medium">
          {translations("chronicleTenets")}
        </h2>

        {isEditing ? (
          <label className="flex flex-1 flex-col">
            <span className="sr-only">
              {translations("chronicleTenets")}
            </span>
            <textarea
              value={toMultiline(sheetData.chronicleTenets)}
              onChange={(event) =>
                onChange({
                  ...sheetData,
                  chronicleTenets: fromMultiline(event.target.value),
                })
              }
              className={`${editorStyle} flex-1`}
              placeholder={translations("onePerLinePlaceholder")}
            />
          </label>
        ) : (
          <DisplayText value={toMultiline(sheetData.chronicleTenets)} />
        )}
      </div>

      <div className="flex min-h-48 flex-col border-b border-neutral-300 md:border-r md:border-b-0">
        <h2 className="px-3 pt-2 text-center text-sm font-medium">
          {translations("touchstonesAndConvictions")}
        </h2>

        {isEditing ? (
          <label className="flex flex-1 flex-col">
            <span className="sr-only">
              {translations("touchstonesAndConvictions")}
            </span>
            <textarea
              value={combinedTouchstonesAndConvictions}
              onChange={(event) =>
                onChange({
                  ...sheetData,
                  touchstones: fromMultiline(event.target.value),
                  convictions: [],
                })
              }
              className={`${editorStyle} flex-1`}
              placeholder={translations("onePerLinePlaceholder")}
            />
          </label>
        ) : (
          <DisplayText value={combinedTouchstonesAndConvictions} />
        )}
      </div>

      <div className="flex min-h-48 flex-col">
        <h2 className="px-3 pt-2 text-center text-sm font-medium">
          {translations("clanBane")}
        </h2>

        {isEditing ? (
          <label className="flex flex-1 flex-col">
            <span className="sr-only">{translations("clanBane")}</span>
            <textarea
              value={sheetData.clanBane}
              onChange={(event) =>
                onChange({
                  ...sheetData,
                  clanBane: event.target.value,
                })
              }
              className={`${editorStyle} flex-1`}
              placeholder={translations("clanBanePlaceholder")}
            />
          </label>
        ) : (
          <DisplayText value={sheetData.clanBane} />
        )}
      </div>
    </section>
  );
}
