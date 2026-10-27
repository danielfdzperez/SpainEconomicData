/**
 * Historial laboral por periodos: trabajo por cuenta ajena, autónomo y paro, del más antiguo al más reciente.
 *
 * Con él se calcula, periodo a periodo, lo que se aportó al sector público (con el sueldo de cada
 * momento, siempre en euros de hoy y con los parámetros de 2026), lo cotizado para el paro, lo que ya se
 * cobró de paro y lo que tocaría si se dejara de trabajar ahora.
 *
 * Reglas que aplica (y que la interfaz explica):
 *  - Los días cotizados para el paro son los de trabajo por cuenta ajena de los últimos 6 años.
 *  - Las cotizaciones que ya generaron una prestación no valen para la siguiente: tras un periodo de paro,
 *    sólo cuenta lo cotizado después (aunque no se agotara la prestación: es una simplificación nuestra).
 *  - La base reguladora es la media de las bases de los últimos 180 días (paro) o 12 meses (cese de actividad).
 *  - Si declaras más meses de paro de los que daban derecho las cotizaciones, sólo contamos los que daban derecho.
 */
import { calcularAutonomo } from './autonomo.js';
import { economiaDeAutonomo, economiaDeNomina } from './economia.js';
import { calcularNomina } from './payroll.js';
import { cobradoEnMeses, prestacionCese, prestacionDesempleo } from './paro.js';

export const TIPOS_PERIODO = ['trabajo', 'autonomo', 'paro'];

const num = (v) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : 0;
};

/**
 * @typedef {object} Periodo
 * @property {'trabajo'|'autonomo'|'paro'} tipo
 * @property {number} anios                 Puede llevar decimales (0,5 = seis meses).
 * @property {number} [brutoMensual]        «trabajo»: sueldo bruto de una paga.
 * @property {12|14} [pagas]                «trabajo»
 * @property {number} [ingresosMensuales]   «autonomo»: facturación al mes.
 * @property {number} [gastosMensuales]     «autonomo»: gastos deducibles al mes.
 */

/** Quita los periodos sin duración o de un tipo desconocido, conservando el orden. */
export function normalizarPeriodos(periodos) {
  return (periodos ?? [])
    .filter((f) => TIPOS_PERIODO.includes(f?.tipo) && num(f.anios) > 0)
    .map((f) => ({ ...f, anios: num(f.anios) }));
}

/**
 * Economía de un periodo de trabajo.
 * @param {Periodo} f
 * @param {import('../data/simParams.js').SimParams} params
 * @param {{contrato?:string, atEp?:number, jornadaCompleta?:boolean}} [ctx]  Datos del contrato que se repiten en todos los empleos.
 */
export function economiaDePeriodo(f, params, ctx = {}) {
  if (f.tipo === 'autonomo') {
    return economiaDeAutonomo(calcularAutonomo({ ingresosMensuales: f.ingresosMensuales, gastosMensuales: f.gastosMensuales }, params));
  }
  if (f.tipo === 'trabajo') {
    return economiaDeNomina(calcularNomina({
      brutoMensual: f.brutoMensual, pagas: f.pagas === 12 ? 12 : 14,
      contrato: ctx.contrato, atEp: ctx.atEp, jornadaCompleta: ctx.jornadaCompleta,
    }, params.nomina));
  }
  return null;
}

/** Media ponderada de las bases de los periodos del mismo tipo justo anteriores a `fin`, hasta cubrir `aniosVentana`. */
export function baseReguladora(periodos, economias, fin, tipo, aniosVentana) {
  let resto = aniosVentana, suma = 0, peso = 0;
  for (let i = fin - 1; i >= 0 && resto > 0; i--) {
    if (periodos[i].tipo !== tipo) break;
    const a = Math.min(periodos[i].anios, resto);
    suma += economias[i].baseMensual * a;
    peso += a;
    resto -= a;
  }
  return peso > 0 ? suma / peso : 0;
}

/** Días cotizados para el paro en la ventana de 6 años anterior a `fin`, sin pasar de un paro anterior. */
export function diasCotizadosParo(periodos, fin, pParo) {
  let ventana = pParo.ventanaAnios, dias = 0;
  for (let i = fin - 1; i >= 0 && ventana > 0; i--) {
    if (periodos[i].tipo === 'paro') break;
    const a = Math.min(periodos[i].anios, ventana);
    if (periodos[i].tipo === 'trabajo') dias += a * pParo.diasPorAnio;
    ventana -= a;
  }
  return dias;
}

/** Meses cotizados por cese de actividad en la ventana de 48 meses, y cuántos son seguidos justo antes de `fin`. */
export function mesesCotizadosCese(periodos, fin, pAut) {
  let ventana = pAut.cese.ventanaMeses / 12, meses = 0, seguidos = 0, seguido = true;
  for (let i = fin - 1; i >= 0 && ventana > 0; i--) {
    if (periodos[i].tipo === 'paro') break;
    const a = Math.min(periodos[i].anios, ventana);
    if (periodos[i].tipo === 'autonomo') {
      meses += a * 12;
      if (seguido) seguidos += a * 12;
    } else {
      seguido = false;
    }
    ventana -= a;
  }
  return { meses, seguidos };
}

/** Prestación que correspondería al quedarse sin trabajo justo después del periodo `fin - 1`. */
function prestacionTras(periodos, economias, fin, params) {
  const previo = periodos[fin - 1];
  if (previo?.tipo === 'autonomo') {
    const { meses, seguidos } = mesesCotizadosCese(periodos, fin, params.autonomo);
    const base = baseReguladora(periodos, economias, fin, 'autonomo', params.autonomo.cese.baseMeses / 12);
    return { prestacion: prestacionCese({ baseMensual: base, mesesCotizados: meses, mesesSeguidos: seguidos }, params), meses, seguidos };
  }
  const dias = diasCotizadosParo(periodos, fin, params.paro);
  const base = baseReguladora(periodos, economias, fin, 'trabajo', params.paro.mesesInicial / 12);
  return { prestacion: prestacionDesempleo({ baseMensual: base, diasCotizados: dias }, params.paro), dias };
}

/**
 * @param {Periodo[]} lista
 * @param {import('../data/simParams.js').SimParams} params
 * @param {{contrato?:string, atEp?:number, jornadaCompleta?:boolean}} [ctx]
 */
export function construirHistorial(lista, params, ctx = {}) {
  const periodos = normalizarPeriodos(lista);
  const economias = periodos.map((f) => economiaDePeriodo(f, params, ctx));

  const aportado = { irpf: 0, ssTrabajador: 0, ssEmpresa: 0, total: 0 };
  const paroGenerado = { trabajador: 0, empresa: 0, total: 0 };
  const paroCobrado = { importe: 0, meses: 0 };
  let aniosTrabajados = 0, aniosParo = 0;

  const filas = periodos.map((f, i) => {
    const eco = economias[i];
    if (f.tipo === 'paro') {
      aniosParo += f.anios;
      const { prestacion } = prestacionTras(periodos, economias, i, params);
      const mesesDeclarados = f.anios * 12;
      const mesesCobrados = prestacion.derecho ? Math.min(mesesDeclarados, prestacion.meses) : 0;
      const importe = cobradoEnMeses(prestacion, mesesCobrados);
      paroCobrado.importe += importe;
      paroCobrado.meses += mesesCobrados;
      return { ...f, prestacion, mesesDeclarados, mesesCobrados, mesesSinCubrir: mesesDeclarados - mesesCobrados, cobrado: importe };
    }
    aniosTrabajados += f.anios;
    const a = { irpf: eco.reparto.irpf * f.anios, ssTrabajador: eco.reparto.ssTrabajador * f.anios, ssEmpresa: eco.reparto.ssEmpresa * f.anios, total: eco.reparto.total * f.anios };
    for (const k of Object.keys(aportado)) aportado[k] += a[k];
    const pg = { trabajador: eco.paro.trabajador * f.anios, empresa: eco.paro.empresa * f.anios, total: eco.paro.total * f.anios };
    paroGenerado.trabajador += pg.trabajador;
    paroGenerado.empresa += pg.empresa;
    paroGenerado.total += pg.total;
    return { ...f, economia: eco, aportado: a, paroGenerado: pg };
  });

  return { periodos: filas, aniosTrabajados, aniosParo, aniosTotal: aniosTrabajados + aniosParo, aportado, paroGenerado, paroCobrado, economias };
}

/**
 * Qué te tocaría de paro si dejaras de trabajar ahora (en el último periodo de trabajo).
 * @param {ReturnType<typeof construirHistorial>} hist
 * @param {import('../data/simParams.js').SimParams} params
 */
export function simularParoAhora(hist, params) {
  const filas = hist.periodos;
  const n = filas.length;
  if (n === 0) return { estado: 'sin_datos' };
  const ultimo = filas[n - 1];
  if (ultimo.tipo === 'paro') return { estado: 'en_paro', ultimo };
  const { prestacion, dias, meses, seguidos } = prestacionTras(filas, hist.economias, n, params);
  return {
    estado: 'ok',
    regimen: prestacion.regimen,
    ultimo,
    economia: ultimo.economia,
    prestacion,
    dias, meses, seguidos,
    generado: hist.paroGenerado,
  };
}
