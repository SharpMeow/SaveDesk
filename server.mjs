import http from 'node:http';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('./',import.meta.url);
const scopes='tweet.read users.read like.read bookmark.read';
const nonce=()=>randomBytes(32).toString('base64url');
export function createApp({clientId=process.env.X_CLIENT_ID,clientSecret=process.env.X_CLIENT_SECRET,appUrl=process.env.APP_URL||'http://localhost:4173',fetcher=fetch}={}){
 const base=new URL(appUrl),sessions=new Map(),pending=new Map();
 const redirectUri=new URL('/auth/callback',base).href;
 const cookie=(name,value,age)=>`${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${base.protocol==='https:'?'; Secure':''}`;
 const files={'/':['index.html','text/html'],'/index.html':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/model.mjs':['model.mjs','text/javascript'],'/collection.json':['collection.json','application/json'],'/style.css':['style.css','text/css'],'/library.mjs':['library.mjs','text/javascript'],'/importing.mjs':['importing.mjs','text/javascript'],'/vendor/fflate.mjs':['vendor/fflate.mjs','text/javascript']};
 const getCookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')));
 const send=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
 const redirect=(res,path)=>{res.writeHead(302,{Location:path,'Cache-Control':'no-store'});res.end();};
 const api=async(path,token)=>{const response=await fetcher(`https://api.x.com/2/${path}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)});if(!response.ok){const e=new Error(response.status===429?'X rate limit reached. Wait and retry.':response.status===401?'X session expired. Connect again.':response.status===402?'X API credits are required for this request.':response.status===403?'X denied access. Check developer access and app permissions.':'X request failed. Retry later.');e.status=response.status;throw e;}return response.json();};
 return http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 for(const [id,s] of sessions)if(s.expires<Date.now())sessions.delete(id);
 for(const [id,s] of pending)if(s.expires<Date.now())pending.delete(id);
 try{
 const url=new URL(req.url,base),cookies=getCookies(req),session=sessions.get(cookies.savedesk_session);
 if(url.pathname==='/api/session')return send(res,200,{configured:!!clientId,connected:!!session,user:session?.user});
 if(url.pathname==='/auth/login'){
 if(!clientId)return redirect(res,'/?x_error=setup');
 const state=nonce(),verifier=nonce(),sid=nonce();
 pending.set(sid,{state,verifier,expires:Date.now()+600000});
 res.setHeader('Set-Cookie',cookie('savedesk_oauth',sid,600));
 const auth=new URL('https://x.com/i/oauth2/authorize');auth.search=new URLSearchParams({response_type:'code',client_id:clientId,redirect_uri:redirectUri,scope:scopes,state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();return redirect(res,auth.href);
 }
 if(url.pathname==='/auth/callback'){
 const p=pending.get(cookies.savedesk_oauth);pending.delete(cookies.savedesk_oauth);res.setHeader('Set-Cookie',cookie('savedesk_oauth','',0));
 const state=url.searchParams.get('state')||'';
 if(!p||state.length!==p.state.length||!timingSafeEqual(Buffer.from(state),Buffer.from(p.state)))return redirect(res,'/?x_error=state');
 if(url.searchParams.has('error'))return redirect(res,'/?x_error=denied');
 const code=url.searchParams.get('code');if(!code)return redirect(res,'/?x_error=code');
 const headers={'Content-Type':'application/x-www-form-urlencoded'};
 if(clientSecret)headers.Authorization=`Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
 const response=await fetcher('https://api.x.com/2/oauth2/token',{method:'POST',headers,body:new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:redirectUri,client_id:clientId,code_verifier:p.verifier}),signal:AbortSignal.timeout(20000)});
 if(!response.ok)return redirect(res,'/?x_error=token');
 const token=await response.json();if(!token.access_token)return redirect(res,'/?x_error=token');
 const me=await api('users/me',token.access_token);if(!me.data?.id)throw Error('X did not return your account.');
 const sid=nonce(),seconds=Math.min(Number(token.expires_in)||7200,7200);sessions.delete(cookies.savedesk_session);sessions.set(sid,{token:token.access_token,user:me.data,expires:Date.now()+seconds*1000});res.setHeader('Set-Cookie',[cookie('savedesk_oauth','',0),cookie('savedesk_session',sid,seconds)]);return redirect(res,'/?x_connected=1');
 }
 if(url.pathname==='/api/disconnect'||url.pathname==='/api/sync'){
 if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
 if(req.headers.origin!==base.origin)return send(res,403,{error:'Invalid request origin.'});
 if(!session)return send(res,401,{error:'Connect your X account first.'});
 if(url.pathname==='/api/disconnect'){sessions.delete(cookies.savedesk_session);res.setHeader('Set-Cookie',cookie('savedesk_session','',0));return send(res,200,{ok:true});}
 const source=url.searchParams.get('source');if(!['like','bookmark'].includes(source))return send(res,400,{error:'Choose likes or bookmarks.'});
 const params=new URLSearchParams({max_results:'100','post.fields':'created_at,note_post','expansions':'author_id','user.fields':'username,name'});const next=url.searchParams.get('cursor');if(next){if(next.length>2048)return send(res,400,{error:'Invalid page cursor.'});params.set('pagination_token',next);}
 const data=await api(`users/${encodeURIComponent(session.user.id)}/${source==='like'?'liked_tweets':'bookmarks'}?${params}`,session.token);
 const authors=new Map((data.includes?.users||[]).map(x=>[x.id,x.username]));
 return send(res,200,{items:(data.data||[]).map(x=>({id:x.id,text:x.note_post?.text||x.note_tweet?.text||x.text,author:authors.get(x.author_id)||'',source,created_at:x.created_at})),next:data.meta?.next_token||null,partial:!!data.errors?.length});
 }
 const file=files[url.pathname];if(!file||!['GET','HEAD'].includes(req.method))return send(res,404,{error:'Not found.'});
 res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?'':await readFile(new URL(file[0],root)));
 }catch(error){send(res,[401,402,403,429].includes(error.status)?error.status:502,{error:error.status?error.message:'Could not complete the X request. Please reconnect or retry.'});}
 });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||4173;createApp().listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Savedesk listening on port ${port}. X login ${process.env.X_CLIENT_ID?'configured':'needs X_CLIENT_ID'}.`));}
