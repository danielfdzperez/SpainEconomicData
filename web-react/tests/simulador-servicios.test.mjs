/**
 * Simulador: parámetros leídos de los CSV, uso de servicios públicos a lo largo de la vida
 * y balance entre lo aportado y lo consumido.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { calcularNomina } from '../src/domain/payroll.js';
import { calcularServicios, entradaPorDefecto } from '../src/domain/services.js';
import { calcularBalance, repartoPorFuncion } from '../src/domain/balance.js';
import { buildSimParams, SIM_TABLES } from '../src/data/simParams.js';
import { DataRepository } from '../src/data/DataRepository.js';
import { loadRepo, close } from './helpers.mjs';

const repo = await loadRepo();
const P = await repo.simParams();
const base = () => entradaPorDefecto(P);
const vacia = () => ({
  edad: 40,
  salud: {}, educacion: [], transporte: { viajesSemana: 0, anios: 0 },
});
const calc = (mut) => { const e = vacia(); mut(e); return calcularServicios(e, P); };

test('parámetros: precios de sanidad con su procedencia', () => {
  const s = P.salud.items;
  assert.equal(s.cabecera.publico.valor, 50);
  assert.equal(s.cabecera.publico.territorio, 'Madrid');
  assert.ok(close(s.cabecera.privado.valor, 50.5), 'media de las dos fuentes privadas');
  assert.equal(s.cabecera.privado.min, 17);
  assert.equal(s.cabecera.privado.max, 90);
  assert.equal(s.especialista.publico.valor, 132);
  assert.equal(s.especialista.privado.valor, 90);
  assert.equal(s.urgencias.publico.valor, 185);
  assert.equal(s.nocheHospital.publico.valor, 671);
  assert.equal(s.nocheUci.publico.valor, 2577.08);
  assert.equal(s.partoNatural.privado.valor, 7250);
  assert.equal(s.partoCesarea.privado.valor, 10500);
  assert.equal(s.partoNatural.publico.valor, 8381.5);
  assert.deepEqual([P.salud.frecuenciaMedia.cabecera, P.salud.frecuenciaMedia.enfermeria, P.salud.frecuenciaMedia.especialista], [5, 3, 1.9]);
});

test('parámetros: sin precio privado fiable se usa el público y queda marcado', () => {
  for (const k of ['enfermeria', 'nocheHospital', 'nocheUci']) {
    const it = P.salud.items[k];
    assert.equal(it.privado.proxy, true, k);
    assert.equal(it.privado.valor, it.publico.valor, k);
  }
  for (const k of ['cabecera', 'especialista', 'urgencias', 'partoNatural', 'resonancia', 'ecografia']) {
    assert.equal(P.salud.items[k].privado.proxy, false, k);
  }
});

test('parámetros: educación llevada de 2019 España a Madrid 2023', () => {
  const e = P.educacion;
  assert.equal(e.madrid2023, 6502);
  assert.equal(e.espana2019, 6230);
  assert.ok(close(e.factor, 6502 / 6230, 1e-12));
  const get = (id) => e.etapas.find((x) => x.id === id);
  assert.equal(get('primaria').publico.base2019, 5418);
  assert.ok(close(get('primaria').publico.gastoAlumno, 5418 * e.factor, 1e-6));
  assert.equal(get('universidad').publico.gastoAlumno, 9589, 'la universidad no se actualiza');
  assert.ok(close(get('universidad').publico.matriculaAnual, 16.92 * 60, 1e-9));
  assert.equal(get('infantil').privado.anual, 575 * 10);
  assert.equal(get('primaria').privado.anual, 700 * 10);
  assert.equal(get('eso').privado.anual, 900 * 10);
  assert.equal(get('bachillerato').privado.anual, 900 * 10);
  assert.equal(get('fp_superior').privado.anual, 4500);
  assert.equal(get('universidad').privado.anual, 17500);
  assert.equal(get('eso').publico.base2019, get('fp_medio').publico.base2019);
});

test('parámetros: transporte y gasto público', () => {
  assert.deepEqual([P.transporte.costeViaje, P.transporte.abonoMensual], [1.65, 32.7]);
  assert.ok(close(P.transporte.bonoViaje, 0.73, 1e-9));
  assert.equal(P.gastoPublico.millones, 725001);
  assert.equal(P.gastoPublico.funciones.length, 10);
  assert.ok(close(P.gastoPublico.funciones.reduce((s, f) => s + f.pct, 0), 100, 0.05));
});

test('buildSimParams avisa claramente si falta una tabla', () => {
  assert.throws(() => buildSimParams({}), /Falta un parámetro del simulador: tabla/);
  assert.equal(SIM_TABLES.length, 21);
});

test('simParams se pide una vez y reintenta tras un error', async () => {
  let llamadas = 0, fallar = true;
  const loader = async (path) => {
    if (path.includes('/sim/')) {
      llamadas++;
      if (fallar) throw new Error('sin red');
    }
    const { readFile } = await import('node:fs/promises');
    const { existsSync } = await import('node:fs');
    const { join } = await import('node:path');
    const plano = join(process.cwd(), path);
    return readFile(existsSync(plano) ? plano : join(process.cwd(), 'public', path), 'utf-8');
  };
  const r = new DataRepository(loader);
  await r.load();
  await assert.rejects(r.simParams(), /sin red/);
  fallar = false;
  const a = await r.simParams();
  const b = await r.simParams();
  assert.equal(a, b);
  assert.ok(llamadas >= SIM_TABLES.length);
});

test('sanidad: veces × tarifa pública y × precio privado', () => {
  const r = calc((e) => { e.salud = { cabecera: 5, enfermeria: 0, especialista: 0 }; });
  const l = r.grupos.salud.lineas.find((x) => x.id === 'cabecera');
  assert.equal(l.cantidad, 200);
  assert.equal(l.costePublico, 10000);
  assert.ok(close(l.equivalentePrivado, 200 * 50.5, 1e-9));
  assert.equal(l.pagoPersona, 0);
  assert.equal(l.puestoSistema, 10000);
  assert.equal(r.grupos.salud.consultas, 200);
});

test('sanidad: noches de hospital, UCI y partos', () => {
  const r = calc((e) => { e.salud = { nochesHospital: 10, nochesUci: 2, partos: 2, cesareas: 1 }; });
  const g = (id) => r.grupos.salud.lineas.find((x) => x.id === id);
  assert.equal(g('nocheHospital').costePublico, 6710);
  assert.equal(g('nocheHospital').equivalentePrivado, 6710);
  assert.equal(g('nocheHospital').proxyPrivado, true);
  assert.ok(close(g('nocheUci').costePublico, 2 * 2577.08, 1e-9));
  assert.equal(g('partoNatural').cantidad, 1);
  assert.equal(g('partoCesarea').cantidad, 1);
  assert.equal(g('partoNatural').costePublico + g('partoCesarea').costePublico, 2 * 8381.5);
  assert.equal(g('partoNatural').equivalentePrivado + g('partoCesarea').equivalentePrivado, 7250 + 10500);
  assert.equal(r.grupos.salud.noches, 12);
});

test('sanidad: no puede haber más cesáreas que partos y los negativos cuentan 0', () => {
  const r = calc((e) => { e.salud = { partos: 1, cesareas: 5, cabecera: -3, urgencias: NaN }; });
  const g = (id) => r.grupos.salud.lineas.find((x) => x.id === id);
  assert.equal(g('partoCesarea').cantidad, 1);
  assert.equal(g('partoNatural').cantidad, 0);
  assert.equal(g('cabecera').cantidad, 0);
  assert.equal(g('urgencias').cantidad, 0);
});

test('educación pública: coste del sistema, matrícula y equivalente privado', () => {
  const r = calc((e) => { e.educacion = [{ etapa: 'primaria', anios: 6, centro: 'publica' }, { etapa: 'universidad', anios: 4, centro: 'publica' }]; });
  const prim = r.grupos.educacion.lineas.find((x) => x.id === 'primaria');
  assert.ok(close(prim.costePublico, 6 * 5418 * P.educacion.factor, 1e-6));
  assert.equal(prim.pagoPersona, 0);
  assert.equal(prim.puestoSistema, prim.costePublico);
  assert.equal(prim.equivalentePrivado, 42000);
  const uni = r.grupos.educacion.lineas.find((x) => x.id === 'universidad');
  assert.equal(uni.costePublico, 4 * 9589);
  assert.ok(close(uni.pagoPersona, 4 * 1015.2, 1e-9));
  assert.ok(close(uni.puestoSistema, 4 * 9589 - 4 * 1015.2, 1e-9));
  assert.equal(uni.equivalentePrivado, 70000);
  assert.equal(r.grupos.educacion.anios, 10);
});

test('educación privada: paga la familia y el sistema no pone nada', () => {
  const r = calc((e) => { e.educacion = [{ etapa: 'eso', anios: 4, centro: 'privada' }]; });
  const l = r.grupos.educacion.lineas[0];
  assert.equal(l.pagoPersona, 4 * 9000);
  assert.equal(l.puestoSistema, 0);
  assert.ok(l.costePublico > 0, 'sigue calculando lo que costaría en la pública');
});

test('educación: etapas con 0 años o desconocidas se ignoran', () => {
  const r = calc((e) => { e.educacion = [{ etapa: 'eso', anios: 0 }, { etapa: 'inventada', anios: 5 }]; });
  assert.equal(r.grupos.educacion.lineas.length, 0);
});

test('transporte: viajes, coste del sistema y lo que paga el usuario (el más barato entre abono y bono)', () => {
  const r = calc((e) => { e.transporte = { viajesSemana: 8, anios: 20 }; });
  const l = r.grupos.transporte.lineas[0];
  assert.equal(l.cantidad, 8 * 52 * 20);
  assert.ok(close(l.costePublico, 8320 * 1.65, 1e-9));
  const pagoMes = (8 * 52 / 12) * 0.73; // 25,3 € < abono de 32,70 €
  assert.ok(close(l.pagoPersona, pagoMes * 12 * 20, 1e-6));
  assert.ok(close(l.puestoSistema, l.costePublico - l.pagoPersona, 1e-9));

  const mucho = calc((e) => { e.transporte = { viajesSemana: 20, anios: 10 }; }).grupos.transporte.lineas[0];
  assert.ok(close(mucho.pagoPersona, 32.7 * 12 * 10, 1e-6), 'con muchos viajes sale mejor el abono');
});

test('totales, media mensual y porcentaje del sueldo', () => {
  const nomina = calcularNomina({ brutoMensual: 2000, pagas: 14 }, P.nomina);
  const sueldo = { brutoProrrateado: nomina.bruto.prorrateadoMensual, netoMensual: nomina.trabajador.neto.mensual };
  const e = base();
  const r = calcularServicios(e, P, sueldo);
  assert.ok(close(r.totales.costePublico, r.lineas.reduce((s, l) => s + l.costePublico, 0), 1e-6));
  assert.ok(close(r.totales.puestoSistema + r.totales.pagoPersona, r.totales.costePublico, 1e-6));
  assert.ok(close(r.mensual.costePublico, r.totales.costePublico / (40 * 12), 1e-9));
  assert.ok(close(r.porcentajes.costePublicoBruto, (r.mensual.costePublico / sueldo.brutoProrrateado) * 100, 1e-9));
  for (const g of ['salud', 'educacion', 'transporte']) {
    assert.ok(close(r.grupos[g].totales.costePublico, r.grupos[g].lineas.reduce((s, l) => s + l.costePublico, 0), 1e-6));
  }
  assert.ok(close(r.grupos.salud.totales.costePublico + r.grupos.educacion.totales.costePublico + r.grupos.transporte.totales.costePublico, r.totales.costePublico, 1e-6));
});

test('seguro privado: prima × meses de vida', () => {
  const r = calc(() => {});
  assert.equal(r.seguro.primaMensual, 18.05);
  assert.ok(close(r.seguro.total, 18.05 * 480, 1e-9));
});

test('edad 0 o sin datos: todo a cero y sin NaN', () => {
  const r = calcularServicios({ edad: 0 }, P, { brutoProrrateado: 2000, netoMensual: 1500 });
  assert.equal(r.totales.costePublico, 0);
  assert.equal(r.mensual.costePublico, 0);
  assert.equal(r.porcentajes.costePublicoBruto, 0);
  const sinNada = calcularServicios({}, P);
  assert.equal(sinNada.edad, 0);
  assert.equal(sinNada.porcentajes, null);
});

test('valores de partida: media nacional y trayectoria escolar típica', () => {
  const e = entradaPorDefecto(P);
  assert.equal(e.salud.cabecera, 5);
  assert.equal(e.educacion.reduce((s, x) => s + x.anios, 0), 3 + 6 + 4 + 2 + 4);
  assert.ok(e.educacion.every((x) => x.centro === 'publica'));
});

// ---------------------------------------------------------------- balance

const poblacion2024 = repo.series('pob_es_total').get(2024);
const escenario = (mut = () => {}) => {
  const nomina = calcularNomina({ brutoMensual: 2000, pagas: 14 }, P.nomina);
  const entrada = base();
  mut(entrada);
  const servicios = calcularServicios(entrada, P, { brutoProrrateado: nomina.bruto.prorrateadoMensual, netoMensual: nomina.trabajador.neto.mensual });
  return { nomina, servicios, balance: calcularBalance({ nomina, servicios, aniosTrabajados: entrada.aniosTrabajados, poblacion: poblacion2024, params: P }) };
};

test('balance: aportado = (IRPF + SS trabajador + SS empresa) × años', () => {
  const { nomina, balance } = escenario();
  const r = nomina.reparto;
  assert.equal(balance.aniosTrabajados, 15);
  assert.ok(close(balance.aportado.total, 15 * (r.irpf + r.ssTrabajador + r.ssEmpresa), 1e-6));
  assert.ok(close(balance.aportado.irpf + balance.aportado.ssTrabajador + balance.aportado.ssEmpresa, balance.aportado.total, 1e-6));
  assert.ok(close(balance.pctBrutoAdministraciones, (r.aLasAdministraciones / nomina.bruto.anual) * 100, 1e-9));
});

test('balance: lo consumido es lo que pone el sistema y el saldo cuadra', () => {
  const { servicios, balance } = escenario();
  assert.equal(balance.consumido, servicios.totales.puestoSistema);
  assert.ok(close(balance.saldo, balance.aportado.total - balance.consumido, 1e-6));
  assert.ok(close(balance.cobertura, balance.aportado.total / balance.consumido, 1e-9));
});

test('balance: los años trabajados no pueden superar la edad', () => {
  const { balance } = escenario((e) => { e.aniosTrabajados = 90; });
  assert.equal(balance.aniosTrabajados, 40);
});

test('balance: gasto público por habitante de todo el sector público', () => {
  const { balance } = escenario();
  assert.ok(close(balance.referencia.gastoPorHabitante, (725001e6) / poblacion2024, 1e-6));
  assert.ok(balance.referencia.gastoPorHabitante > 14000 && balance.referencia.gastoPorHabitante < 16000);
  assert.ok(close(balance.referencia.vida, balance.referencia.gastoPorHabitante * 40, 1e-6));
});

test('balance: el reparto por funciones suma lo aportado cada año', () => {
  const { nomina, balance } = escenario();
  assert.equal(balance.destino.length, 10);
  assert.ok(close(balance.destino.reduce((s, f) => s + f.anual, 0), nomina.reparto.aLasAdministraciones, nomina.reparto.aLasAdministraciones * 0.0005));
  const salud = balance.destino.find((f) => f.codigo === '07');
  assert.ok(close(salud.anual, (nomina.reparto.aLasAdministraciones * 14.2) / 100, 1e-6));
  assert.ok(close(salud.mensual * 12, salud.anual, 1e-9));
  assert.deepEqual(repartoPorFuncion(0, P.gastoPublico, 0).map((f) => f.anual), Array(10).fill(0));
});

test('balance: sin consumo declarado no hay cobertura y no hay NaN', () => {
  const { balance } = escenario((e) => { e.salud = {}; e.educacion = []; e.transporte = { viajesSemana: 0, anios: 0 }; });
  assert.equal(balance.consumido, 0);
  assert.equal(balance.cobertura, null);
  assert.ok(Number.isFinite(balance.saldo));
});

test('balance: variante con la sanidad de una persona media (2.079 €/año)', () => {
  const { servicios, balance } = escenario();
  assert.ok(close(servicios.referenciaSalud.vida, 2079 * 40, 1e-9));
  const esperado = balance.consumido - servicios.grupos.salud.totales.puestoSistema + 2079 * 40;
  assert.ok(close(balance.consumidoMediaSanidad, esperado, 1e-6));
  assert.ok(close(balance.saldoMediaSanidad, balance.aportado.total - esperado, 1e-6));
  assert.ok(balance.consumidoMediaSanidad > balance.consumido, 'la media nacional supera lo contado en este caso');
});
