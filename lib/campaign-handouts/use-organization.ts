"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { isCampaignGalleryCategory, type CampaignGalleryCategory } from "./contracts";
import { normalizeCampaignGalleryName, type CampaignGalleryFolder, type CampaignGalleryLocation } from "./organization";

export function useCampaignGalleryOrganization(campaignId: string, enabled = true) {
  const [folders, setFolders] = useState<CampaignGalleryFolder[]>([]);
  const [locations, setLocations] = useState<CampaignGalleryLocation[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(enabled);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [loadedCampaignId, setLoadedCampaignId] = useState<string | null>(null);
  const currentCampaignLoaded = loadedCampaignId === campaignId;
  const canMutate = enabled && currentCampaignLoaded && !loading && !loadError;

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const supabase = createClient();
    void Promise.all([
      supabase.from("campaign_gallery_folders").select("id, category, name").eq("campaign_id", campaignId).order("name"),
      supabase.from("campaign_gallery_locations").select("image_id, folder_id").eq("campaign_id", campaignId),
    ]).then(([folderResult, locationResult]) => {
      if (!active) return;
      if (folderResult.error || locationResult.error) setLoadError(true);
      else {
        setFolders((folderResult.data ?? []).flatMap((folder) => isCampaignGalleryCategory(folder.category)
          ? [{ ...folder, category: folder.category }] : []));
        setLocations(locationResult.data ?? []);
        setLoadError(false);
      }
      setLoadedCampaignId(campaignId);
      setLoading(false);
    }).catch(() => { if (active) { setLoadedCampaignId(campaignId); setLoadError(true); setLoading(false); } });
    return () => { active = false; };
  }, [campaignId, enabled, reload]);

  function retry() { setLoading(true); setLoadError(false); setReload((value) => value + 1); }

  async function saveFolder(category: CampaignGalleryCategory, value: string, folderId?: string) {
    const name = normalizeCampaignGalleryName(value);
    if (!canMutate || !name) throw new Error("gallery_mutation_unavailable");
    const { data, error } = await createClient().rpc("save_campaign_gallery_folder", {
      target_campaign_id: campaignId, target_category: category, target_name: name,
      ...(folderId ? { target_folder_id: folderId } : {}),
    });
    if (error || typeof data !== "string") throw new Error("gallery_mutation_failed");
    const folder: CampaignGalleryFolder = { id: data, name, category };
    setFolders((current) => [...current.filter((item) => item.id !== folder.id), folder]);
  }

  async function renameImage(imageId: string, value: string) {
    const name = normalizeCampaignGalleryName(value);
    if (!canMutate || !name) throw new Error("gallery_mutation_unavailable");
    const { data, error } = await createClient().rpc("rename_campaign_gallery_image", { target_image_id: imageId, target_name: name });
    if (error || typeof data !== "string") throw new Error("gallery_mutation_failed");
    setNames((current) => ({ ...current, [imageId]: data }));
  }

  async function moveImage(imageId: string, folderId: string | null) {
    if (!canMutate) throw new Error("gallery_mutation_unavailable");
    const { error } = await createClient().rpc("move_campaign_gallery_image", {
      target_image_id: imageId, ...(folderId ? { target_folder_id: folderId } : {}),
    });
    if (error) throw new Error("gallery_mutation_failed");
    setLocations((current) => [...current.filter((item) => item.image_id !== imageId),
      ...(folderId ? [{ image_id: imageId, folder_id: folderId }] : [])]);
  }

  return {
    folders: enabled && currentCampaignLoaded ? folders : [],
    locations: enabled && currentCampaignLoaded ? locations : [],
    names: enabled && currentCampaignLoaded ? names : {},
    loading: enabled && (loading || !currentCampaignLoaded),
    loadError: enabled && currentCampaignLoaded && loadError,
    retry, saveFolder, renameImage, moveImage,
  };
}

export type CampaignGalleryOrganization = ReturnType<typeof useCampaignGalleryOrganization>;
