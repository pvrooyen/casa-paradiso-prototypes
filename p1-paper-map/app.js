/* Casa Paradiso, P1 "Paper map": interactions.
   Builds the scene (scene.js), fits it to the screen, runs the idle life
   (palms, dog, kettle, hammocks, sea) and handles every tap. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var root = document.documentElement;
  var svg = $('#scene'), paint = $('#paint'), stage = $('#stage');
  var S = window.Scene.build(svg, paint);
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- GSAP, or a do-nothing stand-in so the page still works if the CDN fails ---------- */
  var gsap = window.gsap || (function () {
    function tw(t, v) {
      if (v && t && t.setAttribute && (v.x != null || v.y != null)) t.setAttribute('transform', 'translate(' + (v.x || 0) + ' ' + (v.y || 0) + ')');
      if (v && v.onComplete) setTimeout(v.onComplete, 0);
      return { kill: function () {}, progress: function () { return 1; } };
    }
    var tl = function () { var o = { to: function () { return o; }, fromTo: function () { return o; }, set: function () { return o; }, add: function () { return o; }, call: function (f) { setTimeout(f, 0); return o; }, kill: function () {} }; return o; };
    return { to: tw, set: tw, fromTo: function (t, a, v) { return tw(t, v); }, timeline: tl, killTweensOf: function () {},
      delayedCall: function (d, f) { var id = setTimeout(f, d * 1000); return { kill: function () { clearTimeout(id); } }; },
      getProperty: function () { return 0; }, utils: { random: function (a, b) { return a + Math.random() * (b - a); } } };
  })();
  if (window.gsap && window.MotionPathPlugin) gsap.registerPlugin(window.MotionPathPlugin);
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  /* ---------- content ---------- */
  var WA = 'https://wa.me/27849781078?text=';
  function waLink(what) { return WA + encodeURIComponent("Hi Pierre, I'm looking at Casa Paradiso. I'd like to know more about " + what + '.'); }
  var WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6a9.3 9.3 0 0 0-8 14.1L2.7 21.4l4.8-1.3A9.3 9.3 0 1 0 12 2.6z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.6 7.6c.4-.4.9-.4 1.2.1l.9 1.5c.2.3.1.7-.2 1l-.5.5c.5 1.2 1.4 2.1 2.6 2.6l.5-.5c.3-.3.7-.4 1-.2l1.5.9c.4.3.5.8.1 1.2l-.7.7c-.6.6-1.5.7-2.2.3a9 9 0 0 1-4.3-4.3c-.4-.7-.3-1.6.3-2.2z" fill="#fff"/></svg>';
  var COTTAGE_FACTS = '1 bedroom, 1 en-suite bathroom, about 70 m², large covered deck with hammock';
  var COTTAGE_NOTE = 'Open-plan kitchen and living room, own small garden, own gate. On Airbnb as "Cozy Cabin with Ocean Views in Tranquil Tofinho": rated 5.0, Superhost.';
  var CAP = {
    'bh-exterior-stairs': 'Big house exterior with log staircase and thatch roof', 'bh-garden-path': 'Big house from the garden, brick path up to the deck',
    'bh-deck-dining': 'Covered deck with dining table under the thatch', 'bh-deck-lounge': 'Deck lounge corner looking out over the garden',
    'bh-living': 'Open-plan living room with sofas and bar', 'bh-kitchen': 'Kitchen with breakfast bar and stools',
    'bh-bedroom-net': 'Main bedroom with mosquito net and dark wood cupboards', 'bh-lapa-bar': 'Thatched lapa with bar and seating',
    'sh-deck-view': 'Cottage deck with view over the trees to the dune', 'sh-deck-morning': 'Cottage deck in the morning, seen from the door',
    'sh-deck-hammock': 'Cottage deck with hammock', 'sh-stairs-exterior': 'Cottage on stilts with its stairs and deck',
    'sh-living': 'Cottage open-plan living room', 'sh-kitchen': 'Cottage kitchen with fridge and breakfast bar',
    'sh-bedroom': 'Cottage four-poster bed with net', 'sh-bathroom': 'Cottage en-suite shower',
    'sh-deck-bougainvillea': 'Cottage deck with bougainvillea, thatch roofs and sea haze beyond',
    'pool-palms': 'Splash pool under the palms with hill view',
    'area-aerial-map': 'Aerial map: road in from Inhambane, Tofinho beach, Casa Paradiso at the end of the lane'
  };
  var UNITS = {
    big: { title: 'Big house', what: 'the big house', price: 'ZAR 2.2M', usd: 'about USD 134k',
      facts: '4 bedrooms, 3 bathrooms (2 en-suite), sleeps 8, loft room, large covered deck under thatch',
      note: 'Open-plan kitchen, dining and living room with TV, and a lapa with bar next door. Pierre and Elvera live here now.',
      photos: ['bh-exterior-stairs', 'bh-garden-path', 'bh-deck-dining', 'bh-deck-lounge', 'bh-living', 'bh-kitchen', 'bh-bedroom-net', 'bh-lapa-bar'] },
    top: { title: 'Cottage Top', what: 'Cottage Top', price: 'ZAR 800k', usd: 'about USD 49k', facts: COTTAGE_FACTS,
      note: 'Highest of the three cottages, with the best view. ' + COTTAGE_NOTE,
      photos: ['sh-deck-view', 'sh-deck-hammock', 'sh-deck-bougainvillea', 'sh-living', 'sh-bedroom', 'sh-bathroom'] },
    middle: { title: 'Cottage Middle', what: 'Cottage Middle', price: 'ZAR 750k', usd: 'about USD 46k', facts: COTTAGE_FACTS,
      note: 'The middle step of the slope. ' + COTTAGE_NOTE,
      photos: ['sh-deck-morning', 'sh-stairs-exterior', 'sh-kitchen', 'sh-living', 'sh-bedroom', 'sh-bathroom'] },
    down: { title: 'Cottage Down', what: 'Cottage Down', price: 'ZAR 700k', usd: 'about USD 43k', facts: COTTAGE_FACTS,
      note: 'Nearest the gate and the parking. ' + COTTAGE_NOTE,
      photos: ['sh-stairs-exterior', 'sh-deck-bougainvillea', 'sh-deck-hammock', 'sh-kitchen', 'sh-bedroom', 'sh-bathroom'] }
  };
  var FACTS = [
    'Starlink internet on the whole plot.',
    'Borehole water, safe to drink.',
    'Pets allowed.',
    'An ordinary 2WD car gets here.',
    'Fully fenced: 1,800 m².',
    'Whale sharks: October to March.',
    'Tofinho beach is a 5-minute walk.',
    'The cottages on Airbnb: rated 5.0, Superhost.',
    'Humpback whales: June to October.',
    'Manta rays all year.',
    'Seafood market in Tofo around midday.',
    'Johannesburg: about 11 to 12 hours by road.',
    'Prepaid electricity.'
  ];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function strip(list) {
    return '<div class="strip' + (list.length === 1 ? ' one' : '') + '">' + list.map(function (f, i) {
      var c = esc(CAP[f] || '');
      return '<figure><button type="button" data-full="photos/' + f + '.webp" data-cap="' + c + '" aria-label="Open photo: ' + c + '">' +
        '<img src="photos/' + f + '-thumb.webp" alt="' + c + '" width="480" height="360" loading="' + (i < 2 ? 'eager' : 'lazy') + '" decoding="async"></button>' +
        '<figcaption>' + c + '</figcaption></figure>';
    }).join('') + '</div>';
  }
  function waBtn(label, what) { return '<a class="wa" href="' + waLink(what) + '" target="_blank" rel="noopener">' + WA_ICON + esc(label) + '</a>'; }
  function unitHTML(k) {
    var u = UNITS[k];
    return '<h2 class="sheet-title" id="sheetTitle">' + u.title + '</h2>' +
      '<p class="facts">' + u.facts + '</p>' + strip(u.photos) +
      '<div class="price"><b>' + u.price + '</b><span>' + u.usd + '</span></div>' +
      '<p class="note">' + esc(u.note) + '</p>' +
      waBtn('Ask Pierre about ' + u.title, u.what) +
      '<button class="link" type="button" data-prices>Whole estate: ZAR 4.0M for all four houses. See all prices</button>';
  }
  function priceHTML() {
    return '<h2 class="sheet-title" id="sheetTitle">Prices</h2>' +
      '<div class="estate"><span class="lead">Whole estate</span><b>ZAR 4.0M</b>' +
      '<span>about USD 243k, for all four houses, the pool and the 1,800 m² plot</span>' +
      '<span>ZAR 4.45M if bought separately: you save ZAR 445k</span></div>' +
      '<table class="ptable"><tbody>' +
      [['big', 'Big house', '4 bedrooms, sleeps 8'], ['top', 'Cottage Top', '1 bedroom, best view'], ['middle', 'Cottage Middle', '1 bedroom'], ['down', 'Cottage Down', '1 bedroom, by the gate']].map(function (r) {
        var u = UNITS[r[0]];
        return '<tr><td><button class="rowlink" type="button" data-unit="' + r[0] + '">' + r[1] + '</button><small>' + r[2] + '</small></td><td><b>' + u.price + '</b><small>' + u.usd + '</small></td></tr>';
      }).join('') + '</tbody></table>' +
      '<p class="note">US dollars at 1 USD = 16.47 ZAR.</p>' +
      waBtn('Chat with Pierre on WhatsApp', 'the whole estate');
  }

  /* ---------- fit the core of the map to the screen ---------- */
  var cart = $('.cartouche'), dock = $('.dock');
  function fit() {
    var W = stage.clientWidth, H = stage.clientHeight, C = window.Scene.CORE;
    if (!W || !H) return;
    var vx, vy, vw, vh, s;
    if (W > H * 1.05 && W >= 700) {
      // Landscape: the fenced plot fills about 60% of the height, the ocean stays in frame,
      // the title and price tag float over the sea, the controls sit bottom-right.
      var F = { x: 25, y: 22, w: 550, h: 800 };
      s = Math.min(H / F.h, W / F.w);
      vw = W / s; vh = H / s;
      vx = 300 - vw / 2; vy = F.y - Math.max(0, (vh - F.h) / 2);
    } else {
      // Portrait: fit the plot (with a small margin) to the width, between the title and the controls.
      var cr = cart.getBoundingClientRect(), dr = dock.getBoundingClientRect();
      var top = cr.bottom + 6, bottom = H - dr.top + 4, availH = Math.max(120, H - top - bottom);
      s = Math.min(W / C.w, availH / C.h);
      vw = W / s; vh = H / s;
      vx = C.x + C.w / 2 - vw / 2; vy = C.y - (top + (availH - C.h * s) / 2) / s;
    }
    var vb = vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1);
    svg.setAttribute('viewBox', vb); paint.setAttribute('viewBox', vb);
  }
  fit();
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  /* ---------- bubble ---------- */
  var bubble = $('#bubble'), bubbleT = 0;
  function showBubble(msg, target, ms) {
    bubble.textContent = msg;
    bubble.classList.remove('below');
    bubble.style.maxWidth = Math.min(240, innerWidth - 32) + 'px';
    bubble.style.left = '0px'; bubble.style.top = '0px';
    var r = target.getBoundingClientRect(), b = bubble.getBoundingClientRect();
    var cx = r.left + r.width / 2, left = Math.max(12, Math.min(innerWidth - b.width - 12, cx - b.width / 2));
    var top = r.top - b.height - 14, minTop = cart.getBoundingClientRect().bottom + 4;
    if (top < minTop) { top = r.bottom + 14; bubble.classList.add('below'); }
    bubble.style.left = left + 'px'; bubble.style.top = top + 'px';
    bubble.style.setProperty('--tail', Math.max(18, Math.min(b.width - 18, cx - left)) + 'px');
    gsap.killTweensOf(bubble);
    gsap.fromTo(bubble, { opacity: 0, scale: 0.6, y: 6 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(2.2)' });
    if (!window.gsap) bubble.style.opacity = 1;
    clearTimeout(bubbleT); bubbleT = setTimeout(hideBubble, ms || 4200);
  }
  function hideBubble() { clearTimeout(bubbleT); gsap.to(bubble, { opacity: 0, duration: 0.25 }); if (!window.gsap) bubble.style.opacity = 0; }

  /* ---------- sheet ---------- */
  // move focus into the sheet only for keyboard users (no stray focus ring after a tap)
  var usedKeys = false;
  document.addEventListener('keydown', function () { usedKeys = true; }, true);
  document.addEventListener('pointerdown', function () { usedKeys = false; }, true);
  var sheet = $('#sheet'), scrim = $('#scrim'), sheetBody = $('#sheetBody'), onCloseCb = null, lastFocus = null;
  function openSheet(html, opts) {
    if (sheet.classList.contains('on')) closeSheet();
    sheetBody.innerHTML = html;
    sheet.scrollTop = 0;
    onCloseCb = opts && opts.onClose;
    lastFocus = document.activeElement;
    sheet.style.transform = '';
    sheet.classList.add('on'); scrim.classList.add('on');
    sheet.setAttribute('aria-hidden', 'false');
    if (usedKeys) setTimeout(function () { var x = sheet.querySelector('.x'); if (x) x.focus({ preventScroll: true }); }, 60);
  }
  function closeSheet() {
    if (!sheet.classList.contains('on')) return;
    sheet.classList.remove('on'); scrim.classList.remove('on');
    sheet.setAttribute('aria-hidden', 'true');
    sheet.style.transform = '';
    var cb = onCloseCb; onCloseCb = null;
    if (cb) cb();
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  scrim.addEventListener('click', closeSheet);
  sheet.querySelector('.x').addEventListener('click', closeSheet);
  sheet.addEventListener('click', function (e) {
    var t = e.target.closest('[data-full]');
    if (t) { openLightbox(t.getAttribute('data-full'), t.getAttribute('data-cap')); return; }
    if (e.target.closest('[data-prices]')) { closeSheet(); openPrices(); return; }
    var u = e.target.closest('[data-unit]');
    if (u) { closeSheet(); openUnit(u.getAttribute('data-unit')); }
  });
  // drag the handle down to close
  (function () {
    var grab = sheet.querySelector('.grab'), y0 = 0, dy = 0, drag = false;
    grab.addEventListener('pointerdown', function (e) { drag = true; y0 = e.clientY; dy = 0; sheet.classList.add('dragging'); grab.setPointerCapture(e.pointerId); });
    grab.addEventListener('pointermove', function (e) { if (!drag) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = 'translateY(' + dy + 'px)'; });
    function end() { if (!drag) return; drag = false; sheet.classList.remove('dragging'); if (dy > 90) closeSheet(); else sheet.style.transform = ''; }
    grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
    grab.addEventListener('click', function () { if (dy < 4) closeSheet(); });
  })();

  var lightbox = $('#lightbox');
  function openLightbox(src, cap) {
    var img = lightbox.querySelector('img');
    img.src = src; img.alt = cap || '';
    lightbox.querySelector('p').textContent = cap || '';
    lightbox.classList.add('on');
  }
  lightbox.addEventListener('click', function () { lightbox.classList.remove('on'); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lightbox.classList.contains('on')) lightbox.classList.remove('on'); else closeSheet();
  });

  function openPrices() { hideHint(); openSheet(priceHTML()); }
  $('#tagBtn').addEventListener('click', openPrices);
  $('#waBtn').href = waLink('the whole estate');

  /* ---------- buildings ---------- */
  var night = false, openRoof = null;
  function liftRoof(k) {
    var b = S.buildings[k], parts = [b.roof]; if (b.roofLight) parts.push(b.roofLight);
    gsap.killTweensOf(parts);
    gsap.to(parts, { y: -36, rotation: k === 'big' ? -3 : 4, svgOrigin: b.roofPivot.join(' '), duration: 0.5, ease: 'back.out(1.8)' });
    gsap.to(b.door, { scaleX: 0.15, svgOrigin: b.doorHinge.join(' '), duration: 0.4, delay: 0.1 });
    gsap.to(S.lights[k], { opacity: 1, duration: 0.35, delay: 0.15 });
    openRoof = k;
  }
  function dropRoof(k) {
    var b = S.buildings[k], parts = [b.roof]; if (b.roofLight) parts.push(b.roofLight);
    gsap.to(parts, { y: 0, rotation: 0, svgOrigin: b.roofPivot.join(' '), duration: 0.8, ease: 'bounce.out' });
    gsap.to(b.door, { scaleX: 1, svgOrigin: b.doorHinge.join(' '), duration: 0.4 });
    if (!night) gsap.to(S.lights[k], { opacity: 0, duration: 0.6, delay: 0.4 });
    if (openRoof === k) openRoof = null;
  }
  function openUnit(k) {
    hideHint(); hideBubble();
    if (openRoof && openRoof !== k) dropRoof(openRoof);
    liftRoof(k);
    setTimeout(function () { openSheet(unitHTML(k), { onClose: function () { dropRoof(k); } }); }, reduce ? 0 : 560);
  }

  /* ---------- pool ---------- */
  function tapPool() {
    hideHint();
    var c = S.poolCenter, ox = c[0] + rnd(-14, 14), oy = c[1] + rnd(-5, 5), NS = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < 3; i++) {
      var e = document.createElementNS(NS, 'ellipse');
      e.setAttribute('cx', ox); e.setAttribute('cy', oy); e.setAttribute('rx', 2); e.setAttribute('ry', 1);
      e.setAttribute('fill', 'none'); e.setAttribute('stroke', '#fff'); e.setAttribute('stroke-width', 1.6);
      S.poolFx.appendChild(e);
      gsap.to(e, { attr: { rx: 34, ry: 17 }, opacity: 0, duration: 1.4, delay: i * 0.22, ease: 'power1.out', onComplete: (function (n) { return function () { n.remove(); }; })(e) });
    }
    for (var j = 0; j < 9; j++) {
      var d = document.createElementNS(NS, 'circle');
      d.setAttribute('cx', ox); d.setAttribute('cy', oy); d.setAttribute('r', rnd(1.2, 2.2)); d.setAttribute('fill', '#BDEBF5'); d.setAttribute('stroke', '#2B7F9C'); d.setAttribute('stroke-width', 0.6);
      S.splashLayer.appendChild(d);
      var dx = rnd(-18, 18), h = rnd(14, 28);
      var tl = gsap.timeline({ onComplete: (function (n) { return function () { n.remove(); }; })(d) });
      tl.to(d, { x: dx * 0.6, y: -h, duration: 0.32, ease: 'power2.out' }).to(d, { x: dx, y: 4, opacity: 0, duration: 0.36, ease: 'power2.in' });
    }
    showBubble('Shared splash pool, borehole-fed', $('#pool'), 2600);
    setTimeout(function () {
      openSheet('<h2 class="sheet-title" id="sheetTitle">Shared splash pool</h2>' +
        '<p class="facts">Borehole-fed, between the big house and the cottages</p>' + strip(['pool-palms']) +
        '<p class="note">Loungers in the shade of the palms. Shared by all four houses.</p>' +
        waBtn('Ask Pierre about the pool', 'the pool'), { onClose: hideBubble });
    }, reduce ? 300 : 1300);
  }

  /* ---------- the dog ---------- */
  var dog = S.dog, dogBusy = false, legT = [], wanderCall = null, dogPos = S.dogHome.slice();
  gsap.set(dog.g, { x: dogPos[0], y: dogPos[1] });
  function face(dir) { dog.flip.setAttribute('transform', dir < 0 ? 'scale(-1 1)' : ''); }
  function syncLabel() {
    var x = gsap.getProperty(dog.g, 'x'), y = gsap.getProperty(dog.g, 'y');
    gsap.set(S.dogLabel, { x: x - S.dogHome[0], y: y - S.dogHome[1] });
  }
  function legsOn(speed) {
    legsOff(true);
    var L = dog.legs;
    [['fl', 1], ['br', 1], ['bl', -1], ['fr', -1]].forEach(function (p) {
      gsap.set(L[p[0]], { rotation: -26 * p[1], transformOrigin: '50% 0%' });
      legT.push(gsap.to(L[p[0]], { rotation: 26 * p[1], duration: speed, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    });
    legT.push(gsap.to(dog.body, { y: -2, duration: speed, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    gsap.to(dog.ear, { rotation: -25, transformOrigin: '50% 0%', duration: 0.2 });
  }
  function legsOff(quick) {
    legT.forEach(function (t) { t.kill(); }); legT = [];
    if (quick) return;
    var L = dog.legs;
    gsap.to([L.fl, L.fr, L.bl, L.br], { rotation: 0, duration: 0.15 });
    gsap.to(dog.body, { y: 0, duration: 0.15 });
    gsap.to(dog.ear, { rotation: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
  }
  function moveDog(to, dur, cb) {
    var x = gsap.getProperty(dog.g, 'x');
    face(to[0] >= x ? 1 : -1);
    if (dur <= 0.01) { gsap.set(dog.g, { x: to[0], y: to[1] }); syncLabel(); if (cb) cb(); return; }
    legsOn(0.13);
    gsap.to(dog.g, { x: to[0], y: to[1], duration: dur, ease: 'sine.inOut', onUpdate: syncLabel, onComplete: function () { legsOff(); if (cb) cb(); } });
  }
  var WANDER = [[414, 612], [384, 648], [448, 636], [372, 604], [440, 592], [404, 670], [456, 664]];
  function scheduleWander() {
    if (wanderCall) wanderCall.kill();
    if (reduce) return;
    wanderCall = gsap.delayedCall(rnd(2.2, 4.8), function () {
      if (dogBusy) return;
      var p = WANDER[Math.floor(Math.random() * WANDER.length)], x = gsap.getProperty(dog.g, 'x'), y = gsap.getProperty(dog.g, 'y');
      var dist = Math.hypot(p[0] - x, p[1] - y);
      if (dist < 8) { sniff(); scheduleWander(); return; }
      moveDog(p, dist / 34, function () { if (Math.random() < 0.5) sniff(); scheduleWander(); });
    });
  }
  function sniff() {
    gsap.to(dog.head, { rotation: 14, transformOrigin: '30% 80%', duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut' });
  }

  var watch = $('#watch'), watchTime = $('#watchTime'), watchHand = $('#watchHand'), watchArc = $('#watchArc');
  function setWatch(p) {
    var secs = Math.min(300, Math.round(p * 300));
    watchTime.textContent = Math.floor(secs / 60) + ':' + ('0' + (secs % 60)).slice(-2);
    watchHand.setAttribute('transform', 'rotate(' + (p * 5 * 360).toFixed(1) + ' 55 66)');
    if (p <= 0) { watchArc.setAttribute('d', ''); return; }
    if (p >= 0.999) { watchArc.setAttribute('d', 'M55 20a46 46 0 1 1 0 92a46 46 0 1 1 0 -92Z'); return; }
    var a = p * 2 * Math.PI, x = 55 + 46 * Math.sin(a), y = 66 - 46 * Math.cos(a);
    watchArc.setAttribute('d', 'M55 66L55 20A46 46 0 ' + (p > 0.5 ? 1 : 0) + ' 1 ' + x.toFixed(1) + ' ' + y.toFixed(1) + 'Z');
  }
  function runToBeach() {
    if (dogBusy) return;
    dogBusy = true; hideHint(); hideBubble();
    if (wanderCall) wanderCall.kill();
    gsap.killTweensOf(dog.g);
    var x = gsap.getProperty(dog.g, 'x'), y = gsap.getProperty(dog.g, 'y');
    var back = Math.hypot(S.dogHome[0] - x, S.dogHome[1] - y);
    gsap.to(S.dogLabel, { opacity: 0, duration: 0.2 });
    moveDog(S.dogHome, reduce ? 0 : Math.min(0.6, back / 60), function () {
      setWatch(0);
      gsap.fromTo(watch, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' });
      if (!window.gsap) watch.style.opacity = 1;
      gsap.set(dog.tongue, { opacity: 1 });
      legsOn(0.085);
      var lastX = S.dogHome[0];
      gsap.to(dog.g, {
        duration: reduce ? 0.6 : 3.6, ease: 'power1.inOut',
        motionPath: { path: S.route },
        onUpdate: function () {
          var p = this.progress(), nx = gsap.getProperty(dog.g, 'x');
          if (Math.abs(nx - lastX) > 0.25) { face(nx > lastX ? 1 : -1); lastX = nx; }
          gsap.set(dog.body, { scale: 1 - 0.3 * p, transformOrigin: '50% 100%' });
          setWatch(p);
        },
        onComplete: arrive
      });
    });
  }
  function arrive() {
    legsOff(); setWatch(1);
    gsap.to(dog.body, { y: -9, duration: 0.18, yoyo: true, repeat: 3, ease: 'power1.out' });
    showBubble('5 minutes to Tofinho beach', dog.g, 3200);
    setTimeout(function () {
      openSheet('<h2 class="sheet-title" id="sheetTitle">5 minutes to Tofinho beach</h2>' +
        '<p class="facts">About a 5-minute walk from the beach gate, down the sandy path through the dune bush.</p>' +
        strip(['area-aerial-map']) +
        '<p class="note">Beach photo coming. Not beachfront: you get the view, the breeze and the quiet instead.</p>' +
        waBtn('Ask Pierre about the area', 'the area and the beach'), { onClose: runHome });
    }, reduce ? 300 : 1300);
  }
  function runHome() {
    gsap.to(watch, { opacity: 0, duration: 0.3 });
    if (!window.gsap) watch.style.opacity = 0;
    hideBubble();
    legsOn(0.1);
    var lastX = gsap.getProperty(dog.g, 'x');
    gsap.to(dog.g, {
      duration: reduce ? 0.3 : 2.4, ease: 'power1.inOut',
      motionPath: { path: S.route, start: 1, end: 0 },
      onUpdate: function () {
        var p = this.progress(), nx = gsap.getProperty(dog.g, 'x');
        if (Math.abs(nx - lastX) > 0.25) { face(nx > lastX ? 1 : -1); lastX = nx; }
        gsap.set(dog.body, { scale: 0.7 + 0.3 * p, transformOrigin: '50% 100%' });
      },
      onComplete: function () {
        legsOff(); gsap.set(dog.tongue, { opacity: 0 }); gsap.set(dog.body, { scale: 1 });
        syncLabel(); gsap.to(S.dogLabel, { opacity: 1, duration: 0.3 });
        dogBusy = false; scheduleWander();
      }
    });
  }

  /* ---------- Pedro ---------- */
  var factI = 0, waving = null;
  function tapPedro() {
    hideHint();
    var arm = S.pedro.arm;
    if (waving) waving.kill();
    waving = gsap.timeline();
    waving.to(arm, { rotation: -140, transformOrigin: '25% 6%', duration: 0.25, ease: 'back.out(2)' })
      .to(arm, { rotation: -165, duration: 0.16, yoyo: true, repeat: 5, ease: 'sine.inOut' })
      .to(arm, { rotation: 0, duration: 0.35, ease: 'power2.inOut' });
    gsap.fromTo(S.pedro.body, { y: 0 }, { y: -5, duration: 0.15, yoyo: true, repeat: 1 });
    showBubble(FACTS[factI % FACTS.length], S.pedro.head, 4600);
    factI++;
  }

  /* ---------- little delights ---------- */
  function tapChicken() {
    var c = S.chicken;
    gsap.timeline().to(c.body, { y: -12, duration: 0.18, ease: 'power2.out' }).to(c.body, { y: 0, duration: 0.25, ease: 'bounce.out' });
    gsap.to(c.head, { rotation: 30, transformOrigin: '20% 90%', duration: 0.1, yoyo: true, repeat: 5 });
    showBubble('Bok bok!', c.g, 1500);
  }
  function tapWashing() {
    S.washing.items.forEach(function (it, i) {
      gsap.fromTo(it, { rotation: 0 }, { rotation: (i % 2 ? -1 : 1) * 28, svgOrigin: it._pin.join(' '), duration: 0.18, yoyo: true, repeat: 5, delay: i * 0.05, ease: 'sine.inOut' });
    });
  }
  function tapKettle() {
    var k = S.kettle;
    gsap.fromTo(k.pot, { rotation: -7 }, { rotation: 7, transformOrigin: '50% 100%', duration: 0.07, yoyo: true, repeat: 9, onComplete: function () { gsap.set(k.pot, { rotation: 0 }); } });
    k.puffs.forEach(function (p, i) {
      gsap.fromTo(p, { opacity: 0.95, y: 0, x: 0, scale: 1 }, { opacity: 0, y: -26 - i * 6, x: 6 + i * 3, scale: 2, transformOrigin: '50% 100%', duration: 1.1, delay: i * 0.12, ease: 'power1.out' });
    });
    showBubble('Wheeee! Tea for Pedro.', k.g, 1800);
  }
  function tapHammock(el) {
    var key = (el.getAttribute('aria-label') || '').split(' ').pop().toLowerCase(), h = S.hammocks[key];
    if (!h) return;
    gsap.killTweensOf(h.swing);
    gsap.fromTo(h.swing, { rotation: 16 }, { rotation: 0, svgOrigin: h.pivot.join(' '), duration: 2.4, ease: 'elastic.out(1.2,0.15)', onComplete: function () { idleHammock(h, 0); } });
  }
  function tapCar() {
    gsap.timeline().to(S.car.body, { y: -6, duration: 0.12 }).to(S.car.body, { y: 0, duration: 0.3, ease: 'bounce.out' }).to(S.car.body, { y: -3, duration: 0.1 }).to(S.car.body, { y: 0, duration: 0.25, ease: 'bounce.out' });
    showBubble('An ordinary 2WD car gets here.', S.car.g, 2400);
  }
  function tapShark() {
    gsap.timeline().to(S.shark.body, { opacity: 0.15, y: 5, duration: 0.6 }).to(S.shark.body, { opacity: 0.85, y: 0, duration: 0.8, delay: 0.4 });
    showBubble('Whale sharks: October to March.', S.shark.g, 2600);
  }
  function tapDhow() {
    gsap.timeline().to(S.dhow.body, { rotation: -12, transformOrigin: '50% 100%', duration: 0.3 }).to(S.dhow.body, { rotation: 0, duration: 1.2, ease: 'elastic.out(1,0.3)' });
  }

  /* ---------- day / night ---------- */
  var dayBtn = $('#dayBtn'), flyT = [];
  function setNight(on, instant) {
    night = on;
    root.classList.toggle('night', on);
    var d = instant ? 0 : 1;
    gsap.to(S.night, { opacity: on ? 1 : 0, duration: 1.2 * d });
    gsap.to(S.sun, { opacity: on ? 0 : 1, y: on ? 40 : 0, duration: 1 * d });
    gsap.to(S.moon, { opacity: on ? 1 : 0, duration: 1.2 * d, delay: on ? 0.4 * d : 0 });
    gsap.to(S.stars, { opacity: on ? 1 : 0, duration: 0.8 * d, delay: on ? 0.5 * d : 0 });
    if (on && !instant) gsap.fromTo(S.starList, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, stagger: { each: 0.02, from: 'random' }, delay: 0.5, ease: 'back.out(3)' });
    Object.keys(S.lights).forEach(function (k, i) {
      if (!on && k === openRoof) return;
      gsap.to(S.lights[k], { opacity: on ? 1 : 0, duration: 0.5 * d, delay: on ? (0.6 + i * 0.18) * d : 0 });
    });
    gsap.to(S.fliesG, { opacity: on ? 1 : 0, duration: 1 * d });
    flyT.forEach(function (t) { t.kill(); }); flyT = [];
    if (on && !reduce) S.flies.forEach(function (f) {
      flyT.push(gsap.to(f, { x: rnd(-30, 30), y: rnd(-20, 20), duration: rnd(2.5, 4.5), yoyo: true, repeat: -1, ease: 'sine.inOut' }));
      flyT.push(gsap.to(f, { opacity: 0.2, duration: rnd(0.6, 1.4), yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    });
    dayBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    dayBtn.setAttribute('aria-label', on ? 'Switch to daytime' : 'Switch to evening');
    $('#sunI').style.display = on ? 'none' : '';
    $('#moonI').style.display = on ? '' : 'none';
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', on ? '#25345A' : '#F2E6CC');
  }
  dayBtn.addEventListener('click', function () { setNight(!night); });

  /* ---------- sound: synthesised waves, off by default ---------- */
  var actx = null, master = null, soundOn = false, soundBtn = $('#soundBtn');
  function startSound() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    if (!actx) {
      actx = new AC();
      var len = 4 * actx.sampleRate, buf = actx.createBuffer(1, len, actx.sampleRate), data = buf.getChannelData(0), last = 0;
      for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.2; }
      var src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
      var lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      var swell = actx.createGain(); swell.gain.value = 0.55;
      var lfo = actx.createOscillator(); lfo.frequency.value = 0.11;
      var lfoAmt = actx.createGain(); lfoAmt.gain.value = 0.4;
      lfo.connect(lfoAmt); lfoAmt.connect(swell.gain);
      master = actx.createGain(); master.gain.value = 0;
      src.connect(lp); lp.connect(swell); swell.connect(master); master.connect(actx.destination);
      src.start(); lfo.start();
    }
    actx.resume();
    master.gain.setTargetAtTime(0.7, actx.currentTime, 0.6);
  }
  soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    if (soundOn) startSound(); else if (master) master.gain.setTargetAtTime(0, actx.currentTime, 0.3);
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    soundBtn.setAttribute('aria-label', soundOn ? 'Turn off wave sounds' : 'Turn on wave sounds');
    $('#waves').style.display = soundOn ? '' : 'none';
    $('#mute').style.display = soundOn ? 'none' : '';
  });

  $('#beachBtn').addEventListener('click', runToBeach);

  /* ---------- taps on the map ---------- */
  var hintShown = true;
  function hideHint() { if (!hintShown) return; hintShown = false; gsap.to(S.hint, { opacity: 0, duration: 0.4 }); if (!window.gsap) S.hint.style.display = 'none'; }
  function act(k, el) {
    switch (k) {
      case 'big': case 'top': case 'middle': case 'down': openUnit(k); break;
      case 'pool': tapPool(); break;
      case 'dog': case 'path': runToBeach(); break;
      case 'pedro': tapPedro(); break;
      case 'chicken': tapChicken(); break;
      case 'washing': tapWashing(); break;
      case 'kettle': tapKettle(); break;
      case 'hammock': tapHammock(el); break;
      case 'car': tapCar(); break;
      case 'shark': tapShark(); break;
      case 'dhow': tapDhow(); break;
    }
  }
  svg.addEventListener('click', function (e) {
    var t = e.target.closest('[data-hit]');
    if (t) act(t.getAttribute('data-hit'), t);
  });
  svg.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest('[data-hit]');
    if (t) { e.preventDefault(); act(t.getAttribute('data-hit'), t); }
  });

  /* ---------- idle life ---------- */
  function idleHammock(h, delay) {
    gsap.fromTo(h.swing, { rotation: -3.5 }, { rotation: 3.5, svgOrigin: h.pivot.join(' '), duration: rnd(1.8, 2.4), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: delay || 0 });
  }
  function idle() {
    if (reduce) return;
    S.palms.forEach(function (p) {
      if (p.top[0] < -120 || p.top[0] > 720) return; // only the palms in view on most screens
      gsap.fromTo(p.crown, { rotation: -2.2 }, { rotation: 2.2, svgOrigin: p.top.join(' '), duration: rnd(2.2, 3.4), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: rnd(0, 2) });
    });
    Object.keys(S.hammocks).forEach(function (k, i) { idleHammock(S.hammocks[k], i * 0.7); });
    S.washing.items.forEach(function (it, i) {
      gsap.fromTo(it, { rotation: -4 }, { rotation: 5, svgOrigin: it._pin.join(' '), duration: rnd(1.1, 1.6), yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.2 });
    });
    gsap.to(S.pedro.body, { y: -1.4, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(dog.tail, { rotation: 22, transformOrigin: '100% 100%', duration: 0.22, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(S.kettle.flame, { scaleY: 1.25, scaleX: 0.9, transformOrigin: '50% 100%', duration: 0.18, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    S.kettle.puffs.forEach(function (p, i) {
      gsap.fromTo(p, { opacity: 0, y: 0, scale: 0.8 }, { keyframes: [{ opacity: 0.85, y: -6, scale: 1, duration: 0.7 }, { opacity: 0, y: -16, scale: 1.4, duration: 1.1 }], transformOrigin: '50% 100%', repeat: -1, delay: i * 0.6, ease: 'none' });
    });
    // whale shark patrols the bay, dhow drifts on the horizon
    gsap.set(S.shark.g, { x: S.shark.x, y: S.shark.y });
    gsap.timeline({ repeat: -1 })
      .to(S.shark.g, { x: 420, duration: 10, ease: 'sine.inOut' })
      .set(S.shark.body, { scaleX: -1, transformOrigin: '50% 50%' })
      .to(S.shark.g, { x: 170, duration: 14, ease: 'sine.inOut' })
      .set(S.shark.body, { scaleX: 1 })
      .to(S.shark.g, { x: S.shark.x, duration: 6, ease: 'sine.inOut' });
    gsap.to(S.shark.g, { y: S.shark.y + 5, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.set(S.dhow.g, { x: S.dhow.x, y: S.dhow.y });
    gsap.to(S.dhow.g, { x: S.dhow.x - 60, duration: 26, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(S.dhow.body, { rotation: 3, transformOrigin: '50% 100%', duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(S.waves, { x: 7, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(S.foam, { opacity: 0.35, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(S.poolShine, { x: 4, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    S.clouds.forEach(function (c, i) { gsap.to(c, { x: 24 + i * 4, duration: 18 + i * 3, yoyo: true, repeat: -1, ease: 'sine.inOut' }); });
    // chicken pecks and potters about
    gsap.set(S.chicken.g, { x: S.chicken.x, y: S.chicken.y });
    gsap.timeline({ repeat: -1, repeatDelay: 1.5 })
      .to(S.chicken.head, { rotation: 38, transformOrigin: '20% 90%', duration: 0.12, yoyo: true, repeat: 3 })
      .to(S.chicken.g, { x: S.chicken.x + 14, duration: 1.4, ease: 'steps(6)' }, '+=1.2')
      .to(S.chicken.head, { rotation: 38, duration: 0.12, yoyo: true, repeat: 3 }, '+=0.8')
      .to(S.chicken.g, { x: S.chicken.x, duration: 1.4, ease: 'steps(6)' }, '+=1.4');
    gsap.to(S.hint, { y: -4, duration: 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    scheduleWander();
  }

  /* ---------- the one opening moment: the map "pops up" off the paper ---------- */
  function intro() {
    gsap.set(S.chicken.g, { x: S.chicken.x, y: S.chicken.y });
    gsap.set(S.shark.g, { x: S.shark.x, y: S.shark.y });
    gsap.set(S.dhow.g, { x: S.dhow.x, y: S.dhow.y });
    if (reduce || !window.gsap) { idle(); return; }
    var pops = ['#b-top', '#b-middle', '#b-down', '#b-big', '#lapa', '#pool'].map($);
    gsap.from(pops, { y: 26, opacity: 0, duration: 0.6, stagger: 0.09, ease: 'back.out(2)' });
    gsap.from('#labels', { opacity: 0, duration: 0.6, delay: 0.7 });
    gsap.from([S.pedro.g, dog.g, S.chicken.g], { opacity: 0, duration: 0.4, delay: 0.75 });
    gsap.delayedCall(1.1, function () {
      gsap.timeline().to(S.pedro.arm, { rotation: -140, transformOrigin: '25% 6%', duration: 0.25 }).to(S.pedro.arm, { rotation: -165, duration: 0.16, yoyo: true, repeat: 3 }).to(S.pedro.arm, { rotation: 0, duration: 0.3 });
      idle();
    });
  }

  var q = location.search;
  // ?shot: follow the real clock even when frames are sparse (headless screenshots use virtual time)
  if (/shot/.test(q) && window.gsap) gsap.ticker.lagSmoothing(0);
  if (/night/.test(q)) setNight(true, true);
  if (/og/.test(q)) root.classList.add('og'); // clean frame for the share image
  intro();
  // test hooks: ?open=top, ?open=prices
  var m = /open=(\w+)/.exec(q);
  if (m) setTimeout(function () { if (m[1] === 'prices') openPrices(); else if (UNITS[m[1]]) openUnit(m[1]); else if (m[1] === 'beach') runToBeach(); else if (m[1] === 'pedro') tapPedro(); }, 1800);
})();
