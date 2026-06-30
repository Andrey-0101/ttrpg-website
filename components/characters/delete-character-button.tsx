"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type DeleteCharacterButtonProps = {
  characterId: string;
  characterName: string;
};

export default function DeleteCharacterButton({
  characterId,
  characterName,
}: DeleteCharacterButtonProps) {
  const translations =
    useTranslations("CharacterDelete");

  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      translations("confirm", {
        name: characterName,
      })
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

    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded border border-red-600 px-4 py-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {deleting
          ? translations("deleting")
          : translations("delete")}
      </button>

      {errorMessage && (
        <p
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}