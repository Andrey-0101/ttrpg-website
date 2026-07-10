# H005_CURRENT_HANDOFF.md

## 1. Document control

| Field | Value |
|---|---|
| Project | Web_Site_TTRPG / `ttrpg-website` |
| Handoff ID | H005 |
| Previous current handoff | `docs/handoffs/H004_CURRENT_HANDOFF.md` |
| Supersedes | H004 as current-state guidance; H001–H004 remain historical |
| Creation date | 2026-07-10 |
| Scope | Character Friend Alpha completion; Campaign Foundation schema, RLS, UI, invitations, members, character sharing, and management; documentation synchronization; preparation for VtM Realtime Tools |
| Repository | `https://github.com/Andrey-0101/ttrpg-website` |
| Synchronized branch snapshot | `main` |
| Exact synchronized commit | `a1c3a61381a2b7cddab9dd8fb620af56342209a9` |
| Latest synchronized commit | `a1c3a61 Merge pull request #13 from Andrey-0101/feature/campaign-management` |
| Production alias | `https://ttrpg-website-xi.vercel.app` |
| Current milestone | Milestone 4 — VtM Realtime Tools |
| Next implementation slice | VtM dice result contract and personal roller |
| Secrets included | None |

### Evidence note

The exact `main` and `origin/main` SHA above were supplied by command output after PR #13 merged.

The first post-merge build attempt failed in generated `.next/dev/types/routes.d.ts`. The prescribed recovery was:

1. stop every dev server;
2. delete `.next`;
3. run a clean production build;
4. inspect production;
5. remove the merged feature branch.

The user subsequently reported completion, but the exact clean-build and final deployment output for commit `a1c3a61` was not pasted into the conversation. Treat the Git SHA as verified and the final build/deployment as user-reported unless independently rechecked.

This handoff is created during a documentation synchronization branch and is not part of `a1c3a61` until committed and merged.

---

## 2. Instructions for the next chat

1. Read `AGENTS.md` before changing Next.js code.
2. Consult the relevant local Next.js 16 documentation under `node_modules/next/dist/docs/`.
3. Verify current branch, `HEAD`, `origin/main`, and working tree.
4. Treat current repository files, applied migrations, and generated types as authoritative over old chat snippets.
5. Never edit an applied migration.
6. Keep `VTM_V5_SCHEMA_VERSION = 3` unless a separate schema review approves a new version.
7. Preserve unknown VtM top-level sheet data under `extensions`.
8. Do not expose raw Supabase errors, secrets, raw invitation tokens, or private Storage paths.
9. Keep authorization in RLS/server/database boundaries; UI visibility is not security.
10. Use small verified branches and full-file ZIP packages based on exact current sources.
11. Commands should be suitable for Windows CMD.
12. Code comments and text inside code blocks should be English.
13. Stop active dev servers before production builds if generated route types behave unexpectedly.
14. Do not begin video integration before the provider comparison and spike.
15. The immediate feature task is the VtM dice contract and personal roller, not shared persistence yet.

---

## 3. Current product state

Completed milestones:

- Milestone 1 — Architecture Baseline;
- Milestone 2 — Character Friend Alpha;
- Milestone 3 — Campaign Foundation.

Current milestone:

- Milestone 4 — VtM Realtime Tools.

### Current implemented platform

- Next.js 16.2.9 App Router;
- React 19.2.4;
- TypeScript;
- Tailwind CSS 4;
- `next-intl`;
- Supabase Auth/PostgreSQL/RLS/Storage;
- Vercel;
- EN/RU locale-prefixed routes.

### Current implemented routes

```text
/[locale]
/[locale]/account
/[locale]/campaigns
/[locale]/campaigns/new
/[locale]/campaigns/join/[token]
/[locale]/campaigns/[id]
/[locale]/campaigns/[id]/characters/[characterId]
/[locale]/characters
/[locale]/characters/[id]
/[locale]/characters/new
/[locale]/characters/new/[system]
/[locale]/dashboard
/[locale]/games
/[locale]/games/vampire-the-masquerade
/[locale]/login
/[locale]/profile
/[locale]/profile/edit
/[locale]/register
/auth/confirm
```

Character and campaign route families include loading and safe unavailable/not-found states where implemented.

---

## 4. Character Friend Alpha state

Implemented and manually verified:

- complete VtM V5 schema version 3;
- two logical sheet pages;
- owner view/edit;
- explicit Save;
- create/save mutation states;
- duplicate-submit protection;
- unsaved-change protection;
- local draft and active-page restoration;
- portrait create/replace/remove;
- Private and Campaign visibility;
- long-value handling;
- EN/RU;
- desktop and mobile;
- loading, empty, retry, and unavailable states;
- production smoke test.

Current sharing behavior:

| Visibility | Access |
|---|---|
| `private` | owner only |
| `campaign` | owner plus active campaign participants when an eligible active assignment exists |
| `public` | owner only; public access is not implemented |

Only the owner may edit or delete a character.

---

## 5. Campaign Foundation state

### Role model

- exactly one Game Master;
- creator becomes GM;
- `campaigns.game_master_id` is immutable;
- no second GM;
- no ownership transfer;
- `campaign_members` contains Players only;
- no role column.

### Current UI

- My Campaigns;
- Create Campaign;
- Campaign Overview;
- invitation creation/copy/revocation;
- login return-to-invitation;
- invitation acceptance;
- Game Master and Player list;
- Player leave;
- GM removes Player;
- character link/unlink;
- shared read-only character sheet;
- campaign edit/reset;
- campaign completion;
- campaign deletion;
- EN/RU;
- mobile;
- loading and unavailable states.

### Lifecycle

Active campaigns allow:

- GM detail editing;
- invitations;
- Player membership changes;
- character linking/unlinking.

Completed campaigns:

- are read-only;
- revoke open invitations;
- close active character assignments;
- disable membership and assignment mutation;
- remain visible to current participants;
- can be deleted by GM;
- cannot be reactivated.

Deletion cascades campaign-owned rows but preserves Player-owned characters.

---

## 6. Applied database state

Applied migrations:

```text
20260630143000_initial_schema.sql
20260702150000_character_portraits.sql
20260709150000_campaign_foundation.sql
20260709163000_fix_campaign_select_policy.sql
20260709170000_fix_campaign_character_trigger_security.sql
```

Generated public schema types:

```text
types/database.types.ts
```

Current tables:

```text
profiles
characters
campaigns
campaign_members
campaign_invitations
campaign_characters
```

Current private Storage bucket:

```text
character-portraits
```

New portrait object path:

```text
USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME
```

Applied migrations must not be edited.

### Campaign security verification

Recorded database verification:

- four campaign tables with RLS;
- fifteen expected campaign functions;
- seven expected campaign triggers;
- twelve expected campaign-related policies;
- full GM/Player/Outsider transaction test;
- test data removed with `ROLLBACK`.

The test found and led to forward fixes for:

1. GM visibility during campaign `INSERT ... RETURNING`;
2. campaign-character trigger access to protected rows.

---

## 7. Accepted architecture decisions relevant now

Accepted:

- ADR-001 — System-specific versioned JSONB;
- ADR-002 — Private character portrait Storage;
- ADR-004 — A4 desktop and responsive mobile rendering;
- ADR-005 — URL-prefixed localization;
- ADR-006 — `next-intl` and Supabase proxy composition;
- ADR-007 — Campaign Foundation before shared realtime tools;
- ADR-008 — Game-system domain boundaries.

Proposed:

- ADR-003 — Independent character-sheet language;
- ADR-009 — Managed video infrastructure.

ADR-009 must not be accepted until a provider comparison and disposable technical spike are complete.

---

## 8. Immediate next task: VtM dice contract

Do not begin with database persistence.

First approve a VtM-specific request/result contract.

Recommended personal request:

```text
pool
hungerDice
difficulty?
label?
```

Recommended evaluator output concepts:

```text
normalDice[]
hungerDiceResults[]
successes
criticalPairCount
isCritical
isMessyCritical
isBestialFailure
isTotalFailure
meetsDifficulty
margin
summaryKey
```

Key architecture rule:

> Random generation and deterministic VtM interpretation are separate.

The evaluator must support fixed supplied dice in unit tests.

Minimum interpretation cases:

- success;
- below-Difficulty failure;
- total failure;
- ordinary critical;
- messy critical;
- bestial failure;
- exact Difficulty;
- positive/negative margin;
- multiple tens;
- Hunger 1 behavior;
- invalid pool/Hunger input.

Recommended personal route:

```text
/[locale]/games/vampire-the-masquerade/tools/dice
```

First dice slice:

- personal/local only;
- no `dice_rolls` table;
- no campaign persistence;
- no Realtime;
- EN/RU;
- mobile;
- repeat roll;
- optional label;
- character-assisted defaults only if the slice remains small.

---

## 9. Shared dice after the personal engine

Only after the evaluator and personal UI are stable:

1. review a `dice_rolls` schema;
2. create a new migration;
3. regenerate types;
4. use server-authoritative random generation;
5. use server-authoritative interpretation;
6. derive actor identity from authentication;
7. verify campaign membership;
8. verify selected character access;
9. persist structured request/result;
10. prevent ordinary history rewriting;
11. add campaign-scoped Realtime;
12. test GM, Player, removed Player, and Outsider.

Recommended route:

```text
/[locale]/campaigns/[id]/dice
```

Do not introduce a second invitation or membership system.

---

## 10. Video after dice phases

Before production integration:

- compare managed providers;
- review SDK, browser/mobile support, token security, cost, privacy, participant limits, reconnect, screen sharing, and exit strategy;
- run a disposable two-to-three-user spike;
- test denied camera/microphone permissions;
- test weak network and reconnect;
- test token expiry;
- test removed-member denial;
- then accept or reject ADR-009.

Recommended route after provider selection:

```text
/[locale]/campaigns/[id]/video
```

Provider secret remains server-only. Tokens are short-lived and campaign-gated.

---

## 11. Later roadmap

After dice and video:

- Handouts;
- NPCs;
- Sessions/Chronicle;
- shared notes;
- GM-private notes;
- real friend-group session;
- targeted workflow fixes;
- Visual Identity;
- VtM Game Hub;
- Public Readiness;
- Call of Cthulhu 7e.

Deferred unless explicitly reprioritized:

- independent sheet language;
- print/PDF;
- portrait crop;
- public characters;
- campaign discovery;
- chat;
- maps;
- music;
- combat tracker;
- recording/transcription;
- advanced macros.

---

## 12. Development process preferences

- Make one small feature branch at a time.
- Verify baseline before changes.
- Request exact current files in a ZIP for substantial edits.
- Return complete files with repository-relative paths.
- Run `git diff --check`.
- Run `npm run build`.
- Perform plain-language manual tests.
- Push and verify local/remote SHA.
- Use a PR.
- Merge only after checks.
- Synchronize `main`.
- Verify production.
- Delete merged branches.
- Update permanent docs with material route, schema, security, or workflow changes.

Do not rely on older handoffs over current code.
