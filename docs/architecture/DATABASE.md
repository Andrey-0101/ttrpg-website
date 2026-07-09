# Database, RLS, and Storage

## Status

This document replaces the obsolete statement that no application Storage bucket exists.

The applied repository-backed database baseline currently consists of:

```text
supabase/migrations/20260630143000_initial_schema.sql
supabase/migrations/20260702150000_character_portraits.sql
```

Both applied migrations were verified as present in local and remote migration history during the H003 project stage.

The following candidate migration is present in the repository review branch but has not yet been applied:

```text
supabase/migrations/20260709150000_campaign_foundation.sql
```

Applied migrations must not be edited. Future changes require new migration files.

## Generated types

Generated public-schema types are stored in:

```text
types/database.types.ts
```

Do not edit generated types manually.

After an intentional schema change:

1. apply and verify the migration in the correct environment;
2. regenerate database types;
3. review the type diff;
4. update Supabase client/query code;
5. update this document.

The current browser and server Supabase clients use the generated `Database` generic. Any new client factory must also use the generated type.

## Tables

### `public.profiles`

| Column | State |
|---|---|
| `id` | UUID primary key; references `auth.users.id`; cascade delete |
| `username` | nullable text; unique |
| `display_name` | nullable text |
| `bio` | nullable text |
| `avatar_url` | nullable text |
| `created_at` | non-null timestamptz; default `now()` |

A trigger creates a profile row when a new Auth user is created.

### `public.characters`

| Column | State |
|---|---|
| `id` | UUID primary key; default `gen_random_uuid()` |
| `owner_id` | non-null UUID; references `auth.users.id`; cascade delete |
| `name` | non-null text |
| `game_system` | non-null text |
| `description` | nullable text |
| `portrait_url` | nullable text; new portraits store a private Storage path |
| `visibility` | non-null text; default `private` |
| `sheet_data` | non-null JSONB; default `{}` |
| `created_at` | non-null timestamptz; default `now()` |
| `updated_at` | non-null timestamptz; default `now()` |

Visibility check values:

```text
private
campaign
public
```

Important: these values do not currently create shared access. Current character RLS is owner-only.

## Constraints and indexes

Verified:

- primary key on `profiles.id`;
- unique constraint on `profiles.username`;
- primary key on `characters.id`;
- foreign key from `profiles.id` to `auth.users.id`;
- foreign key from `characters.owner_id` to `auth.users.id`;
- visibility check on `characters.visibility`.

No explicit index on `characters.owner_id` was verified in the baseline migration.

No database trigger currently guarantees automatic maintenance of `characters.updated_at`.

These are future performance/consistency considerations, not current blockers.

## Row Level Security

### Profiles

RLS is enabled.

Current policy behavior:

- authenticated users can select profiles;
- a user can update only the profile whose `id` equals `auth.uid()`.

### Characters

RLS is enabled.

Current policy behavior:

- a user can insert only a row owned by that user;
- a user can select only their own rows;
- a user can update only their own rows;
- a user can delete only their own rows.

Application queries still depend on RLS. UI checks are not an authorization boundary.

## Current sharing semantics

| Visibility value | Actual current access |
|---|---|
| `private` | owner only |
| `campaign` | owner only; campaign sharing not implemented |
| `public` | owner only; public route/policy not implemented |

Until campaign and public access are implemented, UI copy must not imply that these values already share a character.

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

New paths follow:

```text
USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME
```

The first path segment is the authenticated user ID.

### Storage policies

Authenticated users receive owner-folder policies for:

- SELECT;
- INSERT;
- UPDATE;
- DELETE.

The policy condition requires:

```text
bucket_id = character-portraits
first folder segment = auth.uid()
```

### Display

Private portraits are displayed using signed URLs.

Current signed URL lifetime:

```text
3600 seconds
```

The application treats `http://` and `https://` values in `portrait_url` as legacy external URLs. Other values are treated as private Storage paths.

## Portrait lifecycle

### Creation

1. create the character row and obtain the character ID;
2. upload the object under the owner/character path;
3. update `portrait_url` with the path;
4. attempt rollback if a later step fails.

### Replacement

1. keep the current portrait;
2. upload the new object;
3. update the row;
4. remove the old object only after the new reference is saved;
5. retain best-effort cleanup if removal fails.

### Removal

The row is updated to remove the portrait reference, then object cleanup is attempted.

### Character deletion

The character row is deleted and portrait cleanup is attempted.

Known limitation:

- cleanup is best-effort;
- a failure can leave an orphan object;
- no scheduled orphan-maintenance process exists.

## Data-contract rules

- Common character data stays in columns.
- System-specific data stays in `sheet_data`.
- Each system schema must be versioned.
- Persisted VtM data must pass through the VtM normalizer.
- Unknown VtM top-level fields must be preserved where possible.
- Do not store image bytes or Base64 in JSONB.
- Do not edit applied migrations.

## Campaign Foundation candidate migration

Campaign objects are still **not applied to the linked Supabase project** and must not yet be treated as current remote database tables.

The reviewed candidate migration is stored at:

```text
supabase/migrations/20260709150000_campaign_foundation.sql
```

The access matrix is stored in:

```text
docs/architecture/CAMPAIGN_RLS_MATRIX.md
```

Candidate objects:

```text
campaigns
campaign_members
campaign_invitations
campaign_characters
```

Approved role model:

- `campaigns.game_master_id` identifies the single immutable Game Master;
- the campaign creator is the Game Master;
- `campaign_members` contains only Players;
- there is no campaign membership role column;
- direct membership insertion is denied;
- invitation acceptance creates Player membership atomically.

The candidate migration also includes:

- campaign authorization helper functions;
- single-use seven-day invitation functions with row-level serialization;
- active character-assignment uniqueness;
- read-only campaign access to eligible linked characters whose owners remain campaign participants and whose game systems match;
- a campaign-aware portrait Storage SELECT policy that validates both owner and character path segments;
- automatic unlink/revocation behavior when a campaign is completed, a Player is removed, or a linked character becomes ineligible.

The candidate migration has not been applied. Generated types remain unchanged until application and regeneration are completed.

## Other proposed future schema areas

The following are not implemented and must not be treated as current tables:

```text
dice_rolls
video_rooms
handouts
npcs
sessions
campaign_notes
```

Each future domain requires:

- a reviewed schema;
- a new migration;
- generated type updates;
- RLS;
- a two-user or multi-user access test;
- documentation updates.

## Verification checklist after database changes

```bash
npx supabase migration list
npm run build
git diff --check
```

Additionally verify:

- owner/member access;
- denied cross-user access;
- direct URL behavior;
- Storage access;
- generated types;
- rollback and cleanup behavior.
