"use client";

import { useTranslations } from "next-intl";

import {
  updateCoc7eCharacteristic,
  type Coc7eSheetData,
} from "@/lib/characters/call-of-cthulhu-7e/schema";
import Coc7eCharacteristicsSection from "./characteristics-section";
import Coc7eCombatSection from "./combat-section";
import Coc7eDerivedStatusSection from "./derived-status-section";
import Coc7eIdentitySection from "./identity-section";
import Coc7eSheetPage from "./sheet-page";
import { SectionHeading } from "./sheet-fields";
import Coc7eSkillsSection from "./skills-section";

export default function Coc7eInvestigatorSheetPage({
  isEditing,
  name,
  sheetData,
  portraitUrl,
  hasPortrait,
  portraitBusy = false,
  onNameChange,
  onChange,
  onPortraitFileChange,
  onPortraitRemove,
}: {
  isEditing: boolean;
  name: string;
  sheetData: Coc7eSheetData;
  portraitUrl: string | null;
  hasPortrait: boolean;
  portraitBusy?: boolean;
  onNameChange: (value: string) => void;
  onChange: (value: Coc7eSheetData) => void;
  onPortraitFileChange?: (file: File) => void;
  onPortraitRemove?: () => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");

  return (
    <Coc7eSheetPage pageNumber={1}>
      <div className="flex min-h-full min-w-0 flex-col border border-neutral-400 bg-white">
        <Coc7eIdentitySection
          isEditing={isEditing}
          name={name}
          identity={sheetData.identity}
          portraitUrl={portraitUrl}
          hasPortrait={hasPortrait}
          portraitBusy={portraitBusy}
          onNameChange={onNameChange}
          onIdentityChange={(identity) => onChange({ ...sheetData, identity })}
          onPortraitFileChange={onPortraitFileChange}
          onPortraitRemove={onPortraitRemove}
        />

        <SectionHeading>{translations("characteristics.title")}</SectionHeading>
        <Coc7eCharacteristicsSection
          isEditing={isEditing}
          sheetData={sheetData}
          onChange={(key, value) =>
            onChange(updateCoc7eCharacteristic(sheetData, key, value))
          }
        />

        <Coc7eDerivedStatusSection
          isEditing={isEditing}
          sheetData={sheetData}
          onChange={onChange}
        />

        <SectionHeading>{translations("skills.title")}</SectionHeading>
        <Coc7eSkillsSection
          isEditing={isEditing}
          sheetData={sheetData}
          onChange={onChange}
        />

        <SectionHeading>{translations("combat.title")}</SectionHeading>
        <Coc7eCombatSection
          isEditing={isEditing}
          sheetData={sheetData}
          onChange={onChange}
        />
      </div>
    </Coc7eSheetPage>
  );
}
