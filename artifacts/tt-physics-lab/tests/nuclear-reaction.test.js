import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import {
  calculateFusion,
  fusionEnergy,
  fusionMassDefect,
  fusionMasses,
  nuclearReactionVariant,
} from "../src/data/nuclear-reaction.js";

test("D–T sintezida nuklon va zaryad soni saqlanadi, Q massa farqiga mos", () => {
  const before = calculateFusion({ pairs: 2 }, 0);
  const after = calculateFusion({ pairs: 2 }, 7);
  assert.equal(before.beforeA, before.afterA);
  assert.equal(before.beforeZ, before.afterZ);
  assert.equal(after.energy, 2 * fusionEnergy);
  assert.equal(after.perReaction, fusionEnergy);
  assert.equal(before.energy, 0);
  assert.ok(Math.abs(fusionEnergy - 17.59) < 0.02);
  assert.ok(Math.abs(fusionMassDefect - (fusionMasses.deuterium + fusionMasses.tritium - fusionMasses.helium4 - fusionMasses.neutron)) < 1e-12);
});

test("145-mavzudagi jonli variant 142 va 144-mavzular modelini o‘zgartirmaydi", () => {
  const binding = allConfigs.find((config) => config.key === "binding");
  const reaction = nuclearReactionVariant(binding);
  assert.equal(binding.static, true);
  assert.equal(binding.visual, "nucleus");
  assert.equal(reaction.static, false);
  assert.equal(reaction.visual, "nuclearFusion");
  assert.equal(reaction.calculate({ pairs: 3 }, 7).energy, 3 * fusionEnergy);
});
