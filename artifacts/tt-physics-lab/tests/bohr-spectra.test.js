import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import { bohrSpectraVariant } from "../src/data/bohr-spectra.js";

const base = allConfigs.find(config => config.key === "bohr");
const model = bohrSpectraVariant(base);
const hydrogen = { upper: 3, lower: 2, z: 1, absorption: 0 };

test("137-mavzu sathlar va spektr uchun o‘z variantini ochadi", () => {
  assert.equal(model.id, base.id);
  assert.deepEqual(model.topicNumbers, [137]);
  assert.equal(model.visual, "atomSpectra");
  assert.equal(model.static, true);
  assert.equal(model.series[0][0], "wavelength");
  assert.equal(base.static, true);
  assert.ok(Math.abs(base.calculate({ n: 3, lower: 2, z: 1 }).wavelength - model.calculate(hydrogen).wavelength) < 1e-20);
  assert.match(model.easy, /foton chiqaradi/i);
  assert.match(model.medium, /hc\/λ/);
});

test("vodorodning Balmer alfa chizig‘i Bor modeliga mos", () => {
  const state = model.calculate(hydrogen);
  assert.ok(Math.abs(state.wavelength * 1e9 - 656.1) < 0.1);
  assert.ok(Math.abs(state.photonEnergy - 1.88968) < 0.00001);
  assert.equal(state.emitted, true);
  assert.equal(state.initialLevel, 3);
  assert.equal(state.finalLevel, 2);
});

test("yutilish teskari o‘tadi, foton chastota va to‘lqin uzunligi saqlanadi", () => {
  const emission = model.calculate(hydrogen);
  const absorption = model.calculate({ ...hydrogen, absorption: 1 });
  assert.equal(absorption.emitted, false);
  assert.equal(absorption.initialLevel, 2);
  assert.equal(absorption.finalLevel, 3);
  assert.equal(absorption.wavelength, emission.wavelength);
  assert.equal(absorption.photonEnergy, emission.photonEnergy);
});

test("seriya va yadro zaryadi kutilgan spektr sohasini o‘zgartiradi", () => {
  const hBeta = model.calculate({ ...hydrogen, upper: 4 });
  const lymanAlpha = model.calculate({ upper: 2, lower: 1, z: 1, absorption: 0 });
  const heliumIon = model.calculate({ ...hydrogen, z: 2 });
  const hAlpha = model.calculate(hydrogen);
  assert.ok(Math.abs(hBeta.wavelength * 1e9 - 486.1) < 0.1);
  assert.ok(Math.abs(lymanAlpha.wavelength * 1e9 - 121.6) < 0.1);
  assert.ok(heliumIon.wavelength < hAlpha.wavelength);
  assert.ok(Math.abs(heliumIon.wavelength * 4 - hAlpha.wavelength) < 1e-12);
});

test("yuqori sath quyi sathdan katta bo‘lmasa qiymatlar yashiriladi", () => {
  const invalid = model.calculate({ ...hydrogen, upper: 2, lower: 2 });
  assert.equal(invalid.wavelength, null);
  assert.ok(invalid.warning);
});
