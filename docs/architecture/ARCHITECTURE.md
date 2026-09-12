# Architecture

## Status

Current architecture for the implemented VtM V5 and CoC 7e character domains and campaign application, including the campaign Game Room, its independent Game Session/Journal foundation, optional campaign-authorized LiveKit video, and image-only Campaign Gallery.

Phase 4D1 extends this architecture with a deployed CoC 7e personal dice domain, extensible personal-history envelope, contextual roller navigation, roller-scoped history, and live CoC Target bands.

Phase 4D2 is deployed, manually accepted, and closed. It adds server-authoritative VtM V5 and CoC 7e Campaign Dice, exact-session Journal persistence, and Supabase Realtime for Journal and Game Session state without coupling those capabilities to LiveKit.

Phase 4F1 adds the versioned CoC 7e character schema, responsive two-page sheet, system-specific normalization and formulas, EN/RU presentation, and existing Character Library/campaign-sharing integration without a database migration. Production manual acceptance remains pending.

Verified production baseline:

```text
main
01d917688ddadb5366949a714bba462b7c5c44b2
```

PR #52 delivered Phase 4D2, PR #53 refined its acceptance UX, and PR #54 delivered the final navigation polish. All are merged and deployed. Phase 4D2 multi-user acceptance and the final UI-polish re-test passed. The earlier campaign-video human Production acceptance involved one GM and four Players; no quantitative packet-loss, latency, jitter, or connection-quality telemetry was collected.

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
  +-- pg_cron for autonomous Game Session expiry
  +-- Storage
  +-- Realtime for current Game Session state and session-scoped Journal events
```

The canonical production origin is `https://ttrpg.fans`. `https://www.ttrpg.fans` permanently redirects to the apex domain. Vercel `*.vercel.app` URLs remain technical deployment addresses. Vercel Function compute previously used the default Virginia region (`iad1`); after it moved to Tokyo (`hnd1`), a small Production comparison measured approximately 30% lower overall median TTFB. The region change aligns application compute with Supabase Production in Tokyo and does not change application behavior.

### Supabase environments

Production uses the Supabase project `ttrpg-website` with project ref `nryzkqwcnbbneazaksgh`; this is the project used by `ttrpg.fans`.

A separate test project, `ttrpg-website-m4e-test` with project ref `sijgmybepesinijyspjm`, also exists and is intentionally retained pending a future cleanup decision. Do not delete, pause, or modify it as part of ordinary Production work, and do not assume it is safe to remove. No keys or secret values belong in this documentation.

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

The campaign Game Room is the parent application boundary. It owns session state, GM presence renewal, Journal state, and non-video tool navigation. The Video child owns LiveKit connection/media behavior and image-presentation transport. Entering Game Room starts neither boundary: session start is an explicit GM action and LiveKit Join is a separate explicit action. Their lifecycles do not drive one another.

Persistent `game_sessions` rows provide the exact scope for the current Journal and Campaign Dice events. A partial unique index permits only one unended session per campaign. GM presence is renewed from the mounted Game Room approximately every 30 minutes, extending a 60-minute deadline; in normal timing this produces the accepted approximately 30–60 minute expiry window after GM disappearance. `pg_cron` invokes a private expiry function every minute so abandoned sessions close without visitor traffic. Completion closes the campaign's active session through the existing lifecycle trigger. Authenticated clients can read only their campaign's session and Journal rows and have no generic Journal writer.

The Game Room opens without joining LiveKit or starting a Game Session and exposes its normal tools immediately. Its stable one-row order is `Journal | Gallery | Dice | Character`. Journal is the default/root Display view and has no back arrow. Gallery opens in Handouts and retains its internal back arrow. CoC Dice opens in Percentile with `← | Percentile | Other Dice`; VtM Dice opens directly without a submenu. These UI states do not change the available Display height through navigation wrapping.

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
/[locale]/games/call-of-cthulhu/tools/dice
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
- owner-scoped best-effort personal-roll persistence after application revalidation;
- server-authoritative Campaign Dice execution and exact-session persistence.

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
- VtM, Custom, and deployed CoC personal dice generation and immediate result presentation;
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

Implemented Production system with all current catalogue capabilities:

```text
vtm-v5
```

The typed catalogue also enables character creation, campaign creation, and the deployed personal dice roller for `call-of-cthulhu-7e`; its game area remains planned. The catalogue also contains these fully planned systems:

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

Capability status is tracked separately for game area, character creation, campaign creation, and dice roller. VtM V5 is available for all four capabilities; Call of Cthulhu 7e is available for character creation, its generic campaign shell, and personal dice route. Planned capabilities expose no route. The catalogue is rendered across Games, the System Rollers section, character creation, and campaign creation. Custom Dice Pool is not a game-system entry.

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

The public `/[locale]/dice-rollers` hub is a catalogue-only platform navigation surface. It links to implemented system rollers and the generic Custom Dice Pool at `/[locale]/dice-rollers/custom`, adding a validated internal `returnTo` source for contextual Back navigation. Private personal history is rendered only on the matching roller page and remains owner-scoped through the server persistence boundary. Official VtM dice presentation is isolated in `lib/game-systems/vtm-v5/dice-symbols.ts`; it maps numeric results to documented official assets without interpreting or changing the roll.

Shared validation and secure-random boundaries are located at:

```text
lib/dice/validation.ts
lib/dice/secure-random.ts
```

They contain only proven cross-system primitives: record/range/allowed-value/optional-label validation and unbiased integer generation over `crypto.getRandomValues` with rejection sampling. VtM, Custom, and CoC retain their own request contracts, error mapping, validation order, and rules interpretation.

The generic custom dice boundary is located at:

```text
lib/dice/custom-dice-pool.ts
```

It is platform-owned rather than game-system-owned. It validates quantities for Coin (d2), d4, d6, d8, d10, d12, d20, and d100, and enforces a 100-item total limit. It generates each result independently with `crypto.getRandomValues` and one injectable random source. Coin results use the stable typed outcomes `heads` and `tails`, selected from equal halves of the uint32 range; numeric dice use rejection sampling. Returned quantities, Coin outcomes, and numeric result arrays are copied snapshots. Coins count as rolled items but never receive numeric scores or contribute to the numeric-dice total. The generator does not interpret named-game rules or depend on campaigns or Realtime.

Registered users may save up to 5 private Custom Dice Pool presets. The deployed persistence model retains six rows per owner and roller kind and displays up to five previous entries per kind alongside the current result. VtM and Custom results are revalidated and canonicalized at the persistence boundary. Guest rolls remain non-persistent. Personal history remains distinct from server-authoritative campaign roll history and is not campaign evidence.

The CoC 7e dice boundary is located under:

```text
lib/game-systems/call-of-cthulhu-7e/
```

Its deterministic evaluator and random generator cover percentile rolls plus CoC Other Dice. Percentile rolls use one units die, a base tens die, and up to three bonus or penalty tens dice; target is optional, and interpretation is omitted without one. Other Dice supports D2, D3, D4, D6, D8, D10, D20, and D100 with one die type per roll. Both tools are personal and client-generated.

The personal-history application registry supports version 1 of `vtm_v5`, `custom_dice_pool`, `coc_7e_percentile`, and `coc_7e_other_dice`. It revalidates and canonicalizes writes and safely skips malformed, unknown-kind, or unsupported-version reads. The first Phase 4D1 migration broadened the database envelope to syntactically valid kinds and positive versions. The deployed follow-up migration changes prospective pruning to six rows per owner and roller kind and adds owner-authenticated scoped clearing; row deletion, owner RLS, and best-effort semantics remain shared and generic.

The same pure evaluators are reused by the implemented server-authoritative Campaign Dice execution layer. That layer remains responsible for randomness, authorization, transport, and persistence; no parallel campaign rules engine exists.

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
System-aware Campaign Dice execution through the Phase 4D2 session-scoped Journal contract
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

LiveKit owns video/audio and Gallery image-presentation transport only. It does not control Game Room access, Game Session lifecycle, Journal, or Campaign Dice. Join, Leave, camera, microphone, refresh, and disconnect therefore cannot start or end a Game Session. Browsing Gallery requires no LiveKit connection; Share/Presentation requires the GM to be connected and reaches only LiveKit-connected participants.

### Campaign-content domain

Implemented scope:

```text
Image-only Campaign Gallery with fixed Handouts, NPC, Maps & Plans, and Other sections
```

Approved planned scope:

```text
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

Persisted system data must be normalized by its own boundary:

```text
normalizeVtmV5SheetData()
normalizeCoc7eSheetData()
```

Unknown top-level keys are preserved under `extensions`.

The CoC schema is version 1 and remains separate from VtM. It owns CoC identity, characteristics, mutable vitals, conditions, fixed and specialty skills, weapons, Story, Backstory, Gear & Possessions, and Wealth. Hard/Extreme thresholds, Idea, Know, maximum HP/MP/SAN, the Starting-SAN-based Insane threshold, Move, Build, and Damage Bonus are calculated rather than duplicated in JSONB. Static skill bases remain system definitions. CoC and VtM use separate draft namespaces and page-state keys while sharing only proven common UI such as the portrait field.

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
8. Phase 4C2 Game Room Image Presentation — complete and accepted in Production;
9. Phase 4D1 CoC 7e Dice Roller — deployed with its UX follow-up;
10. Phase 4D2 system-aware Game Room Dice Integration — complete, deployed, and accepted in Production;
11. Phase 4E Fair Turn Order Dice — complete, deployed, and accepted in Production;
12. Phase 4F1 CoC 7e Character Sheets — implemented and deployed, with Production manual acceptance pending;
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
