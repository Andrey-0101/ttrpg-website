# H014_CURRENT_HANDOFF.md

## 1. Document Control

| Field | Value / evidence |
|---|---|
| Project | **TTRPG_website / TTRPG Hub**; repository name `ttrpg-website` |
| Handoff | **H014** — one chronological handoff closing the current ChatGPT working conversation; H013 is historical |
| Created | **2026-10-14** |
| Scope of this conversation | Developer Game Room Diagnostics: design/implementation, Production rollout, corrective UI delta, null-run SQL bugfix, first GM-only ZIP, documentation synchronization and preparation for Phase 5A |
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Local path / shell | `C:\Projects\ttrpg-website`; Windows CMD |
| Active branch | `main` — **VERIFIED** by user's final command output |
| Exact repository `HEAD` | **`26da4289f41620b3265854ce1138a5f1e0ea9904`** — **VERIFIED** by `git rev-parse HEAD` |
| `origin/main` | **`26da4289f41620b3265854ce1138a5f1e0ea9904`** — **VERIFIED** by `git rev-parse origin/main` |
| Ahead/behind; worktree | `## main...origin/main`; **0 ahead, 0 behind; clean**, no modified/untracked files shown before/after build — **VERIFIED** by user commands |
| Last commit | `26da428` — `Synchronize project documentation after diagnostics Production releases (#75)`; **22 Markdown files changed** |
| Main push | **VERIFIED** by matched local/remote refs and PR #75 report; H014 itself is **not committed** |
| Current Production | `https://ttrpg.fans` (`www` redirects to apex); **VERIFIED** via Codex release report |
| Production deployment for current doc-only `main` | `dpl_6455yV8o3gY8VzoTAxgoPfqDBiUf` — **READY**, website reported bound to `26da428…` |
| Latest application-changing Production baseline | `b5f20bfc2b8c025644375ae41e687d692d899c83` (PR #74); diagnostic null handling fixed; PR #75 changes documentation only |
| Latest application-changing deployment | `dpl_2SU3Zx16EXc6ss9SCNWSuL1kBk6c` — **READY** (prior to PR #75 documentation build) |
| Local production build at `26da428…` | `npm run build` **PASS** 2026-10-14: Next.js 16.3.3 / Turbopack, compile, TypeScript and 44/44 static pages; no errors reported |
| Handoff delivery status | **Prepared by ChatGPT in this conversation, NOT YET committed/uploaded to GitHub**. The user must save/upload this file as appropriate; no GitHub changes were made while preparing it. |

**Source confidence legend.** `VERIFIED`: directly checked against specified Git commit, given command output, inspected diagnostic ZIP, or reported targeted Production verification (identify which); `IMPLEMENTED`: present in pinned code/migrations; `DECIDED`: accepted requirement/architecture; `PLANNED`: not yet started; `ASSUMED`: plausible hypothesis requiring evidence; `UNVERIFIED`: not established by available evidence; `BLOCKED`: dependency prevents a task; `DEPRECATED`: superseded and must not guide new work. A successful CI/build does **not** by itself establish manual gameplay acceptance. Production status is based on the user's Codex release report, not an independent browser login in this ChatGPT turn.

## 2. Instructions for the Next Chat

1. Read this **H014 completely** and the **specific** current files required for the requested Phase 5A planning task.
2. Begin by identifying live `HEAD`, `origin/main`, branch and working-tree state. The authoritative *historical snapshot* in this handoff is `26da428…`; if main later advances, use the **new** exact commit and compare the relevant files. Do not assume H014 itself is already checked into GitHub.
3. The **current pinned code and migrations** override historical handoffs and old ChatGPT/Codex responses. Do not resurrect Phase 4E-as-next-stage language from H013: that stage is complete; the next stage is **Phase 5A**.
4. Do not fabricate schema, columns, policies, deployed settings, passed tests, UX decisions, or missing files. Mark inaccessible details `UNVERIFIED` instead of guessing.
5. First discuss and agree Phase 5A changes **one scope at a time**; **no immediate coding**, UI redesign, database migration or new product feature.
6. Use **Codex for changes** to code, repository documentation and Git/GitHub. ChatGPT plans tasks, decides with the owner, reviews reports and, **only upon explicit user command at the end of a conversation**, authors exactly one next chronological handoff.
7. Do **not** schedule further Developer Diagnostics or computer-audio tests now. Both remaining multi-user checks are explicitly postponed to an actual gaming session and **do not block Phase 5A**.

## 3. Source-of-Truth Priority

Use this ordering, checked **at the exact referenced revision**:

1. Current code at exact selected Git commit.
2. Forward SQL migrations committed at that revision (for **intended definitions**; actual application requires deployment evidence).
3. Generated `types/database.types.ts` at that revision.
4. Actually verified Supabase/Vercel configuration and deployment evidence (can confirm which migrations/settings are live).
5. Latest authorized current handoff, **H014 when supplied in new chat**; H013 remains historical.
6. `PROJECT_CONTEXT.md`.
7. Current functional specifications, architecture documents and ADRs.
8. This finished ChatGPT conversation, including Codex reports and inspected ZIP.
9. Earlier conversations and H001–H013 archives.

When an older document references a prior **application** release, distinguish it from the newer **documentation-only** commit. Do not replace immutable commit identities with a generic “latest”.

## 4. Current Project Snapshot

**Status: IMPLEMENTED / VERIFIED to stated limits.** TTRPG Hub is a **private friend-alpha bilingual (`en`/`ru`) TTRPG website** for a small invited group. Stack from pinned `PROJECT_CONTEXT.md`: Next.js **16.3.3** App Router, React **19.2.4**, TypeScript, Tailwind CSS **4**, `next-intl` **4.13.0**, Supabase PostgreSQL/Auth/RLS/Realtime/Storage, Vercel and GitHub; campaign video uses LiveKit **2.21.0** according to current diagnostics specification.

**Implemented modules:** authentication/profiles; VtM V5 and CoC 7e character creation and versioned two-page sheets/private portraits; VtM/Custom/CoC personal Dice with owner-private history; Fair Turn Order Dice; private campaigns (one GM + up to six Players), invitations, members, player order and exact character linking; independent Campaign Game Room; campaign-authorized LiveKit camera/microphone; image-only Gallery with GM presentation; system-aware Campaign Dice; independent Game Sessions and scoped Journal; GM/Player Personal Campaign Notes; optional GM computer-audio share; Developer-only connection diagnostics.

**Current stage:** Phase 4 **CLOSED / DEPLOYED / ACCEPTED**. Phase 5A — **Campaign & Game Room UX/UI Refinement: PLANNED / NOT STARTED**. Phase 5B site-wide technical UX follows; Phase 6 final Visual Identity follows Phase 5. Product functionality and current visual identity are deliberately separate concerns.

**EN/RU:** locale-prefixed application routes; default English; currently sheet language follows route language. Independent character-sheet language is an **accepted concept, not an implemented field/selector** (`ADR-003` is **Proposed**, not Accepted in the current ADR index).

**Auth:** Supabase Auth with registration, login, confirmation via `/auth/confirm`, session handling, profiles and safe localized failures. Developer permission is a separate protected global internal role; UI wrench is not an authorization boundary. Production grant was issued to the **single verified owner account** (Codex deployment report); do not assume a second account has the role.

**Characters:** common columns in `public.characters`; no visibility column; owner editing/deletion subject to active-assignment protection; only exact eligible campaign GM has read-only access to an actively assigned Player character and portrait; no peer-Player sharing. VtM `sheet_data.schemaVersion=3`; CoC 7e `schemaVersion=1`; both normalized; never discard persisted unknown data casually.

**Production:** `https://ttrpg.fans`; latest documentation-only READY deployment for `26da428…`. Production Supabase `ttrpg-website` (`nryzkqwcnbbneazaksgh`); separately retained test project `ttrpg-website-m4e-test` (`sijgmybepesinijyspjm`) **must not be changed/paused/deleted without explicit approval**. Phase 4 multi-user gameplay acceptance was completed; *newly added* Computer Audio and distributed Diagnostics multi-user acceptance are still pending.

## 5. Scope of the Completed Chat

**Original goal:** approve and deliver a narrowly scoped, Developer-only Game Room technical telemetry tool, without recording media or changing existing LiveKit/Game Session authorization. Work started from architecture and UI decisions, continued through implementation, deployment and validation.

**Additional work:** review of original PR #73 UI (only four user-approved adjustments); deploy diagnostics Production infrastructure; diagnose and fix first-login access-panel failure (`diagnostic_dispatch` scalar JSONB null); inspect a real GM-only telemetry ZIP and determine whether its idle video counters indicate a defect; synchronize repository/project documentation through PR #75; finalize the next-stage boundary and restore the exact one-handoff-per-conversation procedure.

**Result:** Developer Diagnostics is deployed and performed a successful single-GM capture/export. No proven video fault: GM camera was on, but **no other participant was connected**; no subscriber existed for outgoing video. No more tests now. Documentation is synchronized, build and Git state provided, Phase 5A remains **NOT STARTED**. This H014 closes the conversation only; it is **not** a Phase 5 implementation artifact.

## 6. Work Completed

Only completed changes are listed. SHA marked “PR record” is a reference to the deployed/merged PR, **not a fabricated individual merge SHA**.

| Status | Change | Files / affected area | Commit / PR | Verification |
|---|---|---|---|---|
| IMPLEMENTED; DEPLOYED | GM Computer Audio Sharing (earlier pre-Phase-5 work) | `lib/campaign-video/browser/computer-audio.ts`, related media/UI and tests | PR **#71**, refinement PR **#72**; later merged on main | Existing CI/build/Production deployment; native multi-user echo/isolation acceptance **pending** |
| IMPLEMENTED; DEPLOYED | Developer role, control panel, run state, collection/ZIP, private Storage and autonomous cleanup | `components/developer/diagnostics-provider.tsx`, `lib/diagnostics/*`, `lib/developer/*`, `/api/diagnostics*`, `/api/internal/diagnostics/cleanup`, six 20261007 migrations, generated types | PR **#73**, merged; deployment `dpl_FDMWhv8HAUtHHTgWGSEJZofxcmoZ`; original main `6026573b6956ea965823953b18507752b1de9d8b` | CI and focused tests PASS; Production migrations, grants/bucket, scheduled cleanup HTTP 200, unauthorized diagnostics 401 / cleanup 403 reported; real multi-user acceptance pending |
| IMPLEMENTED; DEPLOYED | Four **approved** UI corrections: panel-left wrench, complete local dates with seconds, roster columns, X closes after successful export | Panel, `lib/developer/date-time.ts`, coordinator and targeted tests | In PR **#73**; feature HEAD `2d8e0e93886999c1e4d3a29a71f29b8d4a06fe78` before merge | Diagnostics 30/30, TS/lint/build/CI PASS; preserve campaign name unprefixed, `Players: N`, `Start diagnostics` |
| IMPLEMENTED; DEPLOYED | SQL JSONB-null no-run owner/state fix, without weakening session checks or exposing owner hash | `supabase/migrations/20261014102003_handle_diagnostic_dispatch_null.sql`, focused regression | PR **#74**, merged; final app SHA **`b5f20bfc2b8c025644375ae41e687d692d899c83`** | Focused RED→GREEN, 28 checks, TS/lint/CI; Production no-run owner/state SUCCESS; deployed `dpl_2SU3Zx16EXc6ss9SCNWSuL1kBk6c` READY |
| VERIFIED (limited) | First real Developer Diagnostics GM-only recording and user ZIP export | Browser + exported ZIP (not a repository change) | On app SHA `b5f20bfc…` | Inspected ZIP: one GM/segment, `complete`, no `missing_clients`/`data_gaps`, error null; 36.05 s Start→Stop, 1.59 s Stop→Completed; no Player and no media-quality group conclusion |
| IMPLEMENTED; DEPLOYED | Synchronization of current project docs after latest releases; homepage URL | `PROJECT_CONTEXT.md`, `README.md`, `docs/README.md`, 19 other existing Markdown documents (see PR file list) | PR **#75** squash merged; **`26da4289f41620b3265854ce1138a5f1e0ea9904`** | 29 docs reviewed; 22 changed; docs checks/CI PASS; documentation-only Production deployment `dpl_6455yV8o3gY8VzoTAxgoPfqDBiUf` READY |
| VERIFIED | Post-PR #75 local build, Git and worktree | No source changes | Exact `26da428…` | User CMD: build compile PASS, TypeScript PASS, 44/44 static pages, local/remote SHA equal, clean status |

**No work performed by ChatGPT in GitHub or Production during H014 preparation.** Earlier assistant consultation of GitHub/Supabase was read-only; actual repository changes were performed by Codex as reported.

## 7. Relevant File Map

Use **only relevant files** for the agreed Phase 5A planning delta; this is not a full tree.

| Path | Purpose | Current state | Notes |
|---|---|---|---|
| `PROJECT_CONTEXT.md` | Authoritative broad product/runtime snapshot | CURRENT; synchronized PR #75 | Start here after verifying Git |
| `docs/product/ROADMAP.md` | Approved Phase 5A/5B scope and phase boundaries | CURRENT | Phase 5A planning, not coding |
| `docs/architecture/DESIGN_SYSTEM.md` | Existing technical UI/responsive/accessibility contract | CURRENT | Final visual language deferred to Phase 6 |
| `docs/product/CAMPAIGNS.md` | Campaign requirements, membership and lifecycle | CURRENT | Do not break GM/Player semantics |
| `docs/product/SITE_STRUCTURE_CURRENT.md` | Current navigation/page surfaces | CURRENT | Pair with target/comparison only when necessary |
| `docs/architecture/ARCHITECTURE.md` | Runtime and domain boundaries | CURRENT | Independent Game Session/LiveKit |
| `docs/architecture/SECURITY.md`; `CAMPAIGN_RLS_MATRIX.md` | Security contracts | CURRENT | UI changes cannot bypass auth/RLS |
| `docs/architecture/I18N.md` | EN/RU route/messages architecture | CURRENT | Developer-only UI is English-only exception |
| `docs/architecture/DATABASE.md` | Current migrations/tables/RLS/Storage summary | CURRENT | No Phase 5 schema changes approved |
| `docs/architecture/CHARACTER_SHEETS.md` | VtM and CoC sheet contracts | CURRENT | Preserve data, page layouts, no unapproved new model |
| `docs/architecture/DEVELOPER_DIAGNOSTICS.md` | Exact diagnostic design, limits, rollout and acceptance | CURRENT | Incomplete only in multi-user acceptance |
| `app/[locale]/campaigns/[id]/page.tsx` | Campaign Overview route | IMPLEMENTED | Phase 5A relevant |
| `app/[locale]/campaigns/[id]/game-room/page.tsx` | Game Room route/authorization handoff | IMPLEMENTED | Phase 5A relevant |
| `components/campaigns/campaign-game-room.tsx` | Overall room container/state | IMPLEMENTED | Game session independent of camera |
| `components/campaigns/campaign-game-room-header.tsx` | Room header | IMPLEMENTED | Room-level Leave |
| `components/campaigns/campaign-game-room-workspace.tsx` | Journal/Gallery/Dice/Characters/Notes display tools | IMPLEMENTED | Actual tool list `Journal | Gallery | Dice | Characters | Notes` |
| `components/campaigns/campaign-video-room.tsx`; `campaign-game-room-card.tsx` | Video cards, controls and layout | IMPLEMENTED | Preserve approved media behavior |
| `components/campaigns/campaign-summary-card.tsx`; `campaign-members-panel.tsx`; `campaign-management-panel.tsx` | Campaign overview/GM/Player actions | IMPLEMENTED | Include in focused UX review |
| `components/campaigns/campaign-notes-journal.tsx`; `game-room-characters-list.tsx` | Existing Phase 4G/4F workflows | IMPLEMENTED | No new features |
| `components/developer/diagnostics-provider.tsx`; `lib/diagnostics/coordinator.ts` | Diagnostics panel/run coordinator | IMPLEMENTED | Do not modify for cosmetic Phase 5 reasons without decision |
| `i18n/routing.ts`; `i18n/request.ts`; `messages/{en,ru}.json` and per-system JSON | Locale behavior | IMPLEMENTED | Maintain dictionary parity for public UI |
| `types/database.types.ts`; `supabase/migrations/*` | Generated DB API types and forward schema history | IMPLEMENTED | Never hand-edit types or applied migrations |
| `docs/handoffs/H013_CURRENT_HANDOFF.md` | Historical previous handoff | HISTORICAL | Contains earlier stage labels; superseded by current Roadmap and H014 |

## 8. Current Data Contracts

**Current (IMPLEMENTED, evidenced by pinned code and generated types):**

- `public.characters`: `id`, `owner_id`, `name`, `game_system`, `description`, `portrait_url`, `sheet_data` (non-null JSONB), `created_at`, `updated_at`. No `visibility` column. Common fields are **not** duplicated in `sheet_data`.
- Game IDs: `vtm-v5`, `call-of-cthulhu-7e`. `lib/characters/vtm-v5/schema.ts` defines `VTM_V5_SCHEMA_VERSION = 3`, typed `VtmV5SheetData`, `createDefaultVtmV5SheetData`, `normalizeVtmV5SheetData`. `sheet_data` has `identity`, `attributes`, `skills`, `skillSpecialties`, `disciplines`, `advantages`, `trackers`, `chronicleTenets`, `convictions`, `touchstones`, `clanBane`, `bloodPotencyDetails`, `experience`, `biography`, `notes`, `extensions`. Legacy top-level clan/hunger/resonance accepted and normalized; unknown top-level values preserved in `extensions` where possible.
- `lib/characters/call-of-cthulhu-7e/schema.ts`: `COC7E_SCHEMA_VERSION = 1`, `Coc7eSheetData` containing `identity`, `characteristics`, `vitals`, `conditions`, `skills.fixed`, `skills.specialties`, `weapons`, `story`, `backstory`, `gearAndPossessions`, `wealth`, `extensions`. The version is **1**, not VtM's 3.
- `public.personal_roll_history`: `roller_kind` syntax `^[a-z][a-z0-9_]{0,63}$`, `schema_version` positive. App registry supports version 1 only for `vtm_v5`, `custom_dice_pool`, `coc_7e_percentile`, `coc_7e_other_dice`. JSON `request_data`/`result_data` are bounded and privately persisted; optional roll labels in backward-compatible request metadata. Retain six rows per VtM page, six per Custom, **six total combined for CoC**.
- `public.campaigns`: `id`, `game_master_id`, `game_system`, `name`, `description`, `status`, `created_at`, `updated_at`; `campaign_members`: `campaign_id`, `user_id`, `joined_at`, `display_order` (1–6). GM is **not** a `campaign_members` row. `campaign_characters` stores active/historical assignments. Cross-system assignments forbidden.
- `public.game_sessions`: `id`, `campaign_id`, `session_number` (positive immutable, unique within campaign), `title` (nullable, max 120), `started_at`, `started_by`, `presence_expires_at`, `ended_at`, `end_reason`. One active session/campaign. `game_session_journal_events` are scoped to exact session. No global Journal.
- `public.campaign_note_entries`: `id`, `campaign_id`, `owner_id`, `body`, `campaign_name_snapshot`, `created_at`, `created_timezone`, `edited_at`, `edited_timezone`, `game_session_id`. Plain-text owner-only journal, 1–20,000 nonblank characters, creation/session references protected from editing. Notes are not Realtime.
- Diagnostics `game_room_diagnostic_runs`: `id`, `campaign_id`, `owner_id`, `campaign_name`, `state`, `started_at`, `owner_heartbeat_at`, `stopped_at`, `stop_deadline`, `completed_at`, `expires_at`, `cleanup_requested_at`, `partial`, `revision`, `stop_reason`, `reserved_bytes`, internal `owner_session_hash`, `server_build` JSONB. Internal hash never appears in client/API export. `game_room_diagnostic_clients`: segment/instance IDs, alias, epoch, participant role/slot, lease/checkpoint/progress/visibility/finish state. `game_room_diagnostic_chunks`: run/client sequence, hashes, byte counts, path, acceptance and cleanup claims.
- Diagnostic run states: `recording → stopping → ready → expired/deleted`; technical samples use normalized whitelisted records. Browser ZIP `manifest.json`, `README.txt`, `combined-events.ndjson` and per-alias/segment `client.json`, `connections.ndjson`, `tracks.ndjson`, `events.ndjson`, `errors.ndjson`. This is **technical telemetry**, not raw audio/video.

**Target (PLANNED):** Phase 5A and 5B only change existing UX/UI technical refinement. **No new database columns, JSON shape, schemaVersion, table, storage bucket, migration, or data migration has been decided for Phase 5.** If a future approved change requires schema work, create a new reviewed **forward-only** migration, regenerate `types/database.types.ts`, preserve existing data and compatibility. Independent character-sheet language is a **future concept** (`ADR-003` Proposed); do not infer that its field exists.

## 9. Database, RLS and Storage State

**Production:** user-supplied Codex report after PR #74 states **30/30 repository migrations applied**; PR #75 docs-only. Source migrations and `types/database.types.ts` verified at commit `26da428…`. This ChatGPT turn did **not** independently re-query live Production schema; rely on deployed report as evidence of current application release, and recheck only if Phase 5A work touches DB/security.

**Current tables (documented in `PROJECT_CONTEXT.md`):** `profiles`, `characters`, `campaigns`, `campaign_members`, `campaign_invitations`, `campaign_characters`, `custom_dice_presets`, `personal_roll_history`, `campaign_player_publication_permissions`, `campaign_media_groups`, `campaign_media_group_members`, `campaign_media_restrictions`, `campaign_images`, `campaign_image_recipients`, `campaign_video_audit_log`, `game_sessions`, `game_session_journal_events`, `campaign_membership_signals`, `campaign_note_entries`, `system_user_roles`, `game_room_diagnostic_runs`, `game_room_diagnostic_clients`, `game_room_diagnostic_chunks`. This list is not a substitute for live catalog inspection when schema changes are proposed.

**Constraints/indexes (documented/pinned migrations):** immutable GM/system and campaign lifecycle; six-slot Player limit/reorder; active character assignment uniqueness per Player and per character; prohibition of GM Player assignment and active-assignment deletion; one active Game Session via partial unique index; exact-session Journal writer; one active diagnostic run per campaign and Developer; chunk size/sequence/lease/quota enforcement; role revocation stops run. `system_user_roles` only allows `developer`, records optional admin audit fields and revocation. No generic role-management UI.

**RLS / grants:** RLS exists for character, profiles, campaign, membership, invitation, assignments, media, Gallery, Game Session/Journal, Notes, role and diagnostic tables (details in `docs/architecture/DATABASE.md` and diagnostic migrations). Character sheet+portrait owner access; exact assigned campaign GM read-only; other Players/outsiders denied. `campaign_note_entries` SELECT is owner-only and authenticated direct write denied (trusted RPC). Game Session/Journal clients read under contextual participant RLS; no direct DML. Developer-role authenticated user can read **own role only**. Diagnostic run-control authenticated SELECT/Realtime is limited to **`id`, `campaign_id`, `state`, `revision`** with contextual authorization. Client roles lack direct diagnostic chunk/Storage writes and cannot call service-only `diagnostic_dispatch`. **Do not assert any policy not evidenced by source migrations.** No Phase 5 RLS change is pending.

**Storage:**

| Bucket | State | Path convention | Browser authorization |
|---|---|---|---|
| `character-portraits` | Private; JPEG/PNG/WebP, 5 MiB | `USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME` | Owner writes; owner/exact eligible campaign GM signed read |
| `campaign-images` | Private; JPEG/PNG/WebP, 5 MiB | `CAMPAIGN_UUID/IMAGE_UUID/RANDOM_OBJECT_UUID.ext` | Exact metadata+recipient/GМ policy, signed read; no generic upsert |
| `game-room-diagnostics` | Private; gzip chunks | `RUN_UUID/SEGMENT_UUID/CHUNK_UUID.ndjson.gz` | **No authenticated browser Storage policies**; server-side registered-path access only |

**Diagnostics runtime:** `pg_cron` + `pg_net` + Vault lookup + protected `/api/internal/diagnostics/cleanup` POST every **5 min**; role and Vault/Vercel server-only credential configured in Production (values **never** recorded). Server hard Stop collection deadline **30 s**; TTL **12 hours from server completion**, physical deletion on next successful cleanup rather than guaranteed at exact TTL. Worker ZIP/IndexedDB limits: 16 MiB unconfirmed local, 256 MiB compressed per run, 256 KiB compressed/1 MiB expanded per chunk, 512 MiB export defensive ceiling. Realtime carries control invalidation, **not** metrics; LiveKit media token permissions unchanged.

**Dashboard-only / hosted facts:** Production Supabase Auth Site URL and production/local redirect allowlist; Vercel domain/TLS/canonical redirect, configured deployment region Tokyo `hnd1`; environment secrets and Vault entries exist per release report but are **not** in Git and must not be invented/displayed. Arbitrary Preview Auth redirects not enabled. `net` not an exposed PostgREST schema; queued pg_net auth headers remain readable to trusted DB LOGIN roles (architecture trust boundary). Supabase test project is retained untouched. **UNVERIFIED:** exact present secret values, account Auth UUID, future settings drift; neither is needed for Phase 5A planning.

## 10. Confirmed Architectural Decisions

| Decision | Status | Reason | Related files / ADR |
|---|---|---|---|
| Common character columns + versioned system-specific `sheet_data` JSONB | DECIDED; IMPLEMENTED | Preserve reusable platform shape and backward compatibility | ADR-001; `docs/architecture/CHARACTER_SHEETS.md` |
| Private portrait Storage and exact owner/GM access | DECIDED; IMPLEMENTED | Avoid public personal assets and bypass by URL | ADR-002; `DATABASE.md` |
| Independent sheet language separate from route language | **Proposed / NOT IMPLEMENTED** | Future per-character language preference | ADR-003; `I18N.md` |
| A4 desktop sheet, fluid responsive mobile | DECIDED; IMPLEMENTED | Existing sheets and mobile readability | ADR-004; `DESIGN_SYSTEM.md` |
| Explicit locale-prefixed routes; `next-intl` + Supabase proxy composition | DECIDED; IMPLEMENTED | Deterministic bilingual navigation and auth | ADR-005/006; `i18n/*`; `proxy.ts` |
| Campaign authorization before shared realtime | DECIDED; IMPLEMENTED | No cross-campaign leakage | ADR-007; `CAMPAIGN_RLS_MATRIX.md` |
| Game rules isolated to per-system modules | DECIDED; IMPLEMENTED | Avoid premature universal dice engine | ADR-008; `DICE_ROLLS.md` |
| LiveKit only for current campaign Game Room | DECIDED; IMPLEMENTED | Managed infrastructure for agreed private calls; standalone rooms not committed | ADR-009; `TTRPG_LIVEKIT_CAMPAIGN_INTEGRATION_ARCHITECTURE_V1.md` |
| Game Room + Game Sessions/Journal/Campaign Dice independent from LiveKit | DECIDED; IMPLEMENTED | Non-media collaboration works without video Join/Leave | `ARCHITECTURE.md`, Phase 4D2 migrations |
| Journal persistent only under active exact Game Session | DECIDED; IMPLEMENTED | Prevent crossing End→Start races and unauthorized forged entries | `DATABASE.md`, Campaign Dice RPC |
| Gallery image-only; category never grants access | DECIDED; IMPLEMENTED | Keep present scope narrow; no documents/NPC database | `CAMPAIGNS.md`; Gallery migrations |
| Owner-private Notes; no realtime/sharing | DECIDED; IMPLEMENTED | Avoid scope creep and privacy ambiguity | Phase 4G migrations; Roadmap |
| GM computer-audio track separate from mic/video; safe capture | DECIDED; IMPLEMENTED; acceptance pending | Prevent unintended system/video/own-voice capture | `lib/campaign-video/browser/computer-audio.ts`; Roadmap |
| Diagnostics protected global Developer **and** active campaign GM | DECIDED; IMPLEMENTED | Global internal role must not bypass campaign authority | `DEVELOPER_DIAGNOSTICS.md` |
| Diagnostics stats only, finite retention, strictly whitelisted ZIP | DECIDED; IMPLEMENTED | Debug media quality without content/media surveillance | `DEVELOPER_DIAGNOSTICS.md`; diagnostics migrations |
| No new product features in Phase 5A/5B; visual styling deferred to Phase 6 | DECIDED; PLANNED | UX technical foundation before artistic design | `ROADMAP.md`; `DESIGN_SYSTEM.md` |

## 11. Functional Requirements Preserved

**Campaign & GM/Player:** one permanent campaign GM; at most six Players with stable `display_order`; secure invitation acceptance; completion freezes collaboration according to documented lifecycle; no GM membership duplication. Manage participation from authoritative server rules, not visual state.

**Game Room:** route `/{locale}/campaigns/{id}/game-room` may open without joining LiveKit or beginning Game Session. Current tools use `Journal | Gallery | Dice | Characters | Notes`, with Journal default. Gallery opens directly to Handouts; CoC Dice defaults to Percentile, VtM Dice has no false submenu. GM session Start/End, journal events, Gallery sharing, Notes and Character integration remain intact. Card order is independent of provider presence; no unexpected two-row tool wrapping or horizontal page scrolling. Existing layout and media controls are documented in `DESIGN_SYSTEM.md` and must be reviewed, not silently overwritten.

**Media:** LiveKit join/leave is voluntary; user mic/camera controls local; participant cards maintain slots; GM image Share requires media presence; computer audio is optional, audio-only source `ScreenShareAudio`, not hidden desktop video capture. Chrome/Edge native picker determines actual capture; forbid unverified/unsafe capture fallback. Player receives only intended media. Do not change provider or token policy as a side effect of Phase 5 UI work.

**Characters / Dice / Notes:** preserve owner-only edits, exact assigned GM read-only, cross-system exclusion and active-session locks; personal dice history remains private/non-authoritative, campaign rolls server-authoritative and exact-session; owner-private plain-text Notes, no shared/GM special Notes. Gallery images do not become general Handouts/NPC records.

**Developer UI:** a header wrench next to Developer account, small panel decorative wrench left/X right; **no** visible “Developer Tools” heading; display campaign name **without `Campaign:` prefix**, `Players: N`, `Start diagnostics`, full Developer-local `Now`/`Started` timestamps and HH:MM:SS duration, GM/Player N rows with name or `—` and right-aligned status; X invokes Stop/export and closes on success, stays/retries on failure. Player notification English-only, no controls. `✓` means fresh validated progress, **not** a “good video” rating.

**UI constraints for Phase 5A:** keep function and security semantics, improve usability/layout/navigation/information hierarchy/responsive behavior/accessibility/states, not new application capabilities. Both locales must remain usable (including long RU labels and mobile). No final theme/typography/palette decision until Phase 6.

## 12. User Requirements and Working Preferences

- **Russian** conversational project discussion, precise terms and clear verification boundaries; **English** Codex task prompts and all code/comments/code-block technical instructions. Avoid unnecessary Russian/English mixing in Russian explanations.
- **Windows CMD** paths and commands. Use successive medium-sized steps, not extremely granular one-liners or huge unapproved development dumps. For significant file replacement, inspect current version first and prefer complete safe replacements when needed.
- **ChatGPT:** requirements discussion, decisions, task wording, report review and, **by explicit user command only**, authors one Handoff at the **very end of each working conversation**. **Codex:** code, documentation, repository/GitHub operations. Do not assign Handoff authorship to Codex.
- Work pattern: implement/report changes via Codex, update persistent documentation **before** handoff, then ChatGPT creates exactly **one** next numbered `HXXX_CURRENT_HANDOFF.md`. Earlier Handoffs remain historical. After downloading, user puts it in project files / repository through the established workflow and moves both ChatGPT and Codex to next conversations. A PR or phase end **alone** does not trigger a handoff.
- **Minimal Delta Verification**. Do not reflexively rerun successful build, broad tests, DB audits or multi-user testing; test **only affected behavior or a demonstrated defect**. Never open unrelated issues. User has explicitly postponed Computer Audio and Diagnostics multi-user tests until actual game.
- Correctness, maintainability, stable architectural/security rules and source-of-truth precedence first. Do not invent results or fill missing fields. No secrets, raw backend errors, raw protected IDs or leak-prone debugging UI.
- Do not merge/deploy/modify Production beyond a specifically approved task. Never destroy existing characters/Notes/Storage or touch retained test project without explicit approval. No Phase 5 implementation until requirements agreed.

## 13. Localization State

| Area | Current facts / status |
|---|---|
| Locales | `en`, `ru`; default `en` — IMPLEMENTED |
| Routing | `i18n/routing.ts`: `localePrefix: "always"`; locale cookie one year; navigate with `i18n/navigation.ts` helpers; no manual `/en`/`/ru` path concatenation |
| Dictionaries | `messages/en.json`, `messages/ru.json` (common); `messages/en|ru/vtm-v5.json` and `messages/en|ru/call-of-cthulhu-7e.json` — IMPLEMENTED |
| Request merge | `i18n/request.ts` merges common + VtM + CoC dictionaries into `next-intl` request messages |
| Namespaces | `next-intl` common/site/campaign namespaces and per-system keys. Example verified UI namespaces `CampaignGameRoom`, `CampaignHandouts`, `Coc7eDiceRoller`. Do not claim a full namespace audit was performed for H014. |
| Metadata | Root metadataBase uses canonical site config; locale layout titles/descriptions; route-specific canonical/alternate SEO tags remain PLANNED |
| Technical auth route | `/auth/confirm` deliberately unprefixed; locale-aware redirect to app; Preview Auth requires separate permission |
| Site locale vs sheet language | Route locale currently governs both VtM/CoC labels and application UI; independent per-sheet language Proposed in ADR-003, NOT IMPLEMENTED |
| Developer exception | Typed `lib/developer/english.ts` string module: developer panel and Player notice English-only, outside EN/RU dictionaries; local timestamps use English month names |
| Outstanding translation cleanup | Some older unused standalone keys might retain older terminology; no confirmed current visible missing strings. **UNVERIFIED**: exhaustive latest dictionary key-parity audit after PR #75; do not manufacture a PASS. |

## 14. Verification Evidence

| Scope | Evidence / result | Limits |
|---|---|---|
| PR #73 Developer Diagnostics | Codex: six local forward migrations, diagnostics test suite, DB assertions, targeted media regression, TS/lint/build/CI/Preview PASS; subsequent UI delta 30/30 diagnostics PASS | Automated checks are not real multiuser acceptance |
| PR #73 Production rollout | Codex: 6/6 diagnostics migrations, RLS/grants/Realtime/bucket; role assigned only to verified account; Cron cleanup HTTP 200, 5-min interval; unauthorized diagnostics 401, cleanup 403, invalid GET cleanup 405; deployment READY | Production verification reported by Codex; no secret or user UUID disclosed |
| PR #74 bugfix | Focused RED→GREEN regression, 28 checks PASS; TS/lint/CI PASS; no-run owner/state works in Production | No DB/role/Storage behavior otherwise changed |
| Diagnostic ZIP from user | **Directly inspected** file from 2026-10-14: 14,015 bytes; run `complete`, `partial=false`; one GM, one finished segment, 172 combined records, 16 two-second cadence samples reported; `missing_clients=[]`, `data_gaps=[]`, segment `error=null`; GM camera enabled, no other user | Zero observed transfer during samples is **not** proof of broken camera with no subscribers; no Player/computer-audio telemetry. ZIP `errors.ndjson` contains segment summary and empty missing-chunks array, **not** collection failures |
| PR #75 docs-only | Codex: 29 documents reviewed, 22 existing Markdown files changed, GitHub homepage corrected, PR squash merged, CI/Preview PASS | No app code/database change |
| Current Production | PR #75 doc-only deployment `dpl_6455yV8o3gY8VzoTAxgoPfqDBiUf` READY, `ttrpg.fans` on `26da428…`; earlier app deployment READY | As reported in final Codex release summary; no manual logged-in browser in this ChatGPT turn |
| Local Git | `git branch --show-current`, `git status --short --branch`, `git rev-parse HEAD`, `git rev-parse origin/main`, `git log -1 --stat --oneline`: exact main SHA and clean | Direct user-provided Windows CMD output |
| Local build | `npm run build` PASS: optimized build compiled 4.6 s, TypeScript 4.2 s, page-data 2.7 s, 44/44 pages, final optimization 17 ms | Build does not prove every UI scenario; user `git status --short --branch` remained clean |
| Routes | Build route listing includes locale campaign/notes/characters/gallery/game-room, personal rollers, `/api/diagnostics`, `/chunks`, `/export`, internal cleanup; Codex earlier smoke checked EN/RU 200, login/account redirects | No new manual acceptance in this handoff turn |

**Not performed / explicitly postponed:** simultaneous Developer/GM+Player collection, camera actively streamed to a subscriber, multi-machine GM computer-audio isolation/echo and native picker tests, any 3–6 hour telemetry endurance study. They are **not blockers** for Phase 5A.

## 15. Git State

**VERIFIED at time of handoff (2026-10-14):**

```text
origin: https://github.com/Andrey-0101/ttrpg-website.git
branch: main
HEAD:        26da4289f41620b3265854ce1138a5f1e0ea9904
origin/main: 26da4289f41620b3265854ce1138a5f1e0ea9904
ahead/behind: 0/0
status: ## main...origin/main
tracked modified/deleted files: none reported
untracked files: none reported
last commit: 26da428 Synchronize project documentation after diagnostics Production releases (#75)
push: confirmed by synced refs / merged PR #75
Production deployment: dpl_6455yV8o3gY8VzoTAxgoPfqDBiUf — READY
```

The final PR #75 changed **22 existing Markdown** files (`296 insertions`, `184 deletions`), **not app code**. The user ran `npm run build` successfully and the immediate subsequent status remained `## main...origin/main`. **H014 creation takes place in ChatGPT's artifact area, not the user's Git working tree**: this document is **NOT YET a Git commit, remote file, or deployment**. If user/Codex later stores H014 in GitHub, that new documentation commit will supersede the precise `main` SHA in this snapshot while leaving application behavior unchanged; new chat must check actual Git state and not mistake the expected handoff commit for a feature change.

## 16. Known Problems and Risks

| Severity | Problem | Impact | Mitigation | Status |
|---|---|---|---|---|
| Low / acceptance gap | Computer Audio real two-machine Windows Chrome/Edge isolation, sound and echo unverified | Cannot assert full capture quality/safety in actual games | Evaluate only during a future real gaming session; no separate test cycle now | PENDING / NON-BLOCKING |
| Low / acceptance gap | Developer Diagnostics only GM-only ZIP verified | Does not prove multi-user metric collection or subscriber-side video quality | Inspect diagnostics during a real game if desired | PENDING / NON-BLOCKING |
| Low | CoC personal-history UI shows current + four previous, not current + five previous | Minor visible history discrepancy | Fix only if separately approved | DEFERRED / unverified root cause |
| Informational | Supabase leaked-password protection disabled and known advisor warnings (character policy performance, intentional SECURITY DEFINER, informational indexes/FKs) | Public readiness/performance considerations, not Phase 5 gate | Retain for approved maintenance/Public Readiness; do not indiscriminately change | KNOWN / DEFERRED |
| Informational | VtM combined Touchstones/Convictions editor stores lines in touchstones and empties convictions | Potential semantic fidelity issue for separately modeled fields | Do not change schema/editor without explicit scope | KNOWN / DEFERRED |
| Strategic | Public-readiness legal, security, accessibility/ops gates not completed | No unrestricted public launch | Phase 9 explicit gate | PLANNED |
| Low / operational | H014 has not been added to GitHub by its authoring step | New Codex conversation may not see H014 automatically | Owner supplies this file to both new contexts; any Git publication is separate from content authoring | HANDOFF TRANSFER PENDING |

No currently confirmed blocker to **begin planning Phase 5A**. **Do not** treat the PR #74 already fixed null-run bug as an open defect.

## 17. Superseded Approaches

| Status | Superseded behavior | Current rule |
|---|---|---|
| DEPRECATED | H013 describes Phase 4E as the next roadmap task | Phase 4E Fair Turn Order Dice is complete; next is Phase **5A** |
| DEPRECATED | Old character `private`/`campaign`/`public` visibility model | `characters.visibility` removed; owner-private + exact active assignment grants GM read-only |
| DEPRECATED | Showing raw backend `error.message` to browser | Safe localized errors or typed English-only developer error states |
| DEPRECATED | Storing image bytes/Base64 inside character JSONB | Private Storage paths + signed delivery |
| DEPRECATED | Duplicating common character fields inside `sheet_data` | Ordinary `characters` columns + versioned system JSONB |
| DEPRECATED | One `useState` per field for large sheet or bypassing schema normalizers | Typed normalized sheet data and centralized editor draft |
| DEPRECATED | Non-localized app routes for public page navigation | Locale-prefixed application routes; `/auth/confirm` remains a technical exception |
| DEPRECATED | Coupling Game Session/Journal/Campaign Dice to video room Join/Leave or storing personal rolls as campaign evidence | Supabase-authenticated independent collaboration and exact-session Journal |
| DEPRECATED | Database assumption: planned tables/columns already exist | Verify pinned migrations/types, and deployed state as necessary |
| DEPRECATED | Treating absent diagnostics run (`JSONB null`) as an object during hash removal | PR #74 guards SQL and JSONB null before `- 'owner_session_hash'` |
| DEPRECATED | Diagnostics TTL of 24 h in early proposals | Only **12 h from server completion** |
| DEPRECATED | Suggesting broad pre-Phase-5 test loops/endurance gates | User postponed optional real multi-user acceptance to normal gaming sessions |
| DEPRECATED | Asking Codex to *author* the end-of-chat Handoff | ChatGPT authors **one** on explicit user command at end; Codex owns repository/doc/code operations |

## 18. Open Questions

| Question | Blocking Phase 5A planning? | Current options | Recommended decision point |
|---|---|---|---|
| Which existing Campaign Overview and Game Room UX issues deserve Phase 5A changes, and in what order? | **No** (this **is** the next planning task) | Navigation/layout, responsive behavior, information hierarchy, accessibility, usability, states | Review actual current UI with owner, choose and approve bounded changes sequentially |
| How to prioritize Phase 5A deliverables? | No | Small separately accepted slices versus larger coherent UX update | After owner describes pain points and intended result |
| Should future sheet-language independence be implemented? | No; outside Phase 5A | Proposed ADR-003; later independent project decision | Separate future scope, not during technical UI refinement |
| Final visual identity/tokens/fonts/themes? | No | Intentionally undecided | **Phase 6**, after 5A/5B |
| When are multi-user Computer Audio/Diagnostics accepted? | No | Real game session, not standalone test event | Next naturally occurring gaming session |
| Is a standalone Video Rooms product needed? | No | Uncommitted idea only | New independent product review if requested; not Phase 5A |

No unanswered core authorization/schema decision prevents Phase 5A planning. Do not invent additional blockers.

## 19. Exact Next Task

**One next task: Discuss and approve the scope of Phase 5A — Campaign & Game Room UX/UI Refinement, starting with a focused review of the existing Campaign Overview → Game Room user journey.**

- **Goal:** identify and agree **which existing UX/UI interactions** should be refined, their expected behavior and boundaries; not write code.
- **Required inputs:** owner's real usage observations/preferences; screenshots or descriptions **only where relevant and useful**; current `ROADMAP.md`, `DESIGN_SYSTEM.md`, `SITE_STRUCTURE_CURRENT.md`, `CAMPAIGNS.md`, current Game Room/Overview UI code when a concrete decision requires it.
- **First files:** `PROJECT_CONTEXT.md` (current boundaries), `docs/product/ROADMAP.md` (Phase 5A), `docs/architecture/DESIGN_SYSTEM.md`, `docs/product/SITE_STRUCTURE_CURRENT.md`, `app/[locale]/campaigns/[id]/page.tsx`, `app/[locale]/campaigns/[id]/game-room/page.tsx` and `components/campaigns/campaign-game-room*.tsx` **selectively**.
- **Dependencies:** no DB migration, no extra Production acceptance, no new tooling. Confirm latest Git revision as a short preflight only.
- **Completion criteria for this planning step:** user agrees a bounded Phase 5A UX/UI change set and a sensible implementation order; Codex execution task is prepared only after approval.
- **Exclusions:** no feature implementation, Phase 5B site-wide refactoring, Phase 6 art direction, media instrumentation changes, extra tests, new product features, auth/schema/infrastructure modifications or scope expansion.

## 20. Resume Procedure

1. Open the new ChatGPT conversation **inside project TTRPG_website**; provide H014 if it is not already available in Project files. Begin a new Codex session using the same H014 and repository.
2. In Codex/Windows CMD, confirm `main`, `HEAD`, `origin/main`, and status (below). If a subsequent H014 documentation commit exists, **use that actual commit** and acknowledge it as documentation-only, not a new feature.
3. Read `PROJECT_CONTEXT.md`, `ROADMAP.md` Phase 5A, `DESIGN_SYSTEM.md`, `SITE_STRUCTURE_CURRENT.md`; refer to H014 for the exact historical transition and to current code for implemented behavior.
4. Ask the owner for the first Campaign/Game Room UX pain point or start a focused comparison of actual existing navigation with the agreed Phase 5A goals. Proceed **one bounded decision at a time**.
5. Document accepted choices; only after explicit approval draft a narrow **English Codex** implementation task. Do not preemptively write code, start tests, reopen diagnostics acceptance, or generate another Handoff.

## 21. Useful Commands (Windows CMD)

```cmd
cd /d C:\Projects\ttrpg-website
git fetch origin
git branch --show-current
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git log -1 --oneline
```

These are **start-of-next-session identification commands**, not an instruction to run repeated build/test suites. The **current** `npm run build` PASS at `26da428…` is recorded above; rerun only when later code changes can invalidate it. Do not paste `.env` or secret output.

## 22. References

- Repository: `https://github.com/Andrey-0101/ttrpg-website` (exact inspected revision `26da4289f41620b3265854ce1138a5f1e0ea9904`).
- Production: `https://ttrpg.fans`.
- Project context: [`PROJECT_CONTEXT.md`](https://github.com/Andrey-0101/ttrpg-website/blob/26da4289f41620b3265854ce1138a5f1e0ea9904/PROJECT_CONTEXT.md).
- Historical handoff: `docs/handoffs/H013_CURRENT_HANDOFF.md`; **this** file is `H014_CURRENT_HANDOFF.md` until transferred, not yet present at Git HEAD.
- Documentation index: `docs/README.md`.
- Product: `docs/product/ROADMAP.md`, `CAMPAIGNS.md`, `SITE_STRUCTURE_CURRENT.md`, `SITE_STRUCTURE_TARGET.md`, `SITE_STRUCTURE_COMPARISON.md`, `IDEAS_BACKLOG.md`, `DICE_ROLLS.md`.
- Architecture: `docs/architecture/ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `DATABASE.md`, `SECURITY.md`, `I18N.md`, `CHARACTER_SHEETS.md`, `CAMPAIGN_RLS_MATRIX.md`, `DEVELOPER_DIAGNOSTICS.md`, `TTRPG_LIVEKIT_CAMPAIGN_INTEGRATION_ARCHITECTURE_V1.md`.
- Database: `supabase/migrations/` (all 30 migrations at pinned commit), `types/database.types.ts`; current diagnostics fix `20261014102003_handle_diagnostic_dispatch_null.sql`.
- ADRs: `docs/decisions/ADR-001...ADR-009` and `docs/decisions/README.md` (ADR-003 **Proposed**).
- Deployment PRs: [#73](https://github.com/Andrey-0101/ttrpg-website/pull/73), [#74](https://github.com/Andrey-0101/ttrpg-website/pull/74), [#75](https://github.com/Andrey-0101/ttrpg-website/pull/75); earlier audio PRs [#71](https://github.com/Andrey-0101/ttrpg-website/pull/71), [#72](https://github.com/Andrey-0101/ttrpg-website/pull/72).
- Inspected ZIP (in **this** ChatGPT conversation only, not Git): `diagnostics-2026-10-14T12-14-59-709334+00-00-1b76f34d-b7db-47e3-938a-4b7fb434e733.zip`. The new chat should not assume this upload is automatically available unless passed/shared explicitly. It is **not necessary** to plan Phase 5A.

## 23. Suggested Updates to Permanent Documents

The PR #75 synchronization was completed **before** H014. On the pinned revision, there are **no newly discovered content changes required** for the documents below; do not repeat that work.

| Document | Recommendation / rationale |
|---|---|
| `PROJECT_CONTEXT.md` | **NO CHANGE** — PR #75 updated Phase 4, diagnostic release, audio sharing, Phase 5 status and next task |
| `docs/architecture/ARCHITECTURE.md` | **NO CHANGE** — current deployed boundaries represented |
| `docs/architecture/DATABASE.md` | **NO CHANGE** — 30 applied migrations and new diagnostics entities documented |
| `docs/architecture/I18N.md` | **NO CHANGE** — current bilingual dictionaries and Developer English-only exception |
| `docs/architecture/CHARACTER_SHEETS.md` | **NO CHANGE** — implemented VtM/CoC versions and GM access |
| `docs/product/ROADMAP.md` | **NO CHANGE** — 5A/5B PLANNED/NOT STARTED; current pre-5 statuses correctly recorded |
| `docs/architecture/DEVELOPER_DIAGNOSTICS.md` | **NO CHANGE** — deployment, first GM ZIP and acceptance boundary recorded |
| `docs/architecture/SECURITY.md`, `DESIGN_SYSTEM.md` | **NO CHANGE** — correct phase/security boundaries |
| ADR-001…ADR-009 | **NO CHANGE** — no newly approved architecture decision in this handoff requires a revision |
| `docs/README.md` and latest-handoff pointer | **Future mechanical update only if H014 is later added to GitHub:** point to H014, leave H001–H013 unchanged; do **not** generate a separate handoff or reopen PR #75 |

## 24. Suggested Opening Message for the Next Chat

> Продолжаем проект **TTRPG_website / ttrpg-website**: `https://github.com/Andrey-0101/ttrpg-website`. Актуальная точка передачи — **H014_CURRENT_HANDOFF.md** (прилагаю; исходный зафиксированный `main`: `26da4289f41620b3265854ce1138a5f1e0ea9904`). Phase 4 закрыта и принята, Diagnostics/GM Computer Audio Sharing развёрнуты, дополнительные multi-user проверки отложены до реальной игры. **Следующий этап: Phase 5A — Campaign & Game Room UX/UI Refinement, PLANNED/NOT STARTED.** Первая задача — обсудить и согласовать изменения UX/UI существующего интерфейса кампании и Game Room, **не начинать реализацию**. Сначала сверь текущие `HEAD`/`origin/main`, прочитай H014, `PROJECT_CONTEXT.md`, Phase 5A в Roadmap и соответствующие актуальные файлы; не используй старые версии кода из прежних чатов. Изменения кода/документации/GitHub выполняет Codex. Новый Handoff создаёт ChatGPT только по моей команде при завершении следующего чата.

## 25. Handoff Quality Check

- **VERIFIED:** source revision `26da428…`; main/remote equal, worktree clean after local successful build; user-provided deployment READY; H013 last **repo** handoff at that commit, H014 being authored by ChatGPT outside repo.
- **VERIFIED:** current code/docs/migrations/types pinned to that SHA; JSONB-null PR #74 fix present in forward migration; Developer role/cleanup deployed per Codex Production evidence; no value of any secret reproduced.
- **VERIFIED:** Phase 4 accepted and Phase 5A/5B NOT STARTED; no planned feature has been represented as implemented.
- **VERIFIED:** actual GM-only ZIP independently examined; successful partial scope not confused with full multi-user acceptance. Camera was on; no subscriber, so previous zero outgoing bitrate is **not** labeled a confirmed defect.
- **DECIDED:** exactly one ChatGPT-authored handoff at end of chat on explicit command; Codex does repository/implementation/documentation, not handoff authorship; current PR #75 documentation already synchronized.
- **UNVERIFIED where appropriate:** future infrastructure drift, exact protected credentials, future full multi-user media quality and every possibly stale translation key. These are **not** prerequisites for Phase 5A discussion.
- **VERIFIED:** only **one exact next task** (Phase 5A UX/UI scope agreement); no separate test cycle, no immediate code/DB work, no duplicate Handoff and no uncommitted application source.
- No secrets, API keys, passwords, tokens, `.env` values, personal Auth UUIDs or raw media included. Paths in this document are references, not a claim that every path was manually retested at runtime.

**End of H014 — resume at Phase 5A planning after checking actual latest Git state.**
