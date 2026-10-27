import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadRepo } from './helpers.mjs';
import { equivalentAmount, priceYears } from '../src/domain/inflation.js';

test('equivalentAmount: 1000 € de 2008 en euros de 2024 según el IPC encadenado', async () => {
  const repo = await loadRepo();
  const ipc = repo.series('ipc_es');
  const r = equivalentAmount(ipc, 1000, 2008, 2024);
  assert.ok(Math.abs(r.factor - 1.3512464928592) < 1e-9);
  assert.ok(Math.abs(r.value - 1351.2464928592) < 1e-6);
});

test('equivalentAmount: mismo año = misma cantidad; año sin dato = null', async () => {
  const repo = await loadRepo();
  const ipc = repo.series('ipc_es');
  assert.equal(equivalentAmount(ipc, 500, 2010, 2010).value, 500);
  assert.equal(equivalentAmount(ipc, 500, 1990, 2010), null);
  assert.ok(priceYears(ipc).includes(2025));
});
