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
- local camera and microphone controls, including an optional mirror for the viewer's own camera preview.
  The browser remembers the preference, which defaults to off.
- participant media tiles in stable GM and Player positions;
- browser sound unlock when required;
- reconnect, cleanup, and localized failure states;
- responsive desktop, tablet, and mobile presentation.

Supported capacity is one GM plus up to six Players. The last accepted human Production group test involved one GM and four Players and passed. That historical group test collected no quantitative packet-loss, latency, jitter, reconnect timeline or connection-quality telemetry; the later diagnostics add-on does not retroactively supply it.

## Security boundary

Participant labels use `profiles.display_name aka assigned character name` for Players and
`profiles.display_name aka Game Master role` for the GM. Only `display_name` is used:
username, email and identifiers are never name fallbacks. Null, empty and whitespace-only
names use viewer-local `Incognito` / `Strange stranger` (EN) or `Инкогнито` /
`Странный незнакомец` (RU). The GM role is `Keeper` / `Хранитель` for
`call-of-cthulhu-7e`, `Storyteller` / `Рассказчик` for `vtm-v5`, and
`Game Master` / `Мастер игры` for unknown or unmapped systems; `aka` stays unchanged.
Actual names are never translated. The directory contains raw nullable names,
and the client formats them with next-intl so locale changes update fallback/role text.
The shared campaign role resolver derives the title from the existing campaign game
system; it does not alter identities, slots, media lifecycle or authorization.

The initial page and protected directory GET share one loader. Its name-only RPC checks
campaign access, active assignment, membership, ownership and game-system compatibility.
Profile changes, assignments/unlinks and assigned-character renames invalidate only affected
campaign directories. Late join and reconnect refresh the directory in place; superseded
responses cannot restore stale names or removed entries. Identities, slots and attached media
remain unchanged. Automated coverage does not constitute real multi-user/browser acceptance.

Campaign membership is the application authorization boundary. A provider room name, URL, or token is never durable application authorization. Completed campaigns and unauthorized or removed users cannot obtain new campaign join credentials.

Current tokens permit the reviewed camera/microphone publication and subscription behavior, plus GM-only `SCREEN_SHARE_AUDIO` for the separately approved computer-audio add-on. Players retain their camera/microphone restrictions. Neither role gets `SCREEN_SHARE` video, room administration, data publication, recording, ingress, agent, or related elevated capabilities.

ADR-009 is Accepted only for managed infrastructure and LiveKit in the current campaign Game Room.

## Current presentation and approved later campaign work

Phase 4C2 implements GM-controlled presentation of an existing Campaign Gallery image in the shared Game Room Display, including image selection, replacement, stop presentation, synchronized Expand / Collapse, and late join/rejoin behavior. It does not add persistence, screen sharing, annotations, structured maps, drawing tools, or a general document Handouts system.

Gallery folder/name management keeps selection keyed by image ID.
Renaming or moving the selected image updates only GM organization metadata: it
does not call the presentation coordinator, restart media or change the shared
image URL/identity. The selected-image view retains its management controls even
after the image moves out of the currently browsed folder. Player presentation and
image authorization remain independent of GM folders.

Phase 5A may refine Campaign and Game Room layout, navigation, responsive behavior, accessibility, and usability without adding new media capabilities.

Recording, transcription, streaming, screen-video sharing, remote moderation, breakout rooms, virtual backgrounds, and similar media expansion are not active roadmap commitments.

## Pre-Phase-5 Add-on — GM Computer Audio Sharing

**Status: IMPLEMENTED / DEPLOYED / MANUAL PRODUCTION ACCEPTANCE PENDING.** Phase 4 remains CLOSED / DEPLOYED / ACCEPTED; Phase 5A remains PLANNED / NOT STARTED.

A connected GM explicitly captures computer audio with the browser picker into a separate LiveKit `ScreenShareAudio` publication in the existing campaign room. This is not microphone mixing/replacement, screen-video sharing, a second transport/room, an audio-file library, recording or a new service. It requires no database/schema/migration/RLS/Storage change or persistent setting. Client/server SDKs remain 2.21.0/2.17.0.

Initial GM capture support is Windows 11/current stable Chrome or Edge. Prefer Window for audio intended to belong to the selected desktop application (for example Spotify/VLC); enable the browser's audio toggle, such as Share with system audio, when offered. Selecting Window alone does not grant audio. Entire screen + system audio remains fallback and may include other applications/notifications. Players receive ordinary LiveKit audio regardless of Windows 11 capture support. Windows 10, macOS/Linux, Firefox/Safari and mobile capture are outside the initial supported scope.

Capture requests `windowAudio: "window"`, `systemAudio: "include"` and `selfBrowserSurface: "exclude"`. These are browser hints, not hard isolation guarantees or programmatic application selection; the native picker remains authoritative. Excluding the current tab and rejecting actual browser-tab surfaces reduces self-capture risk but cannot identify every browser window containing the Game Room. Select a desktop player, not the Game Room browser window. Actual video-track `getSettings().displaySurface` is read before stopping video. Window audio requires a valid capture and a live usable audio track, not `restrictOwnAudio`; Monitor/system audio must report `getSettings().restrictOwnAudio === true` before and after video stop. False/missing/unreadable monitor safety settings, browser tabs, unknown surfaces and invalid capture stop all tracks without publication. Display video stops first and is never published or retained as a hidden fallback; if stopping it also ends audio, sharing aborts safely.

Quality is a transient 128/192 kbps target, default 192; it is locked while starting/sharing/stopping. Publication uses `audioPreset.maxBitrate`, stereo intent and DTX/RED off, not obsolete `audioBitrate`; capture requests stereo/48 kHz and disables speech processing only for computer audio. These are quality targets, not original-rate/constant-network-bitrate promises; no resampling/mixing is added.

The header control has localized idle/starting/sharing/stopping feedback and nonfatal cancellation, unsupported capture/surface, unsafe system audio, source-neutral no-audio, video-stop-ended-audio and publication errors. It adds no separate mode selector; the native picker decides the source. Remote GM audio uses a second audio element and existing Enable sound behavior; the local GM hears no duplicate local playback. Stop/native audio end/Leave/disposal/terminal disconnect clean owned capture, including late completions. Ordinary reconnect retains capture through SDK republishing without prompting or duplicate publication. Directory-authorized mapping preserves the accepted dynamic-membership behavior; a late Player subscribes to the current audio without GM restart. Mic, camera and Gallery image presentation remain independent.

Full real-world multi-user audio acceptance is deferred until an actual gaming session and does not block Phase 5A planning. Echo safety, application isolation and multi-machine acceptance are not claimed complete. Automated mocked-capture/adapter/controller/token/UI tests do not prove native Windows capture, application isolation or echo safety. Manual Production acceptance must cover Chrome and Edge, GM + real Player, Window + audio toggle, selected desktop sound audible while another application's sound is not, Entire screen fallback, independent microphone, no delayed own-voice echo, no screen video, both qualities, site/native Stop, late join and reconnect without a picker.

While the GM's computer audio is available, each Player can adjust Music volume
with a vertical slider to the right of the GM tile. When the gap is too narrow,
the current percentage in the room header opens the same slider. The tiles stay
in place as the GM starts and stops sharing. The default is 100%. The open Game Room keeps
the chosen value and reapplies it to that listener's incoming `ScreenShareAudio`
track after sharing restarts or the connection resumes. Microphone playback uses
its own audio track.

## Deployed technical diagnostics boundary

Developer Diagnostics (merged/deployed PR #73/#74) observes public read-only LiveKit connection statistics without media recording, new media grants or another room. Game Session does not control collection. One real GM-only recording and ZIP export succeeded; multi-user acceptance remains pending and is postponed until real play. The single-GM camera had no subscribers, so lack of outgoing video traffic alone is not evidence of a defect. See [diagnostics release/acceptance evidence](../architecture/DEVELOPER_DIAGNOSTICS.md).

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
