// Builds the Casa Paradiso map: static terrain, buildings, trees and the walk grid.
// World is 560x400 native pixels. Screen up = up the slope, toward the sea.
import { Pix, hash, bayer } from './pixel.js';

export const W = 560, H = 400;
export const SEA_TOP = 64, BEACH_TOP = 86, DUNE_TOP = 96, FENCE_TOP = 112, FENCE_BOT = 322;
export const PX0 = 188, PX1 = 372, LANE_TOP = 325, LANE_BOT = 343;
export const GATE = [344, 362];
export const BEACH_GAP = [362, 371];

// ---------- buildings ----------
function thatch(p, x0, y0, ridgeL, ridgeR, rows, grow, seed) {
  for (let j = 0; j < rows; j++) {
    const l = Math.round(ridgeL - j * grow), r = Math.round(ridgeR + j * grow);
    for (let x = l; x <= r; x++) {
      let c = 't';
      const n = hash(x, j, seed);
      if (j % 3 === 2 && n < 0.7) c = 'h';
      else if (x < l + 2 || j < 2) c = 'h';
      else if (x > r - 2) c = 'h';
      else if ((x - l) < (r - l) * 0.45 && n < 0.35) c = 'T';
      else if (n > 0.93) c = 'T';
      p.set(x0 + x, y0 + j, c);
    }
  }
  // eave fringe
  const l = Math.round(ridgeL - rows * grow), r = Math.round(ridgeR + rows * grow);
  for (let x = l; x <= r; x++) { p.set(x0 + x, y0 + rows, (x & 1) ? 'h' : 't'); p.set(x0 + x, y0 + rows + 1, (x % 3 === 0) ? 'h' : 'L'); }
  // ridge cap
  for (let x = ridgeL; x <= ridgeR; x++) { p.set(x0 + x, y0, 'L'); p.set(x0 + x, y0 + 1, 'h'); }
}
function windowAt(p, x, y, w, h, list) {
  p.rect(x - 1, y - 1, w + 2, h + 2, 'l');
  p.rect(x, y, w, h, 'x');
  if (w >= 4) p.vline(x + (w >> 1), y, y + h - 1, 'l');
  p.set(x, y, '*');
  list.push([x, y, w, h]);
}
function bougainvillea(p, cx, cy, rx, ry, seed) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    if (d > 1 + hash(x, y, seed) * 0.5) continue;
    const n = hash(x + 3, y + 7, seed);
    p.set(cx + x, cy + y, n < 0.18 ? 'g' : n < 0.55 ? 'p' : n < 0.9 ? 'P' : '*');
  }
}

export function makeCottage(seed) {
  const p = new Pix(46, 49), o = 1, wins = [];
  thatch(p, o, o, 12, 31, 17, 0.72, seed);
  // walls
  p.rect(o + 4, o + 19, 27, 16, 'w');
  p.rect(o + 27, o + 19, 3, 16, 'W');
  p.hline(o + 4, o + 30, o + 19, 'W');
  windowAt(p, o + 8, o + 23, 5, 5, wins);
  // door
  p.rect(o + 17, o + 22, 7, 13, 'L'); p.rect(o + 18, o + 23, 5, 12, 'l'); p.set(o + 22, o + 29, 'm');
  // covered deck (east side)
  p.dith(o + 31, o + 19, 12, 12, 'L', 'l', 5);
  p.rect(o + 31, o + 31, 12, 4, 'l');
  for (let x = o + 31; x < o + 43; x += 3) p.vline(x, o + 31, o + 34, 'L');
  p.vline(o + 31, o + 19, o + 35, 'L'); p.vline(o + 42, o + 19, o + 35, 'L');
  p.hline(o + 31, o + 42, o + 28, 'l');
  for (let x = o + 33; x < o + 42; x += 2) p.vline(x, o + 29, o + 30, 'l');
  // hammock
  [[33, 22], [34, 23], [35, 24], [36, 25], [37, 25], [38, 24], [39, 23], [40, 22]].forEach(([x, y], i) => { p.set(o + x, o + y, i & 1 ? 'r' : 'T'); p.set(o + x, o + y + 1, 'h'); });
  // floor beam and stilts
  p.hline(o + 4, o + 42, o + 35, 'L');
  p.dith(o + 5, o + 36, 37, 7, 'G', 'L', 6);
  [5, 12, 19, 26, 33].forEach(x => { p.vline(o + x, o + 36, o + 42, 'l'); p.vline(o + x + 1, o + 36, o + 42, 'L'); });
  // stairs from the deck
  for (let i = 0; i < 5; i++) { p.hline(o + 36, o + 42, o + 36 + i * 2, 'T'); p.hline(o + 36, o + 42, o + 37 + i * 2, 'l'); }
  p.vline(o + 35, o + 36, o + 45, 'L'); p.vline(o + 43, o + 36, o + 45, 'L');
  bougainvillea(p, o + 5, o + 31, 4, 5, seed);
  p.outline('k');
  return { pix: p, wins, stairs: [o + 39, o + 46] };
}

export function makeBigHouse() {
  const p = new Pix(84, 78), o = 1, wins = [];
  thatch(p, o, o, 24, 57, 24, 1, 9);
  // loft dormer
  p.rect(o + 35, o + 8, 12, 8, 'h'); p.rect(o + 36, o + 9, 10, 6, 'L');
  windowAt(p, o + 38, o + 10, 6, 4, wins);
  // walls
  p.rect(o + 6, o + 26, 70, 13, 'w'); p.rect(o + 70, o + 26, 6, 13, 'W'); p.hline(o + 6, o + 75, o + 26, 'W');
  windowAt(p, o + 11, o + 29, 7, 6, wins);
  windowAt(p, o + 59, o + 29, 7, 6, wins);
  // big glass doors to the living room
  p.rect(o + 26, o + 28, 26, 11, 'l');
  for (let i = 0; i < 4; i++) { p.rect(o + 27 + i * 6, o + 29, 5, 10, 'x'); p.set(o + 27 + i * 6, o + 29, '*'); }
  wins.push([o + 27, o + 29, 23, 10]);
  // deck floor
  p.rect(o + 2, o + 39, 78, 5, 'l');
  for (let x = o + 3; x < o + 80; x += 4) p.vline(x, o + 39, o + 43, 'L');
  p.hline(o + 2, o + 79, o + 44, 'L');
  // log-pole railing with stair opening
  for (let x = o + 2; x <= o + 79; x++) if (x < o + 23 || x > o + 32) { p.set(x, o + 35, 'l'); p.set(x, o + 36, 'L'); if (x % 3 === 0) { p.set(x, o + 37, 'l'); p.set(x, o + 38, 'l'); } }
  // under-deck shade and log stilts
  p.dith(o + 3, o + 45, 76, 10, 'G', 'L', 7);
  [3, 15, 41, 55, 67, 78].forEach(x => { p.vline(o + x, o + 26, o + 55, 'l'); p.vline(o + x + 1, o + 26, o + 55, 'L'); });
  // log staircase down to the garden
  for (let i = 0; i < 9; i++) { p.hline(o + 23, o + 32, o + 45 + i * 3, 'T'); p.hline(o + 23, o + 32, o + 46 + i * 3, 'l'); p.hline(o + 23, o + 32, o + 47 + i * 3, 'L'); }
  p.vline(o + 22, o + 36, o + 73, 'L'); p.vline(o + 33, o + 36, o + 73, 'L');
  p.set(o + 22, o + 35, 'h'); p.set(o + 33, o + 35, 'h');
  bougainvillea(p, o + 74, o + 50, 6, 5, 4);
  p.outline('k');
  return { pix: p, wins, stairs: [o + 28, o + 75] };
}

export function makeLapa() {
  const p = new Pix(34, 31), o = 1, wins = [];
  const cx = o + 15;
  for (let y = 0; y < 17; y++) {
    const hw = Math.min(15, Math.round(1 + y * 0.95));
    for (let x = -hw; x <= hw; x++) {
      const n = hash(x, y, 5);
      // radiating straw lines from the apex
      const ray = Math.abs((x * 7) / (y + 1)) % 3 < 0.6;
      p.set(cx + x, o + y, ray ? 'h' : (x < 0 && n < 0.4) ? 'T' : 't');
    }
  }
  for (let x = -15; x <= 15; x++) { p.set(cx + x, o + 17, 'h'); p.set(cx + x, o + 18, (x % 3 === 0) ? 'Z' : 'L'); }
  // poles
  [-12, 0, 12].forEach(x => p.vline(cx + x, o + 19, o + 28, 'L'));
  // bar counter
  p.rect(cx - 10, o + 21, 21, 2, 'T'); p.rect(cx - 10, o + 23, 21, 4, 'l');
  for (let x = cx - 9; x < cx + 11; x += 3) p.vline(x, o + 23, o + 26, 'L');
  [['x', -7], ['*', -5], ['o', -3], ['x', 4], ['m', 7]].forEach(([c, x]) => { p.set(cx + x, o + 20, c); p.set(cx + x, o + 19, 'k'); });
  [-8, -3, 2, 7].forEach(x => { p.set(cx + x, o + 28, 'o'); p.vline(cx + x, o + 29, o + 29, 'L'); });
  p.outline('k');
  wins.push([cx - 9, o + 19, 18, 2]);
  return { pix: p, wins };
}

// Coconut palm: 3 sway frames
export function makePalm(height, frame, flip = false) {
  const w = 36, h = height + 16, p = new Pix(w, h);
  const bx = 18, by = h - 2, lean = flip ? -4 : 4;
  let tx = bx, ty = by;
  for (let i = 0; i <= height; i++) {
    const t = i / height;
    tx = Math.round(bx + lean * t * t); ty = by - i;
    const ring = i % 3 === 0;
    p.set(tx - 1, ty, ring ? 'h' : 'l'); p.set(tx, ty, ring ? 'h' : 'l'); p.set(tx + 1, ty, 'L');
  }
  const cx = tx, cy = ty;
  const sway = frame - 1;
  const leaves = [[-1, -0.15, 15, 0.45], [-0.75, -0.8, 11, 0.5], [0.1, -1, 8, 0.7], [0.8, -0.7, 11, 0.5], [1, -0.1, 15, 0.45], [-0.9, 0.45, 10, 0.25], [0.9, 0.5, 10, 0.25]];
  leaves.forEach(([dx, dy, len, droop], li) => {
    const m = Math.hypot(dx, dy); dx /= m; dy /= m;
    for (let i = 1; i <= len; i++) {
      const t = i / len;
      const x = Math.round(cx + dx * i + sway * t * t * 1.6);
      const y = Math.round(cy + dy * i + droop * i * i / len + sway * t * t * (li & 1 ? 1 : -0.6));
      p.set(x, y, 'g');
      if (i < len - 1) p.set(x, y + 1, 'G');
      if (i > 2 && i % 2 === 0 && i < len) { p.set(x, y + 2, 'G'); p.set(x - Math.sign(dx || 1), y + 2, 'g'); }
      if (i < len * 0.6) p.set(x, y - 1, 'e');
    }
  });
  p.set(cx - 1, cy + 1, 'L'); p.set(cx, cy + 2, 'h'); p.set(cx + 1, cy + 1, 'L'); p.set(cx, cy, 'g');
  p.outline('G');
  return p;
}

export function makeCasuarina(height, seed) {
  const w = 15, p = new Pix(w, height);
  const cx = 7;
  p.vline(cx, height - 6, height - 1, 'L');
  for (let y = 1; y < height - 5; y++) {
    const t = y / (height - 5);
    const hw = Math.round(1 + t * 5.5 + Math.sin(y * 1.3) * 0.8);
    for (let x = -hw; x <= hw; x++) {
      const n = hash(x, y, seed);
      if (Math.abs(x) === hw && n < 0.5) continue;
      p.set(cx + x, y, (y % 4 === 0 && n < 0.6) ? 'G' : (x > 0 ? (n < 0.6 ? 'G' : 'g') : (n < 0.3 ? 'e' : 'g')));
    }
  }
  p.outline('k');
  return p;
}

export function makePool(frame) {
  const p = new Pix(40, 22);
  p.rect(0, 0, 40, 22, 'w');
  p.rect(0, 20, 40, 2, 'W'); p.rect(38, 0, 2, 22, 'W');
  p.rect(2, 2, 36, 18, 'c');
  p.hline(2, 37, 2, 'q'); p.hline(2, 37, 3, 'q');
  [6, 10, 14, 17].forEach((row, r) => { for (let x = 3; x < 37; x++) if (((x + frame * 3 + r * 5) % 9) < 3) p.set(x, row, 'C'); });
  // steps and ladder
  p.rect(3, 15, 6, 2, 'C'); p.rect(3, 17, 6, 2, 'C');
  p.vline(34, 2, 6, 'W'); p.vline(36, 2, 6, 'W'); p.hline(34, 36, 4, 'W');
  p.outline('k');
  return p;
}

function makeLounger() {
  return Pix.from([
    '.kkkkkkkkkkk',
    'kwwwwwwwwwTk',
    'kwwwwwwwwTTk',
    'klllllllllLk',
    '.kL.....kL..',
  ]);
}

// ---------- terrain ----------
function grass(p, x, y, base = 'e') {
  const big = hash(x >> 3, y >> 3, 11);
  let c = base;
  if (big < 0.35 && bayer(x, y) < 3) c = base === 'e' ? 'g' : 'G';
  p.set(x, y, c);
}
function tuft(p, x, y, c = 'g') { p.set(x, y, c); p.set(x + 2, y, c); p.set(x + 1, y - 1, c); }
function bush(p, cx, cy, rx, ry, seed) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
    if (d > 1) continue;
    const n = hash(x, y, seed);
    p.set(cx + x, cy + y, y > ry * 0.3 ? 'G' : (x + y < -1 && n < 0.5) ? 'e' : n < 0.25 ? 'G' : 'g');
  }
  p.hline(cx - rx + 1, cx + rx - 1, cy + ry + 1, 'k');
}
function sandPath(p, pts, wdt = 5) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x0 + (x1 - x0) * s / steps), y = Math.round(y0 + (y1 - y0) * s / steps);
      for (let j = -wdt; j <= wdt; j++) for (let k = -wdt; k <= wdt; k++) {
        if (Math.abs(j) === wdt || Math.abs(k) === wdt) { if (bayer(x + k, y + j) < 6 && !p.is(x + k, y + j, 'd')) p.set(x + k, y + j, 'D'); }
        else p.set(x + k, y + j, hash(x + k, y + j, 3) < 0.08 ? 'D' : 'd');
      }
    }
  }
}

export function buildWorld() {
  const t = new Pix(W, H);
  // sky
  t.vgrad(0, 0, W, SEA_TOP, 'A', 'y');
  // little pixel clouds
  [[120, 26, 13], [440, 18, 10], [300, 50, 7], [40, 46, 8]].forEach(([cx, cy, r]) => {
    t.ellipse(cx, cy, r, Math.max(2, r >> 2), 'w'); t.ellipse(cx - (r >> 1), cy - 2, r >> 1, 2, 'w'); t.ellipse(cx + (r >> 2), cy - 3, r >> 1, 3, '*');
    t.hline(cx - r + 2, cx + r - 2, cy + Math.max(2, r >> 2), 'y');
  });
  // sea
  t.rect(0, SEA_TOP, W, 2, 'S');
  t.vgrad(0, SEA_TOP + 2, W, BEACH_TOP - SEA_TOP - 2, 'S', 's');
  for (let x = 0; x < W; x++) { // horizon line + foam
    t.set(x, SEA_TOP, 'q');
    const fy = BEACH_TOP + Math.round(Math.sin(x * 0.18) * 1.2);
    t.set(x, fy - 1, 'C'); t.set(x, fy, '*'); t.set(x, fy + 1, bayer(x, fy) < 8 ? '*' : 'D');
  }
  // beach
  for (let y = BEACH_TOP + 2; y < DUNE_TOP + 4; y++) for (let x = 0; x < W; x++) {
    if (t.is(x, y, '*')) continue;
    t.set(x, y, y < BEACH_TOP + 4 ? (bayer(x, y) < 9 ? 'D' : 'd') : (hash(x, y, 2) < 0.06 ? 'D' : 'd'));
  }
  // scrub everywhere below the dunes
  for (let y = DUNE_TOP + 4; y < H; y++) for (let x = 0; x < W; x++) grass(t, x, y, 'g');
  // dune band: sand fading into scrub
  for (let y = DUNE_TOP; y < FENCE_TOP + 2; y++) for (let x = 0; x < W; x++) {
    const a = Math.round(((y - DUNE_TOP) / (FENCE_TOP - DUNE_TOP)) * 16);
    if (bayer(x, y) >= a) t.set(x, y, 'd'); else grass(t, x, y, 'g');
  }
  for (let i = 0; i < 260; i++) { const x = Math.floor(hash(i, 1, 4) * W), y = DUNE_TOP + 2 + Math.floor(hash(i, 2, 4) * 14); tuft(t, x, y, hash(i, 3) < 0.5 ? 'g' : 'G'); }
  // neighbouring scrub bushes
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(hash(i, 7, 8) * W), y = FENCE_TOP + 4 + Math.floor(hash(i, 9, 8) * (H - FENCE_TOP));
    if (x > PX0 - 8 && x < PX1 + 8 && y < LANE_BOT + 6) continue;
    if (y > LANE_TOP - 6 && y < LANE_BOT + 6) continue;
    bush(t, x, y, 4 + Math.floor(hash(i, 3) * 5), 3 + Math.floor(hash(i, 4) * 2), i);
  }
  // plot interior lawn
  for (let y = FENCE_TOP + 1; y < FENCE_BOT; y++) for (let x = PX0 + 1; x < PX1; x++) grass(t, x, y, 'e');
  for (let i = 0; i < 240; i++) { const x = PX0 + 3 + Math.floor(hash(i, 5, 6) * (PX1 - PX0 - 6)), y = FENCE_TOP + 4 + Math.floor(hash(i, 6, 6) * (FENCE_BOT - FENCE_TOP - 6)); tuft(t, x, y); }
  // terrace banks: the plot steps up toward the sea
  [[FENCE_TOP + 56, PX0 + 1, 262], [FENCE_TOP + 112, PX0 + 1, 250], [FENCE_TOP + 168, PX0 + 1, 262], [192, 278, PX1 - 1]].forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) { t.set(x, y - 1, 'e'); t.set(x, y, 'G'); t.set(x, y + 1, bayer(x, y) < 10 ? 'G' : 'g'); t.set(x, y + 2, bayer(x, y + 2) < 5 ? 'G' : 'g'); }
  });
  // lane
  for (let y = LANE_TOP; y < LANE_BOT; y++) for (let x = 0; x < W; x++) {
    const edge = y < LANE_TOP + 2 || y > LANE_BOT - 3;
    t.set(x, y, edge ? (bayer(x, y) < 8 ? 'D' : 'g') : hash(x, y, 7) < 0.07 ? 'D' : 'd');
  }
  for (let x = 0; x < W; x++) { if ((x >> 2) % 5) { t.set(x, LANE_TOP + 6, 'D'); t.set(x, LANE_TOP + 12, 'D'); } }
  // parking inside the gate
  for (let y = 284; y < FENCE_BOT; y++) for (let x = 314; x < PX1; x++) if (bayer(x, y) < 13 - Math.max(0, (288 - y)) * 3) t.set(x, y, hash(x, y, 9) < 0.08 ? 'D' : 'd');
  // sand paths
  sandPath(t, [[353, 324], [353, 238], [244, 238], [244, 164], [232, 164]], 3);
  sandPath(t, [[244, 220], [238, 220]], 3);
  sandPath(t, [[244, 276], [232, 276]], 3);
  sandPath(t, [[311, 238], [311, 192]], 3);
  sandPath(t, [[353, 238], [367, 238], [367, 112], [365, 100], [367, 92]], 2);
  // fence: rail with posts
  for (let x = PX0; x <= PX1; x++) {
    if (!(x >= BEACH_GAP[0] && x <= BEACH_GAP[1])) { t.set(x, FENCE_TOP, 'l'); t.set(x, FENCE_TOP + 1, 'L'); if (x % 8 === 4) { t.set(x, FENCE_TOP - 1, 'h'); t.set(x, FENCE_TOP - 2, 'L'); } }
    if (!(x >= GATE[0] && x <= GATE[1])) { t.set(x, FENCE_BOT, 'l'); t.set(x, FENCE_BOT + 1, 'L'); if (x % 8 === 4) { t.set(x, FENCE_BOT - 1, 'h'); t.set(x, FENCE_BOT - 2, 'L'); } }
  }
  for (let y = FENCE_TOP; y <= FENCE_BOT + 1; y++) {
    [PX0, PX1].forEach(x => { t.set(x, y, 'l'); t.set(x + 1, y, 'L'); if (y % 8 === 0) { t.set(x, y, 'h'); t.set(x - 1, y, 'L'); } });
  }
  // gate posts and an open gate leaf
  [GATE[0] - 1, GATE[1] + 1].forEach(x => { t.rect(x - 1, FENCE_BOT - 5, 3, 7, 'L'); t.hline(x - 1, x + 1, FENCE_BOT - 6, 'h'); });
  t.line(GATE[1] + 2, FENCE_BOT - 2, GATE[1] + 9, FENCE_BOT + 4, 'l');
  t.line(GATE[1] + 2, FENCE_BOT - 4, GATE[1] + 9, FENCE_BOT + 2, 'l');
  [BEACH_GAP[0] - 1, BEACH_GAP[1] + 1].forEach(x => { t.rect(x, FENCE_TOP - 4, 2, 6, 'L'); t.set(x, FENCE_TOP - 5, 'h'); });
  // bougainvillea along the fences
  bougainvillea(t, PX0 + 2, 300, 4, 9, 1);
  bougainvillea(t, 300, FENCE_BOT - 1, 9, 3, 2);
  bougainvillea(t, 210, FENCE_TOP + 1, 7, 3, 3);
  bougainvillea(t, PX1 - 2, 270, 3, 7, 6);
  // loungers by the pool
  const lounger = makeLounger();
  t.blit(lounger, 253, 221); t.blit(lounger, 268, 221);
  return t;
}

// Soft dithered shadow under an object, baked into the terrain.
export function shadow(t, cx, cy, rx, ry) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if ((x * x) / (rx * rx) + (y * y) / (ry * ry) > 1) continue;
    if (bayer(cx + x, cy + y) < 9) t.set(cx + x, cy + y, 'G');
  }
}

// ---------- walk grid (4 px cells) ----------
export const CELL = 4, GW = W / CELL, GH = H / CELL;
export function makeGrid(blocks) {
  const g = new Uint8Array(GW * GH);
  const mark = (x, y, w, h, v) => {
    for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) {
      const px = cx * CELL + 2, py = cy * CELL + 2;
      if (px >= x && px < x + w && py >= y && py < y + h) g[cy * GW + cx] = v;
    }
  };
  mark(PX0 + 2, FENCE_TOP + 2, PX1 - PX0 - 3, FENCE_BOT - FENCE_TOP - 3, 1); // lawn
  mark(GATE[0], FENCE_BOT - 4, GATE[1] - GATE[0], 12, 1); // gate
  mark(120, LANE_TOP, 330, LANE_BOT - LANE_TOP, 1); // lane
  mark(BEACH_GAP[0], DUNE_TOP - 4, BEACH_GAP[1] - BEACH_GAP[0] + 1, FENCE_TOP - DUNE_TOP + 10, 1); // trail
  mark(320, BEACH_TOP + 1, 90, DUNE_TOP - BEACH_TOP + 2, 1); // beach
  blocks.forEach(b => mark(b[0], b[1], b[2], b[3], 0));
  return g;
}

// A* over 4-neighbour cells with a turn penalty, so the dog walks in long
// straight legs like a Game Boy character instead of zig-zagging.
export function findPath(g, sx, sy, tx, ty) {
  const toCell = (x, y) => [Math.max(0, Math.min(GW - 1, Math.floor(x / CELL))), Math.max(0, Math.min(GH - 1, Math.floor(y / CELL)))];
  let [ax, ay] = toCell(sx, sy); const [bx, by] = toCell(tx, ty);
  if (!g[ay * GW + ax]) { // started off-grid: snap to nearest open cell
    let best = null, bd = 1e9;
    for (let i = 0; i < g.length; i++) if (g[i]) { const x = i % GW, y = (i / GW) | 0, d = (x - ax) ** 2 + (y - ay) ** 2; if (d < bd) { bd = d; best = [x, y]; } }
    if (best) [ax, ay] = best;
  }
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const N = GW * GH * 4, cost = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1);
  const heap = [];
  const push = (s, f) => { heap.push([f, s]); let i = heap.length - 1; while (i > 0) { const q = (i - 1) >> 1; if (heap[q][0] <= heap[i][0]) break; [heap[q], heap[i]] = [heap[i], heap[q]]; i = q; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const hfn = (x, y) => Math.abs(x - bx) + Math.abs(y - by);
  for (let d = 0; d < 4; d++) { const s = (ay * GW + ax) * 4 + d; cost[s] = 0; push(s, hfn(ax, ay)); }
  let end = -1;
  while (heap.length) {
    const [, s] = pop(); const c = (s / 4) | 0, d = s % 4, x = c % GW, y = (c / GW) | 0;
    if (x === bx && y === by) { end = s; break; }
    for (let nd = 0; nd < 4; nd++) {
      const nx = x + DIRS[nd][0], ny = y + DIRS[nd][1];
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || !g[ny * GW + nx]) continue;
      const ns = (ny * GW + nx) * 4 + nd, nc = cost[s] + 1 + (nd !== d ? 3 : 0);
      if (nc < cost[ns]) { cost[ns] = nc; prev[ns] = s; push(ns, nc + hfn(nx, ny)); }
    }
  }
  if (end < 0) return [[tx, ty]];
  const cells = []; for (let s = end; s >= 0; s = prev[s]) { const c = (s / 4) | 0; cells.push([(c % GW) * CELL + 2, ((c / GW) | 0) * CELL + 2]); }
  cells.reverse();
  // keep only corners
  const pts = [];
  for (let i = 0; i < cells.length; i++) {
    if (i === 0 || i === cells.length - 1) { pts.push(cells[i]); continue; }
    const [x0, y0] = cells[i - 1], [x1, y1] = cells[i], [x2, y2] = cells[i + 1];
    if ((x1 - x0) !== (x2 - x1) || (y1 - y0) !== (y2 - y1)) pts.push(cells[i]);
  }
  pts.push([tx, ty]);
  return pts;
}
