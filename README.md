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
- public VtM V5 and system-neutral Custom Dice Pool rollers;
- up to five saved Custom Dice Pool presets for registered users;
- private personal roll history for registered users;
- a twelve-system planned catalogue across Games, Dice Rollers, character creation, and campaign creation;
- loading, empty, retry, unavailable, and mutation states;
- Vercel production deployment at `https://ttrpg.fans`.

Not yet implemented:

- shared campaign dice and Realtime dice feed;
- video rooms;
- handouts, NPCs, sessions, or campaign notes;
- independent character-sheet language;
- print/PDF export;
- public character sharing;
- Call of Cthulhu 7e support;
- public-readiness security, monitoring, legal, and operational work.

## Technology

- Next.js 16.2.9 App Router;
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
```

Copy `.env.example` to `.env.local` and add the local public Supabase values. Do not commit `.env.local`. Leave `NEXT_PUBLIC_SITE_URL` empty in local development and ordinary Preview environments so browser-generated links remain on the active browser origin. Production Vercel uses `NEXT_PUBLIC_SITE_URL=https://ttrpg.fans`. Authentication callbacks from arbitrary Preview deployments are not currently enabled; they require a separately approved, account-scoped Supabase redirect wildcard.

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
- [`docs/handoffs/H007_CURRENT_HANDOFF.md`](docs/handoffs/H007_CURRENT_HANDOFF.md), the most recent completed handoff. A new current handoff will be created separately after this project chat closes.

## Current snapshot

This documentation synchronization was prepared against:

```text
main
22736bf697a8345e19e92626a8f441f35db4b3c7
```

`22736bf` is the production catalogue release, `Add planned game-system catalogue (#25)`. Its release verification passed lint, build, deployment checks, and 156 catalogue/dice tests.

Release-candidate verification checkpoint, 2026-08-01: the current branch is `chore/canonical-domain-docs-sync`, based on `22736bf`. Its canonical-domain code and documentation changes are not yet merged, deployed, or production-verified. Current validation passed 156 dice/catalogue tests, 13 site-URL tests, 169 total automated tests, and the production build with 36/36 static pages generated.

Character Friend Alpha, Campaign Foundation, Phase 4A personal dice, personal dice persistence, and the planned game-system catalogue are complete. Phase 4B shared campaign dice starts only after this canonical-domain/documentation slice is merged, deployed, and production-verified. Only then do the release-candidate changes become production state.

If the repository advances, inspect the newer code, migrations, generated types, and deployment before treating this snapshot as current.

## Project direction

The agreed delivery strategy is:

1. maintain the architecture and documentation baseline;
2. keep the VtM character and campaign workflows stable;
3. keep the completed personal dice tools and planned system catalogue stable;
4. add server-authoritative persisted campaign rolls and a Realtime feed;
5. run a managed-video provider comparison and technical spike;
6. add the minimal private campaign video room;
7. assemble the remaining friend-only campaign workspace;
8. complete the visual identity;
9. build the VtM Game Hub;
10. complete public-readiness work;
11. expand to Call of Cthulhu 7e.

Personal history remains private and non-authoritative. Phase 4B must keep it separate from server-authoritative campaign roll history.

This is an unofficial fan-made software project and is not presented as an official product of any tabletop game publisher.
