"use client";

import type {
  VtmV5Advantage,
  VtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";
import AdvantagesSection from "./advantages-section";
import BackgroundPrinciplesSection from "./background-principles-section";
import BiographySection from "./biography-section";
import BloodPotencySection from "./blood-potency-section";
import ExperienceNotesSection from "./experience-notes-section";

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
  function updateAdvantages(
    advantages: VtmV5Advantage[],
  ) {
    onChange({
      ...sheetData,
      advantages,
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <BackgroundPrinciplesSection
        isEditing={isEditing}
        sheetData={sheetData}
        onChange={onChange}
      />

      <div className="grid border-t xl:grid-cols-2">
        <div className="border-b xl:border-b-0 xl:border-r">
          <AdvantagesSection
            isEditing={isEditing}
            advantages={sheetData.advantages}
            onChange={updateAdvantages}
          />
        </div>

        <BloodPotencySection
          isEditing={isEditing}
          sheetData={sheetData}
          onChange={onChange}
        />
      </div>

      <div className="grid border-t xl:grid-cols-2">
        <div className="border-b xl:border-b-0 xl:border-r">
          <ExperienceNotesSection
            isEditing={isEditing}
            sheetData={sheetData}
            onChange={onChange}
          />
        </div>

        <BiographySection
          isEditing={isEditing}
          biography={sheetData.biography}
          onChange={(biography) =>
            onChange({
              ...sheetData,
              biography,
            })
          }
        />
      </div>
    </div>
  );
}
