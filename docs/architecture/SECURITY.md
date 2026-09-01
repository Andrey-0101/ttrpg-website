# Security and Public Readiness

## Status

This document records implemented friend-alpha controls and the remaining Public Readiness plan.

It is not a claim that the application has completed a public security audit.

Synchronized snapshot:

```text
main
609b6d9ec972bc842bfc8de4e4080eecdb10d4c8
```

## Strategy

Security work is divided into two levels.

### Level A — required with every friend-alpha feature

Minimum authorization, data integrity, safe error handling, and direct-route denial are implemented with each feature.

### Level B — required before unrestricted public use

Broader testing, operations, abuse prevention, legal, privacy, monitoring, and incident readiness are completed before a public beta.

A trusted group reduces product scope. It does not make missing authorization safe.

## Current implemented controls

### Authentication

- Supabase Auth;
- server-side session/claim checks;
- session refresh through the root proxy;
- locale-aware confirmation callback;
- login return-to-invitation flow;
- safe localized authentication errors.

### HTTP response security

- HSTS is supplied by the Production platform;
- the application supplies a site-wide Content Security Policy with no object embedding and no framing;
- camera and microphone browser capabilities are restricted to the same origin for the Campaign Game Room;
- MIME sniffing is disabled;
- referrer disclosure is limited to the origin on cross-origin navigation;
- external application connections remain limited to HTTPS and secure WebSocket transports required by Supabase and LiveKit.

### Profiles

- RLS enabled;
- authenticated profile read;
- self-only profile update.

### Characters

- owner-only insert, update, and delete;
- owner read;
- campaign-derived read-only SELECT;
- no GM or Player edit permission for another user's character;
- safe unavailable state for missing or inaccessible direct routes;
- explicit mutation locks and unsaved-change protection.

### Character portraits

- private Storage bucket;
- MIME and size limits;
- owner-folder upload, update, delete, and read;
- signed URLs;
- campaign-derived read-only portrait access;
- owner ID and character ID validation in the object path;
- no public bucket access.

### Campaigns

- RLS on all campaign tables;
- one immutable Game Master;
- creator-as-GM enforcement;
- Player-only membership rows;
- direct membership insertion denied;
- participant-only campaign reads;
- GM-only active campaign update and delete;
- completed campaign read-only enforcement;
- direct-ID denial for Outsiders.

### Campaign video data foundation

- one GM plus no more than six Player memberships;
- serialized invitation acceptance with lowest-free-slot allocation;
- persistent GM-assigned Player order;
- active-campaign helpers kept separate from historical campaign access;
- sparse GM-managed Player publication prohibitions;
- Player-only, zero-or-one media-group membership;
- constrained directed group/GM audio and video restrictions;
- private campaign-image metadata and exact represented Storage paths;
- atomic selected-recipient visibility transitions;
- completed-Player denial and completed-GM read-only access;
- immutable, constrained audit records with no object paths, tokens, media, or unrestricted JSON;
- RLS plus database triggers enforcing fail-closed completed-campaign mutations.

This foundation is current in Production. All seven campaign-video tables use RLS; the required foreign-key indexes, grants, and `handle_new_user()` execution hardening are current. The private `campaign-images` bucket remains current. Campaign image upload/presentation UI and remote moderation remain planned and inactive.

### Invitations

- single-use;
- seven-day expiry;
- revocation;
- hash-only storage;
- raw token returned only at creation;
- atomic acceptance;
- row locks for acceptance, revocation, and completion;
- safe failure for unavailable tokens;
- login return path without exposing the token in logs or documentation.

### Campaign characters

- owner-only linking;
- active campaign required;
- campaign visibility required;
- matching game system required;
- active owner participation required;
- one active campaign per character;
- owner or GM unlink;
- GM and Players receive read only;
- automatic unlink after Player removal, departure, completion, or character ineligibility.

### Campaign lifecycle

- completion confirmation;
- open invitation revocation;
- active assignment closure;
- read-only completed state;
- GM-only deletion;
- cascade removal of campaign-owned rows;
- Player-owned characters preserved.

### Error handling

- raw backend errors are not displayed;
- safe localized error and unavailable states;
- tokens, hashes, secrets, and sensitive paths are not shown;
- destructive and lifecycle actions require confirmation;
- duplicate mutations are blocked.

## Recorded Campaign Foundation verification

The recorded multi-user security test covered:

- Game Master;
- Player;
- Outsider.

It verified:

- campaign creation;
- prevention of delegated GM creation;
- immutable GM;
- invitation creation, acceptance, revocation, and one-time use;
- direct membership insertion denial;
- Player membership visibility and departure;
- GM member removal;
- owner-only character editing;
- campaign read-only character sharing;
- Outsider denial;
- automatic unlinking;
- completed campaign read-only behavior.

The transaction ended with `ROLLBACK`.

Two defects found during testing were fixed through separate migrations:

- campaign `INSERT ... RETURNING` visibility;
- campaign-character integrity trigger access to protected rows.

## Current limitations

- no automated E2E security suite;
- no CI security matrix;
- no rate limiting;
- no public abuse controls;
- portrait cleanup remains best-effort;
- no scheduled orphan Storage cleanup;
- no public-character policy;
- no monitoring or incident response process;
- no staging environment;
- no account export/deletion workflow;
- no public privacy, terms, or support process;
- no campaign-authoritative dice security model implemented yet;
- no Campaign Image Library management or Game Room presentation UI yet;
- no standalone Video Rooms authorization model or route; standalone rooms are not active roadmap scope;
- campaign video performs fresh authenticated authorization, derives server-owned room/participant identifiers, validates a seven-participant LiveKit room, and issues explicit ten-minute least-privilege tokens only after an explicit Join action.

## Level A requirements for Phase 4

### Personal dice

Even without persistence:

- validate pool and Hunger ranges;
- separate random generation from deterministic VtM result evaluation;
- do not trust formatted client text as the rules result;
- cover messy critical, bestial failure, critical, and failure cases;
- use safe bounds to prevent accidental UI or performance abuse.

### CoC and Game Room dice — Phases 4D1 and 4D2

Required before persistence:

- reviewed `dice_rolls` schema;
- campaign membership check;
- server-authoritative random generation;
- server-authoritative result evaluation;
- selected character access check;
- no actor impersonation;
- immutable ordinary history;
- bounded labels and pool sizes;
- RLS and direct-ID tests;
- removed-member regression;
- safe Realtime subscription scope;
- rate-limit plan before external exposure.

### Standalone Video Rooms — uncommitted backlog gate

Standalone Video Rooms are not active roadmap scope. If `IDEA-006` is accepted into a future roadmap, the following minimum gate would apply before Production:

- authenticated user;
- context-specific standalone application access validation;
- application authorization completed before provider token issuance;
- managed-provider comparison and disposable two-to-three-user spike;
- provider secrets server-only;
- server-issued short-lived provider tokens;
- no permanent anonymous room URL as an authorization mechanism;
- token values excluded from logs;
- safe application errors without provider or secret leakage;
- reconnect, expiry, denied-permission, provider-failure, desktop, mobile, and multi-user behavior tested;
- provider privacy and data-processing review.

The exact room schema, RLS, ownership, invitation, membership, expiry, retention, deletion, quota, and participant model remain open and must not be inferred from these requirements.

### Campaign-integrated Video Rooms — Phase 4B accepted current implementation

Required in addition to the reusable video-core controls:

- active campaign authorization immediately before token issuance;
- campaign-derived access must not be weakened by any future standalone authorization model;
- removed or revoked participants cannot obtain new campaign-room tokens;
- token lifetime limits continued access after authorization loss;
- campaign completion and deletion follow the implemented Campaign Foundation lifecycle;
- GM, Player, removed Player, and Outsider tests;
- no reuse of a future standalone invitation model unless separately approved.

Campaign room authorization now uses one GM plus at most six active Players. Campaign completion prevents new campaign-video mutations and future token issuance; existing Players lose campaign-video settings and campaign-image access, while the GM retains read-only database and image access until final deletion. Provider-room teardown and already-issued-token behavior remain runtime work.

The Stage 2 join endpoint accepts only the campaign route identifier and an empty JSON body. Authentication, active-campaign access, Player position, and publication state are read afresh before configuration or provider dispatch. `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are server-only variables; malformed or partial configuration fails closed. The current deterministic campaign mapping intentionally has no start/end rotation semantics, and ten-minute tokens already issued before membership removal or campaign completion remain valid until provider expiry unless a later moderation checkpoint adds active revocation.

The localized Game Room route loads only RLS-visible campaign and participant data. Opening either Campaign Overview or Game Room does not request credentials, connect to LiveKit, or request camera/microphone access. The browser constructs a provider session only after explicit Join; camera and microphone remain off until their own explicit controls are used, and Leave or component disposal tears down the temporary session.

The last Production human group test passed for the accepted current scope with one GM and four Players. Quantitative packet-loss, latency, jitter, reconnect-timeline, and per-participant connection-quality telemetry was not collected. That evidence boundary is non-blocking, and no additional media/layout/human acceptance retest is currently required unless a relevant regression is reported, the implementation changes materially, or the user explicitly requests it.

## Level A requirements for approved later campaign content

### Campaign Image Library and presentation — Phases 4C1 and 4C2

- private Storage;
- reviewed image content-type and size limits;
- safe campaign path policy;
- filename/path sanitization;
- campaign image and recipient visibility enforcement;
- signed display access;
- quota plan.
- safe Storage-first deletion and orphan reconciliation;
- GM-only presentation selection and stop controls;
- removed-Player and Outsider tests.

### Campaign notes — Phase 4G

- explicit shared-permitted versus GM-private records;
- no accidental GM-private exposure;
- RLS tests with GM, Player, and Outsider.

General Handouts, NPCs, Sessions, Chronicle records, clues, and maps are not active roadmap commitments. Their historical checklist concepts do not pre-approve a schema or implementation.

## Level B Public Readiness work

### Authorization audit

- complete permissions matrix;
- RLS review for all tables;
- Storage-policy review;
- anonymous-path review;
- invitation abuse review;
- direct API tests;
- removed-member regression;
- public-character policy decision.

### Application security

- rate limiting;
- dependency audit;
- redirect review;
- upload hardening;
- token lifetime review;
- secret rotation procedure;
- threat model;
- structured security logging.

### Testing

- unit tests;
- integration tests;
- Playwright E2E;
- multi-user campaign scenarios;
- invitation lifecycle;
- dice integrity;
- video access;
- localization parity;
- browser/mobile matrix.

### Operations

- error monitoring;
- uptime monitoring;
- database backups;
- restore test;
- migration recovery strategy;
- staging environment;
- orphan Storage cleanup;
- retention policy;
- incident response notes.

### User and legal readiness

- privacy policy;
- terms of use;
- account deletion;
- user-data export;
- support/contact route;
- upload rules;
- content takedown process;
- audience/age decision;
- provider privacy review.

### Accessibility and quality

- keyboard review;
- screen-reader labels;
- contrast;
- reduced motion;
- performance;
- browser support;
- failed-connection behavior;
- loading/error/empty states.

## Secrets

Never commit or document values for:

```text
Supabase publishable or service-role secrets
Vercel tokens
video-provider secrets
raw invitation tokens
session tokens
personal access tokens
```

Only public environment variable names may appear in repository documentation.

## Verification principle

A UI restriction is not security.

Authorization must be enforced by:

- RLS;
- database constraints and triggers;
- server-side role and membership checks;
- Storage policies;
- provider token issuance rules.

## Public launch gate

Before unrestricted use, verify that a non-member cannot:

- read a campaign;
- read campaign characters;
- read campaign portraits;
- read campaign images or other approved campaign content;
- read dice history;
- obtain a video token;
- use a revoked, expired, or accepted invitation;
- modify any campaign resource;
- access GM-private notes;
- read another user's private portrait.

Also verify operational readiness, legal pages, account deletion/export, monitoring, backups, and incident ownership.
