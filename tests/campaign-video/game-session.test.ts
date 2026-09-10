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

test("Journal is first, session-scoped, and Gallery Share remains video-gated", () => {
  const workspace = source(
    "components",
    "campaigns",
    "campaign-game-room-workspace.tsx",
  );
  const rootTools = workspace.slice(
    workspace.indexOf('data-game-room-root-tools'),
    workspace.indexOf("{presentationError"),
  );
  assert.ok(rootTools.indexOf('tools.journal') < rootTools.indexOf('tools.gallery'));
  assert.ok(rootTools.indexOf('tools.gallery') < rootTools.indexOf('tools.dice'));
  assert.ok(rootTools.indexOf('tools.dice') < rootTools.indexOf('tools.character'));
  assert.match(workspace, /data-game-room-journal/u);
  assert.match(workspace, /gameSession\.journal/u);
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
