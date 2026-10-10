import { G, COULOMB, GAS, TAU, PLANCK, LIGHT, ELEMENTARY, MU0, LN2 } from "./constants.js";
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
  const x = p.x0 + p.v0 * time + (p.a * time * time) / 2;
  const v = p.v0 + p.a * time;
  const a = time >= stop ? 0 : p.a;
  return {
    x: Number.isFinite(x) ? x : p.x0,
    v: Number.isFinite(v) ? v : p.v0,
    a: Number.isFinite(a) ? a : p.a,
    stop: Number.isFinite(stop) ? stop : Infinity,
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
        x: Number.isFinite(vx * time) ? vx * time : 0,
        y: Number.isFinite(p.h + vy * time - (g * time * time) / 2)
          ? p.h + vy * time - (g * time * time) / 2 : p.h,
        vx: Number.isFinite(vx) ? vx : 0,
        vy: Number.isFinite(vy - g * time) ? vy - g * time : 0,
      };
    const decay = Math.exp(-gamma * time),
      terminal = g / gamma;
    return {
      x: Number.isFinite((vx * (1 - decay)) / gamma) ? (vx * (1 - decay)) / gamma : 0,
      y: Number.isFinite(p.h + ((vy + terminal) * (1 - decay)) / gamma - terminal * time)
        ? p.h + ((vy + terminal) * (1 - decay)) / gamma - terminal * time : p.h,
      vx: Number.isFinite(vx * decay) ? vx * decay : 0,
      vy: Number.isFinite((vy + terminal) * decay - terminal) ? (vy + terminal) * decay - terminal : 0,
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
    x: Number.isFinite(current.x) ? current.x : 0,
    y: Number.isFinite(Math.max(0, current.y)) ? Math.max(0, current.y) : 0,
    vx: landed ? 0 : (Number.isFinite(current.vx) ? current.vx : 0),
    vy: landed ? 0 : (Number.isFinite(current.vy) ? current.vy : 0),
    speed: landed ? 0 : (Number.isFinite(Math.hypot(current.vx, current.vy)) ? Math.hypot(current.vx, current.vy) : 0),
    impactVx: Number.isFinite(impact.vx) ? impact.vx : 0,
    impactVy: Number.isFinite(impact.vy) ? impact.vy : 0,
    impactSpeed: Number.isFinite(Math.hypot(impact.vx, impact.vy)) ? Math.hypot(impact.vx, impact.vy) : 0,
    landed,
    duration: Number.isFinite(duration) ? duration : 0,
    range: Number.isFinite(impact.x) ? impact.x : 0,
    height: Number.isFinite(Math.max(p.h, apex.y)) ? Math.max(p.h, apex.y) : p.h,
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
    a: Number.isFinite(a) ? a : 0,
    net: Number.isFinite(net) ? net : 0,
    normal: Number.isFinite(normal) ? normal : 0,
    driving: Number.isFinite(driving) ? driving : 0,
    friction: Number.isFinite(Math.min(Math.abs(driving), friction)) ? Math.min(Math.abs(driving), friction) : 0,
    v: Number.isFinite(a * time) ? a * time : 0,
    x: Number.isFinite((a * time * time) / 2) ? (a * time * time) / 2 : 0,
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
    f: stopped ? 0 : (Number.isFinite(f) ? f : 0),
    maxFriction: Number.isFinite(f) ? f : 0,
    a: stopped ? 0 : (Number.isFinite(-a) ? -a : 0),
    v: stopped ? 0 : (Number.isFinite(Math.max(0, p.v0 - a * time)) ? Math.max(0, p.v0 - a * time) : 0),
    x: stopped ? (Number.isFinite(distance) ? distance : 0) : (Number.isFinite(p.v0 * time - (a * time * time) / 2) ? p.v0 * time - (a * time * time) / 2 : 0),
    stop: Number.isFinite(stop) ? stop : Infinity,
    distance: Number.isFinite(distance) ? distance : Infinity,
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
    q: Number.isFinite(q) ? q : 0,
    v: Number.isFinite(v) ? v : 0,
    height: Number.isFinite(height) ? height : 0,
    kinetic: Number.isFinite(kinetic) ? kinetic : 0,
    potential: Number.isFinite(potential) ? potential : 0,
    total: Number.isFinite(total) ? total : 0,
    initial: Number.isFinite(initial) ? initial : 0,
    heat: p.friction ? Math.max(0, Number.isFinite(initial - total) ? initial - total : 0) : 0,
    radius: Number.isFinite(radius) ? radius : 12,
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
    period: Number.isFinite(TAU / omega) ? TAU / omega : 0,
    omega: Number.isFinite(omega) ? omega : 0,
    naturalOmega: Number.isFinite(naturalOmega) ? naturalOmega : 0,
    damping: Number.isFinite(damping) ? damping : 0,
    x: Number.isFinite(x) ? x : 0,
    v: Number.isFinite(v) ? v : 0,
    energy: Number.isFinite((p.m * v * v) / 2 + (p.k * x * x) / 2) ? (p.m * v * v) / 2 + (p.k * x * x) / 2 : 0,
    envelope: Number.isFinite(A * envelope) ? A * envelope : 0,
    equilibrium: Number.isFinite((p.m * G) / p.k) ? (p.m * G) / p.k : 0,
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
    amplitude: Number.isFinite(amplitude) ? amplitude : 0,
    x: Number.isFinite(amplitude * Math.cos(omega * time - phase)) ? amplitude * Math.cos(omega * time - phase) : 0,
    phase: Number.isFinite(phase) ? phase : 0,
    natural: Number.isFinite(w0) ? w0 : 0,
    peak: peakSquared > 0 && Number.isFinite(Math.sqrt(peakSquared)) ? Math.sqrt(peakSquared) : null,
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
  const r = Math.max(0.01, Number.isFinite(p.resistance) ? p.resistance : 0.01);
  if (p.internal < 0) throw new RangeError("Ichki qarshilik manfiy bo‘lmaydi.");
  const current = p.emf / (r + p.internal);
  const isShort = r <= 0.2;
  return {
    current,
    voltage: current * r,
    power: current * current * r,
    loss: current * current * p.internal,
    sourcePower: p.emf * current,
    efficiency:
      p.emf === 0
        ? null
        : (r / (r + p.internal)) * 100,
    warning: isShort
      ? `Qisqa tutashuv xavfi: Tashqi qarshilik R ≈ 0 ga yaqin, tok kuchi keskin oshdi (I = ${current.toFixed(1)} A) — simlarning qizish va erish xavfi!`
      : "",
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

/* ================================================================== *
 * 2-QISM: IMPULS SAQLANISHI VA TO‘QNASHUV
 * ================================================================== */

/**
 * Bir o‘lchamli to‘qnashuv. `restitution` (qaytarish koeffitsiyenti) 1 da
 * elastik, 0 da to‘liq notiq to‘qnashuv beradi. Impuls saqlanish qonuni
 * har doim bajariladi; kinetik energiya esa faqat e=1 da saqlanadi.
 */
export function collision(p) {
  positive(p.m1, "Birinchi jism massasi");
  positive(p.m2, "Ikkinchi jism massasi");
  const e = clamp(Number.isFinite(p.restitution) ? p.restitution : 1, 0, 1),
    m1 = p.m1,
    m2 = p.m2,
    v1 = Number.isFinite(p.v1) ? p.v1 : 0,
    v2 = Number.isFinite(p.v2) ? p.v2 : 0,
    momentumBefore = m1 * v1 + m2 * v2,
    kineticBefore = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
  // Impuls saqlanish + qaytarish nisbati ikki tenglamani beradi.
  const impulse = v1 > v2 ? ((1 + e) * m1 * m2 * (v1 - v2)) / (m1 + m2) : 0,
    u1 = v1 - impulse / m1,
    u2 = v2 + impulse / m2,
    momentumAfter = m1 * u1 + m2 * u2,
    kineticAfter = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
  return {
    u1: Number.isFinite(u1) ? u1 : v1,
    u2: Number.isFinite(u2) ? u2 : v2,
    impulse: Number.isFinite(impulse) ? impulse : 0,
    momentumBefore: Number.isFinite(momentumBefore) ? momentumBefore : 0,
    momentumAfter: Number.isFinite(momentumAfter) ? momentumAfter : 0,
    kineticBefore: Number.isFinite(kineticBefore) ? kineticBefore : 0,
    kineticAfter: Number.isFinite(kineticAfter) ? kineticAfter : 0,
    lost: Math.max(0, kineticBefore - kineticAfter),
    elastic: e >= 1 - 1e-9,
    contact: v1 > v2,
  };
}

/* ================================================================== *
 * 3-QISM: GIDRAVLIK PRESS VA BOSIM
 * ================================================================== */

/**
 * Gidravlik press: Paskal qonuni. Kichik pistonga qo‘yilgan kuch katta
 * pistonni kuchaytiradi, lekin yo‘l bir xarajada uzayadi — ish saqlanadi.
 */
export function hydraulic(p) {
  positive(p.s1, "Kichik piston yuzasi");
  positive(p.s2, "Katta piston yuzasi");
  const ratio = p.s2 / p.s1,
    lift = clamp(Number.isFinite(p.lift) ? p.lift : 0, 0, 2),
    smallForce = Number.isFinite(p.force) ? p.force : 0,
    pressure = smallForce / (p.s1 / 1e4), // 1 m² = 10⁴ cm²
    bigForce = pressure * (p.s2 / 1e4),
    bigLift = lift / ratio,
    workIn = smallForce * lift,
    workOut = bigForce * bigLift;
  return {
    ratio: Number.isFinite(ratio) ? ratio : 0,
    pressure: Number.isFinite(pressure) ? pressure : 0,
    bigForce: Number.isFinite(bigForce) ? bigForce : 0,
    bigLift: Number.isFinite(bigLift) ? bigLift : 0,
    workIn: Number.isFinite(workIn) ? workIn : 0,
    workOut: Number.isFinite(workOut) ? workOut : 0,
    gain: Number.isFinite(ratio) ? ratio : 0,
  };
}

/** Gidrostatik bosim p = ρgh — chuqurlik va zichlikka bog‘liq. */
export function hydrostatic(p) {
  positive(p.rho, "Suyuqlik zichligi");
  const h = Number.isFinite(p.h) ? p.h : 0,
    pressure = p.rho * G * h;
  return {
    pressure: Number.isFinite(pressure) ? pressure : 0,
    kpa: Number.isFinite(pressure) ? pressure / 1000 : 0,
    column: Number.isFinite(pressure) ? pressure : 0,
    depth: h,
  };
}

/* ================================================================== *
 * 4-QISM: MATEMATIK MAYATNIK
 * ================================================================== */

/**
 * Matematik mayatnik (kichik burchak). T = 2π√(l/g). O‘rta va qiyin
 * darajada so‘nish qo‘shiladi: amplituda eksponensial kamayadi.
 */
export function pendulum(p, t = 0) {
  positive(p.length, "Mayatnik uzunligi");
  const theta0 = ((Number.isFinite(p.amplitude) ? p.amplitude : 15) * Math.PI) / 180,
    natural = Math.sqrt(G / p.length),
    damping = p.damping ?? 0;
  if (!Number.isFinite(damping) || damping < 0)
    throw new RangeError("So‘nish manfiy bo‘lmaydi.");
  if (damping >= natural)
    throw new RangeError("Bu tajribada so‘nish kritik qiymatdan kichik bo‘lishi kerak.");
  const omega = Math.sqrt(natural * natural - damping * damping),
    time = simulationTime(t),
    envelope = Math.exp(-damping * time),
    theta = theta0 * envelope * Math.cos(omega * time),
    velocity = -theta0 * envelope * omega * Math.sin(omega * time),
    height = p.length * (1 - Math.cos(theta)),
    energy = 0.5 * p.length * p.length * velocity * velocity +
      G * p.length * (1 - Math.cos(theta));
  return {
    theta: Number.isFinite(theta) ? theta : 0,
    degrees: Number.isFinite(theta) ? (theta * 180) / Math.PI : 0,
    velocity: Number.isFinite(velocity) ? velocity : 0,
    height: Number.isFinite(height) ? height : 0,
    period: Number.isFinite(TAU / omega) ? TAU / omega : 0,
    omega: Number.isFinite(omega) ? omega : 0,
    natural: Number.isFinite(natural) ? natural : 0,
    energy: Number.isFinite(energy) ? energy : 0,
    envelope: Number.isFinite(theta0 * envelope) ? theta0 * envelope : 0,
    smallAngleValid: theta0 < 0.5,
  };
}

/* ================================================================== *
 * 5-QISM: IZOJARAYONLAR (p–V grafik)
 * ================================================================== */

/**
 * Gazning izotermik / izobarik / izoxorik jarayoni. `process` 0/1/2.
 * Barcha holatlar pV = nRT ga bo‘ysunadi, shuning uchun izotermada
 * pV mahsuloti doimiy bo‘lib qoladi.
 */
export function isoProcess(p, t = 0) {
  positive(p.volume, "Hajm");
  positive(p.temperature, "Harorat");
  const process = clamp(Math.round(Number.isFinite(p.process) ? p.process : 0), 0, 2),
    n = p.moles ?? 1,
    V0 = p.volume,
    T0 = p.temperature,
    time = simulationTime(t, 10),
    sweep = clamp(time / 10, 0, 1);
  // Jarayon shkalasi: izoterma 0→2, izobara 0→2, izoxora 0→2 sıxilish.
  const factor = 1 + sweep;
  const state = (V, T) => {
    const volume = V / 1000,
      pressure = (n * GAS * T) / volume;
    return { V, T, p: pressure, pv: pressure * volume };
  };
  const current =
      process === 0
        ? state(V0 * factor, T0)
        : process === 1
          ? state(V0 * factor, T0 * factor)
          : state(V0, T0 * factor);
  const start = state(V0, T0),
    end =
      process === 0
        ? state(V0 * 2, T0)
        : process === 1
          ? state(V0 * 2, T0 * 2)
          : state(V0, T0 * 2);
  // Izobarada bosim doimiy: A = p₀·ΔV. Izoxorada hajm o‘zgarmaydi va
  // A = 0. Izotermada A = nRT₀·ln(V₂/V₁) — logarifmik integrallash.
  const work =
      process === 0
        ? n * GAS * T0 * Math.log(current.V / V0)
        : process === 1
          ? (start.p * (current.V - V0)) / 1000
          : 0;
  return {
    process,
    sweep,
    volume: current.V,
    temperature: current.T,
    pressure: current.p,
    pressureKpa: current.p / 1000,
    startP: start.p,
    endP: end.p,
    startV: start.V,
    endV: end.V,
    startT: start.T,
    endT: end.T,
    // Izotermada pV doimiy; boshqalarda o‘zgaradi.
    pvInvariant: process === 0,
    work: Number.isFinite(work) ? work : 0,
    // Izotermada Q = A; izobarada Q = C_p·nΔT, izoxorada Q = C_v·nΔT.
    // Bir atomli ideal gaz uchun C_p = 5R/2, C_v = 3R/2.
    heat: (() => {
      const q =
        process === 0
          ? work
          : process === 1
            ? 2.5 * n * GAS * (current.T - T0)
            : 1.5 * n * GAS * (current.T - T0);
      return Number.isFinite(q) ? q : 0;
    })(),
    capacity: process === 1 ? 2.5 : 1.5,
  };
}

/* ================================================================== *
 * 6-QISM: TERMODINAMIKA — 1-QONUN VA ISSIQLIK DVIGATELI
 * ================================================================== */

/** Termodinamikaning I qonuni: Q = ΔU + A. */
export function firstLaw(p) {
  const n = positive(p.moles, "Modda miqdori"),
    t1 = positive(p.temperature, "Boshlang‘ich harorat"),
    cv = 1.5 * GAS, // bir atomli ideal gaz
    deltaT = Number.isFinite(p.deltaT) ? p.deltaT : 0,
    work = Number.isFinite(p.work) ? p.work : 0,
    deltaU = n * cv * deltaT,
    heat = deltaU + work,
    t2 = t1 + deltaT;
  return {
    heat: Number.isFinite(heat) ? heat : 0,
    internal: Number.isFinite(deltaU) ? deltaU : 0,
    work: Number.isFinite(work) ? work : 0,
    balanced: true,
    deltaT: Number.isFinite(deltaT) ? deltaT : 0,
    temperature1: t1,
    temperature2: Number.isFinite(t2) ? t2 : t1,
    // Issiqlik qo‘yilganda ichki energiya, bajarilgan ishda esa harorat
    // o‘zgaradi — aynan shu I qonunining mazmuni.
    direction:
      work > 0 ? "expansion" : work < 0 ? "compression" : "rigid",
  };
}

/** Issiqlik dvigateli: FIK va Karno chegarasi. */
export function heatEngine(p) {
  const t1 = positive(p.hot, "Ishchi harorat"),
    t2 = Number.isFinite(p.cold) ? p.cold : 300;
  const invalidT = t2 >= t1;
  const carnot = invalidT ? 0 : 1 - t2 / t1,
    real = clamp(Number.isFinite(p.efficiency) ? p.efficiency : 0.3, 0, 1),
    q1 = positive(p.heatIn ?? 1000, "Olingan issiqlik"),
    work = invalidT ? 0 : q1 * Math.min(real, carnot),
    q2 = q1 - work;
  const violatesCarnot = !invalidT && real > carnot + 1e-6;
  return {
    carnot: Number.isFinite(carnot) ? Math.max(0, carnot * 100) : 0,
    efficiency: Number.isFinite(real) ? real * 100 : 0,
    work: Number.isFinite(work) ? work : 0,
    heatIn: q1,
    heatOut: Number.isFinite(q2) ? q2 : 0,
    hot: t1,
    cold: t2,
    ideal: real >= carnot - 1e-9,
    warning: invalidT
      ? "Termodinamikaning 2-qonuni buzilishi: Sovutkich harorati isitgich haroratidan past bo‘lishi shart (T_sovuq < T_issiq)!"
      : violatesCarnot
        ? `Termodinamikaning 2-qonuni buzilishi: Real FIK (${(real * 100).toFixed(1)}%) ideal Karno FIKidan (${(carnot * 100).toFixed(1)}%) katta bo‘lishi mumkin emas!`
        : "",
  };
}

/* ================================================================== *
 * 7-QISM: ZANJIRLAR — KETMA-KET VA PARALLEL
 * ================================================================== */

/** Rezistorlarni ketma-ket va parallel ulashning taqqoslash modeli. */
export function network(p) {
  positive(p.r1, "Birinchi qarshilik");
  positive(p.r2, "Ikkinchi qarshilik");
  const voltage = Number.isFinite(p.voltage) ? p.voltage : 0,
    series = p.r1 + p.r2,
    parallel = (p.r1 * p.r2) / series,
    total = p.mode === 1 ? parallel : series,
    current = total > 0 ? voltage / total : 0,
    u1 = p.mode === 1 ? voltage : current * p.r1,
    u2 = p.mode === 1 ? voltage : current * p.r2,
    i1 = p.mode === 1 ? (p.r1 > 0 ? voltage / p.r1 : 0) : current,
    i2 = p.mode === 1 ? (p.r2 > 0 ? voltage / p.r2 : 0) : current;
  return {
    total: Number.isFinite(total) ? total : 0,
    series: Number.isFinite(series) ? series : 0,
    parallel: Number.isFinite(parallel) ? parallel : 0,
    current: Number.isFinite(current) ? current : 0,
    u1: Number.isFinite(u1) ? u1 : 0,
    u2: Number.isFinite(u2) ? u2 : 0,
    i1: Number.isFinite(i1) ? i1 : 0,
    i2: Number.isFinite(i2) ? i2 : 0,
    power: Number.isFinite(voltage * current) ? voltage * current : 0,
    mode: p.mode === 1 ? 1 : 0,
  };
}

/* ================================================================== *
 * 8-QISM: MAGNIT KUCHLARI — AMPER VA LORENS
 * ================================================================== */

/** Amper kuchi: F = BIL sinα — tok o‘tkazgichga magnit maydon ta’siri. */
export function ampere(p) {
  positive(p.length, "O‘tkazgich uzunligi");
  const I = Number.isFinite(p.current) ? p.current : 0,
    B = p.field ?? 0,
    alpha = ((Number.isFinite(p.angle) ? p.angle : 90) * Math.PI) / 180,
    force = I * B * p.length * Math.sin(alpha);
  return {
    force: Number.isFinite(force) ? force : 0,
    direction: Math.sin(alpha) >= 0 ? 1 : -1,
    current: I,
    field: B,
    angle: (alpha * 180) / Math.PI,
    maxForce: Number.isFinite(I * B * p.length) ? I * B * p.length : 0,
  };
}

/** Lorens kuchi: F = qvB sinα — zaryadli zarracha magnit maydonda. */
export function lorentz(p) {
  positive(p.mass, "Zarracha massasi");
  const q = Number.isFinite(p.charge) ? p.charge : 1,
    v = Number.isFinite(p.velocity) ? p.velocity : 0,
    B = p.field ?? 0,
    alpha = ((Number.isFinite(p.angle) ? p.angle : 90) * Math.PI) / 180,
    force = q * v * B * Math.sin(alpha);
  return {
    force: Number.isFinite(force) ? force : 0,
    charge: q,
    velocity: v,
    field: B,
    angle: (alpha * 180) / Math.PI,
    spiralRadius: B > 0 && v > 0 ? (p.mass * v) / (Math.abs(q) * B) : 0,
    // Rizoq radiusi: R = mv/(qB). Katta B → kichik doira.
    helixPitch: Number.isFinite(v) && B > 0 ? (TAU * p.mass * v) / (Math.abs(q) * B) : 0,
  };
}

/* ================================================================== *
 * 9-QISM: TEbranish KONTURI VA TRANSFORMATOR
 * ================================================================== */

/** LC konturi — Tomson formulasi T = 2π√(LC). */
export function lcr(p, t = 0) {
  // Parametrlar mH va μF da kiritiladi; fizikada barchasi SI birliklarida.
  const L = positive(p.inductance, "Induktivlik") * 1e-3,
    C = positive(p.capacitance, "Sig‘im") * 1e-6,
    omega = 1 / Math.sqrt(L * C),
    q0 = (Number.isFinite(p.charge) ? p.charge : 1) * 1e-3,
    time = simulationTime(t),
    phase = omega * time,
    q = q0 * Math.cos(phase),
    current = -q0 * omega * Math.sin(phase),
    // Energiya q va i orasida almashinadi, jami doimiy.
    eCap = (q * q) / (2 * C),
    eInd = 0.5 * L * current * current;
  return {
    charge: Number.isFinite(q) ? q * 1000 : 0,
    current: Number.isFinite(current) ? current * 1000 : 0,
    period: Number.isFinite(TAU / omega) ? TAU / omega : 0,
    omega: Number.isFinite(omega) ? omega : 0,
    frequency: Number.isFinite(omega / TAU) ? omega / TAU : 0,
    energyCap: Number.isFinite(eCap) ? eCap : 0,
    energyInd: Number.isFinite(eInd) ? eInd : 0,
    total: Number.isFinite(eCap + eInd) ? eCap + eInd : 0,
    reactance: Number.isFinite(Math.sqrt(L / C)) ? Math.sqrt(L / C) : 0,
  };
}

/** Transformator: U₁/U₂ = N₁/N₂ = I₂/I₁. */
export function transformer(p) {
  positive(p.n1, "Birinchi g‘altak o‘ramlari");
  positive(p.n2, "Ikkinchi g‘altak o‘ramlari");
  const N1 = p.n1,
    N2 = p.n2,
    U1 = Number.isFinite(p.voltage) ? p.voltage : 0,
    I1 = Number.isFinite(p.current) ? p.current : 0,
    U2 = (U1 * N2) / N1,
    I2 = N1 === 0 ? 0 : (I1 * N1) / N2,
    powerIn = U1 * I1,
    powerOut = U2 * I2;
  return {
    voltage2: Number.isFinite(U2) ? U2 : 0,
    current2: Number.isFinite(I2) ? I2 : 0,
    ratio: Number.isFinite(N2 / N1) ? N2 / N1 : 0,
    powerIn: Number.isFinite(powerIn) ? powerIn : 0,
    powerOut: Number.isFinite(powerOut) ? powerOut : 0,
    efficiency: powerIn > 0 ? (powerOut / powerIn) * 100 : null,
    stepUp: N2 > N1,
  };
}

/* ================================================================== *
 * 10-QISM: OPTIKA — QAYTISH, SINDIRISH VA INTERFERENSIYA
 * ================================================================== */

/** Snell qonuni: sinα/sinβ = n₂/n₁. To‘liq ichki qaytish ham tekshiriladi. */
export function refraction(p) {
  const n1 = positive(p.n1, "Birinchi muhit sindiruvchanligi"),
    n2 = positive(p.n2, "Ikkinchi muhit sindiruvchanligi"),
    alpha = ((Number.isFinite(p.angle) ? p.angle : 30) * Math.PI) / 180,
    ratio = n1 / n2,
    sinBeta = ratio * Math.sin(alpha),
    totalInternal = Math.abs(sinBeta) > 1;
  const beta = totalInternal ? null : Math.asin(clamp(sinBeta, -1, 1));
  const critical = n1 > n2 ? Math.asin(clamp(n2 / n1, 0, 1)) : null;
  return {
    beta: beta === null ? null : (beta * 180) / Math.PI,
    alpha: (alpha * 180) / Math.PI,
    totalInternal,
    critical: critical === null ? null : (critical * 180) / Math.PI,
    ratio: Number.isFinite(ratio) ? ratio : 0,
    speed1: LIGHT / n1,
    speed2: LIGHT / n2,
  };
}

/**
 * Ikki tirqakli interferensiya. Maksimumlar d·sinθ = kλ shartiga
 * bo‘ysunadi; markaziy maksimum n=0 da eng yorqin.
 */
export function interference(p) {
  // λ (μm), d (mm) va x (mm) — barchasi metrga o‘tkaziladi.
  const lambda = positive(p.wavelength, "To‘lqin uzunligi") * 1e-6,
    d = positive(p.slits, "Tirqaklar orasidagi masofa") * 1e-3,
    L = positive(p.screen, "Ekran masofasi"),
    x = (Number.isFinite(p.position) ? p.position : 0) * 1e-3,
    // D·sinθ ≈ x/L (kichik burchak yondashuvi)
    pathDiff = (d * x) / L,
    order = pathDiff / lambda,
    constructive = Math.abs(order - Math.round(order)) < 0.08,
    intensity = 0.5 * (1 + Math.cos((TAU * pathDiff) / lambda));
  return {
    pathDiff: Number.isFinite(pathDiff) ? pathDiff : 0,
    order: Number.isFinite(order) ? order : 0,
    constructive,
    intensity: Number.isFinite(intensity) ? intensity : 0,
    fringeSpacing: Number.isFinite((lambda * L) / d) ? (lambda * L) / d : 0,
    maxOrder: Math.floor(d / lambda),
  };
}

/* ================================================================== *
 * 11-QISM: KVANT FIZIKASI VA NISBIYLIK
 * ================================================================== */

/** Fotoeffekt: hν = A + E_k(max). E_k < 0 da elektron chiqmaydi. */
export function photoelectric(p) {
  // ν sliderda 10¹⁴ Hz birlikda; energiya eV da hisoblanadi.
  const frequency = positive(p.frequency, "Yorug‘lik chastotasi") * 1e14,
    work = positive(p.work, "Chiqish ishi"),
    photon = (PLANCK * frequency) / ELEMENTARY, // eV
    kinetic = photon - work,
    threshold = (work * ELEMENTARY) / PLANCK; // Hz
  const emits = kinetic > 0;
  return {
    photon: Number.isFinite(photon) ? photon : 0,
    work,
    // chegaradan past chastotada elektron umuman chiqmaydi.
    kinetic: emits ? kinetic : 0,
    rawKinetic: Number.isFinite(kinetic) ? kinetic : 0,
    emits,
    threshold: Number.isFinite(threshold) ? threshold : 0,
    frequency,
    warning: !emits
      ? `Fotoeffektning qizil chegarasi: Foton energiyasi (${photon.toFixed(2)} eV) chiqish ishidan (${work.toFixed(2)} eV) kichik (hν < A). Elektronlar metalldan uchib chiqmaydi!`
      : "",
  };
}

/** E = mc² — massa va energiya o‘zaro aylantirilishi. */
export function massEnergy(p) {
  const grams = Number.isFinite(p.mass) ? p.mass : 0;
  if (grams < 0) {
    return {
      joules: null,
      tnt: null,
      mass: grams,
      energyPerGram: 8.98755179e13,
      warning: "Massa manfiy bo‘lishi mumkin emas.",
    };
  }
  const kg = grams / 1000;
  return {
    joules: Number.isFinite(kg * LIGHT * LIGHT) ? kg * LIGHT * LIGHT : 0,
    // Taxminan 1 kt TNT = 4.184e12 J
    tnt: Number.isFinite(kg * LIGHT * LIGHT / 4.184e12) ? (kg * LIGHT * LIGHT) / 4.184e12 : 0,
    mass: grams,
    energyPerGram: 8.98755179e13, // J
  };
}

/** Radioaktiv yemirilish: N = N₀·2^(−t/T) yoki N = N₀e^(−λt). */
export function decay(p, t = 0) {
  positive(p.halfLife, "Yarim yemirilish davri");
  positive(p.initial, "Boshlang‘ich atomlar soni");
  const N0 = p.initial,
    T = p.halfLife,
    time = simulationTime(t),
    lambda = LN2 / T,
    N = N0 * Math.exp(-lambda * time),
    decayed = N0 - N,
    activity = lambda * N,
    // Qoldiq o‘lchov: nechta yarim davr o‘tgani
    halves = time / T;
  return {
    remaining: Number.isFinite(N) ? N : 0,
    decayed: Number.isFinite(decayed) ? decayed : 0,
    activity: Number.isFinite(activity) ? activity : 0,
    lambda: Number.isFinite(lambda) ? lambda : 0,
    halfLives: Number.isFinite(halves) ? halves : 0,
    percent: N0 > 0 ? (N / N0) * 100 : 0,
    initial: N0,
  };
}
