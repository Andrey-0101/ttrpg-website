# ADR-007: Campaign Foundation Before Shared Realtime Tools

- Status: Proposed
- Date: 2026-07-02

## Context

The roadmap includes shared VtM dice rolls and private video rooms. Both require a clear set of authorized users and roles.

## Proposed decision

Implement a minimum campaign foundation before shared dice history or video access.

Minimum foundation:

```text
campaign
membership
role
invitation
character assignment
membership authorization helper
```

Personal non-shared dice may be implemented independently, but campaign persistence/feed requires campaign access.

## Consequences

Positive:

- one authorization boundary;
- shared tools do not invent separate membership systems;
- removing a member affects dice/video access;
- role-aware features have a stable base.

Costs:

- visible dice/video progress begins after foundational data work;
- campaign schema and RLS must be designed early.

## Alternatives considered

### Build dice and video first with ad hoc invite codes

Rejected because both tools would later require migration to campaign membership.

### Fully implement all campaign content first

Rejected because handouts/NPCs/sessions can follow after the minimum foundation.

## Follow-up

Accept before creating campaign or shared-tool migrations.
