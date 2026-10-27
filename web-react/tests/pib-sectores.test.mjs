/**
 * Reparto del PIB por ramas (INE, tabla 69070): integridad del CSV y cifras que publica el INE.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { parseCsvObjects } from '../src/data/csv.js';
import { buildSectorTree, flatten, pathTo, sectorView, vabTotal } from '../src/domain/sectores.js';
import { loadRepo, close } from './helpers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const csvText = await readFile(join(here, '..', 'public', 'data', 'pib_sectores.csv'), 'utf-8');
const rows = parseCsvObjects(csvText);
const tree = buildSectorTree(rows);
const repo = await loadRepo();
const pct = (x) => Math.round(x * 10) / 10;

test('la copia de la web es idéntica al CSV de datos_web (regenerar con tools/build_web_data.py)', async () => {
  const source = await readFile(join(here, '..', '..', 'datos_web', 'pib_sectores_vab_2024_2025.csv'), 'utf-8');
  assert.equal(csvText, source);
});

test('cada rama suma exactamente sus partes y hay 28 filas', () => {
  assert.equal(rows.length, 28);
  assert.equal(flatten(tree).length, 28);
  // buildSectorTree ya lanza si alguna suma no cuadra; aquí una prueba explícita con una fila alterada
  const broken = rows.map((r) => (r.rama_id === 'srv_hosteleria' ? { ...r, vab_2025_millones_eur: '102478' } : r));
  assert.throws(() => buildSectorTree(broken), /suman/);
});

test('el PIB del reparto es el de la serie anual del PIB', () => {
  assert.equal(tree.root.values[2025], repo.series('pib_nominal').get(2025));
  assert.equal(tree.root.values[2024], repo.series('pib_nominal').get(2024));
});

test('pesos sobre el PIB 2025: coinciden con la nota de prensa del INE', () => {
  const v = sectorView(tree, 'pib', { year: 2025, base: 'pib' });
  const by = Object.fromEntries(v.slices.map((s) => [s.node.id, pct(s.shareOfBase)]));
  assert.deepEqual(by, { agricultura: 2.8, industria: 14.0, construccion: 5.4, servicios: 68.5, impuestos: 9.4 });
  assert.ok(close(v.slices.reduce((a, s) => a + s.share, 0), 100, 1e-9));
});

test('pesos de las ramas de servicios sobre el PIB 2025 (INE)', () => {
  const v = sectorView(tree, 'servicios', { year: 2025, base: 'pib' });
  const by = Object.fromEntries(v.slices.map((s) => [s.node.id, pct(s.shareOfBase)]));
  assert.deepEqual(by, {
    srv_comercio_transporte_hosteleria: 22.0, srv_informacion: 3.8, srv_financieras: 4.6, srv_inmobiliarias: 10.1,
    srv_profesionales: 8.9, srv_publicos: 15.6, srv_otros: 3.5,
  });
  assert.equal(v.slices.length, 7);
  assert.ok(close(v.slices.reduce((a, s) => a + s.share, 0), 100, 1e-9));
  assert.equal(v.slices[0].node.id, 'srv_comercio_transporte_hosteleria'); // ordenado de mayor a menor
});

test('sobre el valor añadido no hay impuestos y los servicios pesan el 75,6 %', () => {
  const v = sectorView(tree, 'pib', { year: 2025, base: 'vab' });
  assert.equal(v.slices.some((s) => s.node.id === 'impuestos'), false);
  assert.equal(v.total, vabTotal(tree, 2025));
  assert.equal(v.total, 1531681);
  assert.equal(pct(v.slices.find((s) => s.node.id === 'servicios').share), 75.6);
  assert.ok(close(v.slices.reduce((a, s) => a + s.share, 0), 100, 1e-9));
});

test('variación nominal 2025/2024: coincide con la nota de prensa del INE', () => {
  const g = (id) => pct(sectorView(tree, 'pib').slices.find((s) => s.node.id === id).growth);
  assert.equal(g('agricultura'), 9.4);
  assert.equal(g('industria'), 3.9);
  assert.equal(g('construccion'), 11.0);
  assert.equal(g('servicios'), 4.8);
  assert.equal(g('impuestos'), 11.6);
  assert.equal(pct(sectorView(tree, 'pib').growth), 5.7);
  const fin = sectorView(tree, 'servicios').slices.find((s) => s.node.id === 'srv_financieras');
  assert.equal(pct(fin.growth), -5.2);
});

test('el color de una entidad es estable y no se repite entre hermanas (máx. 8)', () => {
  for (const n of flatten(tree)) {
    if (!n.children.length) continue;
    const slots = sectorView(tree, n.id).slices.map((s) => s.slot);
    assert.equal(new Set(slots).size, slots.length, n.id);
    assert.ok(slots.every((s) => s >= 0 && s <= 8), n.id);
  }
  const a = sectorView(tree, 'pib', { year: 2024 }).slices.find((s) => s.node.id === 'servicios').slot;
  const b = sectorView(tree, 'pib', { year: 2025, base: 'vab' }).slices.find((s) => s.node.id === 'servicios').slot;
  assert.equal(a, b);
  assert.equal(sectorView(tree, 'pib').slices.find((s) => s.node.id === 'impuestos').slot, 0);
});

test('camino hasta una subrama', () => {
  assert.deepEqual(pathTo(tree, 'srv_sanidad').map((n) => n.id), ['pib', 'servicios', 'srv_publicos', 'srv_sanidad']);
});

test('el glosario explica el valor añadido bruto', () => {
  assert.ok(repo.glossary('vab').long.includes('impuestos'));
});
