# Evolución del PIB de España

Fecha de consulta: **2026-10-22**. Datos en `datos_web/pib_espana_anual.csv`, `datos_web/pib_agregados_2023_2025.csv` y (reparto por sectores) `datos_web/pib_sectores_vab_2024_2025.csv`. Fuentes: S31 (INE, Contabilidad Nacional Anual, 18-sep-2026) y S32 (Eurostat `nama_10_gdp`).

## Cifras clave
- **PIB a precios corrientes**: 2000 → 647.569 M €; 2008 → 1.112.432 M €; 2020 → 1.129.214 M €; 2025 (avance INE) → **1.690.012 M €** (+5,7 % nominal; +2,6 % real). 2024 (provisional): 1.598.588 M € (+6,8 % nominal; +3,7 % real). 2023: 1.496.277 M € (+8,8 %; +2,4 %).
- **Crecimiento real anual**: máximo del periodo 5,2 % (2000); caídas en 2009 (−3,8 %), 2011 (−0,6 %), 2012 (−2,9 %), 2013 (−1,4 %) y 2020 (**−10,9 %**); rebotes en 2021 (6,7 %) y 2022 (6,4 %).
- **Acumulado 2000–2025**: el PIB real (volumen) crece ≈ 50 % (índice 150,3 con base 2000 = 100), ≈ 1,6 % anual; el nominal se multiplica por 2,6 (≈ 3,9 % anual).
- El PIB real recuperó el nivel de 2007 en **2016** y el de 2019 en **2022**.
- **PIB per cápita**: 30.945 € (2023), 32.708 € (2024), 34.365 € (2025). Deflactor del PIB: 3,1 % (2024), 3,0 % (2025).
- 2025: remuneración de asalariados 817.261 M €; excedente bruto y renta mixta 703.714 M €; 22,70 M de ocupados; 37.063 M de horas trabajadas.

## Columnas de `pib_espana_anual.csv`
`anio`, `pib_precios_corrientes_millones_eur`, `variacion_real_pct`, `variacion_nominal_pct`, `indice_volumen_2000_100_derivado`, `fuente_id`, `estado_y_nota`.

## Limitaciones
- **Dos vintages**: 1995–2022 vienen de Eurostat (cifras anteriores a la revisión de septiembre de 2026 del INE) y 2023–2025 del INE (base nueva). Hay una pequeña discontinuidad en 2022→2023 (p. ej. Eurostat da 1.497.761 M € para 2023, el INE 1.496.277 M €). Los 2023–2025 son provisionales o avance y se revisarán.
- La variación real 2020 es −10,9 % en la serie Eurostat; ya hubo revisiones del INE en el pasado.
- El **índice de volumen** (2000 = 100) se calcula encadenando las variaciones reales anuales (aproximado).
- No se obtuvo el **PIB trimestral de 2026** ni series anteriores a 1995; la serie anterior a 1995 y por CCAA/Madrid queda como hueco.
- Para cruzar con salarios e IPC: ver `02_Salarios.xlsx` y `03_Coste_de_la_Vida.xlsx` (misma carpeta), en euros corrientes; para comparar con el PIB nominal ajustar por IPC con cuidado (el PIB per cápita usa población del INE).

## Reparto por sectores (valor añadido por ramas, 2024–2025)

Fecha de consulta: **2026-10-23**. Datos en `datos_web/pib_sectores_vab_2024_2025.csv` (28 filas, 4 niveles: PIB → 4 sectores + impuestos → 7 ramas de servicios y 4 de industria → 10 subramas). Fuentes: **S48** (INE, tabla 69070 «Valor añadido bruto», Contabilidad Nacional Anual, Revisión Estadística 2024, publicada el 30-sep-2026; 2024 provisional, 2025 avance) y **S31** (nota de prensa del INE, que da las mismas cifras agregadas). Euros a precios corrientes.

**Qué es cada total.** PIB = valor añadido bruto (VAB) de las ramas + impuestos netos sobre los productos. En 2025: PIB 1.690.012 M € = VAB 1.531.681 M € + impuestos 158.331 M €. Por eso hay dos formas de dar el peso de un sector: sobre el **PIB** (servicios 68,5 %) y sobre el **VAB** (servicios 75,6 %). Las dos columnas de porcentaje las calculamos nosotros (`*` en la web) dividiendo las cifras del INE.

### Peso de cada sector y rama (2025, porcentajes calculados por nosotros)

| Rama | 2024 (M €) | 2025 (M €) | % del PIB 2025 | % del VAB 2025 | Var. nominal 2025/2024 |
|---|---:|---:|---:|---:|---:|
| PIB a precios de mercado | 1.598.588 | 1.690.012 | 100,0 % | — | 5,7 % |
| &nbsp;&nbsp;Agricultura, ganadería, silvicultura y pesca | 42.587 | 46.587 | 2,8 % | 3,0 % | 9,4 % |
| &nbsp;&nbsp;Industria | 227.521 | 236.410 | 14,0 % | 15,4 % | 3,9 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Industria manufacturera | 172.662 | 178.777 | 10,6 % | 11,7 % | 3,5 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Suministro de energía eléctrica, gas y vapor | 35.050 | 36.556 | 2,2 % | 2,4 % | 4,3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Suministro de agua, saneamiento y residuos | 16.006 | 17.283 | 1,0 % | 1,1 % | 8,0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Industrias extractivas | 3.803 | 3.794 | 0,2 % | 0,2 % | -0,2 % |
| &nbsp;&nbsp;Construcción | 81.632 | 90.592 | 5,4 % | 5,9 % | 11,0 % |
| &nbsp;&nbsp;Servicios | 1.105.000 | 1.158.092 | 68,5 % | 75,6 % | 4,8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Comercio, transporte y hostelería | 350.550 | 371.806 | 22,0 % | 24,3 % | 6,1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Comercio al por mayor y al por menor; reparación de vehículos | 188.813 | 198.507 | 11,7 % | 13,0 % | 5,1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Transporte y almacenamiento | 66.459 | 70.822 | 4,2 % | 4,6 % | 6,6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hostelería | 95.278 | 102.477 | 6,1 % | 6,7 % | 7,6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Información y comunicaciones | 60.169 | 64.840 | 3,8 % | 4,2 % | 7,8 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Actividades financieras y de seguros | 81.397 | 77.124 | 4,6 % | 5,0 % | -5,2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Actividades inmobiliarias | 166.951 | 171.257 | 10,1 % | 11,2 % | 2,6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Actividades profesionales, científicas, técnicas y administrativas | 137.787 | 150.984 | 8,9 % | 9,9 % | 9,6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Actividades profesionales, científicas y técnicas | 79.978 | 89.294 | 5,3 % | 5,8 % | 11,6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Actividades administrativas y servicios auxiliares | 57.809 | 61.690 | 3,7 % | 4,0 % | 6,7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Administración pública, educación, sanidad y servicios sociales | 249.825 | 262.826 | 15,6 % | 17,2 % | 5,2 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Administración pública y defensa; Seguridad Social | 85.431 | 90.019 | 5,3 % | 5,9 % | 5,4 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Educación | 72.910 | 76.791 | 4,5 % | 5,0 % | 5,3 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Actividades sanitarias y de servicios sociales | 91.484 | 96.016 | 5,7 % | 6,3 % | 5,0 % |
| &nbsp;&nbsp;&nbsp;&nbsp;Artes, otros servicios y hogares | 58.321 | 59.255 | 3,5 % | 3,9 % | 1,6 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Actividades artísticas, recreativas y de entretenimiento | 23.708 | 23.316 | 1,4 % | 1,5 % | -1,7 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Otros servicios | 22.913 | 23.627 | 1,4 % | 1,5 % | 3,1 % |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hogares como empleadores de personal doméstico y productores para uso propio | 11.700 | 12.312 | 0,7 % | 0,8 % | 5,2 % |
| &nbsp;&nbsp;Impuestos netos sobre los productos | 141.848 | 158.331 | 9,4 % | — | 11,6 % |

Lectura rápida: servicios 68,5 % del PIB; las tres mayores ramas de servicios son comercio-transporte-hostelería (22,0 %), administración pública-educación-sanidad (15,6 %) e inmobiliarias (10,1 %, incluye el alquiler imputado a quien vive en su casa). Dentro de las ramas agregadas: hostelería 6,1 % del PIB, sanidad y servicios sociales 5,7 %, administración pública y Seguridad Social 5,3 %, educación 4,5 %. Las financieras son la única rama de servicios que baja en euros corrientes en 2025 (−5,2 %).

### Cómo está en la web
- Página «Qué es el PIB» (`#/pib`), apartado «De qué está hecho el PIB»: queso (donut) con zoom — pulsa una porción para abrir su desglose (Servicios → rama → subrama; también Industria) —, selector de año (2025/2024) y de total (PIB con impuestos / valor añadido sin impuestos), y tabla con las 28 filas. Componente `SectoresPib.jsx`, lógica en `domain/sectores.js`, datos en `public/data/pib_sectores.csv` (copia literal que genera `tools/build_web_data.py`).

### Verificación y limitaciones
- **Comprobado**: cada rama suma exactamente sus partes en los dos años (lo exige el test `pib-sectores.test.mjs` y el cargador de la web); el PIB coincide con `pib_espana_anual.csv`; los pesos y las variaciones coinciden con los de la nota de prensa del INE (S31): agricultura 2,8 %, industria 14,0 %, construcción 5,4 %, servicios 68,5 %, impuestos 9,4 %; variación nominal servicios +4,8 %, impuestos +11,6 %.
- Las cifras se leyeron de la API del INE (tabla 69070) y de la nota de prensa con la herramienta de lectura web, no con descarga directa del archivo.
- Sólo 2024 y 2025: la serie larga de esta misma versión no se ha cargado y no se mezcla con tablas antiguas (p. ej. la tabla 32450, con datos hasta 2022 y otra base).
- Máximo detalle publicado para 2025: 22 ramas (A*38 agrupado). Las subramas de agricultura (ganadería, silvicultura, pesca) y de industria manufacturera (alimentación, textil…) sólo están para 2024 y no se han incluido. El desglose A*64 de Eurostat (`nama_10_a64`) no se ha consultado.
- El impuesto neto sobre los productos de 2024 (141.848 M €) es derivado (PIB − VAB de las cuatro ramas): coincide con la variación +11,6 % que da el INE para 2025.
- No hay reparto por comunidades autónomas ni para Madrid, ni peso en el empleo por rama en este archivo (el empleo por sectores está en `01_Empleo_Desempleo.xlsx`).
