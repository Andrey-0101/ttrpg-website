# Campaigns

## Status

**Implemented and verified.**

Campaign Foundation through Phase 4F2 are complete in the accepted Production code baseline:

```text
main
371df4e74354306f673f4224008712608d943ce6
```

It includes the database schema, RLS, invitation lifecycle, membership controls, campaign character sharing, campaign management UI, EN/RU localization, mobile layouts, and multi-user security testing.

## Purpose

A campaign is the private collaboration and authorization boundary for one Game Master and invited Players.

The current implementation connects:

- campaign details and lifecycle;
- members;
- invitations;
- characters;
- a dedicated campaign Game Room with the basic LiveKit video experience;
- a private image-only Campaign Gallery with fixed Handouts, NPC, Maps & Plans, and Other sections, GM access controls, and Player-filtered viewing;
- GM-controlled Game Room image presentation from that Gallery, including Share / Stop Share and synchronized Expand / Collapse.
- a persistent GM-controlled Game Session lifecycle and session-scoped Journal, independent of LiveKit;
- system-aware, server-authoritative Campaign Dice for VtM V5 and CoC 7e, with active-session rolls published in the Journal through Supabase Realtime.

Campaign creation currently supports Vampire: The Masquerade V5 and a minimal Call of Cthulhu 7th Edition shell. Both systems reuse the same generic membership, invitation, lifecycle, authorization, and campaign-video functionality.

Phase 4F2 linked-character presentation is accepted. Phase 4G adds personal owner-private Notes for every participant; it is closed, deployed, and accepted after successful manual Production acceptance.

Document/text Handouts, NPCs, richer session records, Chronicle records, clues, and other broad campaign-content modules are not active roadmap commitments. The narrow Game Session lifecycle used to scope Game Room Journal events is not a general campaign-content module.

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
- at most six Player rows exist, for seven unique campaign accounts including the GM;
- each Player has a persistent GM-assigned display position from 1 through 6;
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
display_order
```

Rules:

- every row is a Player;
- the Game Master cannot also be a Player;
- direct client insertion is denied;
- membership is created by accepting a valid invitation;
- a Player can delete their own membership while the campaign is active;
- the Game Master can remove a Player while the campaign is active.
- invitation acceptance fills the lowest free display position and rejects a seventh Player without consuming the invitation;
- only the active GM can atomically replace the order with the exact current Player set;
- removal leaves sparse positions until an explicit reorder.

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
- no visibility or separate sharing step is required;
- character and campaign game systems must match;
- the owner must be a current Player, not the Game Master;
- linking does not transfer ownership;
- only the owner can edit; actively linked characters cannot be deleted;
- only that campaign's Game Master receives additional read-only sheet and portrait access while the eligible assignment remains active;
- the owner or Game Master can unlink;
- unlinking never deletes the character;
- removal of a Player closes assignments for that Player's characters;
- an incompatible game-system change closes the assignment, subject to the existing active Game Session unlink lock;
- campaign completion closes all active assignments.

VtM and Call of Cthulhu characters are not cross-compatible. Both use the existing Character Library and the same owner-private/assignment-derived GM read-only boundary; system matching continues to prevent incompatible linking. Game Room Characters is deployed and accepted in Phase 4F2. One active character per Player, GM assignment prohibition and active Game Session unlink locks remain enforced.

### Campaign video data foundation

The current Production campaign-video foundation adds provider-neutral persistence for:

- sparse per-Player audio/video publication prohibitions, where absence means both allowed;
- ordered Player-only media groups with at most one group per Player;
- separate directed audio/video blocks for group-to-group, GM-to-group, and group-to-GM paths;
- private campaign images visible to the GM, all active Players, or selected active Players;
- immutable constrained administrative audit rows.

The GM is never a media-group member. Removing a prohibition does not activate a microphone or camera. Session-only overrides, provider rooms, tokens, connections, and media tracks are not persisted by this foundation. All ten migrations, the campaign-video RLS policies, required foreign-key indexes, hardened grants, and private `campaign-images` Storage are current in Production. Phase 4C1 uses that existing image foundation, adds a narrow delete helper/policy migration for completed-campaign Storage cleanup, and adds an immutable `campaign_images.category` field for the four Gallery sections. Category is organizational metadata only and does not affect authorization.

## Character access

| Actor | Active linked campaign character |
|---|---|
| Character owner | Read and update through owner policies; delete only when not actively linked |
| Campaign Game Master | Read only through campaign access |
| Another active campaign Player | No sheet or portrait access |
| Removed or departed Player | No campaign-derived access |
| Unrelated authenticated user | No access |
| Anonymous user | No access |

Campaign-derived access requires all of the following:

- character and campaign game systems match;
- an active assignment exists;
- the campaign is active;
- the character owner equals assignment `linked_by` and is still a current Player, not the GM;
- the viewer is the exact campaign's Game Master.

Private portrait access follows the same campaign boundary. The Storage policy validates the owner ID and character ID encoded in the object path.

No character visibility state or public character access exists. Ordinary My Characters routes explicitly filter by owner, even when a GM has assignment-derived SELECT access. The owner retains own sheet access after leaving a campaign; other Players never gain another owner's sheet access from membership alone.

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
/[locale]/campaigns/[id]/game-room
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
- linking requires no visibility setting or sharing step;
- characters already active in another campaign are not linkable;
- assignment rows remain visible to current participants, but sheets/portraits are accessible only to their owner and the exact eligible campaign GM;
- GM sheets use the existing campaign read-only route; other Players receive no sheet link;
- owner editing remains under My Characters;
- owner or Game Master may unlink only when the active Game Session lock permits.

### Campaign management

The Game Master can:

- edit name and description;
- Save or Reset;
- receive unsaved-change protection;
- complete an active campaign after confirmation;
- delete a campaign after confirmation.

Lifecycle actions are disabled while campaign details have unsaved changes.

Players do not see management controls.

### Game Room

`/[locale]/campaigns/[id]/game-room` is the dedicated localized virtual tabletop for an authorized campaign participant. The Campaign Overview contains a compact entry card and no longer mounts or connects the active video component.

The Game Room owns the room-level Game Session state and non-video tools. Its stable one-row order is `Journal | Gallery | Dice | Characters | Notes`: Journal opens by default in the shared Display and has no back arrow, Gallery opens directly in Handouts and keeps its internal back arrow, Campaign Dice is available for VtM V5 and CoC 7e, Characters is deployed and accepted, and Notes opens the current owner's private journal. CoC Dice opens directly in Percentile with the internal `← | Percentile | Other Dice` submenu; VtM Dice opens directly without a submenu.

Journal shows only the exact active Game Session and creates no synthetic events. Without an active session there are no persistent Journal events; every new session starts with an empty current Journal, while ended session rows and events remain stored for future archive/history UI. Entries append at the bottom, older entries remain above, the Journal auto-scrolls to the newest entry, and the GM Start/End control stays fixed while the event list scrolls. Journal events and Game Session Start/End state propagate through Supabase Realtime; lightweight polling is only fallback reconciliation.

Only the GM can Start or End. Players see the current state and Journal. One active session per campaign is database-enforced, explicit End closes immediately, and campaign completion closes the active session and prevents another start. Ended sessions are retained; archive UI is not implemented.

Video remains an optional child capability with explicit Join/Leave, participant video tiles, own camera and microphone controls, browser sound unlock when required, participant names and roles, reconnect, cleanup, and safe errors. Opening or refreshing Game Room never joins LiveKit; refresh requires explicit Join again. Video Leave/disconnect and camera or microphone state never start, renew, or end Game Session. Gallery Share and synchronized Expand remain available only while the GM is connected to LiveKit.

Browsing Gallery does not require LiveKit. Image Share/Presentation still uses LiveKit: the GM must be connected, and only LiveKit-connected participants receive the presented image. LiveKit controls only video/audio and Gallery presentation; it does not control Game Room access, Game Session lifecycle, Journal, or Campaign Dice.

Pre-Phase-5 Add-on — GM Computer Audio Sharing is IMPLEMENTED / DEPLOYED / MANUAL PRODUCTION ACCEPTANCE PENDING. A connected GM can explicitly share computer audio into this same LiveKit room independently of mic, camera, Game Session and image presentation. The compact header control exposes transient 128/192 kbps targets (default 192); changing quality requires stopping first. Remote GM computer audio uses a second audio attachment and the existing Enable sound path, with no local playback. Late Players subscribe through normal LiveKit track subscription and the authoritative membership mapping, without restarting the capture.

Initial capture support is Windows 11 with current stable Chrome/Edge; choose Entire screen and system audio in the native picker. Other applications/notifications may be transmitted; application-specific Spotify capture is not promised. Actual captured-track own-audio exclusion must be confirmed, otherwise all capture tracks stop and the call continues unchanged. Display video is stopped before publishing audio and is never sent; engines that end audio with video are rejected. Site/native Stop, Leave, terminal disconnect and unmount release capture; ordinary reconnect retains it without another picker. No other OS/browser capture support is promised. Players need only ordinary LiveKit audio playback support. Real capture/echo acceptance is still pending; this does not reopen Phase 4 or start Phase 5A.

GM Game Room presence renews on entry and approximately every 30 minutes while the page remains mounted. The database deadline is approximately 60 minutes after the last renewal, and an autonomous scheduled database function closes abandoned sessions without waiting for another visitor. No unload event is part of the correctness contract.

The accepted layout uses a compact header, approximately `1.5fr / 1fr / 1fr` desktop columns, and stable slots for one GM plus Player positions 1–6. Video cards remain responsive `16:9`, use normal brightness and `object-fit: cover`, keep a compact upper-right label, and expose lower-left media controls only for the local participant. Leave remains in the header. The last human Production group test passed with one GM and four Players; quantitative packet-loss, latency, jitter, and connection-quality telemetry was not collected, and no additional acceptance retest is currently required.

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
- campaign-video settings and images become invisible to Players;
- campaign-video settings and images remain read-only to the Game Master;
- the Game Master may delete it;
- reactivation is not supported.

### Deleted

Deletion cascades campaign-owned records:

- memberships;
- invitations;
- assignment records.
- campaign video settings, groups, restrictions, image metadata/recipients, and audit rows.
- Game Sessions and their Journal events.

Campaign image objects are outside ordinary relational cascade behavior. Implemented individual deletion removes and verifies the Storage object before deleting metadata. Implemented campaign deletion removes and verifies every represented object before deleting either an active or completed campaign. A missing object can be reconciled; an unverified remaining object keeps metadata/campaign rows for a safe retry.

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

The current campaign-video and Game Room scope is accepted in Production. LiveKit is the accepted provider for this campaign implementation. Standalone Video Rooms are not active roadmap scope and would require a separate future product, authorization, and provider review.

The historical Campaign Foundation security script tested (its original participant-sharing semantics were later narrowed by the character-access maintenance fix):

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

- Phase 5A Campaign & Game Room UX/UI refinement;
- campaign discovery;
- ownership transfer;
- multiple Game Masters;
- custom roles;
- Game Master editing of Player characters;
- public campaign pages.

Phase 4D2 is deployed, accepted, and closed. Its GM-controlled Game Sessions, exact-session Journal, and system-aware Campaign Dice for VtM V5 and CoC 7e are current behavior. Rolls outside an active session remain local to the roller and non-persisted; active-session rolls are public Journal events delivered through Supabase Realtime. The campaign system selects the existing system roller automatically; no parallel campaign dice mechanics exist. Server-authoritative execution, exact-session binding across End → Start races, and the absence of direct authenticated Journal writes preserve the shared-history trust boundary. Hidden/private campaign rolls remain unimplemented. LiveKit remains independent except for the existing Gallery image-presentation transport. Phase 4F1 CoC character sheets reuse the existing campaign assignment and read-only character route; linked Game Room Characters is deployed and accepted in Phase 4F2. Archive UI, hidden rolls, Keeper-specific tools, NPCs, clues, general Handouts, richer Sessions, and Chronicle records are not active roadmap commitments.

## Personal Campaign Notes — Phase 4G

Status: CLOSED / DEPLOYED / ACCEPTED. Manual Production acceptance passed successfully. Phase 4F2 is CLOSED / DEPLOYED / ACCEPTED; Phase 5 is not started.

Every participant, including GM, has an owner-private continuous journal. GM cannot read Player Notes; Players cannot read others' or GM Notes. There is no shared Notes scope or special GM area. Campaign Overview offers Gallery and Notes actions; `/{locale}/campaigns/{id}/notes` and Game Room's `Journal | Gallery | Dice | Characters | Notes` row reuse the same journal. Notes scroll internally inside Display and require neither LiveKit nor an active Game Session.

Entries are oldest-first with stable ID ordering, initially scrolled to the newest entry. Inline Create/Save, Edit/Save/Cancel, and Delete/Yes/No are explicit; only one create/edit mode is allowed. Unsaved text is discarded on tool change, navigation or refresh, without autosave, browser draft or navigation warning. Bodies are safe plain text, normal weight, justified and paragraph-separated; no editable headings, Markdown, formatting controls, attachments, tags or collaboration.

Bold headings use the immutable campaign-name snapshot and authoritative creation time with the browser timezone captured at Save (UTC fallback). Latest edit time uses its separately saved timezone and localized Edit/Ред. marker; there is no edit history. Search is one input and All/Text/Date/Session select: whole entries, case-insensitive body, creation date in saved timezone (localized and ISO), and linked immutable session number/title. Edited date/time and campaign names are not search fields. No ranking, highlighting or UI pagination.

New entries link only to the canonical unended, unexpired session at successful creation, including from Overview. No session means no subtitle. Only the nullable FK is stored; the italic localized subtitle resolves `Session N[. title]` from `game_sessions`. Editing never rebinds it or changes creation metadata. Session deletion clears the FK, not the entry; campaign deletion cascades Notes consistently with campaign-owned records.

Current active participants may mutate only their own entries through the authoritative RPC. Completion makes Notes read/search-only on the Campaign page. Removal retains owner-readable, read-only rows but no removed-player navigation entry point. Global Personal Notes and future archive metadata handling are deferred in IDEA-008. Notes has no Realtime: opening/refreshing loads fresh data; mutations update this screen; another open screen changes only after reopening/refresh.

Game Sessions now have immutable per-campaign sequential numbers (starting at 1, never reused) and optional immutable titles. Historical rows are numbered by `started_at, id` without changing IDs or Journal links. GM Start first opens a compact optional-name input with Start/Cancel; blank trimmed input creates no title. Legacy Start remains compatible. End, renew, expiry, completion, Journal, Dice and LiveKit separation remain unchanged.

## Open questions for later milestones

- What information is retained in a richer completed-campaign archive?
- Which campaign events appear in activity history?
- Should account deletion offer an export before a Game Master's campaigns are cascade-deleted?
