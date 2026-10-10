import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { lampCircuitVariant } from "../src/data/lamp-circuit.js";
import { renderCatalog } from "../src/simulations/catalog-render.js";
import { liveEquation } from "../src/components/LiveEquation.js";

const base = allConfigs.find(c => c.key === "network");
const config = lampCircuitVariant(base);

test("bir xil lampalar ketma-ketda xira, parallelda yorqinroq", () => {
  const p = defaults(config);
  const series = config.calculate({ ...p, mode: 0 });
  const parallel = config.calculate({ ...p, mode: 1 });
  assert.equal(series.current, 0.15);
  assert.equal(series.u1, 6);
  assert.equal(series.u2, 6);
  assert.ok(Math.abs(series.p1 - 0.9) < 1e-12);
  assert.ok(Math.abs(series.p2 - 0.9) < 1e-12);
  assert.equal(parallel.u1, 12);
  assert.equal(parallel.u2, 12);
  assert.ok(Math.abs(parallel.p1 - 3.6) < 1e-12);
  assert.ok(Math.abs(parallel.p2 - 3.6) < 1e-12);
  assert.ok(parallel.p1 > series.p1);
});

test("Kirxgof qonunlari va quvvat balansi turli parametrda saqlanadi", () => {
  for (const mode of [0, 1]) for (const r1 of [5, 20, 80]) for (const r2 of [7, 40, 100]) {
    const p = { mode, voltage: 17, r1, r2 };
    const s = config.calculate(p);
    assert.ok(Math.abs(s.p1 - s.u1 * s.i1) < 1e-10);
    assert.ok(Math.abs(s.p2 - s.u2 * s.i2) < 1e-10);
    assert.ok(Math.abs(s.p1 + s.p2 - p.voltage * s.current) < 1e-10);
    if (mode === 0) {
      assert.equal(s.i1, s.i2);
      assert.ok(Math.abs(s.u1 + s.u2 - p.voltage) < 1e-10);
    } else {
      assert.equal(s.u1, s.u2);
      assert.ok(Math.abs(s.i1 + s.i2 - s.current) < 1e-10);
    }
  }
});

test("nol kuchlanishda lampalar so‘nadi, daraja matnlari va chizma mavjud", () => {
  const p = { ...defaults(config), voltage: 0 };
  const s = config.calculate(p);
  assert.equal(s.p1, 0);
  assert.equal(s.p2, 0);
  assert.equal(s.current, 0);
  assert.match(config.easy, /ketma-ket/);
  assert.match(config.medium, /tok/);
  assert.equal(config.hard.length, 4);
  assert.match(liveEquation(config, p, s), /P₁/);
  assert.equal(config.visual, "lampCircuit");
  assert.equal(config.static, true);
  const labels = [];
  const context = new Proxy({}, { get: (target, key) => key in target ? target[key] : (...args) => {
    args.filter(a => typeof a === "number").forEach(a => assert.ok(Number.isFinite(a)));
    if (key === "fillText") labels.push(args[0]);
  } });
  const theme = { ink: "#fff", muted: "#aaa", floor: "#222", line: "#333" };
  for (const mode of [0, 1]) for (const compactMode of [false, true]) {
    context.compactMode = compactMode;
    const params = { ...defaults(config), mode };
    renderCatalog(context, { config, p: params, s: config.calculate(params), t: 0 }, theme);
  }
  assert.ok(labels.includes("L1"));
  assert.ok(labels.includes("L2"));
  assert.ok(labels.some(x => String(x).includes("Jami quvvat")));
});
