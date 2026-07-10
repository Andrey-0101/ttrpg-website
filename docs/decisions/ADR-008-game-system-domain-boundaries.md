# ADR-008: Game-System Domain Boundaries

- Status: Accepted
- Date: 2026-07-02
- Accepted: 2026-07-10

## Context

The first implemented system is VtM V5. Call of Cthulhu 7e is planned later.

Shared platform domains must not become hard-coded to VtM, but premature universal abstraction would also slow delivery and create interfaces without evidence.

Campaign Foundation is now implemented as a platform-level domain with a `game_system` discriminator. The next milestone introduces VtM-specific dice behavior, so the boundary must be explicit before dice code is added.

## Decision

Keep platform and game-system responsibilities separate.

### Platform owns

```text
auth
profiles
localization
navigation
character lifecycle
campaigns
memberships
invitations
campaign authorization
character assignment
storage access
realtime transport boundaries
video access
handouts
sessions
common errors
```

### Game system owns

```text
sheet schema
default sheet data
normalizer and migration
sheet renderer
summary renderer
dice rules
game terminology
theme
game-hub content
system-specific campaign settings
```

### Adapter strategy

Use a small registry/adapter surface and expand it only when a real second-system requirement appears.

Current registry responsibilities may include:

- stable system ID;
- availability;
- localized display name;
- character defaults;
- schema version;
- normalizer;
- renderers;
- dice engine entry point;
- later theme/content adapters.

Campaigns remain generic platform objects. VtM rules must not become fixed generic campaign columns.

The VtM dice engine should be system-specific and consume a clear request/result contract. Shared campaign persistence may store the system ID and structured system result without moving VtM interpretation into common campaign code.

## Consequences

Positive:

- VtM rules do not leak into generic campaigns;
- Campaign Foundation can support later systems;
- CoC can reuse platform services;
- system-specific presentation remains flexible;
- dice engines can evolve independently;
- avoids a speculative universal rules engine.

Costs:

- some interfaces will evolve during CoC work;
- limited duplication may be accepted before common patterns are proven;
- common persistence must carry a system discriminator and structured payload carefully;
- system adapters require explicit tests.

## Alternatives considered

### Hard-code VtM throughout the platform

Rejected because a second system is an explicit roadmap goal and Campaign Foundation is already system-neutral.

### Build a complete universal TTRPG engine now

Rejected as premature, complex, and unsupported by real second-system requirements.

### Store all system behavior in database configuration

Rejected for the current phase because rule evaluation, validation, and rendering need typed application code and tests.

## Follow-up

For the VtM dice milestone:

1. define a VtM-specific roll request and result;
2. separate random generation from deterministic interpretation;
3. keep the personal roller outside campaign persistence;
4. reuse the same evaluator in the future server-authoritative campaign path;
5. avoid generic expression syntax.

During CoC development:

1. compare actual VtM and CoC requirements;
2. extract only proven common interfaces;
3. create a new ADR if this boundary requires a material change.

Accepted ADRs must not be silently rewritten. A future incompatible decision requires a superseding ADR.
