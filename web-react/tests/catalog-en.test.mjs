import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parseCsvObjects } from '../src/data/csv.js';

const leer = (f) => parseCsvObjects(readFileSync(join(process.cwd(), 'public', 'data', f), 'utf8'));
const ES = /\b(el|la|los|las|del|para|con|una|que|por|sobre|entre|años?|salarios?|vivienda|hogares?|según|desde|hasta)\b/i;

describe('CSV en inglés', () => {
  const cat = leer('catalog.csv');
  const catEn = leer('catalog_en.csv');

  test('catalog_en.csv tiene las mismas series, en el mismo orden', () => {
    expect(catEn.map((r) => r.id)).toEqual(cat.map((r) => r.id));
  });

  test('cada campo traducido está vacío si y sólo si lo está el original', () => {
    for (const [i, r] of catEn.entries()) {
      for (const c of ['label', 'descripcion', 'lectura', 'fuente', 'nota_calculo', 'aviso']) {
        expect(Boolean(r[c]), `${r.id}.${c}`).toBe(Boolean(cat[i][c]));
      }
    }
  });

  test('las plantillas conservan los asteriscos y la fuente conserva «, code …»', () => {
    for (const [i, r] of catEn.entries()) {
      expect(r.label.endsWith('*'), r.id).toBe(cat[i].label.endsWith('*'));
      if (/, código /.test(cat[i].fuente)) expect(r.fuente, r.id).toMatch(/, code \w+/);
      if (/serie \w+/.test(cat[i].fuente)) expect(r.fuente, r.id).toMatch(/series \w+/);
    }
  });

  test('no queda español en los textos traducidos', () => {
    const mal = [];
    for (const r of catEn) {
      for (const c of ['label', 'descripcion', 'lectura', 'nota_calculo', 'aviso']) {
        if (ES.test(r[c])) mal.push(`${r.id}.${c}: ${r[c]}`);
      }
    }
    expect(mal.slice(0, 10)).toEqual([]);
  });

  test('glosario y sectores del PIB están completos', () => {
    const g = leer('glossary.csv'); const gEn = leer('glossary_en.csv');
    expect(gEn.map((r) => r.id)).toEqual(g.map((r) => r.id));
    const s = leer('pib_sectores.csv'); const sEn = leer('pib_sectores_en.csv');
    expect(sEn.map((r) => r.rama_id)).toEqual(s.map((r) => r.rama_id));
    for (const [i, r] of gEn.entries()) {
      for (const c of ['term', 'short', 'long', 'example']) expect(Boolean(r[c]), `${r.id}.${c}`).toBe(Boolean(g[i][c === 'term' ? 'term' : c]));
    }
    for (const r of sEn) for (const v of Object.values(r)) expect(v.trim()).not.toBe('');
  });
});
