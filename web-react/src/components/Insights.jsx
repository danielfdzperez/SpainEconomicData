import { formatPct, formatShare, formatValue } from '../core/format.js';
import { glyphFor, readPoint } from '../domain/interpret.js';
import { compoundRates, summarize } from '../domain/stats.js';
import { t } from '../i18n/index.js';
import { Star } from './Help.jsx';

/** Frase en lenguaje llano sobre una serie en el rango visible. Todo es cálculo nuestro. */
export function sentenceFor(series, view) {
  const { from, to, base } = view;
  const s = summarize(series, from, to);
  if (!s) return null;
  const last = s.last;
  const reading = readPoint(series, last.year, last.value, base);
  if (series.semantics === 'annual_change') {
    const c = compoundRates(series, from, to);
    const vals = {
      from: s.first.year, to: last.year, total: formatShare(Math.abs(c.totalPct), 1), perYear: formatPct(c.perYearPct, 2), reading: reading ? reading.text : '',
    };
    return {
      glyph: glyphFor(c.totalPct),
      text: c.totalPct >= 0
        ? t('Entre {from} y {to} subió un {total} en total ({perYear} de media al año). {reading}', vals)
        : t('Entre {from} y {to} bajó un {total} en total ({perYear} de media al año). {reading}', vals),
    };
  }
  if (series.semantics === 'index' || series.semantics === 'cumulative_change') {
    const pace = s.cagr !== null && series.semantics === 'index' ? ` ${t('Ritmo medio: {pace} al año.', { pace: formatPct(s.cagr, 2) })}` : '';
    return { glyph: reading?.glyph ?? '■', text: reading ? `${reading.text}${pace}` : '' };
  }
  const pct = s.pctChange === null ? '' : ` (${formatPct(s.pctChange, 1)})`;
  const cagr = s.cagr !== null ? `, ${t('{rate} de media al año', { rate: formatPct(s.cagr, 2) })}` : '';
  return {
    glyph: glyphFor(s.absChange),
    text: t('De {first} en {y1} a {last} en {y2}{pct}{cagr}.', {
      first: formatValue(s.first.value, series.unit), y1: s.first.year, last: formatValue(last.value, series.unit), y2: last.year, pct, cagr,
    }),
  };
}

/** «Lectura»: resumen en lenguaje llano de cada serie en el rango elegido. */
export function Insights({ view, slots }) {
  const items = view.series.map((s) => ({ s, r: sentenceFor(s, view) })).filter((x) => x.r);
  if (!items.length) return null;
  return (
    <section className="insights" aria-labelledby="insights-title">
      <h3 id="insights-title" className="insights__title">{t('Lectura')}<Star note={t('Los resúmenes y las etiquetas (alta, estable, contracción…) los calculamos nosotros con criterios orientativos.')} /></h3>
      <ul className="insights__list">
        {items.map(({ s, r }) => (
          <li key={s.id} className="insights__item">
            <span className={`legend__key series-${slots.get(s.id)}`} aria-hidden="true" />
            <div><strong>{s.displayLabel}</strong><p><span className="glyph" aria-hidden="true">{r.glyph}</span> {r.text}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
