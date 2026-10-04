begin;
select no_plan();
insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('96000000-0000-4000-8000-00000000000' || n)::uuid, 'authenticated', 'authenticated',
  'notes-' || n || '@example.test', '', '{}', '{}', now(), now() from generate_series(1,4) n;
insert into public.campaigns (id, game_master_id, game_system, name) values
('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000001', 'vtm-v5', 'Original campaign'),
('96000000-0000-4000-8000-000000000011', '96000000-0000-4000-8000-000000000004', 'vtm-v5', 'Other campaign');
insert into public.campaign_members (campaign_id, user_id, display_order) values
('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000002', 1),
('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000003', 2);
create temporary table fixture (label text primary key, id uuid);
grant all on fixture to authenticated;
create temporary table original_note as select * from public.campaign_note_entries limit 0;
grant all on original_note to authenticated;

select is((select array_agg(number order by id) from (
  select id, row_number() over (partition by campaign_id order by started_at,id)::integer number
  from (values (1,1,'2026-01-02'::timestamptz),(2,1,'2026-01-01'::timestamptz),(3,1,'2026-01-02'::timestamptz)) v(id,campaign_id,started_at)
) n), array[2,1,3], 'historical numbering is chronological with stable ID tie-break');
select ok(not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='campaign_note_entries'), 'Notes has no Realtime publication');
select ok(not has_table_privilege('authenticated','public.campaign_note_entries','INSERT,UPDATE,DELETE'), 'no direct authenticated Notes writes');
select ok(not has_table_privilege('anon','public.campaign_note_entries','SELECT'), 'anonymous has no SELECT grant');

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000001';
insert into fixture select 'gm', id from public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',null,'GM private','Australia/Perth');
select is((select count(*) from public.campaign_note_entries), 1::bigint, 'GM reads own Notes');
select is((select game_session_id from public.campaign_note_entries), null::uuid, 'no session at Save means no link');
select is((select created_timezone from public.campaign_note_entries), 'Australia/Perth', 'creation timezone stored');
select ok((select created_at between transaction_timestamp() and clock_timestamp() from public.campaign_note_entries), 'creation timestamp is server-generated');
select lives_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','edit',(select id from fixture where label='gm'),'GM edited','UTC')$$, 'GM edits own Notes');
select lives_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','delete',(select id from fixture where label='gm'))$$, 'GM deletes own Notes');
insert into fixture select 'gm2', id from public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',null,'GM private again','UTC');
insert into fixture select 'session1', id from public.start_game_session('96000000-0000-4000-8000-000000000010');
select is((select session_number from public.game_sessions where id=(select id from fixture where label='session1')), 1, 'legacy Start RPC assigns first number');
select is((select title from public.game_sessions where id=(select id from fixture where label='session1')), null::text, 'legacy Start RPC works without title');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000002';
select is((select count(*) from public.campaign_note_entries), 0::bigint, 'Player cannot read GM Notes');
insert into fixture select 'player', id from public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',null,'Player private','America/New_York');
insert into original_note select * from public.campaign_note_entries;
select is((select count(*) from public.campaign_note_entries), 1::bigint, 'Player reads only own Notes');
select is((select owner_id from public.campaign_note_entries), '96000000-0000-4000-8000-000000000002'::uuid, 'owner derived from auth.uid');
select is((select game_session_id from public.campaign_note_entries), (select id from fixture where label='session1'), 'canonical active session automatically linked');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','edit',(select id from fixture where label='gm2'),'Forged','UTC')$$,'P0001','campaign_note_unavailable','Player cannot edit GM note');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','delete',(select id from fixture where label='gm2'))$$,'P0001','campaign_note_unavailable','Player cannot delete GM note');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000011','edit',(select id from fixture where label='player'),'Forged','UTC')$$,'P0001','campaign_notes_read_only','foreign campaign spoof rejected');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',(select id from fixture where label='gm2'),'Forged','UTC')$$,'P0001','malformed_request','create ID spoof rejected');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',null,'body','not/a/zone')$$,'P0001','malformed_request','invalid timezone rejected');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',null,E'\n\t','UTC')$$,'P0001','malformed_request','whitespace-only body rejected');
select throws_ok($$update public.campaign_note_entries set owner_id='96000000-0000-4000-8000-000000000001'$$,'42501',null,'direct owner spoof rejected');
select throws_ok($$update public.campaign_note_entries set game_session_id=null$$,'42501',null,'direct session spoof rejected');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000001';
select is((select count(*) from public.campaign_note_entries), 1::bigint, 'GM cannot read Player note despite campaign authority');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','edit',(select id from fixture where label='player'),'Forged','UTC')$$,'P0001','campaign_note_unavailable','GM cannot edit Player note');
select lives_ok($$select public.renew_game_session_presence('96000000-0000-4000-8000-000000000010')$$, 'presence renewal preserved');
select lives_ok($$select public.end_game_session('96000000-0000-4000-8000-000000000010')$$, 'explicit end preserved');
insert into fixture select 'session2', id from public.start_named_game_session('96000000-0000-4000-8000-000000000010','  Escape from Innsmouth  ');
select is((select session_number from public.game_sessions where id=(select id from fixture where label='session2')), 2, 'new session increments sequence');
select is((select title from public.game_sessions where id=(select id from fixture where label='session2')), 'Escape from Innsmouth', 'optional title trimmed');
select public.end_game_session('96000000-0000-4000-8000-000000000010');
reset role;
select throws_ok($$update public.game_sessions set session_number=20 where id=(select id from fixture where label='session2')$$,'P0001','game_session_identity_immutable','session number immutable even at database boundary');
select throws_ok($$update public.game_sessions set title='Renamed' where id=(select id from fixture where label='session1')$$,'P0001','game_session_identity_immutable','missing title cannot be added later');
select throws_ok($$update public.game_sessions set title='Renamed' where id=(select id from fixture where label='session2')$$,'P0001','game_session_identity_immutable','existing title cannot be renamed');
delete from public.game_sessions where id=(select id from fixture where label='session2');
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000001';
insert into fixture select 'session3', id from public.start_named_game_session('96000000-0000-4000-8000-000000000010',E' \t ');
select is((select session_number from public.game_sessions where id=(select id from fixture where label='session3')), 3, 'deleted session number is never reused');
select is((select title from public.game_sessions where id=(select id from fixture where label='session3')), null::text, 'blank title means null');
select public.end_game_session('96000000-0000-4000-8000-000000000010');
reset role;
update public.campaigns set name='Renamed campaign' where id='96000000-0000-4000-8000-000000000010';
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000002';
select lives_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','edit',(select id from fixture where label='player'),'Edited after session ended','Asia/Tokyo')$$, 'Player edits old session-linked entry after End');
select ok((select edited_at is not null and edited_timezone='Asia/Tokyo' from public.campaign_note_entries), 'latest edit metadata captured at Save');
select ok((select n.created_at=o.created_at and n.created_timezone=o.created_timezone and n.game_session_id=o.game_session_id and n.campaign_name_snapshot=o.campaign_name_snapshot from public.campaign_note_entries n join original_note o using(id)), 'edit preserves all creation metadata and original session');
reset role;
select throws_ok($$update public.campaign_note_entries set campaign_name_snapshot='Forged' where id=(select id from fixture where label='player')$$,'P0001','campaign_note_identity_immutable','heading source immutable');
select throws_ok($$update public.campaign_note_entries set created_at=now()+interval '1 day' where id=(select id from fixture where label='player')$$,'P0001','campaign_note_identity_immutable','creation time immutable');
select lives_ok($$delete from public.game_sessions where id=(select id from fixture where label='session1')$$, 'session deletion preserves Notes');
select is((select count(*) from public.campaign_note_entries where id=(select id from fixture where label='player')), 1::bigint, 'linked note not cascade deleted');
select is((select game_session_id from public.campaign_note_entries where id=(select id from fixture where label='player')), null::uuid, 'deleted session link becomes null');

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000003';
select is((select count(*) from public.campaign_note_entries), 0::bigint, 'another Player cannot read others Notes');
insert into fixture select 'removed', id from public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',null,'Retained archive','UTC');
reset role;
delete from public.campaign_members where campaign_id='96000000-0000-4000-8000-000000000010' and user_id='96000000-0000-4000-8000-000000000003';
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000003';
select is((select count(*) from public.campaign_note_entries), 1::bigint, 'removed owner retains private readable archive');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',null,'No','UTC')$$,'P0001','campaign_notes_read_only','removed create denied');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','edit',(select id from fixture where label='removed'),'No','UTC')$$,'P0001','campaign_notes_read_only','removed edit denied');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','delete',(select id from fixture where label='removed'))$$,'P0001','campaign_notes_read_only','removed delete denied');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000004';
select is((select count(*) from public.campaign_note_entries), 0::bigint, 'outsider cannot read Notes');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',null,'No','UTC')$$,'P0001','campaign_notes_read_only','outsider writes denied');
reset role;
set local role anon;
select throws_ok($$select * from public.campaign_note_entries$$,'42501',null,'anonymous SELECT denied');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',null,'No','UTC')$$,'42501',null,'anonymous RPC denied');
reset role;

-- Timeout and completion operations still update only lifecycle fields.
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000001';
insert into fixture select 'timeout', id from public.start_game_session('96000000-0000-4000-8000-000000000010');
reset role;
update public.game_sessions set started_at=now()-interval '2 hours', presence_expires_at=now()-interval '1 hour' where id=(select id from fixture where label='timeout');
select lives_ok($$select private.expire_game_sessions()$$,'database expiry preserved');
select is((select end_reason from public.game_sessions where id=(select id from fixture where label='timeout')), 'timeout', 'expiry closes session');
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000001';
select public.start_game_session('96000000-0000-4000-8000-000000000010');
select lives_ok($$update public.campaigns set status='completed' where id='96000000-0000-4000-8000-000000000010'$$, 'campaign completion preserved');
select is((select count(*) from public.game_sessions where campaign_id='96000000-0000-4000-8000-000000000010' and ended_at is null), 0::bigint, 'completed campaign has no active session');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000002';
select is((select count(*) from public.campaign_note_entries), 1::bigint, 'completed campaign owner still reads archive');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','create',null,'No','UTC')$$,'P0001','campaign_notes_read_only','completed create denied');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','edit',(select id from fixture where label='player'),'No','UTC')$$,'P0001','campaign_notes_read_only','completed edit denied');
select throws_ok($$select public.mutate_campaign_note('96000000-0000-4000-8000-000000000010','delete',(select id from fixture where label='player'))$$,'P0001','campaign_notes_read_only','completed delete denied');
reset role;
select * from finish();
rollback;
