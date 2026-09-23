import test from "node:test";
import assert from "node:assert/strict";
import * as f from "../src/physics/engine.js";
import { allConfigs, defaults } from "../src/data/configs.js";
import { readFile } from "node:fs/promises";
const near = (actual, expected, epsilon = 1e-6) =>
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `${actual} ≠ ${expected} ±${epsilon}`,
  );
test("Motion: known displacement and velocity", () => {
  const r = f.motion({ x0: 3, v0: 4, a: 2 }, 3);
  near(r.x, 24);
  near(r.v, 10);
});
test("Motion: braking ends at rest without reversing", () => {
  const r = f.motion({ x0: 0, v0: 10, a: -2 }, 10);
  near(r.x, 25);
  near(r.v, 0);
  near(r.a, 0);
});
test("Motion: zero acceleration and negative origin", () => {
  near(f.motion({ x0: -3, v0: 2, a: 0 }, 4).x, 5);
});
test("Horizontal launch: 20 m fall takes 2.020305 seconds", () => {
  const r = f.projectile({ h: 20, v0: 10, g: 9.8 });
  near(r.duration, 2.020305089);
  near(r.range, 20.20305089);
});
test("Horizontal launch: velocity does not alter landing time", () => {
  near(
    f.projectile({ h: 20, v0: 0 }).duration,
    f.projectile({ h: 20, v0: 20 }).duration,
  );
});
test("Horizontal launch: stops on ground", () => {
  const r = f.projectile({ h: 20, v0: 10 }, 100);
  near(r.y, 0);
  near(r.x, r.range);
});
test("Newton: 20 N / 5 kg = 4 m/s²", () => {
  near(f.newton({ force: 20, m: 5 }, 2).a, 4);
  near(f.newton({ force: 20, m: 5 }, 2).x, 8);
});
test("Newton: friction balance holds a stationary body", () => {
  near(f.newton({ force: 2, m: 5, mu: 0.2 }).a, 0);
});
test("Newton: inclined frictionless acceleration", () => {
  near(f.newton({ force: 0, m: 5, mu: 0, slope: 30 }).a, -4.9);
});
test("Friction: known braking force and distance", () => {
  const r = f.friction({ m: 5, normal: 49, mu: 0.2, v0: 8 });
  near(r.f, 9.8);
  near(r.distance, 64 / 3.92);
});
test("Friction: zero coefficient does not stop body", () => {
  const r = f.friction({ m: 5, normal: 49, mu: 0, v0: 8 }, 10);
  near(r.x, 80);
  assert.equal(r.stop, Infinity);
});
test("Friction: after stopping velocity stays zero", () => {
  const r = f.friction({ m: 5, normal: 49, mu: 0.2, v0: 8 }, 100);
  near(r.v, 0);
  near(r.x, r.distance);
});
test("Angled launch: 45 degrees known range and height", () => {
  const r = f.projectile({ h: 0, v0: 20, angle: 45, g: 9.8 });
  near(r.range, 400 / 9.8);
  near(r.height, 400 / 39.2);
});
test("Angled launch: complementary angles have equal range at same level", () =>
  near(
    f.projectile({ h: 0, v0: 20, angle: 30 }).range,
    f.projectile({ h: 0, v0: 20, angle: 60 }).range,
  ));
test("Angled launch: vertical and zero angle boundary", () => {
  near(f.projectile({ h: 0, v0: 20, angle: 90 }).range, 0);
  near(f.projectile({ h: 0, v0: 20, angle: 0 }).duration, 0);
});
test("Track energy: initial potential mgh", () => {
  const r = f.energy({ m: 2, h: 3 }, 0);
  near(r.potential, 58.8);
  near(r.kinetic, 0);
});
test("Track energy: actual curved-track speed conserves energy", () => {
  for (let t = 0; t <= 25; t += 0.5) {
    const r = f.energy({ m: 3, h: 4 }, t);
    near(r.total, r.initial, 0.00002);
  }
});
test("Track energy: friction generates heat without destroying total energy", () => {
  const a = f.energy({ m: 2, h: 3, friction: true }, 5),
    b = f.energy({ m: 2, h: 3, friction: true }, 15);
  assert.ok(b.total < a.total);
  near(b.total + b.heat, b.initial);
});
test("Spring: known period", () =>
  near(f.spring({ m: 1, k: 4 }).period, Math.PI));
test("Spring: mass scaling", () =>
  near(f.spring({ m: 4, k: 4 }).period, 2 * f.spring({ m: 1, k: 4 }).period));
test("Spring: quarter period zero displacement and energy constant", () => {
  const p = { m: 1, k: 4, amplitude: 0.5 },
    a = f.spring(p),
    r = f.spring(p, a.period / 4);
  near(r.x, 0);
  near(r.v, -1);
  near(r.energy, 0.5);
});
test("Resonance: damped amplitude finite at natural frequency", () =>
  near(
    f.resonance({ natural: 2, frequency: 2, damping: 0.1, drive: 0.4 })
      .amplitude,
    1,
  ));
test("Resonance: damping lowers response", () =>
  assert.ok(
    f.resonance({ natural: 2, frequency: 2, damping: 0.2 }).amplitude <
      f.resonance({ natural: 2, frequency: 2, damping: 0.1 }).amplitude,
  ));
test("Resonance: correct shifted response maximum", () =>
  near(
    f.resonance({ natural: 2, frequency: 1, damping: 0.1 }).peak,
    Math.sqrt(3.98),
  ));
test("Buoyancy: full immersion 3 L displaces 29.4 N of water", () =>
  near(f.buoyancy({ rho: 600, fluid: 1000, volume: 3 }).force, 29.4));
test("Buoyancy: equal density remains neutrally buoyant", () => {
  const r = f.buoyancy({ rho: 1000, fluid: 1000, volume: 3 }, 8);
  near(r.force, r.weight);
  near(r.v, 0);
});
test("Buoyancy: floating equilibrium displaces body weight", () => {
  const r = f.buoyancy({ rho: 600, fluid: 1000, volume: 3 }, 12);
  near(r.force, r.weight, 0.02);
  near(r.immersed, 0.0018, 0.00001);
});
test("Gas: known SI pressure", () =>
  near(
    f.gas({ temperature: 300, volume: 20, moles: 1 }).pressure,
    124716.93927,
    0.001,
  ));
test("Gas: isothermal compression doubles pressure without altering speed", () => {
  const a = f.gas({ temperature: 300, volume: 20, moles: 1 }),
    b = f.gas({ temperature: 300, volume: 10, moles: 1 });
  near(b.pressure, 2 * a.pressure);
  near(b.rms, a.rms);
});
test("Gas: quadrupling temperature doubles RMS speed", () => {
  const p = { temperature: 100, volume: 20, moles: 1 };
  near(f.gas({ ...p, temperature: 400 }).rms, 2 * f.gas(p).rms);
});
test("Coulomb: microcoulomb conversion", () =>
  near(f.coulomb({ q1: 1, q2: 1, r: 1 }).force, 0.0089875517923));
test("Coulomb: opposite signs attract and distance follows inverse square", () => {
  const a = f.coulomb({ q1: 1, q2: -2, r: 1 }),
    b = f.coulomb({ q1: 1, q2: -2, r: 2 });
  assert.ok(a.signed < 0);
  near(b.force, a.force / 4);
});
test("Coulomb: zero charge produces zero force, zero distance rejected", () => {
  near(f.coulomb({ q1: 0, q2: 2, r: 1 }).force, 0);
  assert.throws(() => f.coulomb({ q1: 1, q2: 1, r: 0 }), RangeError);
});
test("Ohm: current and power", () => {
  const r = f.ohm({ voltage: 12, resistance: 20 });
  near(r.current, 0.6);
  near(r.power, 7.2);
});
test("Ohm: zero voltage is dark", () =>
  near(f.ohm({ voltage: 0, resistance: 20 }).power, 0));
test("Ohm: doubling resistance halves current", () =>
  near(f.ohm({ voltage: 12, resistance: 40 }).current, 0.3));
test("Full circuit: known current and terminal voltage", () => {
  const r = f.circuit({ emf: 12, resistance: 10, internal: 2 });
  near(r.current, 1);
  near(r.voltage, 10);
  near(r.loss, 2);
});
test("Full circuit: source power equals external power plus internal heat", () => {
  const p = { emf: 12, resistance: 4, internal: 2 },
    r = f.circuit(p);
  near(p.emf * r.current, r.power + r.loss);
});
test("Full circuit: ideal source has 100% efficiency", () =>
  near(f.circuit({ emf: 12, resistance: 10, internal: 0 }).efficiency, 100));
test("Induction: stationary magnet produces zero EMF", () =>
  near(
    f.induction({ speed: 0, field: 0.5, turns: 50, resistance: 10 }, 1).emf,
    0,
  ));
test("Induction: EMF is negative derivative of flux linkage", () => {
  const p = { speed: 1, field: 0.5, turns: 50, resistance: 10 },
    t = 0.7,
    dt = 0.000001;
  const derivative =
    (f.induction(p, t + dt).flux - f.induction(p, t - dt).flux) / (2 * dt);
  near(f.induction(p, t).emf, -p.turns * derivative, 1e-6);
});
test("Induction: twice the turns doubles EMF", () => {
  const p = { speed: 1, field: 0.5, turns: 50, resistance: 10 };
  near(f.induction({ ...p, turns: 100 }, 0.7).emf, 2 * f.induction(p, 0.7).emf);
});
test("Lens: object at 2F produces equal inverted real image", () => {
  const r = f.lens({ focal: 0.5, object: 1, height: 0.2 });
  near(r.image, 1);
  near(r.magnification, -1);
});
test("Lens: object within focus produces upright virtual image", () => {
  const r = f.lens({ focal: 0.5, object: 0.25, height: 0.2 });
  near(r.image, -0.5);
  near(r.magnification, 2);
});
test("Lens: focus boundary is explicitly represented", () => {
  const r = f.lens({ focal: 0.5, object: 0.5, height: 0.2 });
  assert.ok(r.atFocus);
  assert.equal(r.image, Infinity);
});
test("Every simulation calculates valid values at all slider endpoints", () => {
  for (const c of allConfigs) {
    const p = defaults(c, 2);
    for (const param of c.params)
      for (const val of [param.min, param.max]) {
        const result = c.calculate({ ...p, [param.key]: val }, 1);
        for (const [key, v] of Object.entries(result))
          if (typeof v === "number")
            assert.ok(
              !Number.isNaN(v),
              `${c.id}: ${param.key}=${val}: ${key} is NaN`,
            );
      }
  }
});
test("Catalog preserves source numbering and known missing entries", async () => {
  const data = JSON.parse(
    await readFile(new URL("../src/data/topics.json", import.meta.url)),
  );
  assert.equal(data.length, 143);
  assert.equal(new Set(data.map((t) => t.number)).size, 143);
  assert.ok(!data.some((t) => t.number === 128 || t.number === 131));
  assert.equal(allConfigs.length, 15);
});
