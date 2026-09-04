import { getLiveKitServerConfiguration } from "@/lib/campaign-video/config.server";
import { createCampaignVideoPresentationHandler } from "@/lib/campaign-video/presentation-handler";
import { LiveKitCampaignVideoPresentationPublisher } from "@/lib/campaign-video/providers/livekit-presentation.server";
import { createCampaignVideoAuthorizationDataSource } from "@/lib/campaign-video/supabase-data-source.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const handlePresentation = createCampaignVideoPresentationHandler({
  createDataSource: createCampaignVideoAuthorizationDataSource,
  getConfiguration: getLiveKitServerConfiguration,
  createPublisher: (configuration) =>
    new LiveKitCampaignVideoPresentationPublisher(configuration),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
): Promise<Response> {
  return handlePresentation(request, context);
}
