# Target Site Structure

## Document control

| Field | Value |
|---|---|
| Project | TTRPG Hub |
| Document type | Target information architecture |
| Status | Accepted direction; updated after Campaign Foundation |
| Current scope | Private friend-alpha |
| First complete game system | Vampire: The Masquerade Fifth Edition |
| Later game system | Call of Cthulhu Seventh Edition |
| Route model | Locale prefix required for application routes |

## Purpose

This document defines the accepted target information architecture.

It distinguishes:

- implemented current routes;
- the next Realtime Tools routes;
- later Friend Campaign Alpha and Public Readiness routes.

It does not claim that every target route already exists.

## Delivery sequence

1. Architecture Baseline — complete
2. Character Friend Alpha — complete
3. Campaign Foundation — complete
4. VtM Realtime Tools — active
5. Friend Campaign Alpha
6. Visual Identity
7. VtM Game Hub
8. Public Readiness
9. Call of Cthulhu 7e

## Target top-level structure

- Home
- Games
  - Vampire: The Masquerade
  - Call of Cthulhu
- Dashboard
- Characters
- Campaigns
- Profile and Account
- Help and Legal
- Technical routes

The Dashboard is an accepted part of the target structure. It is the personal cross-domain overview and should aggregate existing resources rather than duplicate their management interfaces.

## Architectural distinctions

### Game Hub

General information and system-specific tools:

- getting started;
- character guide;
- rules references;
- resources;
- personal dice tools.

### Campaign Workspace

Private collaboration for one campaign:

- overview;
- members;
- characters;
- shared dice;
- video;
- handouts;
- NPCs;
- sessions;
- notes;
- settings.

### Dashboard

The user's own overview across:

- characters;
- campaigns;
- recent activity;
- relevant tools;
- later sessions and notifications.

## Primary navigation

### Public user

- Home
- Games
- Log in
- Register
- Language

### Authenticated user

- Home
- Games
- Dashboard
- Campaigns
- Characters
- Profile/Account
- Language
- Log out

### Campaign context

Only implemented areas should be visible.

Target campaign navigation:

- Overview
- Members
- Characters
- Dice
- Video
- Handouts
- NPCs
- Sessions
- Notes
- Settings

The current Campaign Foundation keeps Members, Characters, Invitations, and Settings controls integrated into Campaign Overview. Separate routes should be introduced only when the workspace becomes too large or the next feature requires them.

## Target route tree

### Core public routes

```text
/[locale]
/[locale]/games
/[locale]/help
/[locale]/about
/[locale]/contact
/[locale]/privacy
/[locale]/terms
```

Help and legal routes belong to Public Readiness.

### Authentication

Current:

```text
/[locale]/login
/[locale]/register
/auth/confirm
```

Later:

```text
/[locale]/account/security
/[locale]/account/privacy
/[locale]/account/data
/auth/reset-password
/auth/update-password
```

### Dashboard

```text
/[locale]/dashboard
```

Target sections:

- quick actions;
- recent characters;
- active campaigns;
- relevant tools;
- later recent sessions and activity;
- setup notices.

### Characters

Current route family retained:

```text
/[locale]/characters
/[locale]/characters/new
/[locale]/characters/new/[system]
/[locale]/characters/[id]
```

Current campaign shared route:

```text
/[locale]/campaigns/[id]/characters/[characterId]
```

Potential Public Readiness additions:

```text
/[locale]/characters/[id]/settings
/[locale]/shared/characters/[shareId]
```

Public sharing remains deferred until its access model is approved.

### Games catalogue

```text
/[locale]/games
/[locale]/games/vampire-the-masquerade
/[locale]/games/call-of-cthulhu-7e
```

The CoC route family is planned for Milestone 9.

### VtM Game Hub

Recommended target:

```text
/[locale]/games/vampire-the-masquerade
/[locale]/games/vampire-the-masquerade/getting-started
/[locale]/games/vampire-the-masquerade/character-creation
/[locale]/games/vampire-the-masquerade/quick-reference
/[locale]/games/vampire-the-masquerade/resources
/[locale]/games/vampire-the-masquerade/tools
/[locale]/games/vampire-the-masquerade/tools/dice
```

The personal VtM dice route is the recommended next feature route.

### Campaigns

Current:

```text
/[locale]/campaigns
/[locale]/campaigns/new
/[locale]/campaigns/join/[token]
/[locale]/campaigns/[id]
/[locale]/campaigns/[id]/characters/[characterId]
```

Next Realtime Tools routes:

```text
/[locale]/campaigns/[id]/dice
/[locale]/campaigns/[id]/video
```

Later campaign-content routes:

```text
/[locale]/campaigns/[id]/handouts
/[locale]/campaigns/[id]/handouts/[handoutId]
/[locale]/campaigns/[id]/npcs
/[locale]/campaigns/[id]/npcs/[npcId]
/[locale]/campaigns/[id]/sessions
/[locale]/campaigns/[id]/sessions/[sessionId]
/[locale]/campaigns/[id]/notes
```

Optional later separation:

```text
/[locale]/campaigns/[id]/members
/[locale]/campaigns/[id]/characters
/[locale]/campaigns/[id]/settings
```

Do not create separate routes only to mirror a conceptual navigation section. Create them when the workflow benefits.

## Realtime route direction

### Personal dice

```text
/[locale]/games/vampire-the-masquerade/tools/dice
```

- no campaign required;
- system-specific VtM rules;
- local result in the first slice;
- no database persistence initially.

### Campaign dice

```text
/[locale]/campaigns/[id]/dice
```

- campaign membership required;
- server-authoritative execution;
- persisted history;
- Realtime feed;
- optional accessible character context.

### Campaign video

```text
/[locale]/campaigns/[id]/video
```

- campaign membership required;
- server-issued short-lived provider token;
- managed WebRTC provider;
- no permanent public room URL.

## Session structure

Sessions become first-class campaign records later.

A session may aggregate:

- date and time;
- participants;
- preparation;
- summary;
- related dice history;
- handouts;
- NPCs;
- notes;
- optional video room/session mapping.

Campaign-level dice and video should be implemented first. Session filtering can be added later.

## Domain ownership

### Platform

- Auth
- Profiles
- Localization
- Dashboard
- Characters lifecycle
- Campaigns
- Memberships
- Invitations
- Storage access
- Common navigation

### Game system

- sheet schema;
- normalizer;
- renderer;
- summary card;
- dice rules;
- terminology;
- theme;
- Game Hub content.

### Campaign content

- handouts;
- NPCs;
- sessions;
- shared notes;
- GM-private notes.

## Permission direction

| Area | Intended access |
|---|---|
| Dashboard | authenticated user |
| Character list | owner |
| Character edit/delete | owner |
| Campaign shared character | current campaign participant, read only |
| Campaign list | campaign participant |
| Campaign workspace | campaign participant |
| Campaign invitations | Game Master |
| Campaign settings/lifecycle | Game Master |
| Campaign dice feed | campaign participant according to approved roll policy |
| Campaign video token | active campaign participant |
| GM-private notes | Game Master only |
| Public shared character | only after separate approved policy |

RLS, server-side checks, and Storage policies remain authoritative.

## Target structure by milestone

### Completed Campaign Foundation

- Campaigns;
- creation;
- invitations;
- membership;
- campaign character sharing;
- management;
- completion;
- deletion.

### Active VtM Realtime Tools

- personal VtM dice;
- campaign dice;
- Realtime feed;
- managed-video spike;
- minimal campaign video room.

### Friend Campaign Alpha

- handouts;
- NPCs;
- sessions;
- notes;
- real friend-group session.

### Public Readiness

- help/legal;
- account security/privacy/data;
- monitoring;
- rate limiting;
- automated tests;
- public beta controls.

### Call of Cthulhu 7e

- CoC Game Hub;
- sheet;
- dice;
- campaign integration.

## Navigation rule

Never expose a navigation item merely because it exists in the target map.

Navigation should show only:

- implemented destinations;
- routes the current user is authorized to use;
- features appropriate to the current milestone.
