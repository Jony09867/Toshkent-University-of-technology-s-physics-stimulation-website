import { models } from "./catalog-engine.js";

const ALPHA_MASS = 6.6446573357e-27; // kg
const ELECTRON_VOLT = 1.602176634e-19; // J
const FEMTOMETRE = 1e-15; // m
const cache = new Map();

// Kulon maydonidagi itaruvchi giperbola yadro markaziga nisbatan olinadi.
export function rutherfordTrajectory(p) {
  const key = `${p.energy}:${p.impact}:${p.z}`;
  if (cache.has(key)) return cache.get(key);
  const scattering = models.rutherford(p);
  const a = scattering.headOn * 1e15 / 2;
  const b = p.impact;
  const limit = Math.max(8 * a, 4 * b, 120);
  const points = [];
  const count = 480;
  if (b === 0) {
    // Peshma-pesh kelganda zarracha r=2a nuqtada to‘xtab, orqaga qaytadi.
    for (let i = 0; i <= count; i++) {
      const fraction = i <= count / 2 ? i / (count / 2) : (count - i) / (count / 2);
      points.push({ x: -(limit - (limit - 2 * a) * fraction), y: 0 });
    }
  } else {
    const eccentricity = Math.hypot(1, b / a);
    const semiLatus = b * b / a;
    const centre = (Math.PI + scattering.angle * Math.PI / 180) / 2;
    const extent = Math.acos(Math.min(1, (1 + semiLatus / limit) / eccentricity));
    for (let i = 0; i <= count; i++) {
      const offset = extent * (1 - 2 * i / count);
      const radius = semiLatus / (eccentricity * Math.cos(offset) - 1);
      const azimuth = centre + offset;
      points.push({ x: radius * Math.cos(azimuth), y: radius * Math.sin(azimuth) });
    }
  }
  const speedFar = Math.sqrt(2 * p.energy * 1e6 * ELECTRON_VOLT / ALPHA_MASS);
  let elapsed = 0;
  points[0].t = 0;
  for (let i = 1; i < points.length; i++) {
    const before = points[i - 1], after = points[i];
    const dx = after.x - before.x, dy = after.y - before.y;
    const radiusMid = Math.hypot((before.x + after.x) / 2, (before.y + after.y) / 2);
    const speed = speedFar * Math.sqrt(Math.max(1 - 2 * a / radiusMid, 1e-9));
    elapsed += Math.hypot(dx, dy) * FEMTOMETRE / speed;
    after.t = elapsed;
  }
  const result = { points, duration: elapsed, limit, ...scattering };
  cache.set(key, result);
  if (cache.size > 8) cache.delete(cache.keys().next().value);
  return result;
}

export function calculateRutherfordBohr(p, t = 0) {
  if (![p.energy, p.impact, p.z, p.upper].every(Number.isFinite) ||
      p.energy <= 0 || p.impact < 0 || p.z <= 0 ||
      !Number.isInteger(p.upper) || p.upper < 3 || p.upper > 6) {
    return {
      angle: null, closest: null, headOn: null, wavelength: null,
      photon: null, distance: null, duration: null, path: [],
      warning: "Energiya, yadro zaryadi va yuqori sath musbat; n=3–6 bo‘lishi kerak.",
    };
  }
  const trajectory = rutherfordTrajectory(p);
  const time = Math.min(Math.max(Number.isFinite(t) ? t : 0, 0), trajectory.duration);
  const points = trajectory.points;
  let left = 0, right = points.length - 1;
  while (left < right) {
    const mid = (left + right + 1) >> 1;
    if (points[mid].t <= time) left = mid;
    else right = mid - 1;
  }
  const next = points[Math.min(left + 1, points.length - 1)];
  const previous = points[left];
  const fraction = next.t > previous.t ? (time - previous.t) / (next.t - previous.t) : 0;
  const x = previous.x + (next.x - previous.x) * fraction;
  const y = previous.y + (next.y - previous.y) * fraction;
  const bohr = models.bohr({ n: p.upper, lower: 2, z: 1 });
  return {
    angle: trajectory.angle,
    closest: trajectory.closest,
    headOn: trajectory.headOn,
    wavelength: bohr.wavelength,
    photon: bohr.transition,
    distance: Math.hypot(x, y),
    x, y, pathIndex: left, path: points,
    duration: trajectory.duration,
    limit: trajectory.limit,
    warning: "",
  };
}
