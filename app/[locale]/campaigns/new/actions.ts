"use server";

import { createCampaign } from "@/lib/campaigns/creation.server";

export async function createCampaignAction(input: unknown) {
  return createCampaign(input);
}
