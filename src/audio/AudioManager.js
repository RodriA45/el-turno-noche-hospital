export class AudioManager {
  constructor() { this.ctx = null; this.heartT = 0; this.tension = 0; }

  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const resumeAudio = () => {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    };
    window.addEventListener('touchstart', resumeAudio, { passive: true });
    window.addEventListener('pointerdown', resumeAudio, { passive: true });

    const savedVol = localStorage.getItem('hospital_vol');
    const initVol = savedVol !== null ? Math.max(0, Math.min(1, +savedVol)) : 0.85;
    this.master = ctx.createGain(); this.master.gain.value = initVol; this.master.connect(ctx.destination);

    // Buffer de ruido
    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // Reverberación convolutiva acústica del hospital (pasillos largos de linóleo y techos altos)
    try {
      const revLen = Math.floor(ctx.sampleRate * 2.2);
      const revBuf = ctx.createBuffer(2, revLen, ctx.sampleRate);
      const chL = revBuf.getChannelData(0), chR = revBuf.getChannelData(1);
      for (let i = 0; i < revLen; i++) {
        const decay = Math.exp(-i / (ctx.sampleRate * 0.42));
        chL[i] = (Math.random() * 2 - 1) * decay;
        chR[i] = (Math.random() * 2 - 1) * decay;
        // Reflexiones tempranas marcadas de paredes de azulejos
        if (i === Math.floor(ctx.sampleRate * 0.018)) { chL[i] += 0.45; chR[i] += 0.35; }
        if (i === Math.floor(ctx.sampleRate * 0.034)) { chL[i] += 0.35; chR[i] += 0.42; }
        if (i === Math.floor(ctx.sampleRate * 0.062)) { chL[i] += 0.28; chR[i] += 0.30; }
      }
      this.convolver = ctx.createConvolver();
      this.convolver.buffer = revBuf;
      this.reverbSend = ctx.createGain();
      this.reverbSend.gain.value = 0.32;
      this.reverbReturn = ctx.createGain();
      this.reverbReturn.gain.value = 0.45;
      this.reverbSend.connect(this.convolver);
      this.convolver.connect(this.reverbReturn);
      this.reverbReturn.connect(this.master);
    } catch (e) {
      this.reverbSend = this.master;
    }

    // Drone ambiental
    const droneGain = this.droneGain = ctx.createGain(); droneGain.gain.value = 0.10;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 48;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 48.7;
    const o3 = ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 72.3;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 70;
    lfo.connect(lfoG); lfoG.connect(lp.frequency);
    [o1, o2, o3].forEach(o => { o.connect(lp); o.start(); }); lfo.start();
    lp.connect(droneGain); droneGain.connect(this.master);

    // Viento
    const wind = ctx.createBufferSource(); wind.buffer = this.noiseBuf; wind.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 400; wf.Q.value = 0.6;
    const wl = ctx.createOscillator(); wl.frequency.value = 0.11;
    const wlg = ctx.createGain(); wlg.gain.value = 250; wl.connect(wlg); wlg.connect(wf.frequency); wl.start();
    const wg = ctx.createGain(); wg.gain.value = 0.05;
    wind.connect(wf); wf.connect(wg); wg.connect(this.master); wind.start();

    // Entidad espacial
    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF'; this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 2; this.panner.rolloffFactor = 1.4;
    this.panner.connect(this.master);
    const eo = ctx.createOscillator(); eo.type = 'sawtooth'; eo.frequency.value = 38;
    const ef = ctx.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 140;
    this.entityGain = ctx.createGain(); this.entityGain.gain.value = 0;
    eo.connect(ef); ef.connect(this.entityGain); this.entityGain.connect(this.panner); eo.start();
  }

  _env(node, vol, dur) {
    const g = this.ctx.createGain(); const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g); return g;
  }

  tone(freq, dur, type = 'sine', vol = 0.3, endFreq = null, dest = null) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + dur);
    const g = this._env(o, vol, dur); g.connect(dest || this.master);
    o.start(); o.stop(this.ctx.currentTime + dur + 0.05);
  }

  noiseBurst(dur, vol, freq = 800, type = 'lowpass', dest = null) {
    if (!this.ctx) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    s.connect(f); const g = this._env(f, vol, dur); g.connect(dest || this.master);
    s.start(0, Math.random()); s.stop(this.ctx.currentTime + dur + 0.05);
  }

  step(vol = 0.25) {
    if (!this.ctx) return;
    // Paso realista sobre linóleo de hospital: golpe de taco de goma + palmada de suela + resonancia de pasillo
    const t = this.ctx.currentTime;
    const isLeft = Math.random() > 0.5;
    const pitch = isLeft ? 110 : 95;
    // Golpe de talón
    this.tone(pitch, 0.06, 'triangle', vol * 0.7, pitch * 0.6);
    // Fricción de la suela en la baldosa
    this.noiseBurst(0.04, vol * 0.45, isLeft ? 1400 : 1150, 'bandpass');
    // Resonancia acústica del suelo
    setTimeout(() => {
      this.noiseBurst(0.08, vol * 0.18, 380, 'lowpass');
    }, 25);
  }

  flashClick() {
    if (!this.ctx) return;
    // Clic metálico táctil de interruptor de linterna pesada
    this.noiseBurst(0.02, 0.4, 3200, 'highpass');
    this.tone(1800, 0.03, 'square', 0.15, 600);
    setTimeout(() => {
      this.noiseBurst(0.03, 0.3, 1800, 'bandpass');
      this.tone(850, 0.04, 'sine', 0.12, 400);
    }, 35);
  }

  pickup() {
    this.tone(580, 0.12, 'sine', 0.22, 750);
    setTimeout(() => this.tone(880, 0.22, 'sine', 0.25, 1100), 80);
    this.noiseBurst(0.06, 0.15, 2000, 'bandpass');
  }

  paper() {
    // Crujido realista de expediente de papel seco
    this.noiseBurst(0.12, 0.35, 2400, 'bandpass');
    setTimeout(() => this.noiseBurst(0.18, 0.3, 1800, 'highpass'), 60);
    setTimeout(() => this.noiseBurst(0.1, 0.2, 3200, 'bandpass'), 150);
  }

  battery() {
    this.tone(440, 0.12, 'sine', 0.15, 550);
    setTimeout(() => this.tone(660, 0.16, 'sine', 0.18, 880), 90);
  }

  door() {
    // Puerta de hospital pesada: crujido de bisagra metálica + pestillo
    this.tone(140, 0.38, 'sawtooth', 0.08, 90);
    this.noiseBurst(0.25, 0.12, 600, 'bandpass');
    setTimeout(() => {
      // Chasquido de pestillo al encastrar
      this.noiseBurst(0.04, 0.25, 1800, 'highpass');
      this.tone(320, 0.05, 'triangle', 0.15, 120);
    }, 280);
  }

  locked() {
    // Pomo trabado forcejeando contra marco metálico
    this.noiseBurst(0.05, 0.35, 800, 'bandpass');
    this.tone(85, 0.08, 'square', 0.22, 60);
    setTimeout(() => {
      this.noiseBurst(0.06, 0.4, 750, 'bandpass');
      this.tone(75, 0.1, 'square', 0.25, 50);
    }, 110);
  }

  thump() {
    this.tone(55, 0.6, 'sine', 0.95, 24);
    this.noiseBurst(0.35, 0.5, 180, 'lowpass');
  }

  knock() {
    // Tres golpes secos contra madera o cristal blindado
    [0, 180, 360].forEach(t => setTimeout(() => {
      this.tone(135, 0.09, 'sine', 0.75, 50);
      this.noiseBurst(0.06, 0.45, 900, 'bandpass');
    }, t));
  }

  growl() {
    this.tone(65, 1.2, 'sawtooth', 0.4, 30);
    this.tone(130, 1.0, 'sawtooth', 0.2, 50);
    this.noiseBurst(0.9, 0.25, 300, 'lowpass');
  }

  screech() {
    this.tone(650, 0.9, 'sawtooth', 0.6, 2200);
    this.noiseBurst(1.1, 0.75, 3500, 'highpass');
    this.thump();
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.8, 'sine', 0.2), i * 180));
  }

  entityStep() {
    if (this.ctx) {
      this.noiseBurst(0.14, 0.95, 240, 'lowpass', this.panner);
      this.tone(48, 0.12, 'sine', 0.5, 28, this.panner);
    }
  }

  ring() {
    if (!this.ctx) return;
    // Timbre electromecánico de teléfono analógico de baquelita
    [0, 240, 480, 720].forEach(t => setTimeout(() => {
      this.tone(1450, 0.14, 'square', 0.14);
      this.tone(1220, 0.14, 'square', 0.12);
      this.noiseBurst(0.08, 0.06, 3000, 'highpass');
    }, t));
  }

  pickupPhone() {
    this.noiseBurst(0.18, 0.35, 850, 'bandpass');
    this.tone(280, 0.08, 'triangle', 0.12, 140);
  }

  breath(secs = 3) {
    if (!this.ctx) return;
    for (let i = 0; i < secs; i++) {
      setTimeout(() => this.noiseBurst(0.95, 0.5, 650, 'bandpass'), i * 1300);
      setTimeout(() => this.noiseBurst(0.75, 0.35, 450, 'bandpass'), i * 1300 + 650);
    }
  }

  cry(secs = 4) {
    if (!this.ctx) return;
    for (let i = 0; i < secs * 2; i++) {
      setTimeout(() => this.tone(520 + Math.random() * 120, 0.45, 'sine', 0.18, 360 + Math.random() * 80), i * 450);
    }
  }

  whisper() {
    this.noiseBurst(1.4, 0.4, 2400, 'bandpass');
    this.tone(190, 0.8, 'sine', 0.12, 120);
  }

  ding() {
    this.tone(920, 1.1, 'sine', 0.22);
  }

  slam() {
    this.thump();
    this.noiseBurst(0.3, 0.8, 1400);
    this.tone(38, 0.9, 'sine', 0.7, 18);
  }

  qte() {
    this.tone(220, 0.18, 'sawtooth', 0.3, 90);
  }

  static_() {
    this.noiseBurst(0.7, 0.35, 4500, 'highpass');
  }

  heartbeat(vol) {
    // Latido bifásico visceral lub-dub
    const v = Math.min(1.0, vol);
    this.tone(48, 0.14, 'sine', v * 0.95, 28);
    this.tone(28, 0.22, 'sine', v * 0.8, 18);
    setTimeout(() => {
      this.tone(56, 0.12, 'sine', v * 0.75, 34);
      this.tone(34, 0.18, 'sine', v * 0.6, 22);
    }, 160);
  }

  // Efectos de sonido cinematográficos AAA estilo Resident Evil / VHS
  braam() {
    if (!this.ctx) return;
    this.tone(48, 2.2, 'sawtooth', 0.65, 26);
    this.tone(96, 1.8, 'sawtooth', 0.35, 32);
    this.noiseBurst(0.8, 0.45, 180, 'lowpass');
  }

  vhsPlay() {
    if (!this.ctx) return;
    // Clic de inserción de cinta y chasquido de cabezal analógico
    this.noiseBurst(0.08, 0.4, 2800, 'bandpass');
    setTimeout(() => this.tone(340, 0.25, 'triangle', 0.18, 120), 70);
    setTimeout(() => this.noiseBurst(0.35, 0.22, 1200, 'highpass'), 120);
  }

  thunder() {
    if (!this.ctx) return;
    this.noiseBurst(1.8, 0.55, 160, 'lowpass');
    this.tone(42, 1.4, 'sine', 0.6, 24);
  }

  flatline(duration = 2.4) {
    if (!this.ctx) return;
    this.tone(1150, duration, 'sine', 0.28);
  }

  lockerHide() {
    if (!this.ctx) return;
    // Chirrido metálico de bisagra y cierre del pestillo
    this.tone(280, 0.35, 'sawtooth', 0.15, 180);
    setTimeout(() => {
      this.thump();
      this.noiseBurst(0.12, 0.3, 400);
    }, 280);
  }

  lockerExit() {
    if (!this.ctx) return;
    this.tone(320, 0.12, 'sawtooth', 0.12, 420);
    this.noiseBurst(0.1, 0.2, 800);
  }

  cctvFlip() {
    if (!this.ctx) return;
    // Efecto de levantar/bajar monitor mecánico
    this.noiseBurst(0.15, 0.35, 600, 'bandpass');
    this.tone(140, 0.18, 'sine', 0.25, 90);
  }

  cctvBeep() {
    if (!this.ctx) return;
    // Bip digital de cambio de cámara estilo FNAF
    this.tone(1800, 0.04, 'sine', 0.2);
    setTimeout(() => this.tone(2400, 0.05, 'sine', 0.18), 35);
  }

  cctvLight() {
    if (!this.ctx) return;
    // Zumbido eléctrico de la luz de la cámara
    this.tone(120, 0.22, 'sawtooth', 0.18, 110);
    this.noiseBurst(0.08, 0.15, 1200);
  }

  cctvAlert() {
    if (!this.ctx) return;
    // Alarma urgente de anomalía detectada
    this.tone(950, 0.15, 'sawtooth', 0.3, 1150);
    setTimeout(() => this.tone(1150, 0.18, 'sawtooth', 0.35, 1400), 160);
  }

  jumpscare() {
    if (!this.ctx) return;
    // Golpe brutal de disonancia y estática para susto de cámara
    this.noiseBurst(0.9, 0.85, 2500, 'highpass');
    this.tone(850, 0.8, 'sawtooth', 0.7, 180);
    this.tone(920, 0.8, 'square', 0.6, 210);
    this.tone(55, 1.2, 'sine', 0.8, 30);
  }

  fnafGlitch() {
    if (!this.ctx) return;
    this.noiseBurst(0.25, 0.45, 1800);
    this.tone(340, 0.08, 'sawtooth', 0.2, 80);
  }

  setMasterVolume(v) {
    const val = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = val;
    localStorage.setItem('hospital_vol', val);
  }

  batteryPickup() {
    if (!this.ctx) return;
    // Clic metálico de pilas cargándose en la linterna + zumbido de capacitancia
    this.noiseBurst(0.04, 0.35, 3200, 'highpass');
    this.tone(750, 0.08, 'sine', 0.25, 1200);
    setTimeout(() => {
      this.noiseBurst(0.06, 0.3, 2400, 'bandpass');
      this.tone(1200, 0.12, 'sine', 0.28, 1600);
    }, 60);
  }

  spark() {
    if (!this.ctx) return;
    // Chisporroteo eléctrico de fluorescente parpadeando
    this.noiseBurst(0.04, 0.35, 4200, 'highpass');
    this.tone(120, 0.05, 'sawtooth', 0.15, 60);
    setTimeout(() => this.noiseBurst(0.03, 0.3, 3600, 'bandpass'), 25);
  }

  buzz(dur = 0.8) {
    if (!this.ctx) return;
    // Zumbido eléctrico de 50Hz de reactancia de tubo fluorescente
    this.tone(50, dur, 'sawtooth', 0.12, 50);
    this.tone(100, dur, 'sawtooth', 0.08, 100);
  }

  thunder() {
    if (!this.ctx) return;
    // Trueno distante: impacto sordo inicial seguido de retumbar grave resonante
    this.noiseBurst(0.6, 0.45, 160, 'lowpass');
    this.tone(42, 1.8, 'sine', 0.5, 20);
    setTimeout(() => {
      this.noiseBurst(1.8, 0.35, 120, 'lowpass');
      this.tone(32, 2.4, 'sine', 0.35, 18);
    }, 280);
    setTimeout(() => {
      this.noiseBurst(2.2, 0.2, 90, 'lowpass');
    }, 700);
  }

  inhale() {
    if (!this.ctx) return;
    // Inspiración contenida
    this.noiseBurst(0.4, 0.22, 550, 'bandpass');
  }

  gasp() {
    if (!this.ctx) return;
    // Exhalación/bocanada agitada al acabarse el aire
    this.noiseBurst(0.35, 0.45, 750, 'bandpass');
    setTimeout(() => this.noiseBurst(0.5, 0.3, 480, 'lowpass'), 80);
  }

  setPannerPosition(x, y, z) {
    if (!this.panner) return;
    try {
      if (this.panner.positionX) {
        this.panner.positionX.value = x;
        this.panner.positionY.value = y;
        this.panner.positionZ.value = z;
      } else if (this.panner.setPosition) {
        this.panner.setPosition(x, y, z);
      }
    } catch (e) { /* ignore */ }
  }

  update(dt, camera, ghostPos, chasing, tension) {
    if (!this.ctx) return;
    try {
      const l = this.ctx.listener, p = camera.position;
      const fw = { x: -Math.sin(camera.rotation.y), z: -Math.cos(camera.rotation.y) };
      if (l.positionX) {
        l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z;
        l.forwardX.value = fw.x; l.forwardY.value = 0; l.forwardZ.value = fw.z;
        l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
      } else if (l.setPosition) {
        l.setPosition(p.x, p.y, p.z);
        l.setOrientation(fw.x, 0, fw.z, 0, 1, 0);
      }
      this.setPannerPosition(ghostPos.x, 1.2, ghostPos.z);
      this.entityGain.gain.value += ((chasing ? 0.55 : 0.0) - this.entityGain.gain.value) * Math.min(1, dt * 2);
      this.droneGain.gain.value += ((0.09 + tension * 0.25) - this.droneGain.gain.value) * Math.min(1, dt * 1.5);
      this.tension = tension;
      this.heartT -= dt;
      if (tension > 0.12 && this.heartT <= 0) {
        this.heartbeat(0.25 + tension * 0.6);
        this.heartT = 1.15 - tension * 0.7;
      }
    } catch (e) { /* ignore audio update glitch */ }
  }
}
