/**
 * Marcas de contexto históricas sobre el gráfico. Son una selección nuestra (*),
 * sólo para orientar: no son un dato de ninguna de las fuentes.
 */
import { lit } from '../i18n/index.js';

export const EVENTS = Object.freeze([
  { from: 2008, to: 2013, short: lit('Gran Recesión*'), label: lit('Gran Recesión y crisis de deuda (2008–2013)*') },
  { from: 2020, to: 2020, short: lit('COVID*'), label: lit('Pandemia de COVID-19 (2020)*') },
  { from: 2021, to: 2023, short: lit('Repunte de precios*'), label: lit('Repunte de la inflación: energía y guerra en Ucrania (2021–2023)*') },
]);
