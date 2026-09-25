import test from "node:test";
import assert from "node:assert/strict";
import * as physics from "../src/physics/engine.js";

const close = (actual, expected, epsilon = 1e-12) =>
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `${actual} is not within ${epsilon} of ${expected}`,
  );

test("friction remains at rest and has no kinetic force after stopping", () => {
  const params = { m: 5, normal: 49, mu: 0.2, v0: 8 },
    atStop = physics.friction(
      params,
      params.v0 / ((params.mu * params.normal) / params.m),
    ),
    afterStop = physics.friction(params, 100),
    restarted = physics.friction(params, 0);

  assert.equal(atStop.stopped, true);
  assert.equal(afterStop.stopped, true);
  assert.equal(afterStop.v, 0);
  assert.equal(afterStop.a, 0);
  assert.equal(afterStop.f, 0);
  assert.equal(afterStop.maxFriction, 9.8);
  assert.equal(afterStop.x, afterStop.distance);

  assert.equal(restarted.stopped, false);
  assert.equal(restarted.v, params.v0);
  assert.equal(restarted.a, -(params.mu * params.normal) / params.m);
  assert.equal(restarted.f, params.mu * params.normal);
});

test("friction clamps invalid and negative elapsed time safely", () => {
  const params = { m: 5, normal: 49, mu: 0.2, v0: 8 },
    negative = physics.friction(params, -10),
    notANumber = physics.friction(params, Number.NaN),
    infinite = physics.friction(params, Number.POSITIVE_INFINITY);

  assert.deepEqual(
    { v: negative.v, x: negative.x, stopped: negative.stopped },
    { v: 8, x: 0, stopped: false },
  );
  assert.equal(notANumber.x, 0);
  assert.equal(notANumber.v, 8);
  assert.equal(infinite.stopped, true);
  assert.equal(infinite.x, infinite.distance);
});

test("a vertical projectile has exact zero horizontal component and range", () => {
  const initial = physics.projectile({ v0: 20, angle: 90, h: 0, g: 9.8 }),
    landed = physics.projectile(
      { v0: 20, angle: 90, h: 0, g: 9.8 },
      initial.duration,
    );

  assert.equal(initial.vx, 0);
  assert.equal(initial.impactVx, 0);
  assert.equal(initial.x, 0);
  assert.equal(initial.range, 0);
  assert.equal(initial.vy, 20);
  assert.equal(landed.vx, 0);
  assert.equal(landed.vy, 0);
  assert.equal(landed.x, 0);
  assert.equal(landed.y, 0);
  assert.equal(landed.landed, true);
});

test("projectile time is clamped and non-finite time cannot poison the state", () => {
  const params = { v0: 20, angle: 45, h: 0, g: 9.8 },
    beforeLaunch = physics.projectile(params, -1),
    atLaunch = physics.projectile(params, Number.NaN),
    afterLanding = physics.projectile(params, Number.POSITIVE_INFINITY);

  close(beforeLaunch.x, atLaunch.x);
  close(beforeLaunch.y, atLaunch.y);
  assert.equal(beforeLaunch.landed, false);
  assert.equal(afterLanding.landed, true);
  assert.equal(afterLanding.x, afterLanding.range);
  assert.equal(afterLanding.y, 0);
});

test("resonance represents a missing positive peak without returning a false frequency", () => {
  const noPositivePeak = physics.resonance({
      natural: 1,
      frequency: 1,
      damping: 1,
      drive: 0.25,
    }),
    dampedPeak = physics.resonance({
      natural: 2,
      frequency: 1,
      damping: 0.1,
      drive: 0.25,
    });

  assert.equal(noPositivePeak.peak, null);
  assert.ok(Number.isFinite(noPositivePeak.amplitude));
  assert.ok(Number.isFinite(noPositivePeak.x));
  close(dampedPeak.peak, Math.sqrt(3.98));
});

test("zero-emf circuit has zero useful output and no efficiency value", () => {
  const noOutput = physics.circuit({ emf: 0, resistance: 10, internal: 2 }),
    powered = physics.circuit({ emf: 12, resistance: 10, internal: 2 });

  assert.equal(noOutput.current, 0);
  assert.equal(noOutput.voltage, 0);
  assert.equal(noOutput.power, 0);
  assert.equal(noOutput.loss, 0);
  assert.equal(noOutput.efficiency, null);
  close(powered.efficiency, 100 * (10 / 12));
});

test("elapsed-time inputs are sanitized across stateful simulations", () => {
  const newtonAtStart = physics.newton({ m: 5, force: 20 }, Number.NaN),
    springAtStart = physics.spring({ m: 1, k: 4, amplitude: 0.5 }, -1),
    resonanceAtStart = physics.resonance(
      { natural: 1, frequency: 1, damping: 0.1, drive: 0.25 },
      Number.NaN,
    ),
    energyAtStart = physics.energy({ m: 2, h: 3 }, Number.POSITIVE_INFINITY),
    buoyancyAtStart = physics.buoyancy(
      { rho: 600, fluid: 1000, volume: 3 },
      Number.NaN,
    ),
    inductionAtStart = physics.induction(
      { resistance: 10, speed: 1, turns: 50, field: 0.5 },
      Number.NaN,
    );

  assert.equal(newtonAtStart.x, 0);
  assert.equal(newtonAtStart.v, 0);
  assert.equal(springAtStart.x, 0.5);
  close(springAtStart.v, 0);
  assert.ok(Number.isFinite(resonanceAtStart.amplitude));
  assert.ok(Number.isFinite(resonanceAtStart.x));
  assert.equal(energyAtStart.kinetic, 0);
  close(energyAtStart.potential, energyAtStart.initial);
  assert.equal(buoyancyAtStart.v, 0);
  assert.ok(Number.isFinite(buoyancyAtStart.depth));
  assert.ok(Object.values(inductionAtStart).every(Number.isFinite));
});
