import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import CampaignHandoutsManager, {
  type CampaignHandoutManagerItem,
  type CampaignHandoutPlayerOption,
} from "@/components/campaigns/campaign-handouts-manager";
import CampaignHandoutsViewer from "@/components/campaigns/campaign-handouts-viewer";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  isCampaignGalleryCategory,
  isCampaignHandoutVisibility,
} from "@/lib/campaign-handouts/contracts";
import { loadCampaignGalleryImages } from "@/lib/campaign-handouts/gallery.server";
import { createClient } from "@/utils/supabase/server";

type CampaignGalleryPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({
  params,
}: CampaignGalleryPageProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });

  return { title: translations("campaignGallery") };
}

export default async function CampaignGalleryPage({
  params,
}: CampaignGalleryPageProps) {
  const { locale: requestedLocale, id } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "CampaignHandouts",
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
    console.error("Failed to load the Campaign Gallery route.");
  }
  if (campaignError || !campaign) {
    notFound();
  }

  const isGameMaster = campaign.game_master_id === userId;
  const campaignActive = campaign.status === "active";

  if (!isGameMaster && !campaignActive) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-3 py-6 sm:px-6 lg:p-8">
        <Link href={`/campaigns/${campaign.id}`}>
          <span aria-hidden="true">&larr;</span> {translations("back")}
        </Link>
        <section className="mt-6 rounded-lg border border-white/30 bg-black/20 p-6 text-center sm:p-8">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {translations("title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/80">
            {translations("completedPlayerDescription")}
          </p>
        </section>
      </main>
    );
  }

  const { images: imagesWithUrls, loadError: imageError } =
    await loadCampaignGalleryImages({
      supabase,
      campaignId: campaign.id,
    });

  if (imageError) {
    console.error("Failed to load Campaign Gallery images.");
  }

  let managerItems: CampaignHandoutManagerItem[] = [];
  let playerOptions: CampaignHandoutPlayerOption[] = [];
  let managerLoadError = false;

  if (isGameMaster && !imageError) {
    const [recipientsResult, membersResult] = await Promise.all([
      supabase
        .from("campaign_image_recipients")
        .select("image_id, user_id")
        .eq("campaign_id", campaign.id),
      supabase
        .from("campaign_members")
        .select("user_id, display_order")
        .eq("campaign_id", campaign.id)
        .order("display_order", { ascending: true }),
    ]);

    const memberIds = (membersResult.data ?? []).map((member) => member.user_id);
    const profilesResult =
      memberIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", memberIds)
        : { data: [], error: null };

    if (recipientsResult.error || membersResult.error || profilesResult.error) {
      managerLoadError = true;
      console.error("Failed to load Campaign Gallery access controls.");
    } else {
      const profileById = new Map(
        (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
      );
      playerOptions = (membersResult.data ?? []).map((member) => {
        const profile = profileById.get(member.user_id);
        return {
          id: member.user_id,
          name:
            profile?.display_name ||
            profile?.username ||
            translations("playerFallback", {
              position: member.display_order,
            }),
        };
      });
      const recipientIdsByImage = new Map<string, string[]>();
      for (const recipient of recipientsResult.data ?? []) {
        const recipientIds = recipientIdsByImage.get(recipient.image_id) ?? [];
        recipientIds.push(recipient.user_id);
        recipientIdsByImage.set(recipient.image_id, recipientIds);
      }

      managerItems = imagesWithUrls.flatMap((image) =>
        isCampaignHandoutVisibility(image.visibility) &&
        isCampaignGalleryCategory(image.category)
          ? [
              {
                id: image.id,
                displayName: image.display_name,
                storagePath: image.storage_object_name,
                signedUrl: image.signedUrl,
                category: image.category,
                visibility: image.visibility,
                recipientIds: recipientIdsByImage.get(image.id) ?? [],
              },
            ]
          : [],
      );
    }
  }

  const playerItems = isGameMaster
    ? []
    : imagesWithUrls.flatMap((image) =>
        image.signedUrl && isCampaignGalleryCategory(image.category)
          ? [
              {
                key: image.signedUrl,
                displayName: image.display_name,
                signedUrl: image.signedUrl,
                category: image.category,
              },
            ]
          : [],
      );

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-3 py-6 sm:px-6 lg:p-8">
      <Link href={`/campaigns/${campaign.id}`}>
        <span aria-hidden="true">&larr;</span> {translations("back")}
      </Link>

      <header className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/65">
          {campaign.name}
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          {translations("title")}
        </h1>
        <p className="mt-3 max-w-3xl text-white/80">
          {translations(
            isGameMaster ? "gameMasterDescription" : "playerDescription",
          )}
        </p>
      </header>

      <div className="mt-8">
        {imageError || managerLoadError ? (
          <section
            className="rounded-lg border border-red-300 bg-red-50 p-5 text-red-950"
            role="alert"
          >
            <h2 className="text-xl font-semibold">
              {translations("loadErrorTitle")}
            </h2>
            <p className="mt-2">{translations("loadError")}</p>
          </section>
        ) : isGameMaster ? (
          <CampaignHandoutsManager
            campaignId={campaign.id}
            currentUserId={userId}
            campaignActive={campaignActive}
            initialHandouts={managerItems}
            players={playerOptions}
          />
        ) : (
          <CampaignHandoutsViewer items={playerItems} />
        )}
      </div>
    </main>
  );
}
