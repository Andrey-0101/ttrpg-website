create table public.campaign_image_thumbnails (
  image_id uuid primary key references public.campaign_images(id) on delete cascade,
  source_version text not null,
  webp_base64 text not null check (length(webp_base64) between 1 and 174764)
);

alter table public.campaign_image_thumbnails enable row level security;
revoke all on public.campaign_image_thumbnails from public, anon, authenticated, service_role;
grant select, insert, update on public.campaign_image_thumbnails to service_role;
