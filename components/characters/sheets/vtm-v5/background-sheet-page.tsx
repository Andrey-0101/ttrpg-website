"use client";

import type {
  VtmV5Advantage,
  VtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";
import A4SheetPage from "./a4-sheet-page";
import AdvantagesSection from "./advantages-section";
import BackgroundPrinciplesSection from "./background-principles-section";
import BiographySection from "./biography-section";
import BloodPotencySection from "./blood-potency-section";
import {
  ExperienceSection,
  NotesSection,
} from "./experience-notes-section";
import SheetSectionDivider from "./sheet-section-divider";

type BackgroundSheetPageProps = {
  isEditing: boolean;
  sheetData: VtmV5SheetData;
  onChange: (value: VtmV5SheetData) => void;
};

export default function BackgroundSheetPage({
  isEditing,
  sheetData,
  onChange,
}: BackgroundSheetPageProps) {
  function updateAdvantages(advantages: VtmV5Advantage[]) {
    onChange({
      ...sheetData,
      advantages,
    });
  }

  return (
    <A4SheetPage pageNumber={2}>
      <div className="flex min-h-full flex-col overflow-hidden border-x border-t border-neutral-400 bg-white">
        <BackgroundPrinciplesSection
          isEditing={isEditing}
          sheetData={sheetData}
          onChange={onChange}
        />

        <SheetSectionDivider />

        <div className="grid flex-1 md:min-h-[47rem] md:grid-cols-2">
          <div className="grid border-b border-neutral-400 md:grid-rows-[minmax(24rem,3fr)_minmax(14rem,2fr)] md:border-r md:border-b-0">
            <AdvantagesSection
              isEditing={isEditing}
              advantages={sheetData.advantages}
              onChange={updateAdvantages}
            />

            <NotesSection
              isEditing={isEditing}
              sheetData={sheetData}
              onChange={onChange}
              className="border-t border-neutral-400"
            />
          </div>

          <div className="flex min-h-0 flex-col">
            <BloodPotencySection
              isEditing={isEditing}
              sheetData={sheetData}
              onChange={onChange}
            />

            <SheetSectionDivider />

            <ExperienceSection
              isEditing={isEditing}
              sheetData={sheetData}
              onChange={onChange}
            />

            <BiographySection
              isEditing={isEditing}
              biography={sheetData.biography}
              onChange={(biography) =>
                onChange({
                  ...sheetData,
                  biography,
                })
              }
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </A4SheetPage>
  );
}
