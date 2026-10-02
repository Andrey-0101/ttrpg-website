-- Phase 4F2: preserve the existing assignment model and RLS boundaries.
-- Fail closed on legacy conflicts; never choose or unlink a Production row.
do $$
begin
  if exists (
    select 1 from public.campaign_characters
    where unlinked_at is null
    group by campaign_id, linked_by having count(*) > 1
  ) then
    raise exception 'Duplicate active campaign player assignments require manual resolution';
  end if;
  if exists (
    select 1 from public.campaign_characters a
    join public.campaigns c on c.id = a.campaign_id
    where a.unlinked_at is null and a.linked_by = c.game_master_id
  ) then
    raise exception 'Active Game Master assignments require manual resolution';
  end if;
end;
$$;

create unique index campaign_characters_one_active_player_idx
on public.campaign_characters (campaign_id, linked_by)
where unlinked_at is null;

create or replace function public.enforce_campaign_character_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  campaign_status text;
  campaign_game_master_id uuid;
  campaign_game_system text;
  character_owner_id uuid;
  character_visibility text;
  character_game_system text;
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.campaign_id is distinct from old.campaign_id
      or new.character_id is distinct from old.character_id
      or new.linked_by is distinct from old.linked_by
      or new.linked_at is distinct from old.linked_at
    then
      raise exception 'Character assignment identity fields cannot be changed';
    end if;
    if old.unlinked_at is not null and new.unlinked_at is distinct from old.unlinked_at then
      raise exception 'An unlinked assignment cannot be reopened or changed';
    end if;
    if old.unlinked_at is null and new.unlinked_at is not null then
      -- Serialize with the canonical Start/End/renew campaign lock. This also
      -- covers automatic unlink from character edits and membership removal.
      perform 1 from public.campaigns where id = old.campaign_id for update;
      if exists (
        select 1 from public.game_sessions
        where campaign_id = old.campaign_id
          and ended_at is null and presence_expires_at > now()
      ) then
        raise exception 'campaign_character_active_session';
      end if;
      new.unlinked_at := now();
    end if;
    return new;
  end if;

  select status, game_master_id, game_system
  into campaign_status, campaign_game_master_id, campaign_game_system
  from public.campaigns where id = new.campaign_id for share;
  select owner_id, visibility, game_system
  into character_owner_id, character_visibility, character_game_system
  from public.characters where id = new.character_id for share;
  if campaign_status is null then
    raise exception 'Campaign does not exist';
  end if;
  if campaign_status <> 'active' then
    raise exception 'Character assignment requires an active campaign';
  end if;
  if new.linked_by = campaign_game_master_id and new.unlinked_at is null then
    raise exception 'campaign_character_game_master';
  end if;
  if character_owner_id is null then
    raise exception 'Character does not exist';
  end if;
  if character_owner_id <> new.linked_by then
    raise exception 'Character assignment must be created by the character owner';
  end if;
  -- A Game Master is not a player; all active assignments need membership.
  perform 1 from public.campaign_members
  where campaign_id = new.campaign_id and user_id = new.linked_by for share;
  if not found then
    raise exception 'Character owner is not a campaign participant';
  end if;
  if character_visibility <> 'campaign' then
    raise exception 'Character visibility must be campaign';
  end if;
  if character_game_system <> campaign_game_system then
    raise exception 'Character and campaign game systems must match';
  end if;
  return new;
end;
$$;

create function private.protect_linked_character()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.campaign_characters
    where character_id = old.id and unlinked_at is null
  ) then
    if tg_op = 'DELETE' then
      raise exception 'campaign_character_linked_delete';
    end if;
    -- Ownership must not silently invalidate the sharing relationship either.
    if new.owner_id is distinct from old.owner_id then
      raise exception 'Linked character ownership cannot be changed';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger characters_protect_active_assignment
before delete or update of owner_id on public.characters
for each row execute function private.protect_linked_character();

-- Completing a campaign legitimately closes its session before assignments.
create or replace function public.handle_campaign_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'active' and new.status = 'completed' then
    update public.campaign_invitations set revoked_at = now()
    where campaign_id = new.id and accepted_at is null and revoked_at is null;
    update public.game_sessions
    set ended_at = greatest(now(), started_at), end_reason = 'campaign_completed'
    where campaign_id = new.id and ended_at is null;
    update public.campaign_characters set unlinked_at = now()
    where campaign_id = new.id and unlinked_at is null;
  end if;
  return new;
end;
$$;

revoke all on function private.protect_linked_character()
from public, anon, authenticated, service_role;
revoke all on function public.enforce_campaign_character_rules()
from public, anon, authenticated, service_role;
revoke all on function public.handle_campaign_completed()
from public, anon, authenticated, service_role;
