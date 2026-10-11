import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import { renderCatalog } from "../src/simulations/catalog-render.js";

test("asosiy Rentgen tajribasida kuchlanish boshqaradigan trubka chiziladi", () => {
  const config = allConfigs.find((item) => item.key === "xray");
  const labels = [];
  const shapes = [];
  const context = new Proxy({}, {
    get(_, name) {
      return (...args) => {
        if (name === "fillText") labels.push(String(args[0]));
        if (["fillRect", "lineTo"].includes(name)) shapes.push([name, ...args]);
      };
    },
    set() { return true; },
  });
  const p = defaults(config);
  renderCatalog(context, { config, p, s: config.calculate(p), t: 0 },
    { ink: "#fff", muted: "#aaa", line: "#555", floor: "#111" });
  assert.ok(labels.some((label) => label.includes("KATOD")));
  assert.ok(labels.some((label) => label.includes("Rentgen nuri")));
  assert.ok(labels.some((label) => label.includes("Eₘₐₓ")));
  assert.ok(shapes.length > 20);
});
