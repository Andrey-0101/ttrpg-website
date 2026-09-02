# H011_CURRENT_HANDOFF.md

## 1. Document control

| Field | Value |
|---|---|
| Handoff | `H011_CURRENT_HANDOFF.md` |
| Created | 2026-09-01 |
| Status | Current authoritative continuation handoff |
| Canonical local path | `C:\Projects\ttrpg-website` |
| Canonical branch | `main` |
| Canonical remote | `origin/main` |
| H011 consolidation source baseline | `609b6d9ec972bc842bfc8de4e4080eecdb10d4c8` |
| H011 consolidation publication | PR #36, merge commit `4799514e782da769cd18c5eaefe22f61b10dac3c`, deployed `READY` |
| Final cleanup-record publication | The `origin/main` commit containing this finalization; see the final execution report and Git history for its exact SHA |
| Previous handoff | `H010_CURRENT_HANDOFF.md` |

H011 is current. H001–H010 are historical and must not override current code, migrations, verified infrastructure, or this handoff. H009 remains the detailed historical release and acceptance record for Campaign Game Room and LiveKit.

The exact SHA of the commit containing this file cannot be embedded in that same commit because changing the embedded SHA changes the commit. Resolve the final `origin/main` commit with `git rev-parse origin/main`; the publication result is also stated explicitly in the H011 completion report.

## 2. Canonical product state

The canonical Production origin is `https://ttrpg.fans`. `https://www.ttrpg.fans` redirects permanently to the apex domain. The application is a private friend-alpha bilingual TTRPG hub built with Next.js 16.3.3, React 19.2.4, TypeScript, Tailwind CSS 4, `next-intl`, Supabase PostgreSQL/Auth/RLS/Storage, LiveKit, Vercel, and GitHub.

Post-H011 infrastructure synchronization (2026-09-02): Vercel Function compute is pinned by `vercel.json` to Tokyo (`hnd1`), alongside Supabase Production in Tokyo (`ap-northeast-1`). The Function region was changed from the previous Virginia default (`iad1`); a small Production comparison measured approximately 30% lower overall median TTFB after the change. No application, feature, or database behavior changed.

Implemented current capabilities include:

- localized English and Russian routes, authentication, profiles, Dashboard, and Account;
- VtM V5 character creation and editing, private portraits, campaign visibility, and shared read-only campaign sheets;
- Campaign Foundation with one immutable GM, invitations, at most six ordered Players, character linking, completion, and deletion;
- a generic Call of Cthulhu 7e campaign shell without CoC character or dice implementation;
- public personal VtM and Custom dice rollers, saved Custom presets, and private personal history;
- campaign-authorized LiveKit video at `/{locale}/campaigns/{campaignId}/game-room`;
- a responsive seven-slot Game Room layout with one GM slot and Player positions 1–6, explicit Join/Leave, local camera and microphone controls, stable participant placement, reconnect handling, and sanitized failure states.
- image-only Campaign Handouts at `/{locale}/campaigns/{campaignId}/handouts`, with private signed delivery, active-GM upload/access/deletion controls, RLS-filtered Player viewing, and completed-campaign read-only/denial behavior.

Supported Campaign Game Room capacity is one GM plus up to six Players. The last accepted Production human test involved one GM and four Players. It passed. No quantitative packet-loss, latency, jitter, reconnect timeline, or per-participant connection-quality telemetry was captured; do not invent such evidence.

Standalone Video Rooms are not implemented. LiveKit is accepted for the current campaign Game Room only; ADR-009 does not automatically select a provider, schema, ownership, or authorization model for future standalone rooms.

## 3. Architecture and security boundary

- Next.js App Router server components and server actions own privileged application operations.
- Supabase Auth establishes identity; PostgreSQL RLS remains the database authorization boundary.
- Provider credentials and token issuance remain server-only.
- Campaign video performs fresh authenticated campaign authorization before issuing a short-lived, room-bound token.
- Room and participant identities are derived server-side and do not expose raw application identifiers.
- The browser creates a provider session only after explicit Join; camera and microphone remain off until individually enabled.
- A site-wide response-header policy now supplies CSP, clickjacking denial, MIME-sniffing denial, a restricted referrer policy, and same-origin-only camera/microphone permissions. Production HSTS remains platform-supplied.

## 4. Database and connected-project verification

The repository contains nine ordered, forward-only migrations. The Phase 4C1 release added `20260902132447_allow_completed_campaign_image_cleanup.sql` after connected inspection confirmed that the existing active-only upload helper could not authorize represented-object cleanup before completed-campaign deletion.

Connected metadata verification found:

- project health `ACTIVE_HEALTHY`;
- 15 public tables, all with RLS enabled and at least one policy;
- 41 public-schema policies;
- two private Storage buckets, zero public buckets, and eight Storage policies;
- zero invalid indexes, zero unvalidated constraints, and no public views;
- 39 `SECURITY DEFINER` functions, all with explicit `search_path`; none is executable by `anon`;
- 23 authenticated-executable `SECURITY DEFINER` functions are the reviewed RPC or RLS-helper surface. Their grants are intentional, their functions bind identity directly or through reviewed identity helpers, and removing execution would break the implemented RLS/RPC contract;
- generated `public` schema TypeScript is an exact normalized match to `types/database.types.ts`. The checked-in file additionally retains the generated `graphql_public` schema surface.

Supabase advisors report the intentional authenticated `SECURITY DEFINER` surface, one warning that leaked-password protection is disabled, informational unused-index notices on the young/low-volume schema, and one multiple-permissive-policy warning for the intentionally separate character-owner and campaign-sharing SELECT paths. No advisor item demonstrated unauthorized access, missing RLS, unsafe search path, invalid index, or schema drift. Leaked-password protection remains a separately hosted Auth hardening setting and is not changed by repository publication.

Recent connected logs showed successful API responses, no Auth or Storage server errors, no Realtime errors, and one isolated failed database-password authentication event with no evidence that it came from this release.

## 5. Engineering review and changes

H011 reviewed all application source, routes, server modules, components, hooks, utilities, localization, SQL, tests, scripts, configuration, generated types, tracked assets, and documentation.

Results:

- 159 local TypeScript/TSX modules were analyzed; 158 are reachable from application, test, script, proxy, or i18n roots, and the remaining root is itself an entry point. No orphan source module was found.
- Every imported package is declared. No genuinely unused direct dependency was found.
- No `TODO`, `FIXME`, `HACK`, `XXX`, TypeScript suppression, explicit `any`, or ESLint bypass was found.
- No duplicate application module or utility was found. Three byte-identical parallel-route header fallbacks are intentionally retained because Next.js requires each file location.
- Campaign participant data uses bounded batched queries and does not contain an obvious N+1 path.
- All eight tracked public image assets are referenced by code, tests, or their licensing/asset documentation.
- No abandoned spike route, provider prototype, or temporary evidence tooling was merged into the canonical product.
- The only application correction was the missing site-wide response-header policy. No speculative refactor, package removal, route redesign, or unsupported performance claim was made.

## 6. Verification completed for H011

The final aggregate gate completed against the consolidation tree:

| Gate | Result |
|---|---|
| Clean dependency installation | PASS — 401 packages installed |
| npm audit | PASS — 0 vulnerabilities at every severity |
| ESLint | PASS |
| TypeScript `--noEmit` | PASS |
| Site URL tests | PASS — 13/13 |
| Dice tests | PASS — 158/158 |
| Campaign tests | PASS — 21/21 |
| Game Room tests | PASS — 9/9 |
| Campaign-video tests | PASS — 38/38 |
| Production build | PASS — Next.js 16.3.3, 36/36 pages |
| Markdown links and anchors | PASS after H011 creation |
| Credential/privacy scan | PASS — no high-confidence credential in tracked files or H011 changes |
| `git diff --check` | PASS |

Three transitive native/tooling packages continue to produce npm's install-script approval warning. They are transitively required by the current Next.js/Tailwind/ESLint toolchain, the clean install and build pass without persisting a broader script allowance, and H011 does not weaken install-script policy.

The local Docker daemon was not running during H011. H011 made no SQL or database-definition change, so it did not restart Docker or repeat the clean reset, 244 SQL assertions, personal-dice concurrency, or campaign-video concurrency gates that passed in H010. Connected read-only Production metadata supplied current migration, schema, RLS, Storage, index, function, type, and connectivity evidence.

## 7. Tests that must not be repeated without a relevant change

Do not repeat the following merely to reconfirm historical state:

- the accepted one-GM/four-Player human Production Campaign Game Room test;
- H009 authenticated layout/media acceptance and Production rollout checks;
- H010 binary visual inspections;
- H010 local Supabase reset, 244 SQL assertions, and both database concurrency suites;
- the historical provider signaling/endurance/media spike summarized in `docs/evidence/HISTORICAL_LIVEKIT_PROVIDER_VALIDATION.md`.

Repeat only a gate affected by a relevant code, schema, dependency, provider, browser/device, or infrastructure change, or when a concrete regression is reported.

### Phase 4C1 verification addition

Phase 4C1 added focused upload validation/workflow tests, source privacy checks, and direct test-project RLS/Storage assertions. The direct transaction covered selected-Player access, outsider denial, completed-Player denial, completed-GM read-only metadata, represented-object cleanup, and final completed-campaign deletion; all temporary users, rows, and objects were rolled back. Local Docker was unavailable, so the repository pgTAP file was not rerun locally; the affected policy was instead exercised directly in the established non-Production Supabase test project.

## 8. Consolidation and cleanup decisions

| Former resource | Decision and reason |
|---|---|
| `C:\Projects\ttrpg-website` on `spike/phase-4b-video-provider-comparison` | Removed after comparison. Its six tracked modifications and untracked spike group were an earlier provider prototype, superseded by the later S2D branch and the accepted campaign LiveKit implementation. H008/H009 and the sanitized evidence summary retain the useful conclusion. |
| `C:\Projects\ttrpg-website-game-room-card-hotfix` / `codex/game-room-video-card-hotfix` | Removed. PR #34 merged the exact accepted outcome; current main contains it. |
| `C:\Projects\ttrpg-website-game-room-responsive` / `codex/game-room-responsive` | Removed. PR #33 merged the exact accepted outcome; current main contains it. |
| `C:\Projects\ttrpg-website-m4e-stage1` / `codex/m4e-stage1-campaign-video-foundation` | Removed. Its campaign-video foundation is represented by the accepted PR #28 migration/code sequence and later main evolution. |
| `C:\Projects\ttrpg-website-s2d-preview` / `spike/s2d-2-preview-clean` | Removed. Its two unique commits were disposable provider-validation tooling, not missing current product functionality. The material result is retained in the sanitized evidence summary. |
| `origin/spike/s2d-2-preview-clean` | Removed after the same content classification. No retained Preview depends on it. |
| `C:\Projects\ttrpg-project-notes` | Removed. The generic handoff prompt, short LiveKit/tester notes, campaign-screen brief, and sensitive scratch text added no required current product fact beyond repository documentation. |
| `C:\Projects\ttrpg-video-spike-evidence` | Removed after distilling the useful, non-sensitive provider-validation conclusion into `docs/evidence/HISTORICAL_LIVEKIT_PROVIDER_VALIDATION.md`. Raw logs, screenshots, temporary runners, and identifiers were not retained. |
| Five branch-scoped Vercel variables for the deleted M4E Preview branch | Removed after confirming the exact obsolete branch scope. The six required variable names remain present in their intended Production or shared Preview/Production scopes without values being inspected. |
| H011 publication branch | Removed locally and remotely after merge. |
| `C:\Projects\ttrpg-website-h010-audit` | Removed after the repository's primary worktree at `C:\Projects\ttrpg-website` was cleared of the superseded spike, restored to verified `main`, and confirmed canonical. The primary-worktree constraint made an in-place canonical reset safer than moving the linked audit worktree. |

No backup, renamed, temporary, or just-in-case TTRPG project copy is required outside the canonical repository.

## 9. Remaining planned capabilities

- standalone Video Rooms with a separately approved product, provider, schema, RLS, ownership, invitation, retention, and deletion contract;
- shared server-authoritative campaign dice and Realtime feed;
- Phase 4C2 GM-controlled Game Room presentation of existing Campaign Handouts;
- Game Room Participants, Quick Notes, Session Context, Characters, NPCs, and Selected Handouts beyond that approved presentation slice;
- campaign moderation, recording, transcription, and screen sharing;
- Call of Cthulhu 7e characters, dice, Game Hub content, and Keeper tools;
- print/PDF, independent sheet language, public sharing, and broader public-readiness work including abuse controls, monitoring, legal/privacy operations, and hosted leaked-password protection.

Post-H011 roadmap amendment (2026-09-01): Phase 4C1 was selected as the next product stage. It is now implemented as image-only Campaign Handouts; the permanent roadmap in `docs/product/ROADMAP.md` makes Phase 4C2 Game Room Image Presentation next. All earlier H011 implementation, verification, cleanup, and Game Room Production-acceptance facts remain unchanged.

Post-4C1 UI refinement (2026-09-02): active GMs can select multiple image files for sequential, independently reported uploads; the gallery uses compact uncropped thumbnails; and visibility, recipient, save, and delete controls live inside each Handout card. This refinement did not change the Phase 4C1 privacy/lifecycle model, database schema, or Phase 4C2 roadmap boundary.

## 10. Exact starting procedure for the next stage

1. Open PowerShell at `C:\Projects\ttrpg-website`.
2. Read this file, `AGENTS.md`, `PROJECT_CONTEXT.md`, and the architecture/product document relevant to the requested stage.
3. Run `git fetch origin --prune`.
4. Confirm `git branch --show-current` is `main`, `git status --short --branch` is clean, and `git rev-parse HEAD` equals `git rev-parse origin/main`.
5. Inspect `package.json` and the installed Next.js 16.3.3 documentation before changing Next.js code.
6. Begin from the approved Phase 4C2 Game Room Image Presentation scope in `docs/product/ROADMAP.md`; reuse existing Campaign Handouts and do not infer that standalone Video Rooms, broad document Handouts, or the superseded shared-dice phase is next.
7. Create a new isolated `codex/` branch or worktree from the verified `origin/main` and rerun only the gates proportionate to that change.

Future work must not depend on any former external folder or historical handoff being treated as current.
