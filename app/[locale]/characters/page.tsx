import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import RetryCharactersButton from "@/components/characters/retry-characters-button";
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

  const preparedCharacters = error
    ? []
    : await Promise.all(
        (characters ?? []).map(async (character) => {
          const normalizedSystemId = normalizeGameSystemId(
            character.game_system,
          );
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
    <main className="mx-auto min-h-screen w-full max-w-4xl px-3 py-6 sm:px-6 lg:p-8">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold sm:text-4xl">{translations("title")}</h1>

        <Link
          href="/characters/new"
          className="w-full rounded bg-black px-5 py-3 text-center text-white sm:w-auto"
        >
          {translations("create")}
        </Link>
      </div>

      {error ? (
        <section
          className="mt-8 rounded-lg border border-red-300 bg-red-50 p-5 text-red-950"
          role="alert"
        >
          <h2 className="text-xl font-semibold">
            {translations("loadErrorTitle")}
          </h2>
          <p className="mt-2">{translations("loadError")}</p>
          <RetryCharactersButton label={translations("retry")} />
        </section>
      ) : preparedCharacters.length === 0 ? (
        <section className="mt-8 rounded-lg border border-dashed border-white/40 bg-black/20 p-6 text-center">
          <h2 className="text-2xl font-semibold">
            {translations("emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/80 sm:text-base">
            {translations("emptyDescription")}
          </p>
          <Link
            href="/characters/new"
            className="mt-5 inline-block rounded bg-white px-5 py-3 font-medium text-black"
          >
            {translations("create")}
          </Link>
        </section>
      ) : (
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
      )}
    </main>
  );
}
