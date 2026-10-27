import { NavLink, Outlet } from 'react-router-dom';
import { StarMark } from './Help.jsx';
import { lit, t, tx } from '../i18n/index.js';
import { LangToggle } from './LangToggle.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';

export const NAV = [
  { to: '/', label: lit('Inicio'), end: true },
  { to: '/explorador', label: lit('Explorador') },
  { to: '/ipc', label: lit('Qué es el IPC') },
  { to: '/pib', label: lit('Qué es el PIB') },
  { to: '/simulador', label: lit('Simulador') },
  { to: '/metodo', label: lit('Método y fuentes') },
];

/** Cabecera, zona principal (Outlet) y pie. */
export function Shell() {
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('Saltar al contenido')}</a>
      <header className="site-header">
        <div className="wrap site-header__in">
          <NavLink className="brand" to="/">
            <span className="brand__mark" aria-hidden="true">ES</span>
            <span className="brand__name">{t('Datos de España')}</span>
          </NavLink>
          <nav className="nav" aria-label={t('Principal')}>
            {NAV.map((n) => <NavLink key={n.to} className="nav__link" to={n.to} end={n.end}>{t(n.label)}</NavLink>)}
          </nav>
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="main" tabIndex={-1}><Outlet /></main>
      <footer className="site-footer">
        <div className="wrap">
          <p><StarMark /> {tx('Todo lo que lleva asterisco es un cálculo o una estimación nuestra, no un dato oficial. El resto son series de INE y Eurostat tal como las publican. {link}', { link: <NavLink to="/metodo">{t('Cómo lo hacemos')}</NavLink> })}</p>
          <p className="muted">{t('Datos consultados el 22-10-2026. Proyecto personal sin vinculación con ningún organismo público.')}</p>
        </div>
      </footer>
    </>
  );
}
