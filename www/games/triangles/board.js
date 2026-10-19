/**
 * The rules of Triangles, with no drawing or timing in them.
 *
 * Dots sit in the yard. Players take turns drawing one straight line between
 * two dots. A line may not cross another line, touch a dot it doesn't end at,
 * or run through a puddle. A line that completes a triangle (three lines
 * between three dots) with no dot inside claims it for the player who drew
 * it; one line can complete two at once. A triangle that covers a treat is
 * worth more. When no line can be drawn, the most points wins.
 *
 * Player 0 is always the human at the bottom of the screen and player 1 the
 * rival. Fence lines (drawn before the match) belong to nobody.
 */

import { segmentsMeet, distToSegment, inTriangle, centroid, DOT_CLEAR } from './geom.js';

export const FENCE = -1;
const key = (i, j) => (i < j ? i * 1000 + j : j * 1000 + i);
const ends = (k) => [Math.floor(k / 1000), k % 1000];

export class Board {
  /**
   * @param {object} spec
   *   dots     [{x, y, wave?}]   wave > 0: a firefly that lights up once that many lines are drawn
   *   puddles  [{x, y, r}]
   *   treats   [{x, y, value}]   value: extra points for the triangle that covers it
   *   fences   [[i, j]]          lines already drawn, owned by nobody
   */
  constructor({ dots, puddles = [], treats = [], fences = [] }) {
    this.dots = dots.map((d, i) => ({ x: d.x, y: d.y, i, wave: d.wave || 0, on: !d.wave, gone: false }));
    this.puddles = puddles;
    this.treats = treats.map((t, i) => ({ ...t, i, value: t.value ?? 2, taken: -2 }));
    this.lines = new Map();            // key -> owner (0, 1 or FENCE)
    this.adj = this.dots.map(() => new Set());
    this.tris = [];                    // claimed: { a, b, c, owner, points, treat }
    this.scores = [0, 0];
    this.drawn = 0;                    // lines drawn in play, fences not counted
    this.waves = [...new Set(this.dots.map((d) => d.wave).filter(Boolean))].sort((a, b) => a - b);
    this.rebuildLegal();
    for (const [i, j] of fences) this.place(i, j, FENCE);
  }

  /* ---------------- reading ---------------- */

  get visible() { return this.dots.filter((d) => d.on && !d.gone); }
  has(i, j) { return this.lines.has(key(i, j)); }
  isLegal(i, j) { return i !== j && this.legal.has(key(i, j)); }
  legalMoves() { return [...this.legal].map(ends); }
  get over() { return this.legal.size === 0 && !this.pendingWave(); }

  /** The triangles a line between i and j would complete, and their points. */
  wouldClose(i, j) {
    const out = [];
    if (!this.isLegal(i, j)) return out;
    const [small, big] = this.adj[i].size < this.adj[j].size ? [this.adj[i], this.adj[j]] : [this.adj[j], this.adj[i]];
    for (const c of small) {
      if (!big.has(c)) continue;
      if (this.empty(i, j, c)) out.push({ a: i, b: j, c, points: 1 + this.treatAt(i, j, c).value });
    }
    return out;
  }
  gain(i, j) { let p = 0; for (const t of this.wouldClose(i, j)) p += t.points; return p; }

  /** No dot of the board strictly inside a-b-c. */
  empty(a, b, c) {
    const A = this.dots[a], B = this.dots[b], C = this.dots[c];
    for (const d of this.dots) {
      if (!d.on || d.gone || d === A || d === B || d === C) continue;
      if (inTriangle(d, A, B, C)) return false;
    }
    return true;
  }

  /** The treat a-b-c covers, or a zero-value stand-in. */
  treatAt(a, b, c) {
    const A = this.dots[a], B = this.dots[b], C = this.dots[c];
    for (const t of this.treats) if (t.taken === -2 && inTriangle(t, A, B, C)) return t;
    return { value: 0, i: -1 };
  }

  /* ---------------- playing ---------------- */

  /**
   * Draw a line for `player`. Returns a record of what changed, which
   * undo() takes back exactly: { i, j, player, closed: [tri], points, removed, revealed }.
   */
  play(i, j, player) {
    if (!this.isLegal(i, j)) throw new Error(`illegal line ${i}-${j}`);
    const closed = this.wouldClose(i, j).map((t) => ({ ...t, owner: player }));
    const rec = { i, j, player, closed, points: 0, removed: this.place(i, j, player), revealed: null };
    for (const t of closed) {
      const treat = this.treatAt(t.a, t.b, t.c);
      if (treat.i >= 0) treat.taken = player;
      t.treat = treat.i;
      this.tris.push(t);
      this.scores[player] += t.points;
      rec.points += t.points;
    }
    this.drawn += 1;
    rec.revealed = this.revealDue();
    return rec;
  }

  undo(rec) {
    if (rec.revealed) this.hideWave(rec.revealed);
    this.drawn -= 1;
    for (const t of rec.closed) {
      this.tris.pop();
      this.scores[rec.player] -= t.points;
      if (t.treat >= 0) this.treats[t.treat].taken = -2;
    }
    const k = key(rec.i, rec.j);
    this.lines.delete(k);
    this.adj[rec.i].delete(rec.j);
    this.adj[rec.j].delete(rec.i);
    for (const r of rec.removed) this.legal.add(r);
    this.legal.add(k);
  }

  /** Add a line and drop every legal line it now blocks. Returns those keys. */
  place(i, j, owner) {
    const k = key(i, j);
    this.lines.set(k, owner);
    this.adj[i].add(j);
    this.adj[j].add(i);
    this.legal.delete(k);
    const removed = [];
    const P = this.dots[i], Q = this.dots[j];
    for (const m of this.legal) {
      const [a, b] = ends(m);
      if (segmentsMeet(P, Q, this.dots[a], this.dots[b])) { this.legal.delete(m); removed.push(m); }
    }
    return removed;
  }

  /** Every line that could be drawn now, from scratch. */
  rebuildLegal() {
    this.legal = new Set();
    const vis = this.visible;
    const drawn = [...this.lines.keys()].map(ends);
    for (let x = 0; x < vis.length; x++) {
      for (let y = x + 1; y < vis.length; y++) {
        const A = vis[x], B = vis[y];
        if (this.lines.has(key(A.i, B.i))) continue;
        if (!this.clear(A, B, vis)) continue;
        if (drawn.some(([a, b]) => segmentsMeet(A, B, this.dots[a], this.dots[b]))) continue;
        this.legal.add(key(A.i, B.i));
      }
    }
  }

  /** A line A-B touches no other dot and no puddle. */
  clear(A, B, vis = this.visible) {
    for (const d of vis) if (d !== A && d !== B && distToSegment(d, A, B) < DOT_CLEAR) return false;
    for (const p of this.puddles) if (distToSegment(p, A, B) < p.r) return false;
    return true;
  }

  /* ---------------- fireflies ---------------- */

  pendingWave() { return this.waves.find((w) => this.dots.some((d) => d.wave === w && !d.on && !d.gone)) ?? 0; }

  /**
   * Light up the next wave of fireflies once enough lines are drawn, or at
   * once if nothing else can be played. A firefly that would land on a line or
   * inside a claimed triangle flies away instead.
   */
  revealDue() {
    const w = this.pendingWave();
    if (!w || (this.drawn < w && this.legal.size)) return null;
    const lit = [];
    for (const d of this.dots) {
      if (d.wave !== w || d.on || d.gone) continue;
      const onLine = [...this.lines.keys()].some((k) => { const [a, b] = ends(k); return distToSegment(d, this.dots[a], this.dots[b]) < DOT_CLEAR; });
      const inClaimed = this.tris.some((t) => inTriangle(d, this.dots[t.a], this.dots[t.b], this.dots[t.c]));
      if (onLine || inClaimed) { d.gone = true; lit.push({ i: d.i, gone: true }); continue; }
      d.on = true;
      lit.push({ i: d.i, gone: false });
    }
    this.rebuildLegal();
    return { wave: w, lit, legal: null };
  }

  hideWave(rev) {
    for (const { i } of rev.lit) { this.dots[i].on = false; this.dots[i].gone = false; }
    this.rebuildLegal();
  }

  /* ---------------- the end ---------------- */

  /**
   * At most how many more points are out there: every empty triangle that
   * could still be completed, counted once. An overestimate (they can't all be
   * claimed), which is what deciding "can't be caught" needs.
   */
  potential() {
    const vis = this.visible;
    const ok = (a, b) => this.has(a, b) || this.isLegal(a, b);
    let total = 0;
    for (let x = 0; x < vis.length; x++) {
      for (let y = x + 1; y < vis.length; y++) {
        const a = vis[x].i, b = vis[y].i;
        if (!ok(a, b)) continue;
        for (let z = y + 1; z < vis.length; z++) {
          const c = vis[z].i;
          if (!ok(a, c) || !ok(b, c)) continue;
          if (this.has(a, b) && this.has(a, c) && this.has(b, c)) continue;
          if (!this.empty(a, b, c)) continue;
          total += 1 + this.treatAt(a, b, c).value;
        }
      }
    }
    return total + (this.pendingWave() ? 99 : 0);
  }

  center(t) { return centroid(this.dots[t.a], this.dots[t.b], this.dots[t.c]); }

  /** Lines drawn so far as [i, j, owner], fences first: enough to rebuild. */
  lineList() { return [...this.lines].map(([k, o]) => [...ends(k), o]); }
}
