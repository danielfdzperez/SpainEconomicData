/**
 * Series de vivienda, población y empleo: se contrastan con cifras de los Excel
 * (04_Vivienda_y_Alquiler, 05_Poblacion, 01_Empleo_Desempleo) y con el cálculo independiente del salario real.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { buildView } from '../src/domain/pipeline.js';
import { UNITS } from '../src/domain/units.js';
import { PRESETS } from '../src/content/presets.js';
import { loadRepo, close } from './helpers.mjs';

const repo = await loadRepo();
const view = (selected, mode, base, from = 2008, to = 2024) => buildView(repo, { selected, mode, base, from, to });

test('todas las unidades del catálogo están definidas', () => {
  for (const m of repo.allMeta) assert.ok(UNITS[m.unit], `${m.id}: unidad «${m.unit}» sin definir`);
});

test('todo lo calculado por nosotros lleva nota; lo oficial no', () => {
  for (const m of repo.allMeta) {
    if (m.calculado) assert.ok(m.nota_calculo.length > 20, `${m.id} sin nota de cálculo`);
    else assert.equal(m.nota_calculo, '', `${m.id} tiene nota pero no está marcado como calculado`);
  }
  for (const id of ['pib_pc', 'pob_mad_pct_es', 'tasa_empleo_es_total', 'tasa_activ_mad_m25']) {
    assert.equal(repo.series(id).displayLabel.endsWith('*'), true, id);
  }
  for (const id of ['ipv_es_general', 'ipva_mad_total', 'pob_es_total', 'paro_es_t_total']) {
    assert.equal(repo.series(id).displayLabel.endsWith('*'), false, id);
  }
});

test('vivienda: cifras del IPV y del IPVA (INE)', () => {
  assert.ok(close(repo.series('ipv_es_general').get(2008), 81.897, 1e-9));
  assert.ok(close(repo.series('ipv_es_general').get(2013), 53.509, 1e-9));
  assert.ok(close(repo.series('ipv_mad_general').get(2007), 79.423, 1e-9));
  assert.ok(close(repo.series('ipv_es_general').get(2025), 100, 1e-6));        // base 2025 = 100
  assert.ok(close(repo.series('ipva_es_total').get(2015), 100, 1e-9));          // base 2015 = 100
  assert.ok(close(repo.series('ipva_mad_total').get(2024), 122.246, 1e-9));
  assert.equal(repo.series('ipv_es_general').firstYear, 2007);
  assert.equal(repo.series('ipva_es_total').lastYear, 2024);
});

test('vivienda: la caída 2007–2013 del IPV nacional es de −35,7 %', () => {
  const s = repo.series('ipv_es_general');
  assert.ok(close((s.get(2013) / s.get(2007) - 1) * 100, -35.6515, 1e-3));
});

test('población: cifras a 1 de enero', () => {
  assert.equal(repo.series('pob_es_total').get(1971), 34040642);
  assert.equal(repo.series('pob_es_total').get(2026), 49596376);
  assert.equal(repo.series('pob_mad_total').get(2026), 7168876);
  for (const y of [1971, 2002, 2026]) {
    assert.equal(repo.series('pob_es_hombres').get(y) + repo.series('pob_es_mujeres').get(y), repo.series('pob_es_total').get(y), `hombres+mujeres ${y}`);
  }
  assert.ok(close(repo.series('pob_mad_pct_es').get(2026), 14.4535, 1e-3));
  assert.equal(repo.series('pob_es_total').firstYear, 1971);
});

test('empleo: la tasa de paro llega al máximo en 2013 (26,09 % España, 19,76 % Madrid)', () => {
  const es = repo.series('paro_es_t_total');
  const mad = repo.series('paro_mad_t_total');
  assert.ok(close(es.get(2013), 26.09, 1e-9));
  assert.ok(close(mad.get(2013), 19.76, 1e-9));
  assert.ok(close(es.get(2025), 10.5, 1e-9));
  const years = [...Array(2025 - 2006 + 1).keys()].map((i) => 2006 + i);
  assert.equal(years.reduce((best, y) => (es.get(y) > es.get(best) ? y : best), 2006), 2013);
});

test('empleo: la tasa de empleo/actividad anual es la media de los trimestres (2002)', () => {
  assert.ok(close(repo.series('tasa_empleo_es_total').get(2002), 48.35, 1e-9));
  assert.ok(close(repo.series('tasa_activ_mad_total').get(2002), 58.74, 1e-9));
  assert.equal(repo.series('tasa_empleo_es_total').firstYear, 2002);
});

test('PIB por habitante: difiere menos de un 1 % de la cifra oficial del INE (2023–2025)', () => {
  const ine = { 2023: 30945, 2024: 32708, 2025: 34365 };
  for (const [y, v] of Object.entries(ine)) {
    const ours = repo.series('pib_pc').get(Number(y));
    assert.ok(Math.abs(ours / v - 1) < 0.01, `${y}: ${ours} frente a ${v}`);
  }
});

test('precio real de la vivienda: coincide con un cálculo independiente (2008 = 100)', () => {
  const ipc = repo.series('ipc_es');
  let price = 1;                                    // índice de precios 2008 = 1, encadenando las tasas dic/dic
  for (let y = 2009; y <= 2024; y++) price *= 1 + ipc.get(y) / 100;
  const ipv = repo.series('ipv_es_general');
  const expected = (ipv.get(2024) / ipv.get(2008)) / price * 100;
  const real = view(['ipv_es_general~real'], 'index', 2008).series[0];
  assert.ok(close(real.get(2024), expected, 1e-6), `${real.get(2024)} frente a ${expected}`);
  assert.ok(real.calc.join(' ').includes('IPC'));
});

test('raw: no mezcla índices de bases distintas ni personas con porcentajes', () => {
  assert.equal(view(['ipv_es_general', 'ipva_es_total'], 'raw', null, 2013, 2024).errors.length, 1);
  assert.equal(view(['pob_es_total', 'paro_es_t_total'], 'raw', null, 2006, 2025).errors.length, 1);
  assert.equal(view(['paro_es_t_total', 'tasa_empleo_es_total', 'pob_mad_pct_es'], 'raw', null, 2006, 2025).errors.length, 0);
});

test('en índice se pueden mezclar vivienda, población, paro, salario y precios', () => {
  const v = view(['ipv_es_general', 'pob_es_total', 'paro_es_t_total', 'sal_mediana_es_t', 'ipc_es', 'pib_pc'], 'index', 2008);
  assert.equal(v.series.length, 6);
  assert.equal(v.errors.length, 0);
  for (const s of v.series) assert.ok(close(s.get(2008), 100));
});

test('gráficos preparados: existen sus series y, con año base, arrancan en él', () => {
  for (const p of PRESETS) {
    for (const key of p.state.selected) {
      const id = key.replace(/~real$/, '');
      assert.ok(repo.hasSeries(id), `${p.id}: falta ${id}`);
    }
    if (p.state.base != null) assert.equal(p.state.from, p.state.base, `${p.id} debe empezar en su año base`);
    const v = buildView(repo, p.state);
    assert.equal(v.errors.length, 0, `${p.id}: ${JSON.stringify(v.errors)}`);
    assert.ok(v.series.length >= 1, p.id);
  }
  assert.equal(PRESETS.find((p) => p.id === 'core').state.from, 2008);
});

test('integridad: glosario y deflactor existen, ids válidos y sin saltos de años', () => {
  for (const m of repo.allMeta) {
    if (m.glosario_id) assert.ok(repo.glossary(m.glosario_id), `${m.id}: glosario «${m.glosario_id}» inexistente`);
    if (m.deflactor) assert.ok(repo.hasSeries(m.deflactor), `${m.id}: deflactor «${m.deflactor}» inexistente`);
    assert.match(m.id, /^[a-z0-9_]+$/, `${m.id}: id no válido para la URL`);
    const ys = repo.series(m.id).years;
    assert.deepEqual(ys, Array.from({ length: ys.length }, (_, i) => ys[0] + i), `${m.id}: faltan años intermedios`);
  }
});

test('salarios por edad, sector, ocupación y contrato (INE)', () => {
  assert.equal(repo.series('sal_edad_es_t_25_29').get(2008), 17434);
  assert.equal(repo.series('sal_edad_es_t_m20').get(2008), 9960.26);
  assert.equal(repo.hasSeries('sal_edad_es_m_m20'), false);   // mujeres, menos de 20: el INE no publica algunos años (< 100 observaciones)
  assert.equal(repo.hasSeries('sal_edad_es_h_m20'), false);
  assert.equal(repo.series('sal_sector_k').get(2008), 41619.07);   // financieras y seguros
  assert.equal(repo.series('sal_sector_i').get(2008), 13957.49);   // hostelería
  assert.equal(repo.series('sal_contrato_indefinido').get(2008), 23544.24);
  assert.equal(repo.series('sal_contrato_temporal').get(2008), 16204.29);
  assert.equal(repo.series('sal_ocup_eaes2553').get(2008), 57259.16);   // directores y gerentes
});

test('desigualdad salarial y tramos de SMI (INE)', () => {
  assert.equal(repo.series('ees_eaes234').get(2008), 32.2);          // Gini
  assert.equal(repo.series('ees_eaes229').get(2008), 3.8);           // D9/D1
  assert.equal(repo.series('ees_eaes59').get(2008), 8.86);           // % con salario 0-1 SMI
  assert.equal(repo.series('ees_eaes234').unit, 'puntos');
  assert.equal(repo.series('ees_eaes229').unit, 'veces');
  assert.match(repo.meta('ees_eaes59').aviso, /Ruptura metodológica/);
});

test('gasto de los hogares (EPF), renta y pobreza (ECV)', () => {
  assert.equal(repo.series('epf_es_total_hogar').get(2018), 29871.28);
  assert.equal(repo.series('epf_es_total_persona').get(2018), 12018.94);
  assert.equal(repo.series('epf_es_alimentos_peso').get(2018), 14.14);
  assert.equal(repo.series('epf_es_vivienda_hogar').get(2023), 10367.26);
  assert.equal(repo.series('ecv_renta_es_persona').get(2025), 15620);
  assert.equal(repo.series('ecv_renta_mad_persona').get(2025), 18169);
  assert.equal(repo.series('ecv_arope_mad').get(2020), 21.2);
  assert.equal(repo.series('ecv_arope_es').get(2020), 27);
});

test('PIB: agregados de la Contabilidad Nacional y gasto en educación', () => {
  assert.equal(repo.series('pib_pc_ine').get(2024), 32708);
  assert.equal(repo.series('pib_remuneracion').get(2025), 817261);
  assert.equal(repo.series('ocupados_cn').get(2023), 21477);
  assert.equal(repo.series('edu_gasto_publico').get(2024), 71349);
  assert.equal(repo.series('edu_gasto_publico').firstYear, 2019);
  assert.equal(repo.series('edu_gasto_pct_pib').get(2024), 4.48);
  // la parte del PIB que va a los salarios = remuneración ÷ PIB (2024, aprox. 46,7 %)
  const share = repo.series('pib_remuneracion').get(2024) / repo.series('pib_nominal').get(2024) * 100;
  assert.ok(share > 45 && share < 49, `parte salarial ${share}`);
});

test('vivienda: valor tasado (€/m²) y años de salario para una vivienda de 80 m²', () => {
  const vt = repo.series('viv_valor_tasado_es');
  assert.ok(close(vt.get(1995), 683.025, 1e-9));
  assert.ok(close(vt.get(2008), 2071.075, 1e-9));
  assert.ok(close(vt.get(2014), 1459.4, 1e-9));
  assert.equal(vt.firstYear, 1995);
  assert.equal(vt.lastYear, 2025);
  for (const [id, sal] of [['viv_anios_salario_media_es', 'sal_media_es_t'], ['viv_anios_salario_mediana_es', 'sal_mediana_es_t']]) {
    const s = repo.series(id);
    assert.equal(s.firstYear, 2008);
    assert.equal(s.lastYear, 2024);
    for (const y of [2008, 2013, 2024]) assert.ok(close(s.get(y), (80 * vt.get(y)) / repo.series(sal).get(y), 1e-9), `${id} ${y}`);
    assert.equal(s.displayLabel.endsWith('*'), true, `${id} es cálculo nuestro`);
  }
  // pico de la burbuja frente al mínimo posterior (la media pasa de ≈7,6 a ≈5,2 años)
  const m = repo.series('viv_anios_salario_media_es');
  assert.ok(m.get(2008) > 7 && m.get(2013) < 5.5 && m.get(2024) < 5.5);
});

test('el gráfico preparado de esfuerzo en años de salario usa series y unidad existentes', () => {
  const p = PRESETS.find((x) => x.id === 'esfuerzo');
  assert.ok(p);
  const v = view(p.state.selected, p.state.mode, p.state.base, p.state.from, 2024);
  assert.equal(v.series.length, 3);
});

test('vivienda: la cifra oficial del Banco de España acompaña a la nuestra y es mayor', () => {
  const bde = repo.series('viv_anios_renta_hogar_bde_es');
  assert.equal(bde.get(2023), 7.1);
  assert.equal(bde.get(2024), 7.1);
  assert.equal(bde.get(2025), 7.6);
  assert.equal(bde.displayLabel.endsWith('*'), false, 'dato oficial, sin asterisco');
  assert.equal(repo.series('viv_esfuerzo_teorico_bde_es').get(2024), 34.5);
  // la tasación es una cota baja: queda por debajo del dato oficial
  assert.ok(repo.series('viv_anios_salario_media_es').get(2024) < bde.get(2024));
});

test('alquiler en euros: SERPAVI 2022 llevado a otros años con el IPVA', () => {
  const ipva = (id, y) => repo.series(id).get(y);
  for (const [id, base, idx] of [['alq_mes_mad', 738, 'ipva_mad_colect'], ['alq_m2_mad', 11.1, 'ipva_mad_colect'], ['alq_mes_es', 567.81, 'ipva_es_colect'], ['alq_m2_es', 7.83, 'ipva_es_colect']]) {
    const s = repo.series(id);
    assert.equal(s.firstYear, 2013);
    assert.equal(s.lastYear, 2024);
    assert.ok(close(s.get(2022), base, 1e-9), `${id} en 2022 coincide con el ancla`);
    assert.ok(close(s.get(2024), (base * ipva(idx, 2024)) / ipva(idx, 2022), 1e-9), `${id} 2024`);
    assert.equal(s.displayLabel.endsWith('*'), true, `${id} es cálculo nuestro`);
  }
  assert.ok(repo.series('alq_mes_mad').get(2024) > repo.series('alq_mes_es').get(2024));
});

test('el gráfico preparado del alquiler existe y dibuja dos series', () => {
  const p = PRESETS.find((x) => x.id === 'alquiler');
  assert.ok(p);
  const v = view(p.state.selected, p.state.mode, p.state.base, p.state.from, 2024);
  assert.equal(v.series.length, 2);
});
