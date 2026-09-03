# Roadmap

## Product strategy

Build a useful private tool for a small group first, refine real play workflows, then complete site-wide technical refinement and visual identity before public readiness. New game systems should reuse the proven platform boundaries without adding unrelated platform capabilities by default.

New ideas are captured in [`IDEAS_BACKLOG.md`](IDEAS_BACKLOG.md). Backlog items are not commitments and enter this roadmap only after explicit review and acceptance.

## Current status

Completed foundation:

- Milestone 1 — Architecture Baseline;
- Milestone 2 — Character Friend Alpha;
- Milestone 3 — Campaign Foundation;
- Phase 4A — VtM Personal Dice & Personal Persistence;
- Phase 4B — Campaign Video Rooms Integration and the responsive Campaign Game Room;
- Phase 4C1 — image-only Campaign Gallery.

Next approved work:

- Phase 4C2 — Game Room Image Presentation.

Current Production facts:

- campaign video is implemented only inside `/{locale}/campaigns/{campaignId}/game-room`;
- LiveKit is accepted for that campaign implementation;
- supported capacity is one GM plus up to six Players;
- the last human Production group test passed with one GM and four Players;
- quantitative packet-loss, latency, jitter, and connection-quality telemetry was not collected and must not be inferred;
- the generic Call of Cthulhu 7e campaign shell is implemented, but CoC character sheets and dice are not;
- Delta Green is a catalogue entry only;
- game-system hubs are not implemented;
- Phase 4C1 is implemented; Phase 4C2 and every later phase remain unimplemented.

Standalone Video Rooms are not part of the active roadmap. They remain an uncommitted idea in [`IDEAS_BACKLOG.md`](IDEAS_BACKLOG.md). ADR-009 selects LiveKit only for the accepted campaign Game Room and does not automatically select a provider or product model for any future standalone product.

> **Vampire edition note:** The current implementation targets Vampire: The Masquerade 5th Edition (V5). White Wolf announced Vampire: The Masquerade 6th Edition (V6) in July 2026; V6 is currently in alpha development, introduces materially different mechanics, and has no announced release date. Depending on V6 development and release timing relative to this project, V5 support may be migrated to or replaced by V6 before public release.

This is a planning dependency, not a migration decision. Until a separate decision is accepted, current V5 behavior, data, routes, and terminology remain authoritative.

Official references: [White Wolf/Paradox announcement](https://www.paradoxinteractive.com/media/press-releases/press-release/new-blood-eternal-legacy-white-wolf-unveils-vampire-the-masquerade-6th-edition) and [V6 FAQ](https://www.paradoxinteractive.com/games/world-of-darkness/news/vtm-sixth-edition-faq).

---

## Milestone 1 — Architecture Baseline

**Status: Complete**

Delivered the project architecture, database/RLS/Storage documentation, localization and character-sheet specifications, security and design contracts, ADR set, repository documentation, and handoff sequence.

## Milestone 2 — Character Friend Alpha

**Status: Complete**

Delivered the usable VtM V5 character workflow, explicit save and lifecycle controls, private portraits, responsive sheets, campaign visibility, read-only campaign sharing, and verified friend-alpha behavior.

Deferred items such as print/PDF, portrait crop controls, public character sharing, and final decorative design remain outside this completed milestone.

## Milestone 3 — Campaign Foundation

**Status: Complete**

Delivered the campaign authorization boundary: one immutable GM, up to six Players, invitations, membership lifecycle, character assignment, shared read-only character access, campaign lifecycle, RLS, Storage policies, and multi-user security verification.

The generic campaign shell supports V5 and CoC 7e. System-specific capabilities remain independently gated.

---

## Phase 4 — Core Play & Campaign Tools

### Phase 4A — VtM Personal Dice & Personal Persistence

**Status: Complete**

Delivered:

- deterministic VtM V5 evaluation separated from random generation;
- public VtM and Custom Dice Pool rollers;
- EN/RU and responsive interfaces;
- up to five saved Custom Dice Pool presets for registered users;
- private personal history containing the current roll plus ten previous rolls;
- non-persistent guest rolls.

Personal history is owner-scoped, best-effort, and non-authoritative. It is not campaign evidence and must not be reused as the campaign dice execution path.

### Phase 4B — Campaign Video Rooms Integration

**Status: Complete / accepted in Production**

Delivered campaign-authorized LiveKit video through the dedicated localized Campaign Game Room.

The implementation:

- authorizes active campaign access before issuing a short-lived room-bound token;
- supports one GM plus up to six Players in stable slots;
- provides explicit Join/Leave, local camera and microphone controls, participant media, sound unlock, reconnect handling, cleanup, and safe localized failures;
- keeps provider secrets and application identifiers out of the client-facing authorization contract;
- prevents completed campaigns and unauthorized users from obtaining new join credentials.

Recording, transcription, screen sharing, standalone rooms, and remote moderation are not delivered or committed by this phase. The accepted human test involved one GM and four Players; no quantitative network telemetry was collected.

### Phase 4C1 — Campaign Gallery (image library)

**Status: Complete**

#### Goal

Provide a private image-only Campaign Gallery for the existing campaign authorization domain.

#### Scope

- localized campaign-scoped route at `/{locale}/campaigns/{campaignId}/gallery`, with the former `/handouts` route redirecting to it;
- four fixed image-only sections: Handouts, NPC, Maps & Plans, and Other;
- GM-managed multi-image sequential upload, compact full-image thumbnails, enlarged viewing, per-card visibility controls, and removal;
- RLS-filtered Player listing and viewing without recipient/access metadata;
- the existing private `campaign-images` Storage bucket and campaign image metadata/recipient model;
- current campaign membership, lifecycle, RLS, Storage, and visibility boundaries;
- EN/RU, responsive, accessible loading, empty, success, and failure states;
- metadata-first/Storage-second upload with failure cleanup;
- Storage-first individual and campaign deletion with absence verification;
- completed GM read-only access and completed Player image denial.

This is an image-only Gallery, not a broad Handouts, NPC, or Maps system. NPC means NPC images only; Maps & Plans means map/plan images only. It does not add documents, annotations, structured maps, clues, NPC records, sessions, Chronicle records, screen sharing, or presentation controls.

#### Exit criteria

Delivered: authorized users see only images allowed by the accepted campaign visibility model, the active GM can safely manage the library, completed campaigns preserve the required read-only boundary, and removed Players and Outsiders are denied. Phase 4C2 presentation remains separate and planned.

### Phase 4C2 — Game Room Image Presentation

**Status: Planned**

#### Goal

Let the GM present an image from the Campaign Gallery in the shared Game Room Display.

#### Scope

- GM selects an existing campaign-library image;
- all authorized Game Room participants see the same selected image;
- the GM can replace the displayed image or stop presentation;
- presentation reuses campaign authorization and image visibility rules;
- EN/RU, responsive, reconnect, and safe failure behavior.

No annotations, maps, screen sharing, general Handouts system, drawing tools, or presentation history are included.

### Phase 4D1 — CoC 7e Dice Roller

**Status: Planned**

Deliver a tested Call of Cthulhu 7e dice engine and personal roller with system-accurate interpretation, EN/RU presentation, and responsive controls. This phase does not create campaign-authoritative history.

### Phase 4D2 — Game Room Dice Integration

**Status: Planned**

Add a system-aware campaign dice surface to the Game Room:

- VtM campaigns use the implemented VtM roller and VtM rules;
- CoC campaigns use the Phase 4D1 CoC roller and CoC rules;
- the shared platform derives the campaign system and does not expose an incompatible roller;
- any persisted or realtime campaign history requires a reviewed server-authoritative schema, RLS contract, and execution boundary.

Personal roll history remains separate and non-authoritative.

### Phase 4E — Campaign & Game Room UX/UI Refinement

**Status: Planned**

Refine the existing Campaign and Game Room experience without adding new product capabilities:

- layout, navigation, information hierarchy, responsive behavior, accessibility, usability, and consistent states;
- campaign overview and live-room transitions;
- clearer participant, character, image, dice, and notes areas as those capabilities become available;
- placeholders for unavailable capabilities remain visibly disabled and must not expose fake behavior, controls, or routes.

This campaign-focused technical refinement is distinct from the site-wide Phase 5 UI Technical Refinement.

### Phase 4F1 — CoC 7e Character Sheets

**Status: Planned**

Implement CoC 7e schema, normalization, validation, character creation/editing, summary cards, EN/RU presentation, and tests within the accepted game-system boundary.

### Phase 4F2 — Game Room Character Integration

**Status: Planned**

Expose only the current campaign's linked participant characters in the Game Room, using the campaign system and existing read-only sharing boundary. VtM campaigns show linked VtM characters; CoC campaigns show linked CoC characters after Phase 4F1. Unlinked, incompatible, inaccessible, and private characters remain unavailable.

### Phase 4G — Campaign Notes

**Status: Planned**

Deliver only:

- shared notes editable or readable by permitted active campaign participants under an explicit authorization contract;
- GM-private notes readable and writable only by the campaign GM.

This phase does not add Sessions, Chronicle records, NPCs, Handouts, clues, maps, wikis, or general campaign-content modules.

### Phase 4 exit result

The private group can use system-aware dice and linked characters, campaign images and presentation, campaign video, and narrowly scoped notes through one coherent Campaign Game Room. No additional active campaign capability is committed after Phase 4G.

---

## Phase 5 — UI Technical Refinement

**Status: Planned**

Perform site-wide technical consistency work after the core play workflow is complete:

- shared component and interaction consistency;
- responsive behavior and accessibility;
- loading, empty, failure, retry, and disabled states;
- navigation and information hierarchy;
- maintainable design tokens and primitives;
- removal of demonstrated UI duplication or inconsistency.

Phase 5 adds no new product features and does not decide final visual identity.

## Phase 6 — Visual Identity

**Status: Planned**

Define and apply the platform's visual identity after Phase 5. The exact themes, fonts, palette, imagery, decorative language, and system-specific presentation are intentionally undecided until the technical UI baseline is stable.

## Phase 7 — Delta Green System Implementation

**Status: Planned**

Bring Delta Green to parity with the platform capabilities that exist when this phase begins. This is a system implementation phase only: schema, characters, dice, terminology, content, theme hooks, and compatible campaign/Game Room integration. It must not introduce unrelated platform capabilities or special Delta Green-only campaign tools.

## Phase 8 — Game System Hubs

**Status: Planned**

Implement system hubs in this order:

1. Phase 8A — Call of Cthulhu 7e;
2. Phase 8B — Delta Green;
3. Phase 8C — Vampire: The Masquerade.

Each hub organizes already implemented system information and links to existing tools. Hubs do not add new mechanics or platform capabilities. Long-form content should use reviewed Markdown/MDX or another suitable content model rather than large localization JSON blocks.

## Phase 9 — Public Readiness

**Status: Planned**

Prepare the proven private product for users outside the invited group. This remains a high-level release gate covering security, privacy, legal/operational ownership, abuse controls, monitoring, recovery, accessibility, performance, browser support, account lifecycle, and public-beta operations.

Existing detailed security and public-readiness references remain useful implementation checklists. Their presence does not mean every listed mechanism or product detail is newly committed before its relevant review.

---

## Uncommitted possibilities

The following are not active roadmap commitments unless explicitly accepted later:

- standalone Video Rooms;
- general Handouts, NPC, Sessions, Chronicle, clue, map, wiki, or campaign-discovery systems;
- recording, transcription, screen sharing, streaming, remote moderation, or breakout rooms;
- print/PDF, independent sheet language, public character pages, chat, relationship maps, calendars, music, combat tracking, advanced dice macros, and AI-assisted character generation.

See [`IDEAS_BACKLOG.md`](IDEAS_BACKLOG.md) for reviewed and unreviewed ideas.
