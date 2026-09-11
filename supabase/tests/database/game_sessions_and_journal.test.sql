begin;

select no_plan();

select has_table('public', 'game_sessions', 'game sessions table exists');
select has_table('public', 'game_session_journal_events', 'session Journal table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.game_sessions'::regclass),
  'game sessions use RLS'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.game_session_journal_events'::regclass),
  'Journal events use RLS'
);
select ok(
  to_regclass('public.game_sessions_one_active_per_campaign_idx') is not null,
  'database has one-active-session index'
);
select is(
  (select count(*) from cron.job where jobname = 'expire-stale-game-sessions'),
  1::bigint,
  'autonomous timeout cron is scheduled once'
);
select ok(has_table_privilege('authenticated', 'public.game_sessions', 'SELECT'),
  'participants may select sessions through RLS');
select ok(not has_table_privilege('authenticated', 'public.game_sessions', 'INSERT'),
  'authenticated clients cannot insert sessions directly');
select ok(not has_table_privilege('authenticated', 'public.game_session_journal_events', 'INSERT'),
  'authenticated clients cannot forge Journal events');
select ok(has_function_privilege('authenticated', 'public.start_game_session(uuid)', 'EXECUTE'),
  'authenticated role can invoke guarded start RPC');
select ok(not has_function_privilege('anon', 'public.start_game_session(uuid)', 'EXECUTE'),
  'anonymous role cannot invoke start RPC');
select ok(not has_function_privilege('authenticated', 'private.expire_game_sessions()', 'EXECUTE'),
  'timeout worker is not exposed to authenticated clients');

insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('91000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'session-gm@example.test', '', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('91000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'session-player@example.test', '', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('91000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'session-outsider@example.test', '', '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.campaigns (id, game_master_id, game_system, name)
values ('92000000-0000-4000-8000-000000000001',
        '91000000-0000-4000-8000-000000000001', 'vtm_v5', 'Session campaign');
insert into public.campaign_members (campaign_id, user_id, display_order)
values ('92000000-0000-4000-8000-000000000001',
        '91000000-0000-4000-8000-000000000002', 1);

set local role authenticated;
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}';
select throws_ok(
  $$select public.start_game_session('92000000-0000-4000-8000-000000000001')$$,
  'P0001', 'game_session_not_available', 'player cannot start a session');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$select public.start_game_session('92000000-0000-4000-8000-000000000001')$$,
  'GM starts without a LiveKit room');
select throws_ok(
  $$select public.start_game_session('92000000-0000-4000-8000-000000000001')$$,
  '23505', null, 'concurrent-equivalent second start is rejected by the unique index');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is((select count(*) from public.game_sessions), 1::bigint,
  'campaign player reads the active session');
select throws_ok(
  $$select public.end_game_session('92000000-0000-4000-8000-000000000001')$$,
  'P0001', 'game_session_not_available', 'player cannot end a session');
select throws_ok(
  $$select public.renew_game_session_presence('92000000-0000-4000-8000-000000000001')$$,
  'P0001', 'game_session_not_available', 'player cannot forge GM presence');
select throws_ok(
  $$insert into public.game_session_journal_events
      (game_session_id, actor_id, event_kind, event_data)
    select id, '91000000-0000-4000-8000-000000000002', 'dice_roll', '{}'::jsonb
    from public.game_sessions where ended_at is null$$,
  '42501', null, 'participant cannot forge a Journal event directly');
reset role;

select lives_ok(
  $$insert into public.game_session_journal_events
      (game_session_id, actor_id, event_kind, event_data)
    select id, '91000000-0000-4000-8000-000000000002', 'dice_roll',
           '{"fixture":true}'::jsonb
    from public.game_sessions where ended_at is null$$,
  'trusted future writer can persist against the exact active session');
select is((select count(*) from public.game_session_journal_events), 1::bigint,
  'active session owns its Journal event');

set local role authenticated;
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000003","role":"authenticated"}';
select is((select count(*) from public.game_sessions), 0::bigint,
  'outsider cannot read the session');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$select public.renew_game_session_presence('92000000-0000-4000-8000-000000000001')$$,
  'GM return before expiry renews the existing session');
select is((select count(*) from public.game_sessions where ended_at is null),
  1::bigint, 'presence renewal preserves the same active session');
select lives_ok(
  $$select public.end_game_session('92000000-0000-4000-8000-000000000001')$$,
  'GM explicitly ends the active session');
reset role;
select is((select end_reason from public.game_sessions order by started_at desc limit 1),
  'explicit', 'explicit end reason is retained');
select throws_ok(
  $$insert into public.game_session_journal_events
      (game_session_id, actor_id, event_kind, event_data)
    select id, '91000000-0000-4000-8000-000000000002', 'dice_roll', '{}'::jsonb
    from public.game_sessions order by started_at desc limit 1$$,
  'P0001', 'game_session_not_active', 'ended session rejects future Journal events');

set local role authenticated;
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$select public.start_game_session('92000000-0000-4000-8000-000000000001')$$,
  'a new session starts with a separate Journal scope');
reset role;
select is(
  (select count(*)
   from public.game_session_journal_events as event
   join public.game_sessions as session on session.id = event.game_session_id
   where session.ended_at is null),
  0::bigint,
  'new active session starts with an empty Journal and does not merge history'
);
select is((select count(*) from public.game_session_journal_events), 1::bigint,
  'ended session Journal data remains stored');
update public.game_sessions
set started_at = now() - interval '2 hours',
    presence_expires_at = now() - interval '1 hour'
where ended_at is null;
set local role authenticated;
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$select public.renew_game_session_presence('92000000-0000-4000-8000-000000000001')$$,
  'late presence renewal closes instead of resurrecting the session');
reset role;
select is((select count(*) from public.game_sessions where end_reason = 'timeout'),
  1::bigint, 'late renewal persists timeout closure');

set local role authenticated;
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$select public.start_game_session('92000000-0000-4000-8000-000000000001')$$,
  'GM can start after a late-renewal timeout');
reset role;
update public.game_sessions
set started_at = now() - interval '2 hours',
    presence_expires_at = now() - interval '1 hour'
where ended_at is null;
select is(private.expire_game_sessions(), 1, 'timeout worker closes the expired session');
select is((select count(*) from public.game_sessions where end_reason = 'timeout'),
  2::bigint, 'autonomous timeout closure uses the persisted timeout reason');

set local role authenticated;
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}';
select lives_ok(
  $$select public.start_game_session('92000000-0000-4000-8000-000000000001')$$,
  'GM can start another clean session after timeout');
reset role;
update public.campaigns set status = 'completed'
where id = '92000000-0000-4000-8000-000000000001';
select is((select count(*) from public.game_sessions where end_reason = 'campaign_completed'),
  1::bigint, 'campaign completion closes its active session');

select * from finish();
rollback;
