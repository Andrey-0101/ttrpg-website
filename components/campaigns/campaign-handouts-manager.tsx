"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";

import {
  CAMPAIGN_HANDOUT_ACCEPT,
  CAMPAIGN_HANDOUT_BUCKET,
  isCampaignHandoutVisibility,
  validateCampaignHandoutFile,
  type CampaignHandoutVisibility,
} from "@/lib/campaign-handouts/contracts";
import { createCampaignHandoutStorageDependencies } from "@/lib/campaign-handouts/storage";
import {
  uploadCampaignHandoutBatch,
  uploadCampaignHandoutFile,
  type CampaignHandoutUploadFailure,
} from "@/lib/campaign-handouts/upload";
import {
  deleteCampaignHandoutStorageFirst,
  rollbackFailedCampaignHandoutUpload,
} from "@/lib/campaign-handouts/workflows";
import { useUnsavedChangesGuard } from "@/lib/navigation/unsaved-changes";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "@/i18n/navigation";

import CampaignHandoutGallery from "./campaign-handout-gallery";

export type CampaignHandoutManagerItem = {
  id: string;
  displayName: string;
  storagePath: string;
  signedUrl: string | null;
  visibility: CampaignHandoutVisibility;
  recipientIds: string[];
};

export type CampaignHandoutPlayerOption = {
  id: string;
  name: string;
};

type ManagerMessage = {
  kind: "error" | "status";
  text: string;
} | null;

type UploadFailureItem = {
  fileName: string;
  error: CampaignHandoutUploadFailure;
};

function CampaignHandoutCardControls({
  campaignId,
  handout,
  players,
}: {
  campaignId: string;
  handout: CampaignHandoutManagerItem;
  players: CampaignHandoutPlayerOption[];
}) {
  const translations = useTranslations("CampaignHandouts");
  const router = useRouter();
  const [visibility, setVisibility] =
    useState<CampaignHandoutVisibility>(handout.visibility);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    handout.recipientIds,
  );
  const [mutation, setMutation] = useState<"visibility" | "delete" | null>(
    null,
  );
  const [message, setMessage] = useState<ManagerMessage>(null);
  const mutationLockRef = useRef(false);

  const selectedNames = useMemo(
    () =>
      players
        .filter((player) => selectedIds.includes(player.id))
        .map((player) => player.name),
    [players, selectedIds],
  );
  const initialRecipients = [...handout.recipientIds].sort().join(",");
  const currentRecipients = [...selectedIds].sort().join(",");
  const hasVisibilityChanges =
    visibility !== handout.visibility ||
    currentRecipients !== initialRecipients;

  function handleVisibilityChange(event: ChangeEvent<HTMLSelectElement>) {
    if (!isCampaignHandoutVisibility(event.target.value)) {
      return;
    }

    const nextVisibility = event.target.value;
    setVisibility(nextVisibility);
    setMessage(null);

    if (nextVisibility !== "selected_active_players") {
      setSelectedIds([]);
    }
  }

  async function handleSaveVisibility() {
    if (mutationLockRef.current || !hasVisibilityChanges) {
      return;
    }

    if (
      visibility === "selected_active_players" &&
      selectedIds.length === 0
    ) {
      setMessage({
        kind: "error",
        text: translations("selectedPlayersRequired"),
      });
      return;
    }

    mutationLockRef.current = true;
    setMutation("visibility");
    setMessage({ kind: "status", text: translations("savingVisibility") });

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("set_campaign_image_visibility", {
        target_image_id: handout.id,
        target_visibility: visibility,
        target_recipient_ids:
          visibility === "selected_active_players" ? selectedIds : [],
      });

      if (error) {
        setMessage({ kind: "error", text: translations("visibilityError") });
      } else {
        setMessage({ kind: "status", text: translations("visibilitySaved") });
        router.refresh();
      }
    } catch {
      setMessage({ kind: "error", text: translations("visibilityError") });
    } finally {
      mutationLockRef.current = false;
      setMutation(null);
    }
  }

  async function handleDelete() {
    if (
      mutationLockRef.current ||
      !window.confirm(
        translations("deleteConfirm", { name: handout.displayName }),
      )
    ) {
      return;
    }

    mutationLockRef.current = true;
    setMutation("delete");
    setMessage({ kind: "status", text: translations("deletingStatus") });

    try {
      const supabase = createClient();
      const result = await deleteCampaignHandoutStorageFirst({
        imageId: handout.id,
        storagePath: handout.storagePath,
        storage: createCampaignHandoutStorageDependencies(supabase),
        deleteMetadata: async (imageId) => {
          const { error } = await supabase
            .from("campaign_images")
            .delete()
            .eq("campaign_id", campaignId)
            .eq("id", imageId);
          return !error;
        },
      });

      if (!result.ok) {
        setMessage({ kind: "error", text: translations("deleteError") });
        return;
      }

      setMessage({ kind: "status", text: translations("deletedStatus") });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: translations("deleteError") });
    } finally {
      mutationLockRef.current = false;
      setMutation(null);
    }
  }

  return (
    <div className="min-w-0 border-t border-neutral-300 bg-neutral-50 px-3 py-3 text-sm">
      <label className="block font-medium">
        {translations("visibilityLabel")}
        <select
          value={visibility}
          onChange={handleVisibilityChange}
          disabled={mutation !== null}
          className="mt-1 w-full min-w-0 rounded border border-neutral-400 bg-white px-2.5 py-2"
        >
          <option value="gm_only">{translations("visibility.gmOnly")}</option>
          <option value="all_active_players">
            {translations("visibility.allPlayers")}
          </option>
          <option value="selected_active_players">
            {translations("visibility.selectedPlayers")}
          </option>
        </select>
      </label>

      {visibility === "selected_active_players" && (
        <fieldset className="mt-3 min-w-0 rounded border border-neutral-300 p-2.5">
          <legend className="px-1 font-medium">
            {translations("selectedPlayers")}
          </legend>
          {players.length === 0 ? (
            <p className="text-sm text-neutral-600">
              {translations("noActivePlayers")}
            </p>
          ) : (
            <div className="grid min-w-0 gap-2">
              {players.map((player) => (
                <label
                  key={player.id}
                  className="flex min-w-0 items-start gap-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(player.id)}
                    disabled={mutation !== null}
                    onChange={(event) => {
                      setSelectedIds((current) =>
                        event.target.checked
                          ? Array.from(new Set([...current, player.id]))
                          : current.filter((id) => id !== player.id),
                      );
                      setMessage(null);
                    }}
                    className="mt-1"
                  />
                  <span className="min-w-0 break-words">{player.name}</span>
                </label>
              ))}
            </div>
          )}
          <p className="mt-3 break-words text-sm text-neutral-700">
            {translations("selectedPlayerNames")}: {" "}
            {selectedNames.length > 0
              ? selectedNames.join(", ")
              : translations("noneSelected")}
          </p>
        </fieldset>
      )}

      {message && (
        <p
          className={`mt-4 text-sm font-medium ${
            message.kind === "error" ? "text-red-700" : "text-neutral-700"
          }`}
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={handleDelete}
          disabled={mutation !== null}
          className="rounded border border-red-700 px-3 py-2 font-semibold text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation === "delete"
            ? translations("deleting")
            : translations("delete")}
        </button>
        <button
          type="button"
          onClick={handleSaveVisibility}
          disabled={mutation !== null || !hasVisibilityChanges}
          className="rounded bg-neutral-950 px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation === "visibility"
            ? translations("saving")
            : translations("saveVisibility")}
        </button>
      </div>
    </div>
  );
}

export default function CampaignHandoutsManager({
  campaignId,
  currentUserId,
  campaignActive,
  initialHandouts,
  players,
}: {
  campaignId: string;
  currentUserId: string;
  campaignActive: boolean;
  initialHandouts: CampaignHandoutManagerItem[];
  players: CampaignHandoutPlayerOption[];
}) {
  const translations = useTranslations("CampaignHandouts");
  const unsavedTranslations = useTranslations("UnsavedChanges");
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [mutation, setMutation] = useState<"upload" | null>(null);
  const [message, setMessage] = useState<ManagerMessage>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [uploadFailures, setUploadFailures] = useState<UploadFailureItem[]>([]);
  const mutationLockRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectionIssues = useMemo(
    () =>
      files.flatMap((selectedFile) => {
        const error = validateCampaignHandoutFile(selectedFile);
        return error ? [{ fileName: selectedFile.name, error }] : [];
      }),
    [files],
  );

  useUnsavedChangesGuard({
    enabled: mutation === "upload",
    confirmMessage: unsavedTranslations("leaveConfirm"),
  });

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    setMessage(null);
    setUploadFailures([]);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (files.length === 0 || mutationLockRef.current || !campaignActive) {
      return;
    }

    mutationLockRef.current = true;
    setMutation("upload");
    setMessage(null);
    setUploadFailures([]);
    setUploadProgress({ current: 1, total: files.length });

    const supabase = createClient();

    try {
      const result = await uploadCampaignHandoutBatch({
        files,
        onProgress: ({ current, total }) => {
          setUploadProgress({ current, total });
        },
        uploadFile: (selectedFile) =>
          uploadCampaignHandoutFile({
            file: selectedFile,
            campaignId,
            uploaderId: currentUserId,
            dependencies: {
              createId: () => crypto.randomUUID(),
              insertMetadata: async (metadata) => {
                const { error } = await supabase
                  .from("campaign_images")
                  .insert(metadata);
                return !error;
              },
              uploadObject: async (storagePath, targetFile) => {
                const { error } = await supabase.storage
                  .from(CAMPAIGN_HANDOUT_BUCKET)
                  .upload(storagePath, targetFile, {
                    cacheControl: "3600",
                    contentType: targetFile.type,
                    upsert: false,
                  });
                return !error;
              },
              rollbackUpload: async (imageId, storagePath) => {
                const cleanup = await rollbackFailedCampaignHandoutUpload({
                  imageId,
                  storagePath,
                  storage: createCampaignHandoutStorageDependencies(supabase),
                  deleteMetadata: async (targetImageId) => {
                    const { error } = await supabase
                      .from("campaign_images")
                      .delete()
                      .eq("campaign_id", campaignId)
                      .eq("id", targetImageId);
                    return !error;
                  },
                });
                return cleanup.ok;
              },
            },
          }),
      });

      setUploadFailures(
        result.failures.map(({ file, error }) => ({
          fileName: file.name,
          error,
        })),
      );
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (result.failures.length === 0) {
        setMessage({
          kind: "status",
          text: translations("uploadBatchSuccess", {
            count: result.successes.length,
          }),
        });
      } else if (result.successes.length > 0) {
        setMessage({
          kind: "error",
          text: translations("uploadBatchPartial", {
            successCount: result.successes.length,
            failedCount: result.failures.length,
          }),
        });
      } else {
        setMessage({
          kind: "error",
          text: translations("uploadBatchFailed", {
            failedCount: result.failures.length,
          }),
        });
      }

      if (result.successes.length > 0) {
        router.refresh();
      }
    } catch {
      setMessage({
        kind: "error",
        text: translations("uploadBatchUnexpected"),
      });
    } finally {
      mutationLockRef.current = false;
      setMutation(null);
      setUploadProgress(null);
    }
  }

  const galleryItems = initialHandouts.map((handout) => ({
    ...handout,
    key: `${handout.id}:${handout.visibility}:${handout.recipientIds.join(",")}`,
  }));

  const gallery =
    initialHandouts.length === 0 ? (
      <section className="rounded-lg border border-dashed border-white/40 bg-black/20 p-6 text-center sm:p-8">
        <h2 className="text-2xl font-semibold">
          {translations("emptyTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-white/75">
          {translations("emptyGameMasterDescription")}
        </p>
      </section>
    ) : (
      <CampaignHandoutGallery
        items={galleryItems}
        renderCardFooter={
          campaignActive
            ? (handout) => (
                <CampaignHandoutCardControls
                  campaignId={campaignId}
                  handout={handout}
                  players={players}
                />
              )
            : undefined
        }
      />
    );

  return (
    <div className="grid min-w-0 gap-6">
      {gallery}

      {!campaignActive ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-5 text-neutral-950">
          <h2 className="text-2xl font-bold">
            {translations("completedTitle")}
          </h2>
          <p className="mt-2 text-neutral-700">
            {translations("completedGameMasterDescription")}
          </p>
        </section>
      ) : (
        <section className="min-w-0 rounded-lg border border-neutral-300 bg-white p-5 text-neutral-950 sm:p-6">
          <h2 className="text-2xl font-bold">
            {translations("uploadTitle")}
          </h2>
          <p className="mt-2 text-sm text-neutral-700">
            {translations("uploadDescription")}
          </p>
          <form onSubmit={handleUpload} className="mt-5 min-w-0">
            <label className="block min-w-0 font-medium">
              {translations("chooseImages")}
              <input
                ref={fileInputRef}
                type="file"
                accept={CAMPAIGN_HANDOUT_ACCEPT}
                multiple
                onChange={handleFileChange}
                disabled={mutation !== null}
                className="mt-2 block w-full min-w-0 max-w-full rounded border border-neutral-400 bg-white px-3 py-2 file:mr-3 file:rounded file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:font-semibold file:text-white"
              />
            </label>

            {files.length > 0 && (
              <p className="mt-3 text-sm text-neutral-700">
                {translations("selectedFiles", { count: files.length })}
              </p>
            )}

            {selectionIssues.length > 0 && (
              <div
                className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                <p className="font-semibold">
                  {translations("invalidSelectionTitle")}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {selectionIssues.map((issue, index) => (
                    <li
                      key={`${issue.fileName}:${issue.error}:${index}`}
                      className="break-all"
                    >
                      {issue.fileName}: {" "}
                      {translations(`validation.${issue.error}`)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {uploadProgress && (
              <p
                className="mt-4 text-sm font-medium text-neutral-700"
                role="status"
              >
                {translations("uploadProgress", uploadProgress)}
              </p>
            )}

            {message && (
              <p
                className={`mt-4 text-sm font-medium ${
                  message.kind === "error" ? "text-red-700" : "text-neutral-700"
                }`}
                role={message.kind === "error" ? "alert" : "status"}
              >
                {message.text}
              </p>
            )}

            {uploadFailures.length > 0 && (
              <div className="mt-3 text-sm text-red-800">
                <p className="font-semibold">
                  {translations("failedFilesTitle")}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {uploadFailures.map((failure, index) => (
                    <li
                      key={`${failure.fileName}:${failure.error}:${index}`}
                      className="break-all"
                    >
                      {failure.fileName}: {" "}
                      {translations(`failure.${failure.error}`)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={files.length === 0 || mutation !== null}
              className="mt-5 w-full rounded bg-neutral-950 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {mutation === "upload"
                ? translations("uploading")
                : translations("upload")}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
