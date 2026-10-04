import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allConfigs, defaults } from "../src/data/configs.js";
import { models } from "../src/physics/catalog-engine.js";
import {
  G,
  GAS,
  PLANCK,
  ELEMENTARY,
  COULOMB,
} from "../src/physics/constants.js";

const close = (a, b, tolerance = 1e-8) =>
  assert.ok(
    Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b)),
    `${a} ≠ ${b}`,
  );
const topics = JSON.parse(
  readFileSync(new URL("../src/data/topics.json", import.meta.url)),
);

test("Katalogdagi har bir mavzu yagona, ochiladigan tajribaga bog‘langan", () => {
  assert.equal(new Set(allConfigs.map((c) => c.id)).size, allConfigs.length);
  for (const topic of topics)
    assert.equal(
      allConfigs.filter((c) => c.topicNumbers.includes(topic.number)).length,
      1,
      `${topic.number}: ${topic.title}`,
    );
  for (const c of allConfigs) {
    assert.equal(typeof c.calculate, "function", c.key);
    assert.ok(
      c.title &&
        c.description &&
        c.model &&
        c.easy &&
        c.medium &&
        c.hard.length,
      c.key,
    );
    assert.ok(c.params.length && c.results.length && c.series.length, c.key);
    for (const p of c.params)
      assert.ok(
        p.value >= p.min && p.value <= p.max && p.step > 0,
        `${c.key}.${p.key}`,
      );
  }
});

test("Yangi modellarning natija va grafiklari barcha slayder chegaralarida yaroqli", () => {
  for (const c of allConfigs.filter((c) => c.visual)) {
    const initial = defaults(c),
      states = [initial];
    for (const p of c.params)
      for (const v of [p.min, p.max]) states.push({ ...initial, [p.key]: v });
    for (const p of states)
      for (const t of [0, c.duration / 2, c.duration]) {
        const s = c.calculate(p, t);
        for (const key of new Set([
          ...c.results.map((r) => r.key),
          ...c.series.map((r) => r[0]),
        ])) {
          const value = s[key];
          assert.ok(
            value === null ||
              (typeof value === "number" && Number.isFinite(value)),
            `${c.key}.${key}=${value}`,
          );
        }
      }
  }
});

test("Elastik va noelastik to‘qnashuvda impuls va energiya balansi saqlanadi", () => {
  for (const restitution of [0, 0.3, 1])
    for (const m1 of [0.5, 10])
      for (const m2 of [0.5, 10]) {
        const p = { m1, m2, v1: 6, v2: -2, restitution },
          s = models.collision(p, 3);
        close(s.momentumAfter, s.momentumBefore);
        close(s.u2 - s.u1, restitution * (p.v1 - p.v2));
        close(s.kinetic + s.heat, s.kineticBefore);
        assert.ok(s.lost >= 0);
      }
  const s = models.collision({ m1: 2, m2: 2, v1: 6, v2: 0, restitution: 1 });
  close(s.u1, 0);
  close(s.u2, 6);
});

test("Gidravlik press SI birliklarini saqlaydi va ideal ishni ko‘paytirmaydi", () => {
  const s = models.hydraulic({ s1: 4, s2: 100, force: 100, lift: 10 });
  close(s.bigForce, 2500);
  close(s.bigLift, 0.004);
  close(s.pressure, 250000);
  close(s.workIn, s.bigForce * s.bigLift);
  close(s.workIn, s.workOut);
});

test("Nochiziqli mayatnikda energiya saqlanadi, so‘nishda issiqlikka o‘tadi", () => {
  for (const damping of [0, 0.1, 0.5]) {
    let previous = Infinity;
    for (let t = 0; t <= 12; t += 0.3) {
      const s = models.pendulum({ length: 1, amplitude: 45, damping }, t);
      close(s.kinetic + s.potential + s.heat, s.initial, 1e-6);
      if (damping === 0) close(s.energy, s.initial, 1e-6);
      else assert.ok(s.energy <= previous + 1e-6);
      previous = s.energy;
    }
  }
});

test("Ideal LC konturida elektr va magnit energiya yig‘indisi doimiy", () => {
  const p = { inductance: 2, capacitance: 20, charge: 2 },
    start = models.lcr(p, 0);
  close(start.total, 0.1);
  close(start.period, 2 * Math.PI * Math.sqrt(0.002 * 0.00002));
  for (let t = 0; t < 0.01; t += 0.00007) {
    const s = models.lcr(p, t);
    close(s.energyCap + s.energyInd, start.total);
  }
  const quarter = models.lcr(p, start.period / 4);
  close(quarter.charge, 0);
  close(quarter.current, -10);
});

test("Adiabata va izojarayonlarda birinchi qonun va invariantlar bajariladi", () => {
  const p = { volume: 20, temperature: 300, gamma: 1.4, moles: 1 },
    start = models.adiabatic(p, 0);
  for (const t of [0, 2, 10]) {
    const s = models.adiabatic(p, t);
    close(
      s.temperature * s.volume ** (p.gamma - 1),
      p.temperature * p.volume ** (p.gamma - 1),
    );
    close((s.pressure * s.volume) / 1000, GAS * s.temperature);
    close(s.work + s.internal, start.internal);
  }
  const c = allConfigs.find((c) => c.key === "isoProcess");
  for (const process of [0, 1, 2]) {
    const p = { ...defaults(c), process },
      s = c.calculate(p, 6);
    close(
      s.heat,
      1.5 * p.moles * GAS * (s.temperature - p.temperature) + s.work,
    );
    if (process === 0) close(s.temperature, p.temperature);
    if (process === 1) close(s.pressure, s.startP);
    if (process === 2) close(s.volume, p.volume);
  }
});

test("Karno, fotoeffekt va to‘liq ichki qaytish chegaralari noto‘g‘ri natijani yashirmaydi", () => {
  const p = { hot: 600, cold: 300, heatIn: 1000, efficiency: 0.5 };
  assert.equal(models.heatEngine(p).work, 500);
  assert.ok(models.heatEngine({ ...p, efficiency: 0.51 }).warning);
  assert.equal(models.heatEngine({ ...p, efficiency: 0.51 }).work, null);
  const c = allConfigs.find((c) => c.key === "photoelectric"),
    cut = (4.5 * ELEMENTARY) / PLANCK / 1e14;
  assert.equal(c.calculate({ frequency: cut * 0.9, work: 4.5 }).emits, false);
  close(c.calculate({ frequency: cut * 0.9, work: 4.5 }).kinetic, 0);
  close(c.calculate({ frequency: cut * 2, work: 4.5 }).kinetic, 4.5);
  const r = allConfigs.find((c) => c.key === "refraction");
  const s = r.calculate({ n1: 1.5, n2: 1, angle: 60 });
  assert.equal(s.totalInternal, true);
  assert.equal(s.beta, null);
});

test("Kuchlar, elektromagnit va optik modellarda etalon holatlar to‘g‘ri", () => {
  close(models.elevator({ m: 2, a: -G }).normal, 0);
  close(models.lever({ m1: 2, m2: 4, arm1: 1, arm2: 0.5 }).net, 0);
  close(models.polarization({ intensity: 100, angle: 90 }).intensity, 0);
  close(
    models.diffraction({ width: 10, wavelength: 550, angle: 0 }).intensity,
    1,
  );
  close(
    models.capacitorNetwork({ mode: 0, c1: 10, c2: 20, voltage: 12 })
      .capacitance * 1e6,
    30,
  );
  close(
    models.capacitorNetwork({ mode: 1, c1: 10, c2: 20, voltage: 12 })
      .capacitance * 1e6,
    20 / 3,
  );
  const r = models.rutherford({ energy: 5, impact: 0, z: 79 });
  close(r.angle, 180);
  close(
    r.closest,
    (COULOMB * 158 * ELEMENTARY ** 2) / (5e6 * ELEMENTARY),
    1e-20,
  );
  const l = models.lorentz({
    charge: 1,
    mass: 1,
    velocity: 1e6,
    field: 0.4,
    angle: 90,
  });
  close(l.force / (ELEMENTARY * 1e6 * 0.4), 1);
  close(l.spiralRadius, 0.02591067405, 1e-8);
  close(models.relativity({ beta: 0, interval: 1, length: 1, m: 1 }).gamma, 1);
});
