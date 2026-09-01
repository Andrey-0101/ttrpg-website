# TTRPG Hub

TTRPG Hub is a bilingual web application for managing tabletop role-playing game characters and private campaigns.

The current production scope is focused on **Vampire: The Masquerade Fifth Edition (VtM V5)**. It includes authenticated character management, a complete responsive character sheet, private portraits, a private campaign workspace, invitations, membership controls, campaign character sharing, and English/Russian interfaces.

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
- Private and Campaign character visibility;
- My Campaigns and campaign creation;
- exactly one immutable Game Master per campaign;
- single-use, seven-day Player invitations with revocation;
- campaign member listing, Player departure, and GM removal;
- campaign character linking and shared read-only sheets;
- campaign editing, completion, and deletion;
- campaign creation for Vampire: The Masquerade V5 and a system-neutral Call of Cthulhu 7th Edition campaign shell;
- public VtM V5 and system-neutral Custom Dice Pool rollers;
- up to five saved Custom Dice Pool presets for registered users;
- private personal roll history for registered users;
- a twelve-system planned catalogue across Games, Dice Rollers, character creation, and campaign creation;
- campaign-authorized LiveKit video for one GM plus up to six Players;
- a dedicated responsive Campaign Game Room at `/{locale}/campaigns/{campaignId}/game-room`;
- loading, empty, retry, unavailable, and mutation states;
- Vercel production deployment at `https://ttrpg.fans`.

Not yet implemented:

- shared campaign dice and Realtime dice feed;
- standalone Video Rooms;
- campaign video moderation, image presentation, and the remaining Game Room workspace tools;
- handouts, NPCs, sessions, or campaign notes;
- independent character-sheet language;
- print/PDF export;
- public character sharing;
- Call of Cthulhu 7e character sheets, dice, Game Hub, and Keeper tools;
- public-readiness security, monitoring, legal, and operational work.

## Technology

- Next.js 16.3.3 App Router;
- React 19.2.4;
- TypeScript;
- Tailwind CSS 4;
- `next-intl`;
- Supabase PostgreSQL, Auth, Row Level Security, Realtime-ready database infrastructure, and Storage;
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
- assume `public` character visibility grants public access;
- assume `campaign` visibility alone grants shared access without an active campaign assignment and campaign membership.

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
```

Copy `.env.example` to `.env.local` and add the local public Supabase values. Do not commit `.env.local`. Leave `NEXT_PUBLIC_SITE_URL` empty in local development and ordinary Preview environments so browser-generated links remain on the active browser origin. Production Vercel configures `NEXT_PUBLIC_SITE_URL` for the canonical public origin. Authentication callbacks from arbitrary Preview deployments are not currently enabled; they require a separately approved, account-scoped Supabase redirect wildcard.

## Production domain

- Canonical production domain: `https://ttrpg.fans`.
- `https://www.ttrpg.fans` permanently redirects to the apex domain.
- Vercel `*.vercel.app` URLs remain technical deployment addresses and are not the canonical public domain.

The external production configuration was completed manually outside this repository and manually verified. In Vercel, both domains are attached to the production project, TLS succeeds for both, and both resolve to the localized production site. In hosted Supabase Auth, the Site URL is `https://ttrpg.fans`, production and local redirect allowlist entries are configured, and the canonical production callback is allowed. Arbitrary Vercel Preview authentication is not currently enabled. These hosted settings are not implemented by this Git branch.

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
- [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md);
- [`docs/product/CAMPAIGNS.md`](docs/product/CAMPAIGNS.md);
- [`docs/product/SITE_STRUCTURE_CURRENT.md`](docs/product/SITE_STRUCTURE_CURRENT.md);
- [`docs/decisions/`](docs/decisions/);
- [`docs/handoffs/H011_CURRENT_HANDOFF.md`](docs/handoffs/H011_CURRENT_HANDOFF.md), the current authoritative handoff. H001–H010 are historical records and cannot override current code, migrations, infrastructure evidence, or H011; H009 remains the detailed release record for the completed campaign-video and Game Room stage.

## Current snapshot

Current production state:

```text
main
609b6d9ec972bc842bfc8de4e4080eecdb10d4c8
```

PRs #28 through #34 are merged and accepted in Production. They delivered the campaign-video foundation and LiveKit rollout, CoC campaign shell, campaign-creation fix, dedicated Game Room, responsive seven-slot composition, and final video-card UX. The current verified deployment is `READY`. Its canonical production origin is `https://ttrpg.fans`, with `https://www.ttrpg.fans` permanently redirecting to the apex domain.

Character Friend Alpha, Campaign Foundation, Phase 4A personal dice and personal persistence, the planned game-system catalogue, the CoC campaign shell, campaign-authorized LiveKit video, and the responsive dedicated Game Room are implemented. The last Production human group test passed with one GM and four Players. Quantitative packet-loss, latency, jitter, and connection-quality telemetry was not collected; no additional media/layout/human acceptance retest is currently required. Standalone Video Rooms and shared campaign dice remain unimplemented; the non-video Game Room tools remain visibly planned and inactive.

If the repository advances, inspect the newer code, migrations, generated types, and deployment before treating this snapshot as current.

## Project direction

The agreed delivery strategy is:

1. maintain the architecture and documentation baseline;
2. keep the VtM character and campaign workflows stable;
3. keep the completed personal dice tools and planned system catalogue stable;
4. define standalone Video Rooms architecture and security, compare managed providers, and run a disposable spike;
5. implement permanent standalone Video Rooms around a reusable video core;
6. define the Campaign Collaboration Contract;
7. add server-authoritative shared campaign dice and a Realtime feed;
8. integrate the reusable video core with campaign-derived authorization;
9. assemble the remaining friend-only campaign workspace;
10. complete the visual identity;
11. build the VtM Game Hub;
12. complete public-readiness work;
13. expand the delivered Call of Cthulhu 7e campaign shell with character sheets, dice, the Game Hub, and Keeper tools.

LiveKit is accepted for the current campaign Game Room. This does not settle the future standalone Video Rooms product, which remains a separate planned capability. Personal history remains private and non-authoritative; Phase 4D shared campaign dice must keep it separate from server-authoritative campaign roll history. The next product stage has not yet been selected.

This is an unofficial fan-made software project and is not presented as an official product of any tabletop game publisher.
