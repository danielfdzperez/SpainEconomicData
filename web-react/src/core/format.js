import { unitInfo } from '../domain/units.js';
import { getLang, intlLocale } from '../i18n/index.js';

const cache = new Map();

function nf(decimals, signed) {
  const key = `${intlLocale()}|${decimals}|${signed}`;
  if (!cache.has(key)) {
    cache.set(key, new Intl.NumberFormat(intlLocale(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      signDisplay: signed ? 'exceptZero' : 'auto',
      useGrouping: 'min2',
    }));
  }
  return cache.get(key);
}

/** Número con el formato del idioma, p. ej. 29.540 / 29,540 o +2,6 / +2.6. */
export function formatNumber(value, { decimals = 1, signed = false } = {}) {
  if (!Number.isFinite(value)) return '—';
  return nf(decimals, signed).format(value);
}

/** Símbolo de porcentaje: «2,6 %» en español, «2.6%» en inglés. */
export const percentSuffix = () => (getLang() === 'en' ? '%' : ' %');

/** Valor con su unidad: «29.540 €», «+2,6 %», «123,4» (en inglés «€29,540», «+2.6%»). */
export function formatValue(value, unit, { decimals } = {}) {
  const u = unitInfo(unit);
  const d = decimals ?? u.decimals;
  const text = formatNumber(value, { decimals: d, signed: Boolean(u.signed) });
  return `${u.prefix}${text}${u.suffix}`;
}

/** Porcentaje con signo: +5,7 %. */
export function formatPct(value, decimals = 1) {
  return `${formatNumber(value, { decimals, signed: true })}${percentSuffix()}`;
}

/** Etiqueta de eje: aplica el divisor de la unidad (p. ej. millones → billones). */
export function formatAxis(value, unit) {
  const u = unitInfo(unit);
  const v = value / (u.axisDivisor ?? 1);
  const integer = Math.abs(v - Math.round(v)) < 1e-9;
  const decimals = u.axisDivisor ? (integer ? 0 : 1) : integer ? 0 : u.decimals;
  return formatNumber(v, { decimals, signed: Boolean(u.signed) });
}

// Importes y recuentos del simulador: siempre con separador de miles («1.579 €»), también con 4 cifras,
// para que las columnas de una tabla se lean alineadas.
const groupedCache = new Map();
function grouped(decimals, signed) {
  const key = `${intlLocale()}|${decimals}|${signed}`;
  if (!groupedCache.has(key)) {
    groupedCache.set(key, new Intl.NumberFormat(intlLocale(), {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals,
      signDisplay: signed ? 'exceptZero' : 'auto', useGrouping: 'always',
    }));
  }
  return groupedCache.get(key);
}

/** Importe en euros: «182.126 €» (en inglés «€182,126»; los negativos, «−€5»). */
export function formatEuro(value, { decimals = 0, signed = false } = {}) {
  if (!Number.isFinite(value)) return '—';
  if (getLang() === 'en') {
    const body = grouped(decimals, false).format(Math.abs(value));
    const sign = value < 0 ? '−' : (signed && value > 0 ? '+' : '');
    return `${sign}€${body}`;
  }
  return `${grouped(decimals, signed).format(value)} €`;
}

/** Millones de euros: «182.126 M €» (en inglés «€182,126M»). */
export function formatMeur(value) {
  const body = formatInt(value);
  return getLang() === 'en' ? `€${body}M` : `${body} M €`;
}

/** Número entero con separador de miles: «12.345». */
export function formatInt(value) {
  if (!Number.isFinite(value)) return '—';
  return grouped(0, false).format(Math.round(value));
}

/** Porcentaje sin signo: «40,3 %». */
export function formatShare(value, decimals = 1) {
  if (!Number.isFinite(value)) return '—';
  return `${formatNumber(value, { decimals })}${percentSuffix()}`;
}
