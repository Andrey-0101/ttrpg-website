import "server-only";

import type { createClient } from "../../utils/supabase/server";

export type CampaignRosterMember = {
  userId: string;
  label: string;
  joinedAt: string;
};

/** The campaign-authorized RPC is the single name-resolution boundary. */
export async function loadCampaignOverviewRoster({ supabase, campaignId }: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  campaignId: string;
}): Promise<{ ready: boolean; members: CampaignRosterMember[] }> {
  try {
    const { data, error } = await supabase.rpc("get_campaign_roster_players", {
      target_campaign_id: campaignId,
    });
    if (error || !Array.isArray(data)) return { ready: false, members: [] };

    const members: CampaignRosterMember[] = [];
    for (const row of data) {
      // An unavailable account label is a load error, never a fabricated name/ID.
      if (typeof row.display_label !== "string" || !row.display_label.trim()) {
        return { ready: false, members: [] };
      }
      members.push({ userId: row.participant_id, label: row.display_label, joinedAt: row.joined_at });
    }
    return { ready: true, members };
  } catch {
    return { ready: false, members: [] };
  }
}
