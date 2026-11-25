// Dapur Ngebul — all tuning in one place: canvas, ingredients, recipes, days.
// Wajan mengepul, pesanan menumpuk: every number below feeds that rush.
// Nothing here is copied from any other game: every dish is Indonesian,
// every name, colour and price was picked for this kitchen.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 180;

export const COLORS = {
  floorA: '#e8d5a8',
  floorB: '#dfc794',
  wall: '#8a5a3b',
  counter: '#b06a3b',
  counterTop: '#d9a066',
  steel: '#9aa5ad',
  steelDark: '#6e7a82',
  board: '#c98f4e',
  hud: '#2b1d12',
  hudText: '#ffe9b0',
  ticket: '#fff6d8',
  ticketEdge: '#d9b45b',
  plate: '#f4f6f8',
  accent: '#e8452c',
  accent2: '#2e9e5b',
  gold: '#f6b73c',
};

// Ingredient catalogue. `processes` lists what a station may do to it.
export const INGREDIENTS = {
  nasi: { name: 'Nasi', color: '#fff8e7', processes: ['goreng'], price: 4 },
  ayam: { name: 'Ayam', color: '#f2b8a0', processes: ['goreng', 'rebus', 'panggang'], price: 8 },
  telur: { name: 'Telur', color: '#ffd94d', processes: ['goreng', 'rebus'], price: 5 },
  cabai: { name: 'Cabai', color: '#d92b1f', processes: ['potong'], price: 3 },
  sayur: { name: 'Sayur', color: '#4da34d', processes: ['potong'], price: 4 },
  mie: { name: 'Mie', color: '#f2c14e', processes: ['rebus'], price: 5 },
  pisang: { name: 'Pisang', color: '#ffe066', processes: ['goreng'], price: 4 },
  teh: { name: 'Teh', color: '#a9713f', processes: ['langsung'], price: 3 },
};

export const PROCESS = {
  potong: { name: 'Potong', verb: 'Memotong', seconds: 2.0, station: 'talenan' },
  goreng: { name: 'Goreng', verb: 'Menggoreng', seconds: 3.0, station: 'wajan' },
  rebus: { name: 'Rebus', verb: 'Merebus', seconds: 4.0, station: 'panci' },
  panggang: { name: 'Panggang', verb: 'Memanggang', seconds: 5.0, station: 'panggangan' },
  langsung: { name: 'Siap', verb: 'Diseduh', seconds: 0, station: null },
};

// A dish is a set of components: { ing, process }. The plate is finished
// when its components match a recipe exactly (order does not matter).
export const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng Kilat', day: 1, price: 38,
    needs: [{ ing: 'nasi', process: 'goreng' }, { ing: 'telur', process: 'goreng' }, { ing: 'cabai', process: 'potong' }],
    color: '#e8963c', blurb: 'Nasi + telur goreng + cabai potong',
  },
  {
    id: 'mie-ayam', name: 'Mie Ayam', day: 1, price: 34,
    needs: [{ ing: 'mie', process: 'rebus' }, { ing: 'ayam', process: 'rebus' }],
    color: '#f2c14e', blurb: 'Mie + ayam rebus',
  },
  {
    id: 'es-teh', name: 'Es Teh Manis', day: 1, price: 16,
    needs: [{ ing: 'teh', process: 'langsung' }],
    color: '#a9713f', blurb: 'Teh langsung disajikan',
  },
  {
    id: 'pisang-goreng', name: 'Pisang Goreng', day: 1, price: 22,
    needs: [{ ing: 'pisang', process: 'goreng' }],
    color: '#ffe066', blurb: 'Pisang digoreng renyah',
  },
  {
    id: 'ayam-geprek', name: 'Ayam Geprek', day: 2, price: 42,
    needs: [{ ing: 'ayam', process: 'goreng' }, { ing: 'cabai', process: 'potong' }],
    color: '#d92b1f', blurb: 'Ayam goreng + cabai potong',
  },
  {
    id: 'gado-gado', name: 'Gado-Gado', day: 2, price: 36,
    needs: [{ ing: 'sayur', process: 'potong' }, { ing: 'telur', process: 'rebus' }],
    color: '#4da34d', blurb: 'Sayur potong + telur rebus',
  },
  {
    id: 'soto-ayam', name: 'Soto Ayam', day: 3, price: 46,
    needs: [{ ing: 'ayam', process: 'rebus' }, { ing: 'sayur', process: 'potong' }],
    color: '#f6b73c', blurb: 'Ayam rebus + sayur potong',
  },
  {
    id: 'sate-ayam', name: 'Sate Ayam', day: 3, price: 48,
    needs: [{ ing: 'ayam', process: 'panggang' }],
    color: '#b06a3b', blurb: 'Ayam dipanggang perlahan',
  },
];

export const DAYS = [
  { day: 1, target: 150, spawnEvery: 14, patience: 48, label: 'Hari 1 — Pembukaan' },
  { day: 2, target: 250, spawnEvery: 11, patience: 42, label: 'Hari 2 — Makin Ramai' },
  { day: 3, target: 400, spawnEvery: 9, patience: 36, label: 'Hari 3 — Grand Final' },
];

export const MAX_ORDERS = 4;
export const BURN_SECONDS = 6; // after a cook finishes, this long before it burns
export const WRONG_DISH_PENALTY = 10;
export const EXPIRED_PENALTY = 15;
export const COMBO_STEP = 0.1; // +10% pay per combo step
export const COMBO_MAX = 2.0;
export const STAR_THRESHOLDS = { three: 950, two: 800 }; // total coins for 3 / 2 stars

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export function recipesForDay(day) {
  return RECIPES.filter((r) => r.day <= day);
}

export function componentKey(ing, process) {
  return `${ing}:${process}`;
}
