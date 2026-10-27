import { parseCsvObjects } from './csv.js';
import { Series } from '../domain/Series.js';
import { buildSimParams, SIM_TABLES } from './simParams.js';
import { buildSectorTree } from '../domain/sectores.js';
import { getLang, t } from '../i18n/index.js';

/** Campos de texto que el catálogo inglés (`catalog_en.csv`) sustituye. Los demás son claves o números. */
const CATALOG_TEXT = ['label', 'descripcion', 'lectura', 'fuente', 'nota_calculo', 'aviso'];

/**
 * Acceso a los datos. Recibe un `loader` (ruta → Promise<string>) para no depender
 * de `fetch` y poder probarlo en Node con ficheros locales.
 *
 * Los textos salen en el idioma actual (`getLang()`), o en el que fije `forLang()`: esa versión fijada
 * es una vista nueva del mismo repositorio, así que los componentes que dependen de `repo` (useMemo…)
 * se recalculan al cambiar de idioma. Las claves (`group`, `territorio`, `sexo`, `medida`…) se quedan en
 * español porque la lógica las compara; la interfaz las traduce con `t()`.
 */
export class DataRepository {
  /** @param {(path:string)=>Promise<string>} loader */
  constructor(loader, { basePath = 'data/' } = {}) {
    this.loader = loader;
    this.basePath = basePath;
    this._pinned = null;
    this._views = new Map();
    this._shared = {
      catalog: new Map(),       // id → meta en español
      catalogEn: new Map(),     // id → textos en inglés
      points: new Map(),
      glossary: { es: new Map(), en: new Map() },
      cache: { es: { meta: new Map(), series: new Map() }, en: { meta: new Map(), series: new Map() } },
      sectores: { es: null, en: null },
      sim: null,
    };
    this._loaded = false;
  }

  /** Idioma con el que responde este repositorio. */
  get lang() {
    return this._pinned ?? getLang();
  }

  /** Vista del repositorio fijada a un idioma (misma carga de datos, otra identidad). */
  forLang(lang) {
    if (!this._views.has(lang)) {
      const view = Object.create(this);
      view._pinned = lang;
      this._views.set(lang, view);
    }
    return this._views.get(lang);
  }

  async load() {
    if (this._loaded) return this;
    const s = this._shared;
    const optional = (f) => this.loader(this.basePath + f).catch(() => '');
    const [seriesCsv, catalogCsv, glossaryCsv, catalogEnCsv, glossaryEnCsv] = await Promise.all([
      ...['series.csv', 'catalog.csv', 'glossary.csv'].map((f) => this.loader(this.basePath + f)),
      optional('catalog_en.csv'), optional('glossary_en.csv'),
    ]);
    for (const row of parseCsvObjects(catalogCsv)) {
      s.catalog.set(row.id, {
        ...row,
        calculado: Number(row.calculado) || 0,
        primer_anio: Number(row.primer_anio),
        ultimo_anio: Number(row.ultimo_anio),
      });
    }
    for (const row of parseCsvObjects(catalogEnCsv)) s.catalogEn.set(row.id, row);
    for (const row of parseCsvObjects(seriesCsv)) {
      if (!s.points.has(row.id)) s.points.set(row.id, []);
      s.points.get(row.id).push({ year: Number(row.year), value: Number(row.value) });
    }
    for (const id of s.catalog.keys()) {
      if (!s.points.has(id)) throw new Error(`La serie «${id}» está en el catálogo pero no tiene datos`);
    }
    for (const row of parseCsvObjects(glossaryCsv)) s.glossary.es.set(row.id, row);
    for (const row of parseCsvObjects(glossaryEnCsv)) s.glossary.en.set(row.id, row);
    this._loaded = true;
    return this;
  }

  /**
   * Parámetros del simulador (nómina, sanidad, educación…). Se descargan la primera vez que se piden,
   * así el resto de la web no carga esos CSV. Si falla, la siguiente llamada vuelve a intentarlo.
   * Sus textos van en español y se traducen al pintarlos.
   * @returns {Promise<import('./simParams.js').SimParams>}
   */
  simParams() {
    const s = this._shared;
    if (!s.sim) {
      s.sim = Promise.all(SIM_TABLES.map((name) => this.loader(`${this.basePath}sim/${name}.csv`)))
        .then((texts) => buildSimParams(Object.fromEntries(SIM_TABLES.map((name, i) => [name, parseCsvObjects(texts[i])]))))
        .catch((error) => { s.sim = null; throw error; });
    }
    return s.sim;
  }

  /**
   * Reparto del PIB por ramas de actividad (`pib_sectores.csv`, con los nombres en inglés de `pib_sectores_en.csv`).
   * Se descarga la primera vez que se pide. Si falla, la siguiente llamada vuelve a intentarlo.
   * @returns {Promise<ReturnType<typeof buildSectorTree>>}
   */
  sectores() {
    const slot = this._shared.sectores;
    const lang = this.lang;
    if (!slot[lang]) {
      const names = lang === 'en' ? this.loader(`${this.basePath}pib_sectores_en.csv`).catch(() => '') : Promise.resolve('');
      slot[lang] = Promise.all([this.loader(`${this.basePath}pib_sectores.csv`), names])
        .then(([text, namesCsv]) => {
          const en = new Map(parseCsvObjects(namesCsv).map((r) => [r.rama_id, r]));
          const rows = parseCsvObjects(text).map((r) => {
            const o = en.get(r.rama_id);
            return o ? { ...r, rama: o.rama || r.rama, rama_corta: o.rama_corta || r.rama_corta } : r;
          });
          return buildSectorTree(rows);
        })
        .catch((error) => { slot[lang] = null; throw error; });
    }
    return slot[lang];
  }

  _meta(id, lang) {
    const c = this._shared.cache[lang].meta;
    if (!c.has(id)) {
      const base = this._shared.catalog.get(id);
      if (!base) return undefined;
      const over = lang === 'en' ? this._shared.catalogEn.get(id) : null;
      const meta = over ? { ...base } : base;
      if (over) for (const k of CATALOG_TEXT) if (over[k]) meta[k] = over[k];
      c.set(id, meta);
    }
    return c.get(id);
  }

  /** @returns {Series} */
  series(id) {
    const lang = this.lang;
    const cache = this._shared.cache[lang].series;
    if (!cache.has(id)) {
      const meta = this._meta(id, lang);
      if (!meta) throw new Error(`Serie desconocida: ${id}`);
      cache.set(id, new Series({
        id, label: meta.label, unit: meta.unit, kind: meta.kind, points: this._shared.points.get(id), meta,
        calc: meta.calculado ? [meta.nota_calculo || t('Cálculo nuestro')] : [],
        semantics: meta.kind === 'rate' ? 'annual_change' : 'level',
      }));
    }
    return cache.get(id);
  }

  hasSeries(id) {
    return this._shared.catalog.has(id);
  }

  meta(id) {
    return this._meta(id, this.lang);
  }

  glossary(id) {
    const lang = this.lang;
    return (lang === 'en' ? this._shared.glossary.en.get(id) : null) ?? this._shared.glossary.es.get(id);
  }

  get allMeta() {
    const lang = this.lang;
    return [...this._shared.catalog.keys()].map((id) => this._meta(id, lang));
  }

  /** Series agrupadas por `group` (clave en español), conservando el orden del catálogo. */
  groups() {
    const out = new Map();
    for (const m of this.allMeta) {
      if (!out.has(m.group)) out.set(m.group, []);
      out.get(m.group).push(m);
    }
    return out;
  }
}
