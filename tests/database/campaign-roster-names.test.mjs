import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const id = (n) => `99000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const migration = (name) => readFileSync(`supabase/migrations/${name}.sql`, 'utf8');

test('campaign-scoped roster labels on isolated PostgreSQL, using actual application migrations', async (t) => {
  const db = new PGlite({ extensions: { pgcrypto } });
  t.after(() => db.close());
  // Auth/Storage platform primitives only. All data is synthetic and in memory.
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage; create schema extensions;
    create table auth.users(id uuid primary key, email text, email_change text,
      encrypted_password text default 'private-password-hash', confirmation_token text default 'private-token');
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth, storage to authenticated, anon, service_role;
    grant execute on function auth.uid() to authenticated, anon, service_role;
    create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text primary key, owner uuid, metadata jsonb);
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    alter table storage.objects enable row level security;`);
  for (const name of ['20260630143000_initial_schema','20260709150000_campaign_foundation',
    '20260709163000_fix_campaign_select_policy','20260709170000_fix_campaign_character_trigger_security',
    '20260822190351_campaign_video_data_foundation','20260823143856_harden_campaign_database_grants']) {
    await db.exec(migration(name));
  }
  await db.exec(`set row_security=on; set check_function_bodies=on;
    insert into auth.users(id,email) select ('99000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
      'synthetic-'||n||'@example.test' from generate_series(1,11) n;
    select set_config('request.jwt.claim.sub','${id(1)}',false);
    insert into public.campaigns(id,game_master_id,game_system,name) values
      ('${id(100)}','${id(1)}','vtm-v5','Roster'), ('${id(101)}','${id(10)}','vtm-v5','Unrelated');
    insert into public.campaign_members(campaign_id,user_id,display_order,joined_at)
      select '${id(100)}', ('99000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
        (n-1)::smallint, '2026-11-01 12:00:00Z'::timestamptz + n * interval '1 day' from generate_series(2,7) n;
    insert into public.campaign_members(campaign_id,user_id,display_order) values ('${id(101)}','${id(11)}',1);
    update public.profiles set username='username-must-never-be-used-'||id::text;
    update public.profiles set display_name='  Alice Иван  ' where id='${id(2)}';
    update public.profiles set display_name='' where id='${id(4)}';
    update public.profiles set display_name=' '||chr(9)||chr(10)||chr(160)||chr(8195) where id='${id(5)}';
    update public.profiles set display_name='Campaign Player' where id='${id(6)}';
    update public.profiles set display_name='РусскоеИмяБезПробелов' where id='${id(7)}';`);
  const profilesBefore = (await db.query('select * from public.profiles order by id')).rows;
  const policiesBefore = (await db.query('select * from pg_policies where schemaname=$1 order by tablename,policyname',['public'])).rows;
  await db.exec(migration('20261108235143_campaign_overview_roster_names'));
  async function actor(user=id(1),role='authenticated') {
    await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${user}',false);`);
  }
  const load = async(campaign=id(100)) => (await db.query('select * from public.get_campaign_roster_players($1)',[campaign])).rows;
  const expected = ['Alice Иван','synthetic-3@example.test','synthetic-4@example.test','synthetic-5@example.test','Campaign Player','РусскоеИмяБезПробелов'];

  await t.test('normal registration creates empty profile fields, not a stored Campaign Player placeholder',async()=>{
    const profile=profilesBefore.find(row=>row.id===id(3));
    assert.equal(profile.display_name,null);
    assert.match(migration('20260630143000_initial_schema'),/insert into public\.profiles \(id\)/);
    assert.doesNotMatch(migration('20260630143000_initial_schema'),/Campaign Player|Игрок кампании/);
  });
  await t.test('trimmed display name wins; null/empty/Unicode whitespace use account email, never username',async()=>{
    await actor();const rows=await load();assert.equal(rows.length,6);
    assert.deepEqual(rows.map(row=>row.display_label),expected);
    assert.deepEqual(rows.map(row=>row.participant_id),[2,3,4,5,6,7].map(id));
    assert.equal(new Date(rows[0].joined_at).toISOString(),'2026-11-03T12:00:00.000Z');
    await db.exec('reset role');
    assert.deepEqual((await db.query('select * from public.profiles order by id')).rows,profilesBefore,'projection must not rewrite profiles');
  });
  await t.test('GM and current Players see exactly the same campaign roster, with no GM or unrelated accounts',async()=>{
    for(const user of [1,2,3,7]){await actor(id(user));const rows=await load();
      assert.deepEqual(rows.map(row=>row.display_label),expected);
      for(const row of rows) assert.deepEqual(Object.keys(row).sort(),['display_label','joined_at','participant_id']);
      assert.doesNotMatch(JSON.stringify(rows),/synthetic-(1|8|9|10|11)@|private-password-hash|private-token|username-must-never/);
      await assert.rejects(load(id(101)),{code:'42501'});
    }
  });
  await t.test('anonymous, missing identity and outsider calls are denied, including the non-exposed implementation',async()=>{
    for(const [user,role] of [['','anon'],['','authenticated'],[id(8),'authenticated'],[id(9),'authenticated']]){
      await actor(user,role);await assert.rejects(load(),{code:'42501'});
      await assert.rejects(db.query('select * from campaign_roster_labels.player_roster($1)',[id(100)]),{code:'42501'});
    }
  });
  await t.test('profile edits and current account email changes are reflected on the next load',async()=>{
    await actor(id(3));await db.query('update public.profiles set display_name=$1 where id=$2',[' Fresh chosen name ',id(3)]);
    assert.equal((await load())[1].display_label,'Fresh chosen name');
    await db.query('update public.profiles set display_name=$1 where id=$2',[' ',id(3)]);
    await db.exec('reset role');
    await db.query('update auth.users set email_change=$1 where id=$2',['pending-new@example.test',id(3)]);
    await actor();assert.equal((await load())[1].display_label,'synthetic-3@example.test','pending email is not the account email');
    await db.exec('reset role');await db.query('update auth.users set email=$1 where id=$2',['confirmed-current@example.test',id(3)]);
    await actor();assert.equal((await load())[1].display_label,'confirmed-current@example.test');
  });
  await t.test('removal immediately revokes roster access; completed campaigns retain their existing viewers only',async()=>{
    await actor();await db.query('delete from public.campaign_members where campaign_id=$1 and user_id=$2',[id(100),id(2)]);
    await actor(id(2));await assert.rejects(load(),{code:'42501'});
    await actor();await db.query('update public.campaigns set status=$1 where id=$2',['completed',id(100)]);
    for(const user of [1,3]){await actor(id(user));assert.equal((await load()).length,5);}
    await actor(id(2));await assert.rejects(load(),{code:'42501'});
  });
  await t.test('no global Auth grant, copied email field, changed policies or additional exposed Auth fields',async()=>{
    await actor(id(3));await assert.rejects(db.query('select email from auth.users'),{code:'42501'});
    await db.exec('reset role');
    assert.deepEqual((await db.query('select * from pg_policies where schemaname=$1 order by tablename,policyname',['public'])).rows,policiesBefore);
    assert.equal((await db.query("select count(*)::int n from information_schema.columns where table_schema='public' and table_name='profiles' and column_name like '%email%'")).rows[0].n,0);
    for(const signature of ['public.get_campaign_roster_players(uuid)','campaign_roster_labels.player_roster(uuid)']) {
      const row=(await db.query(`select prosecdef,provolatile,proconfig,
        has_function_privilege('anon',oid,'execute') anon,has_function_privilege('service_role',oid,'execute') service
        from pg_proc where oid=$1::regprocedure`,[signature])).rows[0];
      assert.equal(row.prosecdef,signature.startsWith('campaign_roster_labels'));
      assert.equal(row.anon,false);assert.equal(row.service,false);assert.equal(row.provolatile,'s');assert.ok(row.proconfig.includes('search_path=""'));
    }
    assert.equal((await db.query("select has_table_privilege('authenticated','auth.users','select') allowed")).rows[0].allowed,false);
  });
});
