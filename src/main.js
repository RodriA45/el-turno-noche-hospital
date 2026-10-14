import * as THREE from 'three';
import './style.css';
import { Input } from './core/Input.js';
import { AudioManager } from './audio/AudioManager.js';
import { Game } from './core/Game.js';

const $ = id => document.getElementById(id);
const canvas = $('game-canvas');

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || matchMedia('(pointer: coarse)').matches;
const lowEnd = isMobile && (navigator.hardwareConcurrency || 4) <= 4;
let pixelRatio = isMobile ? Math.min(devicePixelRatio, lowEnd ? 1 : 1.5) : Math.min(devicePixelRatio, 2);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobile,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 80);

function resize() {
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}

addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 250));

// Calidad adaptativa en caso de caídas de FPS
let fpsAcc = 0, fpsN = 0;
function adaptQuality(dt) {
  fpsAcc += dt; fpsN++;
  if (fpsAcc < 1.5) return;
  const fps = fpsN / fpsAcc;
  fpsAcc = 0; fpsN = 0;
  if (fps < 40 && pixelRatio > 0.55) {
    pixelRatio = Math.max(0.55, pixelRatio * 0.8);
    resize();
  }
}

const input = new Input(canvas);
const audio = new AudioManager();

const game = new Game({
  renderer,
  camera,
  input,
  audio,
  isMobile,
  lowEnd,
});

let lastT = performance.now() * 0.001;

function frame() {
  requestAnimationFrame(frame);
  const now = performance.now() * 0.001;
  const dt = Math.min(now - lastT, 0.05);
  lastT = now;
  const t = now;

  if (game.state === 'play') {
    adaptQuality(dt);
  }

  game.update(dt, t);
  renderer.render(game.scene, camera);
  input.endFrame();
}

window.__game = game;

frame();
