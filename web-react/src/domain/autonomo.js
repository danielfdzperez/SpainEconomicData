/**
 * Autónomo (RETA) en la Comunidad de Madrid, 2026.
 *
 * Dominio puro, como `payroll.js`: recibe los parámetros ya leídos de los CSV y devuelve
 * cálculos nuestros (la interfaz los marca con «*»).
 *
 * Qué hace:
 *  - Cotización por ingresos reales: rendimiento = (ingresos − gastos) menos la deducción del 7 %
 *    por gastos genéricos; con él se elige el tramo y se cotiza por su base mínima.
 *  - IRPF de la actividad (estimación directa simplificada): rendimiento neto = ingresos − gastos − cuota
 *    de autónomos; menos el 5 % de gastos de difícil justificación (máximo 2.000 €); misma escala estatal
 *    y de Madrid que en la nómina, con los mismos mínimos personales.
 *
 * No modela: tarifa plana, reducciones por bajos ingresos ni por inicio de actividad, autónomos
 * societarios (3 % en vez de 7 %), pluriactividad, IVA, módulos, ni los pagos fraccionados (modelo 130).
 */
import { scaleBreakdown, scaleTax, marginalRate } from './payroll.js';

const MESES = 12;
const pct = (x, de) => (de > 0 ? (x / de) * 100 : 0);

/** Tramo de cotización según el rendimiento mensual (el límite superior de cada tramo está incluido). */
export function tramoAutonomo(rendimientoMensual, tramos) {
  for (const t of tramos) if (t.hasta == null || rendimientoMensual <= t.hasta) return t;
  return tramos[tramos.length - 1];
}

/**
 * @typedef {object} AutonomoEntrada
 * @property {number} ingresosMensuales  Facturación media al mes, sin IVA.
 * @property {number} [gastosMensuales]  Gastos deducibles al mes (sin la cuota de autónomos).
 */

/**
 * @param {AutonomoEntrada} input
 * @param {import('../data/simParams.js').SimParams} params
 */
export function calcularAutonomo(input, params) {
  const a = params.autonomo;
  const ingresosMensuales = Math.max(0, Number(input.ingresosMensuales) || 0);
  const gastosMensuales = Math.max(0, Number(input.gastosMensuales) || 0);
  const ingresos = ingresosMensuales * MESES;
  const gastos = gastosMensuales * MESES;
  const rendimiento = Math.max(0, ingresos - gastos); // antes de la cuota y del IRPF

  // ---- cotización
  const rendimientoCotizacion = (rendimiento * (1 - a.deduccionGastosGenericos / 100)) / MESES;
  const tramo = tramoAutonomo(rendimientoCotizacion, a.tramos);
  const baseMensual = tramo.baseMinima;
  const baseAnual = baseMensual * MESES;
  const items = a.tipos.map((t) => ({ id: t.id, label: t.label, paraQueSirve: t.paraQueSirve, tipo: t.tipo, importe: (baseAnual * t.tipo) / 100 }));
  const cuotaAnual = items.reduce((s, i) => s + i.importe, 0);

  // ---- IRPF de la actividad
  const i = params.nomina.irpf;
  const rendimientoNeto = Math.max(0, rendimiento - cuotaAnual);
  const gastoDificil = Math.min((rendimientoNeto * a.gastosDificilPct) / 100, a.gastosDificilMax);
  const baseLiquidable = Math.max(0, rendimientoNeto - gastoDificil);
  const integraEstatal = scaleTax(i.escalaEstatal, baseLiquidable);
  const minimoEstatal = scaleTax(i.escalaEstatal, i.minimoEstatal);
  const cuotaEstatal = Math.max(0, integraEstatal - minimoEstatal);
  const integraAutonomica = scaleTax(i.escalaAutonomica, baseLiquidable);
  const minimoAutonomico = scaleTax(i.escalaAutonomica, i.minimoAutonomico);
  const cuotaAutonomica = Math.max(0, integraAutonomica - minimoAutonomico);
  const irpfTotal = cuotaEstatal + cuotaAutonomica;

  const irpf = {
    rendimientoNeto,
    gastoDificil,
    baseLiquidable,
    estatal: { integra: integraEstatal, minimo: minimoEstatal, cuota: cuotaEstatal, tramos: scaleBreakdown(i.escalaEstatal, baseLiquidable), minimoPersonal: i.minimoEstatal },
    autonomica: { integra: integraAutonomica, minimo: minimoAutonomico, cuota: cuotaAutonomica, tramos: scaleBreakdown(i.escalaAutonomica, baseLiquidable), minimoPersonal: i.minimoAutonomico },
    total: irpfTotal,
    tipoMedio: pct(irpfTotal, rendimiento),
    tipoMarginal: baseLiquidable > 0 ? marginalRate(i.escalaEstatal, baseLiquidable) + marginalRate(i.escalaAutonomica, baseLiquidable) : 0,
  };

  const neto = rendimiento - cuotaAnual - irpfTotal;
  const aLasAdministraciones = cuotaAnual + irpfTotal;

  return {
    regimen: 'autonomo',
    entrada: { ingresosMensuales, gastosMensuales },
    ingresos: { anual: ingresos, mensual: ingresosMensuales },
    gastos: { anual: gastos, mensual: gastosMensuales },
    // «bruto» del autónomo: lo que queda de la facturación tras los gastos, antes de cuota e IRPF
    bruto: { anual: rendimiento, prorrateadoMensual: rendimiento / MESES },
    base: { mensual: baseMensual, anual: baseAnual, tramo, rendimientoCotizacion, minimaMensual: tramo.baseMinima, maximaMensual: tramo.baseMaxima },
    cuota: { items, total: cuotaAnual, mensual: cuotaAnual / MESES, tipoTotal: a.tipoTotal, pctRendimiento: pct(cuotaAnual, rendimiento) },
    irpf,
    neto: { anual: neto, mensual: neto / MESES, pctBruto: pct(neto, rendimiento) },
    reparto: {
      neto, ssTrabajador: cuotaAnual, irpf: irpfTotal, ssEmpresa: 0, aLasAdministraciones,
      pctAdministracionesSobreBruto: pct(aLasAdministraciones, rendimiento),
    },
  };
}
