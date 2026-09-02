const STORAGE_DELETE_BATCH_SIZE = 100;

export type CampaignHandoutStorageDependencies = {
  removeObjectPaths: (paths: string[]) => Promise<{ error: unknown | null }>;
  objectExists: (path: string) => Promise<boolean | null>;
};

export type CampaignHandoutCleanupResult =
  | { ok: true }
  | { ok: false; error: "storage_cleanup_unverified" };

export async function removeAndVerifyCampaignHandoutObjects(
  paths: string[],
  dependencies: CampaignHandoutStorageDependencies,
): Promise<CampaignHandoutCleanupResult> {
  const uniquePaths = Array.from(new Set(paths));

  for (
    let offset = 0;
    offset < uniquePaths.length;
    offset += STORAGE_DELETE_BATCH_SIZE
  ) {
    const batch = uniquePaths.slice(offset, offset + STORAGE_DELETE_BATCH_SIZE);

    try {
      await dependencies.removeObjectPaths(batch);
    } catch {
      // Verification below remains authoritative. A missing object is success.
    }
  }

  for (const path of uniquePaths) {
    try {
      if ((await dependencies.objectExists(path)) !== false) {
        return { ok: false, error: "storage_cleanup_unverified" };
      }
    } catch {
      return { ok: false, error: "storage_cleanup_unverified" };
    }
  }

  return { ok: true };
}

export async function rollbackFailedCampaignHandoutUpload({
  imageId,
  storagePath,
  storage,
  deleteMetadata,
}: {
  imageId: string;
  storagePath: string;
  storage: CampaignHandoutStorageDependencies;
  deleteMetadata: (imageId: string) => Promise<boolean>;
}): Promise<CampaignHandoutCleanupResult> {
  const storageResult = await removeAndVerifyCampaignHandoutObjects(
    [storagePath],
    storage,
  );

  if (!storageResult.ok) {
    return storageResult;
  }

  try {
    return (await deleteMetadata(imageId))
      ? { ok: true }
      : { ok: false, error: "storage_cleanup_unverified" };
  } catch {
    return { ok: false, error: "storage_cleanup_unverified" };
  }
}

export async function deleteCampaignHandoutStorageFirst({
  imageId,
  storagePath,
  storage,
  deleteMetadata,
}: {
  imageId: string;
  storagePath: string;
  storage: CampaignHandoutStorageDependencies;
  deleteMetadata: (imageId: string) => Promise<boolean>;
}): Promise<CampaignHandoutCleanupResult> {
  return rollbackFailedCampaignHandoutUpload({
    imageId,
    storagePath,
    storage,
    deleteMetadata,
  });
}

export async function deleteCampaignWithHandoutsStorageFirst({
  storagePaths,
  storage,
  deleteCampaign,
}: {
  storagePaths: string[];
  storage: CampaignHandoutStorageDependencies;
  deleteCampaign: () => Promise<boolean>;
}): Promise<CampaignHandoutCleanupResult> {
  const storageResult = await removeAndVerifyCampaignHandoutObjects(
    storagePaths,
    storage,
  );

  if (!storageResult.ok) {
    return storageResult;
  }

  try {
    return (await deleteCampaign())
      ? { ok: true }
      : { ok: false, error: "storage_cleanup_unverified" };
  } catch {
    return { ok: false, error: "storage_cleanup_unverified" };
  }
}
