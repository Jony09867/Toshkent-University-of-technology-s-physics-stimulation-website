import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { liveEquation } from "../src/components/LiveEquation.js";
import { renderCatalog } from "../src/simulations/catalog-render.js";
import { calculateAirHumidity, airHumidityVariant } from "../src/data/air-humidity.js";
import { waterVaporVariant } from "../src/data/water-vapor.js";

test("20 °C da to‘yinish sig‘imi ma’lum qiymatga yaqin, quruq va to‘yingan chegaralar to‘g‘ri", () => {
  const temperature = 293.15;
  const dry = calculateAirHumidity({ temperature, waterContent: 0 });
  assert.ok(Math.abs(dry.capacity - 17.3) < 0.2);
  assert.equal(dry.relative, 0);
  assert.equal(dry.vaporMass, 0);
  assert.equal(dry.condensate, 0);
  const saturated = calculateAirHumidity({ temperature, waterContent: dry.capacity });
  assert.equal(saturated.relative, 100);
  assert.equal(saturated.condensate, 0);
});

test("sovitilganda ortiqcha suv tomchiga o‘tadi va jami massa saqlanadi", () => {
  const waterContent = 20;
  const warm = calculateAirHumidity({ temperature: 303.15, waterContent });
  const cold = calculateAirHumidity({ temperature: 278.15, waterContent });
  assert.equal(warm.condensate, 0);
  assert.ok(warm.relative < 100);
  assert.ok(cold.condensate > 0);
  assert.equal(cold.relative, 100);
  assert.ok(Math.abs(cold.vaporMass + cold.condensate - waterContent) < 1e-10);
  assert.ok(Math.abs(cold.vaporPressure - cold.capacity * 8.314462618 * 278.15 / 18.01528) < 1e-8);
  for (const temperature of [273.16, 280, 293.15, 310, 323.15]) {
    const state = calculateAirHumidity({ temperature, waterContent });
    assert.ok(state.relative >= 0 && state.relative <= 100);
    assert.ok(Math.abs(state.vaporMass + state.condensate - waterContent) < 1e-10);
  }
});

test("noto‘g‘ri parametrlar ogohlantiriladi, keyingi mavzu mustaqil qoladi", () => {
  for (const params of [
    { temperature: 273, waterContent: 5 }, { temperature: 324, waterContent: 5 },
    { temperature: 293.15, waterContent: -1 }, { temperature: NaN, waterContent: 5 },
  ]) {
    const state = calculateAirHumidity(params);
    assert.equal(state.relative, null);
    assert.ok(state.warning);
  }
  const base = allConfigs.find(c => c.key === "vapor");
  const before = waterVaporVariant(base).calculate({ temperature: 373.15 });
  const humidity = airHumidityVariant(base);
  assert.equal(humidity.visual, "airHumidity");
  assert.equal(humidity.static, true);
  assert.equal(humidity.params.filter(p => p.level <= 0).length, 2);
  assert.equal(humidity.params.filter(p => p.level <= 1).length, 2);
  assert.equal(humidity.params.filter(p => p.level <= 2).length, 2);
  assert.equal(defaults(humidity).waterContent, 10);
  assert.deepEqual(waterVaporVariant(base).calculate({ temperature: 373.15 }), before);
});

test("chizma quruq va kondensatsiyali holatni ajratadi", () => {
  const config = airHumidityVariant(allConfigs.find(c => c.key === "vapor"));
  const labels = [];
  const context = new Proxy({}, { get: (target, key) => key in target ? target[key] : (...args) => {
    args.filter(a => typeof a === "number").forEach(a => assert.ok(Number.isFinite(a)));
    if (key === "fillText") labels.push(args[0]);
  } });
  const theme = { ink: "#fff", muted: "#aaa", surface: "#111", floor: "#222", line: "#333" };
  for (const compactMode of [false, true]) {
    context.compactMode = compactMode;
    for (const p of [{ temperature: 303.15, waterContent: 10 }, { temperature: 278.15, waterContent: 20 }]) {
      const state = config.calculate(p);
      renderCatalog(context, { config, p, s: state, t: 0 }, theme);
      assert.match(liveEquation(config, p, state), /φ/);
    }
  }
  assert.ok(labels.includes("Tomchi yo‘q"));
  assert.ok(labels.includes("Tomchi hosil bo‘ldi"));
});
