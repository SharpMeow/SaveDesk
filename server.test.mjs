import {test} from 'node:test';import assert from 'node:assert/strict';import {createApp} from './server.mjs';import {createHash} from 'node:crypto';
async function setup(t,fetcher){const server=createApp({clientId:'test-client',clientSecret:'test-secret',appUrl:'http://localhost:4173',fetcher});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const root=`http://127.0.0.1:${server.address().port}`;return (path,opts={})=>fetch(root+path,{redirect:'manual',...opts});}
test('OAuth state, PKCE, private server tokens, paged sync, origin guard, logout',async t=>{
 let challenge;const calls=[];
 const request=await setup(t,async(url,options)=>{calls.push(url);if(url.endsWith('/oauth2/token')){assert.equal(createHash('sha256').update(options.body.get('code_verifier')).digest('base64url'),challenge);assert.equal(options.body.get('redirect_uri'),'http://localhost:4173/auth/callback');return Response.json({access_token:'private-token',expires_in:7200});}assert.equal(options.headers.Authorization,'Bearer private-token');if(url.endsWith('/users/me'))return Response.json({data:{id:'123',username:'tester'}});const parsed=new URL(url);assert.equal(parsed.searchParams.get('pagination_token'),'next-page');return Response.json({data:[{id:'789',text:'Saved text',author_id:'42'}],includes:{users:[{id:'42',username:'writer'}]},meta:{next_token:'page-two'}});});
 const login=await request('/auth/login');const auth=new URL(login.headers.get('location'));assert.equal(auth.origin,'https://x.com');assert.equal(auth.searchParams.get('code_challenge_method'),'S256');assert.equal(auth.searchParams.get('scope'),'tweet.read users.read like.read bookmark.read');challenge=auth.searchParams.get('code_challenge');const oauthCookie=login.headers.get('set-cookie').split(';')[0];
 const callback=await request(`/auth/callback?code=code&state=${auth.searchParams.get('state')}`,{headers:{cookie:oauthCookie}});assert.equal(callback.headers.get('location'),'/?x_connected=1');const cookie=callback.headers.getSetCookie().find(x=>x.startsWith('savedesk_session=')).split(';')[0];assert.ok(!cookie.includes('private-token'));
 const session=await request('/api/session',{headers:{cookie}});assert.deepEqual((await session.json()).user,{id:'123',username:'tester'});
 assert.equal((await request('/api/sync?source=like',{method:'POST',headers:{cookie,origin:'https://evil.example'}})).status,403);
 for(const source of ['like','bookmark']){const response=await request(`/api/sync?source=${source}&cursor=next-page`,{method:'POST',headers:{cookie,origin:'http://localhost:4173'}});const body=await response.json();assert.equal(body.items[0].author,'writer');assert.equal(body.items[0].source,source);assert.equal(body.next,'page-two');}
 const replay=await request(`/auth/callback?code=code&state=${auth.searchParams.get('state')}`,{headers:{cookie:oauthCookie}});assert.equal(replay.headers.get('location'),'/?x_error=state');
 await request('/api/disconnect',{method:'POST',headers:{cookie,origin:'http://localhost:4173'}});assert.equal((await (await request('/api/session',{headers:{cookie}})).json()).connected,false);assert.equal(calls.length,4);
});
test('invalid callbacks never exchange tokens and secrets are not served',async t=>{const request=await setup(t,()=>{throw Error('must not call X');});assert.equal((await request('/auth/callback?code=x&state=wrong')).headers.get('location'),'/?x_error=state');assert.equal((await request('/server.mjs')).status,404);assert.equal((await request('/.env')).status,404);assert.equal((await request('/api/sync?source=like',{method:'POST',headers:{origin:'http://localhost:4173'}})).status,401);});
test('non-ASCII and replayed OAuth states fail closed without upstream requests',async t=>{
 let calls=0;const request=await setup(t,()=>{calls++;throw Error('Unexpected token exchange');});
 const login=await request('/auth/login');const state=new URL(login.headers.get('location')).searchParams.get('state');const cookie=login.headers.get('set-cookie').split(';')[0];
 const bad=await request('/auth/callback?code=x&state='+encodeURIComponent('é'.repeat(state.length)),{headers:{cookie}});
 assert.equal(bad.status,302);assert.equal(bad.headers.get('location'),'/?x_error=state');
 const replay=await request('/auth/callback?code=x&state='+state,{headers:{cookie}});assert.equal(replay.headers.get('location'),'/?x_error=state');assert.equal(calls,0);
});
test('static responses deny framing, restrict executable content, and serve worker modules',async t=>{
 const request=await setup(t,()=>{throw Error('Unexpected upstream');});const response=await request('/');
 assert.equal(response.headers.get('x-frame-options'),'DENY');assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(response.headers.get('content-security-policy'),/script-src 'self'/);
 for(const path of ['/import-client.mjs','/import-worker.mjs'])assert.equal((await request(path)).status,200);
});
test('OAuth entry points only accept GET',async t=>{
 const request=await setup(t,()=>{throw Error('Unexpected upstream');});
 for(const path of ['/auth/login','/auth/callback','/api/session'])for(const method of ['POST','PUT','DELETE','HEAD'])assert.equal((await request(path,{method})).status,405);
});
async function signedIn(request) {
 const login=await request('/auth/login');const state=new URL(login.headers.get('location')).searchParams.get('state');
 const response=await request('/auth/callback?code=fixture&state='+state,{headers:{cookie:login.headers.get('set-cookie').split(';')[0]}});
 return response.headers.getSetCookie().find(x=>x.startsWith('savedesk_session=')).split(';')[0];
}
const tokenOrUser=(url,expires_in=7200)=>url.endsWith('/oauth2/token')?Response.json({access_token:'SECRET_FIXTURE',expires_in}):url.endsWith('/users/me')?Response.json({data:{id:'123',username:'fixture'}}):null;
test('path traversal, method confusion and forged sessions cannot read secrets or call X',async t=>{
 let calls=0;const request=await setup(t,()=>{calls++;throw Error('SECRET_FIXTURE');});
 for(const path of ['/.env','/.git/config','/server.mjs','/server.test.mjs','/%2e%2e%2f.env','/vendor/../../.env','/constructor','/__proto__','//evil.example/.env','/%00'])assert.equal((await request(path)).status,404);
 for(const origin of [undefined,'null','https://evil.example','http://localhost:4173.evil.example']){
  const headers={cookie:'savedesk_session=forged'};if(origin)headers.origin=origin;
  assert.equal((await request('/api/sync?source=like',{method:'POST',headers})).status,403);
 }
 assert.equal((await request('/api/sync?source=like',{method:'POST',headers:{cookie:'savedesk_session=forged',origin:'http://localhost:4173'}})).status,401);
 assert.equal((await request('/api/disconnect')).status,405);assert.equal(calls,0);
});
test('upstream errors are sanitized; cursors and sources cannot redirect upstream calls',async t=>{
 let status=429,syncCalls=0;
 const request=await setup(t,async url=>{const auth=tokenOrUser(url);if(auth)return auth;syncCalls++;const parsed=new URL(url);assert.equal(parsed.origin,'https://api.x.com');assert.equal(parsed.pathname,'/2/users/123/bookmarks');assert.equal(parsed.searchParams.get('pagination_token'),'https://evil.example/?token=1');assert.equal(parsed.searchParams.get('post.fields'),'created_at,note_post');return new Response('SECRET_FIXTURE upstream debug',{status});});
 const cookie=await signedIn(request);const headers={cookie,origin:'http://localhost:4173'};
 for(const code of [401,402,403,429,500]){status=code;const response=await request('/api/sync?source=bookmark&cursor='+encodeURIComponent('https://evil.example/?token=1'),{method:'POST',headers});assert.equal(response.status,code===500?502:code);assert.ok(!(await response.text()).includes('SECRET_FIXTURE'));}
 assert.equal((await request('/api/sync?source=https://evil.example',{method:'POST',headers})).status,400);
 assert.equal((await request('/api/sync?source=like&cursor='+'a'.repeat(2049),{method:'POST',headers})).status,400);assert.equal(syncCalls,5);
});
test('only one upstream sync per session can run at a time',async t=>{
 let release,started;const ready=new Promise(r=>started=r);
 const request=await setup(t,async url=>{const auth=tokenOrUser(url);if(auth)return auth;started();return new Promise(r=>release=()=>r(Response.json({data:[]})));});
 const cookie=await signedIn(request);const options={method:'POST',headers:{cookie,origin:'http://localhost:4173'}};
 const first=request('/api/sync?source=like',options);await ready;
 assert.equal((await request('/api/sync?source=like',options)).status,409);release();assert.equal((await first).status,200);
});
test('expired sessions and invalid provider lifetimes never become long-lived logins',async t=>{
 let clock=Date.now();t.mock.method(Date,'now',()=>clock);
 const request=await setup(t,async url=>tokenOrUser(url,1));const cookie=await signedIn(request);clock+=1001;
 assert.equal((await (await request('/api/session',{headers:{cookie}})).json()).connected,false);
 for(const lifetime of [0,-1,'invalid']){
  const denied=await setup(t,async url=>tokenOrUser(url,lifetime));const login=await denied('/auth/login');const state=new URL(login.headers.get('location')).searchParams.get('state');
  const callback=await denied('/auth/callback?code=fixture&state='+state,{headers:{cookie:login.headers.get('set-cookie').split(';')[0]}});assert.equal(callback.headers.get('location'),'/?x_error=token');
 }
});
test('abandoned sign-ins have a bounded capacity and expire',async t=>{
 let clock=Date.now();t.mock.method(Date,'now',()=>clock);const request=await setup(t,()=>{throw Error('Unexpected upstream');});
 for(let i=0;i<256;i++)assert.equal((await request('/auth/login')).status,302);
 assert.equal((await request('/auth/login')).status,429);clock+=600001;assert.equal((await request('/auth/login')).status,302);
});
