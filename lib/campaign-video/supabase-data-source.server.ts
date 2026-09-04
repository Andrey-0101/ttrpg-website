import "server-only";

import { isAuthSessionMissingError } from "@supabase/supabase-js";

import { createClient } from "../../utils/supabase/server";
import { createCampaignGallerySignedUrl } from "../campaign-handouts/gallery.server";
import type {
  CampaignVideoAuthorizationDataSource,
  CampaignVideoCampaignRecord,
  CampaignVideoPlayerRecord,
  CampaignVideoPublicationRecord,
} from "./authorization";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function requireNoError(error: unknown): void {
  if (error) throw new Error("campaign_video_data_unavailable");
}

export class SupabaseCampaignVideoAuthorizationDataSource
  implements CampaignVideoAuthorizationDataSource
{
  constructor(private readonly client: SupabaseServerClient) {}

  async getAuthenticatedUserId(): Promise<string | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error) {
      if (isAuthSessionMissingError(error)) return null;
      throw new Error("campaign_video_auth_unavailable");
    }
    return data.user?.id ?? null;
  }

  async findCampaign(
    campaignId: string,
  ): Promise<CampaignVideoCampaignRecord | null> {
    const { data, error } = await this.client
      .from("campaigns")
      .select("id,status,game_master_id")
      .eq("id", campaignId)
      .maybeSingle();
    requireNoError(error);
    return data
      ? { id: data.id, status: data.status, gameMasterId: data.game_master_id }
      : null;
  }

  async findPlayer(
    campaignId: string,
    userId: string,
  ): Promise<CampaignVideoPlayerRecord | null> {
    const { data, error } = await this.client
      .from("campaign_members")
      .select("display_order")
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)
      .maybeSingle();
    requireNoError(error);
    return data ? { displayOrder: data.display_order } : null;
  }

  async findPlayerPublication(
    campaignId: string,
    userId: string,
  ): Promise<CampaignVideoPublicationRecord | null> {
    const { data, error } = await this.client
      .from("campaign_player_publication_permissions")
      .select("audio_allowed,video_allowed")
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)
      .maybeSingle();
    requireNoError(error);
    return data
      ? {
          audioAllowed: data.audio_allowed,
          videoAllowed: data.video_allowed,
        }
      : null;
  }

  async findCampaignImageStoragePath(
    campaignId: string,
    imageId: string,
  ): Promise<string | null> {
    const { data, error } = await this.client
      .from("campaign_images")
      .select("storage_object_name")
      .eq("campaign_id", campaignId)
      .eq("id", imageId)
      .maybeSingle();
    requireNoError(error);
    return data?.storage_object_name ?? null;
  }

  createCampaignImageSignedUrl(storagePath: string): Promise<string | null> {
    return createCampaignGallerySignedUrl({
      supabase: this.client,
      storageObjectName: storagePath,
    });
  }
}

export async function createCampaignVideoAuthorizationDataSource() {
  return new SupabaseCampaignVideoAuthorizationDataSource(await createClient());
}
