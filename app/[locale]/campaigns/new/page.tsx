import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CampaignCreator from "@/components/campaigns/campaign-creator";
import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { GAME_SYSTEMS } from "@/lib/characters/game-systems";
import { createClient } from "@/utils/supabase/server";

type NewCampaignPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({
  params,
}: NewCampaignPageProps): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });

  return {
    title: translations("campaignCreate"),
  };
}

export default async function NewCampaignPage({
  params,
}: NewCampaignPageProps) {
  const { locale } = await params;
  const translations = await getTranslations("CampaignCreate");
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    return redirect({
      href: "/login",
      locale,
    });
  }

  const gameSystems = Object.values(GAME_SYSTEMS)
    .filter((system) => system.available)
    .map((system) => ({
      id: system.id,
      name: system.name,
    }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-3 py-6 sm:px-6 lg:p-8">
      <Link href="/campaigns">
        <span aria-hidden="true">&larr;</span> {translations("back")}
      </Link>

      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
        {translations("title")}
      </h1>
      <p className="mt-3 max-w-2xl text-white/80">
        {translations("intro")}
      </p>

      <CampaignCreator gameSystems={gameSystems} />
    </main>
  );
}
