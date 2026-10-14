import * as THREE from 'three';
import { PEOPLE } from '../world/Models.js';

const S = 3;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Un personaje que camina por la cuadrícula (fantasma, compañeras, guardias, hermano). */
export class Actor {
  constructor(scene, hospital, factory) {
    this.hospital = hospital;
    this.mesh = factory();
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.pos = new THREE.Vector3();
    this.floor = 0; this.rotY = 0;
    this.path = []; this.speed = 1.6; this.onArrive = null;
    this.moving = false; this.anim = 0; this.pose = 'idle'; // idle | wave | cower
    this.opensDoors = true;
  }
  place(floor, cx, cz, rotY = this.rotY) {
    this.floor = floor; this.pos.set(cx * S, 0, cz * S); this.rotY = rotY; this.path = []; this.mesh.visible = true;
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = rotY;
  }
  hide() { this.mesh.visible = false; this.floor = 0; this.path = []; }
  cell() { return [this.hospital.cellOf(this.pos.x), this.hospital.cellOf(this.pos.z)]; }

  bfs(sx, sz, gx, gz) {
    const h = this.hospital;
    if (sx === gx && sz === gz) return [];
    const q = [[sx, sz]], prev = new Map([[sx + ',' + sz, null]]);
    while (q.length) {
      const [x, z] = q.shift();
      if (x === gx && z === gz) {
        const path = []; let k = x + ',' + z;
        while (prev.get(k)) { path.push(k.split(',').map(Number)); k = prev.get(k); }
        return path.reverse();
      }
      for (const [dx, dz] of DIRS) {
        const nx = x + dx, nz = z + dz, nk = nx + ',' + nz;
        if (prev.has(nk) || !h.walkable(nx, nz)) continue;
        prev.set(nk, x + ',' + z); q.push([nx, nz]);
      }
    }
    return [];
  }
  goTo(cx, cz, speed = this.speed, cb = null) {
    const [sx, sz] = this.cell();
    this.path = this.bfs(sx, sz, cx, cz); this.speed = speed; this.onArrive = cb;
    if (!this.path.length && cb) { const f = cb; this.onArrive = null; f(); }
  }
  face(x, z) { this.rotY = Math.atan2(x - this.pos.x, z - this.pos.z); }

  step(dt, t) {
    if (!this.mesh.visible) return;
    const h = this.hospital;
    this.moving = false;
    if (this.floor === h.floorNum && this.path.length) {
      const [cx, cz] = this.path[0];
      const door = h.doorAt(cx, cz);
      if (door && !door.open && this.opensDoors) door.open = true;
      const vx = cx * S - this.pos.x, vz = cz * S - this.pos.z, vd = Math.hypot(vx, vz);
      if (vd < 0.12) {
        this.path.shift();
        if (!this.path.length && this.onArrive) { const f = this.onArrive; this.onArrive = null; f(); }
      } else {
        const st = Math.min(vd, this.speed * dt);
        this.pos.x += vx / vd * st; this.pos.z += vz / vd * st;
        let diff = Math.atan2(vx, vz) - this.rotY; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.rotY += diff * Math.min(1, dt * 9);
        this.moving = true;
      }
    } else if (this.path.length && this.floor !== h.floorNum) {
      // fuera de pantalla: avanzar instantáneo al final
      const [cx, cz] = this.path[this.path.length - 1]; this.pos.set(cx * S, 0, cz * S); this.path = [];
      if (this.onArrive) { const f = this.onArrive; this.onArrive = null; f(); }
    }
    this.mesh.visible = this.floor === h.floorNum && this.visibleFlag !== false;
    this.animate(dt, t);
  }

  animate(dt, t) {
    const { legs, arms, head } = this.mesh.userData;
    const sp = this.moving ? 1 : 0;
    this.anim += dt * (this.speed * 3.2) * sp;
    const sw = Math.sin(this.anim) * 0.55 * sp;
    legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
    if (this.pose === 'wave') {
      arms[1].rotation.x = -2.4 + Math.sin(t * 6) * 0.35; arms[1].rotation.z = -0.2;
      arms[0].rotation.x = 0.1;
    } else if (this.pose === 'cower') {
      arms[0].rotation.x = -2.3; arms[1].rotation.x = -2.3; head.rotation.x = 0.5;
    } else if (this.pose === 'reach') {
      arms[0].rotation.x = -1.5; arms[1].rotation.x = -1.5;
    } else {
      arms[0].rotation.x = -sw * 0.7; arms[1].rotation.x = sw * 0.7; arms[1].rotation.z = 0;
      head.rotation.x = 0;
    }
    this.mesh.position.set(this.pos.x, this.moving ? Math.abs(Math.sin(this.anim)) * 0.03 : 0, this.pos.z);
    this.mesh.rotation.y = this.rotY;
  }
}

export class Ghost extends Actor {
  constructor(scene, hospital) {
    super(scene, hospital, PEOPLE.ghostBoy);
    this.mode = 'off';      // off | stand | chase
    this.chaseSpeed = 3.4;
    this.repath = 0;
    this.onCatch = null; this.catchCd = 0;
    this.glow = new THREE.PointLight(0x7aa0ff, 1.6, 6, 2); this.glow.position.set(0, 1.2, 0.3); this.mesh.add(this.glow);
    this.eyeFlicker = 0; this.seenTimer = 0; this.autoVanish = false;
    this.dist = 99;
  }
  appear(floor, cx, cz, mode = 'stand', autoVanish = false) {
    this.place(floor, cx, cz); this.mode = mode; this.autoVanish = autoVanish; this.seenTimer = 0; this.visibleFlag = true;
    this.pose = 'idle';
  }
  vanish() { this.mode = 'off'; this.hide(); }
  startChase(speed = 3.4) { this.mode = 'chase'; this.chaseSpeed = speed; this.repath = 0; }

  update(dt, player, t) {
    this.catchCd -= dt;
    if (this.mode === 'off' || !this.mesh.visible && this.floor !== this.hospital.floorNum) {
      this.step(dt, t); return;
    }
    const dx = player.pos.x - this.pos.x, dz = player.pos.z - this.pos.z;
    this.dist = Math.hypot(dx, dz);
    if (this.mode === 'stand') {
      this.rotY = Math.atan2(dx, dz);
      // parpadeo espectral
      this.visibleFlag = Math.sin(t * 23) * Math.sin(t * 9) > -0.85;
      if (this.autoVanish) {
        // si el jugador lo mira de frente cerca, desaparece
        const fw = player.forward, dot = (-dx * fw.x - dz * fw.z) / (this.dist || 1);
        if (dot > 0.85 && this.dist < 14) this.seenTimer += dt; else this.seenTimer = Math.max(0, this.seenTimer - dt * 0.5);
        if (this.seenTimer > 1.6 || this.dist < 3.2) { this.onVanish?.(); this.vanish(); return; }
      }
    } else if (this.mode === 'chase' && this.floor === this.hospital.floorNum) {
      this.visibleFlag = true;
      this.repath -= dt;
      if (this.repath <= 0) {
        const [sx, sz] = this.cell(); this.path = this.bfs(sx, sz, this.hospital.cellOf(player.pos.x), this.hospital.cellOf(player.pos.z));
        this.repath = 0.3; this.speed = this.chaseSpeed;
      }
      if (this.dist < 1.2 && this.catchCd <= 0) { this.catchCd = 3; this.onCatch?.(); }
    }
    this.step(dt, t);
    this.glow.intensity = this.mode === 'chase' ? 3.2 : 1.4;
  }
}
