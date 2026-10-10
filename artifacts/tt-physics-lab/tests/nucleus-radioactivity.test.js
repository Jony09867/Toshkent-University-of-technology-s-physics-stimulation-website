import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import { nucleusRadioactivityVariant } from "../src/data/nucleus-radioactivity.js";

const base = allConfigs.find(config => config.key === "binding");
const model = nucleusRadioactivityVariant(base);
const params = { defect: 0.03, nucleons: 40, protons: 18, initial: 100, halfLife: 4 };

test("142-mavzu yadro tarkibini va radioaktivlikni alohida jonli variantda beradi", () => {
  assert.deepEqual(model.topicNumbers, [142]);
  assert.equal(model.static, false);
  assert.equal(model.visual, "nucleusRadioactivity");
  assert.ok(model.params.some(param => param.key === "protons"));
  assert.ok(model.params.some(param => param.key === "halfLife"));
  assert.match(model.easy, /yarim davr/i);
  assert.match(model.medium, /N\(t\)/);
  assert.equal(base.topicNumbers.includes(142), true);
  assert.equal(base.calculate(params, 4).energy, 27.9448230726);
});

test("har bir yarim davrda kutilayotgan ota yadrolar soni yarmiga tushadi", () => {
  const start = model.calculate(params, 0);
  const oneHalfLife = model.calculate(params, 4);
  const twoHalfLives = model.calculate(params, 8);
  assert.equal(start.remaining, 100);
  assert.equal(oneHalfLife.remaining, 50);
  assert.equal(twoHalfLives.remaining, 25);
  assert.equal(oneHalfLife.decayed, 50);
  assert.equal(oneHalfLife.percent, 50);
  assert.ok(oneHalfLife.activity < start.activity);
});

test("yadro nuklonlari va bog‘lanish energiyasi o‘zgarganda to‘g‘ri yangilanadi", () => {
  const state = model.calculate({ ...params, nucleons: 56, protons: 26, defect: 0.06 }, 0);
  assert.equal(state.protons, 26);
  assert.equal(state.neutrons, 30);
  assert.equal(state.energy, 0.06 * 931.49410242);
  assert.equal(state.perNucleon, state.energy / 56);
});

test("yaroqsiz Z>A, masa yoki yarim davr uchun ogohlantirish beradi", () => {
  for (const invalid of [
    { ...params, protons: 41 },
    { ...params, initial: 0 },
    { ...params, halfLife: -1 },
  ]) {
    const state = model.calculate(invalid, 4);
    assert.equal(state.remaining, null);
    assert.ok(state.warning);
  }
});
