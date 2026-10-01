import test from "node:test";
import assert from "node:assert/strict";
import { EnergyConservationBar } from "../src/components/EnergyConservationBar.js";
import { simulationChallenges } from "../src/components/ChallengeMode.js";
import * as physics from "../src/physics/engine.js";

test("EnergyConservationBar verifies total energy conservation across physics models", () => {
  const bar = new EnergyConservationBar(null);

  // Pendulum model
  const pendParams = { mass: 1.5, length: 1.2, angle: 25 };
  const pendState = physics.pendulum(pendParams, 0.4);
  const pendEnergy = bar.computeEnergy("pendulum", pendParams, pendState, 0.4);
  assert.ok(pendEnergy.total > 0);
  assert.ok(Math.abs((pendEnergy.Ek + pendEnergy.Ep + pendEnergy.Q) - pendEnergy.total) < 1e-6);

  // Spring model
  const springParams = { m: 1, k: 30, amplitude: 0.4, phase: 0, damping: 0.1 };
  const springState = physics.spring(springParams, 1.2);
  const springEnergy = bar.computeEnergy("spring", springParams, springState, 1.2);
  assert.ok(springEnergy.total > 0);
  assert.ok(Math.abs((springEnergy.Ek + springEnergy.Ep + springEnergy.Q) - springEnergy.total) < 1e-6);

  // Projectile model
  const projParams = { m: 2, h: 10, v0: 15, angle: 45, g: 9.8, drag: 0.2 };
  const projState = physics.projectile(projParams, 0.8);
  const projEnergy = bar.computeEnergy("projectile", projParams, projState, 0.8);
  assert.ok(projEnergy.total > 0);
  assert.ok(Math.abs((projEnergy.Ek + projEnergy.Ep + projEnergy.Q) - projEnergy.total) < 1e-6);
});

test("Challenges verify physics targets and auto-grade correctly", () => {
  // Lever challenge
  const leverCh = simulationChallenges.lever[0];
  const balancedResult = leverCh.check({ m1: 4, l1: 1.5, m2: 2, l2: 3 }, { netTorque: 0 });
  assert.equal(balancedResult.passed, true);
  assert.equal(balancedResult.score, 100);

  const unbalancedResult = leverCh.check({ m1: 4, l1: 1.5, m2: 2, l2: 1 }, { netTorque: 39.2 });
  assert.equal(unbalancedResult.passed, false);

  // Projectile challenge
  const projCh = simulationChallenges.projectile[0];
  const hitResult = projCh.check({}, { range: 35.1 });
  assert.equal(hitResult.passed, true);

  const missResult = projCh.check({}, { range: 25.0 });
  assert.equal(missResult.passed, false);
});
