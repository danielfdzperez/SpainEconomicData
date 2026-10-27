import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { assignSlots } from './colors.js';

/** Ancho en px de un elemento, actualizado al redimensionar. */
export function useElementWidth(ref) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** Colores estables por serie. */
export function useSlots(ids) {
  const ref = useRef(new Map());
  const key = ids.join('|');
  return useMemo(() => {
    ref.current = assignSlots(ref.current, ids);
    return ref.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
