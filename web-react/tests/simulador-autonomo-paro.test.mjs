/**
 * Simulador: autónomo (RETA), paro y cese de actividad, historial laboral por periodos,
 * seguro de salud anual y consultas «al año» o «en toda la vida».
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { parseCsvObjects } from '../src/data/csv.js';
import { calcularNomina, scaleTax } from '../src/domain/payroll.js';
import { calcularAutonomo, tramoAutonomo } from '../src/domain/autonomo.js';
import { economiaDeAutonomo, economiaDeNomina } from '../src/domain/economia.js';
import { cobradoEnMeses, duracionCese, duracionPorDias, importePrestacionMeses, prestacionCese, prestacionDesempleo } from '../src/domain/paro.js';
import { construirHistorial, normalizarPeriodos, simularParoAhora } from '../src/domain/historial.js';
import { calcularServicios, entradaPorDefecto } from '../src/domain/services.js';
import { calcularBalance } from '../src/domain/balance.js';
import {
  autonomoInput, avisos, cambiarFrecuenciaModo, defaultForm, ejemploHistorial, historialInicial, nuevoPeriodo, periodosInput, serviciosInput,
} from '../src/state/simForm.js';
import { loadRepo, close } from './helpers.mjs';

const repo = await loadRepo();
const P = await repo.simParams();
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const poblacion = repo.series('pob_es_total').get(2024);

// ---------------------------------------------------------------- parámetros

test('parámetros: tipos del RETA, 15 tramos y duración del cese de actividad', () => {
  const a = P.autonomo;
  assert.ok(close(a.tipos.reduce((s, t) => s + t.tipo, 0), 31.5, 1e-9));
  assert.equal(a.tipoTotal, 31.5);
  assert.equal(a.tramos.length, 15);
  assert.equal(a.tramos.filter((t) => t.tabla === 'reducida').length, 3);
  assert.equal(a.tramos.at(-1).hasta, null, 'el último tramo es abierto');
  assert.deepEqual(a.cese.duracion.map((d) => d.meses), [4, 6, 8, 10, 12, 16, 24]);
  assert.equal(a.deduccionGastosGenericos, 7);
  assert.equal(a.gastosDificilMax, 2000);
});

test('parámetros: paro con 70 % y 60 %, topes sin hijos y 11 tramos de duración', () => {
  const p = P.paro;
  assert.deepEqual([p.pctInicial, p.pctResto, p.minimo, p.maximo, p.minDias], [70, 60, 560, 1225, 360]);
  assert.equal(p.duracion.length, 11);
  assert.equal(duracionPorDias(359, p), null);
  assert.equal(duracionPorDias(360, p).meses, 4);
  assert.equal(duracionPorDias(1080, p).meses, 12);
  assert.equal(duracionPorDias(2160, p).meses, 24);
  assert.equal(duracionPorDias(5000, p).meses, 24);
});

test('la cuota de la base mínima de cada tramo coincide con la tabla publicada (±1 €)', async () => {
  const filas = parseCsvObjects(await readFile(join(raiz, 'public/data/sim/autonomos_cotizacion_2026.csv'), 'utf-8'));
  assert.equal(filas.length, 15);
  filas.forEach((f, i) => {
    const t = P.autonomo.tramos[i];
    assert.ok(Math.abs((t.baseMinima * 31.5) / 100 - Number(f.cuota_base_minima_eur)) <= 1, `mínima del tramo ${f.tabla} ${f.tramo}`);
    assert.ok(Math.abs((t.baseMaxima * 31.5) / 100 - Number(f.cuota_base_maxima_eur)) <= 1, `máxima del tramo ${f.tabla} ${f.tramo}`);
  });
});

// ---------------------------------------------------------------- autónomo

test('tramoAutonomo: el límite superior de cada tramo está incluido', () => {
  const t = P.autonomo.tramos;
  assert.equal(tramoAutonomo(0, t).tramo, 1);
  assert.equal(tramoAutonomo(670, t).tramo, 1);
  assert.equal(tramoAutonomo(670.01, t).tramo, 2);
  assert.equal(tramoAutonomo(1166.7, t).tabla, 'reducida');
  assert.equal(tramoAutonomo(1166.71, t).tabla, 'general');
  assert.equal(tramoAutonomo(2325, t).tramo, 6);
  assert.equal(tramoAutonomo(9999, t).tramo, 12);
});

test('autónomo: 3.000 € de facturación y 500 € de gastos al mes', () => {
  const a = calcularAutonomo({ ingresosMensuales: 3000, gastosMensuales: 500 }, P);
  assert.equal(a.bruto.anual, 30000);
  assert.ok(close(a.base.rendimientoCotizacion, (30000 * 0.93) / 12, 1e-9), '7 % de gastos genéricos');
  assert.equal(a.base.tramo.tabla, 'general');
  assert.equal(a.base.tramo.tramo, 6);
  assert.equal(a.base.mensual, 1274.51);
  assert.ok(close(a.cuota.mensual, (1274.51 * 31.5) / 100, 1e-9));
  assert.ok(Math.abs(a.cuota.mensual - 401) < 1, 'la tabla oficial da 401 €');
  assert.ok(close(a.cuota.total, a.cuota.items.reduce((s, i) => s + i.importe, 0), 1e-9));
  // IRPF: rendimiento − cuota − 5 % de difícil justificación, con las escalas y mínimos de la nómina
  const rn = 30000 - a.cuota.total;
  const base = rn - Math.min(rn * 0.05, 2000);
  assert.ok(close(a.irpf.baseLiquidable, base, 1e-6));
  const i = P.nomina.irpf;
  const esperado = Math.max(0, scaleTax(i.escalaEstatal, base) - scaleTax(i.escalaEstatal, i.minimoEstatal))
    + Math.max(0, scaleTax(i.escalaAutonomica, base) - scaleTax(i.escalaAutonomica, i.minimoAutonomico));
  assert.ok(close(a.irpf.total, esperado, 1e-6));
  assert.ok(close(a.neto.anual, 30000 - a.cuota.total - a.irpf.total, 1e-6));
  assert.ok(close(a.reparto.aLasAdministraciones, a.cuota.total + a.irpf.total, 1e-9));
  assert.equal(a.reparto.ssEmpresa, 0);
});

test('autónomo: los gastos difíciles de justificar se topan en 2.000 €', () => {
  const a = calcularAutonomo({ ingresosMensuales: 9000, gastosMensuales: 0 }, P);
  assert.equal(a.irpf.gastoDificil, 2000);
  assert.equal(a.base.tramo.tramo, 12);
  const b = calcularAutonomo({ ingresosMensuales: 1500, gastosMensuales: 0 }, P);
  assert.ok(close(b.irpf.gastoDificil, b.irpf.rendimientoNeto * 0.05, 1e-9));
});

test('autónomo: sin rendimiento paga la cuota del primer tramo y nada de IRPF', () => {
  const a = calcularAutonomo({ ingresosMensuales: 500, gastosMensuales: 800 }, P);
  assert.equal(a.bruto.anual, 0);
  assert.equal(a.base.mensual, 653.59);
  assert.equal(a.irpf.total, 0);
  assert.ok(a.neto.anual < 0, 'paga la cuota aunque no gane nada');
  const v = calcularAutonomo({ ingresosMensuales: 0 }, P);
  assert.ok(Number.isFinite(v.neto.anual));
});

test('economía: el desempleo del asalariado y el cese de actividad del autónomo', () => {
  const n = calcularNomina({ brutoMensual: 2000, pagas: 14 }, P.nomina);
  const e = economiaDeNomina(n);
  assert.equal(e.regimen, 'asalariado');
  assert.ok(close(e.paro.trabajador, (n.base.anual * 1.55) / 100, 1e-6), 'tuyo: 1,55 % de la base');
  assert.ok(close(e.paro.empresa, (n.base.anual * 5.5) / 100, 1e-6), 'de la empresa: 5,50 % de la base');
  assert.ok(close(e.reparto.total, n.reparto.aLasAdministraciones, 1e-9));
  const temporal = economiaDeNomina(calcularNomina({ brutoMensual: 2000, pagas: 14, contrato: 'temporal' }, P.nomina));
  assert.ok(temporal.paro.total > e.paro.total, 'el contrato temporal cotiza más por desempleo');

  const a = calcularAutonomo({ ingresosMensuales: 3000, gastosMensuales: 500 }, P);
  const ea = economiaDeAutonomo(a);
  assert.equal(ea.paro.tipo, 'cese');
  assert.ok(close(ea.paro.total, (a.base.anual * 0.9) / 100, 1e-6), '0,9 % de la base');
  assert.equal(ea.paro.empresa, 0);
  assert.equal(ea.baseMensual, 1274.51);
});

// ---------------------------------------------------------------- paro y cese

test('paro: 1.500 € de base y 720 días cotizados → 8 meses', () => {
  const r = prestacionDesempleo({ baseMensual: 1500, diasCotizados: 720 }, P.paro);
  assert.equal(r.derecho, true);
  assert.equal(r.meses, 8);
  assert.deepEqual([r.mesesInicial, r.mesesResto], [6, 2]);
  assert.equal(r.mensualInicial, 1050);
  assert.equal(r.mensualResto, 900);
  assert.equal(r.total, 6 * 1050 + 2 * 900);
  assert.equal(r.topeInicial, null);
});

test('paro: aplica el máximo (1.225 €) y el mínimo (560 €)', () => {
  const alto = prestacionDesempleo({ baseMensual: 5000, diasCotizados: 1080 }, P.paro);
  assert.equal(alto.mensualInicial, 1225);
  assert.equal(alto.mensualResto, 1225);
  assert.equal(alto.topeInicial, 'max');
  assert.equal(alto.total, 1225 * 12);
  const bajo = prestacionDesempleo({ baseMensual: 1000, diasCotizados: 360 }, P.paro);
  assert.equal(bajo.mensualInicial, 700);
  assert.equal(bajo.mensualResto, 600);
  const minimo = prestacionDesempleo({ baseMensual: 700, diasCotizados: 360 }, P.paro);
  assert.equal(minimo.mensualInicial, 560, '70 % de 700 = 490 → sube al mínimo');
  assert.equal(minimo.topeInicial, 'min');
  assert.equal(minimo.total, 560 * 4, 'cuatro meses: todos en los primeros 180 días');
});

test('paro: menos de 360 días no da derecho y 2.160 o más dan 24 meses', () => {
  const sin = prestacionDesempleo({ baseMensual: 2000, diasCotizados: 359 }, P.paro);
  assert.equal(sin.derecho, false);
  assert.equal(sin.total, 0);
  assert.equal(prestacionDesempleo({ baseMensual: 2000, diasCotizados: 2160 }, P.paro).meses, 24);
  assert.equal(prestacionDesempleo({ baseMensual: 0, diasCotizados: 2160 }, P.paro).derecho, false);
});

test('cobradoEnMeses: los primeros 6 meses al 70 % y el resto al 60 %', () => {
  const r = prestacionDesempleo({ baseMensual: 1500, diasCotizados: 720 }, P.paro);
  assert.equal(cobradoEnMeses(r, 3), 3 * 1050);
  assert.equal(cobradoEnMeses(r, 8), r.total);
  assert.equal(cobradoEnMeses(r, 20), r.total, 'no se cobra más de lo que da derecho');
  assert.equal(cobradoEnMeses(prestacionDesempleo({ baseMensual: 1500, diasCotizados: 100 }, P.paro), 5), 0);
});

test('cese de actividad: 70 % de la base, duración por meses cotizados y 12 seguidos', () => {
  assert.equal(duracionCese(11, P.autonomo), 0);
  assert.deepEqual([12, 18, 24, 30, 36, 43, 47, 48, 90].map((m) => duracionCese(m, P.autonomo)), [4, 6, 8, 10, 12, 16, 16, 24, 24]);
  const r = prestacionCese({ baseMensual: 1274.51, mesesCotizados: 18, mesesSeguidos: 18 }, P);
  assert.equal(r.derecho, true);
  assert.equal(r.meses, 6);
  assert.ok(close(r.mensualInicial, 1274.51 * 0.7, 1e-9));
  assert.ok(close(r.total, 1274.51 * 0.7 * 6, 1e-9));
  assert.equal(prestacionCese({ baseMensual: 1274.51, mesesCotizados: 30, mesesSeguidos: 8 }, P).derecho, false, 'faltan meses seguidos');
  assert.equal(prestacionCese({ baseMensual: 1274.51, mesesCotizados: 11, mesesSeguidos: 11 }, P).derecho, false);
  assert.equal(prestacionCese({ baseMensual: 5101.2, mesesCotizados: 48, mesesSeguidos: 48 }, P).mensualInicial, 1225, 'el mismo tope que el paro');
});

test('importePrestacionMeses: paro dicho en meses, sin límite de duración', () => {
  const e = economiaDeNomina(calcularNomina({ brutoMensual: 1500, pagas: 14 }, P.nomina)); // base 1.750
  const r = importePrestacionMeses(e, 8, P);
  assert.equal(r.mensualInicial, 1225, '70 % de 1.750 = 1.225 (justo el máximo)');
  assert.ok(close(r.mensualResto, 1050, 1e-9));
  assert.ok(close(r.importe, 6 * 1225 + 2 * 1050, 1e-9));
  assert.equal(importePrestacionMeses(e, 0, P).importe, 0);
  const a = economiaDeAutonomo(calcularAutonomo({ ingresosMensuales: 3000, gastosMensuales: 500 }, P));
  assert.ok(close(importePrestacionMeses(a, 4, P).importe, 4 * 1274.51 * 0.7, 1e-6));
});

// ---------------------------------------------------------------- historial

const trabajo = (importe, anios, pagas = 14) => ({ tipo: 'trabajo', anios, brutoMensual: importe, pagas });
const paro = (anios) => ({ tipo: 'paro', anios });
const autonomo = (ingresos, anios, gastos = 0) => ({ tipo: 'autonomo', anios, ingresosMensuales: ingresos, gastosMensuales: gastos });
const EJEMPLO = [trabajo(1400, 5), trabajo(2500, 3), paro(1), trabajo(5000, 3)];

test('historial: cada periodo aporta con su sueldo y los totales suman', () => {
  const h = construirHistorial(EJEMPLO, P);
  const por = (s) => calcularNomina({ brutoMensual: s, pagas: 14 }, P.nomina).reparto.aLasAdministraciones;
  assert.ok(close(h.aportado.total, 5 * por(1400) + 3 * por(2500) + 3 * por(5000), 1e-6));
  assert.equal(h.aniosTrabajados, 11);
  assert.equal(h.aniosParo, 1);
  assert.ok(close(h.aportado.irpf + h.aportado.ssTrabajador + h.aportado.ssEmpresa, h.aportado.total, 1e-6));
  assert.ok(close(h.periodos.reduce((s, f) => s + (f.aportado?.total ?? 0), 0), h.aportado.total, 1e-6));
  assert.equal(h.periodos[2].aportado, undefined, 'en el paro no se aporta sueldo');
  assert.ok(h.paroGenerado.total > 0 && h.paroGenerado.total < h.aportado.total);
});

test('historial: tu ejemplo — el paro de 1 año sale de 6 años cotizados y se cobra al máximo', () => {
  const h = construirHistorial(EJEMPLO, P);
  const p = h.periodos[2].prestacion;
  assert.equal(p.diasCotizados, 2160, '3 años a 2.500 € + 3 de los 5 años a 1.400 €');
  assert.equal(p.meses, 24);
  assert.ok(close(p.baseReguladora, (2500 * 14) / 12, 1e-6));
  assert.equal(p.mensualInicial, 1225);
  assert.equal(h.periodos[2].mesesCobrados, 12);
  assert.equal(h.periodos[2].cobrado, 12 * 1225);
  assert.equal(h.paroCobrado.importe, 12 * 1225);
  assert.equal(h.periodos[2].mesesSinCubrir, 0);
});

test('historial: tras un paro sólo cuentan las cotizaciones posteriores', () => {
  const h = construirHistorial(EJEMPLO, P);
  const ahora = simularParoAhora(h, P);
  assert.equal(ahora.estado, 'ok');
  assert.equal(ahora.regimen, 'desempleo');
  assert.equal(ahora.dias, 3 * 360, 'los 3 años del último trabajo; lo anterior ya se gastó en el paro');
  assert.equal(ahora.prestacion.meses, 12);
  assert.equal(ahora.prestacion.baseReguladora, 5101.2, 'la base de 5.833 € se topa en 5.101,20 €');
  assert.equal(ahora.prestacion.total, 12 * 1225);
  assert.equal(ahora.prestacion.topeInicial, 'max');
  // sin el paro de por medio habría 6 años cotizados y 24 meses
  const sinParo = simularParoAhora(construirHistorial([trabajo(1400, 5), trabajo(2500, 3), trabajo(5000, 3)], P), P);
  assert.equal(sinParo.dias, 2160);
  assert.equal(sinParo.prestacion.meses, 24);
});

test('historial: la ventana es de 6 años aunque se haya trabajado más', () => {
  const h = construirHistorial([trabajo(2000, 15)], P);
  const r = simularParoAhora(h, P);
  assert.equal(r.dias, 2160);
  assert.equal(r.prestacion.meses, 24);
  // base de 2.000 × 14 / 12 = 2.333,33: el 70 % supera el máximo
  assert.equal(r.prestacion.mensualInicial, 1225);
  assert.ok(close(r.prestacion.brutoResto, (2000 * 14 / 12) * 0.6, 1e-6), 'el 60 % serían 1.400 €');
  assert.equal(r.prestacion.mensualResto, 1225, '…pero se topa en 1.225 €');
});

test('historial: con menos de 360 días cotizados no hay paro y los meses declarados quedan sin cubrir', () => {
  const h = construirHistorial([trabajo(1800, 0.5), paro(1)], P);
  const f = h.periodos[1];
  assert.equal(f.prestacion.derecho, false);
  assert.equal(f.cobrado, 0);
  assert.equal(f.mesesSinCubrir, 12);
  assert.equal(h.paroCobrado.importe, 0);
});

test('historial: declarar más meses de paro de los que dan derecho sólo cuenta los que dan derecho', () => {
  const h = construirHistorial([trabajo(1800, 1), paro(2)], P);
  const f = h.periodos[1];
  assert.equal(f.prestacion.meses, 4, '360 días cotizados dan 4 meses');
  assert.equal(f.mesesCobrados, 4);
  assert.equal(f.mesesSinCubrir, 20);
  assert.equal(f.cobrado, f.prestacion.total);
});

test('historial: un segundo paro seguido no tiene cotizaciones nuevas', () => {
  const h = construirHistorial([trabajo(1800, 4), paro(1), paro(1)], P);
  assert.equal(h.periodos[2].prestacion.derecho, false);
  assert.equal(construirHistorial([paro(1)], P).periodos[0].prestacion.derecho, false);
});

test('historial: si el último periodo es de paro, o no hay datos, no se simula', () => {
  assert.equal(simularParoAhora(construirHistorial([trabajo(1800, 4), paro(1)], P), P).estado, 'en_paro');
  assert.equal(simularParoAhora(construirHistorial([], P), P).estado, 'sin_datos');
  assert.deepEqual(normalizarPeriodos([trabajo(1800, 0), { tipo: 'otro', anios: 3 }, trabajo(1800, 2)]).map((f) => f.anios), [2]);
});

test('historial: los empleos varios con la base de los últimos 180 días (media ponderada)', () => {
  const h = construirHistorial([trabajo(1400, 3), trabajo(2800, 0.25)], P);
  const r = simularParoAhora(h, P);
  const b = (s) => (s * 14) / 12;
  assert.ok(close(r.prestacion.baseReguladora, (b(2800) * 0.25 + b(1400) * 0.25) / 0.5, 1e-6));
});

test('historial: autónomo → cese de actividad con 12 meses seguidos', () => {
  const h = construirHistorial([autonomo(3000, 3, 500)], P);
  const r = simularParoAhora(h, P);
  assert.equal(r.regimen, 'cese');
  assert.equal(r.meses, 36);
  assert.equal(r.prestacion.meses, 12);
  assert.ok(close(r.prestacion.baseReguladora, 1274.51, 1e-9));
  assert.ok(close(r.prestacion.total, 1274.51 * 0.7 * 12, 1e-6));
  // menos de 12 meses → sin derecho
  assert.equal(simularParoAhora(construirHistorial([autonomo(3000, 0.9)], P), P).prestacion.derecho, false);
  // empleado y luego autónomo: los meses de empleo no valen para el cese de actividad
  const mixto = simularParoAhora(construirHistorial([trabajo(2000, 5), autonomo(3000, 1)], P), P);
  assert.equal(mixto.regimen, 'cese');
  assert.equal(mixto.meses, 12);
  assert.equal(mixto.prestacion.meses, 4);
  // y autónomo y luego empleado: no cuentan para el paro
  const inverso = simularParoAhora(construirHistorial([autonomo(3000, 5), trabajo(2000, 0.5)], P), P);
  assert.equal(inverso.regimen, 'desempleo');
  assert.equal(inverso.prestacion.derecho, false);
  assert.equal(inverso.dias, 180);
});

test('historial: un autónomo que dejó de serlo no tiene los meses «seguidos»', () => {
  const r = simularParoAhora(construirHistorial([autonomo(3000, 3), trabajo(2000, 1)], P), P);
  assert.equal(r.regimen, 'desempleo');
  assert.equal(r.dias, 360);
  assert.equal(r.prestacion.meses, 4);
});

// ---------------------------------------------------------------- balance con paro e historial

const servicios = (mut = () => {}) => {
  const e = entradaPorDefecto(P);
  mut(e);
  return calcularServicios(e, P, { brutoProrrateado: 2333, netoMensual: 1800 });
};

test('balance sin historial: el paro generado son los años por la cotización por desempleo', () => {
  const nomina = calcularNomina({ brutoMensual: 2000, pagas: 14 }, P.nomina);
  const eco = economiaDeNomina(nomina);
  const b = calcularBalance({ nomina, servicios: servicios(), aniosTrabajados: 15, poblacion, params: P });
  assert.ok(close(b.paro.generado.total, 15 * eco.paro.total, 1e-6));
  assert.ok(close(b.paro.generado.trabajador, 15 * eco.paro.trabajador, 1e-6));
  assert.ok(close(b.paro.generado.empresa, 15 * eco.paro.empresa, 1e-6));
  assert.ok(b.paro.generado.total < b.aportado.total);
  assert.ok(close(b.paro.pctDelAportado, (b.paro.generado.total / b.aportado.total) * 100, 1e-9));
  assert.equal(b.paro.cobrado, 0);
  assert.equal(b.consumido, b.consumidoServicios);
});

test('balance: el paro cobrado se suma a lo usado y resta del saldo', () => {
  const nomina = calcularNomina({ brutoMensual: 2000, pagas: 14 }, P.nomina);
  const base = calcularBalance({ nomina, servicios: servicios(), aniosTrabajados: 15, poblacion, params: P });
  const con = calcularBalance({ nomina, servicios: servicios(), aniosTrabajados: 15, paroCobrado: 10000, poblacion, params: P });
  assert.ok(close(con.consumido, base.consumido + 10000, 1e-6));
  assert.ok(close(con.saldo, base.saldo - 10000, 1e-6));
  assert.ok(close(con.paro.saldo, con.paro.generado.total - 10000, 1e-6));
  assert.ok(close(con.consumidoMediaSanidad, base.consumidoMediaSanidad + 10000, 1e-6));
  assert.ok(close(con.cobertura, con.aportado.total / con.consumido, 1e-9));
});

test('balance con historial: aporta cada periodo y lo cobrado en paro cuenta como usado', () => {
  const nomina = calcularNomina({ brutoMensual: 2000, pagas: 14 }, P.nomina);
  const hist = construirHistorial(EJEMPLO, P);
  const b = calcularBalance({ nomina, servicios: servicios(), aniosTrabajados: 99, historial: hist, poblacion, params: P });
  assert.ok(close(b.aportado.total, hist.aportado.total, 1e-6));
  assert.equal(b.aniosTrabajados, 11);
  assert.ok(close(b.paro.generado.total, hist.paroGenerado.total, 1e-6));
  assert.equal(b.paro.cobrado, 12 * 1225);
  assert.ok(close(b.consumido, b.consumidoServicios + 12 * 1225, 1e-6));
  assert.ok(close(b.aportadoAnual.total, hist.aportado.total / 11, 1e-6));
});

test('balance con historial: si los años superan la edad se reduce en proporción', () => {
  const nomina = calcularNomina({ brutoMensual: 2000, pagas: 14 }, P.nomina);
  const hist = construirHistorial([trabajo(2000, 60)], P);
  const b = calcularBalance({ nomina, servicios: servicios(), aniosTrabajados: 0, historial: hist, poblacion, params: P });
  assert.equal(b.aniosTrabajados, 40);
  assert.ok(close(b.aportado.total, hist.aportado.total * (40 / 60), 1e-6));
});

test('balance de un autónomo: el reparto es la cuota más el IRPF y el paro generado es el cese de actividad', () => {
  const aut = calcularAutonomo({ ingresosMensuales: 3000, gastosMensuales: 500 }, P);
  const eco = economiaDeAutonomo(aut);
  const b = calcularBalance({ economia: eco, servicios: servicios(), aniosTrabajados: 10, poblacion, params: P });
  assert.ok(close(b.aportado.total, 10 * (aut.cuota.total + aut.irpf.total), 1e-6));
  assert.equal(b.aportado.ssEmpresa, 0);
  assert.equal(b.paro.tipo, 'cese');
  assert.ok(close(b.paro.generado.total, 10 * eco.paro.total, 1e-6));
  assert.ok(close(b.pctBrutoAdministraciones, ((aut.cuota.total + aut.irpf.total) / aut.bruto.anual) * 100, 1e-9));
});

// ---------------------------------------------------------------- servicios: consultas y seguro

test('consultas «en toda la vida»: no se multiplican por la edad', () => {
  const a = calcularServicios({ edad: 40, salud: { cabecera: 200, frecuenciaModo: 'vida' }, educacion: [], transporte: { viajesSemana: 0, anios: 0 } }, P);
  const b = calcularServicios({ edad: 40, salud: { cabecera: 5, frecuenciaModo: 'anio' }, educacion: [], transporte: { viajesSemana: 0, anios: 0 } }, P);
  const c = calcularServicios({ edad: 40, salud: { cabecera: 5 }, educacion: [], transporte: { viajesSemana: 0, anios: 0 } }, P);
  const veces = (r) => r.grupos.salud.lineas.find((l) => l.id === 'cabecera').cantidad;
  assert.equal(veces(a), 200);
  assert.equal(veces(b), 200);
  assert.equal(veces(c), 200, 'sin modo, se entiende «al año»');
  assert.equal(a.totales.costePublico, b.totales.costePublico);
  assert.equal(a.grupos.salud.consultas, 200);
});

test('seguro de salud: prima anual de entrada y con parto, % del sueldo y total de la vida', () => {
  const r = calcularServicios({ edad: 40, salud: {}, educacion: [], transporte: {} }, P, { brutoProrrateado: 2000, netoMensual: 1500 });
  assert.equal(r.seguro.primaMensual, 18.05);
  assert.ok(close(r.seguro.primaAnual, 18.05 * 12, 1e-9));
  assert.equal(r.seguro.elegido, 'basico');
  const [basico, completo] = r.seguro.opciones;
  assert.equal(basico.id, 'basico');
  assert.equal(completo.id, 'completo');
  assert.ok(close(completo.primaAnual, 115 * 12, 1e-9));
  assert.ok(close(completo.minAnual, 50 * 12, 1e-9));
  assert.ok(close(completo.maxAnual, 180 * 12, 1e-9));
  assert.ok(close(basico.pctBruto, (18.05 / 2000) * 100, 1e-9));
  assert.ok(close(completo.pctNeto, (115 / 1500) * 100, 1e-9));
  assert.ok(close(completo.total, 115 * 480, 1e-9));
  const c = calcularServicios({ edad: 40, seguroTipo: 'completo', salud: {}, educacion: [], transporte: {} }, P);
  assert.equal(c.seguro.elegido, 'completo');
  assert.ok(close(c.seguro.primaAnual, 1380, 1e-9));
  assert.ok(close(c.seguro.total, 1380 * 40, 1e-9));
  assert.equal(c.seguro.opciones[0].pctBruto, null, 'sin sueldo no hay porcentaje');
});

test('seguro de salud: lo que cuesta al año lo declarado en la pública', () => {
  const r = calcularServicios({ edad: 40, salud: { cabecera: 200, frecuenciaModo: 'vida' }, educacion: [], transporte: {} }, P);
  assert.ok(close(r.seguro.publicoAlAnio, (200 * 50) / 40, 1e-9));
  assert.equal(calcularServicios({ edad: 0 }, P).seguro.publicoAlAnio, 0);
});

// ---------------------------------------------------------------- formulario

test('formulario: las consultas parten «en toda la vida» (media nacional × 40 años)', () => {
  const f = defaultForm(P);
  assert.equal(f.frecuenciaModo, 'vida');
  assert.deepEqual([f.cabecera, f.enfermeria, f.especialista], ['200', '120', '76']);
  const e = serviciosInput(f);
  assert.equal(e.salud.frecuenciaModo, 'vida');
  assert.equal(calcularServicios(e, P).grupos.salud.lineas.find((l) => l.id === 'cabecera').cantidad, 200);
});

test('formulario: al cambiar entre año y vida se conserva lo escrito', () => {
  const f = defaultForm(P);
  const anual = cambiarFrecuenciaModo(f, 'anio');
  assert.deepEqual([anual.frecuenciaModo, anual.cabecera, anual.enfermeria, anual.especialista], ['anio', '5', '3', '1.9']);
  const vuelta = cambiarFrecuenciaModo(anual, 'vida');
  assert.deepEqual([vuelta.cabecera, vuelta.enfermeria, vuelta.especialista], ['200', '120', '76']);
  assert.equal(cambiarFrecuenciaModo(f, 'vida'), f, 'sin cambio devuelve lo mismo');
  const sinEdad = cambiarFrecuenciaModo({ ...f, edad: '' }, 'anio');
  assert.equal(sinEdad.cabecera, '200', 'sin edad no se puede convertir');
  assert.equal(cambiarFrecuenciaModo({ ...f, cabecera: '' }, 'anio').cabecera, '');
  const e = serviciosInput({ ...anual });
  assert.equal(calcularServicios(e, P).grupos.salud.lineas.find((l) => l.id === 'cabecera').cantidad, 200);
});

test('formulario: periodosInput sin historial es un único periodo con el trabajo de hoy', () => {
  const f = { ...defaultForm(P), aniosTrabajados: '12', edad: '40' };
  assert.deepEqual(periodosInput(f).map((x) => [x.tipo, x.anios, x.brutoMensual]), [['trabajo', 12, 2000]]);
  assert.equal(periodosInput({ ...f, aniosTrabajados: '90' })[0].anios, 40, 'nunca más que la edad');
  const aut = periodosInput({ ...f, regimen: 'autonomo', ingresosAut: '3500', gastosAut: '700' })[0];
  assert.deepEqual([aut.tipo, aut.ingresosMensuales, aut.gastosMensuales], ['autonomo', 3500, 700]);
  assert.deepEqual(autonomoInput({ ...f, ingresosAut: '3,5', gastosAut: '' }), { ingresosMensuales: 3.5, gastosMensuales: 0 });
});

test('formulario: el historial detallado se convierte en periodos numéricos', () => {
  const f = { ...defaultForm(P), historialActivo: true, historial: ejemploHistorial() };
  const ps = periodosInput(f);
  assert.deepEqual(ps.map((x) => [x.tipo, x.anios, x.brutoMensual]), [['trabajo', 5, 1400], ['trabajo', 3, 2500], ['paro', 1, 0], ['trabajo', 3, 5000]]);
  const h = construirHistorial(ps, P);
  assert.equal(h.paroCobrado.importe, 14700);
  assert.equal(new Set(f.historial.map((x) => x.id)).size, 4, 'cada periodo tiene su identificador');
  const ini = historialInicial({ ...defaultForm(P), sueldo: '1800', aniosTrabajados: '7' });
  assert.deepEqual([ini.length, ini[0].tipo, ini[0].importe, ini[0].anios], [1, 'trabajo', '1800', '7']);
  assert.equal(historialInicial({ ...defaultForm(P), regimen: 'autonomo', ingresosAut: '2500' })[0].tipo, 'autonomo');
  assert.equal(nuevoPeriodo('paro').importe, '');
});

test('formulario: avisos del autónomo, del historial y del paro en meses', () => {
  const f = defaultForm(P);
  const campos = (x) => avisos(x, P).map((a) => a.campo);
  assert.ok(campos({ ...f, regimen: 'autonomo', ingresosAut: '' }).includes('ingresosAut'));
  assert.ok(campos({ ...f, regimen: 'autonomo', ingresosAut: '1000', gastosAut: '2000' }).includes('gastosAut'));
  assert.ok(campos({ ...f, regimen: 'autonomo', ingresosAut: '60000' }).includes('ingresosAut'));
  assert.deepEqual(campos({ ...f, regimen: 'autonomo' }), []);
  assert.ok(!campos({ ...f, regimen: 'autonomo', sueldo: '0' }).includes('sueldo'), 'el sueldo no importa si eres autónomo');
  assert.ok(campos({ ...f, edad: '30', historialActivo: true, historial: [nuevoPeriodo('trabajo', { anios: '25' })] }).includes('historial'));
  assert.ok(!campos({ ...f, historialActivo: true, historial: ejemploHistorial() }).includes('historial'));
  assert.ok(campos({ ...f, mesesParo: '200' }).includes('mesesParo'));
});
