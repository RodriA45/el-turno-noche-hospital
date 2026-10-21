import * as THREE from 'three';
import { Builder, leafGeometry, rng } from './Builder.js';
import { M } from './Materials.js';
import { faceTexture, clothTexture, noteTex, paint } from './Textures.js';

// =============================================================================
// MODELOS 3D DEL HOSPITAL
// Todos los props se construyen con Builder: la geometría se fusiona por
// material (3-8 draw calls por prop en vez de 60+), con biseles reales, tubos,
// superficies de revolución y curvas. Convención: origen en el suelo, "frente"
// del mueble hacia +Z, los objetos de pared tienen su espalda en z ≈ -0.05.
// =============================================================================

const B = () => new Builder(M);
const PI = Math.PI;

export const FOOT = {
  bed: [1.2, 2.3, true], gurney: [0.9, 2.2, true], wheelchair: [0.8, 1.0, true], desk: [2.5, 1.1, true],
  cabinet: [1.0, 0.7, true], bench: [2.1, 0.7, true], vending: [1.05, 0.95, true], iv: [0.35, 0.35, false],
  plant: [0.6, 0.6, true], shelf: [1.8, 0.6, true], locker: [0.95, 0.6, true], chair: [0.6, 0.6, false],
  sink: [1.5, 0.65, true], crate: [0.9, 0.9, true], trash: [0.4, 0.4, false],
  cardiacMonitor: [0.6, 0.6, true], xrayViewer: [0.75, 0.15, false], surgicalLamp: [1.2, 1.2, false],
  surgeryTable: [1.1, 2.3, true], fireExtinguisher: [0.3, 0.3, false], waterDispenser: [0.45, 0.45, true],
  curtainDivider: [2.4, 0.1, false],
};

/** Ruedita giratoria (horquilla + rueda) alrededor de un eje X. */
function caster(b, x, z, r = 0.05, y = r) {
  b.cyl(r, r, r * 0.8, 'rubber', x, y, z, { rz: PI / 2, seg: 14 });
  b.cyl(r * 0.45, r * 0.45, r * 0.9, 'chrome', x, y, z, { rz: PI / 2, seg: 8 });
  b.box(r * 0.2, r * 1.2, r * 1.5, 'metal', x, y + r * 0.9, z);
}

// =========================================================================
// CAMA DE HOSPITAL
// =========================================================================
export function bed(dirty = true) {
  const b = B();
  const sheet = dirty ? 'dirtySheet' : 'sheet';
  // Patas y ruedas
  for (const x of [-0.5, 0.5]) for (const z of [-1.0, 1.0]) {
    b.tube([x, 0.12, z], [x, 0.52, z], 0.022, 'chrome');
    caster(b, x, z, 0.055);
  }
  // Bastidor
  b.box(1.04, 0.05, 2.06, 'metal', 0, 0.55, 0, { r: 0.015 });
  b.box(0.9, 0.04, 1.9, 'darkMetal', 0, 0.585, 0);
  b.tube([-0.5, 0.52, -1.0], [-0.5, 0.52, 1.0], 0.02, 'chrome');
  b.tube([0.5, 0.52, -1.0], [0.5, 0.52, 1.0], 0.02, 'chrome');
  // Colchón de vinilo
  b.box(0.98, 0.15, 2.0, 'mattress', 0, 0.685, 0, { r: 0.045, rs: 3 });
  // Sábana tendida (cubre 2/3, con un pliegue doblado)
  b.box(1.0, 0.045, 1.38, sheet, 0, 0.78, 0.30, { r: 0.02, rs: 2 });
  b.box(1.02, 0.07, 0.30, sheet, 0, 0.80, -0.42, { r: 0.03, rs: 2 });
  // Almohada abultada
  b.box(0.58, 0.12, 0.38, sheet, 0, 0.82, -0.76, { r: 0.05, rs: 3, rx: 0.07 });
  // Cabecero y piecero (paneles esmaltados con marco cromado)
  for (const [z, h] of [[-1.04, 0.56], [1.04, 0.42]]) {
    const top = 0.56 + h;
    b.box(1.04, h - 0.1, 0.035, 'enamel', 0, 0.56 + (h - 0.1) / 2 + 0.05, z, { r: 0.012 });
    b.tube([-0.52, 0.5, z], [-0.52, top, z], 0.022, 'chrome');
    b.tube([0.52, 0.5, z], [0.52, top, z], 0.022, 'chrome');
    b.tube([-0.52, top, z], [0.52, top, z], 0.02, 'chrome');
  }
  // Barandillas laterales abatibles
  for (const s of [-1, 1]) {
    const x = s * 0.55;
    b.tube([x, 0.95, -0.55], [x, 0.95, 0.65], 0.016, 'chrome');
    b.tube([x, 0.80, -0.55], [x, 0.80, 0.65], 0.016, 'chrome');
    for (const z of [-0.55, -0.15, 0.25, 0.65]) b.tube([x, 0.70, z], [x, 0.95, z], 0.014, 'chrome');
  }
  // Manivela del pie
  b.tube([0.0, 0.5, 1.07], [0.0, 0.5, 1.2], 0.012, 'chrome');
  b.box(0.1, 0.02, 0.02, 'chrome', 0, 0.5, 1.2);
  return b.build();
}

// =========================================================================
// CAMILLA DE URGENCIAS
// =========================================================================
export function gurney({ corpse = false } = {}) {
  const b = B();
  const sheet = corpse ? 'dirtySheet' : 'sheet';
  // Chasis en X (tijera) + base inferior + ruedas
  for (const s of [-0.3, 0.3]) {
    b.tube([s, 0.14, -0.62], [s, 0.74, 0.62], 0.018, 'metal');
    b.tube([s, 0.14, 0.62], [s, 0.74, -0.62], 0.018, 'metal');
    b.tube([s, 0.12, -0.8], [s, 0.12, 0.8], 0.02, 'metal');
    caster(b, s, -0.8, 0.06); caster(b, s, 0.8, 0.06);
  }
  b.tube([-0.3, 0.12, -0.8], [0.3, 0.12, -0.8], 0.016, 'metal');
  b.tube([-0.3, 0.12, 0.8], [0.3, 0.12, 0.8], 0.016, 'metal');
  b.box(0.7, 0.04, 2.0, 'metal', 0, 0.76, 0, { r: 0.012 });
  // Colchoneta
  b.box(0.68, 0.08, 1.96, 'mattress', 0, 0.82, 0, { r: 0.03, rs: 3 });
  b.box(0.66, 0.04, 1.35, sheet, 0, 0.885, 0.3, { r: 0.015 });
  b.box(0.5, 0.09, 0.32, sheet, 0, 0.9, -0.72, { r: 0.04, rs: 3 });
  // Barandillas
  for (const s of [-1, 1]) {
    const x = s * 0.37;
    b.tube([x, 0.97, -0.65], [x, 0.97, 0.65], 0.014, 'chrome');
    b.tube([x, 0.87, -0.65], [x, 0.87, 0.65], 0.012, 'chrome');
    for (const z of [-0.65, 0, 0.65]) b.tube([x, 0.86, z], [x, 0.97, z], 0.012, 'chrome');
  }
  // Correas
  b.box(0.76, 0.012, 0.07, 'vinyl', 0, 0.9, 0.2, { r: 0.004 });
  b.box(0.76, 0.012, 0.07, 'vinyl', 0, 0.9, 0.62, { r: 0.004 });
  if (corpse) {
    // Cuerpo amortajado bajo la sábana
    b.capsule(0.19, 0.5, sheet, 0, 1.0, 0.22, { rx: PI / 2, sx: 1.0, sy: 1, sz: 0.55 });
    b.sphere(0.115, sheet, 0, 1.0, -0.5, { sx: 0.9, sy: 0.95, sz: 1.1 });
    b.capsule(0.12, 0.45, sheet, 0, 0.97, 0.82, { rx: PI / 2, sz: 0.55 });
    b.box(0.5, 0.04, 0.7, sheet, 0, 0.97, 0.45, { r: 0.015 });
  }
  return b.build();
}

// =========================================================================
// SILLA DE RUEDAS
// =========================================================================
export function wheelchair() {
  const b = B();
  // Asiento y respaldo de vinilo
  b.box(0.5, 0.05, 0.46, 'vinyl', 0, 0.5, 0.0, { r: 0.02 });
  b.box(0.5, 0.42, 0.05, 'vinyl', 0, 0.78, -0.25, { r: 0.02, rx: -0.08 });
  // Chasis tubular
  for (const s of [-1, 1]) {
    const x = s * 0.26;
    b.tube([x, 0.48, -0.22], [x, 0.48, 0.25], 0.014, 'chrome');
    b.tube([x, 0.48, 0.25], [x, 0.18, 0.36], 0.014, 'chrome');          // soporte delantero
    b.tube([x, 0.48, -0.24], [x, 1.02, -0.3], 0.014, 'chrome');         // montante del respaldo
    b.tube([x, 1.02, -0.3], [x, 1.02, -0.42], 0.014, 'chrome');         // asa
    b.cyl(0.021, 0.021, 0.12, 'rubber', x, 1.02, -0.44, { rx: PI / 2 });
    // Apoyabrazos
    b.box(0.05, 0.035, 0.34, 'rubber', x * 1.02, 0.72, 0.0, { r: 0.012 });
    b.tube([x, 0.5, -0.12], [x, 0.71, -0.12], 0.011, 'chrome');
    b.tube([x, 0.5, 0.13], [x, 0.71, 0.13], 0.011, 'chrome');
    // Rueda trasera grande con aro propulsor y radios
    const wx = s * 0.33, wy = 0.3, wz = -0.1;
    b.torus(0.29, 0.016, 'rubber', wx, wy, wz, { ry: PI / 2, seg: 36, tseg: 8 });
    b.torus(0.255, 0.006, 'chrome', wx + s * 0.04, wy, wz, { ry: PI / 2, seg: 32, tseg: 6 });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * PI * 2;
      b.tube([wx, wy, wz], [wx, wy + Math.sin(a) * 0.28, wz + Math.cos(a) * 0.28], 0.0035, 'chrome', 4);
    }
    b.cyl(0.03, 0.03, 0.06, 'chrome', wx, wy, wz, { rz: PI / 2, seg: 10 });
    b.tube([x, 0.46, -0.1], [wx - s * 0.02, wy, wz], 0.012, 'metal');
    // Rueda delantera giratoria
    b.tube([x, 0.26, 0.36], [x, 0.14, 0.4], 0.011, 'chrome');
    b.cyl(0.06, 0.06, 0.035, 'rubber', s * 0.25, 0.06, 0.4, { rz: PI / 2, seg: 14 });
    // Reposapiés
    b.tube([x, 0.2, 0.36], [x * 0.75, 0.13, 0.55], 0.012, 'chrome');
    b.box(0.13, 0.02, 0.15, 'darkMetal', x * 0.7, 0.12, 0.58, { r: 0.008, ry: s * 0.15 });
  }
  b.tube([-0.26, 0.2, 0.3], [0.26, 0.2, 0.3], 0.012, 'chrome');
  return b.build();
}

// =========================================================================
// MOSTRADOR DE RECEPCIÓN / ESCRITORIO
// =========================================================================
function crtMonitor(b, x, y, z, on = true, rot = 0) {
  const o = { ry: rot };
  const c = Math.cos(rot), s = Math.sin(rot);
  const P = (px, py, pz) => [x + px * c + pz * s, y + py, z - px * s + pz * c];
  // Base
  b.cyl(0.11, 0.13, 0.03, 'casingMat', ...P(0, 0.015, 0), { seg: 20, ry: rot });
  // Bisel frontal y carcasa trasera troncopiramidal
  b.box(0.5, 0.42, 0.1, 'casingMat', ...P(0, 0.26, 0.12), { r: 0.025, ry: rot });
  b.box(0.42, 0.36, 0.14, 'casingMat', ...P(0, 0.27, 0.0), { r: 0.03, ry: rot });
  b.box(0.3, 0.26, 0.11, 'casingMat', ...P(0, 0.27, -0.11), { r: 0.03, ry: rot });
  // Pantalla (levemente adelantada)
  b.plane(0.4, 0.32, on ? 'screen' : 'screenOff', ...P(0, 0.265, 0.172), { ry: rot });
  // Marco interior oscuro
  b.box(0.42, 0.34, 0.01, 'darkMetal', ...P(0, 0.265, 0.168), { ry: rot });
  // Botón + LED
  b.box(0.035, 0.015, 0.012, 'darkMetal', ...P(0.17, 0.07, 0.172), { ry: rot });
  b.box(0.012, 0.012, 0.01, on ? 'ledGreen' : 'ledRed', ...P(0.13, 0.07, 0.172), { ry: rot });
  // Ranuras de ventilación
  for (let i = 0; i < 5; i++) b.box(0.2, 0.01, 0.01, 'darkMetal', ...P(0, 0.2 + i * 0.03, -0.166), { ry: rot, rx: 0 });
  // Teclado
  b.box(0.44, 0.025, 0.16, 'keyboardMat', ...P(0, 0.0125, 0.36), { r: 0.008, ry: rot });
  b.box(0.4, 0.014, 0.12, 'keyCap', ...P(0, 0.03, 0.355), { ry: rot, rx: -0.06 });
  b.box(0.14, 0.012, 0.025, 'keyboardMat', ...P(0, 0.04, 0.4), { ry: rot });
}

function phoneModel(b, x, y, z, rot = 0) {
  b.box(0.22, 0.05, 0.2, 'darkMetal', x, y + 0.025, z, { r: 0.015, ry: rot });
  b.box(0.1, 0.015, 0.1, 'paint', x, y + 0.055, z, { ry: rot });
  // Auricular
  const c = Math.cos(rot), s = Math.sin(rot);
  const px = x + 0.0 * c, pz = z - 0.0 * s;
  b.capsule(0.022, 0.18, 'darkMetal', px, y + 0.085, pz, { rz: PI / 2, ry: rot, cs: 3, seg: 8 });
  b.sphere(0.03, 'darkMetal', px - 0.1 * c, y + 0.085, pz + 0.1 * s, { seg: 8 });
  b.sphere(0.03, 'darkMetal', px + 0.1 * c, y + 0.085, pz - 0.1 * s, { seg: 8 });
}

export function deskModel({ len = 2.4, small = false } = {}) {
  const b = B();
  const g = new THREE.Group();
  const h = small ? 0.74 : 1.1;

  // Cuerpo del mueble: zócalo, laterales con cajoneras y paneles hundidos
  b.box(len, 0.07, 0.8, 'darkMetal', 0, 0.035, 0.0);
  b.box(len, h - 0.07, 0.84, 'wood', 0, 0.07 + (h - 0.07) / 2, 0, { r: 0.012 });
  // Paneles frontales hundidos
  const nPan = Math.max(2, Math.round(len / 0.9));
  const pw = (len - 0.1) / nPan;
  for (let i = 0; i < nPan; i++) {
    const px = -len / 2 + 0.05 + pw * (i + 0.5);
    b.box(pw - 0.07, h - 0.3, 0.02, 'lightWood', px, h * 0.5 + 0.02, 0.43, { r: 0.006 });
    if (small && i % 2 === 0) b.box(0.14, 0.02, 0.02, 'brushed', px, h - 0.2, 0.455, { r: 0.008 });
  }
  b.box(len + 0.02, 0.025, 0.86, 'darkMetal', 0, h - 0.04, 0);
  // Encimera con borde redondeado
  b.box(len + 0.12, 0.06, 0.98, 'lightWood', 0, h + 0.03, 0.0, { r: 0.02, rs: 3 });

  if (!small) {
    const top = h + 0.06;
    // Mostrador alto para visitantes (frente) con borde
    b.box(len + 0.1, 0.05, 0.26, 'lightWood', 0, top + 0.045, 0.62, { r: 0.015 });
    b.box(len + 0.06, 0.06, 0.03, 'wood', 0, h - 0.0, 0.5, { r: 0.008 });
    // Mamparas de cristal con columnas cromadas y riel de latón
    const wingW = Math.max(0.4, (len - 3.8) / 2);
    const wingX = len / 2 - wingW / 2;
    const gy = top + 0.36;
    for (const x of [-len / 2 + 0.06, -len / 2 + wingW, len / 2 - wingW, len / 2 - 0.06]) {
      b.cyl(0.022, 0.022, 0.72, 'chrome', x, top + 0.36, -0.42, { seg: 12 });
      b.sphere(0.03, 'brass', x, top + 0.74, -0.42, { seg: 10 });
    }
    b.box(len, 0.035, 0.05, 'brass', 0, top + 0.72, -0.42, { r: 0.012 });
    b.box(len, 0.03, 0.05, 'brass', 0, top + 0.02, -0.42, { r: 0.01 });
    for (const sx of [-1, 1]) b.box(wingW - 0.06, 0.64, 0.012, 'glass', sx * wingX, gy, -0.42);
    // Lámpara de escritorio de latón
    const lx = 0.9, lz = 0.15;
    b.cyl(0.085, 0.095, 0.022, 'brass', lx, top + 0.011, lz, { seg: 20 });
    b.tube([lx, top, lz], [lx, top + 0.3, lz], 0.01, 'brass');
    b.tube([lx, top + 0.3, lz], [lx + 0.1, top + 0.4, lz + 0.05], 0.008, 'brass');
    b.cyl(0.04, 0.11, 0.12, 'brass', lx + 0.12, top + 0.38, lz + 0.06, { seg: 20, rx: 0.5 });
    b.sphere(0.035, 'lampGlow', lx + 0.12, top + 0.34, lz + 0.075, { seg: 10 });
  }

  // Equipos CRT
  const n = small ? 1 : 2;
  const topY = h + 0.06;
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? -len * 0.22 : (-len / 4 + i * (len / 2));
    crtMonitor(b, x, topY, small ? -0.1 : -0.05, !(i === 1 && !small), small ? 0 : 0);
  }
  // Teléfono
  phoneModel(b, len / 2 - 0.35, topY, small ? 0.05 : 0.2, -0.25);
  // Carpeta/libreta con sujetapapeles
  const cx = -len / 2 + 0.42, cz = small ? 0.15 : 0.3;
  b.box(0.28, 0.018, 0.36, 'wood', cx, topY + 0.009, cz, { ry: 0.25, r: 0.004 });
  b.box(0.24, 0.006, 0.32, 'sheet', cx, topY + 0.021, cz, { ry: 0.25 });
  b.box(0.09, 0.02, 0.035, 'brushed', cx - 0.0, topY + 0.028, cz - 0.15, { ry: 0.25, r: 0.006 });
  // Lapicero, taza
  b.cyl(0.045, 0.04, 0.11, 'plastic', 0.28, topY + 0.055, 0.32, { seg: 14 });
  b.tube([0.28, topY + 0.1, 0.32], [0.265, topY + 0.2, 0.31], 0.006, 'darkMetal', 5);
  b.tube([0.28, topY + 0.1, 0.32], [0.3, topY + 0.19, 0.335], 0.006, 'red', 5);
  b.lathe([[0.001, 0], [0.04, 0.0], [0.042, 0.09], [0.036, 0.09], [0.001, 0.01]], 'porcelain', -0.28, topY, 0.34, { seg: 16 });
  b.torus(0.022, 0.006, 'porcelain', -0.235, topY + 0.05, 0.34, { arc: PI, seg: 10, rz: -PI / 2, ry: 0 });
  return withGroup(b.build(), g);
}

function withGroup(built, g) { g.add(built); return g; }

// =========================================================================
// ARMARIO DE MEDICAMENTOS (vitrina vidriada, interior visible)
// =========================================================================
export function cabinet() {
  const b = B();
  const W = 0.95, H = 1.85, D = 0.62;
  // Carcasa hueca
  b.box(0.03, H, D, 'enamel', -W / 2 + 0.015, H / 2, 0);
  b.box(0.03, H, D, 'enamel', W / 2 - 0.015, H / 2, 0);
  b.box(W, 0.03, D, 'enamel', 0, H - 0.015, 0);
  b.box(W, 0.03, D, 'enamel', 0, 0.12, 0);
  b.box(W, 0.02, 0.02, 'enamel', 0, H - 0.015, 0);
  b.box(W - 0.06, H - 0.14, 0.02, 'paint', 0, H / 2 + 0.05, -D / 2 + 0.01);
  b.box(W, 0.12, D - 0.04, 'darkMetal', 0, 0.06, -0.02);
  // Estantes con frascos, cajas y gasas
  const r = rng(7);
  for (let i = 0; i < 4; i++) {
    const y = 0.45 + i * 0.37;
    b.box(W - 0.07, 0.015, D - 0.06, 'metal', 0, y, 0);
    for (let k = 0; k < 6; k++) {
      const x = -0.35 + k * 0.14 + (r() - 0.5) * 0.03, z = (r() - 0.5) * 0.18;
      const t = r();
      if (t < 0.4) {
        b.cyl(0.032, 0.032, 0.1 + r() * 0.04, 'amber', x, y + 0.06, z, { seg: 10 });
        b.cyl(0.024, 0.024, 0.02, 'white', x, y + 0.125, z, { seg: 10 });
      } else if (t < 0.75) {
        b.box(0.07, 0.11 + r() * 0.04, 0.05, 'white', x, y + 0.065, z, { r: 0.004, ry: (r() - 0.5) * 0.3 });
      } else {
        b.cyl(0.04, 0.04, 0.07, 'glassBottle', x, y + 0.045, z, { seg: 10 });
      }
    }
  }
  // Puertas con marco cromado, vidrio y tiradores
  for (const s of [-1, 1]) {
    const cx = s * 0.235, fz = D / 2 + 0.005;
    const fw = 0.46, fh = 1.66, fy = 0.12 + fh / 2 + 0.02;
    b.box(fw, 0.035, 0.025, 'chrome', cx, fy + fh / 2 - 0.0175, fz, { r: 0.006 });
    b.box(fw, 0.035, 0.025, 'chrome', cx, fy - fh / 2 + 0.0175, fz, { r: 0.006 });
    b.box(0.035, fh, 0.025, 'chrome', cx - fw / 2 + 0.0175, fy, fz, { r: 0.006 });
    b.box(0.035, fh, 0.025, 'chrome', cx + fw / 2 - 0.0175, fy, fz, { r: 0.006 });
    b.box(fw - 0.04, fh - 0.04, 0.008, 'glass', cx, fy, fz);
    b.box(0.022, 0.2, 0.03, 'brushed', cx - s * 0.18, fy, fz + 0.022, { r: 0.008 });
  }
  b.box(0.05, 0.08, 0.012, 'brass', 0, 0.9, D / 2 + 0.012, { r: 0.003 }); // cerradura
  return b.build();
}

// =========================================================================
// BANCO DE SALA DE ESPERA
// =========================================================================
export function bench() {
  const b = B();
  // Asientos y respaldo moldeados
  b.box(2.1, 0.05, 0.5, 'plastic', 0, 0.45, 0.02, { r: 0.02, rs: 3, rx: -0.03 });
  b.box(2.1, 0.4, 0.045, 'plastic', 0, 0.74, -0.22, { r: 0.02, rs: 3, rx: -0.14 });
  // Separadores de asientos
  for (const x of [-0.7, 0.0, 0.7]) b.box(0.02, 0.04, 0.5, 'plastic', x, 0.485, 0.02, { r: 0.008 });
  // Bastidor tubular con patas
  b.tube([-1.0, 0.44, -0.2], [1.0, 0.44, -0.2], 0.018, 'metal');
  b.tube([-1.0, 0.44, 0.2], [1.0, 0.44, 0.2], 0.018, 'metal');
  for (const x of [-1.0, 0.0, 1.0]) {
    b.tube([x, 0.0, 0.25], [x, 0.44, 0.2], 0.02, 'metal');
    b.tube([x, 0.0, -0.3], [x, 0.44, -0.2], 0.02, 'metal');
    b.tube([x, 0.0, -0.3], [x, 0.0, 0.25], 0.015, 'metal');
    b.tube([x, 0.44, -0.2], [x, 0.66, -0.24], 0.016, 'metal');
  }
  for (const x of [-1.04, 1.04]) b.box(0.03, 0.04, 0.46, 'darkMetal', x, 0.64, 0, { r: 0.01 });
  return b.build();
}

// =========================================================================
// MÁQUINA EXPENDEDORA
// =========================================================================
let vendTex = null;
function vendingTexture() {
  return vendTex ||= paint(256, 512, (c, w, h) => {
    c.fillStyle = '#0e141c'; c.fillRect(0, 0, w, h);
    const r = rng(11);
    const cols = ['#c0392b', '#e0922a', '#2c82c0', '#2f9e5b', '#d6d6d0'];
    for (let row = 0; row < 5; row++) {
      const y = 70 + row * 62;
      c.fillStyle = '#303840'; c.fillRect(8, y + 46, w - 16, 5);
      for (let x = 14; x < 232; x += 36) {
        c.fillStyle = cols[Math.floor(r() * cols.length)];
        c.fillRect(x, y + 6 + r() * 6, 24, 38);
        c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x + 3, y + 8, 4, 32);
      }
    }
    c.fillStyle = '#c8322e'; c.fillRect(0, 0, w, 52);
    c.fillStyle = '#fff'; c.font = 'bold 26px sans-serif'; c.fillText('REFRESCOS', 36, 36);
    // reflejo suave
    const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,0.14)'); gr.addColorStop(0.4, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  });
}
let vendMat = null;
export function vending() {
  const b = B();
  const g = new THREE.Group();
  b.box(1.04, 1.9, 0.82, 'darkMetal', 0, 0.97, 0, { r: 0.03, rs: 2 });
  b.box(1.0, 0.06, 0.78, 'metal', 0, 0.03, 0);
  b.box(0.98, 0.04, 0.02, 'red', 0, 1.82, 0.41);
  // Marco de la vitrina y panel de botones
  b.box(0.72, 1.45, 0.02, 'rubber', -0.12, 1.07, 0.405);
  b.box(0.2, 1.45, 0.03, 'metal', 0.38, 1.07, 0.405, { r: 0.008 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) b.box(0.035, 0.022, 0.012, 'chrome', 0.33 + j * 0.05, 1.42 - i * 0.07, 0.425, { r: 0.004 });
  b.box(0.12, 0.08, 0.012, 'ledRed', 0.38, 1.7, 0.425);
  b.box(0.1, 0.03, 0.02, 'rubber', 0.38, 0.92, 0.425);           // ranura de monedas
  // Compuerta de entrega
  b.box(0.7, 0.2, 0.02, 'rubber', -0.12, 0.2, 0.405);
  b.box(0.6, 0.12, 0.03, 'darkMetal', -0.12, 0.2, 0.42, { r: 0.01 });
  // Patas
  for (const x of [-0.46, 0.46]) b.cyl(0.03, 0.03, 0.03, 'rubber', x, 0.0, 0.34, { seg: 8 });
  const built = b.build();
  g.add(built);
  vendMat ||= new THREE.MeshBasicMaterial({ map: vendingTexture(), color: 0xb8c2c8 });
  vendMat.userData.isShared = true;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.4), vendMat);
  front.position.set(-0.12, 1.07, 0.418); g.add(front);
  const l = new THREE.PointLight(0xa5d8ff, 1.2, 4.2, 2); l.position.set(0, 1.2, 0.8); g.add(l);
  return g;
}

// =========================================================================
// SOPORTE DE SUERO
// =========================================================================
export function ivStand() {
  const b = B();
  b.tube([0, 0.07, 0], [0, 1.85, 0], 0.013, 'chrome');
  b.cyl(0.035, 0.045, 0.1, 'chrome', 0, 0.1, 0, { seg: 12 });
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * PI * 2, c = Math.cos(a), s = Math.sin(a);
    b.tube([0, 0.07, 0], [c * 0.26, 0.05, s * 0.26], 0.014, 'chrome', 6);
    caster(b, c * 0.26, s * 0.26, 0.03, 0.03);
  }
  // Perilla de altura y cabezal con ganchos
  b.cyl(0.02, 0.02, 0.08, 'darkMetal', 0, 1.2, 0, { seg: 10 });
  b.cyl(0.03, 0.03, 0.05, 'chrome', 0, 1.86, 0, { seg: 10 });
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * PI * 2 + PI / 4, c = Math.cos(a), s = Math.sin(a);
    b.tube([0, 1.86, 0], [c * 0.13, 1.8, s * 0.13], 0.007, 'chrome', 6);
    b.sphere(0.011, 'chrome', c * 0.13, 1.795, s * 0.13, { seg: 6 });
  }
  // Bolsa de suero translúcida con líquido, y goteo
  b.box(0.13, 0.22, 0.03, 'glassBottle', 0.1, 1.66, 0.0, { r: 0.012, rs: 2 });
  b.box(0.105, 0.14, 0.022, 'fluid', 0.1, 1.64, 0.0, { r: 0.01 });
  b.box(0.06, 0.04, 0.005, 'white', 0.1, 1.68, 0.02);
  b.cyl(0.012, 0.012, 0.09, 'glassBottle', 0.1, 1.5, 0.0, { seg: 8 });
  b.curve([[0.1, 1.46, 0], [0.12, 1.2, 0.05], [0.2, 0.95, 0.12], [0.18, 0.75, 0.16]], 0.004, 'glassBottle', { segs: 20, rs: 5 });
  return b.build();
}

// =========================================================================
// PLANTA
// =========================================================================
export function plant() {
  const b = B();
  b.lathe([[0.001, 0], [0.15, 0], [0.2, 0.05], [0.26, 0.4], [0.275, 0.45], [0.245, 0.45], [0.23, 0.4]], 'terracotta', 0, 0, 0, { seg: 20 });
  b.cyl(0.235, 0.235, 0.02, 'soil', 0, 0.4, 0, { seg: 18 });
  const r = rng(21);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * PI * 2 + r() * 0.3;
    const len = 0.55 + r() * 0.35, tilt = 0.25 + r() * 0.55;
    b.geo(leafGeometry(len, 0.075, 0.18 + r() * 0.15), 'leaf', Math.cos(a) * 0.04, 0.4, Math.sin(a) * 0.04, { ry: a + PI / 2, rx: tilt });
  }
  return b.build();
}

// =========================================================================
// ESTANTERÍA METÁLICA
// =========================================================================
export function shelf() {
  const b = B();
  const r = rng(5);
  for (const x of [-0.88, 0.88]) for (const z of [-0.22, 0.22]) b.box(0.04, 1.9, 0.04, 'metal', x, 0.95, z, { r: 0.006 });
  // Travesaños en diagonal en los laterales
  for (const x of [-0.88, 0.88]) { b.tube([x, 0.15, -0.22], [x, 1.6, 0.22], 0.008, 'metal', 5); b.tube([x, 0.15, 0.22], [x, 1.6, -0.22], 0.008, 'metal', 5); }
  for (let i = 0; i < 5; i++) {
    const y = 0.14 + i * 0.4;
    b.box(1.78, 0.03, 0.52, 'metal', 0, y, 0, { r: 0.005 });
    b.box(1.78, 0.05, 0.012, 'darkMetal', 0, y + 0.02, 0.26);
    let x = -0.74;
    while (x < 0.72) {
      const w = 0.16 + r() * 0.16, h = 0.14 + r() * 0.16, d = 0.26 + r() * 0.12, t = r();
      const m = t < 0.5 ? 'cardboardMat' : t < 0.75 ? 'cardboard' : t < 0.9 ? 'white' : 'plastic';
      b.box(w, h, d, m, x + w / 2, y + 0.015 + h / 2, (r() - 0.5) * 0.05, { r: 0.004, ry: (r() - 0.5) * 0.08 });
      x += w + 0.03 + r() * 0.04;
    }
  }
  return b.build();
}

// =========================================================================
// CASILLEROS METÁLICOS (3 puertas)
// =========================================================================
export function locker() {
  const b = B();
  b.box(0.92, 0.06, 0.56, 'darkMetal', 0, 0.03, 0);
  b.box(0.92, 1.72, 0.54, 'metal', 0, 0.92, -0.0, { r: 0.008 });
  b.box(0.94, 0.04, 0.56, 'darkMetal', 0, 1.8, 0, { r: 0.01 });
  b.box(0.96, 0.08, 0.5, 'darkMetal', 0, 1.86, -0.02, { rx: -0.0 });
  for (let i = 0; i < 3; i++) {
    const x = -0.3 + i * 0.3;
    b.box(0.285, 1.66, 0.025, 'paint', x, 0.92, 0.28, { r: 0.004 });
    b.box(0.2, 0.008, 0.012, 'darkMetal', x, 1.1, 0.296);
    for (let k = 0; k < 5; k++) b.box(0.2, 0.014, 0.014, 'darkMetal', x, 1.57 - k * 0.03, 0.294);
    for (let k = 0; k < 4; k++) b.box(0.2, 0.014, 0.014, 'darkMetal', x, 0.22 + k * 0.03, 0.294);
    b.box(0.02, 0.1, 0.02, 'chrome', x + 0.1, 0.95, 0.3, { r: 0.005 });
    b.box(0.07, 0.035, 0.008, 'white', x, 1.3, 0.294);
    b.box(0.26, 1.64, 0.004, 'darkMetal', x, 0.92, 0.268);
  }
  return b.build();
}

// =========================================================================
// SILLA GIRATORIA
// =========================================================================
export function chair() {
  const b = B();
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * PI * 2, c = Math.cos(a), s = Math.sin(a);
    b.tube([0, 0.13, 0], [c * 0.27, 0.07, s * 0.27], 0.017, 'darkMetal', 6);
    b.cyl(0.028, 0.028, 0.026, 'rubber', c * 0.27, 0.028, s * 0.27, { rz: PI / 2, ry: -a, seg: 10 });
  }
  b.cyl(0.035, 0.05, 0.1, 'darkMetal', 0, 0.15, 0, { seg: 12 });
  b.cyl(0.026, 0.026, 0.3, 'chrome', 0, 0.3, 0, { seg: 10 });
  b.cyl(0.055, 0.055, 0.04, 'darkMetal', 0, 0.44, 0, { seg: 12 });
  b.box(0.48, 0.07, 0.46, 'fabric', 0, 0.48, 0.02, { r: 0.03, rs: 3 });
  b.box(0.42, 0.42, 0.06, 'fabric', 0, 0.78, -0.21, { r: 0.028, rs: 3, rx: -0.12 });
  b.tube([0, 0.5, 0], [0, 0.58, -0.2], 0.015, 'darkMetal');
  for (const s of [-1, 1]) {
    b.tube([s * 0.23, 0.5, -0.05], [s * 0.26, 0.66, -0.05], 0.011, 'darkMetal', 6);
    b.box(0.06, 0.03, 0.26, 'rubber', s * 0.26, 0.68, 0.04, { r: 0.012 });
  }
  return b.build();
}

// =========================================================================
// LAVABO QUIRÚRGICO CON ESPEJO
// =========================================================================
export function sink() {
  const b = B();
  b.box(1.3, 0.72, 0.5, 'hospitalGreen', 0, 0.38, 0.0, { r: 0.01 });
  b.box(1.3, 0.08, 0.5, 'darkMetal', 0, 0.04, 0.02);
  // Puertas del mueble
  for (const x of [-0.32, 0.32]) {
    b.box(0.6, 0.56, 0.015, 'enamel', x, 0.4, 0.255, { r: 0.006 });
    b.box(0.025, 0.12, 0.02, 'brushed', x - Math.sign(x) * 0.22, 0.52, 0.27, { r: 0.006 });
  }
  b.box(1.4, 0.05, 0.58, 'porcelain', 0, 0.78, 0.02, { r: 0.015, rs: 2 });
  b.box(1.4, 0.2, 0.035, 'porcelain', 0, 0.9, -0.26, { r: 0.01 });
  for (const x of [-0.35, 0.35]) {
    // Cuenco hundido
    b.lathe([[0.2, 0], [0.2, -0.0], [0.17, -0.1], [0.1, -0.13], [0.001, -0.13]], 'porcelainIn', x, 0.805, 0.06, { seg: 24 });
    b.torus(0.205, 0.012, 'porcelain', x, 0.806, 0.06, { rx: PI / 2, seg: 28, tseg: 6 });
    b.cyl(0.032, 0.032, 0.008, 'chrome', x, 0.678, 0.06, { seg: 12 });
    // Grifo de cuello de cisne
    b.cyl(0.03, 0.035, 0.05, 'chrome', x, 0.835, -0.15, { seg: 12 });
    b.curve([[x, 0.86, -0.15], [x, 1.02, -0.15], [x, 1.1, -0.1], [x, 1.07, 0.0]], 0.014, 'chrome', { segs: 16, rs: 8 });
    b.cyl(0.02, 0.014, 0.04, 'chrome', x, 1.045, 0.0, { seg: 8 });
    b.box(0.015, 0.015, 0.14, 'chrome', x + 0.09, 0.86, -0.18, { rx: -0.3 });
    // Dispensador mural
    b.box(0.09, 0.17, 0.08, 'white', x + 0.28, 1.16, -0.2, { r: 0.012 });
    b.box(0.018, 0.018, 0.055, 'chrome', x + 0.28, 1.1, -0.15, { r: 0.004 });
  }
  // Espejo con marco
  b.box(1.32, 0.84, 0.025, 'darkMetal', 0, 1.62, -0.262, { r: 0.008 });
  b.box(1.26, 0.78, 0.006, 'mirror', 0, 1.62, -0.246);
  return b.build();
}

// =========================================================================
// CAJÓN DE MADERA CON CAJA DE CARTÓN
// =========================================================================
export function crate() {
  const b = B();
  const w = 0.85;
  b.box(w, 0.5, w, 'wood', 0, 0.28, 0, { r: 0.012 });
  for (const y of [0.03, 0.53]) b.box(w + 0.02, 0.06, w + 0.02, 'darkMetal', 0, y, 0, { r: 0.008 });
  for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) for (const z of [-w / 2 + 0.04, w / 2 - 0.04]) b.box(0.06, 0.52, 0.06, 'lightWood', x, 0.28, z);
  // Tablillas
  for (let i = 0; i < 4; i++) b.box(w + 0.01, 0.1, 0.012, 'lightWood', 0, 0.13 + i * 0.11, w / 2 + 0.003);
  // Caja de suministros ladeada
  b.box(0.62, 0.42, 0.62, 'cardboardMat', 0.06, 0.78, 0.02, { r: 0.012, ry: 0.28 });
  b.box(0.64, 0.015, 0.1, 'white', 0.06, 0.995, 0.02, { ry: 0.28 });
  return b.build();
}

// =========================================================================
// PAPELERA DE PEDAL
// =========================================================================
export function trash() {
  const b = B();
  b.lathe([[0.001, 0], [0.15, 0], [0.16, 0.04], [0.175, 0.5], [0.001, 0.5]], 'chrome', 0, 0, 0, { seg: 20 });
  b.cyl(0.182, 0.182, 0.03, 'darkMetal', 0, 0.52, 0, { seg: 20 });
  b.sphere(0.045, 'darkMetal', 0, 0.55, 0, { seg: 10, thetaLen: PI / 2 });
  b.cyl(0.178, 0.178, 0.02, 'rubber', 0, 0.01, 0, { seg: 20 });
  b.box(0.07, 0.018, 0.12, 'rubber', 0, 0.04, 0.2, { r: 0.006 });
  b.tube([0, 0.05, 0.16], [0, 0.08, 0.2], 0.007, 'darkMetal', 5);
  return b.build();
}

// =========================================================================
// MONITOR CARDÍACO CON CARRO
// =========================================================================
export function cardiacMonitor() {
  const b = B();
  b.cyl(0.03, 0.06, 0.1, 'metal', 0, 0.3, 0, { seg: 10 });
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * PI * 2 + PI / 4, c = Math.cos(a), s = Math.sin(a);
    b.tube([0, 0.1, 0], [c * 0.27, 0.07, s * 0.27], 0.017, 'metal', 6);
    caster(b, c * 0.27, s * 0.27, 0.035, 0.035);
  }
  b.cyl(0.03, 0.03, 0.62, 'chrome', 0, 0.62, 0, { seg: 10 });
  b.box(0.5, 0.03, 0.4, 'hospitalGreen', 0, 0.33, 0.02, { r: 0.01 });
  b.box(0.52, 0.03, 0.02, 'metal', 0, 0.35, 0.22);
  // Carcasa del monitor con bisel
  b.box(0.56, 0.4, 0.2, 'enamel', 0, 1.05, 0, { r: 0.03, rs: 3 });
  b.box(0.42, 0.32, 0.03, 'darkMetal', -0.04, 1.07, 0.1, { r: 0.008 });
  b.plane(0.38, 0.28, 'ecgMat', -0.04, 1.07, 0.116);
  b.box(0.08, 0.3, 0.025, 'darkMetal', 0.22, 1.05, 0.1, { r: 0.006 });
  b.cyl(0.025, 0.025, 0.02, 'darkMetal', 0.22, 0.98, 0.118, { rx: PI / 2, seg: 12 });
  b.box(0.03, 0.015, 0.01, 'ledGreen', 0.22, 1.16, 0.115);
  b.box(0.012, 0.012, 0.01, 'ledRed', 0.22, 1.12, 0.115);
  b.box(0.16, 0.05, 0.06, 'enamel', 0, 1.27, 0, { r: 0.015 }); // asa
  // Cables de paciente
  b.curve([[0.2, 0.88, 0.0], [0.3, 0.7, 0.1], [0.28, 0.5, 0.2], [0.18, 0.36, 0.26]], 0.007, 'rubber', { segs: 16, rs: 5 });
  b.curve([[0.15, 0.88, 0.0], [0.24, 0.64, 0.12], [0.2, 0.42, 0.24]], 0.006, 'ledRed', { segs: 14, rs: 5 });
  return b.build();
}

// =========================================================================
// NEGATOSCOPIO (visor de radiografías de pared)
// =========================================================================
export function xrayViewer() {
  const b = B();
  const y = 1.8;
  b.box(0.7, 0.9, 0.07, 'darkMetal', 0, y, -0.015, { r: 0.012 });
  b.box(0.64, 0.84, 0.01, 'metal', 0, y, 0.025);
  b.plane(0.58, 0.78, 'xrayMat', 0, y, 0.032);
  b.box(0.14, 0.03, 0.03, 'chrome', 0, y + 0.43, 0.04, { r: 0.006 });
  b.box(0.03, 0.05, 0.03, 'red', 0.3, y - 0.38, 0.04, { r: 0.006 });
  b.box(0.06, 0.06, 0.04, 'darkMetal', 0, y, -0.055); // espaciador
  const g = b.build();
  const l = new THREE.PointLight(0xb4d8ff, 1.0, 3.2, 1.8); l.position.set(0, y, 0.3); g.add(l);
  return g;
}

// =========================================================================
// LÁMPARA CIALÍTICA DE QUIRÓFANO (colgada del techo)
// =========================================================================
export function surgicalLamp() {
  const b = B();
  const CH = 3.3;
  b.cyl(0.2, 0.2, 0.05, 'chrome', 0, CH - 0.025, 0, { seg: 20 });
  b.cyl(0.05, 0.05, 0.3, 'chrome', 0, CH - 0.2, 0, { seg: 12 });
  b.sphere(0.07, 'chrome', 0, CH - 0.36, 0, { seg: 14 });
  b.tube([0, CH - 0.36, 0], [0, CH - 0.62, 0.5], 0.032, 'chrome');
  b.sphere(0.05, 'chrome', 0, CH - 0.62, 0.5, { seg: 12 });
  b.tube([0, CH - 0.62, 0.5], [0, CH - 0.7, 0.82], 0.028, 'chrome');
  // Cúpulas gemelas (cuenco reflectante hacia abajo + luz difusa)
  for (const s of [-0.34, 0.34]) {
    const cy = CH - 0.88;
    b.tube([0, CH - 0.7, 0.82], [s * 0.7, cy + 0.12, 0.82], 0.02, 'chrome', 8);
    b.lathe([[0.001, -0.02], [0.2, -0.04], [0.28, -0.1], [0.3, -0.1], [0.29, -0.06], [0.23, 0.0], [0.1, 0.03], [0.001, 0.03]], 'chrome', s, cy + 0.1, 0.82, { seg: 28 });
    b.cyl(0.24, 0.24, 0.012, 'lampGlow', s, cy - 0.04, 0.82, { seg: 28 });
    b.cyl(0.02, 0.02, 0.16, 'white', s, cy - 0.12, 0.82, { seg: 10 });
    b.sphere(0.03, 'white', s, cy - 0.2, 0.82, { seg: 10 });
  }
  const g = b.build();
  const spot = new THREE.SpotLight(0xfffaea, 26, 8, PI / 6, 0.5, 1.5);
  spot.position.set(0, CH - 0.95, 0.82); spot.target.position.set(0, 0.8, 0.82);
  g.add(spot, spot.target);
  return g;
}

// =========================================================================
// MESA DE CIRUGÍA
// =========================================================================
export function surgeryTable() {
  const b = B();
  b.box(0.7, 0.1, 1.0, 'metal', 0, 0.05, 0, { r: 0.025 });
  b.cyl(0.14, 0.2, 0.55, 'chrome', 0, 0.37, 0, { seg: 20 });
  b.cyl(0.19, 0.19, 0.06, 'metal', 0, 0.68, 0, { seg: 20 });
  for (const z of [-0.25, 0.25]) b.box(0.1, 0.03, 0.14, 'darkMetal', 0.3, 0.12, z, { r: 0.008 });
  // Plano articulado en 4 secciones sobre rieles
  b.box(0.68, 0.05, 2.14, 'chrome', 0, 0.74, 0, { r: 0.015 });
  const secs = [[-0.78, 0.5, 0], [-0.3, 0.62, 0], [0.3, 0.55, 0], [0.82, 0.5, 0]];
  for (const [z, l] of secs) b.box(0.64, 0.08, l - 0.02, 'vinyl', 0, 0.805, z, { r: 0.025, rs: 2 });
  for (const s of [-1, 1]) {
    b.tube([s * 0.36, 0.78, -1.0], [s * 0.36, 0.78, 1.0], 0.012, 'chrome');
    b.box(0.015, 0.03, 0.12, 'chrome', s * 0.36, 0.76, -0.6);
  }
  // Apoyabrazos y correas
  for (const s of [-1, 1]) {
    b.tube([s * 0.4, 0.8, -0.3], [s * 0.6, 0.86, -0.3], 0.012, 'chrome');
    b.box(0.15, 0.035, 0.5, 'vinyl', s * 0.68, 0.87, -0.3, { r: 0.015 });
  }
  b.box(0.7, 0.014, 0.06, 'rubber', 0, 0.85, 0.35);
  b.box(0.7, 0.014, 0.06, 'rubber', 0, 0.85, 0.7);
  return b.build();
}

// =========================================================================
// EXTINTOR (montado en pared)
// =========================================================================
export function fireExtinguisher() {
  const b = B();
  const z = 0.035;
  b.lathe([[0.001, 0], [0.07, 0], [0.085, 0.05], [0.085, 0.45], [0.06, 0.52], [0.03, 0.55], [0.001, 0.55]], 'red', 0, 1.2, z, { seg: 22 });
  b.cyl(0.03, 0.03, 0.06, 'brass', 0, 1.78, z, { seg: 10 });
  b.box(0.1, 0.03, 0.03, 'chrome', 0.0, 1.82, z, { r: 0.008 });
  b.box(0.1, 0.015, 0.03, 'chrome', 0.06, 1.79, z + 0.01, { rz: -0.4 });
  b.cyl(0.022, 0.022, 0.012, 'white', 0.05, 1.77, z + 0.045, { rx: PI / 2, seg: 10 });
  b.curve([[0.02, 1.78, z], [0.14, 1.7, z + 0.02], [0.14, 1.4, z + 0.05], [0.06, 1.28, z + 0.07]], 0.011, 'rubber', { segs: 20, rs: 6 });
  b.box(0.05, 0.03, 0.04, 'rubber', 0.06, 1.27, z + 0.07);
  b.box(0.17, 0.12, 0.012, 'white', 0, 1.5, z + 0.087, { r: 0.002 }); // etiqueta
  // Soporte de pared
  b.box(0.08, 0.5, 0.015, 'darkMetal', 0, 1.45, -0.048);
  b.box(0.19, 0.035, 0.03, 'darkMetal', 0, 1.62, 0.0, { r: 0.008 });
  b.box(0.19, 0.035, 0.03, 'darkMetal', 0, 1.34, 0.0, { r: 0.008 });
  return b.build();
}

// =========================================================================
// DISPENSADOR DE AGUA
// =========================================================================
export function waterDispenser() {
  const b = B();
  b.box(0.36, 0.98, 0.34, 'white', 0, 0.5, 0, { r: 0.02, rs: 2 });
  b.box(0.3, 0.12, 0.02, 'darkMetal', 0, 0.12, 0.17);
  b.box(0.3, 0.3, 0.012, 'enamel', 0, 0.3, 0.172);
  b.box(0.3, 0.02, 0.14, 'darkMetal', 0, 0.62, 0.15, { r: 0.006 });
  b.box(0.28, 0.01, 0.12, 'brushed', 0, 0.635, 0.15);
  b.box(0.036, 0.07, 0.05, 'ledRed', -0.06, 0.73, 0.16, { r: 0.008 });
  b.box(0.036, 0.07, 0.05, 'darkMetal', 0.06, 0.73, 0.16, { r: 0.008 });
  b.box(0.012, 0.012, 0.01, 'ledGreen', 0.0, 0.83, 0.17);
  // Botellón
  b.lathe([[0.001, 0], [0.12, 0], [0.14, 0.08], [0.14, 0.38], [0.1, 0.43], [0.05, 0.46], [0.045, 0.5], [0.001, 0.5]], 'amber', 0, 0.98, 0, { seg: 24 });
  b.cyl(0.13, 0.13, 0.04, 'fluid', 0, 1.2, 0, { seg: 24 });
  // Portavasos
  b.cyl(0.04, 0.04, 0.36, 'glass', -0.26, 0.78, 0, { seg: 14 });
  b.cyl(0.03, 0.03, 0.18, 'white', -0.26, 0.7, 0, { seg: 12 });
  b.box(0.012, 0.012, 0.012, 'chrome', -0.26, 0.97, 0);
  return b.build();
}

// =========================================================================
// CORTINA DIVISORIA CON RIEL
// =========================================================================
export function curtainDivider() {
  const b = B();
  b.box(2.4, 0.03, 0.035, 'chrome', 0, 3.2, 0, { r: 0.008 });
  for (let i = 0; i < 12; i++) {
    const x = -1.1 + i * 0.2;
    b.torus(0.012, 0.0035, 'chrome', x, 3.15, 0, { seg: 8, tseg: 4 });
  }
  for (const x of [-1.1, 1.1]) b.tube([x, 3.2, 0], [x, 3.3, 0], 0.006, 'chrome', 5);
  // Malla superior de ventilación
  b.box(2.35, 0.3, 0.012, 'dirtySheet', 0, 3.0, 0);
  const g = b.build();
  // Cortina plisada: plano subdividido con ondas reales
  const geo = new THREE.PlaneGeometry(2.35, 2.2, 56, 6);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, Math.sin(x * 11) * 0.045 + Math.sin(x * 3.1 + y * 0.8) * 0.02);
    p.setX(i, x * (1 - (1.1 - y) * 0.006));
  }
  geo.computeVertexNormals();
  const c = new THREE.Mesh(geo, M('curtain'));
  c.position.set(0, 1.85, 0); c.castShadow = c.receiveShadow = true;
  g.add(c);
  return g;
}

export const MODELS = {
  bed, gurney, wheelchair, desk: deskModel, cabinet, bench, vending, iv: ivStand,
  plant, shelf, locker, chair, sink, crate, trash,
  cardiacMonitor, xrayViewer, surgicalLamp, surgeryTable, fireExtinguisher, waterDispenser, curtainDivider,
};

// =========================================================================
// PUERTA CON ROSETA, VENTANILLA DE VIDRIO ARMADO Y HERRAJES
// =========================================================================
export function doorLeaf(mat, w, h, t, isExit) {
  const g = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.01, h - 0.02, t), mat);
  leaf.castShadow = leaf.receiveShadow = true;
  leaf.position.set(w / 2, h / 2 + 0.01, 0);
  g.add(leaf);

  const b = B();
  // Chapa de pateo inferior y herrajes
  for (const s of [-1, 1]) {
    b.box(w - 0.12, 0.22, 0.008, 'brushed', w / 2, 0.14, s * (t / 2 + 0.004), { r: 0.002 });
    b.box(0.06, 0.16, 0.012, 'brushed', w - 0.14, h * 0.47, s * (t / 2 + 0.006), { r: 0.004 });
    // Palanca
    b.box(0.16, 0.022, 0.03, 'chrome', w - 0.2, h * 0.49, s * (t / 2 + 0.03), { r: 0.008 });
    b.cyl(0.014, 0.014, 0.03, 'chrome', w - 0.14, h * 0.49, s * (t / 2 + 0.02), { rx: PI / 2, seg: 10 });
  }
  // Bisagras
  for (const y of [0.35, h * 0.5, h - 0.35]) {
    b.cyl(0.014, 0.014, 0.12, 'darkMetal', 0.012, y, 0, { seg: 8 });
  }
  if (!isExit) {
    // Ventanilla: marco metálico con vidrio armado oscurecido
    const wy = h * 0.66;
    b.box(0.4, 0.6, t + 0.03, 'darkMetal', w / 2, wy, 0, { r: 0.008 });
    for (const s of [-1, 1]) b.plane(0.33, 0.53, 'doorGlass', w / 2, wy, s * (t / 2 + 0.0155), { ry: s > 0 ? 0 : PI });
  } else {
    // Barra antipánico
    b.box(w - 0.3, 0.05, 0.04, 'brushed', w / 2, h * 0.45, t / 2 + 0.04, { r: 0.012 });
    b.box(0.06, 0.1, 0.05, 'darkMetal', 0.2, h * 0.45, t / 2 + 0.03);
    b.box(0.06, 0.1, 0.05, 'darkMetal', w - 0.2, h * 0.45, t / 2 + 0.03);
  }
  g.add(b.build());
  return g;
}

// =========================================================================
// PERSONAS
// =========================================================================
const _skinCache = new Map();

/** Une geometrías de un Builder privado con materiales concretos (no compartidos). */
function limb(parent, fn) {
  const b = new Builder(m => m);
  fn(b);
  const g = b.build();
  parent.add(g);
  return g;
}

export function person(o = {}) {
  const {
    skin = '#e0b9a0', shirt = '#3b78b0', pants = '#2a2f3a', hair = 0x2a1c12, height = 1.7,
    kind = 'normal', ghost = false, longHair = false, gown = false, blood = false, hairStyle = 'short',
    badge = false, stethoscope = false, guardCap = false, scalpel = false,
  } = o;

  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);

  const clothMat = new THREE.MeshStandardMaterial({
    map: clothTexture(shirt, blood, ghost ? 0.6 : 0.25), roughness: 0.92,
    transparent: ghost, opacity: ghost ? 0.82 : 1,
    emissive: ghost ? new THREE.Color(0x182836) : new THREE.Color(0x000000),
    side: gown ? THREE.DoubleSide : THREE.FrontSide,
  });
  const pantMat = gown ? clothMat : new THREE.MeshStandardMaterial({ color: pants, roughness: 0.92, transparent: ghost, opacity: ghost ? 0.85 : 1 });
  const skinMat = new THREE.MeshStandardMaterial({
    color: skin, roughness: 0.62, transparent: ghost, opacity: ghost ? 0.88 : 1,
    emissive: ghost ? new THREE.Color(0x14202c) : new THREE.Color(0x000000),
  });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6, transparent: ghost, opacity: ghost ? 0.85 : 1 });
  const soleMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5 });
  const metalMat = M('chrome'), darkMat = M('darkMetal'), brassMat = M('brass'), rubberMat = M('rubber');
  const nurseShoes = shirt === '#d9d9d9' || shirt === '#5a8fb8' || shirt === '#f0f0eb';

  // Piernas: muslo + pantorrilla con rodilla, zapato con puntera
  const legs = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.095, 0.93, 0); body.add(pivot);
    limb(pivot, b => {
      b.capsule(0.077, 0.33, pantMat, 0, -0.27, 0, { cs: 4, seg: 10, sx: 1, sz: 1.02 });
      b.capsule(0.062, 0.34, pantMat, 0, -0.64, 0.005, { cs: 4, seg: 10 });
      b.box(0.1, 0.075, 0.26, shoeMat, 0, -0.875, 0.045, { r: 0.03, rs: 2 });
      b.sphere(0.052, shoeMat, 0, -0.86, 0.14, { seg: 10, sx: 1.0, sy: 0.7, sz: 1.0 });
      b.box(0.104, 0.02, 0.29, nurseShoes ? soleMat : rubberMat, 0, -0.915, 0.05, { r: 0.008 });
    });
    legs.push(pivot);
  }

  // Pelvis + torso con cintura, pecho y hombros
  limb(body, b => {
    b.capsule(0.17, 0.08, pantMat, 0, 0.97, 0, { sz: 0.7, cs: 4, seg: 12 });                  // cadera
    b.capsule(0.17, 0.26, clothMat, 0, 1.25, 0, { sz: 0.7, cs: 4, seg: 14 });                 // torso
    b.capsule(0.185, 0.1, clothMat, 0, 1.38, 0.005, { sz: 0.7, cs: 4, seg: 14 });             // pecho
    b.capsule(0.05, 0.34, clothMat, 0, 1.47, 0, { rz: PI / 2, cs: 4, seg: 10 });              // línea de hombros
  });
  if (gown) {
    limb(body, b => b.cyl(0.18, 0.28, 0.6, clothMat, 0, 0.78, 0, { seg: 20, open: true, sz: 0.76 }));
  } else {
    // Cuello en V y solapas
    limb(body, b => {
      b.box(0.045, 0.16, 0.012, clothMat, -0.055, 1.5, 0.125, { rz: -0.35, ry: 0.15 });
      b.box(0.045, 0.16, 0.012, clothMat, 0.055, 1.5, 0.125, { rz: 0.35, ry: -0.15 });
      b.box(0.36, 0.045, 0.24, pantMat, 0, 0.99, 0, { sz: 0.9 });                             // cinturón
    });
  }
  // Cuello
  limb(body, b => b.cyl(0.05, 0.058, 0.14, skinMat, 0, 1.6, 0, { seg: 12 }));
  limb(body, b => b.cyl(0.078, 0.09, 0.05, clothMat, 0, 1.56, 0, { seg: 14, sz: 0.9 }));

  // Brazos: hombro esférico, brazo, codo, antebrazo y mano con dedos
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.225, 1.45, 0); body.add(pivot);
    limb(pivot, b => {
      b.sphere(0.054, clothMat, 0, 0, 0, { seg: 12 });
      b.capsule(0.046, 0.22, clothMat, 0, -0.17, 0, { cs: 4, seg: 10, rx: 0.08 });
    });
    const fore = new THREE.Group(); fore.position.set(0, -0.31, 0.03); fore.rotation.x = ghost ? 0.38 : 0.24; pivot.add(fore);
    limb(fore, b => {
      b.sphere(0.047, clothMat, 0, 0, 0, { seg: 10 });
      b.capsule(0.044, 0.2, gown ? clothMat : skinMat, 0, -0.14, 0, { cs: 4, seg: 10 });
      b.capsule(0.05, 0.05, clothMat, 0, -0.04, 0, { cs: 3, seg: 10 });                       // puño
    });
    const hand = new THREE.Group(); hand.position.set(0, -0.3, 0); fore.add(hand);
    limb(hand, b => {
      b.box(0.062, 0.085, 0.032, skinMat, 0, -0.02, 0, { r: 0.012, rs: 2 });
      for (let f = 0; f < 4; f++) b.capsule(0.0095, 0.045, skinMat, -0.022 + f * 0.0148, -0.088, 0, { cs: 2, seg: 6, rx: 0.15 });
      b.capsule(0.011, 0.035, skinMat, s * 0.04, -0.03, 0.012, { cs: 2, seg: 6, rz: -s * 0.5 });
    });
    if (scalpel && s === 1) {
      const knife = new THREE.Group(); knife.position.set(0, -0.07, 0.03); knife.rotation.x = PI / 2.2; hand.add(knife);
      limb(knife, b => {
        b.box(0.016, 0.15, 0.008, brassMat, 0, -0.03, 0, { r: 0.003 });
        b.box(0.015, 0.1, 0.003, M('scalpelSteel'), 0, 0.095, 0);
        b.box(0.012, 0.012, 0.003, M('scalpelSteel'), 0, 0.15, 0, { rz: PI / 4 });
      });
    }
    arms.push(pivot);
  }

  // Cabeza
  const head = new THREE.Group(); head.position.set(0, 1.76, 0); body.add(head);
  limb(head, b => {
    b.sphere(0.12, skinMat, 0, 0, 0, { seg: 22, sx: 0.92, sy: 1.16, sz: 1.0 });
    b.sphere(0.085, skinMat, 0, -0.09, 0.02, { seg: 14, sx: 0.95, sy: 0.8, sz: 0.95 });                 // mandíbula
    for (const s of [-1, 1]) b.sphere(0.024, skinMat, s * 0.113, 0.0, -0.01, { seg: 8, sx: 0.4, sy: 1.3, sz: 0.8 });
  });
  limb(head, b => b.capsule(0.017, 0.03, skinMat, 0, -0.025, 0.122, { cs: 3, seg: 8, rx: -0.25 }));   // nariz
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTexture(skin, kind), roughness: 0.66, transparent: ghost, opacity: ghost ? 0.95 : 1, polygonOffset: true, polygonOffsetFactor: -1 });
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.1225, 24, 18, PI / 2 - 0.65, 1.3, PI / 2 - 0.58, 1.15), faceMat);
  face.scale.set(0.92, 1.16, 1.0); head.add(face);

  // Cabello
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.82, transparent: ghost, opacity: ghost ? 0.92 : 1 });
  limb(head, b => {
    const cap = new THREE.SphereGeometry(0.128, 26, 16, 0, PI * 2, 0, 1.22);
    b.geo(cap, hairMat, 0, 0.012, -0.008, { sx: 0.95, sy: 1.18, sz: 1.04, rx: -0.12 });
    const back = new THREE.SphereGeometry(0.128, 26, 12, 0, PI * 2, 1.0, 0.9);
    b.geo(back, hairMat, 0, 0.0, -0.03, { sx: 0.95, sy: 1.12, sz: 0.96 });
    b.box(0.15, 0.03, 0.05, hairMat, 0, 0.112, 0.07, { r: 0.012, rx: 0.5 });
    for (const s of [-1, 1]) b.box(0.025, 0.11, 0.045, hairMat, s * 0.1, 0.015, 0.045, { r: 0.008 });
    if (longHair || hairStyle === 'long') {
      b.capsule(0.11, 0.36, hairMat, 0, -0.16, -0.075, { cs: 4, seg: 12, sx: 1, sz: 0.8 });
      for (const s of [-1, 1]) b.capsule(0.022, 0.2, hairMat, s * 0.1, -0.08, 0.06, { cs: 3, seg: 8 });
    }
    if (hairStyle === 'bun') b.sphere(0.065, hairMat, 0, 0.07, -0.12, { seg: 12 });
    if (hairStyle === 'wild') {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * PI * 2;
        b.cyl(0.001, 0.026, 0.19, hairMat, Math.cos(a) * 0.11, 0.12, Math.sin(a) * 0.1 - 0.02, { seg: 5, rx: Math.sin(a) * 1.1, rz: -Math.cos(a) * 1.1 });
      }
    }
  });
  if (hairStyle === 'bun') {
    limb(head, b => {
      const w = M('white');
      b.box(0.12, 0.04, 0.07, w, 0, 0.145, 0.01, { r: 0.012 });
      b.box(0.085, 0.025, 0.04, w, 0, 0.172, -0.01, { r: 0.01 });
      b.box(0.022, 0.008, 0.003, M('red'), 0, 0.147, 0.047);
      b.box(0.008, 0.022, 0.003, M('red'), 0, 0.147, 0.047);
    });
  }
  if (guardCap) {
    limb(head, b => {
      b.cyl(0.128, 0.122, 0.08, darkMat, 0, 0.115, 0.0, { seg: 20 });
      b.cyl(0.13, 0.13, 0.025, darkMat, 0, 0.158, 0.0, { seg: 20, sx: 1.05 });
      b.cyl(0.13, 0.13, 0.012, rubberMat, 0, 0.09, 0.06, { seg: 14, arc: PI * 0.9, ry: PI * 0.55 + 0.0, sx: 1.0, sz: 1.15 });
      b.box(0.04, 0.04, 0.006, brassMat, 0, 0.125, 0.125, { r: 0.002 });
    });
  }

  // Accesorios del torso
  if (stethoscope) {
    limb(body, b => {
      b.torus(0.105, 0.008, rubberMat, 0, 1.5, 0.02, { arc: PI * 1.25, seg: 24, rx: PI / 2.2, rz: PI * 0.88, sz: 1.1 });
      b.cyl(0.026, 0.026, 0.014, metalMat, 0.05, 1.3, 0.14, { rx: PI / 2, seg: 14 });
      b.tube([0.0, 1.43, 0.12], [0.05, 1.31, 0.14], 0.005, rubberMat, 5);
    });
  }
  if (badge) {
    const badgeMat = new THREE.MeshStandardMaterial({ color: '#cfcab8', roughness: 0.95, metalness: 0 });
    limb(body, b => {
      b.box(0.07, 0.095, 0.006, badgeMat, 0.1, 1.36, 0.125, { r: 0.003 });
      b.box(0.02, 0.025, 0.008, darkMat, 0.1, 1.42, 0.125);
      b.box(0.05, 0.035, 0.002, M('hospitalGreen'), 0.1, 1.355, 0.129);
    });
  }
  if (guardCap) {
    limb(body, b => {
      b.box(0.4, 0.055, 0.28, rubberMat, 0, 0.99, 0, { r: 0.012, sz: 0.95 });
      b.box(0.06, 0.13, 0.05, darkMat, 0.23, 0.98, 0.05, { r: 0.01 });
      b.box(0.045, 0.045, 0.012, brassMat, 0, 0.99, 0.135, { r: 0.004 });
    });
  }

  if (ghost) {
    const glow = new THREE.PointLight(0x7fe3ff, 1.2, 3.5, 2);
    glow.position.set(0, 1.2, 0.2); root.add(glow);
  }

  root.scale.setScalar(height / 1.72);
  root.userData = { legs, arms, head, body };
  return root;
}

export const PEOPLE = {
  marta: () => person({ shirt: '#d9d9d9', pants: '#294a7a', hair: 0x5a5550, skin: '#d9b08c', height: 1.62, hairStyle: 'bun', badge: true, stethoscope: true }),
  silvia: () => person({ shirt: '#5a8fb8', pants: '#294a7a', hair: 0x1b1210, skin: '#e3bd9d', height: 1.70, hairStyle: 'long', badge: true }),
  guard: () => person({ shirt: '#1c2633', pants: '#131820', hair: 0x222222, skin: '#c89a78', height: 1.84, guardCap: true, badge: true }),
  ghostBoy: () => person({ shirt: '#c4c8c8', gown: true, ghost: true, longHair: true, hair: 0x050505, skin: '#aeb7bb', height: 1.26, kind: 'ghost', blood: true, hairStyle: 'long' }),
  brother: () => person({ shirt: '#9e9c8e', gown: true, kind: 'mad', hair: 0x282624, skin: '#b9a590', height: 1.78, blood: true, hairStyle: 'wild', scalpel: true }),
  rookie: () => person({ shirt: '#f0f0eb', pants: '#294a7a', hair: 0x3a2818, skin: '#e5be9e', height: 1.66, hairStyle: 'long', badge: true }),
};

// =========================================================================
// OBJETOS RECOGIBLES / INTERACTIVOS
// =========================================================================
export function noteMesh() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.40), new THREE.MeshStandardMaterial({ map: noteTex(), roughness: 0.95, emissive: 0x241e12 }));
  m.castShadow = true;
  g.add(m);
  g.rotation.x = -PI / 2 + 0.08;
  return g;
}

export function keyMesh() {
  const b = B();
  b.torus(0.062, 0.015, 'brass', 0, 0, 0, { seg: 24, tseg: 10 });
  b.cyl(0.012, 0.012, 0.22, 'brass', 0, -0.17, 0, { seg: 12 });
  b.box(0.055, 0.02, 0.014, 'brass', 0.03, -0.26, 0, { r: 0.004 });
  b.box(0.035, 0.016, 0.014, 'brass', 0.02, -0.22, 0, { r: 0.004 });
  b.cyl(0.02, 0.02, 0.018, 'brass', 0, -0.075, 0, { seg: 10 });
  // Etiqueta de cartulina con cordel
  b.box(0.08, 0.12, 0.003, 'white', -0.07, 0.07, 0, { rz: 0.4, r: 0.001 });
  b.curve([[-0.03, 0.05, 0], [-0.04, 0.07, 0.005], [-0.05, 0.08, 0]], 0.002, 'rubber', { segs: 6, rs: 4 });
  const g = b.build();
  g.rotation.z = PI / 2;
  const w = new THREE.Group(); w.add(g);
  return w;
}

export function flashlightMesh() {
  const b = B();
  b.cyl(0.028, 0.028, 0.24, 'darkMetal', 0, 0, 0, { seg: 16 });
  for (let k = 0; k < 6; k++) b.torus(0.029, 0.003, 'rubber', 0, -0.08 + k * 0.025, 0, { rx: PI / 2, seg: 16, tseg: 4 });
  b.cyl(0.048, 0.03, 0.07, 'chrome', 0, 0.15, 0, { seg: 20 });
  b.cyl(0.04, 0.04, 0.008, 'lampGlow', 0, 0.187, 0, { seg: 20 });
  b.cyl(0.03, 0.03, 0.02, 'darkMetal', 0, -0.13, 0, { seg: 12 });
  b.box(0.018, 0.034, 0.014, 'rubber', 0, 0.04, 0.03, { r: 0.005 });
  const g = b.build();
  g.rotation.z = PI / 2;
  const w = new THREE.Group(); w.add(g);
  return w;
}

export function batteryMesh() {
  const b = B();
  const green = new THREE.MeshStandardMaterial({ color: 0x1f8542, roughness: 0.4, metalness: 0.2 });
  b.cyl(0.036, 0.036, 0.1, green, 0, 0, 0, { seg: 18 });
  b.cyl(0.037, 0.037, 0.03, 'chrome', 0, -0.05, 0, { seg: 18 });
  b.cyl(0.017, 0.017, 0.02, 'chrome', 0, 0.06, 0, { seg: 12 });
  b.cyl(0.037, 0.037, 0.012, 'brass', 0, 0.045, 0, { seg: 18 });
  b.box(0.01, 0.05, 0.002, 'white', 0.0, 0.0, 0.037);
  return b.build();
}

export function markerMesh() {
  const b = B();
  const black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
  b.cyl(0.012, 0.012, 0.14, black, 0, 0, 0, { seg: 12 });
  b.cyl(0.014, 0.014, 0.055, 'darkMetal', 0, 0.055, 0, { seg: 12 });
  b.box(0.005, 0.045, 0.012, 'darkMetal', 0, 0.055, 0.018);
  b.cyl(0.002, 0.012, 0.018, 'rubber', 0, -0.078, 0, { seg: 10 });
  const g = b.build();
  g.rotation.z = PI / 2;
  const w = new THREE.Group(); w.add(g);
  return w;
}

export function photoMesh() {
  const t = paint(128, 160, (g, w, h) => {
    g.fillStyle = '#eae2cf'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2d2824'; g.fillRect(10, 10, w - 20, h - 40);
    g.fillStyle = '#b0947e'; g.beginPath(); g.arc(42, 54, 15, 0, PI * 2); g.fill();
    g.fillStyle = '#3a4b60'; g.fillRect(26, 72, 32, 45);
    g.fillStyle = '#8f9da2'; g.beginPath(); g.arc(86, 54, 15, 0, PI * 2); g.fill();
    g.fillStyle = '#7a8588'; g.fillRect(70, 72, 32, 45);
    g.fillStyle = 'rgba(20,20,30,0.5)'; g.beginPath(); g.arc(86, 56, 8, 0, PI * 2); g.fill();
    g.fillStyle = '#1a1814'; g.font = '10px "Special Elite", monospace';
    g.fillText('14-NOV-1984 · HNOS. V.', 14, h - 14);
  });
  const grp = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.31), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }));
  grp.add(m);
  grp.rotation.x = -PI / 2;
  return grp;
}

export function phoneMesh() {
  const b = B();
  phoneModel(b, 0, 0, 0, 0);
  return b.build();
}

// =========================================================================
// ESCALERAS
// =========================================================================
export function stairsModel(dir) {
  const b = B();
  const w = 2.6, len = 2.9;
  if (dir === 'up') {
    const n = 16, rise = 0.2, run = len / n;
    for (let i = 0; i < n; i++) {
      const h = rise * (i + 1), z = -len / 2 + run * (i + 0.5);
      b.box(w, h, run, 'concrete', 0, h / 2, z);
      b.box(w - 0.04, 0.018, 0.06, 'hazardYellow', 0, h + 0.001, z + run / 2 - 0.035);
    }
    // Barandillas inclinadas con balaustres
    for (const s of [-1, 1]) {
      const x = s * 1.26;
      b.tube([x, 1.0, -len / 2], [x, 1.0 + rise * n - 0.2, len / 2], 0.022, 'chrome');
      for (let i = 0; i <= n; i += 2) {
        const z = -len / 2 + run * i, y = rise * i;
        b.tube([x, y + 0.02, z], [x, y + 1.0 - 0.0, z], 0.011, 'metal', 6);
      }
    }
    const g = b.build();
    g.rotation.y = PI;
    return g;
  }
  // Hueco hacia abajo: abismo, bordes de seguridad, barandas
  b.plane(w, len, 'abyss', 0, 0.012, 0, { rx: -PI / 2 });
  for (const s of [-1, 1]) {
    const x = s * 1.27;
    b.tube([x, 1.0, -len / 2], [x, 1.0, len / 2], 0.022, 'chrome');
    b.tube([x, 0.55, -len / 2], [x, 0.55, len / 2], 0.014, 'chrome');
    for (let i = 0; i <= 4; i++) b.tube([x, 0.0, -len / 2 + (len / 4) * i], [x, 1.0, -len / 2 + (len / 4) * i], 0.014, 'metal', 6);
    b.box(0.05, 0.012, len, 'hazardYellow', s * 1.2, 0.013, 0);
  }
  b.box(w, 0.012, 0.05, 'hazardYellow', 0, 0.013, -len / 2 + 0.03);
  return b.build();
}
