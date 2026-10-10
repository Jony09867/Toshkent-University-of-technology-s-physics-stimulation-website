import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { renderCatalog } from "../src/simulations/catalog-render.js";
import { liveEquation } from "../src/components/LiveEquation.js";

const config = allConfigs.find(c => c.key === "meter");

test("shuntdagi va asbobdagi tok yig‘indisi yangi chegara tokiga teng", () => {
  const p = defaults(config);
  for (const factor of [2, 10, 50, 100]) {
    const s = config.calculate({ ...p, factor });
    assert.ok(Math.abs(s.shuntCurrent + p.current - s.currentLimit) < 1e-12);
    assert.ok(Math.abs(s.shuntCurrent * s.shunt - p.current * p.meterResistance) < 1e-10);
    assert.ok(Math.abs(s.seriesVoltage + s.meterVoltage - s.voltageLimit) < 1e-10);
    assert.ok(Math.abs(s.voltageLimit - p.current * p.meterResistance * factor) < 1e-10);
  }
});

test("kengaytirish ortganda shunt kichrayadi, ketma-ket R va ikkala chegara o‘sadi", () => {
  const p = defaults(config);
  const small = config.calculate({ ...p, factor: 2 });
  const large = config.calculate({ ...p, factor: 100 });
  assert.ok(small.shunt > large.shunt);
  assert.ok(small.series < large.series);
  assert.ok(small.currentLimit < large.currentLimit);
  assert.ok(small.voltageLimit < large.voltageLimit);
  assert.equal(config.visual, "meterRange");
  assert.equal(config.static, true);
  assert.equal(config.sweep, "factor");
  assert.equal(config.results.length, 4);
  assert.match(config.easy, /parallel/);
  assert.match(config.medium, /ketma-ket/);
});

test("yaroqsiz asbob chegarasi cheksiz shunt qiymatini yashiradi", () => {
  const p = defaults(config);
  for (const invalid of [
    { ...p, factor: 1 }, { ...p, factor: 0 },
    { ...p, meterResistance: 0 }, { ...p, current: 0 },
    { ...p, current: NaN },
  ]) {
    const s = config.calculate(invalid);
    assert.equal(s.shunt, null);
    assert.equal(s.voltageLimit, null);
    assert.ok(s.warning);
  }
});

test("uch darajada sxema va formula sonlar bilan chiziladi", () => {
  const p = defaults(config);
  const s = config.calculate(p);
  const labels = [];
  const context = new Proxy({}, { get: (target, key) => key in target ? target[key] : (...args) => {
    args.filter(a => typeof a === "number").forEach(a => assert.ok(Number.isFinite(a)));
    if (key === "fillText") labels.push(args[0]);
  } });
  const theme = { ink: "#fff", muted: "#aaa", surface: "#111", floor: "#222", line: "#333" };
  for (const compactMode of [false, true]) {
    context.compactMode = compactMode;
    renderCatalog(context, { config, p, s, t: 0 }, theme);
  }
  assert.ok(labels.includes("Ampermetr · parallel shunt"));
  assert.ok(labels.includes("Voltmeter · ketma-ket R"));
  assert.ok(labels.some(x => String(x).includes("Ish =")));
  assert.ok(labels.some(x => String(x).includes("U chegara =")));
  assert.match(liveEquation(config, p, s), /R_sh/);
  assert.doesNotMatch(liveEquation(config, p, s), /NaN|undefined/);
  for (let level = 0; level < 3; level++) {
    assert.equal(config.params.filter(item => item.level <= level).length, 3);
  }
});
