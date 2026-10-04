/**
 * EnergyBar – Energiya balansi datchigi (Conservation of Energy Bar)
 * Kinetik (Ek), Potensial (Ep) va Issiqlik (Q) energiyalari
 * har bir vaqt momentida E_tot = const ekanligini vizual ko'rsatadi.
 */

export const ENERGY_MODELS = ["energy", "spring", "fall", "projectile", "pendulum", "collision"];

export function energyParts(key, state, p = {}) {
  if (!state || !ENERGY_MODELS.includes(key)) return null;
  let kinetic = 0;
  let potential = 0;
  let heat = 0;
  let initial = 0;
  if (key === "energy" || key === "pendulum") {
    kinetic = Number(state.kinetic || 0);
    potential = Number(state.potential || 0);
    heat = Number(state.heat || 0);
    initial = Number(state.initial || 0);
  } else if (key === "collision") {
    kinetic = Number(state.kinetic || 0);
    heat = Number(state.heat || 0);
    initial = Number(state.kineticBefore || 0);
  } else if (key === "spring") {
    const mass = Number(p.m);
    const stiffness = Number(p.k);
    const amplitude = Number(p.amplitude ?? 0.4);
    const damping = Number(p.damping ?? 0);
    const phase = Number(p.phase ?? 0);
    const omega = Math.sqrt(stiffness / mass - damping ** 2);
    const x0 = amplitude * Math.cos(phase);
    const v0 = -amplitude * (damping * Math.cos(phase) + omega * Math.sin(phase));
    initial = mass * v0 ** 2 / 2 + stiffness * x0 ** 2 / 2;
    kinetic = mass * Number(state.v || 0) ** 2 / 2;
    potential = stiffness * Number(state.x || 0) ** 2 / 2;
    heat = Math.max(0, initial - kinetic - potential);
  } else {
    const mass = Number(p.m);
    const gravity = Number(p.g ?? 9.8);
    const speed = Number(state.speed || 0);
    kinetic = mass * speed ** 2 / 2;
    potential = mass * gravity * Math.max(0, Number(state.y || 0));
    initial = mass * gravity * Number(p.h || 0) + mass * Number(p.v0 || 0) ** 2 / 2;
    heat = Math.max(0, initial - kinetic - potential);
  }
  if (![kinetic, potential, heat, initial].every(Number.isFinite)) return null;
  return { kinetic, potential, heat, initial, total: kinetic + potential + heat };
}

export function mountEnergyBar(container, config) {
  const supported = ENERGY_MODELS.includes(config.key);
  if (!supported || !container) return { update() {}, destroy() {} };

  const el = document.createElement("div");
  el.className = "energy-balance-widget";
  el.innerHTML = `
    <div class="energy-balance-header">
      <span class="eb-title"><i class="eb-bolt">⚡</i> Energiya balansi (E_tot = const)</span>
      <strong id="eb-total" class="eb-total-num">0.0 J</strong>
    </div>
    <div class="energy-balance-track">
      <div class="eb-bar eb-ke" id="eb-bar-ke" title="Kinetik energiya (Ek)" style="width: 0%"></div>
      <div class="eb-bar eb-pe" id="eb-bar-pe" title="Potensial energiya (Ep)" style="width: 0%"></div>
      <div class="eb-bar eb-heat" id="eb-bar-heat" title="Issiqlik energiyasi (Q)" style="width: 0%"></div>
    </div>
    <div class="energy-balance-legend">
      <span class="eb-tag eb-tag-ke"><i class="eb-dot eb-dot-ke"></i> Ek: <b id="eb-val-ke">0.0 J</b></span>
      <span class="eb-tag eb-tag-pe"><i class="eb-dot eb-dot-pe"></i> Ep: <b id="eb-val-pe">0.0 J</b></span>
      <span class="eb-tag eb-tag-heat"><i class="eb-dot eb-dot-heat"></i> Q: <b id="eb-val-heat">0.0 J</b></span>
    </div>
  `;

  container.prepend(el);

  const barKe = el.querySelector("#eb-bar-ke");
  const barPe = el.querySelector("#eb-bar-pe");
  const barHeat = el.querySelector("#eb-bar-heat");
  const valKe = el.querySelector("#eb-val-ke");
  const valPe = el.querySelector("#eb-val-pe");
  const valHeat = el.querySelector("#eb-val-heat");
  const totalEl = el.querySelector("#eb-total");

  return {
    update(state, p) {
      if (!state) return;
      const parts = energyParts(config.key, state, p);
      if (!parts) return;
      const { kinetic: ke, potential: pe, heat: q } = parts;

      const total = Math.max(1e-5, ke + pe + q);
      const pctKe = Math.max(0, Math.min(100, (ke / total) * 100));
      const pctPe = Math.max(0, Math.min(100, (pe / total) * 100));
      const pctHeat = Math.max(0, Math.min(100, (q / total) * 100));

      if (barKe) barKe.style.width = `${pctKe}%`;
      if (barPe) barPe.style.width = `${pctPe}%`;
      if (barHeat) barHeat.style.width = `${pctHeat}%`;

      if (valKe) valKe.textContent = `${ke.toFixed(1)} J`;
      if (valPe) valPe.textContent = `${pe.toFixed(1)} J`;
      if (valHeat) valHeat.textContent = `${q.toFixed(1)} J`;
      if (totalEl) totalEl.textContent = `${(ke + pe + q).toFixed(1)} J`;
    },
    destroy() {
      el.remove();
    }
  };
}
