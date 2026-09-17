const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export const CHARACTER_CAMPAIGN_CONTEXT_PARAM = "fromCampaign";

export function getCharacterBackHref(
  campaignContext: string | string[] | undefined,
): string {
  return typeof campaignContext === "string" && UUID_PATTERN.test(campaignContext)
    ? `/campaigns/${campaignContext}`
    : "/characters";
}

export function getCampaignCharacterOwnerEditHref(
  characterId: string,
  campaignId: string,
): string {
  const query = new URLSearchParams({
    [CHARACTER_CAMPAIGN_CONTEXT_PARAM]: campaignId,
  });

  return `/characters/${characterId}?${query.toString()}`;
}
