# Current Site Structure

## Document control

| Field | Value |
|---|---|
| Project | TTRPG Hub |
| Document type | Current information architecture |
| Status | Implemented snapshot |
| H011 consolidation baseline | `main` at `609b6d9ec972bc842bfc8de4e4080eecdb10d4c8` |
| Current phase | Phase 4 — Core Play & Campaign Tools |
| Completed work | Milestones 1–3, Phase 4A personal dice and persistence, Phase 4B Campaign Video Rooms Integration |
| Next work | Phase 4C1 Campaign Image Library |

## Purpose

This document records the implemented user-facing route and navigation structure.

It does not describe unimplemented campaign images/presentation, system-aware Game Room dice, CoC character support, campaign notes, system hubs, standalone video, general Handouts/NPC/Sessions/Chronicle, or Public Readiness routes as current.

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
/[locale]/games/vampire-the-masquerade/tools/dice
```

The public hub links to the implemented VtM V5 roller and system-neutral Custom Dice Pool. Registered users may save up to five Custom Dice Pool presets and retain private personal VtM and Custom roll history; guest rolls remain local and non-persistent. Personal history is non-authoritative and separate from future campaign history.

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
- completion and deletion;
- loading and unavailable states.

The current foundation intentionally keeps these controls on the overview route rather than creating separate Members, Characters, or Settings routes.

### Campaign Game Room

```text
/[locale]/campaigns/[id]/game-room
```

This authenticated participant-only route is the dedicated campaign virtual tabletop. Its active surface is the existing campaign-authorized video room: explicit Join/Leave, local camera and microphone controls, participant media tiles, sound unlock, reconnect, cleanup, and safe states. Campaign Dice, Handouts, Participants, Quick Notes, and Session Context labels are present only as non-interactive placeholders and do not define active roadmap scope. Completed campaigns cannot start a video connection.

The accepted participant model is one GM plus up to six Players. The responsive layout keeps seven stable 16:9 slots, uses a compact Game Room header and final accepted video-card controls, and reflows with vertical scrolling where needed. The last human Production group test passed with one GM and four Players, without quantitative network or connection-quality telemetry; no additional acceptance retest is currently required.

## Current authorization shape

| Area | Current access |
|---|---|
| Dashboard | authenticated user |
| My Characters | authenticated owner |
| Character edit/delete | owner only |
| Campaign shared character | active campaign GM or Player; read only |
| My Campaigns | authenticated participant |
| Campaign Overview | campaign GM or active Player |
| Campaign Game Room | campaign GM or Player through campaign RLS; active campaign required to Join video |
| Invitation management | GM only |
| Accept invitation | authenticated valid token holder |
| Remove Player | GM only |
| Leave campaign | current Player |
| Campaign edit/complete/delete | GM only |
| Profile edit | self only |

RLS and Storage policies remain authoritative.

## Current limitations

Not implemented:

- Campaign Image Library and Game Room image presentation;
- CoC dice and system-aware Game Room dice;
- CoC character sheets and system-aware linked-character integration;
- campaign-authoritative persisted roll history or realtime feed unless approved within 4D2;
- standalone Video Rooms;
- campaign video moderation and other uncommitted media expansion;
- general Handouts, NPCs, Sessions, and Chronicle records;
- campaign notes;
- public character pages;
- Public Readiness routes;
- Call of Cthulhu character support.

## Current structural conclusion

The site is now a bilingual VtM character and campaign manager with public personal VtM and Custom dice tools, saved Custom presets, private personal history, a twelve-system catalogue, a generic CoC campaign shell, and an accepted campaign LiveKit Game Room.

It has a working campaign authorization boundary and a Production-accepted campaign video workspace. Phase 4C1 Campaign Image Library is next. The approved forward sequence is 4C1/4C2 campaign images, 4D1/4D2 CoC and system-aware dice, 4E technical Campaign/Game Room refinement, 4F1/4F2 CoC and linked-character integration, and 4G narrowly scoped campaign notes.

Standalone Video Rooms and broad Handouts/NPC/Sessions/Chronicle modules are uncommitted backlog possibilities, not current limitations that imply scheduled delivery.
