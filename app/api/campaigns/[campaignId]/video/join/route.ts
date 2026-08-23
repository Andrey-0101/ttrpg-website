import { getLiveKitServerConfiguration } from "@/lib/campaign-video/config.server";
import { createCampaignVideoJoinHandler } from "@/lib/campaign-video/join-handler";
import { LiveKitCampaignVideoProvider } from "@/lib/campaign-video/providers/livekit.server";
import { createCampaignVideoAuthorizationDataSource } from "@/lib/campaign-video/supabase-data-source.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const handleJoin = createCampaignVideoJoinHandler({
  createDataSource: createCampaignVideoAuthorizationDataSource,
  getConfiguration: getLiveKitServerConfiguration,
  createProvider: (configuration) =>
    new LiveKitCampaignVideoProvider(configuration),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
): Promise<Response> {
  return handleJoin(request, context);
}
