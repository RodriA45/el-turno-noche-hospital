import * as THREE from 'three';
import { faceTexture, clothTexture, noteTex, signTexture, paint, xrayTexture, ecgTexture, cardboardBoxTexture, curtainTexture } from './Textures.js';

const mats = {};
function M(name) {
  if (mats[name]) return mats[name];
  const std = (o) => {
    const mat = new THREE.MeshStandardMaterial(o);
    mat.userData.isShared = true;
    return mat;
  };
  const defs = {
    metal: () => std({ color: 0x9fa4a8, metalness: 0.88, roughness: 0.32 }),
    chrome: () => std({ color: 0xd8dde2, metalness: 0.95, roughness: 0.15 }),
    darkMetal: () => std({ color: 0x24272a, metalness: 0.75, roughness: 0.45 }),
    brass: () => std({ color: 0xb5923b, metalness: 0.85, roughness: 0.35 }),
    paint: () => std({ color: 0xc8c6b8, roughness: 0.65 }),
    sheet: () => std({ color: 0xd2ccb8, roughness: 0.95 }),
    dirtySheet: () => std({ color: 0xb4a885, roughness: 0.95 }),
    wood: () => std({ color: 0x483220, roughness: 0.65 }),
    lightWood: () => std({ color: 0x826442, roughness: 0.6 }),
    plastic: () => std({ color: 0x3b4e56, roughness: 0.45 }),
    rubber: () => std({ color: 0x141414, roughness: 0.92 }),
    glass: () => std({ color: 0xa8c5cc, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35 }),
    screen: () => {
      const mat = new THREE.MeshBasicMaterial({ color: 0x5ee2a0 });
      mat.userData.isShared = true;
      return mat;
    },
    screenOff: () => std({ color: 0x050707, roughness: 0.15, metalness: 0.2 }),
    fabric: () => std({ color: 0x36454d, roughness: 0.95 }),
    leaf: () => std({ color: 0x384a28, roughness: 0.9 }),
    soil: () => std({ color: 0x241810, roughness: 1 }),
    cardboard: () => std({ color: 0x856942, roughness: 0.9 }),
    white: () => std({ color: 0xe6e6df, roughness: 0.5 }),
    red: () => std({ color: 0x801010, roughness: 0.7 }),
    scalpelSteel: () => std({ color: 0xe8ecf0, metalness: 0.98, roughness: 0.12 }),
    hospitalGreen: () => std({ color: 0x82a492, roughness: 0.55 }),
    porcelain: () => std({ color: 0xf4f4ec, roughness: 0.16, metalness: 0.05 }),
    leather: () => std({ color: 0x221612, roughness: 0.72 }),
    hazardYellow: () => std({ color: 0xd69e16, roughness: 0.55 }),
    curtain: () => std({ map: curtainTexture(), roughness: 0.95 }),
    bloodMat: () => std({ color: 0x540808, roughness: 0.35, metalness: 0.1 }),
    cardboardMat: () => std({ map: cardboardBoxTexture(), roughness: 0.88 }),
    xrayMat: () => {
      const mat = new THREE.MeshBasicMaterial({ map: xrayTexture() });
      mat.userData.isShared = true;
      return mat;
    },
    ecgMat: () => {
      const mat = new THREE.MeshBasicMaterial({ map: ecgTexture() });
      mat.userData.isShared = true;
      return mat;
    },
  };
  return (mats[name] = defs[name]());
}

const box = (w, h, d, mat, x = 0, y = 0, z = 0, g = null) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof mat === 'string' ? M(mat) : mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  if (g) g.add(m); return m;
};

const cyl = (r1, r2, h, mat, x = 0, y = 0, z = 0, g = null, seg = 14) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), typeof mat === 'string' ? M(mat) : mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  if (g) g.add(m); return m;
};

export const FOOT = {
  bed: [1.2, 2.3, true], gurney: [0.9, 2.2, true], wheelchair: [0.8, 1.0, true], desk: [2.5, 1.1, true],
  cabinet: [1.0, 0.7, true], bench: [2.1, 0.7, true], vending: [1.05, 0.95, true], iv: [0.35, 0.35, false],
  plant: [0.6, 0.6, true], shelf: [1.8, 0.6, true], locker: [0.95, 0.6, true], chair: [0.6, 0.6, false],
  sink: [1.5, 0.65, true], crate: [0.9, 0.9, true], trash: [0.4, 0.4, false],
  cardiacMonitor: [0.6, 0.6, true], xrayViewer: [0.75, 0.15, false], surgicalLamp: [1.2, 1.2, false],
  surgeryTable: [1.1, 2.3, true], fireExtinguisher: [0.3, 0.3, false], waterDispenser: [0.45, 0.45, true],
  curtainDivider: [2.4, 0.1, false],
};

// =========================================================================
// CAMA DE HOSPITAL REALISTA
// =========================================================================
export function bed(dirty = true) {
  const g = new THREE.Group();
  // Patas de acero cromado con ruedas giratorias
  for (const [x, z] of [[-0.52, -1.02], [0.52, -1.02], [-0.52, 1.02], [0.52, 1.02]]) {
    cyl(0.024, 0.024, 0.55, 'chrome', x, 0.32, z, g, 10);
    const w = cyl(0.055, 0.055, 0.04, 'rubber', x, 0.055, z, g, 12);
    w.rotation.z = Math.PI / 2;
    // Pedal de freno de rueda
    box(0.03, 0.015, 0.06, 'metal', x, 0.07, z + 0.03, g);
  }

  // Bastidor de acero
  box(1.08, 0.06, 2.12, 'chrome', 0, 0.58, 0, g);

  // Barandillas laterales de protección abatibles
  for (const s of [-0.55, 0.55]) {
    box(0.02, 0.02, 1.3, 'chrome', s, 0.92, 0.1, g);
    box(0.02, 0.02, 1.3, 'chrome', s, 0.78, 0.1, g);
    for (let r = -0.55; r <= 0.65; r += 0.3) {
      box(0.016, 0.16, 0.016, 'chrome', s, 0.85, r + 0.1, g);
    }
  }

  // Cabecero y piecero tubulares redondeados
  box(1.08, 0.56, 0.04, 'chrome', 0, 0.86, -1.04, g);
  box(1.08, 0.44, 0.04, 'chrome', 0, 0.80, 1.04, g);

  // Colchón clínico con hondonada
  box(1.02, 0.18, 2.04, dirty ? 'dirtySheet' : 'sheet', 0, 0.7, 0, g);

  // Almohada mullida con pliegues
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.11, 0.36), M('sheet'));
  pillow.position.set(0, 0.83, -0.74);
  pillow.rotation.x = 0.08;
  pillow.castShadow = true;
  g.add(pillow);

  // Sábana doblada realista
  const blanket = box(1.04, 0.08, 1.35, dirty ? 'dirtySheet' : 'sheet', 0, 0.81, 0.32, g);
  blanket.rotation.x = 0.02;

  return g;
}

// =========================================================================
// CAMILLA DE URGENCIAS REALISTA
// =========================================================================
export function gurney() {
  const g = new THREE.Group();
  // Chasis tijera plegable en X
  for (const s of [-0.34, 0.34]) {
    const x1 = box(0.03, 0.68, 0.03, 'metal', s, 0.42, 0, g); x1.rotation.x = 0.45;
    const x2 = box(0.03, 0.68, 0.03, 'metal', s, 0.42, 0, g); x2.rotation.x = -0.45;
    for (const z of [-0.85, 0.85]) {
      const w = cyl(0.065, 0.065, 0.045, 'rubber', s, 0.065, z, g, 12);
      w.rotation.z = Math.PI / 2;
    }
  }

  // Bandeja de acero inoxidable
  box(0.76, 0.05, 2.05, 'metal', 0, 0.78, 0, g);
  box(0.72, 0.09, 2.0, 'sheet', 0, 0.85, 0, g);

  // Silueta inquietante de cuerpo amortajado bajo la sábana
  const body = new THREE.Group();
  box(0.44, 0.22, 0.78, 'sheet', 0, 1.0, 0.18, body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), M('sheet'));
  head.position.set(0, 0.98, -0.58);
  head.scale.set(0.9, 1.1, 1.0);
  head.castShadow = true;
  body.add(head);
  box(0.38, 0.19, 0.58, 'sheet', 0, 0.94, 0.82, body);
  g.add(body);

  return g;
}

// =========================================================================
// SILLA DE RUEDAS DETALLADA
// =========================================================================
export function wheelchair() {
  const g = new THREE.Group();
  // Asiento y respaldo de vinilo negro con costuras
  box(0.54, 0.06, 0.52, 'fabric', 0, 0.52, 0, g);
  box(0.54, 0.58, 0.06, 'fabric', 0, 0.83, -0.25, g);

  // Asas traseras de empuje con empuñaduras de goma
  for (const s of [-0.24, 0.24]) {
    cyl(0.016, 0.016, 0.35, 'chrome', s, 1.12, -0.27, g, 8);
    const grip = cyl(0.022, 0.022, 0.11, 'rubber', s, 1.25, -0.27, g, 10);
    grip.rotation.x = Math.PI / 2;
  }

  // Ruedas grandes traseras con llanta y radios cromados
  for (const s of [-1, 1]) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(s * 0.32, 0.34, -0.06);

    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.022, 10, 32), M('rubber'));
    tire.rotation.y = Math.PI / 2; tire.castShadow = true; wheelGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 8, 28), M('chrome'));
    rim.rotation.y = Math.PI / 2; wheelGroup.add(rim);

    // Radios de rueda
    for (let a = 0; a < Math.PI; a += Math.PI / 6) {
      const spoke = box(0.006, 0.62, 0.006, 'chrome', 0, 0, 0, wheelGroup);
      spoke.rotation.x = a;
    }

    const hub = cyl(0.035, 0.035, 0.05, 'chrome', 0, 0, 0, wheelGroup, 10);
    hub.rotation.z = Math.PI / 2;
    g.add(wheelGroup);

    // Reposabrazos acolchados
    box(0.06, 0.04, 0.42, 'rubber', s * 0.28, 0.68, 0.02, g);
    box(0.02, 0.18, 0.02, 'chrome', s * 0.28, 0.58, -0.15, g);
    box(0.02, 0.18, 0.02, 'chrome', s * 0.28, 0.58, 0.18, g);

    // Ruedas delanteras giratorias
    const fork = cyl(0.014, 0.014, 0.22, 'chrome', s * 0.22, 0.18, 0.38, g, 8);
    const sw = cyl(0.07, 0.07, 0.04, 'rubber', s * 0.22, 0.07, 0.38, g, 12);
    sw.rotation.z = Math.PI / 2;

    // Reposapiés metálicos
    box(0.14, 0.02, 0.16, 'darkMetal', s * 0.16, 0.14, 0.52, g);
    box(0.02, 0.32, 0.02, 'chrome', s * 0.22, 0.28, 0.44, g).rotation.x = -0.55;
  }

  return g;
}

// =========================================================================
// MOSTRADOR DE RECEPCIÓN ULTRA DETALLADO CON CRT, TELÉFONO Y EXPEDIENTES
// =========================================================================
export function deskModel({ len = 2.4, small = false } = {}) {
  const g = new THREE.Group();
  const h = small ? 0.76 : 1.12;

  // Cuerpo del mueble de madera de nogal barnizada con zócalo
  box(len, h, 0.88, 'wood', 0, h / 2, 0, g);
  // Molduras decorativas horizontales
  box(len + 0.02, 0.03, 0.90, 'darkMetal', 0, h * 0.5, 0, g);
  // Encimera principal de madera pulida con esquinas biseladas
  box(len + 0.14, 0.07, 1.02, 'lightWood', 0, h + 0.035, 0, g);

  if (!small) {
    // Columnas metálicas esbeltas de soporte para el mostrador de recepción
    const postY = h + 0.38;
    const postMat = 'chrome';
    cyl(0.024, 0.024, 0.76, postMat, -len / 2 + 0.12, postY, -0.44, g, 10);
    cyl(0.024, 0.024, 0.76, postMat, len / 2 - 0.12, postY, -0.44, g, 10);
    cyl(0.024, 0.024, 0.76, postMat, -1.9, postY, -0.44, g, 10);
    cyl(0.024, 0.024, 0.76, postMat, 1.9, postY, -0.44, g, 10);

    // Viga superior horizontal de latón pulido
    box(len, 0.04, 0.06, 'brass', 0, h + 0.76, -0.44, g);

    // Mamparas de cristal de seguridad en los laterales (dejando el centro de 3.8m COMPLETAMENTE DESPEJADO para hablar y ver claramente a los personajes)
    const wingW = Math.max(0.4, (len - 3.8) / 2);
    const wingX = len / 2 - wingW / 2;
    // Cristal izquierdo
    const paneL = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.68, 0.015), M('glass'));
    paneL.position.set(-wingX, h + 0.38, -0.44); g.add(paneL);
    // Cristal derecho
    const paneR = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.68, 0.015), M('glass'));
    paneR.position.set(wingX, h + 0.38, -0.44); g.add(paneR);

    // Mostrador frontal elevado para visitantes con borde biselado
    box(len + 0.12, 0.05, 0.28, 'lightWood', 0, h + 0.08, -0.56, g);

    // Lámpara de escritorio articulada de latón con luz cálida
    const lamp = new THREE.Group();
    lamp.position.set(0.65, h + 0.07, 0.2);
    cyl(0.09, 0.09, 0.02, 'brass', 0, 0.01, 0, lamp);
    cyl(0.012, 0.012, 0.35, 'brass', 0, 0.18, 0, lamp);
    const shade = cyl(0.08, 0.14, 0.12, 'brass', 0, 0.38, 0.05, lamp);
    shade.rotation.x = 0.4;
    const bulb = new THREE.PointLight(0xffe2aa, 4.5, 4.2, 1.8);
    bulb.position.set(0, 0.35, 0.08);
    lamp.add(bulb);
    g.add(lamp);
  }

  // Monitores CRT de tubo retro
  const n = small ? 1 : 2;
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? -len * 0.25 : (-len / 4 + i * (len / 2));
    const zz = small ? 0.05 : 0.15;
    const yy = h + 0.07;

    // Carcasa beige de monitor CRT de los años 80/90 con bisel curvado
    const crt = new THREE.Group();
    crt.position.set(x, yy, zz);

    box(0.52, 0.44, 0.42, 'paint', 0, 0.22, 0, crt);
    // Ranuras traseras de ventilación
    for (let sl = 0.05; sl < 0.38; sl += 0.06) {
      box(0.38, 0.015, 0.02, 'darkMetal', 0, sl, -0.21, crt);
    }

    // Pantalla de fósforo verde con curva convexa
    const scrGeo = new THREE.PlaneGeometry(0.42, 0.33, 4, 4);
    const scr = new THREE.Mesh(scrGeo, i === 1 && !small ? M('screenOff') : M('screen'));
    scr.position.set(0, 0.23, 0.211);
    crt.add(scr);

    // Botones frontales del monitor y LED indicador
    box(0.04, 0.02, 0.02, 'darkMetal', 0.16, 0.04, 0.215, crt);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.015), new THREE.MeshBasicMaterial({ color: 0x44ff66 }));
    led.position.set(0.12, 0.04, 0.216); crt.add(led);

    // Base giratoria del monitor
    box(0.24, 0.04, 0.24, 'paint', 0, 0.02, 0, crt);

    // Teclado con teclas individuales y cable
    const kb = new THREE.Group();
    kb.position.set(0, 0, 0.36);
    box(0.44, 0.028, 0.16, 'paint', 0, 0.014, 0, kb);
    // Bloques de teclas
    box(0.38, 0.015, 0.12, 'darkMetal', 0, 0.03, 0, kb);
    // Barra espaciadora
    box(0.14, 0.02, 0.02, 'paint', 0, 0.032, 0.05, kb);
    crt.add(kb);

    g.add(crt);
  }

  // Teléfono analógico con cable helicoidal
  const phone = new THREE.Group();
  phone.position.set(len / 2 - 0.36, h + 0.07, 0.22);
  box(0.24, 0.07, 0.22, 'darkMetal', 0, 0.035, 0, phone);
  // Teclado numérico del teléfono
  box(0.12, 0.015, 0.12, 'paint', -0.04, 0.075, 0.02, phone);
  // Auricular
  box(0.06, 0.05, 0.24, 'darkMetal', 0.06, 0.09, 0, phone);
  g.add(phone);

  // Libreta de guardia y expedientes en el mostrador
  const clipboard = new THREE.Group();
  clipboard.position.set(-len / 2 + 0.42, h + 0.07, 0.26);
  box(0.28, 0.02, 0.36, 'wood', 0, 0.01, 0, clipboard);
  box(0.24, 0.005, 0.32, 'sheet', 0, 0.02, 0.01, clipboard);
  box(0.10, 0.025, 0.04, 'metal', 0, 0.025, -0.15, clipboard); // Clip metálico
  clipboard.rotation.y = 0.25;
  g.add(clipboard);

  // Lapicero cilíndrico con bolígrafos y el hueco vacío del marcador robado
  const penCup = new THREE.Group();
  penCup.position.set(0.28, h + 0.07, 0.32);
  cyl(0.045, 0.04, 0.11, 'plastic', 0, 0.055, 0, penCup, 12);
  // Bolígrafos azules y rojos
  cyl(0.006, 0.006, 0.14, 'darkMetal', -0.015, 0.1, 0.01, penCup, 6).rotation.z = 0.15;
  cyl(0.006, 0.006, 0.14, 'red', 0.018, 0.1, -0.01, penCup, 6).rotation.z = -0.2;
  // Mancha circular de tinta negra donde estaba apoyado el felpón robado
  const inkStain = new THREE.Mesh(new THREE.CircleGeometry(0.025, 12), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  inkStain.rotation.x = -Math.PI / 2;
  inkStain.position.set(0.08, 0.002, 0);
  penCup.add(inkStain);
  g.add(penCup);

  // Taza de café con poso oscuro
  const mug = new THREE.Group();
  mug.position.set(-0.28, h + 0.07, 0.34);
  cyl(0.04, 0.038, 0.09, 'white', 0, 0.045, 0, mug, 12);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.034, 12), new THREE.MeshStandardMaterial({ color: 0x221208, roughness: 0.1 }));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.set(0, 0.075, 0);
  mug.add(coffee);
  g.add(mug);

  return g;
}

// =========================================================================
// ARMARIO CLÍNICO Y ESTANTERÍAS
// =========================================================================
export function cabinet() {
  const g = new THREE.Group();
  // Cuerpo metálico
  box(0.95, 1.9, 0.65, 'metal', 0, 0.95, 0, g);
  // Puertas de cristal con marco metálico
  for (const s of [-0.23, 0.23]) {
    box(0.44, 1.75, 0.03, 'metal', s, 0.95, 0.32, g);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.45), M('glass'));
    glass.position.set(s, 0.95, 0.34); g.add(glass);
    box(0.03, 0.12, 0.04, 'chrome', s + (s > 0 ? -0.16 : 0.16), 0.95, 0.35, g); // Tirador
  }
  // Frascos de medicamentos y gasas en los estantes interiores
  for (let y = 0.5; y < 1.6; y += 0.38) {
    box(0.85, 0.02, 0.55, 'metal', 0, y, 0, g);
    for (let b = -0.3; b <= 0.3; b += 0.15) {
      cyl(0.03, 0.03, 0.09, 'glass', b, y + 0.05, 0.1, g, 8);
    }
  }
  return g;
}

export function bench() {
  const g = new THREE.Group();
  box(2.1, 0.06, 0.55, 'plastic', 0, 0.46, 0, g);
  box(2.1, 0.48, 0.06, 'plastic', 0, 0.78, -0.24, g);
  for (const x of [-0.96, 0, 0.96]) {
    box(0.05, 0.46, 0.05, 'metal', x, 0.23, 0.12, g);
    box(0.05, 0.46, 0.05, 'metal', x, 0.23, -0.22, g);
  }
  return g;
}

export function vending() {
  const g = new THREE.Group();
  box(1.08, 1.95, 0.85, 'darkMetal', 0, 0.975, 0, g);
  const tex = paint(256, 512, (c, w, h) => {
    c.fillStyle = '#141c26'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#d43f3a'; c.fillRect(0, 0, w, 44);
    c.fillStyle = '#fff'; c.font = 'bold 22px sans-serif'; c.fillText('REFRESCOS', 24, 30);
    for (let y = 60; y < 340; y += 58) {
      for (let x = 18; x < 230; x += 44) {
        c.fillStyle = ['#c0392b', '#e67e22', '#2980b9', '#27ae60'][Math.floor(Math.random() * 4)];
        c.fillRect(x, y, 28, 42);
      }
    }
    c.fillStyle = '#080808'; c.fillRect(30, 390, 196, 70);
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.7), new THREE.MeshBasicMaterial({ map: tex }));
  front.position.set(0, 1.0, 0.43); g.add(front);
  const l = new THREE.PointLight(0xa5d8ff, 1.4, 4.5, 2); l.position.set(0, 1.2, 0.7); g.add(l);
  return g;
}

export function ivStand() {
  const g = new THREE.Group();
  cyl(0.016, 0.016, 1.9, 'chrome', 0, 0.95, 0, g, 8);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const leg = box(0.24, 0.02, 0.02, 'chrome', Math.cos(a) * 0.12, 0.06, Math.sin(a) * 0.12, g);
    leg.rotation.y = -a;
    cyl(0.03, 0.03, 0.03, 'rubber', Math.cos(a) * 0.22, 0.03, Math.sin(a) * 0.22, g, 8);
  }
  // Ganchos superiores y bolsa de suero fisiológico transparente
  box(0.26, 0.015, 0.015, 'chrome', 0, 1.88, 0, g);
  const bag = box(0.12, 0.22, 0.04, 'glass', 0.07, 1.72, 0, g);
  // Tubo de goteo transparente que baja
  cyl(0.005, 0.005, 0.8, 'glass', 0.07, 1.28, 0, g, 6);
  return g;
}

export function plant() {
  const g = new THREE.Group();
  cyl(0.25, 0.18, 0.45, 'paint', 0, 0.22, 0, g, 12);
  cyl(0.22, 0.22, 0.04, 'soil', 0, 0.42, 0, g, 12);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 4), M('leaf'));
    leaf.position.set(Math.cos(a) * 0.1, 0.65, Math.sin(a) * 0.1);
    leaf.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55);
    leaf.castShadow = true; g.add(leaf);
  }
  return g;
}

export function shelf() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.85, -0.22], [0.85, -0.22], [-0.85, 0.22], [0.85, 0.22]]) {
    cyl(0.018, 0.018, 1.8, 'metal', x, 0.9, z, g, 8);
  }
  for (let y = 0.2; y <= 1.8; y += 0.4) {
    box(1.75, 0.03, 0.5, 'metal', 0, y, 0, g);
    for (let b = -0.65; b <= 0.65; b += 0.32) {
      box(0.22, 0.24, 0.35, 'cardboard', b, y + 0.13, 0, g);
    }
  }
  return g;
}

export function locker() {
  const g = new THREE.Group();
  box(0.9, 1.8, 0.55, 'darkMetal', 0, 0.9, 0, g);
  for (let i = 0; i < 3; i++) {
    const x = -0.3 + i * 0.3;
    box(0.26, 1.7, 0.02, 'paint', x, 0.9, 0.28, g);
    box(0.02, 0.1, 0.03, 'chrome', x + 0.1, 0.9, 0.3, g);
    // Ranuras de ventilación
    box(0.18, 0.015, 0.01, 'darkMetal', x, 1.6, 0.29, g);
    box(0.18, 0.015, 0.01, 'darkMetal', x, 1.55, 0.29, g);
  }
  return g;
}

export function chair() {
  const g = new THREE.Group();
  // Silla de oficina giratoria ergonómica con base estrella de 5 ruedas
  for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 5) {
    const leg = box(0.24, 0.025, 0.035, 'darkMetal', Math.cos(a) * 0.12, 0.06, Math.sin(a) * 0.12, g);
    leg.rotation.y = -a;
    const w = cyl(0.025, 0.025, 0.025, 'rubber', Math.cos(a) * 0.23, 0.025, Math.sin(a) * 0.23, g, 8);
    w.rotation.z = Math.PI / 2;
  }
  // Columna telescópica hidráulica de gas
  cyl(0.028, 0.028, 0.38, 'chrome', 0, 0.24, 0, g, 10);
  cyl(0.045, 0.045, 0.12, 'darkMetal', 0, 0.16, 0, g, 10);
  // Asiento acolchado contorneado
  box(0.48, 0.07, 0.46, 'fabric', 0, 0.46, 0.02, g);
  // Respaldo ergonómico con soporte lumbar
  box(0.44, 0.48, 0.06, 'fabric', 0, 0.76, -0.21, g);
  box(0.04, 0.32, 0.04, 'darkMetal', 0, 0.52, -0.16, g); // Soporte trasero
  // Reposabrazos curvados
  for (const s of [-0.26, 0.26]) {
    box(0.04, 0.22, 0.03, 'darkMetal', s, 0.58, 0, g);
    box(0.06, 0.03, 0.26, 'plastic', s, 0.69, 0.04, g);
  }
  return g;
}

export function sink() {
  const g = new THREE.Group();
  // Lavabo de porcelana vitrificada con mueble bajo
  box(1.3, 0.78, 0.52, 'hospitalGreen', 0, 0.39, 0, g);
  box(1.4, 0.14, 0.58, 'porcelain', 0, 0.85, 0, g);
  for (const x of [-0.35, 0.35]) {
    // Seno cerámico cóncavo
    cyl(0.20, 0.14, 0.12, 'porcelain', x, 0.88, 0.04, g, 12);
    // Grifo quirúrgico monomando de codo cromado
    cyl(0.016, 0.016, 0.24, 'chrome', x, 1.05, -0.18, g, 8);
    box(0.02, 0.015, 0.12, 'chrome', x, 1.16, -0.12, g);
    // Palanca de codo para cirujanos
    box(0.015, 0.015, 0.14, 'chrome', x, 1.12, -0.22, g).rotation.x = -0.3;
    // Dispensador de jabón antiséptico
    box(0.07, 0.14, 0.07, 'white', x + 0.22, 1.08, -0.20, g);
    box(0.012, 0.012, 0.05, 'chrome', x + 0.22, 1.13, -0.16, g);
  }
  // Espejo clínico con marco biselado
  box(1.4, 0.86, 0.02, 'metal', 0, 1.62, -0.27, g);
  const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.78), new THREE.MeshStandardMaterial({ color: 0x98b8c2, metalness: 0.94, roughness: 0.08 }));
  mirrorGlass.position.set(0, 1.62, -0.255);
  g.add(mirrorGlass);
  return g;
}

export function crate() {
  const g = new THREE.Group();
  // Caja de transporte de madera reforzada
  box(0.85, 0.55, 0.85, 'wood', 0, 0.275, 0, g);
  // Listones perimetrales de refuerzo
  box(0.87, 0.08, 0.87, 'darkMetal', 0, 0.52, 0, g);
  box(0.87, 0.08, 0.87, 'darkMetal', 0, 0.04, 0, g);
  // Caja de cartón de suministros médicos apilada arriba con textura
  const topBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.44, 0.65), M('cardboardMat'));
  topBox.position.set(0.06, 0.77, 0.02);
  topBox.rotation.y = 0.28;
  topBox.castShadow = topBox.receiveShadow = true;
  g.add(topBox);
  return g;
}

export function trash() {
  const g = new THREE.Group();
  // Cubo de residuos hospitalarios con pedal
  cyl(0.18, 0.16, 0.52, 'chrome', 0, 0.26, 0, g, 14);
  // Tapa superior con bisagra
  cyl(0.185, 0.185, 0.02, 'metal', 0, 0.53, 0, g, 14);
  // Pedal de apertura cromado
  box(0.08, 0.02, 0.12, 'chrome', 0, 0.02, 0.19, g);
  // Aro de base de goma antideslizante
  cyl(0.175, 0.175, 0.02, 'rubber', 0, 0.01, 0, g, 14);
  return g;
}

// =========================================================================
// NUEVOS ELEMENTOS MÉDICOS Y DE QUIRÓFANO AAA
// =========================================================================

export function cardiacMonitor() {
  const g = new THREE.Group();
  // Carro móvil de 4 ruedas
  for (const [x, z] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
    const w = cyl(0.035, 0.035, 0.025, 'rubber', x, 0.035, z, g, 10);
    w.rotation.z = Math.PI / 2;
    cyl(0.012, 0.012, 0.25, 'chrome', x, 0.16, z, g, 8);
  }
  // Bandeja inferior para cables y accesorios
  box(0.52, 0.03, 0.52, 'hospitalGreen', 0, 0.28, 0, g);
  // Columnas de soporte tubulares
  for (const x of [-0.22, 0.22]) {
    cyl(0.016, 0.016, 0.65, 'chrome', x, 0.62, 0, g, 8);
  }
  // Módulo principal del monitor
  box(0.56, 0.38, 0.42, 'paint', 0, 1.05, 0, g);
  // Pantalla con trazado ECG verde brillante
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.28), M('ecgMat'));
  scr.position.set(0, 1.06, 0.212);
  g.add(scr);
  // Botonera y selector rotativo
  box(0.08, 0.02, 0.02, 'darkMetal', -0.16, 0.90, 0.215, g);
  cyl(0.02, 0.02, 0.02, 'darkMetal', 0.16, 0.90, 0.215, g).rotation.x = Math.PI / 2;
  // Luz LED de pulso
  const pulseLed = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.015), new THREE.MeshBasicMaterial({ color: 0x44ff66 }));
  pulseLed.position.set(0.16, 1.20, 0.215); g.add(pulseLed);
  // Cables de paciente colgando por el lateral
  cyl(0.006, 0.006, 0.55, 'rubber', -0.26, 0.75, 0.08, g, 6);
  return g;
}

export function xrayViewer() {
  const g = new THREE.Group();
  // Marco de aluminio de perfil delgado montado en pared
  box(0.68, 0.88, 0.06, 'chrome', 0, 1.8, 0, g);
  // Panel acrílico retroiluminado con radiografía
  const rad = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.78), M('xrayMat'));
  rad.position.set(0, 1.8, 0.032);
  g.add(rad);
  // Pinzas superiores de sujeción
  box(0.12, 0.02, 0.02, 'chrome', -0.16, 2.21, 0.038, g);
  box(0.12, 0.02, 0.02, 'chrome', 0.16, 2.21, 0.038, g);
  // Interruptor basculante lateral
  box(0.015, 0.04, 0.02, 'red', 0.345, 1.45, 0, g);
  // Luz suave clínica emanada por la pantalla
  const l = new THREE.PointLight(0xb4d8ff, 1.2, 3.2, 1.8);
  l.position.set(0, 1.8, 0.25);
  g.add(l);
  return g;
}

export function surgicalLamp() {
  const g = new THREE.Group();
  // Anclaje a techo
  cyl(0.18, 0.18, 0.06, 'chrome', 0, 3.26, 0, g, 14);
  cyl(0.03, 0.03, 0.35, 'chrome', 0, 3.08, 0, g, 10);
  // Brazo articulado horizontal y oblicuo
  box(0.04, 0.04, 0.85, 'chrome', 0, 2.92, 0.38, g);
  box(0.03, 0.45, 0.03, 'chrome', 0, 2.70, 0.75, g).rotation.x = 0.3;
  // Cúpulas reflectoras gemelas con difusor
  for (const s of [-0.35, 0.35]) {
    const domeGroup = new THREE.Group();
    domeGroup.position.set(s, 2.45, 0.82);
    // Campana reflectora exterior cóncava
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), M('chrome'));
    dome.rotation.x = Math.PI; dome.castShadow = true; domeGroup.add(dome);
    // Asa central esterilizable para el cirujano
    cyl(0.015, 0.015, 0.12, 'chrome', 0, -0.06, 0, domeGroup, 8);
    // Foco emisor
    const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), new THREE.MeshBasicMaterial({ color: 0xfffcf0 }));
    bulb.position.set(0, 0.02, 0); domeGroup.add(bulb);
    g.add(domeGroup);
  }
  // Haz concentrado de quirófano hacia la mesa
  const spot = new THREE.SpotLight(0xfffaea, 28, 8, Math.PI / 6, 0.5, 1.5);
  spot.position.set(0, 2.45, 0.82);
  spot.target.position.set(0, 0.8, 0.82);
  g.add(spot, spot.target);
  return g;
}

export function surgeryTable() {
  const g = new THREE.Group();
  // Pedestal hidráulico central de acero inoxidable pesado
  box(0.65, 0.12, 0.95, 'metal', 0, 0.06, 0, g);
  cyl(0.18, 0.22, 0.65, 'chrome', 0, 0.42, 0, g, 14);
  // Pedales de inclinación y altura
  box(0.08, 0.03, 0.12, 'darkMetal', 0.28, 0.08, 0.15, g);
  box(0.08, 0.03, 0.12, 'darkMetal', 0.28, 0.08, -0.15, g);
  // Estructura articulada del plano quirúrgico
  box(0.72, 0.08, 2.15, 'chrome', 0, 0.78, 0, g);
  // Rieles laterales para accesorios
  for (const s of [-0.38, 0.38]) {
    box(0.018, 0.025, 1.9, 'chrome', s, 0.79, 0, g);
  }
  // Colchoneta conductora antiestática negra (4 secciones)
  box(0.68, 0.08, 0.45, 'leather', 0, 0.85, -0.80, g);
  box(0.68, 0.08, 0.65, 'leather', 0, 0.85, -0.22, g);
  box(0.68, 0.08, 0.45, 'leather', 0, 0.85, 0.35, g);
  box(0.68, 0.08, 0.55, 'leather', 0, 0.85, 0.86, g);
  // Reposabrazos articulados bilaterales
  for (const s of [-0.48, 0.48]) {
    box(0.16, 0.04, 0.55, 'leather', s, 0.84, -0.2, g);
    box(0.02, 0.12, 0.02, 'chrome', s * 0.85, 0.76, -0.2, g);
  }
  // Correas de sujeción de seguridad de cuero
  box(0.70, 0.015, 0.06, 'darkMetal', 0, 0.89, -0.15, g);
  box(0.70, 0.015, 0.06, 'darkMetal', 0, 0.89, 0.55, g);
  return g;
}

export function fireExtinguisher() {
  const g = new THREE.Group();
  // Cilindro rojo presurizado colgado en pared
  cyl(0.09, 0.09, 0.52, 'red', 0, 1.45, 0, g, 12);
  cyl(0.085, 0.04, 0.08, 'red', 0, 1.74, 0, g, 12);
  // Válvula de latón y manómetro
  cyl(0.025, 0.025, 0.08, 'brass', 0, 1.80, 0, g, 8);
  box(0.08, 0.04, 0.02, 'metal', 0, 1.82, 0, g);
  cyl(0.018, 0.018, 0.012, 'metal', 0.035, 1.82, 0.03, g, 8);
  // Manguera de descarga de goma
  cyl(0.012, 0.012, 0.42, 'rubber', 0.08, 1.55, 0.05, g, 6);
  // Soporte de anclaje a pared
  box(0.04, 0.35, 0.02, 'darkMetal', 0, 1.50, -0.09, g);
  return g;
}

export function waterDispenser() {
  const g = new THREE.Group();
  // Carcasa de pie blanca
  box(0.38, 0.95, 0.38, 'white', 0, 0.475, 0, g);
  // Rejilla de goteo
  box(0.28, 0.02, 0.16, 'darkMetal', 0, 0.68, 0.14, g);
  // Grifos de agua fría y caliente
  box(0.03, 0.06, 0.04, 'red', -0.06, 0.74, 0.16, g);
  box(0.03, 0.06, 0.04, 'screen', 0.06, 0.74, 0.16, g);
  // Botellón de 20 litros translúcido azul
  cyl(0.14, 0.15, 0.42, 'glass', 0, 1.20, 0, g, 14);
  cyl(0.06, 0.14, 0.12, 'glass', 0, 1.01, 0, g, 12);
  // Dispensador cilíndrico de vasos cónicos
  cyl(0.045, 0.045, 0.45, 'glass', -0.22, 0.85, 0, g, 10);
  cyl(0.04, 0.04, 0.25, 'white', -0.22, 0.76, 0, g, 10);
  return g;
}

export function curtainDivider() {
  const g = new THREE.Group();
  // Riel de aluminio anclado al techo
  box(2.4, 0.03, 0.03, 'chrome', 0, 3.25, 0, g);
  for (const x of [-1.1, 0, 1.1]) {
    cyl(0.008, 0.008, 0.25, 'chrome', x, 3.12, 0, g, 6);
  }
  // Malla superior de ventilación
  box(2.35, 0.35, 0.015, 'dirtySheet', 0, 2.82, 0, g);
  // Cortina de privacidad plisada
  const c = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 2.1), M('curtain'));
  c.position.set(0, 1.6, 0); c.castShadow = c.receiveShadow = true;
  g.add(c);
  const cBack = c.clone(); cBack.rotation.y = Math.PI; g.add(cBack);
  return g;
}

export const MODELS = {
  bed, gurney, wheelchair, desk: deskModel, cabinet, bench, vending, iv: ivStand,
  plant, shelf, locker, chair, sink, crate, trash,
  cardiacMonitor, xrayViewer, surgicalLamp, surgeryTable, fireExtinguisher, waterDispenser, curtainDivider
};

// =========================================================================
// PUERTA CON MARCO Y CRISTAL REFORZADO
// =========================================================================
export function doorLeaf(mat, w, h, t, isExit) {
  const g = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(w, h, t), mat);
  leaf.castShadow = leaf.receiveShadow = true;
  leaf.position.set(w / 2, h / 2, 0);
  g.add(leaf);

  if (!isExit) {
    // Ventanilla con vidrio armado con alambre
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.58, t + 0.02), M('darkMetal'));
    winFrame.position.set(w / 2, h * 0.68, 0); g.add(winFrame);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.54), M('glass'));
    win.position.set(w / 2, h * 0.68, t / 2 + 0.012); g.add(win);
    const win2 = win.clone(); win2.position.z = -t / 2 - 0.012; win2.rotation.y = Math.PI; g.add(win2);
  }

  // Picaporte metálico con roseta
  const handleMat = M('chrome');
  for (const s of [1, -1]) {
    const escutcheon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.01), handleMat);
    escutcheon.position.set(w - 0.16, h * 0.47, s * (t / 2 + 0.006)); g.add(escutcheon);
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.035), handleMat);
    lever.position.set(w - 0.21, h * 0.49, s * (t / 2 + 0.035)); g.add(lever);
  }
  return g;
}

// =========================================================================
// MODELO HUMANOIDE REALISTA (RECEPCIONISTAS, GUARDIA, FANTASMA, ASESINO)
// =========================================================================
export function person(o = {}) {
  const {
    skin = '#e0b9a0', shirt = '#3b78b0', pants = '#2a2f3a', hair = 0x2a1c12, height = 1.7,
    kind = 'normal', ghost = false, longHair = false, gown = false, blood = false, hairStyle = 'short',
    badge = false, stethoscope = false, guardCap = false, scalpel = false,
  } = o;

  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);

  const clothMat = new THREE.MeshStandardMaterial({
    map: clothTexture(shirt, blood, ghost ? 0.6 : 0.25),
    roughness: 0.92,
    transparent: ghost,
    opacity: ghost ? 0.82 : 1,
    emissive: ghost ? new THREE.Color(0x182836) : new THREE.Color(0x000000),
  });

  const pantMat = gown ? clothMat : new THREE.MeshStandardMaterial({ color: pants, roughness: 0.95 });
  const skinMat = new THREE.MeshStandardMaterial({
    color: skin,
    roughness: 0.68,
    transparent: ghost,
    opacity: ghost ? 0.88 : 1,
    emissive: ghost ? new THREE.Color(0x14202c) : new THREE.Color(0x000000),
  });

  const mk = (geo, mat, x, y, z, parent = body) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = !ghost;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // Piernas y calzado clínico
  const legs = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.10, 0.92, 0);
    body.add(pivot);

    // Muslo y pantorrilla con volumen anatómico
    mk(new THREE.CapsuleGeometry(0.08, 0.70, 6, 10), pantMat, 0, -0.44, 0, pivot);

    // Calzado hospitalario / borcegos con suela
    const shoe = mk(new THREE.BoxGeometry(0.12, 0.08, 0.25), new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 }), 0, -0.89, 0.04, pivot);
    // Suela blanca de zueco clínico para las enfermeras
    if (shirt === '#d9d9d9' || shirt === '#5a8fb8') {
      mk(new THREE.BoxGeometry(0.124, 0.025, 0.26), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), 0, -0.92, 0.04, pivot);
    }
    legs.push(pivot);
  }

  // Torso esculpido con chaqueta / guardapolvo
  const torso = mk(new THREE.CapsuleGeometry(0.18, 0.44, 6, 12), clothMat, 0, 1.24, 0);
  torso.scale.z = 0.72;

  // Si tiene bata de paciente abierta por detrás
  if (gown) {
    const skirt = mk(new THREE.CylinderGeometry(0.19, 0.29, 0.60, 14, 1, true), clothMat, 0, 0.84, 0);
    skirt.scale.z = 0.75;
  }

  // Cuello anatómico
  mk(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 10), skinMat, 0, 1.62, 0);

  // Brazos articulados con hombreras, antebrazos y manos con dedos modelados
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.25, 1.48, 0);
    body.add(pivot);

    // Hombro y brazo
    mk(new THREE.CapsuleGeometry(0.06, 0.52, 6, 10), clothMat, 0, -0.3, 0, pivot);

    // Mano esculpida
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.64, 0);
    mk(new THREE.BoxGeometry(0.07, 0.09, 0.035), skinMat, 0, 0, 0, handGroup);
    // Pulgar
    const thumb = mk(new THREE.BoxGeometry(0.025, 0.04, 0.025), skinMat, s * 0.042, 0.01, 0.015, handGroup);
    thumb.rotation.z = -s * 0.4;
    pivot.add(handGroup);

    // Si tiene bisturí en la mano derecha
    if (scalpel && s === 1) {
      const knife = new THREE.Group();
      knife.position.set(0, -0.05, 0.08);
      knife.rotation.x = Math.PI / 2.5;
      // Mango metálico con remaches
      box(0.02, 0.16, 0.008, 'brass', 0, -0.04, 0, knife);
      // Hoja de bisturí afilada y ensangrentada
      const blade = box(0.018, 0.14, 0.004, 'scalpelSteel', 0, 0.1, 0, knife);
      // Filo biselado
      knife.scale.set(1, 1, 1);
      handGroup.add(knife);
    }

    arms.push(pivot);
  }

  // Cabeza con volumen craneal y orejas
  const head = new THREE.Group();
  head.position.set(0, 1.76, 0);
  body.add(head);

  // Cráneo
  const skull = mk(new THREE.SphereGeometry(0.12, 22, 18), skinMat, 0, 0, 0, head);
  skull.scale.set(0.92, 1.16, 1.0);

  // Orejas
  for (const s of [-1, 1]) {
    const ear = mk(new THREE.BoxGeometry(0.015, 0.045, 0.025), skinMat, s * 0.114, 0.01, -0.01, head);
    ear.rotation.y = s * 0.2;
  }

  // Rostro detallado en alta resolución
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTexture(skin, kind),
    roughness: 0.68,
    transparent: ghost,
    opacity: ghost ? 0.95 : 1,
  });
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.122, 22, 18, Math.PI / 2 - 0.65, 1.3, Math.PI / 2 - 0.58, 1.15), faceMat);
  face.scale.set(0.92, 1.16, 1.0);
  head.add(face);

  // Nariz modelada en 3D
  const nose = mk(new THREE.ConeGeometry(0.018, 0.05, 4), skinMat, 0, -0.01, 0.126, head);
  nose.rotation.x = -Math.PI / 2;

  // Cabello con peinado tridimensional
  const hairMat = new THREE.MeshStandardMaterial({
    color: hair,
    roughness: 0.88,
    transparent: ghost,
    opacity: ghost ? 0.92 : 1,
  });
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.128, 20, 16, 0, Math.PI * 2, 0, 1.7), hairMat);
  hairCap.scale.set(0.94, 1.18, 1.04);
  hairCap.position.y = 0.014;
  hairCap.rotation.x = -0.14;
  head.add(hairCap);

  if (longHair || hairStyle === 'long') {
    // Melena que cae por la espalda
    mk(new THREE.CapsuleGeometry(0.11, 0.38, 4, 10), hairMat, 0, -0.16, -0.08, head);
    // Mechones laterales
    mk(new THREE.BoxGeometry(0.035, 0.22, 0.02), hairMat, -0.09, -0.06, 0.08, head);
    mk(new THREE.BoxGeometry(0.035, 0.22, 0.02), hairMat, 0.09, -0.06, 0.08, head);
  }

  if (hairStyle === 'bun') {
    // Rodete de enfermera recogido detrás
    const bun = mk(new THREE.SphereGeometry(0.065, 12, 10), hairMat, 0, 0.06, -0.12, head);
  }

  if (hairStyle === 'wild') {
    // Pelo desgreñado y alborotado del hermano recluido
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const strand = mk(new THREE.ConeGeometry(0.028, 0.18, 4), hairMat, Math.cos(a) * 0.11, 0.11, Math.sin(a) * 0.1 - 0.02, head);
      strand.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
    }
  }

  // Estetoscopio de Marta alrededor del cuello
  if (stethoscope) {
    const steth = new THREE.Group();
    steth.position.set(0, 1.56, 0.02);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.01, 8, 24, Math.PI * 1.3), M('rubber'));
    ring.rotation.x = Math.PI / 2.3;
    steth.add(ring);
    // Campana metálica pectoral
    cyl(0.025, 0.025, 0.015, 'chrome', 0.06, -0.22, 0.14, steth, 12);
    body.add(steth);
  }

  // Credencial identificatoria con foto
  if (badge) {
    const card = box(0.065, 0.09, 0.005, 'white', 0.11, 1.38, 0.14, body);
    box(0.015, 0.02, 0.008, 'chrome', 0.11, 1.44, 0.14, body); // Gancho de clip
  }

  // Gorra de seguridad de Raúl con visera brillante
  if (guardCap) {
    const cap = new THREE.Group();
    cap.position.set(0, 0.11, 0.02);
    // Corona de la gorra
    cyl(0.125, 0.11, 0.07, 'darkMetal', 0, 0, 0, cap, 16);
    // Visera curva delantera
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 12, 1, false, 0, Math.PI * 0.8), M('rubber'));
    visor.rotation.y = -Math.PI * 0.4;
    visor.position.set(0, -0.02, 0.06);
    cap.add(visor);
    // Placa dorada en la gorra
    box(0.035, 0.035, 0.005, 'brass', 0, 0.02, 0.12, cap);
    head.add(cap);

    // Cinturón de servicio con radio y funda
    const belt = box(0.42, 0.06, 0.32, 'rubber', 0, 0.94, 0, body);
    box(0.07, 0.14, 0.05, 'darkMetal', 0.22, 0.96, 0.05, body); // Radio policial
    box(0.05, 0.05, 0.02, 'brass', 0, 0.94, 0.16, body); // Hebilla
  }

  // Aura fantasmal del niño asesinado
  if (ghost) {
    const glow = new THREE.PointLight(0x7fe3ff, 1.2, 3.5, 2);
    glow.position.set(0, 1.2, 0.2);
    root.add(glow);
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
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.40), new THREE.MeshStandardMaterial({ map: noteTex(), roughness: 0.95, emissive: 0x241e12 }));
  m.rotation.x = -Math.PI / 2 + 0.08;
  m.castShadow = true;
  return m;
}

export function keyMesh() {
  const g = new THREE.Group();
  const mat = M('brass');
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 8, 20), mat);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 10), mat);
  shaft.position.y = -0.12;
  const bit1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.015), mat);
  bit1.position.set(0.026, -0.20, 0);
  const bit2 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.016, 0.015), mat);
  bit2.position.set(0.018, -0.16, 0);

  // Etiqueta de cartulina colgando de la anilla
  const tag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.002), new THREE.MeshStandardMaterial({ color: 0xd8ceb0, roughness: 0.9 }));
  tag.position.set(-0.06, 0.06, 0);
  tag.rotation.z = 0.4;

  g.add(ring, shaft, bit1, bit2, tag);
  g.rotation.z = Math.PI / 2;
  return g;
}

export function flashlightMesh() {
  const g = new THREE.Group();
  // Tubo moleteado negro
  cyl(0.028, 0.028, 0.22, 'darkMetal', 0, 0, 0, g, 12);
  // Cabezal biselado
  cyl(0.046, 0.030, 0.07, 'chrome', 0, 0.13, 0, g, 14);
  // Cristal delantero
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.042, 14), M('glass'));
  lens.position.set(0, 0.166, 0);
  lens.rotation.x = -Math.PI / 2;
  g.add(lens);
  // Interruptor de goma
  box(0.015, 0.03, 0.012, 'rubber', 0, 0.04, 0.03, g);
  g.rotation.z = Math.PI / 2;
  return g;
}

export function batteryMesh() {
  const g = new THREE.Group();
  cyl(0.038, 0.038, 0.11, new THREE.MeshStandardMaterial({ color: 0x1f8542, roughness: 0.4 }), 0, 0, 0, g, 12);
  cyl(0.018, 0.018, 0.018, 'chrome', 0, 0.064, 0, g, 10);
  box(0.07, 0.04, 0.075, 'darkMetal', 0, -0.03, 0, g);
  return g;
}

export function markerMesh() {
  const g = new THREE.Group();
  // Felpón negro con tapa
  cyl(0.012, 0.012, 0.14, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 }), 0, 0, 0, g, 10);
  cyl(0.014, 0.014, 0.05, new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 }), 0, 0.055, 0, g, 10);
  // Clip de plástico de la tapa
  box(0.005, 0.04, 0.01, 'darkMetal', 0, 0.055, 0.016, g);
  g.rotation.z = Math.PI / 2;
  return g;
}

export function photoMesh() {
  const t = paint(128, 160, (g, w, h) => {
    // Foto polaroid de 1984 con dos gemelos
    g.fillStyle = '#eae2cf'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2d2824'; g.fillRect(10, 10, w - 20, h - 40);

    // Gemelo sano a la izquierda
    g.fillStyle = '#b0947e'; g.beginPath(); g.arc(42, 54, 15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a4b60'; g.fillRect(26, 72, 32, 45);

    // Gemelo enfermo pálido a la derecha (en cama de hospital)
    g.fillStyle = '#8f9da2'; g.beginPath(); g.arc(86, 54, 15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a8588'; g.fillRect(70, 72, 32, 45);
    // Ojeras y respirador
    g.fillStyle = 'rgba(20,20,30,0.5)'; g.beginPath(); g.arc(86, 56, 8, 0, Math.PI * 2); g.fill();

    // Texto al pie de la polaroid
    g.fillStyle = '#1a1814';
    g.font = '10px "Special Elite", monospace';
    g.fillText('14-NOV-1984 · HNOS. V.', 14, h - 14);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.31), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

export function phoneMesh() {
  const g = new THREE.Group();
  box(0.24, 0.08, 0.22, 'darkMetal', 0, 0, 0, g);
  box(0.12, 0.02, 0.12, 'paint', -0.04, 0.045, 0.02, g);
  box(0.06, 0.05, 0.24, 'darkMetal', 0.06, 0.06, 0, g);
  return g;
}

export function stairsModel(dir) {
  const g = new THREE.Group();
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x5a5850, roughness: 0.85 });
  const treadMat = new THREE.MeshStandardMaterial({ color: 0x8a7a50, roughness: 0.5 }); // Borde de seguridad antideslizante

  if (dir === 'up') {
    const n = 16;
    for (let i = 0; i < n; i++) {
      const h = 0.2 * (i + 1);
      const s = new THREE.Mesh(new THREE.BoxGeometry(2.6, h, 2.9 / n), stepMat);
      s.position.set(0, h / 2, -1.45 + (2.9 / n) * (i + 0.5));
      s.castShadow = s.receiveShadow = true;
      g.add(s);

      // Franja amarilla antideslizante en el borde de cada escalón
      const tread = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.015, 0.05), treadMat);
      tread.position.set(0, h + 0.008, -1.45 + (2.9 / n) * (i + 0.5) + (2.9 / n) * 0.4);
      g.add(tread);
    }
    // Barandilla tubular de escalera
    for (const s of [-1.28, 1.28]) {
      const rail = box(0.04, 0.04, 3.2, 'chrome', s, 1.8, 0, g);
      rail.rotation.x = 0.65;
    }
    g.rotation.y = Math.PI;
  } else {
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.9), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    hole.rotation.x = -Math.PI / 2; hole.position.y = 0.01; g.add(hole);
    for (const x of [-1.3, 1.3]) {
      box(0.05, 1.05, 2.9, 'metal', x, 0.52, 0, g);
    }
  }
  return g;
}
