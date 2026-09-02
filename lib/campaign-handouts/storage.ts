import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import {
  CAMPAIGN_HANDOUT_BUCKET,
  splitCampaignHandoutPath,
} from "./contracts";
import type { CampaignHandoutStorageDependencies } from "./workflows";

export function createCampaignHandoutStorageDependencies(
  supabase: SupabaseClient<Database>,
): CampaignHandoutStorageDependencies {
  const bucket = supabase.storage.from(CAMPAIGN_HANDOUT_BUCKET);

  return {
    removeObjectPaths: async (paths) => {
      const { error } = await bucket.remove(paths);
      return { error };
    },
    objectExists: async (path) => {
      const parts = splitCampaignHandoutPath(path);

      if (!parts) {
        return null;
      }

      const { data, error } = await bucket.list(parts.folder, {
        limit: 100,
        search: parts.fileName,
      });

      if (error) {
        return null;
      }

      return (data ?? []).some((object) => object.name === parts.fileName);
    },
  };
}
