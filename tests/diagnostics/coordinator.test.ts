import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";
import { DIAGNOSTICS, type DiagnosticState } from "../../lib/diagnostics/contracts";
import { developerEnglish } from "../../lib/developer/english";
import { DiagnosticsHttpError } from "../../lib/diagnostics/http";

function harness() {
  const campaign = "aaaaaaaa-0000-4000-8000-000000000001",
    run = "aaaaaaaa-0000-4000-8000-000000000002";
  let state: DiagnosticState = {
    run: null,
    serverNow: Date.now(),
    developer: true,
    owner: true,
    canStart: true,
    active: true,
    campaignName: "Test",
    roster: [],
  };
  const calls: string[] = [];
  const subscriptions: string[] = [];
  const requests: Record<string, unknown>[] = [];
  const deadlines: (string | null)[] = [];
  const intervals: { callback: () => void; delay: number }[] = [];
  let localNow = Date.now();
  let failure: string | null = null;
  let exportGate: Promise<void> | null = null;
  let releaseExport = () => {};
  let stoppingReads = 0;
  const fail = (stage: string) => {
    if (failure === stage) {
      failure = null;
      throw new Error("simulated_failure");
    }
  };
  let collectors = 0;
  const chain = {
    on: (_event: string, options: { table: string }) => {
      subscriptions.push(options.table);
      return chain;
    },
    subscribe: () => chain,
  };
  class Collector {
    isStopped = false;
    instanceId = "our-instance";
    start = async () => {
      collectors++;
    };
    dispose = () => {
      this.isStopped = true;
    };
    finish = async () => {
      this.isStopped = true;
    };
    updateState = () => undefined;
  }
  const exports: {
    DiagnosticsCoordinator?: new (build: unknown) => {
      mount(): void;
      unmount(): void;
      setRoom(campaign: string | null): void;
      refresh(): Promise<void>;
      start(): Promise<void>;
      open(): Promise<void>;
      close(): void;
      stopExport(): Promise<void>;
      snapshot(): {
        busy: boolean;
        message: string | null;
        panel: boolean;
        error: boolean;
        now: number;
        state: DiagnosticState | null;
      };
    };
  } = {};
  const source = transpileModule(readFileSync("lib/diagnostics/coordinator.ts", "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, {
    exports,
    Date: class extends Date {
      static now() {
        return localNow;
      }
    },
    setInterval: (callback: () => void, delay: number) => {
      intervals.push({ callback, delay });
      return intervals.length;
    },
    clearInterval: () => undefined,
    window: { addEventListener: () => undefined, removeEventListener: () => undefined },
    setTimeout: (callback: () => void) => {
      queueMicrotask(callback);
      return 1;
    },
    clearTimeout: () => undefined,
    require: (name: string) => {
      if (name === "./contracts") return { DIAGNOSTICS };
      if (name === "@/lib/developer/english") return { developerEnglish };
      if (name === "@/utils/supabase/client")
        return {
          createClient: () => ({
            channel: () => chain,
            removeChannel: async () => undefined,
            auth: {
              onAuthStateChange: () => ({
                data: { subscription: { unsubscribe: () => undefined } },
              }),
            },
          }),
        };
      if (name === "./collector") return { DiagnosticCollector: Collector };
      if (name === "./export-client")
        return {
          exportDiagnostics: async () => {
            calls.push("export");
            fail("export");
            if (exportGate) await exportGate;
            return { blob: new Blob(), filename: "test.zip" };
          },
          initiateDownload: () => calls.push("download"),
        };
      if (name === "./http")
        return {
          DiagnosticsHttpError,
          diagnosticRequest: async (body: { action: string } & Record<string, unknown>) => {
            calls.push(body.action);
            requests.push(body);
            fail(body.action);
            if (body.action === "capability") return { developer: true };
            if (body.action === "start")
              state = {
                ...state,
                run: {
                  id: run,
                  campaign_id: campaign,
                  campaign_name: "Test",
                  state: "recording",
                  started_at: new Date().toISOString(),
                  stopped_at: null,
                  stop_deadline: null,
                  completed_at: null,
                  expires_at: null,
                  partial: false,
                  revision: 1,
                  stop_reason: null,
                },
              };
            if (body.action === "stop" && state.run?.state === "recording")
              state = {
                ...state,
                run: {
                  ...state.run!,
                  state: "stopping",
                  stopped_at: new Date(localNow).toISOString(),
                  stop_deadline: new Date(localNow + DIAGNOSTICS.finalCollectionMs).toISOString(),
                },
              };
            if (body.action === "stop") deadlines.push(state.run!.stop_deadline);
            if (body.action === "state" && state.run?.state === "stopping") {
              deadlines.push(state.run.stop_deadline);
              if (++stoppingReads >= 2)
                state = {
                  ...state,
                  run: { ...state.run, state: "ready", completed_at: new Date().toISOString() },
                };
            }
            if (body.action === "request_cleanup") return { pending: false };
            return state;
          },
        };
      throw new Error(name);
    },
  });
  const coordinator = new exports.DiagnosticsCoordinator!({
    sha: null,
    deployment: null,
    environment: "development",
  });
  return {
    coordinator,
    campaign,
    calls,
    subscriptions,
    requests,
    deadlines,
    intervals,
    collectors: () => collectors,
    serverRun: () => state.run,
    failNext: (stage: string) => {
      failure = stage;
    },
    advance: (ms: number) => {
      localNow += ms;
    },
    holdExport: () => {
      exportGate = new Promise<void>((resolve) => {
        releaseExport = resolve;
      });
    },
    releaseExport: () => releaseExport(),
  };
}
test("Start uses canonical Realtime + reread; X uses the same single Stop/export/cleanup path", async () => {
  const h = harness();
  h.coordinator.setRoom(h.campaign);
  await h.coordinator.refresh();
  await h.coordinator.open();
  await h.coordinator.start();
  assert.equal(h.collectors(), 1);
  assert.deepEqual(h.subscriptions, ["game_room_diagnostic_runs", "campaign_membership_signals"]);
  h.coordinator.close();
  h.coordinator.close();
  await h.coordinator.stopExport();
  assert.equal(h.calls.filter((c) => c === "stop").length, 1);
  assert.deepEqual(
    h.calls.filter((c) => ["export", "download", "request_cleanup"].includes(c)),
    ["export", "download", "request_cleanup"],
  );
  assert.equal(h.coordinator.snapshot().busy, false);
  assert.equal(h.coordinator.snapshot().panel, false);
  assert.equal(new Set(h.deadlines).size, 1);
  const stopped = h.serverRun();
  assert.ok(stopped);
  assert.equal(h.deadlines[0], new Date(Date.parse(stopped.stopped_at!) + 30_000).toISOString());
  assert.deepEqual(Object.keys(h.requests.find((r) => r.action === "stop")!).sort(), [
    "action",
    "reason",
    "run",
  ]);
});
test("X while idle closes immediately without Stop/export/cleanup", async () => {
  const h = harness();
  h.coordinator.setRoom(h.campaign);
  await h.coordinator.open();
  assert.equal(h.coordinator.snapshot().panel, true);
  h.coordinator.close();
  assert.equal(h.coordinator.snapshot().panel, false);
  assert.equal(
    h.calls.some((c) => ["stop", "export", "download", "request_cleanup"].includes(c)),
    false,
  );
});
test("Stop & export leaves panel open; an overlapping X shares that pipeline and closes only after download/cleanup", async () => {
  const normal = harness();
  normal.coordinator.setRoom(normal.campaign);
  await normal.coordinator.open();
  await normal.coordinator.start();
  await normal.coordinator.stopExport();
  assert.equal(normal.coordinator.snapshot().panel, true);
  const h = harness();
  h.coordinator.setRoom(h.campaign);
  await h.coordinator.open();
  await h.coordinator.start();
  h.holdExport();
  const operation = h.coordinator.stopExport();
  h.coordinator.close();
  h.coordinator.close();
  assert.equal(h.coordinator.stopExport(), operation);
  for (let i = 0; i < 50 && !h.calls.includes("export"); i++) await Promise.resolve();
  assert.ok(h.calls.includes("export"));
  assert.equal(h.coordinator.snapshot().panel, true);
  assert.equal(h.calls.includes("download"), false);
  h.releaseExport();
  await operation;
  assert.equal(h.coordinator.snapshot().panel, false);
  for (const action of ["stop", "export", "download", "request_cleanup"])
    assert.equal(h.calls.filter((c) => c === action).length, 1);
  assert.equal(new Set(h.deadlines).size, 1);
});
for (const stage of ["stop", "state", "export"]) {
  test(`failed X-triggered ${stage} keeps panel/data/error visible and allows retry without extending the deadline`, async () => {
    const h = harness();
    h.coordinator.setRoom(h.campaign);
    await h.coordinator.open();
    await h.coordinator.start();
    h.failNext(stage);
    h.coordinator.close();
    await h.coordinator.stopExport();
    assert.equal(h.coordinator.snapshot().panel, true);
    assert.equal(h.coordinator.snapshot().error, true);
    assert.equal(h.coordinator.snapshot().message, developerEnglish.unavailable);
    assert.ok(h.coordinator.snapshot().state?.run);
    assert.equal(h.calls.includes("download"), false);
    assert.equal(h.calls.includes("request_cleanup"), false);
    await h.coordinator.stopExport();
    assert.equal(
      h.coordinator.snapshot().panel,
      true,
      "retry button retains normal Stop & export semantics",
    );
    assert.equal(h.coordinator.snapshot().error, false);
    assert.equal(h.calls.filter((c) => c === "download").length, 1);
    assert.equal(h.calls.filter((c) => c === "request_cleanup").length, 1);
    assert.equal(new Set(h.deadlines).size, 1);
  });
}
test("successful X export closes after cleanup attempt even if existing autonomous fallback remains pending", async () => {
  const h = harness();
  h.coordinator.setRoom(h.campaign);
  await h.coordinator.open();
  await h.coordinator.start();
  h.failNext("request_cleanup");
  h.coordinator.close();
  await h.coordinator.stopExport();
  assert.equal(h.coordinator.snapshot().panel, false);
  assert.equal(h.coordinator.snapshot().message, developerEnglish.cleanupPending);
  assert.deepEqual(
    h.calls.filter((c) => ["export", "download", "request_cleanup"].includes(c)),
    ["export", "download", "request_cleanup"],
  );
});
test("existing Now presentation updates every second without changing the telemetry clock", async () => {
  const h = harness();
  h.coordinator.setRoom(h.campaign);
  await h.coordinator.open();
  h.coordinator.mount();
  const tick = h.intervals.find((timer) => timer.delay === 1000);
  assert.ok(tick);
  const before = h.coordinator.snapshot().now;
  h.advance(1000);
  tick.callback();
  assert.equal(h.coordinator.snapshot().now, before + 1000);
  h.coordinator.unmount();
});
test("owner route exit finalizes/exports outside Game Room without a LiveKit operation", async () => {
  const h = harness();
  h.coordinator.setRoom(h.campaign);
  await h.coordinator.refresh();
  await h.coordinator.start();
  h.coordinator.setRoom(null);
  await h.coordinator.stopExport();
  assert.equal(h.calls.filter((c) => c === "stop").length, 1);
  assert.ok(h.calls.includes("download"));
  assert.doesNotMatch(h.calls.join(" "), /LiveKit|disconnect|join-video/);
});
