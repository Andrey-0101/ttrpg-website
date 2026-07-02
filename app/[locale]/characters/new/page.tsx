import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { GAME_SYSTEMS } from "@/lib/characters/game-systems";

type SelectGameSystemPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: SelectGameSystemPageProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;

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

  return {
    title: translations("characterCreate"),
  };
}

export default async function SelectGameSystemPage({
  params,
}: SelectGameSystemPageProps) {
  const { locale: requestedLocale } = await params;

  const locale = hasLocale(
    routing.locales,
    requestedLocale
  )
    ? requestedLocale
    : routing.defaultLocale;

  const translations = await getTranslations({
    locale,
    namespace: "CharacterSystemSelection",
  });

  const gameSystemsTranslations =
    await getTranslations({
      locale,
      namespace: "GameSystems",
    });

  const gameSystems = Object.values(GAME_SYSTEMS);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-3 py-6 sm:px-6 lg:p-8">
      <h1 className="text-3xl font-bold sm:text-4xl">
        {translations("title")}
      </h1>

      <p className="mt-4">
        {translations("description")}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {gameSystems.map((system) => (
          <section
            key={system.id}
            className="flex flex-col rounded-lg border p-6"
          >
            <h2 className="text-2xl font-bold">
              {system.name}
            </h2>

            <p className="mt-3 flex-1">
              {system.id === "vtm-v5"
                ? gameSystemsTranslations(
                    "vtmV5.description"
                  )
                : gameSystemsTranslations(
                    "callOfCthulhu7e.description"
                  )}
            </p>

            {system.available ? (
              <Link
                href={`/characters/new/${system.id}`}
                className="mt-6 rounded bg-black px-5 py-3 text-center text-white"
              >
                {translations("create")}
              </Link>
            ) : (
              <span className="mt-6 rounded bg-gray-200 px-5 py-3 text-center text-gray-600">
                {translations("comingSoon")}
              </span>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}