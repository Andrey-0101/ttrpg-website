# Database, RLS, and Storage

## Status

Current applied repository-backed database state for the synchronized snapshot:

```text
main
a1c3a61381a2b7cddab9dd8fb620af56342209a9
```

Applied migrations:

```text
supabase/migrations/20260630143000_initial_schema.sql
supabase/migrations/20260702150000_character_portraits.sql
supabase/migrations/20260709150000_campaign_foundation.sql
supabase/migrations/20260709163000_fix_campaign_select_policy.sql
supabase/migrations/20260709170000_fix_campaign_character_trigger_security.sql
```

Local and linked remote migration histories were verified as synchronized after the Campaign Foundation work.

Applied migrations must never be edited. Any later schema, policy, function, trigger, or Storage change requires a new migration.

## Generated types

Generated public-schema types are stored in:

```text
types/database.types.ts
```

Do not edit generated types manually.

After an intentional schema change:

1. create and review a new migration;
2. run migration preflight;
3. apply and verify the migration in the intended environment;
4. regenerate database types from the linked schema;
5. review the type diff;
6. update Supabase client/query code;
7. run build and security checks;
8. update this document.

Browser and server Supabase clients use the generated `Database` generic.

## Current tables

### `public.profiles`

| Column | State |
|---|---|
| `id` | UUID primary key; references `auth.users.id`; cascade delete |
| `username` | nullable text; unique |
| `display_name` | nullable text |
| `bio` | nullable text |
| `avatar_url` | nullable text |
| `created_at` | non-null timestamptz; default `now()` |

A trigger creates a profile row for a new Auth user.

### `public.characters`

| Column | State |
|---|---|
| `id` | UUID primary key; default `gen_random_uuid()` |
| `owner_id` | non-null UUID; references `auth.users.id`; cascade delete |
| `name` | non-null text |
| `game_system` | non-null text |
| `description` | nullable text |
| `portrait_url` | nullable text; current private portraits store a Storage path |
| `visibility` | non-null text; default `private` |
| `sheet_data` | non-null JSONB; default `{}` |
| `created_at` | non-null timestamptz; default `now()` |
| `updated_at` | non-null timestamptz; default `now()` |

Visibility values:

```text
private
campaign
public
```

Actual access depends on RLS and active assignment state, not only on the stored visibility value.

### `public.campaigns`

| Column | State |
|---|---|
| `id` | UUID primary key |
| `game_master_id` | non-null Auth user; cascade delete |
| `game_system` | non-null text; immutable after creation |
| `name` | non-null trimmed text; 1–120 characters |
| `description` | nullable text; maximum 4,000 characters |
| `status` | `active` or `completed` |
| `created_at` | non-null timestamptz |
| `updated_at` | non-null timestamptz |

Rules:

- creator must be the Game Master;
- `game_master_id` is immutable;
- there is exactly one Game Master;
- completed campaigns are read-only except deletion by the Game Master;
- completion revokes open invitations and closes active character assignments.

### `public.campaign_members`

| Column | State |
|---|---|
| `campaign_id` | part of composite primary key; cascade delete |
| `user_id` | part of composite primary key; cascade delete |
| `joined_at` | non-null timestamptz |

Every row is a Player.

The Game Master is never duplicated in this table.

Direct client insertion is not allowed. Membership is created by secure invitation acceptance.

### `public.campaign_invitations`

| Column | State |
|---|---|
| `id` | UUID primary key |
| `campaign_id` | non-null; cascade delete |
| `created_by` | non-null Auth user |
| `token_hash` | non-null unique text |
| `expires_at` | non-null timestamptz |
| `accepted_at` | nullable timestamptz |
| `accepted_by` | nullable Auth user |
| `revoked_at` | nullable timestamptz |
| `created_at` | non-null timestamptz |

Only a token hash is stored. The raw token is returned only at creation.

Terminal-state constraints prevent an invitation from being both accepted and revoked.

### `public.campaign_characters`

| Column | State |
|---|---|
| `id` | UUID primary key |
| `campaign_id` | non-null; cascade delete |
| `character_id` | non-null; cascade delete |
| `linked_by` | non-null Auth user |
| `linked_at` | non-null timestamptz |
| `unlinked_at` | nullable timestamptz |

A partial unique index allows only one active campaign assignment per character.

Historical unlinked rows may remain.

## Indexes and consistency rules

Campaign Foundation includes indexes for:

- campaigns by Game Master;
- memberships by user;
- invitations by campaign;
- open invitations by campaign and expiry;
- assignments by campaign;
- assignments by character;
- one active assignment per character.

Database triggers and functions enforce:

- immutable campaign identity, Game Master, game system, and creation time;
- active-to-completed lifecycle rules;
- no GM membership row;
- invitation creator and immutable invitation identity;
- valid campaign/character linking;
- owner participation;
- campaign visibility;
- game-system match;
- automatic invitation revocation on completion;
- automatic assignment unlinking on completion or member removal;
- automatic assignment unlinking when a character becomes ineligible.

`characters.updated_at` is still maintained by application writes rather than a dedicated generic trigger.

## Row Level Security

RLS is enabled on:

```text
profiles
characters
campaigns
campaign_members
campaign_invitations
campaign_characters
```

### Profiles

- authenticated users may read profiles;
- a user may update only their own profile.

### Characters

Owner policies permit the owner to:

- insert;
- select;
- update;
- delete.

A campaign-aware SELECT policy additionally permits read-only access when `current_user_can_view_campaign_character(id)` returns true.

No campaign policy grants update or delete access to a Game Master or another Player.

No public policy currently exists for `visibility = public`.

### Campaigns

- participants may select;
- an authenticated user may create a campaign only with themselves as Game Master;
- only the Game Master may update an active campaign;
- only the Game Master may delete.

The corrective migration `20260709163000_fix_campaign_select_policy.sql` makes the creating Game Master visible through `INSERT ... RETURNING` by checking the current row directly.

### Memberships

- campaign participants may read the Player list;
- the Game Master may remove a Player;
- a Player may remove only their own membership;
- direct insertion is denied.

### Invitations

- only the Game Master may list invitation metadata;
- secure functions create, accept, and revoke invitations;
- raw token hashes are not exposed to ordinary authenticated clients.

### Character assignments

- campaign participants may read active and historical assignment rows permitted by policy;
- an eligible owner may link their own character;
- the owner or Game Master may close an active assignment;
- ordinary clients cannot reopen a closed assignment.

## Campaign authorization helpers

Current functions include helpers for:

```text
current_user_is_campaign_game_master(uuid)
current_user_is_campaign_player(uuid)
current_user_can_access_campaign(uuid)
current_user_can_view_campaign_character(uuid)
current_user_can_view_campaign_portrait(text)
```

Invitation RPCs:

```text
create_campaign_invitation(uuid)
accept_campaign_invitation(text)
revoke_campaign_invitation(uuid)
```

Integrity and lifecycle functions support campaign updates, invitations, memberships, assignments, completion, member removal, and character eligibility changes.

The campaign-character integrity function is `SECURITY DEFINER` with an empty search path and fully qualified objects so it can lock protected rows while still applying explicit integrity checks. This was added by `20260709170000_fix_campaign_character_trigger_security.sql`.

## Current sharing semantics

| Visibility | Actual access |
|---|---|
| `private` | owner only |
| `campaign` | owner; plus active campaign participants when every assignment and eligibility rule passes |
| `public` | owner only; no public route or policy is implemented |

Campaign visibility alone does not grant access.

A character must have an active assignment to an active campaign, matching game system, continued owner participation, and an authorized viewer.

## Storage

### Bucket

```text
character-portraits
```

Configuration:

| Property | Value |
|---|---|
| Public | false |
| Maximum object size | 5,242,880 bytes |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |

### Object path

```text
USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME
```

### Policies

Owner-folder policies permit authenticated owners to:

- SELECT;
- INSERT;
- UPDATE;
- DELETE.

Campaign participants receive additional SELECT access only when:

- the bucket is `character-portraits`;
- path owner ID matches the character owner;
- path character ID matches the character;
- the campaign-aware character helper authorizes the viewer.

Upload, replacement, and deletion remain owner-only.

### Display

Private portraits are displayed through signed URLs.

Current signed URL lifetime:

```text
3600 seconds
```

Legacy `http://` and `https://` values in `portrait_url` are treated as external URLs. Other values are treated as private Storage paths.

## Portrait lifecycle

### Creation

1. create the character row;
2. upload under the owner/character path;
3. update `portrait_url`;
4. attempt rollback if a later step fails.

### Replacement

1. retain the current portrait;
2. upload the replacement;
3. save the new path;
4. remove the old object after the row update;
5. keep best-effort cleanup if removal fails.

### Removal and character deletion

The database reference is removed or the character row is deleted, then Storage cleanup is attempted.

Known limitation:

- cleanup is best-effort;
- an orphan object may remain;
- no scheduled orphan cleanup exists.

## Verification evidence

Campaign Foundation verification recorded:

- five synchronized local/remote migration versions;
- four campaign tables with RLS enabled;
- fifteen expected campaign functions;
- seven expected campaign triggers;
- twelve expected campaign-related policies;
- a full GM/Player/Outsider transaction test;
- all test data rolled back.

The security test exposed two issues that were corrected through new migrations rather than editing the applied foundation migration:

1. campaign `INSERT ... RETURNING` visibility for the creating GM;
2. campaign-character trigger access to protected rows.

## Data-contract rules

- common character data stays in ordinary columns;
- system-specific character data stays in `sheet_data`;
- each system schema is versioned;
- persisted VtM data passes through the VtM normalizer;
- unknown VtM top-level fields are preserved where possible;
- image bytes and Base64 do not belong in JSONB;
- campaign tables remain game-system neutral;
- applied migrations are immutable.

## Future schema areas

Not implemented:

```text
dice_rolls
video_rooms
handouts
npcs
sessions
campaign_notes
```

Each future domain requires:

- reviewed product and security contract;
- new migration;
- generated type update;
- RLS;
- direct-ID and multi-user tests;
- documentation update.

## Verification checklist after database changes

```bash
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npm run build
git diff --check
```

Also verify:

- intended actor access;
- denied cross-user access;
- direct URL behavior;
- Storage behavior;
- generated types;
- lifecycle cleanup;
- rollback or forward-fix strategy.
