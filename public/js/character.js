// Endpoints
const API_TRONOS = 'https://thronesapi.com/api/v2/Characters';
const API_HIELO_FUEGO = 'https://anapioficeandfire.com/api/characters';

const $ = (sel) => document.querySelector(sel);

// Referencias a elementos del DOM (ids originales se conservan)
const elementos = {
  entradaBusqueda: $('#searchInput'),
  botonBusqueda:   $('#searchButton'),

  nombre:          $('#character-firstName'),
  apellido:        $('#character-lastName'),
  identificador:   $('#character-id'),
  nacimiento:      $('#character-born'),
  muerte:          $('#character-dead'),
  familia:         $('#character-family'),
  titulos:         $('#character-titles'),
  alias:           $('#character-aliases'),

  imagen:          $('#character-image'),
  escudo:          $('#family-crest'),

  anterior:        $('#prevButton'),
  siguiente:       $('#nextButton'),

  errorPantalla:   $('#error-screen'),
  volverAlInicio:  $('#back-to-start')
};

const CORRECCIONES_NOMBRE = new Map([
  ['ned stark', 'Eddard Stark'],
  ['littlefinger', 'Petyr Baelish'],
  ['the hound', 'Sandor Clegane'],
  ['the mountain', 'Gregor Clegane'],
  ['the imp', 'Tyrion Lannister'],
  ['kingslayer', 'Jaime Lannister'],
  ['jon', 'Jon Snow'],
  ['arya', 'Arya Stark'],
  ['sansa', 'Sansa Stark'],
  ['bran', 'Brandon Stark'],
  ['robb', 'Robb Stark'],
  ['dany', 'Daenerys Targaryen'],
]);

const estado = {
  todos: [],
  indicePorNombre: new Map(),
  indiceActual: -1,
  tokenEnriquecimiento: 0
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    await loadAll();
    wireEvents();

    const nombreInicial = getQueryName();
    if (nombreInicial) {
      const ok = goToByName(nombreInicial, { push: false });
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
  const res = await fetch(API_TRONOS);
  if (!res.ok) throw new Error(`ThronesAPI error ${res.status}`);
  const datos = await res.json();

  estado.todos = datos
    .map(p => ({
      id: p.id,
      firstName: (p.firstName || '').trim(),
      lastName:  (p.lastName  || '').trim(),
      fullName:  `${p.firstName || ''} ${p.lastName || ''}`.trim(),
      title:     p.title  || '',
      family:    p.family || '',
      imageUrl:  p.imageUrl || ''
    }))
    .sort((a, b) => a.id - b.id);

  estado.indicePorNombre.clear();
  estado.todos.forEach((p, i) => {
    estado.indicePorNombre.set(normalize(p.fullName), i);
  });
}

function wireEvents() {
  elementos.botonBusqueda?.addEventListener('click', onSearch);
  elementos.entradaBusqueda?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  });

  elementos.anterior?.addEventListener('click', () => move(-1));
  elementos.siguiente?.addEventListener('click', () => move(1));

  elementos.volverAlInicio?.addEventListener('click', (e) => {
    e.preventDefault();
    location.href = 'index.html';
  });

  window.addEventListener('popstate', () => {
    const nombre = getQueryName();
    if (nombre) {
      goToByName(nombre, { push: false });
    }
  });
}

function onSearch() {
  const q = (elementos.entradaBusqueda?.value || '').trim();
  if (!q) return;
  goToByName(q, { push: true, scrollTop: true });
}

function goToByName(name, { push = true, scrollTop = false } = {}) {
  hideNotFound();

  const indice = findIndexForName(name);
  if (indice === -1) {
    showNotFound();
    return false;
  }

  estado.indiceActual = indice;
  const personaje = estado.todos[indice];
  renderBase(personaje);
  updateNavButtons();

  const url = new URL(location.href);
  url.searchParams.set('characterName', personaje.fullName);
  if (push) history.pushState({ id: personaje.id }, '', url.toString());
  if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });

  enrichForCurrent(personaje, indice).catch(err => console.error('Enrichment error:', err));

  return true;
}

function move(delta) {
  if (estado.indiceActual < 0) return;
  const siguienteIndice = clamp(estado.indiceActual + delta, 0, estado.todos.length - 1);
  const destino = estado.todos[siguienteIndice];
  if (!destino) return;
  goToByName(destino.fullName, { push: true, scrollTop: false });
}

function renderBase(personaje) {
  elementos.nombre.textContent        = personaje.firstName || 'N/A';
  elementos.apellido.textContent      = personaje.lastName  || '';
  elementos.identificador.textContent = personaje.id;
  elementos.familia.textContent       = personaje.family || 'N/A';

  if (personaje.imageUrl) {
    elementos.imagen.src = personaje.imageUrl;
    elementos.imagen.alt = `${personaje.fullName} portrait`;
  }

  setList(elementos.titulos, personaje.title ? [personaje.title] : ['N/A']);
  setList(elementos.alias, ['N/A']);

  elementos.nacimiento.textContent = 'N/A';
  elementos.muerte.textContent     = 'N/A';

  hideNotFound();
}

async function enrichForCurrent(personaje, indice) {
  const miToken = ++estado.tokenEnriquecimiento;

  const coincidencia = await findIceAndFireMatch(personaje.fullName);
  if (miToken !== estado.tokenEnriquecimiento || indice !== estado.indiceActual) return;

  if (!coincidencia) return;

  const nacimiento = cleanText(coincidencia.born) || 'N/A';
  const muerte     = cleanText(coincidencia.died) || 'N/A';
  const titulosIF  = (coincidencia.titles  || []).map(cleanText).filter(Boolean);
  const aliasIF    = (coincidencia.aliases || []).map(cleanText).filter(Boolean);

  const titulosActuales = Array
    .from(elementos.titulos.querySelectorAll('li'))
    .map(li => li.textContent.trim())
    .filter(Boolean);

  const titulosCombinados = uniq([
    ...titulosActuales.filter(t => t !== 'N/A'),
    ...titulosIF
  ]);

  setList(elementos.titulos, titulosCombinados.length ? titulosCombinados : ['N/A']);
  setList(elementos.alias, aliasIF.length ? aliasIF : ['N/A']);

  elementos.nacimiento.textContent = nacimiento;
  elementos.muerte.textContent     = muerte;
}

async function findIceAndFireMatch(fullName) {
  const principal = await fetchIceByName(fullName);
  if (principal) return principal;

  const correccion = CORRECCIONES_NOMBRE.get(normalize(fullName));
  if (correccion) {
    const corregido = await fetchIceByName(correccion);
    if (corregido) return corregido;
  }

  const normalizado = denormalizeCandidate(fullName);
  if (normalizado && normalizado !== fullName) {
    const alterno = await fetchIceByName(normalizado);
    if (alterno) return alterno;
  }

  return null;
}

async function fetchIceByName(name) {
  const url = `${API_HIELO_FUEGO}?name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Ice&Fire error ${res.status} for`, name);
    return null;
  }
  const arr = await res.json();
  if (!Array.isArray(arr) || arr.length === 0) return null;

  const exacto = arr.find(x => normalize(x.name) === normalize(name));
  return exacto || arr[0];
}

function updateNavButtons() {
  const i = estado.indiceActual;
  elementos.anterior.disabled  = i <= 0;
  elementos.siguiente.disabled = i >= (estado.todos.length - 1);
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

function showNotFound()  { if (elementos.errorPantalla) elementos.errorPantalla.style.display = 'block'; }
function hideNotFound()  { if (elementos.errorPantalla) elementos.errorPantalla.style.display = 'none'; }

function getQueryName() {
  const params = new URLSearchParams(location.search);
  return params.get('characterName');
}

function findIndexForName(name) {
  const clave = normalize(name);
  if (estado.indicePorNombre.has(clave)) return estado.indicePorNombre.get(clave);
  return estado.todos.findIndex(p => normalize(p.fullName).includes(clave));
}

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function denormalizeCandidate(name) {
  return (name || '')
    .replace(/['’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(s) {
  if (!s) return '';
  const t = String(s).trim();
  return t === 'Unknown' || t === 'unknown' ? '' : t;
}

function uniq(arr) {
  const vistos = new Set();
  const salida = [];
  for (const x of arr) {
    const k = normalize(x);
    if (!k || vistos.has(k)) continue;
    vistos.add(k);
    salida.push(x);
  }
  return salida;
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
