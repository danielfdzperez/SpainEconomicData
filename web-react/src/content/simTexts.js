/**
 * Textos del simulador. Se generan a partir de los parámetros para que ninguna cifra quede
 * escrita a mano (si cambia un CSV, cambia el texto).
 */
import { formatEuro, formatNumber, formatShare, formatValue, percentSuffix } from '../core/format.js';
import { getLang, lit, t } from '../i18n/index.js';

const eur = (v, d = 2) => formatEuro(v, { decimals: Number.isInteger(v) ? 0 : d });
const n0 = (v) => formatNumber(v, { decimals: 0 });
/** Importe entero con su unidad: «2000 €» / «€2,000». */
const e0 = (v) => formatValue(v, 'eur');
/** Número entero con el signo de porcentaje del idioma: «7 %» / «7%». */
const p0 = (v) => `${n0(v)}${percentSuffix()}`;

/** @param {import('../data/simParams.js').SimParams['nomina']} n */
export function textosNomina(n) {
  const r = n.irpf.reduccion;
  return {
    bruto: t('Lo que pone en tu contrato antes de quitar nada: el sueldo de una paga por el número de pagas.'),
    base: t('Es la cantidad sobre la que se calculan las cotizaciones. Se toma tu sueldo anual con las pagas extra repartidas en 12 meses, con un mínimo de {min} al mes (jornada completa) y un máximo de {max} al mes.', { min: eur(n.ss.baseMinimaMensual), max: eur(n.ss.baseMaximaMensual) }),
    ss: t('Las cotizaciones se calculan sobre la base de cotización, no sobre el sueldo bruto, y se descuentan antes de calcular el IRPF.'),
    gastos: t('La ley deja restar {x} al año como «otros gastos» sin justificarlos.', { x: eur(n.irpf.gastoDeducible) }),
    rnt: t('Rendimiento neto del trabajo: sueldo bruto menos cotizaciones y gastos deducibles. Es lo que Hacienda considera tu renta del trabajo.'),
    reduccion: t('Quien cobra poco recibe un descuento extra: hasta {max} si el rendimiento neto es de {u1} o menos. Va bajando y desaparece a partir de {u3}.', { max: eur(r.max), u1: eur(r.umbral1), u3: eur(r.umbral3) }),
    base_liquidable: t('La cantidad sobre la que se aplica la tarifa del IRPF.'),
    escala: t('El IRPF es progresivo: cada parte de tu base paga el tipo de su tramo; no todo el sueldo paga el tipo más alto.'),
    minimo: (minimo, tipo) => t('Una parte de tu renta no paga IRPF (mínimo personal: {minimo}). Se aplica restando la cuota que saldría por esa cantidad, {tipo}.', { minimo: eur(minimo), tipo: eur(tipo) }),
    estatal: t('Parte del IRPF que va al Estado (escala general estatal).'),
    autonomica: t('Parte del IRPF que va a la Comunidad de Madrid (escala autonómica). Madrid tiene una de las escalas más bajas de España.'),
    irpf: t('IRPF que te corresponde pagar en el año. En la nómina te lo van reteniendo mes a mes; al hacer la declaración se ajusta a la cuota final.'),
    tipoMedio: t('IRPF dividido entre tu sueldo bruto: lo que pagas de media por cada euro que cobras.'),
    tipoMarginal: t('Lo que pagarías de IRPF por cada euro extra de base (Estado + Madrid), sin contar la Seguridad Social ni la reducción por rendimientos del trabajo.'),
    neto: t('Lo que llega a tu cuenta en el año: sueldo bruto menos cotizaciones menos IRPF.'),
    coste: t('Lo que le cuesta tu puesto a la empresa en un año: tu sueldo bruto más sus cotizaciones. Es la cifra que la empresa compara con lo que le aportas.'),
    cargas: t('Cotizaciones tuyas + IRPF + cotizaciones de la empresa: lo que va al sector público (Seguridad Social y Hacienda) por tu trabajo. No incluye IVA ni otros impuestos que pagas al consumir.'),
  };
}

/** Tramos de una escala en texto: «De 12.450 a 20.200 €». */
export function textoTramo(tramo) {
  if (tramo.hasta == null) return t('Más de {x}', { x: e0(tramo.desde) });
  // en español el € va una sola vez, al final; en inglés, delante de cada cifra
  const desde = getLang() === 'en' ? e0(tramo.desde) : n0(tramo.desde);
  return t('De {a} a {b}', { a: desde, b: e0(tramo.hasta) });
}

export const SUPUESTOS_NOMINA = [
  lit('Persona soltera, sin hijos ni otras personas a su cargo, que vive en la Comunidad de Madrid.'),
  lit('Sólo ingresos del trabajo, sin otras rentas, planes de pensiones, hipoteca ni deducciones autonómicas.'),
  lit('Cálculo del IRPF final del año; la retención que ves cada mes en la nómina puede ser algo distinta.'),
  lit('La empresa paga el tipo de accidentes de trabajo que elijas; el real depende de su actividad exacta.'),
  lit('Parámetros de 2026. Algunos vienen de fuentes secundarias (mutuas, despachos) y están pendientes de contrastar con el BOE y el BOCM.'),
];

export const SUPUESTOS_AUTONOMO = [
  lit('Autónomo persona física en estimación directa simplificada, sin empleados ni socios, soltero, sin hijos y residente en la Comunidad de Madrid.'),
  lit('Cotización por ingresos reales: a (ingresos − gastos) se le resta un 7 % de gastos genéricos, se divide entre 12 y con el resultado se elige el tramo. Suponemos la base mínima de ese tramo (puedes elegir una mayor).'),
  lit('IRPF de la actividad: ingresos − gastos − la cuota de autónomos − el 5 % de gastos de difícil justificación (máximo 2.000 €). Se usa la misma escala del Estado y de Madrid y los mismos mínimos personales que en la nómina.'),
  lit('Facturación y gastos iguales todos los meses. No modelamos la tarifa plana, las reducciones por bajos ingresos o inicio de actividad, el IVA ni los pagos fraccionados (modelo 130).'),
  lit('El 7 % de gastos genéricos viene de guías secundarias (alguna da el 5 %): pendiente de contrastar con la Seguridad Social.'),
];

export const SUPUESTOS_SERVICIOS = [
  lit('Multiplicamos las veces que declares por un precio medio: no sabemos qué te han hecho en cada consulta ni cuánto costó realmente tu caso.'),
  lit('Sanidad pública: tarifas que cobra la sanidad de Madrid (2023) y de Navarra o País Vasco (2025) a aseguradoras y mutuas. Es la mejor aproximación pública que tenemos, no el coste contable. Para el especialista usamos la tarifa de primera consulta en todas las visitas, así que puede quedar algo alta.'),
  lit('Sanidad privada: rangos de comparadores y portales de 2026. Donde no hay un precio privado fiable (curas, noches de hospital, UCI) usamos el público, para no exagerar.'),
  lit('Educación: gasto público por alumno de cada nivel (2019, España) llevado a Madrid 2023. Colegio privado: cuota mensual de Madrid × 10 mensualidades, sin comedor, uniforme ni extraescolares.'),
  lit('Transporte: sólo Madrid (Consorcio Regional de Transportes, 2024). Lo que pagas tú es el abono o el bono, lo más barato.'),
  lit('Todo en euros de hoy: no actualizamos los precios del pasado con la inflación.'),
];

export const SUPUESTOS_COMPARATIVA = [
  lit('Es un ejercicio de imaginación, no una propuesta ni una predicción: en un sistema sin impuestos los sueldos, los precios y los riesgos serían distintos.'),
  lit('Con impuestos: tu sueldo neto menos lo que pagas tú directamente por la escuela (matrícula o colegio) y el transporte (abono o bono). La sanidad pública no te cuesta nada en el momento de usarla.'),
  lit('Sin impuestos: tu sueldo bruto (o lo que cuestas a tu empresa) menos el equivalente privado de lo que has contado: la prima del seguro (con los copagos de las visitas) o las visitas pagadas una a una, el colegio privado y el transporte sin ayudas.'),
  lit('Todos los servicios son la media de tu vida entera (total ÷ tu edad), mientras que el sueldo es el de hoy. Si tus gastos están concentrados en unos pocos años (la escuela, un parto), en esos años el efecto sería mayor.'),
  lit('Un seguro de salud no cubre todo: tiene límites, carencias y copagos, y la prima sube con la edad. No incluimos medicamentos ni tratamientos graves.'),
  lit('Sólo sustituimos sanidad, educación y transporte. Las pensiones, el paro, la justicia, la seguridad, la defensa o las carreteras que pagan tus impuestos no están en la cuenta: lo que cuestan se muestra aparte.'),
  lit('No se incluye el IVA ni otros impuestos que pagas al consumir, ni el IRPF de otras rentas.'),
];

export const NO_CUENTA = [
  lit('Pensiones, dependencia, subsidios ni ayudas: no se incluyen ni en lo aportado ni en lo consumido. Del paro sólo contamos la prestación contributiva que declares haber cobrado.'),
  lit('Justicia, seguridad, defensa, carreteras, cultura y el resto del gasto público (salvo la referencia por habitante).'),
  lit('El IVA y otros impuestos que pagas cuando consumes, ni el IRPF de otras rentas.'),
  lit('Medicamentos, pruebas distintas de resonancias y ecografías, operaciones y tratamientos.'),
  lit('Que tus ingresos hayan cambiado con los años: salvo que detalles tu historial laboral, suponemos que has cobrado siempre lo que cobras hoy, en euros de hoy. Aun con el historial, los sueldos se toman tal cual, sin actualizarlos con la inflación.'),
  lit('Las cotizaciones que paga el Estado por ti mientras cobras paro (la parte de la empresa y el 4,7 % de contingencias comunes).'),
];

/** Textos del apartado de autónomos, con las cifras salidas de los parámetros. */
export function textosAutonomo(a) {
  return {
    ingresos: t('Lo que facturas al mes, sin IVA. Suponemos que es igual todos los meses del año.'),
    gastos: t('Los gastos de tu actividad que puedes deducir (alquiler, material, gestoría, suministros…), sin contar la cuota de autónomos.'),
    rendimiento: t('Ingresos menos gastos: lo que queda antes de pagar la cuota de autónomos y el IRPF.'),
    rendimientoCotizacion: t('Para elegir tu tramo se le resta al rendimiento un {x} de gastos genéricos y se divide entre 12. La cuota de autónomos no se resta.', { x: p0(a.deduccionGastosGenericos) }),
    tramo: t('La cuota depende del tramo de tus rendimientos netos mensuales: cuanto más ganas, más cotizas (hasta el tope de cotización).'),
    base: t('Cantidad sobre la que se aplican los tipos. Elegimos la base mínima de tu tramo, la que pagan la mayoría de autónomos.'),
    cuota: t('Se paga todos los meses del año, hayas facturado o no. Es el {x} de tu base de cotización repartido en cinco conceptos.', { x: formatShare(a.tipoTotal, 1) }),
    rn: t('Rendimiento neto de la actividad: ingresos menos gastos y menos la cuota de autónomos, que es deducible.'),
    dificil: t('Una reducción que no hace falta justificar: el {pct} del rendimiento neto, con un máximo de {max} al año.', { pct: p0(a.gastosDificilPct), max: e0(a.gastosDificilMax) }),
    base_liquidable: t('La cantidad sobre la que se aplica la tarifa del IRPF.'),
    neto: t('Lo que te queda en el bolsillo al año: ingresos menos gastos, menos la cuota de autónomos, menos el IRPF.'),
    cargas: t('Cuota de autónomos + IRPF: lo que va al sector público por tu trabajo. Como autónomo no hay una «parte de la empresa»: lo pagas todo tú. No incluye el IVA, que repercutes y no es tuyo.'),
  };
}

/** Textos del apartado de paro. */
export function textosParo(paro) {
  return {
    generado: t('Lo que se ha cotizado para el desempleo por tu trabajo: tu parte y la de tu empresa (en un autónomo, la cuota de cese de actividad). Es una parte de lo aportado en el apartado 3, no una cuenta con tu nombre: el paro de todos se paga con las cotizaciones de todos.'),
    tocaria: t('Lo que cobrarías en total si hoy te quedaras en paro (por ejemplo, por un despido) con tu último trabajo, en bruto y sin subsidios.'),
    base: t('Base reguladora: la media de las bases de cotización de los últimos 180 días trabajados (12 meses en un autónomo). Con varios sueldos distintos se pondera por el tiempo de cada uno.'),
    dias: t('Cuentan los días cotizados por cuenta ajena en los últimos {years} años (contamos {perYear} días por año). Los que ya sirvieron para un paro anterior no valen otra vez. Hacen falta {min} días como mínimo.', { years: paro.ventanaAnios, perYear: paro.diasPorAnio, min: paro.minDias }),
    porcentaje: t('Los primeros 180 días (6 meses) se cobra el {a} de la base reguladora y, desde el día 181, el {b}.', { a: `${paro.pctInicial}${percentSuffix()}`, b: `${paro.pctResto}${percentSuffix()}` }),
    topes: t('La cuantía mensual tiene un mínimo de {min} y un máximo de {max} (persona sin hijos): se calculan con el IPREM más un sexto de pagas extra.', { min: e0(paro.minimo), max: e0(paro.maximo) }),
    bruto: t('Importes brutos: no restamos la retención de IRPF ni la cotización que se descuenta de la prestación.'),
  };
}

/** Qué calcula el simulador (para la página Método). */
export const METODO_SIMULADOR_CALCS = [
  [lit('Nómina y coste de empresa'), lit('Con tu sueldo bruto aplicamos las bases y tipos de la Seguridad Social de 2026, la escala del IRPF estatal y la de la Comunidad de Madrid, y la reducción por rendimientos del trabajo. Los siete ejemplos de validación del repositorio coinciden al céntimo.')],
  [lit('Coste de los servicios'), lit('Multiplicamos las veces que cuentas por un precio medio: tarifas públicas de Madrid y Navarra para la sanidad, gasto por alumno para la educación y coste por viaje en el transporte de Madrid.')],
  [lit('Comparación con la privada'), lit('Con precios de mercado de clínicas, colegios y universidades privadas. Donde no hay un precio fiable (enfermería, noche de hospital, UCI, transporte) usamos el público y lo avisamos.')],
  [lit('Balance de vida laboral'), lit('Lo aportado es IRPF + cotización tuya + cotización de tu empresa, por los años que llevas trabajando, con tu sueldo de hoy en euros de hoy (o el de cada periodo, si detallas tu historial). Lo usado es lo que puso el sistema en sanidad, educación y transporte, más el paro que hayas cobrado.')],
  [lit('Seguro de salud'), lit('Prima mensual media de los seguros de salud de entrada (con copagos) y de los que cubren el parto, de comparadores y aseguradoras de 2026, multiplicada por 12. Es orientativa: la prima real depende de la edad, la provincia y la cobertura.')],
  [lit('Consultas al año o en la vida'), lit('Puedes contar las visitas al médico «al año» (se multiplican por tu edad) o «en toda tu vida» (se usan tal cual). Al cambiar de una a otra convertimos lo que habías escrito con tu edad.')],
  [lit('Autónomo'), lit('Con tu facturación y tus gastos elegimos el tramo de cotización por ingresos reales de 2026 (15 tramos, 31,5 % sobre la base) y calculamos el IRPF de la actividad con la misma escala del Estado y de Madrid que en la nómina.')],
  [lit('Paro generado y paro que te tocaría'), lit('Generado: lo cotizado para el desempleo (tu parte y la de la empresa) por los años trabajados. Lo que te tocaría: 70 % de la base reguladora los 6 primeros meses y 60 % después, con mínimo y máximo, durante los meses que dan los días cotizados de los últimos 6 años. En autónomos, el cese de actividad: 70 % durante los meses que dan las cotizaciones.')],
  [lit('Historial laboral'), lit('Opcional. Cada periodo (trabajo con su sueldo, autónomo o paro) aporta con sus propias cifras de 2026. Las cotizaciones que ya dieron un paro no cuentan para el siguiente.')],
  [lit('Reparto de lo aportado'), lit('Aplicamos a lo que aportas el porcentaje de cada función en el gasto público total (COFOG, IGAE). Es ilustrativo: ni el IRPF ni las cotizaciones van «afectados» a un gasto concreto.')],
];

export const METODO_SIMULADOR_LIMITES = [
  lit('Sólo Comunidad de Madrid, persona soltera sin hijos ni deducciones personales.'),
  lit('Autónomos: sin tarifa plana, reducciones por bajos ingresos, societarios ni pluriactividad; el 7 % de gastos genéricos para elegir tramo viene de guías secundarias.'),
  lit('Paro: importes brutos, sin retención de IRPF, subsidios ni hijos a cargo; suponemos un despido o cese que da derecho a la prestación, y que tras un paro se pierden todas las cotizaciones anteriores aunque no se agotara.'),
  lit('Los tramos de la escala de Madrid están redondeados y el mínimo personal autonómico tiene baja confianza.'),
  lit('La educación pública parte del gasto por alumno de 2019 (nacional), llevado a Madrid 2023 con un factor; la universidad no se actualiza.'),
  lit('La matrícula de FP pública se toma como 0 € por falta de dato y el transporte sólo existe para Madrid.'),
  lit('El balance no incluye pensiones, subsidios, IVA ni otros impuestos, ni lo que pagaste antes de empezar a trabajar.'),
];
