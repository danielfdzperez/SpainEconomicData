import { useMemo, useState } from 'react';
import { BarChart } from '../charts/BarChart.jsx';
import { formatNumber, percentSuffix } from '../core/format.js';
import { useRepo } from '../data/DataContext.jsx';
import { t } from '../i18n/index.js';
import { ReadingStrip } from './ReadingStrip.jsx';
import { Star } from './Help.jsx';

function rangeText(bands, i) {
  const n = (v) => formatNumber(v, { decimals: 0 }).replace('-', '−');
  const ps = percentSuffix();
  if (i === 0) return t('menos de {n}', { n: n(bands[0].max) + ps });
  if (i === bands.length - 1) return t('{n} o más', { n: n(bands[i - 1].max) + ps });
  return t('de {a} a {b}', { a: n(bands[i - 1].max), b: n(bands[i].max) + ps });
}

/**
 * Bloque «dato interpretado» para series de tasas anuales: barras + tira de lectura + leyenda
 * de tramos. Los tramos son criterio orientativo nuestro (*).
 */
export function RateExplorer({ choices, read, bands }) {
  const repo = useRepo();
  const [id, setId] = useState(choices[0].id);
  const [fromSel, setFromSel] = useState(null);
  const [toSel, setToSel] = useState(null);
  const series = repo.series(id);
  const years = useMemo(() => series.years, [series]);
  const from = years.includes(fromSel) ? fromSel : years[0];
  const to = years.includes(toSel) ? toSel : years[years.length - 1];

  const onRange = (a, b) => { const [f, g] = a > b ? [b, a] : [a, b]; setFromSel(f); setToSel(g); };

  return (
    <div className="rate">
      <div className="rate__controls">
        {choices.length > 1 ? (
          <label className="field"><span className="field__label">{t('Serie')}</span>
            <select className="select" aria-label={t('Serie')} value={id} onChange={(e) => setId(e.target.value)}>
              {choices.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select></label>
        ) : <strong>{choices[0].label}</strong>}
        <label className="field"><span className="field__label">{t('Desde')}</span>
          <select className="select" aria-label={t('Año inicial')} value={from} onChange={(e) => onRange(Number(e.target.value), to)}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
        <label className="field"><span className="field__label">{t('Hasta')}</span>
          <select className="select" aria-label={t('Año final')} value={to} onChange={(e) => onRange(from, Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
      </div>
      <figure className="rate__fig"><BarChart series={series} unit="pct" from={from} to={to} read={read} height={340} /></figure>
      <div className="rate__strip"><ReadingStrip series={series} from={from} to={to} read={read} unit="pct" ariaLabel={t('Lectura año a año')} /></div>
      <section className="rate__bands">
        <h3>{t('Cómo se interpreta')}<Star note={t('Los tramos son un criterio orientativo nuestro, no una definición oficial.')} /></h3>
        <ul className="bands">
          {bands.map((b, i) => (
            <li key={b.label} className={`band tone-${b.tone}`}>
              <span className="band__swatch" aria-hidden="true" />
              <div><strong>{t(b.label)}</strong> <span className="muted">({rangeText(bands, i)})</span><p>{t(b.note)}</p></div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
