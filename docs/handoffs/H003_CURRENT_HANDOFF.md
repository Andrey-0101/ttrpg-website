# H003_CURRENT_HANDOFF.md

## 1. Document Control

| Field | Value |
|---|---|
| Project name | **Web_Site_TTRPG / ttrpg-website** |
| Handoff ID | **H003** |
| Previous handoffs | **H001_CURRENT_HANDOFF.md**, **H002_CURRENT_HANDOFF.md** |
| Supersedes | **H002 as the current-state handoff. H001 and H002 remain historical records.** |
| Handoff version | **1.0** |
| Creation date | **2026-07-02** |
| Scope of this chat | **Supabase migration/type baseline; complete bilingual VtM V5 character-sheet editor; A4-oriented two-page layout based on the provided template; identity card and portrait area; visual frame and dark-red site background; Page 1 and Page 2 restructuring; Humanity/Stains tracker; portrait upload, replacement, removal and signed display; redesigned “My Characters” cards; Storage bucket/policies; related translations and UX fixes.** |
| Repository URL | **VERIFIED:** `https://github.com/Andrey-0101/ttrpg-website` |
| Git remote | **VERIFIED:** `https://github.com/Andrey-0101/ttrpg-website.git` |
| Active branch | **VERIFIED:** `feature/vtm-v5-a4-layout` |
| Exact HEAD commit | **VERIFIED:** `8d41a42005934fda9cf3c19c2a767c4bfa00fd2f` |
| HEAD commit message | **VERIFIED:** `Add VtM portraits stains and character cards` |
| Upstream branch | **VERIFIED:** `origin/feature/vtm-v5-a4-layout` |
| Upstream commit | **VERIFIED:** `8d41a42005934fda9cf3c19c2a767c4bfa00fd2f` |
| `origin/main` | **VERIFIED:** `b961432613eeb81b4612a6ac1c4935e5a136e868` |
| Remote `main` | **VERIFIED:** `b961432613eeb81b4612a6ac1c4935e5a136e868` |
| Branch relation to `main` | **VERIFIED:** current feature branch contains two commits after `origin/main`: `0dd74d4` and `8d41a42`. It is not merged into `main`. |
| Working tree | **DIRTY:** no tracked modifications, but one untracked file exists: `docs/command_prompt.docx`. |
| Staged files | **VERIFIED:** none |
| Tracked unstaged files | **VERIFIED:** none |
| Untracked files | **VERIFIED:** `docs/command_prompt.docx` |
| Build status | **VERIFIED:** `npm run build` passed, including TypeScript and all 26 generated route entries. |
| Local/remote migration history | **VERIFIED:** `20260630143000` and `20260702150000` exist both locally and remotely. |
| Stable production URL | **VERIFIED REACHABLE:** `https://ttrpg-website-xi.vercel.app` returns `307` to `/en`. |
| Production code version | **UNVERIFIED:** the canonical production alias was reachable, but the exact deployed commit was not inspected. `origin/main` is behind the current feature branch, so current portrait/A4 changes must not be assumed to be in production. |
| Latest listed preview URL | **VERIFIED READY / COMMIT ASSOCIATION UNVERIFIED:** `https://ttrpg-website-3p3lmqz5i-andrey-yudin.vercel.app` was listed as `Ready`, `Preview`. |
| Preview access | **VERIFIED:** the preview redirects to Vercel SSO/deployment protection when accessed anonymously. |
| Manual verification of exact preview commit | **UNVERIFIED:** no final route-by-route test proving that the listed preview serves exact HEAD `8d41a42` was recorded. |
| Secrets included | **VERIFIED:** none |

### Sequence metadata

- **H001** records the initial localized-routing foundation.
- **H002** records completion of general EN/RU localization and the pre-full-sheet character-management baseline at `aa939c197bded84bf616a3b2246f54042e5c5253`.
- **H003** records the current state at `8d41a42005934fda9cf3c19c2a767c4bfa00fd2f`.
- When handoffs conflict, use the source-of-truth priority in Section 3.
- H003 describes a feature branch that is ahead of `main`; it does not claim that production runs the H003 code.

---

## 2. Instructions for the Next Chat

1. **Read this H003 handoff completely before proposing changes.**
2. **Verify repository state first:** branch, HEAD, upstream, `origin/main`, working tree, build, migration list.
3. **Resolve the untracked file `docs/command_prompt.docx` before starting a new feature.** Decide explicitly whether to commit it, move it outside the repository, or ignore it.
4. **Read `AGENTS.md` before writing Next.js code.** It requires using the local Next.js 16 documentation in `node_modules/next/dist/docs/`.
5. Inspect the actual current files at commit `8d41a42005934fda9cf3c19c2a767c4bfa00fd2f`; do not reconstruct code from older chat snippets or ZIP descriptions.
6. Do not treat `main` or production as containing the current feature branch until a PR merge and production deployment are verified.
7. Do not invent tables, columns, constraints, indexes, RLS policies, Storage buckets, Storage policies, environment values, Dashboard settings, migrations, tests or deployment results.
8. Verify every item marked **ASSUMED** or **UNVERIFIED** before depending on it.
9. Preserve existing `characters.sheet_data` and existing records. Use `normalizeVtmV5SheetData()` for persisted VtM data.
10. Do not expose raw backend errors in the interface.
11. Keep all code comments and all text inside code blocks in English.
12. For substantial edits, inspect the full current file first and provide complete replacement files or a ZIP preserving paths.
13. Work in small verified steps and run `npm run build` and `git diff --check` after significant changes.

---

## 3. Source-of-Truth Priority

Use the following order:

1. **Code in exact Git commit `8d41a42005934fda9cf3c19c2a767c4bfa00fd2f`.**
2. **SQL migrations in that commit.**
3. **Generated database types in that commit.**
4. **Factually verified Supabase and Vercel configuration/behavior.**
5. **This H003_CURRENT_HANDOFF.md.**
6. **PROJECT_CONTEXT.md**, if later created and still current.
7. **Current functional specifications and accepted ADRs.**
8. **The chat in which a change is being made.**
9. **Older chats and archived handoffs.**

Conflict rules:

- Newer handoff numbering indicates chronology only.
- A planned or discussed feature is not implemented unless it exists in the current commit or verified infrastructure.
- Repository documentation that conflicts with a newer migration is stale and must be updated rather than treated as authoritative.
- Do not restore approaches listed as **DEPRECATED**.

---

## 4. Current Project Snapshot

### Technology stack

| Area | State |
|---|---|
| Framework | **VERIFIED:** Next.js `16.2.9`, App Router, Turbopack |
| React | **VERIFIED:** React / React DOM `19.2.4` |
| TypeScript | **VERIFIED:** `^5` |
| Styling | **VERIFIED:** Tailwind CSS `^4` |
| Localization | **VERIFIED:** `next-intl ^4.13.0` |
| Backend | **VERIFIED:** Supabase PostgreSQL, Auth and Storage |
| Supabase libraries | **VERIFIED:** `@supabase/ssr ^0.12.0`, `@supabase/supabase-js ^2.108.2` |
| Hosting | **VERIFIED:** Vercel |
| Source control | **VERIFIED:** GitHub |
| Local shell | **VERIFIED:** Windows CMD |

### Main implemented modules

- **IMPLEMENTED:** locale-prefixed EN/RU application routes.
- **IMPLEMENTED:** persisted route locale and localized metadata/404/auth flows from earlier stages.
- **IMPLEMENTED:** Supabase schema baseline and generated public-schema types.
- **IMPLEMENTED:** owner-only RLS for characters.
- **IMPLEMENTED:** complete VtM V5 sheet data model at `schemaVersion: 3`.
- **IMPLEMENTED:** two-page VtM editor with view/edit modes.
- **IMPLEMENTED:** A4-oriented desktop layout using the supplied character-sheet template.
- **IMPLEMENTED:** identity card with portrait, name and core identity information.
- **IMPLEMENTED:** Attributes, Skills, Specialties, Health, Willpower, Hunger, Humanity, Stains, Resonance, Disciplines, Advantages/Flaws, Blood Potency, Experience, biography and notes.
- **IMPLEMENTED:** private character portrait Storage bucket and owner-folder policies.
- **IMPLEMENTED:** portrait selection, preview, upload, replacement, removal and signed URL display.
- **IMPLEMENTED:** “My Characters” cards styled after the top identity section.
- **IMPLEMENTED:** sessionStorage draft/page restoration for the VtM form.
- **IMPLEMENTED:** dark-red site background and white framed character sheets.

### Active stage

**PLANNED NEXT:** responsive/mobile adaptation of the VtM sheet and character cards.

The current A4 design is primarily desktop-oriented. The next stage should make narrow screens usable without preserving a rigid A4 aspect ratio on mobile.

### Localization

- **IMPLEMENTED:** site locales `en` and `ru`.
- **IMPLEMENTED:** common dictionaries remain in `messages/en.json` and `messages/ru.json`.
- **IMPLEMENTED:** VtM sheet dictionaries are split into:
  - `messages/en/vtm-v5.json`
  - `messages/ru/vtm-v5.json`
- **IMPLEMENTED:** `i18n/request.ts` merges the common and VtM dictionaries.
- **NOT IMPLEMENTED:** independent per-character sheet language. Sheet labels still follow the site route locale.

### Authentication

- **IMPLEMENTED:** Supabase Auth login/register/session handling from prior stages.
- **IMPLEMENTED:** technical `/auth/confirm` callback.
- **IMPLEMENTED:** localized account/auth interfaces and safe user-facing errors.
- **VERIFIED BUILD:** authentication-related routes compile.
- **UNVERIFIED IN H003:** no new end-to-end registration/confirmation matrix was rerun in this chat.

### Character management

- **IMPLEMENTED:** create, list, open, edit, save, clear and delete.
- **IMPLEMENTED:** owner-only DB policies.
- **IMPLEMENTED:** VtM cards display portrait and identity summary.
- **IMPLEMENTED:** portrait cleanup is attempted on replacement and deletion.
- **NOT IMPLEMENTED:** campaign/public sharing semantics.
- **NOT IMPLEMENTED:** portrait crop/repositioning UI.
- **NOT IMPLEMENTED:** print/PDF workflow.
- **NOT IMPLEMENTED:** mobile final pass.

### Database

- **VERIFIED:** migrations exist and remote migration history matches local.
- **VERIFIED:** generated `types/database.types.ts` exists.
- **VERIFIED:** `public.profiles` and `public.characters` exist in migrations/types.
- **VERIFIED:** private Storage bucket migration exists and has been applied remotely.
- **KNOWN ISSUE:** Supabase client files import `Database`, but current calls to `createBrowserClient` / `createServerClient` do not pass `<Database>`. Generated typing is therefore not fully connected.
- **KNOWN DOCUMENTATION DRIFT:** `docs/DATABASE.md` still states that there are no application buckets and portrait upload must not be implemented. That section is obsolete after migration `20260702150000`.

### Production

- **VERIFIED:** stable alias responds and redirects to `/en`.
- **UNVERIFIED:** exact production commit.
- **VERIFIED:** current feature branch was pushed to its upstream.
- **VERIFIED:** a Ready preview exists, but anonymous access is protected by Vercel authentication.
- **UNVERIFIED:** exact preview-to-commit association and final preview regression.

---

## 5. Scope of the Completed Chat

### Original goal

**IMPLEMENTED:** move from the initial minimal VtM character sheet to a complete bilingual character sheet and make it usable in the website’s character creation/editing flows.

### Additional tasks introduced

- **IMPLEMENTED:** establish a repository-backed Supabase baseline and generated types.
- **IMPLEMENTED:** use the supplied VtM V5 two-page template as the layout reference.
- **IMPLEMENTED:** convert the sheet to an A4-oriented two-page desktop layout.
- **IMPLEMENTED:** create a reusable top identity/portrait card.
- **IMPLEMENTED:** restructure both pages and compact their visual hierarchy.
- **IMPLEMENTED:** add draft persistence across locale changes and reloads in the same tab.
- **IMPLEMENTED:** refine translations, including `Опоры и Убеждения`.
- **IMPLEMENTED:** add Humanity/Stains graphical tracking.
- **IMPLEMENTED:** add character portraits through private Supabase Storage.
- **IMPLEMENTED:** redesign “My Characters” cards.
- **IMPLEMENTED:** create a red sheet frame and dark-red site background.
- **IMPLEMENTED:** apply the portrait Storage migration to the linked remote database.
- **PLANNED:** mobile responsiveness and later print/PDF support.

### Actual end state

- **VERIFIED:** current feature branch HEAD is pushed and build passes.
- **VERIFIED:** both required migrations are applied remotely.
- **VERIFIED:** current branch is two commits ahead of `main`.
- **DIRTY:** one untracked DOCX exists.
- **UNVERIFIED:** current branch is not confirmed merged/deployed to production.
- **PLANNED:** responsive/mobile pass is the next development stage.

---

## 6. Work Completed

| Status | Change | Files | Commit | Verification |
|---|---|---|---|---|
| **IMPLEMENTED** | Added Supabase schema baseline, RLS definition, generated types and database documentation | `supabase/migrations/20260630143000_initial_schema.sql`, `types/database.types.ts`, `docs/DATABASE.md`, Supabase client files | `2554981` | **VERIFIED:** present in current commit; baseline migration is listed locally/remotely. |
| **IMPLEMENTED** | Added complete typed VtM V5 editor and schema normalization | `lib/characters/vtm-v5/**`, `components/characters/sheets/vtm-v5/**`, creator/editor, VtM dictionaries | `fda915c` | **VERIFIED:** committed; build passed; merged by PR #1. |
| **IMPLEMENTED** | Merged complete VtM editor into `main` | Merge of feature branch | `b961432` | **VERIFIED:** `origin/main` currently points to this merge commit. |
| **IMPLEMENTED** | Redesigned VtM sheet as framed A4-style two-page layout | A4/page/section components, templates under `docs/VtM-V5_character-sheet-template`, VtM dictionaries, `.vscode/settings.json` | `0dd74d4` | **VERIFIED:** current branch contains commit; user reported the redesigned pages and cosmetic changes working. |
| **IMPLEMENTED** | Added combined Humanity/Stains tracker | `components/characters/sheets/vtm-v5/trackers-section.tsx`, translations | `8d41a42` | **VERIFIED:** code exists in current commit; build passes. Detailed scenario matrix was not recorded. |
| **IMPLEMENTED** | Added portrait select/preview/upload/replace/remove | `character-portrait-field.tsx`, creator/editor, `lib/characters/portrait.ts` | `8d41a42` | **VERIFIED:** code exists and compiles. Storage migration applied. Full browser scenario matrix remains unrecorded. |
| **IMPLEMENTED** | Added private portrait bucket and owner-path Storage policies | `supabase/migrations/20260702150000_character_portraits.sql` | `8d41a42` | **VERIFIED:** local and remote migration versions match. |
| **IMPLEMENTED** | Redesigned “My Characters” summary cards to mirror the identity card | `character-summary-card.tsx`, character list page, detail page | `8d41a42` | **VERIFIED:** code exists and build passes. |
| **IMPLEMENTED** | Added portrait cleanup attempts during character deletion/replacement | `delete-character-button.tsx`, editor/creator | `8d41a42` | **VERIFIED:** code exists. Failure cleanup edge cases remain possible. |
| **IMPLEMENTED** | Changed site background to dark red and kept dropdown options readable | `app/globals.css` | `8d41a42` | **VERIFIED:** current values are `#2b070b` / `#f7eeee`; build passes. |
| **VERIFIED** | Applied both migrations to linked Supabase project | Remote migration history | N/A | `npx supabase migration list` shows both local and remote versions. |
| **VERIFIED** | Pushed current feature branch | Git remote branch | `8d41a42` | Upstream and local HEAD match. |
| **VERIFIED** | Production build | Whole project | `8d41a42` | Next.js compilation and TypeScript passed. |

---

## 7. Relevant File Map

| Path | Purpose | Current State | Notes |
|---|---|---|---|
| `AGENTS.md` | Repository-specific coding instruction | **VERIFIED** | Read relevant Next.js 16 local docs before coding. |
| `package.json` | Runtime/tool versions and scripts | **VERIFIED** | Scripts: `dev`, `build`, `start`, `lint`. |
| `app/globals.css` | Site background, foreground and dropdown option colors | **IMPLEMENTED** | Dark red `#2b070b`; light foreground `#f7eeee`. |
| `i18n/routing.ts` | EN/RU route configuration and locale cookie | **IMPLEMENTED** | `localePrefix: "always"`, one-year cookie. |
| `i18n/request.ts` | Loads and merges common + VtM dictionaries | **IMPLEMENTED** | Dynamically loads `messages/<locale>.json` and `messages/<locale>/vtm-v5.json`. |
| `messages/en.json` | Common English application messages | **IMPLEMENTED** | Monolithic common file. |
| `messages/ru.json` | Common Russian application messages | **IMPLEMENTED** | Monolithic common file. |
| `messages/en/vtm-v5.json` | English VtM sheet messages | **IMPLEMENTED** | Dedicated system dictionary. |
| `messages/ru/vtm-v5.json` | Russian VtM sheet messages | **IMPLEMENTED** | Contains `touchstonesAndConvictions: "Опоры и Убеждения"`. |
| `app/[locale]/characters/page.tsx` | Server-side character list and signed portrait URLs | **IMPLEMENTED** | Normalizes VtM identity and renders `CharacterSummaryCard`. |
| `app/[locale]/characters/[id]/page.tsx` | Character detail route | **IMPLEMENTED** | Loads portrait path, creates signed URL, renders editor. |
| `components/characters/character-creator.tsx` | Create character and optional portrait | **IMPLEMENTED** | Creates row first, uploads portrait, then stores path. Uses rollback attempts. |
| `components/characters/character-editor.tsx` | View/edit/save, draft restoration and portrait lifecycle | **IMPLEMENTED** | Replaces/removes portrait after successful DB update logic. |
| `components/characters/character-summary-card.tsx` | “My Characters” card | **IMPLEMENTED** | Mirrors top VtM identity card for VtM; fallback for other systems. |
| `components/characters/delete-character-button.tsx` | Delete character and attempt portrait removal | **IMPLEMENTED** | Deletes DB row before portrait file; failed file removal can leave an orphan. |
| `components/characters/sheets/vtm-v5/vtm-character-sheet.tsx` | Sheet composition and Page 1/Page 2 switch | **IMPLEMENTED** | Receives portrait props and typed `VtmV5SheetData`. |
| `components/characters/sheets/vtm-v5/a4-sheet-page.tsx` | A4-like white page and red frame | **IMPLEMENTED** | Current frame is `border-[3mm]`, color `#b00000`; desktop aspect `210/297`. |
| `components/characters/sheets/vtm-v5/core-sheet-page.tsx` | Page 1 composition | **IMPLEMENTED** | Identity, Attributes, tracks, Skills, trackers, Disciplines. |
| `components/characters/sheets/vtm-v5/background-sheet-page.tsx` | Page 2 composition | **IMPLEMENTED** | Outer content border uses `border-x border-t` to avoid double bottom border. |
| `components/characters/sheets/vtm-v5/character-identity-card.tsx` | Top identity card | **IMPLEMENTED** | Portrait + name + identity fields; `sect` remains in data but is not part of the main card. |
| `components/characters/sheets/vtm-v5/character-portrait-field.tsx` | Portrait UI | **IMPLEMENTED** | JPG/PNG/WebP, 5 MB max, select/replace/remove. |
| `components/characters/sheets/vtm-v5/trackers-section.tsx` | Resonance, Hunger, Humanity, Stains | **IMPLEMENTED** | Humanity fills left; Stains are red slashes from the right. |
| `components/characters/sheets/vtm-v5/background-principles-section.tsx` | Tenets, combined Touchstones/Convictions, Clan Bane | **IMPLEMENTED WITH DATA-FLATTENING BEHAVIOR** | Editing combined text writes all entries to `touchstones` and clears `convictions`. |
| `components/characters/sheets/vtm-v5/biography-section.tsx` | Biography fields | **IMPLEMENTED** | True/Apparent age share a row; History is final lower field. |
| `lib/characters/vtm-v5/schema.ts` | Current VtM data contract and normalizer | **IMPLEMENTED** | `VTM_V5_SCHEMA_VERSION = 3`; preserves unknown keys under `extensions`. |
| `lib/characters/vtm-v5/editor-draft.ts` | Session draft and active-page persistence | **IMPLEMENTED** | Draft version `1`; does not persist `File` objects for portraits. |
| `lib/characters/portrait.ts` | Portrait validation, path creation, signed URL helper | **IMPLEMENTED** | Private bucket; path `userId/characterId/unique.ext`; signed URL TTL 1 hour. |
| `types/database.types.ts` | Generated public-schema DB types | **VERIFIED** | Includes `profiles` and `characters`. Do not edit manually. |
| `utils/supabase/client.ts` | Browser Supabase client | **PARTIALLY TYPED** | Imports `Database` but does not call `createBrowserClient<Database>`. |
| `utils/supabase/server.ts` | Server Supabase client | **PARTIALLY TYPED** | Imports `Database` but does not call `createServerClient<Database>`. |
| `utils/supabase/proxy.ts` | Supabase session refresh | **PARTIALLY TYPED** | Imports `Database` but generic is not supplied. |
| `supabase/migrations/20260630143000_initial_schema.sql` | Public schema and RLS baseline | **VERIFIED/APPLIED** | Must not be reapplied as a new migration. |
| `supabase/migrations/20260702150000_character_portraits.sql` | Portrait bucket and Storage RLS | **VERIFIED/APPLIED** | Private bucket; 5 MB; JPEG/PNG/WebP; user-folder policies. |
| `docs/DATABASE.md` | Database documentation | **OUTDATED** | Storage section predates portrait migration and must be updated. |
| `docs/VtM-V5_character-sheet-template/` | Layout reference files | **VERIFIED** | Includes supplied PDF/JPG/DOCX template assets. |
| `docs/command_prompt.docx` | User document currently outside Git | **UNTRACKED / PURPOSE UNVERIFIED** | Resolve before new development. |

---

## 8. Current Data Contracts

### 8.1 Confirmed database columns

#### `public.characters`

**VERIFIED from migration and generated types:**

| Column | SQL/TS state |
|---|---|
| `id` | UUID, primary key, default `gen_random_uuid()`, non-null |
| `owner_id` | UUID, non-null, FK to `auth.users.id`, `ON DELETE CASCADE` |
| `name` | text, non-null |
| `game_system` | text, non-null |
| `description` | nullable text |
| `portrait_url` | nullable text; currently stores a private Storage path for new portraits |
| `visibility` | text, non-null, default `private` |
| `sheet_data` | JSONB, non-null, default `{}` |
| `created_at` | timestamptz, non-null, default `now()` |
| `updated_at` | timestamptz, non-null, default `now()` |

#### `public.profiles`

**VERIFIED from migration and generated types:**

| Column | SQL/TS state |
|---|---|
| `id` | UUID, primary key, FK to `auth.users.id`, `ON DELETE CASCADE` |
| `username` | nullable text, unique |
| `display_name` | nullable text |
| `bio` | nullable text |
| `avatar_url` | nullable text |
| `created_at` | timestamptz, non-null, default `now()` |

### 8.2 Current TypeScript contracts

- **VERIFIED:** `Json` and `Database` generated in `types/database.types.ts`.
- **IMPLEMENTED:** `VtmV5SheetData` in `lib/characters/vtm-v5/schema.ts`.
- **IMPLEMENTED:** `VtmV5Identity`, `VtmV5Trackers`, `VtmV5DamageTrack`, `VtmV5Discipline`, `VtmV5Advantage`, `VtmV5Biography`, `VtmV5BloodPotencyDetails`.
- **IMPLEMENTED:** visibility union `private | campaign | public` is used for VtM drafts.
- **IMPLEMENTED:** sheet-page union `core | background`.
- **IMPLEMENTED:** portrait validation accepts MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- **IMPLEMENTED:** portrait maximum is `5 * 1024 * 1024` bytes.

### 8.3 Current `sheet_data` JSONB format

Current VtM schema:

```text
schemaVersion: 3

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

attributes:
  strength
  dexterity
  stamina
  charisma
  manipulation
  composure
  intelligence
  wits
  resolve

skills:
  27 V5 skill ratings

skillSpecialties:
  partial map from skill key to string array

disciplines:
  id
  name
  dots
  powers[]
  notes

advantages:
  id
  name
  dots
  category: background | merit | flaw | other
  notes

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

chronicleTenets[]
convictions[]
touchstones[]
clanBane

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

notes
extensions
```

### 8.4 Current `schemaVersion`

- **VERIFIED:** `VTM_V5_SCHEMA_VERSION = 3`.
- **IMPLEMENTED:** defaults are created by `createDefaultVtmV5SheetData()`.
- **IMPLEMENTED:** persisted JSON is normalized by `normalizeVtmV5SheetData()`.

### 8.5 Backward compatibility

`normalizeVtmV5SheetData()`:

- **IMPLEMENTED:** accepts old top-level `clan`, `hunger`, and `resonance`.
- **IMPLEMENTED:** fills missing fields with safe defaults.
- **IMPLEMENTED:** clamps ratings/trackers to configured ranges.
- **IMPLEMENTED:** preserves unknown top-level keys in `extensions`.
- **IMPLEMENTED:** keeps empty new Discipline/Advantage rows if an ID gives the row content identity.
- **IMPLEMENTED:** existing `description` and `sect` data are not deleted, even though current primary VtM UI does not emphasize them.

Combined Touchstones/Convictions behavior:

- **IMPLEMENTED:** previously stored arrays are combined for display.
- **IMPLEMENTED:** after the user edits the combined field, every line is saved into `touchstones` and `convictions` becomes `[]`.
- **DECIDED BY UI REQUEST:** the visible field is one combined section.
- **RISK:** semantic distinction between the two original arrays is lost on edit.

Portrait backward compatibility:

- **IMPLEMENTED:** `portrait_url` may be a Storage path or a legacy `http://` / `https://` URL.
- **IMPLEMENTED:** only non-HTTP values are treated as private Storage paths.

### 8.6 Target model

For the next responsive stage:

- **DECIDED:** no JSONB schema change is required.
- **DECIDED:** data contracts should remain presentation-independent.
- **DECIDED:** A4 proportions remain for desktop/print, but mobile should use content-driven height and stacked sections.

Longer-term target items:

- **PLANNED:** independent `sheet_language`; exact database representation is unresolved.
- **PLANNED:** print/static rendering and browser PDF workflow.
- **PLANNED:** optional portrait crop/position metadata; no schema decision yet.
- **PLANNED:** campaign/public access model.

### 8.7 Required migrations

- **VERIFIED:** no new migration is required for the responsive/mobile pass.
- **PLANNED:** a future migration may be needed for independent `sheet_language`.
- **UNVERIFIED:** crop/position metadata may or may not require DB changes.
- **REQUIRED PROCESS:** every future DB/Storage change must be a new migration; do not edit applied migrations.

---

## 9. Database, RLS and Storage State

### Tables

| Object | State |
|---|---|
| `public.profiles` | **VERIFIED** |
| `public.characters` | **VERIFIED** |
| Other application tables | **UNVERIFIED / not defined in current public migration/types** |

### Constraints and indexes

**VERIFIED:**

- `characters_pkey` on `characters.id`.
- `profiles_pkey` on `profiles.id`.
- `profiles_username_key` unique constraint on `profiles.username`.
- `characters_visibility_check` allows only `private`, `campaign`, `public`.
- `characters.owner_id` FK to `auth.users.id` with cascade delete.
- `profiles.id` FK to `auth.users.id` with cascade delete.
- `on_auth_user_created` trigger creates the profile row.
- **NO EXPLICIT INDEX VERIFIED** on `characters.owner_id` beyond constraints shown in the migration.

### RLS

**VERIFIED in migration:**

- RLS enabled on `characters`.
- RLS enabled on `profiles`.

#### Character policies

Authenticated users can:

- **VERIFIED:** insert only rows with `owner_id = auth.uid()`.
- **VERIFIED:** select only rows with `owner_id = auth.uid()`.
- **VERIFIED:** update only their own rows.
- **VERIFIED:** delete only their own rows.

#### Profile policies

- **VERIFIED:** authenticated users can select profiles.
- **VERIFIED:** users can update only the profile with `id = auth.uid()`.

Cross-user testing:

- **VERIFIED IN CURRENT REPOSITORY DOCUMENTATION, NOT RERUN IN H003:** `docs/DATABASE.md` records zero visible/updated/deleted rows for a second user and 404 for direct access.
- **UNVERIFIED IN THIS CHAT:** no new two-user regression was executed after portrait changes.

### Storage

#### Bucket

- **VERIFIED/APPLIED:** `character-portraits`.
- **VERIFIED:** private (`public = false`).
- **VERIFIED:** maximum file size `5,242,880` bytes.
- **VERIFIED:** allowed MIME types are JPEG, PNG and WebP.

#### Storage path convention

**IMPLEMENTED:**

```text
USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME
```

The first folder segment is the authenticated user ID.

#### Storage policies

For `storage.objects`, authenticated users receive owner-folder policies for:

- **VERIFIED:** SELECT.
- **VERIFIED:** INSERT.
- **VERIFIED:** UPDATE.
- **VERIFIED:** DELETE.

Each policy requires:

```text
bucket_id = character-portraits
first folder segment = auth.uid()
```

#### Signed URLs

- **IMPLEMENTED:** one-hour TTL (`3600` seconds).
- **IMPLEMENTED:** generated server-side for character list/detail display and client-side after upload.

### Generated database types

- **VERIFIED:** `types/database.types.ts` exists.
- **KNOWN ISSUE:** browser/server/proxy clients import `Database` but do not currently pass the generic to the Supabase client factory. Full compile-time table/query typing is therefore not active.
- **RECOMMENDED:** correct this in a small isolated future change after inspecting current Next/Supabase API signatures.

### Dashboard-only settings

- **VERIFIED BEHAVIOR:** Auth, linked migrations and remote DB connection work.
- **UNVERIFIED:** exact Dashboard Auth settings, redirect allow-list, bucket UI configuration and project settings.
- **DO NOT INCLUDE:** project keys, tokens or environment values.

### Documentation mismatch

- **VERIFIED:** `docs/DATABASE.md` says there are no application buckets and portrait upload should not start.
- **DEPRECATED DOCUMENT STATEMENT:** that Storage section is obsolete after `20260702150000_character_portraits.sql`.

---

## 10. Confirmed Architectural Decisions

| Decision | Status | Reason | Related Files or ADR |
|---|---|---|---|
| Use system-specific versioned JSONB in `characters.sheet_data` | **DECIDED / IMPLEMENTED** | Different TTRPG systems need different contracts without duplicating common columns | `lib/characters/vtm-v5/schema.ts`; no ADR yet |
| Keep common character data in columns | **DECIDED / IMPLEMENTED** | Name/system/visibility/portrait are useful outside the VtM renderer | `characters` migration and types |
| Normalize persisted VtM JSON before rendering | **DECIDED / IMPLEMENTED** | Backward compatibility and corrupted/missing field safety | `normalizeVtmV5SheetData()` |
| Preserve unknown VtM fields in `extensions` | **DECIDED / IMPLEMENTED** | Reduce data loss during schema evolution | `schema.ts` |
| Use one typed `VtmV5SheetData` object, not one state per field | **DECIDED / IMPLEMENTED** | Avoid fragmented state and creator/editor divergence | creator/editor and schema |
| Use two logical pages: `core` and `background` | **DECIDED / IMPLEMENTED** | Matches the provided two-page template | `editor-draft.ts`, sheet navigation |
| Use an A4 portrait proportion on desktop | **DECIDED / IMPLEMENTED** | Match the supplied VtM form and support future print layout | `a4-sheet-page.tsx` |
| Do not force rigid A4 proportions on mobile | **DECIDED / PLANNED** | Prevent tiny controls and horizontal scrolling | next responsive stage |
| Reserve a red frame area around the sheet | **DECIDED / IMPLEMENTED** | Establish boundaries for a future decorative frame | `a4-sheet-page.tsx` |
| Current frame is a temporary simple red frame | **DECIDED / IMPLEMENTED TEMPORARY** | Future visual ornaments should not require data/layout redesign | `border-[3mm] border-[#b00000]` |
| Identity card is reusable in full sheet and character list | **DECIDED / IMPLEMENTED** | Visual/data consistency | identity card and summary card |
| Store portraits as files, not Base64/JSONB | **DECIDED / IMPLEMENTED** | Avoid oversized database rows and enable access policies | Storage migration, `portrait.ts` |
| Store a portrait path in `portrait_url` | **DECIDED / IMPLEMENTED** | Existing nullable column already existed | migration/types, creator/editor |
| Use private Storage and signed URLs | **DECIDED / IMPLEMENTED** | Current characters are owner-only | Storage migration and helpers |
| Upload portrait after character ID exists | **DECIDED / IMPLEMENTED** | Path includes character ID | creator |
| Do not delete old portrait until new upload and DB update succeed | **DECIDED / IMPLEMENTED** | Avoid losing current image on replacement failure | editor |
| Keep portrait file selection outside sessionStorage drafts | **IMPLEMENTED CURRENT LIMITATION** | Browser `File` cannot be JSON-serialized directly | creator/editor |
| Combine Touchstones and Convictions into one visible field | **DECIDED / IMPLEMENTED** | User explicitly requested one section | `background-principles-section.tsx` |
| Use `Опоры и Убеждения` in Russian | **DECIDED / IMPLEMENTED** | Chosen terminology for the combined heading | `messages/ru/vtm-v5.json` |
| Site locale and sheet language are separate concepts | **DECIDED / NOT IMPLEMENTED** | Users may want different UI/sheet languages | future ADR/migration |
| Explicit Save remains the persistence model | **DECIDED / IMPLEMENTED** | Predictable control and rollback behavior | creator/editor |
| Final decorative design follows stable functionality | **DECIDED** | Avoid repeated architectural rework | project workflow |
| Mobile adaptation precedes print/PDF and final decoration | **DECIDED / PLANNED** | Make current form usable before export/design polish | next stage |

---

## 11. Functional Requirements Preserved

### Functionality

- **IMPLEMENTED:** users can register, log in and manage their own characters.
- **IMPLEMENTED:** VtM characters have two editable pages.
- **IMPLEMENTED:** identity, Attributes, Skills/Specialties, Disciplines, Advantages/Flaws, trackers, damage, Blood Potency, Experience, biography and notes are persisted.
- **IMPLEMENTED:** portrait can be selected during creation or edit.
- **IMPLEMENTED:** portrait replacement/removal is explicit and saved with the character.
- **IMPLEMENTED:** “My Characters” cards show portrait and VtM identity fields.
- **PLANNED:** responsive/mobile adaptation.
- **PLANNED:** print/PDF.
- **PLANNED:** independent sheet language.

### UX

- **IMPLEMENTED:** separate view and edit modes.
- **IMPLEMENTED:** Save controls at top and bottom of the editor.
- **IMPLEMENTED:** blue Add controls and red Remove controls.
- **IMPLEMENTED:** draft/page state survives route-locale remount in the same browser tab.
- **IMPLEMENTED:** Page 2 remains selected after locale switching.
- **IMPLEMENTED:** dropdown option text remains readable on the dark theme.
- **IMPLEMENTED:** A4 sheet remains white on the dark-red site background.
- **PLANNED:** mobile-friendly stacking and touch targets.
- **PLANNED:** unsaved portrait warning or portrait persistence behavior improvement.

### Constraints

- Existing character data must not be lost.
- Applied migrations must not be edited.
- `schemaVersion: 1` and older flat fields must remain readable through normalization.
- The VtM form must allow empty Clan, Sire, Predator Type and Disciplines.
- Dynamic rows must not be cut off by a fixed page height.
- Desktop A4 is a visual minimum/aspect reference, not an overflow clipping boundary.
- Portraits must be JPG/PNG/WebP and no larger than 5 MB.
- Never show raw Supabase/backend errors to users.

### Localization

- Supported locales: English and Russian.
- Route locale remains explicit in the URL.
- Site UI uses route locale.
- VtM labels currently use route locale.
- Common and VtM dictionaries remain merged at request load.
- Independent sheet language remains planned.

### Security

- Character rows are owner-only through RLS.
- Portrait objects are owner-folder-only through Storage policies.
- Do not rely only on UI checks for ownership.
- Do not expose Storage paths as public object URLs.
- Use signed URLs for private portraits.
- Campaign/public visibility must not be advertised as cross-user sharing until policies/routes exist.

### Data handling

- Common fields remain separate from system JSONB.
- VtM data uses one versioned object.
- Unknown JSON keys are preserved under `extensions`.
- Portrait path is stored in `portrait_url`; bytes remain in Storage.
- Existing `description` values remain in DB even though the current VtM UI removed Short Description.
- Existing `sect` values remain in `sheet_data` though not shown in the main identity card.

### Mobile adaptation

The next implementation must:

- remove horizontal page scrolling;
- reduce the effective frame on narrow screens if needed;
- stack portrait and identity fields;
- stack three-column sections logically;
- keep dots and damage boxes tappable;
- change Disciplines from two columns to one;
- stack Page 2 upper/lower grids in reading order;
- keep Add/Remove/Edit/Save controls usable;
- keep character summary cards readable;
- preserve A4 desktop and print behavior.

### Preparation for future functions

- Keep data separate from presentation.
- Avoid schema changes for purely responsive work.
- Preserve print-ready A4 structure on desktop.
- Leave decorative frame implementation replaceable.
- Use the same validated data for future print/static renderer.
- Update documentation whenever infrastructure changes.

---

## 12. User Requirements and Working Preferences

1. The user works in **Windows CMD**.
2. Instructions must be sequential, practical and easy to verify.
3. Use small development stages and verify each stage before moving on.
4. For substantial edits, provide full file versions or a ZIP preserving repository paths.
5. All code comments and all text inside code blocks must be in English.
6. Inspect the current file/commit before replacing anything.
7. Never use old pasted versions when the repository contains a newer file.
8. Do not show raw backend errors to users.
9. Implement functional/data/security foundations before detailed graphic design.
10. Do not lose existing user data.
11. Do not invent database or deployment infrastructure.
12. Do not expose secrets, API keys, passwords, service-role keys, tokens or `.env` values.
13. Keep site UI bilingual in English and Russian.
14. Keep site locale and future sheet language conceptually independent.
15. Use A4 proportions as the desktop/print reference for VtM.
16. Preserve room for a future stylish narrow frame.
17. Character cards in “My Characters” should visually correspond to the top identity part of the sheet.
18. Prefer direct changes during `npm run dev` for cosmetic iteration, then build before commit.
19. Keep handoffs numbered sequentially and tied to exact commits.

---

## 13. Localization State

### Supported locales

- **IMPLEMENTED:** `en`
- **IMPLEMENTED:** `ru`

### Routing behavior

- **IMPLEMENTED:** `localePrefix: "always"`.
- **IMPLEMENTED:** default locale `en`.
- **IMPLEMENTED:** one-year locale cookie.
- **IMPLEMENTED:** locale-less stable alias redirects to the persisted/default locale.
- **IMPLEMENTED:** technical `/auth/confirm` remains outside locale-prefixed routes.

### Dictionary structure

Current:

```text
messages/en.json
messages/ru.json
messages/en/vtm-v5.json
messages/ru/vtm-v5.json
```

`i18n/request.ts` merges:

```text
common messages
+
VtM V5 messages
```

### Namespaces

- Common namespaces remain in the root locale JSON files.
- **IMPLEMENTED dedicated namespace:** `VtmCharacterSheet` in the per-system dictionaries.
- **UNVERIFIED:** no automated full namespace inventory was rerun in H003.

### Metadata

- **IMPLEMENTED from prior stage:** localized site and route metadata.
- **VERIFIED BUILD:** metadata routes compile.
- **UNVERIFIED IN H003:** no new browser metadata regression test.

### Sheet-language independence

- **DECIDED:** site locale and sheet language are independent concepts.
- **NOT IMPLEMENTED:** no `sheet_language` database column or sheet-language selector exists.
- Current VtM sheet labels follow the site route locale.

### Current VtM Russian terminology

- **IMPLEMENTED:** `Опоры и Убеждения` for the combined heading.
- **IMPLEMENTED:** `Мощь Крови`, `Всплеск Крови`, `Объем исцеления`, `Бонус Дисциплин`, `Переброс Пробуждения Крови`, `Штраф кормления`, `Сила Кланового Проклятия`.
- **KNOWN STALE KEYS:** standalone `touchstones` still says `«Якоря»`, and `principlesTitle` still contains older wording. These may be unused in the current combined layout but should be cleaned or documented later.

### Key verification

- **VERIFIED INDIRECTLY:** JSON syntax and referenced keys compile in `npm run build`.
- **UNVERIFIED:** no dedicated EN/RU deep parity script output was run in the final H003 check.
- **RECOMMENDED:** add a key-parity check when message structure stabilizes.

---

## 14. Verification Evidence

### Commands executed

- `git fetch origin --prune`
- `git remote get-url origin`
- `git branch --show-current`
- `git status`
- `git status --short`
- `git status -sb`
- `git branch -vv`
- `git rev-parse HEAD`
- `git rev-parse origin/main`
- `git ls-remote origin refs/heads/main`
- `git rev-parse --abbrev-ref --symbolic-full-name @{u}`
- `git rev-parse @{u}`
- `git log -1 --stat --oneline`
- `git diff --name-status`
- `git diff --cached --name-status`
- `git diff --check`
- `dir supabase\migrations`
- `npx supabase migration list`
- `dir /S /B *database*types*.ts`
- `npm run build`
- `npx vercel ls`
- `curl -I https://ttrpg-website-xi.vercel.app`

### Build

- **VERIFIED PASS:** Next.js production compilation.
- **VERIFIED PASS:** TypeScript.
- **VERIFIED PASS:** page-data collection.
- **VERIFIED PASS:** 26/26 static page generation stage.
- **VERIFIED PASS:** final optimization.

### Routes in final build

- `/_not-found`
- `/[locale]`
- `/[locale]/[...rest]`
- `/[locale]/account`
- `/[locale]/characters`
- `/[locale]/characters/[id]`
- `/[locale]/characters/new`
- `/[locale]/characters/new/[system]`
- `/[locale]/dashboard`
- `/[locale]/games`
- `/[locale]/games/vampire-the-masquerade`
- `/[locale]/login`
- `/[locale]/profile`
- `/[locale]/profile/edit`
- `/[locale]/register`
- `/auth/confirm`
- Proxy middleware

### Static checks

| Check | Result |
|---|---|
| `git diff --check` | **VERIFIED PASS:** no output |
| Tracked unstaged diff | **VERIFIED:** none |
| Cached diff | **VERIFIED:** none |
| Build/TypeScript | **VERIFIED PASS** |
| ESLint | **UNVERIFIED:** not run in final check |
| Unit tests | **N/A / none recorded** |
| E2E tests | **N/A / none recorded** |
| Translation deep parity | **UNVERIFIED** |
| Cross-user RLS regression after portrait migration | **UNVERIFIED** |

### Migration verification

- **VERIFIED:** local `20260630143000` = remote `20260630143000`.
- **VERIFIED:** local `20260702150000` = remote `20260702150000`.

### User-reported/manual scenarios

During the chat, the user reported that successive A4 layout and cosmetic stages worked.

**VERIFIED BY USER REPORT:**

- Page 1 and Page 2 A4 layouts rendered.
- Identity card cosmetic changes rendered.
- Page 2 cosmetic changes rendered.
- Red frame changes rendered.
- Double bottom border was removed successfully.
- Dark-red site background was applied.
- Storage migration applied successfully.

**UNVERIFIED AS A DETAILED FINAL MATRIX:**

- create a new character with a portrait;
- reopen and confirm signed portrait;
- replace portrait and verify old object removal;
- remove portrait and save;
- delete character and confirm object cleanup;
- Humanity/Stains save/reload;
- EN/RU switching with an unsaved portrait file;
- mobile behavior;
- print behavior.

### Deployment

- **VERIFIED:** Vercel CLI listed a Ready preview and Ready production deployments.
- **VERIFIED:** stable alias returned `307` to `/en`.
- **VERIFIED:** anonymous latest preview access redirected to Vercel authentication.
- **UNVERIFIED:** exact current HEAD on preview.
- **UNVERIFIED:** current HEAD in production.
- **UNVERIFIED:** final production route regression for current feature branch.

### Significant warnings

- Vercel CLI installation printed deprecation/security warnings for transitive packages `stream-to-promise` and `tar`.
- These warnings came from the transient `npx vercel` installation, not from the project build.
- Working tree remains dirty because of one untracked DOCX.

---

## 15. Git State

| Field | State |
|---|---|
| Branch | **VERIFIED:** `feature/vtm-v5-a4-layout` |
| HEAD | **VERIFIED:** `8d41a42005934fda9cf3c19c2a767c4bfa00fd2f` |
| Upstream | **VERIFIED:** `origin/feature/vtm-v5-a4-layout` |
| Upstream commit | **VERIFIED:** same as HEAD |
| `origin/main` | **VERIFIED:** `b961432613eeb81b4612a6ac1c4935e5a136e868` |
| Remote `main` | **VERIFIED:** same as `origin/main` |
| Ahead/behind upstream | **VERIFIED:** `0/0` |
| Ahead of `main` | **VERIFIED:** 2 commits |
| Working tree | **DIRTY** |
| Tracked changed files | **VERIFIED:** none |
| Staged files | **VERIFIED:** none |
| Untracked files | **VERIFIED:** `docs/command_prompt.docx` |
| Latest commit | **VERIFIED:** `8d41a42 Add VtM portraits stains and character cards` |
| Previous feature commit | **VERIFIED:** `0dd74d4 Redesign VtM sheet as framed A4 layout` |
| Push completed | **VERIFIED:** yes, feature branch upstream matches |
| PR/merge into `main` | **NOT DONE / UNVERIFIED:** current two commits are not in `origin/main` |
| Preview deployment | **VERIFIED READY, exact commit UNVERIFIED** |
| Production deployment of current HEAD | **UNVERIFIED / likely not, because main is behind** |

### Required cleanup before the next feature

Resolve:

```text
docs/command_prompt.docx
```

Do not run `git add -A` until deciding whether this file belongs in the repository.

---

## 16. Known Problems and Risks

| Severity | Problem | Impact | Mitigation | Status |
|---|---|---|---|---|
| High | Current feature branch is not merged into `main` | Production may not contain A4, portraits, Stains or new cards | Verify preview, create PR, merge only after acceptance, verify production | **OPEN** |
| High | Preview is protected by Vercel authentication | Friends cannot use the preview anonymously | Use a Vercel share link or merge verified code to production | **OPEN** |
| High | Final portrait lifecycle scenarios were not recorded | Upload/replace/remove/delete edge cases may exist | Run explicit test matrix before merge | **OPEN** |
| Medium | `docs/command_prompt.docx` is untracked | Future `git add -A` may commit it accidentally or it may be lost | Decide commit/move/ignore before new work | **OPEN** |
| Medium | `docs/DATABASE.md` says there are no buckets | Next developer may wrongly recreate or avoid existing Storage | Update Storage section and migration history | **OPEN** |
| Medium | Generated `Database` type is imported but not supplied as a generic | Supabase queries are not fully type checked | Use `createBrowserClient<Database>` / `createServerClient<Database>` after API verification | **OPEN** |
| Medium | Portrait file is not in sessionStorage draft | Refresh/locale switch after choosing a file loses the pending selection | Save immediately, warn user, or add an explicit pending-file UX | **OPEN** |
| Medium | Portrait cleanup is best-effort | Failed delete/replacement cleanup can leave orphan objects | Add server-side cleanup strategy or orphan maintenance | **OPEN** |
| Medium | Combined Touchstones/Convictions edit clears `convictions` | Semantic distinction is permanently flattened after edit | Confirm intended data model; add structured combined entries if distinction is needed | **OPEN / INTENTIONAL CURRENT BEHAVIOR** |
| Medium | Mobile layout has not received final pass | Three-column/A4 sections may be cramped or scroll horizontally | Perform dedicated responsive stage | **PLANNED NEXT** |
| Medium | Production commit is unverified | Stakeholders may test an older version | Inspect deployment commit/alias after merge | **OPEN** |
| Medium | No automated tests | UI/storage regressions depend on manual checks | Add targeted tests after responsive architecture stabilizes | **OPEN** |
| Low | Stale translation keys retain older terminology | Future reused labels may show inconsistent Russian terms | Clean unused keys or align them | **OPEN** |
| Low | `updated_at` is not automatically maintained by a DB trigger | Non-application updates may leave stale timestamps | Add future migration if required | **PLANNED / not blocking** |
| Low | No explicit index on `characters.owner_id` in migration | List performance may degrade with scale | Add index in a future migration after measuring | **PLANNED / not blocking** |
| Low | README remains generic create-next-app text | New contributors lack onboarding | Replace with project README and docs links | **OPEN** |

---

## 17. Superseded Approaches

- **DEPRECATED:** exposing `error.message` or raw backend error text to users.
- **DEPRECATED:** storing portrait bytes/Base64 in `sheet_data` or a text field.
- **DEPRECATED:** assuming a planned DB column, policy or bucket exists without migration evidence.
- **DEPRECATED:** using old non-localized application routes.
- **DEPRECATED:** one separate `useState` for every field of the full VtM sheet.
- **DEPRECATED:** duplicating common character fields inside `sheet_data`.
- **DEPRECATED:** copying all Supabase proxy headers over `next-intl` middleware headers.
- **DEPRECATED:** forcing locale-less root URLs permanently to English.
- **DEPRECATED:** the old minimal VtM `schemaVersion: 1` UI as the current contract.
- **DEPRECATED:** the old multiple-card layout for the VtM sheet.
- **DEPRECATED:** the old double neutral frame.
- **DEPRECATED:** a bottom neutral border on the full Page 2 content wrapper, which created a double bottom line.
- **DEPRECATED:** the statement in `docs/DATABASE.md` that no Storage bucket exists.
- **DEPRECATED:** treating the current preview URL as public when deployment protection is enabled.
- **DEPRECATED:** assuming that a pushed feature branch is already production.

---

## 18. Open Questions

| Question | Blocking | Current Options | Recommended Decision Point |
|---|---|---|---|
| Should `docs/command_prompt.docx` be committed? | Yes, before clean checkpoint | Commit; move outside repo; add ignore rule | First action in next chat |
| Should current feature branch be merged before mobile work? | No technically, yes for a clean release checkpoint | Merge now; continue branch; create new branch after merge | After final portrait/preview acceptance |
| Does the latest preview definitely map to `8d41a42`? | Yes for release confidence | Inspect Vercel deployment details / GitHub check | Before PR merge |
| Should friends access preview through a share link or production? | No for coding | Vercel share link; merge to production | Before external alpha |
| Should Touchstones and Convictions remain semantically separate? | No for mobile | Current flattened combined field; structured paired entries; separate arrays with one UI | Before future data-model revision |
| Should sheet language be immutable after creation? | Yes for that feature | Immutable; controlled conversion; freely changeable | Before adding `sheet_language` migration/UI |
| Should portrait crop/position be stored? | No for mobile | CSS cover only; focal point; crop rectangle | Before portrait UX stage |
| How should orphan portraits be cleaned? | No for mobile, yes for robust lifecycle | Server action; Edge Function; scheduled cleanup; DB/storage workflow | Before public release |
| Should current Storage paths remain in column named `portrait_url`? | No | Keep for compatibility; rename via migration; add separate `portrait_path` | Before broader media architecture |
| Should Supabase clients be fully generic-typed now? | No for mobile, recommended | Add `<Database>` generics in small commit | Before larger DB query work |
| What is the canonical production commit/URL mapping? | Yes for release | Inspect Vercel project/deployment metadata | At merge/deploy checkpoint |
| When should print/PDF be added? | No | After mobile; after final decoration | Recommended after mobile pass |
| Should final frame use CSS, SVG or image assets? | No | CSS borders; SVG corners/frame; background image | Decide during final visual-design stage |

---

## 19. Exact Next Task

### Task

**Implement a dedicated responsive/mobile pass for the VtM A4 sheet and “My Characters” summary cards without changing the VtM JSONB schema or database.**

### Goal

Make the current desktop A4-oriented form usable on narrow screens while preserving:

- desktop A4 proportions;
- current data contracts;
- view/edit behavior;
- portrait controls;
- Humanity/Stains interactions;
- EN/RU behavior;
- future print layout.

### Required inputs

1. Current repository at exact commit `8d41a42005934fda9cf3c19c2a767c4bfa00fd2f`.
2. Decision on `docs/command_prompt.docx`.
3. Screenshots or manual testing at representative widths:
   - approximately 390 px;
   - approximately 768 px;
   - desktop current width.
4. Current Vercel preview access or local `npm run dev`.

### Files to inspect first

```text
AGENTS.md
components/characters/sheets/vtm-v5/a4-sheet-page.tsx
components/characters/sheets/vtm-v5/character-identity-card.tsx
components/characters/sheets/vtm-v5/core-sheet-page.tsx
components/characters/sheets/vtm-v5/background-sheet-page.tsx
components/characters/sheets/vtm-v5/attributes-section.tsx
components/characters/sheets/vtm-v5/skills-section.tsx
components/characters/sheets/vtm-v5/health-willpower-section.tsx
components/characters/sheets/vtm-v5/trackers-section.tsx
components/characters/sheets/vtm-v5/disciplines-section.tsx
components/characters/character-summary-card.tsx
components/characters/character-editor.tsx
components/characters/character-creator.tsx
```

### Dependencies

- Resolve the untracked DOCX.
- Verify build passes before changes.
- Read relevant Next.js 16 local docs per `AGENTS.md`.
- Do not edit applied SQL migrations.
- Do not change `VTM_V5_SCHEMA_VERSION`.
- Do not replace portrait Storage architecture.
- Do not begin final decorative design in this stage.

### Completion criteria

1. No horizontal page scroll at approximately 390 px viewport.
2. Identity card stacks portrait and fields logically.
3. Attributes and Skills remain readable in English and Russian.
4. Health/Willpower and tracker controls remain tappable.
5. Disciplines and Advantages use one column where necessary.
6. Page 2 reading order remains logical.
7. Add/Remove/Edit/Save buttons do not overlap fields.
8. Character summary cards fit narrow screens.
9. Desktop layout remains A4-oriented and visually unchanged except intentional responsive classes.
10. Portrait select/replace/remove still works.
11. Humanity/Stains still saves and displays.
12. EN/RU switch does not lose text draft state.
13. `npm run build` passes.
14. `git diff --check` passes.
15. Manual screenshots/tests are recorded for 390 px, tablet and desktop.

### Out of scope

- Database/schema changes.
- New Storage policies.
- Portrait cropping.
- Independent sheet language.
- Campaign/public sharing.
- Print/PDF implementation.
- Final decorative frame/artwork/fonts.
- Automated end-to-end test suite.

---

## 20. Resume Procedure

1. Read H003 completely.
2. Open Windows CMD in the repository.
3. Run Git status/branch/HEAD/upstream checks.
4. Confirm exact HEAD is `8d41a42005934fda9cf3c19c2a767c4bfa00fd2f` or inspect intentional later commits.
5. Resolve `docs/command_prompt.docx`.
6. Read `AGENTS.md`.
7. Run `npm run build`.
8. Run `npx supabase migration list` only to confirm no drift; do not push anything for mobile work.
9. Inspect the responsive classes in the files listed in Section 19.
10. Start `npm run dev`.
11. Reproduce current layout at desktop, tablet and ~390 px before editing.
12. Prepare a minimal file-by-file responsive plan.
13. Change one layout group at a time.
14. Test EN/RU and view/edit after each group.
15. Run build and `git diff --check`.
16. Record screenshots/acceptance results.
17. Commit to an intentional branch only after acceptance.
18. If releasing, create PR, verify preview commit, merge, verify production alias and update documentation.

---

## 21. Useful Commands

Run from Windows CMD:

```bat
cd /d D:\TT_games\00_TTRPG_web\Projects\ttrpg-website
```

Verify Git:

```bat
git fetch origin --prune
git branch --show-current
git status
git status -sb
git rev-parse HEAD
git rev-parse @{u}
git rev-parse origin/main
git log -1 --stat --oneline
git diff --check
```

Inspect untracked file:

```bat
dir docs\command_prompt.docx
```

Build and develop:

```bat
npm run build
npm run dev
```

Verify migrations without changing them:

```bat
npx supabase migration list
```

Inspect relevant responsive classes:

```bat
findstr /S /N /I "grid-cols md:grid sm:grid overflow-x aspect-[210/297]" components\characters\sheets\vtm-v5\*.tsx components\characters\character-summary-card.tsx
```

Before commit:

```bat
git status --short
git diff --stat
git diff --check
npm run build
```

Do not run:

```text
git add -A
```

until the untracked DOCX decision is made.

---

## 22. References

| Reference | State |
|---|---|
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Current commit | `8d41a42005934fda9cf3c19c2a767c4bfa00fd2f` |
| Current feature branch | `feature/vtm-v5-a4-layout` |
| `origin/main` | `b961432613eeb81b4612a6ac1c4935e5a136e868` |
| Stable production alias | `https://ttrpg-website-xi.vercel.app` |
| Latest listed preview | `https://ttrpg-website-3p3lmqz5i-andrey-yudin.vercel.app` |
| Previous handoff | `H002_CURRENT_HANDOFF.md` |
| Historical handoff | `H001_CURRENT_HANDOFF.md` |
| Current handoff | `H003_CURRENT_HANDOFF.md` |
| PROJECT_CONTEXT.md | **N/A / not present in current commit** |
| Architecture document | **N/A / not present** |
| Database documentation | `docs/DATABASE.md` — **present but Storage section outdated** |
| I18N documentation | **N/A / not present** |
| Character-sheet specification | Template assets under `docs/VtM-V5_character-sheet-template/`; no dedicated Markdown specification |
| Roadmap | **N/A / not present** |
| Initial schema migration | `supabase/migrations/20260630143000_initial_schema.sql` |
| Portrait Storage migration | `supabase/migrations/20260702150000_character_portraits.sql` |
| Generated DB types | `types/database.types.ts` |
| ADRs | **N/A / no ADR directory/files present** |
| Repository coding instruction | `AGENTS.md` |
| Current untracked document | `docs/command_prompt.docx` |

---

## 23. Suggested Updates to Permanent Documents

| Document | Recommendation |
|---|---|
| `PROJECT_CONTEXT.md` | **CREATE.** Record current branch/commit, complete VtM sheet, A4 layout, schema version 3, private portraits, migration state, next responsive stage and source-of-truth rules. |
| `docs/ARCHITECTURE.md` | **CREATE.** Document localized App Router structure, sheet composition, JSONB normalization, draft persistence, portrait lifecycle, server/client boundaries and Vercel branch flow. |
| `docs/DATABASE.md` | **UPDATE REQUIRED.** Add migration `20260702150000`, bucket `character-portraits`, limits, MIME types, folder convention, policies, signed URL behavior and cleanup limitations. Remove statement that no bucket exists. |
| `docs/I18N.md` | **CREATE.** Document common/per-system dictionary merge, current namespaces, EN/RU routing, locale cookie and unresolved sheet-language independence. |
| `docs/CHARACTER_SHEETS.md` | **CREATE.** Document `schemaVersion: 3`, full field contract, A4 page order, identity card, combined Touchstones/Convictions behavior, trackers, portrait UI and responsive/print targets. |
| `docs/ROADMAP.md` | **CREATE.** Mark complete VtM/A4/portrait work; set mobile pass next; print/PDF, crop, independent sheet language and final design later. |
| ADR: system-specific JSONB | **CREATE.** Record versioned JSONB and normalizer responsibility. |
| ADR: portrait Storage | **CREATE.** Record private bucket, path-only column, signed URLs, 5 MB limits and cleanup strategy. |
| ADR: independent sheet language | **CREATE BEFORE IMPLEMENTATION.** |
| ADR: A4 + responsive rendering | **CREATE RECOMMENDED.** Record desktop/print A4 and content-driven mobile behavior. |
| README | **UPDATE LATER.** Replace boilerplate with project summary, setup and docs links. |

---

## 24. Suggested Opening Message for the Next Chat

```text
Продолжаем проект Web_Site_TTRPG / ttrpg-website.

Repository:
https://github.com/Andrey-0101/ttrpg-website

Current handoff:
H003_CURRENT_HANDOFF.md

Verified current branch:
feature/vtm-v5-a4-layout

Verified commit:
8d41a42005934fda9cf3c19c2a767c4bfa00fd2f

Current state:
Complete bilingual VtM V5 sheet, framed A4 desktop layout, Humanity/Stains, private Supabase portraits, and redesigned My Characters cards are implemented on the feature branch. The branch is two commits ahead of main. The working tree has one untracked file: docs/command_prompt.docx.

Exact first task:
Resolve the untracked DOCX, verify the repository/build/current files, then implement a responsive/mobile pass for the VtM sheet and character summary cards without changing the database schema or VtM schemaVersion.

Before proposing code, read H003, verify Git state, read AGENTS.md, inspect the actual files at the current commit, and do not use older chat/ZIP code as the source of truth.
```

---

## 25. Handoff Quality Check

| Check | Result |
|---|---|
| Commit matches described current code | **PASS:** current description is tied to exact HEAD `8d41a42005934fda9cf3c19c2a767c4bfa00fd2f`. |
| `main` vs feature branch separated | **PASS:** current branch is explicitly two commits ahead and not claimed as production. |
| Working tree accurately described | **PASS:** only `docs/command_prompt.docx` is untracked; no tracked diff. |
| Planned work mislabeled as implemented | **PASS:** mobile, print/PDF, sheet language, crop and sharing remain planned. |
| Database facts grounded in migrations/types | **PASS.** |
| Remote migrations verified | **PASS:** both versions match local/remote. |
| Storage bucket/policies not invented | **PASS:** sourced from applied migration. |
| Generated-type limitation captured | **PASS:** type imports exist but generics are not connected. |
| Current vs target state separated | **PASS.** |
| User requirements separated from recommendations | **PASS.** |
| Deprecated approaches identified | **PASS.** |
| Documentation drift captured | **PASS.** |
| Deployment assumptions marked | **PASS:** preview/production commit association remains unverified. |
| One exact next task provided | **PASS:** responsive/mobile pass. |
| Completion criteria defined | **PASS.** |
| Sufficient to continue without full chat | **PASS.** |
| Full source files unnecessarily copied | **PASS:** only paths/contracts are included. |
| Secrets or `.env` values included | **PASS:** none. |
| Personal tokens included | **PASS:** none. |

---

**End of H003_CURRENT_HANDOFF.md**
