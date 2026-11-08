type ParticipantLabelOptions = {
  role: "game_master" | "player";
  profileName: string | null;
  characterName: string | null;
  labels: {
    profileFallback: string;
    characterFallback: string;
    gameMasterRole: string;
  };
};

export function resolveCampaignVideoParticipantLabel({
  role, profileName, characterName, labels,
}: ParticipantLabelOptions): string {
  const profile = profileName?.trim() || labels.profileFallback;
  const character = role === "game_master"
    ? labels.gameMasterRole
    : characterName?.trim() || labels.characterFallback;
  return `${profile} aka ${character}`;
}
