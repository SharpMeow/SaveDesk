import {normalizeLibrary,syncSnapshot,reconcileLibrary} from './sync.mjs';
export const PROVIDERS={google:'Google',github:'GitHub',azure:'Microsoft',apple:'Apple'};
export function validateCloudConfig(config) {
  if(!config?.url&&!config?.publishableKey)return null;
  const url=new URL(config.url);
  if(url.protocol!=='https:'||!/^[-a-z0-9]+\.supabase\.co$/.test(url.hostname)||url.port||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Use your Supabase project HTTPS URL.');
  let publicKey=typeof config.publishableKey==='string'&&/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey);
  if(!publicKey){try{publicKey=JSON.parse(atob(config.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch{}}
  if(!publicKey)throw Error('Use a public publishable or anon key, never a secret or service-role key.');
  const providers=(config.providers||[]).filter(name=>Object.hasOwn(PROVIDERS,name));
  if(!providers.length)throw Error('Enable at least one sign-in provider.');
  return {url:url.origin,publishableKey:config.publishableKey,providers:[...new Set(providers)]};
}
export async function openCloud({onAccount,onStatus,onLibrary,readLocal,storage=localStorage,clientFactory,events=globalThis.window,request=globalThis.fetch,pageUrl=globalThis.location?.href}) {
  const boundedFetch=(url,options={})=>request(url,{...options,signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});
  const response=await boundedFetch('./cloud-config.json',{cache:'no-cache'});
  if(!response.ok)return null;
  const config=validateCloudConfig(await response.json());if(!config)return null;
  const createClient=clientFactory||(await import('./vendor/supabase.mjs')).createClient;
  const client=createClient(config.url,config.publishableKey,{global:{fetch:boundedFetch},auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  let user=null,sessionToken=null,base=[],generation=0,running=false,queued=false,timer;
  const cacheKey=id=>`savedesk-account-${id}`;
  const notify=text=>onStatus(text);
  const saveCache=(items,baseline=base)=>{
    if(!user)return;
    try{storage.setItem(cacheKey(user.id),JSON.stringify({items,base:baseline}));return true;}
    catch{notify('Device storage is unavailable or full. Download a backup before closing this page.');return false;}
  };
  async function sync() {
    if(!user||!sessionToken)return;
    if(running){queued=true;return;}
    running=true;queued=false;
    const id=user.id,turn=generation,start=structuredClone(readLocal()),baseline=structuredClone(base);
    // Bind every request in this sync to the captured identity, even if the
    // shared Auth client switches accounts while a request is in flight.
    const token=sessionToken;
    const scoped=createClient(config.url,config.publishableKey,{accessToken:async()=>token,global:{fetch:boundedFetch}});
    const checkAccount=()=>{if(turn!==generation)throw Error('Account changed.');};
    notify('Syncing your library…');
    try{
      const result=await syncSnapshot({base:baseline,local:start,
        read:async()=>{checkAccount();const {data,error}=await scoped.from('savedesk_libraries').select('items,revision').eq('user_id',id).maybeSingle();if(error)throw error;return data||{items:[],revision:0};},
        write:async(expected_revision,new_items)=>{checkAccount();const {data,error}=await scoped.rpc('savedesk_save_library',{expected_revision,new_items});if(error)throw error;return data;},
      });
      if(turn!==generation)return;
      const current=readLocal();const changed=JSON.stringify(current)!==JSON.stringify(start);
      const latest=changed?reconcileLibrary(start,current,result.items):result.items;
      base=result.items;const cached=saveCache(latest);onLibrary(latest);if(cached)notify(changed?'Saving your latest changes…':'Up to date across your devices.');
      queued=queued||changed;
    }catch{if(turn===generation)notify('Could not sync. Your changes stay on this device. Check your connection or choose Sync now.');}
    finally{running=false;if(queued&&user){queued=false;clearTimeout(timer);timer=setTimeout(sync,750);}}
  }
  function changed() {if(!user)return;const cached=saveCache(readLocal());clearTimeout(timer);timer=setTimeout(sync,750);if(cached)notify('Changes saved here. Waiting to sync…');}
  function accountChanged(session) {
    sessionToken=session?.access_token||null;
    const next=session?.user||null;if(next?.id===user?.id)return;
    generation++;clearTimeout(timer);queued=false;user=next;base=[];
    let cached=[];
    if(user){try{const cache=JSON.parse(storage.getItem(cacheKey(user.id))||'null');cached=normalizeLibrary(cache?.items||[]);base=normalizeLibrary(cache?.base||[]);}catch{notify('Could not load this account’s local copy. Checking your cloud library.');}}
    onAccount(user);if(user){onLibrary(cached);timer=setTimeout(sync,0);}
  }
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{accountChanged(session);});
  const initialGeneration=generation;
  const {data,error}=await client.auth.getSession();if(error){subscription.unsubscribe();throw error;}if(generation===initialGeneration)accountChanged(data.session);
  const onFocus=()=>{if(user)sync();};events?.addEventListener('online',onFocus);events?.addEventListener('focus',onFocus);
  return {providers:config.providers,changed,sync,
    dispose(){generation++;user=null;clearTimeout(timer);subscription.unsubscribe();events?.removeEventListener('online',onFocus);events?.removeEventListener('focus',onFocus);},
    async signIn(provider){
      if(!config.providers.includes(provider))throw Error('This sign-in provider is not enabled.');
      const {error}=await client.auth.signInWithOAuth({provider,options:{redirectTo:new URL('./',pageUrl).href,...(provider==='azure'?{scopes:'email'}:{})}});if(error)throw error;
    },
    async signOut(){const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;accountChanged(null);notify('Signed out. Your device-only library is shown.');},
  };
}
