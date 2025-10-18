const API_URL = 'https://thronesapi.com/api/v2/Characters';

const $ = (sel) => document.querySelector(sel);
const els = {
  searchInput: $('#searchInput'),
  searchButton: $('#searchButton'),

  firstName: $('#character-firstName'),
  lastName:  $('#character-lastName'),
  id:        $('#character-id'),
  born:      $('#character-born'),
  dead:      $('#character-dead'),
  family:    $('#character-family'),
  titles:    $('#character-titles'),
  aliases:   $('#character-aliases'),

  image:     $('#character-image'),
  crest:     $('#family-crest'),

  prev:      $('#prevButton'),
  next:      $('#nextButton'),

  error:     $('#error-screen'),
  backToStart: $('#back-to-start')
};

const state = {
  all: [],        
  indexByName: new Map(),
  currentIndex: -1
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    await loadAll();
    wireEvents();

    const initialName = getQueryName();
    if (initialName) {
      const ok = goToByName(initialName, { push: false });
      if (!ok) showNotFound();
    } else {
      hideNotFound();
    }
  } catch (err) {
    console.error('Error inicializando:', err);
    showNotFound();
  }
}

async function loadAll() {
  const res = await fetch(API_URL);
  const data = await res.json();
  state.all = data
    .map(c => ({
      id: c.id,
      firstName: (c.firstName || '').trim(),
      lastName:  (c.lastName  || '').trim(),
      fullName:  `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      title:     c.title  || '',
      family:    c.family || '',
      imageUrl:  c.imageUrl || ''
    }))
    .sort((a, b) => a.id - b.id);

  state.indexByName.clear();
  state.all.forEach((c, i) => {
    state.indexByName.set(normalize(c.fullName), i);
  });
}

function wireEvents() {

  els.searchButton?.addEventListener('click', onSearch);
  els.searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  });

  els.prev?.addEventListener('click', () => move(-1));
  els.next?.addEventListener('click', () => move(1));

  els.backToStart?.addEventListener('click', (e) => {
    e.preventDefault();
    location.href = 'index.html';
  });

  window.addEventListener('popstate', () => {
    const name = getQueryName();
    if (name) {
      goToByName(name, { push: false });
    }
  });
}

function onSearch() {
  const q = (els.searchInput?.value || '').trim();
  if (!q) return;
  goToByName(q, { push: true, scrollTop: true });
}

function goToByName(name, { push = true, scrollTop = false } = {}) {
  hideNotFound();

  const idx = findIndexForName(name);
  if (idx === -1) {
    showNotFound();
    return false;
  }

  state.currentIndex = idx;
  const c = state.all[idx];
  render(c);
  updateNavButtons();

  const url = new URL(location.href);
  url.searchParams.set('characterName', c.fullName);
  if (push) history.pushState({ id: c.id }, '', url.toString());

  if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
}

function move(delta) {
  if (state.currentIndex < 0) return;

  const nextIndex = clamp(state.currentIndex + delta, 0, state.all.length - 1);
  const target = state.all[nextIndex];
  if (!target) return;

  goToByName(target.fullName, { push: true, scrollTop: false });
}

function render(c) {
  els.firstName.textContent = c.firstName || 'N/A';
  els.lastName.textContent  = c.lastName  || '';
  els.id.textContent        = c.id;
  els.family.textContent    = c.family || 'N/A';

  if (c.imageUrl) {
    els.image.src = c.imageUrl;
    els.image.alt = `${c.fullName} portrait`;
  }

  setList(els.titles, c.title ? [c.title] : ['N/A']);
  setList(els.aliases, ['N/A']);

  els.born.textContent = 'N/A';
  els.dead.textContent = 'N/A';

  hideNotFound();
}

function updateNavButtons() {
  const i = state.currentIndex;
  els.prev.disabled = i <= 0;
  els.next.disabled = i >= (state.all.length - 1);
}

function setList(ul, items) {
  if (!ul) return;
  ul.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  }
}

function showNotFound() {
  els.error && (els.error.style.display = 'block');
}
function hideNotFound() {
  els.error && (els.error.style.display = 'none');
}

function getQueryName() {
  const params = new URLSearchParams(location.search);
  return params.get('characterName');
}

function findIndexForName(name) {
  const key = normalize(name);
  if (state.indexByName.has(key)) return state.indexByName.get(key);
  return state.all.findIndex(c => normalize(c.fullName).includes(key));
}

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}