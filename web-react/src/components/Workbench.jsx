import { useCallback, useEffect, useMemo } from 'react';
import { LineChart } from '../charts/LineChart.jsx';
import { useSlots } from '../charts/hooks.js';
import { EVENTS } from '../content/events.js';
import { PRESETS } from '../content/presets.js';
import { useRepo } from '../data/DataContext.jsx';
import { readPoint, shortReading } from '../domain/interpret.js';
import { buildView } from '../domain/pipeline.js';
import { MODES } from '../domain/transforms.js';
import { unitInfo } from '../domain/units.js';
import { t } from '../i18n/index.js';
import { useExplorer } from '../state/useExplorer.js';
import { Controls } from './Controls.jsx';
import { DataTable } from './DataTable.jsx';
import { Footnotes } from './Footnotes.jsx';
import { Insights } from './Insights.jsx';
import { Legend } from './Legend.jsx';
import { SeriesPicker } from './SeriesPicker.jsx';

const DEFAULT_BOUNDS = { min: 1995, max: 2026 };

/** ¿Dos estados dibujan lo mismo? (la marca de épocas no cuenta) */
const sameView = (a, b) => a.mode === b.mode && a.base === b.base && a.from === b.from && a.to === b.to
  && a.selected.length === b.selected.length && a.selected.every((k, i) => k === b.selected[i]);

/** Años cubiertos por las series seleccionadas (para los desplegables de rango). */
function boundsOf(repo, selected) {
  const metas = selected.map((k) => repo.meta(k.replace(/~real$/, ''))).filter(Boolean);
  if (!metas.length) return DEFAULT_BOUNDS;
  return { min: Math.min(...metas.map((m) => m.primer_anio)), max: Math.max(...metas.map((m) => m.ultimo_anio)) };
}

/**
 * Mesa de trabajo: compone selector, controles, leyenda, gráfico, lectura, notas y tabla
 * alrededor del estado del explorador. `variant="compact"` omite selector, controles y tabla.
 */
export function Workbench({ initial, variant = 'full', presets = PRESETS, onStateChange }) {
  const repo = useRepo();
  const model = useExplorer(repo, initial);
  const { state, actions } = model;
  const full = variant === 'full';

  const view = useMemo(() => buildView(repo, state), [repo, state]);
  const slots = useSlots(view.series.map((s) => s.id));
  const bounds = useMemo(() => boundsOf(repo, state.selected), [repo, state.selected]);
  const preset = presets.find((p) => sameView(p.state, state));
  const events = state.context ? EVENTS : [];
  const describe = useCallback((s, year, v) => shortReading(readPoint(s, year, v, view.base)), [view.base]);

  useEffect(() => { onStateChange?.(state); }, [state, onStateChange]);

  const hasData = view.series.length > 0;
  const unit = unitInfo(view.unit);
  const showBase = view.base && (state.mode === 'index' || state.mode === 'cum' || view.series.some((s) => s.real));

  return (
    <div className={`bench bench--${variant}`}>
      <div className="bench__main">
        {full ? (
          <button type="button" className="btn btn--ghost bench__jump"
            onClick={() => document.getElementById('bench-side')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{t('Añadir o quitar series ↓')}</button>
        ) : null}
        <div className="presets" role="group" aria-label={t('Gráficos preparados')}>
          {presets.map((p) => (
            <button key={p.id} type="button" className={`chip${p === preset ? ' is-active' : ''}`} aria-pressed={p === preset} title={t(p.blurb)}
              onClick={() => actions.load({ ...p.state })}>{t(p.title)}</button>
          ))}
        </div>
        {full ? <Controls model={model} bounds={bounds} /> : null}
        <Legend model={model} view={view} slots={slots} />
        {hasData ? <p className="bench__caption"><strong>{t(preset?.title ?? MODES[state.mode].label)}</strong>{` — ${unit.label}${showBase ? ` · ${t('año base {base}', { base: view.base })}` : ''}`}</p> : null}
        {hasData ? (
          <figure className="bench__chart">
            <LineChart series={view.series} slots={slots} unit={view.unit} from={view.from} to={view.to} base={view.base}
              events={events} describe={describe} height={full ? 460 : 420} />
          </figure>
        ) : (
          <div className="bench__empty">
            <p className="bench__empty-title">{state.selected.length ? t('No hay datos para mostrar con estos ajustes.') : t('Todavía no hay nada en el gráfico.')}</p>
            <p>{state.selected.length ? t('Prueba con «Todo el periodo» o con otro año base.') : t('Elige series en la columna de la izquierda o empieza con un gráfico preparado de arriba.')}</p>
          </div>
        )}
        <Insights view={view} slots={slots} />
        <Footnotes view={view} />
        {full ? <DataTable view={view} /> : null}
      </div>
      {full ? <aside id="bench-side" className="bench__side"><SeriesPicker model={model} /></aside> : null}
    </div>
  );
}
