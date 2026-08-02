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
- Phase 4A — VtM personal dice and personal persistence;
- planned game-system catalogue across all confirmed catalogue and selection surfaces.

Active:

- Milestone 4 — VtM Realtime Tools.

Current release gate:

- canonical production-domain implementation;
- permanent documentation synchronization;
- merge the canonical-domain/documentation slice;
- deploy the merged slice;
- production-verify the deployment before Phase 4B begins.

Next major development phase:

- Phase 4B — server-authoritative shared campaign dice and Realtime feed.

Verified production catalogue baseline:

```text
main
22736bf697a8345e19e92626a8f441f35db4b3c7
```

This is the deployed and production-verified planned-catalogue release. Its verification passed 156 catalogue/dice tests. The canonical production domain is `https://ttrpg.fans`; `https://www.ttrpg.fans` permanently redirects to the apex domain, while Vercel URLs remain technical deployment addresses.

Release-candidate verification checkpoint, 2026-08-01:

- branch: `chore/canonical-domain-docs-sync`;
- based on: `22736bf697a8345e19e92626a8f441f35db4b3c7`;
- state: canonical-domain code and documentation changes are uncommitted and are not merged, deployed, or production-verified;
- validation: 156 dice/catalogue tests passed;
- validation: 13 site-URL tests passed;
- validation: 169 total automated tests passed;
- validation: the production build passed with 36/36 static pages generated.

These release-candidate changes become production state only after merge, deployment, and production verification.

External configuration was completed manually outside the repository and manually verified. In Vercel, `https://ttrpg.fans` is attached to the production project, `https://www.ttrpg.fans` permanently redirects to the apex domain, TLS succeeds for both, and both resolve to the localized production site. Vercel-generated domains remain technical deployment addresses. In hosted Supabase Auth, the Site URL is `https://ttrpg.fans`, production and local redirect allowlist entries are configured, and the canonical production callback is allowed. Arbitrary Vercel Preview authentication is not currently enabled. None of those hosted settings is implemented by this Git branch.

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

Personal persistence is owner-scoped and non-authoritative. It must not be reused as campaign evidence or as the Phase 4B execution path.

#### Delivered planned-system catalogue

The shared typed catalogue is implemented across Games, the System Rollers section, character creation, and campaign creation in this display order:

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
12. Traveller (Mongoose Publishing)

Only Vampire: The Masquerade V5 is currently implemented. The remaining systems are status-only planned placeholders with no links, buttons, fake routes, or selectable campaign values. Custom Dice Pool remains system-neutral and outside the catalogue.

The catalogue was deployed at `22736bf697a8345e19e92626a8f441f35db4b3c7`; 156 catalogue/dice tests passed for that release.

### Phase 4B — Shared campaign dice

**Status: Next major development phase only after the canonical-domain/documentation slice is merged, deployed, and production-verified**

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
