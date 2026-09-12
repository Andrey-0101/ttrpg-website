import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import SystemCard from "@/components/game-systems/system-card";
import type { Locale } from "@/i18n/routing";
import { withDiceRollerReturnTo } from "@/lib/dice/dice-roller-navigation";
import { GAME_SYSTEM_CATALOGUE } from "@/lib/game-systems/catalogue";

type DiceRollersPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({
  params,
}: DiceRollersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "DiceRollersPage",
  });

  return {
    title: translations("metadataTitle"),
    description: translations("metadataDescription"),
  };
}

export default async function DiceRollersPage() {
  const translations = await getTranslations("DiceRollersPage");
  const catalogueTranslations = await getTranslations("GameSystemCatalogue");

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-200">
          {translations("eyebrow")}
        </p>
        <h1 className="mt-2 break-words text-3xl font-bold sm:text-4xl">
          {translations("title")}
        </h1>
        <p className="mt-4 break-words text-base text-white/80 sm:text-lg">
          {translations("description")}
        </p>
      </header>

      <section className="mt-10" aria-labelledby="system-rollers-title">
        <h2 id="system-rollers-title" className="text-2xl font-bold">
          {translations("systemRollersTitle")}
        </h2>
        <p className="mt-2 max-w-3xl text-white/75">
          {translations("systemRollersDescription")}
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {GAME_SYSTEM_CATALOGUE.map((system) => {
            const capability = system.capabilities.diceRoller;

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
                headingLevel={3}
                action={
                  capability.status === "available"
                    ? {
                        href: withDiceRollerReturnTo(
                          capability.route,
                          "/dice-rollers",
                        ),
                        label: catalogueTranslations(
                          "actions.openDiceRoller",
                        ),
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="standalone-tools-title">
        <h2 id="standalone-tools-title" className="text-2xl font-bold">
          {translations("standaloneTitle")}
        </h2>
        <p className="mt-2 max-w-3xl text-white/75">
          {translations("standaloneDescription")}
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SystemCard
            name={translations("customPoolCardTitle")}
            description={translations("customPoolDescription")}
            status="available"
            availableLabel={catalogueTranslations("available")}
            plannedLabel={catalogueTranslations("planned")}
            headingLevel={3}
            action={{
              href: withDiceRollerReturnTo(
                "/dice-rollers/custom",
                "/dice-rollers",
              ),
              label: translations("openCustomPool"),
            }}
          />
          <SystemCard
            name={translations("goFirstCardTitle")}
            description={translations("goFirstDescription")}
            status="available"
            availableLabel={catalogueTranslations("available")}
            plannedLabel={catalogueTranslations("planned")}
            headingLevel={3}
            action={{
              href: withDiceRollerReturnTo(
                "/dice-rollers/go-first",
                "/dice-rollers",
              ),
              label: translations("openGoFirst"),
            }}
          />
        </div>
      </section>
    </main>
  );
}
