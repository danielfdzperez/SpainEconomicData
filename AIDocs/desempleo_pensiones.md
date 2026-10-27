# Prestación por desempleo y pensiones

Fecha de consulta: **2026-10-22**. Datos en `datos_web/`. Fuentes: S08, S09, S33–S37 de `FUENTES.md`.

## Desempleo contributivo (`desempleo_duracion.csv`, `desempleo_parametros_2026.csv`)
- **Cuánto**: 70 % de la base reguladora los primeros 180 días y 60 % desde el día 181. Base reguladora = media de la base de cotización por contingencias profesionales de los últimos 180 días (definición legal; no figura en la fuente web).
- **Cuánto tiempo**: con 360 días cotizados en los últimos 6 años → 120 días; cada tramo de 180 días cotizados añade 60 días; con 2.160 o más → 720 días (24 meses). Tabla completa en el CSV.
- **Topes 2026 (mensuales)**: mínimo 560 € (sin hijos) / 749 € (con hijos); máximo 1.225 € (sin hijos), 1.400 € (1 hijo), 1.575 € (2 o más). Salen de aplicar 80 %, 107 %, 175 %, 200 % y 225 % al IPREM con pagas extra (600 × 14/12 = 700 €).
- **IPREM 2026**: 600 €/mes (7.200 €/año en 12 pagas, 8.400 en 14); congelado desde 2023 por la prórroga presupuestaria.

Cálculo del paro total: importe mensual = limitar(70 % × BR, entre mínimo y máximo) durante los primeros 6 meses + limitar(60 % × BR, entre mínimo y máximo) durante el resto de los meses de la tabla. Ejemplo: BR 2.000 €/mes y 720 días cotizados (8 meses) → 6 × 1.225 (tope) + 2 × 1.200 = 9.750 € (bruto, sin retención de IRPF ni cotización).

Fuera de alcance: subsidios asistenciales (no se obtuvo la cuantía vigente) y retención del IRPF sobre la prestación.

## Cese de actividad (autónomos, `autonomos_parametros_2026.csv`, `autonomos_cese_actividad_duracion.csv`)
Fuentes secundarias: S41, S42, S43. Prestación del 70 % de la base de cotización media de los últimos 12 meses, con el mismo mínimo y máximo que el paro (560 y 1.225 € sin hijos). Exige al menos 12 meses cotizados **seguidos** justo antes del cese; la duración sale de los meses cotizados en los últimos 48 (12–17 → 4 meses … 48 → 24 meses). Los días de asalariado no cuentan para el cese y los meses de autónomo no cuentan para el paro.

## Cómo lo usa el simulador (`#/simulador`, apartados 3 y 4)
Código en `domain/paro.js` (prestaciones) y `domain/historial.js` (historial por periodos). Todo importe es bruto, en euros de 2026, para una persona sin hijos.
- **Paro generado para el Estado** = cotización por desempleo del trabajador + de la empresa (en un autónomo, la cuota por cese de actividad), sumada por periodo trabajado. Forma parte de lo aportado (apartado 3).
- **Paro que te tocaría hoy** (apartado 4): base reguladora = media ponderada de las bases de los últimos 180 días (12 meses en autónomo); días cotizados = 360 por año trabajado por cuenta ajena en los últimos 6 años; 70 % los primeros 6 meses y 60 % después, con mínimo y máximo.
- **Paro ya cobrado**: sin historial detallado, los meses que declara la persona por el sueldo de hoy; con historial, cada periodo «Paro» cobra lo que daban las cotizaciones anteriores (si se declaran más meses de los que daban derecho, sólo cuentan los que daban derecho). Lo cobrado cuenta como **usado del sistema** en el balance.
- **Simplificación propia**: tras un periodo de paro, las cotizaciones anteriores no vuelven a contar para el siguiente (aunque no se agotara la prestación). La ley permite conservar los días no consumidos.
- No se modelan: retención de IRPF ni cotización sobre la prestación, subsidios, hijos a cargo, compatibilidad con trabajo a tiempo parcial, causa del despido (se supone que da derecho) ni la indemnización.

## Pensiones contributivas
Archivos: `pensiones_estadisticas.csv` (indicadores), `pensiones_tramos_2024.csv` (distribución por cuantía), `pensiones_parametros_2026.csv`.

**Septiembre 2026 (Seguridad Social)**: 10.547.417 pensiones; unos 9,5 M de pensionistas; nómina mensual 14.498,2 M €. Pensión media total **1.374,6 €/mes** (+4,6 %), jubilación **1.576,1 €** (+4,5 %), viudedad 976,3 € (jul), nuevas altas de jubilación 1.711,4 € (ago). Edad media de acceso 65,4 años (64,4 en 2019). Media de jubilación por régimen: general 1.734,7 €, autónomos 1.062,8 €, minería 3.005,7 €, mar 1.741,2 €.

**2024 (Ministerio de Trabajo, media anual)**: 10.188.818 pensiones (6.484.984 de jubilación). Media total 1.255,43 €; jubilación 1.442,67 €; incapacidad 1.163,05 €; viudedad 896,25 €; orfandad 502,11 €.

**Distribución 2024 (todas las pensiones)**: ≤ 500 €: 11,2 %; ≤ 1.000 €: 51,1 %; ≤ 1.500 €: 71,8 %; ≤ 2.000 €: 82,8 %; > 3.175,04 € (máxima): 1,1 %.
- **Moda (tramo)**: 500,01–1.000 € (39,9 % de las pensiones; 35,3 % de las de jubilación).
- **Mediana estimada** (interpolada, **estimación propia**): todas ≈ 986 €/mes; jubilación ≈ 1.136 €/mes.
- **Percentiles estimados** (todas / jubilación): P10 457 / 554; P25 673 / 767; P50 986 / 1.136; P75 1.633 / 1.973; P90 2.526 / 2.743.
- La media (1.255 €) supera con holgura a la mediana (986 €): la distribución tiene cola derecha.
- 1-jul-2026: 1.871.962 jubilaciones (27,8 %) cobran 2.000 € o más.

**Parámetros 2026**: revalorización 2,7 %; máxima 3.359,60 €/mes (47.034,40 €/año, 14 pagas); mínimas de jubilación 65+ sin cónyuge 12.441,80 €/año (888,70 €/mes) y con cónyuge 17.592,40 €/año (1.256,60 €/mes); pensión no contributiva 8.803,20 €/año (628,80 €/mes). Gasto en pensiones 2024: 206.130 M € (IGAE).

### Limitaciones
- No existe publicación oficial de la **mediana ni de la moda exactas**; las del CSV se calculan de tramos agrupados (error probable de decenas de euros, mayor cerca de los bordes de tramos).
- Las cifras de 2024 y 2026 no son comparables punto a punto (2024 es media anual; 2026 es septiembre) y las pensiones no tienen en cuenta pagas extra a efectos de la tabla (se entienden mensuales, 14 pagas).
- Las mínimas por «unidad económica», viudedad e incapacidad y el Ingreso Mínimo Vital **no se obtuvieron** (la nota de La Moncloa no da el importe).
- Las cantidades de nº de pensiones por clase (jubilación, viudedad, incapacidad) son aproximadas ("casi 6,8 M", "más de 2,3 M").
- Fuentes secundarias: S08 (portal OIE) para topes y tabla del paro, S37 (prensa) para el tramo ≥ 2.000 €. Contrastar con el SEPE y el INSS antes de publicar como oficial.
- Lo que falta para «lo que aporta cada persona al sistema de pensiones» es la pensión media por años cotizados y la esperanza de vida a los 65 (INE, ya en `05_Poblacion.xlsx` en parte).
