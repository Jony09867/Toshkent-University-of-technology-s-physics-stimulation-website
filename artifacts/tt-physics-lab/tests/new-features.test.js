import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { energyParts } from "../src/components/EnergyBar.js";
import { challengeFor } from "../src/components/ChallengeMode.js";

test("Energiya diagrammasi mexanik modellarda saqlanishni ko‘rsatadi", () => {
  for (const key of ["pendulum", "spring", "projectile"]) {
    const config = allConfigs.find((item) => item.key === key);
    const params = defaults(config);
    const state = config.calculate(params, config.duration / 3);
    const parts = energyParts(key, state, params);
    assert.ok(parts.total > 0, key);
    assert.ok(Math.abs(parts.total - parts.initial) < 1e-5 * parts.initial, key);
  }
});

test("Richag va otilgan jismda topshiriq avtomatik tekshiriladi", () => {
  for (const key of ["lever", "projectile"]) {
    const config = allConfigs.find((item) => item.key === key);
    const challenge = challengeFor(config);
    assert.ok(challenge?.target && typeof challenge.eval === "function", key);
    assert.equal(typeof challenge.eval(config.calculate(defaults(config), 0), defaults(config)), "boolean");
  }
});
