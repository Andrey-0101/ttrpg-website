import "server-only";

import {
  mapJournalRow,
  toJson,
  type CampaignDiceApiResult,
  type CampaignDiceRequest,
  type CampaignDiceRollType,
  type CampaignDiceSuccess,
} from "@/lib/campaign-dice/contracts";
import { validateOptionalDiceRollLabel } from "@/lib/dice/validation";
import { normalizeGameSystemId } from "@/lib/characters/game-systems";
import {
  rollCoc7eOtherDice,
  rollCoc7ePercentileTest,
} from "@/lib/game-systems/call-of-cthulhu-7e/dice-roller";
import { rollVtmV5Dice } from "@/lib/game-systems/vtm-v5/dice-roller";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
} as const;

const ERROR_STATUS = {
  malformed_request: 400,
  authentication_required: 401,
  campaign_inaccessible: 404,
  campaign_inactive: 409,
  dice_system_unavailable: 409,
  dice_system_mismatch: 409,
  roll_invalid: 400,
  persistence_unavailable: 503,
  unexpected_error: 500,
} as const;

type FailureCode = Extract<
  CampaignDiceApiResult,
  { ok: false }
>["error"]["code"];

function json(result: CampaignDiceApiResult): Response {
  return Response.json(result, {
    status: result.ok ? 200 : ERROR_STATUS[result.error.code],
    headers: HEADERS,
  });
}

function failure(code: FailureCode): Response {
  return json({ ok: false, error: { code } });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function parseRequest(value: unknown): CampaignDiceRequest | null {
  if (!isRecord(value) || typeof value.rollType !== "string") return null;
  if (!isRecord(value.request)) return null;

  if (value.rollType === "vtm_v5") {
    return hasOnlyKeys(value, ["rollType", "request"])
      ? { rollType: value.rollType, request: value.request as never }
      : null;
  }

  if (
    value.rollType === "coc_7e_percentile" ||
    value.rollType === "coc_7e_other_dice"
  ) {
    if (!hasOnlyKeys(value, ["rollType", "request", "label"])) return null;
    const labelValidation =
      value.label === null
        ? { ok: true as const, value: null }
        : validateOptionalDiceRollLabel(value.label, true);
    if (!labelValidation.ok) return null;
    return {
      rollType: value.rollType,
      request: value.request as never,
      label: labelValidation.value,
    };
  }

  return null;
}

function requiredSystem(rollType: CampaignDiceRollType) {
  return rollType === "vtm_v5" ? "vtm-v5" : "call-of-cthulhu-7e";
}

function executeRoll(request: CampaignDiceRequest): CampaignDiceSuccess | null {
  if (request.rollType === "vtm_v5") {
    const evaluation = rollVtmV5Dice(request.request);
    return evaluation.ok
      ? {
          ok: true,
          rollType: request.rollType,
          result: evaluation.result,
          journalEvent: null,
        }
      : null;
  }

  if (request.rollType === "coc_7e_percentile") {
    const evaluation = rollCoc7ePercentileTest(request.request);
    return evaluation.ok
      ? {
          ok: true,
          rollType: request.rollType,
          result: evaluation.result,
          journalEvent: null,
        }
      : null;
  }

  const evaluation = rollCoc7eOtherDice(request.request);
  return evaluation.ok
    ? {
        ok: true,
        rollType: request.rollType,
        result: evaluation.result,
        journalEvent: null,
      }
    : null;
}

export async function rollCampaignDice(
  campaignId: string,
  body: unknown,
): Promise<Response> {
  const request = parseRequest(body);
  if (!request) return failure("malformed_request");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const actorId = claimsData?.claims?.sub;
  if (claimsError || !actorId) return failure("authentication_required");

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, game_system, status")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError || !campaign) return failure("campaign_inaccessible");
  if (campaign.status !== "active") return failure("campaign_inactive");

  const campaignSystem = normalizeGameSystemId(campaign.game_system);
  if (
    campaignSystem !== "vtm-v5" &&
    campaignSystem !== "call-of-cthulhu-7e"
  ) {
    return failure("dice_system_unavailable");
  }
  if (campaignSystem !== requiredSystem(request.rollType)) {
    return failure("dice_system_mismatch");
  }

  const { data: activeSession, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id")
    .eq("campaign_id", campaignId)
    .is("ended_at", null)
    .gt("presence_expires_at", new Date().toISOString())
    .maybeSingle();
  if (sessionError) return failure("unexpected_error");

  let success: CampaignDiceSuccess;
  try {
    const rolled = executeRoll(request);
    if (!rolled) return failure("roll_invalid");
    success = rolled;
  } catch {
    return failure("unexpected_error");
  }

  if (!activeSession) return json(success);

  try {
    const admin = createAdminClient();
    const requestData =
      request.rollType === "vtm_v5"
        ? success.result.request
        : { ...success.result.request, label: request.label };
    const { data, error } = await admin.rpc("record_campaign_dice_roll", {
      target_actor_id: actorId,
      target_campaign_id: campaignId,
      target_request: toJson(requestData),
      target_result: toJson(success.result),
      target_roll_type: request.rollType,
    });
    if (error) {
      console.error("Campaign Dice Journal persistence failed safely.");
      return failure("persistence_unavailable");
    }

    const row = data?.[0];
    return json({
      ...success,
      journalEvent: row ? mapJournalRow(row) : null,
    } as CampaignDiceSuccess);
  } catch {
    console.error("Campaign Dice server credentials are unavailable.");
    return failure("persistence_unavailable");
  }
}
