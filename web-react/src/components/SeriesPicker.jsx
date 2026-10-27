import { useState } from 'react';
import { useRepo } from '../data/DataContext.jsx';
import { SeriesInfo, StarMark, Term } from './Help.jsx';
import { filterMetas } from '../domain/search.js';
import { lit, t, tx } from '../i18n/index.js';

/** Los grupos con más series que esto empiezan plegados para que el selector no se haga interminable. */
const MAX_OPEN_GROUP = 7;
const SALARY_GROUP = 'Salarios brutos anuales (INE)';
const MEDIDAS = [
  ['Salario P10', lit('P10 (parte baja)'), lit('P10'), 'percentil'],
  ['Salario P25', lit('P25'), lit('P25'), 'cuartil'],
  ['Salario mediano', lit('Mediana'), lit('mediana'), 'mediana'],
  ['Salario medio', lit('Media'), lit('media'), 'media'],
  ['Salario P75', lit('P75'), lit('P75'), 'cuartil'],
  ['Salario P90', lit('P90 (parte alta)'), lit('P90'), 'percentil'],
];
const SEXOS = [['todos', lit('Todos')], ['mujeres', lit('Mujeres')], ['hombres', lit('Hombres')]];

function SalaryBuilder({ model, metas }) {
  const repo = useRepo();
  const [medida, setMedida] = useState('Salario mediano');
  const [territorio, setTerritorio] = useState('España');
  const [sexo, setSexo] = useState('todos');
  const [msg, setMsg] = useState('');
  const territorios = [...new Set(metas.map((m) => m.territorio))];
  const medidas = MEDIDAS.filter(([m]) => metas.some((x) => x.medida === m));

  const submit = (e) => {
    e.preventDefault();
    const hit = metas.find((m) => m.medida === medida && m.territorio === territorio && m.sexo === sexo);
    if (!hit) return setMsg(t('Esa combinación no tiene datos.'));
    if (model.state.selected.includes(hit.id)) return setMsg(t('Ya está en el gráfico.'));
    const r = model.actions.toggle(hit.id);
    return setMsg(r.ok ? '' : r.reason);
  };

  return (
    <form className="picker__salary" onSubmit={submit}>
      <h3 className="picker__group">{t('Salarios brutos anuales')} <span className="muted">(INE)</span></h3>
      <p className="picker__hint">{tx('Elige qué {term} quieres ver y pulsa «Añadir».', { term: <Term id="salario_bruto">{t('salario')}</Term> })}</p>
      <label className="field"><span className="field__label">{t('Medida')}</span>
        <select className="select" value={medida} onChange={(e) => setMedida(e.target.value)}>
          {medidas.map(([m, label]) => <option key={m} value={m}>{t(label)}</option>)}
        </select></label>
      <label className="field"><span className="field__label">{t('Territorio')}</span>
        <select className="select" value={territorio} onChange={(e) => setTerritorio(e.target.value)}>
          {territorios.map((terr) => <option key={terr} value={terr}>{t(terr)}</option>)}
        </select></label>
      <label className="field"><span className="field__label">{t('Colectivo')}</span>
        <select className="select" value={sexo} onChange={(e) => setSexo(e.target.value)}>
          {SEXOS.map(([v, label]) => <option key={v} value={v}>{t(label)}</option>)}
        </select></label>
      <button className="btn btn--primary" type="submit">{t('Añadir salario')}</button>
      <p className="picker__msg" role="status" aria-live="polite">{msg}</p>
      <p className="picker__hint">{t('Qué es cada medida:')} {medidas.map(([m, , short, gloss], i) => (
        <span key={m}>{i ? ' · ' : ''}{repo.glossary(gloss) ? <Term id={gloss}>{t(short)}</Term> : t(short)}</span>
      ))}</p>
    </form>
  );
}

function Group({ group, metas, model, query }) {
  const [open, setOpen] = useState(metas.length <= MAX_OPEN_GROUP);
  const shown = filterMetas(metas, query);
  if (!shown.length) return null;
  const searching = query.trim() !== '';
  return (
    <details className="picker__details" open={searching || open} onToggle={(e) => { if (!searching) setOpen(e.currentTarget.open); }}>
      <summary className="picker__group">{t(group)}<span className="picker__count">{shown.length}</span></summary>
      <ul className="picker__list">
        {shown.map((meta) => (
          <li key={meta.id} className="picker__item">
            <label className="picker__label">
              <input type="checkbox" className="check" checked={model.state.selected.includes(meta.id)} onChange={() => model.actions.toggle(meta.id)} />
              <span>{meta.label.replace(/^IPCA · /, '')}{meta.calculado ? <StarMark /> : null}</span>
            </label>
            <SeriesInfo meta={meta} />
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Selector de series: constructor para salarios y casillas para el resto de grupos. */
export function SeriesPicker({ model }) {
  const repo = useRepo();
  const groups = [...repo.groups()];
  const salary = groups.find(([g]) => g === SALARY_GROUP)?.[1] ?? [];
  const [query, setQuery] = useState('');
  const others = groups.filter(([g]) => g !== SALARY_GROUP);
  const total = others.reduce((n, [, metas]) => n + filterMetas(metas, query).length, 0);
  return (
    <div className="picker">
      <h2 className="picker__title">{t('Series')}</h2>
      {salary.length ? <SalaryBuilder model={model} metas={salary} /> : null}
      <label className="field picker__search">
        <span className="field__label">{t('Buscar entre todas las series')}</span>
        <input type="search" className="input" name="q" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t('p. ej. vivienda, paro, Madrid, hostelería')} />
      </label>
      <div className="picker__groups">
        {others.map(([g, metas]) => <Group key={g} group={g} metas={metas} model={model} query={query} />)}
      </div>
      <p className="picker__msg" role="status" aria-live="polite">
        {model.message || (query.trim() ? (total ? (total === 1 ? t('1 serie encontrada.') : t('{n} series encontradas.', { n: total })) : t('Ninguna serie coincide con la búsqueda.')) : '')}
      </p>
    </div>
  );
}
