import { StarMark } from '../Help.jsx';
import { formatEuro, formatInt, formatNumber, formatShare, percentSuffix } from '../../core/format.js';
import { textosParo } from '../../content/simTexts.js';
import { t } from '../../i18n/index.js';
import { Big, KeyList, ScaleBars } from './Blocks.jsx';
import { Paso, e2 } from './Tablas.jsx';

const anios = (n) => `${formatNumber(n, { decimals: Number.isInteger(n) ? 0 : 2 })} ${n === 1 ? t('año') : t('años')}`;
const meses = (n) => `${formatInt(n)} ${n === 1 ? t('mes') : t('meses')}`;
const may = (s) => `${s[0].toUpperCase()}${s.slice(1)}`;
/** Porcentaje entero de los parámetros: «70 %» / «70%». */
const pc = (v) => `${v}${percentSuffix()}`;

function topeTxt(tope, maximo, minimo) {
  if (tope === 'max') return ` ${t('(con el tope máximo de {x})', { x: e2(maximo) })}`;
  if (tope === 'min') return ` ${t('(con el mínimo de {x})', { x: e2(minimo) })}`;
  return '';
}

/** Tabla de duración con la fila alcanzada resaltada. */
function TablaDuracion({ pa, params }) {
  const cese = pa.regimen === 'cese';
  const filas = cese
    ? params.autonomo.cese.duracion.map((d) => ({ desde: d.desde, hasta: d.hasta, meses: d.meses, valor: pa.prestacion.mesesCotizados }))
    : params.paro.duracion.map((d) => ({ desde: d.desdeDias, hasta: d.hastaDias, meses: d.meses, valor: pa.prestacion.diasCotizados }));
  const etiqueta = (d) => (d.hasta == null ? t('{n} o más', { n: formatInt(d.desde) }) : t('De {a} a {b}', { a: formatInt(d.desde), b: formatInt(d.hasta) }));
  return (
    <details className="sim-details">
      <summary>{cese ? t('Tabla de duración del cese de actividad') : t('Tabla de duración del paro')}</summary>
      <div className="sim-table-wrap">
        <table className="sim-table sim-table--small">
          <caption className="sr-only">{cese ? t('Meses de prestación según los meses cotizados') : t('Meses de prestación según los días cotizados')}</caption>
          <thead><tr><th scope="col">{cese ? t('Meses cotizados') : t('Días cotizados')}</th><th scope="col">{t('Meses de prestación')}</th></tr></thead>
          <tbody>
            {filas.map((d) => {
              const alcanzada = d.valor >= d.desde && (d.hasta == null || d.valor <= d.hasta + 0.999);
              return <tr key={d.desde} className={alcanzada ? 'sim-table__hl' : ''}><th scope="row">{etiqueta(d)}</th><td>{meses(d.meses)}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

const SUPUESTOS_PARO = (textos) => [
  textos.bruto,
  t('Suponemos que dejas el trabajo por una causa que da derecho a la prestación (por ejemplo, un despido). Si te vas por voluntad propia no hay paro.'),
  t('Sin hijos a cargo, sin subsidios (cuando se acaba el paro o no hay cotización suficiente) y sin indemnización ni finiquito.'),
  t('Un año son 360 días (meses de 30 días). Las cotizaciones que ya sirvieron para cobrar un paro no valen para el siguiente, aunque no se agotara.'),
  t('Como autónomo: cese de actividad con el 70 % de la base de los últimos 12 meses, 12 meses seguidos cotizados como mínimo y los mismos mínimo y máximo.'),
];

/** Pasos del cálculo de la prestación que te tocaría hoy. */
function Pasos({ pa, params, textos }) {
  const pr = pa.prestacion;
  const cese = pa.regimen === 'cese';
  const ultimo = pa.ultimo;
  const { maximo, minimo } = params.paro;
  const alMes = (x) => t('{x} al mes', { x: e2(x) });
  return (
    <ol className="steps">
      <Paso titulo={t('Tu último trabajo')}
        valor={ultimo.tipo === 'autonomo' ? t('{x} al mes', { x: formatEuro(ultimo.ingresosMensuales) }) : `${formatEuro(ultimo.brutoMensual)} × ${ultimo.pagas}`}
        texto={ultimo.tipo === 'autonomo'
          ? t('Facturación, durante {n}.', { n: anios(ultimo.anios) })
          : t('Sueldo bruto de una paga, durante {n}.', { n: anios(ultimo.anios) })} />
      <Paso titulo={cese ? t('Base reguladora (media de los últimos 12 meses)') : t('Base reguladora (media de los últimos 180 días)')} valor={alMes(pr.baseReguladora)} texto={textos.base} />
      {cese
        ? <Paso titulo={t('Meses cotizados por cese de actividad (últimos 48)')} valor={t('{n} meses', { n: formatNumber(pr.mesesCotizados, { decimals: 0 }) })}
          texto={t('Hacen falta {min} meses seguidos justo antes del cese; tú llevas {n}.', { min: pr.minMeses, n: formatNumber(pr.mesesSeguidos, { decimals: 0 }) })} />
        : <Paso titulo={t('Días cotizados en los últimos 6 años')} valor={t('{n} días', { n: formatInt(pr.diasCotizados) })} texto={textos.dias} />}
      {pr.derecho ? (
        <>
          <Paso titulo={t('Duración de la prestación')} valor={meses(pr.meses)}
            texto={cese ? t('Según la tabla de cese de actividad (más abajo).') : t('{n} días, según la tabla de duración (más abajo).', { n: formatInt(pr.dias) })} />
          {cese ? (
            <Paso titulo={t('Cada mes: {pct} de la base', { pct: pc(pr.pctInicial) })} valor={alMes(pr.mensualInicial)} texto={`${e2(pr.brutoInicial)}${topeTxt(pr.topeInicial, maximo, minimo)}.`} />
          ) : (
            <>
              <Paso titulo={t('Los primeros {n} meses: {pct} de la base', { n: pr.mesesInicial, pct: pc(pr.pctInicial) })} valor={alMes(pr.mensualInicial)}
                texto={`${t('{pct} de {base} = {x}', { pct: pc(pr.pctInicial), base: e2(pr.baseReguladora), x: e2(pr.brutoInicial) })}${topeTxt(pr.topeInicial, maximo, minimo)}.`} />
              {pr.mesesResto > 0 ? (
                <Paso titulo={t('Desde el mes {n}: {pct} de la base', { n: pr.mesesInicial + 1, pct: pc(pr.pctResto) })} valor={alMes(pr.mensualResto)}
                  texto={`${t('{pct} de {base} = {x}', { pct: pc(pr.pctResto), base: e2(pr.baseReguladora), x: e2(pr.brutoResto) })}${topeTxt(pr.topeResto, maximo, minimo)}.`} />
              ) : null}
            </>
          )}
          <Paso titulo={t('Total que cobrarías (bruto)')} valor={e2(pr.total)} total />
        </>
      ) : (
        <Paso titulo={t('Resultado')} valor={t('Sin derecho')} total
          texto={cese
            ? t('Con menos de 12 meses seguidos cotizados por cese de actividad no se cobra esta prestación.')
            : t('Con menos de {n} días cotizados no hay prestación contributiva (podría haber algún subsidio, que no calculamos).', { n: formatInt(pr.minDias) })} />
      )}
    </ol>
  );
}

export function ParoSection({ params, sim }) {
  const { paroAhora: pa, balance: b } = sim;
  const textos = textosParo(params.paro);
  const g = b.paro.generado;
  const cese = b.paro.tipo === 'cese';
  /** Sustantivo de la prestación, para meterlo en frases: «paro» o «cese de actividad». */
  const etiquetaParo = cese ? t('cese de actividad') : t('paro');

  let cuerpo;
  if (pa.estado === 'sin_datos') {
    cuerpo = <p className="sim-empty">{t('Para calcular el paro hace falta al menos un periodo de trabajo: indica tus años trabajando en el apartado 3.')}</p>;
  } else {
    const generadoBig = (
      <Big value={formatEuro(g.total)} tone="admin" label={cese ? t('de cese de actividad has generado para el Estado') : t('de paro has generado para el Estado')}
        sub={g.total > 0
          ? t('{mine} tuyos{company} · el {pct} de todo lo que has aportado', {
            mine: formatEuro(g.trabajador),
            company: g.empresa > 0 ? ` ${t('y {x} de tu empresa', { x: formatEuro(g.empresa) })}` : '',
            pct: formatShare(b.paro.pctDelAportado),
          })
          : t('Nada: no hay años de trabajo.')} />
    );
    const cobradoBig = b.paro.cobrado > 0
      ? <Big value={formatEuro(b.paro.cobrado)} tone="coste" label={cese ? t('de cese de actividad ya has cobrado') : t('de paro ya has cobrado')}
        sub={t('El {x} de lo que has generado', { x: formatShare(g.total > 0 ? (b.paro.cobrado / g.total) * 100 : 0) })} />
      : null;

    if (pa.estado === 'en_paro') {
      cuerpo = (
        <>
          <div className="bigs">{generadoBig}{cobradoBig}</div>
          <p className="sim-flag">{t('Tu último periodo es de paro, así que ya estás cobrándolo (o lo has agotado). Para ver qué te tocaría después, añade un nuevo trabajo al final de tu historial en el apartado 3.')}</p>
        </>
      );
    } else {
      const pr = pa.prestacion;
      const eco = pa.economia;
      const ceseHoy = pa.regimen === 'cese';
      const totalPct = g.total > 0 ? (pr.total / g.total) * 100 : null;
      const netoPct = pr.derecho && eco.netoMensual > 0 ? (pr.mensualInicial / eco.netoMensual) * 100 : null;

      const tocariaBig = pr.derecho ? (
        <Big value={formatEuro(pr.total)} tone="neto" label={cese ? t('de cese de actividad te tocarían si lo dejaras hoy') : t('de paro te tocarían si lo dejaras hoy')}
          sub={ceseHoy
            ? t('{meses} a {x} al mes{pct}', {
              meses: meses(pr.meses), x: formatEuro(pr.mensualInicial),
              pct: netoPct != null ? ` ${t('(el {x} de lo que te queda hoy)', { x: formatShare(netoPct) })}` : '',
            })
            : t('{meses}: {a} al mes los primeros {n}{resto}{pct}', {
              meses: meses(pr.meses), a: formatEuro(pr.mensualInicial), n: pr.mesesInicial,
              resto: pr.mesesResto > 0 ? ` ${t('y {x} después', { x: formatEuro(pr.mensualResto) })}` : '',
              pct: netoPct != null ? ` ${t('(el {x} de tu neto de hoy al principio)', { x: formatShare(netoPct) })}` : '',
            })} />
      ) : (
        <Big value={formatEuro(0)} tone="neto" label={cese ? t('Hoy no tendrías derecho a cese de actividad') : t('Hoy no tendrías derecho a paro')}
          sub={ceseHoy
            ? t('Hacen falta {min} meses seguidos como autónomo; llevas {n}.', { min: pr.minMeses, n: formatNumber(pr.mesesSeguidos, { decimals: 0 }) })
            : t('Hacen falta {min} días cotizados en los últimos 6 años; llevas {n}.', { min: formatInt(pr.minDias), n: formatInt(pr.diasCotizados) })} />
      );
      const ratioBig = pr.derecho && totalPct != null ? (
        <Big value={formatShare(totalPct)} tone="coste" label={cese ? t('de lo que has generado te devolvería el cese de actividad') : t('de lo que has generado te devolvería el paro')}
          sub={totalPct >= 100 ? t('Cobrarías más de lo que has cotizado para esto: lo paga el resto del sistema.') : t('El resto sigue en la caja común para pagar el paro de otras personas.')} />
      ) : null;

      const filasBarras = [
        { key: 'gen', label: t('{que} generado para el Estado', { que: may(etiquetaParo) }), parts: [
          { key: 'w', label: t('Tuyo'), value: g.trabajador, color: '--c-ss' },
          { key: 'e', label: t('De tu empresa'), value: g.empresa, color: '--c-ssemp' }] },
      ];
      if (pr.derecho) {
        filasBarras.push({ key: 'toca', label: t('{que} que te tocaría si lo dejas hoy', { que: may(etiquetaParo) }), parts: ceseHoy
          ? [{ key: 'c', label: t('Prestación'), value: pr.total, color: '--c-neto' }]
          : [{ key: 'i', label: t('Primeros {n} meses ({pct})', { n: pr.mesesInicial, pct: pc(pr.pctInicial) }), value: pr.mensualInicial * pr.mesesInicial, color: '--c-neto' },
            { key: 'r', label: t('Desde el mes {n} ({pct})', { n: pr.mesesInicial + 1, pct: pc(pr.pctResto) }), value: pr.mensualResto * pr.mesesResto, color: '--c-irpf' }] });
      }
      if (b.paro.cobrado > 0) filasBarras.push({ key: 'cob', label: t('{que} que ya has cobrado', { que: may(etiquetaParo) }), parts: [{ key: 'p', label: t('Cobrado'), value: b.paro.cobrado, color: '--c-paro' }] });
      const leyenda = filasBarras.flatMap((r) => r.parts).filter((p) => p.value > 0);

      cuerpo = (
        <>
          <div className={`bigs ${cobradoBig ? 'bigs--four' : ''}`}>{generadoBig}{tocariaBig}{ratioBig}{cobradoBig}</div>
          <div className="sim-card">
            <h3 className="sim-card__title">{t('{que} generado y {nombre} que te tocaría', { que: may(etiquetaParo), nombre: etiquetaParo })}<StarMark /></h3>
            <ScaleBars rows={filasBarras} />
            <KeyList items={leyenda} />
            <p className="sim-note">{textos.generado}</p>
          </div>
          <div className="sim-card">
            <h3 className="sim-card__title">{t('Cómo sale tu {nombre} de hoy', { nombre: etiquetaParo })}<StarMark /></h3>
            <p className="sim-card__lead">{textos.tocaria}</p>
            <Pasos pa={pa} params={params} textos={textos} />
            {pr.derecho && !ceseHoy ? <p className="sim-note">{textos.porcentaje} {textos.topes}</p> : null}
            <TablaDuracion pa={pa} params={params} />
            <p className="sim-note">{textos.bruto}</p>
          </div>
        </>
      );
    }
  }

  return (
    <section className="sim-section" id="paro" aria-labelledby="h-paro">
      <header className="sim-section__head">
        <span className="sim-section__n" aria-hidden="true">4</span>
        <div>
          <h2 id="h-paro" tabIndex={-1}>{t('Paro: lo que has generado y lo que te tocaría')}</h2>
          <p>{t('Comparamos el paro que has generado para el sistema con el que cobrarías si dejaras de trabajar hoy, calculado con tu último trabajo.')}</p>
        </div>
      </header>
      <div className="sim-results">{cuerpo}</div>
      <details className="sim-details sim-details--assumptions">
        <summary>{t('Qué suponemos en el cálculo del paro')}</summary>
        <ul>{SUPUESTOS_PARO(textos).map((text) => <li key={text}>{text}</li>)}</ul>
      </details>
    </section>
  );
}
