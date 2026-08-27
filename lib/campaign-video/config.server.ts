import "server-only";

import { parseLiveKitServerConfiguration } from "./config";

export function getLiveKitServerConfiguration() {
  return parseLiveKitServerConfiguration({
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
  });
}
