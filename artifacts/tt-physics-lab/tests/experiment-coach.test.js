import test from 'node:test';
import assert from 'node:assert/strict';
import { allConfigs, defaults } from '../src/data/configs.js';
import { compareParameter, coachMarkup } from '../src/components/ExperimentCoach.js';
import { catalogLessons } from '../src/data/catalog-lessons.js';

test('86 tajribada yo‘riqnoma va barcha parametrlar uchun taqqoslash mavjud', () => {
  for (const c of allConfigs) {
    const p = defaults(c, 2), original = { ...p };
    assert.match(coachMarkup(c, c.params), /Hisoblab tushuntirish/);
    for (const param of c.params) {
      for (const value of [param.min, param.max]) {
        const { rows } = compareParameter(c, p, param.key, value, c.duration / 4);
        assert.equal(rows.length, c.results.length, c.key);
        assert.ok(rows.every(row => ['up','down','same','unavailable'].includes(row.direction)), c.key);
        assert.deepEqual(p, original, 'Taqqoslash asosiy sozlamalarni o‘zgartirmaydi');
      }
    }
  }
});

test('Yangi katalog darslari mavzuga xos tushuntirishga ega', () => {
  for (const [key, lesson] of Object.entries(catalogLessons)) {
    assert.equal(allConfigs.find(c => c.key === key)?.lesson, lesson, key);
  }
  assert.equal(Object.keys(catalogLessons).length, allConfigs.length);
});

test('Tekis harakatda ikki hisob bir xil fizik vaqtda bajariladi', () => {
  const c = allConfigs.find(c => c.key === 'uniform');
  const p = { ...defaults(c), v0: 5, x0: 0 };
  const { rows } = compareParameter(c, p, 'v0', 10, 2);
  const x = rows.find(r => r.result.key === 'x');
  assert.equal(x.before, 10); assert.equal(x.after, 20); assert.equal(x.direction, 'up');
});

test('Mikroskopik qiymatlar nolga tenglashtirilmaydi, yo‘q qiymat o‘sish deb talqin qilinmaydi', () => {
  const fake = { params: [{ key:'x', min:0, max:2 }], results:[{ key:'result' }], calculate: p => ({ result: p.x === 0 ? null : p.x * 1e-30 }) };
  assert.equal(compareParameter(fake,{x:1},'x',2,0).rows[0].direction,'up');
  assert.equal(compareParameter(fake,{x:0},'x',2,0).rows[0].direction,'unavailable');
  assert.throws(() => compareParameter(fake,{x:1},'x',NaN,0));
  assert.throws(() => compareParameter(fake,{x:1},'x',3,0));
});

test('Fizik chegara ogohlantirishi taqqoslashda saqlanadi', () => {
  const c = allConfigs.find(c => c.key === 'heatEngine');
  const { warnings } = compareParameter(c, defaults(c), 'efficiency', c.params.find(p => p.key === 'efficiency').max, 0);
  assert.ok(warnings.length > 0);
});
