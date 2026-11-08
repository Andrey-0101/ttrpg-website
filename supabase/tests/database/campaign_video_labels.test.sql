-- Synthetic local fixtures only; every change is rolled back.
begin;
select no_plan();

insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('9a100000-0000-4000-8000-00000000000' || n)::uuid, 'authenticated', 'authenticated',
  'video-labels-' || n || '@example.test', '', '{}', '{}', now(), now()
from generate_series(1, 5) as n;
insert into public.campaigns (id, game_master_id, game_system, name) values
('9a100000-0000-4000-8000-000000000010', '9a100000-0000-4000-8000-000000000001', 'vtm-v5', 'Labels'),
('9a100000-0000-4000-8000-000000000011', '9a100000-0000-4000-8000-000000000004', 'vtm-v5', 'Unrelated'),
('9a100000-0000-4000-8000-000000000012', '9a100000-0000-4000-8000-000000000002', 'vtm-v5', 'Also GM');
insert into public.campaign_members (campaign_id, user_id, display_order) values
('9a100000-0000-4000-8000-000000000010', '9a100000-0000-4000-8000-000000000002', 1),
('9a100000-0000-4000-8000-000000000010', '9a100000-0000-4000-8000-000000000003', 2),
('9a100000-0000-4000-8000-000000000011', '9a100000-0000-4000-8000-000000000005', 1);
insert into public.characters (id, owner_id, game_system, name) values
('9a100000-0000-4000-8000-000000000020', '9a100000-0000-4000-8000-000000000002', 'vtm-v5', 'Alice character'),
('9a100000-0000-4000-8000-000000000021', '9a100000-0000-4000-8000-000000000003', 'vtm-v5', 'Bob character'),
('9a100000-0000-4000-8000-000000000022', '9a100000-0000-4000-8000-000000000002', 'vtm-v5', 'Unassigned');
create temporary table initial_signals as select campaign_id, revision from public.campaign_membership_signals;
insert into public.campaign_characters (campaign_id, character_id, linked_by) values
('9a100000-0000-4000-8000-000000000010', '9a100000-0000-4000-8000-000000000020', '9a100000-0000-4000-8000-000000000002'),
('9a100000-0000-4000-8000-000000000010', '9a100000-0000-4000-8000-000000000021', '9a100000-0000-4000-8000-000000000003');
select is((select revision from public.campaign_membership_signals where campaign_id = '9a100000-0000-4000-8000-000000000010'),
  (select revision + 2 from initial_signals where campaign_id = '9a100000-0000-4000-8000-000000000010'), 'assignment changes invalidate the directory');

select ok(not has_function_privilege('anon', 'public.get_campaign_video_character_names(uuid)', 'execute'), 'anonymous RPC execution denied');
select ok(not has_function_privilege('anon', 'campaign_video_labels.assigned_character_names(uuid)', 'execute'), 'anonymous helper execution denied');
select ok(not has_schema_privilege('authenticated', 'private', 'usage'), 'existing internal schema remains closed to clients');
select ok(not has_function_privilege('authenticated', 'private.signal_campaign_directory_profile_change()', 'execute'), 'trigger implementation is not client callable');
select is(pg_get_function_result('public.get_campaign_video_character_names(uuid)'::regprocedure),
  'TABLE(participant_id uuid, character_name text)', 'RPC exposes only participant ID and character name');

set local role authenticated;
set local request.jwt.claim.sub = '9a100000-0000-4000-8000-000000000001';
select results_eq($$select character_name from public.get_campaign_video_character_names('9a100000-0000-4000-8000-000000000010') order by participant_id$$,
  $$values ('Alice character'::text), ('Bob character'::text)$$, 'GM receives only assigned names');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '9a100000-0000-4000-8000-000000000002';
select results_eq($$select character_name from public.get_campaign_video_character_names('9a100000-0000-4000-8000-000000000010') order by participant_id$$,
  $$values ('Alice character'::text), ('Bob character'::text)$$, 'Player receives the identical underlying names');
select is((select count(*) from public.characters where id = '9a100000-0000-4000-8000-000000000021'), 0::bigint, 'name projection does not grant peer sheet access');
select throws_ok($$select * from public.get_campaign_video_character_names('9a100000-0000-4000-8000-000000000011')$$,
  '42501', 'campaign_directory_unavailable', 'another campaign is denied');
update public.profiles set display_name = 'Renamed profile' where id = '9a100000-0000-4000-8000-000000000002';
update public.characters set name = 'Renamed character' where id = '9a100000-0000-4000-8000-000000000020';
select is((select character_name from public.get_campaign_video_character_names('9a100000-0000-4000-8000-000000000010') where participant_id = '9a100000-0000-4000-8000-000000000002'),
  'Renamed character', 'RPC reads the current saved name');
reset role;
select is((select revision from public.campaign_membership_signals where campaign_id = '9a100000-0000-4000-8000-000000000010'),
  (select revision + 4 from initial_signals where campaign_id = '9a100000-0000-4000-8000-000000000010'), 'profile and assigned rename invalidate affected campaign');
select is((select revision from public.campaign_membership_signals where campaign_id = '9a100000-0000-4000-8000-000000000011'),
  (select revision from initial_signals where campaign_id = '9a100000-0000-4000-8000-000000000011'), 'unrelated campaign receives no signal');
select ok(exists(select 1 from public.campaign_membership_signals where campaign_id = '9a100000-0000-4000-8000-000000000012'), 'profile update also invalidates campaigns where the account is GM');
update public.characters set name = 'Changed unused' where id = '9a100000-0000-4000-8000-000000000022';
select is((select revision from public.campaign_membership_signals where campaign_id = '9a100000-0000-4000-8000-000000000010'),
  (select revision + 4 from initial_signals where campaign_id = '9a100000-0000-4000-8000-000000000010'), 'unassigned rename does not invalidate campaign');

set local role authenticated;
set local request.jwt.claim.sub = '9a100000-0000-4000-8000-000000000004';
select throws_ok($$select * from public.get_campaign_video_character_names('9a100000-0000-4000-8000-000000000010')$$,
  '42501', 'campaign_directory_unavailable', 'GM of a different campaign is an outsider');
set local request.jwt.claim.sub = '';
select throws_ok($$select * from public.get_campaign_video_character_names('9a100000-0000-4000-8000-000000000010')$$,
  '42501', 'campaign_directory_unavailable', 'authenticated role without an authenticated caller is denied');
reset role;

update public.campaign_characters set unlinked_at = now() where character_id = '9a100000-0000-4000-8000-000000000020';
set local role authenticated;
set local request.jwt.claim.sub = '9a100000-0000-4000-8000-000000000003';
select is((select count(*) from public.get_campaign_video_character_names('9a100000-0000-4000-8000-000000000010')), 1::bigint, 'unlinked character no longer contributes a name');
reset role;
select is((select revision from public.campaign_membership_signals where campaign_id = '9a100000-0000-4000-8000-000000000010'),
  (select revision + 5 from initial_signals where campaign_id = '9a100000-0000-4000-8000-000000000010'), 'unlink invalidates the directory');
delete from public.campaign_members where campaign_id = '9a100000-0000-4000-8000-000000000010' and user_id = '9a100000-0000-4000-8000-000000000003';
set local role authenticated;
set local request.jwt.claim.sub = '9a100000-0000-4000-8000-000000000003';
select throws_ok($$select * from public.get_campaign_video_character_names('9a100000-0000-4000-8000-000000000010')$$,
  '42501', 'campaign_directory_unavailable', 'removed member cannot call RPC');
reset role;
update public.campaigns set status = 'completed' where id = '9a100000-0000-4000-8000-000000000010';
set local role authenticated;
set local request.jwt.claim.sub = '9a100000-0000-4000-8000-000000000001';
select is((select count(*) from public.get_campaign_video_character_names('9a100000-0000-4000-8000-000000000010')), 0::bigint, 'completed overview retains directory compatibility without character names');
reset role;
select * from finish();
rollback;
