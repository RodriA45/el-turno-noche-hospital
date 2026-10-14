import * as THREE from 'three';
import { S, WALL_H, buildFloor } from '../data/floors.js';
import { wallMaps, floorMaps, ceilingMap, doorMap, signTexture } from './Textures.js';
import { MODELS, FOOT, doorLeaf, stairsModel } from './Models.js';

const key = (x, z) => x + ',' + z;

export class Hospital {
  constructor(scene) {
    this.scene = scene;
    this.group = null;
    this.ambient = new THREE.AmbientLight(0x606a78, 1.4);
    scene.add(this.ambient);
    this.wallMat = new THREE.MeshStandardMaterial({ roughness: 0.88, bumpScale: 1.8 });
    const wm = wallMaps();
    this.wallMat.map = wm.map;
    this.wallMat.bumpMap = wm.bump;

    this.doorMat = new THREE.MeshStandardMaterial({ map: doorMap(), roughness: 0.72 });
    this.exitMat = new THREE.MeshStandardMaterial({ color: 0x421310, roughness: 0.5, metalness: 0.25 });

    // Materiales arquitectónicos para zócalos y guardacamillas
    this.baseboardMat = new THREE.MeshStandardMaterial({ color: 0x181816, roughness: 0.9 });
    this.bumperMat = new THREE.MeshStandardMaterial({ color: 0x8a785c, roughness: 0.65 });
    this.trimMat = new THREE.MeshStandardMaterial({ color: 0x3e3c36, roughness: 0.8 });

    this.floorNum = 0;
    this.interactables = [];
    this.doors = new Map();
    this.doorState = {}; // persistencia de puertas abiertas por piso
    this.time = 0;
    this.flickerUntil = 0;
    this.blackoutUntil = 0;
    this.lightsOff = false;
    this.lights = [];
    this.colliders = [];
    this.decals = {};
  }

  cellOf(v) { return Math.round(v / S); }
  isWall(x, z) {
    if (x < 0 || z < 0 || x >= this.cols || z >= this.rows) return true;
    return this.wall[z][x];
  }
  isSolid(x, z) {
    if (this.isWall(x, z)) return true;
    const d = this.doors.get(key(x, z));
    return d ? !d.open : false;
  }
  blocksSight(x, z) { return this.isSolid(x, z); }
  walkable(x, z) { return !this.isWall(x, z) && !this.stairCells.has(key(x, z)); }
  doorAt(x, z) { return this.doors.get(key(x, z)); }

  blockedAt(px, pz) {
    if (this.isSolid(this.cellOf(px), this.cellOf(pz))) return true;
    if (this.stairCells.has(key(this.cellOf(px), this.cellOf(pz)))) return true;
    for (const c of this.colliders) {
      if (px > c.x1 && px < c.x2 && pz > c.z1 && pz < c.z2) return true;
    }
    return false;
  }

  dispose() {
    if (!this.group) return;
    this.scene.remove(this.group);
    this.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }

  /** Construye un piso. `extra` = definiciones dinámicas (objetos de capítulo). */
  load(n, extra = []) {
    // Guardar estado de puertas
    if (this.floorNum) {
      const st = this.doorState[this.floorNum] ||= {};
      for (const [k, d] of this.doors) st[k] = d.open;
    }
    this.dispose();
    const def = this.def = buildFloor(n);
    this.floorNum = n;
    const g = this.group = new THREE.Group();
    this.scene.add(g);
    const map = def.map();
    this.rows = map.length;
    this.cols = map[0].length;
    this.wall = [];
    this.doors = new Map();
    this.interactables = [];
    this.lights = [];
    this.colliders = [];
    this.stairCells = new Set();
    this.decals = {};

    const wallCells = [];
    for (let z = 0; z < this.rows; z++) {
      this.wall[z] = [];
      for (let x = 0; x < this.cols; x++) {
        const ch = map[z][x];
        this.wall[z][x] = ch === '#';
        if (ch === '#') wallCells.push([x, z]);
      }
    }

    // Paredes principales
    const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(S, WALL_H, S), this.wallMat, wallCells.length);
    const mt = new THREE.Matrix4();
    wallCells.forEach(([x, z], i) => {
      mt.setPosition(x * S, WALL_H / 2, z * S);
      walls.setMatrixAt(i, mt);
    });
    walls.castShadow = walls.receiveShadow = true;
    g.add(walls);

    // Detalles arquitectónicos: zócalos y guardacamillas
    this.addWallTrims(g, wallCells, map);

    // Suelo y techo
    const W = this.cols * S, H = this.rows * S, cx = (this.cols - 1) * S / 2, cz = (this.rows - 1) * S / 2;
    const fm = floorMaps(this.cols * 1.5, this.rows * 1.5);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshStandardMaterial({ map: fm.map, roughnessMap: fm.rough, roughness: 0.52, metalness: 0.08 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0, cz);
    floor.receiveShadow = true;
    g.add(floor);

    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshStandardMaterial({ map: ceilingMap(this.cols * 1.2, this.rows * 1.2), roughness: 0.95 })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, WALL_H, cz);
    ceil.receiveShadow = true;
    g.add(ceil);

    // Puertas
    const saved = this.doorState[n] || {};
    for (const [k, info] of Object.entries(def.doors)) {
      const [x, z] = k.split(',').map(Number);
      this.addDoor(g, x, z, info, !!saved[k]);
    }
    // Escaleras
    for (const st of def.stairs) this.addStairs(g, st);
    // Decorado
    for (const d of def.decor) this.addDecor(g, d);
    // Carteles y graffitis
    for (const d of def.decals) this.addDecal(g, d);
    // Luces
    def.lights.forEach(L => this.addLight(g, L));
    this.ambient.intensity = def.ambient;
    // Objetos dinámicos del guión
    for (const e of extra) if (e.floor === n) this.add(e);
  }

  /** Genera zócalos (baseboards) y protectores de pared (guardacamillas) en caras expuestas */
  addWallTrims(g, wallCells, map) {
    const faces = [];
    for (const [x, z] of wallCells) {
      // Comprobar caras contiguas vacías con desplazamiento hacia afuera para evitar z-fighting
      if (z > 0 && map[z - 1][x] !== '#') faces.push({ x, z, dir: 'n', angle: 0, px: x * S, pz: z * S - S / 2 - 0.02 });
      if (z < this.rows - 1 && map[z + 1][x] !== '#') faces.push({ x, z, dir: 's', angle: Math.PI, px: x * S, pz: z * S + S / 2 + 0.02 });
      if (x > 0 && map[z][x - 1] !== '#') faces.push({ x, z, dir: 'w', angle: Math.PI / 2, px: x * S - S / 2 - 0.02, pz: z * S });
      if (x < this.cols - 1 && map[z][x + 1] !== '#') faces.push({ x, z, dir: 'e', angle: -Math.PI / 2, px: x * S + S / 2 + 0.02, pz: z * S });
    }

    if (faces.length === 0) return;

    // Zócalo inferior (altura 0.12m, saliente 0.04m)
    const baseGeo = new THREE.BoxGeometry(S, 0.12, 0.04);
    const baseMesh = new THREE.InstancedMesh(baseGeo, this.baseboardMat, faces.length);

    // Guardacamillas / pasamanos clínico a la altura de la cintura (y = 1.05m)
    const railGeo = new THREE.BoxGeometry(S, 0.15, 0.05);
    const railMesh = new THREE.InstancedMesh(railGeo, this.bumperMat, faces.length);

    const q = new THREE.Quaternion();
    const sc = new THREE.Vector3(1, 1, 1);
    const mtx = new THREE.Matrix4();

    faces.forEach((f, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), f.angle);

      // Zócalo
      mtx.compose(new THREE.Vector3(f.px, 0.06, f.pz), q, sc);
      baseMesh.setMatrixAt(i, mtx);

      // Guardacamillas
      mtx.compose(new THREE.Vector3(f.px, 1.05, f.pz), q, sc);
      railMesh.setMatrixAt(i, mtx);
    });

    baseMesh.castShadow = baseMesh.receiveShadow = true;
    railMesh.castShadow = railMesh.receiveShadow = true;
    g.add(baseMesh, railMesh);
  }

  addDoor(g, x, z, info, open) {
    const spanX = this.isWall(x - 1, z) && this.isWall(x + 1, z);
    const isExit = !!info.exit;
    const dh = WALL_H - 0.3, dw = S - 0.2;
    const leaf = doorLeaf(isExit ? this.exitMat : this.doorMat, dw, dh, 0.1, isExit);
    const pivot = new THREE.Group();
    pivot.add(leaf);

    if (spanX) {
      pivot.position.set(x * S - dw / 2, 0, z * S);
    } else {
      pivot.position.set(x * S, 0, z * S - dw / 2);
      leaf.rotation.y = -Math.PI / 2;
      leaf.position.set(0, 0, 0);
      pivot.rotation.y = 0;
    }
    g.add(pivot);

    // Marco de puerta
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x48453c, roughness: 0.8 });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(S, WALL_H - dh + 0.05, S), frameMat);
    lintel.position.set(x * S, WALL_H - (WALL_H - dh) / 2 + 0.025, z * S);
    g.add(lintel);

    for (const s of [-1, 1]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(spanX ? 0.1 : S, dh, spanX ? S : 0.1), frameMat);
      jamb.position.set(x * S + (spanX ? s * (S / 2 - 0.05) : 0), dh / 2, z * S + (spanX ? 0 : s * (S / 2 - 0.05)));
      g.add(jamb);
    }

    // Cartel luminoso de SALIDA DE EMERGENCIA sobre puertas de salida
    if (isExit) {
      const exitBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.14), new THREE.MeshStandardMaterial({ color: 0x141615, roughness: 0.8 }));
      exitBox.position.set(x * S, dh + 0.18, z * S);
      const exitFace = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.18), new THREE.MeshBasicMaterial({ color: 0x24e068 }));
      exitFace.position.set(x * S, dh + 0.18, z * S + 0.075);
      g.add(exitBox, exitFace);

      const exitLight = new THREE.PointLight(0x24e068, 0.7, 4.5, 2);
      exitLight.position.set(x * S, dh + 0.18, z * S + 0.25);
      g.add(exitLight);
    }

    const d = {
      x, z, spanX, pivot, info, open, angle: 0,
      lock: info.lock || null, label: info.label, isExit,
      center: new THREE.Vector3(x * S, 1.2, z * S), hingeSign: 1
    };
    this.doors.set(key(x, z), d);
    this.interactables.push({ id: 'door:' + key(x, z), kind: 'door', door: d, x: x * S, z: z * S, range: 2.8, label: info.label });
    d.angle = open ? this.openAngle(d) : 0;
    pivot.rotation.y = d.angle;
  }

  openAngle(d) { return d.spanX ? -Math.PI * 0.52 : Math.PI * 0.52; }

  addStairs(g, st) {
    const m = stairsModel(st.dir);
    m.position.set(st.x * S, 0, st.z * S);
    g.add(m);
    this.stairCells.add(key(st.x, st.z));
    this.interactables.push({
      id: 'stairs:' + st.dir, kind: 'stairs', stair: st, x: st.x * S, z: st.z * S + 0.6, range: 3.2,
      label: st.dir === 'up' ? 'Subir escaleras' : 'Bajar escaleras',
    });
  }

  addDecor(g, d) {
    const fac = MODELS[d.type];
    if (!fac) return;
    const m = fac(d);
    m.position.set(d.x * S, 0, d.z * S);
    m.rotation.y = (d.rot || 0) * Math.PI / 180;
    g.add(m);

    // Registro de escondite interactivo estilo Resident Evil
    if (d.hiding) {
      this.interactables.push({
        id: 'hiding:' + d.x + ',' + d.z,
        kind: 'hiding',
        x: d.x * S,
        z: d.z * S,
        range: 2.3,
        label: 'Esconderse en el casillero',
        spot: d,
      });
    }

    const foot = FOOT[d.type];
    if (!foot || !foot[2]) return;
    let w = d.len || foot[0], dd = foot[1];
    if (d.type === 'desk' && d.len) w = d.len + 0.1;
    const r = (d.rot || 0) * Math.PI / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
    const hw = (w * c + dd * s) / 2, hd = (w * s + dd * c) / 2;
    this.colliders.push({ x1: d.x * S - hw, x2: d.x * S + hw, z1: d.z * S - hd, z2: d.z * S + hd });
  }

  addDecal(g, d) {
    const w = d.w || 1, h = d.h || 0.4;
    const tex = signTexture(d.text, { w: 512, h: Math.round(512 * h / w), size: d.size || 70, fg: d.fg, bg: d.bg === undefined ? '#1d3a3a' : d.bg, font: d.font });
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, transparent: !d.bg, alphaTest: d.bg ? 0 : 0.1, polygonOffset: true, polygonOffsetFactor: -2 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const o = S / 2 - 0.02, X = d.x * S, Z = d.z * S;
    if (d.face === 'n') { m.position.set(X, d.y, Z - o); m.rotation.y = 0; }
    if (d.face === 's') { m.position.set(X, d.y, Z + o); m.rotation.y = Math.PI; }
    if (d.face === 'w') { m.position.set(X - o, d.y, Z); m.rotation.y = Math.PI / 2; }
    if (d.face === 'e') { m.position.set(X + o, d.y, Z); m.rotation.y = -Math.PI / 2; }
    m.visible = !d.hidden;
    g.add(m);
    if (d.name) this.decals[d.name] = m;
  }

  addLight(g, L) {
    const light = new THREE.PointLight(L.color, L.intensity, 22, 1.6);
    light.position.set(L.x * S, WALL_H - 0.55, L.z * S);
    g.add(light);

    let tube = null;
    if (!L.noTube) {
      // Carcasa empotrada de chapa metálica
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.42), new THREE.MeshStandardMaterial({ color: 0x4a4a46, roughness: 0.7 }));
      frame.position.set(L.x * S, WALL_H - 0.03, L.z * S);
      g.add(frame);

      // Tubos fluorescentes gemelos encendidos
      tube = new THREE.Group();
      tube.position.set(L.x * S, WALL_H - 0.05, L.z * S);
      for (const s of [-0.08, 0.08]) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 8), new THREE.MeshBasicMaterial({ color: L.color }));
        t.rotation.z = Math.PI / 2;
        t.position.z = s;
        tube.add(t);
      }
      g.add(tube);
    }
    this.lights.push({ light, tube, base: L.intensity, color: new THREE.Color(L.color), unstable: !!L.unstable, seed: Math.random() * 100 });
  }

  /** Añade un objeto interactivo dinámico (mesh opcional). */
  add(e) {
    let mesh = null;
    if (e.model) {
      mesh = typeof e.model === 'function' ? e.model() : e.model.clone();
      mesh.position.set(e.x * S, e.y ?? 1.0, e.z * S);
      if (e.rotY) mesh.rotation.y = e.rotY;
      mesh.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
      this.group.add(mesh);
    }
    const it = { range: 2.4, ...e, x: e.x * S, z: e.z * S, mesh, baseY: e.y ?? 1.0, seed: Math.random() * 10 };
    this.interactables.push(it);
    return it;
  }

  remove(id) {
    const i = this.interactables.findIndex(it => it.id === id);
    if (i < 0) return;
    const it = this.interactables[i];
    if (it.mesh) this.group.remove(it.mesh);
    this.interactables.splice(i, 1);
  }

  find(id) { return this.interactables.find(i => i.id === id); }
  showDecal(name, v = true) { if (this.decals[name]) this.decals[name].visible = v; }

  flicker(s) { this.flickerUntil = this.time + s; }
  blackout(s) { this.blackoutUntil = this.time + s; }
  setLights(on) { this.lightsOff = !on; }

  update(dt) {
    this.time += dt;
    const t = this.time;
    for (const d of this.doors.values()) {
      const target = d.open ? this.openAngle(d) : 0;
      d.angle += (target - d.angle) * Math.min(1, dt * 6);
      d.pivot.rotation.y = d.angle;
    }
    for (const it of this.interactables) {
      if (it.mesh && it.spin) {
        it.mesh.rotation.y = t * 1.2 + it.seed;
        it.mesh.position.y = it.baseY + Math.sin(t * 2 + it.seed) * 0.03;
      }
    }
    for (const L of this.lights) {
      let k = 1;
      if (this.lightsOff || t < this.blackoutUntil) k = 0;
      else if (t < this.flickerUntil) k = Math.random() > 0.45 ? 1 : 0.04;
      else if (L.unstable) {
        const n = Math.sin(t * 13 + L.seed) * Math.sin(t * 7.3 + L.seed * 2);
        k = n > 0.78 ? 0.10 : 1;
      }
      L.light.intensity = L.base * k;
      if (L.tube) {
        L.tube.traverse(ch => {
          if (ch.isMesh && ch.material) {
            ch.material.color.copy(L.color).multiplyScalar(0.08 + 0.92 * k);
          }
        });
      }
    }
  }
}
