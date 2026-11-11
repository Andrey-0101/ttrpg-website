import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { renderToStaticMarkup } from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';
import { createTranslator } from 'next-intl';
import { transpileModule, ModuleKind, JsxEmit } from 'typescript';

function load(file, dependencies) {
  const exports={};
  runInNewContext(transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ModuleKind.CommonJS,jsx:JsxEmit.ReactJSX}}).outputText,{
    exports,require(name){if(name in dependencies)return dependencies[name];assert.fail(`Unexpected dependency: ${name}`);},
    window:dependencies.window,console:{error(){throw Error('Unexpected console error');}},
  });
  return exports;
}
function nodes(tree){return tree==null?[]:Array.isArray(tree)?tree.flatMap(nodes):typeof tree==='object'?[tree,...nodes(tree.props?.children)]:[];}
function panel(locale='en'){
  const messages=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
  const states=[];let index=0;const operations=[],confirms=[];
  const chain={delete(){operations.push('delete');return this;},eq(key,value){operations.push([key,value]);return this;},
    then(resolve){return Promise.resolve({error:null}).then(resolve);}};
  const Component=load('components/campaigns/campaign-members-panel.tsx',{
    react:{useState(initial){const slot=index++;if(!(slot in states))states[slot]=initial;
      return[states[slot],value=>states[slot]=typeof value==='function'?value(states[slot]):value];},
      useRef(initial){return states[index++]??={current:initial};},useMemo(fn){return fn();}},
    'react/jsx-runtime':jsxRuntime,
    'next-intl':{useTranslations:namespace=>createTranslator({locale,messages,namespace})},
    '@/lib/game-systems/use-campaign-role':{useCampaignGameMasterRole:()=>({role:locale==='ru'?'Хранитель':'Keeper'})},
    '@/i18n/navigation':{useRouter:()=>({refresh(){operations.push('refresh');},replace(path){operations.push(['replace',path]);}})},
    '@/utils/supabase/client':{createClient:()=>({from(table){operations.push(table);return chain;}})},
    window:{confirm(message){confirms.push(message);return true;}},
  }).default;
  const props={gameSystem:'call-of-cthulhu-7e',campaignId:'campaign',campaignStatus:'active',currentUserId:'gm',gameMasterName:locale==='ru'?'Вы':'You',isGameMaster:true,locale,loadError:false,
    characterNamesByUserId:new Map([['alice','Иван Петров']]),
    initialMembers:[{userId:'alice',label:'Alice Иван',joinedAt:'2026-11-01T12:00:00Z'},
      {userId:'bob',label:'bob.account@example.test',joinedAt:'2026-11-02T12:00:00Z'}]};
  return{props,operations,confirms,render(overrides={}){index=0;return Component({...props,...overrides});},
    button(tree,name){const button=nodes(tree).find(node=>node.type==='button' && node.props['aria-label']===name);assert.ok(button,`Missing button: ${name}`);return button;}};
}

for(const locale of ['en','ru'])test(`Overview labels identify all Players and preserve GM, roles, dates and named Remove controls (${locale})`,()=>{
  const p=panel(locale),tree=p.render(),html=renderToStaticMarkup(tree);
  assert.ok(html.includes('Alice Иван'));assert.ok(html.includes('bob.account@example.test'));
  assert.ok(html.indexOf('Alice Иван')<html.indexOf('bob.account@example.test'));
  const lines=nodes(tree).filter(node=>node.type==='p').map(node=>node.props.children);
  const firstPlayer=lines.indexOf('Alice Иван');
  const secondPlayer=lines.indexOf('bob.account@example.test');
  assert.equal(lines[firstPlayer+1],'Иван Петров');
  assert.equal(lines[secondPlayer+1],locale==='ru'?'Игрок':'Player');
  assert.ok(html.includes(locale==='ru'?'Хранитель':'Keeper'));assert.ok(html.includes(p.props.gameMasterName));
  const date=new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(p.props.initialMembers[0].joinedAt));
  assert.ok(html.includes(date));assert.doesNotMatch(html,/aka|Campaign Player|Игрок кампании/);
  const prefix=locale==='ru'?'Удалить':'Remove',suffix=locale==='ru'?'из кампании':'from campaign';
  p.button(tree,`${prefix} Alice Иван ${suffix}`);p.button(tree,`${prefix} bob.account@example.test ${suffix}`);
  const own=p.render({currentUserId:'bob',isGameMaster:false});
  assert.ok(renderToStaticMarkup(own).includes('bob.account@example.test'));
  assert.equal(nodes(own).filter(n=>n.type==='button' && /^(Remove |Удалить )/.test(n.props['aria-label']??'')).length,0);
  p.button(own,locale==='ru'?'Покинуть кампанию':'Leave campaign');
  const completed=p.render({campaignStatus:'completed'});
  assert.equal(nodes(completed).filter(n=>n.type==='button').length,0);
});

test('refreshed assignments replace the second line by participant ID without changing player labels',()=>{
  const p=panel();
  assert.match(renderToStaticMarkup(p.render()),/Иван Петров/u);
  const tree=p.render({characterNamesByUserId:new Map([['bob','Mary Shelley']])});
  const lines=nodes(tree).filter(node=>node.type==='p').map(node=>node.props.children);
  assert.equal(lines[lines.indexOf('Alice Иван')+1],'Player');
  assert.equal(lines[lines.indexOf('bob.account@example.test')+1],'Mary Shelley');
  assert.ok(!lines.includes('Иван Петров'));
});

test('fresh roster props update labels without retaining initial names or modifying genuine chosen text',()=>{
  const p=panel();p.render();
  const fresh=p.props.initialMembers.map(member=>({...member,label:member.userId==='alice'?'Campaign Player':member.label}));
  const html=renderToStaticMarkup(p.render({initialMembers:fresh}));
  assert.ok(html.includes('Campaign Player'));assert.ok(!html.includes('Alice Иван'));
  const unsafe=[{...fresh[0],label:'<script>alert(1)</script>& person@example.test'}];
  const escaped=renderToStaticMarkup(p.render({initialMembers:unsafe}));
  assert.ok(escaped.includes('&lt;script&gt;'));assert.ok(!escaped.includes('<script>'));
});

test('Remove retains its campaign/user targeting, uses the resolved label and does not hide a later rejoin',async()=>{
  const p=panel();let tree=p.render();await p.button(tree,'Remove Alice Иван from campaign').props.onClick();
  assert.deepEqual(p.confirms,['Remove Alice Иван from this campaign? Their active character links will also be closed.']);
  assert.deepEqual(p.operations,['campaign_members','delete',['campaign_id','campaign'],['user_id','alice'],'refresh']);
  tree=p.render();assert.ok(!renderToStaticMarkup(tree).includes('Alice Иван'));
  const rejoined=p.props.initialMembers.map(member=>({...member,joinedAt:'2026-11-03T12:00:00Z'}));
  assert.ok(renderToStaticMarkup(p.render({initialMembers:rejoined})).includes('Alice Иван'));
});

test('server roster loader calls only the scoped RPC on every load and drops unexpected Auth fields',async()=>{
  const calls=[];let label='Alice';let error=null;
  const {loadCampaignOverviewRoster:loadRoster}=load('lib/campaigns/roster.server.ts',{'server-only':{}});
  const options={campaignId:'one-campaign',supabase:{async rpc(name,args){calls.push([name,args]);return{data:[{
    participant_id:'member',display_label:label,joined_at:'2026-11-01T12:00:00Z',email:'not-returned@example.test',token:'not-returned'}],error};}}};
  for(const next of ['Alice','current-account@example.test']){label=next;const result=await loadRoster(options);
    assert.equal(result.ready,true);assert.equal(result.members[0].label,next);
    assert.deepEqual(Object.keys(result.members[0]).sort(),['joinedAt','label','userId']);
    assert.doesNotMatch(JSON.stringify(result),/not-returned/);}
  assert.equal(calls.length,2);for(const [name,args] of calls){assert.equal(name,'get_campaign_roster_players');assert.equal(args.target_campaign_id,'one-campaign');}
  error={message:'forbidden private account details'};
  assert.equal((await loadRoster(options)).ready,false);
  error=null;label=' \t';const unavailable=await loadRoster(options);
  assert.equal(unavailable.ready,false);assert.equal(unavailable.members.length,0);
});

test('roster errors remain explicit and do not invent labels or IDs',()=>{
  const p=panel(),html=renderToStaticMarkup(p.render({loadError:true,initialMembers:[]}));
  assert.ok(html.includes('role="alert"'));assert.ok(html.includes('Unable to load the Player list.'));
  assert.doesNotMatch(html,/Campaign Player|alice|bob\.account/);
});

test('video labels keep their viewer-local Incognito/character fallbacks and never consume roster email',()=>{
  const {resolveCampaignVideoParticipantLabel:label}=load('lib/campaign-video/participant-label.ts',{});
  for(const locale of ['en','ru']){
    const dictionary=JSON.parse(readFileSync(`messages/${locale}.json`,'utf8'));
    const result=label({role:'player',profileName:null,characterName:' ',email:'roster-fallback@example.test',labels:{...dictionary.CampaignVideoRoom.labels,gameMasterRole:'Keeper'}});
    assert.equal(result,locale==='ru'?'Инкогнито aka Странный незнакомец':'Incognito aka Strange stranger');
    assert.ok(!result.includes('@'));
  }
  for(const file of ['lib/campaign-video/participant-directory.server.ts','components/campaigns/campaign-video-room.tsx','app/api/campaigns/[campaignId]/participant-directory/route.ts']){
    assert.doesNotMatch(readFileSync(file,'utf8'),/get_campaign_roster_players|roster\.server|auth\.users/);
  }
});
