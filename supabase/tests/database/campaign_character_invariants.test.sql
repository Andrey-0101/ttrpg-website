begin;
select no_plan();

insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
('95000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'characters-gm@example.test', '', '{}', '{}', now(), now()),
('95000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'characters-player@example.test', '', '{}', '{}', now(), now()),
('95000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'characters-other@example.test', '', '{}', '{}', now(), now());
insert into public.campaigns (id, game_master_id, game_system, name)
values ('95000000-0000-4000-8000-000000000010', '95000000-0000-4000-8000-000000000001', 'vtm-v5', 'Characters invariants');
insert into public.campaign_members (campaign_id, user_id, display_order)
values ('95000000-0000-4000-8000-000000000010', '95000000-0000-4000-8000-000000000002', 1),
('95000000-0000-4000-8000-000000000010', '95000000-0000-4000-8000-000000000003', 2);
insert into public.characters (id, owner_id, game_system, name)
values
('95000000-0000-4000-8000-000000000020', '95000000-0000-4000-8000-000000000002', 'vtm-v5', 'First'),
('95000000-0000-4000-8000-000000000021', '95000000-0000-4000-8000-000000000002', 'vtm-v5', 'Second'),
('95000000-0000-4000-8000-000000000022', '95000000-0000-4000-8000-000000000001', 'vtm-v5', 'GM character');

set local role authenticated;
set local request.jwt.claim.sub = '95000000-0000-4000-8000-000000000002';
select lives_ok($$insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('95000000-0000-4000-8000-000000000010', '95000000-0000-4000-8000-000000000020', '95000000-0000-4000-8000-000000000002')$$,
'first player assignment succeeds');
select throws_ok($$insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('95000000-0000-4000-8000-000000000010', '95000000-0000-4000-8000-000000000021', '95000000-0000-4000-8000-000000000002')$$,
'23505', null, 'second active assignment for the same player fails');
select throws_ok($$delete from public.characters where id = '95000000-0000-4000-8000-000000000020'$$,
'P0001', 'campaign_character_linked_delete', 'owner cannot delete linked character via cascade');
select lives_ok($$update public.campaign_characters set unlinked_at = now() where character_id = '95000000-0000-4000-8000-000000000020' and unlinked_at is null$$,
'unlink succeeds without a Game Session');
select lives_ok($$insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('95000000-0000-4000-8000-000000000010', '95000000-0000-4000-8000-000000000021', '95000000-0000-4000-8000-000000000002')$$,
'another character can be assigned after unlink');
select lives_ok($$delete from public.characters where id = '95000000-0000-4000-8000-000000000020'$$,
'owner can delete the unlinked character');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '95000000-0000-4000-8000-000000000001';
select throws_ok($$insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('95000000-0000-4000-8000-000000000010', '95000000-0000-4000-8000-000000000022', '95000000-0000-4000-8000-000000000001')$$,
'P0001', 'campaign_character_game_master', 'GM cannot assign a character');
select lives_ok($$select public.start_game_session('95000000-0000-4000-8000-000000000010')$$, 'start canonical session');
select is((select count(*) from public.characters where id = '95000000-0000-4000-8000-000000000021'), 1::bigint, 'GM reads shared linked sheet through existing RLS');
with changed as (update public.characters set name = 'Forged' where id = '95000000-0000-4000-8000-000000000021' returning id)
select is(count(*), 0::bigint, 'GM cannot save another owners sheet') from changed;
select throws_ok($$update public.campaign_characters set unlinked_at = now() where character_id = '95000000-0000-4000-8000-000000000021' and unlinked_at is null$$,
'P0001', 'campaign_character_active_session', 'GM cannot unlink during a session');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '95000000-0000-4000-8000-000000000002';
select throws_ok($$update public.campaign_characters set unlinked_at = now() where character_id = '95000000-0000-4000-8000-000000000021' and unlinked_at is null$$,
'P0001', 'campaign_character_active_session', 'player cannot unlink during a session');
select throws_ok($$update public.characters set game_system = 'call-of-cthulhu-7e' where id = '95000000-0000-4000-8000-000000000021'$$,
'P0001', 'campaign_character_active_session', 'system change cannot indirectly unlink');
select throws_ok($$delete from public.campaign_members where campaign_id = '95000000-0000-4000-8000-000000000010' and user_id = '95000000-0000-4000-8000-000000000002'$$,
'P0001', 'campaign_character_active_session', 'leaving cannot indirectly unlink during a session');
select lives_ok($$update public.characters set name = 'Saved player name', sheet_data = '{"fixture":true}' where id = '95000000-0000-4000-8000-000000000021'$$,
'owner ordinary sheet save remains available during session');
reset role;
select throws_ok($$update public.characters set owner_id = '95000000-0000-4000-8000-000000000003' where id = '95000000-0000-4000-8000-000000000021'$$,
'P0001', 'Linked character ownership cannot be changed', 'ownership transfer cannot break active assignment');
select is((select count(*) from public.campaign_characters where campaign_id = '95000000-0000-4000-8000-000000000010' and unlinked_at is null), 1::bigint, 'failed mutations preserve active relationship');

set local role authenticated;
set local request.jwt.claim.sub = '95000000-0000-4000-8000-000000000003';
with changed as (update public.characters set name = 'Forged' where id = '95000000-0000-4000-8000-000000000021' returning id)
select is(count(*), 0::bigint, 'other player cannot save shared sheet') from changed;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '95000000-0000-4000-8000-000000000001';
select lives_ok($$select public.end_game_session('95000000-0000-4000-8000-000000000010')$$, 'end canonical session');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '95000000-0000-4000-8000-000000000002';
select lives_ok($$update public.campaign_characters set unlinked_at = now() where character_id = '95000000-0000-4000-8000-000000000021' and unlinked_at is null$$, 'unlink succeeds after explicit End');
select lives_ok($$insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('95000000-0000-4000-8000-000000000010', '95000000-0000-4000-8000-000000000021', '95000000-0000-4000-8000-000000000002')$$, 'relink succeeds');
reset role;

-- Expired but not yet swept sessions use exactly the canonical expiry predicate.
insert into public.game_sessions (campaign_id, started_at, presence_expires_at)
values ('95000000-0000-4000-8000-000000000010', now() - interval '2 hours', now() - interval '1 hour');
set local role authenticated;
set local request.jwt.claim.sub = '95000000-0000-4000-8000-000000000002';
select lives_ok($$update public.characters set game_system = 'call-of-cthulhu-7e' where id = '95000000-0000-4000-8000-000000000021'$$, 'expired session does not block incompatible-system auto-unlink');
reset role;
update public.characters set game_system = 'vtm-v5' where id = '95000000-0000-4000-8000-000000000021';
insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('95000000-0000-4000-8000-000000000010', '95000000-0000-4000-8000-000000000021', '95000000-0000-4000-8000-000000000002');
set local role authenticated;
set local request.jwt.claim.sub = '95000000-0000-4000-8000-000000000001';
select lives_ok($$select public.start_game_session('95000000-0000-4000-8000-000000000010')$$, 'start closes stale session using existing lifecycle');
select lives_ok($$update public.campaigns set status = 'completed' where id = '95000000-0000-4000-8000-000000000010'$$, 'campaign completion ends session before closing assignments');
reset role;
select is((select count(*) from public.game_sessions where campaign_id = '95000000-0000-4000-8000-000000000010' and ended_at is null), 0::bigint, 'completed campaign retains no active session');
select is((select count(*) from public.campaign_characters where campaign_id = '95000000-0000-4000-8000-000000000010' and unlinked_at is null), 0::bigint, 'completed campaign retains no active assignment');

insert into public.campaigns (id, game_master_id, game_system, name)
values ('95000000-0000-4000-8000-000000000011', '95000000-0000-4000-8000-000000000001', 'vtm-v5', 'Campaign deletion');
insert into public.campaign_members (campaign_id, user_id, display_order)
values ('95000000-0000-4000-8000-000000000011', '95000000-0000-4000-8000-000000000002', 1);
insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('95000000-0000-4000-8000-000000000011', '95000000-0000-4000-8000-000000000021', '95000000-0000-4000-8000-000000000002');
set local role authenticated;
set local request.jwt.claim.sub = '95000000-0000-4000-8000-000000000001';
select public.start_game_session('95000000-0000-4000-8000-000000000011');
select lives_ok($$delete from public.campaigns where id = '95000000-0000-4000-8000-000000000011'$$, 'existing campaign deletion cascade remains valid');
reset role;
select is((select count(*) from public.characters where id = '95000000-0000-4000-8000-000000000021'), 1::bigint, 'campaign deletion preserves player character');
select ok(not has_function_privilege('authenticated', 'private.protect_linked_character()', 'EXECUTE'), 'internal protection is not a client RPC');
select is((select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and tablename in ('characters', 'campaign_characters')), 0::bigint, 'no character Realtime publication');
select * from finish();
rollback;
