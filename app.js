import {parseImport, mergeItems} from './model.mjs';
import {readSavesFile} from './importing.mjs';
import {matchesSearch, buildContext, buildSharedPage} from './library.mjs';
const $ = id => document.getElementById(id);
const key = 'savedesk-v1';
const sample=[['A useful idea deserves more than a bookmark. Give it a place, a topic, and a next step.','Design'],['A reading list is most useful when you can actually finish it. Start with five things you want to revisit this week.','Reading'],['Small tools that do one thing well: a local search index, a clear interface, and an export button.','Building'],['Keep a notebook of questions. The best ones tend to connect ideas from completely different fields.','Research'],['Save the explanation that made something click. Add your own note about why it mattered.','Learning'],['A weekend project: turn a pile of saved links into a collection you can browse in a few minutes.','Building']].map(([text,tag],i)=>({id:String(i+1),text,author:'Sample save',sources:[i%2?'like':'bookmark'],tags:[tag],read:false,created_at:'',url:''}));
let items = sample, demo = true, filter = 'all', page = 0, editing = null;
let importing = false, syncing = false;
const selected = new Set();
let xSession = {configured:false, connected:false};
let cursors = {like:null, bookmark:null}, finished = {like:false, bookmark:false};
function message(text) { $('status').textContent = text; }
try {
  const stored = localStorage.getItem(key);
  if (stored) { items = parseImport(stored); demo = false; }
} catch { message('We could not load your saved library. Add a backup file to recover it.'); }
function persist() {
  if (demo) return;
  try {
    localStorage.setItem(key, JSON.stringify({items}));
    $('storage-status').hidden = true;
  } catch {
    $('storage-status').hidden = false;
    $('storage-status').textContent = 'This browser could not save your changes. Download a backup before closing this page.';
  }
}
function element(tag, text, cls) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (cls) el.className = cls;
  return el;
}
function updateOptions(id, label, values) {
  const previous = $(id).value;
  $(id).replaceChildren(new Option(label, ''), ...[...new Set(values)].filter(Boolean).sort().map(value => new Option(value, value)));
  $(id).value = values.includes(previous) ? previous : '';
}
function updateSelection() {
  $('selection-bar').hidden = selected.size === 0;
  $('selected-count').textContent = `${selected.size} selected`;
}
function render() {
  $('demo').hidden = !demo;
  $('stats').textContent = `${items.length} saves · ${items.filter(x => !x.read).length} unread`;
  updateOptions('tag', 'All topics', items.flatMap(x => x.tags));
  updateOptions('author', 'All authors', items.map(x => x.author));
  const matches = items.filter(item =>
    (filter === 'all' || filter === 'unread' && !item.read || filter === 'read' && item.read || item.sources.includes(filter)) &&
    (!$('tag').value || item.tags.includes($('tag').value)) &&
    matchesSearch(item, $('search').value, $('author').value)
  );
  matches.sort((a,b) => {
    const comparison = BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0;
    return $('sort').value === 'old' ? comparison : -comparison;
  });
  const pages = Math.max(1, Math.ceil(matches.length / 24));
  page = Math.min(page, pages - 1);
  $('grid').replaceChildren();
  for (const item of matches.slice(page * 24, page * 24 + 24)) {
    const card = element('article', '', 'card');
    card.classList.toggle('selected', selected.has(item.id));
    const meta = element('div', '', 'meta');
    const author = element('div', item.author || 'Author not in export', 'author-name');
    author.append(element('span', item.sources.map(x => x === 'like' ? 'Liked' : 'Bookmarked').join(' · '), 'source'));
    const label = element('label', '', 'select-label');
    const check = document.createElement('input'); check.type = 'checkbox'; check.checked = selected.has(item.id);
    check.setAttribute('aria-label', `Select save: ${item.text.slice(0, 70)}`);
    check.onchange = () => {
      if (check.checked) selected.add(item.id); else selected.delete(item.id);
      card.classList.toggle('selected', check.checked); updateSelection();
    };
    label.append(check, element('span', 'Select')); meta.append(author, label);
    card.append(meta, element('p', item.text, 'text'));
    const tags = element('div', '', 'tags');
    for (const tag of item.tags) tags.append(element('span', tag, 'tag'));
    card.append(tags);
    const footer = element('div', '', 'card-footer'), buttons = element('div');
    if (!demo) {
      const link = element('a', 'Open on X ↗'); link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; footer.append(link);
    } else footer.append(element('span', 'Example', 'meta'));
    const edit = element('button', 'Topics');
    edit.onclick = () => { editing = item; $('tag-input').value = item.tags.join(', '); $('tag-dialog').showModal(); };
    const read = element('button', item.read ? '✓ Reviewed' : 'Mark read');
    read.onclick = () => { item.read = !item.read; persist(); render(); };
    buttons.append(edit, read); footer.append(buttons); card.append(footer); $('grid').append(card);
  }
  if (!matches.length) {
    const empty = element('div', '', 'empty');
    empty.append(element('p', 'No saves match these filters.'));
    const reset = element('button', 'Show all saves'); reset.onclick = resetFilters;
    empty.append(reset); $('grid').append(empty);
  }
  $('page').textContent = `${matches.length} ${matches.length === 1 ? 'save' : 'saves'} · Page ${page + 1} of ${pages}`;
  $('prev').disabled = page === 0; $('next').disabled = page >= pages - 1;
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.classList.toggle('active', button.dataset.filter === filter);
    button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  });
  updateSelection();
}
function resetFilters() {
  filter = 'all'; page = 0;
  for (const id of ['search','tag','author']) $(id).value = '';
  render();
}
function openOnboarding() { $('import-status').textContent = ''; $('onboarding').showModal(); }
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function hasLibrary() {
  if (!demo) return true;
  $('manage-status').textContent = 'These are example saves. Add your own saves first, then you can download or share them.';
  return false;
}
for (const button of document.querySelectorAll('[data-close]')) button.onclick = () => $(button.dataset.close).close();
for (const id of ['add','get-started']) $(id).onclick = openOnboarding;
$('guide-start').onclick = () => { $('guide').close(); openOnboarding(); };
$('help').onclick = () => $('guide').showModal();
for (const id of ['manage','backup-reminder']) $(id).onclick = () => { $('manage-status').textContent = ''; $('manage-dialog').showModal(); };
$('explore').onclick = () => { $('search').focus(); $('search').scrollIntoView({block:'center', behavior:'smooth'}); };
$('search-key').textContent = navigator.platform.includes('Mac') ? '⌘ K' : 'Ctrl K';
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !document.querySelector('dialog[open]')) {
    event.preventDefault(); $('search').focus();
  }
});
$('nav').onclick = event => { const button = event.target.closest('[data-filter]'); if (button) { filter = button.dataset.filter; page = 0; render(); } };
for (const id of ['search','tag','author','sort']) $(id).addEventListener(id === 'search' ? 'input' : 'change', () => { page = 0; render(); });
$('prev').onclick = () => { page--; render(); }; $('next').onclick = () => { page++; render(); };
$('tag-form').onsubmit = event => {
  event.preventDefault();
  if (editing) { editing.tags = [...new Set($('tag-input').value.split(',').map(x => x.trim()).filter(Boolean))]; persist(); render(); }
  $('tag-dialog').close();
};
$('import').onclick = () => $('file').click();
$('file').onchange = async () => {
  const file = $('file').files[0]; if (!file || importing) return;
  importing = true; $('import').disabled = true; $('import-status').textContent = 'Reading your file on this device…';
  try {
    const result = await readSavesFile(file, $('source').value);
    items = mergeItems(demo ? [] : items, result.items); demo = false; selected.clear();
    persist(); resetFilters(); $('onboarding').close();
    message(`Your library is ready: ${items.length} unique saves. Try a search or open Unread to start exploring.`);
  } catch (error) { $('import-status').textContent = error.message; }
  finally { importing = false; $('import').disabled = false; $('file').value = ''; }
};
$('export').onclick = () => {
  if (!hasLibrary()) return;
  download('savedesk-backup.json', JSON.stringify({version:1, items}, null, 2), 'application/json');
  $('manage-status').textContent = 'Backup downloaded. To restore it later, choose Add your saves and select this file.';
};
$('share').onclick = () => {
  if (!hasLibrary()) return;
  download('savedesk-collection.html', buildSharedPage(items), 'text/html');
  $('manage-status').textContent = 'Your shareable page is downloaded. Open it to review, then send the file to anyone you want to share it with.';
};
$('publish').onclick = () => {
  if (!hasLibrary()) return;
  download('collection.json', JSON.stringify({version:1, items:items.map(({read, ...item}) => item)}, null, 2), 'application/json');
  $('manage-status').textContent = 'Website data downloaded. Follow the publishing guide to put it on your own site.';
};
$('clear-selected').onclick = () => { selected.clear(); render(); };
$('copy-selected').onclick = async () => {
  const text = buildContext(items.filter(item => selected.has(item.id)));
  try { await navigator.clipboard.writeText(text); message(`${selected.size} ${selected.size === 1 ? 'save' : 'saves'} copied. Paste them into the chat you choose. Nothing has been sent.`); }
  catch { $('copy-text').value = text; $('copy-dialog').showModal(); $('copy-text').select(); }
};
async function checkX() {
  try {
    const response = await fetch('./api/session', {cache:'no-store', signal:AbortSignal.timeout(5000)});
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) xSession = await response.json();
  } catch {}
  $('connect-option').hidden = !xSession.configured || xSession.connected;
  $('connection').hidden = !xSession.connected;
  $('connected-name').textContent = xSession.connected ? `Connected as @${xSession.user.username}` : '';
}
$('connect').onclick = () => { if (xSession.configured) location.assign('./auth/login'); };
$('disconnect').onclick = async () => {
  try {
    const response = await fetch('./api/disconnect', {method:'POST'});
    if (!response.ok && response.status !== 401) throw Error();
    xSession = {configured:true, connected:false}; cursors = {like:null, bookmark:null}; finished = {like:false, bookmark:false};
    await checkX(); message('Disconnected. Your imported saves are still in this browser.');
  } catch { message('We could not disconnect. Check your connection and try again.'); }
};
$('sync').onclick = async () => {
  if (syncing) return;
  syncing = true; $('sync').disabled = true; $('disconnect').disabled = true;
  let count = 0, partial = false; const errors = [];
  if (finished.like && finished.bookmark) { finished = {like:false, bookmark:false}; cursors = {like:null, bookmark:null}; }
  for (const source of ['like','bookmark']) {
    if (finished[source]) continue;
    try {
      let pages = 0;
      do {
        const params = new URLSearchParams({source}); if (cursors[source]) params.set('cursor', cursors[source]);
        const response = await fetch(`./api/sync?${params}`, {method:'POST'}); const data = await response.json();
        if (!response.ok) throw Error(data.error || 'Sync failed.');
        partial = partial || data.partial;
        if (data.items.length) {
          const incoming = parseImport(JSON.stringify(data.items), source);
          if (demo) selected.clear(); items = mergeItems(demo ? [] : items, incoming); demo = false; count += incoming.length; persist(); render();
        }
        const previous = cursors[source]; cursors[source] = data.next; finished[source] = !data.next; pages++;
        message(`Added ${count} records. Reading your ${source === 'like' ? 'likes' : 'bookmarks'}…`);
        if (data.next && data.next === previous) throw Error('X repeated a page. Please retry later.');
        if (pages >= 20 && !finished[source]) break;
      } while (!finished[source]);
    } catch (error) { errors.push(`${source === 'like' ? 'Likes' : 'Bookmarks'}: ${error.message}`); }
  }
  message(`Added ${count} records. ${finished.like && finished.bookmark ? 'Reached the end of the results X returned.' : 'Choose Sync X saves again to continue.'}${partial ? ' Some posts were unavailable.' : ''} ${errors.join(' ')}`);
  syncing = false; $('sync').disabled = false; $('disconnect').disabled = false;
};
render();
const params = new URLSearchParams(location.search);
if (params.has('x_error')) { message('X sign-in was not completed. Try again or add an archive file instead.'); history.replaceState(null, '', location.pathname); }
else if (params.has('x_connected')) { message('Connected to X. Choose Sync X saves to fill your library.'); history.replaceState(null, '', location.pathname); }
async function loadPublicCollection() {
  try {
    const response = await fetch('./collection.json', {cache:'no-cache', signal:AbortSignal.timeout(5000)});
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length) {
        items = mergeItems(parseImport(JSON.stringify(data)), demo ? [] : items); demo = false; selected.clear(); render();
      }
    }
  } catch { message('The shared collection could not be loaded. You can still add your own files.'); }
}
await Promise.all([checkX(), loadPublicCollection()]);
