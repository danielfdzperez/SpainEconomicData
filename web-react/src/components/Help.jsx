import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRepo } from '../data/DataContext.jsx';
import { t } from '../i18n/index.js';

/** Marca «*»: cálculo o estimación nuestra. */
export const StarMark = () => <mark className="star">*</mark>;

const HelpContext = createContext(null);

function Popover({ anchor, content }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ visibility: 'hidden', left: 0, top: 0 });

  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect();
    const w = ref.current.offsetWidth;
    const h = ref.current.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8);
    let top = r.bottom + 8;
    if (top + h > window.innerHeight - 8 && r.top - h - 8 > 8) top = r.top - h - 8;
    setStyle({ left: Math.round(left), top: Math.round(top), visibility: 'visible' });
  }, [anchor, content]);

  return (
    <div ref={ref} className="help-pop" role="tooltip" id="help-pop" style={{ position: 'fixed', ...style }}>
      <div className="help-pop__title">{content.title}</div>
      {content.short ? <p className="help-pop__short">{content.short}</p> : null}
      {content.long ? <p className="help-pop__long">{content.long}</p> : null}
      {content.example ? <p className="help-pop__example"><strong>{t('Ejemplo.')} </strong>{content.example}</p> : null}
      {content.source ? <p className="help-pop__source">{content.source}</p> : null}
      {content.own ? <p className="help-pop__own"><StarMark /> {t('Cálculo o estimación nuestra, no es un dato oficial.')}</p> : null}
    </div>
  );
}

/** Un único globo de ayuda compartido, que sale por ratón, teclado o toque. */
export function HelpProvider({ children }) {
  const [tip, setTip] = useState(null); // { anchor, content }
  const show = useCallback((anchor, content) => setTip({ anchor, content }), []);
  const hide = useCallback(() => setTip(null), []);

  useEffect(() => {
    if (!tip) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') hide(); };
    const onDown = (e) => { if (!tip.anchor.contains(e.target)) hide(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', hide, { passive: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', hide);
    };
  }, [tip, hide]);

  const value = useMemo(() => ({ show, hide, anchor: tip?.anchor ?? null }), [show, hide, tip]);
  return (
    <HelpContext.Provider value={value}>
      {children}
      {tip ? createPortal(<Popover anchor={tip.anchor} content={tip.content} />, document.body) : null}
    </HelpContext.Provider>
  );
}

/** Props de un disparador (ratón, foco, clic) que abre el globo con `getContent()`. */
function useTrigger(getContent) {
  const { show, hide, anchor } = useContext(HelpContext);
  const ref = useRef(null);
  return {
    ref,
    'aria-describedby': anchor && anchor === ref.current ? 'help-pop' : undefined,
    onMouseEnter: (e) => show(e.currentTarget, getContent()),
    onMouseLeave: (e) => { if (document.activeElement !== e.currentTarget) hide(); },
    onFocus: (e) => show(e.currentTarget, getContent()),
    onBlur: hide,
    onClick: (e) => { e.preventDefault(); if (anchor === e.currentTarget) hide(); else show(e.currentTarget, getContent()); },
  };
}

/** Palabra con ayuda del glosario. Si el término no existe, devuelve el texto tal cual. */
export function Term({ id, children }) {
  const repo = useRepo();
  const g = repo.glossary(id);
  const trigger = useTrigger(() => ({ title: g.term, short: g.short, long: g.long, example: g.example, own: g.term.endsWith('*') }));
  if (!g) return children ?? id;
  return <button type="button" className="term" {...trigger}>{children ?? g.term.replace(/\*$/, '')}</button>;
}

/** Botón «i» con la ficha de una serie del catálogo. */
export function SeriesInfo({ meta }) {
  const repo = useRepo();
  const g = repo.glossary(meta.glosario_id);
  const trigger = useTrigger(() => ({
    title: meta.label + (meta.calculado ? '*' : ''),
    short: meta.descripcion,
    long: [meta.lectura, meta.aviso].filter(Boolean).join(' '),
    example: g?.example,
    source: t('Fuente: {fuente}', { fuente: meta.fuente }),
    own: Boolean(meta.calculado),
  }));
  return <button type="button" className="info-btn" aria-label={t('Qué es: {label}', { label: meta.label })} {...trigger}>i</button>;
}

/** «*» con su explicación al pasar el ratón. */
export function Star({ note = t('Cálculo o estimación nuestra, no es un dato oficial.') }) {
  const trigger = useTrigger(() => ({ title: t('* Cálculo o estimación nuestra'), short: note }));
  return <button type="button" className="star-btn" aria-label={t('Cálculo o estimación nuestra')} {...trigger}><StarMark /></button>;
}

/** Botón «i» con un globo de texto libre (para explicar una fila de una tabla, una cifra…). */
export function Tip({ title, short, long, source, own = false, label = t('Qué es') }) {
  const trigger = useTrigger(() => ({ title, short, long, source, own }));
  return <button type="button" className="info-btn" aria-label={`${label}: ${title}`} {...trigger}>i</button>;
}
