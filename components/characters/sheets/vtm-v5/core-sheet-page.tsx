"use client";

import type {
  VtmV5AttributeKey,
  VtmV5Discipline,
  VtmV5SheetData,
  VtmV5SkillKey,
} from "@/lib/characters/vtm-v5/schema";
import AttributesSection from "./attributes-section";
import DisciplinesSection from "./disciplines-section";
import HealthWillpowerSection from "./health-willpower-section";
import IdentitySection from "./identity-section";
import SkillsSection from "./skills-section";
import TrackersSection from "./trackers-section";

type CoreSheetPageProps = {
  isEditing: boolean;
  sheetData: VtmV5SheetData;
  onChange: (value: VtmV5SheetData) => void;
};

export default function CoreSheetPage({
  isEditing,
  sheetData,
  onChange,
}: CoreSheetPageProps) {
  function updateAttribute(
    key: VtmV5AttributeKey,
    value: number,
  ) {
    onChange({
      ...sheetData,
      attributes: {
        ...sheetData.attributes,
        [key]: value,
      },
    });
  }

  function updateSkill(
    key: VtmV5SkillKey,
    value: number,
  ) {
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

  function updateDisciplines(
    disciplines: VtmV5Discipline[],
  ) {
    onChange({
      ...sheetData,
      disciplines,
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <IdentitySection
        isEditing={isEditing}
        identity={sheetData.identity}
        onChange={(identity) =>
          onChange({
            ...sheetData,
            identity,
          })
        }
      />

      <div className="border-t">
        <AttributesSection
          isEditing={isEditing}
          attributes={sheetData.attributes}
          onChange={updateAttribute}
        />
      </div>

      <div className="grid border-t xl:grid-cols-2">
        <div className="border-b xl:border-b-0 xl:border-r">
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
        </div>

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
      </div>

      <div className="border-t">
        <SkillsSection
          isEditing={isEditing}
          skills={sheetData.skills}
          specialties={sheetData.skillSpecialties}
          onSkillChange={updateSkill}
          onSpecialtiesChange={
            updateSkillSpecialties
          }
        />
      </div>

      <div className="border-t">
        <DisciplinesSection
          isEditing={isEditing}
          disciplines={sheetData.disciplines}
          onChange={updateDisciplines}
        />
      </div>
    </div>
  );
}
