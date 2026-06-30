"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  GAME_SYSTEMS,
  type GameSystemId,
} from "@/lib/characters/game-systems";
import VtmCharacterSheet from "./sheets/vtm-v5/vtm-character-sheet";
import ShortDescriptionField from "./short-description-field";

type CharacterCreatorProps = {
  systemId: GameSystemId;
};

type CharacterVisibility =
  | "private"
  | "campaign"
  | "public";

export default function CharacterCreator({
  systemId,
}: CharacterCreatorProps) {
  const translations = useTranslations("CharacterForm");
  const router = useRouter();

  const gameSystem = GAME_SYSTEMS[systemId];
  const vtmDefaults =
    GAME_SYSTEMS["vtm-v5"].defaultSheetData;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] =
    useState<CharacterVisibility>("private");

  const [clan, setClan] = useState<string>(
    vtmDefaults.clan
  );

  const [hunger, setHunger] = useState<number>(
    vtmDefaults.hunger
  );

  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreating(true);
    setMessage("");

    const supabase = createClient();

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      setCreating(false);
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

    const { data: newCharacter, error } =
      await supabase
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
      console.error(error);
      setMessage(translations("createError"));
      setCreating(false);
      return;
    }

    router.push(`/characters/${newCharacter.id}`);
    router.refresh();
  }

  const fieldStyle =
    "mt-1 w-full rounded border p-3";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8"
    >
      <section className="rounded-lg border p-6">
        <h2 className="text-2xl font-bold">
          {translations("generalInformation")}
        </h2>

        <p className="mt-2">
          {translations("gameSystem")}:{" "}
          <strong>{gameSystem.name}</strong>
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <label>
            {translations("characterName")}

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className={fieldStyle}
              required
            />
          </label>

          <ShortDescriptionField
            value={description}
            onChange={setDescription}
          />

          <label>
            {translations("visibility")}

            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(
                  event.target
                    .value as CharacterVisibility
                )
              }
              className={fieldStyle}
            >
              <option value="private">
                {translations("visibilityPrivate")}
              </option>

              <option value="campaign">
                {translations("visibilityCampaign")}
              </option>

              <option value="public">
                {translations("visibilityPublic")}
              </option>
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
        className="mt-6 rounded bg-black px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {creating
          ? translations("creating")
          : translations("create")}
      </button>

      {message && (
        <p className="mt-4" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}