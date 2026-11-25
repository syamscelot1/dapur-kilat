// Keyboard + mouse input for Dapur Kilat. Tracks held keys, edge-triggered
// actions (interact / confirm / pause / mute) and canvas clicks, so the game
// loop can ask "was E pressed this frame?" instead of polling raw events.
export const ACTION_INTERACT = 'interact';
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';

const KEY_ACTIONS = {
  KeyE: ACTION_INTERACT,
  Space: ACTION_INTERACT,
  Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyM: ACTION_MUTE,
};

const MOVE_KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set(); // action edges, consumed by the loop each frame
  const clicks = []; // { x, y } in canvas logical pixels, consumed each frame
  let anyKey = false;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    anyKey = true;
    const action = KEY_ACTIONS[event.code];
    if (action) {
      pressed.add(action);
      event.preventDefault();
    }
    const dir = MOVE_KEYS[event.code];
    if (dir) {
      held.add(dir);
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    const dir = MOVE_KEYS[event.code];
    if (dir) held.delete(dir);
  }

  // Losing focus must not leave a direction stuck on.
  function onBlur() { held.clear(); }

  function onClick(event) {
    anyKey = true;
    clicks.push(toLogical(event));
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onClick);

  return {
    held,
    get anyKey() { return anyKey; },
    moveVector() {
      let x = 0;
      let y = 0;
      if (held.has('left')) x -= 1;
      if (held.has('right')) x += 1;
      if (held.has('up')) y -= 1;
      if (held.has('down')) y += 1;
      if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
      return { x, y };
    },
    wasPressed(action) { return pressed.has(action); },
    takeClicks() { return clicks.splice(0, clicks.length); },
    endFrame() { pressed.clear(); },
    // Test hooks: drive the game without a real keyboard.
    press(action) { pressed.add(action); },
    hold(dir, on) { if (on) held.add(dir); else held.delete(dir); },
    click(x, y) { clicks.push({ x, y }); },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('mousedown', onClick);
    },
  };
}
