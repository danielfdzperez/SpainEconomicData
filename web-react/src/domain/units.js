import { getLang, lit, t } from '../i18n/index.js';

/**
 * Unidades de medida. Dos series son comparables en un mismo eje si comparten unidad.
 * Los textos están en español (clave de traducción); `en` da el prefijo y el sufijo en inglés,
 * donde el euro va delante del número y el % pegado a él.
 */
export const UNITS = Object.freeze({
  eur: { label: lit('€ brutos por año'), axis: lit('€ por año'), decimals: 0, suffix: ' €', en: { prefix: '€', suffix: '' } },
  meur: { label: lit('millones de €'), axis: lit('billones de € (1 billón = 1.000.000 M€)'), decimals: 0, suffix: ' M€', axisDivisor: 1e6, en: { prefix: '€', suffix: 'M' } },
  pct: { label: lit('% de variación anual'), axis: lit('% anual'), decimals: 1, suffix: ' %', signed: true, zero: true, en: { prefix: '', suffix: '%' } },
  pct_cum: { label: lit('% acumulado desde el año base'), axis: lit('% acumulado'), decimals: 1, suffix: ' %', signed: true, zero: true, en: { prefix: '', suffix: '%' } },
  idx25: { label: lit('índice (base 2025 = 100)'), axis: lit('índice, base 2025 = 100'), decimals: 1, suffix: '' },
  idx15: { label: lit('índice (base 2015 = 100)'), axis: lit('índice, base 2015 = 100'), decimals: 1, suffix: '' },
  pers: { label: lit('personas'), axis: lit('millones de personas'), decimals: 0, suffix: ' personas', axisDivisor: 1e6, en: { prefix: '', suffix: ' people' } },
  tasa: { label: lit('% (tasa o porcentaje)'), axis: lit('%'), decimals: 1, suffix: ' %', en: { prefix: '', suffix: '%' } },
  eurpc: { label: lit('€ por habitante'), axis: lit('€ por habitante'), decimals: 0, suffix: ' €', en: { prefix: '€', suffix: '' } },
  eurm2: { label: lit('€ por metro cuadrado'), axis: lit('€ por m²'), decimals: 0, suffix: ' €/m²', en: { prefix: '€', suffix: '/m²' } },
  eurmes: { label: lit('€ al mes'), axis: lit('€ al mes'), decimals: 0, suffix: ' €/mes', en: { prefix: '€', suffix: '/month' } },
  eurm2mes: { label: lit('€ por m² y mes'), axis: lit('€ por m² y mes'), decimals: 2, suffix: ' €/m² al mes', en: { prefix: '€', suffix: '/m² per month' } },
  anios: { label: lit('años de salario bruto'), axis: lit('años de salario'), decimals: 1, suffix: ' años', en: { prefix: '', suffix: ' years' } },
  puntos: { label: lit('puntos (0–100)'), axis: lit('puntos'), decimals: 1, suffix: ' puntos', en: { prefix: '', suffix: ' points' } },
  veces: { label: lit('veces (cociente)'), axis: lit('veces'), decimals: 2, suffix: ' veces', en: { prefix: '', suffix: ' times' } },
  eur_gasto: { label: lit('€ de gasto al año'), axis: lit('€ al año'), decimals: 0, suffix: ' €', en: { prefix: '€', suffix: '' } },
  eur_neto: { label: lit('€ netos al año'), axis: lit('€ netos al año'), decimals: 0, suffix: ' €', en: { prefix: '€', suffix: '' } },
  miles: { label: lit('miles de personas'), axis: lit('miles de personas'), decimals: 0, suffix: ' mil', en: { prefix: '', suffix: ' thousand' } },
  mhoras: { label: lit('miles de horas'), axis: lit('millones de horas (1 millón = 1.000 miles)'), decimals: 0, suffix: ' mil h', axisDivisor: 1e3, en: { prefix: '', suffix: ' thousand h' } },
  index: { label: lit('índice (año base = 100)'), axis: lit('índice, año base = 100'), decimals: 1, suffix: '' },
});

/**
 * Datos de una unidad en el idioma actual: `label` y `axis` ya traducidos, y `prefix`/`suffix`
 * con la forma de escribir el valor («29.540 €» o «€29,540»).
 */
export function unitInfo(unit) {
  const u = UNITS[unit];
  if (!u) return { label: unit, axis: unit, decimals: 1, suffix: '', prefix: '' };
  const en = getLang() === 'en' ? u.en : null;
  return { ...u, label: t(u.label), axis: t(u.axis), prefix: en?.prefix ?? '', suffix: en ? en.suffix : u.suffix };
}

/** @param {{unit:string}[]} list */
export function sameUnit(list) {
  return list.every((s) => s.unit === list[0].unit);
}
