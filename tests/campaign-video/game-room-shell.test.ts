import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { getCampaignVideoGridClass } from "../../lib/campaign-video/browser/presentation";

function source(...segments: string[]) {
  return readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

function messageKeys(value: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    return entry && typeof entry === "object" && !Array.isArray(entry)
      ? messageKeys(entry as Record<string, unknown>, next)
      : [next];
  });
}

test("localized Game Room route keeps authentication and campaign RLS ahead of room data", () => {
  const route = source(
    "app",
    "[locale]",
    "campaigns",
    "[id]",
    "game-room",
    "page.tsx",
  );
  assert.match(route, /hasLocale\(routing\.locales, requestedLocale\)/u);
  assert.match(route, /supabase\.auth\.getClaims\(\)/u);
  assert.match(route, /redirect\(\{ href: "\/login", locale \}\)/u);
  assert.match(route, /\.from\("campaigns"\)/u);
  assert.match(route, /\.eq\("id", id\)/u);
  assert.match(route, /if \(campaignError \|\| !campaign\) \{\s*notFound\(\)/u);
  assert.doesNotMatch(route, /video\/join|createLiveKit|issueCampaignVideo/u);
});

test("Campaign Overview links to Game Room without mounting the active video component", () => {
  const overview = source("app", "[locale]", "campaigns", "[id]", "page.tsx");
  const card = source(
    "components",
    "campaigns",
    "campaign-game-room-card.tsx",
  );
  assert.doesNotMatch(overview, /CampaignVideoRoom/u);
  assert.match(overview, /CampaignGameRoomCard/u);
  assert.match(card, /href=\{`\/campaigns\/\$\{campaignId\}\/game-room`\}/u);
  assert.match(card, /\{campaignActive && \(/u);
  assert.doesNotMatch(card, /fetch\(|getUserMedia|createLiveKit/u);
});

test("Game Room requires explicit Join and preserves local-only media controls", () => {
  const room = source("components", "campaigns", "campaign-video-room.tsx");
  assert.match(room, /onClick=\{\(\) => void controllerRef\.current\?\.join\(\)\}/u);
  assert.match(room, /setCameraEnabled/u);
  assert.match(room, /setMicrophoneEnabled/u);
  assert.match(room, /enableSound/u);
  assert.match(room, /muted=\{participant\.isLocal\}/u);
  assert.match(room, /!participant\.isLocal && participant\.microphone/u);
  assert.match(room, /min-h-11/u);
  assert.doesNotMatch(room, /getUserMedia|setScreenShareEnabled|recording|transcription/u);
});

test("participant grid uses the full Game Room width for every supported room size", () => {
  assert.equal(getCampaignVideoGridClass(1), "grid-cols-1");
  for (const count of [2, 3, 4]) {
    assert.equal(
      getCampaignVideoGridClass(count),
      "grid-cols-1 sm:grid-cols-2",
    );
  }
  for (const count of [5, 6, 7]) {
    assert.equal(
      getCampaignVideoGridClass(count),
      "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
    );
  }
  const route = source(
    "app",
    "[locale]",
    "campaigns",
    "[id]",
    "game-room",
    "page.tsx",
  );
  assert.match(route, /max-w-\[1600px\]/u);
});

test("planned Game Room tools are visible, localized, and non-interactive", () => {
  const planned = source(
    "components",
    "campaigns",
    "campaign-game-room-planned-tools.tsx",
  );
  assert.match(planned, /<article/u);
  assert.doesNotMatch(planned, /<button|<a\s|\bLink\b|onClick|href=/u);

  const english = JSON.parse(source("messages", "en.json")) as Record<
    string,
    Record<string, unknown>
  >;
  const russian = JSON.parse(source("messages", "ru.json")) as Record<
    string,
    Record<string, unknown>
  >;
  assert.deepEqual(
    messageKeys(english.CampaignGameRoom).sort(),
    messageKeys(russian.CampaignGameRoom).sort(),
  );
  assert.deepEqual(
    messageKeys(english.CampaignVideoRoom).sort(),
    messageKeys(russian.CampaignVideoRoom).sort(),
  );
  assert.equal(english.CampaignGameRoom.planned instanceof Object, true);
  assert.equal(russian.CampaignGameRoom.planned instanceof Object, true);
});

test("completed campaigns remain visible but cannot start or link to an active room", () => {
  const card = source(
    "components",
    "campaigns",
    "campaign-game-room-card.tsx",
  );
  const room = source("components", "campaigns", "campaign-video-room.tsx");
  assert.match(card, /\{campaignActive && \(/u);
  assert.match(room, /campaignStatus === "active"/u);
  assert.match(room, /disabled=\{!canJoin\}/u);
  assert.match(room, /campaignStatus !== "active"/u);
});
