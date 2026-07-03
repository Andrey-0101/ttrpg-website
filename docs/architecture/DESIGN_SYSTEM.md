# Design System

## Status

Minimal design contract for architecture-baseline work. Final visual identity is deferred until the friend-only feature set is usable.

## Goals

- keep interfaces consistent while features are still changing;
- preserve readability and accessibility;
- avoid embedding decorative decisions into business logic;
- allow game-specific themes;
- support responsive layouts;
- allow future VtM and CoC visual identities without duplicating application components.

## Current visual baseline

Current VtM implementation uses:

- dark red site background;
- white character sheets;
- temporary red frame;
- A4-oriented desktop sheets;
- stacked responsive mobile layout;
- neutral forms and action buttons;
- character cards related visually to the sheet identity area.

The current red frame is not the final decorative design.

## Token layers

### Platform tokens

Common across all game systems:

```text
spacing
radii
control height
focus ring
disabled opacity
content widths
breakpoints
surface elevation
semantic colors
body typography
```

### Semantic tokens

Examples:

```text
surface
surfaceMuted
text
textMuted
border
primary
danger
success
warning
focus
```

### Game-theme tokens

Examples:

```text
gameBackground
sheetBackground
sheetFrame
gameAccent
gameHeadingFont
gameDecorativeAsset
```

Components should consume semantic/theme tokens rather than hard-coded decorative assets where practical.

## Component contract

Common variants should eventually cover:

```text
Button
LinkButton
Card
Field
Textarea
Select
Checkbox
Dialog
Alert
Tabs
PageHeader
EmptyState
LoadingState
ErrorState
```

The architecture baseline does not require an immediate component-library rewrite. New repeated patterns should be centralized as they stabilize.

## Interaction rules

- destructive controls use a clear danger treatment;
- disabled state remains legible;
- focus state is visible;
- touch targets remain usable on mobile;
- loading does not cause repeated submissions;
- save state is explicit;
- text remains readable over decorative backgrounds;
- decorative fonts are not used for long-form text.

## Responsive rules

- mobile-first flow;
- no page-level horizontal scroll;
- content-driven height on mobile;
- multi-column layouts only when content remains readable;
- long Russian labels must be tested;
- desktop A4 behavior is a sheet-rendering concern, not a global page constraint;
- character actions remain reachable and consistently aligned.

## Accessibility baseline

Friend-alpha still requires:

- keyboard-accessible controls;
- associated labels;
- visible focus;
- adequate contrast;
- meaningful button text;
- image alternative text where appropriate;
- no essential information conveyed only by color;
- reduced-motion consideration for future animation.

Full accessibility review is part of Public Readiness.

## Future visual milestone

The Visual Identity milestone may add:

- site wallpaper/backgrounds;
- VtM decorative frame;
- heading fonts;
- splash/landing imagery;
- campaign card theme;
- dice interface theme;
- video-room theme;
- NPC and handout layouts;
- loading skeletons;
- final mobile polish.

It must not require database or character-schema changes.

## Theme boundary

Game-system themes may change:

- colors;
- decorative assets;
- display typography;
- card treatment;
- sheet frame;
- hub visuals.

They must not change:

- authorization;
- persisted common data;
- core navigation semantics;
- accessibility requirements;
- error behavior;
- campaign membership logic.

## Open decisions

- exact token implementation;
- CSS variables versus Tailwind theme configuration;
- font licensing and delivery;
- final VtM decorative assets;
- dark/light platform modes;
- animation policy;
- theme switching at route or campaign level.
