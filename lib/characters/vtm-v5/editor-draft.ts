import type { Json } from "@/types/database.types";
import {
  normalizeVtmV5SheetData,
  type VtmV5SheetData,
} from "./schema";

export type VtmV5SheetPage = "core" | "background";

export type VtmV5DraftVisibility =
  | "private"
  | "campaign"
  | "public";

export type VtmV5EditorDraft = {
  version: 1;
  name: string;
  visibility: VtmV5DraftVisibility;
  activePage: VtmV5SheetPage;
  sheetData: VtmV5SheetData;
};

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isVisibility(
  value: unknown,
): value is VtmV5DraftVisibility {
  return (
    value === "private" ||
    value === "campaign" ||
    value === "public"
  );
}

function isSheetPage(
  value: unknown,
): value is VtmV5SheetPage {
  return value === "core" || value === "background";
}

export function getCharacterDraftKey(
  characterId: string,
): string {
  return `ttrpg-website:vtm-v5:character:${characterId}:draft`;
}

export function getNewCharacterDraftKey(
  systemId: string,
): string {
  return `ttrpg-website:vtm-v5:new:${systemId}:draft`;
}

export function getCharacterPageKey(
  characterId: string,
): string {
  return `ttrpg-website:vtm-v5:character:${characterId}:page`;
}

export function getNewCharacterPageKey(
  systemId: string,
): string {
  return `ttrpg-website:vtm-v5:new:${systemId}:page`;
}

export function readVtmV5SheetPage(
  storageKey: string,
): VtmV5SheetPage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue =
      window.sessionStorage.getItem(storageKey);

    return isSheetPage(storedValue)
      ? storedValue
      : null;
  } catch {
    return null;
  }
}

export function writeVtmV5SheetPage(
  storageKey: string,
  page: VtmV5SheetPage,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      storageKey,
      page,
    );
  } catch {
    // Page persistence is optional when browser storage is unavailable.
  }
}

export function readVtmV5EditorDraft(
  storageKey: string,
): VtmV5EditorDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue =
      window.sessionStorage.getItem(storageKey);

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
      window.sessionStorage.removeItem(storageKey);
      return null;
    }

    return {
      version: 1,
      name: parsed.name,
      visibility: parsed.visibility,
      activePage: parsed.activePage,
      sheetData: normalizeVtmV5SheetData(
        parsed.sheetData as Json,
      ),
    };
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
}

export function writeVtmV5EditorDraft(
  storageKey: string,
  draft: VtmV5EditorDraft,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify(draft),
    );
  } catch {
    // Draft persistence is optional when browser storage is unavailable.
  }
}

export function removeVtmV5EditorDraft(
  storageKey: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Draft persistence is optional when browser storage is unavailable.
  }
}
