import type { CustomDicePoolResult } from "./custom-dice-pool";
import { PERSONAL_ROLL_SCHEMA_VERSION } from "./personal-dice-persistence";
import type { PersonalRollHistoryEntry } from "./personal-dice-persistence-service";
import type {
  VtmV5DiceRequest,
  VtmV5DiceResult,
} from "../game-systems/vtm-v5/dice-engine";
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
    request: VtmV5DiceRequest;
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
    label?: string;
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
    label?: string;
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
    label?: string;
    request: Coc7eOtherDiceResult["request"];
    results: number[];
  };
  resultData: Coc7eOtherDiceResult;
};

type BestEffortRecordingOptions<Result> = {
  authenticated: boolean;
  snapshot: Result;
  label?: string | null;
  recordAction: RecordPersonalRollAction;
  uuidFactory?: PersonalRollUuidFactory;
  onClientRollId?: (clientRollId: string) => void;
  onRecorded?: (entry: PersonalRollHistoryEntry) => void;
};

function createClientRollId(): string {
  return globalThis.crypto.randomUUID();
}

export function buildVtmV5PersonalRollRecordingInput(
  clientRollId: string,
  snapshot: VtmV5DiceResult,
): VtmV5PersonalRollRecordingInput {
  const request: VtmV5DiceRequest = {
    pool: snapshot.request.pool,
    hungerDice: snapshot.request.hungerDice,
    ...(snapshot.request.difficulty === null
      ? {}
      : { difficulty: snapshot.request.difficulty }),
    ...(snapshot.request.label === null
      ? {}
      : { label: snapshot.request.label }),
  };
  const normalizedRequest = { ...snapshot.request };
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
      request: normalizedRequest,
      normalDice,
      hungerDiceResults,
      detailFlags: { ...snapshot.detailFlags },
    },
  };
}

export function buildCustomPersonalRollRecordingInput(
  clientRollId: string,
  snapshot: CustomDicePoolResult,
  label: string | null = null,
): CustomPersonalRollRecordingInput {
  return {
    clientRollId,
    rollerKind: "custom_dice_pool",
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    requestData: {
      ...(label === null ? {} : { label }),
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
  label: string | null = null,
): Coc7ePercentilePersonalRollRecordingInput {
  const request = { ...snapshot.request };
  const tensDice = [...snapshot.tensDice];

  return {
    clientRollId,
    rollerKind: "coc_7e_percentile",
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    requestData: {
      ...(label === null ? {} : { label }),
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
  label: string | null = null,
): Coc7eOtherDicePersonalRollRecordingInput {
  const request = { ...snapshot.request };
  const results = [...snapshot.results];

  return {
    clientRollId,
    rollerKind: "coc_7e_other_dice",
    schemaVersion: PERSONAL_ROLL_SCHEMA_VERSION,
    requestData: {
      ...(label === null ? {} : { label }),
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
  label = null,
  recordAction,
  uuidFactory,
  onClientRollId,
  onRecorded,
  buildInput,
}: BestEffortRecordingOptions<Result> & {
  uuidFactory: PersonalRollUuidFactory;
  buildInput: (
    clientRollId: string,
    snapshot: Result,
    label: string | null,
  ) => Input;
}): Promise<PersonalRollHistoryEntry | null> {
  if (!authenticated) return null;

  try {
    const clientRollId = uuidFactory();
    onClientRollId?.(clientRollId);
    const response = await recordAction(
      buildInput(clientRollId, snapshot, label),
    );

    if (
      typeof response === "object" &&
      response !== null &&
      "ok" in response &&
      response.ok === true &&
      "data" in response &&
      typeof response.data === "object" &&
      response.data !== null
    ) {
      const entry = response.data as PersonalRollHistoryEntry;
      onRecorded?.(entry);
      return entry;
    }
  } catch {
    // Personal history must never affect the locally generated roll.
  }

  return null;
}

export async function recordVtmV5RollBestEffort({
  authenticated,
  snapshot,
  recordAction,
  uuidFactory = createClientRollId,
  onClientRollId,
  onRecorded,
}: BestEffortRecordingOptions<VtmV5DiceResult>): Promise<
  PersonalRollHistoryEntry | null
> {
  return recordRollBestEffort({
    authenticated,
    snapshot,
    recordAction,
    uuidFactory,
    onClientRollId,
    onRecorded,
    buildInput: (clientRollId, value) =>
      buildVtmV5PersonalRollRecordingInput(clientRollId, value),
  });
}

export async function recordCustomRollBestEffort({
  authenticated,
  snapshot,
  label,
  recordAction,
  uuidFactory = createClientRollId,
  onClientRollId,
  onRecorded,
}: BestEffortRecordingOptions<CustomDicePoolResult>): Promise<
  PersonalRollHistoryEntry | null
> {
  return recordRollBestEffort({
    authenticated,
    snapshot,
    label,
    recordAction,
    uuidFactory,
    onClientRollId,
    onRecorded,
    buildInput: buildCustomPersonalRollRecordingInput,
  });
}

export async function recordCoc7ePercentileRollBestEffort({
  authenticated,
  snapshot,
  label,
  recordAction,
  uuidFactory = createClientRollId,
  onClientRollId,
  onRecorded,
}: BestEffortRecordingOptions<Coc7ePercentileTestResult>): Promise<
  PersonalRollHistoryEntry | null
> {
  return recordRollBestEffort({
    authenticated,
    snapshot,
    label,
    recordAction,
    uuidFactory,
    onClientRollId,
    onRecorded,
    buildInput: buildCoc7ePercentilePersonalRollRecordingInput,
  });
}

export async function recordCoc7eOtherDiceRollBestEffort({
  authenticated,
  snapshot,
  label,
  recordAction,
  uuidFactory = createClientRollId,
  onClientRollId,
  onRecorded,
}: BestEffortRecordingOptions<Coc7eOtherDiceResult>): Promise<
  PersonalRollHistoryEntry | null
> {
  return recordRollBestEffort({
    authenticated,
    snapshot,
    label,
    recordAction,
    uuidFactory,
    onClientRollId,
    onRecorded,
    buildInput: buildCoc7eOtherDicePersonalRollRecordingInput,
  });
}
