import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLang, t } from '../i18n/index.js';
import { DataRepository } from './DataRepository.js';

const DataContext = createContext(null);

async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${t('No se pudo cargar')} ${path} (${res.status})`);
  return res.text();
}

/** Carga los CSV una vez y entrega el repositorio (en el idioma actual) a toda la app. */
export function DataProvider({ children, loader = fetchText, basePath = `${import.meta.env.BASE_URL}data/` }) {
  const lang = useLang();
  const [status, setStatus] = useState({ repo: null, error: null });

  useEffect(() => {
    let alive = true;
    new DataRepository(loader, { basePath }).load()
      .then((repo) => alive && setStatus({ repo, error: null }))
      .catch((error) => { console.error(error); if (alive) setStatus({ repo: null, error }); });
    return () => { alive = false; };
  }, [loader, basePath]);

  // una vista por idioma: al cambiar de idioma cambia la identidad del repositorio y todo lo que depende de él se recalcula
  const repo = useMemo(() => status.repo?.forLang(lang) ?? null, [status.repo, lang]);

  if (status.error) {
    return (
      <div className="wrap">
        <h1>{t('No se han podido cargar los datos')}</h1>
        <p>{String(status.error.message)}</p>
      </div>
    );
  }
  if (!repo) return <p className="wrap loading">{t('Cargando datos…')}</p>;
  return <DataContext.Provider value={repo}>{children}</DataContext.Provider>;
}

/** @returns {import('./DataRepository.js').DataRepository} */
export function useRepo() {
  const repo = useContext(DataContext);
  if (!repo) throw new Error('useRepo debe usarse dentro de <DataProvider>');
  return repo;
}

/**
 * Parámetros del simulador. Se descargan al entrar en la página (no antes).
 * @returns {{params: import('./simParams.js').SimParams|null, error: Error|null, retry: () => void}}
 */
export function useSimParams() {
  const repo = useRepo();
  const [state, setState] = useState({ params: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    repo.simParams()
      .then((params) => alive && setState({ params, error: null }))
      .catch((error) => { console.error(error); if (alive) setState({ params: null, error }); });
    return () => { alive = false; };
  }, [repo, attempt]);
  return { ...state, retry: () => { setState({ params: null, error: null }); setAttempt((n) => n + 1); } };
}

/**
 * Reparto del PIB por sectores. Se descarga al entrar en la página del PIB (no antes).
 * Cambia con el idioma (los nombres de las ramas).
 * @returns {{tree: Awaited<ReturnType<import('./DataRepository.js').DataRepository['sectores']>>|null, error: Error|null, retry: () => void}}
 */
export function useSectores() {
  const repo = useRepo();
  const [state, setState] = useState({ tree: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    repo.sectores()
      .then((tree) => alive && setState({ tree, error: null }))
      .catch((error) => { console.error(error); if (alive) setState({ tree: null, error }); });
    return () => { alive = false; };
  }, [repo, attempt]);
  return { ...state, retry: () => { setState({ tree: null, error: null }); setAttempt((n) => n + 1); } };
}
