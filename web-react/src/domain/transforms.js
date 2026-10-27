/**
 * Transformaciones puras entre series. Todas devuelven una Series nueva y anotan en `calc`
 * qué cálculo nuestro se ha aplicado (para marcarlo con * en la interfaz).
 */
import { lit, t } from '../i18n/index.js';
import { Series } from './Series.js';

export const MODES = Object.freeze({
  raw: { id: 'raw', label: lit('Valores originales'), unit: null },
  index: { id: 'index', label: lit('Índice (año base = 100)'), unit: 'index' },
  yoy: { id: 'yoy', label: lit('Variación anual (%)'), unit: 'pct' },
  cum: { id: 'cum', label: lit('Variación acumulada (%)'), unit: 'pct_cum' },
});

/**
 * Encadena tasas anuales (%) en un nivel. El año previo al primero vale 100.
 * @returns {Map<number, number>} año → nivel (sólo años consecutivos desde el primero)
 */
export function integrateRates(series) {
  const levels = new Map();
  let level = 100;
  let prevYear = null;
  for (const { year, value } of series.points) {
    if (prevYear !== null && year !== prevYear + 1) break; // hueco: no encadenamos a ciegas
    level *= 1 + value / 100;
    levels.set(year, level);
    prevYear = year;
  }
  return levels;
}

/** Nivel de una serie: tal cual si es 'level', encadenado si es 'rate'. */
export function levelMap(series) {
  if (series.kind === 'rate') return integrateRates(series);
  return new Map(series.points.map((p) => [p.year, p.value]));
}

/** Años en los que se puede expresar la serie como nivel. */
export function levelYears(series) {
  return [...levelMap(series).keys()].sort((a, b) => a - b);
}

function fromMap(map) {
  const points = [...map.entries()].map(([year, value]) => ({ year, value }));
  return points;
}

/** Índice con valor 100 en `base`. Devuelve null si la serie no tiene dato en ese año. */
export function toIndex(series, base) {
  const lv = levelMap(series);
  const b = lv.get(base);
  if (b === undefined || b === 0) return null;
  const note = series.kind === 'rate'
    ? t('Índice base {base} = 100, encadenando las tasas anuales', { base })
    : t('Índice base {base} = 100: cada valor entre el de {base}', { base });
  return series.derive({
    unit: 'index', kind: 'level', semantics: 'index',
    points: fromMap(new Map([...lv].map(([y, v]) => [y, (v / b) * 100]))),
    calc: [...series.calc, note],
  });
}

/** Variación porcentual acumulada desde `base`. */
export function toCumulative(series, base) {
  const idx = toIndex(series, base);
  if (!idx) return null;
  return idx.derive({
    unit: 'pct_cum', semantics: 'cumulative_change',
    points: idx.points.map((p) => ({ year: p.year, value: p.value - 100 })),
    calc: [...series.calc, t('Variación acumulada desde {base}', { base })],
  });
}

/** Variación anual (%): para tasas es la propia serie; para niveles, año contra año anterior. */
export function toYoY(series) {
  if (series.kind === 'rate') return series.derive({ unit: 'pct', semantics: 'annual_change' });
  const points = [];
  for (const { year, value } of series.points) {
    const prev = series.get(year - 1);
    if (prev !== undefined && prev !== 0) points.push({ year, value: (value / prev - 1) * 100 });
  }
  return series.derive({
    unit: 'pct', kind: 'rate', semantics: 'annual_change', points,
    calc: [...series.calc, t('Variación anual: cada valor frente al del año anterior')],
  });
}

/**
 * Deflacta una serie nominal con un índice de precios. Resultado en euros constantes de `base`.
 * @param {Series} nominal  serie en euros
 * @param {Series} price    índice de precios (nivel) o tasa anual de inflación
 * @param {number} base     año cuyos precios se toman como referencia
 * @returns {Series|null}
 */
export function deflate(nominal, price, base) {
  const p = levelMap(price);
  const pBase = p.get(base);
  if (pBase === undefined) return null;
  const points = [];
  for (const { year, value } of nominal.points) {
    const py = p.get(year);
    if (py !== undefined) points.push({ year, value: (value * pBase) / py });
  }
  if (!points.length) return null;
  return nominal.derive({
    id: `${nominal.id}~real`,
    label: `${nominal.label} ${t('(real)')}`,
    points, real: true,
    calc: [...nominal.calc, t('Salario real: dividido entre el índice de precios ({price}) y expresado en euros de {base}', { price: price.label, base })],
  });
}

/** Aplica un modo de visualización. Devuelve null si no es posible con ese año base. */
export function applyMode(series, mode, base) {
  switch (mode) {
    case 'raw': return series;
    case 'index': return toIndex(series, base);
    case 'yoy': return toYoY(series);
    case 'cum': return toCumulative(series, base);
    default: throw new Error(`Modo desconocido: ${mode}`);
  }
}

/**
 * Primer año >= `requested` en que todas las series tienen dato como nivel.
 * Devuelve null si no existe ninguno.
 */
export function effectiveBase(seriesList, requested) {
  if (!seriesList.length) return requested;
  const sets = seriesList.map((s) => new Set(levelYears(s)));
  const all = [...sets[0]].filter((y) => y >= requested && sets.every((set) => set.has(y)));
  return all.length ? Math.min(...all) : null;
}
