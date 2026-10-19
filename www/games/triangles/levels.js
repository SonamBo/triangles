/**
 * The neighbourhood: zones of ten levels, each zone adding one twist, every
 * fifth level a puzzle and every tenth a boss. Levels are generated from their
 * number, so level 37 is the same yard for everyone and nothing is stored.
 *
 *   1–10   The Backyard    the basics; level 1 is the tutorial
 *   11–20  The Park        treat triangles score 3
 *   21–30  Rainy Lane      puddles no line can cross
 *   31–40  Fence Row       some lines are drawn before the match
 *   41–50  Night Garden    fireflies light up new dots mid-match
 *   51+    the same streets again, with every twist mixed in and sharper rivals
 */

import { Board, FENCE } from './board.js';
import { choose, bestGain, exposure, skilled } from './ai.js';
import { W, H, dist, rng } from './geom.js';

/* ---------------- characters ---------------- */

export const CATS = ['patch', 'mittens', 'marmalade', 'pepper', 'biscuit'];
export const DOGS = ['rex', 'bruno', 'daisy', 'pip', 'dotty'];
const NAMES = {
  patch: 'Patch', mittens: 'Mittens', marmalade: 'Marmalade', pepper: 'Pepper', biscuit: 'Biscuit',
  rex: 'Rex', bruno: 'Bruno', daisy: 'Daisy', pip: 'Pip', dotty: 'Dotty', pup: 'Pup', kitten: 'Kitten',
};
export const nameOf = (id) => NAMES[id] || id;
export const teamOf = (id) => (CATS.includes(id) || id === 'kitten' ? 'cat' : 'dog');

/** Art for a character in a mood: 'happy' | 'think' | 'sad' | 'sleep'. */
export function face(id, mood = 'happy') {
  if (id === 'pup') return `img/dog-pup-${mood === 'think' ? 'happy' : mood}.png`;
  if (id === 'kitten') return mood === 'sleep' ? 'img/cat-biscuit-slump.png' : 'img/cat-biscuit-face.png';
  if (teamOf(id) === 'dog') return `img/dog-${id}-${mood === 'sleep' ? 'think' : mood}.png`;
  return mood === 'sleep' ? `img/cat-${id}-slump.png` : `img/cat-${id}-face.png`;
}
export function pose(id, kind) {
  if (teamOf(id) === 'cat') return `img/cat-${id === 'kitten' ? 'biscuit' : id}-${kind}.png`;
  if (kind === 'cheer' && id !== 'pup') return `img/dog-${id}-cheer.png`;
  return face(id, kind === 'slump' ? 'sad' : 'happy');
}

/* ---------------- zones ---------------- */

export const ZONES = [
  { id: 'backyard', name: 'The Backyard', twist: null, rival: { cat: 'rex', dog: 'patch' } },
  { id: 'park', name: 'The Park', twist: 'treats', rival: { cat: 'daisy', dog: 'marmalade' } },
  { id: 'rain', name: 'Rainy Lane', twist: 'puddles', rival: { cat: 'bruno', dog: 'pepper' } },
  { id: 'fence', name: 'Fence Row', twist: 'fences', rival: { cat: 'pip', dog: 'mittens' } },
  { id: 'night', name: 'Night Garden', twist: 'fireflies', rival: { cat: 'dotty', dog: 'biscuit' } },
];

export const TWISTS = {
  treats: { name: 'Treat triangles', line: 'Close a triangle around a treat and it scores 3 instead of 1.' },
  puddles: { name: 'Puddles', line: 'No line can cross a puddle. Plan your way around them.' },
  fences: { name: 'Fences', line: 'Some lines are already drawn before the match starts. Watch for half-built triangles!' },
  fireflies: { name: 'Fireflies', line: 'Partway through, fireflies light up new dots, and the yard changes.' },
};

const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII'];
export function zoneOf(level) {
  const z = Math.floor((level - 1) / 10);
  const base = ZONES[z % ZONES.length];
  const round = Math.floor(z / ZONES.length);
  return { ...base, index: z, round, name: base.name + (ROMAN[round] ?? ` ${round + 1}`), first: z * 10 + 1, last: z * 10 + 10 };
}

/* ---------------- a level ---------------- */

/**
 * How good the rival is, 0..1. It climbs a little every level: about 0.2 by
 * the end of the Backyard, 0.4 by the end of the Park, 0.7 at Fence Row's end,
 * 0.8 in the Night Garden and near-perfect late in round two. A new zone opens slightly easier (its twist is
 * new), and a boss is a step harder than the levels around it. Each loss in a
 * row on the same level takes some off, so nobody is stuck for long.
 */
export function rivalSkill(level, losses = 0) {
  const p = (level - 1) % 10 + 1;
  let s = level <= 4 ? 0.05 : 0.05 + 0.9 * Math.pow(Math.max(0, level - 2) / 58, 0.8);
  if (p <= 2 && level > 10) s -= 0.04;
  if (p === 10) s += 0.1;
  s -= 0.08 * Math.min(3, losses);
  return Math.max(0, Math.min(0.97, s));
}

const PUZZLES = ['double', 'safe', 'comeback'];

/**
 * Everything about a level except its board. `team` is the player's team;
 * the rival is always from the other one.
 */
export function levelSpec(level, team = 'cat', { losses = 0 } = {}) {
  const zone = zoneOf(level);
  const p = (level - 1) % 10 + 1;
  const kind = level === 1 ? 'tutorial' : p === 10 ? 'boss' : p === 5 ? 'puzzle' : 'match';
  const other = team === 'cat' ? 'dog' : 'cat';
  const rival = level === 1 ? (other === 'dog' ? 'pup' : 'kitten') : zone.rival[team];
  const skill = kind === 'tutorial' ? 0 : rivalSkill(level, losses);
  const style = kind === 'tutorial' ? 'sleepy' : kind === 'puzzle' ? (zone.index ? 'normal' : 'steady') : skilled(skill);
  // A new player gets a rival that stops pulling ahead once it leads by `band`.
  const band = level <= 4 ? 1 : level <= 9 ? 3 : 0;

  let dots;
  if (zone.index === 0) dots = [7, 8, 9, 10, 10, 11, 12, 12, 13, 14][p - 1];
  else dots = Math.min(26, 11 + 2 * Math.min(zone.index, 4) + 2 * zone.round + Math.floor((p - 1) * 0.7));

  // A zone's own twist at full strength; twists from earlier zones keep
  // turning up, lighter, so nothing learned is forgotten.
  const ORDER = { treats: 1, puddles: 2, fences: 3, fireflies: 4 };
  const here = (name) => zone.twist === name;
  const seen = (name) => kind !== 'puzzle' && (zone.round > 0 || zone.index > ORDER[name]);
  const twists = {
    treats: here('treats') ? 2 + Math.floor(p / 4) : seen('treats') ? 1 + (p % 2) : 0,
    puddles: here('puddles') ? 2 + (p >= 6 ? 1 : 0) : seen('puddles') ? 1 + (p % 2) : 0,
    fences: here('fences') ? 3 + Math.floor(p / 3) : seen('fences') ? 2 : 0,
    fireflies: here('fireflies') ? 3 + Math.floor(p / 4) : seen('fireflies') ? 2 : 0,
  };

  const puzzle = kind === 'puzzle' ? PUZZLES[zone.index % PUZZLES.length] : null;
  return {
    level, zone, p, kind, rival, style, skill, band, dots, twists, puzzle,
    first: level <= 4 || level % 2 === 0 ? 0 : 1,       // who draws the first line
    seed: level * 7919 + 17,
  };
}

/* ---------------- the yard ---------------- */

const MARGIN = 22;

/** Scatter n dots (plus fireflies) so none sits too close to another or in a puddle. */
function scatter(rand, n, puddles, extra = 0) {
  const minD = 0.8 * Math.sqrt(((W - 2 * MARGIN) * (H - 2 * MARGIN)) / (n + extra));
  const out = [];
  for (let tries = 0; tries < 6000 && out.length < n + extra; tries++) {
    const d = { x: Math.round(rand.range(MARGIN, W - MARGIN)), y: Math.round(rand.range(MARGIN, H - MARGIN)) };
    const relax = tries > 3000 ? 0.85 : 1;
    if (out.some((o) => dist(o, d) < minD * relax)) continue;
    if (puddles.some((p) => dist(p, d) < p.r + 14)) continue;
    out.push(d);
  }
  return out;
}

function makePuddles(rand, n) {
  const out = [];
  for (let tries = 0; tries < 500 && out.length < n; tries++) {
    const p = { x: Math.round(rand.range(70, W - 70)), y: Math.round(rand.range(70, H - 70)), r: Math.round(rand.range(22, 30)) };
    if (out.some((o) => dist(o, p) < o.r + p.r + 60)) continue;
    out.push(p);
  }
  return out;
}

function makeTreats(rand, n, dots, puddles) {
  const out = [];
  for (let tries = 0; tries < 800 && out.length < n; tries++) {
    const t = { x: Math.round(rand.range(MARGIN + 10, W - MARGIN - 10)), y: Math.round(rand.range(MARGIN + 10, H - MARGIN - 10)), value: 2 };
    if (dots.some((d) => dist(d, t) < 20)) continue;
    if (puddles.some((p) => dist(p, t) < p.r + 10)) continue;
    if (out.some((o) => dist(o, t) < 70)) continue;
    out.push(t);
  }
  return out;
}

/** Draw `n` short lines that don't complete anything. */
function addFences(board, rand, n) {
  const fences = [];
  const moves = board.legalMoves()
    .map(([i, j]) => ({ i, j, len: dist(board.dots[i], board.dots[j]) }))
    .sort((a, b) => a.len - b.len);
  const pool = moves.slice(0, Math.max(n * 4, Math.floor(moves.length * 0.4)));
  while (fences.length < n && pool.length) {
    const { i, j } = pool.splice(rand.int(pool.length), 1)[0];
    if (!board.isLegal(i, j) || board.gain(i, j) > 0) continue;
    board.place(i, j, FENCE);
    fences.push([i, j]);
  }
  return fences;
}

const TUTORIAL = {
  dots: [{ x: 70, y: 90 }, { x: 260, y: 70 }, { x: 170, y: 190 }, { x: 40, y: 290 }, { x: 290, y: 280 }, { x: 170, y: 352 }, { x: 305, y: 170 }],
};

/**
 * The board for a level, ready to play: { board, moves, goal }. `moves` are
 * lines already played (a puzzle's head start) as [i, j, player], and `goal`
 * describes what a puzzle asks for.
 */
export function buildLevel(spec) {
  if (spec.kind === 'tutorial') return { board: new Board(TUTORIAL), moves: [], goal: null };
  for (let attempt = 0; attempt < 40; attempt++) {
    const rand = rng(spec.seed + attempt * 104729);
    const built = spec.kind === 'puzzle' ? puzzleBoard(spec, rand) : matchBoard(spec, rand);
    if (built) return built;
  }
  // Never expected, but a level must always load: fall back to a plain yard.
  return matchBoard({ ...spec, twists: { treats: 0, puddles: 0, fences: 0, fireflies: 0 } }, rng(spec.seed));
}

function yard(spec, rand, { twists = spec.twists } = {}) {
  const puddles = makePuddles(rand, twists.puddles);
  const pts = scatter(rand, spec.dots, puddles, twists.fireflies);
  if (pts.length < Math.min(spec.dots, 7)) return null;
  const expected = 3 * pts.length - 6;
  const dots = pts.map((d, i) => (i >= pts.length - twists.fireflies ? { ...d, wave: Math.round(expected * 0.3) } : d));
  const treats = makeTreats(rand, twists.treats, pts, puddles);
  return { dots, puddles, treats };
}

/** Points on the outside of the yard's dots: their convex hull. */
export function hullSize(pts) {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (list) => {
    const h = [];
    for (const q of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    return h;
  };
  return half(p).length + half(p.reverse()).length - 2;
}

function matchBoard(spec, rand) {
  const y = yard(spec, rand);
  if (!y) return null;
  // A finished yard is (nearly always) a full triangulation, so the number of
  // triangles doesn't depend on how it was played. Keep yards where that
  // number is odd (treats are worth 3, also odd) and a match can't tie. A few
  // random playouts check it, since dots almost in a line can leave a gap.
  // Puddles and fireflies break the count; those levels can tie, and a tie is
  // simply played again.
  if (!y.puddles.length && !y.dots.some((d) => d.wave)) {
    for (let k = 0; k < 3; k++) {
      const b = new Board(y);
      const r = rng(spec.seed + k);
      let turn = 0;
      while (!b.over) { const [i, j] = b.legalMoves()[r.int(b.legal.size)]; b.play(i, j, turn); turn = 1 - turn; }
      if ((b.scores[0] + b.scores[1]) % 2 === 0) return null;
    }
  }
  const board = new Board(y);
  if (board.legal.size < 6) return null;
  const fences = spec.twists.fences ? addFences(board, rand, spec.twists.fences) : [];
  return { board: new Board({ ...y, fences }), moves: [], goal: null, fences };
}

/* ---------------- puzzles ---------------- */

export const PUZZLE_TEXT = {
  double: { title: 'Score 2 with one line', line: 'Find the line that closes two triangles at once.', moves: 1 },
  safe: { title: 'Three safe lines', line: 'Draw 3 lines without giving your rival a single triangle.', moves: 3 },
  comeback: { title: 'Comeback!', line: 'You’re behind. Turn it around and win the yard.', moves: 0 },
};

function puzzleBoard(spec, rand) {
  const y = yard(spec, rand, { twists: { treats: 0, puddles: spec.twists.puddles, fences: 0, fireflies: 0 } });
  if (!y) return null;
  const board = new Board(y);
  const quietDraw = (stop) => {
    const fences = [];
    for (let guard = 0; guard < 400 && !stop(fences); guard++) {
      const quiet = board.legalMoves().filter(([i, j]) => board.gain(i, j) === 0);
      if (!quiet.length) return null;
      const [i, j] = quiet[rand.int(quiet.length)];
      board.place(i, j, FENCE);
      fences.push([i, j]);
    }
    return fences;
  };

  if (spec.puzzle === 'double') {
    const fences = quietDraw(() => board.legalMoves().some(([i, j]) => board.gain(i, j) >= 2));
    if (!fences) return null;
    const scoring = board.legalMoves().filter(([i, j]) => board.gain(i, j) > 0);
    if (scoring.length > 4 || fences.length < 4) return null;
    return { board: new Board({ ...y, fences }), moves: [], goal: { ...PUZZLE_TEXT.double, kind: 'double', target: 2 }, fences };
  }

  if (spec.puzzle === 'safe') {
    // Draw lines that leave nothing to take, until only a handful of safe
    // lines remain: the tense moment before someone has to give something away.
    const safeLines = () => board.legalMoves().filter(([i, j]) => board.gain(i, j) === 0 && exposure(board, i, j, 0) === 0);
    const fences = [];
    for (let guard = 0; guard < 200; guard++) {
      const safe = safeLines();
      if (safe.length <= 6) break;
      const [i, j] = safe[rand.int(safe.length)];
      board.place(i, j, FENCE);
      fences.push([i, j]);
    }
    const n = safeLines().length;
    if (n < 3 || n > 6 || bestGain(board) > 0) return null;
    if (!canStaySafe(board, 3)) return null;
    return { board: new Board({ ...y, fences }), moves: [], goal: { ...PUZZLE_TEXT.safe, kind: 'safe', target: 3 }, fences };
  }

  // comeback: two steady bots play until the rival leads by 2–4, then it's yours.
  const moves = [];
  const bot = rng(spec.seed + 5);
  let turn = 0;
  const half = Math.round((3 * y.dots.length - 6) * 0.45);
  while (!board.over && moves.length < half) {
    const m = choose(board, turn, { style: turn === 1 ? 'normal' : 'easy', rand: bot });
    if (!m) break;
    board.play(m[0], m[1], turn);
    moves.push([m[0], m[1], turn]);
    turn = 1 - turn;
  }
  const behind = board.scores[1] - board.scores[0];
  if (turn !== 0 || behind < 2 || behind > 4 || board.over) return null;
  if (!winnable(board, bot)) return null;
  return { board: new Board(y), moves, goal: { ...PUZZLE_TEXT.comeback, kind: 'comeback' }, fences: [] };
}

/** Can the player draw `n` lines in a row, each answered by a smart rival, without the rival scoring? */
function canStaySafe(board, n) {
  if (n === 0) return true;
  for (const [i, j] of board.legalMoves()) {
    const r1 = board.play(i, j, 0);
    if (bestGain(board) === 0) {
      const m = choose(board, 1, { style: 'smart', rand: () => 0.5 });
      if (!m) { board.undo(r1); return true; }
      const r2 = board.play(m[0], m[1], 1);
      const ok = canStaySafe(board, n - 1);
      board.undo(r2);
      if (ok) { board.undo(r1); return true; }
    }
    board.undo(r1);
  }
  return false;
}

/** Can a strong player come back from here against the normal rival? Tried a few times. */
function winnable(board, rand) {
  let wins = 0;
  for (let t = 0; t < 3; t++) {
    const recs = [];
    let turn = 0;
    while (!board.over) {
      const m = choose(board, turn, { style: turn === 0 ? 'boss' : 'normal', rand });
      if (!m) break;
      recs.push(board.play(m[0], m[1], turn));
      turn = 1 - turn;
    }
    if (board.scores[0] > board.scores[1]) wins++;
    while (recs.length) board.undo(recs.pop());
  }
  return wins >= 2;
}

