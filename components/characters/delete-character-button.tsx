"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import {
  CHARACTER_PORTRAIT_BUCKET,
  isCharacterPortraitStoragePath,
} from "@/lib/characters/portrait";
import { createClient } from "@/utils/supabase/client";

type DeleteCharacterButtonProps = {
  characterId: string;
  characterName: string;
  portraitPath?: string | null;
};

export default function DeleteCharacterButton({
  characterId,
  characterName,
  portraitPath = null,
}: DeleteCharacterButtonProps) {
  const translations = useTranslations("CharacterDelete");
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      translations("confirm", { name: characterName }),
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", characterId);

    if (error) {
      console.error(error);
      setErrorMessage(translations("error"));
      setDeleting(false);
      return;
    }

    if (isCharacterPortraitStoragePath(portraitPath)) {
      const { error: portraitError } = await supabase.storage
        .from(CHARACTER_PORTRAIT_BUCKET)
        .remove([portraitPath]);

      if (portraitError) {
        console.error("Failed to remove the character portrait:", portraitError);
      }
    }

    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded border border-red-600 bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? translations("deleting") : translations("delete")}
      </button>

      {errorMessage && (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
