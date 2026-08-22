begin;

select no_plan();

-- Deterministic local-only identities.
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  id::uuid,
  'authenticated',
  'authenticated',
  email,
  '',
  '{}'::jsonb,
  '{}'::jsonb,
  clock_timestamp(),
  clock_timestamp()
from (values
  ('10000000-0000-4000-8000-000000000001', 'm4e-gm@example.test'),
  ('10000000-0000-4000-8000-000000000002', 'm4e-player-1@example.test'),
  ('10000000-0000-4000-8000-000000000003', 'm4e-player-2@example.test'),
  ('10000000-0000-4000-8000-000000000004', 'm4e-player-3@example.test'),
  ('10000000-0000-4000-8000-000000000005', 'm4e-player-4@example.test'),
  ('10000000-0000-4000-8000-000000000006', 'm4e-player-5@example.test'),
  ('10000000-0000-4000-8000-000000000007', 'm4e-player-6@example.test'),
  ('10000000-0000-4000-8000-000000000008', 'm4e-player-7@example.test'),
  ('10000000-0000-4000-8000-000000000009', 'm4e-outsider@example.test'),
  ('10000000-0000-4000-8000-000000000010', 'm4e-other-gm@example.test'),
  ('10000000-0000-4000-8000-000000000011', 'm4e-other-player@example.test')
) as users(id, email);

-- Schema, constraints, indexes, RLS, grants, and bucket configuration.
select has_column('public', 'campaign_members', 'display_order',
  'campaign_members has persistent display_order');
select col_type_is('public', 'campaign_members', 'display_order', 'smallint',
  'campaign member display_order is smallint');
select is(
  (select is_deferrable from information_schema.table_constraints
   where constraint_schema = 'public'
     and constraint_name = 'campaign_members_campaign_display_order_key'),
  'YES', 'player ordering uniqueness is deferrable');

select has_table('public', 'campaign_player_publication_permissions',
  'publication permission table exists');
select has_table('public', 'campaign_media_groups', 'media group table exists');
select has_table('public', 'campaign_media_group_members',
  'media group membership table exists');
select has_table('public', 'campaign_media_restrictions',
  'directed media restriction table exists');
select has_table('public', 'campaign_images', 'campaign image metadata table exists');
select has_table('public', 'campaign_image_recipients',
  'campaign image recipient table exists');
select has_table('public', 'campaign_video_audit_log',
  'immutable campaign video audit table exists');

select is(
  (select count(*) from pg_catalog.pg_class
   where oid = any(array[
     'public.campaign_player_publication_permissions'::regclass,
     'public.campaign_media_groups'::regclass,
     'public.campaign_media_group_members'::regclass,
     'public.campaign_media_restrictions'::regclass,
     'public.campaign_images'::regclass,
     'public.campaign_image_recipients'::regclass,
     'public.campaign_video_audit_log'::regclass
   ]) and relrowsecurity),
  7::bigint, 'RLS is enabled on all seven new public tables');

select ok(to_regclass('public.campaign_media_group_members_campaign_group_idx') is not null,
  'group membership cascade lookup is indexed');
select ok(to_regclass('public.campaign_media_restrictions_source_group_id_idx') is not null,
  'restriction source group lookup is indexed');
select ok(to_regclass('public.campaign_media_restrictions_target_group_id_idx') is not null,
  'restriction target group lookup is indexed');
select ok(to_regclass('public.campaign_image_recipients_campaign_user_idx') is not null,
  'image recipient RLS lookup is indexed');
select ok(to_regclass('public.campaign_video_audit_log_campaign_created_idx') is not null,
  'campaign audit history lookup is indexed');

select results_eq(
  $$select public, file_size_limit, allowed_mime_types
    from storage.buckets where id = 'campaign-images'$$,
  $$values (false, 5242880::bigint,
    array['image/jpeg','image/png','image/webp']::text[])$$,
  'campaign-images is private with exact size and MIME limits');

select ok(has_table_privilege('authenticated',
  'public.campaign_player_publication_permissions', 'SELECT'),
  'authenticated may read publication permissions through RLS');
select ok(not has_table_privilege('authenticated',
  'public.campaign_video_audit_log', 'INSERT'),
  'authenticated cannot insert audit rows');
select ok(not has_table_privilege('authenticated',
  'public.campaign_video_audit_log', 'UPDATE'),
  'authenticated cannot update audit rows');
select ok(not has_table_privilege('authenticated',
  'public.campaign_video_audit_log', 'DELETE'),
  'authenticated cannot delete audit rows');
select is(
  (select count(*) from information_schema.routine_privileges
   where specific_schema = 'public'
     and routine_name like 'audit_campaign_%'
     and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')),
  0::bigint, 'audit trigger functions have no application execution grants');
select is(
  (select count(*) from pg_catalog.pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname like '%campaign images%'),
  3::bigint, 'campaign image Storage has SELECT, INSERT, and DELETE policies only');

-- Two campaigns and six initial players in the primary campaign.
insert into public.campaigns (
  id, game_master_id, game_system, name
) values
  ('20000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001', 'vtm_v5', 'M4E campaign'),
  ('20000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000010', 'vtm_v5', 'Other campaign');

insert into public.campaign_members (campaign_id, user_id, display_order)
select
  '20000000-0000-4000-8000-000000000001'::uuid,
  user_id::uuid,
  display_order::smallint
from (values
  ('10000000-0000-4000-8000-000000000002', 1),
  ('10000000-0000-4000-8000-000000000003', 2),
  ('10000000-0000-4000-8000-000000000004', 3),
  ('10000000-0000-4000-8000-000000000005', 4),
  ('10000000-0000-4000-8000-000000000006', 5),
  ('10000000-0000-4000-8000-000000000007', 6)
) as members(user_id, display_order);

insert into public.campaign_members (campaign_id, user_id, display_order)
values (
  '20000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000011', 1
);

select throws_ok(
  $$insert into public.campaign_members (campaign_id, user_id, display_order)
    values ('20000000-0000-4000-8000-000000000001',
            '10000000-0000-4000-8000-000000000008', 7)$$,
  '23514', null, 'seventh display position is rejected by the capacity constraint');

-- A seventh invitation is rejected without consuming it.
insert into public.campaign_invitations (
  id, campaign_id, created_by, token_hash, expires_at
) values (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  encode(extensions.digest(convert_to(repeat('f', 64), 'UTF8'), 'sha256'), 'hex'),
  now() + interval '1 day'
);

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000008';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000008","role":"authenticated"}';
select throws_ok(
  $$select public.accept_campaign_invitation(repeat('f', 64))$$,
  'P0001', 'campaign_player_capacity_reached',
  'invitation acceptance rejects a seventh player');
reset role;
select is(
  (select accepted_at from public.campaign_invitations
   where id = '30000000-0000-4000-8000-000000000001'),
  null::timestamptz, 'capacity rejection does not consume the invitation');

-- Lowest-free-slot allocation.
delete from public.campaign_members
where campaign_id = '20000000-0000-4000-8000-000000000001'
  and user_id = '10000000-0000-4000-8000-000000000004';
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000008';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000008","role":"authenticated"}';
select lives_ok(
  $$select public.accept_campaign_invitation(repeat('f', 64))$$,
  'a valid invitation fills the lowest free player slot');
reset role;
select is(
  (select display_order from public.campaign_members
   where campaign_id = '20000000-0000-4000-8000-000000000001'
     and user_id = '10000000-0000-4000-8000-000000000008'),
  3::smallint, 'invitation acceptance reused sparse position three');

-- Player reorder is exact, atomic, and GM-only.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is(
  public.reorder_campaign_players(
    '20000000-0000-4000-8000-000000000001',
    array[
      '10000000-0000-4000-8000-000000000008',
      '10000000-0000-4000-8000-000000000007',
      '10000000-0000-4000-8000-000000000006',
      '10000000-0000-4000-8000-000000000005',
      '10000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000002'
    ]::uuid[]
  ), 6, 'GM reorders the exact six-player set');
select throws_ok(
  $$select public.reorder_campaign_players(
    '20000000-0000-4000-8000-000000000001',
    array['10000000-0000-4000-8000-000000000002',
          '10000000-0000-4000-8000-000000000002']::uuid[])$$,
  'P0001', 'campaign_player_reorder_invalid',
  'duplicate and incomplete reorder arrays fail atomically');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000009';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000009","role":"authenticated"}';
select throws_ok(
  $$select public.reorder_campaign_players(
    '20000000-0000-4000-8000-000000000001', array[]::uuid[])$$,
  'P0001', 'campaign_player_reorder_not_available',
  'outsider cannot reorder campaign players');
reset role;

-- Publication overrides: sparse, GM-managed, self-readable.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$insert into public.campaign_player_publication_permissions (
      campaign_id, user_id, audio_allowed, video_allowed, updated_by
    ) values (
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002', true, false,
      '10000000-0000-4000-8000-000000000001'
    )$$,
  'active GM can prohibit one player video publication');
select throws_ok(
  $$insert into public.campaign_player_publication_permissions (
      campaign_id, user_id, audio_allowed, video_allowed, updated_by
    ) values (
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000003', true, true,
      '10000000-0000-4000-8000-000000000001'
    )$$,
  '23514', null, 'both-allowed state remains represented by row absence');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is((select count(*) from public.campaign_player_publication_permissions),
  1::bigint, 'player reads only their own publication override');
select throws_ok(
  $$insert into public.campaign_player_publication_permissions (
      campaign_id, user_id, audio_allowed, video_allowed, updated_by
    ) values (
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000003', false, true,
      '10000000-0000-4000-8000-000000000002'
    )$$,
  '42501', null, 'player cannot mutate publication permissions');
reset role;

-- Player-only one-group membership and directed restrictions.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
insert into public.campaign_media_groups (
  id, campaign_id, name, display_order
) values
  ('40000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', 'Alpha', 1),
  ('40000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000001', 'Beta', 2);
insert into public.campaign_media_group_members (
  campaign_id, user_id, group_id, assigned_by
) values
  ('20000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000002',
   '40000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000003',
   '40000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000001');
select throws_ok(
  $$insert into public.campaign_media_group_members (
      campaign_id, user_id, group_id, assigned_by
    ) values (
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000001')$$,
  '23505', null, 'a player cannot belong to two groups');
select throws_ok(
  $$insert into public.campaign_media_group_members (
      campaign_id, user_id, group_id, assigned_by
    ) values (
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001')$$,
  '23503', null, 'GM cannot be a player-group member');
select throws_ok(
  $$insert into public.campaign_media_group_members (
      campaign_id, user_id, group_id, assigned_by
    ) values (
      '20000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000011',
      '40000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'cross-campaign group assignment is rejected');
reset role;
select throws_ok(
  $$insert into public.campaign_media_group_members (
      campaign_id, user_id, group_id, assigned_by
    ) values (
      '20000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000011',
      '40000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000010')$$,
  '23503', null, 'same-campaign composite foreign key rejects a foreign group');
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';

insert into public.campaign_media_restrictions (
  id, campaign_id, source_type, source_group_id,
  target_type, target_group_id, media_kind, created_by
) values
  ('50000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', 'gm', null,
   'group', '40000000-0000-4000-8000-000000000001', 'audio',
   '10000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000001', 'group',
   '40000000-0000-4000-8000-000000000001', 'group',
   '40000000-0000-4000-8000-000000000002', 'video',
   '10000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000003',
   '20000000-0000-4000-8000-000000000001', 'group',
   '40000000-0000-4000-8000-000000000002', 'gm', null, 'video',
   '10000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000004',
   '20000000-0000-4000-8000-000000000001', 'group',
   '40000000-0000-4000-8000-000000000002', 'group',
   '40000000-0000-4000-8000-000000000001', 'video',
   '10000000-0000-4000-8000-000000000001');
select throws_ok(
  $$insert into public.campaign_media_restrictions (
      campaign_id, source_type, target_type, media_kind, created_by
    ) values (
      '20000000-0000-4000-8000-000000000001', 'gm', 'gm', 'audio',
      '10000000-0000-4000-8000-000000000001')$$,
  '23514', null, 'GM-to-GM restriction is rejected');
select throws_ok(
  $$insert into public.campaign_media_restrictions (
      campaign_id, source_type, source_group_id, target_type,
      target_group_id, media_kind, created_by
    ) values (
      '20000000-0000-4000-8000-000000000001', 'group',
      '40000000-0000-4000-8000-000000000001', 'group',
      '40000000-0000-4000-8000-000000000001', 'audio',
      '10000000-0000-4000-8000-000000000001')$$,
  '23514', null, 'same-group restriction is rejected');
reset role;
select throws_ok(
  $$insert into public.campaign_media_restrictions (
      campaign_id, source_type, source_group_id,
      target_type, media_kind, created_by
    ) values (
      '20000000-0000-4000-8000-000000000002', 'group',
      '40000000-0000-4000-8000-000000000001', 'gm', 'audio',
      '10000000-0000-4000-8000-000000000010')$$,
  '23503', null, 'same-campaign composite foreign key rejects a foreign rule endpoint');
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is((select count(*) from public.campaign_media_groups), 1::bigint,
  'player sees only their own persistent group');
select is((select count(*) from public.campaign_media_group_members), 1::bigint,
  'player sees only their own group assignment');
select is((select count(*) from public.campaign_media_restrictions), 3::bigint,
  'player sees only directed rules involving their group');
reset role;

-- Campaign image constraints and atomic visibility transitions.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$insert into public.campaign_images (
      id, campaign_id, uploader_id, storage_object_name,
      display_name, mime_type, byte_size, visibility
    ) values (
      '60000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001/60000000-0000-4000-8000-000000000001/70000000-0000-4000-8000-000000000001.webp',
      'Map', 'image/webp', 5242880, 'gm_only'
    )$$,
  'GM creates valid private image metadata at the exact 5 MiB boundary');
select throws_ok(
  $$insert into public.campaign_images (
      id, campaign_id, uploader_id, storage_object_name,
      display_name, mime_type, byte_size
    ) values (
      '60000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001/60000000-0000-4000-8000-000000000002/70000000-0000-4000-8000-000000000002.png',
      'Too large', 'image/png', 5242881
    )$$,
  '23514', null, 'image metadata rejects one byte above 5 MiB');
select throws_ok(
  $$insert into public.campaign_images (
      id, campaign_id, uploader_id, storage_object_name,
      display_name, mime_type, byte_size
    ) values (
      '60000000-0000-4000-8000-000000000003',
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001/60000000-0000-4000-8000-000000000003/70000000-0000-4000-8000-000000000003.gif',
      'GIF', 'image/gif', 100
    )$$,
  '23514', null, 'image metadata rejects unapproved MIME and extension');
select lives_ok(
  $$select public.set_campaign_image_visibility(
      '60000000-0000-4000-8000-000000000001',
      'selected_active_players',
      array['10000000-0000-4000-8000-000000000002']::uuid[]
    )$$,
  'GM atomically selects one active player');
select throws_ok(
  $$select public.set_campaign_image_visibility(
      '60000000-0000-4000-8000-000000000001',
      'selected_active_players', array[]::uuid[]
    )$$,
  'P0001', 'campaign_image_recipients_invalid',
  'selected visibility cannot commit without a recipient');
select lives_ok(
  $$select public.set_campaign_image_visibility(
      '60000000-0000-4000-8000-000000000001',
      'selected_active_players',
      array[
        '10000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000003'
      ]::uuid[]
    )$$,
  'selected recipients expand atomically');
select lives_ok(
  $$select public.set_campaign_image_visibility(
      '60000000-0000-4000-8000-000000000001',
      'selected_active_players',
      array['10000000-0000-4000-8000-000000000003']::uuid[]
    )$$,
  'selected recipients reduce atomically');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is((select count(*) from public.campaign_images), 0::bigint,
  'removed selected recipient immediately loses metadata access');
select is((select count(*) from public.campaign_image_recipients), 0::bigint,
  'player cannot inspect another selected recipient');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is((select count(*) from public.campaign_images), 1::bigint,
  'current selected recipient can read image metadata');
reset role;

-- Exact represented paths only; no UPDATE policy means no rename/upsert.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values (
      'campaign-images',
      '20000000-0000-4000-8000-000000000001/60000000-0000-4000-8000-000000000001/70000000-0000-4000-8000-000000000001.webp',
      '10000000-0000-4000-8000-000000000001'
    )$$,
  'active GM may upload only the represented exact object');
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values (
      'campaign-images',
      '20000000-0000-4000-8000-000000000001/60000000-0000-4000-8000-000000000001/70000000-0000-4000-8000-000000000099.webp',
      '10000000-0000-4000-8000-000000000001'
    )$$,
  '42501', null, 'guessed campaign image object path is denied');
select throws_ok(
  $$delete from public.campaign_images
    where id = '60000000-0000-4000-8000-000000000001'$$,
  'P0001', 'campaign_image_storage_object_must_be_deleted_first',
  'metadata deletion is blocked until Storage-first deletion');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local storage.allow_delete_query = 'true';
select lives_ok(
  $$delete from storage.objects
    where bucket_id = 'campaign-images'
      and name = '20000000-0000-4000-8000-000000000001/60000000-0000-4000-8000-000000000001/70000000-0000-4000-8000-000000000001.webp'$$,
  'Storage API operation marker permits the exact policy-authorized delete');
set local storage.allow_delete_query = 'false';
select lives_ok(
  $$delete from public.campaign_images
    where id = '60000000-0000-4000-8000-000000000001'$$,
  'metadata deletion succeeds only after Storage cleanup');

insert into public.campaign_images (
  id, campaign_id, uploader_id, storage_object_name,
  display_name, mime_type, byte_size, visibility
) values (
  '60000000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001/60000000-0000-4000-8000-000000000004/70000000-0000-4000-8000-000000000004.jpg',
  'Removal cleanup', 'image/jpeg', 1024, 'gm_only'
);
select public.set_campaign_image_visibility(
  '60000000-0000-4000-8000-000000000004',
  'selected_active_players',
  array['10000000-0000-4000-8000-000000000002']::uuid[]
);
delete from public.campaign_members
where campaign_id = '20000000-0000-4000-8000-000000000001'
  and user_id = '10000000-0000-4000-8000-000000000002';
select is(
  (select visibility from public.campaign_images
   where id = '60000000-0000-4000-8000-000000000004'),
  'gm_only', 'sole-recipient removal safely returns the image to GM-only');
select is(
  (select count(*) from public.campaign_image_recipients
   where image_id = '60000000-0000-4000-8000-000000000004'),
  0::bigint, 'member removal cascades selected recipients');
select is(
  (select count(*) from public.campaign_media_group_members
   where user_id = '10000000-0000-4000-8000-000000000002'),
  0::bigint, 'member removal cascades media-group membership');
select is(
  (select count(*) from public.campaign_player_publication_permissions
   where user_id = '10000000-0000-4000-8000-000000000002'),
  0::bigint, 'member removal cascades publication overrides');

select ok((select count(*) from public.campaign_video_audit_log) >= 10,
  'controlled changes produced constrained immutable audit rows');
select throws_ok(
  $$insert into public.campaign_video_audit_log (
      campaign_id, action, subject_type
    ) values (
      '20000000-0000-4000-8000-000000000001',
      'group_created', 'media_group'
    )$$,
  '42501', null, 'GM cannot directly insert audit rows');
reset role;

-- Anonymous and outsiders see no campaign-video state.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000009';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000009","role":"authenticated"}';
select is((select count(*) from public.campaign_media_groups), 0::bigint,
  'unrelated authenticated user sees no campaign media groups');
select is((select count(*) from public.campaign_video_audit_log), 0::bigint,
  'unrelated authenticated user sees no audit rows');
reset role;
set local role anon;
select throws_ok(
  $$select count(*) from public.campaign_images$$,
  '42501', null, 'anonymous role has no campaign image table privilege');
reset role;

-- Completion is read-only: GM keeps history, players lose video/image state.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
update public.campaigns
set status = 'completed'
where id = '20000000-0000-4000-8000-000000000001';
select lives_ok(
  $$delete from public.campaign_members
    where campaign_id = '20000000-0000-4000-8000-000000000001'
      and user_id = '10000000-0000-4000-8000-000000000003'$$,
  'completed membership delete is filtered without changing a row');
select is(
  (select count(*) from public.campaign_members
   where campaign_id = '20000000-0000-4000-8000-000000000001'),
  5::bigint, 'completed membership remains present');
reset role;
select throws_ok(
  $$delete from public.campaign_members
    where campaign_id = '20000000-0000-4000-8000-000000000001'
      and user_id = '10000000-0000-4000-8000-000000000003'$$,
  'P0001', 'completed_campaign_is_read_only',
  'database trigger rejects privileged completed membership removal');
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok(
  $$insert into public.campaign_media_groups (campaign_id, name, display_order)
    values ('20000000-0000-4000-8000-000000000001', 'Late', 3)$$,
  'P0001', 'completed_campaign_is_read_only',
  'completed GM cannot add media groups');
reset role;
select throws_ok(
  $$update public.campaign_members set display_order = 6
    where campaign_id = '20000000-0000-4000-8000-000000000001'
      and user_id = '10000000-0000-4000-8000-000000000003'$$,
  'P0001', 'completed_campaign_is_read_only',
  'database trigger rejects privileged completed ordering changes');
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select ok((select count(*) from public.campaign_media_groups) = 2,
  'completed GM retains read-only group access');
select is((select count(*) from public.campaign_images), 1::bigint,
  'completed GM retains read-only campaign image metadata access');
select ok((select count(*) from public.campaign_video_audit_log) > 0,
  'completed GM retains immutable audit access');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is((select count(*) from public.campaign_media_groups), 0::bigint,
  'completed player loses campaign media-group access');
select is((select count(*) from public.campaign_player_publication_permissions), 0::bigint,
  'completed player loses publication-setting access');
select is((select count(*) from public.campaign_images), 0::bigint,
  'completed player loses campaign image metadata access');
reset role;

-- Campaign final deletion is still GM-authorized and cascades audit history.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$delete from public.campaigns
    where id = '20000000-0000-4000-8000-000000000001'$$,
  'GM may finally delete a completed campaign after Storage cleanup');
reset role;
select is(
  (select count(*) from public.campaign_video_audit_log
   where campaign_id = '20000000-0000-4000-8000-000000000001'),
  0::bigint, 'campaign deletion cascades its audit history');

select * from finish();
rollback;
