import { CAMPAIGN_HANDOUT_DISPLAY_NAME_MAX_LENGTH, type CampaignGalleryCategory } from "./contracts";

export type CampaignGalleryFolder = { id: string; category: CampaignGalleryCategory; name: string };
export type CampaignGalleryLocation = { image_id: string; folder_id: string };

/** Matches SQL btrim's explicit ECMAScript whitespace set and PostgreSQL char_length. */
export function normalizeCampaignGalleryName(value: string): string | null {
  const name = value.trim();
  return name.length > 0 && Array.from(name).length <= CAMPAIGN_HANDOUT_DISPLAY_NAME_MAX_LENGTH
    && !/[\u0000-\u001f\u007f-\u009f]/u.test(name) ? name : null;
}

export function galleryImageIsInFolder(imageId: string, locations: readonly CampaignGalleryLocation[], folderId: string | null) {
  return (locations.find((location) => location.image_id === imageId)?.folder_id ?? null) === folderId;
}
