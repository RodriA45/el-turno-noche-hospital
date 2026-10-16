import * as THREE from 'three';
import { Hospital } from '../world/Hospital.js';
import { Player } from '../player/Player.js';
import { Ghost, Actor } from '../enemy/Ghost.js';
import { PEOPLE } from '../world/Models.js';
import { CAMS, ANOMALIES, drawFeed, hitTestAnomaly } from '../ui/Cctv.js';
import { CHAPTERS } from '../chapters.js';
import { FlashbackPlayer } from '../ui/Flashback.js';
import { ObjectExaminer } from '../ui/ObjectExaminer.js';
import { AutoTour } from './AutoTour.js';

const $ = id => document.getElementById(id);
const CANCEL = Symbol('cancel');
const show = (id, v = true) => $(id).classList.toggle('hidden', !v);
const S = 3;

export class Game {
  constructor({ renderer, camera, input, audio, isMobile, lowEnd }) {
    Object.assign(this, { renderer, camera, input, audio, isMobile, lowEnd });
    this.state = 'menu';       // menu | play | ui | paused | end
    this.run = 0; this.waiters = []; this.flags = {}; this.extra = [];
    this.story = JSON.parse(localStorage.getItem('hotel_story') || '{}');
    this.progress = +localStorage.getItem('hotel_progress') || 1;
    this.cctvState = {}; this.lockHandlers = {};
    this.frozen = false; this.look = null; this.shake = 0; this.ambientLevel = 0; this.ambT = 8;
    this.chapterIdx = 0; this.time = 0; this.checkpoint = null;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x020203);
    this.flashbackPlayer = new FlashbackPlayer($('flashback-canvas'));
    const examinerCanvas = $('examiner-canvas');
    if (examinerCanvas) {
      this.examiner = new ObjectExaminer(examinerCanvas);
    }
    this.isHiding = false; this.hidingSpot = null;
    this.autoTour = new AutoTour(this);
    window.game = this;
    window.startTour = (floor = 1) => this.autoTour.start(floor);
    this.buildMenu();
    this.bindUi();
    addEventListener('keydown', e => this.onKey(e));
  }

  // ------------------------------------------------------------------ menú
  buildMenu() {
    const list = $('chapter-list'); list.innerHTML = '';
    CHAPTERS.forEach((c, i) => {
      const b = document.createElement('button'); b.className = 'chap'; b.disabled = i + 1 > this.progress;
      b.innerHTML = `<b>${i + 1}</b><span>${c.title}<small>${i + 1 > this.progress ? 'Bloqueado' : c.sub}</small></span>`;
      b.onclick = () => this.startChapter(i);
      list.appendChild(b);
    });
  }

  bindUi() {
    $('btn-resume').onclick = () => this.input.lock();
    $('btn-menu').onclick = $('btn-menu2').onclick = () => this.toMenu();
    $('btn-next').onclick = () => this.startChapter(Math.min(this.chapterIdx + 1, CHAPTERS.length - 1));
    $('note').onclick = () => this.closeNote?.();
    $('cctv-close').onclick = () => this.closeCctv?.();

    // Controles de configuración (Sensibilidad y Volumen)
    const sens1 = $('sens-slider'), sens2 = $('sens-slider-pause');
    const savedSens = localStorage.getItem('hospital_sens');
    const initSensNum = savedSens !== null ? Math.max(1, Math.min(10, ((+savedSens - 0.0008) / 0.0036) * 10)) : 5;
    if (sens1) sens1.value = initSensNum;
    if (sens2) sens2.value = initSensNum;

    const updateSens = v => {
      const s = 0.0008 + (v / 10) * 0.0036;
      this.player?.setSensitivity(s);
      if (sens1) sens1.value = v;
      if (sens2) sens2.value = v;
    };
    if (sens1) sens1.oninput = e => updateSens(+e.target.value);
    if (sens2) sens2.oninput = e => updateSens(+e.target.value);

    const vol1 = $('vol-slider'), vol2 = $('vol-slider-pause');
    const savedVol = localStorage.getItem('hospital_vol');
    const initVolNum = savedVol !== null ? Math.round((+savedVol) * 100) : 85;
    if (vol1) vol1.value = initVolNum;
    if (vol2) vol2.value = initVolNum;

    const updateVol = v => {
      this.audio?.setMasterVolume(v / 100);
      if (vol1) vol1.value = v;
      if (vol2) vol2.value = v;
    };
    if (vol1) vol1.oninput = e => updateVol(+e.target.value);
    if (vol2) vol2.oninput = e => updateVol(+e.target.value);

    // Contención de respiración en móviles mediante toque táctil en casillero
    const hidingEl = $('hiding');
    if (hidingEl) {
      hidingEl.style.pointerEvents = 'auto';
      hidingEl.addEventListener('pointerdown', (e) => { e.preventDefault(); this.touchHoldingBreath = true; });
      hidingEl.addEventListener('pointerup', () => { this.touchHoldingBreath = false; });
      hidingEl.addEventListener('pointercancel', () => { this.touchHoldingBreath = false; });
    }

    // Pantalla completa (con soporte webkit para iPad/Safari y ocultación si no está soportado como en iPhone)
    const canFullscreen = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
    const toggleFull = () => {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFull) {
        try {
          const fn = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
          if (fn) fn.call(document.documentElement);
        } catch (e) {}
      } else {
        try {
          const exit = document.exitFullscreen || document.webkitExitFullscreen;
          if (exit) exit.call(document);
        } catch (e) {}
      }
    };
    if ($('btn-fullscreen')) {
      if (canFullscreen) $('btn-fullscreen').onclick = toggleFull;
      else $('btn-fullscreen').style.display = 'none';
    }
    if ($('btn-fullscreen-pause')) {
      if (canFullscreen) $('btn-fullscreen-pause').onclick = toggleFull;
      else $('btn-fullscreen-pause').style.display = 'none';
    }

    this.renderer.domElement.addEventListener('pointerdown', () => {
      if (this.state === 'play' && !this.input.locked && !this.input.isTouch) this.input.lock();
    });
    this.input.onLockChange = locked => {
      if (this.state === 'ui') return;
      if (locked) {
        if (this.state === 'paused') {
          this.state = 'play';
          show('pause', false);
          show('touch-ui', this.input.isTouch);
          if (this.isHiding) show('hiding', true);
        }
      } else if (this.state === 'play') {
        this.state = 'paused';
        show('pause', true);
        show('touch-ui', false);
        if (this.isHiding) show('hiding', false);
      }
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'play') this.input.unlock(); });
  }

  onKey(e) {
    if (this.autoTour?.active) {
      if (e.code === 'Escape') { this.autoTour.stop(); return; }
      if (e.code === 'Space') { e.preventDefault(); this.autoTour.togglePause(); return; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.autoTour.next(); return; }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.autoTour.prev(); return; }
    }
    if (this.skipFlashback && (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Escape')) { this.skipFlashback(); return; }
    if (this.isHiding) {
      if (e.code === 'KeyE' || e.code === 'Escape') { this.exitHiding(); return; }
      if (e.code === 'Space') { e.preventDefault(); return; }
    }
    if (this.state === 'ui') {
      if (this.choiceCb && (e.code === 'Digit1' || e.code === 'Numpad1')) this.choiceCb(0);
      if (this.choiceCb && (e.code === 'Digit2' || e.code === 'Numpad2')) this.choiceCb(1);
      if (this.keypadKey && /^Digit\d$/.test(e.code)) this.keypadKey(e.code.slice(5));
      if (this.closeNote && (e.code === 'KeyE' || e.code === 'Escape')) this.closeNote();
      if (this.closeCctv && (e.code === 'Escape' || e.code === 'KeyE')) this.closeCctv();
    }
    if (e.code === 'Escape' && this.state === 'play') { this.input.unlock(); return; }
    if (this.qteCb && e.code === this.qteCode) this.qteCb(true);
  }

  toMenu() {
    this.autoTour?.stop();
    this.run++; this.state = 'menu'; this.input.unlock();
    ['hud', 'touch-ui', 'pause', 'end', 'titlecard', 'note', 'choice', 'keypad', 'cctv', 'qte', 'flashback', 'hiding', 'examiner'].forEach(i => show(i, false));
    this.flashbackPlayer.stop(); this.isHiding = false;
    this.examiner?.clear();
    $('fx-fade').style.opacity = 0; this.buildMenu(); show('menu', true);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x020203);
    this.postProcess?.setScene(this.scene);
  }

  // ------------------------------------------------------------------ capítulo
  startChapter(i) {
    this.audio.start();
    if (this.input.isTouch) {
      const el = document.documentElement;
      try { (el.requestFullscreen?.() || el.webkitRequestFullscreen?.())?.catch?.(() => {}); } catch (e) { /* noop */ }
      try { screen.orientation?.lock?.('landscape')?.catch?.(() => {}); } catch (e) { /* noop */ }
    }
    this.run++; const tk = this.run;
    this.chapterIdx = i; this.waiters = []; this.extra = []; this.flags = {}; this.cctvState = {}; this.lockHandlers = {};
    this.ambientLevel = 0; this.frozen = false; this.look = null; this.actors = {};
    this.stairsBlocked = 'Debo concentrarme en mis tareas de recepción primero.';
    if (i === 0) { this.story = {}; localStorage.setItem('hotel_story', '{}'); }

    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x020203);
    this.scene.fog = new THREE.FogExp2(0x040506, 0.06);
    this.postProcess?.setScene(this.scene);
    this.hospital = new Hospital(this.scene);
    this.player = new Player(this.camera, this.scene, this.hospital, this.input);
    if (this.isMobile) this.player.spot.shadow.mapSize.set(this.lowEnd ? 256 : 512, this.lowEnd ? 256 : 512);
    this.player.onStep = v => this.audio.step(v);
    this.player.onFlashToggle = () => this.audio.flashClick();
    this.player.hasFlash = !!this.story.flashlight; this.player.flashOn = false;
    this.ghost = new Ghost(this.scene, this.hospital);
    this.ghost.onCatch = () => this.catchPlayer();
    this.ghost.onStep = null;

    this.isHiding = false; this.flashbackPlayer.stop();
    ['menu', 'pause', 'end', 'note', 'choice', 'keypad', 'cctv', 'qte', 'flashback', 'hiding', 'examiner'].forEach(id => show(id, false));
    show('hud', true); show('touch-ui', this.input.isTouch);
    $('fx-fade').style.transition = 'none'; $('fx-fade').style.opacity = 1;
    $('subs').classList.add('hidden'); $('objective').textContent = '';
    $('chapter-tag').textContent = `Capítulo ${i + 1}`;
    $('meter-battery').style.display = this.player.hasFlash ? '' : 'none';
    this.state = 'play'; this.frozen = true;
    this.input.lock();

    const ch = CHAPTERS[i];
    this.toFloorInstant(ch.startFloor || 1, ...(ch.start || [5, 6, Math.PI / 2]));
    (async () => {
      try {
        await this.sleep(0.2);
        await ch.run(this);
        if (tk === this.run) this.finish();
      } catch (e) {
        if (e !== CANCEL) console.error(e);
      }
    })();
  }

  finish() {
    if (this.state === 'end') return;
    const i = this.chapterIdx; const last = i >= CHAPTERS.length - 1;
    if (!last) { this.progress = Math.max(this.progress, i + 2); localStorage.setItem('hotel_progress', this.progress); }
    this.state = 'end'; this.input.unlock();
    show('hud', false); show('touch-ui', false); show('subs', false);
    $('end-title').textContent = last ? 'FIN... ¿O NO?' : `Capítulo ${i + 1} completado`;
    $('end-text').textContent = last ? 'Una nueva recepcionista cruza la puerta del hospital. Es su primer turno.' : 'Tus decisiones han sido guardadas. La noche continúa...';
    $('btn-next').style.display = last ? 'none' : '';
    show('end', true);
    $('fx-fade').style.opacity = 0;
  }

  // ------------------------------------------------------------------ utilidades de guion
  _wait(cond, timeout = Infinity) {
    const tk = this.run;
    return new Promise((res, rej) => this.waiters.push({ cond, res, rej, tk, t: 0, timeout }));
  }
  sleep(s) { let acc = 0; return this._wait(dt => (acc += dt) >= s); }
  until(fn) { return this._wait(() => fn()); }

  async say(text, who = '', { thought = false, extra = 0.6 } = {}) {
    $('subs-who').textContent = who ? who + ':' : ''; $('subs-text').textContent = text;
    $('subs').classList.toggle('thought', thought); show('subs', true);
    await this.sleep(Math.max(2.2, text.length * 0.055) + extra);
    show('subs', false);
  }
  objective(text) { $('objective').textContent = text ? '▸ ' + text : ''; }
  async title(chapter, title, sub = '') {
    $('tc-chapter').textContent = chapter; $('tc-title').textContent = title; $('tc-sub').textContent = sub;
    show('titlecard', true); $('fx-fade').style.opacity = 0;
    await this.sleep(4.2); show('titlecard', false);
  }
  async fade(to = 1, s = 1) { const f = $('fx-fade'); f.style.transition = `opacity ${s}s`; f.style.opacity = to; await this.sleep(s); }
  flash(a = 0.6) { const f = $('fx-flash'); f.style.transition = 'none'; f.style.opacity = a; requestAnimationFrame(() => { f.style.transition = 'opacity .6s'; f.style.opacity = 0; }); }
  cine(v) { this.frozen = v; }
  setFlag(k, v = true) { this.flags[k] = v; }
  remember(k, v = true) { this.story[k] = v; localStorage.setItem('hotel_story', JSON.stringify(this.story)); }
  giveFlashlight() {
    this.remember('flashlight');
    this.player.hasFlash = true;
    this.player.battery = Math.max(this.player.battery, 0.95);
    $('meter-battery').style.display = '';
  }
  giveBattery(amount = 0.5) {
    this.audio?.batteryPickup();
    this.player.addBattery(amount);
  }

  lookAt(wx, wy, wz, secs = 1) {
    return new Promise((res, rej) => {
      const tk = this.run; const p = this.player;
      const dx = wx - p.pos.x, dz = wz - p.pos.z;
      let ty = Math.atan2(-dx, -dz); const tp = Math.atan2(wy - 1.6, Math.hypot(dx, dz));
      let dy = ty - p.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); ty = p.yaw + dy;
      this.look = { y0: p.yaw, p0: p.pitch, y1: ty, p1: tp, t: 0, d: secs, res, rej, tk };
    });
  }
  lookCell(cx, cz, secs = 1, y = 1.4) { return this.lookAt(cx * S, y, cz * S, secs); }
  shakeCam(v = 0.6) { this.shake = v; }

  // ----- objetos interactivos dinámicos
  place(def) { this.extra.push(def); if (def.floor === this.hospital.floorNum) this.hospital.add(def); return def; }
  removeObj(id) { this.extra = this.extra.filter(e => e.id !== id); this.hospital.remove(id); }
  waitUse(id) { return new Promise((res, rej) => { this.useWaiters ||= {}; (this.useWaiters[id] ||= []).push({ res, rej, tk: this.run }); }); }
  actor(name, factory) { const a = new Actor(this.scene, this.hospital, typeof factory === 'string' ? PEOPLE[factory] : factory); this.actors[name] = a; return a; }
  walk(actor, cx, cz, speed = 1.6) { return new Promise(res => actor.goTo(cx, cz, speed, res)); }

  // ----- pisos
  toFloorInstant(n, cx, cz, yaw) {
    this.hospital.load(n, this.extra);
    this.scene.fog.density = this.hospital.def.fog;
    this.player.setPos(cx, cz, yaw);
    this.checkpoint = { floor: n, cx, cz, yaw };
  }
  async toFloor(n, cx, cz, yaw, s = 0.7) {
    this.frozen = true; await this.fade(1, s);
    this.toFloorInstant(n, cx, cz, yaw);
    await this.sleep(0.25); await this.fade(0, s); this.frozen = false;
  }

  // ----- decisiones y UI
  _openUi() { this.state = 'ui'; this.frozen = true; this.input.unlock(); }
  _closeUi() { this.state = 'play'; this.frozen = false; this.input.lock(); }

  choice(q, a, b, eyebrow = 'Decisión') {
    return new Promise((res, rej) => {
      const tk = this.run; this._openUi();
      $('choice-eyebrow').textContent = eyebrow; $('choice-q').textContent = q;
      $('choice-a').textContent = '1 · ' + a; $('choice-b').textContent = '2 · ' + b;
      show('choice', true); show('touch-ui', false);
      const done = i => { if (tk !== this.run) return; this.choiceCb = null; show('choice', false); show('touch-ui', this.input.isTouch); this._closeUi(); this.audio.qte(); res(i); };
      this.choiceCb = done; $('choice-a').onclick = () => done(0); $('choice-b').onclick = () => done(1);
      this.waiters.push({ cond: () => false, rej, tk, res() {}, t: 0, timeout: Infinity });
    });
  }

  note(title, text) {
    return new Promise((res, rej) => {
      const tk = this.run; this._openUi(); this.audio.paper();
      $('note-title').textContent = title; $('note-text').textContent = text; show('note', true);
      this.closeNote = () => { if (tk !== this.run) return; this.closeNote = null; show('note', false); this._closeUi(); res(); };
      this.waiters.push({ cond: () => false, rej, tk, res() {}, t: 0, timeout: Infinity });
    });
  }

  keypad(code) {
    return new Promise((res, rej) => {
      const tk = this.run; this._openUi(); show('touch-ui', false);
      let val = ''; const disp = $('kp-display'); const grid = $('kp-grid');
      const targetLen = code ? code.length : 4;
      const render = () => { disp.textContent = (val + '----').slice(0, targetLen).split('').map((c, i) => i < val.length ? val[i] : '-').join(''); };
      grid.innerHTML = '';
      const press = d => {
        if (val.length >= targetLen) return; val += d; this.audio.qte(); render();
        if (val.length === targetLen) {
          if (val === code) { disp.classList.remove('err'); setTimeout(() => finish(true), 350); this.audio.pickup(); }
          else { disp.classList.add('err'); this.audio.locked(); setTimeout(() => { val = ''; disp.classList.remove('err'); render(); }, 450); }
        }
      };
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', 'OK'].forEach(k => {
        const b = document.createElement('button'); b.textContent = k;
        b.onclick = () => { if (k === '←') { val = val.slice(0, -1); render(); } else if (k === 'OK') { /* auto */ } else press(k); };
        grid.appendChild(b);
      });
      const finish = ok => { if (tk !== this.run) return; this.keypadKey = null; show('keypad', false); show('touch-ui', this.input.isTouch); this._closeUi(); res(ok); };
      this.keypadKey = press; $('kp-close').onclick = () => finish(false);
      render(); show('keypad', true);
      this.waiters.push({ cond: () => false, rej, tk, res() {}, t: 0, timeout: Infinity });
    });
  }

  // ----- Visor de inspección de objetos 3D estilo Resident Evil
  examineItem(itemDef) {
    return new Promise((res, rej) => {
      const tk = this.run;
      this._openUi();
      show('touch-ui', false);
      this.audio.pickup();
      if (!this.examiner) {
        this._closeUi();
        res(true);
        return;
      }
      this.examiner.examine(itemDef).then(result => {
        if (tk !== this.run) return;
        this._closeUi();
        show('touch-ui', this.input.isTouch);
        res(result);
      }).catch(rej);
    });
  }

  cctv(options = {}) {
    const opts = typeof options === 'function' ? { onView: options } : (options || {});
    const {
      onView = null,
      targetAnomalies = ['child_waiting', 'wheelchair_moved', 'door_peek'],
      onAnomalyFound = null,
      onClimaxTrigger = null,
      startCam = 0,
    } = opts;

    return new Promise((res, rej) => {
      const tk = this.run;
      this._openUi();
      show('touch-ui', false);
      this.audio.cctvFlip();

      const canvas = $('cctv-canvas');
      const mapGrid = $('cctv-map-grid');
      const camTitle = $('cctv-cam-title');
      const reticle = $('cctv-reticle');
      const alertBanner = $('cctv-alert-banner');
      const alertMsg = $('cctv-alert-msg');
      const anomalyPill = $('cctv-anomaly-status');
      const lightBtn = $('cctv-light-btn');
      const closeBtn = $('cctv-close');

      if (mapGrid) mapGrid.innerHTML = '';
      let cur = Math.max(0, Math.min(CAMS.length - 1, startCam));
      let panX = 0;
      let targetPanX = 0;
      let lightOn = false;
      let isJumpscaring = false;
      const viewed = new Set();
      const foundAnomalies = new Set();

      this.cctvState.anomaliesActive = targetAnomalies;
      this.cctvState.jumpscareActive = false;
      this.cctvState.jumpscareProgress = 0;

      // Actualizar píldora de anomalías
      const updateAnomalyCount = () => {
        if (anomalyPill) {
          if (!targetAnomalies || targetAnomalies.length === 0) {
            anomalyPill.style.display = 'none';
            return;
          }
          anomalyPill.style.display = '';
          anomalyPill.textContent = `ANOMALÍAS: ${foundAnomalies.size}/${targetAnomalies.length}`;
          if (foundAnomalies.size >= targetAnomalies.length) {
            anomalyPill.style.borderColor = '#4ade80';
            anomalyPill.style.color = '#86efac';
            this.cctvState.climaxReady = true;
            if (alertBanner && alertMsg) {
              alertMsg.textContent = '¡ALERTA EN PISO 4! SEÑAL DETECTADA EN CAM 05';
              alertBanner.classList.remove('hidden');
            }
            this.audio.cctvAlert();
            onClimaxTrigger?.();
          }
        }
      };
      updateAnomalyCount();

      // Botones del mapa estilo FNAF
      const buttons = mapGrid ? CAMS.map((c, i) => {
        const b = document.createElement('button');
        b.className = 'cctv-cam-node' + (c.forbidden ? ' forbidden' : '');
        b.textContent = c.code + (c.forbidden ? ' [!]' : '');
        b.onclick = () => {
          if (isJumpscaring) return;
          cur = i;
          viewed.add(c.id);
          this.audio.cctvBeep();
          this.audio.static_();
          onView?.(c.id);

          if (c.id === 5 && this.cctvState.climaxReady && !isJumpscaring) {
            triggerJumpscare();
          }
          sync();
        };
        mapGrid.appendChild(b);
        return b;
      }) : [];

      const sync = () => {
        buttons.forEach((b, i) => {
          b.classList.toggle('active', i === cur);
          const c = CAMS[i];
          const hasUndiscovered = targetAnomalies.some(aId => {
            const anom = Object.values(ANOMALIES).find(an => an.id === aId);
            return anom && anom.camId === c.id && !foundAnomalies.has(aId);
          });
          b.classList.toggle('alert', hasUndiscovered || (c.id === 5 && this.cctvState.climaxReady));
        });
        if (camTitle) camTitle.textContent = CAMS[cur].name;
      };

      sync();
      show('cctv', true);
      viewed.add(CAMS[cur].id);

      // Conmutar luz de sector
      const toggleLight = () => {
        if (isJumpscaring) return;
        lightOn = !lightOn;
        this.audio.cctvLight();
        if (lightBtn) lightBtn.classList.toggle('light-active', lightOn);

        if (CAMS[cur].id === 5 && this.cctvState.climaxReady && !isJumpscaring) {
          triggerJumpscare();
        }
      };
      if (lightBtn) lightBtn.onclick = toggleLight;
      this.cctvToggleLight = toggleLight;

      // Paneo con el ratón / arrastre táctil
      const onMove = (e) => {
        if (isJumpscaring || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? rect.width / 2;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? rect.height / 2;
        const normX = (clientX - rect.left) / rect.width;
        const normY = (clientY - rect.top) / rect.height;
        targetPanX = (normX - 0.5) * -100;

        const activeUndiscovered = targetAnomalies.filter(id => !foundAnomalies.has(id));
        const hit = hitTestAnomaly(CAMS[cur].id, normX, normY, activeUndiscovered);
        if (hit && reticle) {
          reticle.classList.remove('hidden');
          reticle.style.left = `${normX * 100}%`;
          reticle.style.top = `${normY * 100}%`;
          reticle.style.width = `${hit.rect.w * rect.width + 20}px`;
          reticle.style.height = `${hit.rect.h * rect.height + 20}px`;
        } else if (reticle) {
          reticle.classList.add('hidden');
        }
      };

      if (canvas) {
        canvas.onmousemove = onMove;
        canvas.ontouchmove = onMove;
      }

      // Clic para registrar anomalía
      const onClick = (e) => {
        if (isJumpscaring || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? rect.width / 2;
        const clientY = e.clientY ?? e.changedTouches?.[0]?.clientY ?? rect.height / 2;
        const normX = (clientX - rect.left) / rect.width;
        const normY = (clientY - rect.top) / rect.height;

        const activeUndiscovered = targetAnomalies.filter(id => !foundAnomalies.has(id));
        const hit = hitTestAnomaly(CAMS[cur].id, normX, normY, activeUndiscovered);
        if (hit) {
          foundAnomalies.add(hit.id);
          this.audio.cctvAlert();
          updateAnomalyCount();
          if (reticle) reticle.classList.add('hidden');
          onAnomalyFound?.(hit, foundAnomalies.size, targetAnomalies.length);
          sync();
        }
      };

      if (canvas) canvas.onclick = onClick;

      // Secuencia de jumpscare en la cámara 5
      const triggerJumpscare = () => {
        isJumpscaring = true;
        this.cctvState.jumpscareActive = true;
        this.audio.jumpscare();
        this.shakeCam(1.4);
        let jStart = performance.now();
        const jAnim = (now) => {
          const elapsed = (now - jStart) / 1000;
          this.cctvState.jumpscareProgress = Math.min(1.0, elapsed / 1.1);
          if (elapsed < 1.3) {
            requestAnimationFrame(jAnim);
          } else {
            finish({ jumpscare: true });
          }
        };
        requestAnimationFrame(jAnim);
      };

      // Bucle de dibujo
      this.cctvDraw = (t) => {
        panX += (targetPanX - panX) * 0.12;
        drawFeed(canvas, CAMS[cur], t, this.cctvState, panX, lightOn);
      };

      const finish = (resultMeta = {}) => {
        if (tk !== this.run) return;
        this.closeCctv = null;
        this.cctvDraw = null;
        this.cctvToggleLight = null;
        if (canvas) {
          canvas.onmousemove = null;
          canvas.ontouchmove = null;
          canvas.onclick = null;
        }
        if (lightBtn) lightBtn.onclick = null;
        if (reticle) reticle.classList.add('hidden');
        if (alertBanner) alertBanner.classList.add('hidden');
        this.audio.cctvFlip();
        show('cctv', false);
        show('touch-ui', this.input.isTouch);
        this._closeUi();
        res({
          viewed: [...viewed],
          foundAnomalies: [...foundAnomalies],
          jumpscare: !!resultMeta.jumpscare,
        });
      };

      this.closeCctv = () => finish();
      if (closeBtn) closeBtn.onclick = () => finish();

      this.waiters.push({ cond: () => false, rej, tk, res() {}, t: 0, timeout: Infinity });
    });
  }

  qte(code, label = '¡ESQUIVA!', ms = 1500) {
    return new Promise((res, rej) => {
      const tk = this.run; const names = { KeyA: 'A', KeyD: 'D', Space: 'ESPACIO', KeyW: 'W', KeyS: 'S' };
      $('qte-key').textContent = names[code] || code; $('qte-label').textContent = label;
      show('qte', true); let t = 0; const bar = $('qte-bar').firstElementChild; this.audio.qte();
      const done = ok => { if (tk !== this.run) return; this.qteCb = null; show('qte', false); res(ok); };
      this.qteCode = code; this.qteCb = done; $('qte-key').onpointerdown = e => { e.preventDefault(); done(true); };
      this.waiters.push({ cond: dt => { t += dt * 1000; bar.style.width = Math.max(0, 100 - t / ms * 100) + '%'; if (t >= ms) { done(false); return true; } return false; }, res() {}, rej, tk, t: 0, timeout: Infinity });
    });
  }

  // ----- cinemáticas de flashbacks estilo VHS 1984
  flashback(sceneId, meta = {}, duration = 5.5) {
    return new Promise((res, rej) => {
      const tk = this.run;
      this._openUi();
      this.audio.vhsPlay();
      this.audio.braam();
      if (sceneId === 'phone_rain') this.audio.thunder();
      if (sceneId === 'scalpel') this.audio.flatline(4.0);

      show('flashback', true);
      this.flashbackPlayer.play(sceneId, meta);

      let finished = false;
      const finish = () => {
        if (finished || tk !== this.run) return;
        finished = true;
        this.skipFlashback = null;
        this.flashbackPlayer.stop();
        show('flashback', false);
        this._closeUi();
        res();
      };

      this.skipFlashback = finish;
      $('flashback').onclick = finish;

      this.waiters.push({
        cond: dt => {
          if (this.flashbackPlayer.t >= duration) {
            finish();
            return true;
          }
          return false;
        },
        res() {},
        rej,
        tk,
        t: 0,
        timeout: Infinity,
      });
    });
  }

  // ----- escondites (lockers) estilo Resident Evil
  enterHiding(spot) {
    if (this.isHiding) return;
    this.isHiding = true;
    this.breath = 1.0;
    this.holdingBreath = false;
    this.gaspCd = 0;
    this.hidingReturnPos = this.player.pos.clone();
    this.hidingReturnYaw = this.player.yaw;
    this.audio.lockerHide();
    this.player.flashOn = false;
    this.player.pos.set(spot.x * S, 1.45, spot.z * S);
    this.player.yaw = ((spot.rot || 0) + 180) * Math.PI / 180;
    show('hiding', true);
    show('hud', false);
    show('touch-ui', false);
  }

  exitHiding() {
    if (!this.isHiding) return;
    this.isHiding = false;
    this.holdingBreath = false;
    this.audio.lockerExit();
    if (this.hidingReturnPos) {
      this.player.pos.copy(this.hidingReturnPos);
      this.player.yaw = this.hidingReturnYaw;
    }
    show('hiding', false);
    show('hud', true);
    show('touch-ui', this.input.isTouch);
  }

  // ----- fantasmas / sustos
  async jumpscare() {
    this.audio.screech(); this.flash(0.9); this.shake = 1;
    const g = this.ghost, p = this.player, fw = p.forward;
    g.appear(this.hospital.floorNum, (p.pos.x + fw.x * 2.4) / S, (p.pos.z + fw.z * 2.4) / S, 'stand', false); g.visibleFlag = true;
    await this.sleep(0.7); g.vanish();
  }
  catchPlayer() {
    if (this.frozen || this.state !== 'play' || this.isHiding) return;
    this.audio.screech(); this.flash(0.95); this.shake = 1; this.frozen = true;
    const cp = this.checkpoint;
    (async () => {
      try {
        await this.sleep(0.9); await this.fade(1, 0.5);
        this.ghost.vanish();
        const c = this.catchSpot || cp || { floor: 1, cx: 5, cz: 6, yaw: Math.PI / 2 };
        if (c.floor !== this.hospital.floorNum) this.toFloorInstant(c.floor, c.cx, c.cz, c.yaw); else this.player.setPos(c.cx, c.cz, c.yaw);
        await this.sleep(0.4); await this.fade(0, 0.6); this.frozen = false;
        this.onCaught?.();
      } catch (e) { if (e !== CANCEL) console.error(e); }
    })();
  }
  ambient(level) { this.ambientLevel = level; }

  // ------------------------------------------------------------------ interacción
  interact() {
    if (this.isHiding) return this.exitHiding();
    const it = this.player.findInteractable(); if (!it) return;
    if (it.inUse) return;
    if (it.kind === 'hiding') return this.enterHiding(it.spot);
    if (it.kind === 'door') return this.useDoor(it.door);
    if (it.kind === 'stairs') {
      if (this.stairsBlocked) { this.audio.locked(); this.say(typeof this.stairsBlocked === 'string' ? this.stairsBlocked : 'No debería subir ahora.', 'Clara', { thought: true }); return; }
      const t = it.stair.target; this.audio.step(0.3);
      this.toFloor(t.floor, t.x, t.z, t.yaw).then(() => this.onFloorChange?.(t.floor));
      return;
    }
    this.audio.qte();
    if (it.once) {
      this.hospital.remove(it.id);
      this.extra = this.extra.filter(e => e.id !== it.id);
    }
    it.inUse = true;
    const p = it.onUse?.(this);
    if (p && typeof p.then === 'function') {
      p.then(() => {
        it.inUse = false;
        (this.useWaiters?.[it.id] || []).splice(0).forEach(w => w.res());
      }).catch(err => {
        it.inUse = false;
        if (err !== CANCEL) console.error(err);
        (this.useWaiters?.[it.id] || []).splice(0).forEach(w => w.res());
      });
    } else {
      it.inUse = false;
      (this.useWaiters?.[it.id] || []).splice(0).forEach(w => w.res());
    }
  }

  async useDoor(d) {
    if (d.lock && !this.flags['unlock:' + d.lock] ) {
      const h = this.lockHandlers[d.lock];
      if (!h) { this.audio.locked(); this.say('Está cerrada con llave.', 'Clara', { thought: true }); return; }
      const ok = await h(d); if (!ok) return;
      this.flags['unlock:' + d.lock] = true; d.lock = null; d.open = true; this.audio.door(); return;
    }
    if (d.isExit && !d.open) { this.audio.locked(); return; }
    d.open = !d.open; this.audio.door(); this.player.noise = 8;
  }

  // ------------------------------------------------------------------ bucle
  update(dt, t) {
    this.time += dt;
    // waiters
    for (let i = this.waiters.length - 1; i >= 0; i--) {
      const w = this.waiters[i];
      if (w.tk !== this.run) { this.waiters.splice(i, 1); w.res?.(); continue; }
      if (this.state === 'paused') continue;
      if (w.cond(dt)) { this.waiters.splice(i, 1); w.res(); }
    }
    if (this.state === 'menu' || this.state === 'end') return;
    if (this.state === 'paused') return;

    // cámara guiada
    if (this.look) {
      const L = this.look; L.t += dt; const k = Math.min(1, L.t / L.d), e = k * k * (3 - 2 * k);
      this.player.yaw = L.y0 + (L.y1 - L.y0) * e; this.player.pitch = L.p0 + (L.p1 - L.p0) * e;
      if (k >= 1) { this.look = null; L.res(); }
    }

    const frozen = this.frozen || this.state === 'ui';
    this.hospital.update(dt);
    this.ghost.update(dt, this.player, t);
    for (const a of Object.values(this.actors || {})) a.step(dt, t);
    this.ambientEvents(dt);
    this.autoTour?.update(dt, t);

    // tensión y audio
    const g = this.ghost; const vis = g.mesh.visible && g.floor === this.hospital.floorNum;
    const d = vis ? g.dist : 99;
    const tension = g.mode === 'chase' ? 0.6 + Math.max(0, 1 - d / 14) * 0.4 : vis ? Math.max(0, 1 - d / 10) * 0.5 : 0;
    this.audio.update(dt, this.camera, g.pos, g.mode === 'chase' && vis, tension);
    $('fx-danger').style.opacity = tension * 0.85;

    // Pulso cardíaco para el shader cinematográfico de post-procesado
    let heartRate = tension > 0.5 ? 9.0 : tension > 0.2 ? 6.5 : 3.5;
    if (this.isHiding && (this.breath < 0.3 || this.gaspCd > 0)) heartRate = 10.0;
    const pulseFactor = (tension > 0.15 || (this.isHiding && this.breath < 0.4)) ? Math.max(0, Math.sin(t * heartRate)) : 0;
    this.heartPulse = pulseFactor * (tension > 0 ? tension : 0.45);

    this.player.update(dt, t, frozen || !!this.look, d, tension);

    // Renderizado 3D de estudio para el examinador de objetos si está activo
    if (this.examiner?.active) {
      this.examiner.render(dt);
    }

    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.12;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.12;
      this.shake = Math.max(0, this.shake - dt * 0.9);
    }

    // interacción
    if (this.state === 'play' && !this.frozen && this.input.wasPressed('KeyE')) this.interact();
    // HUD
    $('bar-battery').style.width = (this.player.battery * 100) + '%';
    $('bar-stamina').style.width = (this.player.stamina * 100) + '%';
    $('bar-stamina').style.opacity = this.player.exhausted ? 0.45 : 1;
    const it = this.state === 'play' && !this.frozen ? this.player.findInteractable() : null;
    $('tb-act').classList.toggle('ready', !!it);
    const pr = $('prompt');
    if (it) { const lab = typeof it.label === 'function' ? it.label() : it.label; pr.textContent = `[E] ${it.kind === 'door' && it.door.open ? 'Cerrar' : it.kind === 'door' ? 'Abrir' : ''} ${lab}`.replace('  ', ' '); pr.classList.remove('hidden'); }
    else pr.classList.add('hidden');
    $('state-tag').textContent = (this.isHiding ? 'OCULTA EN CASILLERO · ' : this.player.crouch ? 'AGACHADA · ' : '') + (this.player.hasFlash && !this.player.flashOn ? 'LINTERNA APAGADA' : '');
    if (this.cctvDraw) this.cctvDraw(t);
    if (this.flashbackPlayer.active) this.flashbackPlayer.render(dt);

    if (this.isHiding) {
      this.gaspCd = Math.max(0, (this.gaspCd || 0) - dt);
      const wantHold = (this.input.down('Space') || this.touchHoldingBreath) && this.gaspCd <= 0;
      if (wantHold) {
        if (!this.holdingBreath) {
          this.audio.inhale();
          this.holdingBreath = true;
        }
        this.breath = Math.max(0, (this.breath ?? 1) - dt * 0.17);
        if (this.breath <= 0) {
          this.holdingBreath = false;
          this.gaspCd = 1.8;
          this.audio.gasp();
          this.shakeCam(0.35);
        }
      } else {
        if (this.holdingBreath) {
          this.holdingBreath = false;
        }
        this.breath = Math.min(1.0, (this.breath ?? 1) + dt * 0.32);
      }

      const barBreath = $('bar-breath');
      if (barBreath) {
        barBreath.style.width = (this.breath * 100) + '%';
        barBreath.style.background = this.breath < 0.25 ? '#ef4444' : 'linear-gradient(90deg, #38bdf8, #818cf8)';
      }

      const breathLbl = $('hiding-breath-label');
      if (breathLbl) {
        breathLbl.textContent = this.gaspCd > 0
          ? '¡SIN AIRE! RECUPERANDO EL ALIENTO...'
          : this.holdingBreath
            ? 'CONTENIENDO RESPIRACIÓN... [ESPACIO]'
            : 'RESPIRACIÓN · Mantén [ESPACIO] para contener';
        breathLbl.style.color = this.gaspCd > 0 ? '#ef4444' : this.holdingBreath ? '#38bdf8' : 'var(--amber)';
      }

      this.hidingHeartTimer = (this.hidingHeartTimer || 0) - dt;
      if (this.hidingHeartTimer <= 0) {
        this.audio.heartbeat(this.holdingBreath ? 0.35 : 0.65);
        this.hidingHeartTimer = this.holdingBreath ? 1.05 : 0.75;
      }
    }
  }

  ambientEvents(dt) {
    if (this.ambientLevel <= 0 || this.state !== 'play') return;
    this.ambT -= dt; if (this.ambT > 0) return;
    this.ambT = 9 + Math.random() * 12 - this.ambientLevel * 2;
    const r = Math.random(), a = this.audio, p = this.player;
    if (r < 0.20) {
      // Relámpago en ventanales y retumbar de trueno distante
      this.flash(0.32);
      setTimeout(() => a.thunder(), 1100);
    }
    else if (r < 0.45) {
      a.setPannerPosition(p.pos.x + (Math.random() - 0.5) * 18, 1.2, p.pos.z + (Math.random() - 0.5) * 18);
      for (let i = 0; i < 6; i++) setTimeout(() => a.entityStep(), i * 520);
    }
    else if (r < 0.65) {
      this.hospital.flicker(1.8);
      a.spark();
      a.thump();
    }
    else if (r < 0.78 && this.ambientLevel >= 2) { a.knock(); }
    else if (r < 0.88 && this.ambientLevel >= 2) { a.whisper(); }
    else if (this.ambientLevel >= 3) { this.hospital.blackout(2.5); a.cry(2); }
    else a.door();
  }
}
