import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import CharacterEditor from "@/components/characters/character-editor";

type CharacterPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: CharacterPageProps): Promise<Metadata> {
  const {
    locale: requestedLocale,
    id,
  } = await params;

  const locale = hasLocale(
    routing.locales,
    requestedLocale
  )
    ? requestedLocale
    : routing.defaultLocale;

  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });

  const supabase = await createClient();

  const { data: claimsData } =
    await supabase.auth.getClaims();

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
    title:
      character?.name ||
      translations("characterDetails"),
  };
}

export default async function CharacterPage({
  params,
}: CharacterPageProps) {
  const {
    locale: requestedLocale,
    id,
  } = await params;

  const locale = hasLocale(
    routing.locales,
    requestedLocale
  )
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
      "id, name, game_system, description, visibility, sheet_data"
    )
    .eq("id", id)
    .single();

  if (error || !character) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-8">
      <Link href="/characters">
        <span aria-hidden="true">
          &larr;
        </span>{" "}
        {translations("back")}
      </Link>

      <CharacterEditor character={character} />
    </main>
  );
}