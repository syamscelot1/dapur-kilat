// Dapur Kilat — boot and the one loop. Screens: title, how-to, playing,
// paused, day summary, win, lose. Fixed 1/60 s steps; the world, orders and
// player advance only while playing. ?shot=cover|chop|serve|rush stages a
// deterministic scene and sets window.__shotReady for screenshots.
import { CANVAS_H, CANVAS_W, DAYS, RECIPES, SHIFT_SECONDS, STAR_THRESHOLDS, STEP, recipesForDay } from './config.js';
import { createState, stepStations } from './world.js';
import { createPlayer, stepPlayer, interact, clickInteract } from './player.js';
import { stepOrders } from './orders.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { drawWorld } from './render.js';
import { audio } from './audio.js';
import { buttonAt, drawDaySummary, drawHUD, drawHowTo, drawLose, drawPause, drawTitle, drawWin } from './ui.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

function mulberry32(a) {
  return function rng() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const rng = mulberry32(seed);

let screen = 'title';
let state = createState();
state.player = createPlayer();
let buttons = [];
let summary = null;
let totalServed = 0;
let totalBestCombo = 0;
let sessionBest = 0;

function startDay(day, keepCoins) {
  state = createState();
  state.day = day;
  state.recipes = recipesForDay(day);
  state.timeLeft = SHIFT_SECONDS;
  state.coins = keepCoins;
  state.dayCoins = 0;
  state.player = createPlayer();
  state.spawnIn = 6;
  screen = 'playing';
  audio.unlock();
  audio.startMusic();
}

function startGame() {
  totalServed = 0;
  totalBestCombo = 0;
  startDay(1, 0);
}

function endDay() {
  totalServed += state.served;
  totalBestCombo = Math.max(totalBestCombo, state.bestCombo);
  const dayDef = DAYS[state.day - 1];
  const met = state.dayCoins >= dayDef.target;
  audio.stopMusic();
  if (!met) {
    summary = { day: state.day, dayCoins: state.dayCoins, target: dayDef.target };
    screen = 'lose';
    audio.play('lose');
    return;
  }
  if (state.day >= 3) {
    const totalCoins = state.coins;
    sessionBest = Math.max(sessionBest, totalCoins);
    const stars = totalCoins >= STAR_THRESHOLDS.three ? 3 : totalCoins >= STAR_THRESHOLDS.two ? 2 : 1;
    summary = { totalCoins, served: totalServed, bestCombo: totalBestCombo, stars };
    screen = 'win';
    audio.play('win');
    return;
  }
  const nextDay = state.day + 1;
  summary = {
    day: state.day,
    dayCoins: state.dayCoins,
    target: dayDef.target,
    served: state.served,
    bestCombo: state.bestCombo,
    wasted: state.wasted,
    newRecipes: RECIPES.filter((r) => r.day === nextDay),
    nextDay,
    keepCoins: state.coins,
  };
  screen = 'day';
  audio.play('win');
}

function drainEvents() {
  const events = state.events.splice(0, state.events.length);
  for (const e of events) {
    if (e === 'serve') { audio.play('serve'); audio.play('coin'); }
    else if (e === 'done') audio.play('done');
    else audio.play(e);
  }
  audio.setRush(state.rush);
}

function step(dt) {
  if (screen !== 'playing') return;
  state.timeLeft -= dt;
  stepPlayer(state, dt, input);
  stepStations(state, dt);
  stepOrders(state, dt, rng);
  if (state.comboPop > 0) state.comboPop = Math.max(0, state.comboPop - dt * 2);
  drainEvents();
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endDay();
  }
}

function handleButtons(id) {
  audio.unlock();
  audio.play('click');
  if (screen === 'title') {
    if (id === 'start') startGame();
    else if (id === 'how') screen = 'how';
  } else if (screen === 'how') {
    if (id === 'back') screen = 'title';
  } else if (screen === 'paused') {
    if (id === 'resume') screen = 'playing';
    else if (id === 'retry') startDay(state.day, state.coins - state.dayCoins);
    else if (id === 'menu') { screen = 'title'; audio.stopMusic(); }
  } else if (screen === 'day') {
    if (id === 'next') startDay(summary.nextDay, summary.keepCoins);
  } else if (screen === 'win') {
    if (id === 'again') startGame();
  } else if (screen === 'lose') {
    if (id === 'retry') startDay(state.day, state.coins - state.dayCoins);
    else if (id === 'menu') { screen = 'title'; audio.stopMusic(); }
  }
}

function draw() {
  buttons = [];
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (screen === 'title') {
    drawTitle(ctx, buttons);
    if (sessionBest > 0) {
      ctx.fillStyle = '#ffe9b0';
      ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Rekor sesi ini: ${sessionBest} koin`, 640, 650);
    }
  } else if (screen === 'how') {
    drawHowTo(ctx, buttons);
  } else if (screen === 'playing' || screen === 'paused') {
    drawWorld(ctx, state);
    drawHUD(ctx, state);
    if (screen === 'paused') drawPause(ctx, buttons);
  } else if (screen === 'day') {
    drawDaySummary(ctx, buttons, summary);
  } else if (screen === 'win') {
    drawWin(ctx, buttons, summary);
  } else if (screen === 'lose') {
    drawLose(ctx, buttons, summary);
  }
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(MAX_FRAME, (now - last) / 1000);
  last = now;
  if (input.anyKey) audio.unlock();
  if (input.wasPressed(ACTION_MUTE)) {
    const m = audio.toggleMute();
    statusEl.textContent = m ? 'Suara mati' : 'Suara hidup';
  }
  if (screen === 'playing') {
    if (input.wasPressed(ACTION_PAUSE)) { screen = 'paused'; audio.play('click'); }
    else {
      if (input.wasPressed(ACTION_INTERACT)) interact(state);
      for (const c of input.takeClicks()) clickInteract(state, c.x, c.y);
      let acc = dt;
      while (acc > 0) {
        const h = Math.min(STEP, acc);
        step(h);
        acc -= h;
        if (screen !== 'playing') break;
      }
    }
  } else {
    if (input.wasPressed(ACTION_PAUSE) && screen === 'paused') screen = 'playing';
    if (input.wasPressed(ACTION_CONFIRM) && (screen === 'title' || screen === 'day' || screen === 'win' || screen === 'lose')) {
      handleButtons(screen === 'title' ? 'start' : screen === 'day' ? 'next' : screen === 'win' ? 'again' : 'retry');
    }
    for (const c of input.takeClicks()) {
      const id = buttonAt(buttons, c.x, c.y);
      if (id) handleButtons(id);
    }
  }
  input.endFrame();
  draw();
  requestAnimationFrame(frame);
}

function runShot(name) {
  state = stageShot(name, state);
  screen = 'playing';
  let painted = 0;
  function paint() {
    draw();
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

// Test hooks for headless verification: drive the real game from outside.
window.__game = {
  get state() { return state; },
  get screen() { return screen; },
  startGame,
  startDay,
  step: (dt) => step(dt),
  interact: () => interact(state),
  press: (action) => input.press(action),
  hold: (dir, on) => input.hold(dir, on),
  click: (x, y) => input.click(x, y),
  teleport: (x, y) => { state.player.x = x; state.player.y = y; },
  buttons: () => buttons,
  clickButton: (id) => handleButtons(id),
};

if (shot) {
  runShot(shot);
} else {
  requestAnimationFrame(frame);
}
