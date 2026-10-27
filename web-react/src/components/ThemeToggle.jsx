import { useCallback, useEffect, useState } from 'react';
import { t } from '../i18n/index.js';

const KEY = 'theme';
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (v) => { try { localStorage.setItem(KEY, v); } catch { /* sin almacenamiento */ } };
const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

/** Tema efectivo: el elegido, o el del sistema hasta que se elige. */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = read();
    return stored === 'light' || stored === 'dark' ? stored : (systemDark() ? 'dark' : 'light');
  });
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const toggle = useCallback(() => setTheme((cur) => { const next = cur === 'dark' ? 'light' : 'dark'; write(next); return next; }), []);
  return [theme, toggle];
}

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const dark = theme === 'dark';
  return <button type="button" className="theme-toggle" aria-pressed={dark} onClick={toggle}>{dark ? t('Modo claro') : t('Modo oscuro')}</button>;
}
