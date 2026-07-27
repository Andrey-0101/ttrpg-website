import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import CharacterCreator from "@/components/characters/character-creator";
import { getGameSystem } from "@/lib/characters/game-systems";
import { hasAvailableGameSystemCapability } from "@/lib/game-systems/catalogue";

type NewCharacterPageProps = {
  params: Promise<{
    locale: string;
    system: string;
  }>;
};

export async function generateMetadata({
  params,
}: NewCharacterPageProps): Promise<Metadata> {
  const {
    locale: requestedLocale,
    system: systemId,
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
  const catalogueTranslations = await getTranslations({
    locale,
    namespace: "GameSystemCatalogue",
  });

  const gameSystem = getGameSystem(systemId);

  if (
    !gameSystem ||
    !hasAvailableGameSystemCapability(gameSystem, "characterCreation")
  ) {
    return {
      title: translations("characterCreate"),
    };
  }

  return {
    title: translations(
      "characterCreateForSystem",
      {
        system: catalogueTranslations(
          `systems.${gameSystem.translationKey}.name`,
        ),
      }
    ),
  };
}

export default async function NewCharacterPage({
  params,
}: NewCharacterPageProps) {
  const {
    locale: requestedLocale,
    system: systemId,
  } = await params;

  const locale = hasLocale(
    routing.locales,
    requestedLocale
  )
    ? requestedLocale
    : routing.defaultLocale;

  const translations = await getTranslations({
    locale,
    namespace: "CharacterNew",
  });
  const catalogueTranslations = await getTranslations({
    locale,
    namespace: "GameSystemCatalogue",
  });

  const gameSystem = getGameSystem(systemId);

  if (
    !gameSystem ||
    !hasAvailableGameSystemCapability(gameSystem, "characterCreation")
  ) {
    notFound();
  }
  const gameSystemName = catalogueTranslations(
    `systems.${gameSystem.translationKey}.name`,
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-3 py-6 sm:px-6 lg:p-8">
      <Link href="/characters/new">
        <span aria-hidden="true">
          &larr;
        </span>{" "}
        {translations("back")}
      </Link>

      <h1 className="mt-8 text-4xl font-bold">
        {translations("title", {
          system: gameSystemName,
        })}
      </h1>

      <CharacterCreator
        systemId={gameSystem.id}
        systemName={gameSystemName}
      />
    </main>
  );
}
