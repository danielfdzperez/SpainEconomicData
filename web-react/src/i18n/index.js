/**
 * Idioma de la interfaz (es | en) sin dependencias.
 *
 * Los textos del código están escritos en español y el español es la clave de la traducción:
 *   t('Qué mostrar')                      → «Qué mostrar» | “What to show”
 *   t('Entre {a} y {b}', { a: 2008, b: 2024 })
 *   tx('Elige qué {salario} quieres', { salario: <Term .../> })   → texto con elementos React
 * Si una clave no existe en el diccionario inglés se devuelve el español y se anota en `missing`
 * (los tests comprueban que no queda ninguna).
 */
import { cloneElement, isValidElement, useSyncExternalStore } from 'react';
import en from './en.js';

export const LANGS = Object.freeze(['es', 'en']);
export const DEFAULT_LANG = 'es';
const STORAGE_KEY = 'lang';

const readStored = () => {
  try { const v = localStorage.getItem(STORAGE_KEY); return LANGS.includes(v) ? v : null; } catch { return null; }
};
const writeStored = (v) => { try { localStorage.setItem(STORAGE_KEY, v); } catch { /* sin almacenamiento */ } };

let current = readStored() ?? DEFAULT_LANG;
const listeners = new Set();

/** Claves sin traducir vistas mientras el idioma era inglés (para tests y para depurar). */
export const missing = new Set();

/** Título y descripción de la página (index.html los trae en español). */
const PAGE = {
  es: {
    title: 'Datos de España: salarios, IPC y PIB',
    description: 'Explora y compara salarios, IPC y PIB de España con gráficos interactivos y explicaciones en lenguaje llano.',
  },
  en: {
    title: 'Spain in data: wages, CPI and GDP',
    description: 'Explore and compare Spain’s wages, inflation (CPI) and GDP with interactive charts and plain-language explanations.',
  },
};

const applyToDocument = () => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = current;
  document.title = PAGE[current].title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', PAGE[current].description);
};
applyToDocument();

export const getLang = () => current;

/** Cambia el idioma. `persist: false` no lo guarda (tests). */
export function setLang(lang, { persist = true } = {}) {
  if (!LANGS.includes(lang) || lang === current) return;
  current = lang;
  if (persist) writeStored(lang);
  applyToDocument();
  listeners.forEach((l) => l());
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

/** Idioma actual; el componente se vuelve a pintar cuando cambia. */
export function useLang() {
  return useSyncExternalStore(subscribe, getLang, () => DEFAULT_LANG);
}

/**
 * Contexto: dos textos iguales en español que se traducen distinto se separan con `¦` y una nota
 * («Al año¦hasta»). En español se muestra sólo lo anterior a la marca; en inglés vale la clave entera.
 */
const CTX = '¦';
const LETTERS = /[A-Za-zÁÉÍÓÚáéíóúñÑ]/;

/** Texto (sin sustituir) en el idioma actual. */
function raw(key) {
  if (current !== 'en') return key.includes(CTX) ? key.slice(0, key.indexOf(CTX)) : key;
  const hit = en[key];
  if (hit !== undefined) return hit;
  if (LETTERS.test(key)) missing.add(key);
  return key;
}

const fill = (text, vals) => text.replace(/\{(\w+)\}/g, (m, k) => (k in vals ? String(vals[k]) : m));

/** Traduce `key` y sustituye los {marcadores} por `vals` (texto o número). */
export function t(key, vals) {
  const text = raw(key);
  return vals ? fill(text, vals) : text;
}

/** Como `t`, pero los valores pueden ser elementos React (enlaces, negritas…). Devuelve un array. */
export function tx(key, vals = {}) {
  const parts = raw(key).split(/(\{\w+\})/g);
  return parts.map((p, i) => {
    const m = /^\{(\w+)\}$/.exec(p);
    if (!m || !(m[1] in vals)) return p;
    const v = vals[m[1]];
    return isValidElement(v) ? cloneElement(v, { key: i }) : v;
  });
}

/** Marca un texto constante como «por traducir»: devuelve la clave tal cual; se traduce con `t()` al pintarlo. */
export const lit = (key) => key;

/** Locale de Intl para los números y las fechas. */
export const intlLocale = () => (current === 'en' ? 'en-GB' : 'es-ES');

/** Traducción solo si la clave está en el diccionario; si no, la clave tal cual (nombres propios, códigos…). */
export function tOpt(key, vals) {
  if (current === 'en' && en[key] === undefined) return vals ? fill(key, vals) : key;
  return t(key, vals);
}
