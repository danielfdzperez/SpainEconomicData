import { useId, useMemo, useState } from 'react';
import { formatValue } from '../core/format.js';
import { t } from '../i18n/index.js';
import { StarMark } from './Help.jsx';

/**
 * Tira de años coloreada por su lectura (▲ ▼ ■). Alterna entre el número y la lectura
 * en palabras, y al elegir un año explica qué significa. Las etiquetas son criterio nuestro (*).
 */
export function ReadingStrip({ series, from, to, read, unit, ariaLabel }) {
  const name = useId();
  const [mode, setMode] = useState('reading');
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);
  const pts = useMemo(() => series.points.filter((p) => p.year >= from && p.year <= to), [series, from, to]);
  if (!pts.length) return null;
  const current = pts.some((p) => p.year === selected) ? selected : pts[pts.length - 1].year;
  const shown = hover ?? current;
  const detail = read(shown, series.get(shown));

  return (
    <div className="strip">
      <div className="strip__bar">
        <span className="strip__title">{t('Ver cada año como')}</span>
        <div className="seg-group">
          {[['reading', t('Lectura')], ['number', t('Número')]].map(([m, label]) => (
            <label key={m} className="seg">
              <input type="radio" className="seg__input" name={name} value={m} checked={mode === m} onChange={() => setMode(m)} />
              <span className="seg__text">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="strip__cells" role="list" aria-label={ariaLabel}>
        {pts.map((p) => {
          const r = read(p.year, p.value);
          return (
            <button key={p.year} type="button" role="listitem" className={`cell tone-${r.tone}${p.year === current ? ' is-selected' : ''}`}
              aria-pressed={p.year === current} aria-label={`${p.year}: ${formatValue(p.value, unit)}. ${r.label}`}
              onClick={() => setSelected(p.year)} onMouseEnter={() => setHover(p.year)} onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(p.year)} onBlur={() => setHover(null)}>
              <span className="cell__year">{p.year}</span>
              <span className="cell__glyph" aria-hidden="true">{r.glyph}</span>
              <span className="cell__main">{mode === 'number' ? formatValue(p.value, unit) : r.label}</span>
            </button>
          );
        })}
      </div>
      <div className={`strip__detail tone-${detail.tone}`} aria-live="polite">
        <strong>{detail.glyph} {shown}: {formatValue(series.get(shown), unit)} — {detail.label}<StarMark /></strong>
        <p>{detail.text}</p>
      </div>
    </div>
  );
}
