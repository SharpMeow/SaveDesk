import {test} from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from './vendor/fflate.mjs';
import {readSavesFile} from './importing.mjs';
const file=(name,data)=>({name,size:data.length,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),text:async()=>new TextDecoder().decode(data)});
const archive=id=>strToU8(`window.YTD.like.part0 = [{"like":{"tweetId":"${id}","fullText":"Synthetic archive save"}}];`);
test('ZIP imports only likes parts and ignores private or unrelated files',async()=>{
 const bytes=zipSync({'archive/data/like.js':archive('123'),'archive/data/like-part1.js':archive('456'),'archive/data/direct-messages.js':strToU8('not valid JSON'),'archive/data/profile.js':strToU8('private profile data')});
 const result=await readSavesFile(file('archive.zip',bytes));
 assert.deepEqual(result.items.map(x=>x.id),['123','456']);assert.equal(result.files,2);
});
test('bad ZIP and missing likes have actionable errors',async()=>{
 await assert.rejects(readSavesFile(file('archive.zip',strToU8('bad zip'))),/Unzip it on your device/);
 await assert.rejects(readSavesFile(file('archive.zip',zipSync({'data/bookmarks.js':strToU8('[]')}))),/No likes file/);
});
test('size limits are applied before reading the file',async()=>{
 await assert.rejects(readSavesFile({name:'archive.zip',size:201*1024*1024}),/larger than 200 MB/);
 await assert.rejects(readSavesFile({name:'likes.json',size:51*1024*1024}),/larger than 50 MB/);
});
test('non-ZIP input uses source selection and explains malformed JSON',async()=>{
 const result=await readSavesFile(file('bookmarks.json',strToU8('[{"id":"789","text":"Synthetic bookmark"}]')),'bookmark');
 assert.deepEqual(result.items[0].sources,['bookmark']);
 await assert.rejects(readSavesFile(file('broken.json',strToU8('not json'))),/We could not read this file/);
});
