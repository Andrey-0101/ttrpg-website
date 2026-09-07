import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CallOfCthulhu7eDiceRoller from "@/components/games/call-of-cthulhu-7e/dice-roller";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { resolveDiceRollerReturnTo } from "@/lib/dice/dice-roller-navigation";
import { listPersonalRollHistory } from "@/lib/dice/personal-dice-persistence.server";
import type { PersonalRollHistoryEntry } from "@/lib/dice/personal-dice-persistence-service";
import { createClient } from "@/utils/supabase/server";

type DicePageProps = {
  params: Promise<{
    locale: Locale;
  }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: DicePageProps): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "Coc7eDiceRoller",
  });

  return {
    title: translations("metadataTitle"),
    description: translations("metadataDescription"),
  };
}

export default async function DicePage({
  params,
  searchParams,
}: DicePageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const translations = await getTranslations("Coc7eDiceRoller");
  const backHref = resolveDiceRollerReturnTo(locale, query.returnTo);
  let authenticated = false;
  let historyEntries: PersonalRollHistoryEntry[] | null = null;

  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    authenticated = !claimsError && Boolean(claimsData?.claims);
    if (authenticated) {
      const historyResult = await listPersonalRollHistory([
        "coc_7e_percentile",
        "coc_7e_other_dice",
      ]);
      if (historyResult.ok) {
        historyEntries = historyResult.data;
      }
    }
  } catch {
    authenticated = false;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={backHref}
        className="inline-flex rounded-md text-sm font-semibold text-white/80 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-red-300"
      >
        <span aria-hidden="true">←</span>
        <span className="ml-2">{translations("back")}</span>
      </Link>

      <header className="mt-6 max-w-3xl">
        <h1 className="break-words text-3xl font-bold sm:text-4xl">
          {translations("title")}
        </h1>
      </header>

      <div className="mt-8">
        <CallOfCthulhu7eDiceRoller
          authenticated={authenticated}
          initialHistoryEntries={historyEntries}
        />
      </div>
    </main>
  );
}
