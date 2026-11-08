import { normalizeGameSystemId, type GameSystemId } from "../characters/game-systems";

const CAMPAIGN_ROLE_KEYS = {
  "call-of-cthulhu-7e": "keeper",
  "vtm-v5": "storyteller",
} as const satisfies Partial<Record<GameSystemId, string>>;

type CampaignRoleKey = (typeof CAMPAIGN_ROLE_KEYS)[keyof typeof CAMPAIGN_ROLE_KEYS] | "gameMaster";
type CampaignRoleForm = "name" | "genitive" | "dative";
export type CampaignRoleMessageKey = `${CampaignRoleKey}.${CampaignRoleForm}`;

/** Presentation only: internal roles, participant identity and permissions are unchanged. */
export function resolveCampaignGameMasterRole(
  gameSystem: string | null | undefined,
  translate: (key: CampaignRoleMessageKey) => string,
) {
  const systemId = typeof gameSystem === "string" ? normalizeGameSystemId(gameSystem) : null;
  const key = systemId && Object.hasOwn(CAMPAIGN_ROLE_KEYS, systemId)
    ? CAMPAIGN_ROLE_KEYS[systemId as keyof typeof CAMPAIGN_ROLE_KEYS]
    : "gameMaster";
  return {
    role: translate(`${key}.name`),
    roleGenitive: translate(`${key}.genitive`),
    roleDative: translate(`${key}.dative`),
  };
}
