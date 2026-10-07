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
import { formatDeveloperDateTime } from "../../lib/developer/date-time";

const now = Date.parse("2026-10-07T10:11:02Z");
function markup(
  player = false,
  outside = false,
  options: { idle?: boolean; blankNames?: boolean } = {},
) {
  const campaign = "aaaaaaaa-0000-4000-8000-000000000001";
  const started = now - 27 * 3600_000;
  const view = {
    panel: !player,
    developer: !player,
    busy: false,
    room: outside ? null : campaign,
    now,
    message: null,
    error: false,
    state: {
      campaignName: "Campaign name",
      canStart: true,
      owner: true,
      active: true,
      run:
        outside || options.idle
          ? null
          : {
              state: "recording",
              id: campaign,
              started_at: new Date(started).toISOString(),
              completed_at: null,
            },
      roster: [
        {
          identity: "one",
          role: "player",
          slot: 1,
          name: options.blankNames ? "" : "Player Profile",
          status: "…",
        },
        {
          identity: "GM",
          role: "game_master",
          slot: null,
          name: options.blankNames ? "  " : "GM Profile",
          status: "✓",
        },
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
      if (name.endsWith("/date-time")) return { formatDeveloperDateTime };
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
test("panel header has the same decorative wrench on the left and accessible X on the right, with no heading", () => {
  const html = markup();
  const panel = html.slice(html.indexOf("<aside"));
  assert.match(
    panel,
    /<div class="flex items-center justify-between"><span aria-hidden="true">🔧<\/span><button type="button" aria-label="Close"[^>]*>×<\/button><\/div>/,
  );
  assert.equal((html.match(/🔧/g) ?? []).length, 2);
  assert.doesNotMatch(panel, /<h[1-6]/);
  assert.match(
    readFileSync("components/developer/diagnostics-provider.tsx", "utf8"),
    /onClick=\{\(\) => coordinator\.close\(\)\}/,
  );
});
test("Now and server Started use one full local date/time formatter, idle Started and duration stay unchanged", () => {
  const html = markup();
  assert.ok(html.includes(`<dt>Now</dt><dd>${formatDeveloperDateTime(now)}</dd>`));
  assert.ok(
    html.includes(`<dt>Started</dt><dd>${formatDeveloperDateTime(now - 27 * 3600_000)}</dd>`),
  );
  assert.match(html, /<dt>Duration<\/dt><dd>27:00:00<\/dd>/);
  const idle = markup(false, false, { idle: true });
  assert.match(idle, /<dt>Started<\/dt><dd>—<\/dd>/);
  assert.match(idle, /<dt>Duration<\/dt><dd>00:00:00<\/dd>/);
  assert.match(idle, />Campaign name<\/p>/);
  assert.doesNotMatch(idle, /Campaign:/);
  assert.match(idle, /Players: 2/);
  assert.match(idle, />Start diagnostics<\/button>/);
});
test("date/time defaults to the Developer-local timezone with English month and midnight as 00, not 24", () => {
  const source = transpileModule(readFileSync("lib/developer/date-time.ts", "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  }).outputText;
  for (const [zone, expected] of [
    ["Australia/Perth", "07 Oct 2026, 18:11:02"],
    ["America/Los_Angeles", "07 Oct 2026, 03:11:02"],
  ]) {
    const exports: { formatDeveloperDateTime?: (time: number) => string } = {};
    runInNewContext(source, {
      exports,
      Intl: {
        DateTimeFormat: function (locale: string, options: Intl.DateTimeFormatOptions) {
          assert.equal(locale, "en-US");
          assert.equal(
            options.timeZone,
            undefined,
            "application must not override browser timezone",
          );
          return new Intl.DateTimeFormat(locale, { ...options, timeZone: zone });
        },
      },
    });
    assert.equal(exports.formatDeveloperDateTime!(now), expected);
    if (zone === "Australia/Perth") {
      assert.equal(
        exports.formatDeveloperDateTime!(Date.parse("2026-10-07T16:00:00Z")),
        "08 Oct 2026, 00:00:00",
      );
      assert.equal(
        exports.formatDeveloperDateTime!(Date.parse("2026-09-07T10:11:02Z")),
        "07 Sep 2026, 18:11:02",
      );
    }
  }
});
test("roster separates role/name/right-hand accessible status, keeps Player order and uses only an em dash for missing names", () => {
  const rows = [...markup().matchAll(/<li class="([^"]+)">(.*?)<\/li>/g)];
  const values = rows.map((row) =>
    [...row[2].matchAll(/<span(?: [^>]*)?>(.*?)<\/span>/g)].map((span) => span[1]),
  );
  assert.deepEqual(values, [
    ["GM", "GM Profile", "✓"],
    ["Player 1", "Player Profile", "…"],
    ["Player 3", "—", "○"],
  ]);
  for (const row of rows) assert.match(row[1], /grid-cols-\[4\.5rem_minmax\(0,1fr\)_auto\]/);
  assert.match(rows[0][2], /title="Validated progress received">✓<\/span>$/);
  assert.match(rows[1][2], /title="Waiting for validated data">…<\/span>$/);
  assert.match(rows[2][2], /title="Not collecting">○<\/span>$/);
  const missing = [...markup(false, false, { blankNames: true }).matchAll(/<li[^>]*>(.*?)<\/li>/g)];
  for (const row of missing)
    assert.equal([...row[1].matchAll(/<span(?: [^>]*)?>(.*?)<\/span>/g)][1][1], "—");
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
