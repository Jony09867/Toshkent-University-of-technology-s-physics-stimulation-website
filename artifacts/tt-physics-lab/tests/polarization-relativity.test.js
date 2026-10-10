import test from "node:test";
import assert from "node:assert/strict";
import { models } from "../src/physics/catalog-engine.js";
import { LIGHT } from "../src/physics/constants.js";

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(Math.abs(expected), 1e-30), `${actual} != ${expected}`);

test("Malus qonuni: parallel, 45 daraja, tik va teskari o‘qlar", () => {
  for (const [angle, fraction] of [[0, 1], [45, 0.5], [90, 0], [180, 1]]) {
    const state = models.polarization({ angle, intensity: 80 });
    close(state.fraction, fraction);
    close(state.intensity, 80 * fraction);
  }
  assert.equal(models.polarization({ angle: 45, intensity: 0 }).intensity, 0);
  assert.equal(models.polarization({ angle: 45, intensity: -1 }).intensity, null);
});

test("Nisbiylik: 0.6c da gamma, vaqt, uzunlik va energiya", () => {
  const state = models.relativity({ beta: 0.6, interval: 2, length: 3, m: 2 });
  close(state.gamma, 1.25);
  close(state.time, 2.5);
  close(state.length, 2.4);
  close(state.kinetic, 0.5 * LIGHT ** 2);
  close(state.time * state.length, 6);
});

test("Nisbiylik: tinchlik, klassik limit va yorug‘lik tezligi chegarasi", () => {
  const params = { beta: 0, interval: 2, length: 3, m: 2 };
  assert.deepEqual(models.relativity(params), { gamma: 1, time: 2, length: 3, kinetic: 0 });
  close(models.relativity({ ...params, beta: 1e-9 }).kinetic, 0.5 * params.m * (LIGHT * 1e-9) ** 2);
  for (const beta of [1, -1, 1.1, NaN]) assert.equal(models.relativity({ ...params, beta }).gamma, null);
  for (const beta of [0.1, 0.6, 0.99]) {
    const state = models.relativity({ ...params, beta });
    assert.ok(state.time >= params.interval && state.length <= params.length);
    close(state.gamma, models.relativity({ ...params, beta: -beta }).gamma);
  }
});
