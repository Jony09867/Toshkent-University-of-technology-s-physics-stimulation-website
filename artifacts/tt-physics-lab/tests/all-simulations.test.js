import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { sections } from "../src/data/sections.js";

test("All 26 simulations exist, calculate cleanly, and map across all 15 physics sections", async () => {
  assert.equal(allConfigs.length, 26, "Total simulations should be 26");

  // Every section must have at least 1 working simulation
  for (const s of sections) {
    const matching = allConfigs.filter((c) => c.section === s.id);
    assert.ok(
      matching.length >= 1,
      `Section ${s.id} (${s.title}) must have at least one simulation, found ${matching.length}`,
    );
  }

  // Every simulation must calculate valid numerical results for default params
  for (const c of allConfigs) {
    const p = defaults(c);
    const state = c.calculate(p, 1);
    assert.ok(state, `Simulation ${c.id} returned null/undefined`);

    for (const r of c.results) {
      const val = state[r.key];
      assert.ok(
        val !== undefined,
        `Simulation ${c.id} missing result key "${r.key}"`,
      );
      if (typeof val === "number") {
        assert.ok(
          !Number.isNaN(val),
          `Simulation ${c.id} result "${r.key}" is NaN`,
        );
      }
    }

    // Dynamic import verification
    const mod = await import(`../src/simulations/${c.section}/${c.id}.js`);
    assert.ok(mod.simulationConfig, `Failed to load simulationConfig for ${c.id}`);
    assert.equal(mod.simulationConfig.id, c.id);
  }
});
