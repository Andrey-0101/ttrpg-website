# Roadmap

## Product strategy

Build a useful private tool for a small group first. Use real sessions to refine workflows. Complete the visual identity after the core friend-alpha experience works. Perform public-readiness hardening before inviting unrestricted users. Add new game systems after the VtM platform architecture is proven.

## Idea intake

New ideas are captured in `IDEAS_BACKLOG.md`.
They enter this roadmap only after review and acceptance.

## Current status

Completed:

- Milestone 1 — Architecture Baseline;
- Milestone 2 — Character Friend Alpha;
- Milestone 3 — Campaign Foundation;
- Phase 4A — VtM Personal Dice and Personal Persistence;
- planned game-system catalogue across all confirmed catalogue and selection surfaces.

Active:

- Milestone 4 — VtM Realtime Tools; campaign video and the responsive Game Room are complete and accepted.

Next major development phase:

- not yet selected.

Verified production baseline:

```text
main
609b6d9ec972bc842bfc8de4e4080eecdb10d4c8
```

PRs #28–#35 are merged and deployed at this consolidation baseline. PRs #28–#34 delivered the campaign-video foundation and LiveKit rollout, CoC campaign shell, campaign-creation correction, dedicated Game Room, responsive seven-slot layout, and final video-card UX; PR #35 published the H010 audit and synchronization. The canonical production origin is `https://ttrpg.fans`; `https://www.ttrpg.fans` permanently redirects to the apex domain, while Vercel URLs remain technical deployment addresses.

Phase 4A, personal dice persistence, the planned game-system catalogue, the CoC campaign shell, campaign LiveKit integration, and the responsive Game Room are complete. The last human Production group test passed with one GM and four Players, without quantitative packet-loss, latency, jitter, or connection-quality telemetry; no additional acceptance retest is currently required. Standalone Video Rooms, shared campaign dice, and the remaining Game Room tools are not implemented; standalone authorization remains a separate future domain.

## Completed foundation

### Platform

- EN/RU locale-prefixed routes;
- Supabase authentication and profiles;
- personal Dashboard;
- repository-backed migrations;
- generated public-schema database types;
- Vercel deployment workflow;
- canonical production domain and permanent `www` to apex redirect;
- safe localized loading, empty, retry, unavailable, and mutation states.

### Characters

- VtM V5 `schemaVersion: 3`;
- complete two-page character sheet;
- explicit create, save, edit, clear, and delete flows;
- unsaved-change and duplicate-submit protection;
- private portrait Storage;
- A4-oriented desktop rendering;
- responsive mobile/tablet rendering;
- summary cards;
- Private and Campaign visibility;
- owner-only editing and deletion;
- campaign-derived read-only sharing.

### Campaigns

- one immutable Game Master per campaign;
- active and completed lifecycle;
- Player memberships;
- single-use seven-day invitations;
- invitation revocation;
- Player join, leave, and GM removal;
- character assignment and unlinking;
- shared read-only character sheets and portraits;
- campaign editing, completion, and deletion;
- multi-user GM, Player, and Outsider RLS verification.

---

## Milestone 1 — Architecture Baseline

**Status: Complete**

### Goal

Create a stable project map before adding collaborative features.

### Delivered

- project architecture;
- current database/RLS/Storage documentation;
- I18N documentation;
- character-sheet specification;
- campaign, dice, video, and game-hub plans;
- security/public-readiness plan;
- design contract;
- ADR set;
- repository README;
- project handoffs.

### Exit result

The permanent documentation set, architecture sequence, and initial ADRs were reviewed and merged.

---

## Milestone 2 — Character Friend Alpha

**Status: Complete**

### Goal

Make the VtM character workflow comfortable and difficult to misuse for a small private group.

### Delivered

- unsaved-change protection;
- Saving/Saved/Save failed states;
- duplicate-submit protection;
- portrait creation, replacement, and removal;
- clear two-page navigation;
- loading, empty, unavailable, and retry states;
- long-value handling;
- responsive mobile verification;
- Private/Campaign/Public visibility clarification;
- production smoke test.

### Deferred

- print/PDF;
- final decorative design;
- portrait crop/reposition;
- complex autosave;
- public sharing;
- large automated test program.

### Exit result

A user can register, create, fill, save, reopen, and edit a VtM character on desktop and mobile without accidental data loss.

---

## Milestone 3 — Campaign Foundation

**Status: Complete**

### Goal

Create the shared authorization boundary before shared realtime tools.

### Delivered

- campaign entity with game-system discriminator;
- exactly one immutable Game Master defined by the creator;
- Player memberships;
- single-use Player invitations;
- invitation expiry and revocation;
- My Campaigns;
- Create Campaign;
- Campaign Overview;
- member listing and removal;
- Player departure;
- campaign character assignment;
- shared read-only character sheets;
- campaign editing;
- campaign completion;
- campaign deletion;
- completed-campaign read-only UI;
- applied migrations, generated types, RLS, triggers, helper functions, and Storage policy;
- multi-user GM/Player/Outsider security tests.

### Exit result

An invited Player can join a private campaign, see only permitted campaign data, and link an owned eligible character. The creator remains the single non-transferable Game Master.

---

## Milestone 4 — VtM Realtime Tools

**Status: Active**

### Phase 4A — VtM Personal Dice and Personal Persistence

**Status: Complete**

#### Goal

Provide a trustworthy VtM V5 dice engine before adding persistence or realtime synchronization.

#### In scope

- ordinary dice;
- Hunger dice;
- optional Difficulty;
- successes;
- criticals;
- messy criticals;
- bestial failures;
- total failures;
- individual die results;
- readable EN/RU interpretation;
- pure deterministic result evaluation separated from random generation;
- personal roller UI;
- mobile controls;
- optional label;
- repeat roll;
- character-assisted defaults where useful.

#### Deferred from Phase 4A

- campaign dice feed;
- Realtime subscription;
- macros;
- 3D physics;
- universal multi-system expression language.

#### Exit criteria

The same supplied die results always produce the same VtM interpretation, and a user can make a personal roll on desktop and mobile.

#### Delivered public-tool extension

- public `/[locale]/dice-rollers` hub and main navigation entry;
- VtM V5 system roller and public Custom Dice Pool available from the hub;
- Custom Dice Pool supports Coin (d2), d4, d6, d8, d10, d12, d20, and d100 with unbiased local generation and a 100-item total limit;
- guest rolls remain non-persistent;
- official symbolic VtM dice with a non-persistent Numbers display option;
- Dark Pack logo, legal notice, and EN/RU unofficial-material notice.

#### Delivered personal persistence

- public Custom Dice Pool for guests and registered users (delivered);
- up to 5 saved custom dice presets for registered users (delivered);
- saved custom presets preserve the selected Coin quantity and all numeric dice quantities;
- personal history containing the current roll plus 10 previous rolls for registered users (delivered);
- non-persistent guest rolls;
- strict separation between personal and campaign roll history.

Personal persistence is owner-scoped and non-authoritative. It must not be reused as campaign evidence or as the Phase 4D execution path.

#### Delivered planned-system catalogue

The shared typed catalogue is implemented across Games, the System Rollers section, character creation, and campaign creation in this display order:

1. Vampire: The Masquerade V5
2. Alien
3. Black Powder and Brimstone
4. Call of Cthulhu 7th Edition
5. Coriolis
6. Cyberpunk RED
7. Delta Green
8. Forbidden Lands
9. Ironsworn
10. Mothership
11. Paranoia
12. Traveller (Mongoose Publishing)

Vampire: The Masquerade V5 is available across every implemented capability. Call of Cthulhu 7th Edition is available only as a generic campaign shell; its character creation, dice roller, and Game Hub remain planned and expose no route. The remaining systems are status-only planned placeholders with no links, buttons, fake routes, or selectable campaign values. Custom Dice Pool remains system-neutral and outside the catalogue.

The catalogue was deployed at `22736bf697a8345e19e92626a8f441f35db4b3c7`; 156 catalogue/dice tests passed for that release.

### Phase 4B — Standalone Video Rooms

**Status: Planned separate product capability; not selected as the next stage**

#### Goal

Deliver secure standalone rooms for authenticated users without depending on campaign membership, while establishing a reusable video core for later campaign integration.

#### Scope boundary and internal sequence

1. approve the standalone Video Rooms architecture and security contract;
2. compare managed WebRTC providers without selecting one in advance;
3. run a disposable two-to-three-user technical spike;
4. implement permanent standalone Video Rooms around the reusable video core;
5. test multi-user, desktop, mobile, reconnect, permission, failure, and production behavior.

The top-level target route is `/[locale]/video-rooms`. Supporting routes `/[locale]/video-rooms/new` and `/[locale]/video-rooms/[id]` are provisional. The routes and navigation entry are planned, not implemented. Provider-specific code must remain behind a practical boundary; secrets stay server-only; tokens are short-lived; and application authorization happens before token issuance.

Exact schema, RLS, ownership, invitations, membership, expiry, retention, deletion, quotas, participant limits, provider, pricing, region, and first-version screen sharing remain unresolved. ADR-009 is Accepted only for managed infrastructure and LiveKit in the current campaign Game Room; it does not settle these standalone decisions.

#### Exit criteria

The standalone authorization contract is approved; comparison and spike evidence support a provider decision; and the permanent implementation, if approved after that gate, passes the defined multi-user and production test matrix without acquiring a campaign dependency.

### Phase 4C — Campaign Collaboration Contract

**Status: Partially implemented — minimal campaign shell delivered; system-specific features planned**

#### Goal

Define the shared campaign collaboration lifecycle and authorization contract before adding campaign-authoritative realtime tools.

#### Scope boundary

Specify the campaign-derived access, lifecycle, revocation, retention, and cross-tool boundaries required by campaign dice and campaign video. Do not implement campaign dice or video, and do not force standalone room invitations or membership into the campaign model.

#### Exit criteria

A reviewed contract defines the authorization and lifecycle inputs required by Phases 4D and 4E while leaving unresolved data designs open for their implementation phases.

### Phase 4D — Shared Campaign Dice

**Status: Planned**

#### Goal

Persist campaign rolls authoritatively and show the same feed to all permitted campaign participants.

#### Scope boundary

- reviewed `dice_rolls` schema and RLS;
- server-authoritative random execution and VtM interpretation;
- active campaign membership and accessible-character authorization;
- structured request/result persistence and immutable ordinary history;
- campaign-scoped Supabase Realtime feed;
- removed-member and Outsider tests;
- EN/RU and mobile.

Personal roll history remains separate and non-authoritative.

#### Exit criteria

Authorized campaign participants can make shared VtM rolls and see the same immutable trusted results; removed Players and Outsiders are denied.

### Phase 4E — Campaign Video Rooms Integration

**Status: Complete / accepted in Production for the current campaign scope**

#### Goal

Provide campaign-authorized LiveKit video through the reusable provider-neutral controller and browser media core.

#### Scope boundary

Campaign membership is checked before issuing a short-lived provider token. One GM plus no more than six Players share the deterministic campaign room, completed campaigns cannot join, and campaign access remains separate from the still-planned standalone authorization model. Recording, transcription, screen sharing, remote moderation, and campaign image presentation are outside the basic room.

#### Exit criteria

Authorized active campaign participants can use explicit Join/Leave, their own camera and microphone, participant media tiles, sound unlock, reconnect, and safe error states. Removed members and unauthorized users cannot obtain new tokens.

The accepted human group test confirmed practical function and user-visible quality. Quantitative network and connection-quality telemetry was not collected and is not required for current acceptance.

### Phase 4F — Campaign Workspace Integration

**Status: Responsive Game Room video workspace complete / accepted; broader tools planned**

#### Goal

Assemble approved live-session capabilities into a coherent campaign workspace before Milestone 5 content expands it.

#### Scope boundary

The localized `/[locale]/campaigns/[id]/game-room` route now provides the accepted responsive campaign video workspace and presents Campaign Dice, Handouts, Participants, Quick Notes, Session Context, Characters, NPCs, Selected Handouts, and active Display/image presentation as clearly non-interactive planned areas. Their APIs, persistence, and routes remain unimplemented, and standalone and campaign authorization remain separate.

#### Exit criteria

The campaign workspace presents approved shared dice and campaign video coherently on desktop and mobile, with authorization and failure boundaries preserved.

### Milestone 4 exit criteria

Standalone Video Rooms work independently of campaigns, and the later campaign workspace provides trusted shared VtM rolls and campaign-authorized video through the reusable core.

---

## Milestone 5 — Friend Campaign Alpha

**Status: Generic campaign shell delivered; CoC-specific character and game tools planned**

### Goal

Assemble a practical private play workspace and use it in a real friend-group session.

### Areas

1. Overview
2. Members
3. Characters
4. Dice
5. Video
6. Handouts
7. NPCs
8. Sessions/Chronicle
9. Shared and GM-private Notes
10. Campaign Settings

### Exit criteria

The friend group can prepare and run a real session primarily through the campaign workspace, then provide workflow feedback for targeted fixes.

---

## Milestone 6 — Visual Identity

**Status: Planned**

### Goal

Apply a coherent platform design after real workflows stabilize.

### In scope

- shared tokens and primitives;
- VtM theme;
- backgrounds and wallpapers;
- decorative frames;
- fonts;
- landing visuals;
- campaign cards;
- dice and video styling;
- NPC/handout presentation;
- final responsive polish;
- accessibility-aware visual review.

### Exit criteria

The platform has a coherent VtM-facing identity without coupling decoration to persisted data or authorization.

---

## Milestone 7 — VtM Game Hub

**Status: Planned**

### Goal

Create the complete VtM information and tool-entry area.

### In scope

- landing;
- Getting Started;
- character guide;
- quick reference;
- resources;
- tool directory;
- EN/RU content;
- legal/content review.

Long-form content should use a reviewed content model such as Markdown/MDX rather than large translation JSON blocks.

### Exit criteria

A new user can understand the available VtM workflow and reach the correct character, campaign, and dice tools.

---

## Milestone 8 — Public Readiness

**Status: Planned**

### Goal

Prepare for users outside the known private group.

### In scope

- complete permission matrix;
- RLS and Storage audit;
- automated tests and CI;
- rate limiting;
- monitoring;
- backups and restore testing;
- staging;
- privacy and terms;
- account deletion;
- data export;
- support/contact;
- accessibility;
- performance;
- browser matrix;
- public beta process;
- incident response.

### Exit criteria

The public launch gate in `docs/architecture/SECURITY.md` passes and operational ownership is defined.

---

## Milestone 9 — Call of Cthulhu 7e

**Status: Planned**

### Goal

Prove the platform with a second game system.

### In scope

- generic CoC 7e campaign creation using the established campaign membership, invitation, lifecycle, authorization, and video boundaries (delivered);
- refine real adapter boundaries;
- CoC 7e sheet schema and normalizer;
- renderer and summary cards;
- CoC dice engine;
- CoC theme;
- CoC Game Hub;
- richer system-specific campaign integration beyond the delivered generic shell;
- EN/RU content.

The delivered shell does not implement CoC character sheets, dice mechanics, Keeper tools, NPCs, clues, handouts, sessions, or notes. VtM and CoC characters remain strictly incompatible at the UI, query, and database-integrity boundaries.

### Exit criteria

VtM and CoC coexist without system-specific logic leaking into shared campaign and core domains.

---

## Deferred backlog

- independent sheet language;
- print/PDF;
- portrait crop/focal point;
- public character pages;
- campaign discovery;
- chat;
- relationship maps;
- locations/factions;
- calendars;
- maps;
- music;
- initiative/combat tracking;
- recording/transcription;
- advanced dice macros.

Items move into a milestone only after explicit scope review.
