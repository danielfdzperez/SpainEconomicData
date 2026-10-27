import { StarMark, Tip } from '../Help.jsx';
import { formatEuro, formatInt, formatNumber, formatShare } from '../../core/format.js';
import { SUPUESTOS_SERVICIOS } from '../../content/simTexts.js';
import { Big, PairBars } from './Blocks.jsx';
import { ChoiceField, NumberField } from './Fields.jsx';
import { lit, t, tx } from '../../i18n/index.js';
import { num } from '../../state/simForm.js';

const UNIDADES = {
  consulta: [lit('consulta'), lit('consultas')], visita: [lit('visita'), lit('visitas')], noche: [lit('noche'), lit('noches')], parto: [lit('parto'), lit('partos')],
  prueba: [lit('prueba'), lit('pruebas')], año: [lit('año'), lit('años')], viaje: [lit('viaje'), lit('viajes')],
};
/** Cómo se lee la unidad de un precio privado de educación (`EUR/mes`…). */
const UNIDADES_PRECIO = { 'EUR/mes': lit('por mes (× 10 mensualidades)'), 'EUR/año': lit('por año'), 'EUR/curso': lit('por curso'), 'EUR/credito': lit('por crédito') };
const cantidadTxt = (n, unidad) => {
  const [uno, varios] = UNIDADES[unidad] ?? [unidad, unidad];
  const r = Math.round(n * 10) / 10;
  return `${Number.isInteger(r) ? formatInt(r) : formatNumber(r, { decimals: 1 })} ${t(r === 1 ? uno : varios)}`;
};
const cantidadNum = (q) => (Number.isInteger(q) ? formatInt(q) : formatNumber(q, { decimals: 1 }));
const eur = (v) => formatEuro(v, { decimals: v % 1 === 0 ? 0 : 2 });

/** Explicación de un precio: de dónde sale y con qué fiabilidad. */
function precioTip(l) {
  const f = (p) => (p.territorio ? `${t(p.territorio)}${p.anio ? ` ${p.anio}` : ''}` : '');
  const pub = l.precioPublico;
  const priv = l.precioPrivado;
  const partes = [];
  if (l.grupo === 'salud') {
    partes.push(t('Pública: {price} por {unit} ({where}, fuente {source}, fiabilidad {rel}).', { price: eur(pub.valor), unit: t(l.unidad), where: f(pub), source: pub.fuente, rel: t(`${pub.fiabilidad}¦fiabilidad`) }));
    partes.push(priv.proxy
      ? t('Privada: sin precio fiable, usamos el público.')
      : t('Privada: {price} por {unit} ({where}, fuente {source}; rango {min}–{max}).', { price: eur(priv.valor), unit: t(l.unidad), where: f(priv), source: priv.fuente, min: eur(priv.min), max: eur(priv.max) }));
  } else if (l.grupo === 'educacion') {
    partes.push(t('Pública: {price} por alumno y curso (dato de {base} en 2019 llevado a Madrid 2023{note}).', { price: eur(pub.gastoAlumno), base: eur(pub.base2019), note: pub.actualizado ? '' : t('; la universidad no se actualiza') }));
    partes.push(t('Privada: {price} {unit} en {where} ({year}; rango {min}–{max}).', {
      price: eur(priv.importe), unit: t(UNIDADES_PRECIO[priv.unidad] ?? priv.unidad.replace('EUR/', 'por ')), where: t(priv.territorio), year: priv.anio, min: eur(priv.min), max: eur(priv.max),
    }));
    if (pub.matriculaAnual) partes.push(t('Matrícula pública: {price} al curso.', { price: eur(pub.matriculaAnual) }));
  } else {
    partes.push(t('Coste por viaje: {price} ({where}). Lo que pagas tú es el abono mensual o el bono, el más barato.', { price: eur(pub.valor), where: f(pub) }));
    partes.push(t('No hay un transporte privado equivalente: la columna «Privada» muestra lo que costaría sin ayudas públicas.'));
  }
  return partes.join(' ');
}

/** Línea de sanidad cuyo precio privado unitario sale por debajo del público. */
const privadaMasBarata = (l) => l.grupo === 'salud' && !l.proxyPrivado && l.precioPrivado.valor < l.precioPublico.valor;

function Celda({ total, detalle }) {
  return <td><span className="sim-money">{formatEuro(total)}</span>{detalle ? <small className="sim-sub">{detalle}</small> : null}</td>;
}

function FilaServicio({ l }) {
  const q = l.cantidad;
  const unitPub = l.grupo === 'educacion' ? l.precioPublico.gastoAlumno : l.precioPublico.valor;
  const unitPriv = l.grupo === 'educacion' ? l.precioPrivado.anual : l.precioPrivado.valor;
  const etiqueta = l.grupo === 'educacion' ? `${t(l.label)} · ${l.centro === 'privada' ? t('privada') : t('pública')}` : t(l.label);
  return (
    <tr>
      <th scope="row"><span className="sim-table__label">{etiqueta}<Tip title={t(l.label)} short={precioTip(l)} source={t('Cálculo nuestro: cantidad × precio medio')} own /></span></th>
      <td>{cantidadTxt(q, l.unidad)}</td>
      <Celda total={l.costePublico} detalle={`${eur(unitPub)} × ${cantidadNum(q)}`} />
      <td>{l.pagoPersona > 0 ? formatEuro(l.pagoPersona) : '—'}</td>
      <Celda total={l.equivalentePrivado} detalle={l.proxyPrivado ? t('sin precio privado: usamos el público') : `${eur(unitPriv)} × ${cantidadNum(q)}${privadaMasBarata(l) ? ` · ${t('más barato que lo público (ver nota)')}` : ''}`} />
    </tr>
  );
}

/** Lo que costaría un seguro de salud privado al año, frente a lo que cuesta lo contado en la pública. */
function SeguroCard({ s }) {
  const sg = s.seguro;
  const op = sg.opciones.find((o) => o.id === sg.elegido) ?? sg.opciones[0];
  const conParto = op.id === 'completo';
  const filas = [
    { key: 'contado', label: t('Lo que has contado de sanidad ({total} en total, repartido en tus {n} años)', { total: formatEuro(s.grupos.salud.totales.costePublico), n: formatInt(s.edad) }), a: sg.publicoAlAnio, b: op.primaAnual },
    { key: 'media', label: t('Un habitante medio de España (incluye medicamentos, ingresos y pruebas)'), a: s.referenciaSalud.porHabitante, b: op.primaAnual },
  ];
  return (
    <div className="sim-card sim-card--seguro">
      <h3 className="sim-card__title">{t('Lo que costaría un seguro de salud privado')}<StarMark /></h3>
      <div className="bigs">
        <Big value={formatEuro(op.primaAnual)} tone="coste" label={t('al año de prima')} sub={t('{month} al mes · rango de {min} a {max} al año', { month: formatEuro(op.primaMensual, { decimals: 2 }), min: formatEuro(op.minAnual), max: formatEuro(op.maxAnual) })} />
        {op.pctBruto == null ? null : <Big value={formatShare(op.pctBruto)} tone="admin" label={t('de tu sueldo bruto mensual')} sub={t('{x} de tu neto', { x: formatShare(op.pctNeto) })} />}
        <Big value={formatEuro(op.total)} tone="neto" label={t('durante {n} años', { n: formatInt(s.edad) })} sub={t('si lo hubieras tenido desde que naciste, con la prima de hoy')} />
      </div>
      <p className="sim-card__lead">
        <strong>{t('Cómo leer las barras.')}</strong>{' '}
        {tx('La barra de la pública no es lo que has pagado ni lo que has aportado: es lo que le cuesta {sistema} atender lo que contaste arriba, {total} en total, que repartidos en tus {n} años son {year} al año. La barra del seguro es lo que pagarías {tu} cada año ({prima}) si tuvieras un seguro privado; sin seguro no pagarías esa prima.', {
          sistema: <em>{t('al sistema')}</em>, total: formatEuro(s.grupos.salud.totales.costePublico), n: formatInt(s.edad), year: formatEuro(sg.publicoAlAnio), tu: <em>{t('tú')}</em>, prima: formatEuro(op.primaAnual),
        })}
      </p>
      <PairBars rows={filas} a={{ label: t('Lo que cuesta a la sanidad pública (lo paga el sistema)'), color: '--c-pub' }} b={{ label: t('Prima anual del seguro privado (la pagarías tú)'), color: '--c-priv' }} />
      <p className="sim-note">
        {conParto
          ? t('El seguro con cobertura de parto cuesta mucho más (rango de {min} a {max} al año) y suele tener 8-12 meses de carencia.', { min: formatEuro(op.minAnual), max: formatEuro(op.maxAnual) })
          : t('Los seguros de entrada suelen llevar copago: unos {copago} por consulta, es decir, unos {total} por las visitas que has contado.', { copago: formatEuro(sg.copago), total: formatEuro(sg.copagos) })}
        {' '}{t('Ojo: la prima sube con la edad y no equivale a la sanidad pública (límites de cobertura, listas de espera, hospitales concertados).')}
      </p>
    </div>
  );
}

/** Por qué una línea pública puede salir más cara que la privada, y cuáles de las tuyas lo hacen. */
function RevisionPrecios({ lineas }) {
  const afectadas = lineas.filter((l) => l.cantidad > 0 && privadaMasBarata(l));
  return (
    <details className="sim-details sim-details--assumptions" open={afectadas.length > 0}>
      <summary>{t('¿Por qué algunos precios públicos salen más altos que los privados?')}</summary>
      <ul>
        <li><strong>{t('Son dos clases de precio.')}</strong> {t('El público es la tarifa que cobra el hospital a aseguradoras y mutuas (en Madrid, la propuesta de la Orden de precios públicos de 2023): tiene que cubrir todo el hospital —personal, equipos, guardias, formación—. El privado es el precio de lista de una consulta o prueba suelta en una clínica, sin complicaciones ni ingreso.')}</li>
        <li><strong>{t('No son del mismo sitio ni del mismo año.')}</strong> {t('Lo público es de Madrid (2023) o de Navarra y País Vasco (2025); lo privado, un rango medio de España en 2026.')}</li>
        <li><strong>{t('El dato privado es el más débil.')}</strong> {t('No hay una estadística oficial de precios sanitarios privados: salen de portales comparadores y su fiabilidad es media o baja. Los rangos son anchos (una primera consulta con especialista, de 60 a 120 €, y más de 200 € en clínicas premium).')}</li>
        <li><strong>{t('La consulta de especialista está algo inflada.')}</strong> {t('A todas las visitas les aplicamos la tarifa de primera consulta de Madrid; las sucesivas son más baratas (79 € frente a 132 €), pero no sabemos cuántas de las tuyas lo fueron.')}</li>
        <li><strong>{t('No lo hemos corregido')}</strong>: {t('enseñamos los dos datos tal cual y su rango en la ayuda de cada fila. Que una consulta suelta salga más barata en privado no significa que todo lo sea: donde no hay precio privado fiable (noches de hospital, UCI, curas) usamos el público, y los seguros privados limitan lo que cubren.')}</li>
      </ul>
      {afectadas.length > 0 ? (
        <p className="sim-note">
          {t('En tu cálculo salen más baratas en la privada: {list}.', {
            list: afectadas.map((l) => t('{label} ({pub} en la pública frente a {priv} en la privada)', { label: t(l.label).toLowerCase(), pub: eur(l.precioPublico.valor), priv: eur(l.precioPrivado.valor) })).join('; '),
          })}
        </p>
      ) : null}
    </details>
  );
}

const NOMBRE_GRUPO = { salud: lit('Sanidad'), educacion: lit('Educación'), transporte: lit('Transporte') };

export function ServiciosSection({ form, set, setEtapa, setFrecuenciaModo, params, sim, avisoDe }) {
  const { servicios: s } = sim;
  const freq = params.salud.frecuenciaMedia;
  const vida = form.frecuenciaModo === 'vida';
  const edad = num(form.edad);
  const unidadVeces = vida ? t('veces en toda tu vida') : t('veces al año');
  const media = (v) => {
    const alAnio = t('{n} al año', { n: formatNumber(v, { decimals: 1 }) });
    return vida && edad > 0
      ? t('Media en España a tu edad: unas {total} ({alAnio} × {edad} años)', { total: formatInt(v * edad), alAnio, edad: formatInt(edad) })
      : t('Media en España: {alAnio}', { alAnio });
  };
  const tieneDatos = s.totales.costePublico > 0;
  const nombres = { salud: t('Sanidad'), educacion: t('Educación'), transporte: t('Transporte público') };
  const filas = ['salud', 'educacion', 'transporte'].map((g) => ({ key: g, label: nombres[g], a: s.grupos[g].totales.costePublico, b: s.grupos[g].totales.equivalentePrivado })).filter((r) => r.a > 0 || r.b > 0);
  const pct = s.porcentajes;

  return (
    <section className="sim-section" id="servicios" aria-labelledby="h-servicios">
      <header className="sim-section__head">
        <span className="sim-section__n" aria-hidden="true">2</span>
        <div>
          <h2 id="h-servicios" tabIndex={-1}>{t('Lo que has usado de los servicios públicos')}</h2>
          <p>{t('Cuéntanos cuánto has usado la sanidad, la escuela y el transporte. Calculamos lo que cuesta en la pública, lo que costaría en la privada y qué parte de tu sueldo supone.')}</p>
        </div>
      </header>

      <form className="sim-card sim-questions" onSubmit={(e) => e.preventDefault()} aria-label={t('Cuánto has usado los servicios públicos')}>
        <div className="sim-age">
          <NumberField label={t('¿Cuántos años tienes?')} unit={t('años')} value={form.edad} onChange={(v) => set('edad', v)} step="1" max={120} warn={avisoDe('edad')} />
          <p className="sim-group__note">{t('Multiplicamos lo que cuentas «al año» por tu edad para llegar al total de tu vida.')}</p>
        </div>

        <fieldset className="sim-group sim-group--wide sim-group--health">
          <legend>{t('Sanidad')}</legend>
          <div className="sim-group__mode">
            <ChoiceField legend={t('¿Cómo cuentas las visitas al médico?')} name="frecuencia" value={form.frecuenciaModo} onChange={(v) => setFrecuenciaModo(v)}
              options={[{ value: 'vida', label: t('En toda mi vida') }, { value: 'anio', label: t('Al año') }]} />
            <p className="sim-group__note">{t('Puedes contarlas de las dos formas. Al cambiar, convertimos lo que habías escrito con tu edad.')}</p>
          </div>
          <NumberField label={t('Médico de cabecera')} unit={unidadVeces} value={form.cabecera} onChange={(v) => set('cabecera', v)} hint={media(freq.cabecera)} />
          <NumberField label={t('Enfermería (curas, vacunas, controles)')} unit={unidadVeces} value={form.enfermeria} onChange={(v) => set('enfermeria', v)} hint={media(freq.enfermeria)} />
          <NumberField label={t('Especialista en el hospital')} unit={unidadVeces} value={form.especialista} onChange={(v) => set('especialista', v)} hint={media(freq.especialista)} />
          <NumberField label={t('Urgencias')} unit={t('veces en toda tu vida')} value={form.urgencias} onChange={(v) => set('urgencias', v)} step="1" />
          <NumberField label={t('Noches ingresado en el hospital')} unit={t('en toda tu vida')} value={form.nochesHospital} onChange={(v) => set('nochesHospital', v)} step="1" />
          <NumberField label={t('Noches en la UCI')} unit={t('en toda tu vida')} value={form.nochesUci} onChange={(v) => set('nochesUci', v)} step="1" hint={t('Cuentan aparte de las del hospital.')} />
          <NumberField label={t('Partos (tuyos o de tu pareja)')} unit={t('en total')} value={form.partos} onChange={(v) => set('partos', v)} step="1" />
          <NumberField label={t('…de ellos, cesáreas')} unit={t('en total')} value={form.cesareas} onChange={(v) => set('cesareas', v)} step="1" />
          <NumberField label={t('Resonancias magnéticas')} unit={t('en toda tu vida')} value={form.resonancias} onChange={(v) => set('resonancias', v)} step="1" />
          <NumberField label={t('Ecografías')} unit={t('en toda tu vida')} value={form.ecografias} onChange={(v) => set('ecografias', v)} step="1" />
        </fieldset>

        <fieldset className="sim-group sim-group--edu">
          <legend>{t('Educación')}</legend>
          <p className="sim-group__note">{t('Años en cada etapa y si fue en un centro público (o concertado) o privado.')}</p>
          <div className="etapas">
            {params.educacion.etapas.map((e) => {
              const v = form.educacion[e.id];
              return (
                <div key={e.id} className="etapas__row">
                  <span className="etapas__label">{t(e.label)}</span>
                  <label className="sim-field etapas__years">
                    <span className="sr-only">{t('Años en {etapa}', { etapa: t(e.label) })}</span>
                    <input className="input" type="number" inputMode="numeric" min="0" step="1" value={v.anios} onChange={(ev) => setEtapa(e.id, 'anios', ev.target.value)} />
                    <span className="sim-field__unit">{t('años')}</span>
                  </label>
                  <label className="etapas__centro">
                    <span className="sr-only">{t('Tipo de centro en {etapa}', { etapa: t(e.label) })}</span>
                    <select className="select" value={v.centro} onChange={(ev) => setEtapa(e.id, 'centro', ev.target.value)}>
                      <option value="publica">{t('Pública o concertada')}</option>
                      <option value="privada">{t('Privada')}</option>
                    </select>
                  </label>
                </div>
              );
            })}
          </div>
          {avisoDe('educacion') ? <p className="sim-field__warn" role="status">{avisoDe('educacion')}</p> : null}
        </fieldset>

        <fieldset className="sim-group sim-group--transport">
          <legend>{t('Transporte público (Madrid)')}</legend>
          <NumberField label={t('Viajes a la semana')} unit={t('viajes')} value={form.viajesSemana} onChange={(v) => set('viajesSemana', v)} step="1" hint={t('Ir y volver del trabajo son 2 viajes al día.')} />
          <NumberField label={t('Durante cuántos años')} unit={t('años')} value={form.aniosTransporte} onChange={(v) => set('aniosTransporte', v)} step="1" warn={avisoDe('aniosTransporte')} />
        </fieldset>

        <fieldset className="sim-group sim-group--insurance">
          <legend>{t('Seguro de salud privado')}</legend>
          <ChoiceField legend={t('¿Qué seguro quieres comparar?')} name="seguro" value={form.seguroTipo} onChange={(v) => set('seguroTipo', v)}
            options={[{ value: 'basico', label: t('De entrada (con copagos)') }, { value: 'completo', label: t('Con cobertura de parto') }]} />
          <p className="sim-group__note">{t('Sólo sirve para comparar: no cambia lo que has usado de la pública.')}</p>
        </fieldset>
      </form>

      {!tieneDatos || s.edad <= 0 ? (
        <>
          <p className="sim-empty">{t('Escribe tu edad y alguna cifra de uso para ver los resultados.')}</p>
          {s.edad > 0 ? <SeguroCard s={s} /> : null}
        </>
      ) : (
        <>
          <h3 className="sim-subtitle">{t('Tu vida en cifras')}<StarMark /></h3>
          <div className="bigs bigs--four">
            <Big value={formatInt(s.grupos.salud.consultas)} label={t('veces has ido al médico, al enfermero o a urgencias')} sub={t('{n} al año de media', { n: formatInt(s.grupos.salud.consultas / s.edad) })} />
            <Big value={formatInt(s.grupos.salud.noches)} label={t('noches has pasado ingresado')} own={false} />
            <Big value={formatInt(s.grupos.educacion.anios)} label={t('años has estado estudiando')} own={false} />
            <Big value={formatInt(s.grupos.transporte.viajes)} label={t('viajes has hecho en transporte público')} />
          </div>

          <h3 className="sim-subtitle">{t('Lo que cuesta, en la pública y en la privada')}<StarMark /></h3>
          <div className="duel">
            <div className="duel__card duel__card--pub">
              <div className="duel__who">{t('En la pública cuesta')}</div>
              <div className="duel__value">{formatEuro(s.totales.costePublico)}<StarMark /></div>
              <p className="duel__sub">{t('Tú pagaste directamente {a} y el sistema puso {b}.', { a: formatEuro(s.totales.pagoPersona), b: formatEuro(s.totales.puestoSistema) })}</p>
              {pct ? <p className="duel__pct">{tx('Son {month} durante toda tu vida: el {gross} de tu sueldo bruto mensual ({net} del neto).', { month: <strong>{t('{x} al mes', { x: formatEuro(s.mensual.costePublico) })}</strong>, gross: <strong>{formatShare(pct.costePublicoBruto)}</strong>, net: formatShare(pct.costePublicoNeto) })}</p> : null}
            </div>
            <div className="duel__card duel__card--priv">
              <div className="duel__who">{t('En la privada costaría')}</div>
              <div className="duel__value">{formatEuro(s.totales.equivalentePrivado)}<StarMark /></div>
              <p className="duel__sub">{s.totales.equivalentePrivado >= s.totales.costePublico
                ? t('{x} veces el coste público.', { x: formatNumber(s.totales.equivalentePrivado / s.totales.costePublico, { decimals: 2 }) })
                : t('{x} veces el coste público: aquí lo privado sale más barato.', { x: formatNumber(s.totales.equivalentePrivado / s.totales.costePublico, { decimals: 2 }) })}</p>
              {pct ? <p className="duel__pct">{tx('Serían {month}: el {gross} de tu sueldo bruto mensual ({net} del neto).', { month: <strong>{t('{x} al mes', { x: formatEuro(s.mensual.equivalentePrivado) })}</strong>, gross: <strong>{formatShare(pct.equivalentePrivadoBruto)}</strong>, net: formatShare(pct.equivalentePrivadoNeto) })}</p> : null}
            </div>
          </div>
          <p className="sim-note">{t('Media mensual = total ÷ ({n} años × 12 meses). El porcentaje compara esa media con tu sueldo de hoy, que no es lo que cobrabas de niño.', { n: formatInt(s.edad) })}</p>

          <div className="sim-card">
            <h4 className="sim-card__title">{t('Por tipo de servicio')}</h4>
            <PairBars rows={filas} a={{ label: t('Pública (coste del servicio)'), color: '--c-pub' }} b={{ label: t('Privada (precio)'), color: '--c-priv' }} />
          </div>

          <div className="sim-card">
            <h4 className="sim-card__title">{t('Todo el detalle')}<StarMark /></h4>
            <div className="sim-table-wrap">
              <table className="sim-table sim-table--services">
                <caption className="sr-only">{t('Uso de servicios y su coste público y privado. Sólo aparecen los servicios que has usado.')}</caption>
                <thead><tr><th scope="col">{t('Servicio')}</th><th scope="col">{t('Cantidad')}</th><th scope="col">{t('En la pública')}</th><th scope="col">{t('Tú pagas')}</th><th scope="col">{t('En la privada')}</th></tr></thead>
                <tbody>
                  {['salud', 'educacion', 'transporte'].map((g) => (s.grupos[g].lineas.length ? (
                    [
                      <tr key={`${g}-h`} className="sim-table__group"><th colSpan={5} scope="colgroup">{t(NOMBRE_GRUPO[g])}</th></tr>,
                      ...s.grupos[g].lineas.filter((l) => l.cantidad > 0).map((l) => <FilaServicio key={l.id} l={l} />),
                      <tr key={`${g}-t`} className="sim-table__sum">
                        <th scope="row">{t('Total {grupo}', { grupo: t(NOMBRE_GRUPO[g]).toLowerCase() })}</th><td />
                        <td>{formatEuro(s.grupos[g].totales.costePublico)}</td><td>{s.grupos[g].totales.pagoPersona > 0 ? formatEuro(s.grupos[g].totales.pagoPersona) : '—'}</td><td>{formatEuro(s.grupos[g].totales.equivalentePrivado)}</td>
                      </tr>,
                    ]
                  ) : null))}
                  <tr className="sim-table__total">
                    <th scope="row">{t('Total')}</th><td />
                    <td>{formatEuro(s.totales.costePublico)}</td><td>{formatEuro(s.totales.pagoPersona)}</td><td>{formatEuro(s.totales.equivalentePrivado)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <RevisionPrecios lineas={s.grupos.salud.lineas} />

          <div className="sim-asides">
            <p className="sim-note"><strong>{t('Sanidad de una persona media.')}</strong> {tx('A la sanidad pública cada habitante le cuesta de media {a} al año (incluye medicamentos, ingresos y pruebas). A tus {n} años serían {b}{star}; con lo que has contado suma {c}.', { a: formatEuro(s.referenciaSalud.porHabitante), n: formatInt(s.edad), b: formatEuro(s.referenciaSalud.vida), star: <StarMark />, c: formatEuro(s.grupos.salud.totales.costePublico) })}</p>
          </div>
          <SeguroCard s={s} />
        </>
      )}

      <details className="sim-details sim-details--assumptions">
        <summary>{t('Cómo hemos puesto precio a todo esto')}</summary>
        <ul>{SUPUESTOS_SERVICIOS.map((text) => <li key={text}>{t(text)}</li>)}</ul>
      </details>
    </section>
  );
}
