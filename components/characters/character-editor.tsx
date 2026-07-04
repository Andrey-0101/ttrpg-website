"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useTranslations } from "next-intl";

import { createClient } from "@/utils/supabase/client";
import { useUnsavedChangesGuard } from "@/lib/navigation/unsaved-changes";
import {
  getGameSystemName,
  normalizeGameSystemId,
} from "@/lib/characters/game-systems";
import {
  CHARACTER_PORTRAIT_BUCKET,
  CHARACTER_PORTRAIT_SIGNED_URL_TTL,
  createCharacterPortraitPath,
  isCharacterPortraitStoragePath,
} from "@/lib/characters/portrait";
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
  "id" | "name" | "game_system" | "visibility" | "sheet_data" | "portrait_url"
> & {
  portraitSignedUrl: string | null;
};

type CharacterVisibility = VtmV5DraftVisibility;

export default function CharacterEditor({
  character,
}: {
  character: CharacterData;
}) {
  const formTranslations = useTranslations("CharacterForm");
  const translations = useTranslations("CharacterEditor");
  const sheetTranslations = useTranslations("VtmCharacterSheet");
  const unsavedTranslations = useTranslations("UnsavedChanges");

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
  const [portraitPath, setPortraitPath] = useState(character.portrait_url);
  const [portraitUrl, setPortraitUrl] = useState(character.portraitSignedUrl);
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(
    null,
  );
  const [portraitRemoved, setPortraitRemoved] = useState(false);
  const [savedFormSnapshot, setSavedFormSnapshot] = useState(() =>
    JSON.stringify({
      name: character.name,
      visibility: initialVisibility,
      sheetData: normalizeVtmV5SheetData(character.sheet_data),
    }),
  );
  const [savedPortraitPath, setSavedPortraitPath] = useState(
    character.portrait_url,
  );
  const currentFormSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        visibility,
        sheetData: vtmSheetData,
      }),
    [name, visibility, vtmSheetData],
  );
  const currentPortraitPath = portraitRemoved ? null : portraitPath;
  const hasUnsavedPortraitChanges =
    portraitFile !== null || currentPortraitPath !== savedPortraitPath;
  const hasUnsavedChanges =
    draftReady &&
    isEditing &&
    (currentFormSnapshot !== savedFormSnapshot || hasUnsavedPortraitChanges);

  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    confirmMessage: unsavedTranslations("leaveConfirm"),
  });

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

  useEffect(() => {
    return () => {
      if (portraitPreviewUrl) {
        URL.revokeObjectURL(portraitPreviewUrl);
      }
    };
  }, [portraitPreviewUrl]);

  function handlePortraitFileChange(file: File) {
    setPortraitFile(file);
    setPortraitRemoved(false);
    setPortraitPreviewUrl(URL.createObjectURL(file));
  }

  function handlePortraitRemove() {
    setPortraitFile(null);
    setPortraitPreviewUrl(null);
    setPortraitRemoved(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const sheetDataToSave =
      normalizedSystemId === "vtm-v5" ? vtmSheetData : character.sheet_data;
    let uploadedPortraitPath: string | null = null;
    let nextPortraitPath = portraitRemoved ? null : portraitPath;

    try {
      if (portraitFile) {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData.user) {
          throw new Error(
            "Authenticated user is required for portrait upload.",
          );
        }

        uploadedPortraitPath = createCharacterPortraitPath(
          userData.user.id,
          character.id,
          portraitFile,
        );

        const { error: uploadError } = await supabase.storage
          .from(CHARACTER_PORTRAIT_BUCKET)
          .upload(uploadedPortraitPath, portraitFile, {
            cacheControl: "3600",
            contentType: portraitFile.type,
            upsert: false,
          });

        if (uploadError) {
          console.error(uploadError);
          setMessage(sheetTranslations("portraitUploadError"));
          return;
        }

        nextPortraitPath = uploadedPortraitPath;
      }

      const { error } = await supabase
        .from("characters")
        .update({
          name,
          visibility,
          sheet_data: sheetDataToSave,
          portrait_url: nextPortraitPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", character.id);

      if (error) {
        console.error(error);

        if (uploadedPortraitPath) {
          await supabase.storage
            .from(CHARACTER_PORTRAIT_BUCKET)
            .remove([uploadedPortraitPath]);
        }

        setMessage(translations("saveError"));
        return;
      }

      if (
        isCharacterPortraitStoragePath(portraitPath) &&
        portraitPath !== nextPortraitPath
      ) {
        const { error: removalError } = await supabase.storage
          .from(CHARACTER_PORTRAIT_BUCKET)
          .remove([portraitPath]);

        if (removalError) {
          console.error("Failed to remove the old portrait:", removalError);
        }
      }

      if (uploadedPortraitPath) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(CHARACTER_PORTRAIT_BUCKET)
          .createSignedUrl(
            uploadedPortraitPath,
            CHARACTER_PORTRAIT_SIGNED_URL_TTL,
          );

        if (signedError) {
          console.error(signedError);
        } else {
          setPortraitUrl(signedData.signedUrl);
          setPortraitPreviewUrl(null);
        }
      } else if (portraitRemoved) {
        setPortraitUrl(null);
        setPortraitPreviewUrl(null);
      }

      setPortraitPath(nextPortraitPath);
      setPortraitFile(null);
      setPortraitRemoved(false);
      setSavedFormSnapshot(currentFormSnapshot);
      setSavedPortraitPath(nextPortraitPath);
      removeVtmV5EditorDraft(draftStorageKey);
      setMessage(translations("changesSaved"));
      setIsEditing(false);
    } catch (error) {
      console.error(error);

      if (uploadedPortraitPath) {
        await supabase.storage
          .from(CHARACTER_PORTRAIT_BUCKET)
          .remove([uploadedPortraitPath]);
      }

      setMessage(translations("saveError"));
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    const confirmed = window.confirm(translations("clearConfirm"));

    if (!confirmed) {
      return;
    }

    setName("");
    setVisibility("private");
    setPortraitFile(null);
    setPortraitPreviewUrl(null);
    setPortraitRemoved(true);

    if (normalizedSystemId === "vtm-v5") {
      setVtmSheetData(createDefaultVtmV5SheetData());
      setActivePage("core");
    }

    setMessage(translations("clearNotice"));
  }

  function renderEditorControls() {
    return (
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setIsEditing(true);
          }}
          disabled={isEditing || saving}
          className="w-full rounded border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {translations("edit")}
        </button>

        <button
          type="submit"
          disabled={!isEditing || saving}
          className="w-full rounded border bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
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
  const displayedPortraitUrl = portraitRemoved
    ? null
    : (portraitPreviewUrl ?? portraitUrl);
  const hasPortrait = Boolean(
    !portraitRemoved && (portraitFile || portraitPath || displayedPortraitUrl),
  );

  return (
    <form
      onSubmit={handleSave}
      className="mt-6 min-w-0 rounded-lg border p-2 sm:p-4"
    >
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400">
            {translations("sheetTitle")}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{gameSystemName}</h1>
        </div>

        {renderEditorControls()}
      </div>

      {hasUnsavedChanges && (
        <div
          className="mt-4 rounded border border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
          aria-live="polite"
        >
          <p>{unsavedTranslations("status")}</p>
          {hasUnsavedPortraitChanges && (
            <p className="mt-1">{unsavedTranslations("portraitStatus")}</p>
          )}
        </div>
      )}

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
            portraitUrl={displayedPortraitUrl}
            hasPortrait={hasPortrait}
            portraitBusy={saving}
            onNameChange={setName}
            onChange={setVtmSheetData}
            onPortraitFileChange={handlePortraitFileChange}
            onPortraitRemove={handlePortraitRemove}
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

      <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {renderEditorControls()}

        <button
          type="button"
          onClick={handleClear}
          disabled={!isEditing || saving}
          className="w-full rounded border border-orange-600 px-4 py-2 text-sm text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
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
