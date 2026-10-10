import { ELEMENTARY, LIGHT, PLANCK } from "./constants.js";

const EV_TO_J = ELEMENTARY;
const HC_EV_NM = (PLANCK * LIGHT / EV_TO_J) * 1e9;

export function calculateBohrSpectrum(p) {
  const upper = Math.round(p.upper);
  const lower = Math.round(p.lower);
  const z = Math.round(p.z);
  if (!Number.isInteger(p.upper) || !Number.isInteger(p.lower) || !Number.isInteger(p.z) || ![0, 1].includes(p.absorption) || upper <= lower || lower < 1 || upper > 8 || z < 1 || z > 4) {
    return {
      upperEnergy: null, lowerEnergy: null, transition: null,
      wavelength: null, photonEnergy: null,
      warning: "n va m butun sathlar bo‘lsin (1 ≤ m < n ≤ 8), Z esa 1–4 oralig‘idagi butun son bo‘lishi kerak.",
    };
  }
  const upperEnergy = -13.605693 * z ** 2 / upper ** 2;
  const lowerEnergy = -13.605693 * z ** 2 / lower ** 2;
  const transition = upperEnergy - lowerEnergy;
  const photonEnergy = Math.abs(transition);
  return {
    upperEnergy,
    lowerEnergy,
    transition: photonEnergy,
    photonEnergy,
    wavelength: photonEnergy > 0 ? HC_EV_NM / photonEnergy * 1e-9 : null,
    initialLevel: p.absorption === 1 ? lower : upper,
    finalLevel: p.absorption === 1 ? upper : lower,
    emitted: p.absorption === 0,
    warning: "",
  };
}
