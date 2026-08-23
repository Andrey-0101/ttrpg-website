import type { CampaignVideoTrackAttachment } from "./contracts";

export function attachCampaignVideoTrack(
  track: CampaignVideoTrackAttachment | null,
  element: HTMLMediaElement | null,
): () => void {
  if (!track || !element) return () => undefined;
  track.attach(element);
  return () => track.detach(element);
}
