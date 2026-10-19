/**
 * How a rival picks its line. Every style works on any Board and only reads
 * it (moves are tried and undone), so the same code drives rivals, hints, the
 * tutorial and the balance bot.
 *
 *   sleepy  never completes a triangle; naps (returns null) when that is all
 *           that's left. The first match: the player can't lose.
 *   easy    takes a triangle only some of the time, otherwise draws anything.
 *   mild    takes most triangles, rarely thinks about what it gives away.
 *   steady  takes triangles three times in four, sometimes plays safe.
 *   normal  usually takes triangles, often avoids handing them over.
 *   smart   always takes the most; never gives one away if it can help it.
 *   boss    looks one reply ahead: the line that nets the most after the
 *           other side's best answer.
 *
 * `kind` (0..1) is how often a rival in the early levels lets a lead go: once
 * it is `band` points ahead it stops taking triangles, so a new player isn't
 * flattened while learning.
 */

const shuffle = (arr, rand) => {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
};

/** The most the side to move could score with one line. */
export function bestGain(board) {
  let best = 0;
  for (const [i, j] of board.legal.size ? board.legalMoves() : []) {
    const g = board.gain(i, j);
    if (g > best) best = g;
  }
  return best;
}

/** What drawing i-j hands the other side: their best line right after. */
export function exposure(board, i, j, me) {
  const rec = board.play(i, j, me);
  const e = bestGain(board);
  board.undo(rec);
  return e;
}

/** Moves sorted into what they score now and what they give away. */
export function survey(board, me) {
  return board.legalMoves().map(([i, j]) => ({ i, j, gain: board.gain(i, j), risk: exposure(board, i, j, me) }));
}

export const STYLES = {
  sleepy: { take: 0, careful: 0 },
  easy: { take: 0.35, careful: 0 },
  mild: { take: 0.55, careful: 0.15 },
  steady: { take: 0.75, careful: 0.4 },
  firm: { take: 0.85, careful: 0.55 },
  normal: { take: 0.92, careful: 0.7 },
  smart: { take: 1, careful: 1 },
  boss: { take: 1, careful: 1, look: true },
};

/**
 * Pick a line for player `me`, or null to skip (only the sleepy style does).
 * opts: { style, rand, band, lead } — lead is my score minus theirs.
 */
export function choose(board, me, { style = 'normal', rand = Math.random, band = 0, lead = 0 } = {}) {
  const s = STYLES[style] || STYLES.normal;
  const moves = shuffle(board.legalMoves(), rand);
  if (!moves.length) return null;

  const scoring = [];
  const quiet = [];
  for (const [i, j] of moves) (board.gain(i, j) > 0 ? scoring : quiet).push([i, j]);
  const holdBack = band > 0 && lead >= band;

  if (style === 'sleepy') {
    if (!quiet.length) return null;
    // Leave the player something to close where possible: it's their first game.
    const gifts = quiet.filter(([i, j]) => exposure(board, i, j, me) > 0);
    return (gifts.length && rand() < 0.7 ? gifts : quiet)[0];
  }

  if (s.look && !holdBack) return lookahead(board, me, moves);

  if (scoring.length && !holdBack && rand() < s.take) {
    let best = scoring[0], bestG = -1;
    for (const [i, j] of scoring) {
      const g = board.gain(i, j);
      if (g > bestG || (g === bestG && s.careful >= 1 && exposure(board, i, j, me) < exposure(board, best[0], best[1], me))) { best = [i, j]; bestG = g; }
    }
    return best;
  }

  const pool = quiet.length ? quiet : moves;
  if (rand() < s.careful) {
    let best = null, least = Infinity;
    for (const [i, j] of pool) {
      const e = exposure(board, i, j, me);
      if (e < least) { least = e; best = [i, j]; if (e === 0) break; }
    }
    return best;
  }
  return pool[0];
}

/** Score now minus the best answer to it; ties go to the line that gives least. */
function lookahead(board, me, moves) {
  let best = moves[0], bestV = -Infinity;
  for (const [i, j] of moves) {
    const rec = board.play(i, j, me);
    const v = rec.points * 1.01 - bestGain(board);
    board.undo(rec);
    if (v > bestV) { bestV = v; best = [i, j]; }
  }
  return best;
}

/** The line a hint shows: the boss's choice, for the player. */
export function hint(board, me = 0) {
  const moves = board.legalMoves();
  return moves.length ? lookahead(board, me, moves) : null;
}
