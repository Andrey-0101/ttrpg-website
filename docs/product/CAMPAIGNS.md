# Campaigns

## Status

Proposed architecture. Campaigns are not implemented.

## Purpose

A campaign is the private collaboration boundary for a group of players and one or more Game Masters.

It will connect:

- members;
- roles;
- characters;
- dice rolls;
- video access;
- handouts;
- NPCs;
- sessions;
- notes.

The first campaign implementation is for a small invited group, not public discovery.

## Ordering decision

The minimum campaign foundation must be implemented before shared dice history and video-room access.

Reason:

- shared tools need a common authorization boundary;
- membership determines who can see rolls;
- membership determines who can receive video tokens;
- roles determine GM-only behavior;
- invitations require revocation and expiry;
- removing a member must remove future shared access.

## Proposed core entities

These are design drafts, not current database objects.

### Campaign

Candidate fields:

```text
id
owner_id
game_system
name
description
status
created_at
updated_at
```

Principles:

- a campaign belongs to one game system;
- common campaign columns remain system-neutral;
- VtM-specific settings belong in a versioned settings object or system-specific extension.

### Campaign membership

Candidate fields:

```text
campaign_id
user_id
role
status
joined_at
```

Initial roles:

```text
owner
game_master
player
```

Do not begin with a fully customizable permission engine.

### Invitation

Candidate fields:

```text
id
campaign_id
invited_by
token_hash
expires_at
max_uses
used_count
revoked_at
created_at
```

Friend-alpha requirements:

- expiring invitation;
- revocation;
- membership check;
- no permanent access from a leaked old link.

Store a secure token representation, not a reusable raw secret where avoidable.

### Character assignment

Open design question:

- one active campaign per character;
- or many-to-many character participation.

Recommended initial data model:

```text
campaign_characters
```

This preserves flexibility even if the first UI restricts a character to one active campaign.

## Minimum campaign UI

### My Campaigns

- list campaigns;
- create campaign;
- join by invitation;
- show role and game system.

### Campaign Overview

- name and description;
- game system;
- Game Master;
- members;
- linked characters;
- links to available tools.

### Members

- list members;
- show role;
- invite;
- revoke invite;
- remove member;
- leave campaign.

### Characters

- link a character;
- list player characters;
- respect character ownership;
- define GM visibility before implementation.

## Friend Campaign Alpha target

After campaign foundation and shared tools exist, the workspace should include:

1. Overview
2. Members
3. Characters
4. Dice
5. Video
6. Handouts
7. NPCs
8. Sessions and Notes

This is not intended to become a full virtual tabletop in the first release.

## Proposed content areas

### Handouts

Potential content:

- image;
- PDF;
- text;
- external link;
- title;
- description;
- visibility.

Potential visibility:

```text
game_master_only
all_members
selected_members
```

### NPCs

Initial modes:

```text
simple NPC
full character sheet
```

A simple NPC may include:

- name;
- portrait;
- public description;
- GM-private notes;
- status;
- system-specific summary.

### Sessions

Recommended first-class entity:

- date/time;
- title;
- summary;
- participants;
- shared notes;
- GM notes;
- related handouts;
- related roll log;
- related video room.

## Authorization principles

Every campaign-owned resource must derive access from membership and role.

Minimum checks:

- only members can read campaign content;
- only authorized roles can modify settings;
- only authorized roles can invite/remove;
- excluded members lose access;
- invitation validity is checked server-side;
- RLS remains authoritative;
- video tokens are issued only after membership validation.

## Game-system boundaries

Campaigns are common platform objects.

System adapters may add:

- campaign labels;
- default sections;
- dice behavior;
- NPC presentation;
- theme;
- game-specific settings.

VtM rules must not become fixed columns on generic campaign tables.

## Open questions

- Can a campaign have multiple Game Masters?
- Can the owner transfer ownership?
- Can a GM edit player sheets, or only view them?
- Can a player have multiple characters in one campaign?
- Are inactive/archived campaigns retained?
- How are session time zones handled?
- What handout file types and quotas are allowed?
- Which campaign content appears in activity history?

These questions should be answered before the corresponding migration, not all at once during the architecture baseline.
