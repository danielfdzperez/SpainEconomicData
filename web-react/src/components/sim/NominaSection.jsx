import { StarMark, Tip } from '../Help.jsx';
import { formatEuro, formatNumber, formatShare, formatValue, percentSuffix } from '../../core/format.js';
import { SUPUESTOS_AUTONOMO, SUPUESTOS_NOMINA, textosAutonomo, textosNomina } from '../../content/simTexts.js';
import { intlLocale, t, tx } from '../../i18n/index.js';
import { Big, StackBar } from './Blocks.jsx';
import { ChoiceField, NumberField, SelectField } from './Fields.jsx';
import { Escala, Fila, Grupo, Paso, Tabla, e2, neg, pctDe, tipoTxt } from './Tablas.jsx';

/** Cálculo del IRPF paso a paso, con las dos escalas tramo a tramo. */
function IrpfPasos({ nomina, textos }) {
  const i = nomina.trabajador.irpf;
  return (
    <details className="sim-details">
      <summary>{t('Cómo se calcula tu IRPF, paso a paso')}<StarMark /></summary>
      <ol className="steps">
        <Paso titulo={t('Sueldo bruto anual')} valor={e2(nomina.bruto.anual)} texto={textos.bruto} />
        <Paso titulo={t('Menos: cotizaciones a la Seguridad Social')} valor={neg(nomina.trabajador.ss.total)} texto={textos.ss} />
        <Paso titulo={t('Menos: otros gastos deducibles')} valor={neg(i.gastoDeducible)} texto={textos.gastos} />
        <Paso titulo={t('Rendimiento neto del trabajo')} valor={e2(i.rendimientoNeto)} texto={textos.rnt} total />
        <Paso titulo={t('Menos: reducción por rendimientos del trabajo')} valor={neg(i.reduccion)} texto={textos.reduccion} />
        <Paso titulo={t('Base liquidable')} valor={e2(i.baseLiquidable)} texto={textos.base_liquidable} total />
      </ol>
      <p className="steps__text">{textos.escala}</p>
      <Escala nombre={t('Escala del Estado')} parte={i.estatal} texto={textos.estatal} minimoTxt={textos.minimo(i.estatal.minimoPersonal, i.estatal.minimo)} />
      <Escala nombre={t('Escala de la Comunidad de Madrid')} parte={i.autonomica} texto={textos.autonomica} minimoTxt={textos.minimo(i.autonomica.minimoPersonal, i.autonomica.minimo)} />
      <ol className="steps">
        <Paso titulo={t('IRPF total')} valor={e2(i.total)} texto={`${textos.irpf} ${t('Estado {a} + Madrid {b}.', { a: e2(i.estatal.cuota), b: e2(i.autonomica.cuota) })}`} total />
        <Paso titulo={t('Tipo medio')} valor={formatShare(i.tipoMedio, 2)} texto={textos.tipoMedio} />
        <Paso titulo={t('Tipo marginal')} valor={formatShare(i.tipoMarginal, 1)} texto={textos.tipoMarginal} />
      </ol>
    </details>
  );
}

/** Desglose del IRPF de un autónomo. */
function IrpfPasosAutonomo({ aut, textos, textosN }) {
  const i = aut.irpf;
  return (
    <details className="sim-details">
      <summary>{t('Cómo se calcula tu IRPF, paso a paso')}<StarMark /></summary>
      <ol className="steps">
        <Paso titulo={t('Ingresos del año')} valor={e2(aut.ingresos.anual)} />
        <Paso titulo={t('Menos: gastos deducibles')} valor={neg(aut.gastos.anual)} />
        <Paso titulo={t('Menos: cuota de autónomos')} valor={neg(aut.cuota.total)} texto={t('La cuota es un gasto deducible de la actividad.')} />
        <Paso titulo={t('Rendimiento neto de la actividad')} valor={e2(i.rendimientoNeto)} texto={textos.rn} total />
        <Paso titulo={t('Menos: gastos de difícil justificación')} valor={neg(i.gastoDificil)} texto={textos.dificil} />
        <Paso titulo={t('Base liquidable')} valor={e2(i.baseLiquidable)} texto={textos.base_liquidable} total />
      </ol>
      <p className="steps__text">{textosN.escala}</p>
      <Escala nombre={t('Escala del Estado')} parte={i.estatal} texto={textosN.estatal} minimoTxt={textosN.minimo(i.estatal.minimoPersonal, i.estatal.minimo)} />
      <Escala nombre={t('Escala de la Comunidad de Madrid')} parte={i.autonomica} texto={textosN.autonomica} minimoTxt={textosN.minimo(i.autonomica.minimoPersonal, i.autonomica.minimo)} />
      <ol className="steps">
        <Paso titulo={t('IRPF total')} valor={e2(i.total)} texto={`${textosN.irpf} ${t('Estado {a} + Madrid {b}.', { a: e2(i.estatal.cuota), b: e2(i.autonomica.cuota) })}`} total />
        <Paso titulo={t('Tipo medio')} valor={formatShare(i.tipoMedio, 2)} texto={t('IRPF dividido entre tu rendimiento antes de cuota e IRPF.')} />
        <Paso titulo={t('Tipo marginal')} valor={formatShare(i.tipoMarginal, 1)} texto={textosN.tipoMarginal} />
      </ol>
    </details>
  );
}

/** Cómo se elige el tramo de cotización del autónomo. */
function TramoPasos({ aut, textos, params }) {
  const tr = aut.base.tramo;
  return (
    <details className="sim-details">
      <summary>{t('Cómo se elige tu tramo de cotización')}<StarMark /></summary>
      <ol className="steps">
        <Paso titulo={t('Rendimiento del año (ingresos − gastos)')} valor={e2(aut.bruto.anual)} texto={textos.rendimiento} />
        <Paso titulo={t('Menos: {x} de gastos genéricos, entre 12 meses', { x: `${formatNumber(params.autonomo.deduccionGastosGenericos, { decimals: 0 })}${percentSuffix()}` })} valor={t('{x} al mes', { x: e2(aut.base.rendimientoCotizacion) })} texto={textos.rendimientoCotizacion} total />
        <Paso titulo={t('Tramo {n} de la tabla {tabla}', { n: tr.tramo, tabla: tr.tabla })} valor={tr.hasta == null ? t('Más de {x}', { x: formatEuro(6000) }) : t('Hasta {x}', { x: e2(tr.hasta) })} texto={textos.tramo} />
        <Paso titulo={t('Base de cotización elegida (la mínima de tu tramo)')} valor={t('{x} al mes', { x: e2(aut.base.mensual) })} texto={`${textos.base} ${t('Podrías cotizar por una base de hasta {x} al mes.', { x: e2(tr.baseMaxima) })}`} />
        <Paso titulo={t('Cuota: {x} de la base', { x: formatShare(aut.cuota.tipoTotal, 1) })} valor={t('{x} al mes', { x: e2(aut.cuota.mensual) })} texto={textos.cuota} total />
      </ol>
    </details>
  );
}

/** Resultados y tablas de un asalariado. */
function ResultadosAsalariado({ sim, textos, params }) {
  const { nomina, extra } = sim;
  const topes = { tope: e2(params.nomina.ss.baseMaximaMensual) };
  const w = nomina.trabajador;
  const em = nomina.empresa;
  const bruto = nomina.bruto.anual;
  const partes = [
    { key: 'neto', label: t('Tu sueldo neto'), value: w.neto.anual, color: '--c-neto' },
    { key: 'irpf', label: t('IRPF'), value: w.irpf.total, color: '--c-irpf' },
    { key: 'ssw', label: t('Tu Seguridad Social'), value: w.ss.total, color: '--c-ss' },
    { key: 'sse', label: t('Seguridad Social de la empresa'), value: em.ss.total, color: '--c-ssemp' },
  ];
  return {
    out: (
      <>
        <div className="bigs">
          <Big value={formatEuro(w.neto.porPaga)} label={t('netos en cada una de tus {n} pagas', { n: nomina.entrada.pagas })}
            sub={t('{a} al año · {b} de tu bruto', { a: formatEuro(w.neto.anual), b: formatShare(w.neto.pctBruto) })} tone="neto" />
          <Big value={formatEuro(em.coste.mensual)} label={t('al mes le cuestas a tu empresa')}
            sub={t('{a} al año: tu bruto más {b} de su Seguridad Social', { a: formatEuro(em.coste.anual), b: formatEuro(em.ss.total) })} tone="coste" />
          <Big value={formatShare(nomina.reparto.pctAdministracionesSobreCoste)} label={t('de ese coste acaba en Hacienda y la Seguridad Social')}
            sub={t('{x} al año entre tus cotizaciones, el IRPF y las de tu empresa', { x: formatEuro(nomina.reparto.aLasAdministraciones) })} tone="admin" />
          <Big value={formatEuro(nomina.bruto.prorrateadoMensual)} label={t('al mes sin impuestos, sin descontar nada')}
            sub={t('{a} al año: tu bruto, sin IRPF ni tu Seguridad Social. Si tu empresa te pagara además lo que cotiza por ti: {b} al mes', { a: formatEuro(bruto), b: formatEuro(em.coste.mensual) })} />
        </div>
        <StackBar title={t('De cada {x} que cuestas a tu empresa…', { x: formatEuro(100) })} segments={partes}
          caption={t('Total: {x} al año. Lo que va al sector público es todo menos tu neto: IRPF, tu Seguridad Social y la de la empresa. No incluye el IVA que pagas al comprar.', { x: formatEuro(em.coste.anual) })} />
        <p className="sim-note">
          <strong>{t('Si te suben el sueldo:')}</strong> {tx('de cada {gross} brutos extra te quedan {net} netos y a tu empresa le cuestan {cost}.{star}', { gross: formatEuro(100), net: formatValue(extra.neto * 100, 'eur', { decimals: 1 }), cost: formatValue(extra.coste * 100, 'eur', { decimals: 1 }), star: <StarMark /> })}
        </p>
      </>
    ),
    tables: (
      <>
        <div className="sim-card">
          <h3>{t('Tu nómina, de arriba abajo')}<StarMark /></h3>
          <p className="sim-card__lead">{t('Mensual = anual ÷ 12 (las pagas extra, repartidas).')}</p>
          <Tabla caption={t('Desglose de la nómina del trabajador')}>
            <Fila cls="sim-table__sum" label={t('Sueldo bruto')} tip={<Tip title={t('Sueldo bruto')} short={textos.bruto} />} anual={e2(bruto)} mensual={e2(nomina.bruto.prorrateadoMensual)} pct={formatShare(100, 0)} />
            <Grupo>{t('Seguridad Social (tu parte, sobre una base de {x} al mes)', { x: e2(nomina.base.mensual) })}<Tip title={t('Base de cotización')} short={textos.base} /></Grupo>
            {w.ss.items.map((it) => (
              <Fila key={it.id} cls="sim-table__sub" label={t(it.label)} tip={<Tip title={t(it.label)} short={t(it.paraQueSirve, topes)} />}
                tipo={tipoTxt(it.tipo)} anual={neg(it.importe)} mensual={neg(it.importe / 12)} pct={pctDe(it.importe, bruto)} />
            ))}
            <Fila cls="sim-table__sum" label={t('Total Seguridad Social')} tipo={formatShare((w.ss.total / nomina.base.anual) * 100, 2)} anual={neg(w.ss.total)} mensual={neg(w.ss.total / 12)} pct={pctDe(w.ss.total, bruto)} />
            <Grupo>{t('IRPF (impuesto sobre la renta)')}</Grupo>
            <Fila cls="sim-table__sub" label={t('IRPF del Estado')} tip={<Tip title={t('IRPF del Estado')} short={textos.estatal} />} anual={neg(w.irpf.estatal.cuota)} mensual={neg(w.irpf.estatal.cuota / 12)} pct={pctDe(w.irpf.estatal.cuota, bruto)} />
            <Fila cls="sim-table__sub" label={t('IRPF de la Comunidad de Madrid')} tip={<Tip title={t('IRPF de Madrid')} short={textos.autonomica} />} anual={neg(w.irpf.autonomica.cuota)} mensual={neg(w.irpf.autonomica.cuota / 12)} pct={pctDe(w.irpf.autonomica.cuota, bruto)} />
            <Fila cls="sim-table__sum" label={t('Total IRPF')} tip={<Tip title={t('IRPF')} short={textos.irpf} />} tipo={t('{x} medio', { x: formatShare(w.irpf.tipoMedio, 2) })} anual={neg(w.irpf.total)} mensual={neg(w.irpf.total / 12)} pct={pctDe(w.irpf.total, bruto)} />
            <Fila cls="sim-table__total" label={t('Sueldo neto')} tip={<Tip title={t('Sueldo neto')} short={textos.neto} />} anual={e2(w.neto.anual)} mensual={e2(w.neto.mensual)} pct={pctDe(w.neto.anual, bruto)} />
          </Tabla>
          <IrpfPasos nomina={nomina} textos={textos} />
        </div>

        <div className="sim-card">
          <h3>{t('Lo que paga tu empresa por ti')}<StarMark /></h3>
          <p className="sim-card__lead">{t('Además de tu sueldo, la empresa paga su propia parte de la Seguridad Social.')}</p>
          <Tabla caption={t('Desglose del coste de la empresa')}>
            <Fila cls="sim-table__sum" label={t('Sueldo bruto')} anual={e2(bruto)} mensual={e2(nomina.bruto.prorrateadoMensual)} pct={formatShare(100, 0)} />
            <Grupo>{t('Seguridad Social (parte de la empresa, sobre la misma base)')}</Grupo>
            {em.ss.items.map((it) => (
              <Fila key={it.id} cls="sim-table__sub" label={t(it.label)} tip={<Tip title={t(it.label)} short={t(it.paraQueSirve, topes)} />}
                tipo={tipoTxt(it.tipo)} anual={e2(it.importe)} mensual={e2(it.importe / 12)} pct={pctDe(it.importe, bruto)} />
            ))}
            <Fila cls="sim-table__sum" label={t('Total Seguridad Social de la empresa')} tipo={formatShare(em.ss.tipoTotal, 2)} anual={e2(em.ss.total)} mensual={e2(em.ss.total / 12)} pct={pctDe(em.ss.total, bruto)} />
            <Fila cls="sim-table__total" label={t('Coste total para la empresa')} tip={<Tip title={t('Coste para la empresa')} short={textos.coste} />} anual={e2(em.coste.anual)} mensual={e2(em.coste.mensual)} pct={pctDe(em.coste.anual, bruto)} />
          </Tabla>
          <p className="sim-card__lead sim-card__lead--below">
            {tx('Lo que va al sector público por tu trabajo: {x} al año ({pct} de tu bruto){tip}.', {
              x: <strong>{e2(nomina.reparto.aLasAdministraciones)}</strong>, pct: formatShare(nomina.reparto.pctAdministracionesSobreBruto), tip: <Tip title={t('Lo que va al sector público')} short={textos.cargas} />,
            })}
          </p>
          {nomina.base.topada ? <p className="sim-flag">{t('Tu sueldo supera el tope de cotización ({x} al mes): por encima de ese importe sólo pagas la cotización de solidaridad.', { x: e2(nomina.base.maximaMensual) })}</p> : null}
          {nomina.base.subidaAMinima ? <p className="sim-flag">{t('Cotizas por la base mínima ({x} al mes), que es más que tu sueldo prorrateado.', { x: e2(nomina.base.minimaMensual) })}</p> : null}
        </div>
      </>
    ),
  };
}

/** Resultados y tablas de un autónomo. */
function ResultadosAutonomo({ sim, params, textos }) {
  const aut = sim.autonomo;
  const topes = {};
  const textosA = textosAutonomo(params.autonomo);
  const fact = aut.ingresos.anual;
  const tr = aut.base.tramo;
  const partes = [
    { key: 'neto', label: t('Lo que te queda a ti'), value: Math.max(0, aut.neto.anual), color: '--c-neto' },
    { key: 'irpf', label: 'IRPF', value: aut.irpf.total, color: '--c-irpf' },
    { key: 'cuota', label: t('Cuota de autónomos'), value: aut.cuota.total, color: '--c-ss' },
    { key: 'gastos', label: t('Gastos de tu actividad'), value: aut.gastos.anual, color: '--c-gastos' },
  ];
  const bruto = fact;
  return {
    out: (
      <>
        <div className="bigs">
          <Big value={formatEuro(aut.neto.mensual)} label={t('netos al mes de media')}
            sub={t('{a} al año · {b} de lo que queda tras los gastos', { a: formatEuro(aut.neto.anual), b: formatShare(aut.neto.pctBruto) })} tone="neto" />
          <Big value={formatEuro(aut.cuota.mensual)} label={t('de cuota de autónomos al mes')}
            sub={t('Tramo {n} de la tabla {tabla} · base de {x} al mes', { n: tr.tramo, tabla: tr.tabla, x: e2(aut.base.mensual) })} tone="coste" />
          <Big value={formatShare(aut.reparto.pctAdministracionesSobreBruto)} label={t('de lo que ganas va a Hacienda y la Seguridad Social')}
            sub={t('{x} al año entre la cuota y el IRPF', { x: formatEuro(aut.reparto.aLasAdministraciones) })} tone="admin" />
          <Big value={formatEuro(aut.bruto.prorrateadoMensual)} label={t('al mes sin impuestos, sin descontar nada')}
            sub={t('{x} al año: lo que queda tras tus gastos, antes de la cuota de autónomos y del IRPF', { x: formatEuro(aut.bruto.anual) })} />
        </div>
        <StackBar title={t('De cada {x} que facturas…', { x: formatEuro(100) })} segments={partes}
          caption={t('Total facturado: {x} al año. Lo que va al sector público es la cuota de autónomos y el IRPF. No incluye el IVA, que cobras y se lo das a Hacienda.', { x: formatEuro(fact) })} />
      </>
    ),
    tables: (
      <div className="sim-card">
        <h3>{t('Tus cuentas, de arriba abajo')}<StarMark /></h3>
        <p className="sim-card__lead">{t('Mensual = anual ÷ 12. El porcentaje es sobre lo que facturas.')}</p>
        <Tabla caption={t('Desglose de las cuentas del autónomo')} pctLabel={t('% de lo facturado')}>
          <Fila cls="sim-table__sum" label={t('Facturación')} tip={<Tip title={t('Facturación')} short={textosA.ingresos} />} anual={e2(fact)} mensual={e2(aut.ingresos.mensual)} pct={formatShare(100, 0)} />
          <Fila cls="sim-table__sub" label={t('Gastos deducibles')} tip={<Tip title={t('Gastos')} short={textosA.gastos} />} anual={neg(aut.gastos.anual)} mensual={neg(aut.gastos.mensual)} pct={pctDe(aut.gastos.anual, bruto)} />
          <Fila cls="sim-table__sum" label={t('Rendimiento antes de cuota e IRPF')} tip={<Tip title={t('Rendimiento')} short={textosA.rendimiento} />} anual={e2(aut.bruto.anual)} mensual={e2(aut.bruto.prorrateadoMensual)} pct={pctDe(aut.bruto.anual, bruto)} />
          <Grupo>{t('Cuota de autónomos ({pct} sobre una base de {x} al mes)', { pct: formatShare(aut.cuota.tipoTotal, 1), x: e2(aut.base.mensual) })}<Tip title={t('Base de cotización')} short={textosA.base} /></Grupo>
          {aut.cuota.items.map((it) => (
            <Fila key={it.id} cls="sim-table__sub" label={t(it.label)} tip={<Tip title={t(it.label)} short={t(it.paraQueSirve, topes)} />}
              tipo={tipoTxt(it.tipo)} anual={neg(it.importe)} mensual={neg(it.importe / 12)} pct={pctDe(it.importe, bruto)} />
          ))}
          <Fila cls="sim-table__sum" label={t('Total cuota de autónomos')} tip={<Tip title={t('Cuota de autónomos')} short={textosA.cuota} />} tipo={formatShare(aut.cuota.tipoTotal, 2)} anual={neg(aut.cuota.total)} mensual={neg(aut.cuota.mensual)} pct={pctDe(aut.cuota.total, bruto)} />
          <Grupo>{t('IRPF (impuesto sobre la renta)')}</Grupo>
          <Fila cls="sim-table__sub" label={t('IRPF del Estado')} tip={<Tip title={t('IRPF del Estado')} short={textos.estatal} />} anual={neg(aut.irpf.estatal.cuota)} mensual={neg(aut.irpf.estatal.cuota / 12)} pct={pctDe(aut.irpf.estatal.cuota, bruto)} />
          <Fila cls="sim-table__sub" label={t('IRPF de la Comunidad de Madrid')} tip={<Tip title={t('IRPF de Madrid')} short={textos.autonomica} />} anual={neg(aut.irpf.autonomica.cuota)} mensual={neg(aut.irpf.autonomica.cuota / 12)} pct={pctDe(aut.irpf.autonomica.cuota, bruto)} />
          <Fila cls="sim-table__sum" label={t('Total IRPF')} tip={<Tip title={t('IRPF')} short={textos.irpf} />} tipo={t('{x} medio', { x: formatShare(aut.irpf.tipoMedio, 2) })} anual={neg(aut.irpf.total)} mensual={neg(aut.irpf.total / 12)} pct={pctDe(aut.irpf.total, bruto)} />
          <Fila cls="sim-table__total" label={t('Lo que te queda')} tip={<Tip title={t('Neto')} short={textosA.neto} />} anual={e2(aut.neto.anual)} mensual={e2(aut.neto.mensual)} pct={pctDe(aut.neto.anual, bruto)} />
        </Tabla>
        <TramoPasos aut={aut} textos={textosA} params={params} />
        <IrpfPasosAutonomo aut={aut} textos={textosA} textosN={textos} />
        <p className="sim-card__lead sim-card__lead--below">
          {tx('Lo que va al sector público por tu trabajo: {x} al año ({pct} de tu rendimiento){tip}.', {
            x: <strong>{e2(aut.reparto.aLasAdministraciones)}</strong>, pct: formatShare(aut.reparto.pctAdministracionesSobreBruto), tip: <Tip title={t('Lo que va al sector público')} short={textosA.cargas} />,
          })}
        </p>
      </div>
    ),
  };
}

export function NominaSection({ form, set, params, sim, avisoDe }) {
  const textos = textosNomina(params.nomina);
  const autonomo = form.regimen === 'autonomo';
  const actividades = [...params.nomina.atEp].sort((a, b) => a.total - b.total || t(a.actividad).localeCompare(t(b.actividad), intlLocale()));
  const sinDatos = autonomo ? sim.autonomo.ingresos.anual <= 0 : sim.nomina.bruto.anual <= 0;
  const res = sinDatos ? null : (autonomo ? ResultadosAutonomo({ sim, params, textos }) : ResultadosAsalariado({ sim, textos, params }));
  const supuestos = autonomo ? SUPUESTOS_AUTONOMO : SUPUESTOS_NOMINA;

  return (
    <section className="sim-section" id="sueldo" aria-labelledby="h-sueldo">
      <header className="sim-section__head">
        <span className="sim-section__n" aria-hidden="true">1</span>
        <div>
          <h2 id="h-sueldo" tabIndex={-1}>{autonomo ? t('Tus ingresos y lo que te queda') : t('Tu sueldo y lo que cuesta a tu empresa')}</h2>
          <p>{autonomo
            ? t('Escribe lo que facturas y lo que gastas y calculamos al momento tu cuota de autónomos, tu IRPF y lo que te queda de verdad.')
            : t('Escribe tu sueldo bruto y calculamos al momento qué te llega, qué se queda Hacienda y la Seguridad Social, y cuánto paga de verdad tu empresa.')}</p>
        </div>
      </header>

      <div className="sim-grid">
        <form className="sim-card sim-form" onSubmit={(e) => e.preventDefault()} aria-label={t('Datos de tu sueldo o tu actividad')}>
          <ChoiceField legend={t('Cómo trabajas')} name="regimen" value={form.regimen} onChange={(v) => set('regimen', v)}
            options={[{ value: 'asalariado', label: t('Asalariado') }, { value: 'autonomo', label: t('Autónomo') }]} />
          {autonomo ? (
            <div className="sim-form__group">
              <NumberField label={t('Lo que facturas al mes')} unit="€" value={form.ingresosAut} onChange={(v) => set('ingresosAut', v)}
                hint={t('Sin IVA. Suponemos lo mismo todos los meses.')} warn={avisoDe('ingresosAut')} />
              <NumberField label={t('Gastos deducibles al mes')} unit="€" value={form.gastosAut} onChange={(v) => set('gastosAut', v)}
                hint={t('Alquiler, material, gestoría, suministros… sin contar la cuota de autónomos.')} warn={avisoDe('gastosAut')} />
              <p className="sim-form__note">{t('Cotizas por tus ingresos reales: con ellos elegimos tu tramo en la tabla de 2026 y suponemos la base mínima de ese tramo.')}</p>
            </div>
          ) : (
            <div className="sim-form__group">
              <NumberField label={t('Sueldo bruto de una paga')} unit="€" value={form.sueldo} onChange={(v) => set('sueldo', v)}
                hint={t('Lo que pone en tu contrato, antes de impuestos.')} warn={avisoDe('sueldo')} />
              <ChoiceField legend={t('Pagas al año')} name="pagas" value={form.pagas} onChange={(v) => set('pagas', v)}
                options={[{ value: 14, label: t('14 pagas') }, { value: 12, label: t('12 pagas') }]} />
              <ChoiceField legend={t('Contrato')} name="contrato" value={form.contrato} onChange={(v) => set('contrato', v)}
                options={[{ value: 'indefinido', label: t('Indefinido') }, { value: 'temporal', label: t('Temporal') }]} />
              <label className="check-label sim-form__check">
                <input type="checkbox" className="check" checked={form.jornadaCompleta} onChange={(e) => set('jornadaCompleta', e.target.checked)} />
                <span>{t('Jornada completa')}</span>
              </label>
              <SelectField label={t('Actividad de la empresa')} value={form.actividad} onChange={(v) => set('actividad', v)}
                hint={t('Decide el tipo de accidentes de trabajo que paga la empresa.')}>
                {actividades.map((a) => <option key={a.cnae} value={a.cnae}>{`${t(a.actividad)} · ${formatShare(a.total, 2)}`}</option>)}
              </SelectField>
            </div>
          )}
          <p className="sim-form__note">{t('Calculado para una persona soltera, sin hijos, que vive en la Comunidad de Madrid. Importes de 2026.')}</p>
        </form>

        <div className="sim-out">
          {res ? res.out : <p className="sim-empty">{autonomo ? t('Escribe lo que facturas al mes para ver el cálculo.') : t('Escribe un sueldo mayor que cero para ver el cálculo.')}</p>}
        </div>
      </div>

      {res ? <div className="sim-tables">{res.tables}</div> : null}

      <details className="sim-details sim-details--assumptions">
        <summary>{t('Qué suponemos en este cálculo')}</summary>
        <ul>{supuestos.map((text) => <li key={text}>{t(text)}</li>)}</ul>
      </details>
    </section>
  );
}
