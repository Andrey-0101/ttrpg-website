"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { useTranslations } from "next-intl";

import { createClient } from "@/utils/supabase/client";
import { useUnsavedChangesGuard } from "@/lib/navigation/unsaved-changes";
import {
  getGameSystemTranslationKey,
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
import {
  getCoc7eCharacterDraftKey,
  getCoc7eCharacterPageKey,
  readCoc7eEditorDraft,
  readCoc7eSheetPage,
  removeCoc7eEditorDraft,
  writeCoc7eEditorDraft,
  writeCoc7eSheetPage,
  type Coc7eSheetPage,
} from "@/lib/characters/call-of-cthulhu-7e/editor-draft";
import {
  createDefaultCoc7eSheetData,
  normalizeCoc7eSheetData,
  validateCoc7eSheetData,
} from "@/lib/characters/call-of-cthulhu-7e/schema";
import Coc7eCharacterSheet from "./sheets/call-of-cthulhu-7e/coc7e-character-sheet";
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

type MutationMessage = {
  kind: "status" | "success" | "error" | "info";
  text: string;
} | null;

export default function CharacterEditor({
  character,
  readOnly = false,
}: {
  character: CharacterData;
  readOnly?: boolean;
}) {
  const formTranslations = useTranslations("CharacterForm");
  const translations = useTranslations("CharacterEditor");
  const vtmSheetTranslations = useTranslations("VtmCharacterSheet");
  const cocSheetTranslations = useTranslations("Coc7eCharacterSheet");
  const unsavedTranslations = useTranslations("UnsavedChanges");
  const catalogueTranslations = useTranslations("GameSystemCatalogue");

  const normalizedSystemId = normalizeGameSystemId(character.game_system);
  const gameSystemTranslationKey = getGameSystemTranslationKey(
    character.game_system,
  );
  const gameSystemName = gameSystemTranslationKey
    ? catalogueTranslations(`systems.${gameSystemTranslationKey}.name`)
    : character.game_system;
  const initialVisibility =
    character.visibility === "campaign" || character.visibility === "public"
      ? character.visibility
      : "private";

  const draftStorageKey = useMemo(
    () =>
      normalizedSystemId === "call-of-cthulhu-7e"
        ? getCoc7eCharacterDraftKey(character.id)
        : getCharacterDraftKey(character.id),
    [character.id, normalizedSystemId],
  );
  const pageStorageKey = useMemo(
    () =>
      normalizedSystemId === "call-of-cthulhu-7e"
        ? getCoc7eCharacterPageKey(character.id)
        : getCharacterPageKey(character.id),
    [character.id, normalizedSystemId],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draftReady, setDraftReady] = useState(readOnly);
  const [name, setName] = useState(character.name);
  const [visibility, setVisibility] =
    useState<CharacterVisibility>(initialVisibility);
  const [vtmSheetData, setVtmSheetData] = useState(() =>
    normalizeVtmV5SheetData(character.sheet_data),
  );
  const [vtmActivePage, setVtmActivePage] = useState<VtmV5SheetPage>("core");
  const [cocSheetData, setCocSheetData] = useState(() =>
    normalizeCoc7eSheetData(character.sheet_data),
  );
  const [cocActivePage, setCocActivePage] =
    useState<Coc7eSheetPage>("investigator");
  const [message, setMessage] = useState<MutationMessage>(null);
  const [saving, setSaving] = useState(false);
  const saveLockRef = useRef(false);
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
      sheetData:
        normalizedSystemId === "call-of-cthulhu-7e"
          ? normalizeCoc7eSheetData(character.sheet_data)
          : normalizeVtmV5SheetData(character.sheet_data),
    }),
  );
  const [savedPortraitPath, setSavedPortraitPath] = useState(
    character.portrait_url,
  );
  const [savedVisibility, setSavedVisibility] =
    useState<CharacterVisibility>(initialVisibility);
  const currentSheetData =
    normalizedSystemId === "call-of-cthulhu-7e"
      ? cocSheetData
      : vtmSheetData;
  const currentFormSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        visibility,
        sheetData: currentSheetData,
      }),
    [currentSheetData, name, visibility],
  );
  const currentPortraitPath = portraitRemoved ? null : portraitPath;
  const hasUnsavedPortraitChanges =
    portraitFile !== null || currentPortraitPath !== savedPortraitPath;
  const hasUnsavedChanges =
    !readOnly &&
    draftReady &&
    isEditing &&
    (currentFormSnapshot !== savedFormSnapshot || hasUnsavedPortraitChanges);

  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    confirmMessage: unsavedTranslations("leaveConfirm"),
  });

  useEffect(() => {
    if (readOnly) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      try {
        if (normalizedSystemId === "call-of-cthulhu-7e") {
          const storedPage = readCoc7eSheetPage(pageStorageKey);
          const draft = readCoc7eEditorDraft(draftStorageKey);

          if (draft) {
            setName(draft.name);
            setVisibility(
              draft.visibility === "public" && initialVisibility !== "public"
                ? initialVisibility
                : draft.visibility,
            );
            setCocSheetData(draft.sheetData);
            setCocActivePage(draft.activePage);
            setIsEditing(true);
          } else if (storedPage) {
            setCocActivePage(storedPage);
          }
        } else if (normalizedSystemId === "vtm-v5") {
          const storedPage = readVtmV5SheetPage(pageStorageKey);
          const draft = readVtmV5EditorDraft(draftStorageKey);

          if (draft) {
            setName(draft.name);
            setVisibility(
              draft.visibility === "public" && initialVisibility !== "public"
                ? initialVisibility
                : draft.visibility,
            );
            setVtmSheetData(draft.sheetData);
            setVtmActivePage(draft.activePage);
            setIsEditing(true);
          } else if (storedPage) {
            setVtmActivePage(storedPage);
          }
        }
      } catch {
        // Draft restoration is optional when browser storage is unavailable.
      }

      setDraftReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [
    draftStorageKey,
    initialVisibility,
    normalizedSystemId,
    pageStorageKey,
    readOnly,
  ]);

  useEffect(() => {
    if (readOnly || !draftReady) {
      return;
    }

    if (normalizedSystemId === "call-of-cthulhu-7e") {
      writeCoc7eSheetPage(pageStorageKey, cocActivePage);
    } else if (normalizedSystemId === "vtm-v5") {
      writeVtmV5SheetPage(pageStorageKey, vtmActivePage);
    }
  }, [cocActivePage, draftReady, normalizedSystemId, pageStorageKey, readOnly, vtmActivePage]);

  useEffect(() => {
    if (
      readOnly ||
      !draftReady ||
      !isEditing ||
      (normalizedSystemId !== "vtm-v5" &&
        normalizedSystemId !== "call-of-cthulhu-7e")
    ) {
      return;
    }

    if (normalizedSystemId === "call-of-cthulhu-7e") {
      writeCoc7eEditorDraft(draftStorageKey, {
        version: 1,
        name,
        visibility,
        activePage: cocActivePage,
        sheetData: cocSheetData,
      });
    } else {
      writeVtmV5EditorDraft(draftStorageKey, {
        version: 1,
        name,
        visibility,
        activePage: vtmActivePage,
        sheetData: vtmSheetData,
      });
    }
  }, [
    cocActivePage,
    cocSheetData,
    draftReady,
    draftStorageKey,
    isEditing,
    name,
    normalizedSystemId,
    readOnly,
    visibility,
    vtmActivePage,
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
    if (readOnly) {
      return;
    }

    setPortraitFile(file);
    setPortraitRemoved(false);
    setPortraitPreviewUrl(URL.createObjectURL(file));
  }

  function handlePortraitRemove() {
    if (readOnly) {
      return;
    }

    setPortraitFile(null);
    setPortraitPreviewUrl(null);
    setPortraitRemoved(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (readOnly || saveLockRef.current) {
      return;
    }

    saveLockRef.current = true;
    setSaving(true);
    setMessage({
      kind: "status",
      text: translations("savingStatus"),
    });

    const supabase = createClient();
    const normalizedCocSheetData = normalizeCoc7eSheetData(cocSheetData);
    const sheetDataToSave =
      normalizedSystemId === "call-of-cthulhu-7e"
        ? normalizedCocSheetData
        : normalizedSystemId === "vtm-v5"
          ? normalizeVtmV5SheetData(vtmSheetData)
          : character.sheet_data;

    if (normalizedSystemId === "call-of-cthulhu-7e") {
      const validationErrors = validateCoc7eSheetData(normalizedCocSheetData);
      if (validationErrors.length > 0) {
        setMessage({
          kind: "error",
          text: cocSheetTranslations(`validation.${validationErrors[0]}`),
        });
        saveLockRef.current = false;
        setSaving(false);
        return;
      }
    }
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
          setMessage({
            kind: "error",
            text:
              normalizedSystemId === "call-of-cthulhu-7e"
                ? cocSheetTranslations("portraitUploadError")
                : vtmSheetTranslations("portraitUploadError"),
          });
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

        setMessage({ kind: "error", text: translations("saveError") });
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
      setSavedVisibility(visibility);
      if (normalizedSystemId === "call-of-cthulhu-7e") {
        removeCoc7eEditorDraft(draftStorageKey);
      } else if (normalizedSystemId === "vtm-v5") {
        removeVtmV5EditorDraft(draftStorageKey);
      }
      setMessage({ kind: "success", text: translations("changesSaved") });
      setIsEditing(false);
    } catch (error) {
      console.error(error);

      if (uploadedPortraitPath) {
        await supabase.storage
          .from(CHARACTER_PORTRAIT_BUCKET)
          .remove([uploadedPortraitPath]);
      }

      setMessage({ kind: "error", text: translations("saveError") });
    } finally {
      saveLockRef.current = false;
      setSaving(false);
    }
  }

  function handleClear() {
    if (readOnly || saveLockRef.current) {
      return;
    }

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
      setVtmActivePage("core");
    } else if (normalizedSystemId === "call-of-cthulhu-7e") {
      setCocSheetData(createDefaultCoc7eSheetData());
      setCocActivePage("investigator");
    }

    setMessage({ kind: "info", text: translations("clearNotice") });
  }

  function renderEditorControls() {
    if (readOnly) {
      return null;
    }

    return (
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setIsEditing(true);
          }}
          disabled={isEditing || saving}
          className="w-full rounded border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {translations("edit")}
        </button>

        <button
          type="submit"
          disabled={readOnly || !isEditing || saving}
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
    normalizedSystemId === "vtm-v5"
      ? vtmActivePage === "background"
      : normalizedSystemId === "call-of-cthulhu-7e"
        ? cocActivePage === "story"
        : true;
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
      aria-busy={saving}
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

      {readOnly && (
        <div
          className="mt-4 rounded border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-950"
          role="status"
        >
          {translations("readOnlyNotice")}
        </div>
      )}

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
              disabled={readOnly || !isEditing || saving}
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
            disabled={readOnly || !isEditing || saving}
            className={fieldStyle}
          >
            <option value="private">
              {formTranslations("visibilityPrivate")}
            </option>
            <option value="campaign">
              {formTranslations("visibilityCampaign")}
            </option>
            <option value="public" disabled={savedVisibility !== "public"}>
              {formTranslations(
                savedVisibility === "public"
                  ? "visibilityPublicInactive"
                  : "visibilityPublicUnavailable",
              )}
            </option>
          </select>
          <p className="mt-1 text-xs text-amber-700">
            {formTranslations(
              readOnly
                ? "visibilityReadOnlyHelp"
                : visibility === "private"
                  ? "visibilityOwnerOnlyHelp"
                  : visibility === "campaign"
                    ? "visibilityCampaignHelp"
                    : "visibilityInactiveHelp",
            )}
          </p>
        </label>
      </div>

      {normalizedSystemId === "vtm-v5" ? (
        draftReady ? (
          <VtmCharacterSheet
            isEditing={!readOnly && isEditing && !saving}
            name={name}
            sheetData={vtmSheetData}
            portraitUrl={displayedPortraitUrl}
            hasPortrait={hasPortrait}
            portraitBusy={saving}
            onNameChange={setName}
            onChange={setVtmSheetData}
            onPortraitFileChange={handlePortraitFileChange}
            onPortraitRemove={handlePortraitRemove}
            activePage={vtmActivePage}
            onPageChange={setVtmActivePage}
          />
        ) : (
          <div className="mt-4 min-h-40" />
        )
      ) : normalizedSystemId === "call-of-cthulhu-7e" ? (
        draftReady ? (
          <Coc7eCharacterSheet
            isEditing={!readOnly && isEditing && !saving}
            name={name}
            sheetData={cocSheetData}
            portraitUrl={displayedPortraitUrl}
            hasPortrait={hasPortrait}
            portraitBusy={saving}
            onNameChange={setName}
            onChange={setCocSheetData}
            onPortraitFileChange={handlePortraitFileChange}
            onPortraitRemove={handlePortraitRemove}
            activePage={cocActivePage}
            onPageChange={setCocActivePage}
          />
        ) : (
          <div className="mt-4 min-h-40" />
        )
      ) : (
        <section className="mt-4 rounded-lg border p-4">
          <p>{translations("unsupported")}</p>
        </section>
      )}

      {!readOnly && (
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
      )}

      {message && (
        <div
          className={`mt-3 rounded border px-3 py-2 text-sm ${
            message.kind === "error"
              ? "border-red-500 bg-red-50 text-red-900"
              : message.kind === "success"
                ? "border-green-600 bg-green-50 text-green-900"
                : message.kind === "info"
                  ? "border-amber-500 bg-amber-50 text-amber-950"
                  : "border-blue-500 bg-blue-50 text-blue-950"
          }`}
          role={message.kind === "error" ? "alert" : "status"}
          aria-live={message.kind === "error" ? "assertive" : "polite"}
        >
          {message.text}
        </div>
      )}
    </form>
  );
}
