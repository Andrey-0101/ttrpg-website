alter table public.campaign_images
add column category text not null default 'handout',
add constraint campaign_images_category_check
check (category in ('handout', 'npc', 'maps_plans', 'other'));

comment on column public.campaign_images.category is
'Fixed image-only Campaign Gallery section. Category is organizational metadata and does not grant access.';

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
    or new.category is distinct from old.category
    or new.created_at is distinct from old.created_at
  then
    raise exception 'campaign_image_identity_is_immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
