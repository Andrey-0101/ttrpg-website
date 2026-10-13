import { DIAGNOSTICS, type BuildStamp, type DiagnosticState } from "./contracts";
import { diagnosticRequest, DiagnosticsHttpError } from "./http";
import type { DiagnosticCollector } from "./collector";
import { createClient } from "@/utils/supabase/client";
import { developerEnglish as text } from "@/lib/developer/english";

export type DiagnosticsView = {
  state: DiagnosticState | null;
  room: string | null;
  panel: boolean;
  busy: boolean;
  now: number;
  message: string | null;
  error: boolean;
  developer: boolean;
};
const EMPTY: DiagnosticsView = {
  state: null,
  room: null,
  panel: false,
  busy: false,
  now: 0,
  message: null,
  error: false,
  developer: false,
};
// Lives in RootLayout, not the Game Room subtree: navigation does not orphan export.
export class DiagnosticsCoordinator {
  private view: DiagnosticsView = EMPTY;
  private listeners = new Set<() => void>();
  private collector: DiagnosticCollector | null = null;
  private collectorRun: string | null = null;
  private attemptedRun: string | null = null;
  private room: string | null = null;
  private requestGeneration = 0;
  private polling: ReturnType<typeof setInterval> | null = null;
  private ticking: ReturnType<typeof setInterval> | null = null;
  private unsubscribe: (() => void) | null = null;
  private channelCleanup: (() => void) | null = null;
  private mutation: Promise<void> | null = null;
  private closeAfterExport = false;
  private refreshPromise: Promise<void> | null = null;
  private serverOffset = 0;
  constructor(private build: BuildStamp) {}
  subscribe = (callback: () => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };
  snapshot = () => this.view;
  serverSnapshot = () => EMPTY;
  private publish(update: Partial<DiagnosticsView>) {
    this.view = { ...this.view, ...update };
    for (const callback of this.listeners) callback();
  }
  mount() {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        this.requestGeneration++;
        this.collector?.dispose();
        this.collector = null;
        this.collectorRun = null;
        this.publish({ ...EMPTY, room: this.room });
      }
    });
    this.unsubscribe = () => data.subscription.unsubscribe();
    this.polling = setInterval(() => {
      if (this.view.state?.owner && this.view.state.run?.state === "recording" && this.room)
        void diagnosticRequest({ action: "owner_heartbeat", run: this.view.state.run.id }).catch(
          () => void this.refresh(),
        );
      if (this.room || this.view.state?.run) void this.refresh();
    }, DIAGNOSTICS.heartbeatMs);
    this.ticking = setInterval(() => {
      if (this.view.panel) this.publish({ now: Date.now() + this.serverOffset });
    }, 1000);
    window.addEventListener("focus", this.reconcile);
    window.addEventListener("online", this.reconcile);
  }
  private reconcile = () => {
    void this.refresh();
  };
  unmount() {
    this.unsubscribe?.();
    this.channelCleanup?.();
    if (this.polling) clearInterval(this.polling);
    if (this.ticking) clearInterval(this.ticking);
    this.collector?.dispose();
    window.removeEventListener("focus", this.reconcile);
    window.removeEventListener("online", this.reconcile);
  }
  setRoom(campaign: string | null) {
    if (campaign === this.room) return;
    const previous = this.room;
    this.room = campaign;
    this.requestGeneration++;
    this.channelCleanup?.();
    this.channelCleanup = null;
    this.publish({ room: campaign });
    if (previous && this.view.state?.owner && this.view.state.run?.state === "recording")
      void this.stopExport("route_exit");
    else if (previous) {
      void this.collector?.finish();
      this.collector = null;
      this.collectorRun = null;
    }
    if (campaign) {
      const supabase = createClient();
      const channel = supabase
        .channel(`diagnostics-control-${campaign}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "game_room_diagnostic_runs",
            filter: `campaign_id=eq.${campaign}`,
          },
          this.reconcile,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "campaign_membership_signals",
            filter: `campaign_id=eq.${campaign}`,
          },
          this.reconcile,
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") this.reconcile();
        });
      this.channelCleanup = () => {
        void supabase.removeChannel(channel);
      };
    }
    if (!this.mutation) void this.refresh();
  }
  async refresh() {
    if (this.refreshPromise) return this.refreshPromise;
    const generation = this.requestGeneration;
    const operation = (async () => {
      try {
        const state = await diagnosticRequest<DiagnosticState>(
          this.room ? { action: "state", campaign: this.room } : { action: "owner" },
        );
        if (generation !== this.requestGeneration) return;
        this.serverOffset = state.serverNow - Date.now();
        this.publish({ state, developer: state.developer, now: state.serverNow });
        if (
          this.collector?.isStopped &&
          state.self?.instance === this.collector.instanceId &&
          state.self.state === "collecting" &&
          Date.parse(state.self.lease_until) <= state.serverNow
        ) {
          // Resume our expired epoch after an outage, never reclaim a newer tab's lease.
          this.collector = null;
          this.collectorRun = null;
          this.attemptedRun = null;
        }
        if (
          state.run &&
          state.run.state === "recording" &&
          this.room &&
          state.run.campaign_id === this.room &&
          this.attemptedRun !== state.run.id
        ) {
          this.attemptedRun = state.run.id;
          this.collectorRun = state.run.id;
          const { DiagnosticCollector } = await import("./collector");
          if (generation !== this.requestGeneration) return;
          this.collector = new DiagnosticCollector(
            this.room,
            state.run.id,
            this.build,
            this.reconcile,
          );
          await this.collector.start(state).catch((error) => {
            this.collector?.dispose();
            if (
              !(error instanceof DiagnosticsHttpError) &&
              !(error instanceof Error && /indexeddb|outbox/.test(error.message))
            )
              this.attemptedRun = null;
            if (state.owner) this.publish({ message: text.bufferError, error: true });
          });
        }
        if (this.collectorRun === state.run?.id) this.collector?.updateState(state);
        else {
          this.collector?.dispose();
          this.collector = null;
          this.collectorRun = null;
        }
      } catch (error) {
        if (generation === this.requestGeneration) {
          if (error instanceof DiagnosticsHttpError && [401, 403].includes(error.status)) {
            this.collector?.dispose();
            this.collector = null;
            this.collectorRun = null;
            this.publish({ state: null });
          }
          if (this.view.panel)
            this.publish({
              message:
                error instanceof DiagnosticsHttpError && [401, 403].includes(error.status)
                  ? text.denied
                  : text.unavailable,
              error: true,
            });
        }
      }
    })().finally(() => {
      if (this.refreshPromise === operation) this.refreshPromise = null;
    });
    this.refreshPromise = operation;
    return operation;
  }
  async open() {
    this.publish({ panel: true, message: null, error: false });
    try {
      const result = await diagnosticRequest<{ developer: boolean }>({ action: "capability" });
      this.publish({ developer: result.developer });
      if (!result.developer) {
        this.publish({ message: text.denied, error: true });
        return;
      }
      await this.refresh();
    } catch {
      this.publish({ message: text.denied, error: true });
    }
  }
  async start() {
    if (this.mutation || !this.room || !this.view.state?.canStart) return;
    const campaign = this.room;
    this.publish({ busy: true, message: null, error: false });
    const operation = (async () => {
      try {
        await diagnosticRequest({ action: "start", campaign });
        await this.refresh();
      } catch {
        this.publish({ message: text.unavailable, error: true });
      } finally {
        this.publish({ busy: false });
      }
    })();
    this.mutation = operation;
    await operation;
    this.mutation = null;
  }
  close() {
    if (
      this.view.state?.owner &&
      ["recording", "stopping"].includes(this.view.state.run?.state ?? "")
    )
      void this.stopExport("explicit", true);
    else if (!this.view.busy) this.publish({ panel: false });
  }
  stopExport(
    reason: "explicit" | "route_exit" = "explicit",
    closeOnSuccess = false,
  ): Promise<void> {
    if (this.mutation) {
      if (closeOnSuccess) this.closeAfterExport = true;
      return this.mutation;
    }
    const run = this.view.state?.run;
    if (!run || !this.view.state?.owner) return Promise.resolve();
    this.closeAfterExport = closeOnSuccess;
    this.publish({ panel: true, busy: true, error: false, message: text.collecting });
    const operation = (async () => {
      try {
        let state = await diagnosticRequest<DiagnosticState>({
          action: "stop",
          run: run.id,
          reason,
        });
        this.publish({ state });
        this.collector?.updateState(state);
        void this.collector?.finish();
        // Fixed server deadline; retries do not set a new deadline.
        while (state.run?.state === "stopping") {
          await new Promise<void>((resolve) => setTimeout(resolve, 500));
          state = await diagnosticRequest<DiagnosticState>({ action: "state", run: run.id });
          this.publish({ state });
        }
        if (state.run?.state !== "ready") throw new Error("export_unavailable");
        this.publish({ message: text.exporting });
        const { exportDiagnostics, initiateDownload } = await import("./export-client");
        const artifact = await exportDiagnostics(run.id);
        initiateDownload(artifact.blob, artifact.filename);
        this.publish({ message: text.download });
        try {
          const result = await diagnosticRequest<{ pending: boolean }>({
            action: "request_cleanup",
            run: run.id,
          });
          if (result.pending) this.publish({ message: text.cleanupPending });
        } catch {
          this.publish({ message: text.cleanupPending });
        }
        this.collector?.dispose();
        this.collector = null;
        this.collectorRun = null;
        this.publish({
          state: { ...state, run: null },
          ...(this.closeAfterExport ? { panel: false } : {}),
        });
      } catch {
        this.publish({ message: text.unavailable, error: true });
      } finally {
        this.closeAfterExport = false;
        this.publish({ busy: false });
      }
    })().finally(() => {
      if (this.mutation === operation) this.mutation = null;
    });
    this.mutation = operation;
    return operation;
  }
  sessionChanged(session: string | null) {
    const campaign = this.room;
    if (campaign)
      void import("./media-registry").then(({ setDiagnosticSession }) =>
        setDiagnosticSession(campaign, session),
      );
  }
}
