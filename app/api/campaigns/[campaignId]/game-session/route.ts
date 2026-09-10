import { parseGameSessionAction } from "@/lib/game-sessions/contracts";
import {
  getGameSessionState,
  mutateGameSession,
} from "@/lib/game-sessions/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_BODY_BYTES = 256;

export async function GET(
  _request: Request,
  context: { params: Promise<{ campaignId: string }> },
): Promise<Response> {
  const { campaignId } = await context.params;
  return getGameSessionState(campaignId);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
): Promise<Response> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return Response.json(
      { ok: false, error: { code: "malformed_request" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      throw new Error("oversized");
    }
    body = JSON.parse(text);
  } catch {
    return Response.json(
      { ok: false, error: { code: "malformed_request" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const action = parseGameSessionAction(body);
  if (!action) {
    return Response.json(
      { ok: false, error: { code: "malformed_request" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { campaignId } = await context.params;
  return mutateGameSession(campaignId, action);
}
