import { useRepo } from '../data/DataContext.jsx';
import { canBeReal, makeKey, parseKey } from '../domain/pipeline.js';
import { t } from '../i18n/index.js';
import { SeriesInfo, Star, StarMark } from './Help.jsx';

/** Leyenda interactiva: color, nombre, ficha (i), pasar a «real*» y quitar. */
export function Legend({ model, view, slots }) {
  const repo = useRepo();
  const { state, actions } = model;
  const byId = new Map(view.series.map((s) => [s.id, s]));
  const items = state.selected.map((key) => {
    const { id, real } = parseKey(key);
    const meta = repo.meta(id);
    if (!meta) return null;
    const s = byId.get(key);
    const err = view.errors.find((e) => e.key === key);
    const label = s ? s.displayLabel : `${meta.label}${real ? ` ${t('(real)')}*` : ''}${meta.calculado && !real ? '*' : ''}`;
    return (
      <li key={key} className={`legend__item${s ? '' : ' is-off'}`}>
        <span className={`legend__key series-${s ? slots.get(key) : 0}`} aria-hidden="true" />
        <span className="legend__label">{label}</span>
        {err ? <span className="legend__err">{err.reason}</span> : null}
        <SeriesInfo meta={meta} />
        {real ? <Star note={t('Salario real: lo calculamos nosotros dividiendo el sueldo entre el índice de precios y expresándolo en euros del año base.')} /> : null}
        {!real && canBeReal(repo, id) && !state.selected.includes(makeKey(id, true)) ? (
          <button type="button" className="btn btn--chip" title={t('Añade este mismo salario descontando la subida de precios (salario real)')}
            onClick={() => actions.switchReal(id, true)}>{t('Añadir en € constantes')}<StarMark /></button>
        ) : null}
        <button type="button" className="legend__remove" aria-label={t('Quitar {label}', { label })} onClick={() => actions.remove(key)}>×</button>
      </li>
    );
  }).filter(Boolean);
  if (!items.length) return null;
  return <ul className="legend" aria-label={t('Series del gráfico')}>{items}</ul>;
}
