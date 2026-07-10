# Campaigns

## Status

**Implemented and verified.**

Campaign Foundation is complete in the synchronized repository snapshot:

```text
main
a1c3a61381a2b7cddab9dd8fb620af56342209a9
```

It includes the database schema, RLS, invitation lifecycle, membership controls, campaign character sharing, campaign management UI, EN/RU localization, mobile layouts, and multi-user security testing.

## Purpose

A campaign is the private collaboration and authorization boundary for one Game Master and invited Players.

The current implementation connects:

- campaign details and lifecycle;
- members;
- invitations;
- characters.

Future milestones will add:

- dice rolls;
- video access;
- handouts;
- NPCs;
- sessions;
- shared and GM-private notes.

The application does not support public campaign discovery.

## Role model

A campaign has exactly one Game Master.

Rules:

- the creator becomes the Game Master;
- the Game Master is stored in `campaigns.game_master_id`;
- `game_master_id` is immutable;
- a second Game Master cannot be assigned;
- ownership transfer is not supported;
- the Game Master is not duplicated in `campaign_members`;
- every row in `campaign_members` represents a Player;
- there is no customizable role or permission engine.

The Game Master can:

- read the campaign;
- update active campaign name and description;
- create and revoke invitations;
- remove Players;
- view linked characters;
- unlink any active campaign character;
- complete the campaign;
- delete the campaign.

A Player can:

- read campaigns they have joined;
- read the participant list;
- leave an active campaign;
- link or unlink their own eligible character;
- view characters shared with the campaign.

The Game Master cannot leave. They may complete or delete the campaign.

Deleting the Game Master's Auth account deletes the campaign through `ON DELETE CASCADE`.

## Current database objects

### `public.campaigns`

Important fields:

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

Statuses:

```text
active
completed
```

Rules:

- campaign names contain 1–120 trimmed characters;
- descriptions are optional and limited to 4,000 characters;
- the game system and Game Master cannot be changed;
- completed campaigns are read-only;
- completion revokes open invitations and closes active character assignments.

### `public.campaign_members`

Important fields:

```text
campaign_id
user_id
joined_at
```

Rules:

- every row is a Player;
- the Game Master cannot also be a Player;
- direct client insertion is denied;
- membership is created by accepting a valid invitation;
- a Player can delete their own membership while the campaign is active;
- the Game Master can remove a Player while the campaign is active.

### `public.campaign_invitations`

Important fields:

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

Behavior:

- invitations add only Players;
- each invitation is single-use;
- each invitation expires after seven days;
- the Game Master may revoke an unused invitation;
- only the token hash is stored;
- the raw token is returned only at creation time;
- accepted, revoked, expired, and unknown tokens fail safely;
- acceptance is atomic and serialized against revocation and completion;
- an existing campaign participant cannot spend another invitation.

### `public.campaign_characters`

Important fields:

```text
id
campaign_id
character_id
linked_by
linked_at
unlinked_at
```

Behavior:

- a character can have only one active campaign assignment;
- historical unlinked rows may remain;
- the character owner creates the assignment;
- the character must use `visibility = campaign`;
- character and campaign game systems must match;
- the owner must still participate in the campaign;
- linking does not transfer ownership;
- only the owner can edit or delete the character;
- campaign participants receive read-only access while the assignment remains active;
- the owner or Game Master can unlink;
- unlinking never deletes the character;
- removal of a Player closes assignments for that Player's characters;
- changing a linked character away from Campaign visibility closes its assignment;
- changing the linked character's game system closes its assignment;
- campaign completion closes all active assignments.

## Character access

| Actor | Active linked campaign character |
|---|---|
| Character owner | Read, update, and delete through owner policies |
| Campaign Game Master | Read only through campaign access |
| Active campaign Player | Read only through campaign access |
| Removed or departed Player | No campaign-derived access |
| Unrelated authenticated user | No access |
| Anonymous user | No access |

Campaign-derived access requires all of the following:

- `visibility = campaign`;
- character and campaign game systems match;
- an active assignment exists;
- the campaign is active;
- the character owner is still the Game Master or an active Player;
- the viewer is the Game Master or an active Player.

Private portrait access follows the same campaign boundary. The Storage policy validates the owner ID and character ID encoded in the object path.

`public` visibility still has no public route or public RLS policy.

## Current routes

```text
/[locale]/campaigns
/[locale]/campaigns/loading
/[locale]/campaigns/new
/[locale]/campaigns/new/loading
/[locale]/campaigns/join/[token]
/[locale]/campaigns/join/[token]/loading
/[locale]/campaigns/[id]
/[locale]/campaigns/[id]/loading
/[locale]/campaigns/[id]/not-found
/[locale]/campaigns/[id]/characters/[characterId]
/[locale]/campaigns/[id]/characters/[characterId]/loading
/[locale]/campaigns/[id]/characters/[characterId]/not-found
```

The route list above describes route files conceptually. `loading` and `not-found` are framework route-state files rather than URLs users type directly.

## Current UI

### My Campaigns

- lists campaigns where the current user is Game Master or Player;
- shows game system, status, and user position;
- provides Create Campaign;
- includes loading, empty, retry, and error states.

### Create Campaign

- campaign name;
- game system;
- optional description;
- creator becomes the immutable Game Master;
- duplicate-submit protection;
- unsaved-change warning;
- success redirect to Campaign Overview.

Only game systems marked available in the game-system registry may be selected.

### Invitation flow

- Game Master creates an invitation from Campaign Overview;
- the full link is shown only when created;
- invitation metadata remains listed;
- active invitations may be revoked;
- signed-out users return to the invitation after login;
- the user explicitly accepts before becoming a Player;
- accepted and revoked links cannot be reused.

### Members

- the Game Master is displayed separately;
- Players are listed with join date;
- a Player may leave;
- the Game Master may remove a Player;
- membership actions are disabled after completion.

### Characters

- campaign-compatible owned characters are shown;
- Private characters are not linkable;
- characters already active in another campaign are not linkable;
- linked characters are visible to current participants;
- shared sheets use a campaign route and are read-only;
- owner editing remains under My Characters;
- owner or Game Master may unlink while active.

### Campaign management

The Game Master can:

- edit name and description;
- Save or Reset;
- receive unsaved-change protection;
- complete an active campaign after confirmation;
- delete a campaign after confirmation.

Lifecycle actions are disabled while campaign details have unsaved changes.

Players do not see management controls.

## Lifecycle

### Active

- Game Master can edit details;
- invitations can be created and revoked;
- Players can join, leave, or be removed;
- eligible characters can be linked and unlinked;
- participants can read active linked characters.

### Completed

- campaign details are read-only;
- open invitations are revoked;
- active character assignments are closed;
- membership changes are disabled;
- new linking and unlinking are disabled;
- the campaign remains visible to existing participants;
- the Game Master may delete it;
- reactivation is not supported.

### Deleted

Deletion cascades campaign-owned records:

- memberships;
- invitations;
- assignment records.

Player-owned character rows and portrait objects are not campaign-owned and remain intact.

## Authorization

RLS and database functions are authoritative.

The UI may hide or disable controls, but it does not grant access.

The implementation includes:

- campaign participant SELECT policies;
- creator-as-GM INSERT policy;
- GM-only active UPDATE;
- GM-only DELETE;
- participant membership SELECT;
- GM-or-self membership DELETE;
- GM invitation visibility and secure RPC functions;
- participant assignment visibility;
- owner linking;
- GM-or-owner unlinking;
- campaign-derived character SELECT;
- campaign-derived portrait SELECT.

See:

```text
docs/architecture/CAMPAIGN_RLS_MATRIX.md
docs/architecture/DATABASE.md
```

## Verification

The Campaign Foundation security script tested:

- GM creation;
- prevention of delegated or second GM creation;
- immutable `game_master_id`;
- Outsider denial;
- invitation creation, revocation, and one-time acceptance;
- direct membership insertion denial;
- Player join and leave;
- GM removal;
- character linking;
- owner-only editing;
- GM and Player read-only access;
- Outsider denial;
- automatic unlinking;
- completed campaign read-only behavior.

The test ended with `ROLLBACK`, so test records were not retained.

## Game-system boundary

Campaigns are platform objects.

Common campaign tables must not contain VtM-specific rules.

Game systems own:

- sheet schema;
- dice rules;
- terminology;
- theme;
- game-specific campaign settings where later approved.

ADR-008 defines the accepted boundary.

## Deferred campaign content

Outside the completed Campaign Foundation:

- personal and shared dice tools;
- realtime dice history;
- video rooms;
- handouts;
- NPCs;
- sessions;
- shared notes;
- GM-private notes;
- campaign discovery;
- ownership transfer;
- multiple Game Masters;
- custom roles;
- Game Master editing of Player characters;
- public campaign pages.

## Open questions for later milestones

- Can a Player have multiple active characters in one campaign?
- What information is retained in a richer completed-campaign archive?
- How are session time zones represented?
- What handout file types and quotas are allowed?
- Which campaign events appear in activity history?
- Should account deletion offer an export before a Game Master's campaigns are cascade-deleted?
