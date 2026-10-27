/**
 * Nómina y coste de empresa (España, 2026, residencia fiscal en la Comunidad de Madrid).
 *
 * Dominio puro: recibe los parámetros ya leídos de los CSV (ver data/simParams.js) y no toca
 * ni el DOM ni la red. Todo lo que devuelve es un cálculo nuestro sobre parámetros oficiales
 * (por eso la interfaz lo marca con «*»).
 *
 * No modela: hijos y otros mínimos familiares, discapacidad, deducciones autonómicas,
 * deducción para rentas bajas del SMI, planes de pensiones, retención frente a cuota final,
 * ni el tipo exacto de accidentes de trabajo de cada empresa (se elige uno).
 */

import { lit } from '../i18n/index.js';

const MESES = 12;

/** Cuota de una escala progresiva (tipos en %) para una base. */
export function scaleTax(scale, base) {
  if (!(base > 0)) return 0;
  let tax = 0;
  for (const t of scale) {
    if (base <= t.desde) break;
    const hasta = t.hasta ?? Infinity;
    tax += ((Math.min(base, hasta) - t.desde) * t.tipo) / 100;
  }
  return tax;
}

/** Filas por tramo alcanzado: cuánta base cae en cada tipo y cuánta cuota genera. */
export function scaleBreakdown(scale, base) {
  const rows = [];
  if (!(base > 0)) return rows;
  for (const t of scale) {
    if (base <= t.desde) break;
    const hasta = t.hasta ?? Infinity;
    const enTramo = Math.min(base, hasta) - t.desde;
    rows.push({ desde: t.desde, hasta: t.hasta, tipo: t.tipo, baseEnTramo: enTramo, cuota: (enTramo * t.tipo) / 100 });
  }
  return rows;
}

/** Tipo del tramo en el que cae una base (en %). */
export function marginalRate(scale, base) {
  let rate = scale[0]?.tipo ?? 0;
  for (const t of scale) if (base > t.desde) rate = t.tipo;
  return rate;
}

/** Reducción por rendimientos del trabajo (art. 20 LIRPF) según el rendimiento neto. */
export function reduccionRendimientosTrabajo(rnt, r) {
  if (rnt <= r.umbral1) return r.max;
  if (rnt <= r.umbral2) return r.max - r.coef2 * (rnt - r.umbral1);
  if (rnt <= r.umbral3) return r.valorUmbral2 - r.coef3 * (rnt - r.umbral2);
  return 0;
}

/** Cotización de solidaridad sobre lo que supera el tope: importe MENSUAL por reparto. */
export function cotizacionSolidaridad(brutoMensual, tope, bandas) {
  let total = 0, empresa = 0, trabajador = 0;
  const tramos = [];
  let lo = tope;
  for (const b of bandas) {
    const hi = b.hasta ?? Infinity;
    const enTramo = Math.max(0, Math.min(brutoMensual, hi) - lo);
    if (enTramo > 0) {
      const t = (enTramo * b.total) / 100;
      const e = (enTramo * b.empresa) / 100;
      const w = (enTramo * b.trabajador) / 100;
      total += t; empresa += e; trabajador += w;
      tramos.push({ desde: lo, hasta: b.hasta, baseEnTramo: enTramo, tipoTotal: b.total, empresa: e, trabajador: w });
    }
    lo = hi;
  }
  return { total, empresa, trabajador, tramos };
}

const pct = (x, de) => (de > 0 ? (x / de) * 100 : 0);

/**
 * @typedef {object} NominaEntrada
 * @property {number} brutoMensual   Sueldo bruto de una paga.
 * @property {12|14} [pagas=14]
 * @property {'indefinido'|'temporal'} [contrato='indefinido']
 * @property {number} [atEp=1.5]     Tipo de accidentes de trabajo y enfermedad profesional (% sobre la base).
 * @property {boolean} [jornadaCompleta=true]  Si es completa se aplica la base mínima de cotización.
 * @property {boolean} [solidaridad=true]      Cotización de solidaridad por encima del tope.
 */

/**
 * Calcula la nómina y el coste de empresa de un año completo.
 * @param {NominaEntrada} input
 * @param {import('../data/simParams.js').SimParams['nomina']} p
 */
export function calcularNomina(input, p) {
  const pagas = input.pagas === 12 ? 12 : 14;
  const contrato = input.contrato === 'temporal' ? 'temporal' : 'indefinido';
  const atEp = Number.isFinite(input.atEp) ? input.atEp : 1.5;
  const jornadaCompleta = input.jornadaCompleta !== false;
  const conSolidaridad = input.solidaridad !== false;
  const brutoMensual = Math.max(0, Number(input.brutoMensual) || 0);

  const brutoAnual = brutoMensual * pagas;
  const brutoProrrateado = brutoAnual / MESES;

  // ---- base de cotización (mensual, con pagas extra prorrateadas)
  const minimo = jornadaCompleta ? p.ss.baseMinimaMensual : 0;
  const maximo = p.ss.baseMaximaMensual;
  const baseMensual = Math.min(Math.max(brutoProrrateado, minimo), maximo);
  const baseAnual = baseMensual * MESES;
  const base = {
    mensual: baseMensual,
    anual: baseAnual,
    topada: brutoProrrateado > maximo,
    subidaAMinima: brutoProrrateado < minimo,
    minimaMensual: minimo,
    maximaMensual: maximo,
  };

  // ---- cotizaciones: reparto por concepto
  const solid = conSolidaridad ? cotizacionSolidaridad(brutoProrrateado, maximo, p.ss.solidaridad) : { total: 0, empresa: 0, trabajador: 0, tramos: [] };
  const conceptos = p.ss.conceptos[contrato];

  // FOGASA y otros conceptos que paga sólo la empresa no aparecen en la nómina del trabajador
  const ssItems = conceptos.filter((c) => c.trabajador > 0).map((c) => ({
    id: c.id, label: c.label, paraQueSirve: c.paraQueSirve,
    tipo: c.trabajador, importe: (baseAnual * c.trabajador) / 100,
  }));
  if (solid.trabajador > 0) {
    ssItems.push({ id: 'solidaridad', label: lit('Cotización de solidaridad'), paraQueSirve: p.ss.solidaridadTexto, tipo: null, importe: solid.trabajador * MESES });
  }
  const ssTrabajador = ssItems.reduce((s, i) => s + i.importe, 0);

  const empItems = conceptos.map((c) => ({
    id: c.id, label: c.label, paraQueSirve: c.paraQueSirve,
    tipo: c.empresa, importe: (baseAnual * c.empresa) / 100,
  }));
  empItems.push({ id: 'at_ep', label: lit('Accidentes de trabajo y enfermedades profesionales (AT/EP)'), paraQueSirve: p.ss.atEpTexto, tipo: atEp, importe: (baseAnual * atEp) / 100 });
  if (solid.empresa > 0) {
    empItems.push({ id: 'solidaridad', label: lit('Cotización de solidaridad'), paraQueSirve: p.ss.solidaridadTexto, tipo: null, importe: solid.empresa * MESES });
  }
  const ssEmpresa = empItems.reduce((s, i) => s + i.importe, 0);

  // ---- IRPF (escala general, soltero sin hijos)
  const i = p.irpf;
  const rnt = Math.max(0, brutoAnual - ssTrabajador - i.gastoDeducible);
  const reduccion = Math.min(reduccionRendimientosTrabajo(rnt, i.reduccion), rnt);
  const baseLiquidable = rnt - reduccion;

  const integraEstatal = scaleTax(i.escalaEstatal, baseLiquidable);
  const minimoEstatal = scaleTax(i.escalaEstatal, i.minimoEstatal);
  const cuotaEstatal = Math.max(0, integraEstatal - minimoEstatal);
  const integraAutonomica = scaleTax(i.escalaAutonomica, baseLiquidable);
  const minimoAutonomico = scaleTax(i.escalaAutonomica, i.minimoAutonomico);
  const cuotaAutonomica = Math.max(0, integraAutonomica - minimoAutonomico);
  const irpfTotal = cuotaEstatal + cuotaAutonomica;

  const irpf = {
    gastoDeducible: i.gastoDeducible,
    rendimientoNeto: rnt,
    reduccion,
    baseLiquidable,
    estatal: { integra: integraEstatal, minimo: minimoEstatal, cuota: cuotaEstatal, tramos: scaleBreakdown(i.escalaEstatal, baseLiquidable), minimoPersonal: i.minimoEstatal },
    autonomica: { integra: integraAutonomica, minimo: minimoAutonomico, cuota: cuotaAutonomica, tramos: scaleBreakdown(i.escalaAutonomica, baseLiquidable), minimoPersonal: i.minimoAutonomico },
    total: irpfTotal,
    tipoMedio: pct(irpfTotal, brutoAnual),
    tipoMarginal: baseLiquidable > 0 ? marginalRate(i.escalaEstatal, baseLiquidable) + marginalRate(i.escalaAutonomica, baseLiquidable) : 0,
  };

  const neto = brutoAnual - ssTrabajador - irpfTotal;
  const coste = brutoAnual + ssEmpresa;
  const aLasAdministraciones = ssTrabajador + irpfTotal + ssEmpresa;

  const result = {
    entrada: { brutoMensual, pagas, contrato, atEp, jornadaCompleta },
    bruto: { anual: brutoAnual, porPaga: brutoMensual, prorrateadoMensual: brutoProrrateado },
    base,
    trabajador: {
      ss: { items: ssItems, total: ssTrabajador, pctBruto: pct(ssTrabajador, brutoAnual) },
      irpf,
      neto: { anual: neto, mensual: neto / MESES, porPaga: neto / pagas, pctBruto: pct(neto, brutoAnual) },
    },
    empresa: {
      ss: { items: empItems, total: ssEmpresa, pctBruto: pct(ssEmpresa, brutoAnual), tipoTotal: pct(ssEmpresa, baseAnual) },
      coste: { anual: coste, mensual: coste / MESES },
    },
    solidaridad: solid,
    reparto: {
      neto, ssTrabajador, irpf: irpfTotal, ssEmpresa,
      aLasAdministraciones,
      pctNetoSobreCoste: pct(neto, coste),
      pctAdministracionesSobreCoste: pct(aLasAdministraciones, coste),
      pctAdministracionesSobreBruto: pct(aLasAdministraciones, brutoAnual),
    },
  };
  return result;
}

/**
 * Cuánto de cada euro bruto adicional llega al bolsillo (aproximación numérica con +100 € al año).
 * Sirve para enseñar el efecto de una subida: no es un tipo legal.
 */
export function netoPorEuroExtra(input, p, deltaAnual = 100) {
  const pagas = input.pagas === 12 ? 12 : 14;
  const a = calcularNomina(input, p);
  const b = calcularNomina({ ...input, brutoMensual: input.brutoMensual + deltaAnual / pagas }, p);
  return {
    neto: (b.trabajador.neto.anual - a.trabajador.neto.anual) / deltaAnual,
    coste: (b.empresa.coste.anual - a.empresa.coste.anual) / deltaAnual,
  };
}
