-- handle_new_user is an Auth-trigger implementation detail. PostgreSQL grants
-- EXECUTE on new functions to PUBLIC by default, and the initial schema also
-- granted the three application roles directly. The existing trigger remains
-- bound to this owner-executed SECURITY DEFINER function after these revokes.
revoke execute on function public.handle_new_user()
  from public, anon, authenticated, service_role;

-- Foreign-key support indexes confirmed missing by catalog inspection. These
-- use the exact child-key order so parent updates/deletes and related joins do
-- not require full scans of the referencing tables.
create index if not exists campaign_characters_linked_by_idx
  on public.campaign_characters(linked_by);

create index if not exists campaign_images_campaign_id_uploader_id_idx
  on public.campaign_images(campaign_id, uploader_id);

create index if not exists campaign_invitations_accepted_by_idx
  on public.campaign_invitations(accepted_by);

create index if not exists campaign_invitations_created_by_idx
  on public.campaign_invitations(created_by);

create index if not exists characters_owner_id_idx
  on public.characters(owner_id);
