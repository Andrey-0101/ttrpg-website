# H012_CURRENT_HANDOFF.md

## 1. Document Control

| Field | Value |
|---|---|
| Project | `TTRPG_website` / `ttrpg-website` |
| Handoff version | `H012` |
| Created | 2026-09-09 |
| Status | **Current authoritative continuation handoff for the next chat** |
| Scope of completed chat | Phase 4D1 planning, implementation, release, UX follow-ups, roll-label/history refinement, Production closeout, process lessons, and pre-Phase-5 maintenance capture |
| Canonical local repository | `C:\Projects\ttrpg-website` |
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Canonical branch | `main` |
| Current HEAD | `0de0290330438a8deeb933ad0eda25e531508276` |
| Current `origin/main` | `0de0290330438a8deeb933ad0eda25e531508276` |
| Working tree | **VERIFIED — clean; zero modified/staged/untracked paths in final Codex closeout report** |
| Last commit | `0de0290 Close Phase 4D1 documentation (#51)` |
| Last commit diff | 2 documentation files; 5 additions, 3 deletions |
| Push | **VERIFIED — yes; `main` is published to GitHub** |
| Production URL | `https://ttrpg.fans` |
| `www` behavior | **VERIFIED — `https://www.ttrpg.fans` redirects to apex** |
| Current Vercel deployment | `dpl_6mJsK3JB3h4LRcxbFaQTUGSPoXJ4` |
| Current Vercel deployment status | **VERIFIED — READY / Production / exact Git SHA `0de0290330438a8deeb933ad0eda25e531508276` / region `hnd1`** |
| Current Production build | **VERIFIED — `npm run build` via Vercel PASS; Next.js 16.3.3; TypeScript PASS; 38/38 pages generated** |
| Previous handoff | `H011_CURRENT_HANDOFF.md` |
| Repository state of H012 at creation | **UNVERIFIED / NOT COMMITTED BY THIS CHAT — this generated handoff is the transition artifact; current Git commit still contains H011 and no H012** |

**VERIFIED:** GitHub `main` points to `0de0290330438a8deeb933ad0eda25e531508276`. The exact commit is the squash merge of PR #51, `Close Phase 4D1 documentation`.

**VERIFIED:** Vercel Production deployment `dpl_6mJsK3JB3h4LRcxbFaQTUGSPoXJ4` is READY, uses the exact current Git SHA, serves the production aliases, and built 38/38 pages successfully.

**VERIFIED:** Final repository cleanup reported only `main`, synchronized with `origin/main`, with a clean working tree and no staged or untracked files.

**DEPRECATED:** H011 is no longer the continuation authority once this H012 is supplied to the next chat. H011 remains an immutable historical record and must not be edited retroactively.

---

## 2. Instructions for the Next Chat

1. **VERIFIED / REQUIRED:** Read this H012 completely before proposing work.
2. **REQUIRED:** Verify the repository still points to the H012 baseline before relying on it:
   - repository `Andrey-0101/ttrpg-website`;
   - branch `main`;
   - `HEAD == origin/main`;
   - clean working tree.
3. **REQUIRED:** Use the exact current Git commit as the code source of truth. Do not reuse code snippets from old chats when the repository contains a newer implementation.
4. **REQUIRED:** Read only the current files relevant to the task. Do not re-audit the whole repository by default.
5. **REQUIRED:** Treat applied SQL migrations as immutable. Any later database change requires a new forward migration.
6. **REQUIRED:** Treat `types/database.types.ts` as generated output. Do not edit it manually.
7. **REQUIRED:** Do not invent tables, columns, policies, Storage buckets, environment variables, routes, migrations, tests, or deployments that are not evidenced by current code/migrations/types/verified infrastructure.
8. **REQUIRED:** Check every item marked `ASSUMED`, `UNVERIFIED`, or `BLOCKED` before using it as a design premise.
9. **REQUIRED:** Phase 4D1 is closed. Do not reopen it merely to make the known minor CoC history issue perfect.
10. **DECIDED:** The next product work is Phase 4D2 planning/review, not immediate coding. First review the Phase 4D2 plan, identify missing decisions, and adjust/complete the plan with the user.
11. **DECIDED:** Personal dice history is non-authoritative and must remain separate from future campaign-authoritative dice.
12. **DECIDED:** Minimal-delta verification is mandatory. Previously passed evidence remains valid unless the current delta can invalidate it.
13. **DECIDED:** If an automated verification cannot be performed both safely and reliably with the available tooling/authentication boundary, stop that verification and give the user a short manual checklist. Do not invent increasingly invasive workarounds.
14. **REQUIRED:** Before changing Next.js code, obey `AGENTS.md` and read the relevant installed Next.js 16.3.3 documentation under `node_modules/next/dist/docs/`.

---

## 3. Source-of-Truth Priority

When sources conflict, use this order:

1. **VERIFIED:** Code at the exact Git commit being changed.
2. **VERIFIED:** Ordered SQL migrations in `supabase/migrations/`.
3. **VERIFIED:** Generated database types in `types/database.types.ts`.
4. **VERIFIED:** Factually checked Supabase and Vercel state.
5. **CURRENT HANDOFF:** `H012_CURRENT_HANDOFF.md`.
6. **PERMANENT CONTEXT:** `PROJECT_CONTEXT.md`, but only after checking it against current code because some Phase 4D1 closeout wording is stale.
7. **CURRENT SPECIFICATIONS / ADRs:** relevant architecture/product documents and accepted ADRs.
8. **CURRENT CHAT DECISIONS:** only where not superseded by code/migrations/verified infrastructure.
9. **HISTORICAL:** H001–H011 and older chats/snippets.

**DEPRECATED:** Do not treat H011 or older handoffs as newer than H012.

---

## 4. Current Project Snapshot

### Platform

| Status | Item | Current state |
|---|---|---|
| VERIFIED | Framework | Next.js `16.3.3`, App Router |
| VERIFIED | UI runtime | React / React DOM `19.2.4` |
| VERIFIED | Language | TypeScript |
| VERIFIED | Styling | Tailwind CSS 4 |
| VERIFIED | Localization | `next-intl` `^4.13.0`, EN/RU |
| VERIFIED | Backend | Supabase PostgreSQL/Auth/RLS/Storage |
| VERIFIED | Realtime/media | LiveKit for the accepted campaign Game Room |
| VERIFIED | Hosting | Vercel |
| VERIFIED | Source control | GitHub |
| VERIFIED | Production domain | `https://ttrpg.fans` |
| VERIFIED | Function region | Vercel `hnd1` (Tokyo) |
| VERIFIED | Supabase region | Tokyo / `ap-northeast-1` according to current permanent docs |
| VERIFIED | Current production Git SHA | `0de0290330438a8deeb933ad0eda25e531508276` |

### Main implemented modules

**IMPLEMENTED:**
- localized authentication, profiles, Account and Dashboard;
- VtM V5 character creation/editing/viewing, private portraits, campaign visibility, campaign read-only shared sheets;
- Campaign Foundation with one immutable GM, up to six ordered Players, invitations, lifecycle and character linking;
- generic CoC 7e campaign shell;
- Campaign Game Room with LiveKit video and stable seven-slot participant layout;
- Campaign Gallery and Game Room image presentation;
- VtM personal Dice Roller;
- Custom Dice Pool;
- CoC 7e personal Dice Roller with Percentile and Other Dice;
- owner-private personal roll history and Custom presets;
- contextual roller Back navigation;
- per-roller-page personal history;
- Roll Labels across all personal rollers;
- scoped personal-history clear/delete;
- live CoC success-range guide.

### Active stage

**VERIFIED:** Phase 4D1 is **CLOSED / DEPLOYED / VERIFIED WITH KNOWN MINOR ISSUE**.

**PLANNED / NEXT:** Phase 4D2 — system-aware campaign/Game Room dice integration.

### Localization

**IMPLEMENTED / VERIFIED:**
- locales: `en`, `ru`;
- locale prefix always present on application routes;
- selected locale persisted in a one-year cookie;
- technical `/auth/confirm` remains outside `[locale]`;
- current CoC dice labels are localized;
- Roll Label fallback is `No label` / `Без метки`;
- final Phase 4D1 label-history work reported main EN/RU parity `673/673` and VtM dictionary parity `241/241`.

**PLANNED:** independent character-sheet language remains separate from site route locale and is not implemented.

### Authentication

**IMPLEMENTED / VERIFIED:**
- registration;
- login;
- email confirmation;
- session persistence;
- logout;
- profile view/edit;
- safe localized user-facing errors;
- authenticated personal-roll persistence;
- Production authenticated roll-history smoke manually completed by the user.

### Character management

**IMPLEMENTED:**
- list/create/detail/edit/save/clear/delete;
- private portraits;
- VtM summary cards;
- campaign visibility and active-assignment read sharing;
- owner-only editing/deletion;
- responsive character surfaces.

**IMPLEMENTED:** VtM sheet schema version is `3`.

**PLANNED:** CoC character sheets are Phase 4F1.

### Database

**VERIFIED:**
- 13 repository migrations are applied to Production;
- latest applied migration: `20260908094324_scope_coc_personal_roll_history.sql`;
- 15 current public tables;
- RLS remains the authorization boundary;
- `types/database.types.ts` contains generated types for current public tables/functions;
- no campaign-authoritative dice-roll table exists.

### Production

**VERIFIED:**
- current Production deployment is READY at exact SHA `0de0290330438a8deeb933ad0eda25e531508276`;
- current docs-only deployment successfully ran `npm run build`, TypeScript, and generated 38/38 pages;
- Phase 4D1 functional release and follow-ups were previously smoke-tested in Production;
- no remaining Phase 4D1 release blocker exists.

---

## 5. Scope of the Completed Chat

### Initial goal

**DECIDED / COMPLETED:** Continue after Phase 4C2, review the plan, and deliver Phase 4D1 — a standalone Call of Cthulhu 7e personal Dice Roller without campaign/Game Room dice integration.

### Additional work that appeared

**COMPLETED:**
- shared dice validation;
- shared secure unbiased RNG;
- CoC Percentile deterministic evaluator and generator;
- CoC Other Dice evaluator and generator;
- responsive two-panel CoC UI;
- extensible personal-roll persistence envelope;
- CoC personal persistence;
- mixed personal-history UI;
- contextual safe Back navigation;
- moving history from the generic Dice Rollers catalogue to the relevant roller page;
- CoC live target/success-range UI;
- Roll Label across VtM, Custom and both CoC panels;
- scoped clear and retention changes;
- dependency remediation for vulnerable Browserslist;
- controlled Production migrations/backups/releases;
- documentation synchronization and final closeout;
- process-policy decision to eliminate unnecessary repeated verification.

### Final outcome

**VERIFIED:** Phase 4D1 is deployed and formally closed.

**VERIFIED:** Final current `main` is `0de0290330438a8deeb933ad0eda25e531508276`.

**KNOWN MINOR ISSUE:** CoC personal history shows **4 previous rolls + current** instead of the intended **5 previous rolls + current**. This is explicitly deferred; no root cause has been established.

---

## 6. Work Completed

| Status | Change | Main files / migrations | Release / commit | Verification |
|---|---|---|---|---|
| IMPLEMENTED / VERIFIED | Shared dice validation | `lib/dice/validation.ts` | Phase 4D1 PR #46 sequence | Dice tests |
| IMPLEMENTED / VERIFIED | Shared secure unbiased integer RNG | `lib/dice/secure-random.ts` | Phase 4D1 PR #46 sequence | Dice tests |
| IMPLEMENTED / VERIFIED | CoC Percentile evaluator/generator | `lib/game-systems/call-of-cthulhu-7e/dice-engine.ts`, `dice-roller.ts` | PR #46 | Dice tests + browser/Production smoke |
| IMPLEMENTED / VERIFIED | CoC Other Dice evaluator/generator | same CoC domain | PR #46 | Dice tests + browser/Production smoke |
| IMPLEMENTED / VERIFIED | CoC personal Dice Roller UI/route/catalogue | `components/games/call-of-cthulhu-7e/dice-roller.tsx`, `app/[locale]/games/call-of-cthulhu/tools/dice/page.tsx`, catalogue | PR #46 | Build, EN/RU, guest smoke |
| IMPLEMENTED / VERIFIED | Extensible personal-history envelope | `20260905171520_make_personal_roll_history_extensible.sql` | PR #46 release | Local reset, pgTAP, concurrency, Production migration parity |
| IMPLEMENTED / VERIFIED | Contextual `returnTo` Back navigation | roller pages/inbound links | PR #47, Production main `abeada9f...` | Local/Preview/Production guest smoke |
| IMPLEMENTED / VERIFIED | Roller-scoped history and scoped Clear | persistence service/history UI + `20260907114535_scope_personal_roll_history_by_kind.sql` | PR #47 | pgTAP, concurrency, local auth browser |
| IMPLEMENTED / VERIFIED | CoC live six-band Target guide | CoC deterministic helper + UI | PR #47 | Unit/browser/Production guest checks |
| IMPLEMENTED / VERIFIED | Roll Label for all personal rollers | VtM/Custom/CoC components + persistence metadata/history | PR #50 | 266/266 dice tests, local auth browser, manual Production acceptance |
| IMPLEMENTED / VERIFIED | CoC shared retention scope | `20260908094324_scope_coc_personal_roll_history.sql` | PR #50, Production main `5acfc12...` | 273/273 pgTAP, concurrency, Production migration parity |
| VERIFIED | Dependency fix | `package-lock.json`, Browserslist `4.28.4 -> 4.28.9` | Phase 4D1 closeout | full + production-only npm audits = 0 vulnerabilities |
| VERIFIED | Final documentation closeout | `docs/product/DICE_ROLLS.md`, `docs/product/ROADMAP.md` | PR #51, current main `0de0290...` | PR checks + current Vercel build |
| VERIFIED | Final repository cleanup | release/follow-up/doc branches removed | after PR #51 | `main`, clean, synchronized |

### Release history relevant to Phase 4D1

| PR | Result |
|---|---|
| #46 | Core CoC 7e personal Dice Roller + extensible personal persistence |
| #47 | Contextual Back, roller-scoped history, live CoC target bands |
| #48 | Post-release documentation synchronization |
| #49 | Final Phase 4D1 heading correction |
| #50 | Roll Labels for all personal rollers + combined CoC retention |
| #51 | Phase 4D1 final documentation closeout / known issue |

---

## 7. Relevant File Map

| Path | Purpose | Current State | Notes |
|---|---|---|---|
| `AGENTS.md` | Codex/agent repository instructions | IMPLEMENTED but incomplete for current process policy | Contains Next.js rule; Minimal Delta Verification Policy is **DECIDED but not yet committed** |
| `PROJECT_CONTEXT.md` | broad synchronized project context | CURRENT BUT PARTLY STALE | Still contains Phase 4D1 auth-pending wording and older release details; H012/current code override it |
| `docs/product/ROADMAP.md` | approved stage sequence | CURRENT | Phase 4D1 closed with known minor issue; Phase 4D2 next |
| `docs/product/DICE_ROLLS.md` | dice architecture/product contract | CURRENT | Records Phase 4D1 known issue and auth acceptance |
| `docs/product/CAMPAIGNS.md` | campaign/product boundary | CURRENT | Phase 4D2 campaign dice remains future |
| `docs/architecture/ARCHITECTURE.md` | platform/system domain boundaries | PARTLY STALE | baseline SHA and some retention wording predate final Phase 4D1 refinement |
| `docs/architecture/DATABASE.md` | DB/RLS/Storage contracts | DATA CONTRACT CURRENT, HEADER STALE | migration list is correct; top Production commit is old |
| `docs/architecture/SECURITY.md` | security/public-readiness rules | PARTLY STALE | still refers to older H011 baseline and old Phase 4D1 migration count/retention wording |
| `docs/architecture/I18N.md` | locale routing/messages | CURRENT enough | EN/RU, always-prefixed routes, auth callback, sheet-language separation |
| `docs/decisions/ADR-007-campaign-foundation-before-shared-realtime-tools.md` | campaign auth before shared tools | ACCEPTED / CURRENT | central Phase 4D2 constraint |
| `docs/decisions/ADR-008-game-system-domain-boundaries.md` | platform vs system ownership | ACCEPTED / CURRENT | prevents universal rules-engine drift |
| `lib/game-systems/vtm-v5/dice-engine.ts` | VtM deterministic evaluation | IMPLEMENTED |
| `lib/game-systems/vtm-v5/dice-roller.ts` | VtM personal RNG | IMPLEMENTED |
| `lib/game-systems/call-of-cthulhu-7e/dice-engine.ts` | CoC deterministic rules/target ranges | IMPLEMENTED |
| `lib/game-systems/call-of-cthulhu-7e/dice-roller.ts` | CoC personal RNG | IMPLEMENTED |
| `lib/dice/validation.ts` | proven shared validation primitives | IMPLEMENTED |
| `lib/dice/secure-random.ts` | unbiased random integer primitive | IMPLEMENTED |
| `lib/dice/custom-dice-pool.ts` | system-neutral custom roller | IMPLEMENTED |
| `lib/dice/personal-dice-persistence.ts` | typed personal-history registry/validation | IMPLEMENTED |
| `lib/dice/personal-dice-persistence-service.ts` | server-side personal-history service | IMPLEMENTED |
| `lib/dice/personal-roll-recording.ts` | best-effort recording helpers | IMPLEMENTED |
| `components/dice-rollers/personal-roll-history.tsx` | scoped personal-history UI | IMPLEMENTED |
| `components/games/call-of-cthulhu-7e/dice-roller.tsx` | CoC personal UI | IMPLEMENTED |
| `app/[locale]/campaigns/[id]/game-room/` | current campaign Game Room surface | IMPLEMENTED | first integration target for Phase 4D2 |
| `lib/game-systems/catalogue.ts` | system/capability registry | IMPLEMENTED |
| `supabase/migrations/20260905171520_make_personal_roll_history_extensible.sql` | generic personal envelope | APPLIED |
| `supabase/migrations/20260907114535_scope_personal_roll_history_by_kind.sql` | scoped history index/clear + earlier retention | APPLIED |
| `supabase/migrations/20260908094324_scope_coc_personal_roll_history.sql` | current CoC shared retention | APPLIED |
| `types/database.types.ts` | generated Supabase types | GENERATED / CURRENT |
| `tests/dice/` | dice/persistence regression tests | CURRENT |
| `supabase/tests/database/` | pgTAP | CURRENT |
| `tests/database/personal-dice-concurrency.test.ts` | personal history concurrency/retention | CURRENT |

---

## 8. Current Data Contracts

### 8.1 Character contract

**VERIFIED / IMPLEMENTED:**
- common character columns live in `public.characters`;
- system-specific sheet data lives in `characters.sheet_data` JSONB;
- VtM current schema version is `3`;
- VtM data is normalized through the current system normalizer;
- common fields are not duplicated into system JSONB;
- future CoC character schema is not implemented.

### 8.2 Personal roll envelope

**VERIFIED:** `public.personal_roll_history` generated type currently contains:

```text
id: string
owner_id: string
client_roll_id: string
sequence_number: number
roller_kind: string
schema_version: number
request_data: Json
result_data: Json
created_at: string
```

**VERIFIED:** current application registry supports schema version `1` for:

```text
vtm_v5
custom_dice_pool
coc_7e_percentile
coc_7e_other_dice
```

**VERIFIED:** database envelope constraints:

```text
roller_kind ~ '^[a-z][a-z0-9_]{0,63}$'
schema_version > 0
```

**VERIFIED:** these database constraints allow syntactically valid future kinds/versions only at the envelope level. Application support is controlled by `PERSONAL_ROLLER_REGISTRY`; unknown/malformed/unsupported rows are skipped safely.

### 8.3 Roll Label contract

**IMPLEMENTED:**
- optional Roll Label on VtM, Custom, CoC Percentile and CoC Other Dice;
- label is the first settings control on each personal roller;
- CoC Percentile and Other Dice use independent label state;
- shared normalizer trims/collapses whitespace, empty -> `null`, max 120 Unicode code points;
- VtM uses its existing request label;
- Custom and CoC store label as additive `request_data` JSON metadata;
- old rows without label remain readable;
- history shows normalized label or `No label` / `Без метки`.

### 8.4 Personal history retention

**VERIFIED database target/current implementation:**
- VtM retains newest 6 rows in its scope;
- Custom retains newest 6 rows in its scope;
- CoC retains newest 6 rows **total across** `coc_7e_percentile` + `coc_7e_other_dice`;
- current result is intended to remain separate from up to 5 previous history entries;
- individual Delete is row-specific;
- scoped Clear operates only on the validated roller-page kind(s);
- owner identity is derived from the authenticated session.

**KNOWN MINOR ISSUE:** Production CoC UI currently shows 4 previous entries + current rather than intended 5 previous + current. Root cause is **UNVERIFIED** and must not be guessed.

### 8.5 CoC Percentile contract

**IMPLEMENTED / VERIFIED:**
- Target optional; valid integer `1..100`;
- no separate Difficulty field;
- Bonus/Penalty exact values `-3..+3`;
- ±3 is an intentional project extension;
- one Units D10, one base Tens D10, plus additional Tens dice for bonus/penalty;
- tens faces `00,10,...90`;
- `00 + 0 = 100`;
- bonus chooses lowest complete percentile result;
- penalty chooses highest complete percentile result;
- first matching winning tens index wins ties;
- `tensDice[0]` is base-die identity, not selection priority;
- no Target => raw percentile only, no success interpretation.

**IMPLEMENTED / VERIFIED success precedence:**

```text
Critical
Fumble
Extreme
Hard
Regular
Failure
```

**IMPLEMENTED / VERIFIED target-derived guide:**

```text
Critical Success = 01
Extreme Success <= floor(Target / 5)
Hard Success <= floor(Target / 2)
Regular Success <= Target
Fumble = 96-100 when Target < 50
Fumble = 100 when Target >= 50
Failure = Target+1..95 when Target < 50
Failure = Target+1..99 when Target >= 50
```

Empty ranges display `-`.

### 8.6 CoC Other Dice contract

**IMPLEMENTED / VERIFIED:**

```text
D2
D3
D4
D6
D8
D10
D20
D100
```

- no D12;
- quantity `1..10`;
- modifier `-10..+10`;
- one die type per roll;
- ordered die results;
- canonical formula;
- modifier omitted visually when zero;
- negative total allowed.

### 8.7 Campaign dice target model

**PLANNED / NOT IMPLEMENTED:**
- no campaign-authoritative `dice_rolls` table currently exists;
- exact Phase 4D2 persistence schema is not yet approved;
- exact Realtime history/feed contract is not yet approved;
- personal roll history must not be promoted into campaign evidence;
- deterministic VtM/CoC evaluators may be reused, but campaign execution must be server-authoritative.

---

## 9. Database, RLS and Storage State

### Current public tables

**VERIFIED from generated types / DATABASE.md:**

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

### Current migration chain

**VERIFIED / APPLIED TO PRODUCTION:**

```text
20260630143000_initial_schema.sql
20260702150000_character_portraits.sql
20260709150000_campaign_foundation.sql
20260709163000_fix_campaign_select_policy.sql
20260709170000_fix_campaign_character_trigger_security.sql
20260722103835_personal_dice_persistence.sql
20260822190351_campaign_video_data_foundation.sql
20260823143856_harden_campaign_database_grants.sql
20260902132447_allow_completed_campaign_image_cleanup.sql
20260903000242_campaign_gallery_categories.sql
20260905171520_make_personal_roll_history_extensible.sql
20260907114535_scope_personal_roll_history_by_kind.sql
20260908094324_scope_coc_personal_roll_history.sql
```

**REQUIRED:** applied migrations are immutable.

### Personal history functions / indexes

**VERIFIED:**
- `record_personal_roll(...)` remains generic and owner-authenticated;
- writes are owner-serialized through an advisory transaction lock;
- idempotency is enforced by owner + client roll ID semantics;
- `personal_roll_history_owner_kind_sequence_idx` exists;
- `clear_personal_roll_history_by_kinds(text[])` is authenticated-only and owner-derived;
- current CoC retention groups both CoC kinds into one six-row scope.

### RLS

**VERIFIED at H011 connected audit, with later Phase 4D1 migrations not changing table RLS policies:**
- all 15 public tables have RLS enabled;
- owner/campaign authorization remains database-backed;
- personal history remains owner-private;
- no anonymous/public personal-roll history access exists.

**UNVERIFIED as a fresh post-Phase-4D1 count:** exact total policy count was not re-counted after closeout because later migrations did not change RLS policies. H011 recorded 41 policies.

### Storage

**IMPLEMENTED / VERIFIED:**

`character-portraits`
- private;
- max 5 MiB;
- JPEG/PNG/WebP;
- owner/character path;
- signed reads;
- campaign-aware read sharing where authorized.

`campaign-images`
- private;
- max 5 MiB;
- JPEG/PNG/WebP;
- exact represented object path;
- RLS/Storage authorization tied to campaign image metadata;
- fixed Gallery categories `handout`, `npc`, `maps_plans`, `other`.

### Generated types

**VERIFIED:** `types/database.types.ts` includes the current 15 public tables and generated function signatures.

**REQUIRED:** regenerate after intentional schema changes; do not edit manually.

### Latest Production backup relevant to Phase 4D1

**VERIFIED:** before PR #50 Production migration:

```text
C:\Users\anryj\Documents\SupabaseBackups\ttrpg-website\20260908-201704-pre-pr50-production
```

Artifacts:

```text
public-schema.sql
public-data.sql
roles.sql
```

Verified SHA-256:

```text
public-schema.sql  FD1DEE847EC68336C48E683C2CED96570F7BEB06B32E3BED6F583A037B45B2F5
public-data.sql    E39923555B11A3CE75A06FC1B21E080A8CCD0A3CCC3B537DD51CAC34476B3075
roles.sql          4350A72B5EC109888E740C17F3EB4DA2FCD95AB73AF26499538ED0BF615DB543
```

**VERIFIED:** backup lives outside the repository.

### Dashboard-only / hosted settings

**VERIFIED in current permanent docs, values not to be exposed:**
- hosted Supabase Auth Site URL / redirect allowlist;
- Vercel environment-variable values;
- LiveKit provider credentials.

Required Production variable names only:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

Do not record values in handoffs or logs.

---

## 10. Confirmed Architectural Decisions

| Decision | Status | Reason | Related files / ADR |
|---|---|---|---|
| Platform and game-system rules remain separate | DECIDED / ACCEPTED | Prevent VtM/CoC rules leaking into generic platform code; avoid premature universal engine | ADR-008, `ARCHITECTURE.md` |
| Campaign authorization precedes shared/realtime campaign tools | DECIDED / ACCEPTED | One authoritative participant boundary for shared tools | ADR-007 |
| Personal dice can be client-generated | DECIDED / IMPLEMENTED | Convenience tool; non-authoritative | `DICE_ROLLS.md` |
| Future campaign dice must be server-authoritative | DECIDED / PLANNED | Shared history must not trust client-generated evidence | `ROADMAP.md`, `SECURITY.md`, ADR-007 |
| Personal roll history must not be campaign evidence | DECIDED / IMPLEMENTED | Different trust/authorization domain | `DICE_ROLLS.md` |
| Shared validation/RNG only for proven common behavior | DECIDED / IMPLEMENTED | Avoid speculative universal rules engine | ADR-008 |
| CoC ±3 bonus/penalty support is intentional | DECIDED / IMPLEMENTED | Product extension beyond common table examples | CoC dice engine/tests/docs |
| CoC success thresholds use floor rounding | DECIDED / IMPLEMENTED | Matches official CoC 7e rules | CoC helper/tests/docs |
| Roller Back navigation uses validated explicit `returnTo` | DECIDED / IMPLEMENTED | Reload-safe and avoids unreliable browser-back/open-redirect behavior | roller routes/tests |
| Generic Dice Rollers page is catalogue-only | DECIDED / IMPLEMENTED | History belongs to its specific roller context | roller pages/history |
| CoC Percentile + Other Dice share one history scope | DECIDED / IMPLEMENTED | One CoC roller page / user mental model | latest migration/history |
| Roll Label exists on all personal rollers and is first | DECIDED / IMPLEMENTED | Lets users identify saved history | roller components/history |
| Current result is separate from previous history | DECIDED / IMPLEMENTED | Prevent duplicate current/history rendering | history UI |
| Phase 4D1 known 4+current issue is deferred | DECIDED | Do not reopen 4D1 now; user accepted closeout with minor issue | ROADMAP/DICE_ROLLS |
| Minimal-delta verification is mandatory | DECIDED | Repeating already-proven gates wasted time/tokens and created infrastructure problems | current chat; AGENTS update still pending |
| Safe automation is required; unsafe automation becomes manual | DECIDED | Avoid token leakage/protection workarounds | current chat |
| Manual OIDC token injection for Preview browser smoke is forbidden | DEPRECATED | A temporary Preview OIDC token was echoed by a failed CLI invocation | current chat |
| Supabase Free keep-alive health task must happen before Phase 5 | PLANNED | Mitigate inactivity pausing while project is low-traffic | current chat |

---

## 11. Functional Requirements Preserved

### Personal dice

**IMPLEMENTED / REQUIRED TO PRESERVE:**
- guest rolling works without login;
- guest rolls are not persisted;
- authenticated roll result appears immediately;
- persistence is best-effort and must not remove a visible result if saving fails;
- history is private and owner-scoped;
- history is non-authoritative;
- Roll Label is optional and normalized;
- no raw backend error is shown;
- current result remains separate from previous history.

### VtM Dice Roller

**IMPLEMENTED / REQUIRED TO PRESERVE:**
- VtM deterministic rules remain system-specific;
- Difficulty is optional;
- Hunger rules remain intact;
- Roll Label is first control;
- history shows label or localized no-label fallback;
- history scope is VtM only.

### Custom Dice Pool

**IMPLEMENTED / REQUIRED TO PRESERVE:**
- Coin + D4/D6/D8/D10/D12/D20/D100;
- max 100 rolled items;
- optional label first;
- Custom-only history;
- saved presets max 5 for authenticated users.

### CoC Dice Roller

**IMPLEMENTED / REQUIRED TO PRESERVE:**
- two simultaneous panels: Percentile and Other Dice;
- desktop weighting approximately 3:2;
- separate independent labels;
- labels first;
- Target optional;
- no Difficulty field;
- ±3 bonus/penalty;
- live six-band target guide;
- target guide recalculates while editing, not only on Roll;
- physical percentile dice remain visible;
- Other Dice remains independent;
- combined CoC-only history.

**KNOWN MINOR ISSUE:** user-visible combined CoC history is 4 previous + current, not intended 5 previous + current.

### Campaign / Game Room

**IMPLEMENTED / REQUIRED TO PRESERVE:**
- one immutable GM;
- max six Players;
- system discriminator on campaign;
- campaign authorization/RLS is authoritative;
- video Game Room remains campaign-authorized;
- image presentation remains current;
- Phase 4D2 must integrate dice into this existing authorization domain.

### Localization

**REQUIRED:**
- EN/RU;
- localized visible labels/errors;
- route locale prefixes;
- safe Russian mobile layout;
- do not manually concatenate locale prefixes.

### Security / data

**REQUIRED:**
- no secrets in client code/handoffs/logs;
- no raw backend errors;
- no owner ID trusted from client for owner-scoped operations;
- no client-generated campaign-authoritative dice evidence;
- every DB change forward-migration only;
- preserve existing user data.

---

## 12. User Requirements and Working Preferences

These are durable project workflow requirements.

### Environment / instructions

**REQUIRED:**
- User works primarily in **Windows CMD**. Default commands should be CMD-compatible unless a different shell is explicitly requested.
- For complex work, provide sequential steps with checkpoints rather than huge undifferentiated instruction dumps.
- Before replacing or editing a file, inspect the current version.
- For large-file replacements, full-file versions may be preferable after the current file is confirmed.
- All code and code comments inside code blocks must be in English.
- Explanations may be in Russian.
- Do not show raw backend errors to end users.
- Preserve user data; no destructive migration without explicit need and backup/recovery planning.
- Build functional foundations before detailed decorative design.

### Minimal Delta Verification Policy

**DECIDED — mandatory even though not yet committed to `AGENTS.md`:**

Every Codex task should explicitly define:

```text
Delta
Already proven
Required checks
Forbidden rechecks
```

Rules:

- verify only what the current delta can affect;
- previously passed checks remain valid unless the delta can invalidate them;
- full regression, full browser smoke, full docs audit, and full release audit are **not defaults**;
- do not rerun checks “for completeness”, “for extra confidence”, or “just in case”;
- do not repeat an entire gate because one stale assertion failed;
- if automation is blocked by Docker, browser tooling, endpoint security, authentication, Vercel protection, or another environment boundary, stop that verification;
- do not autonomously escalate through alternate browsers, proxies, OIDC tokens, or increasingly invasive workarounds;
- if a check cannot be automated both safely and reliably, provide a short manual checklist to the user;
- do not broaden task scope autonomously;
- report unrelated issues instead of starting a new mini-project;
- efficiency is a project requirement; unnecessary verification is a process defect, not added safety.

### Authentication / automation safety

**DECIDED:**
- prefer automatic checks when they can be done safely;
- never manually obtain/paste/pass temporary Vercel OIDC/access tokens through shell arguments for browser smoke;
- never weaken Preview/Production protection simply to automate a test;
- if protected Preview cannot be safely exercised automatically, mark browser smoke manual/pending;
- normal Vercel/GitHub/Supabase authenticated tooling may be used only through its safe supported boundary without logging secrets.

---

## 13. Localization State

| Item | Status | Current state |
|---|---|---|
| Locales | IMPLEMENTED | `en`, `ru` |
| Default locale | IMPLEMENTED | `en` |
| Prefix | IMPLEMENTED | `localePrefix: "always"` |
| Locale cookie | IMPLEMENTED | 1 year |
| Navigation helpers | REQUIRED | `i18n/navigation.ts`; do not manually concatenate locale |
| Request loader | IMPLEMENTED | common + VtM dictionaries |
| Main message files | IMPLEMENTED | `messages/en.json`, `messages/ru.json` |
| VtM dictionaries | IMPLEMENTED | `messages/en/vtm-v5.json`, `messages/ru/vtm-v5.json` |
| CoC UI labels | IMPLEMENTED | currently in main message dictionaries |
| Roll Label fallback | IMPLEMENTED | `No label` / `Без метки` |
| Auth callback | IMPLEMENTED | `/auth/confirm`, outside `[locale]` |
| Sheet language independent of route | PLANNED | not implemented |
| Final parity evidence | VERIFIED | main `673/673`; VtM `241/241` |
| Missing current translation blocker | VERIFIED | none reported in Phase 4D1 closeout |

**UNVERIFIED / PLANNED:** a dedicated nested-key parity check is still described in I18N docs as not part of CI; do not assume a new CI job unless current workflow proves it.

---

## 14. Verification Evidence

### Final Phase 4D1 functional evidence

| Verification | Result |
|---|---|
| Dice/application tests | **PASS — 266/266** |
| Site URL tests | **PASS — 13/13** |
| Campaign/Gallery/catalogue tests | **PASS — 40/40** |
| Campaign Video/Game Room tests | **PASS — 53/53** |
| Local DB reset for final label/history refinement | **PASS — 13/13 migrations applied** |
| pgTAP | **PASS — 273/273** |
| Personal-history concurrency | **PASS — VtM 6, Custom 6, CoC 6 total; owner isolation + idempotency** |
| Campaign-video concurrency | **PASS** |
| ESLint | **PASS** |
| TypeScript `--noEmit` | **PASS** |
| EN/RU parity | **PASS — 673/673 main, 241/241 VtM** |
| npm audit | **PASS — 0 vulnerabilities** |
| npm audit `--omit=dev` | **PASS — 0 vulnerabilities** |
| Production build during functional release | **PASS — 38/38 pages** |
| Local authenticated browser | **PASS — VtM/Custom/CoC labels, no-label fallback, scoped history, dedup, Delete/Clear** |
| Production guest smoke | **PASS — affected rollers, labels first, rolling functional** |
| Production manual authenticated smoke | **PASS with known CoC history count issue** |
| Production runtime sanity | **PASS — no release-related 500/error/fatal pattern reported** |

### Current commit verification

**VERIFIED:** Vercel deployment `dpl_6mJsK3JB3h4LRcxbFaQTUGSPoXJ4` at exact current SHA ran:

```text
npm run build
next build
Compiled successfully
TypeScript finished successfully
38/38 static pages generated
Deployment completed
```

**WARNING / NON-BLOCKING:** current Vercel install logs still show allow-scripts warnings for:

```text
@parcel/watcher@2.5.6
@swc/core@1.15.43
unrs-resolver@1.12.2
```

The build completes; do not widen install-script permissions merely to suppress the warning without a specific need.

### Production verification

**VERIFIED:**
- current production aliases include `ttrpg.fans`, `www.ttrpg.fans` and technical Vercel aliases;
- current deployment READY;
- exact current Git SHA deployed;
- region `hnd1`;
- Phase 4D1 functional Production migration parity was 13/13 before final docs-only closeout.

### Not verified / do not claim

**UNVERIFIED:**
- root cause of the CoC 4-previous-history issue;
- quantitative Game Room packet-loss/latency/jitter metrics;
- a fresh post-H012 Supabase policy count;
- whether the planned keep-alive will definitively prevent every Supabase Free pause;
- any Phase 4D2 database schema/RLS/Realtime implementation.

---

## 15. Git State

| Field | State |
|---|---|
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Local path | `C:\Projects\ttrpg-website` |
| Branch | **VERIFIED — `main`** |
| HEAD | **VERIFIED — `0de0290330438a8deeb933ad0eda25e531508276`** |
| `origin/main` | **VERIFIED — `0de0290330438a8deeb933ad0eda25e531508276`** |
| Ahead/behind | **VERIFIED — synchronized in final report** |
| Working tree | **VERIFIED — clean** |
| Changed files | none |
| Staged files | none |
| Untracked files | none |
| Last commit | `0de0290 Close Phase 4D1 documentation (#51)` |
| Last commit files | `docs/product/DICE_ROLLS.md`, `docs/product/ROADMAP.md` |
| Push | yes |
| Current Vercel deployment | READY at exact HEAD |
| Phase 4D1 working branches | **VERIFIED — cleaned locally/remotely** |

**REQUIRED:** before next work, re-run only the basic Git-state checks. Do not re-run application/database suites merely because a new chat started.

---

## 16. Known Problems and Risks

| Severity | Problem | Impact | Mitigation | Status |
|---|---|---|---|---|
| Low | CoC personal history shows 4 previous + current instead of intended 5 previous + current | One fewer previous CoC record visible than product requirement | Defer to later maintenance; investigate only when explicitly scheduled | KNOWN / DEFERRED |
| Medium process | `PROJECT_CONTEXT.md` still says authenticated Phase 4D1 acceptance is pending and contains older release facts | Next chat could regress to stale state if it trusts PROJECT_CONTEXT over H012/current code | H012/current code override it; update permanent context later | OPEN DOC MAINTENANCE |
| Low process | `ARCHITECTURE.md`, `DATABASE.md`, `SECURITY.md` contain stale baseline/version phrasing | May confuse future planning, especially CoC retention | Targeted permanent-doc sync; no broad rewrite | OPEN DOC MAINTENANCE |
| Medium process | Minimal Delta Verification Policy is agreed but not in `AGENTS.md` | Codex may again over-test or expand scope | Add policy to AGENTS in a small dedicated maintenance change | DECIDED / NOT IMPLEMENTED |
| Low infrastructure | Supabase project is on Free plan and can be paused during low usage | Temporary DB unavailability during quiet development periods | Planned safe application-level health/keep-alive task before Phase 5; reconsider Pro before real public use | PLANNED |
| Medium future | Phase 4D2 shared dice trust/persistence model is not yet designed | Cannot safely implement shared campaign history/realtime | First next task is architecture/product contract review | BLOCKS 4D2 IMPLEMENTATION |
| Low future | VtM V6 may materially differ from V5 | Could affect public-release system strategy | Reassess closer to V6 release/public readiness | PLANNING DEPENDENCY |

### Supabase Free maintenance task

**PLANNED — complete before Phase 5:**

Implement a small application-level database health/keep-alive flow:

```text
Vercel Cron
  -> protected Next.js maintenance endpoint
  -> a few lightweight real Supabase SELECTs
```

Requirements:
- no fake users;
- no fake personal-roll/history rows;
- no arbitrary user-data mutation;
- protect endpoint with `CRON_SECRET` or current safe supported equivalent;
- no manual OIDC token injection;
- observe whether inactivity warnings stop;
- treat this as mitigation, not a guaranteed SLA;
- reassess Supabase Pro before unrestricted/public availability.

---

## 17. Superseded Approaches

| Status | Superseded / prohibited approach | Current replacement |
|---|---|---|
| DEPRECATED | H011 as current continuation authority | H012 |
| DEPRECATED | Generic Dice Rollers page also showing personal history | Catalogue-only hub; history on each roller page |
| DEPRECATED | Global latest-11 personal history | scoped retention |
| DEPRECATED | CoC retaining 6 Percentile + 6 Other Dice separately | six rows total across combined CoC scope |
| DEPRECATED | Fixed “Back to Dice Rollers” / blind `router.back()` semantics | validated explicit internal `returnTo` with fallback |
| DEPRECATED | VtM-only Roll Label behavior / history without label display | label on all four personal rollers; explicit no-label fallback |
| DEPRECATED | CoC result-area `Target · Hard · Extreme` threshold line | live six-band guide below Target controls |
| DEPRECATED | Manual Vercel OIDC token injection through shell for protected Preview browser smoke | safe supported auth only; otherwise manual user verification |
| DEPRECATED | Re-running full tests/audits for every tiny delta | Minimal Delta Verification Policy |
| DEPRECATED | Autonomous fallback chains through alternate browsers/proxies/security bypasses | stop and request/manual-check when safe automation is unavailable |
| DEPRECATED | Treating standalone Video Rooms as active roadmap work | backlog idea only; no active phase |
| DEPRECATED | Raw backend `error.message` shown to users | sanitized localized error mapping |
| DEPRECATED | Base64 character images in JSONB | private Supabase Storage |
| DEPRECATED | Old non-localized application routes | locale-prefixed routing |
| DEPRECATED | Duplicating common character fields in `sheet_data` | common DB columns + system JSONB |

---

## 18. Open Questions

| Question | Blocking | Current Options | Recommended Decision Point |
|---|---|---|---|
| What exact Phase 4D2 campaign dice data/persistence contract should be used? | Yes, blocks implementation | ephemeral only; persisted immutable history; hybrid | Decide during Phase 4D2 design before migration/code |
| How should Phase 4D2 Realtime delivery work and what is persisted? | Yes if shared live feed is required | server action + Realtime table; other reviewed transport | Decide with persistence contract |
| What actor/character metadata belongs in campaign rolls? | Yes for schema | actor only; optional linked character; system payload | Decide before DB design |
| What are campaign-roll retention/deletion rules? | Yes if persistence exists | immutable session/history; bounded retention; archive policy | Decide before migration/RLS |
| How should labels work for campaign rolls? | No initially but should be explicit | reuse 120-code-point Roll Label; campaign-specific label contract | Decide in Phase 4D2 request contract |
| Root cause of CoC 4+current display | No | retrieval limit, dedup/filter interaction, UI display policy; **do not assume** | Later maintenance only |
| Should Supabase remain Free through Phase 5? | No now | keep-alive mitigation; Pro | Reassess before Phase 5/public availability |
| Should Minimal Delta policy be committed to AGENTS immediately? | No product blocker | small process-only PR before next implementation; carry in H012 instructions | Prefer before substantial Phase 4D2 coding |
| V5 vs V6 long-term | No now | continue V5; migrate later; replace before public | Reassess when V6 details/release timing are concrete |

---

## 19. Exact Next Task

### Task

**PLANNED / NEXT:** Review and lock the Phase 4D2 product/architecture contract for **system-aware Game Room Dice Integration** before any implementation.

### Goal

Define the smallest safe Phase 4D2 design that:
- derives the campaign system;
- uses VtM rules for VtM campaigns and CoC rules for CoC campaigns;
- executes shared campaign rolls server-side;
- reuses deterministic system evaluators without reusing personal-history trust;
- defines whether/what to persist;
- defines RLS/authorization;
- defines Realtime/shared-display behavior;
- preserves removal/completion access rules;
- avoids a speculative universal dice engine.

### Inputs

Read first:
1. `H012_CURRENT_HANDOFF.md`;
2. `docs/product/ROADMAP.md` — Phase 4D2;
3. `docs/product/DICE_ROLLS.md`;
4. `docs/product/CAMPAIGNS.md`;
5. `docs/architecture/ARCHITECTURE.md`;
6. `docs/architecture/DATABASE.md`;
7. `docs/architecture/SECURITY.md`;
8. ADR-007;
9. ADR-008;
10. current Game Room route/components/server authorization;
11. current VtM and CoC deterministic dice engines;
12. current game-system catalogue.

### Required decisions before coding

At minimum:
- request/result contract for campaign rolls;
- actor identity and optional character identity;
- server-side secure RNG strategy;
- persistence vs ephemeral-only decision;
- if persisted: schema, immutable fields, indexes, retention, RLS, delete policy;
- Realtime delivery scope and replay/history behavior;
- completed campaign behavior;
- removed Player behavior;
- GM/Player visibility;
- labels;
- EN/RU UI placement in Game Room;
- error handling;
- migration/backward compatibility.

### Completion criteria

Phase 4D2 planning is complete only when:
- product scope is explicit;
- server-authoritative trust boundary is explicit;
- persistence/Realtime decision is explicit;
- database/RLS contract is explicit if persistence is selected;
- VtM/CoC adapter boundary is explicit;
- UI location/behavior is explicit;
- user has approved the plan.

### Out of scope for the first next task

- do not write Phase 4D2 code yet;
- do not create a migration yet;
- do not fix the CoC 4+current known issue;
- do not implement CoC character sheets;
- do not perform Phase 4E UI refinement;
- do not implement campaign notes;
- do not implement the Supabase keep-alive yet;
- do not perform a full repository audit.

---

## 20. Resume Procedure

1. Open Windows CMD.
2. Go to `C:\Projects\ttrpg-website`.
3. Read H012 completely.
4. Run the minimal Git baseline commands from Section 21.
5. If `HEAD`, `origin/main`, branch, or clean status differs, inspect the delta before using this handoff.
6. Read the current Phase 4D2 sections/files listed in Section 19.
7. Do **not** start coding.
8. Present the existing Phase 4D2 plan to the user in compact terms.
9. Identify the minimum unresolved architecture/product decisions.
10. Discuss those decisions with the user **one proposal at a time**.
11. After the user approves the Phase 4D2 contract, prepare a minimal-delta Codex instruction.
12. For that Codex instruction, explicitly include:
    - Delta;
    - Already proven;
    - Required checks;
    - Forbidden rechecks.
13. If a later automated check cannot be done safely/reliably, stop that check and give the user a manual checklist instead of searching for bypasses.

---

## 21. Useful Commands

Windows CMD only:

```cmd
cd /d C:\Projects\ttrpg-website
git fetch origin --prune
git remote get-url origin
git branch --show-current
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git log -1 --stat --oneline
```

Expected H012 baseline:

```text
branch: main
HEAD: 0de0290330438a8deeb933ad0eda25e531508276
origin/main: 0de0290330438a8deeb933ad0eda25e531508276
working tree: clean
```

Do not run build/test/Supabase commands merely because a new chat started.

---

## 22. References

### Repository / Production

- Repository: `https://github.com/Andrey-0101/ttrpg-website`
- Current commit: `0de0290330438a8deeb933ad0eda25e531508276`
- Production: `https://ttrpg.fans`
- Current Vercel deployment: `dpl_6mJsK3JB3h4LRcxbFaQTUGSPoXJ4`
- Current functional Phase 4D1 PR #50 Production commit: `5acfc12cf9f60fe84e45dc5f4bd1a81a67e28a63`

### Handoffs / context

- `docs/handoffs/H011_CURRENT_HANDOFF.md` — historical after H012
- `H012_CURRENT_HANDOFF.md` — current continuation artifact
- `PROJECT_CONTEXT.md` — current broad context, but see stale Phase 4D1 notes in this handoff

### Product / architecture

- `docs/product/ROADMAP.md`
- `docs/product/DICE_ROLLS.md`
- `docs/product/CAMPAIGNS.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/DATABASE.md`
- `docs/architecture/SECURITY.md`
- `docs/architecture/I18N.md`

### ADRs

- `docs/decisions/ADR-007-campaign-foundation-before-shared-realtime-tools.md`
- `docs/decisions/ADR-008-game-system-domain-boundaries.md`
- `docs/decisions/ADR-009-managed-video-infrastructure.md` for current campaign-video boundary only

### Database

- `supabase/migrations/20260905171520_make_personal_roll_history_extensible.sql`
- `supabase/migrations/20260907114535_scope_personal_roll_history_by_kind.sql`
- `supabase/migrations/20260908094324_scope_coc_personal_roll_history.sql`
- `types/database.types.ts`

### Dice implementation

- `lib/dice/validation.ts`
- `lib/dice/secure-random.ts`
- `lib/dice/custom-dice-pool.ts`
- `lib/dice/personal-dice-persistence.ts`
- `lib/dice/personal-dice-persistence-service.ts`
- `lib/dice/personal-roll-recording.ts`
- `lib/game-systems/vtm-v5/dice-engine.ts`
- `lib/game-systems/vtm-v5/dice-roller.ts`
- `lib/game-systems/call-of-cthulhu-7e/dice-engine.ts`
- `lib/game-systems/call-of-cthulhu-7e/dice-roller.ts`
- `components/dice-rollers/personal-roll-history.tsx`
- `components/games/call-of-cthulhu-7e/dice-roller.tsx`

### Release PRs

- PR #46 — core CoC personal Dice Roller
- PR #47 — contextual navigation/scoped history/live CoC ranges
- PR #48 — UX follow-up docs
- PR #49 — heading correction
- PR #50 — Roll Labels + combined CoC retention
- PR #51 — Phase 4D1 final closeout documentation

---

## 23. Suggested Updates to Permanent Documents

These are **targeted** corrections. Do not convert them into a broad documentation rewrite.

| Document | Recommendation |
|---|---|
| `PROJECT_CONTEXT.md` | **UPDATE:** current main/release history through PR #51; authenticated Production acceptance passed; known CoC 4+current issue; current Phase 4D1 closed status; remove auth-pending wording |
| `docs/architecture/ARCHITECTURE.md` | **UPDATE:** stale production baseline; current CoC combined six-row retention rather than per-kind wording; Roll Label/current history contract where materially relevant |
| `docs/architecture/DATABASE.md` | **UPDATE:** top Production commit from older `abeada...` to current baseline; schema/migration detail itself is already largely current |
| `docs/architecture/SECURITY.md` | **UPDATE:** stale H011 baseline; Phase 4D1 migration count/retention language (“both”/per-kind) to current three-migration / combined-CoC state |
| `docs/architecture/I18N.md` | **NO CHANGE required for Phase 4D1 closeout** |
| `docs/product/CHARACTER_SHEETS.md` | **NO CHANGE** |
| `docs/product/ROADMAP.md` | **NO CHANGE — current after PR #51** |
| ADR files | **NO CHANGE — ADR-007/008 remain accepted and not superseded** |
| `docs/product/DICE_ROLLS.md` | **NO CHANGE — current after PR #51** |
| `AGENTS.md` | **UPDATE RECOMMENDED:** add the agreed Minimal Delta Verification Policy and safe-automation stop rule before substantial future Codex implementation |

**DECIDED:** permanent-doc corrections should be done as one small maintenance delta when convenient; they are not a reason to reopen Phase 4D1 or run functional regression suites.

---

## 24. Suggested Opening Message for the Next Chat

```text
Продолжаем проект TTRPG_website.

Repository:
https://github.com/Andrey-0101/ttrpg-website

Canonical local repo:
C:\Projects\ttrpg-website

Current main baseline:
0de0290330438a8deeb933ad0eda25e531508276

Сначала полностью прочитай H012_CURRENT_HANDOFF.md и проверь, что main/HEAD/origin/main и clean working tree соответствуют handoff. Старые handoff и фрагменты кода не используй вместо актуального commit.

Phase 4D1 закрыта и развернута в Production со специально зафиксированным minor issue: CoC history показывает 4 предыдущих + текущий вместо требуемых 5 предыдущих + текущий. Сейчас это не исправляем.

Следующий этап — Phase 4D2 Game Room Dice Integration.

Первая задача: НЕ писать код. Сначала изучи актуальные ROADMAP, DICE_ROLLS, CAMPAIGNS, ARCHITECTURE, DATABASE, SECURITY, ADR-007/008, текущий Game Room и VtM/CoC dice engines. Затем проверь существующий план Phase 4D2, покажи мне недостающие архитектурные/продуктовые решения и предложи корректировки по одному вопросу за раз.

Обязательно соблюдай Minimal Delta Verification Policy из H012: уже пройденные проверки без релевантной delta не повторять; если автоматическая проверка невозможна одновременно безопасно и надежно — остановиться и дать мне короткую ручную проверку, а не искать обходы.
```

---

## 25. Handoff Quality Check

### Commit/state consistency

**PASS:** GitHub `main` is `0de0290330438a8deeb933ad0eda25e531508276`.

**PASS:** Vercel current Production deployment is READY at the exact same SHA.

**PASS:** current commit changes only Phase 4D1 closeout documentation relative to functional Production commit `5acfc12...`.

### Current vs planned

**PASS:** Phase 4D1 capabilities are marked implemented/deployed.

**PASS:** Phase 4D2 campaign dice is marked planned.

**PASS:** no campaign-authoritative dice table/schema is invented.

**PASS:** CoC character sheets remain planned.

### Database assumptions

**PASS:** 13 applied migrations and current table/type contracts are grounded in migrations/generated types/current release evidence.

**PASS:** root cause of the known CoC history issue is explicitly unverified.

### Architecture decisions

**PASS:** personal vs campaign dice trust boundary retained.

**PASS:** ADR-007/008 constraints retained.

**PASS:** no universal dice engine is introduced.

### Process decisions

**PASS:** Minimal Delta Verification Policy and safe/manual fallback are preserved.

**PASS:** temporary OIDC shell-token approach is marked deprecated/forbidden without storing any token value.

### Next step

**PASS:** one exact next task is defined: Phase 4D2 plan/architecture review before code.

### Secrets / privacy

**PASS:** no API keys, passwords, service-role keys, `.env` values, database credentials, or token values are included.

### Continuation readiness

**PASS:** next chat can continue from H012 and current commit without reading the complete prior chat.
