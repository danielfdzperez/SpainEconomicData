/** Búsqueda de series por texto: sin mayúsculas ni tildes, y todas las palabras deben aparecer. */
import { t } from '../i18n/index.js';

export function normalize(text) {
  return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Palabras de la consulta ya normalizadas (vacío si no hay búsqueda). */
export function queryWords(query) {
  return normalize(query).split(/\s+/).filter(Boolean);
}

/** @param {{label:string, group:string, territorio?:string}} meta */
export function matchesQuery(meta, words) {
  if (!words.length) return true;
  // el grupo y el territorio son claves en español: se busca también por su traducción
  const haystack = normalize(`${meta.label} ${meta.group} ${t(meta.group)} ${meta.territorio ?? ''} ${meta.territorio ? t(meta.territorio) : ''}`);
  return words.every((w) => haystack.includes(w));
}

export function filterMetas(metas, query) {
  const words = queryWords(query);
  return words.length ? metas.filter((m) => matchesQuery(m, words)) : metas;
}
