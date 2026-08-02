# Architecture

## Status

Current architecture for the implemented VtM character and Campaign Foundation application, with Milestone 4 VtM Realtime Tools active.

Verified production baseline:

```text
main
cb6a07f11669916c8af68d0f0c93033438c901ea
```

PR #26 is merged, deployed, and production-verified. The verified release passed 169 automated tests and generated 36/36 static pages.

## Architectural goals

1. Deliver practical value to a small private group before optimizing for unrestricted public use.
2. Keep game-system-specific behavior isolated from common platform behavior.
3. Preserve character data through explicit schema versions and normalizers.
4. Use campaign membership as the authorization boundary for campaign-owned collaboration, while keeping standalone Video Rooms in a separate access domain.
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

The canonical production origin is `https://ttrpg.fans`. `https://www.ttrpg.fans` permanently redirects to the apex domain. Vercel `*.vercel.app` URLs remain technical deployment addresses.

Future external service boundary:

```text
Next.js server
  |
  +-- context-specific application authorization
  +-- short-lived token issuance
  +-- practical provider boundary
        |
        +-- managed video provider
```

The reusable video core must remain separate from authorization adapters. Phase 4B uses standalone application authorization that does not depend on Campaign Foundation; Phase 4E later adds campaign-derived authorization. Provider secrets remain server-only. The video provider is not selected, and ADR-009 remains Proposed pending comparison and a disposable technical spike.

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
/[locale]/dice-rollers
/[locale]/dice-rollers/custom
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

Approved planned standalone Video Rooms route direction:

```text
/[locale]/video-rooms
/[locale]/video-rooms/new       (provisional)
/[locale]/video-rooms/[id]      (provisional)
```

These routes and a possible authenticated navigation entry are planned, not implemented.

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
Canonical site-origin resolution
```

The core platform owns `lib/site-url.ts`, which normalizes the configured public site origin for root metadata and browser-generated authentication and campaign-invitation links. A supplied browser origin remains the safe URL fallback for local and Preview deployments without `NEXT_PUBLIC_SITE_URL`. Authentication callbacks from arbitrary Preview deployments are not currently enabled; they require a separately approved, account-scoped Supabase redirect wildcard. The helper must not know VtM dice or sheet rules.

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

Implemented system:

```text
vtm-v5
```

The typed catalogue at `lib/game-systems/catalogue.ts` also contains these planned systems:

```text
alien
black-powder-and-brimstone
call-of-cthulhu-7e
coriolis
cyberpunk-red
delta-green
forbidden-lands
ironsworn
mothership
paranoia
traveller-mongoose
```

Capability status is tracked separately for game area, character creation, campaign creation, and dice roller. Only VtM V5 is available; planned capabilities expose no route. The catalogue is rendered across Games, the System Rollers section, character creation, and campaign creation. Custom Dice Pool is not a game-system entry.

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

It produces unbiased d10 values with `crypto.getRandomValues`, accepts an injectable random source for deterministic tests, and passes the generated arrays unchanged to the pure evaluator. The localized client UI at `/[locale]/games/vampire-the-masquerade/tools/dice` is public and has no campaign or Realtime dependency. Registered users may record its result in private personal history.

The public `/[locale]/dice-rollers` hub is a platform navigation surface. It links to implemented system rollers and the generic Custom Dice Pool at `/[locale]/dice-rollers/custom`. Official VtM dice presentation is isolated in `lib/game-systems/vtm-v5/dice-symbols.ts`; it maps numeric results to documented official assets without interpreting or changing the roll.

The generic custom dice boundary is located at:

```text
lib/dice/custom-dice-pool.ts
```

It is platform-owned rather than game-system-owned. It validates quantities for Coin (d2), d4, d6, d8, d10, d12, d20, and d100, and enforces a 100-item total limit. It generates each result independently with `crypto.getRandomValues` and one injectable random source. Coin results use the stable typed outcomes `heads` and `tails`, selected from equal halves of the uint32 range; numeric dice use rejection sampling. Returned quantities, Coin outcomes, and numeric result arrays are copied snapshots. Coins count as rolled items but never receive numeric scores or contribute to the numeric-dice total. The generator does not interpret named-game rules or depend on campaigns or Realtime.

Registered users may save up to 5 private Custom Dice Pool presets and retain the current personal roll plus 10 previous rolls. VtM and Custom results are revalidated and canonicalized at the persistence boundary. Guest rolls remain non-persistent. Personal history remains distinct from server-authoritative campaign roll history and is not campaign evidence.

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

Video capabilities are split into:

```text
Reusable video core
Standalone authorization adapter (Phase 4B)
Campaign-derived authorization adapter (Phase 4E)
Practical managed-provider boundary
```

Standalone Video Rooms must not depend on campaign membership. Shared campaign dice and campaign-integrated video must reuse campaign authorization and must not establish a competing campaign invitation or access model. Exact standalone room schema, RLS, ownership, invitation, retention, and deletion behavior remain unresolved.

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
  -> canonical domain and permanent www redirect verification
  -> delete merged feature branch
```

A pushed branch is not production. A Ready deployment should be associated with the intended main state before making a commit-specific release claim.

Generated `.next` output is not source. If route types become corrupted, stop all dev servers, delete `.next`, and rebuild rather than editing generated files.

## Current architecture sequence

Completed:

1. architecture baseline;
2. Character Friend Alpha;
3. Campaign Foundation;
4. VtM personal dice and personal persistence;
5. planned game-system catalogue.

Approved Milestone 4 sequence:

6. Phase 4B standalone Video Rooms architecture/security, provider comparison, disposable spike, permanent implementation, and production testing;
7. Phase 4C Campaign Collaboration Contract;
8. Phase 4D persisted shared campaign dice;
9. Phase 4E campaign video integration through the reusable core;
10. Phase 4F campaign workspace integration.

Later:

11. Milestone 5 Friend Campaign Alpha;
12. visual identity;
13. VtM Game Hub;
14. Public Readiness;
15. Call of Cthulhu 7e.

## Explicit non-goals for the current phase

- general-purpose virtual tabletop;
- self-hosted WebRTC media infrastructure;
- public campaign discovery;
- anonymous shared character access;
- final print/PDF;
- universal dice expression language;
- unrestricted public launch;
- CoC implementation before the VtM platform flow is stable.
