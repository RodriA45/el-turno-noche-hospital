export class Input {
  constructor(dom) {
    this.dom = dom;
    this.keys = new Set();
    this.pressed = new Set();
    this.dx = 0; this.dy = 0;
    this.locked = false;
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // Ejes táctiles (joystick virtual). axisY > 0 = adelante
    this.axisX = 0; this.axisY = 0; this.sprintTouch = false;

    addEventListener('keydown', e => {
      if (e.repeat) return;
      this.keys.add(e.code); this.pressed.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    addEventListener('mousemove', e => {
      if (!this.locked || this.isTouch) return;
      // Filtrar saltos sintéticos del cursor del navegador al re-centrar el ratón en PointerLock
      if (Math.abs(e.movementX) > 350 || Math.abs(e.movementY) > 350) return;
      this.dx += e.movementX; this.dy += e.movementY;
    });
    document.addEventListener('pointerlockchange', () => {
      if (this.isTouch) return;
      this.locked = document.pointerLockElement === dom;
      this.onLockChange?.(this.locked);
    });
    if (this.isTouch) this.setupTouch();
  }

  setupTouch() {
    document.body.classList.add('is-touch');
    const $ = id => document.getElementById(id);
    const moveZone = $('touch-move'), lookZone = $('touch-look');
    const stick = $('stick'), knob = $('stick-knob');
    const R = 56;
    let moveId = null, ox = 0, oy = 0;

    moveZone.addEventListener('pointerdown', e => {
      if (moveId !== null) return;
      moveId = e.pointerId; moveZone.setPointerCapture(moveId);
      ox = e.clientX; oy = e.clientY;
      stick.style.left = ox + 'px'; stick.style.top = oy + 'px';
      stick.classList.add('active');
      knob.style.transform = 'translate(-50%,-50%)';
    });
    moveZone.addEventListener('pointermove', e => {
      if (e.pointerId !== moveId) return;
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      this.axisX = dx / R; this.axisY = -dy / R;
      this.sprintTouch = Math.hypot(this.axisX, this.axisY) > 0.93 && this.axisY > 0.5;
      stick.classList.toggle('sprint', this.sprintTouch);
    });
    const endMove = e => {
      if (e.pointerId !== moveId) return;
      moveId = null; this.axisX = this.axisY = 0; this.sprintTouch = false;
      stick.classList.remove('active', 'sprint');
    };
    moveZone.addEventListener('pointerup', endMove);
    moveZone.addEventListener('pointercancel', endMove);

    let lookId = null, lx = 0, ly = 0;
    lookZone.addEventListener('pointerdown', e => {
      if (lookId !== null) return;
      lookId = e.pointerId; lookZone.setPointerCapture(lookId); lx = e.clientX; ly = e.clientY;
    });
    lookZone.addEventListener('pointermove', e => {
      if (e.pointerId !== lookId) return;
      this.dx += (e.clientX - lx) * 1.5; this.dy += (e.clientY - ly) * 1.5;
      lx = e.clientX; ly = e.clientY;
    });
    const endLook = e => { if (e.pointerId === lookId) lookId = null; };
    lookZone.addEventListener('pointerup', endLook);
    lookZone.addEventListener('pointercancel', endLook);

    // Botones de acción
    document.querySelectorAll('[data-key]').forEach(btn => {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        this.pressed.add(btn.dataset.key);
        btn.classList.add('down');
      });
      const up = () => btn.classList.remove('down');
      btn.addEventListener('pointerup', up); btn.addEventListener('pointerleave', up); btn.addEventListener('pointercancel', up);
    });
    $('btn-pause').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.unlock(); });

    // Evitar zoom, scroll y menú contextual
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('touchmove', e => { if (!e.target.closest('.scrollable')) e.preventDefault(); }, { passive: false });
  }

  lock() {
    if (this.isTouch) { this.locked = true; this.onLockChange?.(true); }
    else {
      try {
        const p = this.dom.requestPointerLock?.();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) { /* ignore pointer lock rejection */ }
    }
  }
  unlock() {
    if (this.isTouch) { this.locked = false; this.axisX = this.axisY = 0; this.onLockChange?.(false); }
    else {
      try {
        if (document.pointerLockElement) document.exitPointerLock?.();
      } catch (e) { /* ignore */ }
    }
  }
  down(code) { return this.keys.has(code); }
  wasPressed(code) { return this.pressed.has(code); }
  endFrame() { this.pressed.clear(); this.dx = 0; this.dy = 0; }
}
