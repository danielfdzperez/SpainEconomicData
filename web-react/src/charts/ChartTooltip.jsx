import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Tooltip HTML de un gráfico. El valor manda (negrita) y la etiqueta acompaña;
 * cada fila lleva un trazo corto con el color de la serie.
 *
 * @param {{content: {title:string, rows:{slot:number,value:string,label:string,hint?:string}[], footer?:string}|null,
 *          anchor: {x:number,y:number}, bounds: {width:number,height:number}}} props
 */
export function ChartTooltip({ content, anchor, bounds }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!content || !ref.current) return;
    const w = ref.current.offsetWidth;
    const h = ref.current.offsetHeight;
    const gap = 14;
    let left = anchor.x + gap;
    if (left + w > bounds.width - 4) left = anchor.x - gap - w;
    left = Math.max(4, left);
    const top = Math.min(Math.max(4, anchor.y - h / 2), bounds.height - h - 4);
    setPos({ left: Math.round(left), top: Math.round(top) });
  }, [content, anchor.x, anchor.y, bounds.width, bounds.height]);

  if (!content) return null;
  return (
    <div ref={ref} className="chart-tip" role="status" aria-live="polite" style={{ transform: `translate(${pos.left}px, ${pos.top}px)` }}>
      <div className="chart-tip__title">{content.title}</div>
      {content.rows.map((r) => (
        <div key={r.label} className="chart-tip__row">
          <span className={`chart-tip__key series-${r.slot}`} aria-hidden="true" />
          <span className="chart-tip__value">{r.value}</span>
          <span className="chart-tip__label">{r.label}</span>
          {r.hint ? <span className="chart-tip__hint">{r.hint}</span> : null}
        </div>
      ))}
      {content.footer ? <div className="chart-tip__footer">{content.footer}</div> : null}
    </div>
  );
}
