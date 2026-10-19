/**
 * Plane geometry for Triangles. Everything is in board units: the yard is
 * W x H, whatever size it is drawn at.
 */

export const W = 330;
export const H = 380;
/** A line may not pass this close to a dot it doesn't end at. */
export const DOT_CLEAR = 9;

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/** Shortest distance from p to the segment a-b. */
export function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Do segments p1-p2 and p3-p4 cross or touch? Segments that share an end
 * point are fine (that's two lines meeting at a dot); anything else that meets
 * counts, including touching end to side and overlapping.
 */
export function segmentsMeet(p1, p2, p3, p4) {
  if (p1 === p3 || p1 === p4 || p2 === p3 || p2 === p4) return false;
  const d1 = cross(p3, p4, p1), d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3), d4 = cross(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  const on = (a, b, c) => Math.min(a.x, b.x) - 1e-9 <= c.x && c.x <= Math.max(a.x, b.x) + 1e-9
    && Math.min(a.y, b.y) - 1e-9 <= c.y && c.y <= Math.max(a.y, b.y) + 1e-9;
  if (d1 === 0 && on(p3, p4, p1)) return true;
  if (d2 === 0 && on(p3, p4, p2)) return true;
  if (d3 === 0 && on(p1, p2, p3)) return true;
  if (d4 === 0 && on(p1, p2, p4)) return true;
  return false;
}

/** Is p strictly inside triangle a-b-c (either winding)? */
export function inTriangle(p, a, b, c) {
  const d1 = cross(a, b, p), d2 = cross(b, c, p), d3 = cross(c, a, p);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos) && d1 !== 0 && d2 !== 0 && d3 !== 0;
}

/** Inside a-b-c or on its edge: a treat on a line still belongs to the triangle that closes first. */
export function inOrOnTriangle(p, a, b, c) {
  const e = 1e-6;
  const d1 = cross(a, b, p), d2 = cross(b, c, p), d3 = cross(c, a, p);
  return !((d1 < -e || d2 < -e || d3 < -e) && (d1 > e || d2 > e || d3 > e));
}

export const centroid = (a, b, c) => ({ x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 });
export const area = (a, b, c) => Math.abs(cross(a, b, c)) / 2;

/** A small seeded random generator, so a level is the same board every time. */
export function rng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (n) => Math.floor(next() * n);
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.range = (a, b) => a + next() * (b - a);
  return next;
}
