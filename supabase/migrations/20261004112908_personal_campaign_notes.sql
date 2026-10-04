-- Forward-only, backward-compatible with start_game_session(uuid).
alter table public.game_sessions add column session_number integer,
  add column title text;
with numbered as (
  select id, row_number() over (partition by campaign_id order by started_at, id)::integer as number
  from public.game_sessions
)
update public.game_sessions s set session_number = n.number from numbered n where n.id = s.id;
alter table public.game_sessions alter column session_number set not null,
  add constraint game_sessions_number_positive check (session_number > 0),
  add constraint game_sessions_campaign_number_key unique (campaign_id, session_number),
  add constraint game_sessions_campaign_id_key unique (campaign_id, id),
  add constraint game_sessions_title_valid check (title is null or (length(title) between 1 and 120 and title = btrim(title)));

-- Kept separately from deletable session rows: numbers are never reused.
create table private.game_session_counters (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  last_number integer not null check (last_number > 0)
);
insert into private.game_session_counters (campaign_id, last_number)
select campaign_id, max(session_number) from public.game_sessions group by campaign_id;
revoke all on private.game_session_counters from public, anon, authenticated, service_role;

create function private.enforce_game_session_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.session_number is not null then
      raise exception using errcode = 'P0001', message = 'game_session_identity_immutable';
    end if;
    insert into private.game_session_counters (campaign_id, last_number) values (new.campaign_id, 1)
    on conflict (campaign_id) do update set last_number = private.game_session_counters.last_number + 1
    returning last_number into new.session_number;
    new.title := nullif(regexp_replace(new.title, '^\s+|\s+$', '', 'g'), '');
  elsif new.session_number is distinct from old.session_number
     or new.title is distinct from old.title or new.campaign_id is distinct from old.campaign_id then
    raise exception using errcode = 'P0001', message = 'game_session_identity_immutable';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_game_session_identity() from public, anon, authenticated, service_role;
create trigger enforce_game_session_identity before insert or update on public.game_sessions
for each row execute function private.enforce_game_session_identity();

create function public.start_named_game_session(target_campaign_id uuid, session_title text)
returns setof public.game_sessions language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  campaign_row public.campaigns%rowtype;
  session_row public.game_sessions%rowtype;
begin
  if actor_id is null then
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;
  select * into campaign_row from public.campaigns where id = target_campaign_id for update;
  if not found or campaign_row.status <> 'active' or campaign_row.game_master_id <> actor_id then
    raise exception using errcode = 'P0001', message = 'game_session_not_available';
  end if;
  if length(session_title) > 120 then
    raise exception using errcode = 'P0001', message = 'malformed_request';
  end if;
  update public.game_sessions set ended_at = greatest(now(), started_at), end_reason = 'timeout'
  where campaign_id = target_campaign_id and ended_at is null and presence_expires_at <= now();
  insert into public.game_sessions (campaign_id, started_by, title)
  values (target_campaign_id, actor_id, session_title) returning * into session_row;
  return next session_row;
end;
$$;
create or replace function public.start_game_session(target_campaign_id uuid)
returns setof public.game_sessions language sql security definer set search_path = '' as $$
  select * from public.start_named_game_session(target_campaign_id, null);
$$;
revoke all on function public.start_named_game_session(uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.start_named_game_session(uuid, text) to authenticated;

create table public.campaign_note_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 20000 and body ~ '\S'),
  campaign_name_snapshot text not null,
  created_at timestamptz not null,
  created_timezone text not null,
  edited_at timestamptz,
  edited_timezone text,
  game_session_id uuid,
  constraint campaign_note_session_campaign_fk foreign key (campaign_id, game_session_id)
    references public.game_sessions(campaign_id, id) on delete set null (game_session_id),
  constraint campaign_note_edit_pair check ((edited_at is null) = (edited_timezone is null))
);
create index campaign_note_entries_owner_campaign_created_idx
  on public.campaign_note_entries(owner_id, campaign_id, created_at, id);
create index campaign_note_entries_session_idx on public.campaign_note_entries(campaign_id, game_session_id)
  where game_session_id is not null;
alter table public.campaign_note_entries enable row level security;
create policy "Owners alone read personal campaign notes" on public.campaign_note_entries
for select to authenticated using (owner_id = (select auth.uid()));
revoke all on public.campaign_note_entries from public, anon, authenticated, service_role;
grant select on public.campaign_note_entries to authenticated;

create function private.enforce_campaign_note_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.owner_id is distinct from old.owner_id or new.campaign_id is distinct from old.campaign_id
    or new.created_at is distinct from old.created_at or new.created_timezone is distinct from old.created_timezone
    or new.campaign_name_snapshot is distinct from old.campaign_name_snapshot
    or (new.game_session_id is distinct from old.game_session_id
      and not (new.game_session_id is null and pg_trigger_depth() > 1)) then
    raise exception using errcode = 'P0001', message = 'campaign_note_identity_immutable';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_campaign_note_identity() from public, anon, authenticated, service_role;
create trigger enforce_campaign_note_identity before update on public.campaign_note_entries
for each row execute function private.enforce_campaign_note_identity();

create function public.mutate_campaign_note(
  target_campaign_id uuid, action text, target_entry_id uuid default null,
  entry_body text default null, entry_timezone text default null
)
returns setof public.campaign_note_entries language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  campaign_row public.campaigns%rowtype;
  note_row public.campaign_note_entries%rowtype;
  active_session_id uuid;
begin
  if actor_id is null then
    raise exception using errcode = 'P0001', message = 'authentication_required';
  end if;
  -- Completion and membership removal use the same campaign lock boundary.
  select * into campaign_row from public.campaigns where id = target_campaign_id for update;
  if not found or campaign_row.status <> 'active' or not (
    campaign_row.game_master_id = actor_id or exists (
      select 1 from public.campaign_members where campaign_id = target_campaign_id and user_id = actor_id
    )
  ) then
    raise exception using errcode = 'P0001', message = 'campaign_notes_read_only';
  end if;
  if action is null or action not in ('create', 'edit', 'delete')
    or (action = 'create' and target_entry_id is not null)
    or (action <> 'create' and target_entry_id is null) then
    raise exception using errcode = 'P0001', message = 'malformed_request';
  end if;
  if action in ('create', 'edit') and (
    entry_body is null or length(entry_body) not between 1 and 20000 or entry_body !~ '\S'
    or entry_timezone is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = entry_timezone)
  ) then
    raise exception using errcode = 'P0001', message = 'malformed_request';
  end if;
  if action = 'delete' and (entry_body is not null or entry_timezone is not null) then
    raise exception using errcode = 'P0001', message = 'malformed_request';
  end if;
  if action = 'create' then
    -- Lock against cron expiry; Start/End already serialize on campaign above.
    select id into active_session_id from public.game_sessions
    where campaign_id = target_campaign_id and ended_at is null for update;
    if not exists (select 1 from public.game_sessions where id = active_session_id
      and ended_at is null and presence_expires_at > clock_timestamp()) then
      active_session_id := null;
    end if;
    insert into public.campaign_note_entries (
      campaign_id, owner_id, body, campaign_name_snapshot, created_at, created_timezone, game_session_id
    ) values (target_campaign_id, actor_id, entry_body, campaign_row.name,
      clock_timestamp(), entry_timezone, active_session_id) returning * into note_row;
  elsif action = 'edit' then
    update public.campaign_note_entries set body = entry_body, edited_at = clock_timestamp(), edited_timezone = entry_timezone
    where id = target_entry_id and campaign_id = target_campaign_id and owner_id = actor_id returning * into note_row;
    if not found then
      raise exception using errcode = 'P0001', message = 'campaign_note_unavailable';
    end if;
  else
    delete from public.campaign_note_entries
    where id = target_entry_id and campaign_id = target_campaign_id and owner_id = actor_id returning * into note_row;
    if not found then
      raise exception using errcode = 'P0001', message = 'campaign_note_unavailable';
    end if;
  end if;
  return next note_row;
end;
$$;
revoke all on function public.mutate_campaign_note(uuid, text, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.mutate_campaign_note(uuid, text, uuid, text, text) to authenticated;
-- Personal Notes intentionally NOT added to supabase_realtime.
