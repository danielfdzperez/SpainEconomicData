import { StarMark, Tip } from '../Help.jsx';
import { formatEuro, formatInt, formatShare } from '../../core/format.js';
import { SUPUESTOS_COMPARATIVA } from '../../content/simTexts.js';
import { tx, t } from '../../i18n/index.js';
import { Big } from './Blocks.jsx';
import { ChoiceField } from './Fields.jsx';

const eur = (v) => formatEuro(v);
const menos = (v) => (v > 0 ? `− ${formatEuro(v)}` : formatEuro(0));

/** Apartado 5: qué te queda al año con impuestos y servicios públicos frente a sin impuestos y todo privado. */
export function ComparativaSection({ form, set, sim }) {
  const c = sim.comparativa;
  const listo = sim.economia.brutoAnual > 0 && sim.servicios.edad > 0;
  const edad = formatInt(sim.servicios.edad);
  const porBruto = form.comparaBase === 'bruto';
  const seguro = form.comparaSalud === 'seguro';

  let resultados = <p className="sim-empty">{t('Para ver la comparación hacen falta tu sueldo o tus ingresos (apartado 1) y tu edad (apartado 2).')}</p>;
  if (listo && c) {
    const dif = Math.abs(c.diferenciaAnual);
    const pctVal = c.pctDiferencia == null ? null : formatShare(Math.abs(c.pctDiferencia));
    const pctTxt = pctVal == null ? ''
      : c.mejorPrivada ? t(', un {p} más', { p: pctVal }) : t(', un {p} menos', { p: pctVal });
    const vals = { x: eur(dif), m: eur(dif / 12), pct: pctTxt };
    const veredicto = Math.round(dif) === 0
      ? t('En este ejercicio te quedaría prácticamente lo mismo.')
      : c.mejorPrivada
        ? t('En este ejercicio, con lo privado te quedarían {x} más al año ({m} al mes{pct}).', vals)
        : t('En este ejercicio, con lo privado te quedarían {x} menos al año ({m} al mes{pct}).', vals);
    const sinImpuestosTxt = porBruto ? t('tu sueldo bruto') : t('lo que cuestas a tu empresa');
    const cuotas = c.cuotas;
    resultados = (
      <>
        <div className="bigs bigs--four">
          <Big value={eur(c.sueldo.netoAnual)} tone="neto" label={t('al año con impuestos (tu neto)')}
            sub={t('{x} al mes. Lo que te llega tras IRPF y Seguridad Social', { x: eur(c.sueldo.netoMensual) })} />
          <Big value={eur(c.sueldo.sinImpuestosAnual)} tone="admin" label={t('al año sin impuestos')}
            sub={t('{x} al mes: {que}. Los impuestos y cotizaciones suman {imp} al año', { x: eur(c.sueldo.sinImpuestosMensual), que: sinImpuestosTxt, imp: eur(c.sueldo.impuestosAnual) })} />
          <Big value={eur(c.publica.quedaAnual)} tone="neto" label={t('te quedan al año con lo público')}
            sub={t('{x} al mes, tras pagar tú {y} al año de matrícula, abono…', { x: eur(c.publica.quedaMensual), y: eur(c.publica.gastoAnual) })} />
          <Big value={eur(c.privada.quedaAnual)} tone="coste" label={t('te quedan al año con lo privado')}
            sub={t('{x} al mes, tras pagar {y} al año de sanidad, colegio y transporte', { x: eur(c.privada.quedaMensual), y: eur(c.privada.gastoAnual) })} />
        </div>
        <p className="sim-note" role="status">
          <strong>{veredicto}</strong> {t('Pero de tus impuestos, {x} al año no van a estos tres servicios: hoy pagan pensiones, paro, justicia, defensa y el resto, y en este mundo imaginario tendrías que cubrirlo tú. Es un ejercicio con muchos recortes: lee abajo lo que no cuenta.', { x: eur(c.restoImpuestos) })}
        </p>

        <div className="sim-card">
          <h3 className="sim-card__title">{t('En un año, de arriba abajo')}<StarMark /></h3>
          <p className="sim-card__lead">{t('Lo que gastas en cada servicio es la media de toda tu vida ({edad} años): total ÷ {edad}.', { edad })}</p>
          <div className="sim-table-wrap">
            <table className="sim-table sim-table--compare">
              <caption className="sr-only">{t('Lo que te queda al año con impuestos y servicios públicos frente a sin impuestos y con todo privado')}</caption>
              <thead><tr><th scope="col">{t('Al año')}</th><th scope="col">{t('Con impuestos y servicios públicos')}</th><th scope="col">{t('Sin impuestos y todo privado')}</th></tr></thead>
              <tbody>
                <tr className="sim-table__sum">
                  <th scope="row"><span className="sim-table__label">{t('Tu sueldo')}<Tip title={t('Sueldo con y sin impuestos')} short={porBruto
                    ? t('Con impuestos es tu neto: lo que te llega tras el IRPF y tu Seguridad Social. Sin impuestos es tu bruto.')
                    : t('Con impuestos es tu neto: lo que te llega tras el IRPF y tu Seguridad Social. Sin impuestos es tu bruto más lo que cotiza tu empresa por ti (lo que de verdad cuestas).')} own /></span></th>
                  <td>{eur(c.sueldo.netoAnual)}</td><td>{eur(c.sueldo.sinImpuestosAnual)}</td>
                </tr>
                <tr className="sim-table__sub">
                  <th scope="row">{seguro ? t('Sanidad (seguro privado)') : t('Sanidad (pagando cada visita)')}</th>
                  <td>{formatEuro(0)} <small className="sim-sub">{t('la cubren tus impuestos')}</small></td><td>{menos(c.privada.gastos.salud)}</td>
                </tr>
                <tr className="sim-table__sub">
                  <th scope="row">{t('Educación')}</th>
                  <td>{menos(c.publica.pagos.educacion)}</td><td>{menos(c.privada.gastos.educacion)}</td>
                </tr>
                <tr className="sim-table__sub">
                  <th scope="row">{t('Transporte')}</th>
                  <td>{menos(c.publica.pagos.transporte)}</td><td>{menos(c.privada.gastos.transporte)}</td>
                </tr>
                <tr className="sim-table__total"><th scope="row">{t('Te queda al año')}</th><td>{eur(c.publica.quedaAnual)}</td><td>{eur(c.privada.quedaAnual)}</td></tr>
                <tr className="sim-table__sum"><th scope="row">{t('…al mes')}</th><td>{eur(c.publica.quedaMensual)}</td><td>{eur(c.privada.quedaMensual)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="sim-card">
          <h3 className="sim-card__title">{t('Si lo privado se pagara en cuotas mensuales')}<StarMark /></h3>
          <p className="sim-card__lead">{t('Media mensual de lo que pagarías tú en privado y su total a lo largo de {edad} años ({meses} meses). El seguro se paga mes a mes; el resto, repartido en doce cuotas.', { edad, meses: formatInt(c.meses) })}</p>
          <div className="sim-table-wrap">
            <table className="sim-table">
              <caption className="sr-only">{t('Pago mensual de los servicios privados y total en toda la vida')}</caption>
              <thead><tr><th scope="col">{t('Concepto')}</th><th scope="col">{t('Al mes')}</th><th scope="col">{t('En {edad} años', { edad })}</th></tr></thead>
              <tbody>
                <tr className="sim-table__sub">
                  <th scope="row">{form.seguroTipo === 'completo' ? t('Seguro de salud con parto (prima)') : t('Seguro de salud de entrada (prima y copagos)')}</th>
                  <td>{eur(cuotas.conSeguro.mensual.salud)}</td><td>{eur(cuotas.conSeguro.mensual.salud * c.meses)}</td>
                </tr>
                <tr className="sim-table__sub">
                  <th scope="row">{t('Sanidad pagando cada visita (alternativa al seguro)')}</th>
                  <td>{eur(cuotas.pagandoVisitas.mensual.salud)}</td><td>{eur(cuotas.pagandoVisitas.mensual.salud * c.meses)}</td>
                </tr>
                <tr className="sim-table__sub">
                  <th scope="row">{t('Educación privada')}</th>
                  <td>{eur(cuotas.conSeguro.mensual.educacion)}</td><td>{eur(cuotas.conSeguro.mensual.educacion * c.meses)}</td>
                </tr>
                <tr className="sim-table__sub">
                  <th scope="row">{t('Transporte sin ayudas')}</th>
                  <td>{eur(cuotas.conSeguro.mensual.transporte)}</td><td>{eur(cuotas.conSeguro.mensual.transporte * c.meses)}</td>
                </tr>
                <tr className="sim-table__total"><th scope="row">{t('Total con seguro de salud')}</th><td>{eur(cuotas.conSeguro.gastoMensual)}</td><td>{eur(cuotas.conSeguro.totalVida)}</td></tr>
                <tr className="sim-table__total"><th scope="row">{t('Total pagando cada visita')}</th><td>{eur(cuotas.pagandoVisitas.gastoMensual)}</td><td>{eur(cuotas.pagandoVisitas.totalVida)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="sim-note">{t('La prima del seguro es la de hoy aplicada a toda tu vida: en realidad sube con la edad. En la pública, lo mismo cuesta al sistema {x} en total.', { x: eur(sim.servicios.totales.costePublico) })}</p>
        </div>

        <div className="sim-card">
          <h3 className="sim-card__title">{t('Lo que dejarías de recibir')}<StarMark /></h3>
          <p className="sim-card__lead">
            {tx('Tus impuestos y cotizaciones suman {imp}. Sanidad, educación y transporte, tal como los has contado, le cuestan al sistema {serv} de media en tu vida. Quedan {resto} que pagan pensiones, paro, justicia, seguridad, defensa, carreteras y el resto del sector público: en un mundo sin impuestos tendrías que pagártelo tú o renunciar a ello.', {
              imp: <strong>{t('{x} al año', { x: eur(c.sueldo.impuestosAnual) })}</strong>,
              serv: <strong>{t('{x} al año', { x: eur(c.serviciosPublicoAnual) })}</strong>,
              resto: <strong>{t('{x} al año', { x: eur(c.restoImpuestos) })}</strong>,
            })}
          </p>
        </div>
      </>
    );
  }

  return (
    <section className="sim-section" id="privado" aria-labelledby="h-privado">
      <header className="sim-section__head">
        <span className="sim-section__n" aria-hidden="true">5</span>
        <div>
          <h2 id="h-privado" tabIndex={-1}>{t('Estado o privado: ¿qué te queda al año?')}</h2>
          <p>{t('Imagina que no pagaras impuestos ni cotizaciones, pero tuvieras que pagar tú la sanidad, la escuela y el transporte a precio privado. Comparamos lo que te quedaría al año en cada caso.')}</p>
        </div>
      </header>

      <form className="sim-card sim-questions sim-questions--short" onSubmit={(e) => e.preventDefault()} aria-label={t('Cómo comparar Estado y privado')}>
        <ChoiceField legend={t('¿Qué cuenta como sueldo sin impuestos?')} name="comparaBase" value={form.comparaBase} onChange={(v) => set('comparaBase', v)}
          options={[{ value: 'bruto', label: t('Mi sueldo bruto') }, { value: 'coste', label: t('Lo que cuesto a mi empresa') }]} />
        <ChoiceField legend={t('¿Cómo pagarías la sanidad privada?')} name="comparaSalud" value={form.comparaSalud} onChange={(v) => set('comparaSalud', v)}
          options={[{ value: 'seguro', label: t('Con un seguro de salud') }, { value: 'visitas', label: t('Pagando cada visita') }]} />
        <p className="sim-group__note">{t('Lo del seguro usa el tipo que elegiste en el apartado 2. «Lo que cuesto a mi empresa» suma al bruto la Seguridad Social que paga tu empresa por ti.')}</p>
      </form>

      <div className="sim-results">{resultados}</div>

      <details className="sim-details sim-details--assumptions">
        <summary>{t('Qué supone esta comparación')}</summary>
        <ul>{SUPUESTOS_COMPARATIVA.map((texto) => <li key={texto}>{t(texto)}</li>)}</ul>
      </details>
    </section>
  );
}
