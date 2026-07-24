import {
  CUSTOM_DICE_POOL_LIMITS,
  CUSTOM_POOL_ITEM_KEYS,
  type CustomDiceQuantities,
  type CustomPoolItemKey,
} from "./custom-dice-pool";
import {
  SAVED_CUSTOM_DICE_PRESET_LIMITS,
  type PersonalDiceActionErrorCode,
  type PersonalDiceValidationIssue,
  type SavedCustomDicePreset,
  type SavedCustomDiceQuantities,
} from "./personal-dice-persistence-service";

export const MAX_SAVED_CUSTOM_DICE_PRESETS = 5;

export type CustomDiceQuantityFields = Record<CustomPoolItemKey, string>;

export type SavedPresetAccess =
  | {
      authenticated: false;
    }
  | {
      authenticated: null;
      loadError: "persistence_unavailable";
    }
  | {
      authenticated: true;
      presets: readonly SavedCustomDicePreset[];
      loadError:
        | "authentication_required"
        | "persistence_unavailable"
        | "unexpected_error"
        | null;
    };

export type SavedPresetSectionMode =
  | "guest"
  | "load-error"
  | "empty"
  | "available"
  | "limit";

export type PresetQuantitySummaryItem = {
  key: keyof SavedCustomDiceQuantities;
  count: number;
};

export type PresetValidationMessageKey =
  | "nameRequired"
  | "nameTooLong"
  | "invalidQuantity"
  | "poolEmpty"
  | "poolTooLarge"
  | "validationFailed";

export type PresetActionMessageKey =
  | PresetValidationMessageKey
  | "authenticationRequired"
  | "limitReached"
  | "notFound"
  | "nameConflict"
  | "persistenceUnavailable"
  | "unexpected";

export type PresetMutationInputResult =
  | {
      ok: true;
      name: string;
      quantities: SavedCustomDiceQuantities;
    }
  | {
      ok: false;
      messageKey: PresetValidationMessageKey;
      field: "name" | "form";
    };

const SAVED_QUANTITY_KEYS = [
  "coin",
  "d4",
  "d6",
  "d8",
  "d10",
  "d12",
  "d20",
  "d100",
] as const satisfies readonly (keyof SavedCustomDiceQuantities)[];

function copyPreset(preset: SavedCustomDicePreset): SavedCustomDicePreset {
  return {
    ...preset,
    quantities: { ...preset.quantities },
  };
}

export function sortSavedCustomDicePresets(
  presets: readonly SavedCustomDicePreset[],
): SavedCustomDicePreset[] {
  return presets
    .map(copyPreset)
    .sort((left, right) => left.slot - right.slot);
}

export function upsertSavedCustomDicePreset(
  presets: readonly SavedCustomDicePreset[],
  preset: SavedCustomDicePreset,
): SavedCustomDicePreset[] {
  return sortSavedCustomDicePresets([
    ...presets.filter((candidate) => candidate.id !== preset.id),
    preset,
  ]);
}

export function removeSavedCustomDicePreset(
  presets: readonly SavedCustomDicePreset[],
  presetId: string,
): SavedCustomDicePreset[] {
  return sortSavedCustomDicePresets(
    presets.filter((preset) => preset.id !== presetId),
  );
}

export function getSavedPresetSectionMode(
  access: SavedPresetAccess,
  presetCount: number,
  serverLimitReached = false,
): SavedPresetSectionMode {
  if (access.authenticated === false) return "guest";
  if (access.loadError) return "load-error";
  if (
    serverLimitReached ||
    presetCount >= MAX_SAVED_CUSTOM_DICE_PRESETS
  ) {
    return "limit";
  }
  return presetCount === 0 ? "empty" : "available";
}

export function getPresetQuantitySummary(
  quantities: SavedCustomDiceQuantities,
): PresetQuantitySummaryItem[] {
  return SAVED_QUANTITY_KEYS.flatMap((key) =>
    quantities[key] > 0
      ? [{ key, count: quantities[key] }]
      : [],
  );
}

export function presetToQuantityFields(
  preset: SavedCustomDicePreset,
): CustomDiceQuantityFields {
  return {
    coin: String(preset.quantities.coin),
    4: String(preset.quantities.d4),
    6: String(preset.quantities.d6),
    8: String(preset.quantities.d8),
    10: String(preset.quantities.d10),
    12: String(preset.quantities.d12),
    20: String(preset.quantities.d20),
    100: String(preset.quantities.d100),
  };
}

export function parseCustomDiceQuantityFields(
  fields: CustomDiceQuantityFields,
): CustomDiceQuantities {
  return Object.fromEntries(
    CUSTOM_POOL_ITEM_KEYS.map((item) => {
      const value = fields[item].trim();
      return [item, value === "" ? Number.NaN : Number(value)];
    }),
  ) as CustomDiceQuantities;
}

function toSavedQuantities(
  quantities: CustomDiceQuantities,
): SavedCustomDiceQuantities {
  return {
    coin: quantities.coin,
    d4: quantities[4],
    d6: quantities[6],
    d8: quantities[8],
    d10: quantities[10],
    d12: quantities[12],
    d20: quantities[20],
    d100: quantities[100],
  };
}

export function buildPresetMutationInput(
  nameInput: string,
  quantityFields: CustomDiceQuantityFields,
): PresetMutationInputResult {
  const name = nameInput.trim().replace(/\s+/gu, " ");
  if ([...name].length === 0) {
    return { ok: false, messageKey: "nameRequired", field: "name" };
  }
  if (
    [...name].length >
    SAVED_CUSTOM_DICE_PRESET_LIMITS.nameCodePoints
  ) {
    return { ok: false, messageKey: "nameTooLong", field: "name" };
  }

  const quantities = parseCustomDiceQuantityFields(quantityFields);
  let totalItems = 0;
  for (const item of CUSTOM_POOL_ITEM_KEYS) {
    const quantity = quantities[item];
    if (
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > CUSTOM_DICE_POOL_LIMITS.quantityPerType
    ) {
      return {
        ok: false,
        messageKey: "invalidQuantity",
        field: "form",
      };
    }
    totalItems += quantity;
  }

  if (totalItems === 0) {
    return { ok: false, messageKey: "poolEmpty", field: "form" };
  }
  if (totalItems > CUSTOM_DICE_POOL_LIMITS.totalDice) {
    return { ok: false, messageKey: "poolTooLarge", field: "form" };
  }

  return {
    ok: true,
    name,
    quantities: toSavedQuantities(quantities),
  };
}

function mapValidationIssues(
  issues: readonly PersonalDiceValidationIssue[] | undefined,
): PresetActionMessageKey {
  if (!issues || issues.length === 0) return "validationFailed";

  for (const issue of issues) {
    if (
      issue.path === "name" &&
      (issue.code === "required" ||
        issue.code === "name-empty" ||
        issue.code === "invalid-type")
    ) {
      return "nameRequired";
    }
    if (issue.path === "name" && issue.code === "name-too-long") {
      return "nameTooLong";
    }
    if (issue.path === "quantities" && issue.code === "pool-empty") {
      return "poolEmpty";
    }
    if (issue.path === "quantities" && issue.code === "pool-too-large") {
      return "poolTooLarge";
    }
    if (
      issue.path.startsWith("quantities.") &&
      [
        "required",
        "invalid-type",
        "not-finite",
        "not-integer",
        "out-of-range",
      ].includes(issue.code)
    ) {
      return "invalidQuantity";
    }
  }

  return "validationFailed";
}

export function mapPresetActionError(
  code: PersonalDiceActionErrorCode,
  issues?: readonly PersonalDiceValidationIssue[],
): PresetActionMessageKey {
  switch (code) {
    case "authentication_required":
      return "authenticationRequired";
    case "validation_failed":
      return mapValidationIssues(issues);
    case "preset_limit_reached":
      return "limitReached";
    case "preset_not_found":
      return "notFound";
    case "preset_name_conflict":
      return "nameConflict";
    case "persistence_unavailable":
      return "persistenceUnavailable";
    default:
      return "unexpected";
  }
}

export function canStartPresetMutation(
  pendingOperation: string | null,
): boolean {
  return pendingOperation === null;
}

export async function completePresetMutationSafely(
  mutation: () => Promise<void>,
): Promise<boolean> {
  try {
    await mutation();
    return true;
  } catch {
    return false;
  }
}
