# Project Context

## Document control

| Field | Value |
|---|---|
| Project | Web_Site_TTRPG / ttrpg-website |
| Repository | `Andrey-0101/ttrpg-website` |
| Document status | Current synchronized project context |
| Last reviewed | 2026-10-14 |
| Application release baseline | `main` at `b5f20bfc2b8c025644375ae41e687d692d899c83` (PR #74; documentation-only commits may follow) |
| Application-release deployment | `dpl_2SU3Zx16EXc6ss9SCNWSuL1kBk6c`, READY before this documentation synchronization |
| Release state | Phase 4 CLOSED / DEPLOYED / ACCEPTED; Developer Diagnostics PR #73 and null-handling fix PR #74 merged/deployed |
| Canonical production domain | `https://ttrpg.fans` |
| Domain redirect | `https://www.ttrpg.fans` permanently redirects to `https://ttrpg.fans` |
| Technical deployment address | `https://ttrpg-website-xi.vercel.app` |
| Next stage | Phase 5A Campaign & Game Room UX/UI Refinement; Phase 5A and 5B PLANNED / NOT STARTED |
| Current audience | Small invited group of friends |

## Release-state boundaries

### Verified production baseline

The application release baseline is `b5f20bfc2b8c025644375ae41e687d692d899c83`. [PR #73](https://github.com/Andrey-0101/ttrpg-website/pull/73) deployed Developer Diagnostics and [PR #74](https://github.com/Andrey-0101/ttrpg-website/pull/74) fixed JSONB null/SQL NULL dispatch while preserving object `owner_session_hash` removal and authorization. Both are merged. The recorded READY deployment identifies this application release; later documentation-only commits/deployments are distinct. [H014](docs/handoffs/H014_CURRENT_HANDOFF.md) is the latest chronological handoff, published unchanged from the supplied file; its snapshot and not-yet-committed statements describe authoring time. Current code and later verified releases override historical snapshot claims. H001–H013 remain unchanged historical records. ChatGPT authors a new handoff only on the Product Owner's explicit request at conversation closure.

The canonical production origin is `https://ttrpg.fans`; `https://www.ttrpg.fans` permanently redirects to the apex domain. Phase 4A–4G, membership synchronization and character-access maintenance are CLOSED / DEPLOYED / ACCEPTED. Phase 4D2 keeps Game Room, Game Session, Journal, and Campaign Dice independent from LiveKit; only video/audio and Gallery presentation use LiveKit. Its multi-user Production acceptance and focused final navigation re-test passed. The Gallery has four fixed image-only sections and opens directly in Handouts. Quantitative packet-loss, latency, jitter, and connection-quality telemetry was not collected for the earlier video group test and must not be inferred. Standalone Video Rooms remain an uncommitted backlog idea.

GM Computer Audio Sharing is IMPLEMENTED / DEPLOYED / MANUAL PRODUCTION ACCEPTANCE PENDING. Real multi-user audio isolation/echo acceptance is deferred until an actual gaming session and does not block Phase 5A planning.

Developer Diagnostics is DEPLOYED / MANUAL MULTI-USER ACCEPTANCE PENDING. The verified Product Owner received the protected global role and successfully opened the wrench panel, recorded one real GM-only run and exported a ZIP inspected in ChatGPT. GM-side collection, structured records and Stop/export succeeded with no reported collection errors; no other participant was present. This does not prove distributed collection. Production migrations, private Storage and five-minute pg_cron → pg_net → Vault/protected POST cleanup are configured; TTL is 12 hours after server completion. Further real-group diagnostics/audio acceptance is postponed. See [DEVELOPER_DIAGNOSTICS.md](docs/architecture/DEVELOPER_DIAGNOSTICS.md).

### Historical Phase 4D1 UX follow-up release

PR #47 deployed validated, reload-safe contextual Back destinations for personal roller routes; moved personal history from the generic catalogue to its VtM, Custom, or combined CoC roller page; exposed up to five previous results per roller kind without duplicating the current result; scoped Clear History to the current roller; and added a live deterministic CoC Target success-range guide. Production guest/runtime and later authenticated persistence acceptance passed. The accepted known exception is the deferred CoC display issue: current plus four previous instead of current plus five previous.

The first two Phase 4D1 migrations established the extensible envelope, per-kind prospective retention, owner-and-kind query index, and authenticated owner-scoped clearing by a validated set of roller kinds. Both passed local reset, pgTAP, and concurrency verification before controlled application. The generic table, RLS, idempotency, and existing RPC signatures remain intact.

### Phase 4D1 final roll-label/history refinement

VtM, Custom, CoC Percentile, and CoC Other Dice each support an optional Roll Label as the first settings control. The two CoC panels keep independent label state. Labels use the shared 120-Unicode-code-point normalizer, and every personal-history entry renders the normalized label or `No label` / `Без метки`. Custom and CoC store labels as additive `request_data` JSON metadata, so older unlabeled rows remain valid.

History remains scoped to the roller page. VtM and Custom retain six rows each. CoC retains six rows total across `coc_7e_percentile` and `coc_7e_other_dice`, and its UI is intended to show one combined chronological list of at most five previous rolls while keeping each panel's current result separate. The known current display issue is four previous plus current; its root cause remains unverified and deferred. Phase 4D2 Campaign Dice is a separate server-authoritative, exact-session Journal path and never reuses personal history.

Phase 4D1 follow-up evidence records 260/260 dice tests, 13/13 site-URL tests, 40/40 Campaign/Gallery/catalogue tests, 53/53 Campaign Video/Game Room tests, 273 local database assertions, the required concurrency checks, ESLint, TypeScript, EN/RU key parity, and a 38/38-page production build as passing. Preview and Production guest EN/RU browser acceptance passed, including contextual navigation, target bands, and mobile containment. Authenticated Production history acceptance later passed with the known deferred CoC display-count issue. Production runtime logs showed no current 500-level or error-level entries attributable to the release. Both production-only and full npm audits reported zero vulnerabilities.

These test counts, runtime-log observations and npm audit results are historical Phase 4D1 evidence, not a current audit or repeated verification.

Historical release history (later releases are recorded above and in current product/architecture documents):

| PR | Accepted outcome |
|---|---|
| #28 | Campaign-video data foundation, Production migrations, and LiveKit configuration |
| #29 | CoC campaign shell with system-exact character compatibility |
| #30 | Campaign-creation navigation and submission correction |
| #31 | Dedicated localized Campaign Game Room route |
| #32 | Three-column composition and stable seven-slot layout |
| #33 | Responsive FullHD, QHD, 4K, tablet, and mobile behavior |
| #34 | Final accepted video-card UX and Production presentation |
| #43 | GM-controlled Campaign Gallery image presentation in the Game Room |
| #44 | Desktop Expand participant-card restoration, manually re-tested and accepted in Production |
| #46 | Phase 4D1 CoC 7e personal Dice Roller, extensible personal-history envelope, and Production release |

## Purpose

The project is a bilingual TTRPG hub. Its first complete game-system implementation is Vampire: The Masquerade Fifth Edition. The near-term goal is not to build a complete public virtual tabletop. The near-term goal is to make a reliable private toolset for a small gaming group and use real play to guide later development.

The intended progression is:

1. completed architecture, character, and campaign foundations;
2. completed Phase 4 Core Play & Campaign Tools and separately deployed pre-Phase-5 add-ons;
3. Phase 5A Campaign & Game Room UX/UI Refinement, then Phase 5B Site-wide UI Technical Refinement — both PLANNED / NOT STARTED, with no new product capabilities;
4. Phase 6 Visual Identity;
5. Phase 7 Delta Green system parity;
6. Phase 8 system hubs in CoC, Delta Green, then Vampire order;
7. Phase 9 Public Readiness.

The current implementation targets Vampire: The Masquerade V5. White Wolf announced V6 in July 2026 while it is still in alpha with materially different mechanics and no announced release date. A possible V5-to-V6 migration or replacement before public release is a planning dependency, not an accepted migration decision.

## Source-of-truth order

When information conflicts, use this priority:

1. code at the exact Git commit being changed;
2. SQL migrations committed to the repository;
3. generated database types;
4. verified Supabase and Vercel behavior;
5. accepted ADRs;
6. latest approved Product Owner scope and acceptance decisions;
7. synchronized permanent project documentation;
8. chronological handoffs for continuity, latest `docs/handoffs/H014_CURRENT_HANDOFF.md`; H001–H013 remain historical, and current code and later verified releases override snapshot claims;
9. superseded plans and old snippets.

A discussed or planned object is not implemented unless it exists in code, migrations, generated types, or verified infrastructure.

## Current verified application state

### Platform

- Next.js 16.3.3 App Router
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- `next-intl` 4.13.0
- Supabase PostgreSQL, Auth, RLS, and Storage
- Vercel deployment
- canonical production domain `https://ttrpg.fans`
- permanent `www.ttrpg.fans` to apex redirect
- GitHub source control

Vercel `*.vercel.app` URLs remain technical deployment addresses. Application-generated production links prefer the configured canonical public origin.

### Production configuration

Domains, Auth and LiveKit configuration were established in earlier releases; their historical verification is not a new audit. PR #73 completed diagnostics Production migrations, private Storage, pg_net, Vault/server-only credentials, scheduled cleanup and the verified Product Owner role grant. PR #74 changed only null dispatch handling. The Vercel Function region remains in repository configuration.

Required Production variable names, without values:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
SUPABASE_SECRET_KEY
DIAGNOSTIC_CLEANUP_SECRET
```

Vercel state:

- `https://ttrpg.fans` is attached to the production project;
- `https://www.ttrpg.fans` permanently redirects to the apex domain;
- TLS succeeds for both domains;
- both addresses resolve successfully to the localized production site;
- Vercel-generated domains remain technical deployment addresses;
- `vercel.json` pins Vercel Function compute to Tokyo (`hnd1`);
- Supabase Production remains in Tokyo (`ap-northeast-1`).

Vercel Function compute previously used the default Virginia region (`iad1`). After the Production project was changed and redeployed in Tokyo, a small low-volume comparison measured an overall median TTFB decrease from approximately 0.683 seconds to 0.477 seconds, about 30%.

Hosted Supabase Auth state:

- the Site URL is `https://ttrpg.fans`;
- production and local redirect allowlist entries are configured;
- the canonical production callback is allowed;
- arbitrary Vercel Preview authentication is not currently enabled.

The hosted settings other than the Function region remain external to the repository. The region configuration contains no secret values. Production Supabase is `ttrpg-website` / `nryzkqwcnbbneazaksgh`; separate `ttrpg-website-m4e-test` / `sijgmybepesinijyspjm` is intentionally retained. Do not delete, pause or modify the test project without a separate future decision.

### Locales

- English: `en`
- Russian: `ru`
- Locale prefix is always present for application routes.
- The locale cookie is retained for one year.
- The technical `/auth/confirm` route remains outside locale-prefixed application routes.
- Character-sheet labels currently follow the route locale.
- Independent sheet language is an accepted concept but is not implemented.

### Authentication and profiles

Implemented:

- registration;
- login;
- email confirmation callback;
- session persistence;
- logout;
- profile view and editing;
- localized safe user-facing errors.

### Characters

Implemented:

- character list;
- character creation;
- character detail;
- view/edit modes;
- explicit save;
- clear form;
- delete;
- private portraits;
- VtM V5 and CoC 7e summary cards and two-page character workflows;
- responsive layouts.

Character owners alone can edit or delete, subject to active-assignment deletion locks. No character visibility field exists. An eligible active Player assignment grants only the exact active campaign GM read-only sheet/portrait access; other Players, outsiders and anonymous users are denied. One-character-per-Player and Game Session unlink locks remain enforced.

### VtM V5 character sheet

Implemented:

- current schema version `3`;
- typed system-specific sheet data;
- backward normalization;
- two logical pages: `core` and `background`;
- A4-oriented desktop layout;
- content-driven responsive mobile layout;
- identity and portrait;
- Attributes;
- Skills and Specialties;
- Health and Willpower;
- Hunger, Resonance, Humanity, and Stains;
- Disciplines;
- Advantages and Flaws;
- Chronicle Tenets;
- combined Touchstones and Convictions UI;
- Clan Bane;
- Blood Potency details;
- Experience;
- Biography;
- Notes.

Known semantic limitation:

- editing the combined Touchstones and Convictions field currently stores all lines in `touchstones` and clears `convictions`.

### Portraits

Implemented:

- private bucket `character-portraits`;
- JPEG, PNG, and WebP;
- 5 MB maximum;
- owner-folder Storage policies;
- signed display URLs;
- upload, replacement, removal, and best-effort cleanup.

Known limitation:

- cleanup failures may leave orphaned Storage objects;
- a selected unsaved `File` is not preserved in `sessionStorage`.

## Current database baseline

Repository migrations:

```text
supabase/migrations/20260630143000_initial_schema.sql
supabase/migrations/20260702150000_character_portraits.sql
supabase/migrations/20260709150000_campaign_foundation.sql
supabase/migrations/20260709163000_fix_campaign_select_policy.sql
supabase/migrations/20260709170000_fix_campaign_character_trigger_security.sql
supabase/migrations/20260722103835_personal_dice_persistence.sql
supabase/migrations/20260822190351_campaign_video_data_foundation.sql
supabase/migrations/20260823143856_harden_campaign_database_grants.sql
supabase/migrations/20260902132447_allow_completed_campaign_image_cleanup.sql
supabase/migrations/20260903000242_campaign_gallery_categories.sql
supabase/migrations/20260905171520_make_personal_roll_history_extensible.sql
supabase/migrations/20260907114535_scope_personal_roll_history_by_kind.sql
supabase/migrations/20260908094324_scope_coc_personal_roll_history.sql
supabase/migrations/20260910122247_game_sessions_and_journal.sql
supabase/migrations/20260911120000_campaign_dice_journal.sql
supabase/migrations/20260911120001_bind_campaign_dice_to_expected_session.sql
supabase/migrations/20260911121613_publish_game_session_state_realtime.sql
supabase/migrations/20261002160849_game_room_character_invariants.sql
supabase/migrations/20261004112908_personal_campaign_notes.sql
supabase/migrations/20261004121513_index_personal_notes_campaign.sql
supabase/migrations/20261004151918_campaign_membership_realtime_signal.sql
supabase/migrations/20261004161535_character_assignment_gm_read_access.sql
supabase/migrations/20261004161539_remove_character_visibility.sql
supabase/migrations/20261007130732_developer_game_room_diagnostics.sql
supabase/migrations/20261007130739_diagnostic_autonomous_cleanup.sql
supabase/migrations/20261007132201_diagnostic_registry_hardening.sql
supabase/migrations/20261007133704_diagnostic_completion_guards.sql
supabase/migrations/20261007135836_diagnostic_role_audit_indexes.sql
supabase/migrations/20261007141821_diagnostic_control_visibility.sql
supabase/migrations/20261014102003_handle_diagnostic_dispatch_null.sql
```

Current public tables:

```text
public.profiles
public.characters
public.campaigns
public.campaign_members
public.campaign_invitations
public.campaign_characters
public.custom_dice_presets
public.personal_roll_history
public.campaign_player_publication_permissions
public.campaign_media_groups
public.campaign_media_group_members
public.campaign_media_restrictions
public.campaign_images
public.campaign_image_recipients
public.campaign_video_audit_log
public.game_sessions
public.game_session_journal_events
public.campaign_membership_signals
public.campaign_note_entries
public.system_user_roles
public.game_room_diagnostic_runs
public.game_room_diagnostic_clients
public.game_room_diagnostic_chunks
```

All thirty repository migrations are applied in Production at the PR #74 application release baseline. The eleventh migration, `20260905171520_make_personal_roll_history_extensible.sql`, replaced the two-value `personal_roll_history.roller_kind` constraint with the syntax check `^[a-z][a-z0-9_]{0,63}$` and changed the schema-version constraint to require a positive value; it does not make arbitrary payloads application-supported. The twelfth migration adds owner-and-kind indexing and scoped clearing. The thirteenth changes prospective CoC retention to six rows total across its two kinds while VtM and Custom remain six rows each. The application registry supports schema version 1 for `vtm_v5`, `custom_dice_pool`, `coc_7e_percentile`, and `coc_7e_other_dice`, and safely skips malformed or unsupported history rows.

The seven campaign-video tables use RLS; the five required foreign-key indexes, database grants, and `handle_new_user()` hardening are current. The private `campaign-images` Storage bucket is current. Phase 4C1 uses the existing `campaign_images` and `campaign_image_recipients` tables rather than adding broad Handout, NPC, or Maps tables. `campaign_images.category` is fixed to `handout`, `npc`, `maps_plans`, or `other`; it is immutable organizational metadata and grants no access. Game Sessions/Journal, authoritative Campaign Dice, owner-private Notes, membership invalidation and diagnostics registry are implemented; no standalone provider-room-mapping, document-handout or structured NPC product exists. Personal dice history is private per owner, non-authoritative, and not campaign evidence.

Generated types:

```text
types/database.types.ts
```

Applied migrations must not be edited. Every future database or Storage change must use a new migration.

## Domain boundaries

### Core

Owns:

- authentication;
- profiles;
- locale routing;
- common navigation;
- common error handling;
- shared UI primitives.
- canonical public-origin resolution for metadata and browser-generated links.

### Characters

Owns:

- common character columns;
- character lifecycle;
- portrait lifecycle;
- draft behavior;
- system sheet selection.

### Game systems

Owns system-specific behavior:

- sheet schema and normalizer;
- character-sheet renderer;
- summary renderer;
- game terminology;
- dice rules;
- theme;
- game-hub content.

Implemented system-specific character, dice, and game-area support:

```text
vtm-v5
```

The shared typed catalogue enables deployed CoC campaigns, characters, personal dice and system-aware Game Room tools; its complete Game System Hub remains planned:

```text
call-of-cthulhu-7e
```

The catalogue registers these additional planned systems with no active capabilities or routes:

```text
alien
black-powder-and-brimstone
coriolis
cyberpunk-red
delta-green
forbidden-lands
ironsworn
mothership
paranoia
traveller-mongoose
```

The catalogue is implemented across Games, the System Rollers section, character creation, and campaign creation. Capabilities are independent: enabling the Call of Cthulhu 7e campaign shell does not expose unfinished character, dice, or game-area routes. Custom Dice Pool remains system-neutral and outside the catalogue.

### Campaigns

Implemented.

Owns:

- campaigns;
- one immutable Game Master and Player memberships;
- single-use invitations;
- character assignment;
- campaign navigation;
- campaign lifecycle;
- RLS-backed access checks and read-only character sharing.

Campaign creation supports `vtm-v5` and the system-neutral `call-of-cthulhu-7e` shell. Character assignments remain game-system exact; VtM characters cannot be linked to CoC campaigns. CoC personal dice and its Phase 4D1 UX follow-up are deployed. CoC character sheets and linked Game Room presentation are deployed/accepted; the CoC Game System Hub remains planned for Phase 8A. Keeper-specific tools are not an active roadmap commitment.

### Core play and campaign tools

Phase 4A personal dice is implemented in Production, including the deterministic VtM evaluator, public VtM and Custom rollers, saved Custom presets, and private personal history. Phase 4D1 extends that deployed personal-only boundary with a CoC 7e percentile tool, CoC Other Dice, shared validation and secure randomness, best-effort authenticated history, contextual Back navigation, roller-scoped history, and live CoC Target bands. Phase 4D2 adds the independent Game Session lifecycle, exact-session Journal, Supabase Realtime, and server-authoritative Campaign Dice for VtM V5 and CoC 7e. Campaign-authorized LiveKit video runs as an optional child of the Game Room and does not control those capabilities.

The reusable video core owns the implemented campaign provider integration and media-room behavior behind a campaign-derived authorization adapter. Any future standalone product would require a separate product and authorization review and must not depend on campaigns.

Phase 4C2 Game Room image presentation, the Phase 4D1 UX follow-up, and Phase 4D2 Game Sessions/Campaign Dice are implemented and accepted. Phase 4E, 4F1/4F2 and 4G are also complete and accepted: Fair Turn Order Dice, CoC sheets, embedded linked characters and owner-private Personal Campaign Notes. Neither shared Notes nor a special GM-private area is implemented. Every campaign capability depends on verified campaign access. Personal dice history remains separate and non-authoritative.

### Campaign content

Implemented:

- Phase 4C1 private image-only Campaign Gallery at `/{locale}/campaigns/{campaignId}/gallery`, with four fixed sections, GM upload/access management, and RLS-filtered Player viewing. The former `/handouts` route redirects to `/gallery`.
- Phase 4C2 participant-authorized Gallery browsing inside the Game Room, local image viewing, Share / Stop Share, synchronized Expand / Collapse, responsive participant layouts, late join/rejoin synchronization, and ephemeral clearing when the GM leaves. It reuses private Campaign Gallery signed delivery and adds no presentation persistence or database migration.

Implemented and accepted:

- Phase 4G owner-private plain-text Personal Campaign Notes, accessed from Campaign Overview and Game Room, with search, canonical session metadata and completed/read-only lifecycle. No shared Notes, rich text or Notes Realtime. Global Personal Notes remains deferred as IDEA-008.

General Handouts, NPCs, Sessions, Chronicle records, clues, maps, and other broad campaign-content modules are not active roadmap commitments.

### Game System Hubs

Public or generally accessible game-system information must remain separate from private campaign workspaces. Hubs are planned in Phase 8 in CoC, Delta Green, then Vampire order and may organize only capabilities that already exist.

## Working rules

- Read `AGENTS.md` before Next.js changes.
- Inspect current files before replacing them.
- Use small, verified changes.
- Use Minimal Delta Verification; documentation-only changes need Markdown/link/diff checks, not application test/build reruns.
- Use migrations for database changes.
- Regenerate database types after schema changes.
- Never expose secrets.
- Never show raw backend error messages.
- Preserve existing character records and unknown system data.
- Keep code comments and code-block text in English.
- Do not over-generalize for future systems before a second system exposes real shared requirements.

## Current phase and next task

Phase 4 is CLOSED / DEPLOYED / ACCEPTED, including Phase 4G Personal Campaign Notes and character-access maintenance. VtM V5 and CoC 7e characters, personal/Campaign Dice and linked Game Room tools are deployed.

Campaign-authorized LiveKit video and the responsive Game Room at `/{locale}/campaigns/{campaignId}/game-room` are complete and accepted for one GM plus up to six Players. LiveKit is the accepted provider for this current campaign implementation. The final card design uses responsive 16:9 media, stable participant slots, a compact upper-right label, local-only lower-left media controls, and a header-level Leave action.

The Phase 4C1 image-only Campaign Gallery, Phase 4C2 Game Room Image Presentation, Phase 4D1 CoC 7e personal Dice Roller, and Phase 4D2 Game Sessions/Campaign Dice are complete and accepted in Production. Phase 4D2 multi-user acceptance and the final Journal/Gallery/CoC/VtM navigation re-test passed. The next action is planning/review of Phase 5A Campaign & Game Room UX/UI Refinement, followed by Phase 5B Site-wide UI Technical Refinement. Both are PLANNED / NOT STARTED and add no product capabilities. Phase 6 follows Phase 5 and defines the deliberately undecided Visual Identity, Phase 7 adds Delta Green system parity, Phase 8 adds CoC/Delta Green/Vampire hubs in that order, and Phase 9 is Public Readiness. Standalone Video Rooms and broad document/NPC/Sessions/Chronicle capabilities are not active roadmap commitments.
