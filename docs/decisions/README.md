# Architecture Decision Records

## Format

Each ADR contains:

- status;
- context;
- decision;
- consequences;
- alternatives;
- follow-up.

## Status values

```text
Proposed
Accepted
Superseded
Rejected
Deprecated
```

Accepted ADRs must not be silently rewritten when the decision changes. Create a new ADR and mark the old one Superseded.

## Index

| ADR | Title | Status |
|---|---|---|
| ADR-001 | System-specific versioned JSONB | Accepted |
| ADR-002 | Private character portrait Storage | Accepted |
| ADR-003 | Independent character-sheet language | Proposed |
| ADR-004 | A4 desktop and responsive mobile rendering | Accepted |
| ADR-005 | URL-prefixed localization | Accepted |
| ADR-006 | `next-intl` and Supabase proxy composition | Accepted |
| ADR-007 | Campaign foundation before shared realtime tools | Accepted |
| ADR-008 | Game-system domain boundaries | Accepted |
| ADR-009 | Managed video infrastructure | Accepted |

## Current decision gates

### Dice domain

ADR-008 is accepted and governs the implemented dice boundaries:

- common campaign code stays system-neutral;
- VtM and CoC rules remain in their respective game-system domains;
- only proven validation and secure-random primitives are shared;
- no universal dice-expression engine is introduced.

The deployed Phase 4D1 implementation and UX follow-up preserve this decision. Phase 4D2 campaign dice must remain separate from non-authoritative personal history.

### Video

ADR-009 is Accepted for managed infrastructure and LiveKit in the current campaign Game Room. Standalone Video Rooms are not active roadmap scope, and the decision does not automatically settle any future standalone product. Reconsidering the provider requires new evidence or materially changed requirements.
