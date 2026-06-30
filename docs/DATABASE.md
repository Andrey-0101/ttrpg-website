# Database

The project uses Supabase PostgreSQL for authentication, profiles, and character storage.

## Migration baseline

The production database schema is represented by the following baseline migration:

- `supabase/migrations/20260630143000_initial_schema.sql`

The baseline migration was verified by:

1. Recreating the local Supabase database with `supabase db reset --local`.
2. Comparing the migration result with the linked production database.
3. Confirming that `supabase db diff --linked --schema public` reports no schema changes.
4. Synchronizing the remote migration history with migration version `20260630143000`.

Do not run the baseline migration against production again.

## Public schema

### `public.profiles`

Stores application profile information for authenticated users.

Main columns:

- `id`
- `username`
- `display_name`
- `bio`
- `avatar_url`
- `created_at`

`profiles.id` references `auth.users.id` with `ON DELETE CASCADE`.

A profile row is created automatically by the `on_auth_user_created` trigger.

### `public.characters`

Stores characters created by authenticated users.

Main columns:

- `id`
- `owner_id`
- `name`
- `game_system`
- `description`
- `portrait_url`
- `visibility`
- `sheet_data`
- `created_at`
- `updated_at`

`characters.owner_id` references `auth.users.id` with `ON DELETE CASCADE`.

`sheet_data` is stored as `jsonb`.

Allowed visibility values are:

- `private`
- `campaign`
- `public`

At the current stage, visibility does not provide cross-user access. Character access is still restricted to the owner by Row Level Security.

## Row Level Security

RLS is enabled on both public tables.

### Characters

Authenticated users can:

- create characters only with their own `owner_id`;
- view only their own characters;
- update only their own characters;
- delete only their own characters.

Cross-user isolation was verified with two authenticated test users.

The second user received:

- `visible_rows = 0`
- `updated_rows = 0`
- `deleted_rows = 0`

The application also returned a 404 page when the second user opened the first user's character URL directly.

### Profiles

Authenticated users can view profiles.

Users can update only the profile where `profiles.id = auth.uid()`.

## Storage

Supabase Storage currently has:

- no application buckets;
- no custom storage policies.

Portrait upload must not be implemented until a bucket and appropriate RLS policies are added through a migration.

## Generated TypeScript types

Database types are generated from the linked Supabase schema:

- `types/database.types.ts`

Regenerate them after every database schema migration:

```bash
npx supabase gen types typescript --project-id nryzkqwcnbbneazaksgh --schema public > types/database.types.ts
```

Do not edit the generated file manually.

The generated `Database` type is used by:

- `utils/supabase/client.ts`
- `utils/supabase/server.ts`
- `utils/supabase/proxy.ts`

## Local database commands

Start the local Supabase stack:

```bash
npx supabase start
```

Recreate the local database from migrations:

```bash
npx supabase db reset --local
```

Compare migrations with the linked production schema:

```bash
npx supabase db diff --linked --schema public
```

List migration history:

```bash
npx supabase migration list --linked
```

## Future database work

Future schema changes must be implemented as new migration files.

Potential future improvements include:

- an index on `characters.owner_id`;
- automatic maintenance of `characters.updated_at`;
- validation constraints for `game_system` and `sheet_data`;
- storage bucket and portrait access policies;
- campaign membership and campaign-level character visibility;
- public character sharing policies;
- database grant hardening.

These changes are not part of the initial baseline migration.
