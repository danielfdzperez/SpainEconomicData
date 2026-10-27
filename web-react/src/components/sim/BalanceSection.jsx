import { StarMark, Tip } from '../Help.jsx';
import { formatEuro, formatInt, formatNumber, formatShare } from '../../core/format.js';
import { NO_CUENTA, textosNomina } from '../../content/simTexts.js';
import { lit, t, tx } from '../../i18n/index.js';
import { Big, KeyList, ScaleBars } from './Blocks.jsx';
import { NumberField } from './Fields.jsx';

const FUNCIONES_RESALTADAS = new Set(['07', '09']);

const TIPOS = [
  { value: 'trabajo', label: lit('Trabajo por cuenta ajena') },
  { value: 'autonomo', label: lit('Autónomo') },
  { value: 'paro', label: lit('Paro') },
];
const NOMBRE_TIPO = Object.fromEntries(TIPOS.map((tipo) => [tipo.value, tipo.label]));

const anios = (n) => `${formatNumber(n, { decimals: Number.isInteger(n) ? 0 : 2 })} ${n === 1 ? t('año') : t('años')}`;

function CampoPeriodo({ etiqueta, i, valor, onChange, unit, step = 'any' }) {
  return (
    <label className="periodos__field">
      <span className="periodos__label">{etiqueta}</span>
      <span className="periodos__box">
        <input className="input" type="number" inputMode="decimal" min={0} step={step} value={valor}
          aria-label={t('{campo} (periodo {n})', { campo: etiqueta, n: i + 1 })} onChange={(e) => onChange(e.target.value)} />
        {unit ? <span className="sim-field__unit">{unit}</span> : null}
      </span>
    </label>
  );
}

/** Una fila del editor del historial: tipo, importes y años. */
function FilaEditor({ f, i, setPeriodo, quitar }) {
  return (
    <li className={`periodos__row periodos__row--${f.tipo}`} role="group" aria-label={t('Periodo {n}', { n: i + 1 })}>
      <span className="periodos__n" aria-hidden="true">{i + 1}</span>
      <label className="periodos__field periodos__field--tipo">
        <span className="periodos__label">{t('Qué hiciste')}</span>
        <select className="select" aria-label={t('Tipo del periodo {n}', { n: i + 1 })} value={f.tipo} onChange={(e) => setPeriodo(f.id, 'tipo', e.target.value)}>
          {TIPOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{t(tipo.label)}</option>)}
        </select>
      </label>
      {f.tipo === 'trabajo' ? <CampoPeriodo etiqueta={t('Sueldo bruto de una paga')} i={i} valor={f.importe} onChange={(v) => setPeriodo(f.id, 'importe', v)} unit="€" /> : null}
      {f.tipo === 'trabajo' ? (
        <label className="periodos__field">
          <span className="periodos__label">{t('Pagas')}</span>
          <select className="select" aria-label={t('Pagas del periodo {n}', { n: i + 1 })} value={Number(f.pagas) === 12 ? '12' : '14'} onChange={(e) => setPeriodo(f.id, 'pagas', Number(e.target.value))}>
            <option value="14">{t('14 pagas')}</option>
            <option value="12">{t('12 pagas')}</option>
          </select>
        </label>
      ) : null}
      {f.tipo === 'autonomo' ? <CampoPeriodo etiqueta={t('Facturación al mes')} i={i} valor={f.importe} onChange={(v) => setPeriodo(f.id, 'importe', v)} unit="€" /> : null}
      {f.tipo === 'autonomo' ? <CampoPeriodo etiqueta={t('Gastos al mes')} i={i} valor={f.gastos} onChange={(v) => setPeriodo(f.id, 'gastos', v)} unit="€" /> : null}
      {f.tipo === 'paro' ? <span className="periodos__paro">{t('Cobrando la prestación por desempleo (o el cese de actividad, si venías de autónomo).')}</span> : null}
      <CampoPeriodo etiqueta={t('Durante')} i={i} valor={f.anios} onChange={(v) => setPeriodo(f.id, 'anios', v)} unit={t('años')} step="0.25" />
      <button type="button" className="btn btn--ghost periodos__remove" aria-label={t('Quitar el periodo {n}', { n: i + 1 })} onClick={() => quitar(f.id)}>{t('Quitar')}</button>
    </li>
  );
}

/** Editor opcional del historial laboral, del periodo más antiguo al más reciente. */
function EditorHistorial({ form, ctx, aviso }) {
  const { setPeriodo, addPeriodo, quitarPeriodo, usarEjemplo, vaciarHistorial } = ctx;
  return (
    <div className="sim-card sim-card--historial">
      <h3 className="sim-card__title">{t('Tu historial laboral')}</h3>
      <p className="sim-card__lead">{t('Del periodo más antiguo al más reciente: el último es tu trabajo actual. Puedes usar decimales (0,5 años = 6 meses). Cada periodo se calcula con las cifras de 2026, sin actualizar los sueldos con la inflación.')}</p>
      {form.historial.length
        ? <ol className="periodos">{form.historial.map((f, i) => <FilaEditor key={f.id} f={f} i={i} setPeriodo={setPeriodo} quitar={quitarPeriodo} />)}</ol>
        : <p className="sim-empty">{t('Todavía no hay ningún periodo: añade uno o rellena el ejemplo.')}</p>}
      {aviso ? <p className="sim-field__warn" role="status">{aviso}</p> : null}
      <div className="periodos__actions">
        <button type="button" className="btn btn--ghost" onClick={() => addPeriodo('trabajo')}>{t('+ Trabajo')}</button>
        <button type="button" className="btn btn--ghost" onClick={() => addPeriodo('autonomo')}>{t('+ Autónomo')}</button>
        <button type="button" className="btn btn--ghost" onClick={() => addPeriodo('paro')}>{t('+ Paro')}</button>
        <button type="button" className="btn btn--ghost" onClick={usarEjemplo}>{t('Rellenar con un ejemplo')}</button>
        {form.historial.length ? <button type="button" className="btn btn--ghost" onClick={vaciarHistorial}>{t('Vaciar')}</button> : null}
      </div>
      <p className="sim-note">{t('Ejemplo: {a} durante 5 años, {b} durante 3, 1 año de paro y {c} durante 3. Lo que cobras de paro cuenta como usado del sistema y las cotizaciones que lo generaron ya no valen para el siguiente.', { a: formatEuro(1400), b: formatEuro(2500), c: formatEuro(5000) })}</p>
    </div>
  );
}

function detalleParo(f) {
  if (!f.prestacion.derecho) return t('Sin derecho: no llegas a 360 días cotizados (o 12 meses seguidos de autónomo).');
  const extra = f.mesesSinCubrir > 0 ? ` ${t('Declaras {a} meses, pero sólo {b} daban derecho.', { a: formatNumber(f.mesesDeclarados, { decimals: 0 }), b: formatNumber(f.prestacion.meses, { decimals: 0 }) })}` : '';
  return `${t('Te correspondían {n} meses a {x} al mes.', { n: formatNumber(f.prestacion.meses, { decimals: 0 }), x: formatEuro(f.prestacion.mensualInicial) })}${extra}`;
}

function celdaImporte(f) {
  if (f.tipo === 'trabajo') return `${formatEuro(f.brutoMensual)} × ${f.pagas}`;
  if (f.tipo === 'autonomo') return t('{x} al mes', { x: formatEuro(f.ingresosMensuales) });
  return '—';
}

function TablaHistorial({ hist }) {
  return (
    <div className="sim-card">
      <h3 className="sim-card__title">{t('Tu historial, periodo a periodo')}<StarMark /></h3>
      <div className="sim-table-wrap">
        <table className="sim-table sim-table--history">
          <caption className="sr-only">{t('Lo aportado, lo cotizado para el paro y lo cobrado de paro en cada periodo')}</caption>
          <thead><tr>{[t('Periodo'), t('Años'), t('Sueldo o ingresos'), t('Aportado'), t('Cotizado para el paro'), t('Paro cobrado')].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {hist.periodos.map((f, i) => (
              <tr key={f.id ?? i} className={f.tipo === 'paro' ? 'sim-table__hl' : ''}>
                <th scope="row">
                  <span className="sim-table__label">{i + 1}. {t(NOMBRE_TIPO[f.tipo])}</span>
                  {f.tipo === 'paro' ? <small className="sim-sub sim-sub--left">{detalleParo(f)}</small> : null}
                </th>
                <td>{anios(f.anios)}</td>
                <td>{celdaImporte(f)}</td>
                <td>{f.aportado ? formatEuro(f.aportado.total) : '—'}</td>
                <td>{f.paroGenerado ? formatEuro(f.paroGenerado.total) : '—'}</td>
                <td>{f.tipo === 'paro' ? formatEuro(f.cobrado) : '—'}</td>
              </tr>
            ))}
            <tr className="sim-table__total">
              <th scope="row">{t('Total')}</th><td>{anios(hist.aniosTotal)}</td><td />
              <td>{formatEuro(hist.aportado.total)}</td><td>{formatEuro(hist.paroGenerado.total)}</td><td>{formatEuro(hist.paroCobrado.importe)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BalanceSection({ form, set, params, sim, avisoDe, ctx }) {
  const { balance: b, servicios: s, economia, historial } = sim;
  const textos = textosNomina(params.nomina);
  const detallado = form.historialActivo;
  const sinDatos = economia.brutoAnual <= 0 || s.edad <= 0;
  const media = form.sanidadMedia;

  let resultados = <p className="sim-empty">{t('Para ver el balance hacen falta tu sueldo o tus ingresos (apartado 1) y tu edad (apartado 2).')}</p>;
  if (!sinDatos) {
    const usado = media ? b.consumidoMediaSanidad : b.consumido;
    const cobertura = media ? b.coberturaMediaSanidad : b.cobertura;
    const saldo = media ? b.saldoMediaSanidad : b.saldo;
    const saludUsada = media ? s.referenciaSalud.vida : s.grupos.salud.totales.puestoSistema;
    const conParo = b.paro.cobrado > 0;
    const sinParo = b.paro.generado.total <= 0;
    const aportadoParts = [
      { key: 'irpf', label: t('IRPF'), value: b.aportado.irpf, color: '--c-irpf' },
      { key: 'ssw', label: economia.regimen === 'autonomo' && !detallado ? t('Tu cuota de autónomo') : t('Tu Seguridad Social'), value: b.aportado.ssTrabajador, color: '--c-ss' },
      { key: 'sse', label: t('Seguridad Social de tu empresa'), value: b.aportado.ssEmpresa, color: '--c-ssemp' },
    ];
    const usadoParts = [
      { key: 'salud', label: media ? t('Sanidad (persona media)') : t('Sanidad'), value: saludUsada, color: '--c-salud' },
      { key: 'edu', label: t('Educación'), value: s.grupos.educacion.totales.puestoSistema, color: '--c-edu' },
      { key: 'tra', label: t('Transporte'), value: s.grupos.transporte.totales.puestoSistema, color: '--c-trans' },
      { key: 'paro', label: b.paro.tipo === 'cese' ? t('Cese de actividad cobrado') : t('Paro cobrado'), value: b.paro.cobrado, color: '--c-paro' },
    ];
    const refParts = [{ key: 'ref', label: t('Gasto público medio por persona'), value: b.referencia.vida, color: '--c-ref' }];
    const top = Math.max(b.aportado.total, usado, b.referencia.vida, 1);
    const salud = b.destino.find((x) => x.codigo === '07');
    const educacion = b.destino.find((x) => x.codigo === '09');

    resultados = (
      <>
        <div className="bigs bigs--four">
          <Big value={formatEuro(b.aportado.total)} tone="neto" label={Math.round(b.aniosTrabajados) === 1 ? t('has aportado en {n} año de trabajo', { n: formatInt(b.aniosTrabajados) }) : t('has aportado en {n} años de trabajo', { n: formatInt(b.aniosTrabajados) })}
            sub={t('{x} al año de media entre IRPF y cotizaciones (tuyas y de tu empresa)', { x: formatEuro(b.aportadoAnual.total) })} />
          <Big value={formatEuro(b.paro.generado.total)} tone="admin" label={sinParo ? t('de paro has generado') : (b.paro.tipo === 'cese' ? t('de cese de actividad has generado para el sistema') : t('de paro has generado para el sistema'))}
            sub={sinParo
              ? t('Nada: sin años de trabajo no se cotiza para el paro.')
              : t('{mine} tuyos{company} · el {pct} de lo que has aportado', {
                mine: formatEuro(b.paro.generado.trabajador),
                company: b.paro.generado.empresa > 0 ? ` ${t('y {x} de tu empresa', { x: formatEuro(b.paro.generado.empresa) })}` : '',
                pct: formatShare(b.paro.pctDelAportado),
              })} />
          <Big value={formatEuro(usado)} tone="coste" label={conParo ? t('has usado en sanidad, educación, transporte y paro') : t('has usado en sanidad, educación y transporte')}
            sub={conParo ? t('lo que ha puesto el sistema, con {x} de paro cobrado', { x: formatEuro(b.paro.cobrado) }) : t('lo que ha puesto el sistema, sin lo que pagaste tú')} />
          <Big value={cobertura == null ? '—' : `${formatNumber(cobertura, { decimals: 2 })} ×`} tone="admin" label={t('lo aportado frente a lo usado')}
            sub={saldo >= 0 ? t('Te sobran {x}.', { x: formatEuro(saldo) }) : t('Te faltan {x}: es normal si estudiaste antes de empezar a trabajar.', { x: formatEuro(-saldo) })} />
        </div>

        {detallado && historial && historial.periodos.length ? <TablaHistorial hist={historial} /> : null}

        <div className="sim-card">
          <h3 className="sim-card__title">{t('Lo aportado, lo usado y el gasto público medio')}<StarMark /></h3>
          <ScaleBars max={top} rows={[
            { key: 'aportado', label: t('Has aportado'), parts: aportadoParts },
            { key: 'usado', label: conParo ? t('Has usado (sanidad, educación, transporte y paro)') : t('Has usado (sanidad, educación, transporte)'), parts: usadoParts },
            { key: 'ref', label: t('Gasto público medio por persona × tu edad ({a} al año × {n} años)', { a: formatEuro(b.referencia.gastoPorHabitante), n: formatInt(s.edad) }), parts: refParts,
              note: t('No es lo que has usado tú. Es todo el gasto de las administraciones ({millones} millones de € en {year}, IGAE) dividido entre los habitantes de España: incluye sanidad, educación y transporte, pero también pensiones, paro, defensa, justicia, intereses de la deuda, carreteras… Sirve para ver cuánto cuesta de media sostener todo el sector público por persona.', { millones: formatNumber(params.gastoPublico.millones, { decimals: 0 }), year: params.gastoPublico.anio }) },
          ]} />
          <KeyList items={[...aportadoParts, ...usadoParts.filter((p) => p.value > 0), ...refParts]} />
        </div>

        <div className="sim-card">
          <h3 className="sim-card__title">{t('¿A dónde va lo que aportas?')}<StarMark /></h3>
          <p className="sim-card__lead">
            {t('Ni el IRPF ni las cotizaciones van «a la sanidad» o «a la educación»: el sector público lo gasta todo junto.')}{' '}
            {tx('Si se repartiera como el gasto público de {year}, de los {total} al mes que se lleva por tu trabajo, {salud} irían a sanidad y {edu} a educación.', {
              year: params.gastoPublico.anio, total: <strong>{formatEuro(b.aportadoAnual.total / 12)}</strong>, salud: <strong>{formatEuro(salud.mensual)}</strong>, edu: <strong>{formatEuro(educacion.mensual)}</strong>,
            })}
            <Tip title={t('Cómo se reparte')} short={t('Aplicamos a lo que aportas el porcentaje que cada función representa en el gasto total de las administraciones (IGAE, COFOG). Es un reparto ilustrativo, no una afectación legal de los impuestos.')} own />
          </p>
          <div className="sim-table-wrap">
            <table className="sim-table">
              <caption className="sr-only">{t('Reparto de lo aportado según el gasto público por funciones')}</caption>
              <thead><tr>{[t('Función del gasto público'), t('% del gasto'), t('Al mes'), t('Al año'), t('% de tu bruto')].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
              <tbody>
                {b.destino.map((x) => (
                  <tr key={x.codigo} className={FUNCIONES_RESALTADAS.has(x.codigo) ? 'sim-table__hl' : ''}>
                    <th scope="row"><span className="sim-table__label">{t(x.funcion)}</span></th>
                    <td>{formatShare(x.pct, 2)}</td><td>{formatEuro(x.mensual, { decimals: 2 })}</td><td>{formatEuro(x.anual)}</td><td>{formatShare(x.pctBruto, 2)}</td>
                  </tr>
                ))}
                <tr className="sim-table__total">
                  <th scope="row">{t('Total')}</th><td>{formatShare(100, 0)}</td>
                  <td>{formatEuro(b.aportadoAnual.total / 12, { decimals: 2 })}</td><td>{formatEuro(b.aportadoAnual.total)}</td><td>{formatShare(b.pctBrutoAdministraciones, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="sim-note">{t('Gasto público {year}: {millones} millones de € (IGAE, dato provisional).', { year: params.gastoPublico.anio, millones: formatNumber(params.gastoPublico.millones, { decimals: 0 }) })} {textos.cargas}</p>
        </div>
      </>
    );
  }

  return (
    <section className="sim-section" id="balance" aria-labelledby="h-balance">
      <header className="sim-section__head">
        <span className="sim-section__n" aria-hidden="true">3</span>
        <div>
          <h2 id="h-balance" tabIndex={-1}>{t('Lo que has aportado y lo que has usado')}</h2>
          <p>{t('Con los años que llevas trabajando, sumamos lo que ha ido al sector público por tu trabajo y lo comparamos con lo que has usado, incluido el paro si lo has cobrado.')}</p>
        </div>
      </header>

      <form className="sim-card sim-questions sim-questions--short" onSubmit={(e) => e.preventDefault()} aria-label={t('Años trabajando')}>
        {detallado ? null : (
          <>
            <NumberField label={t('¿Cuántos años llevas trabajando?')} unit={t('años')} value={form.aniosTrabajados} onChange={(v) => set('aniosTrabajados', v)} step="1" max={80}
              hint={t('Suponemos que siempre has cobrado lo que cobras hoy, en euros de hoy.')} warn={avisoDe('aniosTrabajados')} />
            <NumberField label={t('¿Cuántos meses has cobrado paro en total?')} unit={t('meses')} value={form.mesesParo} onChange={(v) => set('mesesParo', v)} step="1" max={120}
              hint={t('0 si nunca. Lo calculamos con tu sueldo de hoy; si quieres más precisión, detalla tu historial.')} warn={avisoDe('mesesParo')} />
          </>
        )}
        <label className="check-label sim-form__check">
          <input type="checkbox" className="check" checked={form.sanidadMedia} onChange={(e) => set('sanidadMedia', e.target.checked)} />
          <span>{t('Contar la sanidad como una persona media ({x} al año) en vez de lo que he contado', { x: formatEuro(params.salud.gastoPublicoPorHabitante) })}</span>
        </label>
        <label className="check-label sim-form__check">
          <input type="checkbox" className="check" checked={detallado} onChange={(e) => ctx.setHistorialActivo(e.target.checked)} />
          <span>{t('Quiero detallar mi historial laboral: sueldos distintos, autónomo o paro (opcional)')}</span>
        </label>
      </form>

      {detallado ? <EditorHistorial form={form} ctx={ctx} aviso={avisoDe('historial')} /> : null}

      <div className="sim-results">{resultados}</div>

      <details className="sim-details sim-details--assumptions">
        <summary>{t('Qué no cuenta este balance')}</summary>
        <ul>{NO_CUENTA.map((text) => <li key={text}>{t(text)}</li>)}</ul>
      </details>
    </section>
  );
}
