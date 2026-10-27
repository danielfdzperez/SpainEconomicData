/**
 * Interpretación en lenguaje llano de los datos (+/−).
 * Los umbrales son criterios orientativos nuestros (*), no definiciones oficiales.
 */
import { formatEuro, formatPct, formatShare } from '../core/format.js';
import { getLang, lit, t } from '../i18n/index.js';

/** @typedef {{tone:string, glyph:string, label:string, text:string}} Reading */

export const INFLATION_BANDS = Object.freeze([
  { max: 0, tone: 'deflation', label: lit('Deflación'), note: lit('Los precios bajan: el dinero compra más, pero suele ir de la mano de economía débil.') },
  { max: 1, tone: 'very-low', label: lit('Inflación muy baja'), note: lit('Los precios casi no se mueven.') },
  { max: 3, tone: 'stable', label: lit('Inflación estable'), note: lit('Cerca del 2 % que persigue el Banco Central Europeo.') },
  { max: 5, tone: 'elevated', label: lit('Inflación elevada'), note: lit('Los precios suben más rápido de lo deseable.') },
  { max: 8, tone: 'high', label: lit('Inflación alta'), note: lit('Se nota en el bolsillo: el dinero pierde valor deprisa.') },
  { max: Infinity, tone: 'very-high', label: lit('Inflación muy alta'), note: lit('Subida de precios excepcional.') },
]);

export const GROWTH_BANDS = Object.freeze([
  { max: -5, tone: 'collapse', label: lit('Caída muy fuerte'), note: lit('La economía produce mucho menos que el año anterior.') },
  { max: 0, tone: 'contraction', label: lit('Contracción'), note: lit('La economía produce menos que el año anterior.') },
  { max: 1, tone: 'stagnation', label: lit('Estancamiento'), note: lit('Casi no crece.') },
  { max: 3, tone: 'moderate', label: lit('Crecimiento moderado'), note: lit('Crece a un ritmo razonable.') },
  { max: 5, tone: 'strong', label: lit('Crecimiento fuerte'), note: lit('Crece con vigor.') },
  { max: Infinity, tone: 'boom', label: lit('Crecimiento muy fuerte'), note: lit('Suele ser un rebote tras una caída.') },
]);

function band(bands, value) {
  // -5 y 0 pertenecen al tramo superior solo si no son estrictamente menores
  return bands.find((b) => value < b.max) ?? bands[bands.length - 1];
}

export function classifyInflation(rate) {
  return band(INFLATION_BANDS, rate);
}

export function classifyGrowth(rate) {
  return band(GROWTH_BANDS, rate);
}

export function glyphFor(value, epsilon = 0.05) {
  if (value > epsilon) return '▲';
  if (value < -epsilon) return '▼';
  return '■';
}

/** Cuánto compran hoy 100 € de hace un año si los precios subieron `rate` %. */
export function purchasingPowerOf100(rate) {
  return 100 / (1 + rate / 100);
}

export function inflationReading(year, rate) {
  const b = classifyInflation(rate);
  const lost = formatShare(Math.abs(100 - purchasingPowerOf100(rate)), 1);
  const power = rate >= 0
    ? t('Con el mismo dinero compras un {x} menos que un año antes.', { x: lost })
    : t('Con el mismo dinero compras un {x} más que un año antes.', { x: lost });
  const vals = { year, x: formatShare(Math.abs(rate), 1), power };
  return {
    tone: b.tone, glyph: glyphFor(rate), label: t(b.label),
    text: rate >= 0 ? t('En {year} los precios subieron un {x}. {power}', vals) : t('En {year} los precios bajaron un {x}. {power}', vals),
  };
}

export function growthReading(year, rate) {
  const b = classifyGrowth(rate);
  const vals = { year, x: formatShare(Math.abs(rate), 1) };
  const text = rate >= 0
    ? t('En {year} la economía produjo un {x} más que el año anterior (sin contar la subida de precios).', vals)
    : t('En {year} la economía produjo un {x} menos que el año anterior (sin contar la subida de precios).', vals);
  return { tone: b.tone, glyph: glyphFor(rate), label: t(b.label), text };
}

export function realWageReading(year, change) {
  const up = change >= 0;
  const vals = { year, x: formatShare(Math.abs(change), 1) };
  return {
    tone: up ? 'gain' : 'loss', glyph: glyphFor(change),
    label: up ? t('Gana poder adquisitivo') : t('Pierde poder adquisitivo'),
    text: up
      ? t('En {year} el salario real subió un {x}: el sueldo ganó a los precios.', vals)
      : t('En {year} el salario real bajó un {x}: los precios subieron más que el sueldo.', vals),
  };
}

export function nominalChangeReading(label, year, change) {
  const up = change >= 0;
  const vals = { year, label, x: formatShare(Math.abs(change), 1) };
  return {
    tone: up ? 'up' : 'down', glyph: glyphFor(change), label: up ? t('Sube') : t('Baja'),
    text: up ? t('En {year}, {label} subió un {x} respecto al año anterior.', vals) : t('En {year}, {label} bajó un {x} respecto al año anterior.', vals),
  };
}

/**
 * Lectura de un punto de una serie ya transformada.
 * @param {import('./Series.js').Series} series
 * @param {number} year
 * @param {number} value
 * @param {number} [base] año base (para índices/acumulados)
 * @returns {Reading|null}
 */
export function readPoint(series, year, value, base) {
  const interp = series.meta.interp ?? 'generic';
  const sem = series.semantics;
  if (sem === 'annual_change') {
    if (interp === 'inflation') return inflationReading(year, value);
    if (interp === 'growth') return growthReading(year, value);
    if (series.real) return realWageReading(year, value);
    // en español la etiqueta va en minúsculas dentro de la frase; en inglés se deja tal cual (lleva nombres propios)
    return nominalChangeReading(getLang() === 'en' ? series.label : series.label.toLowerCase(), year, value);
  }
  if (sem === 'index' || sem === 'cumulative_change') {
    const change = sem === 'index' ? value - 100 : value;
    const up = change >= 0;
    const x = formatShare(Math.abs(change), 1);
    if (interp === 'inflation') {
      const vals = { base, year, x, a: formatEuro(100), b: formatEuro(100 + change) };
      return {
        tone: up ? 'elevated' : 'deflation', glyph: glyphFor(change),
        label: up ? t('Precios por encima de {base}', { base }) : t('Precios por debajo de {base}', { base }),
        text: up
          ? t('Desde {base}, los precios han subido un {x}: lo que costaba {a} en {base} cuesta {b} en {year}.', vals)
          : t('Desde {base}, los precios han bajado un {x}: lo que costaba {a} en {base} cuesta {b} en {year}.', vals),
      };
    }
    if (series.real) {
      return {
        tone: up ? 'gain' : 'loss', glyph: glyphFor(change),
        label: up ? t('Más poder adquisitivo que en {base}', { base }) : t('Menos poder adquisitivo que en {base}', { base }),
        text: up
          ? t('Frente a {base}, con este salario se puede comprar un {x} más en {year}.', { base, x, year })
          : t('Frente a {base}, con este salario se puede comprar un {x} menos en {year}.', { base, x, year }),
      };
    }
    return {
      tone: up ? 'up' : 'down', glyph: glyphFor(change),
      label: up ? t('Por encima de {base}', { base }) : t('Por debajo de {base}', { base }),
      text: up
        ? t('En {year} el valor es un {x} mayor que en {base}.', { year, x, base })
        : t('En {year} el valor es un {x} menor que en {base}.', { year, x, base }),
    };
  }
  return null;
}

/** Texto corto para el tooltip del gráfico. */
export function shortReading(reading) {
  return reading ? `${reading.glyph} ${reading.label}` : '';
}

/** Compara dos variaciones acumuladas y dice si el salario ganó a los precios. */
export function wageVsPrices(wageChangePct, pricesChangePct) {
  const real = ((1 + wageChangePct / 100) / (1 + pricesChangePct / 100) - 1) * 100;
  return { real, verdict: real >= 0 ? 'gana' : 'pierde' };
}

export { formatPct };
