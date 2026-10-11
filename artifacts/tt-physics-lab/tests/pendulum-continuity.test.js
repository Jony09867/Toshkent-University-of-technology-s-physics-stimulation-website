import test from "node:test";
import assert from "node:assert/strict";
import { allConfigs, defaults } from "../src/data/configs.js";

const model = allConfigs.find(item => item.key === "pendulum");

test("mayatnikni ketma-ket yuritish va vaqtni orqaga surish bir xil holatni beradi", () => {
  const params = { ...defaults(model), length: 2.4, amplitude: 40, damping: .12 };
  let sequential;
  for (let time = 0; time <= 8; time += .04)
    sequential = model.calculate(params, time);
  sequential = model.calculate(params, 8);
  model.calculate({ ...params, length: 2.2 }, 0);
  const independent = model.calculate(params, 8);
  assert.ok(Math.abs(sequential.theta - independent.theta) < 1e-5);
  assert.ok(Math.abs(sequential.energy - independent.energy) < 1e-5);

  const rewound = model.calculate(params, 2);
  model.calculate({ ...params, damping: .2 }, 0);
  const independentEarlier = model.calculate(params, 2);
  assert.ok(Math.abs(rewound.theta - independentEarlier.theta) < 1e-6);
  assert.ok(Math.abs(rewound.energy - independentEarlier.energy) < 1e-6);
});
