# Project Documentation

This directory contains the permanent English technical, product, decision, and handoff documentation for TTRPG Hub.

## Current project state

Completed:

- Milestone 1 — Architecture Baseline;
- Milestone 2 — Character Friend Alpha;
- Milestone 3 — Campaign Foundation;
- Milestone 4A — VtM personal dice and personal persistence;
- planned game-system catalogue across Games, Dice Rollers, character creation, and campaign creation.

Active:

- Milestone 4 — VtM Realtime Tools;
- canonical-domain implementation and permanent-documentation synchronization.

The canonical production domain is `https://ttrpg.fans`; `https://www.ttrpg.fans` permanently redirects to it. Vercel URLs remain technical deployment addresses. The Vercel domain routes, redirect, and TLS, plus the hosted Supabase Auth Site URL and production/local redirect allowlist, were completed manually outside the repository and manually verified. Arbitrary Vercel Preview authentication is not currently enabled.

Phase 4B shared campaign dice starts only after the current canonical-domain/documentation slice is merged, deployed, and production-verified.

Verified production catalogue baseline:

```text
main
22736bf697a8345e19e92626a8f441f35db4b3c7
```

The production catalogue release at this commit passed 156 catalogue/dice tests.

Release-candidate verification checkpoint, 2026-08-01: `chore/canonical-domain-docs-sync` is based on `22736bf697a8345e19e92626a8f441f35db4b3c7`. Its canonical-domain code and documentation changes are not yet merged, deployed, or production-verified. Local validation passed 156 dice/catalogue tests, 13 site-URL tests, 169 total automated tests, and the production build with 36/36 static pages generated. These changes become production state only after merge, deployment, and production verification.

## Architecture

| Document | Purpose |
|---|---|
| [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md) | Current system structure, domain boundaries, and runtime responsibilities |
| [`architecture/DATABASE.md`](architecture/DATABASE.md) | Applied database schema, RLS, Storage, migrations, functions, and generated types |
| [`architecture/CAMPAIGN_RLS_MATRIX.md`](architecture/CAMPAIGN_RLS_MATRIX.md) | Campaign authorization matrix used during schema and multi-user verification |
| [`architecture/I18N.md`](architecture/I18N.md) | Locale routing, dictionaries, metadata, and sheet-language direction |
| [`architecture/CHARACTER_SHEETS.md`](architecture/CHARACTER_SHEETS.md) | Character and VtM V5 sheet contracts |
| [`architecture/DESIGN_SYSTEM.md`](architecture/DESIGN_SYSTEM.md) | Minimal design contract and future theming |
| [`architecture/SECURITY.md`](architecture/SECURITY.md) | Implemented friend-alpha controls and Public Readiness requirements |

## Product and planning

| Document | Purpose |
|---|---|
| [`product/ROADMAP.md`](product/ROADMAP.md) | Milestones, current status, scope boundaries, and exit criteria |
| [`product/IDEAS_BACKLOG.md`](product/IDEAS_BACKLOG.md) | Unapproved product ideas captured for review and possible roadmap acceptance |
| [`product/CAMPAIGNS.md`](product/CAMPAIGNS.md) | Implemented Campaign Foundation contract and current UI |
| [`product/DICE_ROLLS.md`](product/DICE_ROLLS.md) | VtM-first dice architecture and next implementation target |
| [`product/VIDEO_ROOMS.md`](product/VIDEO_ROOMS.md) | Proposed managed-video architecture |
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

Current decision status relevant to the next milestone:

- ADR-007 — Campaign foundation before shared realtime tools: Accepted;
- ADR-008 — Game-system domain boundaries: Accepted;
- ADR-009 — Managed video infrastructure: Proposed pending provider comparison and spike.

## Handoffs

Most recent completed handoff:

[`handoffs/H007_CURRENT_HANDOFF.md`](handoffs/H007_CURRENT_HANDOFF.md)

A new current handoff will be created separately at the end of the current project chat.

Historical handoffs remain available and must not be rewritten as current state:

- `H001_CURRENT_HANDOFF.md`;
- `H002_CURRENT_HANDOFF.md`;
- `H003_CURRENT_HANDOFF.md`;
- `H004_CURRENT_HANDOFF.md`;
- `H005_CURRENT_HANDOFF.md`;
- `H006_CURRENT_HANDOFF.md`.

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
