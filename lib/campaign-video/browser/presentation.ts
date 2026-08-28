export function getCampaignVideoGridClass(participantCount: number): string {
  if (participantCount <= 1) return "grid-cols-1";
  if (participantCount <= 4) return "grid-cols-1 sm:grid-cols-2";
  return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
}
