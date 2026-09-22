export function parseImport(raw, defaultSource='like') {
  const clean=raw.replace(/^\uFEFF/,'').trim();
  const json=clean.replace(/^window\.YTD\.[A-Za-z_]+\.part\d+\s*=\s*/, '').replace(/;\s*$/, '');
  const value=JSON.parse(json);
  const items=Array.isArray(value)?value:value.items??value.data;
  if(!Array.isArray(items)) throw Error('Expected a JSON array or an object with an items/data array.');
  const result=[];
  for(const row of items){
    if(!row||typeof row!=='object')continue;
    const item=row.like??row.bookmark??row;
    const id=String(item.tweetId??item.id??'');
    if(!/^\d+$/.test(id))continue;
    const source=row.bookmark?'bookmark':row.like?'like':item.source==='bookmark'?'bookmark':item.source==='like'?'like':defaultSource;
    const sources=Array.isArray(item.sources)?item.sources.filter(x=>['like','bookmark'].includes(x)):[source];
    result.push({id,text:String(item.fullText??item.text??'Text unavailable in this export.'),author:String(item.author??''),url:`https://x.com/i/status/${id}`,sources:sources.length?sources:[source],tags:Array.isArray(item.tags)?item.tags.filter(t=>typeof t==='string'):[],read:item.read===true,created_at:typeof item.created_at==='string'?item.created_at:''});
  }
  if(!result.length)throw Error('No valid saves found. Each save needs a numeric post id.');
  return result;
}
export function mergeItems(existing,incoming){
  const map=new Map(existing.map(x=>[x.id,x]));
  for(const item of incoming){const old=map.get(item.id);map.set(item.id,old?{...item,text:item.text==='Text unavailable in this export.'?old.text:item.text,author:item.author||old.author,created_at:item.created_at||old.created_at,sources:[...new Set([...old.sources,...item.sources])],tags:[...new Set([...old.tags,...item.tags])],read:old.read||item.read}:item);}
  return [...map.values()];
}
