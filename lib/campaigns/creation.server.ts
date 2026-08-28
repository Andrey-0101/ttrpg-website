import "server-only";

import { validateCampaignCreationInput } from "./creation";
import { createClient } from "../../utils/supabase/server";

export type CreateCampaignResult =
  | {
      ok: true;
      campaignId: string;
    }
  | {
      ok: false;
      error:
        | "invalid_input"
        | "game_system_unavailable"
        | "unauthenticated"
        | "create_failed";
    };

export async function createCampaign(
  input: unknown,
): Promise<CreateCampaignResult> {
  const validation = validateCampaignCreationInput(input);

  if (!validation.ok) {
    return validation;
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { ok: false, error: "unauthenticated" };
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      game_master_id: userData.user.id,
      game_system: validation.value.gameSystem,
      name: validation.value.name,
      description: validation.value.description,
    })
    .select("id")
    .single();

  if (error || !campaign) {
    console.error("Failed to create campaign.");
    return { ok: false, error: "create_failed" };
  }

  return { ok: true, campaignId: campaign.id };
}
