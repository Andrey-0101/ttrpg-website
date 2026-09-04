import "server-only";

import {
  CAMPAIGN_HANDOUT_BUCKET,
  CAMPAIGN_HANDOUT_SIGNED_URL_TTL,
} from "./contracts";
import { createClient } from "../../utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type LoadCampaignGalleryImagesOptions = {
  supabase: SupabaseServerClient;
  campaignId: string;
};

export async function createCampaignGallerySignedUrl({
  supabase,
  storageObjectName,
}: {
  supabase: SupabaseServerClient;
  storageObjectName: string;
}): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CAMPAIGN_HANDOUT_BUCKET)
    .createSignedUrl(
      storageObjectName,
      CAMPAIGN_HANDOUT_SIGNED_URL_TTL,
    );

  if (error) {
    console.error("Failed to create a Campaign Gallery display URL.");
    return null;
  }

  return data.signedUrl;
}

export async function loadCampaignGalleryImages({
  supabase,
  campaignId,
}: LoadCampaignGalleryImagesOptions) {
  const { data: imageRows, error } = await supabase
    .from("campaign_images")
    .select(
      "id, display_name, storage_object_name, visibility, category, created_at",
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    return { images: [], loadError: true } as const;
  }

  const images = await Promise.all(
    (imageRows ?? []).map(async (image) => {
      return {
        ...image,
        signedUrl: await createCampaignGallerySignedUrl({
          supabase,
          storageObjectName: image.storage_object_name,
        }),
      };
    }),
  );

  return { images, loadError: false } as const;
}
