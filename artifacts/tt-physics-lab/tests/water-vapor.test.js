import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { liveEquation } from "../src/components/LiveEquation.js";
import { renderCatalog } from "../src/simulations/catalog-render.js";
import { saturationPressure, calculateWaterVapor, waterVaporVariant, WATER_CRITICAL_T, WATER_CRITICAL_P } from "../src/data/water-vapor.js";

test("to‘yinish bosimi IAPWS jadvaliga mos keladi", () => {
  // Jadval yaxlitlangan; 0.15% nisbiy farq chegarasi qo‘llanadi.
  for (const [celsius, mpa] of [[0.01, 0.000612], [25, 0.00317], [100, 0.1014], [200, 1.555], [300, 8.588], [350, 16.529]]) {
    assert.ok(Math.abs(saturationPressure(celsius + 273.15) / 1e6 - mpa) / mpa < 0.0015, `${celsius} °C`);
  }
  assert.equal(saturationPressure(WATER_CRITICAL_T), WATER_CRITICAL_P);
});

test("bosim monoton ortadi; korrelyatsiya chegaradan tashqariga cho‘zilmaydi", () => {
  let previous = 0;
  for (let temperature = 273.16; temperature <= WATER_CRITICAL_T; temperature += 0.5) {
    const pressure = saturationPressure(temperature);
    assert.ok(pressure > previous);
    previous = pressure;
  }
  for (const temperature of [273, 648, NaN, Infinity, undefined]) {
    assert.equal(saturationPressure(temperature), null);
    assert.ok(calculateWaterVapor({ temperature }).warning);
  }
  const critical = calculateWaterVapor({ temperature: WATER_CRITICAL_T });
  assert.equal(critical.critical, true);
  assert.equal(critical.contrast, 0);
});

test("66-mavzu varianti barcha darajalarda ishlaydi va umumiy konfiguratsiyani o‘zgartirmaydi", () => {
  const base = allConfigs.find(c => c.key === "vapor");
  const original = base.calculate(defaults(base));
  const variant = waterVaporVariant(base);
  assert.equal(base.visual, "fluid");
  assert.deepEqual(base.calculate(defaults(base)), original);
  for (let level = 0; level < 3; level++) {
    const params = variant.params.filter(p => p.level <= level);
    assert.equal(params.length, 1);
    assert.equal(defaults(variant).temperature, 373.15);
  }
  const state = variant.calculate(defaults(variant));
  assert.match(liveEquation(variant, defaults(variant), state), /p_sat/);
  assert.doesNotMatch(liveEquation(variant, defaults(variant), state), /undefined|NaN|namlik/);
});

test("oddiy va kritik holat chizmalari chekli koordinatalar bilan farqlanadi", () => {
  const config = waterVaporVariant(allConfigs.find(c => c.key === "vapor"));
  const labels = [];
  const context = new Proxy({}, { get: (target, key) => key in target ? target[key] : (...args) => {
    args.filter(a => typeof a === "number").forEach(a => assert.ok(Number.isFinite(a)));
    if (key === "fillText") labels.push(args[0]);
  } });
  const theme = { ink: "#fff", muted: "#aaa", surface: "#111", floor: "#222", line: "#333" };
  for (const compactMode of [false, true]) {
    context.compactMode = compactMode;
    for (const temperature of [273.16, 373.15, WATER_CRITICAL_T]) {
      const p = { temperature };
      renderCatalog(context, { config, p, s: config.calculate(p), t: 0 }, theme);
    }
  }
  assert.ok(labels.includes("Suyuqlik"));
  assert.ok(labels.includes("Chegara yo‘q"));
});
