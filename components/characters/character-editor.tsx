"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import {
  getGameSystemName,
  normalizeGameSystemId,
} from "@/lib/characters/game-systems";
import ShortDescriptionField from "./short-description-field";
import VtmCharacterSheet from "./sheets/vtm-v5/vtm-character-sheet";
import type { Database, Json } from "@/types/database.types";

type CharacterRow =
  Database["public"]["Tables"]["characters"]["Row"];

type CharacterData = Pick<
  CharacterRow,
  | "id"
  | "name"
  | "game_system"
  | "description"
  | "visibility"
  | "sheet_data"
>;

type JsonObject = {
  [key: string]: Json | undefined;
};

function isJsonObject(value: Json): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

type CharacterVisibility =
  | "private"
  | "campaign"
  | "public";

export default function CharacterEditor({
  character,
}: {
  character: CharacterData;
}) {
  const formTranslations =
    useTranslations("CharacterForm");

  const translations =
    useTranslations("CharacterEditor");

  const initialSheetData = isJsonObject(character.sheet_data)
    ? character.sheet_data
    : {};

  const initialClan =
    typeof initialSheetData.clan === "string"
      ? initialSheetData.clan
      : "";

  const initialHunger =
    typeof initialSheetData.hunger === "number"
      ? initialSheetData.hunger
      : 1;

  const normalizedSystemId = normalizeGameSystemId(
    character.game_system
  );

  const gameSystemName = getGameSystemName(
    character.game_system
  );

  const initialVisibility =
    character.visibility === "campaign" ||
    character.visibility === "public"
      ? character.visibility
      : "private";

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(character.name);

  const [description, setDescription] = useState(
    character.description ?? ""
  );

  const [visibility, setVisibility] =
    useState<CharacterVisibility>(
      initialVisibility
    );

  const [clan, setClan] = useState(initialClan);
  const [hunger, setHunger] = useState(initialHunger);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("characters")
      .update({
        name,
        description,
        visibility,
        sheet_data: {
          ...initialSheetData,
          clan,
          hunger,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", character.id);

    if (error) {
      console.error(error);
      setMessage(translations("saveError"));
      setSaving(false);
      return;
    }

    setMessage(translations("changesSaved"));
    setSaving(false);
    setIsEditing(false);
  }

  function handleClear() {
    const confirmed = window.confirm(
      translations("clearConfirm")
    );

    if (!confirmed) {
      return;
    }

    setName("");
    setDescription("");
    setVisibility("private");
    setClan("");
    setHunger(1);

    setMessage(translations("clearNotice"));
  }

  function renderEditorControls() {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setIsEditing(true);
          }}
          disabled={isEditing || saving}
          className="rounded border px-6 py-3 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {translations("edit")}
        </button>

        <button
          type="submit"
          disabled={!isEditing || saving}
          className="rounded border bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? translations("saving")
            : translations("save")}
        </button>
      </div>
    );
  }

  const fieldStyle =
    "mt-1 w-full rounded border p-3 disabled:bg-gray-100 disabled:text-gray-900";

  return (
    <form
      onSubmit={handleSave}
      className="mt-8 rounded-lg border p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wider text-gray-400">
            {translations("sheetTitle")}
          </p>

          <h1 className="mt-1 text-4xl font-bold">
            {gameSystemName}
          </h1>
        </div>

        {renderEditorControls()}
      </div>

      <div className="mt-8 flex flex-col gap-5">
        <label>
          {formTranslations("characterName")}

          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            disabled={!isEditing}
            className={fieldStyle}
            required
          />
        </label>

        <ShortDescriptionField
          value={description}
          onChange={setDescription}
          disabled={!isEditing}
        />

        <label>
          {formTranslations("visibility")}

          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(
                event.target
                  .value as CharacterVisibility
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          >
            <option value="private">
              {formTranslations(
                "visibilityPrivate"
              )}
            </option>

            <option value="campaign">
              {formTranslations(
                "visibilityCampaign"
              )}
            </option>

            <option value="public">
              {formTranslations(
                "visibilityPublic"
              )}
            </option>
          </select>
        </label>
      </div>

      {normalizedSystemId === "vtm-v5" ? (
        <VtmCharacterSheet
          isEditing={isEditing}
          clan={clan}
          hunger={hunger}
          onClanChange={setClan}
          onHungerChange={setHunger}
        />
      ) : (
        <section className="mt-8 rounded-lg border p-6">
          <p>{translations("unsupported")}</p>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        {renderEditorControls()}

        <button
          type="button"
          onClick={handleClear}
          disabled={!isEditing || saving}
          className="rounded border border-orange-600 px-6 py-3 text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {translations("clear")}
        </button>
      </div>

      {message && (
        <p className="mt-4" role="status">
          {message}
        </p>
      )}
    </form>
  );
}