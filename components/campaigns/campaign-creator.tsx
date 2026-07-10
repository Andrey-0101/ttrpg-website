"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import {
  requestUnsavedChangesNavigation,
  useUnsavedChangesGuard,
} from "@/lib/navigation/unsaved-changes";
import { createClient } from "@/utils/supabase/client";

type CampaignSystemOption = {
  id: string;
  name: string;
};

type CampaignCreatorProps = {
  gameSystems: CampaignSystemOption[];
};

type MutationMessage = {
  kind: "status" | "error";
  text: string;
} | null;

const CAMPAIGN_DESCRIPTION_MAX_LENGTH = 4000;

export default function CampaignCreator({
  gameSystems,
}: CampaignCreatorProps) {
  const translations = useTranslations("CampaignCreate");
  const unsavedTranslations = useTranslations("UnsavedChanges");
  const router = useRouter();
  const defaultGameSystem = gameSystems[0]?.id ?? "";

  const [name, setName] = useState("");
  const [gameSystem, setGameSystem] = useState(defaultGameSystem);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<MutationMessage>(null);
  const [creating, setCreating] = useState(false);
  const createLockRef = useRef(false);

  const cleanSnapshot = useMemo(
    () =>
      JSON.stringify({
        name: "",
        gameSystem: defaultGameSystem,
        description: "",
      }),
    [defaultGameSystem],
  );
  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        gameSystem,
        description,
      }),
    [description, gameSystem, name],
  );
  const hasUnsavedChanges = currentSnapshot !== cleanSnapshot;
  const { allowNavigation } = useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    confirmMessage: unsavedTranslations("leaveConfirm"),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage({ kind: "error", text: translations("nameRequired") });
      return;
    }

    if (createLockRef.current || !gameSystem) {
      return;
    }

    createLockRef.current = true;
    setCreating(true);
    setMessage({
      kind: "status",
      text: translations("creatingStatus"),
    });

    const supabase = createClient();
    let releaseCreateLock = true;

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        if (!requestUnsavedChangesNavigation()) {
          return;
        }

        releaseCreateLock = false;
        router.push("/login");
        return;
      }

      const trimmedDescription = description.trim();
      const { data: campaign, error } = await supabase
        .from("campaigns")
        .insert({
          game_master_id: userData.user.id,
          game_system: gameSystem,
          name: trimmedName,
          description: trimmedDescription || null,
        })
        .select("id")
        .single();

      if (error || !campaign) {
        console.error("Failed to create campaign:", error);
        setMessage({ kind: "error", text: translations("createError") });
        return;
      }

      allowNavigation();
      releaseCreateLock = false;
      router.push(`/campaigns/${campaign.id}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to create campaign:", error);
      setMessage({ kind: "error", text: translations("createError") });
    } finally {
      if (releaseCreateLock) {
        createLockRef.current = false;
        setCreating(false);
      }
    }
  }

  const fieldStyle =
    "mt-1 w-full rounded border border-neutral-400 bg-white px-3 py-2 text-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-600";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-lg border border-neutral-300 bg-white p-4 text-neutral-950 shadow-sm sm:p-6"
      aria-busy={creating}
    >
      <div className="grid gap-5">
        <label className="font-medium">
          {translations("name")}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={creating}
            maxLength={120}
            className={fieldStyle}
            placeholder={translations("namePlaceholder")}
            required
          />
        </label>

        <label className="font-medium">
          {translations("gameSystem")}
          <select
            value={gameSystem}
            onChange={(event) => setGameSystem(event.target.value)}
            disabled={creating || gameSystems.length === 0}
            className={fieldStyle}
            required
          >
            {gameSystems.map((system) => (
              <option key={system.id} value={system.id}>
                {system.name}
              </option>
            ))}
          </select>
        </label>

        <label className="font-medium">
          {translations("description")}
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={creating}
            maxLength={CAMPAIGN_DESCRIPTION_MAX_LENGTH}
            rows={7}
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

      {hasUnsavedChanges && !creating && (
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

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={creating || !gameSystem}
          className="rounded bg-neutral-950 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? translations("creating") : translations("create")}
        </button>
      </div>
    </form>
  );
}
