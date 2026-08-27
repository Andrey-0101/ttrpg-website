export type LiveKitServerConfiguration = {
  url: string;
  apiKey: string;
  apiSecret: string;
};

export type LiveKitServerConfigurationResult =
  | { ok: true; configuration: LiveKitServerConfiguration }
  | { ok: false };

type LiveKitEnvironment = {
  LIVEKIT_URL?: string;
  LIVEKIT_API_KEY?: string;
  LIVEKIT_API_SECRET?: string;
};

function readCredential(value: string | undefined): string | null {
  if (!value || value !== value.trim() || /\s|[\u0000-\u001f\u007f]/u.test(value)) {
    return null;
  }
  return value;
}

function readLiveKitUrl(value: string | undefined): string | null {
  if (!value || value !== value.trim() || /[\r\n]/u.test(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    if (
      url.protocol !== "wss:" ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname !== "" && url.pathname !== "/")
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function parseLiveKitServerConfiguration(
  environment: LiveKitEnvironment,
): LiveKitServerConfigurationResult {
  const url = readLiveKitUrl(environment.LIVEKIT_URL);
  const apiKey = readCredential(environment.LIVEKIT_API_KEY);
  const apiSecret = readCredential(environment.LIVEKIT_API_SECRET);

  if (!url || !apiKey || !apiSecret) {
    return { ok: false };
  }

  return { ok: true, configuration: { url, apiKey, apiSecret } };
}
