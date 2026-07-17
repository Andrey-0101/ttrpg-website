import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

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

        <article className="mt-5 max-w-2xl rounded-xl border border-white/25 bg-black/20 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="min-w-0 break-words text-xl font-bold">
              Vampire: The Masquerade V5
            </h3>
            <span className="rounded-full border border-green-300/40 bg-green-950/40 px-3 py-1 text-sm font-semibold text-green-100">
              {translations("available")}
            </span>
          </div>
          <p className="mt-3 text-white/75">
            {translations("vtmDescription")}
          </p>
          <Link
            href="/games/vampire-the-masquerade/tools/dice"
            className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 font-bold text-neutral-950 outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {translations("openVtmRoller")}
          </Link>
        </article>
      </section>

      <section className="mt-10" aria-labelledby="custom-pool-title">
        <h2 id="custom-pool-title" className="text-2xl font-bold">
          {translations("customPoolTitle")}
        </h2>
        <article className="mt-5 max-w-2xl rounded-xl border border-dashed border-white/25 bg-white/5 p-5 sm:p-6">
          <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-sm font-semibold text-white/80">
            {translations("comingNext")}
          </span>
          <h3 className="mt-4 break-words text-xl font-bold">
            {translations("customPoolCardTitle")}
          </h3>
          <p className="mt-3 break-words text-white/75">
            {translations("customPoolDescription")}
          </p>
        </article>
      </section>
    </main>
  );
}
