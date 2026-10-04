import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildGameRoomCharacterRows, campaignCharacterErrorKey } from "../../lib/campaign-characters/contracts";
import { readVtmV5EditorDraft, writeVtmV5EditorDraft } from "../../lib/characters/vtm-v5/editor-draft";
import { readCoc7eEditorDraft, writeCoc7eEditorDraft } from "../../lib/characters/call-of-cthulhu-7e/editor-draft";
import { createDefaultVtmV5SheetData } from "../../lib/characters/vtm-v5/schema";
import { createDefaultCoc7eSheetData } from "../../lib/characters/call-of-cthulhu-7e/schema";

const source = (file: string) => readFileSync(file, "utf8");
const members = [
  { userId: "bob", displayName: "Bob", username: null },
  { userId: "alice", displayName: "Alice", username: null },
  { userId: "chris", displayName: null, username: "Chris" },
  { userId: "gm", displayName: "GM", username: null },
];
const assignments = [
  { campaign_id: "campaign", linked_by: "alice", character_id: "alice-character", unlinked_at: null },
  { campaign_id: "campaign", linked_by: "chris", character_id: "chris-character", unlinked_at: null },
];
const characters = [
  { id: "alice-character", name: "Margaret", owner_id: "alice", game_system: "vtm-v5" },
  { id: "chris-character", name: "Thomas", owner_id: "chris", game_system: "vtm-v5" },
];
function rows(currentUserId = "alice", overrides: Partial<Parameters<typeof buildGameRoomCharacterRows>[0]> = {}) {
  return buildGameRoomCharacterRows({ campaignId: "campaign", gameSystem: "vtm-v5", gameMasterId: "gm", currentUserId, members, assignments, characters, ...overrides });
}

test("Characters uses directory ordering, includes every player and excludes GM", () => {
  const result = rows();
  assert.deepEqual(result.map((row) => row.playerId), ["bob", "alice", "chris"]);
  assert.deepEqual(result.map((row) => row.playerName), ["Bob", "Alice", "Chris"]);
  assert.deepEqual(result.map((row) => row.characterName), [null, "Margaret", "Thomas"]);
  assert.doesNotMatch(source("lib/campaign-characters/contracts.ts"), /\.sort\(/u);
  assert.match(source("lib/campaign-characters/server.ts"), /members: directory\.members/u);
});

test("player can open only their linked character, including an inactive own empty row", () => {
  assert.deepEqual(rows().map((row) => row.canOpen), [false, true, false]);
  assert.deepEqual(rows("bob").map((row) => row.canOpen), [false, false, false]);
});

test("GM may open every linked player sheet but not empty rows", () => {
  assert.deepEqual(rows("gm").map((row) => row.canOpen), [false, true, true]);
});

test("unlinked, wrong campaign, incompatible and wrong-owner relationships fail closed", () => {
  for (const assignment of [
    { ...assignments[0], unlinked_at: "ended" },
    { ...assignments[0], campaign_id: "other" },
  ]) assert.equal(rows("alice", { assignments: [assignment] })[1].characterId, null);
  for (const character of [
    { ...characters[0], game_system: "call-of-cthulhu-7e" },
    { ...characters[0], owner_id: "chris" },
  ]) assert.equal(rows("alice", { characters: [character] })[1].characterId, null);
});

test("no unrelated owned-character fallback or legacy duplicate selection", () => {
  assert.equal(rows("alice", { assignments: [] })[1].characterId, null);
  assert.equal(rows("alice", { assignments: [assignments[0], assignments[0]] })[1].characterId, null);
});

test("CoC and VtM resolve only their campaign system through the same relationship", () => {
  assert.equal(rows()[1].characterName, "Margaret");
  assert.equal(rows("alice", { gameSystem: "call-of-cthulhu-7e", characters: [{ ...characters[0], game_system: "call-of-cthulhu-7e" }] })[1].characterName, "Margaret");
});

test("ordinary sheet GET checks membership and resolves a player assignment, never a supplied sheet id", () => {
  const server = source("lib/campaign-characters/server.ts");
  assert.match(server, /auth\.getClaims\(\)/u);
  assert.match(server, /!isGameMaster && !directory\.members\.some/u);
  assert.match(server, /if \(!row\?\.canOpen \|\| !row\.characterId/u);
  assert.match(server, /\.eq\("owner_id", playerId\)/u);
  assert.match(server, /\.eq\("game_system", campaign\.game_system\)/u);
  assert.doesNotMatch(server, /visibility/u);
  assert.match(server, /readOnly: character\.owner_id !== currentUserId/u);
  assert.match(server, /\.eq\("campaign_id", campaignId\)\.eq\("linked_by", playerId\)/u);
  assert.doesNotMatch(server, /service_role|SECRET_KEY|\.update\(|\.insert\(/u);
});

test("same editable/read-only CharacterEditor mounts inside Display with internal back navigation", () => {
  const workspace = source("components/campaigns/campaign-game-room-workspace.tsx");
  assert.match(workspace, /onClick=\{\(\) => setActiveTool\("characters"\)\}/u);
  assert.match(workspace, /data-game-room-character-sheet/u);
  assert.match(workspace, /<CharacterEditor[\s\S]*?embedded[\s\S]*?readOnly=\{openedCharacter\.readOnly\}/u);
  assert.match(workspace, /data-game-room-character-tools/u);
  assert.match(workspace, /requestUnsavedChangesNavigation\(\)\) setOpenedCharacter\(null\)/u);
  assert.match(workspace, /openedCharacter\.character\.name/u);
  assert.match(workspace, /grid h-14 grid-cols-\[3rem_minmax\(0,1fr\)\]/u);
  assert.doesNotMatch(workspace, /router\.push|href=.*characters/u);
});

test("embedded editor preserves normal Save, portrait, drafts, both full sheets and Enter semantics", () => {
  const editor = source("components/characters/character-editor.tsx");
  assert.match(editor, /embedded = false/u);
  assert.match(editor, /embedded \? styles\.embedded : ""/u);
  assert.match(editor, /if \(readOnly \|\| saveLockRef\.current\)/u);
  assert.match(editor, /\.from\("characters"\)[\s\S]*?\.update\(/u);
  for (const expected of ["<VtmCharacterSheet", "<Coc7eCharacterSheet", "onPortraitFileChange={handlePortraitFileChange}", "writeCoc7eEditorDraft", "writeVtmV5EditorDraft", "shouldPreventImplicitCharacterSave"]) assert.ok(editor.includes(expected));
  assert.match(editor, /onSavedName\?\.\(name\)/u);
  assert.match(editor, /disabled=\{readOnly \|\| !isEditing \|\| saving\}/u);
  assert.doesNotMatch(editor, /[Vv]isibility/u);
});

test("character data loads only on ordinary open and no new Realtime, polling or assignment controls", () => {
  const list = source("components/campaigns/game-room-characters-list.tsx");
  for (const file of [list, source("lib/campaign-characters/server.ts"), source("lib/campaign-characters/contracts.ts")]) assert.doesNotMatch(file, /setInterval|setTimeout|postgres_changes|\.channel\(/u);
  assert.match(list, /cache: "no-store"/u);
  assert.match(list, /row\.canOpen \?/u);
  assert.doesNotMatch(list, /<Image|<Link|router|handleLink|handleUnlink|portrait|game_system|visibility/u);
  assert.doesNotMatch(source("supabase/migrations/20261002160849_game_room_character_invariants.sql"), /alter publication/u);
});

test("embedded width keeps Combat labels visible and prevents implicit extra grid columns", () => {
  const styles = source("components/characters/character-editor.module.css");
  assert.match(styles, /container-type: inline-size/u);
  assert.match(styles, /@container \(max-width: 48rem\)/u);
  assert.match(styles, /lg:sr-only[\s\S]*?position: static;[\s\S]*?clip: auto;/u);
  assert.match(styles, /col-span-2[\s\S]*?grid-column: auto;/u);
  assert.doesNotMatch(styles, /portrait|opacity: 0|visibility: hidden/u);
});

test("new invariant messages and entire EN/RU dictionary keys remain in parity", () => {
  const en = JSON.parse(source("messages/en.json"));
  const ru = JSON.parse(source("messages/ru.json"));
  const keys = (value: Record<string, unknown>, prefix = ""): string[] => Object.entries(value).flatMap(([key, entry]) => entry && typeof entry === "object" ? keys(entry as Record<string, unknown>, `${prefix}${key}.`) : [`${prefix}${key}`]);
  assert.deepEqual(keys(en).sort(), keys(ru).sort());
  assert.equal(en.CampaignGameRoom.tools.characters, "Characters");
  assert.equal(ru.CampaignGameRoom.tools.characters, "Персонажи");
  assert.equal(en.CampaignGameRoom.characters.noCharacter, "No character");
  assert.equal(ru.CampaignGameRoom.characters.noCharacter, "Нет персонажа");
  assert.equal(campaignCharacterErrorKey({ message: "campaign_character_active_session" }), "activeSession");
  assert.equal(campaignCharacterErrorKey({ message: "campaign_characters_one_active_player_idx" }), "oneCharacter");
  assert.equal(campaignCharacterErrorKey({ message: "campaign_character_game_master" }), "gameMasterForbidden");
});

test("creation, editing, summaries, queries and linking contain no character visibility model", () => {
  for (const file of [
    "components/characters/character-creator.tsx",
    "components/characters/character-editor.tsx",
    "components/characters/character-summary-card.tsx",
    "components/campaigns/campaign-characters-panel.tsx",
    "lib/campaign-characters/contracts.ts",
    "lib/campaign-characters/server.ts",
    "lib/characters/vtm-v5/editor-draft.ts",
    "lib/characters/call-of-cthulhu-7e/editor-draft.ts",
    "app/[locale]/characters/page.tsx",
    "app/[locale]/characters/[id]/page.tsx",
    "app/[locale]/campaigns/[id]/page.tsx",
    "app/[locale]/campaigns/[id]/characters/[characterId]/page.tsx",
  ]) assert.doesNotMatch(source(file), /[Vv]isibility/u, file);
  assert.match(source("components/characters/character-creator.tsx"), /\.insert\(\{[\s\S]*?owner_id: userData\.user\.id/u);
  assert.match(source("components/campaigns/campaign-characters-panel.tsx"), /!isGameMaster && !hasOwnLinkedCharacter &&/u);
});

test("owner routes enforce ownership in both data and metadata; campaign route enforces exact role and assignment", () => {
  const owner = source("app/[locale]/characters/[id]/page.tsx");
  assert.match(owner, /\.eq\("owner_id", claimsData\.claims\.sub\)/u);
  assert.match(owner, /\.eq\("owner_id", userId\)/u);
  assert.doesNotMatch(owner, /readOnly=/u);
  assert.match(source("app/[locale]/characters/page.tsx"), /\.eq\("owner_id", claimsData\.claims\.sub\)/u);
  const campaign = source("app/[locale]/campaigns/[id]/characters/[characterId]/page.tsx");
  assert.match(campaign, /campaignResult\.data\.status !== "active"/u);
  assert.match(campaign, /userId !== campaignResult\.data\.game_master_id && userId !== assignmentResult\.data\.linked_by/u);
  assert.match(campaign, /\.eq\("owner_id", assignmentResult\.data\.linked_by\)/u);
  assert.match(campaign, /\.eq\("game_system", campaignResult\.data\.game_system\)/u);
  assert.match(campaign, /<CharacterEditor[\s\S]*?readOnly/u);
  assert.match(source("components/campaigns/campaign-characters-panel.tsx"), /isGameMaster \|\| character\.ownerId === currentUserId\) && <Link/u);
});

test("VtM and CoC old drafts ignore obsolete fields; current and re-saved drafts never contain them", () => {
  const values = new Map<string, string>();
  const sessionStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { sessionStorage } });
  try {
    const vtm = { version: 1 as const, name: "Vampire", activePage: "background" as const, sheetData: createDefaultVtmV5SheetData() };
    const coc = { version: 1 as const, name: "Investigator", activePage: "story" as const, sheetData: createDefaultCoc7eSheetData() };
    for (const obsolete of ["private", "campaign", "public", "invalid", { untrusted: true }]) {
      values.set("vtm", JSON.stringify({ ...vtm, visibility: obsolete }));
      values.set("coc", JSON.stringify({ ...coc, visibility: obsolete }));
      assert.deepEqual(readVtmV5EditorDraft("vtm"), vtm);
      assert.deepEqual(readCoc7eEditorDraft("coc"), coc);
    }
    // Explicit serialization also discards extra legacy properties supplied at runtime.
    writeVtmV5EditorDraft("vtm", { ...vtm, ...{ visibility: "campaign" } });
    writeCoc7eEditorDraft("coc", { ...coc, ...{ visibility: "public" } });
    assert.deepEqual(JSON.parse(values.get("vtm")!), vtm);
    assert.deepEqual(JSON.parse(values.get("coc")!), coc);
    assert.deepEqual(readVtmV5EditorDraft("vtm"), vtm);
    assert.deepEqual(readCoc7eEditorDraft("coc"), coc);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});

test("character translations remove obsolete controls without changing Gallery visibility", () => {
  for (const locale of ["en", "ru"]) {
    const messages = JSON.parse(source(`messages/${locale}.json`));
    assert.equal(messages.Characters.visibility, undefined);
    assert.doesNotMatch(JSON.stringify(messages.CharacterForm), /visibility/u);
    assert.equal(messages.CampaignCharacters.needsCampaignVisibility, undefined);
    assert.equal(messages.CampaignCharacters.editVisibility, undefined);
    assert.ok(messages.CampaignHandouts.visibility.gmOnly);
    assert.ok(messages.CampaignHandouts.visibility.allPlayers);
    assert.ok(messages.CampaignHandouts.visibility.selectedPlayers);
  }
});
