/**
 * Uso de servicios públicos a lo largo de la vida: sanidad, educación y transporte.
 *
 * Para cada servicio se calculan cuatro cifras, siempre en euros de hoy:
 *  - costePublico:  lo que cuesta el servicio dentro del sistema público (tarifa o gasto por alumno).
 *  - pagoPersona:   lo que pagó la propia persona (matrícula, abono, cuota del colegio privado…).
 *  - puestoSistema: lo que puso el sistema por ella (coste menos lo que pagó).
 *  - equivalentePrivado: lo que habría costado pagándolo a precios privados.
 *
 * Todo es una estimación nuestra: multiplicamos veces declaradas por precios medios.
 */

export const GRUPOS = ['salud', 'educacion', 'transporte'];

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : 0;
};

/**
 * Líneas de sanidad: [id de ítem, etiqueta, unidad, cantidad de toda la vida].
 * Las tres consultas pueden venir «al año» (se multiplican por la edad; es lo que se supone si no se
 * dice nada) o ya «en toda la vida» (`salud.frecuenciaModo === 'vida'`).
 */
export function lineasSalud(entrada, edad) {
  const s = entrada.salud ?? {};
  const partos = n(s.partos);
  const cesareas = Math.min(n(s.cesareas), partos);
  const veces = (v) => (s.frecuenciaModo === 'vida' ? n(v) : n(v) * edad);
  return [
    { item: 'cabecera', label: 'Médico de cabecera', unidad: 'consulta', cantidad: veces(s.cabecera) },
    { item: 'enfermeria', label: 'Enfermería (curas, vacunas, controles)', unidad: 'consulta', cantidad: veces(s.enfermeria) },
    { item: 'especialista', label: 'Especialista en el hospital', unidad: 'consulta', cantidad: veces(s.especialista) },
    { item: 'urgencias', label: 'Urgencias', unidad: 'visita', cantidad: n(s.urgencias) },
    { item: 'nocheHospital', label: 'Noches en el hospital', unidad: 'noche', cantidad: n(s.nochesHospital) },
    { item: 'nocheUci', label: 'Noches en la UCI', unidad: 'noche', cantidad: n(s.nochesUci) },
    { item: 'partoNatural', label: 'Partos naturales', unidad: 'parto', cantidad: partos - cesareas },
    { item: 'partoCesarea', label: 'Cesáreas', unidad: 'parto', cantidad: cesareas },
    { item: 'resonancia', label: 'Resonancias magnéticas', unidad: 'prueba', cantidad: n(s.resonancias) },
    { item: 'ecografia', label: 'Ecografías', unidad: 'prueba', cantidad: n(s.ecografias) },
  ];
}

function calcSalud(entrada, edad, p) {
  const lineas = lineasSalud(entrada, edad).map((l) => {
    const precios = p.salud.items[l.item];
    const costePublico = l.cantidad * precios.publico.valor;
    return {
      id: l.item, grupo: 'salud', label: l.label, unidad: l.unidad, cantidad: l.cantidad,
      precioPublico: precios.publico, precioPrivado: precios.privado,
      costePublico, pagoPersona: 0, puestoSistema: costePublico,
      equivalentePrivado: l.cantidad * precios.privado.valor,
      proxyPrivado: Boolean(precios.privado.proxy),
    };
  });
  const consultas = lineas.filter((l) => l.unidad === 'consulta' || l.unidad === 'visita').reduce((s, l) => s + l.cantidad, 0);
  const nochesHospital = n(entrada.salud?.nochesHospital) + n(entrada.salud?.nochesUci);
  return { lineas, consultas, noches: nochesHospital };
}

function calcEducacion(entrada, p) {
  const e = p.educacion;
  const filas = entrada.educacion ?? [];
  const lineas = [];
  for (const etapa of e.etapas) {
    const f = filas.find((x) => x.etapa === etapa.id);
    const anios = n(f?.anios);
    if (anios === 0) continue;
    const centro = f?.centro === 'privada' ? 'privada' : 'publica';
    const costePublico = anios * etapa.publico.gastoAlumno;
    const equivalentePrivado = anios * etapa.privado.anual;
    const matricula = anios * etapa.publico.matriculaAnual;
    const pagoPersona = centro === 'privada' ? equivalentePrivado : matricula;
    const puestoSistema = centro === 'privada' ? 0 : costePublico - matricula;
    lineas.push({
      id: etapa.id, grupo: 'educacion', label: etapa.label, unidad: 'año', cantidad: anios, centro,
      precioPublico: etapa.publico, precioPrivado: etapa.privado,
      costePublico, pagoPersona, puestoSistema, equivalentePrivado, proxyPrivado: false,
      matriculaPublica: matricula,
    });
  }
  const anios = lineas.reduce((s, l) => s + l.cantidad, 0);
  return { lineas, anios };
}

function calcTransporte(entrada, p) {
  const t = p.transporte;
  const viajesSemana = n(entrada.transporte?.viajesSemana);
  const anios = n(entrada.transporte?.anios);
  const viajesAnio = viajesSemana * 52;
  const viajes = viajesAnio * anios;
  const costePublico = viajes * t.costeViaje;
  // el usuario elige lo más barato entre el abono mensual y el bono por viaje
  const viajesMes = viajesAnio / 12;
  const pagoMes = Math.min(t.abonoMensual, viajesMes * t.bonoViaje);
  const pagoPersona = Math.min(costePublico, pagoMes * 12 * anios);
  const linea = {
    id: 'transporte', grupo: 'transporte', label: 'Transporte público (Madrid)', unidad: 'viaje', cantidad: viajes,
    precioPublico: { valor: t.costeViaje, territorio: t.territorio, anio: t.anio },
    precioPrivado: { valor: t.costeViaje, proxy: true },
    costePublico, pagoPersona, puestoSistema: costePublico - pagoPersona,
    // no hay «transporte privado» comparable: se muestra lo que costaría sin ayudas públicas
    equivalentePrivado: costePublico, proxyPrivado: true,
  };
  return { lineas: viajes > 0 ? [linea] : [], viajes, pagoMes };
}

const suma = (ls, k) => ls.reduce((s, l) => s + l[k], 0);

/**
 * @param {object} entrada {edad, salud:{…}, educacion:[{etapa,anios,centro}], transporte:{viajesSemana,anios}}
 * @param {import('../data/simParams.js').SimParams} p
 * @param {{brutoProrrateado:number, netoMensual:number}} [sueldo] para expresar los costes como % del sueldo
 */
export function calcularServicios(entrada, p, sueldo) {
  const edad = Math.max(0, Math.min(120, n(entrada.edad)));
  const salud = calcSalud(entrada, edad, p);
  const educacion = calcEducacion(entrada, p);
  const transporte = calcTransporte(entrada, p);
  const grupos = { salud, educacion, transporte };

  const todas = [...salud.lineas, ...educacion.lineas, ...transporte.lineas];
  const totales = {
    costePublico: suma(todas, 'costePublico'),
    pagoPersona: suma(todas, 'pagoPersona'),
    puestoSistema: suma(todas, 'puestoSistema'),
    equivalentePrivado: suma(todas, 'equivalentePrivado'),
  };
  for (const g of GRUPOS) {
    const ls = grupos[g].lineas;
    grupos[g].totales = {
      costePublico: suma(ls, 'costePublico'), pagoPersona: suma(ls, 'pagoPersona'),
      puestoSistema: suma(ls, 'puestoSistema'), equivalentePrivado: suma(ls, 'equivalentePrivado'),
    };
  }

  // la comparación pública/privada de la educación no depende de dónde estudió la persona
  const meses = edad * 12;
  const mensual = meses > 0
    ? {
      costePublico: totales.costePublico / meses,
      equivalentePrivado: totales.equivalentePrivado / meses,
      pagoPersona: totales.pagoPersona / meses,
      puestoSistema: totales.puestoSistema / meses,
    }
    : { costePublico: 0, equivalentePrivado: 0, pagoPersona: 0, puestoSistema: 0 };

  const pctDe = (x, base) => (base > 0 ? (x / base) * 100 : 0);
  const porcentajes = sueldo
    ? {
      costePublicoBruto: pctDe(mensual.costePublico, sueldo.brutoProrrateado),
      equivalentePrivadoBruto: pctDe(mensual.equivalentePrivado, sueldo.brutoProrrateado),
      costePublicoNeto: pctDe(mensual.costePublico, sueldo.netoMensual),
      equivalentePrivadoNeto: pctDe(mensual.equivalentePrivado, sueldo.netoMensual),
    }
    : null;

  // seguro de salud privado como alternativa a pagar cada servicio suelto
  const seg = p.salud.seguro;
  const opcionSeguro = (id, label, precio) => {
    const primaMensual = precio.valor;
    const primaAnual = primaMensual * 12;
    const total = primaMensual * meses;
    return {
      id, label, primaMensual, primaAnual, total,
      minAnual: precio.min * 12, maxAnual: precio.max * 12,
      fuente: precio.fuente, fiabilidad: precio.fiabilidad, nota: precio.nota,
      pctBruto: sueldo ? pctDe(primaMensual, sueldo.brutoProrrateado) : null,
      pctNeto: sueldo ? pctDe(primaMensual, sueldo.netoMensual) : null,
    };
  };
  const opcionesSeguro = [
    opcionSeguro('basico', 'Seguro de entrada (con copagos)', seg.primaMensual),
    opcionSeguro('completo', 'Seguro con cobertura de parto', seg.primaMensualConParto),
  ];
  const elegido = opcionesSeguro.find((o) => o.id === entrada.seguroTipo) ?? opcionesSeguro[0];
  const seguro = {
    primaMensual: elegido.primaMensual,
    primaAnual: elegido.primaAnual,
    total: elegido.total,
    copago: seg.copago.valor,
    copagos: salud.consultas * seg.copago.valor,
    elegido: elegido.id,
    opciones: opcionesSeguro,
    // lo que cuesta al año lo que has contado en la pública (comparable con la prima anual)
    publicoAlAnio: edad > 0 ? grupos.salud.totales.costePublico / edad : 0,
  };

  // lo que cuesta de media un habitante a la sanidad pública (incluye medicamentos, ingresos, pruebas…)
  const referenciaSalud = { porHabitante: p.salud.gastoPublicoPorHabitante, vida: p.salud.gastoPublicoPorHabitante * edad };

  return { edad, meses, grupos, lineas: todas, totales, mensual, porcentajes, seguro, referenciaSalud };
}

/** Valores de partida: la media nacional para las consultas y una trayectoria escolar típica. */
export function entradaPorDefecto(p) {
  return {
    edad: 40,
    aniosTrabajados: 15,
    salud: {
      cabecera: p.salud.frecuenciaMedia.cabecera,
      enfermeria: p.salud.frecuenciaMedia.enfermeria,
      especialista: p.salud.frecuenciaMedia.especialista,
      urgencias: 0, nochesHospital: 0, nochesUci: 0, partos: 0, cesareas: 0, resonancias: 0, ecografias: 0,
    },
    educacion: p.educacion.etapas.map((e) => ({ etapa: e.id, anios: e.defecto, centro: 'publica' })),
    transporte: { viajesSemana: 8, anios: 20 },
  };
}
