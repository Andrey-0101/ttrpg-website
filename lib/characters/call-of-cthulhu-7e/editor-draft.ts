import type { Json } from "@/types/database.types";

import {
  normalizeCoc7eSheetData,
  type Coc7eSheetData,
} from "./schema";

export type Coc7eSheetPage = "investigator" | "story";
export type Coc7eDraftVisibility = "private" | "campaign" | "public";

export type Coc7eEditorDraft = {
  version: 1;
  name: string;
  visibility: Coc7eDraftVisibility;
  activePage: Coc7eSheetPage;
  sheetData: Coc7eSheetData;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getSessionStorage(): StorageLike | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isVisibility(value: unknown): value is Coc7eDraftVisibility {
  return value === "private" || value === "campaign" || value === "public";
}

function isSheetPage(value: unknown): value is Coc7eSheetPage {
  return value === "investigator" || value === "story";
}

export function getCoc7eCharacterDraftKey(characterId: string): string {
  return `ttrpg-website:call-of-cthulhu-7e:character:${characterId}:draft`;
}

export function getNewCoc7eCharacterDraftKey(): string {
  return "ttrpg-website:call-of-cthulhu-7e:new:draft";
}

export function getCoc7eCharacterPageKey(characterId: string): string {
  return `ttrpg-website:call-of-cthulhu-7e:character:${characterId}:page`;
}

export function getNewCoc7eCharacterPageKey(): string {
  return "ttrpg-website:call-of-cthulhu-7e:new:page";
}

export function readCoc7eSheetPage(storageKey: string): Coc7eSheetPage | null {
  try {
    const value = getSessionStorage()?.getItem(storageKey);
    return isSheetPage(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeCoc7eSheetPage(
  storageKey: string,
  page: Coc7eSheetPage,
): void {
  try {
    getSessionStorage()?.setItem(storageKey, page);
  } catch {
    // Page persistence is optional when browser storage is unavailable.
  }
}

export function readCoc7eEditorDraft(
  storageKey: string,
): Coc7eEditorDraft | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  try {
    const storedValue = storage.getItem(storageKey);
    if (!storedValue) {
      return null;
    }

    const parsed: unknown = JSON.parse(storedValue);
    if (
      !isObject(parsed) ||
      parsed.version !== 1 ||
      typeof parsed.name !== "string" ||
      !isVisibility(parsed.visibility) ||
      !isSheetPage(parsed.activePage) ||
      !("sheetData" in parsed)
    ) {
      storage.removeItem(storageKey);
      return null;
    }

    return {
      version: 1,
      name: parsed.name,
      visibility: parsed.visibility,
      activePage: parsed.activePage,
      sheetData: normalizeCoc7eSheetData(parsed.sheetData as Json),
    };
  } catch {
    storage.removeItem(storageKey);
    return null;
  }
}

export function writeCoc7eEditorDraft(
  storageKey: string,
  draft: Coc7eEditorDraft,
): void {
  try {
    getSessionStorage()?.setItem(storageKey, JSON.stringify(draft));
  } catch {
    // Draft persistence is optional when browser storage is unavailable.
  }
}

export function removeCoc7eEditorDraft(storageKey: string): void {
  try {
    getSessionStorage()?.removeItem(storageKey);
  } catch {
    // Draft persistence is optional when browser storage is unavailable.
  }
}
