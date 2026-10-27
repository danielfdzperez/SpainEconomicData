# Población — España y Comunidad de Madrid

Libro: `05_Poblacion.xlsx` · Consulta: 2026-10-21 · Último dato: **1-jul-2026 (INE, Estadística Continua de Población, provisional)**

## Qué contiene
| Hoja | Contenido | Cobertura |
|---|---|---|
| `Resumen_Poblacion` | Cuadro España vs Madrid con las cifras clave | último dato |
| `Pob_CCAA_1jul2026` | Población por CCAA: total, hombres, mujeres, extranjeros, % sobre España, ranking | 1-jul-2026 |
| `Edad_Total`, `Edad_Hombres`, `Edad_Mujeres`, `Edad_Extranjeros` | Grupos quinquenales (0–4 … 85–89, 90+) × España y 19 CCAA; columna de suma de CCAA y diferencia con España; filas de comprobación | 1-jul-2026 |
| `Estructura_Edad` | % 0–14, 15–64, 65+, 80+, índice de envejecimiento, dependencia, % extranjeros, mujeres por 100 hombres, rankings (fórmulas) | 1-jul-2026 |
| `Piramide_Mad_vs_Esp` | Pirámide en % por sexo, Madrid frente a España | 1-jul-2026 |
| `Historico_1971_2026` | Población a 1 de enero (total y hombres, España y Madrid), crecimiento, TCAC con años editables | 1971–2026 |
| `Trimestral_2021_2026` | Población trimestral (ECP) con variaciones | 2021T1–2026T3 |
| `Indicadores_Demograficos` | Esperanza de vida, edad mediana y media, índice de envejecimiento, saldo vegetativo, natalidad, mortalidad, fecundidad (ICF), personas por hogar | 2024 / 1-ene-2025 |
| `Proyecciones_INE` | Proyección de población 2026–2076 (nota de prensa del INE) | 2026–2076 |
| `Madrid_Ciudad_Padron_2026` | Padrón del Ayuntamiento de Madrid (ciudad) | 1-ene-2026 |

## Cifras clave
| Indicador | España | Madrid (Comunidad) |
|---|---|---|
| Población 1-jul-2026 | 49.801.559 | 7.201.554 (14,46 % de España) |
| Hombres / mujeres | 24.462.607 / 25.338.952 | 3.450.616 / 3.750.938 |
| Extranjeros (nacionalidad) | 7.437.543 (14,9 %) | 1.229.486 (17,1 %; 4.ª CCAA) |
| Mujeres por 100 hombres | 103,6 | 108,7 |
| % de 65 y más años | 21,2 % | 19,4 % (máx. Asturias 28,8 %; mín. Melilla 13,7 %) |
| Población 1-ene-2026 | 49.596.376 | 7.168.876 |
| Crecimiento 1-jul-2025 → 1-jul-2026 | +0,90 % | +0,75 % |
| Crecimiento 5 años | +5,2 % | +7,2 % |
| Crecimiento 1971–2026 | +45,7 % | +90,6 % |
| Edad mediana (1-ene-2025) | 45,83 | 44,22 |
| Esperanza de vida al nacer 2024 | 84,01 | 85,58 (la más alta de las CCAA) |
| Índice de fecundidad 2024 | 1,10 | 1,09 (Melilla 1,36 máx.; Canarias 0,82 mín.) |
| Personas por hogar (ECP, 2026) | 2,49 | 2,58 |
| Proyección 2026–2041 | +8,6 % (+4,25 M; > 53,8 M) | +14,4 % (≈ 8,2 M) |

CCAA más pobladas: Andalucía 8.778.051; Cataluña 8.233.788; Madrid 7.201.554; C. Valenciana 5.574.948; Galicia 2.734.494. % extranjeros más alto: Baleares 22,1 %, C. Valenciana 21,1 %, Cataluña 19,4 %, Madrid 17,1 %. Proyección 2026–2041: C. Valenciana +16,4 %, Baleares +16,2 %; descensos en Extremadura −4,5 %, Asturias −1,6 %, Castilla y León −1,0 %.

Padrón del Ayuntamiento de Madrid (ciudad), 1-ene-2026: 3.497.277 personas (frente a 3.527.924; −30.647, por bajas administrativas). No es comparable directamente con la ECP del INE.

## Reglas de interpretación
- La **ECP** (Estadística Continua de Población) estima población residente a fechas trimestrales; las cifras más recientes son **provisionales**. No confundir con el **Padrón** municipal (1 de enero) ni con las proyecciones.
- «Extranjeros» = nacionalidad extranjera (no país de nacimiento).
- En `Edad_*` la fila «Todas las edades» debe coincidir con la suma de grupos; las filas de comprobación deben dar 0. La columna V (suma de CCAA) se compara con España (col. B); España no trae extranjeros por edad en la fuente, por eso se calcula como suma de CCAA.
- Series 2003–2012 de España vienen con decimales en la fuente (estimaciones); aquí aparecen redondeadas.
- Indicadores IDB (esperanza de vida, fecundidad, natalidad, mortalidad, saldo vegetativo) son de **2024**; edades mediana/media e índice de envejecimiento son de **1-ene-2025**: no mezclar fechas con los datos de 2026.
- Las proyecciones son un escenario del INE (junio 2026), no una previsión.

## Huecos
- Población por provincia, municipio y distrito (la tabla de municipios existe pero no se cargó); distritos de Madrid ciudad: `datos.madrid.es` bloquea la lectura automática (robots).
- Edad simple (año a año) y país de origen / nacionalidad concreta (tablas 77019 y 56942 sin cargar).
- Hogares por tamaño (tabla 60131) y tipos de hogar; solo se incluye personas por hogar (60132).
- Movimiento natural y migraciones (flujos) por año; solo indicadores 2024.
