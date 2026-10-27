import { t } from '../i18n/index.js';
import { StarMark } from './Help.jsx';

/** Pie del gráfico: qué cálculos nuestros llevan * y avisos si algo no se puede mostrar. */
export function Footnotes({ view }) {
  if (!view.errors.length && !view.notes.length) return null;
  return (
    <div className="footnotes">
      {view.errors.length ? (
        <ul className="footnotes__warn" role="status">
          {view.errors.map((e) => <li key={`${e.key}${e.reason}`}>{e.key === '*' ? '' : `${e.key.replace(/~real$/, ' (real)')}: `}{e.reason}</li>)}
        </ul>
      ) : null}
      {view.notes.length ? (
        <>
          <p className="footnotes__lead"><StarMark /> {t('Cálculo o estimación nuestra, no es un dato oficial:')}</p>
          <ul className="footnotes__list">{view.notes.map((n) => <li key={n.label}><strong>{n.label}</strong>: {n.text}.</li>)}</ul>
        </>
      ) : null}
    </div>
  );
}
