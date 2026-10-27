# Impuestos y cotizaciones del trabajador y la empresa (2026)

Fecha de consulta: **2026-10-22**. Datos en `datos_web/` (CSV). Fuentes: `FUENTES.md` (IDs S01–S07, S36; autónomos: S38–S40).

## Qué contiene
| Archivo | Contenido |
|---|---|
| `irpf_escala_estatal.csv` | Escala general estatal (9,5 % a 24,5 %), con cuota acumulada |
| `irpf_escala_autonomica_madrid.csv` | Escala autonómica de Madrid (8,5 % a 20,5 %) |
| `irpf_escala_ahorro.csv` | Base del ahorro (19 % a 30 %, estatal + autonómico) |
| `irpf_escala_retencion.csv` | Escala de retención en nómina (AEAT, 19 % a 47 %) |
| `irpf_parametros.csv` | Gastos deducibles, reducción por rendimientos del trabajo, mínimos, límites de retención |
| `cotizaciones_ss_tipos_2026.csv` | Tipos empresa/trabajador y para qué sirve cada uno |
| `cotizaciones_ss_bases_2026.csv` | Bases mínima y máxima por grupo de cotización |
| `cotizacion_solidaridad_2026.csv` | Cotización adicional por encima del tope |
| `cotizacion_at_ep_ejemplos_2026.csv` | Tarifa de accidentes de trabajo por actividad (15 ejemplos) |
| `cotizaciones_resumen_tipos_2026.csv` | Totales: trabajador 6,50 %; empresa 30,65 % + AT/EP |
| `cotizaciones_parametros_2026.csv` | Tope máximo anual (61.214,40 €), SMI, recargo contratos < 30 días |
| `destino_tributos_trabajador.csv` | Para qué se usa cada cotización/impuesto (texto descriptivo) |
| `gasto_publico_cofog_2024.csv` | En qué gasta el sector público (10 funciones, 725.001 M €) |
| `ejemplos_validacion_irpf_ss_2026.csv` | 7 salarios con IRPF, SS y coste de empresa calculados (para probar la calculadora) |
| `autonomos_cotizacion_2026.csv` | RETA 2026: 15 tramos de rendimiento neto mensual (3 de tabla reducida y 12 de tabla general) con base mínima/máxima y cuota |
| `autonomos_parametros_2026.csv` | Tipos del RETA (31,5 %), deducción del 7 % para el rendimiento de cotización, gastos de difícil justificación (5 %, máx. 2.000 €), parámetros del cese de actividad |

## Cifras clave
- **Trabajador (indefinido)**: contingencias comunes 4,70 % + desempleo 1,55 % + formación 0,10 % + MEI 0,15 % = **6,50 %** de la base de cotización (temporal: 6,55 %).
- **Empresa (indefinido)**: contingencias comunes 23,60 % + desempleo 5,50 % + FOGASA 0,20 % + formación 0,60 % + MEI 0,75 % = **30,65 %**, más AT/EP (**1,50 %** en oficina/hostelería/sanidad/educación/informática hasta **6,70 %** en construcción). Temporal: 31,85 % + AT/EP.
- **Tope máximo de cotización**: 5.101,20 €/mes (61.214,40 €/año). Por encima, cotización de solidaridad: 1,15 % / 1,25 % / 1,46 % por tramos (la empresa paga ~5/6).
- **Bases mínimas**: 1.424,40 €/mes para grupos 4–7 (1.989,30 en el grupo 1).
- **MEI**: 0,90 % en 2026 (0,80 % en 2025); lo consigue la Seguridad Social como fondo de reserva de pensiones.
- **IRPF**: gastos deducibles 2.000 €; reducción por rendimientos del trabajo hasta 7.302 € si el rendimiento neto ≤ 14.852 € (se anula a 19.747,50 €); mínimo personal 5.550 € (estatal).
- **Gasto público 2024** (IGAE, COFOG): protección social 41,0 %, salud 14,2 %, servicios generales 12,8 %, asuntos económicos 11,2 %, educación 9,1 %.

## Fórmula de cálculo usada en `ejemplos_validacion`
1. Base de cotización anual = bruto anual (con extras prorrateadas) limitado a [base mínima del grupo × 12, 61.214,40].
2. SS trabajador = base × 6,50 %.
3. Rendimiento neto del trabajo (RNT) = bruto − SS trabajador − 2.000.
4. Reducción por rendimientos del trabajo (ver `irpf_parametros.csv`); base liquidable = RNT − reducción.
5. Cuota = [escala estatal(BL) − escala estatal(5.550)] + [escala Madrid(BL) − escala Madrid(5.956,65)], mínimo 0.
6. Coste empresa = bruto + base × (30,65 % + AT/EP).

Resultados (soltero sin hijos, Madrid, indefinido, grupo 4–7, AT/EP 1,5 %):

| Bruto | IRPF | % IRPF | Neto | Coste empresa | Carga total sobre coste |
|---|---|---|---|---|---|
| 17.094 (SMI) | 169 | 1,0 % | 15.814 | 22.590 | 30,0 % |
| 24.497 (mediana España) | 3.168 | 12,9 % | 19.737 | 32.373 | 39,0 % |
| 29.540 (media España) | 4.478 | 15,2 % | 23.141 | 39.037 | 40,7 % |
| 34.410 (media Madrid) | 5.744 | 16,7 % | 26.429 | 45.473 | 41,9 % |
| 52.515 (P90 España) | 11.404 | 21,7 % | 37.698 | 69.399 | 45,7 % |
| 100.000 | 30.747 | 30,7 % | 65.274 | 119.680 | 45,5 % |

«Carga total» = (coste empresa − neto) / coste empresa: cotizaciones de empresa y trabajador + IRPF; no incluye IVA ni otros impuestos al consumo.

## Autónomos (RETA) en 2026
Cotización **por ingresos reales** (`autonomos_cotizacion_2026.csv`, S38):
1. Rendimiento de cotización mensual = (ingresos − gastos deducibles) × (1 − 7 %) ÷ 12. El 7 % es una deducción genérica por gastos (S40, fuente secundaria: una guía cita el 5 %). **La cuota de autónomos no se resta** para elegir el tramo.
2. Con ese rendimiento se busca el tramo (15 tramos: 3 de la tabla reducida, hasta 1.166,70 €, y 12 de la general). Se supone que se cotiza por la **base mínima del tramo** (se puede elegir hasta la máxima).
3. Cuota = base × 31,5 % (contingencias comunes 28,3 + profesionales 1,3 + cese de actividad 0,9 + formación 0,1 + MEI 0,9).
4. IRPF de la actividad (estimación directa simplificada, S39): rendimiento neto = ingresos − gastos − cuota de autónomos (deducible); menos gastos de difícil justificación (5 %, máximo 2.000 €); mismas escalas estatal y de Madrid y mismos mínimos personales que la nómina. Sin reducción por rendimientos del trabajo.
5. Neto = ingresos − gastos − cuota − IRPF. Lo que va al sector público = cuota + IRPF (el autónomo paga las dos partes de la cotización; la «de la empresa» es 0).

Ejemplo (3.000 € facturados y 500 € de gastos al mes): rendimiento de cotización 2.325 €/mes → tramo 6, base 1.274,51 €/mes, cuota ≈ 401 €/mes, neto ≈ 1.765 €/mes (calculado por el simulador, no oficial).

### Límites del cálculo de autónomos
- No se modelan: tarifa plana del primer año, reducciones y bonificaciones, retenciones o pagos fraccionados (modelo 130), IVA, ni la regularización anual de la base.
- Se supone el mismo ingreso y gasto todos los meses, estimación directa simplificada (límite de ingresos 600.000 €) y que no hay otras rentas.
- Sin la reducción del IRPF por ejercer una actividad con rendimientos bajos: no se pudo confirmar su cuantía para 2026.
- El 7 % de gastos genéricos y varios importes de la tabla vienen de fuentes secundarias: verificar con la resolución oficial del BOE.

## Limitaciones (importante)
- **Fuentes**: la AEAT (algoritmo de retenciones 2026) es oficial. Cotizaciones, escala estatal y de Madrid vienen de resúmenes de mutuas/despachos de la Orden PJC/297/2026 y de una web fiscal; **verificar en BOE/BOCM** antes de publicar como oficial. Lo marca la columna `tipo_dato` (`oficial_secundaria`).
- **Escala de Madrid**: umbrales redondeados al euro por la fuente (los oficiales llevan decimales: 13.362,22; 19.004,63; 35.425,68; 57.320,40, a confirmar). Efecto < 1 € por contribuyente.
- **Mínimo personal autonómico de Madrid (5.956,65 €)**: una sola fuente secundaria que además tiene incoherencias internas; confianza baja. Sin él, el IRPF de los ejemplos sube unos 3–5 €.
- **No modelado**: mínimos por hijos/ascendientes/discapacidad (los importes no se obtuvieron de fuente fiable), deducciones autonómicas, la deducción para rentas bajas del SMI (no se pudo confirmar para 2026), planes de pensiones, retenciones vs cuota final, y el tipo exacto de AT/EP de cada empresa.
- La cotización de desempleo, FOGASA y FP se «mantienen» respecto a 2025 según la Orden; los valores salen de las tablas de Ibermutua y Unión de Mutuas.
- Gasto COFOG: la subfunción de transporte (28.634 M €) no se pudo verificar; el total y las 10 divisiones sí suman 725.001 M €.
- El destino de cada tributo (`destino_tributos_trabajador.csv`) es una descripción general de la LGSS/LIRPF, no un dato estadístico: ni el IRPF ni el IVA están afectados a un gasto concreto. Para «a qué se destina», usar `gasto_publico_cofog_2024.csv`.
