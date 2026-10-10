import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";

const discharge = allConfigs.find((config) => config.key === "discharge");

test("havo razryadi taxminiy E = U/d chegarasining ikki tomonida to‘g‘ri", () => {
  const p = defaults(discharge);
  const below = discharge.calculate({ ...p, voltage: 14.5, gap: 5 }, 2);
  const edge = discharge.calculate({ ...p, voltage: 15, gap: 5 }, 2);
  const above = discharge.calculate({ ...p, voltage: 20, gap: 5 }, 2);
  assert.equal(below.breakdown, 0);
  assert.equal(edge.breakdown, 1);
  assert.equal(above.breakdown, 1);
  assert.equal(edge.field, 3e6);
  assert.equal(edge.thresholdVoltage, 15);
  assert.equal(above.warning, undefined);
});

test("elektrodlar oralig‘i oshsa, bir xil kuchlanishda maydon kamayadi", () => {
  const near = discharge.calculate({ voltage: 12, gap: 2 }, 0);
  const far = discharge.calculate({ voltage: 12, gap: 6 }, 0);
  assert.equal(near.field, 3 * far.field);
  assert.equal(near.breakdown, 1);
  assert.equal(far.breakdown, 0);
  assert.equal(discharge.visual, "gasDischarge");
  assert.equal(discharge.static, false);
});
