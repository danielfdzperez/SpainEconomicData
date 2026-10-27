import { useState } from 'react';
import { formatValue } from '../core/format.js';
import { toCsv } from '../data/csv.js';
import { readPoint } from '../domain/interpret.js';
import { unitInfo } from '../domain/units.js';
import { t } from '../i18n/index.js';
import { StarMark } from './Help.jsx';

const yearsOf = (view) => [...new Set(view.series.flatMap((s) => s.points.map((p) => p.year)))].sort((a, b) => a - b);

/** CSV de lo que se ve (los nombres llevan * si son cálculo nuestro). */
export function viewToCsv(view) {
  const unit = unitInfo(view.unit).label;
  const rows = [[t('anio'), ...view.series.map((s) => s.displayLabel)], [t('unidad'), ...view.series.map(() => unit)]];
  for (const y of yearsOf(view)) rows.push([y, ...view.series.map((s) => (s.has(y) ? Math.round(s.get(y) * 1e4) / 1e4 : ''))]);
  rows.push([t('# * = cálculo o estimación nuestra, no es un dato oficial')]);
  return toCsv(rows);
}

function download(view) {
  const url = URL.createObjectURL(new Blob([viewToCsv(view)], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = t('datos-espana-grafico.csv');
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Tabla accesible de lo que se ve en el gráfico, con lectura +/− opcional y descarga CSV. */
export function DataTable({ view }) {
  const [interpret, setInterpret] = useState(false);
  return (
    <details className="data-table">
      <summary>{t('Ver los datos en una tabla')}</summary>
      <div className="data-table__bar">
        <label className="check-label">
          <input type="checkbox" className="check" checked={interpret} onChange={(e) => setInterpret(e.target.checked)} />
          <span>{t('Añadir la lectura (▲ ▼ ■) a cada dato')}<StarMark /></span>
        </label>
        <button type="button" className="btn btn--ghost" onClick={() => download(view)} disabled={!view.series.length}>{t('Descargar CSV')}</button>
      </div>
      <div className="table-wrap" tabIndex={0} role="region" aria-label={t('Tabla de datos')}>
        {view.series.length ? (
          <table className="table">
            <thead><tr><th scope="col">{t('Año')}</th>{view.series.map((s) => <th key={s.id} scope="col">{s.displayLabel}</th>)}</tr></thead>
            <tbody>
              {yearsOf(view).map((y) => (
                <tr key={y}>
                  <th scope="row">{y}</th>
                  {view.series.map((s) => {
                    if (!s.has(y)) return <td key={s.id} className="na">—</td>;
                    const v = s.get(y);
                    const r = interpret ? readPoint(s, y, v, view.base) : null;
                    return <td key={s.id} className={r ? `tone-${r.tone}` : undefined}>{formatValue(v, view.unit)}{r ? <span className="td-read"> {r.glyph} {r.label}</span> : null}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="muted">{t('Añade series para ver sus datos.')}</p>}
      </div>
    </details>
  );
}
