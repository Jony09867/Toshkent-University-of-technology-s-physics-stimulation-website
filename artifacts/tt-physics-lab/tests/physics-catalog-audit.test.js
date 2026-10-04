import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { models } from "../src/physics/catalog-engine.js";
import { G, GAS, LIGHT, PLANCK, ELEMENTARY } from "../src/physics/constants.js";

const close = (actual, expected, tolerance = 1e-8) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(actual), Math.abs(expected)),
    `${actual} ≠ ${expected}`,
  );

test("86 ta tajribaning qo‘shma chegaraviy holatlari hisoblanadi", () => {
  assert.equal(allConfigs.length, 86);
  let seed = 20261002;
  const random = () =>
    ((seed = (Math.imul(seed, 1664525) + 1013904223) | 0) >>> 0) /
    4294967296;

  for (const config of allConfigs) {
    const standard = defaults(config);
    const cases = [standard];
    for (const side of ["min", "max"])
      cases.push({
        ...standard,
        ...Object.fromEntries(config.params.map((param) => [param.key, param[side]])),
      });
    for (let i = 0; i < 15; i++)
      cases.push({
        ...standard,
        ...Object.fromEntries(
          config.params.map((param) => [
            param.key,
            param.min + (param.max - param.min) * random(),
          ]),
        ),
      });

    const keys = new Set([
      ...config.results.map((result) => result.key),
      ...config.series.map((series) => series[0]),
    ]);
    for (const params of cases)
      for (const t of [0, config.duration / 2, config.duration]) {
        const result = config.calculate(params, t);
        for (const key of keys)
          assert.ok(
            result[key] === null ||
              (config.key === "friction" &&
                params.mu * params.normal === 0 &&
                (key === "stop" || key === "distance") &&
                result[key] === Infinity) ||
              (config.key === "lens" &&
                params.object === params.focal &&
                ((key === "image" && result[key] === Infinity) ||
                  (key === "magnification" && result[key] === -Infinity))) ||
              (typeof result[key] === "number" && Number.isFinite(result[key])),
            `${config.key}: ${key}, t=${t}, ${JSON.stringify(params)} → ${result[key]}`,
          );
      }
  }
});

test("mexanika va gidromexanika modellari mustaqil qonunlarga mos", () => {
  const u = models.uniform({ x0: 4, v0: -3 }, 2);
  close(u.distance, Math.abs(u.x - 4));
  const relative = models.relative({ v1: 3, v2: 4 }, 2);
  close(relative.speed, 5);
  const meeting = models.meeting({ v1: 8, v2: -2, gap: 40 });
  const hit = models.meeting({ v1: 8, v2: -2, gap: 40 }, meeting.meeting);
  close(hit.x1, hit.x2);
  const circle = models.circular({ radius: 3, omega: 2, alpha: 0.2 }, 2);
  close(circle.x ** 2 + circle.y ** 2, 9);
  close(circle.normal, circle.velocity ** 2 / 3);
  const gear = models.gears({ r1: 2, r2: 5, omega: 3 });
  close(2 * 3 + 5 * gear.omega2, 0);
  close(models.density({ m: 2, volume: 1 }).density, 2000);
  const reaction = models.reaction({ force: 12, m1: 2, m2: 3 });
  close(reaction.force + reaction.reaction, 0);
  close(2 * reaction.a1 + 3 * reaction.a2, 0);
  const gravity = models.gravity({ altitude: 100, m: 2 });
  close(gravity.force, 2 * gravity.g);
  close(gravity.velocity ** 2, gravity.g * 6471000);
  const hooke = models.hooke({ k: 20, extension: 0.3 });
  close(hooke.potential, hooke.force * 0.3 / 2);
  const lift = models.elevator({ m: 2, a: 3 }, 2);
  close(lift.normal - 2 * G, 6);
  const vectors = models.vectors({ f1: 3, f2: 4, angle: 90, m: 2 });
  close(vectors.force, 5);
  const lever = models.lever({ m1: 2, m2: 4, arm1: 1, arm2: 0.5 });
  close(lever.net, 0);
  const work = models.work({ force: 10, distance: 4, angle: 60, interval: 2, efficiency: 80 });
  close(work.work, 20);
  close(work.power, 10);
  close(work.useful, 16);
  const pressure = models.pressure({ atmosphere: 101, rho: 1000, h: 2 });
  close(pressure.pressure - 101000, 2000 * G);
  const vessels = models.vessels({ rho1: 1000, rho2: 800, h: 1 });
  close(1000 * 1, 800 * vessels.h2);
  const p = { velocity: 2, area1: 30, area2: 15, pressure: 200, rho: 1000, h1: 1, h2: 2 };
  const flow = models.bernoulli(p);
  close(p.area1 * p.velocity, p.area2 * flow.v2);
  close(p.pressure * 1000 + p.rho * p.velocity ** 2 / 2 + p.rho * G * p.h1,
    flow.pressure2 + p.rho * flow.v2 ** 2 / 2 + p.rho * G * p.h2);
  const invalidFlow = models.bernoulli({ ...p, velocity: 10, area1: 100, area2: 1, pressure: 100 });
  assert.equal(invalidFlow.pressure2, null);
  assert.ok(invalidFlow.warning);
  const capillary = models.capillary({ tension: 0.072, angle: 0, rho: 1000, radius: 1 });
  close(capillary.force, 1000 * G * Math.PI * 0.001 ** 2 * capillary.height);
});

test("issiqlik, elektr va magnit modellari balanslarni saqlaydi", () => {
  const wave = models.wave({ amplitude: 0.2, frequency: 2, wavelength: 3, position: 1 }, 0.3);
  close(wave.speed * wave.period, 3);
  const vapor = models.vapor({ temperature: 293, vapor: 1 });
  close(vapor.relative * vapor.saturation, 100000);
  const elastic = models.elastic({ force: 20, area: 10, young: 200, length: 2 });
  close(elastic.extension / 2, elastic.strain);
  const expansion = models.expansion({ alpha: 12, length: 2, deltaT: 100 });
  close(expansion.length2 - 2, expansion.delta);
  close(models.calorimetry({ m: 2, capacity: 4200, deltaT: 5, temperature: 293 }).heat, 42000);
  const ad = models.adiabatic({ moles: 1, volume: 20, temperature: 300, gamma: 1.4 }, 5);
  close(ad.pressure * ad.volume / 1000, GAS * ad.temperature);
  const transferred = models.chargeTransfer({ q1: 5, q2: -2, transfer: 1 });
  close(transferred.q1 + transferred.q2, transferred.total);
  const field = models.field({ charge: 2, radius: 0.5, testCharge: 1 });
  close(field.field * 0.5, field.potential);
  close(field.work, field.potential * 1e-6);
  close(models.sphere({ mode: 0, radius: 1, distance: 0.5, charge: 2 }).field, 0);
  const fieldWork = models.fieldWork({ field: 100, charge: 2, distance: 0.5 });
  close(fieldWork.work, fieldWork.force * 0.5);
  const capacitor = models.capacitor({ area: 100, gap: 1, dielectric: 2, voltage: 12 });
  close(capacitor.energy, capacitor.charge * 12 / 2);
  const current = models.current({ charge: 6, interval: 2 }, 1);
  close(current.passed, current.current);
  const joule = models.joule({ voltage: 12, resistance: 6 }, 5);
  close(joule.heat, joule.power * 5);
  const battery = models.batteries({ mode: 0, emf: 1.5, count: 4, internal: 0.5, resistance: 10 });
  close(battery.emf, battery.current * (battery.internal + 10));
  close(models.diode({ voltage: 0, ideality: 1.5, saturation: 1, temperature: 300 }).current, 0);
  const magnetic = models.magnetic({ current: 4, radius: 2, area: 10 });
  close(magnetic.flux, magnetic.field * 0.001);
  const rl = models.rl({ voltage: 12, resistance: 10, inductance: 2000 }, 0);
  close(rl.current, 0);
  close(rl.emf, -12);
  const generator = { frequency: 2, turns: 50, field: 0.5, area: 100 };
  const a = models.generator(generator, 0.12), b = models.generator(generator, 0.120001);
  close(a.emf, -generator.turns * (b.flux - a.flux) / 0.000001, 1e-4);
});

test("optika, kvant va nisbiylik modellarining chegaralari to‘g‘ri", () => {
  const em = models.emwave({ frequency: 100, distance: 10, amplitude: 1 });
  close(em.wavelength * 100e6, LIGHT);
  close(em.delay * LIGHT, 20000);
  close(models.reflection({ angle: 45 }).reflected, 45);
  const instrument = models.instrument({ mode: 1, eyepiece: 0.05, objective: 0.5 });
  close(instrument.magnification, 10);
  close(models.diffraction({ width: 10, wavelength: 550, angle: 0 }).intensity, 1);
  close(models.polarization({ angle: 90, intensity: 100 }).intensity, 0);
  const relativity = models.relativity({ beta: 0, interval: 2, length: 3, m: 1 });
  close(relativity.gamma, 1);
  close(relativity.kinetic, 0);
  const photon = models.photon({ wavelength: 500 });
  close(photon.energy, photon.momentum * LIGHT);
  close(photon.energy, PLANCK * photon.frequency);
  const xray = models.xray({ voltage: 50 });
  close(xray.energy, ELEMENTARY * 50000);
  close(xray.wavelength * xray.energy, PLANCK * LIGHT);
  const bohr = models.bohr({ n: 3, lower: 2, z: 1 });
  close(bohr.transition, 13.605693 * (1 / 4 - 1 / 9));
  const binding = models.binding({ defect: 0.03, nucleons: 4 });
  close(binding.energy, binding.perNucleon * 4);
  close(models.rutherford({ energy: 5, impact: 0, z: 79 }).angle, 180);
});
