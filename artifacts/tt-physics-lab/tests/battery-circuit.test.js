import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { renderCatalog } from "../src/simulations/catalog-render.js";
import { liveEquation } from "../src/components/LiveEquation.js";

const config = allConfigs.find(item => item.key === "batteries");
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);

test("ketma-ket va parallel manbalarning EYuK hamda ichki qarshiligi to‘g‘ri", () => {
  const p = defaults(config);
  for (const count of [1, 2, 3, 6]) {
    const series = config.calculate({ ...p, count, mode: 0 });
    const parallel = config.calculate({ ...p, count, mode: 1 });
    near(series.emf, count * p.emf);
    near(series.internal, count * p.internal);
    near(parallel.emf, p.emf);
    near(parallel.internal, p.internal / count);
    near(series.current, series.emf / (p.resistance + series.internal));
    near(parallel.current, parallel.emf / (p.resistance + parallel.internal));
    near(parallel.branchCurrent * count, parallel.current);
    near(series.branchCurrent, series.current);
    if (count === 1) near(series.current, parallel.current);
  }
});

test("manba bergan quvvat yuk va ichki yo‘qotish yig‘indisiga teng", () => {
  for (const count of [1, 2, 6]) for (const mode of [0, 1]) {
    const p = { ...defaults(config), count, mode, internal: 2.5, resistance: 3 };
    const s = config.calculate(p);
    near(s.sourcePower, s.loadPower + s.internalLoss);
    near(s.voltage, s.current * p.resistance);
    near(s.emf - s.current * s.internal, s.voltage);
  }
});

test("yaroqsiz manbalar soni va qarshilik cheksiz natijaga aylanmaydi", () => {
  const p = defaults(config);
  for (const changed of [{ count: 0 }, { count: 1.5 }, { emf: 0 }, { internal: -1 }, { resistance: 0 }, { mode: 2 }]) {
    const s = config.calculate({ ...p, ...changed });
    assert.equal(s.current, null);
    assert.ok(s.warning);
  }
});

test("manbalar soni ikkala sxemada chiziladi, uch darajada izoh mavjud", () => {
  assert.equal(config.visual, "batteryCircuit");
  assert.equal(config.sweep, "count");
  assert.equal(config.series.length, 1);
  assert.match(config.easy, /ketma-ket/);
  assert.match(config.medium, /r\/n/);
  assert.equal(config.hard.length, 4);
  const labels = [];
  const context = new Proxy({}, { get: (target, key) => key in target ? target[key] : (...args) => {
    args.filter(value => typeof value === "number").forEach(value => assert.ok(Number.isFinite(value)));
    if (key === "fillText") labels.push(args[0]);
  } });
  const theme = { ink: "#fff", muted: "#aaa", floor: "#222", line: "#333" };
  for (const mode of [0, 1]) for (const count of [1, 2, 6]) for (const compactMode of [false, true]) {
    context.compactMode = compactMode;
    const p = { ...defaults(config), mode, count };
    renderCatalog(context, { config, p, s: config.calculate(p), t: 0 }, theme);
    assert.match(liveEquation(config, p, config.calculate(p)), /ε_eq/);
  }
  assert.ok(labels.includes("6"));
  assert.ok(labels.some(value => String(value).includes("Yuk toki")));
});
