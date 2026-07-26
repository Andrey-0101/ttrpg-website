"use client";

import {
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";

import {
  createSavedCustomDicePresetAction,
  deleteSavedCustomDicePresetAction,
  updateSavedCustomDicePresetAction,
} from "@/app/[locale]/dice-rollers/actions";
import { Link } from "@/i18n/navigation";
import {
  MAX_SAVED_CUSTOM_DICE_PRESETS,
  buildPresetMutationInput,
  canStartPresetMutation,
  completePresetMutationSafely,
  getPresetQuantitySummary,
  getSavedPresetSectionMode,
  mapPresetActionError,
  presetToQuantityFields,
  removeSavedCustomDicePreset,
  sortSavedCustomDicePresets,
  upsertSavedCustomDicePreset,
  type CustomDiceQuantityFields,
  type PresetActionMessageKey,
  type SavedPresetAccess,
} from "@/lib/dice/saved-custom-dice-presets-ui";
import {
  SAVED_CUSTOM_DICE_PRESET_LIMITS,
  type SavedCustomDicePreset,
} from "@/lib/dice/personal-dice-persistence-service";

type SavedCustomDicePresetsProps = {
  access: SavedPresetAccess;
  quantityFields: CustomDiceQuantityFields;
  onLoad: (
    quantityFields: CustomDiceQuantityFields,
    presetId: string,
  ) => void;
};

type Feedback = {
  kind: "success" | "error";
  messageKey:
    | PresetActionMessageKey
    | "created"
    | "updated"
    | "deleted"
    | "loaded";
};

function isNameMessage(messageKey: PresetActionMessageKey) {
  return (
    messageKey === "nameRequired" ||
    messageKey === "nameTooLong" ||
    messageKey === "nameConflict"
  );
}

export default function SavedCustomDicePresets({
  access,
  quantityFields,
  onLoad,
}: SavedCustomDicePresetsProps) {
  const translations = useTranslations("CustomDicePool");
  const [presets, setPresets] = useState(() =>
    access.authenticated
      ? sortSavedCustomDicePresets(access.presets)
      : [],
  );
  const [createName, setCreateName] = useState("");
  const [editPresetId, setEditPresetId] = useState<string | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [deletePresetId, setDeletePresetId] = useState<string | null>(
    null,
  );
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [createNameError, setCreateNameError] =
    useState<PresetActionMessageKey | null>(null);
  const [editNameError, setEditNameError] =
    useState<PresetActionMessageKey | null>(null);
  const [serverLimitReached, setServerLimitReached] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<string | null>(
    null,
  );
  const pendingOperationRef = useRef<string | null>(null);
  const [, startTransition] = useTransition();

  const sectionMode = getSavedPresetSectionMode(
    access,
    presets.length,
    serverLimitReached,
  );
  const hasSessionError =
    (access.authenticated &&
      access.loadError === "authentication_required") ||
    feedback?.messageKey === "authenticationRequired";

  function beginMutation(
    operation: string,
    mutation: () => Promise<void>,
  ) {
    if (!canStartPresetMutation(pendingOperationRef.current)) return;

    pendingOperationRef.current = operation;
    setPendingOperation(operation);
    setFeedback(null);

    startTransition(async () => {
      try {
        const completed = await completePresetMutationSafely(mutation);
        if (!completed) {
          setFeedback({ kind: "error", messageKey: "unexpected" });
        }
      } finally {
        pendingOperationRef.current = null;
        setPendingOperation(null);
      }
    });
  }

  function reportFailure(
    code: Parameters<typeof mapPresetActionError>[0],
    issues: Parameters<typeof mapPresetActionError>[1],
    form: "create" | "edit",
  ) {
    const messageKey = mapPresetActionError(code, issues);
    setFeedback({ kind: "error", messageKey });
    if (form === "create") {
      setCreateNameError(isNameMessage(messageKey) ? messageKey : null);
    } else {
      setEditNameError(isNameMessage(messageKey) ? messageKey : null);
    }
    if (code === "preset_limit_reached") {
      setServerLimitReached(true);
    }
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildPresetMutationInput(createName, quantityFields);
    if (!input.ok) {
      setFeedback({ kind: "error", messageKey: input.messageKey });
      setCreateNameError(
        input.field === "name" ? input.messageKey : null,
      );
      return;
    }

    beginMutation("create", async () => {
      const result = await createSavedCustomDicePresetAction({
        name: input.name,
        quantities: input.quantities,
      });
      if (!result.ok) {
        reportFailure(result.error.code, result.error.issues, "create");
        return;
      }

      setPresets((current) =>
        upsertSavedCustomDicePreset(current, result.data),
      );
      setCreateName("");
      setCreateNameError(null);
      setServerLimitReached(false);
      setFeedback({ kind: "success", messageKey: "created" });
    });
  }

  function handleLoad(preset: SavedCustomDicePreset) {
    onLoad(presetToQuantityFields(preset), preset.id);
    setLoadedPresetId(preset.id);
    setFeedback({ kind: "success", messageKey: "loaded" });
  }

  function beginEdit(preset: SavedCustomDicePreset) {
    setEditPresetId(preset.id);
    setEditName(preset.name);
    setEditNameError(null);
    setDeletePresetId(null);
    setFeedback(null);
  }

  function cancelEdit() {
    setEditPresetId(null);
    setEditName("");
    setEditNameError(null);
  }

  function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    presetId: string,
  ) {
    event.preventDefault();
    if (presetId !== editPresetId) return;

    const input = buildPresetMutationInput(editName, quantityFields);
    if (!input.ok) {
      setFeedback({ kind: "error", messageKey: input.messageKey });
      setEditNameError(
        input.field === "name" ? input.messageKey : null,
      );
      return;
    }

    beginMutation(`update:${presetId}`, async () => {
      const result = await updateSavedCustomDicePresetAction({
        presetId,
        name: input.name,
        quantities: input.quantities,
      });
      if (!result.ok) {
        reportFailure(result.error.code, result.error.issues, "edit");
        return;
      }

      setPresets((current) =>
        upsertSavedCustomDicePreset(current, result.data),
      );
      cancelEdit();
      setFeedback({ kind: "success", messageKey: "updated" });
    });
  }

  function handleDelete(presetId: string) {
    beginMutation(`delete:${presetId}`, async () => {
      const result = await deleteSavedCustomDicePresetAction({
        presetId,
      });
      if (!result.ok) {
        const messageKey = mapPresetActionError(
          result.error.code,
          result.error.issues,
        );
        setFeedback({ kind: "error", messageKey });
        return;
      }

      setPresets((current) =>
        removeSavedCustomDicePreset(current, presetId),
      );
      setDeletePresetId(null);
      setServerLimitReached(false);
      if (editPresetId === presetId) cancelEdit();
      setFeedback({ kind: "success", messageKey: "deleted" });
    });
  }

  function quantitySummary(preset: SavedCustomDicePreset) {
    return getPresetQuantitySummary(preset.quantities)
      .map(({ key, count }) =>
        translations("presets.quantitySummaryItem", {
          item:
            key === "coin"
              ? translations("coinLabel")
              : key,
          count,
        }),
      )
      .join(translations("presets.quantitySummarySeparator"));
  }

  if (access.authenticated === false) {
    return (
      <section
        className="mt-8 rounded-xl border border-white/20 bg-black/20 p-4 sm:p-6"
        aria-labelledby="saved-presets-title"
      >
        <h2 id="saved-presets-title" className="text-2xl font-bold">
          {translations("presets.title")}
        </h2>
        <p className="mt-2 text-white/75">
          {translations("presets.guestExplanation")}
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-white/30 px-4 py-2 font-bold outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-red-300"
        >
          {translations("presets.signIn")}
        </Link>
      </section>
    );
  }

  if (access.loadError) {
    const loadErrorKey =
      access.loadError === "authentication_required"
        ? "authenticationRequired"
        : access.loadError === "persistence_unavailable"
          ? "persistenceUnavailable"
          : "unexpected";

    return (
      <section
        className="mt-8 rounded-xl border border-white/20 bg-black/20 p-4 sm:p-6"
        aria-labelledby="saved-presets-title"
      >
        <h2 id="saved-presets-title" className="text-2xl font-bold">
          {translations("presets.title")}
        </h2>
        <p className="mt-2 text-white/75">
          {translations("presets.explanation")}
        </p>
        <p
          className="mt-4 rounded-lg border border-red-300/40 bg-red-950/40 p-3 text-red-100"
          role="alert"
        >
          {translations(`presets.errors.${loadErrorKey}`)}
        </p>
        {hasSessionError && (
          <Link
            href="/login"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-white/30 px-4 py-2 font-bold outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-red-300"
          >
            {translations("presets.signIn")}
          </Link>
        )}
      </section>
    );
  }

  return (
    <section
      className="mt-8 min-w-0 rounded-xl border border-white/20 bg-black/20 p-4 sm:p-6"
      aria-labelledby="saved-presets-title"
      aria-busy={pendingOperation !== null}
    >
      <h2 id="saved-presets-title" className="text-2xl font-bold">
        {translations("presets.title")}
      </h2>
      <p className="mt-2 max-w-3xl text-white/75">
        {translations("presets.explanation")}
      </p>

      {presets.length === 0 ? (
        <p className="mt-5 rounded-lg border border-white/15 bg-black/20 p-4 text-white/75">
          {translations("presets.empty")}
        </p>
      ) : (
        <ol className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
          {presets.map((preset) => {
            const isEditing = editPresetId === preset.id;
            const isConfirmingDelete = deletePresetId === preset.id;
            const isUpdating =
              pendingOperation === `update:${preset.id}`;
            const isDeleting =
              pendingOperation === `delete:${preset.id}`;

            return (
              <li
                key={preset.id}
                className="min-w-0 rounded-lg border border-white/15 bg-black/20 p-4"
              >
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-200">
                      {translations("presets.slot", {
                        slot: preset.slot,
                        maximum: MAX_SAVED_CUSTOM_DICE_PRESETS,
                      })}
                    </p>
                    <h3 className="mt-1 break-words text-lg font-bold">
                      {preset.name}
                    </h3>
                  </div>
                  {loadedPresetId === preset.id && (
                    <span className="rounded-full border border-emerald-300/40 bg-emerald-950/40 px-2 py-1 text-xs font-semibold text-emerald-100">
                      {translations("presets.loaded")}
                    </span>
                  )}
                </div>
                <p className="mt-2 break-words text-sm text-white/70">
                  {quantitySummary(preset)}
                </p>

                {isEditing ? (
                  <form
                    className="mt-4"
                    onSubmit={(event) => handleUpdate(event, preset.id)}
                    noValidate
                  >
                    <label
                      htmlFor={`preset-edit-name-${preset.id}`}
                      className="text-sm font-bold"
                    >
                      {translations("presets.nameLabel")}
                    </label>
                    <input
                      id={`preset-edit-name-${preset.id}`}
                      value={editName}
                      onChange={(event) => {
                        setEditName(event.target.value);
                        setEditNameError(null);
                        setFeedback(null);
                      }}
                      aria-invalid={Boolean(editNameError)}
                      aria-describedby={
                        editNameError
                          ? `preset-edit-name-error-${preset.id}`
                          : undefined
                      }
                      disabled={isUpdating}
                      className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/30 bg-neutral-950 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60"
                    />
                    {editNameError && (
                      <p
                        id={`preset-edit-name-error-${preset.id}`}
                        className="mt-2 text-sm text-red-200"
                      >
                        {translations(
                          `presets.errors.${editNameError}`,
                          {
                            maximum:
                              SAVED_CUSTOM_DICE_PRESET_LIMITS.nameCodePoints,
                          },
                        )}
                      </p>
                    )}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        type="submit"
                        disabled={pendingOperation !== null}
                        className="min-h-11 rounded-lg bg-white px-4 py-2 font-bold text-neutral-950 outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUpdating
                          ? translations("presets.updating")
                          : translations("presets.update")}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isUpdating}
                        className="min-h-11 rounded-lg border border-white/30 px-4 py-2 font-bold outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60"
                      >
                        {translations("presets.cancel")}
                      </button>
                    </div>
                  </form>
                ) : isConfirmingDelete ? (
                  <div
                    className="mt-4 rounded-lg border border-red-300/35 bg-red-950/30 p-3"
                    role="group"
                    aria-label={translations("presets.confirmDelete", {
                      name: preset.name,
                    })}
                  >
                    <p className="text-sm text-red-100">
                      {translations("presets.confirmDelete", {
                        name: preset.name,
                      })}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleDelete(preset.id)}
                        disabled={pendingOperation !== null}
                        className="min-h-11 rounded-lg bg-red-700 px-4 py-2 font-bold text-white outline-none hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting
                          ? translations("presets.deleting")
                          : translations("presets.confirmDeleteAction")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePresetId(null)}
                        disabled={isDeleting}
                        className="min-h-11 rounded-lg border border-white/30 px-4 py-2 font-bold outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60"
                      >
                        {translations("presets.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleLoad(preset)}
                      className="min-h-11 rounded-lg bg-white px-4 py-2 font-bold text-neutral-950 outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                      {translations("presets.load")}
                    </button>
                    <button
                      type="button"
                      onClick={() => beginEdit(preset)}
                      disabled={pendingOperation !== null}
                      className="min-h-11 rounded-lg border border-white/30 px-4 py-2 font-bold outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60"
                    >
                      {translations("presets.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletePresetId(preset.id);
                        setEditPresetId(null);
                        setFeedback(null);
                      }}
                      disabled={pendingOperation !== null}
                      className="min-h-11 rounded-lg border border-red-300/50 px-4 py-2 font-bold text-red-100 outline-none hover:bg-red-950/40 focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60"
                    >
                      {translations("presets.delete")}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {sectionMode !== "limit" && (
        <form
          className="mt-6 rounded-lg border border-white/15 bg-black/20 p-4"
          onSubmit={handleCreate}
          noValidate
        >
          <h3 className="text-lg font-bold">
            {translations("presets.createTitle")}
          </h3>
          <p className="mt-1 text-sm text-white/70">
            {translations("presets.createHelp")}
          </p>
          <label
            htmlFor="new-preset-name"
            className="mt-4 block text-sm font-bold"
          >
            {translations("presets.nameLabel")}
          </label>
          <div className="mt-2 flex min-w-0 flex-col gap-3 sm:flex-row">
            <input
              id="new-preset-name"
              value={createName}
              onChange={(event) => {
                setCreateName(event.target.value);
                setCreateNameError(null);
                setFeedback(null);
              }}
              aria-invalid={Boolean(createNameError)}
              aria-describedby={
                createNameError ? "new-preset-name-error" : undefined
              }
              disabled={pendingOperation === "create"}
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/30 bg-neutral-950 px-3 text-white outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={pendingOperation !== null}
              className="min-h-11 shrink-0 rounded-lg bg-white px-5 py-2 font-bold text-neutral-950 outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingOperation === "create"
                ? translations("presets.saving")
                : translations("presets.save")}
            </button>
          </div>
          {createNameError && (
            <p
              id="new-preset-name-error"
              className="mt-2 text-sm text-red-200"
            >
              {translations(`presets.errors.${createNameError}`, {
                maximum:
                  SAVED_CUSTOM_DICE_PRESET_LIMITS.nameCodePoints,
              })}
            </p>
          )}
        </form>
      )}

      {sectionMode === "limit" && (
        <p className="mt-5 rounded-lg border border-amber-200/35 bg-amber-950/30 p-3 text-amber-100">
          {translations("presets.limit", {
            maximum: MAX_SAVED_CUSTOM_DICE_PRESETS,
          })}
        </p>
      )}

      {feedback && (
        <div
          className={`mt-4 rounded-lg border p-3 ${
            feedback.kind === "error"
              ? "border-red-300/40 bg-red-950/40 text-red-100"
              : "border-emerald-300/40 bg-emerald-950/40 text-emerald-100"
          }`}
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live={feedback.kind === "error" ? "assertive" : "polite"}
        >
          <p>
            {translations(
              feedback.kind === "success"
                ? `presets.success.${feedback.messageKey}`
                : `presets.errors.${feedback.messageKey}`,
              {
                maximum:
                  feedback.messageKey === "nameTooLong"
                    ? SAVED_CUSTOM_DICE_PRESET_LIMITS.nameCodePoints
                    : MAX_SAVED_CUSTOM_DICE_PRESETS,
              },
            )}
          </p>
          {hasSessionError && (
            <Link
              href="/login"
              className="mt-2 inline-flex min-h-11 items-center rounded-lg underline outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              {translations("presets.signIn")}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
