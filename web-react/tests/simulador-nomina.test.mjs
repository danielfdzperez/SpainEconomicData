/**
 * Simulador: nómina, IRPF y coste de empresa. Se contrasta con los 7 casos de
 * datos_web/ejemplos_validacion_irpf_ss_2026.csv (copiados en data/sim) y con propiedades que
 * tienen que cumplirse siempre (el neto nunca baja al subir el bruto, todo cuadra, etc.).
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { calcularNomina, netoPorEuroExtra, reduccionRendimientosTrabajo, scaleBreakdown, scaleTax, cotizacionSolidaridad } from '../src/domain/payroll.js';
import { loadRepo, close } from './helpers.mjs';

const repo = await loadRepo();
const { nomina: P } = await repo.simParams();
const ejemplos = P.ejemplos;
const num = (v) => Number(v);
const casoDe = (e, extra = {}) => calcularNomina({ brutoMensual: num(e.bruto_anual) / 14, pagas: 14, atEp: 1.5, solidaridad: false, ...extra }, P);

test('hay siete casos de validación', () => {
  assert.equal(ejemplos.length, 7);
});

test('cada caso de validación coincide con el CSV (±0,01 €)', () => {
  for (const e of ejemplos) {
    const r = casoDe(e);
    const t = r.trabajador;
    const dentro = (got, want, what) => assert.ok(close(got, num(want), 0.011), `${e.referencia} · ${what}: ${got} ≠ ${want}`);
    dentro(r.base.anual, e.base_cotizacion_anual, 'base de cotización');
    dentro(t.ss.total, e.ss_trabajador, 'SS trabajador');
    dentro(t.irpf.rendimientoNeto, e.rendimiento_neto_trabajo, 'rendimiento neto');
    dentro(t.irpf.reduccion, e.reduccion_rendimientos_trabajo, 'reducción');
    dentro(t.irpf.baseLiquidable, e.base_liquidable, 'base liquidable');
    dentro(t.irpf.estatal.cuota, e.cuota_estatal, 'cuota estatal');
    dentro(t.irpf.autonomica.cuota, e.cuota_autonomica_madrid, 'cuota Madrid');
    dentro(t.irpf.total, e.irpf_total, 'IRPF');
    dentro(t.neto.anual, e.neto_anual, 'neto');
    dentro(r.empresa.ss.total, e.ss_empresa_con_at_ep_1_5pct, 'SS empresa');
    dentro(r.empresa.coste.anual, e.coste_total_empresa, 'coste empresa');
    assert.ok(close(r.reparto.pctAdministracionesSobreCoste, num(e.carga_total_pct_sobre_coste_empresa), 0.011), `${e.referencia} · carga total`);
    assert.ok(close(t.irpf.tipoMedio, num(e.irpf_pct_sobre_bruto), 0.011), `${e.referencia} · IRPF %`);
  }
});

test('las cuotas acumuladas de las escalas del CSV son coherentes con los tipos', () => {
  for (const scale of [P.irpf.escalaEstatal, P.irpf.escalaAutonomica]) {
    for (const t of scale) assert.ok(close(scaleTax(scale, t.desde), t.acumulada, 0.02), `acumulada en ${t.desde}`);
  }
});

test('desglose por tramos: suma de bases y de cuotas', () => {
  const rows = scaleBreakdown(P.irpf.escalaEstatal, 47101.53);
  assert.equal(rows.length, 4);
  assert.ok(close(rows.reduce((s, r) => s + r.baseEnTramo, 0), 47101.53, 1e-6));
  assert.ok(close(rows.reduce((s, r) => s + r.cuota, 0), scaleTax(P.irpf.escalaEstatal, 47101.53), 1e-6));
  assert.deepEqual(scaleBreakdown(P.irpf.escalaEstatal, 0), []);
  assert.equal(scaleTax(P.irpf.escalaEstatal, -5), 0);
});

test('la reducción por rendimientos del trabajo es continua en los umbrales', () => {
  const r = P.irpf.reduccion;
  assert.equal(reduccionRendimientosTrabajo(0, r), 7302);
  assert.equal(reduccionRendimientosTrabajo(r.umbral1, r), 7302);
  assert.ok(close(reduccionRendimientosTrabajo(r.umbral2, r), r.valorUmbral2, 0.01));
  assert.ok(close(reduccionRendimientosTrabajo(r.umbral3, r), 0, 0.01));
  assert.equal(reduccionRendimientosTrabajo(r.umbral3 + 1, r), 0);
  let prev = Infinity;
  for (let x = 0; x <= 25000; x += 50) {
    const v = reduccionRendimientosTrabajo(x, r);
    assert.ok(v <= prev + 1e-9, `no decrece en ${x}`);
    prev = v;
  }
});

test('todo cuadra: bruto = neto + SS + IRPF y coste = bruto + SS empresa', () => {
  for (const mensual of [800, 1221, 1750, 2500, 4000, 6000, 12000]) {
    for (const pagas of [12, 14]) {
      const r = calcularNomina({ brutoMensual: mensual, pagas }, P);
      const t = r.trabajador;
      assert.ok(close(t.neto.anual + t.ss.total + t.irpf.total, r.bruto.anual, 1e-6));
      assert.ok(close(r.empresa.coste.anual, r.bruto.anual + r.empresa.ss.total, 1e-6));
      assert.ok(close(r.reparto.aLasAdministraciones + t.neto.anual, r.empresa.coste.anual, 1e-6));
      assert.ok(close(t.ss.items.reduce((s, i) => s + i.importe, 0), t.ss.total, 1e-9));
      assert.ok(close(r.empresa.ss.items.reduce((s, i) => s + i.importe, 0), r.empresa.ss.total, 1e-9));
      assert.ok(close(t.irpf.estatal.tramos.reduce((s, x) => s + x.cuota, 0), t.irpf.estatal.integra, 1e-6));
    }
  }
});

test('12 o 14 pagas con el mismo bruto anual dan los mismos totales', () => {
  const a = calcularNomina({ brutoMensual: 2100, pagas: 14 }, P);
  const b = calcularNomina({ brutoMensual: 2450, pagas: 12 }, P);
  assert.ok(close(a.bruto.anual, 29400));
  assert.ok(close(b.bruto.anual, 29400));
  assert.ok(close(a.trabajador.neto.anual, b.trabajador.neto.anual, 1e-6));
  assert.ok(close(a.trabajador.neto.porPaga, a.trabajador.neto.anual / 14));
  assert.ok(close(b.trabajador.neto.porPaga, b.trabajador.neto.anual / 12));
});

test('contrato temporal: 6,55 % el trabajador y 31,85 % la empresa (sin AT/EP)', () => {
  const r = calcularNomina({ brutoMensual: 2000, pagas: 14, contrato: 'temporal', atEp: 0 }, P);
  const base = r.base.anual;
  assert.ok(close(r.trabajador.ss.total, (base * 6.55) / 100, 1e-6));
  assert.ok(close(r.empresa.ss.total, (base * 31.85) / 100, 1e-6));
  const ind = calcularNomina({ brutoMensual: 2000, pagas: 14, contrato: 'indefinido', atEp: 0 }, P);
  assert.ok(close(ind.trabajador.ss.total, (base * 6.5) / 100, 1e-6));
  assert.ok(close(ind.empresa.ss.total, (base * 30.65) / 100, 1e-6));
});

test('base de cotización: mínima sólo a jornada completa y tope máximo', () => {
  const baja = calcularNomina({ brutoMensual: 1000, pagas: 12 }, P);
  assert.equal(baja.base.mensual, 1424.4);
  assert.equal(baja.base.subidaAMinima, true);
  const parcial = calcularNomina({ brutoMensual: 1000, pagas: 12, jornadaCompleta: false }, P);
  assert.equal(parcial.base.mensual, 1000);
  assert.equal(parcial.base.subidaAMinima, false);
  const alta = calcularNomina({ brutoMensual: 9000, pagas: 12 }, P);
  assert.equal(alta.base.mensual, 5101.2);
  assert.equal(alta.base.topada, true);
});

test('cotización de solidaridad: nada bajo el tope y reparto 1/6 y 5/6 por encima', () => {
  const sin = calcularNomina({ brutoMensual: 5000, pagas: 12 }, P);
  assert.equal(sin.solidaridad.total, 0);
  assert.ok(!sin.trabajador.ss.items.some((i) => i.id === 'solidaridad'));

  const r = calcularNomina({ brutoMensual: 100000 / 12, pagas: 12 }, P);
  const mensual = 100000 / 12;
  const exceso = mensual - 5101.2;
  const b1 = 510.12, b2 = 2040.48, b3 = exceso - b1 - b2;
  const esperadoTrab = (b1 * 0.19 + b2 * 0.21 + b3 * 0.24) / 100 * 12;
  const esperadoEmp = (b1 * 0.96 + b2 * 1.04 + b3 * 1.22) / 100 * 12;
  assert.ok(close(r.solidaridad.trabajador * 12, esperadoTrab, 0.01), `trabajador ${r.solidaridad.trabajador * 12} vs ${esperadoTrab}`);
  assert.ok(close(r.solidaridad.empresa * 12, esperadoEmp, 0.01));
  assert.equal(r.solidaridad.tramos.length, 3);
  // sin solidaridad es el caso del CSV; con ella el IRPF baja un poco (la cotización es deducible)
  const csv = casoDe(ejemplos[6]);
  assert.ok(r.trabajador.ss.total > csv.trabajador.ss.total);
  assert.ok(r.trabajador.irpf.total < csv.trabajador.irpf.total);
  assert.ok(r.empresa.coste.anual > csv.empresa.coste.anual);
});

test('cotizacionSolidaridad: bandas con límites exactos', () => {
  const b = P.ss.solidaridad;
  assert.equal(cotizacionSolidaridad(5101.2, 5101.2, b).total, 0);
  const x = cotizacionSolidaridad(5611.32, 5101.2, b);
  assert.ok(close(x.total, (510.12 * 1.15) / 100, 1e-9));
  assert.ok(close(x.empresa + x.trabajador, x.total, 1e-9));
});

test('el neto no baja nunca al subir el bruto y el IRPF no baja', () => {
  let netoPrev = -Infinity, irpfPrev = -Infinity;
  for (let anual = 0; anual <= 150000; anual += 250) {
    const r = calcularNomina({ brutoMensual: anual / 14, pagas: 14 }, P);
    assert.ok(r.trabajador.neto.anual >= netoPrev - 1e-9, `neto baja en ${anual}`);
    assert.ok(r.trabajador.irpf.total >= irpfPrev - 1e-9, `IRPF baja en ${anual}`);
    netoPrev = r.trabajador.neto.anual; irpfPrev = r.trabajador.irpf.total;
  }
});

test('lo que queda de cada euro extra: sube al empezar y baja con los tramos', () => {
  const mediana = netoPorEuroExtra({ brutoMensual: 24497 / 14, pagas: 14, atEp: 1.5, solidaridad: false }, P);
  assert.ok(Math.abs(mediana.neto - 0.675) < 0.006, `mediana ${mediana.neto}`);
  // coste de la empresa por cada euro bruto extra: 1 + 30,65 % + 1,5 % de AT/EP
  assert.ok(Math.abs(mediana.coste - 1.3215) < 0.005, `coste ${mediana.coste}`);
  const alto = netoPorEuroExtra({ brutoMensual: 100000 / 14, pagas: 14, atEp: 1.5, solidaridad: false }, P);
  assert.ok(Math.abs(alto.neto - 0.57) < 0.005, `alto ${alto.neto}`);
  assert.ok(alto.neto < mediana.neto);
});

test('entradas raras no producen NaN', () => {
  for (const mensual of [0, -50, NaN, undefined, 'abc']) {
    const r = calcularNomina({ brutoMensual: mensual }, P);
    for (const v of [r.bruto.anual, r.trabajador.neto.anual, r.trabajador.irpf.total, r.empresa.coste.anual, r.reparto.pctNetoSobreCoste]) {
      assert.ok(Number.isFinite(v), `${mensual} -> ${v}`);
    }
    assert.equal(r.trabajador.irpf.total, 0);
  }
});

test('el tipo marginal combinado en Madrid llega al 45 % y el IRPF medio es creciente', () => {
  const r = calcularNomina({ brutoMensual: 400000 / 12, pagas: 12 }, P);
  assert.ok(close(r.trabajador.irpf.tipoMarginal, 45.0, 1e-9));
  assert.equal(calcularNomina({ brutoMensual: 1221, pagas: 14 }, P).trabajador.irpf.tipoMarginal > 0, true);
  const medios = [1500, 2500, 4000, 8000].map((m) => calcularNomina({ brutoMensual: m, pagas: 12 }, P).trabajador.irpf.tipoMedio);
  for (let i = 1; i < medios.length; i++) assert.ok(medios[i] > medios[i - 1]);
});
