"use client";

import type { VtmV5SheetPage } from "@/lib/characters/vtm-v5/editor-draft";
import type { VtmV5SheetData } from "@/lib/characters/vtm-v5/schema";
import BackgroundSheetPage from "./background-sheet-page";
import CoreSheetPage from "./core-sheet-page";
import SheetPageNavigation from "./sheet-page-navigation";

type VtmCharacterSheetProps = {
  isEditing: boolean;
  name: string;
  sheetData: VtmV5SheetData;
  onNameChange: (value: string) => void;
  onChange: (value: VtmV5SheetData) => void;
  activePage: VtmV5SheetPage;
  onPageChange: (page: VtmV5SheetPage) => void;
};

export default function VtmCharacterSheet({
  isEditing,
  name,
  sheetData,
  onNameChange,
  onChange,
  activePage,
  onPageChange,
}: VtmCharacterSheetProps) {
  return (
    <div className="mt-4 flex flex-col gap-4 text-sm">
      <SheetPageNavigation activePage={activePage} onChange={onPageChange} />

      {activePage === "core" ? (
        <CoreSheetPage
          isEditing={isEditing}
          name={name}
          sheetData={sheetData}
          onNameChange={onNameChange}
          onChange={onChange}
        />
      ) : (
        <BackgroundSheetPage
          isEditing={isEditing}
          sheetData={sheetData}
          onChange={onChange}
        />
      )}
    </div>
  );
}
