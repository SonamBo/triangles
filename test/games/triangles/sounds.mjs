/**
 * Renders Triangles' own sounds through the shell's sound engine, offline,
 * and checks none is silent or clips. Writes dist/sound/triangles-sounds.wav
 * to listen to. Needs the dev server: node serve.js 8080
 */
import pw from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = join(ROOT, 'dist/sound');
mkdirSync(OUT, { recursive: true });
const b = await pw.chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:8080/css/tokens.css');
const res = await p.evaluate(async () => {
  const { createSound } = await import('/shell/sound.js');
  const { SOUNDS } = await import('/games/triangles/sounds.js');
  const names = Object.keys(SOUNDS);
  const SR = 44100, GAP = 1.1;
  const ctx = new OfflineAudioContext(1, Math.ceil(SR * GAP * names.length), SR);
  const s = createSound({ sfx: true, music: false, context: ctx });
  s.register(SOUNDS);
  names.forEach((n, k) => s.play(n, k * GAP));
  const buf = await ctx.startRendering();
  const d = buf.getChannelData(0);
  const per = names.map((n, k) => {
    let peak = 0, sum = 0;
    const a = Math.floor(k * GAP * SR), z = Math.floor((k + 1) * GAP * SR);
    for (let i = a; i < z; i++) { const v = Math.abs(d[i]); peak = Math.max(peak, v); sum += v * v; }
    return { name: n, peak: +peak.toFixed(3), rms: +Math.sqrt(sum / (z - a)).toFixed(4) };
  });
  // 16-bit WAV
  const pcm = new DataView(new ArrayBuffer(44 + d.length * 2));
  const w = (o, str) => [...str].forEach((c, i) => pcm.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); pcm.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVEfmt '); pcm.setUint32(16, 16, true); pcm.setUint16(20, 1, true);
  pcm.setUint16(22, 1, true); pcm.setUint32(24, SR, true); pcm.setUint32(28, SR * 2, true); pcm.setUint16(32, 2, true); pcm.setUint16(34, 16, true);
  w(36, 'data'); pcm.setUint32(40, d.length * 2, true);
  for (let i = 0; i < d.length; i++) pcm.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
  return { per, wav: Array.from(new Uint8Array(pcm.buffer)) };
});
writeFileSync(join(OUT, 'triangles-sounds.wav'), Buffer.from(res.wav));
let bad = 0;
for (const r of res.per) {
  const flag = r.peak >= 1 ? 'CLIPS' : r.rms < 0.002 ? 'SILENT' : 'ok';
  if (flag !== 'ok') bad++;
  console.log(`${r.name.padEnd(11)} peak ${r.peak}  rms ${r.rms}  ${flag}`);
}
await b.close();
process.exit(bad ? 1 : 0);
