/**
 * Triangles – Cats vs Dogs.
 *
 * Draw lines between dots; close an empty triangle to claim it; most
 * triangles wins. You play Team Cat or Team Dog against a rival from the
 * other team, through a neighbourhood of zones (levels.js). The rules live in
 * board.js, the rivals in ai.js; this file is the screens and the flow.
 *
 * Screens, all inside the root the shell hands us:
 *   pick   first launch: Team Cat or Team Dog
 *   map    the current zone, its ten levels, Play
 *   match  the yard: scores, the board, coach line, Hint / Meow / Rules
 * Cards (versus, twist intro, results, rules, characters) float over them.
 */

import { Board, FENCE } from './board.js';
import { choose, hint, bestGain } from './ai.js';
import { W, H, dist } from './geom.js';
import {
  levelSpec, buildLevel, zoneOf, TWISTS, CATS, DOGS, nameOf, face, pose,
} from './levels.js';
import { SOUNDS } from './sounds.js';
import { scenery, background } from './art.js';
import {
  CHARACTERS, POWERS, isUnlocked, powerOf, joiningAt, unlockLine, starsFor, starLines, totalStars, zoneStars,
  today, dailySpec, dailyReward, nextStreak, ACHIEVEMENTS, THEMES,
} from './meta.js';

const TEAM = {
  cat: { name: 'Team Cat', fill: '#f2a043', deep: '#b8661a', soft: '#fff3df', tint: '#f7c37b', voice: 'meow', emote: 'Meow' },
  dog: { name: 'Team Dog', fill: '#4a80c4', deep: '#2d5f9e', soft: '#e6f0fb', tint: '#8db6e6', voice: 'woof', emote: 'Woof' },
};
const otherTeam = (t) => (t === 'cat' ? 'dog' : 'cat');
const HINT_COST = 25;
const PAD = 14;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const PAW = '<g class="ic"><ellipse cx="0" cy="3" rx="5.2" ry="4.4"/><circle cx="-5.6" cy="-3" r="2.2"/><circle cx="-2" cy="-6.2" r="2.2"/><circle cx="2" cy="-6.2" r="2.2"/><circle cx="5.6" cy="-3" r="2.2"/></g>';
const BONE = '<g class="ic" transform="rotate(-30)"><rect x="-6" y="-2" width="12" height="4" rx="2"/><circle cx="-6.5" cy="-2.4" r="2.6"/><circle cx="-6.5" cy="2.4" r="2.6"/><circle cx="6.5" cy="-2.4" r="2.6"/><circle cx="6.5" cy="2.4" r="2.6"/></g>';
const ICON = { cat: PAW, dog: BONE };
const svgIcon = (team, size, color = 'currentColor') => `<svg width="${size}" height="${size}" viewBox="-10 -10 20 20" fill="${color}" aria-hidden="true">${ICON[team]}</svg>`;
const I = {
  hint: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
  talk: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/><path d="M9 13.5c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5"/></svg>',
  rules: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><path d="M12 17h.01"/></svg>',
  play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
  ad: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10.5 9.5v5l4-2.5z" fill="currentColor"/></svg>',
  retry: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
  map: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
  duo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M15.6 14.2c2.4-.3 4.4 1.2 4.9 4.3"/></svg>',
  lock: '<svg width="14" height="16" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><rect x="1" y="6" width="10" height="8" rx="2"/><path d="M3 6V4a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  logo: '<svg width="40" height="36" viewBox="0 0 44 40" aria-hidden="true"><polygon points="4,36 40,36 22,4" fill="#f2a043"/><polygon points="22,4 40,36 31,20" fill="#4a80c4"/><polygon points="4,36 40,36 22,4" fill="none" stroke="#3b2a1e" stroke-width="4" stroke-linejoin="round"/><circle cx="4" cy="36" r="4" fill="#3b2a1e"/><circle cx="40" cy="36" r="4" fill="#3b2a1e"/><circle cx="22" cy="4" r="4" fill="#3b2a1e"/></svg>',
  puzzle: '<svg width="22" height="20" viewBox="0 0 22 20" aria-hidden="true"><polygon points="2,18 20,18 11,2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><text x="11" y="16" text-anchor="middle" font-weight="900" font-size="10" fill="currentColor">?</text></svg>',
  undo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  trophy: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
  daily: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/><path d="m12 12.3 1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" fill="currentColor" stroke="none"/></svg>',
  star: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2-4.6-4.4 6.3-.9z" fill="currentColor" stroke="#3b2a1e" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  treat: '<svg width="16" height="16" viewBox="-10 -10 20 20" aria-hidden="true"><circle r="8" fill="#f4c35a" stroke="#3b2a1e" stroke-width="2"/><circle cx="-3" cy="-2" r="1.5" fill="#8a5a1a"/><circle cx="3" cy="-3" r="1.3" fill="#8a5a1a"/><circle cx="1" cy="3.5" r="1.5" fill="#8a5a1a"/></svg>',
};

export default {
  id: 'triangles',
  name: 'Triangles – Cats vs Dogs',
  saveVersion: 1,
  styles: ['style.css'],
  sounds: SOUNDS,
  analytics: { batch: ['win'] },
  quest: { unlockLevel: 8, steps: 7 },

  // The Shop: yard themes, bought with coins and worn with setCosmetic().
  cosmetics: THEMES,
  defaultCosmetic: 'lawn',

  perks: {
    patch: { text: 'Hints cost 15 coins instead of 25.', config: { hintCost: 15 } },
    mittens: { text: 'You always draw the first line.', config: { firstMove: true } },
    marmalade: { text: 'Every win pays 10 extra coins.', config: { winBonus: 10 } },
    pepper: { text: 'Each treat triangle you claim pays 5 coins.', config: { treatCoins: 5 } },
    biscuit: { text: 'One free hint every match.', config: { freeHint: true } },
  },

  tasks: [
    { id: 'tri-12', tier: 'easy', text: 'Claim 12 triangles', stat: 'triangles', target: 12 },
    { id: 'play-3', tier: 'easy', text: 'Finish 3 matches', stat: 'matches', target: 3 },
    { id: 'win-3', tier: 'medium', text: 'Win 3 matches', stat: 'wins', target: 3 },
    { id: 'tri-40', tier: 'medium', text: 'Claim 40 triangles', stat: 'triangles', target: 40 },
    { id: 'treat-3', tier: 'medium', text: 'Claim 3 treat triangles', stat: 'treats', target: 3, from: 11 },
    { id: 'win-5', tier: 'hard', text: 'Win 5 matches', stat: 'wins', target: 5 },
    { id: 'double-1', tier: 'hard', text: 'Close two triangles with one line', stat: 'doubles', target: 1, from: 3 },
    { id: 'flawless-1', tier: 'hard', text: 'Win without your rival scoring', stat: 'flawless', target: 1, from: 2 },
    { id: 'puzzle-1', tier: 'hard', text: 'Solve a puzzle level', stat: 'puzzles', target: 1, from: 5 },
  ],

  create(host, root) {
    root.classList.add('tg-root');
    root.innerHTML = '<div class="tg-view"></div><div class="tg-layer"></div>';
    const viewEl = root.querySelector('.tg-view');
    const layer = root.querySelector('.tg-layer');
    const img = (path) => host.asset(path);

    /* ---------------- state ---------------- */

    const save = {
      team: null, chars: { cat: 'patch', dog: 'rex' }, level: 1, best: 0, seen: {}, match: null, wins: 0, played: 0,
      stars: {}, ach: {}, daily: {}, teamWins: {}, bossWins: [], cleanBoss: false,
    };
    let theme = 'lawn';
    let perk = {};
    let view = '';
    let visible = false;
    let paused = false;
    let M = null;               // the match being played
    const waiters = [];

    function wait(ms) {
      return new Promise((resolve) => {
        const job = { left: ms, resolve, at: performance.now(), timer: null };
        const arm = () => { job.at = performance.now(); job.timer = setTimeout(() => { waiters.splice(waiters.indexOf(job), 1); resolve(); }, job.left); };
        job.arm = arm;
        waiters.push(job);
        if (!paused) arm();
      });
    }
    function holdTimers() { for (const j of waiters) { if (j.timer) { clearTimeout(j.timer); j.timer = null; j.left = Math.max(0, j.left - (performance.now() - j.at)); } } }
    function releaseTimers() { for (const j of waiters) if (!j.timer) j.arm(); }

    const team = () => save.team || 'cat';
    /** The game's own analytics events, each tagged with the player's team and character. */
    const track = (name, params = {}) => host.track(name, { ...params, team: team(), character: me() });

    /**
     * Lend the shell art for the player's team: the lobby picture always, and
     * on Team Dog the dogs' faces and poses too (the shell's own are cats).
     * An older shell without host.mascot simply keeps its cats.
     */
    function applyMascot() {
      if (!host.mascot) return;
      if (!save.team || team() === 'cat') { host.mascot({ hero: 'img/hero-cat.png' }); return; }
      const d = me();
      host.mascot({
        hero: 'img/hero-dog.png',
        face: face(d, 'happy'), peek: face(d, 'happy'), cheer: pose(d, 'cheer'), slump: face(d, 'sad'),
        crowd: DOGS.map((id) => face(id, 'happy')),
      });
    }
    // Losses in a row on the level being played; the rival eases off a little for each.
    const lossesAt = (level) => (save.streak && save.streak.level === level ? save.streak.n : 0);
    const me = () => save.chars[team()];

    /* ---------------- cards ---------------- */

    function card(html, cls = '') {
      const el = document.createElement('div');
      el.className = `tg-card-wrap ${cls}`;
      el.innerHTML = `<div class="tg-card">${html}</div>`;
      layer.appendChild(el);
      requestAnimationFrame(() => el.classList.add('in'));
      return el;
    }
    function closeCard(el) {
      if (!el) return;
      el.classList.remove('in');
      setTimeout(() => el.remove(), 200);
    }
    /** Show a card and resolve with the data-act of the button pressed. */
    function ask(html, cls = '') {
      return new Promise((resolve) => {
        const el = card(html, cls);
        el.addEventListener('click', (e) => {
          const b = e.target.closest('[data-act]');
          if (!b || b.disabled) return;
          closeCard(el);
          resolve(b.dataset.act);
        });
        el._resolve = resolve;
      });
    }
    const topCard = () => [...layer.children].reverse().find((c) => c.classList.contains('in'));

    function toast(html, ms = 1800) {
      const yard = root.querySelector('.tg-yard');
      if (!yard) return;
      const t = document.createElement('div');
      t.className = 'tg-toast';
      t.innerHTML = html;
      yard.appendChild(t);
      requestAnimationFrame(() => t.classList.add('in'));
      setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, ms);
    }

    /* ---------------- views ---------------- */

    function setView(name, html, zoneId = zoneOf(save.level).id) {
      view = name;
      const bg = name === 'pick' ? null : background(zoneId);
      viewEl.className = `tg-view tg-${name} team-${team()} zone-${zoneId}${bg ? ' has-bg' : ''}`;
      viewEl.style.backgroundImage = bg ? `url("${img(bg)}")` : '';
      viewEl.innerHTML = html;
    }

    function report() {
      if (view === 'match' && M) {
        if (M.mode === 'duo') { host.progress({ title: '2 players', fraction: null, figure: '', summary: `Level ${save.level}` }); return; }
        const s = M.spec;
        if (M.daily) { host.progress({ title: 'Daily Yard', fraction: null, figure: s.dateKey, level: save.level, summary: `Level ${save.level} · ${zoneOf(save.level).name}` }); return; }
        const label = (M.replay ? 'Replay · ' : '') + (s.kind === 'boss' ? 'Boss match' : s.kind === 'puzzle' ? M.goal.title : s.kind === 'tutorial' ? 'Your first match' : s.zone.name);
        host.progress({ title: `Level ${s.level}`, fraction: null, figure: label, level: M.replay ? save.level : s.level, summary: `Level ${save.level} · ${zoneOf(save.level).name}` });
        return;
      }
      const z = zoneOf(save.level);
      host.progress({
        title: z.name,
        fraction: (save.level - z.first) / 10,
        figure: `Level ${save.level}`,
        level: save.level,
        summary: save.team ? `Level ${save.level} · ${z.name}` : '',
      });
    }

    /* ----- first launch: pick a team ----- */

    function showPick() {
      const row = (ids) => ids.map((id) => `<span class="tg-chip"><img src="${img(face(id))}" alt="${nameOf(id)}"></span>`).join('');
      setView('pick', `
        <div class="tg-logo">${I.logo}<span>Triangles</span></div>
        <div class="tg-vs-line"><b class="c">Cats</b><i>vs</i><b class="d">Dogs</b></div>
        <h2 class="tg-pick-q">Which team are you on?</h2>
        <button class="tg-team cat" data-team="cat">
          <img class="tg-team-hero" src="${img(face('patch'))}" alt="">
          <span class="tg-team-name">Team Cat</span>
          <span class="tg-team-line">Paws, purrs and orange triangles.</span>
          <span class="tg-team-row">${row(CATS)}</span>
        </button>
        <button class="tg-team dog" data-team="dog">
          <img class="tg-team-hero" src="${img(face('rex'))}" alt="">
          <span class="tg-team-name">Team Dog</span>
          <span class="tg-team-line">Waggy tails, bones and blue triangles.</span>
          <span class="tg-team-row">${row(DOGS)}</span>
        </button>
        <p class="tg-fine">You can switch teams any time from the map.</p>`);
      viewEl.querySelectorAll('[data-team]').forEach((b) => b.addEventListener('click', () => {
        save.team = b.dataset.team;
        host.sound(TEAM[save.team].voice);
        track('team_picked');
        applyMascot();
        host.save();
        startLevel(save.level);
      }));
      report();
    }

    /* ----- the map ----- */

    const XS = [50, 28, 52, 76, 60, 34, 24, 48, 74, 54];
    const STEP = 86;

    function showMap() {
      if (!save.team) return showPick();
      const z = zoneOf(save.level);
      const t = team();
      const rivalId = z.rival[t];
      const tw = z.twist ? TWISTS[z.twist] : null;
      const nextZ = zoneOf(z.last + 1);
      const height = 10 * STEP + 40;
      const pts = Array.from({ length: 10 }, (_, k) => ({ x: XS[k], y: height - 50 - k * STEP }));
      const pathD = pts.map((p, k) => {
        if (!k) return `M${p.x} ${p.y}`;
        const a = pts[k - 1];
        return `C${a.x} ${a.y - STEP / 2} ${p.x} ${p.y + STEP / 2} ${p.x} ${p.y}`;
      }).join(' ');
      const nodes = pts.map((p, k) => {
        const lv = z.first + k;
        const spec = levelSpec(lv, t);
        const state = lv < save.level ? 'done' : lv === save.level ? 'now' : 'locked';
        const kind = spec.kind === 'puzzle' ? 'puzzle' : spec.kind === 'boss' ? 'boss' : 'plain';
        let inner = `<span class="n">${lv}</span>`;
        if (kind === 'puzzle') inner = `${I.puzzle}<span class="n">${lv}</span>`;
        if (kind === 'boss') inner = `<img src="${img(face(spec.rival, state === 'done' ? 'sad' : 'happy'))}" alt=""><span class="n">${lv}</span>`;
        if (state === 'done' && kind === 'plain') inner = svgIcon(t, 24, '#fff');
        const got = save.stars[lv] || 0;
        const label = `Level ${lv}${kind === 'boss' ? ', boss' : kind === 'puzzle' ? ', puzzle' : ''}${state === 'done' ? `, ${got} of 3 stars, tap to replay` : state === 'locked' ? ', locked' : ''}`;
        const stars = state === 'done' ? `<span class="tg-node-stars" aria-hidden="true">${[0, 1, 2].map((k) => `<i class="${k < got ? 'on' : ''}">${I.star}</i>`).join('')}</span>` : '';
        return `<button class="tg-node ${state} ${kind}" style="left:${p.x}%;top:${p.y}px" data-level="${lv}" aria-label="${label}" ${state === 'locked' ? 'tabindex="-1"' : ''}>${inner}${stars}</button>`
          + (state === 'now' ? `<span class="tg-here" style="left:${p.x}%;top:${p.y - 66}px"><img src="${img(face(me()))}" alt="You are here"></span>` : '');
      }).join('');

      setView('map', `
        <div class="tg-map-top">
          <button class="tg-me" data-act="chars" aria-label="Choose your character">
            <img src="${img(face(me()))}" alt=""><span>${nameOf(me())}</span><i style="background:${TEAM[t].fill}">${svgIcon(t, 12, '#fff')}</i>
          </button>
          <span class="tg-top-btns">
            <button class="tg-icon-btn" data-act="daily" aria-label="Daily Yard">${I.daily}${save.daily.last !== today() ? '<i class="tg-dot"></i>' : ''}</button>
            <button class="tg-icon-btn" data-act="trophies" aria-label="Achievements">${I.trophy}</button>
            <button class="tg-icon-btn" data-act="duo" aria-label="2 players, one phone">${I.duo}</button>
          </span>
        </div>
        <div class="tg-zone ${z.id}">
          <div class="tg-zone-text">
            <div class="k">Zone ${z.index + 1} · levels ${z.first}–${z.last}</div>
            <div class="t">${esc(z.name)}</div>
            ${tw ? `<div class="tg-pill">${z.twist === 'treats' ? I.treat : ''}${esc(tw.name)}</div>` : '<div class="tg-pill">Learn the yard</div>'}
          </div>
          <div class="tg-boss"><span><img src="${img(face(rivalId))}" alt="${nameOf(rivalId)}"></span><small>Boss · Lv ${z.last}</small></div>
          <div class="tg-zone-stars" aria-label="${zoneStars(save.stars, z)} of 30 stars in this zone">${I.star}<b>${zoneStars(save.stars, z)}</b>/30</div>
        </div>
        <div class="tg-trail">
          <div class="tg-next-zone">
            ${I.lock}<img src="${img(face(nextZ.rival[t]))}" alt="">
            <span><b>Next: ${esc(nextZ.name)}</b>${nextZ.twist && nextZ.round === 0 ? ` · ${esc(TWISTS[nextZ.twist].name)}` : ''} · ${esc(nameOf(nextZ.rival[t]))} awaits at level ${nextZ.first}</span>
          </div>
          <div class="tg-path ${z.id}" style="height:${height}px">
            ${scenery(z.id, height, z.index + 1)}
            <svg class="tg-path-line" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">
              <path d="${pathD}" vector-effect="non-scaling-stroke" class="road"/>
              <path d="${pathD}" vector-effect="non-scaling-stroke" class="dash"/>
            </svg>
            ${nodes}
          </div>
        </div>
        <div class="tg-map-foot">
          <button class="tg-btn go" data-act="play">${I.play}<span>Play level ${save.level}</span>
            <em><img src="${img(face(levelSpec(save.level, t).rival))}" alt="">${esc(nameOf(levelSpec(save.level, t).rival))}</em></button>
        </div>`);

      viewEl.querySelector('[data-act="play"]').addEventListener('click', () => startLevel(save.level));
      viewEl.querySelector('.tg-node.now')?.addEventListener('click', () => startLevel(save.level));
      viewEl.querySelector('[data-act="chars"]').addEventListener('click', chooseCharacter);
      viewEl.querySelector('[data-act="duo"]').addEventListener('click', startDuo);
      viewEl.querySelector('[data-act="daily"]').addEventListener('click', startDaily);
      viewEl.querySelector('[data-act="trophies"]').addEventListener('click', showAchievements);
      viewEl.querySelectorAll('.tg-node.done').forEach((b) => b.addEventListener('click', () => replayLevel(Number(b.dataset.level))));
      viewEl.querySelectorAll('.tg-node.locked').forEach((b) => b.addEventListener('click', () => {
        host.sound('error');
        b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
      }));
      report();
      requestAnimationFrame(() => {
        const trail = viewEl.querySelector('.tg-trail');
        const here = viewEl.querySelector('.tg-node.now');
        if (trail && here) trail.scrollTop = here.offsetTop - trail.clientHeight * 0.6;
      });
    }

    async function chooseCharacter() {
      let t = team();
      const before = { team: t, char: save.chars[t] };
      const draw = () => {
        const ids = t === 'cat' ? CATS : DOGS;
        return `
          <h2 class="tg-card-title">Play as</h2>
          <div class="tg-seg" role="group" aria-label="Team">
            <button data-t="cat" aria-pressed="${t === 'cat'}" class="${t === 'cat' ? 'on cat' : ''}">Team Cat</button>
            <button data-t="dog" aria-pressed="${t === 'dog'}" class="${t === 'dog' ? 'on dog' : ''}">Team Dog</button>
          </div>
          <div class="tg-chars">${ids.map((id) => {
            const open = isUnlocked(id, save.level);
            return `<button class="tg-char ${save.chars[t] === id ? 'on' : ''} ${t} ${open ? '' : 'locked'}" data-c="${id}" aria-pressed="${save.chars[t] === id}" aria-label="${nameOf(id)}${open ? '' : ', locked'}"><img src="${img(face(id))}" alt=""><span>${nameOf(id)}</span>${open ? '' : `<i class="tg-lock">${I.lock}</i>`}</button>`;
          }).join('')}</div>
          <div class="tg-power"><b>${nameOf(save.chars[t])}:</b> ${esc(POWERS[powerOf(save.chars[t])])}</div>
          <p class="tg-card-line small">New friends join each time you beat a zone boss. Your rivals are always from the other team.</p>
          <button class="tg-btn go" data-act="done">Done</button>`;
      };
      const el = card(draw(), 'sheet');
      const inner = el.querySelector('.tg-card');
      await new Promise((resolve) => {
        el.addEventListener('click', (e) => {
          const tb = e.target.closest('[data-t]');
          const cb = e.target.closest('[data-c]');
          if (tb) { t = tb.dataset.t; inner.innerHTML = draw(); return; }
          if (cb) {
            const id = cb.dataset.c;
            if (!isUnlocked(id, save.level)) {
              host.sound('error');
              const pw = inner.querySelector('.tg-power');
              if (pw) pw.innerHTML = `<b>${nameOf(id)}:</b> ${esc(unlockLine(id))}. Then: ${esc(POWERS[powerOf(id)])}`;
              return;
            }
            save.chars[t] = id; save.team = t; host.sound(TEAM[t].voice === 'meow' ? 'meow-small' : 'woof-small'); inner.innerHTML = draw(); return;
          }
          if (e.target.closest('[data-act="done"]')) { closeCard(el); resolve(); }
        });
        el._resolve = resolve;
      });
      if (t !== before.team || save.chars[t] !== before.char) {
        if (t !== before.team) track('team_changed', { from: before.team });
        else track('character_changed', { from: before.char });
      }
      save.team = t;
      applyMascot();
      host.save();
      if (view === 'map') showMap();
    }

    /* ---------------- starting a match ---------------- */

    async function startLevel(level, { quick = false } = {}) {
      const spec = levelSpec(level, team(), { losses: lossesAt(level) });
      // A zone's twist, explained the first time it turns up.
      const tw = spec.zone.twist;
      if (!quick && tw && !save.seen[tw] && spec.zone.round === 0) {
        await ask(twistCard(tw, spec));
        save.seen[tw] = 1;
      }
      if (!quick && spec.kind === 'puzzle' && !save.seen.puzzle) {
        await ask(`
          <div class="tg-kicker purple">Puzzle level!</div>
          <div class="tg-puz-ic">${I.puzzle}</div>
          <h2 class="tg-card-title">Every fifth level is a puzzle</h2>
          <p class="tg-card-line">No rival race here: just one clever goal. Get it wrong and you can try again for free.</p>
          <button class="tg-btn go" data-act="ok">Let's see it</button>`);
        save.seen.puzzle = 1;
      }
      beginMatch(spec);
      if (!quick && spec.kind !== 'tutorial') introBanner(spec);
    }

    /** Replay a level already beaten, for its stars. Progress and quests don't move. */
    function replayLevel(level) {
      const spec = levelSpec(level, team());
      beginMatch(spec, { replay: true });
      introBanner(spec, `Replay · best ${save.stars[level] || 0} of 3 stars`);
    }

    /** Today's Daily Yard: the same board for everyone, once a day, with a streak. */
    async function startDaily() {
      const key = today();
      const streak = nextStreak(save.daily, key);
      if (save.daily.last === key) {
        await ask(`
          <div class="tg-kicker green">Daily Yard</div>
          <h2 class="tg-card-title">Done for today!</h2>
          <p class="tg-card-line">You won today's yard. A new one opens tomorrow.</p>
          <div class="tg-streak">${I.daily}<b>${save.daily.streak || 1}</b> day streak</div>
          <button class="tg-btn go" data-act="ok">OK</button>`);
        return;
      }
      const go = await ask(`
        <div class="tg-kicker green">Daily Yard · ${esc(key)}</div>
        <h2 class="tg-card-title">Today's yard</h2>
        <p class="tg-card-line">One special board a day, the same for everyone. Win it to keep your streak going.</p>
        <div class="tg-streak">${I.daily}${streak > 1 ? `<b>${streak - 1}</b>&nbsp;day streak · win today: <b>+${dailyReward(streak)}</b>` : `Win today to start a streak: <b>+${dailyReward(streak)}</b>`}&nbsp;coins</div>
        <button class="tg-btn go" data-act="go">Play today's yard</button>
        <button class="tg-link" data-act="back">Not now</button>`);
      if (go !== 'go') return;
      const spec = dailySpec(key, save.level, team());
      beginMatch(spec, { daily: true });
      introBanner(spec, 'Daily Yard');
    }

    /**
     * "Patch vs Rex" over the yard for a moment as the match opens. No tap
     * needed: it fades by itself, and the player can start drawing under it.
     */
    function introBanner(spec, label) {
      const t = team();
      const r = spec.rival;
      const sub = label || (spec.kind === 'boss' ? 'Boss match!' : spec.kind === 'puzzle' ? buildGoalText(spec).title : `${spec.zone.name} · Level ${spec.level}`);
      const el = document.createElement('div');
      el.className = 'tg-intro';
      el.setAttribute('aria-live', 'polite');
      el.innerHTML = `
        <div class="tg-intro-row">
          <span class="tg-intro-side ${t}"><img src="${img(face(me()))}" alt=""><b>${nameOf(me())}</b></span>
          <span class="tg-vs-badge">VS</span>
          <span class="tg-intro-side ${otherTeam(t)}"><img src="${img(face(r))}" alt=""><b>${nameOf(r)}</b></span>
        </div>
        <div class="tg-intro-sub ${spec.kind}">${esc(sub)}</div>`;
      root.appendChild(el);
      if (M) M.introUntil = performance.now() + 1500;
      setTimeout(() => el.classList.add('out'), 1250);
      setTimeout(() => el.remove(), 1700);
    }

    function buildGoalText(spec) {
      const g = { double: ['Score 2 with one line', 'Find the line that closes two triangles at once.'],
        safe: ['Three safe lines', `Draw 3 lines without giving ${nameOf(spec.rival)} a single triangle.`],
        comeback: ['Comeback!', `${nameOf(spec.rival)} is ahead. Turn it around and win the yard.`] }[spec.puzzle];
      return { title: g[0], line: g[1] };
    }

    function twistCard(tw, spec) {
      const art = {
        treats: '<polygon points="40,160 210,150 120,36" fill="#f2a043"/><g stroke="#6b5444" stroke-width="5" stroke-linecap="round"><line x1="40" y1="160" x2="210" y2="150"/><line x1="210" y1="150" x2="120" y2="36"/><line x1="120" y1="36" x2="40" y2="160"/></g><g transform="translate(124 112)"><circle r="16" fill="#f4c35a" stroke="#3b2a1e" stroke-width="3.5"/><circle cx="-6" cy="-4" r="2.6" fill="#8a5a1a"/><circle cx="5" cy="-6" r="2.2" fill="#8a5a1a"/><circle cx="2" cy="6" r="2.6" fill="#8a5a1a"/></g><g fill="#3b2a1e"><circle cx="40" cy="160" r="8"/><circle cx="210" cy="150" r="8"/><circle cx="120" cy="36" r="8"/></g><text x="196" y="80" font-weight="900" font-size="26" fill="#b8661a">+3</text>',
        puddles: '<ellipse cx="126" cy="100" rx="44" ry="30" fill="#9cc3e6" stroke="#5f8fc7" stroke-width="3"/><line x1="30" y1="100" x2="222" y2="100" stroke="#c4472f" stroke-width="5" stroke-dasharray="10 9" stroke-linecap="round"/><g fill="#3b2a1e"><circle cx="30" cy="100" r="8"/><circle cx="222" cy="100" r="8"/><circle cx="126" cy="30" r="8"/><circle cx="126" cy="170" r="8"/></g><g stroke="#6b5444" stroke-width="5" stroke-linecap="round"><line x1="30" y1="100" x2="126" y2="30"/><line x1="126" y1="30" x2="222" y2="100"/></g>',
        fences: '<g stroke="#a8916f" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 10"><line x1="40" y1="160" x2="210" y2="150"/><line x1="210" y1="150" x2="120" y2="36"/></g><g fill="#3b2a1e"><circle cx="40" cy="160" r="8"/><circle cx="210" cy="150" r="8"/><circle cx="120" cy="36" r="8"/></g><line x1="120" y1="36" x2="40" y2="160" stroke="#f2a043" stroke-width="5" stroke-linecap="round" stroke-dasharray="3 9"/>',
        fireflies: '<rect x="0" y="0" width="252" height="200" fill="#2d3550"/><g fill="#e8eef8"><circle cx="40" cy="150" r="8"/><circle cx="210" cy="140" r="8"/><circle cx="120" cy="40" r="8"/></g><g fill="#ffe680"><circle cx="128" cy="112" r="8"/><circle cx="128" cy="112" r="16" opacity=".25"/><circle cx="70" cy="70" r="6"/><circle cx="70" cy="70" r="13" opacity=".25"/><circle cx="190" cy="70" r="6"/><circle cx="190" cy="70" r="13" opacity=".25"/></g>',
      }[tw];
      return `
        <div class="tg-kicker green">New in ${esc(spec.zone.name)}</div>
        <h2 class="tg-card-title">${esc(TWISTS[tw].name)}</h2>
        <svg class="tg-twist-art" viewBox="0 0 252 200" role="img" aria-label="${esc(TWISTS[tw].name)}">${art}</svg>
        <p class="tg-card-line big">${esc(TWISTS[tw].line)}</p>
        <button class="tg-btn go" data-act="ok">Got it!</button>`;
    }

    /* ---------------- the match ---------------- */

    function beginMatch(spec, { duo = false, resume = null, replay = false, daily = false } = {}) {
      const t = team();
      const built = buildLevel(spec);
      const board = built.board;
      M = {
        spec, mode: duo ? 'duo' : spec.kind === 'puzzle' ? 'puzzle' : 'level',
        board, goal: built.goal, preset: built.moves,
        teams: [t, otherTeam(t)],
        chars: [duo ? save.chars[t] : me(), duo ? save.chars[otherTeam(t)] : spec.rival],
        turn: 0, history: [], playerMoves: 0, freeHint: (perk.freeHint ? 1 : 0) + (powerOf(me()) === 'hint' ? 1 : 0), hints: 0,
        tut: spec.kind === 'tutorial' && !duo ? 1 : 0,
        over: false, startedAt: Date.now(), selected: null,
        replay, daily, gifted: false, undos: 0, freeUndos: 1 + (powerOf(me()) === 'undo' ? 1 : 0),
      };
      if (M.mode === 'duo' && M.chars[0] === M.chars[1]) M.chars[1] = (t === 'cat' ? DOGS : CATS)[0];
      for (const [i, j, p] of M.preset) board.play(i, j, p);
      M.turn = spec.kind === 'puzzle' ? 0 : (perk.firstMove && !duo ? 0 : spec.first);
      if (resume) {
        for (const h of resume.moves) {
          if (h[0] === 'nap') M.history.push({ nap: true, player: h[1] });
          else M.history.push({ rec: board.play(h[0], h[1], h[2]), player: h[2] });
        }
        M.turn = resume.turn;
        M.playerMoves = resume.playerMoves || 0;
        M.hints = resume.hints || 0;
        M.freeHint = Number(resume.freeHint ?? M.freeHint) || 0;
        M.tut = resume.tut || 0;
        M.gifted = !!resume.gifted;
        M.undos = resume.undos || 0;
      }
      renderMatch();
      if (!resume) track('match_start', { level: spec.level, kind: duo ? 'duo' : spec.kind, replay: replay ? 1 : 0 });
      persist();
      if (M.tut === 1) tutorialStep();
      next();
    }

    function persist() {
      if (!M || M.mode === 'duo' || M.over || M.replay || M.daily) { save.match = null; return; }
      save.match = {
        level: M.spec.level, team: M.teams[0], turn: M.turn, playerMoves: M.playerMoves, hints: M.hints, freeHint: M.freeHint, tut: M.tut,
        gifted: M.gifted, undos: M.undos,
        moves: M.history.map((h) => (h.nap ? ['nap', h.player] : [h.rec.i, h.rec.j, h.player])),
      };
    }

    function renderMatch() {
      const duo = M.mode === 'duo';
      const [ta, tb] = M.teams;
      const sideCard = (k) => {
        const tm = M.teams[k];
        const id = M.chars[k];
        const who = duo ? `Player ${k + 1}` : k === 0 ? 'You' : (M.spec.kind === 'tutorial' ? 'very sleepy' : M.spec.kind === 'boss' ? 'Boss' : TEAM[tm].name);
        return `<div class="tg-side s${k} ${tm}" data-side="${k}">
          <span class="tg-turn-tag">${k === 0 ? (duo ? 'Your turn' : 'Your turn') : duo ? 'Your turn' : `${nameOf(id)}'s turn`}</span>
          <span class="tg-face"><img src="${img(face(id, k === 1 && M.spec.kind === 'tutorial' ? 'sleep' : 'happy'))}" alt="${nameOf(id)}"></span>
          <span class="tg-who"><b>${k === 0 && !duo ? nameOf(id) : nameOf(id)}</b><small>${esc(who)}</small></span>
          <span class="tg-pts" data-pts="${k}">0</span>
          <span class="tg-bubble" data-bubble="${k}"></span>
        </div>`;
      };
      setView('match', `
        ${duo ? `<div class="tg-duo-top">${sideCard(1)}<button class="tg-act small" data-act="emote1">${I.talk}<span>${TEAM[tb].emote}</span></button></div>` : ''}
        <div class="tg-score ${duo ? 'duo' : ''}">
          ${sideCard(0)}
          <div class="tg-left" aria-live="polite"><svg width="22" height="20" viewBox="0 0 26 22" aria-hidden="true"><polygon points="3,19 23,19 13,3" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg><b data-left>0</b><small>left</small></div>
          ${duo ? '' : sideCard(1)}
        </div>
        ${M.goal ? `<div class="tg-goal">${I.puzzle}<div><b>${esc(buildGoalText(M.spec).title)}</b><small>${esc(buildGoalText(M.spec).line)}</small></div><span class="tg-goal-n"><b data-goal-n>${M.goal.moves || ''}</b><small>${M.goal.moves ? (M.goal.moves === 1 ? 'move' : 'moves') : ''}</small></span></div>` : ''}
        <div class="tg-yard-wrap"><div class="tg-yard ${M.spec.zone.id} ${M.board.dots.some((d) => d.wave) ? 'night' : ''} theme-${theme}">
          <svg class="tg-svg" viewBox="${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}" role="img" aria-label="The yard">
            <defs>
              <g id="tg-paw" fill="#fff" opacity=".92">${PAW}</g>
              <g id="tg-bone" fill="#fff" opacity=".92">${BONE}</g>
            </defs>
            <g class="L-puddles"></g><g class="L-tris"></g><g class="L-treats"></g><g class="L-lines"></g><g class="L-hint"></g><g class="L-ghost"></g><g class="L-dots"></g><g class="L-fx"></g>
          </svg>
        </div></div>
        <div class="tg-coach" aria-live="polite"><span class="tg-coach-face"><img src="${img(face(M.chars[0]))}" alt=""></span><p data-coach></p><button class="tg-rules-btn" data-act="rules" aria-label="How to play">${I.rules}</button></div>
        <div class="tg-actions">
          <button class="tg-act" data-act="hint">${I.hint}<span>Hint</span><em data-hint-cost></em></button>
          <button class="tg-act" data-act="undo">${I.undo}<span>Undo</span><em data-undo-cost></em></button>
          <button class="tg-act" data-act="emote0">${I.talk}<span>${TEAM[ta].emote}</span></button>
        </div>`, M.spec.zone.id);
      const svg = viewEl.querySelector('.tg-svg');
      M.svg = svg;
      M.L = Object.fromEntries(['puddles', 'tris', 'treats', 'lines', 'hint', 'ghost', 'dots', 'fx'].map((k) => [k, svg.querySelector(`.L-${k}`)]));
      drawBoard();
      bindInput(svg);
      viewEl.querySelector('[data-act="hint"]').addEventListener('click', useHint);
      viewEl.querySelector('[data-act="undo"]').addEventListener('click', undoLast);
      viewEl.querySelector('[data-act="emote0"]').addEventListener('click', () => emote(0));
      viewEl.querySelector('[data-act="emote1"]')?.addEventListener('click', () => emote(1));
      viewEl.querySelector('[data-act="rules"]').addEventListener('click', showRules);
      updateHud();
      relayout();
      report();
    }

    /* ----- drawing the yard ----- */

    const NS = 'http://www.w3.org/2000/svg';
    function el(tag, attrs, parent) {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      if (parent) parent.appendChild(e);
      return e;
    }

    function drawBoard() {
      const { board, L } = M;
      for (const g of Object.values(L)) g.innerHTML = '';
      for (const p of board.puddles) {
        el('ellipse', { cx: p.x, cy: p.y, rx: p.r + 3, ry: p.r * 0.86 + 3, class: 'puddle' }, L.puddles);
        el('ellipse', { cx: p.x - p.r * 0.3, cy: p.y - p.r * 0.3, rx: p.r * 0.35, ry: p.r * 0.14, class: 'puddle-shine' }, L.puddles);
      }
      for (const t of board.tris) drawTri(t, false);
      drawTreats();
      for (const [i, j, o] of board.lineList()) drawLine(i, j, o);
      drawDots();
    }

    function drawTreats() {
      M.L.treats.innerHTML = '';
      for (const t of M.board.treats) {
        if (t.taken !== -2) continue;
        const g = el('g', { transform: `translate(${t.x} ${t.y})`, class: 'treat' }, M.L.treats);
        g.innerHTML = '<circle r="11" class="treat-glow"/><circle r="8.5" fill="#f4c35a" stroke="#3b2a1e" stroke-width="2.4"/><circle cx="-3" cy="-2" r="1.6" fill="#8a5a1a"/><circle cx="3.2" cy="-3.4" r="1.4" fill="#8a5a1a"/><circle cx="1.2" cy="3.6" r="1.6" fill="#8a5a1a"/>';
      }
    }

    function drawLine(i, j, owner, animate = false) {
      const a = M.board.dots[i], b = M.board.dots[j];
      const line = el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: owner === FENCE ? 'ln fence' : 'ln' }, M.L.lines);
      if (animate) {
        const len = dist(a, b);
        line.style.strokeDasharray = `${len}`;
        line.style.strokeDashoffset = `${len}`;
        line.getBoundingClientRect();
        line.style.transition = 'stroke-dashoffset 260ms ease-out';
        line.style.strokeDashoffset = '0';
      }
      return line;
    }

    function drawTri(t, fresh) {
      const b = M.board;
      const A = b.dots[t.a], B = b.dots[t.b], C = b.dots[t.c];
      const tm = M.teams[t.owner];
      const c = b.center(t);
      const g = el('g', { class: `tri ${tm} ${fresh ? 'fresh' : ''}`, style: `transform-origin:${c.x}px ${c.y}px` }, M.L.tris);
      el('polygon', { points: `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`, fill: TEAM[tm].fill }, g);
      el('use', { href: tm === 'cat' ? '#tg-paw' : '#tg-bone', x: c.x, y: c.y }, g);
      if (t.points > 1) {
        const s = el('g', { transform: `translate(${c.x + 10} ${c.y - 10})` }, g);
        el('circle', { r: 7, fill: '#f4c35a', stroke: '#3b2a1e', 'stroke-width': 1.8 }, s);
      }
      if (fresh) {
        const f = el('text', { x: c.x, y: c.y - 6, class: `plus ${tm}`, 'text-anchor': 'middle' }, M.L.fx);
        f.textContent = `+${t.points}`;
        setTimeout(() => f.remove(), 1100);
      }
    }

    function drawDots() {
      const g = M.L.dots;
      g.innerHTML = '';
      for (const d of M.board.dots) {
        if (!d.on || d.gone) continue;
        const dot = el('g', { class: `dot ${d.wave ? 'firefly' : ''}`, 'data-i': d.i, transform: `translate(${d.x} ${d.y})` }, g);
        el('circle', { r: 16, class: 'dot-ring' }, dot);
        el('circle', { r: 7.5, class: 'dot-core' }, dot);
        el('circle', { cx: -2.2, cy: -2.2, r: 2.3, class: 'dot-shine' }, dot);
      }
    }

    function markDots(cls, ids) {
      for (const n of M.L.dots.querySelectorAll(`.${cls}`)) n.classList.remove(cls);
      for (const i of ids) M.L.dots.querySelector(`[data-i="${i}"]`)?.classList.add(cls);
    }

    function updateHud() {
      const { board } = M;
      for (const k of [0, 1]) {
        const n = viewEl.querySelector(`[data-pts="${k}"]`);
        if (n) n.textContent = board.scores[k];
      }
      const left = viewEl.querySelector('[data-left]');
      if (left) {
        const open = !board.puddles.length && !board.dots.some((d) => d.wave);
        left.parentElement.hidden = !open;
        if (open) left.textContent = String(remainingTris());
      }
      for (const s of viewEl.querySelectorAll('.tg-side')) s.classList.toggle('active', Number(s.dataset.side) === M.turn && !M.over);
      const cost = viewEl.querySelector('[data-hint-cost]');
      if (cost) cost.innerHTML = M.freeHint > 0 ? 'free' : `<img src="${img('img/coin.png')}" alt="">${hintCost()}`;
      const undoBtn = viewEl.querySelector('[data-act="undo"]');
      if (undoBtn) {
        undoBtn.disabled = !canUndo();
        undoBtn.hidden = M.mode !== 'level';
        const uc = viewEl.querySelector('[data-undo-cost]');
        if (uc) uc.innerHTML = undoFree() ? 'free' : `<img src="${img('img/coin.png')}" alt="">${UNDO_COST}`;
      }
      const hintBtn = viewEl.querySelector('[data-act="hint"]');
      if (hintBtn) hintBtn.disabled = M.over || M.turn !== 0 || M.mode === 'duo' || M.tut === 1 || M.tut === 2;
      const gn = viewEl.querySelector('[data-goal-n]');
      if (gn && M.goal?.moves) gn.textContent = String(Math.max(0, M.goal.moves - M.playerMoves));
    }

    function remainingTris() {
      // Triangles a full yard holds minus those claimed. Exact when nothing
      // blocks the yard; a fair estimate otherwise.
      const b = M.board;
      const n = b.visible.length + (b.pendingWave() ? b.dots.filter((d) => d.wave && !d.on && !d.gone).length : 0);
      const total = Math.max(b.tris.length, 2 * n - hullOf(b.visible) - 2 - b.puddles.length * 2);
      return Math.max(0, total - b.tris.length);
    }
    function hullOf(pts) {
      const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
      const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
      const half = (list) => { const h = []; for (const q of list) { while (h.length >= 2 && cr(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop(); h.push(q); } return h; };
      return p.length < 3 ? p.length : half(p).length + half(p.reverse()).length - 2;
    }

    function coach(text, who = 0) {
      const p = viewEl.querySelector('[data-coach]');
      if (!p) return;
      p.innerHTML = text;
      const f = viewEl.querySelector('.tg-coach-face img');
      if (f) f.src = img(face(M.chars[who]));
      viewEl.querySelector('.tg-coach')?.classList.toggle('rival', who === 1);
    }

    function bubble(k, text, ms = 1500) {
      const b = viewEl.querySelector(`[data-bubble="${k}"]`);
      if (!b) return;
      b.textContent = text;
      b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
      clearTimeout(b._t);
      b._t = setTimeout(() => b.classList.remove('in'), ms);
    }

    function setFace(k, mood) {
      const im = viewEl.querySelector(`.tg-side.s${k} .tg-face img`);
      if (im) im.src = img(face(M.chars[k], mood));
    }

    /* ----- input ----- */

    let drag = null;
    function toBoard(e) {
      const pt = M.svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(M.svg.getScreenCTM().inverse());
    }
    const hitRadius = () => { const r = M.svg.getBoundingClientRect(); return 30 * ((W + 2 * PAD) / Math.max(1, r.width)); };
    function nearest(p, r, filter = () => true) {
      let best = null, bd = r;
      for (const d of M.board.dots) {
        if (!d.on || d.gone || !filter(d)) continue;
        const dd = dist(d, p);
        if (dd < bd) { bd = dd; best = d; }
      }
      return best;
    }
    const myInput = () => M && !M.over && !paused && (M.mode === 'duo' || M.turn === 0) && !M.busy;

    function bindInput(svg) {
      svg.addEventListener('pointerdown', (e) => {
        if (!myInput()) return;
        const p = toBoard(e);
        const d = nearest(p, hitRadius());
        if (!d) { select(null); return; }
        e.preventDefault();
        drag = { from: d.i, snap: null, moved: false, p0: p };
        try { svg.setPointerCapture(e.pointerId); } catch { /* fine */ }
        host.sound('scratch');
        markDots('from', [d.i]);
        ghost(d, p, false);
      });
      svg.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const p = toBoard(e);
        if (dist(p, drag.p0) > 6) drag.moved = true;
        const from = M.board.dots[drag.from];
        const tgt = nearest(p, hitRadius(), (d) => d.i !== drag.from && M.board.isLegal(drag.from, d.i) && allowed(drag.from, d.i));
        if ((tgt?.i ?? null) !== drag.snap) {
          drag.snap = tgt?.i ?? null;
          if (tgt) { host.sound('snap'); host.haptic(5); }
          markDots('target', tgt ? [tgt.i] : []);
        }
        ghost(from, tgt || p, !!tgt);
      });
      const end = (e) => {
        if (!drag) return;
        const d = drag;
        drag = null;
        clearGhost();
        markDots('target', []);
        if (d.snap !== null) { select(null); attempt(d.from, d.snap); return; }
        if (!d.moved) {
          // tap, then tap: the second dot finishes the line
          if (M.selected !== null && M.selected !== d.from) { const a = M.selected; select(null); attempt(a, d.from); }
          else select(M.selected === d.from ? null : d.from);
          return;
        }
        markDots('from', M.selected !== null ? [M.selected] : []);
        // let go near a dot the line can't reach
        const p = e.type === 'pointerup' ? toBoard(e) : null;
        const near = p && nearest(p, hitRadius(), (x) => x.i !== d.from);
        if (near) attempt(d.from, near.i);
      };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);
    }

    function select(i) {
      if (M) M.selected = i;
      markDots('from', i === null || i === undefined ? [] : [i]);
      if (i !== null && i !== undefined) {
        const reach = M.board.legalMoves().filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a)).filter((j) => allowed(i, j));
        markDots('can', reach);
      } else markDots('can', []);
    }

    function ghost(a, b, snapped) {
      const g = M.L.ghost;
      let l = g.querySelector('line');
      if (!l) l = el('line', {}, g);
      l.setAttribute('x1', a.x); l.setAttribute('y1', a.y); l.setAttribute('x2', b.x); l.setAttribute('y2', b.y);
      l.setAttribute('class', `ghost ${M.teams[M.mode === 'duo' ? M.turn : 0]} ${snapped ? 'snap' : ''}`);
      // preview what the line would close
      g.querySelectorAll('polygon').forEach((p) => p.remove());
      if (snapped && b.i !== undefined) {
        for (const t of M.board.wouldClose(a.i, b.i)) {
          const [A, B, C] = [t.a, t.b, t.c].map((k) => M.board.dots[k]);
          el('polygon', { points: `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`, class: `preview ${M.teams[M.mode === 'duo' ? M.turn : 0]}` }, g);
        }
      }
    }
    function clearGhost() { if (M) M.L.ghost.innerHTML = ''; }

    /** The tutorial only allows the line it is teaching. */
    function allowed(i, j) {
      if (!M.tut || M.tut > 2) return true;
      const want = M.tut === 1 ? [0, 1] : [2, 0];
      return (i === want[0] && j === want[1]) || (i === want[1] && j === want[0]);
    }

    function attempt(i, j) {
      if (!myInput() || i === j) return;
      if (!allowed(i, j)) {
        host.sound('error');
        coach(M.tut === 1 ? 'Drag between the two <b>glowing</b> dots.' : 'Close the triangle: drag from the glowing dot back to the first one.');
        return;
      }
      if (!M.board.isLegal(i, j)) {
        host.sound('error');
        host.haptic([10, 40, 10]);
        const a = M.board.dots[i], b = M.board.dots[j];
        const bad = el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'ln bad' }, M.L.fx);
        setTimeout(() => bad.remove(), 450);
        const why = M.board.has(i, j) ? 'That line is already drawn.'
          : M.board.puddles.length && !M.board.clear(a, b) ? 'Lines can’t cross puddles or touch other dots.'
            : 'Lines can’t cross other lines or touch other dots.';
        coach(why);
        return;
      }
      playerMove(i, j);
    }

    /* ----- moves ----- */

    async function playerMove(i, j) {
      const who = M.mode === 'duo' ? M.turn : 0;
      M.busy = true;
      host.busy(true);
      select(null);
      clearReady();
      const rec = apply(i, j, who, false);
      if (who === 0) M.playerMoves++;
      // Leaving a triangle open for the rival costs the third star.
      if (who === 0 && M.mode === 'level' && !M.tut && bestGain(M.board) > 0) M.gifted = true;
      M.busy = false;

      if (M.tut === 1) { M.tut = 1.5; }
      else if (M.tut === 2 && rec.points) { M.tut = 3; }

      if (M.mode === 'puzzle' && puzzleCheck(rec)) return;
      M.turn = M.mode === 'duo' ? 1 - M.turn : 1;
      persist();
      await next();
    }

    /** Draw a line on the board and the screen, with all that follows from it. */
    function apply(i, j, player, animate) {
      const { board } = M;
      const rec = board.play(i, j, player);
      M.history.push({ rec, player });
      M.L.lines.querySelectorAll('.last').forEach((l) => l.classList.remove('last', 'cat', 'dog'));
      const ln = drawLine(i, j, player, animate);
      // Mark the rival's line (or, with two players, the last line) until the next one.
      if (player === 1 || M.mode === 'duo') ln.classList.add('last', M.teams[player]);
      host.sound('line');
      host.haptic(8);
      const tm = M.teams[player];
      if (rec.closed.length) {
        for (const t of rec.closed) drawTri(t, true);
        drawTreats();
        const mine = M.mode === 'duo' || player === 0;
        host.sound(rec.points >= 2 ? 'claim-big' : mine ? 'claim' : 'lost');
        setTimeout(() => host.sound(TEAM[tm].voice === 'meow' ? (rec.points >= 2 ? 'meow' : 'meow-small') : (rec.points >= 2 ? 'woof' : 'woof-small')), 140);
        host.haptic(mine ? 20 : [10, 30, 10]);
        bubble(player, rec.closed.length > 1 ? 'Double!' : rec.points > 1 ? 'Treat!' : ['Mine!', 'Yes!', 'Got it!'][Math.floor(Math.random() * 3)]);
        if (player === 0 && M.mode !== 'duo') {
          host.stat('triangles', rec.closed.length);
          const treats = rec.closed.filter((t) => t.points > 1).length;
          if (treats) {
            host.stat('treats', treats);
            const per = (perk.treatCoins || 0) + (powerOf(me()) === 'treats' ? 10 : 0);
            if (per) host.wallet.earn(per * treats, 'treat');
          }
          if (rec.closed.length > 1) { host.stat('doubles'); toast(`<b>Double!</b> One line, two triangles.`); }
          setFace(1, 'sad');
          setTimeout(() => M && setFace(1, 'happy'), 900);
        }
        if (player === 1 && M.mode !== 'duo') { setFace(0, 'sad'); setTimeout(() => M && setFace(0, 'happy'), 900); }
      }
      // A triangle closed with a dot inside: worth explaining once.
      if (!rec.closed.length && !host.flag('tip-inside')) {
        const common = [...board.adj[i]].filter((c) => board.adj[j].has(c));
        if (common.length) {
          host.setFlag('tip-inside');
          setTimeout(() => toast('No point: there’s a <b>dot inside</b> that triangle.', 2600), 300);
        }
      }
      if (rec.revealed) {
        drawDots();
        host.sound('twinkle');
        const lit = rec.revealed.lit.filter((d) => !d.gone).length;
        toast(lit ? `Fireflies! <b>${lit} new dot${lit > 1 ? 's' : ''}</b> lit up.` : 'Fireflies flew by…', 2200);
      } else {
        // claimed triangles may hide treats; dots don't change
      }
      updateHud();
      return rec;
    }

    async function next() {
      if (!M || M.over) return;
      if (checkEnd()) return;
      updateHud();
      if (M.mode === 'duo') { host.busy(false); coach(`<b>${nameOf(M.chars[M.turn])}</b>, draw a line.`, M.turn); return; }
      if (M.turn === 0) {
        host.busy(false);
        if (M.tut === 3) { M.tut = 4; coach('Now claim as many as you can. <b>Most triangles wins!</b>'); }
        else if (M.tut === 2) tutorialStep();
        else if (!M.tut) coach(playerLine());
        scheduleReady();
        return;
      }
      await rivalTurn();
    }

    function playerLine() {
      const b = M.board;
      const open = bestGain(b);
      if (M.mode === 'puzzle') return M.goal.kind === 'safe' ? `Line ${M.playerMoves + 1} of 3: keep ${nameOf(M.chars[1])} empty-pawed.` : M.goal.kind === 'double' ? 'One line. Make it count!' : 'Your move. Every triangle counts!';
      if (open > 0) return 'A triangle is <b>ready to close</b>! Can you see it?';
      if (M.playerMoves === 0) return 'Your move: drag from one dot to another.';
      return ['Your move.', 'Try not to draw the second side of a triangle.', 'Your move. Think one step ahead!'][M.playerMoves % 3];
    }

    async function rivalTurn() {
      const spec = M.spec;
      M.busy = true;
      host.busy(true);
      updateHud();
      setFace(1, 'think');
      coach(`${nameOf(M.chars[1])} is thinking…`, 1);
      const style = M.mode === 'puzzle' ? (M.goal.kind === 'safe' ? 'smart' : spec.style) : spec.style;
      if (M.introUntil > performance.now()) await wait(M.introUntil - performance.now());
      await wait(style === 'sleepy' ? 900 : 550 + Math.random() * 450);
      if (!M || M.over) return;
      const lead = M.board.scores[1] - M.board.scores[0];
      let m;
      if (M.tut === 1.5) m = [1, 2];                    // the tutorial's pup draws the second side
      // The safe-lines puzzle was checked against one particular answer to each
      // line, so the rival gives exactly that one.
      else if (M.mode === 'puzzle' && M.goal.kind === 'safe') m = choose(M.board, 1, { style: 'smart', rand: () => 0.5 });
      else m = choose(M.board, 1, { style, band: spec.band, lead });
      setFace(1, 'happy');
      if (!m) {
        // the sleepy rival naps rather than take a triangle
        M.history.push({ nap: true, player: 1 });
        host.sound('nap');
        setFace(1, 'sleep');
        toast(`${nameOf(M.chars[1])} is napping… <b>go again!</b>`, 1800);
        await wait(700);
      } else {
        apply(m[0], m[1], 1, true);
        await wait(300);
        if (M.tut === 1.5) M.tut = 2;
        if (M.mode === 'puzzle' && M.goal.kind === 'safe' && M.board.scores[1] > 0) { M.busy = false; puzzleFail(); return; }
        if (M.board.tris.at(-1)?.owner === 1 && M.history.at(-1).rec.points && !host.flag('tip-gift') && M.spec.level <= 6) {
          host.setFlag('tip-gift');
          toast('Careful! Drawing the <b>second side</b> of a triangle lets your rival close it.', 3000);
        }
      }
      M.busy = false;
      M.turn = 0;
      persist();
      await next();
    }

    /* ----- the tutorial ----- */

    function tutorialStep() {
      if (M.tut === 1) {
        coach('Drag from one <b>glowing dot</b> to the other to draw a line.');
        markDots('glow', [0, 1]);
        handHint(0, 1);
      } else if (M.tut === 2) {
        coach(`${nameOf(M.chars[1])} drew the second side! <b>Close the triangle</b>: drag from the glowing dot back to the first one.`);
        markDots('glow', [2, 0]);
        handHint(2, 0);
      }
    }

    function handHint(i, j) {
      const a = M.board.dots[i], b = M.board.dots[j];
      M.L.fx.querySelectorAll('.hand').forEach((h) => h.remove());
      const g = el('g', { class: 'hand' }, M.L.fx);
      g.innerHTML = '<path d="M0 -26 C6 -26 8 -22 8 -16 L8 0 L14 -4 C19 -6 23 -3 23 2 L23 22 C23 32 16 40 6 40 L-4 40 C-12 40 -17 35 -20 28 L-28 12 C-31 6 -26 1 -20 4 L-8 10 L-8 -16 C-8 -22 -6 -26 0 -26Z" fill="#fff" stroke="#3b2a1e" stroke-width="3.5" stroke-linejoin="round" transform="scale(.8) translate(0 26)"/>';
      g.style.setProperty('--ax', `${a.x}px`); g.style.setProperty('--ay', `${a.y}px`);
      g.style.setProperty('--bx', `${b.x}px`); g.style.setProperty('--by', `${b.y}px`);
      const stop = () => { g.remove(); markDots('glow', []); M?.svg?.removeEventListener('pointerdown', stop); };
      M.svg.addEventListener('pointerdown', stop, { once: true });
    }

    /* ----- undo, and the gentle "a triangle is ready" nudge ----- */

    const UNDO_COST = 20;
    const undoFree = () => M.undos < M.freeUndos;
    function canUndo() {
      return M && !M.over && !M.busy && M.turn === 0 && M.mode === 'level' && !M.tut
        && M.history.some((h) => !h.nap && h.player === 0);
    }

    /** Take back your last line, and the rival's answer to it. */
    function undoLast() {
      if (!canUndo()) return;
      if (!undoFree()) {
        if (!host.wallet.canAfford(UNDO_COST)) { host.sound('error'); coach(`An undo costs ${UNDO_COST} coins. Win matches to earn more!`); return; }
        host.wallet.spend(UNDO_COST, 'undo');
      }
      clearReady();
      while (M.history.length) {
        const h = M.history.pop();
        if (!h.nap) M.board.undo(h.rec);
        if (h.player === 0 && !h.nap) {
          M.playerMoves = Math.max(0, M.playerMoves - 1);
          break;
        }
      }
      M.undos++;
      host.sound('undo');
      track('undo_used', { level: M.spec.level, free: M.undos <= M.freeUndos ? 1 : 0 });
      drawBoard();
      updateHud();
      persist();
      coach('Taken back. <b>Your move.</b>');
      scheduleReady();
    }

    /** After a quiet 5 seconds on the player's turn, point out a triangle ready to close. */
    function helperOn() {
      return M.mode === 'level' && !M.tut && (M.spec.level <= 20 || powerOf(me()) === 'helper');
    }
    function scheduleReady() {
      clearReady();
      if (!M || !helperOn()) return;
      M.readyT = setTimeout(() => {
        if (!M || M.over || M.turn !== 0 || M.busy || paused) return;
        let best = null, g = 0;
        for (const [i, j] of M.board.legalMoves()) { const v = M.board.gain(i, j); if (v > g) { g = v; best = [i, j]; } }
        if (!best) return;
        const a = M.board.dots[best[0]], b = M.board.dots[best[1]];
        el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'ready-line' }, M.L.hint);
        coach('Psst: a triangle is <b>ready to close</b>. See the glow?');
      }, 5000);
    }
    function clearReady() {
      if (!M) return;
      clearTimeout(M.readyT);
      M.L?.hint.querySelectorAll('.ready-line').forEach((l) => l.remove());
    }

    /* ----- achievements ----- */

    async function checkAchievements() {
      const ctx = { stats: host.stats || {}, save, stars: totalStars(save.stars) };
      for (const a of ACHIEVEMENTS) {
        if (save.ach[a.id] || !a.done(ctx)) continue;
        save.ach[a.id] = today();
        host.wallet.earn(a.reward, 'achievement');
        track('achievement', { id: a.id, reward: a.reward });
        host.sound('claim-big');
        await ask(`
          <div class="tg-kicker green">Achievement</div>
          <div class="tg-medal">${I.trophy}</div>
          <h2 class="tg-card-title">${esc(a.name)}</h2>
          <p class="tg-card-line">${esc(a.text)}</p>
          <div class="tg-coins"><img src="${img('img/coin.png')}" alt="">+${a.reward}</div>
          <button class="tg-btn go" data-act="ok">Nice!</button>`, 'win');
      }
      host.save();
    }

    async function showAchievements() {
      const ctx = { stats: host.stats || {}, save, stars: totalStars(save.stars) };
      const got = ACHIEVEMENTS.filter((a) => save.ach[a.id]).length;
      await ask(`
        <h2 class="tg-card-title">Achievements</h2>
        <p class="tg-card-line small">${got} of ${ACHIEVEMENTS.length} · ${totalStars(save.stars)} stars collected</p>
        <ul class="tg-ach">${ACHIEVEMENTS.map((a) => {
          const done = !!save.ach[a.id];
          const g = !done && a.goal ? a.goal(ctx) : null;
          return `<li class="${done ? 'done' : ''}">
            <span class="tg-ach-ic">${I.trophy}</span>
            <span class="tg-ach-text"><b>${esc(a.name)}</b><small>${esc(a.text)}</small>
              ${g ? `<span class="tg-ach-bar"><i style="width:${Math.min(100, Math.round((100 * g[0]) / g[1]))}%"></i></span>` : ''}</span>
            <span class="tg-ach-reward">${done ? 'Done' : `<img src="${img('img/coin.png')}" alt="">${a.reward}`}</span>
          </li>`;
        }).join('')}</ul>
        <button class="tg-btn go" data-act="ok">Back to the map</button>`, 'sheet');
    }

    /* ----- hints, emotes, rules ----- */

    const hintCost = () => perk.hintCost || HINT_COST;
    async function useHint() {
      if (!myInput() || M.mode === 'duo') return;
      if (!(M.freeHint > 0)) {
        if (!host.wallet.canAfford(hintCost())) {
          host.sound('error');
          coach(`A hint costs ${hintCost()} coins. Win matches to earn more!`);
          return;
        }
        host.wallet.spend(hintCost(), 'hint');
      } else M.freeHint -= 1;
      M.hints++;
      track('hint_used', { level: M.spec.level });
      const m = M.mode === 'puzzle' && M.goal.kind === 'double'
        ? M.board.legalMoves().find(([i, j]) => M.board.gain(i, j) >= 2)
        : hint(M.board, 0);
      if (!m) return;
      const a = M.board.dots[m[0]], b = M.board.dots[m[1]];
      M.L.hint.innerHTML = '';
      el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'hint-line' }, M.L.hint);
      markDots('glow', m);
      coach('Try the <b>glowing</b> line.');
      host.sound('open');
      updateHud();
      persist();
      setTimeout(() => { if (M) { M.L.hint.innerHTML = ''; markDots('glow', []); } }, 3200);
    }

    function emote(k) {
      const tm = M.teams[k];
      host.sound(TEAM[tm].voice);
      bubble(k, TEAM[tm].emote + '!');
      if (M.mode !== 'duo' && k === 0 && Math.random() < 0.6) {
        setTimeout(() => {
          if (!M) return;
          const t1 = M.teams[1];
          host.sound(TEAM[t1].voice === 'meow' ? 'meow-small' : 'woof-small');
          bubble(1, t1 === 'cat' ? ['Hiss!', 'Purr…', 'Meow!'][Math.floor(Math.random() * 3)] : ['Grr!', 'Woof!', 'Arf!'][Math.floor(Math.random() * 3)]);
        }, 700);
      }
    }

    async function showRules() {
      const z = M ? M.spec.zone : zoneOf(save.level);
      const tw = z.twist ? TWISTS[z.twist] : null;
      await ask(`
        <h2 class="tg-card-title">How to play</h2>
        <ol class="tg-rules">
          <li><b>Draw one line</b> between two dots each turn.</li>
          <li>Lines <b>can't cross</b> other lines or touch other dots.</li>
          <li><b>Close a triangle</b> to claim it. One line can close two!</li>
          <li>A triangle with a <b>dot inside</b> scores nothing.</li>
          <li>When no line can be drawn, <b>most triangles wins</b>.</li>
        </ol>
        ${tw ? `<div class="tg-twist-note"><b>${esc(tw.name)}:</b> ${esc(tw.line)}</div>` : ''}
        <button class="tg-btn go" data-act="ok">Back to the yard</button>`);
    }

    /* ----- puzzles ----- */

    function puzzleCheck(rec) {
      const g = M.goal;
      if (g.kind === 'double') {
        if (rec.points >= 2) puzzleWin(); else puzzleFail();
        return true;
      }
      if (g.kind === 'safe') {
        if (bestGain(M.board) > 0) {
          // the rival will take it: show that, then fail
          M.turn = 1; persist(); next();
          return true;
        }
        if (M.playerMoves >= g.target) { puzzleWin(); return true; }
      }
      return false;
    }

    /* ----- the end ----- */

    function checkEnd() {
      const b = M.board;
      if (M.mode === 'puzzle' && M.goal.kind !== 'comeback') {
        if (b.over) { puzzleFail(); return true; }
        return false;
      }
      if (b.over) { finish(false); return true; }
      if (M.tut) return false;
      const diff = b.scores[0] - b.scores[1];
      if (Math.abs(diff) > 0 && b.potential() < Math.abs(diff)) { finish(true); return true; }
      return false;
    }

    async function finish(early) {
      M.over = true;
      clearReady();
      host.busy(false);
      updateHud();
      clearGhost();
      const [mine, theirs] = M.board.scores;
      const spec = M.spec;
      save.match = null;
      if (early) toast(mine > theirs ? `${nameOf(M.chars[1])} can't catch up!` : 'You can’t catch up this time…', 1600);
      await wait(early ? 1300 : 700);
      if (M.mode === 'duo') return duoResult();
      host.stat('matches');
      save.played++;
      if (mine > theirs) return levelWin({ flawless: theirs === 0, puzzle: M.mode === 'puzzle' });
      if (mine === theirs) return tie();
      return levelLose();
    }

    function reward(spec) {
      if (spec.kind === 'tutorial') return 50;
      if (spec.kind === 'boss') return 60 + 10 * spec.zone.index;
      if (spec.kind === 'puzzle') return 30 + 5 * spec.zone.index;
      return 20 + 5 * spec.zone.index;
    }

    async function levelWin({ flawless = false, puzzle = false } = {}) {
      const spec = M.spec;
      const { replay, daily } = M;
      const [mine, theirs] = M.board.scores;
      const stars = starsFor({ puzzle, margin: mine - theirs, gifted: M.gifted, hints: M.hints });
      const before = save.stars[spec.level] || 0;
      const streak = daily ? nextStreak(save.daily) : 0;
      let coins = daily ? dailyReward(streak) : reward(spec);
      if (replay) coins = Math.max(10, Math.round(coins / 2));
      coins += (perk.winBonus || 0) + (powerOf(me()) === 'coins' ? 15 : 0);

      host.stat('wins');
      if (flawless) host.stat('flawless');
      if (spec.kind === 'boss' && !replay) host.stat('bosses');
      if (puzzle) host.stat('puzzles');
      save.wins++;
      save.teamWins[team()] = (save.teamWins[team()] || 0) + 1;
      if (spec.kind === 'boss') {
        if (!save.bossWins.includes(spec.level)) save.bossWins.push(spec.level);
        if (!M.hints && !M.undos) save.cleanBoss = true;
      }
      if (!daily) save.stars[spec.level] = Math.max(before, stars);
      if (daily) save.daily = { last: today(), streak, best: Math.max(save.daily.best || 0, streak) };

      host.sound('levelup');
      setFace(0, 'happy'); setFace(1, 'sad');
      const cheer = pose(M.chars[0], 'cheer');
      const canDouble = host.rewarded.available('double-coins');
      const kicker = daily ? `Daily Yard · ${streak} day streak` : replay ? `Replay · level ${spec.level}` : spec.kind === 'boss' ? 'Boss beaten!' : puzzle ? 'Puzzle solved!' : `Level ${spec.level} complete`;
      const title = spec.kind === 'tutorial' ? 'Your first win!' : puzzle ? 'Clever paws!' : daily ? 'Today\u2019s yard is yours!' : 'The yard is yours!';
      const starRow = daily ? '' : `<div class="tg-stars" aria-label="${stars} of 3 stars">${[0, 1, 2].map((k) => `<i class="${k < stars ? 'on' : ''}" style="--k:${k}">${I.star}</i>`).join('')}</div>
        ${puzzle ? '' : `<ul class="tg-star-why">${starLines.map((line, k) => `<li class="${(k === 0 || (k === 1 && mine - theirs >= 3) || (k === 2 && !M.gifted)) ? 'on' : ''}">${esc(line)}</li>`).join('')}</ul>`}
        ${replay && stars <= before ? `<p class="tg-card-line small">Your best here is ${before} ${before === 1 ? 'star' : 'stars'}.</p>` : ''}`;
      const act = await ask(`
        <div class="tg-confetti" aria-hidden="true">${Array.from({ length: 14 }, (_, k) => `<i style="--k:${k}"></i>`).join('')}</div>
        <div class="tg-kicker green">${esc(kicker)}</div>
        <h2 class="tg-card-title big">${esc(title)}</h2>
        <img class="tg-win-art ${M.teams[0]}" src="${img(cheer)}" alt="">
        ${starRow}
        ${puzzle ? '' : `<div class="tg-final"><span class="${M.teams[0]}">${mine}</span><i>–</i><span class="${M.teams[1]}">${theirs}</span><img src="${img(face(M.chars[1], 'sad'))}" alt=""></div>`}
        <div class="tg-coins"><img src="${img('img/coin.png')}" alt="">+${coins}</div>
        <button class="tg-btn go" data-act="next">${spec.kind === 'tutorial' ? 'Keep playing' : replay || daily ? 'Back to the map' : 'Next level'}</button>
        ${canDouble ? `<button class="tg-btn ghost" data-act="double">${I.ad}<span>Watch to double: +${coins * 2}</span></button>` : ''}`, 'win');
      let paid = coins;
      if (act === 'double' && await host.rewarded.show('double-coins')) paid = coins * 2;
      host.wallet.earn(paid, daily ? 'daily-yard' : 'win');
      track(daily ? 'daily_yard_won' : replay ? 'replay_won' : 'match_won', { level: spec.level, kind: spec.kind, hints: M.hints, undos: M.undos, stars, streak: streak || undefined });
      const was = save.level;
      if (!replay && !daily) {
        host.levelWon({ level: spec.level, kind: spec.kind, score: `${mine}-${theirs}`, team: M.teams[0], stars });
        save.level = Math.max(save.level, spec.level + 1);
        save.streak = null;
        save.best = Math.max(save.best, spec.level);
      }
      M = null;
      host.save();
      if (!replay && !daily) {
        await host.levelBreak();
        await host.moment('level-complete');
      }
      await newFriends(was, save.level);
      await checkAchievements();
      showMap();
    }

    /** Characters who join when a zone boss falls: one cat and one dog. */
    async function newFriends(from, to) {
      if (to <= from) return;
      const ids = [];
      for (let lv = from + 1; lv <= to; lv++) ids.push(...joiningAt(lv));
      if (!ids.length) return;
      const mineNew = ids.filter((id) => (team() === 'cat' ? CATS : DOGS).includes(id));
      const show = mineNew.length ? mineNew : ids;
      await ask(`
        <div class="tg-kicker green">New friend!</div>
        <div class="tg-friends">${ids.map((id) => `<span class="tg-friend"><img src="${img(face(id))}" alt=""><b>${nameOf(id)}</b></span>`).join('')}</div>
        <h2 class="tg-card-title">${show.map(nameOf).join(' and ')} ${show.length > 1 ? 'join' : 'joins'} the neighbourhood</h2>
        <p class="tg-card-line">${esc(POWERS[powerOf(show[0])])}</p>
        <p class="tg-card-line small">Pick ${show.length > 1 ? 'them' : nameOf(show[0])} any time from your name on the map.</p>
        <button class="tg-btn go" data-act="ok">Hooray!</button>`);
      track('character_unlocked', { ids: ids.join(',') });
    }

    /** Play the same match again, the same way it was started. */
    function again(spec, replay, daily) {
      if (daily) return beginMatch(dailySpec(today(), save.level, team()), { daily: true });
      if (replay) return replayLevel(spec.level);
      return startLevel(spec.level, { quick: true });
    }

    async function levelLose() {
      const spec = M.spec;
      host.sound('setback');
      setFace(0, 'sad'); setFace(1, 'happy');
      const undoable = M.history.filter((h) => !h.nap && h.player === 0).length >= 3 && host.rewarded.available('undo-moves') && !M.undone;
      const tips = [
        'Avoid drawing the <b>second side</b> of a triangle: your rival will close it.',
        'When every line gives something away, give away the <b>smallest</b> gift.',
        'Look for a line that closes <b>two triangles</b> at once.',
        'Treats make a triangle worth 3. <b>Guard them!</b>',
      ];
      const act = await ask(`
        <div class="tg-kicker">${esc(spec.kind === 'boss' ? 'Boss match' : `Level ${spec.level}`)}</div>
        <h2 class="tg-card-title big">${esc(nameOf(M.chars[1]))} took the yard</h2>
        <div class="tg-lose-art"><img src="${img(pose(M.chars[0], 'slump'))}" alt=""><img class="r" src="${img(face(M.chars[1], 'happy'))}" alt=""></div>
        <div class="tg-final"><span class="${M.teams[0]}">${M.board.scores[0]}</span><i>–</i><span class="${M.teams[1]}">${M.board.scores[1]}</span></div>
        <p class="tg-tip">${I.hint}<span>${tips[(spec.level + save.played) % tips.length]}</span></p>
        <button class="tg-btn go" data-act="again">${I.retry}<span>Rematch</span></button>
        <div class="tg-row">
          ${undoable ? `<button class="tg-btn ghost" data-act="undo">${I.ad}<span>Undo 3 moves</span></button>` : ''}
          <button class="tg-btn ghost" data-act="map">${I.map}<span>Map</span></button>
        </div>`, 'lose');
      if (act === 'undo' && await host.rewarded.show('undo-moves')) {
        track('undo_moves', { level: spec.level });
        return undoThree();
      }
      const { replay, daily } = M;
      if (!replay && !daily) {
        host.levelLost({ level: spec.level, kind: spec.kind, score: M.board.scores.join('-'), team: M.teams[0] });
        save.streak = { level: spec.level, n: lossesAt(spec.level) + 1 };
      }
      track(daily ? 'daily_yard_lost' : 'match_lost', { level: spec.level, kind: spec.kind, losses: lossesAt(spec.level), replay: replay ? 1 : 0 });
      M = null;
      host.save();
      if (act === 'map') return showMap();
      return again(spec, replay, daily);
    }

    function undoThree() {
      let mine = 0;
      while (M.history.length) {
        const h = M.history.pop();
        if (!h.nap) M.board.undo(h.rec);
        if (h.player === 0 && !h.nap && ++mine === 3) break;
      }
      M.over = false;
      M.undone = true;
      M.turn = 0;
      drawBoard();
      updateHud();
      persist();
      coach('Three moves back. <b>Try a different line!</b>');
      host.busy(false);
    }

    async function tie() {
      const spec = M.spec;
      host.sound('setback');
      const act = await ask(`
        <div class="tg-kicker">Level ${spec.level}</div>
        <h2 class="tg-card-title big">It's a draw!</h2>
        <div class="tg-final"><span class="${M.teams[0]}">${M.board.scores[0]}</span><i>–</i><span class="${M.teams[1]}">${M.board.scores[1]}</span></div>
        <p class="tg-card-line">So close. One more triangle and the yard is yours.</p>
        <button class="tg-btn go" data-act="again">${I.retry}<span>Play again</span></button>
        <button class="tg-link" data-act="map">Back to the map</button>`, 'lose');
      const { replay, daily } = M;
      M = null;
      host.save();
      if (act === 'map') return showMap();
      return again(spec, replay, daily);
    }

    async function puzzleWin() {
      M.over = true;
      save.match = null;
      await wait(700);
      return levelWin({ puzzle: true });
    }

    async function puzzleFail() {
      if (M.over) return;
      M.over = true;
      save.match = null;
      host.busy(false);
      await wait(800);
      host.sound('setback');
      const spec = M.spec;
      const act = await ask(`
        <div class="tg-kicker purple">Puzzle · Level ${spec.level}</div>
        <h2 class="tg-card-title big">Not quite!</h2>
        <p class="tg-card-line">${M.goal.kind === 'double' ? 'That line closed fewer than two triangles. Look for a line that is the last side of two at once.' : M.goal.kind === 'safe' ? `${nameOf(M.chars[1])} found a triangle to close. Look for lines that don't make a second side.` : 'So close. Try again!'}</p>
        <button class="tg-btn go" data-act="again">${I.retry}<span>Try again (free)</span></button>
        <button class="tg-link" data-act="map">Back to the map</button>`, 'lose');
      track('puzzle_failed', { level: spec.level, kind: M.goal.kind });
      const { replay } = M;
      M = null;
      host.save();
      if (act === 'map') return showMap();
      return replay ? replayLevel(spec.level) : beginMatch(levelSpec(spec.level, team()));
    }

    /* ----- two players ----- */

    function startDuo() {
      const spec = { ...levelSpec(Math.max(6, Math.min(save.level, 30)), team()), kind: 'match', first: 0 };
      spec.seed = Date.now() % 100000;
      beginMatch(spec, { duo: true });
    }

    async function duoResult() {
      host.stat('duo');
      const [a, b] = M.board.scores;
      const winner = a === b ? -1 : a > b ? 0 : 1;
      host.sound(winner < 0 ? 'setback' : 'levelup');
      const act = await ask(`
        <div class="tg-kicker">2 players</div>
        <h2 class="tg-card-title big">${winner < 0 ? 'A draw!' : `${esc(nameOf(M.chars[winner]))} wins the yard!`}</h2>
        ${winner >= 0 ? `<img class="tg-win-art ${M.teams[winner]}" src="${img(pose(M.chars[winner], 'cheer'))}" alt="">` : ''}
        <div class="tg-final"><span class="${M.teams[0]}">${a}</span><i>–</i><span class="${M.teams[1]}">${b}</span></div>
        <button class="tg-btn go" data-act="again">${I.retry}<span>Play again</span></button>
        <button class="tg-link" data-act="map">Back to the map</button>`, 'win');
      M = null;
      await checkAchievements();
      if (act === 'map') return showMap();
      return startDuo();
    }

    /* ---------------- layout ---------------- */

    function relayout() {
      const wrap = viewEl.querySelector('.tg-yard-wrap');
      const yard = viewEl.querySelector('.tg-yard');
      if (!wrap || !yard) return;
      const ratio = (W + 2 * PAD) / (H + 2 * PAD);
      const r = wrap.getBoundingClientRect();
      let w = r.width, h = w / ratio;
      if (h > r.height) { h = r.height; w = h * ratio; }
      yard.style.width = `${Math.floor(w)}px`;
      yard.style.height = `${Math.floor(h)}px`;
    }
    // For browser tests under ?dev=1: read-only peeks at the match.
    if (host.dev) globalThis.__tg = { get M() { return M; }, get save() { return save; }, get view() { return view; }, map() { layer.innerHTML = ''; M = null; save.match = null; showMap(); }, win() { if (M && !M.over) { M.board.scores[0] = M.board.scores[1] + 5; finish(true); } } };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => relayout()) : null;
    ro?.observe(viewEl);

    /* ---------------- the instance ---------------- */

    return {
      start(saved) {
        if (saved) {
          Object.assign(save, saved, { chars: { ...save.chars, ...(saved.chars || {}) }, seen: { ...(saved.seen || {}) } });
        }
        for (const t of ['cat', 'dog']) if (!isUnlocked(save.chars[t], save.level)) save.chars[t] = t === 'cat' ? 'patch' : 'rex';
        applyMascot();
        report();
      },
      serialize: () => ({ ...save }),
      show() {
        visible = true;
        if (M && view === 'match') { report(); return; }
        if (!save.team) return showPick();
        if (save.match && save.match.level === save.level) {
          const spec = levelSpec(save.match.level, save.match.team || team(), { losses: lossesAt(save.match.level) });
          const resume = save.match;
          try { beginMatch(spec, { resume }); return; } catch { save.match = null; }
        }
        showMap();
      },
      hide() { visible = false; },
      pause() { paused = true; holdTimers(); },
      resume() { paused = false; releaseTimers(); },
      onBack() {
        const top = topCard();
        if (top) {
          if (top.classList.contains('sheet') && top._resolve) { closeCard(top); top._resolve(); return true; }
          return true;                    // results and intros need an answer
        }
        if (view === 'match' && M) {
          if (M.mode === 'duo') { M = null; showMap(); return true; }
          persist(); host.save();
          M = null;
          showMap();
          return true;
        }
        return false;
      },
      async restart() {
        if (!M && save.team && view === 'map') { startLevel(save.level, { quick: true }); return; }
        if (!M || M.mode === 'duo' || M.over) return;
        if (M.playerMoves > 0 && M.mode !== 'puzzle') {
          if (!await host.confirmLevelLoss()) return;
          host.levelLost({ level: M.spec.level, kind: M.spec.kind, reason: 'restart' });
        }
        const lv = M.spec.level;
        M = null;
        save.match = null;
        startLevel(lv, { quick: true });
      },
      setPerk(config) { perk = config || {}; if (M) updateHud(); },
      setCosmetic(id) {
        theme = THEMES.some((x) => x.id === id) ? id : 'lawn';
        const y = viewEl.querySelector('.tg-yard');
        if (y) y.className = y.className.replace(/theme-\S+/, `theme-${theme}`);
      },
      relayout,
      rewardValue: () => 60 + 10 * zoneOf(save.level).index,
      canOffer: (task) => !task.from || save.level >= task.from,
      progressRows: () => ({
        blurb: 'Draw lines, close triangles, win the yard. Every fifth level is a puzzle and every tenth a boss.',
        tiles: [
          { value: Math.max(0, save.level - 1), label: 'levels cleared' },
          { value: save.wins, label: 'matches won' },
          { value: zoneOf(save.level).index + 1, label: 'zone' },
        ],
      }),
      dev: {
        buttons: [
          { id: 'win', label: 'Win now', run: () => { if (M && !M.over) { M.board.scores[0] = M.board.scores[1] + 5; finish(true); } } },
          { id: 'lose', label: 'Lose now', run: () => { if (M && !M.over) { M.board.scores[1] = M.board.scores[0] + 5; finish(true); } } },
          { id: 'skip', label: 'Skip level', run: () => { save.level++; M = null; save.match = null; showMap(); } },
          { id: 'z', label: '+10 levels', run: () => { save.level += 10; M = null; save.match = null; showMap(); } },
          { id: 'team', label: 'Swap team', run: () => { save.team = otherTeam(team()); showMap(); } },
        ],
        readout: () => `<dl><dt>level</dt><dd>${save.level}</dd><dt>view</dt><dd>${view}</dd><dt>turn</dt><dd>${M ? M.turn : '-'}</dd><dt>style</dt><dd>${M ? M.spec.style : '-'}</dd></dl>`,
      },
    };
  },
};

