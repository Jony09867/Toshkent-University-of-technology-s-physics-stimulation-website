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

export function lever(p) {
  positive(p.l1, "Chap yelka");
  positive(p.l2, "O‘ng yelka");
  const g = 9.8;
  const mLeft = p.m1 * g * p.l1;
  const mRight = p.m2 * g * p.l2;
  const netTorque = mLeft - mRight;
  const tilt = clamp(netTorque / (g * Math.max(0.5, p.l1 + p.l2) * 2), -15, 15);
  return {
    mLeft,
    mRight,
    netTorque,
    tilt,
    balanced: Math.abs(netTorque) < 0.1,
    gain: p.l1 / p.l2,
  };
}

export function collision(p, t = 0) {
  positive(p.m1, "Massa 1");
  positive(p.m2, "Massa 2");
  const time = simulationTime(t);
  const e = clamp(p.elasticity ?? 1, 0, 1);
  const m1 = p.m1, m2 = p.m2, v1 = p.v1, v2 = p.v2;
  const pTotal = m1 * v1 + m2 * v2;

  // Final velocities according to momentum & restitution e
  const v1After = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
  const v2After = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);

  const eInit = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
  const eFinal = 0.5 * m1 * v1After * v1After + 0.5 * m2 * v2After * v2After;
  const energyLoss = Math.max(0, eInit - eFinal);

  // Initial separation: 8 meters centered around 0
  const x1_0 = -4;
  const x2_0 = 4;
  const relV = v1 - v2;
  const canCollide = relV > 0.001;
  const tHit = canCollide ? (x2_0 - x1_0) / relV : Infinity;

  let x1, x2, currentV1, currentV2;
  const hasCollided = canCollide && time >= tHit;

  if (!hasCollided) {
    x1 = x1_0 + v1 * time;
    x2 = x2_0 + v2 * time;
    currentV1 = v1;
    currentV2 = v2;
  } else {
    const xHit = x1_0 + v1 * tHit;
    const dt = time - tHit;
    x1 = xHit + v1After * dt;
    x2 = xHit + v2After * dt;
    currentV1 = v1After;
    currentV2 = v2After;
  }

  return {
    pTotal,
    v1After,
    v2After,
    energyLoss,
    x1,
    x2,
    currentV1,
    currentV2,
    hasCollided,
    tHit: Number.isFinite(tHit) ? tHit : null,
  };
}

export function thermo(p) {
  positive(p.t1, "Isitkich harorati");
  positive(p.t2, "Sovutgich harorati");
  const isLawViolated = p.t1 <= p.t2;
  const efficiency = isLawViolated ? 0 : (1 - p.t2 / p.t1) * 100;
  const work = isLawViolated ? 0 : (efficiency / 100) * p.q1;
  const q2 = isLawViolated ? p.q1 : p.q1 - work;
  return {
    efficiency,
    work,
    q2,
    deltaU: 0,
    carnotMax: efficiency,
    isLawViolated,
    notice: isLawViolated
      ? "T₁ ≤ T₂: Termodinamika II qonuni bo‘yicha isitkich harorati sovutgichdan katta bo‘lishi shart!"
      : null,
  };
}

export function electrolysis(p, t = 0) {
  positive(p.current, "Tok kuchi");
  const time = simulationTime(t);
  // k in g/C: Cu = 0.000329, Ag = 0.001118, Ni = 0.000304
  const kTable = [0.000329, 0.001118, 0.000304];
  const names = ["Mis (Cu)", "Kumush (Ag)", "Nikel (Ni)"];
  const metalIdx = clamp(p.metal ?? 0, 0, 2);
  const k = kTable[metalIdx];
  const q = p.current * time;
  const mass = k * q;
  const energy = (p.voltage * p.current * time) / 1000;
  const layer = mass * 12.5; // proportional thickness in microns

  return {
    mass,
    charge: q,
    energy,
    layer,
    metalName: names[metalIdx],
  };
}

export function circuitOsc(p, t = 0) {
  positive(p.inductance, "Induktivlik");
  positive(p.capacitance, "Sig‘im");
  const time = simulationTime(t); // Fizik vaqt soniyalarda.
  const L = p.inductance * 1e-3, C = p.capacitance * 1e-6;
  const R = p.resistance ?? 0;
  if (!Number.isFinite(R) || R < 0) throw new RangeError("Qarshilik manfiy bo‘lmaydi.");
  const omega0 = 1 / Math.sqrt(L * C), beta = R / (2 * L);
  const period = 2 * Math.PI / omega0 * 1000;
  const frequency = omega0 / (2 * Math.PI) / 1000;
  const q0 = C * p.voltage0;
  const d = omega0 * omega0 - beta * beta;
  let q, current;
  // Boshlang‘ich shartlar: q(0)=CU₀, I(0)=0; uch so‘nish rejimi.
  if (Math.abs(d) < omega0 * omega0 * 1e-10) {
    const decay = Math.exp(-beta * time);
    q = q0 * decay * (1 + beta * time);
    current = -q0 * beta * beta * time * decay;
  } else if (d > 0) {
    const omega = Math.sqrt(d), phase = omega * time, decay = Math.exp(-beta * time);
    q = q0 * decay * (Math.cos(phase) + beta / omega * Math.sin(phase));
    current = -q0 * omega0 * omega0 / omega * decay * Math.sin(phase);
  } else {
    const z = Math.sqrt(-d), r1 = -omega0 * omega0 / (beta + z), r2 = -beta - z;
    const A = -r2 / (r1 - r2), B = r1 / (r1 - r2);
    q = q0 * (A * Math.exp(r1 * time) + B * Math.exp(r2 * time));
    current = q0 * (A * r1 * Math.exp(r1 * time) + B * r2 * Math.exp(r2 * time));
  }
  const charge = q * 1e6;
  const energyCap = q * q / (2 * C) * 1000;
  const energyInd = L * current * current / 2 * 1000;
  const energyInitial = C * p.voltage0 * p.voltage0 / 2 * 1000;
  const energyHeat = Math.max(0, energyInitial - energyCap - energyInd);

  return {
    period,
    frequency,
    charge,
    current,
    energyCap,
    energyInd,
    totalEnergy: energyCap + energyInd,
    energyInitial,
    energyHeat,
  };
}

export function photoelectric(p) {
  positive(p.wavelength, "To‘lqin uzunligi");
  // E_photon = hc / lambda = 1240 / lambda(nm) in eV
  const photonEnergy = 1240 / p.wavelength;
  const workFuncs = [1.9, 2.3, 4.3];
  const metals = ["Seziy (Cs)", "Kaliy (K)", "Sink (Zn)"];
  const idx = clamp(p.metal ?? 0, 0, 2);
  const workFunc = workFuncs[idx];
  const kineticMax = Math.max(0, photonEnergy - workFunc);
  const stoppingU = kineticMax; // e*U0 = E_kmax -> U0 in Volts
  const canEmit = photonEnergy >= workFunc;

  const effectiveVoltage = p.voltage ?? 0;
  const netEnergy = kineticMax + effectiveVoltage;
  const photoCurrent = canEmit && netEnergy > 0 ? (p.intensity ?? 50) * Math.min(1.5, Math.sqrt(netEnergy)) * 0.4 : 0;

  return {
    photonEnergy,
    workFunc,
    kineticMax,
    stoppingU,
    photoCurrent,
    canEmit,
    metalName: metals[idx],
  };
}

export function radioactive(p, t = 0) {
  positive(p.halfLife, "Yarim yemirilish davri");
  const time = simulationTime(t);
  const n0 = p.initialN ?? 500;
  const decayFraction = Math.pow(2, -time / p.halfLife);
  const remaining = Math.round(n0 * decayFraction);
  const decayed = n0 - remaining;
  const ratio = decayFraction * 100;
  const rate = (p.activity ?? 50) * decayFraction;

  return {
    remaining,
    decayed,
    ratio,
    rate,
  };
}

export function circular(p, t = 0) {
  positive(p.radius, "Radius");
  positive(p.omega, "Burchak tezlik");
  const time = simulationTime(t);
  const v = p.omega * p.radius;
  const an = p.omega * p.omega * p.radius;
  const period = (2 * Math.PI) / p.omega;
  const freq = 1 / period;
  const angle = (p.omega * time) % (2 * Math.PI);
  const x = p.radius * Math.cos(angle);
  const y = p.radius * Math.sin(angle);

  return {
    v,
    an,
    period,
    freq,
    angle: (angle * 180) / Math.PI,
    x,
    y,
  };
}

export function gravitation(p, t = 0) {
  positive(p.altitude, "Balandlik");
  const time = simulationTime(t);
  // Planets: Earth, Moon, Mars
  const planets = [
    { name: "Yer", mass: 5.972e24, radius: 6371e3 },
    { name: "Oy", mass: 7.342e22, radius: 1737e3 },
    { name: "Mars", mass: 6.417e23, radius: 3389e3 },
  ];
  const G = 6.6743e-11;
  const idx = clamp(p.planet ?? 0, 0, 2);
  const pl = planets[idx];
  const r = pl.radius + p.altitude * 1000;
  const satMass = p.satelliteMass ?? 500;

  const gravityForce = (G * pl.mass * satMass) / (r * r);
  const orbitalSpeed = Math.sqrt((G * pl.mass) / r) / 1000; // km/s
  const orbitalPeriod = (2 * Math.PI * Math.sqrt((r * r * r) / (G * pl.mass))) / 60; // minutes
  const gAtHeight = (G * pl.mass) / (r * r);
  const omega = (orbitalSpeed * 1000) / r; // rad/s
  // Visual orbit animation angle
  const angle = (omega * time * 60) % (2 * Math.PI);

  return {
    gravityForce,
    orbitalSpeed,
    orbitalPeriod,
    gAtHeight,
    planetName: pl.name,
    angle,
    omega,
  };
}

export function hydraulic(p) {
  positive(p.f1, "Birinchi porshen kuchi");
  positive(p.s1, "Birinchi porshen yuzi");
  positive(p.s2, "Ikkinchi porshen yuzi");
  const gain = p.s2 / p.s1;
  const f2 = p.f1 * gain;
  const pressure = (p.f1 / (p.s1 * 1e-4)) / 1000; // kPa
  const liftMass = f2 / 9.8;
  const h1 = 0.1; // 10 cm small piston displacement
  const h2 = h1 / gain; // large piston displacement (m)
  const work1 = p.f1 * h1; // J
  const work2 = f2 * h2; // J, A1 = A2 by golden rule of mechanics

  return {
    f2,
    gain,
    pressure,
    liftMass,
    h1: h1 * 100, // cm
    h2: h2 * 100, // cm
    work: work1,
  };
}

export function pendulum(p, t = 0) {
  positive(p.length, "Mayatnik uzunligi");
  positive(p.mass, "Massa");
  const g = positive(p.g ?? 9.8, "Erkin tushish tezlanishi");
  const omega = Math.sqrt(g / p.length);
  const theta0Rad = ((p.angle ?? 20) * Math.PI) / 180;
  // Elliptik integralning AGM usuli katta burchakdagi davrni ham hisoblaydi.
  let agmA = 1, agmB = Math.cos(theta0Rad / 2);
  for (let i = 0; i < 12; i++) {
    const next = (agmA + agmB) / 2;
    agmB = Math.sqrt(agmA * agmB); agmA = next;
  }
  const period = TAU / (omega * agmA), frequency = 1 / period;
  const time = simulationTime(t) % period;
  const steps = Math.max(1, Math.ceil(time * omega / 0.02)), dt = time / steps;
  let thetaRad = theta0Rad, angularV = 0;
  // θ'' = −(g/l)sinθ: to‘rtinchi tartibli Runge–Kutta integratori.
  const acceleration = theta => -omega * omega * Math.sin(theta);
  for (let i = 0; i < steps; i++) {
    const k1x = angularV, k1v = acceleration(thetaRad);
    const k2x = angularV + dt * k1v / 2, k2v = acceleration(thetaRad + dt * k1x / 2);
    const k3x = angularV + dt * k2v / 2, k3v = acceleration(thetaRad + dt * k2x / 2);
    const k4x = angularV + dt * k3v, k4v = acceleration(thetaRad + dt * k3x);
    thetaRad += dt * (k1x + 2 * k2x + 2 * k3x + k4x) / 6;
    angularV += dt * (k1v + 2 * k2v + 2 * k3v + k4v) / 6;
  }
  const v = p.length * angularV;
  const maxSpeed = Math.sqrt(2 * g * p.length * (1 - Math.cos(theta0Rad)));

  const tension = p.mass * (g * Math.cos(thetaRad) + (v * v) / p.length);

  const ePotential = p.mass * g * p.length * (1 - Math.cos(thetaRad));
  const eKinetic = 0.5 * p.mass * v * v;
  const eTotal = p.mass * g * p.length * (1 - Math.cos(theta0Rad));

  return {
    period,
    frequency,
    maxSpeed,
    tension,
    theta: (thetaRad * 180) / Math.PI,
    v,
    energyKinetic: eKinetic,
    energyPotential: ePotential,
    energyTotal: eTotal,
  };
}

