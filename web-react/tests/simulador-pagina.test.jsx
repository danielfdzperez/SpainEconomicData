import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { HelpProvider } from '../src/components/Help.jsx';
import { DataProvider } from '../src/data/DataContext.jsx';
import Simulador from '../src/pages/Simulador.jsx';
import { renderApp } from './testUtils.jsx';

const abrir = async () => {
  renderApp(<Simulador />, { route: '/simulador' });
  await screen.findByRole('heading', { name: /Tu sueldo y lo que cuesta a tu empresa/ });
};
const escribir = async (label, valor) => {
  const campo = screen.getByLabelText(label);
  await userEvent.clear(campo);
  if (valor !== '') await userEvent.type(campo, valor);
};

describe('Simulador', () => {
  test('con los valores de partida calcula la nómina de 2.000 € × 14 pagas', async () => {
    await abrir();
    expect(screen.getByText('1.579 €')).toBeTruthy();                // neto por paga
    expect(screen.getByText('3.084 €')).toBeTruthy();                // coste mensual de la empresa
    expect(screen.getByText('40,3 %')).toBeTruthy();                 // parte que va al sector público
    expect(screen.getByRole('img', { name: /Tu sueldo neto 22\.102 €/ })).toBeTruthy();
  });

  test('cambiar el sueldo y las pagas recalcula al momento', async () => {
    await abrir();
    await escribir('Sueldo bruto de una paga', '2450');
    await userEvent.click(screen.getByRole('radio', { name: '12 pagas' }));
    expect(screen.getByText(/netos en cada una de tus 12 pagas/)).toBeTruthy();
    // 2450 × 12 = 29.400 € brutos al año
    const tabla = screen.getByRole('table', { name: 'Desglose de la nómina del trabajador' });
    expect(within(tabla).getByText('29.400,00 €')).toBeTruthy();
    expect(within(tabla).getByText('Total IRPF')).toBeTruthy();
  });

  test('sin sueldo avisa en vez de enseñar ceros', async () => {
    await abrir();
    await escribir('Sueldo bruto de una paga', '');
    expect(screen.getAllByText(/Escribe (tu sueldo bruto|un sueldo mayor)/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('table', { name: 'Desglose de la nómina del trabajador' })).toBeNull();
  });

  test('el IRPF se explica paso a paso con las dos escalas', async () => {
    await abrir();
    const detalle = screen.getByText(/Cómo se calcula tu IRPF, paso a paso/).closest('details');
    await userEvent.click(within(detalle).getByText(/Cómo se calcula tu IRPF/));
    expect(detalle.open).toBe(true);
    expect(within(detalle).getByText('Escala del Estado')).toBeTruthy();
    expect(within(detalle).getByText('Escala de la Comunidad de Madrid')).toBeTruthy();
    expect(within(detalle).getByText('Rendimiento neto del trabajo')).toBeTruthy();
  });

  test('la empresa paga más con una actividad de más riesgo (construcción 6,70 %)', async () => {
    await abrir();
    await userEvent.selectOptions(screen.getByLabelText('Actividad de la empresa'), '41');
    const tabla = screen.getByRole('table', { name: 'Desglose del coste de la empresa' });
    expect(within(tabla).getAllByText('6,70 %').length).toBeGreaterThan(0);
  });

  test('servicios: por defecto las visitas se cuentan en toda la vida y se pueden contar al año', async () => {
    await abrir();
    // 5 + 3 + 1,9 = 9,9 al año × 40 años = 396 en toda la vida
    expect(screen.getByText('396')).toBeTruthy();
    expect(screen.getByLabelText('Médico de cabecera').value).toBe('200');
    await userEvent.click(screen.getByRole('radio', { name: 'Al año' }));
    expect(screen.getByLabelText('Médico de cabecera').value).toBe('5');   // 200 ÷ 40 años
    expect(screen.getByText('396')).toBeTruthy();                           // el total no cambia
    await escribir('¿Cuántos años tienes?', '50');
    expect(screen.getByText('495')).toBeTruthy();                           // 9,9 al año × 50 años
  });

  test('servicios: el seguro de salud privado se compara con lo contado y se puede elegir con parto', async () => {
    await abrir();
    const servicios = document.getElementById('servicios');
    expect(within(servicios).getByRole('heading', { name: /Lo que costaría un seguro de salud privado/ })).toBeTruthy();
    expect(within(servicios).getByText('al año de prima')).toBeTruthy();
    const antes = within(servicios).getByText('al año de prima').previousSibling.textContent;
    await userEvent.click(within(servicios).getByRole('radio', { name: /Con cobertura de parto/ }));
    const despues = within(servicios).getByText('al año de prima').previousSibling.textContent;
    expect(despues).not.toBe(antes);
  });

  test('autónomo: pasar a autónomo calcula la cuota por tramos y el IRPF de la actividad', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('radio', { name: 'Autónomo' }));
    expect(screen.getByRole('heading', { name: /Tus ingresos y lo que te queda/ })).toBeTruthy();
    const tabla = screen.getByRole('table', { name: 'Desglose de las cuentas del autónomo' });
    expect(within(tabla).getByText('Total cuota de autónomos')).toBeTruthy();
    expect(screen.getAllByText(/Tramo 6 de la tabla general/).length).toBeGreaterThan(0);    // 3.000 € facturados, 500 € de gastos
    await escribir('Lo que facturas al mes', '');
    expect(screen.getAllByText(/Escribe lo que facturas al mes/).length).toBeGreaterThan(0);
  });

  test('historial: el ejemplo de la persona usuaria suma el paro cobrado y el paro que le tocaría hoy', async () => {
    await abrir();
    const bal = document.getElementById('balance');
    await userEvent.click(within(bal).getByRole('checkbox', { name: /detallar mi historial laboral/ }));
    await userEvent.click(within(bal).getByRole('button', { name: 'Rellenar con un ejemplo' }));
    expect(within(bal).getAllByRole('group', { name: /^Periodo / }).length).toBe(4);
    const tabla = within(bal).getByRole('table', { name: /Lo aportado, lo cotizado para el paro/ });
    expect(within(tabla).getAllByText('14.700 €').length).toBeGreaterThan(0);  // paro cobrado: 12 meses × 1.225 €
    const paro = document.getElementById('paro');
    expect(within(paro).getByText(/de paro te tocarían si lo dejaras hoy/)).toBeTruthy();
    expect(within(paro).getByText(/de paro has generado para el Estado/)).toBeTruthy();
    await userEvent.click(within(bal).getAllByRole('button', { name: /^Quitar el periodo/ })[0]);
    expect(within(bal).getAllByRole('group', { name: /^Periodo / }).length).toBe(3);
  });

  test('paro: sin historial, el paro de hoy sale del sueldo actual', async () => {
    await abrir();
    const paro = document.getElementById('paro');
    expect(within(paro).getByText(/de paro te tocarían si lo dejaras hoy/)).toBeTruthy();
    expect(within(paro).getByText('Total que cobrarías (bruto)')).toBeTruthy();
  });

  test('servicios: ingresos y partos aparecen en el detalle con su precio', async () => {
    await abrir();
    await escribir('Noches ingresado en el hospital', '10');
    const tabla = screen.getByRole('table', { name: /Uso de servicios/ });
    const fila = within(tabla).getByText('Noches en el hospital').closest('tr');
    expect(within(fila).getAllByText('6.710 €').length).toBe(2); // pública y «privada» (mismo precio)
    expect(within(fila).getByText(/sin precio privado/)).toBeTruthy();
  });

  test('servicios: elegir colegio privado cambia lo que paga la familia', async () => {
    await abrir();
    const antes = screen.getAllByText(/Primaria · pública/).length;
    expect(antes).toBeGreaterThan(0);
    await userEvent.selectOptions(screen.getByLabelText('Tipo de centro en Primaria'), 'privada');
    expect(screen.getAllByText(/Primaria · privada/).length).toBeGreaterThan(0);
  });

  test('balance: aportado frente a usado y la variante con la sanidad media', async () => {
    await abrir();
    const bal = document.getElementById('balance');
    expect(within(bal).getByText(/has aportado en 15 años de trabajo/)).toBeTruthy();
    expect(within(bal).getAllByText('223.502 €').length).toBeGreaterThan(0);
    const usadoAntes = within(bal).getByText(/has usado en sanidad, educación y transporte/).previousSibling.textContent;
    await userEvent.click(within(bal).getByRole('checkbox', { name: /sanidad como una persona media/ }));
    const usadoDespues = within(bal).getByText(/has usado en sanidad, educación y transporte/).previousSibling.textContent;
    expect(usadoDespues).not.toBe(usadoAntes);
  });

  test('balance: los años trabajados no pueden superar la edad', async () => {
    await abrir();
    await escribir('¿Cuántos años llevas trabajando?', '70');
    expect(screen.getByText(/has aportado en 40 años de trabajo/)).toBeTruthy();
    expect(screen.getByText(/parece mucho/)).toBeTruthy();
  });

  test('sueldo sin impuestos: aparece junto al neto y al coste de empresa', async () => {
    await abrir();
    const sec = document.getElementById('sueldo');
    expect(within(sec).getByText(/al mes sin impuestos, sin descontar nada/)).toBeTruthy();
    expect(within(sec).getByText('2.333 €')).toBeTruthy();           // 28.000 € ÷ 12
  });

  test('seguro: explica que la barra pública no es lo pagado ni lo aportado', async () => {
    await abrir();
    const sec = document.getElementById('servicios');
    expect(within(sec).getByText(/Cómo leer las barras/)).toBeTruthy();
    expect(within(sec).getByText(/no es lo que has pagado ni lo que has aportado/)).toBeTruthy();
    expect(within(sec).getAllByText(/Prima anual del seguro privado \(la pagarías tú\)/).length).toBeGreaterThan(0);
  });

  test('precios: avisa de que la consulta de especialista privada sale más barata que la tarifa pública', async () => {
    await abrir();
    const sec = document.getElementById('servicios');
    expect(within(sec).getByText(/¿Por qué algunos precios públicos salen más altos que los privados\?/)).toBeTruthy();
    expect(within(sec).getByText(/especialista en el hospital \(132 € en la pública frente a 90 € en la privada\)/)).toBeTruthy();
    expect(within(sec).getAllByText(/más barato que lo público/).length).toBeGreaterThan(0);
  });

  test('balance: el gasto público medio se explica como gasto total entre habitantes', async () => {
    await abrir();
    const bal = document.getElementById('balance');
    expect(within(bal).getByText(/Gasto público medio por persona × tu edad/)).toBeTruthy();
    expect(within(bal).getByText(/No es lo que has usado tú/)).toBeTruthy();
  });

  test('Estado o privado: compara lo que te queda al año y enseña el pago mensual privado', async () => {
    await abrir();
    const sec = document.getElementById('privado');
    expect(sec).toBeTruthy();
    expect(within(sec).getByRole('heading', { name: /Estado o privado/ })).toBeTruthy();
    const tabla = within(sec).getByRole('table', { name: /Lo que te queda al año con impuestos/ });
    expect(within(tabla).getByText('Te queda al año')).toBeTruthy();
    expect(within(tabla).getByText('22.102 €')).toBeTruthy();         // neto anual
    expect(within(tabla).getByText('28.000 €')).toBeTruthy();         // bruto anual
    expect(within(sec).getByRole('table', { name: /Pago mensual de los servicios privados/ })).toBeTruthy();
    expect(within(sec).getByText(/Lo que dejarías de recibir/)).toBeTruthy();
    // cambiar a «lo que cuesto a mi empresa» sube el sueldo sin impuestos a 37.002 €
    await userEvent.click(within(sec).getByRole('radio', { name: 'Lo que cuesto a mi empresa' }));
    expect(within(sec).getAllByText('37.002 €').length).toBeGreaterThan(0);
    await userEvent.click(within(sec).getByRole('radio', { name: 'Pagando cada visita' }));
    expect(within(sec).getByText(/Sanidad \(pagando cada visita\)/)).toBeTruthy();
  });

  test('todo lo calculado lleva asterisco', async () => {
    await abrir();
    const bigs = document.querySelectorAll('.big, .duel__value');
    expect(bigs.length).toBeGreaterThan(5);
    const sinStar = [...bigs].filter((b) => !b.querySelector('.star') && !/noches|años has estado/.test(b.textContent));
    expect(sinStar.map((b) => b.textContent)).toEqual([]);
  });
});

describe('Simulador · carga', () => {
  test('si fallan los parámetros, lo dice y permite reintentar', async () => {
    let fallar = true;
    const loader = async (p) => {
      if (p.includes('/sim/') && fallar) throw new Error('sin conexión');
      return readFile(join(process.cwd(), 'public', p), 'utf-8');
    };
    render(
      <DataProvider loader={loader} basePath="data/">
        <HelpProvider><MemoryRouter><Simulador /></MemoryRouter></HelpProvider>
      </DataProvider>,
    );
    expect(await screen.findByText(/No se han podido cargar los parámetros/)).toBeTruthy();
    expect(screen.getByText(/sin conexión/)).toBeTruthy();
    fallar = false;
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Tu sueldo y lo que cuesta/ })).toBeTruthy());
  });
});
