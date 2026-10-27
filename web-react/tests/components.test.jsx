import { describe, expect, test } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { wrapLabel } from '../src/charts/LineChart.jsx';
import { viewToCsv } from '../src/components/DataTable.jsx';
import { Workbench } from '../src/components/Workbench.jsx';
import { presetById } from '../src/content/presets.js';
import { buildView } from '../src/domain/pipeline.js';
import Ipc from '../src/pages/Ipc.jsx';
import Home, { headlineFact } from '../src/pages/Home.jsx';
import { loadRepo } from './helpers.mjs';
import { renderApp } from './testUtils.jsx';

const core = presetById('core');

describe('Workbench', () => {
  test('el gráfico «core» muestra las tres series con * en lo calculado', async () => {
    renderApp(<Workbench initial={core.state} variant="full" />);
    const legend = await screen.findByRole('list', { name: 'Series del gráfico' });
    const items = within(legend).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toHaveLength(3);
    expect(items.some((t) => t.includes('(real)*'))).toBe(true);
    expect(await screen.findByRole('img', { name: /Gráfico de líneas, 2008 a 2025/ })).toBeTruthy();
  });

  test('quitar una serie desde la leyenda', async () => {
    renderApp(<Workbench initial={core.state} variant="full" />);
    await screen.findByRole('list', { name: 'Series del gráfico' });
    await userEvent.click(screen.getByRole('button', { name: /^Quitar IPC/ }));
    expect(within(screen.getByRole('list', { name: 'Series del gráfico' })).getAllByRole('listitem')).toHaveLength(2);
  });

  test('en valores originales no deja mezclar euros con porcentajes', async () => {
    renderApp(<Workbench initial={{ ...core.state, selected: ['sal_media_es_t'], mode: 'raw' }} variant="full" />);
    await screen.findByRole('list', { name: 'Series del gráfico' });
    await userEvent.click(screen.getByRole('checkbox', { name: /IPC · España/ }));
    expect(screen.getAllByRole('status').some((n) => n.textContent.includes('Se mide en otra unidad'))).toBe(true);
    expect(screen.getByRole('checkbox', { name: /IPC · España/ }).checked).toBe(false);
  });

  test('añadir un salario con el constructor', async () => {
    renderApp(<Workbench initial={{ ...core.state, selected: [] }} variant="full" />);
    await screen.findByText('Todavía no hay nada en el gráfico.');
    await userEvent.selectOptions(screen.getByLabelText('Medida'), 'Salario P90');
    await userEvent.selectOptions(screen.getByLabelText('Territorio'), 'Madrid');
    await userEvent.click(screen.getByRole('button', { name: 'Añadir salario' }));
    expect(await screen.findByText(/Salario P90 · Madrid · todos/, { selector: '.legend__label' })).toBeTruthy();
  });

  test('un gráfico preparado carga su estado', async () => {
    renderApp(<Workbench initial={{ ...core.state, selected: [] }} variant="compact" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Inflación año a año' }));
    expect(within(screen.getByRole('list', { name: 'Series del gráfico' })).getAllByRole('listitem')).toHaveLength(2);
  });

  test('el tooltip aparece con el teclado y explica la lectura', async () => {
    renderApp(<Workbench initial={core.state} variant="compact" />);
    const chart = (await screen.findByRole('img', { name: /Gráfico de líneas/ })).closest('.chart');
    chart.focus();
    fireEvent.keyDown(chart, { key: 'End' });
    const tip = await screen.findByRole('status', { name: '' });
    expect(tip.textContent).toContain('2025');
  });
});

describe('Ayuda contextual', () => {
  test('un término del glosario abre su ficha y marca lo calculado con *', async () => {
    renderApp(<Workbench initial={core.state} variant="full" />);
    const term = (await screen.findAllByRole('button', { name: '(?)' }))[0];
    await userEvent.hover(term);
    const tip = await screen.findByRole('tooltip');
    expect(tip.textContent).toContain('Índice base 100*');
    expect(tip.textContent).toContain('Cálculo o estimación nuestra');
  });
});

describe('Páginas', () => {
  test('la portada calcula la frase de cabecera con asterisco', async () => {
    renderApp(<Home />);
    const fact = await screen.findByText(/Entre 2008 y 2024, el sueldo mediano subió un 34,3 %/);
    expect(fact.textContent.trim().endsWith('*')).toBe(true);
  });

  test('la calculadora del IPC equivale a lo que dicen los datos', async () => {
    renderApp(<Ipc />);
    const input = await screen.findByLabelText('Cantidad en euros');
    await userEvent.clear(input);
    await userEvent.type(input, '1000');
    await userEvent.selectOptions(screen.getByLabelText('Año de destino'), '2024');
    expect((await screen.findByText(/equivalen a/, { selector: 'p' })).textContent).toContain('1351 €');
  });
});

describe('Funciones puras', () => {
  test('wrapLabel no corta palabras y usa a lo sumo 3 líneas', () => {
    const lines = wrapLabel('Salario mediano · España · todos (real)*');
    expect(lines.join(' ')).toBe('Salario mediano · España · todos (real)*');
    expect(lines.length).toBeLessThanOrEqual(3);
  });

  test('viewToCsv incluye la nota del asterisco y redondea', async () => {
    const repo = await loadRepo();
    const csv = viewToCsv(buildView(repo, core.state));
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('IPC · España*');
    expect(lines.at(-1)).toContain('cálculo o estimación nuestra');
    expect(lines.find((l) => l.startsWith('2008,'))).toBe('2008,100,100,100');
  });

  test('headlineFact', async () => {
    const repo = await loadRepo();
    expect(headlineFact(repo, core)).toMatch(/perdió un 0,6 % de poder de compra/);
  });
});

describe('Selector de series: búsqueda', () => {
  test('filtra por texto sin tildes, abre los grupos con resultados y se puede borrar', async () => {
    renderApp(<Workbench initial={core.state} variant="full" />);
    const box = await screen.findByRole('searchbox', { name: /Buscar entre todas las series/ });
    const sectores = screen.getByText(/Salario medio por sector/).closest('details');
    expect(sectores.open).toBe(false);                                              // los grupos grandes empiezan plegados
    await userEvent.type(box, 'hosteleria');
    expect(sectores.open).toBe(true);
    expect(screen.getByRole('checkbox', { name: /Hostelería/ })).toBeTruthy();
    expect(screen.queryByRole('checkbox', { name: /Tasa de paro/ })).toBeNull();
    expect(screen.getAllByText(/series encontradas|serie encontrada/).length).toBeGreaterThan(0);
    await userEvent.clear(box);
    await userEvent.type(box, 'zzzz');
    expect(await screen.findByText('Ninguna serie coincide con la búsqueda.')).toBeTruthy();
    await userEvent.clear(box);
    expect(screen.queryByText('Ninguna serie coincide con la búsqueda.')).toBeNull();
    expect(screen.getByText(/Salario medio por sector/).closest('details').open).toBe(false);   // vuelve a su estado
  });

  test('marcar una serie encontrada la añade al gráfico', async () => {
    renderApp(<Workbench initial={core.state} variant="full" />);
    const box = await screen.findByRole('searchbox', { name: /Buscar entre todas las series/ });
    await userEvent.type(box, 'vivienda madrid');
    await userEvent.click(screen.getByRole('checkbox', { name: /Precio de la vivienda · Madrid · general/ }));
    const legend = await screen.findByRole('list', { name: 'Series del gráfico' });
    expect(within(legend).getAllByRole('listitem')).toHaveLength(4);
  });
});

describe('Explorador: cambio de enlace en la misma pestaña', () => {
  test('al navegar a otra URL del explorador el gráfico se reconstruye con ese estado', async () => {
    const { default: Explorer } = await import('../src/pages/Explorer.jsx');
    const { Link } = await import('react-router-dom');
    renderApp(<><Link to="/explorador?s=pob_es_total,pob_mad_total&m=index&b=2000&f=2000">otro enlace</Link><Explorer /></>,
      { route: '/explorador?s=ipc_es&m=index&b=2008&f=2008' });
    let legend = await screen.findByRole('list', { name: 'Series del gráfico' });
    expect(within(legend).getAllByRole('listitem')).toHaveLength(1);
    await userEvent.click(screen.getByRole('link', { name: 'otro enlace' }));
    await waitFor(() => {
      legend = screen.getByRole('list', { name: 'Series del gráfico' });
      expect(within(legend).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
        expect.stringContaining('Población · España · total*'), expect.stringContaining('Población · Madrid · total*')]);
    });
  });
});
