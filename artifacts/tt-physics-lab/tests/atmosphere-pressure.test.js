import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import { atmospherePressureVariant, calculateAtmospherePressure } from "../src/data/atmosphere-pressure.js";

const base = allConfigs.find(config => config.key === "pressure");
const variant = atmospherePressureVariant(base);
const standard = { altitude: 0, temperature: 288.15, seaLevelPressure: 101325 };
const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);

test("45-mavzu uchun barometr ochiladi, 43-mavzuning gidrostatik bosimi saqlanadi", () => {
  assert.equal(variant.id, base.id);
  assert.deepEqual(variant.topicNumbers, [45]);
  assert.equal(variant.visual, "barometer");
  assert.deepEqual(variant.params.map(param => param.key), ["altitude", "temperature", "seaLevelPressure"]);
  assert.ok(base.topicNumbers.includes(43));
  assert.ok(base.topicNumbers.includes(45));
  assert.equal(base.visual, "fluid");
});

test("dengiz sathida bosim 101325 Pa va simob ustuni taxminan 760 mm", () => {
  const state = calculateAtmospherePressure(standard);
  close(state.pressure, 101325);
  close(state.mercuryHeight, 101325 / 133.322);
  close(state.relativePressure, 1);
  assert.equal(state.warning, "");
});

test("balandlik ortishi bosim va barometr ustunini kamaytiradi", () => {
  const atSea = calculateAtmospherePressure(standard);
  const atEightKm = calculateAtmospherePressure({ ...standard, altitude: 8000 });
  assert.ok(atEightKm.pressure < atSea.pressure);
  assert.ok(atEightKm.mercuryHeight < atSea.mercuryHeight);
  close(atEightKm.relativePressure, Math.exp(-0.0289644 * 9.80665 * 8000 / (8.314462618 * 288.15)));
});

test("iliq havo bir xil balandlikda yuqoriroq bosimni ushlab turadi", () => {
  const cold = calculateAtmospherePressure({ ...standard, altitude: 8000, temperature: 240 });
  const warm = calculateAtmospherePressure({ ...standard, altitude: 8000, temperature: 300 });
  assert.ok(warm.pressure > cold.pressure);
});

test("manfiy balandlik, harorat yoki sirt bosimi yaroqsiz deb qaytariladi", () => {
  for (const p of [
    { ...standard, altitude: -1 },
    { ...standard, temperature: 0 },
    { ...standard, seaLevelPressure: 0 },
  ]) {
    const state = calculateAtmospherePressure(p);
    assert.equal(state.pressure, null);
    assert.ok(state.warning);
  }
});
