"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";

import { useTranslations } from "next-intl";

import { createCampaignAction } from "@/app/[locale]/campaigns/new/actions";
import { useRouter } from "@/i18n/navigation";
import { CAMPAIGN_DESCRIPTION_MAX_LENGTH } from "@/lib/campaigns/creation";
import {
  createCampaignCreationSubmissionState,
  submitCampaignCreation,
} from "@/lib/campaigns/creation-navigation";
import {
  requestUnsavedChangesNavigation,
  useUnsavedChangesGuard,
} from "@/lib/navigation/unsaved-changes";
import {
  isGameSystemCapabilityAvailable,
  type GameSystemId,
} from "@/lib/game-systems/catalogue";

type CampaignSystemOption = {
  id: GameSystemId;
  name: string;
  description: string;
  status: "available" | "planned";
};

type CampaignCreatorProps = {
  gameSystems: CampaignSystemOption[];
};

type MutationMessage = {
  kind: "status" | "error";
  text: string;
} | null;

export default function CampaignCreator({
  gameSystems,
}: CampaignCreatorProps) {
  const translations = useTranslations("CampaignCreate");
  const catalogueTranslations = useTranslations("GameSystemCatalogue");
  const unsavedTranslations = useTranslations("UnsavedChanges");
  const router = useRouter();
  const defaultGameSystem =
    gameSystems.find((system) => system.status === "available")?.id ?? "";

  const [name, setName] = useState("");
  const [gameSystem, setGameSystem] = useState(defaultGameSystem);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<MutationMessage>(null);
  const [creating, setCreating] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(
    null,
  );
  const creationSubmissionRef = useRef(
    createCampaignCreationSubmissionState(),
  );

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
    enabled: hasUnsavedChanges && !createdCampaignId,
    confirmMessage: unsavedTranslations("leaveConfirm"),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage({ kind: "error", text: translations("nameRequired") });
      return;
    }

    if (
      !gameSystem ||
      !isGameSystemCapabilityAvailable(gameSystem, "campaignCreation")
    ) {
      setMessage({
        kind: "error",
        text: translations("gameSystemRequired"),
      });
      return;
    }

    if (!creationSubmissionRef.current.createdCampaignId) {
      setMessage({
        kind: "status",
        text: translations("creatingStatus"),
      });
    }

    await submitCampaignCreation({
      input: {
        name,
        gameSystem,
        description,
      },
      state: creationSubmissionRef.current,
      dependencies: {
        createCampaign: createCampaignAction,
        requestLoginNavigation: requestUnsavedChangesNavigation,
        allowCampaignNavigation: allowNavigation,
        navigate: (href) => router.push(href),
        setCreating,
        onFailure: (error) => {
          setMessage({
            kind: "error",
            text:
              error === "game_system_unavailable"
                ? translations("gameSystemRequired")
                : translations("createError"),
          });
        },
        onAuthenticationRequired: () => {
          setMessage({
            kind: "error",
            text: translations("signInRequired"),
          });
        },
        onCreated: (campaignId) => {
          setCreatedCampaignId(campaignId);
          setMessage({
            kind: "status",
            text: translations("createdStatus"),
          });
        },
        onNavigationFailure: () => {
          console.error("Failed to open the created campaign.");
          setMessage({
            kind: "status",
            text: translations("createdStatus"),
          });
        },
      },
    });
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
            disabled={creating || Boolean(createdCampaignId)}
            maxLength={120}
            className={fieldStyle}
            placeholder={translations("namePlaceholder")}
            required
          />
        </label>

        <fieldset disabled={creating || Boolean(createdCampaignId)}>
          <legend className="font-medium">{translations("gameSystem")}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {gameSystems.map((system) => {
              const isAvailable = system.status === "available";
              const inputId = `campaign-system-${system.id}`;
              const headingId = `${inputId}-heading`;
              const actionId = `${inputId}-action`;

              return (
                <article
                  key={system.id}
                  className={`min-w-0 rounded-lg border p-4 ${
                    isAvailable
                      ? "border-neutral-500 bg-white"
                      : "border-neutral-300 bg-neutral-100"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2
                      id={headingId}
                      className="min-w-0 break-words text-base font-bold"
                    >
                      {system.name}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isAvailable
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {catalogueTranslations(
                        isAvailable ? "available" : "planned",
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-700">
                    {system.description}
                  </p>

                  {isAvailable && (
                    <label
                      htmlFor={inputId}
                      className="mt-4 flex cursor-pointer items-center gap-2 rounded border border-neutral-400 px-3 py-2 font-medium outline-none hover:bg-neutral-100"
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name="gameSystem"
                        value={system.id}
                        checked={gameSystem === system.id}
                        onChange={() => setGameSystem(system.id)}
                        aria-labelledby={`${headingId} ${actionId}`}
                        required
                        className="h-4 w-4 accent-neutral-950 outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
                      />
                      <span id={actionId}>
                        {catalogueTranslations(
                          "actions.selectForCampaign",
                        )}
                      </span>
                    </label>
                  )}
                </article>
              );
            })}
          </div>
        </fieldset>

        <label className="font-medium">
          {translations("description")}
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={creating || Boolean(createdCampaignId)}
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

      {hasUnsavedChanges && !creating && !createdCampaignId && (
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
          disabled={
            creating ||
            (!createdCampaignId &&
              (!gameSystem ||
                !isGameSystemCapabilityAvailable(
                  gameSystem,
                  "campaignCreation",
                )))
          }
          className="rounded bg-neutral-950 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating
            ? translations("creating")
            : createdCampaignId
              ? translations("openCreated")
              : translations("create")}
        </button>
      </div>
    </form>
  );
}
