import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import { calculateXrayTube, xrayTubeVariant } from "../src/data/xray-tube.js";

const base = allConfigs.find(config => config.key === "xray");
const variant = xrayTubeVariant(base);
const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);

test("139-mavzu elektron-nishon Rentgen modeli bilan 138-foton tajribasidan ajraladi", () => {
  assert.equal(variant.id, base.id);
  assert.deepEqual(variant.topicNumbers, [139]);
  assert.equal(variant.visual, "xrayTube");
  assert.equal(variant.static, false);
  assert.deepEqual(variant.params.map(param => param.level), [0, 1, 2]);
  assert.equal(base.visual, "photon");
  assert.ok(allConfigs.some(config => config.key === "photon" && config.topicNumbers.includes(138)));
});

test("Duane–Hunt chegarasi va elektron dastasi quvvati birliklari mos", () => {
  const state = calculateXrayTube({ voltage: 50, current: 5, targetZ: 29 }, 2);
  close(state.energy, 50);
  close(state.wavelength, 1.239841984 / 50);
  close(state.beamPower, 250);
  close(state.electronSpeedC, Math.sqrt(1 - 1 / (1 + 50 / 511) ** 2));
});

test("elektron energiyasi anod kuchlanishida eU gacha tezlashadi", () => {
  const atRest = calculateXrayTube({ voltage: 50, current: 5, targetZ: 29 }, 0);
  const halfway = calculateXrayTube({ voltage: 50, current: 5, targetZ: 29 }, 1);
  const beforeAnode = calculateXrayTube({ voltage: 50, current: 5, targetZ: 29 }, 1.9);
  const atAnode = calculateXrayTube({ voltage: 50, current: 5, targetZ: 29 }, 2);
  close(atRest.electronKineticEnergy, 0);
  close(halfway.electronKineticEnergy, 12.5);
  close(atAnode.electronKineticEnergy, 50);
  assert.equal(atRest.impact, false);
  assert.equal(beforeAnode.impact, false);
  assert.equal(atAnode.impact, true);
  assert.ok(atAnode.electronSpeedC > atRest.electronSpeedC);
});

test("kuchlanish ikki baravar bo‘lsa foton energiyasi ikki baravar, chegara to‘lqini yarmiga tushadi", () => {
  const low = calculateXrayTube({ voltage: 40, current: 2, targetZ: 29 });
  const high = calculateXrayTube({ voltage: 80, current: 2, targetZ: 29 });
  close(high.energy, 2 * low.energy);
  close(high.wavelength, low.wavelength / 2);
});

test("tok energiya chegarasini emas, elektron dastasi quvvatini o‘zgartiradi", () => {
  const low = calculateXrayTube({ voltage: 50, current: 2, targetZ: 29 });
  const high = calculateXrayTube({ voltage: 50, current: 8, targetZ: 29 });
  close(low.energy, high.energy);
  close(low.wavelength, high.wavelength);
  close(high.beamPower, 4 * low.beamPower);
});

test("Kα chizig‘i K-qobiq ionlanish chegarasidan pastda paydo bo‘lmaydi", () => {
  const copper = calculateXrayTube({ voltage: 50, current: 5, targetZ: 29 });
  close(copper.kAlphaEnergy, 0.75 * copper.kShellEdge);
  assert.equal(copper.kShellExcited, true);
  const tungstenUnderVoltage = calculateXrayTube({ voltage: 50, current: 5, targetZ: 74 });
  assert.ok(tungstenUnderVoltage.kShellEdge > tungstenUnderVoltage.energy);
  assert.equal(tungstenUnderVoltage.kAlphaEnergy, null);
  assert.equal(tungstenUnderVoltage.kAlphaWavelength, null);
  const noBeam = calculateXrayTube({ voltage: 50, current: 0, targetZ: 29 }, 2);
  assert.equal(noBeam.kShellExcited, false);
  assert.equal(noBeam.kAlphaEnergy, null);
});

test("yaroqsiz kuchlanish yoki manfiy tok uchun natijalar cheklanadi", () => {
  for (const p of [
    { voltage: 0, current: 2, targetZ: 29 },
    { voltage: 50, current: -1, targetZ: 29 },
  ]) {
    const state = calculateXrayTube(p);
    assert.ok(state.warning);
    assert.equal(state.energy, null);
  }
});
