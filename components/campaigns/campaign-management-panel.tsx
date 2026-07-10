"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { useUnsavedChangesGuard } from "@/lib/navigation/unsaved-changes";
import { createClient } from "@/utils/supabase/client";

type CampaignManagementPanelProps = {
  campaignId: string;
  initialName: string;
  initialDescription: string | null;
  initialStatus: string;
};

type MutationKind = "save" | "complete" | "delete" | null;

type MutationMessage = {
  kind: "status" | "error";
  text: string;
} | null;

const CAMPAIGN_NAME_MAX_LENGTH = 120;
const CAMPAIGN_DESCRIPTION_MAX_LENGTH = 4000;

export default function CampaignManagementPanel({
  campaignId,
  initialName,
  initialDescription,
  initialStatus,
}: CampaignManagementPanelProps) {
  const translations = useTranslations("CampaignManagement");
  const unsavedTranslations = useTranslations("UnsavedChanges");
  const router = useRouter();
  const initialDescriptionValue = initialDescription ?? "";

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescriptionValue);
  const [savedName, setSavedName] = useState(initialName);
  const [savedDescription, setSavedDescription] = useState(
    initialDescriptionValue,
  );
  const [status, setStatus] = useState(initialStatus);
  const [mutation, setMutation] = useState<MutationKind>(null);
  const [message, setMessage] = useState<MutationMessage>(null);
  const mutationLockRef = useRef(false);

  const savedSnapshot = useMemo(
    () =>
      JSON.stringify({
        name: savedName,
        description: savedDescription,
      }),
    [savedDescription, savedName],
  );
  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        description,
      }),
    [description, name],
  );
  const hasUnsavedChanges = currentSnapshot !== savedSnapshot;
  const isActiveCampaign = status === "active";
  const isMutating = mutation !== null;

  const { allowNavigation } = useUnsavedChangesGuard({
    enabled: isActiveCampaign && hasUnsavedChanges,
    confirmMessage: unsavedTranslations("leaveConfirm"),
  });

  function handleReset() {
    if (isMutating) {
      return;
    }

    setName(savedName);
    setDescription(savedDescription);
    setMessage(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage({ kind: "error", text: translations("nameRequired") });
      return;
    }

    if (mutationLockRef.current || !isActiveCampaign || !hasUnsavedChanges) {
      return;
    }

    mutationLockRef.current = true;
    setMutation("save");
    setMessage({ kind: "status", text: translations("savingStatus") });

    const trimmedDescription = description.trim();
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("campaigns")
        .update({
          name: trimmedName,
          description: trimmedDescription || null,
        })
        .eq("id", campaignId)
        .eq("status", "active")
        .select("id, name, description, status")
        .maybeSingle();

      if (error || !data) {
        console.error("Failed to update campaign:", error);
        setMessage({ kind: "error", text: translations("saveError") });
        return;
      }

      const savedDescriptionValue = data.description ?? "";
      setName(data.name);
      setDescription(savedDescriptionValue);
      setSavedName(data.name);
      setSavedDescription(savedDescriptionValue);
      setMessage({ kind: "status", text: translations("savedStatus") });
      router.refresh();
    } catch (error) {
      console.error("Failed to update campaign:", error);
      setMessage({ kind: "error", text: translations("saveError") });
    } finally {
      mutationLockRef.current = false;
      setMutation(null);
    }
  }

  async function handleComplete() {
    if (mutationLockRef.current || !isActiveCampaign || hasUnsavedChanges) {
      return;
    }

    if (!window.confirm(translations("completeConfirm"))) {
      return;
    }

    mutationLockRef.current = true;
    setMutation("complete");
    setMessage({ kind: "status", text: translations("completingStatus") });

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("campaigns")
        .update({ status: "completed" })
        .eq("id", campaignId)
        .eq("status", "active")
        .select("id, status")
        .maybeSingle();

      if (error || !data || data.status !== "completed") {
        console.error("Failed to complete campaign:", error);
        setMessage({ kind: "error", text: translations("completeError") });
        return;
      }

      setStatus("completed");
      setMessage({ kind: "status", text: translations("completedStatus") });
      router.refresh();
    } catch (error) {
      console.error("Failed to complete campaign:", error);
      setMessage({ kind: "error", text: translations("completeError") });
    } finally {
      mutationLockRef.current = false;
      setMutation(null);
    }
  }

  async function handleDelete() {
    if (mutationLockRef.current || hasUnsavedChanges) {
      return;
    }

    if (!window.confirm(translations("deleteConfirm"))) {
      return;
    }

    mutationLockRef.current = true;
    setMutation("delete");
    setMessage({ kind: "status", text: translations("deletingStatus") });

    const supabase = createClient();
    let releaseMutationLock = true;

    try {
      const { data, error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId)
        .select("id")
        .maybeSingle();

      if (error || !data) {
        console.error("Failed to delete campaign:", error);
        setMessage({ kind: "error", text: translations("deleteError") });
        return;
      }

      allowNavigation();
      releaseMutationLock = false;
      router.replace("/campaigns");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      setMessage({ kind: "error", text: translations("deleteError") });
    } finally {
      if (releaseMutationLock) {
        mutationLockRef.current = false;
        setMutation(null);
      }
    }
  }

  const fieldStyle =
    "mt-1 w-full rounded border border-neutral-400 bg-white px-3 py-2 text-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-600";

  return (
    <section
      className="rounded-lg border border-neutral-300 bg-white p-4 text-neutral-950 shadow-sm sm:p-6"
      aria-busy={isMutating}
    >
      <div>
        <h2 className="text-2xl font-bold">{translations("title")}</h2>
        <p className="mt-2 max-w-3xl text-sm text-neutral-700">
          {translations("description")}
        </p>
      </div>

      <form onSubmit={handleSave} className="mt-5">
        <div className="grid gap-5">
          <label className="font-medium">
            {translations("name")}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!isActiveCampaign || isMutating}
              maxLength={CAMPAIGN_NAME_MAX_LENGTH}
              className={fieldStyle}
              placeholder={translations("namePlaceholder")}
              required
            />
          </label>

          <label className="font-medium">
            {translations("campaignDescription")}
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!isActiveCampaign || isMutating}
              maxLength={CAMPAIGN_DESCRIPTION_MAX_LENGTH}
              rows={6}
              className={`${fieldStyle} resize-y`}
              placeholder={translations("descriptionPlaceholder")}
            />
            <span className="mt-1 block text-right text-xs text-neutral-600">
              {translations("descriptionCounter", {
                count: description.length,
                maximum: CAMPAIGN_DESCRIPTION_MAX_LENGTH,
              })}
            </span>
          </label>
        </div>

        {!isActiveCampaign && (
          <p className="mt-5 rounded border border-neutral-300 bg-neutral-100 p-3 text-sm text-neutral-700">
            {translations("completedReadOnly")}
          </p>
        )}

        {hasUnsavedChanges && isActiveCampaign && !isMutating && (
          <p className="mt-5 text-sm font-medium text-amber-800" role="status">
            {unsavedTranslations("status")}
          </p>
        )}

        {message && (
          <p
            className={`mt-5 text-sm font-medium ${
              message.kind === "error" ? "text-red-700" : "text-neutral-700"
            }`}
            role={message.kind === "error" ? "alert" : "status"}
          >
            {message.text}
          </p>
        )}

        {isActiveCampaign && (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={isMutating || !hasUnsavedChanges}
              className="rounded border border-neutral-500 px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {translations("reset")}
            </button>
            <button
              type="submit"
              disabled={isMutating || !hasUnsavedChanges || !name.trim()}
              className="rounded bg-neutral-950 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation === "save"
                ? translations("saving")
                : translations("save")}
            </button>
          </div>
        )}
      </form>

      <div className="mt-7 border-t border-neutral-300 pt-6">
        <h3 className="text-xl font-bold">{translations("lifecycleTitle")}</h3>
        <p className="mt-2 text-sm text-neutral-700">
          {translations("lifecycleDescription")}
        </p>

        {hasUnsavedChanges && isActiveCampaign && (
          <p className="mt-4 text-sm font-medium text-amber-800">
            {translations("resolveUnsaved")}
          </p>
        )}

        {isActiveCampaign ? (
          <button
            type="button"
            onClick={handleComplete}
            disabled={isMutating || hasUnsavedChanges}
            className="mt-4 w-full rounded border border-amber-700 px-4 py-2 font-semibold text-amber-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {mutation === "complete"
              ? translations("completing")
              : translations("complete")}
          </button>
        ) : (
          <p className="mt-4 text-sm font-medium text-neutral-700">
            {translations("alreadyCompleted")}
          </p>
        )}

        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <h4 className="font-bold text-red-900">
            {translations("deleteTitle")}
          </h4>
          <p className="mt-2 text-sm text-red-900/80">
            {translations("deleteDescription")}
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isMutating || hasUnsavedChanges}
            className="mt-4 w-full rounded border border-red-700 px-4 py-2 font-semibold text-red-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {mutation === "delete"
              ? translations("deleting")
              : translations("delete")}
          </button>
        </div>
      </div>
    </section>
  );
}
