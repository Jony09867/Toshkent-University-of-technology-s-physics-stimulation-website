import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import { calculateCenterOfMass, centerOfMassVariant } from "../src/data/center-of-mass.js";

const base = allConfigs.find(config => config.key === "lever");
const variant = centerOfMassVariant(base);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);

test("30-mavzu o‘z massa markazi modeliga ega, 31-mavzu richagi saqlanadi", () => {
  assert.equal(variant.id, base.id);
  assert.deepEqual(variant.topicNumbers, [30]);
  assert.equal(variant.visual, "centerOfMass");
  assert.equal(variant.static, true);
  assert.ok(base.topicNumbers.includes(31));
  assert.equal(base.visual, "lever");
  assert.equal(base.calculate({ m1: 2, m2: 4, arm1: 1, arm2: 0.5 }).net, 0);
});

test("massa markazi og‘irroq yukga yaqin va tayanchdagi momentlar teng", () => {
  const p = { m1: 2, m2: 4, x1: -2, x2: 2 };
  const s = calculateCenterOfMass(p);
  close(s.center, 2 / 3);
  close(s.totalMass, 6);
  assert.ok(p.x1 < s.center && s.center < p.x2);
  close(p.m1 * s.distance1, p.m2 * s.distance2);
  assert.equal(s.warning, "");
});

test("massalar teng bo‘lsa markaz o‘rtada, koordinatalar surilsa birga suriladi", () => {
  const equal = calculateCenterOfMass({ m1: 3, m2: 3, x1: -1.5, x2: 2.5 });
  close(equal.center, 0.5);
  const shifted = calculateCenterOfMass({ m1: 3, m2: 3, x1: -0.5, x2: 3.5 });
  close(shifted.center, equal.center + 1);
});

test("yukni o‘ngga ko‘chirish yoki massasini oshirish markazni o‘ngga suradi", () => {
  const original = calculateCenterOfMass({ m1: 2, m2: 2, x1: -2, x2: 2 });
  const moved = calculateCenterOfMass({ m1: 2, m2: 2, x1: -2, x2: 3 });
  const heavier = calculateCenterOfMass({ m1: 2, m2: 4, x1: -2, x2: 2 });
  assert.ok(moved.center > original.center);
  assert.ok(heavier.center > original.center);
});

test("yaroqsiz massalar yoki joylashuv uchun hisob ko‘rsatilmaydi", () => {
  for (const p of [
    { m1: 0, m2: 2, x1: -1, x2: 1 },
    { m1: 1, m2: 2, x1: 1, x2: 1 },
    { m1: Infinity, m2: 2, x1: -1, x2: 1 },
  ]) {
    const s = calculateCenterOfMass(p);
    assert.equal(s.center, null);
    assert.ok(s.warning);
  }
});
