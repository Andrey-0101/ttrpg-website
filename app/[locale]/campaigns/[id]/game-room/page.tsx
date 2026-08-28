import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import CampaignGameRoomPlannedTools from "@/components/campaigns/campaign-game-room-planned-tools";
import CampaignVideoRoom from "@/components/campaigns/campaign-video-room";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { loadCampaignParticipantDirectory } from "@/lib/campaign-video/participant-directory.server";
import { createClient } from "@/utils/supabase/server";

type CampaignGameRoomPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({
  params,
}: CampaignGameRoomPageProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });
  return { title: translations("campaignGameRoom") };
}

export default async function CampaignGameRoomPage({
  params,
}: CampaignGameRoomPageProps) {
  const { locale: requestedLocale, id } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "CampaignGameRoom",
  });
  const campaignTranslations = await getTranslations({
    locale,
    namespace: "CampaignDetails",
  });
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? "";

  if (claimsError || !userId) {
    redirect({ href: "/login", locale });
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, name, status, game_master_id")
    .eq("id", id)
    .maybeSingle();

  if (campaignError) {
    console.error("Failed to load the campaign Game Room.");
  }
  if (campaignError || !campaign) {
    notFound();
  }

  const participantDirectoryResult = await loadCampaignParticipantDirectory({
    supabase,
    campaignId: campaign.id,
    gameMasterId: campaign.game_master_id,
    currentUserId: userId,
    labels: {
      you: campaignTranslations("you"),
      gameMasterFallback: campaignTranslations("gameMasterFallback"),
      playerFallback: campaignTranslations("playerFallback"),
    },
  });
  if (!participantDirectoryResult.ready) {
    console.error("Failed to load the campaign Game Room participant directory.");
  }

  const roleLabel =
    campaign.game_master_id === userId
      ? campaignTranslations("role.gameMaster")
      : campaignTranslations("role.player");
  const campaignActive = campaign.status === "active";
  const plannedTools = [
    {
      title: translations("planned.dice.title"),
      description: translations("planned.dice.description"),
    },
    {
      title: translations("planned.handouts.title"),
      description: translations("planned.handouts.description"),
    },
    {
      title: translations("planned.participants.title"),
      description: translations("planned.participants.description"),
    },
    {
      title: translations("planned.quickNotes.title"),
      description: translations("planned.quickNotes.description"),
    },
    {
      title: translations("planned.sessionContext.title"),
      description: translations("planned.sessionContext.description"),
      details: [
        translations("planned.sessionContext.activeCharacters"),
        translations("planned.sessionContext.currentNpcs"),
        translations("planned.sessionContext.selectedHandouts"),
      ],
    },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1600px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="inline-flex min-h-11 items-center rounded px-1 font-medium text-cyan-100 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
      >
        <span aria-hidden="true">&larr;</span>
        <span className="ml-2">{translations("back")}</span>
      </Link>

      <header className="mt-4 rounded-xl border border-white/20 bg-black/25 p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200/75">
              {campaign.name}
            </p>
            <h1 className="mt-2 break-words text-3xl font-bold sm:text-4xl">
              {translations("title")}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-white/75 sm:text-base">
              {translations("description")}
            </p>
          </div>
          <dl className="grid shrink-0 gap-2 text-sm sm:grid-cols-2 lg:min-w-80 lg:grid-cols-1">
            <div className="rounded-lg bg-white/10 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-white/55">
                {translations("roleLabel")}
              </dt>
              <dd className="mt-1 font-semibold">{roleLabel}</dd>
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-white/55">
                {translations("availability.label")}
              </dt>
              <dd className="mt-1 font-semibold">
                {translations(
                  campaignActive
                    ? "availability.available"
                    : "availability.unavailable",
                )}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="mt-6 grid gap-7">
        <CampaignVideoRoom
          campaignId={campaign.id}
          campaignStatus={campaign.status}
          directoryReady={participantDirectoryResult.ready}
          participantDirectory={participantDirectoryResult.participantDirectory}
        />

        <CampaignGameRoomPlannedTools
          heading={translations("planned.title")}
          description={translations("planned.description")}
          status={translations("planned.status")}
          tools={plannedTools}
        />
      </div>
    </main>
  );
}
