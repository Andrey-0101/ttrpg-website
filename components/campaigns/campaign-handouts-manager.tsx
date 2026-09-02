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
  createCampaignHandoutDisplayName,
  createCampaignHandoutPath,
  isCampaignHandoutVisibility,
  validateCampaignHandoutFile,
  type CampaignHandoutVisibility,
} from "@/lib/campaign-handouts/contracts";
import { createCampaignHandoutStorageDependencies } from "@/lib/campaign-handouts/storage";
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

function CampaignHandoutAccessManager({
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
    visibility !== handout.visibility || currentRecipients !== initialRecipients;

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
    <article className="min-w-0 rounded-lg border border-neutral-300 bg-neutral-50 p-4">
      <h3 className="break-words text-lg font-bold">{handout.displayName}</h3>

      <label className="mt-4 block font-medium">
        {translations("visibilityLabel")}
        <select
          value={visibility}
          onChange={handleVisibilityChange}
          disabled={mutation !== null}
          className="mt-1 w-full rounded border border-neutral-400 bg-white px-3 py-2"
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
        <fieldset className="mt-4 rounded border border-neutral-300 p-3">
          <legend className="px-1 font-medium">
            {translations("selectedPlayers")}
          </legend>
          {players.length === 0 ? (
            <p className="text-sm text-neutral-600">
              {translations("noActivePlayers")}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {players.map((player) => (
                <label key={player.id} className="flex items-start gap-2">
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
                  <span className="break-words">{player.name}</span>
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={handleDelete}
          disabled={mutation !== null}
          className="rounded border border-red-700 px-4 py-2 font-semibold text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation === "delete"
            ? translations("deleting")
            : translations("delete")}
        </button>
        <button
          type="button"
          onClick={handleSaveVisibility}
          disabled={mutation !== null || !hasVisibilityChanges}
          className="rounded bg-neutral-950 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation === "visibility"
            ? translations("saving")
            : translations("saveVisibility")}
        </button>
      </div>
    </article>
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
  const [file, setFile] = useState<File | null>(null);
  const [mutation, setMutation] = useState<"upload" | null>(null);
  const [message, setMessage] = useState<ManagerMessage>(null);
  const mutationLockRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useUnsavedChangesGuard({
    enabled: mutation === "upload",
    confirmMessage: unsavedTranslations("leaveConfirm"),
  });

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setMessage(null);

    if (!nextFile) {
      return;
    }

    const validationError = validateCampaignHandoutFile(nextFile);
    if (validationError) {
      setMessage({
        kind: "error",
        text: translations(`validation.${validationError}`),
      });
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || mutationLockRef.current || !campaignActive) {
      return;
    }

    const validationError = validateCampaignHandoutFile(file);
    if (validationError) {
      setMessage({
        kind: "error",
        text: translations(`validation.${validationError}`),
      });
      return;
    }

    mutationLockRef.current = true;
    setMutation("upload");
    setMessage({ kind: "status", text: translations("uploadingStatus") });

    const supabase = createClient();
    let pendingUpload: { imageId: string; storagePath: string } | null = null;

    try {
      const imageId = crypto.randomUUID();
      const storagePath = createCampaignHandoutPath({
        campaignId,
        imageId,
        objectId: crypto.randomUUID(),
        mimeType: file.type,
      });
      const { error: metadataError } = await supabase
        .from("campaign_images")
        .insert({
          id: imageId,
          campaign_id: campaignId,
          uploader_id: currentUserId,
          storage_object_name: storagePath,
          display_name: createCampaignHandoutDisplayName(file.name),
          mime_type: file.type,
          byte_size: file.size,
          visibility: "gm_only",
        });

      if (metadataError) {
        setMessage({ kind: "error", text: translations("uploadError") });
        return;
      }

      pendingUpload = { imageId, storagePath };

      const { error: uploadError } = await supabase.storage
        .from(CAMPAIGN_HANDOUT_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
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
        pendingUpload = null;
        setMessage({
          kind: "error",
          text: translations(
            cleanup.ok ? "uploadError" : "uploadCleanupError",
          ),
        });
        return;
      }

      pendingUpload = null;

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setMessage({ kind: "status", text: translations("uploadedStatus") });
      router.refresh();
    } catch {
      if (pendingUpload) {
        const cleanup = await rollbackFailedCampaignHandoutUpload({
          ...pendingUpload,
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
        setMessage({
          kind: "error",
          text: translations(
            cleanup.ok ? "uploadError" : "uploadCleanupError",
          ),
        });
      } else {
        setMessage({ kind: "error", text: translations("uploadError") });
      }
    } finally {
      mutationLockRef.current = false;
      setMutation(null);
    }
  }

  const galleryItems = initialHandouts.map((handout) => ({
    key: handout.id,
    displayName: handout.displayName,
    signedUrl: handout.signedUrl,
  }));

  return (
    <div className="grid min-w-0 gap-6">
      {initialHandouts.length === 0 ? (
        <section className="rounded-lg border border-dashed border-white/40 bg-black/20 p-6 text-center sm:p-8">
          <h2 className="text-2xl font-semibold">
            {translations("emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-white/75">
            {translations("emptyGameMasterDescription")}
          </p>
        </section>
      ) : (
        <CampaignHandoutGallery items={galleryItems} />
      )}

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
        <>
          <section className="min-w-0 rounded-lg border border-neutral-300 bg-white p-5 text-neutral-950 sm:p-6">
            <h2 className="text-2xl font-bold">
              {translations("uploadTitle")}
            </h2>
            <p className="mt-2 text-sm text-neutral-700">
              {translations("uploadDescription")}
            </p>
            <form onSubmit={handleUpload} className="mt-5 min-w-0">
              <label className="block min-w-0 font-medium">
                {translations("chooseImage")}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={CAMPAIGN_HANDOUT_ACCEPT}
                  onChange={handleFileChange}
                  disabled={mutation !== null}
                  className="mt-2 block w-full min-w-0 max-w-full rounded border border-neutral-400 bg-white px-3 py-2 file:mr-3 file:rounded file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:font-semibold file:text-white"
                />
              </label>
              {message && (
                <p
                  className={`mt-4 text-sm font-medium ${
                    message.kind === "error"
                      ? "text-red-700"
                      : "text-neutral-700"
                  }`}
                  role={message.kind === "error" ? "alert" : "status"}
                >
                  {message.text}
                </p>
              )}
              <button
                type="submit"
                disabled={!file || mutation !== null}
                className="mt-5 w-full rounded bg-neutral-950 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {mutation === "upload"
                  ? translations("uploading")
                  : translations("upload")}
              </button>
            </form>
          </section>

          {initialHandouts.length > 0 && (
            <section className="min-w-0 rounded-lg border border-neutral-300 bg-white p-5 text-neutral-950 sm:p-6">
              <h2 className="text-2xl font-bold">
                {translations("manageTitle")}
              </h2>
              <p className="mt-2 text-sm text-neutral-700">
                {translations("manageDescription")}
              </p>
              <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
                {initialHandouts.map((handout) => (
                  <CampaignHandoutAccessManager
                    key={`${handout.id}:${handout.visibility}:${handout.recipientIds.join(",")}`}
                    campaignId={campaignId}
                    handout={handout}
                    players={players}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
