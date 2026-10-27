# Empleo y desempleo — España y Comunidad de Madrid

Libro: `01_Empleo_Desempleo.xlsx` · Consulta: 2026-10-21 · Último dato EPA: **2026T2**

## Qué contiene
| Hoja | Contenido | Cobertura |
|---|---|---|
| `Resumen_Empleo` | Indicadores clave España vs Madrid (enlaces a hojas de detalle) | último dato |
| `EPA_Tasas_Trim` | Tasa de paro, empleo y actividad trimestral, ambos sexos, por edad (Total, <25, 25 y más, 16–19, 20–24) | 2002T1–2026T2 |
| `EPA_Tasas_Anual_Calc` | Media anual de las tasas trimestrales (fórmula, solo con 4 trimestres) | 2002–2025 |
| `EPA_Paro_Anual_SexoEdad` | Tasa de paro, media anual publicada por INE, por sexo y 6 tramos de edad | 2006–2025 |
| `EPA_Paro_Brecha_MAD_ESP` | Madrid − España en puntos porcentuales | 2006–2025 |
| `EPA_Paro_CCAA_2025` | Tasa de paro 2025 por CCAA y edad, con ranking | 2025 |
| `EPA_Absolutos_2026T2` | Ocupados, parados, población por CCAA (miles) + tasa recalculada | 2026T2 |
| `EPA_Ocupados_4T` | Ocupados en los últimos 4 trimestres | 2025T3–2026T2 |
| `EPA_Madrid_Edad_2026T2` | Madrid: ocupados/parados/población por edad; tasas de actividad, empleo, paro por edad y sexo | 2026T2 |
| `EPA_Sectores_2026T2` / `_Resumen` | Ocupados por sector (CNAE-2025) × sexo × edad | 2026T2 |
| `Eurostat_Paro/Empleo/Actividad_NUTS2` | EU-LFS regional (ES30 = Madrid, ES = España) por sexo y edad | 2005–2025 |
| `Paro_Registrado_Afiliacion` | Paro registrado (SEPE), contratos, prestaciones, afiliados (Seg. Social) | 2026-06 a 2026-09 |

## Cifras clave (verificadas contra el libro)
| Indicador | España | Madrid |
|---|---|---|
| Tasa de paro EPA 2026T2 (%) | 9,87 | 7,58 |
| Paro menores de 25, 2026T2 (%) | 23,77 | 19,81 |
| Tasa de empleo / actividad 2026T2 (%) | 53,44 / 59,29 | 59,08 / 63,92 |
| Ocupados / parados 2026T2 (miles) | 22.779,0 / 2.495,3 | 3.631,3 / 297,9 |
| Tasa de paro media 2025 (%) | 10,50 | 7,97 |
| Máximo anual de paro (%) | 26,09 (2013) | 19,76 (2013) |
| Paro registrado (personas) | 2.379.505 (sep-2026) | 273.631 (jun-2026) |
| Afiliados medios ago-2026 | 22.345.226 | 3.871.993 |
| Peso de Servicios en el empleo 2026T2 (%) | 75,8 | 85,4 |

CCAA con más paro 2025: Melilla 24,85 %, Ceuta 24,30 %, Andalucía 15,23 %, Extremadura 14,75 %, Canarias 13,52 %. Menos: País Vasco 7,33 %, Cantabria 7,34 %, Navarra 7,69 %, Madrid 7,97 %.

## Controles de calidad hechos
- Tasa de paro recalculada con ocupados y parados (9,873 % España; 7,582 % Madrid) coincide con la publicada.
- Medias anuales de los trimestres coinciden con la tabla anual del INE 74999 (ej. Madrid 2025: 7,97 en ambas).
- Las tasas de actividad/empleo de Madrid 16+ recalculadas con población EPA coinciden con las publicadas (63,92 / 59,08).

## Límites y huecos
- Series trimestrales solo ambos sexos; por sexo solo medias anuales (hoja `EPA_Paro_Anual_SexoEdad`).
- El tramo 20–24 no existe antes de 2008T4/2009T1 (celdas vacías = sin dato).
- Sector EPA en CNAE-2025 solo con 4 grandes sectores; la serie CNAE-2009 (tabla 66088) acaba en 2008 y no se incluye.
- Paro registrado: Madrid llega a **junio 2026** (boletín iEstadis; su encabezado dice julio). El boletín trae cifras nacionales erróneas (paro 19.517; extranjeros Madrid 1.345) que se **excluyeron**.
- Mujeres de Madrid en absolutos = ambos − hombres (cálculo propio).
- Pendiente: larga duración, tipo de contrato y jornada, inactivos, NEET, paro registrado histórico por provincia/sector/edad.
- Definiciones: INE (16 y más) y Eurostat (15–74/15–64) no coinciden; no mezclar.

## Cómo ampliar
Ver `fuentes_y_metodologia.md` (API del INE, variables de filtro, tablas candidatas: 65302, 65332, 65285, 79325, 74999, 65334).
