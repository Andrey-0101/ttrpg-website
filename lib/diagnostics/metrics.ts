import type {
  DiagnosticDirection,
  DiagnosticMetrics,
  DiagnosticPayload,
  RecordTime,
} from "./contracts";

export type StatsTrack = {
  key: string;
  identity: string;
  direction: "local_outbound" | "remote_inbound";
  source: "camera" | "microphone" | "computer_audio";
  report(): Promise<RTCStatsReport | undefined>;
};
export type DiagnosticsMediaSource = {
  state(): "disconnected" | "connecting" | "connected" | "reconnecting";
  tracks(): StatsTrack[];
};
type Stat = Record<string, unknown>;
function n(stat: Stat, key: string): number | null {
  const value = stat[key];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
function enumValue<T extends string>(value: unknown, values: readonly T[]): T | null {
  return typeof value === "string" && values.includes(value as T) ? (value as T) : null;
}
export function counterRate(
  previous: number | null,
  current: number | null,
  elapsedMs: number,
  scale = 1,
): number | null {
  if (
    previous === null ||
    current === null ||
    elapsedMs <= 0 ||
    elapsedMs > 10_000 ||
    current < previous
  )
    return null;
  return ((current - previous) * scale * 1000) / elapsedMs;
}
export function counterFraction(
  oldNumerator: number | null,
  numerator: number | null,
  oldDenominator: number | null,
  denominator: number | null,
  elapsedMs: number,
): number | null {
  if (
    counterRate(oldNumerator, numerator, elapsedMs) === null ||
    counterRate(oldDenominator, denominator, elapsedMs) === null ||
    denominator! <= oldDenominator!
  )
    return null;
  return (numerator! - oldNumerator!) / (denominator! - oldDenominator!);
}
export function lossFraction(
  oldLost: number | null,
  lost: number | null,
  oldReceived: number | null,
  received: number | null,
  elapsedMs: number,
): number | null {
  const loss = counterRate(oldLost, lost, elapsedMs);
  const delivered = counterRate(oldReceived, received, elapsedMs);
  return loss === null || delivered === null || loss + delivered <= 0
    ? null
    : loss / (loss + delivered);
}

// Raw reports never leave this adapter. IDs/codec graphs are only internal map keys.
export function createStatsNormalizer() {
  const aliases = new Map<string, string>();
  const metadata = new Map<string, string>();
  const previous = new Map<string, { mono: number; stat: Stat }>();
  const alias = (key: string) => {
    if (!aliases.has(key)) aliases.set(key, crypto.randomUUID());
    return aliases.get(key)!;
  };
  function normalize(
    track: StatsTrack,
    report: RTCStatsReport,
    time: RecordTime,
    participant: string | null,
    transportSeen: Set<string>,
  ): DiagnosticPayload[] {
    const output: DiagnosticPayload[] = [];
    const graph = new Map<string, Stat>();
    report.forEach((raw) => {
      if (typeof raw.id === "string") graph.set(raw.id, raw as unknown as Stat);
    });
    for (const stat of graph.values()) {
      if (stat.type !== (track.direction === "local_outbound" ? "outbound-rtp" : "inbound-rtp"))
        continue;
      if (
        stat.isRemote === true ||
        (stat.kind !== "audio" && stat.kind !== "video") ||
        (track.source === "camera") !== (stat.kind === "video")
      )
        continue;
      const key = `${track.key}:${stat.id}`;
      const ref = alias(key);
      const codec = typeof stat.codecId === "string" ? graph.get(stat.codecId) : undefined;
      const mime =
        typeof codec?.mimeType === "string" &&
        /^(audio|video)\/[A-Za-z0-9.+_-]{1,40}$/.test(codec.mimeType)
          ? codec.mimeType
          : null;
      const meta = {
        kind: "track" as const,
        track: ref,
        participant,
        source: track.source,
        direction: track.direction,
        codec: mime,
        clock_rate: codec ? n(codec, "clockRate") : null,
        channels: codec ? n(codec, "channels") : null,
      };
      const serialized = JSON.stringify(meta);
      if (metadata.get(key) !== serialized) {
        metadata.set(key, serialized);
        output.push(meta);
      }
      const outbound = track.direction === "local_outbound";
      const old = previous.get(key);
      const elapsed = old ? time.mono_ms - old.mono : 0;
      const bytesKey = outbound ? "bytesSent" : "bytesReceived";
      const packetsKey = outbound ? "packetsSent" : "packetsReceived";
      const metric: DiagnosticMetrics = {
        bytes: n(stat, bytesKey),
        packets: n(stat, packetsKey),
        packetsLost: n(stat, "packetsLost"),
        bitrateBps: counterRate(old ? n(old.stat, bytesKey) : null, n(stat, bytesKey), elapsed, 8),
        jitterSeconds: n(stat, "jitter"),
        jitterBufferDelaySeconds: n(stat, "jitterBufferDelay"),
        jitterBufferEmittedCount: n(stat, "jitterBufferEmittedCount"),
        concealedSamples: n(stat, "concealedSamples"),
        silentConcealedSamples: n(stat, "silentConcealedSamples"),
        totalSamplesReceived: n(stat, "totalSamplesReceived"),
        concealmentEvents: n(stat, "concealmentEvents"),
        frames: n(stat, outbound ? "framesEncoded" : "framesDecoded"),
        framesDropped: n(stat, "framesDropped"),
        framesPerSecond: n(stat, "framesPerSecond"),
        frameWidth: n(stat, "frameWidth"),
        frameHeight: n(stat, "frameHeight"),
        keyFrames: n(stat, outbound ? "keyFramesEncoded" : "keyFramesDecoded"),
        freezeCount: n(stat, "freezeCount"),
        totalFreezesDurationSeconds: n(stat, "totalFreezesDuration"),
        nackCount: n(stat, "nackCount"),
        pliCount: n(stat, "pliCount"),
        firCount: n(stat, "firCount"),
        targetBitrateBps: n(stat, "targetBitrate"),
        jitterBufferMeanSeconds: old
          ? counterFraction(
              n(old.stat, "jitterBufferDelay"),
              n(stat, "jitterBufferDelay"),
              n(old.stat, "jitterBufferEmittedCount"),
              n(stat, "jitterBufferEmittedCount"),
              elapsed,
            )
          : null,
        packetLossFraction: old
          ? lossFraction(
              n(old.stat, "packetsLost"),
              n(stat, "packetsLost"),
              n(old.stat, "packetsReceived"),
              n(stat, "packetsReceived"),
              elapsed,
            )
          : null,
      };
      previous.set(key, {
        mono: time.mono_ms,
        stat: Object.fromEntries(
          [
            bytesKey,
            "packetsLost",
            "packetsReceived",
            "jitterBufferDelay",
            "jitterBufferEmittedCount",
          ].map((field) => [field, n(stat, field)]),
        ),
      });
      // Missing raw fields are omitted, not fabricated as zero. Invalid derived
      // rates stay explicit null; static codec/track metadata is not repeated.
      const compact = Object.fromEntries(
        Object.entries(metric).filter(
          ([key, value]) =>
            value !== null ||
            key === "bitrateBps" ||
            (!outbound && (key === "packetLossFraction" || key === "jitterBufferMeanSeconds")),
        ),
      ) as DiagnosticMetrics;
      output.push({
        kind: "sample",
        track: ref,
        direction: track.direction,
        metrics: compact,
        quality_limitation: enumValue(stat.qualityLimitationReason, [
          "none",
          "cpu",
          "bandwidth",
          "other",
        ]),
      });
      const feedback = typeof stat.remoteId === "string" ? graph.get(stat.remoteId) : undefined;
      if (outbound && feedback?.type === "remote-inbound-rtp") {
        output.push({
          kind: "sample",
          track: ref,
          direction: "sfu_feedback" as DiagnosticDirection,
          quality_limitation: null,
          metrics: {
            roundTripTimeSeconds: n(feedback, "roundTripTime"),
            jitterSeconds: n(feedback, "jitter"),
            packetsLost: n(feedback, "packetsLost"),
          },
        });
      }
      const transport =
        typeof stat.transportId === "string" ? graph.get(stat.transportId) : undefined;
      const pair =
        typeof transport?.selectedCandidatePairId === "string"
          ? graph.get(transport.selectedCandidatePairId)
          : undefined;
      if (pair && !transportSeen.has(`${outbound}:${pair.id}`)) {
        transportSeen.add(`${outbound}:${pair.id}`);
        const candidate =
          typeof pair.localCandidateId === "string" ? graph.get(pair.localCandidateId) : undefined;
        output.push({
          kind: "connection",
          state: "connected",
          transport: outbound ? "publisher" : "subscriber",
          candidate_type: enumValue(candidate?.candidateType, ["host", "srflx", "prflx", "relay"]),
          protocol: enumValue(candidate?.protocol, ["udp", "tcp"]),
          candidate_state: enumValue(pair.state, [
            "frozen",
            "waiting",
            "in-progress",
            "failed",
            "succeeded",
          ]),
          metrics: {
            roundTripTimeSeconds: n(pair, "currentRoundTripTime"),
            availableOutgoingBitrateBps: n(pair, "availableOutgoingBitrate"),
          },
        });
      }
    }
    return output;
  }
  function prune(active: Set<string>) {
    for (const map of [aliases, metadata, previous])
      for (const key of map.keys())
        if (!active.has(key.slice(0, key.indexOf(":")))) map.delete(key);
  }
  return { normalize, prune };
}
