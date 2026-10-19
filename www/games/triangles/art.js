/**
 * How each zone looks: the scenery drawn along the map's trail, and an
 * optional painted background.
 *
 * Painted backgrounds: put img/bg-<zone>.jpg in this folder (1080 x 1920,
 * see marketing/ART-PROMPTS.md) and add the zone's id to BACKGROUNDS. Until a
 * zone has one, its colours and the drawn scenery below stand in.
 */

import { rng } from './geom.js';

/** Zones that have a painted background in img/: e.g. ['backyard', 'park']. */
export const BACKGROUNDS = ['backyard', 'park', 'rain', 'fence', 'night'];

export const background = (zoneId) => (BACKGROUNDS.includes(zoneId) ? `img/bg-${zoneId}.jpg` : null);

const W = 360;

function tuft(x, y, c) { return `<path d="M${x} ${y} l3 -9 l3 9 l3 -12 l3 12 l3 -8 l2 8" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`; }
function flower(x, y, c) {
  return `<g transform="translate(${x} ${y})"><circle cx="0" cy="-5" r="3.4" fill="${c}"/><circle cx="5" cy="0" r="3.4" fill="${c}"/><circle cx="0" cy="5" r="3.4" fill="${c}"/><circle cx="-5" cy="0" r="3.4" fill="${c}"/><circle r="2.8" fill="#f6d36b"/></g>`;
}
function tree(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-4" y="6" width="8" height="20" rx="3" fill="#8a6a4a"/><circle cx="0" cy="-6" r="22" fill="#9fbf6e"/><circle cx="-12" cy="2" r="15" fill="#a9c97a"/><circle cx="12" cy="0" r="16" fill="#b6d388"/></g>`;
}
function paw(x, y, r, c) {
  return `<g transform="translate(${x} ${y}) rotate(${r})" fill="${c}"><ellipse cx="0" cy="3" rx="5" ry="4.2"/><circle cx="-5.4" cy="-3" r="2.1"/><circle cx="-1.9" cy="-6" r="2.1"/><circle cx="1.9" cy="-6" r="2.1"/><circle cx="5.4" cy="-3" r="2.1"/></g>`;
}
function puddle(x, y, w) {
  return `<g><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.36}" fill="#a9c8e4" stroke="#87acd2" stroke-width="2"/><ellipse cx="${x - w * 0.3}" cy="${y - w * 0.08}" rx="${w * 0.3}" ry="${w * 0.07}" fill="#fff" opacity=".5"/></g>`;
}
function fence(x, y) {
  const posts = [0, 18, 36].map((dx) => `<rect x="${x + dx - 3}" y="${y - 22}" width="7" height="28" rx="2" fill="#d9c08f" stroke="#a8916f" stroke-width="1.5"/>`).join('');
  return `<g><rect x="${x - 6}" y="${y - 14}" width="50" height="5" rx="2" fill="#cdb27f"/><rect x="${x - 6}" y="${y - 4}" width="50" height="5" rx="2" fill="#cdb27f"/>${posts}</g>`;
}
function sunflower(x, y) {
  const petals = Array.from({ length: 8 }, (_, k) => `<ellipse cx="0" cy="-8" rx="3" ry="6" fill="#f2c13a" transform="rotate(${k * 45})"/>`).join('');
  return `<g transform="translate(${x} ${y})"><path d="M0 4 v24" stroke="#7fa45a" stroke-width="3"/>${petals}<circle r="5" fill="#8a5a2a"/></g>`;
}
function star(x, y, r) { return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6f1d0" opacity=".85"/>`; }
function firefly(x, y) { return `<g class="fly"><circle cx="${x}" cy="${y}" r="9" fill="#ffe680" opacity=".22"/><circle cx="${x}" cy="${y}" r="3" fill="#ffe680"/></g>`; }

/** Scenery for a zone's map, as SVG markup `height` px tall, kept to the sides of the trail. */
export function scenery(zoneId, height, seed = 1) {
  const r = rng(seed * 31 + 7);
  const side = () => (r() < 0.5 ? r.range(8, 64) : r.range(W - 64, W - 8));
  const n = Math.round(height / 64);
  const out = [];
  for (let k = 0; k < n; k++) {
    const x = Math.round(side()), y = Math.round(r.range(20, height - 10));
    switch (zoneId) {
      case 'park':
        out.push(r() < 0.45 ? tree(x, y, r.range(0.8, 1.15).toFixed(2)) : r() < 0.5 ? tuft(x, y, '#86a85a') : `<circle cx="${x}" cy="${y}" r="7" fill="#f4c35a" stroke="#c98f2b" stroke-width="2"/>`);
        break;
      case 'rain':
        out.push(r() < 0.4 ? puddle(x, y, Math.round(r.range(16, 28))) : `<path class="drop" d="M${x} ${y} l-2 8" stroke="#8fb0d0" stroke-width="2.4" stroke-linecap="round" style="animation-delay:${(r() * 1.4).toFixed(2)}s"/>`);
        break;
      case 'fence':
        out.push(r() < 0.4 ? fence(x - 20, y) : r() < 0.5 ? sunflower(x, y) : tuft(x, y, '#a3a35a'));
        break;
      case 'night':
        out.push(r() < 0.5 ? star(Math.round(r.range(6, W - 6)), y, r.range(1, 2.4).toFixed(1)) : firefly(x, y));
        break;
      default:
        out.push(r() < 0.4 ? tuft(x, y, '#8fb35f') : r() < 0.6 ? flower(x, y, r.pick(['#f2a8b5', '#ffffff', '#f6c66b'])) : paw(x, y, Math.round(r.range(-30, 30)), 'rgba(160,130,90,.25)'));
    }
  }
  if (zoneId === 'night') out.unshift(`<circle cx="${W - 46}" cy="40" r="20" fill="#f6f1d0"/><circle cx="${W - 38}" cy="34" r="18" fill="#2f3858"/>`);
  if (zoneId === 'rain') out.unshift(`<g fill="#e9eff5" opacity=".9"><ellipse cx="60" cy="34" rx="34" ry="14"/><ellipse cx="84" cy="26" rx="22" ry="14"/><ellipse cx="300" cy="60" rx="30" ry="12"/></g>`);
  return `<svg class="tg-scenery" viewBox="0 0 ${W} ${height}" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${out.join('')}</svg>`;
}
