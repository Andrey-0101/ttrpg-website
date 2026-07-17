import { VTM_V5_DICE_LIMITS } from "./dice-engine";

export type VtmV5DieKind = "normal" | "hunger";
export type VtmV5DiceDisplayMode = "symbols" | "numbers";
export type VtmV5DieSymbolCategory =
  | "failure"
  | "success"
  | "critical"
  | "bestial-failure"
  | "messy-critical";

export type VtmV5DieSymbol = {
  category: VtmV5DieSymbolCategory;
  src: string;
};

const SYMBOLS = {
  normal: {
    failure: {
      category: "failure",
      src: "/assets/world-of-darkness/vtm-v5/dice/regular-failure.png",
    },
    success: {
      category: "success",
      src: "/assets/world-of-darkness/vtm-v5/dice/regular-success.png",
    },
    critical: {
      category: "critical",
      src: "/assets/world-of-darkness/vtm-v5/dice/regular-critical.png",
    },
  },
  hunger: {
    "bestial-failure": {
      category: "bestial-failure",
      src: "/assets/world-of-darkness/vtm-v5/dice/hunger-bestial-failure.png",
    },
    failure: {
      category: "failure",
      src: "/assets/world-of-darkness/vtm-v5/dice/hunger-failure.png",
    },
    success: {
      category: "success",
      src: "/assets/world-of-darkness/vtm-v5/dice/hunger-success.png",
    },
    "messy-critical": {
      category: "messy-critical",
      src: "/assets/world-of-darkness/vtm-v5/dice/hunger-messy-critical.png",
    },
  },
} as const satisfies Record<
  VtmV5DieKind,
  Partial<Record<VtmV5DieSymbolCategory, VtmV5DieSymbol>>
>;

function assertD10(value: number): void {
  if (
    !Number.isInteger(value) ||
    value < VTM_V5_DICE_LIMITS.die.minimum ||
    value > VTM_V5_DICE_LIMITS.die.maximum
  ) {
    throw new RangeError("A VtM V5 die display value must be an integer from 1 through 10.");
  }
}

export function getVtmV5DieSymbol(
  kind: VtmV5DieKind,
  value: number,
): VtmV5DieSymbol {
  assertD10(value);

  if (kind === "normal") {
    if (value === 10) {
      return SYMBOLS.normal.critical;
    }

    return value >= 6 ? SYMBOLS.normal.success : SYMBOLS.normal.failure;
  }

  if (value === 1) {
    return SYMBOLS.hunger["bestial-failure"];
  }

  if (value === 10) {
    return SYMBOLS.hunger["messy-critical"];
  }

  return value >= 6 ? SYMBOLS.hunger.success : SYMBOLS.hunger.failure;
}

export function getVtmV5DiePresentation(
  kind: VtmV5DieKind,
  value: number,
  mode: VtmV5DiceDisplayMode,
): {
  kind: VtmV5DieKind;
  value: number;
  symbol: VtmV5DieSymbol | null;
} {
  assertD10(value);

  return {
    kind,
    value,
    symbol: mode === "symbols" ? getVtmV5DieSymbol(kind, value) : null,
  };
}
