import type {
  CampaignVideoJoinResult,
  CampaignVideoSafeErrorCode,
} from "./contracts";

const ERROR_STATUS = {
  malformed_request: 400,
  authentication_required: 401,
  campaign_inaccessible: 404,
  campaign_inactive: 409,
  membership_required: 403,
  invalid_player_state: 409,
  capacity_unavailable: 409,
  configuration_unavailable: 503,
  provider_unavailable: 503,
  unexpected_error: 500,
} as const satisfies Record<CampaignVideoSafeErrorCode, number>;

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
} as const;

export function campaignVideoJsonResponse(
  result: CampaignVideoJoinResult,
): Response {
  return Response.json(result, {
    status: result.ok ? 200 : ERROR_STATUS[result.error.code],
    headers: RESPONSE_HEADERS,
  });
}
