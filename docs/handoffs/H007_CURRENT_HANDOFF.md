# H007_CURRENT_HANDOFF.md

## 1. Document Control

| Field | Value |
|---|---|
| Project | Web_Site_TTRPG |
| Handoff | H007_CURRENT_HANDOFF.md |
| Version | 1.0 |
| Creation date | 2026-07-27 (Australia/Perth, UTC+08:00) |
| Scope | Completion and production release of Personal Dice Persistence; production migration and smoke test; repository cleanup; roadmap correction; definition of the next cross-system catalogue task |
| Repository | https://github.com/Andrey-0101/ttrpg-website |
| Local path | `C:\Projects\ttrpg-website` |
| Shell | PowerShell |
| Active branch | `main` |
| Local HEAD | `5310f7a8444d05517f635ceefe76fc80d7d3e1ad` |
| `origin/main` | `5310f7a8444d05517f635ceefe76fc80d7d3e1ad` |
| Live remote `main` | `5310f7a8444d05517f635ceefe76fc80d7d3e1ad` |
| Ahead/behind | `VERIFIED`: synchronized; no divergence reported |
| Working tree | `VERIFIED`: clean |
| Fetch refspec | `+refs/heads/*:refs/remotes/origin/*` |
| Production URL | `https://ttrpg-website-xi.vercel.app` |
| Production deployment | `VERIFIED`: READY, commit `5310f7a8444d05517f635ceefe76fc80d7d3e1ad` |
| Latest applied migration | `20260722103835_personal_dice_persistence.sql` |
| Migration parity | `VERIFIED`: local and remote histories match; no pending migrations |
| Last relevant PR | PR #23 — **Add personal dice persistence** |
| Previous handoff | H006_CURRENT_HANDOFF.md |
| Evidence cut-off | End of current chat, after production smoke test, runtime-error check, branch cleanup, and fetch-refspec correction |

---

## 2. Instructions for the Next Chat

1. Read this handoff before proposing any implementation.
2. Verify repository URL, branch, HEAD, `origin/main`, live remote `main`, and working-tree state.
3. Inspect current files at commit `5310f7a8444d05517f635ceefe76fc80d7d3e1ad`.
4. Do not use old code from prior chats or historical handoffs when current code differs.
5. Treat Codex as an executor and repository inspector, not as an independent source of architecture truth.
6. Verify all `ASSUMED`, `UNVERIFIED`, `UNCOMMITTED`, and `BLOCKED` items before relying on them.
7. Reconcile the exact next task with current code and roadmap before writing code.
8. Preserve existing user data, current routes, EN/RU behaviour, and production functionality.
9. Do not invent tables, routes, components, RLS rules, migrations, or deployment state.
10. Start the next stage with a read-only repository audit through Codex.

---

## 3. Source-of-Truth Model

### Implementation and operational truth

1. Current repository at commit `5310f7a8444d05517f635ceefe76fc80d7d3e1ad`
2. Live Git remote for the same commit
3. Committed SQL migrations
4. Generated database types
5. Current tests and package scripts
6. Verified Supabase state
7. Verified GitHub PR/CI state
8. Verified Vercel production deployment
9. Actual production smoke tests
10. Permanent technical documentation
11. Current handoff
12. Current chat
13. Historical handoffs and chats

### Product and sequencing truth

1. Explicit user decisions in this chat
2. Newer accepted product and architecture decisions
3. Current roadmap and ADR status
4. Current permanent specifications
5. Current handoff
6. Older handoffs and chats

### Conflict rule

- Current code and operational evidence define what exists.
- The newest confirmed user decision defines what should happen next.
- Documentation drift must be recorded, not silently ignored.
- Suggestions are not `DECIDED` until accepted.

---

## 4. Codex Activity and Evidence

| Item | Status | Evidence |
|---|---|---|
| Codex used | `VERIFIED` | Used for repository audits, implementation, tests, migration preflight/application, branch cleanup, and Git verification |
| Read-only audits | `VERIFIED` | Multiple preflight checks were performed before write operations |
| Files inspected | `VERIFIED` | Dice persistence code, migration, tests, localization, generated types, and repository state |
| Files changed | `IMPLEMENTED` | 25 files in PR #23; exact changed-file list should be re-read from PR or Git if needed |
| Commands run | `VERIFIED` | Git checks, Supabase migration list/dry run/push, tests, lint, build, branch cleanup |
| Tests and builds | `VERIFIED` | pgTAP 145/145; application/persistence 146/146; concurrency PASS; lint/build/TypeScript PASS; static 36/36 |
| Git operations | `VERIFIED` | PR #23 merged; feature branch deleted locally/remotely; fetch refspec corrected |
| Database operations | `VERIFIED` | One production migration applied after backup and dry run |
| Deployment operations | `VERIFIED` | Vercel production deployment READY at merge commit |
| User approvals | `VERIFIED` | Production migration and branch deletion were explicitly approved |
| Independent verification | `VERIFIED` | User production smoke test succeeded; Vercel runtime errors checked |
| Remaining Codex work | `PLANNED` | Read-only audit of all game-system-separated surfaces before implementing cross-system placeholders |

---

## 5. Current Project Snapshot

### Stack

- `IMPLEMENTED`: Next.js 16.2.9 App Router
- `IMPLEMENTED`: TypeScript
- `IMPLEMENTED`: Tailwind CSS
- `IMPLEMENTED`: Supabase Auth, Postgres, Storage, Realtime foundation
- `IMPLEMENTED`: next-intl with EN/RU locale-prefixed routes
- `IMPLEMENTED`: GitHub Actions CI
- `DEPLOYED`: Vercel production

### Main modules

- `IMPLEMENTED`: authentication and profiles
- `IMPLEMENTED`: VtM V5 character creator/editor/list
- `IMPLEMENTED`: private portraits in Supabase Storage
- `IMPLEMENTED`: campaign foundation, invitations, memberships, character linking, read-only sharing
- `IMPLEMENTED`: deterministic VtM V5 dice evaluator
- `IMPLEMENTED`: public personal VtM roller
- `IMPLEMENTED`: public Custom Dice Pool
- `IMPLEMENTED`: saved Custom Dice Pool presets
- `IMPLEMENTED`: private personal roll history
- `PLANNED`: shared campaign dice
- `PLANNED`: managed-video provider comparison and spike
- `PLANNED`: minimal campaign video room

### Active milestone

- `DECIDED`: Milestone 4 — VtM Realtime Tools
- `IMPLEMENTED`: Phase 4A core capabilities
- `PLANNED`: one cross-system catalogue-completion slice remains before documentation synchronization and Phase 4B

### Operational limitations

- `VERIFIED`: Supabase Free Plan has no scheduled project backups and no PITR.
- `VERIFIED`: manual logical backup exists for the `public` schema/data and roles before the latest production migration.
- `UNVERIFIED`: full managed-schema restore procedure has not been tested.

---

## 6. Scope and Outcome of the Completed Chat

### Original objective

Complete and release Personal Dice Persistence after the personal VtM roller and Custom Dice Pool.

### Additional tasks that appeared

- configure and verify local Supabase on Windows;
- review migration safety and production backup requirements;
- apply the migration to production;
- run production smoke testing;
- check Vercel runtime errors;
- delete completed feature branches;
- repair the narrow Git fetch refspec;
- review the development sequence after Phase 4A;
- clarify that planned-system cards must apply across all game-system-separated sections, not only Dice Rollers Hub;
- create a universal end-of-chat prompt adapted to ChatGPT + Codex workflow.

### Final outcome

- Personal Dice Persistence was merged, deployed, migrated, and smoke-tested.
- Repository and remote were synchronized.
- The completed feature branch was removed locally and remotely.
- Standard fetch refspec was restored.
- The next product task was corrected from “start Phase 4B” to “complete cross-system placeholder catalogue across all relevant system-separated surfaces”.
- Permanent documentation remains stale and should be synchronized after the catalogue-completion slice.

---

## 7. Work Completed

| Status | Change | Files or Domain | Commit / Migration / PR | Verification |
|---|---|---|---|---|
| `IMPLEMENTED` | Saved private custom-dice presets | Custom Dice UI, server actions, persistence services | PR #23 | Tests and production smoke test |
| `IMPLEMENTED` | Private personal roll history | VtM and Custom roll persistence | PR #23 | Tests and production smoke test |
| `IMPLEMENTED` | Idempotent authenticated recording | Server persistence layer | PR #23 | Unit, server, concurrency, DB tests |
| `IMPLEMENTED` | Best-effort persistence isolation | Client/UI recording flow | PR #23 | Guest/auth/stale-session smoke tests |
| `IMPLEMENTED` | EN/RU persistence UI copy | Localization files | PR #23 | Build and manual checks |
| `MIGRATED` | Personal dice database schema | `20260722103835_personal_dice_persistence.sql` | Migration `20260722103835` | Remote migration parity and dry run |
| `VERIFIED` | Production backup | Off-repository logical dump | Pre-migration backup | File sizes and SHA-256 hashes checked |
| `DEPLOYED` | Personal dice persistence | Vercel production | Merge commit `5310f7a...` | READY + production smoke test |
| `VERIFIED` | Runtime health | Vercel runtime errors | Production | No errors found in selected post-release window |
| `VERIFIED` | Branch cleanup | Local and remote feature branch | `feature/personal-dice-persistence` | Both refs absent |
| `VERIFIED` | Git fetch configuration | `remote.origin.fetch` | Local Git config | Standard wildcard refspec restored |
| `IMPLEMENTED` | Universal end-of-chat prompt artifact | `/mnt/data/UNIVERSAL_END_OF_CHAT_PROMPT.md` | Chat artifact only | File created for download |

---

## 8. Work Discussed but Not Completed

| Status | Item | Source | Why Not Completed | Intended Destination |
|---|---|---|---|---|
| `DECIDED` | Add planned-system cards across every existing game-system-separated surface | Current chat | Requires repository-wide audit first | Exact next task |
| `DECIDED` | Preserve one canonical order and naming for planned systems | Current chat and roadmap | Not yet implemented | Exact next task |
| `RECOMMENDED` | Use a shared typed game-system catalogue rather than duplicated arrays | Current chat | Requires code audit to confirm existing metadata structure | Exact next task design decision |
| `PLANNED` | Synchronize ROADMAP, DICE_ROLLS, DATABASE, and related permanent docs | Current chat | Best done once after catalogue-completion slice | Near-term sequence |
| `PLANNED` | Create next documentation handoff after Phase 4A closure | Current chat | Depends on catalogue and documentation sync | Near-term sequence |
| `PLANNED` | Phase 4B shared campaign dice contract/security design | Roadmap | Must not start before catalogue and documentation gate | Future near-term phase |
| `PROPOSED` | Specific Phase 4B sub-slice breakdown | Current chat recommendation | Not yet explicitly approved as permanent roadmap structure | Decision point before Phase 4B |
| `PLANNED` | Managed-video provider comparison/spike | Roadmap | Later Phase 4C | Future milestone |
| `PLANNED` | Minimal campaign video room | Roadmap | Depends on provider decision | Future milestone |
| `UNVERIFIED` | Cleanup of older remote branches | Current Git state | Requires ancestry and relevance audit | Repository housekeeping |
| `RECOMMENDED` | Store universal end-of-chat prompt in a durable project location | Current chat | Artifact exists but is not committed to repository | Documentation/process decision |

---

## 9. Relevant File Map

The next chat must verify exact paths before implementation.

| Path | Purpose | Current State | Why It Matters Next |
|---|---|---|---|
| `docs/product/ROADMAP.md` | Product sequence and system catalogue plan | `HISTORICAL/STALE` in parts | Contains approved system order and stale persistence status |
| `docs/product/DICE_ROLLS.md` | Dice architecture and feature status | `STALE` | Must be synchronized after catalogue completion |
| `docs/architecture/DATABASE.md` | Database/RLS state | `STALE` | Does not yet describe latest personal persistence migration |
| `docs/architecture/ARCHITECTURE.md` | Platform boundaries | `UNVERIFIED` for current commit | May require sync after Phase 4A closure |
| `docs/architecture/SECURITY.md` | Security model | `UNVERIFIED` for latest persistence state | Review after catalogue slice |
| `docs/architecture/I18N.md` | Localization design | `UNVERIFIED` | Relevant to cross-system naming and status labels |
| `docs/handoffs/H006_CURRENT_HANDOFF.md` | Previous current handoff | `HISTORICAL` after H007 | Must not be treated as current |
| `app/[locale]/dice-rollers/page.tsx` or current equivalent | Dice Rollers Hub | `IMPLEMENTED` | One confirmed system-separated surface |
| `app/[locale]/characters/new/page.tsx` or current equivalent | Character system selection | `IMPLEMENTED` | Must be audited for planned-system cards |
| campaign-creation route/component | Campaign system selection | `IMPLEMENTED` | Exact path must be discovered |
| games catalogue/hub route | Game-system catalogue | `IMPLEMENTED` | Exact path must be discovered |
| shared card or system metadata components | Reusable system presentation | `UNVERIFIED` | Determine whether a canonical registry exists |
| `messages/en.json`, `messages/ru.json` and namespaced dictionaries | EN/RU labels | `IMPLEMENTED` | Must stay synchronized |
| `package.json` | Current verification scripts | `IMPLEMENTED` | Must be inspected before selecting commands |

---

## 10. Current Data and Domain Contracts

### Personal dice persistence

`IMPLEMENTED`:

- saved custom dice presets are private and owner-scoped;
- maximum five presets per user;
- saved quantities include Coin and all supported numeric dice;
- personal roll history includes VtM V5 and Custom Dice Pool;
- authenticated rolls are recorded automatically on a best-effort basis;
- guest rolls are not persisted;
- persistence failure does not alter or remove the visible local result;
- owner-scoped idempotency uses `owner_id + client_roll_id`;
- current roll plus ten previous rolls are retained per owner;
- personal rolls remain non-authoritative and are not campaign evidence.

### Campaign dice

`PLANNED`:

- must be separate from personal history;
- must use server-authoritative random generation;
- must use server-authoritative VtM evaluation;
- must enforce campaign membership and character access;
- must use immutable shared history;
- must later support campaign-scoped Realtime.

### Character data

`IMPLEMENTED`:

- VtM V5 character `schemaVersion` remains 3;
- common character data remains in ordinary columns;
- system-specific data remains in `sheet_data`;
- existing user data must remain backward compatible.

---

## 11. Database, RLS, Storage, and Backup State

### Applied migrations

`VERIFIED` local/remote parity:

```text
20260630143000
20260702150000
20260709150000
20260709163000
20260709170000
20260722103835
```

Latest file:

```text
supabase/migrations/20260722103835_personal_dice_persistence.sql
```

### Personal persistence objects

`IMPLEMENTED` and `MIGRATED`:

- `public.custom_dice_presets`
- `public.personal_roll_history`
- security-definer RPCs for create/update/delete presets and record/delete/clear personal rolls
- owner-scoped RLS and minimum grants
- revoked broad defaults
- concurrency-safe preset allocation
- idempotent roll recording
- retention enforcement

Exact columns, constraints, indexes, policies, and signatures must be re-read from the committed migration before future DB work.

### Storage

`IMPLEMENTED` historical current state:

- private `character-portraits` bucket
- owner/character path convention
- signed URL display
- owner-only mutation
- campaign-aware read access

No Storage changes were made in the completed chat.

### Backup

`VERIFIED` pre-migration logical backup directory:

```text
C:\Users\anryj\Documents\SupabaseBackups\ttrpg-website\20260727-002416-pre-personal-dice-persistence
```

Files:

```text
public-schema.sql
public-data.sql
roles.sql
```

Limitations:

- covers `public` schema/data and roles;
- does not prove a full restore path for all managed schemas;
- Supabase Free Plan provides no scheduled project backups or PITR.

---

## 12. Confirmed Architectural and Product Decisions

| Decision | Status | Reason | Source / Related Files / ADR |
|---|---|---|---|
| Deterministic evaluation is separate from random generation | `DECIDED` | Testability and trust | ADR-008 / dice engine |
| Personal rolls are non-authoritative | `DECIDED` | They are client-generated convenience history | PR #23 and dice docs |
| Campaign rolls must be server-authoritative | `DECIDED` | Shared integrity and trust | Roadmap / dice architecture |
| Personal and campaign roll histories remain separate | `DECIDED` | Different authority and access models | Current chat / roadmap |
| Applied migrations are immutable | `DECIDED` | Safe migration history | Database docs |
| Generated database types are not edited manually | `DECIDED` | Schema consistency | Database workflow |
| Exactly one immutable GM per campaign | `DECIDED` | Campaign authorization model | Campaign foundation |
| Functionality precedes final visual identity | `DECIDED` | Friend-alpha workflow first | Product strategy |
| Planned-system cards must not imply implementation | `DECIDED` | Avoid fake functionality | Current chat |
| Planned-system cards must be added across all relevant system-separated sections | `DECIDED` | Cross-product consistency | Current chat |
| Custom Dice Pool is system-neutral, not a game system | `DECIDED` | Domain correctness | Current chat / dice implementation |
| Cross-cutting changes require repository-wide surface audit before implementation | `DECIDED` | Prevent omissions and duplicate metadata | Current chat |
| Do not start Phase 4B before catalogue completion and documentation synchronization | `DECIDED` | Preserve agreed sequence | Current chat |

---

## 13. Functional Requirements Preserved

- EN/RU parity across user-facing system names and statuses.
- Locale-prefixed routing remains intact.
- No fake active links for unimplemented systems.
- Placeholder state must be explicit and accessible.
- Desktop and mobile layouts must both be checked.
- Existing VtM functionality must remain active only where implemented.
- System-neutral tools must not be misclassified as systems.
- User data must not be lost or rewritten.
- Raw backend errors must not be shown to users.
- Guest and authenticated states must remain distinct.
- Existing campaign and character permissions must not regress.
- New shared data must use server-side authority and authorization.
- Production changes require controlled verification.

---

## 14. User Requirements and Working Preferences

- Windows environment.
- Current terminal workflow is PowerShell.
- Use `npx.cmd` when required for Windows CLI reliability.
- Do not mix CMD and PowerShell continuation syntax.
- Provide sequential, controlled instructions.
- Prefer one write operation per stage.
- Inspect current files before replacing or editing them.
- Source code and source-code comments should be in English.
- Explanations to the user may be in Russian.
- Prefer production-quality, maintainable solutions.
- Correctness and evidence are more important than speed.
- Do not expose raw backend errors.
- Do not lose existing user data.
- Use backups and dry runs before production migrations.
- Delete feature branches only after merge, deployment, migration where applicable, and smoke testing.
- Use Codex under a precise scoped prompt.
- Synchronize permanent documentation at logical stage boundaries.

---

## 15. Localization State

- `IMPLEMENTED`: locales `en` and `ru`.
- `IMPLEMENTED`: locale-prefixed routes.
- `IMPLEMENTED`: persisted locale behaviour.
- `IMPLEMENTED`: site locale remains separate from VtM sheet language.
- `IMPLEMENTED`: current dice tools have EN/RU UI.
- `PLANNED`: cross-system catalogue names and planned/unavailable labels must be consistent across all relevant surfaces.
- `UNVERIFIED`: current exact dictionary namespaces and key parity after PR #23 should be re-read from current files.

---

## 16. Verification Evidence

| Check | Command / Method | Result | Applies to Commit | Notes |
|---|---|---|---|---|
| Database tests | pgTAP | 145/145 PASS | Feature/merge state | Verified in PR #23 |
| App/persistence tests | repository scripts | 146/146 PASS | Feature/merge state | Verified in PR #23 |
| Concurrency | dedicated test | PASS | Feature/merge state | Verified |
| Lint | repository script | PASS | Final feature state | Verified |
| TypeScript/build | build pipeline | PASS | Final feature state | 36/36 static pages |
| Diff check | `git diff --check` | PASS | Final feature state | Verified |
| Migration preflight | `migration list`, dry run | One pending migration only | Pre-production | Verified |
| Production migration | `db push --linked` | SUCCESS | Production DB | One migration applied |
| Post-migration parity | migration list + dry run | Synchronized; up to date | Production DB | Verified |
| Guest smoke test | Browser + DB count | No persistence | Production | Verified by user |
| Authenticated presets | Browser + DB | Create/update/load/delete work | Production | Verified by user |
| Authenticated VtM/Custom rolls | Browser + DB | Correct rows persisted | Production | Verified by user |
| RU localization | Browser | Works | Production | Verified by user |
| Vercel runtime errors | Vercel check | None in selected period | Production | Verified after smoke test |
| Git cleanup | Git commands | Main clean; feature branch removed | Final repository state | Verified |
| Fetch refspec | Git config | Standard wildcard refspec | Final local state | Verified |

---

## 17. Git, GitHub, Branch, and CI State

- Branch: `main`
- HEAD: `5310f7a8444d05517f635ceefe76fc80d7d3e1ad`
- `origin/main`: same SHA
- live remote `main`: same SHA
- working tree: clean
- fetch refspec: `+refs/heads/*:refs/remotes/origin/*`
- PR #23: merged
- production deployment: READY
- completed feature branch: deleted locally and remotely
- current visible remote branches after refspec repair:

```text
origin/HEAD -> origin/main
origin/docs/architecture-baseline
origin/feat/localize-profile-characters
origin/feature/vtm-v5-a4-layout
origin/feature/vtm-v5-full-character-sheet
origin/fix/character-card-actions
origin/main
```

`UNVERIFIED`: whether the older non-main remote branches are safe to delete. They require separate ancestry and relevance audit.

---

## 18. Deployment and Operational State

- Platform: Vercel
- Project: `ttrpg-website`
- Stable URL: `https://ttrpg-website-xi.vercel.app`
- Deployment commit: `5310f7a8444d05517f635ceefe76fc80d7d3e1ad`
- Deployment status: `READY`
- Production smoke test: `VERIFIED`
- Runtime errors: none found in the checked post-release window
- Database: Supabase
- Plan: Free
- Scheduled backups: unavailable
- PITR: unavailable
- Manual logical backup: verified
- Restore testing: `UNVERIFIED`
- No secrets should be copied into future chats.

---

## 19. Roadmap Reconciliation

| Item | Implementation | Decision | Roadmap / Docs | Required Update |
|---|---|---|---|---|
| Personal VtM roller | `IMPLEMENTED/DEPLOYED` | Accepted | Mostly current | Minor status review |
| Custom Dice Pool | `IMPLEMENTED/DEPLOYED` | Accepted | Partly current | Update persistence statements |
| Saved presets | `IMPLEMENTED/DEPLOYED/MIGRATED` | Accepted | Still shown as future in places | Update |
| Personal history | `IMPLEMENTED/DEPLOYED/MIGRATED` | Accepted | Still shown as future in places | Update |
| Personal persistence DB | `MIGRATED` | Accepted | DATABASE.md stale | Update |
| Cross-system placeholder catalogue | Not implemented | `DECIDED` | Planned in ROADMAP | Implement next |
| Catalogue across all system-separated surfaces | Not implemented | `DECIDED` in current chat | Not fully captured in permanent docs | Add after implementation |
| Phase 4B shared campaign dice | Not implemented | Planned | Current roadmap next major phase | Start only after gates |
| Documentation synchronization | Not complete | `DECIDED` | Needed | Perform after catalogue slice |
| H007 current handoff | Created as chat artifact | `DECIDED` | Not tracked yet | Decide whether to commit in documentation PR |

---

## 20. Current Approved Development Sequence

### Exact Next Task

Audit every existing game-system-separated surface and implement a consistent planned-system placeholder catalogue across all relevant sections, not only the Dice Rollers Hub.

### Near-Term Sequence

| Order | Step | Status | Dependency | Completion Gate |
|---|---|---|---|---|
| 1 | Read-only audit of all system-separated surfaces and metadata sources | `DECIDED` | Clean synchronized main | Complete surface/file map |
| 2 | Approve shared catalogue architecture and implementation scope | `DECIDED` | Audit result | User approval |
| 3 | Implement planned-system placeholders across all relevant surfaces | `DECIDED` | Approved design | Tests/build/mobile/EN-RU pass |
| 4 | Merge, deploy, and production-smoke-test catalogue slice | `DECIDED` | PR and CI | Production verified |
| 5 | Synchronize permanent documentation and add current handoff | `DECIDED` | Catalogue production verified | Documentation PR merged |
| 6 | Design Phase 4B campaign-dice contract and security model | `PLANNED` | Phase 4A/documentation closure | User-approved contract |
| 7 | Implement shared campaign dice in controlled sub-slices | `PLANNED` | Approved contract | DB, RLS, UI, Realtime verification |

### Do-Not-Skip Gates

- repository-wide surface audit before editing;
- confirm whether a shared game-system registry already exists;
- no duplicated hardcoded system arrays without design review;
- no fake active links;
- user approval before implementation;
- EN/RU and mobile verification;
- production smoke test;
- documentation synchronization before Phase 4B;
- security contract before shared campaign-dice migration.

---

## 21. Known Problems and Risks

| Severity | Problem | Impact | Mitigation | Status |
|---|---|---|---|---|
| Medium | Permanent docs are stale after PR #23 | Next chat may repeat completed work | Synchronize after catalogue slice | `OPEN` |
| Medium | Game-system metadata may be duplicated across pages | Inconsistent order/names/status | Audit and centralize if appropriate | `OPEN` |
| Medium | Placeholder cards could link to unimplemented routes | Misleading UX and broken navigation | Explicit unavailable state; no active route | `OPEN` |
| High | Personal history could be confused with campaign evidence | Trust/security issue | Preserve strict domain separation | `DECIDED` |
| High | Future campaign rolls could accept client-authored results | Integrity issue | Server-authoritative execution | `DECIDED` |
| Medium | Free Supabase plan lacks automated backups/PITR | Recovery risk | Manual backups before production DB changes | `OPEN` |
| Low | Older remote branches remain | Repository clutter/confusion | Separate ancestry/relevance audit | `UNVERIFIED` |
| Medium | Universal prompt artifact is not yet durable in repo | Process may be lost | Decide storage in documentation workflow | `OPEN` |

---

## 22. Superseded and Forbidden Approaches

- `DEPRECATED`: showing raw backend `error.message` to users.
- `DEPRECATED`: editing an already-applied migration.
- `DEPRECATED`: manually editing generated database types.
- `DEPRECATED`: treating planned DB columns/tables as existing.
- `DEPRECATED`: using personal client-generated rolls as authoritative campaign history.
- `DEPRECATED`: creating active links to unimplemented system routes.
- `DEPRECATED`: duplicating game-system metadata across surfaces without first auditing for a shared registry.
- `DEPRECATED`: force-deleting branches without ancestry verification.
- `DEPRECATED`: relying on a narrow feature-only fetch refspec after the feature branch is removed.
- `DEPRECATED`: starting Phase 4B before the agreed catalogue and documentation gates.

---

## 23. Open Questions and Decision Gates

| Question | Blocking | Current Options | Decision Owner | Recommended Decision Point |
|---|---|---|---|---|
| Does a canonical typed game-system registry already exist? | Yes for design | Reuse / extend / create | User + architecture review | After read-only audit |
| Which existing system-separated surfaces are in scope? | Yes | Determined by repository audit | User + Codex audit | Before branch creation |
| What exact planned/unavailable terminology should be used? | Yes for UI copy | Planned / Coming later / Unavailable | User | Before localization work |
| Should placeholders have disabled controls or no controls? | Yes for UX | Disabled button / status-only card | User | Before implementation |
| Where should the universal end-of-chat prompt be stored permanently? | No for feature | Repo docs / project files / external library | User | Documentation sync stage |
| Campaign roll visibility model | Future blocking | All members / GM-only / roller-only variants | User | Phase 4B contract |
| Completed campaign roll behaviour | Future blocking | Read-only / disabled new rolls | User | Phase 4B contract |
| Campaign roll retention and deletion | Future blocking | Unlimited / bounded / no deletion / GM controls | User | Phase 4B contract |
| Session association in first campaign-dice slice | Future blocking | Include now / defer | User | Phase 4B contract |
| Realtime publication/subscription model | Future blocking | Table publication / server-mediated alternatives | Architecture review | Before Realtime implementation |

---

## 24. Exact Next Task Specification

### Objective

Find every current UI surface that presents, filters, or selects by game system, then implement one consistent planned-system catalogue across those surfaces.

### Why it is next

- Personal persistence is complete.
- The current roadmap includes a placeholder-system stage.
- The user clarified that the requirement applies across the product, not only Dice Rollers Hub.
- Permanent documentation should be synchronized after this final Phase 4A completion slice to avoid duplicate documentation PRs.

### Required first inspection

- current game-system constants or registry;
- Games catalogue/hubs;
- Dice Rollers Hub;
- character creation system selection;
- campaign creation system selection;
- dashboard/system cards;
- navigation and tool directories;
- shared card components;
- EN/RU dictionaries;
- tests;
- roadmap and design docs.

### Cross-cutting surfaces

All actual system-separated surfaces discovered in current code. Do not assume a route or component exists until verified.

### Dependencies

- clean synchronized `main`;
- read-only Codex audit;
- user approval of final surface list and metadata approach.

### Implementation boundaries

In scope:

- planned-system cards/statuses;
- consistent order and names;
- shared metadata where appropriate;
- EN/RU;
- accessibility;
- responsive layout;
- current VtM availability;
- Custom Dice Pool remaining system-neutral.

Out of scope:

- new dice engines;
- new character sheets;
- new campaign support;
- migrations;
- RLS;
- Realtime;
- Phase 4B implementation;
- video;
- final visual identity.

### Completion criteria

- all relevant surfaces audited;
- approved system order used consistently;
- no fake routes;
- no broken links;
- VtM active only where functionality exists;
- planned systems clearly marked;
- Custom Dice Pool remains system-neutral;
- EN/RU parity;
- desktop/mobile checked;
- accessibility checked;
- current lint/tests/build pass;
- production deployment and smoke test pass;
- permanent docs synchronized afterward.

---

## 25. Resume Procedure

1. Read H007.
2. Verify repository URL and local path.
3. Verify `main`, HEAD, `origin/main`, live remote `main`, and working tree.
4. Read `package.json`, current roadmap, current handoff, and relevant system pages.
5. Verify outstanding assumptions.
6. Give Codex a strict read-only audit prompt.
7. Obtain a complete list of game-system-separated surfaces.
8. Determine whether a shared system registry already exists.
9. Review the audit and approve the implementation design.
10. Create a feature branch.
11. Implement in controlled slices.
12. Run current repository checks.
13. Review PR and CI.
14. Merge and deploy.
15. Perform production smoke testing.
16. Synchronize permanent documentation.
17. Create the next handoff at the next chat boundary.
18. Only then begin Phase 4B contract/security design.

---

## 26. Useful Commands

Use current PowerShell equivalents after verifying the repository:

```powershell
Set-Location "C:\Projects\ttrpg-website"

git fetch origin --prune
git remote get-url origin
git branch --show-current
git status
git status --short --untracked-files=all
git rev-parse HEAD
git rev-parse origin/main
git ls-remote origin refs/heads/main
git rev-list --left-right --count main...origin/main
git log -1 --stat --oneline
git config --get-all remote.origin.fetch
git branch -r
```

Read current scripts:

```powershell
Get-Content package.json
```

Search likely system metadata and surfaces:

```powershell
git grep -n "game_system"
git grep -n "gameSystem"
git grep -n "systems"
git grep -n "dice-rollers"
git grep -n "Vampire: The Masquerade"
git grep -n "planned"
git grep -n "coming soon"
```

Select verification commands only after reading current `package.json`.

---

## 27. References

- Repository: `https://github.com/Andrey-0101/ttrpg-website`
- Production: `https://ttrpg-website-xi.vercel.app`
- Current commit: `5310f7a8444d05517f635ceefe76fc80d7d3e1ad`
- PR #23: Add personal dice persistence
- Previous handoff: `H006_CURRENT_HANDOFF.md`
- Current roadmap: `docs/product/ROADMAP.md`
- Dice specification: `docs/product/DICE_ROLLS.md`
- Database documentation: `docs/architecture/DATABASE.md`
- Security documentation: `docs/architecture/SECURITY.md`
- Architecture: `docs/architecture/ARCHITECTURE.md`
- Localization: `docs/architecture/I18N.md`
- Migration: `supabase/migrations/20260722103835_personal_dice_persistence.sql`
- Generated types: `types/database.types.ts`
- Universal end-of-chat prompt artifact: `UNIVERSAL_END_OF_CHAT_PROMPT.md` from current chat

---

## 28. Suggested Updates to Permanent Documentation

| Document | Action | Required Update |
|---|---|---|
| `PROJECT_CONTEXT.md` | REVIEW | Current commit, personal persistence, next sequence |
| `README.md` | REVIEW | Current feature summary if it lists dice capabilities |
| `docs/README.md` | REVIEW | Current handoff and document index |
| `docs/product/ROADMAP.md` | UPDATE | Mark personal persistence complete; record catalogue completion; next Phase 4B gate |
| `docs/product/DICE_ROLLS.md` | UPDATE | Saved presets, personal history, authority boundaries, status |
| `docs/architecture/DATABASE.md` | UPDATE | Migration 20260722103835, tables, RLS, RPCs, grants, retention/idempotency |
| `docs/architecture/SECURITY.md` | REVIEW/UPDATE | Personal persistence authorization and future campaign boundary |
| `docs/architecture/ARCHITECTURE.md` | REVIEW | Shared system catalogue boundary if introduced |
| `docs/architecture/I18N.md` | REVIEW | Cross-system catalogue localization approach |
| `CHARACTER_SHEETS.md` | NO CHANGE unless selector metadata changes | Only update if shared system registry affects it |
| campaign specification | REVIEW | Only if campaign system selector changes |
| site structure docs | UPDATE if catalogue surfaces change | Routes and availability states |
| ADR-008 | REVIEW | Usually no status change |
| ADR-009 | NO CHANGE | Remains proposed until video spike |
| current handoff index | UPDATE | Add H007 and mark H006 historical |

Do not perform these documentation changes until the agreed catalogue-completion gate.

---

## 29. Suggested Opening Message for the Next Chat

```text
We are continuing the Web_Site_TTRPG project.

Repository:
https://github.com/Andrey-0101/ttrpg-website

Current commit:
5310f7a8444d05517f635ceefe76fc80d7d3e1ad

Read H007_CURRENT_HANDOFF.md first.

The current milestone is Milestone 4 — VtM Realtime Tools. Personal Dice
Persistence is merged, deployed, migrated, and production-smoke-tested.

The exact next task is to audit every existing game-system-separated surface
and implement one consistent planned-system placeholder catalogue across all
relevant sections, not only the Dice Rollers Hub.

Before proposing code, verify the repository, current files, roadmap, and
sources of truth. Use Codex for a strict read-only repository audit first.
Do not begin Phase 4B shared campaign dice until the catalogue is implemented,
verified in production, and permanent documentation is synchronized.
```

---

## 30. Handoff Quality Check

- Handoff number derived from the existing H001–H006 sequence.
- Current state tied to commit `5310f7a8444d05517f635ceefe76fc80d7d3e1ad`.
- Local, tracking, and live remote refs are separated.
- Personal persistence is not confused with campaign-authoritative history.
- Deployment and migration claims are backed by chat evidence.
- Cross-cutting catalogue scope is preserved.
- Additional tasks and deferred work are recorded.
- Roadmap drift is explicit.
- One exact next task and a near-term sequence are present.
- Open Phase 4B decisions remain unresolved.
- No secrets or `.env` values are included.
- The next chat can continue without reading the full current chat.

```text
Handoff Quality Check: PASSED
```
