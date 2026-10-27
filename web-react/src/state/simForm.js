import { formatEuro, formatInt } from '../core/format.js';
import { t } from '../i18n/index.js';

/**
 * Formulario del simulador: lo que escribe la persona (cadenas, para poder dejar un campo vacío
 * mientras teclea) y su traducción a las entradas numéricas del dominio.
 */

/** Convierte lo escrito en número; acepta coma decimal. Vacío o raro → `fallback`. */
export function num(value, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const text = String(value ?? '').trim().replace(',', '.');
  if (text === '') return fallback;
  const x = Number(text);
  return Number.isFinite(x) ? x : fallback;
}

/** Actividad por defecto (CNAE 62, informática): tiene el tipo mínimo de AT/EP, 1,50 %. */
export const ACTIVIDAD_POR_DEFECTO = '62';
const AT_EP_MINIMO = 1.5;

const EDAD_POR_DEFECTO = 40;
const redondeo = (x) => Math.round(x * 10) / 10;

/** @param {import('../data/simParams.js').SimParams} p */
export function defaultForm(p) {
  const media = p.salud.frecuenciaMedia;
  return {
    regimen: 'asalariado',
    sueldo: '2000',
    pagas: 14,
    contrato: 'indefinido',
    jornadaCompleta: true,
    actividad: ACTIVIDAD_POR_DEFECTO,
    ingresosAut: '3000',
    gastosAut: '500',

    edad: String(EDAD_POR_DEFECTO),
    // las consultas se piden por defecto «en toda la vida»: la media nacional × la edad de partida
    frecuenciaModo: 'vida',
    cabecera: String(redondeo(media.cabecera * EDAD_POR_DEFECTO)),
    enfermeria: String(redondeo(media.enfermeria * EDAD_POR_DEFECTO)),
    especialista: String(redondeo(media.especialista * EDAD_POR_DEFECTO)),
    seguroTipo: 'basico',
    urgencias: '0', nochesHospital: '0', nochesUci: '0', partos: '0', cesareas: '0', resonancias: '0', ecografias: '0',
    educacion: Object.fromEntries(p.educacion.etapas.map((e) => [e.id, { anios: String(e.defecto), centro: 'publica' }])),
    viajesSemana: '8',
    aniosTransporte: '20',

    aniosTrabajados: '15',
    sanidadMedia: false,
    mesesParo: '0',
    historialActivo: false,
    historial: [],

    // apartado «Estado o privado»
    comparaBase: 'bruto',
    comparaSalud: 'seguro',
  };
}

const CAMPOS_FRECUENCIA = ['cabecera', 'enfermeria', 'especialista'];

/**
 * Cambia entre «veces al año» y «veces en toda la vida» conservando lo que la persona ya había
 * escrito (al año × edad = en la vida). Sin edad sólo cambia el modo.
 */
export function cambiarFrecuenciaModo(form, modo) {
  const nuevo = modo === 'anio' ? 'anio' : 'vida';
  if (nuevo === form.frecuenciaModo) return form;
  const edad = num(form.edad);
  const out = { ...form, frecuenciaModo: nuevo };
  if (edad > 0) {
    for (const k of CAMPOS_FRECUENCIA) {
      if (String(form[k]).trim() === '') continue;
      const v = num(form[k]);
      out[k] = String(nuevo === 'vida' ? Math.round(v * edad) : redondeo(v / edad));
    }
  }
  return out;
}

// ---------------------------------------------------------------- historial laboral (opcional)

let contadorPeriodos = 0;
const nuevoId = () => `p${++contadorPeriodos}`;

/** Un periodo en blanco para el formulario. `importe` es el sueldo bruto de una paga o la facturación mensual. */
export function nuevoPeriodo(tipo = 'trabajo', valores = {}) {
  return { id: nuevoId(), tipo, importe: tipo === 'paro' ? '' : '2000', pagas: 14, gastos: '0', anios: '1', ...valores };
}

/** El ejemplo de la ayuda: 1.400 € durante 5 años, 2.500 € durante 3, un año de paro y 5.000 € durante 3. */
export function ejemploHistorial() {
  return [
    nuevoPeriodo('trabajo', { importe: '1400', anios: '5' }),
    nuevoPeriodo('trabajo', { importe: '2500', anios: '3' }),
    nuevoPeriodo('paro', { importe: '', anios: '1' }),
    nuevoPeriodo('trabajo', { importe: '5000', anios: '3' }),
  ];
}

/** Al activar el historial se parte de lo que ya hay: el trabajo de hoy durante los años indicados. */
export function historialInicial(form) {
  return [nuevoPeriodo(form.regimen === 'autonomo' ? 'autonomo' : 'trabajo', {
    importe: form.regimen === 'autonomo' ? form.ingresosAut : form.sueldo,
    pagas: Number(form.pagas) === 12 ? 12 : 14,
    gastos: form.gastosAut,
    anios: form.aniosTrabajados,
  })];
}

/** Datos del contrato que valen para todos los empleos del historial (el sueldo y las pagas van en cada fila). */
export function contextoContrato(form, p) {
  return { contrato: form.contrato === 'temporal' ? 'temporal' : 'indefinido', atEp: tipoAtEp(form, p), jornadaCompleta: form.jornadaCompleta !== false };
}

/**
 * Periodos numéricos para el dominio. Sin historial detallado es un único periodo: el trabajo de hoy
 * durante los años indicados (nunca más que la edad).
 */
export function periodosInput(form) {
  if (form.historialActivo) {
    return form.historial.map((f) => ({
      tipo: f.tipo,
      anios: Math.max(0, num(f.anios)),
      brutoMensual: Math.max(0, num(f.importe)),
      pagas: Number(f.pagas) === 12 ? 12 : 14,
      ingresosMensuales: Math.max(0, num(f.importe)),
      gastosMensuales: Math.max(0, num(f.gastos)),
    }));
  }
  const autonomo = form.regimen === 'autonomo';
  return [{
    tipo: autonomo ? 'autonomo' : 'trabajo',
    anios: Math.max(0, Math.min(num(form.aniosTrabajados), num(form.edad))),
    brutoMensual: Math.max(0, num(form.sueldo)),
    pagas: Number(form.pagas) === 12 ? 12 : 14,
    ingresosMensuales: Math.max(0, num(form.ingresosAut)),
    gastosMensuales: Math.max(0, num(form.gastosAut)),
  }];
}

export function autonomoInput(form) {
  return { ingresosMensuales: Math.max(0, num(form.ingresosAut)), gastosMensuales: Math.max(0, num(form.gastosAut)) };
}

/** Tipo de AT/EP (%) de la actividad elegida; si no se encuentra, el mínimo. */
export function tipoAtEp(form, p) {
  return p.nomina.atEp.find((a) => a.cnae === form.actividad)?.total ?? AT_EP_MINIMO;
}

export function nominaInput(form, p) {
  return {
    brutoMensual: Math.max(0, num(form.sueldo)),
    pagas: Number(form.pagas) === 12 ? 12 : 14,
    contrato: form.contrato === 'temporal' ? 'temporal' : 'indefinido',
    atEp: tipoAtEp(form, p),
    jornadaCompleta: form.jornadaCompleta !== false,
  };
}

export function serviciosInput(form) {
  return {
    edad: num(form.edad),
    seguroTipo: form.seguroTipo === 'completo' ? 'completo' : 'basico',
    salud: {
      frecuenciaModo: form.frecuenciaModo === 'anio' ? 'anio' : 'vida',
      cabecera: num(form.cabecera), enfermeria: num(form.enfermeria), especialista: num(form.especialista),
      urgencias: num(form.urgencias), nochesHospital: num(form.nochesHospital), nochesUci: num(form.nochesUci),
      partos: num(form.partos), cesareas: num(form.cesareas), resonancias: num(form.resonancias), ecografias: num(form.ecografias),
    },
    educacion: Object.entries(form.educacion).map(([etapa, v]) => ({ etapa, anios: num(v.anios), centro: v.centro })),
    transporte: { viajesSemana: num(form.viajesSemana), anios: num(form.aniosTransporte) },
  };
}

/**
 * Avisos que no bloquean nada: cosas que probablemente sean un despiste.
 * @returns {{campo:string, texto:string}[]}
 */
export function avisos(form, p) {
  const out = [];
  const edad = num(form.edad);
  const autonomo = form.regimen === 'autonomo';
  const sueldo = num(form.sueldo);
  const anual = sueldo * (Number(form.pagas) === 12 ? 12 : 14);
  if (autonomo) {
    const ingresos = num(form.ingresosAut);
    if (ingresos <= 0) out.push({ campo: 'ingresosAut', texto: t('Escribe lo que facturas al mes (sin IVA) para ver el cálculo.') });
    else if (num(form.gastosAut) > ingresos) out.push({ campo: 'gastosAut', texto: t('Tus gastos superan a tus ingresos: el rendimiento sería cero.') });
    if (ingresos * 12 > p.autonomo.limiteSimplificada) out.push({ campo: 'ingresosAut', texto: t('Con más de {x} al año no se puede usar la estimación directa simplificada que suponemos.', { x: formatEuro(p.autonomo.limiteSimplificada) }) });
  } else if (sueldo <= 0) out.push({ campo: 'sueldo', texto: t('Escribe tu sueldo bruto para ver el cálculo.') });
  else if (form.jornadaCompleta !== false && anual < p.nomina.ss.baseMinimaMensual * 12 - 1) {
    out.push({ campo: 'sueldo', texto: t('Con jornada completa se cotiza como mínimo por {x} al mes. Si trabajas menos horas, desmarca «Jornada completa».', { x: formatEuro(p.nomina.ss.baseMinimaMensual, { decimals: 2 }) }) });
  }
  if (!autonomo && sueldo > 0 && anual > 1_000_000) out.push({ campo: 'sueldo', texto: t('Es un sueldo muy alto: revisa que sea el bruto de UNA paga, no el anual.') });
  if (edad > 110) out.push({ campo: 'edad', texto: t('Revisa la edad.') });
  const trabajados = form.historialActivo
    ? form.historial.reduce((suma, f) => suma + num(f.anios), 0)
    : num(form.aniosTrabajados);
  if (edad > 0 && trabajados > edad - 14) {
    out.push(form.historialActivo
      ? { campo: 'historial', texto: t('Los periodos suman {n} años y con {edad} años de edad parece demasiado: reducimos lo aportado en proporción.', { n: formatInt(trabajados), edad: formatInt(edad) }) }
      : { campo: 'aniosTrabajados', texto: t('Con {edad} años, {n} de trabajo parece mucho: contamos como máximo {edad} años.', { edad: formatInt(edad), n: formatInt(trabajados) }) });
  }
  const escolares = Object.values(form.educacion).reduce((s, v) => s + num(v.anios), 0);
  if (edad > 0 && escolares > edad - 2) out.push({ campo: 'educacion', texto: t('Los años de estudio son casi toda tu edad: revisa las etapas.') });
  if (edad > 0 && num(form.aniosTransporte) > edad) out.push({ campo: 'aniosTransporte', texto: t('No puedes llevar más años usando el transporte que años de vida.') });
  if (!form.historialActivo && num(form.mesesParo) > 120) out.push({ campo: 'mesesParo', texto: t('Son más de 10 años en paro: revisa la cifra (cuenta los meses, no los años).') });
  return out;
}
