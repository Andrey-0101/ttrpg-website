import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getGameSystemName } from "@/lib/characters/game-systems";
import { createClient } from "@/utils/supabase/server";

type CampaignPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: CampaignPageProps): Promise<Metadata> {
  const { locale: requestedLocale, id } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    return {
      title: translations("campaignDetails"),
    };
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: campaign?.name || translations("campaignDetails"),
  };
}

export default async function CampaignPage({
  params,
}: CampaignPageProps) {
  const { locale: requestedLocale, id } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "CampaignDetails",
  });
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect({
      href: "/login",
      locale,
    });
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      "id, name, description, game_system, status, game_master_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load campaign:", error);
  }

  if (error || !campaign) {
    notFound();
  }

  const [gameMasterProfileResult, playerCountResult, characterCountResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", campaign.game_master_id)
        .maybeSingle(),
      supabase
        .from("campaign_members")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id),
      supabase
        .from("campaign_characters")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .is("unlinked_at", null),
    ]);

  if (gameMasterProfileResult.error) {
    console.error(
      "Failed to load campaign Game Master profile:",
      gameMasterProfileResult.error,
    );
  }

  if (playerCountResult.error) {
    console.error("Failed to load campaign Player count:", playerCountResult.error);
  }

  if (characterCountResult.error) {
    console.error(
      "Failed to load campaign character count:",
      characterCountResult.error,
    );
  }

  const isGameMaster = campaign.game_master_id === userId;
  const gameMasterProfile = gameMasterProfileResult.data;
  const gameMasterName = isGameMaster
    ? translations("you")
    : gameMasterProfile?.display_name ||
      gameMasterProfile?.username ||
      translations("gameMasterFallback");
  const statusLabel =
    campaign.status === "completed"
      ? translations("status.completed")
      : translations("status.active");
  const roleLabel = isGameMaster
    ? translations("role.gameMaster")
    : translations("role.player");
  const createdDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(campaign.created_at));

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-3 py-6 sm:px-6 lg:p-8">
      <Link href="/campaigns">
        <span aria-hidden="true">&larr;</span> {translations("back")}
      </Link>

      <section className="mt-6 overflow-hidden rounded-lg border border-neutral-300 bg-white text-neutral-950 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-neutral-300 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-bold sm:text-4xl">
              {campaign.name}
            </h1>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words text-neutral-700">
              {campaign.description?.trim() || translations("noDescription")}
            </p>
          </div>

          <span
            className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              campaign.status === "completed"
                ? "bg-neutral-200 text-neutral-700"
                : "bg-emerald-100 text-emerald-900"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <dl className="grid gap-px bg-neutral-300 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 bg-neutral-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {translations("gameSystem")}
            </dt>
            <dd className="mt-1 break-words font-medium">
              {getGameSystemName(campaign.game_system)}
            </dd>
          </div>

          <div className="min-w-0 bg-neutral-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {translations("yourRole")}
            </dt>
            <dd className="mt-1 break-words font-medium">{roleLabel}</dd>
          </div>

          <div className="min-w-0 bg-neutral-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {translations("gameMaster")}
            </dt>
            <dd className="mt-1 break-words font-medium">{gameMasterName}</dd>
          </div>

          <div className="min-w-0 bg-neutral-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {translations("created")}
            </dt>
            <dd className="mt-1 break-words font-medium">{createdDate}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-lg border border-white/25 bg-black/20 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/65">
            {translations("players")}
          </p>
          <p className="mt-2 text-4xl font-bold">
            {playerCountResult.count ?? 0}
          </p>
          <p className="mt-2 text-sm text-white/75">
            {translations("playersHelp")}
          </p>
        </article>

        <article className="rounded-lg border border-white/25 bg-black/20 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/65">
            {translations("linkedCharacters")}
          </p>
          <p className="mt-2 text-4xl font-bold">
            {characterCountResult.count ?? 0}
          </p>
          <p className="mt-2 text-sm text-white/75">
            {translations("linkedCharactersHelp")}
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-lg border border-white/25 bg-black/20 p-5 sm:p-6">
        <h2 className="text-2xl font-bold">{translations("nextTitle")}</h2>
        <p className="mt-2 max-w-3xl text-white/80">
          {campaign.status === "completed"
            ? translations("completedHelp")
            : translations("nextDescription")}
        </p>
      </section>
    </main>
  );
}
