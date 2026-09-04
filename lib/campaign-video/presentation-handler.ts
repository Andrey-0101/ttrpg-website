import {
  authorizeCampaignVideoJoin,
  type CampaignVideoAuthorizationDataSource,
} from "./authorization";
import type {
  LiveKitServerConfiguration,
  LiveKitServerConfigurationResult,
} from "./config";
import { parseCampaignId } from "./contracts";
import { deriveCampaignVideoRoomName } from "./mapping";
import {
  CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
  createCampaignVideoPresentationPacket,
  parseCampaignVideoPresentationPacket,
  parseCampaignVideoPresentationCommand,
  type CampaignVideoPresentationResult,
} from "./presentation";

const MAX_REQUEST_BYTES = 512;
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
} as const;

export interface CampaignVideoPresentationDataSource
  extends CampaignVideoAuthorizationDataSource {
  findCampaignImageStoragePath(
    campaignId: string,
    imageId: string,
  ): Promise<string | null>;
  createCampaignImageSignedUrl(storagePath: string): Promise<string | null>;
}

export type CampaignVideoPresentationPublishRequest = {
  roomName: string;
  payload: Uint8Array;
  topic: string;
  destinationIdentity?: string;
};

export interface CampaignVideoPresentationPublisher {
  publish(request: CampaignVideoPresentationPublishRequest): Promise<void>;
}

export type CampaignVideoPresentationHandlerDependencies = {
  createDataSource(): Promise<CampaignVideoPresentationDataSource>;
  getConfiguration(): LiveKitServerConfigurationResult;
  createPublisher(
    configuration: LiveKitServerConfiguration,
  ): CampaignVideoPresentationPublisher;
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

function response(
  result: CampaignVideoPresentationResult,
  status = result.ok ? 200 : 500,
): Response {
  return Response.json(result, { status, headers: RESPONSE_HEADERS });
}

function failure(
  code: Extract<CampaignVideoPresentationResult, { ok: false }>["error"]["code"],
  status: number,
): Response {
  return response({ ok: false, error: { code } }, status);
}

export function createCampaignVideoPresentationHandler(
  dependencies: CampaignVideoPresentationHandlerDependencies,
) {
  return async function campaignVideoPresentationHandler(
    request: Request,
    context: { params: Promise<{ campaignId: string }> },
  ): Promise<Response> {
    try {
      const { campaignId: rawCampaignId } = await context.params;
      const campaignId = parseCampaignId(rawCampaignId);
      const command = parseCampaignVideoPresentationCommand(
        await readJsonBody(request),
        parseCampaignId,
      );
      if (!campaignId || !command) return failure("malformed_request", 400);

      const dataSource = await dependencies.createDataSource();
      const authorization = await authorizeCampaignVideoJoin(
        campaignId,
        dataSource,
      );
      if (!authorization.ok) {
        switch (authorization.error.code) {
          case "authentication_required":
            return failure("authentication_required", 401);
          case "campaign_inactive":
            return failure("campaign_inactive", 409);
          default:
            return failure("campaign_unavailable", 403);
        }
      }
      if (authorization.participant.role !== "game_master") {
        return failure("campaign_unavailable", 403);
      }

      const configuration = dependencies.getConfiguration();
      if (!configuration.ok) {
        return failure("configuration_unavailable", 503);
      }
      const publisher = dependencies.createPublisher(configuration.configuration);
      const publishBase = {
        roomName: deriveCampaignVideoRoomName(campaignId),
        topic: CAMPAIGN_VIDEO_PRESENTATION_TOPIC,
      };

      if (command.action === "clear") {
        await publisher.publish({
          ...publishBase,
          payload: createCampaignVideoPresentationPacket({
            version: 1,
            action: "clear",
            revision: command.revision,
          }),
        });
        return response({
          ok: true,
          action: "clear",
          revision: command.revision,
        });
      }

      const storagePath = await dataSource.findCampaignImageStoragePath(
        campaignId,
        command.imageId,
      );
      if (!storagePath) return failure("presentation_unavailable", 404);

      const signedUrl = await dataSource.createCampaignImageSignedUrl(
        storagePath,
      );
      if (!signedUrl) return failure("presentation_unavailable", 503);

      const payload = createCampaignVideoPresentationPacket({
        version: 1,
        action: "show",
        signedUrl,
        expanded: command.expanded,
        revision: command.revision,
      });
      if (!parseCampaignVideoPresentationPacket(payload)) {
        return failure("presentation_unavailable", 503);
      }
      await publisher.publish({
        ...publishBase,
        payload,
        ...(command.destinationIdentity
          ? { destinationIdentity: command.destinationIdentity }
          : {}),
      });

      return response({
        ok: true,
        action: "show",
        expanded: command.expanded,
        revision: command.revision,
      });
    } catch {
      return failure("unexpected_error", 500);
    }
  };
}
