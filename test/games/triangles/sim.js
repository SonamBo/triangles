// ci-args: 20 6
/**
 * Balance: bots of three strengths play every level against its rival and we
 * print how often each wins. A "steady" bot stands in for a new player, "normal"
 * for a regular, "smart" for a strong one.
 *
 *   node test/games/triangles/sim.js [games per level] [last level]
 *
 * Fails if level 1 can ever be lost, or if levels 2-4 are lost too often by a
 * new player: the first matches must feel winnable.
 */
import { levelSpec, buildLevel } from '../../../www/games/triangles/levels.js';
import { choose } from '../../../www/games/triangles/ai.js';
import { rng } from '../../../www/games/triangles/geom.js';

const games = Number(process.argv[2] || 20);
const last = Number(process.argv[3] || 60);
const PLAYERS = ['steady', 'normal', 'smart'];
let problems = 0;

function play(level, me, seed) {
  const spec = levelSpec(level, 'cat');
  if (spec.kind === 'puzzle') return null;
  const { board, moves } = buildLevel(spec);
  for (const [i, j, p] of moves) board.play(i, j, p);
  const rand = rng(seed);
  let turn = spec.first, lines = 0, guard = 0;
  while (!board.over && guard++ < 500) {
    const lead = board.scores[turn] - board.scores[1 - turn];
    const m = turn === 0
      ? choose(board, 0, { style: me, rand })
      : choose(board, 1, { style: spec.style, rand, band: spec.band, lead });
    if (m) { board.play(m[0], m[1], turn); lines++; }
    turn = 1 - turn;
  }
  return { win: board.scores[0] > board.scores[1], tie: board.scores[0] === board.scores[1], lines, score: board.scores };
}

const rows = [];
for (let level = 1; level <= last; level++) {
  const spec = levelSpec(level, 'cat');
  if (spec.kind === 'puzzle') { rows.push(`${String(level).padStart(3)}  puzzle (${spec.puzzle})`); continue; }
  const cells = [];
  let lines = 0;
  for (const me of PLAYERS) {
    let w = 0;
    for (let g = 0; g < games; g++) {
      const r = play(level, me, level * 1000 + g * 7 + me.length);
      if (r.win) w++;
      lines += r.lines;
    }
    const pct = Math.round((100 * w) / games);
    cells.push(`${me} ${String(pct).padStart(3)}%`);
    if (level === 1 && pct < 100) { problems++; console.error(`level 1 lost by a ${me} bot`); }
    if (games >= 10 && level >= 2 && level <= 4 && me === 'steady' && pct < 70) { problems++; console.error(`level ${level}: a new player wins only ${pct}%`); }
  }
  rows.push(`${String(level).padStart(3)}  ${spec.zone.name.padEnd(14)} ${spec.kind.padEnd(6)} ${spec.style.padEnd(7)} dots ${String(spec.dots).padStart(2)}  ${cells.join('  ')}  ~${Math.round(lines / (games * PLAYERS.length))} lines`);
}
console.log(rows.join('\n'));
process.exit(problems ? 1 : 0);
