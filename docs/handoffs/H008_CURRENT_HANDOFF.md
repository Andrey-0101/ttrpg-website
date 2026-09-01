# H008_CURRENT_HANDOFF.md

## 1. Document Control

| Field | Value |
|---|---|
| Project | TTRPG_website / Web_Site_TTRPG |
| Handoff | `H008_CURRENT_HANDOFF.md` |
| Version | 1.0 |
| Creation date | 2026-08-19 (Australia/Perth, UTC+08:00) |
| Scope | Phase 4B managed-video provider spike through completion of LiveKit signaling/lifecycle validation; provider comparison; automated lifecycle/recovery test; four-hour dynamic endurance soak; definition of next stage S2D Real Media Validation |
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Local path | `C:\Projects\ttrpg-website` |
| Shell | PowerShell; use `npm.cmd` / `npx.cmd` on Windows |
| Production canonical URL | `https://ttrpg.fans` |
| Canonical production redirect | `www` permanently redirects to canonical domain |
| Current spike branch | `spike/phase-4b-video-provider-comparison` |
| Expected branch HEAD | `ab981a70e70ad1d14e63e12005130b28337d865b` |
| Commit policy during spike | No commit, push, PR, merge, or deploy unless explicitly approved later |
| Spike code state | Uncommitted temporary branch work; no executable video code is in `main` |
| Previous handoff | `H007_CURRENT_HANDOFF.md` |
| Evidence root | `C:\Projects\ttrpg-video-spike-evidence\2026-08-02` |
| Evidence cut-off | After successful S2C-3 four-hour Dynamic Endurance & Membership Churn Soak |
| Next stage | **S2D — Real Media Validation** |

---

## 2. Instructions for the Next Chat

1. Read this handoff before proposing or executing the next video-stage work.
2. Do **not** repeat completed S2C signaling/lifecycle tests unless new evidence shows a regression or the user explicitly requests repetition.
3. Treat LiveKit signaling/lifecycle validation as **COMPLETE / PASS**.
4. The next technical objective is **S2D Real Media Validation**, not another signaling-only soak.
5. Keep LiveKit as the active advancing provider for the spike; Daily remains blocked by the user's no-card constraint.
6. Do not declare a permanent provider decision until the real media stage has been evaluated and the user accepts the decision.
7. Preserve the user's workflow: one logical checkpoint at a time; concise Russian explanations; Codex prompts/code in English.
8. Use Codex as repository executor/inspector, not as an independent architecture authority.
9. Preserve strict secret handling: never expose provider credentials, tokens, keys, UUIDs, private URLs, or passwords in chat/evidence.
10. Provider/network calls require explicit authorization for the checkpoint in which they occur.
11. Application video safety gates should remain fail-closed except during a specifically authorized browser/application connection window.
12. Do not commit/push/deploy spike code merely because the provider test passed; the spike must first be completed and converted into an accepted implementation plan.
13. Keep H008 as the current handoff. Historical handoffs are context only and must not override newer evidence.

---

## 3. Working Style and Safety Rules

### User workflow preference

- One logical checkpoint per message.
- A checkpoint may contain a small group of closely related commands leading to one clear decision point.
- Stop at interpretation/decision boundaries and wait for user output.
- Avoid repetitive preflights once a state has already been proved and has not changed.
- Prefer evidence over fluent assumptions.
- Distinguish VERIFIED / IMPLEMENTED / DECIDED / PLANNED / BLOCKED / UNKNOWN.

### Language and tooling

- Explanations to user: Russian.
- Codex prompts, source comments, and code blocks: English unless user requests otherwise.
- PowerShell only for local manual commands.
- Use `npm.cmd`, `npx.cmd` on Windows.

### Security / provider discipline

- Never request or display passwords, API keys, API secrets, tokens, provider URLs, UUIDs, or raw environment data unless strictly necessary and explicitly safe.
- `.env.local` is ignored/untracked and contains provider credentials plus spike safety flags.
- Password reset for local Tester 2 was completed manually with masked PowerShell input; password must remain only in the user's own password manager.
- Do not use provider administrative room deletion or participant removal to force a test to pass.
- Recording/transcription/egress were disabled throughout spike tests.

---

## 4. Current Product / Roadmap Context

The project sequencing at the end of this chat is:

- `M4A` — VtM Personal Dice / Persistence: COMPLETE.
- `M4B` — Standalone Video Rooms: ACTIVE.
- `M4C` — Campaign Collaboration Contract: later.
- `M4D` — Shared Campaign Dice: later.
- `M4E` — Campaign Video: later.
- `M4F` — Workspace: later.
- `M5` — Friend Alpha: later.

Within M4B the current video-spike sequence is now:

1. Provider research/comparison — COMPLETE enough to advance LiveKit.
2. S1/S2A scaffold and safety validation — COMPLETE.
3. S2B two-human provider test — COMPLETE.
4. S2C signaling/lifecycle validation — **COMPLETE / PASS**.
5. **S2D Real Media Validation — NEXT.**
6. Final provider decision / ADR-009 acceptance or rejection — after S2D and user review.
7. Production Standalone Video Rooms implementation — after provider decision.

Important: `M4E Campaign Video` is a later integration milestone and is not the same as the current standalone provider spike.

---

## 5. Current Repository / Spike State

### Expected Git state

Current working branch:

`spike/phase-4b-video-provider-comparison`

Expected HEAD:

`ab981a70e70ad1d14e63e12005130b28337d865b`

No commits were created for the video spike. The spike remains local/uncommitted.

Expected working-tree shape from the validated spike scaffold:

```text
 M .env.example
 M eslint.config.mjs
 M messages/en.json
 M messages/ru.json
 M package-lock.json
 M package.json
?? app/[locale]/video-spike/
?? app/api/
?? components/video-spike/
?? lib/video-spike/
?? scripts/run-video-spike-tests.mjs
?? tests/video-spike/
?? tsconfig.video-spike.test.json
```

Nothing should be staged.

### Spike routes

- `/[locale]/video-spike/[provider]`
- `/api/video-spike/[provider]/join`

The route uses `video-spike`, not `__spike`, because of Next.js underscore/private-folder behavior.

### Exact SDKs used

- `livekit-client` `2.21.0`
- `livekit-server-sdk` `2.17.0`
- `@daily-co/daily-js` `0.91.0`
- `@daily-co/daily-react` `0.26.0`
- Node `v24.18.0`

### Application safety flags

Persistent safety gates in `.env.local`:

- `VIDEO_SPIKE_PROVIDER_CALLS_ENABLED`
- `VIDEO_SPIKE_CLIENT_CONNECTIONS_ENABLED`

**End-of-chat expected state: both are `false`.**

### Runtime state at end of chat

- Next.js: **stopped**.
- Application gates: **disabled**.
- Browser test windows: closed.
- Background S2C-3 runner: completed with PASS and should have exited.
- Local Supabase: it had been running during the test workflow, but its exact current state after the four-hour unattended run is **not re-verified** and should not be assumed if needed in the next chat.

---

## 6. Provider Research / Decision State

### LiveKit

Status: **ADVANCES / ACTIVE FINALIST**.

Confirmed account context earlier in the spike:

- Project: `ttrpg-video-test`.
- Plan: Build.
- No payment card.
- Observability disabled.
- Earlier dashboard limit: 100 concurrent participants.
- Earlier included allowance: 5,000 WebRTC participant-minutes.

Do not rely on the earlier remaining-minute count as current after S2C-3. Re-check only if quota becomes operationally relevant.

### Daily

Status: **PROVIDER_ACCOUNT_BLOCKED** for the current no-card requirement.

Browser SDK failed safely with provider-level error:

`account-missing-payment-method`

This occurred even though server-side join credential creation succeeded. The Daily room was explicitly cleaned up afterward.

User constraint remains:

- budget `$0` for the spike;
- no payment card / no paid plan.

### Permanent provider decision

**NOT YET FINAL.**

Current spike advancement decision:

`LIVEKIT_ADVANCES`

Final provider selection should wait until S2D real media validation is complete.

---

## 7. Spike Architecture and Safety Contract Already Implemented

### Join authorization flow

Server-side join flow:

1. feature config;
2. `auth.getUser()`;
3. tester allowlist;
4. provider validation;
5. strict room request parsing;
6. server-derived room/participant identity;
7. provider-call safety gate;
8. provider adapter dispatch.

Request body maximum: 1024 bytes.

### LiveKit adapter

- short token lifetime: 300 seconds;
- room-bound credentials;
- subscribe-only signaling spike;
- no publishing;
- no data/admin capability.

### Daily adapter

- deterministic private room;
- one-hour room expiration;
- camera/mic off;
- screenshare/chat/dialout off;
- recording/transcription explicit false;
- 300-second token;
- receive-only;
- explicit room cleanup required.

### Browser state machine

`disabled → ready → requesting_credentials → connecting → connected → leaving → disconnected/error`

Browser spike characteristics:

- SDKs dynamically imported only after Join;
- no automatic reconnect/refresh behavior added by the application;
- credentials closure-only;
- alias limited to strict lowercase ASCII/digits/internal hyphens, max 48;
- UI intentionally unlinked;
- no remote media rendering in signaling stage;
- screen share disabled;
- recording/transcription disabled.

Default test alias used during human tests:

`s2-local`

---

## 8. Local Testers / Password Recovery History

Two dedicated local Supabase test users exist:

- `s2b-tester-1@example.test`
- `s2b-tester-2@example.test`

Both were previously verified as distinct and allowlisted.

Important password history:

- tester passwords were originally entered via masked interactive prompts;
- passwords were intentionally **not** stored in repo, `.env.local`, evidence, command line, or Codex output;
- Codex verified tester continuity via local Auth/UUID/allowlist reads, not by retaining their passwords;
- Tester 2 password was later unavailable to the user;
- an over-complex Codex helper attempt failed before Auth mutation;
- temporary helper file was removed;
- the user manually reset the **existing** Tester 2 password through local Supabase Auth using masked PowerShell input;
- terminal reported `Tester 2 password updated successfully.`;
- existing tester identity/allowlist was intentionally preserved;
- user was advised to store the new password in their own password manager.

Do not recreate Tester 2 merely because the old password was lost.

---

## 9. S1 / S2A Summary

Earlier spike validation completed successfully before S2B/S2C:

- lint PASS;
- 38 spike tests PASS;
- site URL checks PASS;
- existing dice checks PASS;
- build PASS;
- database concurrency PASS after Docker/Supabase restart;
- provider credential smoke PASS;
- Daily policy audit PASS.

Relevant evidence includes:

- `daily-domain-policy-audit.json`
- `provider-credential-smoke.json`

No need to repeat these in S2D unless media-stage changes affect the corresponding contract.

---

## 10. S2B — Two-Human Provider Comparison

### LiveKit result

**PASS**.

Two dedicated local testers joined the same LiveKit room in isolated browser sessions.

Confirmed:

- both browser UIs reached `Connected for signaling only.`;
- no camera/mic permission prompts;
- provider read saw exactly 2 participants;
- 2 distinct participants;
- 0 published tracks;
- clean leave;
- final room state `not_found` after both left.

Evidence:

- `s2b-livekit-preflight-diagnostic.json`
- `s2b-livekit-two-participants-retry.json`
- `s2b-livekit-gates-disabled.json`
- `s2b-livekit-post-disconnect.json`

### Daily result

**PROVIDER_ACCOUNT_BLOCKED**.

Observed browser provider error:

`account-missing-payment-method`

Evidence:

- `s2b-daily-browser-failure.json`
- `s2b-daily-gates-disabled-after-failure.json`
- `s2b-daily-room-cleanup.json`
- `s2b-provider-comparison.json`

Current advancement:

`LIVEKIT_ADVANCES`

---

## 11. S2C-1 — Two-Human Stability Run

### Purpose

Human-browser control run before automated lifecycle/endurance testing.

### Execution

- two real local testers;
- same LiveKit room;
- signaling-only;
- planned duration 5 minutes;
- actual stable connected period approximately 10 minutes.

### Active observation result

- room found: Yes;
- participant count: 2;
- distinct participant count: 2;
- published track count: 0;
- unexpected published media: No;
- recording/transcription/egress: Not observable by that observer;
- provider read operations: 1;
- provider write operations: 0;
- result: PASS.

Both browser UIs stayed:

`Connected for signaling only.`

After Leave, both showed:

`Disconnected. The temporary connection was disposed.`

### Post-disconnect observer issue

The first post-disconnect observer collapsed all exceptions into `unknown`, so its evidence ended `STOP` even though this was an observer limitation, not a proven provider failure.

Offline diagnosis classified the evidence as insufficient to distinguish normal `not_found` from a transport/read failure.

A corrected single read used `RoomServiceClient.listRooms([derivedRoomName])` semantics.

Final corrected post-disconnect result:

- room state: `not_found`;
- participant count: not applicable;
- provider reads: 1;
- provider writes: 0;
- gates remained disabled: Yes;
- result: **PASS**.

Evidence:

- `s2c-s2c1-active-observation.json`
- `s2c-s2c1-post-disconnect.json` — historical STOP due observer limitation
- `s2c-s2c1-post-disconnect-r1.json` — authoritative corrected PASS

### Final S2C-1 status

**COMPLETE / PASS.**

Do not rerun unless a later change invalidates it.

---

## 12. Revised S2C-2 — Automated Multi-Participant Lifecycle & Recovery

The original separate S2C-2/S2C-3/S2C-4 signaling plan was intentionally simplified because it duplicated similar signaling-only coverage.

A single automated four-participant lifecycle/recovery test replaced the old set.

### Test design

Four bot participants; 5 cycles:

1. baseline connection/disconnection;
2. graceful mid-session leave + rejoin;
3. abrupt client-process loss + return;
4. changing membership with multiple leave/rejoin events;
5. extended session with mid-session recovery.

Important semantics:

- abrupt-loss tests terminate a local bot worker/process without `Room.disconnect()`;
- no `RemoveParticipant` or administrative provider cleanup;
- this simulates abrupt client-process termination, not a true network blackhole;
- fresh credentials and new connection generation used on rejoin;
- stale/ghost generations explicitly checked.

### Final result

1. offline orchestrator validation: PASS
2. Cycle 1 baseline: PASS
3. Cycle 2 graceful leave/rejoin: PASS
4. Cycle 3 abrupt loss/rejoin: PASS
5. Cycle 4 changing membership: PASS
6. Cycle 5 extended recovery: PASS
7. total test duration: 22m 42.5s
8. participant connection attempts: 25
9. graceful disconnects: 22
10. abrupt client terminations: 3
11. unexpected disconnect/reconnect events: 0
12. stale/ghost participants detected: No
13. final provider cleanup: PASS
14. provider administrative write operations: 0
15. application video gates remained disabled: Yes
16. tracked repository files changed by checkpoint: No
17. evidence: `s2c-s2c2-lifecycle-recovery.json`
18. overall result: **PASS**

### Final revised S2C-2 status

**COMPLETE / PASS.**

This supersedes the earlier proposal to run separate 3-user and 7-user signaling-only tests.

---

## 13. S2C-3 — Four-Hour Dynamic Endurance & Membership Churn Soak

### Why this replaced the simple 3-hour soak

The user deliberately chose a more informative dynamic endurance scenario instead of keeping four static bots connected for three hours.

The four-hour scenario simultaneously tested:

- long-lived connections;
- long-lived room state;
- late joins;
- graceful leaves;
- abrupt client loss;
- recovery after abrupt loss;
- membership churn;
- 7-participant concurrency;
- stale/ghost prevention;
- natural final cleanup.

### Long-lived roles

- A: connected at start, uninterrupted until end (~4h).
- B: connected at start, uninterrupted until end (~4h).
- E: joined at T+10m, remained until end (~3h50m).
- H: joined at T+2h, remained until end (~2h).

Any unexpected disconnect/reconnecting/reconnected event for these required-lifetime participants was a failure condition.

### Scheduled scenario

Principal membership sequence:

`4 → 5 → 4 → 5 → 4 → 5 → 7 → 6 → 5 → 4 → 5 → 4 → 0/not_found`

Key events:

- `T+00:00`: A/B/C/D connect.
- `T+00:10`: E late join and remains to end.
- `T+00:40`: C graceful leave.
- `T+01:00`: F late join.
- `T+01:30`: D abrupt client-process loss.
- after natural D cleanup: D returns using fresh credentials/new generation.
- `T+02:00`: G and H join; seven-participant state begins.
- `T+02:30`: F graceful leave; D graceful leave; G abrupt loss; remaining A/B/E/H.
- `T+03:00`: I very late join.
- `T+03:30`: I graceful leave.
- `T+04:00`: A/B/E/H graceful final shutdown; natural room cleanup.

Periodic read-only observations ran approximately every 15 minutes during stable periods plus after membership changes.

### Execution model

Codex created/validated a standalone background runner and then stopped its turn after confirming the initial four-participant state.

The runner operated independently for four hours without user interaction, browser windows, Next.js, or ongoing Codex token use.

Status path:

`C:\Projects\ttrpg-video-spike-evidence\2026-08-02\s2c-s2c3-dynamic-endurance-status.json`

Final evidence path:

`C:\Projects\ttrpg-video-spike-evidence\2026-08-02\s2c-s2c3-dynamic-endurance.json`

### Final result

1. runner final state: PASS
2. total test duration: 4h 0m 46.9s
3. A uninterrupted duration: 4h 0m 5.2s
4. B uninterrupted duration: 4h 0m 4.8s
5. E uninterrupted duration: 3h 50m 2s
6. H uninterrupted duration: 2h 0m 2.1s
7. D abrupt-loss cleanup: PASS
8. D recovery: PASS
9. D later graceful leave: PASS
10. G abrupt-loss cleanup: PASS
11. seven-participant interval: PASS
12. late joins: PASS
13. unexpected disconnect/reconnect events: 0
14. stale/ghost participants detected: No
15. participant connection attempts: 10
16. graceful disconnects: 8
17. abrupt process terminations: 2
18. provider read operations: 57
19. provider administrative write operations: 0
20. final provider cleanup: PASS
21. application gates remained disabled: Yes
22. tracked repository files changed by checkpoint: No
23. overall result: **PASS**

### Final S2C-3 status

**COMPLETE / PASS.**

No further static signaling soak or standalone 7-participant boundary test is required unless the product requirements materially change.

---

## 14. Overall S2C Conclusion

### What is now VERIFIED

LiveKit signaling/lifecycle behavior passed all planned and revised checks for the current spike:

- two independent human browser participants;
- four-participant automated lifecycle scenarios;
- graceful leave and fresh rejoin;
- abrupt client-process loss and natural provider cleanup;
- recovery after abrupt loss;
- changing room membership;
- 7 simultaneous participants for ~30 minutes inside a long-lived room;
- late joins to an old room;
- multiple long-lived connections lasting 2–4 hours;
- zero unexpected reconnect/disconnect events in the four-hour soak;
- zero stale/ghost participants;
- final natural cleanup;
- zero provider administrative writes used to force results.

### What is NOT yet verified

The completed S2C tests were intentionally **signaling-only**.

They do **not** prove:

- real camera publication;
- real microphone publication;
- remote track subscription;
- actual audio/video rendering;
- mute/unmute behavior;
- camera on/off behavior;
- media track recovery;
- real bandwidth consumption characteristics;
- audio/video latency or jitter;
- subjective video/audio quality;
- cross-region real-world media quality;
- Perth ↔ Russia media performance.

Therefore the correct status is:

**S2C signaling/lifecycle validation = COMPLETE / PASS**

**S2D real media validation = REQUIRED NEXT**

---

## 15. Next Stage — S2D Real Media Validation

### Goal

Validate that LiveKit works as an actual videoconferencing provider for the intended TTRPG use case, not merely as a signaling/session service.

### S2D should add genuinely new evidence

At minimum, the next chat should design tests for:

- camera publication;
- microphone publication;
- remote media subscription;
- actual video/audio playback/rendering;
- camera on/off;
- microphone mute/unmute;
- participant joining after media is already active;
- participant leaving/rejoining while media is active;
- media recovery after an interrupted client/session where practical;
- multiple simultaneous publishers/subscribers;
- browser permission behavior on Windows;
- evidence that recording/transcription/egress remain disabled;
- resource/bandwidth observations where meaningful.

### Geographic validation

A real user scenario remains planned:

- Perth, Australia ↔ Russia;
- Windows PC/laptop only for the initial real-world test.

The current S2C results must never be described as proof of Perth↔Russia media quality.

### Human vs automated S2D testing

Automation can and should be used for:

- synthetic media publication/subscription where technically valid;
- track-count assertions;
- connection-state assertions;
- media lifecycle/recovery mechanics;
- repeated deterministic scenarios.

Human participation remains useful/required for:

- camera/mic permission UX;
- real device behavior;
- subjective audio/video quality;
- actual cross-region user experience.

### Suggested design principle

Do not create a large ladder of redundant media tests. Prefer one or two high-value scenarios where each validates a distinct risk class, mirroring the simplification made for S2C.

---

## 16. External S2C Tooling

External tools live outside the repository under:

`C:\Projects\ttrpg-video-spike-evidence\2026-08-02\s2c-tools`

Existing capabilities include:

- bot runner;
- server-side observer;
- S2C harness validation;
- lifecycle/recovery orchestrator;
- dynamic endurance background runner.

Earlier harness validation:

- 33/33 offline self-tests PASS;
- room derivation compatibility PASS;
- restricted bot permission compatibility PASS.

The S2C-2 and S2C-3 external orchestrators/runners may be reused as patterns for S2D, but do not assume signaling-only bots are sufficient for real media validation.

Do not move external evidence/test tooling into the application repository unless a later implementation decision explicitly requires it.

---

## 17. Important Evidence Files

Evidence root:

`C:\Projects\ttrpg-video-spike-evidence\2026-08-02`

Key files:

### Provider preparation / S2B

- `daily-domain-policy-audit.json`
- `provider-credential-smoke.json`
- `s2b-livekit-preflight-diagnostic.json`
- `s2b-livekit-two-participants-retry.json`
- `s2b-livekit-gates-disabled.json`
- `s2b-livekit-post-disconnect.json`
- `s2b-daily-browser-failure.json`
- `s2b-daily-gates-disabled-after-failure.json`
- `s2b-daily-room-cleanup.json`
- `s2b-provider-comparison.json`

### S2C planning / readiness

- `s2c-livekit-test-plan.md`
- `s2c-livekit-test-plan.json`
- `s2c-livekit-quota-confirmed.json`
- `s2c-s2c1-local-readiness.json`
- `s2c-s2c1-gates-enabled.json`
- `s2c-s2c1-gates-disabled-for-auth-recovery.json`

### S2C-1

- `s2c-s2c1-active-observation.json`
- `s2c-s2c1-post-disconnect.json` — observer-limitation STOP; not authoritative final result
- `s2c-s2c1-post-disconnect-r1.json` — authoritative PASS

### Revised S2C-2

- `s2c-s2c2-lifecycle-recovery.json`

### S2C-3

- `s2c-s2c3-dynamic-endurance-status.json`
- `s2c-s2c3-dynamic-endurance.json`

---

## 18. Quota / Cost Context

Earlier confirmed LiveKit Build account allowance:

- 5,000 WebRTC participant-minutes included;
- 100 concurrent participants;
- no payment card;
- earlier current cost `$0.00`.

Before S2C-3, a conservative estimate showed the four-hour dynamic scenario would consume roughly 1,170 participant-minutes at most, plus prior small tests.

The four-hour scenario was intentionally allowed to reach 7 participants for 30 minutes.

**Current exact remaining quota was not re-read after S2C-3.**

Do not quote the old remaining-minute value as current. If S2D media tests could materially consume quota, re-check the dashboard once before a substantial new run.

User budget constraint remains:

- `$0` spike budget;
- no payment card;
- no paid-plan upgrade unless the user explicitly changes this constraint.

---

## 19. Temporary Password-Reset Helper Incident

A Codex attempt to build a highly defensive password-reset helper became over-complicated and repeatedly failed before the password prompt due PowerShell helper/launcher issues.

Important outcome:

- no Auth mutation occurred during those failed Codex attempts;
- no password was entered during those failed attempts;
- no LiveKit/Daily operations occurred;
- gates were disabled;
- Next.js was stopped;
- repository was not modified by the incident.

Temporary file:

`C:\Projects\ttrpg-video-spike-evidence\2026-08-02\S2C-Tester2-PasswordReset-Temporary.ps1`

was manually removed by the user.

Tester 2 password was then successfully reset using a much simpler direct local PowerShell approach.

Lesson for future checkpoints:

**Do not over-engineer small local recovery operations with large helper scripts when a bounded, transparent command can achieve the same result safely.**

---

## 20. Decisions Made During This Chat

### DECIDED

1. LiveKit advances from provider comparison; Daily is blocked under the no-card constraint.
2. Permanent provider decision remains deferred until real media validation.
3. Old fragmented S2C-2 / S2C-3 / S2C-4 signaling plan was simplified.
4. A single automated four-participant lifecycle/recovery test replaced redundant intermediate signaling tests.
5. A dynamic four-hour endurance/churn scenario replaced the simple three-hour static soak.
6. A/B remained long-lived anchors for four hours; E for almost the full test; H for the last two hours.
7. D was explicitly tested for abrupt loss → natural cleanup → rejoin → later graceful leave.
8. G was tested for abrupt loss without return.
9. The soak intentionally included seven simultaneous participants.
10. No additional standalone 7-participant signaling boundary test is needed after the successful soak.
11. No additional static signaling soak is needed after S2C-3 PASS.
12. S2C signaling/lifecycle validation is complete.
13. Next stage is S2D Real Media Validation.

### NOT DECIDED

- final permanent video provider;
- production video-room UX;
- exact production participant limit;
- exact media quality thresholds;
- production media device controls;
- exact S2D scenario count/duration;
- final ADR-009 status;
- commit/deployment of spike code.

---

## 21. Recommended First Checkpoint in the Next Chat

Do **not** immediately start cameras or provider calls.

First checkpoint should be a concise **S2D Real Media Validation design review** that answers:

1. What exact media capabilities must be proven before LiveKit can be accepted?
2. Which parts can be automated with synthetic media and which require humans/devices?
3. What is the smallest set of non-redundant scenarios that covers:
   - multi-publisher media;
   - subscription/rendering;
   - mute/camera controls;
   - active-media join/leave/rejoin;
   - media recovery;
   - real Windows permission/device behavior;
   - Perth↔Russia quality?
4. What objective pass/fail metrics can be collected without pretending subjective quality is objective?
5. Does the next run materially affect the free LiveKit quota?
6. What temporary spike-code changes are needed, and can they remain uncommitted on the current branch?

Only after that design is accepted should Codex implement/run S2D.

---

## 22. Handoff Completion Status

This handoff closes the current chat after:

- S2C-1 PASS;
- revised S2C-2 PASS;
- S2C-3 four-hour dynamic endurance soak PASS;
- signaling/lifecycle validation completion;
- definition of S2D Real Media Validation as the next stage.

No additional work from this chat needs to be repeated before starting S2D, except verifying any runtime state that the next stage actually depends on.

**Current transition point:**

`Phase 4B provider spike → S2D Real Media Validation`
