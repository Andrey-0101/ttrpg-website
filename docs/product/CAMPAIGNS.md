# Campaigns

## Status

Reviewed Campaign Foundation design. Campaigns are not implemented yet.

The approved minimum contract is documented here before any campaign migration is applied.

## Purpose

A campaign is the private collaboration and authorization boundary for one Game Master and invited Players.

It will eventually connect:

- members;
- characters;
- dice rolls;
- video access;
- handouts;
- NPCs;
- sessions;
- notes.

The first implementation is for a small invited group, not public discovery.

## Ordering decision

The minimum campaign foundation must be implemented before shared dice history and video-room access.

Reason:

- shared tools need one authorization boundary;
- membership determines who can see campaign resources;
- membership determines who can receive video tokens;
- the Game Master boundary determines management actions;
- invitations require revocation and expiry;
- removing a Player must remove future shared access.

## Approved role model

A campaign has exactly one Game Master.

Rules:

- the user who creates the campaign becomes its Game Master;
- the Game Master is stored in `campaigns.game_master_id`;
- `game_master_id` is immutable;
- a second Game Master cannot be assigned;
- Game Master transfer is not supported;
- the Game Master is not duplicated in `campaign_members`;
- every row in `campaign_members` represents a Player;
- there is no customizable permission engine in the first version.

The Game Master can:

- update campaign settings while the campaign is active;
- create and revoke Player invitations;
- remove Players;
- view linked campaign characters;
- complete or delete the campaign.

A Player can:

- read campaigns they have joined;
- read the campaign member list;
- leave the campaign;
- link or unlink their own eligible character;
- view characters shared with the campaign.

The Game Master cannot leave the campaign. The Game Master may complete or delete it.

Deleting the Game Master's Auth account deletes the campaign through `ON DELETE CASCADE`. Ownership transfer is not part of the initial model.

## Approved core entities

These are reviewed design contracts, not current database objects.

### Campaign

Candidate fields:

```text
id
game_master_id
game_system
name
description
status
created_at
updated_at
```

Approved statuses:

```text
active
completed
```

Rules:

- a campaign belongs to one game system;
- `game_master_id` is the single source of truth for the Game Master;
- `game_master_id` cannot be changed;
- common campaign columns remain system-neutral;
- VtM-specific settings must not become generic campaign columns;
- completed campaigns are read-only in the first version;
- completing a campaign revokes unused invitations and ends active character assignments.

### Campaign membership

Candidate fields:

```text
campaign_id
user_id
joined_at
```

Rules:

- every row represents a Player;
- there is no `role` column;
- the Game Master must not also exist as a Player row;
- a Player can leave;
- the Game Master can remove a Player;
- direct membership insertion is not allowed;
- membership is created only by accepting a valid invitation.

### Invitation

Candidate fields:

```text
id
campaign_id
created_by
token_hash
expires_at
accepted_at
accepted_by
revoked_at
created_at
```

Approved behavior:

- invitations add a user only as a Player;
- an invitation is single-use;
- an invitation expires after seven days;
- the Game Master can revoke an unused invitation;
- only a token hash is stored;
- the raw token is returned only when the invitation is created;
- acceptance is validated atomically on the server/database boundary;
- campaign and invitation row locks serialize acceptance, revocation, and campaign completion;
- expired, revoked, accepted, and unknown tokens return the same safe application-level failure;
- a leaked old link must not grant permanent access.

`created_by` must equal the campaign's `game_master_id`.

### Character assignment

Reviewed initial table:

```text
campaign_characters
```

Approved behavior:

- a character can have only one active campaign assignment;
- historical unlinked assignments may remain for audit and future archive work;
- a user can link only their own character;
- the character must use `visibility = campaign`;
- the character and campaign must use the same game system;
- linking does not transfer character ownership;
- only the character owner can edit or delete the character;
- campaign participants receive read-only access while the assignment is active;
- unlinking does not delete the character;
- removing a Player ends active assignments for that Player's characters;
- changing a character away from `campaign` visibility ends its active assignment;
- changing the game system of a linked character ends its active assignment;
- completing a campaign ends active assignments.

## Character access

Character ownership remains unchanged.

| Actor | Linked campaign character |
|---|---|
| Character owner | Read, update, delete through existing owner policies |
| Campaign Game Master | Read only |
| Campaign Player | Read only |
| Removed Player | No campaign-derived access |
| Unrelated authenticated user | No access |
| Anonymous user | No access |

Campaign read access applies only when:

- the character has `visibility = campaign`;
- the character and campaign use the same game system;
- the character has an active campaign assignment;
- the character owner is still the Game Master or an active Player;
- the viewer is the campaign Game Master or an active Player.

Private portrait access must follow the same campaign read boundary through an additional Storage SELECT policy. The policy must validate both the owner ID and character ID encoded in the Storage path. Existing owner-folder upload, update, and delete policies remain unchanged.

## Minimum campaign UI

### My Campaigns

- list campaigns where the user is Game Master or Player;
- create campaign;
- join by invitation;
- show game system and the user's position as Game Master or Player.

### Create Campaign

- name;
- game system;
- optional description;
- creator becomes the immutable Game Master;
- optional Player invitation creation after the campaign row exists.

### Campaign Overview

- name and description;
- game system;
- status;
- Game Master;
- Players;
- linked characters;
- links only to features that are actually implemented.

### Members

- show the single Game Master;
- list Players;
- create Player invitation;
- revoke unused invitation;
- remove Player;
- allow a Player to leave.

There is no global Invitations section in the first version.

### Characters

- link an owned eligible character;
- list linked characters;
- provide campaign participants read-only access;
- preserve owner-only editing and deletion;
- unlink without deleting the character.

## Campaign lifecycle

### Active

- Game Master can update campaign settings;
- invitations can be created and revoked;
- Players can join or leave;
- Players can link eligible characters;
- campaign participants can read shared campaign characters.

### Completed

- campaign settings are read-only;
- unused invitations are revoked;
- active character assignments end;
- the Game Master can still delete the campaign;
- fuller archive behavior is deferred.

Reactivation is not part of the first version.

## Authorization principles

Every campaign-owned resource must derive access from the campaign boundary.

Minimum requirements:

- only the Game Master and active Players can read campaign data;
- only the Game Master can modify active campaign settings;
- only the Game Master can create/revoke invitations or remove Players;
- a Player can remove only their own membership;
- excluded Players immediately lose campaign-derived access;
- invitation validity is checked atomically;
- direct membership insertion is denied;
- RLS remains authoritative;
- UI checks are not authorization;
- video tokens and shared dice access will later use the same campaign boundary.

The reviewed access matrix is maintained in:

```text
docs/architecture/CAMPAIGN_RLS_MATRIX.md
```

## Game-system boundaries

Campaigns are common platform objects.

System adapters may later add:

- campaign labels;
- default sections;
- dice behavior;
- NPC presentation;
- theme;
- game-specific settings.

VtM rules must not become fixed columns on generic campaign tables.

## Deferred campaign content

The following are outside the Campaign Foundation migration:

- shared dice history;
- video rooms;
- handouts;
- NPCs;
- sessions;
- shared notes;
- Game Master private notes;
- campaign discovery;
- ownership transfer;
- multiple Game Masters;
- customizable roles;
- character editing by the Game Master;
- public campaign pages.

## Open questions for later milestones

- Can a Player have multiple active characters in one campaign?
- What information is retained in a completed campaign archive?
- How are session time zones handled?
- What handout file types and quotas are allowed?
- Which campaign events appear in activity history?
- Should account deletion offer an export before a Game Master's campaign is cascade-deleted?

These questions do not block the minimum Campaign Foundation schema.
