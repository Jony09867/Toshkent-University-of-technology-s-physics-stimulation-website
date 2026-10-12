import test from "node:test";
import assert from "node:assert/strict";
import { SimulationCanvas } from "../src/components/SimulationCanvas.js";
import { allConfigs, defaults } from "../src/data/configs.js";

function touchEvent(type, touches, changedTouches = touches) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, {
    touches: { value: touches },
    changedTouches: { value: changedTouches },
  });
  return event;
}

test("bo‘sh sahnada mobil touch eski parametr boshqaruvini saqlaydi", () => {
  const previousWindow = globalThis.window;
  const fakeWindow = new EventTarget();
  globalThis.window = fakeWindow;
  const canvas = new EventTarget();
  canvas.style = {};
  canvas.getContext = () => ({});
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 460 });
  const changes = [];
  let simulation;

  try {
    simulation = new SimulationCanvas(canvas, (key, value) => changes.push({ key, value }));
    simulation.state = {
      config: { key: "ohm", params: [{ key: "voltage", min: 0, max: 20, value: 12, level: 0 }] },
      p: { voltage: 12 }, s: {}, level: 2,
    };

    canvas.dispatchEvent(new Event("mousedown", { cancelable: true }));
    assert.equal(changes.length, 0, "sichqonchada bo‘sh joy boshqaruvga aylanmaydi");

    const first = { identifier: 1, clientX: 400, clientY: 230 };
    const moved = { identifier: 1, clientX: 440, clientY: 230 };
    canvas.dispatchEvent(touchEvent("touchstart", [first]));
    fakeWindow.dispatchEvent(touchEvent("touchmove", [moved]));
    assert.equal(changes.at(-1).key, "voltage");
    assert.ok(changes.at(-1).value > 12);

    const other = { identifier: 2, clientX: 600, clientY: 230 };
    canvas.dispatchEvent(touchEvent("touchstart", [moved, other], [other]));
    fakeWindow.dispatchEvent(touchEvent("touchend", [moved], [other]));
    const count = changes.length;
    fakeWindow.dispatchEvent(touchEvent("touchmove", [{ ...moved, clientX: 460 }]));
    assert.equal(changes.length, count + 1, "ikkinchi barmoq ketganda sudrash davom etadi");

    fakeWindow.dispatchEvent(touchEvent("touchcancel", [], [moved]));
    assert.equal(canvas.style.cursor, "default");
    const afterCancel = changes.length;
    fakeWindow.dispatchEvent(touchEvent("touchmove", [{ ...moved, clientX: 480 }]));
    assert.equal(changes.length, afterCancel, "bekor qilingan sudrash qayta ishlamaydi");
  } finally {
    simulation?.destroy();
    globalThis.window = previousWindow;
  }
});

test("barcha simulyatsiyalarda barmoq bilan sahna boshqaruvi javob beradi", () => {
  const previousWindow = globalThis.window;
  const fakeWindow = new EventTarget();
  globalThis.window = fakeWindow;
  const canvas = new EventTarget();
  canvas.style = {};
  canvas.getContext = () => ({});
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 460 });
  const changes = [];
  let simulation;

  try {
    simulation = new SimulationCanvas(canvas, (key, value) => changes.push({ key, value }));
    for (const config of allConfigs) {
      const p = defaults(config, 2);
      simulation.state = { config, p, s: config.calculate(p, 1), level: 2 };
      const finger = { identifier: 1, clientX: 400, clientY: 230 };
      canvas.dispatchEvent(touchEvent("touchstart", [finger]));
      fakeWindow.dispatchEvent(touchEvent("touchmove", [{ ...finger, clientX: 440, clientY: 210 }]));
      assert.equal(changes.length, 1, `${config.id}: touch javob bermadi`);
      assert.ok(Number.isFinite(changes[0].value), `${config.id}: yaroqsiz qiymat`);
      changes.length = 0;
      fakeWindow.dispatchEvent(touchEvent("touchend", [], [finger]));
    }
  } finally {
    simulation?.destroy();
    globalThis.window = previousWindow;
  }
});
