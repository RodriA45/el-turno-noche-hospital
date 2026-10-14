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

    // Halo exterior suave
    const outerGrad = g.createRadialGradient(cx, cy, 30, cx, cy, w * 0.46);
    outerGrad.addColorStop(0, 'rgba(255, 252, 240, 0.95)');
    outerGrad.addColorStop(0.35, 'rgba(240, 242, 235, 0.7)');
    outerGrad.addColorStop(0.7, 'rgba(180, 195, 205, 0.3)');
    outerGrad.addColorStop(0.92, 'rgba(90, 110, 120, 0.08)');
    outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = outerGrad;
    g.beginPath(); g.arc(cx, cy, w * 0.46, 0, Math.PI * 2); g.fill();

    // Hotspot central brillante
    const hotGrad = g.createRadialGradient(cx, cy, 0, cx, cy, w * 0.16);
    hotGrad.addColorStop(0, '#ffffff');
    hotGrad.addColorStop(0.4, 'rgba(255, 255, 245, 0.95)');
    hotGrad.addColorStop(1, 'rgba(255, 255, 245, 0)');
    g.fillStyle = hotGrad;
    g.beginPath(); g.arc(cx, cy, w * 0.16, 0, Math.PI * 2); g.fill();

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

// Pared de hospital: pintura verde clínica desgastada + azulejo esmaltado con moho y salpicaduras
export function wallMaps() {
  const map = paint(1024, 1024, (g, w, h) => {
    // Fondo de revoque hospitalario verde pálido sucio
    g.fillStyle = '#8f9a88';
    g.fillRect(0, 0, w, h);

    // Variaciones sutiles de yeso y humedad
    stains(g, w, h, 28, 220, '45,40,24', 0.3);
    stains(g, w, h, 15, 120, '25,32,24', 0.25);

    // Escurrimientos verticales de goteras y óxido
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * w, len = 120 + Math.random() * 450;
      const gr = g.createLinearGradient(0, 0, 0, len);
      gr.addColorStop(0, 'rgba(40,32,18,0.45)');
      gr.addColorStop(0.7, 'rgba(50,42,25,0.25)');
      gr.addColorStop(1, 'rgba(50,42,25,0)');
      g.fillStyle = gr;
      g.fillRect(x, 0, 6 + Math.random() * 18, len);
    }

    // Franja de azulejos clínicos en la mitad inferior
    const y0 = h * 0.58;
    g.fillStyle = '#264239';
    g.fillRect(0, y0, w, h - y0);

    // Juntas de azulejos con suciedad incrustada
    const tileSize = 64;
    g.strokeStyle = 'rgba(10,18,14,0.65)';
    g.lineWidth = 3;
    for (let x = 0; x <= w; x += tileSize) {
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x, h); g.stroke();
    }
    for (let y = y0; y <= h; y += tileSize) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    }

    // Brillo biselado en la parte superior del azulejo
    g.fillStyle = '#b8b29c';
    g.fillRect(0, y0 - 10, w, 10);
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.fillRect(0, y0, w, 6);

    // Salpicaduras de humedad y manchas en la zona baja
    stains(g, w, h, 20, 140, '12,10,6', 0.4);
    grain(g, w, h, 24);
  });

  const bump = paint(512, 512, (g, w, h) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, w, h);
    // Relieve de juntas de azulejos
    const y0 = h * 0.58;
    g.fillStyle = '#404040';
    for (let x = 0; x <= w; x += 32) g.fillRect(x - 1, y0, 2, h - y0);
    for (let y = y0; y <= h; y += 32) g.fillRect(0, y - 1, w, 2);
    // Relieve de revoque descascarado
    grain(g, w, h, 95);
  }, 1, 1, false);

  return { map, bump };
}

// Suelo de hospital: baldosas de linóleo damero con reflejos especulares, marcas de ruedas y charcos
export function floorMaps(rx, ry) {
  const map = paint(1024, 1024, (g, w, h) => {
    const t = 128;
    for (let y = 0; y < h; y += t) {
      for (let x = 0; x < w; x += t) {
        const k = ((x + y) / t) % 2 === 0;
        // Tonos hueso envejecido y verde musgo descolorido
        g.fillStyle = k ? '#c2bcaa' : '#71786c';
        g.fillRect(x, y, t, t);

        // Biselado sutil de cada baldosa
        g.fillStyle = 'rgba(255,255,255,0.08)';
        g.fillRect(x, y, t, 3);
        g.fillRect(x, y, 3, t);
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.fillRect(x, y + t - 3, t, 3);
        g.fillRect(x + t - 3, y, 3, t);
      }
    }

    // Juntas negras entre baldosas
    g.strokeStyle = 'rgba(0,0,0,0.65)';
    g.lineWidth = 3.5;
    for (let i = 0; i <= w; i += t) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
    }

    // Marcas de fricción de neumáticos de camillas y sillas de ruedas
    g.strokeStyle = 'rgba(20,18,14,0.35)';
    g.lineWidth = 8;
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      const sx = Math.random() * w;
      g.moveTo(sx, 0);
      g.bezierCurveTo(sx + (Math.random() - 0.5) * 120, h * 0.35, sx + (Math.random() - 0.5) * 120, h * 0.7, sx, h);
      g.stroke();
    }

    // Manchas de líquido, pisadas y moho
    stains(g, w, h, 30, 130, '35,28,18', 0.42);
    grain(g, w, h, 26);
  }, rx, ry);

  const rough = paint(512, 512, (g, w, h) => {
    // Linóleo semibrillante con zonas desgastadas opacas en el centro de tránsito
    g.fillStyle = '#8a8a8a';
    g.fillRect(0, 0, w, h);
    // Desgaste de paso
    stains(g, w, h, 25, 90, '20,20,20', 0.55);
    // Charcos reflectantes (rugosidad muy baja = brillo casi espejo)
    for (let i = 0; i < 4; i++) {
      const px = Math.random() * w, py = Math.random() * h, pr = 30 + Math.random() * 50;
      const gr = g.createRadialGradient(px, py, 0, px, py, pr);
      gr.addColorStop(0, '#111111');
      gr.addColorStop(0.8, '#333333');
      gr.addColorStop(1, '#8a8a8a');
      g.fillStyle = gr;
      g.beginPath(); g.arc(px, py, pr, 0, Math.PI * 2); g.fill();
    }
    grain(g, w, h, 70);
  }, rx * 2, ry * 2, false);

  return { map, rough };
}

// Techo suspendido con placas acústicas microperforadas y manchas de filtración
export function ceilingMap(rx, ry) {
  return paint(512, 512, (g, w, h) => {
    g.fillStyle = '#949288';
    g.fillRect(0, 0, w, h);

    // Borde de perfil de aluminio T-bar
    g.strokeStyle = 'rgba(0,0,0,0.6)';
    g.lineWidth = 5;
    g.strokeRect(0, 0, w, h);

    // Microperforaciones acústicas de yeso
    g.fillStyle = 'rgba(20,20,15,0.18)';
    for (let i = 0; i < 900; i++) {
      g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }

    // Manchas circulares de goteras amarillentas (óxido de tuberías)
    stains(g, w, h, 5, 80, '60,42,16', 0.55);
    grain(g, w, h, 26);
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
