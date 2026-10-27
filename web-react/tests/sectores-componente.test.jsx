import { describe, expect, test } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectoresPib, slicePath } from '../src/components/SectoresPib.jsx';
import Pib from '../src/pages/Pib.jsx';
import { renderApp } from './testUtils.jsx';

const list = async (name) => within(await screen.findByRole('list', { name }));
const rowTexts = (l) => l.getAllByRole('listitem').map((li) => li.textContent);

describe('Queso del PIB por sectores', () => {
  test('arranca con los cinco bloques de 2025 y los servicios en 68,5 %', async () => {
    renderApp(<SectoresPib />);
    const l = await list('Partes de PIB');
    const rows = rowTexts(l);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toContain('Servicios');
    expect(rows[0]).toContain('68,5 %');
    expect(rows.some((t) => t.includes('Impuestos sobre productos') && t.includes('9,4 %'))).toBe(true);
    expect(screen.getByRole('img', { name: /Queso de PIB: Servicios 68,5 %/ })).toBeTruthy();
  });

  test('pulsar «Servicios» abre las siete ramas y las migas permiten volver', async () => {
    renderApp(<SectoresPib />);
    await userEvent.click(await screen.findByRole('button', { name: /Servicios:.*Ver su desglose/ }));
    const l = await list('Partes de Servicios');
    expect(rowTexts(l)).toHaveLength(7);
    expect(rowTexts(l)[0]).toContain('32,1 %'); // 371.806 / 1.158.092
    const nav = screen.getByRole('navigation', { name: 'Dónde estás en el desglose' });
    expect(within(nav).getByText('Servicios').getAttribute('aria-current')).toBe('page');
    await userEvent.click(within(nav).getByRole('button', { name: 'Toda la economía' }));
    expect(rowTexts(await list('Partes de PIB'))).toHaveLength(5);
  });

  test('segundo nivel: comercio, transporte y hostelería se separan en tres', async () => {
    renderApp(<SectoresPib />);
    await userEvent.click(await screen.findByRole('button', { name: /Servicios:.*Ver su desglose/ }));
    await userEvent.click(await screen.findByRole('button', { name: /Comercio, transporte y hostelería:.*Ver su desglose/ }));
    const rows = rowTexts(await list('Partes de Comercio, transporte y hostelería'));
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain('Comercio');
    expect(rows.some((t) => t.includes('Hostelería') && t.includes('27,6 %'))).toBe(true); // 102.477 / 371.806
    expect(screen.getByText(/último nivel de detalle/)).toBeTruthy();
  });

  test('sobre el valor añadido desaparecen los impuestos y los servicios suben a 75,6 %', async () => {
    renderApp(<SectoresPib />);
    await userEvent.click(await screen.findByRole('radio', { name: /Valor añadido/ }));
    const rows = rowTexts(await list('Partes de PIB'));
    expect(rows).toHaveLength(4);
    expect(rows[0]).toContain('75,6 %');
  });

  test('cambiar de año recalcula (2024: servicios 1.105.000 M €)', async () => {
    renderApp(<SectoresPib />);
    await userEvent.click(await screen.findByRole('radio', { name: /2024/ }));
    const rows = rowTexts(await list('Partes de PIB'));
    expect(rows[0]).toContain('1.105.000 M €');
    expect(rows[0]).toContain('69,1 %');
  });

  test('la tabla completa trae las 28 filas y marca con * lo calculado', async () => {
    renderApp(<SectoresPib />);
    const table = await screen.findByRole('table', { hidden: true });
    expect(within(table).getAllByRole('row', { hidden: true })).toHaveLength(29);
    expect(table.textContent).toContain('Hostelería');
    expect(screen.getAllByText('*').length).toBeGreaterThan(3);
  });

  test('la página del PIB incluye el apartado', async () => {
    renderApp(<Pib />);
    expect(await screen.findByRole('heading', { name: /reparto por sectores/ })).toBeTruthy();
    expect(await screen.findByRole('region', { name: 'Reparto del PIB por sectores' })).toBeTruthy();
  });

  test('una única porción redonda no rompe el trazado', () => {
    expect(slicePath(0, Math.PI * 2)).toMatch(/^M[\d.]+ [\d.]+A/);
  });
});
