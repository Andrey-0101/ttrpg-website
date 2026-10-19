import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import { createHash, webcrypto } from "node:crypto";
import * as fflate from "fflate";
import { DIAGNOSTICS } from "../../lib/diagnostics/contracts";

function harness(stallAfter?: number) {
  const run = "aaaaaaaa-0000-4000-8000-000000000001";
  const segment = "aaaaaaaa-0000-4000-8000-000000000002";
  let now = 0;
  let nextTimer = 0;
  let downloads = 0;
  let terminated = false;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const advance = (ms: number) => {
    const target = now + ms;
    while (true) {
      const due = [...timers]
        .filter(([, timer]) => timer.at <= target)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      now = due[1].at;
      timers.delete(due[0]);
      due[1].callback();
    }
    now = target;
  };
  let reachedStall!: () => void;
  const stalled = new Promise<void>((resolve) => {
    reachedStall = resolve;
  });
  const chunks = Array.from({ length: 100 }, (_, sequence) => {
    const raw = fflate.strToU8(JSON.stringify({ schema: 1, segment, sequence, records: [] }));
    const compressed = fflate.gzipSync(raw);
    return {
      compressed,
      item: {
        id: String(sequence),
        client_id: segment,
        sequence,
        compressed_bytes: compressed.length,
        expanded_bytes: raw.length,
        sha256: createHash("sha256").update(compressed).digest("hex"),
      },
    };
  });
  const compile = (file: string) =>
    transpileModule(
      readFileSync(file, "utf8").replace(
        "import.meta.url",
        '"https://test.invalid/export-client.js"',
      ),
      { compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 } },
    ).outputText;
  type Message = { progress?: boolean; error?: string; blob?: Blob; filename?: string };
  const progressAt: number[] = [];
  class Worker {
    onmessage?: (event: { data: Message }) => void;
    onerror?: () => void;
    task?: Promise<void>;
    terminate() {
      terminated = true;
    }
    postMessage(data: { run: string }) {
      const scope: {
        onmessage?: (event: { data: { run: string } }) => Promise<void>;
        postMessage: (value: Message) => void;
      } = {
        postMessage: (value) => {
          if (terminated) return;
          if (value.progress) progressAt.push(now);
          this.onmessage?.({ data: value });
        },
      };
      runInNewContext(compile("lib/diagnostics/export.worker.ts"), {
        exports: {},
        self: scope,
        Blob,
        Uint8Array,
        TextDecoder,
        AbortSignal,
        crypto: webcrypto,
        require: (name: string) => (name === "fflate" ? fflate : { DIAGNOSTICS }),
        fetch: async (_url: string, options: { body: string }) => {
          if (terminated) throw new Error("worker_terminated");
          const body = JSON.parse(options.body);
          if (body.action === "manifest")
            return Response.json({
              schema: 1,
              run: { id: run, started_at: "2026-10-18T13:10:23Z" },
              completeness: "complete",
            });
          if (body.action === "segments")
            return Response.json({
              items: [{
                id: segment,
                alias: "test-alias",
                state: "finished",
                next_sequence: 100,
                valid_progress_at: "2026-10-18T14:27:00Z",
              }],
              next: null,
            });
          if (body.action === "chunks")
            return Response.json({ items: chunks.map(({ item }) => item), next: null });
          assert.equal(body.action, "download");
          if (downloads === stallAfter) {
            reachedStall();
            return new Promise<Response>(() => {});
          }
          advance(1000);
          downloads++;
          if (terminated) throw new Error("worker_terminated");
          return new Response(chunks[Number(body.chunk)].compressed);
        },
      });
      this.task = scope.onmessage!({ data });
    }
  }
  const exports: {
    exportDiagnostics?: (id: string) => Promise<{ blob: Blob; filename: string }>;
  } = {};
  runInNewContext(compile("lib/diagnostics/export-client.ts"), {
    exports,
    Worker,
    URL,
    setTimeout: (callback: () => void, delay: number) => {
      const id = ++nextTimer;
      timers.set(id, { at: now + delay, callback });
      return id;
    },
    clearTimeout: (id: number) => timers.delete(id),
  });
  return {
    start: () => exports.exportDiagnostics!(run),
    advance,
    stalled,
    progressAt,
    get now() { return now; },
    get downloads() { return downloads; },
    get terminated() { return terminated; },
    get timers() { return timers.size; },
  };
}

test("real export client and worker finish a 100-second page with continuing chunk progress", async () => {
  const h = harness();
  const artifact = await h.start();
  assert.equal(h.now, 100_000);
  assert.equal(h.downloads, 100);
  assert.ok(h.progressAt.some((time) => time > 60_000));
  assert.equal(h.terminated, true);
  assert.equal(h.timers, 0);
  const files = fflate.unzipSync(new Uint8Array(await artifact.blob.arrayBuffer()));
  assert.equal(JSON.parse(fflate.strFromU8(files["manifest.json"])).completeness, "complete");
});

test("real export client still terminates 60 seconds after the last completed chunk when work stalls", async () => {
  const h = harness(1);
  const result = h.start();
  const rejection = assert.rejects(result, /export_unavailable/);
  await h.stalled;
  assert.equal(h.downloads, 1);
  h.advance(59_999);
  assert.equal(h.terminated, false);
  h.advance(1);
  await rejection;
  assert.equal(h.now, 61_000);
  assert.equal(h.terminated, true);
  assert.equal(h.timers, 0);
});
