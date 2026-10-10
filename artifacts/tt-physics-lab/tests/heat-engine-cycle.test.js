import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import { heatEngineCycleVariant } from "../src/data/heat-engine-cycle.js";
import { carnotCycle } from "../src/physics/carnot-cycle.js";

const base = allConfigs.find(config => config.key === "heatEngine");
const variant = heatEngineCycleVariant(base);
const p = { hot: 900, cold: 300, heatIn: 1000, efficiency: 0.35 };
const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);

test("76-mavzu uch qiyinchilik darajasida kerakli boshqaruvlarni beradi", () => {
  assert.equal(variant.id, base.id);
  assert.equal(variant.key, "heatEngine");
  assert.deepEqual(variant.topicNumbers, [76]);
  assert.deepEqual(variant.params.map(param => param.level), [0, 0, 1, 2]);
  assert.deepEqual(variant.params.map(param => param.key), ["hot", "cold", "heatIn", "efficiency"]);
  assert.equal(variant.static, true);
  assert.equal(variant.visual, "thermal");
  assert.ok(base.topicNumbers.includes(76));
  assert.equal(base.params.find(param => param.key === "efficiency").level, 0);
});

test("haqiqiy dvigatelning FIKi Karno chegarasidan past va Q₁=A+Q₂", () => {
  const state = variant.calculate(p);
  close(state.carnot, (1 - p.cold / p.hot) * 100);
  close(state.efficiency, p.efficiency * 100);
  close(state.work, 350);
  close(state.heatOut, 650);
  close(state.work + state.heatOut, p.heatIn);
  assert.equal(state.warning, "");
});

test("Karno chegarasidan oshganda natijalar yashirilib ogohlantirish beriladi", () => {
  const state = variant.calculate({ ...p, efficiency: 0.7 });
  assert.equal(state.work, null);
  assert.equal(state.heatOut, null);
  assert.match(state.warning, /II qonuni/);
});

test("sovuq rezervuar issiqdan issiq yoki nol Kelvin bo‘lsa sikl yaroqsiz", () => {
  for (const invalid of [{ ...p, hot: 300, cold: 300 }, { ...p, cold: 950 }]) {
    const state = variant.calculate(invalid);
    assert.equal(state.work, null);
    assert.ok(state.warning);
    assert.equal(carnotCycle(invalid), null);
  }
});

test("p–V grafigi yopiq ideal sikl va Karno ishini beradi", () => {
  const cycle = carnotCycle(p);
  assert.ok(cycle);
  assert.equal(cycle.stages.length, 4);
  for (const stage of cycle.stages) assert.equal(stage.data.length, 41);
  close(cycle.stages[0].data[0].x, cycle.stages[3].data.at(-1).x);
  close(cycle.stages[0].data[0].y, cycle.stages[3].data.at(-1).y);
  close(cycle.work + cycle.heatOut, p.heatIn);
});
