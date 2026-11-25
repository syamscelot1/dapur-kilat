// The chef: movement, collision with the counters, and the one big
// context action (E / Space / click) that does the right thing at whatever
// station the chef is standing next to.
import { PROCESS, recipeById, componentKey } from './config.js';
import { STATION_KIND, inKitchen, nearestStation, processFor, stationSlot, addFloat } from './world.js';
import { servePlate } from './orders.js';

export const PLAYER_SPEED = 265;
export const PLAYER_RADIUS = 18;

export function createPlayer() {
  return {
    x: 640, y: 470, dir: 'down', moving: false, walkPhase: 0,
    carry: null, // { type:'ing', ing } | { type:'food', ing, process, burnt } | { type:'plate', plate }
  };
}

const SOLID_KINDS = new Set([
  STATION_KIND.CRATE, STATION_KIND.BOARD, STATION_KIND.STOVE,
  STATION_KIND.POT, STATION_KIND.GRILL, STATION_KIND.PLATE, STATION_KIND.TRASH,
  STATION_KIND.BOOK,
]);

function collide(state, p) {
  for (const s of state.stations) {
    if (!SOLID_KINDS.has(s.kind)) continue;
    const cx = Math.max(s.x, Math.min(p.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(p.y, s.y + s.h));
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= PLAYER_RADIUS * PLAYER_RADIUS) continue;
    if (d2 === 0) {
      // Inside the rect: push out along the nearest edge, never blindly down.
      const toLeft = p.x - s.x + PLAYER_RADIUS;
      const toRight = s.x + s.w - p.x + PLAYER_RADIUS;
      const toTop = p.y - s.y + PLAYER_RADIUS;
      const toBottom = s.y + s.h - p.y + PLAYER_RADIUS;
      const m = Math.min(toLeft, toRight, toTop, toBottom);
      if (m === toLeft) p.x = s.x - PLAYER_RADIUS;
      else if (m === toRight) p.x = s.x + s.w + PLAYER_RADIUS;
      else if (m === toTop) p.y = s.y - PLAYER_RADIUS;
      else p.y = s.y + s.h + PLAYER_RADIUS;
      continue;
    }
    const d = Math.sqrt(d2);
    p.x = cx + (dx / d) * PLAYER_RADIUS;
    p.y = cy + (dy / d) * PLAYER_RADIUS;
  }
  p.x = Math.max(20, Math.min(1260, p.x));
  p.y = Math.max(100, Math.min(706, p.y));
}

export function stepPlayer(state, dt, input) {
  const p = state.player;
  const v = input.moveVector();
  p.moving = v.x !== 0 || v.y !== 0;
  if (p.moving) {
    if (Math.abs(v.y) > Math.abs(v.x)) p.dir = v.y > 0 ? 'down' : 'up';
    else p.dir = v.x > 0 ? 'right' : 'left';
    p.x += v.x * PLAYER_SPEED * dt;
    p.y += v.y * PLAYER_SPEED * dt;
    p.walkPhase += dt * 10;
  }
  collide(state, p);
  // A carried plate rides in the chef's hands.
  if (p.carry && p.carry.type === 'plate') {
    p.carry.plate.x = p.x - 26;
    p.carry.plate.y = p.y - 14;
  }
}

function nearestPlateOnTable(state) {
  let best = null;
  let bestD = Infinity;
  for (const plate of state.plates) {
    if (plate.carried) continue;
    const d = Math.hypot(plate.x + 26 - state.player.x, plate.y + 20 - state.player.y);
    if (d < bestD) { bestD = d; best = plate; }
  }
  return best;
}

// Does this plate's contents finish a recipe? Sets plate.dish when it does.
function checkDish(state, plate) {
  const keys = plate.items.map((c) => componentKey(c.ing, c.process)).sort().join('|');
  for (const r of state.recipes || []) {
    const want = r.needs.map((n) => componentKey(n.ing, n.process)).sort().join('|');
    if (want === keys) {
      plate.dish = r.id;
      addFloat(state, plate.x + 26, plate.y - 8, `${r.name} jadi!`, '#ffd94d');
      state.events.push('ding');
      return true;
    }
  }
  return false;
}

export function interact(state) {
  const p = state.player;
  const station = nearestStation(state, p.x, p.y);
  if (!station) return;
  const carry = p.carry;

  if (station.kind === STATION_KIND.CRATE) {
    if (carry) { addFloat(state, p.x, p.y - 30, 'Tangan penuh!', '#ffb0a0'); return; }
    p.carry = { type: 'ing', ing: station.ing };
    state.events.push('pickup');
    return;
  }

  if (station.kind === STATION_KIND.BOARD || station.kind === STATION_KIND.STOVE
    || station.kind === STATION_KIND.POT || station.kind === STATION_KIND.GRILL) {
    const slot = stationSlot(state, station);
    if (!slot) return;
    if (!slot.ing) {
      if (!carry || carry.type !== 'ing') return;
      const proc = processFor(station.kind, carry.ing);
      if (!proc) {
        addFloat(state, p.x, p.y - 30, 'Tidak bisa di sini', '#ffb0a0');
        state.events.push('error');
        return;
      }
      slot.ing = carry.ing;
      slot.process = proc;
      slot.duration = PROCESS[proc].seconds;
      slot.progress = 0;
      slot.done = false;
      slot.burn = 0;
      slot.burnt = false;
      p.carry = null;
      state.events.push(proc === 'potong' ? 'chop' : 'sizzle');
      if (proc !== 'potong') state.sizzle = Math.max(state.sizzle, 1.2);
      return;
    }
    // Slot occupied.
    if (!slot.done) {
      addFloat(state, p.x, p.y - 30, `${PROCESS[slot.process].verb}...`, '#ffe9b0');
      return;
    }
    if (carry) { addFloat(state, p.x, p.y - 30, 'Tangan penuh!', '#ffb0a0'); return; }
    p.carry = { type: 'food', ing: slot.ing, process: slot.process, burnt: slot.burnt };
    state.slots[station.id] = { ing: null, process: null, progress: 0, duration: 0, done: false, burn: 0, burnt: false };
    state.events.push('pickup');
    return;
  }

  if (station.kind === STATION_KIND.PLATE) {
    // Putting a carried plate back on the table.
    if (carry && carry.type === 'plate') {
      const plate = carry.plate;
      plate.carried = false;
      plate.x = plate.homeX;
      plate.y = plate.homeY;
      p.carry = null;
      state.events.push('pickup');
      return;
    }
    // Adding food to a plate.
    if (carry && carry.type === 'food') {
      if (carry.burnt) {
        addFloat(state, p.x, p.y - 30, 'Gosong! Buang dulu', '#ff6b5e');
        state.events.push('error');
        return;
      }
      const plate = nearestPlateOnTable(state);
      if (!plate) return;
      if (plate.dish) { addFloat(state, p.x, p.y - 30, 'Piring sudah jadi', '#ffb0a0'); return; }
      const key = componentKey(carry.ing, carry.process);
      if (plate.items.some((c) => componentKey(c.ing, c.process) === key)) {
        addFloat(state, p.x, p.y - 30, 'Sudah ada di piring', '#ffb0a0');
        return;
      }
      plate.items.push({ ing: carry.ing, process: carry.process });
      p.carry = null;
      state.events.push('place');
      checkDish(state, plate);
      return;
    }
    // Teh goes straight onto a plate (no cooking needed).
    if (carry && carry.type === 'ing' && carry.ing === 'teh') {
      const plate = nearestPlateOnTable(state);
      if (!plate || plate.dish) return;
      plate.items.push({ ing: 'teh', process: 'langsung' });
      p.carry = null;
      state.events.push('place');
      checkDish(state, plate);
      return;
    }
    // Empty hands: pick a plate up.
    if (!carry) {
      const plate = nearestPlateOnTable(state);
      if (!plate) return;
      plate.carried = true;
      p.carry = { type: 'plate', plate };
      state.events.push('pickup');
    }
    return;
  }

  if (station.kind === STATION_KIND.TRASH) {
    if (!carry) return;
    if (carry.type === 'food') {
      state.wasted += 1;
      p.carry = null;
      addFloat(state, p.x, p.y - 30, 'Dibuang', '#c9c9c9');
      state.events.push('trash');
      return;
    }
    if (carry.type === 'ing') {
      state.wasted += 1;
      p.carry = null;
      addFloat(state, p.x, p.y - 30, 'Dibuang', '#c9c9c9');
      state.events.push('trash');
      return;
    }
    if (carry.type === 'plate') {
      if (carry.plate.items.length > 0) {
        carry.plate.items = [];
        carry.plate.dish = null;
        state.wasted += 1;
        addFloat(state, p.x, p.y - 30, 'Piring dikosongkan', '#c9c9c9');
        state.events.push('trash');
      }
    }
    return;
  }

  if (station.kind === STATION_KIND.SERVE) {
    if (carry && carry.type === 'plate') {
      const result = servePlate(state, carry.plate);
      if (result.ok) {
        state.events.push('coin');
      } else if (result.reason === 'empty') {
        addFloat(state, p.x, p.y - 30, 'Piring belum jadi hidangan', '#ffb0a0');
        state.events.push('error');
      }
    }
    return;
  }
}

// Clicking a station the chef stands next to does the same thing as E.
export function clickInteract(state, x, y) {
  const station = nearestStation(state, x, y, 90);
  if (!station) return;
  const p = state.player;
  const near = nearestStation(state, p.x, p.y, 64);
  if (near && near.id === station.id) interact(state);
  else addFloat(state, p.x, p.y - 30, 'Terlalu jauh!', '#ffb0a0');
}
