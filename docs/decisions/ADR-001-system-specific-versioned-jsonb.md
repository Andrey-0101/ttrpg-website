# ADR-001: System-Specific Versioned JSONB

- Status: Accepted
- Date: 2026-07-02

## Context

The platform must support multiple TTRPG systems with different character-sheet structures. Common character data is useful for lists, ownership, visibility, and navigation, while system-specific fields vary significantly.

## Decision

Store common character data in ordinary `public.characters` columns.

Store system-specific data in:

```text
characters.sheet_data
```

Every game-system payload must include a `schemaVersion`.

Each system owns:

- defaults;
- TypeScript contract;
- normalizer/migration;
- backward compatibility;
- renderer.

Persisted VtM data must pass through `normalizeVtmV5SheetData()`.

Unknown top-level VtM keys are preserved under `extensions` where possible.

## Consequences

Positive:

- one common character table;
- system-specific evolution without a column per rule field;
- presentation remains separate;
- old data can be normalized.

Costs:

- database constraints cannot validate the complete JSON shape;
- application normalizers are critical;
- migrations may be lazy/read-time or explicit save-time;
- analytics across system-specific fields is more complex.

## Alternatives considered

### One wide table for all systems

Rejected because fields and rules diverge significantly.

### Separate character table per game system

Deferred because it duplicates common lifecycle, ownership, and listing behavior.

### Unversioned JSONB

Rejected because persisted records must survive schema evolution.

## Follow-up

- keep normalizer tests;
- document each system schema;
- do not manually mutate persisted JSON without normalization;
- review cross-system interfaces when CoC is implemented.
