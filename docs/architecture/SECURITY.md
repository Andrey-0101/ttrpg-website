# Security and Public Readiness

## Status

This is a staged security plan, not a claim that the application has completed a public security audit.

## Strategy

Security work is divided into two levels.

### Level A: required with every friend-alpha feature

Minimum correctness and access control must not be deferred.

### Level B: public-readiness hardening

Broader testing, operations, abuse prevention, legal, privacy, and monitoring are completed before unrestricted use.

A small trusted group reduces product scope. It does not make missing authorization safe.

## Current implemented controls

### Authentication

- Supabase Auth;
- session refresh through server middleware;
- locale-aware confirmation callback;
- safe localized authentication errors.

### Characters

- RLS enabled;
- owner-only insert/select/update/delete;
- private portrait bucket;
- owner-folder Storage policies;
- signed URLs;
- file type and size limits.

### Error handling

- raw backend messages must not be displayed;
- secrets and tokens must not appear in UI or documentation.

## Current limitations

- no complete post-portrait multi-user regression matrix is recorded;
- portrait cleanup is best-effort;
- no orphan cleanup process;
- campaign/public visibility does not implement sharing;
- no campaign authorization exists;
- no rate limiting is documented;
- no automated E2E security suite;
- no public privacy/account-deletion process;
- no monitoring or incident process documented.

## Level A requirements for future features

### Campaigns

- RLS for campaigns and every campaign-owned table;
- membership-based read access;
- role-based write access;
- invitation expiry and revocation;
- removal immediately affects future access;
- direct-ID access tests;
- owner transfer behavior reviewed.

### Dice

- membership check for campaign rolls;
- server-authoritative persisted outcomes;
- pool validation;
- client cannot impersonate another user;
- history cannot be silently rewritten;
- safe rate limits before external exposure.

### Video

- provider secret server-only;
- server-issued short-lived token;
- campaign membership check;
- no permanent public room URL;
- token values excluded from logs;
- revoked members cannot obtain new tokens.

### Handouts and files

- private Storage by default;
- content-type and size limits;
- campaign path policy;
- filename/path sanitization;
- visibility enforcement;
- safe download URLs;
- quota plan before public launch.

### NPCs and notes

- explicit player/GM visibility;
- no accidental exposure of GM-private fields;
- RLS tests with multiple roles.

## Level B public-readiness work

### Authorization audit

- permissions matrix;
- RLS review for all tables;
- Storage-policy review;
- anonymous-path review;
- invitation abuse review;
- direct API tests;
- removed-member regression;
- public-character policy review.

### Application security

- rate limiting;
- dependency audit;
- redirect review;
- upload hardening;
- security headers review;
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
- migration rollback strategy;
- staging environment;
- orphan Storage cleanup;
- retention policy;
- incident response notes.

### User and legal readiness

- privacy policy;
- terms of use;
- account deletion;
- user-data export/deletion;
- support/contact route;
- upload rules;
- content takedown process;
- age/audience decision;
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
Supabase URL keys
service-role keys
Vercel tokens
video-provider secrets
invitation raw tokens
session tokens
personal access tokens
```

Only public environment variable names may appear in repository documentation.

## Verification principle

A UI restriction is not security.

Authorization must be enforced by:

- RLS;
- server-side membership/role checks;
- Storage policies;
- provider token issuance rules.

## Public launch gate

Before unrestricted use, verify that a non-member cannot:

- read a campaign;
- read campaign characters;
- read handouts;
- read dice history;
- obtain a video token;
- use a revoked invitation;
- modify any campaign resource;
- access GM-private notes;
- read another user's private portrait.
