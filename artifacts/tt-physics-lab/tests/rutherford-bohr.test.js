import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs } from "../src/data/configs.js";
import { calculateRutherfordBohr, rutherfordTrajectory } from "../src/physics/rutherford-bohr.js";

const gold = { energy: 5, impact: 20, z: 79, upper: 3 };

test("141-mavzu Rezerford yo‘lini va vodorodning Bor o‘tishini ko‘rsatadi", () => {
  const config = allConfigs.find(item => item.key === "rutherford");
  assert.equal(config.static, false);
  assert.deepEqual(config.topicNumbers, [141]);
  assert.equal(config.params.find(item => item.key === "upper").value, 3);
  const state = config.calculate(gold, 0);
  assert.ok(state.path.length > 400);
  assert.ok(state.duration > 0);
  assert.ok(Math.abs(state.angle - 97.36) < 0.02);
  assert.ok(Math.abs(state.wavelength * 1e9 - 656.1) < 1);
});

test("Kulon sochilishi chegaralari va eng yaqin masofa mos keladi", () => {
  const headOn = calculateRutherfordBohr({ ...gold, impact: 0 });
  const farther = calculateRutherfordBohr({ ...gold, impact: 100 });
  const faster = calculateRutherfordBohr({ ...gold, energy: 10 });
  assert.equal(headOn.angle, 180);
  assert.ok(Math.abs(headOn.closest - headOn.headOn) < 1e-20);
  assert.ok(farther.angle < calculateRutherfordBohr(gold).angle);
  assert.ok(faster.angle < calculateRutherfordBohr(gold).angle);
  assert.ok(faster.closest < calculateRutherfordBohr(gold).closest);
});

test("alfa-zarrachaning masofasi yaqinlashib, so‘ng ortadi va vaqt monoton", () => {
  const track = rutherfordTrajectory(gold);
  assert.ok(track.points.every((point, index) => Number.isFinite(point.x) && Number.isFinite(point.y) &&
    Number.isFinite(point.t) && (index === 0 || point.t >= track.points[index - 1].t)));
  const distances = track.points.map(point => Math.hypot(point.x, point.y));
  const minimum = Math.min(...distances);
  assert.ok(Math.abs(minimum - track.closest * 1e15) / (track.closest * 1e15) < 0.005);
  assert.ok(distances[0] > minimum && distances.at(-1) > minimum);
  const middle = calculateRutherfordBohr(gold, track.duration / 2);
  const end = calculateRutherfordBohr(gold, track.duration);
  assert.ok(middle.pathIndex > 0 && middle.pathIndex < track.points.length - 1);
  assert.ok(Math.abs(end.x - track.points.at(-1).x) < 1e-8);
});

test("Bor spektri sath o‘zgarganda ko‘k tomonga siljiydi", () => {
  const red = calculateRutherfordBohr(gold);
  const blueGreen = calculateRutherfordBohr({ ...gold, upper: 4 });
  assert.ok(Math.abs(blueGreen.wavelength * 1e9 - 486) < 1);
  assert.ok(blueGreen.wavelength < red.wavelength);
  assert.ok(blueGreen.photon > red.photon);
  assert.equal(blueGreen.angle, red.angle);
});

test("noto‘g‘ri parametrlar yakunli ogohlantirish beradi", () => {
  for (const p of [{ ...gold, energy: 0 }, { ...gold, impact: -1 }, { ...gold, upper: 2 }]) {
    const state = calculateRutherfordBohr(p);
    assert.equal(state.angle, null);
    assert.ok(state.warning);
  }
});
