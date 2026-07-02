"use client";

import type {
  VtmV5AttributeKey,
  VtmV5Discipline,
  VtmV5SheetData,
  VtmV5SkillKey,
} from "@/lib/characters/vtm-v5/schema";
import A4SheetPage from "./a4-sheet-page";
import AttributesSection from "./attributes-section";
import CharacterIdentityCard from "./character-identity-card";
import DisciplinesSection from "./disciplines-section";
import HealthWillpowerSection from "./health-willpower-section";
import SheetSectionDivider from "./sheet-section-divider";
import SkillsSection from "./skills-section";
import TrackersSection from "./trackers-section";

type CoreSheetPageProps = {
  isEditing: boolean;
  name: string;
  sheetData: VtmV5SheetData;
  onNameChange: (value: string) => void;
  onChange: (value: VtmV5SheetData) => void;
};

export default function CoreSheetPage({
  isEditing,
  name,
  sheetData,
  onNameChange,
  onChange,
}: CoreSheetPageProps) {
  function updateAttribute(key: VtmV5AttributeKey, value: number) {
    onChange({
      ...sheetData,
      attributes: {
        ...sheetData.attributes,
        [key]: value,
      },
    });
  }

  function updateSkill(key: VtmV5SkillKey, value: number) {
    onChange({
      ...sheetData,
      skills: {
        ...sheetData.skills,
        [key]: value,
      },
    });
  }

  function updateSkillSpecialties(
    key: VtmV5SkillKey,
    values: string[],
  ) {
    const nextSpecialties = {
      ...sheetData.skillSpecialties,
    };

    if (values.length > 0) {
      nextSpecialties[key] = values;
    } else {
      delete nextSpecialties[key];
    }

    onChange({
      ...sheetData,
      skillSpecialties: nextSpecialties,
    });
  }

  function updateDisciplines(disciplines: VtmV5Discipline[]) {
    onChange({
      ...sheetData,
      disciplines,
    });
  }

  return (
    <A4SheetPage pageNumber={1}>
      <div className="flex min-h-full flex-col overflow-hidden border border-neutral-400 bg-white">
        <CharacterIdentityCard
          isEditing={isEditing}
          name={name}
          identity={sheetData.identity}
          onNameChange={onNameChange}
          onIdentityChange={(identity) =>
            onChange({
              ...sheetData,
              identity,
            })
          }
        />

        <SheetSectionDivider />
        <AttributesSection
          isEditing={isEditing}
          attributes={sheetData.attributes}
          onChange={updateAttribute}
        />

        <SheetSectionDivider />
        <HealthWillpowerSection
          isEditing={isEditing}
          attributes={sheetData.attributes}
          trackers={sheetData.trackers}
          onChange={(trackers) =>
            onChange({
              ...sheetData,
              trackers,
            })
          }
        />

        <SheetSectionDivider />
        <SkillsSection
          isEditing={isEditing}
          skills={sheetData.skills}
          specialties={sheetData.skillSpecialties}
          onSkillChange={updateSkill}
          onSpecialtiesChange={updateSkillSpecialties}
        />

        <SheetSectionDivider />
        <TrackersSection
          isEditing={isEditing}
          trackers={sheetData.trackers}
          onChange={(trackers) =>
            onChange({
              ...sheetData,
              trackers,
            })
          }
        />

        <SheetSectionDivider />
        <div className="flex-1">
          <DisciplinesSection
            isEditing={isEditing}
            disciplines={sheetData.disciplines}
            onChange={updateDisciplines}
          />
        </div>
      </div>
    </A4SheetPage>
  );
}
