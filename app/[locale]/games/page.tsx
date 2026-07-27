import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import SystemCard from "@/components/game-systems/system-card";
import type { Locale } from "@/i18n/routing";
import { GAME_SYSTEM_CATALOGUE } from "@/lib/game-systems/catalogue";

type GamesPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({
  params,
}: GamesPageProps): Promise<Metadata> {
  const { locale } = await params;

  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });

  return {
    title: translations("games"),
  };
}

export default async function GamesPage() {
  const translations = await getTranslations("GamesPage");
  const catalogueTranslations = await getTranslations("GameSystemCatalogue");

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <h1 className="text-4xl font-bold">
        {translations("title")}
      </h1>

      <p className="mt-4">
        {translations("description")}
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {GAME_SYSTEM_CATALOGUE.map((system) => {
          const capability = system.capabilities.gameArea;

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
                      label: catalogueTranslations("actions.openGameArea"),
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
