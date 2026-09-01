# H009_CURRENT_HANDOFF.md

## 1. Document Control

| Field | Value |
|---|---|
| Project | TTRPG Website / TTRPG Hub |
| Handoff | `H009_CURRENT_HANDOFF.md` |
| Version | 1.0 |
| Closure date | 2026-08-30 |
| Scope | Production rollout of campaign video foundation, CoC campaign shell, dedicated responsive Game Room, final video-card UX, and successful human group acceptance test |
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Production canonical URL | `https://ttrpg.fans` |
| Current verified `origin/main` | `b033b93b1993561cbdf349987aa37aaf83574108` |
| Current verified Production deployment | `dpl_GMGzywmaHjEZheB2NQcCPvJ98GND` — `READY` |
| Previous handoff | `H008_CURRENT_HANDOFF.md` |
| Stage status | **COMPLETE / PASS for the accepted current scope** |

---

## 2. Executive Closure Summary

This stage is closed successfully.

The following capabilities are now live in Production:

- campaign creation for Vampire: The Masquerade and Call of Cthulhu campaign shells;
- strict game-system compatibility between campaigns and characters;
- campaign membership and access control;
- dedicated localized Game Room route;
- LiveKit video room for one GM plus up to six players;
- participant camera and microphone controls;
- adaptive seven-slot layout;
- responsive desktop, tablet, and mobile behavior;
- final accepted video-card visual design;
- safe EN/RU authentication and campaign routing.

The final human Production group test was completed by the user without Codex monitoring. The user reported that everything worked correctly and accepted the stage as successful.

This acceptance confirms practical functionality and user-visible quality for the tested session. It does **not** include a quantitative packet-loss, latency, jitter, or `ConnectionQualityChanged` report because automated telemetry was not running during the test.

No additional fix or retest is required before moving to the next product stage.

---

## 3. Instructions for the Next Chat

1. Read this handoff before proposing more campaign, Game Room, LiveKit, or CoC work.
2. Treat the current campaign-video/Game Room scope as **COMPLETE / PASS**.
3. Do not repeat completed rollout, migration, layout, media, or human acceptance tests unless:
   - a relevant regression is reported;
   - the implementation changes materially; or
   - the user explicitly requests repetition.
4. Treat LiveKit as the accepted Production provider for the current implementation.
5. Do not recreate the temporary Preview branch guard or `vercel.json` used during the original safe rollout.
6. Do not change Supabase, LiveKit, Auth, Vercel variables, participant limits, or room naming merely as a new-chat preflight.
7. Work from the latest `origin/main` in a new isolated worktree. Do not switch or clean the protected original worktree.
8. Use the final UI decisions in this handoff as authoritative. Older mockups and handoffs are historical context only.
9. Keep VtM characters incompatible with CoC campaigns. Never use a VtM character as a CoC participant character.
10. Do not activate planned Game Room tools with placeholder actions or invented APIs.
11. Preserve secret discipline: never display LiveKit, Supabase, Vercel, Auth, token, UUID, password, or `.env` values.
12. For future Production releases, continue using PR → CI/Vercel Preview → squash merge → automatic Production deployment. Do not create manual deployments unless explicitly required.

---

## 4. Final Release History

| PR | Production squash SHA | Outcome |
|---|---|---|
| #28 | `6a5402df81dae5380e8e606168c0228b9514a92d` | Campaign video rooms foundation released; Production database migrations and LiveKit variables rolled out |
| #29 | `af45c7db489cccb73072a5b1127b0b5f578ef782` | CoC campaign shell enabled while character creation remained system-specific/planned |
| #30 | `dcbcc22e13f662ddf22754bddc150d4f63a5377c` | Campaign-creation navigation/submission hotfix |
| #31 | `0cda2292954a96e7ef23e629ce76d5470615c632` | Dedicated Game Room route and planned workspace shell |
| #32 | `4ef91f529e81ec50cd9ec08385c2fcae6171ae0b` | Approved three-column Game Room composition and stable seven-slot layout |
| #33 | `bf3cf82f09f46e138bc6668aeb7dc1c5542a6879` | Viewport-driven responsive layout with FullHD/QHD/4K and mobile verification |
| #34 | `b033b93b1993561cbdf349987aa37aaf83574108` | Final video-card UX hotfix and accepted visual presentation |

Final verified Production state:

```text
origin/main: b033b93b1993561cbdf349987aa37aaf83574108
deployment:  dpl_GMGzywmaHjEZheB2NQcCPvJ98GND
state:       READY
canonical:   https://ttrpg.fans
source:      Git main / automatic Vercel deployment
```

Final anonymous EN/RU smoke checks passed. The final deployment had no observed runtime `error`/`fatal` clusters during the release verification window.

---

## 5. Production Supabase State

### Production project

```text
project ref: nryzkqwcnbbneazaksgh
```

Production contains all eight expected migrations. The two campaign-video migrations added during rollout were:

```text
20260822190351_campaign_video_data_foundation
20260823143856_harden_campaign_database_grants
```

Post-rollout verification confirmed:

- migration ledger: 8/8;
- repeat dry-run: database up to date;
- project state: `ACTIVE_HEALTHY`;
- seven campaign-video tables have RLS;
- campaign-images bucket is private;
- all five required FK indexes were valid;
- `handle_new_user()` execution was revoked from `public`, `anon`, `authenticated`, and `service_role` as intended;
- no later Game Room UI release changed schema, migrations, RLS, Auth, or Production data.

### Pre-rollout backup

The logical Production backup created before the two campaign-video migrations was stored at:

```text
C:\Users\anryj\Documents\SupabaseBackups\ttrpg-website\20260828-004700-pre-m4e-campaign-video
```

It contains:

| File | Size | SHA-256 |
|---|---:|---|
| `public-schema.sql` | 59,341 bytes | `772ded948917d7698d0af26be16bf4a3b5f91ef0b50d60f7fb059192a1546dc2` |
| `public-data.sql` | 20,444 bytes | `24478afabff90174d89057f4cac7324834940332836621c224d72f71481ffdf4` |
| `roles.sql` | 358 bytes | `4350a72b5ec109888e740c17f3eb4da2fcd95ab73af26499538ed0bf615db543` |

Do not delete or overwrite this backup as routine cleanup.

---

## 6. Production Vercel and Environment State

Production uses six expected variables:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

The LiveKit values are Production-scoped and encrypted/sensitive. No values should be printed, copied into chat, or placed in command-line arguments.

The deployment model remains:

```text
merge to main
    -> automatic Vercel Production build
    -> READY deployment
    -> canonical ttrpg.fans alias
```

No manual deployment or promotion was used for the completed stage.

---

## 7. Final LiveKit Contract

Current client/provider state:

```text
livekit-client: 2.21.0
adaptiveStream: enabled
dynacast: enabled
simulcast: enabled by the SDK default
default camera capture: up to 1280x720 at 30 fps
accepted room capacity: 1 GM + 6 players
```

Important distinctions:

- 720p is the publication/capture ceiling, not a hard CSS card-size limit.
- Video cards use responsive CSS geometry.
- LiveKit selects appropriate subscription quality based on actual display conditions where supported.
- Recording, transcription, ingress, and egress are not part of the accepted feature.
- No recording or egress was used in the final human test.

Room-level and participant-level behavior:

- room access is derived from authenticated campaign membership;
- participant positions are stable and do not reorder when camera state changes;
- local participant can control only their own camera and microphone;
- remote cards expose status indicators, not interactive media controls;
- Leave is a room-level action in the compact Game Room header;
- reconnect and safe error handling are implemented.

---

## 8. Final Game Room Product and UI Contract

### Route

```text
/{locale}/campaigns/{campaignId}/game-room
```

### Desktop composition

- compact route-specific header;
- three-column layout approximately `1.5fr / 1fr / 1fr`;
- stable slots for GM and Player 1–6;
- GM centered in the wide left column;
- large Display area in the lower-left workspace;
- Game Tools panel beneath Display;
- planned tool areas are visible only as inactive/planned UI.

### Responsive acceptance

Primary desktop acceptance viewport:

```text
1920 x 900 CSS px
browser zoom 100%
ordinary maximized browser window on a FullHD monitor
```

Verified geometry from PR #33:

| Viewport | Player slot | Document behavior |
|---|---:|---|
| 1920×900 EN/RU | 460.89×259.24 | no scroll |
| 1920×1080 | 534.31×300.54 | no scroll |
| 2560×1300 | 689.58×387.89 | no scroll |
| 3840×1980 | 1069.72×601.71 | no scroll |
| 1366×700 | 348.44×195.99 | no scroll |
| 1024×768 | 486.33×273.56 | normal vertical scroll |
| 390×844 | 350.67×197.25 | normal vertical scroll |

Across the verified viewports:

- card ratio remains `16:9`;
- horizontal page overflow is absent;
- seven slots remain present;
- desktop composition grows on QHD/4K;
- controls retain ergonomic hit targets;
- tablet/mobile use vertical scrolling when required.

### Final video-card visual design

Authoritative final rules:

- no full-card vignette;
- no lower black gradient or full-width control strip;
- normal video brightness;
- `aspect-ratio: 16 / 9`;
- video uses `object-fit: cover`;
- participant label is a compact single line in the upper-right corner;
- only a small local translucent background exists behind the label;
- connected state is shown by a small green dot;
- no permanent “Connected to campaign room” pill;
- no Leave button overlays the video;
- Leave is located in the compact header;
- local camera/microphone controls are in the lower-left corner;
- visible control circle: approximately 36×36 px;
- icon: approximately 20×20 px;
- accessible hit target: 44×44 px;
- disabled camera/microphone state uses only a crossed-out icon, with no color or size change;
- toolbar itself is transparent.

Participant label priority:

1. GM: localized `Game Master` / `Мастер игры`;
2. player: selected character compatible with the campaign game system;
3. if no compatible character is selected: site `display_name` or `username`;
4. final safe localized player fallback.

Never display email, UUID, LiveKit identity, provider identity, or a character from an incompatible game system.

The user inspected the final authenticated Production card with a real camera and confirmed: **“Теперь выглядит нормально.”**

---

## 9. CoC Campaign Capability Contract

Current Call of Cthulhu scope:

- a CoC campaign shell can be created;
- the campaign overview and Game Room work;
- video service is shared across campaign systems;
- CoC character creation remains planned;
- CoC-specific dice, Keeper tools, Game Hub features, and character sheets remain planned;
- VtM character creation remains VtM-only;
- a VtM character cannot be linked to a CoC campaign;
- the compatibility restriction is enforced by both application behavior and the existing PostgreSQL trigger.

Do not solve missing CoC character creation by weakening compatibility or displaying a VtM character.

---

## 10. Human Production Acceptance

Final tested Game Room:

```text
https://ttrpg.fans/ru/campaigns/{campaignId}/game-room
```

Repository note: the concrete Production campaign identifier was redacted as `{campaignId}`; the route structure and acceptance evidence are otherwise unchanged.

Acceptance result:

- test executed in Production with real users and real media;
- user completed the test without Codex monitoring;
- user reported that everything was working correctly;
- no blocking audio, video, interface, or stability problem was reported;
- user explicitly accepted the stage as successful for the present scope.

Evidence boundary:

- this is a valid human functional acceptance;
- there is no automated session timeline;
- there are no captured packet-loss, latency, jitter, reconnect, or per-participant quality statistics;
- audio and video were not recorded;
- no later retrospective claim should invent unavailable metrics.

Stage decision:

```text
CURRENT CAMPAIGN VIDEO / GAME ROOM SCOPE: PASS
PRODUCTION HUMAN ACCEPTANCE: PASS
ADDITIONAL RETEST BEFORE NEXT FEATURE: NOT REQUIRED
```

---

## 11. Completed Verification Summary

Across the releases, the following gates passed where relevant:

- campaign-video tests (latest reported: 38/38);
- campaigns tests (latest reported: 21/21);
- site URL tests;
- dice regression tests during the main rollout sequence;
- TypeScript;
- ESLint;
- `git diff --check`;
- Production builds;
- GitHub CI;
- Vercel Preview;
- mergeability/review-thread checks;
- EN/RU anonymous routing and login redirects;
- Production runtime error/fatal scans;
- responsive browser geometry;
- authenticated human video-card inspection;
- final group human media test.

Do not rerun this entire matrix for a small unrelated change. Choose tests based on the actual change surface.

---

## 12. Deferred Ideas and Known Non-Blocking Limitations

### Client quality telemetry

Preserved future idea:

- collect LiveKit `ConnectionQualityChanged` events;
- collect reconnect/disconnect transitions;
- collect track subscription failures;
- optionally correlate participant-reported timestamps with client and server metadata;
- produce post-session quality reports without recording audio or video.

This telemetry is **PLANNED / NON-BLOCKING**. It is not required to accept the current stage.

### Planned Game Room tools

The following remain planned/inactive:

- Dice Roller;
- Handouts;
- Participants panel;
- Quick Notes;
- Session Context;
- Characters;
- NPCs;
- Selected Handouts;
- active Display/image presentation workflow.

Do not add fake interactions or placeholder APIs. Activate each tool only as a separately specified feature.

### Scale and observability

The current architecture passed the accepted small-group test. Public-scale capacity, automated quality telemetry, operational dashboards, alerting, and load testing remain separate future work. Do not interpret this acceptance as proof of unlimited public concurrency.

---

## 13. Residual Resources and Optional Cleanup

No cleanup below is required for functionality. Do not delete anything without explicit user authorization.

### Test Supabase project

Last known test project:

```text
name/ref: ttrpg-website-m4e-test / sijgmybepesinijyspjm
```

It was used for Preview validation and contained the expected eight migrations. Its current retention/deletion status was not rechecked at chat closure.

### Historical branch-scoped Vercel variables

Five encrypted Preview variables were created for the historical branch:

```text
preview/m4e-stage1-campaign-video
```

The remote branch was later deleted. Whether those orphaned branch-scoped variables still exist was not rechecked at closure. They can be audited and removed in a dedicated cleanup task, but only after confirming the exact scope and that no retained Preview depends on them.

### Preview deployments

Historical Preview deployments may remain in Vercel history. This is normal and does not affect Production. Do not delete them as routine cleanup without an explicit reason.

### Local worktrees and branches

Multiple isolated worktrees and local feature branches were intentionally preserved after releases. They are not Production resources. Before any cleanup:

1. run `git worktree list --porcelain`;
2. verify every worktree HEAD/status;
3. confirm no uncommitted user work exists;
4. remove only explicitly approved paths/branches.

The protected original worktree was last reported as:

```text
C:\Projects\ttrpg-website
HEAD: ab981a70e70ad1d14e63e12005130b28337d865b
state: protected dirty spike worktree with 14 preserved uncommitted entries
```

Do not reset, clean, switch, delete, or use this worktree for new release implementation.

### Production test campaign

The accepted test campaign remains Production data. It should remain unless the user separately requests deletion and the exact campaign/data consequences are reviewed.

---

## 14. Safe Starting Point for Future Work

For any new implementation:

1. `git fetch origin --prune` from a safe repository context.
2. Resolve actual current `origin/main`.
3. Confirm it descends from `b033b93b1993561cbdf349987aa37aaf83574108` or inspect intervening commits.
4. Create a new isolated worktree from current `origin/main`.
5. Keep all existing worktrees read-only until their status is recorded.
6. Limit changes and tests to the requested feature.
7. Use a single PR and normal protected merge flow.
8. Let Git integration create the Production deployment automatically.

Do not require the user to manually repeat work that Codex can safely perform.

---

## 15. Closure Checklist

| Item | Status |
|---|---|
| Campaign video foundation in Production | PASS |
| Production database migration/backup | PASS |
| LiveKit Production configuration | PASS |
| CoC campaign shell | PASS for current scope |
| Dedicated Game Room | PASS |
| Responsive FullHD/QHD/4K/mobile layout | PASS |
| Final video-card UI | PASS |
| Authenticated Production visual check | PASS |
| Human group media test | PASS |
| Quantitative Codex session monitoring | NOT RUN / not required for acceptance |
| Runtime errors after final release | none observed during release checks |
| Recording/egress | not used |
| Required cleanup before closure | none |
| Deferred telemetry | documented, non-blocking |

---

## 16. Final Stage Decision

The current campaign-video and Game Room stage is formally closed.

```text
STATUS: COMPLETE / PASS
PRODUCTION: ACTIVE
USER ACCEPTANCE: CONFIRMED
BLOCKERS: NONE
MANDATORY FOLLOW-UP: NONE
```

The project may proceed to the next independently defined product stage.
