# H004_CURRENT_HANDOFF.md

## 1. Document Control

| Field | Value |
|---|---|
| Project name | **Web_Site_TTRPG / ttrpg-website** |
| Handoff ID | **H004** |
| Sequence position | **Fourth project chat handoff** |
| Previous handoffs | `docs/handoffs/H001_CURRENT_HANDOFF.md`, `docs/handoffs/H002_CURRENT_HANDOFF.md`, `docs/handoffs/H003_CURRENT_HANDOFF.md` |
| Supersedes | **H003 as the current-state handoff. H001–H003 remain historical records.** |
| Handoff version | **1.0** |
| Creation date | **2026-07-03** |
| Scope of this chat | **Responsive/mobile completion for the VtM V5 character experience; character-card action alignment; review and acceptance of the target site structure; preparation and consolidation of permanent architecture/product documentation; creation and merge of PR #4; final Git, build, and Vercel verification.** |
| Repository URL | **VERIFIED:** `https://github.com/Andrey-0101/ttrpg-website` |
| Git remote URL | **VERIFIED:** `https://github.com/Andrey-0101/ttrpg-website.git` |
| Active branch | **VERIFIED:** `main` |
| Exact HEAD commit | **VERIFIED:** `00af1bef4f834860543a51d903dc5b88c847ea51` |
| `origin/main` | **VERIFIED:** `00af1bef4f834860543a51d903dc5b88c847ea51` |
| Remote `refs/heads/main` | **VERIFIED:** `00af1bef4f834860543a51d903dc5b88c847ea51` |
| Latest commit | **VERIFIED:** `00af1be Merge pull request #4 from Andrey-0101/docs/architecture-baseline` |
| Ahead/behind | **VERIFIED:** local `main` is up to date with `origin/main`; no ahead/behind condition was reported. |
| Working tree | **VERIFIED CLEAN:** no staged, modified, or untracked files. |
| Push status | **VERIFIED:** the merged commit is present on remote `main`. |
| Build status | **VERIFIED:** `npm run build` passed at the exact HEAD; compilation, TypeScript, page-data collection, static generation, and final optimization completed successfully. |
| Production alias | **VERIFIED:** `https://ttrpg-website-xi.vercel.app` |
| Inspected deployment URL | **VERIFIED:** `https://ttrpg-website-qp9vekcpw-andrey-yudin.vercel.app` |
| Vercel deployment ID | **VERIFIED:** `dpl_9QTqP3zWTCbyGfb9an75qzJE5awX` |
| Deployment status | **VERIFIED:** target `production`, status `Ready`, inspected on 2026-07-03. |
| Deployment-to-commit association | **UNVERIFIED:** the supplied `vercel inspect` output did not display a Git commit SHA. The deployment was reached through the production alias after `main` was updated, but exact SHA association must be checked before making a commit-specific release claim. |
| Browser regression test on the final deployment | **UNVERIFIED:** no final browser test of the exact Ready deployment was supplied in the closing verification. |
| H004 repository state | **UNCOMMITTED DOCUMENT:** this file is generated after the verified clean snapshot and is not part of commit `00af1be` until copied into the repository and committed. |
| Secrets included | **VERIFIED:** none. No `.env` values, API keys, tokens, passwords, or service-role credentials are included. |

### Snapshot rule

This handoff describes the repository only at:

```text
main
00af1bef4f834860543a51d903dc5b88c847ea51
```

If the repository advances, inspect the newer commit and treat this document as a historical baseline rather than authority over newer verified code.

---

## 2. Instructions for the Next Chat

1. Read this handoff completely before proposing code.
2. Verify that the local and remote repository still point to the commit documented above.
3. Read `AGENTS.md` before changing Next.js code.
4. Inspect the exact current versions of the files listed in Section 7.
5. Prefer code, migrations, and generated types from the verified commit over all chat snippets and older handoffs.
6. Do not restore old code from H001–H003 when the current commit contains a newer implementation.
7. Do not invent tables, columns, constraints, policies, buckets, environment variables, Dashboard settings, tests, or deployment results.
8. Treat every `ASSUMED`, `UNVERIFIED`, and `BLOCKED` item as requiring explicit verification.
9. Preserve all existing character data and keep `VTM_V5_SCHEMA_VERSION = 3` unless a separately reviewed schema migration is required.
10. Do not expose raw backend errors to users.
11. Make small, sequential changes and verify each material step.
12. Keep all code, code comments, commit messages, and text inside code blocks in English.
13. Do not reorganize the repository merely to match the target folder diagram.
14. Do not begin Campaigns, Dice, Video, CoC 7e, print/PDF, or final visual decoration during the exact next task.

---

## 3. Source-of-Truth Priority

When sources conflict, use this order:

1. **Code at the exact Git commit being changed.**
2. **SQL migrations committed to the repository.**
3. **Generated database types.**
4. **Factually verified Supabase and Vercel configuration or behavior.**
5. **The current `H004_CURRENT_HANDOFF.md`.**
6. **`PROJECT_CONTEXT.md`.**
7. **Current functional specifications and ADRs.**
8. **The current chat and user-confirmed decisions.**
9. **Older chats and archived handoff documents.**

Additional conflict rules:

- A newer handoff number establishes chronology, not truth by itself.
- A planned object is not implemented unless it exists in current code, migrations, generated types, or verified infrastructure.
- Repository code overrides obsolete snippets and obsolete file layouts from the conversation.
- SQL migrations override prose about database objects.
- Generated types are evidence of generated public-schema contracts, but they do not prove that all live Dashboard settings were inspected.
- A Vercel deployment marked `Ready` does not by itself prove that every user flow was regression-tested.
- An accepted ADR must not be silently reversed. Create a superseding ADR when the decision changes.
- Proposed ADRs guide planning but do not prove implementation.

---

## 4. Current Project Snapshot

### 4.1 Technology stack

| Area | Current state |
|---|---|
| Framework | **VERIFIED:** Next.js `16.2.9`, App Router, Turbopack production build |
| UI runtime | **VERIFIED:** React and React DOM `19.2.4` |
| Language | **VERIFIED:** TypeScript `^5` |
| Styling | **VERIFIED:** Tailwind CSS `^4` |
| Localization | **VERIFIED:** `next-intl` `^4.13.0` |
| Backend SDK | **VERIFIED:** `@supabase/ssr` `^0.12.0`, `@supabase/supabase-js` `^2.108.2` |
| Data services | **IMPLEMENTED:** Supabase PostgreSQL, Auth, RLS, and Storage integration |
| Hosting | **VERIFIED:** Vercel production deployment |
| Source control | **VERIFIED:** GitHub |
| Local environment | **VERIFIED:** Windows CMD |
| Environment file | **VERIFIED EXISTENCE ONLY:** the build detected `.env.local`; values are intentionally not recorded. |

### 4.2 Implemented modules

- **IMPLEMENTED:** English and Russian locale-prefixed application routes.
- **IMPLEMENTED:** Supabase registration, login, confirmation callback, session persistence, logout, profile view, and profile editing.
- **IMPLEMENTED:** owner-only character list, creation, view/edit, explicit save, clear, delete, and summary cards.
- **IMPLEMENTED:** complete VtM V5 two-page character sheet with `schemaVersion: 3`.
- **IMPLEMENTED:** A4-oriented desktop presentation and responsive tablet/mobile presentation.
- **IMPLEMENTED:** private portrait upload, replacement, removal, signed display, and best-effort cleanup.
- **IMPLEMENTED:** browser-tab draft persistence and active-page restoration.
- **IMPLEMENTED:** safe localized user-facing failures for the current auth and character flows.
- **IMPLEMENTED:** VtM game-system entry and an unavailable Call of Cthulhu 7e registry entry.
- **IMPLEMENTED:** architecture, database, localization, character-sheet, roadmap, campaign, dice, video, game-hub, security, design, site-map, and ADR documentation.

### 4.3 Active delivery stage

- **VERIFIED COMPLETE:** Milestone 1 — Architecture Baseline was committed and merged through PR #4.
- **DECIDED NEXT:** Milestone 2 — Character Friend Alpha.
- **PLANNED:** unsaved-change protection, clearer saving state, duplicate-submit protection review, unsaved portrait warning, visibility clarification, loading/empty states, long-value usability, practical mobile verification, and friend-group feedback.
- **DEFERRED:** print/PDF, final decorative design, portrait crop/reposition, broad automated test program, public-readiness hardening, complex autosave, campaigns, shared realtime tools, and CoC 7e.

### 4.4 Localization state

- **IMPLEMENTED:** locales `en` and `ru`.
- **IMPLEMENTED:** route prefix is always present for application routes.
- **IMPLEMENTED:** locale preference cookie is configured for one year.
- **IMPLEMENTED:** `/auth/confirm` remains a technical non-localized route.
- **IMPLEMENTED:** common messages and a separate VtM dictionary are merged per request.
- **IMPLEMENTED:** current sheet labels follow the route locale.
- **PROPOSED:** independent character-sheet language is documented but not implemented.
- **UNVERIFIED:** no dedicated nested-key parity check was run at H004 close.

### 4.5 Authentication state

- **IMPLEMENTED:** registration, login, email confirmation callback, session refresh, logout, profile view, and profile editing.
- **IMPLEMENTED:** the root proxy composes Supabase session refresh with `next-intl` routing.
- **VERIFIED BY BUILD:** auth and account routes compile at the current commit.
- **UNVERIFIED AT H004 CLOSE:** the exact final production deployment was not manually browser-tested for every auth scenario.
- **DEPRECATED:** raw Supabase/backend error text must never be rendered to the user.

### 4.6 Character-management state

- **IMPLEMENTED:** owner-only CRUD under RLS.
- **IMPLEMENTED:** VtM V5 view/edit flow with explicit Save and local session draft.
- **IMPLEMENTED:** `private`, `campaign`, and `public` values can be selected and stored.
- **IMPORTANT CURRENT BEHAVIOR:** all three visibility values still result in owner-only access because campaign and public sharing policies/routes do not exist.
- **IMPLEMENTED:** My Characters action layout places Open at the lower left and Delete at the lower right.
- **IMPLEMENTED:** responsive list, card, editor, creator, and sheet behavior.
- **KNOWN LIMITATION:** selected portrait `File` objects are not stored in `sessionStorage`.
- **KNOWN LIMITATION:** the combined Touchstones/Convictions editor writes visible lines to `touchstones` and clears `convictions`.

### 4.7 Database state

- **VERIFIED IN REPOSITORY:** two migrations exist.
- **VERIFIED IN GENERATED TYPES:** only `public.profiles` and `public.characters` are represented as application tables.
- **VERIFIED IN MIGRATIONS:** owner-only character RLS and private portrait Storage policy definitions exist.
- **VERIFIED HISTORICALLY, NOT RECHECKED AT H004 CLOSE:** H003 reported both migration versions present in local and remote migration history.
- **UNVERIFIED AT H004 CLOSE:** the Supabase Dashboard and live migration list were not re-inspected in this chat.
- **NOT IMPLEMENTED:** campaign, membership, invitation, dice-roll, video-room, handout, NPC, session, or campaign-note tables.

### 4.8 Production state

- **VERIFIED:** stable production alias exists.
- **VERIFIED:** Vercel returned a production deployment with status `Ready`.
- **VERIFIED:** the current commit passes a clean local production build.
- **UNVERIFIED:** exact Git SHA association was not displayed by `vercel inspect`.
- **UNVERIFIED:** final browser regression testing of `/en`, `/ru`, auth, character creation, character editing, portrait operations, and mobile layout was not repeated after PR #4.
- **LOW-RISK CONTEXT:** PR #4 changed documentation only, but this does not replace an explicit production regression test.

---

## 5. Scope of the Completed Chat

### Initial objective

The chat continued the VtM V5 mobile adaptation work after the complete desktop/A4 and portrait implementation. The immediate functional objective was to make character routes, forms, cards, and the two-page VtM sheet usable on narrow screens.

### Additional tasks that appeared

1. Fix the My Characters action layout so Open remains at the lower-left corner and Delete at the lower-right corner.
2. Merge the responsive work and card-action fix into `main`.
3. Review the remaining project plan.
4. Define the current and target site structure.
5. Refine the user-approved target navigation and terminology.
6. Prepare permanent English project documentation.
7. Prepare a root-ready documentation ZIP.
8. Commit the documentation on a dedicated branch.
9. Merge PR #4 into `main`.
10. Verify local Git state, production build, and Vercel deployment.
11. Prepare H004 for the next project chat.

### Actual end state

- **VERIFIED:** responsive VtM work is merged.
- **VERIFIED:** the character-card action alignment fix is merged.
- **VERIFIED:** the architecture/documentation baseline is merged.
- **VERIFIED:** `main` is clean and synchronized with remote commit `00af1be`.
- **VERIFIED:** the current commit builds successfully.
- **VERIFIED:** a production Vercel deployment is `Ready`.
- **DECIDED:** the next delivery stage is Character Friend Alpha.
- **UNCOMMITTED:** this H004 file itself still needs to be placed in `docs/handoffs/` and committed if it is to become part of the repository.

---

## 6. Work Completed

| Status | Change | Files | Commit | Verification |
|---|---|---|---|---|
| **IMPLEMENTED** | Responsive/mobile pass for character routes, creator/editor controls, summary cards, and VtM sheet sections | `app/[locale]/characters/**`, `components/characters/**`, `components/characters/sheets/vtm-v5/**` | `e046ae082d94eb8d941d50d248ce207a0c804f2d`; merged through PR #2 at `7f761238fa1cba7a5c52813bca1d945b03de64f2` | GitHub commit history; user-reported functional verification; later build passed at `00af1be` |
| **IMPLEMENTED** | Character-card action layout fixed so Open and Delete occupy opposite lower corners | Character summary/action card files under `components/characters/` | PR #3 merge `e2a412bd74af0971cea7bfdf28e42cfa6100e7a2` | User reported the layout working; current build passed |
| **DECIDED** | Revised target site structure and terminology | `docs/product/SITE_MAP.md`, `docs/product/SITE_MAP_TARGET.md`, related structure documents | Documentation commit `cf05f066a5a848e4c3efd38148b54295add12c05`; merged in `00af1be` | Files exist in exact current commit |
| **IMPLEMENTED** | Permanent architecture and product documentation baseline | Root `README.md`, `PROJECT_CONTEXT.md`, `docs/README.md`, `docs/architecture/**`, `docs/product/**`, `docs/decisions/**`, `docs/handoffs/H001-H003` | `cf05f066a5a848e4c3efd38148b54295add12c05`; PR #4 merge `00af1bef4f834860543a51d903dc5b88c847ea51` | Remote `main` matches local HEAD; working tree clean |
| **IMPLEMENTED** | Nine ADR files and ADR index | `docs/decisions/ADR-001...ADR-009`, `docs/decisions/README.md` | `cf05f06`; merged in `00af1be` | Files and statuses verified at exact commit |
| **IMPLEMENTED** | Historical handoffs committed to the repository | `docs/handoffs/H001_CURRENT_HANDOFF.md`, `H002_CURRENT_HANDOFF.md`, `H003_CURRENT_HANDOFF.md` | `cf05f06`; merged in `00af1be` | Files exist at exact commit |
| **VERIFIED** | Local Git and build verification after PR #4 | No application file changes | `00af1be` | Clean status; local/remote SHA equality; `git diff --check` clean; production build passed |
| **VERIFIED** | Vercel production deployment inspection | No repository file changes | Deployment `dpl_9QTqP3zWTCbyGfb9an75qzJE5awX` | Target `production`; status `Ready`; stable alias listed |

---

## 7. Relevant File Map

Only files relevant to the next Character Friend Alpha task and source-of-truth verification are listed.

| Path | Purpose | Current State | Notes |
|---|---|---|---|
| `AGENTS.md` | Repository-specific Next.js working rules | **VERIFIED PRESENT** | Read before changing application code. |
| `PROJECT_CONTEXT.md` | Permanent project snapshot and working rules | **IMPLEMENTED, SNAPSHOT STALE** | Still records snapshot `e2a412b` and Architecture Baseline as current stage. Update after H004 review. |
| `README.md` | Public project summary and documentation entry point | **IMPLEMENTED, SNAPSHOT STALE** | “Current snapshot” still points to `e2a412b`. |
| `docs/product/ROADMAP.md` | Milestone order and Character Friend Alpha scope | **IMPLEMENTED** | Architecture Baseline exit criteria are satisfied; active-stage wording should be updated. |
| `docs/architecture/ARCHITECTURE.md` | Current and proposed domain boundaries | **IMPLEMENTED** | Explicitly states unsaved protection and clearer mutation status as friend-alpha work. |
| `docs/architecture/CHARACTER_SHEETS.md` | VtM sheet contract and current UX limitations | **IMPLEMENTED** | Records draft and unsaved portrait limitations. |
| `docs/architecture/DATABASE.md` | Current DB, RLS, Storage contracts | **IMPLEMENTED** | Use with migrations and generated types; do not treat proposed tables as current. |
| `docs/architecture/I18N.md` | Locale and dictionary contract | **IMPLEMENTED** | Nested-key parity check remains planned. |
| `docs/product/SITE_MAP.md` | Combined current and target site map | **IMPLEMENTED** | Contains the approved target terminology. |
| `docs/product/SITE_MAP_TARGET.md` | Target-only site map | **IMPLEMENTED, DUPLICATIVE** | Determine whether this or the target section in `SITE_MAP.md` is canonical. |
| `docs/architecture/TARGET_SITE_MAP_V01.md` | Intended site-map artifact | **VERIFIED EMPTY** | Zero-line file; remove or populate in a later documentation cleanup. |
| `docs/decisions/README.md` | ADR index and statuses | **IMPLEMENTED** | Authoritative ADR status list. |
| `components/characters/character-editor.tsx` | Existing-character edit/save/draft/portrait workflow | **IMPLEMENTED** | Primary file for unsaved-state protection. |
| `components/characters/character-creator.tsx` | New-character create/draft/portrait workflow | **IMPLEMENTED** | Primary file for unsaved-state protection. |
| `components/characters/character-summary-card.tsx` | Character list summary and action layout | **IMPLEMENTED** | Recently fixed; do not regress. |
| `components/characters/delete-character-button.tsx` | Character deletion and portrait cleanup | **IMPLEMENTED** | Inspect if leave guards or card behavior interact with deletion. |
| `components/characters/sheets/vtm-v5/vtm-character-sheet.tsx` | Two-page sheet coordinator | **IMPLEMENTED** | Page switches must not be mistaken for leaving the form. |
| `components/characters/sheets/vtm-v5/character-portrait-field.tsx` | Portrait selection, preview, validation UI | **IMPLEMENTED** | Selected `File` is not serializable into the current draft. |
| `lib/characters/vtm-v5/editor-draft.ts` | Draft/page sessionStorage contract | **IMPLEMENTED** | Draft version `1`; inspect before introducing dirty-state utilities. |
| `lib/characters/vtm-v5/schema.ts` | VtM schema v3 and normalizer | **IMPLEMENTED / SOURCE OF TRUTH** | Do not change schema version for the next task. |
| `lib/characters/portrait.ts` | Portrait validation, path creation, signed URL helper | **IMPLEMENTED** | 5 MB; JPEG/PNG/WebP; 1-hour signed URL. |
| `lib/characters/game-systems.ts` | System registry and legacy ID normalization | **IMPLEMENTED** | VtM available; CoC registered but unavailable. |
| `messages/en.json` | Common English UI strings | **IMPLEMENTED** | Add friend-alpha common strings here if not system-specific. |
| `messages/ru.json` | Common Russian UI strings | **IMPLEMENTED** | Keep key structure aligned with English. |
| `messages/en/vtm-v5.json` | English VtM strings | **IMPLEMENTED** | Use for VtM-only terminology. |
| `messages/ru/vtm-v5.json` | Russian VtM strings | **IMPLEMENTED** | Test long labels on mobile. |
| `i18n/routing.ts` | Locale list, default, prefix, cookie | **IMPLEMENTED** | Do not manually concatenate locale prefixes. |
| `i18n/request.ts` | Common + VtM dictionary loading | **IMPLEMENTED** | Current per-system dictionary split. |
| `i18n/navigation.ts` | Locale-aware navigation helpers | **IMPLEMENTED** | Use for application navigation. |
| `proxy.ts` | `next-intl` and Supabase session composition | **IMPLEMENTED / ARCHITECTURE-CRITICAL** | Not expected to change in the next task. |
| `supabase/migrations/20260630143000_initial_schema.sql` | Tables, constraints, trigger, and RLS baseline | **VERIFIED IN REPOSITORY** | Applied migration; do not edit. |
| `supabase/migrations/20260702150000_character_portraits.sql` | Private portrait bucket and Storage policies | **VERIFIED IN REPOSITORY** | Applied migration; do not edit. |
| `types/database.types.ts` | Generated public-schema TypeScript types | **VERIFIED** | Do not edit manually. |

---

## 8. Current Data Contracts

### 8.1 Confirmed current database columns

#### `public.characters`

**VERIFIED from migration and generated types:**

| Column | Contract |
|---|---|
| `id` | UUID, non-null, primary key, default `gen_random_uuid()` |
| `owner_id` | UUID, non-null, FK to `auth.users.id`, `ON DELETE CASCADE` |
| `name` | text, non-null |
| `game_system` | text, non-null |
| `description` | nullable text |
| `portrait_url` | nullable text; new private portraits store an object path |
| `visibility` | text, non-null, default `private`; check values `private`, `campaign`, `public` |
| `sheet_data` | JSONB, non-null, default `{}` |
| `created_at` | timestamptz, non-null, default `now()` |
| `updated_at` | timestamptz, non-null, default `now()` |

#### `public.profiles`

**VERIFIED from migration and generated types:**

| Column | Contract |
|---|---|
| `id` | UUID, non-null, primary key, FK to `auth.users.id`, `ON DELETE CASCADE` |
| `username` | nullable text, unique |
| `display_name` | nullable text |
| `bio` | nullable text |
| `avatar_url` | nullable text |
| `created_at` | timestamptz, non-null, default `now()` |

### 8.2 Current generated TypeScript database contract

**VERIFIED:**

```text
types/database.types.ts
```

It defines:

- `Json`;
- `Database`;
- `public.Tables.characters`;
- `public.Tables.profiles`;
- row/insert/update shapes;
- no public views;
- no public RPC functions;
- no public enums;
- no public composite types.

The generated metadata records PostgREST version `14.5`.

### 8.3 Current VtM JSONB contract

**IMPLEMENTED:**

```text
VTM_V5_SCHEMA_VERSION = 3
```

`VtmV5SheetData` contains:

```text
schemaVersion
identity
attributes
skills
skillSpecialties
disciplines
advantages
trackers
chronicleTenets
convictions
touchstones
clanBane
bloodPotencyDetails
experience
biography
notes
extensions
```

Key nested contracts:

```text
identity:
  clan
  concept
  predatorType
  sire
  generation
  sect
  ambition
  desire
  chronicle

trackers:
  resonance
  hunger
  humanity
  stains
  bloodPotency
  health:
    superficial
    aggravated
    bonus
  willpower:
    superficial
    aggravated
    bonus

bloodPotencyDetails:
  bloodSurge
  mendAmount
  powerBonus
  rouseReRoll
  feedingPenalty
  baneSeverity

experience:
  total
  spent

biography:
  trueAge
  apparentAge
  dateOfBirth
  dateOfDeath
  appearance
  distinguishingFeatures
  history
```

Attributes use the nine VtM attribute keys. Skills use the 27 physical, social, and mental skill keys declared in `schema.ts`.

### 8.4 Common fields versus system data

**ACCEPTED / IMPLEMENTED RULE:**

Common character data remains in ordinary columns:

```text
name
game_system
description
portrait_url
visibility
owner_id
timestamps
```

System-specific values remain in `sheet_data`.

Do not duplicate common character fields inside VtM JSONB.

### 8.5 Current draft contract

**IMPLEMENTED:**

```text
VtmV5EditorDraft
version: 1
name
visibility
activePage
sheetData
```

Storage keys are character/system specific and use `sessionStorage`.

**KNOWN LIMITATION:** portrait `File` objects are excluded from serialization.

### 8.6 Backward compatibility rules

- **IMPLEMENTED:** `normalizeVtmV5SheetData()` always returns schema version `3`.
- **IMPLEMENTED:** legacy top-level `clan`, `hunger`, and `resonance` are accepted.
- **IMPLEMENTED:** missing values receive defaults.
- **IMPLEMENTED:** numeric ratings and trackers are clamped to supported ranges.
- **IMPLEMENTED:** unknown top-level VtM keys are preserved under `extensions`.
- **IMPLEMENTED:** explicit `extensions` content is retained.
- **IMPLEMENTED:** legacy game-system names are normalized by `lib/characters/game-systems.ts`.
- **IMPLEMENTED:** HTTP/HTTPS values in `portrait_url` are treated as legacy external portrait URLs; other values are treated as Storage paths.
- **REQUIRED:** persisted VtM data must pass through the current normalizer.
- **REQUIRED:** existing records must remain readable after friend-alpha UX changes.
- **REQUIRED:** do not change `schemaVersion` for UI-only work.

### 8.7 Current state versus target model

#### Current

- `profiles`;
- `characters`;
- owner-only access;
- versioned VtM JSONB;
- private portrait Storage.

#### Target, not implemented

- campaigns;
- campaign memberships;
- invitations created as part of campaign creation;
- character-to-campaign assignment;
- dice-roll persistence;
- video-room authorization;
- handouts;
- NPCs;
- sessions/Chronicle;
- shared and GM-private notes;
- independent sheet language;
- CoC 7e sheet data.

### 8.8 Required migrations

- **NEXT EXACT TASK:** no database migration is expected.
- **REQUIRED IF DATABASE CHANGES BECOME NECESSARY:** create a new migration; never edit either existing applied migration.
- **PLANNED LATER:** campaign and shared-feature schemas require reviewed new migrations, regenerated types, RLS, and cross-user tests.
- **BLOCKED:** no future table names or columns should be finalized from diagrams alone.

---

## 9. Database, RLS and Storage State

### 9.1 Existing application tables

| Object | Status |
|---|---|
| `public.profiles` | **VERIFIED IN MIGRATION AND GENERATED TYPES** |
| `public.characters` | **VERIFIED IN MIGRATION AND GENERATED TYPES** |
| Campaign-related application tables | **NOT IMPLEMENTED** |
| Dice/video/content application tables | **NOT IMPLEMENTED** |

### 9.2 Constraints and indexes

**VERIFIED:**

- primary key on `profiles.id`;
- unique constraint on `profiles.username`;
- FK from `profiles.id` to `auth.users.id` with cascade delete;
- primary key on `characters.id`;
- FK from `characters.owner_id` to `auth.users.id` with cascade delete;
- check constraint on `characters.visibility`.

**UNVERIFIED / ABSENT FROM BASELINE MIGRATION:**

- no explicit index on `characters.owner_id` was found;
- no database trigger automatically maintains `characters.updated_at`.

Do not claim additional indexes or constraints without a migration or direct database inspection.

### 9.3 Trigger and function

**VERIFIED IN MIGRATION:**

- function `public.handle_new_user()`;
- `SECURITY DEFINER`;
- inserts a `public.profiles` row for a newly inserted Auth user;
- trigger `on_auth_user_created` executes it after insert on `auth.users`.

### 9.4 RLS state

**VERIFIED IN MIGRATION:**

- RLS enabled on `public.profiles`;
- RLS enabled on `public.characters`.

#### Profile policies

- **VERIFIED:** authenticated users may select profiles.
- **VERIFIED:** a user may update only the profile whose `id` equals `auth.uid()`.

#### Character policies

- **VERIFIED:** insert only when `owner_id = auth.uid()`;
- **VERIFIED:** select only rows owned by `auth.uid()`;
- **VERIFIED:** update only rows owned by `auth.uid()`;
- **VERIFIED:** delete only rows owned by `auth.uid()`.

#### Missing sharing policies

- **NOT IMPLEMENTED:** campaign-member character access.
- **NOT IMPLEMENTED:** anonymous/public character access.
- **NOT IMPLEMENTED:** GM access to another user’s character.
- **NOT IMPLEMENTED:** any campaign, dice, video, handout, NPC, session, or note policy.

### 9.5 Current visibility semantics

| Stored value | Actual verified policy behavior |
|---|---|
| `private` | owner only |
| `campaign` | owner only |
| `public` | owner only |

**REQUIRED:** UI copy must not imply that campaign/public sharing already works.

### 9.6 Storage bucket contract

**VERIFIED IN MIGRATION:**

```text
character-portraits
```

| Property | Value |
|---|---|
| Public | `false` |
| Maximum size | `5,242,880` bytes |
| Allowed MIME | `image/jpeg`, `image/png`, `image/webp` |

### 9.7 Storage path convention

**IMPLEMENTED:**

```text
USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME
```

The first path segment must equal the authenticated user ID.

### 9.8 Storage policies

**VERIFIED IN MIGRATION:** owner-folder policies exist for authenticated SELECT, INSERT, UPDATE, and DELETE. Each checks:

```text
bucket_id = character-portraits
first path segment = auth.uid()
```

### 9.9 Portrait display and cleanup

- **IMPLEMENTED:** signed URLs.
- **IMPLEMENTED:** signed URL TTL is 3600 seconds.
- **IMPLEMENTED:** replacement saves the new reference before best-effort old-object removal.
- **IMPLEMENTED:** create/update flows attempt rollback after partial failures.
- **KNOWN LIMITATION:** failed cleanup can leave orphan objects.
- **NOT IMPLEMENTED:** scheduled orphan cleanup.

### 9.10 Generated database types

- **VERIFIED PRESENT:** `types/database.types.ts`.
- **REQUIRED:** do not edit manually.
- **REQUIRED AFTER SCHEMA CHANGE:** apply migration, regenerate types, review diff, update query/client code, update documentation.
- **UNVERIFIED:** generation command and exact linked Supabase project configuration were not rerun at H004 close.

### 9.11 Live Supabase and Dashboard-only settings

- **VERIFIED HISTORICALLY:** H003 reported both repository migration versions in remote migration history.
- **UNVERIFIED AT H004 CLOSE:** no current `supabase migration list` output was provided.
- **UNVERIFIED:** Auth provider settings, redirect URL configuration, email templates, rate limits, and other Dashboard-only settings were not inspected in this chat.
- **RULE:** do not infer Dashboard values from application code.

---

## 10. Confirmed Architectural Decisions

| Decision | Status | Reason | Related Files or ADR |
|---|---|---|---|
| Store system-specific character data in versioned JSONB | **ACCEPTED** | Different game systems require different contracts; normalizers preserve compatibility without creating universal sparse columns | ADR-001; `schema.ts`; `CHARACTER_SHEETS.md` |
| Keep common character fields outside `sheet_data` | **ACCEPTED / IMPLEMENTED** | Ownership, naming, visibility, portrait reference, and timestamps are platform concerns | ADR-001; migration; `DATABASE.md` |
| Store portraits in a private Storage bucket and only store a path/reference in the database | **ACCEPTED / IMPLEMENTED** | Avoid Base64/database bloat and support owner-folder policies and signed display | ADR-002; portrait migration; `portrait.ts` |
| Independent character-sheet language | **PROPOSED** | Route locale and persisted sheet language are different user concerns | ADR-003; `I18N.md` |
| A4 desktop rendering plus content-driven responsive mobile rendering | **ACCEPTED / IMPLEMENTED** | Desktop/print proportions must not force overflow or unreadable scaling on mobile | ADR-004; VtM sheet components |
| URL-prefixed localization | **ACCEPTED / IMPLEMENTED** | Explicit locale routes provide predictable navigation and metadata | ADR-005; `i18n/routing.ts` |
| Compose Supabase session refresh with `next-intl` proxy behavior | **ACCEPTED / IMPLEMENTED** | Both session cookies and locale routing must survive the same request | ADR-006; `proxy.ts` |
| Build campaign authorization before shared dice/video | **PROPOSED / DECIDED DIRECTION** | Shared tools require one authoritative membership boundary | ADR-007; `CAMPAIGNS.md`; roadmap |
| Keep game-system behavior behind system-owned boundaries | **PROPOSED / PARTIALLY IMPLEMENTED** | Prevent VtM rules from leaking into common campaign/core domains | ADR-008; game-system registry; schema |
| Use managed video infrastructure rather than self-hosted WebRTC media | **PROPOSED** | Reduces infrastructure and operational risk | ADR-009; `VIDEO_ROOMS.md` |
| Do not include Dashboard in the target site map | **DECIDED, NOT IMPLEMENTED** | The approved target navigation uses direct top-level functional areas | `SITE_MAP_TARGET.md`; current `/dashboard` route still exists |
| Keep View/Edit inside My Characters; no separate Character Settings or Character Details section | **DECIDED, CURRENT FLOW ALIGNED** | Avoid unnecessary duplicate navigation for the same object | `SITE_MAP_TARGET.md`; character routes |
| Send player invitations during campaign creation; no separate global Invitations section | **DECIDED, NOT IMPLEMENTED** | Keeps initial campaign onboarding in one flow | `SITE_MAP_TARGET.md` |
| Initial user-facing campaign roles are Game Master and Player | **DECIDED, NOT IMPLEMENTED** | The owner rejected a separate roles/permissions section | `SITE_MAP_TARGET.md`; roadmap wording needs reconciliation |
| Put campaign dice and video inside Game Room | **DECIDED, NOT IMPLEMENTED** | Game Room is the virtual table for the current session | `SITE_MAP_TARGET.md`; ADR-007/009 |
| Keep top-level Video Rooms only as a shortcut to accessible campaign Game Rooms | **DECIDED, NOT IMPLEMENTED** | Avoid a separate authorization model for video | `SITE_MAP_TARGET.md` |
| Use the labels Dice Roller, Build a Dice Pool, Completed Campaigns, Chronicle, Resources, Overview and Setting, and Game Room | **DECIDED, NOT IMPLEMENTED ACROSS UI** | These names replace ambiguous earlier labels | `SITE_MAP_TARGET.md` |

---

## 11. Functional Requirements Preserved

### 11.1 Current character functionality

- **REQUIRED:** invited users must be able to create, save, reopen, edit, and delete their own VtM character.
- **REQUIRED:** view and edit modes remain distinct.
- **REQUIRED:** Save remains explicit; complex autosave is not part of the current milestone.
- **REQUIRED:** local draft restoration must continue to work.
- **REQUIRED:** page restoration must continue to work.
- **REQUIRED:** portrait validation remains JPEG/PNG/WebP and 5 MB maximum.
- **REQUIRED:** character data must remain owner-only until reviewed sharing policies exist.
- **REQUIRED:** no existing user record may be lost or silently rewritten.
- **REQUIRED:** VtM data must be normalized before persistence/use.
- **REQUIRED:** unknown VtM extension data must be preserved.
- **REQUIRED:** Open and Delete card positions must not regress.

### 11.2 Character Friend Alpha UX

- **PLANNED:** warn when leaving with unsaved changes.
- **PLANNED:** include unsaved portrait selection/removal in dirty-state detection.
- **PLANNED:** clearly communicate Saving, Saved, and Save failed states.
- **PLANNED:** review duplicate-submit protection for create/save.
- **PLANNED:** provide clear loading and empty states.
- **PLANNED:** test long values and long Russian labels.
- **PLANNED:** verify practical use on real mobile devices.
- **PLANNED:** explain or temporarily restrict `campaign` and `public` visibility.
- **DEFERRED:** complex autosave.

### 11.3 Localization

- **REQUIRED:** every new user-visible string must exist in EN and RU.
- **REQUIRED:** route navigation must use locale-aware helpers.
- **REQUIRED:** metadata and error states remain localized.
- **REQUIRED:** raw backend text must not be used as translated output.
- **REQUIRED:** VtM terminology belongs in the per-system dictionary when system-specific.
- **PLANNED:** independent per-character sheet language.
- **DEFERRED:** implementation of sheet-language persistence.

### 11.4 Security and data handling

- **REQUIRED:** RLS remains authoritative.
- **REQUIRED:** UI checks are not authorization.
- **REQUIRED:** no secrets in source, docs, logs, or user-visible errors.
- **REQUIRED:** future shared features must use campaign membership authorization.
- **REQUIRED:** every database/Storage change needs a new migration.
- **REQUIRED:** generated types must be regenerated after schema changes.
- **REQUIRED:** public-readiness claims must wait for the security launch gate.
- **DEFERRED:** unrestricted public access.

### 11.5 Mobile and responsive behavior

- **REQUIRED:** mobile uses content-driven height rather than rigid A4 scaling.
- **REQUIRED:** controls remain touch-friendly.
- **REQUIRED:** long text and Russian labels must not overflow.
- **REQUIRED:** mobile stacking must preserve logical reading order.
- **REQUIRED:** desktop A4 proportions and mobile presentation consume the same data contract.
- **REQUIRED:** friend-alpha changes must not reintroduce fixed-width overflow.

### 11.6 Future modules

- **PLANNED:** Campaign Foundation before shared realtime tools.
- **PLANNED:** Game Room includes video, campaign dice, handout preview, participants, quick notes, and current session context.
- **PLANNED:** completed campaigns become primarily read-only archives.
- **PLANNED:** standalone Dice Roller remains separate from campaign/session dice.
- **PLANNED:** Games content remains separate from private campaign data.
- **PLANNED:** CoC 7e follows only after VtM architecture is proven.
- **NOT IMPLEMENTED:** none of the above future modules should be inferred from site maps alone.

---

## 12. User Requirements and Working Preferences

- **VERIFIED PREFERENCE:** the user works in Windows CMD.
- **REQUIRED:** instructions must be sequential, practical, and broken into small verified steps.
- **REQUIRED:** inspect the actual current file before replacing it.
- **PREFERRED:** for large replacements, provide complete file contents rather than ambiguous fragments.
- **REQUIRED:** all code, code comments, commit messages, and text inside code blocks must be in English.
- **REQUIRED:** do not display raw backend errors to users.
- **REQUIRED:** implement the functional/security foundation before detailed decoration.
- **REQUIRED:** preserve existing user data.
- **REQUIRED:** preserve applied migrations and current `VTM_V5_SCHEMA_VERSION = 3` unless an explicit reviewed migration requires change.
- **REQUIRED:** do not treat proposed architecture as implemented.
- **REQUIRED:** minimum access control must accompany every shared feature.
- **DECIDED SEQUENCE:** character friend usability, campaign foundation, shared tools, friend campaign workspace, visual design, VtM game hub, public readiness, then CoC 7e.
- **REQUIRED:** campaign foundation precedes shared dice and video.
- **REQUIRED:** only Game Master and Player are intended as initial user-facing campaign roles.
- **PREFERRED:** maintain English as the canonical technical documentation set unless a separate bilingual maintenance decision is made.
- **REQUIRED:** do not use old chat snippets when the repository has a newer version.
- **REQUIRED:** be explicit about uncertainty instead of inventing infrastructure.

---

## 13. Localization State

### 13.1 Supported locales

```text
en
ru
```

- **VERIFIED:** default locale is `en`.
- **VERIFIED:** `localePrefix` is `always`.
- **VERIFIED:** locale cookie maximum age is one year.

### 13.2 Dictionary structure

```text
messages/en.json
messages/ru.json
messages/en/vtm-v5.json
messages/ru/vtm-v5.json
```

- **IMPLEMENTED:** common dictionary and VtM dictionary are imported dynamically and merged in `i18n/request.ts`.
- **IMPLEMENTED:** VtM sheet terminology is separated from the common dictionary.
- **UNVERIFIED:** no automated full nested-key comparison was run at H004 close.
- **PLANNED:** dedicated parity checking, potentially in CI.

### 13.3 Namespaces

**VERIFIED REPRESENTATIVE NAMESPACES USED BY CURRENT CODE:**

```text
CharacterForm
CharacterEditor
VtmCharacterSheet
PageMetadata
```

This list is not intended as a complete dump of every root key. Inspect the current JSON files before adding or moving keys.

### 13.4 Metadata

- **IMPLEMENTED:** localized layout metadata.
- **IMPLEMENTED:** route-specific metadata for current localized pages.
- **VERIFIED BY BUILD:** all current metadata-bearing routes compile.
- **UNVERIFIED:** final browser inspection of metadata in both locales was not repeated after PR #4.

### 13.5 Route locale behavior

- **IMPLEMENTED:** localized application routes live under `app/[locale]/`.
- **IMPLEMENTED:** locale-less application requests are handled by localization middleware.
- **IMPLEMENTED:** `/auth/confirm` remains outside `[locale]`.
- **REQUIRED:** use `i18n/navigation.ts`; do not manually concatenate locale prefixes.
- **REQUIRED:** retest registration confirmation in both locales when auth/proxy logic changes.

### 13.6 Locale persistence

- **IMPLEMENTED:** locale cookie retained for one year.
- **IMPLEMENTED:** language switcher preserves locale-aware routing behavior.
- **UNVERIFIED AT H004 CLOSE:** persistence was not manually retested on the exact final deployment.

### 13.7 Site locale versus sheet language

- **CURRENT:** VtM labels follow route locale.
- **PROPOSED:** a character sheet can retain its own language independently.
- **NOT IMPLEMENTED:** no sheet-language DB column, JSON field, selector, or independent loader exists.
- **BLOCKED:** storage location and migration/default behavior require a future explicit decision.

### 13.8 Missing translations and terminology

- **UNVERIFIED:** no missing-key report was produced.
- **KNOWN CLEANUP ITEM:** older standalone keys may contain terminology superseded by the combined current UI.
- **REQUIRED:** new friend-alpha strings must be added to both EN and RU.
- **REQUIRED:** test long Russian strings at mobile width.

---

## 14. Verification Evidence

### 14.1 Git commands supplied at close

```text
git remote get-url origin
git branch --show-current
git status
git status --short --untracked-files=all
git rev-parse HEAD
git rev-parse origin/main
git ls-remote origin refs/heads/main
git log -1 --stat --oneline
git diff --check
```

Results:

- **VERIFIED:** repository remote correct.
- **VERIFIED:** branch `main`.
- **VERIFIED:** local HEAD, `origin/main`, and remote main all equal `00af1bef4f834860543a51d903dc5b88c847ea51`.
- **VERIFIED:** clean working tree.
- **VERIFIED:** no untracked files.
- **VERIFIED:** `git diff --check` produced no output.

### 14.2 Production build

Command:

```text
npm run build
```

Result:

- **VERIFIED PASS:** optimized production build compiled successfully.
- **VERIFIED PASS:** TypeScript completed successfully.
- **VERIFIED PASS:** page data collected.
- **VERIFIED PASS:** 26/26 static generation units completed.
- **VERIFIED PASS:** final optimization completed.

Significant build versions:

```text
Next.js 16.2.9
Turbopack
```

### 14.3 Routes emitted by the build

```text
/_not-found
/[locale]
/[locale]/[...rest]
/[locale]/account
/[locale]/characters
/[locale]/characters/[id]
/[locale]/characters/new
/[locale]/characters/new/[system]
/[locale]/dashboard
/[locale]/games
/[locale]/games/vampire-the-masquerade
/[locale]/login
/[locale]/profile
/[locale]/profile/edit
/[locale]/register
/auth/confirm
```

- **VERIFIED:** routes are dynamic server-rendered on demand.
- **VERIFIED:** Proxy/Middleware is present.
- **IMPORTANT:** `/[locale]/dashboard` still exists in current code even though Dashboard is excluded from the approved target site map.

### 14.4 Vercel inspection

Command:

```text
npx vercel inspect https://ttrpg-website-xi.vercel.app
```

Result:

- **VERIFIED:** deployment fetched.
- **VERIFIED:** target `production`.
- **VERIFIED:** status `Ready`.
- **VERIFIED:** stable alias listed.
- **VERIFIED:** deployment-specific URL listed.
- **UNVERIFIED:** exact deployed Git SHA was not printed.
- **UNVERIFIED:** no browser/user-flow test followed the inspect command.

The npm deprecation warnings appeared while installing/running the Vercel CLI package and are not evidence of an application build failure.

### 14.5 User scenarios verified during this chat

- **VERIFIED BY USER REPORT:** responsive/mobile character work functioned after implementation.
- **VERIFIED BY USER REPORT:** Open appears in the lower-left of the character card opposite Delete.
- **VERIFIED:** PR #4 documentation merge reached `main`.
- **UNVERIFIED ON FINAL DEPLOYMENT:** registration, login, confirmation, profile edit, character create/edit/delete, portrait upload/replace/remove, locale switching, and mobile layout were not all manually repeated after the documentation-only merge.

### 14.6 Checks not performed at close

- **UNVERIFIED:** `npm run lint`.
- **UNVERIFIED:** unit tests.
- **UNVERIFIED:** integration tests.
- **UNVERIFIED:** end-to-end tests.
- **UNVERIFIED:** translation nested-key parity.
- **UNVERIFIED:** current remote migration list.
- **UNVERIFIED:** two-user RLS regression on the current production environment.
- **UNVERIFIED:** Storage policy regression on the current production environment.
- **UNVERIFIED:** browser matrix.
- **UNVERIFIED:** accessibility audit.
- **UNVERIFIED:** performance audit.

---

## 15. Git State

| Field | State |
|---|---|
| Branch | **VERIFIED:** `main` |
| HEAD | **VERIFIED:** `00af1bef4f834860543a51d903dc5b88c847ea51` |
| `origin/main` | **VERIFIED:** same SHA |
| Remote main | **VERIFIED:** same SHA |
| Ahead/behind | **VERIFIED:** up to date |
| Working tree | **VERIFIED CLEAN** |
| Staged files | **VERIFIED:** none |
| Tracked modified files | **VERIFIED:** none |
| Untracked files | **VERIFIED:** none |
| Last commit | **VERIFIED:** merge PR #4 |
| Documentation source commit | **VERIFIED:** `cf05f066a5a848e4c3efd38148b54295add12c05` |
| Push completed | **VERIFIED:** yes |
| Production deployment created | **VERIFIED:** yes |
| Production deployment Ready | **VERIFIED:** yes |
| Exact deployment SHA | **UNVERIFIED** |
| H004 committed | **NO:** generated outside the repository after this snapshot |

No unsaved code exists in the verified repository state.

---

## 16. Known Problems and Risks

| Severity | Problem | Impact | Mitigation | Status |
|---|---|---|---|---|
| High | No explicit unsaved-change leave guard | A user can navigate away without a clear warning; draft restoration reduces but does not eliminate confusion | Implement shared dirty-state detection and leave warning in Character Friend Alpha | **PLANNED / NEXT TASK** |
| High | Selected portrait `File` is not in session draft | Refresh/remount can silently lose the selected unsaved portrait | Include portrait state in dirty detection and display an explicit warning; do not attempt to serialize `File` into JSON | **KNOWN** |
| Medium | `campaign` and `public` visibility still grant owner-only access | Labels can imply sharing that does not exist | Explain current semantics or temporarily restrict options until sharing architecture exists | **KNOWN / PLANNED** |
| Medium | Combined Touchstones/Convictions field flattens data | Editing can clear `convictions` and move visible lines into `touchstones` | Preserve documented behavior for now; review before any schema revision | **KNOWN** |
| Medium | Portrait cleanup is best-effort | Failed cleanup can leave orphan Storage objects | Keep rollback/cleanup logging; add maintenance process only in a reviewed later task | **KNOWN** |
| Medium | No automated test suite or CI coverage for critical flows | Regressions depend heavily on manual verification | Add targeted tests during Public Readiness or earlier for high-risk shared authorization work | **PLANNED** |
| Medium | Final Ready deployment was not browser-regression-tested | Deployment health is known, but user-flow confidence is incomplete | Run a concise EN/RU/auth/character/portrait smoke test before the next production release claim | **UNVERIFIED** |
| Medium | Exact deployment Git SHA was not shown | Cannot make a strict commit-to-deployment assertion from supplied output | Inspect deployment metadata/checks in Vercel or GitHub before release-signoff | **UNVERIFIED** |
| Medium | Roadmap says owner/GM/player while approved target map says only GM and Players | Future campaign schema could encode an unwanted third user-facing role | Clarify ownership as an internal field or GM responsibility before campaign migration design | **OPEN** |
| Low | `PROJECT_CONTEXT.md` and README snapshot still reference `e2a412b` | New chats may start from an outdated commit/stage | Update snapshot to `00af1be`, mark Architecture Baseline complete, Character Friend Alpha active | **DOCUMENTATION DRIFT** |
| Low | `SITE_MAP.md` and `SITE_MAP_TARGET.md` duplicate target content | Future edits can diverge | Select one canonical target map and make the other a pointer or remove it | **OPEN** |
| Low | `docs/architecture/TARGET_SITE_MAP_V01.md` is empty | Misleading file suggests missing content | Remove it or deliberately populate it; do not treat it as authoritative | **VERIFIED EMPTY** |
| Low | `/[locale]/dashboard` exists although target map excludes Dashboard | Current and target navigation differ | Keep current route until a deliberate removal/redirect task; document the transition | **DECIDED TARGET / NOT IMPLEMENTED** |
| Low | No translation parity automation | Missing nested keys may be found only at runtime | Add a key-parity check in a later quality task | **PLANNED** |

---

## 17. Superseded Approaches

The following approaches are **DEPRECATED** and must not be restored:

1. **DEPRECATED:** display `error.message` or raw Supabase/backend errors to users.
2. **DEPRECATED:** store image bytes or Base64 portrait data in `sheet_data`.
3. **DEPRECATED:** treat a discussed or diagrammed database column/table as existing.
4. **DEPRECATED:** edit an already applied migration.
5. **DEPRECATED:** manually edit generated database types.
6. **DEPRECATED:** use old non-localized application routes as the canonical route model.
7. **DEPRECATED:** manually prepend `/en` or `/ru` instead of using locale-aware navigation helpers.
8. **DEPRECATED:** replace the `next-intl` response with a Supabase response in a way that loses locale headers; only required Supabase cookies are copied into the localization response.
9. **DEPRECATED:** use a separate `useState` for every field of the large VtM sheet; the sheet uses one typed system data object.
10. **DEPRECATED:** duplicate common character fields inside `sheet_data`.
11. **DEPRECATED:** bypass `normalizeVtmV5SheetData()` for persisted VtM records.
12. **DEPRECATED:** assume `campaign` or `public` visibility grants shared access.
13. **DEPRECATED:** force the desktop A4 fixed layout onto mobile screens.
14. **DEPRECATED:** position character-card actions in a way that lets metadata push Open away from the lower-left corner.
15. **DEPRECATED:** treat campaign dice or video as independent access domains outside campaign membership.
16. **DEPRECATED TARGET LABELS:** Dice Pull, Build Your Own Set, Legacy, History, Useful sources, Lore Description, and Playground.
17. **DEPRECATED TARGET STRUCTURE:** a separate global Campaign Invitations section, separate Character Settings/Details sections, or a target Dashboard.
18. **DEPRECATED WORKFLOW:** use an empty deployment-trigger commit unless a normal pushed commit fails to create the expected Vercel check/deployment.

---

## 18. Open Questions

| Question | Blocking | Current Options | Recommended Decision Point |
|---|---|---|---|
| Should the standalone Dice Roller be public for unregistered users? | No for Character Friend Alpha; yes before Dice route design | Public; authenticated-only; limited public mode | Decide during standalone Dice Roller specification |
| What should happen to the current Dashboard route? | No for next task | Remove; redirect to Characters; redirect to Campaigns after campaigns exist; repurpose by new decision | Decide before implementing target top-level navigation |
| How should `campaign` and `public` visibility be presented during Friend Alpha? | Yes for milestone completion | Explanatory copy; disable options; temporarily show only Private | Decide during Character Friend Alpha UX work |
| Should campaign ownership be identical to GM, or an internal field separate from the two user-facing roles? | Yes before campaign schema | Creator is GM; internal owner plus GM/Player member roles; ownership transfer rules | Resolve in Campaign Foundation design before migration |
| How should combined Touchstones/Convictions be stored long term? | No for next task; yes before schema revision | Preserve arrays separately with richer UI; continue flattening; migrate to structured pair objects | Decide before VtM schema version 4 |
| Which site-map file is canonical? | No | `SITE_MAP.md`; `SITE_MAP_TARGET.md`; one canonical plus pointer | Resolve in a documentation cleanup |
| Should the empty `TARGET_SITE_MAP_V01.md` be removed or populated? | No | Remove; populate; replace with pointer | Resolve with site-map canonicalization |
| Where should independent sheet language be stored? | No for current milestone | common character column; system JSONB; separate preferences model | Decide before ADR-003 is accepted and before implementation |
| Which managed video provider will be used? | No until video spike | Provider selection remains open | Decide in Milestone 4 technical spike |
| Is the Ready production deployment definitely built from `00af1be`? | Yes for strict release-signoff only | Check Vercel Git metadata or GitHub deployment check | Verify before claiming commit-specific production release |

---

## 19. Exact Next Task

### Task

**Implement unsaved-change protection for the existing VtM character creator and editor, including unsaved portrait selection/removal, without changing the database schema or VtM schema version.**

### Goal

Prevent users from leaving a new or edited character unintentionally while preserving the existing explicit-save and browser-tab draft model.

### Required inputs

- exact current commit;
- current creator/editor source;
- current draft contract;
- current portrait field behavior;
- EN/RU dictionaries;
- current navigation helpers;
- current VtM sheet page-switch behavior.

### Files to inspect first

```text
AGENTS.md
components/characters/character-creator.tsx
components/characters/character-editor.tsx
components/characters/sheets/vtm-v5/vtm-character-sheet.tsx
components/characters/sheets/vtm-v5/character-portrait-field.tsx
lib/characters/vtm-v5/editor-draft.ts
lib/characters/vtm-v5/schema.ts
lib/characters/portrait.ts
i18n/navigation.ts
messages/en.json
messages/ru.json
messages/en/vtm-v5.json
messages/ru/vtm-v5.json
```

### Dependencies

- current `sessionStorage` draft behavior;
- current explicit Save/Create mutations;
- current `saving` and `creating` flags;
- current portrait selection/removal state;
- Next.js 16 App Router navigation behavior;
- locale-aware navigation;
- no database migration.

### Completion criteria

1. A clean existing character does not show a false unsaved-change warning.
2. A new character remains clean until the user meaningfully changes a field or portrait state.
3. Editing name, visibility, VtM sheet data, or portrait state marks the form dirty.
4. Selecting a new portrait marks the form dirty even though the `File` is not serializable.
5. Removing an existing portrait marks the form dirty.
6. Successful Save/Create resets dirty state before navigation.
7. Failed Save/Create keeps the dirty state.
8. Switching between `core` and `background` inside the same character form does not trigger a leave warning.
9. Leaving/reloading/closing with unsaved changes produces a clear browser-supported warning.
10. The UI contains a clear localized indication that changes or a selected portrait are not saved.
11. English and Russian strings are added consistently.
12. Current draft restoration, portrait preview, card action layout, and responsive behavior do not regress.
13. `VTM_V5_SCHEMA_VERSION` remains `3`.
14. No SQL migration or generated-type edit is introduced.
15. `git diff --check` and `npm run build` pass.
16. Manual smoke tests cover create and edit flows in both locales and at desktop/mobile widths.

### Not in scope

- autosave;
- Saving/Saved visual redesign beyond what is required by the warning;
- campaign/public sharing;
- database/RLS/Storage changes;
- schema version 4;
- Touchstones/Convictions redesign;
- print/PDF;
- final visual theme;
- campaigns;
- Dice Roller;
- Video Rooms;
- CoC 7e;
- broad test-suite setup.

---

## 20. Resume Procedure

1. Open the new chat with the message in Section 24 and attach this handoff.
2. Run the Git verification commands in Section 21.
3. If HEAD differs from `00af1be`, inspect every intervening commit before using this handoff.
4. Confirm the working tree is clean.
5. Read `AGENTS.md`.
6. Inspect the exact current versions of the files in Section 19.
7. Check the relevant local Next.js 16 documentation under `node_modules/next/dist/docs/` before relying on navigation/unload behavior.
8. Document the current state transitions in creator/editor:
   - initial load;
   - draft restore;
   - edit start;
   - field change;
   - portrait select/remove;
   - save/create start;
   - success;
   - failure;
   - navigation.
9. Define a minimal dirty-state model that does not duplicate the entire sheet field-by-field.
10. Decide which strings are common versus VtM-specific.
11. Implement one file group at a time.
12. Verify create and edit separately.
13. Verify both locales.
14. Verify desktop and mobile widths.
15. Run `git diff --check` and `npm run build`.
16. Review the complete diff before committing.
17. Commit to a dedicated feature branch.
18. Push, create a PR, verify the Vercel Preview, merge only after the completion criteria pass.
19. Verify the production alias after merge.
20. Update permanent documentation only with facts introduced by the completed implementation.
21. Update H004 or create H005 at the next chat close.

---

## 21. Useful Commands

Run from Windows CMD.

### Verify repository state

```cmd
cd /d D:\TT_games\00_TTRPG_web\Projects\ttrpg-website
git fetch origin --prune
git remote get-url origin
git branch --show-current
git status
git status --short --untracked-files=all
git rev-parse HEAD
git rev-parse origin/main
git log -1 --stat --oneline
git diff --check
```

### Confirm the expected snapshot

```cmd
git show --stat --oneline 00af1bef4f834860543a51d903dc5b88c847ea51
git log --oneline --decorate --graph -10
```

### Inspect the exact next-task files

```cmd
type AGENTS.md
type components\characters\character-creator.tsx
type components\characters\character-editor.tsx
type lib\characters\vtm-v5\editor-draft.ts
type lib\characters\vtm-v5\schema.ts
type lib\characters\portrait.ts
```

### Search relevant state and navigation behavior

```cmd
git --no-pager grep -n -I "beforeunload" -- app components lib
git --no-pager grep -n -I "sessionStorage" -- app components lib
git --no-pager grep -n -I "portraitFile" -- components lib
git --no-pager grep -n -I "saving" -- components\characters
git --no-pager grep -n -I "creating" -- components\characters
```

### Create the feature branch only after inspection

```cmd
git switch -c feature/character-unsaved-guard
```

### Verify changes

```cmd
git status --short
git diff --check
npm run build
```

### Review before commit

```cmd
git diff --stat
git diff
git status
```

Do not use `git add -A` until the complete file list has been reviewed.

---

## 22. References

| Reference | Value |
|---|---|
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Exact current commit | `00af1bef4f834860543a51d903dc5b88c847ea51` |
| Production alias | `https://ttrpg-website-xi.vercel.app` |
| Inspected production deployment | `https://ttrpg-website-qp9vekcpw-andrey-yudin.vercel.app` |
| Current project context | `PROJECT_CONTEXT.md` |
| Current handoff | `docs/handoffs/H004_CURRENT_HANDOFF.md` after this generated file is copied and committed |
| Historical handoffs | `docs/handoffs/H001_CURRENT_HANDOFF.md` through `H003_CURRENT_HANDOFF.md` |
| Architecture | `docs/architecture/ARCHITECTURE.md` |
| Database/RLS/Storage | `docs/architecture/DATABASE.md` |
| Localization | `docs/architecture/I18N.md` |
| Character sheets | `docs/architecture/CHARACTER_SHEETS.md` |
| Security | `docs/architecture/SECURITY.md` |
| Design system | `docs/architecture/DESIGN_SYSTEM.md` |
| Roadmap | `docs/product/ROADMAP.md` |
| Campaign proposal | `docs/product/CAMPAIGNS.md` |
| Dice proposal | `docs/product/DICE_ROLLS.md` |
| Video proposal | `docs/product/VIDEO_ROOMS.md` |
| Game hub proposal | `docs/product/GAME_HUB.md` |
| Current/target site map | `docs/product/SITE_MAP.md` |
| Target-only site map | `docs/product/SITE_MAP_TARGET.md` |
| Current structure | `docs/product/SITE_STRUCTURE_CURRENT.md` |
| Target structure | `docs/product/SITE_STRUCTURE_TARGET.md` |
| Structure comparison | `docs/product/SITE_STRUCTURE_COMPARISON.md` |
| Target repository guide | `docs/product/TARGET_PROJECT_STRUCTURE.md` |
| Initial schema migration | `supabase/migrations/20260630143000_initial_schema.sql` |
| Portrait Storage migration | `supabase/migrations/20260702150000_character_portraits.sql` |
| Generated database types | `types/database.types.ts` |
| ADR index | `docs/decisions/README.md` |
| Accepted ADRs | ADR-001, ADR-002, ADR-004, ADR-005, ADR-006 |
| Proposed ADRs | ADR-003, ADR-007, ADR-008, ADR-009 |
| Repository instructions | `AGENTS.md` |
| Build evidence | User-supplied `npm run build` output at H004 close |
| Deployment evidence | User-supplied `npx vercel inspect` output at H004 close |

---

## 23. Suggested Updates to Permanent Documents

| Document | Recommendation |
|---|---|
| `PROJECT_CONTEXT.md` | **UPDATE REQUIRED:** change repository snapshot from `e2a412b` to `00af1be`; mark Architecture Baseline complete; set Character Friend Alpha as active; record PR #4 merge and the final verified build/deployment state; retain the distinction between Ready deployment and unverified browser regression. |
| `README.md` | **UPDATE REQUIRED:** update the “Current snapshot” commit from `e2a412b` to `00af1be`; optionally state that Milestone 1 is complete and Milestone 2 is next. |
| `docs/architecture/ARCHITECTURE.md` | **NO CHANGE** for the current repository state. Update only after the unsaved-change implementation establishes a reusable state/guard pattern. |
| `docs/architecture/DATABASE.md` | **NO CHANGE:** no database, RLS, Storage, or generated-type change occurred in this chat. Do not change live-applied claims without rerunning migration verification. |
| `docs/architecture/I18N.md` | **NO CHANGE:** no localization architecture changed. Add new keys only when friend-alpha UI is implemented. |
| `docs/architecture/CHARACTER_SHEETS.md` | **NO CHANGE NOW:** it already records the current unsaved portrait limitation and planned warning. Update after implementation with the verified dirty-state behavior. |
| `docs/product/ROADMAP.md` | **UPDATE REQUIRED:** mark Milestone 1 complete; mark Milestone 2 active; reconcile “owner/GM/player roles” with the approved two user-facing roles, Game Master and Player. |
| `docs/product/SITE_MAP.md` | **REVIEW REQUIRED:** choose whether it is the canonical combined current/target map. |
| `docs/product/SITE_MAP_TARGET.md` | **REVIEW REQUIRED:** either make it the canonical target map or replace it with a pointer to the target section in `SITE_MAP.md`. |
| `docs/architecture/TARGET_SITE_MAP_V01.md` | **UPDATE REQUIRED:** remove the empty file or replace it with an intentional pointer; do not leave a zero-line authoritative-looking document. |
| ADR-001 | **NO CHANGE.** |
| ADR-002 | **NO CHANGE.** |
| ADR-003 | **NO CHANGE:** remains Proposed. |
| ADR-004 | **NO CHANGE.** |
| ADR-005 | **NO CHANGE.** |
| ADR-006 | **NO CHANGE.** |
| ADR-007 | **NO CHANGE:** remains Proposed. |
| ADR-008 | **NO CHANGE:** remains Proposed. |
| ADR-009 | **NO CHANGE:** remains Proposed. |
| `docs/handoffs/H004_CURRENT_HANDOFF.md` | **ADD:** copy this generated file into the repository, review, and commit separately if the owner wants handoffs versioned in Git. |

---

## 24. Suggested Opening Message for the Next Chat

```text
Continue the Web_Site_TTRPG / ttrpg-website project.

Repository:
https://github.com/Andrey-0101/ttrpg-website

Verified current commit:
00af1bef4f834860543a51d903dc5b88c847ea51

Current handoff:
H004_CURRENT_HANDOFF.md

Current stage:
Milestone 1 — Architecture Baseline is complete. Begin Milestone 2 — Character Friend Alpha.

Exact first task:
Implement unsaved-change protection for the existing VtM character creator and editor, including unsaved portrait selection/removal, without changing the database schema or VTM_V5_SCHEMA_VERSION = 3.

Before proposing code:
1. verify Git status, branch, HEAD, origin/main, and the current build;
2. read H004 and AGENTS.md;
3. inspect the exact current creator, editor, draft, portrait, navigation, and EN/RU message files;
4. use the current commit, migrations, and generated types as the source of truth;
5. do not restore older chat code or invent missing infrastructure.
```

---

## 25. Handoff Quality Check

| Check | Result |
|---|---|
| Handoff sequence correct | **PASS:** H004 follows H001–H003. |
| Commit matches described state | **PASS:** current state is tied to exact commit `00af1be`. |
| Local and remote commits match | **PASS.** |
| Working tree accurately described | **PASS:** clean; no untracked files at snapshot time. |
| H004 itself distinguished from repository snapshot | **PASS:** marked uncommitted until copied and committed. |
| Planned work separated from implemented work | **PASS.** |
| Current routes separated from target site map | **PASS:** current Dashboard route and target exclusion both recorded. |
| Database facts grounded in migrations/types | **PASS.** |
| Live migration status not invented | **PASS:** H003 history is distinguished from H004 re-verification. |
| Dashboard-only Supabase settings not invented | **PASS.** |
| Storage bucket/policies grounded in migration | **PASS.** |
| Deployment status grounded in supplied inspect output | **PASS.** |
| Exact deployment commit association marked | **PASS:** UNVERIFIED. |
| Browser regression status marked | **PASS:** UNVERIFIED. |
| VtM schema version preserved | **PASS:** version 3. |
| Current data and target models separated | **PASS.** |
| Accepted and proposed ADRs separated | **PASS.** |
| User requirements separated from recommendations | **PASS.** |
| Superseded approaches preserved | **PASS.** |
| One exact next task specified | **PASS.** |
| Completion criteria provided | **PASS.** |
| Permanent-document drift identified | **PASS.** |
| No full source files copied | **PASS.** |
| No secrets or `.env` values included | **PASS.** |
| Sufficient to resume without full chat | **PASS.** |

---

**End of H004_CURRENT_HANDOFF.md**
