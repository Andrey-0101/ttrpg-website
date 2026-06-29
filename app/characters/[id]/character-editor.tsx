"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";
import VtmCharacterSheet from "./sheets/vtm-character-sheet";

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

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(character.name);
  const [gameSystem, setGameSystem] = useState(character.game_system);
  const [description, setDescription] = useState(
    character.description ?? ""
  );
  const [visibility, setVisibility] = useState(character.visibility);

  const [clan, setClan] = useState(initialSheetData.clan ?? "");
  const [hunger, setHunger] = useState(initialSheetData.hunger ?? 1);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("characters")
      .update({
        name,
        game_system: gameSystem,
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

  const fieldStyle =
    "mt-1 w-full rounded border p-3 disabled:bg-gray-100 disabled:text-gray-900";

  return (
    <form onSubmit={handleSave} className="mt-8 rounded-lg border p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">Character Sheet</h1>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setMessage("");
              setIsEditing(true);
            }}
            className="rounded bg-black px-6 py-3 text-white"
          >
            Edit
          </button>
        )}
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
          Game system
          <select
            value={gameSystem}
            onChange={(event) => setGameSystem(event.target.value)}
            disabled={!isEditing}
            className={fieldStyle}
          >
            <option>Vampire: The Masquerade V5</option>
            <option>Call of Cthulhu</option>
          </select>
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={!isEditing}
            className={`${fieldStyle} min-h-32`}
          />
        </label>

        <label>
          Visibility
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
            disabled={!isEditing}
            className={fieldStyle}
          >
            <option value="private">Private</option>
            <option value="campaign">Campaign members</option>
            <option value="public">Public</option>
          </select>
        </label>
      </div>

      {gameSystem === "Vampire: The Masquerade V5" ? (
        <VtmCharacterSheet
          isEditing={isEditing}
          clan={clan}
          hunger={hunger}
          onClanChange={setClan}
          onHungerChange={setHunger}
        />
      ) : (
        <section className="mt-8 rounded-lg border p-6">
          <p>A character sheet for this game is not available yet.</p>
        </section>
      )}

      {isEditing && (
        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded bg-black px-6 py-3 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      )}

      {message && <p className="mt-4">{message}</p>}
    </form>
  );
}