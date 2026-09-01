# Project Context

## Document control

| Field | Value |
|---|---|
| Project | Web_Site_TTRPG / ttrpg-website |
| Repository | `Andrey-0101/ttrpg-website` |
| Document status | Current synchronized project context |
| Last reviewed | 2026-09-01 |
| H011 consolidation baseline | `main` at `609b6d9ec972bc842bfc8de4e4080eecdb10d4c8` |
| Verified release | PRs #28–#35 merged; Campaign Game Room accepted in Production and the H010 synchronization deployed `READY` |
| Canonical production domain | `https://ttrpg.fans` |
| Domain redirect | `https://www.ttrpg.fans` permanently redirects to `https://ttrpg.fans` |
| Technical deployment address | `https://ttrpg-website-xi.vercel.app` |
| Current delivery stage | Phase 4B campaign video complete; Phase 4C1 Campaign Image Library is next |
| Current audience | Small invited group of friends |

## Release-state boundaries

### Verified production baseline

H011 consolidation started from the clean, deployed `main` baseline at `609b6d9ec972bc842bfc8de4e4080eecdb10d4c8`. PRs #28 through #34 delivered the campaign-video data foundation, CoC campaign shell, campaign creation fix, dedicated Game Room, responsive seven-slot layout, and final video-card UX; PR #35 published the H010 audit, dependency remediation, documentation synchronization, and CI expansion. The current authoritative publication state is recorded in `docs/handoffs/H011_CURRENT_HANDOFF.md`.

The canonical production origin is `https://ttrpg.fans`; `https://www.ttrpg.fans` permanently redirects to the apex domain. Phase 4A, personal dice persistence, the planned game-system catalogue, the CoC campaign shell, campaign-authorized LiveKit video, and the dedicated responsive Campaign Game Room are implemented and accepted. The last human Production group test passed with one GM and four Players. Quantitative packet-loss, latency, jitter, and connection-quality telemetry was not collected, and no additional media, layout, or human acceptance retest is currently required. Phase 4C1 Campaign Image Library is the next approved product work. Standalone Video Rooms have been removed from the active roadmap and retained only as an uncommitted backlog idea.

Release history relevant to the current baseline:

| PR | Accepted outcome |
|---|---|
| #28 | Campaign-video data foundation, Production migrations, and LiveKit configuration |
| #29 | CoC campaign shell with system-exact character compatibility |
| #30 | Campaign-creation navigation and submission correction |
| #31 | Dedicated localized Campaign Game Room route |
| #32 | Three-column composition and stable seven-slot layout |
| #33 | Responsive FullHD, QHD, 4K, tablet, and mobile behavior |
| #34 | Final accepted video-card UX and Production presentation |

## Purpose

The project is a bilingual TTRPG hub. Its first complete game-system implementation is Vampire: The Masquerade Fifth Edition. The near-term goal is not to build a complete public virtual tabletop. The near-term goal is to make a reliable private toolset for a small gaming group and use real play to guide later development.

The intended progression is:

1. completed architecture, character, and campaign foundations;
2. Phase 4 Core Play & Campaign Tools, with Phase 4C1 Campaign Image Library next;
3. Phase 5 site-wide UI Technical Refinement;
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
6. the current authoritative handoff, `docs/handoffs/H011_CURRENT_HANDOFF.md`;
7. permanent project documentation;
8. current chat decisions;
9. historical handoffs H001–H009 and old snippets.

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

### External production configuration

The production Vercel, LiveKit, and hosted Supabase Auth settings were completed outside the repository and verified for the current PR #34 Production release.

Required Production variable names, without values:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

Vercel state:

- `https://ttrpg.fans` is attached to the production project;
- `https://www.ttrpg.fans` permanently redirects to the apex domain;
- TLS succeeds for both domains;
- both addresses resolve successfully to the localized production site;
- Vercel-generated domains remain technical deployment addresses.

Hosted Supabase Auth state:

- the Site URL is `https://ttrpg.fans`;
- production and local redirect allowlist entries are configured;
- the canonical production callback is allowed;
- arbitrary Vercel Preview authentication is not currently enabled.

This hosted configuration is external to the repository and contains no repository-managed secret values.

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
- VtM V5 summary cards;
- responsive layouts.

Character owners remain the only users who can edit or delete their characters. Active campaign participants can additionally receive read-only access to eligible characters with `campaign` visibility and an active campaign assignment. No anonymous or public read policy exists for `public` visibility.

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
```

All eight repository migrations are current in Production. The seven campaign-video tables use RLS; the five required foreign-key indexes, database grants, and `handle_new_user()` hardening are current. The private `campaign-images` Storage bucket is current. No campaign-authoritative dice-roll, provider-room-mapping, handout, NPC, session, or campaign-notes table is currently implemented. Personal dice history is private per owner and is not campaign evidence.

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

The shared typed catalogue also enables campaign creation for this system while its character creation, dice roller, and game area remain planned:

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

Campaign creation supports `vtm-v5` and the system-neutral `call-of-cthulhu-7e` shell. Character assignments remain game-system exact; VtM characters cannot be linked to CoC campaigns. CoC dice and character sheets are planned in Phases 4D1 and 4F1, with the CoC Game System Hub planned for Phase 8A. Keeper-specific tools are not an active roadmap commitment.

### Core play and campaign tools

Phase 4A personal dice is implemented, including the deterministic VtM evaluator, public VtM and Custom rollers, saved Custom presets, and private personal history. Phase 4B campaign-authorized LiveKit video runs in a dedicated localized Game Room; no standalone Video Room or campaign-authoritative Realtime dice feed is implemented.

The reusable video core owns the implemented campaign provider integration and media-room behavior behind a campaign-derived authorization adapter. Any future standalone product would require a separate product and authorization review and must not depend on campaigns.

Approved later Phase 4 work is limited to the Campaign Image Library and Game Room image presentation, CoC dice and system-aware Game Room dice, campaign/Game Room technical UX refinement, CoC character sheets and linked-character presentation, and narrowly scoped shared plus GM-private notes. Every campaign capability depends on verified campaign access. Personal dice history remains separate and non-authoritative.

### Campaign content

Planned, not implemented:

- Phase 4C1 private Campaign Image Library;
- Phase 4C2 GM-controlled Game Room image presentation;
- Phase 4G shared notes for permitted participants and GM-private notes.

General Handouts, NPCs, Sessions, Chronicle records, clues, maps, and other broad campaign-content modules are not active roadmap commitments.

### Game System Hubs

Public or generally accessible game-system information must remain separate from private campaign workspaces. Hubs are planned in Phase 8 in CoC, Delta Green, then Vampire order and may organize only capabilities that already exist.

## Working rules

- Read `AGENTS.md` before Next.js changes.
- Inspect current files before replacing them.
- Use small, verified changes.
- Run `npm run build` and `git diff --check` after substantial changes.
- Use migrations for database changes.
- Regenerate database types after schema changes.
- Never expose secrets.
- Never show raw backend error messages.
- Preserve existing character records and unknown system data.
- Keep code comments and code-block text in English.
- Do not over-generalize for future systems before a second system exposes real shared requirements.

## Current phase and next task

Character Friend Alpha, Campaign Foundation, Phase 4A personal dice, personal dice persistence, and the planned game-system catalogue are complete.

Campaign-authorized LiveKit video and the responsive Game Room at `/{locale}/campaigns/{campaignId}/game-room` are complete and accepted for one GM plus up to six Players. LiveKit is the accepted provider for this current campaign implementation. The final card design uses responsive 16:9 media, stable participant slots, a compact upper-right label, local-only lower-left media controls, and a header-level Leave action.

Phase 4C1 Campaign Image Library is next. Later approved Phase 4 work is 4C2 Game Room Image Presentation, 4D1 CoC 7e Dice Roller, 4D2 system-aware Game Room Dice Integration, 4E Campaign & Game Room UX/UI Refinement, 4F1 CoC 7e Character Sheets, 4F2 system-aware linked-character Game Room integration, and 4G narrowly scoped campaign notes. Phase 5 is site-wide UI Technical Refinement, Phase 6 is deliberately undecided Visual Identity, Phase 7 adds Delta Green system parity, Phase 8 adds CoC/Delta Green/Vampire hubs in that order, and Phase 9 is Public Readiness. Standalone Video Rooms and broad Handouts/NPC/Sessions/Chronicle capabilities are not active roadmap commitments.
