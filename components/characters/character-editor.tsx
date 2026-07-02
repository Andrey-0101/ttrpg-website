"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useTranslations } from "next-intl";

import { createClient } from "@/utils/supabase/client";
import {
  getGameSystemName,
  normalizeGameSystemId,
} from "@/lib/characters/game-systems";
import {
  getCharacterDraftKey,
  getCharacterPageKey,
  readVtmV5EditorDraft,
  readVtmV5SheetPage,
  removeVtmV5EditorDraft,
  writeVtmV5EditorDraft,
  writeVtmV5SheetPage,
  type VtmV5DraftVisibility,
  type VtmV5SheetPage,
} from "@/lib/characters/vtm-v5/editor-draft";
import {
  createDefaultVtmV5SheetData,
  normalizeVtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";
import VtmCharacterSheet from "./sheets/vtm-v5/vtm-character-sheet";
import type { Database } from "@/types/database.types";

type CharacterRow = Database["public"]["Tables"]["characters"]["Row"];

type CharacterData = Pick<
  CharacterRow,
  "id" | "name" | "game_system" | "visibility" | "sheet_data"
>;

type CharacterVisibility = VtmV5DraftVisibility;

export default function CharacterEditor({
  character,
}: {
  character: CharacterData;
}) {
  const formTranslations = useTranslations("CharacterForm");
  const translations = useTranslations("CharacterEditor");

  const normalizedSystemId = normalizeGameSystemId(character.game_system);
  const gameSystemName = getGameSystemName(character.game_system);
  const initialVisibility =
    character.visibility === "campaign" || character.visibility === "public"
      ? character.visibility
      : "private";

  const draftStorageKey = useMemo(
    () => getCharacterDraftKey(character.id),
    [character.id],
  );
  const pageStorageKey = useMemo(
    () => getCharacterPageKey(character.id),
    [character.id],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [name, setName] = useState(character.name);
  const [visibility, setVisibility] =
    useState<CharacterVisibility>(initialVisibility);
  const [vtmSheetData, setVtmSheetData] = useState(() =>
    normalizeVtmV5SheetData(character.sheet_data),
  );
  const [activePage, setActivePage] = useState<VtmV5SheetPage>("core");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (normalizedSystemId !== "vtm-v5") {
      setDraftReady(true);
      return;
    }

    const storedPage = readVtmV5SheetPage(pageStorageKey);
    const draft = readVtmV5EditorDraft(draftStorageKey);

    if (draft) {
      setName(draft.name);
      setVisibility(draft.visibility);
      setVtmSheetData(draft.sheetData);
      setActivePage(draft.activePage);
      setIsEditing(true);
    } else if (storedPage) {
      setActivePage(storedPage);
    }

    setDraftReady(true);
  }, [draftStorageKey, normalizedSystemId, pageStorageKey]);

  useEffect(() => {
    if (!draftReady || normalizedSystemId !== "vtm-v5") {
      return;
    }

    writeVtmV5SheetPage(pageStorageKey, activePage);
  }, [activePage, draftReady, normalizedSystemId, pageStorageKey]);

  useEffect(() => {
    if (!draftReady || !isEditing || normalizedSystemId !== "vtm-v5") {
      return;
    }

    writeVtmV5EditorDraft(draftStorageKey, {
      version: 1,
      name,
      visibility,
      activePage,
      sheetData: vtmSheetData,
    });
  }, [
    activePage,
    draftReady,
    draftStorageKey,
    isEditing,
    name,
    normalizedSystemId,
    visibility,
    vtmSheetData,
  ]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const sheetDataToSave =
      normalizedSystemId === "vtm-v5" ? vtmSheetData : character.sheet_data;

    const { error } = await supabase
      .from("characters")
      .update({
        name,
        visibility,
        sheet_data: sheetDataToSave,
        updated_at: new Date().toISOString(),
      })
      .eq("id", character.id);

    if (error) {
      console.error(error);
      setMessage(translations("saveError"));
      setSaving(false);
      return;
    }

    removeVtmV5EditorDraft(draftStorageKey);
    setMessage(translations("changesSaved"));
    setSaving(false);
    setIsEditing(false);
  }

  function handleClear() {
    const confirmed = window.confirm(translations("clearConfirm"));

    if (!confirmed) {
      return;
    }

    setName("");
    setVisibility("private");

    if (normalizedSystemId === "vtm-v5") {
      setVtmSheetData(createDefaultVtmV5SheetData());
      setActivePage("core");
    }

    setMessage(translations("clearNotice"));
  }

  function renderEditorControls() {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setIsEditing(true);
          }}
          disabled={isEditing || saving}
          className="rounded border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {translations("edit")}
        </button>

        <button
          type="submit"
          disabled={!isEditing || saving}
          className="rounded border bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? translations("saving") : translations("save")}
        </button>
      </div>
    );
  }

  const fieldStyle =
    "mt-1 w-full rounded border px-2 py-1.5 disabled:bg-gray-100 disabled:text-gray-900";
  const showExternalNameField =
    normalizedSystemId !== "vtm-v5" || activePage === "background";

  return (
    <form onSubmit={handleSave} className="mt-6 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400">
            {translations("sheetTitle")}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{gameSystemName}</h1>
        </div>

        {renderEditorControls()}
      </div>

      <div
        className={`mt-4 grid gap-3 ${
          showExternalNameField
            ? "md:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)]"
            : "md:grid-cols-[minmax(12rem,1fr)] md:justify-end"
        }`}
      >
        {showExternalNameField && (
          <label>
            {formTranslations("characterName")}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!isEditing}
              className={fieldStyle}
              required
            />
          </label>
        )}

        <label className="md:max-w-sm md:justify-self-end md:w-full">
          {formTranslations("visibility")}
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as CharacterVisibility)
            }
            disabled={!isEditing}
            className={fieldStyle}
          >
            <option value="private">
              {formTranslations("visibilityPrivate")}
            </option>
            <option value="campaign">
              {formTranslations("visibilityCampaign")}
            </option>
            <option value="public">
              {formTranslations("visibilityPublic")}
            </option>
          </select>
        </label>
      </div>

      {normalizedSystemId === "vtm-v5" ? (
        draftReady ? (
          <VtmCharacterSheet
            isEditing={isEditing}
            name={name}
            sheetData={vtmSheetData}
            onNameChange={setName}
            onChange={setVtmSheetData}
            activePage={activePage}
            onPageChange={setActivePage}
          />
        ) : (
          <div className="mt-4 min-h-40" />
        )
      ) : (
        <section className="mt-4 rounded-lg border p-4">
          <p>{translations("unsupported")}</p>
        </section>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {renderEditorControls()}

        <button
          type="button"
          onClick={handleClear}
          disabled={!isEditing || saving}
          className="rounded border border-orange-600 px-4 py-2 text-sm text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {translations("clear")}
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
