import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openCloud} from './cloud.mjs';
import {parseImport} from './model.mjs';

const record=(id,text='Saved idea')=>parseImport(JSON.stringify([{id,text}]))[0];
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
async function harness(t) {
  let callback,local=[],identity=null,storageFull=false;
  const storage=new Map(),writes=[],reads=[],statuses=[],oauth=[];
  let read=async()=>({data:{items:[],revision:0}}),write=async()=>({data:{saved:true,revision:1}});
  const clientFactory=(_url,_key,options)=>options.accessToken?{
    from:()=>({select:()=>({eq:(_column,id)=>({maybeSingle:async()=>{
      const token=await options.accessToken();reads.push({id,token});return read(id,token);
    }})})}),
    rpc:async(_name,args)=>{const token=await options.accessToken();writes.push({token,...args});return write(args,token);},
  }:{auth:{
    onAuthStateChange:fn=>{callback=fn;return {data:{subscription:{unsubscribe(){}}}};},
    getSession:async()=>({data:{session:null}}),
    signInWithOAuth:async args=>{oauth.push(args);return {};},
    signOut:async()=>{callback('SIGNED_OUT',null);return {};},
  }};
  const cloud=await openCloud({clientFactory,events:new EventTarget(),pageUrl:'https://example.test/SaveDesk/?code=private',
    storage:{getItem:key=>storage.get(key),setItem:(key,value)=>{if(storageFull)throw Error('Quota exceeded');storage.set(key,value);}},
    request:async()=>new Response(JSON.stringify({url:'https://project.supabase.co',publishableKey:'sb_publishable_test',providers:['google','github','azure','apple']})),
    readLocal:()=>local,onLibrary:value=>{local=value;},onAccount:user=>{identity=user?.id;},onStatus:text=>statuses.push(text),
  });
  t.after(()=>cloud.dispose());
  return {cloud,writes,reads,statuses,oauth,storage,
    fillStorage:()=>{storageFull=true;},
    login:id=>callback('SIGNED_IN',{user:{id},access_token:`token-${id}`}),
    refresh:token=>callback('TOKEN_REFRESHED',{user:{id:identity},access_token:token}),
    setRead:fn=>{read=fn;},setWrite:fn=>{write=fn;},
    get local(){return local;},set local(value){local=value;},
  };
}

test('account changes discard delayed reads and never write another account’s data',async t=>{
  const h=await harness(t),pending=deferred();
  h.login('alice');h.local=[record('1','Alice private save')];h.cloud.changed();
  h.setRead(()=>pending.promise);const syncing=h.cloud.sync();
  h.login('bob');assert.deepEqual(h.local,[]);
  pending.resolve({data:{items:[],revision:0}});await syncing;
  assert.equal(h.writes.length,0);assert.deepEqual(h.local,[]);
  assert.match(h.storage.get('savedesk-account-alice'),/Alice private save/);
});

test('a pending write stays bound to its original token and cannot replace the next library',async t=>{
  const h=await harness(t),pending=deferred(),entered=deferred();
  h.login('alice');h.local=[record('1','Alice only')];
  h.setWrite(async(args,token)=>{entered.resolve(token);await pending.promise;return {data:{saved:true,revision:1}};});
  const syncing=h.cloud.sync();assert.equal(await entered.promise,'token-alice');
  h.login('bob');h.local=[record('2','Bob only')];pending.resolve();await syncing;
  assert.equal(h.writes[0].token,'token-alice');assert.equal(h.local[0].text,'Bob only');
});

test('edits made during sync survive the response and are cached for a later retry',async t=>{
  const h=await harness(t),pending=deferred(),entered=deferred();
  h.login('alice');h.local=[record('1')];
  h.setWrite(async()=>{entered.resolve();await pending.promise;return {data:{saved:true,revision:1}};});
  const syncing=h.cloud.sync();await entered.promise;
  h.local[0].read=true;h.local[0].tags=['New topic'];h.cloud.changed();
  pending.resolve();await syncing;
  assert.equal(h.local[0].read,true);assert.deepEqual(h.local[0].tags,['New topic']);
  const cached=JSON.parse(h.storage.get('savedesk-account-alice'));
  assert.equal(cached.items[0].read,true);assert.equal(cached.base[0].read,false);
});

test('network failures preserve local edits and account caches remain separate',async t=>{
  const h=await harness(t);h.login('alice');h.local=[record('1')];h.cloud.changed();
  h.setRead(async()=>({error:Error('offline')}));await h.cloud.sync();
  assert.equal(h.local.length,1);assert.match(h.statuses.at(-1),/Could not sync/);
  h.login('bob');assert.deepEqual(h.local,[]);h.local=[record('2')];h.cloud.changed();
  h.login('alice');assert.equal(h.local[0].id,'1');
  await h.cloud.signOut();assert.match(h.statuses.at(-1),/Signed out/);
});

test('provider redirects preserve the project path and exclude callback parameters',async t=>{
  const h=await harness(t);
  for(const provider of ['google','github','azure','apple'])await h.cloud.signIn(provider);
  assert.equal(h.oauth.length,4);
  for(const request of h.oauth)assert.equal(request.options.redirectTo,'https://example.test/SaveDesk/');
  assert.equal(h.oauth[2].options.scopes,'email');
  await assert.rejects(h.cloud.signIn('unknown'),/not enabled/);
  h.login('alice');h.refresh('renewed-alice');await h.cloud.sync();
  assert.equal(h.reads.at(-1).token,'renewed-alice');
});

test('storage failure never reports unsaved edits as saved on this device',async t=>{
  const h=await harness(t);h.login('alice');h.fillStorage();h.local=[record('1')];h.cloud.changed();
  assert.match(h.statuses.at(-1),/storage is unavailable or full/);
  assert.equal(h.storage.has('savedesk-account-alice'),false);
});
