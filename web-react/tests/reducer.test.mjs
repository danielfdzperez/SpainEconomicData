import { describe, expect, test } from 'vitest';
import { assignSlots } from '../src/charts/colors.js';
import { canAdd, createExplorerReducer } from '../src/state/explorerReducer.js';
import { loadRepo } from './helpers.mjs';

const repo = await loadRepo();
const reducer = createExplorerReducer(repo);
const base = { selected: [], mode: 'index', base: null, from: null, to: null, context: true };

describe('explorerReducer', () => {
  test('toggle añade y quita', () => {
    const a = reducer(base, { type: 'toggle', key: 'ipc_es' });
    expect(a.selected).toEqual(['ipc_es']);
    expect(reducer(a, { type: 'toggle', key: 'ipc_es' }).selected).toEqual([]);
  });

  test('en valores originales rechaza series con otra unidad', () => {
    const s = { ...base, mode: 'raw', selected: ['sal_media_es_t'] };
    expect(canAdd(repo, s, 'ipc_es').ok).toBe(false);
    expect(reducer(s, { type: 'toggle', key: 'ipc_es' })).toBe(s);
    expect(canAdd(repo, s, 'sal_mediana_es_t').ok).toBe(true);
  });

  test('en índice se pueden mezclar unidades', () => {
    const s = { ...base, selected: ['sal_media_es_t'] };
    expect(canAdd(repo, s, 'ipc_es').ok).toBe(true);
  });

  test('máximo 8 series', () => {
    const ids = ['ipca_cp00', 'ipca_cp01', 'ipca_cp02', 'ipca_cp03', 'ipca_cp04', 'ipca_cp05', 'ipca_cp06', 'ipca_cp07'];
    const s = { ...base, selected: ids };
    expect(canAdd(repo, s, 'ipc_es').ok).toBe(false);
  });

  test('pasar a raw descarta las series de otra unidad que la primera', () => {
    const s = { ...base, selected: ['sal_media_es_t', 'ipc_es', 'sal_media_es_t~real'] };
    expect(reducer(s, { type: 'mode', mode: 'raw' }).selected).toEqual(['sal_media_es_t', 'sal_media_es_t~real']);
  });

  test('switchReal alterna la versión real', () => {
    const a = reducer(base, { type: 'switchReal', id: 'sal_media_es_t', real: true });
    expect(a.selected).toEqual(['sal_media_es_t~real']);
    expect(reducer(a, { type: 'switchReal', id: 'sal_media_es_t', real: true }).selected).toEqual([]);
  });

  test('reset-range limpia rango y año base; load sustituye todo', () => {
    const s = { ...base, from: 2010, to: 2020, base: 2012 };
    expect(reducer(s, { type: 'reset-range' })).toMatchObject({ from: null, to: null, base: null });
    expect(reducer(s, { type: 'load', state: base })).toEqual(base);
  });
});

describe('assignSlots', () => {
  test('el color sigue a la serie aunque se quiten otras', () => {
    const a = assignSlots(new Map(), ['x', 'y', 'z']);
    expect([...a.values()]).toEqual([1, 2, 3]);
    const b = assignSlots(a, ['x', 'z']);
    expect(b.get('z')).toBe(3);
    const c = assignSlots(b, ['x', 'z', 'w']);
    expect(c.get('w')).toBe(2); // reutiliza el hueco libre
  });
});
