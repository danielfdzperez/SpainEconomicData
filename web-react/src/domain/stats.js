/** Estadísticos de resumen de una Series en un rango. Todos son cálculos nuestros. */
export function summarize(series, from, to) {
  const pts = series.points.filter((p) => p.year >= from && p.year <= to);
  if (!pts.length) return null;
  const first = pts[0];
  const last = pts[pts.length - 1];
  let max = pts[0];
  let min = pts[0];
  for (const p of pts) {
    if (p.value > max.value) max = p;
    if (p.value < min.value) min = p;
  }
  const years = last.year - first.year;
  const ratio = first.value > 0 && last.value > 0 ? last.value / first.value : null;
  return {
    first, last, max, min, count: pts.length,
    absChange: last.value - first.value,
    pctChange: ratio === null ? null : (ratio - 1) * 100,
    cagr: ratio !== null && years > 0 ? (Math.pow(ratio, 1 / years) - 1) * 100 : null,
    mean: pts.reduce((a, p) => a + p.value, 0) / pts.length,
  };
}

/** Tasa compuesta de una serie de tasas anuales (%): lo que sube en total y por año. */
export function compoundRates(series, from, to) {
  const pts = series.points.filter((p) => p.year >= from && p.year <= to);
  if (!pts.length) return null;
  const factor = pts.reduce((a, p) => a * (1 + p.value / 100), 1);
  return {
    years: pts.length,
    totalPct: (factor - 1) * 100,
    perYearPct: (Math.pow(factor, 1 / pts.length) - 1) * 100,
  };
}
