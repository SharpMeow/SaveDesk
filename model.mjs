const MAX_SAVES = 100000;
const missingText = 'Text unavailable in this export.';
function boundedText(value, fallback, name, limit) {
  if (value == null) return fallback;
  if (typeof value !== 'string') throw Error(`${name} must be a string.`);
  if (value.length > limit) throw Error(`${name} exceeds the ${limit.toLocaleString('en-US')}-character limit.`);
  return value;
}
export function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  if (tags.length > 100) throw Error('Each save has a limit of 100 topics.');
  return [...new Set(tags.filter(tag => typeof tag === 'string').map(tag => boundedText(tag, '', 'Topic', 200)))];
}
export function parseImport(raw, defaultSource = 'like') {
  const clean = raw.replace(/^\uFEFF/, '').trim();
  const json = clean.replace(/^window\.YTD\.[A-Za-z_]+\.part\d+\s*=\s*/, '').replace(/;\s*$/, '');
  const value = JSON.parse(json);
  const items = Array.isArray(value) ? value : value?.items ?? value?.data;
  if (!Array.isArray(items)) throw Error('Expected a JSON array or an object with an items/data array.');
  if (items.length > MAX_SAVES) throw Error('An import has a limit of 100,000 records. Choose a smaller file.');
  const result = [];
  for (const row of items) {
    if (!row || typeof row !== 'object') continue;
    const item = row.like ?? row.bookmark ?? row;
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const rawId = item.tweetId ?? item.id ?? '';
    if (typeof rawId === 'number' && !Number.isSafeInteger(rawId)) throw Error('Post IDs must be quoted strings in this export to avoid losing digits.');
    if (!['number', 'string'].includes(typeof rawId)) continue;
    const digits = String(rawId);
    if (!/^\d{1,20}$/.test(digits)) continue;
    const id = BigInt(digits).toString();
    if (id === '0') continue;
    const source = row.bookmark ? 'bookmark' : row.like ? 'like' : item.source === 'bookmark' ? 'bookmark' : item.source === 'like' ? 'like' : defaultSource === 'bookmark' ? 'bookmark' : 'like';
    const sources = Array.isArray(item.sources) ? [...new Set(item.sources.filter(x => ['like', 'bookmark'].includes(x)))] : [source];
    result.push({
      id,
      text: boundedText(item.fullText ?? item.text, missingText, 'Post text', 100000),
      author: boundedText(item.author, '', 'Author', 500),
      url: `https://x.com/i/status/${id}`,
      sources: sources.length ? sources : [source],
      tags: normalizeTags(item.tags),
      read: item.read === true,
      created_at: boundedText(item.created_at, '', 'Creation date', 100),
    });
  }
  if (!result.length) throw Error('No valid saves found. Each save needs a numeric post id of up to 20 digits.');
  return mergeItems([], result);
}
export function mergeItems(existing, incoming) {
  const map = new Map(existing.map(x => [x.id, x]));
  for (const item of incoming) {
    const old = map.get(item.id);
    map.set(item.id, old ? {
      ...item,
      text: item.text === missingText ? old.text : item.text,
      author: item.author || old.author,
      created_at: item.created_at || old.created_at,
      sources: [...new Set([...old.sources, ...item.sources])],
      tags: normalizeTags([...new Set([...old.tags, ...item.tags])]),
      read: old.read || item.read,
    } : item);
    if (map.size > MAX_SAVES) throw Error('A library has a limit of 100,000 saves. Keep separate backups for larger collections.');
  }
  return [...map.values()];
}
