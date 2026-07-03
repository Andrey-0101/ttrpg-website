# Current Site Structure

## Document control

| Field | Value |
|---|---|
| Project | TTRPG Hub |
| Document type | Current-state information architecture |
| Status | Initial version for review |
| Snapshot date | 2026-07-03 |
| Repository snapshot | `main` at `e2a412bd74af0971cea7bfdf28e42cfa6100e7a2` |
| Supported locales | `en`, `ru` |
| Route model | Locale prefix required for application routes |

## Purpose

This document records the structure that currently exists in the website. It describes implemented user-facing areas and routes. It does not include planned campaign, dice, video, handout, NPC, session, or Call of Cthulhu functionality.

## Current high-level structure

- Home
- Games
  - Vampire: The Masquerade
- Authentication
  - Log in
  - Register
  - Email confirmation callback
- Dashboard
- Characters
  - My Characters
  - Select a game system
  - Create a character for a selected system
  - View and edit a character
- Profile and account
  - Profile
  - Edit profile
  - Account
- System pages
  - Localized not found
  - Localized catch-all route

## Current route tree

All user-facing application routes are available under both `/en` and `/ru`.

- `/[locale]`
  - Home
- `/[locale]/games`
  - Games index
- `/[locale]/games/vampire-the-masquerade`
  - Current VtM game page
- `/[locale]/login`
  - Log in
- `/[locale]/register`
  - Registration
- `/[locale]/dashboard`
  - Authenticated dashboard
- `/[locale]/characters`
  - My Characters
- `/[locale]/characters/new`
  - Game-system selection for character creation
- `/[locale]/characters/new/[system]`
  - Character creation for a selected system
- `/[locale]/characters/[id]`
  - Character view and edit
- `/[locale]/profile`
  - User profile
- `/[locale]/profile/edit`
  - Edit profile
- `/[locale]/account`
  - Account page
- `/[locale]/[...rest]`
  - Localized catch-all and not-found handling
- `/auth/confirm`
  - Technical email-confirmation route outside locale-prefixed application routes

## Current functional areas

### 1. Public and entry pages

#### Home

Current entry point for the localized website.

#### Games

Current game catalogue area. It contains the Vampire: The Masquerade entry.

#### Vampire: The Masquerade page

Current game-specific landing page. It is not yet the complete VtM Game Hub defined in the target structure.

#### Authentication

Implemented:

- registration;
- log in;
- email confirmation;
- session persistence;
- log out through the authenticated application interface.

### 2. Authenticated user area

#### Dashboard

Current authenticated landing area.

The target structure will expand this into a personal overview that links recent characters, campaigns, activity, and relevant tools.

#### Profile

Implemented:

- profile view;
- profile editing.

#### Account

Current account page.

The public-ready target structure may later add security, privacy, data export, and account deletion under this area.

### 3. Characters

#### My Characters

Implemented:

- owner-only character listing;
- summary cards;
- private portraits;
- open and delete actions.

#### Character creation

Implemented flow:

1. open character creation;
2. select a game system;
3. open the selected system form;
4. create the character;
5. upload an optional private portrait.

Current fully implemented system:

- `vtm-v5`.

Registered but unavailable:

- `call-of-cthulhu-7e`.

#### Character page

Implemented:

- view mode;
- edit mode;
- explicit save;
- two logical VtM pages;
- desktop A4-oriented layout;
- responsive mobile and tablet layout;
- private portrait display;
- local tab draft and page restoration.

### 4. Technical and localization structure

#### Locale handling

Application routes use an explicit locale prefix:

- `/en/...`
- `/ru/...`

#### Confirmation callback

`/auth/confirm` remains outside the localized route group and redirects to the intended localized page after processing.

#### Not-found handling

The localized layout includes both a not-found page and a catch-all route.

## Current access model

| Area | Current access |
|---|---|
| Home | Public |
| Games index | Public |
| VtM game page | Public |
| Login and registration | Public |
| Dashboard | Authenticated user |
| Profile and account | Authenticated user |
| Character list | Character owner |
| Character detail | Character owner |
| Character portrait | Character owner through private Storage and signed URL |

The character visibility values `campaign` and `public` exist in the data model, but current Row Level Security still provides owner-only access.

## Current navigation model

The current structure is primarily organised around:

- public entry and game pages;
- authenticated dashboard;
- characters;
- user profile/account;
- locale switching;
- authentication state.

Campaign navigation, shared tools, and game-system content navigation do not yet exist.

## Current structure limitations

1. The Games area contains only a basic VtM entry rather than a complete game hub.
2. Dashboard is not yet the central personal workspace.
3. Characters are independent owner-only resources and cannot yet belong to a campaign.
4. There is no Campaigns area.
5. There is no VtM dice tool.
6. There is no shared dice feed.
7. There is no video room.
8. There are no handouts, NPCs, sessions, or campaign notes.
9. `campaign` and `public` character visibility values do not yet change access.
10. Call of Cthulhu is registered but not available.
11. Help, legal, privacy, support, and public-readiness pages are not yet part of the site structure.
12. Independent character-sheet language is not yet part of the user-facing structure.

## Current structure summary

The current site is best described as:

> A bilingual authenticated VtM character manager with a small public game catalogue and basic user account area.

It is already usable for creating and maintaining private VtM characters, but it is not yet a campaign-management or online-session platform.
