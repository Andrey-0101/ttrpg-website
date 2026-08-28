import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { CAMPAIGN_VIDEO_PARTICIPANT_SLOTS } from "../../lib/campaign-video/browser/presentation";

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
  const card = source("components", "campaigns", "campaign-game-room-card.tsx");
  assert.doesNotMatch(overview, /CampaignVideoRoom/u);
  assert.match(overview, /CampaignGameRoomCard/u);
  assert.match(card, /href=\{`\/campaigns\/\$\{campaignId\}\/game-room`\}/u);
  assert.match(card, /\{campaignActive && \(/u);
  assert.doesNotMatch(card, /fetch\(|getUserMedia|createLiveKit/u);
});

test("Game Room requires explicit Join and keeps interactive controls local-only", () => {
  const room = source("components", "campaigns", "campaign-video-room.tsx");
  assert.match(room, /onJoin=\{\(\) => void controllerRef\.current\?\.join\(\)\}/u);
  assert.match(room, /setCameraEnabled/u);
  assert.match(room, /setMicrophoneEnabled/u);
  assert.match(room, /enableSound/u);
  assert.match(room, /muted=\{slot\.isCurrentUser\}/u);
  assert.match(room, /!slot\.isCurrentUser && participant\?\.microphone/u);
  assert.match(room, /slot\.isCurrentUser \? \(/u);
  assert.match(room, /<MediaIndicator/u);
  assert.match(room, /aria-pressed=\{snapshot\.cameraEnabled\}/u);
  assert.match(room, /aria-pressed=\{snapshot\.microphoneEnabled\}/u);
  assert.match(room, /min-h-11/u);
  assert.doesNotMatch(room, /getUserMedia|setScreenShareEnabled|recording|transcription/u);
});

test("Game Room uses the approved viewport-driven asymmetric composition", () => {
  assert.deepEqual(
    CAMPAIGN_VIDEO_PARTICIPANT_SLOTS.map((slot) => slot.key),
    ["gm", "player-1", "player-2", "player-3", "player-4", "player-5", "player-6"],
  );
  const route = source(
    "app",
    "[locale]",
    "campaigns",
    "[id]",
    "game-room",
    "page.tsx",
  );
  const room = source("components", "campaigns", "campaign-video-room.tsx");
  const styles = source("app", "globals.css");
  assert.match(route, /className="campaign-game-room"/u);
  assert.match(room, /aspect-video/u);
  assert.match(styles, /grid-template-columns: minmax\(0, 1\.5fr\) repeat\(2, minmax\(0, 1fr\)\)/u);
  assert.match(styles, /"gm player-1 player-2"/u);
  assert.match(styles, /"workspace player-3 player-4"/u);
  assert.match(styles, /"workspace player-5 player-6"/u);
  assert.match(styles, /height: calc\(100dvh - 5rem\)/u);
  assert.match(styles, /grid-template-rows: repeat\(3, minmax\(0, 1fr\)\)/u);
  assert.match(styles, /\.game-room-grid \{[\s\S]*height: 100%/u);
  assert.match(styles, /--game-room-gap: clamp\(/u);
  assert.match(styles, /max-width: 240rem/u);
  assert.match(styles, /max-width: min\(100%, 68rem\)/u);
  assert.match(styles, /\.game-room-participant \{[\s\S]*height: 100%/u);
  assert.match(styles, /\.game-room-slot-gm \{\s*grid-area: gm;\s*\}/u);
  assert.doesNotMatch(styles, /\.campaign-game-room \{[\s\S]{0,120}overflow: hidden/u);
  assert.doesNotMatch(styles, /transform:\s*scale\(/u);
  assert.doesNotMatch(room, /ResizeObserver|addEventListener\(["']resize/u);
  assert.match(styles, /@media \(min-width: 48rem\) and \(max-width: 74\.999rem\)/u);
  assert.match(styles, /@media \(min-width: 75rem\) and \(min-height: 43\.75rem\)/u);
  assert.match(room, /min-h-11/u);
  assert.match(room, /object-cover/u);
});

test("LiveKit keeps adaptive subscriptions and 720p simulcast publication", () => {
  const liveKit = source("lib", "campaign-video", "browser", "livekit.ts");
  const packageJson = JSON.parse(source("package.json")) as {
    dependencies: Record<string, string>;
  };

  assert.equal(packageJson.dependencies["livekit-client"], "2.21.0");
  assert.match(liveKit, /adaptiveStream:\s*true/u);
  assert.match(liveKit, /dynacast:\s*true/u);
  assert.match(liveKit, /videoCaptureDefaults:[\s\S]*width:\s*1280[\s\S]*height:\s*720/u);
  assert.match(liveKit, /setCameraEnabled\(enabled,[\s\S]*width:\s*1280[\s\S]*height:\s*720/u);
  assert.doesNotMatch(liveKit, /simulcast:\s*false/u);
});

test("planned display and compact tools panel are localized and non-interactive", () => {
  const planned = source(
    "components",
    "campaigns",
    "campaign-game-room-planned-tools.tsx",
  );
  assert.match(planned, /data-handout-display/u);
  assert.match(planned, /data-game-tools-panel/u);
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
  assert.equal(english.CampaignGameRoom.workspace instanceof Object, true);
  assert.equal(russian.CampaignGameRoom.workspace instanceof Object, true);
});

test("Game Room uses a compact header slot while the default site header stays intact", () => {
  const localeLayout = source("app", "[locale]", "layout.tsx");
  const compactHeader = source(
    "components",
    "campaigns",
    "campaign-game-room-header.tsx",
  );
  const regularHeader = source("components", "site-header.tsx");
  const headerSlot = source(
    "app",
    "[locale]",
    "@header",
    "campaigns",
    "[id]",
    "game-room",
    "page.tsx",
  );
  assert.match(localeLayout, /header: React\.ReactNode/u);
  assert.match(localeLayout, /\{header\}/u);
  assert.match(headerSlot, /CampaignGameRoomHeader/u);
  assert.match(compactHeader, /TTRPG Hub/u);
  assert.match(compactHeader, /AccountArea/u);
  assert.match(compactHeader, /LanguageSwitcher/u);
  assert.doesNotMatch(compactHeader, /navigation\("games"\)|navigation\("dashboard"\)/u);
  assert.match(regularHeader, /navigation\("games"\)/u);
  assert.match(regularHeader, /navigation\("dashboard"\)/u);
});

test("completed campaigns remain visible but cannot start or link to an active room", () => {
  const card = source("components", "campaigns", "campaign-game-room-card.tsx");
  const room = source("components", "campaigns", "campaign-video-room.tsx");
  assert.match(card, /\{campaignActive && \(/u);
  assert.match(room, /campaignStatus === "active"/u);
  assert.match(room, /disabled=\{!canJoin\}/u);
  assert.match(room, /campaignStatus !== "active"/u);
});
