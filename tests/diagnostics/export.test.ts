import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import { createHash, webcrypto } from "node:crypto";
import * as fflate from "fflate";
import { DIAGNOSTICS } from "../../lib/diagnostics/contracts";

test("real streaming worker ZIP has alias paths, manifest, NDJSON and privacy exclusions", async () => {
  const run = "aaaaaaaa-0000-4000-8000-000000000001",
    segment = "aaaaaaaa-0000-4000-8000-000000000002",
    alias = "aaaaaaaa-0000-4000-8000-000000000003";
  const build = { sha: null, deployment: null, environment: "development" };
  const started = new Date().toISOString();
  const payload = {
    schema: 1,
    segment,
    sequence: 0,
    records: [
      {
        kind: "client",
        seq: 0,
        mono_ms: 0,
        wall_ms: Date.now(),
        server_ms: Date.now(),
        uncertainty_ms: 1,
        browser: "chrome",
        browser_major: 141,
        os: "windows",
        build,
        livekit: "2.21.0",
        timezone: "UTC",
      },
      {
        kind: "connection",
        seq: 1,
        mono_ms: 1,
        wall_ms: Date.now(),
        server_ms: Date.now(),
        uncertainty_ms: 1,
        state: "connected",
        candidate_type: null,
        protocol: null,
        candidate_state: null,
        metrics: {},
      },
      { kind: "event", code: "session_changed", session: run, seq: 2, mono_ms: 2 },
    ],
  };
  const raw = fflate.strToU8(JSON.stringify(payload));
  const compressed = fflate.gzipSync(raw);
  const segmentRow = {
    id: segment,
    alias,
    epoch: 1,
    role: "game_master",
    slot: null,
    state: "finished",
    joined_at: started,
    final_at: started,
    checkpoint_at: started,
    valid_progress_at: started,
    next_sequence: 1,
    error: null,
  };
  let resolve!: (value: { blob: Blob; filename: string }) => void;
  let reject!: (reason: unknown) => void;
  const completion = new Promise<{ blob: Blob; filename: string }>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  const scope: {
    onmessage?: (event: { data: { run: string } }) => Promise<void>;
    postMessage: (value: unknown) => void;
  } = {
    postMessage: (value) => {
      const data = value as { blob?: Blob; filename?: string; error?: string };
      if (data.error) reject(new Error(data.error));
      if (data.blob) resolve({ blob: data.blob, filename: data.filename! });
    },
  };
  const source = transpileModule(readFileSync("lib/diagnostics/export.worker.ts", "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, {
    exports: {},
    self: scope,
    Blob,
    Uint8Array,
    TextDecoder,
    AbortSignal,
    crypto: webcrypto,
    require: (name: string) => (name === "fflate" ? fflate : { DIAGNOSTICS }),
    fetch: async (_url: string, options: { body: string }) => {
      const body = JSON.parse(options.body);
      switch (body.action) {
        case "manifest":
          return Response.json({
            schema: 1,
            run: { id: run, campaign_name: "Allowed campaign name", started_at: started },
            server_build: build,
            completeness: "complete",
          });
        case "segments":
          return Response.json({ items: [segmentRow], next: null });
        case "chunks":
          return Response.json({
            items: [
              {
                id: run,
                client_id: segment,
                sequence: 0,
                compressed_bytes: compressed.length,
                expanded_bytes: raw.length,
                sha256: createHash("sha256").update(compressed).digest("hex"),
              },
            ],
            next: null,
          });
        default:
          return new Response(compressed);
      }
    },
  });
  await scope.onmessage!({ data: { run } });
  const artifact = await completion;
  const files = fflate.unzipSync(new Uint8Array(await artifact.blob.arrayBuffer()));
  for (const path of [
    "manifest.json",
    "README.txt",
    "combined-events.ndjson",
    `participants/${alias}/${segment}/client.json`,
    `participants/${alias}/${segment}/connections.ndjson`,
    `participants/${alias}/${segment}/tracks.ndjson`,
    `participants/${alias}/${segment}/events.ndjson`,
    `participants/${alias}/${segment}/errors.ndjson`,
  ])
    assert.ok(files[path], path);
  const manifest = JSON.parse(fflate.strFromU8(files["manifest.json"]));
  assert.equal(manifest.completeness, "complete");
  assert.equal(manifest.server_build.sha, null);
  assert.deepEqual(manifest.encountered_game_sessions, [run]);
  assert.equal(manifest.telemetry_cadence_ms.sample, 2000);
  assert.deepEqual(manifest.missing_clients, []);
  assert.equal(manifest.segments[0].client_metadata.browser, "chrome");
  assert.match(fflate.strFromU8(files["README.txt"]), /Schema version: 1/);
  assert.doesNotMatch(
    Object.values(files)
      .map((value) => fflate.strFromU8(value))
      .join("\n"),
    /user_id|owner_id|owner_session_hash|storage_path|deviceLabel|rawCandidates|access_token/,
  );
  assert.equal(fflate.strFromU8(files["combined-events.ndjson"]).trim().split("\n").length, 3);
  assert.ok(artifact.filename.endsWith(`-${run}.zip`));
});
