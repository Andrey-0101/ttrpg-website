import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import DarkPackNotice from "@/components/games/vtm-v5/dark-pack-notice";
import PersonalDiceRoller from "@/components/games/vtm-v5/personal-dice-roller";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type DicePageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({
  params,
}: DicePageProps): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "VtmDiceRoller",
  });

  return {
    title: translations("metadataTitle"),
    description: translations("metadataDescription"),
  };
}

export default async function DicePage() {
  const translations = await getTranslations("VtmDiceRoller");

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-3 py-6 sm:px-6 lg:p-8">
      <Link
        href="/games/vampire-the-masquerade"
        className="inline-flex rounded outline-none focus-visible:ring-2 focus-visible:ring-red-300"
      >
        <span aria-hidden="true">&larr;</span>
        <span className="ml-2">{translations("back")}</span>
      </Link>

      <header className="mt-8 max-w-3xl">
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

      <PersonalDiceRoller />
      <DarkPackNotice />
    </main>
  );
}
