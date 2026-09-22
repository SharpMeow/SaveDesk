import {parseImport,normalizeTags} from './model.mjs';
export function normalizeLibrary(items) {
  if (!Array.isArray(items)) throw Error('The cloud library is not a list of saves.');
  return items.length ? parseImport(JSON.stringify({items})) : [];
}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const copy=value=>structuredClone(value);
function mergeTags(base,local,remote) {
  const previous=new Set(base),left=new Set(local),right=new Set(remote);
  return normalizeTags([...new Set([...local,...remote])].filter(tag=>!previous.has(tag)||(left.has(tag)&&right.has(tag))));
}
// Three-way merge preserves independent changes, including mark-as-unread and
// topic removals. If both devices edit the same scalar differently, this
// device's pending edit wins. There is no save-deletion feature yet.
export function reconcileLibrary(base,local,remote) {
  const before=new Map(base.map(x=>[x.id,x])),here=new Map(local.map(x=>[x.id,x]));
  const merged=new Map(remote.map(x=>[x.id,copy(x)]));
  for(const item of here.values()){
    const other=merged.get(item.id),old=before.get(item.id);
    if(!other){merged.set(item.id,copy(item));continue;}
    if(!old){merged.set(item.id,{...other,...copy(item),tags:normalizeTags([...new Set([...other.tags,...item.tags])]),sources:[...new Set([...other.sources,...item.sources])],read:other.read||item.read});continue;}
    const next=copy(other);
    for(const field of ['text','author','created_at','url','read'])if(!equal(item[field],old[field]))next[field]=item[field];
    next.tags=mergeTags(old.tags,item.tags,other.tags);
    next.sources=[...new Set([...other.sources,...item.sources])];
    merged.set(item.id,next);
  }
  return normalizeLibrary([...merged.values()]);
}
export async function syncSnapshot({base,local,read,write,maxAttempts=3}) {
  let remote=await read();
  for(let attempt=0;attempt<maxAttempts;attempt++){
    const normalized=normalizeLibrary(remote.items);
    const items=reconcileLibrary(base,local,normalized);
    if(equal(items,normalized))return {items,revision:remote.revision};
    const result=await write(remote.revision,items);
    if(result.saved)return {items,revision:result.revision};
    remote=result;
  }
  throw Error('Another device is changing this library. Your edits are safe here. Try syncing again.');
}
