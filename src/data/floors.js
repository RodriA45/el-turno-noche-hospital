// Definición de los 4 pisos del hospital. Cada piso se construye con un helper
// para evitar errores al dibujar mapas a mano.
export const S = 3;          // tamaño de celda (metros)
export const WALL_H = 3.3;   // altura de techo

class FB {
  constructor(W, H) {
    this.W = W; this.H = H;
    this.g = Array.from({ length: H }, () => Array(W).fill('#'));
    this.doors = {}; this.decor = []; this.decals = []; this.lights = []; this.stairs = [];
  }
  carve(x1, z1, x2, z2) { for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) this.g[z][x] = '.'; }
  door(x, z, o = {}) { this.g[z][x] = 'D'; this.doors[x + ',' + z] = { label: 'Puerta', ...o }; }
  deco(type, x, z, rot = 0, o = {}) { this.decor.push({ type, x, z, rot, ...o }); }
  // cara: 'n' (pared hacia z-), 's', 'w' (x-), 'e'
  decal(x, z, face, text, o = {}) { this.decals.push({ x, z, face, text, ...o }); }
  light(x, z, intensity = 22, color = 0xdfeee2, o = {}) { this.lights.push({ x, z, intensity, color, ...o }); }
  stair(x, z, dir, target) { this.g[z][x] = '.'; this.stairs.push({ x, z, dir, target }); }
  map() { return this.g.map(r => r.join('')); }
}

const ROOM_XS = [[1, 3], [5, 7], [9, 11], [13, 15], [17, 19], [21, 23]];

// =========================================================================
// PISO 2: PABELLÓN DE INTERNACIÓN GENERAL
// =========================================================================
function buildInpatientFloor(n = 2) {
  const f = new FB(27, 13);
  f.name = `Piso ${n} · Pabellón de Internación`;
  f.carve(1, 6, 25, 6); // Pasillo central

  // Escaleras
  f.stair(25, 5, 'up', { floor: 3, x: 25, z: 6, yaw: Math.PI / 2 });
  f.stair(25, 7, 'down', { floor: 1, x: 25, z: 6, yaw: Math.PI / 2 });
  f.carve(25, 5, 25, 5); f.carve(25, 7, 25, 7);

  // 12 Habitaciones de internación con ambientación individualizada
  let roomIdx = 1;
  for (const side of ['n', 's']) {
    for (const [a, b] of ROOM_XS) {
      const z1 = side === 'n' ? 1 : 8, z2 = side === 'n' ? 4 : 11, dz = side === 'n' ? 5 : 7;
      f.carve(a, z1, b, z2);
      const dx = a + 1;
      const numStr = String(roomIdx).padStart(2, '0');
      const roomNum = `${n}${numStr}`;
      const label = `Habitación ${roomNum}`;
      f.door(dx, dz, { label });
      f.decal(dx + 1, 6, side === 'n' ? 'n' : 's', roomNum, { w: 0.5, h: 0.25, y: 1.9, size: 60 });

      const midZ = side === 'n' ? 2.5 : 9.5;
      const bedZ = side === 'n' ? 0.90 : 11.10;
      const cabZ = side === 'n' ? 0.62 : 11.38;
      const doorSideZ = side === 'n' ? 4.38 : 7.62;
      const headRot = side === 'n' ? 0 : 180;

      switch (roomIdx) {
        case 1: // Habitación 201: Internación estándar recuperándose
          f.deco('bed', a + 1.2, bedZ, headRot);
          f.deco('cabinet', a + 0.4, cabZ, headRot);
          f.deco('iv', a + 2.1, bedZ, 0);
          f.deco('chair', b - 0.5, doorSideZ, side === 'n' ? 180 : 0);
          f.deco('trash', a + 0.5, doorSideZ, 0);
          break;

        case 2: // Habitación 202: Habitación doble con cortina divisoria
          f.deco('curtainDivider', a + 1.5, midZ, 90);
          f.deco('bed', a + 0.8, bedZ, headRot);
          f.deco('bed', a + 2.2, bedZ, headRot);
          f.deco('cabinet', a + 0.4, cabZ, headRot);
          f.deco('iv', a + 2.5, bedZ, 0);
          break;

        case 3: // Habitación 203: Recuperación pediátrica
          f.deco('bed', a + 1.2, bedZ, headRot);
          f.deco('cabinet', a + 0.4, cabZ, headRot);
          f.deco('bench', b - 0.38, midZ, 90);
          f.deco('trash', a + 0.5, doorSideZ, 0);
          break;

        case 4: // Habitación 204: La habitación anómala de las cámaras CCTV
          f.deco('bed', a + 1.2, bedZ, headRot);
          f.deco('wheelchair', a + 1.5, midZ + 0.2, 45); // Silla movida sola
          f.deco('cardiacMonitor', a + 2.4, cabZ, headRot);
          f.deco('cabinet', a + 0.4, cabZ, headRot);
          f.deco('iv', a + 0.4, midZ, 0);
          break;

        case 5: // Habitación 205: Almacén de lencería y apósitos estériles
          f.deco('shelf', a + 1.5, cabZ, headRot);
          f.deco('shelf', a + 0.38, midZ, 270);
          f.deco('cabinet', b - 0.38, midZ, 90);
          f.deco('sink', a + 0.62, cabZ + (side === 'n' ? 1.0 : -1.0), headRot);
          break;

        case 6: // Habitación 206: Despacho médico de guardia con negatoscopio
          f.deco('desk', a + 1.5, midZ, headRot, { len: 2.0, small: true });
          f.deco('chair', a + 1.5, side === 'n' ? 1.8 : 10.2, headRot === 0 ? 180 : 0);
          f.deco('xrayViewer', a + 0.5, side === 'n' ? 0.52 : 11.48, headRot);
          f.deco('cabinet', b - 0.38, midZ, 90);
          break;

        case 7: // Habitación 207: Terapia semi-intensiva con monitor cardíaco
          f.deco('bed', a + 1.2, bedZ, headRot);
          f.deco('cardiacMonitor', a + 2.3, cabZ, headRot);
          f.deco('iv', a + 2.3, midZ, 0);
          f.deco('cabinet', a + 0.4, cabZ, headRot);
          f.deco('chair', b - 0.5, midZ, 90);
          break;

        case 8: // Habitación 208: Habitación con silla de ruedas estacionada
          f.deco('bed', a + 1.2, bedZ, headRot);
          f.deco('cabinet', a + 0.4, cabZ, headRot);
          f.deco('wheelchair', b - 0.6, midZ, 30);
          f.deco('trash', a + 0.5, cabZ + 0.8, 0);
          break;

        case 9: // Habitación 209: Habitación de aislamiento
          f.deco('curtainDivider', a + 1.5, midZ, 90);
          f.deco('bed', a + 1.2, bedZ, headRot);
          f.deco('iv', a + 0.4, bedZ, 0);
          f.deco('iv', a + 2.3, bedZ, 0);
          f.deco('cabinet', a + 0.38, midZ, 90);
          break;

        case 10: // Habitación 210: Habitación de estancia prolongada
          f.deco('bed', a + 1.2, bedZ, headRot);
          f.deco('cabinet', a + 0.4, cabZ, headRot);
          f.deco('bench', b - 0.38, midZ, 90);
          f.deco('shelf', a + 0.38, midZ, 270);
          break;

        case 11: // Habitación 211: Estación de medicación y curaciones
          f.deco('shelf', a + 1.5, cabZ, headRot);
          f.deco('cabinet', a + 0.38, midZ, 90);
          f.deco('sink', b - 0.62, midZ, 270);
          f.deco('trash', a + 0.5, cabZ + 0.8, 0);
          break;

        case 12: // Habitación 212: Depósito de camillas de traslado
          f.deco('gurney', a + 1.0, midZ, 0);
          f.deco('wheelchair', b - 0.6, cabZ, 20);
          f.deco('shelf', b - 0.38, midZ, 90);
          f.deco('trash', a + 0.5, cabZ + 0.8, 0);
          break;
      }
      roomIdx++;
    }
  }

  // Pasillo central del Piso 2: Estación de enfermería, camillas, extintores
  // Estación de Enfermería en el corredor (Pared sur z = 6.5)
  f.deco('desk', 13.5, 6.32, 180, { len: 2.2, small: true });
  f.deco('chair', 13.5, 5.85, 0);
  f.deco('waterDispenser', 14.8, 6.32, 180);

  // Equipamiento en pasillo (Pared norte z = 5.5, sur z = 6.5)
  f.deco('gurney', 6.8, 5.68, 90);
  f.deco('iv', 7.8, 5.68, 0);
  f.deco('wheelchair', 10.4, 6.32, 40);
  f.deco('locker', 16.5, 5.68, 0, { hiding: true });
  f.deco('locker', 17.3, 5.68, 0, { hiding: true });
  f.deco('fireExtinguisher', 4.5, 5.52, 0);
  f.deco('fireExtinguisher', 20.5, 5.52, 0);
  f.deco('bench', 18.2, 6.32, 180);
  f.deco('trash', 24.2, 6.32, 0);
  f.deco('plant', 24.5, 5.68, 0);

  // Carteles de pasillo
  f.decal(14.5, 6, 'n', 'PABELLÓN 2 · INTERNACIÓN GENERAL', { w: 2.4, h: 0.4, y: 2.3, size: 70, fg: '#e8e0cc', bg: '#103828' });
  f.decal(24, 6, 'e', 'PISO 2', { w: 1.4, h: 0.5, y: 2.3, size: 120, fg: '#e8e0cc', bg: '#0f3a2a' });

  [4, 10, 15, 20, 24].forEach((x, i) => f.light(x, 6, 15, 0xdfeee2, { unstable: i % 2 === 1 }));
  f.ambient = 0.55; f.fog = 0.055;
  return f;
}

// =========================================================================
// PISO 3: QUIRÓFANO Y TERAPIA INTENSIVA (UCI)
// =========================================================================
function buildSurgicalFloor() {
  const f = new FB(27, 13);
  f.name = 'Piso 3 · Quirófano y Cuidados Intensivos';
  f.carve(1, 6, 25, 6);

  f.stair(25, 5, 'up', { floor: 4, x: 25, z: 6, yaw: Math.PI / 2 });
  f.stair(25, 7, 'down', { floor: 2, x: 25, z: 6, yaw: Math.PI / 2 });
  f.carve(25, 5, 25, 5); f.carve(25, 7, 25, 7);

  // Salas Norte (301-306)
  // 301-302: Zona de lavado y preparación quirúrgica
  for (const [a, b] of [[1, 3], [5, 7]]) {
    const dx = a + 1;
    f.carve(a, 1, b, 4);
    f.door(dx, 5, { label: a === 1 ? 'Lavado Quirúrgico' : 'Esterilización' });
    f.decal(dx + 1, 6, 'n', `30${Math.floor(a / 4) + 1}`, { w: 0.5, h: 0.25, y: 1.9, size: 60 });
    f.deco('sink', a + 1.2, 0.60, 0);
    f.deco('cabinet', b - 0.38, 2.5, 90);
    f.deco('trash', a + 0.5, 4.38, 0);
  }

  // 303-304: EL GRAN QUIRÓFANO PRINCIPAL (Operating Theatre)
  // Doble habitación unificada para dar escala de sala de cirugía AAA
  f.carve(9, 1, 15, 4);
  f.door(10, 5, { label: 'Quirófano 1' });
  f.door(14, 5, { label: 'Quirófano 1 · Acceso Instrumental' });
  f.decal(11, 6, 'n', 'QUIRÓFANO 1', { w: 1.6, h: 0.35, y: 2.2, size: 65, fg: '#fff', bg: '#1b3a4b' });

  // Mesa de operaciones quirúrgica central
  f.deco('surgeryTable', 12.0, 2.5, 90);
  // Lámpara cialítica suspendida encima
  f.deco('surgicalLamp', 12.0, 2.5, 90);
  // Monitor cardíaco con trazado ECG verde
  f.deco('cardiacMonitor', 10.5, 2.0, 135);
  // Negatoscopio de rayos X al ras de la pared norte
  f.deco('xrayViewer', 13.5, 0.52, 0);
  // Estantería de acero con instrumental al ras de la pared este
  f.deco('shelf', 15.38, 2.5, 270);
  // Lavabo quirúrgico de apoyo al ras de la pared oeste
  f.deco('sink', 8.62, 2.5, 90);
  // Cubo de residuos biológicos
  f.deco('trash', 9.8, 4.38, 0);

  // 305-306: Reanimación post-operatoria
  for (const [a, b] of [[17, 19], [21, 23]]) {
    const dx = a + 1;
    f.carve(a, 1, b, 4);
    f.door(dx, 5, { label: `Reanimación 30${Math.floor(a / 4) + 1}` });
    f.decal(dx + 1, 6, 'n', `30${Math.floor(a / 4) + 1}`, { w: 0.5, h: 0.25, y: 1.9, size: 60 });
    f.deco('bed', a + 1.2, 0.90, 0);
    f.deco('cardiacMonitor', a + 2.3, 0.62, 0);
    f.deco('iv', a + 0.4, 0.90, 0);
    f.deco('cabinet', b - 0.38, 2.5, 90);
  }

  // Salas Sur (307-312)
  // 307-308: Terapia Intensiva (UCI)
  for (const [a, b] of [[1, 3], [5, 7]]) {
    const dx = a + 1;
    f.carve(a, 8, b, 11);
    f.door(dx, 7, { label: `UCI ${a === 1 ? 'A' : 'B'}` });
    f.decal(dx + 1, 6, 's', `UCI-${a === 1 ? 'A' : 'B'}`, { w: 0.6, h: 0.25, y: 1.9, size: 55 });
    f.deco('bed', a + 1.2, 11.10, 180);
    f.deco('cardiacMonitor', a + 2.3, 11.38, 180);
    f.deco('iv', a + 0.4, 11.10, 0);
    f.deco('curtainDivider', a + 1.5, 9.5, 90);
  }

  // 309-310: Despacho de jefatura de cirugía y reportes (Pared sur z = 11.5)
  f.carve(9, 8, 11, 11); f.door(10, 7, { label: 'Jefatura de Cirugía' });
  f.decal(11, 6, 's', 'JEFATURA', { w: 1.1, h: 0.25, y: 1.9, size: 50 });
  f.deco('desk', 10.0, 10.8, 180, { len: 2.0, small: true });
  f.deco('chair', 10.0, 10.15, 0);
  f.deco('cabinet', 10.8, 11.38, 180);
  f.deco('xrayViewer', 10.0, 11.48, 180);

  f.carve(13, 8, 15, 11); f.door(14, 7, { label: 'Suministros Estériles' });
  f.deco('shelf', 14.0, 11.38, 180);
  f.deco('shelf', 13.0, 7.62, 0);
  f.deco('crate', 14.8, 9.5, 30);

  // 311: Sala de Autopsias / Morgue Clínica (Escenario de terror de los flashbacks)
  f.carve(17, 8, 19, 11); f.door(18, 7, { label: 'Sala de Autopsias', lock: 'autopsy' });
  f.decal(19, 6, 's', 'AUTOPSIAS · MORGUE', { w: 1.6, h: 0.35, y: 2.2, size: 55, fg: '#fff', bg: '#421616' });
  f.deco('gurney', 18.0, 9.5, 90, { corpse: true }); // Camilla de autopsia con cuerpo amortajado
  f.deco('shelf', 18.8, 11.38, 180);
  f.deco('sink', 17.4, 11.38, 180);
  f.deco('trash', 17.4, 7.62, 0);

  // 312: Depósito de reactivos y muestras biológicas
  f.carve(21, 8, 23, 11); f.door(22, 7, { label: 'Depósito Biológico' });
  f.deco('cabinet', 22.0, 11.38, 180);
  f.deco('shelf', 21.1, 7.62, 0);
  f.deco('trash', 22.8, 9.5, 0);

  // Pasillo del Piso 3 (Pared norte z = 5.5, sur z = 6.5)
  f.deco('gurney', 5.5, 5.68, 90);
  f.deco('wheelchair', 8.5, 6.32, 25);
  f.deco('locker', 16.5, 5.68, 0, { hiding: true });
  f.deco('locker', 17.3, 5.68, 0, { hiding: true });
  f.deco('waterDispenser', 12.0, 6.32, 180);
  f.deco('fireExtinguisher', 7.5, 5.52, 0);
  f.deco('fireExtinguisher', 19.5, 5.52, 0);

  f.decal(14.5, 6, 'n', 'PABELLÓN 3 · QUIRÓFANO Y TERAPIA INTENSIVA', { w: 2.6, h: 0.4, y: 2.3, size: 70, fg: '#e8e0cc', bg: '#1c2e42' });
  f.decal(24, 6, 'e', 'PISO 3', { w: 1.4, h: 0.5, y: 2.3, size: 120, fg: '#e8e0cc', bg: '#0f3a2a' });

  [4, 10, 15, 20, 24].forEach((x, i) => f.light(x, 6, 14, 0xc8e6f0, { unstable: i % 2 === 1 }));
  f.ambient = 0.45; f.fog = 0.060;
  return f;
}

// =========================================================================
// PISO 4: ÁREA RESTRINGIDA Y CLAUSURADA TRAS LA TRAGEDIA DE 1984
// =========================================================================
function buildForbiddenFloor() {
  const f = new FB(27, 13);
  f.name = 'Piso 4 · Área clausurada (1984)';
  f.carve(6, 6, 25, 6);

  // Celda prohibida del gemelo tras la puerta sellada de hierro
  f.carve(1, 4, 4, 8);
  f.door(5, 6, { label: 'Puerta prohibida', lock: 'forbidden' });

  // Habitaciones clausuradas del Piso 4 (401-408)
  [[7, 9], [11, 13], [15, 17], [19, 21]].forEach(([a, b], i) => {
    f.carve(a, 1, b, 4); f.door(a + 1, 5, { label: `Habitación 40${i + 1}` });
    f.carve(a, 8, b, 11); f.door(a + 1, 7, { label: `Habitación 40${i + 5}` });

    // Habitaciones caóticas: camas volcadas, taquillas abiertas, sillas rotas
    f.deco(i % 2 ? 'gurney' : 'bed', a + 1.1, 0.95, i * 45);
    f.deco('cabinet', a + 0.4, 0.62, 0);
    f.deco('wheelchair', a + 1.8, 11.2, 30 + i * 40);
    if (i === 1) f.deco('crate', b - 0.38, 8.8, 20);
    if (i === 2) f.deco('locker', a + 1.7, 4.38, 0, { hiding: true });
    if (i === 3) f.deco('cardiacMonitor', a + 0.6, 9.5, 75);
  });

  f.carve(25, 5, 25, 5); f.carve(25, 7, 25, 7);
  f.stair(25, 7, 'down', { floor: 3, x: 25, z: 6, yaw: Math.PI / 2 });

  // Pasillo del piso 4: sillas volcadas, camillas rotas, casilleros de escondite
  f.deco('wheelchair', 8.2, 6.32, 75);
  f.deco('gurney', 12.0, 5.68, 90);
  f.deco('locker', 14.5, 5.68, 0, { hiding: true });
  f.deco('crate', 17.5, 6.32, 25);
  f.deco('gurney', 21.0, 5.68, 90, { corpse: true });
  f.deco('trash', 23.5, 6.32, 0);

  // Celda prohibida del hermano (atmósfera de horror puro)
  f.deco('bed', 2.2, 3.90, 0); // Cama de contención con correas al ras de la pared norte
  f.deco('chair', 3.2, 6.5, 40);
  f.deco('crate', 1.2, 7.5, 10);
  f.deco('locker', 1.2, 3.62, 0, { hiding: true });
  f.deco('iv', 3.2, 3.90, 0);

  // Mensajes de sangre y expedientes
  f.decal(14, 6, 'n', 'AYÚDALO', { w: 2.4, h: 0.9, y: 1.7, size: 130, fg: '#0a0a0a', bg: null, name: 'help', font: 'bold {s}px "Special Elite", monospace', hidden: true });
  f.decal(24, 6, 'e', 'PISO 4 · RESTRINGIDO', { w: 1.8, h: 0.4, y: 2.4, size: 80, fg: '#d5c49a', bg: '#3a1d1d' });
  f.decal(6.0, 6, 'w', 'ZONA DE CUARENTENA · 1984', { w: 2.2, h: 0.5, y: 2.5, size: 65, fg: '#fff', bg: '#5a1212' });

  f.light(16, 6, 3, 0xff4030, { unstable: true });
  f.light(2.5, 6, 5, 0xbfd0ff, { unstable: true });
  f.ambient = 0.55; f.fog = 0.085;
  return f;
}

// =========================================================================
// ENTRADA PRINCIPAL: CONSTRUCTOR DE PISOS 1 A 4
// =========================================================================
function buildFloorRaw(n) {
  if (n === 1) {
    const f = new FB(27, 13);
    f.name = 'Planta baja';
    f.carve(1, 1, 8, 11);              // recepción / sala de espera
    f.carve(9, 6, 25, 6);              // pasillo central
    // Salas norte
    f.carve(10, 1, 13, 4); f.door(11, 5, { label: 'Baños' });
    f.carve(15, 1, 18, 4); f.door(16, 5, { label: 'Archivo Clínico', lock: 'archive' });
    f.carve(20, 1, 23, 4); f.door(21, 5, { label: 'Seguridad' });
    // Salas sur
    f.carve(10, 8, 13, 11); f.door(11, 7, { label: 'Consultorio 1' });
    f.carve(15, 8, 18, 11); f.door(16, 7, { label: 'Almacén General' });
    f.carve(20, 8, 23, 11); f.door(21, 7, { label: 'Farmacia' });
    f.carve(25, 5, 25, 5);
    f.g[6][0] = 'X'; f.doors['0,6'] = { label: 'Entrada principal', lock: 'front', exit: true };
    f.stair(25, 5, 'up', { floor: 2, x: 25, z: 6, yaw: Math.PI / 2 });

    // Mostrador de recepción hiper detallado estilo AAA
    f.deco('desk', 3.6, 6, 90, { len: 8.2 });
    f.deco('chair', 4.8, 5.8, 270); // Silla ergonómica de Clara

    // Tras el mostrador (pared este de recepción, dejando despejado el acceso al pasillo z=5 a z=7)
    f.deco('locker', 7.8, 2.5, 270, { hiding: true });
    f.deco('locker', 7.8, 3.5, 270, { hiding: true });
    f.deco('cabinet', 7.8, 8.5, 270);
    f.deco('waterDispenser', 7.6, 9.8, 270);

    // Sala de espera: filas de asientos y elementos confort
    f.deco('bench', 1.6, 2.2, 0);
    f.deco('bench', 1.6, 3.8, 0);
    f.deco('bench', 1.6, 8.2, 0);
    f.deco('bench', 1.6, 9.8, 0);
    f.deco('bench', 3.2, 3.2, 0);
    f.deco('bench', 3.2, 8.8, 180);
    f.deco('bench', 4.5, 1.4, 90);
    f.deco('bench', 4.5, 10.6, 90);

    // Esquinas de recepción
    f.deco('vending', 7.6, 1.4, 180);
    f.deco('plant', 1.4, 1.4, 0);
    f.deco('plant', 1.4, 10.6, 0);
    f.deco('plant', 7.8, 10.6, 0);
    f.deco('wheelchair', 6.8, 10.4, 20);
    f.deco('iv', 7.4, 8.8, 0);
    f.deco('trash', 2.6, 1.4, 0);
    f.deco('fireExtinguisher', 8.8, 5.8, 90);

    // Carteles y señalética de recepción
    f.decal(5.0, 6, 'e', 'HOSPITAL SAN ANSELMO', { w: 2.6, h: 0.5, y: 2.55, size: 90, fg: '#e8e0cc', bg: '#1d3a3a' });
    f.decal(1.0, 6, 'w', 'SALIDA DE EMERGENCIA', { w: 1.4, h: 0.4, y: 2.55, size: 75, fg: '#e8e0cc', bg: '#3a1d1d' });
    f.decal(4.0, 1.1, 's', 'NORMAS DE LA INSTITUCIÓN · 1984', { w: 2.0, h: 0.5, y: 1.9, size: 55, fg: '#222', bg: '#e8e2d0' });
    f.decal(7.8, 8.6, 'w', 'GUARDIA MÉDICA NOCTURNA', { w: 1.6, h: 0.35, y: 2.0, size: 50, fg: '#fff', bg: '#1c2d25' });

    // Pasillo central de planta baja
    f.deco('plant', 9.5, 5.68, 0);
    f.deco('locker', 13.5, 5.68, 0, { hiding: true });
    f.deco('fireExtinguisher', 14.8, 5.52, 0);
    f.deco('gurney', 18.8, 5.68, 90);
    f.deco('waterDispenser', 23.5, 5.68, 0);

    f.deco('wheelchair', 13.5, 6.32, 20);
    f.deco('trash', 14.2, 6.32, 0);
    f.deco('locker', 18.5, 6.32, 180, { hiding: true });
    f.deco('plant', 24.5, 6.32, 0);

    // Letreros de pasillo montados al ras de la pared junto a cada puerta
    f.decal(12, 6, 'n', 'BAÑOS', { w: 0.9, h: 0.28, y: 1.9, size: 45, fg: '#fff', bg: '#1b3328' });
    f.decal(17, 6, 'n', 'ARCHIVO CLÍNICO', { w: 1.5, h: 0.3, y: 1.9, size: 45, fg: '#fff', bg: '#3a1b1b' });
    f.decal(22, 6, 'n', 'SEGURIDAD', { w: 1.2, h: 0.3, y: 1.9, size: 45, fg: '#fff', bg: '#1c2e42' });
    f.decal(12, 6, 's', 'CONSULTORIO 1', { w: 1.4, h: 0.3, y: 1.9, size: 45, fg: '#fff', bg: '#1b3328' });
    f.decal(17, 6, 's', 'ALMACÉN GENERAL', { w: 1.5, h: 0.3, y: 1.9, size: 45, fg: '#fff', bg: '#1b3328' });
    f.decal(22, 6, 's', 'FARMACIA', { w: 1.2, h: 0.3, y: 1.9, size: 45, fg: '#fff', bg: '#1b3328' });
    f.decal(24.8, 6, 'e', 'ESCALERAS ↑', { w: 1.3, h: 0.4, y: 2.5, size: 100, fg: '#e8e0cc', bg: '#0f3a2a' });

    // 1. Baños (Pared norte z = 0.5)
    f.deco('sink', 10.8, 0.60, 0);
    f.deco('sink', 12.4, 0.60, 0);
    f.deco('trash', 10.2, 0.60, 0);
    f.deco('shelf', 13.38, 2.5, 270);

    // 2. Archivo Clínico (Pared norte z = 0.5, sur z = 4.5, puerta en x=16 z=5 despejada)
    f.deco('cabinet', 15.4, 0.62, 0);
    f.deco('cabinet', 16.6, 0.62, 0);
    f.deco('cabinet', 17.8, 0.62, 0);
    f.deco('shelf', 15.38, 2.2, 270);
    f.deco('shelf', 17.62, 2.2, 90);
    f.deco('desk', 16.5, 2.2, 0, { len: 2.0, small: true });
    f.deco('chair', 16.5, 2.8, 180);

    // 3. Seguridad (Pared norte z = 0.5, este x = 23.5, puerta en x=21 z=5 despejada)
    f.deco('desk', 21.5, 0.72, 0, { len: 2.2, small: true });
    f.deco('chair', 21.5, 1.35, 180);
    f.deco('cardiacMonitor', 22.6, 0.72, 270);
    f.deco('waterDispenser', 20.2, 0.65, 0);
    f.deco('locker', 23.38, 2.5, 270, { hiding: true });
    f.deco('shelf', 22.62, 3.2, 90);
    f.deco('trash', 20.2, 1.8, 0);

    // 4. Consultorio 1 (Pared sur z = 11.5)
    f.deco('bed', 12.2, 11.10, 180);
    f.deco('iv', 11.3, 11.10, 0);
    f.deco('xrayViewer', 12.2, 11.48, 180);
    f.deco('sink', 10.2, 11.40, 180);
    f.deco('desk', 11.2, 8.2, 0, { len: 2.0, small: true });
    f.deco('chair', 11.2, 8.8, 180);
    f.deco('chair', 12.2, 8.2, 0);
    f.deco('cabinet', 13.38, 9.5, 270);

    // 5. Almacén General (Pared norte z = 7.5, sur z = 11.5, puerta en x=16 z=7 despejada)
    f.deco('shelf', 15.38, 9.5, 270);
    f.deco('shelf', 17.62, 9.5, 90);
    f.deco('crate', 15.5, 11.2, 15);
    f.deco('crate', 16.5, 11.2, 45);
    f.deco('gurney', 17.5, 11.10, 180);
    f.deco('wheelchair', 14.8, 9.5, 30);
    f.deco('trash', 18.38, 9.5, 270);

    // 6. Farmacia (Pared norte z = 7.5, sur z = 11.5, oeste x = 19.5, este x = 23.5)
    f.deco('cabinet', 22.4, 7.62, 0);
    f.deco('shelf', 19.62, 9.0, 90);
    f.deco('shelf', 19.62, 10.2, 90);
    f.deco('desk', 23.35, 10.0, 90, { len: 2.0, small: true });
    f.deco('chair', 22.7, 10.0, 270);
    f.deco('sink', 21.2, 11.38, 180);
    f.deco('waterDispenser', 23.35, 8.0, 90);
    f.deco('trash', 20.2, 11.38, 180);

    // Iluminación equilibrada y cinematográfica
    f.light(3.6, 5.0, 16, 0xffeedd); f.light(3.6, 7.0, 16, 0xffeedd);
    f.light(1.8, 6.0, 14, 0xdfeee2); f.light(6, 8.8, 12);
    f.light(12, 6, 15); f.light(17, 6, 15, 0xdfeee2, { unstable: true }); f.light(22, 6, 15);
    f.light(16.5, 2.5, 10, 0xffe6b8); f.light(21.5, 2.5, 10, 0xffe6b8);
    f.ambient = 0.65; f.fog = 0.045;
    return f;
  }
  if (n === 2) return buildInpatientFloor(2);
  if (n === 3) return buildSurgicalFloor();
  if (n === 4) return buildForbiddenFloor();
  return buildInpatientFloor(n);
}

// =========================================================================
// NORMALIZACIÓN DE DECORADO: muebles de pared siempre con la espalda contra la
// pared más cercana (frente hacia la habitación) y a ras, sin flotar ni
// atravesar el muro. Corrige rotaciones invertidas y separaciones del mapa.
// =========================================================================
const WALL_HALF_DEPTH = {
  cabinet: 0.31, locker: 0.28, shelf: 0.27, sink: 0.27, xrayViewer: 0.055,
  fireExtinguisher: 0.05, vending: 0.425, waterDispenser: 0.17,
};
// rot (grados) con la espalda hacia: [dx, dz] -> rot
const BACK_ROT = [[0, -1, 0], [0, 1, 180], [-1, 0, 90], [1, 0, 270]];

function normalizeDecor(f) {
  const map = f.map();
  const isWall = (x, z) => {
    const cx = Math.round(x / S), cz = Math.round(z / S);
    if (cz < 0 || cx < 0 || cz >= map.length || cx >= map[0].length) return true;
    return map[cz][cx] === '#';
  };
  for (const d of f.decor) {
    const half = WALL_HALF_DEPTH[d.type];
    if (half === undefined) continue;
    const maxGap = d.type === 'sink' ? 4.2 : 2.8;
    const px = d.x * S, pz = d.z * S;
    let best = null;
    for (const [bx, bz, rot] of BACK_ROT) {
      for (let t = 0; t < 3.2; t += 0.01) {
        if (isWall(px + bx * t, pz + bz * t)) {
          if (!best || t < best.t) best = { t, bx, bz, rot };
          break;
        }
      }
    }
    if (!best) continue;
    const gap = best.t - half;
    if (gap > maxGap || gap < -0.25) continue;      // objeto exento (a propósito en el medio de la sala)
    d.rot = best.rot;
    const shift = gap - 0.03;
    d.x = (px + best.bx * shift) / S;
    d.z = (pz + best.bz * shift) / S;
  }
  return f;
}

export function buildFloor(n) {
  return normalizeDecor(buildFloorRaw(n));
}
