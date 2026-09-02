# Target Site Structure

## Document control

| Field | Value |
|---|---|
| Status | Current approved target structure |
| Current source | [`ROADMAP.md`](ROADMAP.md) |
| Current route reference | [`SITE_STRUCTURE_CURRENT.md`](SITE_STRUCTURE_CURRENT.md) |
| Next product phase | 4C2 Game Room Image Presentation |

## Purpose

Describe the intended structure without presenting speculative routes or uncommitted capabilities as approved work.

## Delivery sequence

1. Milestones 1–3 — complete;
2. Phase 4A personal VtM dice — complete;
3. Phase 4B Campaign Video Rooms Integration — complete and Production accepted;
4. Phase 4C1 image-only Campaign Handouts — complete;
5. Phase 4C2 Game Room Image Presentation — next;
6. Phase 4D1 CoC 7e Dice Roller;
7. Phase 4D2 system-aware Game Room Dice Integration;
8. Phase 4E Campaign & Game Room UX/UI Refinement;
9. Phase 4F1 CoC 7e Character Sheets;
10. Phase 4F2 system-aware linked-character Game Room integration;
11. Phase 4G Campaign Notes;
12. Phase 5 UI Technical Refinement;
13. Phase 6 Visual Identity;
14. Phase 7 Delta Green System Implementation;
15. Phase 8 Game System Hubs: CoC, Delta Green, Vampire;
16. Phase 9 Public Readiness.

## Target top-level structure

```text
Public
├── Home
├── Games catalogue
├── Dice Rollers
└── Authentication

Authenticated
├── Dashboard
├── Characters
├── Campaigns
├── Profile
└── Account
```

No standalone Video Rooms top-level area is approved.

## Campaign structure

```text
Campaign
├── Overview and lifecycle
├── Members, invitations, and linked characters
├── Game Room
│   ├── Campaign video                         [CURRENT]
│   ├── Image presentation                     [4C2]
│   ├── System-aware dice                      [4D2]
│   └── Linked participant characters          [4F2]
├── Campaign Handouts (image-only)             [CURRENT]
└── Campaign Notes                             [4G]
    ├── Shared notes for permitted participants
    └── GM-private notes
```

The existing Game Room may retain clearly disabled placeholders during transition, but placeholders do not approve product scope or routes. Phase 4E decides the clean technical presentation as capabilities arrive.

Global/document Handouts, NPCs, Sessions, Chronicle records, clues, maps, wikis, and similar campaign modules are not active roadmap scope.

## Game-system structure

The shared catalogue tracks capability availability independently. A system route or control is exposed only when that capability is implemented.

- VtM V5: current character, dice, campaign, and basic game-area capabilities;
- CoC 7e: current generic campaign shell; dice planned in 4D1 and characters in 4F1;
- Delta Green: catalogue only until Phase 7;
- other catalogue systems: planned placeholders only.

Phase 8 hubs organize existing information and tools. They do not introduce new mechanics or campaign capabilities. Long-form hub content should use reviewed Markdown/MDX or another suitable content model.

## UI and visual phases

Phase 5 provides site-wide technical UI consistency and adds no product features. Phase 6 decides visual identity only after that technical baseline. Themes, fonts, palette, imagery, and decorative language are intentionally undecided today.

## Public Readiness

Phase 9 remains a high-level launch gate. Existing detailed security and operational checklists remain reference material, but exact public routes and processes are approved only when their operational requirement is confirmed.

## Backlog boundary

Standalone Video Rooms are `IDEA-006`, not target structure. LiveKit's accepted campaign use does not select a future standalone provider. Recording, transcription, screen sharing, moderation, and broad campaign content are also uncommitted unless explicitly accepted later.
