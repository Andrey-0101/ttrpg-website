import { rollCampaignDice } from "@/lib/campaign-dice/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_BODY_BYTES = 32_768;

export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return Response.json(
      { ok: false, error: { code: "malformed_request" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      throw new Error("Request is too large.");
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return Response.json(
      { ok: false, error: { code: "malformed_request" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { campaignId } = await context.params;
  return rollCampaignDice(campaignId, body);
}
