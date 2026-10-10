import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";

const thermionic = allConfigs.find((config) => config.key === "thermionic");

test("termoelektron emissiya vaqt bo‘yicha fizik zaryad yig‘adi", () => {
  const p = defaults(thermionic);
  const initial = thermionic.calculate(p, 0);
  const later = thermionic.calculate(p, 4);
  assert.equal(initial.charge, 0);
  assert.ok(initial.density > 1);
  assert.equal(later.charge, 4 * later.density);
  assert.equal(thermionic.calculate(p, -2).charge, 0);
});

test("katodni qizdirish emissiyani oshiradi, chiqish ishini oshirish kamaytiradi", () => {
  const p = defaults(thermionic);
  const base = thermionic.calculate(p, 1).density;
  assert.ok(thermionic.calculate({ ...p, temperature: p.temperature + 200 }, 1).density > base);
  assert.ok(thermionic.calculate({ ...p, work: p.work + 0.5 }, 1).density < base);
  assert.equal(thermionic.visual, "thermionic");
  assert.equal(thermionic.static, false);
});
