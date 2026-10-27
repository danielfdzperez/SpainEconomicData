# Salarios — España y Comunidad de Madrid

Libro: `02_Salarios.xlsx` · Consulta: 2026-10-21 · Último año: **2024** (INE EAES, publicada el 28-05-2026)

## Qué contiene
| Hoja | Contenido | Cobertura |
|---|---|---|
| `Resumen_Salarios` | Cuadro 2024: media, mediana, moda, P10, cuartiles, P90, ratios, brecha de género, DT estimada, SMI | 2024 |
| `EES_Distribucion` | Media, P10, cuartil inf., mediana, cuartil sup., P90 por sexo (ambos/mujeres/hombres), España y Madrid | 2008–2024 |
| `EES_Moda` | Salario modal y detalle (nota de prensa INE) | 2022–2024 España |
| `Estimacion_DesvTipica` | Desviación típica **estimada** (no oficial) por 3 métodos lognormales | 2008–2024 |
| `EES_Edad` | Salario medio por tramo de edad × sexo (España 11 tramos; Madrid 5 tramos) | 2008–2024 |
| `EES_CCAA_2024` | Distribución por CCAA con ratios y ranking | 2024 |
| `EES_Sector_Ocup_Contrato` | Salario medio por sector CNAE-09, ocupación CNO-11 y tipo de contrato (España) | 2008–2024 |
| `EES_Desigualdad_SMI` | Gini, tasa de salario bajo, razones de deciles y % de trabajadores por múltiplos del SMI | 2008–2024 |
| `AEAT_Centiles_2024` | Nº de asalariados y salario medio por centil/decil y sexo (Agencia Tributaria) | 2024 |
| `SMI_Historico` | SMI mensual (14 pagas), anual, variación y % sobre el salario mediano | 2004–2026 |

Unidades: **euros brutos al año** por trabajador asalariado.

## Cifras clave 2024
| | España | Madrid |
|---|---|---|
| Media | 29.540,26 | 34.410,01 |
| Mediana | 24.497,17 | 28.037,75 |
| Moda | 16.520,18 | n.d. |
| P10 / P90 | 12.018,46 / 52.515,27 | 13.728,43 / 63.685,49 |
| Cuartiles (inf./sup.) | 17.457,47 / 36.969,61 | 18.872,44 / 43.598,00 |
| Brecha de género en la media | 16,1 % | 17,5 % |
| DT estimada (no oficial) | ≈ 17.800–19.900 | ≈ 22.600–24.500 |

- CCAA con salario medio más alto: País Vasco 35.170,28; Madrid 34.410,01; Navarra 32.605,28. Más bajo: Extremadura 24.979,44.
- Sectores: mayor, energía eléctrica/gas 57.931,81; menor, hostelería 17.653,42. Contratos: indefinido 29.745,04; temporal 27.318,40.
- SMI 2026: 1.221 €/mes en 14 pagas = 17.094 €/año (RD 126/2026). SMI 2024 equivale al 64,8 % del salario mediano.
- AEAT 2024: 14.187.169 asalariados con año completo y ≥ SMI; salario medio 32.078; decil 10 con 80.189 de media.
- Crecimiento nominal de la media 2008–2024: España +35,0 %, Madrid +36,2 %.

## Controles hechos
Media, mediana, brecha de género y orden de CCAA coinciden con la nota de prensa del INE (2024); medias 2022–2023 coinciden con las notas de esos años.

## Reglas de interpretación
- Celdas con **fondo naranja**: muestra de 100–500 observaciones (INE las publica en negativo; aquí en positivo). Celda vacía: <100 observaciones.
- **Desviación típica**: ningún organismo la publica. Se aproxima con ln(salario) ~ Normal; DT = media·√(e^σ²−1). Tres σ: P90/P10, cuartiles, media/mediana. La cola real es más pesada: la DT real suele ser mayor. Siempre llamarla "estimación no oficial".
- **Moda** solo para 2022–2024 (nota de prensa); Madrid no tiene.
- Percentiles extremos (P1…P99): solo en AEAT, población distinta (año completo ≥ SMI): no comparar con la EES.
- Ruptura metodológica 2018→2019 en los tramos de SMI.
- SMI 2018–2026 verificado con dos fuentes; **2004–2017 son cifras históricas recordadas sin contrastar** (columna `verificacion`).

## Huecos
ETCL (coste laboral trimestral, tabla 6061), salario por hora, deciles de salario EPA por CCAA (66241), AEAT por edad/CCAA/provincia/sector (Madrid), salarios de convenio, Madrid por sector/ocupación/contrato.
