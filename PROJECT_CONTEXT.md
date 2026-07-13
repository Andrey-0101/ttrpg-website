# Project Context

## Document control

| Field | Value |
|---|---|
| Project | Web_Site_TTRPG / ttrpg-website |
| Repository | `Andrey-0101/ttrpg-website` |
| Document status | Current synchronized project context |
| Last reviewed | 2026-07-13 |
| Source repository snapshot | `main` at `cb378c18fc3f07ad6072f27508918ac53784e1b5` |
| Production alias | `https://ttrpg-website-xi.vercel.app` |
| Current delivery stage | Milestone 4A — VtM dice contract and personal roller |
| Current audience | Small invited group of friends |

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
- GitHub source control

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
```

Current public tables:

```text
public.profiles
public.characters
public.campaigns
public.campaign_members
public.campaign_invitations
public.campaign_characters
```

No dice-roll, video-room, handout, NPC, session, or campaign-notes table is currently implemented.

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

Current implementation:

```text
vtm-v5
```

Registered but unavailable:

```text
call-of-cthulhu-7e
```

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

### Realtime tools

Milestone 4A is active. No dice engine, dice route, persisted dice history, Realtime dice feed, or video room is implemented yet.

This domain will own:

- VtM dice execution and roll feed;
- presence;
- video-room access;
- session-scoped realtime features.

Shared campaign dice and video must depend on verified campaign membership.

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

Character Friend Alpha and Campaign Foundation are complete.

Milestone 4A — VtM dice contract and personal roller — is active. The exact next task is to define the typed VtM V5 personal dice request/result contract and implement a pure deterministic evaluator using fixed die arrays.

The first evaluator slice excludes UI, random generation, database persistence, migrations, Realtime, campaign integration, and video. Print/PDF, final decoration, broad automated testing, and public-readiness hardening remain deferred.
