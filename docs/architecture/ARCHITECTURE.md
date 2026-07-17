# Architecture

## Status

Current architecture for the implemented VtM character and Campaign Foundation application, with Milestone 4 VtM Realtime Tools active.

Synchronized repository snapshot:

```text
main
a1c3a61381a2b7cddab9dd8fb620af56342209a9
```

## Architectural goals

1. Deliver practical value to a small private group before optimizing for unrestricted public use.
2. Keep game-system-specific behavior isolated from common platform behavior.
3. Preserve character data through explicit schema versions and normalizers.
4. Use campaign membership as the shared authorization boundary.
5. Keep decorative design separate from business logic and persisted data.
6. Avoid unnecessary universal abstractions until a second game system exposes real common requirements.
7. Keep server and database authorization authoritative even when the UI hides or disables controls.
8. Add realtime tools only after their deterministic rules and security contracts are reviewed.

## Runtime topology

```text
Browser
  |
  | HTTPS
  v
Next.js App Router on Vercel
  |
  +-- Server Components
  +-- Client Components
  +-- Route Handlers
  +-- next-intl locale routing
  +-- Supabase session refresh
  |
  v
Supabase
  +-- PostgreSQL
  +-- Auth
  +-- Row Level Security
  +-- Storage
  +-- Realtime for future persisted dice feeds
```

Future external service boundary:

```text
Next.js server
  |
  +-- managed video provider
```

The video provider is not selected. ADR-009 remains Proposed pending comparison and a technical spike.

## Route architecture

Localized application routes live under:

```text
app/[locale]/
```

Current user-facing route families:

```text
/[locale]
/[locale]/account
/[locale]/campaigns
/[locale]/campaigns/new
/[locale]/campaigns/join/[token]
/[locale]/campaigns/[id]
/[locale]/campaigns/[id]/characters/[characterId]
/[locale]/characters
/[locale]/characters/[id]
/[locale]/characters/new
/[locale]/characters/new/[system]
/[locale]/dashboard
/[locale]/games
/[locale]/games/vampire-the-masquerade
/[locale]/games/vampire-the-masquerade/tools/dice
/[locale]/login
/[locale]/profile
/[locale]/profile/edit
/[locale]/register
```

Technical route:

```text
/auth/confirm
```

The confirmation callback remains outside locale-prefixed routes. The intended locale and return destination are carried explicitly by the authentication flow.

Route-level `loading.tsx` and `not-found.tsx` files provide safe framework states for character and campaign routes.

## Middleware composition

The root proxy performs two responsibilities:

1. refresh the Supabase session;
2. apply `next-intl` routing.

Only Supabase cookies are copied into the response returned by `next-intl`. Supabase middleware override headers must not replace locale middleware headers.

This behavior is architecture-critical and must be regression-tested when proxy or authentication behavior changes.

## Server and client boundaries

### Server responsibilities

Prefer server-side code for:

- authentication/session reads required for initial routing;
- RLS-protected initial data loading;
- metadata generation;
- signed portrait URL creation;
- campaign participant and role-dependent initial rendering;
- safe direct-route unavailable behavior;
- future video token issuance;
- future persisted campaign dice execution.

### Client responsibilities

Client components handle:

- interactive forms;
- local drafts;
- unsaved-change protection;
- page switching;
- portrait file selection and preview;
- explicit mutations;
- mutation status;
- invitation copy/revoke actions;
- member leave/remove actions;
- character link/unlink actions;
- campaign edit/complete/delete actions;
- responsive interaction.

Client controls are usability aids. They are not authorization boundaries.

## Domain model

### Core platform domain

Owns:

```text
Auth
Profiles
Localization
Navigation
Common errors
Shared UI behavior
```

It must not know VtM dice or sheet rules.

### Character domain

Owns:

```text
Character lifecycle
Common character columns
Portrait lifecycle
Visibility
Sheet selection
Draft lifecycle
Owner editing
Campaign shareability state
```

It delegates system-specific data and rendering to a game-system domain.

### Game-system domain

Each game system may provide:

```text
System ID and metadata
Availability
Default sheet data
Schema version
Normalizer
Sheet renderer
Summary renderer
Dice engine
Theme tokens
Game-hub content
System campaign settings
```

Current:

```text
vtm-v5
```

Registered but unavailable:

```text
call-of-cthulhu-7e
```

ADR-008 is Accepted. The project must not create a complete universal rules engine before CoC exposes real shared interfaces.

The pure VtM V5 dice rules module is located at:

```text
lib/game-systems/vtm-v5/dice-engine.ts
```

It owns the typed request/result contract, strict input validation, and deterministic interpretation of supplied normal and Hunger d10 results. It accepts unknown input at its public boundary and returns typed validation failures for expected invalid data. It does not generate random values, render UI, access character sheets, or depend on persistence, campaigns, Supabase, or Realtime.

The personal random-generation boundary is located at:

```text
lib/game-systems/vtm-v5/dice-roller.ts
```

It produces unbiased d10 values with `crypto.getRandomValues`, accepts an injectable random source for deterministic tests, and passes the generated arrays unchanged to the pure evaluator. The localized client UI at `/[locale]/games/vampire-the-masquerade/tools/dice` is public, non-persisted, and has no campaign or Realtime dependency.

The same pure evaluator can later be called by server-authoritative campaign execution. That execution layer remains responsible for randomness, authorization, transport, and persistence.

### Campaign domain

Implemented platform-level responsibilities:

```text
Campaign
Single immutable Game Master
Player membership
Invitation lifecycle
Character assignment
Campaign lifecycle
Campaign navigation
Authorization helpers
```

Campaigns carry a `game_system` discriminator. VtM-specific rules do not belong in generic campaign columns.

### Realtime tools domain

Active roadmap area:

```text
Personal dice execution
Persisted campaign dice execution
Dice feed
Presence where needed
Video room access
Connection state
```

Shared realtime tools must reuse campaign membership. They must not establish a second invitation or access model.

### Campaign-content domain

Planned:

```text
Handouts
NPCs
Sessions
Shared notes
GM-private notes
```

### Game-hub content domain

Owns informational system content:

```text
Landing
Getting Started
Character guide
Quick reference
Resources
Tool links
```

A Game Hub is distinct from a private campaign workspace.

## Character architecture

Common data is stored in ordinary `characters` columns.

System-specific data is stored in versioned JSONB:

```text
characters.sheet_data
```

All persisted VtM data must be normalized by:

```text
normalizeVtmV5SheetData()
```

Unknown top-level keys are preserved under `extensions`.

The schema is presentation-independent. Desktop A4, mobile, summary-card, shared read-only, and future print renderers consume the same normalized data.

## Campaign architecture

Campaign authorization is derived from:

- `campaigns.game_master_id`;
- `campaign_members`;
- active `campaign_characters` assignments;
- campaign status.

There is no role column in `campaign_members`.

Shared character read access requires:

- an active campaign;
- current campaign participation;
- active assignment;
- `visibility = campaign`;
- matching game systems;
- continued owner participation.

Owner editing remains separate from campaign read access.

Campaign completion:

- makes campaign details read-only;
- revokes open invitations;
- closes active character assignments;
- preserves participant records and Player-owned characters.

## Storage architecture

Portrait bytes are stored in the private bucket:

```text
character-portraits
```

New object paths use:

```text
USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME
```

Owner-folder policies govern upload, update, delete, and owner read.

An additional campaign-aware SELECT policy permits current campaign participants to read portraits for characters they may read through an active assignment.

The database stores the object path in `characters.portrait_url`. Legacy external URLs remain readable for compatibility.

## State and persistence

Current character and campaign forms use:

- explicit Save/Create actions;
- synchronous mutation locks;
- safe status and error text;
- unsaved-change protection;
- localized confirmation for destructive or lifecycle actions.

Character sheet drafts use `sessionStorage`; portrait `File` objects are excluded from serialization.

Complex autosave remains deferred.

## Error handling

Rules:

- do not display raw Supabase or provider messages;
- map technical failures to safe localized messages;
- use safe unavailable states for missing or inaccessible direct routes;
- log only appropriate diagnostic information;
- do not include secrets, tokens, hashes, or sensitive object paths in user-visible errors;
- expired, revoked, accepted, and unknown invitation tokens should not reveal sensitive distinctions to unauthorized users.

## Deployment workflow

Current workflow:

```text
feature branch
  -> pull request
  -> Vercel Preview
  -> manual verification
  -> merge to main
  -> local clean build
  -> Vercel Production
  -> stable production alias verification
  -> delete merged feature branch
```

A pushed branch is not production. A Ready deployment should be associated with the intended main state before making a commit-specific release claim.

Generated `.next` output is not source. If route types become corrupted, stop all dev servers, delete `.next`, and rebuild rather than editing generated files.

## Current architecture sequence

Completed:

1. architecture baseline;
2. Character Friend Alpha;
3. Campaign Foundation.

Active:

4. VtM dice contract and personal roller;
5. persisted shared campaign dice;
6. managed-video comparison and spike;
7. minimal campaign video room.

Later:

8. remaining friend campaign workspace;
9. visual identity;
10. VtM Game Hub;
11. Public Readiness;
12. Call of Cthulhu 7e.

## Explicit non-goals for the current phase

- general-purpose virtual tabletop;
- self-hosted WebRTC media infrastructure;
- public campaign discovery;
- anonymous shared character access;
- final print/PDF;
- universal dice expression language;
- unrestricted public launch;
- CoC implementation before the VtM platform flow is stable.
