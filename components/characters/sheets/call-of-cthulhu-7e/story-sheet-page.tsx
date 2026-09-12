"use client";

import { useTranslations } from "next-intl";

import type { Coc7eSheetData } from "@/lib/characters/call-of-cthulhu-7e/schema";
import Coc7eSheetPage from "./sheet-page";
import { SectionHeading, TextAreaField, TextField } from "./sheet-fields";

type BackstoryKey = keyof Coc7eSheetData["backstory"];

const BACKSTORY_COLUMNS: readonly (readonly BackstoryKey[])[] = [
  [
    "personalDescription",
    "ideologyBeliefs",
    "significantPeople",
    "meaningfulLocations",
    "treasuredPossessions",
  ],
  [
    "traits",
    "injuriesScars",
    "phobiasManias",
    "arcaneTomesSpells",
    "encountersWithStrangeEntities",
  ],
];

export default function Coc7eStorySheetPage({
  isEditing,
  sheetData,
  onChange,
}: {
  isEditing: boolean;
  sheetData: Coc7eSheetData;
  onChange: (value: Coc7eSheetData) => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");

  return (
    <Coc7eSheetPage pageNumber={2}>
      <div className="flex min-h-full flex-col border border-neutral-400 bg-white">
        <SectionHeading>{translations("story.title")}</SectionHeading>
        <div className="p-2 sm:p-3">
          <TextAreaField
            label={translations("story.label")}
            value={sheetData.story}
            onChange={(story) => onChange({ ...sheetData, story })}
            disabled={!isEditing}
            rows={8}
          />
        </div>

        <SectionHeading>{translations("backstory.title")}</SectionHeading>
        <div className="grid flex-1 gap-3 p-2 sm:p-3 lg:grid-cols-2">
          {BACKSTORY_COLUMNS.map((column, columnIndex) => (
            <div key={columnIndex} className="grid content-stretch gap-2">
              {column.map((key) => (
                <TextAreaField
                  key={key}
                  label={translations(`backstory.${key}`)}
                  value={sheetData.backstory[key]}
                  onChange={(value) =>
                    onChange({
                      ...sheetData,
                      backstory: { ...sheetData.backstory, [key]: value },
                    })
                  }
                  disabled={!isEditing}
                  rows={3}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="grid border-t border-neutral-400 lg:grid-cols-2">
          <div className="p-2 sm:p-3 lg:border-r lg:border-neutral-400">
            <TextAreaField
              label={translations("gearAndPossessions")}
              value={sheetData.gearAndPossessions}
              onChange={(gearAndPossessions) =>
                onChange({ ...sheetData, gearAndPossessions })
              }
              disabled={!isEditing}
              rows={6}
            />
          </div>
          <fieldset className="grid content-start gap-2 border-t border-neutral-400 p-2 sm:p-3 lg:border-t-0">
            <legend className="sr-only">{translations("wealth.title")}</legend>
            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-700">
              {translations("wealth.title")}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextField
                label={translations("wealth.spendingLevel")}
                value={sheetData.wealth.spendingLevel}
                onChange={(spendingLevel) =>
                  onChange({
                    ...sheetData,
                    wealth: { ...sheetData.wealth, spendingLevel },
                  })
                }
                disabled={!isEditing}
              />
              <TextField
                label={translations("wealth.cash")}
                value={sheetData.wealth.cash}
                onChange={(cash) =>
                  onChange({
                    ...sheetData,
                    wealth: { ...sheetData.wealth, cash },
                  })
                }
                disabled={!isEditing}
              />
            </div>
            <TextAreaField
              label={translations("wealth.assets")}
              value={sheetData.wealth.assets}
              onChange={(assets) =>
                onChange({
                  ...sheetData,
                  wealth: { ...sheetData.wealth, assets },
                })
              }
              disabled={!isEditing}
              rows={5}
            />
          </fieldset>
        </div>
      </div>
    </Coc7eSheetPage>
  );
}
