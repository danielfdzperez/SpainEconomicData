/**
 * Prestaciones por falta de trabajo: paro contributivo (asalariados) y cese de actividad (autónomos).
 *
 * Dominio puro. Importes brutos, en euros de 2026, para una persona sin hijos.
 *
 * Qué hace:
 *  - Paro: 70 % de la base reguladora los primeros 180 días y 60 % después, con mínimo y máximo;
 *    la duración sale de los días cotizados (360 por año: meses de 30 días).
 *  - Cese de actividad: 70 % de la base de los últimos 12 meses, con los mismos mínimo y máximo;
 *    exige 12 meses cotizados seguidos justo antes del cese; la duración sale de los meses cotizados.
 *
 * No modela: retención de IRPF ni cotización del trabajador sobre la prestación, subsidios,
 * hijos a cargo, compatibilidades, ni que el cese de actividad exija causas concretas (se supone
 * que el motivo es el que da derecho a la prestación, como un despido).
 */

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const num = (v) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : 0;
};

/** Fila de la tabla de duración a la que pertenece un número de días cotizados. */
export function duracionPorDias(dias, p) {
  const d = Math.floor(num(dias));
  return p.duracion.find((t) => d >= t.desdeDias && (t.hastaDias == null || d <= t.hastaDias)) ?? null;
}

/** Meses de cese de actividad que corresponden a unos meses cotizados. */
export function duracionCese(meses, pAut) {
  const m = Math.floor(num(meses));
  return pAut.cese.duracion.find((t) => m >= t.desde && (t.hasta == null || m <= t.hasta))?.meses ?? 0;
}

const sinDerecho = (regimen, extra) => ({
  regimen, derecho: false, meses: 0, mesesInicial: 0, mesesResto: 0,
  mensualInicial: 0, mensualResto: 0, total: 0, topeInicial: null, topeResto: null, ...extra,
});

/**
 * Paro contributivo.
 * @param {{baseMensual:number, diasCotizados:number}} input  Base reguladora mensual y días cotizados computables.
 * @param {import('../data/simParams.js').SimParams['paro']} p
 */
export function prestacionDesempleo({ baseMensual, diasCotizados }, p) {
  const base = num(baseMensual);
  const dias = Math.floor(num(diasCotizados));
  const dur = dias >= p.minDias ? duracionPorDias(dias, p) : null;
  const comun = { baseReguladora: base, diasCotizados: dias, minDias: p.minDias };
  if (!dur || base <= 0) return sinDerecho('desempleo', comun);

  const tope = (bruto) => (bruto > p.maximo ? 'max' : bruto < p.minimo ? 'min' : null);
  const brutoInicial = (base * p.pctInicial) / 100;
  const brutoResto = (base * p.pctResto) / 100;
  const mesesInicial = Math.min(p.mesesInicial, dur.meses);
  const mesesResto = dur.meses - mesesInicial;
  const mensualInicial = clamp(brutoInicial, p.minimo, p.maximo);
  const mensualResto = clamp(brutoResto, p.minimo, p.maximo);
  return {
    ...comun,
    regimen: 'desempleo',
    derecho: true,
    dias: dur.dias,
    meses: dur.meses,
    mesesInicial, mesesResto,
    brutoInicial, brutoResto,
    mensualInicial, mensualResto,
    topeInicial: tope(brutoInicial), topeResto: tope(brutoResto),
    pctInicial: p.pctInicial, pctResto: p.pctResto,
    total: mensualInicial * mesesInicial + mensualResto * mesesResto,
  };
}

/**
 * Cese de actividad de un autónomo.
 * @param {{baseMensual:number, mesesCotizados:number, mesesSeguidos:number}} input
 *   Base media de los últimos 12 meses; meses cotizados en la ventana de 48; y meses seguidos justo antes del cese.
 * @param {import('../data/simParams.js').SimParams} params
 */
export function prestacionCese({ baseMensual, mesesCotizados, mesesSeguidos }, params) {
  const a = params.autonomo.cese;
  const p = params.paro;
  const base = num(baseMensual);
  const meses = Math.floor(num(mesesCotizados));
  const seguidos = Math.floor(num(mesesSeguidos));
  const comun = { baseReguladora: base, mesesCotizados: meses, mesesSeguidos: seguidos, minMeses: a.minMeses };
  if (meses < a.minMeses || seguidos < a.minMeses || base <= 0) return sinDerecho('cese', comun);

  const duracion = duracionCese(meses, params.autonomo);
  const bruto = (base * a.pctBaseReguladora) / 100;
  const mensual = clamp(bruto, p.minimo, p.maximo);
  const tope = bruto > p.maximo ? 'max' : bruto < p.minimo ? 'min' : null;
  return {
    ...comun,
    regimen: 'cese',
    derecho: duracion > 0,
    meses: duracion,
    mesesInicial: duracion, mesesResto: 0,
    brutoInicial: bruto, brutoResto: bruto,
    mensualInicial: mensual, mensualResto: mensual,
    topeInicial: tope, topeResto: tope,
    pctInicial: a.pctBaseReguladora, pctResto: a.pctBaseReguladora,
    total: mensual * duracion,
  };
}

/** Lo que se cobra en los primeros `meses` meses de una prestación (los primeros 6 al porcentaje alto). */
export function cobradoEnMeses(prestacion, meses) {
  if (!prestacion.derecho) return 0;
  const m = Math.min(num(meses), prestacion.meses);
  const inicial = Math.min(m, prestacion.mesesInicial);
  return inicial * prestacion.mensualInicial + (m - inicial) * prestacion.mensualResto;
}

/**
 * Lo cobrado durante `meses` meses de una sola vez, sin límite de duración (para quien sólo dice
 * «he estado X meses en paro»), con la base de una economía concreta.
 * @param {import('./economia.js').Economia} economia
 * @param {number} meses
 * @param {import('../data/simParams.js').SimParams} params
 */
export function importePrestacionMeses(economia, meses, params) {
  const m = Math.min(num(meses), 120);
  if (m <= 0 || economia.baseMensual <= 0) return { meses: 0, importe: 0, mensualInicial: 0, mensualResto: 0 };
  const p = params.paro;
  if (economia.regimen === 'autonomo') {
    const mensual = clamp((economia.baseMensual * params.autonomo.cese.pctBaseReguladora) / 100, p.minimo, p.maximo);
    return { meses: m, importe: mensual * m, mensualInicial: mensual, mensualResto: mensual };
  }
  const mensualInicial = clamp((economia.baseMensual * p.pctInicial) / 100, p.minimo, p.maximo);
  const mensualResto = clamp((economia.baseMensual * p.pctResto) / 100, p.minimo, p.maximo);
  const inicial = Math.min(m, p.mesesInicial);
  return { meses: m, importe: inicial * mensualInicial + (m - inicial) * mensualResto, mensualInicial, mensualResto };
}
