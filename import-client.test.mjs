import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileInWorker} from './import-client.mjs';
function workerFixture(action) {
  const worker = {terminated:0,postMessage(data) { action?.(worker, data); },terminate() { this.terminated++; }};
  return worker;
}
test('worker returns a complete import and is cleaned up',async()=>{
 const expected={items:[{id:'123'}],files:1};
 const worker=workerFixture((w,data)=>{assert.equal(data.source,'bookmark');queueMicrotask(()=>w.onmessage({data:{result:expected}}));});
 assert.deepEqual(await readFileInWorker({},'bookmark',{createWorker:()=>worker}),expected);
 assert.equal(worker.terminated,1);assert.equal(worker.onmessage,null);
});
test('failed imports terminate their worker without returning partial data',async()=>{
 const worker=workerFixture(w=>queueMicrotask(()=>w.onmessage({data:{error:'Invalid ZIP'}})));
 await assert.rejects(readFileInWorker({},'like',{createWorker:()=>worker}),/Invalid ZIP/);assert.equal(worker.terminated,1);
});
test('a stuck archive is terminated at the deadline',async()=>{
 const worker=workerFixture();
 await assert.rejects(readFileInWorker({},'like',{createWorker:()=>worker,timeoutMs:10}),/too long/);assert.equal(worker.terminated,1);
});
test('worker crashes, serialization failures, and unsupported browsers have useful errors',async()=>{
 for(const event of ['onerror','onmessageerror']){
  const worker=workerFixture(w=>queueMicrotask(()=>w[event]({preventDefault(){}})));
  await assert.rejects(readFileInWorker({},'like',{createWorker:()=>worker}),/could not/);assert.equal(worker.terminated,1);
 }
 const worker=workerFixture(()=>{throw Error('DataCloneError');});
 await assert.rejects(readFileInWorker({},'like',{createWorker:()=>worker}),/could not start/);assert.equal(worker.terminated,1);
 await assert.rejects(readFileInWorker({},'like',{createWorker:()=>{throw Error('Unavailable');}}),/updated browser/);
});
import {Worker as NodeWorker} from 'node:worker_threads';
import {zipSync,strToU8} from './vendor/fflate.mjs';
function adaptWorker(thread, encode=data=>data) {
  const adapter={postMessage:data=>thread.postMessage(encode(data)),terminate:()=>thread.terminate()};
  thread.on('message',data=>adapter.onmessage?.({data}));thread.on('error',()=>adapter.onerror?.({}));
  return adapter;
}
test('the real import worker parses ZIPs and reports malformed JSON across its message boundary',async()=>{
 const url=new URL('./import-worker.mjs',import.meta.url).href;
 const createWorker=()=>adaptWorker(new NodeWorker(`
   const {parentPort}=require('node:worker_threads');
   const {File}=require('node:buffer');
   globalThis.self={postMessage:data=>parentPort.postMessage(data)};
   import(${JSON.stringify(url)}).then(()=>parentPort.on('message',({file,source})=>self.onmessage({data:{file:new File([file.bytes],file.name),source}})));
 `,{eval:true}));
 const bytes=zipSync({'data/like.js':strToU8('window.YTD.like.part0 = [{"like":{"tweetId":"1234567890123456789","fullText":"Worker ZIP test"}}];')});
 const result=await readFileInWorker({name:'archive.zip',bytes},'like',{createWorker});
 assert.equal(result.items[0].id,'1234567890123456789');assert.equal(result.files,1);
 await assert.rejects(readFileInWorker({name:'invalid.json',bytes:strToU8('bad JSON')},'like',{createWorker}),/We could not read this file/);
});
test('deadline terminates an actual worker stuck in a CPU loop',async()=>{
 const thread=new NodeWorker('while (true) {}',{eval:true});
 const exited=new Promise(resolve=>thread.once('exit',resolve));
 await assert.rejects(readFileInWorker({},'like',{createWorker:()=>adaptWorker(thread),timeoutMs:30}),/too long/);
 await exited;
});
