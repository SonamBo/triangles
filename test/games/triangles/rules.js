// The rules of Triangles without a browser. Run: node test/games/triangles/rules.js
import { Board, FENCE } from '../../../www/games/triangles/board.js';
import { segmentsMeet, inTriangle } from '../../../www/games/triangles/geom.js';
import { choose, hint, exposure } from '../../../www/games/triangles/ai.js';
import { levelSpec, buildLevel, zoneOf } from '../../../www/games/triangles/levels.js';

let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.error('FAIL', msg); } };

// geometry
const P = (x, y) => ({ x, y });
ok(segmentsMeet(P(0, 0), P(10, 10), P(0, 10), P(10, 0)), 'an X crosses');
ok(!segmentsMeet(P(0, 0), P(10, 0), P(0, 5), P(10, 5)), 'parallel lines do not');
{ const a = P(0, 0); ok(!segmentsMeet(a, P(10, 0), a, P(0, 10)), 'lines sharing a dot are fine'); }
ok(segmentsMeet(P(0, 0), P(10, 0), P(5, 0), P(5, 8)), 'a T touches');
ok(inTriangle(P(3, 3), P(0, 0), P(10, 0), P(0, 10)), 'inside');
ok(!inTriangle(P(9, 9), P(0, 0), P(10, 0), P(0, 10)), 'outside');

// a square with a centre dot: 0 1 / 3 2 corners, 4 in the middle
const square = () => new Board({ dots: [P(50, 50), P(250, 50), P(250, 250), P(50, 250), P(150, 150)] });
{
  const b = square();
  ok(!b.isLegal(0, 2), 'a diagonal through the centre dot is blocked');
  ok(b.isLegal(0, 4) && b.isLegal(0, 1), 'edges and spokes are legal');
  b.play(0, 1, 0); b.play(1, 4, 1);
  ok(b.gain(0, 4) === 1, 'the third side scores 1');
  const r = b.play(0, 4, 0);
  ok(r.points === 1 && b.scores[0] === 1 && b.tris.length === 1, 'claimed for the player who closed it');
  b.play(4, 2, 1); b.play(2, 1, 0);
  ok(b.scores[0] === 2, 'closing 1-2-4');
  b.play(3, 4, 1); b.play(3, 2, 1);
  ok(b.scores[1] === 1, 'one line, one triangle 2-3-4');
  ok(b.gain(0, 3) === 1, 'last side: one triangle');
  b.play(0, 3, 0);
  ok(b.over && b.scores[0] === 3 && b.scores[1] === 1, `game over 3-1, got ${b.scores}`);
}
{
  // two triangles at once
  const b = square();
  for (const [i, j] of [[0, 1], [1, 2], [0, 4], [2, 4]]) b.play(i, j, 1);
  ok(b.gain(1, 4) === 2, 'the shared side of two triangles scores 2');
  const r = b.play(1, 4, 0);
  ok(r.closed.length === 2 && b.scores[0] === 2, 'both claimed');
}
{
  // a triangle with a dot inside scores nothing
  const b = new Board({ dots: [P(20, 300), P(300, 300), P(160, 20), P(160, 200)] });
  b.play(0, 1, 0); b.play(1, 2, 1);
  ok(b.gain(0, 2) === 0, 'a dot inside: no point');
  b.play(0, 2, 0);
  ok(b.scores[0] === 0, 'still no point');
}
{
  // undo puts everything back
  const b = square();
  const recs = [];
  const before = JSON.stringify([...b.legal].sort());
  for (const [i, j, p] of [[0, 1, 0], [1, 4, 1], [0, 4, 0], [2, 4, 1]]) recs.push(b.play(i, j, p));
  while (recs.length) b.undo(recs.pop());
  ok(JSON.stringify([...b.legal].sort()) === before && b.lines.size === 0 && b.scores.join() === '0,0' && b.tris.length === 0, 'undo restores the board');
}
{
  // treats
  const b = new Board({ dots: [P(20, 300), P(300, 300), P(160, 20)], treats: [{ x: 160, y: 200 }] });
  b.play(0, 1, 0); b.play(1, 2, 1);
  ok(b.gain(0, 2) === 3, 'a treat triangle scores 3');
  const r = b.play(0, 2, 1);
  ok(b.scores[1] === 3 && b.treats[0].taken === 1, 'treat taken');
  b.undo(r);
  ok(b.treats[0].taken === -2 && b.scores[1] === 0, 'treat back after undo');
}
{
  // a treat exactly on a line goes to the first triangle that closes around it
  const b = new Board({ dots: [P(20, 300), P(300, 300), P(160, 20), P(160, 340)], treats: [{ x: 160, y: 300 }] });
  b.play(0, 1, 0); b.play(1, 2, 1);
  ok(b.gain(0, 2) === 3, 'a treat on the edge still counts');
}
{
  // puddles
  const b = new Board({ dots: [P(20, 150), P(300, 150), P(160, 20)], puddles: [{ x: 160, y: 150, r: 25 }] });
  ok(!b.isLegal(0, 1) && b.isLegal(0, 2), 'a puddle blocks the line through it');
}
{
  // fences
  const b = new Board({ dots: [P(20, 300), P(300, 300), P(160, 20)], fences: [[0, 1], [1, 2]] });
  ok(b.has(0, 1) && b.lines.get(1 * 1000 + 2) === FENCE && b.drawn === 0, 'fences are drawn and owned by nobody');
  ok(b.gain(0, 2) === 1, 'closing on fences scores');
}
{
  // fireflies: one lights up after 2 lines, and the yard changes
  const b = new Board({ dots: [P(20, 300), P(300, 300), P(160, 20), P(160, 220, ), { x: 160, y: 120, wave: 2 }] });
  ok(b.visible.length === 4 && !b.isLegal(0, 4), 'the firefly is dark at first');
  const r1 = b.play(0, 1, 0);
  const r2 = b.play(2, 3, 1);
  ok(r2.revealed && b.dots[4].gone, 'a firefly landing on a line flies away');
  b.undo(r2); b.undo(r1);
  ok(!b.dots[4].on && !b.dots[4].gone && b.visible.length === 4, 'undo puts it back in the dark');
  b.play(0, 1, 0);
  b.play(0, 2, 1);
  ok(b.dots[4].on && b.isLegal(2, 4), 'a firefly in open ground lights up and can be used');
}

// AI basics
{
  const b = square();
  for (const [i, j] of [[0, 1], [1, 4]]) b.play(i, j, 0);
  const m = choose(b, 1, { style: 'smart', rand: () => 0.3 });
  ok(m && b.gain(m[0], m[1]) === 1, 'smart takes the open triangle');
  const s = choose(b, 1, { style: 'sleepy', rand: () => 0.3 });
  ok(s && b.gain(s[0], s[1]) === 0, 'sleepy never takes one');
  const h = hint(b, 0);
  ok(h && b.gain(h[0], h[1]) === 1, 'a hint shows the scoring line');
  ok(exposure(b, 2, 4, 0) >= 1, 'exposure sees a gift');
}
{
  // sleepy naps when only scoring lines are left
  const b = new Board({ dots: [P(20, 300), P(300, 300), P(160, 20)] });
  b.play(0, 1, 0); b.play(1, 2, 0);
  ok(choose(b, 1, { style: 'sleepy' }) === null, 'sleepy naps');
}

// every level builds, is playable to the end, and its puzzle is solvable
let built = 0;
for (let level = 1; level <= 70; level++) {
  for (const team of ['cat', 'dog']) {
    const spec = levelSpec(level, team);
    const { board, moves, goal } = buildLevel(spec);
    for (const [i, j, p] of moves) board.play(i, j, p);
    ok(board.legal.size > 0, `level ${level} has moves`);
    if (spec.kind === 'puzzle') {
      ok(goal && goal.kind === spec.puzzle, `level ${level} has a goal`);
      if (goal.kind === 'double') ok(board.legalMoves().some(([i, j]) => board.gain(i, j) >= 2), `level ${level}: a double exists`);
    }
    ok(team === 'cat' ? !['patch', 'mittens', 'marmalade', 'pepper', 'biscuit', 'kitten'].includes(spec.rival) : !['rex', 'bruno', 'daisy', 'pip', 'dotty', 'pup'].includes(spec.rival), `level ${level}: the rival is on the other team`);
    // play it out with two bots
    let turn = spec.first, guard = 0;
    while (!board.over && guard++ < 400) {
      const m = choose(board, turn, { style: 'normal' });
      if (m) board.play(m[0], m[1], turn);
      turn = 1 - turn;
    }
    ok(board.over, `level ${level} ends`);
    built++;
  }
}
ok(zoneOf(11).name === 'The Park' && zoneOf(51).name === 'The Backyard II', 'zone names');
ok(levelSpec(1).kind === 'tutorial' && levelSpec(5).kind === 'puzzle' && levelSpec(10).kind === 'boss', 'level kinds');
const s = JSON.stringify(buildLevel(levelSpec(23)).board.dots);
ok(s === JSON.stringify(buildLevel(levelSpec(23)).board.dots), 'a level is the same yard every time');

console.log(`${passes} passed, ${fails} failed (${built} level builds played out)`);
process.exit(fails ? 1 : 0);
