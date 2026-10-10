import test from "node:test";
import assert from "node:assert/strict";
import { topicNavigation } from "../src/data/topic-navigation.js";

const configs = [{ id: "uniform", title: "Tekis harakat" }, { id: "newton", title: "Nyuton qonuni" }];
const topics = [
  { number: 1, title: "Asosiy tushunchalar", sim: configs[0] },
  { number: 2, title: "Tekis harakat", sim: configs[0] },
  { number: 3, title: "Kuch", sim: configs[1] },
];

test("katalog mavzulari o‘z tartibida ochiladi va chegarada aylanmaydi", () => {
  assert.deepEqual(topicNavigation({ ...configs[0], topicNumber: 1, topicTitle: topics[0].title }, topics, configs), {
    label: "MAVZU 01",
    title: "Asosiy tushunchalar",
    previous: null,
    next: "#/sim/uniform?topic=2",
  });
  assert.deepEqual(topicNavigation({ ...configs[1], topicNumber: 3, topicTitle: topics[2].title }, topics, configs), {
    label: "MAVZU 03",
    title: "Kuch",
    previous: "#/sim/uniform?topic=2",
    next: null,
  });
});

test("katalogsiz tajribalar faqat mavjud qo‘shnilariga olib boradi", () => {
  assert.equal(topicNavigation(configs[0], topics, configs).previous, null);
  assert.equal(topicNavigation(configs[0], topics, configs).next, "#/sim/newton");
  assert.equal(topicNavigation(configs[1], topics, configs).next, null);
});
