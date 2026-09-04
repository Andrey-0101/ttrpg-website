export const CAMPAIGN_VIDEO_PRESENTATION_TOPIC =
  "campaign-image-presentation-v1";

const MAX_PACKET_BYTES = 8 * 1024;
const MAX_PRESENTATION_REVISION = 2_147_483_647;
const PARTICIPANT_IDENTITY_PATTERN = /^participant-[0-9a-f]{48}$/u;

export type CampaignVideoPresentationMessage =
  | {
      version: 1;
      action: "show";
      signedUrl: string;
      expanded: boolean;
      revision: number;
    }
  | {
      version: 1;
      action: "clear";
      revision: number;
    };

export type CampaignVideoPresentationCommand =
  | {
      action: "show";
      imageId: string;
      expanded: boolean;
      revision: number;
      destinationIdentity?: string;
    }
  | {
      action: "clear";
      revision: number;
    };

export type CampaignVideoPresentationResult =
  | {
      ok: true;
      action: "show";
      expanded: boolean;
      revision: number;
    }
  | {
      ok: true;
      action: "clear";
      revision: number;
    }
  | {
      ok: false;
      error: {
        code:
          | "malformed_request"
          | "authentication_required"
          | "campaign_unavailable"
          | "campaign_inactive"
          | "configuration_unavailable"
          | "presentation_unavailable"
          | "unexpected_error";
      };
    };

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(value).sort();
  return (
    keys.length === expected.length &&
    keys.every((key, index) => key === [...expected].sort()[index])
  );
}

function isPresentationSignedUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 6_000) {
    return false;
  }

  try {
    const url = new URL(value);
    const localHttp =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    return (
      (url.protocol === "https:" || localHttp) &&
      !url.username &&
      !url.password &&
      !url.hash &&
      url.pathname.startsWith("/storage/v1/object/sign/campaign-images/") &&
      url.searchParams.has("token")
    );
  } catch {
    return false;
  }
}

function isPresentationRevision(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_PRESENTATION_REVISION
  );
}

export function isCampaignVideoParticipantIdentity(
  value: unknown,
): value is string {
  return typeof value === "string" && PARTICIPANT_IDENTITY_PATTERN.test(value);
}

export function parseCampaignVideoPresentationCommand(
  value: unknown,
  parseImageId: (value: unknown) => string | null,
): CampaignVideoPresentationCommand | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;

  if (candidate.action === "clear") {
    return hasExactKeys(candidate, ["action", "revision"]) &&
      isPresentationRevision(candidate.revision)
      ? { action: "clear", revision: candidate.revision }
      : null;
  }

  if (candidate.action !== "show") return null;
  const destinationIdentity = candidate.destinationIdentity;
  const expectedKeys =
    destinationIdentity === undefined
      ? (["action", "expanded", "imageId", "revision"] as const)
      : ([
          "action",
          "destinationIdentity",
          "expanded",
          "imageId",
          "revision",
        ] as const);
  if (!hasExactKeys(candidate, expectedKeys)) return null;

  const imageId = parseImageId(candidate.imageId);
  if (!imageId) return null;
  if (
    typeof candidate.expanded !== "boolean" ||
    !isPresentationRevision(candidate.revision)
  ) {
    return null;
  }
  if (
    destinationIdentity !== undefined &&
    !isCampaignVideoParticipantIdentity(destinationIdentity)
  ) {
    return null;
  }

  return destinationIdentity === undefined
    ? {
        action: "show",
        imageId,
        expanded: candidate.expanded,
        revision: candidate.revision,
      }
    : {
        action: "show",
        imageId,
        expanded: candidate.expanded,
        revision: candidate.revision,
        destinationIdentity,
      };
}

export function createCampaignVideoPresentationPacket(
  message: CampaignVideoPresentationMessage,
): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(message));
}

export function parseCampaignVideoPresentationPacket(
  payload: Uint8Array,
): CampaignVideoPresentationMessage | null {
  if (payload.byteLength === 0 || payload.byteLength > MAX_PACKET_BYTES) {
    return null;
  }

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(payload));
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;

  if (candidate.version !== 1) return null;
  if (candidate.action === "clear") {
    return hasExactKeys(candidate, ["action", "revision", "version"]) &&
      isPresentationRevision(candidate.revision)
      ? { version: 1, action: "clear", revision: candidate.revision }
      : null;
  }
  if (
    candidate.action !== "show" ||
    !hasExactKeys(candidate, [
      "action",
      "expanded",
      "revision",
      "signedUrl",
      "version",
    ]) ||
    !isPresentationSignedUrl(candidate.signedUrl) ||
    typeof candidate.expanded !== "boolean" ||
    !isPresentationRevision(candidate.revision)
  ) {
    return null;
  }

  return {
    version: 1,
    action: "show",
    signedUrl: candidate.signedUrl,
    expanded: candidate.expanded,
    revision: candidate.revision,
  };
}

export function isCampaignVideoPresentationResult(
  value: unknown,
): value is CampaignVideoPresentationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.ok === true) {
    if (candidate.action === "clear") {
      return (
        hasExactKeys(candidate, ["action", "ok", "revision"]) &&
        isPresentationRevision(candidate.revision)
      );
    }
    return (
      candidate.action === "show" &&
      hasExactKeys(candidate, [
        "action",
        "expanded",
        "ok",
        "revision",
      ]) &&
      typeof candidate.expanded === "boolean" &&
      isPresentationRevision(candidate.revision)
    );
  }
  if (
    candidate.ok !== false ||
    !hasExactKeys(candidate, ["error", "ok"]) ||
    !candidate.error ||
    typeof candidate.error !== "object" ||
    Array.isArray(candidate.error)
  ) {
    return false;
  }
  const error = candidate.error as Record<string, unknown>;
  return (
    hasExactKeys(error, ["code"]) &&
    [
      "malformed_request",
      "authentication_required",
      "campaign_unavailable",
      "campaign_inactive",
      "configuration_unavailable",
      "presentation_unavailable",
      "unexpected_error",
    ].includes(String(error.code))
  );
}
