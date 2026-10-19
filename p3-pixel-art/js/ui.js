// DOM side: RPG dialog box, photo sheet, price card, lightbox, retro sound.
import { PLACES, PHOTO_CAPTIONS, waLink } from './data.js';

const $ = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const WA_ICON = '<svg width="22" height="22" viewBox="0 0 11 11" shape-rendering="crispEdges" aria-hidden="true"><path fill="#fff" d="M3 0h5v1H3zM2 1h1v1H2zM8 1h1v1H8zM1 2h1v1H1zM9 2h1v2H9zM0 3h1v5H0zM10 4h1v3h-1zM9 7h1v1H9zM8 8h1v1H8zM1 8h1v1H1zM3 9h5v1H3zM0 9h1v2H0zM1 10h2v1H1zM3 3h1v2H3zM4 5h1v1H4zM5 6h1v1H5zM6 6h2v1H6z"/></svg>';

// ---------------- sound (off by default) ----------------
export const Sound = {
  on: false, ctx: null, waves: null,
  ensure() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  toggle() {
    this.on = !this.on;
    if (this.on) { this.ensure(); this.startWaves(); this.play('coin'); } else this.stopWaves();
    return this.on;
  },
  tone(freq, dur, type = 'square', vol = 0.05, slide = 0, delay = 0) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.08, hp = 800) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination); s.start();
  },
  play(name) {
    switch (name) {
      case 'blip': this.tone(660 + Math.random() * 80, 0.03, 'square', 0.025); break;
      case 'step': this.tone(180, 0.025, 'triangle', 0.04); break;
      case 'bounce': this.tone(260, 0.12, 'square', 0.05, 380); break;
      case 'coin': this.tone(988, 0.07, 'square', 0.05); this.tone(1319, 0.18, 'square', 0.05, 0, 0.07); break;
      case 'open': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.08, 'square', 0.04, 0, i * 0.06)); break;
      case 'splash': this.noise(0.35, 0.12, 900); break;
      case 'woof': this.tone(320, 0.08, 'sawtooth', 0.06, -140); this.tone(300, 0.1, 'sawtooth', 0.06, -150, 0.14); break;
      case 'night': [784, 659, 523, 392].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.05, 0, i * 0.07)); break;
      case 'day': [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.05, 0, i * 0.07)); break;
      case 'tick': this.tone(1500, 0.015, 'square', 0.02); break;
      case 'fanfare': [523, 659, 784, 659, 1047].forEach((f, i) => this.tone(f, 0.1, 'square', 0.045, 0, i * 0.09)); break;
    }
  },
  // Soft surf: filtered noise with a slow swell.
  startWaves() {
    const c = this.ctx; if (!c || this.waves) return;
    const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const s = c.createBufferSource(); s.buffer = b; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
    const g = c.createGain(); g.gain.value = 0.05;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 0.04;
    lfo.connect(lg).connect(g.gain);
    s.connect(f).connect(g).connect(c.destination); s.start(); lfo.start();
    this.waves = { s, lfo };
  },
  stopWaves() { if (this.waves) { try { this.waves.s.stop(); this.waves.lfo.stop(); } catch (e) { /* already stopped */ } this.waves = null; } },
};

// ---------------- RPG dialog box with typewriter ----------------
export const Dialog = {
  el: $('dlg'), name: $('dlg-name'), text: $('dlg-text'), next: $('dlg-next'), face: $('dlg-face'),
  timer: 0, full: '', shown: 0, typing: false, onDone: null, auto: 0, open: false,
  init() {
    this.el.addEventListener('click', (e) => { e.stopPropagation(); this.advance(); });
    this.el.tabIndex = 0;
    this.el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.advance(); } });
  },
  say({ name, text, face = null, faceDraw = null, then = null, autoMs = 0 }) {
    clearInterval(this.timer); clearTimeout(this.auto);
    this.el.hidden = false; this.open = true;
    this.el.classList.toggle('noface', !face);
    if (face && faceDraw) faceDraw(this.face);
    this.name.textContent = name;
    this.full = text; this.shown = 0; this.onDone = then; this.autoMs = autoMs;
    this.next.classList.add('off');
    if (reduced) { this.finish(); return; }
    this.typing = true; this.text.textContent = '';
    this.timer = setInterval(() => {
      this.shown += 1;
      this.text.textContent = this.full.slice(0, this.shown);
      if (this.shown % 2 === 0 && this.full[this.shown - 1] !== ' ') Sound.play('blip');
      if (this.shown >= this.full.length) this.finish();
    }, 26);
  },
  finish() {
    clearInterval(this.timer); this.typing = false;
    this.text.textContent = this.full;
    this.next.classList.remove('off');
    if (this.autoMs) this.auto = setTimeout(() => this.advance(), this.autoMs);
  },
  advance() {
    if (this.typing) { this.finish(); return; }
    clearTimeout(this.auto);
    const cb = this.onDone; this.close();
    if (cb) cb();
  },
  close() { clearInterval(this.timer); clearTimeout(this.auto); this.el.hidden = true; this.open = false; this.onDone = null; },
};

// ---------------- Lightbox ----------------
const Lightbox = {
  list: [], i: 0,
  init() {
    $('lb-x').onclick = () => this.close();
    $('lb-prev').onclick = () => this.show(this.i - 1);
    $('lb-next').onclick = () => this.show(this.i + 1);
    $('lb').addEventListener('click', (e) => { if (e.target.id === 'lb') this.close(); });
  },
  open(list, i) { this.list = list; $('lb').hidden = false; this.show(i); $('lb-x').focus(); },
  show(i) {
    this.i = (i + this.list.length) % this.list.length;
    const id = this.list[this.i];
    $('lb-img').src = `photos/${id}.webp`; $('lb-img').alt = PHOTO_CAPTIONS[id] || '';
    $('lb-cap').textContent = PHOTO_CAPTIONS[id] || '';
    $('lb-prev').hidden = $('lb-next').hidden = this.list.length < 2;
  },
  close() { $('lb').hidden = true; $('lb-img').removeAttribute('src'); },
  get isOpen() { return !$('lb').hidden; },
};

// ---------------- Photo sheet ----------------
export const Sheet = {
  el: $('sheet'), card: $('sheet-card'), isOpen: false, lastFocus: null,
  init() {
    $('sheet-close').onclick = () => this.close();
    $('scrim').onclick = () => { this.close(); Prices.close(); };
  },
  open(id) {
    const p = PLACES[id]; if (!p) return;
    this.lastFocus = document.activeElement;
    $('sheet-title').textContent = p.name;
    $('sheet-facts').textContent = p.facts;
    $('sheet-price').innerHTML = p.zar ? `<strong>${p.zar}</strong><span>${p.usd}</span>` : '';
    $('sheet-note').textContent = p.note || '';
    const box = $('sheet-photos'); box.innerHTML = '';
    p.photos.forEach((ph, i) => {
      const f = document.createElement('figure');
      const img = document.createElement('img');
      img.loading = 'lazy'; img.decoding = 'async';
      img.src = i === 0 ? `photos/${ph}.webp` : `photos/${ph}-thumb.webp`;
      if (i === 0) { img.srcset = `photos/${ph}-thumb.webp 480w, photos/${ph}.webp 1600w`; img.sizes = '(min-width: 680px) 600px, 100vw'; }
      img.alt = PHOTO_CAPTIONS[ph] || '';
      const cap = document.createElement('figcaption'); cap.textContent = PHOTO_CAPTIONS[ph] || '';
      f.append(img, cap);
      f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Enlarge photo: ' + (PHOTO_CAPTIONS[ph] || ''));
      const go = () => Lightbox.open(p.photos, i);
      f.addEventListener('click', go);
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      box.append(f);
    });
    if (p.soon) { const s = document.createElement('p'); s.className = 'soon'; s.textContent = p.soon; box.append(s); }
    const wa = $('sheet-wa');
    wa.href = waLink(p.about);
    wa.innerHTML = `${WA_ICON}<span>Ask Pierre about ${id === 'beach' || id === 'pool' ? 'the whole estate' : p.name}</span>`;
    if (id === 'beach' || id === 'pool') wa.href = waLink('the whole estate');
    this.card.scrollTop = 0;
    this.el.classList.add('open'); this.el.setAttribute('aria-hidden', 'false');
    $('scrim').classList.add('on');
    this.isOpen = true;
    Sound.play('open');
    setTimeout(() => this.card.focus({ preventScroll: true }), 50);
  },
  close() {
    if (!this.isOpen) return;
    this.el.classList.remove('open'); this.el.setAttribute('aria-hidden', 'true');
    if (!Prices.isOpen || Prices.docked) $('scrim').classList.remove('on');
    this.isOpen = false;
    if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus({ preventScroll: true });
  },
};

// ---------------- Price card ----------------
export const Prices = {
  el: $('prices'), isOpen: false, docked: false, onGo: null,
  init(onGo) {
    this.onGo = onGo;
    $('prices-wa').href = waLink('the whole estate');
    $('prices-wa').innerHTML = `${WA_ICON}<span>Chat with Pierre on WhatsApp</span>`;
    $('prices-x').onclick = () => this.close();
    this.el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { if (!this.docked) this.close(); this.onGo(b.dataset.go); }));
    const mq = matchMedia('(min-width: 980px)');
    const apply = () => {
      this.docked = mq.matches && !document.body.classList.contains('og');
      this.el.classList.toggle('dock', this.docked);
      if (this.docked) { this.el.hidden = false; this.isOpen = false; if (!Sheet.isOpen) $('scrim').classList.remove('on'); }
      else if (!this.isOpen) this.el.hidden = true;
    };
    mq.addEventListener('change', apply); apply();
  },
  open() {
    if (this.docked) { // flash the docked card
      this.el.animate([{ transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }], { duration: 240, easing: 'steps(3)' });
      Sound.play('coin'); return;
    }
    Sheet.close();
    this.el.hidden = false; this.isOpen = true; $('scrim').classList.add('on');
    Sound.play('coin');
    $('prices-x').focus();
  },
  close() { if (this.docked || !this.isOpen) return; this.el.hidden = true; this.isOpen = false; if (!Sheet.isOpen) $('scrim').classList.remove('on'); },
};

export function initUI(onGo) {
  Dialog.init(); Lightbox.init(); Sheet.init(); Prices.init(onGo);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (Lightbox.isOpen) Lightbox.close();
    else if (Sheet.isOpen) Sheet.close();
    else if (Prices.isOpen) Prices.close();
    else if (Dialog.open) Dialog.close();
  });
}
