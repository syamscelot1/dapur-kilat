// The kitchen itself: where every station sits, what each station holds,
// and how cooking progresses (chop / fry / boil / grill, then the burn clock).
// Pure layout + timers — no drawing, no input — so the rules can be stepped
// by the game loop, by tests, and by the screenshot stager alike.
import { BURN_SECONDS, CANVAS_H, CANVAS_W, INGREDIENTS, PROCESS, recipesForDay } from './config.js';

export const STATION_KIND = {
  CRATE: 'crate',
  BOARD: 'talenan',
  STOVE: 'wajan',
  POT: 'panci',
  GRILL: 'panggangan',
  PLATE: 'plating',
  TRASH: 'trash',
  SERVE: 'serve',
  BOOK: 'book',
};

function rect(x, y, w, h) { return { x, y, w, h }; }

// Ingredient crates run down the left wall as full-width shelves — one
// ingredient per row, so the shelf the chef stands in front of is always
// the nearest one. (A two-column grid was tried first: the right column
// shadowed the left one and the chef kept grabbing the wrong ingredient.)
const CRATE_IDS = ['nasi', 'ayam', 'telur', 'cabai', 'sayur', 'mie', 'pisang', 'teh'];
function crateStations() {
  return CRATE_IDS.map((id, i) => ({
    id: `crate-${id}`, kind: STATION_KIND.CRATE, ing: id,
    label: INGREDIENTS[id].name,
    ...rect(24, 126 + i * 74, 168, 66),
  }));
}

export function buildStations() {
  return [
    ...crateStations(),
    { id: 'board-1', kind: STATION_KIND.BOARD, label: 'Talenan', ...rect(300, 200, 130, 76) },
    { id: 'board-2', kind: STATION_KIND.BOARD, label: 'Talenan', ...rect(300, 330, 130, 76) },
    { id: 'stove-1', kind: STATION_KIND.STOVE, label: 'Wajan', ...rect(520, 200, 130, 76) },
    { id: 'stove-2', kind: STATION_KIND.STOVE, label: 'Wajan', ...rect(520, 330, 130, 76) },
    { id: 'pot-1', kind: STATION_KIND.POT, label: 'Panci', ...rect(740, 200, 130, 76) },
    { id: 'grill-1', kind: STATION_KIND.GRILL, label: 'Panggangan', ...rect(740, 330, 130, 76) },
    { id: 'plate-1', kind: STATION_KIND.PLATE, label: 'Meja Plating', ...rect(460, 560, 360, 84) },
    { id: 'trash-1', kind: STATION_KIND.TRASH, label: 'Sampah', ...rect(1090, 590, 110, 90) },
    { id: 'serve-1', kind: STATION_KIND.SERVE, label: 'Jendela Saji', ...rect(1000, 52, 256, 62) },
    { id: 'book-1', kind: STATION_KIND.BOOK, label: 'Buku Resep', ...rect(1000, 180, 256, 330) },
  ];
}

// A processing slot on a board / stove / pot / grill.
// { ing, process, progress, duration, done, burn, burnt }
export function emptySlot() {
  return { ing: null, process: null, progress: 0, duration: 0, done: false, burn: 0, burnt: false };
}

export function createState() {
  const stations = buildStations();
  const slots = {};
  for (const s of stations) {
    if (s.kind === STATION_KIND.BOARD || s.kind === STATION_KIND.STOVE
      || s.kind === STATION_KIND.POT || s.kind === STATION_KIND.GRILL) {
      slots[s.id] = emptySlot();
    }
  }
  return {
    day: 1,
    coins: 0,
    dayCoins: 0,
    timeLeft: 180,
    combo: 0,
    comboPop: 0, // 1 just after a serve, decays to 0; the HUD pops the combo text
    bestCombo: 0,
    served: 0,
    wasted: 0,
    orders: [],
    orderSeq: 0,
    spawnIn: 6,
    player: null, // set by player.js
    stations,
    slots,
    plates: [ // two reusable plates live on the plating table
      { id: 'plate-a', x: 500, y: 576, homeX: 500, homeY: 576, carried: false, items: [], dish: null },
      { id: 'plate-b', x: 640, y: 576, homeX: 640, homeY: 576, carried: false, items: [], dish: null },
    ],
    recipes: recipesForDay(1),
    smoke: [], // { x, y, life } particles
    floats: [], // { x, y, text, color, life } floating score text
    rush: false,
    sizzle: 0, // seconds of sizzle sound left (audio reads this)
    events: [], // one-frame event names for audio: 'pickup','chop','sizzle','ding','error','burn','serve','coin'
  };
}

export function stationAt(stations, x, y) {
  for (const s of stations) {
    if (x >= s.x - 6 && x <= s.x + s.w + 6 && y >= s.y - 6 && y <= s.y + s.h + 6) return s;
  }
  return null;
}

// Nearest station whose edge is within reach of the player centre.
// The recipe book is decoration, not a station: it never answers an
// interaction (it used to shadow the serving window above it).
export function nearestStation(state, px, py, reach = 64) {
  let best = null;
  let bestD = Infinity;
  for (const s of state.stations) {
    if (s.kind === STATION_KIND.BOOK) continue;
    const cx = Math.max(s.x, Math.min(px, s.x + s.w));
    const cy = Math.max(s.y, Math.min(py, s.y + s.h));
    const d = Math.hypot(px - cx, py - cy);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD <= reach ? best : null;
}

export function stationSlot(state, station) {
  return state.slots[station.id] || null;
}

export function processFor(stationKind, ing) {
  const def = INGREDIENTS[ing];
  if (!def) return null;
  for (const p of def.processes) {
    if (PROCESS[p].station === stationKind) return p;
  }
  return null;
}

// Advance every processing slot: cook timers, the burn clock, smoke.
export function stepStations(state, dt) {
  for (const id of Object.keys(state.slots)) {
    const slot = state.slots[id];
    if (!slot.ing) continue;
    if (!slot.done) {
      slot.progress += dt;
      if (slot.progress >= slot.duration) {
        slot.progress = slot.duration;
        slot.done = true;
        slot.burn = 0;
        state.events.push('done');
      }
    } else if (!slot.burnt) {
      slot.burn += dt;
      if (slot.burn >= BURN_SECONDS) {
        slot.burnt = true;
        state.events.push('burn');
      }
    }
  }
  // Smoke puffs from anything actively cooking.
  for (const id of Object.keys(state.slots)) {
    const slot = state.slots[id];
    const station = state.stations.find((s) => s.id === id);
    if (!slot.ing || slot.done || !station) continue;
    if (Math.random() < dt * 6) {
      state.smoke.push({
        x: station.x + station.w / 2 + (Math.random() - 0.5) * 40,
        y: station.y + 8,
        life: 0.9 + Math.random() * 0.5,
        max: 1.4,
      });
    }
  }
  for (let i = state.smoke.length - 1; i >= 0; i -= 1) {
    const p = state.smoke[i];
    p.life -= dt;
    p.y -= 34 * dt;
    if (p.life <= 0) state.smoke.splice(i, 1);
  }
  for (let i = state.floats.length - 1; i >= 0; i -= 1) {
    const f = state.floats[i];
    f.life -= dt;
    f.y -= 26 * dt;
    if (f.life <= 0) state.floats.splice(i, 1);
  }
}

export function addFloat(state, x, y, text, color) {
  state.floats.push({ x, y, text, color: color || '#ffffff', life: 1.2 });
}

export function inKitchen(x, y) {
  return x > 16 && x < CANVAS_W - 16 && y > 124 && y < CANVAS_H - 12;
}
