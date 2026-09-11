import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  GAME_SESSION_PRESENCE_RENEWAL_MS,
  parseGameSessionAction,
} from "../../lib/game-sessions/contracts";

function source(...segments: string[]) {
  return readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

test("game session action contract is strict and presence renews every 30 minutes", () => {
  assert.equal(GAME_SESSION_PRESENCE_RENEWAL_MS, 30 * 60 * 1000);
  assert.equal(parseGameSessionAction({ action: "start" }), "start");
  assert.equal(parseGameSessionAction({ action: "end" }), "end");
  assert.equal(parseGameSessionAction({ action: "renew" }), "renew");
  assert.equal(parseGameSessionAction({ action: "start", extra: true }), null);
  assert.equal(parseGameSessionAction({ action: "join" }), null);
  assert.equal(parseGameSessionAction(null), null);
});

test("Game Room owns session presence while Video owns LiveKit", () => {
  const room = source("components", "campaigns", "campaign-game-room.tsx");
  const video = source("components", "campaigns", "campaign-video-room.tsx");
  assert.match(room, /game-session/u);
  assert.match(room, /mutate\("renew", true\)/u);
  assert.match(room, /GAME_SESSION_PRESENCE_RENEWAL_MS/u);
  assert.doesNotMatch(room, /LiveKit|getUserMedia|video\/join/u);
  assert.match(video, /createLiveKitCampaignVideoSession/u);
  assert.doesNotMatch(video, /fetch\([^)]*game-session/u);
});

test("Game Session state uses Supabase Realtime with polling reconciliation", () => {
  const room = source("components", "campaigns", "campaign-game-room.tsx");
  const migration = source(
    "supabase",
    "migrations",
    "20260911121613_publish_game_session_state_realtime.sql",
  );

  assert.match(room, /channel\(`game-session-state-\$\{campaignId\}`\)/u);
  assert.match(room, /event: "INSERT"[\s\S]*?table: "game_sessions"/u);
  assert.match(room, /event: "UPDATE"[\s\S]*?table: "game_sessions"/u);
  assert.match(room, /filter: `campaign_id=eq\.\$\{campaignId\}`/u);
  assert.match(room, /refreshSessionState/u);
  assert.match(room, /GAME_SESSION_STATE_REFRESH_MS/u);
  assert.match(
    migration,
    /alter publication supabase_realtime[\s\S]*add table public\.game_sessions/u,
  );
  assert.doesNotMatch(room + migration, /LiveKit|video\/join/u);
});

test("Journal is the arrow-free root and Gallery opens at Handouts", () => {
  const workspace = source(
    "components",
    "campaigns",
    "campaign-game-room-workspace.tsx",
  );
  const toolNavigation = workspace.slice(
    workspace.indexOf('data-game-room-tool-navigation'),
    workspace.indexOf("{presentationError"),
  );
  assert.match(workspace, />\("journal"\);/u);
  assert.ok(
    toolNavigation.indexOf('tools.journal') <
      toolNavigation.indexOf('tools.gallery'),
  );
  assert.ok(
    toolNavigation.indexOf('tools.gallery') <
      toolNavigation.indexOf('tools.dice'),
  );
  assert.ok(
    toolNavigation.indexOf('tools.dice') <
      toolNavigation.indexOf('tools.character'),
  );
  assert.match(workspace, /activeTool === "journal"[\s\S]*?"grid-cols-4"/u);
  assert.match(
    toolNavigation,
    /activeTool !== "journal" \? \([\s\S]*?tools\.back/u,
  );
  assert.doesNotMatch(toolNavigation, /disabled=\{activeTool === "journal"\}/u);
  assert.match(toolNavigation, /aria-pressed=\{activeTool === "journal"\}/u);
  assert.match(workspace, /border-amber-200 bg-amber-100 text-amber-950 shadow-sm/u);
  assert.doesNotMatch(workspace, /mt-2 w-full/u);
  assert.match(workspace, /data-game-room-journal/u);
  assert.match(workspace, /gameSession\.journal/u);
  assert.match(workspace, /data-game-room-journal-header/u);
  assert.match(workspace, /data-game-room-journal-scroll/u);
  assert.match(workspace, /shrink-0 items-center/u);
  assert.match(workspace, /min-h-0 flex-1 overflow-y-auto/u);
  assert.match(workspace, /data-game-room-gallery-tools/u);
  assert.match(
    workspace,
    /function openGallery\(\)[\s\S]*?setActiveCategory\("handout"\)[\s\S]*?setActiveTool\("gallery"\)/u,
  );
  assert.match(workspace, /onClick=\{closeGallery\}[\s\S]*?tools\.back/u);
  assert.match(workspace, /disabled=\{!connected \|\| presentationBusy\}/u);
  assert.doesNotMatch(workspace, /fake|mockJournal|sampleEvent/ui);
});

test("session route does not create or join LiveKit resources", () => {
  const route = source(
    "app",
    "api",
    "campaigns",
    "[campaignId]",
    "game-session",
    "route.ts",
  );
  assert.match(route, /runtime = "nodejs"/u);
  assert.match(route, /parseGameSessionAction/u);
  assert.doesNotMatch(route, /LiveKit|video\/join|createSession/u);
});
