// audio.js — tiny synthesized WebAudio sounds. No audio files, no network.
let ctx = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol || 0.12, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur, vol, lowpass) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass || 1200;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol || 0.15, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(t0);
}

export const sfx = {
  unlock() { ac(); },
  toggleMute() { muted = !muted; return muted; },
  pickup() { tone(520, 0.09, 'triangle', 0.12, 760); },
  putdown() { tone(330, 0.08, 'triangle', 0.1, 260); },
  chop() { noiseBurst(0.07, 0.22, 900); tone(180, 0.06, 'square', 0.06, 120); },
  chopDone() { tone(660, 0.1, 'triangle', 0.12); tone(880, 0.14, 'triangle', 0.12); },
  sizzle() { noiseBurst(0.25, 0.07, 3200); },
  cooked() { tone(740, 0.12, 'sine', 0.12, 990); },
  burnWarn() { tone(220, 0.16, 'sawtooth', 0.07, 180); },
  stack() { tone(440, 0.08, 'triangle', 0.12, 620); },
  ding() { tone(1046, 0.22, 'sine', 0.14); tone(1568, 0.3, 'sine', 0.09); },
  serve() {
    tone(784, 0.12, 'triangle', 0.13);
    setTimeout(() => tone(1046, 0.16, 'triangle', 0.13), 90);
    setTimeout(() => tone(1318, 0.22, 'triangle', 0.12), 180);
  },
  error() { tone(160, 0.16, 'square', 0.08, 110); },
  expire() { tone(392, 0.2, 'sawtooth', 0.08, 196); setTimeout(() => tone(262, 0.3, 'sawtooth', 0.08, 131), 160); },
  newOrder() { tone(587, 0.1, 'triangle', 0.1); setTimeout(() => tone(880, 0.12, 'triangle', 0.1), 100); },
  gameOver() {
    [523, 415, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.28, 'triangle', 0.12), i * 170));
  },
};
