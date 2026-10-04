import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { challengeFor } from "../src/components/ChallengeMode.js";
import { energyParts, ENERGY_MODELS } from "../src/components/EnergyBar.js";
import { instrumentReadings, sceneMetresPerPixel } from "../src/components/VirtualInstruments.js";
import { carnotCycle } from "../src/physics/carnot-cycle.js";

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-5 * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);

test("energiya diagrammasi oltita mos tajribada balansni ko‘rsatadi", () => {
  for (const key of ENERGY_MODELS) {
    const config = allConfigs.find((item) => item.key === key);
    const p = defaults(config);
    for (const t of [0, config.duration / 3, config.duration / 2]) {
      const parts = energyParts(key, config.calculate(p, t), p);
      assert.ok(parts, key);
      close(parts.total, parts.initial);
      assert.ok(parts.kinetic >= 0 && parts.potential >= 0 && parts.heat >= 0, key);
    }
  }
});

test("har bir tajribada tekshiriladigan vazifa mavjud", () => {
  for (const config of allConfigs) {
    const challenge = challengeFor(config);
    assert.ok(challenge && challenge.title && challenge.target, config.key);
    assert.equal(typeof challenge.eval, "function", config.key);
  }
});

test("qisqa tutashuv chegarasi foydalanuvchi parametrlariga kiradi", () => {
  const circuit = allConfigs.find((item) => item.key === "circuit");
  const resistance = circuit.params.find((item) => item.key === "resistance");
  assert.ok(resistance.min <= 0.2);
  const state = circuit.calculate({ ...defaults(circuit), resistance: resistance.min }, 0);
  assert.match(state.warning, /qisqa tutashuv/i);
});

test("ko‘chma asboblar modelning haqiqiy birliklariga bog‘langan", () => {
  const config = (key) => allConfigs.find((item) => item.key === key);
  assert.ok(instrumentReadings(config("lens"), "space").some((item) => item.key === "image"));
  assert.ok(instrumentReadings(config("circuit"), "electric").some((item) => item.key === "current"));
  assert.ok(instrumentReadings(config("newton"), "force").some((item) => item.key === "net"));
  assert.equal(instrumentReadings(config("photoelectric"), "electric").length, 0);
  assert.equal(instrumentReadings(config("capacitor"), "electric").find((item) => item.key === "charge").scale, 1e9);
});

test("sahnadagi chizg‘ich fizik masshtabdan foydalanadi", () => {
  close(sceneMetresPerPixel("lever", { arm1: 1, arm2: 0.5 }, {}).x * 220, 1);
  close(sceneMetresPerPixel("spring", {}, {}).y * 105, 1);
  close(sceneMetresPerPixel("lens", { object: 1.2 }, { image: 0.86 }).x * 110, 1);
  const projectile = sceneMetresPerPixel("projectile", {}, { range: 40, height: 10 });
  close(projectile.x, projectile.y);
});

test("Karno p–V portreti yopiq va ostidagi ish ideal FIKga mos", () => {
  const cycle = carnotCycle({ hot: 900, cold: 300, heatIn: 1000 });
  assert.equal(cycle.stages.length, 4);
  for (let i = 0; i < 4; i++) {
    const end = cycle.stages[i].data.at(-1);
    const next = cycle.stages[(i + 1) % 4].data[0];
    close(end.x, next.x);
    close(end.y, next.y);
  }
  const area = cycle.stages.reduce((sum, stage) => sum + stage.data.slice(1).reduce((part, point, index) => {
    const previous = stage.data[index];
    return part + (point.x - previous.x) * (point.y + previous.y) / 2;
  }, 0), 0);
  assert.ok(Math.abs(area - cycle.work) / cycle.work < 0.002);
  close(cycle.heatOut + cycle.work, 1000);
  assert.equal(carnotCycle({ hot: 300, cold: 400, heatIn: 1000 }), null);
});
