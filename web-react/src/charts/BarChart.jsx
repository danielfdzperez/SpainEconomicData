import { useMemo, useRef, useState } from 'react';
import { formatAxis, formatValue } from '../core/format.js';
import { unitInfo } from '../domain/units.js';
import { t } from '../i18n/index.js';
import { ChartTooltip } from './ChartTooltip.jsx';
import { useElementWidth } from './hooks.js';
import { linear, niceScale, yearTicks } from './scales.js';

/**
 * Barras de una sola serie de tasas (%): positivas arriba, negativas abajo.
 * Cada barra lleva un `tone` (según su lectura interpretada) que el CSS colorea.
 *
 * @param {{series: object, unit: string, from: number, to: number,
 *          read?: (year: number, value: number) => ({tone:string, glyph:string, label:string, text:string}|null),
 *          height?: number}} props
 */
export function BarChart({ series, unit, from, to, read, height = 360 }) {
  const wrapRef = useRef(null);
  const measured = useElementWidth(wrapRef);
  const svgRef = useRef(null);
  const [active, setActive] = useState(null);
  const width = Math.max(280, measured);
  const narrow = width < 560;
  const h = narrow ? Math.min(height, 300) : height;
  const m = { top: 24, right: 12, bottom: 32, left: narrow ? 42 : 54 };
  const iw = width - m.left - m.right;
  const ih = h - m.top - m.bottom;

  const pts = useMemo(() => series.points.filter((p) => p.year >= from && p.year <= to), [series, from, to]);
  const ys = useMemo(() => {
    const vals = pts.map((p) => p.value);
    return niceScale(Math.min(0, ...vals), Math.max(0, ...vals), narrow ? 4 : 6);
  }, [pts, narrow]);

  if (!pts.length) return null;
  const Y = linear([ys.min, ys.max], [m.top + ih, m.top]);
  const slot = iw / pts.length;
  const bw = Math.max(2, Math.min(34, slot - (slot > 8 ? 3 : 1)));
  const xOf = (i) => m.left + (i + 0.5) * slot;
  const years = pts.map((p) => p.year);
  const activeYear = active !== null && years.includes(active) ? active : null;

  const onPointer = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const i = Math.floor((e.clientX - rect.left - m.left) / slot);
    setActive(years[Math.min(years.length - 1, Math.max(0, i))]);
  };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setActive(null); return; }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    let i = activeYear === null ? (e.key === 'ArrowLeft' ? years.length : -1) : years.indexOf(activeYear);
    if (e.key === 'ArrowLeft') i -= 1;
    if (e.key === 'ArrowRight') i += 1;
    if (e.key === 'Home') i = 0;
    if (e.key === 'End') i = years.length - 1;
    setActive(years[Math.min(years.length - 1, Math.max(0, i))]);
  };

  let tip = null;
  let anchor = { x: 0, y: 0 };
  if (activeYear !== null) {
    const v = series.get(activeYear);
    const r = read?.(activeYear, v);
    const top = Math.min(Y(v), Y(0));
    tip = { title: String(activeYear), rows: [{ slot: 1, value: formatValue(v, unit), label: series.displayLabel, hint: r ? `${r.glyph} ${r.label}` : '' }], footer: r?.text ?? '' };
    anchor = { x: xOf(years.indexOf(activeYear)), y: top - 8 < m.top + 30 ? m.top + ih / 2 : top };
  }

  return (
    <div ref={wrapRef}>
      <div className="chart chart--bars" tabIndex={0} onKeyDown={onKeyDown} onBlur={() => setActive(null)}>
        <svg ref={svgRef} className="chart__svg" width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img"
          aria-label={t('Barras de {label}, de {from} a {to}. Flechas izquierda y derecha para recorrer los años.', { label: series.displayLabel, from, to })}>
          <g className="chart__grid">
            {ys.ticks.map((tick) => (
              <g key={tick}>
                <line className={tick === 0 ? 'chart__zero' : 'chart__gridline'} x1={m.left} x2={m.left + iw} y1={Y(tick)} y2={Y(tick)} />
                <text className="chart__tick chart__tick--y" x={m.left - 8} y={Y(tick) + 4} textAnchor="end">{formatAxis(tick, unit)}</text>
              </g>
            ))}
            {yearTicks(years[0], years[years.length - 1], iw, 46).filter((tick) => years.includes(tick)).map((tick) => (
              <text key={tick} className="chart__tick" x={xOf(years.indexOf(tick))} y={m.top + ih + 21} textAnchor="middle">{tick}</text>
            ))}
          </g>
          <text className="chart__axis-title" x={m.left} y={12}>{unitInfo(unit).axis}</text>
          <g className="chart__bars">
            {pts.map((p, i) => {
              const r = read?.(p.year, p.value);
              const y0 = Y(0);
              const y1 = Y(p.value);
              return (
                <rect key={p.year} className={`bar tone-${r?.tone ?? 'plain'}${p.year === activeYear ? ' is-active' : ''}`}
                  x={xOf(i) - bw / 2} width={bw} y={Math.min(y0, y1)} height={Math.max(1, Math.abs(y1 - y0))} rx={Math.min(3, bw / 2)} />
              );
            })}
          </g>
          <rect className="chart__overlay" x={m.left} y={m.top} width={iw} height={ih}
            onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={() => setActive(null)} />
        </svg>
        <ChartTooltip content={tip} anchor={anchor} bounds={{ width, height: h }} />
      </div>
    </div>
  );
}
