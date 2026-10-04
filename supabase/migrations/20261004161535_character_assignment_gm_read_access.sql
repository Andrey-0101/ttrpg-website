-- Expand: the legacy column remains until the visibility-free app is active.
-- Assignments, not legacy values, authorize only the exact campaign's GM.
create or replace function public.current_user_can_view_campaign_character(target_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.characters as character
    join public.campaign_characters as assignment
      on assignment.character_id = character.id and assignment.unlinked_at is null
    join public.campaigns as campaign on campaign.id = assignment.campaign_id
    join public.campaign_members as owner_member
      on owner_member.campaign_id = campaign.id and owner_member.user_id = character.owner_id
    where character.id = target_character_id
      and campaign.game_master_id = (select auth.uid())
      and campaign.status = 'active'
      and character.owner_id = assignment.linked_by
      and character.owner_id <> campaign.game_master_id
      and character.game_system = campaign.game_system
  );
$$;

drop policy "Campaign participants can view shared characters" on public.characters;
create policy "Campaign Game Master can view linked characters"
on public.characters for select to authenticated
using (public.current_user_can_view_campaign_character(id));

-- The existing portrait helper delegates to the same sheet access predicate.
drop policy "Campaign participants can read shared character portraits" on storage.objects;
create policy "Campaign Game Master can read linked character portraits"
on storage.objects for select to authenticated
using (bucket_id = 'character-portraits' and public.current_user_can_view_campaign_portrait(name));

drop policy "Campaign participants can link their own eligible character" on public.campaign_characters;
create policy "Campaign participants can link their own eligible character"
on public.campaign_characters for insert to authenticated
with check (
  linked_by = (select auth.uid())
  and unlinked_at is null
  and public.current_user_is_campaign_player(campaign_id)
  and exists (
    select 1 from public.characters as character
    join public.campaigns as campaign on campaign.id = campaign_id
    where character.id = character_id
      and character.owner_id = (select auth.uid())
      and character.game_system = campaign.game_system
      and campaign.status = 'active'
  )
);

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
  select owner_id, game_system into character_owner_id, character_game_system
  from public.characters where id = new.character_id for share;
  if campaign_status is null then raise exception 'Campaign does not exist'; end if;
  if campaign_status <> 'active' then raise exception 'Character assignment requires an active campaign'; end if;
  if new.linked_by = campaign_game_master_id and new.unlinked_at is null then
    raise exception 'campaign_character_game_master';
  end if;
  if character_owner_id is null then raise exception 'Character does not exist'; end if;
  if character_owner_id <> new.linked_by then
    raise exception 'Character assignment must be created by the character owner';
  end if;
  perform 1 from public.campaign_members
  where campaign_id = new.campaign_id and user_id = new.linked_by for share;
  if not found then raise exception 'Character owner is not a campaign participant'; end if;
  if character_game_system <> campaign_game_system then
    raise exception 'Character and campaign game systems must match';
  end if;
  return new;
end;
$$;

create or replace function public.handle_character_campaign_eligibility_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.game_system is distinct from old.game_system then
    update public.campaign_characters as assignment
    set unlinked_at = now()
    from public.campaigns as campaign
    where assignment.character_id = new.id
      and assignment.unlinked_at is null
      and campaign.id = assignment.campaign_id
      and campaign.game_system is distinct from new.game_system;
  end if;
  return new;
end;
$$;

drop trigger characters_handle_campaign_eligibility_removed on public.characters;
create trigger characters_handle_campaign_eligibility_removed
after update of game_system on public.characters
for each row execute function public.handle_character_campaign_eligibility_removed();

-- Keep the established grants: helpers are authenticated predicates, not writers.
revoke all on function public.current_user_can_view_campaign_character(uuid) from public, anon;
grant execute on function public.current_user_can_view_campaign_character(uuid) to authenticated;
revoke all on function public.enforce_campaign_character_rules() from public, anon, authenticated, service_role;
revoke all on function public.handle_character_campaign_eligibility_removed() from public, anon, authenticated, service_role;
