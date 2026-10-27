import { test } from 'vitest';
import assert from 'node:assert/strict';
import { normalize, queryWords, filterMetas } from '../src/domain/search.js';
import { loadRepo } from './helpers.mjs';

const repo = await loadRepo();

test('normalize: sin tildes ni mayúsculas', () => {
  assert.equal(normalize('Hostelería ÑANDÚ'), 'hosteleria nandu');
  assert.deepEqual(queryWords('  vivienda   MADRID '), ['vivienda', 'madrid']);
  assert.deepEqual(queryWords('   '), []);
});

test('filterMetas: vacío devuelve todo; varias palabras se exigen todas', () => {
  const all = repo.allMeta;
  assert.equal(filterMetas(all, '').length, all.length);
  const ids = filterMetas(all, 'vivienda madrid').map((m) => m.id);
  assert.ok(ids.includes('ipv_mad_general'));
  assert.ok(!ids.includes('ipv_es_general'));
  assert.ok(filterMetas(all, 'hosteleria').some((m) => m.id === 'sal_sector_i'));
  assert.ok(filterMetas(all, 'paro menores').some((m) => m.id === 'paro_es_t_m25'));
  assert.equal(filterMetas(all, 'xyzxyz').length, 0);
});
