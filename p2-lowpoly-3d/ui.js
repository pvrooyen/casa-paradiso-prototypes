// UI layer: data, photo sheets, price card, stopwatch, sound, day/night button.
// Works without three.js so the fallback (no WebGL) still sells the house.

export const bus = new EventTarget();
const $ = (s, r = document) => r.querySelector(s);

const PHONE = '27849781078';
export const waLink = (what) =>
  `https://wa.me/${PHONE}?text=` +
  encodeURIComponent(`Hi Pierre, I'm looking at Casa Paradiso. I'd like to know more about ${what}.`);

// Photo captions come from shared/photos/photos.json
const PH = {
  'bh-exterior-stairs': ['Big house exterior with log staircase and thatch roof', 1600, 1200],
  'bh-deck-dining': ['Covered deck with dining table under the thatch', 1600, 1200],
  'bh-deck-lounge': ['Deck lounge corner looking out over the garden', 1600, 1200],
  'bh-living': ['Open-plan living room with sofas and bar', 1600, 1200],
  'bh-kitchen': ['Kitchen with breakfast bar and stools', 1600, 1200],
  'bh-bedroom-net': ['Main bedroom with mosquito net and dark wood cupboards', 1600, 1200],
  'bh-bathroom': ['Tiled shower bathroom', 1200, 1600],
  'bh-lapa-bar': ['Thatched lapa with bar and seating', 1600, 1200],
  'sh-deck-view': ['Cottage deck with view over the trees to the dune', 1600, 1200],
  'sh-deck-hammock': ['Cottage deck with hammock', 1600, 1200],
  'sh-stairs-exterior': ['Cottage on stilts with its stairs and deck', 1600, 1200],
  'sh-living': ['Cottage open-plan living room', 1600, 1291],
  'sh-kitchen': ['Cottage kitchen with fridge and breakfast bar', 1600, 1200],
  'sh-bedroom': ['Cottage four-poster bed with net', 1600, 1200],
  'sh-bathroom': ['Cottage en-suite shower', 1600, 1200],
  'sh-deck-bougainvillea': ['Cottage deck with bougainvillea, thatch roofs and sea haze beyond', 1600, 1200],
  'pool-palms': ['Splash pool under the palms with hill view', 1600, 1200],
  'pool-loungers': ['Pool with loungers in the shade', 1600, 1200],
  'area-aerial-map': ['Aerial map: road in from Inhambane, Tofinho beach, Casa Paradiso at the end of the lane', 1104, 736],
};

const COTTAGE_LINE = '1 bedroom, 1 en-suite bathroom, about 70 m², large covered deck';
const COTTAGE_MORE = 'Open-plan kitchen and living room, a hammock on the deck, its own small garden and its own gate. On Airbnb as “Cozy Cabin with Ocean Views in Tranquil Tofinho”: rated 5.0, Superhost.';

export const UNITS = {
  big: {
    title: 'Big house', what: 'the big house', price: 'ZAR 2.2M', usd: 'USD 134k',
    line: '4 bedrooms, 3 bathrooms (2 en-suite), loft room, sleeps 8',
    more: 'Open-plan kitchen, dining and living room with TV. Large covered deck under the thatch roof, up a log staircase. Lapa with bar next door. Pierre and Elvera live here now.',
    photos: ['bh-exterior-stairs', 'bh-deck-dining', 'bh-living', 'bh-kitchen', 'bh-bedroom-net', 'bh-bathroom', 'bh-lapa-bar', 'bh-deck-lounge'],
  },
  top: {
    title: 'Cottage Top', what: 'Cottage Top', price: 'ZAR 800k', usd: 'USD 49k',
    line: COTTAGE_LINE, lead: 'Highest of the three cottages, with the best view.', more: COTTAGE_MORE,
    photos: ['sh-deck-view', 'sh-deck-hammock', 'sh-living', 'sh-kitchen', 'sh-bedroom', 'sh-bathroom'],
  },
  middle: {
    title: 'Cottage Middle', what: 'Cottage Middle', price: 'ZAR 750k', usd: 'USD 46k',
    line: COTTAGE_LINE, lead: 'The middle step of the three cottages.', more: COTTAGE_MORE,
    photos: ['sh-deck-hammock', 'sh-deck-bougainvillea', 'sh-living', 'sh-kitchen', 'sh-bedroom', 'sh-bathroom'],
  },
  down: {
    title: 'Cottage Down', what: 'Cottage Down', price: 'ZAR 700k', usd: 'USD 43k',
    line: COTTAGE_LINE, lead: 'Nearest the gate and the parking.', more: COTTAGE_MORE,
    photos: ['sh-stairs-exterior', 'sh-deck-bougainvillea', 'sh-living', 'sh-kitchen', 'sh-bedroom', 'sh-bathroom'],
  },
  pool: {
    title: 'Shared splash pool', what: 'the pool', line: 'Shared splash pool, borehole-fed',
    more: 'It sits between the big house and the cottages, with loungers under the palms.',
    photos: ['pool-palms', 'pool-loungers'],
  },
  beach: {
    title: '5 minutes to Tofinho beach', what: 'the walk to the beach',
    line: 'Out of the east gate, along the path through the dune bush and coconut palms.',
    more: 'The plot is not on the beach. What you get instead is the view, the breeze, the quiet and the price.',
    note: 'Beach photo coming. Here is the aerial map for now.',
    photos: ['area-aerial-map'],
  },
};

const WA_ICON = $('#waEstate svg').outerHTML;

// ---------- sheets ----------
const veil = $('#veil');
const sheet = $('#sheet');
const prices = $('#prices');
const body = $('#sheetBody');
let openSheet = null;
let lastFocus = null;

function figure(id, i) {
  const [cap, w, h] = PH[id];
  const fit = w < h ? 'contain' : 'cover';
  return `<figure><button type="button" data-photo="${id}" aria-label="Open photo: ${cap}">
    <img loading="lazy" decoding="async" alt="${cap}" style="object-fit:${fit}"
      src="photos/${id}-thumb.webp" srcset="photos/${id}-thumb.webp 480w, photos/${id}.webp ${w}w"
      sizes="(min-width:760px) 330px, 82vw" ${i === 0 ? 'fetchpriority="high"' : ''}></button>
    <figcaption>${cap}</figcaption></figure>`;
}

function renderUnit(key) {
  const u = UNITS[key];
  const isHouse = !!u.price;
  body.innerHTML = `
    <h2 id="sheetTitle">${u.title}</h2>
    ${u.lead ? `<p class="more" style="margin-bottom:6px">${u.lead}</p>` : ''}
    <p class="line">${u.line}</p>
    ${isHouse ? `<div class="cost"><strong>${u.price}</strong><span>${u.usd}</span></div>` : ''}
    ${u.note ? `<p class="note">${u.note}</p>` : ''}
    <div class="strip">${u.photos.map(figure).join('')}</div>
    <p class="more">${u.more}</p>
    ${isHouse ? `<p class="bundle">Or take all four houses as one estate: <b>ZAR 4.0M</b> (USD 243k).</p>` : ''}
    <div class="actions">
      <a class="toy wa" target="_blank" rel="noopener" href="${waLink(u.what)}">${WA_ICON}${isHouse ? `Ask Pierre about ${u.title === 'Big house' ? 'the big house' : u.title}` : 'Chat with Pierre on WhatsApp'}</a>
      <button class="linkish" data-open="prices" type="button">See all prices</button>
    </div>`;
}

export function open(key) {
  close(true);
  lastFocus = document.activeElement;
  let el;
  if (key === 'prices') el = prices;
  else { renderUnit(key); el = sheet; }
  sheet.scrollTop = 0;
  el.classList.add('on');
  veil.classList.add('on');
  openSheet = el;
  setTimeout(() => el.querySelector('.x').focus({ preventScroll: true }), 60);
  bus.dispatchEvent(new CustomEvent('sheet', { detail: { open: true, key } }));
}

export function close(silent) {
  if (!openSheet) return;
  openSheet.classList.remove('on');
  veil.classList.remove('on');
  openSheet = null;
  if (!silent) {
    bus.dispatchEvent(new CustomEvent('sheet', { detail: { open: false } }));
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
}
export const isOpen = () => !!openSheet;

// ---------- lightbox ----------
const lb = $('#lightbox');
function showPhoto(id) {
  const [cap] = PH[id];
  lb.querySelector('img').src = `photos/${id}.webp`;
  lb.querySelector('img').alt = cap;
  lb.querySelector('p').textContent = cap;
  lb.classList.add('on');
  lb.querySelector('.x').focus();
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-open],[data-close],[data-photo],#veil,#pricebar');
  if (!t) return;
  if (t.id === 'pricebar') return open('prices');
  if (t.id === 'veil') return close();
  if (t.dataset.photo) return showPhoto(t.dataset.photo);
  if ('close' in t.dataset) {
    if (t.closest('#lightbox')) { lb.classList.remove('on'); return; }
    return close();
  }
  if (t.dataset.open) {
    const k = t.dataset.open;
    if (k !== 'prices' && window.CP_SCENE) { close(); window.CP_SCENE.visit(k); }
    else open(k);
  }
});
lb.addEventListener('click', (e) => { if (e.target === lb) lb.classList.remove('on'); });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (lb.classList.contains('on')) lb.classList.remove('on');
  else close();
});

// ---------- hint ----------
const hint = $('#hint');
if (!document.documentElement.classList.contains('coarse')) {
  hint.textContent = 'This is Tofu. Click the ground and he runs there, or walk him with W A S D. Click a house to look inside.';
}
let hintTimer = setTimeout(hideHint, 14000);
export function hideHint() { hint.classList.add('gone'); clearTimeout(hintTimer); }

// ---------- stopwatch ----------
const watch = $('#watch');
const watchOut = $('#watchTime');
const hand = watch.querySelector('.hand');
const sweep = watch.querySelector('.sweep');
export const stopwatch = {
  show() { watch.classList.add('on'); this.set(0); },
  set(p) { // p in 0..1 maps to 0:00..5:00
    const s = Math.round(p * 300);
    watchOut.value = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const a = p * Math.PI * 2;
    hand.setAttribute('transform', `rotate(${p * 360} 22 25)`);
    const x = 22 + 18 * Math.sin(a), y = 25 - 18 * Math.cos(a);
    sweep.setAttribute('d', p <= 0 ? '' : p >= 1 ? 'M22 7a18 18 0 1 1-.01 0z' : `M22 25L22 7A18 18 0 ${a > Math.PI ? 1 : 0} 1 ${x} ${y}z`);
  },
  hide() { watch.classList.remove('on'); },
};

// ---------- day / night ----------
const dn = $('#daynight');
const sky = document.querySelector('.sky');
let night = false;
dn.addEventListener('click', () => {
  night = !night;
  dn.setAttribute('aria-pressed', String(night));
  dn.setAttribute('aria-label', night ? 'Switch to day' : 'Switch to night');
  document.documentElement.classList.toggle('night-on', night);
  bus.dispatchEvent(new CustomEvent('night', { detail: night }));
  if (!window.CP_SCENE) setSky(night ? 1 : 0); // no scene: just swap the CSS sky
});
// n: 0 day .. 1 night. Called every frame by the scene during the transition.
export function setSky(n) {
  const dusk = Math.sin(Math.PI * n);
  sky.querySelector('.dusk').style.opacity = (dusk * 0.85).toFixed(3);
  sky.querySelector('.night').style.opacity = n.toFixed(3);
  sky.querySelector('.stars').style.opacity = Math.max(0, n * 1.4 - 0.4).toFixed(3);
  sky.querySelector('.moon').style.opacity = Math.max(0, n * 1.6 - 0.6).toFixed(3);
  document.body.style.background = n > 0.5 ? '#141B3D' : '#A9D6EC';
}

// ---------- sound (off by default): soft surf made from filtered noise ----------
const snd = $('#sound');
let ac = null, master = null;
function startSurf() {
  ac = new (window.AudioContext || window.webkitAudioContext)();
  const len = ac.sampleRate * 4;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
  const swell = ac.createGain(); swell.gain.value = 0.5;
  const lfo = ac.createOscillator(); lfo.frequency.value = 0.11;
  const lfoAmt = ac.createGain(); lfoAmt.gain.value = 0.45;
  lfo.connect(lfoAmt).connect(swell.gain);
  master = ac.createGain(); master.gain.value = 0;
  src.connect(lp).connect(swell).connect(master).connect(ac.destination);
  src.start(); lfo.start();
}
snd.addEventListener('click', () => {
  const on = snd.getAttribute('aria-pressed') !== 'true';
  snd.setAttribute('aria-pressed', String(on));
  try {
    if (on && !ac) startSurf();
    if (ac) { ac.resume(); master.gain.setTargetAtTime(on ? 0.35 : 0, ac.currentTime, 0.4); }
  } catch (e) { /* audio is optional */ }
});
