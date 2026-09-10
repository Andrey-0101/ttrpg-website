create extension if not exists pg_cron with schema pg_catalog;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  started_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  presence_expires_at timestamptz not null default (now() + interval '60 minutes'),
  ended_at timestamptz,
  end_reason text,
  constraint game_sessions_presence_after_start
    check (presence_expires_at > started_at),
  constraint game_sessions_end_state_consistent
    check (
      (ended_at is null and end_reason is null)
      or
      (ended_at is not null and end_reason in ('explicit', 'timeout', 'campaign_completed'))
    ),
  constraint game_sessions_end_after_start
    check (ended_at is null or ended_at >= started_at)
);

create unique index game_sessions_one_active_per_campaign_idx
  on public.game_sessions(campaign_id)
  where ended_at is null;
create index game_sessions_campaign_started_idx
  on public.game_sessions(campaign_id, started_at desc);
create index game_sessions_expiry_idx
  on public.game_sessions(presence_expires_at)
  where ended_at is null;

create table public.game_session_journal_events (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_kind text not null,
  schema_version smallint not null default 1,
  event_data jsonb not null,
  created_at timestamptz not null default now(),
  constraint game_session_journal_event_kind_valid
    check (event_kind ~ '^[a-z][a-z0-9_]{0,63}$'),
  constraint game_session_journal_schema_version_valid
    check (schema_version between 1 and 32767),
  constraint game_session_journal_event_data_object
    check (jsonb_typeof(event_data) = 'object'),
  constraint game_session_journal_event_data_size
    check (pg_column_size(event_data) <= 16384)
);

create index game_session_journal_events_session_created_idx
  on public.game_session_journal_events(game_session_id, created_at, id);

alter table public.game_sessions enable row level security;
alter table public.game_session_journal_events enable row level security;

create policy "Campaign participants can read game sessions"
on public.game_sessions
for select
to authenticated
using (public.current_user_can_access_campaign(campaign_id));

create policy "Campaign participants can read session journal events"
on public.game_session_journal_events
for select
to authenticated
using (
  exists (
    select 1
    from public.game_sessions as session
    where session.id = game_session_id
      and public.current_user_can_access_campaign(session.campaign_id)
  )
);

create or replace function private.expire_game_sessions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired_count integer;
begin
  update public.game_sessions
  set ended_at = greatest(now(), started_at),
      end_reason = 'timeout'
  where ended_at is null
    and presence_expires_at <= now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

create or replace function public.start_game_session(target_campaign_id uuid)
returns setof public.game_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  campaign_row public.campaigns%rowtype;
  session_row public.game_sessions%rowtype;
begin
  if actor_id is null then
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;

  select * into campaign_row
  from public.campaigns
  where id = target_campaign_id
  for update;

  if not found or campaign_row.status <> 'active'
     or campaign_row.game_master_id <> actor_id then
    raise exception using errcode = 'P0001', message = 'game_session_not_available';
  end if;

  update public.game_sessions
  set ended_at = greatest(now(), started_at),
      end_reason = 'timeout'
  where campaign_id = target_campaign_id
    and ended_at is null
    and presence_expires_at <= now();

  insert into public.game_sessions (campaign_id, started_by)
  values (target_campaign_id, actor_id)
  returning * into session_row;

  return next session_row;
end;
$$;

create or replace function public.end_game_session(target_campaign_id uuid)
returns setof public.game_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  session_row public.game_sessions%rowtype;
begin
  if actor_id is null then
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;

  perform 1
  from public.campaigns
  where id = target_campaign_id
    and status = 'active'
    and game_master_id = actor_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'game_session_not_available';
  end if;

  update public.game_sessions
  set ended_at = greatest(now(), started_at),
      end_reason = 'explicit'
  where campaign_id = target_campaign_id
    and ended_at is null
  returning * into session_row;

  if not found then
    raise exception using errcode = 'P0001', message = 'game_session_not_active';
  end if;

  return next session_row;
end;
$$;

create or replace function public.renew_game_session_presence(target_campaign_id uuid)
returns setof public.game_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  session_row public.game_sessions%rowtype;
begin
  if actor_id is null then
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;

  perform 1
  from public.campaigns
  where id = target_campaign_id
    and status = 'active'
    and game_master_id = actor_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'game_session_not_available';
  end if;

  select * into session_row
  from public.game_sessions
  where campaign_id = target_campaign_id
    and ended_at is null
  for update;

  if not found then
    return;
  end if;

  if session_row.presence_expires_at <= now() then
    update public.game_sessions
    set ended_at = greatest(now(), started_at),
        end_reason = 'timeout'
    where id = session_row.id;
    return;
  end if;

  update public.game_sessions
  set presence_expires_at = now() + interval '60 minutes'
  where id = session_row.id
  returning * into session_row;

  return next session_row;
end;
$$;

create or replace function public.enforce_open_game_session_journal_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_campaign_id uuid;
  session_deadline timestamptz;
  session_ended_at timestamptz;
  campaign_status text;
begin
  select session.campaign_id, session.presence_expires_at, session.ended_at,
         campaign.status
  into session_campaign_id, session_deadline, session_ended_at, campaign_status
  from public.game_sessions as session
  join public.campaigns as campaign on campaign.id = session.campaign_id
  where session.id = new.game_session_id
  for update of session;

  if not found or session_ended_at is not null or campaign_status <> 'active' then
    raise exception using errcode = 'P0001', message = 'game_session_not_active';
  end if;

  if session_deadline <= now() then
    raise exception using errcode = 'P0001', message = 'game_session_not_active';
  end if;

  if not exists (
    select 1
    from public.campaigns
    where id = session_campaign_id
      and game_master_id = new.actor_id
    union all
    select 1
    from public.campaign_members
    where campaign_id = session_campaign_id
      and user_id = new.actor_id
  ) then
    raise exception using errcode = 'P0001', message = 'game_session_actor_not_available';
  end if;

  return new;
end;
$$;

create trigger enforce_open_game_session_journal_event
before insert on public.game_session_journal_events
for each row execute function public.enforce_open_game_session_journal_event();

create or replace function public.handle_campaign_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'active' and new.status = 'completed' then
    update public.campaign_invitations
    set revoked_at = now()
    where campaign_id = new.id
      and accepted_at is null
      and revoked_at is null;

    update public.campaign_characters
    set unlinked_at = now()
    where campaign_id = new.id
      and unlinked_at is null;

    update public.game_sessions
    set ended_at = greatest(now(), started_at),
        end_reason = 'campaign_completed'
    where campaign_id = new.id
      and ended_at is null;
  end if;

  return new;
end;
$$;

revoke all on table public.game_sessions
  from public, anon, authenticated, service_role;
revoke all on table public.game_session_journal_events
  from public, anon, authenticated, service_role;
grant select on table public.game_sessions to authenticated;
grant select on table public.game_session_journal_events to authenticated;

revoke all on function private.expire_game_sessions()
  from public, anon, authenticated, service_role;
revoke all on function public.start_game_session(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.end_game_session(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.renew_game_session_presence(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.enforce_open_game_session_journal_event()
  from public, anon, authenticated, service_role;
revoke all on function public.handle_campaign_completed()
  from public, anon, authenticated, service_role;

grant execute on function public.start_game_session(uuid) to authenticated;
grant execute on function public.end_game_session(uuid) to authenticated;
grant execute on function public.renew_game_session_presence(uuid) to authenticated;

select cron.schedule(
  'expire-stale-game-sessions',
  '* * * * *',
  $cron$select private.expire_game_sessions();$cron$
);
