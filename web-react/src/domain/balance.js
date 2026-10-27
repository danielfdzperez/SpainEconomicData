/**
 * Balance de vida laboral: lo aportado (IRPF + cotizaciones) frente a lo consumido
 * (servicios públicos que la persona ha contado) y frente al gasto público medio por habitante.
 *
 * Supuestos (todos nuestros, se explican en pantalla):
 *  - Se ha cobrado siempre lo mismo que hoy, en euros de hoy.
 *  - «Aportado» suma el IRPF, la cotización del trabajador y la de la empresa por ella.
 *    No incluye IVA ni otros impuestos que también se pagan.
 *  - «Consumido» cuenta sanidad, educación y transporte declarados, a coste público, más el paro
 *    que la persona haya cobrado. No incluye pensiones, justicia, seguridad, infraestructuras…
 *  - «Paro generado» es lo que se ha cotizado para el desempleo (trabajador y empresa) o, en un
 *    autónomo, para el cese de actividad. Es una parte de lo aportado, no se suma aparte.
 */
import { economiaDeNomina } from './economia.js';

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : 0;
};

/**
 * Reparte un importe según el gasto público por funciones (COFOG).
 * No es una afectación legal: ni el IRPF ni el IVA van a un gasto concreto.
 */
export function repartoPorFuncion(importeAnual, gastoPublico, brutoAnual) {
  return gastoPublico.funciones.map((f) => {
    const anual = (importeAnual * f.pct) / 100;
    return { ...f, anual, mensual: anual / 12, pctBruto: brutoAnual > 0 ? (anual / brutoAnual) * 100 : 0 };
  });
}

/**
 * @param {object} args
 * @param {ReturnType<import('./payroll.js').calcularNomina>} [args.nomina]  Si no hay `economia`, se parte de la nómina.
 * @param {import('./economia.js').Economia} [args.economia]
 * @param {ReturnType<import('./services.js').calcularServicios>} args.servicios
 * @param {number} args.aniosTrabajados  Se usa si no hay `historial`.
 * @param {ReturnType<import('./historial.js').construirHistorial>} [args.historial]  Periodos con sueldos distintos; sustituye a `aniosTrabajados`.
 * @param {number} [args.paroCobrado]  Paro cobrado (euros) cuando no hay historial detallado.
 * @param {number} args.poblacion  residentes en el año del gasto público (para el gasto por habitante)
 * @param {import('../data/simParams.js').SimParams} args.params
 */
export function calcularBalance({ nomina, economia, servicios, aniosTrabajados, historial, paroCobrado = 0, poblacion, params }) {
  const edad = servicios.edad;
  const eco = economia ?? economiaDeNomina(nomina);
  const r = eco.reparto;

  let anios, aportado, paroGenerado, cobradoParo, aportadoAnual;
  if (historial) {
    // con el historial cada periodo aporta lo suyo; si suma más años que la edad se reduce todo en proporción
    const total = historial.aniosTrabajados;
    const f = total > edad && total > 0 ? edad / total : 1;
    anios = total * f;
    aportado = { irpf: historial.aportado.irpf * f, ssTrabajador: historial.aportado.ssTrabajador * f, ssEmpresa: historial.aportado.ssEmpresa * f, total: historial.aportado.total * f };
    paroGenerado = { trabajador: historial.paroGenerado.trabajador * f, empresa: historial.paroGenerado.empresa * f, total: historial.paroGenerado.total * f };
    cobradoParo = historial.paroCobrado.importe;
    aportadoAnual = anios > 0 ? { irpf: aportado.irpf / anios, ssTrabajador: aportado.ssTrabajador / anios, ssEmpresa: aportado.ssEmpresa / anios, total: aportado.total / anios } : { irpf: 0, ssTrabajador: 0, ssEmpresa: 0, total: 0 };
  } else {
    anios = Math.min(n(aniosTrabajados), edad);
    aportadoAnual = { irpf: r.irpf, ssTrabajador: r.ssTrabajador, ssEmpresa: r.ssEmpresa, total: r.total };
    aportado = { irpf: r.irpf * anios, ssTrabajador: r.ssTrabajador * anios, ssEmpresa: r.ssEmpresa * anios, total: r.total * anios };
    paroGenerado = { trabajador: eco.paro.trabajador * anios, empresa: eco.paro.empresa * anios, total: eco.paro.total * anios };
    cobradoParo = n(paroCobrado);
  }

  const consumidoServicios = servicios.totales.puestoSistema;
  const consumido = consumidoServicios + cobradoParo;
  // variante: la sanidad como una persona media (la declarada sólo cuenta lo que se ha contado)
  const consumidoMediaSanidad = consumido - servicios.grupos.salud.totales.puestoSistema + servicios.referenciaSalud.vida;
  const gastoPorHabitante = poblacion > 0 ? (params.gastoPublico.millones * 1e6) / poblacion : 0;
  const referencia = { gastoPorHabitante, vida: gastoPorHabitante * edad };

  const destino = repartoPorFuncion(aportadoAnual.total, params.gastoPublico, eco.brutoAnual);
  const pctBrutoAdministraciones = eco.brutoAnual > 0 ? (aportadoAnual.total / eco.brutoAnual) * 100 : 0;

  return {
    aniosTrabajados: anios,
    aportadoAnual,
    aportado,
    paro: {
      etiqueta: eco.paro.etiqueta,
      tipo: eco.paro.tipo,
      generado: paroGenerado,
      cobrado: cobradoParo,
      pctDelAportado: aportado.total > 0 ? (paroGenerado.total / aportado.total) * 100 : 0,
      saldo: paroGenerado.total - cobradoParo,
    },
    consumidoServicios,
    consumido,
    saldo: aportado.total - consumido,
    cobertura: consumido > 0 ? aportado.total / consumido : null,
    consumidoMediaSanidad,
    saldoMediaSanidad: aportado.total - consumidoMediaSanidad,
    coberturaMediaSanidad: consumidoMediaSanidad > 0 ? aportado.total / consumidoMediaSanidad : null,
    referencia,
    saldoReferencia: aportado.total - referencia.vida,
    destino,
    pctBrutoAdministraciones,
  };
}
