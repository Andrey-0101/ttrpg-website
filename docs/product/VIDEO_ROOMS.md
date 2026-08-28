# Video Rooms

## Status

Standalone Video Rooms remain proposed: no standalone browser route, navigation entry, room schema, or authorization model is implemented. Separately, campaign video uses the reusable browser/controller core with a LiveKit adapter and campaign-derived authorization in the localized campaign Game Room.

ADR-009 remains Proposed until the provider comparison and disposable spike produce sufficient evidence.

## Goal

Provide secure standalone video rooms for authenticated users independently of campaign membership, while building a reusable video core that can later support campaign-integrated rooms through a separate authorization layer.

## Planned route direction

Approved top-level target route:

```text
/[locale]/video-rooms
```

Likely supporting routes:

```text
/[locale]/video-rooms/new
/[locale]/video-rooms/[id]
```

The supporting route names are provisional. None of these routes exists today. The authenticated navigation may contain Video Rooms later, but there is no current entry or placeholder.

## Architectural layers

### Reusable video core

The core owns provider-neutral room and media behavior:

- practical provider boundary and provider adapter;
- server-side provider token integration;
- device controls and local preview;
- participant tiles and connection state;
- reconnect and provider-failure behavior;
- safe provider error mapping;
- accessible desktop and mobile UI.

Provider-specific code should be isolated behind a practical boundary without trying to abstract every SDK detail. The core must not encode campaign membership, Game Master roles, campaign sessions, or removed-Player rules.

### Standalone application authorization

Standalone Video Rooms form their own application access domain. They require authentication and validated application access before a provider token is issued, but they must not depend on campaign membership.

The exact ownership, invitation, membership, expiry, retention, and deletion models remain open. A permanent provider room URL or provider knowledge alone must never be the authorization mechanism.

### Campaign-derived authorization

Campaign video integration reuses the video core with a distinct authorization adapter based on active campaign access. The first Game Room shell is implemented at `/[locale]/campaigns/[id]/game-room`.

Removal prevents new campaign-derived tokens, and completed campaigns cannot obtain new join credentials. These campaign rules are not imposed on standalone rooms.

## Managed infrastructure direction

Use a managed video/WebRTC provider. Do not build and operate custom signaling, SFU, TURN, recording, and media-routing infrastructure in the first version.

Provider and product decisions for the separate standalone feature remain open and must compare:

- browser and mobile support;
- token security model;
- participant limits;
- screen sharing;
- reconnect behavior;
- usage limits, pricing tiers, and cost;
- data-region and privacy considerations;
- SDK quality for React/Next.js;
- provider lock-in and exit strategy.

## Standalone access flow

```text
Authenticated user requests standalone room access
  -> application validates context-specific standalone access
  -> server maps the authorized application room to the provider
  -> server requests or signs a short-lived provider token
  -> browser joins through the reusable video core
```

Application authorization must complete before token issuance.

## Phase 4B sequence

1. approve the standalone Video Rooms architecture and security contract;
2. compare managed WebRTC providers;
3. run a disposable two-to-three-user technical spike;
4. implement permanent standalone Video Rooms only after the evidence gate;
5. test multi-user, desktop, mobile, reconnect, permission, failure, and production behavior.

The spike must remain disposable and must not define a permanent room schema or select campaign rules by accident.

## Minimum permanent UI direction

- Join Room and Leave Room;
- camera and microphone controls;
- participant list and display names;
- local media preview;
- connecting and reconnecting states;
- permission-denied and provider-unavailable states;
- accessible controls;
- EN/RU and responsive desktop/mobile behavior.

Screen sharing remains an open first-version decision.

## Server responsibilities

- authenticate the user;
- validate context-specific application authorization;
- keep provider secrets server-only;
- map authorized application rooms to provider rooms;
- issue short-lived provider access tokens only after authorization;
- exclude tokens and secrets from logs;
- map provider failures to safe application errors.

## Client responsibilities

- device controls and local preview;
- participant presentation;
- connection and reconnect UX;
- accessible permission and failure states;
- use the issued token without treating it as durable application authorization.

## Security requirements

Minimum requirements for standalone Video Rooms:

- authentication;
- application access validation before provider token issuance;
- server-only provider secrets;
- short-lived provider tokens;
- no provider token in logs;
- no permanent anonymous room link;
- safe errors;
- restrictive room-creation defaults once the ownership model is approved.

Campaign integration additionally requires active campaign authorization immediately before token issuance. The local Stage 1 data foundation fixes the campaign side at one GM plus at most six Players, persistent Player order, Player-only media groups, directed group/GM restrictions, individual publication permissions, private image visibility, and completed-campaign read-only behavior.

The local Stage 2 server foundation adds an authenticated campaign-scoped join endpoint and a narrow LiveKit server adapter. It derives an application-owned, collision-resistant room name from the campaign ID, gives the same campaign/account pair a stable non-UUID participant identity, explicitly creates or validates the room at `maxParticipants = 7`, and issues ten-minute room-bound tokens. Tokens allow subscription and only the camera/microphone sources permitted by the Stage 1 publication state; they deny data publication, screen sharing, room administration, recording, ingress, agent, and related elevated grants. The endpoint returns no raw account ID, provider API credential, or database row.

The campaign Game Room now provides explicit Join and Leave, participant video tiles, local camera and microphone controls, browser sound unlock, reconnect handling, cleanup, and safe localized error states. Camera and microphone remain off until the participant explicitly enables them. Active moderation, directed subscription enforcement, campaign image upload/presentation, recording, transcription, screen sharing, and the standalone Video Rooms product remain unimplemented. See `../architecture/SECURITY.md`.

## Deferred work

- recording;
- streaming;
- virtual backgrounds;
- background blur;
- breakout rooms;
- moderation console;
- in-video text chat;
- transcription;
- automatic summaries;
- screen annotation.

## Open decisions

- exact room database schema;
- exact RLS policies;
- room ownership model;
- whether an invitation is one-time or reusable;
- whether invitation acceptance creates persistent room membership;
- room expiry;
- room retention;
- room deletion behavior;
- maximum rooms per owner;
- participant limits;
- exact provider;
- pricing tier;
- data region;
- screen sharing in the first permanent version;
- whether standalone invitation logic is reusable for campaigns.
