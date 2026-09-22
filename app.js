import {parseImport,mergeItems} from './model.mjs';
const $=id=>document.getElementById(id),key='savedesk-v1';
const sample=[['A useful idea deserves more than a bookmark. Give it a place, a topic, and a next step.','Design'],['A reading list is most useful when you can actually finish it. Start with five things you want to revisit this week.','Reading'],['Small tools that do one thing well: a local search index, a clear interface, and an export button.','Building'],['Keep a notebook of questions. The best ones tend to connect ideas from completely different fields.','Research'],['Save the explanation that made something click. Add your own note about why it mattered.','Learning'],['A weekend project: turn a pile of saved links into a collection you can browse in a few minutes.','Building']].map(([text,tag],i)=>({id:String(i+1),text,author:'Sample save',sources:[i%2?'like':'bookmark'],tags:[tag],read:false,created_at:'',url:''}));
let items=sample,demo=true,filter='all',page=0,editing=null;
try{const stored=localStorage.getItem(key);if(stored){items=parseImport(stored);demo=false;}}catch{$('status').textContent='Saved data could not be loaded. Import a backup to recover it.';}
function persist(){if(demo)return;try{localStorage.setItem(key,JSON.stringify({items}));}catch{$('status').textContent='Browser storage is full or unavailable. Export your library now to keep these changes.';}}
function element(tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;}
function render(){
 $('demo').hidden=!demo;$('stats').textContent=`${items.length} saves · ${items.filter(x=>!x.read).length} unread`;
 const chosen=$('tag').value;$('tag').replaceChildren(new Option('All topics',''),...[...new Set(items.flatMap(x=>x.tags))].sort().map(t=>new Option(t,t)));$('tag').value=chosen;
 const q=$('search').value.toLowerCase();
 const matches=items.filter(x=>(filter==='all'||filter==='unread'&&!x.read||filter==='read'&&x.read||x.sources.includes(filter))&&(!chosen||x.tags.includes(chosen))&&[x.text,x.author,...x.tags].join(' ').toLowerCase().includes(q));
 matches.sort((a,b)=>{const cmp=BigInt(a.id)<BigInt(b.id)?-1:BigInt(a.id)>BigInt(b.id)?1:0;return $('sort').value==='old'?cmp:-cmp;});
 const pages=Math.max(1,Math.ceil(matches.length/24));page=Math.min(page,pages-1);$('grid').replaceChildren();
 for(const item of matches.slice(page*24,page*24+24)){
 const card=element('article','','card'),meta=element('div','','meta');meta.append(element('span',item.author||'Author not in export'),element('span',item.sources.join(' + ')));card.append(meta,element('p',item.text,'text'));
 const tags=element('div','','tags');for(const tag of item.tags)tags.append(element('span',tag,'tag'));card.append(tags);
 const footer=element('div','','footer'),buttons=element('div');
 if(!demo){const link=element('a','Open on X ↗');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';footer.append(link);}else footer.append(element('span','Demo','meta'));
 const edit=element('button','Tags');edit.onclick=()=>{editing=item;$('tag-input').value=item.tags.join(', ');$('tag-dialog').showModal();};
 const read=element('button',item.read?'✓ Reviewed':'Mark read');read.onclick=()=>{item.read=!item.read;persist();render();};buttons.append(edit,read);footer.append(buttons);card.append(footer);$('grid').append(card);
 }
 if(!matches.length)$('grid').append(element('p','No saves match. Try another search or topic.','empty'));
 $('page').textContent=`${matches.length} results · ${page+1} / ${pages}`;$('prev').disabled=page===0;$('next').disabled=page>=pages-1;
 document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.filter===filter);b.setAttribute('aria-pressed',String(b.dataset.filter===filter));});
}
$('nav').onclick=e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;page=0;render();}};
for(const id of ['search','tag','sort'])$(id).addEventListener(id==='search'?'input':'change',()=>{page=0;render();});
$('prev').onclick=()=>{page--;render();};$('next').onclick=()=>{page++;render();};$('help').onclick=()=>$('dialog').showModal();$('close').onclick=()=>$('dialog').close();$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{if(file.size>50*1024*1024)throw Error('Please use a file smaller than 50 MB.');const source=$('source').value;if(!['like','bookmark'].includes(source.trim()))throw Error('Source must be like or bookmark.');const incoming=parseImport(await file.text(),source.trim());items=mergeItems(demo?[]:items,incoming);demo=false;filter='all';page=0;$('search').value='';$('tag').value='';$('status').textContent=`Imported ${incoming.length} records. Your library has ${items.length} unique saves.`;persist();render();}catch(e){$('status').textContent=e.message;}finally{$('file').value='';}};
$('export').onclick=()=>{if(demo){$('status').textContent='Import your saves before exporting a library.';return;}const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,items},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='savedesk-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};render();

$('publish').onclick=()=>{if(demo){$('status').textContent='Import your saves first. Sample content cannot be published as your collection.';return;}const publicItems=items.map(({read,...item})=>item);const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,items:publicItems},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='collection.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Commit collection.json to the repo to publish these saves and tags. Reading progress is excluded.';};
try{const response=await fetch('./collection.json',{cache:'no-cache'});if(response.ok){const data=await response.json();if(Array.isArray(data.items)&&data.items.length){const incoming=parseImport(JSON.stringify(data));items=mergeItems(incoming,demo?[]:items);demo=false;render();}}}catch{$('status').textContent='Public collection could not be loaded. Local imports still work.';}

$('cancel-tags').onclick=()=>$('tag-dialog').close();$('tag-form').onsubmit=e=>{e.preventDefault();if(editing){editing.tags=[...new Set($('tag-input').value.split(',').map(x=>x.trim()).filter(Boolean))];persist();render();}$('tag-dialog').close();};
let xSession={configured:false,connected:false},syncing=false,cursors={like:null,bookmark:null},finished={like:false,bookmark:false};
async function checkX(){try{const r=await fetch('./api/session',{cache:'no-store'});if(r.ok&&r.headers.get('content-type')?.includes('application/json'))xSession=await r.json();}catch{}$('connect').textContent=xSession.connected?`Connected @${xSession.user.username}`:'Connect X';$('connect').disabled=xSession.connected;$('sync').hidden=!xSession.connected;$('disconnect').hidden=!xSession.connected;}
$('close-x-setup').onclick=()=>$('x-setup').close();
$('connect').onclick=()=>{if(xSession.configured)location.assign('./auth/login');else $('x-setup').showModal();};
$('disconnect').onclick=async()=>{const r=await fetch('./api/disconnect',{method:'POST'});if(r.ok){xSession={configured:true,connected:false};cursors={like:null,bookmark:null};finished={like:false,bookmark:false};await checkX();$('status').textContent='Disconnected. Previously imported saves remain in this browser.';}else $('status').textContent='Could not disconnect. Please reload and try again.';};
$('sync').onclick=async()=>{
 if(syncing)return;syncing=true;$('sync').disabled=true;$('disconnect').disabled=true;let count=0,partial=false;const errors=[];
 if(finished.like&&finished.bookmark){finished={like:false,bookmark:false};cursors={like:null,bookmark:null};}
 for(const source of ['like','bookmark']){
 if(finished[source])continue;
 try{let pages=0;do{const params=new URLSearchParams({source});if(cursors[source])params.set('cursor',cursors[source]);const r=await fetch(`./api/sync?${params}`,{method:'POST'});const data=await r.json();if(!r.ok)throw Error(data.error||'Sync failed.');partial=partial||data.partial;
 if(data.items.length){const incoming=parseImport(JSON.stringify(data.items),source);items=mergeItems(demo?[]:items,incoming);demo=false;count+=incoming.length;persist();render();}
 const previous=cursors[source];cursors[source]=data.next;finished[source]=!data.next;pages++;$('status').textContent=`Imported ${count} records this sync. Fetching ${source==='like'?'likes':'bookmarks'}…`;
 if(data.next&&data.next===previous)throw Error('X repeated a page cursor. Retry later.');
 if(pages>=20&&!finished[source])break;
 }while(!finished[source]);}catch(e){errors.push(`${source==='like'?'Likes':'Bookmarks'}: ${e.message}`);}
 }
 const done=finished.like&&finished.bookmark;
 $('status').textContent=`Imported ${count} records this sync. ${done?'Reached the end of the results X returned.':'Click Sync again to resume remaining pages.'}${partial?' X omitted some unavailable posts.':''} ${errors.join(' ')}`;
 syncing=false;$('sync').disabled=false;$('disconnect').disabled=false;
};
const xParams=new URLSearchParams(location.search);if(xParams.has('x_error')){$('status').textContent='X connection was not completed. Check your app configuration and try Connect X again.';history.replaceState(null,'',location.pathname);}else if(xParams.has('x_connected')){$('status').textContent='Connected to X. Click Sync X saves to import your likes and bookmarks.';history.replaceState(null,'',location.pathname);}await checkX();
