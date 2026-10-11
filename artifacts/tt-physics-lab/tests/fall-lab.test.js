import test from "node:test";
import assert from "node:assert/strict";
import { projectile } from "../src/physics/engine.js";
import { fallHeightAt, fallHeightControl, fallHeightHandle, renderFallScene } from "../src/simulations/fall-scene.js";

test("balandlik tutqichi ko'rsatilgan qiymatga mos keladi", () => {
  for (const height of [1, 12, 20, 37, 50]) {
    const handle = fallHeightHandle(height, 1, 50);
    assert.equal(handle.x, fallHeightControl.x);
    assert.ok(Math.abs(fallHeightAt(handle.y, 1, 50) - height) < 1e-9);
  }
  assert.equal(fallHeightAt(-100, 1, 50), 50);
  assert.equal(fallHeightAt(1000, 1, 50), 1);
});

test("havo qarshiligisiz sahna holati uchish formulalariga mos", () => {
  const p = { h: 20, v0: 8, g: 9.8, m: 0.2, drag: 0 };
  const time = 1.2;
  const state = projectile(p, time);
  assert.ok(Math.abs(state.x - p.v0 * time) < 1e-10);
  assert.ok(Math.abs(state.y - (p.h - p.g * time ** 2 / 2)) < 1e-10);
  assert.ok(Math.abs(state.vy + p.g * time) < 1e-10);
  assert.ok(Math.abs(state.duration - Math.sqrt(2 * p.h / p.g)) < 1e-10);
  assert.ok(projectile(p, state.duration).y < 1e-10);
});

test("qarshilik yoqilganda jism yerga yetadi va gorizontal masofa qisqaradi", () => {
  const p = { h: 20, v0: 8, g: 9.8, m: 0.2, drag: 0 };
  const ideal = projectile(p);
  const resisted = projectile({ ...p, drag: 0.08 });
  assert.ok(resisted.duration > ideal.duration);
  assert.ok(resisted.range < ideal.range);
  assert.ok(projectile({ ...p, drag: 0.08 }, resisted.duration).y < 1e-10);
});

test("gorizontal tezlik nol bo'lsa ham sahna chekli sonli chiziq chizadi", () => {
  const p = { h: 20, v0: 0, g: 9.8, m: 0.2, drag: 0 };
  let strokes = 0;
  const ctx = {
    clearRect() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
    setLineDash() {}, arc() {}, fill() {}, fillText() {},
    stroke() { strokes++; },
    createRadialGradient() { return { addColorStop() {} }; },
  };
  renderFallScene(ctx, {
    p, s: projectile(p, 0), t: 0, level: 0, compact: false,
    config: { params: [{ key: "h", min: 1, max: 50 }] },
  });
  assert.ok(strokes > 0 && strokes < 500);
});
