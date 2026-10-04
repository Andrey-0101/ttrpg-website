begin;
select no_plan();

insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('96000000-0000-4000-8000-00000000000' || n)::uuid, 'authenticated', 'authenticated',
  'character-access-' || n || '@example.test', '', '{}', '{}', now(), now()
from generate_series(1, 4) as n;
insert into public.campaigns (id, game_master_id, game_system, name)
values ('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000001', 'vtm-v5', 'Access matrix');
insert into public.campaign_members (campaign_id, user_id, display_order) values
('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000002', 1),
('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000003', 2);
insert into public.characters (id, owner_id, game_system, name, portrait_url) values
('96000000-0000-4000-8000-000000000020', '96000000-0000-4000-8000-000000000002', 'vtm-v5', 'Linked', '96000000-0000-4000-8000-000000000002/96000000-0000-4000-8000-000000000020/portrait.png'),
('96000000-0000-4000-8000-000000000021', '96000000-0000-4000-8000-000000000002', 'vtm-v5', 'Unrelated', null),
('96000000-0000-4000-8000-000000000022', '96000000-0000-4000-8000-000000000002', 'call-of-cthulhu-7e', 'Wrong system', null),
('96000000-0000-4000-8000-000000000023', '96000000-0000-4000-8000-000000000003', 'vtm-v5', 'Other owner', null),
('96000000-0000-4000-8000-000000000024', '96000000-0000-4000-8000-000000000004', 'vtm-v5', 'Outsider', null);
insert into storage.objects (bucket_id, name)
values ('character-portraits', '96000000-0000-4000-8000-000000000002/96000000-0000-4000-8000-000000000020/portrait.png');

select hasnt_column('public', 'characters', 'visibility', 'final character schema has no persisted visibility');
select ok(not (select public from storage.buckets where id = 'character-portraits'), 'portraits remain private');

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000002';
select is((select count(*) from public.characters where id = '96000000-0000-4000-8000-000000000020'), 1::bigint, 'owner reads own sheet');
select is((select count(*) from storage.objects where bucket_id = 'character-portraits'), 1::bigint, 'owner reads own portrait');
select lives_ok($$insert into public.characters (id, owner_id, game_system, name)
values ('96000000-0000-4000-8000-000000000025', '96000000-0000-4000-8000-000000000002', 'vtm-v5', 'Owner CRUD')$$, 'owner creates without visibility');
with changed as (update public.characters set name = 'Saved' where id = '96000000-0000-4000-8000-000000000025' returning id)
select is(count(*), 1::bigint, 'owner saves own sheet') from changed;
with changed as (delete from public.characters where id = '96000000-0000-4000-8000-000000000025' returning id)
select is(count(*), 1::bigint, 'owner deletes unlinked sheet') from changed;
select throws_ok($$insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000022', '96000000-0000-4000-8000-000000000002')$$,
'P0001', 'Character and campaign game systems must match', 'system mismatch remains rejected');
select throws_ok($$insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000023', '96000000-0000-4000-8000-000000000002')$$,
'P0001', 'Character assignment must be created by the character owner', 'wrong-owner assignment remains rejected');
select lives_ok($$insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000020', '96000000-0000-4000-8000-000000000002')$$,
'owner links matching-system character without a visibility step');
select throws_ok($$delete from public.characters where id = '96000000-0000-4000-8000-000000000020'$$,
'P0001', 'campaign_character_linked_delete', 'linked deletion restriction remains');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000001';
select is((select count(*) from public.characters where id = '96000000-0000-4000-8000-000000000020'), 1::bigint, 'exact campaign GM reads linked sheet');
select is((select count(*) from public.characters where id = '96000000-0000-4000-8000-000000000021'), 0::bigint, 'GM cannot read same owners unrelated sheet');
select is((select count(*) from storage.objects where bucket_id = 'character-portraits'), 1::bigint, 'GM reads linked portrait');
with changed as (update public.characters set name = 'Forged' where id = '96000000-0000-4000-8000-000000000020' returning id)
select is(count(*), 0::bigint, 'GM cannot update linked sheet') from changed;
with changed as (delete from public.characters where id = '96000000-0000-4000-8000-000000000020' returning id)
select is(count(*), 0::bigint, 'GM cannot delete linked sheet') from changed;
with changed as (update storage.objects set metadata = '{"forged":true}' where bucket_id = 'character-portraits' returning id)
select is(count(*), 0::bigint, 'GM cannot mutate portrait') from changed;
select throws_ok($$delete from storage.objects where bucket_id = 'character-portraits'$$,
'42501', 'Direct deletion from storage tables is not allowed. Use the Storage API instead.',
'GM direct Storage deletion is rejected by the native Storage API-only guard');
select ok(exists (
  select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'Users can delete their own character portraits' and cmd = 'DELETE'
    and qual like '%foldername(name)%' and qual like '%auth.uid()%'
), 'Storage API portrait DELETE remains owner-folder only, not a GM grant');
select throws_ok($$insert into storage.objects (bucket_id, name)
values ('character-portraits', '96000000-0000-4000-8000-000000000002/96000000-0000-4000-8000-000000000020/forged.png')$$,
'42501', null, 'GM cannot upload another owners portrait');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000003';
select is((select count(*) from public.characters where id = '96000000-0000-4000-8000-000000000020'), 0::bigint, 'another Player cannot read linked sheet');
select is((select count(*) from storage.objects where bucket_id = 'character-portraits'), 0::bigint, 'another Player cannot read linked portrait');
with changed as (update public.characters set name = 'Forged' where id = '96000000-0000-4000-8000-000000000020' returning id)
select is(count(*), 0::bigint, 'another Player cannot update sheet') from changed;
with changed as (delete from public.characters where id = '96000000-0000-4000-8000-000000000020' returning id)
select is(count(*), 0::bigint, 'another Player cannot delete sheet') from changed;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000004';
select is((select count(*) from public.characters where id = '96000000-0000-4000-8000-000000000020'), 0::bigint, 'Outsider cannot read linked sheet');
select is((select count(*) from storage.objects where bucket_id = 'character-portraits'), 0::bigint, 'Outsider cannot read portrait');
select throws_ok($$insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000024', '96000000-0000-4000-8000-000000000004')$$,
'P0001', 'Character owner is not a campaign participant', 'membership requirement remains enforced');
reset role;
set local role anon;
select is((select count(*) from public.characters), 0::bigint, 'anonymous cannot read any character');
select is((select count(*) from storage.objects where bucket_id = 'character-portraits'), 0::bigint, 'anonymous cannot read private portrait');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000002';
update public.campaign_characters set unlinked_at = now() where character_id = '96000000-0000-4000-8000-000000000020';
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000001';
select is((select count(*) from public.characters where id = '96000000-0000-4000-8000-000000000020'), 0::bigint, 'GM access ends on unlink even with known character ID');
select is((select count(*) from storage.objects where bucket_id = 'character-portraits'), 0::bigint, 'portrait access ends on unlink');
reset role;

insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000020', '96000000-0000-4000-8000-000000000002');
delete from public.campaign_members where campaign_id = '96000000-0000-4000-8000-000000000010' and user_id = '96000000-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000001';
select is((select count(*) from public.characters where id = '96000000-0000-4000-8000-000000000020'), 0::bigint, 'GM loses access after linked owner removal');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000002';
select is((select count(*) from public.characters where id = '96000000-0000-4000-8000-000000000020'), 1::bigint, 'removed owner keeps own sheet');
select is((select count(*) from storage.objects where bucket_id = 'character-portraits'), 1::bigint, 'removed owner keeps own portrait');
select is((select count(*) from public.characters where id = '96000000-0000-4000-8000-000000000023'), 0::bigint, 'removed Player has no other-owner access');
reset role;

insert into public.campaign_members (campaign_id, user_id, display_order)
values ('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000002', 1);
insert into public.campaign_characters (campaign_id, character_id, linked_by)
values ('96000000-0000-4000-8000-000000000010', '96000000-0000-4000-8000-000000000020', '96000000-0000-4000-8000-000000000002');
update public.campaigns set status = 'completed' where id = '96000000-0000-4000-8000-000000000010';
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000001';
select is((select count(*) from public.characters where id = '96000000-0000-4000-8000-000000000020'), 0::bigint, 'completed campaign grants no historical sheet access');
select is((select count(*) from storage.objects where bucket_id = 'character-portraits'), 0::bigint, 'completed campaign grants no portrait access');
reset role;

select * from finish();
rollback;
