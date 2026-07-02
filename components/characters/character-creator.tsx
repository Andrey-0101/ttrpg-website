"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { GAME_SYSTEMS, type GameSystemId } from "@/lib/characters/game-systems";
import {
  CHARACTER_PORTRAIT_BUCKET,
  createCharacterPortraitPath,
} from "@/lib/characters/portrait";
import {
  getNewCharacterDraftKey,
  getNewCharacterPageKey,
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
  type VtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";
import VtmCharacterSheet from "./sheets/vtm-v5/vtm-character-sheet";

type CharacterCreatorProps = {
  systemId: GameSystemId;
};

type CharacterVisibility = VtmV5DraftVisibility;

export default function CharacterCreator({ systemId }: CharacterCreatorProps) {
  const translations = useTranslations("CharacterForm");
  const sheetTranslations = useTranslations("VtmCharacterSheet");
  const router = useRouter();
  const gameSystem = GAME_SYSTEMS[systemId];

  const draftStorageKey = useMemo(
    () => getNewCharacterDraftKey(systemId),
    [systemId],
  );
  const pageStorageKey = useMemo(
    () => getNewCharacterPageKey(systemId),
    [systemId],
  );

  const [draftReady, setDraftReady] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<CharacterVisibility>("private");
  const [vtmSheetData, setVtmSheetData] = useState<VtmV5SheetData>(() =>
    createDefaultVtmV5SheetData(),
  );
  const [activePage, setActivePage] = useState<VtmV5SheetPage>("core");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (systemId !== "vtm-v5") {
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
    } else if (storedPage) {
      setActivePage(storedPage);
    }

    setDraftReady(true);
  }, [draftStorageKey, pageStorageKey, systemId]);

  useEffect(() => {
    if (!draftReady || systemId !== "vtm-v5") {
      return;
    }

    writeVtmV5SheetPage(pageStorageKey, activePage);
  }, [activePage, draftReady, pageStorageKey, systemId]);

  useEffect(() => {
    if (!draftReady || systemId !== "vtm-v5") {
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
    name,
    systemId,
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
    setPortraitPreviewUrl(URL.createObjectURL(file));
  }

  function handlePortraitRemove() {
    setPortraitFile(null);
    setPortraitPreviewUrl(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");

    const supabase = createClient();
    let newCharacterId: string | null = null;
    let uploadedPortraitPath: string | null = null;

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push("/login");
        return;
      }

      const sheetData =
        systemId === "vtm-v5"
          ? vtmSheetData
          : {
              schemaVersion: 1,
            };

      const { data: newCharacter, error } = await supabase
        .from("characters")
        .insert({
          owner_id: userData.user.id,
          name,
          game_system: systemId,
          visibility,
          sheet_data: sheetData,
        })
        .select("id")
        .single();

      if (error || !newCharacter) {
        console.error(error);
        setMessage(translations("createError"));
        return;
      }

      newCharacterId = newCharacter.id;

      if (portraitFile) {
        uploadedPortraitPath = createCharacterPortraitPath(
          userData.user.id,
          newCharacter.id,
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
          await supabase.from("characters").delete().eq("id", newCharacter.id);
          setMessage(sheetTranslations("portraitUploadError"));
          return;
        }

        const { error: portraitUpdateError } = await supabase
          .from("characters")
          .update({
            portrait_url: uploadedPortraitPath,
            updated_at: new Date().toISOString(),
          })
          .eq("id", newCharacter.id);

        if (portraitUpdateError) {
          console.error(portraitUpdateError);
          await supabase.storage
            .from(CHARACTER_PORTRAIT_BUCKET)
            .remove([uploadedPortraitPath]);
          await supabase.from("characters").delete().eq("id", newCharacter.id);
          setMessage(translations("createError"));
          return;
        }
      }

      removeVtmV5EditorDraft(draftStorageKey);
      router.push(`/characters/${newCharacter.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);

      if (uploadedPortraitPath) {
        await supabase.storage
          .from(CHARACTER_PORTRAIT_BUCKET)
          .remove([uploadedPortraitPath]);
      }

      if (newCharacterId) {
        await supabase.from("characters").delete().eq("id", newCharacterId);
      }

      setMessage(translations("createError"));
    } finally {
      setCreating(false);
    }
  }

  const fieldStyle = "mt-1 w-full rounded border px-2 py-1.5";
  const showExternalNameField =
    systemId !== "vtm-v5" || activePage === "background";

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <section className="rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              {translations("generalInformation")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {translations("gameSystem")}: <strong>{gameSystem.name}</strong>
            </p>
          </div>
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
              {translations("characterName")}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldStyle}
                required
              />
            </label>
          )}

          <label className="md:max-w-sm md:justify-self-end md:w-full">
            {translations("visibility")}
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as CharacterVisibility)
              }
              className={fieldStyle}
            >
              <option value="private">
                {translations("visibilityPrivate")}
              </option>
              <option value="campaign">
                {translations("visibilityCampaign")}
              </option>
              <option value="public">{translations("visibilityPublic")}</option>
            </select>
          </label>
        </div>
      </section>

      {systemId === "vtm-v5" && draftReady && (
        <VtmCharacterSheet
          isEditing={true}
          name={name}
          sheetData={vtmSheetData}
          portraitUrl={portraitPreviewUrl}
          hasPortrait={Boolean(portraitFile)}
          portraitBusy={creating}
          onNameChange={setName}
          onChange={setVtmSheetData}
          onPortraitFileChange={handlePortraitFileChange}
          onPortraitRemove={handlePortraitRemove}
          activePage={activePage}
          onPageChange={setActivePage}
        />
      )}

      <button
        type="submit"
        disabled={creating}
        className="mt-4 rounded bg-black px-5 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {creating ? translations("creating") : translations("create")}
      </button>

      {message && (
        <p className="mt-3 text-sm" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
