import * as THREE from 'three';
import { MAP, S, WALL_H } from '../data/levels.js';
import { wallTexture, floorTexture, ceilingTexture, doorTexture } from './Textures.js';

const key = (x, z) => x + ',' + z;

export class Hotel {
  constructor(scene) {
    this.scene = scene;
    this.rows = MAP.length;
    this.cols = MAP[0].length;
    this.wall = [];         // wall[z][x] boolean
    this.doors = new Map(); // "x,z" -> door
    this.pickups = [];
    this.lights = [];
    this.floorCells = [];
    this.spawn = new THREE.Vector3();
    this.entitySpawn = new THREE.Vector3();
    this.flickerUntil = 0;
    this.blackoutUntil = 0;
    this.time = 0;
    this.build();
  }

  cellOf(v) { return Math.round(v / S); }
  world(c) { return c * S; }

  isWall(x, z) {
    if (x < 0 || z < 0 || x >= this.cols || z >= this.rows) return true;
    return this.wall[z][x];
  }

  /** Sólido para el jugador (paredes y puertas cerradas). */
  isSolid(x, z) {
    if (this.isWall(x, z)) return true;
    const d = this.doors.get(key(x, z));
    return d ? !d.open : false;
  }

  /** Bloquea la visión (paredes y puertas cerradas). */
  blocksSight(x, z) { return this.isSolid(x, z); }

  /** Transitable para la entidad (abre puertas). */
  walkable(x, z) { return !this.isWall(x, z); }

  doorAt(x, z) { return this.doors.get(key(x, z)); }

  build() {
    const scene = this.scene;
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.95 });
    const doorMat = new THREE.MeshStandardMaterial({ map: doorTexture(), roughness: 0.8 });
    const exitMat = new THREE.MeshStandardMaterial({ color: 0x3a0d0d, roughness: 0.6, emissive: 0x330000 });

    const wallCells = [];
    for (let z = 0; z < this.rows; z++) {
      this.wall[z] = [];
      for (let x = 0; x < this.cols; x++) {
        const ch = MAP[z][x];
        this.wall[z][x] = ch === '#';
        if (ch === '#') wallCells.push([x, z]);
        else if (ch === 'D' || ch === 'X') { /* se procesa luego */ }
        else this.floorCells.push([x, z]);

        if (ch === 'P') this.spawn.set(x * S, 1.6, z * S);
        if (ch === 'E') this.entitySpawn.set(x * S, 0, z * S);
        if (ch === 'K' || ch === 'B' || ch === 'N') this.addPickup(ch, x, z);
      }
    }

    // Paredes instanciadas
    const wallGeo = new THREE.BoxGeometry(S, WALL_H, S);
    const walls = new THREE.InstancedMesh(wallGeo, wallMat, wallCells.length);
    const m = new THREE.Matrix4();
    wallCells.forEach(([x, z], i) => {
      m.setPosition(x * S, WALL_H / 2, z * S);
      walls.setMatrixAt(i, m);
    });
    walls.castShadow = walls.receiveShadow = true;
    scene.add(walls);

    // Puertas (después de conocer las paredes)
    for (let z = 0; z < this.rows; z++) {
      for (let x = 0; x < this.cols; x++) {
        const ch = MAP[z][x];
        if (ch === 'D' || ch === 'X') this.addDoor(x, z, ch === 'X', ch === 'X' ? exitMat : doorMat);
      }
    }

    // Suelo y techo
    const W = this.cols * S, H = this.rows * S;
    const cx = (this.cols - 1) * S / 2, cz = (this.rows - 1) * S / 2;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshStandardMaterial({ map: floorTexture(this.cols, this.rows), roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz); floor.receiveShadow = true;
    scene.add(floor);
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshStandardMaterial({ map: ceilingTexture(this.cols * 1.5, this.rows * 1.5), roughness: 1 })
    );
    ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, WALL_H, cz); ceil.receiveShadow = true;
    scene.add(ceil);

    this.addLights();
  }

  addDoor(x, z, isExit, mat) {
    const spanX = this.isWall(x - 1, z) && this.isWall(x + 1, z);
    const pivot = new THREE.Group();
    const dw = S - 0.08, dh = WALL_H - 0.25, dt = 0.14;
    const geo = spanX ? new THREE.BoxGeometry(dw, dh, dt) : new THREE.BoxGeometry(dt, dh, dw);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.position.set(spanX ? S / 2 : 0, dh / 2, spanX ? 0 : S / 2);
    pivot.add(mesh);
    pivot.position.set(x * S - (spanX ? S / 2 : 0), 0, z * S - (spanX ? 0 : S / 2));
    this.scene.add(pivot);
    // dintel sobre la puerta
    const lintel = new THREE.Mesh(
      spanX ? new THREE.BoxGeometry(S, 0.25, S) : new THREE.BoxGeometry(S, 0.25, S),
      new THREE.MeshStandardMaterial({ color: 0x2a2a26, roughness: 1 })
    );
    lintel.position.set(x * S, WALL_H - 0.125, z * S);
    this.scene.add(lintel);

    this.doors.set(key(x, z), {
      x, z, pivot, spanX, isExit, open: false, angle: 0, locked: isExit,
      center: new THREE.Vector3(x * S, 1.2, z * S),
    });
  }

  openDoor(d, sound) {
    if (d.open || d.locked) return false;
    d.open = true; if (sound) sound();
    return true;
  }
  toggleDoor(d) { if (!d.locked) d.open = !d.open; }

  addPickup(ch, x, z) {
    const g = new THREE.Group();
    let light = null;
    if (ch === 'K') {
      const mat = new THREE.MeshStandardMaterial({ color: 0xd9b24c, emissive: 0x6b4f10, metalness: 0.8, roughness: 0.3 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 20), mat);
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.04), mat); shaft.position.y = -0.24;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), mat); tooth.position.set(0.06, -0.36, 0);
      g.add(ring, shaft, tooth);
      light = new THREE.PointLight(0xffc860, 1.4, 5, 2); g.add(light);
    } else if (ch === 'B') {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.34, 14),
        new THREE.MeshStandardMaterial({ color: 0x2a8f4a, emissive: 0x0b3a1a, roughness: 0.4 }));
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 10),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 1, roughness: 0.3 }));
      cap.position.y = 0.2; g.add(body, cap);
    } else {
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xe4dcc0, emissive: 0x3a3626, roughness: 1 }));
      paper.rotation.x = 0.3; g.add(paper);
    }
    g.position.set(x * S, 1.0, z * S);
    this.scene.add(g);
    this.pickups.push({ type: ch, mesh: g, x: x * S, z: z * S, taken: false, baseY: 1.0, seed: Math.random() * 10, noteIndex: -1, light });
  }

  removePickup(p) { p.taken = true; this.scene.remove(p.mesh); }

  addLights() {
    this.scene.add(new THREE.AmbientLight(0x3a4458, 2.2));
    // Fluorescentes del pasillo (z = 5)
    const corridorZ = MAP.findIndex(r => r.includes('P'));
    [3, 8, 13, 18].forEach((cx, i) => {
      const l = new THREE.PointLight(0xcfe6d0, 28, 18, 1.6);
      l.position.set(cx * S, WALL_H - 0.4, corridorZ * S);
      this.scene.add(l);
      const tube = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xdff5e0 }));
      tube.position.copy(l.position); tube.position.y += 0.22;
      this.scene.add(tube);
      this.lights.push({ light: l, tube, base: 28, unstable: i % 2 === 0, seed: Math.random() * 100 });
    });
    // Luz roja tenue sobre la salida
    const red = new THREE.PointLight(0xff2222, 5, 8, 2);
    red.position.set((this.cols - 2) * S, 2.4, corridorZ * S);
    this.scene.add(red);
    this.lights.push({ light: red, base: 5, unstable: true, seed: 7 });
  }

  /** Hace parpadear todas las luces durante `s` segundos. */
  flicker(s) { this.flickerUntil = this.time + s; }
  /** Apaga todas las luces durante `s` segundos. */
  blackout(s) { this.blackoutUntil = this.time + s; }

  update(dt) {
    this.time += dt;
    const t = this.time;

    for (const d of this.doors.values()) {
      const target = d.open ? (d.spanX ? -1 : 1) * Math.PI * 0.5 : 0;
      d.angle += (target - d.angle) * Math.min(1, dt * 6);
      d.pivot.rotation.y = d.angle;
    }

    for (const p of this.pickups) {
      if (p.taken) continue;
      p.mesh.rotation.y = t * 1.5 + p.seed;
      p.mesh.position.y = p.baseY + Math.sin(t * 2 + p.seed) * 0.05;
    }

    for (const L of this.lights) {
      let k = 1;
      if (t < this.blackoutUntil) k = 0;
      else if (t < this.flickerUntil) k = Math.random() > 0.5 ? 1 : 0.05;
      else if (L.unstable) {
        const n = Math.sin(t * 13 + L.seed) * Math.sin(t * 7.3 + L.seed * 2);
        k = n > 0.82 ? 0.15 : 1;
      }
      L.light.intensity = L.base * k;
      if (L.tube) L.tube.material.color.setScalar(0.25 + 0.75 * k).multiply(new THREE.Color(0.87, 0.96, 0.88));
    }
  }
}
