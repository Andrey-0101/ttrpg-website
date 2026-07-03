# Target Site Structure

## Document control

| Field | Value |
|---|---|
| Project | TTRPG Hub |
| Document type | Target information architecture |
| Status | Proposed initial version for review |
| Target scope | Friend-alpha through public-ready multi-system platform |
| First complete game system | Vampire: The Masquerade Fifth Edition |
| Later game system | Call of Cthulhu Seventh Edition |
| Route model | Locale prefix required for application routes |

## Purpose

This document defines the proposed target structure of the website. It is an information-architecture target, not a statement that all listed routes already exist.

The structure supports the agreed sequence:

1. Character Friend Alpha
2. Campaign Foundation
3. VtM Realtime Tools
4. Friend Campaign Alpha
5. Visual Identity
6. VtM Game Hub
7. Public Readiness
8. Call of Cthulhu 7e

## Target top-level structure

- Home
- Games
  - Vampire: The Masquerade
  - Call of Cthulhu
- Characters
- Campaigns
- Personal Dashboard
- Profile and Account
- Help and Legal
- Technical routes

The main architectural distinction is:

- **Game Hub**: general information and system-specific tools;
- **Campaign Workspace**: private collaboration space for a specific gaming group;
- **Personal Dashboard**: the user's own overview across characters and campaigns.

## Proposed primary navigation

### Public user

- Home
- Games
- Log in
- Register
- Language

### Authenticated user

- Home
- Games
- Characters
- Campaigns
- Dashboard
- Profile/Account
- Language
- Log out

### Campaign context navigation

When a user is inside a campaign:

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

Only sections implemented for the current milestone should be visible.

## Target route tree

### 1. Core public routes

- `/[locale]`
  - Home
- `/[locale]/games`
  - Game catalogue
- `/[locale]/help`
  - Help centre
- `/[locale]/about`
  - Project information and unofficial fan-project notice
- `/[locale]/contact`
  - Contact and support
- `/[locale]/privacy`
  - Privacy policy
- `/[locale]/terms`
  - Terms of use

Help and legal routes belong to the Public Readiness milestone and do not need to exist during early friend-alpha.

### 2. Authentication routes

- `/[locale]/login`
- `/[locale]/register`
- `/[locale]/account`
- `/[locale]/account/security`
- `/[locale]/account/privacy`
- `/[locale]/account/data`
- `/auth/confirm`

Possible future technical routes:

- `/auth/reset-password`
- `/auth/update-password`

Account security, privacy, export, and deletion are public-readiness targets.

### 3. Personal dashboard

- `/[locale]/dashboard`

Target dashboard sections:

- quick actions;
- recent characters;
- active campaigns;
- upcoming or recent sessions;
- recent activity;
- relevant game tools;
- incomplete profile or setup notices.

The dashboard should aggregate existing resources rather than duplicate their management interfaces.

### 4. Characters

Keep the existing route family to avoid unnecessary migration:

- `/[locale]/characters`
  - My Characters
- `/[locale]/characters/new`
  - Select game system
- `/[locale]/characters/new/[system]`
  - Create character
- `/[locale]/characters/[id]`
  - View/edit character

Potential public-ready additions:

- `/[locale]/characters/[id]/settings`
  - Character settings, language, visibility, campaign assignment
- `/[locale]/shared/characters/[shareId]`
  - Public or explicitly shared read-only character

Public sharing remains optional and must not be implemented until its access model is approved.

### 5. Games catalogue

- `/[locale]/games`
  - All supported games
- `/[locale]/games/vampire-the-masquerade`
  - VtM Game Hub
- `/[locale]/games/call-of-cthulhu-7e`
  - CoC Game Hub

Each system hub follows a common structure while allowing system-specific content.

### 6. VtM Game Hub

Recommended routes:

- `/[locale]/games/vampire-the-masquerade`
  - Overview
- `/[locale]/games/vampire-the-masquerade/getting-started`
  - Getting Started
- `/[locale]/games/vampire-the-masquerade/character-creation`
  - Character Creation Guide
- `/[locale]/games/vampire-the-masquerade/quick-reference`
  - Quick Reference
- `/[locale]/games/vampire-the-masquerade/resources`
  - Official and reviewed external resources
- `/[locale]/games/vampire-the-masquerade/tools`
  - Available VtM tools
- `/[locale]/games/vampire-the-masquerade/tools/dice`
  - Personal VtM dice roller

The hub should link to Characters and Campaigns, but it should not contain private campaign data.

### 7. Call of Cthulhu Game Hub

Later target:

- `/[locale]/games/call-of-cthulhu-7e`
- `/[locale]/games/call-of-cthulhu-7e/getting-started`
- `/[locale]/games/call-of-cthulhu-7e/character-creation`
- `/[locale]/games/call-of-cthulhu-7e/quick-reference`
- `/[locale]/games/call-of-cthulhu-7e/resources`
- `/[locale]/games/call-of-cthulhu-7e/tools`
- `/[locale]/games/call-of-cthulhu-7e/tools/dice`

Only the structure is proposed. Content, character schema, dice rules, and theme are deferred until the CoC milestone.

### 8. Campaigns

#### Campaign list and entry

- `/[locale]/campaigns`
  - My Campaigns
- `/[locale]/campaigns/new`
  - Create campaign
- `/[locale]/campaigns/join`
  - Enter or process an invitation
- `/[locale]/campaigns/join/[token]`
  - Invitation acceptance

#### Campaign workspace

- `/[locale]/campaigns/[campaignId]`
  - Overview
- `/[locale]/campaigns/[campaignId]/members`
  - Members and roles
- `/[locale]/campaigns/[campaignId]/characters`
  - Player characters and campaign assignments
- `/[locale]/campaigns/[campaignId]/dice`
  - Shared campaign dice roller and feed
- `/[locale]/campaigns/[campaignId]/video`
  - Campaign video room
- `/[locale]/campaigns/[campaignId]/handouts`
  - Handout library
- `/[locale]/campaigns/[campaignId]/handouts/[handoutId]`
  - Handout detail
- `/[locale]/campaigns/[campaignId]/npcs`
  - NPC list
- `/[locale]/campaigns/[campaignId]/npcs/[npcId]`
  - NPC detail
- `/[locale]/campaigns/[campaignId]/sessions`
  - Session list
- `/[locale]/campaigns/[campaignId]/sessions/[sessionId]`
  - Session detail
- `/[locale]/campaigns/[campaignId]/notes`
  - Shared and GM-private notes
- `/[locale]/campaigns/[campaignId]/settings`
  - Campaign settings, invitations, lifecycle, and permissions

### 9. Session-specific structure

Sessions should become first-class campaign records.

A session detail may aggregate:

- date and time;
- participants;
- agenda or preparation;
- shared summary;
- GM-private notes;
- related handouts;
- related NPCs;
- related dice-roll history;
- video-room entry.

Possible later nested routes:

- `/[locale]/campaigns/[campaignId]/sessions/[sessionId]/dice`
- `/[locale]/campaigns/[campaignId]/sessions/[sessionId]/video`

For friend-alpha, campaign-level Dice and Video routes can be implemented first, with optional session filtering.

### 10. Profile and account

- `/[locale]/profile`
  - Public-facing profile information visible according to policy
- `/[locale]/profile/edit`
  - Edit profile
- `/[locale]/account`
  - Account overview
- `/[locale]/account/security`
  - Authentication and session settings
- `/[locale]/account/privacy`
  - Privacy preferences
- `/[locale]/account/data`
  - Data export and account deletion

The distinction should be:

- **Profile**: identity presented inside the platform;
- **Account**: credentials, privacy, and account lifecycle.

## Target functional hierarchy

### Platform layer

- Auth
- Profiles
- Localization
- Dashboard
- Help and legal
- Shared UI and navigation

### Character layer

- Common character lifecycle
- Portraits
- Game-system selection
- System-specific character sheets
- Character settings
- Campaign assignment
- Optional sharing

### Game-system layer

For each game:

- Game Hub
- Character schema and renderer
- Summary cards
- Dice engine
- Theme
- Quick reference
- Resources
- Campaign-specific system settings

### Campaign layer

- Campaign
- Membership
- Roles
- Invitations
- Character assignment
- Access control
- Workspace navigation

### Realtime tools layer

- Dice execution
- Shared roll feed
- Presence
- Video-room access
- Reconnection states

### Campaign content layer

- Handouts
- NPCs
- Sessions
- Shared notes
- GM-private notes

## Target access model

| Area | Target access |
|---|---|
| Home and game hubs | Public |
| Personal dice roller | Authenticated user, or public only if explicitly approved |
| Dashboard | Authenticated user |
| Character list | Owner |
| Character detail | Owner and later explicitly permitted campaign roles |
| Campaign list | Campaign member |
| Campaign workspace | Campaign member |
| Campaign settings | Owner or authorised GM |
| GM-private notes | Authorised GM only |
| Campaign dice feed | Members according to roll visibility |
| Campaign video token | Active campaign member |
| Public shared character | Anonymous or authenticated reader only through approved share policy |

Access must be enforced by RLS and server-side checks, not only by navigation visibility.

## Target structure by milestone

### Character Friend Alpha

Adds no major top-level area. It improves:

- Characters;
- save state;
- unsaved-change protection;
- loading and error states;
- visibility messaging.

### Campaign Foundation

Adds:

- Campaigns;
- campaign creation;
- joining by invitation;
- members;
- roles;
- character assignment;
- minimal overview.

### VtM Realtime Tools

Adds:

- personal VtM dice roller in the VtM Game Hub;
- campaign Dice;
- campaign Video.

### Friend Campaign Alpha

Adds:

- Handouts;
- NPCs;
- Sessions;
- Notes;
- complete friend-group Campaign Workspace.

### Visual Identity

Changes presentation, not the route hierarchy.

### VtM Game Hub

Expands the VtM routes into:

- Getting Started;
- Character Creation;
- Quick Reference;
- Resources;
- Tools.

### Public Readiness

Adds:

- Help;
- About;
- Contact;
- Privacy;
- Terms;
- account security/privacy/data pages;
- optional approved public-sharing routes.

### Call of Cthulhu 7e

Adds the second system hub, character sheet, dice tool, content, theme, and campaign integration.

## Navigation principles

1. Keep primary navigation short.
2. Do not show unavailable sections as working tools.
3. Use contextual campaign navigation inside campaign routes.
4. Keep Games informational and system-specific.
5. Keep Dashboard personal and cross-system.
6. Keep Characters as a reusable cross-system resource area.
7. Keep Campaigns as the private collaboration boundary.
8. Keep Profile separate from Account.
9. Preserve locale in every user-facing route.
10. Do not expose GM-private resources through shared navigation.

## Route naming principles

- Use plural nouns for resource collections.
- Use stable English route segments for both locales.
- Localise page labels, not route slugs.
- Keep existing character routes unless a concrete problem requires migration.
- Use readable game slugs.
- Use IDs for private resources.
- Use revocable non-sequential share identifiers for any future public-sharing route.
- Avoid placing campaign-private content under public game-hub routes.

## Target structure summary

The target site is best described as:

> A bilingual multi-system TTRPG hub combining private character management, campaign workspaces, system-specific dice tools, managed video rooms, campaign content, and curated game hubs.

The first practical target is not the complete public platform. It is a friend-only VtM workspace built in stages on top of the existing character manager.
