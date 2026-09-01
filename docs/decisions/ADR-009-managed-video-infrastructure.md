# ADR-009: Managed Video Infrastructure

- Status: Accepted
- Date: 2026-08-30

## Context

Private video rooms require signaling, media routing, NAT traversal, reconnect behavior, browser support, and operational reliability. Building and operating the entire media stack is outside the project's current purpose.

The campaign Game Room now uses managed LiveKit infrastructure in Production. A future standalone Video Rooms product remains a separate application authorization domain and is not selected or implemented by this decision.

## Decision

Use managed video/WebRTC infrastructure behind a practical provider boundary. LiveKit is the accepted implementation provider for the current campaign Game Room.

The application owns:

- context-specific application authorization before token issuance;
- campaign-derived authorization for the current Game Room;
- separate standalone authorization only if a future standalone Video Rooms product is approved;
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

## Accepted scope and future reconsideration

The current campaign implementation passed the provider spike, Preview/Production rollout, responsive verification, authenticated visual review, and a human Production group test for one GM plus up to six Players. The human test did not collect quantitative packet-loss, latency, jitter, or connection-quality telemetry; that missing telemetry is a documented non-blocking evidence limit.

This acceptance applies only to managed infrastructure and LiveKit for the current campaign Game Room. It does not automatically settle a future standalone Video Rooms product, including its provider, pricing tier, data region, schema, RLS, ownership, invitation, retention, or deletion model. Future provider reconsideration requires new evidence or materially changed requirements.
