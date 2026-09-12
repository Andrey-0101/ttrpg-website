# Current Site Structure

## Document control

| Field | Value |
|---|---|
| Project | TTRPG Hub |
| Document type | Current information architecture |
| Status | Production route snapshot through accepted Phase 4D2 |
| Accepted Phase 4D2 application baseline | `main` at `01d917688ddadb5366949a714bba462b7c5c44b2` |
| Current phase | Phase 4 — Core Play & Campaign Tools |
| Completed work | Milestones 1–3 and Phases 4A–4D2 in Production; Phase 4E implemented pending Production acceptance |
| Next work | Complete Phase 4E Production acceptance, then plan/review Phase 4F1 |

## Purpose

This document records the implemented user-facing route and navigation structure.

It does not describe unimplemented CoC character support, campaign notes, system hubs, standalone video, document Handouts/NPC/Sessions/Chronicle, or Public Readiness routes as current. CoC personal dice and system-aware Game Room Campaign Dice are deployed.

## Current primary navigation

Primary navigation for guests and authenticated users includes:

- Home;
- Games;
- Dashboard;
- Campaigns;
- Characters;
- Dice Rollers;
- account area;
- language switcher.

The Dashboard is an accepted implemented personal overview route. It currently links to Campaigns and Characters and may expand later.

## Current route tree

```text
/
├── [locale]
│   ├── page.tsx
│   ├── not-found.tsx
│   ├── [...rest]
│   │   └── page.tsx
│   ├── account
│   │   └── page.tsx
│   ├── dashboard
│   │   └── page.tsx
│   ├── dice-rollers
│   │   ├── page.tsx
│   │   └── custom
│   │       └── page.tsx
│   ├── games
│   │   ├── page.tsx
│   │   ├── call-of-cthulhu
│   │   │   └── tools
│   │   │       └── dice
│   │   │           └── page.tsx
│   │   └── vampire-the-masquerade
│   │       ├── page.tsx
│   │       └── tools
│   │           └── dice
│   │               └── page.tsx
│   ├── login
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── register
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── profile
│   │   ├── page.tsx
│   │   └── edit
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── characters
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── new
│   │   │   ├── page.tsx
│   │   │   └── [system]
│   │   │       └── page.tsx
│   │   └── [id]
│   │       ├── page.tsx
│   │       ├── loading.tsx
│   │       └── not-found.tsx
│   └── campaigns
│       ├── page.tsx
│       ├── loading.tsx
│       ├── new
│       │   ├── page.tsx
│       │   └── loading.tsx
│       ├── join
│       │   └── [token]
│       │       ├── page.tsx
│       │       └── loading.tsx
│       └── [id]
│           ├── page.tsx
│           ├── loading.tsx
│           ├── not-found.tsx
│           ├── game-room
│           │   └── page.tsx
│           ├── gallery
│           ├── handouts (redirect to gallery)
│           │   ├── page.tsx
│           │   └── loading.tsx
│           └── characters
│               └── [characterId]
│                   ├── page.tsx
│                   ├── loading.tsx
│                   └── not-found.tsx
└── auth
    └── confirm
        └── route.ts
```

`loading.tsx` and `not-found.tsx` are framework route-state files, not literal URL segments.

## Public and authentication areas

### Home

```text
/[locale]
```

Current localized landing page.

### Games

```text
/[locale]/games
/[locale]/games/vampire-the-masquerade
```

The Games catalogue and basic VtM area exist.

The Vampire Game System Hub remains planned for Phase 8C, after CoC and Delta Green hubs.

### Dice Rollers

```text
/[locale]/dice-rollers
/[locale]/dice-rollers/custom
/[locale]/dice-rollers/go-first
/[locale]/games/call-of-cthulhu/tools/dice
/[locale]/games/vampire-the-masquerade/tools/dice
```

The Production hub links to the implemented VtM V5, CoC 7e, system-neutral Custom Dice Pool, and standalone Go First Dice rollers. Go First Dice uses Paul Meyer's fixed permutation-fair five-d60 configuration for a local, tie-free two-to-five-player turn order and has no persistence or account state. The CoC Percentile and Other Dice panels are public, localized, responsive, and client-generated. Registered users may save up to five Custom Dice Pool presets; deployed persistence retains six rows per owner and kind and displays up to five previous entries per kind alongside the current result on each matching roller page. Guest rolls remain local and non-persistent. Personal history is non-authoritative and separate from future campaign history.

### Authentication

```text
/[locale]/login
/[locale]/register
/auth/confirm
```

The login flow supports return to a pending campaign invitation.

### Profile and Account

```text
/[locale]/profile
/[locale]/profile/edit
/[locale]/account
```

Profile view and edit exist. Public-readiness security/privacy/data controls are not yet implemented.

## Dashboard

```text
/[locale]/dashboard
```

Current content:

- authenticated user identification;
- Campaigns card and link;
- Characters card and link.

The route is retained as the personal cross-domain overview.

## Characters

### My Characters

```text
/[locale]/characters
```

Implemented:

- owner list;
- summary cards;
- private portrait display;
- Open and Delete actions;
- loading, empty, retry, and safe error states.

### Create Character

```text
/[locale]/characters/new
/[locale]/characters/new/[system]
```

Implemented:

- system selection;
- VtM V5 creation;
- explicit create status;
- duplicate-submit protection;
- unsaved-change protection;
- optional portrait;
- Private or Campaign visibility.

Planned catalogue entries are displayed but have no active controls or routes. Only the VtM V5 creation route is available; direct unsupported system IDs remain unavailable.

Examples of registered but unavailable systems include:

```text
call-of-cthulhu-7e
```

### Character detail

```text
/[locale]/characters/[id]
```

Implemented:

- owner view and edit;
- two logical VtM pages;
- explicit Save;
- local draft restoration;
- portrait replacement/removal;
- Private or Campaign visibility;
- unavailable direct-route state;
- campaign-sharing indication when applicable.

### Shared campaign character

```text
/[locale]/campaigns/[id]/characters/[characterId]
```

Implemented:

- read-only normalized sheet;
- signed portrait;
- campaign participant access;
- safe unavailable state;
- return navigation to Campaign Overview.

Only the owner can edit through My Characters.

## Campaigns

### My Campaigns

```text
/[locale]/campaigns
```

Implemented:

- campaigns where the user is GM or Player;
- active/completed status;
- role display;
- creation action;
- loading, empty, retry, and error states.

### Create Campaign

```text
/[locale]/campaigns/new
```

Implemented:

- name;
- game system;
- description;
- creator as immutable GM;
- duplicate-submit protection;
- unsaved-change protection;
- success redirect.

### Invitation acceptance

```text
/[locale]/campaigns/join/[token]
```

Implemented:

- signed-out redirect to Login;
- return to invitation after authentication;
- explicit acceptance;
- safe unavailable-token behavior;
- loading state.

### Campaign Overview

```text
/[locale]/campaigns/[id]
```

Current integrated workspace sections:

- campaign identity, status, system, GM, creation date;
- campaign management for GM;
- invitations for GM;
- Game Master and Player list;
- Player leave and GM removal;
- linked characters;
- owned eligible character linking;
- campaign counts and navigation;
- compact Campaign Gallery entry and current-user accessible count across all four sections;
- completion and deletion;
- loading and unavailable states.

The current foundation intentionally keeps these controls on the overview route rather than creating separate Members, Characters, or Settings routes.

### Campaign Gallery

```text
/[locale]/campaigns/[id]/gallery
```

This campaign-scoped route implements the Phase 4C1 image-only Campaign Gallery. Four keyboard-accessible tabs select the fixed Handouts, NPC, Maps & Plans, and Other categories; the former localized `/handouts` route redirects to `/gallery`. NPC and Maps & Plans contain images only, not structured records. Enlarged viewing stays in an accessible page lightbox. The active GM can select multiple JPEG/PNG/WebP images up to 5 MiB each for sequential upload into the active category, view compact full-image thumbnails without cropping, and manage GM-only/all-Player/selected-Player visibility, named recipients, and Storage-first deletion within each image card. Active Players receive only RLS-authorized images through short-lived signed URLs and receive no access/recipient UI metadata. Completed GMs retain read-only viewing and category switching; completed Players receive no image access.

### Campaign Game Room

```text
/[locale]/campaigns/[id]/game-room
```

This authenticated participant-only route is the dedicated campaign virtual tabletop. It opens independently of LiveKit and exposes the stable `Journal | Gallery | Dice | Character` tool row immediately. Journal is the default/root Display view with no back arrow. Gallery opens directly in Handouts, retains its internal back arrow, and can be browsed without video; Share / Stop Share, synchronized Expand / Collapse, and late join/rejoin presentation still use LiveKit. Campaign Dice is available for VtM V5 and CoC 7e, while Character remains disabled until Phase 4F2. CoC opens directly in Percentile with its internal `← | Percentile | Other Dice` submenu; VtM opens directly without a Dice submenu. Completed campaigns cannot start a video connection or retain an active Game Session.

Only the GM can Start and End the one active Game Session. Journal persistence is exact-session scoped, and Game Session state plus Journal events propagate through Supabase Realtime independently of LiveKit. Without an active session, Campaign Dice results remain local to the roller and are neither broadcast nor persisted.

The accepted participant model is one GM plus up to six Players. The responsive layout keeps seven stable 16:9 slots, uses a compact Game Room header and final accepted video-card controls, and reflows with vertical scrolling where needed. The last human Production group test passed with one GM and four Players, without quantitative network or connection-quality telemetry. The Phase 4C2 presentation flow and corrected desktop Expand layout were also manually accepted in Production.

## Current authorization shape

| Area | Current access |
|---|---|
| Dashboard | authenticated user |
| My Characters | authenticated owner |
| Character edit/delete | owner only |
| Campaign shared character | active campaign GM or Player; read only |
| My Campaigns | authenticated participant |
| Campaign Overview | campaign GM or active Player |
| Campaign Gallery | campaign GM; active Players see only RLS-authorized images; completed GM read-only; completed Players denied image access |
| Campaign Game Room | campaign GM or Player through campaign RLS; active campaign required to Join video; only the active GM controls presentation |
| Invitation management | GM only |
| Accept invitation | authenticated valid token holder |
| Remove Player | GM only |
| Leave campaign | current Player |
| Campaign edit/complete/delete | GM only |
| Profile edit | self only |

RLS and Storage policies remain authoritative.

## Current limitations

Not implemented:

- CoC character sheets and system-aware linked-character integration;
- standalone Video Rooms;
- campaign video moderation and other uncommitted media expansion;
- general Handouts, NPCs, Sessions, and Chronicle records;
- campaign notes;
- public character pages;
- Public Readiness routes;
- Call of Cthulhu character support.

## Current structural conclusion

The Production site is a bilingual VtM character and campaign manager with public personal VtM, Custom, Go First, and CoC dice tools, saved Custom presets, roller-scoped private personal history, contextual Back destinations, live CoC Target bands, a twelve-system catalogue, a generic CoC campaign shell, and an accepted campaign LiveKit Game Room.

It has a working campaign authorization boundary, a Production-accepted campaign video workspace, an image-only Campaign Gallery, Game Room Image Presentation, independent Game Sessions, a session-scoped Realtime Journal, and system-aware Campaign Dice. Phase 4E Go First Dice is implemented pending final Production acceptance, followed by 4F1/4F2 CoC and linked-character integration and 4G narrowly scoped campaign notes.

Standalone Video Rooms and broad Handouts/NPC/Sessions/Chronicle modules are uncommitted backlog possibilities, not current limitations that imply scheduled delivery.
