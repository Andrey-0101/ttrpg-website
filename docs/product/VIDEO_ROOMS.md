# Video Rooms

## Status

Proposed architecture. No video room or provider integration is implemented.

## Goal

Provide a private video room for a small campaign group.

Entry should require:

- an authenticated user;
- active campaign membership;
- a server-issued short-lived room token.

An open permanent room URL must not be the authorization mechanism.

## Architectural direction

Use a managed video/WebRTC provider.

Do not build and operate custom signaling, SFU, TURN, recording, and media-routing infrastructure in the first version.

Provider selection remains open and must consider:

- browser and mobile support;
- room-token security;
- participant limits;
- screen sharing;
- reconnect behavior;
- usage limits and cost;
- data-region and privacy considerations;
- SDK quality for React/Next.js;
- provider lock-in and exit strategy.

## Access flow

```text
User opens campaign video page
  -> application checks authentication
  -> server verifies campaign membership
  -> server verifies room/session state
  -> server requests or signs a short-lived provider token
  -> browser joins the provider room
```

Removing a member from a campaign must prevent new tokens. Token lifetime should limit continued access after removal.

## Room ownership

Recommended first model:

- a room belongs to a campaign session;
- a campaign may have one active default room when no session entity exists yet.

The final choice should align with the Sessions model.

## Minimum friend-alpha UI

- Join Room
- Leave Room
- Camera on/off
- Microphone on/off
- Participant list
- Display name
- Optional character name
- Game Master indicator
- Connecting/reconnecting state
- Permission-denied state
- Device-selection fallback where supported

Screen sharing may be added in the first or second iteration depending on the provider.

## Prototype stage

Before integrating deeply, run a technical spike with:

- two to three users;
- desktop Chrome;
- desktop Edge;
- Firefox if supported;
- mobile browser;
- camera permission rejection;
- microphone permission rejection;
- reconnect;
- weak network;
- participant leave/rejoin;
- token expiry;
- removed member;
- cost/usage observation.

The spike should be disposable and should not define the campaign database by accident.

## Server responsibilities

- membership authorization;
- role checks;
- provider token creation;
- room identifier mapping;
- safe provider error mapping;
- preventing secret keys from reaching the browser.

## Client responsibilities

- device controls;
- local media preview;
- participant tiles;
- connection state;
- reconnect UX;
- accessible controls.

## Security requirements

Minimum even for friend-alpha:

- provider secrets only on the server;
- short-lived room tokens;
- campaign membership check;
- no room token in logs;
- no permanent anonymous room link;
- removed/revoked users cannot receive new tokens;
- safe errors;
- restrictive default room creation permissions.

Public-readiness later adds:

- abuse controls;
- detailed audit logging;
- rate limits;
- privacy and retention policy;
- provider legal review;
- incident handling;
- recording consent if recording is ever introduced.

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

## Open questions

- Which provider is selected?
- Does each session receive a new room?
- Can players join before the GM?
- Is screen sharing required for friend-alpha?
- What participant limit is required?
- Is video visible beside dice/handouts or on a dedicated page?
- What happens when the provider is unavailable?
