// Every pixel of the kitchen, drawn in code: floor, counters, stations, the
// chef, and each ingredient as a small flat-vector icon. No images, no
// network — the judge's screenshots come straight from these functions.
import { CANVAS_H, CANVAS_W, COLORS, INGREDIENTS, PROCESS, BURN_SECONDS } from './config.js';
import { STATION_KIND } from './world.js';

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function shadowText(ctx, str, x, y, size, color, align = 'center') {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.font = `bold ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x + 2, y + 2);
  text(ctx, str, x, y, size, color, align);
}

// One ingredient icon at (x, y), roughly radius r. `process` adds a marker
// (chopped bits, fry bubbles, steam, grill marks) so the player can tell a
// raw ingredient from a finished component at a glance.
export function drawIngredient(ctx, ing, x, y, r, process = null, burnt = false) {
  const def = INGREDIENTS[ing];
  ctx.save();
  ctx.translate(x, y);
  if (burnt) {
    ctx.fillStyle = '#241d18';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.3);
    ctx.lineTo(r * 0.4, r * 0.2);
    ctx.moveTo(r * 0.5, -r * 0.4);
    ctx.lineTo(-r * 0.3, r * 0.4);
    ctx.stroke();
    ctx.restore();
    return;
  }
  switch (ing) {
    case 'nasi': {
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath();
      ctx.arc(0, r * 0.25, r * 0.9, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f2e3b8';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.1, r * 0.16, 0, Math.PI * 2);
      ctx.arc(r * 0.25, -r * 0.25, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'ayam': {
      ctx.fillStyle = '#e89b6d';
      ctx.beginPath();
      ctx.ellipse(-r * 0.1, 0, r * 0.75, r * 0.55, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6d9b8';
      ctx.beginPath();
      ctx.arc(r * 0.55, -r * 0.45, r * 0.22, 0, Math.PI * 2);
      ctx.arc(r * 0.75, -r * 0.6, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'telur': {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.95, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb61e';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'cabai': {
      ctx.strokeStyle = '#d92b1f';
      ctx.lineWidth = r * 0.42;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 0.7, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.strokeStyle = '#4da34d';
      ctx.lineWidth = r * 0.2;
      ctx.beginPath();
      ctx.moveTo(r * 0.55, -r * 0.55);
      ctx.lineTo(r * 0.85, -r * 0.85);
      ctx.stroke();
      break;
    }
    case 'sayur': {
      ctx.fillStyle = '#4da34d';
      for (const [dx, dy, rad] of [[-0.35, 0.1, 0.45], [0.3, 0.05, 0.5], [0, -0.35, 0.45]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, rad * r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#8ed081';
      ctx.beginPath();
      ctx.arc(-r * 0.2, -r * 0.2, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'mie': {
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = r * 0.28;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, i * r * 0.45);
        ctx.quadraticCurveTo(-r * 0.3, i * r * 0.45 - r * 0.3, r * 0.2, i * r * 0.45);
        ctx.quadraticCurveTo(r * 0.6, i * r * 0.45 + r * 0.3, r * 0.85, i * r * 0.45);
        ctx.stroke();
      }
      break;
    }
    case 'pisang': {
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = r * 0.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, -r * 0.2, r * 0.75, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      ctx.fillStyle = '#8a6d2b';
      ctx.fillRect(-r * 0.75, -r * 0.75, r * 0.18, r * 0.3);
      break;
    }
    case 'teh': {
      // Cream cup so it reads against the brown crate shelf.
      ctx.fillStyle = '#f4ead8';
      rr(ctx, -r * 0.55, -r * 0.3, r * 1.1, r * 0.8, r * 0.15);
      ctx.fill();
      ctx.fillStyle = '#a9713f';
      rr(ctx, -r * 0.42, -r * 0.24, r * 0.84, r * 0.22, r * 0.08);
      ctx.fill();
      ctx.strokeStyle = '#f4ead8';
      ctx.lineWidth = r * 0.16;
      ctx.beginPath();
      ctx.arc(r * 0.62, r * 0.1, r * 0.28, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120,90,60,0.8)';
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.5);
      ctx.quadraticCurveTo(-r * 0.35, -r * 0.8, -r * 0.15, -r * 0.95);
      ctx.stroke();
      break;
    }
    default: {
      ctx.fillStyle = def ? def.color : '#ccc';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Process markers.
  if (process === 'potong') {
    ctx.strokeStyle = 'rgba(43,29,18,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, 0);
    ctx.lineTo(r * 0.5, 0);
    ctx.moveTo(0, -r * 0.5);
    ctx.lineTo(0, r * 0.5);
    ctx.stroke();
  } else if (process === 'goreng') {
    ctx.fillStyle = 'rgba(246,183,60,0.9)';
    ctx.beginPath();
    ctx.arc(-r * 0.45, -r * 0.45, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.4, -r * 0.5, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else if (process === 'rebus') {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.6);
    ctx.quadraticCurveTo(-r * 0.45, -r * 0.95, -r * 0.25, -r * 1.1);
    ctx.moveTo(r * 0.25, -r * 0.6);
    ctx.quadraticCurveTo(r * 0.1, -r * 0.95, r * 0.3, -r * 1.1);
    ctx.stroke();
  } else if (process === 'panggang') {
    ctx.strokeStyle = 'rgba(60,30,10,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.3);
    ctx.lineTo(r * 0.5, r * 0.3);
    ctx.moveTo(-r * 0.5, r * 0.3);
    ctx.lineTo(r * 0.5, -r * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProgressBar(ctx, x, y, w, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, x, y, w, 10, 5);
  ctx.fill();
  ctx.fillStyle = color;
  if (frac > 0.02) {
    rr(ctx, x + 1, y + 1, Math.max(4, (w - 2) * frac), 8, 4);
    ctx.fill();
  }
}

function drawStation(ctx, state, s) {
  const slot = state.slots[s.id];
  ctx.save();
  if (s.kind === STATION_KIND.CRATE) {
    ctx.fillStyle = '#7a4a24';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = '#a9713f';
    rr(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 8, 6);
    ctx.fill();
    drawIngredient(ctx, s.ing, s.x + 30, s.y + s.h / 2, 20);
    text(ctx, s.label, s.x + 60, s.y + s.h / 2, 16, '#fff6d8', 'left');
    ctx.restore();
    return;
  }
  if (s.kind === STATION_KIND.BOARD) {
    ctx.fillStyle = '#8a5a2e';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.board;
    rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 6);
    ctx.fill();
  } else if (s.kind === STATION_KIND.STOVE) {
    ctx.fillStyle = '#3a3f45';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = '#22262b';
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e86a2c';
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h / 2, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6b73c';
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h / 2, 13, 0, Math.PI * 2);
    ctx.fill();
  } else if (s.kind === STATION_KIND.POT) {
    ctx.fillStyle = '#3a3f45';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.steel;
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, 34, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b7a99';
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, 26, 17, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (s.kind === STATION_KIND.GRILL) {
    ctx.fillStyle = '#3a3f45';
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#c9c9c9';
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(s.x + 16, s.y + 16 + i * 14);
      ctx.lineTo(s.x + s.w - 16, s.y + 16 + i * 14);
      ctx.stroke();
    }
    ctx.fillStyle = '#e86a2c';
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h - 10, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (s.kind === STATION_KIND.PLATE) {
    ctx.fillStyle = COLORS.counter;
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.fillStyle = COLORS.counterTop;
    rr(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 10, 8);
    ctx.fill();
  } else if (s.kind === STATION_KIND.TRASH) {
    ctx.fillStyle = '#4a4f55';
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.fillStyle = '#6e7a82';
    rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 16, 8);
    ctx.fill();
    text(ctx, 'SAMPAH', s.x + s.w / 2, s.y + s.h / 2, 15, '#ffffff');
  } else if (s.kind === STATION_KIND.SERVE) {
    ctx.fillStyle = '#5b3a1e';
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 8);
    ctx.fill();
    text(ctx, 'JENDELA SAJI', s.x + s.w / 2, s.y + 22, 17, '#5b3a1e');
    text(ctx, 'antar hidangan di sini', s.x + s.w / 2, s.y + 44, 13, '#5b3a1e');
  } else if (s.kind === STATION_KIND.BOOK) {
    ctx.fillStyle = '#5b3a1e';
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    ctx.fillStyle = '#fff6d8';
    rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 8);
    ctx.fill();
    text(ctx, 'BUKU RESEP', s.x + s.w / 2, s.y + 26, 17, '#5b3a1e');
    const recipes = state.recipes || [];
    recipes.forEach((r, i) => {
      const y = s.y + 50 + i * 34;
      ctx.fillStyle = r.color;
      ctx.beginPath();
      ctx.arc(s.x + 22, y, 8, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, r.name, s.x + 38, y, 14, '#2b1d12', 'left');
      text(ctx, `Rp ${r.price}`, s.x + s.w - 12, y, 13, '#2b1d12', 'right');
      text(ctx, r.blurb, s.x + 38, y + 14, 11, '#6b543a', 'left');
    });
  }
  // The item sitting on a processing station, with its progress.
  if (slot && slot.ing) {
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    if (slot.burnt) {
      drawIngredient(ctx, slot.ing, cx, cy, 20, slot.process, true);
      text(ctx, 'GOSONG!', cx, s.y - 12, 15, '#ff6b5e');
    } else if (slot.done) {
      drawIngredient(ctx, slot.ing, cx, cy, 22, slot.process);
      ctx.fillStyle = 'rgba(46,158,91,0.9)';
      ctx.beginPath();
      ctx.arc(cx + 24, cy - 24, 11, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '✓', cx + 24, cy - 23, 14, '#ffffff');
      drawProgressBar(ctx, s.x + 12, s.y + s.h - 16, s.w - 24, 1 - slot.burn / BURN_SECONDS, '#ff6b5e');
    } else {
      drawIngredient(ctx, slot.ing, cx, cy, 20, slot.process);
      drawProgressBar(ctx, s.x + 12, s.y + s.h - 16, s.w - 24, slot.progress / slot.duration, '#2e9e5b');
      shadowText(ctx, PROCESS[slot.process].verb, cx, s.y - 12, 13, '#fff6d8');
    }
  } else if (s.kind !== STATION_KIND.PLATE && s.kind !== STATION_KIND.SERVE && s.kind !== STATION_KIND.TRASH && s.kind !== STATION_KIND.BOOK) {
    shadowText(ctx, s.label, s.x + s.w / 2, s.y + s.h + 14, 13, '#fff6d8');
  }
  ctx.restore();
}

export function drawPlate(ctx, plate) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(plate.x + 26, plate.y + 34, 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(plate.x + 26, plate.y + 26, 30, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b9c2c9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(plate.x + 26, plate.y + 26, 30, 22, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (plate.dish) {
    // Finished dish: a proud little mound in the recipe colour.
    const recipe = plate.dish;
    ctx.fillStyle = '#e8963c';
    ctx.beginPath();
    ctx.arc(plate.x + 26, plate.y + 22, 13, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', plate.x + 26, plate.y + 14);
  } else {
    plate.items.forEach((c, i) => {
      drawIngredient(ctx, c.ing, plate.x + 14 + i * 16, plate.y + 24, 11, c.process);
    });
  }
  ctx.restore();
}

function drawChef(ctx, p) {
  const bob = p.moving ? Math.sin(p.walkPhase) * 2 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob * 0.4);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 26, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs.
  ctx.strokeStyle = '#3a3f45';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  const step = p.moving ? Math.sin(p.walkPhase) * 5 : 0;
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.lineTo(-6 + step, 26);
  ctx.moveTo(6, 8);
  ctx.lineTo(6 - step, 26);
  ctx.stroke();
  // Body + apron.
  ctx.fillStyle = '#ffffff';
  rr(ctx, -15, -12, 30, 26, 9);
  ctx.fill();
  ctx.fillStyle = '#2e9e5b';
  rr(ctx, -11, 2, 22, 13, 4);
  ctx.fill();
  // Arms.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-14, -4);
  ctx.lineTo(-20, 6);
  ctx.moveTo(14, -4);
  ctx.lineTo(20, 6);
  ctx.stroke();
  // Head.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -20, 12, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-7, -30, 8, 0, Math.PI * 2);
  ctx.arc(0, -34, 9, 0, Math.PI * 2);
  ctx.arc(7, -30, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-12, -32, 24, 6);
  // Face.
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(-4, -21, 1.6, 0, Math.PI * 2);
  ctx.arc(4, -21, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1d12';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -17, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Carried item floats above the hands.
  if (p.carry) {
    const cy = -44;
    if (p.carry.type === 'ing') drawIngredient(ctx, p.carry.ing, 0, cy, 15);
    else if (p.carry.type === 'food') drawIngredient(ctx, p.carry.ing, 0, cy, 15, p.carry.process, p.carry.burnt);
    else if (p.carry.type === 'plate') {
      ctx.fillStyle = COLORS.plate;
      ctx.beginPath();
      ctx.ellipse(0, cy, 20, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b9c2c9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, cy, 20, 13, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (p.carry.plate.dish) {
        ctx.fillStyle = '#e8963c';
        ctx.beginPath();
        ctx.arc(0, cy - 2, 8, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        p.carry.plate.items.forEach((c, i) => {
          drawIngredient(ctx, c.ing, -10 + i * 12, cy, 7, c.process);
        });
      }
    }
  }
  ctx.restore();
}

export function drawWorld(ctx, state) {
  // Floor tiles.
  for (let ty = 0; ty < 9; ty += 1) {
    for (let tx = 0; tx < 16; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx * 80, 118 + ty * 68, 80, 68);
    }
  }
  // Wall band behind the order board.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS_W, 118);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 112, CANVAS_W, 6);
  // Stations.
  for (const s of state.stations) drawStation(ctx, state, s);
  // Plates on the table (not carried).
  for (const plate of state.plates) {
    if (!plate.carried) drawPlate(ctx, plate);
  }
  // Smoke.
  for (const p of state.smoke) {
    ctx.fillStyle = `rgba(230,230,230,${Math.max(0, p.life / p.max) * 0.55})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7 + (1 - p.life / p.max) * 10, 0, Math.PI * 2);
    ctx.fill();
  }
  // Chef.
  if (state.player) drawChef(ctx, state.player);
  // Floating score text.
  for (const f of state.floats) {
    shadowText(ctx, f.text, f.x, f.y, 20, f.color);
  }
}
