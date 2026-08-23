import {
  authorizeCampaignVideoJoin,
  type CampaignVideoAuthorizationDataSource,
} from "./authorization";
import type {
  LiveKitServerConfiguration,
  LiveKitServerConfigurationResult,
} from "./config";
import {
  parseCampaignId,
  parseCampaignVideoJoinBody,
  type CampaignVideoJoinResult,
} from "./contracts";
import { campaignVideoJsonResponse } from "./http";
import { issueCampaignVideoCredentials } from "./join-service";
import type { CampaignVideoProvider } from "./provider";

const MAX_REQUEST_BYTES = 512;

export type CampaignVideoJoinHandlerDependencies = {
  createDataSource(): Promise<CampaignVideoAuthorizationDataSource>;
  getConfiguration(): LiveKitServerConfigurationResult;
  createProvider(configuration: LiveKitServerConfiguration): CampaignVideoProvider;
};

async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") return null;

  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    (!/^\d+$/u.test(contentLength) || Number(contentLength) > MAX_REQUEST_BYTES)
  ) {
    return null;
  }
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function failure(
  code: Extract<CampaignVideoJoinResult, { ok: false }>["error"]["code"],
): Response {
  return campaignVideoJsonResponse({ ok: false, error: { code } });
}

export function createCampaignVideoJoinHandler(
  dependencies: CampaignVideoJoinHandlerDependencies,
) {
  return async function campaignVideoJoinHandler(
    request: Request,
    context: { params: Promise<{ campaignId: string }> },
  ): Promise<Response> {
    try {
      const { campaignId: rawCampaignId } = await context.params;
      const campaignId = parseCampaignId(rawCampaignId);
      const body = await readJsonBody(request);
      if (!campaignId || !parseCampaignVideoJoinBody(body)) {
        return failure("malformed_request");
      }

      const dataSource = await dependencies.createDataSource();
      const authorization = await authorizeCampaignVideoJoin(
        campaignId,
        dataSource,
      );
      if (!authorization.ok) return campaignVideoJsonResponse(authorization);

      const configuration = dependencies.getConfiguration();
      if (!configuration.ok) return failure("configuration_unavailable");

      const provider = dependencies.createProvider(configuration.configuration);
      return campaignVideoJsonResponse(
        await issueCampaignVideoCredentials(
          authorization.participant,
          provider,
        ),
      );
    } catch {
      return failure("unexpected_error");
    }
  };
}
