import { test } from 'vitest';
import assert from 'node:assert/strict';
import { classifyInflation, classifyGrowth, inflationReading, purchasingPowerOf100, wageVsPrices, glyphFor, readPoint } from '../src/domain/interpret.js';
import { close } from './helpers.mjs';
import { Series } from '../src/domain/Series.js';

test('tramos de inflación', () => {
  assert.equal(classifyInflation(-0.5).tone, 'deflation');
  assert.equal(classifyInflation(0.4).tone, 'very-low');
  assert.equal(classifyInflation(2).tone, 'stable');
  assert.equal(classifyInflation(3.5).tone, 'elevated');
  assert.equal(classifyInflation(6.5).tone, 'high');
  assert.equal(classifyInflation(9).tone, 'very-high');
});

test('tramos de crecimiento', () => {
  assert.equal(classifyGrowth(-10.9).tone, 'collapse');
  assert.equal(classifyGrowth(-1).tone, 'contraction');
  assert.equal(classifyGrowth(0.5).tone, 'stagnation');
  assert.equal(classifyGrowth(2.6).tone, 'moderate');
  assert.equal(classifyGrowth(3.7).tone, 'strong');
  assert.equal(classifyGrowth(6.4).tone, 'boom');
});

test('poder de compra de 100 € con un 5,7 % de inflación', () => {
  assert.ok(close(purchasingPowerOf100(5.7), 94.607379, 1e-4));
  assert.match(inflationReading(2022, 5.7).text, /subieron un 5,7 %/);
});

test('el salario gana o pierde frente a los precios', () => {
  assert.equal(wageVsPrices(3, 5).verdict, 'pierde');
  assert.ok(close(wageVsPrices(3, 5).real, -1.9047619, 1e-5));
  assert.equal(wageVsPrices(6, 5).verdict, 'gana');
});

test('glifos', () => {
  assert.equal(glyphFor(1), '▲');
  assert.equal(glyphFor(-1), '▼');
  assert.equal(glyphFor(0), '■');
});

test('readPoint usa el tipo de serie', () => {
  const infl = new Series({ id: 'a', label: 'IPC', unit: 'pct', kind: 'rate', semantics: 'annual_change', meta: { interp: 'inflation' }, points: [{ year: 2022, value: 5.7 }] });
  assert.equal(readPoint(infl, 2022, 5.7).label, 'Inflación alta');
  const real = new Series({ id: 'b', label: 'W', unit: 'pct', kind: 'rate', semantics: 'annual_change', real: true, meta: {}, points: [{ year: 2022, value: -2 }] });
  assert.equal(readPoint(real, 2022, -2).tone, 'loss');
});
