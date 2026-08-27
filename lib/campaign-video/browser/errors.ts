import type { CampaignVideoClientErrorCode } from "./contracts";

export function classifyCampaignVideoMediaError(
  error: unknown,
): CampaignVideoClientErrorCode {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "permission_denied";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "device_unavailable";
  }
  return "media_unavailable";
}
