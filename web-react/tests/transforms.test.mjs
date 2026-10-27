import { test } from 'vitest';
import assert from 'node:assert/strict';
import { Series } from '../src/domain/Series.js';
import { toIndex, toYoY, toCumulative, deflate, integrateRates, effectiveBase, applyMode } from '../src/domain/transforms.js';
import { close } from './helpers.mjs';

const level = (pts, extra = {}) => new Series({ id: 'x', label: 'X', unit: 'eur', kind: 'level', points: pts.map(([year, value]) => ({ year, value })), ...extra });
const rate = (pts) => new Series({ id: 'r', label: 'R', unit: 'pct', kind: 'rate', points: pts.map(([year, value]) => ({ year, value })) });

test('integrateRates encadena las tasas', () => {
  const m = integrateRates(rate([[2001, 10], [2002, 10]]));
  assert.ok(close(m.get(2001), 110));
  assert.ok(close(m.get(2002), 121));
});

test('integrateRates se detiene ante un hueco', () => {
  const m = integrateRates(rate([[2001, 10], [2003, 10]]));
  assert.deepEqual([...m.keys()], [2001]);
});

test('toIndex: base = 100 y marca el cálculo', () => {
  const s = toIndex(level([[2000, 50], [2001, 75]]), 2000);
  assert.equal(s.get(2000), 100);
  assert.equal(s.get(2001), 150);
  assert.equal(s.unit, 'index');
  assert.equal(s.isOfficial, false);
  assert.match(s.displayLabel, /\*$/);
});

test('toIndex: año base ausente → null', () => {
  assert.equal(toIndex(level([[2000, 50]]), 1999), null);
});

test('toIndex de una tasa: encadena y rebasa', () => {
  const s = toIndex(rate([[2001, 10], [2002, 10], [2003, 10]]), 2001);
  assert.ok(close(s.get(2002), 110));
  assert.ok(close(s.get(2003), 121));
});

test('toYoY de niveles; de tasas es la propia serie', () => {
  const y = toYoY(level([[2000, 100], [2001, 110], [2003, 121]]));
  assert.deepEqual(y.years, [2001]); // 2003 no tiene 2002
  assert.ok(close(y.get(2001), 10));
  const r = toYoY(rate([[2001, 3]]));
  assert.equal(r.get(2001), 3);
  assert.equal(r.isOfficial, true);
});

test('toCumulative = índice − 100', () => {
  const c = toCumulative(level([[2000, 100], [2001, 125]]), 2000);
  assert.equal(c.get(2001), 25);
  assert.equal(c.unit, 'pct_cum');
});

test('deflate: salario que sube lo mismo que los precios no cambia en términos reales', () => {
  const wage = level([[2001, 100], [2002, 110]]);
  const prices = rate([[2001, 5], [2002, 10]]);
  const real = deflate(wage, prices, 2001);
  assert.ok(close(real.get(2001), 100));
  assert.ok(close(real.get(2002), 100)); // 110 / 1,10
  assert.equal(real.real, true);
  assert.match(real.displayLabel, /\*$/);
});

test('deflate sin año base en los precios → null', () => {
  assert.equal(deflate(level([[2001, 1]]), rate([[2002, 1]]), 2001), null);
});

test('effectiveBase: primer año común ≥ pedido', () => {
  const a = level([[2000, 1], [2001, 1], [2002, 1]]);
  const b = level([[2001, 1], [2002, 1]]);
  assert.equal(effectiveBase([a, b], 2000), 2001);
  assert.equal(effectiveBase([a, b], 2002), 2002);
  assert.equal(effectiveBase([a, b], 2005), null);
});

test('applyMode desconocido lanza error', () => {
  assert.throws(() => applyMode(level([[2000, 1]]), 'nope', 2000));
});
