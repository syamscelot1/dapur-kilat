// Heads-up display, order tickets, menus and end screens. Everything the
// player reads lives here; the kitchen itself lives in render.js.
import { CANVAS_W, COLORS, DAYS, INGREDIENTS, RECIPES } from './config.js';
import { rr } from './render.js';

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function panel(ctx, x, y, w, h, fill = 'rgba(20,12,6,0.82)') {
  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,233,176,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawButton(ctx, buttons, id, x, y, w, h, label, color = '#e8452c') {
  ctx.fillStyle = color;
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + 1, 22, '#ffffff');
  buttons.push({ id, x, y, w, h });
}

export function buttonAt(buttons, x, y) {
  for (const b of buttons) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id;
  }
  return null;
}

function patienceColor(frac) {
  if (frac > 0.5) return '#2e9e5b';
  if (frac > 0.25) return '#f6b73c';
  return '#e8452c';
}

function drawTicket(ctx, order, x, y) {
  const recipe = RECIPES.find((r) => r.id === order.recipeId);
  ctx.fillStyle = COLORS.ticket;
  rr(ctx, x, y, 200, 58, 8);
  ctx.fill();
  ctx.strokeStyle = COLORS.ticketEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = order.color;
  rr(ctx, x, y, 200, 8, 4);
  ctx.fill();
  text(ctx, order.name, x + 100, y + 22, 15, '#2b1d12');
  // Ingredient dots for the recipe's needs.
  if (recipe) {
    recipe.needs.forEach((n, i) => {
      ctx.fillStyle = INGREDIENTS[n.ing].color;
      ctx.beginPath();
      ctx.arc(x + 24 + i * 20, y + 42, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    text(ctx, `Rp ${recipe.price}`, x + 168, y + 42, 13, '#2b1d12', 'right');
  }
  const frac = Math.max(0, order.patience / order.maxPatience);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(ctx, x + 8, y + 52, 184, 4, 2);
  ctx.fill();
  ctx.fillStyle = patienceColor(frac);
  rr(ctx, x + 8, y + 52, 184 * frac, 4, 2);
  ctx.fill();
}

export function drawHUD(ctx, state) {
  const day = DAYS[state.day - 1];
  // Top strip.
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, CANVAS_W, 44);
  text(ctx, 'DAPUR KILAT', 20, 22, 20, COLORS.gold, 'left');
  text(ctx, `Hari ${state.day}/3`, 210, 22, 18, COLORS.hudText, 'left');
  text(ctx, `Koin: ${state.coins}`, 330, 22, 18, COLORS.hudText, 'left');
  // Shift timer bar.
  const tw = 300;
  const tx = 560;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  rr(ctx, tx, 12, tw, 20, 10);
  ctx.fill();
  const tfrac = Math.max(0, state.timeLeft / 180);
  ctx.fillStyle = tfrac > 0.3 ? '#2e9e5b' : '#e8452c';
  if (tfrac > 0.02) {
    rr(ctx, tx + 2, 14, (tw - 4) * tfrac, 16, 8);
    ctx.fill();
  }
  const mm = Math.floor(state.timeLeft / 60);
  const ss = Math.floor(state.timeLeft % 60).toString().padStart(2, '0');
  text(ctx, `${mm}:${ss}`, tx + tw / 2, 22, 16, '#ffffff');
  // Target + combo.
  text(ctx, `Target: ${state.dayCoins}/${day.target}`, 900, 22, 16, state.dayCoins >= day.target ? '#7be495' : COLORS.hudText, 'left');
  if (state.combo > 1) text(ctx, `Kombo x${state.combo}`, 1150, 22, 18, COLORS.gold, 'left');
  // Order tickets.
  state.orders.forEach((o, i) => drawTicket(ctx, o, 24 + i * 208, 52));
  // Rush banner.
  if (state.rush) {
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 180);
    ctx.save();
    ctx.globalAlpha = pulse;
    text(ctx, 'RUSH!', 640, 150, 34, '#ff5340');
    ctx.restore();
  }
  // Hint line — dark on the light floor so it stays readable.
  text(ctx, 'WASD/ Panah: jalan   •   E / Spasi / Klik: ambil & olah   •   P: jeda   •   M: suara', 640, 706, 13, '#2b1d12');
}

function bigTitle(ctx) {
  text(ctx, 'DAPUR', 640, 170, 84, '#ffe9b0');
  text(ctx, 'KILAT', 640, 250, 84, '#f6b73c');
  text(ctx, 'Masak cepat, sajikan tepat waktu — sebelum pelanggan kehabisan sabar!', 640, 320, 20, '#fff6d8');
}

export function drawTitle(ctx, buttons) {
  ctx.fillStyle = '#3a2415';
  ctx.fillRect(0, 0, CANVAS_W, 720);
  // Warm kitchen glow.
  const g = ctx.createRadialGradient(640, 300, 60, 640, 300, 520);
  g.addColorStop(0, 'rgba(246,183,60,0.25)');
  g.addColorStop(1, 'rgba(246,183,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, 720);
  bigTitle(ctx);
  drawButton(ctx, buttons, 'start', 490, 380, 300, 64, 'MULAI MASAK', '#2e9e5b');
  drawButton(ctx, buttons, 'how', 490, 460, 300, 64, 'CARA MAIN', '#e8452c');
  text(ctx, `${RECIPES.length} resep masakan Indonesia  •  3 hari  •  masak, rakit, sajikan`, 640, 580, 16, 'rgba(255,246,216,0.8)');
  text(ctx, 'Semua seni dan suara dibuat dari kode — tanpa gambar atau audio dari luar.', 640, 610, 14, 'rgba(255,246,216,0.6)');
}

export function drawHowTo(ctx, buttons) {
  ctx.fillStyle = '#3a2415';
  ctx.fillRect(0, 0, CANVAS_W, 720);
  text(ctx, 'CARA MAIN', 640, 70, 44, '#f6b73c');
  const lines = [
    ['1. Ambil bahan', 'Berdiri di peti bahan (kiri), tekan E.'],
    ['2. Olah bahan', 'Talenan = potong, Wajan = goreng, Panci = rebus, Panggangan = panggang.'],
    ['3. Rakit di piring', 'Taruh hasil olahan di piring di Meja Plating. Piring yang lengkap jadi hidangan.'],
    ['4. Sajikan', 'Bawa piring jadi ke Jendela Saji (kanan atas). Cocok dengan tiket = koin + tip.'],
    ['5. Awas gosong!', 'Masakan yang kelamaan di kompor gosong — buang ke tempat sampah.'],
    ['6. Kejar target', 'Setiap hari punya target koin. Selesaikan 3 hari untuk menang.'],
    ['', 'Gerak: WASD / panah. Interaksi: E / Spasi / klik stasiun di dekatmu. Jeda: P. Suara: M.'],
  ];
  lines.forEach(([head, body], i) => {
    const y = 140 + i * 62;
    if (head) text(ctx, head, 640, y, 22, '#ffe9b0');
    if (body) text(ctx, body, 640, y + 26, 17, '#fff6d8');
  });
  drawButton(ctx, buttons, 'back', 490, 600, 300, 56, 'KEMBALI', '#2e9e5b');
}

export function drawPause(ctx, buttons) {
  ctx.fillStyle = 'rgba(10,6,3,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, 720);
  panel(ctx, 390, 200, 500, 320);
  text(ctx, 'JEDA', 640, 250, 44, '#f6b73c');
  drawButton(ctx, buttons, 'resume', 490, 300, 300, 56, 'LANJUT', '#2e9e5b');
  drawButton(ctx, buttons, 'retry', 490, 372, 300, 56, 'ULANG HARI', '#e8452c');
  drawButton(ctx, buttons, 'menu', 490, 444, 300, 56, 'MENU UTAMA', '#6e7a82');
}

export function drawDaySummary(ctx, buttons, s) {
  ctx.fillStyle = '#3a2415';
  ctx.fillRect(0, 0, CANVAS_W, 720);
  text(ctx, `HARI ${s.day} SELESAI`, 640, 110, 48, '#f6b73c');
  text(ctx, `Koin hari ini: ${s.dayCoins}  (target ${s.target})`, 640, 190, 24, '#fff6d8');
  text(ctx, `Hidangan disajikan: ${s.served}   •   Kombo terbaik: x${s.bestCombo}   •   Terbuang: ${s.wasted}`, 640, 235, 20, '#fff6d8');
  if (s.newRecipes.length > 0) {
    text(ctx, 'Resep baru terbuka:', 640, 300, 22, '#7be495');
    s.newRecipes.forEach((r, i) => {
      text(ctx, `${r.name} — ${r.blurb}`, 640, 335 + i * 30, 19, '#ffe9b0');
    });
  } else {
    text(ctx, 'Semua resep sudah terbuka — hari terakhir menanti!', 640, 320, 20, '#7be495');
  }
  drawButton(ctx, buttons, 'next', 470, 480, 340, 64, 'HARI BERIKUTNYA', '#2e9e5b');
}

export function drawWin(ctx, buttons, s) {
  ctx.fillStyle = '#1d3a24';
  ctx.fillRect(0, 0, CANVAS_W, 720);
  text(ctx, 'KAMU MENANG!', 640, 130, 56, '#ffd94d');
  text(ctx, 'Tiga hari penuh, dapur tetap berdiri. Pelanggan pulang kenyang!', 640, 200, 22, '#fff6d8');
  const stars = '★'.repeat(s.stars) + '☆'.repeat(3 - s.stars);
  text(ctx, stars, 640, 280, 64, '#ffd94d');
  text(ctx, `Total koin: ${s.totalCoins}   •   Hidangan: ${s.served}   •   Kombo terbaik: x${s.bestCombo}`, 640, 360, 22, '#fff6d8');
  text(ctx, s.stars === 3 ? 'Peringkat: Koki Bintang Tiga — dapur ini legendanya!' : s.stars === 2 ? 'Peringkat: Koki Bintang Dua — hampir sempurna!' : 'Peringkat: Koki Bintang Satu — selamat, dapur bertahan!', 640, 410, 20, '#ffe9b0');
  drawButton(ctx, buttons, 'again', 490, 480, 300, 64, 'MAIN LAGI', '#2e9e5b');
}

export function drawLose(ctx, buttons, s) {
  ctx.fillStyle = '#3a1a12';
  ctx.fillRect(0, 0, CANVAS_W, 720);
  text(ctx, 'TARGET TAK TERCAPAI', 640, 130, 48, '#ff6b5e');
  text(ctx, `Hari ${s.day}: kamu dapat ${s.dayCoins} koin, targetnya ${s.target}.`, 640, 200, 22, '#fff6d8');
  text(ctx, 'Tips: sajikan sebelum kesabaran habis — tip makin besar kalau cepat.', 640, 245, 18, '#ffe9b0');
  text(ctx, 'Jangan biarkan masakan gosong; buang dan mulai lagi lebih cepat.', 640, 275, 18, '#ffe9b0');
  drawButton(ctx, buttons, 'retry', 490, 360, 300, 60, 'ULANGI HARI', '#2e9e5b');
  drawButton(ctx, buttons, 'menu', 490, 436, 300, 60, 'MENU UTAMA', '#6e7a82');
}
