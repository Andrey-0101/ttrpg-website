# Project Context

## Document control

| Field | Value |
|---|---|
| Project | Web_Site_TTRPG / ttrpg-website |
| Repository | `Andrey-0101/ttrpg-website` |
| Document status | Current synchronized project context |
| Last reviewed | 2026-08-02 |
| Verified production baseline | `main` at `cb6a07f11669916c8af68d0f0c93033438c901ea` |
| Verified release | PR #26 merged, deployed, and production-verified; 169 automated tests; 36/36 static pages |
| Canonical production domain | `https://ttrpg.fans` |
| Domain redirect | `https://www.ttrpg.fans` permanently redirects to `https://ttrpg.fans` |
| Technical deployment address | `https://ttrpg-website-xi.vercel.app` |
| Current delivery stage | Phase 4B — Standalone Video Rooms architecture and security contract |
| Current audience | Small invited group of friends |

## Release-state boundaries

### Verified production baseline

The current deployed and production-verified baseline is `main` at `cb6a07f11669916c8af68d0f0c93033438c901ea`. PR #26 is merged and production-verified. The release passed 169 automated tests and generated 36/36 static pages.

The canonical production origin is `https://ttrpg.fans`; `https://www.ttrpg.fans` permanently redirects to the apex domain. Phase 4A, personal dice persistence, and the planned game-system catalogue are complete. Standalone Video Rooms, campaign dice, and campaign video integration are not implemented, and no managed WebRTC provider has been selected. H007 remains the latest completed handoff; H008 does not exist.

## Purpose

The project is a bilingual TTRPG hub. Its first complete game-system implementation is Vampire: The Masquerade Fifth Edition. The near-term goal is not to build a complete public virtual tabletop. The near-term goal is to make a reliable private toolset for a small gaming group and use real play to guide later development.

The intended progression is:

1. architecture and documentation;
2. friend-alpha character usability;
3. minimum campaign foundation;
4. VtM dice rolls and video rooms;
5. friend-only campaign workspace;
6. visual design;
7. VtM game hub;
8. public readiness;
9. Call of Cthulhu 7e.

## Source-of-truth order

When information conflicts, use this priority:

1. code at the exact Git commit being changed;
2. SQL migrations committed to the repository;
3. generated database types;
4. verified Supabase and Vercel behavior;
5. accepted ADRs;
6. permanent project documentation;
7. the current handoff;
8. current chat decisions;
9. historical handoffs and old snippets.

A discussed or planned object is not implemented unless it exists in code, migrations, generated types, or verified infrastructure.

## Current verified application state

### Platform

- Next.js 16.2.9 App Router
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

The production Vercel and hosted Supabase Auth settings were completed manually outside the repository and manually verified for the merged and production-verified PR #26 release.

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
```

No campaign-authoritative dice-roll, video-room, handout, NPC, session, or campaign-notes table is currently implemented. Personal dice history is private per owner and is not campaign evidence.

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

Implemented system:

```text
vtm-v5
```

The shared typed catalogue also registers these planned systems with no active capabilities or routes:

```text
alien
black-powder-and-brimstone
call-of-cthulhu-7e
coriolis
cyberpunk-red
delta-green
forbidden-lands
ironsworn
mothership
paranoia
traveller-mongoose
```

The catalogue is implemented across Games, the System Rollers section, character creation, and campaign creation. Custom Dice Pool remains system-neutral and outside it. The production catalogue release at `22736bf697a8345e19e92626a8f441f35db4b3c7` passed 156 catalogue/dice tests.

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

### Realtime and collaboration tools

Milestone 4A personal dice is implemented, including the deterministic VtM evaluator, public VtM and Custom rollers, saved Custom presets, and private personal history. No standalone Video Room, campaign-authoritative Realtime dice feed, or campaign video integration is implemented yet.

The reusable video core will own provider integration and media-room behavior. Standalone application authorization will be its first access adapter and must not depend on campaigns. Later campaign video must add a separate campaign-derived authorization adapter.

The broader collaboration area will own:

- VtM dice execution and roll feed;
- presence;
- video-room access;
- session-scoped realtime features.

Shared campaign dice and campaign-integrated video must depend on verified campaign membership. Standalone Video Rooms form a separate access domain.

### Campaign content

Planned, not implemented.

Will include:

- handouts;
- NPCs;
- sessions;
- shared notes;
- GM-private notes.

### Game hub

Public or generally accessible game-system information must remain separate from private campaign workspaces.

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

## Current milestone and next task

Character Friend Alpha, Campaign Foundation, Phase 4A personal dice, personal dice persistence, and the planned game-system catalogue are complete.

Phase 4B Standalone Video Rooms is the next approved development phase. Its internal order is: architecture and security contract; managed-provider comparison; disposable two-to-three-user spike; permanent standalone implementation; then multi-user, desktop, mobile, reconnect, permission, failure, and production testing.

Phase 4C defines the Campaign Collaboration Contract. Phase 4D then implements server-authoritative shared campaign dice, Phase 4E integrates campaign video through the reusable video core, and Phase 4F assembles the campaign workspace. Exact room schema, RLS, ownership, invitation, retention, provider, and campaign-video decisions remain open. Print/PDF, final decoration, broad public-readiness hardening, and Call of Cthulhu implementation remain deferred.
