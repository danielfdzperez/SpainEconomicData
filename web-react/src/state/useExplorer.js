import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { canAdd, createExplorerReducer } from './explorerReducer.js';

/**
 * Hook del explorador: estado + acciones. `message` explica por qué se rechazó
 * la última acción (p. ej. mezclar unidades distintas).
 */
export function useExplorer(repo, initial) {
  const reducer = useMemo(() => createExplorerReducer(repo), [repo]);
  const [state, dispatch] = useReducer(reducer, initial);
  const [message, setMessage] = useState('');
  const ref = useRef(state);
  ref.current = state;

  const toggle = useCallback((key) => {
    const check = canAdd(repo, ref.current, key);
    setMessage(check.ok ? '' : check.reason);
    if (check.ok) dispatch({ type: 'toggle', key });
    return check;
  }, [repo]);

  const actions = useMemo(() => ({
    toggle,
    remove: (key) => dispatch({ type: 'remove', key }),
    switchReal: (id, real) => dispatch({ type: 'switchReal', id, real }),
    setMode: (mode) => { setMessage(''); dispatch({ type: 'mode', mode }); },
    setRange: (from, to) => dispatch({ type: 'range', from, to }),
    setBase: (base) => dispatch({ type: 'base', base }),
    setContext: (context) => dispatch({ type: 'context', context }),
    resetRange: () => dispatch({ type: 'reset-range' }),
    load: (next) => { setMessage(''); dispatch({ type: 'load', state: next }); },
  }), [toggle]);

  return { state, actions, message, setMessage };
}
