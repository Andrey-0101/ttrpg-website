# H002_CURRENT_HANDOFF.md

## 1. Document Control

| Field | Value |
|---|---|
| Project name | **Web_Site_TTRPG / ttrpg-website** |
| Handoff ID | **H002** |
| Previous handoff | **H001_CURRENT_HANDOFF.md** |
| Supersedes | **H001 as the current-state handoff. H001 remains a historical record of the previous project state.** |
| Handoff status | **CURRENT** |
| Handoff version | **1.0** |
| Creation date | **2026-06-30** |
| Sequence position | **Second project chat handoff** |
| Scope of this chat | **Completion of EN/RU application localization; localized Profile, Characters, Games, Dashboard, Account, Login and Register flows; locale persistence; localized metadata and 404 behavior; locale-aware email confirmation; safe authentication error mapping; final localization audit; review of the public repository; and planning of the complete Vampire: The Masquerade V5 character-sheet architecture, portrait handling, documentation, and future handoff process.** |
| Repository URL | **VERIFIED:** `https://github.com/Andrey-0101/ttrpg-website` |
| Git remote URL | **VERIFIED:** `https://github.com/Andrey-0101/ttrpg-website.git` |
| Active branch | **VERIFIED:** `main` |
| HEAD commit | **VERIFIED:** `aa939c197bded84bf616a3b2246f54042e5c5253` |
| `origin/main` commit | **VERIFIED:** `aa939c197bded84bf616a3b2246f54042e5c5253` |
| Remote `refs/heads/main` | **VERIFIED:** `aa939c197bded84bf616a3b2246f54042e5c5253` |
| Latest commit | **VERIFIED:** `aa939c1 Fix localized character loading error` |
| Working tree | **VERIFIED CLEAN:** no modified or untracked files |
| Ahead/behind | **VERIFIED:** local `main` is up to date with `origin/main` |
| Push completed | **VERIFIED:** yes |
| Build status | **VERIFIED:** production build passed, including TypeScript |
| Vercel deployment created | **VERIFIED:** yes |
| Production deployment manually verified | **VERIFIED:** yes, according to the user |
| Verified deployment URL supplied at close | **VERIFIED:** `https://ttrpg-website-lyi97n1fe-andrey-yudin.vercel.app` |
| Stable project alias known from H001/GitHub | **UNVERIFIED AT H002 CLOSE:** `https://ttrpg-website-xi.vercel.app` was not rechecked in the final H002 verification message |
| Secrets included | **VERIFIED:** none |

### Sequence metadata

- `H001` describes the earlier localization foundation at commit `e00fa6f`, with code-bearing parent `e96ee5d`.
- `H002` describes the current verified project state at commit `aa939c197bded84bf616a3b2246f54042e5c5253`.
- When H001 and H002 conflict about current project state, H002 has priority only where it matches the verified H002 commit and evidence.
- Chronological sequence alone does not override repository code, SQL migrations, generated database types, or verified infrastructure.

---

## 2. Instructions for the Next Chat

1. Read this document before proposing changes.
2. Verify that the repository is still at, or intentionally ahead of, commit `aa939c197bded84bf616a3b2246f54042e5c5253`.
3. Inspect current repository files before replacing them.
4. Treat repository code at the verified commit as more authoritative than code pasted in older chats.
5. Read `AGENTS.md` before writing Next.js code. The repository explicitly warns that Next.js 16 conventions may differ from prior training knowledge and that the relevant local framework documentation should be consulted.
6. Do not invent database columns, constraints, RLS policies, Storage buckets, Storage policies, migrations, generated types, environment values, or completed tests.
7. Verify every statement marked `ASSUMED` or `UNVERIFIED`.
8. Do not restore approaches marked `DEPRECATED`.
9. Do not begin the full character-sheet UI by adding many independent `useState` hooks to the existing creator and editor.
10. Do not begin portrait upload implementation until the current database schema, RLS, Storage state, and ownership rules are verified and represented in repository-backed migrations.
11. Preserve existing character data. Current VtM records use `schemaVersion: 1`.
12. Do not expose raw backend errors to users.
13. Keep all code comments and all text inside code blocks in English.
14. Work sequentially and verify each significant change with a build and relevant manual tests.

---

## 3. Source-of-Truth Priority

Use this priority when resolving contradictions:

1. **Repository code at the specified verified commit.**
2. **SQL migrations committed to the repository.**
3. **Generated database types committed to the repository.**
4. **Factually verified Supabase and Vercel configuration and behavior.**
5. **The current non-superseded handoff document.**
6. **`PROJECT_CONTEXT.md`.**
7. **Current functional specifications and accepted ADRs.**
8. **The current chat.**
9. **Older chats and archived handoffs.**

Additional conflict rules:

- A newer handoff number indicates chronology, not truth by itself.
- A statement marked `VERIFIED` or `IMPLEMENTED` has priority over a conflicting `PLANNED`, `ASSUMED`, or `UNVERIFIED` statement when both refer to the same repository state.
- If a handoff claims a database object exists but migrations and generated types do not contain it, treat the object as unverified until the actual database is inspected.
- Archived handoffs are historical records, not current-state documentation.
- An explicit `DEPRECATED` or `Supersedes` statement cancels the earlier approach only when it does not conflict with the actual verified implementation.

---

## 4. Current Project Snapshot

### 4.1 Technology stack

| Technology | Verified state |
|---|---|
| Next.js | **VERIFIED:** `16.2.9`, App Router, Turbopack build |
| React | **VERIFIED:** `19.2.4` |
| React DOM | **VERIFIED:** `19.2.4` |
| TypeScript | **VERIFIED:** version range `^5` |
| Tailwind CSS | **VERIFIED:** version range `^4` |
| `next-intl` | **VERIFIED:** `^4.13.0` |
| `@supabase/ssr` | **VERIFIED:** `^0.12.0` |
| `@supabase/supabase-js` | **VERIFIED:** `^2.108.2` |
| Hosting | **VERIFIED:** Vercel |
| Source control | **VERIFIED:** GitHub |
| Local environment | **VERIFIED:** Windows CMD |
| Environment file | **VERIFIED EXISTENCE ONLY:** build detected `.env.local`; values are not included and must not be requested or exposed |

### 4.2 Implemented modules

- **IMPLEMENTED:** EN/RU locale-prefixed routing.
- **IMPLEMENTED:** one-year locale cookie persistence.
- **IMPLEMENTED:** locale-aware global header and language switcher.
- **IMPLEMENTED:** localized Home, Games, VtM game page, Dashboard, Account, Profile, Profile Edit, Login, Register, Characters list, character creation routes, and character details route.
- **IMPLEMENTED:** localized site metadata and page-specific metadata.
- **IMPLEMENTED:** localized 404 page plus locale catch-all route.
- **IMPLEMENTED:** locale-aware email confirmation callback.
- **IMPLEMENTED:** safe localized authentication error mapping.
- **IMPLEMENTED:** signed-in/signed-out account area.
- **IMPLEMENTED:** localized sign-out button; legacy `/auth/signout` route removed.
- **IMPLEMENTED:** initial character management with create, view/edit, clear, save, delete, short description, visibility, and an initial VtM sheet.
- **IMPLEMENTED:** current VtM sheet contains only Clan and Hunger.
- **IMPLEMENTED:** Call of Cthulhu 7e exists in the system registry but is unavailable.

### 4.3 Active stage

**DECIDED NEXT MAJOR STAGE:** implement a complete, typed, bilingual Vampire: The Masquerade V5 character sheet with portrait support, migration from current `schemaVersion: 1`, independent sheet language, runtime validation, reusable form architecture, and preparation for print/PDF.

**BLOCKING FOUNDATION:** verify and version the Supabase database schema, RLS policies, Storage state, migrations, and generated types before implementing the expanded sheet and portrait upload.

### 4.4 Localization state

**VERIFIED COMPLETE FOR CURRENT ROUTES:** all routes shown by the final production build exist under `[locale]`, except the technical `/auth/confirm` route.

### 4.5 Authentication state

- **IMPLEMENTED:** Login and Register client flows.
- **IMPLEMENTED:** locale-preserving confirmation URL.
- **IMPLEMENTED:** safe authentication error mapping.
- **IMPLEMENTED:** authenticated Login/Register pages show appropriate signed-in state.
- **IMPLEMENTED:** sign-out through a reusable client component.
- **VERIFIED BUILD:** all authentication-related code passes production build.
- **UNVERIFIED IN FINAL H002 EVIDENCE:** a complete new-account email-delivery and cross-browser confirmation test matrix was not recorded.

### 4.6 Character management state

- **IMPLEMENTED:** list characters.
- **IMPLEMENTED:** create character.
- **IMPLEMENTED:** open character.
- **IMPLEMENTED:** view/edit mode.
- **IMPLEMENTED:** save changes.
- **IMPLEMENTED:** clear form without automatic save.
- **IMPLEMENTED:** delete from the character card.
- **IMPLEMENTED:** short description limits.
- **IMPLEMENTED:** visibility values.
- **IMPLEMENTED:** basic VtM `schemaVersion: 1` data.
- **NOT IMPLEMENTED:** full VtM sheet.
- **NOT IMPLEMENTED:** independent sheet language.
- **NOT IMPLEMENTED:** character portrait upload.
- **NOT IMPLEMENTED:** print/PDF output.

### 4.7 Database and infrastructure state

- **VERIFIED APPLICATION USAGE:** application code uses `profiles` and `characters`.
- **UNVERIFIED DATABASE DEFINITION:** no schema export was reviewed.
- **VERIFIED REPOSITORY ABSENCE:** no `supabase/migrations` directory is present at the verified commit.
- **VERIFIED REPOSITORY ABSENCE:** no generated `Database` TypeScript type is present at the verified commit.
- **UNVERIFIED:** current RLS policies.
- **UNVERIFIED:** current constraints and indexes.
- **UNVERIFIED:** Storage buckets and Storage policies.
- **UNVERIFIED:** whether any database setup exists only in the Supabase Dashboard.

### 4.8 Production state

- **VERIFIED:** build passed.
- **VERIFIED:** push completed.
- **VERIFIED:** Vercel deployment was created.
- **VERIFIED:** the user manually verified the deployment.
- **UNVERIFIED:** the exact final route-by-route production regression matrix was not recorded.

---

## 5. Scope of the Completed Chat

### 5.1 Original goal

Continue the bilingual routing and localization work from H001 and complete the remaining application routes and language behavior.

### 5.2 Additional tasks introduced

- Move Profile and Characters under localized routes.
- Localize character forms, Games, Dashboard, account area, authentication pages, and remaining UI.
- Redesign the account/authentication header behavior.
- Remove the legacy sign-out route.
- Persist the selected locale.
- Localize the Home page.
- set document language from the active locale.
- Preserve locale through email confirmation.
- Add localized 404 behavior.
- Add localized site and route metadata.
- Remove raw Supabase errors from user-visible authentication and character-list UI.
- Audit hard-coded visible text and corrupted characters.
- Inspect the public GitHub repository at a specific commit.
- Plan the complete VtM V5 character-sheet architecture.
- Add portrait-upload and full-biography requirements to the plan.
- Define a documentation and handoff strategy for future chats.

### 5.3 Final outcome

- **VERIFIED:** localization work is committed, pushed, built, deployed, and manually verified.
- **VERIFIED:** repository HEAD, local branch, `origin/main`, and remote `main` all match.
- **VERIFIED:** working tree is clean.
- **VERIFIED:** raw `error.message` display no longer exists under `app` or `components`.
- **DECIDED:** the next major feature is the complete VtM V5 character sheet.
- **DECIDED:** implementation must begin with database, RLS, Storage, migration, and type foundations rather than immediately expanding JSX.
- **PLANNED:** permanent project documentation and ADRs should be created and maintained alongside code.

---

## 6. Work Completed

| Status | Change | Files or areas | Commit | Verification |
|---|---|---|---|---|
| **IMPLEMENTED** | Localized Profile and Login pages | `app/[locale]/profile`, `app/[locale]/login`, messages | `a5cecff` | Later builds passed; final route list includes Profile/Login |
| **IMPLEMENTED** | Localized character routes | `app/[locale]/characters/**` | `0886913` | Final build includes all character routes |
| **IMPLEMENTED** | Localized character forms | `components/characters/**`, messages | `45e5395` | Final build passed |
| **IMPLEMENTED** | Localized Dashboard and Games pages | Dashboard and Games routes, messages | `2cf736c` | Final build passed |
| **IMPLEMENTED** | Added localized sign-out flow | account/sign-out components and related UI | `adfd00b` | Later superseded in part by account-area cleanup; final build passed |
| **IMPLEMENTED** | Added account area and Account Settings page | `components/account/**`, `app/[locale]/account` | `29dcb47` | Final route list includes Account |
| **IMPLEMENTED** | Improved authenticated registration flow | Register page and messages | `6cf6c10` | Final build passed |
| **IMPLEMENTED** | Removed legacy sign-out route and finalized account area | `app/auth/signout` removed; account components updated | `a4502bf` | Final build has only `/auth/confirm` as technical auth route |
| **IMPLEMENTED** | Triggered Vercel preview deployment | No code files | `808a93f` | Deployment workflow used |
| **IMPLEMENTED** | Persisted locale and localized Home | `i18n/routing.ts`, Home route/messages, old root redirect removed | `c8a69a5` | Locale cookie configured for one year; final build passed |
| **IMPLEMENTED** | Set document language from active locale and synchronize it on client locale change | `app/layout.tsx`, `components/language-switcher.tsx` | `6da5d54` | Build passed; user reported working |
| **IMPLEMENTED** | Preserved locale during email confirmation | `app/auth/confirm/route.ts`, Register page | `cae25a1` | Build passed; user reported working |
| **IMPLEMENTED** | Added localized 404 page and catch-all route | `app/[locale]/not-found.tsx`, `app/[locale]/[...rest]/page.tsx`, messages | `f55147c` | User reported EN/RU 404 behavior works |
| **IMPLEMENTED** | Added localized site metadata | `app/[locale]/layout.tsx`, messages | `07b0dcd` | Build passed; user reported working |
| **IMPLEMENTED** | Added page-specific metadata | Home, Games, VtM, Dashboard, Characters, Profile, Account | `a04e708` | User reported working |
| **IMPLEMENTED** | Added metadata layouts for client authentication/profile-edit pages | Login/Register/Profile Edit layouts | `425bd8c` | Initial type mismatch fixed; final build passed |
| **IMPLEMENTED** | Completed metadata for character routes | Character creation and details pages, messages | `f068194` | User reported working |
| **IMPLEMENTED** | Completed interface localization and safe auth error mapping | Login/Register, auth error mapper, character-list error handling, messages | `41d4b74` | Build passed; raw `error.message` grep later returned no results |
| **IMPLEMENTED** | Corrected localized character loading error messages | `messages/en.json`, `messages/ru.json` | `aa939c197bded84bf616a3b2246f54042e5c5253` | Final build passed; Git clean and synchronized |
| **VERIFIED** | Audited obvious hard-coded visible text | `app`, `components` | Current HEAD | `git grep` returned no relevant matches |
| **VERIFIED** | Audited visible English attributes | `app`, `components` | Current HEAD | `git grep` returned no matches |
| **VERIFIED** | Audited raw `error.message` usage | `app`, `components` | Current HEAD | `git grep` returned no matches |
| **VERIFIED** | Audited corrupted arrow/replacement characters | `app`, `components`, `messages` | Current HEAD | `git grep` returned no matches |
| **DECIDED** | Planned complete VtM V5 sheet architecture | No implementation files yet | N/A | Requirements captured in this handoff |
| **DECIDED** | Added portrait upload requirement | No implementation files yet | N/A | User explicitly required an image-upload area |
| **DECIDED** | Full biography must be the final lower section of the sheet | No implementation files yet | N/A | User explicitly required placement at the bottom |
| **PLANNED** | Split translation messages by domain and game system | No implementation files yet | N/A | Recommended architecture; current messages remain monolithic |
| **PLANNED** | Create persistent project documentation and ADRs | No implementation files yet | N/A | Documentation structure agreed in this chat |

---

## 7. Relevant File Map

| Path | Purpose | Current state | Notes |
|---|---|---|---|
| `AGENTS.md` | Repository-specific AI/developer instruction | **VERIFIED** | Requires checking relevant Next.js 16 local docs before coding |
| `CLAUDE.md` | Points to `AGENTS.md` | **VERIFIED** | Contains no additional project architecture |
| `README.md` | Default create-next-app README | **VERIFIED / OUTDATED FOR PROJECT** | Does not describe current architecture |
| `package.json` | Dependencies and scripts | **VERIFIED** | No runtime validation library such as Zod is installed |
| `proxy.ts` | Composes Supabase session refresh and `next-intl` | **IMPLEMENTED / VERIFIED** | Excludes `auth`; copies only Supabase cookies |
| `i18n/routing.ts` | Locale definitions and persistence | **IMPLEMENTED / VERIFIED** | `en`, `ru`, always prefixed, one-year locale cookie |
| `i18n/navigation.ts` | Locale-aware navigation helpers | **IMPLEMENTED** | Use for application links and redirects |
| `i18n/request.ts` | Server locale/message loading | **IMPLEMENTED** | Current message files are loaded here |
| `app/layout.tsx` | Root HTML document | **IMPLEMENTED** | Uses `getLocale()` for document language |
| `app/[locale]/layout.tsx` | Localized provider, header, site metadata | **IMPLEMENTED** | Validates locale and sets request locale |
| `components/language-switcher.tsx` | Locale switching | **IMPLEMENTED** | Synchronizes `document.documentElement.lang` |
| `messages/en.json` | Current English messages | **IMPLEMENTED / MONOLITHIC** | All namespaces remain in one file |
| `messages/ru.json` | Current Russian messages | **IMPLEMENTED / MONOLITHIC** | Mirrors current English namespaces |
| `app/auth/confirm/route.ts` | Supabase code exchange and locale-aware redirect | **IMPLEMENTED** | Accepts validated `locale` query parameter |
| `lib/auth/get-auth-error-key.ts` | Maps Supabase auth errors to safe translation keys | **IMPLEMENTED** | Includes fallback and account-enumeration handling |
| `app/[locale]/login/page.tsx` | Login client page | **IMPLEMENTED** | Uses safe localized errors and resilient loading/session handling |
| `app/[locale]/register/page.tsx` | Register client page | **IMPLEMENTED** | Preserves locale in confirmation callback; generic success for existing accounts |
| `components/account/account-area.tsx` | Signed-in/signed-out account area | **IMPLEMENTED** | Reads profile display name/username when authenticated |
| `components/account/sign-out-button.tsx` | Reusable client sign-out | **IMPLEMENTED** | Replaces legacy sign-out route |
| `app/[locale]/profile/page.tsx` | Profile view | **IMPLEMENTED / LOCALIZED** | Reads `profiles` by authenticated user ID |
| `app/[locale]/profile/edit/page.tsx` | Profile editing | **IMPLEMENTED / LOCALIZED** | Client page |
| `app/[locale]/characters/page.tsx` | Character list | **IMPLEMENTED** | Query has no explicit owner filter; security depends on RLS |
| `app/[locale]/characters/[id]/page.tsx` | Character details/edit route | **IMPLEMENTED** | Query uses character ID only; security depends on RLS |
| `app/[locale]/characters/new/page.tsx` | Game-system selection | **IMPLEMENTED** | VtM available; CoC unavailable |
| `app/[locale]/characters/new/[system]/page.tsx` | New-character route | **IMPLEMENTED** | Validates game system and renders creator |
| `components/characters/character-creator.tsx` | Character creation logic | **IMPLEMENTED / NEEDS REFACTOR** | Stores separate `name`, `description`, `visibility`, `clan`, `hunger` states |
| `components/characters/character-editor.tsx` | Character view/edit/save/clear logic | **IMPLEMENTED / NEEDS REFACTOR** | Duplicates creator state and VtM field handling |
| `components/characters/sheets/vtm-v5/vtm-character-sheet.tsx` | Current VtM sheet UI | **IMPLEMENTED / MINIMAL** | Only Clan and Hunger |
| `components/characters/short-description-field.tsx` | Short-card description field | **IMPLEMENTED** | Two lines, 50 characters per line |
| `components/characters/delete-character-button.tsx` | Character deletion from card | **IMPLEMENTED** | Does not yet clean up future Storage assets |
| `lib/characters/game-systems.ts` | System registry, defaults, legacy normalization | **IMPLEMENTED** | Current VtM default uses `schemaVersion: 1` |
| `utils/supabase/client.ts` | Browser Supabase client | **IMPLEMENTED / UNTYPED** | No `Database` generic |
| `utils/supabase/server.ts` | Server Supabase client | **IMPLEMENTED / UNTYPED** | No `Database` generic |
| `utils/supabase/proxy.ts` | Auth-cookie/session refresh | **IMPLEMENTED** | Calls `getClaims()` |
| `supabase/migrations/` | Database migration history | **NOT PRESENT IN REPOSITORY** | Must be established before schema work |
| `types/database.types.ts` or equivalent | Generated database contract | **NOT PRESENT IN REPOSITORY** | Must be generated and connected to clients |
| `PROJECT_CONTEXT.md` | Permanent project-state summary | **NOT PRESENT / NOT AVAILABLE** | Recommended to create |
| `docs/CHARACTER_SHEETS.md` | Character-sheet specification | **NOT PRESENT / NOT AVAILABLE** | Recommended to create before implementation |
| `docs/DATABASE.md` | Database/RLS/Storage documentation | **NOT PRESENT / NOT AVAILABLE** | Recommended to create |
| `docs/decisions/` | ADRs | **NOT PRESENT / NOT AVAILABLE** | Recommended to create |

---

## 8. Current Data Contracts

### 8.1 Verified application-referenced character fields

The current application code references the following `characters` fields:

- `id`
- `owner_id`
- `name`
- `game_system`
- `description`
- `visibility`
- `sheet_data`
- `created_at`
- `updated_at`

**Important:** these are **VERIFIED APPLICATION REFERENCES**, not a verified database schema. Actual data types, defaults, nullability, constraints, indexes, triggers, and policies remain unverified.

### 8.2 Verified application-referenced profile fields

The application references:

- `id`
- `username`
- `display_name`
- `bio`

Again, this is not a verified schema export.

### 8.3 Current application TypeScript contracts

#### Locales

- `en`
- `ru`

#### Game-system IDs

- `vtm-v5`
- `call-of-cthulhu-7e`

#### Legacy game-system normalization

- `Vampire: The Masquerade V5` → `vtm-v5`
- `Call of Cthulhu` → `call-of-cthulhu-7e`

#### Character visibility values

- `private`
- `campaign`
- `public`

#### Short Description

- Maximum lines: `2`
- Maximum characters per line: `50`
- Maximum non-newline characters: `100`
- Current field logic wraps/truncates input to these limits.

### 8.4 Current `sheet_data` format

#### VtM V5

```text
schemaVersion: 1
clan: string
hunger: number
```

Defaults:

```text
clan: empty string
hunger: 1
```

Current Hunger UI allows values `0` through `5`.

#### Call of Cthulhu 7e

```text
schemaVersion: 1
```

The system is currently unavailable for character creation.

### 8.5 Current schema-version behavior

- Creator writes `schemaVersion: 1`.
- Editor reads Clan and Hunger from the current object.
- Editor spreads existing `sheet_data` and writes updated Clan and Hunger.
- No runtime schema validation exists.
- No explicit migration function exists.
- No generated database JSON type exists.

### 8.6 Target character-record model

The following is a **DECIDED TARGET**, not an existing verified database model:

- existing common character columns remain separate from system-specific data;
- add an independent `sheet_language`;
- add a portrait file reference such as `portrait_path`;
- continue using `sheet_data` for system-specific data;
- retain timestamps and ownership;
- do not duplicate common fields inside `sheet_data`.

The exact SQL types, defaults, constraints, and nullability must be decided only after auditing the current schema.

### 8.7 Target VtM V5 `sheet_data`

The complete VtM model is **DECIDED IN SCOPE** and should move to a new schema version, expected to be `schemaVersion: 2`.

Planned sections:

1. Identity and concept
2. Attributes
3. Skills and specialties
4. Disciplines and powers
5. Advantages, backgrounds, flaws, and loresheets
6. Convictions and touchstones
7. Humanity, stains, hunger, blood potency
8. Health and willpower damage
9. Equipment, haven, coterie, and relationships
10. Experience and advancement history
11. Notes
12. Full Biography as the final section at the bottom

The exact TypeScript interface and runtime schema are not yet committed and must be finalized in a dedicated specification.

### 8.8 Migration requirements

A migration/parser function such as `migrateVtmSheetData()` is required.

Minimum backward-compatibility behavior:

- recognize current `schemaVersion: 1`;
- move current `clan` into the new identity section;
- move current `hunger` into the new tracker section;
- add all missing new fields with safe defaults;
- preserve unknown legacy fields where feasible;
- avoid data loss;
- save the upgraded format only through an explicit, tested path.

### 8.9 Runtime validation

- **NOT IMPLEMENTED:** no runtime validation library is installed.
- **PLANNED / RECOMMENDED:** use a runtime schema such as Zod.
- **OPEN DECISION:** exact package and validation strategy.
- TypeScript types alone are insufficient for persisted JSONB from the database.

### 8.10 Independent sheet language

- **DECIDED:** site locale and character-sheet language are independent.
- **NOT IMPLEMENTED:** no verified `sheet_language` field exists.
- **PLANNED:** select sheet language during character creation.
- **DECIDED INITIAL BEHAVIOR:** sheet language should not be casually changed after creation.
- **OPEN QUESTION:** whether a controlled change/migration option should exist later.

---

## 9. Database, RLS and Storage State

### 9.1 Tables

| Table | State |
|---|---|
| `profiles` | **IMPLEMENTED APPLICATION USAGE / DATABASE DEFINITION UNVERIFIED** |
| `characters` | **IMPLEMENTED APPLICATION USAGE / DATABASE DEFINITION UNVERIFIED** |
| Other tables | **UNVERIFIED** |

### 9.2 Columns

Only application-referenced fields listed in Section 8 are known. Actual SQL definitions are **UNVERIFIED**.

### 9.3 Constraints and indexes

**UNVERIFIED:** no SQL migrations, schema dump, or generated types were available.

### 9.4 RLS status

**UNVERIFIED.**

Security-critical observation:

- character list query does not filter by `owner_id`;
- character detail query filters only by `id`;
- update filters only by `id`;
- delete filters only by `id`;
- profile lookup filters by authenticated user ID.

Therefore, character confidentiality and ownership protection currently depend on correct Supabase RLS. This must be verified before expanding the feature.

### 9.5 Confirmed policies

**N/A:** no RLS policy definitions were inspected.

### 9.6 Missing or unverified policies

At minimum, the following policy behavior must be verified:

- users can list only characters they are allowed to read;
- users can insert only rows owned by themselves;
- users can update only their own characters;
- users can delete only their own characters;
- profile ownership and visibility behavior;
- future public-character read behavior;
- future campaign-member read behavior.

### 9.7 SQL migrations

- **VERIFIED REPOSITORY STATE:** no `supabase/migrations` directory exists at the current commit.
- **BLOCKED:** schema-changing character-sheet work should not proceed without creating or importing a repository-backed migration baseline.

### 9.8 Generated database types

- **VERIFIED REPOSITORY STATE:** no generated `Database` type exists.
- Current Supabase clients are untyped.
- **PLANNED:** generate and commit database types, then use `createBrowserClient<Database>` and `createServerClient<Database>`.

### 9.9 Storage

| Item | State |
|---|---|
| Existing Storage buckets | **UNVERIFIED** |
| Existing Storage policies | **UNVERIFIED** |
| Character portrait bucket | **NOT IMPLEMENTED / DECIDED TARGET** |
| Portrait path column | **NOT IMPLEMENTED / DECIDED TARGET** |
| Cleanup on character deletion | **NOT IMPLEMENTED** |

### 9.10 Portrait target architecture

The following is a **DECIDED TARGET**, not an existing implementation:

- character images are files, not Base64 data in `sheet_data`;
- use Supabase Storage;
- store only a file path/reference in the character row;
- use an ownership-based path convention;
- initially prefer private access;
- define upload/read/update/delete Storage policies;
- upload after a character ID exists;
- do not delete the old image until a replacement is successfully stored and the database row is updated;
- deleting a character must eventually clean up its portrait files.

Exact bucket name, path format, file limits, and image-processing behavior remain implementation decisions.

### 9.11 Environment variables

Verified variable names used by the clients:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Values are not included.

### 9.12 Dashboard-only configuration

- Supabase Auth is operational.
- Confirmation redirect allow-list configuration was discussed and manually configured/tested according to the user.
- Exact Dashboard settings were not exported.
- Any dashboard-only schema, RLS, or Storage configuration remains **UNVERIFIED** until exported or documented.

---

## 10. Confirmed Architectural Decisions

| Decision | Status | Reason | Related files or ADR |
|---|---|---|---|
| Locale-prefixed routes use `/en` and `/ru` | **IMPLEMENTED / VERIFIED** | Stable, explicit, shareable language URLs | `i18n/routing.ts` |
| Locale cookie persists for one year | **IMPLEMENTED / VERIFIED** | Preserve the last selected site language | `i18n/routing.ts` |
| Locale-less URLs are handled by `next-intl`, not a hard-coded root redirect | **IMPLEMENTED / VERIFIED** | Prevent forcing English and respect the locale cookie | `proxy.ts`, routing config |
| Document `<html lang>` follows active locale | **IMPLEMENTED** | Accessibility and semantics | `app/layout.tsx`, language switcher |
| Application navigation uses `@/i18n/navigation` | **IMPLEMENTED** | Prevent duplicate/missing locale prefixes | `i18n/navigation.ts` |
| Technical `/auth/confirm` remains outside locale routing | **IMPLEMENTED** | Callback endpoint is technical; locale is carried explicitly | `app/auth/confirm/route.ts`, `proxy.ts` |
| Legacy `/auth/signout` route is removed | **IMPLEMENTED** | Sign-out is handled through a reusable localized client component | account components |
| Raw Supabase error messages are not shown to users | **IMPLEMENTED / DECIDED RULE** | Security, UX, and localization consistency | `lib/auth/get-auth-error-key.ts` |
| System-specific character data remains in `sheet_data` JSONB | **DECIDED / CURRENTLY USED** | Different TTRPG systems require different structures | character creator/editor |
| Common character data remains in ordinary columns | **DECIDED / CURRENTLY USED** | Avoid duplication and simplify listing/filtering | current character code |
| `sheet_data` is versioned | **DECIDED / CURRENTLY USED** | Required for future migrations | `schemaVersion: 1` |
| Site locale and sheet language are independent | **DECIDED / NOT IMPLEMENTED** | Users may use a Russian site with an English sheet, or vice versa | future ADR required |
| Existing VtM data must migrate without loss | **DECIDED / NOT IMPLEMENTED** | Preserve current characters | future migration module |
| Full VtM sheet uses one typed system data object | **DECIDED / NOT IMPLEMENTED** | Avoid many independent field states and creator/editor duplication | future character form |
| Creator and Editor should share a common form architecture | **DECIDED / NOT IMPLEMENTED** | Prevent duplicated logic and inconsistent validation | future `CharacterForm` |
| Character portrait upload is required | **DECIDED / NOT IMPLEMENTED** | Explicit user requirement | future portrait component |
| Portrait file data must not be stored as Base64 in JSONB | **DECIDED / NOT IMPLEMENTED** | Avoid oversized rows and simplify lifecycle/access control | future Storage ADR |
| Full Biography is the final lower section of the sheet | **DECIDED / NOT IMPLEMENTED** | Explicit user requirement | future sheet specification |
| Short Description remains separate from Full Biography | **DECIDED / CURRENTLY PARTIAL** | Short Description is for character cards | short-description component |
| View and Edit are separate modes | **DECIDED / CURRENTLY IMPLEMENTED IN BASIC FORM** | Prevent accidental edits | character editor |
| Saving is explicit; no autosave in the first full version | **DECIDED** | Predictable user control and simpler error recovery | future form |
| Save controls appear at top and bottom | **DECIDED / CURRENTLY IMPLEMENTED IN BASIC FORM** | Long sheets need accessible save controls | character editor |
| Clear Form does not delete the character | **DECIDED / CURRENTLY IMPLEMENTED IN BASIC FORM** | Separate clearing from deletion | character editor |
| Delete Character remains on the character card | **DECIDED / CURRENTLY IMPLEMENTED** | Reduce accidental deletion inside the sheet | character list/delete component |
| Final visual design follows functional implementation | **DECIDED** | Stabilize data, security, and workflows before decorative styling | project workflow |
| Data and presentation must remain separate | **DECIDED** | Allow later redesign and print/PDF rendering without schema changes | future sheet architecture |
| Game-system sheet translations should be separated by domain/system | **PLANNED / RECOMMENDED** | Prevent large monolithic message files and namespace conflicts | future I18N document |
| Large editorial game descriptions should use structured content such as MDX rather than UI translation JSON | **PLANNED / RECOMMENDED** | Better support for long rich text | future content architecture |
| Handoff documents use sequential IDs and verified commits | **DECIDED** | Preserve chronology without treating sequence alone as truth | H001, H002 |

---

## 11. Functional Requirements Preserved

### 11.1 Character management

- A user can create, view, edit, save, clear, and delete a character.
- Delete remains on the character card.
- Character list cards display name, game system, short description, and visibility.
- Short Description is limited to two lines of 50 characters each.
- Existing records must remain readable after future schema upgrades.
- All ownership/security behavior must be enforced by verified RLS, not only client code.

### 11.2 Complete VtM V5 sheet

The planned full sheet includes:

- Character identity and concept
- Chronicle
- Clan
- Sire
- Generation
- Predator Type
- Ambition
- Desire
- Appearance
- Attributes: Physical, Social, Mental
- Full V5 Skills grouped by category
- Specialties
- Disciplines
- Discipline powers
- Merits
- Backgrounds
- Flaws
- Loresheets
- Convictions
- Touchstones
- Humanity
- Stains
- Hunger
- Blood Potency
- Health
- Willpower
- Equipment
- Haven
- Coterie
- Relationships
- Experience totals and history
- Notes
- Full Biography as the final bottom section

### 11.3 Portrait

- **DECIDED:** the sheet must contain an image-upload area for the character portrait.
- In view mode, show the image or a neutral placeholder.
- In edit/create mode, support selecting an image and previewing it.
- Replacement and removal must not destroy the current saved portrait before Save succeeds.
- File-type, size, crop, and aspect-ratio rules remain open implementation details.
- The target architecture uses Storage and a database path/reference.
- Portrait lifecycle must be integrated with character deletion.

### 11.4 Biography and descriptions

- Short Description is for the character card.
- Full Biography is long-form and separate.
- Full Biography is placed at the bottom of the complete sheet.
- Full Biography has no 100-character limit.
- View mode must preserve paragraph and line-break formatting.

### 11.5 View and Edit modes

View mode:

- fields are non-editable;
- add/remove controls are hidden;
- ratings are displayed as static values;
- Edit controls are available at the top and bottom.

Edit mode:

- fields and repeated lists are editable;
- Save Changes appears at top and bottom;
- Clear Form is available near the bottom;
- unsaved-change protection should be added;
- no automatic save in the first full version.

### 11.6 Calculations and trackers

- Health maximum is derived from Stamina plus three.
- Willpower maximum is derived from Composure plus Resolve.
- Existing marked damage must not silently disappear when a maximum decreases.
- Tracker data must distinguish superficial and aggravated damage.

### 11.7 Validation

Hard validation should cover:

- required character name;
- Short Description limits;
- rating ranges;
- tracker ranges;
- non-negative experience;
- schema shape;
- technical data integrity.

Creation-rule validation should generally produce warnings rather than prohibit all non-standard characters, because the system must support starting characters, experienced characters, NPCs, and non-standard chronicles.

### 11.8 Fresh Embrace support

The schema must allow unknown or empty:

- Clan
- Sire
- Predator Type
- Disciplines

A future `creationVariant` may distinguish standard creation and fresh-embrace creation. Hidden Storyteller fields are not part of the first full-sheet version.

### 11.9 Localization

- Site UI language and sheet language are independent.
- Sheet labels must come from the selected sheet language.
- Site navigation, save/error controls, and account UI follow the route locale.
- VtM sheet messages should ultimately live in separate EN/RU system dictionaries.
- Current monolithic message files remain valid until a deliberate migration is implemented.

### 11.10 Security

- Verify RLS before expanding reads/writes.
- Do not rely on client UI to enforce ownership.
- Do not expose backend error details.
- Portrait Storage policies must follow ownership.
- Public and campaign visibility semantics require explicit future implementation.

### 11.11 Mobile and accessibility

- The complete sheet must be responsive.
- Portrait and identity may stack on mobile.
- Controls must remain keyboard accessible.
- Inputs require labels.
- View/edit state must be visually distinguishable.
- Text/background contrast must remain readable after later themed design.
- Decorative fonts must not reduce readability of long biography text.

### 11.12 Print and PDF preparation

- Data structures must be presentation-independent.
- Editable input controls must not be the only representation of the sheet.
- A future print/static renderer should consume the same validated data.
- Actual PDF generation is outside the first full functional implementation.

### 11.13 Visual design

After technical foundations are stable, the project may change:

- fonts;
- colors;
- page backgrounds and textures;
- button styles;
- typography;
- card design;
- character-sheet visual layout;
- rating dots;
- tracker appearance;
- per-game themes;
- print layout.

This must not require rewriting database contracts or business logic.

---

## 12. User Requirements and Working Preferences

1. The user works in **Windows CMD**.
2. Instructions must be sequential and practical.
3. Verify each significant change before continuing.
4. For substantial file edits, provide the complete file content.
5. All code comments must be in English.
6. All text inside code blocks must be in English.
7. Inspect the current file before proposing its replacement.
8. Do not rely on an old pasted file if the repository contains a newer version.
9. Do not expose raw backend errors to users.
10. Implement functional and security foundations before detailed graphic design.
11. Do not lose existing user data.
12. Do not invent database objects or infrastructure.
13. Use exact commit hashes when reviewing the repository.
14. Preserve context through numbered handoffs and permanent documentation.
15. Treat newer handoff numbers as chronology only; actual verified code and infrastructure have higher priority.
16. Keep archived handoffs out of the active ChatGPT Project context unless historical investigation is needed.
17. Prefer a public GitHub URL plus exact commit over a quickly outdated ZIP archive.
18. Never include secrets, `.env` values, service-role keys, passwords, or personal tokens in documentation or chat.

---

## 13. Localization State

### 13.1 Supported locales

- `en`
- `ru`

### 13.2 Routing behavior

- `localePrefix: "always"`
- default locale: `en`
- locale cookie max age: one year
- technical route `/auth/confirm` excluded from locale middleware
- locale-aware confirmation callback uses a validated `locale` query parameter
- no hard-coded `app/page.tsx` redirect forcing English
- language switching preserves the current localized route
- client switcher updates document language
- root layout reads active locale for `<html lang>`

### 13.3 Current message-file structure

Current files:

- `messages/en.json`
- `messages/ru.json`

They are monolithic and currently contain these namespaces:

- `AccountArea`
- `AccountPage`
- `Navigation`
- `Common`
- `Home`
- `Dashboard`
- `Login`
- `Register`
- `Profile`
- `ProfileEdit`
- `Characters`
- `CharacterSystemSelection`
- `CharacterNew`
- `CharacterDetails`
- `GameSystems`
- `CharacterForm`
- `CharacterEditor`
- `CharacterDelete`
- `ShortDescription`
- `VtmCharacterSheet`
- `GamesPage`
- `VampireGamePage`
- `NotFoundPage`
- `Metadata`
- `PageMetadata`
- `AuthErrors`

### 13.4 Metadata

- localized site description;
- page-specific titles for the main routes;
- metadata layouts for client pages;
- dynamic character title using the character name when accessible;
- title template appends `TTRPG Hub`.

### 13.5 Localized 404 behavior

- `app/[locale]/not-found.tsx`
- `app/[locale]/[...rest]/page.tsx`
- localized Home return link.

### 13.6 Authentication errors

- raw Supabase error strings are mapped to safe keys;
- existing-account registration returns the same generic success response;
- generic fallback exists;
- final grep found no `error.message` under `app` or `components`.

### 13.7 Audits completed

- no obvious hard-coded visible English text found between JSX tags;
- no English `placeholder`, `title`, `aria-label`, or `alt` literals found by the used grep;
- no corrupted `ΓåÉ` or replacement-character matches;
- translation hook/use inventory reviewed.

### 13.8 Unverified localization checks

- An explicit final automated EN/RU nested-key parity output was not provided.
- JSON syntax is indirectly verified by the successful production build.
- No dedicated I18N test suite exists.
- No automated CI localization check exists.

### 13.9 Planned message split

Recommended future structure:

- common UI
- navigation
- auth
- account
- characters
- errors
- metadata
- per-system sheet dictionaries such as `sheets/vtm-v5`
- campaign UI dictionaries
- structured MDX/content files for long editorial game descriptions

This split is **PLANNED**, not implemented.

### 13.10 Sheet language

- independent sheet language is **DECIDED**;
- no database field or UI exists yet;
- current VtM labels follow the site locale through `useTranslations("VtmCharacterSheet")`;
- this must change when independent sheet language is implemented.

---

## 14. Verification Evidence

### 14.1 Final Git verification

Commands and results:

- `git status` → clean, up to date with `origin/main`
- `git branch --show-current` → `main`
- `git remote get-url origin` → verified GitHub remote
- `git rev-parse HEAD` → `aa939c197bded84bf616a3b2246f54042e5c5253`
- `git rev-parse origin/main` → same full SHA
- `git ls-remote origin refs/heads/main` → same full SHA
- `git log -1 --stat --oneline` → `aa939c1 Fix localized character loading error`
- `git diff --check` → no output
- final `git status` → clean and synchronized

### 14.2 Final production build

Command:

`npm run build`

Result:

- compilation passed;
- TypeScript passed;
- page-data collection passed;
- static-page generation passed;
- final optimization passed.

Final route list:

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

All routes are server-rendered on demand.

### 14.3 Static searches

| Check | Result |
|---|---|
| Direct visible English between JSX tags | **VERIFIED:** no text matches after ignoring binary files |
| English placeholder/title/aria-label/alt literals | **VERIFIED:** no matches |
| Raw `error.message` under `app` and `components` | **VERIFIED:** no matches |
| Raw set-message error pattern | **VERIFIED:** corrected |
| Corrupted arrow/replacement characters | **VERIFIED:** no matches |
| Translation API inventory | **VERIFIED:** expected server/client usage was listed and reviewed |
| `git diff --check` | **VERIFIED PASS** |

### 14.4 Manual/user-reported checks during the chat

- email-confirmation locale change reported working;
- localized 404 reported working;
- localized site metadata reported working;
- page-specific metadata reported working;
- authentication metadata reported working after type correction;
- character-route metadata reported working;
- final deployment manually verified.

### 14.5 Not yet verified by dedicated tests

- cross-user RLS isolation;
- direct attempts to update/delete another user's character;
- Storage security;
- portrait lifecycle;
- old `schemaVersion: 1` migration;
- independent sheet language;
- mobile complete-sheet behavior;
- automated EN/RU key parity;
- lint result;
- unit tests;
- end-to-end tests;
- full production route matrix after the final commit;
- public/campaign visibility behavior.

---

## 15. Git State

| Field | Verified value |
|---|---|
| Current branch | `main` |
| HEAD | `aa939c197bded84bf616a3b2246f54042e5c5253` |
| `origin/main` | `aa939c197bded84bf616a3b2246f54042e5c5253` |
| Remote `main` | `aa939c197bded84bf616a3b2246f54042e5c5253` |
| Ahead/behind | `0/0` |
| Working tree | Clean |
| Changed files | None |
| Untracked files | None |
| Last commit | `aa939c1 Fix localized character loading error` |
| Last commit files | `messages/en.json`, `messages/ru.json` |
| Last commit diff | 2 insertions, 2 deletions |
| Push completed | Yes |
| Vercel deployment created | Yes |
| Deployment manually verified | Yes |

### H002 commit sequence after the H001 code-bearing commit

1. `a5cecff` — Localize profile and login pages
2. `0886913` — Localize character routes
3. `45e5395` — Localize character forms
4. `2cf736c` — Localize dashboard and games pages
5. `adfd00b` — Add localized sign out flow
6. `29dcb47` — Add account area and settings page
7. `6cf6c10` — Improve authenticated registration flow
8. `a4502bf` — Add account area and remove legacy sign out route
9. `808a93f` — Trigger Vercel preview deployment
10. `c8a69a5` — Persist locale and localize home page
11. `6da5d54` — Set document language from locale
12. `cae25a1` — Preserve locale during email confirmation
13. `f55147c` — Add localized not found page
14. `07b0dcd` — Add localized site metadata
15. `a04e708` — Add localized page metadata
16. `425bd8c` — Add metadata for authentication pages
17. `f068194` — Complete localized route metadata
18. `41d4b74` — Complete interface localization
19. `aa939c1` — Fix localized character loading error

---

## 16. Known Problems and Risks

| Severity | Problem | Impact | Mitigation | Status |
|---|---|---|---|---|
| Critical | RLS policies are not represented or verified | A user might read, update, or delete another user's character if policies are incorrect | Export/inspect policies, create repository-backed migrations, and test with two users | **BLOCKED / OPEN** |
| High | No database migrations in the repository | Schema changes cannot be reviewed, reproduced, or safely versioned | Establish a Supabase migration baseline before adding sheet fields | **BLOCKED / OPEN** |
| High | No generated database types | TypeScript cannot verify table/column/query contracts | Generate and commit `Database` types; type all Supabase clients | **OPEN** |
| High | Portrait Storage state and policies are unknown | Upload implementation could expose files or allow cross-user modification | Audit Storage first; create private bucket and ownership policies through migrations/configuration | **BLOCKED / OPEN** |
| High | Current VtM `sheet_data` has no runtime validation | Corrupt or unexpected JSON can break the full sheet | Add a runtime schema and migration parser | **OPEN** |
| High | Current creator/editor duplicate sheet state and logic | Expanding to dozens of fields will create inconsistency and fragile code | Create one typed `sheetData` object and shared `CharacterForm` architecture | **OPEN** |
| Medium | Current character operations lack consistent `try/catch/finally` | Network exceptions may leave buttons stuck or produce poor recovery | Refactor mutation handlers during shared-form work | **OPEN** |
| Medium | `public` and `campaign` visibility are UI values without verified access semantics | Users may misunderstand sharing behavior | Define data model, RLS, campaign membership, and public routes before advertising sharing | **OPEN** |
| Medium | Character detail/list/update/delete rely on RLS rather than explicit owner filters | Safe only if RLS is correct | Verify RLS; optional defense-in-depth owner checks where appropriate | **OPEN** |
| Medium | Current message files are large monolithic JSON documents | Harder maintenance as systems and campaigns grow | Split by domain after a controlled loader migration | **OPEN / PLANNED** |
| Medium | Site locale currently controls VtM sheet labels | Does not meet independent sheet-language requirement | Add `sheet_language` after schema audit and load sheet dictionary independently | **OPEN** |
| Medium | No test suite or CI localization/security checks | Regressions may only appear manually | Add targeted tests after the architecture stabilizes | **OPEN** |
| Medium | Stable Vercel alias was not rechecked in final H002 evidence | Documentation may point to a deployment-specific URL only | Verify and document the canonical production alias in the next chat | **UNVERIFIED** |
| Low | README is still create-next-app boilerplate | New contributors/AI lack reliable project context | Replace with project-specific README or link permanent docs | **OPEN** |
| Low | No permanent context/specification/ADR files yet | Decisions remain dependent on chat handoffs | Create the recommended documentation set and commit it | **OPEN** |
| Low | Final visual architecture is not centralized in shared UI components | Later redesign may require repeated Tailwind edits | Add shared UI primitives/design tokens before or during visual redesign | **PLANNED** |

---

## 17. Superseded Approaches

- **DEPRECATED:** copying Supabase middleware headers over `next-intl` response headers.
- **DEPRECATED:** forcing `/` to redirect permanently to `/en`.
- **DEPRECATED:** keeping migrated application pages on non-localized routes.
- **DEPRECATED:** using a legacy `/auth/signout` route for normal UI logout.
- **DEPRECATED:** exposing Supabase `error.message` directly to users.
- **DEPRECATED:** rendering the technical backend character-list error in the localized message.
- **DEPRECATED:** registration code where `errorKey` can remain `null` and be passed to translations.
- **DEPRECATED:** placing character-query error logging inside `generateMetadata()`.
- **DEPRECATED:** corrupted encoded arrow text such as `ΓåÉ`; use a proper Unicode arrow or safe entity.
- **DEPRECATED:** importing `useTranslations` twice from `next-intl`.
- **DEPRECATED FOR THE FULL SHEET:** one separate `useState` for every VtM field.
- **DEPRECATED FOR TARGET ARCHITECTURE:** duplicating common fields such as name, visibility, description, system, or sheet language inside `sheet_data`.
- **DEPRECATED FOR TARGET ARCHITECTURE:** storing portrait image bytes/Base64 in `sheet_data` or another database text field.
- **DEPRECATED ASSUMPTION:** treating `sheet_language`, `portrait_path`, Storage buckets, or policies as already existing.
- **DEPRECATED ASSUMPTION:** treating `visibility = public` as a working public page without routes and RLS that implement it.
- **DEPRECATED PROCESS:** using the latest handoff number alone to resolve truth without checking commit, migrations, types, statuses, and verification date.

The current monolithic translation files are **not yet deprecated**. They remain the working implementation until a controlled split is committed.

---

## 18. Open Questions

| Question | Blocking | Current options | Recommended decision point |
|---|---|---|---|
| What is the actual Supabase schema for `profiles` and `characters`? | Yes | Dashboard inspection, SQL schema export, Supabase CLI pull, generated types | First task of the next chat |
| Which RLS policies currently protect character rows? | Yes | Export current policies or recreate verified policies in migrations | Before any full-sheet or portrait work |
| Does a Storage bucket already exist? | Yes for portrait work | Inspect current Storage; create a new private bucket if absent | Database/Storage baseline stage |
| What exact SQL type/default/constraint should `sheet_language` use? | Yes | Text check constraint, enum, other | After current schema is verified |
| What exact SQL field should store portrait reference? | Yes | `portrait_path`, separate media table, other | After schema audit; current target favors a path column |
| Which runtime validation library should be used? | Yes for schema implementation | Zod, Valibot, custom parser | During VtM data-contract stage |
| What is the final `VtmV5SheetData` interface? | Yes | Finalize from agreed sections and official game terminology | After database baseline, before UI |
| How should unknown legacy `sheet_data` keys be preserved? | Yes | Preserve under legacy/extras, shallow merge, explicit whitelist | During migration design |
| Can `sheet_language` be changed after creation? | No for initial implementation | Immutable, controlled conversion, freely editable | Decide before UI creation |
| What portrait formats, maximum size, and image dimensions are allowed? | Yes for upload | JPEG/PNG/WebP; configurable size; optional crop | During Storage/portrait specification |
| Is client-side image cropping required in the first version? | No | No crop, fixed preview crop, user-controlled crop | Decide before portrait UI |
| How are old portrait files removed after replacement or character deletion? | Yes | Client cleanup, server action, database trigger/edge function | Before portrait save/delete implementation |
| How should `public` and `campaign` visibility work? | No for private full-sheet MVP | Authenticated public read, anonymous public page, campaign membership tables | Define before enabling sharing |
| How should translation JSON files be split and loaded? | No for database stage | Static merged imports, per-domain loader, dynamic system loader | Before full VtM dictionary expansion |
| Which MDX/content solution should handle large game descriptions? | No | Native MDX, content collections, custom loader | When editorial content work begins |
| When should shared UI primitives and design tokens be added? | No | Before full sheet, during sheet, after functional MVP | Prefer lightweight primitives during full-sheet work |
| What is the canonical stable production URL? | No | Verify project alias and document it | At the start or end of the next deployment cycle |

---

## 19. Exact Next Task

### Task

**Establish a verified, repository-backed Supabase database and security baseline for character-sheet development.**

### Goal

Before adding `sheet_language`, portrait references, Storage upload, or a large VtM JSON schema:

1. inspect the actual current `profiles` and `characters` schema;
2. inspect all current RLS policies;
3. inspect Storage buckets and policies;
4. create or import SQL migrations representing the verified state;
5. generate TypeScript database types;
6. connect Supabase clients to the generated `Database` type;
7. verify that one user cannot read, update, or delete another user's private character.

### Required inputs

- Access to the Supabase project Dashboard or CLI.
- Current table definitions.
- Current RLS policy definitions.
- Current Storage bucket/policy list.
- Two test users for ownership-isolation testing.
- Current repository at the verified commit.

### Files to inspect first

- `AGENTS.md`
- `package.json`
- `utils/supabase/client.ts`
- `utils/supabase/server.ts`
- `utils/supabase/proxy.ts`
- `app/[locale]/characters/page.tsx`
- `app/[locale]/characters/[id]/page.tsx`
- `components/characters/character-creator.tsx`
- `components/characters/character-editor.tsx`
- `components/characters/delete-character-button.tsx`
- `app/[locale]/profile/page.tsx`
- `app/[locale]/profile/edit/page.tsx`

### Dependencies

- Do not expose any keys or `.env` values.
- Do not modify production schema without a reviewed migration and backup/recovery understanding.
- Verify whether Supabase CLI is installed/configured before relying on it.
- Read the relevant local Next.js 16 documentation before changing framework files.

### Completion criteria

1. Current table schemas are documented.
2. Current RLS policies are documented and represented in migrations.
3. Ownership policies are verified with two users.
4. Migration directory exists and is committed.
5. Generated database types exist and are committed.
6. Browser, server, and proxy Supabase clients use the generated type where supported.
7. `npm run build` passes.
8. Existing Profile and Character functions still work.
9. No existing character data is lost.
10. `DATABASE.md` is created or updated with the verified state.
11. The next migration for `sheet_language`, portrait reference, and Storage can be designed from verified facts.

### Out of scope for this task

- Full VtM V5 UI.
- `schemaVersion: 2` implementation.
- Portrait upload UI.
- Character-sheet translation split.
- Campaign membership.
- Public character pages.
- PDF generation.
- Detailed visual redesign.

---

## 20. Resume Procedure

1. Read `H002_CURRENT_HANDOFF.md`.
2. Confirm that H002 is the latest active handoff.
3. Verify repository state and compare HEAD with the H002 commit.
4. Read `AGENTS.md`.
5. Run the current production build before changes.
6. Confirm that no `supabase/migrations` or generated database type has appeared in a newer commit.
7. Inspect current Supabase client and character/profile query files.
8. Ask the user for schema/RLS/Storage output or guide them through safe Supabase inspection.
9. Do not infer policies from application code.
10. Create a database-state inventory with `VERIFIED` and `UNVERIFIED` labels.
11. Decide whether to import existing schema as a baseline migration or recreate it carefully.
12. Generate database types.
13. Type the Supabase clients.
14. Test ownership isolation with two users.
15. Run `git diff --check`, build, and Git status.
16. Commit only after existing functions and security checks pass.
17. Update `DATABASE.md`, `PROJECT_CONTEXT.md`, and the next handoff.

---

## 21. Useful Commands

Run from Windows CMD:

```bat
cd /d D:\TT_games\00_TTRPG_web\Projects\ttrpg-website
git status
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git log -1 --stat --oneline
git diff --check
npm run build
```

Inspect repository database assets:

```bat
if exist supabase (tree supabase /F /A) else (echo Supabase folder does not exist)
dir /S /B *.sql 2>nul
dir /S /B *database*types*.ts 2>nul
tree utils\supabase /F /A
```

Find current database operations:

```bat
git --no-pager grep -n -I "from(\"profiles\")" -- app components lib utils
git --no-pager grep -n -I "from(\"characters\")" -- app components lib utils
```

Check whether a Supabase CLI is already available:

```bat
supabase --version
```

Do not install or link a CLI, expose credentials, or run production-changing database commands until the approach is reviewed.

---

## 22. References

| Reference | State |
|---|---|
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Verified commit | `aa939c197bded84bf616a3b2246f54042e5c5253` |
| Verified deployment URL supplied at H002 close | `https://ttrpg-website-lyi97n1fe-andrey-yudin.vercel.app` |
| Known stable alias from earlier project state | `https://ttrpg-website-xi.vercel.app` — not reverified at final H002 close |
| Previous handoff | `H001_CURRENT_HANDOFF.md` |
| Current handoff | `H002_CURRENT_HANDOFF.md` |
| `PROJECT_CONTEXT.md` | **N/A / not available** |
| Architecture document | **N/A / not available** |
| Character-sheet specification | **N/A / not available** |
| Database documentation | **N/A / not available** |
| I18N documentation | **N/A / not available** |
| Roadmap | **N/A / not available** |
| SQL migrations | **N/A / not present in repository** |
| Generated database types | **N/A / not present in repository** |
| ADRs | **N/A / not available** |
| Repository instructions | `AGENTS.md`, `CLAUDE.md` |
| H001 historical code-bearing commit | `e96ee5d83feb30a22e00a9113b4cbea21235f616` |
| H001 trigger snapshot | `e00fa6f` abbreviated in H001 |

---

## 23. Suggested Updates to Permanent Documents

| Document | Recommendation |
|---|---|
| `PROJECT_CONTEXT.md` | **CREATE.** Include repository, stack, verified current commit, implemented modules, active character-sheet stage, source-of-truth rules, permanent user preferences, and current priority. |
| `docs/ARCHITECTURE.md` | **CREATE.** Document Next.js layouts/routes, `next-intl`, Supabase clients, server/client boundaries, character-system registry, JSONB strategy, and planned shared form architecture. |
| `docs/DATABASE.md` | **CREATE AFTER AUDIT.** Include verified tables, fields, constraints, indexes, RLS, Storage, path conventions, migrations, and generated-type workflow. |
| `docs/I18N.md` | **CREATE.** Record locales, routing, cookie, metadata, confirmation callback, namespaces, current monolithic files, future domain split, and independent sheet language. |
| `docs/CHARACTER_SHEETS.md` | **CREATE BEFORE FULL IMPLEMENTATION.** Include complete VtM field contract, ordering, portrait, biography placement, validation, migration, view/edit behavior, languages, and print/PDF preparation. |
| `docs/ROADMAP.md` | **CREATE.** Mark localization complete; set database/RLS/Storage baseline as current; full VtM sheet next; campaigns and other systems later. |
| `ADR-001-character-system-jsonb.md` | **CREATE.** Record system-specific JSONB with schema versions and migration responsibility. |
| `ADR-002-independent-sheet-language.md` | **CREATE.** Record separation of route locale and sheet language. |
| `ADR-003-character-portrait-storage.md` | **CREATE AFTER STORAGE AUDIT.** Record Storage-based portraits and path-only database reference. |
| `ADR-004-domain-translation-files.md` | **CREATE WHEN MESSAGE SPLIT IS IMPLEMENTED.** Do not mark the split implemented yet. |
| `README.md` | **UPDATE LATER.** Replace create-next-app boilerplate with project summary and links to permanent docs. |
| `AGENTS.md` | **NO CHANGE.** Its Next.js 16 warning remains important. |

---

## 24. Suggested Opening Message for the Next Chat

Continue the `Web_Site_TTRPG / ttrpg-website` project using the attached `H002_CURRENT_HANDOFF.md`.

Repository:
`https://github.com/Andrey-0101/ttrpg-website`

Verified commit:
`aa939c197bded84bf616a3b2246f54042e5c5253`

Current completed stage:
EN/RU interface localization, localized metadata and 404 handling, account/auth flows, and the initial character-management foundation are committed, built, deployed, and manually verified.

Current stage:
Prepare the technical foundation for the complete Vampire: The Masquerade V5 character sheet.

First exact task:
Audit the actual Supabase `profiles` and `characters` schema, RLS policies, and Storage state; establish repository-backed SQL migrations; generate database types; and verify cross-user character isolation.

Before proposing code:
1. verify Git status and HEAD;
2. read `AGENTS.md`;
3. inspect the current Supabase clients and character/profile queries;
4. do not invent columns, policies, buckets, or migrations;
5. do not begin the full character-sheet UI until the database/security baseline is verified.

---

## 25. Handoff Quality Check

| Check | Result |
|---|---|
| Correct handoff sequence | **PASS:** H002 identifies H001 as the previous historical handoff |
| Exact commit captured | **PASS:** local, tracking, and remote `main` SHA match |
| Working tree state captured | **PASS:** verified clean |
| Build evidence captured | **PASS:** compilation and TypeScript passed |
| Production status separated from assumptions | **PASS:** deployment-specific URL verified; stable alias marked unverified at H002 close |
| Current implementation separated from target architecture | **PASS** |
| Database assumptions marked | **PASS:** schema/RLS/Storage remain unverified |
| Existing `sheet_data` contract captured | **PASS:** VtM `schemaVersion: 1`, Clan, Hunger |
| Planned schema not described as existing | **PASS** |
| Character-sheet requirements preserved | **PASS** |
| Portrait requirement preserved | **PASS** |
| Full Biography bottom placement preserved | **PASS** |
| Localization implementation captured | **PASS** |
| Raw backend error rule captured | **PASS** |
| Superseded approaches identified | **PASS** |
| One exact next task provided | **PASS** |
| Next task begins with verification rather than UI coding | **PASS** |
| Permanent-document updates identified | **PASS** |
| Secrets or `.env` values included | **PASS:** none |
| Full source files unnecessarily copied | **PASS:** no |
| Uncommitted code recovery required | **N/A:** working tree is clean |
| Sufficient to continue without reading the full chat | **PASS** |

---

**End of H002 handoff.**
