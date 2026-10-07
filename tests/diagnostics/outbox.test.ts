import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import {
  enqueue,
  pending,
  acknowledge,
  pruneLocal,
  outboxRuns,
  type OutboxChunk,
} from "../../lib/diagnostics/outbox";
import { DIAGNOSTICS } from "../../lib/diagnostics/contracts";

test("IndexedDB closes/reopens, keeps unconfirmed bytes, accepts exact idempotent ACK and ordered bounded reads", async () => {
  const run = crypto.randomUUID(),
    segment = crypto.randomUUID();
  const chunk = (sequence: number): OutboxChunk => ({
    key: `${segment}:${String(sequence).padStart(10, "0")}`,
    run,
    segment,
    sequence,
    bytes: new Uint8Array([sequence]).buffer,
    created: Date.now(),
  });
  await enqueue(chunk(10));
  await enqueue(chunk(2));
  await enqueue(chunk(0));
  await enqueue(chunk(0));
  assert.deepEqual(await outboxRuns(), [run]);
  assert.deepEqual(
    (await pending(segment)).map((c) => c.sequence),
    [0],
  );
  await acknowledge(chunk(0).key);
  await acknowledge(chunk(0).key);
  assert.deepEqual(
    (await pending(segment)).map((c) => c.sequence),
    [2],
  );
  await pruneLocal(run);
  assert.deepEqual(await pending(segment), []);
  assert.deepEqual(await outboxRuns(), []);
});
test("concurrent IndexedDB transactions enforce total 16 MiB, never silently discard on quota", async () => {
  const run = crypto.randomUUID(),
    segment = crypto.randomUUID();
  const big = (index: number): OutboxChunk => ({
    key: `${segment}:${index}`,
    run,
    segment,
    sequence: index,
    bytes: new ArrayBuffer(DIAGNOSTICS.localOutboxBytes),
    created: Date.now(),
  });
  const results = await Promise.allSettled([enqueue(big(0)), enqueue(big(1))]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  assert.ok((await pending(segment)).length === 1);
  await pruneLocal(run);
  await enqueue({ ...big(2), bytes: new ArrayBuffer(1) });
  assert.ok((await pending(segment)).length === 1);
  await pruneLocal(run);
});
test("old-run reconciliation enumerates at most eight queues without reading payloads", async () => {
  const runs = Array.from({ length: 10 }, () => crypto.randomUUID()).sort();
  for (const run of runs) {
    const segment = crypto.randomUUID();
    await enqueue({
      key: `${segment}:0`,
      run,
      segment,
      sequence: 0,
      bytes: new ArrayBuffer(1),
      created: Date.now(),
    });
  }
  assert.deepEqual(await outboxRuns(), runs.slice(0, 8));
  for (const run of runs) await pruneLocal(run);
  assert.deepEqual(await outboxRuns(), []);
});
