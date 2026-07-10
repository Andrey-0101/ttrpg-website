import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CampaignSummaryCard from "@/components/campaigns/campaign-summary-card";
import RetryCampaignsButton from "@/components/campaigns/retry-campaigns-button";
import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/server";

type CampaignsPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({
  params,
}: CampaignsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });

  return {
    title: translations("campaigns"),
  };
}

export default async function CampaignsPage({
  params,
}: CampaignsPageProps) {
  const { locale } = await params;
  const translations = await getTranslations("Campaigns");
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return redirect({
      href: "/login",
      locale,
    });
  }

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, name, description, game_system, status, game_master_id")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Failed to load campaigns:", error);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-3 py-6 sm:px-6 lg:p-8">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            {translations("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-white/80">
            {translations("description")}
          </p>
        </div>

        <Link
          href="/campaigns/new"
          className="w-full rounded bg-white px-5 py-3 text-center font-medium text-black sm:w-auto"
        >
          {translations("create")}
        </Link>
      </div>

      {error ? (
        <section
          className="mt-8 rounded-lg border border-red-300 bg-red-50 p-5 text-red-950"
          role="alert"
        >
          <h2 className="text-xl font-semibold">
            {translations("loadErrorTitle")}
          </h2>
          <p className="mt-2">{translations("loadError")}</p>
          <RetryCampaignsButton label={translations("retry")} />
        </section>
      ) : (campaigns ?? []).length === 0 ? (
        <section className="mt-8 rounded-lg border border-dashed border-white/40 bg-black/20 p-6 text-center sm:p-8">
          <h2 className="text-2xl font-semibold">
            {translations("emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/80 sm:text-base">
            {translations("emptyDescription")}
          </p>
          <Link
            href="/campaigns/new"
            className="mt-5 inline-block rounded bg-white px-5 py-3 font-medium text-black"
          >
            {translations("create")}
          </Link>
        </section>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {(campaigns ?? []).map((campaign) => (
            <CampaignSummaryCard
              key={campaign.id}
              id={campaign.id}
              name={campaign.name}
              description={campaign.description}
              gameSystem={campaign.game_system}
              status={campaign.status}
              isGameMaster={campaign.game_master_id === userId}
            />
          ))}
        </div>
      )}
    </main>
  );
}
