# Current Site Structure

## Document control

| Field | Value |
|---|---|
| Project | TTRPG Hub |
| Document type | Current information architecture |
| Status | Implemented snapshot |
| Repository snapshot | `main` at `cb6a07f11669916c8af68d0f0c93033438c901ea` |
| Current milestone | Milestone 4 — VtM Realtime Tools |
| Completed milestones | Architecture Baseline, Character Friend Alpha, Campaign Foundation, Phase 4A personal dice and personal persistence |

## Purpose

This document records the implemented user-facing route and navigation structure.

It does not describe unimplemented shared campaign dice, standalone or campaign video, handout, NPC, session, notes, Public Readiness, or Call of Cthulhu routes as current.

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

The full VtM Game Hub remains planned.

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

## Current authorization shape

| Area | Current access |
|---|---|
| Dashboard | authenticated user |
| My Characters | authenticated owner |
| Character edit/delete | owner only |
| Campaign shared character | active campaign GM or Player; read only |
| My Campaigns | authenticated participant |
| Campaign Overview | campaign GM or active Player |
| Invitation management | GM only |
| Accept invitation | authenticated valid token holder |
| Remove Player | GM only |
| Leave campaign | current Player |
| Campaign edit/complete/delete | GM only |
| Profile edit | self only |

RLS and Storage policies remain authoritative.

## Current limitations

Not implemented:

- shared campaign dice;
- campaign-authoritative persisted roll history;
- realtime dice feed;
- standalone Video Rooms;
- campaign video integration;
- handouts;
- NPCs;
- sessions/Chronicle;
- campaign notes;
- public character pages;
- Public Readiness routes;
- Call of Cthulhu character support.

## Current structural conclusion

The site is now a bilingual VtM character and campaign manager with public personal VtM and Custom dice tools, saved Custom presets, private personal history, and a twelve-system planned catalogue.

It has a working campaign authorization boundary and is ready for the approved next sequence:

1. Phase 4B standalone Video Rooms architecture/security, provider comparison, disposable spike, implementation, and testing;
2. Phase 4C Campaign Collaboration Contract;
3. Phase 4D persisted shared campaign dice;
4. Phase 4E campaign video integration through the reusable video core;
5. Phase 4F campaign workspace integration.
