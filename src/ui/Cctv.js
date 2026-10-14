// Dibujo procedural de las cámaras de seguridad (CCTV)
export const CAMS = [
  { id: 1, name: 'CAM 1 · RECEPCIÓN' },
  { id: 2, name: 'CAM 2 · PISO 2' },
  { id: 3, name: 'CAM 3 · PISO 3' },
  { id: 4, name: 'CAM 4 · PISO 4', forbidden: true },
];

function noise(g, w, h, amount) {
  for (let i = 0; i < amount; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1);
  }
}

function corridor(g, w, h, t, { lights = 4, doors = 5, dark = 0, tilt = 0 }) {
  const vx = w / 2 + tilt, vy = h * 0.46;
  g.fillStyle = '#0c1210'; g.fillRect(0, 0, w, h);
  // techo, suelo, paredes
  const poly = (pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = fill; g.fill(); };
  const iw = w * 0.12, ih = h * 0.14;
  poly([[0, 0], [w, 0], [vx + iw, vy - ih], [vx - iw, vy - ih]], '#1a211e');
  poly([[0, h], [w, h], [vx + iw, vy + ih], [vx - iw, vy + ih]], '#232a26');
  poly([[0, 0], [vx - iw, vy - ih], [vx - iw, vy + ih], [0, h]], '#2a322d');
  poly([[w, 0], [vx + iw, vy - ih], [vx + iw, vy + ih], [w, h]], '#2a322d');
  poly([[vx - iw, vy - ih], [vx + iw, vy - ih], [vx + iw, vy + ih], [vx - iw, vy + ih]], '#070a09');
  // puertas
  for (let i = 0; i < doors; i++) {
    const k = (i + 1) / (doors + 1), z = Math.pow(1 - k, 1.6);
    const x1 = (vx - iw) * (1 - z), y1 = (vy - ih) + (0 - (vy - ih)) * z;
    const ww = 0, d = z;
    const dw = 70 * d + 6, dh = 190 * d + 14;
    const px = (vx - iw) * (1 - d);
    g.fillStyle = '#17120d';
    g.fillRect(px + 4 * d, vy + ih * (1 - d) - dh + (h * 0.12) * d, dw * 0.1, dh);
    // simple: rectángulos laterales
    const lx = (vx - iw) * d * 0.0 + (vx - iw - (vx - iw) * (1 - 0)) ;
    g.fillStyle = '#120f0b';
    const fx = vx - iw - (vx - iw) * d, fy = vy - ih * 0.2 - dh * 0.35 + (h - vy) * d * 0.4;
    g.fillRect(fx + 8, vy - dh * 0.45 + (1 - d) * 0, 18 * (1 - d) + 3, dh * 0.7);
    g.fillRect(w - (fx + 8) - (18 * (1 - d) + 3), vy - dh * 0.45, 18 * (1 - d) + 3, dh * 0.7);
  }
  // luces del techo
  for (let i = 0; i < lights; i++) {
    const z = (i + 1) / (lights + 1);
    const f = 1 - z;
    const y = (vy - ih) * z * 0.9 + 4;
    const lw = (1 - z) * 90 + 6;
    const on = Math.sin(t * 9 + i * 3.1) > -0.7 - dark * 0.3;
    g.fillStyle = on ? 'rgba(210,255,225,0.9)' : 'rgba(40,60,50,0.4)';
    g.fillRect(w / 2 + tilt - lw / 2, y + 4, lw, 3 + f * 3);
  }
  // viñeta de oscuridad
  const gr = g.createRadialGradient(vx, vy, 10, vx, vy, w * 0.7);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${0.55 + dark * 0.3})`);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}

function lobby(g, w, h, t) {
  g.fillStyle = '#0d1311'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#212925'; g.fillRect(0, h * 0.55, w, h * 0.45);
  g.fillStyle = '#18201d'; g.fillRect(0, 0, w, h * 0.55);
  g.fillStyle = '#2c3a33'; g.fillRect(w * 0.1, h * 0.5, w * 0.8, 24); // mostrador
  for (let i = 0; i < 3; i++) { g.fillStyle = '#0f1916'; g.fillRect(w * 0.18 + i * 80, h * 0.3, 60, 30); }
  g.fillStyle = '#233029'; for (let i = 0; i < 4; i++) g.fillRect(w * 0.15 + i * 120, h * 0.78, 90, 22);
  const on = Math.sin(t * 7) > -0.6;
  g.fillStyle = on ? 'rgba(210,255,225,.85)' : 'rgba(40,60,50,.4)'; g.fillRect(w * 0.3, 6, 120, 7); g.fillRect(w * 0.6, 6, 120, 7);
  const gr = g.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, w * 0.7);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.65)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}

function silhouette(g, w, h, x, y, s, a) {
  g.fillStyle = `rgba(0,0,0,${a})`;
  g.beginPath(); g.ellipse(x, y - 78 * s, 12 * s, 15 * s, 0, 0, 7); g.fill();
  g.fillRect(x - 15 * s, y - 64 * s, 30 * s, 56 * s); g.fillRect(x - 12 * s, y - 8 * s, 9 * s, 38 * s); g.fillRect(x + 3 * s, y - 8 * s, 9 * s, 38 * s);
  g.fillStyle = `rgba(210,40,40,${a})`; g.fillRect(x - 6 * s, y - 80 * s, 3 * s, 3 * s); g.fillRect(x + 3 * s, y - 80 * s, 3 * s, 3 * s);
}

export function drawFeed(canvas, cam, t, s) {
  const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  g.save();
  if (s.reflection) {
    // pantalla en negro con el reflejo de la recepcionista y una figura detrás
    g.fillStyle = '#020403'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(90,120,110,0.14)'; g.fillRect(w * 0.1, h * 0.15, w * 0.8, h * 0.85);
    silhouette(g, w, h, w * 0.5, h * 0.98, 2.1, 0.55); // protagonista
    if (s.reflectionFigure) { silhouette(g, w, h, w * 0.5 + 100, h * 0.95, 1.6, 0.9); g.fillStyle = 'rgba(180,180,170,.12)'; g.fillRect(w * 0.5 + 80, h * 0.3, 40, 60); }
  } else if (cam.id === 4 && !s.cam4On) {
    g.fillStyle = '#111'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7bffb4'; g.font = '22px "Special Elite", monospace'; g.textAlign = 'center';
    g.fillText('SIN SEÑAL', w / 2, h / 2);
  } else if (cam.id === 1) lobby(g, w, h, t);
  else if (cam.id === 4) {
    corridor(g, w, h, t, { lights: 3, doors: 4, dark: 1, tilt: Math.sin(t * 0.6) * 4 });
    if (s.cam4Writing) {
      g.save(); g.translate(w * 0.18, h * 0.45); g.rotate(-0.05); g.font = 'bold 30px "Special Elite", monospace'; g.fillStyle = 'rgba(0,0,0,.95)';
      g.shadowColor = 'rgba(180,255,210,.5)'; g.shadowBlur = 4; g.fillText('AYÚDALO', 0, 0); g.restore();
    }
    if (s.cam4Ghost && Math.sin(t * 2) > -0.2) silhouette(g, w, h, w * 0.5, h * 0.6, 0.7, 0.8);
  } else {
    corridor(g, w, h, t, { lights: 4, doors: 5, dark: cam.id === 3 ? 0.5 : 0 });
    if (s.ghostOnCam === cam.id && Math.sin(t * 3) > -0.5) silhouette(g, w, h, w * 0.5 + Math.sin(t) * 8, h * 0.58, 0.55, 0.8);
  }
  // artefactos analógicos
  noise(g, w, h, 90);
  g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  if (Math.random() < 0.04) { const y = Math.random() * h; g.drawImage(canvas, 0, y, w, 12, (Math.random() - 0.5) * 30, y, w, 12); }
  g.fillStyle = 'rgba(160,255,200,.9)'; g.font = '15px monospace'; g.textAlign = 'left';
  g.fillText(cam.name, 14, 24);
  const sec = Math.floor(t) % 60;
  g.fillText(`03:0${Math.floor(t / 60) % 10}:${String(sec).padStart(2, '0')}`, 14, h - 14);
  if (Math.floor(t * 2) % 2) { g.fillStyle = '#ff4a4a'; g.beginPath(); g.arc(w - 26, 22, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,200,200,.9)'; g.fillText('REC', w - 70, 28); }
  g.restore();
}
