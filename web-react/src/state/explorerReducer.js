import { MAX_SERIES, makeKey, parseKey } from '../domain/pipeline.js';
import { t } from '../i18n/index.js';

/**
 * Reglas del estado del explorador, puras y sin React: se prueban en Node.
 * El estado es { selected, mode, base, from, to, context } (el mismo que viaja en la URL).
 */

const unitOf = (repo, key) => repo.meta(parseKey(key).id)?.unit;

/** ¿Se puede añadir `key`? En «valores originales» sólo series con la misma unidad. */
export function canAdd(repo, state, key) {
  if (state.selected.includes(key)) return { ok: true };
  if (state.selected.length >= MAX_SERIES) return { ok: false, reason: t('Máximo {n} series a la vez', { n: MAX_SERIES }) };
  if (state.mode === 'raw' && state.selected.length) {
    if (unitOf(repo, key) !== unitOf(repo, state.selected[0])) {
      return { ok: false, reason: t('Se mide en otra unidad. Cambia a «Índice» o «Variación» para compararla.') };
    }
  }
  return { ok: true };
}

/** @returns {(state: object, action: object) => object} */
export function createExplorerReducer(repo) {
  return function reducer(state, action) {
    switch (action.type) {
      case 'toggle': {
        if (state.selected.includes(action.key)) return { ...state, selected: state.selected.filter((k) => k !== action.key) };
        if (!canAdd(repo, state, action.key).ok) return state;
        return { ...state, selected: [...state.selected, action.key] };
      }
      case 'remove':
        return { ...state, selected: state.selected.filter((k) => k !== action.key) };
      case 'switchReal': {
        const key = makeKey(action.id, action.real);
        if (state.selected.includes(key)) return { ...state, selected: state.selected.filter((k) => k !== key) };
        return canAdd(repo, state, key).ok ? { ...state, selected: [...state.selected, key] } : state;
      }
      case 'mode': {
        let selected = state.selected;
        if (action.mode === 'raw' && selected.length) {
          const u = unitOf(repo, selected[0]);
          selected = selected.filter((k) => unitOf(repo, k) === u);
        }
        return { ...state, mode: action.mode, selected };
      }
      case 'range':
        return { ...state, from: action.from, to: action.to };
      case 'base':
        return { ...state, base: action.base };
      case 'context':
        return { ...state, context: action.context };
      case 'reset-range':
        return { ...state, from: null, to: null, base: null };
      case 'load':
        return { ...action.state, selected: [...action.state.selected] };
      default:
        throw new Error(`Acción desconocida: ${action.type}`);
    }
  };
}
