-- Additive name-only projection. Existing sheet and portrait policies stay intact.
-- A dedicated non-exposed schema avoids opening the existing internal schema.
create schema campaign_video_labels;
revoke all on schema campaign_video_labels from public, anon, authenticated, service_role;
grant usage on schema campaign_video_labels to authenticated;

create function campaign_video_labels.assigned_character_names(target_campaign_id uuid)
returns table (participant_id uuid, character_name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.campaigns c
    where c.id = target_campaign_id and (
      c.game_master_id = (select auth.uid()) or exists (
        select 1 from public.campaign_members m
        where m.campaign_id = c.id and m.user_id = (select auth.uid())
      )
    )
  ) then
    raise exception using errcode = '42501', message = 'campaign_directory_unavailable';
  end if;

  return query
  select m.user_id, ch.name
  from public.campaigns c
  join public.campaign_members m on m.campaign_id = c.id
  join public.campaign_characters a
    on a.campaign_id = c.id and a.linked_by = m.user_id and a.unlinked_at is null
  join public.characters ch
    on ch.id = a.character_id and ch.owner_id = m.user_id and ch.game_system = c.game_system
  where c.id = target_campaign_id and c.status = 'active'
    and m.user_id <> c.game_master_id;
end;
$$;
revoke all on function campaign_video_labels.assigned_character_names(uuid) from public, anon, authenticated, service_role;
grant execute on function campaign_video_labels.assigned_character_names(uuid) to authenticated;

create function public.get_campaign_video_character_names(target_campaign_id uuid)
returns table (participant_id uuid, character_name text)
language sql stable security invoker set search_path = '' as $$
  select * from campaign_video_labels.assigned_character_names(target_campaign_id);
$$;
revoke all on function public.get_campaign_video_character_names(uuid) from public, anon, authenticated, service_role;
grant execute on function public.get_campaign_video_character_names(uuid) to authenticated;

-- Reuse the existing campaign-scoped, participant-readable invalidation channel.
create trigger campaign_characters_signal_directory_change
after insert or update or delete on public.campaign_characters
for each row execute function private.signal_campaign_membership_change();

create function private.signal_campaign_directory_profile_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.campaign_membership_signals (campaign_id)
  select c.id from public.campaigns c
  where c.game_master_id = new.id or exists (
    select 1 from public.campaign_members m where m.campaign_id = c.id and m.user_id = new.id
  )
  order by c.id
  on conflict (campaign_id) do update
    set revision = public.campaign_membership_signals.revision + 1;
  return null;
end;
$$;
revoke all on function private.signal_campaign_directory_profile_change() from public, anon, authenticated, service_role;
create trigger profiles_signal_campaign_directory_change
after update of display_name on public.profiles
for each row when (old.display_name is distinct from new.display_name)
execute function private.signal_campaign_directory_profile_change();

create function private.signal_campaign_directory_character_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.campaign_membership_signals (campaign_id)
  select distinct a.campaign_id from public.campaign_characters a
  where a.character_id = new.id and a.unlinked_at is null
  order by a.campaign_id
  on conflict (campaign_id) do update
    set revision = public.campaign_membership_signals.revision + 1;
  return null;
end;
$$;
revoke all on function private.signal_campaign_directory_character_change() from public, anon, authenticated, service_role;
create trigger characters_signal_campaign_directory_change
after update of name on public.characters
for each row when (old.name is distinct from new.name)
execute function private.signal_campaign_directory_character_change();
