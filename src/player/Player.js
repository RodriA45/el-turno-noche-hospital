import * as THREE from 'three';
import { flashlightCookie } from '../world/Textures.js';

const R = 0.3; // radio del jugador

export class Player {
  constructor(camera, scene, hospital, input) {
    this.camera = camera; this.hospital = hospital; this.input = input;
    this.pos = new THREE.Vector3(0, 1.6, 0);
    this.yaw = Math.PI / 2;
    this.pitch = 0;
    this.targetYaw = this.yaw;
    this.targetPitch = this.pitch;
    this.stamina = 1; this.exhausted = false;
    this.battery = 1; this.flashOn = false; this.hasFlash = false;
    this.crouch = false; this.eye = 1.6;
    this.keys = 0;
    this.moving = false; this.sprinting = false;
    this.noise = 1;
    this.bob = 0; this.lastStepSign = 1;
    this.onStep = null;
    this.sens = +localStorage.getItem('hospital_sens') || 0.0022;

    // Inercia de linterna (sway)
    this.flashSwayX = 0; this.flashSwayY = 0;

    // Limpiar luces u objetos adjuntos a la cámara de instancias anteriores
    for (let i = camera.children.length - 1; i >= 0; i--) {
      const child = camera.children[i];
      if (child.isLight || child.isPoints || child.userData?.isPlayerAttachment) {
        camera.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
    }

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
    spot.userData.isPlayerAttachment = true;
    spot.target.userData.isPlayerAttachment = true;
    camera.add(spot, spot.target);
    this.spot = spot;
    this.baseIntensity = 85;

    // Luz difusa de rebote en el suelo y paredes cercanas (bounce light)
    const bounce = new THREE.PointLight(0xffeedd, 0, 4.5, 2.0);
    bounce.position.set(0.18, -0.12, 0.3);
    bounce.userData.isPlayerAttachment = true;
    camera.add(bounce);
    this.bounceLight = bounce;

    // Partículas volumétricas de polvo y suspensión en el haz de la linterna
    const dustCount = 140;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = [];
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 3.5;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      dustPositions[i * 3 + 2] = -0.5 - Math.random() * 7.5;
      dustVelocities.push({
        x: (Math.random() - 0.5) * 0.035,
        y: (Math.random() - 0.5) * 0.025,
        z: (Math.random() - 0.5) * 0.035,
        phase: Math.random() * Math.PI * 2
      });
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const dustCanvas = document.createElement('canvas');
    dustCanvas.width = dustCanvas.height = 32;
    const dctx = dustCanvas.getContext('2d');
    const dgrad = dctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    dgrad.addColorStop(0, 'rgba(255, 252, 240, 1)');
    dgrad.addColorStop(0.35, 'rgba(235, 240, 230, 0.6)');
    dgrad.addColorStop(1, 'rgba(180, 200, 210, 0)');
    dctx.fillStyle = dgrad;
    dctx.fillRect(0, 0, 32, 32);
    const dustTex = new THREE.CanvasTexture(dustCanvas);

    const dustMat = new THREE.PointsMaterial({
      map: dustTex,
      size: 0.08,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xfffcf0
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    dustPoints.userData.isPlayerAttachment = true;
    camera.add(dustPoints);
    this.dustPoints = dustPoints;
    this.dustPositions = dustPositions;
    this.dustVelocities = dustVelocities;
    this.dustGeo = dustGeo;
    this.dustMat = dustMat;
    this.dustCount = dustCount;
  }

  setSensitivity(val) {
    this.sens = Math.max(0.0008, Math.min(0.006, val));
    localStorage.setItem('hospital_sens', this.sens);
  }

  addBattery(amount = 0.5) {
    this.battery = Math.min(1.0, this.battery + amount);
  }

  get forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }

  setPos(cx, cz, yaw = this.yaw) {
    this.pos.set(cx * 3, 1.6, cz * 3);
    this.yaw = this.targetYaw = yaw;
    this.pitch = this.targetPitch = 0;
  }

  collides(x, z) {
    const h = this.hospital;
    for (const [ox, oz] of [[R, R], [-R, R], [R, -R], [-R, -R]]) {
      if (h.blockedAt(x + ox, z + oz)) return true;
    }
    return false;
  }

  update(dt, t, frozen = false) {
    const inp = this.input;
    if (!frozen) {
      // Limitar deltas máximos por frame para filtrar picos espurios
      const maxDelta = 120;
      const cdx = Math.max(-maxDelta, Math.min(maxDelta, inp.dx));
      const cdy = Math.max(-maxDelta, Math.min(maxDelta, inp.dy));

      this.targetYaw -= cdx * this.sens;
      this.targetYaw = ((this.targetYaw + Math.PI) % (Math.PI * 2) + (Math.PI * 2)) % (Math.PI * 2) - Math.PI;
      this.targetPitch = Math.max(-1.42, Math.min(1.42, this.targetPitch - cdy * this.sens));

      // Suavizado cinemático lerp para un control fluido sin saltos
      const smoothFactor = Math.min(1, dt * 32);
      let diffYaw = this.targetYaw - this.yaw;
      diffYaw = Math.atan2(Math.sin(diffYaw), Math.cos(diffYaw));
      this.yaw += diffYaw * smoothFactor;
      this.pitch += (this.targetPitch - this.pitch) * smoothFactor;

      // Inercia / balanceo suave de la linterna con límites estrictos
      const targetSwayX = Math.max(-0.35, Math.min(0.35, -cdx * 0.0004));
      const targetSwayY = Math.max(-0.35, Math.min(0.35, cdy * 0.0004));
      this.flashSwayX += (targetSwayX - this.flashSwayX) * Math.min(1, dt * 12);
      this.flashSwayY += (targetSwayY - this.flashSwayY) * Math.min(1, dt * 12);
      this.spot.target.position.set(this.flashSwayX * 10, this.flashSwayY * 10, -6);
    }

    if (!frozen && (inp.wasPressed('KeyC') || inp.wasPressed('ControlLeft'))) this.crouch = !this.crouch;
    if (!frozen && inp.wasPressed('KeyF') && this.hasFlash && this.battery > 0) {
      this.flashOn = !this.flashOn;
      this.onFlashToggle?.();
    }

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

    // Actualizar motas de polvo volumétrico en el cono de luz
    const targetDustOpacity = (this.flashOn && k > 0.05) ? 0.38 * k : 0;
    this.dustMat.opacity += (targetDustOpacity - this.dustMat.opacity) * Math.min(1, dt * 6);
    if (this.dustMat.opacity > 0.01) {
      const posArr = this.dustPositions;
      for (let i = 0; i < this.dustCount; i++) {
        const v = this.dustVelocities[i];
        const idx = i * 3;
        posArr[idx + 0] += v.x * dt + Math.sin(t * 0.8 + v.phase) * 0.001;
        posArr[idx + 1] += v.y * dt + Math.cos(t * 0.6 + v.phase) * 0.001;
        posArr[idx + 2] += v.z * dt;
        if (posArr[idx + 0] < -2.0) posArr[idx + 0] = 2.0;
        if (posArr[idx + 0] > 2.0) posArr[idx + 0] = -2.0;
        if (posArr[idx + 1] < -1.5) posArr[idx + 1] = 1.5;
        if (posArr[idx + 1] > 1.5) posArr[idx + 1] = -1.5;
        if (posArr[idx + 2] < -8.0) posArr[idx + 2] = -0.5;
        if (posArr[idx + 2] > -0.5) posArr[idx + 2] = -8.0;
      }
      this.dustGeo.attributes.position.needsUpdate = true;
    }
  }

  /** Objeto interactuable más cercano al que se mira. */
  findInteractable() {
    const fw = this.forward;
    let best = null, bestScore = 1e9;
    const px = this.pos.x, pz = this.pos.z;
    for (const it of this.hospital.interactables) {
      if (it.enabled === false || (it.when && !it.when())) continue;
      const dx = it.x - px, dz = it.z - pz, d = Math.hypot(dx, dz);
      if (d > (it.range || 2.4)) continue;
      if (d > 0.8 && (dx * fw.x + dz * fw.z) / d < 0.40) continue;
      if (d < bestScore) { bestScore = d; best = it; }
    }
    return best;
  }
}
