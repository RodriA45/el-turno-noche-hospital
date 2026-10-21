import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// =============================================================================
// BUILDER · acumula primitivas y las fusiona por material.
// Un prop que antes eran 60 meshes (60 draw calls + 60 pasadas de sombra de la
// linterna) pasa a ser 3-6 meshes. Además permite biseles (cajas redondeadas),
// tubos entre dos puntos, curvas, etc. sin tocar el resto del juego.
// =============================================================================

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

// Geometrías base cacheadas (se clonan al fusionar, así que compartirlas es seguro)
const geoCache = new Map();
function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g.clone();
}

/** UV proyectadas en espacio local (triplanar) para materiales con textura "por metro". */
function worldUV(geo, scale) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    let u, v;
    if (nx >= ny && nx >= nz) { u = p.getZ(i); v = p.getY(i); }
    else if (ny >= nz) { u = p.getX(i); v = p.getZ(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv.setXY(i, u * scale, v * scale);
  }
  uv.needsUpdate = true;
}

export class Builder {
  /** @param {(name:string)=>THREE.Material} resolve  resuelve nombres de material */
  constructor(resolve) {
    this.resolve = resolve;
    this.buckets = new Map(); // material -> geometrías
  }

  _mat(m) { return typeof m === 'string' ? this.resolve(m) : m; }

  /** Inserta una geometría ya creada aplicando posición / rotación (YXZ) / escala. */
  geo(geometry, mat, x = 0, y = 0, z = 0, o = {}) {
    const material = this._mat(mat);
    let g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    // atributos comunes (descarta color/uv2 que romperían la fusión)
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();

    _e.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ');
    _q.setFromEuler(_e);
    _s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
    _m.compose(_v.set(x, y, z), _q, _s);
    g.applyMatrix4(_m);
    if (material.userData.uvScale) worldUV(g, material.userData.uvScale);

    let arr = this.buckets.get(material);
    if (!arr) { arr = []; this.buckets.set(material, arr); }
    arr.push(g);
    return this;
  }

  /** Caja. `r` > 0 => bordes redondeados (bisel). */
  box(w, h, d, mat, x = 0, y = 0, z = 0, o = {}) {
    const r = Math.min(o.r || 0, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
    const g = r > 0.002
      ? cached(`rb${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, o.rs || 2, r))
      : cached(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
    return this.geo(g, mat, x, y, z, o);
  }

  cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, o = {}) {
    const seg = o.seg || 16;
    const g = cached(`c${rt}|${rb}|${h}|${seg}|${o.open ? 1 : 0}|${o.arc || 0}`, () =>
      new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!o.open, 0, o.arc || Math.PI * 2));
    return this.geo(g, mat, x, y, z, o);
  }

  sphere(r, mat, x = 0, y = 0, z = 0, o = {}) {
    const ws = o.seg || 20, hs = Math.max(6, Math.round(ws * 0.7));
    const g = cached(`s${r}|${ws}|${o.phiLen || 0}|${o.thetaLen || 0}`, () =>
      new THREE.SphereGeometry(r, ws, hs, 0, o.phiLen || Math.PI * 2, 0, o.thetaLen || Math.PI));
    return this.geo(g, mat, x, y, z, o);
  }

  capsule(r, len, mat, x = 0, y = 0, z = 0, o = {}) {
    const g = cached(`cap${r}|${len}|${o.seg || 8}`, () => new THREE.CapsuleGeometry(r, len, o.cs || 4, o.seg || 12));
    return this.geo(g, mat, x, y, z, o);
  }

  torus(R, r, mat, x = 0, y = 0, z = 0, o = {}) {
    const g = cached(`t${R}|${r}|${o.seg || 24}|${o.arc || 0}`, () => new THREE.TorusGeometry(R, r, o.tseg || 8, o.seg || 24, o.arc || Math.PI * 2));
    return this.geo(g, mat, x, y, z, o);
  }

  plane(w, h, mat, x = 0, y = 0, z = 0, o = {}) {
    const g = cached(`p${w}|${h}`, () => new THREE.PlaneGeometry(w, h));
    return this.geo(g, mat, x, y, z, o);
  }

  /** Cilindro entre dos puntos (tubos, barandillas, radios...). */
  tube(p1, p2, r, mat, seg = 8) {
    _a.set(...p1); _b.set(...p2);
    const len = _a.distanceTo(_b);
    if (len < 1e-5) return this;
    const dir = _b.clone().sub(_a).normalize();
    const mid = _a.clone().add(_b).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir);
    const e = new THREE.Euler().setFromQuaternion(q, 'YXZ');
    return this.cyl(r, r, len, mat, mid.x, mid.y, mid.z, { seg, rx: e.x, ry: e.y, rz: e.z });
  }

  /** Caja entre dos puntos con sección w x d. */
  beam(p1, p2, w, d, mat, o = {}) {
    _a.set(...p1); _b.set(...p2);
    const len = _a.distanceTo(_b);
    const dir = _b.clone().sub(_a).normalize();
    const mid = _a.clone().add(_b).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir);
    const e = new THREE.Euler().setFromQuaternion(q, 'YXZ');
    return this.box(w, len, d, mat, mid.x, mid.y, mid.z, { rx: e.x, ry: e.y, rz: e.z, r: o.r });
  }

  /** Tubo que sigue una curva Catmull-Rom (cables, mangueras, grifos). */
  curve(points, r, mat, o = {}) {
    const c = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.5);
    const g = new THREE.TubeGeometry(c, o.segs || 24, r, o.rs || 6, false);
    return this.geo(g, mat, 0, 0, 0, o);
  }

  /** Revolución (macetas, extintores, lámparas, cuencos). pts = [[radio, y], ...] */
  lathe(pts, mat, x = 0, y = 0, z = 0, o = {}) {
    const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), o.seg || 20);
    return this.geo(g, mat, x, y, z, o);
  }

  /** Construye el Group final con un Mesh por material. */
  build({ shadows = true } = {}) {
    const group = new THREE.Group();
    for (const [material, geos] of this.buckets) {
      const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
      if (geos.length > 1) geos.forEach(g => g.dispose());
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, material);
      const see = material.transparent || material.userData.noShadow;
      mesh.castShadow = shadows && !see;
      mesh.receiveShadow = !material.userData.noReceive;
      if (material.transparent) mesh.renderOrder = 2;
      group.add(mesh);
    }
    this.buckets.clear();
    return group;
  }
}

/** Hoja curvada (planta, hierbas). Largo en +Y, curva hacia +Z. */
export function leafGeometry(len = 0.6, wid = 0.12, bend = 0.25, segs = 6) {
  const pos = [], idx = [], uv = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const w = wid * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.08)), 0.7) * (1 - t * 0.35);
    const y = t * len, z = bend * t * t;
    pos.push(-w, y, z, w, y, z); uv.push(0, t, 1, t);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** PRNG determinista para que los props no cambien de aspecto entre cargas. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
