import { parseNoteMutation } from "@/lib/campaign-notes/contracts";
import {
  mutateCampaignNotes,
  notesResponse,
  readCampaignNotes,
} from "@/lib/campaign-notes/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const MAX_BODY_BYTES = 125000;
const CAMPAIGN_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ campaignId: string }> },
): Promise<Response> {
  const { campaignId } = await context.params;
  if (!CAMPAIGN_ID.test(campaignId))
    return notesResponse({ ok: false, error: "campaign_inaccessible" }, 404);
  return readCampaignNotes(campaignId);
}
export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
): Promise<Response> {
  let mutation;
  try {
    if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
      throw new Error("oversized");
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES)
      throw new Error("oversized");
    mutation = parseNoteMutation(JSON.parse(text));
  } catch {
    mutation = null;
  }
  if (!mutation)
    return notesResponse({ ok: false, error: "malformed_request" }, 400);
  const { campaignId } = await context.params;
  if (!CAMPAIGN_ID.test(campaignId))
    return notesResponse({ ok: false, error: "campaign_inaccessible" }, 404);
  return mutateCampaignNotes(campaignId, mutation);
}
