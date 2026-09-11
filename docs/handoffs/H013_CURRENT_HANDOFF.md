# H013_CURRENT_HANDOFF.md

## 1. Document control

| Field | Value |
|---|---|
| Project | `TTRPG_website` / `ttrpg-website` |
| Handoff version | `H013` |
| Created | 2026-09-11 |
| Status | **Current authoritative continuation handoff** |
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Canonical local repository | `C:\Projects\ttrpg-website` |
| Canonical branch | `main` |
| Accepted Phase 4D2 application baseline | `01d917688ddadb5366949a714bba462b7c5c44b2` |
| Production domain | `https://ttrpg.fans` |
| Accepted Phase 4D2 Vercel deployment | `dpl_DAR4FsimPtWwPST6U1tmC42U6LoY` |
| Previous handoff | `docs/handoffs/H012_CURRENT_HANDOFF.md` — historical |

The SHA and deployment above are the exact accepted application baseline before this documentation-only close-out. The close-out itself is delivered through a later documentation commit and does not change application behavior, schema, or infrastructure. At the start of every new task, verify live `main`, `origin/main`, the working tree, and the current Production deployment rather than assuming that this recorded baseline is still the Git tip.

## 2. Phase status

**Phase 4D2 — CLOSED / DEPLOYED / ACCEPTED.**

- Game Sessions and Campaign Dice were delivered by PR #52, merge commit `205b5495421eaed0642ab52639a21e6f1c015c43`.
- Acceptance UX refinements were delivered by PR #53, merge commit `773ac98c66d5d854a22ebe39ca46386e7f13af44`.
- Final Game Room tool-navigation polish was delivered by PR #54, merge commit `01d917688ddadb5366949a714bba462b7c5c44b2`.
- Phase 4D2 multi-user Production acceptance: **PASS**.
- Final UI-polish manual re-test items 1–4: **PASS**.

Do not reopen Phase 4D2 merely to improve a deferred or pre-existing non-blocking item.

## 3. Current Game Room architecture

### Game Room

The localized campaign Game Room is the parent application surface and is independent from LiveKit. Entering or refreshing it:

- does not join LiveKit;
- does not start a Game Session;
- shows the normal Game Room tools immediately.

The stable one-row tool order is:

```text
Journal | Gallery | Dice | Character
```

Journal is the default/root Display view. The one-row navigation must remain visually stable and must not reduce usable Display height by wrapping into a second row.

### Game Session

- only the campaign GM can Start or End;
- the database permits only one active Game Session per campaign;
- Game Session lifecycle is independent from LiveKit;
- GM presence is renewed from the mounted Game Room, not from video;
- the client renewal interval is approximately 30 minutes;
- each accepted renewal extends the database deadline to approximately 60 minutes, producing the agreed approximately 30–60 minute expiry window after GM disappearance;
- automatic expiry is controlled by a private database function scheduled through `pg_cron`;
- explicit End closes immediately;
- campaign completion closes any active Game Session and prevents another start;
- ended sessions remain stored for future archive/history;
- archive UI is not implemented.

Join, Leave, refresh, disconnect, camera, and microphone actions must never start or end a Game Session.

### Journal

Journal is strictly scoped to the exact active Game Session:

- no active Game Session means no persistent Journal events;
- every new Game Session has a new empty current Journal;
- ended-session rows and events remain stored but do not appear in the new current Journal;
- new entries append at the bottom, older entries remain above, and the Journal auto-scrolls to the newest entry;
- the GM Start/End control stays fixed while the event list scrolls;
- Journal has no back arrow because it is the default/root Display view;
- Journal events and Game Session Start/End state propagate through Supabase Realtime;
- lightweight polling remains only as fallback reconciliation.

### Campaign Dice

Campaign Dice is implemented for:

```text
Vampire: The Masquerade V5
Call of Cthulhu 7e
```

The campaign system determines the available roller automatically. The existing system-specific dice engines and result contracts are reused; there is no separate campaign rules engine.

- Campaign Dice does not depend on LiveKit.
- Without an active Game Session, the server returns a roll only to its initiator; it is not broadcast or persisted.
- With an active Game Session, the roll is persisted to that exact session and appears publicly in Journal for current campaign participants.
- Hidden/private campaign rolls are not implemented.
- Random generation and rules interpretation are server-authoritative.
- The database writer binds to the exact expected session and cannot rebind an in-flight roll across an End → Start race.
- Ordinary authenticated clients cannot forge Journal rows directly.

CoC Dice opens directly in Percentile. Its internal one-row submenu is:

```text
← | Percentile | Other Dice
```

Both entries reuse the accepted CoC modes without changing mechanics or validation. VtM Dice has one mode and opens directly with no Dice submenu.

### Gallery

- Gallery opens directly in Handouts; there is no empty Gallery landing screen.
- Gallery retains its internal back arrow and existing subsection navigation.
- Browsing Gallery does not require LiveKit.
- Image Share/Presentation still uses LiveKit.
- The GM must be connected to LiveKit to share.
- Only LiveKit-connected participants receive the presented image.

### LiveKit

LiveKit controls only:

- video/audio;
- Gallery image-presentation transport.

It does not control Game Room access, Game Session lifecycle, Journal, or Campaign Dice.

## 4. Database state

### Current Phase 4D2 objects

`public.game_sessions` stores the persistent lifecycle, starter, timestamps, presence deadline, and terminal reason. A partial unique index enforces one unended session per campaign.

`public.game_session_journal_events` stores immutable session-scoped event envelopes. Current Campaign Dice events use `event_kind = 'campaign_dice_roll'` with schema version 1 and structured request/result data.

Lifecycle RPCs:

```text
start_game_session(uuid)
end_game_session(uuid)
renew_game_session_presence(uuid)
```

The Campaign Dice authoritative RPC is service-role-only:

```text
record_campaign_dice_roll(uuid, uuid, uuid, text, jsonb, jsonb)
```

The trusted server passes campaign ID, actor ID, exact expected Game Session ID, roll type, canonical request, and canonical result. The function locks and revalidates the campaign/session boundary and never searches for a replacement active session.

### Phase 4D2 migrations

```text
20260910122247_game_sessions_and_journal.sql
20260911120000_campaign_dice_journal.sql
20260911120001_bind_campaign_dice_to_expected_session.sql
20260911121613_publish_game_session_state_realtime.sql
```

Purposes:

1. create Game Session/Journal tables, RLS, lifecycle RPCs, integrity trigger, completion handling, and autonomous expiry;
2. add the service-role Campaign Dice Journal writer and publish Journal events through Realtime;
3. replace the writer with exact expected-session binding to close the End → Start race;
4. idempotently publish `game_sessions` through Supabase Realtime so lifecycle state propagates.

All four migrations are applied in Production. Applied migrations are immutable; any later database change requires a new forward migration.

### Realtime and expiry

Both `game_sessions` and `game_session_journal_events` must remain in the `supabase_realtime` publication. LiveKit is not involved in either subscription.

The private `expire_game_sessions()` function closes expired sessions. The `expire-stale-game-sessions` `pg_cron` job invokes it every minute. Application roles cannot execute the private expiry function.

### Security boundary

- authenticated campaign participants receive RLS-filtered SELECT access to their campaign's Game Sessions and Journal;
- authenticated application roles receive no direct INSERT/UPDATE/DELETE grant for those tables;
- lifecycle RPCs derive GM identity from `auth.uid()`;
- Journal inserts are guarded by active session, active campaign, and current actor participation checks;
- the Campaign Dice writer is callable only through the trusted server/service-role boundary;
- generated `types/database.types.ts` is derived output and must never be edited manually.

## 5. Supabase environments

### Production

```text
Name: ttrpg-website
Project ref: nryzkqwcnbbneazaksgh
Use: current Production Supabase project for https://ttrpg.fans
```

### Separate test project retained for now

```text
Name: ttrpg-website-m4e-test
Project ref: sijgmybepesinijyspjm
```

This project exists separately and is intentionally retained pending a future cleanup decision. **Do not delete it, pause it, or modify it. Do not claim it is safe to remove.** No keys or secret values are recorded here.

## 6. Verification and acceptance

Final recorded evidence, without repeated logs:

- PR #52 GitHub CI `Lint, test, and build`: **PASS**;
- PR #52 Vercel Preview: **PASS**;
- targeted TypeScript verification: **PASS**;
- Campaign Dice database integration test: **PASS**;
- Production migration application/parity and relevant schema/security checks: **PASS**;
- all four Phase 4D2 migrations present and applied: **PASS**;
- PR #53 GitHub/Vercel checks: **PASS**;
- PR #54 GitHub/Vercel checks: **PASS**;
- accepted Phase 4D2 deployment `dpl_DAR4FsimPtWwPST6U1tmC42U6LoY` at exact application SHA `01d917688ddadb5366949a714bba462b7c5c44b2`: **READY**;
- safe automated Production delta smoke: **PASS**;
- manual multi-user Production acceptance: **PASS**;
- final UI-polish manual re-test: **PASS** for Journal no-arrow, Gallery default Handouts, CoC default Percentile/submenu, and unchanged direct VtM Dice.

No new Production fixtures or fake users were created for final acceptance. The documentation-only close-out does not require application build/test or another Phase 4D2 acceptance run.

## 7. Deferred and non-blocking items

- CoC personal history displays the current roll plus four previous rolls instead of the intended current plus five previous. Root cause is unverified. This remains deferred and is not a Phase 4D2 defect to fix implicitly.
- Supabase leaked-password protection is currently disabled.
- The intentionally separate character-owner and campaign-sharing SELECT paths produce an existing `characters` multiple-permissive-policy performance warning.
- Other previously documented advisor notices outside the Phase 4D2 delta remain pre-existing and non-blocking unless a focused future review proves otherwise.
- Game Session archive/history UI is not implemented.
- Hidden/private Campaign Dice rolls are not implemented.

Do not fix these items without a separately approved task.

## 8. Operating rules for the next stage

1. The exact live Git baseline is the source of truth. Before work, verify repository, branch, `HEAD`, `origin/main`, and a clean working tree.
2. Read only task-relevant current files. Historical handoffs and old code fragments do not override the current commit.
3. Applied migrations are immutable. Every later schema, function, policy, trigger, publication, or Storage change requires a new forward migration.
4. Never edit generated database types manually.
5. Do not invent infrastructure, routes, schema, tables, settings, tests, or deployments. Verify assumptions against current code, migrations, generated types, and supported infrastructure tools.
6. Reuse existing functions, data, components, engines, and settings instead of creating parallel mechanisms.
7. Minimal Delta Verification is mandatory:
   - define the delta and what is already proven;
   - run only checks the delta can invalidate;
   - do not repeat full test/build/browser/Production gates for completeness;
   - if automation cannot be performed both safely and reliably, stop that check and provide a short manual checklist instead of finding invasive workarounds.
8. The user's command environment is Windows CMD. User-facing commands should be CMD-compatible unless another shell is explicitly requested.
9. Code and code comments are English; explanations to the user may be Russian.
10. Before changing Next.js code, read the relevant installed Next.js documentation required by `AGENTS.md`.
11. Do not expose keys, secrets, tokens, hashes, or protected values in files, logs, handoffs, or user-visible errors.

## 9. Next roadmap point

The next documented product stage is:

```text
Phase 4E — Campaign & Game Room UX/UI Refinement
```

Its roadmap scope is refinement of existing Campaign and Game Room layout, navigation, responsive behavior, accessibility, usability, hierarchy, and consistent states without adding new product capabilities.

**Do not begin Phase 4E from this documentation close-out.** The next action is a focused Phase 4E planning/review task against the current repository and ROADMAP.

## 10. Resume procedure

1. Open Windows CMD and go to `C:\Projects\ttrpg-website`.
2. Read H013 completely.
3. Verify live `main`, `HEAD == origin/main`, and a clean working tree.
4. Treat `01d917688ddadb5366949a714bba462b7c5c44b2` and `dpl_DAR4FsimPtWwPST6U1tmC42U6LoY` as the accepted Phase 4D2 application/deployment baseline, not a promise that no later documentation commit exists.
5. Read the current Phase 4E ROADMAP section and only the documents/code relevant to the next requested delta.
6. Do not start Phase 4E implementation until its focused scope is reviewed.

## 11. Secrets and quality check

- No API key, service-role secret, Vercel token, password, database credential, invitation token, or environment-variable value is included.
- Phase 4D2 behavior is marked implemented, deployed, accepted, and closed.
- Game Room, Game Session, Journal, Campaign Dice, Gallery, and LiveKit dependencies are explicit.
- The four exact migration filenames and their purposes are recorded.
- Production and retained test Supabase projects are distinguished without modifying either.
- Deferred items are separated from completed Phase 4D2 work.
- Phase 4E is identified but not started.
