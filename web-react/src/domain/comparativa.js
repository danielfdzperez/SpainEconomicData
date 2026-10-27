/**
 * «Estado o privado»: qué te queda al año si pagas impuestos y usas los servicios públicos,
 * frente a un mundo imaginario sin impuestos en el que pagas tú todo a precios privados.
 *
 * Es un ejercicio de imaginación con muchos recortes (se explican en pantalla):
 *  - Con Estado: tu sueldo neto, menos lo que pagas tú directamente (matrícula, abono de transporte…).
 *  - Sin Estado: tu sueldo sin impuestos (bruto, o lo que cuestas a tu empresa), menos el equivalente
 *    privado de lo que has usado: seguro o visitas pagadas una a una, colegio privado y transporte sin ayudas.
 *  - Los servicios se promedian a lo largo de toda tu vida (total ÷ tu edad), no sólo de tus años de trabajo.
 *  - Sólo se sustituyen sanidad, educación y transporte. Lo demás que pagan tus impuestos (pensiones,
 *    paro, justicia, defensa, carreteras…) se muestra aparte, porque dejaría de existir o lo pagarías tú.
 */

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : 0;
};

/**
 * @param {object} args
 * @param {import('./economia.js').Economia} args.economia
 * @param {ReturnType<import('./services.js').calcularServicios>} args.servicios
 * @param {{base?:'bruto'|'coste', salud?:'seguro'|'visitas'}} [args.opciones]
 */
export function calcularComparativa({ economia, servicios, opciones = {} }) {
  const edad = servicios.edad;
  const meses = servicios.meses;
  const base = opciones.base === 'coste' ? 'coste' : 'bruto';
  const salud = opciones.salud === 'visitas' ? 'visitas' : 'seguro';
  const g = servicios.grupos;
  const porAnio = (x) => (edad > 0 ? x / edad : 0);

  // --- sueldo con y sin impuestos -------------------------------------------------
  const netoAnual = economia.netoMensual * 12;
  const brutoAnual = economia.brutoAnual;
  const ssEmpresa = n(economia.reparto.ssEmpresa);
  const costeAnual = brutoAnual + ssEmpresa;
  const sinImpuestosAnual = base === 'coste' ? costeAnual : brutoAnual;
  const impuestosAnual = n(economia.reparto.total);

  // --- con Estado: lo que sigues pagando de tu bolsillo ------------------------------
  const publica = {
    sueldoAnual: netoAnual,
    pagos: {
      salud: 0,
      educacion: porAnio(g.educacion.totales.pagoPersona),
      transporte: porAnio(g.transporte.totales.pagoPersona),
    },
  };
  publica.gastoAnual = publica.pagos.salud + publica.pagos.educacion + publica.pagos.transporte;
  publica.quedaAnual = publica.sueldoAnual - publica.gastoAnual;

  // --- sin Estado: todo a precio privado ---------------------------------------------
  const sg = servicios.seguro;
  const copagosAnual = sg.elegido === 'basico' ? porAnio(sg.copagos) : 0;
  const saludSeguro = sg.primaAnual + copagosAnual;
  const saludVisitas = porAnio(g.salud.totales.equivalentePrivado);
  const educacionAnual = porAnio(g.educacion.totales.equivalentePrivado);
  const transporteAnual = porAnio(g.transporte.totales.equivalentePrivado);

  const privada = (saludAnual) => {
    const totalAnual = saludAnual + educacionAnual + transporteAnual;
    return {
      gastos: { salud: saludAnual, educacion: educacionAnual, transporte: transporteAnual },
      gastoAnual: totalAnual,
      gastoMensual: totalAnual / 12,
      // total de toda la vida si se pagara en cuotas mensuales fijas (media mensual × meses de vida)
      totalVida: (totalAnual / 12) * meses,
      mensual: { salud: saludAnual / 12, educacion: educacionAnual / 12, transporte: transporteAnual / 12 },
    };
  };
  const conSeguro = privada(saludSeguro);
  const pagandoVisitas = privada(saludVisitas);
  const elegida = salud === 'seguro' ? conSeguro : pagandoVisitas;
  const privadaFinal = {
    ...elegida,
    sueldoAnual: sinImpuestosAnual,
    quedaAnual: sinImpuestosAnual - elegida.gastoAnual,
  };

  const diferenciaAnual = privadaFinal.quedaAnual - publica.quedaAnual;

  // --- lo que cubren tus impuestos y no entra en la comparación ----------------------
  const serviciosPublicoAnual = porAnio(servicios.totales.puestoSistema);
  const restoImpuestos = Math.max(0, impuestosAnual - serviciosPublicoAnual);

  return {
    edad, meses, base, salud,
    sueldo: {
      netoAnual, netoMensual: netoAnual / 12,
      brutoAnual, brutoMensual: brutoAnual / 12,
      ssEmpresa, costeAnual, costeMensual: costeAnual / 12,
      sinImpuestosAnual, sinImpuestosMensual: sinImpuestosAnual / 12,
      impuestosAnual,
      pctImpuestosSobreBruto: brutoAnual > 0 ? (impuestosAnual / brutoAnual) * 100 : 0,
    },
    publica: { ...publica, quedaMensual: publica.quedaAnual / 12, gastoMensual: publica.gastoAnual / 12 },
    privada: { ...privadaFinal, quedaMensual: privadaFinal.quedaAnual / 12 },
    cuotas: { conSeguro, pagandoVisitas, seguroMensual: sg.primaMensual, seguroTotal: sg.total },
    diferenciaAnual,
    diferenciaMensual: diferenciaAnual / 12,
    pctDiferencia: publica.quedaAnual > 0 ? (diferenciaAnual / publica.quedaAnual) * 100 : null,
    mejorPrivada: diferenciaAnual > 0,
    serviciosPublicoAnual,
    restoImpuestos,
  };
}
