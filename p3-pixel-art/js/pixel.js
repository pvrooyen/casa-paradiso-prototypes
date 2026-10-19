// Tiny indexed-colour pixel engine. Everything is drawn into palette-index
// buffers, then baked to canvases once per palette (day / night). The night
// look is a true palette swap, so windows glow by changing one entry.

// Palette keys (one character each). '.' means transparent in matrices.
const DAY = {
  k: '#2B1D1A', // ink
  '*': '#FFFDF5', // white highlight
  w: '#F4F1EA', // white walls
  W: '#D8CBB4', // wall shade
  t: '#C9A96E', // thatch straw
  T: '#E8D29C', // thatch light
  h: '#9C7642', // thatch dark
  l: '#8B5A2B', // log timber
  L: '#5E3A1C', // timber dark
  o: '#8E4A3A', // red oxide
  p: '#E8407A', // bougainvillea
  P: '#A8305E', // bougainvillea dark
  c: '#2FA7C9', // pool blue
  C: '#9FE3EF', // pool light
  s: '#9FC5D6', // sea haze
  S: '#5E9FC2', // sea
  A: '#A9D3EC', // upper sky
  y: '#CFE6F2', // sky
  g: '#6E8F4E', // dune green
  G: '#3F5E33', // green dark
  e: '#9DB86A', // grass light
  d: '#EBD8A8', // sand
  D: '#CFB680', // sand shade
  n: '#8A5638', // skin
  r: '#D23C3C', // bandana red
  u: '#E0AD62', // dog sandy
  x: '#4A6676', // window glass (glows at night)
  m: '#FFE27A', // sun
  Z: '#7A6A50', // lamp bulbs (lit at night)
  // Pedro's letters reuse the palette:
  Q: '#2FA7C9', q: '#1F7A99', v: '#9FE3EF', Y: '#CFB680', b: '#5E3A1C', U: '#9C7642',
};

const NIGHT_OVERRIDE = {
  x: '#FFC95C', m: '#F2EBCB', Z: '#FFD36A', '*': '#D8E0F8',
  c: '#1C6F92', C: '#62C9E0', A: '#141A3C', y: '#25315E', p: '#8A3D6E',
};

function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function toNight([r, g, b]) {
  // Moonlit blue: darken, cool, keep a little warmth in light tones.
  return [Math.round(r * 0.30 + 16), Math.round(g * 0.36 + 22), Math.round(b * 0.52 + 54)];
}

export const KEYS = Object.keys(DAY);
export const IDX = {}; KEYS.forEach((k, i) => { IDX[k] = i + 1; });
export const PALS = {
  day: [null, ...KEYS.map(k => hex(DAY[k]))],
  night: [null, ...KEYS.map(k => NIGHT_OVERRIDE[k] ? hex(NIGHT_OVERRIDE[k]) : toNight(hex(DAY[k])))],
};
export function css(key, pal = 'day') { const c = PALS[pal][IDX[key]]; return `rgb(${c[0]},${c[1]},${c[2]})`; }

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

// Deterministic hash noise 0..1
export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); this._c = {}; }
  set(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || c === '.' || c == null) return;
    this.d[y * this.w + x] = c === 0 ? 0 : IDX[c];
  }
  clear(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = 0; }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? 0 : this.d[y * this.w + x]; }
  is(x, y, c) { return this.get(x, y) === IDX[c]; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  hline(x0, x1, y, c) { for (let x = x0; x <= x1; x++) this.set(x, y, c); }
  vline(x, y0, y1, c) { for (let y = y0; y <= y1; y++) this.set(x, y, c); }
  // Ordered dither between c1 and c2; amount 0..16 = share of c2.
  dith(x, y, w, h, c1, c2, amount) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, bayer(x + i, y + j) < amount ? c2 : c1);
  }
  // Vertical gradient dither from c1 (top) to c2 (bottom).
  vgrad(x, y, w, h, c1, c2) {
    for (let j = 0; j < h; j++) { const a = Math.round((j / Math.max(1, h - 1)) * 16); for (let i = 0; i < w; i++) this.set(x + i, y + j, bayer(x + i, y + j) < a ? c2 : c1); }
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) this.set(cx + x, cy + y, c);
  }
  line(x0, y0, x1, y1, c) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  // Draw a matrix of key characters. flip mirrors horizontally.
  mat(rows, x, y, flip = false) {
    const w = rows[0].length;
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== '.' && ch !== ' ') this.set(x + (flip ? w - 1 - i : i), y + j, ch); } });
  }
  // Copy non-transparent pixels from another Pix.
  blit(src, x, y) {
    for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) { const v = src.d[j * src.w + i]; if (v) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < this.w && Y < this.h) this.d[Y * this.w + X] = v; } }
  }
  // Add a 1px dark outline around opaque pixels (for sprites).
  outline(c = 'k') {
    const o = IDX[c], src = this.d.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (src[y * this.w + x]) continue;
      const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && src[yy * this.w + xx] && src[yy * this.w + xx] !== o;
      if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) this.d[y * this.w + x] = o;
    }
  }
  canvas(pal = 'day') {
    if (this._c[pal]) return this._c[pal];
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h;
    const cx = cv.getContext('2d'); const img = cx.createImageData(this.w, this.h); const P = PALS[pal];
    for (let i = 0; i < this.d.length; i++) { const v = this.d[i]; if (!v) continue; const c = P[v]; img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255; }
    cx.putImageData(img, 0, 0); this._c[pal] = cv; return cv;
  }
  static from(rows, flip = false) { const p = new Pix(rows[0].length, rows.length); p.mat(rows, 0, 0, flip); return p; }
}

// Paint a matrix straight onto a small UI canvas (icons, dialog faces).
export function paintIcon(canvas, rows, pal = 'day') {
  const p = Pix.from(rows); const cx = canvas.getContext('2d');
  cx.clearRect(0, 0, canvas.width, canvas.height); cx.imageSmoothingEnabled = false;
  cx.drawImage(p.canvas(pal), Math.floor((canvas.width - p.w) / 2), Math.floor((canvas.height - p.h) / 2));
}
