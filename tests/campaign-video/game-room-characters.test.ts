import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildGameRoomCharacterRows, campaignCharacterErrorKey } from "../../lib/campaign-characters/contracts";

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
  { id: "alice-character", name: "Margaret", owner_id: "alice", visibility: "campaign", game_system: "vtm-v5" },
  { id: "chris-character", name: "Thomas", owner_id: "chris", visibility: "campaign", game_system: "vtm-v5" },
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

test("unlinked, wrong campaign, incompatible, private and wrong-owner relationships fail closed", () => {
  for (const assignment of [
    { ...assignments[0], unlinked_at: "ended" },
    { ...assignments[0], campaign_id: "other" },
  ]) assert.equal(rows("alice", { assignments: [assignment] })[1].characterId, null);
  for (const character of [
    { ...characters[0], game_system: "call-of-cthulhu-7e" },
    { ...characters[0], visibility: "private" },
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
  assert.match(server, /\.eq\("visibility", "campaign"\)\.eq\("game_system", campaign\.game_system\)/u);
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
  assert.match(editor, /disabled=\{readOnly \|\| !isEditing \|\| saving \|\| assignmentSessionLocked\}/u);
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
