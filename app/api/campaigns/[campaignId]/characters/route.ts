import { getGameRoomCharacters } from "@/lib/campaign-characters/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ campaignId: string }> }): Promise<Response> {
  const { campaignId } = await context.params;
  return getGameRoomCharacters(campaignId);
}
