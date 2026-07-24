import "server-only";

import {
  createPersonalDicePersistenceService,
  runPersonalDicePersistenceOperation,
  type PersonalDicePersistenceDataSource,
} from "./personal-dice-persistence-service";
import { createClient } from "../../utils/supabase/server";
import type { Database } from "../../types/database.types";

type CreatePresetArgs =
  Database["public"]["Functions"]["create_custom_dice_preset"]["Args"];
type UpdatePresetArgs =
  Database["public"]["Functions"]["update_custom_dice_preset"]["Args"];
type DeletePresetArgs =
  Database["public"]["Functions"]["delete_custom_dice_preset"]["Args"];
type RecordRollArgs =
  Database["public"]["Functions"]["record_personal_roll"]["Args"];
type DeleteRollArgs =
  Database["public"]["Functions"]["delete_personal_roll"]["Args"];

type CookieBoundClient = Awaited<ReturnType<typeof createClient>>;

function createDataSource(
  client: CookieBoundClient,
): PersonalDicePersistenceDataSource {
  return {
    async getAuthenticatedUser() {
      const { data, error } = await client.auth.getUser();
      return {
        data: {
          authenticated: Boolean(data.user),
        },
        error,
      };
    },

    async listPresetRows({ orderBy, ascending }) {
      const { data, error } = await client
        .from("custom_dice_presets")
        .select(
          "id, name, slot, coin_quantity, d4_quantity, d6_quantity, d8_quantity, d10_quantity, d12_quantity, d20_quantity, d100_quantity, created_at, updated_at",
        )
        .order(orderBy, { ascending });

      return { data, error };
    },

    async createPreset(args: CreatePresetArgs) {
      const { data, error } = await client.rpc(
        "create_custom_dice_preset",
        args,
      );
      return { data, error };
    },

    async updatePreset(args: UpdatePresetArgs) {
      const { data, error } = await client.rpc(
        "update_custom_dice_preset",
        args,
      );
      return { data, error };
    },

    async deletePreset(args: DeletePresetArgs) {
      const { data, error } = await client.rpc(
        "delete_custom_dice_preset",
        args,
      );
      return { data, error };
    },

    async listHistoryRows({ orderBy, ascending, limit }) {
      const { data, error } = await client
        .from("personal_roll_history")
        .select(
          "id, client_roll_id, roller_kind, schema_version, request_data, result_data, sequence_number, created_at",
        )
        .order(orderBy, { ascending })
        .limit(limit);

      return { data, error };
    },

    async recordRoll(args: RecordRollArgs) {
      const { data, error } = await client.rpc(
        "record_personal_roll",
        args,
      );
      return { data, error };
    },

    async deleteRoll(args: DeleteRollArgs) {
      const { data, error } = await client.rpc(
        "delete_personal_roll",
        args,
      );
      return { data, error };
    },

    async clearHistory() {
      const { data, error } = await client.rpc(
        "clear_personal_roll_history",
      );
      return { data, error };
    },
  };
}

async function createService() {
  const client = await createClient();
  return createPersonalDicePersistenceService(
    createDataSource(client),
  );
}

export async function listSavedCustomDicePresets() {
  return runPersonalDicePersistenceOperation(
    "list_presets",
    createService,
    (service) => service.listSavedCustomDicePresets(),
  );
}

export async function createSavedCustomDicePreset(input: unknown) {
  return runPersonalDicePersistenceOperation(
    "create_preset",
    createService,
    (service) => service.createSavedCustomDicePreset(input),
  );
}

export async function updateSavedCustomDicePreset(input: unknown) {
  return runPersonalDicePersistenceOperation(
    "update_preset",
    createService,
    (service) => service.updateSavedCustomDicePreset(input),
  );
}

export async function deleteSavedCustomDicePreset(input: unknown) {
  return runPersonalDicePersistenceOperation(
    "delete_preset",
    createService,
    (service) => service.deleteSavedCustomDicePreset(input),
  );
}

export async function listPersonalRollHistory() {
  return runPersonalDicePersistenceOperation(
    "list_history",
    createService,
    (service) => service.listPersonalRollHistory(),
  );
}

export async function recordPersonalRoll(input: unknown) {
  return runPersonalDicePersistenceOperation(
    "record_roll",
    createService,
    (service) => service.recordPersonalRoll(input),
  );
}

export async function deletePersonalRoll(input: unknown) {
  return runPersonalDicePersistenceOperation(
    "delete_roll",
    createService,
    (service) => service.deletePersonalRoll(input),
  );
}

export async function clearPersonalRollHistory() {
  return runPersonalDicePersistenceOperation(
    "clear_history",
    createService,
    (service) => service.clearPersonalRollHistory(),
  );
}
