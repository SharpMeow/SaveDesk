import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseImport} from './model.mjs';
import {reconcileLibrary,syncSnapshot} from './sync.mjs';
import {validateCloudConfig} from './cloud.mjs';
const item=(patch={})=>parseImport(JSON.stringify([{id:'123',text:'A save',tags:['Original'],read:true,...patch}]))[0];
test('cross-device merge preserves independent edits, unread changes, and removed topics',()=>{
 const base=[item()],local=[item({read:false,tags:['Local']})],remote=[item({text:'Updated remotely',tags:['Original','Remote']})];
 const [merged]=reconcileLibrary(base,local,remote);
 assert.equal(merged.read,false);assert.equal(merged.text,'Updated remotely');assert.deepEqual(merged.tags,['Local','Remote']);assert.deepEqual(base,[item()]);
});
test('new saves from both devices survive concurrent first sync',()=>{
 const [a,b]=reconcileLibrary([], [item({id:'1'})], [item({id:'2'})]);assert.deepEqual([a.id,b.id],['2','1']);
});
test('stale revisions retry with new remote content instead of overwriting it',async()=>{
 let calls=0;const result=await syncSnapshot({base:[item()],local:[item({read:false})],read:async()=>({revision:1,items:[item()]}),write:async(revision,items)=>{
  calls++;if(calls===1)return {saved:false,revision:2,items:[item({tags:['Original','Other device']})]};
  assert.equal(revision,2);assert.deepEqual(items[0].tags,['Original','Other device']);assert.equal(items[0].read,false);return {saved:true,revision:3};
 }});assert.equal(result.revision,3);assert.equal(calls,2);
});
test('unchanged libraries avoid writes; continuous conflicts stop after bounded retries',async()=>{
 let writes=0;await syncSnapshot({base:[item()],local:[item()],read:async()=>({revision:1,items:[item()]}),write:()=>{writes++;}});assert.equal(writes,0);
 await assert.rejects(syncSnapshot({base:[item()],local:[item({read:false})],read:async()=>({revision:1,items:[item()]}),write:async()=>{writes++;return {saved:false,revision:2,items:[item()]};}}),/Try syncing again/);assert.equal(writes,3);
});
test('public configuration rejects secret keys and untrusted destinations',()=>{
 assert.equal(validateCloudConfig({url:'',publishableKey:''}),null);
 const good={url:'https://example.supabase.co',publishableKey:'sb_publishable_example',providers:['google','github','azure','apple']};assert.deepEqual(validateCloudConfig(good).providers,good.providers);
 for(const url of ['javascript:alert(1)','https://supabase.co.evil.test','https://user:pass@example.supabase.co','https://example.supabase.co/extra'])assert.throws(()=>validateCloudConfig({...good,url}));
 for(const publishableKey of ['sb_secret_secret','x.'+btoa(JSON.stringify({role:'service_role'}))+'.x'])assert.throws(()=>validateCloudConfig({...good,publishableKey}),/public publishable/);
});
