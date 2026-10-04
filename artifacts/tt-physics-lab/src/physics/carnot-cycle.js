// Ko‘rgazmali ideal Karno sikli: ishchi modda bir atomli ideal gaz (γ = 5/3).
// V₁=1 L va izotermik kengayish V₂/V₁=2 tanlangan; n issiqlik kirishidan topiladi.
const R = 8.314462618;
const GAMMA = 5 / 3;
const STEPS = 40;

export function carnotCycle({ hot, cold, heatIn }) {
  if (![hot, cold, heatIn].every(Number.isFinite) || hot <= cold || cold <= 0 || heatIn <= 0) return null;
  const v1 = 1;
  const v2 = 2;
  const ratio = (hot / cold) ** (1 / (GAMMA - 1));
  const v3 = v2 * ratio;
  const v4 = v1 * ratio;
  const moles = heatIn / (R * hot * Math.log(v2 / v1));
  const pressure = (temperature, litres) => moles * R * temperature / litres;
  const sample = (from, to, fn) => Array.from({ length: STEPS + 1 }, (_, index) => {
    const volume = from + (to - from) * index / STEPS;
    return { x: volume, y: fn(volume) };
  });
  const stages = [
    { label: "Issiq izoterma · Q kiradi", data: sample(v1, v2, (v) => pressure(hot, v)) },
    { label: "Adiabatik kengayish", data: sample(v2, v3, (v) => pressure(hot, v2) * (v2 / v) ** GAMMA) },
    { label: "Sovuq izoterma · Q chiqadi", data: sample(v3, v4, (v) => pressure(cold, v)) },
    { label: "Adiabatik siqilish", data: sample(v4, v1, (v) => pressure(cold, v4) * (v4 / v) ** GAMMA) },
  ];
  return { stages, moles, work: heatIn * (1 - cold / hot), heatOut: heatIn * cold / hot, gamma: GAMMA };
}
