import { format, formatResult } from "./ResultCard.js";
import { resultNames } from "../i18n/uz.js";

/**
 * Virtual Laboratory Instruments:
 * 1. Movable Calibrated Ruler (cm / m) with rotation and live measurement.
 * 2. Movable Digital Stopwatch (Start, Pause, Reset, Lap).
 * 3. Movable Sensor / Probe Tool (Crosshair readout of coordinates, speed, force, etc.).
 */

export class VirtualInstruments {
  constructor(container, canvasElement, getSimulationState) {
    this.container = container;
    this.canvas = canvasElement;
    this.getState = getSimulationState;

    this.rulerActive = false;
    this.stopwatchActive = false;
    this.probeActive = false;

    // Ruler state (in canvas logical pixels 800x460)
    this.ruler = {
      x: 120,
      y: 320,
      width: 280,
      height: 48,
      rotation: 0, // 0 or 90
      scaleFactor: 100, // px per meter (default 100px = 1m)
    };

    // Stopwatch state
    this.stopwatch = {
      x: 20,
      y: 20,
      running: false,
      elapsedMs: 0,
      lastTick: 0,
      laps: [],
      timerId: null,
    };

    // Probe state
    this.probe = {
      x: 400,
      y: 230,
    };

    this.wrapper = null;
    this.mount();
  }

  mount() {
    if (!this.container) return;
    this.wrapper = document.createElement("div");
    this.wrapper.className = "virtual-instruments-overlay";
    this.wrapper.innerHTML = `
      <!-- Toolbar for instruments -->
      <div class="instruments-toolbar" role="toolbar" aria-label="Virtual asboblar">
        <button type="button" class="inst-btn" id="toggle-ruler" title="Virtual Chizg‘ich">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/><path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/><path d="m4.5 13.5 2 2"/></svg>
          <span>Chizg‘ich</span>
        </button>
        <button type="button" class="inst-btn" id="toggle-stopwatch" title="Virtual Sekundomer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="14" r="8"/><path d="M12 2v4"/><path d="M12 10v4l2 2"/><path d="M10 2h4"/></svg>
          <span>Sekundomer</span>
        </button>
        <button type="button" class="inst-btn" id="toggle-probe" title="Fizik Datchik / Prob">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M22 12h-4"/><path d="M6 12H2"/><path d="M12 6V2"/><path d="M12 22v-4"/><circle cx="12" cy="12" r="2"/></svg>
          <span>Datchik</span>
        </button>
      </div>

      <!-- Virtual Ruler Element -->
      <div class="virtual-instrument virtual-ruler" id="inst-ruler" style="display: none;">
        <div class="ruler-header">
          <span class="ruler-title">📏 Virtual Chizg‘ich (1:100 sm)</span>
          <div class="ruler-tools">
            <button type="button" class="inst-mini-btn" id="ruler-rotate" title="Aylantirish">↻ 90°</button>
            <button type="button" class="inst-mini-btn" id="ruler-close" title="Yopish">✕</button>
          </div>
        </div>
        <div class="ruler-body">
          <div class="ruler-ticks"></div>
          <div class="ruler-measure" id="ruler-measure-text">Uzunlik: 2.80 m (280 sm)</div>
        </div>
      </div>

      <!-- Virtual Stopwatch Element -->
      <div class="virtual-instrument virtual-stopwatch" id="inst-stopwatch" style="display: none;">
        <div class="stopwatch-header">
          <span class="stopwatch-title">⏱️ Sekundomer</span>
          <button type="button" class="inst-mini-btn" id="stopwatch-close" title="Yopish">✕</button>
        </div>
        <div class="stopwatch-display" id="stopwatch-time">00:00.00</div>
        <div class="stopwatch-controls">
          <button type="button" class="sw-btn" id="sw-start-pause">Boshlash</button>
          <button type="button" class="sw-btn" id="sw-lap">Kadr (Lap)</button>
          <button type="button" class="sw-btn" id="sw-reset">Nolga</button>
        </div>
        <div class="stopwatch-laps" id="sw-laps"></div>
      </div>

      <!-- Virtual Probe Element -->
      <div class="virtual-instrument virtual-probe" id="inst-probe" style="display: none;">
        <div class="probe-header">
          <span class="probe-title">⚡ Jism holati datchigi</span>
          <button type="button" class="inst-mini-btn" id="probe-close" title="Yopish">✕</button>
        </div>
        <div class="probe-hud" id="probe-hud-content">
          <div><small>Jism X:</small> <strong id="probe-val-x">—</strong></div>
          <div><small>Jism Y:</small> <strong id="probe-val-y">—</strong></div>
          <div><small>Qiymat:</small> <strong id="probe-val-dynamic">0.00</strong></div>
        </div>
        <div class="probe-target-pin" id="probe-pin">
          <div class="probe-crosshair"></div>
        </div>
      </div>
    `;

    this.container.append(this.wrapper);
    this.buildRulerTicks();
    this.bindEvents();
  }

  buildRulerTicks() {
    const ticksContainer = this.wrapper.querySelector(".ruler-ticks");
    if (!ticksContainer) return;
    ticksContainer.innerHTML = "";
    // Draw 28 major divisions (centimeters / meters)
    for (let i = 0; i <= 28; i++) {
      const isMajor = i % 5 === 0;
      const tick = document.createElement("div");
      tick.className = `ruler-tick ${isMajor ? "major" : ""}`;
      tick.style.left = `${(i / 28) * 100}%`;
      if (isMajor) {
        const label = document.createElement("span");
        label.className = "ruler-tick-label";
        label.textContent = `${i * 10}`;
        tick.append(label);
      }
      ticksContainer.append(tick);
    }
  }

  bindEvents() {
    // Toolbar toggle buttons
    const btnRuler = this.wrapper.querySelector("#toggle-ruler");
    const btnStopwatch = this.wrapper.querySelector("#toggle-stopwatch");
    const btnProbe = this.wrapper.querySelector("#toggle-probe");

    const elRuler = this.wrapper.querySelector("#inst-ruler");
    const elStopwatch = this.wrapper.querySelector("#inst-stopwatch");
    const elProbe = this.wrapper.querySelector("#inst-probe");

    btnRuler?.addEventListener("click", () => {
      this.rulerActive = !this.rulerActive;
      elRuler.style.display = this.rulerActive ? "block" : "none";
      btnRuler.classList.toggle("active", this.rulerActive);
      if (this.rulerActive) this.positionElement(elRuler, this.ruler.x, this.ruler.y);
    });

    btnStopwatch?.addEventListener("click", () => {
      this.stopwatchActive = !this.stopwatchActive;
      elStopwatch.style.display = this.stopwatchActive ? "block" : "none";
      btnStopwatch.classList.toggle("active", this.stopwatchActive);
      if (this.stopwatchActive) this.positionElement(elStopwatch, this.stopwatch.x, this.stopwatch.y);
    });

    btnProbe?.addEventListener("click", () => {
      this.probeActive = !this.probeActive;
      elProbe.style.display = this.probeActive ? "block" : "none";
      btnProbe.classList.toggle("active", this.probeActive);
      if (this.probeActive) {
        this.positionElement(elProbe, this.probe.x, this.probe.y);
        this.updateProbeValues();
      }
    });

    // Close buttons
    this.wrapper.querySelector("#ruler-close")?.addEventListener("click", () => {
      this.rulerActive = false;
      elRuler.style.display = "none";
      btnRuler?.classList.remove("active");
    });

    this.wrapper.querySelector("#stopwatch-close")?.addEventListener("click", () => {
      this.stopwatchActive = false;
      elStopwatch.style.display = "none";
      btnStopwatch?.classList.remove("active");
    });

    this.wrapper.querySelector("#probe-close")?.addEventListener("click", () => {
      this.probeActive = false;
      elProbe.style.display = "none";
      btnProbe?.classList.remove("active");
    });

    // Ruler rotation
    this.wrapper.querySelector("#ruler-rotate")?.addEventListener("click", () => {
      this.ruler.rotation = (this.ruler.rotation + 90) % 180;
      elRuler.style.transform = `rotate(${this.ruler.rotation}deg)`;
      const measure = this.wrapper.querySelector("#ruler-measure-text");
      if (measure) {
        measure.textContent = this.ruler.rotation === 90 ? "Balandlik: 2.80 m" : "Uzunlik: 2.80 m (280 sm)";
      }
    });

    // Stopwatch logic
    this.bindStopwatch();

    // Draggable logic for all instruments
    this.makeDraggable(elRuler, (x, y) => {
      this.ruler.x = x;
      this.ruler.y = y;
    });

    this.makeDraggable(elStopwatch, (x, y) => {
      this.stopwatch.x = x;
      this.stopwatch.y = y;
    });

    this.makeDraggable(elProbe, (x, y) => {
      this.probe.x = x;
      this.probe.y = y;
      this.updateProbeValues();
    });
  }

  positionElement(el, x, y) {
    if (!el || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const relX = Math.max(10, Math.min(rect.width - 150, (x / 800) * rect.width));
    const relY = Math.max(10, Math.min(rect.height - 100, (y / 460) * rect.height));
    el.style.left = `${relX}px`;
    el.style.top = `${relY}px`;
  }

  makeDraggable(element, onMove) {
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;
    let dragging = false;

    const onPointerDown = (e) => {
      // Don't drag if clicking buttons inside
      if (e.target.closest("button") || e.target.closest("input")) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = parseFloat(element.style.left || 0);
      initialTop = parseFloat(element.style.top || 0);
      element.classList.add("is-dragging");
      try {
        element.setPointerCapture(e.pointerId);
      } catch {}
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const rect = this.container.getBoundingClientRect();
      const nextLeft = Math.max(0, Math.min(rect.width - element.offsetWidth, initialLeft + dx));
      const nextTop = Math.max(0, Math.min(rect.height - element.offsetHeight, initialTop + dy));
      element.style.left = `${nextLeft}px`;
      element.style.top = `${nextTop}px`;

      // Convert back to logical 800x460 coordinates
      const logicalX = (nextLeft / Math.max(1, rect.width)) * 800;
      const logicalY = (nextTop / Math.max(1, rect.height)) * 460;
      if (onMove) onMove(logicalX, logicalY);
    };

    const onPointerUp = (e) => {
      if (!dragging) return;
      dragging = false;
      element.classList.remove("is-dragging");
      try {
        element.releasePointerCapture(e.pointerId);
      } catch {}
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
  }

  bindStopwatch() {
    const btnStart = this.wrapper.querySelector("#sw-start-pause");
    const btnLap = this.wrapper.querySelector("#sw-lap");
    const btnReset = this.wrapper.querySelector("#sw-reset");
    const display = this.wrapper.querySelector("#stopwatch-time");
    const lapsContainer = this.wrapper.querySelector("#sw-laps");

    const formatTime = (ms) => {
      const totalSec = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;
      const hundredths = Math.floor((ms % 1000) / 10);
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
    };

    const updateDisplay = () => {
      if (display) display.textContent = formatTime(this.stopwatch.elapsedMs);
    };

    btnStart?.addEventListener("click", () => {
      if (!this.stopwatch.running) {
        this.stopwatch.running = true;
        this.stopwatch.lastTick = this.getState()?.t ?? 0;
        btnStart.textContent = "To‘xtatish";
        btnStart.classList.add("active");
        this.stopwatch.timerId = setInterval(() => {
          const now = this.getState()?.t ?? this.stopwatch.lastTick;
          this.stopwatch.elapsedMs += Math.max(0, now - this.stopwatch.lastTick) * 1000;
          this.stopwatch.lastTick = now;
          updateDisplay();
        }, 30);
      } else {
        this.stopwatch.running = false;
        clearInterval(this.stopwatch.timerId);
        btnStart.textContent = "Boshlash";
        btnStart.classList.remove("active");
      }
    });

    btnReset?.addEventListener("click", () => {
      this.stopwatch.running = false;
      clearInterval(this.stopwatch.timerId);
      this.stopwatch.elapsedMs = 0;
      this.stopwatch.laps = [];
      btnStart.textContent = "Boshlash";
      btnStart.classList.remove("active");
      updateDisplay();
      if (lapsContainer) lapsContainer.innerHTML = "";
    });

    btnLap?.addEventListener("click", () => {
      if (this.stopwatch.elapsedMs === 0) return;
      const lapTime = formatTime(this.stopwatch.elapsedMs);
      this.stopwatch.laps.push(lapTime);
      if (lapsContainer) {
        const item = document.createElement("div");
        item.className = "sw-lap-item";
        item.textContent = `#${this.stopwatch.laps.length} — ${lapTime}`;
        lapsContainer.prepend(item);
      }
    });
  }

  updateProbeValues() {
    if (!this.probeActive || !this.getState) return;
    const sim = this.getState();
    if (!sim) return;

    const valX = this.wrapper.querySelector("#probe-val-x");
    const valY = this.wrapper.querySelector("#probe-val-y");
    const valDyn = this.wrapper.querySelector("#probe-val-dynamic");

    // Datchik oynasi siljishi jismning fizik koordinatasini o‘zgartirmaydi.
    if (valX) valX.textContent = Number.isFinite(sim.s?.x) ? `${format(sim.s.x)} m` : "—";
    if (valY) valY.textContent = Number.isFinite(sim.s?.y) ? `${format(sim.s.y)} m` : "—";

    if (valDyn && sim.s) {
      if (sim.s.v !== undefined) {
        valDyn.textContent = `v = ${format(sim.s.v)} m/s`;
      } else if (sim.s.force !== undefined) {
        valDyn.textContent = `F = ${format(sim.s.force)} N`;
      } else if (sim.s.current !== undefined) {
        valDyn.textContent = `I = ${format(sim.s.current)} A`;
      } else if (sim.s.pressure !== undefined) {
        valDyn.textContent = `P = ${format(sim.s.pressure * 0.001)} kPa`;
      } else if (sim.s.theta !== undefined) {
        valDyn.textContent = `θ = ${format(sim.s.theta)}°`;
      } else {
        const first = sim.config?.results?.[0];
        if (first && sim.s[first.key] !== undefined) {
          valDyn.textContent = `${resultNames[first.key] || first.key} = ${formatResult(first, sim.s[first.key])} ${first.unit || ""}`;
        }
      }
    }
  }

  update(state) {
    if (this.probeActive) {
      this.updateProbeValues();
    }
  }

  destroy() {
    if (this.stopwatch.timerId) clearInterval(this.stopwatch.timerId);
    this.wrapper?.remove();
  }
}
