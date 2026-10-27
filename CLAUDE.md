# Base de conocimiento: datos económicos de España y Madrid

Datos públicos y gratuitos (INE, Eurostat, Agencia Tributaria, Seguridad Social/SEPE, Comunidad de Madrid, Ministerio de Vivienda) sobre empleo, salarios, coste de la vida, vivienda (incluidos precios de oferta de Idealista) y población. Cada tema tiene su Excel (España y Comunidad de Madrid en paralelo) y su documento detallado en `AIDocs/`. Fecha de consulta: **2026-10-21** (temas 01–05) y **2026-10-22** (temas 06–09); reparto del PIB por sectores: **2026-10-23**.

## Reglas de esta carpeta
1. **`AIDocs/` contiene los `.md` que describen cada tema con detalle, uno por tema.** Aquí, en `CLAUDE.md`, solo van resúmenes y reglas. No se duplica el detalle.
2. Antes de responder sobre un tema, leer su `.md` de `AIDocs/` y consultar el Excel correspondiente.
3. Si se añade un tema nuevo: crear su `.xlsx` numerado (`06_...`) y su `.md` en `AIDocs/`, y añadir una fila a la tabla de abajo.
   - Excepción: los temas 06–09 (para la web estática en GitHub) se guardan como **CSV en `datos_web/`** (`datos_web/README.md` explica columnas y convenciones), no como `.xlsx`. Cada fila lleva `fuente_id` (→ `FUENTES.md`) y `tipo_dato` (`oficial`, `oficial_secundaria`, `derivado`, `estimacion_propia`).
4. Si se actualiza un libro, actualizar su `.md` (fecha de consulta, cifras clave, huecos) y el resumen de este archivo.
5. Cada hoja de datos de un libro cita su fuente en la hoja `FUENTES`. No añadir cifras sin fuente.
6. Convenciones de color en los Excel: azul = dato de fuente, negro = fórmula, verde = enlace a otra hoja, naranja = muestra pequeña, amarillo = estimación no oficial.
7. Estimaciones propias (desviación típica salarial, cesta de necesidades, esfuerzo de alquiler) se presentan siempre como **no oficiales**.
8. No mezclar definiciones: INE (16+ años) y Eurostat (15–74) no coinciden; IPV (precio de compraventa) no es €/m² (valor tasado); IPVA, IRAV y SERPAVI miden cosas distintas. Idealista son precios de **oferta** (no de contrato ni de cierre). Padrón municipal, ECP y proyecciones del INE son operaciones distintas.
9. **Web (`web-react/`)**: todo dato calculado o estimado por nosotros lleva `*` (nombres de serie, ejes, lecturas, tablas, descargas) y se explica en pantalla. La web lee solo CSV (`web-react/public/data/`), generados con `tools/build_web_data.py` desde los Excel 01–05 y `datos_web/`; no se editan a mano. Si cambia un Excel o un CSV fuente, regenerar y ejecutar `npm test` en `web-react/`. **La web está en castellano e inglés**: cualquier texto nuevo se escribe en español dentro de `t()`/`tx()`/`lit()` y se añade a `web-react/src/i18n/en/*.js`; los textos del catálogo, el glosario y las ramas del PIB se traducen en `tools/web_en*.py` (se ejecutan al final de `build_web_data.py`). Detalle en `AIDocs/web.md` (apartado «Idioma»).

## Archivos
| Tema | Excel | Detalle |
|---|---|---|
| Empleo y desempleo | `01_Empleo_Desempleo.xlsx` | `AIDocs/empleo_desempleo.md` |
| Salarios | `02_Salarios.xlsx` | `AIDocs/salarios.md` |
| Coste de la vida | `03_Coste_de_la_Vida.xlsx` | `AIDocs/coste_vida.md` |
| Vivienda y alquiler | `04_Vivienda_y_Alquiler.xlsx` | `AIDocs/vivienda_alquiler.md` |
| Población | `05_Poblacion.xlsx` | `AIDocs/poblacion.md` |
| Impuestos y cotizaciones (trabajador, empresa y autónomo, 2026) | `datos_web/` (CSV) | `AIDocs/impuestos_cotizaciones.md` |
| Desempleo, cese de actividad y pensiones | `datos_web/` (CSV) | `AIDocs/desempleo_pensiones.md` |
| Coste de sanidad, educación y transporte (público vs privado) | `datos_web/` (CSV) | `AIDocs/servicios_publicos_costes.md` |
| PIB de España | `datos_web/` (CSV) | `AIDocs/pib.md` |
| Web de visualización (salarios, IPC, PIB, vivienda, población, empleo, hogares) | `web-react/` (React + Vite); datos en `web-react/public/data/*.csv` | `AIDocs/web.md` |
| Fuentes, API y método | — | `AIDocs/fuentes_y_metodologia.md` |

## Resumen 1 — Empleo y desempleo (EPA 2026T2)
- Tasa de paro: **España 9,87 %, Madrid 7,58 %**. Menores de 25: 23,77 % y 19,81 %.
- Ocupados: 22,78 M (España) y 3,63 M (Madrid). Parados: 2,50 M y 0,30 M.
- Tasa de empleo 53,44 % vs 59,08 %; tasa de actividad 59,29 % vs 63,92 %.
- Media anual 2025: 10,50 % vs 7,97 %. Máximo en 2013: 26,09 % vs 19,76 %.
- Paro registrado: 2.379.505 (España, sep-2026); 273.631 (Madrid, jun-2026). Afiliados ago-2026: 22,35 M y 3,87 M.
- Servicios pesa el 75,8 % del empleo en España y el 85,4 % en Madrid.
- Series: EPA trimestral 2002–2026, anual por sexo y edad 2006–2025, CCAA 2025, sectores 2026T2, Eurostat NUTS2.

## Resumen 2 — Salarios (EES/EAES 2024, euros brutos anuales)
| | España | Madrid |
|---|---|---|
| Media | 29.540 | 34.410 |
| Mediana | 24.497 | 28.038 |
| Moda | 16.520 | n.d. |
| P10 / P90 | 12.018 / 52.515 | 13.728 / 63.685 |
| DT estimada (no oficial) | ≈ 17.800–19.900 | ≈ 22.600–24.500 |

- Brecha de género en la media: 16,1 % (España), 17,5 % (Madrid).
- SMI 2026: 1.221 €/mes × 14 = 17.094 €/año.
- Hay percentiles por centil (AEAT 2024), por edad, CCAA, sector, ocupación y contrato (España), Gini y tramos de SMI.
- La desviación típica no es pública: se estima con tres métodos lognormales.

## Resumen 3 — Coste de la vida
- IPC septiembre 2026: **España 4,9 %, Madrid 5,3 %** (interanual). Transporte en Madrid: +11,5 %.
- Dic/dic 2025: 2,9 % y 3,7 %. Acumulado 2002–2025: 72,3 % y 70,2 %.
- Gasto medio por hogar 2023 (EPF): 32.617 € (España) y 37.360 € (Madrid). Vivienda y suministros: 31,8 % y 35,0 %.
- Renta neta media por persona 2025: 15.620 € y 18.169 €. AROPE: 25,7 % y 19,4 %.
- No hay cesta básica oficial: se incluye un proxy propio de necesidades básicas en Madrid (≈ 5,96 % interanual en sep-2026).

## Resumen 4 — Vivienda y alquiler
- IPV 2026T2 interanual: **España 12,2 %, Madrid 12,9 %**. Desde el mínimo de 2013 (2025): +86,9 % y +116,3 %.
- Valor tasado 1T 2026: 2.316 €/m² (España) vs 4.048 €/m² (Madrid, +16,4 %). Precio medio de transacción: 221.746 € vs 393.857 €.
- Cuota hipotecaria sobre coste salarial: 34 % vs 44 %.
- Alquiler (euros, cálculo nuestro en la web): piso medio en Madrid 738 € al mes en 2022 → ≈ 782 € en 2024; España ≈ 568 → 604 € (SERPAVI 2022 × IPVA). IPVA 2024 +3,5 % y +3,4 %; IRAV sep-2026 2,54 %. SERPAVI 2022: Madrid 11,1 €/m² (738 €/mes de media), la mayor renta entre las CCAA con dato.
- **Idealista (precios de oferta, sep-2026)**: alquiler España 15,1 €/m² (+5,6 % anual), Comunidad de Madrid 21,6 (+5,7 %), Madrid ciudad 23,4 (+4,8 %). Venta: 2.930 / 5.065 / 6.458 €/m². Rentabilidad bruta 6,18 % / 5,12 % / 4,35 %.
- Distritos de Madrid más caros en alquiler: Salamanca 28,5, Centro 26,1, Chamberí 26,0 €/m²; más baratos: Barajas, Vicálvaro y Villa de Vallecas 17,2. Un piso de 70 m² equivale al 51,8 % (España) y 64,7 % (Madrid) del salario bruto mediano mensual (indicativo).
- Idealista solo muestra 12 meses y cambió de metodología en julio de 2026. Hojas por CCAA, provincia, distrito, municipio, histórico y esfuerzo.

## Resumen 5 — Población (INE, ECP 1-jul-2026, provisional)
| | España | Madrid |
|---|---|---|
| Población | 49.801.559 | 7.201.554 (14,5 %) |
| Extranjeros | 7.437.543 (14,9 %) | 1.229.486 (17,1 %) |
| 65 y más años | 21,2 % | 19,4 % |
| Edad mediana (1-ene-2025) | 45,8 | 44,2 |
| Esperanza de vida 2024 | 84,0 | 85,6 |
| Personas por hogar | 2,49 | 2,58 |

- Crecimiento interanual: +0,90 % (España) y +0,75 % (Madrid). Desde 1971: +45,7 % y +90,6 %.
- CCAA más pobladas: Andalucía 8,78 M, Cataluña 8,23 M, Madrid 7,20 M. Más envejecida: Asturias (28,8 % de 65+); más joven: Melilla (13,7 %).
- Fecundidad 2024: 1,10 y 1,09 hijos por mujer.
- Proyección INE 2026–2041: España +8,6 %, Madrid +14,4 % (≈ 8,2 M).
- Población por edad quinquenal, sexo y nacionalidad para España y las 19 CCAA; serie anual desde 1971 y trimestral desde 2021.

## Resumen 6 — Impuestos y cotizaciones (2026)
- Trabajador (indefinido): **6,50 %** de la base (CC 4,70 + desempleo 1,55 + FP 0,10 + MEI 0,15). Empresa: **30,65 %** + AT/EP (1,50 %–6,70 % según CNAE). Tope de cotización 5.101,20 €/mes; base mínima 1.424,40 €/mes (grupos 4–7). MEI 0,90 % (0,80 % en 2025).
- IRPF: escala estatal 9,5–24,5 % + autonómica de Madrid 8,5–20,5 % (máximo combinado 45 %). Gastos deducibles 2.000 €; reducción por rendimientos del trabajo hasta 7.302 €; mínimo personal 5.550 €.
- Ejemplos (soltero, Madrid): bruto 29.540 € → IRPF 4.478 € (15,2 %), neto 23.141 €, coste empresa 39.037 €. Gasto público 2024: protección social 41 %, salud 14,2 %, educación 9,1 % (de 725.001 M €).
- Mínimo autonómico de Madrid (5.956,65 €) y umbrales de su escala: fuente secundaria, verificar.
- **Autónomos (RETA 2026)**: cotización por ingresos reales, 15 tramos (3 reducida + 12 general); rendimiento de cotización = (ingresos − gastos) × (1 − 7 %) ÷ 12 (el 7 % es fuente secundaria); tipo total 31,5 %; el simulador supone la base mínima del tramo. Ejemplo: 3.000 € facturados y 500 € de gastos → tramo 6, base 1.274,51 €, cuota ≈ 401 €/mes. IRPF de la actividad: cuota deducible y 5 % de difícil justificación (máx. 2.000 €).

## Resumen 7 — Desempleo y pensiones
- Paro contributivo: 70 % de la base reguladora 180 días y 60 % después; 360 días cotizados → 4 meses, 2.160 → 24 meses. Topes 2026: 560/749 € mínimo, 1.225/1.400/1.575 € máximo (IPREM 600 €). Cese de actividad (autónomos): 70 % de la base de 12 meses, 12 meses seguidos mínimo, 4–24 meses según meses cotizados (fuentes secundarias S41–S43).
- Pensiones (sep-2026): 10,55 M de pensiones; media total **1.374,6 €**, jubilación **1.576,1 €**, nuevas altas 1.711,4 €. 2024: tramo modal 500–1.000 € (39,9 %); mediana estimada ≈ 986 € (todas) y ≈ 1.136 € (jubilación) — **estimaciones propias**. Máxima 3.359,60 €/mes; revalorización 2,7 %.

## Resumen 8 — Sanidad, educación y transporte (público vs privado)
- Sanidad: gasto público 2.079 €/hab (7,4 % del PIB). Consulta AP: 47–68 € (tarifas públicas a terceros) vs 17–90 € (privada). Noche de hospital: coste público 612–671 € (tarifa 615–1.339 €); **privado sin dato fiable**. RM 227 € (Navarra) vs 125–290 €.
- Educación: gasto público por alumno 2023 en centros públicos 7.943 € (Madrid 6.502 €). Privado Madrid 300–1.300 €/mes; concertado Madrid 135 €/mes; grado público Madrid ≈ 1.015 €/curso; privado 5.000–30.000 €.
- Transporte Madrid 2024: coste 1,65 €/viaje, el usuario paga 0,32 € (≈ 19 %); cobertura OMM 2023: Madrid 20 %, Barcelona 54 %, media 37 %.
- Datos dispersos y de fuentes secundarias; ver `fiabilidad` en los CSV.

## Resumen 9 — PIB de España
- PIB 2025 (avance INE): **1.690.012 M €**, +2,6 % real y +5,7 % nominal; 2024: +3,7 % real; 2020: −10,9 %. PIB per cápita 2025: 34.365 €.
- Serie anual 1995–2025 (Eurostat + INE). Real acumulado 2000–2025 ≈ +50 %.
- **Reparto por sectores 2025 (INE, tabla 69070, avance; `pib_sectores_vab_2024_2025.csv`)**: servicios **68,5 %** del PIB (75,6 % del valor añadido), industria 14,0 %, construcción 5,4 %, agricultura 2,8 %, impuestos netos sobre los productos 9,4 %. Mayores ramas de servicios: comercio-transporte-hostelería 22,0 %, administración pública-educación-sanidad 15,6 %, inmobiliarias 10,1 %, profesionales y administrativas 8,9 %. 22 ramas y 28 filas (2024 y 2025); los porcentajes son cálculo nuestro. Detalle en `AIDocs/pib.md`; en la web, queso con zoom en `#/pib`.

## Resumen 10 — Web de visualización (`web-react/`)
- Web estática (React + Vite) para GitHub Pages: explorador con buscador de 390 series a la vez (salarios INE por medida, edad, sector, ocupación y contrato, desigualdad, SMI, IPC, IPCA, PIB y agregados, vivienda IPV/IPVA, población 1971–2026, paro/empleo/actividad EPA, gasto EPF y renta/pobreza ECV), modos valores/índice/variación anual/acumulada, año base y rango, salario real, ayuda al pasar el ratón, lectura interpretada (▲▼■), simulador de sueldo y servicios públicos, páginas «Qué es el IPC», «Qué es el PIB» (con el queso del reparto por sectores) y «Método y fuentes».
- 390 series (6.026 puntos), incluidos el esfuerzo de compra de vivienda (años de salario para 80 m² a precio de tasación, 2008–2024, cálculo nuestro, cota baja; junto a la cifra oficial del Banco de España: 7,1 años en 2023 y 2024, 7,6 en 2025) y el alquiler en euros (2013–2024, cálculo nuestro: SERPAVI 2022 × índice IPVA). Gráfico CORE-Econ (salario nominal, IPC y salario real) en la portada; los gráficos con año base arrancan en él. Sin resolver en el explorador: hojas de foto fija (CCAA, provincias, distritos, pirámides), trimestrales/mensuales y Eurostat NUTS2.
- Los cálculos se hacen en el navegador y se marcan con `*`; los umbrales de interpretación y las marcas de épocas son criterio nuestro.
- Regenerar datos: `python tools/build_web_data.py` (por defecto escribe en `web-react/public/data`). Tests: `cd web-react && npm test` (219), con la comparación contra los Excel y el simulador. React: Node ≥ 20, `npm audit` = 0 (Vite 6, Vitest 4, React Router 7); no usar `npm audit fix --force`.
- Es la única versión de la web (la versión sin framework `web/` se retiró); para portfolio. Disponible en castellano e inglés (botón en la cabecera; sin librerías, diccionario en `src/i18n/en/`).

## Resumen 11 — Simulador (`#/simulador`, en `web-react/`)
- Pide sueldo bruto mensual (o facturación y gastos, si se es autónomo) y calcula nómina o cuentas del autónomo, coste de empresa desglosado y explicado, uso de sanidad/educación/transporte a lo largo de la vida (público frente a privado, % del sueldo, totales; visitas al médico «en toda la vida» —por defecto— o «al año», a elegir; coste anual de un seguro de salud privado) y balance aportado/usado según los años trabajados, con el **paro generado** y el **paro cobrado**. Apartado 4: paro generado para el Estado frente al paro que te tocaría si dejas de trabajar hoy. Historial laboral opcional (periodos de trabajo, autónomo y paro, rellenados sólo por la persona usuaria). Todo lo calculado lleva `*`; es una estimación.
- Parámetros: 21 CSV de `datos_web/` copiados a `data/sim/`. Alcance: Comunidad de Madrid, soltero sin hijos, 2026. Los 7 ejemplos validados coinciden al céntimo.
- Caso de partida (2.000 € × 14): neto 1.579 €/paga, coste de empresa 3.084 €/mes (40,3 % al sector público); 15 años → 223.502 € aportados (29.610 € de ellos de paro generado) vs 158.082 € usados; paro de hoy: 29.400 € en 24 meses.
- Apartado 5 «Estado o privado»: lo que te queda al año con impuestos y servicios públicos (neto menos matrícula y abono) frente a sin impuestos y todo privado (bruto o coste de empresa menos seguro o visitas, colegio privado y transporte sin ayudas), pago privado en cuotas mensuales y lo que dejarías de recibir (pensiones, paro…). Caso de partida: 21.848 € con lo público frente a 22.760 € con lo privado. También se muestra el sueldo sin impuestos en el apartado 1, y la tarjeta del seguro y el gasto público medio se explican en pantalla. Los precios públicos (tarifas a terceros) pueden salir más altos que los privados (comparadores): son dos clases de precio, ver `AIDocs/servicios_publicos_costes.md`.
- Simplificaciones propias: tras un periodo de paro las cotizaciones anteriores no cuentan para el siguiente; el paro se muestra bruto (sin retención de IRPF); autónomo sin tarifa plana ni reducciones.
- Detalle y límites en `AIDocs/web.md`.

## Huecos conocidos
- SERPAVI 2011–2024 por municipio y distrito (xlsx de 67,8 MB, descarga bloqueada): bajar a mano.
- HICP sin el grupo CP08 (Comunicaciones) por límite de Eurostat.
- SMI 2004–2017 sin contrastar (marcado en la hoja).
- Idealista: sin histórico anterior a oct-2025 ni tipologías. Fotocasa, notarios y registradores: no incluidos. Alquiler: no hay serie larga en euros de contratos nuevos ni de oferta (la serie de la web es contratos en vigor, hasta 2024). Accesibilidad a la vivienda (Banco de España): sólo se ha podido leer 2023–2025 y 2026-II; la serie larga está en su base de datos (bloqueada desde este entorno).
- Población: sin provincia, municipio ni distrito de Madrid ciudad (el portal de datos del Ayuntamiento bloquea la lectura automática), sin edad simple, sin país de origen y sin hogares por tamaño.
- IPC por provincia y subclase, precios de productos concretos, ETCL, salarios de convenio, paro de larga duración, NEET, tenencia y sobrecarga de vivienda (ECV).
- Cifras erróneas de un boletín de la Comunidad de Madrid (paro España 19.517; extranjeros Madrid 1.345) excluidas.
- Impuestos/cotizaciones: mínimos por hijos, ascendientes y discapacidad; deducciones autonómicas; deducción de rentas bajas del SMI (no confirmada); escala autonómica de Madrid con decimales exactos (BOCM).
- Sanidad: precio de una noche de hospital privado (sin fuente fiable); tarifas de pruebas diagnósticas de Madrid (anexo ilegible); frecuentación por edad.
- Educación: gasto por alumno actual por nivel y de FP; precio de la FP pública; niveles 1 y 2 de experimentalidad en Madrid.
- Transporte: coste por viaje oficial fuera de Madrid; Renfe Cercanías.
- Desempleo: subsidios asistenciales y retención de IRPF sobre la prestación (el simulador muestra el paro bruto). Autónomos: tarifa plana, reducciones y bonificaciones, pagos fraccionados, reducción del IRPF por rendimientos bajos (no confirmada) y la deducción del 7 % (una guía cita el 5 %). Pensiones: mínimas de viudedad, incapacidad y unidad económica; IMV; mediana y moda exactas (no publicadas).
- PIB: trimestral 2026, CCAA/Madrid y series anteriores a 1995. Reparto por sectores: sólo 2024–2025 (sin serie larga de la misma versión), sin desglose A*64 de Eurostat y sin las subramas de agricultura e industria manufacturera de 2025.
- Gasto COFOG: subfunción de transporte sin verificar.
- Web: falta el simulador de pensiones; el de sueldo/servicios/paro sólo cubre Madrid, soltero sin hijos (sin comunidades, hijos ni deducciones) y 2026; vistas de tabla/mapa/pirámide para los datos por CCAA, provincia y distrito, y series trimestrales. El IPC (dic/dic) y el salario (media anual) se cruzan por aproximación; en tasas (paro, empleo, pobreza) el índice y la variación son relativos, no en puntos.
