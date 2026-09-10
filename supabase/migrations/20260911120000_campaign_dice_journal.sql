create or replace function public.record_campaign_dice_roll(
  target_campaign_id uuid,
  target_actor_id uuid,
  target_roll_type text,
  target_request jsonb,
  target_result jsonb
)
returns setof public.game_session_journal_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  campaign_row public.campaigns%rowtype;
  session_row public.game_sessions%rowtype;
  character_id uuid;
  actor_name text;
  campaign_system text;
begin
  if target_actor_id is null
     or target_request is null
     or target_result is null
     or jsonb_typeof(target_request) <> 'object'
     or jsonb_typeof(target_result) <> 'object' then
    raise exception using errcode = 'P0001', message = 'campaign_dice_request_invalid';
  end if;

  select * into campaign_row
  from public.campaigns
  where id = target_campaign_id
  for update;

  if not found or campaign_row.status <> 'active' then
    raise exception using errcode = 'P0001', message = 'campaign_dice_not_available';
  end if;

  campaign_system := case campaign_row.game_system
    when 'vtm-v5' then 'vtm-v5'
    when 'Vampire: The Masquerade V5' then 'vtm-v5'
    when 'Vampire: The Masquerade (v5)' then 'vtm-v5'
    when 'call-of-cthulhu-7e' then 'call-of-cthulhu-7e'
    when 'Call of Cthulhu' then 'call-of-cthulhu-7e'
    when 'Call of Cthulhu 7th Edition' then 'call-of-cthulhu-7e'
    else null
  end;

  if campaign_row.game_master_id <> target_actor_id
     and not exists (
       select 1
       from public.campaign_members
       where campaign_id = target_campaign_id
         and user_id = target_actor_id
     ) then
    raise exception using errcode = 'P0001', message = 'campaign_dice_not_available';
  end if;

  if (campaign_system = 'vtm-v5' and target_roll_type <> 'vtm_v5')
     or (
       campaign_system = 'call-of-cthulhu-7e'
       and target_roll_type not in ('coc_7e_percentile', 'coc_7e_other_dice')
     )
     or campaign_system is null then
    raise exception using errcode = 'P0001', message = 'campaign_dice_system_mismatch';
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

  select assignment.character_id, character.name
  into character_id, actor_name
  from public.campaign_characters as assignment
  join public.characters as character
    on character.id = assignment.character_id
  where assignment.campaign_id = target_campaign_id
    and assignment.linked_by = target_actor_id
    and assignment.unlinked_at is null
    and character.owner_id = target_actor_id
    and case character.game_system
      when 'Vampire: The Masquerade V5' then 'vtm-v5'
      when 'Vampire: The Masquerade (v5)' then 'vtm-v5'
      when 'Call of Cthulhu' then 'call-of-cthulhu-7e'
      when 'Call of Cthulhu 7th Edition' then 'call-of-cthulhu-7e'
      else character.game_system
    end = campaign_system
  order by assignment.linked_at, assignment.id
  limit 1;

  if actor_name is null then
    select coalesce(nullif(btrim(display_name), ''), nullif(btrim(username), ''))
    into actor_name
    from public.profiles
    where id = target_actor_id;
  end if;

  return query
  insert into public.game_session_journal_events (
    game_session_id,
    actor_id,
    event_kind,
    schema_version,
    event_data
  )
  values (
    session_row.id,
    target_actor_id,
    'campaign_dice_roll',
    1,
    jsonb_build_object(
      'campaignId', target_campaign_id,
      'gameSystem', campaign_system,
      'rollType', target_roll_type,
      'characterId', character_id,
      'actorDisplayName', actor_name,
      'request', target_request,
      'result', target_result
    )
  )
  returning *;
end;
$$;

revoke all on function public.record_campaign_dice_roll(uuid, uuid, text, jsonb, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.record_campaign_dice_roll(uuid, uuid, text, jsonb, jsonb)
  to service_role;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'game_session_journal_events'
  ) then
    alter publication supabase_realtime
      add table public.game_session_journal_events;
  end if;
end;
$$;
