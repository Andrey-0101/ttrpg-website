import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { createTranslator } from 'next-intl';
import sharp from 'sharp';
import { transpileModule, ModuleKind, JsxEmit } from 'typescript';

// A small deterministic hook/JSX harness exercises the real event handlers, not a
// copy of their implementation. Browser layout/focus checks are separate.
function harness(overrides = {}, locale = 'en', confirm = () => false) {
  const states = new Map(); const modules = new Map(); const effects = [];
  let cursor; let position; let seen;
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'));
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const react = {
    useId() { return 'gallery-image-menu'; },
    useState(initial) { const state = cursor; const index = position++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
    useRef(initial) { const state = cursor; const index = position++; return state[index] ??= { current: initial }; },
    useMemo(fn) { return fn(); },
    useEffect(fn, deps) { const state = cursor; const index = position++;
      if (!state[index] || deps.some((dep,i) => dep !== state[index][i])) { state[index] = deps; effects.push(fn); } },
  };
  function load(file) {
    const absolute = path.resolve(file);
    if (modules.has(absolute)) return modules.get(absolute);
    const exports = {}; modules.set(absolute,exports);
    runInNewContext(transpileModule(readFileSync(absolute,'utf8'), { compilerOptions: { module:ModuleKind.CommonJS, jsx:JsxEmit.ReactJSX } }).outputText, {
      exports, console, crypto, Response, URL, URLSearchParams, Buffer, AbortSignal,
      document: { body:{style:{}} }, window:{confirm,addEventListener(){},removeEventListener(){}},
      require(name) {
        if (name in overrides) return overrides[name];
        if (name==='react') return react;
        if (name==='react/jsx-runtime') return { jsx, jsxs:jsx, Fragment:'fragment' };
        if (name==='next-intl') return { useTranslations:(namespace)=>createTranslator({locale,messages,namespace}) };
        if (name==='next/image') return { default:'img' };
        if (name==='@/i18n/navigation') return { useRouter:()=>({refresh(){}}), Link:'a' };
        if (name==='@/utils/supabase/client') return { createClient(){ throw Error('No test database configured'); } };
        if (name==='@/lib/navigation/unsaved-changes') return { useUnsavedChangesGuard(){}, requestUnsavedChangesNavigation: (fn)=>fn() };
        if (name==='@/lib/game-systems/use-campaign-role') return { useCampaignGameMasterRole:()=>({role:'Keeper',roleGenitive:"Keeper's",roleDative:'Keeper'}) };
        if (name.startsWith('@/components/') && !name.includes('campaign-gallery-organization')) return { default:()=>null };
        const base = name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(absolute),name);
        return load(base + (['.ts','.tsx'].find((ext)=>{try {readFileSync(base+ext); return true;}catch{return false;}}) ?? ''));
      },
    });
    return exports;
  }
  function render(node, key='root') {
    if (node==null || typeof node==='boolean') return null;
    if (Array.isArray(node)) return node.map((child,i)=>render(child,`${key}/${child?.key ?? i}`));
    if (typeof node!=='object') return node;
    if (typeof node.type==='function') {
      const identity = `${key}/${node.type.name}/${node.key ?? ''}`;
      seen.add(identity); cursor = states.get(identity) ?? []; position=0; states.set(identity,cursor);
      return render(node.type(node.props),identity);
    }
    return {...node,props:{...node.props,children:render(node.props.children,`${key}/children`)}};
  }
  function nodes(tree) { return tree==null ? [] : Array.isArray(tree) ? tree.flatMap(nodes)
    : typeof tree==='object' ? [tree,...nodes(tree.props.children)] : []; }
  const text = (node) => node==null ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node==='object' ? text(node.props.children) : String(node);
  return {load, render:(component,props)=>{seen=new Set();const tree=render(jsx(component,props));for(const key of states.keys()) if(!seen.has(key)) states.delete(key);return tree;},nodes,text,
    find:(tree,type,label)=>{const result=nodes(tree).find((node)=>node.type===type && (label==null || (node.props['aria-label'] ?? text(node))===label)); assert.ok(result,`Missing ${type}: ${label}`); return result;},
    runEffects:async()=>{for(const fn of effects.splice(0)) fn(); await new Promise(setImmediate);},
  };
}
function organization() {return {folders:[{id:'a',category:'handout',name:'Folder A'},{id:'b',category:'handout',name:'Folder B'},{id:'npc',category:'npc',name:'NPC'}],locations:[],names:{},loading:false,loadError:false,retry(){},
  async saveFolder(category,name,id){this.folders=this.folders.filter((f)=>f.id!==id).concat({id:id??'new',category,name});},
  async renameImage(id,name){this.names[id]=name;}, async moveImage(id,folder){this.locations=this.locations.filter((l)=>l.image_id!==id).concat(folder?[{image_id:id,folder_id:folder}]:[]);} };}
const event = {preventDefault(){}};

test('client name validation matches server bounds, whitespace and Unicode rules',()=>{
  const h=harness(); const {normalizeCampaignGalleryName: normalize}=h.load('lib/campaign-handouts/organization.ts');
  for(const name of ['',' \t\n','\u00a0\u2003','x'.repeat(256),'a\tb','a\u0085b']) assert.equal(normalize(name),null);
  assert.equal(normalize(' 🧙 '.repeat(1)),'🧙'); assert.equal(normalize('🧙'.repeat(255)),'🧙'.repeat(255));
});

for(const locale of ['en','ru']) test(`folder create/rename and Save/Cancel retain failed input and expose pending state (${locale})`,async()=>{
  const h=harness({},locale); const {CampaignGalleryFolders: Component}=h.load('components/campaigns/campaign-gallery-organization.tsx');
  const org=organization(); const t=createTranslator({locale,messages:JSON.parse(readFileSync(`messages/${locale}.json`)).CampaignGalleryOrganization});
  let folderId=null; const props=()=>({organization:org,category:'handout',folderId,onFolderChange:(id)=>folderId=id,editable:true});
  let tree=h.render(Component,props()); h.find(tree,'button',t('createFolder')).props.onClick();
  tree=h.render(Component,props()); h.find(tree,'input').props.onChange({target:{value:'Failed new name'}});
  org.saveFolder=async()=>{throw Error('synthetic failure');};
  tree=h.render(Component,props()); await h.find(tree,'form').props.onSubmit(event);
  tree=h.render(Component,props()); assert.equal(h.find(tree,'input').props.value,'Failed new name'); assert.ok(h.nodes(tree).some(n=>n.props.role==='alert'));
  let release; org.saveFolder=()=>new Promise((resolve)=>release=resolve);
  const saving=h.find(tree,'form').props.onSubmit(event); tree=h.render(Component,props());
  assert.equal(h.find(tree,'input').props.disabled,true); assert.equal(h.find(tree,'form').props['aria-busy'],true);
  release(); await saving; tree=h.render(Component,props()); assert.equal(h.nodes(tree).some(n=>n.type==='input'),false);
  h.find(tree,'button',t('openFolder',{name:'Folder A'})).props.onClick(); tree=h.render(Component,props());
  h.find(tree,'button',t('renameFolder')).props.onClick(); tree=h.render(Component,props());
  assert.equal(h.find(tree,'input').props.value,'Folder A'); h.find(tree,'button',t('cancel')).props.onClick();
  tree=h.render(Component,props()); assert.ok(h.text(tree).includes('Folder A'));
});

test('Move offers only same-category destinations and preserves failed selection until retry',async()=>{
  const h=harness(); const {CampaignGalleryImageActions:Component}=h.load('components/campaigns/campaign-gallery-organization.tsx');
  const org=organization(); const props={organization:org,imageId:'image',displayName:'Original',category:'handout'};
  let tree=h.render(Component,props); h.find(tree,'button','Move').props.onClick(); tree=h.render(Component,props);
  assert.deepEqual(h.nodes(tree).filter(n=>n.type==='option').map(n=>n.props.value),['','a','b']);
  h.find(tree,'select').props.onChange({target:{value:'b'}}); org.moveImage=async()=>{throw Error('failure');};
  tree=h.render(Component,props); await h.find(tree,'form').props.onSubmit(event); tree=h.render(Component,props);
  assert.equal(h.find(tree,'select').props.value,'b'); assert.ok(h.nodes(tree).some(n=>n.props.role==='alert'));
  const moves=[]; org.moveImage=async(id,folder)=>moves.push([id,folder]); await h.find(tree,'form').props.onSubmit(event);
  assert.deepEqual(moves,[['image','b']]);
});

test('empty-folder navigation, load errors and read-only controls stay explicit',()=>{
  const h=harness();const {CampaignGalleryFolders:Component}=h.load('components/campaigns/campaign-gallery-organization.tsx');
  const org=organization();let selected='a', retries=0;org.retry=()=>retries++;
  const props=()=>({organization:org,category:'handout',folderId:selected,onFolderChange:(id)=>selected=id,editable:false});
  let tree=h.render(Component,props());assert.ok(h.text(tree).includes('Folder A'));
  assert.ok(!h.nodes(tree).some(n=>h.text(n)==='Rename folder'));
  h.find(tree,'button','Handouts / Category root').props.onClick();tree=h.render(Component,props());
  assert.equal(selected,null);assert.ok(h.text(tree).includes('Folder: Folder B'));
  org.loadError=true;tree=h.render(Component,props());assert.ok(h.nodes(tree).some(n=>n.props.role==='alert'));
  h.find(tree,'button','Retry').props.onClick();assert.equal(retries,1);
});

test('blank image rename never reaches the mutation and Cancel discards only the draft',async()=>{
  const h=harness();const {CampaignGalleryImageActions:Component}=h.load('components/campaigns/campaign-gallery-organization.tsx');
  const org=organization();let saves=0;org.renameImage=async()=>saves++;
  const props={organization:org,imageId:'image',displayName:'Original',category:'handout'};
  let tree=h.render(Component,props);h.find(tree,'button','Rename').props.onClick();tree=h.render(Component,props);
  h.find(tree,'input').props.onChange({target:{value:'   '}});tree=h.render(Component,props);await h.find(tree,'form').props.onSubmit(event);
  tree=h.render(Component,props);assert.equal(saves,0);assert.equal(h.find(tree,'input').props.value,'   ');
  assert.ok(h.nodes(tree).some(n=>n.props.role==='alert'));h.find(tree,'button','Cancel').props.onClick();tree=h.render(Component,props);
  h.find(tree,'button','Rename').props.onClick();tree=h.render(Component,props);assert.equal(h.find(tree,'input').props.value,'Original');
});

test('standalone and Game Room use the same folders, root filter and stable selected image after rename/move',async()=>{
  for(const surface of ['standalone','room']) {
    const org=organization(); org.locations=[{image_id:'nested',folder_id:'a'}];
    let stop=0,share=0;
    const h=harness({'@/lib/campaign-handouts/use-organization':{useCampaignGalleryOrganization:()=>org}, '@/utils/supabase/client':{createClient:()=>({})}});
    const Component=h.load(`components/campaigns/${surface==='room'?'campaign-game-room-workspace':'campaign-handouts-manager'}.tsx`).default;
    const items=['root','nested'].map(id=>({id,imageId:id,key:id,displayName:id,signedUrl:`/${id}.webp`,localSignedUrl:`/${id}.webp`,category:'handout',visibility:'gm_only',recipientIds:[],storagePath:`stable/${id}`}));
    const props=surface==='room'?{campaignId:'campaign',campaignGameSystem:'vtm-v5',isGameMaster:true,galleryItems:items,connected:true,isPresenting:true,
      presentationExpanded:false,sharedPresentationUrl:'/root.webp',presentationBusy:false,gameSession:{session:null,journal:[]},onStopShare:async()=>{stop++;return true;},onShareImage:async()=>{share++;return true;}}:
      {campaignId:'campaign',gameSystem:'vtm-v5',currentUserId:'gm',campaignActive:true,initialHandouts:items,players:[]};
    let tree=h.render(Component,props);
    if(surface==='room'){h.find(tree,'button','Gallery').props.onClick();tree=h.render(Component,props);}
    assert.ok(h.nodes(tree).some(n=>n.props['data-gallery-image-actions']==='root'));
    assert.ok(h.nodes(tree).some(n=>n.type==='img' && n.props.src==='/api/campaigns/campaign/gallery/root?variant=thumbnail'));
    assert.ok(!h.nodes(tree).some(n=>n.props['data-gallery-image-actions']==='nested'));
    h.find(tree,'button','Folder: Folder A').props.onClick(); tree=h.render(Component,props);
    assert.ok(h.nodes(tree).some(n=>n.props['data-gallery-image-actions']==='nested'));
    assert.ok(h.nodes(tree).some(n=>n.type==='img' && n.props.src==='/api/campaigns/campaign/gallery/nested?variant=thumbnail'));
    if(surface==='room'){
      h.find(tree,'button','Open nested').props.onPointerUp({pointerType:'touch'});tree=h.render(Component,props);
    }
    h.find(tree,'button','Rename').props.onClick();tree=h.render(Component,props);
    h.find(tree,'input').props.onChange({target:{value:'Renamed <img>'}});
    tree=h.render(Component,props);await h.find(tree,'form').props.onSubmit(event);tree=h.render(Component,props);
    assert.ok(h.text(tree).includes('Renamed <img>'));
    assert.equal(h.nodes(tree).filter(n=>n.props.role==='dialog').length,0);
    h.find(tree,'button','Move').props.onClick();tree=h.render(Component,props);
    h.find(tree,'select').props.onChange({target:{value:'b'}});
    tree=h.render(Component,props);await h.find(tree,'form').props.onSubmit(event);tree=h.render(Component,props);
    if(surface==='room'){
      assert.ok(h.nodes(tree).some(n=>n.type==='img' && n.props.src==='/api/campaigns/campaign/gallery/nested'));
      assert.ok(h.text(tree).includes('Renamed <img>')); assert.equal(stop,0);assert.equal(share,0);
      assert.ok(h.text(tree).includes('Handouts / Folder B'));
      assert.ok(h.nodes(tree).some(n=>n.props['data-game-room-image-tools']===true));
    }
  }
});

for (const locale of ['en','ru']) test(`the menu has exactly three ordered actions; cancel and confirmed Storage-first deletion (${locale})`,async()=>{
  const operations=[];let confirmed=false,deleted=0;
  const chain={delete(){operations.push('delete row');return this;},
    eq(column,value){operations.push([column,value]);return this;},
    then(resolve){return Promise.resolve({error:null}).then(resolve);}};
  const client={storage:{from(bucket){operations.push(bucket);return {
    async remove(paths){operations.push(['remove',...paths]);return{error:null};},
    async list(folder){operations.push(['verify',folder]);return{data:[],error:null};},
  };}},from(table){operations.push(table);return chain;}};
  const h=harness({'@/utils/supabase/client':{createClient:()=>client}},locale,()=>confirmed);
  const {CampaignGalleryImageActions:Component}=h.load('components/campaigns/campaign-gallery-organization.tsx');
  const label='ОченьДлинноеИзображение'.repeat(8);
  const props={organization:organization(),campaignId:'campaign',imageId:'image',category:'handout',displayName:label,
    storagePath:'campaign/image/object.webp',beforeDelete:async()=>{operations.push('stop selected presentation');return true;},
    onDeleted:()=>deleted++};
  const tree=h.render(Component,props);
  const items=h.nodes(tree).filter(node=>node.props.role==='menuitem');
  assert.deepEqual(items.map(h.text),locale==='ru'?['Переименовать','Переместить','Удалить']:['Rename','Move','Delete']);
  const trigger=h.nodes(tree).find(node=>node.props['aria-haspopup']==='menu');
  assert.ok(trigger.props['aria-label'].includes(label));
  await items[2].props.onClick();assert.equal(operations.length,0);assert.equal(deleted,0);
  confirmed=true;await items[2].props.onClick();
  assert.equal(deleted,1);
  assert.deepEqual(operations,['stop selected presentation','campaign-images',['remove','campaign/image/object.webp'],
    ['verify','campaign/image'],'campaign_images','delete row',['campaign_id','campaign'],['id','image']]);
});

test('Player Gallery renders the existing caption without any management menu',()=>{
  const h=harness();const Gallery=h.load('components/campaigns/campaign-handout-gallery.tsx').default;
  const tree=h.render(Gallery,{campaignId:'campaign',items:[{key:'shared',category:'handout',displayName:'Shared image'}]});
  assert.ok(h.text(tree).includes('Shared image'));
  assert.equal(h.nodes(tree).filter(node=>node.props.role==='menuitem').length,0);
});

test('Game Room reopens a folder with a usable image request after failure', () => {
  const org = organization();
  org.locations = [{ image_id: 'nested', folder_id: 'a' }];
  const h = harness({'@/lib/campaign-handouts/use-organization':{useCampaignGalleryOrganization:()=>org}});
  const Workspace = h.load('components/campaigns/campaign-game-room-workspace.tsx').default;
  const props = { campaignId: 'campaign', campaignGameSystem: 'vtm-v5', isGameMaster: true,
    gameSession: { session: null, journal: [] }, galleryItems: [{ imageId: 'nested', displayName: 'Map', category: 'handout' }] };
  const render = () => h.render(Workspace, props);
  h.find(render(), 'button', 'Gallery').props.onClick();
  h.find(render(), 'button', 'Folder: Folder A').props.onClick();
  h.find(render(), 'img').props.onError();
  h.find(render(), 'img').props.onError();
  assert.ok(h.find(render(), 'button', 'Reload image'));
  h.find(render(), 'button', 'Back').props.onClick();
  h.find(render(), 'button', 'Gallery').props.onClick();
  h.find(render(), 'button', 'Folder: Folder A').props.onClick();
  assert.equal(h.find(render(), 'img').props.src, '/api/campaigns/campaign/gallery/nested?variant=thumbnail');
});

test('received presentation requests one automatic renewal and retries manually with the same revision', async () => {
  const h = harness();
  const { CampaignPresentedImage } = h.load('components/campaigns/campaign-gallery-image.tsx');
  const requests = [];
  const onRenew = async (revision) => { requests.push(revision); return true; };
  const render = (url, revision = 3) => h.render(CampaignPresentedImage, { url, revision, onRenew, alt: '' });
  h.find(render('/expired'), 'img').props.onError();
  await new Promise(setImmediate);
  assert.deepEqual(requests, [3]);
  const image = h.find(render('/fresh'), 'img');
  assert.equal(image.props.src, '/fresh');
  image.props.onError();
  assert.deepEqual(requests, [3]);
  const retry = h.find(render('/fresh'), 'button', 'Reload image');
  assert.equal(retry.props.disabled, false);
  retry.props.onClick();
  await new Promise(setImmediate);
  assert.deepEqual(requests, [3, 3]);
  assert.equal(h.find(render('/replacement', 4), 'img').props.src, '/replacement');
});

test('Gallery retries through a new private redirect after Storage 400 InvalidJWT, then waits for manual retry', async () => {
  const campaignId = 'a1000000-0000-4000-8000-000000000001';
  const imageId = 'a1000000-0000-4000-8000-000000000004';
  let authorized = true;
  let authenticated = true;
  let signed = 0;
  let thumbnails = 0;
  const calls = [];
  const h = harness({
    '@/utils/supabase/server': { async createClient() { return {}; } },
    '@/lib/campaign-handouts/gallery-thumbnail.server': {
      async loadCampaignGalleryThumbnail() { thumbnails++; return Buffer.from([1, 2, 3]); },
    },
    '@/lib/campaign-video/supabase-data-source.server': {
      SupabaseCampaignVideoAuthorizationDataSource: class {
        async getAuthenticatedUserId() { return authenticated ? 'viewer' : null; }
        async findCampaignImageStoragePath(campaign, image) {
          calls.push([campaign, image]);
          return authorized ? 'private.webp' : null;
        }
        async createCampaignImageSignedUrl() { return `https://storage.test/object?token=synthetic-${++signed}`; }
      },
    },
  });
  const { GET } = h.load('app/api/campaigns/[campaignId]/gallery/[imageId]/route.ts');
  const { CampaignGalleryImage } = h.load('components/campaigns/campaign-gallery-image.tsx');
  const props = { campaignId, imageId, alt: '' };
  const render = () => h.render(CampaignGalleryImage, props);
  const load = async (image) => {
    const response = await GET(new Request('https://example.test' + image.props.src), { params: Promise.resolve(props) });
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.status, 302);
    return response.headers.get('location');
  };
  const first = h.find(render(), 'img');
  const expired = await load(first);
  const storage = (url) => url === expired
    ? Response.json({ statusCode: '400', error: 'InvalidJWT', message: '"exp" claim timestamp check failed', code: 'InvalidJWT' }, { status: 400 })
    : new Response('test image bytes', { status: 200 });
  assert.equal(storage(expired).status, 400);
  first.props.onError();
  const second = h.find(render(), 'img');
  assert.notEqual(first.props.src, second.props.src);
  assert.equal(storage(await load(second)).status, 200);
  second.props.onError();
  const failure = render();
  assert.equal(h.nodes(failure).some(node => node.type === 'img'), false);
  h.find(failure, 'button', 'Reload image').props.onClick();
  assert.notEqual(h.find(render(), 'img').props.src, second.props.src);
  h.render(() => null, {});
  assert.equal(storage(await load(h.find(render(), 'img'))).status, 200, 'reopening requests another signature');
  authorized = false;
  const denied = await GET(new Request('https://example.test'), { params: Promise.resolve(props) });
  assert.equal(denied.status, 404);
  assert.equal(denied.headers.get('location'), null);
  assert.equal(signed, 3);
  assert.deepEqual(calls, Array.from({ length: 4 }, () => [campaignId, imageId]));

  const thumbnailRequest = () => GET(new Request('https://example.test?variant=thumbnail'), { params: Promise.resolve(props) });
  assert.equal((await thumbnailRequest()).status, 404);
  authenticated = false;
  assert.equal((await thumbnailRequest()).status, 401);
  assert.equal(thumbnails, 0);
  authorized = authenticated = true;
  const thumbnail = await thumbnailRequest();
  assert.equal(thumbnail.status, 200);
  assert.equal(thumbnail.headers.get('content-type'), 'image/webp');
  assert.equal(thumbnail.headers.get('cache-control'), 'private, no-store');
  assert.equal(thumbnail.headers.get('location'), null);
  assert.deepEqual(new Uint8Array(await thumbnail.arrayBuffer()), new Uint8Array([1, 2, 3]));
  assert.equal(signed, 3);
});

test('Player Gallery opens the original while list and retry URLs request thumbnails', () => {
  const h = harness();
  const { default: Gallery } = h.load('components/campaigns/campaign-handout-gallery.tsx');
  const props = { campaignId: 'campaign', items: [{ key: 'image', displayName: 'Map' }] };
  const original = '/api/campaigns/campaign/gallery/image';
  const render = () => h.render(Gallery, props);
  const image = h.find(render(), 'img');
  assert.equal(image.props.src, `${original}?variant=thumbnail`);
  image.props.onError();
  assert.ok(h.find(render(), 'img').props.src.startsWith(`${original}?variant=thumbnail&retry=`));
  h.find(render(), 'button', 'Open Map').props.onClick({ currentTarget: { focus() {} } });
  assert.ok(h.nodes(render()).some(node => node.type === 'img' && node.props.src === original));
});

test('Gallery generates a smaller WebP, reuses it and invalidates a changed or inaccessible original', async (t) => {
  const width = 1600, height = 1000;
  const pixels = Buffer.alloc(width * height * 3);
  let seed = 1337;
  for (let i = 0; i < pixels.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    pixels[i] = (seed >>> 24) + (i / (width * 3) > height / 2 ? 50 : 0);
  }
  const original = await sharp(pixels, { raw: { width, height, channels: 3 } }).jpeg({ quality: 88 }).toBuffer();
  let stored;
  let downloads = 0;
  let version = 'one';
  let visible = true;
  let replaceOnDownload = false;
  const bucket = {
    async info() { return visible ? { data: { version } } : { error: 'denied' }; },
    async download() {
      downloads++;
      if (replaceOnDownload) version = 'replacement';
      return { data: new Blob([original]) };
    },
  };
  const client = { storage: { from(name) { assert.equal(name, 'campaign-images'); return bucket; } } };
  const h = harness({
    'server-only': {},
    sharp: { default: sharp },
    '@/utils/supabase/admin': { createAdminClient: () => ({ from(name) {
      assert.equal(name, 'campaign_image_thumbnails');
      return {
        select() {
          const filter = {};
          return { eq(key, value) { filter[key] = value; return this; }, async maybeSingle() {
            const data = stored?.image_id === filter.image_id && stored.source_version === filter.source_version ? stored : null;
            return { data, error: null };
          } };
        },
        async upsert(row) { stored = row; return { error: null }; },
      };
    } }) },
  });
  const { loadCampaignGalleryThumbnail } = h.load('lib/campaign-handouts/gallery-thumbnail.server.ts');
  const load = () => loadCampaignGalleryThumbnail(client, 'existing-image', 'private/original.jpg');
  const [thumbnail, simultaneous] = await Promise.all([load(), load()]);
  const preview = await sharp(thumbnail).metadata();
  assert.equal(preview.format, 'webp');
  assert.equal(preview.width, 384);
  assert.equal(preview.height, 240);
  assert.ok(thumbnail.byteLength < original.byteLength / 5);
  t.diagnostic(`Original JPEG ${width} × ${height}, ${original.byteLength} bytes. Thumbnail WebP ${preview.width} × ${preview.height}, ${thumbnail.byteLength} bytes.`);
  assert.deepEqual(thumbnail, simultaneous);
  assert.deepEqual(await load(), thumbnail);
  assert.equal(downloads, 1);
  visible = false;
  assert.equal(await load(), null);
  assert.equal(downloads, 1);
  visible = true;
  version = 'two';
  replaceOnDownload = true;
  assert.equal(await load(), null);
  replaceOnDownload = false;
  assert.deepEqual(await load(), thumbnail);
  assert.equal(downloads, 3);
  assert.ok(stored.source_version.includes('replacement'));
});

test('real organization hook uses only metadata RPCs, leaves failed state unchanged and never loads for Players',async()=>{
  const calls=[];let failure=false;
  const client={from(table){calls.push(table);return{select(){return this;},eq(){return this;},order(){return this;},then(resolve){return Promise.resolve({data:[],error:null}).then(resolve);}};},
    async rpc(name,args){calls.push([name,args]);return{data:failure?null:name==='rename_campaign_gallery_image'?args.target_name:'created',error:failure?{}:null};}};
  for(const enabled of [false,true]){
    const h=harness({'@/utils/supabase/client':{createClient:()=>client}});const {useCampaignGalleryOrganization:hook}=h.load('lib/campaign-handouts/use-organization.ts');
    let value;function Component(){value=hook('campaign',enabled);return null;}
    h.render(Component,{});await h.runEffects();h.render(Component,{});
    if(!enabled){assert.equal(calls.length,0);continue;}
    await value.saveFolder('handout',' Created ');await value.renameImage('image',' Renamed ');await value.moveImage('image','folder');h.render(Component,{});
    assert.equal(value.folders[0].id,'created');assert.equal(value.folders[0].name,'Created');
    assert.equal(value.names.image,'Renamed');assert.equal(value.locations[0].folder_id,'folder');
    failure=true;await assert.rejects(value.renameImage('image','Failed'));await assert.rejects(value.moveImage('image',null));h.render(Component,{});
    assert.equal(value.names.image,'Renamed');assert.equal(value.locations[0].folder_id,'folder');
    assert.ok(calls.every(call=>typeof call==='string' || /^(?:(rename|move)_campaign_gallery_image|save_campaign_gallery_folder)$/.test(call[0])));
  }
});

test('metadata edits retain visibility drafts; authoritative visibility/recipient changes reset access controls only',()=>{
  const org=organization();const h=harness({'@/lib/campaign-handouts/use-organization':{useCampaignGalleryOrganization:()=>org}, '@/utils/supabase/client':{createClient:()=>({})}});
  const Component=h.load('components/campaigns/campaign-handouts-manager.tsx').default;
  const handout={id:'image',displayName:'Image',signedUrl:'/image.webp',category:'handout',visibility:'gm_only',recipientIds:[],storagePath:'stable'};
  const props={campaignId:'campaign',gameSystem:'vtm-v5',currentUserId:'gm',campaignActive:true,initialHandouts:[handout],players:[{id:'player',name:'Player'}]};
  let tree=h.render(Component,props);h.find(tree,'select').props.onChange({target:{value:'all_active_players'}});
  org.names.image='Renamed';tree=h.render(Component,props);assert.equal(h.find(tree,'select').props.value,'all_active_players');
  tree=h.render(Component,{...props,initialHandouts:[{...handout,visibility:'selected_active_players',recipientIds:['player']}]});
  assert.equal(h.find(tree,'select').props.value,'selected_active_players');
  assert.equal(h.nodes(tree).find(n=>n.type==='input' && n.props.type==='checkbox').props.checked,true);
});
