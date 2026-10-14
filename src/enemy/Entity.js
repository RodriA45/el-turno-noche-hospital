import * as THREE from 'three';
import { S } from '../data/levels.js';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class Entity {
  constructor(scene, hotel) {
    this.hotel = hotel;
    this.pos = hotel.entitySpawn.clone();
    this.state = 'patrol';
    this.path = [];
    this.repath = 0;
    this.lostTimer = 0;
    this.searchTimer = 0;
    this.lastKnown = null;
    this.sees = false;
    this.rotY = 0;
    this.stepTimer = 0;
    this.moving = false;
    this.onStep = null;
    this.onDoor = null;
    this.onSpot = null;
    this.speedBonus = 0;

    const g = new THREE.Group();
    const dark = new THREE.MeshStandardMaterial({ color: 0x0a0808, roughness: 0.95 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.7, 10), dark); body.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), dark); head.position.y = 2.18; head.scale.set(0.85, 1.25, 0.9);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), dark); armL.position.set(-0.4, 1.15, 0.05);
    const armR = armL.clone(); armR.position.x = 0.4;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat); e1.position.set(-0.07, 2.22, 0.16);
    const e2 = e1.clone(); e2.position.x = 0.07;
    g.add(body, head, armL, armR, e1, e2);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    const glow = new THREE.PointLight(0xff2200, 2.5, 5, 2); glow.position.set(0, 2.2, 0.3); g.add(glow);
    this.glow = glow; this.arms = [armL, armR];
    this.mesh = g;
    g.position.copy(this.pos);
    scene.add(g);
  }

  cell() { return [this.hotel.cellOf(this.pos.x), this.hotel.cellOf(this.pos.z)]; }

  los(px, pz) {
    const h = this.hotel;
    const dx = px - this.pos.x, dz = pz - this.pos.z;
    const n = Math.ceil(Math.hypot(dx, dz) / 0.5);
    for (let i = 1; i < n; i++) {
      const x = this.pos.x + dx * i / n, z = this.pos.z + dz * i / n;
      if (h.blocksSight(h.cellOf(x), h.cellOf(z))) return false;
    }
    return true;
  }

  bfs(sx, sz, gx, gz) {
    const h = this.hotel;
    if (sx === gx && sz === gz) return [];
    const q = [[sx, sz]], prev = new Map([[sx + ',' + sz, null]]);
    while (q.length) {
      const [x, z] = q.shift();
      if (x === gx && z === gz) {
        const path = []; let k = x + ',' + z;
        while (prev.get(k)) { const p = prev.get(k); path.push([+k.split(',')[0], +k.split(',')[1]]); k = p; }
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

  goTo(x, z) { const [cx, cz] = this.cell(); this.path = this.bfs(cx, cz, x, z); }

  randomTarget() {
    const cells = this.hotel.floorCells;
    const c = cells[Math.floor(Math.random() * cells.length)];
    this.goTo(c[0], c[1]);
  }

  /** @returns true si atrapó al jugador */
  update(dt, player, t) {
    const h = this.hotel;
    const dx = player.pos.x - this.pos.x, dz = player.pos.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    this.dist = d;

    // Percepción
    const fx = Math.sin(this.rotY), fz = Math.cos(this.rotY);
    let range = player.flashOn ? 17 : 8;
    if (player.crouch) range *= 0.65;
    const facing = d > 0 ? (dx * fx + dz * fz) / d : 1;
    const los = this.los(player.pos.x, player.pos.z);
    this.sees = los && ((d < range && facing > 0.3) || d < 2.4);
    const hears = d < player.noise && player.noise > 2 && (los || d < player.noise * 0.6);

    switch (this.state) {
      case 'patrol':
        if (this.sees) this.setState('chase');
        else if (hears) { this.lastKnown = [h.cellOf(player.pos.x), h.cellOf(player.pos.z)]; this.setState('investigate'); }
        else if (!this.path.length) this.randomTarget();
        break;
      case 'investigate':
        if (this.sees) this.setState('chase');
        else if (!this.path.length) { this.setState('search'); }
        break;
      case 'chase':
        if (this.sees) {
          this.lostTimer = 0;
          this.lastKnown = [h.cellOf(player.pos.x), h.cellOf(player.pos.z)];
        } else {
          this.lostTimer += dt;
          if (this.lostTimer > 4.5) { this.setState('search'); }
        }
        this.repath -= dt;
        if (this.repath <= 0 && this.lastKnown) { this.goTo(this.lastKnown[0], this.lastKnown[1]); this.repath = 0.35; }
        break;
      case 'search':
        this.searchTimer -= dt;
        this.rotY += dt * 1.6;
        if (this.sees) this.setState('chase');
        else if (hears) { this.lastKnown = [h.cellOf(player.pos.x), h.cellOf(player.pos.z)]; this.setState('investigate'); }
        else if (this.searchTimer <= 0) this.setState('patrol');
        break;
    }

    // Movimiento
    const speed = { patrol: 1.5, investigate: 2.2, chase: 3.7 + this.speedBonus, search: 0 }[this.state];
    this.moving = false;
    if (this.path.length && speed > 0) {
      const [cx, cz] = this.path[0];
      const door = h.doorAt(cx, cz);
      if (door && !door.open && !door.locked) h.openDoor(door, () => this.onDoor?.(door));
      if (door && door.locked) { this.path = []; }
      else {
        const tx = cx * S, tz = cz * S;
        const vx = tx - this.pos.x, vz = tz - this.pos.z, vd = Math.hypot(vx, vz);
        if (vd < 0.12) this.path.shift();
        else {
          const st = Math.min(vd, speed * dt);
          this.pos.x += vx / vd * st; this.pos.z += vz / vd * st;
          const target = Math.atan2(vx, vz);
          let diff = target - this.rotY; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          this.rotY += diff * Math.min(1, dt * 8);
          this.moving = true;
        }
      }
    } else if (this.state === 'chase' && this.sees) {
      // acercarse directo al jugador
      this.rotY = Math.atan2(dx, dz);
    }

    this.mesh.position.copy(this.pos);
    this.mesh.position.y = this.moving ? Math.abs(Math.sin(t * 6)) * 0.04 : 0;
    this.mesh.rotation.y = this.rotY;
    this.arms[0].rotation.x = Math.sin(t * 4) * 0.15; this.arms[1].rotation.x = -Math.sin(t * 4) * 0.15;
    this.glow.intensity = this.state === 'chase' ? 6 : 2.5;

    // Pasos audibles
    if (this.moving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) { this.stepTimer = this.state === 'chase' ? 0.3 : 0.65; this.onStep?.(this.pos); }
    }

    return d < 1.0 && los;
  }

  setState(s) {
    if (s === this.state) return;
    const prev = this.state;
    this.state = s;
    if (s === 'chase') { this.repath = 0; this.lostTimer = 0; if (prev !== 'chase') this.onSpot?.(); }
    if (s === 'search') { this.searchTimer = 4.5; this.path = []; }
    if (s === 'investigate' && this.lastKnown) this.goTo(this.lastKnown[0], this.lastKnown[1]);
    if (s === 'patrol') { this.path = []; }
  }
}
