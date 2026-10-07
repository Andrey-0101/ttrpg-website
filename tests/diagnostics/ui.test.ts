import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from "typescript";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { durationLabel } from "../../lib/diagnostics/contracts";
import { developerEnglish } from "../../lib/developer/english";

function markup(player = false, outside = false) {
  const campaign = "aaaaaaaa-0000-4000-8000-000000000001";
  const started = Date.now() - 27 * 3600_000;
  const view = {
    panel: !player,
    developer: !player,
    busy: false,
    room: outside ? null : campaign,
    now: Date.now(),
    message: null,
    error: false,
    state: {
      campaignName: "Campaign name",
      canStart: true,
      owner: true,
      active: true,
      run: outside
        ? null
        : {
            state: "recording",
            id: campaign,
            started_at: new Date(started).toISOString(),
            completed_at: null,
          },
      roster: [
        { identity: "GM", role: "game_master", slot: null, name: "GM Profile", status: "✓" },
        { identity: "one", role: "player", slot: 1, name: "Player Profile", status: "…" },
        { identity: "three", role: "player", slot: 3, name: null, status: "○" },
      ],
    },
  };
  class Coordinator {
    mount = () => undefined;
    unmount = () => undefined;
    snapshot = () => view;
    serverSnapshot = () => view;
    subscribe = () => () => undefined;
    setRoom = () => undefined;
    sessionChanged = () => undefined;
    open = () => undefined;
    close = () => undefined;
    start = () => undefined;
    stopExport = () => undefined;
  }
  const exports: {
    default?: React.ComponentType<{ children: React.ReactNode }>;
    DeveloperButton?: React.ComponentType;
    DiagnosticRoomBridge?: React.ComponentType<{ campaign: string; session: null }>;
  } = {};
  const source = transpileModule(
    readFileSync("components/developer/diagnostics-provider.tsx", "utf8"),
    {
      compilerOptions: {
        module: ModuleKind.CommonJS,
        target: ScriptTarget.ES2022,
        jsx: JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  runInNewContext(source, {
    exports,
    process: {
      env: {
        NEXT_PUBLIC_DIAGNOSTIC_BUILD_SHA: "a".repeat(40),
        NEXT_PUBLIC_DIAGNOSTIC_BUILD_ENV: "preview",
      },
    },
    require: (name: string) => {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsx;
      if (name.endsWith("/coordinator")) return { DiagnosticsCoordinator: Coordinator };
      if (name.endsWith("/contracts")) return { durationLabel };
      if (name.endsWith("/english")) return { developerEnglish };
      throw new Error(name);
    },
  });
  const child = player
    ? React.createElement(exports.DiagnosticRoomBridge!, { campaign, session: null })
    : React.createElement(exports.DeveloperButton!);
  return renderToStaticMarkup(React.createElement(exports.default!, null, child));
}
test("Developer panel is English-only, minimal, uses profile names/stable slots and >24h duration", () => {
  const html = markup();
  assert.match(html, /Players: 2/);
  assert.match(html, /GM Profile/);
  assert.match(html, /Player Profile/);
  assert.match(html, /Player 3/);
  assert.match(html, /27:00:00/);
  assert.match(html, /Stop &amp; export/);
  assert.doesNotMatch(
    html,
    /<h[1-6]|preview|aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa|character|@example/i,
  );
});
test("Player indication has only approved English copy; Developer outside room has contextual empty state", () => {
  const player = markup(true);
  assert.match(player, /Technical diagnostics active/);
  assert.match(player, /Connection statistics only\. No audio\/video recording\./);
  assert.doesNotMatch(player, /Start diagnostics|Stop|Developer tools|Campaign name|Duration/);
  const outside = markup(false, true);
  assert.match(outside, /No tools available here\./);
  assert.doesNotMatch(outside, /Start diagnostics|Stop &amp; export/);
});
