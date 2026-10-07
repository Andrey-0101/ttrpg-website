import {
  DIAGNOSTICS,
  type DiagnosticRecord,
  type DiagnosticPayload,
  type DiagnosticSegment,
  type DiagnosticState,
  type BuildStamp,
} from "./contracts";
import { diagnosticRequest, DiagnosticsHttpError } from "./http";
import { acknowledge, enqueue, pending, pruneLocal, outboxRuns } from "./outbox";
import { syncClock, type Clock } from "./clock";
import { diagnosticMedia, diagnosticSession, subscribeDiagnosticMedia } from "./media-registry";
import { createStatsNormalizer } from "./metrics";

function clientMetadata(build: BuildStamp): DiagnosticPayload {
  const ua = navigator.userAgent;
  const match = /(Edg|Chrome|Firefox|Version)\/(\d+)/.exec(ua);
  const browser =
    match?.[1] === "Edg"
      ? "edge"
      : match?.[1] === "Chrome"
        ? "chrome"
        : match?.[1] === "Firefox"
          ? "firefox"
          : match?.[1] === "Version" && /Safari/.test(ua)
            ? "safari"
            : "unknown";
  const os = /Android/.test(ua)
    ? "android"
    : /iPhone|iPad/.test(ua)
      ? "ios"
      : /Windows NT/.test(ua)
        ? "windows"
        : /Macintosh/.test(ua)
          ? "macos"
          : /Linux/.test(ua)
            ? "linux"
            : "unknown";
  return {
    kind: "client",
    browser,
    browser_major: match ? Number(match[2]) : null,
    os,
    build,
    livekit: "2.21.0",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
export class DiagnosticCollector {
  private segment: DiagnosticSegment | null = null;
  private records: DiagnosticRecord[] = [];
  private recordBytes = 0;
  private sequence = 0;
  private chunkSequence = 0;
  private clock: Clock = { offset: 0, uncertainty: 60_000, rtt: 0 };
  private stopped = false;
  private finalizing = false;
  private frozen = false;
  private finishPromise: Promise<void> | null = null;
  private checkpointPromise: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private lastCheckpoint = 0;
  private lastClock = 0;
  private lastTick = 0;
  private aliases = new Map<string, string>();
  private normalizer = createStatsNormalizer();
  private removeMedia: (() => void) | null = null;
  private error: string | null = null;
  private finalDeadline: number | null = null;
  private readonly instance = crypto.randomUUID();
  get instanceId() {
    return this.instance;
  }
  get isStopped() {
    return this.stopped;
  }
  constructor(
    private campaign: string,
    private run: string,
    private build: BuildStamp,
    private updated: () => void,
  ) {}
  updateState(state: DiagnosticState) {
    this.aliases.clear();
    for (const entry of state.roster)
      if (entry.alias) this.aliases.set(entry.identity, entry.alias);
    if (
      !state.run ||
      state.run.id !== this.run ||
      !["recording", "stopping"].includes(state.run.state)
    ) {
      this.dispose();
      void pruneLocal(this.run).catch(() => undefined);
    } else if (state.run.state === "stopping") {
      this.finalDeadline = state.run.stop_deadline ? Date.parse(state.run.stop_deadline) : null;
      void this.finish();
    }
  }
  private timestamp() {
    return {
      seq: this.sequence++,
      mono_ms: performance.now(),
      wall_ms: Date.now(),
      server_ms: Date.now() + this.clock.offset,
      uncertainty_ms: this.clock.uncertainty,
    };
  }
  private append(payload: DiagnosticPayload) {
    if (this.stopped || this.frozen || this.finalizing) return;
    const record = { ...payload, ...this.timestamp() } as DiagnosticRecord;
    const size = new TextEncoder().encode(JSON.stringify(record)).length;
    if (
      this.records.length >= DIAGNOSTICS.maxRecords ||
      this.recordBytes + size > DIAGNOSTICS.expandedChunkBytes - 2048
    ) {
      this.error = "outbox_limit";
      this.frozen = true;
      return;
    }
    this.records.push(record);
    this.recordBytes += size;
    if (this.recordBytes > 128 * 1024 || this.records.length > 1000)
      void this.checkpoint().catch(() => undefined);
  }
  async start(state: DiagnosticState) {
    this.clock = await syncClock(this.campaign);
    if (this.stopped || this.finalizing) return;
    this.segment = await diagnosticRequest<DiagnosticSegment>({
      action: "join",
      run: this.run,
      instance: this.instance,
    });
    if (this.stopped) return;
    this.chunkSequence = this.segment.next_sequence;
    // A new epoch fences old collectors. Their unconfirmed data cannot be rebound.
    await pruneLocal(this.run);
    this.updateState(state);
    this.append(clientMetadata(this.build));
    this.append({ kind: "clock", offset_ms: this.clock.offset, rtt_ms: this.clock.rtt, probes: 3 });
    this.append({ kind: "event", code: "collector_started" });
    this.append({
      kind: "event",
      code: "session_changed",
      session: diagnosticSession(this.campaign),
    });
    this.lastClock = Date.now();
    this.lastCheckpoint = Date.now() - DIAGNOSTICS.checkpointMs + 10_000;
    this.removeMedia = subscribeDiagnosticMedia((payload) => {
      if (payload.kind === "event" && payload.participant)
        payload = { ...payload, participant: this.aliases.get(payload.participant) ?? null };
      this.append(payload);
      if (
        payload.kind === "event" &&
        ["room_reconnected", "room_connected"].includes(payload.code)
      ) {
        this.lastClock = 0;
        this.updated();
      }
    });
    window.addEventListener("online", this.onOnline);
    window.addEventListener("offline", this.onOffline);
    document.addEventListener("visibilitychange", this.onVisibility);
    void this.tick();
    void this.heartbeat();
    void this.reconcileOutbox();
  }
  private onOnline = () => {
    this.append({ kind: "event", code: "online" });
    this.lastClock = 0;
    this.updated();
    void this.checkpoint().catch(() => undefined);
  };
  private onOffline = () => {
    this.append({ kind: "event", code: "offline" });
  };
  private onVisibility = () => {
    this.append({ kind: "event", code: document.hidden ? "background" : "foreground" });
    this.updated();
    void this.heartbeat();
  };
  private async tick() {
    if (this.stopped || this.finalizing) return;
    const now = performance.now();
    if (this.lastTick && now - this.lastTick > 10_000)
      this.append({ kind: "event", code: "collection_gap" });
    this.lastTick = now;
    try {
      const source = diagnosticMedia();
      this.append({
        kind: "connection",
        state: source?.state() ?? "disconnected",
        candidate_type: null,
        protocol: null,
        candidate_state: null,
        metrics: {},
      });
      const transports = new Set<string>();
      const tracks = source?.tracks() ?? [];
      this.normalizer.prune(new Set(tracks.map((track) => track.key)));
      for (const track of tracks) {
        // Membership-authoritative aliases: unknown/removed identities are not exported.
        const alias = this.aliases.get(track.identity);
        if (!alias) continue;
        const report = await Promise.race([
          track.report(),
          new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1500)),
        ]);
        if (report)
          for (const payload of this.normalizer.normalize(
            track,
            report,
            {
              seq: 0,
              mono_ms: performance.now(),
              wall_ms: Date.now(),
              server_ms: Date.now() + this.clock.offset,
              uncertainty_ms: this.clock.uncertainty,
            },
            alias,
            transports,
          ))
            this.append(payload);
      }
      if (Date.now() - this.lastClock > 300_000 && navigator.onLine) {
        this.clock = await syncClock(this.campaign);
        this.lastClock = Date.now();
        this.append({
          kind: "clock",
          offset_ms: this.clock.offset,
          rtt_ms: this.clock.rtt,
          probes: 3,
        });
      }
      if (Date.now() - this.lastCheckpoint >= DIAGNOSTICS.checkpointMs) await this.checkpoint();
    } catch (error) {
      if (!this.error)
        this.error =
          error instanceof Error && error.message === "outbox_limit"
            ? "outbox_limit"
            : "get_stats_failed";
    }
    if (!this.stopped && !this.finalizing)
      this.timer = setTimeout(
        () => void this.tick(),
        Math.max(0, DIAGNOSTICS.sampleMs - (performance.now() - now)),
      );
  }
  private heartbeatInFlight = false;
  private pruning = false;
  private async reconcileOutbox() {
    if (this.pruning || !navigator.onLine) return;
    this.pruning = true;
    try {
      for (const run of await outboxRuns()) {
        if (run === this.run) continue;
        try {
          const state = await diagnosticRequest<DiagnosticState>({ action: "state", run });
          if (!state.run || !["recording", "stopping"].includes(state.run.state))
            await pruneLocal(run);
        } catch (error) {
          if (error instanceof DiagnosticsHttpError && error.status === 403) await pruneLocal(run);
          // Uncertain network/Storage failures retain the unconfirmed queue.
        }
      }
    } catch {
      // IndexedDB may be unavailable; normal collection reports its own error.
    } finally {
      this.pruning = false;
    }
  }
  private async heartbeat() {
    if (this.stopped || this.finalizing || !this.segment || this.heartbeatInFlight) return;
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    this.heartbeatInFlight = true;
    try {
      const result = await diagnosticRequest<{ lease_until: string }>({
        action: "heartbeat",
        run: this.run,
        segment: this.segment.id,
        epoch: this.segment.epoch,
        visibility: document.hidden ? "background" : "foreground",
        error: this.error,
      });
      this.segment.lease_until = result.lease_until;
    } catch (error) {
      if (error instanceof DiagnosticsHttpError && [401, 403].includes(error.status))
        this.dispose();
      else if (Date.now() + this.clock.offset > Date.parse(this.segment.lease_until))
        this.dispose();
    } finally {
      this.heartbeatInFlight = false;
      if (!this.stopped && !this.finalizing)
        this.heartbeatTimer = setTimeout(() => void this.heartbeat(), DIAGNOSTICS.heartbeatMs);
    }
  }
  private checkpoint(): Promise<void> {
    if (this.checkpointPromise) return this.checkpointPromise;
    const operation = this.flush().finally(() => {
      if (this.checkpointPromise === operation) this.checkpointPromise = null;
    });
    this.checkpointPromise = operation;
    return operation;
  }
  private async flush() {
    if (!this.segment) return;
    if (this.records.length) {
      const captured = this.records.slice();
      const sequence = this.chunkSequence;
      const raw = new TextEncoder().encode(
        JSON.stringify({ schema: 1, segment: this.segment.id, sequence, records: captured }),
      );
      const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"));
      const bytes = await new Response(stream).arrayBuffer();
      if (bytes.byteLength > DIAGNOSTICS.compressedChunkBytes) {
        this.error = "outbox_limit";
        this.frozen = true;
        throw new Error("outbox_limit");
      }
      await enqueue({
        key: `${this.segment.id}:${String(sequence).padStart(10, "0")}`,
        run: this.run,
        segment: this.segment.id,
        sequence,
        bytes,
        created: Date.now(),
      });
      // Remove exactly the durably enqueued prefix; ticks may append during compression.
      this.records.splice(0, captured.length);
      this.recordBytes = this.records.reduce(
        (n, r) => n + new TextEncoder().encode(JSON.stringify(r)).length,
        0,
      );
      this.chunkSequence++;
    }
    let next = await pending(this.segment.id);
    while (next.length) {
      const chunk = next[0];
      const response = await fetch(
        `/api/diagnostics/chunks?run=${this.run}&segment=${this.segment.id}&epoch=${this.segment.epoch}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/gzip" },
          body: chunk.bytes,
          cache: "no-store",
          signal: AbortSignal.timeout(20_000),
        },
      );
      if (!response.ok) {
        const failure = await response.json();
        this.error = failure.error === "run_limit" ? "run_limit" : "upload_failed";
        if (response.status === 403 && failure.error !== "upload_rate") this.frozen = true;
        throw new DiagnosticsHttpError(failure.error, response.status);
      }
      const ack = await response.json();
      if (ack.accepted !== true || ack.sequence !== chunk.sequence)
        throw new Error("upload_failed");
      await acknowledge(chunk.key);
      next = await pending(this.segment.id);
    }
    this.lastCheckpoint = Date.now();
    if (this.error === "upload_failed") this.error = null;
    void this.reconcileOutbox();
  }
  finish(): Promise<void> {
    if (this.finishPromise) return this.finishPromise;
    const operation = this.finalize();
    this.finishPromise = operation;
    return operation;
  }
  private async finalize() {
    this.append({ kind: "event", code: "collector_stopped" });
    this.finalizing = true;
    this.stopTimers();
    const deadline =
      this.finalDeadline ?? Date.now() + this.clock.offset + DIAGNOSTICS.finalCollectionMs;
    try {
      if (this.checkpointPromise) await this.checkpointPromise;
      while (Date.now() + this.clock.offset < deadline) {
        try {
          await this.checkpoint();
          if (this.segment && this.error)
            await diagnosticRequest({
              action: "heartbeat",
              run: this.run,
              segment: this.segment.id,
              epoch: this.segment.epoch,
              visibility: document.hidden ? "background" : "foreground",
              error: this.error,
            });
          if (this.segment)
            await diagnosticRequest({
              action: "final",
              run: this.run,
              segment: this.segment.id,
              epoch: this.segment.epoch,
              next_sequence: this.chunkSequence,
            });
          break;
        } catch (error) {
          if (
            error instanceof DiagnosticsHttpError &&
            error.status === 403 &&
            error.code !== "upload_rate"
          )
            break;
          await new Promise<void>((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch {
      /* Fixed server deadline exports accepted chunks as partial. */
    } finally {
      this.dispose();
      this.updated();
    }
  }
  private stopTimers() {
    if (this.timer) clearTimeout(this.timer);
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
  }
  dispose() {
    this.stopped = true;
    this.stopTimers();
    this.removeMedia?.();
    this.removeMedia = null;
    window.removeEventListener("online", this.onOnline);
    window.removeEventListener("offline", this.onOffline);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }
}
