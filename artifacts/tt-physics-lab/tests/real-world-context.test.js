import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";
import {
  everydayExamples,
  engineeringUses,
} from "../src/data/real-world.js";
import { liveEquation } from "../src/components/LiveEquation.js";
import { renderSimulation } from "../src/simulations/render.js";

test("Har bir tajribada kundalik hayot misoli bor", () => {
  assert.equal(allConfigs.length, 86);
  for (const c of allConfigs) {
    const text = everydayExamples[c.key] || c.example || "";
    assert.ok(
      typeof text === "string" && text.trim().length >= 20,
      `${c.key}: everyday example missing`,
    );
  }
});

test("Katalog tajribalarida generic boilerplate qolmagan", () => {
  const boilerplate = [
    "Bu qonun o‘lchov natijalarini hisoblash",
    "Model parametrlarini o‘zgartiring",
  ];
  for (const c of allConfigs) {
    const text = engineeringUses[c.key] || c.engineering || "";
    assert.ok(text.trim().length >= 20, `${c.key}: engineering text missing`);
    for (const generic of boilerplate)
      assert.ok(
        !text.startsWith(generic),
        `${c.key}: generic boilerplate remains`,
      );
  }
});

test("Jonli formula barcha simlarda sonlarga almashadi", () => {
  for (const c of allConfigs) {
    const p = defaults(c);
    for (const t of [0, c.duration / 2]) {
      const s = c.calculate(p, t);
      const eq = liveEquation(c, p, s, t);
      assert.ok(typeof eq === "string" && eq.length > 0, `${c.key}: empty`);
      assert.ok(!/undefined/.test(eq), `${c.key}: contains undefined`);
    }
  }
});

test("Vizual tajribalarda canvas chipi chiziladi", () => {
  for (const c of allConfigs.filter((x) => x.visual)) {
    const p = defaults(c),
      s = c.calculate(p, 1),
      fills = [];
    const ctx = new Proxy(
      {},
      {
        get: (_, name) => (...args) => {
          if (name === "fillText") fills.push(args[0]);
        },
        set: () => true,
      },
    );
    renderSimulation(ctx, { config: c, p, s, t: 1 });
    assert.ok(fills.length > 0, `${c.key}: chip never drawn`);
    const chip = fills[fills.length - 1];
    assert.ok(
      typeof chip === "string" && chip.length > 0 && !/undefined/.test(chip),
      `${c.key}: bad chip text`,
    );
  }
});
