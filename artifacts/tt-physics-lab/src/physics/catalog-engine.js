import {
  G,
  GAS,
  COULOMB,
  LIGHT,
  PLANCK,
  ELEMENTARY,
  MU0,
} from "./constants.js";

const rad = (d) => (d * Math.PI) / 180;
const sec = (t) => (Number.isFinite(t) ? Math.max(0, t) : 0);
const kb = 1.380649e-23;
const eps0 = 1 / (4 * Math.PI * COULOMB);
const grav = 6.6743e-11;

// Parametrlar interfeys birliklaridan SI ga har bir model ichida o‘tkaziladi.
export const models = {
  uniform: (p, t = 0) => ({
    x: p.x0 + p.v0 * sec(t),
    v: p.v0,
    distance: Math.abs(p.v0) * sec(t),
  }),
  relative: (p, t = 0) => ({
    x: p.v1 * sec(t),
    y: p.v2 * sec(t),
    speed: Math.hypot(p.v1, p.v2),
    angle: (Math.atan2(p.v2, p.v1) * 180) / Math.PI,
  }),
  meeting: (p, t = 0) => ({
    x1: p.v1 * sec(t),
    x2: p.gap + p.v2 * sec(t),
    gap: p.gap + (p.v2 - p.v1) * sec(t),
    meeting:
      p.v1 !== p.v2 && p.gap / (p.v1 - p.v2) >= 0
        ? p.gap / (p.v1 - p.v2)
        : null,
  }),
  circular: (p, t = 0) => {
    const w = p.omega + p.alpha * sec(t),
      a = p.omega * sec(t) + (p.alpha * sec(t) ** 2) / 2;
    return {
      x: p.radius * Math.cos(a),
      y: p.radius * Math.sin(a),
      angle: a,
      velocity: w * p.radius,
      normal: w * w * p.radius,
      tangent: p.alpha * p.radius,
      omega: w,
    };
  },
  gears: (p, t = 0) => ({
    omega2: (-p.omega * p.r1) / p.r2,
    velocity: p.omega * p.r1,
    angle: p.omega * sec(t),
    angle2: ((-p.omega * p.r1) / p.r2) * sec(t),
  }),
  density: (p) => ({ density: p.m / (p.volume / 1000), weight: p.m * G }),
  reaction: (p) => ({
    force: p.force,
    reaction: -p.force,
    a1: p.force / p.m1,
    a2: -p.force / p.m2,
  }),
  gravity: (p, t = 0) => {
    const r = (6371 + p.altitude) * 1000,
      M = 5.9722e24,
      g = (grav * M) / r ** 2,
      v = Math.sqrt((grav * M) / r),
      w = v / r;
    return {
      g,
      force: p.m * g,
      velocity: v,
      period: (2 * Math.PI) / w,
      angle: sec(t) * w,
    };
  },
  hooke: (p) => ({
    force: p.k * p.extension,
    potential: (p.k * p.extension ** 2) / 2,
  }),
  elevator: (p, t = 0) => ({
    normal: Math.max(0, p.m * (G + p.a)),
    weight: p.m * G,
    y: (p.a * sec(t) ** 2) / 2,
    velocity: p.a * sec(t),
  }),
  vectors: (p, t = 0) => {
    const x = p.f1 + p.f2 * Math.cos(rad(p.angle)),
      y = p.f2 * Math.sin(rad(p.angle));
    return {
      fx: x,
      fy: y,
      force: Math.hypot(x, y),
      direction: (Math.atan2(y, x) * 180) / Math.PI,
      ax: x / p.m,
      ay: y / p.m,
      x: ((x / p.m) * sec(t) ** 2) / 2,
      y: ((y / p.m) * sec(t) ** 2) / 2,
    };
  },
  lever: (p) => ({
    torque1: p.m1 * G * p.arm1,
    torque2: p.m2 * G * p.arm2,
    net: p.m1 * G * p.arm1 - p.m2 * G * p.arm2,
    center: (-p.m1 * p.arm1 + p.m2 * p.arm2) / (p.m1 + p.m2),
  }),
  work: (p) => {
    const work = p.force * p.distance * Math.cos(rad(p.angle));
    return {
      work,
      power: work / p.interval,
      useful: (work * p.efficiency) / 100,
    };
  },
  pressure: (p) => ({
    pressure: p.atmosphere * 1000 + p.rho * G * p.h,
    gauge: p.rho * G * p.h,
  }),
  vessels: (p) => ({ h2: (p.rho1 * p.h) / p.rho2, pressure: p.rho1 * G * p.h }),
  bernoulli: (p) => {
    const v2 = (p.velocity * p.area1) / p.area2,
      pressure2 =
        p.pressure * 1000 +
        (p.rho * (p.velocity ** 2 - v2 ** 2)) / 2 +
        p.rho * G * (p.h1 - p.h2);
    return {
      v2,
      pressure2: pressure2 > 0 ? pressure2 : null,
      flow: p.area1 * 1e-4 * p.velocity,
      warning:
        pressure2 <= 0
          ? "Bosim nolga tushdi: uzluksiz suyuqlik modeli bu holatda yaroqsiz."
          : "",
    };
  },
  wave: (p, t = 0) => ({
    displacement:
      p.amplitude *
      Math.sin(
        2 * Math.PI * (p.frequency * sec(t) - p.position / p.wavelength),
      ),
    speed: p.frequency * p.wavelength,
    period: 1 / p.frequency,
    phase: 2 * Math.PI * p.frequency * sec(t),
  }),
  vapor: (p) => {
    const c = p.temperature - 273.15,
      ps = 133.322 * 10 ** (8.07131 - 1730.63 / (233.426 + c));
    return {
      saturation: ps,
      relative: (100 * p.vapor * 1000) / ps,
      warning:
        p.vapor * 1000 > ps
          ? "To‘yinishdan yuqori: ortiqcha bug‘ kondensatsiyalanadi."
          : "",
    };
  },
  capillary: (p) => ({
    height:
      (2 * p.tension * Math.cos(rad(p.angle))) /
      ((p.rho * G * p.radius) / 1000),
    force:
      ((2 * Math.PI * p.radius) / 1000) * p.tension * Math.cos(rad(p.angle)),
  }),
  elastic: (p) => {
    const stress = p.force / (p.area * 1e-6),
      strain = stress / (p.young * 1e9);
    return { stress, strain, extension: strain * p.length };
  },
  expansion: (p) => ({
    delta: p.alpha * 1e-6 * p.length * p.deltaT,
    length2: p.length * (1 + p.alpha * 1e-6 * p.deltaT),
  }),
  calorimetry: (p) => ({
    heat: p.m * p.capacity * p.deltaT,
    temperature2: p.temperature + p.deltaT,
  }),
  adiabatic: (p, t = 0) => {
    const V = p.volume * (1 + sec(t) / 10),
      T = p.temperature * (p.volume / V) ** (p.gamma - 1),
      P = (p.moles * GAS * T) / (V / 1000);
    return {
      volume: V,
      temperature: T,
      pressure: P,
      work: (p.moles * GAS * (p.temperature - T)) / (p.gamma - 1),
      internal: (p.moles * GAS * T) / (p.gamma - 1),
    };
  },
  chargeTransfer: (p) => ({
    q1: p.q1 - p.transfer,
    q2: p.q2 + p.transfer,
    total: p.q1 + p.q2,
  }),
  field: (p) => ({
    field: (COULOMB * p.charge * 1e-6) / p.radius ** 2,
    potential: (COULOMB * p.charge * 1e-6) / p.radius,
    work: (p.testCharge * 1e-6 * COULOMB * p.charge * 1e-6) / p.radius,
  }),
  sphere: (p) => {
    if (p.mode === 1) {
      const field = (p.surfaceCharge * 1e-9) / (2 * eps0);
      return { field, potential: -field * p.distance };
    }
    const r = Math.max(p.radius, p.distance);
    return {
      field: p.distance < p.radius ? 0 : (COULOMB * p.charge * 1e-6) / r ** 2,
      potential: (COULOMB * p.charge * 1e-6) / r,
    };
  },
  fieldWork: (p) => ({
    voltage: p.field * p.distance,
    force: p.charge * 1e-6 * p.field,
    work: p.charge * 1e-6 * p.field * p.distance,
  }),
  capacitor: (p) => {
    const C = (eps0 * p.dielectric * (p.area / 10000)) / (p.gap / 1000);
    return {
      capacitance: C,
      charge: C * p.voltage,
      energy: (C * p.voltage ** 2) / 2,
      field: p.voltage / (p.gap / 1000),
    };
  },
  capacitorNetwork: (p) => {
    const C =
      (p.mode === 0 ? p.c1 + p.c2 : (p.c1 * p.c2) / (p.c1 + p.c2)) * 1e-6;
    return {
      capacitance: C,
      charge: C * p.voltage,
      energy: (C * p.voltage ** 2) / 2,
    };
  },
  current: (p, t = 0) => ({
    current: p.charge / p.interval,
    passed: (p.charge / p.interval) * sec(t),
  }),
  joule: (p, t = 0) => ({
    power: p.voltage ** 2 / p.resistance,
    current: p.voltage / p.resistance,
    heat: (p.voltage ** 2 / p.resistance) * sec(t),
  }),
  meter: (p) => ({
    shunt: p.meterResistance / (p.factor - 1),
    series: p.meterResistance * (p.factor - 1),
    currentLimit: p.current * p.factor,
  }),
  batteries: (p) => {
    const E = p.mode === 0 ? p.emf * p.count : p.emf,
      r = p.mode === 0 ? p.internal * p.count : p.internal / p.count,
      I = E / (p.resistance + r);
    return { emf: E, internal: r, current: I, voltage: I * p.resistance };
  },
  metal: (p) => {
    const R = p.r0 * (1 + p.alpha * 1e-3 * p.deltaT);
    return { resistance: R, current: p.voltage / R };
  },
  diode: (p) => {
    const a = (ELEMENTARY * p.voltage) / (p.ideality * kb * p.temperature),
      I = p.saturation * 1e-9 * Math.expm1(a);
    return {
      current: I,
      warning:
        a > 20
          ? "Ideal diod modeli: katta tokda ketma-ket qarshilik ham hisobga olinishi kerak."
          : "",
    };
  },
  thermionic: (p) => ({
    density:
      1.2e6 *
      p.temperature ** 2 *
      Math.exp((-p.work * ELEMENTARY) / (kb * p.temperature)),
  }),
  electrolysis: (p, t = 0) => ({
    mass:
      ((p.molarMass / 1000) * p.current * sec(t)) / (p.valence * 96485.33212),
    charge: p.current * sec(t),
  }),
  discharge: (p) => {
    const E = (p.voltage * 1000) / (p.gap / 1000);
    return {
      field: E,
      breakdown: E >= 3e6 ? 1 : 0,
      warning: E >= 3e6 ? "Havoning taxminiy teshilish chegarasi oshdi." : "",
    };
  },
  magnetic: (p) => ({
    field: (MU0 * p.current) / ((2 * Math.PI * p.radius) / 100),
    flux:
      (((MU0 * p.current) / ((2 * Math.PI * p.radius) / 100)) * p.area) / 10000,
  }),
  magneticMaterial: (p) => ({
    field: MU0 * p.relative * p.h,
    magnetization: (p.relative - 1) * p.h,
  }),
  flux: (p) => ({
    flux: ((p.field * p.area) / 10000) * Math.cos(rad(p.angle)),
  }),
  rl: (p, t = 0) => {
    const L = p.inductance / 1000,
      tau = L / p.resistance,
      I = (p.voltage / p.resistance) * (1 - Math.exp(-sec(t) / tau));
    return {
      current: I,
      energy: (L * I ** 2) / 2,
      emf: -p.voltage * Math.exp(-sec(t) / tau),
      tau,
    };
  },
  generator: (p, t = 0) => {
    const omega = 2 * Math.PI * p.frequency,
      phase = omega * sec(t);
    return {
      emf: ((p.turns * p.field * p.area) / 10000) * omega * Math.sin(phase),
      flux: ((p.field * p.area) / 10000) * Math.cos(phase),
      phase,
    };
  },
  ac: (p, t = 0) => {
    const w = 2 * Math.PI * p.frequency,
      Xl = p.mode === 1 || p.mode === 0 ? 0 : (w * p.inductance) / 1000,
      Xc = p.mode === 2 || p.mode === 0 ? 0 : 1 / (w * p.capacitance * 1e-6),
      R = p.mode === 1 || p.mode === 2 ? 0 : p.resistance,
      Z = Math.hypot(R, Xl - Xc),
      phase = Math.atan2(Xl - Xc, R);
    if (Z < 1e-9)
      return {
        impedance: 0,
        current: null,
        voltage: p.voltage * Math.SQRT2 * Math.sin(w * sec(t)),
        power: null,
        phase,
        warning:
          "Ideal zanjirda impedans nol: cheksiz tok o‘rniga model chegarasi ko‘rsatiladi.",
      };
    const Irms = p.voltage / Z;
    return {
      impedance: Z,
      current: Irms * Math.SQRT2 * Math.sin(w * sec(t) - phase),
      rms: Irms,
      voltage: p.voltage * Math.SQRT2 * Math.sin(w * sec(t)),
      power: Irms ** 2 * R,
      phase,
    };
  },
  emwave: (p, t = 0) => ({
    wavelength: LIGHT / (p.frequency * 1e6),
    delay: (2 * p.distance * 1000) / LIGHT,
    phase: sec(t) * 2 * Math.PI,
    field: p.amplitude * Math.sin(sec(t) * 2 * Math.PI),
  }),
  reflection: (p) => ({ incident: p.angle, reflected: p.angle }),
  instrument: (p) => ({
    magnification: p.mode === 0 ? 0.25 / p.eyepiece : p.objective / p.eyepiece,
    length: p.mode === 0 ? p.eyepiece : p.objective + p.eyepiece,
  }),
  diffraction: (p) => {
    const theta = rad(p.angle),
      u = (Math.PI * p.width * 1e-6 * Math.sin(theta)) / (p.wavelength * 1e-9);
    return {
      intensity: Math.abs(u) < 1e-9 ? 1 : (Math.sin(u) / u) ** 2,
      firstMin:
        p.wavelength * 1e-9 <= p.width * 1e-6
          ? (Math.asin((p.wavelength * 1e-9) / (p.width * 1e-6)) * 180) /
            Math.PI
          : null,
    };
  },
  polarization: (p) => ({
    intensity: p.intensity * Math.cos(rad(p.angle)) ** 2,
    fraction: Math.cos(rad(p.angle)) ** 2,
  }),
  relativity: (p) => {
    const gamma = 1 / Math.sqrt(1 - p.beta ** 2);
    return {
      gamma,
      time: p.interval * gamma,
      length: p.length / gamma,
      kinetic: (gamma - 1) * p.m * LIGHT ** 2,
    };
  },
  photon: (p) => ({
    energy: (PLANCK * LIGHT) / (p.wavelength * 1e-9),
    frequency: LIGHT / (p.wavelength * 1e-9),
    momentum: PLANCK / (p.wavelength * 1e-9),
  }),
  xray: (p) => ({
    wavelength: (PLANCK * LIGHT) / (ELEMENTARY * p.voltage * 1000),
    energy: ELEMENTARY * p.voltage * 1000,
  }),
  bohr: (p) => {
    const n = Math.round(p.n),
      low = Math.round(p.lower),
      E = (-13.605693 * p.z ** 2) / n ** 2,
      transition = 13.605693 * p.z ** 2 * (1 / low ** 2 - 1 / n ** 2);
    return {
      energy: E,
      radius: (5.29177210903e-11 * n ** 2) / p.z,
      wavelength:
        transition > 0 ? (PLANCK * LIGHT) / (transition * ELEMENTARY) : null,
      transition: Math.max(0, transition),
      warning:
        n <= low
          ? "Yuqori sath quyi sathdan katta bo‘lganda foton chiqariladi."
          : "",
    };
  },
  binding: (p) => ({
    energy: p.defect * 931.49410242,
    perNucleon: (p.defect * 931.49410242) / p.nucleons,
    mass: p.nucleons - p.defect,
  }),
  rutherford: (p) => {
    const E = p.energy * 1e6 * ELEMENTARY,
      b = p.impact * 1e-15,
      a = (COULOMB * 2 * p.z * ELEMENTARY ** 2) / (2 * E);
    return {
      angle: (2 * Math.atan2(a, b) * 180) / Math.PI,
      closest: a + Math.hypot(a, b),
      headOn: 2 * a,
    };
  },
};

// To‘qnashuv impulsi nisbiy tezlikdan olinadi; issiqlik yo‘qolgan energiyadir.
models.collision = (p, t = 0) => {
  const e = p.restitution,
    J = (((1 + e) * p.m1 * p.m2) / (p.m1 + p.m2)) * (p.v1 - p.v2),
    u1 = p.v1 - J / p.m1,
    u2 = p.v2 + J / p.m2;
  const before = (p.m1 * p.v1 ** 2) / 2 + (p.m2 * p.v2 ** 2) / 2,
    after = (p.m1 * u1 ** 2) / 2 + (p.m2 * u2 ** 2) / 2,
    time = sec(t),
    hit = time >= 2;
  return {
    u1,
    u2,
    impulse: J,
    momentumAfter: p.m1 * u1 + p.m2 * u2,
    momentumBefore: p.m1 * p.v1 + p.m2 * p.v2,
    kineticBefore: before,
    kineticAfter: after,
    lost: Math.max(0, before - after),
    x1: hit ? 2 * p.v1 + u1 * (time - 2) : p.v1 * time,
    x2: hit ? 2 * p.v1 + u2 * (time - 2) : 2 * (p.v1 - p.v2) + p.v2 * time,
    kinetic: hit ? after : before,
    heat: hit ? Math.max(0, before - after) : 0,
  };
};
models.hydraulic = (p) => {
  const ratio = p.s2 / p.s1,
    l = p.lift / 100;
  return {
    ratio,
    bigForce: p.force * ratio,
    bigLift: l / ratio,
    pressure: p.force / (p.s1 / 10000),
    workIn: p.force * l,
    workOut: p.force * l,
  };
};
// RK4 mayatnik tenglamasini sin(theta) bilan integrallaydi; katta burchakda ham ishlaydi.
models.pendulum = (p, t = 0) => {
  const a = rad(p.amplitude),
    time = Math.min(sec(t), 120),
    steps = Math.ceil(time / 0.005),
    dt = steps ? time / steps : 0;
  let q = a,
    w = 0;
  const acc = (x, v) => (-G / p.length) * Math.sin(x) - 2 * p.damping * v;
  for (let i = 0; i < steps; i++) {
    const k1 = acc(q, w),
      q2 = q + (w * dt) / 2,
      w2 = w + (k1 * dt) / 2,
      k2 = acc(q2, w2),
      q3 = q + (w2 * dt) / 2,
      w3 = w + (k2 * dt) / 2,
      k3 = acc(q3, w3),
      q4 = q + w3 * dt,
      w4 = w + k3 * dt,
      k4 = acc(q4, w4);
    q += (dt * (w + 2 * w2 + 2 * w3 + w4)) / 6;
    w += (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
  }
  const potential = G * p.length * (1 - Math.cos(q)),
    kinetic = (p.length ** 2 * w * w) / 2,
    initial = G * p.length * (1 - Math.cos(a));
  return {
    theta: q,
    degrees: (q * 180) / Math.PI,
    velocity: p.length * w,
    height: p.length * (1 - Math.cos(q)),
    period:
      2 *
      Math.PI *
      Math.sqrt(p.length / G) *
      (1 + (a * a) / 16 + (11 * a ** 4) / 3072),
    energy: potential + kinetic,
    kinetic,
    potential,
    heat: Math.max(0, initial - potential - kinetic),
    initial,
  };
};
models.firstLaw = (p) => {
  const internal = 1.5 * p.moles * GAS * p.deltaT,
    T = p.temperature + p.deltaT;
  return {
    heat: internal + p.work,
    internal,
    work: p.work,
    temperature2: T,
    warning:
      T <= 0
        ? "Harorat 0 K yoki undan past: fizik jihatdan yaroqsiz holat."
        : "",
  };
};
models.heatEngine = (p) => {
  const limit = 1 - p.cold / p.hot,
    valid = p.hot > p.cold && p.efficiency <= limit;
  return {
    carnot: Math.max(0, limit) * 100,
    efficiency: p.efficiency * 100,
    work: valid ? p.heatIn * p.efficiency : null,
    heatOut: valid ? p.heatIn * (1 - p.efficiency) : null,
    warning: !valid
      ? "Termodinamikaning II qonuni: Tissiq > Tsovuq va η ≤ 1 − Tsovuq/Tissiq bo‘lishi kerak."
      : "",
  };
};
models.lorentz = (p, t = 0) => {
  const q = p.charge * ELEMENTARY,
    m = p.mass * 1.6605390666e-27,
    alpha = rad(p.angle),
    B = p.field,
    vp = p.velocity * Math.sin(alpha),
    parallel = p.velocity * Math.cos(alpha),
    omega = (q * B) / m;
  return {
    force: q * p.velocity * B * Math.sin(alpha),
    spiralRadius: B > 0 ? Math.abs((m * vp) / (q * B)) : null,
    helixPitch: B > 0 ? (2 * Math.PI * parallel) / Math.abs(omega) : null,
    angle: p.angle,
    phase: omega * sec(t),
    x:
      B > 0
        ? ((m * vp) / (q * B)) * Math.sin(omega * sec(t))
        : p.velocity * sec(t),
    y: B > 0 ? ((m * vp) / (q * B)) * (1 - Math.cos(omega * sec(t))) : 0,
  };
};
models.lcr = (p, t = 0) => {
  const L = p.inductance * 1e-3,
    C = p.capacitance * 1e-6,
    Q = p.charge * 1e-3,
    w = 1 / Math.sqrt(L * C),
    q = Q * Math.cos(w * sec(t)),
    i = -Q * w * Math.sin(w * sec(t));
  return {
    charge: q,
    current: i,
    period: (2 * Math.PI) / w,
    frequency: w / (2 * Math.PI),
    energyCap: (q * q) / (2 * C),
    energyInd: (L * i * i) / 2,
    total: (Q * Q) / (2 * C),
    phase: w * sec(t),
  };
};
