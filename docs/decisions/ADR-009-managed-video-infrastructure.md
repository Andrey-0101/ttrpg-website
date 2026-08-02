# ADR-009: Managed Video Infrastructure

- Status: Proposed
- Date: 2026-07-02

## Context

Private video rooms require signaling, media routing, NAT traversal, reconnect behavior, browser support, and operational reliability. Building and operating the entire media stack is outside the project's current purpose.

The approved delivery order now begins with standalone Video Rooms and adds campaign-integrated video later. Both contexts need the same media capabilities, but they have different application authorization domains.

## Proposed decision

Integrate a managed video/WebRTC provider behind a practical provider boundary.

The application owns:

- context-specific application authorization before token issuance;
- standalone room authorization first;
- campaign-derived authorization in a later phase;
- application-room to provider-room mapping;
- server-side short-lived token issuance;
- application UI and reusable video core;
- safe errors.

The provider owns:

- signaling;
- media transport;
- SFU/TURN infrastructure;
- media quality and reconnect primitives.

Provider secrets remain server-only. Provider-specific code should be isolated enough to preserve a practical exit path without pretending all SDKs are interchangeable.

## Consequences

Positive:

- much faster friend-alpha delivery;
- lower operational risk;
- browser SDK support;
- one reusable media core for standalone and campaign contexts;
- authorization remains application-owned and context-specific;
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

Rejected because the application must authorize access before issuing a short-lived provider token.

## Acceptance gate

Run a managed-provider comparison and a disposable two-to-three-user technical spike before accepting this ADR or selecting a provider. The evidence must cover token behavior, browser/mobile support, reconnect and permission failures, participant limits, pricing, privacy/data region, and provider exit risk.

No exact provider, pricing tier, data region, database schema, RLS policy, or permanent room model is selected by this proposed decision.
