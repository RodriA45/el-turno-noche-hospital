// =============================================================================
// SISTEMA DE MONITOREO CCTV INTERACTIVO ESTILO FIVE NIGHTS AT FREDDY'S
// =============================================================================

export const CAMS = [
  { id: 1, code: 'CAM 01', name: 'CAM 01 · RECEPCIÓN Y HALL', floor: 'PB', desc: 'Acceso principal y sala de espera' },
  { id: 2, code: 'CAM 02', name: 'CAM 02 · PASILLO URGENCIAS', floor: 'P1', desc: 'Pasillo norte y carros de medicación' },
  { id: 3, code: 'CAM 03', name: 'CAM 03 · PABELLÓN INTERNACIÓN', floor: 'P2', desc: 'Habitaciones 201-204 e internación' },
  { id: 4, code: 'CAM 04', name: 'CAM 04 · QUIRÓFANO Y DEPÓSITO', floor: 'P3', desc: 'Sala de operaciones y esterilización' },
  { id: 5, code: 'CAM 05', name: 'CAM 05 · PABELLÓN CLAUSURADO', floor: 'P4', desc: 'SECTOR CLAUSURADO 1984 · PROHIBIDO', forbidden: true },
];

// Definición de anomalías para la misión estilo FNAF
export const ANOMALIES = {
  1: {
    id: 'child_waiting',
    camId: 1,
    label: 'Silueta infantil en sala de espera',
    hint: 'Verifica los asientos de la sala de espera',
    rect: { x: 0.28, y: 0.62, w: 0.12, h: 0.20 },
    foundMsg: '¡Dios mío!... Hay un niño empapado sentado inmóvil en la sala de espera... pero la puerta de la calle estaba cerrada con llave.',
  },
  2: {
    id: 'wheelchair_moved',
    camId: 2,
    label: 'Silla de ruedas fuera de lugar',
    hint: 'Inspecciona el centro del pasillo de urgencias',
    rect: { x: 0.50, y: 0.65, w: 0.14, h: 0.22 },
    foundMsg: 'Esa silla de ruedas estaba trabada contra la pared... Alguien la empujó al medio del pasillo y dejó marcas en el suelo.',
  },
  3: {
    id: 'door_peek',
    camId: 3,
    label: 'Presencia en habitación clausurada 204',
    hint: 'Observa las puertas de internación al fondo',
    rect: { x: 0.72, y: 0.54, w: 0.11, h: 0.24 },
    foundMsg: 'La puerta de la habitación 204... Está abierta y hay una silueta pálida espiando desde la penumbra.',
  },
  4: {
    id: 'surgeon_shadow',
    camId: 4,
    label: 'Figura dentro del quirófano cerrado',
    hint: 'Mira a través del cristal redondo de la puerta de cirugía',
    rect: { x: 0.44, y: 0.46, w: 0.12, h: 0.20 },
    foundMsg: 'Hay una figura alta con ambo quirúrgico parada frente a la camilla de operaciones...',
  }
};

function noise(g, w, h, amount = 80) {
  for (let i = 0; i < amount; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.22})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 8, 1);
  }
}

// =============================================================================
// CÁMARA 1: RECEPCIÓN Y ENTRADA PRINCIPAL
// =============================================================================
function drawReception(g, w, h, t, s, panX, lightOn) {
  const cx = w / 2 + panX;
  // Paredes y suelo
  g.fillStyle = lightOn ? '#161e1a' : '#0a0e0c';
  g.fillRect(0, 0, w, h * 0.6);
  g.fillStyle = lightOn ? '#1e2823' : '#0d1310';
  g.fillRect(0, h * 0.6, w, h * 0.4);

  // Zócalo
  g.fillStyle = '#080a09';
  g.fillRect(0, h * 0.58, w, 8);

  // Puertas de cristal automáticas al exterior con lluvia
  const doorW = w * 0.38, doorH = h * 0.45;
  const dx = cx - doorW / 2, dy = h * 0.15;
  
  // Noche exterior tras el cristal
  const lightning = Math.sin(t * 12.3) > 0.985 || Math.sin(t * 19.7) > 0.99;
  g.fillStyle = lightning ? '#7ea8be' : '#030508';
  g.fillRect(dx, dy, doorW, doorH);

  // Marcos metálicos de la puerta
  g.strokeStyle = '#222d28';
  g.lineWidth = 4;
  g.strokeRect(dx, dy, doorW, doorH);
  g.beginPath();
  g.moveTo(dx + doorW / 2, dy);
  g.lineTo(dx + doorW / 2, dy + doorH);
  g.stroke();

  // Rayas de lluvia sobre el cristal
  g.strokeStyle = lightning ? 'rgba(255,255,255,0.7)' : 'rgba(120,160,180,0.25)';
  g.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const rx = dx + ((i * 37 + t * 90) % doorW);
    const ry = dy + ((i * 53 + t * 240) % doorH);
    g.beginPath();
    g.moveTo(rx, ry);
    g.lineTo(rx - 3, ry + 12);
    g.stroke();
  }

  // Mostrador de recepción a la derecha
  g.fillStyle = '#1c1510';
  g.fillRect(cx + w * 0.16, h * 0.48, w * 0.32, h * 0.28);
  g.fillStyle = '#2b211a';
  g.fillRect(cx + w * 0.15, h * 0.46, w * 0.34, 10); // tapa de madera
  // Lámpara de banquero
  g.fillStyle = '#183824';
  g.fillRect(cx + w * 0.22, h * 0.42, 28, 14);

  // Sala de espera a la izquierda: sillas en fila
  for (let i = 0; i < 4; i++) {
    const sx = cx - w * 0.42 + i * 54;
    const sy = h * 0.60;
    g.fillStyle = '#11221b';
    g.fillRect(sx, sy, 42, 28); // respaldo
    g.fillStyle = '#1a3328';
    g.fillRect(sx - 2, sy + 28, 46, 12); // asiento
    g.fillStyle = '#080c09';
    g.fillRect(sx + 4, sy + 40, 4, 18);
    g.fillRect(sx + 36, sy + 40, 4, 18);
  }

  // ANOMALÍA: Niño empapado sentado en la 3ra silla
  if (s.anomaliesActive?.includes('child_waiting')) {
    const sx = cx - w * 0.42 + 2 * 54 + 21;
    const sy = h * 0.60 + 35;
    // Silueta oscura con ropa empapada
    g.fillStyle = 'rgba(0, 5, 3, 0.95)';
    g.beginPath();
    g.ellipse(sx, sy - 36, 10, 12, 0, 0, Math.PI * 2); // cabeza
    g.fill();
    g.fillRect(sx - 14, sy - 24, 28, 32); // torso
    g.fillRect(sx - 10, sy + 8, 8, 20); // piernas
    g.fillRect(sx + 2, sy + 8, 8, 20);
    // Ojos pálidos reflejando
    g.fillStyle = Math.sin(t * 3) > 0 ? '#ff4444' : '#ffffff';
    g.fillRect(sx - 4, sy - 38, 2.5, 2.5);
    g.fillRect(sx + 2, sy - 38, 2.5, 2.5);
    // Charco de agua bajo la silla
    g.fillStyle = 'rgba(20, 40, 35, 0.6)';
    g.beginPath();
    g.ellipse(sx, sy + 28, 22, 6, 0, 0, Math.PI * 2);
    g.fill();
  }

  // Luz cenital clínica parpadeante
  const flicker = Math.sin(t * 8) > -0.7 ? 1 : 0.3;
  const grad = g.createRadialGradient(cx, h * 0.35, 40, cx, h * 0.35, w * 0.65);
  grad.addColorStop(0, lightOn ? 'rgba(210,255,230,0.25)' : `rgba(180,240,210,${0.12 * flicker})`);
  grad.addColorStop(1, 'rgba(0,0,0,0.65)');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
}

// =============================================================================
// CÁMARA 2: PASILLO DE URGENCIAS Y CARROS MÉDICOS (PISO 1)
// =============================================================================
function drawUrgencyCorridor(g, w, h, t, s, panX, lightOn) {
  const cx = w / 2 + panX, cy = h * 0.44;
  g.fillStyle = lightOn ? '#18221d' : '#080d0b';
  g.fillRect(0, 0, w, h);

  // Perspectiva de túnel
  const poly = (pts, fill) => {
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
    g.closePath(); g.fillStyle = fill; g.fill();
  };
  const iw = w * 0.14, ih = h * 0.16;
  poly([[0, 0], [w, 0], [cx + iw, cy - ih], [cx - iw, cy - ih]], lightOn ? '#1f2b24' : '#0e1612'); // techo
  poly([[0, h], [w, h], [cx + iw, cy + ih], [cx - iw, cy + ih]], lightOn ? '#28352d' : '#141c17'); // suelo
  poly([[0, 0], [cx - iw, cy - ih], [cx - iw, cy + ih], [0, h]], lightOn ? '#222f28' : '#111814'); // pared izq
  poly([[w, 0], [cx + iw, cy - ih], [cx + iw, cy + ih], [w, h]], lightOn ? '#222f28' : '#111814'); // pared der
  poly([[cx - iw, cy - ih], [cx + iw, cy - ih], [cx + iw, cy + ih], [cx - iw, cy + ih]], '#020403'); // fondo

  // Guardacamillas rojo en las paredes
  g.strokeStyle = '#5a1d1d';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, h * 0.55); g.lineTo(cx - iw, cy + ih * 0.4);
  g.moveTo(w, h * 0.55); g.lineTo(cx + iw, cy + ih * 0.4);
  g.stroke();

  // ANOMALÍA: Silla de ruedas desplazada en el medio del pasillo
  const anomalyActive = s.anomaliesActive?.includes('wheelchair_moved');
  const wx = anomalyActive ? cx : cx - iw * 1.5;
  const wy = cy + ih * 1.35;
  const ws = anomalyActive ? 1.0 : 0.65;

  // Silla de ruedas dibujada en detalle
  g.save();
  g.translate(wx, wy);
  // Ruedas grandes
  g.strokeStyle = '#3a4440';
  g.lineWidth = 3;
  g.beginPath(); g.arc(-16 * ws, 0, 18 * ws, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(16 * ws, 0, 18 * ws, 0, Math.PI * 2); g.stroke();
  // Asiento y respaldo
  g.fillStyle = '#0f1714';
  g.fillRect(-18 * ws, -28 * ws, 36 * ws, 18 * ws); // respaldo
  g.fillRect(-18 * ws, -10 * ws, 36 * ws, 10 * ws); // asiento
  // Manijas de empuje
  g.fillStyle = '#222';
  g.fillRect(-16 * ws, -34 * ws, 4 * ws, 8 * ws);
  g.fillRect(12 * ws, -34 * ws, 4 * ws, 8 * ws);
  g.restore();

  // Huellas de ruedas ensangrentadas si la anomalía está activa
  if (anomalyActive) {
    g.strokeStyle = 'rgba(120, 20, 20, 0.45)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx - 16, wy); g.lineTo(cx - 10, cy + ih * 0.8);
    g.moveTo(cx + 16, wy); g.lineTo(cx + 10, cy + ih * 0.8);
    g.stroke();
  }

  // Tubos fluorescentes en el techo
  for (let i = 0; i < 3; i++) {
    const k = (i + 1) / 4;
    const ty = cy - ih + (h * 0.0 - (cy - ih)) * (1 - k);
    const tw = (1 - k) * 90 + 20;
    const on = Math.sin(t * 11 + i * 2.3) > -0.6;
    g.fillStyle = on ? (lightOn ? '#e6fff0' : 'rgba(180,240,215,0.85)') : 'rgba(30,45,35,0.3)';
    g.fillRect(cx - tw / 2, ty + 12, tw, 3);
  }

  // Viñeta
  const gr = g.createRadialGradient(cx, cy, 30, cx, cy, w * 0.65);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, lightOn ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.82)');
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
}

// =============================================================================
// CÁMARA 3: PABELLÓN INTERNACIÓN PEDIÁTRICA (PISO 2)
// =============================================================================
function drawPediatricWard(g, w, h, t, s, panX, lightOn) {
  const cx = w / 2 + panX, cy = h * 0.42;
  g.fillStyle = lightOn ? '#17201c' : '#080b09';
  g.fillRect(0, 0, w, h);

  // Pasillo largo
  const iw = w * 0.13, ih = h * 0.15;
  g.fillStyle = '#0f1714';
  g.fillRect(cx - iw, cy - ih, iw * 2, ih * 2); // fondo

  // Puertas de habitaciones numeradas
  // Puerta 204 a la derecha
  const p204x = cx + iw * 1.8, p204y = cy - ih * 0.3;
  g.fillStyle = '#14100c';
  g.fillRect(p204x, p204y, 48, 120);
  g.fillStyle = '#3a443e';
  g.font = '10px monospace';
  g.fillText('204', p204x + 12, p204y - 8);

  // ANOMALÍA: Puerta 204 abierta con silueta espiando
  const anomalyActive = s.anomaliesActive?.includes('door_peek');
  if (anomalyActive) {
    // Puerta abierta mostrando oscuridad interior
    g.fillStyle = '#000000';
    g.fillRect(p204x + 4, p204y + 2, 40, 116);
    // Silueta pálida con cabeza asomándose por el marco
    const hx = p204x + 10, hy = p204y + 36;
    g.fillStyle = 'rgba(230, 240, 235, 0.9)';
    g.beginPath();
    g.ellipse(hx, hy, 8, 11, 0.2, 0, Math.PI * 2); // cabeza pálida
    g.fill();
    // Ojo oscuro fijo
    g.fillStyle = '#000';
    g.fillRect(hx + 2, hy - 2, 2.5, 4);
    // Mano pálida agarrando el marco de la puerta
    g.fillStyle = '#e0eae4';
    g.fillRect(p204x, hy + 22, 5, 14);
  }

  // Soporte de suero (IV Stand) a la izquierda oscilando
  const ivSwing = Math.sin(t * 3.5) * (anomalyActive ? 18 : 3);
  const ivX = cx - iw * 1.4 + ivSwing;
  const ivY = cy + ih * 0.4;
  g.strokeStyle = '#4a5550';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(ivX, ivY + 80); g.lineTo(ivX, ivY); // mástil
  g.lineTo(ivX - 10, ivY - 12);
  g.moveTo(ivX, ivY);
  g.lineTo(ivX + 10, ivY - 12);
  g.stroke();
  // Bolsa de suero
  g.fillStyle = 'rgba(200, 240, 255, 0.6)';
  g.fillRect(ivX - 12, ivY - 8, 6, 12);

  // Viñeta
  const gr = g.createRadialGradient(cx, cy, 20, cx, cy, w * 0.65);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, lightOn ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.85)');
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
}

// =============================================================================
// CÁMARA 4: QUIRÓFANO Y DEPÓSITO (PISO 3)
// =============================================================================
function drawSurgery(g, w, h, t, s, panX, lightOn) {
  const cx = w / 2 + panX, cy = h * 0.45;
  g.fillStyle = lightOn ? '#101a18' : '#050a08';
  g.fillRect(0, 0, w, h);

  // Puertas dobles de quirófano con ventanillas redondas
  const dw = 140, dh = 180;
  const dx = cx - dw / 2, dy = cy - dh * 0.35;
  g.fillStyle = '#182420';
  g.fillRect(dx, dy, dw, dh);
  g.strokeStyle = '#2d3f38';
  g.lineWidth = 3;
  g.strokeRect(dx, dy, dw, dh);
  g.beginPath(); g.moveTo(cx, dy); g.lineTo(cx, dy + dh); g.stroke();

  // Ventanillas redondas con luz fría adentro
  const r1x = cx - 36, r2x = cx + 36, ry = dy + 45;
  g.fillStyle = '#061014';
  g.beginPath(); g.arc(r1x, ry, 18, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.arc(r2x, ry, 18, 0, Math.PI * 2); g.fill(); g.stroke();

  // ANOMALÍA: Cirujano mirando a través del cristal redondo
  const anomalyActive = s.anomaliesActive?.includes('surgeon_shadow');
  if (anomalyActive) {
    g.fillStyle = '#e6fff0';
    // Ojos/mascarilla asomándose en la ventanilla izquierda
    g.beginPath(); g.arc(r1x, ry, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0b1612';
    g.fillRect(r1x - 8, ry - 3, 16, 12); // mascarilla verde oscura
    g.fillStyle = '#ff2222';
    g.fillRect(r1x - 5, ry - 7, 3, 3); // ojos
    g.fillRect(r1x + 2, ry - 7, 3, 3);
  }

  // Lámpara quirúrgica gigante colgando del techo
  const lampSwing = Math.sin(t * 1.8) * 12;
  const lx = cx + lampSwing, ly = h * 0.15;
  g.strokeStyle = '#3a4440';
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(cx, 0); g.lineTo(lx, ly); g.stroke();
  // Cúpula cóncava
  g.fillStyle = '#4a5c54';
  g.beginPath(); g.ellipse(lx, ly + 14, 48, 16, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = Math.sin(t * 5) > -0.3 ? '#88ffcc' : '#143324';
  g.beginPath(); g.ellipse(lx, ly + 14, 34, 10, 0, 0, Math.PI * 2); g.fill();
}

// =============================================================================
// CÁMARA 5: PABELLÓN CLAUSURADO 1984 (PISO 4 - CLÍMAX Y JUMPSCARE)
// =============================================================================
function drawForbiddenCorridor(g, w, h, t, s, panX, lightOn) {
  const cx = w / 2 + panX, cy = h * 0.46;

  // Luz de emergencia roja intermitente
  const redAlert = Math.sin(t * 4) > 0;
  g.fillStyle = redAlert ? '#190507' : '#050102';
  g.fillRect(0, 0, w, h);

  // Perspectiva opresiva
  const iw = w * 0.12, ih = h * 0.14;
  // Cinta amarilla y negra de CLAUSURADO
  g.strokeStyle = '#c9a227';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(cx - iw * 1.8, cy + ih * 0.2);
  g.lineTo(cx + iw * 1.8, cy - ih * 0.1);
  g.stroke();

  // Texto CLAUSURADO 1984 en la pared
  g.save();
  g.translate(w * 0.18, h * 0.44);
  g.rotate(-0.06);
  g.font = 'bold 26px "Special Elite", monospace';
  g.fillStyle = 'rgba(255, 40, 40, 0.85)';
  g.shadowColor = '#ff0000';
  g.shadowBlur = 8;
  g.fillText('CLAUSURADO · NO ENTRAR', 0, 0);
  if (s.cam4Writing) {
    g.fillStyle = 'rgba(0, 0, 0, 0.95)';
    g.fillText('AYÚDALO', 40, 45);
  }
  g.restore();

  // CLÍMAX / JUMPSCARE DE LA ENTIDAD
  if (s.jumpscareActive) {
    // Zoom agresivo violento en la cara del gemelo
    const zoom = Math.min(4.5, 1.0 + (s.jumpscareProgress || 0) * 3.5);
    g.save();
    g.translate(cx, cy);
    g.scale(zoom, zoom);
    // Cabeza cadavérica distorsionada
    g.fillStyle = '#e8eee9';
    g.beginPath(); g.ellipse(0, -20, 28, 36, 0, 0, Math.PI * 2); g.fill();
    // Boca abierta gritando en agonía
    g.fillStyle = '#050203';
    g.beginPath(); g.ellipse(0, 0, 14, 22, 0, 0, Math.PI * 2); g.fill();
    // Ojos negros profundos con iris rojo brillante
    g.fillStyle = '#000';
    g.beginPath(); g.arc(-11, -26, 8, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(11, -26, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ff1122';
    g.beginPath(); g.arc(-11, -26, 3, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(11, -26, 3, 0, Math.PI * 2); g.fill();
    g.restore();
    // Tearing y artefactos salvajes
    noise(g, w, h, 280);
    return;
  }

  // Figura distante de pie en el medio del pasillo
  if (s.cam4Ghost || s.climaxReady) {
    const gx = cx, gy = cy + ih * 0.4;
    const gs = 0.85;
    g.fillStyle = 'rgba(0, 0, 0, 0.92)';
    g.beginPath(); g.ellipse(gx, gy - 74 * gs, 12 * gs, 15 * gs, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(gx - 15 * gs, gy - 60 * gs, 30 * gs, 55 * gs);
    g.fillRect(gx - 12 * gs, gy - 5 * gs, 10 * gs, 38 * gs);
    g.fillRect(gx + 2 * gs, gy - 5 * gs, 10 * gs, 38 * gs);
    // Ojos rojos mirando fijo
    g.fillStyle = '#ff2233';
    g.fillRect(gx - 5 * gs, gy - 76 * gs, 3 * gs, 3 * gs);
    g.fillRect(gx + 2 * gs, gy - 76 * gs, 3 * gs, 3 * gs);
  }

  // Viñeta oscura pesada
  const gr = g.createRadialGradient(cx, cy, 20, cx, cy, w * 0.7);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, 'rgba(0,0,0,0.92)');
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
}

// =============================================================================
// RENDERIZADOR PRINCIPAL DEL FEED DE CÁMARA
// =============================================================================
export function drawFeed(canvas, cam, t, s, panX = 0, lightOn = false) {
  const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  g.save();

  // Pantalla de reflejo en corte o susto
  if (s.reflection) {
    g.fillStyle = '#020302'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(70,100,90,0.15)'; g.fillRect(w * 0.1, h * 0.15, w * 0.8, h * 0.85);
    // Silueta de Clara
    g.fillStyle = 'rgba(0,0,0,0.7)';
    g.beginPath(); g.ellipse(w * 0.5, h * 0.82, 34, 45, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(w * 0.5 - 45, h * 0.82, 90, 100);
    if (s.reflectionFigure) {
      // Figura espectral parada detrás de Clara
      g.fillStyle = 'rgba(10,0,0,0.85)';
      g.beginPath(); g.ellipse(w * 0.5 + 110, h * 0.78, 26, 34, 0, 0, Math.PI * 2); g.fill();
      g.fillRect(w * 0.5 + 85, h * 0.80, 50, 90);
      g.fillStyle = '#ff3333';
      g.fillRect(w * 0.5 + 104, h * 0.76, 4, 4);
      g.fillRect(w * 0.5 + 116, h * 0.76, 4, 4);
    }
  } else if (cam.id === 5 && !s.cam4On && !s.climaxReady) {
    // Cámara 4 fuera de servicio / sin señal
    g.fillStyle = '#080908'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#34d399'; g.font = '24px "Special Elite", monospace'; g.textAlign = 'center';
    g.fillText('CANAL BLOQUEADO · ACCESO RESTRINGIDO', w / 2, h / 2 - 12);
    g.fillStyle = '#ef4444'; g.font = '16px monospace';
    g.fillText('DIRECTIVA DE DIRECCIÓN MÉDICA 1984', w / 2, h / 2 + 24);
  } else {
    // Dibujo del escenario según la cámara
    if (cam.id === 1) drawReception(g, w, h, t, s, panX, lightOn);
    else if (cam.id === 2) drawUrgencyCorridor(g, w, h, t, s, panX, lightOn);
    else if (cam.id === 3) drawPediatricWard(g, w, h, t, s, panX, lightOn);
    else if (cam.id === 4) drawSurgery(g, w, h, t, s, panX, lightOn);
    else if (cam.id === 5) drawForbiddenCorridor(g, w, h, t, s, panX, lightOn);
  }

  // Estática / Tearing analógico estilo VHS / CRT
  noise(g, w, h, lightOn ? 40 : 85);
  g.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);

  // Salto aleatorio de tracking
  if (Math.random() < 0.05) {
    const sliceY = Math.random() * h;
    g.drawImage(canvas, 0, sliceY, w, 14, (Math.random() - 0.5) * 36, sliceY, w, 14);
  }

  // HUD estilo FNAF en pantalla
  g.fillStyle = 'rgba(120, 255, 180, 0.9)';
  g.font = 'bold 15px "Special Elite", monospace';
  g.textAlign = 'left';
  g.fillText(cam.name, 18, 28);
  g.font = '12px monospace';
  g.fillStyle = 'rgba(90, 200, 140, 0.8)';
  g.fillText(cam.desc || '', 18, 46);

  // Reloj en tiempo real
  const sec = Math.floor(t) % 60;
  const min = Math.floor(t / 60) % 60;
  g.font = 'bold 14px monospace';
  g.fillStyle = 'rgba(140, 255, 200, 0.85)';
  g.fillText(`00:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')} AM · PISO ${cam.floor}`, 18, h - 18);

  // Piloto parpadeante REC
  if (Math.floor(t * 2) % 2) {
    g.fillStyle = '#ff2e44';
    g.beginPath(); g.arc(w - 24, 26, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255, 180, 190, 0.9)';
    g.textAlign = 'right';
    g.fillText('REC', w - 36, 31);
  }

  // Indicador de luz de cámara activa
  if (lightOn) {
    g.fillStyle = '#ffcc00';
    g.textAlign = 'right';
    g.fillText('LUZ SECTOR: ON', w - 24, h - 18);
  }

  g.restore();
}

// Verifica si las coordenadas de un clic caen dentro de la anomalía de la cámara actual
export function hitTestAnomaly(camId, xRatio, yRatio, activeAnomalies = []) {
  for (const anom of Object.values(ANOMALIES)) {
    if (anom.camId === camId && activeAnomalies.includes(anom.id)) {
      const r = anom.rect;
      if (
        xRatio >= r.x &&
        xRatio <= r.x + r.w &&
        yRatio >= r.y &&
        yRatio <= r.y + r.h
      ) {
        return anom;
      }
    }
  }
  return null;
}
