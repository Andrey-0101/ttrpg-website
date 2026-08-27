-- Campaign video data foundation.
--
-- This migration adds only provider-neutral campaign data. It deliberately
-- contains no LiveKit room, token, connection, or session persistence.

do $$
begin
  if exists (
    select 1
    from public.campaign_members
    group by campaign_id
    having count(*) > 6
  ) then
    raise exception 'campaign_player_capacity_preflight_failed';
  end if;
end;
$$;

alter table public.campaign_members
  add column display_order smallint;

with ordered_members as (
  select
    campaign_id,
    user_id,
    row_number() over (
      partition by campaign_id
      order by joined_at, user_id
    )::smallint as assigned_order
  from public.campaign_members
)
update public.campaign_members as member
set display_order = ordered.assigned_order
from ordered_members as ordered
where member.campaign_id = ordered.campaign_id
  and member.user_id = ordered.user_id;

alter table public.campaign_members
  alter column display_order set not null,
  add constraint campaign_members_display_order_check
    check (display_order between 1 and 6),
  add constraint campaign_members_campaign_display_order_key
    unique (campaign_id, display_order)
    deferrable initially immediate;

alter table public.campaigns
  add constraint campaigns_id_game_master_id_key
    unique (id, game_master_id);

create table public.campaign_player_publication_permissions (
  campaign_id uuid not null,
  user_id uuid not null,
  audio_allowed boolean not null default true,
  video_allowed boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id) on delete restrict,
  primary key (campaign_id, user_id),
  constraint campaign_player_publication_permissions_member_fkey
    foreign key (campaign_id, user_id)
    references public.campaign_members(campaign_id, user_id)
    on delete cascade,
  constraint campaign_player_publication_permissions_sparse_check
    check (not (audio_allowed and video_allowed))
);

comment on table public.campaign_player_publication_permissions is
  'Sparse overrides only. Absence means audio and video publication are both allowed; restoring both permissions deletes the override and never activates a device.';

create table public.campaign_media_groups (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  display_order smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_media_groups_name_check
    check (name = btrim(name) and char_length(name) between 1 and 80),
  constraint campaign_media_groups_display_order_check
    check (display_order between 1 and 6),
  constraint campaign_media_groups_campaign_id_id_key
    unique (campaign_id, id),
  constraint campaign_media_groups_campaign_display_order_key
    unique (campaign_id, display_order)
    deferrable initially immediate
);

create table public.campaign_media_group_members (
  campaign_id uuid not null,
  user_id uuid not null,
  group_id uuid not null,
  assigned_at timestamptz not null default now(),
  assigned_by uuid not null references auth.users(id) on delete restrict,
  primary key (campaign_id, user_id),
  constraint campaign_media_group_members_player_fkey
    foreign key (campaign_id, user_id)
    references public.campaign_members(campaign_id, user_id)
    on delete cascade,
  constraint campaign_media_group_members_group_fkey
    foreign key (campaign_id, group_id)
    references public.campaign_media_groups(campaign_id, id)
    on delete cascade
);

create table public.campaign_media_restrictions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  source_type text not null,
  source_group_id uuid,
  target_type text not null,
  target_group_id uuid,
  media_kind text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  constraint campaign_media_restrictions_source_type_check
    check (source_type in ('gm', 'group')),
  constraint campaign_media_restrictions_target_type_check
    check (target_type in ('gm', 'group')),
  constraint campaign_media_restrictions_media_kind_check
    check (media_kind in ('audio', 'video')),
  constraint campaign_media_restrictions_source_shape_check
    check (
      (source_type = 'gm' and source_group_id is null)
      or (source_type = 'group' and source_group_id is not null)
    ),
  constraint campaign_media_restrictions_target_shape_check
    check (
      (target_type = 'gm' and target_group_id is null)
      or (target_type = 'group' and target_group_id is not null)
    ),
  constraint campaign_media_restrictions_endpoint_check
    check (
      not (source_type = 'gm' and target_type = 'gm')
      and not (
        source_type = 'group'
        and target_type = 'group'
        and source_group_id = target_group_id
      )
    ),
  constraint campaign_media_restrictions_source_group_fkey
    foreign key (campaign_id, source_group_id)
    references public.campaign_media_groups(campaign_id, id)
    on delete cascade,
  constraint campaign_media_restrictions_target_group_fkey
    foreign key (campaign_id, target_group_id)
    references public.campaign_media_groups(campaign_id, id)
    on delete cascade,
  constraint campaign_media_restrictions_direction_kind_key
    unique nulls not distinct (
      campaign_id,
      source_type,
      source_group_id,
      target_type,
      target_group_id,
      media_kind
    )
);

create table public.campaign_images (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  uploader_id uuid not null,
  storage_object_name text not null unique,
  display_name text not null,
  mime_type text not null,
  byte_size bigint not null,
  visibility text not null default 'gm_only',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_images_campaign_id_id_key unique (campaign_id, id),
  constraint campaign_images_uploader_fkey
    foreign key (campaign_id, uploader_id)
    references public.campaigns(id, game_master_id)
    on delete cascade,
  constraint campaign_images_display_name_check
    check (
      display_name = btrim(display_name)
      and char_length(display_name) between 1 and 255
      and display_name !~ '[[:cntrl:]]'
    ),
  constraint campaign_images_mime_type_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint campaign_images_byte_size_check
    check (byte_size between 1 and 5242880),
  constraint campaign_images_visibility_check
    check (visibility in ('gm_only', 'all_active_players', 'selected_active_players')),
  constraint campaign_images_storage_object_name_check
    check (
      storage_object_name ~
      ('^' || campaign_id::text || '/' || id::text ||
       '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$')
      and (
        (mime_type = 'image/jpeg' and storage_object_name ~ '\.(jpg|jpeg)$')
        or (mime_type = 'image/png' and storage_object_name ~ '\.png$')
        or (mime_type = 'image/webp' and storage_object_name ~ '\.webp$')
      )
    )
);

create table public.campaign_image_recipients (
  campaign_id uuid not null,
  image_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  primary key (image_id, user_id),
  constraint campaign_image_recipients_image_fkey
    foreign key (campaign_id, image_id)
    references public.campaign_images(campaign_id, id)
    on delete cascade,
  constraint campaign_image_recipients_player_fkey
    foreign key (campaign_id, user_id)
    references public.campaign_members(campaign_id, user_id)
    on delete cascade
);

create table public.campaign_video_audit_log (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  subject_type text not null,
  subject_id uuid,
  media_kind text,
  old_state text,
  new_state text,
  created_at timestamptz not null default now(),
  constraint campaign_video_audit_log_action_check
    check (action in (
      'player_reordered',
      'publication_audio_changed',
      'publication_video_changed',
      'group_created',
      'group_updated',
      'group_deleted',
      'group_membership_added',
      'group_membership_removed',
      'restriction_added',
      'restriction_removed',
      'image_created',
      'image_updated',
      'image_deleted',
      'image_visibility_changed',
      'image_recipient_added',
      'image_recipient_removed'
    )),
  constraint campaign_video_audit_log_subject_type_check
    check (subject_type in (
      'player', 'media_group', 'restriction', 'campaign_image', 'image_recipient'
    )),
  constraint campaign_video_audit_log_media_kind_check
    check (media_kind is null or media_kind in ('audio', 'video')),
  constraint campaign_video_audit_log_old_state_check
    check (old_state is null or old_state in (
      'allowed', 'blocked', 'assigned', 'unassigned',
      'gm_only', 'all_active_players', 'selected_active_players',
      '1', '2', '3', '4', '5', '6'
    )),
  constraint campaign_video_audit_log_new_state_check
    check (new_state is null or new_state in (
      'allowed', 'blocked', 'assigned', 'unassigned',
      'gm_only', 'all_active_players', 'selected_active_players',
      '1', '2', '3', '4', '5', '6'
    ))
);

create index campaign_player_publication_permissions_user_id_idx
  on public.campaign_player_publication_permissions(user_id);
create index campaign_player_publication_permissions_updated_by_idx
  on public.campaign_player_publication_permissions(updated_by);
create index campaign_media_groups_campaign_id_idx
  on public.campaign_media_groups(campaign_id);
create index campaign_media_group_members_campaign_group_idx
  on public.campaign_media_group_members(campaign_id, group_id);
create index campaign_media_group_members_user_id_idx
  on public.campaign_media_group_members(user_id);
create index campaign_media_group_members_assigned_by_idx
  on public.campaign_media_group_members(assigned_by);
create index campaign_media_restrictions_campaign_id_idx
  on public.campaign_media_restrictions(campaign_id);
create index campaign_media_restrictions_source_group_id_idx
  on public.campaign_media_restrictions(campaign_id, source_group_id)
  where source_group_id is not null;
create index campaign_media_restrictions_target_group_id_idx
  on public.campaign_media_restrictions(campaign_id, target_group_id)
  where target_group_id is not null;
create index campaign_media_restrictions_created_by_idx
  on public.campaign_media_restrictions(created_by);
create index campaign_images_campaign_visibility_idx
  on public.campaign_images(campaign_id, visibility);
create index campaign_images_uploader_id_idx
  on public.campaign_images(uploader_id);
create index campaign_image_recipients_campaign_user_idx
  on public.campaign_image_recipients(campaign_id, user_id);
create index campaign_image_recipients_campaign_image_idx
  on public.campaign_image_recipients(campaign_id, image_id);
create index campaign_image_recipients_created_by_idx
  on public.campaign_image_recipients(created_by);
create index campaign_video_audit_log_campaign_created_idx
  on public.campaign_video_audit_log(campaign_id, created_at desc);
create index campaign_video_audit_log_actor_id_idx
  on public.campaign_video_audit_log(actor_id)
  where actor_id is not null;

create or replace function public.current_user_is_active_campaign_game_master(
  target_campaign_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaigns
    where id = target_campaign_id
      and status = 'active'
      and game_master_id = (select auth.uid())
  );
$$;

create or replace function public.current_user_is_active_campaign_player(
  target_campaign_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_members as member
    join public.campaigns as campaign on campaign.id = member.campaign_id
    where member.campaign_id = target_campaign_id
      and member.user_id = (select auth.uid())
      and campaign.status = 'active'
  );
$$;

create or replace function public.current_user_can_access_active_campaign(
  target_campaign_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.current_user_is_active_campaign_game_master(target_campaign_id)
    or public.current_user_is_active_campaign_player(target_campaign_id);
$$;

create or replace function public.enforce_campaign_membership_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_campaign_id uuid := coalesce(new.campaign_id, old.campaign_id);
  target_user_id uuid := coalesce(new.user_id, old.user_id);
  campaign_status text;
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;

  select status into campaign_status
  from public.campaigns
  where id = target_campaign_id
  for share;

  if not found then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if campaign_status <> 'active' then
    if tg_op = 'DELETE'
      and not exists (select 1 from auth.users where id = target_user_id)
    then
      return old;
    end if;
    raise exception 'completed_campaign_is_read_only';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger campaign_members_enforce_lifecycle
before insert or delete on public.campaign_members
for each row execute function public.enforce_campaign_membership_lifecycle();

create trigger campaign_members_enforce_display_order_lifecycle
before update of display_order on public.campaign_members
for each row execute function public.enforce_campaign_membership_lifecycle();

create or replace function public.enforce_active_campaign_video_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_campaign_id uuid := coalesce(new.campaign_id, old.campaign_id);
  campaign_status text;
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;

  select status into campaign_status
  from public.campaigns
  where id = target_campaign_id
  for share;

  if not found and tg_op = 'DELETE' then
    return old;
  end if;

  if campaign_status is distinct from 'active' then
    raise exception 'completed_campaign_is_read_only';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger campaign_player_publication_permissions_active_only
before insert or update or delete on public.campaign_player_publication_permissions
for each row execute function public.enforce_active_campaign_video_mutation();
create trigger campaign_media_groups_active_only
before insert or update or delete on public.campaign_media_groups
for each row execute function public.enforce_active_campaign_video_mutation();
create trigger campaign_media_group_members_active_only
before insert or update or delete on public.campaign_media_group_members
for each row execute function public.enforce_active_campaign_video_mutation();
create trigger campaign_media_restrictions_active_only
before insert or update or delete on public.campaign_media_restrictions
for each row execute function public.enforce_active_campaign_video_mutation();
create trigger campaign_images_active_only
before insert or update or delete on public.campaign_images
for each row execute function public.enforce_active_campaign_video_mutation();
create trigger campaign_image_recipients_active_only
before insert or update or delete on public.campaign_image_recipients
for each row execute function public.enforce_active_campaign_video_mutation();

create or replace function public.enforce_campaign_publication_permission_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.campaign_id is distinct from old.campaign_id
    or new.user_id is distinct from old.user_id
  then
    raise exception 'campaign_publication_permission_identity_is_immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger campaign_publication_permissions_enforce_update
before update on public.campaign_player_publication_permissions
for each row execute function public.enforce_campaign_publication_permission_update();

create or replace function public.enforce_campaign_media_group_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.campaign_id is distinct from old.campaign_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'campaign_media_group_identity_is_immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger campaign_media_groups_enforce_update
before update on public.campaign_media_groups
for each row execute function public.enforce_campaign_media_group_update();

create or replace function public.enforce_campaign_image_update_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.campaign_id is distinct from old.campaign_id
    or new.uploader_id is distinct from old.uploader_id
    or new.storage_object_name is distinct from old.storage_object_name
    or new.mime_type is distinct from old.mime_type
    or new.byte_size is distinct from old.byte_size
    or new.created_at is distinct from old.created_at
  then
    raise exception 'campaign_image_identity_is_immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger campaign_images_enforce_update_rules
before update on public.campaign_images
for each row execute function public.enforce_campaign_image_update_rules();

create or replace function public.enforce_campaign_image_delete_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from storage.objects
    where bucket_id = 'campaign-images'
      and name = old.storage_object_name
  ) then
    raise exception 'campaign_image_storage_object_must_be_deleted_first';
  end if;
  return old;
end;
$$;

create trigger campaign_images_enforce_storage_first_delete
before delete on public.campaign_images
for each row execute function public.enforce_campaign_image_delete_order();

create or replace function public.enforce_selected_campaign_image_recipients()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_image_id uuid;
  target_visibility text;
begin
  if tg_table_name = 'campaign_images' then
    target_image_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    target_image_id := case when tg_op = 'DELETE' then old.image_id else new.image_id end;
  end if;

  select visibility into target_visibility
  from public.campaign_images
  where id = target_image_id;

  if not found then
    return null;
  end if;

  if target_visibility = 'selected_active_players'
    and not exists (
      select 1
      from public.campaign_image_recipients
      where image_id = target_image_id
    )
  then
    raise exception 'selected_campaign_image_requires_recipient';
  end if;

  return null;
end;
$$;

create constraint trigger campaign_images_selected_recipients_check
after insert or update of visibility on public.campaign_images
deferrable initially deferred
for each row execute function public.enforce_selected_campaign_image_recipients();

create constraint trigger campaign_image_recipients_selected_check
after insert or update or delete on public.campaign_image_recipients
deferrable initially deferred
for each row execute function public.enforce_selected_campaign_image_recipients();

create or replace function public.handle_campaign_video_member_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.campaigns
    where id = old.campaign_id and status = 'active'
  ) then
    return old;
  end if;

  update public.campaign_images as image
  set visibility = 'gm_only'
  where image.campaign_id = old.campaign_id
    and image.visibility = 'selected_active_players'
    and exists (
      select 1
      from public.campaign_image_recipients as recipient
      where recipient.image_id = image.id
        and recipient.user_id = old.user_id
    )
    and not exists (
      select 1
      from public.campaign_image_recipients as other_recipient
      where other_recipient.image_id = image.id
        and other_recipient.user_id <> old.user_id
    );
  return old;
end;
$$;

create trigger campaign_members_prepare_video_cleanup
before delete on public.campaign_members
for each row execute function public.handle_campaign_video_member_removal();

create or replace function public.audit_campaign_publication_permission_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_audio boolean := coalesce(old.audio_allowed, true);
  new_audio boolean := coalesce(new.audio_allowed, true);
  old_video boolean := coalesce(old.video_allowed, true);
  new_video boolean := coalesce(new.video_allowed, true);
  audit_campaign_id uuid := coalesce(new.campaign_id, old.campaign_id);
  audit_user_id uuid := coalesce(new.user_id, old.user_id);
begin
  if not exists (
    select 1 from public.campaigns where id = audit_campaign_id
  ) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if old_audio is distinct from new_audio then
    insert into public.campaign_video_audit_log (
      campaign_id, actor_id, action, subject_type, subject_id,
      media_kind, old_state, new_state
    ) values (
      audit_campaign_id, (select auth.uid()), 'publication_audio_changed',
      'player', audit_user_id, 'audio',
      case when old_audio then 'allowed' else 'blocked' end,
      case when new_audio then 'allowed' else 'blocked' end
    );
  end if;
  if old_video is distinct from new_video then
    insert into public.campaign_video_audit_log (
      campaign_id, actor_id, action, subject_type, subject_id,
      media_kind, old_state, new_state
    ) values (
      audit_campaign_id, (select auth.uid()), 'publication_video_changed',
      'player', audit_user_id, 'video',
      case when old_video then 'allowed' else 'blocked' end,
      case when new_video then 'allowed' else 'blocked' end
    );
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger campaign_publication_permissions_audit
after insert or update or delete on public.campaign_player_publication_permissions
for each row execute function public.audit_campaign_publication_permission_change();

create or replace function public.audit_campaign_media_group_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.campaigns
    where id = coalesce(new.campaign_id, old.campaign_id)
  ) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  insert into public.campaign_video_audit_log (
    campaign_id, actor_id, action, subject_type, subject_id, old_state, new_state
  ) values (
    coalesce(new.campaign_id, old.campaign_id),
    (select auth.uid()),
    case tg_op when 'INSERT' then 'group_created' when 'DELETE' then 'group_deleted' else 'group_updated' end,
    'media_group',
    coalesce(new.id, old.id),
    case when tg_op = 'UPDATE' and old.display_order is distinct from new.display_order then old.display_order::text end,
    case when tg_op = 'UPDATE' and old.display_order is distinct from new.display_order then new.display_order::text end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger campaign_media_groups_audit
after insert or update or delete on public.campaign_media_groups
for each row execute function public.audit_campaign_media_group_change();

create or replace function public.audit_campaign_media_group_membership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.campaigns
    where id = coalesce(new.campaign_id, old.campaign_id)
  ) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  insert into public.campaign_video_audit_log (
    campaign_id, actor_id, action, subject_type, subject_id, old_state, new_state
  ) values (
    coalesce(new.campaign_id, old.campaign_id),
    (select auth.uid()),
    case tg_op when 'INSERT' then 'group_membership_added' else 'group_membership_removed' end,
    'player',
    coalesce(new.user_id, old.user_id),
    case when tg_op = 'DELETE' then 'assigned' else 'unassigned' end,
    case when tg_op = 'INSERT' then 'assigned' else 'unassigned' end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger campaign_media_group_members_audit
after insert or delete on public.campaign_media_group_members
for each row execute function public.audit_campaign_media_group_membership_change();

create or replace function public.audit_campaign_media_restriction_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.campaigns
    where id = coalesce(new.campaign_id, old.campaign_id)
  ) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  insert into public.campaign_video_audit_log (
    campaign_id, actor_id, action, subject_type, subject_id,
    media_kind, old_state, new_state
  ) values (
    coalesce(new.campaign_id, old.campaign_id),
    (select auth.uid()),
    case tg_op when 'INSERT' then 'restriction_added' else 'restriction_removed' end,
    'restriction',
    coalesce(new.id, old.id),
    coalesce(new.media_kind, old.media_kind),
    case when tg_op = 'DELETE' then 'blocked' else 'allowed' end,
    case when tg_op = 'INSERT' then 'blocked' else 'allowed' end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger campaign_media_restrictions_audit
after insert or delete on public.campaign_media_restrictions
for each row execute function public.audit_campaign_media_restriction_change();

create or replace function public.audit_campaign_image_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_action text;
begin
  if not exists (
    select 1 from public.campaigns
    where id = coalesce(new.campaign_id, old.campaign_id)
  ) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  audit_action := case
    when tg_op = 'INSERT' then 'image_created'
    when tg_op = 'DELETE' then 'image_deleted'
    when old.visibility is distinct from new.visibility then 'image_visibility_changed'
    else 'image_updated'
  end;
  insert into public.campaign_video_audit_log (
    campaign_id, actor_id, action, subject_type, subject_id, old_state, new_state
  ) values (
    coalesce(new.campaign_id, old.campaign_id),
    (select auth.uid()),
    audit_action,
    'campaign_image',
    coalesce(new.id, old.id),
    case when tg_op = 'UPDATE' and old.visibility is distinct from new.visibility then old.visibility end,
    case when tg_op = 'UPDATE' and old.visibility is distinct from new.visibility then new.visibility end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger campaign_images_audit
after insert or update or delete on public.campaign_images
for each row execute function public.audit_campaign_image_change();

create or replace function public.audit_campaign_image_recipient_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.campaigns
    where id = coalesce(new.campaign_id, old.campaign_id)
  ) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  insert into public.campaign_video_audit_log (
    campaign_id, actor_id, action, subject_type, subject_id, old_state, new_state
  ) values (
    coalesce(new.campaign_id, old.campaign_id),
    (select auth.uid()),
    case tg_op when 'INSERT' then 'image_recipient_added' else 'image_recipient_removed' end,
    'image_recipient',
    coalesce(new.user_id, old.user_id),
    case when tg_op = 'DELETE' then 'assigned' else 'unassigned' end,
    case when tg_op = 'INSERT' then 'assigned' else 'unassigned' end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger campaign_image_recipients_audit
after insert or delete on public.campaign_image_recipients
for each row execute function public.audit_campaign_image_recipient_change();

create or replace function public.accept_campaign_invitation(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  hashed_token text;
  invitation_id uuid;
  target_campaign_id uuid;
  campaign_game_master_id uuid;
  campaign_status text;
  invitation_expires_at timestamptz;
  invitation_accepted_at timestamptz;
  invitation_revoked_at timestamptz;
  assigned_display_order smallint;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if raw_token is null or char_length(raw_token) < 32 then
    raise exception 'Invitation is invalid or unavailable';
  end if;

  hashed_token := encode(
    extensions.digest(pg_catalog.convert_to(raw_token, 'UTF8'), 'sha256'),
    'hex'
  );

  select invitation.campaign_id into target_campaign_id
  from public.campaign_invitations as invitation
  where invitation.token_hash = hashed_token;

  if target_campaign_id is null then
    raise exception 'Invitation is invalid or unavailable';
  end if;

  select campaign.game_master_id, campaign.status
  into campaign_game_master_id, campaign_status
  from public.campaigns as campaign
  where campaign.id = target_campaign_id
  for update;

  if campaign_game_master_id is null or campaign_status <> 'active' then
    raise exception 'Invitation is invalid or unavailable';
  end if;

  select slot::smallint into assigned_display_order
  from generate_series(1, 6) as slot
  where not exists (
    select 1 from public.campaign_members
    where campaign_id = target_campaign_id
      and display_order = slot
  )
  order by slot
  limit 1;

  if assigned_display_order is null then
    raise exception 'campaign_player_capacity_reached';
  end if;

  select invitation.id, invitation.expires_at,
         invitation.accepted_at, invitation.revoked_at
  into invitation_id, invitation_expires_at,
       invitation_accepted_at, invitation_revoked_at
  from public.campaign_invitations as invitation
  where invitation.token_hash = hashed_token
    and invitation.campaign_id = target_campaign_id
  for update;

  if invitation_id is null
    or invitation_expires_at <= now()
    or invitation_accepted_at is not null
    or invitation_revoked_at is not null
    or campaign_game_master_id = (select auth.uid())
    or exists (
      select 1 from public.campaign_members
      where campaign_id = target_campaign_id
        and user_id = (select auth.uid())
    )
  then
    raise exception 'Invitation is invalid or unavailable';
  end if;

  insert into public.campaign_members (campaign_id, user_id, display_order)
  values (target_campaign_id, (select auth.uid()), assigned_display_order);

  update public.campaign_invitations
  set accepted_at = now(), accepted_by = (select auth.uid())
  where id = invitation_id;

  return target_campaign_id;
end;
$$;

create or replace function public.reorder_campaign_players(
  target_campaign_id uuid,
  ordered_player_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  if (select auth.uid()) is null
    or not public.current_user_is_active_campaign_game_master(target_campaign_id)
  then
    raise exception 'campaign_player_reorder_not_available';
  end if;

  perform 1 from public.campaigns
  where id = target_campaign_id and status = 'active'
  for update;

  if not found then
    raise exception 'campaign_player_reorder_not_available';
  end if;

  perform 1 from public.campaign_members
  where campaign_id = target_campaign_id
  order by user_id
  for update;

  select count(*) into current_count
  from public.campaign_members
  where campaign_id = target_campaign_id;

  if ordered_player_ids is null
    or cardinality(ordered_player_ids) <> current_count
    or exists (select 1 from unnest(ordered_player_ids) as player_id where player_id is null)
    or (select count(distinct player_id) from unnest(ordered_player_ids) as player_id) <> current_count
    or exists (
      select player_id from unnest(ordered_player_ids) as player_id
      except
      select user_id from public.campaign_members where campaign_id = target_campaign_id
    )
    or exists (
      select user_id from public.campaign_members where campaign_id = target_campaign_id
      except
      select player_id from unnest(ordered_player_ids) as player_id
    )
  then
    raise exception 'campaign_player_reorder_invalid';
  end if;

  set constraints public.campaign_members_campaign_display_order_key deferred;

  with requested as (
    select player_id, ordinality::smallint as new_order
    from unnest(ordered_player_ids) with ordinality as requested(player_id, ordinality)
  ), old_orders as materialized (
    select member.user_id, member.display_order as old_order
    from public.campaign_members as member
    join requested on requested.player_id = member.user_id
    where member.campaign_id = target_campaign_id
      and member.display_order is distinct from requested.new_order
  ), changed as (
    update public.campaign_members as member
    set display_order = requested.new_order
    from requested
    where member.campaign_id = target_campaign_id
      and member.user_id = requested.player_id
      and member.display_order is distinct from requested.new_order
    returning member.user_id
  )
  insert into public.campaign_video_audit_log (
    campaign_id, actor_id, action, subject_type, subject_id, old_state, new_state
  )
  select target_campaign_id, (select auth.uid()), 'player_reordered', 'player',
         old_orders.user_id, old_orders.old_order::text, requested.new_order::text
  from old_orders
  join requested on requested.player_id = old_orders.user_id
  join changed on changed.user_id = old_orders.user_id;

  return current_count;
end;
$$;

create or replace function public.reorder_campaign_media_groups(
  target_campaign_id uuid,
  ordered_group_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  if (select auth.uid()) is null
    or not public.current_user_is_active_campaign_game_master(target_campaign_id)
  then
    raise exception 'campaign_group_reorder_not_available';
  end if;
  perform 1 from public.campaigns
    where id = target_campaign_id and status = 'active' for update;
  if not found then
    raise exception 'campaign_group_reorder_not_available';
  end if;
  perform 1 from public.campaign_media_groups
    where campaign_id = target_campaign_id order by id for update;
  select count(*) into current_count from public.campaign_media_groups
    where campaign_id = target_campaign_id;
  if ordered_group_ids is null
    or cardinality(ordered_group_ids) <> current_count
    or (select count(distinct group_id) from unnest(ordered_group_ids) as group_id) <> current_count
    or exists (
      select group_id from unnest(ordered_group_ids) as group_id
      except select id from public.campaign_media_groups where campaign_id = target_campaign_id
    )
  then
    raise exception 'campaign_group_reorder_invalid';
  end if;
  set constraints public.campaign_media_groups_campaign_display_order_key deferred;
  update public.campaign_media_groups as media_group
  set display_order = requested.ordinality::smallint
  from unnest(ordered_group_ids) with ordinality as requested(group_id, ordinality)
  where media_group.campaign_id = target_campaign_id
    and media_group.id = requested.group_id
    and media_group.display_order is distinct from requested.ordinality::smallint;
  return current_count;
end;
$$;

create or replace function public.set_campaign_image_visibility(
  target_image_id uuid,
  target_visibility text,
  target_recipient_ids uuid[] default array[]::uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_campaign_id uuid;
  normalized_recipients uuid[] := coalesce(target_recipient_ids, array[]::uuid[]);
begin
  select campaign_id into target_campaign_id
  from public.campaign_images
  where id = target_image_id
  for update;

  if target_campaign_id is null or (select auth.uid()) is null
    or target_visibility not in ('gm_only', 'all_active_players', 'selected_active_players')
  then
    raise exception 'campaign_image_visibility_change_not_available';
  end if;

  perform 1 from public.campaigns
  where id = target_campaign_id
    and status = 'active'
    and game_master_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'campaign_image_visibility_change_not_available';
  end if;

  if cardinality(normalized_recipients)
      <> (select count(distinct recipient_id) from unnest(normalized_recipients) as recipient_id)
    or exists (select 1 from unnest(normalized_recipients) as recipient_id where recipient_id is null)
    or exists (
      select recipient_id from unnest(normalized_recipients) as recipient_id
      except
      select user_id from public.campaign_members where campaign_id = target_campaign_id
    )
    or (target_visibility = 'selected_active_players' and cardinality(normalized_recipients) = 0)
    or (target_visibility <> 'selected_active_players' and cardinality(normalized_recipients) <> 0)
  then
    raise exception 'campaign_image_recipients_invalid';
  end if;

  delete from public.campaign_image_recipients
  where image_id = target_image_id
    and user_id <> all(normalized_recipients);

  insert into public.campaign_image_recipients (
    campaign_id, image_id, user_id, created_by
  )
  select target_campaign_id, target_image_id, recipient_id, (select auth.uid())
  from unnest(normalized_recipients) as recipient_id
  on conflict (image_id, user_id) do nothing;

  update public.campaign_images
  set visibility = target_visibility
  where id = target_image_id;
end;
$$;

create or replace function public.current_user_can_read_campaign_image_object(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_images as image
    join public.campaigns as campaign on campaign.id = image.campaign_id
    where image.storage_object_name = object_name
      and object_name ~
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
      and (
        campaign.game_master_id = (select auth.uid())
        or (
          campaign.status = 'active'
          and exists (
            select 1 from public.campaign_members
            where campaign_id = campaign.id and user_id = (select auth.uid())
          )
          and (
            image.visibility = 'all_active_players'
            or (
              image.visibility = 'selected_active_players'
              and exists (
                select 1 from public.campaign_image_recipients
                where image_id = image.id and user_id = (select auth.uid())
              )
            )
          )
        )
      )
  );
$$;

create or replace function public.current_user_can_upload_campaign_image_object(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_images as image
    join public.campaigns as campaign on campaign.id = image.campaign_id
    where image.storage_object_name = object_name
      and campaign.status = 'active'
      and campaign.game_master_id = (select auth.uid())
  );
$$;

drop policy if exists "Game Master or Player can remove Player membership"
  on public.campaign_members;
create policy "Active Game Master or Player can remove Player membership"
on public.campaign_members
for delete to authenticated
using (
  public.current_user_is_active_campaign_game_master(campaign_id)
  or (
    user_id = (select auth.uid())
    and public.current_user_is_active_campaign_player(campaign_id)
  )
);

alter table public.campaign_player_publication_permissions enable row level security;
alter table public.campaign_media_groups enable row level security;
alter table public.campaign_media_group_members enable row level security;
alter table public.campaign_media_restrictions enable row level security;
alter table public.campaign_images enable row level security;
alter table public.campaign_image_recipients enable row level security;
alter table public.campaign_video_audit_log enable row level security;

create policy "Campaign publication permissions are visible to authorized participants"
on public.campaign_player_publication_permissions
for select to authenticated
using (
  public.current_user_is_campaign_game_master(campaign_id)
  or (
    user_id = (select auth.uid())
    and public.current_user_is_active_campaign_player(campaign_id)
  )
);
create policy "Active Game Master creates publication permissions"
on public.campaign_player_publication_permissions
for insert to authenticated
with check (
  public.current_user_is_active_campaign_game_master(campaign_id)
  and updated_by = (select auth.uid())
);
create policy "Active Game Master updates publication permissions"
on public.campaign_player_publication_permissions
for update to authenticated
using (public.current_user_is_active_campaign_game_master(campaign_id))
with check (
  public.current_user_is_active_campaign_game_master(campaign_id)
  and updated_by = (select auth.uid())
);
create policy "Active Game Master deletes publication permissions"
on public.campaign_player_publication_permissions
for delete to authenticated
using (public.current_user_is_active_campaign_game_master(campaign_id));

create policy "Campaign media groups are visible when required"
on public.campaign_media_groups
for select to authenticated
using (
  public.current_user_is_campaign_game_master(campaign_id)
  or (
    public.current_user_is_active_campaign_player(campaign_id)
    and exists (
      select 1 from public.campaign_media_group_members as membership
      where membership.campaign_id = campaign_media_groups.campaign_id
        and membership.group_id = campaign_media_groups.id
        and membership.user_id = (select auth.uid())
    )
  )
);
create policy "Active Game Master creates campaign media groups"
on public.campaign_media_groups
for insert to authenticated
with check (public.current_user_is_active_campaign_game_master(campaign_id));
create policy "Active Game Master updates campaign media groups"
on public.campaign_media_groups
for update to authenticated
using (public.current_user_is_active_campaign_game_master(campaign_id))
with check (public.current_user_is_active_campaign_game_master(campaign_id));
create policy "Active Game Master deletes campaign media groups"
on public.campaign_media_groups
for delete to authenticated
using (public.current_user_is_active_campaign_game_master(campaign_id));

create policy "Campaign media membership is visible when required"
on public.campaign_media_group_members
for select to authenticated
using (
  public.current_user_is_campaign_game_master(campaign_id)
  or (
    user_id = (select auth.uid())
    and public.current_user_is_active_campaign_player(campaign_id)
  )
);
create policy "Active Game Master creates campaign media membership"
on public.campaign_media_group_members
for insert to authenticated
with check (
  public.current_user_is_active_campaign_game_master(campaign_id)
  and assigned_by = (select auth.uid())
);
create policy "Active Game Master deletes campaign media membership"
on public.campaign_media_group_members
for delete to authenticated
using (public.current_user_is_active_campaign_game_master(campaign_id));

create policy "Campaign media restrictions are visible when required"
on public.campaign_media_restrictions
for select to authenticated
using (
  public.current_user_is_campaign_game_master(campaign_id)
  or (
    public.current_user_is_active_campaign_player(campaign_id)
    and exists (
      select 1 from public.campaign_media_group_members as membership
      where membership.campaign_id = campaign_media_restrictions.campaign_id
        and membership.user_id = (select auth.uid())
        and (
          campaign_media_restrictions.source_group_id = membership.group_id
          or campaign_media_restrictions.target_group_id = membership.group_id
        )
    )
  )
);
create policy "Active Game Master manages campaign media restrictions"
on public.campaign_media_restrictions
for insert to authenticated
with check (
  public.current_user_is_active_campaign_game_master(campaign_id)
  and created_by = (select auth.uid())
);
create policy "Active Game Master deletes campaign media restrictions"
on public.campaign_media_restrictions
for delete to authenticated
using (public.current_user_is_active_campaign_game_master(campaign_id));

create policy "Campaign images are visible to authorized viewers"
on public.campaign_images
for select to authenticated
using (
  public.current_user_is_campaign_game_master(campaign_id)
  or (
    public.current_user_is_active_campaign_player(campaign_id)
    and (
      visibility = 'all_active_players'
      or (
        visibility = 'selected_active_players'
        and exists (
          select 1 from public.campaign_image_recipients as recipient
          where recipient.image_id = campaign_images.id
            and recipient.user_id = (select auth.uid())
        )
      )
    )
  )
);
create policy "Active Game Master creates campaign image metadata"
on public.campaign_images
for insert to authenticated
with check (
  public.current_user_is_active_campaign_game_master(campaign_id)
  and uploader_id = (select auth.uid())
);
create policy "Active Game Master updates campaign image metadata"
on public.campaign_images
for update to authenticated
using (public.current_user_is_active_campaign_game_master(campaign_id))
with check (
  public.current_user_is_active_campaign_game_master(campaign_id)
  and uploader_id = (select auth.uid())
);
create policy "Active Game Master deletes campaign image metadata"
on public.campaign_images
for delete to authenticated
using (public.current_user_is_active_campaign_game_master(campaign_id));

create policy "Campaign image recipients are visible when required"
on public.campaign_image_recipients
for select to authenticated
using (
  public.current_user_is_campaign_game_master(campaign_id)
  or (
    user_id = (select auth.uid())
    and public.current_user_is_active_campaign_player(campaign_id)
  )
);
create policy "Active Game Master manages campaign image recipients"
on public.campaign_image_recipients
for insert to authenticated
with check (
  public.current_user_is_active_campaign_game_master(campaign_id)
  and created_by = (select auth.uid())
);
create policy "Active Game Master deletes campaign image recipients"
on public.campaign_image_recipients
for delete to authenticated
using (public.current_user_is_active_campaign_game_master(campaign_id));

create policy "Campaign Game Master reads campaign video audit"
on public.campaign_video_audit_log
for select to authenticated
using (public.current_user_is_campaign_game_master(campaign_id));

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'campaign-images', 'campaign-images', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Authorized campaign participants read campaign images"
on storage.objects
for select to authenticated
using (
  bucket_id = 'campaign-images'
  and public.current_user_can_read_campaign_image_object(name)
);
create policy "Active Game Master uploads represented campaign images"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'campaign-images'
  and public.current_user_can_upload_campaign_image_object(name)
);
create policy "Active Game Master deletes represented campaign images"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'campaign-images'
  and public.current_user_can_upload_campaign_image_object(name)
);

revoke all on table public.campaign_player_publication_permissions from anon, authenticated;
revoke all on table public.campaign_media_groups from anon, authenticated;
revoke all on table public.campaign_media_group_members from anon, authenticated;
revoke all on table public.campaign_media_restrictions from anon, authenticated;
revoke all on table public.campaign_images from anon, authenticated;
revoke all on table public.campaign_image_recipients from anon, authenticated;
revoke all on table public.campaign_video_audit_log from anon, authenticated;

grant select, insert, update, delete on public.campaign_player_publication_permissions to authenticated;
grant select, insert, update, delete on public.campaign_media_groups to authenticated;
grant select, insert, delete on public.campaign_media_group_members to authenticated;
grant select, insert, delete on public.campaign_media_restrictions to authenticated;
grant select, insert, update, delete on public.campaign_images to authenticated;
grant select, insert, delete on public.campaign_image_recipients to authenticated;
grant select on public.campaign_video_audit_log to authenticated;

revoke all on function public.current_user_is_active_campaign_game_master(uuid) from public, anon, authenticated, service_role;
revoke all on function public.current_user_is_active_campaign_player(uuid) from public, anon, authenticated, service_role;
revoke all on function public.current_user_can_access_active_campaign(uuid) from public, anon, authenticated, service_role;
revoke all on function public.enforce_campaign_membership_lifecycle() from public, anon, authenticated, service_role;
revoke all on function public.enforce_active_campaign_video_mutation() from public, anon, authenticated, service_role;
revoke all on function public.enforce_campaign_publication_permission_update() from public, anon, authenticated, service_role;
revoke all on function public.enforce_campaign_media_group_update() from public, anon, authenticated, service_role;
revoke all on function public.enforce_campaign_image_update_rules() from public, anon, authenticated, service_role;
revoke all on function public.enforce_campaign_image_delete_order() from public, anon, authenticated, service_role;
revoke all on function public.enforce_selected_campaign_image_recipients() from public, anon, authenticated, service_role;
revoke all on function public.handle_campaign_video_member_removal() from public, anon, authenticated, service_role;
revoke all on function public.audit_campaign_publication_permission_change() from public, anon, authenticated, service_role;
revoke all on function public.audit_campaign_media_group_change() from public, anon, authenticated, service_role;
revoke all on function public.audit_campaign_media_group_membership_change() from public, anon, authenticated, service_role;
revoke all on function public.audit_campaign_media_restriction_change() from public, anon, authenticated, service_role;
revoke all on function public.audit_campaign_image_change() from public, anon, authenticated, service_role;
revoke all on function public.audit_campaign_image_recipient_change() from public, anon, authenticated, service_role;
revoke all on function public.reorder_campaign_players(uuid, uuid[]) from public, anon, authenticated, service_role;
revoke all on function public.reorder_campaign_media_groups(uuid, uuid[]) from public, anon, authenticated, service_role;
revoke all on function public.set_campaign_image_visibility(uuid, text, uuid[]) from public, anon, authenticated, service_role;
revoke all on function public.current_user_can_read_campaign_image_object(text) from public, anon, authenticated, service_role;
revoke all on function public.current_user_can_upload_campaign_image_object(text) from public, anon, authenticated, service_role;

grant execute on function public.current_user_is_active_campaign_game_master(uuid) to authenticated;
grant execute on function public.current_user_is_active_campaign_player(uuid) to authenticated;
grant execute on function public.current_user_can_access_active_campaign(uuid) to authenticated;
grant execute on function public.reorder_campaign_players(uuid, uuid[]) to authenticated;
grant execute on function public.reorder_campaign_media_groups(uuid, uuid[]) to authenticated;
grant execute on function public.set_campaign_image_visibility(uuid, text, uuid[]) to authenticated;
grant execute on function public.current_user_can_read_campaign_image_object(text) to authenticated;
grant execute on function public.current_user_can_upload_campaign_image_object(text) to authenticated;

-- Existing function was replaced above; retain its reviewed application grant.
revoke all on function public.accept_campaign_invitation(text)
  from public, anon, authenticated, service_role;
grant execute on function public.accept_campaign_invitation(text) to authenticated;

-- No direct application grant exists for the audit identity sequence.
-- No UPDATE policy exists for campaign media restrictions, group membership,
-- image recipients, or campaign-image Storage objects. Object upsert/rename is
-- therefore unavailable.
