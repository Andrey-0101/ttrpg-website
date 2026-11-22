import { SupabaseCampaignVideoAuthorizationDataSource } from "@/lib/campaign-video/supabase-data-source.server";
import { parseCampaignId } from "@/lib/campaign-video/contracts";
import { loadCampaignGalleryThumbnail } from "@/lib/campaign-handouts/gallery-thumbnail.server";
import { createClient } from "@/utils/supabase/server";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string; imageId: string }> },
) {
  try {
    const { campaignId, imageId } = await params;
    if (!parseCampaignId(campaignId) || !parseCampaignId(imageId)) {
      return new Response(null, { status: 404, headers });
    }
    const client = await createClient();
    const source = new SupabaseCampaignVideoAuthorizationDataSource(client);
    if (!await source.getAuthenticatedUserId()) {
      return new Response(null, { status: 401, headers });
    }
    // The same authenticated client enforces image visibility at both the row and Storage.
    const path = await source.findCampaignImageStoragePath(campaignId, imageId);
    if (!path) return new Response(null, { status: 404, headers });
    if (new URL(request.url).searchParams.get("variant") === "thumbnail") {
      const thumbnail = await loadCampaignGalleryThumbnail(client, imageId, path);
      if (!thumbnail) return new Response(null, { status: 503, headers });
      return new Response(Uint8Array.from(thumbnail), {
        headers: { ...headers, "Content-Type": "image/webp" },
      });
    }
    const url = await source.createCampaignImageSignedUrl(path);
    if (!url) return new Response(null, { status: 503, headers });
    return new Response(null, { status: 302, headers: { ...headers, Location: url } });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
