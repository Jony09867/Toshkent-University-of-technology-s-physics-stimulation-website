import { format } from "./ResultCard.js";

/**
 * EnergyConservationBar Component
 * Renders a dynamic, real-time energy conservation bar (Ek + Ep + Q = E_total = const)
 * for simulations involving mechanical, electrical, or thermal energy conservation.
 */

export class EnergyConservationBar {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.supportedSimulations = new Set([
      "energy",
      "pendulum",
      "spring",
      "fall",
      "projectile",
      "collision",
      "circuitOsc",
      "thermo",
    ]);
    this.mount();
  }

  mount() {
    if (!this.container) return;
    this.element = document.createElement("div");
    this.element.className = "energy-conservation-card";
    this.element.innerHTML = `
      <div class="energy-bar-header">
        <div class="energy-title-group">
          <span class="energy-icon">⚡</span>
          <div>
            <strong class="energy-title">Energiya balansi datchigi</strong>
            <small class="energy-subtitle">Termodinamika I qonuni / Energiya saqlanishi</small>
          </div>
        </div>
        <div class="energy-status-badge">
          <span class="status-dot"></span>
          <span id="energy-badge-text">Saqlanish qonuni: E = const ✓</span>
        </div>
      </div>

      <!-- Segmented animated progress bar -->
      <div class="energy-track">
        <div class="energy-seg seg-kinetic" id="seg-k" style="width: 50%;"></div>
        <div class="energy-seg seg-potential" id="seg-p" style="width: 50%;"></div>
        <div class="energy-seg seg-thermal" id="seg-q" style="width: 0%;"></div>
      </div>

      <!-- Live metrics readout -->
      <div class="energy-metrics" id="energy-metrics">
        <div class="metric-item item-k">
          <span class="metric-dot dot-k"></span>
          <span class="metric-label" id="label-k">Kinetik (Ek):</span>
          <strong class="metric-val" id="val-k">0.0 J</strong>
          <small class="metric-pct" id="pct-k">(0%)</small>
        </div>
        <div class="metric-item item-p">
          <span class="metric-dot dot-p"></span>
          <span class="metric-label" id="label-p">Potensial (Ep):</span>
          <strong class="metric-val" id="val-p">0.0 J</strong>
          <small class="metric-pct" id="pct-p">(0%)</small>
        </div>
        <div class="metric-item item-q" id="item-q">
          <span class="metric-dot dot-q"></span>
          <span class="metric-label" id="label-q">Issiqlik / Yo‘qotish (Q):</span>
          <strong class="metric-val" id="val-q">0.0 J</strong>
          <small class="metric-pct" id="pct-q">(0%)</small>
        </div>
        <div class="metric-item item-total">
          <span class="metric-label">Jami energiya:</span>
          <strong class="metric-val" id="val-total">0.0 J</strong>
        </div>
      </div>
    `;
    this.container.append(this.element);
    this.refs = {
      segK: this.element.querySelector("#seg-k"),
      segP: this.element.querySelector("#seg-p"),
      segQ: this.element.querySelector("#seg-q"),
      lblK: this.element.querySelector("#label-k"),
      lblP: this.element.querySelector("#label-p"),
      lblQ: this.element.querySelector("#label-q"),
      valK: this.element.querySelector("#val-k"),
      valP: this.element.querySelector("#val-p"),
      valQ: this.element.querySelector("#val-q"),
      valTotal: this.element.querySelector("#val-total"),
      pK: this.element.querySelector("#pct-k"),
      pP: this.element.querySelector("#pct-p"),
      pQ: this.element.querySelector("#pct-q"),
      itemQ: this.element.querySelector("#item-q"),
    };
  }

  isSupported(key) {
    return this.supportedSimulations.has(key);
  }

  computeEnergy(configKey, p, s, t) {
    let Ek = 0, Ep = 0, Q = 0, unit = "J";
    let labelK = "Kinetik (Ek)", labelP = "Potensial (Ep)", labelQ = "Issiqlik (Q)";

    if (configKey === "energy") {
      Ek = s.kinetic ?? 0;
      Ep = s.potential ?? 0;
      Q = s.heat ?? 0;
    } else if (configKey === "pendulum") {
      const g = p.g ?? 9.8;
      const m = p.mass ?? 1;
      const L = p.length ?? 1.2;
      const thetaRad = ((s.theta ?? 0) * Math.PI) / 180;
      const h = L * (1 - Math.cos(thetaRad));
      Ep = m * g * h;
      const v = s.v ?? 0;
      Ek = 0.5 * m * v * v;
      const thetaMaxRad = ((p.angle ?? 20) * Math.PI) / 180;
      const initialTotal = m * g * L * (1 - Math.cos(thetaMaxRad));
      Q = Math.max(0, initialTotal - (Ek + Ep));
    } else if (configKey === "spring") {
      const k = p.k ?? 20;
      const m = p.m ?? 1;
      const x = s.x ?? 0;
      Ep = 0.5 * k * x * x;
      const v = s.v ?? 0;
      Ek = 0.5 * m * v * v;
      const A = p.amplitude ?? 0.4, phase = p.phase ?? 0, gamma = p.damping ?? 0;
      const omega = Math.sqrt(k / m - gamma * gamma);
      const initialV = -A * (gamma * Math.cos(phase) + omega * Math.sin(phase));
      const initialTotal = 0.5 * k * (A * Math.cos(phase)) ** 2 + 0.5 * m * initialV ** 2;
      Q = Math.max(0, initialTotal - (Ek + Ep));
      labelQ = "So‘nish yo‘qotishi (Q)";
    } else if (configKey === "fall" || configKey === "projectile") {
      const g = p.g ?? 9.8;
      const m = p.m ?? 1;
      const y = Math.max(0, s.y ?? 0);
      Ep = m * g * y;
      const speed = s.speed ?? Math.hypot(s.vx ?? 0, s.vy ?? 0);
      Ek = 0.5 * m * speed * speed;
      const h0 = p.h ?? 0;
      const v0 = p.v0 ?? 0;
      const initialTotal = m * g * h0 + 0.5 * m * v0 * v0;
      Q = Math.max(0, initialTotal - (Ek + Ep));
      labelQ = "Havo qarshiligi ishi (Q)";
    } else if (configKey === "collision") {
      const m1 = p.m1 ?? 2, m2 = p.m2 ?? 3;
      const v1 = s.currentV1 ?? p.v1 ?? 3;
      const v2 = s.currentV2 ?? p.v2 ?? -2;
      Ek = 0.5 * m1 * v1 * v1;
      Ep = 0.5 * m2 * v2 * v2;
      labelK = "1-aravacha (Ek₁)";
      labelP = "2-aravacha (Ek₂)";
      labelQ = "Deformatsiya / Issiqlik (Q)";
      const initialTotal = 0.5 * m1 * (p.v1 ?? 0) ** 2 + 0.5 * m2 * (p.v2 ?? 0) ** 2;
      Q = Math.max(0, initialTotal - (Ek + Ep));
    } else if (configKey === "circuitOsc") {
      unit = "mJ";
      Ek = s.energyCap ?? 0;
      Ep = s.energyInd ?? 0;
      labelK = "Kondensator maydoni (We)";
      labelP = "G‘altak maydoni (Wm)";
      labelQ = "Omik yo‘qotish (Q)";
      const C = (p.capacitance ?? 50) * 1e-6;
      const V0 = p.voltage0 ?? 12;
      const initialTotal = 0.5 * C * V0 * V0 * 1000;
      Q = Math.max(0, initialTotal - (Ek + Ep));
    } else if (configKey === "thermo") {
      labelK = "Foydali ish (A)";
      labelP = "Sovutgichga (Q₂)";
      labelQ = "Isitkichdan (Q₁)";
      Ek = s.work ?? 0;
      Ep = s.q2 ?? 0;
      Q = 0;
    }

    const total = Ek + Ep + Q;
    return { Ek, Ep, Q, total, unit, labelK, labelP, labelQ };
  }

  update(config, p, s, t) {
    if (!this.element) return;
    if (!this.isSupported(config.key)) {
      if (this.element.style.display !== "none") this.element.style.display = "none";
      return;
    }
    if (this.element.style.display !== "block") this.element.style.display = "block";

    const energy = this.computeEnergy(config.key, p, s, t);
    const pctK = Math.max(0, Math.min(100, (energy.Ek / (energy.total || 1)) * 100));
    const pctP = Math.max(0, Math.min(100, (energy.Ep / (energy.total || 1)) * 100));
    const pctQ = Math.max(0, Math.min(100, (energy.Q / (energy.total || 1)) * 100));

    const r = this.refs;
    if (!r) return;

    if (r.segK) r.segK.style.width = `${pctK}%`;
    if (r.segP) r.segP.style.width = `${pctP}%`;
    if (r.segQ) r.segQ.style.width = `${pctQ}%`;

    if (r.lblK) r.lblK.textContent = energy.labelK + ":";
    if (r.lblP) r.lblP.textContent = energy.labelP + ":";
    if (r.lblQ) r.lblQ.textContent = energy.labelQ + ":";

    if (r.valK) r.valK.textContent = `${format(energy.Ek)} ${energy.unit}`;
    if (r.valP) r.valP.textContent = `${format(energy.Ep)} ${energy.unit}`;
    if (r.valQ) r.valQ.textContent = `${format(energy.Q)} ${energy.unit}`;
    if (r.valTotal) r.valTotal.textContent = `${format(energy.total)} ${energy.unit}`;

    if (r.pK) r.pK.textContent = `(${pctK.toFixed(1)}%)`;
    if (r.pP) r.pP.textContent = `(${pctP.toFixed(1)}%)`;
    if (r.pQ) r.pQ.textContent = `(${pctQ.toFixed(1)}%)`;

    if (r.itemQ) {
      r.itemQ.style.display = energy.Q > 0.001 || config.key === "energy" ? "flex" : "none";
    }
  }

  destroy() {
    this.element?.remove();
  }
}
