# Video Rooms

## Status

**Campaign video is implemented and accepted in Production. Standalone Video Rooms are not active roadmap scope.**

The current localized campaign route is:

```text
/{locale}/campaigns/{campaignId}/game-room
```

No standalone `/[locale]/video-rooms` route, navigation entry, room schema, ownership model, invitation lifecycle, or authorization contract exists.

## Accepted campaign scope

The Campaign Game Room uses a reusable browser/controller media core, a narrow LiveKit adapter, and campaign-derived authorization.

The server:

- authenticates the user;
- verifies active campaign access immediately before token issuance;
- derives application-owned room and participant identities without exposing raw application identifiers;
- creates or validates a deterministic room limited to seven participants;
- issues a short-lived room-bound token;
- keeps provider credentials server-only;
- maps provider failures to safe application errors.

The client provides:

- explicit Join and Leave;
- local camera and microphone controls;
- participant media tiles in stable GM and Player positions;
- browser sound unlock when required;
- reconnect, cleanup, and localized failure states;
- responsive desktop, tablet, and mobile presentation.

Supported capacity is one GM plus up to six Players. The last accepted human Production group test involved one GM and four Players and passed. Quantitative packet-loss, latency, jitter, reconnect timeline, and connection-quality telemetry was not collected and must not be inferred.

## Security boundary

Campaign membership is the application authorization boundary. A provider room name, URL, or token is never durable application authorization. Completed campaigns and unauthorized or removed users cannot obtain new campaign join credentials.

Current tokens permit only the reviewed camera/microphone publication and subscription behavior. They do not grant room administration, data publication, screen sharing, recording, ingress, agent, or related elevated capabilities.

ADR-009 is Accepted only for managed infrastructure and LiveKit in the current campaign Game Room.

## Approved later campaign work

Phase 4C2 may add GM-controlled presentation of an existing image-only Campaign Handout in the shared Game Room Display. This is image selection, replacement, and stop-presentation behavior only. It does not add screen sharing, annotations, maps, drawing tools, or a general document Handouts system.

Phase 4E may refine Campaign and Game Room layout, navigation, responsive behavior, accessibility, and usability without adding new media capabilities.

Recording, transcription, streaming, screen sharing, remote moderation, breakout rooms, virtual backgrounds, and similar media expansion are not active roadmap commitments.

## Standalone Video Rooms backlog boundary

Standalone Video Rooms are retained only as `IDEA-006` in [`IDEAS_BACKLOG.md`](IDEAS_BACKLOG.md). A future review would need to establish a separate product need and independently decide:

- application authorization and ownership;
- invitation and membership behavior;
- expiry, retention, and deletion;
- quotas and participant limits;
- privacy, abuse, and operational controls;
- provider evidence, pricing, region, and exit strategy.

The campaign media core may inform a future review, but campaign membership cannot become standalone authorization by accident. LiveKit's accepted campaign use does not automatically select a standalone provider.

No standalone implementation work should begin unless the idea is explicitly accepted into a future roadmap.
