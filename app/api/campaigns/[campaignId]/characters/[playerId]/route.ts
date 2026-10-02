import { getGameRoomCharacters } from "@/lib/campaign-characters/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ campaignId: string; playerId: string }> }): Promise<Response> {
  const { campaignId, playerId } = await context.params;
  return getGameRoomCharacters(campaignId, playerId);
}
