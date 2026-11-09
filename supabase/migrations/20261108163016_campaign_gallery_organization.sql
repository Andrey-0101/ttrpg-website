-- Logical, GM-private organization only. Storage objects and image identities do not move.
create function public.normalize_campaign_gallery_name(input_name text)
returns text language plpgsql immutable security invoker set search_path = '' as $$
declare
  normalized text := btrim(input_name, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
begin
  if normalized is null or char_length(normalized) not between 1 and 255
    or normalized ~ '[[:cntrl:]]' then
    raise exception 'invalid_campaign_gallery_name' using errcode = '22023';
  end if;
  return normalized;
end;
$$;

create table public.campaign_gallery_folders (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  category text not null check (category in ('handout', 'npc', 'maps_plans', 'other')),
  name text not null check (name = public.normalize_campaign_gallery_name(name)),
  constraint campaign_gallery_folders_scope_key unique (id, campaign_id, category)
);
create index campaign_gallery_folders_campaign_category_idx
  on public.campaign_gallery_folders(campaign_id, category);

-- A separate GM-only relation keeps even folder associations out of Player image reads.
-- No row means category root; the primary key permits exactly one location per image.
alter table public.campaign_images add constraint campaign_images_folder_scope_key
  unique (id, campaign_id, category);
create table public.campaign_gallery_locations (
  image_id uuid primary key,
  campaign_id uuid not null,
  category text not null,
  folder_id uuid not null,
  constraint campaign_gallery_locations_image_fkey foreign key (image_id, campaign_id, category)
    references public.campaign_images(id, campaign_id, category) on delete cascade,
  constraint campaign_gallery_locations_folder_fkey foreign key (folder_id, campaign_id, category)
    references public.campaign_gallery_folders(id, campaign_id, category)
);
create index campaign_gallery_locations_folder_scope_idx
  on public.campaign_gallery_locations(folder_id, campaign_id, category);
create index campaign_gallery_locations_campaign_idx
  on public.campaign_gallery_locations(campaign_id);

alter table public.campaign_gallery_folders enable row level security;
alter table public.campaign_gallery_locations enable row level security;
create policy "Only campaign GM reads folders" on public.campaign_gallery_folders
  for select to authenticated using (public.current_user_is_campaign_game_master(campaign_id));
create policy "Only active campaign GM creates folders" on public.campaign_gallery_folders
  for insert to authenticated with check (public.current_user_is_active_campaign_game_master(campaign_id));
create policy "Only active campaign GM renames folders" on public.campaign_gallery_folders
  for update to authenticated using (public.current_user_is_active_campaign_game_master(campaign_id))
  with check (public.current_user_is_active_campaign_game_master(campaign_id));
create policy "Only campaign GM reads image locations" on public.campaign_gallery_locations
  for select to authenticated using (public.current_user_is_campaign_game_master(campaign_id));
create policy "Only active campaign GM adds image locations" on public.campaign_gallery_locations
  for insert to authenticated with check (public.current_user_is_active_campaign_game_master(campaign_id));
create policy "Only active campaign GM moves image locations" on public.campaign_gallery_locations
  for update to authenticated using (public.current_user_is_active_campaign_game_master(campaign_id))
  with check (public.current_user_is_active_campaign_game_master(campaign_id));
create policy "Only active campaign GM removes image locations" on public.campaign_gallery_locations
  for delete to authenticated using (public.current_user_is_active_campaign_game_master(campaign_id));
create trigger campaign_gallery_folders_active_only before insert or update or delete
  on public.campaign_gallery_folders for each row execute function public.enforce_active_campaign_video_mutation();
create trigger campaign_gallery_locations_active_only before insert or update or delete
  on public.campaign_gallery_locations for each row execute function public.enforce_active_campaign_video_mutation();

revoke all on public.campaign_gallery_folders, public.campaign_gallery_locations from public, anon, authenticated, service_role;
grant select on public.campaign_gallery_folders, public.campaign_gallery_locations to authenticated;
grant insert (campaign_id, category, name), update (name) on public.campaign_gallery_folders to authenticated;
grant insert (image_id, campaign_id, category, folder_id), update (folder_id), delete
  on public.campaign_gallery_locations to authenticated;

-- Invoker RPCs retain RLS and column grants. Explicit checks also reject no-op unauthorized calls.
create function public.save_campaign_gallery_folder(
  target_campaign_id uuid, target_category text, target_name text, target_folder_id uuid default null
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  normalized text := public.normalize_campaign_gallery_name(target_name);
  result public.campaign_gallery_folders;
begin
  perform 1 from public.campaigns where id = target_campaign_id
    and game_master_id = (select auth.uid()) and status = 'active' for update;
  if not found then raise exception 'campaign_gallery_mutation_unavailable' using errcode = '42501'; end if;
  if target_folder_id is null then
    insert into public.campaign_gallery_folders(campaign_id, category, name)
    values (target_campaign_id, target_category, normalized) returning * into result;
  else
    update public.campaign_gallery_folders set name = normalized
    where id = target_folder_id and campaign_id = target_campaign_id and category = target_category
    returning * into result;
    if not found then raise exception 'campaign_gallery_folder_unavailable' using errcode = '22023'; end if;
  end if;
  return result.id;
end;
$$;

create function public.rename_campaign_gallery_image(target_image_id uuid, target_name text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  normalized text := public.normalize_campaign_gallery_name(target_name);
  image_campaign uuid;
begin
  select campaign_id into image_campaign from public.campaign_images where id = target_image_id for update;
  perform 1 from public.campaigns where id = image_campaign
    and game_master_id = (select auth.uid()) and status = 'active' for update;
  if not found then raise exception 'campaign_gallery_mutation_unavailable' using errcode = '42501'; end if;
  update public.campaign_images set display_name = normalized where id = target_image_id;
  return normalized;
end;
$$;

create function public.move_campaign_gallery_image(target_image_id uuid, target_folder_id uuid default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  image_campaign uuid;
  image_category text;
begin
  select campaign_id, category into image_campaign, image_category
    from public.campaign_images where id = target_image_id for update;
  perform 1 from public.campaigns where id = image_campaign
    and game_master_id = (select auth.uid()) and status = 'active' for update;
  if not found then raise exception 'campaign_gallery_mutation_unavailable' using errcode = '42501'; end if;
  if target_folder_id is null then
    delete from public.campaign_gallery_locations where image_id = target_image_id;
  else
    insert into public.campaign_gallery_locations(image_id, campaign_id, category, folder_id)
    values (target_image_id, image_campaign, image_category, target_folder_id)
    on conflict (image_id) do update set folder_id = excluded.folder_id;
  end if;
end;
$$;

revoke all on function public.normalize_campaign_gallery_name(text),
  public.save_campaign_gallery_folder(uuid, text, text, uuid),
  public.rename_campaign_gallery_image(uuid, text), public.move_campaign_gallery_image(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.normalize_campaign_gallery_name(text),
  public.save_campaign_gallery_folder(uuid, text, text, uuid),
  public.rename_campaign_gallery_image(uuid, text), public.move_campaign_gallery_image(uuid, uuid)
  to authenticated;
