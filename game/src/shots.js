// Deterministic screenshot scenes (?shot=cover|chop|serve|rush). Each one
// builds a real mid-game state with the real world model — orders, a cooking
// station mid-progress, a plate mid-assembly — and hands it to the real
// renderer, so every screenshot is exactly what a player sees.
import { recipesForDay } from './config.js';
import { createState } from './world.js';
import { createPlayer } from './player.js';

function baseState(day, coins, dayCoins, timeLeft, combo) {
  const state = createState();
  state.day = day;
  state.recipes = recipesForDay(day);
  state.coins = coins;
  state.dayCoins = dayCoins;
  state.timeLeft = timeLeft;
  state.combo = combo;
  state.bestCombo = Math.max(combo, 2);
  state.served = 5 + day * 2;
  state.player = createPlayer();
  return state;
}

function addOrder(state, recipeId, name, color, patience, maxPatience) {
  state.orders.push({ id: state.orders.length + 1, recipeId, name, color, patience, maxPatience, born: 0 });
}

function setSlot(state, stationId, ing, process, progress, duration, done) {
  state.slots[stationId] = { ing, process, progress, duration, done, burn: done ? 2 : 0, burnt: false };
}

export function stageShot(name, state) {
  // The caller passes a fresh state; we rebuild it per scene.
  let s = state;
  if (name === 'chop') {
    s = baseState(1, 42, 42, 141, 1);
    s.player.x = 430; s.player.y = 300;
    addOrder(s, 'nasi-goreng', 'Nasi Goreng Kilat', '#e8963c', 34, 48);
    addOrder(s, 'mie-ayam', 'Mie Ayam', '#f2c14e', 26, 48);
    setSlot(s, 'board-1', 'cabai', 'potong', 1.1, 2.0, false);
    setSlot(s, 'stove-1', 'nasi', 'goreng', 2.4, 3.0, false);
    s.smoke.push({ x: 585, y: 210, life: 1.0, max: 1.4 });
    s.plates[0].items = [{ ing: 'nasi', process: 'goreng' }];
    s.plates[1].items = [{ ing: 'mie', process: 'rebus' }];
    return s;
  }
  if (name === 'serve') {
    s = baseState(2, 168, 168, 88, 4);
    // Chef below the serving window, a step left so the plate he carries
    // clears the recipe book's title.
    s.player.x = 1010; s.player.y = 185;
    addOrder(s, 'ayam-geprek', 'Ayam Geprek', '#d92b1f', 30, 42);
    addOrder(s, 'gado-gado', 'Gado-Gado', '#4da34d', 18, 42);
    s.plates[0].items = [
      { ing: 'ayam', process: 'goreng' },
      { ing: 'cabai', process: 'potong' },
    ];
    s.plates[0].dish = 'ayam-geprek';
    s.plates[0].carried = true;
    s.player.carry = { type: 'plate', plate: s.plates[0] };
    s.plates[0].x = s.player.x - 26;
    s.plates[0].y = s.player.y - 14;
    setSlot(s, 'pot-1', 'telur', 'rebus', 4.0, 4.0, true);
    return s;
  }
  if (name === 'rush') {
    s = baseState(3, 312, 312, 45, 5);
    s.player.x = 640; s.player.y = 470;
    addOrder(s, 'soto-ayam', 'Soto Ayam', '#f6b73c', 8, 36);
    addOrder(s, 'sate-ayam', 'Sate Ayam', '#b06a3b', 14, 36);
    addOrder(s, 'nasi-goreng', 'Nasi Goreng Kilat', '#e8963c', 20, 36);
    addOrder(s, 'mie-ayam', 'Mie Ayam', '#f2c14e', 27, 36);
    s.rush = true;
    setSlot(s, 'stove-1', 'ayam', 'goreng', 2.9, 3.0, false);
    setSlot(s, 'stove-2', 'nasi', 'goreng', 1.2, 3.0, false);
    setSlot(s, 'board-1', 'sayur', 'potong', 2.0, 2.0, true);
    setSlot(s, 'grill-1', 'ayam', 'panggang', 4.2, 5.0, false);
    s.smoke.push({ x: 585, y: 210, life: 1.1, max: 1.4 });
    s.smoke.push({ x: 585, y: 340, life: 0.8, max: 1.4 });
    s.plates[0].items = [{ ing: 'ayam', process: 'rebus' }, { ing: 'sayur', process: 'potong' }];
    s.plates[0].dish = 'soto-ayam';
    s.plates[1].items = [{ ing: 'mie', process: 'rebus' }];
    return s;
  }
  // cover (default): the whole kitchen at its busiest readable moment.
  s = baseState(1, 85, 85, 92, 3);
  s.player.x = 600; s.player.y = 520;
  addOrder(s, 'nasi-goreng', 'Nasi Goreng Kilat', '#e8963c', 34, 48);
  addOrder(s, 'mie-ayam', 'Mie Ayam', '#f2c14e', 26, 48);
  addOrder(s, 'es-teh', 'Es Teh Manis', '#a9713f', 40, 48);
  setSlot(s, 'stove-1', 'nasi', 'goreng', 1.8, 3.0, false);
  setSlot(s, 'board-1', 'cabai', 'potong', 2.0, 2.0, true);
  setSlot(s, 'pot-1', 'mie', 'rebus', 3.1, 4.0, false);
  s.smoke.push({ x: 585, y: 210, life: 1.0, max: 1.4 });
  s.plates[0].items = [{ ing: 'nasi', process: 'goreng' }, { ing: 'telur', process: 'goreng' }];
  s.plates[0].carried = true;
  s.player.carry = { type: 'plate', plate: s.plates[0] };
  s.plates[0].x = s.player.x - 26;
  s.plates[0].y = s.player.y - 14;
  s.plates[1].items = [{ ing: 'teh', process: 'langsung' }];
  s.plates[1].dish = 'es-teh';
  s.floats.push({ x: 640, y: 300, text: '+38 koin', color: '#ffd94d', life: 1.2 });
  return s;
}
