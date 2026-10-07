"use client";
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { DiagnosticsCoordinator } from "@/lib/diagnostics/coordinator";
import { durationLabel, type BuildStamp } from "@/lib/diagnostics/contracts";
import { developerEnglish as text } from "@/lib/developer/english";
const Context = createContext<DiagnosticsCoordinator | null>(null);
function useCoordinator() {
  const value = useContext(Context);
  if (!value) throw new Error("Diagnostics provider missing");
  return value;
}
export default function DiagnosticsProvider({ children }: { children: React.ReactNode }) {
  const [coordinator] = useState(
    () =>
      new DiagnosticsCoordinator({
        sha: process.env.NEXT_PUBLIC_DIAGNOSTIC_BUILD_SHA || null,
        deployment: process.env.NEXT_PUBLIC_DIAGNOSTIC_BUILD_DEPLOYMENT || null,
        environment: (process.env.NEXT_PUBLIC_DIAGNOSTIC_BUILD_ENV ||
          "unknown") as BuildStamp["environment"],
      }),
  );
  useEffect(() => {
    coordinator.mount();
    return () => coordinator.unmount();
  }, [coordinator]);
  return (
    <Context.Provider value={coordinator}>
      {children}
      <DeveloperPanel />
    </Context.Provider>
  );
}
export function DeveloperButton() {
  const coordinator = useCoordinator();
  return (
    <button
      type="button"
      title={text.wrench}
      aria-label={text.wrench}
      onClick={() => void coordinator.open()}
      className="rounded border px-2 py-2 focus-visible:outline-2"
    >
      🔧
    </button>
  );
}
export function DiagnosticRoomBridge({
  campaign,
  session,
}: {
  campaign: string;
  session: string | null;
}) {
  const coordinator = useCoordinator();
  const view = useSyncExternalStore(
    coordinator.subscribe,
    coordinator.snapshot,
    coordinator.serverSnapshot,
  );
  useEffect(() => {
    coordinator.setRoom(campaign);
    return () => coordinator.setRoom(null);
  }, [campaign, coordinator]);
  useEffect(() => {
    coordinator.sessionChanged(session);
  }, [coordinator, session]);
  const active =
    view.state?.run &&
    ["recording", "stopping"].includes(view.state.run.state) &&
    view.room === campaign;
  return active ? (
    <div
      role="status"
      className="fixed bottom-2 left-2 z-30 rounded border bg-black/80 px-3 py-2 text-xs text-white"
    >
      <div>{text.playerTitle}</div>
      <div>{text.playerNotice}</div>
    </div>
  ) : null;
}
function DeveloperPanel() {
  const coordinator = useCoordinator();
  const view = useSyncExternalStore(
    coordinator.subscribe,
    coordinator.snapshot,
    coordinator.serverSnapshot,
  );
  if (!view.panel) return null;
  const state = view.state;
  const run = state?.run;
  const context = !!view.room && state?.canStart;
  const roster = state?.roster ?? [];
  const players = roster.filter((p) => p.role === "player");
  const gm = roster.find((p) => p.role === "game_master");
  const local = (time: number) =>
    new Date(time).toLocaleTimeString("en", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  return (
    <aside
      aria-label={text.wrench}
      className="fixed right-3 top-20 z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border bg-white p-4 text-sm text-black shadow-xl"
    >
      <div className="flex justify-end">
        <button
          type="button"
          aria-label={text.close}
          onClick={() => coordinator.close()}
          disabled={view.busy}
          className="px-2 py-1 disabled:opacity-50"
        >
          ×
        </button>
      </div>
      {!view.developer ? (
        <p>{text.denied}</p>
      ) : !context && !run ? (
        <p>
          {view.room ? (state?.active === false ? text.inactive : text.gmRequired) : text.empty}
        </p>
      ) : (
        <>
          <p className="break-words font-medium">{state?.campaignName}</p>
          <dl className="mt-3 grid grid-cols-2 gap-1">
            <dt>{text.now}</dt>
            <dd>{view.now ? local(view.now) : "—"}</dd>
            <dt>{text.started}</dt>
            <dd>{run ? local(Date.parse(run.started_at)) : "—"}</dd>
            <dt>{text.duration}</dt>
            <dd>
              {run
                ? durationLabel(
                    (run.completed_at ? Date.parse(run.completed_at) : view.now) -
                      Date.parse(run.started_at),
                  )
                : "00:00:00"}
            </dd>
          </dl>
          <p className="mt-3">
            {text.players}: {players.length}
          </p>
          <ul className="mt-2 space-y-1">
            {gm ? (
              <li>
                <span title={text.status[gm.status]}>{gm.status}</span> {text.gm}:{" "}
                {gm.name ?? text.gm}
              </li>
            ) : null}
            {players.map((player) => (
              <li key={player.identity}>
                <span title={text.status[player.status]}>{player.status}</span> {player.slot}.{" "}
                {player.name ?? text.player(player.slot)}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            {run && state?.owner && ["recording", "stopping", "ready"].includes(run.state) ? (
              <button
                type="button"
                disabled={view.busy}
                onClick={() => void coordinator.stopExport()}
                className="rounded border px-3 py-2 disabled:opacity-50"
              >
                {run.state === "ready" ? text.retry : text.stop}
              </button>
            ) : context ? (
              <button
                type="button"
                disabled={view.busy || !!run}
                onClick={() => void coordinator.start()}
                className="rounded border px-3 py-2 disabled:opacity-50"
              >
                {text.start}
              </button>
            ) : null}
          </div>
        </>
      )}
      {view.message ? (
        <p
          role={view.error ? "alert" : "status"}
          className={`mt-3 ${view.error ? "text-red-700" : "text-gray-600"}`}
        >
          {view.message}
        </p>
      ) : null}
    </aside>
  );
}
