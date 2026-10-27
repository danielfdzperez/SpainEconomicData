import { formatEuro, formatShare } from '../../core/format.js';
import { textoTramo } from '../../content/simTexts.js';
import { t } from '../../i18n/index.js';

export const e2 = (v) => formatEuro(v, { decimals: 2 });
export const neg = (v) => `−${e2(v)}`;
export const pctDe = (x, bruto) => (bruto > 0 ? formatShare((x / bruto) * 100, 2) : '—');
export const tipoTxt = (tipo) => (tipo == null ? '' : formatShare(tipo, 2));

export function Fila({ cls = '', label, tip, tipo, anual, mensual, pct }) {
  return (
    <tr className={cls}>
      <th scope="row"><span className="sim-table__label">{label}{tip}</span></th>
      <td>{tipo ?? ''}</td><td>{anual}</td><td>{mensual}</td><td>{pct}</td>
    </tr>
  );
}

export const Cabecera = ({ pctLabel = t('% del bruto') }) => (
  <thead><tr><th scope="col">{t('Concepto')}</th><th scope="col">{t('Tipo')}</th><th scope="col">{t('Al año')}</th><th scope="col">{t('Al mes')}</th><th scope="col">{pctLabel}</th></tr></thead>
);

export const Grupo = ({ children }) => <tr className="sim-table__group"><th colSpan={5} scope="colgroup">{children}</th></tr>;

export function Tabla({ caption, pctLabel, children }) {
  return (
    <div className="sim-table-wrap">
      <table className="sim-table">
        <caption className="sr-only">{caption}</caption>
        <Cabecera pctLabel={pctLabel} />
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Paso({ titulo, valor, texto, total }) {
  return (
    <li className={`steps__item ${total ? 'steps__item--total' : ''}`}>
      <div className="steps__row"><span className="steps__title">{titulo}</span><span className="steps__val">{valor}</span></div>
      {texto ? <p className="steps__text">{texto}</p> : null}
    </li>
  );
}

export function Escala({ nombre, parte, texto, minimoTxt }) {
  return (
    <div className="scale-table">
      <h4>{nombre}</h4>
      <p className="steps__text">{texto}</p>
      <div className="sim-table-wrap">
        <table className="sim-table sim-table--small">
          <thead><tr><th scope="col">{t('Tramo de base')}</th><th scope="col">{t('Tipo')}</th><th scope="col">{t('Tu base en el tramo')}</th><th scope="col">{t('Cuota')}</th></tr></thead>
          <tbody>
            {parte.tramos.map((tr) => (
              <tr key={tr.desde}><th scope="row">{textoTramo(tr)}</th><td>{formatShare(tr.tipo)}</td><td>{e2(tr.baseEnTramo)}</td><td>{e2(tr.cuota)}</td></tr>
            ))}
            <tr className="sim-table__sum"><th scope="row" colSpan={3}>{t('Cuota íntegra')}</th><td>{e2(parte.integra)}</td></tr>
            <tr><th scope="row" colSpan={3}>{t('Menos la cuota del mínimo personal ({x})', { x: e2(parte.minimoPersonal) })}</th><td>{neg(parte.minimo)}</td></tr>
            <tr className="sim-table__sum"><th scope="row" colSpan={3}>{t('Cuota a pagar')}</th><td>{e2(parte.cuota)}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="steps__text">{minimoTxt}</p>
    </div>
  );
}
