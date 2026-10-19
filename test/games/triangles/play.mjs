/**
 * Triangles in a phone-sized browser: a new player picks a team, is walked
 * through the first match and wins it, sees the map, and solves the first
 * puzzle. Needs the dev server: node serve.js 8080
 */
import pw from 'playwright';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:8080/?dev=1');
await p.evaluate(() => localStorage.clear());
await p.reload(); await p.waitForTimeout(800);
await p.click('[data-play]'); await p.waitForTimeout(500);
ok(await p.locator('[data-team="cat"]').isVisible(), 'first launch asks for a team');
await p.click('[data-team="cat"]'); await p.waitForTimeout(700);
ok(await p.evaluate(() => __tg.view === 'match' && __tg.M.spec.kind === 'tutorial'), 'the first match is the tutorial');

const center = async (i) => { const bb = await p.locator(`.L-dots [data-i="${i}"] .dot-core`).boundingBox(); return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }; };
const drag = async (i, j) => { const a = await center(i), c = await center(j); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + c.x) / 2, (a.y + c.y) / 2, { steps: 4 }); await p.mouse.move(c.x, c.y, { steps: 4 }); await p.mouse.up(); };

// The tutorial only accepts the line it teaches.
await drag(3, 5); await p.waitForTimeout(200);
ok(await p.evaluate(() => __tg.M.board.lines.size === 0), 'a different line is refused while teaching');
await drag(0, 1); await p.waitForTimeout(2200);
ok(await p.evaluate(() => __tg.M.board.has(1, 2) && __tg.M.tut === 2), 'the pup draws the second side');
await drag(2, 0); await p.waitForTimeout(400);
ok(await p.evaluate(() => __tg.M.board.scores[0] === 1), 'closing it claims the first triangle');

// Play it out: the sleepy pup never scores, so this is always a win.
for (let k = 0; k < 80; k++) {
  const st = await p.evaluate(() => ({ over: !__tg.M || __tg.M.over, mine: __tg.M && __tg.M.turn === 0 && !__tg.M.busy }));
  if (st.over) break;
  if (!st.mine) { await p.waitForTimeout(200); continue; }
  const m = await p.evaluate(() => { const B = __tg.M.board; const ms = B.legalMoves(); ms.sort((a, b) => B.gain(b[0], b[1]) - B.gain(a[0], a[1])); return ms[0]; });
  await drag(m[0], m[1]); await p.waitForTimeout(150);
}
await p.waitForTimeout(1500);
ok((await p.locator('.tg-card .tg-card-title').textContent()) === 'Your first win!', 'the first match is won');
ok(await p.evaluate(() => __tg.M.board.scores[1] === 0), 'the pup never scored');
await p.click('.tg-card [data-act="next"]'); await p.waitForTimeout(1500);
ok(await p.evaluate(() => __tg.view === 'map' && __tg.save.level === 2), 'on to the map at level 2');

// The first puzzle: one line that closes two triangles.
await p.evaluate(() => { __tg.save.level = 5; });
await p.click('.tg-me'); await p.waitForTimeout(300); await p.click('.tg-card [data-act="done"]'); await p.waitForTimeout(400);
await p.click('.tg-map-foot [data-act="play"]'); await p.waitForTimeout(500);
await p.click('.tg-card [data-act]'); await p.waitForTimeout(400);       // "every fifth level is a puzzle"
await p.waitForTimeout(900);                                             // straight in: no "Let's go" tap
const dbl = await p.evaluate(() => { const B = __tg.M.board; return B.legalMoves().find(([i, j]) => B.gain(i, j) >= 2); });
ok(!!dbl, 'the puzzle has an answer');
await drag(dbl[0], dbl[1]); await p.waitForTimeout(1700);
ok((await p.locator('.tg-card .tg-card-title').textContent()) === 'Clever paws!', 'the puzzle is solved');

ok(!errs.length, 'no page errors: ' + errs.join(' | '));
await b.close();
console.log(fails.length ? fails.map((f) => 'FAIL ' + f).join('\n') : 'triangles play test: all passed');
process.exit(fails.length ? 1 : 0);
