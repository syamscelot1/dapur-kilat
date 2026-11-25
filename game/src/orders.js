// Order tickets: what the customers want, how patient they are, and what a
// correct (or wrong) serve is worth. Orders are the game's clock — they get
// faster and less patient every day, and a full board is a rush.
import { COMBO_MAX, COMBO_STEP, DAYS, EXPIRED_PENALTY, MAX_ORDERS, WRONG_DISH_PENALTY, recipeById, recipesForDay } from './config.js';
import { addFloat } from './world.js';

let orderCounter = 0;

export function pickRecipe(state, rng) {
  const pool = recipesForDay(state.day);
  return pool[Math.floor(rng() * pool.length)];
}

export function spawnOrder(state, rng) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const day = DAYS[state.day - 1];
  const recipe = pickRecipe(state, rng);
  orderCounter += 1;
  const order = {
    id: orderCounter,
    recipeId: recipe.id,
    name: recipe.name,
    color: recipe.color,
    patience: day.patience,
    maxPatience: day.patience,
    born: state.timeLeft,
  };
  state.orders.push(order);
  return order;
}

function tipFor(order, recipe) {
  const frac = Math.max(0, order.patience / order.maxPatience);
  return Math.round(4 + frac * 14);
}

function comboMultiplier(state) {
  return Math.min(COMBO_MAX, 1 + COMBO_STEP * Math.max(0, state.combo - 1));
}

// Serve the dish on `plate` (a plate object from state.plates, or a carried
// plate). Returns { ok, reason, earned } and mutates coins/combo/orders.
export function servePlate(state, plate) {
  if (!plate || !plate.dish) return { ok: false, reason: 'empty' };
  const recipe = recipeById(plate.dish);
  const idx = state.orders.findIndex((o) => o.recipeId === plate.dish);
  const px = state.player ? state.player.x : 1130;
  const py = 120;
  if (idx === -1) {
    state.combo = 0;
    state.coins = Math.max(0, state.coins - WRONG_DISH_PENALTY);
    state.dayCoins = Math.max(0, state.dayCoins - WRONG_DISH_PENALTY);
    addFloat(state, px, py, `Salah! -${WRONG_DISH_PENALTY}`, '#ff6b5e');
    state.events.push('error');
    return { ok: false, reason: 'wrong', earned: 0 };
  }
  const order = state.orders[idx];
  state.orders.splice(idx, 1);
  const tip = tipFor(order, recipe);
  const earned = Math.round((recipe.price + tip) * comboMultiplier(state));
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.coins += earned;
  state.dayCoins += earned;
  state.served += 1;
  addFloat(state, px, py, `+${earned} koin${state.combo > 1 ? `  kombo x${state.combo}` : ''}`, '#ffd94d');
  state.events.push('serve');
  plate.items = [];
  plate.dish = null;
  return { ok: true, reason: 'served', earned };
}

// Advance the order clock: spawn new tickets, drain patience, expire the
// ones that ran out (combo resets, coins lost).
export function stepOrders(state, dt, rng) {
  const day = DAYS[state.day - 1];
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.orders.length < MAX_ORDERS) {
    spawnOrder(state, rng);
    state.spawnIn = day.spawnEvery;
  }
  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const o = state.orders[i];
    o.patience -= dt;
    if (o.patience <= 0) {
      state.orders.splice(i, 1);
      state.combo = 0;
      state.coins = Math.max(0, state.coins - EXPIRED_PENALTY);
      state.dayCoins = Math.max(0, state.dayCoins - EXPIRED_PENALTY);
      addFloat(state, 640, 140, `Pesanan hangus! -${EXPIRED_PENALTY}`, '#ff6b5e');
      state.events.push('error');
    }
  }
  const anyUrgent = state.orders.some((o) => o.patience < 10);
  state.rush = state.orders.length >= 3 || anyUrgent;
}
