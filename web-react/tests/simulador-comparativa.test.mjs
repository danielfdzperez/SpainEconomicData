/**
 * Simulador: apartado «Estado o privado» (sueldo con y sin impuestos, privado en cuotas mensuales)
 * y la serie pública de alquiler en euros.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { calcularNomina } from '../src/domain/payroll.js';
import { economiaDeNomina } from '../src/domain/economia.js';
import { calcularServicios } from '../src/domain/services.js';
import { calcularComparativa } from '../src/domain/comparativa.js';
import { defaultForm, nominaInput, serviciosInput } from '../src/state/simForm.js';
import { loadRepo, close } from './helpers.mjs';

const repo = await loadRepo();
const P = await repo.simParams();

function caso(cambios = {}, opciones = {}) {
  const f = { ...defaultForm(P), ...cambios };
  const nomina = calcularNomina(nominaInput(f, P), P.nomina);
  const economia = economiaDeNomina(nomina);
  const servicios = calcularServicios(serviciosInput(f), P, { brutoProrrateado: economia.brutoMensual, netoMensual: economia.netoMensual });
  return { economia, servicios, nomina, c: calcularComparativa({ economia, servicios, opciones }) };
}

test('comparativa: con Estado es tu neto menos lo que pagas tú de escuela y transporte', () => {
  const { economia, servicios, c } = caso();
  const g = servicios.grupos;
  const pagos = (g.educacion.totales.pagoPersona + g.transporte.totales.pagoPersona) / 40;
  assert.ok(close(c.publica.sueldoAnual, economia.netoMensual * 12, 1e-9));
  assert.ok(close(c.publica.gastoAnual, pagos, 1e-9));
  assert.ok(close(c.publica.quedaAnual, economia.netoMensual * 12 - pagos, 1e-9));
  assert.equal(c.publica.pagos.salud, 0);
});

test('comparativa: sin impuestos es el bruto (o el coste de empresa) menos el equivalente privado', () => {
  const { economia, servicios, c } = caso();
  const g = servicios.grupos;
  const sg = servicios.seguro;
  const esperadoSalud = sg.primaAnual + sg.copagos / 40;
  assert.ok(close(c.sueldo.sinImpuestosAnual, economia.brutoAnual, 1e-9));
  assert.ok(close(c.privada.gastos.salud, esperadoSalud, 1e-9), 'seguro de entrada + copagos');
  assert.ok(close(c.privada.gastos.educacion, g.educacion.totales.equivalentePrivado / 40, 1e-9));
  assert.ok(close(c.privada.gastos.transporte, g.transporte.totales.equivalentePrivado / 40, 1e-9));
  assert.ok(close(c.privada.quedaAnual, economia.brutoAnual - c.privada.gastoAnual, 1e-9));
  assert.ok(close(c.diferenciaAnual, c.privada.quedaAnual - c.publica.quedaAnual, 1e-9));
  assert.equal(c.mejorPrivada, c.diferenciaAnual > 0);

  const coste = caso({}, { base: 'coste' }).c;
  assert.ok(close(coste.sueldo.sinImpuestosAnual, economia.brutoAnual + economia.reparto.ssEmpresa, 1e-9));
  assert.ok(coste.sueldo.sinImpuestosAnual > c.sueldo.sinImpuestosAnual);
});

test('comparativa: pagar cada visita usa el equivalente privado de la sanidad', () => {
  const v = caso({}, { salud: 'visitas' });
  assert.equal(v.c.salud, 'visitas');
  assert.ok(close(v.c.privada.gastos.salud, v.servicios.grupos.salud.totales.equivalentePrivado / 40, 1e-9));
  // con seguro con parto no hay copagos en la prima
  const completo = caso({ seguroTipo: 'completo' });
  assert.ok(close(completo.c.privada.gastos.salud, completo.servicios.seguro.primaAnual, 1e-9));
});

test('comparativa: el total en cuotas mensuales es la media mensual por los meses de vida', () => {
  const { servicios, c } = caso();
  const q = c.cuotas;
  assert.equal(c.meses, 480);
  assert.ok(close(q.conSeguro.totalVida, q.conSeguro.gastoMensual * 480, 1e-9));
  assert.ok(close(q.conSeguro.totalVida, servicios.seguro.total + servicios.seguro.copagos + servicios.grupos.educacion.totales.equivalentePrivado + servicios.grupos.transporte.totales.equivalentePrivado, 1e-9));
  assert.ok(close(q.pagandoVisitas.totalVida, servicios.totales.equivalentePrivado, 1e-9));
  assert.ok(close(q.seguroMensual, servicios.seguro.primaMensual, 1e-9));
});

test('comparativa: lo que no entra en la cuenta es lo aportado menos lo que cuestan los tres servicios', () => {
  const { economia, servicios, c } = caso();
  assert.ok(close(c.sueldo.impuestosAnual, economia.reparto.total, 1e-9));
  assert.ok(close(c.serviciosPublicoAnual, servicios.totales.puestoSistema / 40, 1e-9));
  assert.ok(close(c.restoImpuestos, economia.reparto.total - servicios.totales.puestoSistema / 40, 1e-9));
  assert.ok(c.restoImpuestos > 0);
});

test('comparativa: sin edad no hay división por cero', () => {
  const { c } = caso({ edad: '0' });
  assert.equal(c.publica.gastoAnual, 0);
  assert.ok(Number.isFinite(c.privada.quedaAnual));
  assert.equal(c.serviciosPublicoAnual, 0);
});
