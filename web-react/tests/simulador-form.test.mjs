/** Formulario del simulador: del texto escrito a las entradas del dominio, y los avisos. */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { avisos, defaultForm, nominaInput, num, serviciosInput, tipoAtEp } from '../src/state/simForm.js';
import { calcularNomina } from '../src/domain/payroll.js';
import { formatEuro, formatInt, formatShare } from '../src/core/format.js';
import { loadRepo } from './helpers.mjs';

const repo = await loadRepo();
const P = await repo.simParams();

test('num: acepta coma decimal y devuelve el valor por defecto con texto vacío o raro', () => {
  assert.equal(num('1,5'), 1.5);
  assert.equal(num(' 12 '), 12);
  assert.equal(num(''), 0);
  assert.equal(num('abc', 7), 7);
  assert.equal(num(undefined), 0);
  assert.equal(num(NaN, 3), 3);
});

test('valores de partida: sueldo, 14 pagas y la media nacional de consultas en toda la vida', () => {
  const f = defaultForm(P);
  assert.equal(f.sueldo, '2000');
  assert.equal(f.pagas, 14);
  assert.equal(f.frecuenciaModo, 'vida');
  assert.equal(f.cabecera, '200', '5 al año × 40 años');
  assert.equal(f.especialista, '76', '1,9 al año × 40 años');
  assert.equal(Object.keys(f.educacion).length, 7);
  assert.equal(f.educacion.primaria.anios, '6');
});

test('nominaInput: la actividad elegida fija el tipo de AT/EP', () => {
  const f = defaultForm(P);
  assert.equal(tipoAtEp(f, P), 1.5);
  assert.equal(nominaInput({ ...f, actividad: '41' }, P).atEp, 6.7);
  assert.equal(nominaInput({ ...f, actividad: 'no-existe' }, P).atEp, 1.5);
  const r = calcularNomina(nominaInput({ ...f, actividad: '41' }, P), P.nomina);
  const at = r.empresa.ss.items.find((i) => i.id === 'at_ep');
  assert.equal(at.tipo, 6.7);
});

test('nominaInput: sueldo vacío o negativo es 0 y las pagas sólo son 12 o 14', () => {
  const f = defaultForm(P);
  assert.equal(nominaInput({ ...f, sueldo: '' }, P).brutoMensual, 0);
  assert.equal(nominaInput({ ...f, sueldo: '-3' }, P).brutoMensual, 0);
  assert.equal(nominaInput({ ...f, pagas: '12' }, P).pagas, 12);
  assert.equal(nominaInput({ ...f, pagas: 'x' }, P).pagas, 14);
});

test('serviciosInput: pasa números, no textos', () => {
  const f = { ...defaultForm(P), edad: '35', nochesHospital: '4', viajesSemana: '10' };
  const e = serviciosInput(f);
  assert.equal(e.edad, 35);
  assert.equal(e.salud.nochesHospital, 4);
  assert.equal(e.salud.cabecera, 200);
  assert.equal(e.salud.frecuenciaModo, 'vida');
  assert.equal(e.transporte.viajesSemana, 10);
  assert.ok(e.educacion.every((x) => typeof x.anios === 'number'));
});

test('avisos: sueldo vacío, bajo la base mínima, desmedido y años incoherentes', () => {
  const f = defaultForm(P);
  const campos = (x) => avisos(x, P).map((a) => a.campo);
  assert.deepEqual(campos(f), []);
  assert.ok(campos({ ...f, sueldo: '0' }).includes('sueldo'));
  assert.ok(campos({ ...f, sueldo: '1000', pagas: 12 }).includes('sueldo'));
  assert.ok(!campos({ ...f, sueldo: '1000', pagas: 12, jornadaCompleta: false }).includes('sueldo'));
  assert.ok(campos({ ...f, sueldo: '90000' }).includes('sueldo'));
  assert.ok(campos({ ...f, edad: '30', aniosTrabajados: '25' }).includes('aniosTrabajados'));
  assert.ok(campos({ ...f, edad: '30', aniosTransporte: '40' }).includes('aniosTransporte'));
  assert.ok(campos({ ...f, edad: '130' }).includes('edad'));
});

test('formato: miles siempre con punto, también con cuatro cifras', () => {
  assert.equal(formatEuro(1579), '1.579 €');
  assert.equal(formatEuro(1579.5, { decimals: 2 }), '1.579,50 €');
  assert.equal(formatEuro(-1316, { decimals: 2 }), '-1.316,00 €');
  assert.equal(formatInt(8320), '8.320');
  assert.equal(formatShare(40.26), '40,3 %');
  assert.equal(formatEuro(NaN), '—');
});
