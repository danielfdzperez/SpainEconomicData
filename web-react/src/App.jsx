import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { HelpProvider } from './components/Help.jsx';
import { Shell } from './components/Shell.jsx';
import { DataProvider } from './data/DataContext.jsx';
import { t, useLang } from './i18n/index.js';

// Cada página se descarga sólo cuando se visita
const Home = lazy(() => import('./pages/Home.jsx'));
const Explorer = lazy(() => import('./pages/Explorer.jsx'));
const Ipc = lazy(() => import('./pages/Ipc.jsx'));
const Pib = lazy(() => import('./pages/Pib.jsx'));
const Simulador = lazy(() => import('./pages/Simulador.jsx'));
const Metodo = lazy(() => import('./pages/Metodo.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<p className="wrap loading">{t('Cargando…')}</p>}>
      <ScrollToTop />
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="explorador" element={<Explorer />} />
          <Route path="ipc" element={<Ipc />} />
          <Route path="pib" element={<Pib />} />
          <Route path="simulador" element={<Simulador />} />
          <Route path="metodo" element={<Metodo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

/** HashRouter: funciona en GitHub Pages sin configurar redirecciones del servidor. */
export default function App() {
  useLang(); // al cambiar de idioma se vuelve a pintar todo el árbol, sin perder el estado
  return (
    <DataProvider>
      <HelpProvider>
        <HashRouter><AppRoutes /></HashRouter>
      </HelpProvider>
    </DataProvider>
  );
}
