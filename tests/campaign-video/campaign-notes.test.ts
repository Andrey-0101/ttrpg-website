import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  creationDates,
  filterNotes,
  formatNoteTime,
  parseNoteMutation,
  sessionSubtitle,
  sortNotes,
  type CampaignNote,
} from "../../lib/campaign-notes/contracts";
const source = (file: string) => readFileSync(file, "utf8");
const entry: CampaignNote = {
  id: "96000000-0000-4000-8000-000000000001",
  body: "Clue\nSecond paragraph",
  campaign_name_snapshot: "Original campaign",
  created_at: "2026-10-03T23:30:00Z",
  created_timezone: "Australia/Perth",
  edited_at: "2026-11-15T12:00:00Z",
  edited_timezone: "UTC",
  game_session_id: "session-id",
  game_sessions: { session_number: 9, title: "Escape From Innsmouth" },
};
test("Notes mutation accepts only body/timezone and action/owned ID, never heading or session metadata", () => {
  const create = { action: "create", body: "text", timezone: "UTC" };
  assert.ok(parseNoteMutation(create));
  for (const key of [
    "owner_id",
    "campaign_id",
    "game_session_id",
    "created_at",
    "campaign_name_snapshot",
    "title",
  ]) {
    assert.equal(parseNoteMutation({ ...create, [key]: "forged" }), null);
  }
  assert.equal(parseNoteMutation({ ...create, body: " \n " }), null);
  assert.equal(parseNoteMutation({ ...create, timezone: "bogus" }), null);
  assert.ok(
    parseNoteMutation({
      action: "edit",
      id: entry.id,
      body: "edited",
      timezone: "Asia/Tokyo",
    }),
  );
  assert.ok(parseNoteMutation({ action: "delete", id: entry.id }));
  assert.equal(parseNoteMutation({ action: "delete", id: "bogus" }), null);
});
test("Historical heading dates and Date search use saved creation timezone, never edit date", () => {
  assert.equal(creationDates(entry, "en").iso, "2026-10-04");
  assert.match(
    formatNoteTime(entry.created_at, entry.created_timezone, "en"),
    /4.*October|October.*4/,
  );
  assert.match(
    formatNoteTime(entry.created_at, entry.created_timezone, "en"),
    /07:30/,
  );
  assert.match(creationDates(entry, "ru").display, /4 октября/);
  assert.equal(
    filterNotes([entry], "2026-10-04", "date", "en", "Session").length,
    1,
  );
  assert.equal(
    filterNotes([entry], "2026-10-03", "date", "en", "Session").length,
    0,
  );
  assert.equal(
    filterNotes([entry], "2026-11-15", "all", "en", "Session").length,
    0,
  );
  assert.equal(
    filterNotes([entry], "4 октября", "date", "ru", "Сессия").length,
    1,
  );
});
test("Text/Session/All search filters whole entries without reordering or edited-date matching", () => {
  assert.equal(filterNotes([entry], "CLUE", "text", "en", "Session").length, 1);
  assert.equal(
    filterNotes([entry], "Original campaign", "text", "en", "Session").length,
    0,
  );
  for (const query of [
    "9",
    "Session 9",
    "innsmouth",
    "Session 9. Escape From Innsmouth",
  ]) {
    assert.equal(
      filterNotes([entry], query, "session", "en", "Session").length,
      1,
    );
  }
  assert.equal(
    filterNotes(
      [{ ...entry, game_session_id: null, game_sessions: null }],
      "9",
      "session",
      "en",
      "Session",
    ).length,
    0,
  );
  assert.equal(
    filterNotes([entry], "innsmouth", "all", "en", "Session").length,
    1,
  );
  assert.equal(
    sessionSubtitle({ session_number: 1, title: null }, "Session"),
    "Session 1",
  );
  const older = { ...entry, id: "a", created_at: "2026-01-01T00:00:00Z" };
  assert.deepEqual(
    sortNotes([entry, older]).map((row) => row.id),
    ["a", entry.id],
  );
  assert.deepEqual(
    sortNotes([
      { ...entry, id: "b" },
      { ...entry, id: "a" },
    ]).map((row) => row.id),
    ["a", "b"],
  );
});
test("Shared Notes journal uses explicit inline mutation, single mode, safe text and internal chronological scroll", () => {
  const ui = source("components/campaigns/campaign-notes-journal.tsx");
  assert.match(ui, /Editor = \{ kind: "create" \} \| \{ kind: "edit"/);
  assert.match(ui, /disabled=\{busy \|\| Boolean\(editor\)\}/);
  assert.match(ui, /deleteConfirm/);
  assert.match(ui, /t\("yes"\)/);
  assert.match(ui, /t\("no"\)/);
  assert.match(ui, /t\("cancel"\)/);
  assert.match(ui, /sortNotes\(state.entries\)/);
  assert.match(ui, /scrollTop = scroll.current.scrollHeight/);
  assert.match(ui, /text-justify text-sm font-normal not-italic/);
  assert.match(ui, /overflow-y-auto overscroll-contain/);
  assert.doesNotMatch(
    ui,
    /dangerouslySetInnerHTML|Markdown|localStorage|sessionStorage|beforeunload|unsaved|\.channel\(|setInterval|pagination/i,
  );
});
test("Overview, dedicated RLS-protected route and five-tool Game Room reuse the same Notes implementation", () => {
  const overview = source("app/[locale]/campaigns/[id]/page.tsx");
  const page = source("app/[locale]/campaigns/[id]/notes/page.tsx");
  const room = source("components/campaigns/campaign-game-room-workspace.tsx");
  assert.match(overview, /data-campaign-gallery-notes/);
  assert.match(overview, /CampaignHandoutsCard/);
  assert.match(overview, /campaign.id\}\/notes/);
  assert.match(page, /auth.getClaims/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /CampaignNotesJournal campaignId/);
  assert.match(room, /CampaignNotesJournal campaignId/);
  const nav = room.slice(room.indexOf("data-game-room-tool-navigation"));
  const labels = ["journal", "gallery", "dice", "characters", "notes"];
  for (let i = 1; i < labels.length; i++)
    assert.ok(
      nav.indexOf(`tools.${labels[i - 1]}`) < nav.indexOf(`tools.${labels[i]}`),
    );
  assert.match(room, /"grid-cols-5"/);
  assert.match(room, /sessionName/);
  assert.match(room, /setStartPrompt\(true\)/);
});
test("New Notes and session prompt labels have EN/RU parity", () => {
  const en = JSON.parse(source("messages/en.json"));
  const ru = JSON.parse(source("messages/ru.json"));
  assert.deepEqual(
    Object.keys(en.CampaignNotes).sort(),
    Object.keys(ru.CampaignNotes).sort(),
  );
  for (const key of ["sessionName", "confirmStart", "cancelStart"])
    assert.ok(
      en.CampaignGameRoom.journal[key] && ru.CampaignGameRoom.journal[key],
    );
  assert.ok(en.CampaignGameRoom.tools.notes && ru.CampaignGameRoom.tools.notes);
});
