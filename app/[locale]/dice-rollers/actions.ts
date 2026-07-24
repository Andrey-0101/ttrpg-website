"use server";

import {
  clearPersonalRollHistory,
  createSavedCustomDicePreset,
  deletePersonalRoll,
  deleteSavedCustomDicePreset,
  recordPersonalRoll,
  updateSavedCustomDicePreset,
} from "../../../lib/dice/personal-dice-persistence.server";

export async function createSavedCustomDicePresetAction(
  input: unknown,
) {
  return createSavedCustomDicePreset(input);
}

export async function updateSavedCustomDicePresetAction(
  input: unknown,
) {
  return updateSavedCustomDicePreset(input);
}

export async function deleteSavedCustomDicePresetAction(
  input: unknown,
) {
  return deleteSavedCustomDicePreset(input);
}

export async function recordPersonalRollAction(input: unknown) {
  return recordPersonalRoll(input);
}

export async function deletePersonalRollAction(input: unknown) {
  return deletePersonalRoll(input);
}

export async function clearPersonalRollHistoryAction() {
  return clearPersonalRollHistory();
}
