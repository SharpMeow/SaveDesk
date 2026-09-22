import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseImport,mergeItems} from './model.mjs';
import {buildSharedPage,matchesSearch} from './library.mjs';
import {readSavesFile} from './importing.mjs';
// Reproducible mutations: no network, real accounts, or user data.
let seed=0x5a7ed;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;}
const pick=a=>a[random()%a.length];
test('2,000 malformed record mutations either normalize safely or fail explicitly',()=>{
 const values=[null,false,0,1,-1,1.5,1e100,'',[],{}, {toString:null},'__proto__','javascript:alert(1)','</script><svg onload=alert(1)>'];
 for(let i=0;i<2000;i++){
  const input=Object.fromEntries(['id','text','author','tags','sources','read','url','like','bookmark'].map(key=>[key,pick(values)]));
  input.id=i%3?'123':pick(values);
  let items;try{items=parseImport(JSON.stringify([input]));}catch(error){assert.ok(error instanceof Error);assert.ok(error.message);continue;}
  for(const item of items){assert.match(item.id,/^[1-9]\d{0,19}$/);assert.equal(item.url,`https://x.com/i/status/${item.id}`);assert.equal(typeof item.text,'string');assert.ok(item.sources.every(x=>['like','bookmark'].includes(x)));}
  assert.equal({}.polluted,undefined);
 }
});
test('500 randomized merge and backup round trips preserve IDs, topics, read state and sources',()=>{
 for(let i=0;i<500;i++){
  const raw={id:String(1000000000000000000n+BigInt(i)),text:pick(['A useful idea','<svg/onload=alert(1)>','Quotes " & < > \u2028']),author:'author'+i,tags:['topic'+random()%10],read:!!(i%2),source:'like'};
  const original=parseImport(JSON.stringify([raw]));const before=JSON.stringify(original);
  const second=parseImport(JSON.stringify([{id:raw.id,source:'bookmark',tags:['another']}]),'bookmark');
  const merged=mergeItems(original,second);assert.equal(JSON.stringify(original),before);assert.equal(merged[0].text,raw.text);assert.equal(merged[0].id,raw.id);assert.equal(merged[0].read,raw.read);assert.deepEqual(merged[0].sources,['like','bookmark']);
  assert.deepEqual(parseImport(JSON.stringify({items:merged})),merged);assert.deepEqual(mergeItems(merged,second),merged);assert.equal(matchesSearch(merged[0],'#another'),true);
  const html=buildSharedPage(merged);assert.ok(!html.includes('<svg/onload'));assert.equal((html.match(/<script>/g)||[]).length,1);
 }
});
test('200 random malformed ZIPs fail without importing anything',async()=>{
 for(let i=0;i<200;i++){
  const bytes=Uint8Array.from({length:24+random()%1024},()=>random()&255);
  await assert.rejects(readSavesFile({name:'chaos.zip',size:bytes.length,arrayBuffer:async()=>bytes.buffer}),/ZIP/);
 }
});
