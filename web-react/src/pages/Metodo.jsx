import { Fragment, useMemo } from 'react';
import { StarMark } from '../components/Help.jsx';
import { useRepo } from '../data/DataContext.jsx';
import { METODO_SIMULADOR_CALCS, METODO_SIMULADOR_LIMITES } from '../content/simTexts.js';
import { SIM_TABLES } from '../data/simParams.js';
import { GROWTH_BANDS, INFLATION_BANDS } from '../domain/interpret.js';
import { lit, t, tx } from '../i18n/index.js';

const CALCS = [
  [lit('Índice (año base = 100)'), lit('Cada valor se divide entre el del año base y se multiplica por 100. Con tasas anuales (IPC, PIB) se encadenan año a año.')],
  [lit('Variación anual y acumulada'), lit('Cada valor frente al del año anterior, o frente al del año base.')],
  [lit('Salario real'), lit('El salario de cada año dividido entre el índice de precios (IPC de España o de Madrid según el territorio) y expresado en euros del año base.')],
  [lit('Resúmenes de la «Lectura»'), lit('Variación total y ritmo medio anual (media geométrica) en el rango elegido.')],
  [lit('Etiquetas de interpretación'), lit('Los tramos de inflación y de crecimiento del PIB (alta, estable, contracción…) son criterio orientativo nuestro.')],
  [lit('Marcas de épocas'), lit('Gran Recesión, COVID y repunte de precios: selección nuestra para dar contexto, no es un dato.')],
  [lit('PIB nominal · crecimiento'), lit('Variación anual del PIB a precios corrientes, calculada por nosotros a partir de la serie en euros.')],
  [lit('Reparto del PIB por sectores'), lit('Cada cifra del INE (millones de euros) dividida entre el total de lo que se ve, entre el PIB o entre el valor añadido, y su variación nominal 2025/2024. Los importes son del INE; los porcentajes los calculamos nosotros.')],
  [lit('Calculadora de «¿Cuánto vale tu dinero?»'), lit('Aplica el IPC encadenado; es la inflación media, no la de cada hogar.')],
];

function BandsTable({ caption, bands }) {
  return (
    <div className="table-wrap">
      <table className="table table--text">
        <caption>{caption}</caption>
        <thead><tr><th>{t('Etiqueta')}</th><th>{t('Tramo (%)')}</th><th>{t('Qué significa')}</th></tr></thead>
        <tbody>
          {bands.map((b, i) => (
            <tr key={b.label}>
              <td>{t(b.label)}</td>
              <td>{i === 0 ? `< ${b.max}` : (Number.isFinite(b.max) ? t('≥ {a} y < {b}', { a: bands[i - 1].max, b: b.max }) : `≥ ${bands[i - 1].max}`)}</td>
              <td>{t(b.note)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Metodo() {
  const repo = useRepo();
  const sources = useMemo(() => {
    const seen = new Map();
    for (const m of repo.allMeta) {
      const fuente = m.fuente.replace(/, (código|code) .*$/, '');
      const key = `${m.group}|${fuente}`;
      if (!seen.has(key)) seen.set(key, { key, group: m.group, fuente, count: 0 });
      seen.get(key).count += 1;
    }
    return [...seen.values()];
  }, [repo]);
  const avisos = useMemo(() => [...new Set(repo.allMeta.map((m) => m.aviso).filter(Boolean))], [repo]);

  return (
    <>
      <section className="page-head">
        <div className="wrap prose">
          <h1>{t('Método y fuentes')}</h1>
          <p className="page-head__lead">{t('De dónde sale cada número y qué hemos calculado nosotros.')}</p>
        </div>
      </section>
      <div className="wrap prose">
        <h2>{t('El asterisco')}</h2>
        <p>{tx('Todo lo que lleva {star} es un cálculo o una estimación nuestra: no lo publica ningún organismo. Lo que no lleva asterisco son series de INE y Eurostat que mostramos tal cual. El asterisco aparece en nombres de series, ejes, lecturas, tablas y descargas.', { star: <StarMark /> })}</p>
        <h2>{t('Qué calculamos nosotros')}</h2>
        <dl className="dl">{CALCS.map(([title, d]) => <Fragment key={title}><dt>{t(title)}<StarMark /></dt><dd>{t(d)}</dd></Fragment>)}</dl>
        <h2>{t('Simulador: qué calcula')}<StarMark /></h2>
        <dl className="dl">{METODO_SIMULADOR_CALCS.map(([title, d]) => <Fragment key={title}><dt>{t(title)}<StarMark /></dt><dd>{t(d)}</dd></Fragment>)}</dl>
        <h3>{t('Limitaciones del simulador')}</h3>
        <ul>{METODO_SIMULADOR_LIMITES.map((text) => <li key={text}>{t(text)}</li>)}</ul>
        <p>{tx('Los parámetros salen de {n} tablas CSV copiadas tal cual de la carpeta de datos en {path}: {list}.', { n: SIM_TABLES.length, path: <code>public/data/sim/</code>, list: <small>{SIM_TABLES.join(', ')}</small> })}</p>
        <h2>{t('Tramos de interpretación')}</h2>
        <BandsTable caption={t('Inflación (% anual)')} bands={INFLATION_BANDS} />
        <BandsTable caption={t('Crecimiento real del PIB (% anual)')} bands={GROWTH_BANDS} />
        <h2>{t('Fuentes de cada serie')}</h2>
        <div className="table-wrap">
          <table className="table table--text">
            <thead><tr><th>{t('Grupo')}</th><th>{t('Fuente')}</th><th>{t('Series')}</th></tr></thead>
            <tbody>{sources.map((r) => <tr key={r.key}><td>{t(r.group)}</td><td>{r.fuente}</td><td>{r.count}</td></tr>)}</tbody>
          </table>
        </div>
        <h2>{t('Avisos de los datos')}</h2>
        <ul>{avisos.map((a) => <li key={a}>{a}</li>)}</ul>
        <h2>{t('Limitaciones')}</h2>
        <ul>
          <li>{t('Salario (media anual) e IPC (diciembre sobre diciembre) no cubren exactamente el mismo periodo.')}</li>
          <li>{t('Los salarios son brutos anuales por asalariado: no distinguen jornada completa ni parcial.')}</li>
          <li>{t('El SMI de 2004 a 2017 no está contrastado con el BOE (marcado en el catálogo).')}</li>
          <li>{t('PIB 2023–2025 provisional y con cambio de fuente respecto a años anteriores.')}</li>
          <li>{t('El reparto del PIB por sectores sólo cubre 2024 (provisional) y 2025 (avance), a precios corrientes y con el detalle que el INE publica para 2025 (22 ramas). Fuente: INE, Contabilidad Nacional Anual, tabla 69070.')}</li>
        </ul>
        <h2>{t('Reproducir los datos')}</h2>
        <p>{tx('Los datos de la web son cuatro CSV ({series}, {catalog}, {glossary} y {sectores}, este último copia literal del reparto del PIB por ramas), más tres con los textos en inglés ({catalogEn}, {glossaryEn} y {sectoresEn}), generados con {script} a partir de los Excel y CSV de la carpeta de datos. El script copia las series sin tocarlas; todos los cálculos se hacen en el navegador.', {
          series: <code>public/data/series.csv</code>, catalog: <code>catalog.csv</code>, glossary: <code>glossary.csv</code>, sectores: <code>pib_sectores.csv</code>,
          catalogEn: <code>catalog_en.csv</code>, glossaryEn: <code>glossary_en.csv</code>, sectoresEn: <code>pib_sectores_en.csv</code>, script: <code>tools/build_web_data.py</code>,
        })}</p>
      </div>
    </>
  );
}
