// =========================================================================
// MODO RECORRIDO AUTOMÁTICO / INSPECCIÓN CINEMATOGRÁFICA AAA
// Permite recorrer de manera autónoma todos los pisos, salas, props y cinemáticas
// del Hospital San Anselmo para inspección visual y auditoría gráfica.
// =========================================================================

import * as THREE from 'three';

const $ = id => document.getElementById(id);
const show = (id, v) => $(id)?.classList.toggle('hidden', !v);

export const TOUR_STOPS = [
  // -----------------------------------------------------------------------
  // PLANTA BAJA (PISO 1)
  // -----------------------------------------------------------------------
  {
    floor: 1,
    title: 'Planta Baja · Mostrador de Recepción',
    desc: 'Terminal CRT de fósforo verde con telemetría de 1984, libro de guardia y lámpara de latón',
    pos: [3.9, 5.8],
    look: [3.6 * 3, 1.25, 5.2 * 3],
    dwell: 4.0,
    panTo: [3.6 * 3, 1.25, 6.6 * 3],
  },
  {
    floor: 1,
    title: 'Planta Baja · Sala de Espera y Letrero Institucional',
    desc: 'Filas de asientos en tándem, plantas y cartel esmaltado del Hospital San Anselmo',
    pos: [3.8, 3.8],
    look: [1.6 * 3, 1.4, 2.5 * 3],
    dwell: 3.5,
    panTo: [5.0 * 3, 2.5, 6.0 * 3],
  },
  {
    floor: 1,
    title: 'Planta Baja · Salida de Emergencia Sellada',
    desc: 'Puerta exterior clausurada con cartel luminoso verde de salida de emergencia',
    pos: [2.0, 6.0],
    look: [0.0 * 3, 1.8, 6.0 * 3],
    dwell: 3.2,
    panTo: [1.0 * 3, 2.5, 6.0 * 3],
  },
  {
    floor: 1,
    title: 'Planta Baja · Pasillo Central y Señalética',
    desc: 'Paredes institucionales con guardacamillas, zócalos y letreros de sectores',
    pos: [10.0, 6.0],
    look: [16.0 * 3, 1.6, 6.0 * 3],
    dwell: 3.0,
    doors: ['11,5', '11,7'],
  },
  {
    floor: 1,
    title: 'Planta Baja · Baños Públicos',
    desc: 'Lavabos de porcelana blanca, grifería cromada, espejo y estantería de insumos',
    pos: [11.5, 3.0],
    look: [11.5 * 3, 1.3, 0.8 * 3],
    dwell: 3.5,
    doors: ['11,5'],
  },
  {
    floor: 1,
    title: 'Planta Baja · Archivo Clínico',
    desc: 'Archivadores metálicos de historias clínicas, fichas médicas y estanterías despejadas',
    pos: [16.5, 3.0],
    look: [16.5 * 3, 1.3, 1.0 * 3],
    dwell: 3.5,
    doors: ['16,5'],
  },
  {
    floor: 1,
    title: 'Planta Baja · Oficina de Seguridad',
    desc: 'Consola de monitoreo cardíaco secundario, casillero de personal y dispensador de agua',
    pos: [21.5, 2.8],
    look: [22.0 * 3, 1.3, 1.0 * 3],
    dwell: 3.5,
    doors: ['21,5'],
  },
  {
    floor: 1,
    title: 'Planta Baja · Consultorio 1',
    desc: 'Camilla clínica articulada, soporte de suero IV y negatoscopio de pared iluminado',
    pos: [11.8, 9.2],
    look: [12.2 * 3, 1.3, 11.2 * 3],
    dwell: 3.5,
    doors: ['11,7'],
  },
  {
    floor: 1,
    title: 'Planta Baja · Almacén General',
    desc: 'Cajas de insumos médicos estériles, camilla de traslado y estanterías metálicas',
    pos: [16.5, 9.5],
    look: [16.5 * 3, 1.3, 11.2 * 3],
    dwell: 3.5,
    doors: ['16,7'],
  },
  {
    floor: 1,
    title: 'Planta Baja · Farmacia',
    desc: 'Armario de medicación con cerradura digital, estanterías y escritorio de despacho',
    pos: [21.5, 9.2],
    look: [22.4 * 3, 1.4, 7.8 * 3],
    dwell: 3.5,
    doors: ['21,7'],
  },
  {
    floor: 1,
    title: 'Planta Baja · Escaleras hacia Piso 2',
    desc: 'Escaleras de hormigón y barandillas que comunican con los pabellones superiores',
    pos: [24.0, 6.0],
    look: [25.0 * 3, 1.6, 5.5 * 3],
    dwell: 3.0,
  },

  // -----------------------------------------------------------------------
  // PISO 2: PABELLÓN DE INTERNACIÓN GENERAL
  // -----------------------------------------------------------------------
  {
    floor: 2,
    title: 'Piso 2 · Pabellón de Internación General',
    desc: 'Letreros de internación en esmalte verde, camillas y sillas de ruedas en el pasillo',
    pos: [23.0, 6.0],
    look: [16.0 * 3, 1.6, 6.0 * 3],
    dwell: 3.2,
  },
  {
    floor: 2,
    title: 'Piso 2 · Estación de Enfermería del Pasillo',
    desc: 'Mesa de guardia médica nocturna con teléfono analógico y dispensador de agua',
    pos: [14.5, 6.0],
    look: [13.5 * 3, 1.25, 6.32 * 3],
    dwell: 3.5,
  },
  {
    floor: 2,
    title: 'Piso 2 · Habitación 201 (Internación Estándar)',
    desc: 'Cama de hospital realista con ruedas cromadas, barandillas abatibles y soporte IV',
    pos: [2.0, 3.2],
    look: [2.2 * 3, 1.25, 1.0 * 3],
    dwell: 3.5,
    doors: ['2,5'],
  },
  {
    floor: 2,
    title: 'Piso 2 · Habitación 202 (Habitación Doble)',
    desc: 'Cortina divisoria clínica plisada con sombras verticales y camas gemelas',
    pos: [6.5, 3.2],
    look: [6.5 * 3, 1.35, 1.5 * 3],
    dwell: 3.5,
    doors: ['6,5'],
  },
  {
    floor: 2,
    title: 'Piso 2 · Habitación 204 (Habitación Anómala CCTV)',
    desc: 'Monitor cardíaco con trazado ECG verde fosforescente y silla de ruedas desplazada',
    pos: [14.5, 3.2],
    look: [14.5 * 3, 1.25, 1.0 * 3],
    dwell: 3.5,
    doors: ['14,5'],
  },
  {
    floor: 2,
    title: 'Piso 2 · Habitación 206 (Despacho Médico)',
    desc: 'Negatoscopio de pared retroiluminado con radiografía de tórax y escritorio clínico',
    pos: [22.5, 3.2],
    look: [22.0 * 3, 1.5, 1.0 * 3],
    dwell: 3.5,
    doors: ['22,5'],
  },
  {
    floor: 2,
    title: 'Piso 2 · Casillero de Escondite Táctico',
    desc: 'Demostración de mirilla metálica con rejilla louvre para evadir a la entidad',
    pos: [17.0, 5.8],
    look: [17.0 * 3, 1.5, 5.68 * 3],
    dwell: 3.5,
  },

  // -----------------------------------------------------------------------
  // PISO 3: QUIRÓFANO Y TERAPIA INTENSIVA (UCI)
  // -----------------------------------------------------------------------
  {
    floor: 3,
    title: 'Piso 3 · Corredor Quirúrgico y Terapia Intensiva',
    desc: 'Ambiente estéril con iluminación clínica fría y accesos a quirófanos y UCI',
    pos: [22.0, 6.0],
    look: [15.0 * 3, 1.6, 6.0 * 3],
    dwell: 3.2,
  },
  {
    floor: 3,
    title: 'Piso 3 · Quirófano Central Principal',
    desc: 'Mesa quirúrgica de acero, doble cúpula de lámpara reflectora cenital y bisturí de guardia',
    pos: [14.5, 3.5],
    look: [14.5 * 3, 1.35, 1.5 * 3],
    dwell: 3.8,
    doors: ['14,5'],
  },
  {
    floor: 3,
    title: 'Piso 3 · Unidad de Cuidados Intensivos (UCI)',
    desc: 'Monitores cardíacos multiparamétricos, camas articuladas y biombos de aislamiento',
    pos: [6.5, 3.5],
    look: [6.5 * 3, 1.25, 1.2 * 3],
    dwell: 3.5,
    doors: ['6,5'],
  },

  // -----------------------------------------------------------------------
  // PISO 4: ÁREA CLAUSURADA TRAS LA TRAGEDIA DE 1984
  // -----------------------------------------------------------------------
  {
    floor: 4,
    title: 'Piso 4 · Acceso Prohibido y Clausura Policial',
    desc: 'Reja de hierro sellada con precinto policial EXPEDIENTE POLICIAL #84-C',
    pos: [22.5, 6.0],
    look: [24.5 * 3, 1.6, 6.0 * 3],
    dwell: 3.5,
  },
  {
    floor: 4,
    title: 'Piso 4 · Pasillo en Penumbra Roja',
    desc: 'Iluminación intermitente de emergencia roja, cables colgando y puertas clausuradas con tablas',
    pos: [16.0, 6.0],
    look: [8.0 * 3, 1.6, 6.0 * 3],
    dwell: 3.8,
  },
  {
    floor: 4,
    title: 'Piso 4 · Celda del Hermano Recluido',
    desc: 'Cama oxidada de internación psiquiátrica, marcas de arañazos y atmósfera claustrofóbica',
    pos: [9.0, 3.5],
    look: [8.0 * 3, 1.25, 1.8 * 3],
    dwell: 3.8,
    doors: ['8,5'],
  },
  {
    floor: 4,
    title: 'Piso 4 · La Presencia Espectral y el Mensaje',
    desc: 'Manifestación anómala del ente en la oscuridad y advertencia en sangre en el muro',
    pos: [8.0, 6.0],
    look: [5.0 * 3, 1.6, 6.0 * 3],
    dwell: 4.5,
  },
];

export class AutoTour {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.paused = false;
    this.index = 0;
    this.timeInStop = 0;
    this.moving = false;
    this.moveTimer = 0;
    this.moveDuration = 3.0;

    this.startPos = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();
    this.startYaw = 0;
    this.targetYaw = 0;
    this.startPitch = 0;
    this.targetPitch = 0;

    this.initUi();
  }

  initUi() {
    $('btn-tour-prev')?.addEventListener('click', () => this.prev());
    $('btn-tour-next')?.addEventListener('click', () => this.next());
    $('btn-tour-pause')?.addEventListener('click', () => this.togglePause());
    $('btn-tour-floor')?.addEventListener('click', () => this.nextFloor());
    $('btn-tour-stop')?.addEventListener('click', () => this.stop());

    // Botones de inicio en menús
    $('btn-auto-tour')?.addEventListener('click', () => this.start(1));
    $('btn-auto-tour-pause')?.addEventListener('click', () => this.start(this.game.hospital.floorNum || 1));
  }

  start(startFloor = 1) {
    this.active = true;
    this.paused = false;

    // Buscar el primer punto del piso solicitado o el índice 0
    let targetIdx = TOUR_STOPS.findIndex(s => s.floor === startFloor);
    if (targetIdx < 0) targetIdx = 0;
    this.index = targetIdx;

    // Si el juego está en menú o pausa, prepararlo en modo play seguro
    const g = this.game;
    if (g.state === 'menu' || g.state === 'end' || !g.hospital) {
      g.startChapter(0);
    } else if (g.state === 'paused') {
      g.state = 'play';
      show('pause', false);
    }

    g.frozen = true;
    g.player.hasFlash = true;
    g.player.flashOn = true;
    g.player.battery = 1.0;

    show('tour-bar', true);
    show('touch-ui', false);
    this.updateControlsText();

    this.goToStop(this.index, true);
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    this.paused = false;
    this.moving = false;

    show('tour-bar', false);
    const g = this.game;
    g.frozen = false;
    g.input.lock();
    if (g.isMobile) show('touch-ui', true);

    g.say('Has tomado el control de Clara. Modo de recorrido finalizado.', 'Sistema', { extra: 0.5 });
  }

  togglePause() {
    if (!this.active) return;
    this.paused = !this.paused;
    this.updateControlsText();
  }

  updateControlsText() {
    const btn = $('btn-tour-pause');
    if (btn) btn.textContent = this.paused ? 'Reanudar' : 'Pausa';
  }

  next() {
    if (!this.active) return;
    this.index = (this.index + 1) % TOUR_STOPS.length;
    this.goToStop(this.index);
  }

  prev() {
    if (!this.active) return;
    this.index = (this.index - 1 + TOUR_STOPS.length) % TOUR_STOPS.length;
    this.goToStop(this.index);
  }

  nextFloor() {
    if (!this.active) return;
    const curFloor = TOUR_STOPS[this.index].floor;
    const nextIdx = TOUR_STOPS.findIndex(s => s.floor > curFloor);
    this.index = nextIdx >= 0 ? nextIdx : 0;
    this.goToStop(this.index);
  }

  async goToStop(idx, instant = false) {
    const stop = TOUR_STOPS[idx];
    if (!stop) return;

    this.moving = false;
    this.timeInStop = 0;

    // Actualizar HUD
    $('tour-step').textContent = `${idx + 1} / ${TOUR_STOPS.length}`;
    $('tour-title').textContent = stop.title;
    $('tour-desc').textContent = stop.desc;

    const g = this.game;
    const S = 3;

    // Si requiere cambio de piso
    if (g.hospital.floorNum !== stop.floor) {
      await g.toFloor(stop.floor, stop.pos[0], stop.pos[1], 0, 0.45);
      g.player.hasFlash = true;
      g.player.flashOn = true;
      g.player.battery = 1.0;
    }

    // Abrir puertas pertinentes de la sala inspeccionada
    if (stop.doors) {
      for (const k of stop.doors) {
        const d = g.hospital.doors.get(k);
        if (d && !d.open) d.open = true;
      }
    }

    const targetPos = new THREE.Vector3(stop.pos[0] * S, 1.6, stop.pos[1] * S);

    // Calcular yaw y pitch hacia el punto de interés
    const dx = stop.look[0] - targetPos.x;
    const dy = stop.look[1] - targetPos.y;
    const dz = stop.look[2] - targetPos.z;
    const targetYaw = Math.atan2(-dx, -dz);
    const targetPitch = Math.atan2(dy, Math.hypot(dx, dz));

    if (instant) {
      g.player.pos.copy(targetPos);
      g.player.yaw = targetYaw;
      g.player.pitch = targetPitch;
      g.player.targetYaw = targetYaw;
      g.player.targetPitch = targetPitch;
      g.camera.position.copy(targetPos);
      g.camera.rotation.set(targetPitch, targetYaw, 0, 'YXZ');
      this.timeInStop = 0;
      return;
    }

    // Configurar interpolación suave
    this.startPos.copy(g.player.pos);
    this.targetPos.copy(targetPos);

    this.startYaw = g.player.yaw;
    let diffYaw = targetYaw - this.startYaw;
    diffYaw = Math.atan2(Math.sin(diffYaw), Math.cos(diffYaw));
    this.targetYaw = this.startYaw + diffYaw;

    this.startPitch = g.player.pitch;
    this.targetPitch = targetPitch;

    const dist = this.startPos.distanceTo(this.targetPos);
    this.moveDuration = Math.max(2.2, Math.min(4.8, dist * 0.35 + 1.2));
    this.moveTimer = 0;
    this.moving = true;
  }

  update(dt, t) {
    if (!this.active) return;
    if (this.paused) return;

    const g = this.game;
    const stop = TOUR_STOPS[this.index];
    if (!stop) return;

    // Asegurar que la linterna esté siempre encendida
    if (g.player) {
      g.player.hasFlash = true;
      g.player.flashOn = true;
      g.player.battery = 1.0;
    }

    if (this.moving) {
      this.moveTimer += dt;
      const progress = Math.min(1, this.moveTimer / this.moveDuration);
      // Easing cúbico suave in-out
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      g.player.pos.lerpVectors(this.startPos, this.targetPos, ease);
      g.player.yaw = this.startYaw + (this.targetYaw - this.startYaw) * ease;
      g.player.pitch = this.startPitch + (this.targetPitch - this.startPitch) * ease;

      // Movimiento de balanceo al caminar
      const walkBob = Math.sin(this.moveTimer * 7.5) * 0.02 * (1 - ease);
      g.camera.position.set(g.player.pos.x, g.player.pos.y + walkBob, g.player.pos.z);
      g.camera.rotation.set(g.player.pitch, g.player.yaw, 0, 'YXZ');
      g.player.targetYaw = g.player.yaw;
      g.player.targetPitch = g.player.pitch;

      if (progress >= 1) {
        this.moving = false;
        this.timeInStop = 0;
      }
    } else {
      // En la parada: paneo sutil cinematográfico
      this.timeInStop += dt;

      if (stop.panTo) {
        const panProgress = Math.min(1, this.timeInStop / (stop.dwell || 3.5));
        const panEase = Math.sin(panProgress * Math.PI * 0.5);
        const curLookX = stop.look[0] + (stop.panTo[0] - stop.look[0]) * panEase;
        const curLookY = stop.look[1] + (stop.panTo[1] - stop.look[1]) * panEase;
        const curLookZ = stop.look[2] + (stop.panTo[2] - stop.look[2]) * panEase;

        const dx = curLookX - g.player.pos.x;
        const dy = curLookY - g.player.pos.y;
        const dz = curLookZ - g.player.pos.z;
        g.player.yaw = Math.atan2(-dx, -dz);
        g.player.pitch = Math.atan2(dy, Math.hypot(dx, dz));
      }

      g.camera.position.copy(g.player.pos);
      g.camera.rotation.set(g.player.pitch, g.player.yaw, 0, 'YXZ');
      g.player.targetYaw = g.player.yaw;
      g.player.targetPitch = g.player.pitch;

      if (this.timeInStop >= (stop.dwell || 3.5)) {
        this.next();
      }
    }
  }
}
