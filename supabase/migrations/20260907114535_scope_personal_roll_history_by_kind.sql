-- Scope personal roll retention and clearing by roller kind. The existing
-- generic table and RPC signature remain compatible with the deployed app.

create index personal_roll_history_owner_kind_sequence_idx
  on public.personal_roll_history(
    owner_id,
    roller_kind,
    sequence_number desc
  );

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

  -- Retain the current roll plus five previous rolls independently per kind.
  delete from public.personal_roll_history as history
  where history.owner_id = current_owner_id
    and history.roller_kind = p_roller_kind
    and history.sequence_number < (
      select retained.sequence_number
      from public.personal_roll_history as retained
      where retained.owner_id = current_owner_id
        and retained.roller_kind = p_roller_kind
      order by retained.sequence_number desc
      offset 5
      limit 1
    );

  return recorded_roll;
end;
$$;

create function public.clear_personal_roll_history_by_kinds(
  p_roller_kinds text[]
)
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

  if p_roller_kinds is null
    or pg_catalog.cardinality(p_roller_kinds) = 0
    or pg_catalog.array_position(p_roller_kinds, null) is not null
  then
    raise exception using
      errcode = '22023',
      message = 'personal_roll_history_scope_invalid';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    history_lock_namespace,
    pg_catalog.hashtext(current_owner_id::text)
  );

  delete from public.personal_roll_history as history
  where history.owner_id = current_owner_id
    and history.roller_kind = any(p_roller_kinds);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.clear_personal_roll_history_by_kinds(text[])
  from public, anon, authenticated;

grant execute on function public.clear_personal_roll_history_by_kinds(text[])
  to authenticated;
