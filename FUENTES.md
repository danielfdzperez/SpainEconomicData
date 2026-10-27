# Fuentes utilizadas — índice general

Todas las fuentes son públicas y gratuitas. Consulta: **2026-10-21** (01–05) y **2026-10-22** (06–09). Detalle por tabla (URL exacta, cobertura y observaciones): hoja `FUENTES` de cada Excel. Método y patrones de API: `AIDocs/fuentes_y_metodologia.md`.

## Resumen por organismo
| Organismo | Se usó en |
|---|---|
| INE (Tempus3, notas de prensa) | 01, 02, 03, 04, 05 |
| Eurostat | 01, 03 |
| Agencia Tributaria | 02 |
| Seguridad Social / SEPE | 01 |
| Comunidad de Madrid (iEstadis) | 01, 04 |
| Ministerio de Vivienda y Agenda Urbana (SERPAVI) | 04 |
| Idealista (sala de prensa) | 04 |
| Ayuntamiento de Madrid | 05 |
| BOE / Ministerio de Trabajo (SMI) | 02 |
| Prensa (El Debate) y webs de apoyo (contraste del SMI) | 05, 02 |

Base de las URL del INE: `https://servicios.ine.es/wstempus/js/ES/` (`DATOS_TABLA/{id}`, `DATOS_SERIE/{código}`, `TABLAS_OPERACION/{op}`, etc.).

## 01 · Empleo y desempleo
- INE, EPA: series trimestrales 2002–2026T2 (`DATOS_SERIE/{cod}`) y tablas 74999 (paro por sexo, edad y CCAA), 65302 (ocupados), 65332 (parados), 65285 (población), 79325 (ocupados por sector, CNAE-2025). https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/74999
- Eurostat, EU-LFS regional (NUTS2): `lfst_r_lfu3rt`, `lfst_r_lfe2emprt`, `lfst_r_lfp2actrt`. https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/
- Seguridad Social, paro registrado de septiembre 2026: https://revista.seg-social.es/-/el-paro-registrado-aumenta-en-23.587-personas-en-septiembre-y-se-situa-en-2.379.505-la-cifra-mas-baja-en-este-mes-desde-2007
- Comunidad de Madrid (iEstadis), boletín de paro registrado (jun-2026): https://gestiona3.madrid.org/iestadis/gazeta/region/descarga/prc2607not.pdf
- Comunidad de Madrid (iEstadis), boletín de afiliación (ago-2026): https://web.comunidad.madrid/iestadis/gazeta/region/descarga/ass2608not.pdf

## 02 · Salarios
- INE, Encuesta de Estructura Salarial (EES/EAES): tablas 28191 (distribución y CCAA), 28189 y 28201 (edad), 28184 (desigualdad), 28182 (tramos de SMI), 28185 (sector), 28186 (ocupación), 28188 (contrato). https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/28191
- INE, notas de prensa para la moda salarial: https://ine.es/dyngs/Prensa/EAES2024.htm · https://ine.es/dyngs/Prensa/EAES2023.htm · https://ine.es/dyngs/Prensa/EES2022.htm
- Agencia Tributaria, Mercado de trabajo y pensiones en las fuentes tributarias 2024 (centiles): https://sede.agenciatributaria.gob.es/
- Salario Mínimo Interprofesional (RD 126/2026, RD 87/2025, etc.): https://www.notariosyregistradores.com/web/normas/concretas/salario-minimo-interprofesional-2026/
- Contraste del SMI 2018–2025: https://www.skello.es/blog/salario-minimo-interprofesional

## 03 · Coste de la vida
- INE, IPC: series IPC290750 (general España) e IPC294331 (general Madrid); tabla 76136 (grupos, Madrid); series IPC294335…IPC294383. https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290750
- Eurostat, IPC armonizado `prc_hicp_aind` (el grupo CP08 no se pudo descargar por límite de peticiones). https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_aind
- INE, Encuesta de Presupuestos Familiares, tabla 14505. https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/14505
- INE, Encuesta de Condiciones de Vida: tabla 49145 (renta) y 76847 (AROPE). https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/49145
- INE, EES tabla 28191 (salarios para comparar con el IPC).

## 04 · Vivienda y alquiler
- INE: IPV tablas 80270 y 80271; IPVA tabla 59056; IRAV tabla 72975. https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/80270
- Comunidad de Madrid, Boletín trimestral de la vivienda 2T 2026 (datos del Ministerio de Vivienda, INE y Colegios de Arquitectos): https://gestiona3.madrid.org/iestadis/fijas/coyuntu/otros/descarga/btv2t26.pdf
- Ministerio de Vivienda, SERPAVI 2022 por CCAA (PDF): https://cdn.mivau.gob.es/portal-web-mivau/vivienda/serpavi/2024-02-26_tablas_resumen_sistema-estatal-alquiler_ccaa.pdf
- SERPAVI 2011–2024 (xlsx de 67,8 MB, **no descargado**, bloqueado): https://cdn.mivau.gob.es/portal-web-mivau/vivienda/serpavi/2026-03_09_bd_SERPAVI_2011-2024%20-%20DEFINITIVO%20WEB_v2.xlsx · página: https://www.mivau.gob.es/vivienda/alquila-bien-es-tu-derecho/serpavi
- Idealista, sala de prensa (precios de oferta, sep-2026, 12 meses):
  - Alquiler: https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/alquiler/
  - Venta: https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/venta/
  - Madrid provincia: https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/alquiler/madrid-comunidad/madrid-provincia/
  - Madrid ciudad y distritos: https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/alquiler/madrid-comunidad/madrid-provincia/madrid/
  - Páginas por CCAA, provincia y municipio con el mismo patrón (`/{alquiler|venta}/{ccaa}/{provincia}/{municipio}/`).
- INE, EES tabla 28191 (salarios para el esfuerzo de alquiler).

## 05 · Población
- INE, Estadística Continua de Población: tabla 59587 (edad, sexo, nacionalidad, CCAA), 60132 (personas por hogar), tablas 56934/56940/56945 (desde 1971), series ECP320, ECP319, ECP115490, ECP113551. https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/59587
- INE, Indicadores Demográficos Básicos (operación 33; tablas 1448, 1414, 1726, 3198, 1452, 1450, 67222, 67228, 1441): https://servicios.ine.es/wstempus/js/ES/TABLAS_OPERACION/33 · nota de prensa 19-nov-2025: https://www.ine.es/uc/6tBC03TH
- INE, Proyecciones de población 2026–2076 (17-jun-2026): https://www.ine.es/dyngs/Prensa/PROP20262076.pdf
- INE, Proyecciones 2024–2074 (consultada solo para comparar): https://www.ine.es/dyngs/Prensa/PROP20242074.pdf
- El Debate, dato de Madrid en las proyecciones (+14,4 %, 8,2 M en 2041): https://www.eldebate.com/espana/madrid/20260617/ine-estima-comunidad-madrid-superara-82-millones-habitantes-15-anos_429692.html
- Ayuntamiento de Madrid, Padrón, primeros resultados 2026: https://www.madrid.es/UnidadesDescentralizadas/UDCEstadistica/Nuevaweb/Demograf%C3%ADa%20y%20poblaci%C3%B3n/Cifras%20de%20poblaci%C3%B3n/PMH/Avance/Primeros_resultados_2026.pdf

## 06–09 · Impuestos, desempleo/pensiones, servicios públicos y PIB (CSV en `datos_web/`)
Las fuentes con URL, título y tipo (oficial o secundaria) están en **`datos_web/fuentes.csv`** (IDs S01–S48, S99 = cálculo propio). Resumen por organismo: AEAT (algoritmo de retenciones 2026), BOE/Orden PJC/297/2026 (vía resúmenes de mutuas y despachos), Seguridad Social y Ministerio de Trabajo (pensiones), La Moncloa (revalorización 2026), IGAE (COFOG 2024), INE (Contabilidad Nacional 2025, y tabla 69070 de valor añadido por ramas, S48), Eurostat (`nama_10_gdp`), Ministerio de Sanidad (DATOS_SNS), Comunidad de Madrid (precios públicos sanitarios 2023, precios universitarios), Osasunbidea y Osakidetza (tarifas 2025, vía prensa), Consorcio Regional de Transportes de Madrid (memoria 2024) y Observatorio de la Movilidad Metropolitana. Para el **simulador de autónomos y de paro** (S38–S43): UPTA (resolución de cotización 2026 del RETA, tabla de tramos y tipos), AEAT (estimación directa simplificada: 5 % de difícil justificación, límite de 600.000 € de ingresos), Infoautónomos, Asesoratepymes y Taxfii (deducción del 7 % por gastos genéricos en el rendimiento de cotización), Taxdown, Grupo 2000 y VidaCaixa (cese de actividad: 70 %, duración por meses cotizados, 12 meses mínimos). Salvo la AEAT, son fuentes secundarias. Para el **esfuerzo de compra de vivienda** (S44): valor tasado de la vivienda libre del Ministerio de Vivienda, leído en el ICANE (secundaria), y los salarios del INE. Los importes privados vienen de comparadores y portales (Selectra, CuantoMeCuesta, Micole, Bankinter, Adams): orientativos.

## Consultadas pero no utilizadas
- Ayuntamiento de Madrid, población por distrito y barrio (bloqueada para lectura automática): https://datos.madrid.es/egob/catalogo/300557-0-poblacion-distrito-barrio
- INE tabla 79543 (devolvía datos municipales, descartada).
- Cifras erróneas de un boletín de la Comunidad de Madrid (paro nacional 19.517; extranjeros de Madrid 1.345): excluidas.
- Web comparadora con el precio por crédito de TFG 2026-27 por CCAA (Madrid 18,46–22,49 €): descartada por incoherente con la tabla oficial de Madrid y errores internos.
- Páginas del Ministerio de Educación bloqueadas para lectura automática (`robots`): se usó el PDF del INEE de 2019 para el gasto por alumno.
- BOCM de 30-dic-2023 completo (127 págs.): el texto extraído se corta en el anexo de GRD; las tarifas de consultas y urgencias de Madrid salen de la memoria económico-financiera (propuesta).

