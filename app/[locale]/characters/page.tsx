import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { getGameSystemName } from "@/lib/characters/game-systems";
import DeleteCharacterButton from "@/components/characters/delete-character-button";
import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

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

  const translations =
    await getTranslations("Characters");

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
      "id, name, game_system, description, visibility"
    )
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">
          {translations("title")}
        </h1>

        <Link
          href="/characters/new"
          className="rounded bg-black px-5 py-3 text-white"
        >
          {translations("create")}
        </Link>
      </div>

      {error && (
        <p className="mt-8" role="alert">
          {translations("loadError", {
            message: error.message,
          })}
        </p>
      )}

      {!error && characters?.length === 0 && (
        <p className="mt-8">
          {translations("empty")}
        </p>
      )}

      <div className="mt-8 grid gap-4">
        {characters?.map((character) => (
          <section
            key={character.id}
            className="flex min-h-56 flex-col rounded-lg border p-6"
          >
            <h2 className="text-2xl font-bold">
              {character.name}
            </h2>

            <p className="mt-2">
              {getGameSystemName(
                character.game_system
              )}
            </p>

            <p className="mt-2 whitespace-pre-line">
              {character.description ||
                translations("noDescription")}
            </p>

            <p className="mt-2 text-sm">
              {translations("visibility.label")}:{" "}
              {character.visibility === "public"
                ? translations(
                    "visibility.public"
                  )
                : character.visibility ===
                    "campaign"
                  ? translations(
                      "visibility.campaign"
                    )
                  : translations(
                      "visibility.private"
                    )}
            </p>

            <div className="mt-auto flex items-end justify-between gap-4 pt-6">
              <Link
                href={`/characters/${character.id}`}
                className="rounded border px-4 py-2 hover:bg-gray-100 hover:text-black"
              >
                {translations("open")}
              </Link>

              <DeleteCharacterButton
                characterId={character.id}
                characterName={character.name}
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}