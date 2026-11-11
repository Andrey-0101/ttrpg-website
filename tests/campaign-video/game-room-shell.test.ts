import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

import { CAMPAIGN_VIDEO_PARTICIPANT_SLOTS } from "../../lib/campaign-video/browser/presentation";
import { resolveCampaignVideoParticipantLabel } from "../../lib/campaign-video/participant-label";
import "./campaign-role.test";

function source(...segments: string[]) {
  return readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

test("the canonical directory returns the same raw names to every viewer through the narrow RPC", async () => {
  const exports: { loadCampaignParticipantDirectory?: (options: unknown) => Promise<{
    ready: boolean; participantDirectory: Record<string, unknown>[];
    characterNamesByUserId: ReadonlyMap<string, string>;
  }> } = {};
  runInNewContext(transpileModule(source("lib", "campaign-video", "participant-directory.server.ts"), {
    compilerOptions: { module: ModuleKind.CommonJS },
  }).outputText, {
    exports,
    require(name: string) {
      if (name === "server-only") return {};
      if (name === "./mapping") return { deriveCampaignVideoParticipantIdentity: (_campaign: string, user: string) => `identity-${user}` };
      assert.fail(`Unexpected directory dependency: ${name}`);
    },
  });
  let rpcError: unknown = null;
  let rpcCalls = 0;
  let assignments = [{ participant_id: "alice", character_name: "Иван Петров" }];
  const supabase = {
    from(table: string) {
      assert.ok(table === "campaign_members" || table === "profiles", "never read full characters for labels");
      const query = {
        select(columns: string) {
          assert.equal(columns, table === "profiles" ? "id, display_name, username" : "user_id, joined_at, display_order");
          return query;
        },
        eq(column: string, value: string) { assert.equal(column, "campaign_id"); assert.equal(value, "campaign"); return query; },
        order() { return query; },
        in(column: string, ids: string[]) { assert.equal(column, "id"); assert.equal(ids.join(","), "gm,alice,bob"); return query; },
        then(resolve: (value: unknown) => void) { resolve({ error: null, data: table === "profiles" ? [
          { id: "gm", display_name: "Andrey", username: "ignore-gm" },
          { id: "alice", display_name: null, username: "not-a-label-fallback" },
          { id: "bob", display_name: "Bob", username: "ignore-bob" },
        ] : [
          { user_id: "alice", joined_at: "1", display_order: 1 },
          { user_id: "bob", joined_at: "2", display_order: 2 },
        ] }); },
      };
      return query;
    },
    async rpc(name: string, args: { target_campaign_id: string }) {
      rpcCalls += 1;
      assert.equal(name, "get_campaign_video_character_names"); assert.equal(args.target_campaign_id, "campaign");
      return { data: rpcError ? null : assignments, error: rpcError };
    },
  };
  const load = (currentUserId: string) => exports.loadCampaignParticipantDirectory!({
    supabase, currentUserId, campaignId: "campaign", gameMasterId: "gm", campaignGameSystem: "vtm-v5",
    labels: { you: "You", gameMasterRole: "GM", gameMasterFallback: "GM", playerFallback: "Player" },
  });
  const gm = await load("gm");
  const player = await load("alice");
  assert.equal(gm.ready, true);
  assert.equal(player.ready, true);
  const names = (directory: Record<string, unknown>[]) => JSON.stringify(directory.map((entry) =>
    [entry.providerIdentity, entry.profileName, entry.characterName, entry.role, entry.playerPosition]));
  assert.equal(names(gm.participantDirectory), names(player.participantDirectory));
  assert.equal(player.participantDirectory[1].profileName, null, "username is never a substitute");
  assert.equal(player.participantDirectory[1].characterName, "Иван Петров");
  assert.equal(player.participantDirectory[2].characterName, null);
  assert.equal(player.characterNamesByUserId.get("alice"), "Иван Петров");
  assert.equal(player.characterNamesByUserId.has("bob"), false);
  assert.deepEqual(Object.keys(player.participantDirectory[1]).sort(), ["characterName", "isCurrentUser", "playerPosition", "profileName", "providerIdentity", "role"]);
  assignments = [{ participant_id: "bob", character_name: "Mary Shelley" }];
  const refreshed = await load("alice");
  assert.equal(refreshed.characterNamesByUserId.has("alice"), false);
  assert.equal(refreshed.characterNamesByUserId.get("bob"), "Mary Shelley");
  assert.equal(refreshed.participantDirectory[2].characterName, "Mary Shelley");
  assert.equal(rpcCalls, 3, "one authorized names lookup per load");
  rpcError = { message: "unavailable" };
  assert.equal((await load("alice")).ready, false, "a failed lookup is not mistaken for an absent name");
});

test("directory changes update video in place with RLS-scoped Realtime invalidation", () => {
  const room = source("components", "campaigns", "campaign-video-room.tsx");
  const key = room.slice(room.indexOf("const instanceKey"));
  const construction = room.slice(room.indexOf("const controller = createCampaignVideoRoomController"), room.indexOf("controllerRef.current?.updateParticipantDirectory"));
  assert.doesNotMatch(key, /participantDirectory|directoryReady/u);
  assert.doesNotMatch(construction.slice(construction.indexOf("}, [")), /participantDirectory|directoryReady/u);
  assert.match(room, /updateParticipantDirectory\(directory\.participantDirectory, directory\.directoryReady\)/u);
  assert.match(room, /campaign_membership_signals/u);
  assert.match(room, /campaign_id=eq\.\$\{campaignId\}/u);
  assert.match(room, /status === "SUBSCRIBED"/u);
  assert.match(room, /sync\.dispose\(\)/u);
  assert.doesNotMatch(room, /router\.refresh|location\.reload|setInterval/u);
  const endpoint = source("app", "api", "campaigns", "[campaignId]", "participant-directory", "route.ts");
  assert.match(endpoint, /getClaims\(\)/u);
  assert.match(endpoint, /if \(!campaign\)/u);
  assert.match(endpoint, /loadCampaignParticipantDirectory/u);
  assert.match(endpoint, /Cache-Control.*no-store/u);
  assert.doesNotMatch(endpoint, /service_role|SECRET_KEY|members:|profiles:/u);
});

test("directory GET authorizes before the canonical loader and returns only safe raw entries", async () => {
  const route = source("app", "api", "campaigns", "[campaignId]", "participant-directory", "route.ts");
  const code = transpileModule(route, { compilerOptions: { module: ModuleKind.CommonJS } }).outputText;
  const campaignId = "a1000000-0000-4000-8000-000000000001";
  for (const scenario of ["anonymous", "outsider", "removed", "member", "gm", "load-failure"]) {
    let loads = 0;
    const safeEntry = { providerIdentity: "scoped-identity", profileName: "Игрок кампании", characterName: null, role: "player", playerPosition: 2, isCurrentUser: true };
    const exports: { GET?: (request: Request, context: unknown) => Promise<Response> } = {};
    runInNewContext(code, {
      exports, Request, Response, URL, console: { error: () => undefined },
      require(name: string) {
        if (name === "next-intl") return { hasLocale: (locales: string[], locale: string) => locales.includes(locale) };
        if (name === "next-intl/server") return { getTranslations: async ({ locale }: { locale: string }) => {
          assert.equal(locale, "ru"); return () => "Игрок кампании";
        } };
        if (name === "@/i18n/routing") return { routing: { locales: ["en", "ru"], defaultLocale: "en" } };
        if (name === "@/lib/campaign-video/contracts") return { parseCampaignId: (value: string) => value === campaignId ? value : null };
        if (name === "@/utils/supabase/server") return { createClient: async () => ({
          auth: { getClaims: async () => ({ data: { claims: { sub: scenario === "anonymous" ? undefined : "caller" } }, error: null }) },
          from(table: string) {
            assert.equal(table, "campaigns");
            return { select: () => ({ eq: (column: string, id: string) => {
              assert.equal(column, "id"); assert.equal(id, campaignId);
              return { maybeSingle: async () => ({ error: null, data:
                ["outsider", "removed"].includes(scenario) ? null : { id: campaignId, game_system: "coc_7e", game_master_id: "gm" } }) };
            } }) };
          },
        }) };
        if (name === "@/lib/campaign-video/participant-directory.server") return { loadCampaignParticipantDirectory: async (options: { currentUserId: string; labels: { playerFallback: string } }) => {
          loads += 1; assert.equal(options.currentUserId, "caller");
          assert.equal(options.labels.playerFallback, "Игрок кампании");
          return { ready: scenario !== "load-failure", participantDirectory: [safeEntry], members: ["internal"], profiles: ["private"] };
        } };
        assert.fail(`Unexpected route dependency: ${name}`);
      },
    });
    const response = await exports.GET!(new Request(`http://test.invalid/api/campaigns/${campaignId}/participant-directory?locale=ru`), { params: Promise.resolve({ campaignId }) });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.status, scenario === "anonymous" ? 401 : ["outsider", "removed"].includes(scenario) ? 404 : scenario === "load-failure" ? 503 : 200);
    assert.equal(loads, ["anonymous", "outsider", "removed"].includes(scenario) ? 0 : 1);
    const result = await response.json();
    if (response.ok) assert.deepEqual(result, { ok: true, participantDirectory: [safeEntry] });
    else assert.deepEqual(result, { ok: false });
  }
});

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
  assert.doesNotMatch(overview, /import CampaignVideoRoom|<CampaignVideoRoom/u);
  assert.match(overview, /CampaignGameRoomCard/u);
  assert.match(card, /href=\{`\/campaigns\/\$\{campaignId\}\/game-room`\}/u);
  assert.match(card, /\{campaignActive && \(/u);
  assert.doesNotMatch(card, /fetch\(|getUserMedia|createLiveKit/u);
});

test("Game Room route mounts the room owner without starting session or video", () => {
  const route = source(
    "app",
    "[locale]",
    "campaigns",
    "[id]",
    "game-room",
    "page.tsx",
  );
  assert.match(route, /import CampaignGameRoom/u);
  assert.match(route, /<CampaignGameRoom/u);
  assert.doesNotMatch(route, /start_game_session|renew_game_session_presence|video\/join/u);
});

test("Game Room requires explicit Join and keeps interactive controls local-only", () => {
  const room = source("components", "campaigns", "campaign-video-room.tsx");
  const participantCard = room.slice(
    room.indexOf("function ParticipantCard"),
    room.indexOf("function phaseMessage"),
  );
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
  assert.match(room, /createPortal/u);
  assert.match(room, /data-game-room-leave/u);
  assert.match(room, /absolute bottom-2 left-2/u);
  assert.match(room, /data-control-circle/u);
  assert.match(room, /h-11 w-11/u);
  assert.match(room, /h-9 w-9/u);
  assert.match(room, /h-5 w-5/u);
  assert.doesNotMatch(participantCard, /onLeave|translations\("leave"\)/u);
  assert.doesNotMatch(participantCard, /bg-gradient-to-b|bg-gradient-to-t|via-black\/90/u);
  assert.doesNotMatch(participantCard, /youSuffix|title=\{statusMessage\}/u);
  assert.doesNotMatch(room, /getUserMedia|setScreenShareEnabled|recording|transcription/u);
});

for (const locale of ["en", "ru"]) {
  test(`participant labels use raw names and viewer-local fallbacks (${locale})`, () => {
    const messages = JSON.parse(source("messages", locale + ".json")).CampaignVideoRoom;
    const labels = { ...messages.labels, gameMasterRole: messages.roles.gameMaster };
    const missing = [null, "", "   ", "\t\n"];
    const profileFallback = locale === "ru" ? "Инкогнито" : "Incognito";
    const characterFallback = locale === "ru" ? "Странный незнакомец" : "Strange stranger";
    const gameMasterRole = locale === "ru" ? "Мастер игры" : "Game Master";
    for (const profileName of [...missing, "Andrey"]) {
      for (const characterName of [...missing, "Иван John"]) {
        const profile = profileName?.trim() || profileFallback;
        assert.equal(resolveCampaignVideoParticipantLabel({ role: "player", profileName, characterName, labels }),
          profile + " aka " + (characterName?.trim() || characterFallback));
        assert.equal(resolveCampaignVideoParticipantLabel({ role: "game_master", profileName, characterName, labels }),
          profile + " aka " + gameMasterRole);
      }
    }
  });
}

test("locale changes preserve names while replacing missing values and GM role", () => {
  const en = JSON.parse(source("messages", "en.json")).CampaignVideoRoom;
  const ru = JSON.parse(source("messages", "ru.json")).CampaignVideoRoom;
  const raw = { role: "player" as const, profileName: "Andrey", characterName: null };
  assert.equal(resolveCampaignVideoParticipantLabel({ ...raw, labels: { ...en.labels, gameMasterRole: en.roles.gameMaster } }), "Andrey aka Strange stranger");
  assert.equal(resolveCampaignVideoParticipantLabel({ ...raw, labels: { ...ru.labels, gameMasterRole: ru.roles.gameMaster } }), "Andrey aka Странный незнакомец");
  assert.equal(raw.characterName, null);
  const room = source("components", "campaigns", "campaign-video-room.tsx");
  assert.match(room, /profileName: slot.directoryEntry.profileName/u);
  assert.match(room, /characterName: slot.directoryEntry.characterName/u);
  assert.match(room, /translations\("labels.profileFallback"\)/u);
  assert.doesNotMatch(room.slice(room.indexOf("const displayName"), room.indexOf("const connected", room.indexOf("const displayName"))), /username|email/u);
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
  assert.match(styles, /\.game-room-slot \{[\s\S]*container-type: size/u);
  assert.match(styles, /width: min\(100cqw, 177\.777778cqh, 68rem\)/u);
  assert.match(styles, /\.game-room-participant \{[\s\S]*height: auto/u);
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

test("Game Room loads the GM Gallery through the same ordered server loader as the main Gallery", () => {
  const route = source(
    "app",
    "[locale]",
    "campaigns",
    "[id]",
    "game-room",
    "page.tsx",
  );
  const galleryRoute = source(
    "app",
    "[locale]",
    "campaigns",
    "[id]",
    "gallery",
    "page.tsx",
  );
  const loader = source("lib", "campaign-handouts", "gallery.server.ts");

  assert.match(route, /const isGameMaster = campaign\.game_master_id === userId/u);
  assert.match(
    route,
    /isGameMaster\s*\? loadCampaignGalleryImages\([\s\S]*?: Promise\.resolve\(\{ images: \[\], loadError: false \}/u,
  );
  assert.match(route, /isCampaignGalleryCategory\(image\.category\)/u);
  assert.match(route, /imageId: image\.id/u);
  assert.match(route, /localSignedUrl: image\.signedUrl/u);
  assert.match(galleryRoute, /loadCampaignGalleryImages/u);
  assert.match(loader, /\.from\("campaign_images"\)/u);
  assert.match(loader, /\.eq\("campaign_id", campaignId\)/u);
  assert.match(loader, /\.order\("created_at", \{ ascending: false \}\)/u);
  assert.match(loader, /CAMPAIGN_HANDOUT_SIGNED_URL_TTL/u);
});

test("Game Room workspace preserves the role-specific tool shell", () => {
  const workspace = source(
    "components",
    "campaigns",
    "campaign-game-room-workspace.tsx",
  );

  assert.match(workspace, /data-game-room-tool-navigation/u);
  assert.match(
    workspace,
    /activeTool === "journal"[\s\S]*?"grid-cols-5"[\s\S]*?"grid-cols-\[2rem_repeat\(5,minmax\(0,1fr\)\)\]"/u,
  );
  assert.match(workspace, /disabled=\{!isGameMaster\}/u);
  assert.match(workspace, /translations\("tools\.journal"\)/u);
  assert.match(workspace, /translations\("tools\.gallery"\)/u);
  assert.match(workspace, /translations\("tools\.dice"\)/u);
  assert.match(workspace, /translations\("tools\.characters"\)/u);
  assert.match(workspace, /data-game-room-gallery-tools/u);
  assert.match(workspace, /CAMPAIGN_GALLERY_CATEGORIES\.map/u);
  assert.match(workspace, /aria-pressed=\{active\}/u);
  assert.match(
    workspace,
    /border-amber-200 bg-amber-100 text-amber-950 shadow-sm/u,
  );
  assert.doesNotMatch(
    workspace,
    /upload|rename|visibility|recipient|createLiveKit|data message|\.delete\(|createClient/u,
  );
});

test("Game Room Gallery list and local image follow the approved interactions", () => {
  const workspace = source(
    "components",
    "campaigns",
    "campaign-game-room-workspace.tsx",
  );

  assert.match(workspace, /data-game-room-gallery-list/u);
  assert.match(workspace, /overflow-y-auto/u);
  assert.match(workspace, /grid grid-cols-1 gap-2 sm:grid-cols-3/u);
  assert.match(workspace, /src=\{item\.localSignedUrl\}/u);
  assert.match(workspace, /onDoubleClick=\{\(\) => openImage\(item\)\}/u);
  assert.match(workspace, /event\.pointerType === "touch"/u);
  assert.match(workspace, /event\.key !== "Enter" && event\.key !== " "/u);
  assert.match(workspace, /data-game-room-local-image/u);
  assert.match(workspace, /data-game-room-shared-image/u);
  assert.match(workspace, /className="object-contain"/u);
  assert.match(workspace, /data-game-room-image-tools/u);
  assert.match(workspace, /isPresenting \? "tools\.stopShare" : "tools\.share"/u);
  assert.match(workspace, /onShareImage\(selectedImage\.imageId\)/u);
  assert.match(workspace, /isPresenting && !\(await onStopShare\(\)\)/u);
  assert.match(workspace, /onSetPresentationExpanded\(!presentationExpanded\)/u);
  assert.match(workspace, /!connected \|\| !isPresenting \|\| presentationBusy/u);
  assert.match(workspace, /presentationExpanded \? "tools\.collapse" : "tools\.expand"/u);
  assert.match(workspace, /aria-pressed=\{presentationExpanded\}/u);
});

test("expanded presentation uses one synchronized state and the approved responsive composition", () => {
  const room = source("components", "campaigns", "campaign-video-room.tsx");
  const workspace = source(
    "components",
    "campaigns",
    "campaign-game-room-workspace.tsx",
  );
  const controller = source("lib", "campaign-video", "browser", "controller.ts");
  const protocol = source("lib", "campaign-video", "presentation.ts");
  const styles = source("app", "globals.css");
  const tabletMediaStart = styles.indexOf(
    "@media (min-width: 48rem) and (max-width: 74.999rem)",
  );
  const desktopMediaStart = styles.indexOf(
    "@media (min-width: 75rem) and (min-height: 43.75rem)",
  );

  assert.notEqual(tabletMediaStart, -1);
  assert.notEqual(desktopMediaStart, -1);

  const mobileStyles = styles.slice(0, tabletMediaStart);
  const tabletStyles = styles.slice(tabletMediaStart, desktopMediaStart);
  const desktopStyles = styles.slice(desktopMediaStart);

  assert.match(room, /data-presentation-expanded=/u);
  assert.match(room, /snapshot\.presentationExpanded/u);
  assert.match(workspace, /data-game-room-expanded-presentation/u);
  assert.match(workspace, /className="object-contain"/u);
  assert.match(
    workspace,
    /async function closeSelectedImage\(\)[\s\S]*?await onStopShare\(\)[\s\S]*?setSelectedImageId\(null\)/u,
  );
  assert.match(controller, /setPresentationExpanded/u);
  assert.match(controller, /message\.revision <= lastReceivedPresentationRevision/u);
  assert.match(controller, /expanded: snapshot\.presentationExpanded/u);
  assert.match(protocol, /action: "show";[\s\S]*expanded: boolean;[\s\S]*revision: number/u);
  assert.doesNotMatch(protocol, /action: "expand"|action: "collapse"/u);

  assert.match(styles, /"gm expanded player-1"/u);
  assert.match(styles, /"display expanded player-2"/u);
  assert.match(styles, /"display expanded player-3"/u);
  assert.match(styles, /"display expanded player-4"/u);
  assert.match(styles, /"tools expanded player-5"/u);
  assert.match(styles, /"tools expanded player-6"/u);
  assert.match(styles, /grid-template-rows: repeat\(6, var\(--game-room-expanded-row-height\)\)/u);
  assert.match(styles, /\.game-room-grid\[data-presentation-expanded="true"\] \.game-room-participant \{\s*width: 100%;\s*height: 100%;/u);
  assert.match(mobileStyles, /\.game-room-grid\[data-presentation-expanded="true"\][\s\S]*?\.game-room-slot,[\s\S]*?\.game-room-display \{\s*display: none;/u);
  assert.match(tabletStyles, /\.game-room-grid\[data-presentation-expanded="true"\] \.game-room-slot \{\s*display: grid;/u);
  assert.match(desktopStyles, /\.game-room-grid\[data-presentation-expanded="true"\] \.game-room-slot \{\s*display: grid;/u);
  assert.match(styles, /\.game-room-grid\[data-presentation-expanded="true"\] \[data-game-tools-panel\] \{\s*grid-row: 2;/u);
  assert.match(styles, /\.game-room-grid\[data-presentation-expanded="true"\][\s\S]*?\[data-game-room-image-tools\] \{\s*grid-template-columns: repeat\(2/u);
});

test("Game Room sharing uses the trusted Gallery signing policy behind a GM-authorized server packet", () => {
  const controller = source("lib", "campaign-video", "browser", "controller.ts");
  const handler = source("lib", "campaign-video", "presentation-handler.ts");
  const galleryLoader = source("lib", "campaign-handouts", "gallery.server.ts");
  const dataSource = source(
    "lib",
    "campaign-video",
    "supabase-data-source.server.ts",
  );
  const provider = source(
    "lib",
    "campaign-video",
    "providers",
    "livekit-presentation.ts",
  );

  assert.match(controller, /video\/presentation/u);
  assert.match(controller, /JSON\.stringify\(command\)/u);
  assert.doesNotMatch(controller, /CAMPAIGN_HANDOUT_SIGNED_URL_TTL/u);
  assert.doesNotMatch(controller, /setInterval/u);
  assert.match(handler, /authorization\.participant\.role !== "game_master"/u);
  assert.match(handler, /destinationIdentity/u);
  assert.match(provider, /DataPacket_Kind\.RELIABLE/u);
  assert.match(dataSource, /createCampaignGallerySignedUrl/u);
  assert.match(
    galleryLoader,
    /createCampaignGallerySignedUrl[\s\S]*?CAMPAIGN_HANDOUT_SIGNED_URL_TTL/u,
  );
  assert.match(dataSource, /\.eq\("campaign_id", campaignId\)[\s\S]*?\.eq\("id", imageId\)/u);
  assert.doesNotMatch(
    dataSource.match(/async findCampaignImageStoragePath[\s\S]*?\n  \}/u)?.[0] ?? "",
    /visibility/u,
  );
});

test("Game Room workspace messages are localized with the required empty copy", () => {
  const english = JSON.parse(source("messages", "en.json")) as Record<
    string,
    Record<string, unknown>
  >;
  const russian = JSON.parse(source("messages", "ru.json")) as Record<
    string,
    Record<string, unknown>
  >;
  const englishGallery = english.CampaignGameRoom.gallery as Record<
    string,
    unknown
  >;
  const russianGallery = russian.CampaignGameRoom.gallery as Record<
    string,
    unknown
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
  assert.equal(englishGallery.emptyCategory, "No images in this category");
  assert.equal(
    (english.CampaignGameRoom.tools as Record<string, unknown>).stopShare,
    "Stop Share",
  );
  assert.equal(
    (english.CampaignGameRoom.tools as Record<string, unknown>).collapse,
    "Collapse",
  );
  assert.equal(
    russianGallery.emptyCategory,
    "В этой категории нет изображений",
  );
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
  assert.match(compactHeader, /data-game-room-header-actions/u);
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
