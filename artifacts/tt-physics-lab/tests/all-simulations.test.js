import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { sections } from "../src/data/sections.js";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

test("All 86 simulations exist, calculate cleanly, and map across all 15 physics sections", async () => {
  assert.equal(allConfigs.length, 86, "Total simulations should be 86");

  // Every section must have at least 1 working simulation
  for (const s of sections) {
    const matching = allConfigs.filter((c) => c.section === s.id);
    assert.ok(
      matching.length >= 1,
      `Section ${s.id} (${s.title}) must have at least one simulation, found ${matching.length}`,
    );
  }

  // Har bir model hisoblanadi; alohida modulga ega eski tajribalar ham ochiladi.
  let moduleCount = 0;
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

    const moduleUrl = new URL(`../src/simulations/${c.section}/${c.id}.js`, import.meta.url);
    if (existsSync(fileURLToPath(moduleUrl))) {
      const mod = await import(moduleUrl.href);
      assert.ok(mod.simulationConfig, `Failed to load simulationConfig for ${c.id}`);
      assert.equal(mod.simulationConfig.id, c.id);
      moduleCount++;
    }
  }
  assert.ok(moduleCount > 0, "Mavjud alohida tajriba modullari ham tekshirildi");
});
