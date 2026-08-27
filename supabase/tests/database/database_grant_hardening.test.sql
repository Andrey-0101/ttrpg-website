begin;

select no_plan();

-- handle_new_user is callable only through its existing Auth trigger.
select is(
  (
    select count(*)
    from pg_catalog.pg_proc as function
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        function.proacl,
        pg_catalog.acldefault('f', function.proowner)
      )
    ) as acl
    where function.oid = 'public.handle_new_user()'::regprocedure
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ),
  0::bigint,
  'PUBLIC has no EXECUTE ACL for handle_new_user'
);
select ok(
  not has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE'),
  'anon cannot execute handle_new_user'
);
select ok(
  not has_function_privilege(
    'authenticated', 'public.handle_new_user()', 'EXECUTE'
  ),
  'authenticated cannot execute handle_new_user'
);
select ok(
  not has_function_privilege(
    'service_role', 'public.handle_new_user()', 'EXECUTE'
  ),
  'service_role cannot execute handle_new_user directly'
);

set local role anon;
select throws_ok(
  $$select public.handle_new_user()$$,
  '42501',
  null,
  'anon direct invocation is rejected'
);
reset role;

set local role authenticated;
select throws_ok(
  $$select public.handle_new_user()$$,
  '42501',
  null,
  'authenticated direct invocation is rejected'
);
reset role;

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
) values (
  '91000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'grant-hardening-profile@example.test',
  '',
  '{}'::jsonb,
  '{}'::jsonb,
  clock_timestamp(),
  clock_timestamp()
);

select is(
  (
    select count(*)
    from public.profiles
    where id = '91000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'Auth user creation still invokes the profile trigger exactly once'
);

update auth.users
set updated_at = clock_timestamp()
where id = '91000000-0000-4000-8000-000000000001';

select is(
  (
    select count(*)
    from public.profiles
    where id = '91000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'non-insert Auth paths do not duplicate the profile'
);

select throws_ok(
  $$insert into auth.users (
      id, aud, role, email, encrypted_password,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '91000000-0000-4000-8000-000000000001',
      'authenticated', 'authenticated',
      'grant-hardening-duplicate@example.test', '',
      '{}'::jsonb, '{}'::jsonb, clock_timestamp(), clock_timestamp()
    )$$,
  '23505',
  null,
  'duplicate Auth user creation fails without a second profile'
);

select is(
  (
    select count(*)
    from public.profiles
    where id = '91000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'failed duplicate Auth path leaves one consistent profile'
);

-- Each new index must have the exact FK column sequence as its leading keys.
select is(
  (
    select string_agg(attribute.attname::text, ',' order by key.ordinality)
    from pg_catalog.pg_index as index
    cross join lateral unnest(index.indkey::smallint[])
      with ordinality as key(attnum, ordinality)
    join pg_catalog.pg_attribute as attribute
      on attribute.attrelid = index.indrelid
     and attribute.attnum = key.attnum
    where index.indexrelid =
      'public.campaign_characters_linked_by_idx'::regclass
      and key.ordinality <= index.indnkeyatts
  ),
  'linked_by',
  'campaign character linker FK index has the exact key order'
);

select is(
  (
    select string_agg(attribute.attname::text, ',' order by key.ordinality)
    from pg_catalog.pg_index as index
    cross join lateral unnest(index.indkey::smallint[])
      with ordinality as key(attnum, ordinality)
    join pg_catalog.pg_attribute as attribute
      on attribute.attrelid = index.indrelid
     and attribute.attnum = key.attnum
    where index.indexrelid =
      'public.campaign_images_campaign_id_uploader_id_idx'::regclass
      and key.ordinality <= index.indnkeyatts
  ),
  'campaign_id,uploader_id',
  'campaign image uploader FK index has the exact key order'
);

select is(
  (
    select string_agg(attribute.attname::text, ',' order by key.ordinality)
    from pg_catalog.pg_index as index
    cross join lateral unnest(index.indkey::smallint[])
      with ordinality as key(attnum, ordinality)
    join pg_catalog.pg_attribute as attribute
      on attribute.attrelid = index.indrelid
     and attribute.attnum = key.attnum
    where index.indexrelid =
      'public.campaign_invitations_accepted_by_idx'::regclass
      and key.ordinality <= index.indnkeyatts
  ),
  'accepted_by',
  'accepted invitation user FK index has the exact key order'
);

select is(
  (
    select string_agg(attribute.attname::text, ',' order by key.ordinality)
    from pg_catalog.pg_index as index
    cross join lateral unnest(index.indkey::smallint[])
      with ordinality as key(attnum, ordinality)
    join pg_catalog.pg_attribute as attribute
      on attribute.attrelid = index.indrelid
     and attribute.attnum = key.attnum
    where index.indexrelid =
      'public.campaign_invitations_created_by_idx'::regclass
      and key.ordinality <= index.indnkeyatts
  ),
  'created_by',
  'invitation creator FK index has the exact key order'
);

select is(
  (
    select string_agg(attribute.attname::text, ',' order by key.ordinality)
    from pg_catalog.pg_index as index
    cross join lateral unnest(index.indkey::smallint[])
      with ordinality as key(attnum, ordinality)
    join pg_catalog.pg_attribute as attribute
      on attribute.attrelid = index.indrelid
     and attribute.attnum = key.attnum
    where index.indexrelid = 'public.characters_owner_id_idx'::regclass
      and key.ordinality <= index.indnkeyatts
  ),
  'owner_id',
  'character owner FK index has the exact key order'
);

select is(
  (
    select count(*)
    from (
      select
        index.indrelid,
        index.indkey,
        index.indclass,
        index.indcollation,
        index.indoption,
        index.indexprs,
        index.indpred,
        index.indisunique,
        count(*)
      from pg_catalog.pg_index as index
      where index.indrelid = any(array[
        'public.campaign_characters'::regclass,
        'public.campaign_images'::regclass,
        'public.campaign_invitations'::regclass,
        'public.characters'::regclass
      ])
        and index.indisvalid
        and index.indisready
      group by
        index.indrelid,
        index.indkey,
        index.indclass,
        index.indcollation,
        index.indoption,
        index.indexprs,
        index.indpred,
        index.indisunique
      having count(*) > 1
    ) as duplicate_indexes
  ),
  0::bigint,
  'no structurally duplicate index was introduced'
);

delete from auth.users
where id = '91000000-0000-4000-8000-000000000001';

select is(
  (
    select count(*)
    from public.profiles
    where id = '91000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'test Auth user and profile clean up together'
);

select * from finish();
rollback;
