// scene.js: the low-poly toy diorama of Casa Paradiso.
// three.js 0.180.0 only (no addons, no physics, no post-processing). Every shape is built here from primitives.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';
import { bus, open, isOpen, hideHint, stopwatch, setSky } from './ui.js';

const doc = document.documentElement;
const $ = (s) => document.querySelector(s);
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = doc.classList.contains('coarse');
const Q = new URLSearchParams(location.search);

// ---------- small maths ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261018);
const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
const easeOutBack = (p) => { const c = 1.5; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };

// ---------- the plot (x = east, z = south, y = up; 1 unit is roughly 3 m) ----------
const LAND = { x0: -9.5, x1: 10.5, z0: -7.5, z1: 7.5 };
const PLOT_E = 5;      // east fence line; the dune runs from here down to the beach
const SEA_Y = 0.06;
const plotH = (x, z) => 0.55 + (7.5 - z) * 0.1 + (x + 9.5) * 0.035;
function groundH(x, z) {
  if (x > LAND.x1) return SEA_Y;
  if (x <= PLOT_E) return plotH(x, z);
  const t = smooth(PLOT_E, 9.4, x);
  let h = lerp(plotH(PLOT_E, z), 0.2, t) + Math.sin(z * 1.4 + x * 0.9) * 0.1 * Math.sin(Math.PI * t);
  if (x > 9.4) h -= (x - 9.4) * 0.28;
  return h;
}

const P = {
  down: { x: -6.0, z: 3.9 }, middle: { x: -6.7, z: 0.1 }, top: { x: -7.3, z: -3.8 },
  big: { x: 2.7, z: -3.6 }, pool: { x: -2.2, z: 0.9 }, lapa: { x: 3.9, z: 2.1 },
  car: { x: 2.2, z: 4.6 }, pedro: { x: 0.2, z: -0.15 }, dog: { x: 0.9, z: 2.9 },
};
// Path from the foot of the big-house stairs, out of the east gate, through the dune to the sand.
const PATH = [[1.1, 1.75], [2.3, 0.9], [3.5, 0.2], [5.0, -0.2], [6.3, 0.4], [7.6, -0.3], [8.8, 0.15], [9.65, 0.1]];
function distToPath(x, z) {
  let best = 1e9;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return best;
}

// Dog obstacles (circles) and where the dog stops for each place.
const OBST = [
  [P.down.x + 0.3, P.down.z, 1.45], [P.middle.x + 0.3, P.middle.z, 1.45], [P.top.x + 0.3, P.top.z, 1.45],
  [1.5, -3.25, 2.1], [3.9, -3.25, 2.1], [P.lapa.x, P.lapa.z, 1.05],
  [P.pool.x - 0.8, P.pool.z, 1.2], [P.pool.x + 0.8, P.pool.z, 1.2], [P.car.x, P.car.z, 0.75], [P.pedro.x, P.pedro.z, 0.38],
];
const DOOR = {
  down: [P.down.x + 2.35, P.down.z + 0.1], middle: [P.middle.x + 2.35, P.middle.z + 0.1], top: [P.top.x + 2.35, P.top.z + 0.1],
  big: [1.1, 1.75], pool: [P.pool.x, P.pool.z + 1.75],
};

// ---------- palette (pastel cues from the brief) ----------
const C = {
  grass: [0xA9D287, 0x9DC97B, 0xB5D994, 0xA2CD80], lip: 0x8DBF69, soil: 0xE3AE86, soil2: 0xC98C70, base: 0xA86A55,
  sand: 0xF3E2B8, lane: 0xEBD6A6, path: 0xE7CC98, park: 0xE2CB9A, dune: [0xCAD394, 0xD9D7A2, 0xE8DCAC],
  wall: 0xFBF7EF, thatch: 0xDDBB78, thatchDk: 0xC09A58, timber: 0xB07848, log: 0x8B5A2B, door: 0x9A6238,
  oxide: 0xA8584A, pool: 0x46C2E0, poolEdge: 0xF5EEDF, sea: 0x8ED6E8, seaDeep: 0x6DC0DA,
  pink: 0xF06A9A, leaf: 0x6DB55A, leaf2: 0x86C66C, trunk: 0xC29467, bush: 0x82B562, casu: 0x5F9D68,
  aloe: 0x86B9A0, win: 0x8BA3C0, cushion: 0xF7B9CC,
};
const MAT = new Map();
function mat(hex, extra) {
  if (!extra && MAT.has(hex)) return MAT.get(hex);
  const m = new THREE.MeshLambertMaterial({ color: hex, flatShading: true, ...extra });
  if (!extra) MAT.set(hex, m);
  return m;
}

// ---------- geometry helpers (shared unit shapes, scaled per mesh) ----------
const UB = new THREE.BoxGeometry(1, 1, 1);
const UC = new THREE.CylinderGeometry(1, 1, 1, 6);
const UP = new THREE.Vector3(0, 1, 0);
function put(parent, geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  parent.add(o);
  return o;
}
const B = (p, m, x, y, z, w, h, d) => { const o = put(p, UB, m, x, y, z); o.scale.set(w, h, d); return o; };
const Cyl = (p, m, x, y, z, r, h) => { const o = put(p, UC, m, x, y, z); o.scale.set(r, h, r); return o; };
const _v = new THREE.Vector3();
function logBetween(p, m, a, b, r) {
  const o = put(p, UC, m);
  _v.subVectors(b, a);
  const len = _v.length();
  o.position.copy(a).addScaledVector(_v, 0.5);
  o.quaternion.setFromUnitVectors(UP, _v.normalize());
  o.scale.set(r, len, r);
  return o;
}
function hip(w, d, h) { // 4-sided pyramid roof, base w x d at y=0, apex at y=h
  const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
  g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); g.scale(w, h, d);
  return g;
}

// Bake a group's meshes into one mesh per material (fewer draw calls on phones).
function compact(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map(), dead = [], m4 = new THREE.Matrix4();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.keep || o.geometry.attributes.color) return;
    let a = o.parent; while (a && a !== root) { if (a.userData.keep) return; a = a.parent; }
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
    if (!groups.has(o.material)) groups.set(o.material, []);
    groups.get(o.material).push(g.attributes.position.array);
    dead.push(o);
  });
  dead.forEach((o) => o.parent.remove(o));
  for (const [m, arrs] of groups) {
    const n = arrs.reduce((s, a) => s + a.length, 0), buf = new Float32Array(n);
    let off = 0; for (const a of arrs) { buf.set(a, off); off += a.length; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(buf, 3));
    g.computeVertexNormals();
    const o = put(root, g, m);
    o.userData.keep = true;
  }
  return root;
}

// ---------- start ----------
if (window.CP_NO3D) doc.classList.add('ready');
else {
  try { init(); } catch (e) { console.error(e); doc.classList.add('no3d', 'ready'); }
}

function init() {
  const canvas = $('#scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  let pr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pr);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const world = new THREE.Group();
  scene.add(world);
  const statics = new THREE.Group();
  world.add(statics);

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight(0xEEF6FF, 0xD9C29A, 1.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xFFF3DE, 2.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(COARSE ? 1024 : 2048, COARSE ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 13, bottom: -13, near: 1, far: 70 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  sun.target.position.set(1.5, 0, 0);
  scene.add(sun, sun.target);

  // ---------- land: one low-poly heightfield, coloured per face ----------
  {
    const W = LAND.x1 - LAND.x0, D = LAND.z1 - LAND.z0;
    let g = new THREE.PlaneGeometry(W, D, 40, 30);
    g.rotateX(-Math.PI / 2);
    g.translate(LAND.x0 + W / 2, 0, LAND.z0 + D / 2);
    const pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), z = pa.getZ(i);
      const edge = x <= LAND.x0 + 1e-3 || x >= LAND.x1 - 1e-3 || z <= LAND.z0 + 1e-3 || z >= LAND.z1 - 1e-3;
      pa.setY(i, groundH(x, z) + (edge ? 0 : (hash(x, z) - 0.5) * 0.09));
    }
    g = g.toNonIndexed();
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i += 3) {
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
      const r = hash(cx * 3.1, cz * 1.7);
      let hex;
      if (cx > 9.25) hex = C.sand;
      else if (cz > 6.2) hex = C.lane;
      else if (cx > 0.9 && distToPath(cx, cz) < 0.36) hex = C.path;
      else if (cx > 0.9 && cx < 3.7 && cz > 3.6) hex = C.park;
      else if (cx > PLOT_E) hex = C.dune[Math.floor(r * 3)];
      else hex = C.grass[Math.floor(r * 4)];
      c.setHex(hex).multiplyScalar(0.96 + hash(cz, cx) * 0.08);
      for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    ground.receiveShadow = true;
    ground.userData.key = 'ground';
    world.add(ground);
    world.userData.ground = ground;

    // Skirt: a green lip, then soil, down to the toy base.
    const ring = [];
    for (let x = LAND.x0; x <= LAND.x1 + 1e-6; x += 0.5) ring.push([x, LAND.z1]);
    for (let z = LAND.z1 - 0.5; z >= LAND.z0 - 1e-6; z -= 0.5) ring.push([LAND.x1, z]);
    for (let x = LAND.x1 - 0.5; x >= LAND.x0 - 1e-6; x -= 0.5) ring.push([x, LAND.z0]);
    for (let z = LAND.z0 + 0.5; z <= LAND.z1 + 1e-6; z += 0.5) ring.push([LAND.x0, z]);
    const pos = [], cols = [], lip = new THREE.Color(C.lip), soil = new THREE.Color(C.soil);
    const quad = (ax, az, ay0, ay1, bx, bz, by0, by1, cc) => {
      pos.push(ax, ay0, az, bx, by0, bz, bx, by1, bz, ax, ay0, az, bx, by1, bz, ax, ay1, az);
      for (let k = 0; k < 6; k++) cols.push(cc.r, cc.g, cc.b);
    };
    for (let i = 0; i < ring.length - 1; i++) {
      const [ax, az] = ring[i], [bx, bz] = ring[i + 1];
      const ha = groundH(ax, az), hb = groundH(bx, bz);
      const sandy = ax > 9.25 || az > 6.2;
      quad(ax, az, ha, ha - 0.16, bx, bz, hb, hb - 0.16, sandy ? new THREE.Color(C.sand).multiplyScalar(0.9) : lip);
      quad(ax, az, ha - 0.16, -0.9, bx, bz, hb - 0.16, -0.9, soil);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    sg.computeVertexNormals();
    const skirt = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }));
    world.add(skirt);
    B(statics, mat(C.soil2), (LAND.x0 + LAND.x1) / 2, -1.35, 0, LAND.x1 - LAND.x0 - 0.02, 0.9, LAND.z1 - LAND.z0 - 0.02);
    B(statics, mat(C.base), 2.75, -1.92, 0, 24.9, 0.26, 15.4);
    // the underside of the floating island: a few inverted low-poly rocks
    const rock = new THREE.ConeGeometry(1, 1, 6); rock.rotateX(Math.PI); rock.translate(0, -0.5, 0);
    for (const [rx, rz, r, h, sz, c] of [[0.5, 1.5, 4.6, 7.5, 1, C.soil2], [-5.6, 3.2, 3.0, 5.6, 1, C.base], [5.8, 2.2, 3.4, 6.0, 1, C.base], [-2.6, 4.6, 2.2, 4.2, 1, 0xB9785E], [3.2, 5.0, 1.8, 3.4, 1, 0x96604D]]) {
      const o = put(statics, rock, mat(c), rx, -2.05, rz); o.scale.set(r, h, r * sz); o.rotation.y = rx * 0.3;
    }
  }

  // ---------- sea strip with a gentle vertex wave ----------
  const seaMat = new THREE.MeshLambertMaterial({ color: C.sea, flatShading: true });
  const SEA = { x0: 10.0, x1: 15.2 };
  const seaGeo = new THREE.PlaneGeometry(SEA.x1 - SEA.x0, 15, 12, 26);
  seaGeo.rotateX(-Math.PI / 2);
  seaGeo.translate((SEA.x0 + SEA.x1) / 2, SEA_Y, 0);
  const seaBase = Float32Array.from(seaGeo.attributes.position.array);
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.receiveShadow = true;
  sea.userData.key = 'sea';
  world.add(sea);
  B(statics, mat(C.seaDeep), (SEA.x0 + SEA.x1) / 2, (SEA_Y - 1.8) / 2, 0, SEA.x1 - SEA.x0, SEA_Y + 1.8, 15).castShadow = false;
  const foam = B(world, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8 }), 9.93, SEA_Y + 0.02, 0, 0.14, 0.03, 14.9);
  foam.castShadow = foam.receiveShadow = false;

  // ---------- trees and plants ----------
  const crowns = [];
  const frondGeo = new THREE.ConeGeometry(0.2, 1.25, 4);
  frondGeo.rotateZ(-Math.PI / 2); frondGeo.translate(0.62, 0, 0); frondGeo.scale(1, 0.22, 1);
  const nutGeo = new THREE.IcosahedronGeometry(0.075, 0);
  function palm(x, z, s = 1, lean = 0.3, rot = 0) {
    const g = new THREE.Group();
    g.position.set(x, groundH(x, z) - 0.05, z); g.rotation.y = rot; g.scale.setScalar(s);
    statics.add(g);
    let parent = g, y = 0;
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Group(); seg.position.y = y; seg.rotation.z = lean / 5; parent.add(seg);
      const o = put(seg, UC, mat(C.trunk), 0, 0.22, 0); o.scale.set(0.085 - i * 0.006, 0.46, 0.085 - i * 0.006);
      parent = seg; y = 0.44;
    }
    const tip = new THREE.Object3D(); tip.position.y = 0.5; parent.add(tip);
    g.updateMatrixWorld(true);
    const crown = new THREE.Group();
    tip.getWorldPosition(crown.position);
    crown.rotation.y = rot + rand() * 2;
    crown.scale.setScalar(s);
    for (let i = 0; i < 7; i++) {
      const piv = new THREE.Group(); piv.rotation.y = (i / 7) * Math.PI * 2 + rand() * 0.3; crown.add(piv);
      const f = put(piv, frondGeo, mat(i % 2 ? C.leaf : C.leaf2)); f.rotation.z = -0.25 - rand() * 0.35;
    }
    for (let i = 0; i < 3; i++) put(crown, nutGeo, mat(0x7A5532), Math.cos(i * 2.1) * 0.12, -0.1, Math.sin(i * 2.1) * 0.12);
    compact(crown);
    crown.userData.phase = rand() * 6;
    world.add(crown);
    crowns.push(crown);
  }
  const coneGeo = new THREE.ConeGeometry(1, 1, 6);
  function casuarina(x, z, s = 1) {
    const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.scale.setScalar(s); statics.add(g);
    Cyl(g, mat(C.trunk), 0, 0.4, 0, 0.07, 0.8);
    for (let i = 0; i < 3; i++) { const o = put(g, coneGeo, mat(C.casu), 0, 0.9 + i * 0.5, 0); o.scale.set(0.55 - i * 0.13, 0.9, 0.55 - i * 0.13); }
  }
  const blobGeo = new THREE.IcosahedronGeometry(1, 0);
  function bush(x, z, s = 0.35, color = C.bush) {
    const o = put(statics, blobGeo, mat(color), x, groundH(x, z) + s * 0.55, z);
    o.scale.set(s * (1 + rand() * 0.4), s * 0.85, s * (1 + rand() * 0.4)); o.rotation.y = rand() * 3;
  }
  function bougainvillea(x, z, s = 0.42) {
    bush(x, z, s * 0.9, C.bush);
    for (let i = 0; i < 3; i++) bush(x + (rand() - 0.5) * s * 1.4, z + (rand() - 0.5) * s * 1.4, s * (0.5 + rand() * 0.3), C.pink);
  }
  const bladeGeo = new THREE.ConeGeometry(0.06, 0.45, 3);
  function aloe(x, z) {
    const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); statics.add(g);
    for (let i = 0; i < 6; i++) { const o = put(g, bladeGeo, mat(C.aloe), 0, 0.18, 0); o.rotation.set(0.5, (i / 6) * Math.PI * 2, 0, 'YXZ'); o.position.set(Math.sin(i) * 0.05, 0.18, Math.cos(i) * 0.05); }
    const fl = put(g, bladeGeo, mat(0xF08A3C), 0, 0.5, 0); fl.scale.set(0.7, 1.2, 0.7);
  }

  // ---------- buildings ----------
  const winMat = new THREE.MeshLambertMaterial({ color: C.win, emissive: 0xFFB45A, emissiveIntensity: 0, flatShading: true });
  const lanterns = [];
  const pickables = [world.userData.ground, sea];
  const BLD = {};

  function railPosts(g, pts, y0, h, every = 0.5) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const n = Math.max(1, Math.round(a.distanceTo(b) / every));
      for (let k = 0; k <= n; k++) { const p = a.clone().lerp(b, k / n); Cyl(g, mat(C.log), p.x, y0 + h / 2, p.z, 0.035, h); }
      logBetween(g, mat(C.log), new THREE.Vector3(a.x, y0 + h, a.z), new THREE.Vector3(b.x, y0 + h, b.z), 0.04);
    }
  }

  function cottage(key, x, z) {
    const g = new THREE.Group(); const y0 = groundH(x + 0.3, z);
    g.position.set(x, y0, z); world.add(g);
    const e = 0.62;
    for (const sx of [-0.95, 0.55, 1.55]) for (const sz of [-0.95, 0.95]) Cyl(g, mat(C.log), sx, (e - 0.8) / 2, sz, 0.07, e + 0.8);
    B(g, mat(C.timber), 0.3, e, 0, 2.7, 0.12, 2.1);
    B(g, mat(C.oxide), -0.2, e + 0.065, 0, 1.56, 0.02, 1.76);
    B(g, mat(C.wall), -0.2, e + 0.56, 0, 1.6, 1.0, 1.8);
    B(g, mat(C.door), 0.61, e + 0.38, 0.3, 0.05, 0.62, 0.38);
    B(g, winMat, 0.61, e + 0.62, -0.45, 0.05, 0.3, 0.34);
    B(g, winMat, -0.35, e + 0.62, 0.91, 0.42, 0.3, 0.05);
    B(g, winMat, -0.35, e + 0.62, -0.91, 0.42, 0.3, 0.05);
    B(g, winMat, -1.01, e + 0.62, 0, 0.05, 0.3, 0.42);
    for (const sz of [-0.98, 0.98]) Cyl(g, mat(C.log), 1.6, e + 0.53, sz, 0.05, 1.06);
    const V = (a, b) => new THREE.Vector3(a, 0, b);
    railPosts(g, [V(0.62, 0.98), V(1.6, 0.98), V(1.6, 0.42)], e + 0.06, 0.4);
    railPosts(g, [V(1.6, -0.22), V(1.6, -0.98), V(0.62, -0.98)], e + 0.06, 0.4);
    // hammock slung along the north rail
    const ham = put(g, new THREE.TorusGeometry(0.34, 0.05, 4, 10, Math.PI), mat(C.cushion), 1.1, e + 0.5, -0.78);
    ham.rotation.set(Math.PI, 0, 0);
    // two steps down from the deck to the cottage's own little garden
    for (let i = 1; i <= 2; i++) { const top = e * (1 - i / 3); B(g, mat(C.timber), 1.65 + i * 0.27, (top - 0.4) / 2, 0.1, 0.27, top + 0.4, 0.5); }
    const roof = new THREE.Group(); roof.position.y = e + 1.06; g.add(roof);
    put(roof, hip(3.25, 2.55, 1.1), mat(C.thatch), 0.3, 0, 0);
    put(roof, hip(3.45, 2.75, 0.24), mat(C.thatchDk), 0.3, -0.07, 0);
    put(roof, coneGeo, mat(C.thatchDk), 0.3, 1.08, 0).scale.set(0.12, 0.2, 0.12);
    compact(roof); roof.userData.keep = true;
    compact(g);
    g.userData = { key, roof, roofY: roof.position.y, top: e + 2.3, keep: false };
    lanterns.push([x + 0.75, y0 + e + 0.75, z + 0.3]);
    pickables.push(g); BLD[key] = g;
    bougainvillea(x - 0.2, z + 1.55, 0.36);
    aloe(x + 2.2, z - 0.85);
    return g;
  }

  function bigHouse(x, z) {
    const g = new THREE.Group(); const y0 = groundH(x, z);
    g.position.set(x, y0, z); world.add(g);
    const e = 0.95;
    for (const sx of [-2.25, -0.9, 0.5, 1.9, 2.55]) for (const sz of [-1.35, 0.2, 1.15, 2.5]) Cyl(g, mat(C.log), sx, (e - 1.0) / 2, sz, 0.09, e + 1.0);
    B(g, mat(C.timber), 0.15, e, 0.6, 5.0, 0.14, 4.0);
    B(g, mat(C.wall), -0.1, e + 0.74, -0.1, 4.0, 1.35, 2.5);
    B(g, mat(C.door), -0.6, e + 0.5, 1.16, 0.5, 0.86, 0.05);
    for (const wx of [-1.6, 0.4, 1.25]) B(g, winMat, wx, e + 0.8, 1.16, 0.46, 0.36, 0.05);
    for (const wz of [-0.7, 0.45]) B(g, winMat, 1.91, e + 0.8, wz, 0.05, 0.36, 0.46);
    for (const wx of [-1.2, 0.9]) B(g, winMat, wx, e + 0.8, -1.36, 0.46, 0.36, 0.05);
    for (const [px, pz] of [[-2.3, 2.52], [-0.4, 2.52], [1.2, 2.52], [2.58, 2.52], [2.58, 0.6], [2.58, -1.35]]) Cyl(g, mat(C.log), px, e + 0.72, pz, 0.07, 1.44);
    const V = (a, b) => new THREE.Vector3(a, 0, b);
    railPosts(g, [V(-2.33, -1.0), V(-2.33, 2.55), V(-2.05, 2.55)], e + 0.07, 0.48, 0.55);
    railPosts(g, [V(-1.15, 2.55), V(2.6, 2.55), V(2.6, -1.38)], e + 0.07, 0.48, 0.55);
    // deck dining table and two benches
    B(g, mat(C.log), 0.9, e + 0.38, 1.85, 1.1, 0.06, 0.5);
    Cyl(g, mat(C.log), 0.9, e + 0.2, 1.85, 0.05, 0.36);
    for (const bz of [1.45, 2.25]) B(g, mat(C.timber), 0.9, e + 0.22, bz, 1.0, 0.05, 0.18);
    // log staircase down to the garden
    const sx = -1.6, footX = x + sx;
    const run = 2.2, footZ = 2.6 + run, footY = groundH(footX, z + footZ) - y0;
    const n = 6;
    for (let i = 1; i <= n; i++) {
      const t = i / n, sy = lerp(e, footY, t) + 0.02, sz = 2.6 + run * t - 0.18;
      logBetween(g, mat(C.log), new THREE.Vector3(sx - 0.45, sy, sz), new THREE.Vector3(sx + 0.45, sy, sz), 0.075);
    }
    for (const side of [-0.5, 0.5]) {
      logBetween(g, mat(C.log), new THREE.Vector3(sx + side, e, 2.55), new THREE.Vector3(sx + side, footY - 0.1, footZ), 0.06);
      logBetween(g, mat(C.log), new THREE.Vector3(sx + side, e + 0.55, 2.55), new THREE.Vector3(sx + side, footY + 0.5, footZ), 0.04);
      Cyl(g, mat(C.log), sx + side, footY + 0.2, footZ, 0.05, 0.7);
    }
    const roof = new THREE.Group(); roof.position.y = e + 1.42; g.add(roof);
    put(roof, hip(5.8, 4.8, 2.0), mat(C.thatch), 0.15, 0, 0.6);
    put(roof, hip(6.05, 5.05, 0.34), mat(C.thatchDk), 0.15, -0.1, 0.6);
    // loft dormer peeking out of the thatch
    B(roof, mat(C.wall), -0.3, 0.95, 1.55, 0.7, 0.5, 0.5);
    B(roof, winMat, -0.3, 0.97, 1.81, 0.36, 0.26, 0.04);
    put(roof, hip(0.95, 0.85, 0.45), mat(C.thatchDk), -0.3, 1.18, 1.62);
    put(roof, coneGeo, mat(C.thatchDk), 0.15, 1.98, 0.6).scale.set(0.16, 0.26, 0.16);
    compact(roof); roof.userData.keep = true;
    compact(g);
    g.userData = { key: 'big', roof, roofY: roof.position.y, top: e + 3.6 };
    lanterns.push([x - 0.6, y0 + e + 1.0, z + 1.4]);
    pickables.push(g); BLD.big = g;
  }

  function lapa(x, z) {
    const g = new THREE.Group(); const y0 = groundH(x, z);
    g.position.set(x, y0, z); world.add(g);
    put(g, new THREE.CylinderGeometry(1.0, 1.05, 0.5, 8), mat(C.oxide), 0, -0.12, 0);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3; Cyl(g, mat(C.log), Math.cos(a) * 0.85, 0.7, Math.sin(a) * 0.85, 0.06, 1.3); }
    B(g, mat(C.timber), 0, 0.45, -0.25, 1.0, 0.55, 0.32);
    B(g, mat(C.log), 0, 0.75, -0.25, 1.1, 0.06, 0.42);
    for (const bx of [-0.3, 0.3]) Cyl(g, mat(C.log), bx, 0.3, 0.2, 0.09, 0.42);
    put(g, new THREE.ConeGeometry(1.45, 1.15, 8), mat(C.thatch), 0, 1.9, 0);
    put(g, new THREE.ConeGeometry(1.55, 0.3, 8), mat(C.thatchDk), 0, 1.38, 0);
    compact(g);
    g.userData = { key: 'big', top: 2.8 };
    lanterns.push([x, y0 + 1.15, z]);
    pickables.push(g);
  }

  function pool(x, z) {
    const g = new THREE.Group(); const y0 = groundH(x, z) + 0.05;
    g.position.set(x, y0, z); world.add(g);
    const em = mat(C.poolEdge);
    B(g, em, 0, -0.16, -0.95, 3.7, 0.6, 0.4); B(g, em, 0, -0.16, 0.95, 3.7, 0.6, 0.4);
    B(g, em, -1.65, -0.16, 0, 0.4, 0.6, 1.5); B(g, em, 1.65, -0.16, 0, 0.4, 0.6, 1.5);
    const water = B(g, new THREE.MeshLambertMaterial({ color: C.pool, emissive: 0x18B4E8, emissiveIntensity: 0, flatShading: true }), 0, -0.2, 0, 2.9, 0.48, 1.5);
    water.userData.keep = true; water.castShadow = false;
    for (const lx of [-0.6, 0.6]) {
      const L = new THREE.Group(); L.position.set(lx, groundH(x + lx, z - 1.65) - y0, -1.65); g.add(L);
      B(L, mat(C.timber), 0, 0.12, 0, 0.42, 0.08, 0.95);
      B(L, mat(C.cushion), 0, 0.19, 0.12, 0.38, 0.06, 0.7);
      const back = B(L, mat(C.cushion), 0, 0.33, -0.38, 0.38, 0.06, 0.38); back.rotation.x = -0.9;
      for (const [a, b] of [[-0.17, -0.4], [0.17, -0.4], [-0.17, 0.4], [0.17, 0.4]]) B(L, mat(C.log), a, 0.05, b, 0.04, 0.1, 0.04);
    }
    compact(g);
    g.userData = { key: 'pool', water, top: 0.8 };
    pickables.push(g); BLD.pool = g;
    return g;
  }

  function car(x, z) {
    const g = new THREE.Group(); g.position.set(x, groundH(x, z), z); g.rotation.y = 0.15; statics.add(g);
    B(g, mat(0xF5C451), 0, 0.3, 0, 0.62, 0.28, 1.15);
    B(g, mat(0xFFFFFF), 0, 0.55, -0.08, 0.56, 0.24, 0.62);
    B(g, mat(C.win), 0, 0.55, 0.24, 0.5, 0.18, 0.02);
    const wg = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 8); wg.rotateZ(Math.PI / 2);
    for (const [a, b] of [[-0.31, 0.35], [0.31, 0.35], [-0.31, -0.35], [0.31, -0.35]]) put(g, wg, mat(0x3E4255), a, 0.14, b);
  }

  // ---------- fence and gates ----------
  {
    const posts = [];
    const corners = [[-9.25, -7.25], [PLOT_E, -7.25], [PLOT_E, 5.95], [-9.25, 5.95], [-9.25, -7.25]];
    const gap = (px, pz) => (pz > 5.9 && px > 1.4 && px < 3.4) || (px > 4.9 && pz > -1.05 && pz < 0.65);
    const runs = [];
    for (let i = 0; i < corners.length - 1; i++) {
      const [ax, az] = corners[i], [bx, bz] = corners[i + 1];
      const n = Math.round(Math.hypot(bx - ax, bz - az) / 0.75);
      let run = [];
      for (let k = 0; k < n; k++) {
        const px = lerp(ax, bx, k / n), pz = lerp(az, bz, k / n);
        if (gap(px, pz)) { if (run.length > 1) runs.push(run); run = []; continue; }
        posts.push([px, pz]); run.push([px, pz]);
      }
      run.push([bx, bz]); if (!gap(bx, bz)) runs.push(run);
    }
    const pm = new THREE.InstancedMesh(UC, mat(C.log), posts.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    posts.forEach(([px, pz], i) => { pm.setMatrixAt(i, m.compose(p.set(px, groundH(px, pz) + 0.2, pz), q.identity(), s.set(0.04, 0.5, 0.04))); });
    pm.castShadow = true; world.add(pm);
    const rails = [];
    for (const run of runs) for (let i = 0; i < run.length - 1; i++) for (const hy of [0.2, 0.4]) rails.push([run[i], run[i + 1], hy]);
    const rm = new THREE.InstancedMesh(UB, mat(C.timber), rails.length);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);
    rails.forEach(([[ax, az], [bx, bz], hy], i) => {
      a.set(ax, groundH(ax, az) + hy, az); b.set(bx, groundH(bx, bz) + hy, bz);
      const len = a.distanceTo(b); q.setFromUnitVectors(X, b.clone().sub(a).normalize());
      rm.setMatrixAt(i, m.compose(p.copy(a).lerp(b, 0.5), q, s.set(len, 0.035, 0.035)));
    });
    world.add(rm);
    // south gate (lane) with a cross log, and the east gate to the beach path
    for (const gx of [1.4, 3.4]) Cyl(statics, mat(C.log), gx, groundH(gx, 5.95) + 0.5, 5.95, 0.07, 1.25);
    logBetween(statics, mat(C.log), new THREE.Vector3(1.3, groundH(1.4, 5.95) + 1.12, 5.95), new THREE.Vector3(3.5, groundH(3.4, 5.95) + 1.12, 5.95), 0.06);
    const leaf = B(statics, mat(C.timber), 3.4, groundH(3.4, 6.3) + 0.3, 6.35, 0.05, 0.4, 0.8); leaf.rotation.y = 0.2;
    for (const gz of [-1.05, 0.65]) Cyl(statics, mat(C.log), PLOT_E, groundH(PLOT_E, gz) + 0.35, gz, 0.06, 0.9);
  }

  // ---------- build the plot ----------
  cottage('down', P.down.x, P.down.z);
  cottage('middle', P.middle.x, P.middle.z);
  cottage('top', P.top.x, P.top.z);
  bigHouse(P.big.x, P.big.z);
  lapa(P.lapa.x, P.lapa.z);
  pool(P.pool.x, P.pool.z);
  car(P.car.x, P.car.z);

  palm(-3.9, -0.55, 1, 0.35, 0.4); palm(-0.45, -0.75, 0.95, 0.3, 2.6); palm(-0.4, 2.35, 0.9, 0.4, -1.2);
  palm(-4.3, -5.6, 1.05, 0.25, 1); palm(0.2, -6.4, 1.1, 0.3, 3); palm(-8.6, 6.4, 1, 0.4, -0.6); palm(4.4, 4.6, 0.95, 0.35, 0.8);
  palm(6.3, 3.0, 1.1, 0.4, 1.5); palm(7.4, -3.6, 1.15, 0.35, 0.4); palm(8.7, 2.3, 1.0, 0.5, 2); palm(6.1, -5.8, 1.0, 0.3, 4); palm(9.1, -5.3, 1.05, 0.55, 0.2); palm(8.3, 5.6, 0.95, 0.45, 1.1);
  casuarina(-9.0, -6.8, 1.1); casuarina(-4.4, 5.4, 0.9); casuarina(4.5, -6.6, 1.0); casuarina(-1.8, -6.9, 0.85);
  bougainvillea(1.0, 5.6, 0.4); bougainvillea(3.9, 5.55, 0.38); bougainvillea(-0.6, -3.3, 0.38); bougainvillea(4.6, -1.6, 0.34);
  for (const [bx, bz] of [[-9.0, 2.0], [-9.0, -1.8], [-4.2, 2.6], [-2.6, -3.0], [-5.6, -6.6], [4.6, 3.3], [-8.8, 4.4], [0.4, 3.9]]) bush(bx, bz, 0.3 + rand() * 0.15);
  aloe(-3.5, 3.4); aloe(0.6, 1.0); aloe(4.4, 1.0);
  for (let i = 0; i < 46; i++) { // dune bush
    const bx = lerp(5.4, 9.2, rand()), bz = lerp(-7.1, 6.0, rand());
    if (distToPath(bx, bz) < 0.75) continue;
    bush(bx, bz, 0.18 + rand() * 0.2, rand() < 0.5 ? C.bush : 0x9DBB6A);
  }
  { // dune grass tufts (one instanced mesh)
    const tuft = new THREE.ConeGeometry(0.05, 0.36, 3);
    const tm = new THREE.InstancedMesh(tuft, mat(0xB5C377), 140);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    let n = 0;
    while (n < 140) {
      const tx = lerp(5.2, 9.7, rand()), tz = lerp(-7.3, 6.1, rand());
      if (distToPath(tx, tz) < 0.45) continue;
      q.setFromEuler(e.set((rand() - 0.5) * 0.5, 0, (rand() - 0.5) * 0.5));
      tm.setMatrixAt(n++, m.compose(p.set(tx, groundH(tx, tz) + 0.15, tz), q, s.setScalar(0.7 + rand() * 0.6)));
    }
    world.add(tm);
  }
  // a dhow on the sea
  const dhow = new THREE.Group();
  {
    B(dhow, mat(0x9A6238), 0, 0.06, 0, 0.26, 0.14, 0.8);
    Cyl(dhow, mat(C.log), 0, 0.45, 0.05, 0.02, 0.8);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.75, 0); sh.lineTo(0, 0.7); sh.lineTo(0, 0);
    const sail = put(dhow, new THREE.ShapeGeometry(sh), new THREE.MeshLambertMaterial({ color: 0xFFFBF2, side: THREE.DoubleSide }), 0, 0.18, 0.35);
    sail.rotation.y = Math.PI / 2;
    dhow.position.set(12.9, SEA_Y, -3.2); dhow.rotation.y = 0.1; dhow.scale.setScalar(1.7);
    world.add(dhow);
  }
  // clouds
  const clouds = [];
  for (const [cx, cy, cz, s] of [[-7, 6.6, -10, 1], [7, 7.4, -11, 1.25], [15.5, 6, 3, 0.8]]) {
    const g = new THREE.Group(); g.position.set(cx, cy, cz); g.scale.setScalar(s);
    for (const [a, b, r] of [[0, 0, 0.8], [0.8, -0.15, 0.6], [-0.8, -0.2, 0.55], [0.3, 0.35, 0.55]]) {
      const o = put(g, blobGeo, mat(0xFFFFFF), a, b, 0); o.scale.setScalar(r); o.castShadow = o.receiveShadow = false;
    }
    compact(g); g.traverse((o) => { o.castShadow = o.receiveShadow = false; }); world.add(g); clouds.push(g);
  }
  compact(statics);

  // ---------- Tofu the dog (player) ----------
  const dog = new THREE.Group();
  const dogParts = {};
  {
    const body = new THREE.Group(); dog.add(body); dogParts.body = body;
    const fur = mat(0xE5BA78), light = mat(0xF6DDB0), dark = mat(0xC3904F), black = mat(0x2A2A35), white = mat(0xFFFFFF);
    B(body, fur, 0, 0.33, 0, 0.3, 0.26, 0.52);
    B(body, light, 0, 0.28, 0.12, 0.24, 0.16, 0.3);
    const head = new THREE.Group(); head.position.set(0, 0.5, 0.29); body.add(head); dogParts.head = head;
    B(head, fur, 0, 0.05, 0, 0.32, 0.28, 0.28);
    B(head, light, 0, -0.02, 0.17, 0.17, 0.13, 0.14);
    B(head, black, 0, 0.03, 0.25, 0.07, 0.05, 0.03);
    for (const s of [-1, 1]) {
      put(head, new THREE.IcosahedronGeometry(0.042, 0), black, s * 0.085, 0.09, 0.14);
      put(head, new THREE.IcosahedronGeometry(0.014, 0), white, s * 0.085 + 0.012, 0.105, 0.177);
    }
    const earUp = put(head, new THREE.ConeGeometry(0.07, 0.17, 4), dark, -0.1, 0.26, -0.02); earUp.rotation.z = 0.2;
    const earFlop = B(head, dark, 0.19, 0.08, -0.01, 0.05, 0.18, 0.11); earFlop.rotation.z = -0.5; dogParts.ear = earFlop;
    const band = put(body, new THREE.ConeGeometry(0.17, 0.2, 6), mat(0xE0443A), 0, 0.33, 0.25); band.rotation.x = Math.PI + 0.25; band.scale.set(1, 1, 0.6);
    B(body, mat(0xE0443A), 0, 0.44, 0.22, 0.31, 0.06, 0.16);
    dogParts.legs = [];
    for (const [lx, lz] of [[-0.1, 0.17], [0.1, 0.17], [-0.1, -0.17], [0.1, -0.17]]) {
      const leg = new THREE.Group(); leg.position.set(lx, 0.24, lz); body.add(leg);
      B(leg, fur, 0, -0.1, 0, 0.08, 0.2, 0.08); B(leg, light, 0, -0.19, 0.01, 0.085, 0.04, 0.1);
      dogParts.legs.push(leg);
    }
    const tail = new THREE.Group(); tail.position.set(0, 0.42, -0.25); body.add(tail); dogParts.tail = tail;
    const tt = put(tail, new THREE.ConeGeometry(0.04, 0.24, 4), fur, 0, 0.12, 0); tt.rotation.x = 0;
    tail.rotation.x = -0.7;
    dog.scale.setScalar(1.6);
    dog.userData.key = 'dog';
    dog.position.set(P.dog.x, groundH(P.dog.x, P.dog.z), P.dog.z);
    dog.rotation.y = 0.6;
    world.add(dog); pickables.push(dog);
  }

  // ---------- Pedro (placeholder likeness; swap makePedro body parts when the reference photo arrives) ----------
  const pedro = new THREE.Group();
  const pedroParts = {};
  {
    const skin = mat(0x7A4A2E), shirt = mat(0x3FA7A0), shorts = mat(0x34507A), straw = mat(0xE6C783), black = mat(0x24242C);
    for (const s of [-1, 1]) { B(pedro, shorts, s * 0.08, 0.2, 0, 0.12, 0.4, 0.14); B(pedro, black, s * 0.08, 0.02, 0.03, 0.13, 0.05, 0.2); }
    put(pedro, new THREE.CylinderGeometry(0.17, 0.2, 0.46, 7), shirt, 0, 0.62, 0);
    const head = new THREE.Group(); head.position.y = 1.0; pedro.add(head); pedroParts.head = head;
    put(head, new THREE.IcosahedronGeometry(0.17, 1), skin, 0, 0, 0);
    for (const s of [-1, 1]) put(head, new THREE.IcosahedronGeometry(0.025, 0), black, s * 0.065, 0.02, 0.15);
    B(head, mat(0xF5E9DA), 0, -0.07, 0.145, 0.09, 0.025, 0.03);
    put(head, new THREE.CylinderGeometry(0.29, 0.29, 0.03, 10), straw, 0, 0.12, 0);
    put(head, new THREE.CylinderGeometry(0.14, 0.16, 0.13, 8), straw, 0, 0.19, 0);
    B(head, mat(0xE8407A), 0, 0.14, 0, 0.33, 0.03, 0.05).scale.set(0.33, 0.03, 0.33);
    pedroParts.arms = [];
    for (const s of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(s * 0.22, 0.8, 0); pedro.add(arm);
      B(arm, shirt, 0, -0.07, 0, 0.1, 0.14, 0.1);
      B(arm, skin, 0, -0.22, 0, 0.075, 0.24, 0.075);
      arm.rotation.z = s * 0.12;
      pedroParts.arms.push(arm);
    }
    pedro.scale.setScalar(1.25);
    pedro.position.set(P.pedro.x, groundH(P.pedro.x, P.pedro.z), P.pedro.z);
    pedro.rotation.y = 0.55;
    pedro.userData.key = 'pedro';
    world.add(pedro); pickables.push(pedro);
  }

  // ---------- night extras: lantern glows and fireflies ----------
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,220,150,1)'); gr.addColorStop(0.35, 'rgba(255,190,110,.45)'); gr.addColorStop(1, 'rgba(255,170,90,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  for (const [lx, ly, lz] of lanterns) { const s = new THREE.Sprite(glowMat); s.position.set(lx, ly, lz); s.scale.setScalar(2.2); world.add(s); }
  const FF = 36, ffBase = [];
  const ffGeo = new THREE.BufferGeometry();
  {
    const arr = new Float32Array(FF * 3);
    for (let i = 0; i < FF; i++) {
      const fx = lerp(-9, 9, rand()), fz = lerp(-7, 6, rand());
      ffBase.push([fx, groundH(fx, fz) + 0.4 + rand() * 0.9, fz, rand() * 6]);
    }
    ffGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  }
  const ffMat = new THREE.PointsMaterial({ color: 0xFFE58A, size: 0.13, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  fireflies.frustumCulled = false;
  world.add(fireflies);

  // ---------- tap markers, ripples ----------
  const fx = [];
  const ringGeo = new THREE.RingGeometry(0.75, 1, 24); ringGeo.rotateX(-Math.PI / 2);
  function ring(x, y, z, color, size, dur) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
    m.position.set(x, y, z); world.add(m);
    fx.push({ m, t: 0, dur, size });
  }

  // ---------- camera ----------
  const cam = new THREE.PerspectiveCamera(30, 1, 0.5, 200);
  const view = { az: 0.4, pol: 0.95, userAz: 0, userPol: 0, baseAz: 0.4, basePol: 0.95, dist: 40, zoom: 1, drift: 1, lastUser: -10,
    home: new THREE.Vector3(1.5, 1, 0), target: new THREE.Vector3(), follow: 0.08, followGoal: 0.08 };
  function placeCamera(az, pol, dist, t) {
    cam.position.set(t.x + dist * Math.sin(pol) * Math.sin(az), t.y + dist * Math.cos(pol), t.z + dist * Math.sin(pol) * Math.cos(az));
    cam.lookAt(t);
    cam.updateMatrixWorld();
  }
  function fit() {
    const w = innerWidth, h = innerHeight, aspect = w / h;
    renderer.setSize(w, h, false);
    cam.aspect = aspect; cam.updateProjectionMatrix();
    const portrait = aspect < 0.85;
    view.baseAz = portrait ? 0.3 : 0.36;
    view.basePol = portrait ? 0.56 : 1.0;
    const pts = [];
    // phones crop the dune and the sea; the camera follows Tofu there on the beach run
    const xs = portrait ? [-8.9, 5.2] : [-9.5, 15.2];
    for (const x of xs) for (const z of [-7.5, 7.5]) for (const y of [-2.0, 1.5]) pts.push(new THREE.Vector3(x, y, z));
    pts.push(new THREE.Vector3(2.7, 6.7, -3.6), new THREE.Vector3(-7.3, 4.6, -3.8), new THREE.Vector3(-4.3, 4.6, -5.6), new THREE.Vector3(0.5, -2.5, 3));
    const top = 1 - 2 * (portrait ? 80 : 76) / h, bot = -1 + 2 * (portrait ? (COARSE ? 150 : 96) : 30) / h;
    const xr = portrait ? 1.16 : 0.95, xl = -xr;
    const T = new THREE.Vector3(portrait ? 0.5 : 2.6, 1, 0.5), v = new THREE.Vector3();
    const bbox = (d) => {
      placeCamera(view.baseAz, view.basePol, d, T);
      let a = 9, b = -9, c = 9, e = -9;
      for (const p of pts) { v.copy(p).project(cam); a = Math.min(a, v.x); b = Math.max(b, v.x); c = Math.min(c, v.y); e = Math.max(e, v.y); }
      return [a, b, c, e];
    };
    let d = 40;
    for (let k = 0; k < 4; k++) {
      let lo = 5, hi = 200;
      for (let i = 0; i < 26; i++) {
        const mid = (lo + hi) / 2, [a, b, c, e] = bbox(mid);
        if (b - a <= xr - xl && e - c <= top - bot) hi = mid; else lo = mid;
      }
      d = hi;
      const [a, b, c, e] = bbox(d);
      const cx = (a + b) / 2 - (xl + xr) / 2, cy = (c + e) / 2 - (top + bot) / 2;
      const hh = d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      T.addScaledVector(right, cx * hh * aspect).addScaledVector(up, cy * hh);
    }
    view.home.copy(T); view.dist = d;
  }
  fit();
  addEventListener('resize', fit);

  // ---------- labels anchored to 3D points ----------
  const tagsEl = $('#tags');
  const tags = [];
  function tag(label, anchor, attrs, small) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tag' + (small ? ' small' : ''); b.textContent = label;
    for (const k in attrs) b.setAttribute(k, attrs[k]);
    tagsEl.appendChild(b);
    tags.push({ el: b, anchor, w: 0, h: 0, edge: 'edge' in attrs });
    return b;
  }
  const at = (g, dy) => () => _a.set(g.position.x, g.position.y + dy, g.position.z);
  const _a = new THREE.Vector3();
  tag('Big house', at(BLD.big, BLD.big.userData.top + 0.2), { 'data-open': 'big' });
  tag('Cottage Top', at(BLD.top, BLD.top.userData.top), { 'data-open': 'top' });
  tag('Cottage Middle', at(BLD.middle, BLD.middle.userData.top), { 'data-open': 'middle' });
  tag('Cottage Down', at(BLD.down, BLD.down.userData.top), { 'data-open': 'down' });
  tag('Pool', at(BLD.pool, 0.75), { 'data-open': 'pool' }, true);
  tag('Beach, 5 min', () => _a.set(9.6, 1.2, 0.1), { 'data-open': 'beach', edge: '' }, true);
  tag('Pedro', () => _a.set(pedro.position.x, pedro.position.y + 1.85, pedro.position.z), { 'data-pedro': '' }, true);
  tag('Tofu', () => _a.set(dog.position.x, dog.position.y + 1.05, dog.position.z), { 'data-dog': '' }, true);
  const say = document.createElement('div'); say.className = 'say'; say.setAttribute('role', 'status'); tagsEl.appendChild(say);
  tagsEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-pedro]')) pedroWave();
    else if (e.target.closest('[data-dog]')) visit('beach');
  });
  tagsEl.style.transition = 'opacity .5s'; tagsEl.style.opacity = '0';

  // ---------- Pedro's facts ----------
  const FACTS = [
    'The plot has Starlink internet.',
    'Water comes from our own borehole. It is safe to drink.',
    'Pets are allowed. Tofu checked.',
    'An ordinary 2WD car drives right up to the gate.',
    'The whole plot is fenced.',
    'Whale sharks visit from October to March.',
    'Tofinho beach is a 5-minute walk.',
    'The cottages are rated 5.0 on Airbnb, Superhost.',
    'Humpback whales pass from June to October.',
    'Johannesburg is about 11 to 12 hours by road.',
    'Fresh seafood at the Tofo market around midday.',
    'Electricity is prepaid.',
  ];
  let factI = 0, sayUntil = 0, waveT = -1;
  function pedroWave() {
    hideHint();
    waveT = 0;
    say.innerHTML = `<b>Pedro</b>${FACTS[factI++ % FACTS.length]}`;
    say.classList.add('on');
    sayUntil = clock + 5.5;
  }

  // ---------- tweens ----------
  const tweens = [];
  const tween = (dur, fn, done) => tweens.push({ t: 0, dur, fn, done });
  function bounce(g) {
    const ud = g.userData;
    tween(0.8, (p) => {
      const s = Math.sin(p * Math.PI * 3) * (1 - p);
      g.scale.set(1 - s * 0.07, 1 + s * 0.14, 1 - s * 0.07);
      if (ud.roof) ud.roof.position.y = ud.roofY + Math.sin(Math.min(1, p * 1.5) * Math.PI) * 0.6;
    }, () => { g.scale.set(1, 1, 1); if (ud.roof) ud.roof.position.y = ud.roofY; });
  }
  function splash() {
    const g = BLD.pool, y = g.position.y + 0.06;
    for (let i = 0; i < 3; i++) setTimeout(() => ring(g.position.x, y, g.position.z, 0xFFFFFF, 0.95, 1.1), i * 180);
    const drops = [];
    for (let i = 0; i < 10; i++) {
      const d = put(world, blobGeo, mat(0xBDEBF7), g.position.x, y, g.position.z); d.scale.setScalar(0.06); d.castShadow = false;
      const a = rand() * Math.PI * 2, sp = 0.8 + rand() * 0.8;
      drops.push({ d, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp * 0.6, vy: 2.4 + rand() * 1.2 });
    }
    tween(0.9, () => {
      for (const o of drops) { o.vy -= 9 * lastDt; o.d.position.x += o.vx * lastDt; o.d.position.z += o.vz * lastDt; o.d.position.y = Math.max(y, o.d.position.y + o.vy * lastDt); }
    }, () => drops.forEach((o) => world.remove(o.d)));
  }

  // ---------- dog brain ----------
  const D = { mode: 'idle', tx: 0, tz: 0, speed: 4, onArrive: null, best: 1e9, stuck: 0, hop: 0, phase: 0, yaw: 0.6, script: null, vx: 0, vz: 0 };
  const input = { jx: 0, jz: 0, keys: new Set() };
  function settle(x, z) {
    for (let k = 0; k < 2; k++) for (const [ox, oz, r] of OBST) {
      const dx = x - ox, dz = z - oz, d = Math.hypot(dx, dz);
      if (d < r && d > 1e-4) { x = ox + (dx / d) * r; z = oz + (dz / d) * r; }
    }
    return [clamp(x, LAND.x0 + 0.3, 9.9), clamp(z, LAND.z0 + 0.3, LAND.z1 - 0.3)];
  }
  function goTo(x, z, cb) {
    [x, z] = settle(x, z);
    const dist = Math.hypot(x - dog.position.x, z - dog.position.z);
    Object.assign(D, { mode: 'goto', tx: x, tz: z, onArrive: cb || null, speed: clamp(dist / 1.7, 3.4, 7), best: 1e9, stuck: 0, script: null });
  }
  function cancelBeach() {
    if (D.mode === 'script') { D.mode = 'idle'; D.script = null; stopwatch.hide(); view.followGoal = 0.08; }
  }
  function arrive(key) {
    D.hop = 0.35;
    if (key === 'pool') { splash(); setTimeout(() => open('pool'), 700); return; }
    bounce(BLD[key]);
    setTimeout(() => open(key), 560);
  }
  function visit(key) {
    hideHint();
    if (!introDone) return;
    cancelBeach();
    if (key === 'beach') return runToBeach();
    if (!DOOR[key]) return open(key);
    const [x, z] = DOOR[key];
    goTo(x, z, () => arrive(key));
  }
  function runToBeach() {
    // join the path at its closest point, then follow it to the sand
    let bi = 0, bd = 1e9;
    PATH.forEach(([x, z], i) => { const d = Math.hypot(x - dog.position.x, z - dog.position.z) + i * 0.01; if (d < bd && i < PATH.length - 1) { bd = d; bi = i; } });
    const pts = [[dog.position.x, dog.position.z], ...PATH.slice(bi)].map(([x, z]) => new THREE.Vector2(x, z));
    const lens = [0];
    for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + pts[i].distanceTo(pts[i - 1]));
    D.mode = 'script'; D.onArrive = null;
    D.script = { pts, lens, total: lens[lens.length - 1], t: 0, dur: 3.6 };
    stopwatch.show();
    view.followGoal = innerWidth / innerHeight < 0.85 ? 0.72 : 0.4;
  }
  function stepDog(dt) {
    let vx = 0, vz = 0;
    let ix = input.jx, iz = input.jz;
    if (input.keys.size) {
      const k = input.keys;
      ix += (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
      iz += (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0);
    }
    const im = Math.hypot(ix, iz);
    if (im > 0.15 && introDone) {
      if (D.mode !== 'manual') { cancelBeach(); D.mode = 'manual'; D.onArrive = null; hideHint(); }
      // camera-relative: up on the stick is "away from the camera"
      const fx = -Math.sin(view.az), fz = -Math.cos(view.az), rx = Math.cos(view.az), rz = -Math.sin(view.az);
      const s = 3.6 * Math.min(1, im) / im;
      vx = (rx * ix - fx * iz) * s; vz = (rz * ix - fz * iz) * s;
    } else if (D.mode === 'manual') D.mode = 'idle';

    if (D.mode === 'goto') {
      const dx = D.tx - dog.position.x, dz = D.tz - dog.position.z, d = Math.hypot(dx, dz);
      if (d < 0.12) { D.mode = 'idle'; const cb = D.onArrive; D.onArrive = null; if (cb) cb(); }
      else {
        const sp = Math.min(D.speed, d * 6 + 1);
        vx = (dx / d) * sp; vz = (dz / d) * sp;
        if (d < D.best - 0.04) { D.best = d; D.stuck = 0; } else if ((D.stuck += dt) > 0.7) { D.mode = 'idle'; const cb = D.onArrive; D.onArrive = null; if (cb) cb(); }
      }
    }
    let moving = 0;
    if (D.mode === 'script') {
      const S = D.script; S.t += dt;
      const p = Math.min(1, S.t / S.dur), want = p * S.total;
      let i = 1; while (i < S.lens.length - 1 && S.lens[i] < want) i++;
      const a = S.pts[i - 1], b = S.pts[i], f = (want - S.lens[i - 1]) / Math.max(1e-4, S.lens[i] - S.lens[i - 1]);
      const nx = lerp(a.x, b.x, f), nz = lerp(a.y, b.y, f);
      D.vx = (nx - dog.position.x) / Math.max(dt, 1e-3); D.vz = (nz - dog.position.z) / Math.max(dt, 1e-3);
      dog.position.x = nx; dog.position.z = nz;
      moving = S.total / S.dur;
      stopwatch.set(p);
      if (p >= 1) {
        D.mode = 'idle'; D.script = null; D.hop = 0.4;
        setTimeout(() => open('beach'), 450);
        setTimeout(() => { stopwatch.hide(); }, 2200);
      }
    } else {
      dog.position.x += vx * dt; dog.position.z += vz * dt;
      [dog.position.x, dog.position.z] = settle(dog.position.x, dog.position.z);
      D.vx = vx; D.vz = vz;
      moving = Math.hypot(vx, vz);
    }
    // face the way we run
    if (moving > 0.2) {
      const want = Math.atan2(D.vx, D.vz);
      let dy = want - D.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      D.yaw += dy * Math.min(1, dt * 12);
    }
    dog.rotation.y = D.yaw;
    let hopY = 0;
    if (D.hop > 0) { D.hop -= dt; hopY = Math.sin((1 - Math.max(0, D.hop) / 0.4) * Math.PI) * 0.4; }
    const run = Math.min(1, moving / 3);
    D.phase += dt * (6 + moving * 3.2);
    const sw = Math.sin(D.phase);
    dogParts.legs.forEach((l, i) => { l.rotation.x = run * 0.9 * (i % 3 === 0 ? sw : -sw); });
    dogParts.body.position.y = run * Math.abs(Math.sin(D.phase)) * 0.06 + (1 - run) * Math.sin(clock * 2.4) * 0.008;
    dogParts.body.rotation.x = run * Math.sin(D.phase * 2) * 0.05;
    dogParts.tail.rotation.z = Math.sin(clock * (run > 0.2 ? 14 : 9)) * 0.6;
    dogParts.ear.rotation.z = -0.5 - run * 0.4 * Math.abs(Math.sin(D.phase));
    dogParts.head.rotation.z = (1 - run) * Math.sin(clock * 0.9) * 0.12;
    dog.position.y = groundH(dog.position.x, dog.position.z) + hopY;
  }

  // ---------- pointer: orbit, pinch, tap ----------
  const ptrs = new Map();
  let dragged = false, pinch = null, introDone = false;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(pickables, true)[0];
    if (!hit) return null;
    let o = hit.object; while (o && !o.userData.key) o = o.parent;
    return o ? { key: o.userData.key, point: hit.point } : null;
  }
  function tap(cx, cy) {
    if (!introDone || isOpen()) return;
    const h = pick(cx, cy);
    if (!h) return;
    hideHint();
    const k = h.key;
    if (k === 'pedro') return pedroWave();
    if (k === 'dog' || k === 'sea') return visit('beach');
    if (k === 'ground') {
      if (h.point.x > 9.3) return visit('beach');
      cancelBeach();
      const [x, z] = settle(h.point.x, h.point.z);
      ring(x, groundH(x, z) + 0.05, z, 0xE8407A, 0.45, 0.6);
      return goTo(x, z, () => { D.hop = 0.3; });
    }
    visit(k);
  }
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    if (ptrs.size === 1) dragged = false;
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: view.zoom };
      dragged = true;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId);
    if (!p) { if (!COARSE) hover(e); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) {
      if (!dragged && Math.hypot(p.x - p.sx, p.y - p.sy) > 7) dragged = true;
      if (dragged) { view.userAz = clamp(view.userAz - dx * 0.006, -0.8, 0.8); view.userPol = clamp(view.userPol - dy * 0.004, -0.3, 0.22); view.lastUser = clock; hideHint(); }
    } else if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()];
      view.zoom = clamp(pinch.z * pinch.d / Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), 0.5, 1.2);
      view.userAz = clamp(view.userAz - dx * 0.003, -0.8, 0.8);
      view.lastUser = clock;
    }
  });
  const up = (e) => {
    const p = ptrs.get(e.pointerId);
    if (p && ptrs.size === 1 && !dragged) tap(e.clientX, e.clientY);
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', (e) => { ptrs.delete(e.pointerId); pinch = null; });
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); view.zoom = clamp(view.zoom * Math.exp(e.deltaY * 0.001), 0.5, 1.2); view.lastUser = clock; }, { passive: false });
  let hoverAt = 0;
  function hover(e) {
    if (clock - hoverAt < 0.08 || !introDone) return;
    hoverAt = clock;
    const h = pick(e.clientX, e.clientY);
    canvas.style.cursor = h && h.key !== 'ground' ? 'pointer' : 'default';
  }

  // joystick (touch) and keys (desktop)
  const joy = $('#joy'), knob = joy.querySelector('i');
  let joyId = null;
  const joyMove = (e) => {
    const r = joy.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy), R = 34;
    if (m > R) { dx *= R / m; dy *= R / m; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    input.jx = dx / R; input.jz = dy / R;
  };
  joy.addEventListener('pointerdown', (e) => { joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); });
  joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) joyMove(e); });
  const joyEnd = (e) => { if (e.pointerId !== joyId) return; joyId = null; input.jx = input.jz = 0; knob.style.transform = ''; };
  joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
  const KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (!KEYS.includes(k) || isOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
    if (k.startsWith('arrow') && document.activeElement && document.activeElement !== canvas && document.activeElement !== document.body) return;
    input.keys.add(k); e.preventDefault();
  });
  addEventListener('keyup', (e) => input.keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => input.keys.clear());

  // ---------- day / night ----------
  let nightGoal = 0, night = 0, nightShown = -1;
  bus.addEventListener('sheet', (e) => { if (!e.detail.open && D.mode !== 'script') view.followGoal = 0.08; });
  bus.addEventListener('night', (e) => { nightGoal = e.detail ? 1 : 0; if (REDUCE) night = nightGoal; });
  const cA = new THREE.Color(), cB = new THREE.Color();
  const HEMI_SKY = [new THREE.Color(0xEEF6FF), new THREE.Color(0x8C98E6)], HEMI_GND = [new THREE.Color(0xD9C29A), new THREE.Color(0x544A86)];
  const SEA_C = [new THREE.Color(C.sea), new THREE.Color(0x4E6FB0)];
  const sunDir = new THREE.Vector3();
  function applyNight(n) {
    setSky(n);
    let el, az, col, inten;
    if (n < 0.5) { const p = n / 0.5; el = lerp(1.0, 0.1, p); az = 0.75; col = cA.setHex(0xFFF3DE).lerp(cB.setHex(0xFF9356), p); inten = lerp(2.3, 0.6, p); }
    else { const p = (n - 0.5) / 0.5; el = lerp(0.1, 0.95, p); az = -0.75; col = cA.setHex(0xFFB27A).lerp(cB.setHex(0xA9B8FF), Math.min(1, p * 2)); inten = lerp(0.15, 1.0, p); }
    // southern hemisphere: the sun sits in the north (−z); the moon rises on the other side
    sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 30);
    sun.color.copy(col); sun.intensity = inten;
    hemi.color.lerpColors(HEMI_SKY[0], HEMI_SKY[1], n);
    hemi.groundColor.lerpColors(HEMI_GND[0], HEMI_GND[1], n);
    hemi.intensity = lerp(1.75, 1.2, n);
    const glow = smooth(0.35, 0.75, n);
    winMat.emissiveIntensity = glow * 1.9;
    winMat.color.setHex(glow > 0.5 ? 0xFFD089 : C.win);
    BLD.pool.userData.water.material.emissiveIntensity = glow * 0.75;
    seaMat.color.lerpColors(SEA_C[0], SEA_C[1], n);
    glowMat.opacity = glow * 0.9;
    ffMat.opacity = glow;
    doc.style.setProperty('--tag-dim', String(1 - n * 0.15));
  }
  applyNight(0);

  // ---------- render loop ----------
  let clock = 0, lastDt = 0.016, prev = performance.now(), frameNo = 0;
  let frames = 0, fpsAcc = 0, fpsShown = 0;
  const fpsEl = $('#fps');
  const showFps = Q.has('fps');
  if (showFps) fpsEl.style.display = 'block';
  const fpsLog = [];
  const introDur = REDUCE ? 0 : 1.4;
  world.position.y = introDur ? -7 : 0;
  const wavePos = seaGeo.attributes.position;

  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now; lastDt = dt; clock += dt;
    if (++frameNo === 40) { const l = $('.loader'); if (l) l.remove(); }

    // intro: the island floats up into place
    if (!introDone) {
      const p = introDur ? Math.min(1, clock / introDur) : 1;
      world.position.y = lerp(-7, 0, easeOutBack(p));
      world.rotation.y = (1 - p) * -0.35;
      if (p >= 1) { introDone = true; world.position.y = 0; world.rotation.y = 0; tagsEl.style.opacity = '1'; }
    }

    // night transition
    if (night !== nightGoal) { night = nightGoal > night ? Math.min(nightGoal, night + dt * 0.5) : Math.max(nightGoal, night - dt * 0.5); }
    if (night !== nightShown) { nightShown = night; applyNight(night * night * (3 - 2 * night)); }

    stepDog(dt);

    // Pedro idle sway, wave, and a little idle wave every few seconds to invite a tap
    const pa = pedroParts.arms[0];
    if (waveT >= 0) {
      waveT += dt;
      const p = waveT / 1.6;
      pa.rotation.z = -(lerp(0.12, 2.6, smooth(0, 0.15, p) * (1 - smooth(0.85, 1, p))) + Math.sin(waveT * 14) * 0.3 * (1 - smooth(0.85, 1, p)));
      pedro.position.y = groundH(P.pedro.x, P.pedro.z) + Math.abs(Math.sin(waveT * 7)) * 0.06 * (1 - p);
      if (p >= 1) waveT = -1;
    } else {
      const k = (clock % 9) / 9;
      const lift = k > 0.85 ? Math.sin((k - 0.85) / 0.15 * Math.PI) : 0;
      pa.rotation.z = -(0.12 + lift * 2.2 + lift * Math.sin(clock * 14) * 0.25);
      pedro.position.y = groundH(P.pedro.x, P.pedro.z);
    }
    pedroParts.head.rotation.y = Math.sin(clock * 0.7) * 0.25;
    if (sayUntil && clock > sayUntil) { say.classList.remove('on'); sayUntil = 0; }

    // palms sway, sea waves, dhow bob, clouds drift, foam breathes
    if (!REDUCE) {
      for (const c of crowns) { c.rotation.z = Math.sin(clock * 1.1 + c.userData.phase) * 0.05; c.rotation.x = Math.sin(clock * 0.8 + c.userData.phase) * 0.03; }
      for (let i = 0; i < wavePos.count; i++) {
        const x = seaBase[i * 3], z = seaBase[i * 3 + 2];
        const edge = Math.min(x - SEA.x0, SEA.x1 - x, z + 7.5, 7.5 - z);
        const amp = smooth(0, 0.6, edge);
        wavePos.setY(i, SEA_Y + amp * (Math.sin(x * 1.7 + clock * 1.6) * 0.055 + Math.sin(z * 1.2 - clock * 1.1) * 0.035));
      }
      wavePos.needsUpdate = true;
      dhow.position.z = -3.2 + Math.sin(clock * 0.08) * 3.5;
      dhow.position.y = SEA_Y + 0.02 + Math.sin(clock * 1.8) * 0.03;
      dhow.rotation.z = Math.sin(clock * 1.5) * 0.06;
      clouds.forEach((c, i) => { c.position.x += dt * (0.15 + i * 0.05); if (c.position.x > 20) c.position.x = -14; });
      foam.material.opacity = 0.55 + Math.sin(clock * 1.6) * 0.3;
      foam.position.x = 9.93 + Math.sin(clock * 1.6) * 0.08;
    }
    if (ffMat.opacity > 0.01) {
      const arr = ffGeo.attributes.position.array;
      ffBase.forEach(([x, y, z, ph], i) => { arr[i * 3] = x + Math.sin(clock * 0.6 + ph) * 0.5; arr[i * 3 + 1] = y + Math.sin(clock * 1.3 + ph) * 0.2; arr[i * 3 + 2] = z + Math.cos(clock * 0.5 + ph) * 0.5; });
      ffGeo.attributes.position.needsUpdate = true;
    }

    // tweens and effect rings
    for (let i = tweens.length - 1; i >= 0; i--) {
      const t = tweens[i]; t.t += dt; const p = Math.min(1, t.t / t.dur); t.fn(p);
      if (p >= 1) { tweens.splice(i, 1); if (t.done) t.done(); }
    }
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.t += dt; const p = f.t / f.dur;
      f.m.scale.setScalar(0.2 + p * f.size); f.m.material.opacity = 1 - p;
      if (p >= 1) { world.remove(f.m); f.m.material.dispose(); fx.splice(i, 1); }
    }

    // camera: tilted orbit that drifts slowly when nobody is touching it
    const idle = clock - view.lastUser > 4 && !REDUCE;
    view.drift = lerp(view.drift, idle ? 1 : 0, Math.min(1, dt * 0.8));
    view.az = view.baseAz + view.userAz + view.drift * Math.sin(clock * 0.11) * 0.1;
    view.pol = view.basePol + view.userPol + view.drift * Math.sin(clock * 0.07) * 0.025;
    view.follow = lerp(view.follow, view.followGoal + (1 - view.zoom) * 0.9, Math.min(1, dt * (view.followGoal > 0.2 ? 3.5 : 1.5)));
    view.target.copy(view.home).lerp(_v.set(dog.position.x, view.home.y, dog.position.z), clamp(view.follow, 0, 0.75));
    placeCamera(view.az, view.pol, view.dist * view.zoom, view.target);

    renderer.render(scene, cam);

    // labels follow their 3D anchors
    const W = innerWidth, H = innerHeight;
    for (const t of tags) {
      if (!t.w) { t.w = t.el.offsetWidth; t.h = t.el.offsetHeight; }
      _v.copy(t.anchor()).project(cam);
      let x = (_v.x * 0.5 + 0.5) * W - t.w / 2; const y = (-_v.y * 0.5 + 0.5) * H - t.h - 8;
      const cx = clamp(x, 6, W - t.w - (t.edge ? 14 : 6));
      if (t.edge) t.el.classList.toggle('off', cx < x - 1);
      x = cx;
      t.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    }
    if (say.classList.contains('on') || sayUntil) {
      _v.set(pedro.position.x, pedro.position.y + 2.15, pedro.position.z).project(cam);
      const sw = say.offsetWidth, sh = say.offsetHeight;
      const x = clamp((_v.x * 0.5 + 0.5) * W - sw / 2, 12, W - sw - 12), y = (-_v.y * 0.5 + 0.5) * H - sh - 10;
      say.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    }

    // fps meter, and drop to pixel ratio 1 if a slow phone cannot keep up
    frames++; fpsAcc += dt;
    if (fpsAcc >= 0.5) {
      const fps = frames / fpsAcc; frames = 0; fpsAcc = 0; fpsShown++;
      fpsLog.push(fps);
      if (showFps) fpsEl.textContent = `${fps.toFixed(0)} fps · pr ${pr}`;
      if (fpsShown === 6 && pr > 1 && avg(fpsLog.slice(2)) < 40) { pr = 1; renderer.setPixelRatio(1); fit(); }
    }
    requestAnimationFrame(frame);
  }
  const avg = (a) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);

  if (Q.has('og')) doc.classList.add('og');
  renderer.compile(scene, cam);
  requestAnimationFrame((t) => {
    prev = t; frame(t); doc.classList.add('ready');
    setTimeout(() => { const l = $('.loader'); if (l) l.remove(); }, 700);
  });

  window.CP_SCENE = {
    visit,
    night: (on) => { nightGoal = on ? 1 : 0; },
    // read-only peek for tests
    state: () => ({ dog: [+dog.position.x.toFixed(2), +dog.position.z.toFixed(2)], mode: D.mode, fps: fpsLog.slice(-6).map((f) => +f.toFixed(1)), pr, intro: introDone, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
    project: (x, y, z) => { _v.set(x, y, z).project(cam); return [(_v.x * 0.5 + 0.5) * innerWidth, (-_v.y * 0.5 + 0.5) * innerHeight]; },
  };
  // let other pages/tests jump straight to night with ?night
  if (Q.has('night')) $('#daynight').click();
}
