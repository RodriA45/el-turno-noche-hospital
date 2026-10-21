import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// =============================================================================
// VISOR DE INSPECCIÓN DE OBJETOS 3D ESTILO RESIDENT EVIL (OBJECT EXAMINER)
// Permite rotar en 360°, inspeccionar detalles ocultos, hacer zoom y voltear
// =============================================================================

export class ObjectExaminer {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.currentModel = null;
    this.rotX = 0;
    this.rotY = 0;
    this.targetRotX = 0;
    this.targetRotY = 0;
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.onClose = null;
    this.isFlipped = false;

    // Inicializar renderizador 3D dedicado de estudio
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Escena e iluminación cinematográfica de estudio estilo Resident Evil
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, canvas.width / canvas.height, 0.1, 20);
    this.camera.position.set(0, 0, 3.2);

    // Luz principal de estudio cálida (Key Light)
    this.keyLight = new THREE.DirectionalLight(0xfff4e6, 2.8);
    this.keyLight.position.set(3, 4, 4);
    this.scene.add(this.keyLight);

    // Luz de relleno fría azulada (Fill Light)
    this.fillLight = new THREE.DirectionalLight(0x8ecae6, 1.4);
    this.fillLight.position.set(-3, -1, 3);
    this.scene.add(this.fillLight);

    // Luz de recorte trasera para resaltar contornos metálicos (Rim Light)
    this.rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.rimLight.position.set(0, 3, -3);
    this.scene.add(this.rimLight);

    // Luz ambiental suave
    this.ambientLight = new THREE.AmbientLight(0x182026, 1.2);
    this.scene.add(this.ambientLight);

    // Reflejos de estudio para los metales (sin entorno, cromo y aluminio salen negros)
    try {
      const pm = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      this.scene.environmentIntensity = 0.7;
      pm.dispose();
    } catch (e) { /* sin entorno: se ve con las luces directas */ }

    // Pivote donde se monta el objeto a inspeccionar
    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    this.bindEvents();
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth || 800;
    const h = this.canvas.clientHeight || window.innerHeight || 600;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  bindEvents() {
    const cvs = this.canvas;

    const onDown = (e) => {
      if (!this.active) return;
      this.isDragging = true;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      this.lastPointerX = x;
      this.lastPointerY = y;
    };

    const onMove = (e) => {
      if (!this.active || !this.isDragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      const dx = x - this.lastPointerX;
      const dy = y - this.lastPointerY;
      this.lastPointerX = x;
      this.lastPointerY = y;

      this.targetRotY += dx * 0.009;
      this.targetRotX += dy * 0.009;
      this.targetRotX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.targetRotX));
    };

    const onUp = () => { this.isDragging = false; };

    cvs.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    // Zoom con la rueda del ratón
    cvs.addEventListener('wheel', (e) => {
      if (!this.active) return;
      e.preventDefault();
      this.targetZoom = Math.max(0.7, Math.min(1.8, this.targetZoom - e.deltaY * 0.0015));
    }, { passive: false });

    // Zoom con pellizco táctil en móviles
    let pinchStartDist = 0;
    let pinchStartZoom = 1.0;
    cvs.addEventListener('touchstart', (e) => {
      if (!this.active) return;
      if (e.touches.length === 2) {
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartZoom = this.targetZoom;
      }
    }, { passive: true });

    cvs.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      if (e.touches.length === 2 && pinchStartDist > 0) {
        const curDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = curDist / pinchStartDist;
        this.targetZoom = Math.max(0.7, Math.min(1.8, pinchStartZoom * factor));
      }
    }, { passive: true });
  }

  flip() {
    this.isFlipped = !this.isFlipped;
    this.targetRotY += Math.PI;
  }

  resetOrientation() {
    this.rotX = this.targetRotX = 0;
    this.rotY = this.targetRotY = 0;
    this.zoom = this.targetZoom = 1.0;
    this.isFlipped = false;
  }

  clear() {
    this.currentModel = null;
    while (this.pivot.children.length > 0) {
      const ch = this.pivot.children[0];
      this.pivot.remove(ch);
      ch.traverse(node => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach(m => {
              if (!m.userData?.isShared) {
                if (m.map) m.map.dispose();
                m.dispose();
              }
            });
          } else if (!node.material.userData?.isShared) {
            if (node.material.map) node.material.map.dispose();
            node.material.dispose();
          }
        }
      });
    }
  }

  examine(itemDef) {
    return new Promise((resolve) => {
      this.active = true;
      this.resetOrientation();
      this.resize();
      this.clear();

      // Montar nuevo modelo 3D detallado
      if (itemDef.model) {
        const mesh = typeof itemDef.model === 'function' ? itemDef.model() : itemDef.model.clone();
        // Encuadre automático: centra el objeto y lo escala para que ocupe siempre el mismo espacio
        mesh.position.set(0, 0, 0);
        mesh.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const k = 1.05 / maxDim;
        mesh.scale.multiplyScalar(k);
        mesh.position.copy(center).multiplyScalar(-k);
        mesh.position.y += 0.12; // sube un poco para no quedar tapado por el panel de texto
        this.pivot.add(mesh);
        this.currentModel = mesh;
      }

      const $ = id => document.getElementById(id);
      $('examiner-title').textContent = itemDef.title || 'Objeto';
      $('examiner-sub').textContent = itemDef.sub || '';
      $('examiner-desc').textContent = itemDef.desc || '';

      const modal = $('examiner');
      modal.classList.remove('hidden');

      const finish = () => {
        if (!this.active) return;
        this.active = false;
        modal.classList.add('hidden');
        window.removeEventListener('keydown', keyHandler);
        $('examiner-close').onclick = null;
        $('examiner-flip').onclick = null;
        resolve(true);
      };

      const keyHandler = (e) => {
        if (!this.active) return;
        if (e.code === 'KeyF' || e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Space') {
          finish();
        } else if (e.code === 'KeyV') {
          this.flip();
        }
      };

      window.addEventListener('keydown', keyHandler);
      $('examiner-close').onclick = finish;
      $('examiner-flip').onclick = () => this.flip();
    });
  }

  render(dt) {
    if (!this.active) return;

    // Suavizado cinemático de rotación y zoom
    this.rotX += (this.targetRotX - this.rotX) * Math.min(1, dt * 12);
    this.rotY += (this.targetRotY - this.rotY) * Math.min(1, dt * 12);
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1, dt * 10);

    this.pivot.rotation.set(this.rotX, this.rotY, 0, 'YXZ');
    this.camera.position.z = 3.2 / this.zoom;

    // Flotación sutil idle estilo Resident Evil
    this.pivot.position.y = Math.sin(performance.now() * 0.0018) * 0.02;

    this.renderer.render(this.scene, this.camera);
  }
}

// =============================================================================
// CATÁLOGO DE MODELOS 3D DE ALTO DETALLE PARA EL EXAMINADOR (RESIDENT EVIL TIER)
// =============================================================================

/** Llave antigua de bronce con numeración grabada al dorso */
export function createDetailedKey(serial = '0315') {
  const g = new THREE.Group();
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc49a45,
    metalness: 0.92,
    roughness: 0.28,
  });
  const darkBrass = new THREE.MeshStandardMaterial({
    color: 0x7a5818,
    metalness: 0.85,
    roughness: 0.45,
  });

  // 1. Anilla de agarre estilo renacentista con relieve
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.08, 16, 32), brassMat);
  g.add(ring);

  // 2. Vástago cilíndrico estriado
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.3, 20), brassMat);
  shaft.position.y = -0.72;
  g.add(shaft);

  // 3. Corona decorativa de unión
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.16, 16), darkBrass);
  crown.position.y = -0.20;
  g.add(crown);

  // 4. Pala con dientes mecánicos tallados
  const bit1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.07), brassMat);
  bit1.position.set(0.18, -1.22, 0);
  const bit2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.10, 0.07), brassMat);
  bit2.position.set(0.13, -1.02, 0);
  const bitCut = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.075), darkBrass);
  bitCut.position.set(0.24, -1.14, 0);
  g.add(bit1, bit2, bitCut);

  // 5. Etiqueta de chapa metálica estampada colgando de la anilla con código grabado
  const tagCanvas = document.createElement('canvas');
  tagCanvas.width = 512; tagCanvas.height = 256;
  const tctx = tagCanvas.getContext('2d');
  tctx.fillStyle = '#b38234';
  tctx.fillRect(0, 0, 512, 256);
  tctx.strokeStyle = '#5a3d0f';
  tctx.lineWidth = 10;
  tctx.strokeRect(8, 8, 496, 240);
  tctx.fillStyle = '#221504';
  tctx.font = 'bold 36px "Cinzel", serif';
  tctx.textAlign = 'center';
  tctx.fillText('HOSPITAL SAN ANSELMO', 256, 65);
  tctx.font = 'bold 28px "Special Elite", monospace';
  tctx.fillText('ARCHIVO CLÍNICO', 256, 120);
  tctx.font = 'bold 64px "Special Elite", monospace';
  tctx.fillStyle = '#4a0808';
  tctx.fillText(`Nº ${serial}`, 256, 205);

  const tagTex = new THREE.CanvasTexture(tagCanvas);
  const tagMat = new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.35, metalness: 0.65 });
  const tag = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.02), tagMat);
  tag.position.set(-0.48, 0.22, 0);
  tag.rotation.z = 0.35;
  g.add(tag);

  g.scale.set(1.4, 1.4, 1.4);
  return g;
}

/** Fotografía Polaroid de los gemelos de 1984 (con reverso manuscrito que se revela al rotar) */
export function createDetailedPolaroid() {
  const g = new THREE.Group();

  // Cara frontal de la Polaroid
  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = 512; frontCanvas.height = 640;
  const fctx = frontCanvas.getContext('2d');

  // Marco de cartón envejecido y gastado
  fctx.fillStyle = '#e8dec8';
  fctx.fillRect(0, 0, 512, 640);

  // Borde fotográfico oscuro
  fctx.fillStyle = '#1c1b18';
  fctx.fillRect(36, 36, 440, 460);

  // Foto de la habitación de hospital en tonos sepia / blanco y negro (1984)
  const grad = fctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#3a3328');
  grad.addColorStop(1, '#181410');
  fctx.fillStyle = grad;
  fctx.fillRect(40, 40, 432, 452);

  // Gemelo 1 (Sano, de pie a la izquierda con camisa oscura)
  fctx.fillStyle = '#8f7762';
  fctx.beginPath(); fctx.arc(170, 210, 48, 0, Math.PI * 2); fctx.fill();
  fctx.fillStyle = '#2d3844';
  fctx.fillRect(115, 260, 110, 160);

  // Gemelo 2 (Enfermo, acostado a la derecha en la cama clínica)
  fctx.fillStyle = '#7a8585';
  fctx.beginPath(); fctx.arc(330, 225, 46, 0, Math.PI * 2); fctx.fill();
  fctx.fillStyle = '#4a5358';
  fctx.fillRect(275, 275, 120, 150);
  // Máscara / tubo de oxígeno
  fctx.strokeStyle = 'rgba(200, 225, 235, 0.7)';
  fctx.lineWidth = 4;
  fctx.beginPath(); fctx.moveTo(330, 235); fctx.lineTo(390, 310); fctx.stroke();

  // Manchas de humedad y quemaduras químicas en los bordes
  fctx.fillStyle = 'rgba(120, 80, 40, 0.25)';
  fctx.beginPath(); fctx.arc(60, 80, 50, 0, Math.PI * 2); fctx.fill();
  fctx.beginPath(); fctx.arc(420, 440, 70, 0, Math.PI * 2); fctx.fill();

  // Texto al pie de la polaroid
  fctx.fillStyle = '#1e1c18';
  fctx.font = 'bold 26px "Special Elite", monospace';
  fctx.fillText('14-NOV-1984 · PISO 4', 45, 550);
  fctx.font = '20px "Special Elite", monospace';
  fctx.fillStyle = '#5a554a';
  fctx.fillText('Hnos. Valenzuela (Hab. 401)', 45, 590);

  const frontTex = new THREE.CanvasTexture(frontCanvas);
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.25 });

  // Cara trasera de la Polaroid (Papel negro con nota escrita a mano con felpón negro)
  const backCanvas = document.createElement('canvas');
  backCanvas.width = 512; backCanvas.height = 640;
  const bctx = backCanvas.getContext('2d');

  bctx.fillStyle = '#1e1e1e';
  bctx.fillRect(0, 0, 512, 640);
  bctx.strokeStyle = '#111111';
  bctx.lineWidth = 20;
  bctx.strokeRect(10, 10, 492, 620);

  bctx.fillStyle = '#f0ebe1';
  bctx.font = 'bold 24px "Special Elite", monospace';
  bctx.fillText('EVIDENCIA JUDICIAL Nº 84', 40, 80);

  bctx.fillStyle = '#ff4444';
  bctx.font = 'bold 32px "Cinzel", serif';
  bctx.fillText('CLAVE RESTRINGIDA:', 40, 160);

  bctx.fillStyle = '#ffffff';
  bctx.font = 'bold 62px "Special Elite", monospace';
  bctx.fillText('PIN: 0315', 40, 240);

  bctx.fillStyle = '#bbb2a2';
  bctx.font = 'italic 22px "Inter", sans-serif';
  bctx.fillText('"No abras la puerta prohibida."', 40, 320);
  bctx.fillText('"Él nunca murió. Sigue arriba."', 40, 360);

  const backTex = new THREE.CanvasTexture(backCanvas);
  const backMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.85 });

  const geometry = new THREE.BoxGeometry(1.6, 2.0, 0.02);
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xd8ceb8, roughness: 0.9 });
  const materials = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];

  const photoMesh = new THREE.Mesh(geometry, materials);
  g.add(photoMesh);

  return g;
}

/** Linterna táctica pesada de aluminio y óptica estriada */
export function createDetailedFlashlight() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f2326, metalness: 0.85, roughness: 0.38 });
  const knurlMat = new THREE.MeshStandardMaterial({ color: 0x141618, metalness: 0.75, roughness: 0.75 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe0e6eb, metalness: 0.95, roughness: 0.12 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xa8c5cc, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.45 });

  // Tubo principal
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.4, 24), bodyMat);
  g.add(body);

  // Empuñadura moleteada antideslizante
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.186, 0.186, 0.85, 24), knurlMat);
  g.add(grip);

  // Tapa trasera con botón de encendido
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.18, 24), bodyMat);
  cap.position.y = -0.75;
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 }));
  btn.position.y = -0.84;
  g.add(cap, btn);

  // Cabezal biselado
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.19, 0.45, 24), chromeMat);
  head.position.y = 0.85;
  g.add(head);

  // Lente frontal de cristal y parábola reflectora
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.30, 24), glassMat);
  lens.rotation.x = -Math.PI / 2;
  lens.position.y = 1.08;
  g.add(lens);

  g.rotation.z = Math.PI / 4;
  return g;
}
