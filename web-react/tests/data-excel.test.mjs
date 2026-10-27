/**
 * Contrasta la web con los valores que ya calculan los Excel (hoja Salario_vs_IPC de
 * 03_Coste_de_la_Vida.xlsx) y con cifras clave documentadas en CLAUDE.md.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { buildView } from '../src/domain/pipeline.js';
import { loadRepo, close } from './helpers.mjs';

const repo = await loadRepo();
const view = (selected, mode, base, from = 2008, to = 2024) => buildView(repo, { selected, mode, base, from, to });

test('catálogo y series cargan y son coherentes', () => {
  assert.ok(repo.allMeta.length >= 50);
  for (const m of repo.allMeta) {
    const s = repo.series(m.id);
    assert.equal(s.firstYear, m.primer_anio, m.id);
    assert.equal(s.lastYear, m.ultimo_anio, m.id);
  }
});

test('cifras clave 2024 (INE EAES)', () => {
  assert.ok(close(repo.series('sal_media_es_t').get(2024), 29540.26, 0.005));
  assert.ok(close(repo.series('sal_mediana_es_t').get(2024), 24497.17, 0.005));
  assert.ok(close(repo.series('sal_media_mad_t').get(2024), 34410.01, 0.005));
  assert.equal(repo.series('smi_anual').get(2026), 17094);
});

test('salario medio España real (2008=100): coincide con el Excel', () => {
  const v = view(['sal_media_es_t~real'], 'index', 2008);
  const s = v.series[0];
  assert.ok(close(s.get(2009), 102.053552596818, 1e-6));
  assert.ok(close(s.get(2013), 94.5269610660577, 1e-6));
  assert.ok(close(s.get(2024), 99.8997814255369, 1e-6));
});

test('salario mediano Madrid real (2008=100): coincide con el Excel', () => {
  const s = view(['sal_mediana_mad_t~real'], 'index', 2008).series[0];
  assert.ok(close(s.get(2024), 104.258860940129, 1e-6));
  assert.ok(close(s.get(2020), 101.700782087262, 1e-6));
});

test('salario nominal (2008=100): coincide con el Excel', () => {
  const s = view(['sal_media_es_t'], 'index', 2008).series[0];
  assert.ok(close(s.get(2009), 102.869981017592, 1e-6));
});

test('índice de precios España (2008=100) coincide con el acumulado del Excel', () => {
  const s = view(['ipc_es'], 'index', 2008).series[0];
  assert.ok(close(s.get(2024), 135.12464928592, 1e-6));
});

test('IPC acumulado 2002–2025: +72,3 % (España) y +70,2 % (Madrid)', () => {
  const es = view(['ipc_es'], 'cum', 2002, 2002, 2025).series[0];
  // base 2002 deja fuera la subida de 2002: comprobamos contra el índice dic 2001 = 100
  const idx = (id) => view([id], 'index', 2002, 2002, 2025).series[0].get(2025) * 1.04;
  assert.ok(close(idx('ipc_es'), 172.292044997947, 1e-6));
  assert.ok(es.get(2025) > 65);
});

test('raw: no mezcla unidades distintas', () => {
  const v = view(['sal_media_es_t', 'ipc_es', 'pib_nominal'], 'raw', null);
  assert.deepEqual(v.series.map((s) => s.id), ['sal_media_es_t']);
  assert.equal(v.errors.length, 2);
});

test('en índice sí se pueden mezclar salario, IPC y PIB', () => {
  const v = view(['sal_media_es_t', 'ipc_es', 'pib_nominal', 'sal_media_es_t~real'], 'index', 2008);
  assert.equal(v.series.length, 4);
  assert.equal(v.unit, 'index');
  assert.equal(v.base, 2008);
  for (const s of v.series) assert.ok(close(s.get(2008), 100));
});

test('base efectiva: si el IPC empieza en 2002 y se pide 1995, salta a 2002', () => {
  const v = buildView(repo, { selected: ['pib_nominal', 'ipc_es'], mode: 'index', base: 1995, from: 1995, to: 2025 });
  assert.equal(v.base, 2002);
});

test('marca de cálculo: lo oficial no lleva *, lo calculado sí', () => {
  assert.equal(repo.series('sal_media_es_t').displayLabel.endsWith('*'), false);
  assert.equal(repo.series('pib_nominal_g').displayLabel.endsWith('*'), true);
  const real = view(['sal_media_es_t~real'], 'raw', null).series[0];
  assert.ok(real.displayLabel.endsWith('*'));
  assert.ok(real.calc.join(' ').includes('IPC'));
});

test('raw con salario real: euros constantes del año base', () => {
  const s = view(['sal_media_es_t', 'sal_media_es_t~real'], 'raw', 2010, 2008, 2024);
  assert.equal(s.base, 2010);
  const [nom, real] = s.series;
  assert.ok(close(nom.get(2010), real.get(2010), 1e-6)); // coinciden en el año base
  assert.ok(real.get(2024) < nom.get(2024));            // con inflación acumulada, el real es menor
});

test('PIB: crecimiento real 2020 = -10,9 y 2025 = 2,6', () => {
  assert.equal(repo.series('pib_real_g').get(2020), -10.9);
  assert.equal(repo.series('pib_real_g').get(2025), 2.6);
});
