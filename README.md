# TTRPG Hub

TTRPG Hub is a bilingual web application for managing tabletop role-playing game characters and private campaigns.

Production supports **Vampire: The Masquerade Fifth Edition (VtM V5)** and **Call of Cthulhu 7e** characters, personal and Campaign Dice, private campaigns, Game Sessions, Journal, Gallery, linked characters, Personal Campaign Notes, and English/Russian interfaces.

> Project status: private friend-alpha development. The repository is not yet prepared for unrestricted public use.

## Current production scope

Implemented:

- English and Russian locale-prefixed routes;
- Supabase authentication and user profiles;
- personal Dashboard;
- complete VtM V5 character sheet with `schemaVersion: 3`;
- explicit create, save, edit, clear, delete, and unsaved-change protection;
- desktop A4-oriented and mobile-responsive character layouts;
- private character portraits in Supabase Storage;
- owner-private characters with assignment-derived read-only access for the exact eligible campaign GM; no visibility selector and no other-Player sheet access;
- My Campaigns and campaign creation;
- exactly one immutable Game Master per campaign;
- single-use, seven-day Player invitations with revocation;
- campaign member listing, Player departure, and GM removal;
- campaign character linking and shared read-only sheets;
- campaign editing, completion, and deletion;
- campaign creation and responsive character sheets for VtM V5 and CoC 7e;
- public VtM V5, CoC 7e, Custom Dice Pool, and standalone Fair Turn Order Dice rollers;
- up to five saved Custom Dice Pool presets for registered users;
- private personal roll history for registered users;
- a twelve-system planned catalogue across Games, Dice Rollers, character creation, and campaign creation;
- campaign-authorized LiveKit video for one GM plus up to six Players;
- a dedicated responsive Campaign Game Room at `/{locale}/campaigns/{campaignId}/game-room`;
- independent GM-controlled Game Sessions, session-scoped Realtime Journal, and server-authoritative VtM/CoC Campaign Dice;
- embedded owner-editable / exact-GM-read-only linked characters and owner-private Personal Campaign Notes with search and session metadata;
- an image-only Campaign Gallery at `/{locale}/campaigns/{campaignId}/gallery`, with fixed Handouts, NPC, Maps & Plans, and Other sections, private signed delivery, and GM-controlled Player visibility;
- GM-controlled Game Room presentation of Campaign Gallery images, with Share / Stop Share, synchronized Expand / Collapse, and responsive participant layouts;
- GM Computer Audio Sharing (deployed; real multi-user capture/isolation/echo acceptance deferred to an actual gaming session);
- protected global Developer role and technical connection-statistics diagnostics, private bounded artifacts, ZIP export, and autonomous cleanup (deployed; multi-user acceptance pending);
- loading, empty, retry, unavailable, and mutation states;
- Vercel production deployment at `https://ttrpg.fans`.

Not yet implemented in Production:

- shared Notes, rich text, and Global Personal Notes (IDEA-008 deferred);
- general Handouts, NPCs, Sessions, Chronicle records, or clues;
- independent character-sheet language;
- print/PDF export;
- public character sharing;
- CoC, Delta Green, and Vampire Game System Hubs;
- public-readiness security, monitoring, legal, and operational work.

## Phase 4D1 UX follow-up

Phase 4D1 Call of Cthulhu 7e personal dice is deployed in Production. It provides the public localized route `/{locale}/games/call-of-cthulhu/tools/dice`, catalogue integration, Percentile and Other Dice tools, and best-effort authenticated personal-history support. Guest rolls remain local and non-persistent.

The deployed Phase 4D1 UX follow-up adds safe contextual Back destinations, roller-scoped history and clearing, optional Roll Labels, and live CoC Target bands. VtM and Custom retain six rows each; CoC retains six rows total across both modes. The known deferred CoC display issue is current + four previous instead of current + five previous; its root cause remains unverified. Separate Phase 4D2 Campaign Dice is deployed and accepted, with server-authoritative exact-session Journal persistence rather than personal history.

## Technology

- Next.js 16.3.3 App Router;
- React 19.2.4;
- TypeScript;
- Tailwind CSS 4;
- `next-intl`;
- Supabase PostgreSQL, Auth, Row Level Security, Realtime, Storage, pg_cron, pg_net, and Vault;
- Vercel;
- GitHub.

## Repository instructions

Before changing Next.js code, read `AGENTS.md`. This project uses Next.js 16 and requires consulting the relevant local framework documentation under `node_modules/next/dist/docs/`.

Do not:

- expose environment values or secrets;
- show raw backend errors to users;
- invent database objects that are not represented by migrations and generated types;
- edit an already applied migration;
- change persisted VtM data without passing it through the current normalizer;
- treat UI checks as an authorization boundary;
- restore the removed character visibility model;
- grant another Player access to an owner's sheet or portrait; only an eligible active assignment grants the exact campaign GM read-only access.

## Local development

Requirements:

- Node.js and npm;
- a Supabase project configured for this application;
- required environment variables in `.env.local`.

Environment variable names used by the application:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
SUPABASE_SECRET_KEY
DIAGNOSTIC_CLEANUP_SECRET
```

Copy `.env.example` to `.env.local` and configure the intended local environment; do not copy Production secrets or commit `.env.local`. `SUPABASE_SECRET_KEY` and `DIAGNOSTIC_CLEANUP_SECRET` are server-only. The latter matches the dedicated Vault cleanup credential in Production. Leave `NEXT_PUBLIC_SITE_URL` empty in local development and ordinary Preview environments so browser-generated links remain on the active browser origin. Production uses the canonical public origin. Arbitrary Preview authentication is not enabled. See [Developer diagnostics](docs/architecture/DEVELOPER_DIAGNOSTICS.md) for the deployed operational boundary.

## Production domain

- Canonical production domain: `https://ttrpg.fans`.
- `https://www.ttrpg.fans` permanently redirects to the apex domain.
- Vercel `*.vercel.app` URLs remain technical deployment addresses and are not the canonical public domain.
- Vercel Function compute is pinned to Tokyo (`hnd1`) by `vercel.json`.

The remaining hosted production configuration was completed manually outside this repository and manually verified. In Vercel, both domains are attached to the production project, TLS succeeds for both, and both resolve to the localized production site. In hosted Supabase Auth, the Site URL is `https://ttrpg.fans`, production and local redirect allowlist entries are configured, and the canonical production callback is allowed. Arbitrary Vercel Preview authentication is not currently enabled. These hosted settings remain external; only the Vercel Function region is persisted by repository configuration.

Install and run:

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run build
git diff --check
```

Use the repository's actual scripts from `package.json`; do not assume an unavailable lint or test command exists.

## Documentation

Start with:

- [`docs/README.md`](docs/README.md);
- [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md);
- [`docs/architecture/DATABASE.md`](docs/architecture/DATABASE.md);
- [`docs/architecture/SECURITY.md`](docs/architecture/SECURITY.md);
- [`docs/architecture/CHARACTER_SHEETS.md`](docs/architecture/CHARACTER_SHEETS.md);
- [`docs/architecture/DEVELOPER_DIAGNOSTICS.md`](docs/architecture/DEVELOPER_DIAGNOSTICS.md);
- [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md);
- [`docs/product/CAMPAIGNS.md`](docs/product/CAMPAIGNS.md);
- [`docs/product/SITE_STRUCTURE_CURRENT.md`](docs/product/SITE_STRUCTURE_CURRENT.md);
- [`docs/decisions/`](docs/decisions/);
- [`docs/handoffs/H014_CURRENT_HANDOFF.md`](docs/handoffs/H014_CURRENT_HANDOFF.md), the latest chronological handoff, published unchanged from its supplied content. Its snapshot and publication-status statements describe authoring time; current code and later verified releases override historical snapshot claims. H001–H013 remain historical continuity records. ChatGPT authors a new handoff only on the Product Owner's explicit request at conversation closure.

## Current snapshot

Application release baseline after Developer Diagnostics PR #74 (documentation-only commits may follow):

```text
main
b5f20bfc2b8c025644375ae41e687d692d899c83
```

The verified application-release deployment is `dpl_2SU3Zx16EXc6ss9SCNWSuL1kBk6c` (READY on `https://ttrpg.fans`). This is the pre-documentation-sync release record, not a claim that later documentation commits cannot trigger automatic deployments. [PR #73](https://github.com/Andrey-0101/ttrpg-website/pull/73) delivered Developer Diagnostics; [PR #74](https://github.com/Andrey-0101/ttrpg-website/pull/74) fixed JSONB null/SQL NULL dispatch handling without exposing `owner_session_hash`. Both are merged and deployed.

Phase 4 is CLOSED / DEPLOYED / ACCEPTED, including Personal Campaign Notes and character-access maintenance. Game Room opens independently of LiveKit and Game Session with `Journal | Gallery | Dice | Characters | Notes`; Journal is the root Display. Developer Diagnostics is DEPLOYED / MANUAL MULTI-USER ACCEPTANCE PENDING. The verified Product Owner has the protected role and successfully opened the panel, recorded one GM-only run, and exported a ZIP inspected in ChatGPT; structured data and Stop/export succeeded with no reported collection errors. This is not distributed acceptance. GM Computer Audio Sharing remains IMPLEMENTED / DEPLOYED / MANUAL PRODUCTION ACCEPTANCE PENDING. Further real-group diagnostics/audio acceptance is deferred until a gaming session and does not block Phase 5A planning. Historical video tests collected no quantitative network telemetry; new diagnostics does not retroactively provide it.

If the repository advances, inspect the newer code, migrations, generated types, and deployment before treating this snapshot as current.

## Project direction

The agreed delivery strategy is:

1. completed Milestones 1–3: architecture, character friend-alpha, and Campaign Foundation;
2. completed Phase 4 Core Play & Campaign Tools and separately deployed pre-Phase-5 add-ons;
3. Phase 5A Campaign & Game Room UX/UI Refinement, then Phase 5B Site-wide UI Technical Refinement — both PLANNED / NOT STARTED, with no new product capabilities;
4. define and apply Phase 6 Visual Identity after the technical UI baseline is stable;
5. add Delta Green system parity in Phase 7;
6. build CoC, Delta Green, and Vampire system hubs in that Phase 8 order;
7. complete Phase 9 Public Readiness.

LiveKit is accepted only for the current campaign Game Room. Standalone Video Rooms remain uncommitted. Personal history is private and non-authoritative, separate from the deployed server-authoritative Campaign Dice Journal.

The current implementation targets Vampire: The Masquerade V5. White Wolf announced V6 in July 2026 while it remains in alpha, with materially different mechanics and no announced release date. A possible migration or replacement before public release remains undecided; see the roadmap for the approved planning note.

This is an unofficial fan-made software project and is not presented as an official product of any tabletop game publisher.
