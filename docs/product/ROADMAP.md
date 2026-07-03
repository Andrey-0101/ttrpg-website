# Roadmap

## Product strategy

Build a useful private tool for a small group first. Use real sessions to refine workflows. Complete the visual identity after the core friend-alpha experience works. Perform public-readiness hardening before inviting unrestricted users. Add new game systems after the VtM platform architecture is proven.

## Current completed foundation

- EN/RU application localization
- Auth and profiles
- Owner-only character management
- Repository-backed Supabase migrations
- Generated database types
- Complete VtM V5 `schemaVersion: 3`
- Two-page character sheet
- Private portraits
- A4-oriented desktop rendering
- Mobile/tablet responsive rendering
- VtM character summary cards
- Production deployment
- Character-card action alignment fix

## Milestone 1 — Architecture Baseline

### Goal

Create a stable project map before adding collaborative features.

### Deliverables

- project context;
- architecture;
- current database/RLS/Storage documentation;
- I18N documentation;
- character-sheet specification;
- campaign, dice, video, and game-hub proposals;
- security/public-readiness plan;
- minimal design contract;
- ADR set;
- updated repository README;
- current handoff.

### Exit criteria

- documents reviewed by the project owner;
- implemented and proposed states clearly separated;
- domain boundaries accepted;
- roadmap order accepted;
- documents committed on an intentional branch and merged.

## Milestone 2 — Character Friend Alpha

### Goal

Make the existing VtM character workflow comfortable and difficult to misuse for a small private group.

### In scope

- unsaved-change warning;
- Saving/Saved/Save failed state;
- duplicate-submit protection;
- unsaved portrait warning;
- clear navigation between both pages;
- loading and empty states;
- long-value usability;
- mobile-device verification;
- explain or temporarily restrict `campaign` and `public` visibility;
- friend-group feedback.

### Deferred

- print/PDF;
- final decorative design;
- crop/reposition;
- large automated test program;
- public-readiness hardening;
- complex autosave.

### Exit criteria

A new invited user can register, create, fill, save, reopen, and edit a VtM character on desktop and mobile without project-owner assistance or accidental data loss.

## Milestone 3 — Campaign Foundation

### Goal

Create the shared authorization boundary before shared realtime tools.

### In scope

- campaign entity;
- game-system discriminator;
- membership;
- owner/GM/player roles;
- invitation;
- revoke/expire;
- character assignment;
- My Campaigns;
- minimal Campaign Overview;
- RLS and membership tests.

### Exit criteria

An invited member can join one private campaign, see only permitted campaign data, and link an accessible character.

## Milestone 4 — VtM Realtime Tools

### Dice phase

- personal VtM roller;
- Hunger dice;
- Difficulty;
- character defaults;
- structured result;
- server-authoritative persisted campaign rolls;
- realtime campaign feed.

### Video phase

- managed-provider technical spike;
- device controls;
- two-to-three-user test;
- campaign membership token gate;
- reconnect behavior;
- minimal room UI.

### Exit criteria

Campaign members can make shared VtM rolls and join a private campaign video room.

## Milestone 5 — Friend Campaign Alpha

### Goal

Assemble a practical private play workspace.

### Areas

1. Overview
2. Members
3. Characters
4. Dice
5. Video
6. Handouts
7. NPCs
8. Sessions and Notes

### Exit criteria

The friend group can prepare and run a real session primarily through the campaign workspace.

## Milestone 6 — Visual Identity

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

## Milestone 7 — VtM Game Hub

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

### Exit criteria

A new user can understand the available VtM workflow and reach the correct character, campaign, and dice tools.

## Milestone 8 — Public Readiness

### Goal

Prepare for users outside the known private group.

### In scope

- complete permission matrix;
- RLS and Storage audit;
- automated tests and CI;
- rate limiting;
- monitoring;
- backups and restore;
- staging;
- privacy and terms;
- account deletion;
- support/contact;
- accessibility;
- performance;
- browser matrix;
- public beta process.

### Exit criteria

The public launch gate in `SECURITY.md` passes and operational ownership is defined.

## Milestone 9 — Call of Cthulhu 7e

### Goal

Prove the platform with a second game system.

### In scope

- extract real system adapter boundaries;
- CoC 7e sheet schema and normalizer;
- CoC renderer and summary cards;
- CoC dice engine;
- CoC theme;
- CoC game hub;
- campaign integration;
- EN/RU content.

### Exit criteria

VtM and CoC coexist without system-specific logic leaking into shared campaign/core domains.

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
