-- Keep uploads active-only while allowing the permanent Game Master to remove
-- represented private objects before deleting either an active or completed
-- campaign. Campaign image metadata remains read-only after completion and is
-- removed only by the final campaign cascade.
create or replace function public.current_user_can_delete_campaign_image_object(
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
      and campaign.game_master_id = (select auth.uid())
  );
$$;

revoke all on function public.current_user_can_delete_campaign_image_object(text)
  from public, anon, authenticated, service_role;
grant execute on function public.current_user_can_delete_campaign_image_object(text)
  to authenticated;

drop policy if exists "Active Game Master deletes represented campaign images"
  on storage.objects;
create policy "Campaign Game Master deletes represented campaign images"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'campaign-images'
  and public.current_user_can_delete_campaign_image_object(name)
);
