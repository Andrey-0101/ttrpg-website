# Architecture

## Status

Current architecture for the implemented VtM character and campaign application, including the accepted campaign-authorized LiveKit Game Room and image-only Campaign Gallery.

Verified production baseline:

```text
main
609b6d9ec972bc842bfc8de4e4080eecdb10d4c8
```

PRs #28–#35 are merged and deployed at the H011 consolidation baseline. The current campaign-video and Game Room scope passed human Production acceptance with one GM and four Players; no quantitative packet-loss, latency, jitter, or connection-quality telemetry was collected.

## Architectural goals

1. Deliver practical value to a small private group before optimizing for unrestricted public use.
2. Keep game-system-specific behavior isolated from common platform behavior.
3. Preserve character data through explicit schema versions and normalizers.
4. Use campaign membership as the authorization boundary for every approved campaign-owned collaboration capability; any future standalone product requires a separate authorization design.
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
  +-- Function compute: hnd1 (Tokyo), pinned in vercel.json
  |
  +-- Server Components
  +-- Client Components
  +-- Route Handlers
  +-- next-intl locale routing
  +-- Supabase session refresh
  |
  v
Supabase
  +-- Production region: ap-northeast-1 (Tokyo)
  +-- PostgreSQL
  +-- Auth
  +-- Row Level Security
  +-- Storage
  +-- Realtime only where a later approved campaign capability requires it
```

The canonical production origin is `https://ttrpg.fans`. `https://www.ttrpg.fans` permanently redirects to the apex domain. Vercel `*.vercel.app` URLs remain technical deployment addresses. Vercel Function compute previously used the default Virginia region (`iad1`); after it moved to Tokyo (`hnd1`), a small Production comparison measured approximately 30% lower overall median TTFB. The region change aligns application compute with Supabase Production in Tokyo and does not change application behavior.

Current managed-video service boundary:

```text
Next.js server
  |
  +-- context-specific application authorization
  +-- short-lived token issuance
  +-- practical provider boundary
        |
        +-- managed video provider
```

The reusable video core remains separate from authorization adapters. The current Campaign Game Room uses campaign-derived authorization and LiveKit, the accepted provider for this implementation. Provider secrets remain server-only. Standalone Video Rooms are not active roadmap scope; any future product would require a separate authorization and provider review. ADR-009 does not automatically select it.

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
/[locale]/campaigns/[id]/game-room
/[locale]/campaigns/[id]/gallery
/[locale]/campaigns/[id]/handouts (redirect)
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

No standalone Video Rooms route or navigation entry is approved. Earlier `/[locale]/video-rooms` route sketches are superseded planning history.

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
- short-lived signed Campaign Gallery image URL creation after RLS-filtered metadata reads;
- campaign participant and role-dependent initial rendering;
- safe direct-route unavailable behavior;
- current campaign-video token issuance after fresh campaign authorization;
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
- image-only Campaign Gallery upload, category filtering, visibility, lightbox, and Storage-first delete actions;
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

The typed catalogue at `lib/game-systems/catalogue.ts` enables campaign creation for `call-of-cthulhu-7e` while keeping its character creation, dice roller, and game area planned. It also contains these fully planned systems:

```text
alien
black-powder-and-brimstone
coriolis
cyberpunk-red
delta-green
forbidden-lands
ironsworn
mothership
paranoia
traveller-mongoose
```

Capability status is tracked separately for game area, character creation, campaign creation, and dice roller. VtM V5 is available for all four capabilities; Call of Cthulhu 7e is available only for the generic campaign shell. Planned capabilities expose no route. The catalogue is rendered across Games, the System Rollers section, character creation, and campaign creation. Custom Dice Pool is not a game-system entry.

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

Campaigns carry a `game_system` discriminator. VtM-specific rules do not belong in generic campaign columns. The dedicated campaign Game Room uses the existing RLS-protected campaign boundary for its initial server render and issues no provider token until the participant explicitly selects Join. Its localized route uses a named Next.js header slot for compact route-specific chrome while other routes keep the normal site header. The browser presentation maps the server-owned participant directory to fixed GM and Player 1–6 positions, so provider presence changes do not reorder the viewport-driven desktop layout. CSS Grid derives the available workspace from `100dvh` and the compact header, constrains participant cards by both their grid column and row, preserves 16:9 media without resize listeners, and reflows below the desktop breakpoint.

### Core play and campaign-tools domain

Approved responsibilities:

```text
Personal dice execution
System-aware campaign dice execution if approved by the Phase 4D2 persistence contract
Campaign image library and shared current-image presentation
Linked campaign-character presentation
Shared and GM-private campaign notes
Video room access
Connection state
```

Video capabilities are split into:

```text
Reusable video core
Campaign-derived authorization adapter (implemented)
LiveKit provider boundary (accepted current implementation)
Standalone authorization adapter (not implemented; no active roadmap phase)
```

The current campaign Game Room is implemented at `/{locale}/campaigns/{campaignId}/game-room` for one GM plus up to six Players. Image presentation, system-aware dice, linked characters, and notes must reuse campaign authorization and must not establish competing access models. A future standalone video idea would remain independent, but no schema, route, provider, or delivery phase is approved.

### Campaign-content domain

Implemented scope:

```text
Image-only Campaign Gallery with fixed Handouts, NPC, Maps & Plans, and Other sections
```

Approved planned scope:

```text
Game Room current-image presentation
Shared notes
GM-private notes
```

General Handouts, NPCs, Sessions, Chronicle records, clues, maps, and wikis are not active roadmap scope.

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

Campaign Gallery image bytes are stored in the private `campaign-images` bucket under the exact represented path `CAMPAIGN_UUID/IMAGE_UUID/RANDOM_OBJECT_UUID.ext`. The immutable `campaign_images.category` value (`handout`, `npc`, `maps_plans`, or `other`) is organizational metadata only and never participates in authorization. Server rendering creates short-lived signed URLs only after campaign-image RLS selects the current user's permitted metadata. Upload creates `gm_only` metadata before the exact object because the Storage INSERT policy requires representation. Individual deletion and final campaign deletion remove and verify represented objects before metadata or campaign rows. Completed GMs retain read access but no individual image mutation; the dedicated delete policy permits only represented-object cleanup required before final campaign deletion.

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

Approved sequence:

6. Phase 4B Campaign Video Rooms Integration and responsive Game Room — complete and accepted in Production;
7. Phase 4C1 image-only Campaign Gallery — complete;
8. Phase 4C2 Game Room Image Presentation — next;
9. Phase 4D1 CoC 7e Dice Roller;
10. Phase 4D2 system-aware Game Room Dice Integration;
11. Phase 4E Campaign & Game Room UX/UI Refinement;
12. Phase 4F1 CoC 7e Character Sheets;
13. Phase 4F2 system-aware linked-character Game Room integration;
14. Phase 4G narrowly scoped Campaign Notes;
15. Phase 5 site-wide UI Technical Refinement;
16. Phase 6 Visual Identity;
17. Phase 7 Delta Green system parity;
18. Phase 8 Game System Hubs in CoC, Delta Green, then Vampire order;
19. Phase 9 Public Readiness.

## Explicit non-goals for the current phase

- general-purpose virtual tabletop;
- self-hosted WebRTC media infrastructure;
- public campaign discovery;
- anonymous shared character access;
- final print/PDF;
- universal dice expression language;
- unrestricted public launch;
- broad Handouts, NPCs, Sessions, Chronicle, standalone video, recording, transcription, or screen-sharing scope without a future explicit decision.
