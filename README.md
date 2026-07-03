# TTRPG Hub

TTRPG Hub is a bilingual web application for managing tabletop role-playing game characters and, in later milestones, running private campaigns with integrated game tools.

The current production version focuses on **Vampire: The Masquerade Fifth Edition (VtM V5)**. It provides authenticated character management, a complete two-page character sheet, private portraits, English and Russian interfaces, and responsive desktop, tablet, and mobile layouts.

> Project status: private friend-alpha development. The repository is not yet prepared for unrestricted public use.

## Current production scope

Implemented:

- English and Russian locale-prefixed routes
- Supabase authentication and user profiles
- Owner-only character storage
- Complete VtM V5 character sheet with `schemaVersion: 3`
- View and edit modes with explicit saving
- Desktop A4-oriented and mobile responsive layouts
- Private character portraits in Supabase Storage
- Character summary cards
- Local draft and active-page restoration within the browser tab
- Vercel production deployment

Not yet implemented:

- Campaigns, memberships, roles, or invitations
- Shared dice-roll history
- Video rooms
- Handouts, NPCs, or session records
- Independent character-sheet language
- Print/PDF export
- Public character sharing
- Call of Cthulhu 7e support
- Public-readiness security, monitoring, legal, and operational work

## Technology

- Next.js 16.2.9 App Router
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- `next-intl`
- Supabase PostgreSQL, Auth, Row Level Security, and Storage
- Vercel
- GitHub

## Repository instructions

Before changing Next.js code, read `AGENTS.md`. The project uses Next.js 16 and requires consulting the relevant local framework documentation under `node_modules/next/dist/docs/`.

Do not:

- expose environment values or secrets;
- show raw backend errors to users;
- invent database objects that are not represented by migrations and generated types;
- edit an already applied migration;
- change persisted VtM data without passing it through the current normalizer;
- assume that `campaign` or `public` visibility currently grants shared access.

## Local development

Requirements:

- Node.js and npm
- A Supabase project configured for this application
- Required environment variables in `.env.local`

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
npm run lint
git diff --check
```

## Documentation

Start with:

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- [`docs/README.md`](docs/README.md)
- [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)
- [`docs/architecture/DATABASE.md`](docs/architecture/DATABASE.md)
- [`docs/architecture/CHARACTER_SHEETS.md`](docs/architecture/CHARACTER_SHEETS.md)
- [`docs/product/ROADMAP.md`](docs/product/ROADMAP.md)
- [`docs/product/SITE_MAP.md`](docs/product/SITE_MAP.md)
- [`docs/decisions/`](docs/decisions/)

## Current snapshot

The initial architecture-baseline document set was prepared against:

```text
main
e2a412bd74af0971cea7bfdf28e42cfa6100e7a2
```

Update `PROJECT_CONTEXT.md` and the current handoff whenever the documented repository snapshot changes materially.

## Project direction

The agreed delivery strategy is:

1. establish the architecture and documentation baseline;
2. make the VtM character experience usable by a small private group;
3. establish the minimum campaign foundation;
4. add VtM dice tools and campaign-gated video rooms;
5. assemble a friend-only campaign workspace;
6. complete the visual identity;
7. build the VtM game hub;
8. complete public-readiness security and operational work;
9. expand to Call of Cthulhu 7e.

This is an unofficial fan-made software project and is not presented as an official product of any tabletop game publisher.
