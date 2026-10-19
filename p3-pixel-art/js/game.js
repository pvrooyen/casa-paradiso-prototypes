// Casa Paradiso, P3 "Pixel-art retro game".
// Fixed-timestep loop, integer-scaled native canvas, palette-swapped day/night.
import { Pix, css, paintIcon, hash } from './pixel.js';
import * as SP from './sprites.js';
import { PEDRO, ARM_DOWN, WAVE_A, WAVE_B } from './pedro.js';
import {
  W, H, SEA_TOP, PX0, PX1, buildWorld, makeCottage, makeBigHouse, makeLapa, makePalm,
  makeCasuarina, makePool, shadow, makeGrid, findPath, CELL, GW, GH,
} from './world.js';
import { PLACES, PEDRO_FACTS, EXTRAS } from './data.js';
import { initUI, Dialog, Sheet, Prices, Sound } from './ui.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const OG = params.has('og'), DEBUG = params.has('debug');
if (OG) document.body.classList.add('og');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- world
const terrain = buildWorld();
const objects = [];
const add = (o) => (objects.push(o), o);

const COT = { top: [192, 116], mid: [200, 172], down: [192, 228] };
const BIG = [281, 115], LAPA = [247, 121], POOL = [251, 195];

const buildings = {};
Object.entries(COT).forEach(([id, [x, y]], i) => {
  const c = makeCottage(i + 2);
  shadow(terrain, x + 24, y + 46, 22, 3);
  buildings[id] = add({ id, kind: 'bld', pix: c.pix, x, y, base: y + 46, wins: c.wins, bounce: 9, flash: 0, plate: [x + 23, y - 1] });
});
{
  const b = makeBigHouse();
  shadow(terrain, BIG[0] + 42, BIG[1] + 56, 40, 3);
  buildings.big = add({ id: 'big', kind: 'bld', pix: b.pix, x: BIG[0], y: BIG[1], base: BIG[1] + 74, wins: b.wins, bounce: 9, flash: 0, plate: [BIG[0] + 42, BIG[1] - 1] });
  const l = makeLapa();
  shadow(terrain, LAPA[0] + 16, LAPA[1] + 29, 15, 2);
  buildings.lapa = add({ id: 'lapa', kind: 'bld', pix: l.pix, x: LAPA[0], y: LAPA[1], base: LAPA[1] + 29, wins: l.wins, bounce: 9, flash: 0 });
}
const poolFrames = [0, 1, 2].map(makePool);

// coconut palms [baseX, baseY, height, flip]
const PALM_FRAMES = {};
function palmFrames(h, flip) { const k = h + (flip ? 'f' : ''); return PALM_FRAMES[k] || (PALM_FRAMES[k] = [0, 1, 2].map(f => makePalm(h, f, flip))); }
[[262, 252, 30, false], [342, 214, 32, true], [212, 318, 26, false], [329, 104, 30, false], [410, 108, 34, true],
 [150, 107, 28, false], [470, 300, 30, true], [118, 262, 32, false], [520, 150, 28, false], [44, 190, 30, true], [384, 280, 28, true]]
  .forEach(([x, y, h, f], i) => {
    const fr = palmFrames(h, f);
    shadow(terrain, x + (f ? -6 : 6), y + 1, 9, 2);
    add({ kind: 'palm', frames: fr, x: x - 18, y: y - fr[0].h + 2, base: y, phase: i * 0.37 });
  });
[[176, 140, 32], [394, 150, 30], [430, 236, 34], [140, 200, 30], [500, 214, 32], [62, 140, 28], [92, 300, 30], [532, 270, 30], [24, 260, 28]]
  .forEach(([x, y, h], i) => { const p = makeCasuarina(h, i + 1); add({ kind: 'tree', pix: p, x: x - 7, y: y - h + 1, base: y }); });
[[360, 300], [226, 304], [330, 266], [276, 304], [200, 200]].forEach(([x, y]) => {
  const p = Pix.from(SP.ALOE); add({ kind: 'prop', pix: p, x: x - 4, y: y - 7, base: y });
});
const carPix = Pix.from(SP.CAR);
const CAR_AT = [318, 291];
shadow(terrain, CAR_AT[0] + 9, CAR_AT[1] + 9, 10, 2);
add({ kind: 'prop', pix: carPix, x: CAR_AT[0], y: CAR_AT[1], base: CAR_AT[1] + 8 });

const dhowPix = Pix.from(SP.DHOW);
const sharkPix = (() => {
  const p = new Pix(18, 6);
  p.ellipse(8, 3, 7, 2, 'q'); p.set(16, 2, 'q'); p.set(17, 1, 'q'); p.set(16, 4, 'q'); p.set(17, 5, 'q');
  [[4, 2], [7, 3], [10, 2], [6, 4], [12, 3], [9, 1]].forEach(([x, y]) => p.set(x, y, 'C'));
  return p;
})();
const sunPix = Pix.from(SP.SUN), moonPix = Pix.from(SP.MOON);
const SUN = [362, 30], MOON = [198, 50];

// ---------------------------------------------------------------- characters
const dogFrames = {
  right: SP.DOG_RIGHT.map(r => Pix.from(r)),
  left: SP.DOG_RIGHT.map(r => Pix.from(r, true)),
  down: SP.DOG_DOWN.map(r => Pix.from(r)),
  up: SP.DOG_UP.map(r => Pix.from(r)),
  blink: Pix.from(SP.DOG_BLINK),
};
function pedroPix(mod) {
  const p = Pix.from(PEDRO);
  if (mod === 'blink') PEDRO.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (y === 6 && row[x] === '*') p.set(x, y, 'k'); });
  if (mod === 'a' || mod === 'b') { ARM_DOWN.forEach(([x, y]) => p.clear(x, y)); (mod === 'a' ? WAVE_A : WAVE_B).forEach(([x, y, c]) => p.set(x, y, c)); }
  return p;
}
const pedroFrames = { idle: pedroPix(), blink: pedroPix('blink'), a: pedroPix('a'), b: pedroPix('b') };

const HOME = [334, 306];
const dog = { x: HOME[0], y: HOME[1], dir: 'down', path: [], speed: 75, dist: 0, onArrive: null, look: 0, heart: 9, atBeach: false };
const pedro = { x: 300, y: 224, wave: 9, fact: 0 };
let idleFor = 0; // seconds since the visitor last did anything

const TARGETS = {
  top: [COT.top[0] + 40, COT.top[1] + 51], mid: [COT.mid[0] + 40, COT.mid[1] + 51], down: [COT.down[0] + 40, COT.down[1] + 51],
  big: [BIG[0] + 29, BIG[1] + 81], pool: [300, 204], beach: [366, 92], home: HOME,
};

const grid = makeGrid([
  ...Object.values(COT).map(([x, y]) => [x + 2, y + 14, 43, 32]),
  [BIG[0] + 2, BIG[1] + 20, 81, 38], [BIG[0] + 21, BIG[1] + 56, 14, 21],
  [LAPA[0], LAPA[1] + 8, 33, 22],
  [POOL[0] - 2, POOL[1] - 2, 44, 26],
  [CAR_AT[0] - 2, CAR_AT[1] - 1, 22, 11],
  [pedro.x - 8, pedro.y - 8, 14, 10],
]);

// ---------------------------------------------------------------- canvas + camera
const canvas = $('scene'), ctx = canvas.getContext('2d');
const view = document.createElement('canvas'), vctx = view.getContext('2d');
const nview = document.createElement('canvas'), nctx = nview.getContext('2d');
let S = 2, DPR = 1, camX = 0, camY = 0, VW = 0, VH = 0;

function layout() {
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  const cw = window.innerWidth, ch = window.innerHeight;
  canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
  canvas.width = Math.round(cw * DPR); canvas.height = Math.round(ch * DPR);
  const desktop = Prices.docked || cw >= 980;
  const dockW = Prices.docked ? 388 : 0;
  const bar = document.querySelector('.bar');
  const barH = OG ? 0 : Math.max(0, ch - bar.getBoundingClientRect().top);
  const chip = $('chip');
  const hudBottom = desktop ? 0 : chip.getBoundingClientRect().bottom + 6;
  const availW = (cw - dockW) * DPR, availH = (ch - barH) * DPR;
  S = Math.max(1, Math.floor(Math.min(availW / 190, availH / 290)));
  VW = Math.ceil(canvas.width / S); VH = Math.ceil(canvas.height / S);
  for (const c of [view, nview]) { c.width = VW; c.height = VH; }
  [ctx, vctx, nctx].forEach(c => { c.imageSmoothingEnabled = false; });
  const regionTop = desktop ? 14 : 60, regionBot = 346;
  const topN = hudBottom * DPR / S, freeN = (ch - barH) * DPR / S - topN;
  if (freeN >= regionBot - regionTop) camY = regionTop - topN - (freeN - (regionBot - regionTop)) / 2;
  else camY = regionBot - (ch - barH) * DPR / S;
  camX = (PX0 + PX1) / 2 - ((cw - dockW) * DPR / S) / 2;
  if (OG) camY = 16;
  camX = Math.round(camX); camY = Math.round(camY);
  placeTags();
}
const toCss = (wx, wy) => [((wx - camX) * S) / DPR, ((wy - camY) * S) / DPR];

// ---------------------------------------------------------------- tags (accessible buttons over the canvas)
const tagBox = $('tags');
const TAGS = [
  { id: 'big', label: 'Big house', at: () => buildings.big.plate },
  { id: 'top', label: 'Top', at: () => buildings.top.plate },
  { id: 'mid', label: 'Middle', at: () => buildings.mid.plate },
  { id: 'down', label: 'Down', at: () => buildings.down.plate },
  { id: 'pool', label: 'Pool', at: () => [POOL[0] + 20, POOL[1] - 1] },
  { id: 'beach', label: 'Beach 5 min', at: () => [344, 93] },
  { id: 'pedro', label: 'Pedro', ghost: true, aria: 'Pedro, the housekeeper: tap for a fact', at: () => [pedro.x, pedro.y - 11] },
  { id: 'dog', label: 'Tofu', ghost: true, aria: 'Tofu the dog: run to the beach', at: () => [dog.x, dog.y - 7] },
];
TAGS.forEach(t => {
  const b = document.createElement('button');
  b.className = 'tag' + (t.ghost ? ' ghost' : '');
  b.textContent = t.label;
  b.setAttribute('aria-label', t.aria || (t.id === 'beach' ? 'Path to the beach: 5 minutes' : `${PLACES[t.id].name}: photos and price`));
  b.addEventListener('click', (e) => { e.stopPropagation(); act(t.id); });
  tagBox.append(b); t.el = b;
});
function placeTags(onlyGhosts = false) {
  TAGS.forEach(t => {
    if (onlyGhosts && !t.ghost) return;
    const [x, y] = toCss(...t.at());
    t.el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -50%)`;
  });
}

// ---------------------------------------------------------------- state + actions
let time = 0, night = false, nightT = 0, marker = null, hintGone = false;
let run = null; // beach run stopwatch
const ripples = [], parts = [];
const watch = $('watch'), watchT = $('watch-t');

function poke() { idleFor = 0; }
function hideHint() { if (!hintGone) { hintGone = true; $('hint').classList.add('gone'); } }
const faceDog = (c) => paintIcon(c, SP.DOG_FACE);
const facePedro = (c) => paintIcon(c, PEDRO.slice(0, 14));

function walkTo([tx, ty], cb, fixedDuration = 0, stroll = 0) {
  const pts = findPath(grid, dog.x, dog.y, tx, ty);
  let len = 0, px = dog.x, py = dog.y;
  pts.forEach(([x, y]) => { len += Math.abs(x - px) + Math.abs(y - py); px = x; py = y; });
  dog.path = pts;
  dog.speed = stroll || (fixedDuration ? Math.max(30, len / fixedDuration) : Math.max(80, len / 2.6));
  if (reduced) dog.speed *= 2;
  dog.onArrive = cb;
  dog.atBeach = false;
  if (len < 2) { dog.path = []; dog.onArrive = null; cb && cb(); }
  return len;
}

function resetOverlays() { Dialog.close(); Sheet.close(); Prices.close(); }

function act(id) {
  hideHint(); poke();
  if (id === 'lapa') id = 'big';
  if (id === 'dog') { if (dog.atBeach) goHome(); else goBeach(); return; }
  if (id === 'beach') { if (dog.atBeach) { Sheet.open('beach'); } else goBeach(); return; }
  if (id === 'pedro') return talkPedro();
  if (id === 'pool') return goPool();
  if (id === 'car' || id === 'sea') { resetOverlays(); Dialog.say({ name: EXTRAS[id].name, text: EXTRAS[id].text, face: 'dog', faceDraw: faceDog }); return; }
  if (buildings[id]) return goBuilding(id);
}

function goBuilding(id) {
  resetOverlays(); stopRun();
  marker = id;
  Sound.play('woof');
  walkTo(TARGETS[id], () => {
    dog.dir = 'up'; marker = null;
    const b = buildings[id]; b.bounce = 0; b.flash = 1.4;
    if (id === 'big') { buildings.lapa.bounce = -0.08; buildings.lapa.flash = 1.4; }
    Sound.play('bounce');
    setTimeout(() => Dialog.say({ name: PLACES[id].plate, text: PLACES[id].say, face: 'dog', faceDraw: faceDog, then: () => Sheet.open(id), autoMs: 2600 }), 420);
  });
}

function goPool() {
  resetOverlays(); stopRun();
  splash(POOL[0] + 20, POOL[1] + 11);
  walkTo(TARGETS.pool, () => { dog.dir = 'left'; dog.heart = 0; });
  setTimeout(() => Dialog.say({ name: 'POOL', text: PLACES.pool.say, face: 'dog', faceDraw: faceDog, then: () => Sheet.open('pool'), autoMs: 2200 }), 350);
}
function splash(x, y) {
  Sound.play('splash');
  [0, 0.18, 0.36].forEach(d => ripples.push({ x, y, t: -d }));
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; parts.push({ x, y, vx: Math.cos(a) * (14 + hash(i, 1) * 16), vy: -30 - hash(i, 2) * 30, t: 0, life: 0.7, c: i & 1 ? 'C' : '*', g: 110 }); }
}

function goBeach() {
  resetOverlays();
  Sound.play('woof');
  const dur = reduced ? 1.6 : 3.6;
  walkTo(TARGETS.beach, () => {
    run.done = true; dog.atBeach = true; dog.dir = 'up'; dog.heart = 0;
    watchT.textContent = '5:00'; Sound.play('fanfare');
    setTimeout(() => Dialog.say({ name: 'TOFU', text: PLACES.beach.say, face: 'dog', faceDraw: faceDog, then: () => { watch.hidden = true; document.body.classList.remove('running'); Sheet.open('beach'); }, autoMs: 1800 }), 300);
  }, dur);
  run = { t: 0, dur, done: false, lastSec: -1 };
  watch.hidden = false; watchT.textContent = '0:00'; document.body.classList.add('running');
}
function stopRun() { run = null; watch.hidden = true; document.body.classList.remove('running'); }
function goHome() { resetOverlays(); stopRun(); walkTo(HOME, () => { dog.dir = 'down'; }); }

function talkPedro() {
  resetOverlays();
  pedro.wave = 0;
  const text = PEDRO_FACTS[pedro.fact % PEDRO_FACTS.length]; pedro.fact++;
  Dialog.say({ name: 'PEDRO', text, face: 'pedro', faceDraw: facePedro });
}

function setNight(on) {
  night = on;
  $('b-night').setAttribute('aria-pressed', String(on));
  $('b-night-l').textContent = on ? 'Day' : 'Night';
  $('b-night').setAttribute('aria-label', on ? 'Switch to day' : 'Switch to night');
  paintIcon($('ico-night'), on ? SP.ICON_SUN : SP.ICON_MOON);
  document.querySelector('meta[name="theme-color"]').content = on ? '#141A3C' : '#A9D3EC';
  Sound.play(on ? 'night' : 'day');
}

// ---------------------------------------------------------------- input
canvas.addEventListener('click', (e) => {
  poke();
  const r = canvas.getBoundingClientRect();
  const wx = camX + ((e.clientX - r.left) * DPR) / S, wy = camY + ((e.clientY - r.top) * DPR) / S;
  const near = (x0, y0, x1, y1, pad = 4) => wx >= x0 - pad && wx <= x1 + pad && wy >= y0 - pad && wy <= y1 + pad;
  if (near(dog.x - 8, dog.y - 15, dog.x + 8, dog.y + 1)) return act('dog');
  if (near(pedro.x - 8, pedro.y - 23, pedro.x + 8, pedro.y + 1)) return act('pedro');
  const hitB = Object.values(buildings).sort((a, b) => b.base - a.base).find(b => near(b.x + 2, b.y + 2, b.x + b.pix.w - 2, b.base, 0));
  if (hitB) return act(hitB.id);
  if (near(POOL[0], POOL[1], POOL[0] + 40, POOL[1] + 32)) return act('pool');
  if (near(CAR_AT[0], CAR_AT[1], CAR_AT[0] + 18, CAR_AT[1] + 9)) return act('car');
  if (near(340, 84, 390, 120) || (wy > 84 && wy < 100)) return act('beach');
  if (wy > SEA_TOP && wy <= 84) return act('sea');
  // anywhere else on the lawn: Tofu trots there
  if (wx > PX0 && wx < PX1 && wy > 112 && wy < 322) {
    hideHint(); resetOverlays(); stopRun();
    const tx = Math.floor(wx / CELL), ty = Math.floor(wy / CELL);
    if (grid[ty * GW + tx]) walkTo([wx, wy], () => { dog.heart = 0; });
  }
});
$('b-night').addEventListener('click', () => setNight(!night));
$('b-sound').addEventListener('click', () => {
  const on = Sound.toggle();
  $('b-sound').setAttribute('aria-pressed', String(on));
  $('b-sound-l').textContent = on ? 'Sound on' : 'Sound';
  paintIcon($('ico-sound'), on ? SP.ICON_SOUND_ON : SP.ICON_SOUND_OFF);
});
$('b-prices').addEventListener('click', () => { hideHint(); Prices.open(); });
$('chip').addEventListener('click', () => { hideHint(); Prices.open(); });
window.addEventListener('resize', layout);

// ---------------------------------------------------------------- update
const STEP = 1 / 60;
function update(dt) {
  time += dt;
  // day/night blend
  const goal = night ? 1 : 0;
  nightT += Math.sign(goal - nightT) * Math.min(Math.abs(goal - nightT), dt / (reduced ? 0.05 : 0.9));
  // dog
  if (dog.path.length) {
    const [tx, ty] = dog.path[0];
    const dx = tx - dog.x, dy = ty - dog.y, d = Math.hypot(dx, dy), step = dog.speed * dt;
    if (d > 0.01) dog.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const before = Math.floor(dog.dist / 8);
    if (d <= step) { dog.x = tx; dog.y = ty; dog.path.shift(); dog.dist += d; }
    else { dog.x += (dx / d) * step; dog.y += (dy / d) * step; dog.dist += step; }
    if (Math.floor(dog.dist / 8) !== before) Sound.play('step');
    if (!dog.path.length) { const cb = dog.onArrive; dog.onArrive = null; if (cb) cb(); }
  }
  if (run && !run.done) {
    run.t += dt;
    const secs = Math.min(300, Math.floor((run.t / run.dur) * 300));
    watchT.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    if (Math.floor(secs / 15) !== run.lastSec) { run.lastSec = Math.floor(secs / 15); Sound.play('tick'); }
  }
  dog.heart += dt; pedro.wave += dt;
  // idle life: Tofu wanders around the lawn when nobody is busy
  idleFor += dt;
  const busy = Dialog.open || Sheet.isOpen || Prices.isOpen || run || dog.path.length || OG;
  if (!busy && !dog.atBeach && idleFor > 3.5 && hash(Math.floor(time * 2), 3, 77) < 0.15) {
    const spots = [[300, 270], [270, 290], [334, 306], [330, 250], [290, 300], [240, 300], [256, 186], [340, 196], [228, 250]];
    const s = spots[Math.floor(hash(Math.floor(time), 9) * spots.length)];
    walkTo(s, () => { dog.dir = 'down'; if (hash(Math.floor(time), 4) < 0.4) dog.heart = 0; }, 0, 34);
  }
  Object.values(buildings).forEach(b => { b.bounce += dt; b.flash = Math.max(0, b.flash - dt); });
  for (let i = ripples.length - 1; i >= 0; i--) { ripples[i].t += dt; if (ripples[i].t > 1.1) ripples.splice(i, 1); }
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t > p.life) parts.splice(i, 1); }
}

// ---------------------------------------------------------------- render
function px(c, x, y, key, pal, w = 1, h = 1) { c.fillStyle = css(key, pal); c.fillRect(Math.round(x - camX), Math.round(y - camY), w, h); }
function spr(c, pix, x, y, pal) { c.drawImage(pix.canvas(pal), Math.round(x - camX), Math.round(y - camY)); }

function bounceOffset(b) {
  const t = b.bounce;
  if (t < 0 || t > 0.62) return 0;
  if (t < 0.3) return -Math.round(Math.sin((t / 0.3) * Math.PI) * 5);
  if (t < 0.42) return 1;
  return -Math.round(Math.sin(((t - 0.42) / 0.2) * Math.PI) * 1);
}

function drawScene(c, pal) {
  const T = terrain.canvas(pal);
  c.fillStyle = css('A', pal); c.fillRect(0, 0, VW, VH);
  // beyond the world edges, repeat the outer scrub strips (never the plot)
  for (let x = -camX - 160; x > -160; x -= 160) c.drawImage(T, 0, 0, 160, H, x, -camY, 160, H);
  for (let x = W - camX; x < VW; x += 160) c.drawImage(T, W - 160, 0, 160, H, x, -camY, 160, H);
  if (camY + VH > H) { c.fillStyle = css('g', pal); c.fillRect(0, H - camY, VW, camY + VH - H); }
  c.drawImage(T, -camX, -camY);
  const isNight = pal === 'night';

  // stars
  if (isNight) {
    for (let i = 0; i < 70; i++) {
      const x = hash(i, 1, 99) * (W + 200) - 100, y = hash(i, 2, 99) * (SEA_TOP + 80) - 80;
      if (y > SEA_TOP - 4) continue;
      const tw = Math.sin(time * (1 + hash(i, 3) * 2) + i) > -0.3;
      if (!tw) continue;
      px(c, x, y, '*', pal);
      if (i % 9 === 0) { px(c, x - 1, y, 'y', pal); px(c, x + 1, y, 'y', pal); px(c, x, y - 1, 'y', pal); px(c, x, y + 1, 'y', pal); }
    }
  }
  // sun / moon, clipped at the horizon
  c.save(); c.beginPath(); c.rect(0, 0, VW, SEA_TOP - camY); c.clip();
  if (!isNight) spr(c, sunPix, SUN[0] - 6, SUN[1] - 6 + nightT * 56, pal);
  else spr(c, moonPix, MOON[0] - 6, MOON[1] - 6 + (1 - nightT) * 56, pal);
  c.restore();
  // sea life: sparkles, a dhow, a whale shark
  for (let i = 0; i < 26; i++) {
    const sp = 3 + hash(i, 4) * 6;
    const x = ((hash(i, 5) * (W + 300) + time * sp) % (W + 300)) - 150;
    const y = SEA_TOP + 3 + Math.floor(hash(i, 6) * 17);
    if (Math.sin(time * 1.7 + i * 2.1) < 0.1) continue;
    px(c, x, y, isNight ? 'C' : '*', pal, 2 + (i % 2), 1);
  }
  spr(c, dhowPix, ((time * 3.2 + 260) % (W + 60)) - 30, SEA_TOP + 1, pal);
  if (!isNight || true) spr(c, sharkPix, W - ((time * 5 + 80) % (W + 120)), SEA_TOP + 12, pal);

  // pool + ripples
  spr(c, poolFrames[Math.floor(time * 3.5) % 3], POOL[0], POOL[1], pal);
  ripples.forEach(r => {
    if (r.t < 0) return;
    const rad = 2 + r.t * 16;
    for (let a = 0; a < 40; a++) {
      const x = r.x + Math.cos((a / 40) * Math.PI * 2) * rad, y = r.y + Math.sin((a / 40) * Math.PI * 2) * rad * 0.45;
      if (x < POOL[0] + 3 || x > POOL[0] + 36 || y < POOL[1] + 4 || y > POOL[1] + 19) continue;
      px(c, x, y, r.t < 0.5 ? '*' : 'C', pal);
    }
  });
  // window light pools on the ground at night
  if (isNight) {
    c.fillStyle = 'rgba(255,201,92,0.16)';
    Object.values(buildings).forEach(b => b.wins.forEach(([x, y, w, h]) => c.fillRect(Math.round(b.x + x - 3 - camX), Math.round(b.y + y - 3 - camY + bounceOffset(b)), w + 6, h + 6)));
  }

  // y-sorted sprites
  const list = objects.slice();
  list.push({ kind: 'pedro', base: pedro.y }, { kind: 'dog', base: dog.y });
  list.sort((a, b) => a.base - b.base);
  for (const o of list) {
    if (o.kind === 'bld') {
      const dy = bounceOffset(o);
      spr(c, o.pix, o.x, o.y + dy, pal);
      if (o.flash > 0 && !isNight && Math.floor(o.flash * 8) % 2 === 0) {
        o.wins.forEach(([x, y, w, h]) => px(c, o.x + x, o.y + y + dy, 'x', 'night', w, h));
      }
      if (o.bounce > 0.28 && o.bounce < 0.5) { // dust puffs on landing
        for (let i = 0; i < 6; i++) px(c, o.x + 4 + i * (o.pix.w - 8) / 5, o.base - 1 - (o.bounce - 0.28) * 20, 'w', pal);
      }
    } else if (o.kind === 'palm') {
      const seq = [0, 1, 2, 1], f = seq[Math.floor(time * 2.6 + o.phase * 4) % 4];
      spr(c, o.frames[f], o.x, o.y, pal);
    } else if (o.kind === 'tree' || o.kind === 'prop') {
      spr(c, o.pix, o.x, o.y, pal);
    } else if (o.kind === 'pedro') {
      let f = pedroFrames.idle;
      if (pedro.wave < 1.8) f = Math.floor(pedro.wave * 6) % 2 ? pedroFrames.a : pedroFrames.b;
      else if ((time % 3.4) < 0.14) f = pedroFrames.blink;
      px(c, pedro.x - 6, pedro.y, 'G', pal, 12, 1);
      spr(c, f, pedro.x - 8, pedro.y - 22, pal);
      if (pedro.wave >= 1.8) { // sweeping: broom swishes left and right
        const sw = Math.floor(time * 3) % 2;
        const bx = pedro.x - 9 - sw * 3, by = pedro.y - 9;
        for (let i = 0; i < 8; i++) px(c, bx + 4 + sw * 3 - Math.round(i * (0.3 + sw * 0.25)), by + i, 'l', pal);
        const fx = bx + (sw ? 1 : 0) - 1;
        px(c, fx - 1, pedro.y - 2, 'h', pal, 5, 1); px(c, fx - 1, pedro.y - 1, 't', pal, 5, 1); px(c, fx - 2, pedro.y, 'h', pal, 6, 1);
        if (sw && Math.floor(time * 6) % 2) { px(c, fx - 4, pedro.y - 1, 'D', pal); px(c, fx - 6, pedro.y - 2, 'D', pal); }
      }
    } else if (o.kind === 'dog') {
      const moving = dog.path.length > 0;
      let f;
      if (moving) f = dogFrames[dog.dir][Math.floor(dog.dist / 5) % 2];
      else if (dog.dir === 'down') f = (time % 3) < 0.15 ? dogFrames.blink : dogFrames.down[0];
      else f = dogFrames[dog.dir][0];
      const hop = (!moving && dog.heart < 0.5) ? -Math.round(Math.sin((dog.heart / 0.5) * Math.PI) * 4) : 0;
      px(c, dog.x - 6, dog.y + 1, 'G', pal, 12, 1);
      spr(c, f, dog.x - 8, dog.y - 14 + hop, pal);
    }
  }
  // fireflies
  if (isNight) {
    for (let i = 0; i < 14; i++) {
      const x = PX0 + 10 + hash(i, 7) * (PX1 - PX0 - 20) + Math.sin(time * 0.7 + i) * 8;
      const y = 120 + hash(i, 8) * 190 + Math.cos(time * 0.9 + i * 1.7) * 6;
      if (Math.sin(time * 2.3 + i * 1.3) > 0.2) px(c, x, y, 'Z', pal);
    }
  }
  // splash droplets
  parts.forEach(p => px(c, p.x, p.y, p.c, pal));
  // heart over Tofu
  if (dog.heart < 1) {
    const hx = dog.x - 3, hy = dog.y - 22 - dog.heart * 8;
    ['.p.p.', 'ppppp', '.ppp.', '..p..'].forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === 'p') px(c, hx + i, hy + j, i === 1 && j === 1 ? '*' : 'p', pal); });
  }
  // RPG target marker
  if (marker && buildings[marker]) {
    const [mx, my] = buildings[marker].plate, bob = Math.floor(time * 4) % 2;
    ['kkkkkkk', 'kmmmmmk', '.kmmmk.', '..kmk..', '...k...'].forEach((row, j) => { for (let i = 0; i < 7; i++) if (row[i] !== '.') px(c, mx - 3 + i, my - 17 + j + bob, row[i], pal); });
  }
  if (DEBUG) { c.fillStyle = 'rgba(255,0,0,.25)'; for (let i = 0; i < grid.length; i++) if (grid[i]) c.fillRect((i % GW) * CELL - camX, ((i / GW) | 0) * CELL - camY, CELL - 1, CELL - 1); }
}

function render() {
  const a = Math.round(nightT * 5) / 5;
  if (a < 1) drawScene(vctx, 'day');
  if (a > 0) {
    drawScene(nctx, 'night');
    vctx.globalAlpha = a; vctx.drawImage(nview, 0, 0); vctx.globalAlpha = 1;
  }
  ctx.drawImage(view, 0, 0, VW * S, VH * S);
  placeTags(true);
}

// ---------------------------------------------------------------- boot
initUI((id) => act(id));
paintIcon($('ico-night'), SP.ICON_MOON);
paintIcon($('ico-sound'), SP.ICON_SOUND_OFF);
paintIcon($('ico-coin'), SP.ICON_COIN);
paintIcon($('ico-watch'), SP.ICON_WATCH);
layout();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
if (params.has('night')) { night = true; nightT = 1; setNight(true); }
setTimeout(() => { if (!hintGone) pedro.wave = 0; }, 1200);

let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000); last = now;
  while (acc >= STEP) { update(STEP); acc -= STEP; }
  render();
  if (!window.__ready) window.__ready = Math.round(performance.now());
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// test hook for headless screenshots: ?go=top|mid|down|big|pool|beach|pedro|prices
if (params.get('go')) setTimeout(() => { const g = params.get('go'); if (g === 'prices') Prices.open(); else act(g); }, 300);
