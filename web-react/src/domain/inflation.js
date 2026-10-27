import { levelMap } from './transforms.js';

/**
 * Cuánto dinero de `to` equivale a `amount` euros de `from`, según un índice de precios
 * (nivel) o una tasa anual de inflación. Devuelve null si falta alguno de los dos años.
 * Es un cálculo nuestro (*): usa la inflación media de la cesta, no la de cada persona.
 */
export function equivalentAmount(priceSeries, amount, from, to) {
  const levels = levelMap(priceSeries);
  const a = levels.get(from);
  const b = levels.get(to);
  if (a === undefined || b === undefined || a === 0) return null;
  const factor = b / a;
  return { value: amount * factor, factor, changePct: (factor - 1) * 100 };
}

/** Años en que el índice de precios tiene nivel (los que se pueden usar en la calculadora). */
export function priceYears(priceSeries) {
  return [...levelMap(priceSeries).keys()].sort((x, y) => x - y);
}
