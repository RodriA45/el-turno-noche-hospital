// =========================================================================
// SISTEMA CINEMATOGRÁFICO DE FLASHBACKS Y VIDEOS VHS ARCHIVADOS (1984)
// Inspirado en cinemáticas de Fears to Fathom y juegos AAA de terror (Resident Evil / Silent Hill)
// =========================================================================

export class FlashbackPlayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.active = false;
    this.currentScene = null;
    this.t = 0;
    this.trackingY = 0;
    this.tapeNoise = [];
    for (let i = 0; i < 400; i++) {
      this.tapeNoise.push({ x: Math.random(), y: Math.random(), w: Math.random() * 8 + 2 });
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || window.innerWidth || 1280;
    const h = this.canvas.clientHeight || window.innerHeight || 720;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
  }

  play(sceneId, meta = {}) {
    this.resize();
    this.active = true;
    this.currentScene = sceneId;
    this.meta = {
      title: 'EVIDENCIA POLICIAL · EXPEDIENTE #84',
      date: 'OCT 14 1984 · 03:42:15 AM',
      location: 'HOSPITAL SAN ANSELMO · PISO 4',
      sub: '',
      ...meta,
    };
    this.t = 0;
  }

  stop() {
    this.active = false;
    this.currentScene = null;
  }

  render(dt) {
    if (!this.active) return;
    if (!this.canvas.width || !this.canvas.height) this.resize();
    this.t += dt;
    const g = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!w || !h) return;

    const t = this.t;

    // Fondo negro
    g.fillStyle = '#020304';
    g.fillRect(0, 0, w, h);

    // Dibujo de la escena procedural específica
    g.save();
    switch (this.currentScene) {
      case 'andrea':
        this.drawAndreaScene(g, w, h, t);
        break;
      case 'phone_rain':
        this.drawRainScene(g, w, h, t);
        break;
      case 'autopsy':
        this.drawAutopsyScene(g, w, h, t);
        break;
      case 'scalpel':
        this.drawScalpelScene(g, w, h, t);
        break;
      case 'timeloop':
        this.drawLoopScene(g, w, h, t);
        break;
      default:
        this.drawAndreaScene(g, w, h, t);
        break;
    }
    g.restore();

    // Efectos de cinta VHS: tracking, scanlines analógicas y grano
    this.drawVhsOverlay(g, w, h, t);

    // Bandas de aspecto cinemático (Cinemascope 2.39:1)
    const letterboxH = Math.max(16, h * 0.11);
    g.fillStyle = '#000000';
    g.fillRect(0, 0, w, letterboxH);
    g.fillRect(0, h - letterboxH, w, letterboxH);

    // Textos de archivo policial y sello de 1984
    this.drawHud(g, w, h, t, letterboxH);
  }

  // -------------------------------------------------------------------------
  // ESCENA 1: EL INCIDENTE DE ANDREA EN EL PISO 4 (1984)
  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // ESCENA 1: EL INCIDENTE DE ANDREA EN EL PISO 4 (1984) - ILUSTRACIÓN CINEMÁTICA AAA
  // -------------------------------------------------------------------------
  drawAndreaScene(g, w, h, t) {
    const vx = w * 0.52, vy = h * 0.44;
    const flicker = Math.sin(t * 14) * Math.cos(t * 7) > 0.3 ? 0.35 : 1.0;
    const redAlert = (Math.sin(t * 4.2) + 1) * 0.5 * flicker;

    // Fondo base del pasillo
    g.fillStyle = '#050203';
    g.fillRect(0, 0, w, h);

    // 1. Techo en perspectiva con paneles acústicos y tubos oxidados
    const ceilGrad = g.createLinearGradient(0, 0, 0, vy);
    ceilGrad.addColorStop(0, '#0a0808');
    ceilGrad.addColorStop(1, '#020101');
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(vx + w * 0.12, vy - h * 0.14); g.lineTo(vx - w * 0.12, vy - h * 0.14);
    g.closePath();
    g.fillStyle = ceilGrad;
    g.fill();

    // Lámpara de emergencia parpadeante colgando del techo
    const lampX = vx - w * 0.02, lampY = vy - h * 0.18;
    g.strokeStyle = '#181414';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(lampX, 0); g.lineTo(lampX, lampY); g.stroke();
    // Campana de luz roja
    g.fillStyle = `rgba(${180 + redAlert * 75}, 20, 20, ${0.75 + redAlert * 0.25})`;
    g.beginPath(); g.arc(lampX, lampY + 4, 8, 0, Math.PI * 2); g.fill();

    // 2. Paredes laterales en perspectiva con zócalo verde hospitalario sucio
    const wallLeft = g.createLinearGradient(0, h * 0.5, vx - w * 0.12, vy);
    wallLeft.addColorStop(0, `rgba(${32 + redAlert * 40}, 10, 12, 1)`);
    wallLeft.addColorStop(0.6, '#0f0c0d');
    wallLeft.addColorStop(1, '#020102');
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(vx - w * 0.12, vy - h * 0.14); g.lineTo(vx - w * 0.12, vy + h * 0.14); g.lineTo(0, h);
    g.closePath();
    g.fillStyle = wallLeft;
    g.fill();

    const wallRight = g.createLinearGradient(w, h * 0.5, vx + w * 0.12, vy);
    wallRight.addColorStop(0, `rgba(${28 + redAlert * 35}, 8, 10, 1)`);
    wallRight.addColorStop(0.6, '#0d0a0b');
    wallRight.addColorStop(1, '#020102');
    g.beginPath();
    g.moveTo(w, 0); g.lineTo(vx + w * 0.12, vy - h * 0.14); g.lineTo(vx + w * 0.12, vy + h * 0.14); g.lineTo(w, h);
    g.closePath();
    g.fillStyle = wallRight;
    g.fill();

    // Zócalos y molduras en las paredes
    g.strokeStyle = `rgba(${60 + redAlert * 50}, 18, 20, 0.65)`;
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, h * 0.62); g.lineTo(vx - w * 0.12, vy + h * 0.05); g.stroke();
    g.beginPath(); g.moveTo(w, h * 0.62); g.lineTo(vx + w * 0.12, vy + h * 0.05); g.stroke();

    // 3. Suelo de baldosas en perspectiva con reflejos húmedos
    const floorGrad = g.createLinearGradient(0, vy + h * 0.14, 0, h);
    floorGrad.addColorStop(0, '#040203');
    floorGrad.addColorStop(0.5, `rgba(${25 + redAlert * 30}, 8, 10, 1)`);
    floorGrad.addColorStop(1, `rgba(${45 + redAlert * 45}, 10, 12, 1)`);
    g.beginPath();
    g.moveTo(0, h); g.lineTo(w, h); g.lineTo(vx + w * 0.12, vy + h * 0.14); g.lineTo(vx - w * 0.12, vy + h * 0.14);
    g.closePath();
    g.fillStyle = floorGrad;
    g.fill();

    // Baldosas en damero proyectadas en perspectiva
    g.strokeStyle = `rgba(120, 30, 30, ${0.12 + redAlert * 0.18})`;
    g.lineWidth = 1.2;
    for (let i = -6; i <= 6; i++) {
      const bottomX = w * 0.5 + i * (w * 0.14);
      g.beginPath();
      g.moveTo(bottomX, h);
      g.lineTo(vx + i * (w * 0.018), vy + h * 0.14);
      g.stroke();
    }
    for (let r = 1; r <= 8; r++) {
      const k = Math.pow(r / 8, 2.2);
      const rowY = (vy + h * 0.14) + k * (h - (vy + h * 0.14));
      const rowW = (w * 0.24) + k * (w * 0.76);
      g.beginPath();
      g.moveTo(vx - rowW / 2, rowY);
      g.lineTo(vx + rowW / 2, rowY);
      g.stroke();
    }

    // 4. Puertas clausuradas con tablas de madera y sellos policiales a los costados
    for (const [side, x0, sign] of [['left', 0, 1], ['right', w, -1]]) {
      for (let d = 0; d < 3; d++) {
        const factor = (d + 1) / 4;
        const dw = (1 - factor) * (w * 0.08) + 12;
        const dh = (1 - factor) * (h * 0.44) + 40;
        const dx = side === 'left'
          ? (vx - w * 0.12) * factor
          : w - (w - (vx + w * 0.12)) * factor;
        const dy = vy + h * 0.14 * factor - dh * 0.65;

        // Marco de la puerta sellada
        g.fillStyle = '#060304';
        g.fillRect(dx - dw / 2, dy, dw, dh);
        // Tablas cruzadas
        g.strokeStyle = '#2c1e14';
        g.lineWidth = Math.max(2, dw * 0.12);
        g.beginPath();
        g.moveTo(dx - dw / 2, dy + 6); g.lineTo(dx + dw / 2, dy + dh - 6);
        g.moveTo(dx - dw / 2, dy + dh - 6); g.lineTo(dx + dw / 2, dy + 6);
        g.stroke();
      }
    }

    // 5. Linterna caída en el suelo en primer plano con cono de luz volumétrica
    const torchX = w * 0.28, torchY = h * 0.86;
    // Haz de luz volumétrico que corta la oscuridad hacia el fondo
    const beamGrad = g.createRadialGradient(torchX, torchY, 10, vx + 10, vy + 10, w * 0.55);
    beamGrad.addColorStop(0, 'rgba(255, 250, 220, 0.65)');
    beamGrad.addColorStop(0.35, 'rgba(240, 230, 180, 0.22)');
    beamGrad.addColorStop(0.7, 'rgba(180, 160, 120, 0.06)');
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.beginPath();
    g.moveTo(torchX, torchY);
    g.lineTo(vx - w * 0.16, vy - h * 0.08);
    g.lineTo(vx + w * 0.22, vy + h * 0.22);
    g.closePath();
    g.fillStyle = beamGrad;
    g.fill();

    // Cuerpo metálico de la linterna y halo
    g.fillStyle = '#9c8e6b';
    g.fillRect(torchX - 16, torchY - 5, 22, 10);
    g.fillStyle = '#fffae0';
    g.fillRect(torchX + 6, torchY - 6, 6, 12);

    // Llaves de hospital arrojadas en el suelo con reflejos dorados
    g.strokeStyle = '#c49a38';
    g.lineWidth = 2.5;
    g.beginPath(); g.arc(torchX - 35, torchY + 12, 7, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 3; k++) {
      const ang = k * 0.7 - 0.4;
      g.beginPath();
      g.moveTo(torchX - 35 + Math.cos(ang) * 7, torchY + 12 + Math.sin(ang) * 7);
      g.lineTo(torchX - 35 + Math.cos(ang) * 22, torchY + 12 + Math.sin(ang) * 22);
      g.stroke();
    }

    // 6. Silueta amenazante de la enfermera Andrea arrastrándose / cayendo de espaldas en pánico
    const ax = w * 0.38 + Math.sin(t * 1.2) * 3;
    const ay = h * 0.76;
    g.fillStyle = '#060506';

    // Falda y piernas caídas hacia el frente
    g.beginPath();
    g.moveTo(ax - 28, ay);
    g.lineTo(ax - 70, ay + 38);
    g.lineTo(ax - 30, ay + 55);
    g.lineTo(ax + 20, ay + 42);
    g.lineTo(ax + 18, ay - 10);
    g.closePath();
    g.fill();

    // Torso inclinado hacia atrás en terror
    g.beginPath();
    g.ellipse(ax - 6, ay - 42, 22, 34, -0.45, 0, Math.PI * 2);
    g.fill();

    // Brazo izquierdo apoyado en el piso para sostenerse
    g.lineWidth = 9;
    g.strokeStyle = '#060506';
    g.beginPath();
    g.moveTo(ax - 18, ay - 35);
    g.lineTo(ax - 48, ay - 10);
    g.lineTo(ax - 58, ay + 15);
    g.stroke();

    // Brazo derecho alzado protegiéndose el rostro con la mano abierta
    g.beginPath();
    g.moveTo(ax + 8, ay - 48);
    g.lineTo(ax + 32, ay - 85);
    g.lineTo(ax + 50, ay - 105);
    g.stroke();
    // Dedos tensos de la mano
    g.lineWidth = 3.5;
    for (let f = -2; f <= 2; f++) {
      g.beginPath();
      g.moveTo(ax + 50, ay - 105);
      g.lineTo(ax + 58 + f * 5, ay - 118 - Math.abs(f) * 2);
      g.stroke();
    }

    // Cabeza de perfil aterrorizada
    g.fillStyle = '#060506';
    g.beginPath();
    g.arc(ax - 10, ay - 88, 17, 0, Math.PI * 2);
    g.fill();
    // Moño de cabello recogido hacia atrás
    g.beginPath();
    g.arc(ax - 28, ay - 86, 9, 0, Math.PI * 2);
    g.fill();

    // Cofia clínica blanca de enfermera de los años 80 iluminada por el haz
    g.fillStyle = '#e4dfd0';
    g.beginPath();
    g.moveTo(ax - 18, ay - 102);
    g.lineTo(ax + 4, ay - 106);
    g.lineTo(ax + 6, ay - 96);
    g.lineTo(ax - 14, ay - 93);
    g.closePath();
    g.fill();
    // Cruz roja sutil en la cofia
    g.fillStyle = '#aa1c1c';
    g.fillRect(ax - 6, ay - 102, 6, 2);
    g.fillRect(ax - 4, ay - 104, 2, 6);

    // 7. La presencia espectral (El Ente del Piso 4) emergiendo al fondo del pasillo
    const dist = Math.min(1, t / 3.8);
    const gx = vx + (Math.sin(t * 1.5) * 4);
    const gy = vy + h * 0.12 - (dist * 12);
    const scale = 0.75 + dist * 0.35;

    // Niebla oscura y zarcillos que reptan desde la puerta 4
    g.fillStyle = 'rgba(0, 0, 0, 0.92)';
    g.beginPath();
    g.ellipse(gx, gy + 14, 38 * scale, 14 * scale, 0, 0, Math.PI * 2);
    g.fill();

    // Silueta alta y distorsionada del hermano gemelo
    g.beginPath();
    // Cuerpo espectral andrajoso
    g.moveTo(gx - 18 * scale, gy + 10);
    g.lineTo(gx - 22 * scale, gy - 65 * scale);
    g.lineTo(gx - 12 * scale, gy - 95 * scale);
    g.lineTo(gx + 12 * scale, gy - 95 * scale);
    g.lineTo(gx + 22 * scale, gy - 65 * scale);
    g.lineTo(gx + 18 * scale, gy + 10);
    g.closePath();
    g.fill();

    // Brazos anormalmente largos que cuelgan con garras
    g.lineWidth = 6 * scale;
    g.strokeStyle = '#000000';
    g.beginPath();
    g.moveTo(gx - 18 * scale, gy - 60 * scale);
    g.lineTo(gx - 32 * scale, gy - 20 * scale);
    g.lineTo(gx - 36 * scale, gy + 8 * scale);
    g.moveTo(gx + 18 * scale, gy - 60 * scale);
    g.lineTo(gx + 32 * scale, gy - 20 * scale);
    g.lineTo(gx + 36 * scale, gy + 8 * scale);
    g.stroke();

    // Cabeza encorvada
    g.beginPath();
    g.arc(gx, gy - 110 * scale, 14 * scale, 0, Math.PI * 2);
    g.fill();

    // Ojos bioluminiscentes espectrales sutiles y aterradores
    if (Math.sin(t * 12) > -0.6) {
      const eyeGlint = g.createRadialGradient(gx - 4 * scale, gy - 110 * scale, 1, gx - 4 * scale, gy - 110 * scale, 6 * scale);
      eyeGlint.addColorStop(0, '#ffffff');
      eyeGlint.addColorStop(0.4, 'rgba(180, 230, 255, 0.85)');
      eyeGlint.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = eyeGlint;
      g.beginPath(); g.arc(gx - 4 * scale, gy - 110 * scale, 5 * scale, 0, Math.PI * 2); g.fill();

      const eyeGlintR = g.createRadialGradient(gx + 4 * scale, gy - 110 * scale, 1, gx + 4 * scale, gy - 110 * scale, 6 * scale);
      eyeGlintR.addColorStop(0, '#ffffff');
      eyeGlintR.addColorStop(0.4, 'rgba(180, 230, 255, 0.85)');
      eyeGlintR.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = eyeGlintR;
      g.beginPath(); g.arc(gx + 4 * scale, gy - 110 * scale, 5 * scale, 0, Math.PI * 2); g.fill();
    }

    // 8. Mensaje ominoso ensangrentado sobre el muro superior
    if (t > 0.8) {
      const textAlpha = Math.min(0.9, (t - 0.8) * 0.9);
      g.fillStyle = `rgba(${175 + redAlert * 45}, 16, 16, ${textAlpha})`;
      g.font = `900 ${Math.round(w * 0.042)}px "Special Elite", monospace`;
      g.textAlign = 'center';
      g.shadowColor = 'rgba(0, 0, 0, 0.95)';
      g.shadowBlur = 14;
      g.fillText('NUNCA SUBAS AL PISO 4', w * 0.5, h * 0.28);
      g.shadowBlur = 0;
      g.textAlign = 'left';
    }
  }

  // -------------------------------------------------------------------------
  // ESCENA 2: LA LLAMADA DE LAS 02:30 AM BAJO LA TORMENTA
  // -------------------------------------------------------------------------
  drawRainScene(g, w, h, t) {
    const isLightning = Math.random() > 0.94 || (t % 2.5 < 0.12);

    // Cielo tormentoso y edificio del hospital
    g.fillStyle = isLightning ? '#607282' : '#080c10';
    g.fillRect(0, 0, w, h);

    // Fachada del Hospital San Anselmo en los años 80
    g.fillStyle = isLightning ? '#222830' : '#04070a';
    g.fillRect(w * 0.15, h * 0.22, w * 0.7, h * 0.55);

    // Ventanas del hospital (solo una encendida en el 4to piso)
    for (let floor = 0; floor < 4; floor++) {
      for (let win = 0; win < 8; win++) {
        const wx = w * 0.2 + win * (w * 0.075);
        const wy = h * 0.26 + floor * (h * 0.11);
        const is4thFloorForbidden = floor === 0 && win === 2;
        if (is4thFloorForbidden) {
          // Luz roja en la ventana del cuarto piso
          g.fillStyle = Math.sin(t * 12) > 0 ? '#ff2a2a' : '#550808';
        } else {
          g.fillStyle = isLightning ? 'rgba(255,255,255,0.4)' : '#081216';
        }
        g.fillRect(wx, wy, w * 0.045, h * 0.06);
      }
    }

    // Letrero del hospital
    g.fillStyle = isLightning ? '#dcd6b8' : '#283832';
    g.font = `bold ${Math.round(w * 0.026)}px "Special Elite", monospace`;
    g.fillText('HOSPITAL REGIONAL SAN ANSELMO · 1984', w * 0.22, h * 0.20);

    // Ambulancia clásica de los años 80 con baliza giratoria
    const ambX = w * 0.65;
    const ambY = h * 0.72;
    g.fillStyle = '#0f1418';
    g.fillRect(ambX, ambY, w * 0.22, h * 0.14);
    // Cruz roja
    g.fillStyle = '#991212';
    g.fillRect(ambX + w * 0.09, ambY + h * 0.04, w * 0.035, h * 0.018);
    g.fillRect(ambX + w * 0.098, ambY + h * 0.025, w * 0.018, h * 0.05);

    // Baliza roja giratoria que tiñe la lluvia
    const beacon = (Math.sin(t * 8) + 1) * 0.5;
    g.fillStyle = `rgba(255, 30, 30, ${beacon * 0.7})`;
    g.beginPath();
    g.arc(ambX + w * 0.11, ambY - 6, 40 * beacon + 8, 0, Math.PI * 2);
    g.fill();

    // Silueta de una persona empapada parada frente a la cabina telefónica
    const figX = w * 0.32;
    const figY = h * 0.82;
    g.fillStyle = '#020202';
    // Gabardina
    g.beginPath();
    g.ellipse(figX, figY - 70, 22, 55, 0, 0, Math.PI * 2);
    g.fill();
    // Cabeza con sombrero inclinado
    g.beginPath();
    g.arc(figX, figY - 130, 18, 0, Math.PI * 2);
    g.fill();
    g.fillRect(figX - 28, figY - 136, 56, 8); // ala del sombrero

    // Gotas de lluvia torrencial oblicua
    g.strokeStyle = isLightning ? 'rgba(255,255,255,0.7)' : 'rgba(160,200,225,0.35)';
    g.lineWidth = 1.5;
    g.beginPath();
    for (let i = 0; i < 180; i++) {
      const rx = (Math.sin(i * 99 + t * 40) * 0.5 + 0.5) * w;
      const ry = ((i * 17 + t * 650) % h);
      g.moveTo(rx, ry);
      g.lineTo(rx - 8, ry + 22);
    }
    g.stroke();

    // Gotas que resbalan por la lente de la cámara
    g.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 8; i++) {
      const lx = w * 0.12 * i + Math.sin(t + i) * 10;
      const ly = ((t * 80 + i * 140) % h);
      g.beginPath();
      g.arc(lx, ly, 6 + (i % 4), 0, Math.PI * 2);
      g.fill();
    }
  }

  // -------------------------------------------------------------------------
  // ESCENA 3: EL EXPEDIENTE CLÍNICO CONFIDENCIAL Y FOTOS DE LOS GEMELOS
  // -------------------------------------------------------------------------
  drawAutopsyScene(g, w, h, t) {
    // Fondo de escritorio de oficina de seguridad con expediente manila
    g.fillStyle = '#120f0c';
    g.fillRect(0, 0, w, h);

    // Carpeta de expediente amarillenta
    const foldX = w * 0.16, foldY = h * 0.15, foldW = w * 0.68, foldH = h * 0.7;
    g.fillStyle = '#cfbe8c';
    g.fillRect(foldX, foldY, foldW, foldH);
    // Borde gastado
    g.strokeStyle = '#85754f';
    g.lineWidth = 4;
    g.strokeRect(foldX, foldY, foldW, foldH);

    // Título del expediente
    g.fillStyle = '#1c1812';
    g.font = `bold ${Math.round(w * 0.024)}px "Special Elite", monospace`;
    g.fillText('MINISTERIO DE SALUD PÚBLICA · HOSPITAL SAN ANSELMO', foldX + 24, foldY + 36);
    g.font = `${Math.round(w * 0.016)}px "Special Elite", monospace`;
    g.fillText('INFORME DE AUTOPSIA N° 108-B · FECHA: 14/10/1984', foldX + 24, foldY + 64);

    // Dos fotos Polaroid de los hermanos gemelos idénticos
    const photoW = foldW * 0.32, photoH = foldH * 0.52;
    const p1X = foldX + 36, p1Y = foldY + 90;
    const p2X = foldX + foldW - photoW - 36, p2Y = foldY + 90;

    // Foto 1: Dr. Mateo Valenzuela
    g.fillStyle = '#f0ece0';
    g.fillRect(p1X, p1Y, photoW, photoH);
    g.fillStyle = '#222830';
    g.fillRect(p1X + 10, p1Y + 10, photoW - 20, photoH - 45);
    // Silueta del rostro médico con bata blanca
    g.fillStyle = '#dcd8cc';
    g.fillRect(p1X + 30, p1Y + 80, photoW - 60, photoH - 120);
    g.fillStyle = '#b88b68';
    g.beginPath();
    g.arc(p1X + photoW / 2, p1Y + 65, photoW * 0.22, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#111';
    g.font = `bold ${Math.round(w * 0.014)}px "Special Elite", monospace`;
    g.fillText('DR. MATEO VALENZUELA', p1X + 10, p1Y + photoH - 15);

    // Foto 2: Lucas Valenzuela (El gemelo asesinado - con rostro tachado en sangre)
    g.fillStyle = '#f0ece0';
    g.fillRect(p2X, p2Y, photoW, photoH);
    g.fillStyle = '#181a1c';
    g.fillRect(p2X + 10, p2Y + 10, photoW - 20, photoH - 45);
    // Silueta idéntica
    g.fillStyle = '#857868';
    g.fillRect(p2X + 30, p2Y + 80, photoW - 60, photoH - 120);
    g.fillStyle = '#b88b68';
    g.beginPath();
    g.arc(p2X + photoW / 2, p2Y + 65, photoW * 0.22, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#111';
    g.fillText('LUCAS VALENZUELA', p2X + 10, p2Y + photoH - 15);

    // Tachón de sangre y quemadura sobre la foto de Lucas
    g.strokeStyle = 'rgba(180, 15, 15, 0.88)';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(p2X + 18, p2Y + 18);
    g.lineTo(p2X + photoW - 18, p2Y + photoH - 50);
    g.moveTo(p2X + photoW - 18, p2Y + 18);
    g.lineTo(p2X + 18, p2Y + photoH - 50);
    g.stroke();

    // Sello oficial rojo grande: CONFIDENCIAL / CASO ENCUBIERTO
    g.save();
    g.translate(foldX + foldW / 2, foldY + foldH * 0.65);
    g.rotate(-0.18);
    g.strokeStyle = '#b81414';
    g.lineWidth = 5;
    g.strokeRect(-160, -42, 320, 84);
    g.fillStyle = '#b81414';
    g.font = `bold ${Math.round(w * 0.024)}px "Cinzel", serif`;
    g.textAlign = 'center';
    g.fillText('CONFIDENCIAL', 0, -6);
    g.font = `bold ${Math.round(w * 0.015)}px "Special Elite", monospace`;
    g.fillText('DECESO POR CESE CARDÍACO NO ACCIDENTAL', 0, 24);
    g.restore();

    // Huella digital sangrienta en la esquina inferior
    g.fillStyle = 'rgba(150, 20, 20, 0.45)';
    g.beginPath();
    g.ellipse(foldX + foldW - 50, foldY + foldH - 50, 26, 36, 0.35, 0, Math.PI * 2);
    g.fill();
  }

  // -------------------------------------------------------------------------
  // ESCENA 4: EL QUIRÓFANO 4 Y EL BISTURÍ DEL ASESINO (1984)
  // -------------------------------------------------------------------------
  drawScalpelScene(g, w, h, t) {
    // Fondo de quirófano frío y metálico
    g.fillStyle = '#060a0b';
    g.fillRect(0, 0, w, h);

    // Lámpara cialítica quirúrgica gigante de quirófano en el centro superior
    const lampX = w / 2, lampY = h * 0.18;
    const lampR = w * 0.14;
    const flicker = Math.sin(t * 22) > -0.6 ? 1 : 0.2;

    // Haz de luz cónico quirúrgico que ilumina la camilla
    const coneGrad = g.createRadialGradient(lampX, lampY, 20, lampX, h * 0.7, w * 0.45);
    coneGrad.addColorStop(0, `rgba(220, 245, 255, ${0.45 * flicker})`);
    coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = coneGrad;
    g.beginPath();
    g.moveTo(lampX - lampR, lampY);
    g.lineTo(w * 0.9, h);
    g.lineTo(w * 0.1, h);
    g.closePath();
    g.fill();

    // Lámpara metálica
    g.fillStyle = '#253538';
    g.beginPath();
    g.ellipse(lampX, lampY, lampR, lampR * 0.45, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = flicker > 0.5 ? '#ffffff' : '#334444';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.beginPath();
      g.arc(lampX + Math.cos(a) * (lampR * 0.55), lampY + Math.sin(a) * (lampR * 0.25), 10, 0, Math.PI * 2);
      g.fill();
    }

    // Camilla quirúrgica con sábana manchada
    const gurneyW = w * 0.55, gurneyH = h * 0.14;
    const gx = w * 0.22, gy = h * 0.68;
    g.fillStyle = '#1c2424';
    g.fillRect(gx, gy, gurneyW, gurneyH);
    // Sábana
    g.fillStyle = '#a8b0a8';
    g.fillRect(gx + 10, gy - 20, gurneyW - 20, 26);
    // Mancha de sangre creciente en la sábana
    const bloodScale = Math.min(1, t / 3);
    g.fillStyle = 'rgba(160, 15, 20, 0.85)';
    g.beginPath();
    g.ellipse(gx + gurneyW * 0.48, gy - 12, 60 * bloodScale, 18 * bloodScale, 0, 0, Math.PI * 2);
    g.fill();

    // Silueta de Mateo de pie junto a la camilla sosteniendo el bisturí en alto
    const docX = gx + gurneyW * 0.72;
    const docY = gy + 20;
    g.fillStyle = '#050708';
    // Cuerpo con bata y gorro quirúrgico
    g.beginPath();
    g.ellipse(docX, docY - 110, 28, 70, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(docX - 4, docY - 195, 20, 0, Math.PI * 2);
    g.fill();

    // Brazo alzado sosteniendo el bisturí reluciente
    g.strokeStyle = '#050708';
    g.lineWidth = 14;
    g.beginPath();
    g.moveTo(docX - 10, docY - 150);
    g.lineTo(docX - 45, docY - 210);
    g.stroke();

    // Bisturí de acero quirúrgico que brilla con un destello
    const knifeX = docX - 52, knifeY = docY - 225;
    g.fillStyle = '#e8f0f8';
    g.beginPath();
    g.moveTo(knifeX, knifeY);
    g.lineTo(knifeX - 6, knifeY - 32);
    g.lineTo(knifeX + 4, knifeY - 35);
    g.lineTo(knifeX + 5, knifeY);
    g.closePath();
    g.fill();
    // Destello de filo
    if (Math.sin(t * 15) > 0.5) {
      g.fillStyle = '#ffffff';
      g.fillRect(knifeX - 12, knifeY - 28, 20, 3);
      g.fillRect(knifeX - 4, knifeY - 36, 4, 18);
    }

    // Monitor cardíaco ECG a la izquierda con trazo plano (flatline)
    const ecgX = w * 0.08, ecgY = h * 0.38, ecgW = w * 0.22, ecgH = h * 0.24;
    g.fillStyle = '#06100c';
    g.fillRect(ecgX, ecgY, ecgW, ecgH);
    g.strokeStyle = '#18382c';
    g.lineWidth = 3;
    g.strokeRect(ecgX, ecgY, ecgW, ecgH);

    // Trazo verde del ECG
    g.strokeStyle = '#38e078';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(ecgX + 6, ecgY + ecgH / 2);
    if (t < 2.0) {
      // Latidos débiles
      const sweep = ((t * 120) % (ecgW - 20));
      g.lineTo(ecgX + 6 + sweep * 0.4, ecgY + ecgH / 2);
      g.lineTo(ecgX + 6 + sweep * 0.45, ecgY + ecgH / 2 - 25);
      g.lineTo(ecgX + 6 + sweep * 0.5, ecgY + ecgH / 2 + 20);
      g.lineTo(ecgX + 6 + sweep * 0.55, ecgY + ecgH / 2);
      g.lineTo(ecgX + ecgW - 6, ecgY + ecgH / 2);
    } else {
      // Paro cardíaco / línea plana continua
      g.lineTo(ecgX + ecgW - 6, ecgY + ecgH / 2);
    }
    g.stroke();

    // Texto de alerta del monitor
    g.fillStyle = t > 2.0 ? (Math.sin(t * 14) > 0 ? '#ff3030' : '#440a0a') : '#38e078';
    g.font = `bold ${Math.round(w * 0.015)}px monospace`;
    g.fillText(t > 2.0 ? 'ASYSTOLE · 0 BPM' : 'HEART RATE: 32 BPM', ecgX + 12, ecgY + 24);
  }

  // -------------------------------------------------------------------------
  // ESCENA 5: EL BUCLE TEMPORAL DE LAS RECEPCIONISTAS
  // -------------------------------------------------------------------------
  drawLoopScene(g, w, h, t) {
    // Sala de recepción vista desde arriba con efecto túnel infinito
    g.fillStyle = '#040608';
    g.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const rings = 7;

    for (let i = rings; i >= 1; i--) {
      const scale = (i / rings) * (1 - ((t * 0.15) % (1 / rings)));
      const rw = w * scale;
      const rh = h * scale;
      const rx = cx - rw / 2;
      const ry = cy - rh / 2;

      g.strokeStyle = `rgba(180, 20, 30, ${0.15 + (1 - scale) * 0.65})`;
      g.lineWidth = 2;
      g.strokeRect(rx, ry, rw, rh);

      // Mostrador de recepción repetido en cada bucle
      g.fillStyle = `rgba(30, 25, 20, ${0.4 + (1 - scale) * 0.5})`;
      g.fillRect(rx + rw * 0.25, ry + rh * 0.45, rw * 0.5, rh * 0.12);

      // Silueta de una recepcionista sentada frente a la pantalla en cada época
      g.fillStyle = `rgba(10, 10, 15, ${0.6 + (1 - scale) * 0.4})`;
      g.beginPath();
      g.arc(rx + rw * 0.5, ry + rh * 0.42, Math.max(3, 14 * scale), 0, Math.PI * 2);
      g.fill();
    }

    // Años del ciclo que parpadean en el centro
    const years = ['1984', '1996', '2008', '2024', 'HOY'];
    const curYear = years[Math.floor((t * 2.5) % years.length)];
    g.fillStyle = '#ff2b2b';
    g.font = `bold ${Math.round(w * 0.055)}px "Cinzel", serif`;
    g.textAlign = 'center';
    g.fillText(curYear, cx, cy - 20);

    g.font = `${Math.round(w * 0.02)}px "Special Elite", monospace`;
    g.fillStyle = '#e8dcc4';
    g.fillText('EL TURNO NUNCA TERMINA · EL HERMANO SIGUE ARRIBA', cx, cy + 40);
  }

  // -------------------------------------------------------------------------
  // OVERLAYS Y DISTORSIÓN ANALÓGICA VHS
  // -------------------------------------------------------------------------
  drawVhsOverlay(g, w, h, t) {
    // 1. Líneas de escaneo CRT sutiles
    g.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = 0; y < h; y += 4) {
      g.fillRect(0, y, w, 1.5);
    }

    // 2. Banda de distorsión de cabezal tracking VHS que baja por la pantalla
    this.trackingY = (this.trackingY + 3.5) % (h + 80);
    const ty = this.trackingY - 40;
    const bandH = 28 + Math.sin(t * 7) * 12;
    g.fillStyle = 'rgba(255, 255, 255, 0.08)';
    g.fillRect(0, ty, w, bandH);

    // Ruido magnético blanco en la banda de tracking
    g.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let i = 0; i < 35; i++) {
      const rx = Math.random() * w;
      const ry = ty + Math.random() * bandH;
      g.fillRect(rx, ry, Math.random() * 25 + 4, 1.5);
    }

    // 3. Estática aleatoria de cinta vieja
    g.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (const p of this.tapeNoise) {
      g.fillRect((p.x * w + Math.sin(t * 10) * 10) % w, p.y * h, p.w, 1.5);
    }

    // 4. Viñeteado de tubo catódico CRT
    const crtGrad = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.72);
    crtGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    crtGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    g.fillStyle = crtGrad;
    g.fillRect(0, 0, w, h);
  }

  // -------------------------------------------------------------------------
  // INFORMACIÓN Y MARCADORES EN PANTALLA (HUD 1984)
  // -------------------------------------------------------------------------
  drawHud(g, w, h, t, letterboxH) {
    const meta = this.meta;
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const padX = Math.max(18, Math.round(w * 0.03));
    const padTop = Math.max(letterboxH * 0.55, 24);
    const padBottom = Math.max(letterboxH * 0.65, 28);

    // Tipografía escalada con límites mínimos legibles
    const fRec = Math.max(13, Math.round(w * 0.016));
    const fTitle = Math.max(14, Math.round(w * 0.018));
    const fLoc = Math.max(11, Math.round(w * 0.014));
    const fSkip = Math.max(11, Math.round(w * 0.013));

    // Encabezado superior: [● REC] parpadeante y reloj VHS
    const topY = padTop;
    const recOn = Math.sin(t * 4.5) > -0.2;

    if (recOn) {
      g.fillStyle = '#ff2b2b';
      g.beginPath();
      g.arc(padX, topY - 4, 6, 0, Math.PI * 2);
      g.fill();
      g.font = `bold ${fRec}px "Special Elite", monospace`;
      g.textAlign = 'left';
      g.fillText('REC', padX + 12, topY);
    }

    g.fillStyle = '#68e29a';
    g.font = `bold ${fRec}px "Special Elite", monospace`;
    g.textAlign = 'left';
    g.fillText('PLAY ▶ SP', padX + (recOn ? 65 : 0), topY);

    g.textAlign = 'right';
    g.fillStyle = '#ffd56b';
    g.font = `bold ${fRec}px "Special Elite", monospace`;
    g.fillText(meta.date || 'OCT 14 1984 · 03:42:15 AM', w - padX, topY);

    // Texto de ubicación y título del archivo en el letterbox inferior
    const botY = h - padBottom;
    g.textAlign = 'left';
    g.fillStyle = '#ffffff';
    g.font = `bold ${fTitle}px "Cinzel", serif`;
    g.fillText(meta.title || '', padX, botY - 14);

    g.font = `${fLoc}px "Special Elite", monospace`;
    g.fillStyle = '#a0d8b8';
    g.fillText(meta.location || '', padX, botY + 8);

    // Indicador para saltar
    g.textAlign = 'right';
    g.fillStyle = 'rgba(255, 255, 255, 0.65)';
    g.font = `${fSkip}px "Inter", sans-serif`;
    const skipLabel = isTouch ? 'Toca la pantalla para omitir' : '[ESPACIO] o Clic para omitir';
    g.fillText(skipLabel, w - padX, botY + 8);
  }
}
