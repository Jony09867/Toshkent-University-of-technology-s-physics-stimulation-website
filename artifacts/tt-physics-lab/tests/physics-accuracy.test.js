import test from "node:test";
import assert from "node:assert/strict";
import * as physics from "../src/physics/engine.js";

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    `${actual} is not close to ${expected}`,
  );

test("kinematics and force models preserve their defining equations", () => {
  const motion = physics.motion({ x0: 3, v0: 4, a: 2 }, 2),
    newton = physics.newton({ m: 5, force: 20, mu: 0, slope: 0 }, 3),
    friction = physics.friction({ m: 5, normal: 49, mu: 0.2, v0: 8 }, 1);

  close(motion.x, 15);
  close(motion.v, 8);
  close(newton.net, newton.a * 5);
  close(friction.maxFriction * friction.distance, 0.5 * 5 * 8 ** 2);
});

test("air resistance reduces projectile range and obeys the no-drag limit", () => {
  const base = { v0: 20, angle: 45, h: 2, g: 9.8, m: 0.5 },
    ideal = physics.projectile({ ...base, drag: 0 }),
    resisted = physics.projectile({ ...base, drag: 0.15 });

  close(ideal.range, 20 * Math.cos(Math.PI / 4) * ideal.duration);
  assert.ok(resisted.range < ideal.range);
  assert.ok(resisted.height < ideal.height);
  assert.ok(resisted.impactSpeed > 0);
});

test("mechanical energy is conserved or accounted for as heat", () => {
  const ideal = physics.energy({ m: 2, h: 3, friction: false }, 17),
    damped = physics.energy({ m: 2, h: 3, friction: true }, 17);

  close(ideal.kinetic + ideal.potential, ideal.initial, 1e-7);
  close(damped.kinetic + damped.potential + damped.heat, damped.initial);
  assert.ok(damped.heat >= 0);
});

test("spring damping decreases total mechanical energy", () => {
  const params = { m: 1, k: 20, amplitude: 0.4, phase: 0, damping: 0.2 },
    start = physics.spring(params, 0),
    later = physics.spring(params, 5);

  assert.ok(later.energy < start.energy);
  assert.ok(later.envelope < start.envelope);
  close(start.period, 2 * Math.PI / start.omega);
});

test("fluid and gas models satisfy equilibrium and the ideal-gas law", () => {
  const floating = physics.buoyancy({ rho: 600, fluid: 1000, volume: 3 }, 15),
    gas = physics.gas({ temperature: 300, volume: 20, moles: 1, molarMass: 0.028 });

  close(floating.force, floating.weight, 1e-6);
  close(gas.pressure * 0.02, 8.31446261815324 * 300);
});

test("electrostatic and circuit models preserve force and power relationships", () => {
  const near = physics.coulomb({ q1: 3, q2: -2, r: 1 }),
    far = physics.coulomb({ q1: 3, q2: -2, r: 2 }),
    ohm = physics.ohm({ voltage: 12, resistance: 20 }),
    circuit = physics.circuit({ emf: 12, resistance: 10, internal: 2 });

  close(near.force / far.force, 4);
  assert.ok(near.signed < 0);
  close(ohm.power, ohm.current ** 2 * 20);
  close(circuit.power + circuit.loss, circuit.sourcePower);
});

test("induction and thin-lens models match their differential equations", () => {
  const params = { resistance: 10, speed: 1.2, turns: 50, field: 0.5 },
    t = 0.73,
    dt = 1e-5,
    state = physics.induction(params, t),
    next = physics.induction(params, t + dt),
    lens = physics.lens({ object: 1.2, focal: 0.5, height: 0.2 });

  close(state.emf, -params.turns * (next.flux - state.flux) / dt, 2e-5);
  close(1 / 0.5, 1 / 1.2 + 1 / lens.image);
  close(lens.magnification, -lens.image / 1.2);
});
