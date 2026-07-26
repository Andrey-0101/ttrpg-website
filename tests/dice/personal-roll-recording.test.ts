import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  type CustomDicePoolResult,
} from "../../lib/dice/custom-dice-pool";
import {
  type CustomPersonalRollRecordingInput,
  type VtmV5PersonalRollRecordingInput,
  recordCustomRollBestEffort,
  recordVtmV5RollBestEffort,
} from "../../lib/dice/personal-roll-recording";
import {
  evaluateVtmV5Dice,
  type VtmV5DiceResult,
} from "../../lib/game-systems/vtm-v5/dice-engine";

const VTM_UUID = "0a2c08cb-df4f-48a8-bb5e-b79a32782b18";
const CUSTOM_UUID = "a13ffde0-cab3-455f-8181-a1dbc21c25f5";

function createVtmSnapshot(): VtmV5DiceResult {
  const evaluation = evaluateVtmV5Dice({
    request: {
      pool: 4,
      hungerDice: 2,
      difficulty: 3,
      label: "Hunt prey",
    },
    normalDice: [10, 6],
    hungerDiceResults: [10, 1],
  });

  assert.equal(
    evaluation.ok,
    true,
    evaluation.ok ? undefined : JSON.stringify(evaluation.errors),
  );
  return evaluation.result;
}

function createCustomSnapshot(): CustomDicePoolResult {
  return {
    quantities: {
      coin: 2,
      4: 2,
      6: 0,
      8: 0,
      10: 0,
      12: 0,
      20: 1,
      100: 0,
    },
    coinResults: ["heads", "tails"],
    groups: [
      { sides: 4, results: [1, 4] },
      { sides: 20, results: [20] },
    ],
    totalItems: 5,
    numericDiceTotal: 25,
  };
}

test("guest VtM rolls do not create an id or call the action", async () => {
  let uuidCalls = 0;
  let actionCalls = 0;

  await recordVtmV5RollBestEffort({
    authenticated: false,
    snapshot: createVtmSnapshot(),
    uuidFactory() {
      uuidCalls += 1;
      return VTM_UUID;
    },
    async recordAction() {
      actionCalls += 1;
    },
  });

  assert.equal(uuidCalls, 0);
  assert.equal(actionCalls, 0);
});

test("guest Custom rolls do not create an id or call the action", async () => {
  let uuidCalls = 0;
  let actionCalls = 0;

  await recordCustomRollBestEffort({
    authenticated: false,
    snapshot: createCustomSnapshot(),
    uuidFactory() {
      uuidCalls += 1;
      return CUSTOM_UUID;
    },
    async recordAction() {
      actionCalls += 1;
    },
  });

  assert.equal(uuidCalls, 0);
  assert.equal(actionCalls, 0);
});

test("authenticated VtM rolls copy the complete snapshot with one id", async () => {
  const snapshot = createVtmSnapshot();
  const actionInputs: unknown[] = [];
  let uuidCalls = 0;

  await recordVtmV5RollBestEffort({
    authenticated: true,
    snapshot,
    uuidFactory() {
      uuidCalls += 1;
      return VTM_UUID;
    },
    async recordAction(input) {
      actionInputs.push(input);
      return { ok: true };
    },
  });

  assert.equal(uuidCalls, 1);
  assert.equal(actionInputs.length, 1);
  assert.deepEqual(actionInputs[0], {
    clientRollId: VTM_UUID,
    rollerKind: "vtm_v5",
    schemaVersion: 1,
    requestData: {
      request: snapshot.request,
      normalDice: snapshot.normalDice,
      hungerDiceResults: snapshot.hungerDiceResults,
    },
    resultData: snapshot,
  });

  const input = actionInputs[0] as VtmV5PersonalRollRecordingInput;
  assert.equal(input.clientRollId, VTM_UUID);
  assert.notStrictEqual(input.requestData.request, snapshot.request);
  assert.notStrictEqual(input.requestData.normalDice, snapshot.normalDice);
  assert.notStrictEqual(
    input.requestData.hungerDiceResults,
    snapshot.hungerDiceResults,
  );
  assert.notStrictEqual(input.resultData.request, snapshot.request);
  assert.notStrictEqual(input.resultData.normalDice, snapshot.normalDice);
  assert.notStrictEqual(
    input.resultData.hungerDiceResults,
    snapshot.hungerDiceResults,
  );
  assert.notStrictEqual(
    input.resultData.detailFlags,
    snapshot.detailFlags,
  );
});

test("authenticated Custom rolls copy quantities, coins, and every group", async () => {
  const snapshot = createCustomSnapshot();
  const actionInputs: unknown[] = [];
  let uuidCalls = 0;

  await recordCustomRollBestEffort({
    authenticated: true,
    snapshot,
    uuidFactory() {
      uuidCalls += 1;
      return CUSTOM_UUID;
    },
    async recordAction(input) {
      actionInputs.push(input);
      return { ok: true };
    },
  });

  assert.equal(uuidCalls, 1);
  assert.equal(actionInputs.length, 1);
  assert.deepEqual(actionInputs[0], {
    clientRollId: CUSTOM_UUID,
    rollerKind: "custom_dice_pool",
    schemaVersion: 1,
    requestData: {
      quantities: snapshot.quantities,
    },
    resultData: {
      coinResults: snapshot.coinResults,
      groups: snapshot.groups,
    },
  });

  const input = actionInputs[0] as CustomPersonalRollRecordingInput;
  assert.equal(input.clientRollId, CUSTOM_UUID);
  assert.notStrictEqual(
    input.requestData.quantities,
    snapshot.quantities,
  );
  assert.notStrictEqual(input.resultData.coinResults, snapshot.coinResults);
  assert.notStrictEqual(input.resultData.groups, snapshot.groups);
  assert.equal(input.resultData.groups.length, snapshot.groups.length);
  input.resultData.groups.forEach((group, index) => {
    assert.notStrictEqual(group, snapshot.groups[index]);
    assert.notStrictEqual(group.results, snapshot.groups[index].results);
  });
});

test("VtM action payload is isolated from later snapshot mutations", async () => {
  const snapshot = createVtmSnapshot();
  let actionInput: VtmV5PersonalRollRecordingInput | undefined;

  const recording = recordVtmV5RollBestEffort({
    authenticated: true,
    snapshot,
    uuidFactory: () => VTM_UUID,
    async recordAction(input) {
      actionInput = input as VtmV5PersonalRollRecordingInput;
    },
  });

  snapshot.request.label = "Changed";
  (snapshot.normalDice as number[])[0] = 1;
  (snapshot.hungerDiceResults as number[])[0] = 2;
  snapshot.detailFlags.hasHungerTen = false;
  await recording;

  assert.ok(actionInput);
  assert.equal(actionInput.requestData.request.label, "Hunt prey");
  assert.deepEqual(actionInput.requestData.normalDice, [10, 6]);
  assert.deepEqual(actionInput.requestData.hungerDiceResults, [10, 1]);
  assert.equal(actionInput.resultData.request.label, "Hunt prey");
  assert.deepEqual(actionInput.resultData.normalDice, [10, 6]);
  assert.deepEqual(actionInput.resultData.hungerDiceResults, [10, 1]);
  assert.equal(actionInput.resultData.detailFlags.hasHungerTen, true);
});

test("Custom action payload is isolated from later snapshot mutations", async () => {
  const snapshot = createCustomSnapshot();
  let actionInput: CustomPersonalRollRecordingInput | undefined;

  const recording = recordCustomRollBestEffort({
    authenticated: true,
    snapshot,
    uuidFactory: () => CUSTOM_UUID,
    async recordAction(input) {
      actionInput = input as CustomPersonalRollRecordingInput;
    },
  });

  snapshot.quantities.coin = 0;
  snapshot.coinResults[0] = "tails";
  snapshot.groups[0].sides = 6;
  snapshot.groups[0].results[0] = 4;
  snapshot.groups.push({ sides: 8, results: [8] });
  await recording;

  assert.ok(actionInput);
  assert.equal(actionInput.requestData.quantities.coin, 2);
  assert.deepEqual(actionInput.resultData.coinResults, ["heads", "tails"]);
  assert.deepEqual(actionInput.resultData.groups, [
    { sides: 4, results: [1, 4] },
    { sides: 20, results: [20] },
  ]);
});

test("separate rolls receive separate ids and separate nested values", async () => {
  const vtmInputs: VtmV5PersonalRollRecordingInput[] = [];
  const customInputs: CustomPersonalRollRecordingInput[] = [];
  const ids = [
    "141bcfb4-2668-4dd3-a9ea-06d772639881",
    "2811fe84-c379-4815-b184-3bb55418ea1f",
    "cad23e99-9bf7-459a-98e4-75621b704642",
    "f9b13815-f49f-41c6-9c43-00183aa3799c",
  ];
  let idIndex = 0;
  const uuidFactory = () => ids[idIndex++];
  const vtmSnapshot = createVtmSnapshot();
  const customSnapshot = createCustomSnapshot();

  await recordVtmV5RollBestEffort({
    authenticated: true,
    snapshot: vtmSnapshot,
    uuidFactory,
    async recordAction(input) {
      vtmInputs.push(input as VtmV5PersonalRollRecordingInput);
    },
  });
  await recordVtmV5RollBestEffort({
    authenticated: true,
    snapshot: vtmSnapshot,
    uuidFactory,
    async recordAction(input) {
      vtmInputs.push(input as VtmV5PersonalRollRecordingInput);
    },
  });
  await recordCustomRollBestEffort({
    authenticated: true,
    snapshot: customSnapshot,
    uuidFactory,
    async recordAction(input) {
      customInputs.push(input as CustomPersonalRollRecordingInput);
    },
  });
  await recordCustomRollBestEffort({
    authenticated: true,
    snapshot: customSnapshot,
    uuidFactory,
    async recordAction(input) {
      customInputs.push(input as CustomPersonalRollRecordingInput);
    },
  });

  assert.deepEqual(
    [...vtmInputs, ...customInputs].map(({ clientRollId }) => clientRollId),
    ids,
  );
  assert.notStrictEqual(
    vtmInputs[0].requestData.request,
    vtmInputs[1].requestData.request,
  );
  assert.notStrictEqual(
    vtmInputs[0].resultData.normalDice,
    vtmInputs[1].resultData.normalDice,
  );
  assert.notStrictEqual(
    vtmInputs[0].resultData.detailFlags,
    vtmInputs[1].resultData.detailFlags,
  );
  assert.notStrictEqual(
    customInputs[0].requestData.quantities,
    customInputs[1].requestData.quantities,
  );
  assert.notStrictEqual(
    customInputs[0].resultData.coinResults,
    customInputs[1].resultData.coinResults,
  );
  assert.notStrictEqual(
    customInputs[0].resultData.groups,
    customInputs[1].resultData.groups,
  );
  assert.notStrictEqual(
    customInputs[0].resultData.groups[0].results,
    customInputs[1].resultData.groups[0].results,
  );
});

test("recording failures and safe failures never reject the helper", async () => {
  const failureActions = [
    () => {
      throw new Error("synchronous failure");
    },
    () => Promise.reject(new Error("asynchronous failure")),
    async () => ({ ok: false, error: { code: "persistence_unavailable" } }),
  ];

  for (const recordAction of failureActions) {
    await assert.doesNotReject(
      recordVtmV5RollBestEffort({
        authenticated: true,
        snapshot: createVtmSnapshot(),
        uuidFactory: () => VTM_UUID,
        recordAction,
      }),
    );
    await assert.doesNotReject(
      recordCustomRollBestEffort({
        authenticated: true,
        snapshot: createCustomSnapshot(),
        uuidFactory: () => CUSTOM_UUID,
        recordAction,
      }),
    );
  }
});

test("recording helper has no data client, React, global state, or retry loop", () => {
  const source = readFileSync(
    resolve(process.cwd(), "lib/dice/personal-roll-recording.ts"),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /@supabase|create(?:Browser|Server)Client|\bcreateClient\s*\(|\.from\s*\(|\.rpc\s*\(/u,
  );
  assert.doesNotMatch(source, /from\s+["']react["']|\buse[A-Z]\w*\s*\(/u);
  assert.doesNotMatch(
    source,
    /^(?:export\s+)?(?:let|var)\s+[A-Za-z_$]/mu,
  );
  assert.doesNotMatch(source, /\b(?:for|while)\s*\(/u);
});

test("VtM roller records only the successful local snapshot", () => {
  const pageSource = readFileSync(
    resolve(
      process.cwd(),
      "app/[locale]/games/vampire-the-masquerade/tools/dice/page.tsx",
    ),
    "utf8",
  );
  const rollerSource = readFileSync(
    resolve(
      process.cwd(),
      "components/games/vtm-v5/personal-dice-roller.tsx",
    ),
    "utf8",
  );

  assert.match(rollerSource, /recordVtmV5RollBestEffort/u);
  assert.match(rollerSource, /recordPersonalRollAction/u);

  const validationExitIndex = rollerSource.indexOf(
    "setErrors(nextErrors);",
  );
  const localRollIndex = rollerSource.indexOf("rollVtmV5Dice({");
  const failedEvaluationIndex = rollerSource.indexOf("if (!evaluation.ok)");
  const snapshotIndex = rollerSource.indexOf(
    "const snapshot = evaluation.result;",
  );
  const setResultIndex = rollerSource.indexOf("setResult(snapshot);");
  const recordIndex = rollerSource.indexOf(
    "void recordVtmV5RollBestEffort({",
  );

  assert.ok(validationExitIndex >= 0);
  assert.ok(validationExitIndex < localRollIndex);
  assert.ok(localRollIndex < failedEvaluationIndex);
  assert.ok(failedEvaluationIndex < snapshotIndex);
  assert.ok(snapshotIndex < setResultIndex);
  assert.ok(setResultIndex < recordIndex);
  assert.equal(
    rollerSource.match(/void recordVtmV5RollBestEffort\(\{/gu)?.length,
    1,
  );

  assert.doesNotMatch(rollerSource, /\buseEffect\b/u);
  assert.doesNotMatch(
    rollerSource,
    /@supabase|create(?:Browser|Server)Client|\bcreateClient\s*\(|\.from\s*\(|\.rpc\s*\(/u,
  );

  assert.match(pageSource, /auth\.getClaims\(\)/u);
  assert.match(
    pageSource,
    /<PersonalDiceRoller\s+authenticated=\{authenticated\}\s*\/>/u,
  );
  assert.match(pageSource, /descriptionAuthenticated/u);
  assert.match(pageSource, /descriptionGuest/u);
});

test("Custom roller records only the successful local snapshot", () => {
  const pageSource = readFileSync(
    resolve(process.cwd(), "app/[locale]/dice-rollers/custom/page.tsx"),
    "utf8",
  );
  const rollerSource = readFileSync(
    resolve(process.cwd(), "components/dice-rollers/custom-dice-pool.tsx"),
    "utf8",
  );
  const presetSource = readFileSync(
    resolve(
      process.cwd(),
      "components/dice-rollers/saved-custom-dice-presets.tsx",
    ),
    "utf8",
  );

  assert.match(rollerSource, /recordCustomRollBestEffort/u);
  assert.match(rollerSource, /recordPersonalRollAction/u);

  const localRollIndex = rollerSource.indexOf("rollCustomDicePool(");
  const failedEvaluationIndex = rollerSource.indexOf("if (!evaluation.ok)");
  const snapshotIndex = rollerSource.indexOf(
    "const snapshot = evaluation.result;",
  );
  const setResultIndex = rollerSource.indexOf("setResult(snapshot);");
  const recordIndex = rollerSource.indexOf(
    "void recordCustomRollBestEffort({",
  );

  assert.ok(localRollIndex >= 0);
  assert.ok(localRollIndex < failedEvaluationIndex);
  assert.ok(failedEvaluationIndex < snapshotIndex);
  assert.ok(snapshotIndex < setResultIndex);
  assert.ok(setResultIndex < recordIndex);
  assert.equal(
    rollerSource.match(/void recordCustomRollBestEffort\(\{/gu)?.length,
    1,
  );
  assert.match(
    rollerSource,
    /authenticated:\s*presetAccess\.authenticated\s*===\s*true/u,
  );

  assert.doesNotMatch(
    rollerSource,
    /onLoad[\s\S]{0,300}recordCustomRollBestEffort/u,
  );
  assert.doesNotMatch(
    presetSource,
    /recordCustomRollBestEffort|recordPersonalRollAction/u,
  );
  assert.doesNotMatch(rollerSource, /\buseEffect\b/u);
  assert.doesNotMatch(
    rollerSource,
    /@supabase|create(?:Browser|Server)Client|\bcreateClient\s*\(|\.from\s*\(|\.rpc\s*\(/u,
  );

  assert.match(pageSource, /presetAccess\.authenticated\s*===\s*true/u);
  assert.match(pageSource, /presetAccess\.authenticated\s*===\s*false/u);
  assert.match(pageSource, /privacyNoteAuthenticated/u);
  assert.match(pageSource, /privacyNoteGuest/u);
  assert.match(pageSource, /privacyNoteUnavailable/u);
});
