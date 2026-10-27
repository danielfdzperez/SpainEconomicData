/**
 * (De)serialización del estado del explorador en la URL, para poder compartir un gráfico.
 * Formato: s=id1,id2~real&m=index&b=2008&f=2008&t=2024&c=1
 */
export const DEFAULT_STATE = Object.freeze({
  selected: [],
  mode: 'index',
  base: null,
  from: null,
  to: null,
  context: true,
});

const MODES = new Set(['raw', 'index', 'yoy', 'cum']);
const year = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : null;
};

/** @param {URLSearchParams} params */
export function decodeState(params, defaults = DEFAULT_STATE) {
  const state = { ...defaults, selected: [...defaults.selected] };
  if (params.has('s')) state.selected = params.get('s').split(',').filter((k) => /^[a-z0-9_]+(~real)?$/.test(k));
  if (params.has('m') && MODES.has(params.get('m'))) state.mode = params.get('m');
  if (params.has('b')) state.base = year(params.get('b'));
  if (params.has('f')) state.from = year(params.get('f'));
  if (params.has('t')) state.to = year(params.get('t'));
  if (params.has('c')) state.context = params.get('c') !== '0';
  return state;
}

export function encodeState(state) {
  const p = new URLSearchParams();
  if (state.selected.length) p.set('s', state.selected.join(','));
  p.set('m', state.mode);
  if (state.base !== null) p.set('b', state.base);
  if (state.from !== null) p.set('f', state.from);
  if (state.to !== null) p.set('t', state.to);
  if (!state.context) p.set('c', '0');
  return p;
}
