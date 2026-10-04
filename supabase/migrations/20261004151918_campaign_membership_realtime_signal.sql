-- A campaign-scoped invalidation contains no member IDs or profile data.
-- Avoid both unprotected member DELETE payloads and writes to campaign metadata.
create table public.campaign_membership_signals (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  revision bigint not null default 1
);

alter table public.campaign_membership_signals enable row level security;
revoke all on table public.campaign_membership_signals from public, anon, authenticated;
grant select on table public.campaign_membership_signals to authenticated;
create policy "Campaign participants can read membership signals"
on public.campaign_membership_signals for select to authenticated
using (public.current_user_can_access_campaign(campaign_id));

create function private.signal_campaign_membership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.campaign_membership_signals (campaign_id)
  select id from public.campaigns
  where id = coalesce(new.campaign_id, old.campaign_id)
  on conflict (campaign_id) do update
    set revision = public.campaign_membership_signals.revision + 1;
  return null;
end;
$$;

revoke all on function private.signal_campaign_membership_change()
  from public, anon, authenticated;

create trigger campaign_members_signal_directory_change
after insert or update or delete on public.campaign_members
for each row execute function private.signal_campaign_membership_change();

-- Only a lightweight invalidation, never a browser-owned directory/identity.
alter publication supabase_realtime add table public.campaign_membership_signals;
