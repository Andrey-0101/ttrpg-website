"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  getGameSystemName,
  normalizeGameSystemId,
} from "@/lib/characters/game-systems";
import ShortDescriptionField from "./short-description-field";
import VtmCharacterSheet from "./sheets/vtm-v5/vtm-character-sheet";

type CharacterData = {
  id: string;
  name: string;
  game_system: string;
  description: string | null;
  visibility: string;
  sheet_data: Record<string, unknown>;
};

type VtmSheetData = {
  clan?: string;
  hunger?: number;
};

export default function CharacterEditor({
  character,
}: {
  character: CharacterData;
}) {
  const initialSheetData = character.sheet_data as VtmSheetData;

  const normalizedSystemId = normalizeGameSystemId(
    character.game_system
  );

  const gameSystemName = getGameSystemName(
    character.game_system
  );

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(character.name);
  const [description, setDescription] = useState(
    character.description ?? ""
  );
  const [visibility, setVisibility] = useState(
    character.visibility
  );

  const [clan, setClan] = useState(
    initialSheetData.clan ?? ""
  );
  const [hunger, setHunger] = useState(
    initialSheetData.hunger ?? 1
  );

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
          ...character.sheet_data,
          clan,
          hunger,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", character.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Changes saved.");
    setSaving(false);
    setIsEditing(false);
  }

  function handleClear() {
    const confirmed = window.confirm(
      "Clear all character fields? The changes will not be saved until you click Save Changes."
    );

    if (!confirmed) {
      return;
    }

    setName("");
    setDescription("");
    setVisibility("private");
    setClan("");
    setHunger(1);

    setMessage(
      "The form has been cleared. Click Save Changes to save the empty values."
    );
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
          Edit
        </button>

        <button
          type="submit"
          disabled={!isEditing || saving}
          className="rounded border bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Changes"}
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
            Character Sheet
          </p>

          <h1 className="mt-1 text-4xl font-bold">
            {gameSystemName}
          </h1>
        </div>

        {renderEditorControls()}
      </div>

      <div className="mt-8 flex flex-col gap-5">
        <label>
          Character name

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!isEditing}
            className={fieldStyle}
            required
          />
        </label>

        <label>
          Description

          <ShortDescriptionField
            value={description}
            onChange={setDescription}
            disabled={!isEditing}
          />
        </label>

        <label>
          Visibility

          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value)
            }
            disabled={!isEditing}
            className={fieldStyle}
          >
            <option value="private">Private</option>
            <option value="campaign">
              Campaign members
            </option>
            <option value="public">Public</option>
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
          <p>
            A character sheet for this game is not
            available yet.
          </p>
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
          Clear Form
        </button>
      </div>

      {message && <p className="mt-4">{message}</p>}
    </form>
  );
}