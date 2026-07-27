import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import SystemCard from "@/components/game-systems/system-card";
import { routing } from "@/i18n/routing";
import { GAME_SYSTEM_CATALOGUE } from "@/lib/game-systems/catalogue";

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

  const catalogueTranslations = await getTranslations({
    locale,
    namespace: "GameSystemCatalogue",
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-3 py-6 sm:px-6 lg:p-8">
      <h1 className="text-3xl font-bold sm:text-4xl">
        {translations("title")}
      </h1>

      <p className="mt-4">
        {translations("description")}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {GAME_SYSTEM_CATALOGUE.map((system) => {
          const capability = system.capabilities.characterCreation;

          return (
            <SystemCard
              key={system.id}
              name={catalogueTranslations(
                `systems.${system.translationKey}.name`,
              )}
              description={catalogueTranslations(
                `systems.${system.translationKey}.description`,
              )}
              status={capability.status}
              availableLabel={catalogueTranslations("available")}
              plannedLabel={catalogueTranslations("planned")}
              action={
                capability.status === "available"
                  ? {
                      href: capability.route,
                      label: catalogueTranslations(
                        "actions.createCharacter",
                      ),
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
    </main>
  );
}
