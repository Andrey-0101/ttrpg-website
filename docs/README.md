# Project Documentation

This directory contains the permanent English technical, product, decision, and handoff documentation for TTRPG Hub.

## Architecture

| Document | Purpose |
|---|---|
| [`architecture/ARCHITECTURE.md`](architecture/ARCHITECTURE.md) | System structure, domain boundaries, and runtime responsibilities |
| [`architecture/DATABASE.md`](architecture/DATABASE.md) | Database schema, RLS, Storage, migrations, and generated types |
| [`architecture/I18N.md`](architecture/I18N.md) | Locale routing, dictionaries, metadata, and sheet-language direction |
| [`architecture/CHARACTER_SHEETS.md`](architecture/CHARACTER_SHEETS.md) | Character and VtM V5 sheet contracts |
| [`architecture/DESIGN_SYSTEM.md`](architecture/DESIGN_SYSTEM.md) | Minimal design contract and future theming |
| [`architecture/SECURITY.md`](architecture/SECURITY.md) | Friend-alpha controls and Public Readiness requirements |

## Product and planning

| Document | Purpose |
|---|---|
| [`product/ROADMAP.md`](product/ROADMAP.md) | Milestones, scope boundaries, and exit criteria |
| [`product/CAMPAIGNS.md`](product/CAMPAIGNS.md) | Proposed campaign architecture |
| [`product/DICE_ROLLS.md`](product/DICE_ROLLS.md) | Proposed VtM-first dice architecture |
| [`product/VIDEO_ROOMS.md`](product/VIDEO_ROOMS.md) | Proposed managed-video architecture |
| [`product/GAME_HUB.md`](product/GAME_HUB.md) | Proposed game-hub content and tools |
| [`product/SITE_STRUCTURE_CURRENT.md`](product/SITE_STRUCTURE_CURRENT.md) | Current information architecture |
| [`product/SITE_STRUCTURE_TARGET.md`](product/SITE_STRUCTURE_TARGET.md) | Proposed target information architecture |
| [`product/SITE_STRUCTURE_COMPARISON.md`](product/SITE_STRUCTURE_COMPARISON.md) | Current-to-target comparison |
| [`product/SITE_MAP.md`](product/SITE_MAP.md) | Editable current and revised target Mermaid site maps |
| [`product/TARGET_PROJECT_STRUCTURE.md`](product/TARGET_PROJECT_STRUCTURE.md) | Complete target repository folder structure |

## Architecture decisions

Accepted and proposed ADRs are stored in:

[`decisions/`](decisions/)

## Handoffs

The current draft handoff is stored in:

[`handoffs/H004_CURRENT_HANDOFF.md`](handoffs/H004_CURRENT_HANDOFF.md)

Historical handoffs should remain available separately and should not be overwritten by this package.

## Status vocabulary

- **Implemented**: exists in the current repository and has been verified.
- **Accepted**: an architectural decision that guides implementation.
- **Proposed**: a direction that still requires review.
- **Planned**: intended work with no implementation claim.
- **Deferred**: intentionally outside the current milestone.
- **Unverified**: not supported by current code, migration, generated type, or recorded test.
- **Deprecated**: must not be restored.

## Maintenance rule

Update permanent documentation in the same pull request as a material architecture, data, security, localization, route, or workflow change.
