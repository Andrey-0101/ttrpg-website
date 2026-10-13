export const DIAGNOSTICS = {
  schemaVersion: 1,
  sampleMs: 2_000,
  heartbeatMs: 15_000,
  checkpointMs: 60_000,
  startingMs: 30_000,
  heartbeatStaleMs: 45_000,
  backgroundStaleMs: 120_000,
  checkpointStaleMs: 120_000,
  ownerAbandonMs: 180_000,
  finalCollectionMs: 30_000,
  ttlMs: 12 * 60 * 60 * 1_000,
  localOutboxBytes: 16 * 1024 * 1024,
  runBytes: 256 * 1024 * 1024,
  compressedChunkBytes: 256 * 1024,
  expandedChunkBytes: 1024 * 1024,
  cleanupBatch: 100,
  maxRecords: 2048,
} as const;

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SHA256 = /^[0-9a-f]{64}$/;
export type DiagnosticStatus = "○" | "…" | "✓" | "!";
export type RunState = "recording" | "stopping" | "ready" | "expired" | "deleted";
export type DiagnosticRun = {
  id: string;
  campaign_id: string;
  campaign_name: string;
  state: RunState;
  started_at: string;
  stopped_at: string | null;
  stop_deadline: string | null;
  completed_at: string | null;
  expires_at: string | null;
  partial: boolean;
  revision: number;
  stop_reason: string | null;
};
export type DiagnosticRosterEntry = {
  identity: string;
  name: string | null;
  role: "game_master" | "player";
  slot: number | null;
  alias: string | null;
  status: DiagnosticStatus;
};
export type DiagnosticSegment = {
  id: string;
  alias: string;
  epoch: number;
  lease_until: string;
  next_sequence: number;
  state: "collecting" | "finished" | "fenced";
};
export type DiagnosticState = {
  run: DiagnosticRun | null;
  serverNow: number;
  canStart: boolean;
  owner: boolean;
  developer: boolean;
  active: boolean;
  campaignName: string;
  roster: DiagnosticRosterEntry[];
  self?: { id: string; instance: string; epoch: number; state: string; lease_until: string } | null;
};
export type BuildStamp = {
  sha: string | null;
  deployment: string | null;
  environment: "production" | "preview" | "development" | "unknown";
};
export type DiagnosticDirection =
  | "local_outbound"
  | "remote_inbound"
  | "sfu_feedback"
  | "transport";
export const METRICS = [
  "bytes",
  "packets",
  "packetsLost",
  "jitterSeconds",
  "roundTripTimeSeconds",
  "jitterBufferDelaySeconds",
  "jitterBufferEmittedCount",
  "concealedSamples",
  "silentConcealedSamples",
  "totalSamplesReceived",
  "concealmentEvents",
  "frames",
  "framesDropped",
  "framesPerSecond",
  "frameWidth",
  "frameHeight",
  "keyFrames",
  "freezeCount",
  "totalFreezesDurationSeconds",
  "nackCount",
  "pliCount",
  "firCount",
  "availableOutgoingBitrateBps",
  "targetBitrateBps",
  "bitrateBps",
  "packetLossFraction",
  "jitterBufferMeanSeconds",
] as const;
export type DiagnosticMetric = (typeof METRICS)[number];
export type DiagnosticMetrics = Partial<Record<DiagnosticMetric, number | null>>;
export const EVENTS = [
  "collector_started",
  "collector_stopped",
  "foreground",
  "background",
  "online",
  "offline",
  "room_connected",
  "room_disconnected",
  "room_reconnecting",
  "room_reconnected",
  "signal_reconnecting",
  "participant_joined",
  "participant_left",
  "track_changed",
  "track_muted",
  "track_unmuted",
  "stream_state_changed",
  "connection_quality_changed",
  "camera_changed",
  "microphone_changed",
  "sound_unlock",
  "session_changed",
  "computer_audio_started",
  "computer_audio_stopped",
  "computer_audio_error",
  "get_stats_failed",
  "indexeddb_failed",
  "outbox_limit",
  "upload_failed",
  "run_limit",
  "lease_expired",
  "clock_resync",
  "collection_gap",
] as const;
export type DiagnosticEvent = (typeof EVENTS)[number];
export type RecordTime = {
  seq: number;
  mono_ms: number;
  wall_ms: number;
  server_ms: number;
  uncertainty_ms: number | null;
};
export type DiagnosticRecord = RecordTime &
  (
    | {
        kind: "client";
        browser: "chrome" | "edge" | "firefox" | "safari" | "unknown";
        browser_major: number | null;
        os: "windows" | "macos" | "linux" | "android" | "ios" | "unknown";
        build: BuildStamp;
        livekit: "2.21.0";
        timezone: string;
      }
    | {
        kind: "track";
        track: string;
        participant: string | null;
        source: "camera" | "microphone" | "computer_audio";
        direction: DiagnosticDirection;
        codec: string | null;
        clock_rate: number | null;
        channels: number | null;
      }
    | {
        kind: "sample";
        track: string;
        direction: DiagnosticDirection;
        metrics: DiagnosticMetrics;
        quality_limitation: "none" | "cpu" | "bandwidth" | "other" | null;
      }
    | {
        kind: "connection";
        state: "disconnected" | "connecting" | "connected" | "reconnecting";
        transport?: "publisher" | "subscriber";
        candidate_type: "host" | "srflx" | "prflx" | "relay" | null;
        protocol: "udp" | "tcp" | null;
        candidate_state: "frozen" | "waiting" | "in-progress" | "failed" | "succeeded" | null;
        metrics: DiagnosticMetrics;
      }
    | {
        kind: "event";
        code: DiagnosticEvent;
        participant?: string | null;
        track?: string | null;
        value?:
          | "site_stop"
          | "track_ended"
          | "external_end"
          | "unknown"
          | "window"
          | "monitor"
          | "poor"
          | "good"
          | "excellent"
          | "lost"
          | "active"
          | "paused"
          | "enabled"
          | "disabled"
          | "128"
          | "192"
          | null;
        session?: string | null;
      }
    | { kind: "clock"; offset_ms: number; rtt_ms: number; probes: 3 }
  );
export type DiagnosticChunk = {
  schema: 1;
  segment: string;
  sequence: number;
  records: DiagnosticRecord[];
};
export type DiagnosticPayload = DiagnosticRecord extends infer T
  ? T extends RecordTime
    ? Omit<T, keyof RecordTime>
    : never
  : never;

export function diagnosticStatus(
  client: {
    state: string;
    joined_at: string;
    heartbeat_at: string;
    visibility: string;
    valid_progress_at: string | null;
    checkpoint_at: string | null;
    error: string | null;
  } | null,
  now: number,
): DiagnosticStatus {
  if (!client) return "○";
  if (client.state === "fenced" || client.error) return "!";
  if (client.state === "finished")
    return client.valid_progress_at &&
      client.checkpoint_at &&
      now - Date.parse(client.valid_progress_at) <= DIAGNOSTICS.checkpointStaleMs &&
      now - Date.parse(client.checkpoint_at) <= DIAGNOSTICS.checkpointStaleMs
      ? "✓"
      : "!";
  const heartbeatLimit =
    client.visibility === "background"
      ? DIAGNOSTICS.backgroundStaleMs
      : DIAGNOSTICS.heartbeatStaleMs;
  if (now - Date.parse(client.heartbeat_at) > heartbeatLimit) return "!";
  if (!client.valid_progress_at || !client.checkpoint_at)
    return now - Date.parse(client.joined_at) <= DIAGNOSTICS.startingMs ? "…" : "!";
  return now - Date.parse(client.valid_progress_at) <= DIAGNOSTICS.checkpointStaleMs &&
    now - Date.parse(client.checkpoint_at) <= DIAGNOSTICS.checkpointStaleMs
    ? "✓"
    : "!";
}

export function durationLabel(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}
