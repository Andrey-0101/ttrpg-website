# Architecture

## Status

Initial architecture baseline for the current VtM-focused application and the planned friend-alpha campaign platform.

## Architectural goals

1. Deliver practical value to a small private group before optimizing for unrestricted public use.
2. Keep game-system-specific behavior isolated from common platform behavior.
3. Preserve existing character data through explicit schema versions and normalizers.
4. Build the minimum campaign access model before shared dice or video.
5. Keep decorative design separate from business logic and persisted data.
6. Avoid unnecessary universal abstractions until a second game system exposes real common requirements.

## Runtime topology

```text
Browser
  |
  | HTTPS
  v
Next.js App Router on Vercel
  |
  +-- Server Components and Route Handlers
  +-- Client Components
  +-- next-intl locale middleware
  +-- Supabase session refresh
  |
  v
Supabase
  +-- PostgreSQL
  +-- Auth
  +-- Row Level Security
  +-- Storage
```

Future external service boundary:

```text
Next.js server
  |
  +-- managed video provider
```

The video provider is not selected or implemented.

## Route architecture

Localized application routes are under:

```text
app/[locale]/
```

Current route groups include:

```text
/[locale]
/[locale]/account
/[locale]/characters
/[locale]/characters/[id]
/[locale]/characters/new
/[locale]/characters/new/[system]
/[locale]/dashboard
/[locale]/games
/[locale]/games/vampire-the-masquerade
/[locale]/login
/[locale]/profile
/[locale]/profile/edit
/[locale]/register
```

Technical route:

```text
/auth/confirm
```

The technical callback remains outside locale-prefixed application routes. The intended locale is carried explicitly by the registration/confirmation flow.

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
- owner-filtered or RLS-protected data loading;
- signed portrait URL creation for initial render;
- metadata generation;
- future campaign membership authorization;
- future video token issuance;
- future persisted campaign dice execution.

### Client responsibilities

Client components currently handle:

- interactive forms;
- local drafts;
- page switching;
- portrait file selection and preview;
- explicit save mutations;
- rating and tracker controls;
- responsive interaction.

Do not move security decisions exclusively into client code. The browser can improve UX, but RLS and server-side authorization must remain authoritative.

## Domain model

### Core domain

Owns:

```text
Auth
Profiles
Localization
Navigation
Common errors
Shared UI primitives
```

It must not know VtM rules.

### Character domain

Owns:

```text
Character lifecycle
Common character columns
Portrait lifecycle
Visibility value
Sheet selection
Draft lifecycle
```

It delegates system-specific data and presentation to the game-system domain.

### Game-system domain

Each system may provide:

```text
System ID and metadata
Default sheet data
Schema version
Normalizer/migration
Sheet renderer
Summary renderer
Dice engine
Theme tokens
Game-hub content
Campaign-specific settings
```

Current system:

```text
vtm-v5
```

Future system:

```text
call-of-cthulhu-7e
```

The project should not introduce a large universal game abstraction before CoC work shows which interfaces are genuinely shared.

### Campaign domain

Proposed:

```text
Campaign
Membership
Role
Invitation
Character assignment
Campaign navigation
Authorization helpers
```

Campaigns are platform-level entities with a `game_system` discriminator. VtM-specific rules must not be stored as generic campaign columns.

### Realtime domain

Proposed:

```text
Dice execution
Dice feed
Presence
Video room access
Session realtime state
```

Shared realtime features require campaign membership. They must not establish a separate user-access model.

### Campaign-content domain

Proposed:

```text
Handouts
NPCs
Sessions
Shared notes
GM-private notes
```

### Game-hub content domain

Owns informational content for a game system:

```text
Landing
Getting started
Character guide
Quick reference
Resources
Tool links
```

This domain is distinct from a private campaign workspace.

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

The schema is presentation-independent. Desktop A4, mobile, summary-card, and future print renderers must consume the same validated data.

## Storage architecture

Portrait bytes are stored in a private Supabase Storage bucket. The database stores only a path/reference in `characters.portrait_url`.

New object paths use:

```text
USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME
```

The current column name is retained for compatibility even though it stores a path for new private portraits.

## State and persistence

Current persistence model:

- explicit Save;
- one typed sheet-data object;
- local `sessionStorage` draft;
- active-page restoration;
- portrait `File` excluded from draft serialization.

Future friend-alpha work should add unsaved-change protection and clearer mutation status without introducing complex autosave.

## Error handling

Rules:

- do not display raw Supabase or backend messages;
- map technical failures to safe localized messages;
- log only what is appropriate for the environment;
- do not include secrets, tokens, or sensitive object paths in user-visible errors.

## Deployment workflow

Current workflow:

```text
feature branch
  -> pull request
  -> Vercel Preview
  -> manual verification
  -> merge to main
  -> Vercel Production
  -> stable production alias verification
```

A pushed branch is not production. A Ready deployment must be associated with the intended commit before release confidence is claimed.

## Future architecture sequence

1. document the current baseline;
2. complete Character Friend Alpha usability;
3. add campaign foundation;
4. add VtM dice;
5. prototype managed video;
6. assemble friend-only campaign workspace;
7. complete the visual system;
8. build the VtM game hub;
9. complete public-readiness work;
10. add Call of Cthulhu 7e.

## Explicit non-goals for the current phase

- building a general-purpose virtual tabletop;
- self-hosting WebRTC media infrastructure;
- public campaign discovery;
- anonymous character access;
- final print/PDF;
- a universal rule engine for all TTRPGs;
- unrestricted public launch.
