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

Current tokens permit the reviewed camera/microphone publication and subscription behavior, plus GM-only `SCREEN_SHARE_AUDIO` for the separately approved computer-audio add-on. Players retain their camera/microphone restrictions. Neither role gets `SCREEN_SHARE` video, room administration, data publication, recording, ingress, agent, or related elevated capabilities.

ADR-009 is Accepted only for managed infrastructure and LiveKit in the current campaign Game Room.

## Current presentation and approved later campaign work

Phase 4C2 implements GM-controlled presentation of an existing Campaign Gallery image in the shared Game Room Display, including image selection, replacement, stop presentation, synchronized Expand / Collapse, and late join/rejoin behavior. It does not add persistence, screen sharing, annotations, structured maps, drawing tools, or a general document Handouts system.

Phase 5A may refine Campaign and Game Room layout, navigation, responsive behavior, accessibility, and usability without adding new media capabilities.

Recording, transcription, streaming, screen-video sharing, remote moderation, breakout rooms, virtual backgrounds, and similar media expansion are not active roadmap commitments.

## Pre-Phase-5 Add-on — GM Computer Audio Sharing

**Status: IMPLEMENTED / DEPLOYED / MANUAL PRODUCTION ACCEPTANCE PENDING.** Phase 4 remains CLOSED / DEPLOYED / ACCEPTED; Phase 5A remains PLANNED / NOT STARTED.

A connected GM explicitly captures computer audio with the browser picker into a separate LiveKit `ScreenShareAudio` publication in the existing campaign room. This is not microphone mixing/replacement, screen-video sharing, a second transport/room, an audio-file library, recording or a new service. It requires no database/schema/migration/RLS/Storage change or persistent setting. Client/server SDKs remain 2.21.0/2.17.0.

Initial GM capture support is Windows 11/current stable Chrome or Edge. Prefer Window for audio intended to belong to the selected desktop application (for example Spotify/VLC); enable the browser's audio toggle, such as Share with system audio, when offered. Selecting Window alone does not grant audio. Entire screen + system audio remains fallback and may include other applications/notifications. Players receive ordinary LiveKit audio regardless of Windows 11 capture support. Windows 10, macOS/Linux, Firefox/Safari and mobile capture are outside the initial supported scope.

Capture requests `windowAudio: "window"`, `systemAudio: "include"` and `selfBrowserSurface: "exclude"`. These are browser hints, not hard isolation guarantees or programmatic application selection; the native picker remains authoritative. Excluding the current tab and rejecting actual browser-tab surfaces reduces self-capture risk but cannot identify every browser window containing the Game Room. Select a desktop player, not the Game Room browser window. Actual video-track `getSettings().displaySurface` is read before stopping video. Window audio requires a valid capture and a live usable audio track, not `restrictOwnAudio`; Monitor/system audio must report `getSettings().restrictOwnAudio === true` before and after video stop. False/missing/unreadable monitor safety settings, browser tabs, unknown surfaces and invalid capture stop all tracks without publication. Display video stops first and is never published or retained as a hidden fallback; if stopping it also ends audio, sharing aborts safely.

Quality is a transient 128/192 kbps target, default 192; it is locked while starting/sharing/stopping. Publication uses `audioPreset.maxBitrate`, stereo intent and DTX/RED off, not obsolete `audioBitrate`; capture requests stereo/48 kHz and disables speech processing only for computer audio. These are quality targets, not original-rate/constant-network-bitrate promises; no resampling/mixing is added.

The header control has localized idle/starting/sharing/stopping feedback and nonfatal cancellation, unsupported capture/surface, unsafe system audio, source-neutral no-audio, video-stop-ended-audio and publication errors. It adds no separate mode selector; the native picker decides the source. Remote GM audio uses a second audio element and existing Enable sound behavior; the local GM hears no duplicate local playback. Stop/native audio end/Leave/disposal/terminal disconnect clean owned capture, including late completions. Ordinary reconnect retains capture through SDK republishing without prompting or duplicate publication. Directory-authorized mapping preserves the accepted dynamic-membership behavior; a late Player subscribes to the current audio without GM restart. Mic, camera and Gallery image presentation remain independent.

Automated mocked-capture/adapter/controller/token/UI tests do not prove native Windows capture, application isolation or echo safety. Manual Production acceptance must cover Chrome and Edge, GM + real Player, Window + audio toggle, selected desktop sound audible while another application's sound is not, Entire screen fallback, independent microphone, no delayed own-voice echo, no screen video, both qualities, site/native Stop, late join and reconnect without a picker.

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
