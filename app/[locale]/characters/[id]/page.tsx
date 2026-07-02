import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import CharacterEditor from "@/components/characters/character-editor";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getCharacterPortraitSignedUrl } from "@/lib/characters/portrait";
import { createClient } from "@/utils/supabase/server";

type CharacterPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: CharacterPageProps): Promise<Metadata> {
  const { locale: requestedLocale, id } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    return {
      title: translations("characterDetails"),
    };
  }

  const { data: character } = await supabase
    .from("characters")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: character?.name || translations("characterDetails"),
  };
}

export default async function CharacterPage({
  params,
}: CharacterPageProps) {
  const { locale: requestedLocale, id } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "CharacterDetails",
  });
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect({
      href: "/login",
      locale,
    });
  }

  const { data: character, error } = await supabase
    .from("characters")
    .select(
      "id, name, game_system, visibility, sheet_data, portrait_url",
    )
    .eq("id", id)
    .single();

  if (error || !character) {
    notFound();
  }

  const portraitSignedUrl = await getCharacterPortraitSignedUrl(
    supabase,
    character.portrait_url,
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-3 py-6 sm:px-6 lg:p-8">
      <Link href="/characters">
        <span aria-hidden="true">&larr;</span> {translations("back")}
      </Link>

      <CharacterEditor
        character={{
          ...character,
          portraitSignedUrl,
        }}
      />
    </main>
  );
}
