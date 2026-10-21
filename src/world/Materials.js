import * as THREE from 'three';
import {
  clothTexture, xrayTexture, ecgTexture, cardboardBoxTexture, curtainTexture, crtScreenTexture,
  woodTexture, sheetTexture, mattressTexture, brushedMetalTexture, wiredGlassTexture, stairAbyssTexture,
} from './Textures.js';

// Materiales compartidos por todos los props (se crean una sola vez).
// `uvScale` = repeticiones por metro (Builder proyecta las UV en espacio local).
const cache = {};

const std = (o, ud = {}) => {
  const m = new THREE.MeshStandardMaterial(o);
  m.userData.isShared = true;
  Object.assign(m.userData, ud);
  return m;
};
const emissive = (color, intensity, o = {}) => std({ color, emissive: new THREE.Color(color), emissiveIntensity: intensity, roughness: 0.4, ...o }, { noShadow: true });

const DEFS = {
  // --- metales (con environment suave se leen como metal real, no como plástico negro)
  metal: () => std({ color: 0xa9aeb2, metalness: 0.8, roughness: 0.38 }),
  chrome: () => std({ color: 0xe4e8ec, metalness: 0.92, roughness: 0.16 }),
  darkMetal: () => std({ color: 0x2a2d31, metalness: 0.7, roughness: 0.48 }),
  brass: () => std({ color: 0xc09a45, metalness: 0.85, roughness: 0.32 }),
  brushed: () => std({ map: brushedMetalTexture(), color: 0xffffff, metalness: 0.75, roughness: 0.42 }, { uvScale: 1.2 }),
  scalpelSteel: () => std({ color: 0xe8ecf0, metalness: 0.95, roughness: 0.14 }),

  // --- pinturas / esmaltes
  paint: () => std({ color: 0xa8a698, roughness: 0.8 }),
  casingMat: () => std({ color: 0xa29d8b, roughness: 0.72 }),
  keyboardMat: () => std({ color: 0x8c8878, roughness: 0.82 }),
  keyCap: () => std({ color: 0x4a4a46, roughness: 0.7 }),
  white: () => std({ color: 0xd2d0c6, roughness: 0.55 }),
  enamel: () => std({ color: 0xc9c7b8, roughness: 0.42, metalness: 0.05 }),
  hospitalGreen: () => std({ color: 0x739281, roughness: 0.55 }),
  porcelain: () => std({ color: 0xe2e2d4, roughness: 0.22, metalness: 0.02 }),
  red: () => std({ color: 0x8a1212, roughness: 0.5 }),
  hazardYellow: () => std({ color: 0xd69e16, roughness: 0.55 }),
  concrete: () => std({ color: 0x6a685f, roughness: 0.92 }, { uvScale: 0.5 }),
  terracotta: () => std({ color: 0x8c4f34, roughness: 0.85 }),

  // --- ropa de cama / telas
  sheet: () => std({ map: sheetTexture(false), roughness: 0.96 }, { uvScale: 1.1 }),
  dirtySheet: () => std({ map: sheetTexture(true), roughness: 0.96 }, { uvScale: 1.1 }),
  mattress: () => std({ map: mattressTexture(), roughness: 0.6 }, { uvScale: 1.4 }),
  fabric: () => std({ color: 0x38474f, roughness: 0.95 }),
  curtain: () => std({ map: curtainTexture(), roughness: 0.95, side: THREE.DoubleSide }),
  vinyl: () => std({ color: 0x1e2428, roughness: 0.5 }),
  leather: () => std({ color: 0x241814, roughness: 0.6 }),
  rubber: () => std({ color: 0x151515, roughness: 0.92 }),

  // --- maderas / cartón / plásticos
  wood: () => std({ map: woodTexture('#4a3020', '#6e4a2c'), roughness: 0.55 }, { uvScale: 0.9 }),
  lightWood: () => std({ map: woodTexture('#7a5a3a', '#a07a50'), roughness: 0.5 }, { uvScale: 0.9 }),
  plastic: () => std({ color: 0x3d5059, roughness: 0.4 }),
  cardboard: () => std({ color: 0x8a6d46, roughness: 0.9 }),
  cardboardMat: () => std({ map: cardboardBoxTexture(), roughness: 0.88 }),
  leaf: () => std({ color: 0x3f5a2c, roughness: 0.75, side: THREE.DoubleSide }),
  soil: () => std({ color: 0x241810, roughness: 1 }),
  bloodMat: () => std({ color: 0x540808, roughness: 0.3, metalness: 0.1 }),

  // --- vidrios
  glass: () => std({ color: 0x9fbcc4, roughness: 0.45, metalness: 0.0, transparent: true, opacity: 0.14, depthWrite: false }, { noShadow: true }),
  glassBottle: () => std({ color: 0x8fb89a, roughness: 0.15, metalness: 0.0, transparent: true, opacity: 0.55, depthWrite: false }, { noShadow: true }),
  doorGlass: () => std({ map: wiredGlassTexture(), color: 0xffffff, roughness: 0.55, metalness: 0.0, transparent: true, opacity: 0.82, depthWrite: false }, { noShadow: true }),
  mirror: () => std({ color: 0x9fb4bc, metalness: 0.35, roughness: 0.1, emissive: new THREE.Color(0x0d171c), emissiveIntensity: 1 }, { noShadow: true }),
  porcelainIn: () => std({ color: 0xe2e2d4, roughness: 0.22, metalness: 0.02, side: THREE.DoubleSide }),
  abyss: () => { const m = new THREE.MeshBasicMaterial({ map: stairAbyssTexture() }); m.userData.isShared = true; m.userData.noShadow = true; return m; },
  amber: () => std({ color: 0x7a4a14, roughness: 0.2, transparent: true, opacity: 0.8, depthWrite: false }, { noShadow: true }),
  fluid: () => std({ color: 0xbfe0d8, roughness: 0.1, transparent: true, opacity: 0.5, depthWrite: false }, { noShadow: true }),

  // --- pantallas / luces
  screen: () => std({ map: crtScreenTexture(), roughness: 0.28, metalness: 0.08, emissive: new THREE.Color(0x1a4528), emissiveIntensity: 0.55 }, { noShadow: true }),
  screenOff: () => std({ color: 0x060808, roughness: 0.12, metalness: 0.2 }),
  xrayMat: () => std({ map: xrayTexture(), roughness: 0.25, metalness: 0.05, emissive: new THREE.Color(0x48647a), emissiveIntensity: 0.5 }, { noShadow: true }),
  ecgMat: () => std({ map: ecgTexture(), roughness: 0.25, metalness: 0.05, emissive: new THREE.Color(0x184824), emissiveIntensity: 0.55 }, { noShadow: true }),
  ledGreen: () => emissive(0x33dd66, 1.6),
  ledRed: () => emissive(0xdd2222, 1.6),
  lampGlow: () => { const m = new THREE.MeshBasicMaterial({ color: 0xfff6dc }); m.userData.isShared = true; m.userData.noShadow = true; return m; },
};

export function M(name) {
  if (cache[name]) return cache[name];
  const make = DEFS[name];
  if (!make) throw new Error('Material desconocido: ' + name);
  return (cache[name] = make());
}

/** Materiales sueltos para ropa (dependen de color y manchas) */
export function clothMaterial(base, blood, dirt, ghost) {
  return new THREE.MeshStandardMaterial({
    map: clothTexture(base, blood, dirt),
    roughness: 0.92,
    transparent: ghost,
    opacity: ghost ? 0.82 : 1,
    emissive: ghost ? new THREE.Color(0x182836) : new THREE.Color(0x000000),
  });
}
