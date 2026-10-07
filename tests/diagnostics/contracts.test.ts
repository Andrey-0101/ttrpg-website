import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import {
  DIAGNOSTICS,
  diagnosticStatus,
  durationLabel,
  type DiagnosticChunk,
} from "../../lib/diagnostics/contracts";
import { validateChunk, freshProgress, boundedJson } from "../../lib/diagnostics/validation";
import {
  counterRate,
  counterFraction,
  lossFraction,
  createStatsNormalizer,
  type StatsTrack,
} from "../../lib/diagnostics/metrics";
import { authorizedCleanup, registeredPath, cleanupBatch } from "../../lib/diagnostics/cleanup";
import { mayEnqueue } from "../../lib/diagnostics/outbox";
import { selectClock } from "../../lib/diagnostics/clock";
import { developerEnglish } from "../../lib/developer/english";
import {
  diagnosticMediaEvent,
  diagnosticSession,
  setDiagnosticSession,
  subscribeDiagnosticMedia,
} from "../../lib/diagnostics/media-registry";
import "./export.test";
import "./server.test";
import "./coordinator.test";
import "./outbox.test";
import "./ui.test";

const id = "aaaaaaaa-0000-4000-8000-000000000001";
test("initial Game Session context is campaign-bound and failing observers cannot interrupt media", () => {
  const unsubscribe = subscribeDiagnosticMedia(() => {
    throw new Error("observer_failed");
  });
  assert.doesNotThrow(() => setDiagnosticSession(id, id));
  assert.equal(diagnosticSession(id), id);
  assert.equal(diagnosticSession("other-campaign"), null);
  assert.doesNotThrow(() =>
    diagnosticMediaEvent({ kind: "event", code: "camera_changed", value: "enabled" }),
  );
  unsubscribe();
  setDiagnosticSession(id, null);
});
const now = Date.now();
const time = { seq: 0, mono_ms: 10, wall_ms: now, server_ms: now, uncertainty_ms: 5 };
function chunk(): DiagnosticChunk {
  return {
    schema: 1,
    segment: id,
    sequence: 0,
    records: [
      {
        ...time,
        kind: "connection",
        state: "connected",
        candidate_type: null,
        protocol: null,
        candidate_state: null,
        metrics: {},
      },
    ],
  };
}
test("canonical cadences, 12h completion TTL, safety limits, English isolation", () => {
  assert.equal(DIAGNOSTICS.ttlMs, 43_200_000);
  assert.equal(DIAGNOSTICS.sampleMs, 2000);
  assert.equal(DIAGNOSTICS.heartbeatMs, 15000);
  assert.equal(DIAGNOSTICS.checkpointMs, 60000);
  assert.equal(DIAGNOSTICS.finalCollectionMs, 30000);
  assert.equal(DIAGNOSTICS.localOutboxBytes, 16 * 1024 * 1024);
  assert.equal(DIAGNOSTICS.runBytes, 256 * 1024 * 1024);
  assert.equal(durationLabel(27 * 3600_000 + 65_000), "27:01:05");
  assert.equal(developerEnglish.playerTitle, "Technical diagnostics active");
  assert.equal(
    developerEnglish.playerNotice,
    "Connection statistics only. No audio/video recording.",
  );
  assert.doesNotMatch(readFileSync("lib/developer/english.ts", "utf8"), /from .next-intl/);
});
test("ACK/heartbeat alone cannot produce a checkmark; validated fresh progress can", () => {
  const client = {
    state: "collecting",
    joined_at: new Date(now).toISOString(),
    heartbeat_at: new Date(now).toISOString(),
    visibility: "foreground",
    valid_progress_at: null,
    checkpoint_at: null,
    error: null,
  };
  assert.equal(diagnosticStatus(null, now), "○");
  assert.equal(diagnosticStatus(client, now), "…");
  assert.equal(diagnosticStatus(client, now + 31000), "!");
  const valid = {
    ...client,
    valid_progress_at: new Date(now).toISOString(),
    checkpoint_at: new Date(now).toISOString(),
  };
  assert.equal(diagnosticStatus(valid, now), "✓");
  assert.equal(diagnosticStatus(valid, now + 46000), "!");
  assert.equal(diagnosticStatus({ ...valid, error: "upload_failed" }, now), "!");
  assert.equal(diagnosticStatus({ ...valid, state: "fenced" }, now), "!");
});
test("strict schema rejects arbitrary metadata and sequence/time regressions", () => {
  assert.ok(validateChunk(chunk(), now));
  assert.throws(() => boundedJson('"' + "x".repeat(513) + '"'), /malformed_chunk/);
  assert.throws(() => boundedJson("[".repeat(9) + "0" + "]".repeat(9)), /malformed_chunk/);
  assert.equal(freshProgress(chunk()), now);
  for (const field of ["ip", "sdp", "email", "deviceLabel", "console", "character", "token"]) {
    const payload = chunk();
    Object.assign(payload.records[0], { [field]: "private" });
    assert.equal(validateChunk(payload, now), null);
  }
  const payload = chunk();
  payload.records.push({ ...payload.records[0], seq: 2 });
  assert.equal(validateChunk(payload, now), null);
  const unknown = chunk();
  Object.assign(unknown.records[0], { metrics: { packets: NaN } });
  assert.equal(validateChunk(unknown, now), null);
  const old = chunk();
  old.records[0].server_ms = now - DIAGNOSTICS.ttlMs - 1;
  assert.equal(validateChunk(old, now), null);
});
test("derived rates use real elapsed time and invalidate first/reset/missing/gap", () => {
  assert.equal(counterRate(100, 300, 4000, 8), 400);
  for (const args of [
    [null, 300, 2000],
    [300, 100, 2000],
    [100, 300, 11000],
    [100, null, 2000],
  ] as const)
    assert.equal(counterRate(args[0], args[1], args[2]), null);
  assert.equal(counterFraction(0, 4, 0, 100, 2000), 0.04);
  assert.equal(lossFraction(0, 10, 0, 90, 2000), 0.1);
  assert.equal(lossFraction(0, 0, 0, 0, 2000), null);
});
test("public RTC stats are privacy-normalized; metadata emitted once; transport deduped", () => {
  const normalizer = createStatsNormalizer();
  const report = new Map([
    [
      "codec",
      { id: "codec", type: "codec", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
    ],
    [
      "rtp",
      {
        id: "rtp",
        type: "inbound-rtp",
        kind: "audio",
        codecId: "codec",
        transportId: "transport",
        bytesReceived: 100,
        packetsReceived: 90,
        packetsLost: 10,
        jitter: 0.02,
        ssrc: 1234,
        trackIdentifier: "SECRET",
      },
    ],
    ["transport", { id: "transport", type: "transport", selectedCandidatePairId: "pair" }],
    [
      "pair",
      {
        id: "pair",
        type: "candidate-pair",
        localCandidateId: "candidate",
        state: "succeeded",
        currentRoundTripTime: 0.08,
        availableOutgoingBitrate: 1000000,
      },
    ],
    [
      "candidate",
      {
        id: "candidate",
        type: "local-candidate",
        candidateType: "relay",
        protocol: "udp",
        address: "192.0.2.1",
        port: 1234,
        url: "turn:SECRET",
      },
    ],
  ]) as unknown as RTCStatsReport;
  const track: StatsTrack = {
    key: "provider-track",
    identity: "provider-identity",
    direction: "remote_inbound",
    source: "microphone",
    report: async () => report,
  };
  const first = normalizer.normalize(track, report, time, id, new Set());
  assert.equal(first.filter((r) => r.kind === "track").length, 1);
  assert.doesNotMatch(
    JSON.stringify(first),
    /192\.0\.2|SECRET|provider-|ssrc|trackIdentifier|turn:/,
  );
  const seen = new Set<string>();
  normalizer.normalize(track, report, { ...time, mono_ms: 2010 }, id, seen);
  const second = normalizer.normalize(track, report, { ...time, mono_ms: 4010 }, id, seen);
  assert.equal(second.filter((r) => r.kind === "track").length, 0);
  assert.equal(second.filter((r) => r.kind === "connection").length, 0);
});
test("clock selects lowest RTT and records uncertainty, never fabricates peer RTT", () => {
  assert.deepEqual(
    selectClock([
      { sent: 100, received: 200, server: 250 },
      { sent: 100, received: 120, server: 210 },
      { sent: 100, received: 300, server: 300 },
    ]),
    { offset: 100, uncertainty: 10, rtt: 20 },
  );
});
test("outbox bounds, secret authorization, exact registered paths", () => {
  assert.equal(mayEnqueue(DIAGNOSTICS.localOutboxBytes - 1, 1), true);
  assert.equal(mayEnqueue(DIAGNOSTICS.localOutboxBytes, 1), false);
  const secret = "s".repeat(43);
  assert.equal(authorizedCleanup(`Bearer ${secret}`, secret), true);
  for (const header of [null, "Bearer user-jwt", "Bearer " + "a".repeat(43)])
    assert.equal(authorizedCleanup(header, secret), false);
  assert.equal(authorizedCleanup(`Bearer ${secret}`, undefined), false);
  assert.equal(authorizedCleanup("Bearer short", "short"), false);
  assert.equal(registeredPath(id, id, id, `${id}/${id}/${id}.ndjson.gz`), true);
  assert.equal(registeredPath(id, id, id, "other-bucket/../secret"), false);
});
test("cleanup confirms Storage success before DB ACK, retries partial failures, bounded batch", async () => {
  const artifact = {
    id,
    run_id: id,
    client_id: id,
    storage_path: `${id}/${id}/${id}.ndjson.gz`,
    cleanup_token: id,
  };
  let calls = 0;
  const fail = await cleanupBatch([artifact], {
    remove: async () => false,
    acknowledge: async () => {
      calls++;
      return true;
    },
  });
  assert.deepEqual(fail, { removed: 0, failed: 1 });
  assert.equal(calls, 0);
  const retry = await cleanupBatch([artifact], {
    remove: async () => true,
    acknowledge: async () => {
      calls++;
      return true;
    },
  });
  assert.deepEqual(retry, { removed: 1, failed: 0 });
  assert.equal(calls, 1);
  const bounded = await cleanupBatch(
    Array.from({ length: 101 }, () => artifact),
    { remove: async () => true, acknowledge: async () => true },
  );
  assert.equal(bounded.removed, 100);
});
test("cleanup POST denies ordinary users before any work", async () => {
  const source = readFileSync("app/api/internal/diagnostics/cleanup/route.ts", "utf8");
  const compiled = transpileModule(source, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  }).outputText;
  const exports: { POST?: (request: Request) => Promise<Response> } = {};
  let work = 0;
  runInNewContext(compiled, {
    exports,
    Response,
    process: { env: { DIAGNOSTIC_CLEANUP_SECRET: "s".repeat(43) } },
    require: (name: string) =>
      name.endsWith("/cleanup")
        ? { authorizedCleanup }
        : {
            cleanup: async () => {
              work++;
              return {};
            },
            responseError: () => Response.json({ error: "failure" }),
          },
  });
  assert.equal(
    (
      await exports.POST!(
        new Request("https://example.test/api/internal/diagnostics/cleanup", {
          method: "POST",
          headers: { authorization: "Bearer ordinary-user-token" },
        }),
      )
    ).status,
    403,
  );
  assert.equal(work, 0);
  assert.equal(
    (
      await exports.POST!(
        new Request("https://example.test/api/internal/diagnostics/cleanup", {
          method: "POST",
          headers: { authorization: "Bearer " + "s".repeat(43) },
        }),
      )
    ).status,
    200,
  );
  assert.equal(work, 1);
});
