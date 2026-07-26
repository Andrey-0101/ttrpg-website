import type { CustomDicePoolResult } from "./custom-dice-pool";
import { PERSONAL_ROLL_SCHEMA_VERSION } from "./personal-dice-persistence";
import type { VtmV5DiceResult } from "../game-systems/vtm-v5/dice-engine";

export type RecordPersonalRollAction = (input: unknown) => Promise<unknown>;
export type PersonalRollUuidFactory = () => string;

export type VtmV5PersonalRollRecordingInput = {
  clientRollId: string;
  rollerKind: "vtm_v5";
  schemaVersion: typeof PERSONAL_ROLL_SCHEMA_VERSION;
  requestData: {
    request: VtmV5DiceResult["request"];
    normalDice: number[];
    hungerDiceResults: number[];
  };
  resultData: VtmV5DiceResult;
};

export type CustomPersonalRollRecordingInput = {
  clientRollId: string;
  rollerKind: "custom_dice_pool";
  schemaVersion: typeof PERSONAL_ROLL_SCHEMA_VERSION;
  requestData: {
    quantities: CustomDicePoolResult["quantities"];
  };
  resultData: {
    coinResults: CustomDicePoolResult["coinResults"];
    groups: CustomDicePoolResult["groups"];
  };
};

type BestEffortRecordingOptions<Result> = {
  authenticated: boolean;
  snapshot: Result;
  recordAction: RecordPersonalRollAction;
  uuidFactory?: PersonalRollUuidFactory;
};

function createClientRollId(): string {
  return globalThis.crypto.randomUUID();
}

export function buildVtmV5PersonalRollRecordingInput(
  clientRollId: string,
  snapshot: VtmV5DiceResult,
): VtmV5PersonalRollRecordingInput {
  const request = { ...snapshot.request };
  const normalDice = [...snapshot.normalDice];
  const hungerDiceResults = [...snapshot.hungerDiceResults];

  return {
    clientRollId,
    rollerKind: "vtm_v5",
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    requestData: {
      request: { ...request },
      normalDice: [...normalDice],
      hungerDiceResults: [...hungerDiceResults],
    },
    resultData: {
      ...snapshot,
      request,
      normalDice,
      hungerDiceResults,
      detailFlags: { ...snapshot.detailFlags },
    },
  };
}

export function buildCustomPersonalRollRecordingInput(
  clientRollId: string,
  snapshot: CustomDicePoolResult,
): CustomPersonalRollRecordingInput {
  return {
    clientRollId,
    rollerKind: "custom_dice_pool",
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    requestData: {
      quantities: { ...snapshot.quantities },
    },
    resultData: {
      coinResults: [...snapshot.coinResults],
      groups: snapshot.groups.map((group) => ({
        sides: group.sides,
        results: [...group.results],
      })),
    },
  };
}

export async function recordVtmV5RollBestEffort({
  authenticated,
  snapshot,
  recordAction,
  uuidFactory = createClientRollId,
}: BestEffortRecordingOptions<VtmV5DiceResult>): Promise<void> {
  if (!authenticated) return;

  try {
    const input = buildVtmV5PersonalRollRecordingInput(
      uuidFactory(),
      snapshot,
    );
    await recordAction(input);
  } catch {
    // Personal history must never affect the locally generated roll.
  }
}

export async function recordCustomRollBestEffort({
  authenticated,
  snapshot,
  recordAction,
  uuidFactory = createClientRollId,
}: BestEffortRecordingOptions<CustomDicePoolResult>): Promise<void> {
  if (!authenticated) return;

  try {
    const input = buildCustomPersonalRollRecordingInput(
      uuidFactory(),
      snapshot,
    );
    await recordAction(input);
  } catch {
    // Personal history must never affect the locally generated roll.
  }
}
