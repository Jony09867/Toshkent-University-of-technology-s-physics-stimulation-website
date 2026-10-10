import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import { calculateTransformerInduction, transformerInductionVariant } from "../src/data/transformer-induction.js";

const base = allConfigs.find(config => config.key === "transformer");
const variant = transformerInductionVariant(base);
const p = { n1: 100, n2: 200, voltage: 100, frequency: 50, loadResistance: 100 };
const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);

test("120-mavzu mustaqil jonli transformator variantiga ega", () => {
  assert.equal(variant.id, base.id);
  assert.deepEqual(variant.topicNumbers, [120]);
  assert.equal(variant.static, false);
  assert.equal(variant.visual, "transformerInduction");
  assert.deepEqual(variant.params.map(param => param.level), [0, 0, 0, 1, 2]);
  assert.deepEqual(variant.series.map(([key]) => key), ["voltagePrimaryInstant", "voltageSecondaryInstant"]);
  assert.equal(base.visual, "transformer");
  assert.equal(base.static, true);
});

test("o‘ramlar nisbati, yuk toki va ideal quvvat saqlanishi mos", () => {
  const state = calculateTransformerInduction(p, 0.005);
  close(state.voltage2, 200);
  close(state.current2, 2);
  close(state.current1, 4);
  close(state.powerIn, state.powerOut);
  close(state.powerIn, 400);
  close(state.efficiency, 100);
  close(state.voltageSecondaryInstant / state.voltagePrimaryInstant, 2);
});

test("Faradey qonuni bo‘yicha oqim hosil qilgan EYuK amplitudasi kirish kuchlanishiga teng", () => {
  const state = calculateTransformerInduction(p, 0.005);
  const omega = 2 * Math.PI * p.frequency;
  close(p.n1 * omega * state.fluxPeak, Math.SQRT2 * p.voltage);
  close(state.fluxInstant, 0);
  close(state.voltagePrimaryInstant, Math.SQRT2 * p.voltage);
});

test("chastota oshsa oqim amplitudasi kamayadi, RMS chiqish o‘zgarmaydi", () => {
  const at50Hz = calculateTransformerInduction(p);
  const at100Hz = calculateTransformerInduction({ ...p, frequency: 100 });
  close(at100Hz.fluxPeak, at50Hz.fluxPeak / 2);
  close(at100Hz.voltage2, at50Hz.voltage2);
});

test("nol manba quvvati nol bo‘ladi, yaroqsiz yuk uchun banner qaytadi", () => {
  const off = calculateTransformerInduction({ ...p, voltage: 0 });
  close(off.voltage2, 0);
  close(off.powerIn, 0);
  assert.equal(off.efficiency, null);
  const invalid = calculateTransformerInduction({ ...p, loadResistance: 0 });
  assert.ok(invalid.warning);
  assert.equal(invalid.current2, null);
});
