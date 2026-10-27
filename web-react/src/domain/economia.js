/**
 * «Economía» de una persona: lo que necesitan el balance, el paro y los porcentajes del sueldo,
 * con la misma forma tanto si es asalariada (nómina) como autónoma (RETA).
 *
 * @typedef {object} Economia
 * @property {'asalariado'|'autonomo'} regimen
 * @property {number} brutoAnual             Sueldo bruto anual (asalariado) o rendimiento antes de cuota e IRPF (autónomo).
 * @property {number} brutoMensual           Lo anterior ÷ 12.
 * @property {number} netoMensual
 * @property {number} baseMensual            Base de cotización mensual (la que sirve para calcular el paro).
 * @property {{irpf:number, ssTrabajador:number, ssEmpresa:number, total:number}} reparto  Lo que va al sector público en un año.
 * @property {{tipo:'desempleo'|'cese', etiqueta:string, trabajador:number, empresa:number, total:number}} paro  Lo que se cotiza al año para el paro.
 */

const idDesempleo = (i) => i.id.startsWith('desempleo');

/** @param {ReturnType<import('./payroll.js').calcularNomina>} nomina @returns {Economia} */
export function economiaDeNomina(nomina) {
  const r = nomina.reparto;
  const trabajador = nomina.trabajador.ss.items.filter(idDesempleo).reduce((s, i) => s + i.importe, 0);
  const empresa = nomina.empresa.ss.items.filter(idDesempleo).reduce((s, i) => s + i.importe, 0);
  return {
    regimen: 'asalariado',
    brutoAnual: nomina.bruto.anual,
    brutoMensual: nomina.bruto.prorrateadoMensual,
    netoMensual: nomina.trabajador.neto.mensual,
    baseMensual: nomina.base.mensual,
    reparto: { irpf: r.irpf, ssTrabajador: r.ssTrabajador, ssEmpresa: r.ssEmpresa, total: r.aLasAdministraciones },
    paro: { tipo: 'desempleo', etiqueta: 'Desempleo', trabajador, empresa, total: trabajador + empresa },
  };
}

/** @param {ReturnType<import('./autonomo.js').calcularAutonomo>} aut @returns {Economia} */
export function economiaDeAutonomo(aut) {
  const r = aut.reparto;
  const cese = aut.cuota.items.find((i) => i.id === 'cese_actividad')?.importe ?? 0;
  return {
    regimen: 'autonomo',
    brutoAnual: aut.bruto.anual,
    brutoMensual: aut.bruto.prorrateadoMensual,
    netoMensual: aut.neto.mensual,
    baseMensual: aut.base.mensual,
    reparto: { irpf: r.irpf, ssTrabajador: r.ssTrabajador, ssEmpresa: 0, total: r.aLasAdministraciones },
    paro: { tipo: 'cese', etiqueta: 'Cese de actividad', trabajador: cese, empresa: 0, total: cese },
  };
}
