/**
 * The layer around the matches, in a phone-sized browser: undo, the ready
 * nudge, stars and replays, the Daily Yard, characters joining, achievements
 * and the Shop's yard themes. Needs the dev server: node serve.js 8080
 */
import pw from 'playwright';

const SHOTS = process.env.SHOTS || '';
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SHOTS ? 2 : 1 });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const shot = async (name) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/meta-${name}.png` }); };

await p.goto('http://localhost:8080/?dev=1&lobby=1');
await p.evaluate(() => localStorage.clear());
await p.reload(); await p.waitForTimeout(800);
await p.click('[data-play]'); await p.waitForTimeout(400);
await p.click('[data-team="cat"]'); await p.waitForTimeout(600);
// The shell's day-two gift card (1.17.0) would sit over the map after a level
// break; this test is about the game's own cards, so the gift is already taken.
await p.evaluate(() => { shell.gift.status = 'claimed'; });

const center = async (i) => { const bb = await p.locator(`.L-dots [data-i="${i}"] .dot-core`).boundingBox(); return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }; };
const drag = async (i, j) => { const a = await center(i), c = await center(j); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + c.x) / 2, (a.y + c.y) / 2, { steps: 3 }); await p.mouse.move(c.x, c.y, { steps: 3 }); await p.mouse.up(); };
const myTurn = async () => { for (let k = 0; k < 60; k++) { if (await p.evaluate(() => __tg.M && !__tg.M.over && __tg.M.turn === 0 && !__tg.M.busy)) return true; if (await p.evaluate(() => !__tg.M || __tg.M.over)) return false; await p.waitForTimeout(150); } return false; };
const best = () => p.evaluate(() => {
  const B = __tg.M.board; const ms = B.legalMoves();
  ms.sort((a, c) => B.gain(c[0], c[1]) - B.gain(a[0], a[1]));
  if (B.gain(ms[0][0], ms[0][1]) > 0) return ms[0];
  for (const [i, j] of ms) { const r = B.play(i, j, 0); let e = 0; for (const [x, y] of B.legalMoves()) e = Math.max(e, B.gain(x, y)); B.undo(r); if (!e) return [i, j]; }
  return ms[0];
});
async function playOut() { for (let k = 0; k < 150; k++) { if (!await myTurn()) break; const m = await best(); if (!m) break; await drag(m[0], m[1]); await p.waitForTimeout(80); } await p.waitForTimeout(1500); }
async function dismiss() { for (let k = 0; k < 8; k++) { await p.waitForTimeout(250); const b = p.locator('.tg-card-wrap.in [data-act="ok"]'); if (!await b.count()) break; await b.first().click(); } await p.waitForTimeout(300); }
const toMap = (level) => p.evaluate((lv) => { if (lv) __tg.save.level = lv; __tg.map(); }, level);
const title = () => p.evaluate(() => document.querySelector('.tg-card-wrap.in .tg-card-title')?.textContent || '');

// The tutorial win, then on to level 2.
await playOut();
await p.click('.tg-card [data-act="next"]'); await p.waitForTimeout(1500);
ok(await p.evaluate(() => !!document.querySelector('.tg-card-wrap.in .tg-medal')), 'the first win unlocks an achievement card');
await shot('achievement');
await dismiss();
ok(await p.evaluate(() => __tg.save.stars[1] >= 1), 'level 1 earns stars');

// Undo: draw a line, undo it, the line and the rival's answer are gone, the free undo is used.
await p.click('.tg-map-foot [data-act="play"]'); await p.waitForTimeout(1600);
await myTurn();
const lines0 = await p.evaluate(() => __tg.M.board.lines.size);
const m1 = await best(); await drag(m1[0], m1[1]);
await myTurn();
ok(await p.evaluate(() => __tg.M.board.lines.size) > lines0, 'a line was drawn');
ok(await p.locator('[data-act="undo"] em').textContent() === 'free', 'the first undo is free');
await p.click('[data-act="undo"]'); await p.waitForTimeout(300);
ok(await p.evaluate(() => __tg.M.board.lines.size) === lines0, 'undo takes back your line and the reply');
ok(await p.evaluate(() => __tg.M.turn === 0 && __tg.M.undos === 1), "it's your turn again");
await shot('undo');

// The ready nudge: leave a triangle open on your turn and wait.
const setUp = await p.evaluate(() => {
  // find a line that leaves a triangle ready for the next move, and play it for the player
  const M = __tg.M, B = M.board;
  for (const [i, j] of B.legalMoves()) { const r = B.play(i, j, 0); let g = 0; for (const [x, y] of B.legalMoves()) g = Math.max(g, B.gain(x, y)); B.undo(r); if (g) return [i, j]; }
  return null;
});
if (setUp) {
  await p.evaluate(([i, j]) => { const M = __tg.M; M.history.push({ rec: M.board.play(i, j, 1), player: 1 }); }, setUp);
  await p.evaluate(() => { __tg.M.svg.dispatchEvent(new Event('noop')); });
}
await p.waitForTimeout(5600);
const nudged = await p.evaluate(() => !!document.querySelector('.ready-line'));
ok(!setUp || nudged || await p.evaluate(() => __tg.M.turn !== 0), 'a ready triangle glows after 5 seconds');
await shot('ready');
await playOut();
const won2 = (await title()).includes('yard');
ok((await p.locator('.tg-stars i').count()) === 3, 'the result card shows three star slots');
await shot('stars');
await p.click('.tg-card [data-act="next"], .tg-card [data-act="map"]'); await p.waitForTimeout(1500);
await dismiss();

// Replays: a beaten level is tappable from the map and doesn't move progress.
await toMap(); await p.waitForTimeout(300);
const levelBefore = await p.evaluate(() => __tg.save.level);
ok(await p.locator('.tg-node.done').count() >= 1, 'beaten levels show on the map');
await p.locator('.tg-node.done').first().click(); await p.waitForTimeout(1700);
ok(await p.evaluate(() => __tg.M?.replay === true), 'tapping a beaten level replays it');
await playOut();
await shot('replay-end');
await p.click('.tg-card [data-act="next"], .tg-card [data-act="map"]').catch(() => {}); await p.waitForTimeout(1200);
await dismiss();
ok(await p.evaluate(() => __tg.save.level) === levelBefore, 'a replay leaves progress where it was');

// Daily Yard: once a day, with a streak.
await toMap(); await p.waitForTimeout(300);
ok(await p.locator('[data-act="daily"] .tg-dot').count() === 1, 'the Daily Yard shows a dot until played');
await p.click('[data-act="daily"]'); await p.waitForTimeout(400);
await shot('daily-card');
await p.click('.tg-card [data-act="go"]'); await p.waitForTimeout(1700);
ok(await p.evaluate(() => __tg.M?.daily === true), 'the Daily Yard starts');
await playOut();
const dailyWon = (await title()).includes('yard');
await p.click('.tg-card [data-act="next"], .tg-card [data-act="map"]').catch(() => {}); await p.waitForTimeout(1200);
await dismiss();
if (dailyWon) ok(await p.evaluate(() => __tg.save.daily.streak === 1), 'winning starts a streak');

// Characters: locked until their zone's boss falls, then a card says who joined.
await toMap(10); await p.waitForTimeout(300);
await p.click('.tg-me'); await p.waitForTimeout(300);
ok(await p.locator('.tg-char.locked').count() === 4, 'four cats wait to be unlocked at the start');
await shot('chars-locked');
await p.click('.tg-card [data-act="done"]'); await p.waitForTimeout(300);
await p.evaluate(() => { __tg.save.level = 10; });
await p.click('.tg-map-foot [data-act="play"]'); await p.waitForTimeout(1600);
await p.evaluate(() => __tg.win());
for (let k = 0; k < 30 && !(await p.locator('.tg-card-wrap.in').count()); k++) await p.waitForTimeout(200);
if (await p.locator('.tg-card-wrap.in [data-act="next"]').count()) {
  await p.click('.tg-card [data-act="next"]'); await p.waitForTimeout(1500);
  const friend = await p.evaluate(() => document.querySelector('.tg-card-wrap.in .tg-friends')?.innerText || '');
  ok(/Mittens/.test(friend) && /Bruno/.test(friend), 'beating the Backyard boss brings Mittens and Bruno');
  await shot('friends');
  await p.click('.tg-card [data-act="ok"]').catch(() => {}); await p.waitForTimeout(800);
}

// Achievements: the first win pays out once and shows in the list.
for (let k = 0; k < 6 && await p.locator('.tg-card-wrap.in [data-act="ok"]').count(); k++) { await p.click('.tg-card-wrap.in [data-act="ok"]'); await p.waitForTimeout(300); }
await toMap(); await p.waitForTimeout(300);
ok(await p.evaluate(() => !!__tg.save.ach['first-win']), 'the first win is an achievement');
await p.click('[data-act="trophies"]'); await p.waitForTimeout(400);
ok(await p.locator('.tg-ach li').count() >= 12, 'the achievements list shows them all');
await shot('achievements');
await p.click('.tg-card [data-act="ok"]'); await p.waitForTimeout(300);

// The Shop sells yard themes.
await p.click('.pause-btn'); await p.waitForTimeout(400);
await p.locator('button:visible', { hasText: 'Shop' }).first().click(); await p.waitForTimeout(600);
const shop = await p.evaluate(() => document.body.innerText);
ok(/Picnic blanket/.test(shop) && /Starry sky/.test(shop), 'the Shop lists the yard themes');
await shot('shop');

ok(!errs.length, 'no page errors: ' + errs.join(' | '));
await b.close();
console.log(fails.length ? fails.map((f) => 'FAIL ' + f).join('\n') : 'triangles meta test: all passed');
process.exit(fails.length ? 1 : 0);
