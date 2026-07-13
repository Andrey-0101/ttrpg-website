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
- loading, empty, retry, unavailable, and mutation states;
- Vercel production deployment.

Not yet implemented:

- personal or shared dice tools;
- persisted campaign dice history or realtime dice feed;
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
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

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
- [`docs/handoffs/H006_CURRENT_HANDOFF.md`](docs/handoffs/H006_CURRENT_HANDOFF.md).

## Current snapshot

This documentation synchronization was prepared against:

```text
main
cb378c18fc3f07ad6072f27508918ac53784e1b5
```

`cb378c1` includes PR #13, `Add campaign management`, and the earlier documentation synchronization merged by PR #14. The current H006 follow-up is prepared against that commit and is not part of it.

Character Friend Alpha and Campaign Foundation are complete. Milestone 4A is active, beginning with the typed VtM V5 personal dice request/result contract and pure deterministic evaluator.

If the repository advances, inspect the newer code, migrations, generated types, and deployment before treating this snapshot as current.

## Project direction

The agreed delivery strategy is:

1. maintain the architecture and documentation baseline;
2. keep the VtM character and campaign workflows stable;
3. implement the typed VtM V5 personal dice request/result contract and pure deterministic evaluator, then build the personal roller;
4. add server-authoritative persisted campaign rolls and a realtime feed;
5. run a managed-video provider comparison and technical spike;
6. add the minimal private campaign video room;
7. assemble the remaining friend-only campaign workspace;
8. complete the visual identity;
9. build the VtM Game Hub;
10. complete public-readiness work;
11. expand to Call of Cthulhu 7e.

The first evaluator sub-slice excludes UI, random generation, database persistence, migrations, Realtime, campaign integration, and video.

This is an unofficial fan-made software project and is not presented as an official product of any tabletop game publisher.
