import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import CharacterEditor from "@/components/characters/character-editor";

type CharacterPageProps = {
  params: Promise<{
    locale: Locale;
    id: string;
  }>;
};

export default async function CharacterPage({
  params,
}: CharacterPageProps) {
  const { locale, id } = await params;
  const translations =
    await getTranslations("CharacterDetails");

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
        ← {translations("back")}
      </Link>

      <CharacterEditor character={character} />
    </main>
  );
}