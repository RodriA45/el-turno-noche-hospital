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

function patientFloor(n) {
  const f = new FB(27, 13);
  f.name = `Piso ${n}`;
  f.carve(1, 6, 25, 6);
  let num = 1;
  for (const side of ['n', 's']) {
    for (const [a, b] of ROOM_XS) {
      const z1 = side === 'n' ? 1 : 8, z2 = side === 'n' ? 4 : 11, dz = side === 'n' ? 5 : 7;
      f.carve(a, z1, b, z2);
      const dx = a + 1, label = `Habitación ${n}${String(num++).padStart(2, '0')}`;
      f.door(dx, dz, { label });
      f.decal(dx + 1, 6, side === 'n' ? 'n' : 's', `${n}${String(num - 1).padStart(2, '0')}`, { w: 0.5, h: 0.25, y: 1.9, size: 60 });
      // mobiliario
      const cz = side === 'n' ? z1 + 0.9 : z2 - 0.9;
      f.deco(num % 3 === 0 ? 'gurney' : 'bed', a + 1.0, cz, 90 * 0, {});
      if (num % 2 === 0) f.deco('iv', a + 2.2, cz + (side === 'n' ? 0.3 : -0.3), 0);
      if (num % 4 === 0) f.deco('chair', b + 0.2 - 0.6, side === 'n' ? z2 - 0.3 : z1 + 0.3, 40);
    }
  }
  f.carve(25, 5, 25, 5); f.carve(25, 7, 25, 7);
  // pasillo: sillas de ruedas, armarios y detalles
  f.deco('wheelchair', 3.4, 6.7, 70);
  f.deco('locker', 5.2, 4.2, 90, { hiding: true });
  f.deco('locker', 17.2, 4.2, 90, { hiding: true });
  f.deco('plant', 24.4, 6.6, 0);
  f.deco('trash', 12.6, 5.6, 0);
  f.decal(24, 6, 'e', n === 4 ? 'PISO 4' : `PISO ${n}`, { w: 1.4, h: 0.5, y: 2.3, size: 120, fg: '#e8e0cc', bg: '#0f3a2a' });
  return f;
}

export function buildFloor(n) {
  if (n === 1) {
    const f = new FB(27, 13);
    f.name = 'Planta baja';
    f.carve(1, 1, 8, 11);              // recepción / sala de espera
    f.carve(9, 6, 25, 6);              // pasillo
    // Salas norte
    f.carve(10, 1, 13, 4); f.door(11, 5, { label: 'Baños' });
    f.carve(15, 1, 18, 4); f.door(16, 5, { label: 'Archivo', lock: 'archive' });
    f.carve(20, 1, 23, 4); f.door(21, 5, { label: 'Seguridad', lock: 'security' });
    // Salas sur
    f.carve(10, 8, 13, 11); f.door(11, 7, { label: 'Consultorio 1' });
    f.carve(15, 8, 18, 11); f.door(16, 7, { label: 'Almacén' });
    f.carve(20, 8, 23, 11); f.door(21, 7, { label: 'Farmacia' });
    f.carve(25, 5, 25, 5);
    f.g[6][0] = 'X'; f.doors['0,6'] = { label: 'Entrada principal', lock: 'front', exit: true };
    f.stair(25, 5, 'up', { floor: 2, x: 25, z: 6, yaw: Math.PI / 2 });

    // Recepción: mostrador largo entre la entrada y el pasillo
    f.deco('desk', 3.6, 6, 90, { len: 8.2 });
    f.deco('bench', 1.5, 2.0, 0); f.deco('bench', 4.5, 1.4, 0); f.deco('bench', 1.5, 10.0, 0); f.deco('bench', 4.5, 10.6, 0);
    f.deco('vending', 7.5, 1.4, 0); f.deco('plant', 1.3, 1.3, 0); f.deco('plant', 8.0, 11.0, 0);
    f.deco('wheelchair', 7.0, 9.8, 200); f.deco('iv', 7.4, 8.2, 0); f.deco('cabinet', 7.7, 4.0, 270);
    f.decal(5, 6, 'e', 'HOSPITAL SAN ANSELMO', { w: 2.6, h: 0.5, y: 2.55, size: 90, fg: '#e8e0cc', bg: '#1d3a3a' });
    f.decal(1, 6, 'w', 'ENTRADA', { w: 1.2, h: 0.35, y: 2.55, size: 80, fg: '#e8e0cc', bg: '#3a1d1d' });
    f.decal(8, 3, 'n', 'RECEPCIÓN · TURNO NOCHE', { w: 2.2, h: 0.3, y: 1.7, size: 50, fg: '#222', bg: '#cfc7aa' });
    // Archivo
    f.deco('cabinet', 15.5, 1.2, 0); f.deco('cabinet', 16.8, 1.2, 0); f.deco('cabinet', 18.2, 1.2, 0);
    f.deco('cabinet', 15.4, 3.0, 90); f.deco('shelf', 17.6, 3.9, 0); f.deco('desk', 17.0, 2.4, 0, { len: 2.2, small: true });
    // Seguridad
    f.deco('desk', 21.5, 1.4, 0, { len: 2.6, small: true }); f.deco('locker', 23.3, 2.0, 270, { hiding: true }); f.deco('locker', 23.3, 3.0, 270, { hiding: true }); f.deco('chair', 21.3, 2.3, 200);
    // Consultorio
    f.deco('bed', 12.4, 9.8, 90 * 0); f.deco('iv', 11.2, 9.4, 0); f.deco('cabinet', 10.4, 8.2, 0);
    // Almacén / Farmacia
    f.deco('shelf', 15.5, 8.5, 0); f.deco('shelf', 17.2, 8.5, 0); f.deco('wheelchair', 16.0, 10.6, 20); f.deco('crate', 18.0, 10.5, 30);
    f.deco('shelf', 20.5, 8.5, 0); f.deco('shelf', 22.2, 8.5, 0); f.deco('shelf', 20.4, 10.8, 0);
    f.deco('sink', 10.6, 1.4, 0); f.deco('sink', 12.4, 1.4, 0);
    f.deco('trash', 12.6, 3.6, 0);
    f.decal(25, 6, 'e', 'ESCALERA ↑', { w: 1.3, h: 0.4, y: 2.5, size: 100, fg: '#e8e0cc', bg: '#0f3a2a' });
    // Luces de recepción y dependencias
    f.light(3.6, 5.0, 36, 0xfff4e0); f.light(3.6, 7.0, 36, 0xfff4e0);
    f.light(1.8, 6.0, 26, 0xdfeee2); f.light(6, 8.8, 22);
    f.light(12, 6, 24); f.light(17, 6, 24, 0xdfeee2, { unstable: true }); f.light(22, 6, 24);
    f.light(16.5, 2.5, 14, 0xffe6b8); f.light(21.5, 2.5, 14, 0xffe6b8);
    f.ambient = 2.4; f.fog = 0.050;
    return f;
  }
  if (n === 2 || n === 3) {
    const f = patientFloor(n);
    f.stair(25, 5, 'up', { floor: n + 1, x: 25, z: 6, yaw: Math.PI / 2 });
    f.stair(25, 7, 'down', { floor: n - 1, x: 25, z: 6, yaw: Math.PI / 2 });
    [4, 10, 15, 20, 24].forEach((x, i) => f.light(x, 6, 24, 0xdfeee2, { unstable: i % 2 === 1 }));
    f.ambient = n === 2 ? 1.7 : 1.4; f.fog = 0.065;
    return f;
  }
  // Piso 4: oscuro, restringido
  const f = new FB(27, 13);
  f.name = 'Piso 4 · Área restringida';
  f.carve(6, 6, 25, 6);
  f.carve(1, 4, 4, 8);                                  // celda detrás de la puerta prohibida
  f.door(5, 6, { label: 'Puerta prohibida', lock: 'forbidden' });
  [[7, 9], [11, 13], [15, 17], [19, 21]].forEach(([a, b], i) => {
    f.carve(a, 1, b, 4); f.door(a + 1, 5, { label: `Habitación 40${i + 1}` });
    f.carve(a, 8, b, 11); f.door(a + 1, 7, { label: `Habitación 40${i + 5}` });
    f.deco(i % 2 ? 'gurney' : 'bed', a + 1.0, 1.9, 0);
    f.deco('wheelchair', a + 1.8, 10.1, 30 + i * 40);
    if (i === 1) f.deco('crate', b - 0.5, 8.8, 20);
    if (i === 2) f.deco('locker', a + 1.2, 3.6, 0, { hiding: true });
  });
  f.carve(25, 5, 25, 5); f.carve(25, 7, 25, 7);
  f.stair(25, 7, 'down', { floor: 3, x: 25, z: 6, yaw: Math.PI / 2 });
  // Celda del hermano
  f.deco('bed', 2.2, 5.2, 0); f.deco('chair', 3.6, 7.4, 40); f.deco('crate', 1.4, 7.6, 10);
  f.deco('locker', 1.8, 4.4, 0, { hiding: true });
  f.decal(14, 6, 'n', 'AYÚDALO', { w: 2.4, h: 0.9, y: 1.7, size: 130, fg: '#0a0a0a', bg: null, name: 'help', font: 'bold {s}px "Special Elite", monospace', hidden: true });
  f.decal(24, 6, 'e', 'PISO 4 · RESTRINGIDO', { w: 1.8, h: 0.4, y: 2.4, size: 80, fg: '#d5c49a', bg: '#3a1d1d' });
  f.light(16, 6, 3, 0xff4030, { unstable: true });
  f.light(2.5, 6, 5, 0xbfd0ff, { unstable: true });
  f.ambient = 0.55; f.fog = 0.085;
  return f;
}
