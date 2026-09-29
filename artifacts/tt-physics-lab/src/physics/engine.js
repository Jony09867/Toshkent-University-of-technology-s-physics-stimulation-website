import { G, COULOMB, GAS, TAU } from "./constants.js";
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
let energyCache = null,
  buoyancyCache = null;
const positive = (x, name) => {
  if (!Number.isFinite(x) || x <= 0)
    throw new RangeError(name + " musbat bo‘lishi kerak.");
  return x;
};
// Elapsed time never runs backwards. Invalid values return to the start, while
// positive infinity may advance safely to a known terminal time.
const simulationTime = (t, upper = Infinity) => {
  if (!Number.isFinite(t))
    return t === Infinity && Number.isFinite(upper)
      ? Math.max(0, upper)
      : 0;
  return clamp(t, 0, upper);
};
const cleanComponent = (value, scale) => {
  const tolerance = 8 * Number.EPSILON * Math.max(1, Math.abs(scale));
  return Number.isFinite(value) && Math.abs(value) <= tolerance ? 0 : value;
};
export function motion(p, t = 0) {
  const stop = p.a < 0 ? -p.v0 / p.a : Infinity,
    time = simulationTime(t, stop);
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
    vx = cleanComponent(p.v0 * Math.cos(angle), p.v0),
    vy = cleanComponent(p.v0 * Math.sin(angle), p.v0),
    drag = p.drag ?? 0;
  if (!Number.isFinite(drag) || drag < 0)
    throw new RangeError("Havo qarshiligi manfiy bo‘lmaydi.");
  const mass = drag > 0 ? positive(p.m ?? 1, "Massa") : p.m ?? 1,
    gamma = drag > 0 ? drag / mass : 0,
    idealDuration = (vy + Math.sqrt(vy * vy + 2 * g * p.h)) / g;
  const positionAt = (time) => {
    if (gamma === 0)
      return {
        x: vx * time,
        y: p.h + vy * time - (g * time * time) / 2,
        vx,
        vy: vy - g * time,
      };
    const decay = Math.exp(-gamma * time),
      terminal = g / gamma;
    return {
      x: (vx * (1 - decay)) / gamma,
      y:
        p.h +
        ((vy + terminal) * (1 - decay)) / gamma -
        terminal * time,
      vx: vx * decay,
      vy: (vy + terminal) * decay - terminal,
    };
  };
  let duration = idealDuration;
  if (gamma > 0 && idealDuration > 0) {
    let lo = 0,
      hi = Math.max(1, idealDuration);
    while (positionAt(hi).y > 0 && hi < 300) hi *= 2;
    for (let i = 0; i < 72; i++) {
      const mid = (lo + hi) / 2;
      if (positionAt(mid).y > 0) lo = mid;
      else hi = mid;
    }
    duration = hi;
  }
  const apexTime =
      vy > 0
        ? gamma > 0
          ? Math.log1p((gamma * vy) / g) / gamma
          : vy / g
        : 0,
    apex = positionAt(apexTime),
    time = simulationTime(t, duration),
    landed = time >= duration,
    current = positionAt(time),
    impact = positionAt(duration);
  return {
    x: current.x,
    y: Math.max(0, current.y),
    vx: landed ? 0 : current.vx,
    vy: landed ? 0 : current.vy,
    speed: landed ? 0 : Math.hypot(current.vx, current.vy),
    impactVx: impact.vx,
    impactVy: impact.vy,
    impactSpeed: Math.hypot(impact.vx, impact.vy),
    landed,
    duration,
    range: impact.x,
    height: Math.max(p.h, apex.y),
    drag,
  };
}
export function newton(p, t = 0) {
  positive(p.m, "Massa");
  const angle = ((p.slope ?? 0) * Math.PI) / 180;
  const normal = p.m * G * Math.cos(angle),
    driving = p.force - p.m * G * Math.sin(angle),
    friction = (p.mu ?? 0) * normal;
  const net = Math.sign(driving) * Math.max(0, Math.abs(driving) - friction),
    a = net / p.m,
    time = simulationTime(t);
  return {
    a,
    net,
    normal,
    driving,
    friction: Math.min(Math.abs(driving), friction),
    v: a * time,
    x: (a * time * time) / 2,
  };
}
export function friction(p, t = 0) {
  positive(p.m, "Massa");
  const f = p.mu * p.normal,
    a = f / p.m,
    stop = a > 0 ? p.v0 / a : Infinity,
    time = simulationTime(t, stop),
    stopped = Number.isFinite(stop) && time >= stop,
    distance = a > 0 ? (p.v0 * p.v0) / (2 * a) : Infinity;
  return {
    f: stopped ? 0 : f,
    maxFriction: f,
    a: stopped ? 0 : -a,
    v: stopped ? 0 : Math.max(0, p.v0 - a * time),
    x: stopped ? distance : p.v0 * time - (a * time * time) / 2,
    stop,
    distance,
    stopped,
  };
}
export function energy(p, t = 0) {
  positive(p.m, "Massa");
  const radius = 12,
    beta = p.friction ? 0.36 : 0;
  // Exact constrained particle: y=q²/(2R); metric accounts for the actual track speed.
  const target = simulationTime(t),
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
  const naturalOmega = Math.sqrt(p.k / p.m),
    damping = p.damping ?? 0;
  if (!Number.isFinite(damping) || damping < 0)
    throw new RangeError("So‘nish manfiy bo‘lmaydi.");
  if (damping >= naturalOmega)
    throw new RangeError("Bu tajribada so‘nish kritik qiymatdan kichik bo‘lishi kerak.");
  const omega = Math.sqrt(naturalOmega * naturalOmega - damping * damping),
    A = p.amplitude ?? 0.4,
    phase = p.phase ?? 0;
  const time = simulationTime(t),
    envelope = Math.exp(-damping * time),
    theta = omega * time + phase,
    x = A * envelope * Math.cos(theta),
    v = -A * envelope * (damping * Math.cos(theta) + omega * Math.sin(theta));
  return {
    period: TAU / omega,
    omega,
    naturalOmega,
    damping,
    x,
    v,
    energy: (p.m * v * v) / 2 + (p.k * x * x) / 2,
    envelope: A * envelope,
    equilibrium: (p.m * G) / p.k,
  };
}
export function resonance(p, t = 0) {
  positive(p.damping, "So‘nish");
  const w0 = p.natural,
    omega = p.frequency,
    beta = p.damping,
    force = p.drive ?? 0.25,
    denominator = Math.sqrt(
      (w0 * w0 - omega * omega) ** 2 + (2 * beta * omega) ** 2,
    ),
    amplitude = force === 0 ? 0 : force / denominator,
    phase = Math.atan2(2 * beta * omega, w0 * w0 - omega * omega),
    peakSquared = w0 * w0 - 2 * beta * beta,
    time = simulationTime(t);
  return {
    amplitude,
    x: amplitude * Math.cos(omega * time - phase),
    phase,
    natural: w0,
    peak: peakSquared > 0 ? Math.sqrt(peakSquared) : null,
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
  const target = simulationTime(t, 15),
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
  positive(p.molarMass ?? 0.028, "Molyar massa");
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
    sourcePower: p.emf * current,
    efficiency:
      p.emf === 0
        ? null
        : (p.resistance / (p.resistance + p.internal)) * 100,
  };
}
export function induction(p, t = 0) {
  positive(p.resistance, "Qarshilik");
  const w = p.speed,
    time = simulationTime(t),
    x = 1.5 * Math.cos(w * time),
    velocity = -1.5 * w * Math.sin(w * time),
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
