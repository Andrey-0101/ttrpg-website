import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import CampaignVideoRoom from "@/components/campaigns/campaign-video-room";
import { redirect } from "@/i18n/navigation";
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
  const videoTranslations = await getTranslations({
    locale,
    namespace: "CampaignVideoRoom",
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
    .select("id, name, game_system, status, game_master_id")
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
    campaignGameSystem: campaign.game_system,
    gameMasterId: campaign.game_master_id,
    currentUserId: userId,
    labels: {
      you: campaignTranslations("you"),
      gameMasterRole: videoTranslations("roles.gameMaster"),
      gameMasterFallback: campaignTranslations("gameMasterFallback"),
      playerFallback: campaignTranslations("playerFallback"),
    },
  });
  if (!participantDirectoryResult.ready) {
    console.error("Failed to load the campaign Game Room participant directory.");
  }

  return (
    <main className="campaign-game-room" data-campaign-game-room>
      <h1 className="sr-only">
        {campaign.name}: {translations("title")}
      </h1>
      <CampaignVideoRoom
        campaignId={campaign.id}
        campaignStatus={campaign.status}
        directoryReady={participantDirectoryResult.ready}
        participantDirectory={participantDirectoryResult.participantDirectory}
        plannedWorkspace={{
          displayHeading: translations("workspace.display"),
          toolsHeading: translations("workspace.tools"),
          status: translations("planned.status"),
        }}
      />
    </main>
  );
}
