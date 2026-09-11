import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function source(...segments: string[]) {
  return readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

test("Campaign Dice stays inside Display and selects only the campaign system", () => {
  const page = source("app", "[locale]", "campaigns", "[id]", "game-room", "page.tsx");
  const workspace = source("components", "campaigns", "campaign-game-room-workspace.tsx");
  const roller = source("components", "campaigns", "campaign-dice-roller.tsx");

  assert.match(page, /campaignGameSystem=\{/u);
  assert.match(workspace, /activeTool === "dice"/u);
  assert.match(workspace, /<CampaignDiceRoller/u);
  assert.match(workspace, /onClick=\{openDice\}/u);
  assert.doesNotMatch(workspace, /type="button" disabled[^>]*>\s*\{translations\("tools\.dice"\)/u);
  assert.match(roller, /gameSystem === "vtm-v5"/u);
  assert.match(roller, /gameSystem === "call-of-cthulhu-7e"/u);
  assert.doesNotMatch(roller, /<select[^>]*gameSystem|setGameSystem/u);
});

test("Campaign Dice reuses personal roller UI through server executors", () => {
  const campaignRoller = source("components", "campaigns", "campaign-dice-roller.tsx");
  const vtmRoller = source("components", "games", "vtm-v5", "personal-dice-roller.tsx");
  const cocRoller = source("components", "games", "call-of-cthulhu-7e", "dice-roller.tsx");

  assert.match(campaignRoller, /<PersonalDiceRoller/u);
  assert.match(campaignRoller, /<CallOfCthulhu7eDiceRoller/u);
  assert.match(vtmRoller, /executeRoll\?: VtmV5DiceExecutor/u);
  assert.match(cocRoller, /executePercentileRoll\?: Coc7ePercentileDiceExecutor/u);
  assert.match(cocRoller, /executeOtherDiceRoll\?: Coc7eOtherDiceExecutor/u);
  assert.match(campaignRoller, /activeMode=\{cocMode\}/u);
  assert.match(cocRoller, /activeMode\?: Coc7eDiceMode/u);
  assert.match(cocRoller, /role="tablist"/u);
  assert.match(cocRoller, /compact && activeMode === undefined/u);
  assert.match(cocRoller, /const activeTab = activeMode \?\? internalActiveMode/u);
  assert.match(cocRoller, /hidden=\{compact && activeTab !== "percentile"\}/u);
  assert.doesNotMatch(campaignRoller, /rollVtmV5Dice|rollCoc7e/u);
  assert.doesNotMatch(campaignRoller, /PersonalRollHistory/u);
});

test("Game Room owns the CoC mode submenu while VtM remains direct", () => {
  const workspace = source(
    "components",
    "campaigns",
    "campaign-game-room-workspace.tsx",
  );
  const campaignRoller = source(
    "components",
    "campaigns",
    "campaign-dice-roller.tsx",
  );

  assert.match(
    workspace,
    /function openDice\(\)[\s\S]*?setCocDiceMode\("percentile"\)[\s\S]*?setActiveTool\("dice"\)/u,
  );
  assert.match(
    workspace,
    /activeTool === "dice" &&[\s\S]*?campaignGameSystem === "call-of-cthulhu-7e"/u,
  );
  assert.match(workspace, /data-game-room-coc-dice-tools/u);
  assert.match(
    workspace,
    /grid h-14 grid-cols-\[3rem_repeat\(2,minmax\(0,1fr\)\)\] gap-2/u,
  );
  assert.match(workspace, /\["percentile", "other"\] as const/u);
  assert.match(workspace, /onClick=\{\(\) => setCocDiceMode\(mode\)\}/u);
  assert.match(workspace, /mode === "percentile"[\s\S]*?"percentile\.title"[\s\S]*?"other\.title"/u);
  assert.match(
    campaignRoller,
    /supportedSystem === "vtm-v5" \? \([\s\S]*?<PersonalDiceRoller/u,
  );
  assert.doesNotMatch(campaignRoller, /vtmMode|setVtmMode|vtm-v5[\s\S]*role="tablist"/u);
});

test("campaign roll execution is server-authoritative and LiveKit-independent", () => {
  const server = source("lib", "campaign-dice", "server.ts");
  const route = source("app", "api", "campaigns", "[campaignId]", "dice", "route.ts");
  const migration = source("supabase", "migrations", "20260911120000_campaign_dice_journal.sql");
  const sessionBoundaryMigration = source(
    "supabase",
    "migrations",
    "20260911120001_bind_campaign_dice_to_expected_session.sql",
  );

  assert.match(server, /rollVtmV5Dice\(request\.request\)/u);
  assert.match(server, /rollCoc7ePercentileTest\(request\.request\)/u);
  assert.match(server, /rollCoc7eOtherDice\(request\.request\)/u);
  assert.match(server, /normalizeGameSystemId\(campaign\.game_system\)/u);
  assert.match(server, /from\("game_sessions"\)/u);
  assert.match(server, /record_campaign_dice_roll/u);
  assert.match(server, /target_game_session_id: activeSession\.id/u);
  assert.doesNotMatch(server + route, /LiveKit|video\/join/u);
  assert.match(migration, /for update/u);
  assert.match(migration, /grant execute[\s\S]*to service_role/u);
  assert.doesNotMatch(migration, /grant execute[^;]*to authenticated/u);
  assert.match(migration, /alter publication supabase_realtime/u);
  assert.match(sessionBoundaryMigration, /drop function public\.record_campaign_dice_roll\(uuid, uuid, text, jsonb, jsonb\)/u);
  assert.match(sessionBoundaryMigration, /where id = target_game_session_id[\s\S]*and campaign_id = target_campaign_id/u);
  assert.match(sessionBoundaryMigration, /grant execute[\s\S]*to service_role/u);
  assert.doesNotMatch(
    sessionBoundaryMigration,
    /grant execute[^;]*to authenticated/u,
  );
});

test("Journal appends stored engine output, auto-scrolls, and never switches tools", () => {
  const room = source("components", "campaigns", "campaign-game-room.tsx");
  const workspace = source("components", "campaigns", "campaign-game-room-workspace.tsx");
  const journalEvent = source("components", "campaigns", "campaign-dice-journal-event.tsx");

  assert.match(room, /event: "INSERT"/u);
  assert.match(room, /filter: `game_session_id=eq\.\$\{sessionId\}`/u);
  assert.match(room, /mergeJournalEvents\(current\.journal, \[event\]\)/u);
  assert.doesNotMatch(room, /LiveKit/u);
  assert.match(workspace, /scrollIntoView\(\{ block: "end" \}\)/u);
  assert.match(workspace, /activeTool === "journal"/u);
  assert.match(journalEvent, /result\.summaryKey/u);
  assert.match(journalEvent, /result\.outcome/u);
  assert.match(journalEvent, /text-red-300/u);
  assert.doesNotMatch(journalEvent, /rollVtm|rollCoc|evaluateVtm|evaluateCoc/u);
});
