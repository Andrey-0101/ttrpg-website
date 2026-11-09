import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const id = (n) => `98000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const migration = (name) => readFileSync(`supabase/migrations/${name}.sql`, 'utf8');

test('Gallery organization migration and real PostgreSQL RLS on isolated synthetic data', async (t) => {
  const db = new PGlite({ extensions: { pgcrypto } });
  t.after(() => db.close());
  // Only platform primitives are stubbed. Application tables, policies, triggers and RPCs
  // below come from the actual migrations. No URL, credentials or hosted project is used.
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage; create schema extensions;
    create table auth.users(id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    grant usage on schema auth, storage to authenticated, anon, service_role;
    grant execute on function auth.uid() to authenticated, anon, service_role;
    create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text primary key, owner uuid, metadata jsonb);
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    alter table storage.objects enable row level security;
  `);
  for (const name of [
    '20260630143000_initial_schema', '20260709150000_campaign_foundation',
    '20260709163000_fix_campaign_select_policy', '20260709170000_fix_campaign_character_trigger_security',
    '20260822190351_campaign_video_data_foundation', '20260823143856_harden_campaign_database_grants',
    '20260902132447_allow_completed_campaign_image_cleanup', '20260903000242_campaign_gallery_categories',
  ]) await db.exec(migration(name));
  await db.exec(`set row_security = on; set check_function_bodies = on;
    insert into auth.users(id) values ('${id(1)}'), ('${id(2)}'), ('${id(3)}'), ('${id(4)}');
    select set_config('request.jwt.claim.sub', '${id(1)}', false);
    insert into public.campaigns(id,game_master_id,game_system,name) values
      ('${id(10)}','${id(1)}','vtm-v5','Synthetic gallery'),
      ('${id(11)}','${id(1)}','call-of-cthulhu-7e','Another campaign');
    insert into public.campaign_members(campaign_id,user_id,display_order) values
      ('${id(10)}','${id(2)}',1), ('${id(10)}','${id(3)}',2);
    begin;
    insert into public.campaign_images(id,campaign_id,uploader_id,storage_object_name,display_name,mime_type,byte_size,visibility,category)
    values ${[20,21,22].map((n) => `('${id(n)}','${id(10)}','${id(1)}','${id(10)}/${id(n)}/${id(30)}.webp','Image ${n}','image/webp',128,'${n===20?'gm_only':n===21?'all_active_players':'selected_active_players'}','handout')`).join(',')};
    insert into public.campaign_image_recipients(campaign_id,image_id,user_id,created_by)
      values ('${id(10)}','${id(22)}','${id(2)}','${id(1)}');
    commit;
    insert into storage.objects(bucket_id,name) select 'campaign-images', storage_object_name from public.campaign_images;
    create function storage.reject_object_mutation() returns trigger language plpgsql as
      $$begin raise exception 'unexpected Storage mutation'; end$$;
    create trigger no_storage_mutation before insert or update or delete on storage.objects
      for each statement execute function storage.reject_object_mutation();
  `);
  const before = (await db.query('select * from public.campaign_images order by id')).rows;
  const recipients = (await db.query('select * from public.campaign_image_recipients')).rows;
  await db.exec(migration('20261108163016_campaign_gallery_organization'));
  async function actor(user = id(1), role = 'authenticated') {
    await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${user}',false);`);
  }
  const folder = async (name, category = 'handout', campaign = id(10), target = null) => {
    const result = (await db.query('select public.save_campaign_gallery_folder($1,$2,$3,$4) id', [campaign,category,name,target])).rows[0];
    return (await db.query('select * from public.campaign_gallery_folders where id=$1',[result.id])).rows[0];
  };
  const move = (target) => db.query('select public.move_campaign_gallery_image($1,$2)', [id(21),target]);
  await actor();
  const a = await folder(' Folder A ');
  const b = await folder('Folder B');
  const otherCategory = await folder('NPC folder','npc');
  const otherCampaign = await folder('Other campaign','handout',id(11));

  await t.test('existing images remain at the root; folder create/rename retains ID and scope', async () => {
    assert.equal(a.name, 'Folder A');
    assert.equal((await db.query('select count(*)::int n from public.campaign_gallery_locations')).rows[0].n, 0);
    const renamed = await folder('Папка с новым именем','handout',id(10),a.id);
    assert.equal(renamed.id,a.id); assert.equal(renamed.category,'handout');
    assert.equal(renamed.name,'Папка с новым именем');
    assert.equal((await db.query('select count(*)::int n from public.campaign_images')).rows[0].n,3);
  });
  await t.test('root to folder, folder to folder and folder to root have exactly one association', async () => {
    for (const target of [a.id,b.id,null]) {
      await move(target);
      const rows = (await db.query('select * from public.campaign_gallery_locations where image_id=$1',[id(21)])).rows;
      assert.equal(rows.length,target ? 1 : 0);
      if (target) assert.equal(rows[0].folder_id,target);
      assert.equal((await db.query('select count(*)::int n from public.campaign_images')).rows[0].n,3);
    }
  });
  await t.test('database foreign keys reject cross-category and cross-campaign locations, including direct writes', async () => {
    for (const target of [otherCategory.id,otherCampaign.id]) {
      await assert.rejects(move(target),{code:'23503'});
      await assert.rejects(db.query('insert into public.campaign_gallery_locations(image_id,campaign_id,category,folder_id) values($1,$2,$3,$4)',
        [id(21),id(10),'handout',target]),{code:'23503'});
    }
    await assert.rejects(db.query('update public.campaign_gallery_folders set category=$1 where id=$2',['npc',a.id]),{code:'42501'});
    await assert.rejects(db.query('delete from public.campaign_gallery_folders where id=$1',[a.id]),{code:'42501'});
    await assert.rejects(folder('Wrong scope','npc',id(10),a.id),{code:'22023'});
    await assert.rejects(folder('Wrong scope','handout',id(11),a.id),{code:'22023'});
    await assert.rejects(db.query('insert into public.campaign_gallery_locations(image_id,campaign_id,category,folder_id) values($1,$2,$3,$4)',
      [id(21),id(10),'npc',otherCategory.id]),{code:'23503'});
    await assert.rejects(db.query('update public.campaign_images set category=$1 where id=$2',['npc',id(21)]),/campaign_image_identity_is_immutable/);
  });
  await t.test('renaming touches display_name only; files, visibility, recipients and location are preserved', async () => {
    await move(a.id);
    await db.query('select public.rename_campaign_gallery_image($1,$2)',[id(21),'  Новое имя <script> & text  ']);
    const after = (await db.query('select * from public.campaign_images order by id')).rows;
    for (let i=0;i<after.length;i++) {
      const {display_name,updated_at,...stable} = after[i];
      const {display_name: oldName,updated_at: oldUpdated,...oldStable} = before[i];
      assert.deepEqual(stable,oldStable);
      assert.equal(display_name,i===1?'Новое имя <script> & text':oldName);
      void updated_at; void oldUpdated;
    }
    assert.deepEqual((await db.query('select * from public.campaign_image_recipients')).rows,recipients);
    assert.equal((await db.query('select folder_id from public.campaign_gallery_locations')).rows[0].folder_id,a.id);
  });
  await t.test('server names reject missing/blank/control/overlong values and accept 255 Unicode characters', async () => {
    for (const name of [null,'',' \t\n','\u00a0\u2003','x'.repeat(256),'a\tb','a\u0085b']) {
      await assert.rejects(folder(name),{code:'22023'});
      await assert.rejects(db.query('select public.rename_campaign_gallery_image($1,$2)',[id(21),name]),{code:'22023'});
    }
    const emoji = '🧙'.repeat(255);
    assert.equal((await folder(emoji)).name,emoji);
  });
  await t.test('Players and outsiders cannot read organization or mutate it; existing image access is unchanged', async () => {
    for (const [user,visible] of [[id(2),2],[id(3),1],[id(4),0]]) {
      await actor(user);
      assert.equal((await db.query('select * from public.campaign_gallery_folders')).rows.length,0);
      assert.equal((await db.query('select * from public.campaign_gallery_locations')).rows.length,0);
      assert.equal((await db.query('select * from public.campaign_images')).rows.length,visible);
      await assert.rejects(folder('Unauthorized'),{code:'42501'});
      await assert.rejects(db.query('select public.rename_campaign_gallery_image($1,$2)',[id(21),'Unauthorized']),{code:'42501'});
      await assert.rejects(move(a.id),{code:'42501'});
      await assert.rejects(move(null),{code:'42501'});
      await assert.rejects(db.query('insert into public.campaign_gallery_folders(campaign_id,category,name) values($1,$2,$3)',[id(10),'handout','Direct write']),{code:'42501'});
      await assert.rejects(db.query('insert into public.campaign_gallery_locations(image_id,campaign_id,category,folder_id) values($1,$2,$3,$4)',[id(21),id(10),'handout',a.id]),{code:'42501'});
      assert.equal((await db.query('update public.campaign_gallery_folders set name=$1 where id=$2 returning name',['Player rename',a.id])).rows.length,0);
    }
    await actor('', 'anon');
    await assert.rejects(folder('Anonymous'),{code:'42501'});
    await actor();
  });
  await t.test('completed campaigns retain GM read access and reject every new mutation', async () => {
    await db.query('update public.campaigns set status=$1 where id=$2',['completed',id(10)]);
    assert.ok((await db.query('select * from public.campaign_gallery_folders')).rows.length>0);
    await assert.rejects(folder('Completed'),{code:'42501'});
    await assert.rejects(folder('Rename completed','handout',id(10),a.id),{code:'42501'});
    await assert.rejects(db.query('select public.rename_campaign_gallery_image($1,$2)',[id(21),'Completed']),{code:'42501'});
    await assert.rejects(move(null),{code:'42501'});
    await actor(id(2));
    assert.equal((await db.query('select * from public.campaign_images')).rows.length,0);
    await actor();
  });
  await t.test('new functions are invoker-only; RLS/grants are explicit and no parent-folder field exists', async () => {
    await db.exec('reset role');
    const functions = (await db.query(`select proname,prosecdef,proconfig,has_function_privilege('anon',oid,'execute') anon
      from pg_proc where proname in ('save_campaign_gallery_folder','rename_campaign_gallery_image','move_campaign_gallery_image','normalize_campaign_gallery_name')`)).rows;
    assert.equal(functions.length,4);
    for (const fn of functions) { assert.equal(fn.prosecdef,false); assert.equal(fn.anon,false); assert.ok(fn.proconfig.includes('search_path=""')); }
    assert.equal((await db.query(`select count(*)::int n from pg_class where relname in ('campaign_gallery_folders','campaign_gallery_locations') and relrowsecurity`)).rows[0].n,2);
    assert.equal((await db.query(`select count(*)::int n from information_schema.columns where table_name='campaign_gallery_folders' and column_name='parent_id'`)).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from storage.objects')).rows[0].n,3);
  });
  await t.test('existing campaign deletion still cascades folders and locations after Storage cleanup', async () => {
    // All writes remain inside this disposable in-memory database.
    await db.exec('reset role; drop trigger no_storage_mutation on storage.objects; delete from storage.objects;');
    await actor();
    await db.query('delete from public.campaigns where id=$1',[id(10)]);
    assert.equal((await db.query('select count(*)::int n from public.campaign_gallery_folders where campaign_id=$1',[id(10)])).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from public.campaign_gallery_locations')).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from public.campaign_gallery_folders where campaign_id=$1',[id(11)])).rows[0].n,1);
  });
});
