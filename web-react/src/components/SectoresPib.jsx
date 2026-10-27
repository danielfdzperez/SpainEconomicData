import { useId, useState } from 'react';
import { formatInt, formatMeur, formatPct, formatShare } from '../core/format.js';
import { useSectores } from '../data/DataContext.jsx';
import {
  LATEST_YEAR, PREVIOUS_YEAR, ROOT_ID, SECTOR_YEARS, TAX_ID, flatten, pathTo, sectorView, vabTotal,
} from '../domain/sectores.js';
import { t, tx } from '../i18n/index.js';
import { StarMark, Term } from './Help.jsx';

// Geometría del donut (viewBox 320 × 320)
const C = 160;
const R_OUT = 148;
const R_IN = 94;
const TAU = Math.PI * 2;
const polar = (angle, radius) => [C + radius * Math.sin(angle), C - radius * Math.cos(angle)];

/** Trazado de una porción de donut entre dos ángulos (radianes, desde las 12 en punto, en sentido horario). */
export function slicePath(a0, a1) {
  const end = Math.min(a1, a0 + TAU - 1e-4);
  const large = end - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(a0, R_OUT);
  const [x1, y1] = polar(end, R_OUT);
  const [x2, y2] = polar(end, R_IN);
  const [x3, y3] = polar(a0, R_IN);
  const f = (n) => n.toFixed(2);
  return `M${f(x0)} ${f(y0)}A${R_OUT} ${R_OUT} 0 ${large} 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${R_IN} ${R_IN} 0 ${large} 0 ${f(x3)} ${f(y3)}Z`;
}

const meur = formatMeur;

/** Lo que se lee en el hueco del donut: la porción señalada o, si no hay ninguna, el total de lo que se ve. */
function centerText(view, active, atRoot) {
  const baseName = view.base === 'vab' ? t('del valor añadido') : t('del PIB');
  if (active) {
    return {
      name: active.node.short,
      big: formatShare(active.share),
      lines: [meur(active.value), atRoot ? null : `${formatShare(active.shareOfBase)} ${baseName}`],
    };
  }
  if (atRoot) {
    return {
      name: view.base === 'vab' ? t('Valor añadido {year}', { year: view.year }) : t('PIB {year}', { year: view.year }),
      big: formatInt(view.total),
      lines: [t('millones de euros'), null],
      plain: true,
    };
  }
  return {
    name: view.node.short,
    big: formatShare(view.shareOfBase),
    lines: [meur(view.total), baseName],
  };
}

function Donut({ view, activeId, onHover, onPick, atRoot }) {
  const active = view.slices.find((s) => s.node.id === activeId) ?? null;
  const center = centerText(view, active, atRoot);
  let angle = 0;
  const label = t('Queso de {name}: {list}.', { name: view.node.short, list: view.slices.map((s) => `${s.node.short} ${formatShare(s.share)}`).join(', ') });
  return (
    <div className="donut">
      <svg viewBox={`0 0 ${2 * C} ${2 * C}`} role="img" aria-label={label}>
        {view.slices.map((s) => {
          const a0 = angle;
          angle += (s.share / 100) * TAU;
          const isActive = s.node.id === activeId;
          return (
            <path
              key={s.node.id}
              d={slicePath(a0, angle)}
              className={`donut__slice series-${s.slot}${s.drillable ? ' is-drill' : ''}${isActive ? ' is-active' : ''}${activeId && !isActive ? ' is-dim' : ''}`}
              onMouseEnter={() => onHover(s.node.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onPick(s)}
            />
          );
        })}
      </svg>
      <div className="donut__center" aria-hidden="true">
        <span className="donut__name">{center.name}</span>
        <span className={`donut__big${center.plain ? ' donut__big--plain' : ''}`}>{center.big}{center.plain ? null : <StarMark />}</span>
        {center.lines.filter(Boolean).map((line) => <span key={line} className="donut__sub">{line}</span>)}
      </div>
    </div>
  );
}

function SectorRow({ s, activeId, onHover, onPick }) {
  const isActive = activeId === s.node.id;
  const body = (
    <>
      <span className="sector-row__key" aria-hidden="true" />
      <span className="sector-row__name">{s.node.short}{s.drillable ? <span className="sector-row__more" aria-hidden="true">›</span> : null}</span>
      <span className="sector-row__share">{formatShare(s.share)}</span>
      <span className="sector-row__eur">{meur(s.value)}</span>
      <span className="sector-row__growth">{formatPct(s.growth)}</span>
      <span className="sector-row__bar" aria-hidden="true"><i style={{ width: `${s.share}%` }} /></span>
    </>
  );
  const cls = `sector-row series-${s.slot}${isActive ? ' is-active' : ''}`;
  const hover = { onMouseEnter: () => onHover(s.node.id), onMouseLeave: () => onHover(null) };
  const summary = t('{label}: {share} del total mostrado, {eur}, {growth} frente al año anterior', { label: s.node.label, share: formatShare(s.share), eur: meur(s.value), growth: formatPct(s.growth) });
  return (
    <li>
      {s.drillable ? (
        <button type="button" className={cls} title={s.node.label} aria-label={`${summary}. ${t('Ver su desglose')}`} onClick={() => onPick(s)}
          {...hover} onFocus={() => onHover(s.node.id)} onBlur={() => onHover(null)}>{body}</button>
      ) : (
        <div className={`${cls} is-leaf`} title={s.node.label} aria-label={summary} role="group" {...hover}>{body}</div>
      )}
    </li>
  );
}

function FullTable({ tree }) {
  const rows = flatten(tree);
  const pib = tree.root.values[LATEST_YEAR];
  const vab = vabTotal(tree, LATEST_YEAR);
  return (
    <details className="data-table sectors__table">
      <summary>{t('Ver todas las ramas en una tabla')}</summary>
      <div className="table-wrap" tabIndex={0} role="region" aria-label={t('Tabla del reparto del PIB por ramas')}>
        <table className="table">
          <caption className="sr-only">{t('PIB por ramas de actividad, en millones de euros a precios corrientes')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Rama')}</th>
              <th scope="col">{t('{year} (M €)', { year: PREVIOUS_YEAR })}</th>
              <th scope="col">{t('{year} (M €)', { year: LATEST_YEAR })}</th>
              <th scope="col">{t('% del PIB')}<StarMark /></th>
              <th scope="col">{t('% del valor añadido')}<StarMark /></th>
              <th scope="col">{t('Variación {a}/{b}', { a: LATEST_YEAR, b: PREVIOUS_YEAR })}<StarMark /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id} className={`sectors__lvl${n.level}`}>
                <th scope="row" style={{ paddingLeft: `${12 + n.level * 16}px` }}>{n.label}{n.tipo === 'derivado' ? <StarMark /> : null}</th>
                <td>{formatInt(n.values[PREVIOUS_YEAR])}</td>
                <td>{formatInt(n.values[LATEST_YEAR])}</td>
                <td>{formatShare((n.values[LATEST_YEAR] / pib) * 100)}</td>
                <td>{n.id === TAX_ID || n.id === ROOT_ID ? '—' : formatShare((n.values[LATEST_YEAR] / vab) * 100)}</td>
                <td>{formatPct((n.values[LATEST_YEAR] / n.values[PREVIOUS_YEAR] - 1) * 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted sectors__tablenote">
        {tx('Los importes son del INE, salvo los impuestos netos sobre los productos de 2024{star}, que salen de restar al PIB el valor añadido de las ramas.', { star: <StarMark /> })}
        {' '}{t('El valor añadido de «Industria» y de «Servicios» es la suma de sus partes (coincide con el que publica el INE).')}
      </p>
    </details>
  );
}

/**
 * Queso (donut) del reparto del PIB por sectores, con zoom: pulsando una porción se abre su desglose
 * (servicios → ramas → subramas). Sirve tanto el PIB como el valor añadido bruto, para 2024 y 2025.
 * Los porcentajes y las variaciones son cálculo nuestro (*) sobre cifras del INE.
 */
export function SectoresPib() {
  const { tree, error, retry } = useSectores();
  const uid = useId();
  const [nodeId, setNodeId] = useState(ROOT_ID);
  const [year, setYear] = useState(LATEST_YEAR);
  const [base, setBase] = useState('pib');
  const [hoverId, setHoverId] = useState(null);

  if (error) {
    return (
      <div className="sectors" role="alert">
        <p>{t('No se ha podido cargar el reparto por sectores.')}</p>
        <p><button type="button" className="btn" onClick={retry}>{t('Reintentar')}</button></p>
      </div>
    );
  }
  if (!tree) return <p className="muted" role="status">{t('Cargando el reparto por sectores…')}</p>;

  const view = sectorView(tree, nodeId, { year, base });
  const atRoot = nodeId === ROOT_ID;
  const crumbs = pathTo(tree, nodeId);
  const go = (id) => { setNodeId(id); setHoverId(null); };
  const pick = (s) => { if (s.drillable) go(s.node.id); else setHoverId((cur) => (cur === s.node.id ? null : s.node.id)); };

  const services = sectorView(tree, 'servicios', { year, base: 'pib' });
  const vabShare = (tree.nodes.get('servicios').values[year] / vabTotal(tree, year)) * 100;
  const biggest = services.slices[0];

  return (
    <section className="sectors" aria-label={t('Reparto del PIB por sectores')}>
      <div className="sectors__bar">
        <div className="field">
          <span className="field__label" id={`${uid}-year`}>{t('Año')}</span>
          <div className="seg-group" role="radiogroup" aria-labelledby={`${uid}-year`}>
            {SECTOR_YEARS.map((y) => (
              <label key={y} className="seg">
                <input type="radio" className="seg__input" name={`${uid}-y`} checked={year === y} onChange={() => setYear(y)} />
                <span className="seg__text">{y === LATEST_YEAR ? t('{year} (avance)', { year: y }) : t('{year} (provisional)', { year: y })}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field__label" id={`${uid}-base`}>{t('Sobre qué total')}</span>
          <div className="seg-group" role="radiogroup" aria-labelledby={`${uid}-base`}>
            {[['pib', t('PIB (con impuestos)')], ['vab', t('Valor añadido (sólo las ramas)')]].map(([id, text]) => (
              <label key={id} className="seg">
                <input type="radio" className="seg__input" name={`${uid}-b`} checked={base === id} onChange={() => setBase(id)} />
                <span className="seg__text">{text}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <nav className="sectors__crumbs" aria-label={t('Dónde estás en el desglose')}>
        {crumbs.map((n, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={n.id} className="sectors__crumb">
              {i ? <span aria-hidden="true" className="muted"> › </span> : null}
              {last
                ? <strong aria-current="page">{n.id === ROOT_ID ? t('Toda la economía') : n.short}</strong>
                : <button type="button" className="crumb" onClick={() => go(n.id)}>{n.id === ROOT_ID ? t('Toda la economía') : n.short}</button>}
            </span>
          );
        })}
      </nav>

      <div className="sectors__body">
        <Donut view={view} activeId={hoverId} onHover={setHoverId} onPick={pick} atRoot={atRoot} />
        <div>
          <div className="sector-head" aria-hidden="true">
            <span />
            <span>{atRoot ? t('Sector') : t('Rama')}</span>
            <span>{t('% del total')}<StarMark /></span>
            <span>{t('Millones €')}</span>
            <span className="sector-head__growth">{t('Var. {a}/{b}', { a: LATEST_YEAR, b: String(PREVIOUS_YEAR).slice(2) })}<StarMark /></span>
          </div>
          <ul className="sector-list" aria-label={t('Partes de {name}', { name: view.node.short })}>
            {view.slices.map((s) => <SectorRow key={s.node.id} s={s} activeId={hoverId} onHover={setHoverId} onPick={pick} />)}
          </ul>
          <p className="muted sectors__hint">
            {view.slices.some((s) => s.drillable)
              ? t('Pulsa una porción (o una fila con ›) para ver su desglose.')
              : t('Es el último nivel de detalle que publica el INE para 2025.')}
            {atRoot ? '' : ` ${t('Los colores sólo distinguen las partes de este nivel.')}`}
          </p>
        </div>
      </div>

      <p className="sectors__read">
        {tx('En {year} los servicios aportan el {a} del PIB{s1} (el {b} del {vab} de las ramas{s2}, porque el PIB suma además los impuestos sobre los productos). Su mayor rama es «{name}», con el {c} del PIB{s3}.', {
          year, a: <strong>{formatShare(services.shareOfBase)}</strong>, b: <strong>{formatShare(vabShare)}</strong>,
          vab: <Term id="vab">{t('valor añadido')}</Term>, name: biggest.node.short, c: formatShare(biggest.shareOfBase),
          s1: <StarMark />, s2: <StarMark />, s3: <StarMark />,
        })}
      </p>

      <FullTable tree={tree} />

      <p className="muted sectors__source">
        <StarMark /> {t('Cálculo nuestro: dividimos cada cifra del INE entre el total del nivel (el queso suma 100 %) o entre el PIB o el valor añadido, y comparamos {latest} con {previous}. Euros a precios corrientes.', { latest: LATEST_YEAR, previous: PREVIOUS_YEAR })}
        {' '}{t('Fuente: INE, Contabilidad Nacional Anual de España (Revisión Estadística 2024), tabla 69070; {previous} provisional y {latest} avance.', { latest: LATEST_YEAR, previous: PREVIOUS_YEAR })}
      </p>
    </section>
  );
}
