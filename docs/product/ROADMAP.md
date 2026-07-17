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
- Milestone 3 — Campaign Foundation.

Active:

- Milestone 4 — VtM Realtime Tools.

Next implementation slice:

- typed VtM V5 personal dice request/result contract;
- pure deterministic evaluator with fixed die arrays;
- no UI, random generation, database persistence, migrations, Realtime, campaign integration, or video in this first sub-slice.

Current synchronized snapshot:

```text
main
cb378c18fc3f07ad6072f27508918ac53784e1b5
```

## Completed foundation

### Platform

- EN/RU locale-prefixed routes;
- Supabase authentication and profiles;
- personal Dashboard;
- repository-backed migrations;
- generated public-schema database types;
- Vercel deployment workflow;
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

### Phase 4A — VtM dice contract and personal roller

**Status: Implemented**

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

#### Not in the first slice

- database persistence;
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
- guest and authenticated custom rolls remain non-persistent;
- official symbolic VtM dice with a non-persistent Numbers display option;
- Dark Pack logo, legal notice, and EN/RU unofficial-material notice.

#### Approved later personal-tool requirements

- public Custom Dice Pool for guests and registered users (delivered);
- up to 5 saved custom dice presets for registered users;
- saved custom presets preserve the selected Coin quantity and all numeric dice quantities;
- personal history containing the current roll plus 10 previous rolls for registered users;
- non-persistent guest rolls;
- strict separation between personal and campaign roll history.

The delivered Custom Dice Pool does not add persistence, migrations, RLS, saved presets, or history. Those capabilities remain later reviewed stages.

#### Approved later placeholder-system stage

After the delivered Custom Dice Pool and the later saved-preset/personal-history stages, extend the Dice Rollers hub catalogue in this display order:

1. Vampire: The Masquerade V5
2. Alien
3. Black Powder and Brimstone
4. Call of Cthulhu
5. Coriolis
6. Cyberpunk RED
7. Delta Green
8. Forbidden Lands
9. Ironsworn
10. Mothership
11. Paranoia
12. Traveller — Mongoose Publishing edition

Only Vampire: The Masquerade V5 is currently implemented. The remaining systems are planned placeholders and must not link to active rollers until their implementations are delivered and reviewed.

### Phase 4B — Shared campaign dice

#### Goal

Persist campaign rolls authoritatively and show the same feed to all permitted campaign participants.

#### In scope

- reviewed `dice_rolls` schema;
- server-authoritative random execution;
- campaign membership authorization;
- optional accessible character association;
- full structured request and result persistence;
- immutable ordinary history;
- Supabase Realtime feed;
- campaign dice UI;
- removed-member and Outsider tests;
- EN/RU and mobile.

#### Exit criteria

Campaign members can make shared VtM rolls and see the same trusted realtime results.

### Phase 4C — Managed-video provider comparison and spike

#### Goal

Select a managed WebRTC provider using evidence rather than committing directly to an SDK.

#### In scope

- provider comparison;
- SDK and browser support;
- mobile behavior;
- token model;
- participant limits;
- reconnect behavior;
- cost;
- privacy/data-region review;
- screen-sharing capability;
- provider exit strategy;
- disposable two-to-three-user spike;
- denied-permission and weak-network tests.

#### Decision gate

ADR-009 remains Proposed until the comparison and spike are complete.

### Phase 4D — Minimal campaign video room

#### In scope

- campaign membership authorization;
- server-only provider secret;
- short-lived room tokens;
- Join/Leave;
- microphone and camera controls;
- participant list;
- display name and optional character name;
- GM indicator;
- connecting/reconnecting states;
- denied-permission and provider-unavailable states;
- removed-member token denial;
- EN/RU and mobile.

#### Deferred

- recording;
- transcription;
- breakout rooms;
- virtual backgrounds;
- in-video chat.

### Milestone 4 exit criteria

Campaign members can make shared VtM rolls and join a private campaign video room.

---

## Milestone 5 — Friend Campaign Alpha

**Status: Planned**

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

- refine real adapter boundaries;
- CoC 7e sheet schema and normalizer;
- renderer and summary cards;
- CoC dice engine;
- CoC theme;
- CoC Game Hub;
- campaign integration;
- EN/RU content.

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
