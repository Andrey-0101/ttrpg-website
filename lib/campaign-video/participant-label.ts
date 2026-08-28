export type CampaignVideoCharacterLabelCandidate = {
  name: string;
  gameSystem: string;
};

type ResolveCampaignVideoParticipantLabelOptions = {
  role: "game_master" | "player";
  campaignGameSystem: string;
  linkedCharacters: CampaignVideoCharacterLabelCandidate[];
  siteNickname: string | null;
  gameMasterLabel: string;
  playerFallback: string;
};

function nonEmpty(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function resolveCampaignVideoParticipantLabel({
  role,
  campaignGameSystem,
  linkedCharacters,
  siteNickname,
  gameMasterLabel,
  playerFallback,
}: ResolveCampaignVideoParticipantLabelOptions) {
  if (role === "game_master") {
    return gameMasterLabel;
  }

  const compatibleCharacter = linkedCharacters.find(
    (character) =>
      character.gameSystem === campaignGameSystem && nonEmpty(character.name),
  );

  return (
    nonEmpty(compatibleCharacter?.name) ??
    nonEmpty(siteNickname) ??
    playerFallback
  );
}
