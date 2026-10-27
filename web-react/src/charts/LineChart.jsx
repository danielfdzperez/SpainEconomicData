import { useCallback, useMemo, useRef, useState } from 'react';
import { formatAxis, formatValue } from '../core/format.js';
import { unitInfo } from '../domain/units.js';
import { t } from '../i18n/index.js';
import { ChartTooltip } from './ChartTooltip.jsx';
import { useElementWidth } from './hooks.js';
import { linear, niceScale, spreadLabels, yearTicks } from './scales.js';

const LABEL_CHARS = 27;
const LABEL_LINE = 14;

/** Parte una etiqueta en hasta 3 líneas por palabras, sin cortar ninguna. */
export function wrapLabel(text) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && `${line} ${word}`.length > LABEL_CHARS && lines.length < 2) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  lines.push(line);
  return lines;
}

/** Geometría del gráfico: función pura de datos y tamaño (fácil de probar). */
function computeGeometry({ series, unit, from, to, width, baseHeight }) {
  const narrow = width < 560;
  const height = narrow ? Math.min(baseHeight, 340) : baseHeight;
  const labelled = series.length > 0 && series.length <= 4 && !narrow;
  const m = { top: 30, right: labelled ? 196 : 18, bottom: 34, left: narrow ? 46 : 58 };
  const iw = width - m.left - m.right;
  const ih = height - m.top - m.bottom;
  const u = unitInfo(unit);
  const values = series.flatMap((s) => s.points.map((p) => p.value));
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (u.zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    else if (lo > 0) lo = Math.max(0, lo - (hi - lo) * 0.04);   // aire bajo la serie: evita que la etiqueta «año base» pise la línea
  const ys = niceScale(lo, hi, narrow ? 4 : 6);
  const x0 = from === to ? from - 1 : from;
  const x1 = from === to ? to + 1 : to;
  const X = linear([x0, x1], [m.left, m.left + iw]);
  const Y = linear([ys.min, ys.max], [m.top + ih, m.top]);
  return { narrow, height, labelled, m, iw, ih, u, ys, x0, x1, X, Y, lo };
}

function pathOf(series, X, Y) {
  let d = '';
  let prev = null;
  for (const p of series.points) {
    d += `${prev !== null && p.year === prev + 1 ? 'L' : 'M'}${X(p.year).toFixed(1)} ${Y(p.value).toFixed(1)}`;
    prev = p.year;
  }
  return d;
}

/**
 * Gráfico de líneas SVG. Todas las series comparten un único eje Y (misma unidad).
 * @param {{series: object[], slots: Map<string, number>, unit: string, from: number, to: number, base?: number|null,
 *          events?: object[], describe?: (s: object, year: number, v: number) => string, height?: number}} props
 */
export function LineChart({ series, slots, unit, from, to, base = null, events = [], describe, height = 440 }) {
  const wrapRef = useRef(null);
  const measured = useElementWidth(wrapRef);
  const width = Math.max(280, measured);
  const [activeYear, setActiveYear] = useState(null);
  const svgRef = useRef(null);

  const g = useMemo(() => computeGeometry({ series, unit, from, to, width, baseHeight: height }),
    [series, unit, from, to, width, height]);
  const { m, X, Y, ih, iw, x0, x1, ys } = g;

  const year = activeYear !== null && activeYear >= from && activeYear <= to ? activeYear : null;

  const onPointer = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const y = Math.round(X.invert(e.clientX - rect.left));
    setActiveYear(Math.min(to, Math.max(from, y)));
  }, [X, from, to]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setActiveYear(null); return; }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    let y = year ?? (e.key === 'ArrowLeft' ? to + 1 : from - 1);
    if (e.key === 'ArrowLeft') y -= 1;
    if (e.key === 'ArrowRight') y += 1;
    if (e.key === 'Home') y = from;
    if (e.key === 'End') y = to;
    setActiveYear(Math.min(to, Math.max(from, y)));
  };

  const showBase = base && base >= x0 && base <= x1 && (unit === 'index' || unit === 'pct_cum');

  const endLabels = useMemo(() => {
    if (!g.labelled) return [];
    const items = series.map((s) => {
      const last = s.points[s.points.length - 1];
      return { s, lines: wrapLabel(s.displayLabel), x: X(last.year), y: Y(last.value) };
    });
    const gap = LABEL_LINE * Math.max(...items.map((i) => i.lines.length)) + 4;
    return spreadLabels(items, gap, m.top + 6, m.top + ih - gap / 2);
  }, [g.labelled, series, X, Y, m.top, ih]);

  let tip = null;
  let anchor = { x: 0, y: 0 };
  if (year !== null) {
    const rows = [];
    let anchorY = m.top + ih / 2;
    for (const s of series) {
      const v = s.get(year);
      if (v === undefined) continue;
      rows.push({ slot: slots.get(s.id) ?? 1, value: formatValue(v, unit), label: s.displayLabel, hint: describe ? describe(s, year, v) : '' });
      anchorY = Y(v);
    }
    const ev = events.find((e) => year >= e.from && year <= e.to);
    const baseNote = base === year && (unit === 'index' || unit === 'pct_cum') ? t('Año base') : '';
    tip = { title: String(year), rows, footer: [baseNote, ev ? t('Contexto: {label}', { label: t(ev.label) }) : ''].filter(Boolean).join(' · ') };
    anchor = { x: X(year), y: rows.length > 1 ? m.top + ih / 2 : anchorY };
  }

  if (!series.length) return null;
  const ariaLabel = t('Gráfico de líneas, {from} a {to}, en {unit}. Series: {series}. Usa las flechas izquierda y derecha para recorrer los años.', {
    from, to, unit: unitInfo(unit).label, series: series.map((s) => s.displayLabel).join('; '),
  });

  return (
    <div ref={wrapRef}>
      <div className="chart" tabIndex={0} onKeyDown={onKeyDown} onBlur={() => setActiveYear(null)}>
        <svg ref={svgRef} className="chart__svg" width={width} height={g.height} viewBox={`0 0 ${width} ${g.height}`} role="img" aria-label={ariaLabel}>
          <g className="chart__bands">
            {events.map((ev) => {
              const a = Math.max(ev.from, x0);
              const b = Math.min(ev.to, x1);
              if (b < a) return null;
              const pad = a === b ? 0.4 : 0;
              const bx = X(a - pad);
              const bw = Math.max(3, X(b + pad) - bx);
              return (
                <g key={ev.label}>
                  <rect className="chart__band" x={bx} y={m.top} width={bw} height={ih} />
                  {bw > 74 ? <text className="chart__band-label" x={bx + 6} y={m.top + 13}>{t(ev.short)}</text> : null}
                </g>
              );
            })}
          </g>

          <g className="chart__grid">
            {ys.ticks.map((tick) => (
              <g key={tick}>
                <line className={tick === 0 && g.lo < 0 ? 'chart__zero' : 'chart__gridline'} x1={m.left} x2={m.left + iw} y1={Y(tick)} y2={Y(tick)} />
                <text className="chart__tick chart__tick--y" x={m.left - 8} y={Y(tick) + 4} textAnchor="end">{formatAxis(tick, unit)}</text>
              </g>
            ))}
            {yearTicks(x0, x1, iw).map((tick) => (
              <text key={tick} className="chart__tick" x={X(tick)} y={m.top + ih + 22} textAnchor="middle">{tick}</text>
            ))}
          </g>
          <text className="chart__axis-title" x={m.left} y={14}>{unitInfo(unit).axis}</text>

          {showBase ? (
            <>
              <line className="chart__base" x1={X(base)} x2={X(base)} y1={m.top} y2={m.top + ih} />
              <text className="chart__base-label" x={X(base) + 5} y={m.top + ih - 6}>{t('año base {base}', { base })}</text>
            </>
          ) : null}

          <g className="chart__lines">
            {series.map((s) => {
              const slot = slots.get(s.id) ?? 1;
              return (
                <g key={s.id}>
                  <path className={`chart__line series-${slot}`} d={pathOf(s, X, Y)} />
                  {s.points.filter((p) => !s.has(p.year - 1) && !s.has(p.year + 1)).map((p) => (
                    <circle key={p.year} className={`chart__dot series-${slot}`} cx={X(p.year)} cy={Y(p.value)} r={3.5} />
                  ))}
                </g>
              );
            })}
          </g>

          {endLabels.length ? (
            <g className="chart__labels">
              {endLabels.map((it) => {
                const slot = slots.get(it.s.id) ?? 1;
                return (
                  <g key={it.s.id}>
                    <line className={`chart__label-key series-${slot}`} x1={it.x + 6} x2={it.x + 16} y1={it.y} y2={it.y} />
                    <text className="chart__label" x={it.x + 21} y={it.y + 4 - ((it.lines.length - 1) * LABEL_LINE) / 2}>
                      {it.lines.map((ln, i) => <tspan key={ln} x={it.x + 21} dy={i ? LABEL_LINE : 0}>{ln}</tspan>)}
                    </text>
                  </g>
                );
              })}
            </g>
          ) : null}

          <g className="chart__hover" aria-hidden="true">
            {year !== null ? (
              <>
                <line className="chart__crosshair" x1={X(year)} x2={X(year)} y1={m.top} y2={m.top + ih} />
                {series.filter((s) => s.has(year)).map((s) => (
                  <circle key={s.id} className={`chart__marker series-${slots.get(s.id) ?? 1}`} cx={X(year)} cy={Y(s.get(year))} r={4.5} />
                ))}
              </>
            ) : null}
          </g>
          <rect className="chart__overlay" x={m.left} y={m.top} width={iw} height={ih}
            onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={() => setActiveYear(null)} />
        </svg>
        <ChartTooltip content={tip} anchor={anchor} bounds={{ width, height: g.height }} />
      </div>
    </div>
  );
}
