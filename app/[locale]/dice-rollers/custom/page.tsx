import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomDicePool from "@/components/dice-rollers/custom-dice-pool";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type CustomDicePoolPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: CustomDicePoolPageProps): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "CustomDicePool",
  });

  return {
    title: translations("metadataTitle"),
    description: translations("metadataDescription"),
  };
}

export default async function CustomDicePoolPage() {
  const translations = await getTranslations("CustomDicePool");

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dice-rollers"
        className="inline-flex rounded-md text-sm font-semibold text-white/80 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-red-300"
      >
        ← {translations("back")}
      </Link>

      <header className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-200">
          {translations("eyebrow")}
        </p>
        <h1 className="mt-2 break-words text-3xl font-bold sm:text-4xl">
          {translations("title")}
        </h1>
        <p className="mt-4 break-words text-base text-white/80 sm:text-lg">
          {translations("description")}
        </p>
        <p className="mt-3 rounded-lg border border-white/15 bg-white/5 p-3 text-sm text-white/75">
          {translations("privacyNote")}
        </p>
      </header>

      <CustomDicePool />
    </main>
  );
}
