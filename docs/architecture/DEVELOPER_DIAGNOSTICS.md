# Developer Game Room diagnostics

## Status and release boundary

Feature-branch implementation based on `main` commit `a51ea6819e1352079e0d6815787f4f629ab5fc15`. Local automated verification is recorded below. Production rollout and human acceptance are NOT complete. Do not merge/deploy, apply Production migrations, enable Production extensions/Cron, configure Production Vault/Vercel secrets, or grant a Production Developer role without the separate rollout approval.

Phase 4 remains CLOSED / DEPLOYED / ACCEPTED. GM Computer Audio Sharing remains IMPLEMENTED / DEPLOYED / MANUAL PRODUCTION ACCEPTANCE PENDING. Phase 5A remains PLANNED / NOT STARTED.

The only canonical diagnostic artifact TTL is **12 hours after server-side run completion**. Earlier proposals are superseded, not an alternative configuration.

## Role and authorization

`system_user_roles` stores only `developer`, with grant/revocation timestamps and optional administrator IDs. Capabilities are static code, not a general RBAC system. There is no role-management UI or seeded grant. Authenticated users can read only their own role; they cannot insert/update/delete roles. Campaign GM and Developer are separate properties.

Every diagnostic API verifies Supabase `getUser()` plus matching verified claims/session ID. The service-only dispatch RPC also checks the actual live `auth.sessions` row. Actor/session IDs never come from request JSON or `user_metadata`. Start requires current Developer AND current GM of an active campaign. Stop/export/index/download/user-triggered cleanup require current Developer, run ownership and current campaign GM context. Export of a completed-campaign run is allowed only within its original TTL. Collectors require current campaign participation, actor-bound segment, epoch, unexpired lease and an open server collection window. Normal cookie-authenticated POSTs also require same-origin requests. Removing membership or revoking access denies subsequent requests; expired/revoked Auth sessions cannot be used to keep a run alive.

The wrench near the account name is only a discoverability control. Hiding it is not authorization. Reusable server role checks fail closed if the schema is not installed. The English-only typed strings live in `lib/developer/english.ts`, outside next-intl and EN/RU message parity. There is no Developer navigation item, dashboard heading, environment badge or visible build SHA.

### Administrator procedure (future approved environment only)

First verify the target Supabase project and the exact real Auth user ID. Use trusted Supabase administration, never browser requests. Replace placeholders before execution; these examples grant nobody automatically.

```sql
-- Inspect; no email matching or hard-coded allowlist exists in application code.
select user_id, role, granted_at, granted_by, revoked_at, revoked_by
from public.system_user_roles where user_id = '<USER_UUID>'::uuid;

-- Grant/regrant manually. Optional granted_by/revoked_by may record the administrator.
insert into public.system_user_roles(user_id, role)
values ('<USER_UUID>'::uuid, 'developer')
on conflict (user_id, role) do update
set granted_at = clock_timestamp(), revoked_at = null, revoked_by = null;

-- Revoke, retaining the role record. This stops an active owner's run.
update public.system_user_roles set revoked_at = clock_timestamp()
where user_id = '<USER_UUID>'::uuid and role = 'developer' and revoked_at is null;
```

No Production grant/revoke has been performed by this implementation task.

## Control plane and lifecycle

The root-layout coordinator survives client navigation. Game Room mounts a bridge, not a new LiveKit Room. Run records are canonical; Supabase Realtime invalidates local control state, then an authorized HTTP reread reconciles it. Mount/late join/reload, subscription establishment, LiveKit reconnect, focus/online and membership signals trigger rereads. A 15-second fallback/owner-heartbeat loop reconciles missed signals. Diagnostics is independent of Game Session and video Join/Leave; it never enables data publishing or changes token permissions.

One `recording`/`stopping` run per campaign AND Developer is enforced by partial unique indexes plus transactional locking. Start/Stop are idempotent. An owner abandonment lease is 180 seconds; role revocation, campaign inactivity, invalid owner Auth session or quota exhaustion also initiate server finalization. The owner Auth-session ID is retained only as a SHA-256 hash internally, never in an export/API result.

Stop freezes a server-owned **30-second hard collection deadline**, unchanged by retries. Actual joined collectors flush bounded final chunks and acknowledge their cursor. Completion can happen early when no joined collector is still collecting; missing/fenced/error/no-progress collectors produce a partial artifact. At the deadline late chunks are refused. Server reconciliation runs each minute and on authorized operations; completion timestamp is the actual server transition, not a fabricated exact timer instant. Empty/no-accepted-data runs are partial. X and owner Game Room exit use the same Stop/export path; errors leave retry available. Logout/role loss cannot bypass fresh export authorization. A reload starts a separate epoch and fences older collectors; an older tab cannot silently reclaim a newer tab's segment. Our own expired lease can resume in a new epoch after an outage.

The compact panel shows campaign name, Developer-local Now/Started timestamps (seconds), elapsed HH:MM:SS without a 24-hour wrap, registered Player count excluding GM, a separate GM line, stable `display_order` Player slots and profile display-name/username. It never uses character names or emails as diagnostic identity. Status is `○ / … / ✓ / !`: fresh validated progressing records/checkpoints, not an ACK, are required for `✓`; it is not a media-quality score. Foreground/background heartbeat thresholds are 45/120 seconds; starting grace is 30 seconds and checkpoint staleness is 120 seconds.

Players see only:

```text
Technical diagnostics active
Connection statistics only. No audio/video recording.
```

## Sampling and privacy

The existing LiveKit 2.21.0 Room is observed through public track `getRTCStatsReport()` and public Room events. No private peer-connection fields, second Room, recapture, DOM/console scraping or speedtest is used. Stats requests/ticks do not overlap; a slow/throttled tick becomes an explicit gap rather than an invented regular interval. Samples are targeted every 2 seconds; heartbeat every 15 seconds; checkpoints no later than approximately 60 seconds or earlier for bounded size. Initial checkpoint is attempted at approximately 10 seconds.

Categories: inbound/outbound RTP bytes/packets/loss/jitter, actual-interval bitrate, audio jitter-buffer/concealment, video frame/FPS/resolution/drop/keyframe/freeze/quality-limitation counters, publisher/subscriber SFU transport RTT/bandwidth/candidate type/protocol/state, and outbound SFU feedback. Transport-wide samples are deduplicated per tick, not reported as every track's peer RTT. Counters retain native units; derived rates are null on first/missing/reset/negative delta/large gaps. Missing raw fields are omitted or null, never zero. Codec/browser/track metadata is emitted once or on change, not every 2 seconds. No MOS score or claim of a good call is inferred.

Computer Audio instrumentation observes actual `window`/`monitor` before display video stops, quality target 128/192, start/stop/reconnect events and a site Stop versus observable track-ended/unknown termination. It cannot prove a native picker button's exact cause. Existing GM grants, own-audio safety, capture/echo constraints, publication source and media lifecycle remain unchanged.

Strict server schema rejects unknown keys/strings, invalid timing/sequence/numbers and oversized/decompression-bomb payloads. Before JSON parsing, nesting is limited to eight levels and raw strings to 512 characters; individual fields have narrower schema bounds. Forbidden data: media bytes/PCM, raw IPs/ports/candidates/SDP/TURN URLs, tokens/cookies/secrets, emails/user UUIDs, device IDs/labels, raw UA, arbitrary errors/stacks, screenshots/DOM/console, Gallery bytes and character/Notes/Journal/game payloads. SDK IDs remain only transient internal map keys; exported participant/track IDs are generated aliases. Campaign name/ID and actual Game Session transitions are allowed contextual metadata.

Time correlation stores UTC wall time, monotonic time, sequence, estimated server UTC and uncertainty. Three probes choose lowest RTT; resync approximately every five minutes/reconnect. This does NOT establish strict cross-client ordering. Client build metadata is frozen at build time; server build metadata is separate. Actual available Vercel commit/deployment/environment values are used; missing IDs are null, not guessed from domains or current time.

## Buffer, Storage and export

Small RAM batches become gzip chunks through native `CompressionStream`; IndexedDB retains a bounded unconfirmed outbox. Durable enqueue precedes removing a RAM prefix; ACK of the exact accepted sequence precedes deleting an outbox item. Upload reads one chunk at a time. New epochs never rebind old unconfirmed data; old fenced segments remain explicit partial metadata. Local failure/quota produces an explicit health/error state, not an unbounded queue or silent successful discard.

On collection/checkpoint, a bounded set of old local queues is reconciled against authorized server run state. Closed/inaccessible runs' unconfirmed queues are removed; uncertain network failures retain them. A closed browser cannot physically prune IndexedDB, so this happens on later client activity and never extends the server artifact TTL. Server-accepted chunks remain governed by registered Storage cleanup.

Dependencies: `fflate` 0.8.3 supplies streaming ZIP in the browser Worker; `fake-indexeddb` 6.2.5 is dev-only for deterministic IndexedDB transaction/reopen/quota tests. The latter does not prove native browser disk persistence after an OS crash and is not shipped as an application dependency.

Safety limits: local unconfirmed outbox **16 MiB**; run accepted + reserved compressed allocation **256 MiB**, enforced atomically; per chunk **256 KiB compressed / 1 MiB expanded / 2,048 records**. Upload reservations are actor/epoch/sequence/hash-bound, at most one new reservation/second; duplicate immutable uploads/ACKs are safe. At most 100 epochs per user/run bounds reload churn. Server IO is timeout-bounded. Storage is private `game-room-diagnostics`; there are NO authenticated browser upload/download policies. Server-generated registered paths are `RUN_UUID/SEGMENT_UUID/CHUNK_UUID.ndjson.gz`.

Export is paged/reauthorized per request, and the same-origin bundled Worker streams synchronous fflate ZIP entries from bounded chunks. No Vercel full-ZIP response, full raw-run array, CDN script or blob worker is used. Per-segment chunks are read in sequence. Output ZIP is bounded at 512 MiB; that is a defensive output ceiling, not an expected size or measured performance claim.

```text
manifest.json
README.txt
combined-events.ndjson
participants/<run-participant-alias>/<segment>/
  client.json
  connections.ndjson
  tracks.ndjson
  events.ndjson
  errors.ndjson
```

The manifest records schema version, safe campaign/run metadata, encountered Game Session IDs (initial context plus transitions), cadence, server/client build provenance, normalized client metadata, timing/units, segment epochs/roles/slots, missing participating clients, gap counts/completeness and compressed input size. Only clients that joined collection are awaited; registered nonparticipants do not block export. Recorded collection gaps make the exported artifact partial; their actual timeline remains in NDJSON rather than an invented duration. Combined records include alias+segment; they are not claimed to be globally ordered. File names use UTC start and generated run UUID, not user identity. Download initiation cannot prove the OS saved the file; the panel says so. ZIP failure preserves server data for retry within original TTL. Successful ZIP construction + initiated download triggers immediate cleanup attempt.

## Autonomous cleanup: approved design, NOT rolled out

Existing **pg_cron → pg_net → protected Next.js POST** `/api/internal/diagnostics/cleanup`, every **5 minutes** (up to 288 calls/day). No Edge Function, external scheduler or Vercel Cron. The Cron SQL calls a private function and contains no literal secret. At execution it reads Vault `diagnostic_cleanup_url` and `diagnostic_cleanup_secret`; missing configuration is a no-op. The matching Vercel server-only variable is `DIAGNOSTIC_CLEANUP_SECRET`: a dedicated random 32-byte base64url credential (43 characters), not a Supabase/Auth key, never `NEXT_PUBLIC_*`. Authorization uses constant-time comparison before any work. Ordinary authenticated users cannot call the autonomous handler/RPCs.

Cleanup claims at most 100 registered chunks with expiring claim tokens, skips concurrently claimed rows and has a soft work deadline plus bounded IO. Storage API `.remove()` happens before matching DB ACK. Failed Storage calls/ACKs leave the registry discoverable for retry; unknown paths are rejected. Missing objects are safe idempotent deletion. Registry rows are pruned in bounded batches only when every object is confirmed deleted (or there never were objects). Stale unaccepted reservations are also reconciled. No SQL DELETE of `storage.objects`, bucket listing, inferred path or unregistered-object sweep exists.

`expires_at = completed_at + 12 hours` never changes on retry/export. After it, normal export is denied. Expiry is access control, NOT a promise of physical deletion exactly at that boundary. Physical deletion occurs at the next successful autonomous cleanup pass; repeated failures/backlog can delay it. Immediate cleanup failures fall back to that same discoverable mechanism.

### pg_net trust boundary

Vault avoids embedding credentials in job SQL, but pg_net must temporarily queue plaintext HTTP headers. Supabase documents that trusted direct database LOGIN roles can read those queued headers and project `postgres` cannot override Supabase-owned PUBLIC grants. Do not promise REVOKE/RLS prevents this. Keep `net` out of exposed Data API schemas; maintain only trusted direct database LOGIN users and expose no generic SQL-execution RPC. Browser `anon`/`authenticated` roles have no direct database LOGIN. Preflight must confirm this boundary before future Production activation. See [Supabase queued-header guidance](https://supabase.com/docs/guides/troubleshooting/database-roles-can-read-request-headers-queued-by-pg_net-ad6357) and [managed pg_net grants](https://supabase.com/docs/guides/troubleshooting/revoking-access-to-pg_net-objects-has-no-effect-0bbc16).

### Future rollout requirements (separate approval mandatory)

1. Reconfirm exact reviewed PR SHA, Vercel project/environment and Production Supabase `ttrpg-website` / `nryzkqwcnbbneazaksgh`. Retain `ttrpg-website-m4e-test` / `sijgmybepesinijyspjm`; do not modify/delete/pause it for this task.
2. Verify `pg_cron`, available `pg_net`, Vault, trusted database LOGIN roles and non-exposure of `net`. Set the dedicated Vercel server-side credential through protected configuration without printing it. Do not store a value in files/Git/logs.
3. Apply the reviewed forward migrations only after rollout approval; verify RLS/grants/indexes/private bucket/publication/cron definitions and regenerated types. Cron remains inert until Vault URL/credential are provisioned.
4. Deploy the exact approved application SHA to Production, confirm READY and exact domain SHA. Then securely provision matching Vault credential and `https://ttrpg.fans/api/internal/diagnostics/cleanup` target. Check response status and registered cleanup convergence, not queued authorization headers. Grant Developer manually to an explicitly verified real user only with approval.
5. Perform real multi-user acceptance and later 3–6 hour measurements. Never create destructive Production fixtures/fake users. No cleanup path can touch character portraits, Gallery, Notes or unrelated Storage.

No step in this future rollout list was performed in Production here.

## Database delta

Local-only applied, immutable migrations:

- `20261007130732_developer_game_room_diagnostics.sql`: role, run/client/chunk registry, private bucket, service-only lifecycle/collection/cleanup RPCs, Realtime and reconciliation Cron.
- `20261007130739_diagnostic_autonomous_cleanup.sql`: pg_net, runtime Vault lookup and 5-minute protected POST schedule; absent Vault configuration no-op.
- `20261007132201_diagnostic_registry_hardening.sql`: cross-chunk sequence guard, idempotent final ACK, reload churn bound, ACK-before-registry-pruning sweep.
- `20261007133704_diagnostic_completion_guards.sql`: committed quota Stop and empty-run partial completeness.
- `20261007135836_diagnostic_role_audit_indexes.sql`: foreign-key indexes for optional administrator audit IDs.
- `20261007141821_diagnostic_control_visibility.sql`: column-level browser grants and publication limited to `id/campaign_id/state/revision`, excluding Auth-session provenance and internal registry fields.

Public objects: `system_user_roles`, `game_room_diagnostic_runs`, `game_room_diagnostic_clients`, `game_room_diagnostic_chunks`; `diagnostic_dispatch`, service-inaccessible internal dispatch, `diagnostic_cleanup_claim`, `diagnostic_cleanup_ack`, `diagnostic_cleanup_sweep`. Private helpers are not application-callable. Authenticated SELECT of own role and four contextual run invalidation fields does not grant internal run fields, registry/chunk/Storage access. Realtime publishes only those four control fields, not metric chunks or the owner Auth-session hash. Run campaign/owner FKs SET NULL preserve cleanup discoverability if source records disappear. See [column-level privileges](https://supabase.com/docs/guides/database/postgres/column-level-security) and [publication column lists](https://www.postgresql.org/docs/17/sql-alterpublication.html).

## Verification and manual acceptance

Local verification includes migration application, regenerated-type semantic comparison (no existing table/function contract change; current CLI adds `ComputedFields: never` markers), deterministic schema/privacy/metric/status/authorization/ZIP/coordinator tests and local Docker DB authorization/concurrency/lease/deadline/TTL/quota/registry tests. Existing targeted Game Room/LiveKit/Computer Audio regressions, TypeScript, lint, production-mode build and diff check are required for PR publication. Automated results do not prove native browser consent, multi-machine echo safety, long-call quality or Production cleanup operation.

Implementation verification (local, 2026-10-07):

- `npx --yes supabase@latest migration up --local`: all six diagnostic migrations applied; no remote database used.
- `node scripts/check-diagnostic-type-delta.mjs`: PASS, four added tables/five added functions; existing public contracts unchanged.
- `npm run test:diagnostics`: PASS, 19 tests including actual ZIP contents, role/session boundary, strict privacy schema, metrics, coordinator, IndexedDB transactions and cleanup.
- `npm run test:diagnostics:db`: PASS, 77 assertions/checks including concurrent Start/quota, RLS/column privileges, leases/epochs/deadline, 12-hour expiry, private Storage upload/download/delete and registry convergence. Local fixtures removed.
- `npm run test:campaign-video`: PASS, 107 tests across server/browser/Computer Audio/Game Room shell.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`: PASS; build compiles the same-origin Worker and 44 routes/pages. CSP unchanged.
- `git diff --check`: PASS before publication.

No real-browser multi-user/long-session acceptance, Production migrations/configuration, role grant or cleanup activation has been performed. Preview build readiness, if reported in the PR, is not functional acceptance against a migrated Preview database.

Manual acceptance after the separately approved rollout:

- ordinary GM/Player/outsider: no Developer capability; forged role/direct endpoints fail; revoke/logout denies control/export;
- Developer outside Game Room/other GM/inactive campaign: contextual empty/denied controls; active GM starts one run; duplicate clicks/tabs do not create parallel runs;
- existing/late Players, reload, focus/online, lost Realtime and LiveKit reconnect: collector discovery/reconciliation, separate epochs/fencing and no interrupted call;
- `○/…/✓/!` reflect validated progress, including background/stale/upload/IDB errors, not media quality;
- panel name/time/duration/slots and exact English Player indicator on EN and RU, with normal site localization unchanged;
- Stop/X/route exit use one export path, fixed 30-second window, early completion/partial offline client, denied late uploads and retry without expiry extension;
- ZIP opens; metadata/NDJSON/units/build identities/aliases/missing data are usable; excluded media/IP/email/device/game content is absent;
- immediate failed cleanup, expiry denial, later autonomous retry and complete DB/Storage convergence; no claim of exact boundary deletion;
- real 3–6 hour run: raw/compressed bytes per hour, ZIP size, outbox/queue maximum, CPU/memory, gaps and camera/microphone/computer-audio call impact. **NOT YET PERFORMED.**

Existing deferred items remain out of scope: CoC personal-history current + four previous (root cause unverified), disabled leaked-password protection, existing characters policy advisor warning and other historical advisor warnings. Dependency audit additionally reports advisories in existing Next.js/tooling dependencies; fflate adds no reported advisory. They are not fixed or silently accepted by this feature.
