# Current Site Structure

## Document control

| Field | Value |
|---|---|
| Project | TTRPG Hub |
| Document type | Current information architecture |
| Status | Implemented snapshot |
| Repository snapshot | `main` at `a1c3a61381a2b7cddab9dd8fb620af56342209a9` |
| Current milestone | Milestone 4 — VtM Realtime Tools |
| Completed milestones | Architecture Baseline, Character Friend Alpha, Campaign Foundation |

## Purpose

This document records the implemented user-facing route and navigation structure.

It does not describe unimplemented custom dice, persisted dice, video, handout, NPC, session, notes, Public Readiness, or Call of Cthulhu routes as current.

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
│   │   └── page.tsx
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
/[locale]/games/vampire-the-masquerade/tools/dice
```

The public hub lists VtM V5 as available and marks the future Custom Dice Pool as planned without linking to an unfinished route. Guest rolls are local and non-persistent.

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

Registered but unavailable:

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

- Custom Dice Pool;
- saved presets and personal roll history;
- shared campaign dice;
- persisted roll history;
- realtime dice feed;
- video rooms;
- handouts;
- NPCs;
- sessions/Chronicle;
- campaign notes;
- public character pages;
- Public Readiness routes;
- Call of Cthulhu character support.

## Current structural conclusion

The site is now a bilingual VtM character and campaign manager with a public personal dice tool.

It has a working shared authorization boundary and is ready for the next sequence:

1. Custom Dice Pool and reviewed personal persistence;
2. persisted shared campaign dice;
3. managed-video spike and minimal campaign video room;
4. remaining friend campaign workspace.
