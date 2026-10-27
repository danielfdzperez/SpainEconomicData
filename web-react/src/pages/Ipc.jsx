import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RateExplorer } from '../components/RateExplorer.jsx';
import { StarMark, Term } from '../components/Help.jsx';
import { presetById } from '../content/presets.js';
import { formatPct, formatShare, formatValue } from '../core/format.js';
import { useRepo } from '../data/DataContext.jsx';
import { equivalentAmount, priceYears } from '../domain/inflation.js';
import { INFLATION_BANDS, inflationReading } from '../domain/interpret.js';
import { lit, t, tx } from '../i18n/index.js';
import { encodeState } from '../state/urlState.js';

const CHOICES = [{ id: 'ipc_es', label: lit('IPC · España') }, { id: 'ipc_mad', label: lit('IPC · Madrid') }];
const read = (y, v) => inflationReading(y, v);

function Calculator() {
  const repo = useRepo();
  const price = repo.series('ipc_es');
  const years = useMemo(() => priceYears(price), [price]);
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState(2008);
  const [to, setTo] = useState(years.at(-1));
  const a = Number(amount);
  const r = amount !== '' && Number.isFinite(a) ? equivalentAmount(price, a, from, to) : null;
  const vals = r && {
    amount: <strong>{formatValue(a, 'eur')}</strong>, from, value: <strong className="calc__big">{formatValue(r.value, 'eur')}</strong>, to, star: <StarMark />,
    x: formatShare(Math.abs(r.changePct), 1), pct: formatPct(r.changePct),
  };

  return (
    <form className="calc" onSubmit={(e) => e.preventDefault()}>
      <label className="field"><span className="field__label">{t('Cantidad (€)')}</span>
        <input className="input" type="number" min="0" step="any" inputMode="decimal" aria-label={t('Cantidad en euros')} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
      <label className="field"><span className="field__label">{t('Del año')}</span>
        <select className="select" aria-label={t('Año de origen')} value={from} onChange={(e) => setFrom(Number(e.target.value))}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
      <label className="field"><span className="field__label">{t('Al año¦hasta el año')}</span>
        <select className="select" aria-label={t('Año de destino')} value={to} onChange={(e) => setTo(Number(e.target.value))}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
      <p className="calc__out" aria-live="polite">
        {r ? (
          to >= from
            ? tx('{amount} de {from} equivalen a {value} de {to}{star}. Los precios han subido un {x} en ese periodo (IPC de España, {pct} acumulado).', vals)
            : tx('{amount} de {from} equivalen a {value} de {to}{star}. Los precios han bajado un {x} en ese periodo (IPC de España, {pct} acumulado).', vals)
        ) : t('Indica una cantidad y dos años.')}
      </p>
    </form>
  );
}

export default function Ipc() {
  const core = presetById('core');
  return (
    <>
      <section className="page-head">
        <div className="wrap prose">
          <h1>{t('Qué es el IPC y cómo leerlo')}</h1>
          <p className="page-head__lead">{tx('El {ipc} mide cuánto cambia, de media, el precio de lo que compran los hogares españoles. Es el termómetro con el que se mide la {inflacion}.', {
            ipc: <Term id="ipc_dicdic">{t('Índice de Precios de Consumo')}</Term>, inflacion: <Term id="inflacion">{t('inflación')}</Term>,
          })}</p>
        </div>
      </section>
      <div className="wrap prose">
        <h2>{t('Cómo funciona')}</h2>
        <p>{t('El INE fija una cesta con miles de productos y servicios (comida, alquiler, luz, transporte, ocio…), la pondera según lo que gasta una familia típica y mira cuánto cuesta cada mes. El IPC es la variación de ese coste respecto al mismo momento de un año antes.')}</p>
        <p>{t('Un IPC del 3 % no significa que todo cueste un 3 % más: significa que la cesta media cuesta un 3 % más. Lo que tú compras puede haber subido mucho más (o menos).')}</p>
        <h2>{t('Cómo leerlo, año a año')}</h2>
        <p>{t('Elige un año y mira qué dice. Los colores y las etiquetas son nuestra lectura orientativa. Cambia entre «Lectura» y «Número» para ver lo mismo de las dos formas.')}</p>
        <RateExplorer choices={CHOICES.map((c) => ({ ...c, label: t(c.label) }))} read={read} bands={INFLATION_BANDS} />
        <h2>{t('¿Cuánto vale tu dinero?')}</h2>
        <p>{t('Cuánto dinero de otro año equivale a una cantidad de hoy, usando el IPC de España encadenado año a año.')}</p>
        <Calculator />
        <h2>{t('Matices que conviene saber')}</h2>
        <ul>
          <li>{tx('Este IPC es el de {dec}: compara el último mes del año con el de un año antes. El salario es una media de todo el año, así que cruzarlos es una aproximación (la misma que usa nuestro Excel).', { dec: <strong>{t('diciembre sobre diciembre')}</strong> })}</li>
          <li>{tx('El {ipca} es el IPC armonizado europeo; aquí se usa para ver los grupos (alimentos, vivienda, transporte…) y su media anual difiere del IPC nacional.', { ipca: <Term id="ipca">{t('IPCA')}</Term> })}</li>
          <li>{t('La inflación acumulada no se suma: se encadena. Dos años al 10 % son un 21 %, no un 20 %.')}</li>
          <li>{t('Los precios de la cesta de Madrid no tienen por qué coincidir con los de España; por eso hay un IPC por territorio.')}</li>
        </ul>
        <p className="prose__cta"><Link className="btn btn--primary" to={{ pathname: '/explorador', search: `?${encodeState(core.state)}` }}>{t('Ver el IPC frente a un salario')}</Link></p>
      </div>
    </>
  );
}
