/**
 * Serie temporal anual inmutable.
 *
 * - `kind`: 'level' (nivel: euros, índice...) o 'rate' (tasa anual en %).
 * - `calc`: lista de cálculos nuestros aplicados (vacía = dato tal cual de la fuente).
 * - `semantics`: qué representa el valor mostrado: 'level' | 'annual_change' | 'cumulative_change' | 'index'.
 */
export class Series {
  /**
   * @param {object} spec
   * @param {string} spec.id
   * @param {string} spec.label
   * @param {string} spec.unit
   * @param {'level'|'rate'} spec.kind
   * @param {Array<{year:number,value:number}>} spec.points
   * @param {object} [spec.meta]  metadatos del catálogo
   * @param {string[]} [spec.calc]
   * @param {string} [spec.semantics]
   * @param {boolean} [spec.real]  true si es un salario deflactado
   */
  constructor({ id, label, unit, kind, points, meta = {}, calc = [], semantics = 'level', real = false }) {
    this.id = id;
    this.label = label;
    this.unit = unit;
    this.kind = kind;
    this.meta = meta;
    this.calc = Object.freeze([...calc]);
    this.semantics = semantics;
    this.real = real;
    this.points = Object.freeze([...points].sort((a, b) => a.year - b.year));
    this._byYear = new Map(this.points.map((p) => [p.year, p.value]));
    Object.freeze(this);
  }

  /** @returns {number|undefined} */
  get(year) {
    return this._byYear.get(year);
  }

  has(year) {
    return this._byYear.has(year);
  }

  get years() {
    return this.points.map((p) => p.year);
  }

  get firstYear() {
    return this.points.length ? this.points[0].year : NaN;
  }

  get lastYear() {
    return this.points.length ? this.points[this.points.length - 1].year : NaN;
  }

  /** Dato oficial = sin ningún cálculo nuestro encima. */
  get isOfficial() {
    return this.calc.length === 0 && !Number(this.meta.calculado);
  }

  /** Nombre con asterisco si es cálculo o estimación nuestra. */
  get displayLabel() {
    return this.isOfficial ? this.label : `${this.label}*`;
  }

  /** Copia con puntos/propiedades distintas. */
  derive(changes) {
    return new Series({
      id: this.id, label: this.label, unit: this.unit, kind: this.kind, points: this.points,
      meta: this.meta, calc: this.calc, semantics: this.semantics, real: this.real, ...changes,
    });
  }

  /** Recorta al rango [from, to] (ambos incluidos). */
  slice(from, to) {
    return this.derive({ points: this.points.filter((p) => p.year >= from && p.year <= to) });
  }
}
