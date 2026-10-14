export class AudioManager {
  constructor() { this.ctx = null; this.heartT = 0; this.tension = 0; }

  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(ctx.destination);

    // buffer de ruido
    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

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

  step(vol = 0.25) { this.noiseBurst(0.09, vol * 0.8, 350); }
  pickup() { this.tone(660, 0.18, 'sine', 0.25); setTimeout(() => this.tone(990, 0.3, 'sine', 0.2), 90); }
  paper() { this.noiseBurst(0.25, 0.2, 3000, 'highpass'); }
  battery() { this.tone(300, 0.15, 'square', 0.12); setTimeout(() => this.tone(450, 0.2, 'square', 0.12), 100); }
  door() { this.tone(110, 0.55, 'sawtooth', 0.07, 70); this.noiseBurst(0.3, 0.1, 500, 'bandpass'); }
  locked() { this.tone(90, 0.1, 'square', 0.2); setTimeout(() => this.tone(80, 0.12, 'square', 0.2), 120); }
  thump() { this.tone(70, 0.5, 'sine', 0.9, 30); this.noiseBurst(0.3, 0.4, 200); }
  knock() { [0, 160, 330].forEach(t => setTimeout(() => { this.tone(120, 0.12, 'sine', 0.6, 60); this.noiseBurst(0.08, 0.4, 600); }, t)); }
  growl() { this.tone(70, 1.0, 'sawtooth', 0.35, 35); this.tone(140, 0.9, 'sawtooth', 0.15, 60); }
  screech() { this.tone(500, 0.8, 'sawtooth', 0.5, 1800); this.noiseBurst(0.9, 0.7, 3000, 'highpass'); this.thump(); }
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.8, 'sine', 0.2), i * 180)); }
  entityStep() { if (this.ctx) this.noiseBurst(0.12, 0.9, 260, 'lowpass', this.panner); }
  ring() { if (!this.ctx) return; [0, 220, 440, 660].forEach(t => setTimeout(() => { this.tone(1400, 0.16, 'square', 0.12); this.tone(1100, 0.16, 'square', 0.1); }, t)); }
  pickupPhone() { this.noiseBurst(0.15, 0.25, 900, 'bandpass'); }
  breath(secs = 3) {
    if (!this.ctx) return;
    for (let i = 0; i < secs; i++) {
      setTimeout(() => this.noiseBurst(0.9, 0.45, 700, 'bandpass'), i * 1300);
      setTimeout(() => this.noiseBurst(0.7, 0.3, 500, 'bandpass'), i * 1300 + 650);
    }
  }
  cry(secs = 4) {
    if (!this.ctx) return;
    for (let i = 0; i < secs * 2; i++) setTimeout(() => this.tone(520 + Math.random() * 120, 0.4, 'sine', 0.16, 380 + Math.random() * 80), i * 450);
  }
  whisper() { this.noiseBurst(1.2, 0.35, 2600, 'bandpass'); }
  ding() { this.tone(880, 0.9, 'sine', 0.2); }
  slam() { this.thump(); this.noiseBurst(0.25, 0.7, 1200); }
  qte() { this.tone(180, 0.15, 'square', 0.25); }
  static_() { this.noiseBurst(0.6, 0.3, 4000, 'highpass'); }

  heartbeat(vol) {
    this.tone(55, 0.14, 'sine', vol, 35);
    setTimeout(() => this.tone(50, 0.16, 'sine', vol * 0.8, 32), 170);
  }

  update(dt, camera, ghostPos, chasing, tension) {
    if (!this.ctx) return;
    const l = this.ctx.listener, p = camera.position;
    const fw = { x: -Math.sin(camera.rotation.y), z: -Math.cos(camera.rotation.y) };
    if (l.positionX) {
      l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z;
      l.forwardX.value = fw.x; l.forwardY.value = 0; l.forwardZ.value = fw.z;
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    }
    this.panner.positionX.value = ghostPos.x; this.panner.positionY.value = 1.2; this.panner.positionZ.value = ghostPos.z;
    this.entityGain.gain.value += ((chasing ? 0.55 : 0.0) - this.entityGain.gain.value) * Math.min(1, dt * 2);
    this.droneGain.gain.value += ((0.09 + tension * 0.25) - this.droneGain.gain.value) * Math.min(1, dt * 1.5);
    this.tension = tension;
    this.heartT -= dt;
    if (tension > 0.12 && this.heartT <= 0) {
      this.heartbeat(0.25 + tension * 0.6);
      this.heartT = 1.15 - tension * 0.7;
    }
  }
}
