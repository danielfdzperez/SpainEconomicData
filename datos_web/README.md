# datos_web — CSV para la web estática

Datos públicos (España/Madrid) para calculadoras y gráficos. Fecha de consulta: **2026-10-22**. UTF-8, separador coma, decimales con punto, cabecera en la fila 1.

## Convenciones
- `fuente_id` apunta a `FUENTES.md` (organismo, título, URL y si es fuente primaria o secundaria).
- `tipo_dato`: `oficial` (organismo oficial), `oficial_secundaria` (cifra oficial leída en prensa, mutua o comparador: contrastar), `derivado` (cálculo con otras filas del CSV, la fórmula está en `nota`), `estimacion_propia` (estimación mía, no oficial), `texto descriptivo`.
- `fiabilidad` (solo sanidad/educación): `alta`, `media`, `baja`.
- Los campos `importe_min`/`importe_max` son rangos; `valor_central` es el valor único o el punto medio del rango.
- Vacío = no disponible o tramo abierto.

## Archivos
| Tema | Archivos |
|---|---|
| IRPF | `irpf_escala_estatal`, `irpf_escala_autonomica_madrid`, `irpf_escala_ahorro`, `irpf_escala_retencion`, `irpf_parametros` |
| Seguridad Social | `cotizaciones_ss_tipos_2026`, `cotizaciones_ss_bases_2026`, `cotizacion_solidaridad_2026`, `cotizacion_at_ep_ejemplos_2026`, `cotizaciones_resumen_tipos_2026`, `cotizaciones_parametros_2026` |
| Destino de los impuestos | `destino_tributos_trabajador`, `gasto_publico_cofog_2024` |
| Pruebas de la calculadora | `ejemplos_validacion_irpf_ss_2026` |
| Desempleo | `desempleo_duracion`, `desempleo_parametros_2026` |
| Autónomos (RETA) y cese de actividad | `autonomos_cotizacion_2026` (15 tramos de rendimiento neto, con base y cuota mínima y máxima), `autonomos_parametros_2026` (tipos de cotización, deducción del 7 %, difícil justificación 5 % hasta 2.000 €, parámetros del cese de actividad), `autonomos_cese_actividad_duracion` (meses de prestación según meses cotizados) |
| Vivienda | `vivienda_valor_tasado_es` (valor tasado de la vivienda libre, €/m², media anual 1995–2025, España); `vivienda_accesibilidad_bde` (Banco de España: precio de la vivienda / renta bruta por hogar y esfuerzo teórico, 2023–2025 y 2026-II); `vivienda_alquiler_anclas_2022` (SERPAVI 2022: alquiler medio de un piso en Madrid y media ponderada de 17 CCAA para España; sirve de nivel para convertir el IPVA en euros) |
| Sanidad | `sanidad_costes_servicios`, `sanidad_gasto_agregado` |
| Educación | `educacion_gasto_publico_serie`, `educacion_gasto_por_alumno`, `educacion_precios_familias` |
| Transporte | `transporte_costes`, `transporte_tarifas_madrid_2026` |
| PIB | `pib_espana_anual`, `pib_agregados_2023_2025`, `pib_sectores_vab_2024_2025` (valor añadido por ramas: PIB → sectores → ramas → subramas, millones de euros 2024 y 2025; columnas `rama_id`, `nivel`, `padre_id`, `rama`, `rama_corta`, `vab_2024_millones_eur`, `vab_2025_millones_eur`; cada nivel suma a su padre) |
| Pensiones | `pensiones_estadisticas`, `pensiones_tramos_2024`, `pensiones_parametros_2026` |
| Fuentes | ver `../FUENTES.md` (tabla 06–09) |

Documentación detallada por tema (limitaciones, fórmulas): `../AIDocs/impuestos_cotizaciones.md`, `desempleo_pensiones.md`, `servicios_publicos_costes.md`, `pib.md`.

## Lectura desde JavaScript
```js
const rows = await (await fetch('datos_web/irpf_escala_estatal.csv')).text(); // parsear con PapaParse
```
Los CSV son pequeños (< 20 KB cada uno); GitHub Pages los sirve directamente.

## Aviso
Hay datos de fuentes secundarias (columna `tipo_dato`). Antes de presentar una cifra como oficial en la web, comprobar en BOE, BOCM, AEAT, INE o Seguridad Social. Las filas de sanidad, educación y transporte son orientativas y no equivalentes entre territorios.
