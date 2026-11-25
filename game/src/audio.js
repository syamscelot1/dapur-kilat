// All sound is synthesized live with the Web Audio API — no audio files,
// no network. Short effects for every kitchen action, plus a cheerful
// pentatonic loop that gets busier during a rush.
let ctx = null;
let master = null;
let musicGain = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// C major pentatonic, bouncy and bright. Two 16-step phrases over a walking
// bass: the second phrase climbs higher, and a soft lead voice answers the
// melody on the off-beats, so the loop feels like a song instead of a jingle.
const MELODY = [
  72, 76, 79, 81, 79, 76, 74, 72, 72, 76, 79, 84, 81, 79, 76, 74,
  72, 76, 79, 81, 84, 81, 79, 76, 76, 81, 84, 88, 86, 84, 81, 79,
];
const BASS = [
  48, 55, 48, 55, 45, 52, 45, 52, 43, 50, 43, 50, 48, 55, 48, 55,
  45, 52, 45, 52, 41, 48, 41, 48, 43, 50, 43, 50, 48, 55, 43, 50,
];
// Soft lead harmony (0 = rest): answers the melody a step or two above.
const LEAD = [
  0, 0, 84, 0, 0, 0, 86, 0, 0, 0, 84, 0, 0, 0, 81, 0,
  0, 0, 84, 0, 0, 0, 84, 0, 0, 0, 86, 0, 0, 0, 84, 0,
];
const STEP_SECONDS = 0.21;

// The note tables above are MIDI numbers; the synth needs Hertz.
function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function ensure() {
  if (ctx) return true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
  } catch {
    return false;
  }
  return true;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (!ensure() || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, vol, freq, when = 0) {
  if (!ensure() || muted) return;
  const t0 = ctx.currentTime + when;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t0);
}

export const audio = {
  unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume(); },
  get muted() { return muted; },
  toggleMute() {
    muted = !muted;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.02);
    return muted;
  },
  play(name) {
    if (!ensure()) return;
    switch (name) {
      case 'pickup': tone(520, 0.09, 'sine', 0.25, 0, 760); break;
      case 'place': tone(392, 0.08, 'triangle', 0.25); tone(523, 0.1, 'triangle', 0.2, 0.05); break;
      case 'chop': noise(0.07, 0.5, 1800); noise(0.07, 0.5, 1400, 0.09); break;
      case 'sizzle': noise(0.5, 0.22, 5200); break;
      case 'done': tone(659, 0.12, 'sine', 0.3); tone(880, 0.18, 'sine', 0.3, 0.1); break;
      case 'ding': tone(1046, 0.15, 'sine', 0.3); tone(1318, 0.3, 'sine', 0.3, 0.12); break;
      case 'serve': tone(784, 0.12, 'triangle', 0.3); tone(988, 0.12, 'triangle', 0.3, 0.09); tone(1175, 0.25, 'triangle', 0.3, 0.18); break;
      case 'coin': tone(988, 0.08, 'square', 0.14); tone(1318, 0.16, 'square', 0.14, 0.07); break;
      case 'error': tone(180, 0.22, 'sawtooth', 0.22, 0, 120); break;
      case 'burn': tone(220, 0.15, 'square', 0.25, 0, 110); tone(220, 0.15, 'square', 0.25, 0.18, 110); break;
      case 'trash': noise(0.18, 0.3, 500); break;
      case 'click': tone(700, 0.06, 'sine', 0.2); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.3, i * 0.13)); break;
      case 'lose': [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.25, i * 0.18)); break;
      default: break;
    }
  },
  startMusic() {
    if (!ensure() || musicTimer) return;
    musicStep = 0;
    musicTimer = window.setInterval(() => {
      if (muted || !ctx) return;
      const i = musicStep % 32;
      const m = MELODY[i];
      const b = BASS[i];
      const l = LEAD[i];
      tone(midi(m), STEP_SECONDS * 0.9, 'triangle', 0.16);
      if (l) tone(midi(l), STEP_SECONDS * 1.4, 'sine', 0.09);
      if (i % 2 === 0) tone(midi(b), STEP_SECONDS * 1.8, 'sine', 0.22);
      if (i % 8 === 6) tone(midi(b + 7), STEP_SECONDS * 0.9, 'sine', 0.13);
      if (i % 4 === 2) noise(0.05, 0.1, 6000);
      musicStep += 1;
    }, STEP_SECONDS * 1000);
  },
  stopMusic() {
    if (musicTimer) { window.clearInterval(musicTimer); musicTimer = null; }
  },
  setRush(rush) {
    if (musicGain) musicGain.gain.value = rush ? 0.24 : 0.16;
  },
};
