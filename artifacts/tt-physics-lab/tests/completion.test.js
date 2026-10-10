import test from "node:test";
import assert from "node:assert/strict";
import {
  isConfigCompleted,
  isCurrentCompleted,
  isTopicCompleted,
  toggleCompletion,
} from "../src/data/completion.js";

const shared = { id: "uniform", topicNumbers: [1, 2] };
const first = { ...shared, topicNumber: 1 };
const second = { ...shared, topicNumber: 2 };

test("umumiy modeldagi mavzuni belgilash qo‘shni mavzuni belgilamaydi", () => {
  const completed = new Set();
  assert.equal(toggleCompletion(first, completed), true);
  assert.equal(isTopicCompleted({ number: 1, sim: shared }, completed), true);
  assert.equal(isTopicCompleted({ number: 2, sim: shared }, completed), false);
  assert.equal(isCurrentCompleted(second, completed), false);
  assert.equal(isConfigCompleted(shared, completed), true);
  assert.equal(toggleCompletion(first, completed), false);
  assert.equal(isConfigCompleted(shared, completed), false);
});

test("oldingi saqlangan tajriba natijasi saqlanadi, yagona mavzu esa bekor qilinadi", () => {
  const unique = { id: "lens", topicNumbers: [127], topicNumber: 127 };
  const completed = new Set(["lens", "uniform"]);
  assert.equal(isCurrentCompleted(unique, completed), true);
  assert.equal(isTopicCompleted({ number: 127, sim: unique }, completed), true);
  assert.equal(isTopicCompleted({ number: 2, sim: shared }, completed), false);
  assert.equal(toggleCompletion(unique, completed), false);
  assert.equal(completed.has("lens"), false);
  assert.equal(completed.has("uniform"), true);
});
