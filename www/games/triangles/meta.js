/**
 * Everything around the matches that keeps players coming back: characters
 * to unlock and their small powers, stars, achievements, the Daily Yard and
 * the Shop's yard themes. Data and rules only; index.js draws it.
 */

import { levelSpec, rivalSkill, zoneOf, CATS, DOGS } from './levels.js';
import { skilled } from './ai.js';
import { rng } from './geom.js';

/* ---------------- characters ---------------- */

/**
 * Each character joins when a zone is beaten, and brings one small power.
 * The pairs (Patch and Rex, Mittens and Bruno…) match across the two teams,
 * so neither team is better.
 */
export const POWERS = {
  helper: 'Shows you a ready triangle in every zone, not just the first two.',
  undo: 'One extra free undo every match.',
  treats: 'Each treat triangle you claim pays 10 coins.',
  hint: 'One free hint every match.',
  coins: '15 extra coins every win.',
};
export const CHARACTERS = {
  patch: { unlock: 1, power: 'helper' }, rex: { unlock: 1, power: 'helper' },
  mittens: { unlock: 11, power: 'undo' }, bruno: { unlock: 11, power: 'undo' },
  marmalade: { unlock: 21, power: 'treats' }, daisy: { unlock: 21, power: 'treats' },
  pepper: { unlock: 31, power: 'hint' }, pip: { unlock: 31, power: 'hint' },
  biscuit: { unlock: 41, power: 'coins' }, dotty: { unlock: 41, power: 'coins' },
};
export const isUnlocked = (id, level) => level >= (CHARACTERS[id]?.unlock ?? 1);
export const powerOf = (id) => CHARACTERS[id]?.power || null;
/** Who joins when the player reaches `level` (both teams). */
export const joiningAt = (level) => [...CATS, ...DOGS].filter((id) => CHARACTERS[id].unlock === level);
export const unlockLine = (id) => {
  const lv = CHARACTERS[id].unlock;
  return `Beat level ${lv - 1} (${zoneOf(lv - 1).name} boss) to unlock`;
};

/* ---------------- stars ---------------- */

/**
 * Stars for a won match: one for the win, one for winning by 3 or more, one
 * for never leaving the rival a triangle to close. A solved puzzle earns 3,
 * or 2 if a hint helped.
 */
export function starsFor({ puzzle, margin, gifted, hints }) {
  if (puzzle) return hints ? 2 : 3;
  return 1 + (margin >= 3 ? 1 : 0) + (gifted ? 0 : 1);
}
export const starLines = ['Win the match', 'Win by 3 or more', 'Never leave a triangle open for your rival'];
export const totalStars = (stars) => Object.values(stars || {}).reduce((a, b) => a + b, 0);
export const zoneStars = (stars, zone) => {
  let n = 0;
  for (let lv = zone.first; lv <= zone.last; lv++) n += (stars || {})[lv] || 0;
  return n;
};

/* ---------------- the Daily Yard ---------------- */

export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const dayBefore = (key) => { const [y, m, d] = key.split('-').map(Number); return today(new Date(y, m - 1, d - 1)); };

/**
 * Today's special yard: the same board for everyone, a little bigger than
 * the player's current levels, with one or two twists they have already met
 * and a rival from the other team as good as their current level's.
 */
export function dailySpec(dateKey, level, team) {
  const r = rng(hash(dateKey));
  const base = levelSpec(Math.max(6, level), team);
  const met = ['treats', 'puddles', 'fences', 'fireflies'].slice(0, Math.min(4, Math.floor((level - 1) / 10)));
  const twists = { treats: 0, puddles: 0, fences: 0, fireflies: 0 };
  for (const t of met) if (r() < 0.5) twists[t] = t === 'fences' ? 3 : 2;
  const rivals = team === 'cat' ? DOGS : CATS;
  const skill = Math.max(0.12, rivalSkill(Math.max(6, level)) - 0.05);
  return {
    ...base,
    kind: 'daily', dateKey,
    rival: rivals[r.int(rivals.length)],
    style: skilled(skill), skill, band: 0,
    dots: Math.min(24, base.dots + 2),
    twists, first: 0,
    seed: hash(dateKey) % 1000003,
  };
}
export const dailyReward = (streak) => 60 + 10 * Math.min(7, Math.max(0, streak - 1));
/** The streak after winning today's yard. */
export function nextStreak(daily = {}, key = today()) {
  if (daily.last === key) return daily.streak || 1;
  return daily.last === dayBefore(key) ? (daily.streak || 0) + 1 : 1;
}

/* ---------------- achievements ---------------- */

/**
 * `done(ctx)` answers from the game's stats and save: ctx = { stats, save, stars }.
 * Rewards are paid once, the moment it's earned.
 */
export const ACHIEVEMENTS = [
  { id: 'first-win', name: 'First paw print', text: 'Win your first match', reward: 30, done: (c) => (c.stats.wins || 0) >= 1 },
  { id: 'double-3', name: 'Double trouble', text: 'Close two triangles with one line, 3 times', reward: 50, done: (c) => (c.stats.doubles || 0) >= 3, goal: (c) => [c.stats.doubles || 0, 3] },
  { id: 'flawless-3', name: 'Not a crumb', text: 'Win 3 matches without your rival scoring', reward: 80, done: (c) => (c.stats.flawless || 0) >= 3, goal: (c) => [c.stats.flawless || 0, 3] },
  { id: 'boss-1', name: 'Top of the yard', text: 'Beat a boss', reward: 50, done: (c) => (c.stats.bosses || 0) >= 1 },
  { id: 'boss-5', name: 'Neighbourhood champion', text: 'Beat all five zone bosses', reward: 300, done: (c) => (c.save.bossWins || []).filter((l) => l <= 50).length >= 5, goal: (c) => [(c.save.bossWins || []).filter((l) => l <= 50).length, 5] },
  { id: 'puzzle-3', name: 'Clever paws', text: 'Solve 3 puzzle levels', reward: 60, done: (c) => (c.stats.puzzles || 0) >= 3, goal: (c) => [c.stats.puzzles || 0, 3] },
  { id: 'treats-10', name: 'Snack attack', text: 'Claim 10 treat triangles', reward: 60, done: (c) => (c.stats.treats || 0) >= 10, goal: (c) => [c.stats.treats || 0, 10] },
  { id: 'stars-30', name: 'Star gazer', text: 'Collect 30 stars', reward: 80, done: (c) => c.stars >= 30, goal: (c) => [c.stars, 30] },
  { id: 'zone-30', name: 'Perfect street', text: 'Get 3 stars on every level of a zone', reward: 150, done: (c) => [0, 1, 2, 3, 4].some((z) => zoneStars(c.save.stars, { first: z * 10 + 1, last: z * 10 + 10 }) >= 30) },
  { id: 'both-teams', name: 'Both sides of the fence', text: 'Win as Team Cat and as Team Dog', reward: 60, done: (c) => (c.save.teamWins?.cat || 0) > 0 && (c.save.teamWins?.dog || 0) > 0 },
  { id: 'daily-7', name: 'Every day in the yard', text: 'Win the Daily Yard 7 days in a row', reward: 200, done: (c) => (c.save.daily?.best || 0) >= 7, goal: (c) => [Math.min(7, c.save.daily?.streak || 0), 7] },
  { id: 'no-hint-boss', name: 'No help needed', text: 'Beat a boss without a hint or an undo', reward: 80, done: (c) => !!c.save.cleanBoss },
  { id: 'duo-1', name: 'Pass the phone', text: 'Finish a 2-player match', reward: 30, done: (c) => (c.stats.duo || 0) >= 1 },
  { id: 'tri-500', name: 'Triangle tycoon', text: 'Claim 500 triangles', reward: 150, done: (c) => (c.stats.triangles || 0) >= 500, goal: (c) => [c.stats.triangles || 0, 500] },
];

/* ---------------- the Shop: yard themes ---------------- */

export const THEMES = [
  { id: 'lawn', name: 'Neighbourhood lawn', price: 0, note: 'Each zone’s own ground.', preview: 'img/theme-lawn.png' },
  { id: 'picnic', name: 'Picnic blanket', price: 300, note: 'Red gingham, cherry dots.', preview: 'img/theme-picnic.png' },
  { id: 'beach', name: 'Sandy beach', price: 500, note: 'Warm sand, sea-glass dots.', preview: 'img/theme-beach.png' },
  { id: 'snow', name: 'Snow day', price: 800, note: 'Fresh snow, berry dots.', preview: 'img/theme-snow.png' },
  { id: 'starry', name: 'Starry sky', price: 1200, note: 'Midnight blue, golden stars.', preview: 'img/theme-starry.png' },
];
