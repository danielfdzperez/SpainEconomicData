/**
 * Gráficos preparados. Cada uno es un estado del explorador (mismas claves que la URL).
 * El de «core» reproduce el gráfico de CORE-Econ: salario nominal, precios y salario real.
 */
import { lit } from '../i18n/index.js';

export const PRESETS = Object.freeze([
  {
    id: 'core',
    title: lit('Salario nominal, IPC y salario real'),
    blurb: lit('El gráfico de CORE-Econ: el sueldo en euros de cada año, los precios y lo que realmente se puede comprar con él.'),
    state: { selected: ['sal_mediana_es_t', 'ipc_es', 'sal_mediana_es_t~real'], mode: 'index', base: 2008, from: 2008, to: null, context: true },
  },
  {
    id: 'madrid',
    title: lit('Salario real: España frente a Madrid'),
    blurb: lit('Cada sueldo mediano descontando los precios de su territorio.'),
    state: { selected: ['sal_mediana_es_t~real', 'sal_mediana_mad_t~real'], mode: 'index', base: 2008, from: 2008, to: null, context: true },
  },
  {
    id: 'pib',
    title: lit('PIB, salarios y precios'),
    blurb: lit('La economía crece más deprisa que el sueldo del trabajador típico. ¿Por qué?'),
    state: { selected: ['pib_nominal', 'sal_media_es_t', 'sal_mediana_es_t', 'ipc_es'], mode: 'index', base: 2008, from: 2008, to: null, context: true },
  },
  {
    id: 'smi',
    title: lit('SMI frente a los precios'),
    blurb: lit('El salario mínimo nominal y descontando la inflación.'),
    state: { selected: ['smi_anual', 'smi_anual~real', 'ipc_es'], mode: 'index', base: 2008, from: 2008, to: null, context: true },
  },
  {
    id: 'vivienda',
    title: lit('Vivienda, sueldo y precios'),
    blurb: lit('El precio de comprar casa, el sueldo mediano y los precios, desde 2008. ¿Quién ha subido más?'),
    state: { selected: ['ipv_es_general', 'sal_mediana_es_t', 'ipc_es', 'ipv_es_general~real'], mode: 'index', base: 2008, from: 2008, to: null, context: true },
  },
  {
    id: 'esfuerzo',
    title: lit('Años de salario para comprar una vivienda'),
    blurb: lit('Años de sueldo bruto que costaría una vivienda tipo de 80 m² a precio de tasación (cota baja) y, al lado, la cifra oficial del Banco de España con precios de mercado y renta del hogar.'),
    state: { selected: ['viv_anios_salario_media_es', 'viv_anios_salario_mediana_es', 'viv_anios_renta_hogar_bde_es'], mode: 'raw', base: null, from: 2008, to: null, context: true },
  },
  {
    id: 'alquiler',
    title: lit('Cuánto ha subido el alquiler'),
    blurb: lit('Alquiler medio de un piso en euros al mes (contratos declarados, 2013–2024): Comunidad de Madrid frente al conjunto de España.'),
    state: { selected: ['alq_mes_mad', 'alq_mes_es'], mode: 'raw', base: null, from: 2013, to: null, context: true },
  },
  {
    id: 'poblacion',
    title: lit('Población de España y de Madrid'),
    blurb: lit('Cuánta gente más vive hoy que en el año 2000, en el conjunto del país y en la Comunidad de Madrid.'),
    state: { selected: ['pob_es_total', 'pob_mad_total'], mode: 'index', base: 2000, from: 2000, to: null, context: true },
  },
  {
    id: 'paro',
    title: lit('Tasa de paro (EPA)'),
    blurb: lit('El porcentaje de activos sin empleo: total en España, en Madrid y entre menores de 25 años.'),
    state: { selected: ['paro_es_t_total', 'paro_mad_t_total', 'paro_es_t_m25'], mode: 'raw', base: null, from: 2006, to: null, context: true },
  },
  {
    id: 'ipc',
    title: lit('Inflación año a año'),
    blurb: lit('La variación anual de los precios en España y en Madrid.'),
    state: { selected: ['ipc_es', 'ipc_mad'], mode: 'yoy', base: null, from: null, to: null, context: true },
  },
]);

export const presetById = (id) => PRESETS.find((p) => p.id === id);
