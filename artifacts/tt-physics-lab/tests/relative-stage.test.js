import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { renderCatalog } from "../src/simulations/catalog-render.js";

const config = allConfigs.find((item) => item.key === "relative");
const theme = { ink: "#fff", muted: "#aaa", line: "#555", floor: "#111" };

function boatAt(v1, v2, t) {
  const positions = [];
  const context = new Proxy({}, {
    get(_, name) {
      return (...args) => {
        if (name === "translate") positions.push(args);
      };
    },
    set() { return true; },
  });
  const p = { ...defaults(config), v1, v2 };
  renderCatalog(context, { config, p, s: config.calculate(p, t), t }, theme);
  return positions[0];
}

test("qayiq oqim yo'nalishiga mos siljiydi va chegarada qotmaydi", () => {
  const start = boatAt(10, 5, 0);
  const middle = boatAt(10, 5, 6);
  const end = boatAt(10, 5, 12);
  assert.ok(start[0] < middle[0] && middle[0] < end[0]);
  assert.ok(start[1] > middle[1] && middle[1] > end[1]);
  assert.ok(end[0] + 37 < 706 && end[1] - 13 > 105);
  const reverse = boatAt(10, -5, 12);
  assert.ok(reverse[1] > start[1]);
  assert.ok(reverse[1] + 13 < 361);
});
