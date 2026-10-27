import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Term, StarMark } from '../components/Help.jsx';
import { Workbench } from '../components/Workbench.jsx';
import { presetById, PRESETS } from '../content/presets.js';
import { formatShare } from '../core/format.js';
import { useRepo } from '../data/DataContext.jsx';
import { buildView } from '../domain/pipeline.js';
import { t, tx } from '../i18n/index.js';
import { encodeState } from '../state/urlState.js';

/** Frase de cabecera calculada con los datos del gráfico «core» (cálculo nuestro). */
export function headlineFact(repo, preset) {
  const view = buildView(repo, preset.state);
  const nominal = view.series.find((s) => s.id === 'sal_mediana_es_t');
  if (!nominal) return null;
  const year = nominal.lastYear;
  const at = (id) => view.series.find((s) => s.id === id)?.get(year);
  const prices = at('ipc_es');
  const real = at('sal_mediana_es_t~real');
  const nom = nominal.get(year);
  if (prices === undefined || real === undefined) return null;
  const x = (v) => formatShare(Math.abs(v - 100), 1);
  const wage = nom >= 100 ? t('el sueldo mediano subió un {x} en euros', { x: x(nom) }) : t('el sueldo mediano bajó un {x} en euros', { x: x(nom) });
  const cpi = prices >= 100 ? t('los precios subieron un {x}', { x: x(prices) }) : t('los precios bajaron un {x}', { x: x(prices) });
  const power = real >= 100 ? t('ganó un {x} de poder de compra', { x: x(real) }) : t('perdió un {x} de poder de compra', { x: x(real) });
  return t('Entre {base} y {year}, {wage} y {cpi}. Descontada la inflación, {power}.', { base: view.base, year, wage, cpi, power });
}

export default function Home() {
  const repo = useRepo();
  const preset = presetById('core');
  const fact = useMemo(() => headlineFact(repo, preset), [repo, preset]);
  return (
    <>
      <section className="hero">
        <div className="wrap hero__in">
          <h1 className="hero__title">{t('¿Ganó tu sueldo a los precios?')}</h1>
          <p className="hero__lead">{t('Salarios del INE, IPC y PIB de España en el mismo gráfico. Pasa el ratón por cualquier término subrayado para ver qué mide.')}</p>
          {fact ? <p className="hero__fact">{fact}<StarMark /></p> : null}
        </div>
      </section>
      <section className="wrap home__main">
        <div className="home__bench"><Workbench initial={preset.state} variant="compact" presets={PRESETS} /></div>
        <p className="home__actions">
          <Link className="btn btn--primary" to={{ pathname: '/explorador', search: `?${encodeState(preset.state)}` }}>{t('Abrir en el explorador y cambiar los datos')}</Link>
        </p>
      </section>
      <section className="wrap home__guides">
        <h2>{t('Para entender lo que ves')}</h2>
        <ul className="guides">
          <li><Link to="/simulador">{t('Simulador: tu sueldo y los servicios que usas')}</Link><p>{t('Escribe tu sueldo bruto y mira qué se lleva cada parte, cuánto paga tu empresa por ti y cuánto cuesta lo que has usado de sanidad, escuela y transporte, en lo público y en lo privado.')}</p></li>
          <li><Link to="/ipc">{tx('Qué es el {term} y cómo leerlo', { term: <Term id="ipc_dicdic">{t('IPC')}</Term> })}</Link><p>{t('Por qué el 3 % de inflación no significa que todo cueste un 3 % más, y qué dicen los datos año a año.')}</p></li>
          <li><Link to="/pib">{tx('Qué es el {term} y cómo leerlo', { term: <Term id="pib_nominal">{t('PIB')}</Term> })}</Link><p>{t('Qué mide, qué no mide y por qué hay que mirar el PIB real y no el de los precios corrientes.')}</p></li>
          <li><Link to="/explorador">{t('Explorador libre')}</Link><p>{t('Combina cualquier serie (hasta 8) con el mismo tipo de medida, elige años y comparte el gráfico con un enlace.')}</p></li>
        </ul>
      </section>
    </>
  );
}
