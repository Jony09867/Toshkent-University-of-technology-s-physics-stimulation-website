import { format, formatResult } from "./ResultCard.js";
import { resultNames } from "../i18n/uz.js";

const resultLabel = (c, key) =>
  c.results.find((r) => r.key === key)?.label || resultNames[key] || key;

// Katalog tajribalari uchun jonli formula: parametrlar sonlarga,
// natijalar esa o‘lchov birliklari bilan qayta yoziladi.
// Har bir yozuv: (p = parametrlar, s = holat, n = format, r = natija+unit).
const catalogEquations = {
  collision: (p, s, n, r) => `m₁v₁+m₂v₂ = m₁u₁+m₂u₂ → p′ = ${r("momentumAfter")} · u₁ = ${r("u1")} · u₂ = ${r("u2")}`,
  hydraulic: (p, s, n, r) => `F₂ = F₁·S₂/S₁ → F₂ = ${r("bigForce")} · n = ${r("ratio")} · h₂ = ${r("bigLift")}`,
  pendulum: (p, s, n, r) => `T ≈ 2π√(l/g) → T = ${r("period")} (l = ${n(p.length)} m)`,
  isoProcess: (p, s, n, r) => `pV = nRT → p = ${r("pressure")} · V = ${r("volume")} · T = ${r("temperature")}`,
  firstLaw: (p, s, n, r) => `Q = ΔU + A → ${r("heat")} = ${r("internal")} + ${r("work")}`,
  heatEngine: (p, s, n, r) => `η = A/Q₁ → η = ${r("efficiency")} ≤ ${r("carnot")} · Q₁ = ${n(p.heatIn)} J = A ${r("work")} + Q₂ ${r("heatOut")}`,
  network: (p, s, n, r) => `R → I = U/R → R = ${r("total")} · I = ${r("current")} · P = ${r("power")}`,
  ampere: (p, s, n, r) => `F = BIl·sinα → F = ${r("force")} (F_max = ${r("maxForce")})`,
  lorentz: (p, s, n, r) => `F = qvB·sinα → F = ${r("force")} · R = ${r("spiralRadius")}`,
  lcr: (p, s, n, r) => `T = 2π√(LC) → T = ${r("period")} · f = ${r("frequency")}`,
  transformer: (p, s, n, r) => `ℰ = −N·dΦ/dt · U₂/U₁ = N₂/N₁ → U₂ = ${r("voltage2")} · I₁ = ${r("current1")} · I₂ = ${r("current2")} · Φₘₐₓ = ${r("fluxPeak")}`,
  refraction: (p, s, n, r) => `n₁·sinα = n₂·sinβ → β = ${r("beta")} · α_kr = ${r("critical")}`,
  interference: (p, s, n, r) => `d·sinθ = k·λ → k = ${r("order")} · Δx = ${r("fringeSpacing")} · I = ${r("intensity")}`,
  photoelectric: (p, s, n, r) => `hν = A + E_k → hν = ${r("photon")} · E_k = ${r("kinetic")}`,
  massEnergy: (p, s, n, r) => `E = mc² → E = ${r("joules")} ≈ ${r("tnt")} (TNT ekvivalenti)`,
  decay: (p, s, n, r) => `N = N₀·e^(−λt) → N = ${r("remaining")} · ${r("percent")} qoldi · A = ${r("activity")}`,
  uniform: (p, s, n, r) => `x = x₀ + v·t → x = ${r("x")} · v = ${r("v")} · yo‘l = ${r("distance")}`,
  relative: (p, s, n, r) => `v⃗ = v⃗₁ + v⃗₂ → |v| = ${r("speed")}`,
  meeting: (p, s, n, r) => `x₁ = v₁t, x₂ = d + v₂t → t = ${r("meeting")}`,
  circular: (p, s, n, r) => `aₙ = ω²R, aₜ = αR → v = ${r("velocity")} · aₙ = ${r("normal")} · aₜ = ${r("tangent")}`,
  gears: (p, s, n, r) => `R₁ω₁ = −R₂ω₂ → ω₂ = ${r("omega2")} · v = ${r("velocity")}`,
  density: (p, s, n, r) => `ρ = m/V → ρ = ${r("density")} · P = ${r("weight")}`,
  reaction: (p, s, n, r) => `F⃗₁₂ = −F⃗₂₁ → F = ${r("force")} · (−F) = ${r("reaction")}`,
  gravity: (p, s, n, r) => `g = GM/r², v = √(GM/r) → g = ${r("g")} · v = ${r("velocity")}`,
  hooke: (p, s, n, r) => `F = kx, E_p = kx²/2 → F = ${r("force")} · E_p = ${r("potential")}`,
  elevator: (p, s, n, r) => `N = m(g + a) → N = ${r("normal")} · mg = ${r("weight")}`,
  vectors: (p, s, n, r) => `F⃗ = F⃗₁ + F⃗₂ → |F| = ${r("force")} · Fx = ${r("fx")} · Fy = ${r("fy")}`,
  lever: (p, s, n, r) => `m₁g·l₁ = m₂g·l₂ → M₁ = ${r("torque1")} · M₂ = ${r("torque2")} · ΣM = ${r("net")}`,
  centerOfMass: (p, s, n, r) => `x_c = (m₁x₁ + m₂x₂)/(m₁ + m₂) = (${n(p.m1)}·${n(p.x1)} + ${n(p.m2)}·${n(p.x2)})/${n(p.m1 + p.m2)} = ${r("center")}`,
  work: (p, s, n, r) => `A = F·s·cosα, P = A/t → A = ${r("work")} · P = ${r("power")}`,
  pressure: (p, s, n, r) => `p = p₀ + ρgh → p = ${r("pressure")} · p_izh = ${r("gauge")}`,
  atmospherePressure: (p, s, n, r) => `p(h) = p₀·e^(−Mgh/RT) → p = ${r("pressure")} · h_Hg = ${r("mercuryHeight")}`,
  vessels: (p, s, n, r) => `ρ₁h₁ = ρ₂h₂ → h₂ = ${r("h2")} · p = ${r("pressure")}`,
  bernoulli: (p, s, n, r) => `p + ρv²/2 + ρgh = const → v₂ = ${r("v2")} · p₂ = ${r("pressure2")} · Q = ${r("flow")}`,
  wave: (p, s, n, r) => `v = λ·f → v = ${r("speed")} · T = ${r("period")} · y = ${r("displacement")}`,
  vapor: (p, s, n, r) => `φ = 100·p_v/p_sat → p_sat = ${r("saturation")} · φ = ${r("relative")}`,
  capillary: (p, s, n, r) => `h = 2σ·cosθ/(ρgr) → h = ${r("height")} · F = ${r("force")}`,
  elastic: (p, s, n, r) => `σ = F/S, ε = σ/E → σ = ${r("stress")} · ε = ${r("strain")} · Δl = ${r("extension")}`,
  expansion: (p, s, n, r) => `Δl = α·l₀·ΔT → Δl = ${r("delta")} · l = ${r("length2")}`,
  calorimetry: (p, s, n, r) => `Q = m·c·ΔT → Q = ${r("heat")} · T = ${r("temperature2")}`,
  adiabatic: (p, s, n, r) => `pVᵞ = const → p = ${r("pressure")} · T = ${r("temperature")} · A = ${r("work")}`,
  chargeTransfer: (p, s, n, r) => `q₁ + q₂ = const → q₁ = ${r("q1")} · q₂ = ${r("q2")} · jami = ${r("total")}`,
  field: (p, s, n, r) => `E = kq/r², φ = kq/r → E = ${r("field")} · φ = ${r("potential")}`,
  sphere: (p, s, n, r) => `E_shar = kq/r² → E = ${r("field")} · φ = ${r("potential")}`,
  fieldWork: (p, s, n, r) => `A = q·E·d, U = E·d → A = ${r("work")} · U = ${r("voltage")} · F = ${r("force")}`,
  capacitor: (p, s, n, r) => `C = ε₀ε_r·S/d, W = C·U²/2 → C = ${r("capacitance")} · Q = ${r("charge")} · W = ${r("energy")}`,
  capacitorNetwork: (p, s, n, r) => `C_par = C₁+C₂, C_ket = C₁C₂/(C₁+C₂) → C = ${r("capacitance")} · Q = ${r("charge")}`,
  current: (p, s, n, r) => `I = Δq/Δt → I = ${r("current")} · o‘tgan zaryad = ${r("passed")}`,
  joule: (p, s, n, r) => `P = U²/R, Q = P·t → P = ${r("power")} · Q = ${r("heat")} · I = ${r("current")}`,
  meter: (p, s, n, r) => `R_sh = R_m/(n−1), R_q = R_m·(n−1) → R_sh = ${r("shunt")} · R_q = ${r("series")}`,
  batteries: (p, s, n, r) => `I = ε_eq/(R + r_eq) → I = ${r("current")} · U = ${r("voltage")}`,
  metal: (p, s, n, r) => `R = R₀(1 + α·ΔT) → R = ${r("resistance")} · I = ${r("current")}`,
  diode: (p, s, n, r) => `I = I_s·(e^(qU/nkT) − 1) → I = ${r("current")}`,
  thermionic: (p, s, n, r) => `j = A·T²·e^(−W/kT) = ${r("density")} · Q/S = j·t = ${r("charge")}`,
  electrolysis: (p, s, n, r) => `m = M·I·t/(z·F) → m = ${r("mass")} · q = ${r("charge")}`,
  discharge: (p, s, n, r) => `E = U/d = ${r("field")} · U_kr ≈ ${r("thresholdVoltage")} · ${s.breakdown ? "razryad bor" : "razryad yo‘q"}`,
  magnetic: (p, s, n, r) => `B = μ₀I/(2πr) → B = ${r("field")} · Φ = ${r("flux")}`,
  magneticMaterial: (p, s, n, r) => `B = μ₀μ_r·H → B = ${r("field")} · M = ${r("magnetization")}`,
  flux: (p, s, n, r) => `Φ = B·S·cosα → Φ = ${r("flux")}`,
  rl: (p, s, n, r) => `I = U/R·(1 − e^(−Rt/L)), W = LI²/2 → I = ${r("current")} · W = ${r("energy")}`,
  generator: (p, s, n, r) => `ε = N·B·S·ω·sin(ωt) → ε = ${r("emf")} · Φ = ${r("flux")}`,
  ac: (p, s, n, r) => `Z = √(R² + (X_L − X_C)²) → Z = ${r("impedance")} · I = ${r("current")} · P = ${r("power")}`,
  emwave: (p, s, n, r) => `c = λ·f, d = c·Δt/2 → λ = ${r("wavelength")} · Δt = ${r("delay")}`,
  reflection: (p, s, n, r) => `α = β → tushish = ${r("incident")} · qaytish = ${r("reflected")}`,
  instrument: (p, s, n, r) => `M = D/f, |M_tel| = f_obj/f_ok → M = ${r("magnification")} · L = ${r("length")}`,
  diffraction: (p, s, n, r) => `u = πa·sinθ/λ → I/I₀ = ${r("intensity")} · birinchi minimum = ${r("firstMin")}`,
  polarization: (p, s, n, r) => `I = I₀·cos²θ → I = ${r("intensity")} · cos²θ = ${r("fraction")}`,
  relativity: (p, s, n, r) => `γ = 1/√(1 − v²/c²) → γ = ${r("gamma")} · t = ${r("time")} · l = ${r("length")}`,
  photon: (p, s, n, r) => `E = h·f = hc/λ, p = h/λ → E = ${r("energy")} · f = ${r("frequency")}`,
  xray: (p, s, n, r) => `Eₑ = eU · λ_min = hc/(eU) → Eₑ(t) = ${r("electronKineticEnergy")} · Eγ,max = ${r("energy")} · λmin = ${r("wavelength")} · P_dasta = ${r("beamPower")}`,
  bohr: (p, s, n, r) => `E_n = −13,6·Z²/n² → E = ${r("energy")} · r = ${r("radius")} · λ = ${r("wavelength")}`,
  binding: (p, s, n, r) => `E_b = Δm·c² → E_b = ${r("energy")} · bir nukonga = ${r("perNucleon")}`,
  rutherford: (p, s, n, r) => `Kulon: θ = ${r("angle")} · rₘᵢₙ = ${r("closest")} · vodorod: n=${p.upper}→2, λ = ${r("wavelength")}`,
  nucleusRadioactivity: (p, s, n, r) => `E_b = Δm·c² = ${r("energy")} · N(t) = N₀·2^(−t/T½) = ${r("remaining")} · ${r("percent")} qolgan`,
  bohrSpectra: (p, s, n, r) => `E_n = −13.6057·Z²/n² · |ΔE| = ${r("transition")} · λ = hc/|ΔE| = ${r("wavelength")} · ${p.absorption === 1 ? "yutilish" : "emissiya"}`,
};



// Asl 15 ta tajriba: App.js’dan ko‘chirilgan jonli formulalar (vaqt va
// qo‘shimcha shartlarga bog‘liq, shuning uchun alohida xaritada).
const baseEquations = {
  motion: (p, s, n, r, t) => `x = ${n(p.x0)} + ${n(p.v0)}·${n(t)} + ½·${n(p.a)}·${n(t)}² = ${n(s.x)} m`,
  fall: (p, s, n, r, t) =>
    p.drag > 0
      ? `b/m = ${n(p.drag / p.m)} s⁻¹ · x = ${n(s.x)} m · y = ${n(s.y)} m`
      : `x = v₀t = ${n(p.v0)}·${n(t)} = ${n(s.x)} m`,
  newton: (p, s, n, r) => `a = Fₙₑₜ/m = ${n(s.net)}/${n(p.m)} = ${n(s.a)} m/s²`,
  friction: (p, s, n, r) => `Fᵢ = μN = ${n(p.mu)}·${n(p.normal)} = ${n(s.maxFriction)} N`,
  projectile: (p, s, n, r) =>
    p.drag > 0
      ? `b/m = ${n(p.drag / p.m)} s⁻¹ · x = ${n(s.x)} m · y = ${n(s.y)} m`
      : `x(t) = v₀ cos(α)t = ${n(s.x)} m · y(t) = ${n(s.y)} m`,
  energy: (p, s, n, r) =>
    `Eₖ + Eₚ${p.friction ? " + Q" : ""} = ${n(s.kinetic)} + ${n(s.potential)}${p.friction ? ` + ${n(s.heat)}` : ""} = ${n(s.initial)} J`,
  spring: (p, s, n, r) =>
    p.damping > 0
      ? `ωd = √(k/m − β²) = ${n(s.omega)} rad/s · T = ${n(s.period)} s`
      : `T = 2π√(m/k) = 2π√(${n(p.m)}/${n(p.k)}) = ${n(s.period)} s`,
  resonance: (p, s, n, r) => `A(ω = ${n(p.frequency)}) = ${n(s.amplitude)} m`,
  buoyancy: (p, s, n, r) => `Fₐ = ρgV = ${n(s.force)} N · mg = ${n(s.weight)} N`,
  gas: (p, s, n, r) => `p = nRT/V = ${n(s.pressure * 0.001)} kPa`,
  coulomb: (p, s, n, r) => `|F| = k|q₁q₂|/r² = ${n(s.force)} N`,
  ohm: (p, s, n, r) => `I = U/R = ${n(p.voltage)}/${n(p.resistance)} = ${n(s.current)} A`,
  circuit: (p, s, n, r) => `I = ε/(R+r) = ${n(p.emf)}/(${n(p.resistance)}+${n(p.internal)}) = ${n(s.current)} A`,
  induction: (p, s, n, r) => `ε(t) = −N·dΦ/dt = ${n(s.emf)} V`,
  lens: (p, s, n, r) => `1/F = 1/d + 1/f → f = ${n(s.image)} m`,
};


export function liveEquation(c, p, state, t = 0) {
  const n = (value) => format(value);
  const r = (key) => {
    const def = c.results.find((x) => x.key === key);
    const shown = def ? formatResult(def, state[key]) : format(state[key]);
    return def?.unit && shown !== "—" ? `${shown} ${def.unit}` : shown;
  };
  if (c.visual === "nuclearFusion")
    return `D + T → ⁴He + n · A: ${state.beforeA} = ${state.afterA} · Z: ${state.beforeZ} = ${state.afterZ} · Q = ${r("perReaction")} · ${p.pairs} juftlik → ${r("energy")}`;
  if (c.visual === "waterVapor")
    return `T = ${n(p.temperature)} K · p_sat = ${r("saturation")}${state.critical ? " · Kritik nuqta" : ""}`;
  if (c.visual === "photoelectric")
    return `hν = A + Eₖ,max → hν = ${r("photonEnergy")} · A = ${n(p.work)} eV · Eₖ,max = ${r("kinetic")} · ${state.photonEnergy === null ? "parametr xatosi" : !state.aboveThreshold ? "qizil chegara: emissiya yo‘q" : !state.emits ? "yorug‘lik yo‘q: emissiya yo‘q" : "elektron chiqdi"}`;
  if (c.visual === "airHumidity")
    return `Jami suv = ${n(p.waterContent)} g/m³ · Bug‘ = ${r("vaporMass")} · Tomchi = ${r("condensate")} · φ = ${r("relative")}`;
  if (c.visual === "lampCircuit")
    return `P₁ = U₁I₁ = ${r("p1")} · P₂ = U₂I₂ = ${r("p2")} · P₁+P₂ = ${r("power")} W`;
  if (c.visual === "batteryCircuit")
    return `ε_eq = ${r("emf")} · r_eq = ${r("internal")} · I = ε_eq/(R+r_eq) = ${r("current")} · U_R = ${r("voltage")}`;
  const build = baseEquations[c.key] || catalogEquations[c.key];
  if (build) return build(p, state, n, r, t);
  return c.results
    .slice(0, 3)
    .map(
      (item) =>
        `${resultLabel(c, item.key)} = ${formatResult(item, state[item.key])}${state[item.key] === null ? "" : " " + item.unit}`,
    )
    .join(" · ");
}
