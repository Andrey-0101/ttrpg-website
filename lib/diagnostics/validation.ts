import {
  DIAGNOSTICS,
  EVENTS,
  METRICS,
  UUID,
  type DiagnosticChunk,
  type DiagnosticRecord,
} from "./contracts";

const DIRECTIONS = ["local_outbound", "remote_inbound", "sfu_feedback", "transport"];
const TIME = ["kind", "seq", "mono_ms", "wall_ms", "server_ms", "uncertainty_ms"];
export function boundedJson(text: string): unknown {
  let depth = 0,
    quoted = false,
    escaped = false,
    length = 0;
  for (const character of text) {
    if (quoted) {
      if (++length > 512) throw new Error("malformed_chunk");
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') {
      quoted = true;
      length = 0;
    } else if (character === "{" || character === "[") {
      if (++depth > 8) throw new Error("malformed_chunk");
    } else if (character === "}" || character === "]") depth--;
  }
  return JSON.parse(text);
}
export function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function exact(
  value: Record<string, unknown>,
  keys: readonly string[],
  optional: readonly string[] = [],
) {
  return (
    keys.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => keys.includes(key) || optional.includes(key))
  );
}
function number(value: unknown, min = 0, max = 1e15): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}
function nullableNumber(value: unknown, min = 0, max = 1e15) {
  return value === null || number(value, min, max);
}
function oneOf(value: unknown, values: readonly string[], nullable = false) {
  return (nullable && value === null) || (typeof value === "string" && values.includes(value));
}
function identifier(value: unknown, nullable = false) {
  return (nullable && value === null) || (typeof value === "string" && UUID.test(value));
}
function metrics(value: unknown) {
  return (
    object(value) &&
    Object.keys(value).length <= METRICS.length &&
    Object.entries(value).every(
      ([key, v]) =>
        (METRICS as readonly string[]).includes(key) &&
        nullableNumber(v, key === "packetsLost" ? -1e9 : 0),
    )
  );
}
export function validBuild(value: unknown): boolean {
  return (
    object(value) &&
    exact(value, ["sha", "deployment", "environment"]) &&
    (value.sha === null || (typeof value.sha === "string" && /^[0-9a-f]{40}$/i.test(value.sha))) &&
    (value.deployment === null ||
      (typeof value.deployment === "string" && /^dpl_[A-Za-z0-9]{1,70}$/.test(value.deployment))) &&
    oneOf(value.environment, ["production", "preview", "development", "unknown"])
  );
}
function timezone(value: unknown) {
  if (typeof value !== "string" || value.length > 64 || !/^[A-Za-z0-9_+/-]+$/.test(value))
    return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
function validRecord(value: unknown, now: number): value is DiagnosticRecord {
  if (
    !object(value) ||
    !Number.isSafeInteger(value.seq) ||
    !number(value.seq, 0, 1e12) ||
    !number(value.mono_ms, 0, 1e11) ||
    !number(value.wall_ms) ||
    !number(value.server_ms, now - DIAGNOSTICS.ttlMs, now + 5_000) ||
    !nullableNumber(value.uncertainty_ms, 0, 60_000)
  )
    return false;
  switch (value.kind) {
    case "client":
      return (
        exact(value, [...TIME, "browser", "browser_major", "os", "build", "livekit", "timezone"]) &&
        oneOf(value.browser, ["chrome", "edge", "firefox", "safari", "unknown"]) &&
        nullableNumber(value.browser_major, 1, 10000) &&
        oneOf(value.os, ["windows", "macos", "linux", "android", "ios", "unknown"]) &&
        validBuild(value.build) &&
        value.livekit === "2.21.0" &&
        timezone(value.timezone)
      );
    case "track":
      return (
        exact(value, [
          ...TIME,
          "track",
          "participant",
          "source",
          "direction",
          "codec",
          "clock_rate",
          "channels",
        ]) &&
        identifier(value.track) &&
        identifier(value.participant, true) &&
        oneOf(value.source, ["camera", "microphone", "computer_audio"]) &&
        oneOf(value.direction, DIRECTIONS) &&
        (value.codec === null ||
          (typeof value.codec === "string" &&
            /^(audio|video)\/[A-Za-z0-9.+_-]{1,40}$/.test(value.codec))) &&
        nullableNumber(value.clock_rate, 1, 1e6) &&
        nullableNumber(value.channels, 1, 32)
      );
    case "sample":
      return (
        exact(value, [...TIME, "track", "direction", "metrics", "quality_limitation"]) &&
        identifier(value.track) &&
        oneOf(value.direction, DIRECTIONS) &&
        metrics(value.metrics) &&
        oneOf(value.quality_limitation, ["none", "cpu", "bandwidth", "other"], true)
      );
    case "connection":
      return (
        exact(
          value,
          [...TIME, "state", "candidate_type", "protocol", "candidate_state", "metrics"],
          ["transport"],
        ) &&
        (!Object.hasOwn(value, "transport") ||
          oneOf(value.transport, ["publisher", "subscriber"])) &&
        oneOf(value.state, ["disconnected", "connecting", "connected", "reconnecting"]) &&
        oneOf(value.candidate_type, ["host", "srflx", "prflx", "relay"], true) &&
        oneOf(value.protocol, ["udp", "tcp"], true) &&
        oneOf(
          value.candidate_state,
          ["frozen", "waiting", "in-progress", "failed", "succeeded"],
          true,
        ) &&
        metrics(value.metrics)
      );
    case "event":
      return (
        exact(value, [...TIME, "code"], ["participant", "track", "value", "session"]) &&
        oneOf(value.code, EVENTS) &&
        (!Object.hasOwn(value, "participant") || identifier(value.participant, true)) &&
        (!Object.hasOwn(value, "track") || identifier(value.track, true)) &&
        (!Object.hasOwn(value, "session") || identifier(value.session, true)) &&
        (!Object.hasOwn(value, "value") ||
          oneOf(
            value.value,
            [
              "site_stop",
              "track_ended",
              "external_end",
              "unknown",
              "window",
              "monitor",
              "poor",
              "good",
              "excellent",
              "lost",
              "active",
              "paused",
              "enabled",
              "disabled",
              "128",
              "192",
            ],
            true,
          ))
      );
    case "clock":
      return (
        exact(value, [...TIME, "offset_ms", "rtt_ms", "probes"]) &&
        number(value.offset_ms, -1e15, 1e15) &&
        number(value.rtt_ms, 0, 60000) &&
        value.probes === 3
      );
    default:
      return false;
  }
}
export function validateChunk(value: unknown, now: number): DiagnosticChunk | null {
  if (
    !object(value) ||
    !exact(value, ["schema", "segment", "sequence", "records"]) ||
    value.schema !== 1 ||
    !identifier(value.segment) ||
    !Number.isSafeInteger(value.sequence) ||
    !number(value.sequence, 0, 1e9) ||
    !Array.isArray(value.records) ||
    value.records.length < 1 ||
    value.records.length > DIAGNOSTICS.maxRecords
  )
    return null;
  let sequence = -1;
  let mono = -1;
  for (const record of value.records) {
    if (
      !validRecord(record, now) ||
      (sequence >= 0 && record.seq !== sequence + 1) ||
      record.mono_ms < mono
    )
      return null;
    sequence = record.seq;
    mono = record.mono_ms;
  }
  return value as DiagnosticChunk;
}

export function freshProgress(chunk: DiagnosticChunk): number | null {
  const samples = chunk.records.filter((r) => r.kind === "sample" || r.kind === "connection");
  return samples.length ? Math.max(...samples.map((r) => r.server_ms)) : null;
}
