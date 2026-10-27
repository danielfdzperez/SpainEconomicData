import { useId } from 'react';
import { useRepo } from '../data/DataContext.jsx';
import { MODES } from '../domain/transforms.js';
import { lit, t } from '../i18n/index.js';
import { StarMark, Term } from './Help.jsx';

const MODE_HELP = {
  raw: lit('Los números tal como los publica la fuente. Sólo se pueden juntar series que se midan en lo mismo.'),
  index: lit('Cada serie vale 100 en el año base. Permite comparar cosas que se miden en unidades distintas.'),
  yoy: lit('Cuánto cambia cada año respecto al anterior, en %.'),
  cum: lit('Cuánto ha cambiado en total desde el año base, en %.'),
};

const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);

/** Modo de visualización, rango de años, año base y contexto histórico. */
export function Controls({ model, bounds }) {
  const repo = useRepo();
  const name = useId();
  const { state, actions } = model;
  const years = range(bounds.min, bounds.max);
  const baseVisible = state.mode === 'index' || state.mode === 'cum' || state.selected.some((k) => k.endsWith('~real'));

  const onRange = (from, to) => {
    if (from !== null && to !== null && from > to) [from, to] = [to, from];
    actions.setRange(from, to);
  };
  const num = (v) => (v === '' ? null : Number(v));

  return (
    <div className="controls">
      <fieldset className="controls__modes">
        <legend className="controls__legend">{t('Qué mostrar')}</legend>
        {Object.values(MODES).map((mode) => (
          <label key={mode.id} className="seg" title={t(MODE_HELP[mode.id])}>
            <input type="radio" className="seg__input" name={name} value={mode.id} checked={state.mode === mode.id} onChange={() => actions.setMode(mode.id)} />
            <span className="seg__text">{t(mode.label)}{mode.id === 'raw' ? null : <StarMark />}</span>
          </label>
        ))}
      </fieldset>
      <p className="controls__desc" aria-live="polite">{t(MODE_HELP[state.mode])}</p>
      <div className="controls__row">
        <label className="field"><span className="field__label">{t('Desde')}</span>
          <select className="select" aria-label={t('Año inicial')} value={state.from ?? ''} onChange={(e) => onRange(num(e.target.value), state.to)}>
            <option value="">{t('{year} (inicio)', { year: bounds.min })}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select></label>
        <label className="field"><span className="field__label">{t('Hasta')}</span>
          <select className="select" aria-label={t('Año final')} value={state.to ?? ''} onChange={(e) => onRange(state.from, num(e.target.value))}>
            <option value="">{t('{year} (fin)', { year: bounds.max })}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select></label>
        {baseVisible ? (
          // el botón de ayuda va fuera del <label>: dentro, su nombre accesible sería el de todo el campo
          <div className="field"><span className="field__label">{t('Año base')} <Term id="indice_base">(?)</Term></span>
            <select className="select" aria-label={t('Año base')} value={state.base ?? ''} onChange={(e) => actions.setBase(num(e.target.value))}>
              <option value="">{t('Automático')}</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select></div>
        ) : null}
        <button className="btn btn--ghost" type="button" disabled={state.from === null && state.to === null && state.base === null} onClick={actions.resetRange}>{t('Todo el periodo')}</button>
        <label className="check-label">
          <input type="checkbox" className="check" checked={state.context} onChange={(e) => actions.setContext(e.target.checked)} />
          <span>{t('Marcar épocas (crisis, COVID…)')}<StarMark /></span>
        </label>
      </div>
    </div>
  );
}
