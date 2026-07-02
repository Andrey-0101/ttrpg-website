import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CharacterSummaryCard from "@/components/characters/character-summary-card";
import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  getGameSystemName,
  normalizeGameSystemId,
} from "@/lib/characters/game-systems";
import { getCharacterPortraitSignedUrl } from "@/lib/characters/portrait";
import { normalizeVtmV5SheetData } from "@/lib/characters/vtm-v5/schema";
import { createClient } from "@/utils/supabase/server";

type CharactersPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({
  params,
}: CharactersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });

  return {
    title: translations("characters"),
  };
}

export default async function CharactersPage({
  params,
}: CharactersPageProps) {
  const { locale } = await params;
  const translations = await getTranslations("Characters");
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    return redirect({
      href: "/login",
      locale,
    });
  }

  const { data: characters, error } = await supabase
    .from("characters")
    .select(
      "id, name, game_system, visibility, portrait_url, sheet_data",
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Failed to load characters:", error);
  }

  const preparedCharacters = await Promise.all(
    (characters ?? []).map(async (character) => {
      const normalizedSystemId = normalizeGameSystemId(character.game_system);
      const identity =
        normalizedSystemId === "vtm-v5"
          ? normalizeVtmV5SheetData(character.sheet_data).identity
          : null;
      const portraitUrl = await getCharacterPortraitSignedUrl(
        supabase,
        character.portrait_url,
      );

      return {
        ...character,
        identity,
        portraitUrl,
      };
    }),
  );

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">{translations("title")}</h1>

        <Link
          href="/characters/new"
          className="rounded bg-black px-5 py-3 text-white"
        >
          {translations("create")}
        </Link>
      </div>

      {error && (
        <p className="mt-8" role="alert">
          {translations("loadError")}
        </p>
      )}

      {!error && preparedCharacters.length === 0 && (
        <p className="mt-8">{translations("empty")}</p>
      )}

      <div className="mt-8 grid gap-5">
        {preparedCharacters.map((character) => (
          <CharacterSummaryCard
            key={character.id}
            id={character.id}
            name={character.name}
            gameSystemName={getGameSystemName(character.game_system)}
            visibility={character.visibility}
            portraitPath={character.portrait_url}
            portraitUrl={character.portraitUrl}
            identity={character.identity}
          />
        ))}
      </div>
    </main>
  );
}
