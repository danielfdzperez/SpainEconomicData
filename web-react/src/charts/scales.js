/** Escalas y ticks. Funciones puras, sin DOM. */

/** @returns {(v:number)=>number} */
export function linear([d0, d1], [r0, r1]) {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const f = (v) => r0 + (v - d0) * k;
  f.invert = (px) => (k === 0 ? d0 : d0 + (px - r0) / k);
  return f;
}

function niceNumber(x, round) {
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  let nf;
  if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * 10 ** exp;
}

/**
 * Dominio «bonito» y ticks para [min, max].
 * @returns {{min:number, max:number, step:number, ticks:number[]}}
 */
export function niceScale(min, max, target = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, step: 0.25, ticks: [0, 0.25, 0.5, 0.75, 1] };
  if (min === max) { const d = Math.abs(min) * 0.1 || 1; min -= d; max += d; }
  const range = niceNumber(max - min, false);
  const step = niceNumber(range / (target - 1), true);
  const nmin = Math.floor(min / step) * step;
  const nmax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = nmin; v <= nmax + step / 2; v += step) ticks.push(Math.abs(v) < step / 1e6 ? 0 : +v.toFixed(10));
  return { min: nmin, max: nmax, step, ticks };
}

/** Años a rotular en el eje X según el ancho disponible. */
export function yearTicks(from, to, width, minGap = 52) {
  const span = to - from;
  if (span <= 0) return [from];
  const maxLabels = Math.max(2, Math.floor(width / minGap));
  const steps = [1, 2, 5, 10, 20, 25, 50];
  const step = steps.find((s) => span / s + 1 <= maxLabels) ?? 50;
  const first = Math.ceil(from / step) * step;
  const ticks = [];
  for (let y = first; y <= to; y += step) ticks.push(y);
  if (!ticks.length) ticks.push(from);
  return ticks;
}

/** Evita que las etiquetas se solapen: desplaza en vertical manteniendo el orden. */
export function spreadLabels(items, minGap, top, bottom) {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].y - sorted[i - 1].y < minGap) sorted[i].y = sorted[i - 1].y + minGap;
  }
  const overflow = sorted.length ? sorted[sorted.length - 1].y - bottom : 0;
  if (overflow > 0) {
    sorted[sorted.length - 1].y = bottom;
    for (let i = sorted.length - 2; i >= 0; i--) {
      if (sorted[i + 1].y - sorted[i].y < minGap) sorted[i].y = sorted[i + 1].y - minGap;
    }
  }
  for (const s of sorted) s.y = Math.max(top, s.y);
  return sorted;
}
