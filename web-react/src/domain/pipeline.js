/**
 * Del estado del explorador (qué series, modo, año base, rango) a las series listas para pintar.
 * Pura: sólo depende de un repositorio con `series(id)` y `meta(id)`.
 */
import { t } from '../i18n/index.js';
import { applyMode, deflate, effectiveBase, MODES } from './transforms.js';
import { unitInfo } from './units.js';

export const REAL_SUFFIX = '~real';
export const MAX_SERIES = 8;

export const parseKey = (key) => (key.endsWith(REAL_SUFFIX)
  ? { id: key.slice(0, -REAL_SUFFIX.length), real: true }
  : { id: key, real: false });

export const makeKey = (id, real) => (real ? id + REAL_SUFFIX : id);

/** ¿Existe versión real (deflactada) de esta serie? */
export const canBeReal = (repo, id) => Boolean(repo.meta(id)?.deflactor);

/**
 * @typedef {object} ViewState
 * @property {string[]} selected  claves «id» o «id~real»
 * @property {'raw'|'index'|'yoy'|'cum'} mode
 * @property {number|null} base  año base pedido (null = inicio del rango)
 * @property {number|null} from  null = desde el primer año con datos
 * @property {number|null} to    null = hasta el último año con datos
 */

/**
 * @returns {{series: import('./Series.js').Series[], unit: string|null, base: number|null,
 *   requestedBase: number, from: number, to: number, errors: {key:string, reason:string}[], notes: {label:string, text:string}[]}}
 */
export function buildView(repo, state) {
  const { selected, mode } = state;
  const errors = [];
  const needsBase = mode === 'index' || mode === 'cum';

  // 1. series crudas (las reales se deflactan con un año provisional sólo para conocer sus años)
  const staged = [];
  for (const key of selected.slice(0, MAX_SERIES)) {
    const { id, real } = parseKey(key);
    if (!repo.hasSeries(id)) { errors.push({ key, reason: t('Serie desconocida') }); continue; }
    const nominal = repo.series(id);
    if (!real) { staged.push({ key, series: nominal, nominal: null, price: null }); continue; }
    const deflId = repo.meta(id).deflactor;
    if (!deflId) { errors.push({ key, reason: t('No tiene versión real') }); continue; }
    const price = repo.series(deflId);
    const probe = deflate(nominal, price, price.firstYear);
    if (!probe) { errors.push({ key, reason: t('No se puede deflactar') }); continue; }
    staged.push({ key, series: probe, nominal, price });
  }

  // 2. un solo tipo de medida en valores originales
  let kept = staged;
  let unit = null;
  if (mode === 'raw' && staged.length) {
    unit = staged[0].series.unit;
    kept = staged.filter((s) => {
      const ok = s.series.unit === unit;
      if (!ok) errors.push({ key: s.key, reason: t('Se mide en {a}, no en {b}', { a: unitInfo(s.series.unit).label, b: unitInfo(unit).label }) });
      return ok;
    });
  } else if (mode !== 'raw') {
    unit = MODES[mode].unit;
  }

  // 3. rango (por defecto, el que cubre todas las series) y año base efectivo
  const from = state.from ?? Math.min(...kept.map((s) => s.series.firstYear));
  const to = state.to ?? Math.max(...kept.map((s) => s.series.lastYear));
  const requestedBase = state.base ?? from;
  const hasReal = kept.some((s) => s.price);
  let base = null;
  if (needsBase || hasReal) {
    base = effectiveBase(kept.map((s) => s.series), requestedBase);
    if (base === null) {
      base = effectiveBase(kept.map((s) => s.series), 0);
      errors.push({ key: '*', reason: t('Ninguna combinación comparte datos desde {year}', { year: requestedBase }) });
    }
  }

  // 4. series finales
  const finals = [];
  for (const s of kept) {
    let series = s.price ? deflate(s.nominal, s.price, base) : s.series;
    if (!series) { errors.push({ key: s.key, reason: t('Sin datos en el año base') }); continue; }
    series = applyMode(series, mode, base);
    if (!series) { errors.push({ key: s.key, reason: t('Sin dato en {year}', { year: base }) }); continue; }
    series = series.slice(from, to);
    if (!series.points.length) { errors.push({ key: s.key, reason: t('Sin datos en el rango') }); continue; }
    finals.push(series);
  }

  const notes = finals.filter((s) => !s.isOfficial).map((s) => ({ label: s.displayLabel, text: [...new Set(s.calc)].join('. ') }));
  return { series: finals, unit, base, requestedBase, from, to, errors, notes };
}
