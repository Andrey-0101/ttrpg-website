import { createCampaignVideoAuthorizationDataSource } from "@/lib/campaign-video/supabase-data-source.server";
import { parseCampaignId } from "@/lib/campaign-video/contracts";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string; imageId: string }> },
) {
  try {
    const { campaignId, imageId } = await params;
    if (!parseCampaignId(campaignId) || !parseCampaignId(imageId)) {
      return new Response(null, { status: 404, headers });
    }
    const source = await createCampaignVideoAuthorizationDataSource();
    if (!await source.getAuthenticatedUserId()) {
      return new Response(null, { status: 401, headers });
    }
    // The same authenticated client enforces image visibility at both the row and Storage.
    const path = await source.findCampaignImageStoragePath(campaignId, imageId);
    if (!path) return new Response(null, { status: 404, headers });
    const url = await source.createCampaignImageSignedUrl(path);
    if (!url) return new Response(null, { status: 503, headers });
    return new Response(null, { status: 302, headers: { ...headers, Location: url } });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
