-- Local-only regression. All fixture rows roll back, including on psql failure.
begin;
set local statement_timeout = '15s';

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values
  ('97000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'membership-gm@example.test', '{}', '{}'),
  ('97000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'membership-player@example.test', '{}', '{}'),
  ('97000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'membership-outsider@example.test', '{}', '{}');
insert into public.campaigns (id, game_master_id, game_system, name)
values ('97000000-0000-4000-8000-000000000010', '97000000-0000-4000-8000-000000000001', 'coc_7e', 'Local membership signal');
create temporary table campaign_metadata_before as
select * from public.campaigns where id = '97000000-0000-4000-8000-000000000010';

insert into public.campaign_members (campaign_id, user_id, display_order)
values ('97000000-0000-4000-8000-000000000010', '97000000-0000-4000-8000-000000000002', 2);
do $$ begin
  if (select revision from public.campaign_membership_signals where campaign_id = '97000000-0000-4000-8000-000000000010') <> 1 then
    raise exception 'INSERT did not signal';
  end if;
end $$;

set local role authenticated;
set local request.jwt.claim.sub = '97000000-0000-4000-8000-000000000002';
do $$ begin
  if (select count(*) from public.campaign_membership_signals) <> 1 then raise exception 'member cannot read signal'; end if;
  begin
    update public.campaign_membership_signals set revision = 999;
    raise exception 'direct signal mutation was allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
set local request.jwt.claim.sub = '97000000-0000-4000-8000-000000000003';
do $$ begin
  if exists (select 1 from public.campaign_membership_signals) then raise exception 'outsider signal leak'; end if;
end $$;
reset role;

update public.campaign_members set display_order = 6
where campaign_id = '97000000-0000-4000-8000-000000000010';
delete from public.campaign_members where campaign_id = '97000000-0000-4000-8000-000000000010';
do $$ begin
  if (select revision from public.campaign_membership_signals where campaign_id = '97000000-0000-4000-8000-000000000010') <> 3 then
    raise exception 'UPDATE/DELETE did not signal';
  end if;
  if exists (select * from campaign_metadata_before except select * from public.campaigns where id = '97000000-0000-4000-8000-000000000010') then
    raise exception 'membership changed campaign metadata';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'campaign_membership_signals') then
    raise exception 'signal is not published';
  end if;
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'campaign_members') then
    raise exception 'raw membership was published';
  end if;
  if has_function_privilege('authenticated', 'private.signal_campaign_membership_change()', 'EXECUTE') then
    raise exception 'trigger function exposed';
  end if;
end $$;
set local role authenticated;
set local request.jwt.claim.sub = '97000000-0000-4000-8000-000000000002';
do $$ begin
  if exists (select 1 from public.campaign_membership_signals) then raise exception 'removed member can still read'; end if;
end $$;
set local request.jwt.claim.sub = '97000000-0000-4000-8000-000000000001';
do $$ begin
  if not exists (select 1 from public.campaign_membership_signals) then raise exception 'GM cannot read'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform * from public.campaign_membership_signals;
    raise exception 'anonymous read allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

update public.campaigns set status = 'completed' where id = '97000000-0000-4000-8000-000000000010';
delete from auth.users where id = '97000000-0000-4000-8000-000000000002';
delete from public.campaigns where id = '97000000-0000-4000-8000-000000000010';
rollback;
select 'PASS: membership signals INSERT/UPDATE/DELETE, RLS, grants, metadata preservation and cascade cleanup' as result;
