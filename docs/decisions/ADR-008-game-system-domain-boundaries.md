# ADR-008: Game-System Domain Boundaries

- Status: Proposed
- Date: 2026-07-02

## Context

The first system is VtM V5. Call of Cthulhu 7e is planned later. Shared platform domains must not become hard-coded to VtM, but premature universal abstraction can also make development slower.

## Proposed decision

Keep platform and game-system responsibilities separate.

Platform owns:

```text
auth
profiles
characters lifecycle
campaigns
memberships
invitations
video access
handouts
sessions
common navigation
```

Game system owns:

```text
sheet schema
normalizer
sheet renderer
summary renderer
dice rules
game terminology
theme
game-hub content
system campaign settings
```

Use a small registry/adapter surface and expand it only when CoC reveals a real shared requirement.

## Consequences

Positive:

- VtM rules do not leak into generic campaigns;
- CoC can reuse platform services;
- system-specific presentation remains flexible;
- avoids speculative universal rule engines.

Costs:

- some interfaces will evolve during CoC work;
- limited duplication may be accepted before common patterns are proven.

## Alternatives considered

### Hard-code VtM throughout the platform

Rejected because a second system is an explicit roadmap goal.

### Build a complete universal TTRPG engine now

Rejected as premature and high risk.

## Follow-up

Review and accept before campaign schema and VtM dice implementation.
