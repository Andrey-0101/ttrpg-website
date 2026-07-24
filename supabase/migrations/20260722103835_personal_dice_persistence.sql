-- Personal dice persistence.
--
-- This migration stores private custom-pool presets and a combined personal
-- roll timeline. Personal history is non-authoritative and must not be used as
-- proof for future server-authoritative campaign rolls.

-- Five constrained slot values make the per-owner preset limit structural;
-- the mutation lock lets concurrent creates allocate the lowest free slots.
create table public.custom_dice_presets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null
    references auth.users(id) on delete cascade,
  slot smallint not null,
  name text not null,
  coin_quantity smallint not null default 0,
  d4_quantity smallint not null default 0,
  d6_quantity smallint not null default 0,
  d8_quantity smallint not null default 0,
  d10_quantity smallint not null default 0,
  d12_quantity smallint not null default 0,
  d20_quantity smallint not null default 0,
  d100_quantity smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_dice_presets_slot_check
    check (slot between 1 and 5),
  constraint custom_dice_presets_name_length_check
    check (pg_catalog.char_length(name) between 1 and 80),
  constraint custom_dice_presets_name_canonical_check
    check (
      name = pg_catalog.btrim(
        pg_catalog.regexp_replace(name, '[[:space:]]+', ' ', 'g')
      )
    ),
  constraint custom_dice_presets_coin_quantity_check
    check (coin_quantity between 0 and 100),
  constraint custom_dice_presets_d4_quantity_check
    check (d4_quantity between 0 and 100),
  constraint custom_dice_presets_d6_quantity_check
    check (d6_quantity between 0 and 100),
  constraint custom_dice_presets_d8_quantity_check
    check (d8_quantity between 0 and 100),
  constraint custom_dice_presets_d10_quantity_check
    check (d10_quantity between 0 and 100),
  constraint custom_dice_presets_d12_quantity_check
    check (d12_quantity between 0 and 100),
  constraint custom_dice_presets_d20_quantity_check
    check (d20_quantity between 0 and 100),
  constraint custom_dice_presets_d100_quantity_check
    check (d100_quantity between 0 and 100),
  constraint custom_dice_presets_total_quantity_check
    check (
      coin_quantity
      + d4_quantity
      + d6_quantity
      + d8_quantity
      + d10_quantity
      + d12_quantity
      + d20_quantity
      + d100_quantity
      between 1 and 100
    ),
  constraint custom_dice_presets_owner_slot_key
    unique (owner_id, slot)
);

create unique index custom_dice_presets_owner_lower_name_idx
  on public.custom_dice_presets(owner_id, pg_catalog.lower(name));

create table public.personal_roll_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null
    references auth.users(id) on delete cascade,
  client_roll_id uuid not null,
  sequence_number bigint generated always as identity,
  roller_kind text not null,
  schema_version smallint not null,
  request_data jsonb not null,
  result_data jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint personal_roll_history_roller_kind_check
    check (roller_kind in ('vtm_v5', 'custom_dice_pool')),
  constraint personal_roll_history_schema_version_check
    check (schema_version = 1),
  constraint personal_roll_history_request_object_check
    check (pg_catalog.jsonb_typeof(request_data) = 'object'),
  constraint personal_roll_history_result_object_check
    check (pg_catalog.jsonb_typeof(result_data) = 'object'),
  constraint personal_roll_history_request_size_check
    check (pg_catalog.octet_length(request_data::text) <= 16 * 1024),
  constraint personal_roll_history_result_size_check
    check (pg_catalog.octet_length(result_data::text) <= 64 * 1024),
  constraint personal_roll_history_owner_client_roll_key
    unique (owner_id, client_roll_id),
  constraint personal_roll_history_sequence_number_key
    unique (sequence_number)
);

create index personal_roll_history_owner_sequence_idx
  on public.personal_roll_history(owner_id, sequence_number desc);

alter table public.custom_dice_presets enable row level security;
alter table public.personal_roll_history enable row level security;

create policy "Users can view their own custom dice presets"
on public.custom_dice_presets
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Users can view their own personal roll history"
on public.personal_roll_history
for select
to authenticated
using ((select auth.uid()) = owner_id);

create or replace function public.create_custom_dice_preset(
  p_name text,
  p_coin_quantity smallint,
  p_d4_quantity smallint,
  p_d6_quantity smallint,
  p_d8_quantity smallint,
  p_d10_quantity smallint,
  p_d12_quantity smallint,
  p_d20_quantity smallint,
  p_d100_quantity smallint
)
returns public.custom_dice_presets
language plpgsql
security definer
set search_path = ''
as $$
declare
  preset_lock_namespace constant integer := 1;
  current_owner_id uuid;
  canonical_name text;
  available_slot smallint;
  created_preset public.custom_dice_presets%rowtype;
begin
  select auth.uid()
  into current_owner_id;

  if current_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    preset_lock_namespace,
    pg_catalog.hashtext(current_owner_id::text)
  );

  canonical_name := pg_catalog.btrim(
    pg_catalog.regexp_replace(p_name, '[[:space:]]+', ' ', 'g')
  );

  if canonical_name is null
    or pg_catalog.char_length(canonical_name) not between 1 and 80
  then
    raise exception using
      errcode = '22023',
      message = 'preset_name_invalid';
  end if;

  if exists (
    select 1
    from public.custom_dice_presets as preset
    where preset.owner_id = current_owner_id
      and pg_catalog.lower(preset.name) = pg_catalog.lower(canonical_name)
  ) then
    raise exception using
      errcode = '23505',
      message = 'preset_name_conflict';
  end if;

  select candidate.slot::smallint
  into available_slot
  from pg_catalog.generate_series(1, 5) as candidate(slot)
  where not exists (
    select 1
    from public.custom_dice_presets as preset
    where preset.owner_id = current_owner_id
      and preset.slot = candidate.slot
  )
  order by candidate.slot
  limit 1;

  if available_slot is null then
    raise exception using
      errcode = 'P0001',
      message = 'preset_limit_reached';
  end if;

  insert into public.custom_dice_presets as preset (
    owner_id,
    slot,
    name,
    coin_quantity,
    d4_quantity,
    d6_quantity,
    d8_quantity,
    d10_quantity,
    d12_quantity,
    d20_quantity,
    d100_quantity
  )
  values (
    current_owner_id,
    available_slot,
    canonical_name,
    p_coin_quantity,
    p_d4_quantity,
    p_d6_quantity,
    p_d8_quantity,
    p_d10_quantity,
    p_d12_quantity,
    p_d20_quantity,
    p_d100_quantity
  )
  returning preset.*
  into created_preset;

  return created_preset;
end;
$$;

create or replace function public.update_custom_dice_preset(
  p_preset_id uuid,
  p_name text,
  p_coin_quantity smallint,
  p_d4_quantity smallint,
  p_d6_quantity smallint,
  p_d8_quantity smallint,
  p_d10_quantity smallint,
  p_d12_quantity smallint,
  p_d20_quantity smallint,
  p_d100_quantity smallint
)
returns public.custom_dice_presets
language plpgsql
security definer
set search_path = ''
as $$
declare
  preset_lock_namespace constant integer := 1;
  current_owner_id uuid;
  canonical_name text;
  updated_preset public.custom_dice_presets%rowtype;
begin
  select auth.uid()
  into current_owner_id;

  if current_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    preset_lock_namespace,
    pg_catalog.hashtext(current_owner_id::text)
  );

  canonical_name := pg_catalog.btrim(
    pg_catalog.regexp_replace(p_name, '[[:space:]]+', ' ', 'g')
  );

  if canonical_name is null
    or pg_catalog.char_length(canonical_name) not between 1 and 80
  then
    raise exception using
      errcode = '22023',
      message = 'preset_name_invalid';
  end if;

  if not exists (
    select 1
    from public.custom_dice_presets as preset
    where preset.id = p_preset_id
      and preset.owner_id = current_owner_id
  ) then
    raise exception using
      errcode = 'P0002',
      message = 'preset_not_found';
  end if;

  if exists (
    select 1
    from public.custom_dice_presets as preset
    where preset.owner_id = current_owner_id
      and preset.id <> p_preset_id
      and pg_catalog.lower(preset.name) = pg_catalog.lower(canonical_name)
  ) then
    raise exception using
      errcode = '23505',
      message = 'preset_name_conflict';
  end if;

  update public.custom_dice_presets as preset
  set
    name = canonical_name,
    coin_quantity = p_coin_quantity,
    d4_quantity = p_d4_quantity,
    d6_quantity = p_d6_quantity,
    d8_quantity = p_d8_quantity,
    d10_quantity = p_d10_quantity,
    d12_quantity = p_d12_quantity,
    d20_quantity = p_d20_quantity,
    d100_quantity = p_d100_quantity,
    updated_at = pg_catalog.clock_timestamp()
  where preset.id = p_preset_id
    and preset.owner_id = current_owner_id
  returning preset.*
  into updated_preset;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'preset_not_found';
  end if;

  return updated_preset;
end;
$$;

create or replace function public.delete_custom_dice_preset(
  p_preset_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  preset_lock_namespace constant integer := 1;
  current_owner_id uuid;
  deleted_count bigint;
begin
  select auth.uid()
  into current_owner_id;

  if current_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    preset_lock_namespace,
    pg_catalog.hashtext(current_owner_id::text)
  );

  delete from public.custom_dice_presets as preset
  where preset.id = p_preset_id
    and preset.owner_id = current_owner_id;

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

create or replace function public.record_personal_roll(
  p_client_roll_id uuid,
  p_roller_kind text,
  p_schema_version smallint,
  p_request_data jsonb,
  p_result_data jsonb
)
returns public.personal_roll_history
language plpgsql
security definer
set search_path = ''
as $$
declare
  history_lock_namespace constant integer := 2;
  current_owner_id uuid;
  existing_roll public.personal_roll_history%rowtype;
  recorded_roll public.personal_roll_history%rowtype;
begin
  select auth.uid()
  into current_owner_id;

  if current_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    history_lock_namespace,
    pg_catalog.hashtext(current_owner_id::text)
  );

  select history.*
  into existing_roll
  from public.personal_roll_history as history
  where history.owner_id = current_owner_id
    and history.client_roll_id = p_client_roll_id;

  if found then
    if existing_roll.roller_kind is not distinct from p_roller_kind
      and existing_roll.schema_version is not distinct from p_schema_version
      and existing_roll.request_data is not distinct from p_request_data
      and existing_roll.result_data is not distinct from p_result_data
    then
      return existing_roll;
    end if;

    raise exception using
      errcode = '23505',
      message = 'personal_roll_idempotency_conflict';
  end if;

  insert into public.personal_roll_history as history (
    owner_id,
    client_roll_id,
    roller_kind,
    schema_version,
    request_data,
    result_data
  )
  values (
    current_owner_id,
    p_client_roll_id,
    p_roller_kind,
    p_schema_version,
    p_request_data,
    p_result_data
  )
  returning history.*
  into recorded_roll;

  -- Keep the current roll plus ten previous rolls for this owner.
  delete from public.personal_roll_history as history
  where history.owner_id = current_owner_id
    and history.sequence_number < (
      select retained.sequence_number
      from public.personal_roll_history as retained
      where retained.owner_id = current_owner_id
      order by retained.sequence_number desc
      offset 10
      limit 1
    );

  return recorded_roll;
end;
$$;

create or replace function public.delete_personal_roll(
  p_roll_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  history_lock_namespace constant integer := 2;
  current_owner_id uuid;
  deleted_count bigint;
begin
  select auth.uid()
  into current_owner_id;

  if current_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    history_lock_namespace,
    pg_catalog.hashtext(current_owner_id::text)
  );

  delete from public.personal_roll_history as history
  where history.id = p_roll_id
    and history.owner_id = current_owner_id;

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

create or replace function public.clear_personal_roll_history()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  history_lock_namespace constant integer := 2;
  current_owner_id uuid;
  deleted_count bigint;
begin
  select auth.uid()
  into current_owner_id;

  if current_owner_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    history_lock_namespace,
    pg_catalog.hashtext(current_owner_id::text)
  );

  delete from public.personal_roll_history as history
  where history.owner_id = current_owner_id;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- The initial schema grants broad defaults. Revoke them before exposing the
-- minimum reviewed read/RPC surface.

revoke all on table public.custom_dice_presets
  from public, anon, authenticated;
revoke all on table public.personal_roll_history
  from public, anon, authenticated;
revoke all on sequence public.personal_roll_history_sequence_number_seq
  from public, anon, authenticated;

revoke all on function public.create_custom_dice_preset(
  text,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint
) from public, anon, authenticated;
revoke all on function public.update_custom_dice_preset(
  uuid,
  text,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint
) from public, anon, authenticated;
revoke all on function public.delete_custom_dice_preset(uuid)
  from public, anon, authenticated;
revoke all on function public.record_personal_roll(
  uuid,
  text,
  smallint,
  jsonb,
  jsonb
) from public, anon, authenticated;
revoke all on function public.delete_personal_roll(uuid)
  from public, anon, authenticated;
revoke all on function public.clear_personal_roll_history()
  from public, anon, authenticated;

grant select on table public.custom_dice_presets
  to authenticated;
grant select on table public.personal_roll_history
  to authenticated;

grant execute on function public.create_custom_dice_preset(
  text,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint
) to authenticated;
grant execute on function public.update_custom_dice_preset(
  uuid,
  text,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint
) to authenticated;
grant execute on function public.delete_custom_dice_preset(uuid)
  to authenticated;
grant execute on function public.record_personal_roll(
  uuid,
  text,
  smallint,
  jsonb,
  jsonb
) to authenticated;
grant execute on function public.delete_personal_roll(uuid)
  to authenticated;
grant execute on function public.clear_personal_roll_history()
  to authenticated;
