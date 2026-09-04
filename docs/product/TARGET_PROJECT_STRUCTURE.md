# TTRPG Hub — Target Project Structure

## Status

This document records repository-structure principles for the approved roadmap. It intentionally avoids a large speculative file tree: exact files and folders should be introduced only when a phase's implementation design requires them.

## Current structure is authoritative

The checked-in application structure at the working commit is the source of truth for implemented routes, components, server modules, tests, migrations, localization, and generated types. Do not create placeholder modules or directories merely to mirror future phases.

## Placement principles

- shared platform behavior belongs in common application, server, or UI areas;
- system-specific schema, rules, terminology, content, and presentation stay under the game-system boundary;
- campaign authorization and lifecycle stay in the Campaign domain;
- LiveKit remains behind the existing narrow campaign video adapter and server-only token boundary;
- migrations are ordered, forward-only additions; applied migrations are never edited;
- long-form Game System Hub content should use reviewed Markdown/MDX or another suitable content model, separate from UI localization dictionaries;
- tests should live with or clearly target the behavior they verify;
- generated, build, cache, coverage, log, backup, and temporary output does not belong in Git.

## Approved additions by phase

### Phase 4C1 — image-only Campaign Gallery (implemented)

The implemented campaign-scoped Gallery route, focused `campaign-handouts` workflow helpers, shared four-section UI, and tests manage the existing campaign image model and private Storage contract. Handouts, NPC, Maps & Plans, and Other are fixed image-only categories; they do not create global or structured content domains.

### Phase 4C2 — Game Room Image Presentation (implemented)

The existing Game Room and campaign-video/controller boundaries now provide GM selection, shared current display, replacement, stop-presentation, synchronized Expand / Collapse, and late join/rejoin behavior without map, annotation, drawing, screen-sharing, or persistence modules.

### Phase 4D1 and 4D2 — Dice

Place CoC rules in the CoC game-system domain. Keep common Game Room selection and authorization system-neutral. Personal and campaign-authoritative persistence must remain separate.

### Phase 4E — Campaign & Game Room UX/UI Refinement

Refactor demonstrated layout, navigation, responsive, accessibility, or duplication problems within existing domains. This phase adds no feature directories.

### Phase 4F1 and 4F2 — Characters

Place CoC schema, normalizer, renderer, summaries, and tests in the CoC game-system domain. Game Room integration consumes only campaign-authorized linked characters and does not duplicate character ownership or editing logic.

### Phase 4G — Campaign Notes

Introduce only narrowly scoped shared-note and GM-private-note persistence, authorization, UI, and tests. Do not create Sessions, Chronicle, NPC, Handout, clue, map, or wiki directories.

### Phases 5 and 6

Phase 5 may consolidate proven shared UI primitives without adding product modules. Phase 6 may add approved visual assets, tokens, and theme layers after its decisions are recorded.

### Phase 7 — Delta Green

Add Delta Green under the game-system domain and reuse existing platform capabilities. Do not add special Delta Green-only platform tools.

### Phase 8 — Game System Hubs

Add a shared hub/content layer only when Phase 8 begins, then system content in CoC, Delta Green, and Vampire order. Hubs organize implemented tools and information; they do not create mechanics.

### Phase 9 — Public Readiness

Add operational, legal, security, or support structure only for requirements accepted during the Public Readiness review. Existing detailed reference checklists do not pre-authorize every possible file or service.

## Explicit exclusions

Do not create structure for standalone Video Rooms, general Handouts, NPCs, Sessions, Chronicle, clues, maps, recording, transcription, screen sharing, or moderation unless a future roadmap decision explicitly accepts it.

## Implementation rule

At the start of each phase, inspect the current repository and the installed Next.js documentation, then choose the smallest maintainable structure that fits the accepted architecture. Do not resurrect superseded target-tree paths because they appeared in historical documentation.
