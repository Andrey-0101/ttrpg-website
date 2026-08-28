import {
  getGameSystemCatalogueEntry,
  hasAvailableGameSystemCapability,
  type AvailableCampaignCreationSystemId,
} from "../game-systems/catalogue";

export const CAMPAIGN_NAME_MAX_LENGTH = 120;
export const CAMPAIGN_DESCRIPTION_MAX_LENGTH = 4000;

export type ValidatedCampaignCreationInput = {
  name: string;
  description: string | null;
  gameSystem: AvailableCampaignCreationSystemId;
};

export type CampaignCreationValidationResult =
  | {
      ok: true;
      value: ValidatedCampaignCreationInput;
    }
  | {
      ok: false;
      error: "invalid_input" | "game_system_unavailable";
    };

export function validateCampaignCreationInput(
  input: unknown,
): CampaignCreationValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "invalid_input" };
  }

  const candidate = input as Record<string, unknown>;

  if (
    typeof candidate.name !== "string" ||
    typeof candidate.description !== "string" ||
    typeof candidate.gameSystem !== "string"
  ) {
    return { ok: false, error: "invalid_input" };
  }

  const name = candidate.name.trim();
  const description = candidate.description.trim();

  if (
    name.length === 0 ||
    name.length > CAMPAIGN_NAME_MAX_LENGTH ||
    candidate.description.length > CAMPAIGN_DESCRIPTION_MAX_LENGTH
  ) {
    return { ok: false, error: "invalid_input" };
  }

  const gameSystem = getGameSystemCatalogueEntry(candidate.gameSystem);

  if (
    !gameSystem ||
    !hasAvailableGameSystemCapability(gameSystem, "campaignCreation")
  ) {
    return { ok: false, error: "game_system_unavailable" };
  }

  return {
    ok: true,
    value: {
      name,
      description: description || null,
      gameSystem: gameSystem.id,
    },
  };
}
