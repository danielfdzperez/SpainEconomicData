import { StarMark } from '../Help.jsx';
import { formatEuro, formatShare } from '../../core/format.js';

/** Cifra grande con su etiqueta. `own` pone el asterisco: es un cálculo o estimación nuestra. */
export function Big({ value, label, sub, own = true, tone = '' }) {
  return (
    <div className={`big ${tone ? `big--${tone}` : ''}`}>
      <div className="big__value">{value}{own ? <StarMark /> : null}</div>
      <div className="big__label">{label}</div>
      {sub ? <div className="big__sub">{sub}</div> : null}
    </div>
  );
}

/**
 * Barra apilada con leyenda. Los colores van por variable CSS (--c-…); la leyenda repite
 * nombre, importe y porcentaje, así que el color nunca es lo único que identifica un tramo.
 */
export function StackBar({ title, segments, caption, decimals = 0 }) {
  const items = segments.filter((s) => s.value > 0);
  const total = items.reduce((s, x) => s + x.value, 0);
  const aria = `${title}: ${items.map((s) => `${s.label} ${formatEuro(s.value, { decimals })} (${formatShare((s.value / total) * 100)})`).join('; ')}`;
  return (
    <figure className="stack">
      <figcaption className="stack__title">{title}</figcaption>
      <div className="stack__bar" role="img" aria-label={aria}>
        {items.map((s) => <span key={s.key} className="stack__seg" style={{ flexGrow: s.value, background: `var(${s.color})` }} />)}
      </div>
      <ul className="stack__legend">
        {items.map((s) => (
          <li key={s.key}>
            <span className="stack__swatch" style={{ background: `var(${s.color})` }} aria-hidden="true" />
            <span className="stack__name">{s.label}</span>
            <span className="stack__val">{formatEuro(s.value, { decimals })}<span className="stack__pct"> · {formatShare((s.value / total) * 100)}</span></span>
          </li>
        ))}
      </ul>
      {caption ? <p className="stack__caption">{caption}</p> : null}
    </figure>
  );
}

/** Barras horizontales sueltas (una o varias piezas apiladas por fila) sobre la misma escala. */
export function ScaleBars({ rows, max }) {
  const top = max ?? Math.max(...rows.map((r) => r.parts.reduce((s, p) => s + p.value, 0)), 1);
  return (
    <ul className="scale">
      {rows.map((r) => {
        const total = r.parts.reduce((s, p) => s + p.value, 0);
        return (
          <li key={r.key} className="scale__row">
            <div className="scale__head">
              <span className="scale__label">{r.label}</span>
              <span className="scale__total">{formatEuro(total)}<StarMark /></span>
            </div>
            <div className="scale__track" role="img" aria-label={`${r.label}: ${r.parts.filter((p) => p.value > 0).map((p) => `${p.label} ${formatEuro(p.value)}`).join('; ')}`}>
              {r.parts.filter((p) => p.value > 0).map((p) => (
                <span key={p.key} className="scale__seg" style={{ width: `${(p.value / top) * 100}%`, background: `var(${p.color})` }} title={`${p.label}: ${formatEuro(p.value)}`} />
              ))}
            </div>
            {r.note ? <div className="scale__note">{r.note}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Leyenda suelta para ScaleBars. */
export function KeyList({ items }) {
  return (
    <ul className="keylist">
      {items.map((i) => <li key={i.key}><span className="stack__swatch" style={{ background: `var(${i.color})` }} aria-hidden="true" />{i.label}</li>)}
    </ul>
  );
}

/** Pares de barras (A frente a B) por categoría, sobre una escala común. */
export function PairBars({ rows, a, b }) {
  const top = Math.max(...rows.flatMap((r) => [r.a, r.b]), 1);
  const bar = (value, color, who, label) => (
    <div className="pairs__line">
      <span className="pairs__track"><span className="pairs__bar" style={{ width: `${(value / top) * 100}%`, background: `var(${color})` }} /></span>
      <span className="pairs__val"><span className="sr-only">{who}: </span>{formatEuro(value)}</span>
    </div>
  );
  return (
    <div className="pairs">
      <ul className="keylist">
        <li><span className="stack__swatch" style={{ background: `var(${a.color})` }} aria-hidden="true" />{a.label}</li>
        <li><span className="stack__swatch" style={{ background: `var(${b.color})` }} aria-hidden="true" />{b.label}</li>
      </ul>
      {rows.map((r) => (
        <div key={r.key} className="pairs__row">
          <div className="pairs__label">{r.label}</div>
          {bar(r.a, a.color, a.label)}
          {bar(r.b, b.color, b.label)}
        </div>
      ))}
    </div>
  );
}
