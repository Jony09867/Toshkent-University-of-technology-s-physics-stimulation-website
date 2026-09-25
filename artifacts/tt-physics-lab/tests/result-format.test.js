import test from 'node:test';
import assert from 'node:assert/strict';
import { format, formatResult, resultCard } from '../src/components/ResultCard.js';

test('result formatting preserves missing values', () => {
  assert.equal(format(null), '—');
  assert.equal(format(undefined), '—');
  assert.equal(format(Number.NaN), '—');
  assert.equal(formatResult({ scale: 1000 }, null), '—');
  assert.match(resultCard({ key: 'peak', unit: 'rad/s' }, null), />—<\/strong>/);
});

test('result formatting applies finite scales', () => {
  assert.equal(formatResult({ scale: 1000 }, 0.003), '3');
  assert.equal(formatResult({}, 12.3456), '12.346');
});
