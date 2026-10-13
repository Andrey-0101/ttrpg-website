-- Applied migrations are immutable. No role is granted by this migration.
create table public.system_user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role = 'developer'),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  primary key (user_id, role),
  check (revoked_at is null or revoked_at >= granted_at)
);
alter table public.system_user_roles enable row level security;
revoke all on public.system_user_roles from public, anon, authenticated;
grant select on public.system_user_roles to authenticated;
grant all on public.system_user_roles to service_role;
create policy "Read own system role" on public.system_user_roles for select to authenticated
  using (user_id = (select auth.uid()));

create table public.game_room_diagnostic_runs (
  id uuid primary key default gen_random_uuid(),
  -- Preserve the artifact registry if a campaign/user is deleted.
  campaign_id uuid references public.campaigns(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  campaign_name text not null,
  owner_session_hash text not null,
  state text not null default 'recording' check (state in ('recording','stopping','ready','expired','deleted')),
  started_at timestamptz not null default clock_timestamp(),
  owner_heartbeat_at timestamptz not null default clock_timestamp(),
  stopped_at timestamptz,
  stop_deadline timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  cleanup_requested_at timestamptz,
  stop_reason text check (stop_reason in ('explicit','route_exit','owner_abandoned','role_revoked','campaign_inactive','quota')),
  revision bigint not null default 1,
  partial boolean not null default false,
  reserved_bytes bigint not null default 0 check (reserved_bytes between 0 and 268435456),
  server_build jsonb not null default '{}'::jsonb check (pg_column_size(server_build) <= 2048),
  check ((state = 'recording' and stopped_at is null and stop_deadline is null)
    or (state <> 'recording' and stopped_at is not null and stop_deadline is not null)),
  check (expires_at is null or (completed_at is not null and expires_at = completed_at + interval '12 hours'))
);
create unique index diagnostic_runs_one_campaign on public.game_room_diagnostic_runs(campaign_id)
  where state in ('recording','stopping');
create unique index diagnostic_runs_one_developer on public.game_room_diagnostic_runs(owner_id)
  where state in ('recording','stopping');
create index diagnostic_runs_expiry on public.game_room_diagnostic_runs(expires_at) where state = 'ready';
create index diagnostic_runs_owner on public.game_room_diagnostic_runs(owner_id, started_at desc);
create index diagnostic_runs_campaign on public.game_room_diagnostic_runs(campaign_id, started_at desc);
create index diagnostic_runs_abandonment on public.game_room_diagnostic_runs(owner_heartbeat_at) where state = 'recording';

create table public.game_room_diagnostic_clients (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.game_room_diagnostic_runs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  instance_id uuid not null,
  alias uuid not null default gen_random_uuid(),
  epoch integer not null check (epoch > 0),
  role text not null check (role in ('game_master','player')),
  slot smallint check (slot between 1 and 6),
  state text not null default 'collecting' check (state in ('collecting','finished','fenced')),
  joined_at timestamptz not null default clock_timestamp(),
  heartbeat_at timestamptz not null default clock_timestamp(),
  lease_until timestamptz not null default (clock_timestamp() + interval '60 seconds'),
  visibility text not null default 'foreground' check (visibility in ('foreground','background')),
  checkpoint_at timestamptz,
  valid_progress_at timestamptz,
  last_sample_sequence bigint not null default -1,
  next_sequence integer not null default 0 check (next_sequence >= 0),
  final_at timestamptz,
  error text check (error in ('get_stats_failed','indexeddb_failed','outbox_limit','upload_failed','run_limit','lease_expired')),
  unique (run_id, user_id, instance_id)
);
create unique index diagnostic_clients_current on public.game_room_diagnostic_clients(run_id, user_id) where state = 'collecting';
create index diagnostic_clients_user on public.game_room_diagnostic_clients(user_id);

create table public.game_room_diagnostic_chunks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.game_room_diagnostic_runs(id) on delete cascade,
  client_id uuid not null references public.game_room_diagnostic_clients(id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  compressed_bytes integer not null check (compressed_bytes between 1 and 262144),
  expanded_bytes integer not null check (expanded_bytes between 1 and 1048576),
  record_count integer not null check (record_count between 1 and 2048),
  last_record_sequence bigint not null check (last_record_sequence >= 0),
  progress_at timestamptz,
  storage_path text not null unique,
  state text not null default 'reserved' check (state in ('reserved','accepted','cleanup_pending','deleted')),
  created_at timestamptz not null default clock_timestamp(),
  accepted_at timestamptz,
  cleanup_token uuid,
  cleanup_lease_until timestamptz,
  unique (client_id, sequence)
);
create index diagnostic_chunks_cleanup on public.game_room_diagnostic_chunks(state, created_at);
create index diagnostic_chunks_run on public.game_room_diagnostic_chunks(run_id, client_id, sequence);

alter table public.game_room_diagnostic_runs enable row level security;
alter table public.game_room_diagnostic_clients enable row level security;
alter table public.game_room_diagnostic_chunks enable row level security;
revoke all on public.game_room_diagnostic_runs, public.game_room_diagnostic_clients, public.game_room_diagnostic_chunks from public, anon, authenticated;
grant select on public.game_room_diagnostic_runs to authenticated;
grant all on public.game_room_diagnostic_runs, public.game_room_diagnostic_clients, public.game_room_diagnostic_chunks to service_role;
create policy "Read contextual diagnostic control" on public.game_room_diagnostic_runs for select to authenticated using (
  (state in ('recording','stopping') and public.current_user_can_access_campaign(campaign_id))
  or (owner_id = (select auth.uid()) and exists (select 1 from public.system_user_roles r where r.user_id = (select auth.uid()) and r.revoked_at is null)
    and public.current_user_is_campaign_game_master(campaign_id))
);

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
  values ('game-room-diagnostics','game-room-diagnostics',false,262144,array['application/gzip'])
  on conflict (id) do nothing;
-- No browser Storage policies: uploads/downloads use bounded authorized server routes.

create function private.diagnostic_reconcile(target_run uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.game_room_diagnostic_runs%rowtype; reason text; moment timestamptz := clock_timestamp();
begin
  select * into r from public.game_room_diagnostic_runs where id = target_run for update;
  if not found then return; end if;
  if r.state = 'recording' then
    if not exists (select 1 from public.system_user_roles where user_id = r.owner_id and revoked_at is null) then reason := 'role_revoked';
    elsif not exists (select 1 from public.campaigns where id = r.campaign_id and game_master_id = r.owner_id and status = 'active') then reason := 'campaign_inactive';
    elsif r.owner_heartbeat_at < moment - interval '180 seconds' or not exists (
      select 1 from auth.sessions s where s.user_id = r.owner_id
        and encode(extensions.digest(s.id::text, 'sha256'), 'hex') = r.owner_session_hash
        and (s.not_after is null or s.not_after > moment)) then reason := 'owner_abandoned';
    end if;
    if reason is not null then
      update public.game_room_diagnostic_runs set state = 'stopping', stopped_at = moment,
        stop_deadline = moment + interval '30 seconds', stop_reason = reason, revision = revision + 1 where id = target_run;
      r.state := 'stopping'; r.stop_deadline := moment + interval '30 seconds';
    end if;
  end if;
  if r.state = 'stopping' and (r.stop_deadline <= moment or not exists (
    select 1 from public.game_room_diagnostic_clients where run_id = target_run and state = 'collecting')) then
    update public.game_room_diagnostic_runs set state = 'ready', completed_at = moment,
      expires_at = moment + interval '12 hours', revision = revision + 1,
      partial = partial or exists (select 1 from public.game_room_diagnostic_clients where run_id = target_run and (final_at is null or error is not null or valid_progress_at is null))
      where id = target_run;
  elsif r.state = 'ready' and r.expires_at <= moment then
    update public.game_room_diagnostic_runs set state = 'expired', revision = revision + 1 where id = target_run;
  end if;
end;
$$;
revoke all on function private.diagnostic_reconcile(uuid) from public, anon, authenticated, service_role;

-- All actor IDs/session IDs originate from verified server authentication, never request JSON.
-- One service-role-only transactional boundary serializes Start, Stop and quota reservations.
create function public.diagnostic_dispatch(
  actor_id uuid, auth_session_id uuid, operation text,
  target_campaign uuid default null, target_run uuid default null, input jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  r public.game_room_diagnostic_runs%rowtype; c public.game_room_diagnostic_clients%rowtype;
  chunk public.game_room_diagnostic_chunks%rowtype; campaign public.campaigns%rowtype;
  moment timestamptz := clock_timestamp(); is_developer boolean; is_owner boolean; is_member boolean;
  alias_id uuid; next_epoch integer; slot_number smallint; new_id uuid;
begin
  if actor_id is null or auth_session_id is null or not exists (
    select 1 from auth.sessions s where s.id = auth_session_id and s.user_id = actor_id
      and (s.not_after is null or s.not_after > moment)) then raise exception 'authentication_required'; end if;
  select exists (select 1 from public.system_user_roles where user_id = actor_id and revoked_at is null) into is_developer;
  if operation = 'capability' then return jsonb_build_object('developer', is_developer); end if;
  if operation = 'owner' then
    if not is_developer then raise exception 'developer_required'; end if;
    select * into r from public.game_room_diagnostic_runs where owner_id = actor_id and state in ('recording','stopping','ready') order by started_at desc limit 1;
    if not found then return 'null'::jsonb; end if;
    target_run := r.id; target_campaign := r.campaign_id; operation := 'state';
  end if;
  if target_run is not null then
    select * into r from public.game_room_diagnostic_runs where id = target_run;
    if not found then raise exception 'run_unavailable'; end if;
    target_campaign := r.campaign_id;
  end if;
  select * into campaign from public.campaigns where id = target_campaign;
  if not found then raise exception 'campaign_unavailable'; end if;
  is_owner := campaign.game_master_id = actor_id;
  is_member := is_owner or (campaign.status = 'active' and exists (select 1 from public.campaign_members where campaign_id = target_campaign and user_id = actor_id));
  if not is_member then raise exception 'campaign_unavailable'; end if;
  if operation = 'start' then
    if not is_developer or not is_owner or campaign.status <> 'active' then raise exception 'developer_gm_required'; end if;
    perform pg_advisory_xact_lock(hashtextextended('diagnostic-owner:' || actor_id::text, 0));
    perform 1 from public.campaigns where id = target_campaign and status = 'active' and game_master_id = actor_id for share;
    if not found then raise exception 'campaign_unavailable'; end if;
    select * into r from public.game_room_diagnostic_runs where owner_id = actor_id and state in ('recording','stopping') for update;
    if found then
      perform private.diagnostic_reconcile(r.id);
      select * into r from public.game_room_diagnostic_runs where id = r.id;
      if r.state = 'recording' and r.campaign_id = target_campaign then return to_jsonb(r); end if;
      if r.state in ('recording','stopping') then raise exception 'run_conflict'; end if;
    end if;
    insert into public.game_room_diagnostic_runs(campaign_id, owner_id, campaign_name, owner_session_hash, server_build)
      values (target_campaign, actor_id, campaign.name, encode(extensions.digest(auth_session_id::text,'sha256'),'hex'), coalesce(input->'build','{}')) returning * into r;
    return to_jsonb(r);
  end if;
  if target_run is null then
    select * into r from public.game_room_diagnostic_runs where campaign_id = target_campaign
      and (state in ('recording','stopping') or (is_developer and owner_id = actor_id and state = 'ready' and expires_at > moment)) order by started_at desc limit 1;
    if not found then return 'null'::jsonb; end if;
    target_run := r.id;
  end if;
  perform private.diagnostic_reconcile(target_run);
  select * into r from public.game_room_diagnostic_runs where id = target_run for update;
  if operation in ('stop','export','request_cleanup','owner_heartbeat') then
    if not is_developer or not is_owner or r.owner_id <> actor_id then raise exception 'developer_gm_required'; end if;
  elsif operation <> 'state' and campaign.status <> 'active' then raise exception 'campaign_unavailable'; end if;
  if operation = 'state' then
    if r.state not in ('recording','stopping') and (not is_developer or r.owner_id <> actor_id or not is_owner) then return 'null'::jsonb; end if;
    return to_jsonb(r) - 'owner_session_hash';
  elsif operation = 'owner_heartbeat' then
    if r.state = 'recording' and r.owner_session_hash = encode(extensions.digest(auth_session_id::text,'sha256'),'hex') then
      update public.game_room_diagnostic_runs set owner_heartbeat_at = moment where id = target_run;
    end if;
    return to_jsonb(r) - 'owner_session_hash';
  elsif operation = 'stop' then
    if r.state = 'recording' then
      update public.game_room_diagnostic_runs set state = 'stopping', stopped_at = moment, stop_deadline = moment + interval '30 seconds',
        stop_reason = case when input->>'reason' = 'route_exit' then 'route_exit' else 'explicit' end, revision = revision + 1 where id = target_run;
    end if;
    perform private.diagnostic_reconcile(target_run);
    select * into r from public.game_room_diagnostic_runs where id = target_run;
    return to_jsonb(r) - 'owner_session_hash';
  elsif operation in ('export','request_cleanup') then
    if r.state <> 'ready' or r.expires_at <= moment or r.cleanup_requested_at is not null then raise exception 'export_unavailable'; end if;
    if operation = 'request_cleanup' then
      update public.game_room_diagnostic_runs set cleanup_requested_at = moment where id = target_run;
    end if;
    return to_jsonb(r) - 'owner_session_hash';
  end if;
  if r.state not in ('recording','stopping') or (r.state = 'stopping' and r.stop_deadline <= moment) then raise exception 'collection_closed'; end if;
  if operation = 'join' then
    if r.state <> 'recording' then raise exception 'collection_closed'; end if;
    select * into c from public.game_room_diagnostic_clients where run_id = target_run and user_id = actor_id and instance_id = (input->>'instance')::uuid;
    if found then
      if c.state <> 'collecting' or c.lease_until <= moment then raise exception 'segment_fenced'; end if;
      return to_jsonb(c);
    end if;
    select alias, epoch + 1 into alias_id, next_epoch from public.game_room_diagnostic_clients where run_id = target_run and user_id = actor_id order by epoch desc limit 1;
    update public.game_room_diagnostic_clients set state = 'fenced' where run_id = target_run and user_id = actor_id and state = 'collecting';
    select display_order into slot_number from public.campaign_members where campaign_id = target_campaign and user_id = actor_id;
    insert into public.game_room_diagnostic_clients(run_id,user_id,instance_id,alias,epoch,role,slot)
      values(target_run,actor_id,(input->>'instance')::uuid,coalesce(alias_id,gen_random_uuid()),coalesce(next_epoch,1),case when is_owner then 'game_master' else 'player' end,slot_number) returning * into c;
    update public.game_room_diagnostic_runs set revision = revision + 1 where id = target_run;
    return to_jsonb(c);
  end if;
  select * into c from public.game_room_diagnostic_clients where id = (input->>'segment')::uuid and run_id = target_run and user_id = actor_id for update;
  if not found or c.state <> 'collecting' or c.lease_until <= moment or c.epoch <> (input->>'epoch')::integer then raise exception 'segment_fenced'; end if;
  if operation = 'heartbeat' then
    update public.game_room_diagnostic_clients set heartbeat_at = moment,
      visibility = case when input->>'visibility' = 'background' then 'background' else 'foreground' end,
      lease_until = moment + case when input->>'visibility' = 'background' then interval '130 seconds' else interval '60 seconds' end,
      error = case when input->>'error' in ('get_stats_failed','indexeddb_failed','outbox_limit','upload_failed','run_limit','lease_expired') then input->>'error' else null end
      where id = c.id;
    return jsonb_build_object('lease_until', moment + case when input->>'visibility' = 'background' then interval '130 seconds' else interval '60 seconds' end);
  elsif operation = 'reserve' then
    select * into chunk from public.game_room_diagnostic_chunks where client_id = c.id and sequence = (input->>'sequence')::integer;
    if found then
      if chunk.sha256 <> input->>'sha256' or chunk.compressed_bytes <> (input->>'compressed_bytes')::integer or chunk.expanded_bytes <> (input->>'expanded_bytes')::integer then raise exception 'chunk_conflict'; end if;
      if chunk.state not in ('reserved','accepted') then raise exception 'collection_closed'; end if;
      return to_jsonb(chunk);
    end if;
    if (input->>'sequence')::integer <> c.next_sequence or (input->>'last_record_sequence')::bigint <= c.last_sample_sequence then raise exception 'sequence_conflict'; end if;
    if r.reserved_bytes + (input->>'compressed_bytes')::integer > 268435456 then raise exception 'run_limit'; end if;
    if exists (select 1 from public.game_room_diagnostic_chunks where client_id = c.id and created_at > moment - interval '1 second') then raise exception 'upload_rate'; end if;
    new_id := gen_random_uuid();
    insert into public.game_room_diagnostic_chunks(id,run_id,client_id,sequence,sha256,compressed_bytes,expanded_bytes,record_count,last_record_sequence,progress_at,storage_path)
      values(new_id,target_run,c.id,(input->>'sequence')::integer,input->>'sha256',(input->>'compressed_bytes')::integer,
        (input->>'expanded_bytes')::integer,(input->>'record_count')::integer,(input->>'last_record_sequence')::bigint,
        (input->>'progress_at')::timestamptz,target_run::text || '/' || c.id::text || '/' || new_id::text || '.ndjson.gz') returning * into chunk;
    update public.game_room_diagnostic_runs set reserved_bytes = reserved_bytes + chunk.compressed_bytes where id = target_run;
    return to_jsonb(chunk);
  elsif operation = 'accept' then
    select * into chunk from public.game_room_diagnostic_chunks where id = (input->>'chunk')::uuid and client_id = c.id for update;
    if not found or chunk.state not in ('reserved','accepted') then raise exception 'chunk_unavailable'; end if;
    if chunk.state = 'reserved' then
      if chunk.sequence <> c.next_sequence then raise exception 'sequence_conflict'; end if;
      update public.game_room_diagnostic_chunks set state = 'accepted', accepted_at = moment where id = chunk.id;
      update public.game_room_diagnostic_clients set next_sequence = next_sequence + 1, checkpoint_at = moment,
        last_sample_sequence = chunk.last_record_sequence,
        valid_progress_at = case when chunk.progress_at <= moment + interval '5 seconds' and chunk.progress_at >= moment - interval '120 seconds'
          then greatest(valid_progress_at, least(moment,chunk.progress_at)) else valid_progress_at end where id = c.id;
    end if;
    return jsonb_build_object('accepted',true,'sequence',chunk.sequence);
  elsif operation = 'final' then
    if (input->>'next_sequence')::integer <> c.next_sequence or exists(select 1 from public.game_room_diagnostic_chunks where client_id = c.id and state = 'reserved') then raise exception 'final_incomplete'; end if;
    update public.game_room_diagnostic_clients set state = 'finished', final_at = moment where id = c.id;
    update public.game_room_diagnostic_runs set revision = revision + 1 where id = target_run;
    perform private.diagnostic_reconcile(target_run);
    return jsonb_build_object('finished',true);
  end if;
  raise exception 'malformed_request';
exception when unique_violation then raise exception 'run_conflict';
end;
$$;
revoke all on function public.diagnostic_dispatch(uuid,uuid,text,uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.diagnostic_dispatch(uuid,uuid,text,uuid,uuid,jsonb) to service_role;

create function private.diagnostic_tick() returns void language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  for target in select id from public.game_room_diagnostic_runs where state in ('recording','stopping') or (state = 'ready' and expires_at <= clock_timestamp()) order by owner_heartbeat_at limit 200
  loop perform private.diagnostic_reconcile(target); end loop;
end;
$$;
revoke all on function private.diagnostic_tick() from public, anon, authenticated, service_role;
select cron.schedule('reconcile-diagnostic-runs','* * * * *','select private.diagnostic_tick();');

create function private.stop_revoked_diagnostic_runs() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.revoked_at is not null then
    update public.game_room_diagnostic_runs set state = 'stopping', stopped_at = clock_timestamp(), stop_deadline = clock_timestamp() + interval '30 seconds',
      stop_reason = 'role_revoked', revision = revision + 1 where owner_id = new.user_id and state = 'recording';
  end if;
  return new;
end;
$$;
revoke all on function private.stop_revoked_diagnostic_runs() from public, anon, authenticated, service_role;
create trigger system_role_diagnostic_revocation after update of revoked_at on public.system_user_roles for each row execute function private.stop_revoked_diagnostic_runs();

alter publication supabase_realtime add table public.game_room_diagnostic_runs;

create function public.diagnostic_cleanup_claim(only_run uuid default null) returns setof public.game_room_diagnostic_chunks
language plpgsql security definer set search_path = '' as $$
begin
  perform private.diagnostic_tick();
  return query with targets as (
    select ch.id from public.game_room_diagnostic_chunks ch join public.game_room_diagnostic_runs r on r.id = ch.run_id
      join public.game_room_diagnostic_clients c on c.id = ch.client_id
    where (only_run is null or ch.run_id = only_run) and ch.state <> 'deleted'
      and (ch.cleanup_lease_until is null or ch.cleanup_lease_until <= clock_timestamp())
      and (r.state in ('expired','deleted') or r.cleanup_requested_at is not null
        or (ch.state = 'reserved' and ch.created_at < clock_timestamp() - interval '5 minutes'
          and (r.state = 'ready' or c.state <> 'collecting' or c.lease_until <= clock_timestamp())))
    order by ch.created_at limit 100 for update of ch skip locked
  ) update public.game_room_diagnostic_chunks ch set state = 'cleanup_pending', cleanup_token = gen_random_uuid(), cleanup_lease_until = clock_timestamp() + interval '2 minutes'
    from targets where ch.id = targets.id returning ch.*;
end;
$$;
create function public.diagnostic_cleanup_ack(chunk_id uuid, claim_token uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  update public.game_room_diagnostic_chunks set state = 'deleted', cleanup_lease_until = null
    where id = chunk_id and cleanup_token = claim_token and state = 'cleanup_pending' returning run_id into target;
  if not found then return false; end if;
  update public.game_room_diagnostic_runs set state = 'deleted', revision = revision + 1
    where id = target and state in ('ready','expired') and (cleanup_requested_at is not null or expires_at <= clock_timestamp())
      and not exists(select 1 from public.game_room_diagnostic_chunks where run_id = target and state <> 'deleted');
  return true;
end;
$$;
revoke all on function public.diagnostic_cleanup_claim(uuid), public.diagnostic_cleanup_ack(uuid,uuid) from public, anon, authenticated;
grant execute on function public.diagnostic_cleanup_claim(uuid), public.diagnostic_cleanup_ack(uuid,uuid) to service_role;
