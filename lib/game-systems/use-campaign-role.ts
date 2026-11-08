"use client";

import { useTranslations } from "next-intl";
import { resolveCampaignGameMasterRole } from "./campaign-role";

export function useCampaignGameMasterRole(gameSystem: string) {
  return resolveCampaignGameMasterRole(gameSystem, useTranslations("CampaignRoles"));
}
