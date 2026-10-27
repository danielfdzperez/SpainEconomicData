# Coste de sanidad, educación y transporte público (público vs privado)

Fecha de consulta: **2026-10-22**. Datos en `datos_web/`. Fuentes: S10–S30 de `FUENTES.md`.
**Esta es la parte con datos más dispersos**: no existe un único listado oficial; muchos importes salen de tarifas autonómicas a terceros y de comparadores privados. Mira siempre `tipo_dato` y `fiabilidad`.

## Sanidad
Archivos: `sanidad_costes_servicios.csv` (61 filas, formato largo: servicio × ámbito × territorio), `sanidad_gasto_agregado.csv`.

Tres ámbitos (columna `ambito`):
- `publico_tarifa_a_terceros`: el precio público que cobra la sanidad autonómica a mutuas, aseguradoras de tráfico o extranjeros. **Es la mejor aproximación oficial al coste**; el paciente del SNS no paga.
- `publico_coste_real`: coste contable (por cama, por noche).
- `privado_precio`: lo que paga quien va sin seguro, según comparadores y portales.

| Servicio | Pública (tarifa/coste) | Privada |
|---|---|---|
| Consulta de cabecera | 47 € Navarra 2025; 50 € Madrid 2023; 68 € País Vasco 2025 | 17–55 € o 40–90 € |
| Primera consulta especialista | 132 € Madrid; 147 € Navarra | 60–120 € |
| Urgencias (sin ingreso) | 185 € Madrid (general) | 100–250 €; 300–800 € con pruebas |
| Día de hospitalización | 615 € Navarra; 612 € coste real Río Hortega; ≈ 671 € coste medio por cama SNS; 1.339 € País Vasco | **sin dato fiable** |
| Día de UCI | 2.577 € Navarra | sin dato |
| Resonancia magnética | 227 € Navarra | 125–290 € |
| TAC / ecografía / analítica | ecografía 77 € Navarra | TAC 117–260; eco 60–110; analítica 40–79 |
| Parto | 3.293–13.470 € Navarra | 4.500–10.000 € natural; 6.000–15.000 € cesárea |

Gasto agregado (Ministerio de Sanidad, año no especificado en la fuente; informe 2025): gasto público 99.300 M € = **2.079 €/habitante** (7,4 % del PIB); total con privado 134.000 M € = 2.805 €/hab (10,0 %). Cada habitante hace al año ~5,0 consultas médicas de AP, 3,0 de enfermería y 1,9 hospitalarias. Coste medio por hospitalización: 5.449 €. Gasto COFOG salud 2024: 102.942 M €.

**Cómo usarlo para «lo que aportas vs lo que consumes en sanidad»**: coste esperado anual ≈ Σ(frecuencia × tarifa). Con los datos: 5,0 × 50 + 3,0 × (cura 29 €) + 1,9 × 132 ≈ 590 € de consultas, el resto hasta 2.079 €/hab proviene de hospitalización, farmacia y urgencias. Para algo más fino faltan frecuencias por edad (no incluidas).

### Seguro de salud privado al año (simulador)
`sanidad_costes_servicios.csv` trae la **prima mensual** de un seguro privado: `prima_seguro_salud` (seguro de entrada, 18,05 €/mes de media, con copago por consulta) y `prima_seguro_salud_con_parto` (115 €/mes, rango 50–180). El simulador la multiplica por 12 y por los años de edad (con la prima de hoy, sin subirla con la edad) y la compara con lo contado de la pública y con el gasto medio por habitante. Es una comparación orientativa: las primas de entrada tienen límites de cobertura, carencias y listas de espera distintas a la pública.

### Visitas «en toda la vida» o «al año» (simulador)
La frecuencia nacional (5,0 médico de cabecera, 3,0 enfermería y 1,9 especialista al año) se puede introducir de dos formas. Por defecto, **en toda la vida** (valor de partida = frecuencia × 40 años: 200, 120 y 76); al cambiar a «al año» se convierte lo escrito con la edad. Las dos formas dan el mismo total si la edad no cambia.

### ¿Por qué hay precios públicos más altos que los privados? (revisado 2026-10-22)
Es normal en estos datos y **no es un error de cálculo**: son dos clases de precio. La tarifa pública a terceros (Madrid 2023 propuesta, Navarra y País Vasco 2025) debe cubrir todo el coste del hospital; el privado es el precio de lista de una consulta o prueba suelta en una clínica (portales comparadores, 2026, fiabilidad media/baja, sin estadística oficial). Casos vistos: primera consulta de especialista 132 € (público, Madrid) frente a 90 € (privado, rango 60–120; >200 en clínicas premium); urgencias 185 frente a 175; RM 227 (Navarra) frente a 207,5; ecografía 77 frente a 85 (aquí sí más cara la privada). Además el simulador aplica la tarifa de **primera** consulta a todas las visitas de especialista (la sucesiva de Madrid es 79 €), así que esa línea pública puede quedar algo alta. No se han corregido los datos: se muestran tal cual, con su rango, y la pantalla avisa de las líneas afectadas.

### Comparación Estado o privado (simulador)
Ver `AIDocs/web.md`, apartado 5: sueldo con y sin impuestos, privado con seguro o pagando cada visita, y pago privado en cuotas mensuales.

### Limitaciones de sanidad
- Madrid: los importes de la memoria económico-financiera son de la **propuesta** de la Orden 1975/2023 (BOCM 30-dic-2023); el BOE/BOCM definitivo puede variar ligeramente. El anexo de pruebas diagnósticas (RM, TAC, analítica, radiografía de Madrid) no se pudo leer (el texto extraído se cortaba); por eso las pruebas públicas son de Navarra.
- **Precio de una noche de hospital privado: no se encontró dato fiable.** Proxy razonable: las tarifas públicas a terceros (Navarra 615 €, País Vasco 1.339 €), que es lo que facturan aseguradoras. El parto privado incluye 2–4 noches y suplemento de habitación individual (+2.000–3.000 €).
- Los importes privados son rangos de comparadores (Selectra/Doctoralia, CuantoMeCuesta) con fuentes poco verificables, incluso con incoherencias entre secciones.
- El gasto agregado no indica el año; si se cruza con población hay que asumir ~2023.

## Educación
Archivos: `educacion_gasto_publico_serie.csv`, `educacion_gasto_por_alumno.csv`, `educacion_precios_familias.csv`.

**Gasto público total**: 71.349 M € en 2024 (4,48 % del PIB; 9,84 % del gasto público); 68.066 M € en 2023.

**Gasto público por alumno (2023, no universitaria)**: España **7.943 €** en centros públicos y 6.851 € contando públicos y concertados. Madrid es la CCAA con menor gasto (6.502 € y 5.534 €); País Vasco el mayor (12.484 € y 8.946 €).
Por nivel (2019, públicos y privados; el único desglose oficial obtenido): infantil 5.264; primaria 5.418; secundaria (ESO/Bachillerato/FP medio) 6.741; FP superior y similar 6.478; universitaria 9.589; total 6.467.

**Lo que paga la gente**
- **Pública (6–16 años)**: enseñanza obligatoria gratuita (norma general; el CSV no la repite como fila). Universidad pública Madrid 2025-26: 16,92 €/crédito en 1.ª matrícula de grado nivel 3 (≈ 1.015 €/curso); rango nacional 680–1.280 €/curso. Máster no habilitante Madrid 45,02 €/crédito.
- **Concertado**: cuota «voluntaria» media 135 €/mes en Madrid (Cataluña 220; País Vasco 99), 2025 (muestra de 101 colegios).
- **Privado Madrid 2026**: infantil 300–850 €/mes; primaria 400–1.000; ESO/Bachillerato 500–1.300; comedor 130–220; derechos de inscripción 500–3.000.
- **Universidad privada**: 5.000–30.000 €/curso (medicina privada 12.900–23.180).
- **FP privada**: 3.000–6.000 €/curso (fuente interesada).

### Limitaciones de educación
- No hay desglose actual por nivel (infantil, primaria, ESO, bachillerato, FP, universidad); el de 2019 es antiguo y mezcla públicos y privados. **Faltan**: coste real por alumno de FP pública, el precio exacto de la matrícula pública de FP, y la tabla de niveles 1 y 2 de experimentalidad en Madrid.
- Una web comparadora daba el precio por crédito de TFG en 2026-27 con Madrid a 18,46–22,49 €; **se descartó** por incoherente con la tabla oficial de Madrid (16,92 €/crédito nivel 3 en 2025-26) y errores internos.
- Los precios privados son rangos de portales (Micole, Bankinter, Adams); varían mucho por zona y colegio.

## Transporte público
Archivos: `transporte_costes.csv`, `transporte_tarifas_madrid_2026.csv`.

**Madrid (Consorcio Regional de Transportes, 2024)**: 1.722,6 M de viajes; gastos 2.743 M €; ingresos tarifarios 526 M €; aportaciones de las administraciones 2.352 M € (Comunidad de Madrid 1.913 M, Ayuntamiento 277 M, Estado 127 M). Coste medio por viaje **1,65 €**: el usuario paga **0,32 €** (≈ 19 %) y las administraciones **1,33 €** (≈ 81 %).
**Coste estimado sin subvención**: 1,65 € por viaje. Un usuario que hace 2 viajes/día × 22 días = 44 viajes/mes costaría ≈ 73 €/mes frente a 32,70 € del abono A (con 40 % de descuento estatal-autonómico) o ≈ 54,50 € sin descuento (precio derivado).
**Resto de España**: tasa de cobertura (ingresos/costes) de 2023 según el OMM: Madrid 20 %, Barcelona 54 %, Asturias 103 %, Camp de Tarragona 12 %, media de 12 áreas 37 % (cociente de totales 35,6 %). Coste por viaje estimado ≈ 1,24 € (poco fiable).
**Tarifas 2026 (Madrid)**: abono 26–64 años zona A 32,70 €, B1 38,20, B2 43,20, B3/C1/C2 49,20; Abono Joven 10 €; mayores de 65 y menores de 14 gratis; bono 10 viajes 7,30 €.

### Limitaciones de transporte
- Solo Madrid tiene coste por viaje oficial detallado. Para el resto de CCAA solo hay ratios de cobertura de 12 áreas de 2023.
- Las cifras de la memoria del CRTM tienen dos bases (ingresos 526,08 M frente a recaudación por venta de títulos 478,23 M); se usa la primera para la cobertura.
- Las tarifas por zona 2026 de E1/E2 (66,30 y 79,00 €) vienen solo de RedTransporte (secundaria). No se obtuvo el precio sin descuento oficial: el del CSV se deriva dividiendo por 0,6 (o 0,5 en el joven) y puede diferir ±0,10 €.
- No se incluyó Renfe Cercanías ni el coste de infraestructuras (el 1,65 € no incluye los títulos propios de Cercanías).
