import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import { photoelectricVariant, calculatePhotoelectric } from "../src/data/photoelectric.js";

const defaults = { frequency: 10, work: 4.5, intensity: 50 };

test("140-mavzu o‘z fotoeffekt modeli va uch darajadagi boshqaruvga ega", () => {
  const base = allConfigs.find(config => config.key === "photoelectric");
  const variant = photoelectricVariant(base);
  assert.deepEqual(variant.topicNumbers, [140]);
  assert.equal(variant.visual, "photoelectric");
  assert.deepEqual(variant.params.map(param => param.level), [0, 1, 2]);
});

test("chastota chegaradan past bo‘lsa intensivlikdan qat’i nazar elektron chiqmaydi", () => {
  const state = calculatePhotoelectric({ ...defaults, frequency: 10, work: 4.5, intensity: 100 }, 5);
  assert.equal(state.aboveThreshold, false);
  assert.equal(state.emits, false);
  assert.equal(state.kinetic, 0);
  assert.equal(state.emittedCount, 0);
  assert.match(state.warning, /Qizil chegara/);
});

test("Einshteyn tenglamasi va chegara chastotasi to‘g‘ri", () => {
  const state = calculatePhotoelectric({ ...defaults, frequency: 12, work: 4.5 }, 1);
  assert.ok(Math.abs(state.photonEnergy - 4.9628) < 0.001);
  assert.ok(Math.abs(state.kinetic - (state.photonEnergy - 4.5)) < 1e-12);
  assert.ok(Math.abs(state.thresholdFrequency14 - 10.881) < 0.002);
  assert.ok(Math.abs(state.thresholdWavelength - 275.52) < 0.02);
});

test("intensivlik elektronlar sonini o‘zgartiradi, maksimal energiyani o‘zgartirmaydi", () => {
  const dim = calculatePhotoelectric({ ...defaults, frequency: 20, intensity: 25 }, 2);
  const bright = calculatePhotoelectric({ ...defaults, frequency: 20, intensity: 100 }, 2);
  assert.equal(dim.kinetic, bright.kinetic);
  assert.equal(dim.photonEnergy, bright.photonEnergy);
  assert.equal(bright.emittedCount, dim.emittedCount * 4);
});

test("bir xil optik quvvatda chastota ikki baravar bo‘lsa foton oqimi yarmiga tushadi", () => {
  const low = calculatePhotoelectric({ ...defaults, frequency: 15 }, 2);
  const high = calculatePhotoelectric({ ...defaults, frequency: 30 }, 2);
  assert.ok(low.emits && high.emits);
  assert.ok(high.kinetic > low.kinetic);
  assert.equal(high.emittedCount, low.emittedCount / 2);
});

test("nol intensivlikda foton oqimi va elektron emissiyasi yo‘q", () => {
  const state = calculatePhotoelectric({ ...defaults, frequency: 20, intensity: 0 }, 5);
  assert.equal(state.aboveThreshold, true);
  assert.equal(state.emits, false);
  assert.equal(state.kinetic > 0, true);
  assert.equal(state.emittedCount, 0);
  assert.equal(state.warning, "");
});

test("emissiya energiyasi musbat bo‘lganda elektron tezligi klassik ifodaga mos", () => {
  const state = calculatePhotoelectric({ ...defaults, frequency: 20 }, 1);
  const expected = Math.sqrt(2 * state.kinetic * 1.602176634e-19 / 9.1093837139e-31);
  assert.ok(Math.abs(state.electronSpeed - expected) / expected < 1e-12);
});

test("noto‘g‘ri parametrlar yakunli natijaga aylanmaydi", () => {
  const state = calculatePhotoelectric({ frequency: 0, work: -1, intensity: -2 }, 0);
  assert.equal(state.photonEnergy, null);
  assert.equal(state.kinetic, null);
  assert.match(state.warning, /musbat/);
});
