"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  GAME_SYSTEMS,
  type GameSystemId,
} from "@/lib/characters/game-systems";
import VtmCharacterSheet from "./sheets/vtm-v5/vtm-character-sheet";
import ShortDescriptionField from "./short-description-field";

export default function CharacterCreator({
  systemId,
}: {
  systemId: GameSystemId;
}) {
  const router = useRouter();
  const gameSystem = GAME_SYSTEMS[systemId];
  const vtmDefaults = GAME_SYSTEMS["vtm-v5"].defaultSheetData;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");

  const [clan, setClan] = useState<string>(vtmDefaults.clan);
  const [hunger, setHunger] = useState<number>(vtmDefaults.hunger);

  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");

    const supabase = createClient();

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.push("/login");
      return;
    }

    const sheetData =
      systemId === "vtm-v5"
        ? {
            schemaVersion: 1,
            clan,
            hunger,
          }
        : {
            schemaVersion: 1,
          };

    const { data: newCharacter, error } = await supabase
      .from("characters")
      .insert({
        owner_id: userData.user.id,
        name,
        game_system: systemId,
        description,
        visibility,
        sheet_data: sheetData,
      })
      .select("id")
      .single();

    if (error || !newCharacter) {
      setMessage(error?.message ?? "Unable to create character.");
      setCreating(false);
      return;
    }

    router.push(`/characters/${newCharacter.id}`);
    router.refresh();
  }

  const fieldStyle = "mt-1 w-full rounded border p-3";

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <section className="rounded-lg border p-6">
        <h2 className="text-2xl font-bold">General Information</h2>

        <p className="mt-2">
          Game system: <strong>{gameSystem.name}</strong>
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <label>
            Character name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldStyle}
              required
            />
          </label>

          <ShortDescriptionField
            value={description}
              onChange={setDescription}
          />

          <label>
            Visibility
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
              className={fieldStyle}
            >
              <option value="private">Private</option>
              <option value="campaign">Campaign members</option>
              <option value="public">Public</option>
            </select>
          </label>
        </div>
      </section>

      {systemId === "vtm-v5" && (
        <VtmCharacterSheet
          isEditing={true}
          clan={clan}
          hunger={hunger}
          onClanChange={setClan}
          onHungerChange={setHunger}
        />
      )}

      <button
        type="submit"
        disabled={creating}
        className="mt-6 rounded bg-black px-6 py-3 text-white disabled:opacity-50"
      >
        {creating ? "Creating..." : "Create Character"}
      </button>

      {message && <p className="mt-4">{message}</p>}
    </form>
  );
}