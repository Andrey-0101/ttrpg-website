import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import CharacterEditor from "@/components/characters/character-editor";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getCharacterPortraitSignedUrl } from "@/lib/characters/portrait";
import { createClient } from "@/utils/supabase/server";

type CampaignCharacterPageProps = {
  params: Promise<{
    locale: string;
    id: string;
    characterId: string;
  }>;
};

export async function generateMetadata({
  params,
}: CampaignCharacterPageProps): Promise<Metadata> {
  const { locale: requestedLocale, characterId } = await params;
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
      title: translations("characterDetails"),
    };
  }

  const { data: character } = await supabase
    .from("characters")
    .select("name")
    .eq("id", characterId)
    .maybeSingle();

  return {
    title: character?.name || translations("characterDetails"),
  };
}

export default async function CampaignCharacterPage({
  params,
}: CampaignCharacterPageProps) {
  const { locale: requestedLocale, id: campaignId, characterId } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "CampaignCharacterDetails",
  });
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? "";

  if (claimsError || !userId) {
    redirect({
      href: "/login",
      locale,
    });
  }

  const [campaignResult, assignmentResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, status")
      .eq("id", campaignId)
      .maybeSingle(),
    supabase
      .from("campaign_characters")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("character_id", characterId)
      .is("unlinked_at", null)
      .maybeSingle(),
  ]);

  if (campaignResult.error) {
    console.error(
      "Failed to load campaign for shared character:",
      campaignResult.error,
    );
  }

  if (assignmentResult.error) {
    console.error(
      "Failed to load campaign character assignment:",
      assignmentResult.error,
    );
  }

  if (
    campaignResult.error ||
    assignmentResult.error ||
    !campaignResult.data ||
    !assignmentResult.data
  ) {
    notFound();
  }

  const { data: character, error: characterError } = await supabase
    .from("characters")
    .select(
      "id, name, owner_id, game_system, visibility, sheet_data, portrait_url",
    )
    .eq("id", characterId)
    .maybeSingle();

  if (characterError) {
    console.error("Failed to load shared campaign character:", characterError);
  }

  if (characterError || !character) {
    notFound();
  }

  const portraitSignedUrl = await getCharacterPortraitSignedUrl(
    supabase,
    character.portrait_url,
  );
  const isOwner = character.owner_id === userId;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-3 py-6 sm:px-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/campaigns/${campaignResult.data.id}`}>
          <span aria-hidden="true">&larr;</span>{" "}
          {translations("back", {
            campaign: campaignResult.data.name,
          })}
        </Link>

        {isOwner && (
          <Link
            href={`/characters/${character.id}`}
            className="w-full rounded border border-white/70 px-4 py-2 text-center text-sm font-semibold hover:bg-white/10 sm:w-auto"
          >
            {translations("editOwned")}
          </Link>
        )}
      </div>

      <CharacterEditor
        character={{
          ...character,
          portraitSignedUrl,
        }}
        readOnly
      />
    </main>
  );
}
