"use client";

import type { Coc7eSheetPage } from "@/lib/characters/call-of-cthulhu-7e/editor-draft";
import type { Coc7eSheetData } from "@/lib/characters/call-of-cthulhu-7e/schema";
import Coc7eFanMaterialNotice from "./fan-material-notice";
import Coc7eInvestigatorSheetPage from "./investigator-sheet-page";
import Coc7eSheetPageNavigation from "./sheet-page-navigation";
import Coc7eStorySheetPage from "./story-sheet-page";

export default function Coc7eCharacterSheet({
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
  activePage: Coc7eSheetPage;
  onPageChange: (page: Coc7eSheetPage) => void;
}) {
  return (
    <div className="mt-4 flex min-w-0 flex-col gap-4 text-sm">
      <Coc7eSheetPageNavigation activePage={activePage} onChange={onPageChange} />

      {activePage === "investigator" ? (
        <Coc7eInvestigatorSheetPage
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
        <Coc7eStorySheetPage
          isEditing={isEditing}
          sheetData={sheetData}
          onChange={onChange}
        />
      )}

      <Coc7eFanMaterialNotice />
    </div>
  );
}
