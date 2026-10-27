import { Link } from 'react-router-dom';
import { RateExplorer } from '../components/RateExplorer.jsx';
import { SectoresPib } from '../components/SectoresPib.jsx';
import { StarMark, Term } from '../components/Help.jsx';
import { Workbench } from '../components/Workbench.jsx';
import { presetById } from '../content/presets.js';
import { formatPct } from '../core/format.js';
import { useRepo } from '../data/DataContext.jsx';
import { GROWTH_BANDS, growthReading } from '../domain/interpret.js';
import { lit, t, tx } from '../i18n/index.js';
import { encodeState } from '../state/urlState.js';

const PIB_PRESETS = [
  { id: 'pib-nivel', title: lit('PIB en euros de cada año'), blurb: lit('El valor de lo producido, a precios de cada año.'),
    state: { selected: ['pib_nominal'], mode: 'raw', base: null, from: null, to: null, context: true } },
  { id: 'pib-tasas', title: lit('PIB nominal frente a real'), blurb: lit('La diferencia entre las dos líneas es la subida de precios.'),
    state: { selected: ['pib_nominal_g', 'pib_real_g', 'ipc_es'], mode: 'yoy', base: null, from: null, to: null, context: true } },
];
const CHOICES = [{ id: 'pib_real_g', label: lit('PIB real · crecimiento anual') }];
const read = (y, v) => growthReading(y, v);

export default function Pib() {
  const repo = useRepo();
  const negatives = repo.series('pib_real_g').points.filter((p) => p.value < 0)
    .map((p) => `${p.year} (${formatPct(p.value, 1)})`);
  const vsWages = presetById('pib');
  return (
    <>
      <section className="page-head">
        <div className="wrap prose">
          <h1>{t('Qué es el PIB y cómo leerlo')}</h1>
          <p className="page-head__lead">{tx('El {pib} es el valor de todos los bienes y servicios finales que se producen en España en un año. Es la medida más usada del tamaño de una economía.', { pib: <Term id="pib_nominal">{t('Producto Interior Bruto')}</Term> })}</p>
        </div>
      </section>
      <div className="wrap prose">
        <h2>{t('Dos PIB distintos')}</h2>
        <p>{tx('El {nominal} se mide en euros de cada año: si suben los precios, sube aunque no se produzca más. El {real} descuenta esa subida de precios y mide cuánto más (o menos) se produce de verdad. Para saber si la economía crece, mira el real.', {
          nominal: <Term id="pib_nominal">{t('PIB nominal')}</Term>, real: <Term id="pib_real">{t('PIB real')}</Term>,
        })}</p>
        <div className="bench-host"><Workbench initial={PIB_PRESETS[0].state} variant="compact" presets={PIB_PRESETS} /></div>
        <h2>{t('De qué está hecho el PIB: el reparto por sectores')}</h2>
        <p>{tx('Cada rama de la economía aporta una parte del PIB. Aquí ves el reparto de 2025 y 2024 en un «queso»: pulsa una porción para abrirla, por ejemplo {a} y después {b}. Los colores sólo distinguen las partes de cada nivel.', {
          a: <em>{t('Servicios')}</em>, b: <em>{t('Administración pública, educación y sanidad')}</em>,
        })}</p>
        <SectoresPib />
        <h2>{t('Cómo leer el crecimiento, año a año')}</h2>
        <p>{t('Elige un año para ver qué dice. Las etiquetas (contracción, crecimiento moderado…) son nuestra lectura orientativa.')}</p>
        <RateExplorer choices={CHOICES.map((c) => ({ ...c, label: t(c.label) }))} read={read} bands={GROWTH_BANDS} />
        <h2>{t('Qué dice y qué no dice')}</h2>
        <ul>
          <li>{t('Crecer no es repartir: el PIB suma todo lo producido, no dice quién se lo queda. Por eso conviene mirarlo junto a los salarios.')}</li>
          <li>{tx('Una {term} técnica se define con dos trimestres seguidos de caída. Aquí hay datos anuales, así que sólo vemos los años con caída: {list}{star}.', {
            term: <Term id="recesion">{t('recesión')}</Term>, list: negatives.length ? negatives.join(', ') : t('ninguno'), star: <StarMark />,
          })}</li>
          <li>{t('Tras una caída fuerte, el rebote parece espectacular pero sólo recupera lo perdido: un −10 % necesita un +11 % para volver al punto de partida.')}</li>
          <li>{tx('El reparto por sectores mide cuánto {va} produce cada rama, no cuánta gente emplea ni cuánto cobra. El peso de una rama en el PIB y en el empleo son cosas distintas.', { va: <em>{t('valor añadido')}</em> })}</li>
          <li>{t('No cuenta bien el trabajo no remunerado (cuidados) ni mide el medio ambiente o el bienestar.')}</li>
          <li>{t('Las cifras de 2023–2025 son provisionales o avance y se revisarán. Hay una pequeña discontinuidad entre 2022 y 2023 por el cambio de fuente (Eurostat → INE).')}</li>
        </ul>
        <p className="prose__cta"><Link className="btn btn--primary" to={{ pathname: '/explorador', search: `?${encodeState(vsWages.state)}` }}>{t('Ver el PIB frente a salarios y precios')}</Link></p>
      </div>
    </>
  );
}
