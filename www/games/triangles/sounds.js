/**
 * Triangles' own sound effects, synthesized like the shell's: no audio files.
 * The shell plays them on its effects bus (manifest `sounds`), so the Sound
 * switch, ads and backgrounding silence them too.
 *
 * Each is (t, kit): t is when to start, kit holds { ctx, bus, tone, noise, N }.
 */

function voice(ctx, bus, t, dur, peak) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.035);
  g.gain.setValueAtTime(peak, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(bus);
  return g;
}

function band(ctx, freqs, q, times) {
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  freqs.forEach((hz, k) => (k ? f.frequency.linearRampToValueAtTime(hz, times[k]) : f.frequency.setValueAtTime(hz, times[k])));
  return f;
}

/** "Mi-aow": a buzzy voice through two moving vowel formants, pitch up then down. */
function meow(t, { ctx, bus }, pitch = 1, dur = 0.5) {
  const out = voice(ctx, bus, t, dur, 0.32);
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  const T = [t, t + dur * 0.25, t + dur * 0.65, t + dur];
  [480, 820, 660, 470].forEach((hz, k) => (k ? o.frequency.linearRampToValueAtTime(hz * pitch, T[k]) : o.frequency.setValueAtTime(hz * pitch, T[k])));
  const vib = ctx.createOscillator();
  const depth = ctx.createGain();
  vib.frequency.value = 7;
  depth.gain.value = 14 * pitch;
  vib.connect(depth); depth.connect(o.frequency);
  const f1 = band(ctx, [650, 1150, 900, 560], 5, T);
  const f2 = band(ctx, [2100, 1500, 1250, 950], 7, T);
  const g2 = ctx.createGain(); g2.gain.value = 0.55;
  o.connect(f1); f1.connect(out);
  o.connect(f2); f2.connect(g2); g2.connect(out);
  o.start(t); vib.start(t);
  o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
}

/** A short bark: a growly low voice with a puff of breath, once or twice. */
function bark(t, { ctx, bus, noise }, pitch = 1) {
  const dur = 0.17;
  const out = voice(ctx, bus, t, dur, 0.42);
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(330 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(150 * pitch, t + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1500, t);
  lp.frequency.exponentialRampToValueAtTime(500, t + dur);
  lp.Q.value = 4;
  o.connect(lp); lp.connect(out);
  o.start(t); o.stop(t + dur + 0.03);
  noise(t, 0.08, { gain: 0.12, from: 1200, to: 500, q: 1.2 });
}

export const SOUNDS = {
  meow: (t, kit) => meow(t, kit),
  'meow-small': (t, kit) => meow(t, kit, 1.25, 0.32),
  woof: (t, kit) => { bark(t, kit); bark(t + 0.24, kit, 0.92); },
  'woof-small': (t, kit) => bark(t, kit, 1.2),

  // Drawing: a pencil scratch as the line starts, a soft tick when it snaps to a dot.
  scratch: (t, { noise }) => noise(t, 0.12, { gain: 0.05, from: 4200, to: 2600, q: 0.8 }),
  snap: (t, { tone }) => tone(1250, t, 0.035, { type: 'sine', gain: 0.07 }),
  // A line laid down: a wooden tock with a little scratch.
  line: (t, { tone, noise }) => {
    tone(420, t, 0.08, { type: 'triangle', gain: 0.16, slide: 0.7 });
    noise(t, 0.06, { gain: 0.04, from: 3500, to: 2000, q: 0.9 });
  },
  // Yours: a bright rising pop. Theirs: a small falling sigh.
  claim: (t, { tone, N }) => [0, 4, 7, 12].forEach((s, i) => tone(N(s + 2), t + i * 0.045, 0.2, { type: 'triangle', gain: 0.15 })),
  'claim-big': (t, { tone, N }) => {
    [0, 4, 7, 12, 16].forEach((s, i) => tone(N(s + 2), t + i * 0.05, 0.26, { type: 'triangle', gain: 0.16 }));
    tone(N(26), t + 0.27, 0.4, { type: 'sine', gain: 0.1 });
  },
  lost: (t, { tone, N }) => { tone(N(-3), t, 0.16, { type: 'triangle', gain: 0.12 }); tone(N(-7), t + 0.12, 0.26, { type: 'triangle', gain: 0.11 }); },
  // The sleepy rival nods off: a slow low hum, twice.
  nap: (t, { tone }) => { tone(196, t, 0.45, { type: 'sine', gain: 0.1, attack: 0.15, slide: 0.85 }); tone(175, t + 0.5, 0.5, { type: 'sine', gain: 0.08, attack: 0.15, slide: 0.85 }); },
  // Fireflies lighting up.
  twinkle: (t, { tone, N }) => [12, 19, 16, 24].forEach((s, i) => tone(N(s), t + i * 0.07, 0.25, { type: 'sine', gain: 0.07 })),
};
