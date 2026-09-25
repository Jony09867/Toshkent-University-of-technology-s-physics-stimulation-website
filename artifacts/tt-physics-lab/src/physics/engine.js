import { G, COULOMB, GAS, TAU } from "./constants.js";
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
let energyCache = null,
  buoyancyCache = null;
const positive = (x, name) => {
  if (!Number.isFinite(x) || x <= 0)
    throw new RangeError(name + " musbat bo‘lishi kerak.");
  return x;
};
export function motion(p, t = 0) {
  const stop = p.a < 0 ? -p.v0 / p.a : Infinity;
  const time = Math.min(Math.max(t, 0), stop);
  return {
    x: p.x0 + p.v0 * time + (p.a * time * time) / 2,
    v: p.v0 + p.a * time,
    a: time >= stop ? 0 : p.a,
    stop,
  };
}
export function projectile(p, t = 0) {
  const g = positive(p.g ?? G, "g"),
    angle = ((p.angle ?? 0) * Math.PI) / 180,
    vx = p.v0 * Math.cos(angle),
    vy = p.v0 * Math.sin(angle);
  const duration = (vy + Math.sqrt(vy * vy + 2 * g * p.h)) / g,
    time = clamp(t, 0, duration),
    landed = t >= duration;
  return {
    x: vx * time,
    y: Math.max(0, p.h + vy * time - (g * time * time) / 2),
    vx: landed ? 0 : vx,
    vy: landed ? 0 : vy - g * time,
    impactVx: vx,
    impactVy: vy - g * duration,
    landed,
    duration,
    range: vx * duration,
    height: p.h + (vy * vy) / (2 * g),
  };
}
export function newton(p, t = 0) {
  positive(p.m, "Massa");
  const angle = ((p.slope ?? 0) * Math.PI) / 180;
  const normal = p.m * G * Math.cos(angle),
    driving = p.force - p.m * G * Math.sin(angle),
    friction = (p.mu ?? 0) * normal;
  const net = Math.sign(driving) * Math.max(0, Math.abs(driving) - friction),
    a = net / p.m;
  return {
    a,
    net,
    normal,
    driving,
    friction: Math.min(Math.abs(driving), friction),
    v: a * t,
    x: (a * t * t) / 2,
  };
}
export function friction(p, t = 0) {
  positive(p.m, "Massa");
  const f = p.mu * p.normal,
    a = f / p.m,
    stop = a > 0 ? p.v0 / a : Infinity,
    time = Math.min(t, stop),
    stopped = Number.isFinite(stop) && t >= stop;
  return {
    f: stopped ? 0 : f,
    maxFriction: f,
    a: stopped ? 0 : -a,
    v: stopped ? 0 : Math.max(0, p.v0 - a * time),
    x: p.v0 * time - (a * time * time) / 2,
    stop,
    distance: a > 0 ? (p.v0 * p.v0) / (2 * a) : Infinity,
    stopped,
  };
}
export function energy(p, t = 0) {
  positive(p.m, "Massa");
  const radius = 12,
    beta = p.friction ? 0.36 : 0;
  // Exact constrained particle: y=q²/(2R); metric accounts for the actual track speed.
  const target = Math.max(0, t),
    cacheKey = `${p.h}|${Boolean(p.friction)}`,
    reusable = energyCache?.key === cacheKey && energyCache.t <= target;
  let q = reusable ? energyCache.q : Math.sqrt(2 * radius * p.h),
    u = reusable ? energyCache.u : 0,
    elapsed = reusable ? energyCache.t : 0;
  const delta = target - elapsed,
    steps = Math.ceil(delta / 0.02),
    dt = steps ? delta / steps : 0;
  const accel = (x, v) =>
    ((-G * x) / radius - (x * v * v) / (radius * radius)) /
      (1 + (x * x) / (radius * radius)) -
    beta * v;
  for (let i = 0; i < steps; i++) {
    const a1 = accel(q, u),
      u2 = u + (a1 * dt) / 2,
      a2 = accel(q + (u * dt) / 2, u2),
      u3 = u + (a2 * dt) / 2,
      a3 = accel(q + (u2 * dt) / 2, u3),
      u4 = u + a3 * dt,
      a4 = accel(q + u3 * dt, u4);
    q += (dt * (u + 2 * u2 + 2 * u3 + u4)) / 6;
    u += (dt * (a1 + 2 * a2 + 2 * a3 + a4)) / 6;
  }
  energyCache = { key: cacheKey, t: target, q, u };
  const v = u * Math.sqrt(1 + (q * q) / (radius * radius)),
    height = (q * q) / (2 * radius);
  const kinetic = (p.m * v * v) / 2,
    potential = p.m * G * height,
    total = kinetic + potential,
    initial = p.m * G * p.h;
  return {
    q,
    v,
    height,
    kinetic,
    potential,
    total,
    initial,
    heat: p.friction ? Math.max(0, initial - total) : 0,
    radius,
  };
}
export function spring(p, t = 0) {
  positive(p.m, "Massa");
  positive(p.k, "Qattiqlik");
  const omega = Math.sqrt(p.k / p.m),
    A = p.amplitude ?? 0.4,
    phase = p.phase ?? 0;
  return {
    period: TAU / omega,
    omega,
    x: A * Math.cos(omega * t + phase),
    v: -A * omega * Math.sin(omega * t + phase),
    energy: (p.k * A * A) / 2,
    equilibrium: (p.m * G) / p.k,
  };
}
export function resonance(p, t = 0) {
  positive(p.damping, "So‘nish");
  const w0 = p.natural,
    omega = p.frequency,
    beta = p.damping,
    force = p.drive ?? 0.25;
  const amplitude =
      force /
      Math.sqrt((w0 * w0 - omega * omega) ** 2 + (2 * beta * omega) ** 2),
    phase = Math.atan2(2 * beta * omega, w0 * w0 - omega * omega);
  return {
    amplitude,
    x: amplitude * Math.cos(omega * t - phase),
    phase,
    natural: w0,
    peak: Math.sqrt(Math.max(0, w0 * w0 - 2 * beta * beta)),
  };
}
export function buoyancy(p, t = 0) {
  positive(p.rho, "Jism zichligi");
  positive(p.fluid, "Suyuqlik zichligi");
  positive(p.volume, "Hajm");
  const volume = p.volume / 1000,
    side = Math.cbrt(volume),
    mass = p.rho * volume,
    weight = mass * G;
  // Center depth relative to waterline; released fully submerged. Linear fluid drag.
  const target = Math.min(Math.max(t, 0), 15),
    cacheKey = `${p.rho}|${p.fluid}|${p.volume}`,
    reusable = buoyancyCache?.key === cacheKey && buoyancyCache.t <= target;
  let depth = reusable ? buoyancyCache.depth : side * 1.2,
    v = reusable ? buoyancyCache.v : 0,
    elapsed = reusable ? buoyancyCache.t : 0;
  const delta = target - elapsed,
    steps = Math.ceil(delta / 0.005),
    dt = steps ? delta / steps : 0;
  const immersedFraction = (d) => clamp(d / side + 0.5, 0, 1);
  const acceleration = (d, speed) => {
    const fraction = immersedFraction(d);
    return (
      (weight - p.fluid * G * volume * fraction - mass * 4 * speed * fraction) /
      mass
    );
  };
  for (let i = 0; i < steps; i++) {
    // RK4 handles partial immersion continuously.
    const a1 = acceleration(depth, v),
      v2 = v + (a1 * dt) / 2,
      a2 = acceleration(depth + (v * dt) / 2, v2),
      v3 = v + (a2 * dt) / 2,
      a3 = acceleration(depth + (v2 * dt) / 2, v3),
      v4 = v + a3 * dt,
      a4 = acceleration(depth + v3 * dt, v4);
    depth += (dt * (v + 2 * v2 + 2 * v3 + v4)) / 6;
    v += (dt * (a1 + 2 * a2 + 2 * a3 + a4)) / 6;
    if (depth > side * 3) {
      depth = side * 3;
      v = 0;
    }
  }
  buoyancyCache = { key: cacheKey, t: target, depth, v };
  const immersed = volume * immersedFraction(depth),
    force = p.fluid * G * immersed,
    onBottom = depth >= side * 3 - 1e-9,
    normal = onBottom ? Math.max(0, weight - force) : 0;
  return {
    force,
    maxForce: p.fluid * G * volume,
    weight,
    depth,
    side,
    immersed,
    mass,
    v,
    normal,
    onBottom,
    status: p.rho < p.fluid ? "float" : p.rho === p.fluid ? "neutral" : "sink",
  };
}
export function gas(p) {
  positive(p.volume, "Hajm");
  positive(p.temperature, "Harorat");
  positive(p.moles, "Modda miqdori");
  return {
    pressure: (p.moles * GAS * p.temperature) / (p.volume / 1000),
    rms: Math.sqrt((3 * GAS * p.temperature) / (p.molarMass ?? 0.028)),
    energy: 1.5 * p.moles * GAS * p.temperature,
  };
}
export function coulomb(p) {
  positive(p.r, "Masofa");
  const signed = (COULOMB * p.q1 * 1e-6 * p.q2 * 1e-6) / (p.r * p.r);
  return {
    force: Math.abs(signed),
    signed,
    field: (COULOMB * p.q1 * 1e-6) / (p.r * p.r),
    potential: (COULOMB * p.q1 * 1e-6 * p.q2 * 1e-6) / p.r,
  };
}
export function ohm(p) {
  positive(p.resistance, "Qarshilik");
  const current = p.voltage / p.resistance;
  return { current, power: p.voltage * current, voltage: p.voltage };
}
export function circuit(p) {
  positive(p.resistance, "Tashqi qarshilik");
  if (p.internal < 0) throw new RangeError("Ichki qarshilik manfiy bo‘lmaydi.");
  const current = p.emf / (p.resistance + p.internal);
  return {
    current,
    voltage: current * p.resistance,
    power: current * current * p.resistance,
    loss: current * current * p.internal,
    efficiency: (p.resistance / (p.resistance + p.internal)) * 100,
  };
}
export function induction(p, t = 0) {
  positive(p.resistance, "Qarshilik");
  const w = p.speed,
    x = 1.5 * Math.cos(w * t),
    velocity = -1.5 * w * Math.sin(w * t),
    length = 0.65;
  const flux = p.field * 0.02 * Math.exp((-x * x) / (2 * length * length)),
    emf = (p.turns * flux * x * velocity) / (length * length);
  return { x, velocity, flux, emf, current: emf / p.resistance };
}
export function lens(p) {
  positive(p.object, "Predmet masofasi");
  if (p.focal === 0) throw new RangeError("Fokus masofasi nol bo‘lmaydi.");
  const denominator = p.object - p.focal,
    atFocus = Math.abs(denominator) < 1e-9,
    image = atFocus ? Infinity : (p.focal * p.object) / denominator,
    magnification = -image / p.object;
  return {
    image,
    magnification,
    height: magnification * p.height,
    power: 1 / p.focal,
    atFocus,
    real: image > 0,
  };
}
