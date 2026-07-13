# H006_CURRENT_HANDOFF.md

## 1. Document Control

| Field | Value |
|---|---|
| Project name | Web_Site_TTRPG / `ttrpg-website` |
| Handoff version | H006 |
| Sequence position | Sixth project handoff after `H001`–`H005` |
| Previous current handoff | `docs/handoffs/H005_CURRENT_HANDOFF.md` |
| Creation date | 2026-07-10 |
| Scope of this chat | Completion of Campaign Management verification and merge; Campaign Foundation milestone closure; permanent documentation synchronization; creation of `IDEAS_BACKLOG.md`; preparation for Milestone 4A |
| Repository URL | `https://github.com/Andrey-0101/ttrpg-website.git` |
| Active branch | `main` |
| Exact HEAD commit | `cb378c18fc3f07ad6072f27508918ac53784e1b5` |
| Remote commit | `origin/main` = `cb378c18fc3f07ad6072f27508918ac53784e1b5` |
| Ahead / behind | `0 / 0` |
| Working tree at verified snapshot | Clean |
| Untracked files at verified snapshot | None |
| Later handoff file state | H006 was created after the verified snapshot and became the sole untracked file |
| Latest commit | `cb378c1 Merge pull request #14 from Andrey-0101/docs/project-status-after-campaign-foundation` |
| Production alias | `https://ttrpg-website-xi.vercel.app` |
| Inspected production deployment | `https://ttrpg-website-b8ste44pr-andrey-yudin.vercel.app` |
| Deployment target | Production |
| Deployment status | Ready |
| Current milestone | Milestone 4 — VtM Realtime Tools |
| Exact next task | Implement the typed VtM V5 personal dice request/result contract and pure deterministic evaluator with fixed-input verification cases |
| Secrets included | None |

### Status summary

- **VERIFIED** — The repository remote was reported by `git remote get-url origin`.
- **VERIFIED** — `HEAD` and `origin/main` both resolve to `cb378c18fc3f07ad6072f27508918ac53784e1b5`.
- **VERIFIED** — `git rev-list --left-right --count HEAD...origin/main` returned `0 0`.
- **VERIFIED** — At the recorded `cb378c1` snapshot, `git status` reported a clean working tree and the short untracked-file check returned no output.
- **VERIFIED** — H006 was created after that verification and later became the sole untracked file; this does not change the recorded clean snapshot.
- **VERIFIED** — `npm run build` completed successfully at the exact HEAD; TypeScript completed successfully and 30/30 static pages were generated.
- **VERIFIED** — `git diff --check` returned no output.
- **VERIFIED** — Vercel inspection reported the production deployment as `Ready` and listed the production alias.
- **UNVERIFIED** — The pasted Vercel inspection output did not include a Git commit SHA, so the deployment-to-commit association is strongly implied by timing and the `main` alias but was not independently proven in the output.
- **VERIFIED** — PR #14 was merged and `origin/main` contains its merge commit.
- **VERIFIED** — The documentation feature branch is absent from the final local branch list.
- **UNVERIFIED** — Final remote deletion of the documentation feature branch was not checked with `git ls-remote`.

---

## 2. Instructions for the Next Chat

1. **VERIFIED** — Read this handoff before proposing code.
2. **VERIFIED** — Confirm that the repository is still on commit `cb378c18fc3f07ad6072f27508918ac53784e1b5`, or inspect every newer commit before using this document as current state.
3. **VERIFIED** — Read `AGENTS.md` before changing Next.js code.
4. **VERIFIED** — For Next.js 16 work, consult the relevant local documentation under `node_modules/next/dist/docs/`.
5. **VERIFIED** — Inspect the exact current files before replacing or patching them.
6. **DEPRECATED** — Do not use old code snippets, old ZIP contents, or historical handoffs as a source of truth when current repository files differ.
7. **VERIFIED** — Treat committed SQL migrations as authoritative for database objects and never edit an applied migration.
8. **VERIFIED** — Treat `types/database.types.ts` as the generated public-schema type surface; do not edit it manually.
9. **VERIFIED** — Do not invent tables, columns, policies, buckets, environment values, provider settings, or completed tests.
10. **VERIFIED** — Keep authorization in RLS, database constraints/triggers, server boundaries, and Storage policies. UI visibility is not an authorization boundary.
11. **VERIFIED** — Do not expose raw Supabase, database, Storage, or provider errors to users.
12. **VERIFIED** — Preserve existing character records and unknown VtM top-level JSON fields.
13. **VERIFIED** — Keep `VTM_V5_SCHEMA_VERSION = 3` unless a reviewed schema change explicitly requires a new version.
14. **DECIDED** — Build the personal VtM dice evaluator before database persistence, Realtime, or video integration.
15. **BLOCKED** — Do not treat VtM dice interpretation as authoritative until the exact request limits and outcome rules are approved.
16. **VERIFIED** — Check every `ASSUMED`, `UNVERIFIED`, and `BLOCKED` item in this document before relying on it.

---

## 3. Source-of-Truth Priority

When sources conflict, use this order:

1. **VERIFIED** — Code at the exact Git commit being changed.
2. **VERIFIED** — SQL migrations committed under `supabase/migrations/`.
3. **VERIFIED** — Generated database types in `types/database.types.ts`.
4. **VERIFIED** — Actually verified Supabase and Vercel configuration and behavior.
5. **VERIFIED** — This current handoff, after confirming its commit.
6. **UNVERIFIED** — `PROJECT_CONTEXT.md`; it is currently materially outdated and must not override current code or migrations.
7. **VERIFIED** — Current functional specifications and accepted ADRs.
8. **VERIFIED** — Current-chat decisions and recorded test evidence.
9. **DEPRECATED** — Historical handoffs, old chats, old generated packages, and superseded code snippets.

A planned object is not implemented unless it exists in the current code, migrations, generated types, or verified infrastructure.

---

## 4. Current Project Snapshot

### Technology stack

| Status | Item |
|---|---|
| VERIFIED | Next.js `16.2.9`, App Router |
| VERIFIED | React `19.2.4` and React DOM `19.2.4` |
| VERIFIED | TypeScript `^5` |
| VERIFIED | Tailwind CSS `^4` |
| VERIFIED | `next-intl` `^4.13.0` |
| VERIFIED | `@supabase/ssr` `^0.12.0` |
| VERIFIED | `@supabase/supabase-js` `^2.108.2` |
| VERIFIED | Supabase PostgreSQL, Auth, RLS, and Storage |
| VERIFIED | Vercel production deployment |
| VERIFIED | GitHub source control |

### Implemented modules

| Status | Module | Current state |
|---|---|---|
| IMPLEMENTED | Authentication and profiles | Registration, login, email confirmation callback, session persistence, logout, profile view, profile edit, safe localized errors |
| IMPLEMENTED | Localization | English and Russian locale-prefixed application routes, localized metadata and not-found behavior |
| IMPLEMENTED | Character management | List, create, view, edit, explicit save, clear, delete, loading/empty/retry/unavailable states |
| IMPLEMENTED | VtM V5 sheet | Versioned schema v3, two logical pages, desktop A4-oriented layout, responsive mobile layout |
| IMPLEMENTED | Character portraits | Private Storage, signed URLs, upload, replace, remove, best-effort cleanup |
| IMPLEMENTED | Campaign Foundation | Campaigns, one immutable GM, Player membership, invitations, campaign characters, RLS, lifecycle |
| IMPLEMENTED | Campaign UI | My Campaigns, create, overview, invitations, members, character sharing, edit, complete, delete |
| PLANNED | Personal VtM dice | Next implementation stage; no engine or route exists |
| PLANNED | Shared campaign dice | Requires later migration, server execution, persistence, RLS, and Realtime |
| PLANNED | Video rooms | Requires provider comparison and technical spike |
| PLANNED | Handouts, NPCs, sessions, notes | Later Friend Campaign Alpha work |
| PLANNED | Call of Cthulhu 7e | Registered but unavailable; later milestone |

### Active delivery stage

- **VERIFIED** — Milestone 1, Architecture Baseline, is complete.
- **VERIFIED** — Milestone 2, Character Friend Alpha, is complete.
- **VERIFIED** — Milestone 3, Campaign Foundation, is complete.
- **DECIDED** — Milestone 4, VtM Realtime Tools, is active.
- **PLANNED** — Phase 4A begins with the VtM dice contract and pure evaluator, followed by the personal roller.
- **PLANNED** — Phase 4B adds persisted, server-authoritative campaign rolls and Realtime only after Phase 4A is stable.

### Localization snapshot

- **IMPLEMENTED** — Supported locales: `en`, `ru`.
- **IMPLEMENTED** — Locale prefixes are always present on application routes.
- **IMPLEMENTED** — Technical `/auth/confirm` remains outside `[locale]`.
- **IMPLEMENTED** — Common and VtM-specific dictionaries are separate.
- **PLANNED** — Character-sheet language independent of route locale is not implemented.

### Authentication snapshot

- **IMPLEMENTED** — Supabase Auth and SSR session refresh are used.
- **IMPLEMENTED** — Root proxy composes Supabase cookie refresh with `next-intl`.
- **IMPLEMENTED** — Login can return a user to a campaign invitation.
- **VERIFIED** — Raw authentication errors are mapped to safe localized messages.

### Character management snapshot

- **IMPLEMENTED** — Character ownership remains with `characters.owner_id`.
- **IMPLEMENTED** — Only the owner may update or delete a character.
- **IMPLEMENTED** — `private` means owner-only.
- **IMPLEMENTED** — `campaign` permits read-only campaign access only when all active assignment and membership conditions pass.
- **IMPLEMENTED** — `public` remains owner-only because no public route or RLS policy exists.
- **IMPLEMENTED** — Character summary cards and full sheets support desktop and mobile layouts.

### Database snapshot

- **VERIFIED** — Current public tables: `profiles`, `characters`, `campaigns`, `campaign_members`, `campaign_invitations`, `campaign_characters`.
- **VERIFIED** — Current migrations: five repository-backed migrations listed in Section 9.
- **VERIFIED** — Generated types exist at `types/database.types.ts`.
- **VERIFIED** — No `dice_rolls`, `video_rooms`, `handouts`, `npcs`, `sessions`, or `campaign_notes` table exists.

### Production snapshot

- **VERIFIED** — Production alias: `https://ttrpg-website-xi.vercel.app`.
- **VERIFIED** — Inspected production deployment status: `Ready`.
- **UNVERIFIED** — No complete post-deployment manual smoke-test matrix was repeated after the documentation-only merge; application code was unchanged by PR #14.

---

## 5. Scope of the Completed Chat

### Original objective

- **VERIFIED** — Finish and verify the Campaign Management slice as the last Campaign Foundation feature.
- **VERIFIED** — Merge Campaign Management into `main`.
- **VERIFIED** — Close Milestone 3 and identify the remaining development stages.

### Additional work that appeared

- **IMPLEMENTED** — A documentation synchronization branch was created.
- **IMPLEMENTED** — Architecture, database, security, campaigns, roadmap, site maps, ADR indexes, and handoff documentation were synchronized.
- **DECIDED** — ADR-008 was accepted before VtM dice work.
- **DECIDED** — ADR-009 remained proposed pending a video provider comparison and spike.
- **IMPLEMENTED** — `docs/product/IDEAS_BACKLOG.md` was introduced.
- **IMPLEMENTED** — Four product ideas were captured without making them roadmap commitments.
- **IMPLEMENTED** — `docs/README.md` now indexes the ideas backlog.
- **IMPLEMENTED** — `docs/product/ROADMAP.md` now defines the idea-intake rule.

### Actual end state

- **VERIFIED** — PR #13, Campaign Management, is merged.
- **VERIFIED** — PR #14, documentation synchronization, is merged.
- **VERIFIED** — At the recorded snapshot, `main` was clean and synchronized with `origin/main`.
- **VERIFIED** — H006 was created after that snapshot and later became the sole untracked file pending documentation synchronization.
- **VERIFIED** — Build and TypeScript checks pass at `cb378c1`.
- **VERIFIED** — Production inspection reports `Ready`.
- **DECIDED** — The next feature is the VtM personal dice contract and deterministic evaluator.
- **BLOCKED** — Authoritative dice implementation depends on approving exact VtM interpretation rules and input limits.

---

## 6. Work Completed

| Status | Change | Files | Commit | Verification |
|---|---|---|---|---|
| IMPLEMENTED | Added GM campaign editing, save/reset, unsaved-change protection, duplicate-mutation protection, completion, completed read-only state, deletion, and safe redirects | `app/[locale]/campaigns/[id]/page.tsx`; `app/[locale]/campaigns/[id]/loading.tsx`; `components/campaigns/campaign-management-panel.tsx`; `messages/en.json`; `messages/ru.json` | Feature commit `b4a0dc63820afff983c4207b861c7932a6f05c54`; merged by PR #13 into `a1c3a61` | VERIFIED by build, Git checks, and reported manual GM/Player/Outsider, EN/RU, desktop/mobile scenarios |
| IMPLEMENTED | Synchronized permanent architecture, database, security, campaigns, roadmap, site structure, ADR index, and handoff documentation | 19 documentation files, including new `docs/handoffs/H005_CURRENT_HANDOFF.md` | Amended documentation commit became `238e54469a0eaee7d140c16ace792b4bc914f546` | VERIFIED by documentation-only diff, `git diff --check`, and file-scope checks |
| IMPLEMENTED | Added structured product ideas backlog and idea-intake rule | `docs/product/IDEAS_BACKLOG.md`; `docs/README.md`; `docs/product/ROADMAP.md` | Included in `238e54469a0eaee7d140c16ace792b4bc914f546` | VERIFIED by staged diff: 3 files, 356 insertions, no application/data changes |
| IMPLEMENTED | Merged documentation synchronization | 20 documentation files | PR #14 merge commit `cb378c18fc3f07ad6072f27508918ac53784e1b5` | VERIFIED by `HEAD`, `origin/main`, merge log, clean tree, build, and Vercel inspection |
| DECIDED | Accepted game-system domain boundary before dice implementation | `docs/decisions/ADR-008-game-system-domain-boundaries.md` | Included in PR #14 | VERIFIED in current repository documentation |
| DECIDED | Preserved managed video as proposed, not accepted | `docs/decisions/ADR-009-managed-video-infrastructure.md` | No implementation commit | VERIFIED in current repository documentation |
| IMPLEMENTED | Captured Campaign UX and portrait ideas without promoting them to the roadmap | `docs/product/IDEAS_BACKLOG.md` | Included in PR #14 | VERIFIED in current repository documentation |

No application code, migration, RLS policy, Storage policy, generated database type, or package dependency changed in PR #14.

---

## 7. Relevant File Map

| Path | Purpose | Current State | Notes |
|---|---|---|---|
| `AGENTS.md` | Next.js 16 coding rule | VERIFIED | Must be read before Next.js changes |
| `package.json` | Exact scripts and dependency versions | VERIFIED | Has `dev`, `build`, `start`, `lint`; no test script |
| `docs/handoffs/H006_CURRENT_HANDOFF.md` | Current continuation document | CURRENT | Created after the verified clean snapshot; prepared for addition by the follow-up documentation synchronization |
| `docs/handoffs/H005_CURRENT_HANDOFF.md` | Previous handoff | DEPRECATED as current state | Historical context only |
| `docs/product/DICE_ROLLS.md` | Dice requirements and phase sequence | DECIDED | Primary functional specification for next task |
| `docs/product/ROADMAP.md` | Milestone scope and exclusions | DECIDED | Milestone 4 is active |
| `docs/product/IDEAS_BACKLOG.md` | Unapproved ideas | IMPLEMENTED | Ideas are not roadmap commitments |
| `docs/decisions/ADR-008-game-system-domain-boundaries.md` | Platform/system boundary | DECIDED | Accepted; dice rules belong to VtM domain |
| `docs/decisions/ADR-009-managed-video-infrastructure.md` | Video direction | PLANNED | Proposed only; do not implement provider integration yet |
| `docs/architecture/ARCHITECTURE.md` | Current domains and runtime boundaries | VERIFIED | Use for placement of new dice files |
| `docs/architecture/I18N.md` | Locale routing and dictionary structure | VERIFIED | Needed when personal roller UI is added |
| `docs/architecture/SECURITY.md` | Current authorization and future shared-dice security | VERIFIED | Personal local roller has no persistence; shared phase must reuse campaign authorization |
| `docs/architecture/DATABASE.md` | Current schema and absent future tables | VERIFIED | Confirms no dice table exists |
| `lib/characters/game-systems.ts` | Current game-system registry | IMPLEMENTED | VtM available; CoC registered but unavailable |
| `lib/characters/vtm-v5/schema.ts` | Current VtM sheet types and normalizer | IMPLEMENTED | Read-only Hunger default may later assist the personal roller |
| `app/[locale]/games/vampire-the-masquerade/page.tsx` | Current VtM landing route | IMPLEMENTED | Parent route for proposed dice tool |
| `messages/en.json` | Common English UI strings | IMPLEMENTED | Add common dice navigation strings only if appropriate |
| `messages/ru.json` | Common Russian UI strings | IMPLEMENTED | Must remain structurally aligned with English |
| `messages/en/vtm-v5.json` | English VtM terminology | IMPLEMENTED | Preferred home for VtM dice terminology |
| `messages/ru/vtm-v5.json` | Russian VtM terminology | IMPLEMENTED | Long Russian labels require mobile verification |
| `i18n/request.ts` | Merges common and VtM dictionaries | IMPLEMENTED | Do not bypass current loading strategy |
| `i18n/routing.ts` | Locales and prefix/cookie behavior | IMPLEMENTED | Do not manually concatenate locale prefixes |
| `proxy.ts` | Supabase + `next-intl` proxy composition | IMPLEMENTED | Do not copy all Supabase headers over localization response |
| `supabase/migrations/*.sql` | Authoritative database history | VERIFIED | No change needed for the first personal dice slice |
| `types/database.types.ts` | Generated database types | VERIFIED | No change needed for the first personal dice slice |

---

## 8. Current Data Contracts

### 8.1 Confirmed database columns

All rows below are **VERIFIED** from migrations and generated types.

#### `public.profiles`

```text
id
username
display_name
bio
avatar_url
created_at
```

#### `public.characters`

```text
id
owner_id
name
game_system
description
portrait_url
visibility
sheet_data
created_at
updated_at
```

#### `public.campaigns`

```text
id
game_master_id
game_system
name
description
status
created_at
updated_at
```

#### `public.campaign_members`

```text
campaign_id
user_id
joined_at
```

#### `public.campaign_invitations`

```text
id
campaign_id
created_by
token_hash
expires_at
accepted_at
accepted_by
revoked_at
created_at
```

#### `public.campaign_characters`

```text
id
campaign_id
character_id
linked_by
linked_at
unlinked_at
```

### 8.2 Current TypeScript types

- **VERIFIED** — `types/database.types.ts` exports `Json`, `Database`, `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `CompositeTypes`, and `Constants`.
- **VERIFIED** — Generated public tables match the six tables above.
- **VERIFIED** — Generated callable functions include:
  - `accept_campaign_invitation`
  - `create_campaign_invitation`
  - `current_user_can_access_campaign`
  - `current_user_can_view_campaign_character`
  - `current_user_can_view_campaign_portrait`
  - `current_user_is_campaign_game_master`
  - `current_user_is_campaign_player`
  - `revoke_campaign_invitation`
- **VERIFIED** — `GameSystemId` is currently `"vtm-v5" | "call-of-cthulhu-7e"`.
- **VERIFIED** — No VtM dice request/result TypeScript type exists yet.
- **VERIFIED** — No generated type for a `dice_rolls` table exists.

### 8.3 Current VtM JSON/JSONB format

- **VERIFIED** — `characters.sheet_data` is JSONB.
- **VERIFIED** — Current VtM schema version is `3`.
- **VERIFIED** — Current top-level `VtmV5SheetData` fields are:

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

- **VERIFIED** — `identity` contains:

```text
clan
concept
predatorType
sire
generation
sect
ambition
desire
chronicle
```

- **VERIFIED** — `trackers` contains:

```text
resonance
hunger
humanity
stains
bloodPotency
health
willpower
```

- **VERIFIED** — `health` and `willpower` each contain:

```text
superficial
aggravated
bonus
```

- **VERIFIED** — `bloodPotencyDetails` contains:

```text
bloodSurge
mendAmount
powerBonus
rouseReRoll
feedingPenalty
baneSeverity
```

### 8.4 Current `schemaVersion`

- **VERIFIED** — `VTM_V5_SCHEMA_VERSION = 3`.
- **DEPRECATED** — Do not lower it or overwrite records with the old minimal registry default without passing through the normalizer.
- **BLOCKED** — Any version increment requires a reviewed data-contract change, backward migration behavior, and existing-record verification.

### 8.5 Backward compatibility rules

- **VERIFIED** — Persisted VtM data must pass through `normalizeVtmV5SheetData`.
- **VERIFIED** — The normalizer always returns schema version 3.
- **VERIFIED** — Legacy top-level `clan`, `hunger`, and `resonance` values are read as fallbacks.
- **VERIFIED** — Unknown top-level values are preserved under `extensions`.
- **VERIFIED** — Ratings and trackers are converted to bounded integers.
- **VERIFIED** — Invalid or missing collections normalize to safe defaults.
- **VERIFIED** — Image bytes and Base64 are not stored in `sheet_data`.

### 8.6 Target dice model

#### Personal dice

- **PLANNED** — Candidate request fields:

```text
pool
hungerDice
difficulty?
label?
```

- **PLANNED** — Candidate deterministic result fields:

```text
gameSystem
pool
hungerDice
difficulty
normalDice[]
hungerDiceResults[]
successes
criticalPairCount
isCritical
isMessyCritical
isBestialFailure
isTotalFailure
meetsDifficulty
margin
summaryKey
detailFlags
```

- **BLOCKED** — Exact field names, limits, and VtM interpretation rules require approval before they become authoritative.
- **DECIDED** — Random generation and deterministic interpretation must be separate.
- **DECIDED** — The first personal slice stores no result in the database.

#### Shared campaign dice

- **PLANNED** — `docs/product/DICE_ROLLS.md` records a candidate persisted record, but no table exists.
- **PLANNED** — Candidate fields are `id`, `campaign_id`, `session_id`, `user_id`, `character_id`, `game_system`, `visibility`, `label`, `request_data`, `result_data`, and `created_at`.
- **UNVERIFIED** — Those candidate fields are not approved database columns and must not be treated as current schema.
- **PLANNED** — Shared dice will require a new migration, regenerated types, RLS, server-authoritative execution, immutable history rules, and campaign-scoped Realtime.

### 8.7 Required migrations

- **VERIFIED** — No migration is required for the personal, non-persisted dice contract/evaluator.
- **BLOCKED** — Do not create a `dice_rolls` migration until the personal contract, shared visibility model, actor/character rules, and RLS matrix are reviewed.
- **DECIDED** — Every later database change must be a new migration; applied migrations are immutable.

---

## 9. Database, RLS and Storage State

### 9.1 Applied migrations

The repository and prior linked-environment verification record these migrations as applied:

```text
supabase/migrations/20260630143000_initial_schema.sql
supabase/migrations/20260702150000_character_portraits.sql
supabase/migrations/20260709150000_campaign_foundation.sql
supabase/migrations/20260709163000_fix_campaign_select_policy.sql
supabase/migrations/20260709170000_fix_campaign_character_trigger_security.sql
```

- **VERIFIED** — These files exist in the exact repository snapshot.
- **VERIFIED** — Prior Campaign Foundation work recorded local/remote migration synchronization.
- **UNVERIFIED** — Migration synchronization was not re-run in the final closing command set.
- **DEPRECATED** — Never edit these applied migration files.

### 9.2 Tables, constraints, and indexes

#### `profiles`

- **VERIFIED** — Primary key: `id`.
- **VERIFIED** — `id` references `auth.users(id)` with cascade delete.
- **VERIFIED** — `username` is unique.
- **VERIFIED** — New Auth users receive a profile through `handle_new_user`.

#### `characters`

- **VERIFIED** — Primary key: `id`.
- **VERIFIED** — `owner_id` references `auth.users(id)` with cascade delete.
- **VERIFIED** — `visibility` check permits only `private`, `campaign`, `public`.
- **VERIFIED** — `sheet_data` is non-null JSONB with default `{}`.

#### `campaigns`

- **VERIFIED** — Primary key: `id`.
- **VERIFIED** — `game_master_id` references `auth.users(id)` with cascade delete.
- **VERIFIED** — Trimmed name length is 1–120.
- **VERIFIED** — Trimmed game-system length is 1–100.
- **VERIFIED** — Description length is at most 4,000.
- **VERIFIED** — Status is `active` or `completed`.
- **VERIFIED** — Index: `campaigns_game_master_id_idx`.

#### `campaign_members`

- **VERIFIED** — Composite primary key: `(campaign_id, user_id)`.
- **VERIFIED** — Campaign and user foreign keys cascade on delete.
- **VERIFIED** — Index: `campaign_members_user_id_idx`.
- **VERIFIED** — Trigger prevents the GM from also being a Player row.

#### `campaign_invitations`

- **VERIFIED** — Primary key: `id`.
- **VERIFIED** — `token_hash` is unique.
- **VERIFIED** — Campaign and creator foreign keys cascade on delete.
- **VERIFIED** — `accepted_by` uses `ON DELETE SET NULL`.
- **VERIFIED** — Expiry must be after creation.
- **VERIFIED** — `accepted_by` requires `accepted_at`.
- **VERIFIED** — An invitation cannot be both accepted and revoked.
- **VERIFIED** — Indexes: campaign ID and partial open-invitation index.

#### `campaign_characters`

- **VERIFIED** — Primary key: `id`.
- **VERIFIED** — Campaign, character, and `linked_by` foreign keys cascade on delete.
- **VERIFIED** — `unlinked_at` cannot precede `linked_at`.
- **VERIFIED** — Indexes: campaign ID and character ID.
- **VERIFIED** — Partial unique index allows one active campaign assignment per character.

### 9.3 RLS state and confirmed policies

- **VERIFIED** — RLS is enabled on all six public tables.

#### Profiles

- **VERIFIED** — Authenticated users can read profiles.
- **VERIFIED** — Users can update only their own profile.

#### Characters

- **VERIFIED** — Owners can insert their own characters.
- **VERIFIED** — Owners can read, update, and delete their own characters.
- **VERIFIED** — Campaign participants can additionally read eligible shared characters.
- **VERIFIED** — Campaign-derived access does not grant update or delete.
- **VERIFIED** — No anonymous/public read policy exists.

#### Campaigns

- **VERIFIED** — Participants can select campaigns.
- **VERIFIED** — Authenticated users can insert only with themselves as GM and status `active`.
- **VERIFIED** — Only the GM can update an active campaign.
- **VERIFIED** — Only the GM can delete a campaign.
- **VERIFIED** — Corrective migration allows the creating GM to receive `INSERT ... RETURNING`.

#### Campaign members

- **VERIFIED** — Participants can read Player memberships.
- **VERIFIED** — GM can remove a Player.
- **VERIFIED** — Player can remove only their own membership.
- **VERIFIED** — Direct client insertion is denied.

#### Campaign invitations

- **VERIFIED** — GM can read invitation metadata.
- **VERIFIED** — Direct token-hash read is not granted.
- **VERIFIED** — Creation, acceptance, and revocation occur through reviewed security-definer functions.
- **VERIFIED** — Raw token is returned only at creation.

#### Campaign characters

- **VERIFIED** — Participants can read assignment rows permitted by policy.
- **VERIFIED** — An active participant can link only their own eligible character.
- **VERIFIED** — Owner or GM can unlink.
- **VERIFIED** — Closed assignments cannot be reopened by ordinary clients.
- **VERIFIED** — The integrity trigger is `SECURITY DEFINER` with an empty search path and explicit checks.

### 9.4 Confirmed campaign functions

- **VERIFIED** — Authorization helpers:
  - `current_user_is_campaign_game_master(uuid)`
  - `current_user_is_campaign_player(uuid)`
  - `current_user_can_access_campaign(uuid)`
  - `current_user_can_view_campaign_character(uuid)`
  - `current_user_can_view_campaign_portrait(text)`
- **VERIFIED** — Invitation RPCs:
  - `create_campaign_invitation(uuid)`
  - `accept_campaign_invitation(text)`
  - `revoke_campaign_invitation(uuid)`
- **VERIFIED** — Additional trigger functions enforce campaign update, membership, invitation, assignment, completion, removal, and character-eligibility rules.

### 9.5 Storage

#### Bucket

```text
character-portraits
```

| Property | Status | Value |
|---|---|---|
| Public | VERIFIED | `false` |
| Maximum object size | VERIFIED | `5,242,880` bytes |
| Allowed MIME types | VERIFIED | `image/jpeg`, `image/png`, `image/webp` |
| Signed URL lifetime | VERIFIED | `3600` seconds |

#### Path convention

```text
USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME
```

- **VERIFIED** — Owner-folder policies permit owner SELECT, INSERT, UPDATE, and DELETE.
- **VERIFIED** — Campaign participants receive additional SELECT only through validated owner/character path and campaign authorization.
- **VERIFIED** — Upload, replacement, and deletion remain owner-only.
- **VERIFIED** — `http://` and `https://` portrait values are treated as legacy external URLs; other values are treated as Storage paths.
- **VERIFIED** — Cleanup is best-effort and may leave orphan objects.
- **PLANNED** — No scheduled orphan cleanup exists.

### 9.6 Generated database types

- **VERIFIED** — File: `types/database.types.ts`.
- **VERIFIED** — It represents the six public tables and eight callable public functions listed above.
- **DEPRECATED** — Do not edit generated types manually.
- **VERIFIED** — No dice persistence type exists.

### 9.7 Dashboard-only configuration

- **UNVERIFIED** — No authoritative export of Supabase Dashboard Auth settings was provided.
- **UNVERIFIED** — No authoritative export of Vercel project settings or environment values was provided.
- **VERIFIED** — Only the public environment variable names are documented:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **DEPRECATED** — Do not infer values or include `.env.local` contents in chat, documentation, or commits.

---

## 10. Confirmed Architectural Decisions

| Decision | Status | Reason | Related files or ADR |
|---|---|---|---|
| Use system-specific versioned JSONB for character sheets | DECIDED | Common columns stay relational while game-specific sheets can evolve independently | `ADR-001`; `lib/characters/vtm-v5/schema.ts`; `characters.sheet_data` |
| Store portraits in private Supabase Storage, not JSONB | DECIDED | Avoid Base64/database bloat and preserve private access | `ADR-002`; portrait migration; `lib/characters/portrait.ts` |
| Keep sheet language concept independent from route locale | PLANNED | A character may later preserve its own language | `ADR-003`; `docs/architecture/I18N.md` |
| Use A4-oriented desktop rendering with responsive mobile flow | DECIDED | Preserve sheet identity without fixed-page mobile breakage | `ADR-004`; VtM sheet components |
| Use explicit locale-prefixed application routes | DECIDED | Stable localized URLs and metadata | `ADR-005`; `i18n/routing.ts` |
| Compose Supabase refresh and `next-intl` by copying cookies only | DECIDED | Copying all headers previously broke locale resolution and caused duplicate prefixes | `ADR-006`; `proxy.ts` |
| Implement Campaign Foundation before shared dice/video | DECIDED | Shared tools need one authoritative membership boundary | `ADR-007`; campaign migrations and UI |
| Exactly one immutable GM; membership table contains Players only | DECIDED | Avoid duplicated authority and premature role complexity | `ADR-007`; `campaigns.game_master_id`; `campaign_members` |
| Keep platform responsibilities separate from game-system rules | DECIDED | Prevent VtM leakage while avoiding a speculative universal engine | `ADR-008` |
| VtM owns dice interpretation; platform owns persistence/auth/realtime boundaries | DECIDED | Same evaluator can serve local and later server-authoritative paths | `ADR-008`; `DICE_ROLLS.md` |
| Separate random generation from deterministic dice evaluation | DECIDED | Fixed inputs must produce repeatable test results | `DICE_ROLLS.md`; H005/H006 |
| Keep first personal roller non-persisted | DECIDED | Prove rules and UX before schema and Realtime complexity | `DICE_ROLLS.md`; `ROADMAP.md` |
| Use managed video infrastructure only after comparison and spike | PLANNED | Avoid operating a full WebRTC stack and avoid premature provider lock-in | `ADR-009`; `VIDEO_ROOMS.md` |
| Capture new ideas in a backlog before roadmap acceptance | DECIDED | Prevent unreviewed ideas from becoming accidental commitments | `IDEAS_BACKLOG.md`; `ROADMAP.md` |

Accepted ADRs must not be silently rewritten. A materially incompatible decision requires a superseding ADR.

---

## 11. Functional Requirements Preserved

### Current functionality

- **IMPLEMENTED** — Authentication, profile, character, campaign, invitation, membership, character sharing, and campaign lifecycle flows must remain functional.
- **IMPLEMENTED** — Existing character and campaign data must remain readable.
- **IMPLEMENTED** — Character owner remains the only editor/deleter.
- **IMPLEMENTED** — Campaign participants receive read-only access to eligible campaign characters.
- **IMPLEMENTED** — Completed campaigns remain read-only and cannot be reactivated.
- **IMPLEMENTED** — Campaign deletion preserves Player-owned characters.

### UX

- **VERIFIED** — Mutation buttons must prevent duplicate submission.
- **VERIFIED** — Destructive and lifecycle actions require confirmation.
- **VERIFIED** — Unsaved character and campaign detail changes require protection.
- **VERIFIED** — Loading, empty, retry, unavailable, success, and safe error states must be explicit.
- **VERIFIED** — Desktop and mobile layouts must be tested.
- **VERIFIED** — Long Russian labels must not break mobile layouts.

### Localization

- **IMPLEMENTED** — All application UI must support English and Russian.
- **IMPLEMENTED** — Application routes remain locale-prefixed.
- **IMPLEMENTED** — VtM terminology belongs in system-specific dictionaries where appropriate.
- **PLANNED** — Personal dice result text must have EN/RU keys.
- **DEPRECATED** — Do not manually build `/en` or `/ru` paths.
- **PLANNED** — Independent sheet language remains separate future work.

### Security

- **VERIFIED** — Raw backend error messages must never be shown.
- **VERIFIED** — RLS/server/database/Storage boundaries must enforce access.
- **VERIFIED** — Tokens, hashes, private paths, and secrets must not be exposed.
- **DECIDED** — Shared dice must reuse existing campaign authorization.
- **DECIDED** — Shared dice actor identity must be derived server-side.
- **DECIDED** — Shared persisted results must not be client-authored or ordinarily rewritable.
- **PLANNED** — Removed Players and Outsiders must be denied shared dice history and video tokens.

### Personal VtM dice requirements

- **PLANNED** — Ordinary and Hunger dice.
- **PLANNED** — Optional Difficulty.
- **PLANNED** — Individual die results.
- **PLANNED** — Successes, criticals, messy criticals, bestial failures, and total failures.
- **PLANNED** — Repeat roll.
- **PLANNED** — Optional label.
- **PLANNED** — Mobile controls.
- **PLANNED** — EN/RU readable result.
- **DECIDED** — Pure deterministic evaluator with fixed supplied dice.
- **DECIDED** — Random generation is a separate layer.
- **DECIDED** — No database row, campaign requirement, or Realtime subscription in the first personal slice.
- **BLOCKED** — Exact rule interpretation and validation limits require approval.

### Future shared dice requirements

- **PLANNED** — Active campaign participant authorization.
- **PLANNED** — Server-authoritative random generation and interpretation.
- **PLANNED** — Structured request/result persistence.
- **PLANNED** — Optional character association only after access verification.
- **PLANNED** — Immutable ordinary history.
- **PLANNED** — Campaign-scoped Realtime.
- **PLANNED** — Multi-user GM/Player/removed-Player/Outsider tests.

### Product ideas captured but not accepted into the roadmap

- **DECIDED** — `IDEA-001`, Inbox: campaign view mode by default; GM activates editing with an **Edit** button.
- **DECIDED** — `IDEA-002`, Inbox: move invitations below players and characters.
- **DECIDED** — `IDEA-003`, Inbox: combine members and characters in one row/card structure.
- **DECIDED** — `IDEA-004`, Deferred: interactive portrait crop, reposition, zoom, resizing, and preview.
- **UNVERIFIED** — None of these four ideas is approved implementation scope merely because it is captured.

---

## 12. User Requirements and Working Preferences

- **VERIFIED** — The user works in Windows CMD.
- **VERIFIED** — Instructions should be sequential, small, and verified after each step.
- **VERIFIED** — Do not skip directly to later steps before the user reports the current command results.
- **VERIFIED** — For substantial edits, the user prefers complete ready-to-extract files or ZIP packages over fragile patch scripts.
- **VERIFIED** — Before replacing a file, inspect the exact current version.
- **VERIFIED** — All code, comments, commit messages, and text inside code blocks must be in English.
- **VERIFIED** — Explanations may be in the language used by the user.
- **VERIFIED** — Do not show raw backend errors to users.
- **VERIFIED** — Build the functional foundation before detailed decorative design.
- **VERIFIED** — Preserve existing user data and backward compatibility.
- **VERIFIED** — Never edit an applied migration.
- **VERIFIED** — Use a new migration for every database/RLS/Storage change.
- **VERIFIED** — Regenerate and review database types after schema changes.
- **VERIFIED** — Use small branches, PRs, merge verification, production verification, and branch cleanup.
- **VERIFIED** — Do not claim completion without command output or explicit user testing.
- **VERIFIED** — Do not expose secrets, `.env` values, tokens, passwords, or service-role keys.
- **VERIFIED** — Keep answers practical and avoid unnecessary verbosity during command-by-command work.

---

## 13. Localization State

### Locales and routing

| Item | Status | Current state |
|---|---|---|
| Supported locales | IMPLEMENTED | `en`, `ru` |
| Default locale | IMPLEMENTED | `en` |
| Locale prefix | IMPLEMENTED | Always present for application routes |
| Technical callback | IMPLEMENTED | `/auth/confirm` outside locale routes |
| Locale persistence | IMPLEMENTED | Locale cookie retained for one year |
| Navigation | IMPLEMENTED | Uses i18n navigation helpers |
| Proxy composition | IMPLEMENTED | Supabase refresh first, `next-intl` routing, Supabase cookies copied into intl response |

### Dictionary structure

- **IMPLEMENTED** — Common dictionaries:
  - `messages/en.json`
  - `messages/ru.json`
- **IMPLEMENTED** — VtM-specific dictionaries:
  - `messages/en/vtm-v5.json`
  - `messages/ru/vtm-v5.json`
- **IMPLEMENTED** — `i18n/request.ts` merges common and VtM-specific dictionaries.
- **IMPLEMENTED** — Current common namespaces include account, navigation, home, dashboard, login, register, profiles, characters, campaigns, metadata, errors, and campaign subflows.
- **IMPLEMENTED** — VtM sheet terminology is stored in the per-system dictionary.
- **PLANNED** — Dice terminology should be added to the VtM dictionary or a reviewed VtM dice namespace without duplicating common platform text.

### Metadata

- **IMPLEMENTED** — Locale-aware metadata is generated in the localized layout.
- **IMPLEMENTED** — `PageMetadata` includes current implemented route families.
- **PLANNED** — A personal dice route will require localized metadata.

### Route locale versus sheet language

- **IMPLEMENTED** — Current sheet labels follow the route locale.
- **PLANNED** — Independent sheet language is not implemented.
- **UNVERIFIED** — No database field, selector, or persistence contract exists for independent sheet language.

### Extracted and non-extracted dictionaries

- **IMPLEMENTED** — VtM-specific sheet terminology has been extracted to per-system dictionaries.
- **PLANNED** — Long-form Game Hub content should use Markdown/MDX or another reviewed content model, not large translation JSON blocks.
- **UNVERIFIED** — No complete audit was performed in this closing chat to identify every common string that could later move into a system dictionary.

### Missing translations and key checks

- **VERIFIED** — The production build passed with current dictionaries.
- **UNVERIFIED** — A dedicated nested EN/RU key-parity script is not part of CI.
- **UNVERIFIED** — No explicit key-parity command was run in this closing verification.
- **PLANNED** — Every dice UI addition must compare English and Russian key structure and manually test long Russian text on mobile.

---

## 14. Verification Evidence

### Commands executed at final HEAD

```text
git switch main
git fetch origin --prune
git remote get-url origin
git branch --show-current
git status
git status --short --untracked-files=all
git rev-parse HEAD
git rev-parse origin/main
git rev-list --left-right --count HEAD...origin/main
git log -1 --stat --oneline
git diff --check
npm run build
npx vercel inspect https://ttrpg-website-xi.vercel.app
```

### Build and static checks

| Check | Status | Evidence |
|---|---|---|
| Production build | VERIFIED | Compiled successfully in 8.4 seconds |
| TypeScript | VERIFIED | Finished successfully in 6.7 seconds |
| Page-data collection | VERIFIED | Completed |
| Static generation | VERIFIED | 30/30 pages generated |
| Diff whitespace check | VERIFIED | `git diff --check` returned no output |
| Working tree | VERIFIED | Clean at the recorded `cb378c1` snapshot |
| Untracked files | VERIFIED | None at the recorded `cb378c1` snapshot |
| Lint | UNVERIFIED | Not run in final command set |
| Automated unit tests | UNVERIFIED | No test script currently exists |
| EN/RU key parity | UNVERIFIED | No dedicated parity check run |

After the recorded verification, H006 was created and later observed as the sole untracked file pending documentation synchronization.

### Build-generated route list

The successful build included:

```text
/[locale]
/[locale]/[...rest]
/[locale]/account
/[locale]/campaigns
/[locale]/campaigns/[id]
/[locale]/campaigns/[id]/characters/[characterId]
/[locale]/campaigns/join/[token]
/[locale]/campaigns/new
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

- **VERIFIED** — No dice route exists in the build output.

### Recorded manual scenarios from this chat

- **VERIFIED** — Campaign detail edit and reset.
- **VERIFIED** — Unsaved-change warning.
- **VERIFIED** — Duplicate mutation protection.
- **VERIFIED** — Campaign completion.
- **VERIFIED** — Completed campaign read-only state.
- **VERIFIED** — Campaign deletion and redirects.
- **VERIFIED** — GM, Player, and Outsider permissions.
- **VERIFIED** — English and Russian variants.
- **VERIFIED** — Mobile layout.
- **VERIFIED** — Campaign Foundation GM/Player/Outsider SQL transaction test had previously passed and rolled back.
- **VERIFIED** — Character Friend Alpha flows had previously passed production smoke testing before this documentation-only merge.
- **UNVERIFIED** — These manual application scenarios were not all repeated after PR #14; PR #14 changed documentation only.

### Production evidence

- **VERIFIED** — Vercel target: production.
- **VERIFIED** — Status: Ready.
- **VERIFIED** — Alias: `https://ttrpg-website-xi.vercel.app`.
- **VERIFIED** — Deployment URL: `https://ttrpg-website-b8ste44pr-andrey-yudin.vercel.app`.
- **UNVERIFIED** — The inspect output did not display the Git commit SHA.
- **UNVERIFIED** — No fresh browser smoke-test output was provided after this final deployment inspection.

---

## 15. Git State

| Field | Status | Value |
|---|---|---|
| Branch | VERIFIED | `main` |
| HEAD | VERIFIED | `cb378c18fc3f07ad6072f27508918ac53784e1b5` |
| Remote | VERIFIED | `origin/main` = same SHA |
| Ahead / behind | VERIFIED | `0 / 0` |
| Working tree | VERIFIED | Clean at the recorded `cb378c1` snapshot |
| Changed files | VERIFIED | None |
| Untracked files | VERIFIED | None at the recorded `cb378c1` snapshot |
| Later handoff file state | VERIFIED | H006 was created after the verified snapshot and became the sole untracked file |
| Last commit | VERIFIED | `cb378c1 Merge pull request #14 from Andrey-0101/docs/project-status-after-campaign-foundation` |
| Push | VERIFIED | Remote `main` contains the merge commit |
| PR #13 | VERIFIED | Merged Campaign Management |
| PR #14 | VERIFIED | Merged documentation synchronization |
| Production deployment | VERIFIED | Created and Ready |
| Deployment exact SHA | UNVERIFIED | Not shown by `vercel inspect` output |
| Local documentation branch | VERIFIED | Deleted / absent |
| Remote documentation branch | UNVERIFIED | Not checked with final `git ls-remote` |

The current commit changed only documentation relative to the prior application commit. The application code at `cb378c1` is the same application code that was merged by PR #13 at `a1c3a61`.

---

## 16. Known Problems and Risks

| Severity | Problem | Impact | Mitigation | Status |
|---|---|---|---|---|
| High | Exact VtM V5 dice interpretation and validation limits are not yet approved | A coded evaluator could produce rules-inaccurate outcomes | Review request/result contract and fixed examples before treating code as authoritative | BLOCKED |
| High | Shared dice schema and RLS do not exist | Premature persistence would invent unauthorized infrastructure | Keep first slice local/non-persisted; design migration only after personal engine approval | PLANNED |
| Medium | `PROJECT_CONTEXT.md` still describes Architecture Baseline and says campaigns are not implemented | A new chat may follow obsolete architecture and database claims | Update it or explicitly treat it as stale behind H006/current code | VERIFIED |
| Medium | Permanent synchronized docs name `a1c3a61` as the code snapshot while repository HEAD is documentation merge `cb378c1` | Readers may confuse code baseline and current merge commit | State that PR #14 is documentation-only; update snapshot references when H006 is committed | VERIFIED |
| Medium | No automated test runner/script exists | Pure dice evaluator cannot yet use an established project test command | Review whether to add a minimal test dependency/config or use a narrowly scoped verification approach | BLOCKED |
| Medium | No dedicated EN/RU nested-key parity check exists | Missing translations may escape build-time detection | Compare key structures manually now; add a parity tool later | PLANNED |
| Medium | Combined Touchstones and Convictions editor writes edited lines to `touchstones` and clears `convictions` | Existing semantic separation may be lost on edit | Preserve as known limitation; address only in a reviewed character-sheet change | IMPLEMENTED limitation |
| Medium | Portrait cleanup is best-effort | Orphan Storage objects may remain | Keep cleanup attempts; plan later orphan cleanup | IMPLEMENTED limitation |
| Low | Selected unsaved portrait `File` is not stored in session draft | Reload/navigation loses the selected file | Current UI warns users; future portrait workflow may improve this | IMPLEMENTED limitation |
| Low | Product ideas may be mistaken for accepted scope | Unplanned work could disrupt milestone order | Enforce backlog review rule before roadmap placement | DECIDED |
| Low | Vercel inspect output did not show Git SHA | Exact deployment/commit mapping is not independently proven | Inspect deployment metadata in Vercel/GitHub checks if exact mapping becomes important | UNVERIFIED |
| Low | Old local feature branches remain | Branch list is cluttered and may confuse later work | Audit merge status before deletion; do not delete without verification | UNVERIFIED |

---

## 17. Superseded Approaches

- **DEPRECATED** — Showing `error.message` or raw backend errors to users.
- **DEPRECATED** — Storing image bytes or Base64 in `characters.sheet_data`.
- **DEPRECATED** — Editing an applied SQL migration to fix a later problem.
- **DEPRECATED** — Manually editing `types/database.types.ts`.
- **DEPRECATED** — Treating a discussed candidate column or table as implemented.
- **DEPRECATED** — Assuming `visibility = public` grants anonymous access.
- **DEPRECATED** — Assuming `visibility = campaign` alone grants shared access.
- **DEPRECATED** — Granting Game Masters edit permission to Player-owned characters.
- **DEPRECATED** — Storing the Game Master as a row in `campaign_members`.
- **DEPRECATED** — Supporting multiple Game Masters or GM transfer without a superseding ADR.
- **DEPRECATED** — Allowing direct client insertion into `campaign_members`.
- **DEPRECATED** — Persisting raw invitation tokens.
- **DEPRECATED** — Creating an independent invitation or membership model for dice/video.
- **DEPRECATED** — Copying all Supabase middleware headers onto the `next-intl` response.
- **DEPRECATED** — Manually concatenating `/en` or `/ru` route prefixes.
- **DEPRECATED** — Hard-coding VtM-specific fields into generic campaign columns.
- **DEPRECATED** — Building a universal TTRPG expression engine before a real second-system requirement.
- **DEPRECATED** — Adding campaign dice persistence before the personal VtM evaluator is approved.
- **DEPRECATED** — Treating `H001`–`H005`, old ZIP packages, or chat snippets as more authoritative than current commit files.

---

## 18. Open Questions

| Question | Blocking | Current options | Recommended decision point |
|---|---|---|---|
| What exact pool minimum and maximum should the personal VtM roller accept? | Yes | Fixed UI range; evaluator accepts a wider test range; zero-die tests only | Before defining request validation |
| What exact Hunger range should be accepted? | Yes | `0–5`; or derived from current sheet limits | Before defining request validation |
| Must `hungerDice <= pool` always be enforced? | Yes | Reject invalid input; clamp in UI; keep evaluator strict | Contract review before code |
| Is Difficulty optional and what bounds apply? | Yes | Omitted/null; bounded positive integer | Contract review before code |
| Are zero-die pools allowed? | Yes | Disallow in UI; optionally support evaluator edge tests | Contract review before code |
| What label length and trimming rules apply? | Yes | Short bounded label; no label in first evaluator sub-slice | Before UI implementation |
| What exact VtM rule determines total failure, bestial failure, ordinary critical, and messy critical? | Yes | Approve fixed official-rule examples before implementation | First task in next chat |
| How are multiple tens paired and counted? | Yes | Pair all tens; distinguish whether any paired ten is Hunger | First evaluator test matrix |
| Is a Hunger die result of 1 significant only when the test fails? | Yes | Follow approved VtM interpretation | First evaluator test matrix |
| What should `margin` be when Difficulty is omitted? | Yes | `null`; omit field; or separate result state | Contract review |
| Should the personal dice route require authentication? | No for evaluator; yes for UI planning | Public game tool; authenticated-only; mixed | Before personal UI route |
| What exact module path should own the dice engine? | Yes for code placement | New `lib/game-systems/vtm-v5/dice`; current VtM folder; another reviewed domain path | After inspecting architecture and existing aliases |
| What test framework should be used? | Yes for automated fixed-case verification | Add Vitest; Node built-in test with TS strategy; temporary verification script | Before committing evaluator |
| Should character-assisted defaults be in the first UI slice? | No | Hunger only; Attribute + Skill later; no character integration initially | After pure evaluator passes |
| Should request/result types be reusable unchanged for server persistence? | Yes | Design stable serializable types now; keep transport wrapper separate | Contract review |
| When should the four backlog ideas be reviewed? | No | Milestone 5 UX review; Milestone 6 portrait review | During milestone planning, not during dice work |

---

## 19. Exact Next Task

### Task

**Implement the first Milestone 4A sub-slice: a typed VtM V5 personal dice request/result contract and a pure deterministic evaluator verified with fixed die arrays.**

### Goal

Produce a reusable VtM-specific rules module that interprets supplied ordinary and Hunger d10 results without generating random numbers, touching the database, or rendering UI.

### Required inputs

- Exact repository commit `cb378c18fc3f07ad6072f27508918ac53784e1b5`.
- `docs/product/DICE_ROLLS.md`.
- `docs/decisions/ADR-008-game-system-domain-boundaries.md`.
- `docs/product/ROADMAP.md`.
- `docs/architecture/ARCHITECTURE.md`.
- `package.json`.
- Existing VtM type and folder conventions under `lib/characters/vtm-v5/`.
- Approved VtM interpretation examples and validation limits.

### Files to inspect first

```text
AGENTS.md
package.json
docs/handoffs/H006_CURRENT_HANDOFF.md
docs/product/DICE_ROLLS.md
docs/product/ROADMAP.md
docs/decisions/ADR-008-game-system-domain-boundaries.md
docs/architecture/ARCHITECTURE.md
lib/characters/game-systems.ts
lib/characters/vtm-v5/schema.ts
```

### Dependencies

- **BLOCKED** — Approve the interpretation rules and edge-case matrix.
- **BLOCKED** — Choose a minimal test/verification approach because no test script currently exists.
- **VERIFIED** — No database migration is required.
- **VERIFIED** — No generated database type change is required.
- **VERIFIED** — No campaign authorization work is required for this sub-slice.

### Completion criteria

1. **IMPLEMENTED** — Typed, serializable request/result contract exists.
2. **IMPLEMENTED** — Input validation rules are explicit and tested.
3. **IMPLEMENTED** — Evaluator accepts fixed ordinary and Hunger die arrays.
4. **IMPLEMENTED** — Evaluator does not call random generation.
5. **VERIFIED** — Fixed cases cover ordinary success, below-Difficulty failure, total failure, ordinary critical, messy critical, bestial failure, exact Difficulty, margins, multiple tens, Hunger 1 behavior, and invalid input.
6. **VERIFIED** — Build passes.
7. **VERIFIED** — TypeScript passes.
8. **VERIFIED** — `git diff --check` passes.
9. **VERIFIED** — No migration, generated database type, campaign code, or persistence file changes.
10. **DECIDED** — Result contract is suitable for reuse by later client random generation and server-authoritative campaign execution.

### Explicitly out of scope

- Personal dice UI and route.
- Random number generation.
- Character Attribute/Skill selection.
- Campaign association.
- Database persistence.
- `dice_rolls` migration.
- Realtime feed.
- Video integration.
- 3D dice, physics, sound, macros, formulas, or Discipline automation.

---

## 20. Resume Procedure

1. Run the repository verification commands in Section 21.
2. Stop if `HEAD`, `origin/main`, working tree, or migration state differs from this handoff.
3. Read `AGENTS.md`.
4. Read this H006 handoff, `DICE_ROLLS.md`, `ROADMAP.md`, and ADR-008.
5. Inspect the current VtM folder structure and `package.json`.
6. Confirm that no dice implementation already appeared in a newer commit.
7. Present the unresolved dice rules and limits to the user as a compact approval matrix.
8. Decide the exact module path and test approach.
9. Create a new feature branch only after the contract is approved.
10. Implement the pure evaluator and fixed-input verification cases.
11. Run the selected tests, `npm run build`, and `git diff --check`.
12. Confirm that no database, migration, generated type, campaign, or unrelated UI files changed.
13. Review the diff with the user before commit.
14. Commit, push, create a PR, merge after checks, synchronize `main`, inspect production if production behavior changed, and delete the merged branch.
15. Update permanent dice documentation in the same PR if the approved contract differs from the current recommended shape.

---

## 21. Useful Commands

Run from the repository root in Windows CMD.

### Verify the baseline

```cmd
git switch main
git fetch origin --prune

git remote get-url origin
git branch --show-current
git status
git status --short --untracked-files=all
git rev-parse HEAD
git rev-parse origin/main
git rev-list --left-right --count HEAD...origin/main
git log -1 --stat --oneline
```

Expected baseline:

```text
https://github.com/Andrey-0101/ttrpg-website.git
main
cb378c18fc3f07ad6072f27508918ac53784e1b5
cb378c18fc3f07ad6072f27508918ac53784e1b5
0       0
```

### Inspect available scripts

```cmd
npm run
```

Current expected scripts:

```text
dev
build
start
lint
```

There is no current test script.

### Create the next branch after contract approval

```cmd
git switch -c feature/vtm-v5-personal-dice-engine

git status
git branch --show-current
git rev-parse HEAD
```

### Prepare a source archive for the next chat if needed

```cmd
powershell -NoProfile -Command "Compress-Archive -Path 'AGENTS.md','package.json','tsconfig.json','docs\product\DICE_ROLLS.md','docs\product\ROADMAP.md','docs\architecture\ARCHITECTURE.md','docs\architecture\I18N.md','docs\decisions\ADR-008-game-system-domain-boundaries.md','lib\characters','app\[locale]\games','messages','i18n' -DestinationPath 'vtm-personal-dice-source.zip' -Force"
```

### Verify a completed implementation

```cmd
git status --short --untracked-files=all
git diff --name-status
git diff --stat
git diff --check
npm run build
```

Run the exact approved test command only after the test approach is chosen and added or confirmed.

---

## 22. References

### Repository and production

- Repository: `https://github.com/Andrey-0101/ttrpg-website`
- Exact current commit: `cb378c18fc3f07ad6072f27508918ac53784e1b5`
- Production alias: `https://ttrpg-website-xi.vercel.app`
- Inspected deployment: `https://ttrpg-website-b8ste44pr-andrey-yudin.vercel.app`

### Core context

- `PROJECT_CONTEXT.md` — **UNVERIFIED / OUTDATED**; describes the old Architecture Baseline and pre-campaign state.
- `docs/handoffs/H006_CURRENT_HANDOFF.md` — current handoff, created after the verified clean snapshot and prepared for addition by the follow-up documentation synchronization.
- `docs/handoffs/H005_CURRENT_HANDOFF.md` — historical predecessor.
- `README.md`
- `docs/README.md`
- `AGENTS.md`

### Specifications

- `docs/product/ROADMAP.md`
- `docs/product/DICE_ROLLS.md`
- `docs/product/CAMPAIGNS.md`
- `docs/product/VIDEO_ROOMS.md`
- `docs/product/IDEAS_BACKLOG.md`

### Architecture and security

- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/DATABASE.md`
- `docs/architecture/SECURITY.md`
- `docs/architecture/I18N.md`
- `docs/architecture/CHARACTER_SHEETS.md`
- `docs/architecture/CAMPAIGN_RLS_MATRIX.md`

### Migrations

- `supabase/migrations/20260630143000_initial_schema.sql`
- `supabase/migrations/20260702150000_character_portraits.sql`
- `supabase/migrations/20260709150000_campaign_foundation.sql`
- `supabase/migrations/20260709163000_fix_campaign_select_policy.sql`
- `supabase/migrations/20260709170000_fix_campaign_character_trigger_security.sql`

### Generated types

- `types/database.types.ts`

### Relevant ADRs

- `docs/decisions/ADR-001-system-specific-versioned-jsonb.md`
- `docs/decisions/ADR-002-private-character-portrait-storage.md`
- `docs/decisions/ADR-003-independent-character-sheet-language.md`
- `docs/decisions/ADR-004-a4-responsive-character-sheet-rendering.md`
- `docs/decisions/ADR-005-url-prefixed-localization.md`
- `docs/decisions/ADR-006-next-intl-supabase-proxy-composition.md`
- `docs/decisions/ADR-007-campaign-foundation-before-shared-realtime-tools.md`
- `docs/decisions/ADR-008-game-system-domain-boundaries.md`
- `docs/decisions/ADR-009-managed-video-infrastructure.md`

---

## 23. Suggested Updates to Permanent Documents

| Document | Recommendation |
|---|---|
| `PROJECT_CONTEXT.md` | **UPDATE REQUIRED** — Replace the old `e2a412b` Architecture Baseline snapshot; record completed Character Friend Alpha and Campaign Foundation, six current tables, five migrations, campaign sharing semantics, Milestone 4 active status, and exact next dice task. |
| `docs/architecture/ARCHITECTURE.md` | **NO CHANGE** before the dice contract. Update only when the dice module path and responsibility surface are implemented. |
| `docs/architecture/DATABASE.md` | **NO CHANGE** for the personal evaluator. Update only when a new database migration is actually designed and applied. |
| `docs/architecture/I18N.md` | **NO CHANGE** before UI. Update when dice namespaces, metadata, or route behavior are implemented. |
| `docs/architecture/CHARACTER_SHEETS.md` | **NO CHANGE** for a standalone evaluator. Update only if character-assisted defaults change the sheet contract. |
| `docs/product/ROADMAP.md` | **NO CHANGE** until Phase 4A implementation status changes or scope is revised. |
| ADR files | **NO CHANGE** now. ADR-008 is accepted; ADR-009 remains proposed. Add a superseding/new ADR only for a material architecture change. |
| `docs/product/DICE_ROLLS.md` | **UPDATE WITH IMPLEMENTATION** — Replace recommended field names and unresolved rules with the approved contract and test matrix in the same PR as the evaluator. |
| `docs/README.md` | **UPDATE WHEN H006 IS COMMITTED** — Point Current Handoff to `H006_CURRENT_HANDOFF.md` and clarify the `cb378c1` current repository snapshot. |
| `README.md` | **OPTIONAL SMALL UPDATE** — Change the documented synchronized snapshot from `a1c3a61` to `cb378c1` when H006 is committed; note that PR #14 was documentation-only. |

Do not rewrite permanent documents fully unless their factual state changes.

---

## 24. Suggested Opening Message for the Next Chat

```text
We are continuing the Web_Site_TTRPG / ttrpg-website project.

Repository:
https://github.com/Andrey-0101/ttrpg-website

Verified current commit:
cb378c18fc3f07ad6072f27508918ac53784e1b5

Read H006_CURRENT_HANDOFF.md first. Treat the exact repository code, SQL migrations, generated database types, and verified infrastructure as the sources of truth. Do not use older chat snippets or historical handoffs when they differ.

Current stage:
Milestone 4A — VtM personal dice.

First task:
Review and approve the typed VtM V5 dice request/result contract, validation limits, and fixed interpretation examples; then implement the pure deterministic evaluator only. Do not add UI, random generation, database persistence, Realtime, campaign integration, or video in this first sub-slice.

Before writing code, verify the branch, HEAD, origin/main, working tree, current files, and available test scripts.
```

---

## 25. Handoff Quality Check

| Check | Status | Result |
|---|---|---|
| Commit matches described state | VERIFIED | HEAD and origin/main are both `cb378c1`; PR #14 is documentation-only |
| Implemented and planned work are separated | VERIFIED | Dice, shared persistence, video, and later content are explicitly marked planned or blocked |
| Current code is separated from old chat versions | VERIFIED | Current commit, migrations, and generated types are prioritized |
| Database objects are not invented | VERIFIED | Only six current tables and migration-backed objects are described |
| Candidate dice schema is not presented as current | VERIFIED | Candidate fields are marked planned/unverified |
| Deployment assumptions are marked | VERIFIED | Ready status is verified; commit association is unverified |
| Unverified Dashboard settings are marked | VERIFIED | No values or secrets are inferred |
| Accepted architectural decisions are preserved | VERIFIED | ADR-001/002/004/005/006/007/008 and proposed ADR-003/009 states are retained |
| Exact next task is singular and concrete | VERIFIED | Pure typed VtM evaluator with fixed-input verification |
| Out-of-scope work is explicit | VERIFIED | UI, randomness, persistence, Realtime, campaign integration, and video are excluded |
| Resume procedure starts with source verification | VERIFIED | Repository checks precede code |
| User workflow preferences are preserved | VERIFIED | Windows CMD, sequential steps, full files, English code, data preservation |
| Secrets are absent | VERIFIED | No keys, values, tokens, passwords, or `.env` contents are included |
| Sufficient for continuation without full chat | VERIFIED | Current state, contracts, risks, decisions, evidence, and next task are included |
