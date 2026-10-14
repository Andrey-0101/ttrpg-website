# Project Documentation

This directory contains the permanent English technical, product, decision, and handoff documentation for TTRPG Hub.

## Current project state

Completed:

- Milestone 1 — Architecture Baseline;
- Milestone 2 — Character Friend Alpha;
- Milestone 3 — Campaign Foundation;
- Phase 4A — VtM personal dice and personal persistence;
- planned game-system catalogue across Games, Dice Rollers, character creation, and campaign creation;
- Phase 4B — Campaign Video Rooms Integration;
- Phase 4C1 — image-only Campaign Gallery;
- Phase 4C2 — Game Room Image Presentation;
- Phase 4D1 — CoC 7e personal Dice Roller and focused UX follow-up;
- Phase 4D2 — Game Sessions, session-scoped Journal, and system-aware Campaign Dice;
- Phase 4E — Fair Turn Order Dice;
- Phase 4F1/4F2 — CoC 7e sheets and linked Game Room Characters;
- Phase 4G — owner-private Personal Campaign Notes;
- subsequent membership and character-access maintenance.

Current status:

- Phase 4 — CLOSED / DEPLOYED / ACCEPTED;
- GM Computer Audio Sharing — IMPLEMENTED / DEPLOYED / MANUAL PRODUCTION ACCEPTANCE PENDING;
- Developer Diagnostics — DEPLOYED / MANUAL MULTI-USER ACCEPTANCE PENDING; one real GM-only recording and ZIP export succeeded;
- Phase 5A Campaign & Game Room UX/UI Refinement and Phase 5B Site-wide UI Technical Refinement — PLANNED / NOT STARTED. Deferred real-session audio/diagnostics acceptance does not block Phase 5A planning.

The canonical production domain is `https://ttrpg.fans`; `https://www.ttrpg.fans` permanently redirects to it. Vercel URLs remain technical deployment addresses. The Vercel domain routes, redirect, and TLS, plus the hosted Supabase Auth Site URL and production/local redirect allowlist, were completed manually outside the repository and manually verified. Arbitrary Vercel Preview authentication is not currently enabled.

Production application release baseline after PR #74 (before this documentation-only synchronization):

```text
main
b5f20bfc2b8c025644375ae41e687d692d899c83
```

All Phase 4 deliverables are deployed and accepted. Merged [PR #73](https://github.com/Andrey-0101/ttrpg-website/pull/73) rolled out Developer Diagnostics; merged [PR #74](https://github.com/Andrey-0101/ttrpg-website/pull/74) fixed null-run dispatch. Application-release deployment `dpl_2SU3Zx16EXc6ss9SCNWSuL1kBk6c` was verified READY on `ttrpg.fans`; later documentation-only deployments do not change that release evidence. LiveKit remains limited to audio/video and Gallery presentation, independent of Game Sessions and Journal. Standalone Video Rooms remain uncommitted.

## Architecture

| Document | Purpose |
|---|---|
| [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md) | Current system structure, domain boundaries, and runtime responsibilities |
| [`architecture/DATABASE.md`](architecture/DATABASE.md) | Applied database schema, RLS, Storage, migrations, functions, and generated types |
| [`architecture/CAMPAIGN_RLS_MATRIX.md`](architecture/CAMPAIGN_RLS_MATRIX.md) | Campaign authorization matrix used during schema and multi-user verification |
| [`architecture/I18N.md`](architecture/I18N.md) | Locale routing, dictionaries, metadata, and sheet-language direction |
| [`architecture/CHARACTER_SHEETS.md`](architecture/CHARACTER_SHEETS.md) | Common character and VtM V5/CoC 7e sheet contracts |
| [`architecture/DESIGN_SYSTEM.md`](architecture/DESIGN_SYSTEM.md) | Minimal design contract and future theming |
| [`architecture/SECURITY.md`](architecture/SECURITY.md) | Implemented friend-alpha controls and Public Readiness requirements |
| [`architecture/DEVELOPER_DIAGNOSTICS.md`](architecture/DEVELOPER_DIAGNOSTICS.md) | Deployed internal Developer role, diagnostics, cleanup, release and acceptance evidence |

## Product and planning

| Document | Purpose |
|---|---|
| [`product/ROADMAP.md`](product/ROADMAP.md) | Milestones, current status, scope boundaries, and exit criteria |
| [`product/IDEAS_BACKLOG.md`](product/IDEAS_BACKLOG.md) | Unapproved product ideas captured for review and possible roadmap acceptance |
| [`product/CAMPAIGNS.md`](product/CAMPAIGNS.md) | Implemented campaign, Game Room, character-access and Personal Notes contracts |
| [`product/DICE_ROLLS.md`](product/DICE_ROLLS.md) | Implemented personal and Campaign Dice contracts and their separate trust boundaries |
| [`product/VIDEO_ROOMS.md`](product/VIDEO_ROOMS.md) | Accepted campaign-only LiveKit scope and uncommitted standalone backlog boundary |
| [`product/GAME_HUB.md`](product/GAME_HUB.md) | Proposed game-hub content and tools |
| [`product/SITE_STRUCTURE_CURRENT.md`](product/SITE_STRUCTURE_CURRENT.md) | Current implemented information architecture |
| [`product/SITE_STRUCTURE_TARGET.md`](product/SITE_STRUCTURE_TARGET.md) | Accepted target information architecture |
| [`product/SITE_STRUCTURE_COMPARISON.md`](product/SITE_STRUCTURE_COMPARISON.md) | Current-to-target comparison |
| [`product/SITE_MAP.md`](product/SITE_MAP.md) | Current and next-stage Mermaid site maps |
| [`product/SITE_MAP_TARGET.md`](product/SITE_MAP_TARGET.md) | Longer-term target map retained as a planning reference |
| [`product/TARGET_PROJECT_STRUCTURE.md`](product/TARGET_PROJECT_STRUCTURE.md) | Target repository organization and status markers |

## Architecture decisions

Accepted and proposed ADRs are stored in:

[`decisions/`](decisions/)

Current decision status relevant to dice delivery:

- ADR-007 — Campaign foundation before shared realtime tools: Accepted;
- ADR-008 — Game-system domain boundaries: Accepted and preserved by Phase 4D1;
- ADR-009 — Managed video infrastructure: Accepted for the current LiveKit campaign Game Room only; standalone Video Rooms are not active roadmap scope.

## Evidence summaries

| Document | Purpose |
|---|---|
| [`evidence/HISTORICAL_LIVEKIT_PROVIDER_VALIDATION.md`](evidence/HISTORICAL_LIVEKIT_PROVIDER_VALIDATION.md) | Sanitized conclusion and evidence limits from the retired external provider-spike archive |

## Handoffs

Latest chronological handoff (historical snapshot):

[`handoffs/H013_CURRENT_HANDOFF.md`](handoffs/H013_CURRENT_HANDOFF.md)

H001–H013 are historical continuity records, not current release status. H013 remains the latest handoff; later Git releases, accepted decisions and synchronized documentation supersede outdated snapshot claims. H014 creation is a separate Product Owner request at conversation closure, not part of documentation synchronization.

Historical handoffs remain available and must not be rewritten as current state:

- `H001_CURRENT_HANDOFF.md`;
- `H002_CURRENT_HANDOFF.md`;
- `H003_CURRENT_HANDOFF.md`;
- `H004_CURRENT_HANDOFF.md`;
- `H005_CURRENT_HANDOFF.md`;
- `H006_CURRENT_HANDOFF.md`;
- `H007_CURRENT_HANDOFF.md`;
- `H008_CURRENT_HANDOFF.md`;
- `H009_CURRENT_HANDOFF.md`;
- `H010_CURRENT_HANDOFF.md`;
- `H011_CURRENT_HANDOFF.md`;
- `H012_CURRENT_HANDOFF.md`;
- `H013_CURRENT_HANDOFF.md` (latest).

## Status vocabulary

- **Implemented**: exists in the synchronized repository and is supported by current code or applied schema.
- **Verified**: supported by recorded build, migration, security, or manual test evidence.
- **Accepted**: an architectural decision that guides implementation.
- **Proposed**: a direction that still requires review or a technical spike.
- **Planned**: intended work with no implementation claim.
- **Deferred**: intentionally outside the current milestone.
- **Unverified**: not supported by current code, migration, generated type, or recorded test.
- **Deprecated**: must not be restored.

## Maintenance rule

Update permanent documentation in the same pull request as a material architecture, data, security, localization, route, or workflow change.

When documentation is synchronized in a separate PR, it must identify the exact repository snapshot it describes and avoid claiming unrecorded deployment or test results.
