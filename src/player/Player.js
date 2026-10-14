import * as THREE from 'three';
import { flashlightCookie } from '../world/Textures.js';

const R = 0.3; // radio del jugador

export class Player {
  constructor(camera, scene, hotel, input) {
    this.camera = camera; this.hotel = hotel; this.input = input;
    this.pos = new THREE.Vector3(0, 1.6, 0);
    this.yaw = Math.PI / 2;
    this.pitch = 0;
    this.stamina = 1; this.exhausted = false;
    this.battery = 1; this.flashOn = false; this.hasFlash = false;
    this.crouch = false; this.eye = 1.6;
    this.keys = 0;
    this.moving = false; this.sprinting = false;
    this.noise = 1;
    this.bob = 0; this.lastStepSign = 1;
    this.onStep = null;
    this.sens = 0.0022;

    // Inercia de linterna (sway)
    this.flashSwayX = 0; this.flashSwayY = 0;

    scene.add(camera);

    // Linterna principal con haz óptico (cookie con anillos de difracción Fresnel y hotspot)
    const cookie = flashlightCookie();
    const spot = new THREE.SpotLight(0xfff5e6, 85, 34, Math.PI / 4.2, 0.75, 1.25);
    spot.map = cookie;
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0005;
    spot.shadow.camera.near = 0.2;
    spot.position.set(0.18, -0.14, 0.05);
    spot.target.position.set(0, 0, -6);
    camera.add(spot, spot.target);
    this.spot = spot;
    this.baseIntensity = 85;

    // Luz difusa de rebote en el suelo y paredes cercanas (bounce light)
    const bounce = new THREE.PointLight(0xffeedd, 0, 4.5, 2.0);
    bounce.position.set(0.18, -0.12, 0.3);
    camera.add(bounce);
    this.bounceLight = bounce;
  }

  get forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }

  setPos(cx, cz, yaw = this.yaw) { this.pos.set(cx * 3, 1.6, cz * 3); this.yaw = yaw; this.pitch = 0; }

  collides(x, z) {
    const h = this.hotel;
    for (const [ox, oz] of [[R, R], [-R, R], [R, -R], [-R, -R]]) {
      if (h.blockedAt(x + ox, z + oz)) return true;
    }
    return false;
  }

  update(dt, t, frozen = false) {
    const inp = this.input;
    if (!frozen) {
      this.yaw -= inp.dx * this.sens;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - inp.dy * this.sens));

      // Inercia / balanceo suave de la linterna según la velocidad del ratón
      const targetSwayX = -inp.dx * 0.0006;
      const targetSwayY = inp.dy * 0.0006;
      this.flashSwayX += (targetSwayX - this.flashSwayX) * Math.min(1, dt * 10);
      this.flashSwayY += (targetSwayY - this.flashSwayY) * Math.min(1, dt * 10);
      this.spot.target.position.set(this.flashSwayX * 12, this.flashSwayY * 12, -6);
    }

    if (!frozen && (inp.wasPressed('KeyC') || inp.wasPressed('ControlLeft'))) this.crouch = !this.crouch;
    if (!frozen && inp.wasPressed('KeyF') && this.hasFlash && this.battery > 0) this.flashOn = !this.flashOn;

    let f = frozen ? 0 : (inp.down('KeyW') || inp.down('ArrowUp') ? 1 : 0) - (inp.down('KeyS') || inp.down('ArrowDown') ? 1 : 0);
    let r = frozen ? 0 : (inp.down('KeyD') || inp.down('ArrowRight') ? 1 : 0) - (inp.down('KeyA') || inp.down('ArrowLeft') ? 1 : 0);
    if (!frozen && (inp.axisX !== 0 || inp.axisY !== 0)) { f = inp.axisY; r = inp.axisX; }
    const mag = Math.min(1, Math.hypot(f, r));
    this.moving = mag > 0.12;

    const wantSprint = (inp.down('ShiftLeft') || inp.sprintTouch) && f > 0 && !this.crouch && !this.exhausted && this.stamina > 0;
    this.sprinting = wantSprint && this.moving;
    let speed = this.crouch ? 1.6 : 3.1;
    if (this.sprinting) speed = 5.3;

    if (this.sprinting) {
      this.stamina -= dt * 0.22;
      if (this.stamina <= 0) { this.stamina = 0; this.exhausted = true; }
    } else {
      this.stamina = Math.min(1, this.stamina + dt * (this.crouch ? 0.22 : 0.14));
      if (this.exhausted && this.stamina > 0.3) this.exhausted = false;
    }

    if (this.moving) {
      const fw = this.forward;
      const rt = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      const v = new THREE.Vector3().addScaledVector(fw, f).addScaledVector(rt, r).normalize().multiplyScalar(speed * mag * dt);
      if (!this.collides(this.pos.x + v.x, this.pos.z)) this.pos.x += v.x;
      if (!this.collides(this.pos.x, this.pos.z + v.z)) this.pos.z += v.z;
      this.bob += dt * speed * 2.4;
      const sign = Math.sin(this.bob) >= 0 ? 1 : -1;
      if (sign !== this.lastStepSign) { this.lastStepSign = sign; this.onStep?.(this.sprinting ? 0.5 : this.crouch ? 0.1 : 0.25); }
    }

    // Ruido que la entidad puede oír
    this.noise = !this.moving ? 1.5 : this.sprinting ? 14 : this.crouch ? 3 : 7;

    // Cámara con respiración idle y balanceo al caminar
    const targetEye = this.crouch ? 1.0 : 1.6;
    this.eye += (targetEye - this.eye) * Math.min(1, dt * 8);
    const idleBreath = Math.sin(t * 1.8) * 0.008;
    const bobY = this.moving ? Math.sin(this.bob * 2) * (this.sprinting ? 0.06 : 0.03) : idleBreath;
    const bobX = this.moving ? Math.cos(this.bob) * 0.02 : 0;
    this.camera.position.set(this.pos.x + bobX, this.eye + bobY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    // Linterna y batería
    if (this.flashOn && !frozen) this.battery = Math.max(0, this.battery - dt / 280);
    if (this.battery <= 0) this.flashOn = false;
    let k = this.flashOn ? 1 : 0;
    if (this.flashOn && this.battery < 0.15) {
      k *= Math.sin(t * 40) * Math.sin(t * 17) > -0.4 ? 1 : 0.1;
    }
    this.spot.intensity = this.baseIntensity * k;
    this.spot.castShadow = this.flashOn;
    this.bounceLight.intensity = this.flashOn ? 3.0 * k : 0;
  }

  /** Objeto interactuable más cercano al que se mira. */
  findInteractable() {
    const fw = this.forward;
    let best = null, bestScore = 1e9;
    const px = this.pos.x, pz = this.pos.z;
    for (const it of this.hotel.interactables) {
      if (it.enabled === false || (it.when && !it.when())) continue;
      const dx = it.x - px, dz = it.z - pz, d = Math.hypot(dx, dz);
      if (d > (it.range || 2.4)) continue;
      if (d > 0.8 && (dx * fw.x + dz * fw.z) / d < 0.40) continue;
      if (d < bestScore) { bestScore = d; best = it; }
    }
    return best;
  }
}
