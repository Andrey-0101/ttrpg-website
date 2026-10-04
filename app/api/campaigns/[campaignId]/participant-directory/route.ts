import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { parseCampaignId } from "@/lib/campaign-video/contracts";
import { loadCampaignParticipantDirectory } from "@/lib/campaign-video/participant-directory.server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HEADERS = { "Cache-Control": "no-store" };

export async function GET(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
): Promise<Response> {
  const { campaignId } = await context.params;
  if (!parseCampaignId(campaignId)) {
    return Response.json({ ok: false }, { status: 400, headers: HEADERS });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) {
    return Response.json({ ok: false }, { status: 401, headers: HEADERS });
  }
  // The user-scoped client's campaign SELECT is protected by the existing RLS.
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, game_system, game_master_id")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError) {
    console.error(
      "Failed to authorize campaign participant directory refresh.",
    );
    return Response.json({ ok: false }, { status: 500, headers: HEADERS });
  }
  if (!campaign) {
    return Response.json({ ok: false }, { status: 404, headers: HEADERS });
  }
  const requestedLocale = new URL(request.url).searchParams.get("locale");
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const [campaignTranslations, videoTranslations] = await Promise.all([
    getTranslations({ locale, namespace: "CampaignDetails" }),
    getTranslations({ locale, namespace: "CampaignVideoRoom" }),
  ]);
  const result = await loadCampaignParticipantDirectory({
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
  if (!result.ready) {
    console.error("Failed to refresh campaign participant directory.");
    return Response.json({ ok: false }, { status: 503, headers: HEADERS });
  }
  // Return only the same safe directory already supplied by the Game Room page.
  return Response.json(
    { ok: true, participantDirectory: result.participantDirectory },
    { headers: HEADERS },
  );
}
