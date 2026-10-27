import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelpProvider } from '../src/components/Help.jsx';
import { DataProvider } from '../src/data/DataContext.jsx';
import { useLang } from '../src/i18n/index.js';

const root = join(process.cwd(), 'public');
const loader = (p) => readFile(join(root, p), 'utf-8');

/** Como `App`: al cambiar de idioma se vuelve a construir todo el árbol (el estado se conserva). */
function Raiz({ ui, route }) {
  useLang();
  return (
    <DataProvider loader={loader} basePath="data/">
      <HelpProvider><MemoryRouter initialEntries={[route]}>{typeof ui === 'function' ? ui() : ui}</MemoryRouter></HelpProvider>
    </DataProvider>
  );
}

/**
 * Renderiza con los mismos proveedores que la app, leyendo los CSV reales.
 * `ui` puede ser un elemento o una función que lo devuelve (así se repinta al cambiar de idioma, como en `App`).
 */
export function renderApp(ui, { route = '/' } = {}) {
  return render(<Raiz ui={ui} route={route} />);
}
