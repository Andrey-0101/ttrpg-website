export const CAMPAIGN_HANDOUT_BUCKET = "campaign-images";
export const CAMPAIGN_HANDOUT_MAX_BYTES = 5 * 1024 * 1024;
export const CAMPAIGN_HANDOUT_ACCEPT = "image/jpeg,image/png,image/webp";
export const CAMPAIGN_HANDOUT_SIGNED_URL_TTL = 60 * 60;
export const CAMPAIGN_HANDOUT_DISPLAY_NAME_MAX_LENGTH = 255;

export const CAMPAIGN_GALLERY_CATEGORIES = [
  "handout",
  "npc",
  "maps_plans",
  "other",
] as const;

export type CampaignGalleryCategory =
  (typeof CAMPAIGN_GALLERY_CATEGORIES)[number];

export const CAMPAIGN_HANDOUT_VISIBILITIES = [
  "gm_only",
  "all_active_players",
  "selected_active_players",
] as const;

export type CampaignHandoutVisibility =
  (typeof CAMPAIGN_HANDOUT_VISIBILITIES)[number];

export type CampaignHandoutFileValidationError =
  | "empty"
  | "invalid_type"
  | "too_large";

type CampaignHandoutFile = Pick<File, "name" | "size" | "type">;

const HANDOUT_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/gu;
const KNOWN_FILE_EXTENSION = /\.(?:jpe?g|png|webp)$/iu;

export function validateCampaignHandoutFile(
  file: CampaignHandoutFile,
): CampaignHandoutFileValidationError | null {
  if (!HANDOUT_EXTENSIONS[file.type]) {
    return "invalid_type";
  }

  if (file.size <= 0) {
    return "empty";
  }

  if (file.size > CAMPAIGN_HANDOUT_MAX_BYTES) {
    return "too_large";
  }

  return null;
}

export function createCampaignHandoutDisplayName(fileName: string): string {
  const normalized = fileName
    .replace(CONTROL_CHARACTERS, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(KNOWN_FILE_EXTENSION, "")
    .trim();

  return (normalized || "Handout").slice(
    0,
    CAMPAIGN_HANDOUT_DISPLAY_NAME_MAX_LENGTH,
  );
}

export function createCampaignHandoutPath({
  campaignId,
  imageId,
  objectId,
  mimeType,
}: {
  campaignId: string;
  imageId: string;
  objectId: string;
  mimeType: string;
}): string {
  const extension = HANDOUT_EXTENSIONS[mimeType];

  if (!extension) {
    throw new Error("Unsupported campaign handout MIME type.");
  }

  return `${campaignId}/${imageId}/${objectId}.${extension}`;
}

export function splitCampaignHandoutPath(path: string): {
  folder: string;
  fileName: string;
} | null {
  const segments = path.split("/");

  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    return null;
  }

  return {
    folder: `${segments[0]}/${segments[1]}`,
    fileName: segments[2],
  };
}

export function isCampaignHandoutVisibility(
  value: string,
): value is CampaignHandoutVisibility {
  return CAMPAIGN_HANDOUT_VISIBILITIES.some(
    (visibility) => visibility === value,
  );
}

export function isCampaignGalleryCategory(
  value: string,
): value is CampaignGalleryCategory {
  return CAMPAIGN_GALLERY_CATEGORIES.some((category) => category === value);
}
