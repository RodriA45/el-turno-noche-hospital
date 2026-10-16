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
        child.traverse(node => {
          if (node.geometry) node.geometry.dispose();
          if (node.map) node.map.dispose();
          if (node.shadow?.map) node.shadow.map.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(m => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (node.material.map) node.material.map.dispose();
              node.material.dispose();
            }
          }
        });
      }
    }

    scene.add(camera);

    // Linterna principal con haz óptico (cookie con anillos de difracción Fresnel y hotspot orgánico)
    const cookie = flashlightCookie();
    const spot = new THREE.SpotLight(0xfff2dc, 48, 34, Math.PI / 3.8, 0.85, 1.35);
    spot.map = cookie;
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.0005;
    spot.shadow.camera.near = 0.2;
    spot.position.set(0.18, -0.16, 0.05);
    spot.target.position.set(0, -0.05, -6);
    spot.userData.isPlayerAttachment = true;
    spot.target.userData.isPlayerAttachment = true;
    camera.add(spot, spot.target);
    this.spot = spot;
    this.baseIntensity = 48;

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

    // Mecánica de asomo (lean / peeking con Q y E)
    this.lean = 0;
    this.targetLean = 0;

    // Brazo en primera persona con reloj diegético estilo Resident Evil 7
    this.setupCodexWatch();
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

  // =========================================================================
  // BRAZO DIEGÉTICO EN PRIMERA PERSONA CON RELOJ VITAL ESTILO RESIDENT EVIL 7
  // =========================================================================
  setupCodexWatch() {
    this.armGroup = new THREE.Group();
    this.armGroup.userData.isPlayerAttachment = true;

    // Materiales del uniforme hospitalario y reloj
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x1f2c3d, // Azul marino uniforme enfermera
      roughness: 0.85,
      metalness: 0.05
    });
    const cuffMat = new THREE.MeshStandardMaterial({
      color: 0x141e2a,
      roughness: 0.9,
      metalness: 0.05
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd6a68d, // Tono de piel de Clara
      roughness: 0.65,
      metalness: 0.08
    });
    const watchBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1c1e22, // Titanio oscuro mate
      roughness: 0.35,
      metalness: 0.85
    });
    const strapMat = new THREE.MeshStandardMaterial({
      color: 0x121315,
      roughness: 0.8,
      metalness: 0.1
    });

    // 1. Antebrazo (manga del scrub médico de Clara)
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.056, 0.34, 16), sleeveMat);
    sleeve.position.set(0, -0.17, 0);
    sleeve.userData.isPlayerAttachment = true;
    this.armGroup.add(sleeve);

    // 2. Puño doblado de la tela en la muñeca
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.009, 12, 20), cuffMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, -0.008, 0);
    cuff.userData.isPlayerAttachment = true;
    this.armGroup.add(cuff);

    // 3. Muñeca visible
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.08, 16), skinMat);
    wrist.position.set(0, 0.032, 0);
    wrist.userData.isPlayerAttachment = true;
    this.armGroup.add(wrist);

    // 4. Correa de silicona táctica
    const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.032, 20), strapMat);
    strap.position.set(0, 0.038, 0);
    strap.userData.isPlayerAttachment = true;
    this.armGroup.add(strap);

    // 5. Caja del reloj médico
    const watchCase = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.048, 0.018), watchBodyMat);
    watchCase.position.set(0, 0.038, 0.044);
    watchCase.userData.isPlayerAttachment = true;
    this.armGroup.add(watchCase);

    // 6. Pantalla del reloj con textura dinámica en canvas 256x256
    this.watchCanvas = document.createElement('canvas');
    this.watchCanvas.width = 256;
    this.watchCanvas.height = 256;
    this.wctx = this.watchCanvas.getContext('2d');

    this.watchTexture = new THREE.CanvasTexture(this.watchCanvas);
    this.watchTexture.minFilter = THREE.LinearFilter;
    this.watchTexture.magFilter = THREE.LinearFilter;

    const screenMat = new THREE.MeshBasicMaterial({
      map: this.watchTexture
    });
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.036, 0.042), screenMat);
    screenMesh.position.set(0, 0.038, 0.0535);
    screenMesh.userData.isPlayerAttachment = true;
    this.armGroup.add(screenMesh);

    // 7. Cristal protector antirreflejo
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      roughness: 0.08,
      metalness: 0.15,
      transparent: true,
      opacity: 0.25
    });
    const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.038, 0.044), glassMat);
    glassMesh.position.set(0, 0.038, 0.054);
    glassMesh.userData.isPlayerAttachment = true;
    this.armGroup.add(glassMesh);

    // Orientación reposada natural del brazo izquierdo fuera de cámara
    this.armGroup.position.set(0.24, -0.42, -0.38);
    this.armGroup.rotation.set(0.55, -0.35, 0.45);
    this.camera.add(this.armGroup);

    this.watchRaised = false;
    this.watchProgress = 0; // 0 = abajo, 1 = levantado frente a los ojos
    this.ecgPhase = 0;
  }

  toggleWatch() {
    this.watchRaised = !this.watchRaised;
  }

  updateWatch(dt, t, threatDist, tension) {
    if (!this.wctx) return;
    const ctx = this.wctx;
    this.ecgPhase += dt * (tension > 0.5 ? 6.5 : tension > 0.2 ? 4.2 : 2.6);

    // Fondo LCD retroiluminado verde oscuro médico
    ctx.fillStyle = '#060d09';
    ctx.fillRect(0, 0, 256, 256);

    // Cuadrícula médica sutil de monitor cardíaco
    ctx.strokeStyle = 'rgba(0, 255, 120, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 256; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
    }
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
    }

    // Cabecera del dispositivo
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 14px "Inter", sans-serif';
    ctx.fillText('SAN ANSELMO · MED-CODEX', 16, 30);

    // Reloj digital del turno de noche
    const totalSec = Math.floor(t);
    const mm = String(Math.floor(totalSec / 60) % 60).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Special Elite", monospace';
    ctx.fillText(`03:${mm}:${ss}`, 16, 68);

    // Estado vital con color según tensión / peligro
    let statusColor = '#22c55e'; // verde
    let statusText = 'ESTABLE · 72 BPM';
    if (tension > 0.5) {
      statusColor = '#ef4444'; // rojo peligro
      statusText = '¡PELIGRO! 158 BPM';
    } else if (tension > 0.15) {
      statusColor = '#f59e0b'; // amarillo
      statusText = 'ALERTA · 114 BPM';
    }

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 15px "Inter", sans-serif';
    ctx.fillText(statusText, 16, 96);

    // Onda dinámica de electrocardiograma (ECG) en tiempo real
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = statusColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();

    const ecgY = 152;
    for (let x = 0; x < 256; x += 3) {
      const wavePos = ((x * 0.04 - this.ecgPhase) % (Math.PI * 2) + (Math.PI * 2)) % (Math.PI * 2);
      let dy = 0;
      if (wavePos > 0.8 && wavePos < 1.2) {
        // Onda P
        dy = -Math.sin((wavePos - 0.8) / 0.4 * Math.PI) * 7;
      } else if (wavePos > 1.3 && wavePos < 1.45) {
        // Descenso Q
        dy = Math.sin((wavePos - 1.3) / 0.15 * Math.PI) * 10;
      } else if (wavePos >= 1.45 && wavePos < 1.7) {
        // Pico R masivo
        const rFactor = tension > 0.5 ? 46 : 32;
        dy = -Math.sin((wavePos - 1.45) / 0.25 * Math.PI) * rFactor;
      } else if (wavePos >= 1.7 && wavePos < 1.85) {
        // Descenso S
        dy = Math.sin((wavePos - 1.7) / 0.15 * Math.PI) * 12;
      } else if (wavePos > 2.1 && wavePos < 2.6) {
        // Onda T
        dy = -Math.sin((wavePos - 2.1) / 0.5 * Math.PI) * 10;
      }
      if (x === 0) ctx.moveTo(x, ecgY + dy);
      else ctx.lineTo(x, ecgY + dy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Barra de batería de la linterna al pie
    const batPct = Math.round(this.battery * 100);
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 14px "Inter", sans-serif';
    ctx.fillText(`LINTERNA: ${batPct}%`, 16, 218);

    // Barra de batería
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(16, 226, 224, 12);
    ctx.fillStyle = this.battery > 0.3 ? '#22c55e' : '#ef4444';
    ctx.fillRect(16, 226, 224 * Math.max(0, this.battery), 12);

    this.watchTexture.needsUpdate = true;
  }

  update(dt, t, frozen = false, threatDist = 99, tension = 0) {
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
    if (!frozen && inp.wasPressed('Tab')) {
      this.toggleWatch();
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

    // Mecánica de Asomo e Inclinación táctica (Lean con Q/E o botones táctiles)
    let wantLean = 0;
    if (!frozen) {
      if (inp.down('KeyQ') || inp.down('LeanLeft')) wantLean -= 1.0;
      if ((inp.down('KeyE') || inp.down('LeanRight')) && (!this.currentInteractable || inp.down('LeanRight'))) wantLean += 1.0;
    }
    this.targetLean = wantLean;
    this.lean += (this.targetLean - this.lean) * Math.min(1, dt * 14);

    const rightVec = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    let leanDist = this.lean * 0.38;
    // Anti-clip: comprobar que el asomo no atraviese paredes
    if (Math.abs(leanDist) > 0.05) {
      const testX = this.pos.x + rightVec.x * leanDist;
      const testZ = this.pos.z + rightVec.z * leanDist;
      if (this.hospital.blockedAt(testX, testZ)) {
        leanDist = 0;
      }
    }
    const leanDip = Math.abs(this.lean) * 0.04;

    // Cámara con respiración idle y balanceo al caminar
    const targetEye = this.crouch ? 1.0 : 1.6;
    this.eye += (targetEye - this.eye) * Math.min(1, dt * 8);
    const idleBreath = Math.sin(t * 1.8) * 0.008;
    const bobY = this.moving ? Math.sin(this.bob * 2) * (this.sprinting ? 0.06 : 0.03) : idleBreath;
    const bobX = this.moving ? Math.cos(this.bob) * 0.02 : 0;

    this.camera.position.set(
      this.pos.x + bobX + rightVec.x * leanDist,
      this.eye + bobY - leanDip,
      this.pos.z + rightVec.z * leanDist
    );
    this.camera.rotation.set(this.pitch, this.yaw, -this.lean * 0.12, 'YXZ');

    // Actualización y animación del brazo del reloj diegético
    const targetProgress = this.watchRaised ? 1.0 : 0.0;
    this.watchProgress += (targetProgress - this.watchProgress) * Math.min(1, dt * 10);

    const idlePos = new THREE.Vector3(0.24, -0.42, -0.38);
    const raisedPos = new THREE.Vector3(-0.13, -0.16, -0.32);
    const curArmPos = new THREE.Vector3().lerpVectors(idlePos, raisedPos, this.watchProgress);

    const idleRot = new THREE.Euler(0.55, -0.35, 0.45);
    const raisedRot = new THREE.Euler(-0.18, 0.48, -0.25);
    const curRotX = THREE.MathUtils.lerp(idleRot.x, raisedRot.x, this.watchProgress);
    const curRotY = THREE.MathUtils.lerp(idleRot.y, raisedRot.y, this.watchProgress);
    const curRotZ = THREE.MathUtils.lerp(idleRot.z, raisedRot.z, this.watchProgress);

    const armBobX = this.moving ? Math.sin(this.bob) * 0.012 : 0;
    const armBobY = this.moving ? Math.cos(this.bob * 2) * 0.012 : 0;

    this.armGroup.position.set(curArmPos.x + armBobX, curArmPos.y + armBobY, curArmPos.z);
    this.armGroup.rotation.set(curRotX, curRotY, curRotZ);

    this.updateWatch(dt, t, threatDist, tension);

    // Linterna reactiva e interferencia electromagnética (EMI)
    if (this.flashOn && !frozen) this.battery = Math.max(0, this.battery - dt / 280);
    if (this.battery <= 0) this.flashOn = false;
    let k = this.flashOn ? 1 : 0;

    if (this.flashOn && threatDist < 8.5) {
      const emi = Math.max(0, 1.0 - (threatDist / 8.5));
      // Parpadeo errático e inestabilidad de tensión
      const jitter = Math.sin(t * 55 + Math.random() * 4) * Math.cos(t * 32);
      if (jitter > (1.05 - emi * 0.85)) {
        k *= (0.2 + Math.random() * 0.35);
      }
      // Descenso de voltaje general
      k *= (1.0 - emi * 0.45);

      // Alteración de color espectral de la bombilla (tono más frío / arco mortecino)
      this.spot.color.setRGB(
        1.0 - emi * 0.15,
        0.96 - emi * 0.28,
        0.90 + emi * 0.12
      );

      // Micro vibración en el cabezal óptico
      this.spot.angle = (Math.PI / 4.2) + (Math.random() - 0.5) * 0.04 * emi;
    } else if (this.flashOn) {
      this.spot.color.setRGB(1.0, 0.96, 0.90);
      this.spot.angle = Math.PI / 4.2;
    }

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
    this.currentInteractable = best;
    return best;
  }
}
