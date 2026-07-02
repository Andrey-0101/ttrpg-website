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
  portraitUrl: string | null;
  hasPortrait: boolean;
  portraitBusy?: boolean;
  onNameChange: (value: string) => void;
  onChange: (value: VtmV5SheetData) => void;
  onPortraitFileChange?: (file: File) => void;
  onPortraitRemove?: () => void;
  activePage: VtmV5SheetPage;
  onPageChange: (page: VtmV5SheetPage) => void;
};

export default function VtmCharacterSheet({
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
          portraitUrl={portraitUrl}
          hasPortrait={hasPortrait}
          portraitBusy={portraitBusy}
          onNameChange={onNameChange}
          onChange={onChange}
          onPortraitFileChange={onPortraitFileChange}
          onPortraitRemove={onPortraitRemove}
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
