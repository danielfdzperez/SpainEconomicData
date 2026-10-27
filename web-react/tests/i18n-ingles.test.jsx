import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test } from 'vitest';
import { AppRoutes } from '../src/App.jsx';
import { getLang, missing, setLang } from '../src/i18n/index.js';
import { renderApp } from './testUtils.jsx';

afterEach(() => { setLang('es', { persist: false }); });

const ESPERA = { timeout: 15000 };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
// Palabras que en inglés no aparecen: si salen en el texto de una página, algo se quedó sin traducir.
const ESPANOL = /\b(el|los|las|del|para|con|una|que|según|desde|hasta|salario|vivienda|hogares?|años)\b/i;
/** Fragmentos del texto de la página donde aparecen palabras del español (vacío si no hay ninguno). */
const fugas = () => {
  // «El Español» es el nombre de un periódico citado como fuente: no se traduce.
  const texto = document.querySelector('main').textContent.replaceAll('El Español', '·');
  return [...texto.matchAll(new RegExp(ESPANOL.source, 'gi'))].map((m) => texto.slice(Math.max(0, m.index - 25), m.index + 25));
};
const abrirDetalles = () => { for (const d of document.querySelectorAll('details')) d.open = true; };

describe('web en inglés', () => {
  test.each([
    ['/', /Did your wage/],
    ['/explorador', /Explorer/],
    ['/ipc', /CPI/],
    ['/pib', /GDP/],
    ['/metodo', /Method and sources/],
  ])('%s: no queda ningún texto sin traducir', async (route, espera) => {
    setLang('en', { persist: false });
    missing.clear();
    renderApp(<AppRoutes />, { route });
    await screen.findAllByText(espera, {}, ESPERA);
    await pausa(600);
    abrirDetalles();
    expect([...missing]).toEqual([]);
    expect(fugas()).toEqual([]);
  }, 60000);

  test('simulador: nómina, autónomo e historial laboral sin texto sin traducir', async () => {
    setLang('en', { persist: false });
    missing.clear();
    renderApp(<AppRoutes />, { route: '/simulador' });
    await screen.findByRole('heading', { name: /Your pay and what it costs your employer/ }, ESPERA);
    abrirDetalles();
    await userEvent.click(screen.getByRole('checkbox', { name: /detail my work history/i }));
    await userEvent.click(screen.getByRole('button', { name: /Fill in an example/ }));
    abrirDetalles();
    await userEvent.click(screen.getByRole('radio', { name: 'Self-employed' }));
    abrirDetalles();
    await pausa(300);
    expect([...missing]).toEqual([]);
    expect(fugas()).toEqual([]);
  }, 60000);
});

describe('cambio de idioma', () => {
  test('el botón alterna entre castellano e inglés y la página sigue en su sitio', async () => {
    renderApp(() => <AppRoutes />, { route: '/explorador' });
    await screen.findAllByText(/Explorador/, {}, ESPERA);
    expect(document.documentElement.lang).toBe('es');
    await userEvent.click(screen.getByRole('button', { name: /^English/ }));
    expect(getLang()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    await screen.findAllByText(/Explorer/, {}, ESPERA);
    expect(document.title).toMatch(/Spain in data/);
    await userEvent.click(screen.getByRole('button', { name: /^Español/ }));
    expect(getLang()).toBe('es');
    await screen.findAllByText(/Explorador/, {}, ESPERA);
    expect(document.title).toMatch(/Datos de España/);
  }, 60000);

  test('al cambiar de idioma se conservan las series elegidas en el explorador', async () => {
    renderApp(() => <AppRoutes />, { route: '/explorador?s=ipc_es,pob_es_total&m=index&b=2000&f=2020' });
    const lista = async () => within(await screen.findByRole('list', { name: /Series del gráfico|Chart series/ }, ESPERA)).getAllByRole('listitem');
    expect(await lista()).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /^English/ }));
    await screen.findByRole('list', { name: 'Chart series' }, ESPERA);
    expect(await lista()).toHaveLength(2);
  }, 60000);
});
