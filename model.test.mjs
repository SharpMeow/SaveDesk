import {test} from 'node:test';import assert from 'node:assert/strict';import {parseImport,mergeItems} from './model.mjs';
test('reads X archive assignment without executing JavaScript',()=>{const [x]=parseImport('window.YTD.like.part0 = [{"like":{"tweetId":"1234567890123456789","fullText":"hello <script>"}}];');assert.equal(x.id,'1234567890123456789');assert.equal(x.text,'hello <script>');assert.deepEqual(x.sources,['like']);assert.throws(()=>parseImport('alert(1)'));});
test('merges likes and bookmarks, preserving user organization',()=>{const a=parseImport('[{"id":"1","text":"a","tags":["Code"],"read":true}]');const b=parseImport('[{"id":"1","text":"a","source":"bookmark"}]');const c=mergeItems(a,b);assert.equal(c.length,1);assert.deepEqual(c[0].sources,['like','bookmark']);assert.deepEqual(c[0].tags,['Code']);assert.equal(c[0].read,true);assert.deepEqual(parseImport(JSON.stringify({items:c})),c);});
test('rejects unsupported records and keeps import atomic',()=>{assert.throws(()=>parseImport('[{"url":"javascript:alert(1)"}]'));assert.throws(()=>parseImport('{}'));assert.throws(()=>parseImport('not json'));});
test('rejects imprecise numeric IDs rather than linking to a different post',()=>{
 assert.throws(()=>parseImport('[{"id":1234567890123456789,"text":"keep exact"}]'),/quoted strings/);
 assert.equal(parseImport('[{"id":"1234567890123456789"}]')[0].id,'1234567890123456789');
});
test('malformed structures have useful errors and cannot modify prototypes',()=>{
 assert.throws(()=>parseImport('null'),/Expected a JSON array/);
 assert.throws(()=>parseImport('[{"id":"1","text":{"toString":null}}]'),/text must be a string/);
 const [item]=parseImport('[{"id":"1","url":"javascript:alert(1)","__proto__":{"polluted":true}}]');
 assert.equal(item.url,'https://x.com/i/status/1');assert.equal({}.polluted,undefined);
});
test('duplicate and padded IDs normalize to one save, preserving both sources',()=>{
 const items=parseImport('[{"id":"000123","source":"like","tags":["A"]},{"id":"123","source":"bookmark","read":true}]');
 assert.equal(items.length,1);assert.equal(items[0].id,'123');assert.deepEqual(items[0].sources,['like','bookmark']);assert.equal(items[0].read,true);assert.deepEqual(items[0].tags,['A']);
});
test('oversized fields and excessive records are rejected before rendering',()=>{
 for(const fields of [{text:'a'.repeat(100001)},{author:'a'.repeat(501)},{tags:['a'.repeat(201)]},{tags:Array(101).fill('topic')}])assert.throws(()=>parseImport(JSON.stringify([{id:'1',...fields}])) ,/limit/);
 assert.throws(()=>parseImport(JSON.stringify(Array(100001).fill({id:'1'}))),/100,000/);
});
