/**
 * Convierte los CSV de `datos_web` (ya parseados a objetos) en los parámetros del simulador.
 * Es una función pura: no lee ficheros ni red. Cada precio conserva su fuente, año, tipo de
 * dato y fiabilidad para que la interfaz pueda enseñar de dónde sale.
 *
 * Reglas de decisión (documentadas en AIDocs/web.md):
 *  - Sanidad: tarifas de Madrid 2023 cuando existen; si no, la que haya (Navarra, País Vasco).
 *  - Si no hay precio privado fiable, el precio privado es el público (proxy) y se marca `proxy`.
 *  - Educación: los importes por nivel son de 2019 (España); se llevan a Madrid 2023 con un factor.
 */
import { lit } from '../i18n/index.js';

export const NOMBRES_CONCEPTO = {
  contingencias_comunes: lit('Contingencias comunes'),
  desempleo_indefinido: lit('Desempleo'),
  desempleo_temporal: lit('Desempleo'),
  fogasa: lit('FOGASA'),
  formacion_profesional: lit('Formación profesional'),
  mei_mecanismo_equidad_intergeneracional: lit('MEI (Mecanismo de Equidad Intergeneracional)'),
};

const CONCEPTOS_POR_CONTRATO = {
  indefinido: ['contingencias_comunes', 'desempleo_indefinido', 'fogasa', 'formacion_profesional', 'mei_mecanismo_equidad_intergeneracional'],
  temporal: ['contingencias_comunes', 'desempleo_temporal', 'fogasa', 'formacion_profesional', 'mei_mecanismo_equidad_intergeneracional'],
};

/** Nombre de cada tabla CSV que necesita el simulador (sin extensión). */
export const SIM_TABLES = [
  'irpf_parametros', 'irpf_escala_estatal', 'irpf_escala_autonomica_madrid',
  'cotizaciones_ss_tipos_2026', 'cotizaciones_ss_bases_2026', 'cotizacion_solidaridad_2026',
  'cotizacion_at_ep_ejemplos_2026', 'cotizaciones_parametros_2026',
  'gasto_publico_cofog_2024', 'sanidad_costes_servicios', 'sanidad_gasto_agregado',
  'educacion_gasto_por_alumno', 'educacion_precios_familias',
  'transporte_costes', 'transporte_tarifas_madrid_2026',
  'ejemplos_validacion_irpf_ss_2026',
  'desempleo_duracion', 'desempleo_parametros_2026',
  'autonomos_cotizacion_2026', 'autonomos_parametros_2026', 'autonomos_cese_actividad_duracion',
];

const num = (v) => (v === '' || v == null ? null : Number(v));

function need(v, what) {
  if (v === undefined || v === null || Number.isNaN(v)) throw new Error(`Falta un parámetro del simulador: ${what}`);
  return v;
}

function byKey(rows, key, what) {
  const m = new Map(rows.map((r) => [r[key], r]));
  return (k) => need(m.get(k), `${what} · ${k}`);
}

function scale(rows) {
  return rows.map((r) => ({ desde: Number(r.desde), hasta: num(r.hasta), tipo: Number(r.tipo_pct), acumulada: Number(r.cuota_acumulada_en_desde) }));
}

/** Un precio con su procedencia. */
function precio(row, extra = {}) {
  need(row, 'precio');
  return {
    valor: Number(row.valor_central_eur),
    min: Number(row.importe_min_eur),
    max: Number(row.importe_max_eur),
    unidad: row.unidad,
    territorio: row.territorio,
    anio: row.anio,
    fuente: row.fuente_id,
    tipoDato: row.tipo_dato,
    fiabilidad: row.fiabilidad,
    nota: row.nota || row.descripcion || '',
    proxy: false,
    ...extra,
  };
}

function find(rows, servicio, ambito, territorio) {
  const r = rows.find((x) => x.servicio === servicio && x.ambito === ambito && (territorio === undefined || x.territorio === territorio));
  return need(r, `sanidad ${servicio}/${ambito}/${territorio ?? '*'}`);
}

/** Media de varias fuentes privadas del mismo servicio. */
function mediaPrivada(rows, servicio) {
  const rs = rows.filter((x) => x.servicio === servicio && x.ambito === 'privado_precio');
  need(rs.length ? rs : null, `sanidad privado ${servicio}`);
  const vals = rs.map((r) => Number(r.valor_central_eur));
  return {
    valor: vals.reduce((a, b) => a + b, 0) / vals.length,
    min: Math.min(...rs.map((r) => Number(r.importe_min_eur))),
    max: Math.max(...rs.map((r) => Number(r.importe_max_eur))),
    unidad: rs[0].unidad,
    territorio: rs[0].territorio,
    anio: rs[0].anio,
    fuente: [...new Set(rs.map((r) => r.fuente_id))].join(', '),
    tipoDato: rs[0].tipo_dato,
    fiabilidad: rs[0].fiabilidad,
    nota: rs.length > 1 ? `Media de ${rs.length} fuentes (${vals.join(' y ')} €).` : rs[0].nota,
    proxy: false,
  };
}

/** Si no hay precio privado, usa el público y lo dice. */
function conProxy(publico) {
  return { ...publico, proxy: true, nota: 'Sin precio privado fiable: se usa el mismo importe que en la pública.' };
}

function buildNomina(t) {
  const par = byKey(t.irpf_parametros, 'parametro', 'irpf_parametros');
  const cpar = byKey(t.cotizaciones_parametros_2026, 'parametro', 'cotizaciones_parametros_2026');
  const tipos = byKey(t.cotizaciones_ss_tipos_2026, 'concepto', 'cotizaciones_ss_tipos_2026');
  const grupo47 = need(t.cotizaciones_ss_bases_2026.find((r) => r.grupo_cotizacion === '4'), 'base grupo 4');

  const conceptos = {};
  for (const [contrato, ids] of Object.entries(CONCEPTOS_POR_CONTRATO)) {
    conceptos[contrato] = ids.map((id) => {
      const r = tipos(id);
      return { id, label: NOMBRES_CONCEPTO[id] ?? id, empresa: Number(r.tipo_empresa_pct), trabajador: Number(r.tipo_trabajador_pct), paraQueSirve: r.para_que_sirve };
    });
  }

  const solidaridad = t.cotizacion_solidaridad_2026.map((r) => ({
    desde: Number(r.tramo_desde_eur_mes), hasta: num(r.tramo_hasta_eur_mes),
    total: Number(r.tipo_total_pct), empresa: Number(r.tipo_empresa_pct), trabajador: Number(r.tipo_trabajador_pct),
  }));

  const tope = Number(cpar('tope_maximo_cotizacion_mensual').valor);

  return {
    anio: 2026,
    irpf: {
      gastoDeducible: Number(par('gasto_deducible_general').valor),
      reduccion: {
        umbral1: Number(par('reduccion_rt_umbral1').valor), max: Number(par('reduccion_rt_importe_max').valor),
        umbral2: Number(par('reduccion_rt_umbral2').valor), coef2: Number(par('reduccion_rt_coef_tramo2').valor),
        valorUmbral2: Number(par('reduccion_rt_valor_en_umbral2').valor),
        umbral3: Number(par('reduccion_rt_umbral3').valor), coef3: Number(par('reduccion_rt_coef_tramo3').valor),
      },
      minimoEstatal: Number(par('minimo_personal_estatal').valor),
      minimoAutonomico: Number(par('minimo_personal_madrid_autonomico').valor),
      escalaEstatal: scale(t.irpf_escala_estatal),
      escalaAutonomica: scale(t.irpf_escala_autonomica_madrid),
    },
    ss: {
      conceptos,
      baseMinimaMensual: Number(grupo47.base_minima),
      baseMaximaMensual: tope,
      solidaridad,
      // textos que se traducen al pintarlos; {tope} se rellena con baseMaximaMensual
      solidaridadTexto: lit('Se paga sólo por la parte de la retribución mensual que supera el tope máximo de cotización ({tope} al mes): la empresa asume unos 5/6 y el trabajador 1/6.'),
      atEpTexto: lit('Cubre los accidentes de trabajo y las enfermedades profesionales (baja, incapacidad, muerte y supervivencia). La paga la empresa y su tipo depende de la actividad.'),
    },
    atEp: t.cotizacion_at_ep_ejemplos_2026.map((r) => ({ cnae: r.cnae_2025, actividad: r.actividad, sector: r.sector, total: Number(r.tipo_total_pct) })),
    ejemplos: t.ejemplos_validacion_irpf_ss_2026,
  };
}

function buildSalud(t) {
  const s = t.sanidad_costes_servicios;
  const agg = byKey(t.sanidad_gasto_agregado, 'indicador', 'sanidad_gasto_agregado');
  const madrid = (servicio) => precio(find(s, servicio, 'publico_tarifa_a_terceros', 'Madrid'));

  const cabecera = { publico: madrid('consulta_atencion_primaria'), privado: mediaPrivada(s, 'consulta_atencion_primaria') };
  const enfermeria = { publico: precio(find(s, 'cura_enfermeria', 'publico_tarifa_a_terceros', 'País Vasco')) };
  enfermeria.privado = conProxy(enfermeria.publico);
  const especialista = { publico: madrid('consulta_especialista_primera'), privado: precio(find(s, 'consulta_especialista_primera', 'privado_precio')) };
  const urgencias = { publico: madrid('urgencias'), privado: precio(find(s, 'urgencias', 'privado_precio')) };

  const nocheHospital = { publico: precio(find(s, 'dia_hospitalizacion', 'publico_coste_real', 'España')) };
  nocheHospital.privado = conProxy(nocheHospital.publico);
  const nocheUci = { publico: precio(find(s, 'dia_uci', 'publico_tarifa_a_terceros', 'Navarra')) };
  nocheUci.privado = conProxy(nocheUci.publico);

  const partoPublico = precio(find(s, 'parto', 'publico_tarifa_a_terceros', 'Navarra'));
  const partoNatural = { publico: partoPublico, privado: precio(find(s, 'parto_natural', 'privado_precio')) };
  const partoCesarea = { publico: partoPublico, privado: precio(find(s, 'parto_cesarea', 'privado_precio')) };

  const resonancia = { publico: precio(find(s, 'resonancia_magnetica', 'publico_tarifa_a_terceros', 'Navarra')), privado: precio(find(s, 'resonancia_magnetica', 'privado_precio')) };
  const ecografia = { publico: precio(find(s, 'ecografia', 'publico_tarifa_a_terceros', 'Navarra')), privado: precio(find(s, 'ecografia', 'privado_precio')) };

  return {
    items: { cabecera, enfermeria, especialista, urgencias, nocheHospital, nocheUci, partoNatural, partoCesarea, resonancia, ecografia },
    frecuenciaMedia: {
      cabecera: Number(agg('consultas_medicas_ap_por_habitante').valor),
      enfermeria: Number(agg('consultas_enfermeria_ap_por_habitante').valor),
      especialista: Number(agg('consultas_hospital_por_habitante').valor),
    },
    gastoPublicoPorHabitante: Number(agg('gasto_sanitario_publico_por_habitante').valor),
    gastoTotalPorHabitante: Number(agg('gasto_sanitario_total_por_habitante').valor),
    seguro: {
      primaMensual: precio(find(s, 'prima_seguro_salud', 'privado_precio')),
      primaMensualConParto: precio(find(s, 'prima_seguro_salud_con_parto', 'privado_precio')),
      copago: precio(find(s, 'copago_consulta_mutua', 'privado_precio')),
    },
  };
}

/** Etapas con su fila de gasto por alumno (2019) y su precio privado. */
const ETAPAS = [
  { id: 'infantil', label: lit('Infantil (3 a 5 años)'), nivel: 'Infantil (CINE 0)', privado: { concepto: 'Infantil', tipo: 'mensual' }, defecto: 3 },
  { id: 'primaria', label: lit('Primaria'), nivel: 'Primaria (CINE 1)', privado: { concepto: 'Primaria', tipo: 'mensual' }, defecto: 6 },
  { id: 'eso', label: lit('ESO'), nivel: 'Secundaria (ESO + Bachillerato + FP medio) (CINE 2-3)', privado: { concepto: 'ESO y Bachillerato', tipo: 'mensual' }, defecto: 4 },
  { id: 'bachillerato', label: lit('Bachillerato'), nivel: 'Secundaria (ESO + Bachillerato + FP medio) (CINE 2-3)', privado: { concepto: 'ESO y Bachillerato', tipo: 'mensual' }, defecto: 2 },
  { id: 'fp_medio', label: lit('FP de grado medio'), nivel: 'Secundaria (ESO + Bachillerato + FP medio) (CINE 2-3)', privado: { concepto: 'FP (grado medio y superior)', tipo: 'anual' }, defecto: 0 },
  { id: 'fp_superior', label: lit('FP de grado superior'), nivel: 'FP superior y similar (CINE 5)', privado: { concepto: 'FP (grado medio y superior)', tipo: 'anual' }, defecto: 0 },
  { id: 'universidad', label: lit('Universidad (grado o máster)'), nivel: 'Universitaria (CINE 6-8)', privado: { concepto: 'Grado universitario', tipo: 'anual', titularidad: 'Privado' }, defecto: 4, universidad: true },
];

export const MESES_CUOTA_PRIVADA = 10;

function buildEducacion(t) {
  const g = t.educacion_gasto_por_alumno;
  const f = t.educacion_precios_familias;

  const gasto = (nivel, ambito, territorio, anio) => {
    const r = g.find((x) => x.nivel === nivel && (ambito === undefined || x.ambito === ambito) && (territorio === undefined || x.territorio === territorio) && (anio === undefined || x.anio === anio));
    return need(r, `educación ${nivel}`);
  };

  const madrid2023 = Number(gasto('No universitaria', 'Solo centros públicos', 'Madrid', '2023').valor_eur_por_alumno);
  const espana2019 = Number(gasto('No universitaria', 'Solo centros públicos', 'España', '2019').valor_eur_por_alumno);
  const factor = madrid2023 / espana2019;

  const credito = need(f.find((r) => r.nivel === 'Grado universitario' && r.titularidad === 'Público' && r.unidad === 'EUR/credito'), 'precio por crédito grado');
  const matriculaUniversidad = Number(credito.valor_central_eur) * 60;

  const etapas = ETAPAS.map((e) => {
    const fila = gasto(e.nivel, 'Públicos y privados', 'España', '2019');
    const base2019 = Number(fila.valor_eur_por_alumno);
    const publico = {
      base2019,
      gastoAlumno: e.universidad ? base2019 : base2019 * factor,
      actualizado: !e.universidad,
      fuente: fila.fuente_id,
      tipoDato: fila.tipo_dato,
    };
    const pr = need(
      f.find((r) => r.nivel === e.privado.concepto && r.titularidad === (e.privado.titularidad ?? 'Privado') && /Cuota mensual|Matr[ií]cula anual|Precio anual/.test(r.concepto)),
      `precio privado ${e.id}`,
    );
    const importe = Number(pr.valor_central_eur);
    const anual = e.privado.tipo === 'mensual' ? importe * MESES_CUOTA_PRIVADA : importe;
    return {
      id: e.id, label: e.label, defecto: e.defecto,
      publico: { ...publico, matriculaAnual: e.universidad ? matriculaUniversidad : 0 },
      privado: { anual, importe, unidad: pr.unidad, fuente: pr.fuente_id, tipoDato: pr.tipo_dato, fiabilidad: pr.fiabilidad, territorio: pr.territorio, anio: pr.curso_anio, min: Number(pr.importe_min_eur), max: Number(pr.importe_max_eur) },
    };
  });

  return { etapas, factor, madrid2023, espana2019, mesesCuota: MESES_CUOTA_PRIVADA, matriculaUniversidad };
}

function buildTransporte(t) {
  const c = byKey(t.transporte_costes, 'indicador', 'transporte_costes');
  const tarifa = (prefijo) => need(t.transporte_tarifas_madrid_2026.find((r) => r.titulo.startsWith(prefijo)), `tarifa ${prefijo}`);
  return {
    territorio: 'Madrid',
    anio: 2024,
    costeViaje: Number(c('coste_medio_por_viaje').valor),
    pagoMedioViaje: Number(c('pago_medio_usuario_por_viaje').valor),
    abonoMensual: Number(tarifa('Abono mensual 26-64 años, zona A').precio_eur),
    bonoViaje: Number(tarifa('Bono de 10 viajes').precio_eur) / 10,
  };
}

function buildGastoPublico(t) {
  const funciones = t.gasto_publico_cofog_2024.map((r) => ({
    codigo: r.codigo_cofog, funcion: r.funcion, millones: Number(r.gasto_millones_eur_2024p), pct: Number(r.porcentaje_del_total),
  }));
  const millones = funciones.reduce((s, f) => s + f.millones, 0);
  return { anio: 2024, funciones, millones };
}

/** Prestación contributiva por desempleo (asalariados): duración, porcentajes y topes. */
function buildParo(t) {
  const par = byKey(t.desempleo_parametros_2026, 'parametro', 'desempleo_parametros_2026');
  const duracion = t.desempleo_duracion.map((r) => ({
    desdeDias: Number(r.dias_cotizados_desde), hastaDias: num(r.dias_cotizados_hasta),
    dias: Number(r.dias_prestacion), meses: Number(r.meses_prestacion),
  }));
  return {
    anio: 2026,
    pctInicial: Number(par('porcentaje_base_primeros_180_dias').valor),
    pctResto: Number(par('porcentaje_base_desde_dia_181').valor),
    mesesInicial: 6,
    minimo: Number(par('cuantia_minima_sin_hijos').valor),
    maximo: Number(par('cuantia_maxima_sin_hijos').valor),
    minDias: Number(par('minimo_cotizado_para_tener_derecho').valor),
    ventanaAnios: 6,
    diasPorAnio: 360,
    duracion,
  };
}

/** Autónomos (RETA): tipos, tramos de cotización por rendimientos y cese de actividad. */
function buildAutonomo(t) {
  const par = byKey(t.autonomos_parametros_2026, 'parametro', 'autonomos_parametros_2026');
  const v = (k) => Number(par(k).valor);
  const tramos = t.autonomos_cotizacion_2026.map((r) => ({
    tabla: r.tabla, tramo: Number(r.tramo), hasta: num(r.rend_neto_mensual_hasta_eur),
    baseMinima: Number(r.base_minima_eur), baseMaxima: Number(r.base_maxima_eur),
  }));
  return {
    anio: 2026,
    tipos: [
      { id: 'contingencias_comunes', label: lit('Contingencias comunes'), tipo: v('tipo_contingencias_comunes'), paraQueSirve: lit('Pensión de jubilación, incapacidad permanente, baja por enfermedad común y prestaciones de viudedad y orfandad.') },
      { id: 'contingencias_profesionales', label: lit('Contingencias profesionales (accidente y enfermedad profesional)'), tipo: v('tipo_contingencias_profesionales'), paraQueSirve: lit('Cubre la baja y la incapacidad si el accidente o la enfermedad vienen del trabajo.') },
      { id: 'cese_actividad', label: lit('Cese de actividad'), tipo: v('tipo_cese_actividad'), paraQueSirve: lit('Es el «paro» del autónomo: una prestación si cierras el negocio por causas que la ley reconoce.') },
      { id: 'formacion_profesional', label: lit('Formación profesional'), tipo: v('tipo_formacion_profesional'), paraQueSirve: lit('Formación para el empleo.') },
      { id: 'mei', label: lit('MEI (Mecanismo de Equidad Intergeneracional)'), tipo: v('tipo_mei'), paraQueSirve: lit('Fondo de reserva para las pensiones de las generaciones futuras.') },
    ],
    tipoTotal: v('tipo_total'),
    deduccionGastosGenericos: v('deduccion_gastos_genericos_cotizacion'),
    gastosDificilPct: v('gastos_dificil_justificacion_pct'),
    gastosDificilMax: v('gastos_dificil_justificacion_max'),
    limiteSimplificada: v('limite_ingresos_simplificada'),
    tramos,
    cese: {
      pctBaseReguladora: v('cese_porcentaje_base_reguladora'),
      minMeses: v('cese_minimo_meses_cotizados'),
      ventanaMeses: v('cese_ventana_duracion_meses'),
      baseMeses: v('cese_base_reguladora_meses'),
      duracion: t.autonomos_cese_actividad_duracion.map((r) => ({ desde: Number(r.meses_cotizados_desde), hasta: num(r.meses_cotizados_hasta), meses: Number(r.meses_prestacion) })),
    },
  };
}

/**
 * @typedef {ReturnType<typeof buildSimParams>} SimParams
 * @param {Record<string, Record<string,string>[]>} tables  nombre de CSV → filas
 */
export function buildSimParams(tables) {
  for (const n of SIM_TABLES) need(tables[n], `tabla ${n}`);
  return {
    nomina: buildNomina(tables),
    salud: buildSalud(tables),
    educacion: buildEducacion(tables),
    transporte: buildTransporte(tables),
    gastoPublico: buildGastoPublico(tables),
    paro: buildParo(tables),
    autonomo: buildAutonomo(tables),
  };
}
