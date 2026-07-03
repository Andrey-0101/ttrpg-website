# ADR-009: Managed Video Infrastructure

- Status: Proposed
- Date: 2026-07-02

## Context

Private video rooms require signaling, media routing, NAT traversal, reconnect behavior, browser support, and operational reliability. Building and operating the entire media stack is outside the project's current purpose.

## Proposed decision

Integrate a managed video/WebRTC provider.

The application owns:

- campaign membership checks;
- role checks;
- room/session mapping;
- short-lived token issuance;
- application UI;
- safe errors.

The provider owns:

- signaling;
- media transport;
- SFU/TURN infrastructure;
- media quality and reconnect primitives.

## Consequences

Positive:

- much faster friend-alpha delivery;
- lower operational risk;
- browser SDK support;
- focus remains on TTRPG workflows.

Costs:

- recurring usage cost;
- provider dependency;
- privacy/data-processing review;
- SDK constraints;
- migration effort if provider changes.

## Alternatives considered

### Self-host all WebRTC infrastructure

Rejected for the first version because of complexity and operational burden.

### Use a permanent public meeting link

Rejected because campaign membership must control access.

## Follow-up

Run a provider comparison and technical spike before accepting the ADR.
