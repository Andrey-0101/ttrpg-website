# ADR-004: A4 Desktop and Responsive Mobile Rendering

- Status: Accepted
- Date: 2026-07-02

## Context

The VtM sheet is based on a two-page character-sheet reference and should support future print/PDF. A rigid A4 viewport on mobile makes controls too small and causes overflow.

## Decision

Use:

- A4-oriented proportions for desktop and future print;
- content-driven height and stacked reading order for mobile/tablet;
- the same normalized data for all renderers;
- two logical pages: `core` and `background`.

Desktop may use multi-column layout.

Mobile must:

- avoid page-level horizontal scrolling;
- stack identity and portrait;
- stack multi-column sections;
- use one-column Disciplines;
- retain touch-friendly controls;
- preserve logical reading order.

## Consequences

Positive:

- desktop resembles a sheet;
- mobile remains usable;
- data is renderer-independent;
- future print can reuse structure.

Costs:

- responsive styles require deliberate testing;
- desktop and mobile visual order may differ;
- dynamic sections can exceed physical A4 height;
- final print needs a separate static/read-only pass.

## Alternatives considered

### Scale the whole A4 sheet on mobile

Rejected because controls and text become too small.

### Separate mobile schema

Rejected because presentation must not affect stored data.

## Follow-up

- keep mobile manual checks at approximately 390 px and 768 px;
- test long Russian labels;
- design print/PDF separately;
- preserve frame replaceability.
