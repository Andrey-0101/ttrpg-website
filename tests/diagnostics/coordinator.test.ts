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
      setRoom(campaign: string | null): void;
      refresh(): Promise<void>;
      start(): Promise<void>;
      open(): Promise<void>;
      close(): void;
      stopExport(): Promise<void>;
      snapshot(): { busy: boolean; message: string | null };
    };
  } = {};
  const source = transpileModule(readFileSync("lib/diagnostics/coordinator.ts", "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, {
    exports,
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
          createClient: () => ({ channel: () => chain, removeChannel: async () => undefined }),
        };
      if (name === "./collector") return { DiagnosticCollector: Collector };
      if (name === "./export-client")
        return {
          exportDiagnostics: async () => {
            calls.push("export");
            return { blob: new Blob(), filename: "test.zip" };
          },
          initiateDownload: () => calls.push("download"),
        };
      if (name === "./http")
        return {
          DiagnosticsHttpError,
          diagnosticRequest: async (body: { action: string }) => {
            calls.push(body.action);
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
            if (body.action === "stop")
              state = {
                ...state,
                run: { ...state.run!, state: "ready", completed_at: new Date().toISOString() },
              };
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
  return { coordinator, campaign, calls, subscriptions, collectors: () => collectors };
}
test("Start uses canonical Realtime + reread; X uses the same single Stop/export/cleanup path", async () => {
  const h = harness();
  h.coordinator.setRoom(h.campaign);
  await h.coordinator.refresh();
  await h.coordinator.start();
  assert.equal(h.collectors(), 1);
  assert.deepEqual(h.subscriptions, ["game_room_diagnostic_runs", "campaign_membership_signals"]);
  h.coordinator.close();
  await h.coordinator.stopExport();
  assert.equal(h.calls.filter((c) => c === "stop").length, 1);
  assert.deepEqual(
    h.calls.filter((c) => ["export", "download", "request_cleanup"].includes(c)),
    ["export", "download", "request_cleanup"],
  );
  assert.equal(h.coordinator.snapshot().busy, false);
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
