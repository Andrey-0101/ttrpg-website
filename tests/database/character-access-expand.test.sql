-- Local-only transition test: run after Migration A and BEFORE Migration B.
begin;
select no_plan();
select has_column('public', 'characters', 'visibility', 'expand keeps the legacy app contract');
insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('97000000-0000-4000-8000-00000000000' || n)::uuid, 'authenticated', 'authenticated',
  'character-expand-' || n || '@example.test', '', '{}', '{}', now(), now()
from generate_series(1, 3) as n;
insert into public.campaigns (id, game_master_id, game_system, name)
values ('97000000-0000-4000-8000-000000000010', '97000000-0000-4000-8000-000000000001', 'vtm-v5', 'Expand compatibility');
insert into public.campaign_members (campaign_id, user_id, display_order) values
('97000000-0000-4000-8000-000000000010', '97000000-0000-4000-8000-000000000002', 1),
('97000000-0000-4000-8000-000000000010', '97000000-0000-4000-8000-000000000003', 2);
insert into public.characters (id, owner_id, game_system, name, visibility) values
('97000000-0000-4000-8000-000000000020', '97000000-0000-4000-8000-000000000002', 'vtm-v5', 'Private legacy', 'private'),
('97000000-0000-4000-8000-000000000021', '97000000-0000-4000-8000-000000000002', 'vtm-v5', 'Campaign legacy', 'campaign'),
('97000000-0000-4000-8000-000000000022', '97000000-0000-4000-8000-000000000002', 'vtm-v5', 'Public legacy', 'public');
set local role authenticated;
set local request.jwt.claim.sub = '97000000-0000-4000-8000-000000000002';
select is((select count(*) from public.characters where visibility in ('private', 'campaign', 'public')), 3::bigint, 'old owner query still works');
select lives_ok($$insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('97000000-0000-4000-8000-000000000010', '97000000-0000-4000-8000-000000000020', '97000000-0000-4000-8000-000000000002')$$, 'legacy private character can link');
update public.characters set visibility = 'public' where id = '97000000-0000-4000-8000-000000000020';
select is((select count(*) from public.campaign_characters where unlinked_at is null), 1::bigint, 'obsolete writes do not change assignment semantics');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '97000000-0000-4000-8000-000000000001';
select is((select count(*) from public.characters where id = '97000000-0000-4000-8000-000000000020'), 1::bigint, 'GM read depends on assignment, not legacy value');
select is((select count(*) from public.characters where id = '97000000-0000-4000-8000-000000000022'), 0::bigint, 'public legacy value does not grant access');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '97000000-0000-4000-8000-000000000003';
select is((select count(*) from public.characters), 0::bigint, 'other Player cannot read even during expand');
reset role;
select * from finish();
rollback;
