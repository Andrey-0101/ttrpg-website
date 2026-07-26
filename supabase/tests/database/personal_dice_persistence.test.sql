begin;

select plan(145);

-- Deterministic Auth owners used throughout the transaction.
insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'personal-dice-owner-a@example.test',
    '',
    '{}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'personal-dice-owner-b@example.test',
    '',
    '{}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  );

-- Schema objects.
select has_table(
  'public',
  'custom_dice_presets',
  'custom_dice_presets exists'
);
select has_table(
  'public',
  'personal_roll_history',
  'personal_roll_history exists'
);
select results_eq(
  $test$
    select column_name::text collate "C"
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'custom_dice_presets'
    order by ordinal_position
  $test$,
  $expected$
    values
      ('id'::text collate "C"),
      ('owner_id'::text),
      ('slot'::text),
      ('name'::text),
      ('coin_quantity'::text),
      ('d4_quantity'::text),
      ('d6_quantity'::text),
      ('d8_quantity'::text),
      ('d10_quantity'::text),
      ('d12_quantity'::text),
      ('d20_quantity'::text),
      ('d100_quantity'::text),
      ('created_at'::text),
      ('updated_at'::text)
  $expected$,
  'custom_dice_presets has the expected columns'
);
select results_eq(
  $test$
    select column_name::text collate "C"
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'personal_roll_history'
    order by ordinal_position
  $test$,
  $expected$
    values
      ('id'::text collate "C"),
      ('owner_id'::text),
      ('client_roll_id'::text),
      ('sequence_number'::text),
      ('roller_kind'::text),
      ('schema_version'::text),
      ('request_data'::text),
      ('result_data'::text),
      ('created_at'::text)
  $expected$,
  'personal_roll_history has the expected columns'
);
select col_type_is(
  'public',
  'custom_dice_presets',
  'owner_id',
  'uuid',
  'preset owner_id is uuid'
);
select col_type_is(
  'public',
  'custom_dice_presets',
  'slot',
  'smallint',
  'preset slot is smallint'
);
select is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'custom_dice_presets'
      and column_name in (
        'coin_quantity',
        'd4_quantity',
        'd6_quantity',
        'd8_quantity',
        'd10_quantity',
        'd12_quantity',
        'd20_quantity',
        'd100_quantity'
      )
      and data_type = 'smallint'
  ),
  8::bigint,
  'all preset quantity columns are smallint'
);
select col_type_is(
  'public',
  'personal_roll_history',
  'sequence_number',
  'bigint',
  'history sequence_number is bigint'
);
select col_type_is(
  'public',
  'personal_roll_history',
  'request_data',
  'jsonb',
  'history request_data is jsonb'
);
select col_type_is(
  'public',
  'personal_roll_history',
  'result_data',
  'jsonb',
  'history result_data is jsonb'
);
select is(
  (
    select constraint_definition.confdeltype
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid =
      'public.custom_dice_presets'::regclass
      and constraint_definition.contype = 'f'
      and constraint_definition.conname =
        'custom_dice_presets_owner_id_fkey'
  ),
  'c'::"char",
  'preset owner foreign key cascades on Auth-user deletion'
);
select is(
  (
    select constraint_definition.confdeltype
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid =
      'public.personal_roll_history'::regclass
      and constraint_definition.contype = 'f'
      and constraint_definition.conname =
        'personal_roll_history_owner_id_fkey'
  ),
  'c'::"char",
  'history owner foreign key cascades on Auth-user deletion'
);
select ok(
  to_regclass('public.custom_dice_presets_owner_slot_key') is not null,
  'preset owner-slot unique index exists'
);
select ok(
  to_regclass('public.custom_dice_presets_owner_lower_name_idx') is not null,
  'preset case-insensitive owner-name unique index exists'
);
select ok(
  to_regclass('public.personal_roll_history_owner_client_roll_key') is not null,
  'history owner-client-roll unique index exists'
);
select ok(
  to_regclass('public.personal_roll_history_owner_sequence_idx') is not null,
  'history owner-sequence index exists'
);
select ok(
  (
    select relation.relrowsecurity
    from pg_catalog.pg_class as relation
    where relation.oid = 'public.custom_dice_presets'::regclass
  ),
  'RLS is enabled on custom_dice_presets'
);
select ok(
  (
    select relation.relrowsecurity
    from pg_catalog.pg_class as relation
    where relation.oid = 'public.personal_roll_history'::regclass
  ),
  'RLS is enabled on personal_roll_history'
);
select is(
  (
    select count(*)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'custom_dice_presets'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and policyname = 'Users can view their own custom dice presets'
  ),
  1::bigint,
  'preset owner-only SELECT policy exists'
);
select is(
  (
    select count(*)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'personal_roll_history'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and policyname = 'Users can view their own personal roll history'
  ),
  1::bigint,
  'history owner-only SELECT policy exists'
);
select ok(
  to_regprocedure(
    'public.create_custom_dice_preset(text,smallint,smallint,smallint,smallint,smallint,smallint,smallint,smallint)'
  ) is not null,
  'create_custom_dice_preset has the expected signature'
);
select ok(
  to_regprocedure(
    'public.update_custom_dice_preset(uuid,text,smallint,smallint,smallint,smallint,smallint,smallint,smallint,smallint)'
  ) is not null,
  'update_custom_dice_preset has the expected signature'
);
select ok(
  to_regprocedure('public.delete_custom_dice_preset(uuid)') is not null,
  'delete_custom_dice_preset has the expected signature'
);
select ok(
  to_regprocedure(
    'public.record_personal_roll(uuid,text,smallint,jsonb,jsonb)'
  ) is not null,
  'record_personal_roll has the expected signature'
);
select ok(
  to_regprocedure('public.delete_personal_roll(uuid)') is not null,
  'delete_personal_roll has the expected signature'
);
select ok(
  to_regprocedure('public.clear_personal_roll_history()') is not null,
  'clear_personal_roll_history has the expected signature'
);
select is(
  (
    select count(*)
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname like 'update_personal_roll%'
  ),
  0::bigint,
  'no personal-history UPDATE RPC exists'
);

-- Table and function privileges.
select ok(
  not has_table_privilege(
    'anon',
    'public.custom_dice_presets',
    'SELECT'
  ),
  'anon cannot SELECT presets'
);
select ok(
  not has_table_privilege(
    'anon',
    'public.personal_roll_history',
    'SELECT'
  ),
  'anon cannot SELECT personal history'
);
select ok(
  has_table_privilege(
    'authenticated',
    'public.custom_dice_presets',
    'SELECT'
  ),
  'authenticated can SELECT presets'
);
select ok(
  has_table_privilege(
    'authenticated',
    'public.personal_roll_history',
    'SELECT'
  ),
  'authenticated can SELECT personal history'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.custom_dice_presets',
    'INSERT'
  ),
  'authenticated cannot directly INSERT presets'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.custom_dice_presets',
    'UPDATE'
  ),
  'authenticated cannot directly UPDATE presets'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.custom_dice_presets',
    'DELETE'
  ),
  'authenticated cannot directly DELETE presets'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.personal_roll_history',
    'INSERT'
  ),
  'authenticated cannot directly INSERT history'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.personal_roll_history',
    'UPDATE'
  ),
  'authenticated cannot directly UPDATE history'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.personal_roll_history',
    'DELETE'
  ),
  'authenticated cannot directly DELETE history'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.create_custom_dice_preset(text,smallint,smallint,smallint,smallint,smallint,smallint,smallint,smallint)',
    'EXECUTE'
  ),
  'authenticated can execute create_custom_dice_preset'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.update_custom_dice_preset(uuid,text,smallint,smallint,smallint,smallint,smallint,smallint,smallint,smallint)',
    'EXECUTE'
  ),
  'authenticated can execute update_custom_dice_preset'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.delete_custom_dice_preset(uuid)',
    'EXECUTE'
  ),
  'authenticated can execute delete_custom_dice_preset'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.record_personal_roll(uuid,text,smallint,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated can execute record_personal_roll'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.delete_personal_roll(uuid)',
    'EXECUTE'
  ),
  'authenticated can execute delete_personal_roll'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.clear_personal_roll_history()',
    'EXECUTE'
  ),
  'authenticated can execute clear_personal_roll_history'
);
select is(
  (
    select count(*)
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname in (
        'create_custom_dice_preset',
        'update_custom_dice_preset',
        'delete_custom_dice_preset',
        'record_personal_roll',
        'delete_personal_roll',
        'clear_personal_roll_history'
      )
      and pg_catalog.has_function_privilege(
        'authenticated',
        procedure.oid,
        'EXECUTE'
      )
  ),
  6::bigint,
  'authenticated can execute exactly the six intended personal dice RPCs'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.create_custom_dice_preset(text,smallint,smallint,smallint,smallint,smallint,smallint,smallint,smallint)',
    'EXECUTE'
  ),
  'anon cannot execute create_custom_dice_preset'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.update_custom_dice_preset(uuid,text,smallint,smallint,smallint,smallint,smallint,smallint,smallint,smallint)',
    'EXECUTE'
  ),
  'anon cannot execute update_custom_dice_preset'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.delete_custom_dice_preset(uuid)',
    'EXECUTE'
  ),
  'anon cannot execute delete_custom_dice_preset'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.record_personal_roll(uuid,text,smallint,jsonb,jsonb)',
    'EXECUTE'
  ),
  'anon cannot execute record_personal_roll'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.delete_personal_roll(uuid)',
    'EXECUTE'
  ),
  'anon cannot execute delete_personal_roll'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.clear_personal_roll_history()',
    'EXECUTE'
  ),
  'anon cannot execute clear_personal_roll_history'
);
select is(
  (
    select count(*)
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        procedure.proacl,
        pg_catalog.acldefault('f', procedure.proowner)
      )
    ) as privilege
    where namespace.nspname = 'public'
      and procedure.proname in (
        'create_custom_dice_preset',
        'update_custom_dice_preset',
        'delete_custom_dice_preset',
        'record_personal_roll',
        'delete_personal_roll',
        'clear_personal_roll_history'
      )
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  0::bigint,
  'PUBLIC retains no personal dice RPC execution privilege'
);
select ok(
  not has_sequence_privilege(
    'authenticated',
    'public.personal_roll_history_sequence_number_seq',
    'USAGE,SELECT,UPDATE'
  ),
  'authenticated has no direct identity-sequence privileges'
);
select ok(
  not has_sequence_privilege(
    'anon',
    'public.personal_roll_history_sequence_number_seq',
    'USAGE,SELECT,UPDATE'
  ),
  'anon has no direct identity-sequence privileges'
);

set local role anon;
select throws_ok(
  $test$select * from public.custom_dice_presets$test$,
  '42501',
  null,
  'anon preset SELECT is denied behaviorally'
);
select throws_ok(
  $test$select * from public.personal_roll_history$test$,
  '42501',
  null,
  'anon history SELECT is denied behaviorally'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

select throws_ok(
  $test$
    insert into public.custom_dice_presets (
      owner_id,
      slot,
      name,
      coin_quantity
    )
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      1,
      'Direct preset',
      1
    )
  $test$,
  '42501',
  null,
  'authenticated direct preset INSERT is denied'
);
select throws_ok(
  $test$
    update public.custom_dice_presets
    set name = 'Direct update'
    where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $test$,
  '42501',
  null,
  'authenticated direct preset UPDATE is denied'
);
select throws_ok(
  $test$
    delete from public.custom_dice_presets
    where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $test$,
  '42501',
  null,
  'authenticated direct preset DELETE is denied'
);
select throws_ok(
  $test$
    insert into public.personal_roll_history (
      owner_id,
      client_roll_id,
      roller_kind,
      schema_version,
      request_data,
      result_data
    )
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '10000000-0000-4000-8000-000000000099',
      'vtm_v5',
      1,
      '{}'::jsonb,
      '{}'::jsonb
    )
  $test$,
  '42501',
  null,
  'authenticated direct history INSERT is denied'
);
select throws_ok(
  $test$
    update public.personal_roll_history
    set result_data = '{"changed":true}'::jsonb
    where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $test$,
  '42501',
  null,
  'authenticated direct history UPDATE is denied'
);
select throws_ok(
  $test$
    delete from public.personal_roll_history
    where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $test$,
  '42501',
  null,
  'authenticated direct history DELETE is denied'
);

-- Preset creation and canonical name handling.
select lives_ok(
  $test$
    select public.create_custom_dice_preset(
      '  Combat    Pool  ',
      1::smallint,
      2::smallint,
      3::smallint,
      4::smallint,
      5::smallint,
      6::smallint,
      7::smallint,
      8::smallint
    )
  $test$,
  'owner A can create a valid preset'
);
select is(
  (
    select owner_id
    from public.custom_dice_presets
    where name = 'Combat Pool'
  ),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'preset owner is derived from auth.uid()'
);
select is(
  (
    select name
    from public.custom_dice_presets
    where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  'Combat Pool'::text,
  'preset name is trimmed and internal whitespace is collapsed'
);
select is(
  (
    select slot
    from public.custom_dice_presets
    where name = 'Combat Pool'
  ),
  1::smallint,
  'first preset receives slot 1'
);
select results_eq(
  $test$
    select
      coin_quantity,
      d4_quantity,
      d6_quantity,
      d8_quantity,
      d10_quantity,
      d12_quantity,
      d20_quantity,
      d100_quantity
    from public.custom_dice_presets
    where name = 'Combat Pool'
  $test$,
  $expected$
    values (
      1::smallint,
      2::smallint,
      3::smallint,
      4::smallint,
      5::smallint,
      6::smallint,
      7::smallint,
      8::smallint
    )
  $expected$,
  'preset quantities are stored exactly'
);
select is(
  (
    select count(*)
    from public.custom_dice_presets
    where name = 'Combat Pool'
  ),
  1::bigint,
  'owner A can SELECT the created preset'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub =
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select is(
  (select count(*) from public.custom_dice_presets),
  0::bigint,
  'owner B cannot see owner A presets'
);

reset role;
select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname in (
        'create_custom_dice_preset',
        'update_custom_dice_preset',
        'delete_custom_dice_preset'
      )
      and 'owner_id' = any(coalesce(procedure.proargnames, array[]::text[]))
  ),
  'preset RPCs expose no owner_id argument'
);

set local role authenticated;
set local request.jwt.claim.sub =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

-- Preset validation.
select throws_ok(
  $test$
    select public.create_custom_dice_preset(
      '     ',
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '22023',
  'preset_name_invalid',
  'whitespace-only preset name is rejected'
);
select throws_ok(
  $test$
    select public.create_custom_dice_preset(
      repeat('x', 81),
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '22023',
  'preset_name_invalid',
  'preset name longer than 80 normalized characters is rejected'
);
select throws_ok(
  $test$
    select public.create_custom_dice_preset(
      'Negative quantity',
      -1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '23514',
  null,
  'negative preset quantity is rejected'
);
select throws_ok(
  $test$
    select public.create_custom_dice_preset(
      'Quantity above limit',
      101::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '23514',
  null,
  'preset quantity above 100 is rejected'
);
select throws_ok(
  $test$
    select public.create_custom_dice_preset(
      'Empty pool',
      0::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '23514',
  null,
  'empty preset pool is rejected'
);
select throws_ok(
  $test$
    select public.create_custom_dice_preset(
      'Total above limit',
      100::smallint, 1::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '23514',
  null,
  'preset total above 100 is rejected'
);
select throws_ok(
  $test$
    select public.create_custom_dice_preset(
      'combat pool',
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '23505',
  'preset_name_conflict',
  'case-insensitive duplicate preset name is rejected'
);
select throws_ok(
  $test$
    select public.create_custom_dice_preset(
      'Combat       Pool',
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '23505',
  'preset_name_conflict',
  'duplicate name differing only by whitespace is rejected'
);

-- Five-preset limit and slot reuse.
select lives_ok(
  $test$
    do $block$
    begin
      perform public.create_custom_dice_preset(
        'Preset 2', 0::smallint, 1::smallint, 0::smallint, 0::smallint,
        0::smallint, 0::smallint, 0::smallint, 0::smallint
      );
      perform public.create_custom_dice_preset(
        'Preset 3', 0::smallint, 0::smallint, 1::smallint, 0::smallint,
        0::smallint, 0::smallint, 0::smallint, 0::smallint
      );
      perform public.create_custom_dice_preset(
        'Preset 4', 0::smallint, 0::smallint, 0::smallint, 1::smallint,
        0::smallint, 0::smallint, 0::smallint, 0::smallint
      );
      perform public.create_custom_dice_preset(
        'Preset 5', 0::smallint, 0::smallint, 0::smallint, 0::smallint,
        1::smallint, 0::smallint, 0::smallint, 0::smallint
      );
    end;
    $block$
  $test$,
  'owner A can create presets through the fifth slot'
);
select results_eq(
  $test$
    select slot
    from public.custom_dice_presets
    order by slot
  $test$,
  $expected$
    values
      (1::smallint),
      (2::smallint),
      (3::smallint),
      (4::smallint),
      (5::smallint)
  $expected$,
  'five presets receive slots 1 through 5'
);
select throws_ok(
  $test$
    select public.create_custom_dice_preset(
      'Preset 6', 0::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 1::smallint, 0::smallint, 0::smallint
    )
  $test$,
  'P0001',
  'preset_limit_reached',
  'sixth preset is rejected with preset_limit_reached'
);
select is(
  (
    select public.delete_custom_dice_preset(id)
    from public.custom_dice_presets
    where name = 'Preset 3'
  ),
  true,
  'owner can delete an owned preset'
);
select is(
  (
    select (
      public.create_custom_dice_preset(
        'Replacement preset',
        0::smallint, 0::smallint, 1::smallint, 0::smallint,
        0::smallint, 0::smallint, 0::smallint, 0::smallint
      )
    ).slot
  ),
  3::smallint,
  'next preset reuses the lowest available slot'
);
select is(
  (select count(*) from public.custom_dice_presets),
  5::bigint,
  'owner still has exactly five presets'
);

reset role;
create temporary table preset_update_snapshot
on commit drop
as
select id, slot, created_at, updated_at
from public.custom_dice_presets
where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and name = 'Combat Pool';

grant select on preset_update_snapshot to authenticated;

set local role authenticated;
set local request.jwt.claim.sub =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

-- Preset update and ownership safety.
select lives_ok(
  $test$
    select public.update_custom_dice_preset(
      (
        select id
        from preset_update_snapshot
      ),
      '  Updated    Pool  ',
      1::smallint, 2::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  'owner A can update an owned preset'
);
select results_eq(
  $test$
    select
      name,
      coin_quantity,
      d4_quantity,
      d6_quantity,
      d8_quantity,
      d10_quantity,
      d12_quantity,
      d20_quantity,
      d100_quantity
    from public.custom_dice_presets
    where id = (select id from preset_update_snapshot)
  $test$,
  $expected$
    values (
      'Updated Pool'::text,
      1::smallint,
      2::smallint,
      0::smallint,
      0::smallint,
      0::smallint,
      0::smallint,
      0::smallint,
      0::smallint
    )
  $expected$,
  'update replaces the canonical name and complete quantity configuration'
);
select is(
  (
    select preset.slot
    from public.custom_dice_presets as preset
    where preset.id = (select id from preset_update_snapshot)
  ),
  (
    select snapshot.slot
    from preset_update_snapshot as snapshot
  ),
  'preset update preserves slot'
);
select is(
  (
    select preset.created_at
    from public.custom_dice_presets as preset
    where preset.id = (select id from preset_update_snapshot)
  ),
  (
    select snapshot.created_at
    from preset_update_snapshot as snapshot
  ),
  'preset update preserves created_at'
);
select ok(
  (
    select preset.updated_at >= snapshot.updated_at
    from public.custom_dice_presets as preset
    join preset_update_snapshot as snapshot using (id)
  ),
  'preset updated_at is not earlier after update'
);
select throws_ok(
  $test$
    select public.update_custom_dice_preset(
      (select id from preset_update_snapshot),
      'Preset 2',
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '23505',
  'preset_name_conflict',
  'duplicate normalized rename is rejected'
);
select throws_ok(
  $test$
    select public.update_custom_dice_preset(
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'Preset 2',
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  'P0002',
  'preset_not_found',
  'unknown preset with conflicting caller-owned name returns preset_not_found'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub =
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select lives_ok(
  $test$
    select public.create_custom_dice_preset(
      'B Conflict',
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  'owner B can create an independent preset'
);
select throws_ok(
  $test$
    select public.update_custom_dice_preset(
      (select id from preset_update_snapshot),
      'B Conflict',
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  'P0002',
  'preset_not_found',
  'other-owner ID with caller name conflict returns preset_not_found first'
);
select throws_ok(
  $test$
    select public.update_custom_dice_preset(
      (select id from preset_update_snapshot),
      'Unique B Name',
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  'P0002',
  'preset_not_found',
  'owner B cannot update owner A preset'
);
select is(
  public.delete_custom_dice_preset(
    (select id from preset_update_snapshot)
  ),
  false,
  'deleting another owner preset returns false'
);

reset role;
select is(
  (
    select name
    from public.custom_dice_presets
    where id = (select id from preset_update_snapshot)
  ),
  'Updated Pool'::text,
  'owner A preset remains unchanged after owner B attempts'
);

set local role authenticated;
set local request.jwt.claim.sub =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

-- Personal history recording.
select lives_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000001',
      'vtm_v5',
      1::smallint,
      '{"pool":1,"hungerDice":0}'::jsonb,
      '{"totalSuccesses":1}'::jsonb
    )
  $test$,
  'owner A can record a VtM history row'
);
select lives_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000002',
      'custom_dice_pool',
      1::smallint,
      '{"quantities":{"d6":1}}'::jsonb,
      '{"diceResults":{"d6":[4]}}'::jsonb
    )
  $test$,
  'owner A can record a Custom Dice Pool history row'
);
select is(
  (
    select count(*)
    from public.personal_roll_history
    where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  2::bigint,
  'history owner is derived from auth.uid()'
);
select results_eq(
  $test$
    select roller_kind
    from public.personal_roll_history
    order by sequence_number desc
  $test$,
  $expected$
    values
      ('custom_dice_pool'::text),
      ('vtm_v5'::text)
  $expected$,
  'VtM and Custom rolls share one newest-first timeline'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub =
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';

select is(
  (select count(*) from public.personal_roll_history),
  0::bigint,
  'owner B cannot SELECT owner A history'
);
select lives_ok(
  $test$
    select public.record_personal_roll(
      '20000000-0000-4000-8000-000000000001',
      'vtm_v5',
      1::smallint,
      '{"pool":2}'::jsonb,
      '{"totalSuccesses":0}'::jsonb
    )
  $test$,
  'owner B can record independent personal history'
);
select is(
  (select count(*) from public.personal_roll_history),
  1::bigint,
  'owner B can see only owner B history'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

-- Structural history validation.
select throws_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000101',
      'unsupported',
      1::smallint,
      '{}'::jsonb,
      '{}'::jsonb
    )
  $test$,
  '23514',
  null,
  'unsupported roller kind is rejected'
);
select throws_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000102',
      'vtm_v5',
      2::smallint,
      '{}'::jsonb,
      '{}'::jsonb
    )
  $test$,
  '23514',
  null,
  'schema version other than 1 is rejected'
);
select throws_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000103',
      'vtm_v5',
      1::smallint,
      '[]'::jsonb,
      '{}'::jsonb
    )
  $test$,
  '23514',
  null,
  'non-object request_data is rejected'
);
select throws_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000104',
      'vtm_v5',
      1::smallint,
      '{}'::jsonb,
      '[]'::jsonb
    )
  $test$,
  '23514',
  null,
  'non-object result_data is rejected'
);
select throws_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000105',
      'vtm_v5',
      1::smallint,
      jsonb_build_object('payload', repeat('x', 16385)),
      '{}'::jsonb
    )
  $test$,
  '23514',
  null,
  'request_data above 16 KiB is rejected'
);
select throws_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000106',
      'vtm_v5',
      1::smallint,
      '{}'::jsonb,
      jsonb_build_object('payload', repeat('x', 65537))
    )
  $test$,
  '23514',
  null,
  'result_data above 64 KiB is rejected'
);

-- Idempotency.
select is(
  (
    select (
      public.record_personal_roll(
        '10000000-0000-4000-8000-000000000001',
        'vtm_v5',
        1::smallint,
        '{"pool":1,"hungerDice":0}'::jsonb,
        '{"totalSuccesses":1}'::jsonb
      )
    ).id
  ),
  (
    select id
    from public.personal_roll_history
    where client_roll_id =
      '10000000-0000-4000-8000-000000000001'
  ),
  'identical retry returns the existing history row'
);
select is(
  (
    select count(*)
    from public.personal_roll_history
    where client_roll_id =
      '10000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'identical retry inserts no second row'
);
select is(
  (
    select (
      public.record_personal_roll(
        '10000000-0000-4000-8000-000000000001',
        'vtm_v5',
        1::smallint,
        '{"pool":1,"hungerDice":0}'::jsonb,
        '{"totalSuccesses":1}'::jsonb
      )
    ).sequence_number
  ),
  (
    select sequence_number
    from public.personal_roll_history
    where client_roll_id =
      '10000000-0000-4000-8000-000000000001'
  ),
  'identical retry preserves sequence_number'
);
select is(
  (
    select (
      public.record_personal_roll(
        '10000000-0000-4000-8000-000000000001',
        'vtm_v5',
        1::smallint,
        '{"hungerDice":0,"pool":1}'::jsonb,
        '{"totalSuccesses":1}'::jsonb
      )
    ).id
  ),
  (
    select id
    from public.personal_roll_history
    where client_roll_id =
      '10000000-0000-4000-8000-000000000001'
  ),
  'semantically equal jsonb with different key order is idempotent'
);
select throws_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000001',
      'custom_dice_pool',
      1::smallint,
      '{"pool":1,"hungerDice":0}'::jsonb,
      '{"totalSuccesses":1}'::jsonb
    )
  $test$,
  '23505',
  'personal_roll_idempotency_conflict',
  'changed roller kind causes idempotency conflict'
);
select throws_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000001',
      'vtm_v5',
      2::smallint,
      '{"pool":1,"hungerDice":0}'::jsonb,
      '{"totalSuccesses":1}'::jsonb
    )
  $test$,
  '23505',
  'personal_roll_idempotency_conflict',
  'changed schema version causes idempotency conflict'
);
select throws_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000001',
      'vtm_v5',
      1::smallint,
      '{"pool":2,"hungerDice":0}'::jsonb,
      '{"totalSuccesses":1}'::jsonb
    )
  $test$,
  '23505',
  'personal_roll_idempotency_conflict',
  'changed request causes idempotency conflict'
);
select throws_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000001',
      'vtm_v5',
      1::smallint,
      '{"pool":1,"hungerDice":0}'::jsonb,
      '{"totalSuccesses":2}'::jsonb
    )
  $test$,
  '23505',
  'personal_roll_idempotency_conflict',
  'changed result causes idempotency conflict'
);

-- Combined eleven-entry retention. This is intentionally single-session;
-- concurrent lock behavior belongs to a separate integration test.
select lives_ok(
  $test$
    do $block$
    declare
      roll_index integer;
      roll_id uuid;
      roll_kind text;
    begin
      for roll_index in 10..19 loop
        roll_id := (
          '10000000-0000-4000-8000-'
          || pg_catalog.lpad(roll_index::text, 12, '0')
        )::uuid;
        roll_kind := case
          when roll_index % 2 = 0 then 'vtm_v5'
          else 'custom_dice_pool'
        end;

        perform public.record_personal_roll(
          roll_id,
          roll_kind,
          1::smallint,
          pg_catalog.jsonb_build_object('index', roll_index),
          pg_catalog.jsonb_build_object('shown', roll_index)
        );
      end loop;
    end;
    $block$
  $test$,
  'mixed VtM and Custom rolls can be recorded through the twelfth distinct roll'
);
select is(
  (select count(*) from public.personal_roll_history),
  11::bigint,
  'owner A retains exactly 11 combined history rows'
);
select is(
  (
    select count(*)
    from public.personal_roll_history
    where client_roll_id =
      '10000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'oldest owner A history row is pruned'
);
select results_eq(
  $test$
    select client_roll_id
    from public.personal_roll_history
    order by client_roll_id
  $test$,
  $expected$
    values
      ('10000000-0000-4000-8000-000000000002'::uuid),
      ('10000000-0000-4000-8000-000000000010'::uuid),
      ('10000000-0000-4000-8000-000000000011'::uuid),
      ('10000000-0000-4000-8000-000000000012'::uuid),
      ('10000000-0000-4000-8000-000000000013'::uuid),
      ('10000000-0000-4000-8000-000000000014'::uuid),
      ('10000000-0000-4000-8000-000000000015'::uuid),
      ('10000000-0000-4000-8000-000000000016'::uuid),
      ('10000000-0000-4000-8000-000000000017'::uuid),
      ('10000000-0000-4000-8000-000000000018'::uuid),
      ('10000000-0000-4000-8000-000000000019'::uuid)
  $expected$,
  'the newest 11 owner A client roll IDs remain'
);
select is(
  (
    select count(distinct roller_kind)
    from public.personal_roll_history
  ),
  2::bigint,
  'retained history combines both roller kinds'
);

reset role;
select is(
  (
    select count(*)
    from public.personal_roll_history
    where owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  1::bigint,
  'owner A retention does not prune owner B history'
);

set local role authenticated;
set local request.jwt.claim.sub =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';

-- History deletion and immutability.
select is(
  (
    select public.delete_personal_roll(id)
    from public.personal_roll_history
    where client_roll_id =
      '10000000-0000-4000-8000-000000000002'
  ),
  true,
  'owner A can delete an owned history row'
);
select is(
  (
    select count(*)
    from public.personal_roll_history
    where client_roll_id =
      '10000000-0000-4000-8000-000000000002'
  ),
  0::bigint,
  'deleted owner A history row is absent'
);
select is(
  public.delete_personal_roll(
    'ffffffff-ffff-4fff-8fff-ffffffffffff'
  ),
  false,
  'deleting unknown history returns false'
);

reset role;
select is(
  (
    select public.delete_personal_roll(id)
    from public.personal_roll_history
    where owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  false,
  'owner A claims cannot indirectly delete owner B history'
);

set local role authenticated;
set local request.jwt.claim.sub =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
select is(
  public.delete_personal_roll(
    (
      select id
      from public.personal_roll_history
      where owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    )
  ),
  false,
  'deleting another owner history row returns false'
);
select is(
  public.clear_personal_roll_history(),
  10::bigint,
  'clear history returns the number of owner A rows deleted'
);
select is(
  (select count(*) from public.personal_roll_history),
  0::bigint,
  'clear history removes all owner A rows'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub =
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
select is(
  (select count(*) from public.personal_roll_history),
  1::bigint,
  'clear history leaves owner B history intact'
);

-- Missing-authentication failures reach the RPC body as postgres, while anon
-- remains blocked by EXECUTE privileges.
reset role;
reset request.jwt.claim.sub;
reset request.jwt.claim.role;
reset request.jwt.claims;

select throws_ok(
  $test$
    select public.create_custom_dice_preset(
      'Unauthenticated',
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '42501',
  'authentication_required',
  'preset creation rejects missing authentication'
);
select throws_ok(
  $test$
    select public.update_custom_dice_preset(
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'Unauthenticated',
      1::smallint, 0::smallint, 0::smallint, 0::smallint,
      0::smallint, 0::smallint, 0::smallint, 0::smallint
    )
  $test$,
  '42501',
  'authentication_required',
  'preset update rejects missing authentication'
);
select throws_ok(
  $test$
    select public.delete_custom_dice_preset(
      'ffffffff-ffff-4fff-8fff-ffffffffffff'
    )
  $test$,
  '42501',
  'authentication_required',
  'preset deletion rejects missing authentication'
);
select throws_ok(
  $test$
    select public.record_personal_roll(
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'vtm_v5',
      1::smallint,
      '{}'::jsonb,
      '{}'::jsonb
    )
  $test$,
  '42501',
  'authentication_required',
  'history recording rejects missing authentication'
);
select throws_ok(
  $test$
    select public.delete_personal_roll(
      'ffffffff-ffff-4fff-8fff-ffffffffffff'
    )
  $test$,
  '42501',
  'authentication_required',
  'history deletion rejects missing authentication'
);
select throws_ok(
  $test$select public.clear_personal_roll_history()$test$,
  '42501',
  'authentication_required',
  'history clearing rejects missing authentication'
);

-- Recreate one owner A history row so both tables exercise Auth-user cascade.
set local role authenticated;
set local request.jwt.claim.sub =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
select lives_ok(
  $test$
    select public.record_personal_roll(
      '10000000-0000-4000-8000-000000000255',
      'vtm_v5',
      1::smallint,
      '{}'::jsonb,
      '{}'::jsonb
    )
  $test$,
  'owner A history is prepared for cascade verification'
);

reset role;
select ok(
  exists (
    select 1
    from public.custom_dice_presets
    where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  'owner A presets exist before Auth-user deletion'
);
select is(
  (
    select count(*)
    from public.personal_roll_history
    where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  1::bigint,
  'owner A history exists before Auth-user deletion'
);
select ok(
  exists (
    select 1
    from public.custom_dice_presets
    where owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  'owner B preset exists before owner A deletion'
);
select is(
  (
    select count(*)
    from public.personal_roll_history
    where owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  1::bigint,
  'owner B history exists before owner A deletion'
);

delete from auth.users
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (
    select count(*)
    from public.custom_dice_presets
    where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  0::bigint,
  'Auth-user deletion cascades owner A presets'
);
select is(
  (
    select count(*)
    from public.personal_roll_history
    where owner_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  0::bigint,
  'Auth-user deletion cascades owner A history'
);
select ok(
  exists (
    select 1
    from public.custom_dice_presets
    where owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  'owner B preset remains after owner A deletion'
);
select is(
  (
    select count(*)
    from public.personal_roll_history
    where owner_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  1::bigint,
  'owner B history remains after owner A deletion'
);

select * from finish();
rollback;
