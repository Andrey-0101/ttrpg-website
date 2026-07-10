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
| ADR-009 | Managed video infrastructure | Proposed |

## Current decision gates

### VtM dice

ADR-008 is accepted and governs the next implementation:

- common campaign code stays system-neutral;
- VtM rules remain in the VtM game-system domain;
- no universal dice-expression engine is introduced.

### Video

ADR-009 remains Proposed.

It may be accepted only after:

- provider comparison;
- disposable two-to-three-user spike;
- browser/mobile verification;
- token model review;
- cost and privacy review;
- reconnect and denied-permission tests.
