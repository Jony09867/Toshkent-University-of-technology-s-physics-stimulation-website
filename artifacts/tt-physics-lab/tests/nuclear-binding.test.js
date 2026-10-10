import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import { calculateNuclearBinding, nuclearBindingVariant } from "../src/data/nuclear-binding.js";

const base = allConfigs.find((config) => config.key === "binding");
const model = nuclearBindingVariant(base);

test("144-mavzu massa nuqsonidan bog‘lanish energiyasini to‘g‘ri hisoblaydi", () => {
  const state = model.calculate({ defect: 0.03, nucleons: 4 }, 0);
  assert.ok(Math.abs(state.energy - 27.9448230726) < 1e-9);
  assert.ok(Math.abs(state.perNucleon - 6.98620576815) < 1e-9);
  assert.equal(state.warning, "");
  assert.deepEqual(model.results.map((result) => result.key), ["energy", "perNucleon"]);
  assert.equal(model.static, true);
  assert.equal(model.title, "Yadroning bog'lanish energiyasi");
  assert.equal(model.params.find((param) => param.key === "defect").max, 0.038);
  assert.equal(model.params.find((param) => param.key === "nucleons").min, 4);
  assert.match(model.model, /izotopga xos bo‘lmagan/);
});

test("144-mavzu fizik jihatdan mumkin bo‘lmagan chegaraviy qiymatni to‘xtatadi va katta energiyani ogohlantiradi", () => {
  const impossibleMass = calculateNuclearBinding(base.calculate, { defect: 2, nucleons: 2 });
  assert.equal(impossibleMass.energy, null);
  assert.match(impossibleMass.warning, /umumiy massasidan kichik/);

  const overBound = calculateNuclearBinding(base.calculate, { defect: 0.1, nucleons: 4 });
  assert.ok(overBound.perNucleon > 9);
  assert.match(overBound.warning, /9 MeV/);
});
