import * as THREE from 'three';

export function paint(w, h, draw, rx = 1, ry = 1, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 8;
  t.userData.canvas = c;
  return t;
}

function grain(g, w, h, amt) {
  const img = g.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  g.putImageData(img, 0, 0);
}

function stains(g, w, h, n, maxR, color = '20,16,8', a = 0.3) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * maxR;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${color},${a})`);
    gr.addColorStop(0.6, `rgba(${color},${a * 0.4})`);
    gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
}

/**
 * Textura óptica de linterna (Cookie / Gobo)
 * Simula el haz de una linterna física real: núcleo central brillante (hotspot),
 * anillos de difracción de Fresnel concéntricos, halos de cristal y motas de polvo.
 */
export function flashlightCookie() {
  return paint(512, 512, (g, w, h) => {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;

    // Halo exterior suave y cálido
    const outerGrad = g.createRadialGradient(cx, cy, 20, cx, cy, w * 0.48);
    outerGrad.addColorStop(0, 'rgba(255, 250, 235, 0.75)');
    outerGrad.addColorStop(0.35, 'rgba(235, 238, 228, 0.45)');
    outerGrad.addColorStop(0.7, 'rgba(170, 185, 195, 0.18)');
    outerGrad.addColorStop(0.95, 'rgba(80, 100, 110, 0.04)');
    outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = outerGrad;
    g.beginPath(); g.arc(cx, cy, w * 0.48, 0, Math.PI * 2); g.fill();

    // Hotspot central con transición suave (evita quemados especulares en suelo)
    const hotGrad = g.createRadialGradient(cx, cy, 0, cx, cy, w * 0.32);
    hotGrad.addColorStop(0, 'rgba(255, 252, 235, 0.75)');
    hotGrad.addColorStop(0.25, 'rgba(255, 248, 225, 0.50)');
    hotGrad.addColorStop(0.6, 'rgba(240, 235, 210, 0.18)');
    hotGrad.addColorStop(1, 'rgba(200, 200, 190, 0)');
    g.fillStyle = hotGrad;
    g.beginPath(); g.arc(cx, cy, w * 0.32, 0, Math.PI * 2); g.fill();

    // Anillos concéntricos de lente de Fresnel
    g.lineWidth = 1.5;
    for (let r = 40; r < w * 0.42; r += 16 + Math.sin(r) * 6) {
      g.strokeStyle = `rgba(255, 255, 255, ${0.03 + Math.random() * 0.05})`;
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    }

    // Micro-imperfecciones del cristal (pequeñas motas y aberración de filamento)
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * (w * 0.38);
      const px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d;
      g.fillStyle = `rgba(0, 0, 0, ${0.08 + Math.random() * 0.15})`;
      g.beginPath(); g.arc(px, py, 1 + Math.random() * 2.5, 0, Math.PI * 2); g.fill();
    }

    grain(g, w, h, 14);
  }, 1, 1, false);
}

// Pared de hospital: revoque envejecido superior + zócalo de azulejos clínicos vitrificados
// Pared de hospital: revoque clínico envejecido superior + zócalo de azulejos vitrificados sin manchas repetitivas
export function wallMaps() {
  const map = paint(1024, 1024, (g, w, h) => {
    // Fondo de revoque hospitalario verde salvia clínico
    g.fillStyle = '#96a190';
    g.fillRect(0, 0, w, h);

    // Gradiente sutil de iluminación vertical natural
    const wallGrad = g.createLinearGradient(0, 0, 0, h * 0.56);
    wallGrad.addColorStop(0, 'rgba(30, 35, 28, 0.22)');
    wallGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
    wallGrad.addColorStop(1, 'rgba(15, 20, 16, 0.15)');
    g.fillStyle = wallGrad;
    g.fillRect(0, 0, w, h * 0.56);

    // Microfisuras finas en el revoque
    g.strokeStyle = 'rgba(60, 58, 48, 0.14)';
    g.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      let cx = (i * 170) % w, cy = 30 + (i * 75) % (h * 0.45);
      g.beginPath();
      g.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (Math.random() - 0.5) * 28;
        cy += Math.random() * 22;
        g.lineTo(cx, cy);
      }
      g.stroke();
    }

    // Franja de azulejos clínicos vitrificados en la mitad inferior
    const y0 = h * 0.56;
    g.fillStyle = '#1c342b';
    g.fillRect(0, y0, w, h - y0);

    // Gradiente de brillo del azulejo vitrificado
    const tileGrad = g.createLinearGradient(0, y0, 0, h);
    tileGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    tileGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    tileGrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    g.fillStyle = tileGrad;
    g.fillRect(0, y0, w, h - y0);

    // Juntas de azulejos con cemento gris oscuro
    const tileSize = 64;
    g.strokeStyle = 'rgba(10, 20, 16, 0.75)';
    g.lineWidth = 2.5;
    for (let x = 0; x <= w; x += tileSize) {
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x, h); g.stroke();
    }
    for (let y = y0; y <= h; y += tileSize) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    }

    // Moldura decorativa divisoria entre el revoque y los azulejos
    g.fillStyle = '#b8b09c';
    g.fillRect(0, y0 - 8, w, 8);
    g.fillStyle = 'rgba(0, 0, 0, 0.45)';
    g.fillRect(0, y0, w, 4);

    grain(g, w, h, 14);
  });

  const bump = paint(512, 512, (g, w, h) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, w, h);
    const y0 = h * 0.56;
    g.fillStyle = '#383838';
    for (let x = 0; x <= w; x += 32) g.fillRect(x - 1, y0, 2, h - y0);
    for (let y = y0; y <= h; y += 32) g.fillRect(0, y - 1, w, 2);
    g.fillStyle = '#b0b0b0';
    g.fillRect(0, y0 - 4, w, 4);
    grain(g, w, h, 35);
  }, 1, 1, false);

  return { map, bump };
}

// Suelo de hospital: baldosas de linóleo damero limpio con juntas nítidas y reflejo natural
export function floorMaps(rx, ry) {
  const map = paint(1024, 1024, (g, w, h) => {
    const t = 128;
    for (let y = 0; y < h; y += t) {
      for (let x = 0; x < w; x += t) {
        const k = ((x + y) / t) % 2 === 0;
        // Tonos hueso marfil y verde salvia sobrio
        g.fillStyle = k ? '#bab4a2' : '#697263';
        g.fillRect(x, y, t, t);

        // Biselado perimetral sutil
        g.fillStyle = 'rgba(255,255,255,0.06)';
        g.fillRect(x, y, t, 2);
        g.fillRect(x, y, 2, t);
        g.fillStyle = 'rgba(0,0,0,0.12)';
        g.fillRect(x, y + t - 2, t, 2);
        g.fillRect(x + t - 2, y, 2, t);
      }
    }

    // Juntas limpias entre baldosas
    g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.lineWidth = 3;
    for (let i = 0; i <= w; i += t) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
    }

    // Desgaste suave y grano fino de linóleo
    grain(g, w, h, 16);
  }, rx, ry);

  const rough = paint(512, 512, (g, w, h) => {
    // Linóleo hospitalario con acabado satinado mate (elimina franjas especulares quemadas)
    g.fillStyle = '#c8c8c8';
    g.fillRect(0, 0, w, h);
    grain(g, w, h, 20);
  }, rx * 2, ry * 2, false);

  return { map, rough };
}

// Techo suspendido con placas acústicas microperforadas y módulos T-bar
export function ceilingMap(rx, ry) {
  return paint(512, 512, (g, w, h) => {
    // Tono marfil acústico hospitalario suave
    g.fillStyle = '#d5d2c6';
    g.fillRect(0, 0, w, h);

    // Biselado perimetral del marco T-bar de aluminio
    g.strokeStyle = '#8c8a82';
    g.lineWidth = 4;
    g.strokeRect(2, 2, w - 4, h - 4);

    // Línea interior sutil de sombra del plafón
    g.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    g.lineWidth = 2;
    g.strokeRect(6, 6, w - 12, h - 12);

    // Microperforaciones acústicas punteadas
    g.fillStyle = 'rgba(50, 48, 40, 0.12)';
    for (let i = 0; i < 500; i++) {
      const px = 10 + Math.random() * (w - 20);
      const py = 10 + Math.random() * (h - 20);
      const s = 1 + Math.random() * 1.8;
      g.fillRect(px, py, s, s);
    }

    // Fisuras acústicas finas
    g.strokeStyle = 'rgba(60, 58, 48, 0.14)';
    g.lineWidth = 1.2;
    for (let i = 0; i < 35; i++) {
      const px = 15 + Math.random() * (w - 30);
      const py = 15 + Math.random() * (h - 30);
      const len = 4 + Math.random() * 8;
      const ang = Math.random() * Math.PI * 2;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len);
      g.stroke();
    }

    // Viñeteado perimetral en cada plafón para dar relieve cúbico suave sin manchas repetidas
    const rad = g.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.68);
    rad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    rad.addColorStop(1, 'rgba(0, 0, 0, 0.10)');
    g.fillStyle = rad;
    g.fillRect(0, 0, w, h);

    grain(g, w, h, 16);
  }, rx, ry);
}

// Puertas hospitalarias de madera con panel reforzado y visor
export function doorMap() {
  return paint(512, 1024, (g, w, h) => {
    // Tono caoba oscuro con vetas
    g.fillStyle = '#553f2c';
    g.fillRect(0, 0, w, h);

    // Vetas de madera
    for (let y = 0; y < h; y += 4) {
      g.fillStyle = `rgba(20,12,6,${0.06 + Math.random() * 0.12})`;
      g.fillRect(0, y, w, 2);
    }

    // Molduras de relieve
    g.strokeStyle = 'rgba(15,10,5,0.7)';
    g.lineWidth = 7;
    g.strokeRect(36, 40, w - 72, h * 0.38);
    g.strokeRect(36, h * 0.48, w - 72, h * 0.46);

    // Placa de empuje metálica inferior (Kick plate de acero inoxidable sucio)
    const plateH = 90;
    g.fillStyle = '#8f9598';
    g.fillRect(30, h - plateH - 20, w - 60, plateH);
    g.strokeStyle = 'rgba(0,0,0,0.5)';
    g.lineWidth = 3;
    g.strokeRect(30, h - plateH - 20, w - 60, plateH);
    // Tornillos de la placa
    g.fillStyle = '#222';
    for (const sx of [45, w - 45]) {
      for (const sy of [h - plateH - 10, h - 30]) {
        g.beginPath(); g.arc(sx, sy, 3, 0, Math.PI * 2); g.fill();
      }
    }

    stains(g, w, h, 12, 110, '20,14,8', 0.45);
    grain(g, w, h, 30);
  });
}

export function noteTex() {
  return paint(256, 320, (g, w, h) => {
    // Papel pergamino con bordes quemados/envejecidos
    g.fillStyle = '#e8dec2';
    g.fillRect(0, 0, w, h);

    // Manchas de café y tiempo
    stains(g, w, h, 5, 60, '110,75,30', 0.4);

    // Membrete hospitalario
    g.fillStyle = '#263b36';
    g.font = 'bold 13px "Special Elite", monospace';
    g.fillText('HOSPITAL SAN ANSELMO - 1984', 18, 28);
    g.strokeStyle = '#263b36';
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(18, 34); g.lineTo(w - 18, 34); g.stroke();

    // Líneas de texto manuscrito desvanecido
    g.fillStyle = 'rgba(40,30,22,0.65)';
    for (let y = 50; y < h - 20; y += 14) {
      g.fillRect(20, y, w - 40 - Math.random() * 60, 2);
    }
    grain(g, w, h, 18);
  });
}

export function signTexture(text, { w = 512, h = 128, size = 70, fg = '#e8e0cc', bg = '#1d3a3a', font = null } = {}) {
  return paint(w, h, (g) => {
    if (bg) {
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,.3)';
      g.lineWidth = 4;
      g.strokeRect(6, 6, w - 12, h - 12);
    }
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = (font || 'bold {s}px "Special Elite", Arial, sans-serif').replace('{s}', size * (h / 128) * 0.6);

    let fs = size * (h / 128) * 0.6;
    const maxW = w - 40;
    while (g.measureText(text).width > maxW && fs > 12) {
      fs -= 4;
      g.font = (font || 'bold {s}px "Special Elite", Arial, sans-serif').replace('{s}', fs);
    }
    g.fillText(text, w / 2, h / 2 + 2);

    if (!bg) {
      // Tinta de marcador escurriendo
      g.fillStyle = fg;
      for (let i = 0; i < 16; i++) {
        const x = 30 + Math.random() * (w - 60);
        g.fillRect(x, h / 2 + fs * 0.35, 3.5, 10 + Math.random() * 45);
      }
    }
  }, 1, 1);
}

/**
 * Rostros detallados para los personajes (256x256)
 * Genera facciones completas con ojos con iris/pupila, sombreado anatómico,
 * ojeras y expresiones acordes a la atmósfera psicológica.
 */
export function faceTexture(skin = '#e0b9a0', kind = 'normal') {
  return paint(256, 256, (g, w, h) => {
    g.fillStyle = skin;
    g.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h * 0.48;

    if (kind === 'ghost') {
      // Fantasma del niño asesinado: cuencas negras sin fondo, lágrimas de tinta oscura, piel lívida
      g.fillStyle = '#020306';
      // Cuencas oculares vacías
      g.beginPath(); g.ellipse(w * 0.32, cy - 8, 22, 28, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(w * 0.68, cy - 8, 22, 28, 0, 0, Math.PI * 2); g.fill();

      // Lágrimas de tinta/sangre negra que caen por las mejillas
      g.fillStyle = 'rgba(10,5,5,0.95)';
      g.fillRect(w * 0.32 - 4, cy + 18, 9, 90);
      g.fillRect(w * 0.68 - 4, cy + 18, 9, 80);
      // Goteo fino
      g.fillRect(w * 0.32 + 8, cy + 24, 4, 60);
      g.fillRect(w * 0.68 - 10, cy + 22, 4, 65);

      // Boca abierta en un grito silencioso de dolor
      g.fillStyle = '#060204';
      g.beginPath(); g.ellipse(cx, h * 0.78, 16, 22, 0, 0, Math.PI * 2); g.fill();

      // Moretones violáceos en el cuello (marcas de asfixia)
      g.fillStyle = 'rgba(40,15,35,0.6)';
      g.fillRect(w * 0.25, h * 0.88, w * 0.5, 20);
    } else if (kind === 'mad') {
      // Hermano homicida recluido: mirada desencajada, venas rojas, ojeras oscuras, barba descuidada
      // Ojeras profundas
      g.fillStyle = 'rgba(35,15,15,0.65)';
      g.beginPath(); g.ellipse(w * 0.32, cy + 4, 26, 18, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(w * 0.68, cy + 4, 26, 18, 0, 0, Math.PI * 2); g.fill();

      // Esclera inyectada en sangre
      g.fillStyle = '#eee0e0';
      g.beginPath(); g.ellipse(w * 0.32, cy - 4, 18, 14, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(w * 0.68, cy - 4, 18, 14, 0, 0, Math.PI * 2); g.fill();

      // Pupilas diminutas de locura
      g.fillStyle = '#111';
      g.beginPath(); g.arc(w * 0.32, cy - 4, 6, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(w * 0.68, cy - 4, 6, 0, Math.PI * 2); g.fill();

      // Cejas crispadas y asimétricas
      g.strokeStyle = '#221814';
      g.lineWidth = 5;
      g.beginPath(); g.moveTo(w * 0.18, cy - 22); g.lineTo(w * 0.42, cy - 14); g.stroke();
      g.beginPath(); g.moveTo(w * 0.58, cy - 14); g.lineTo(w * 0.82, cy - 26); g.stroke();

      // Barba rala de encierro
      g.fillStyle = 'rgba(30,22,18,0.45)';
      for (let i = 0; i < 400; i++) {
        g.fillRect(w * 0.2 + Math.random() * (w * 0.6), h * 0.62 + Math.random() * (h * 0.35), 2, 3);
      }

      // Mueca demacrada con dientes visibles
      g.fillStyle = '#2a1010';
      g.fillRect(w * 0.34, h * 0.76, w * 0.32, 10);
      g.fillStyle = '#dedad0';
      for (let x = w * 0.36; x < w * 0.64; x += 9) {
        g.fillRect(x, h * 0.77, 6, 7);
      }
    } else {
      // Recepcionistas / Guardia: rostros humanos naturales
      // Sombras de párpados y ojeras de turno noche
      g.fillStyle = 'rgba(60,35,30,0.25)';
      g.beginPath(); g.ellipse(w * 0.32, cy + 8, 20, 10, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(w * 0.68, cy + 8, 20, 10, 0, 0, Math.PI * 2); g.fill();

      // Ojos
      g.fillStyle = '#faf8f2';
      g.beginPath(); g.ellipse(w * 0.32, cy - 2, 16, 10, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(w * 0.68, cy - 2, 16, 10, 0, 0, Math.PI * 2); g.fill();

      // Iris marrón / castaño
      g.fillStyle = '#3a2516';
      g.beginPath(); g.arc(w * 0.32, cy - 2, 7.5, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(w * 0.68, cy - 2, 7.5, 0, Math.PI * 2); g.fill();

      // Pupila
      g.fillStyle = '#080808';
      g.beginPath(); g.arc(w * 0.32, cy - 2, 3.5, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(w * 0.68, cy - 2, 3.5, 0, Math.PI * 2); g.fill();

      // Brillo especular en la pupila
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(w * 0.32 + 2, cy - 4, 2, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(w * 0.68 + 2, cy - 4, 2, 0, Math.PI * 2); g.fill();

      // Cejas naturales
      g.strokeStyle = '#2b1c14';
      g.lineWidth = 4.5;
      g.beginPath(); g.moveTo(w * 0.18, cy - 18); g.quadraticCurveTo(w * 0.32, cy - 24, w * 0.44, cy - 18); g.stroke();
      g.beginPath(); g.moveTo(w * 0.56, cy - 18); g.quadraticCurveTo(w * 0.68, cy - 24, w * 0.82, cy - 18); g.stroke();

      // Labios
      g.fillStyle = '#b8766a';
      g.beginPath(); g.ellipse(cx, h * 0.77, 18, 7, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#6e3c34';
      g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(cx - 18, h * 0.77); g.lineTo(cx + 18, h * 0.77); g.stroke();
    }

    grain(g, w, h, 14);
  });
}

// Textura de ropa con tejido de algodón y salpicaduras
export function clothTexture(base = '#cfd6d6', blood = false, dirt = 0.4) {
  return paint(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);

    // Trama de hilo sutil
    g.fillStyle = 'rgba(0,0,0,0.04)';
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1.5);
    for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 1.5, h);

    // Desgaste y manchas
    stains(g, w, h, 8, 60, '50,42,28', dirt);

    if (blood) {
      stains(g, w, h, 14, 50, '130,10,10', 0.85);
      // Salpicaduras de sangre coagulada oscura
      stains(g, w, h, 8, 25, '60,4,4', 0.95);
    }

    grain(g, w, h, 18);
  });
}

// =========================================================================
// TEXTURAS CLÍNICAS Y DE HORROR AAA
// =========================================================================

/** Radiografía médica de tórax retroiluminada para negatoscopios de pared */
export function xrayTexture() {
  return paint(256, 320, (g, w, h) => {
    // Fondo de película radiográfica azul negruzco translúcida
    g.fillStyle = '#0a101a';
    g.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h * 0.46;

    // Columna vertebral y esternón
    g.fillStyle = 'rgba(195, 215, 235, 0.65)';
    for (let y = h * 0.18; y < h * 0.82; y += 12) {
      g.fillRect(cx - 8, y, 16, 8);
    }

    // Clavículas
    g.strokeStyle = 'rgba(210, 225, 245, 0.7)';
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(cx - 10, h * 0.22); g.quadraticCurveTo(cx - 50, h * 0.20, cx - 95, h * 0.25); g.stroke();
    g.beginPath();
    g.moveTo(cx + 10, h * 0.22); g.quadraticCurveTo(cx + 50, h * 0.20, cx + 95, h * 0.25); g.stroke();

    // Costillas torácicas (arcos bilaterales)
    g.lineWidth = 6;
    for (let i = 0; i < 7; i++) {
      const ry = h * 0.28 + i * 18;
      const span = 45 + i * 8;
      g.strokeStyle = `rgba(180, 205, 230, ${0.45 + i * 0.04})`;
      g.beginPath();
      g.moveTo(cx - 12, ry); g.quadraticCurveTo(cx - span * 0.8, ry - 6, cx - span, ry + 16); g.stroke();
      g.beginPath();
      g.moveTo(cx + 12, ry); g.quadraticCurveTo(cx + span * 0.8, ry - 6, cx + span, ry + 16); g.stroke();
    }

    // Silueta de los campos pulmonares (negros y translúcidos)
    g.fillStyle = 'rgba(5, 8, 14, 0.45)';
    g.beginPath();
    g.ellipse(cx - 48, cy, 32, 60, -0.15, 0, Math.PI * 2); g.fill();
    g.beginPath();
    g.ellipse(cx + 48, cy, 32, 60, 0.15, 0, Math.PI * 2); g.fill();

    // Silueta opaca del corazón (mediastino izquierdo)
    g.fillStyle = 'rgba(170, 195, 220, 0.55)';
    g.beginPath();
    g.ellipse(cx + 18, cy + 18, 30, 42, 0.4, 0, Math.PI * 2); g.fill();

    // Texto clínico en la esquina superior
    g.fillStyle = 'rgba(230, 240, 255, 0.8)';
    g.font = 'bold 9px monospace';
    g.fillText('SAN ANSELMO · RAYOS X', 10, 16);
    g.fillText('EXP: #1984-0982', 10, 28);
    g.fillText('L', w - 18, 18);

    grain(g, w, h, 12);
  });
}

/** Pantalla de osciloscopio cardíaco (ECG) para carros de monitoreo de signos vitales */
export function ecgTexture() {
  return paint(256, 192, (g, w, h) => {
    // Fondo de pantalla CRT verde oscuro
    g.fillStyle = '#040f09';
    g.fillRect(0, 0, w, h);

    // Cuadrícula milimétrica de electrocardiógrafo
    g.strokeStyle = 'rgba(25, 75, 45, 0.4)';
    g.lineWidth = 1;
    for (let x = 0; x < w; x += 16) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
    }
    for (let y = 0; y < h; y += 16) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    }

    // Trazado de onda electrocardiográfica (P-Q-R-S-T)
    g.strokeStyle = '#44ff77';
    g.lineWidth = 2.2;
    g.shadowColor = '#33ee66';
    g.shadowBlur = 6;
    g.beginPath();
    g.moveTo(0, h * 0.52);

    for (let cycle = 0; cycle < 3; cycle++) {
      const x0 = cycle * 85;
      g.lineTo(x0 + 15, h * 0.52);
      g.lineTo(x0 + 22, h * 0.47); // Onda P
      g.lineTo(x0 + 28, h * 0.52);
      g.lineTo(x0 + 35, h * 0.52);
      g.lineTo(x0 + 38, h * 0.56); // Onda Q
      g.lineTo(x0 + 44, h * 0.18); // Complejo R alto
      g.lineTo(x0 + 49, h * 0.72); // Onda S baja
      g.lineTo(x0 + 54, h * 0.52);
      g.lineTo(x0 + 64, h * 0.52);
      g.lineTo(x0 + 72, h * 0.44); // Onda T
      g.lineTo(x0 + 80, h * 0.52);
      g.lineTo(x0 + 85, h * 0.52);
    }
    g.stroke();
    g.shadowBlur = 0;

    // Valores digitales de signos vitales
    g.fillStyle = '#55ff88';
    g.font = 'bold 22px monospace';
    g.fillText('74', w - 46, 32);
    g.font = '9px monospace';
    g.fillText('PULSO BPM', w - 62, 45);

    g.fillStyle = '#44ddff';
    g.font = 'bold 16px monospace';
    g.fillText('98%', w - 46, 75);
    g.font = '9px monospace';
    g.fillText('SpO2', w - 46, 87);

    g.fillStyle = '#ffdd44';
    g.font = 'bold 14px monospace';
    g.fillText('120/80', w - 65, 115);
    g.font = '9px monospace';
    g.fillText('NIBP mmHg', w - 65, 127);
  });
}

/** Textura de caja de cartón con cinta de embalaje y sellos médicos */
export function cardboardBoxTexture() {
  return paint(256, 256, (g, w, h) => {
    g.fillStyle = '#9c7b52';
    g.fillRect(0, 0, w, h);

    // Variaciones tonales de fibra de cartón
    grain(g, w, h, 28);

    // Cinta adhesiva plástica marrón brillante en la junta
    g.fillStyle = 'rgba(180, 140, 85, 0.85)';
    g.fillRect(0, h * 0.42, w, 38);
    g.fillStyle = 'rgba(255, 255, 255, 0.12)';
    g.fillRect(0, h * 0.45, w, 4);

    // Estampado de cruz médica y texto
    g.fillStyle = '#7a1c1c';
    g.fillRect(28, 28, 32, 10);
    g.fillRect(39, 17, 10, 32);

    g.fillStyle = '#2a1e12';
    g.font = 'bold 10px sans-serif';
    g.fillText('SUMINISTROS MÉDICOS', 26, 75);
    g.font = '8px monospace';
    g.fillText('LOTE #1984-B4 · FRÁGIL', 26, 90);
    g.fillText('HOSPITAL SAN ANSELMO', 26, 102);

    // Flechas de dirección "THIS WAY UP"
    g.lineWidth = 2.5;
    g.strokeStyle = '#2a1e12';
    for (const x of [w - 40, w - 24]) {
      g.beginPath();
      g.moveTo(x, 48); g.lineTo(x, 24);
      g.moveTo(x - 5, 30); g.lineTo(x, 24); g.lineTo(x + 5, 30);
      g.stroke();
    }
  });
}

/** Textura de cortina divisoria clínica plisada con sombras verticales */
export function curtainTexture() {
  return paint(128, 256, (g, w, h) => {
    g.fillStyle = '#9cb8a8';
    g.fillRect(0, 0, w, h);

    // Pliegues verticales profundos
    const pleatW = 16;
    for (let x = 0; x < w; x += pleatW) {
      const grad = g.createLinearGradient(x, 0, x + pleatW, 0);
      grad.addColorStop(0, 'rgba(30, 50, 40, 0.35)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
      grad.addColorStop(1, 'rgba(20, 35, 28, 0.45)');
      g.fillStyle = grad;
      g.fillRect(x, 0, pleatW, h);
    }
    grain(g, w, h, 14);
  });
}
