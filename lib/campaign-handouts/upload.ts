import {
  createCampaignHandoutDisplayName,
  createCampaignHandoutPath,
  validateCampaignHandoutFile,
  type CampaignHandoutFileValidationError,
} from "./contracts";

export type CampaignHandoutUploadFile = Pick<
  File,
  "name" | "size" | "type"
>;

export type CampaignHandoutUploadFailure =
  | CampaignHandoutFileValidationError
  | "metadata_failed"
  | "upload_failed"
  | "cleanup_unverified";

export type CampaignHandoutUploadMetadata = {
  id: string;
  campaign_id: string;
  uploader_id: string;
  storage_object_name: string;
  display_name: string;
  mime_type: string;
  byte_size: number;
  visibility: "gm_only";
};

export type CampaignHandoutUploadDependencies<TFile> = {
  createId: () => string;
  insertMetadata: (
    metadata: CampaignHandoutUploadMetadata,
  ) => Promise<boolean>;
  uploadObject: (storagePath: string, file: TFile) => Promise<boolean>;
  rollbackUpload: (imageId: string, storagePath: string) => Promise<boolean>;
};

export type CampaignHandoutUploadResult =
  | { ok: true; imageId: string; storagePath: string }
  | { ok: false; error: CampaignHandoutUploadFailure };

export async function uploadCampaignHandoutFile<
  TFile extends CampaignHandoutUploadFile,
>({
  campaignId,
  uploaderId,
  file,
  dependencies,
}: {
  campaignId: string;
  uploaderId: string;
  file: TFile;
  dependencies: CampaignHandoutUploadDependencies<TFile>;
}): Promise<CampaignHandoutUploadResult> {
  const validationError = validateCampaignHandoutFile(file);

  if (validationError) {
    return { ok: false, error: validationError };
  }

  const imageId = dependencies.createId();
  const storagePath = createCampaignHandoutPath({
    campaignId,
    imageId,
    objectId: dependencies.createId(),
    mimeType: file.type,
  });

  try {
    const inserted = await dependencies.insertMetadata({
      id: imageId,
      campaign_id: campaignId,
      uploader_id: uploaderId,
      storage_object_name: storagePath,
      display_name: createCampaignHandoutDisplayName(file.name),
      mime_type: file.type,
      byte_size: file.size,
      visibility: "gm_only",
    });

    if (!inserted) {
      return { ok: false, error: "metadata_failed" };
    }
  } catch {
    return { ok: false, error: "metadata_failed" };
  }

  try {
    if (await dependencies.uploadObject(storagePath, file)) {
      return { ok: true, imageId, storagePath };
    }
  } catch {
    // The same verified rollback is required for returned and thrown failures.
  }

  try {
    return (await dependencies.rollbackUpload(imageId, storagePath))
      ? { ok: false, error: "upload_failed" }
      : { ok: false, error: "cleanup_unverified" };
  } catch {
    return { ok: false, error: "cleanup_unverified" };
  }
}

export async function uploadCampaignHandoutBatch<
  TFile extends CampaignHandoutUploadFile,
>({
  files,
  uploadFile,
  onProgress,
}: {
  files: readonly TFile[];
  uploadFile: (file: TFile) => Promise<CampaignHandoutUploadResult>;
  onProgress?: (progress: {
    current: number;
    total: number;
    file: TFile;
  }) => void;
}): Promise<{
  successes: Array<{
    file: TFile;
    imageId: string;
    storagePath: string;
  }>;
  failures: Array<{ file: TFile; error: CampaignHandoutUploadFailure }>;
}> {
  const successes: Array<{
    file: TFile;
    imageId: string;
    storagePath: string;
  }> = [];
  const failures: Array<{
    file: TFile;
    error: CampaignHandoutUploadFailure;
  }> = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    onProgress?.({ current: index + 1, total: files.length, file });

    let result: CampaignHandoutUploadResult;

    try {
      result = await uploadFile(file);
    } catch {
      result = { ok: false, error: "cleanup_unverified" };
    }

    if (result.ok) {
      successes.push({ file, ...result });
    } else {
      failures.push({ file, error: result.error });
    }
  }

  return { successes, failures };
}
