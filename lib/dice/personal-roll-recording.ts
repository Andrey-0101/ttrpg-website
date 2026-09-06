import type { CustomDicePoolResult } from "./custom-dice-pool";
import { PERSONAL_ROLL_SCHEMA_VERSION } from "./personal-dice-persistence";
import type { VtmV5DiceResult } from "../game-systems/vtm-v5/dice-engine";
import type {
  Coc7eOtherDiceResult,
  Coc7ePercentileTestResult,
} from "../game-systems/call-of-cthulhu-7e/dice-engine";

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

export type Coc7ePercentilePersonalRollRecordingInput = {
  clientRollId: string;
  rollerKind: "coc_7e_percentile";
  schemaVersion: typeof PERSONAL_ROLL_SCHEMA_VERSION;
  requestData: {
    request: Coc7ePercentileTestResult["request"];
    units: number;
    tensDice: number[];
  };
  resultData: Coc7ePercentileTestResult;
};

export type Coc7eOtherDicePersonalRollRecordingInput = {
  clientRollId: string;
  rollerKind: "coc_7e_other_dice";
  schemaVersion: typeof PERSONAL_ROLL_SCHEMA_VERSION;
  requestData: {
    request: Coc7eOtherDiceResult["request"];
    results: number[];
  };
  resultData: Coc7eOtherDiceResult;
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

export function buildCoc7ePercentilePersonalRollRecordingInput(
  clientRollId: string,
  snapshot: Coc7ePercentileTestResult,
): Coc7ePercentilePersonalRollRecordingInput {
  const request = { ...snapshot.request };
  const tensDice = [...snapshot.tensDice];

  return {
    clientRollId,
    rollerKind: "coc_7e_percentile",
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    requestData: {
      request: { ...request },
      units: snapshot.units,
      tensDice: [...tensDice],
    },
    resultData: {
      ...snapshot,
      request,
      tensDice,
      candidates: [...snapshot.candidates],
    },
  };
}

export function buildCoc7eOtherDicePersonalRollRecordingInput(
  clientRollId: string,
  snapshot: Coc7eOtherDiceResult,
): Coc7eOtherDicePersonalRollRecordingInput {
  const request = { ...snapshot.request };
  const results = [...snapshot.results];

  return {
    clientRollId,
    rollerKind: "coc_7e_other_dice",
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    requestData: {
      request: { ...request },
      results: [...results],
    },
    resultData: {
      ...snapshot,
      request,
      results,
    },
  };
}

async function recordRollBestEffort<Result, Input>({
  authenticated,
  snapshot,
  recordAction,
  uuidFactory,
  buildInput,
}: BestEffortRecordingOptions<Result> & {
  uuidFactory: PersonalRollUuidFactory;
  buildInput: (clientRollId: string, snapshot: Result) => Input;
}): Promise<void> {
  if (!authenticated) return;

  try {
    await recordAction(buildInput(uuidFactory(), snapshot));
  } catch {
    // Personal history must never affect the locally generated roll.
  }
}

export async function recordVtmV5RollBestEffort({
  authenticated,
  snapshot,
  recordAction,
  uuidFactory = createClientRollId,
}: BestEffortRecordingOptions<VtmV5DiceResult>): Promise<void> {
  return recordRollBestEffort({
    authenticated,
    snapshot,
    recordAction,
    uuidFactory,
    buildInput: buildVtmV5PersonalRollRecordingInput,
  });
}

export async function recordCustomRollBestEffort({
  authenticated,
  snapshot,
  recordAction,
  uuidFactory = createClientRollId,
}: BestEffortRecordingOptions<CustomDicePoolResult>): Promise<void> {
  return recordRollBestEffort({
    authenticated,
    snapshot,
    recordAction,
    uuidFactory,
    buildInput: buildCustomPersonalRollRecordingInput,
  });
}

export async function recordCoc7ePercentileRollBestEffort({
  authenticated,
  snapshot,
  recordAction,
  uuidFactory = createClientRollId,
}: BestEffortRecordingOptions<Coc7ePercentileTestResult>): Promise<void> {
  return recordRollBestEffort({
    authenticated,
    snapshot,
    recordAction,
    uuidFactory,
    buildInput: buildCoc7ePercentilePersonalRollRecordingInput,
  });
}

export async function recordCoc7eOtherDiceRollBestEffort({
  authenticated,
  snapshot,
  recordAction,
  uuidFactory = createClientRollId,
}: BestEffortRecordingOptions<Coc7eOtherDiceResult>): Promise<void> {
  return recordRollBestEffort({
    authenticated,
    snapshot,
    recordAction,
    uuidFactory,
    buildInput: buildCoc7eOtherDicePersonalRollRecordingInput,
  });
}
