/* Casa Paradiso, P1 "Paper map": inline-SVG scene builder.
   Everything is drawn in code as a watercolour-and-ink map.
   Two stacked SVGs share one viewBox:
     #paint  static washes (sea, land, paths, fence) under one turbulence filter;
             it never changes, so the filter is paid for once.
     #scene  everything that moves or can be tapped.
   Coordinates are viewBox units. The important part of the picture sits inside
   Scene.CORE and app.js fits that box to the screen. Ink lines are jittered in
   JS (no runtime cost); a light displacement filter roughens the buildings. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#3B2A1F';
  var C = {
    thatch: '#C9A96E', thatchDk: '#A88650', thatchLt: '#DDC28C', straw: '#8A6A35',
    timber: '#8B5A2B', timberLt: '#B9824C', wall: '#FAF4E6', wallSh: '#E2D5BB',
    oxide: '#8E4A3A', pink: '#E8407A', pinkDk: '#B92C61', pool: '#2FA7C9',
    dune: '#6E8F4E', duneLt: '#9DB572', duneDk: '#4F6F3A', sea: '#9FC5D6', seaDk: '#6FA3BF',
    sand: '#EBD8A6', lane: '#E0C38A', stone: '#CDBCA0', skin: '#6B4226', glow: '#FFD27A'
  };

  /* ---------- seeded random so the drawing is identical on every load ---------- */
  var _s = 7;
  function rand() { _s = (_s + 0x6D2B79F5) | 0; var t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function rr(a, b) { return a + (b - a) * rand(); }

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function g(parent, attrs) { return el('g', attrs, parent); }
  function f1(n) { return Math.round(n * 10) / 10; }
  function lerp2(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function qpt(a, c, b, t) { var u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; }

  /* Smooth Catmull-Rom path through points. */
  function smooth(p, closed) {
    var n = p.length;
    if (n < 3) return 'M' + p.map(function (q) { return f1(q[0]) + ' ' + f1(q[1]); }).join('L') + (closed ? 'Z' : '');
    var d = 'M' + f1(p[0][0]) + ' ' + f1(p[0][1]);
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = p[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)], p1 = p[i], p2 = p[(i + 1) % n],
          p3 = p[closed ? (i + 2) % n : Math.min(i + 2, n - 1)];
      d += 'C' + f1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
           f1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  /* Hand-drawn line: subdivide, jitter sideways, smooth. */
  function wob(pts, closed, amp, step) {
    amp = amp == null ? 1 : amp; step = step || 14;
    var out = [], n = pts.length, segs = closed ? n : n - 1;
    for (var i = 0; i < segs; i++) {
      var a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      var k = Math.max(1, Math.round(len / step)), nx = -dy / len, ny = dx / len;
      for (var j = 0; j < k; j++) {
        var t = j / k, off = (j === 0 ? 0.35 : 1) * rr(-amp, amp);
        out.push([a[0] + dx * t + nx * off, a[1] + dy * t + ny * off]);
      }
    }
    if (!closed) out.push([pts[n - 1][0] + rr(-amp, amp) * 0.4, pts[n - 1][1] + rr(-amp, amp) * 0.4]);
    return smooth(out, closed);
  }
  function ink(parent, pts, closed, o) {
    o = o || {};
    return el('path', { d: wob(pts, closed, o.amp == null ? 0.8 : o.amp, o.step), fill: 'none', stroke: o.color || INK,
      'stroke-width': o.w || 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: o.op, 'stroke-dasharray': o.dash }, parent);
  }
  function wash(parent, pts, fill, o) {
    o = o || {};
    var dx = o.dx == null ? 1 : o.dx, dy = o.dy == null ? 0.7 : o.dy;
    var q = pts.map(function (p) { return [p[0] + dx, p[1] + dy]; });
    return el('path', { d: wob(q, true, o.amp == null ? 1 : o.amp, o.step), fill: fill, 'fill-opacity': o.op == null ? 0.95 : o.op,
      stroke: o.edge || null, 'stroke-width': o.edge ? (o.ew || 1.3) : null, 'stroke-opacity': o.edge ? 0.35 : null }, parent);
  }
  function shape(parent, pts, fill, o) {
    o = o || {};
    if (fill) wash(parent, pts, fill, o);
    if (!o.noInk) ink(parent, pts, true, o);
  }
  /* Thick outlined stroke (arms, legs, trunks, logs). */
  function limb(parent, pts, color, w, iw) {
    var d = smooth(pts, false); iw = iw == null ? 1.1 : iw;
    var gg = g(parent);
    el('path', { d: d, fill: 'none', stroke: INK, 'stroke-width': w + iw * 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gg);
    el('path', { d: d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gg);
    return gg;
  }
  function blob(cx, cy, rx, ry, n, jit) {
    var pts = []; n = n || 10; jit = jit == null ? 0.12 : jit;
    for (var i = 0; i < n; i++) { var a = (i / n) * Math.PI * 2, k = 1 + rr(-jit, jit); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return pts;
  }
  function text(parent, x, y, s, size, o) {
    o = o || {};
    var t = el('text', { x: x, y: y, 'font-size': size, 'text-anchor': o.anchor || 'middle', class: 'lbl' + (o.sm ? ' sm' : ''),
      transform: o.rot ? 'rotate(' + o.rot + ' ' + x + ' ' + y + ')' : null, 'data-hit': o.hit || null }, parent);
    t.textContent = s;
    return t;
  }

  /* ---------- isometric helpers: o is the back ground corner of a footprint ---------- */
  var CX = 0.866, CY = 0.5;
  function iso(o, a, b, z) { return [o[0] + (a - b) * CX, o[1] + (a + b) * CY - (z || 0)]; }
  function quad(o, list) { return list.map(function (p) { return iso(o, p[0], p[1], p[2]); }); }

  /* Strokes from edge t0-t1 to edge b0-b1 (thatch, planks). */
  function hatch(parent, t0, t1, b0, b1, n, o) {
    o = o || {};
    var d = '';
    for (var i = 0; i <= n; i++) {
      var s = (i + rr(-0.3, 0.3)) / n; if (s < 0.03 || s > 0.97) continue;
      var a = lerp2(t0, t1, s), b = lerp2(b0, b1, s), p = lerp2(a, b, rr(0.04, 0.3)), q = lerp2(a, b, rr(0.82, 1.02));
      d += 'M' + f1(p[0]) + ' ' + f1(p[1]) + 'L' + f1(q[0] + rr(-0.5, 0.5)) + ' ' + f1(q[1]);
    }
    return el('path', { d: d, stroke: o.color || C.straw, 'stroke-width': o.w || 0.85, 'stroke-linecap': 'round', fill: 'none', opacity: o.op || 0.75 }, parent);
  }
  function fringe(parent, pts, depth) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(2, Math.round(len / 3.2));
      for (var j = 0; j < k; j++) { var p = lerp2(a, b, j / k); out.push([p[0], p[1] + (j % 2 ? depth * rr(0.5, 1.1) : 0)]); }
    }
    out.push(pts[pts.length - 1]);
    return el('path', { d: 'M' + out.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join('L'), fill: 'none', stroke: C.straw, 'stroke-width': 1, 'stroke-linejoin': 'round', opacity: 0.9 }, parent);
  }
  function post(parent, o, a, b, z0, z1, w, col) {
    return limb(parent, [iso(o, a, b, z0), iso(o, a, b, z1)], col || C.timber, w || 2.4, 0.9);
  }
  function rail(parent, o, a0, b0, a1, b1, z, w) {
    return limb(parent, [iso(o, a0, b0, z), iso(o, a1, b1, z + rr(-0.6, 0.6))], C.timberLt, w || 1.8, 0.8);
  }
  function bounds(pts) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  function hitArea(G, bb, pad) {
    pad = pad || 4;
    el('rect', { x: bb.x - pad, y: bb.y - pad, width: bb.w + pad * 2, height: bb.h + pad * 2, rx: 14, fill: '#000', 'fill-opacity': 0 }, G);
    el('rect', { x: bb.x - pad, y: bb.y - pad, width: bb.w + pad * 2, height: bb.h + pad * 2, rx: 14, class: 'focusring' }, G);
  }

  /* ---------- buildings ---------- */
  function building(parent, key, o, p) {
    var A = p.A, D = p.D, B = p.B, H = p.H, P = p.P, e = p.e, R = p.R, T = A + D, zT = P + H, zR = zT + R;
    var G = g(parent, { class: 'hit bldg', id: 'b-' + key, 'data-hit': key, tabindex: 0, role: 'button', 'aria-label': p.aria });
    var art = g(G, { filter: 'url(#wobf)' });
    var lights = [], out = { g: G, key: key };

    wash(art, quad(o, [[-4, 6, 0], [T + 12, 6, 0], [T + 12, B + 14, 0], [-4, B + 14, 0]]), '#4a3a20', { op: 0.13, amp: 2, dx: 0, dy: 0 });

    if (p.plinth) {
      shape(art, quad(o, [[0, B, 0], [T, B, 0], [T, B, P], [0, B, P]]), C.stone, { w: 1.2 });
      shape(art, quad(o, [[T, 0, 0], [T, B, 0], [T, B, P], [T, 0, P]]), '#B5A385', { w: 1.2 });
      var sd2 = '';
      for (var si = 0; si < 16; si++) { var sp = iso(o, rr(4, T - 4), B, rr(3, P - 3)); sd2 += 'M' + f1(sp[0] - 3) + ' ' + f1(sp[1] + 1.5) + 'q3 -3 6 0'; }
      el('path', { d: sd2, fill: 'none', stroke: INK, 'stroke-width': 0.7, opacity: 0.45 }, art);
    } else {
      wash(art, quad(o, [[0, B, 0], [T, B, 0], [T, 0, 0], [T, 0, P], [T, B, P], [0, B, P]]), '#5a4630', { op: 0.32, amp: 0.6, dx: 0, dy: 0 });
      [[0, B], [A * 0.5, B], [A, B], [T, B], [T, 0]].forEach(function (q) { post(art, o, q[0], q[1], 0, P, 2.6); });
    }
    shape(art, quad(o, [[0, B, P - 2.5], [T, B, P - 2.5], [T, B, P], [0, B, P]]), C.timber, { w: 1, amp: 0.3 });
    shape(art, quad(o, [[T, 0, P - 2.5], [T, B, P - 2.5], [T, B, P], [T, 0, P]]), '#6E4520', { w: 1, amp: 0.3 });
    shape(art, quad(o, [[A, 0, P], [T, 0, P], [T, B, P], [A, B, P]]), C.timberLt, { w: 1.1, amp: 0.4 });
    hatch(art, iso(o, A, 0, P), iso(o, T, 0, P), iso(o, A, B, P), iso(o, T, B, P), Math.round(D / 3.5), { color: '#7A4E26', op: 0.5, w: 0.7 });

    // walls
    shape(art, quad(o, [[0, B, P], [A, B, P], [A, B, zT], [0, B, zT]]), C.wall, { w: 1.4 });
    shape(art, quad(o, [[A, 0, P], [A, B, P], [A, B, zT], [A, 0, zT]]), C.wallSh, { w: 1.4 });
    wash(art, quad(o, [[0, B, zT - 7], [A, B, zT - 7], [A, B, zT], [0, B, zT]]), '#5b4a2e', { op: 0.16, amp: 0.4, dx: 0, dy: 0 });
    wash(art, quad(o, [[A, 0, zT - 7], [A, B, zT - 7], [A, B, zT], [A, 0, zT]]), '#5b4a2e', { op: 0.2, amp: 0.4, dx: 0, dy: 0 });

    // windows with little blue shutters
    p.win.forEach(function (w) {
      var z0 = P + H * 0.3, z1 = P + H * 0.74, q = quad(o, [[w[0], B, z0], [w[1], B, z0], [w[1], B, z1], [w[0], B, z1]]);
      shape(art, q, '#556A7C', { w: 1.2, amp: 0.3 });
      ink(art, [iso(o, (w[0] + w[1]) / 2, B, z0), iso(o, (w[0] + w[1]) / 2, B, z1)], false, { w: 1, amp: 0.2 });
      shape(art, quad(o, [[w[0] - 3.5, B, z0], [w[0], B, z0], [w[0], B, z1], [w[0] - 3.5, B, z1]]), '#5D9DB5', { w: 0.9, amp: 0.2 });
      shape(art, quad(o, [[w[1], B, z0], [w[1] + 3.5, B, z0], [w[1] + 3.5, B, z1], [w[1], B, z1]]), '#5D9DB5', { w: 0.9, amp: 0.2 });
      lights.push(q);
    });
    // door onto the deck
    var d0 = B * 0.28, d1 = B * 0.6, dz = P + H * 0.8;
    var doorway = quad(o, [[A, d0, P], [A, d1, P], [A, d1, dz], [A, d0, dz]]);
    shape(art, doorway, '#3A2A20', { w: 1.1, amp: 0.2 });
    lights.push(doorway);
    var door = g(art, { class: 'door' });
    shape(door, doorway, C.timber, { w: 1.1, amp: 0.2 });
    var knob = iso(o, A, d0 + 2.5, P + H * 0.42);
    el('circle', { cx: f1(knob[0]), cy: f1(knob[1]), r: 0.9, fill: '#F3C64B' }, door);
    out.door = door; out.doorHinge = iso(o, A, d1, P);

    // dollhouse interior, seen when the roof lifts: red-oxide floor and tiny furniture
    var intr = g(art, { class: 'interior' });
    shape(intr, quad(o, [[0, 0, zT], [A, 0, zT], [A, B, zT], [0, B, zT]]), C.wall, { w: 1.2, amp: 0.3 });
    shape(intr, quad(o, [[2.5, 2.5, zT], [A - 2.5, 2.5, zT], [A - 2.5, B - 2.5, zT], [2.5, B - 2.5, zT]]), C.oxide, { noInk: true, amp: 0.3, dx: 0, dy: 0 });
    ink(intr, [iso(o, A * 0.55, 2.5, zT), iso(o, A * 0.55, B - 2.5, zT)], false, { color: C.wall, w: 2.2, amp: 0.2 });
    (p.beds || []).forEach(function (bd) {
      shape(intr, quad(o, [[bd[0], bd[1], zT], [bd[0] + 11, bd[1], zT], [bd[0] + 11, bd[1] + 15, zT], [bd[0], bd[1] + 15, zT]]), '#FFFDF5', { w: 0.9, amp: 0.2 });
      shape(intr, quad(o, [[bd[0] + 1.5, bd[1] + 1.5, zT], [bd[0] + 9.5, bd[1] + 1.5, zT], [bd[0] + 9.5, bd[1] + 5, zT], [bd[0] + 1.5, bd[1] + 5, zT]]), C.pink, { w: 0.6, amp: 0.1, op: 0.75 });
    });
    if (p.sofa) shape(intr, quad(o, [[p.sofa[0], p.sofa[1], zT], [p.sofa[0] + 7, p.sofa[1], zT], [p.sofa[0] + 7, p.sofa[1] + 18, zT], [p.sofa[0], p.sofa[1] + 18, zT]]), '#4F8FA8', { w: 0.9, amp: 0.2 });

    // deck posts and log rails
    post(art, o, T, 0, P, zT, 2.4);
    rail(art, o, T, 0, T, B, P + 6); rail(art, o, T, 0, T, B, P + 11);
    var gap = p.stairs || null;
    if (gap) { rail(art, o, A, B, gap[0], B, P + 6); rail(art, o, A, B, gap[0], B, P + 11); rail(art, o, gap[1], B, T, B, P + 6); rail(art, o, gap[1], B, T, B, P + 11); }
    else { rail(art, o, A, B, T, B, P + 6); rail(art, o, A, B, T, B, P + 11); }
    (gap ? [T, gap[0], gap[1]] : [T, A + D * 0.5]).forEach(function (a) { post(art, o, a, B, P, zT, 2.4); });

    if (gap) { // long log staircase down to the garden
      var k = 5, sd = 5.5, s0 = gap[0], s1 = gap[1], hz = P / (k + 1);
      for (var i = 0; i < k; i++) {
        var z = P - (i + 1) * hz, b0 = B + i * sd, b1 = B + (i + 1) * sd;
        shape(art, quad(o, [[s0, b0, z], [s1, b0, z], [s1, b1, z], [s0, b1, z]]), C.timberLt, { w: 0.9, amp: 0.2 });
        shape(art, quad(o, [[s0, b1, z], [s1, b1, z], [s1, b1, z - hz], [s0, b1, z - hz]]), C.timber, { w: 0.9, amp: 0.2 });
      }
      limb(art, [iso(o, s0, B, P + 11), iso(o, s0, B + k * sd, 9)], C.timberLt, 1.8, 0.8);
      limb(art, [iso(o, s1, B, P + 11), iso(o, s1, B + k * sd, 9)], C.timberLt, 1.8, 0.8);
      post(art, o, s0, B + k * sd, 0, 10, 2.2); post(art, o, s1, B + k * sd, 0, 10, 2.2);
      out.stairsFoot = iso(o, (s0 + s1) / 2, B + k * sd + 7, 0);
    }

    // hip roof with thatch hatching
    var roof = g(G, { class: 'roof', filter: 'url(#wobf)' });
    var r0a = -e + (B / 2 + e), r1a = T + e - (B / 2 + e);
    var E00 = iso(o, -e, -e, zT), E10 = iso(o, T + e, -e, zT), E11 = iso(o, T + e, B + e, zT), E01 = iso(o, -e, B + e, zT),
        R0 = iso(o, r0a, B / 2, zR), R1 = iso(o, r1a, B / 2, zR);
    shape(roof, [E00, E10, R1, R0], C.thatchDk, { noInk: true, dx: 0, dy: 0 });
    shape(roof, [E00, R0, E01], C.thatchDk, { noInk: true, dx: 0, dy: 0 });
    shape(roof, [E10, E11, R1], C.thatch, { w: 1.4, edge: C.straw });
    hatch(roof, R1, R1, E10, E11, 12, {});
    shape(roof, [E01, E11, R1, R0], C.thatchLt, { w: 1.4, edge: C.straw });
    hatch(roof, R0, R1, E01, E11, Math.round(Math.hypot(E11[0] - E01[0], E11[1] - E01[1]) / 3.2), {});
    [0.42, 0.72].forEach(function (s) { ink(roof, [lerp2(R0, E01, s), lerp2(R1, E11, s)], false, { color: C.straw, w: 1, amp: 0.7, op: 0.8 }); });
    fringe(roof, [E01, E11, E10], 2.6);
    limb(roof, [lerp2(R0, R1, -0.03), lerp2(R0, R1, 1.03)], '#7A5A2C', 2.2, 0.9);
    if (p.loft) {
      var lc = lerp2(lerp2(R0, R1, 0.5), lerp2(E01, E11, 0.5), 0.36);
      var lw = blob(lc[0], lc[1], 7, 4.6, 12, 0.03);
      shape(roof, lw, '#556A7C', { w: 1.3, amp: 0.2 });
      ink(roof, [[lc[0] - 7, lc[1] - 1], [lc[0], lc[1] - 6.5], [lc[0] + 7, lc[1] - 1]], false, { color: C.straw, w: 1.6, amp: 0.3 });
      out.loft = lw;
    }
    out.roof = roof;
    out.roofPivot = lerp2(R0, R1, 0.5);
    out.lights = lights;
    var bb = bounds([E00, E10, E11, E01, R0, R1, iso(o, 0, B, 0), iso(o, T, B, 0), iso(o, T, 0, 0)].concat(out.stairsFoot ? [out.stairsFoot] : []));
    hitArea(G, bb, 2);
    out.bb = bb;
    out.hang = [iso(o, T, 4, zT - 4), iso(o, T, B - 4, zT - 4)];
    return out;
  }

  /* ---------- plants ---------- */
  function frond(parent, s, ang, L, droop) {
    var a = ang * Math.PI / 180, E = [s[0] + Math.cos(a) * L, s[1] + Math.sin(a) * L * 0.75 + L * droop];
    var M = [s[0] + (E[0] - s[0]) * 0.5, s[1] + (E[1] - s[1]) * 0.5 - L * 0.32];
    var dx = E[0] - s[0], dy = E[1] - s[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, w = L * 0.17;
    var d = 'M' + f1(s[0]) + ' ' + f1(s[1]) + 'Q' + f1(M[0] + nx * w) + ' ' + f1(M[1] + ny * w) + ' ' + f1(E[0]) + ' ' + f1(E[1]) +
            'Q' + f1(M[0] - nx * w) + ' ' + f1(M[1] - ny * w) + ' ' + f1(s[0]) + ' ' + f1(s[1]) + 'Z';
    el('path', { d: d, fill: rand() < 0.5 ? C.dune : C.duneLt, 'fill-opacity': 0.92, stroke: C.duneDk, 'stroke-width': 0.6 }, parent);
    var t = '';
    for (var i = 1; i < 8; i++) {
      var tt = i / 8.5, p = qpt(s, M, E, tt), sgn = i % 2 ? 1 : -1, ln = w * 1.2 * (1 - tt * 0.6);
      t += 'M' + f1(p[0]) + ' ' + f1(p[1]) + 'l' + f1((nx * sgn + dx / len * 0.6) * ln) + ' ' + f1((ny * sgn + dy / len * 0.6) * ln + 1.2);
    }
    el('path', { d: t, stroke: C.duneDk, 'stroke-width': 0.8, fill: 'none', 'stroke-linecap': 'round' }, parent);
    el('path', { d: 'M' + f1(s[0]) + ' ' + f1(s[1]) + 'Q' + f1(M[0]) + ' ' + f1(M[1]) + ' ' + f1(E[0]) + ' ' + f1(E[1]), stroke: INK, 'stroke-width': 1, fill: 'none', 'stroke-linecap': 'round' }, parent);
  }
  var PALMS = [];
  function palm(parent, x, y, h, lean, sc) {
    sc = sc || 1;
    var G = g(parent, { class: 'palm' });
    el('ellipse', { cx: x + 4, cy: y + 1, rx: 12 * sc, ry: 3.5 * sc, fill: '#4a3a20', opacity: 0.14 }, G);
    var top = [x + lean, y - h];
    limb(G, [[x, y], [x + lean * 0.15, y - h * 0.5], top], '#A88D66', 4 * sc, 1.1);
    var rings = '';
    for (var i = 1; i < 9; i++) { var p = qpt([x, y], [x + lean * 0.15, y - h * 0.5], top, i / 9.5); rings += 'M' + f1(p[0] - 1.8 * sc) + ' ' + f1(p[1]) + 'q1.8 1.4 3.6 0'; }
    el('path', { d: rings, stroke: INK, 'stroke-width': 0.7, fill: 'none', opacity: 0.6 }, G);
    var crown = g(G, { class: 'crown' });
    var L = 26 * sc;
    [-172, -145, -112, -70, -35, -8, 18].forEach(function (a) { frond(crown, top, a + rr(-8, 8), L * rr(0.85, 1.1), rr(0.25, 0.45)); });
    [[-2.5, 2.5], [2, 3], [0, 4.5]].forEach(function (c) { el('circle', { cx: f1(top[0] + c[0] * sc), cy: f1(top[1] + c[1] * sc), r: f1(2.2 * sc), fill: '#7A5A2C', stroke: INK, 'stroke-width': 0.7 }, crown); });
    var r = { g: G, crown: crown, top: top };
    PALMS.push(r);
    return r;
  }
  function casuarina(parent, x, y, h) {
    var G = g(parent);
    el('ellipse', { cx: x + 3, cy: y + 1, rx: 9, ry: 3, fill: '#4a3a20', opacity: 0.14 }, G);
    limb(G, [[x, y], [x, y - h * 0.3]], '#7A5A3C', 2.4, 0.9);
    shape(G, [[x, y - h], [x + h * 0.16, y - h * 0.62], [x + h * 0.2, y - h * 0.3], [x - h * 0.2, y - h * 0.28], [x - h * 0.15, y - h * 0.62]], '#5E7A45', { w: 1.2, amp: 1.6, step: 8 });
    var d = '';
    for (var i = 0; i < 9; i++) { var px = x + rr(-h * 0.13, h * 0.13), py = y - h * rr(0.36, 0.85); d += 'M' + f1(px) + ' ' + f1(py) + 'l' + f1(rr(-1, 1)) + ' ' + f1(rr(5, 9)); }
    el('path', { d: d, stroke: '#3E5A2E', 'stroke-width': 0.9, fill: 'none', 'stroke-linecap': 'round' }, G);
    return G;
  }
  function bush(parent, x, y, r, col) {
    var G = g(parent);
    el('ellipse', { cx: x + 2, cy: y + r * 0.5, rx: r * 1.1, ry: r * 0.35, fill: '#4a3a20', opacity: 0.12 }, G);
    shape(G, blob(x, y, r, r * 0.72, 11, 0.16), col || C.dune, { w: 1.1, amp: 0.6, step: 6 });
    var d = '';
    for (var i = 0; i < 4; i++) { var a = rr(0, Math.PI * 2); d += 'M' + f1(x + Math.cos(a) * r * 0.45) + ' ' + f1(y + Math.sin(a) * r * 0.3) + 'q2 -2 4 0'; }
    el('path', { d: d, stroke: C.duneDk, 'stroke-width': 0.8, fill: 'none' }, G);
    return G;
  }
  function bougainvillea(parent, x, y, r) {
    var G = g(parent);
    bush(G, x, y, r, '#5E8443');
    for (var i = 0; i < 9; i++) {
      var a = rr(0, Math.PI * 2), d = rr(0, r * 0.8);
      shape(G, blob(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.62 - 1, rr(2.6, 4.4), rr(2.2, 3.6), 7, 0.2), rand() < 0.65 ? C.pink : '#F07AA5', { noInk: true, dx: 0, dy: 0, op: 0.9 });
    }
    for (var j = 0; j < 7; j++) el('circle', { cx: f1(x + rr(-r, r) * 0.8), cy: f1(y + rr(-r, r) * 0.5), r: 0.9, fill: C.pinkDk }, G);
    return G;
  }
  function aloe(parent, x, y, s) {
    s = s || 1;
    var G = g(parent);
    limb(G, [[x, y - 4 * s], [x + 1, y - 18 * s]], '#7E7A3A', 1.2, 0.6);
    for (var k = 0; k < 4; k++) el('ellipse', { cx: x + 1, cy: f1(y - (13 + k * 2) * s), rx: 1.6, ry: 1.4, fill: '#E8663A' }, G);
    [-60, -35, -12, 12, 35, 60, -80, 80].forEach(function (a) {
      var r = a * Math.PI / 180, L = 9 * s * (Math.abs(a) > 70 ? 0.7 : 1);
      shape(G, [[x - 1.6, y], [x + Math.sin(r) * L, y - Math.cos(r) * L * 0.8], [x + 1.6, y]], '#7E9C7A', { w: 0.8, amp: 0.1, dx: 0, dy: 0 });
    });
    return G;
  }
  function tufts(parent, list, col) {
    var d = '';
    list.forEach(function (p) { d += 'M' + f1(p[0]) + ' ' + f1(p[1]) + 'l-2 -5M' + f1(p[0]) + ' ' + f1(p[1]) + 'l0.6 -6.5M' + f1(p[0]) + ' ' + f1(p[1]) + 'l2.6 -4.5'; });
    el('path', { d: d, stroke: col || C.duneDk, 'stroke-width': 0.9, fill: 'none', 'stroke-linecap': 'round', opacity: 0.8 }, parent);
  }

  /* ---------- characters ---------- */
  // Pedro: friendly placeholder until the owner's reference photo arrives.
  // Swap this one function to change his look. Feet at (0,0).
  function drawPedro(parent, x, y) {
    var P = g(parent, { id: 'pedro', class: 'hit', 'data-hit': 'pedro', tabindex: 0, role: 'button', 'aria-label': 'Pedro, the housekeeper: tap for a fact', transform: 'translate(' + x + ' ' + y + ')' });
    el('rect', { x: -16, y: -58, width: 32, height: 62, rx: 10, fill: '#000', 'fill-opacity': 0 }, P);
    el('rect', { x: -16, y: -58, width: 32, height: 62, rx: 10, class: 'focusring' }, P);
    el('ellipse', { cx: 1, cy: 0, rx: 11, ry: 3.2, fill: INK, opacity: 0.18 }, P);
    var body = g(P, { class: 'pedro-body' });
    shape(body, [[-6, -14], [-2, -14], [-2.4, -1], [-5.8, -1]], C.skin, { w: 1.1, amp: 0.2, step: 5 });
    shape(body, [[2, -14], [6, -14], [5.8, -1], [2.4, -1]], C.skin, { w: 1.1, amp: 0.2, step: 5 });
    el('ellipse', { cx: -4.3, cy: -0.6, rx: 3.6, ry: 1.5, fill: '#5b3a22', stroke: INK, 'stroke-width': 0.8 }, body);
    el('ellipse', { cx: 4.3, cy: -0.6, rx: 3.6, ry: 1.5, fill: '#5b3a22', stroke: INK, 'stroke-width': 0.8 }, body);
    shape(body, [[-8.2, -23], [8.2, -23], [8.8, -12], [1, -12], [0, -15], [-1, -12], [-8.8, -12]], '#CDB27A', { w: 1.2, amp: 0.2, step: 5 });
    limb(body, [[-9, -34], [-12.2, -25], [-11, -17.5]], C.skin, 3, 1);
    shape(body, [[-9.5, -35], [-4, -38.5], [4, -38.5], [9.5, -35], [9.8, -21], [-9.8, -21]], '#3E8E7E', { w: 1.2, amp: 0.3, step: 5 });
    shape(body, [[-3.4, -38.4], [0, -33], [3.4, -38.4]], '#F7F0E2', { w: 0.9, amp: 0.1 });
    [-29, -25].forEach(function (cy) { el('circle', { cx: 0.3, cy: cy, r: 0.75, fill: '#F7F0E2' }, body); });
    var arm = g(body, { class: 'pedro-arm' });
    limb(arm, [[8.6, -34], [12.6, -25], [11.4, -17.5]], C.skin, 3, 1);
    el('circle', { cx: 11.4, cy: -16.6, r: 2.2, fill: C.skin, stroke: INK, 'stroke-width': 0.9 }, arm);
    var head = g(body, { class: 'pedro-head' });
    el('rect', { x: -2, y: -41, width: 4, height: 4, fill: C.skin }, head);
    el('circle', { cx: -7.4, cy: -45, r: 1.9, fill: C.skin, stroke: INK, 'stroke-width': 0.9 }, head);
    el('circle', { cx: 7.4, cy: -45, r: 1.9, fill: C.skin, stroke: INK, 'stroke-width': 0.9 }, head);
    shape(head, blob(0, -46, 7.6, 8, 14, 0.03), C.skin, { w: 1.3, amp: 0.2, dx: 0, dy: 0 });
    el('path', { d: 'M-7.2 -47.5Q-7 -55.5 0 -55.4Q7 -55.5 7.2 -47.5Q4 -50.6 0 -50.4Q-4 -50.6 -7.2 -47.5Z', fill: '#1d1410', stroke: INK, 'stroke-width': 0.8 }, head);
    el('ellipse', { cx: -2.7, cy: -46.4, rx: 1.15, ry: 1.45, fill: '#1d1410' }, head);
    el('ellipse', { cx: 2.7, cy: -46.4, rx: 1.15, ry: 1.45, fill: '#1d1410' }, head);
    el('circle', { cx: -2.3, cy: -46.9, r: 0.45, fill: '#fff' }, head);
    el('circle', { cx: 3.1, cy: -46.9, r: 0.45, fill: '#fff' }, head);
    el('path', { d: 'M-3 -42.4Q0 -39.6 3 -42.4', fill: 'none', stroke: '#1d1410', 'stroke-width': 1.1, 'stroke-linecap': 'round' }, head);
    el('circle', { cx: -4.6, cy: -43.4, r: 1.3, fill: C.pink, opacity: 0.3 }, head);
    el('circle', { cx: 4.6, cy: -43.4, r: 1.3, fill: C.pink, opacity: 0.3 }, head);
    return { g: P, body: body, arm: arm, head: head, shoulder: [8.6, -34], x: x, y: y };
  }

  // Tofu the dog: sandy mutt, one floppy ear, red bandana. Faces right. Feet at (0,0).
  function drawDog(parent) {
    var D = g(parent, { id: 'dog', class: 'hit', 'data-hit': 'dog', tabindex: 0, role: 'button', 'aria-label': 'Tofu the dog: tap to time the walk to the beach' });
    var flip = g(D, { class: 'dog-flip' });
    el('rect', { x: -26, y: -42, width: 56, height: 46, rx: 12, fill: '#000', 'fill-opacity': 0 }, flip);
    el('rect', { x: -26, y: -42, width: 56, height: 46, rx: 12, class: 'focusring' }, flip);
    el('ellipse', { cx: 1, cy: 0, rx: 15, ry: 3, fill: INK, opacity: 0.18 }, flip);
    var bodyG = g(flip, { class: 'dog-body' });
    var sandy = '#D9B77E', dark = '#B48A52', light = '#F0DDB3';
    var tail = g(bodyG, { class: 'dog-tail' });
    limb(tail, [[-11, -15], [-17, -18], [-18.5, -26]], sandy, 3, 1);
    var legs = {};
    [['bl', -8], ['fl', 6]].forEach(function (L) { legs[L[0]] = g(bodyG); limb(legs[L[0]], [[L[1], -10], [L[1] - 0.5, -0.8]], dark, 3.2, 1); });
    shape(bodyG, blob(0, -14, 13.5, 7.5, 14, 0.04), sandy, { w: 1.3, amp: 0.2, dx: 0, dy: 0 });
    shape(bodyG, blob(-1, -10.5, 8, 3, 10, 0.05), light, { noInk: true, dx: 0, dy: 0 });
    el('path', { d: 'M-4 -19q2 1.5 4 0', stroke: dark, 'stroke-width': 1.2, fill: 'none' }, bodyG);
    [['br', -5], ['fr', 9.5]].forEach(function (L) { legs[L[0]] = g(bodyG); limb(legs[L[0]], [[L[1], -10], [L[1] + 0.5, -0.8]], sandy, 3.2, 1); });
    var head = g(bodyG, { class: 'dog-head' });
    shape(head, [[10, -28], [11.5, -37.5], [16, -29]], dark, { w: 1.1, amp: 0.1, dx: 0, dy: 0 });
    shape(head, blob(14, -23, 8, 7.6, 14, 0.03), sandy, { w: 1.3, amp: 0.2, dx: 0, dy: 0 });
    shape(head, blob(20.5, -20, 5.6, 3.9, 12, 0.03), light, { w: 1.1, amp: 0.1, dx: 0, dy: 0 });
    el('ellipse', { cx: 25.2, cy: -21.2, rx: 2, ry: 1.6, fill: '#1d1410' }, head);
    el('path', { d: 'M20 -17.6q2 1.6 4.4 0', stroke: INK, 'stroke-width': 0.9, fill: 'none', 'stroke-linecap': 'round' }, head);
    var tongue = el('ellipse', { cx: 21.8, cy: -15.6, rx: 1.7, ry: 2.3, fill: '#E86A82', stroke: INK, 'stroke-width': 0.7, opacity: 0 }, head);
    el('circle', { cx: 15.6, cy: -24.6, r: 3.1, fill: '#fff', stroke: INK, 'stroke-width': 0.9 }, head);
    el('circle', { cx: 16.4, cy: -24.3, r: 2, fill: '#1d1410' }, head);
    el('circle', { cx: 17, cy: -25.1, r: 0.7, fill: '#fff' }, head);
    el('path', { d: 'M13.5 -29q2.4 -1.4 4.6 0', stroke: INK, 'stroke-width': 0.8, fill: 'none' }, head);
    var ear = g(head, { class: 'dog-ear' });
    shape(ear, [[8.6, -28], [12.8, -28.4], [10.4, -18.5], [6.6, -19.5]], dark, { w: 1.1, amp: 0.2, dx: 0, dy: 0 });
    shape(bodyG, [[8, -19.5], [16.5, -17], [11.5, -10.5]], '#D8343C', { w: 1.1, amp: 0.1, dx: 0, dy: 0 });
    el('circle', { cx: 11.5, cy: -15.5, r: 0.8, fill: '#fff' }, bodyG);
    el('circle', { cx: 13.6, cy: -16.6, r: 0.6, fill: '#fff' }, bodyG);
    return { g: D, flip: flip, body: bodyG, tail: tail, legs: legs, head: head, ear: ear, tongue: tongue };
  }

  /* ---------- small delights ---------- */
  function drawChicken(parent, x, y) {
    var G = g(parent, { id: 'chicken', class: 'hit', 'data-hit': 'chicken', tabindex: 0, role: 'button', 'aria-label': 'A chicken in the garden' });
    var b = g(G, { class: 'chick-body' });
    el('rect', { x: -16, y: -26, width: 32, height: 30, rx: 8, fill: '#000', 'fill-opacity': 0 }, b);
    el('rect', { x: -16, y: -26, width: 32, height: 30, rx: 8, class: 'focusring' }, b);
    el('ellipse', { cx: 0, cy: 0, rx: 8, ry: 2.2, fill: INK, opacity: 0.16 }, b);
    limb(b, [[-1.5, -6], [-2, 0]], '#E8A23A', 0.9, 0.5); limb(b, [[2, -6], [2.5, 0]], '#E8A23A', 0.9, 0.5);
    shape(b, [[-9, -14], [-6, -17], [-7, -11]], '#F7F0E2', { w: 1, amp: 0.1, dx: 0, dy: 0 });
    shape(b, blob(0, -10, 7.5, 5, 12, 0.05), '#FFFCF4', { w: 1.2, amp: 0.2, dx: 0, dy: 0 });
    el('path', { d: 'M-3 -11q3 2 5 -1', stroke: INK, 'stroke-width': 0.8, fill: 'none' }, b);
    var h = g(b, { class: 'chick-head' });
    shape(h, blob(6, -16, 3.6, 3.6, 10, 0.03), '#FFFCF4', { w: 1.1, amp: 0.1, dx: 0, dy: 0 });
    shape(h, [[4.6, -19.2], [5.6, -21.6], [6.6, -19.8], [7.8, -21.4], [8.2, -18.8]], '#D8343C', { w: 0.7, amp: 0.05, dx: 0, dy: 0 });
    shape(h, [[9.2, -16.6], [12.2, -15.4], [9.2, -14.6]], '#E8A23A', { w: 0.7, amp: 0.05, dx: 0, dy: 0 });
    el('ellipse', { cx: 9, cy: -13.4, rx: 1, ry: 1.4, fill: '#D8343C' }, h);
    el('circle', { cx: 7, cy: -16.8, r: 0.8, fill: '#1d1410' }, h);
    return { g: G, body: b, head: h, x: x, y: y };
  }
  function drawWashing(parent, a, b) {
    var G = g(parent, { id: 'washing', class: 'hit', 'data-hit': 'washing', tabindex: 0, role: 'button', 'aria-label': 'Washing on the line' });
    hitArea(G, { x: a[0] - 6, y: Math.min(a[1], b[1]) - 30, w: b[0] - a[0] + 12, h: Math.abs(b[1] - a[1]) + 34 }, 2);
    [a, b].forEach(function (p) { limb(G, [p, [p[0], p[1] - 26]], C.timber, 1.6, 0.8); limb(G, [[p[0] - 4, p[1] - 25], [p[0] + 4, p[1] - 26]], C.timber, 1.4, 0.7); });
    var A = [a[0], a[1] - 24], Bp = [b[0], b[1] - 24], mid = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2 + 6];
    el('path', { d: 'M' + A[0] + ' ' + A[1] + 'Q' + mid[0] + ' ' + mid[1] + ' ' + Bp[0] + ' ' + Bp[1], stroke: INK, 'stroke-width': 0.8, fill: 'none' }, G);
    var items = [];
    [['#E8407A', 'shirt'], ['#4F8FA8', 'towel'], ['#F3C64B', 'shorts'], ['#FFFDF5', 'plain'], ['#D8343C', 'sock']].forEach(function (c, i, arr) {
      var p = qpt(A, [mid[0], mid[1] + 3], Bp, (i + 0.8) / (arr.length + 0.6));
      var x = p[0], y = p[1] + 0.5, pts;
      var it = g(G, { class: 'cloth' });
      if (c[1] === 'shirt') pts = [[x - 5, y], [x + 5, y], [x + 7, y + 3], [x + 4.5, y + 4.5], [x + 4.5, y + 11], [x - 4.5, y + 11], [x - 4.5, y + 4.5], [x - 7, y + 3]];
      else if (c[1] === 'shorts') pts = [[x - 4.5, y], [x + 4.5, y], [x + 5, y + 8], [x + 1, y + 8], [x, y + 4], [x - 1, y + 8], [x - 5, y + 8]];
      else if (c[1] === 'sock') pts = [[x - 1.5, y], [x + 1.5, y], [x + 1.5, y + 6], [x + 4, y + 7], [x + 4, y + 9], [x - 1.5, y + 9]];
      else pts = [[x - 4, y], [x + 4, y], [x + 4.4, y + 12], [x - 4.2, y + 12]];
      shape(it, pts, c[0], { w: 0.9, amp: 0.2, dx: 0, dy: 0 });
      if (c[1] === 'towel') ink(it, [[x - 4, y + 9], [x + 4.3, y + 9]], false, { color: '#fff', w: 1.2, amp: 0.1 });
      el('rect', { x: f1(x - 0.7), y: f1(y - 1.6), width: 1.4, height: 2.6, fill: '#B9824C' }, it);
      it._pin = [x, y];
      items.push(it);
    });
    return { g: G, items: items };
  }
  function drawKettle(parent, x, y) {
    var G = g(parent, { id: 'kettle', class: 'hit', 'data-hit': 'kettle', tabindex: 0, role: 'button', 'aria-label': 'Kettle on the fire by the big house', transform: 'translate(' + x + ' ' + y + ')' });
    el('rect', { x: -14, y: -28, width: 28, height: 32, rx: 8, fill: '#000', 'fill-opacity': 0 }, G);
    el('rect', { x: -14, y: -28, width: 28, height: 32, rx: 8, class: 'focusring' }, G);
    var flame = g(G, { class: 'flame' });
    shape(flame, [[-4.5, -2], [-2.5, -7], [-0.6, -4], [0.8, -9], [2.4, -4.5], [4.5, -6.5], [4.6, -2]], '#F08A2A', { w: 0.8, amp: 0.1, dx: 0, dy: 0 });
    shape(flame, [[-2, -2], [0.6, -6], [2.4, -2]], '#FFD24A', { noInk: true, dx: 0, dy: 0 });
    [[-6, 0], [6, 0], [0, 1.5]].forEach(function (s) { shape(G, blob(s[0], s[1], 3.4, 2.2, 8, 0.1), '#9C958A', { w: 0.9, amp: 0.1, dx: 0, dy: 0 }); });
    var k = g(G, { class: 'kettle-pot' });
    shape(k, [[-6, -8], [6, -8], [5, -15], [2.5, -17], [-2.5, -17], [-5, -15]], '#C8463C', { w: 1.2, amp: 0.15, dx: 0, dy: 0 });
    shape(k, [[5.5, -11], [10.5, -16], [11, -15], [6, -9]], '#C8463C', { w: 1, amp: 0.05, dx: 0, dy: 0 });
    el('path', { d: 'M-3.5 -17Q0 -24 3.5 -17', stroke: INK, 'stroke-width': 1.1, fill: 'none' }, k);
    el('ellipse', { cx: 0, cy: -17.2, rx: 1.4, ry: 0.8, fill: INK }, k);
    [[-2.6, -12], [1.8, -14], [2.6, -10.5]].forEach(function (s) { el('circle', { cx: s[0], cy: s[1], r: 0.9, fill: '#fff', opacity: 0.85 }, k); });
    var puffs = [];
    for (var i = 0; i < 3; i++) puffs.push(el('path', { d: 'M10.6 -17c-2 -2 2 -4 0 -6s2 -4 0 -6', stroke: '#fff', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round', opacity: 0 }, G));
    return { g: G, pot: k, flame: flame, puffs: puffs, x: x, y: y };
  }
  function drawHammock(parent, key, p1, p2) {
    var G = g(parent, { class: 'hit hammock', 'data-hit': 'hammock', 'aria-label': 'Hammock on Cottage ' + key });
    var mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    el('rect', { x: f1(Math.min(p1[0], p2[0]) - 4), y: f1(Math.min(p1[1], p2[1]) - 2), width: f1(Math.abs(p2[0] - p1[0]) + 8), height: f1(Math.abs(p2[1] - p1[1]) + 20), fill: '#000', 'fill-opacity': 0 }, G);
    var sw = g(G, { class: 'swing' });
    var a = lerp2(p1, p2, 0.16), b = lerp2(p2, p1, 0.16), c = [mid[0], mid[1] + 13];
    el('path', { d: 'M' + f1(p1[0]) + ' ' + f1(p1[1]) + 'L' + f1(a[0]) + ' ' + f1(a[1] + 4) + 'M' + f1(p2[0]) + ' ' + f1(p2[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1] + 4), stroke: INK, 'stroke-width': 0.7 }, sw);
    el('path', { d: 'M' + f1(a[0]) + ' ' + f1(a[1] + 4) + 'Q' + f1(c[0]) + ' ' + f1(c[1] - 2) + ' ' + f1(b[0]) + ' ' + f1(b[1] + 4) + 'Q' + f1(c[0]) + ' ' + f1(c[1] + 6) + ' ' + f1(a[0]) + ' ' + f1(a[1] + 4) + 'Z', fill: '#E8663A', stroke: INK, 'stroke-width': 1 }, sw);
    el('path', { d: 'M' + f1(a[0] + 2) + ' ' + f1(a[1] + 6) + 'Q' + f1(c[0]) + ' ' + f1(c[1] + 1.5) + ' ' + f1(b[0] - 2) + ' ' + f1(b[1] + 6), stroke: '#F3C64B', 'stroke-width': 1.6, fill: 'none' }, sw);
    el('path', { d: 'M' + f1(a[0] + 3) + ' ' + f1(a[1] + 7.5) + 'Q' + f1(c[0]) + ' ' + f1(c[1] + 4) + ' ' + f1(b[0] - 3) + ' ' + f1(b[1] + 7.5), stroke: '#4F8FA8', 'stroke-width': 1.3, fill: 'none' }, sw);
    return { g: G, swing: sw, pivot: mid };
  }
  function drawCar(parent, o) {
    var G = g(parent, { id: 'car', class: 'hit', 'data-hit': 'car', tabindex: 0, role: 'button', 'aria-label': 'A small car: 2WD gets here' });
    var c = g(G, { class: 'car-body' });
    wash(c, quad(o, [[-2, 2, 0], [30, 2, 0], [30, 18, 0], [-2, 18, 0]]), '#4a3a20', { op: 0.16, dx: 0, dy: 0 });
    [[24, 0.5]].forEach(function (w) { var p = iso(o, w[0], w[1], 3); el('ellipse', { cx: f1(p[0]), cy: f1(p[1]), rx: 3, ry: 3.2, fill: '#2b211a' }, c); });
    shape(c, quad(o, [[0, 15, 3], [28, 15, 3], [28, 15, 10], [0, 15, 10]]), '#7FB3C9', { w: 1.1, amp: 0.2 });
    shape(c, quad(o, [[28, 0, 3], [28, 15, 3], [28, 15, 10], [28, 0, 10]]), '#5F97AE', { w: 1.1, amp: 0.2 });
    shape(c, quad(o, [[0, 0, 10], [28, 0, 10], [28, 15, 10], [0, 15, 10]]), '#9CCBDB', { w: 1.1, amp: 0.2 });
    shape(c, quad(o, [[8, 13.5, 10], [21, 13.5, 10], [20, 13.5, 16], [8, 13.5, 16]]), '#3E5566', { w: 1, amp: 0.1 });
    shape(c, quad(o, [[21, 1.5, 10], [21, 13.5, 10], [20, 13.5, 16], [20, 1.5, 16]]), '#3E5566', { w: 1, amp: 0.1 });
    shape(c, quad(o, [[8, 1.5, 16], [20, 1.5, 16], [20, 13.5, 16], [8, 13.5, 16]]), '#B5DCE8', { w: 1, amp: 0.2 });
    [[4, 15], [24, 15]].forEach(function (w) { var p = iso(o, w[0], w[1] + 0.5, 3); el('ellipse', { cx: f1(p[0]), cy: f1(p[1]), rx: 3.1, ry: 3.3, fill: '#2b211a', stroke: INK, 'stroke-width': 0.8 }, c); el('circle', { cx: f1(p[0]), cy: f1(p[1]), r: 1.1, fill: '#CFC7B8' }, c); });
    var hl = iso(o, 28, 4, 6.5); el('circle', { cx: f1(hl[0]), cy: f1(hl[1]), r: 1.3, fill: '#FFF3C4', stroke: INK, 'stroke-width': 0.6 }, c);
    hitArea(G, bounds(quad(o, [[0, 0, 16], [28, 0, 16], [28, 15, 0], [0, 15, 0], [28, 0, 0]])), 4);
    return { g: G, body: c };
  }
  function drawShark(parent, x, y) {
    var G = g(parent, { id: 'shark', class: 'hit', 'data-hit': 'shark', tabindex: 0, role: 'button', 'aria-label': 'A whale shark in the bay' });
    var s = g(G, { class: 'shark-body', opacity: 0.85 });
    el('rect', { x: -30, y: -14, width: 60, height: 26, rx: 10, fill: '#000', 'fill-opacity': 0 }, s);
    shape(s, [[-20, -1], [-28, -8], [-26, 0], [-28, 7], [-20, 1]], '#4E6A80', { w: 1, amp: 0.1, dx: 0, dy: 0 });
    shape(s, [[-21, 0], [-12, -4.5], [4, -6], [16, -4], [21, -1], [21, 2], [12, 4.5], [-6, 4.5], [-21, 1.5]], '#5C7A92', { w: 1.2, amp: 0.2, dx: 0, dy: 0 });
    shape(s, [[-4, -5.5], [0, -11], [3, -5.8]], '#4E6A80', { w: 1, amp: 0.1, dx: 0, dy: 0 });
    shape(s, [[2, 3], [5, 8], [8, 3.5]], '#4E6A80', { w: 0.9, amp: 0.1, dx: 0, dy: 0 });
    for (var i = 0; i < 16; i++) el('circle', { cx: f1(rr(-17, 16)), cy: f1(rr(-3.5, 2.5)), r: f1(rr(0.5, 0.95)), fill: '#fff', opacity: 0.9 }, s);
    el('circle', { cx: 16, cy: -1.2, r: 0.9, fill: '#1d1410' }, s);
    el('path', { d: 'M18 1.8q2 0.6 3 -0.2', stroke: INK, 'stroke-width': 0.7, fill: 'none' }, s);
    return { g: G, body: s, x: x, y: y };
  }
  function drawDhow(parent, x, y) {
    var G = g(parent, { id: 'dhow', class: 'hit', 'data-hit': 'dhow', 'aria-label': 'A dhow on the horizon' });
    var b = g(G, { class: 'dhow-body' });
    el('rect', { x: -16, y: -26, width: 32, height: 32, rx: 6, fill: '#000', 'fill-opacity': 0 }, b);
    shape(b, [[-12, 0], [12, -1.5], [9, 3.5], [-9, 3.5]], C.timber, { w: 1, amp: 0.1, dx: 0, dy: 0 });
    limb(b, [[0, 0], [0, -18]], C.timber, 0.9, 0.5);
    shape(b, [[-8, -21], [7, -4], [0, -2.5], [-8, -9]], '#FBF4E2', { w: 1, amp: 0.2, dx: 0, dy: 0 });
    ink(b, [[-10, -22], [8, -3]], false, { w: 1, amp: 0.1 });
    return { g: G, body: b, x: x, y: y };
  }
  function star(parent, x, y, r) {
    var d = '';
    for (var i = 0; i < 3; i++) { var a = i * Math.PI / 3 + rr(-0.2, 0.2); d += 'M' + f1(x - Math.cos(a) * r) + ' ' + f1(y - Math.sin(a) * r) + 'L' + f1(x + Math.cos(a) * r) + ' ' + f1(y + Math.sin(a) * r); }
    return el('path', { d: d, stroke: '#FBF1D8', 'stroke-width': 1.3, 'stroke-linecap': 'round', fill: 'none' }, parent);
  }

  /* ================================================================== */
  var CORE = { x: 40, y: 40, w: 520, h: 830 };
  var WIDE = [-900, 1500];   // how far the land runs sideways for wide screens

  function buildPaint(svg) {
    var defs = el('defs', null, svg);
    defs.innerHTML =
      '<filter id="wc" x="-2%" y="-4%" width="104%" height="108%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="5" result="n"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="11" result="m"/>' +
        '<feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.32" result="ma"/>' +
        '<feComposite in="d" in2="ma" operator="in"/>' +
      '</filter>' +
      '<linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE6F2" stop-opacity="0"/><stop offset="1" stop-color="#CFE6F2" stop-opacity=".95"/></linearGradient>';
    var L = WIDE[0], Rt = WIDE[1];
    var base = g(svg);
    el('rect', { x: L, y: -900, width: Rt - L, height: 962, fill: 'url(#skyg)' }, base);
    el('rect', { x: L, y: 190, width: Rt - L, height: 1400, fill: '#D9D29F', 'fill-opacity': 0.6 }, base);
    var washes = g(base, { filter: 'url(#wc)' });
    var seaTop = [], seaBot = [], sandBot = [];
    for (var x = L; x <= Rt; x += 120) { seaBot.push([x, 172 + rr(-6, 6)]); sandBot.push([x, 200 + rr(-4, 4)]); }
    wash(washes, [[L, 58], [Rt, 56]].concat(seaBot.slice().reverse()), C.sea, { amp: 1.5, step: 40, edge: C.seaDk });
    wash(washes, [[L, 58], [Rt, 56], [Rt, 84], [400, 88], [L, 82]], C.seaDk, { op: 0.55, amp: 1.5, step: 40 });
    wash(washes, seaBot.map(function (p) { return [p[0], p[1] - 4]; }).concat(sandBot.slice().reverse()), C.sand, { amp: 1.5, step: 40, edge: '#C9A96E' });
    wash(washes, [[L, 196], [Rt, 198], [Rt, 300], [L, 306]], '#AEBB7A', { op: 0.75, amp: 3, step: 40 });
    for (var di = 0; di < 22; di++) wash(washes, blob(rr(L + 100, Rt - 100), rr(210, 285), rr(24, 50), rr(10, 18), 10, 0.2), C.duneLt, { op: 0.6, amp: 1.5 });
    wash(washes, [[L, 300], [62, 304], [66, 768], [L, 770]], '#BFC283', { op: 0.55, amp: 3, step: 60 });
    wash(washes, [[540, 296], [Rt, 300], [Rt, 768], [540, 764]], '#BFC283', { op: 0.55, amp: 3, step: 60 });
    for (var si = 0; si < 26; si++) { var sx = rand() < 0.5 ? rr(L + 60, -20) : rr(620, Rt - 60); wash(washes, blob(sx, rr(320, 1000), rr(30, 70), rr(12, 26), 10, 0.25), rand() < 0.5 ? '#A3B56D' : '#C7CB8D', { op: 0.5, amp: 1.5 }); }
    var fence = [[52, 305], [240, 296], [505, 290], [535, 291], [548, 310], [552, 520], [550, 748], [482, 751], [442, 752], [58, 760]];
    wash(washes, fence, '#B5C27E', { op: 0.9, amp: 2, step: 26, edge: C.duneDk });
    for (var gi = 0; gi < 10; gi++) wash(washes, blob(rr(90, 520), rr(330, 730), rr(20, 46), rr(8, 18), 10, 0.25), rand() < 0.5 ? '#A3B56D' : '#C7CB8D', { op: 0.55, amp: 1.5 });
    wash(washes, [[L, 770], [200, 772], [480, 768], [Rt, 772], [Rt, 832], [400, 836], [L, 830]], C.lane, { amp: 1.5, step: 40, edge: '#B89A62' });
    var brick = [[462, 752], [446, 700], [424, 640], [412, 580], [404, 520], [402, 462]];
    el('path', { d: smooth(brick, false), stroke: '#C98A68', 'stroke-width': 11, fill: 'none', 'stroke-linecap': 'round', opacity: 0.85 }, washes);
    [[[440, 712], [360, 698], [280, 676], [214, 648], [176, 640]], [[262, 670], [236, 600], [222, 540], [212, 520]], [[226, 560], [236, 480], [222, 420], [214, 404]]].forEach(function (pp, i) {
      el('path', { d: smooth(pp, false), stroke: '#E6D3A0', 'stroke-width': i ? 7 : 8, fill: 'none', 'stroke-linecap': 'round' }, washes);
    });
    var beachPath = [[522, 300], [505, 268], [470, 236], [432, 208], [404, 188]];
    el('path', { d: smooth(beachPath, false), stroke: '#EAD7A2', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, washes);
    el('path', { d: smooth([[442, 752], [452, 728], [470, 712]], false), stroke: '#E6D3A0', 'stroke-width': 26, fill: 'none', 'stroke-linecap': 'round', opacity: 0.9 }, washes);
    wash(washes, quad([282, 492], [[-12, -10, 0], [100, -10, 0], [100, 52, 0], [-12, 52, 0]]), '#E2D3B4', { op: 0.9, amp: 1 });

    // ink on the ground
    var ground = g(svg);
    var bd = '';
    for (var bi = 0; bi < 26; bi++) { var t = bi / 26, seg = Math.min(brick.length - 2, Math.floor(t * (brick.length - 1))), bp = lerp2(brick[seg], brick[seg + 1], t * (brick.length - 1) - seg); bd += 'M' + f1(bp[0] - 3) + ' ' + f1(bp[1]) + 'h6'; }
    el('path', { d: bd, stroke: '#8E4A3A', 'stroke-width': 1, opacity: 0.55 }, ground);
    ink(ground, beachPath, false, { w: 1, dash: '2 5', op: 0.7, amp: 0.5 });
    [[[70, 470], [200, 452], [330, 470], [540, 452]], [[70, 600], [220, 590], [380, 610], [540, 595]], [[70, 715], [240, 735], [430, 728]]].forEach(function (c) {
      ink(ground, c, false, { w: 0.9, dash: '1 7', op: 0.45, amp: 1.5, step: 30 });
    });
    ink(ground, [[L, 798], [200, 800], [420, 796], [Rt, 800]], false, { w: 0.9, dash: '9 6', op: 0.35, amp: 1, step: 40 });
    ink(ground, [[L, 806], [200, 808], [420, 804], [Rt, 808]], false, { w: 0.9, dash: '9 6', op: 0.35, amp: 1, step: 40 });
    ink(ground, [[L, 58], [Rt, 56]], false, { w: 1.2, amp: 0.6, step: 50 });
    // fence: wires and posts, gaps at the lane gate and the beach gate
    var posts = '';
    function fenceRun(a, b) {
      ink(ground, [a, b], false, { w: 0.8, amp: 0.6, step: 20, op: 0.7 });
      ink(ground, [[a[0], a[1] - 4], [b[0], b[1] - 4]], false, { w: 0.8, amp: 0.6, step: 20, op: 0.7 });
      var n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 20));
      for (var j = 0; j <= n; j++) { var p = lerp2(a, b, j / n); posts += 'M' + f1(p[0]) + ' ' + f1(p[1] + 1.5) + 'l' + f1(rr(-0.4, 0.4)) + ' -8'; }
    }
    fenceRun([52, 305], [240, 296]); fenceRun([240, 296], [505, 290]); fenceRun([535, 291], [548, 310]); fenceRun([548, 310], [552, 520]);
    fenceRun([552, 520], [550, 748]); fenceRun([550, 748], [482, 751]); fenceRun([442, 752], [58, 760]); fenceRun([58, 760], [52, 305]);
    el('path', { d: posts, stroke: C.timber, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, ground);
    limb(ground, [[442, 754], [442, 740]], C.timber, 2.4, 0.9); limb(ground, [[482, 753], [482, 739]], C.timber, 2.4, 0.9);
    shape(ground, [[482, 751], [500, 760], [500, 748], [482, 740]], null, { w: 1.1, amp: 0.2 });
    limb(ground, [[505, 292], [505, 278]], C.timber, 2.4, 0.9); limb(ground, [[535, 293], [535, 279]], C.timber, 2.4, 0.9);
    // a signpost on the lane toward Tofo
    limb(ground, [[-40, 790], [-40, 760]], C.timber, 2, 0.8);
    shape(ground, [[-78, 758], [-36, 758], [-28, 764], [-36, 770], [-78, 770]], '#FBF4E2', { w: 1.1, amp: 0.2 });
    return { beachPath: beachPath };
  }

  function build(svg, paint) {
    _s = 7; PALMS = [];
    svg.textContent = ''; paint.textContent = '';
    var pr = buildPaint(paint);
    var defs = el('defs', null, svg);
    defs.innerHTML =
      '<filter id="wobf" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="1" seed="2" result="n"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>' +
      '<filter id="glowf" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/>' +
        '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

    var R = { buildings: {}, hammocks: {}, lights: {} };
    var world = g(svg, { id: 'world' });

    /* sea: waves and foam */
    var waves = g(world, { id: 'waves', 'pointer-events': 'none' });
    var wd = '', foam = '';
    for (var wi = 0; wi < 80; wi++) { var wx = rr(WIDE[0], WIDE[1]), wy = rr(80, 160); wd += 'M' + f1(wx) + ' ' + f1(wy) + 'q3 -3 6 0t6 0'; }
    for (var fi = 0; fi < 38; fi++) { var fx = WIDE[0] + fi * 64 + rr(-10, 10); foam += 'M' + f1(fx) + ' ' + f1(174 + rr(-3, 2)) + 'q6 -3 12 0t12 0'; }
    el('path', { d: wd, stroke: '#4F7F9A', 'stroke-width': 1, fill: 'none', opacity: 0.55, 'stroke-linecap': 'round' }, waves);
    R.foam = el('path', { d: foam, stroke: '#fff', 'stroke-width': 1.6, fill: 'none', opacity: 0.9, 'stroke-linecap': 'round' }, waves);
    R.waves = waves;

    /* sky: sun, clouds, birds */
    var sky = g(world, { id: 'sky', 'pointer-events': 'none' });
    var sun = g(sky, { id: 'sun' });
    shape(sun, blob(470, -8, 17, 17, 14, 0.04), '#F6C94C', { w: 1.4, amp: 0.4, edge: '#E8A23A' });
    var rays = '';
    for (var ri = 0; ri < 12; ri++) { var ra = ri / 12 * Math.PI * 2; rays += 'M' + f1(470 + Math.cos(ra) * 23) + ' ' + f1(-8 + Math.sin(ra) * 23) + 'L' + f1(470 + Math.cos(ra) * 30) + ' ' + f1(-8 + Math.sin(ra) * 30); }
    el('path', { d: rays, stroke: INK, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, sun);
    R.sun = sun;
    R.clouds = [];
    [[110, -6, 1], [300, 24, 0.75], [660, 4, 0.9], [-120, 26, 0.8], [900, -20, 1], [-420, -10, 0.9]].forEach(function (c) {
      var cg = g(sky), x = c[0], y = c[1], s = c[2];
      shape(cg, [[x - 26 * s, y + 6 * s], [x - 22 * s, y - 4 * s], [x - 10 * s, y - 8 * s], [x - 2 * s, y - 16 * s], [x + 12 * s, y - 12 * s], [x + 20 * s, y - 4 * s], [x + 30 * s, y + 2 * s], [x + 26 * s, y + 7 * s]], '#FFFDF7', { w: 1.2, amp: 1.2, step: 10 });
      R.clouds.push(cg);
    });
    el('path', { d: 'M200 -40q4 -4 8 0q4 -4 8 0M230 -28q3 -3 6 0q3 -3 6 0', stroke: INK, 'stroke-width': 1.1, fill: 'none', 'stroke-linecap': 'round' }, sky);

    /* sea life */
    var sea = g(world, { id: 'seaLife' });
    R.shark = drawShark(sea, 300, 124);
    R.dhow = drawDhow(sea, 128, 60);

    /* objects, back to front */
    var obj = g(world, { id: 'objects' });
    var deco = g(obj, { 'pointer-events': 'none' });
    // dune vegetation behind the plot, and the wider land for big screens
    palm(deco, 40, 262, 52, -6, 0.9); palm(deco, 104, 246, 60, 8, 1); casuarina(deco, 170, 288, 54); palm(deco, 236, 270, 56, -10, 0.95);
    bush(deco, 300, 276, 14); casuarina(deco, 346, 284, 48); palm(deco, 380, 250, 58, 6, 1);
    bush(deco, 452, 262, 10, '#7E9C5A'); bush(deco, 548, 236, 16); palm(deco, 600, 262, 62, -8, 1); palm(deco, 660, 236, 54, 6, 0.9);
    casuarina(deco, 12, 300, 50); bush(deco, 520, 210, 9, '#7E9C5A'); palm(deco, 480, 222, 44, 10, 0.8);
    tufts(deco, [[160, 210], [210, 220], [330, 214], [500, 286], [560, 284], [80, 286], [420, 280], [270, 292]]);
    for (var side = 0; side < 2; side++) {
      for (var k = 0; k < 34; k++) {
        var sx2 = side ? rr(600, 1400) : rr(-820, -10), sy2 = rr(230, 760);
        if (sx2 > 560 && sx2 < 640 && sy2 > 290) sx2 += 60;
        var r2 = rand();
        if (r2 < 0.45) palm(deco, sx2, sy2, rr(48, 70), rr(-12, 12), rr(0.85, 1.1));
        else if (r2 < 0.7) casuarina(deco, sx2, sy2, rr(40, 60));
        else bush(deco, sx2, sy2, rr(9, 16));
      }
      for (var k2 = 0; k2 < 6; k2++) bush(deco, side ? rr(620, 1400) : rr(-820, -20), rr(850, 1000), rr(9, 15));
      for (var k3 = 0; k3 < 5; k3++) bougainvillea(deco, side ? rr(640, 1300) : rr(-700, -40), rr(330, 740), rr(8, 12));
      for (var k4 = 0; k4 < 4; k4++) aloe(deco, side ? rr(640, 1300) : rr(-700, -40), rr(330, 740), 1);
      var tl = []; for (var k5 = 0; k5 < 40; k5++) tl.push([side ? rr(600, 1400) : rr(-820, 0), rr(320, 760)]);
      tufts(deco, tl);
    }
    bougainvillea(deco, 74, 324, 12);

    var units = g(obj, { id: 'units' });
    var cp = { A: 56, D: 26, B: 42, H: 26, P: 10, e: 6, R: 28, win: [[10, 22], [32, 44]], beds: [[5, 8]], sofa: [36, 12] };
    R.buildings.top = building(units, 'top', [132, 345], Object.assign({ aria: 'Cottage Top: tap to look inside' }, cp));
    R.hammocks.top = drawHammock(units, 'Top', R.buildings.top.hang[0], R.buildings.top.hang[1]);
    bougainvillea(g(units, { 'pointer-events': 'none' }), 82, 392, 10);
    R.buildings.big = building(units, 'big', [380, 322], { A: 96, D: 38, B: 62, H: 32, P: 14, e: 8, R: 46, plinth: true, loft: true, stairs: [112, 126],
      win: [[10, 22], [32, 44], [58, 70], [80, 90]], beds: [[6, 6], [6, 36], [30, 6], [30, 36]], sofa: [70, 20], aria: 'Big house: tap to look inside' });
    var bdeco = g(units, { 'pointer-events': 'none' });
    bougainvillea(bdeco, 316, 372, 11); aloe(bdeco, 520, 420, 1);
    R.kettle = drawKettle(units, 352, 434);
    R.pedro = drawPedro(units, 398, 450);
    R.buildings.middle = building(units, 'middle', [118, 470], Object.assign({ aria: 'Cottage Middle: tap to look inside' }, cp));
    R.hammocks.middle = drawHammock(units, 'Middle', R.buildings.middle.hang[0], R.buildings.middle.hang[1]);
    palm(g(units, { 'pointer-events': 'none' }), 238, 484, 66, -8, 1.05);

    // lapa with bar (part of the big house)
    var lapa = g(units, { id: 'lapa', class: 'hit', 'data-hit': 'big', 'aria-label': 'Lapa with bar, part of the big house' });
    (function () {
      var cx = 474, cy = 494;
      el('ellipse', { cx: cx + 3, cy: cy + 4, rx: 36, ry: 16, fill: '#4a3a20', opacity: 0.14 }, lapa);
      shape(lapa, blob(cx, cy, 30, 15, 18, 0.02), '#C98A68', { w: 1.2, amp: 0.3 });
      [200, 250, 290, 340].forEach(function (a) { var r = a * Math.PI / 180; limb(lapa, [[cx + Math.cos(r) * 26, cy + Math.sin(r) * 13], [cx + Math.cos(r) * 26, cy + Math.sin(r) * 13 - 26]], C.timber, 2.2, 0.8); });
      shape(lapa, [[cx - 20, cy + 2], [cx - 14, cy + 9], [cx, cy + 12], [cx + 14, cy + 9], [cx + 20, cy + 2], [cx + 20, cy - 6], [cx + 14, cy + 1], [cx, cy + 4], [cx - 14, cy + 1], [cx - 20, cy - 6]], C.timberLt, { w: 1.1, amp: 0.2 });
      [[-12, 16], [2, 19], [15, 16]].forEach(function (s) { limb(lapa, [[cx + s[0], cy + s[1]], [cx + s[0], cy + s[1] - 6]], C.timber, 1.2, 0.6); el('ellipse', { cx: cx + s[0], cy: cy + s[1] - 6.5, rx: 3, ry: 1.4, fill: C.oxide, stroke: INK, 'stroke-width': 0.8 }, lapa); });
      [30, 90, 150].forEach(function (a) { var r = a * Math.PI / 180; limb(lapa, [[cx + Math.cos(r) * 26, cy + Math.sin(r) * 13], [cx + Math.cos(r) * 26, cy + Math.sin(r) * 13 - 26]], C.timber, 2.2, 0.8); });
      var apex = [cx, cy - 62], rim = [];
      for (var i = 0; i <= 16; i++) { var a = Math.PI * (i / 16); rim.push([cx + Math.cos(a) * 38, cy - 26 + Math.sin(a) * 18]); }
      rim.reverse();
      var lroof = g(lapa, { filter: 'url(#wobf)' });
      shape(lroof, [apex].concat(rim), C.thatch, { w: 1.4, edge: C.straw });
      var hd = '';
      for (var j = 1; j < 16; j++) { var s0 = lerp2(apex, rim[j], rr(0.08, 0.25)), s1 = lerp2(apex, rim[j], rr(0.85, 1)); hd += 'M' + f1(s0[0]) + ' ' + f1(s0[1]) + 'L' + f1(s1[0]) + ' ' + f1(s1[1]); }
      el('path', { d: hd, stroke: C.straw, 'stroke-width': 0.85, fill: 'none', opacity: 0.75 }, lroof);
      fringe(lroof, rim, 2.6);
      limb(lroof, [[cx, cy - 61], [cx, cy - 68]], '#7A5A2C', 2, 0.8);
      R.lapaRim = rim;
      hitArea(lapa, bounds([[cx - 38, cy - 68], [cx + 38, cy + 20]]), 2);
    })();

    // shared splash pool
    var po = [282, 492], pA = 74, pB = 38;
    var pool = g(units, { id: 'pool', class: 'hit', 'data-hit': 'pool', tabindex: 0, role: 'button', 'aria-label': 'Shared splash pool: tap to splash' });
    shape(pool, quad(po, [[-5, -5, 0], [pA + 5, -5, 0], [pA + 5, pB + 5, 0], [-5, pB + 5, 0]]), '#F4ECDC', { w: 1.3, amp: 0.4 });
    var water = quad(po, [[0, 0, 0], [pA, 0, 0], [pA, pB, 0], [0, pB, 0]]);
    shape(pool, water, C.pool, { w: 1.2, amp: 0.3, dx: 0, dy: 0 });
    wash(pool, quad(po, [[0, 0, 0], [pA, 0, 0], [pA, 3, -4], [3, 3, -4], [3, pB, -4], [0, pB, 0]]), '#1C7E9E', { op: 0.5, amp: 0.2, dx: 0, dy: 0 });
    var clip = el('clipPath', { id: 'poolclip' }, defs); el('path', { d: smooth(water, true) }, clip);
    var pw = g(pool, { 'clip-path': 'url(#poolclip)' });
    var hl = '';
    for (var hi = 0; hi < 9; hi++) { var hp = iso(po, rr(8, pA - 8), rr(6, pB - 4), 0); hl += 'M' + f1(hp[0]) + ' ' + f1(hp[1]) + 'q3 -2 6 0t6 0'; }
    R.poolShine = el('path', { d: hl, stroke: '#E6F7FB', 'stroke-width': 1.2, fill: 'none', 'stroke-linecap': 'round', opacity: 0.9 }, pw);
    R.poolFx = g(pw);
    R.poolCenter = iso(po, pA / 2, pB / 2, 0);
    var lad = iso(po, pA - 10, 0, 0);
    el('path', { d: 'M' + f1(lad[0] - 3) + ' ' + f1(lad[1] + 6) + 'v-9q0 -3 3 -3M' + f1(lad[0] + 3) + ' ' + f1(lad[1] + 9) + 'v-9q0 -3 3 -3', stroke: '#C9CED2', 'stroke-width': 1.4, fill: 'none' }, pool);
    hitArea(pool, bounds(quad(po, [[-5, -5, 0], [pA + 5, -5, 0], [pA + 5, pB + 5, 0], [-5, pB + 5, 0]])), 0);
    R.splashLayer = g(units, { 'pointer-events': 'none' });
    var lng = g(units, { 'pointer-events': 'none' });
    [[pA + 12, 4], [pA + 12, 21]].forEach(function (l) {
      var o2 = iso(po, l[0], l[1], 0);
      var lq = function (list) { return list.map(function (p) { return [o2[0] + (p[0] - p[1]) * CX, o2[1] + (p[0] + p[1]) * CY - p[2]]; }); };
      shape(lng, lq([[0, 0, 3], [8, 0, 3], [8, 14, 3], [0, 14, 3]]), '#FFFDF6', { w: 1, amp: 0.15, dx: 0, dy: 0 });
      shape(lng, lq([[0, 0, 3], [8, 0, 3], [8, -1, 9], [0, -1, 9]]), '#FFFDF6', { w: 1, amp: 0.15, dx: 0, dy: 0 });
      ink(lng, lq([[0, 7, 3], [8, 7, 3]]), false, { color: '#4F8FA8', w: 2.4, amp: 0.1 });
    });
    palm(g(units, { 'pointer-events': 'none' }), 382, 560, 74, -14, 1.1);

    // dog lives between the pool and the lapa
    R.dogHome = [414, 612];
    R.dogLayer = g(units);
    R.buildings.down = building(units, 'down', [104, 595], Object.assign({ aria: 'Cottage Down: tap to look inside' }, cp));
    R.hammocks.down = drawHammock(units, 'Down', R.buildings.down.hang[0], R.buildings.down.hang[1]);
    var fdeco = g(units, { 'pointer-events': 'none' });
    bougainvillea(fdeco, 66, 660, 13); bougainvillea(fdeco, 196, 470, 9); aloe(fdeco, 300, 604, 1); aloe(fdeco, 186, 742, 0.9); aloe(fdeco, 372, 712, 1);
    bush(fdeco, 512, 640, 11); bush(fdeco, 528, 700, 9, '#7E9C5A'); bougainvillea(fdeco, 424, 744, 10); bougainvillea(fdeco, 520, 318, 10);
    tufts(fdeco, [[140, 700], [260, 720], [330, 740], [500, 600], [530, 560], [90, 540], [300, 650], [470, 560]]);
    R.washing = drawWashing(units, [300, 640], [352, 652]);
    R.chicken = drawChicken(units, 226, 712);
    R.car = drawCar(units, [480, 694]);
    palm(fdeco, 20, 790, 60, 8, 1); palm(fdeco, 600, 800, 56, -8, 0.95); bush(fdeco, 300, 852, 12); bush(fdeco, 140, 856, 10, '#7E9C5A');

    // dog route: home, round the lapa, out of the beach gate, down to the sand
    R.route = el('path', { id: 'route', fill: 'none', stroke: 'none', d: smooth([[414, 612], [470, 604], [516, 568], [534, 500], [536, 420], [530, 345], [520, 298], [504, 266], [470, 236], [432, 208], [404, 190]], false) }, units);
    R.pathHit = el('path', { d: smooth(pr.beachPath, false), stroke: '#000', 'stroke-opacity': 0, 'stroke-width': 26, fill: 'none', class: 'hit', 'data-hit': 'path', 'aria-label': 'Path to the beach' }, units);
    var dogTop = g(units); // the dog runs on top of everything
    R.dog = drawDog(dogTop);

    /* evening layer */
    R.night = el('rect', { id: 'nightTint', x: -1200, y: -1200, width: 3000, height: 3400, fill: '#5A6DB3', opacity: 0, 'pointer-events': 'none', style: 'mix-blend-mode:multiply' }, svg);
    var nightFx = g(svg, { id: 'nightFx', 'pointer-events': 'none' });
    var glow = g(nightFx, { filter: 'url(#glowf)' });
    ['big', 'top', 'middle', 'down'].forEach(function (k) {
      var lg = g(glow, { opacity: 0 });
      R.buildings[k].lights.forEach(function (q) { el('path', { d: smooth(q, true), fill: C.glow }, lg); });
      if (R.buildings[k].loft) { var rl = g(lg); el('path', { d: smooth(R.buildings[k].loft, true), fill: C.glow }, rl); R.buildings[k].roofLight = rl; }
      R.lights[k] = lg;
    });
    var lapaL = g(glow, { opacity: 0 });
    R.lapaRim.forEach(function (p, i) { if (i % 2 === 0) el('circle', { cx: f1(p[0]), cy: f1(p[1] + 3), r: 1.6, fill: '#FFE7A0' }, lapaL); });
    R.lights.lapa = lapaL;
    var moon = g(nightFx, { id: 'moon', opacity: 0 });
    el('circle', { cx: 470, cy: -8, r: 26, fill: '#FFF1C4', opacity: 0.25, filter: 'url(#glowf)' }, moon);
    shape(moon, [[460, -26], [474, -24], [484, -12], [482, 2], [470, 10], [456, 8], [466, 0], [470, -10], [466, -20]], '#FBEFC8', { w: 1.3, amp: 0.3, color: '#FBF1D8' });
    R.moon = moon;
    var stars = g(nightFx, { id: 'stars', opacity: 0 });
    R.starList = [];
    for (var s2 = 0; s2 < 60; s2++) R.starList.push(star(stars, rr(-800, 1400), s2 < 46 ? rr(-360, 44) : rr(64, 150), rr(2, 3.6)));
    R.stars = stars;
    var flies = g(nightFx, { id: 'flies', opacity: 0 });
    R.flies = [];
    for (var ff = 0; ff < 14; ff++) R.flies.push(el('circle', { cx: f1(rr(90, 540)), cy: f1(rr(380, 740)), r: 1.6, fill: '#FFE58A', filter: 'url(#glowf)' }, flies));
    R.fliesG = flies;

    /* labels */
    var labels = g(svg, { id: 'labels' });
    text(labels, 236, 112, 'Indian Ocean', 25, { sm: true });
    text(labels, 300, 194, 'Tofinho beach', 18);
    text(labels, 488, 252, '5 min to the beach', 17, { rot: 41, hit: 'path' });
    text(labels, 140, 418, 'Top cottage', 20, { hit: 'top' });
    text(labels, 126, 543, 'Middle cottage', 20, { hit: 'middle' });
    text(labels, 112, 668, 'Down cottage', 20, { hit: 'down' });
    text(labels, 408, 314, 'Big house', 23, { hit: 'big' });
    text(labels, 474, 534, 'Lapa & bar', 16, { sm: true, hit: 'big' });
    text(labels, 300, 578, 'Splash pool', 18, { hit: 'pool' });
    text(labels, 398, 468, 'Pedro', 15, { sm: true, hit: 'pedro' });
    R.dogLabel = text(labels, 414, 630, 'Tofu', 15, { sm: true, hit: 'dog' });
    text(labels, 250, 808, 'Rua de Sangomas', 19, { sm: true });
    text(labels, 462, 790, 'gate', 15, { sm: true });
    text(labels, -57, 767.5, 'Tofo', 11, { sm: true });
    var hint = g(labels, { id: 'hint', 'pointer-events': 'none' });
    text(hint, 270, 352, 'tap a house!', 20);
    el('path', { d: 'M236 358q-14 6 -22 -4M214 354l-1 -7M214 354l7 -2', stroke: INK, 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round', class: 'hint-arrow' }, hint);
    R.hint = hint;
    R.palms = PALMS;
    return R;
  }

  window.Scene = { build: build, CORE: CORE };
})();
